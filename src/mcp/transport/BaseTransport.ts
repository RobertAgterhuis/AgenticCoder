/**
 * Base Transport
 * 
 * Abstract base class for MCP transport implementations
 * @module mcp/transport/BaseTransport
 */

import { EventEmitter } from 'events';
import { 
  TransportType, 
  ServerStatus, 
  ToolCallRequest, 
  ToolCallResponse,
  MCPServerDefinition,
  MCPToolInfo,
} from '../types';
import { Logger, createLogger } from '../utils/Logger';

/**
 * Transport events interface
 */
export interface TransportEvents {
  connected: () => void;
  disconnected: (reason: string) => void;
  error: (error: Error) => void;
  message: (message: unknown) => void;
  statusChange: (status: ServerStatus, previousStatus: ServerStatus) => void;
}

/**
 * Abstract base transport for MCP communication
 */
export abstract class BaseTransport extends EventEmitter {
  protected serverDefinition: MCPServerDefinition;
  protected status: ServerStatus = 'disconnected';
  protected logger: Logger;
  protected connectionId: string;
  protected connectedAt: Date | null = null;

  constructor(serverDefinition: MCPServerDefinition) {
    super();
    this.serverDefinition = serverDefinition;
    this.logger = createLogger(`transport:${serverDefinition.id}`);
    this.connectionId = this.generateConnectionId();
  }

  /**
   * Get transport type
   */
  abstract get type(): TransportType;

  /**
   * Connect to the MCP server
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the MCP server
   */
  abstract disconnect(): Promise<void>;

  /**
   * Send a tool call request
   */
  abstract callTool<T = unknown>(request: ToolCallRequest): Promise<ToolCallResponse<T>>;

  /**
   * List available tools
   */
  abstract listTools(): Promise<MCPToolInfo[]>;

  /**
   * Ping the server (health check)
   */
  abstract ping(): Promise<number>;

  /**
   * Check if transport is connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Get current status
   */
  getStatus(): ServerStatus {
    return this.status;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return this.serverDefinition.id;
  }

  /**
   * Get server definition
   */
  getServerDefinition(): MCPServerDefinition {
    return this.serverDefinition;
  }

  /**
   * Get connection ID
   */
  getConnectionId(): string {
    return this.connectionId;
  }

  /**
   * Get connection uptime in milliseconds
   */
  getUptime(): number {
    if (!this.connectedAt) {
      return 0;
    }
    return Date.now() - this.connectedAt.getTime();
  }

  /**
   * Set status and emit event
   */
  protected setStatus(status: ServerStatus, reason?: string): void {
    const previousStatus = this.status;
    
    if (status === previousStatus) {
      return;
    }

    this.status = status;
    this.emit('statusChange', status, previousStatus);

    switch (status) {
      case 'connected':
        this.connectedAt = new Date();
        this.emit('connected');
        this.logger.info('Connected to server');
        break;
      
      case 'disconnected':
        this.connectedAt = null;
        this.emit('disconnected', reason || 'Unknown');
        this.logger.info(`Disconnected from server: ${reason || 'Unknown'}`);
        break;
      
      case 'connecting':
        this.logger.debug('Connecting to server...');
        break;
      
      case 'error':
        this.logger.error(`Transport error: ${reason}`);
        this.emit('error', new Error(reason || 'Unknown error'));
        break;
      
      case 'degraded':
        this.logger.warn(`Server degraded: ${reason}`);
        break;
    }
  }

  /**
   * Generate unique connection ID
   */
  protected generateConnectionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 11);
    return `${this.serverDefinition.id}-${timestamp}-${random}`;
  }

  /**
   * Generate correlation ID for requests
   */
  protected generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.connectionId}-${timestamp}-${random}`;
  }

  /**
   * Check if error code is retryable
   */
  protected isRetryableErrorCode(code: number | string): boolean {
    const retryableCodes = [
      -32603, // Internal error
      -32000, // Server error
      -32001, // Server not ready
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ECONNRESET',
    ];
    return retryableCodes.includes(code);
  }

  /**
   * Create a timeout promise
   */
  protected createTimeout(ms: number, operation: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation '${operation}' timed out after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Race a promise against a timeout
   */
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
  ): Promise<T> {
    return Promise.race([
      promise,
      this.createTimeout(timeoutMs, operation),
    ]);
  }
}

/**
 * Type guard for TransportEvents
 */
export function isTransportEvent(event: string): event is keyof TransportEvents {
  return ['connected', 'disconnected', 'error', 'message', 'statusChange'].includes(event);
}
