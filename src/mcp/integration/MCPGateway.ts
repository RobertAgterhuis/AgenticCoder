/**
 * MCP Gateway
 * 
 * Unified entry point for all MCP operations
 * @module mcp/integration/MCPGateway
 */

import { EventEmitter } from 'events';
import { MCPClientManager, createClientManager } from '../core/MCPClientManager';
import { MCPServerRegistry, createServerRegistry, DEFAULT_SERVERS } from '../core/MCPServerRegistry';
import { MCPServiceRegistry, createServiceRegistry, ToolCapability } from '../core/MCPServiceRegistry';
import { HealthMonitor, createHealthMonitor, AggregatedHealth } from '../health/HealthMonitor';
import { MCPServerDefinition, ToolCallResponse, ServerStatus } from '../types';
import { Logger, createLogger } from '../utils/Logger';

/**
 * Gateway configuration
 */
export interface MCPGatewayConfig {
  /** Enable default MCP servers */
  enableDefaultServers?: boolean;
  /** Auto-initialize on creation */
  autoInitialize?: boolean;
  /** Enable health monitoring */
  enableHealthMonitor?: boolean;
  /** Health check interval in ms */
  healthCheckInterval?: number;
  /** Custom server definitions */
  servers?: MCPServerDefinition[];
  /** Default timeout for tool calls */
  defaultTimeout?: number;
}

/**
 * Default gateway configuration
 */
const DEFAULT_GATEWAY_CONFIG: MCPGatewayConfig = {
  enableDefaultServers: true,
  autoInitialize: false,
  enableHealthMonitor: true,
  healthCheckInterval: 30000,
  defaultTimeout: 30000,
};

/**
 * MCP Gateway
 * 
 * Provides a unified interface for all MCP operations
 */
export class MCPGateway extends EventEmitter {
  private config: MCPGatewayConfig;
  private clientManager: MCPClientManager;
  private serverRegistry: MCPServerRegistry;
  private serviceRegistry: MCPServiceRegistry;
  private healthMonitor: HealthMonitor;
  private logger: Logger;
  private initialized: boolean = false;

  constructor(config?: Partial<MCPGatewayConfig>) {
    super();
    this.config = { ...DEFAULT_GATEWAY_CONFIG, ...config };
    this.logger = createLogger('MCPGateway');

    // Initialize components
    this.serverRegistry = createServerRegistry();
    this.clientManager = createClientManager({
      defaultTimeoutMs: this.config.defaultTimeout,
    });
    this.serviceRegistry = createServiceRegistry(this.clientManager, this.serverRegistry);
    this.healthMonitor = createHealthMonitor(this.clientManager, {
      intervalMs: this.config.healthCheckInterval,
    });

    // Setup event forwarding
    this.setupEventForwarding();
  }

  /**
   * Initialize the gateway
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Gateway already initialized');
      return;
    }

    this.logger.info('Initializing MCP Gateway');

    // Register default servers if enabled
    if (this.config.enableDefaultServers) {
      for (const server of DEFAULT_SERVERS) {
        this.serverRegistry.register(server);
      }
    }

    // Register custom servers
    if (this.config.servers) {
      for (const server of this.config.servers) {
        this.serverRegistry.register(server);
      }
    }

    // Initialize client manager
    await this.clientManager.initialize();

    // Register enabled servers with client manager
    for (const server of this.serverRegistry.getEnabled()) {
      try {
        await this.clientManager.registerServer(server);
        this.healthMonitor.registerServer(server.id);
      } catch (error) {
        this.logger.warn(`Failed to register server: ${server.id}`, {
          error: (error as Error).message,
        });
      }
    }

    // Initialize service registry
    await this.serviceRegistry.initialize();

    // Start health monitoring if enabled
    if (this.config.enableHealthMonitor) {
      this.healthMonitor.start();
    }

    this.initialized = true;
    this.emit('initialized');
    this.logger.info('MCP Gateway initialized');
  }

  /**
   * Call a tool by name
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
    options?: {
      timeout?: number;
      serverId?: string;
    }
  ): Promise<ToolCallResponse> {
    this.ensureInitialized();

    if (options?.serverId) {
      return this.clientManager.callTool({
        serverId: options.serverId,
        toolName,
        arguments: args,
        timeout: options.timeout || this.config.defaultTimeout,
      });
    }

    return this.clientManager.callToolByName(
      toolName,
      args,
      options?.timeout || this.config.defaultTimeout
    );
  }

  /**
   * Get available tools
   */
  async getTools(serverId?: string): Promise<ToolCapability[]> {
    this.ensureInitialized();

    if (serverId) {
      const tools = await this.clientManager.getTools(serverId);
      const serverDef = this.serverRegistry.get(serverId);
      
      return tools.map(t => ({
        name: t.name,
        description: t.description || '',
        serverId,
        serverName: serverDef.name,
        category: serverDef.category || 'utility',
        inputSchema: t.inputSchema,
      }));
    }

    return this.serviceRegistry.getAllTools();
  }

  /**
   * Find tools matching a pattern
   */
  findTools(pattern: string | RegExp): ToolCapability[] {
    this.ensureInitialized();
    return this.serviceRegistry.findTools(pattern);
  }

