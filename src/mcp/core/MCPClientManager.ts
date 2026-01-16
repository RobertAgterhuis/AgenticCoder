/**
 * MCP Client Manager
 * 
 * Orchestrates MCP server connections and lifecycle management
 * @module mcp/core/MCPClientManager
 */

import { EventEmitter } from 'events';
import { MCPConnectionPool, createConnectionPool, PoolStats } from './MCPConnectionPool';
import { BaseTransport } from '../transport/BaseTransport';
import {
  MCPServerDefinition,
  ToolCallRequest,
  ToolCallResponse,
  MCPToolDefinition,
  MCPToolInfo,
  ServerStatus,
  ConnectionPoolConfig,
} from '../types';
import {
  MCPError,
  ServerNotFoundError,
  ToolNotFoundError,
  TimeoutError,
  CircuitBreakerOpenError,
  isRetryableError,
} from '../errors/MCPError';
import { Logger, createLogger } from '../utils/Logger';
import { CircuitBreaker, createCircuitBreaker } from '../health/CircuitBreaker';
import { RetryPolicy, createRetryPolicy } from '../health/RetryPolicy';

/**
 * Client manager configuration
 */
export interface MCPClientManagerConfig {
  pool?: Partial<ConnectionPoolConfig>;
  defaultTimeoutMs?: number;
  enableCircuitBreaker?: boolean;
  enableRetry?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MCPClientManagerConfig = {
  defaultTimeoutMs: 30000,
  enableCircuitBreaker: true,
  enableRetry: true,
};

/**
 * Server metadata
 */
interface ServerMeta {
  definition: MCPServerDefinition;
  tools: MCPToolInfo[];
  circuitBreaker?: CircuitBreaker;
  retryPolicy?: RetryPolicy;
  lastToolRefresh: Date | null;
}

/**
 * MCP Client Manager
 * 
 * Central manager for all MCP server connections
 */
export class MCPClientManager extends EventEmitter {
  private config: MCPClientManagerConfig;
  private pool: MCPConnectionPool;
  private servers: Map<string, ServerMeta> = new Map();
  private logger: Logger;
  private initialized: boolean = false;

  constructor(config?: Partial<MCPClientManagerConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pool = createConnectionPool(this.config.pool);
    this.logger = createLogger('MCPClientManager');
  }

  /**
   * Initialize the client manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Client manager already initialized');
      return;
    }

    this.logger.info('Initializing MCP Client Manager');
    await this.pool.initialize();

    // Setup pool event handlers
    this.pool.on('connectionCreated', (serverId) => {
      this.emit('connectionCreated', serverId);
    });

    this.pool.on('connectionClosed', (serverId) => {
      this.emit('connectionClosed', serverId);
    });

    this.pool.on('connectionError', (serverId, error) => {
      this.emit('connectionError', serverId, error);
    });

    this.initialized = true;
    this.emit('initialized');
    this.logger.info('MCP Client Manager initialized');
  }

  /**
   * Register an MCP server
   */
  async registerServer(definition: MCPServerDefinition): Promise<void> {
    this.ensureInitialized();

    if (this.servers.has(definition.id)) {
      this.logger.warn(`Server ${definition.id} already registered, updating`);
      await this.unregisterServer(definition.id);
    }

    this.logger.info(`Registering server: ${definition.id}`, {
      transport: definition.transport,
      category: definition.category,
    });

    // Create server metadata
    const meta: ServerMeta = {
      definition,
      tools: [],
      lastToolRefresh: null,
    };

    // Setup circuit breaker if enabled
    if (this.config.enableCircuitBreaker) {
      meta.circuitBreaker = createCircuitBreaker({
        failureThreshold: 5,
        resetTimeoutMs: 30000,
        halfOpenMaxCalls: 3,
      });
    }

    // Setup retry policy if enabled
    if (this.config.enableRetry) {
      meta.retryPolicy = createRetryPolicy({
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      });
    }

    this.servers.set(definition.id, meta);
    this.pool.registerServer(definition);

    this.emit('serverRegistered', definition.id);
  }

  /**
   * Unregister an MCP server
   */
  async unregisterServer(serverId: string): Promise<void> {
    this.ensureInitialized();

    if (!this.servers.has(serverId)) {
      return;
    }

    this.logger.info(`Unregistering server: ${serverId}`);
    await this.pool.unregisterServer(serverId);
    this.servers.delete(serverId);

    this.emit('serverUnregistered', serverId);
  }

  /**
   * Get available tools for a server
   */
  async getTools(serverId: string, forceRefresh: boolean = false): Promise<MCPToolInfo[]> {
    this.ensureInitialized();

    const meta = this.servers.get(serverId);
    if (!meta) {
      throw new ServerNotFoundError(serverId);
    }

    // Return cached tools if available and not forcing refresh
    if (!forceRefresh && meta.tools.length > 0 && meta.lastToolRefresh) {
      return meta.tools;
    }

    // Refresh tools from server
    const transport = await this.pool.acquire(serverId);
    try {
      const tools = await transport.listTools();
      meta.tools = tools;
      meta.lastToolRefresh = new Date();
      return tools;
    } finally {
      this.pool.release(serverId, transport);
    }
  }