  /**
   * Register a server
   */
  async registerServer(definition: MCPServerDefinition): Promise<void> {
    this.serverRegistry.register(definition);
    
    if (definition.enabled && this.initialized) {
      await this.clientManager.registerServer(definition);
      this.healthMonitor.registerServer(definition.id);
    }
  }

  /**
   * Unregister a server
   */
  async unregisterServer(serverId: string): Promise<void> {
    if (this.initialized) {
      await this.clientManager.unregisterServer(serverId);
      this.healthMonitor.unregisterServer(serverId);
    }
    this.serverRegistry.unregister(serverId);
  }

  /**
   * Enable a server
   */
  async enableServer(serverId: string): Promise<void> {
    this.serverRegistry.enable(serverId);
    
    if (this.initialized) {
      const server = this.serverRegistry.get(serverId);
      await this.clientManager.registerServer(server);
      this.healthMonitor.registerServer(serverId);
    }
  }

  /**
   * Disable a server
   */
  async disableServer(serverId: string): Promise<void> {
    this.serverRegistry.disable(serverId);
    
    if (this.initialized) {
      await this.clientManager.unregisterServer(serverId);
      this.healthMonitor.unregisterServer(serverId);
    }
  }

  /**
   * Get server status
   */
  getServerStatus(serverId: string): ServerStatus {
    return this.clientManager.getServerStatus(serverId);
  }

  /**
   * Get all server IDs
   */
  getServerIds(): string[] {
    return this.serverRegistry.getServerIds();
  }

  /**
   * Get server definition
   */
  getServerDefinition(serverId: string): MCPServerDefinition | undefined {
    return this.serverRegistry.getOrNull(serverId);
  }

  /**
   * Get health status
   */
  getHealth(): AggregatedHealth {
    return this.healthMonitor.getAggregatedHealth();
  }

  /**
   * Get healthy servers
   */
  getHealthyServers(): string[] {
    return this.healthMonitor.getHealthyServers();
  }

  /**
   * Check if server is healthy
   */
  isServerHealthy(serverId: string): boolean {
    return this.healthMonitor.isServerHealthy(serverId);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalServers: number;
    enabledServers: number;
    totalTools: number;
    totalRequests: number;
    errorRate: number;
    averageLatency: number;
  } {
    const registryStats = this.serverRegistry.getStats();
    const poolStats = this.clientManager.getPoolStats();

    return {
      totalServers: registryStats.total,
      enabledServers: registryStats.enabled,
      totalTools: this.serviceRegistry.getAllTools().length,
      totalRequests: this.clientManager.getTotalRequests(),
      errorRate: this.clientManager.getErrorRate(),
      averageLatency: this.clientManager.getAverageLatency(),
    };
  }

  /**
   * Check if gateway is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get client manager (for advanced usage)
   */
  getClientManager(): MCPClientManager {
    return this.clientManager;
  }

  /**
   * Get server registry (for advanced usage)
   */
  getServerRegistry(): MCPServerRegistry {
    return this.serverRegistry;
  }

  /**
   * Get service registry (for advanced usage)
   */
  getServiceRegistry(): MCPServiceRegistry {
    return this.serviceRegistry;
  }

  /**
   * Get health monitor (for advanced usage)
   */
  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  /**
   * Shutdown the gateway
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down MCP Gateway');

    this.healthMonitor.stop();
    await this.serviceRegistry.shutdown();
    await this.clientManager.shutdown();

    this.initialized = false;
    this.emit('shutdown');
    this.logger.info('MCP Gateway shutdown complete');
  }

  /**
   * Setup event forwarding from components
   */
  private setupEventForwarding(): void {
    // Forward client manager events
    this.clientManager.on('connectionCreated', (serverId) => {
      this.emit('serverConnected', serverId);
    });

    this.clientManager.on('connectionClosed', (serverId) => {
      this.emit('serverDisconnected', serverId);
    });

    this.clientManager.on('connectionError', (serverId, error) => {
      this.emit('serverError', serverId, error);
    });

    this.clientManager.on('toolCallSuccess', (info) => {
      this.emit('toolCallSuccess', info);
    });

    // Forward health monitor events
    this.healthMonitor.on('healthCheck', (result) => {
      this.emit('healthCheck', result);
    });

    this.healthMonitor.on('unhealthy', (serverId, result) => {
      this.emit('serverUnhealthy', serverId, result);
    });

    // Forward service registry events
    this.serviceRegistry.on('toolIndexRefreshed', () => {
      this.emit('toolsRefreshed');
    });
  }

  /**
   * Ensure gateway is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('MCPGateway not initialized. Call initialize() first.');
    }
  }
}

/**
 * Create an MCP Gateway
 */
export function createMCPGateway(config?: Partial<MCPGatewayConfig>): MCPGateway {
  return new MCPGateway(config);
}

/**
 * Create and initialize an MCP Gateway
 */
export async function initializeMCPGateway(config?: Partial<MCPGatewayConfig>): Promise<MCPGateway> {
  const gateway = createMCPGateway(config);
  await gateway.initialize();
  return gateway;
}