  /**
   * Get all available tools across all servers
   */
  async getAllTools(): Promise<Map<string, MCPToolInfo[]>> {
    const result = new Map<string, MCPToolInfo[]>();
    
    for (const serverId of this.servers.keys()) {
      try {
        const tools = await this.getTools(serverId);
        result.set(serverId, tools);
      } catch (error) {
        this.logger.warn(`Failed to get tools from ${serverId}`, {
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(request: ToolCallRequest): Promise<ToolCallResponse> {
    this.ensureInitialized();

    const startTime = Date.now();
    const meta = this.servers.get(request.serverId);

    if (!meta) {
      throw new ServerNotFoundError(request.serverId);
    }

    // Check circuit breaker
    if (meta.circuitBreaker && !meta.circuitBreaker.canExecute()) {
      const resetTime = new Date(Date.now() + 30000); // Default reset time
      throw new CircuitBreakerOpenError(request.serverId, resetTime);
    }

    // Execute with retry policy
    const execute = async (): Promise<ToolCallResponse> => {
      const transport = await this.pool.acquire(request.serverId);
      
      try {
        const result = await this.executeWithTimeout(
          () => transport.callTool(request),
          request.timeout || this.config.defaultTimeoutMs!
        );

        // Record success
        if (meta.circuitBreaker) {
          meta.circuitBreaker.recordSuccess();
        }

        const latency = Date.now() - startTime;
        this.pool.recordLatency(latency);

        this.emit('toolCallSuccess', {
          serverId: request.serverId,
          toolName: request.toolName,
          latencyMs: latency,
        });

        return {
          success: true,
          result,
          serverId: request.serverId,
          toolName: request.toolName,
          executionTimeMs: latency,
        };
      } catch (error) {
        // Record failure
        if (meta.circuitBreaker) {
          meta.circuitBreaker.recordFailure();
        }
        this.pool.recordError();
        throw error;
      } finally {
        this.pool.release(request.serverId, transport);
      }
    };

    // Apply retry policy if available
    if (meta.retryPolicy) {
      return meta.retryPolicy.execute(execute, (error) => {
        return isRetryableError(error);
      });
    }

    return execute();
  }

  /**
   * Call a tool by finding the appropriate server
   */
  async callToolByName(
    toolName: string,
    args: Record<string, unknown>,
    timeout?: number
  ): Promise<ToolCallResponse> {
    // Find server with this tool
    const serverId = await this.findServerWithTool(toolName);
    if (!serverId) {
      throw new ToolNotFoundError('unknown', toolName);
    }

    return this.callTool({
      serverId,
      toolName,
      arguments: args,
      timeout,
    });
  }

  /**
   * Find the server that provides a specific tool
   */
  async findServerWithTool(toolName: string): Promise<string | null> {
    for (const [serverId, meta] of this.servers.entries()) {
      // Ensure tools are loaded
      if (meta.tools.length === 0) {
        try {
          await this.getTools(serverId);
        } catch {
          continue;
        }
      }

      if (meta.tools.some(t => t.name === toolName)) {
        return serverId;
      }
    }
    return null;
  }

  /**
   * Get server status
   */
  getServerStatus(serverId: string): ServerStatus {
    if (!this.servers.has(serverId)) {
      return 'disconnected';
    }

    const meta = this.servers.get(serverId)!;
    
    // Check circuit breaker state
    if (meta.circuitBreaker) {
      const state = meta.circuitBreaker.getState();
      if (state === 'open') {
        return 'error';
      }
      if (state === 'half-open') {
        return 'degraded';
      }
    }

    return this.pool.getServerStatus(serverId);
  }

  /**
   * Get all registered server IDs
   */
  getServerIds(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * Get server definition
   */
  getServerDefinition(serverId: string): MCPServerDefinition | undefined {
    return this.servers.get(serverId)?.definition;
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): PoolStats {
    return this.pool.getStats();
  }

  /**
   * Get total request count
   */
  getTotalRequests(): number {
    return this.pool.getTotalRequests();
  }

  /**
   * Get error rate
   */
  getErrorRate(): number {
    return this.pool.getErrorRate();
  }

  /**
   * Get average latency
   */
  getAverageLatency(): number {
    return this.pool.getAverageLatency();
  }

  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown the client manager
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down MCP Client Manager');
    
    await this.pool.close();
    this.servers.clear();
    this.initialized = false;

    this.emit('shutdown');
    this.logger.info('MCP Client Manager shutdown complete');
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new TimeoutError('tool call', timeoutMs));
      }, timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Ensure manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new MCPError(
        'MCP_NOT_INITIALIZED',
        'MCPClientManager not initialized. Call initialize() first.'
      );
    }
  }
}

/**
 * Create a client manager
 */
export function createClientManager(config?: Partial<MCPClientManagerConfig>): MCPClientManager {
  return new MCPClientManager(config);
}
