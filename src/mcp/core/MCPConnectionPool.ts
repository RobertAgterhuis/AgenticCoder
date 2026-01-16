/**
 * MCP Connection Pool
 * 
 * Manages connections to MCP servers with pooling support
 * @module mcp/core/MCPConnectionPool
 */

import { EventEmitter } from 'events';
import { BaseTransport } from '../transport/BaseTransport';
import { TransportFactory } from '../transport/TransportFactory';
import { 
  MCPServerDefinition, 
  ConnectionPoolConfig,
  ServerStatus,
  DEFAULT_CONNECTION_POOL_CONFIG,
} from '../types';
import { 
  ConnectionError, 
  ResourceExhaustedError,
  ServerNotFoundError,
} from '../errors/MCPError';
import { Logger, createLogger } from '../utils/Logger';

/**
 * Pooled connection wrapper
 */
interface PooledConnection {
  transport: BaseTransport;
  createdAt: Date;
  lastUsedAt: Date;
  inUse: boolean;
  useCount: number;
}

/**
 * Server pool entry
 */
interface ServerPool {
  serverId: string;
  definition: MCPServerDefinition;
  connections: PooledConnection[];
  waitQueue: Array<{
    resolve: (conn: BaseTransport) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  active: number;
  idle: number;
  total: number;
  waiting: number;
  servers: number;
}

/**
 * MCP Connection Pool
 */
export class MCPConnectionPool extends EventEmitter {
  private config: ConnectionPoolConfig;
  private pools: Map<string, ServerPool> = new Map();
  private logger: Logger;
  private closed: boolean = false;
  private idleCheckInterval: NodeJS.Timeout | null = null;
  
  // Metrics
  private totalRequests: number = 0;
  private totalErrors: number = 0;
  private latencies: number[] = [];
  private maxLatencySamples: number = 1000;

  constructor(config?: Partial<ConnectionPoolConfig>) {
    super();
    this.config = { ...DEFAULT_CONNECTION_POOL_CONFIG, ...config };
    this.logger = createLogger('MCPConnectionPool');
  }

  /**
   * Initialize the pool
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing connection pool', {
      maxConnections: this.config.maxConnections,
      idleTimeout: this.config.idleTimeoutMs,
    });

    // Start idle connection cleanup
    this.idleCheckInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 30000);

    this.closed = false;
  }

  /**
   * Register a server with the pool
   */
  registerServer(definition: MCPServerDefinition): void {
    if (this.pools.has(definition.id)) {
      this.logger.warn(`Server ${definition.id} already registered, updating definition`);
    }

    this.pools.set(definition.id, {
      serverId: definition.id,
      definition,
      connections: [],
      waitQueue: [],
    });

    this.logger.info(`Registered server: ${definition.id}`);
    this.emit('serverRegistered', definition.id);
  }

  /**
   * Unregister a server from the pool
   */
  async unregisterServer(serverId: string): Promise<void> {
    const pool = this.pools.get(serverId);
    if (!pool) {
      return;
    }

    // Close all connections
    for (const conn of pool.connections) {
      try {
        await conn.transport.disconnect();
      } catch (error) {
        this.logger.warn(`Error disconnecting from ${serverId}`, {
          error: (error as Error).message,
        });
      }
    }

    // Reject all waiting requests
    for (const waiter of pool.waitQueue) {
      clearTimeout(waiter.timeout);
      waiter.reject(new ServerNotFoundError(serverId));
    }

    this.pools.delete(serverId);
    this.logger.info(`Unregistered server: ${serverId}`);
    this.emit('serverUnregistered', serverId);
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(serverId: string): Promise<BaseTransport> {
    if (this.closed) {
      throw new ConnectionError(serverId, 'Connection pool is closed');
    }

    const pool = this.pools.get(serverId);
    if (!pool) {
      throw new ServerNotFoundError(serverId);
    }

    this.totalRequests++;

    // Try to get an idle connection
    const idleConn = pool.connections.find(c => !c.inUse && c.transport.isConnected());
    if (idleConn) {
      idleConn.inUse = true;
      idleConn.lastUsedAt = new Date();
      idleConn.useCount++;
      this.logger.debug(`Reusing connection for ${serverId}`);
      return idleConn.transport;
    }

    // Try to create a new connection
    if (pool.connections.length < this.config.maxConnections) {
      return this.createConnection(pool);
    }

    // Wait for a connection to become available
    return this.waitForConnection(pool);
  }

  /**
   * Release a connection back to the pool
   */
  release(serverId: string, transport: BaseTransport): void {
    const pool = this.pools.get(serverId);
    if (!pool) {
      return;
    }

    const conn = pool.connections.find(c => c.transport === transport);
    if (!conn) {
      return;
    }

    conn.inUse = false;
    conn.lastUsedAt = new Date();

    // Check if there are waiting requests
    const waiter = pool.waitQueue.shift();
    if (waiter) {
      clearTimeout(waiter.timeout);
      conn.inUse = true;
      conn.useCount++;
      waiter.resolve(transport);
    }

    this.logger.debug(`Released connection for ${serverId}`);
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    let active = 0;
    let idle = 0;
    let total = 0;
    let waiting = 0;

    for (const pool of this.pools.values()) {
      for (const conn of pool.connections) {
        total++;
        if (conn.inUse) {
          active++;
        } else {
          idle++;
        }
      }
      waiting += pool.waitQueue.length;
    }

    return {
      active,
      idle,
      total,
      waiting,
      servers: this.pools.size,
    };
  }

  /**
   * Get total requests
   */
  getTotalRequests(): number {
    return this.totalRequests;
  }

  /**
   * Get error rate
   */
  getErrorRate(): number {
    if (this.totalRequests === 0) return 0;
    return this.totalErrors / this.totalRequests;
  }

  /**
   * Get average latency
   */
  getAverageLatency(): number {
    if (this.latencies.length === 0) return 0;
    return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  /**
   * Record a latency sample
   */
  recordLatency(latencyMs: number): void {
    this.latencies.push(latencyMs);
    if (this.latencies.length > this.maxLatencySamples) {
      this.latencies.shift();
    }
  }

  /**
   * Record an error
   */
  recordError(): void {
    this.totalErrors++;
  }

  /**
   * Get server status
   */
  getServerStatus(serverId: string): ServerStatus {
    const pool = this.pools.get(serverId);
    if (!pool) {
      return 'disconnected';
    }

    const connectedCount = pool.connections.filter(c => c.transport.isConnected()).length;
    if (connectedCount === 0) {
      return 'disconnected';
    }

    const healthyCount = pool.connections.filter(
      c => c.transport.getStatus() === 'connected'
    ).length;

    if (healthyCount === connectedCount) {
      return 'connected';
    } else if (healthyCount > 0) {
      return 'degraded';
    }

    return 'error';
  }

  /**
   * Check if server is registered
   */
  hasServer(serverId: string): boolean {
    return this.pools.has(serverId);
  }

  /**
   * Get all registered server IDs
   */
  getServerIds(): string[] {
    return Array.from(this.pools.keys());
  }

  /**
   * Close the pool
   */
  async close(): Promise<void> {
    this.logger.info('Closing connection pool');
    this.closed = true;

    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }

    // Close all pools
    for (const serverId of this.pools.keys()) {
      await this.unregisterServer(serverId);
    }

    this.emit('closed');
  }

  /**
   * Create a new connection
   */
  private async createConnection(pool: ServerPool): Promise<BaseTransport> {
    this.logger.debug(`Creating new connection for ${pool.serverId}`);

    const transport = TransportFactory.create(pool.definition);
    
    try {
      await transport.connect();

      const pooledConn: PooledConnection = {
        transport,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        inUse: true,
        useCount: 1,
      };

      pool.connections.push(pooledConn);

      // Setup event handlers
      transport.on('disconnected', () => {
        this.handleDisconnect(pool, pooledConn);
      });

      transport.on('error', (error) => {
        this.handleError(pool, pooledConn, error);
      });

      this.logger.info(`Created connection for ${pool.serverId}`, {
        totalConnections: pool.connections.length,
      });

      this.emit('connectionCreated', pool.serverId);
      return transport;
    } catch (error) {
      this.totalErrors++;
      throw new ConnectionError(
        pool.serverId,
        `Failed to create connection: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(pool: ServerPool): Promise<BaseTransport> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = pool.waitQueue.findIndex(w => w.timeout === timeout);
        if (index !== -1) {
          pool.waitQueue.splice(index, 1);
        }
        reject(new ResourceExhaustedError(
          'connection',
          `Timeout waiting for connection to ${pool.serverId}`
        ));
      }, this.config.acquireTimeoutMs);

      pool.waitQueue.push({ resolve, reject, timeout });
      
      this.logger.debug(`Waiting for connection to ${pool.serverId}`, {
        queueLength: pool.waitQueue.length,
      });
    });
  }

  /**
   * Handle connection disconnect
   */
  private handleDisconnect(pool: ServerPool, conn: PooledConnection): void {
    this.logger.warn(`Connection disconnected: ${pool.serverId}`);
    
    // Remove from pool
    const index = pool.connections.indexOf(conn);
    if (index !== -1) {
      pool.connections.splice(index, 1);
    }

    this.emit('connectionClosed', pool.serverId);
  }

  /**
   * Handle connection error
   */
  private handleError(pool: ServerPool, conn: PooledConnection, error: Error): void {
    this.logger.error(`Connection error: ${pool.serverId}`, {
      error: error.message,
    });
    this.totalErrors++;
    this.emit('connectionError', pool.serverId, error);
  }

  /**
   * Cleanup idle connections
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();

    for (const pool of this.pools.values()) {
      const toRemove: PooledConnection[] = [];

      for (const conn of pool.connections) {
        if (
          !conn.inUse &&
          pool.connections.length > this.config.minConnections &&
          now - conn.lastUsedAt.getTime() > this.config.idleTimeoutMs
        ) {
          toRemove.push(conn);
        }
      }

      for (const conn of toRemove) {
        this.logger.debug(`Closing idle connection for ${pool.serverId}`);
        conn.transport.disconnect().catch(() => {});
        
        const index = pool.connections.indexOf(conn);
        if (index !== -1) {
          pool.connections.splice(index, 1);
        }
      }
    }
  }
}

/**
 * Create a connection pool
 */
export function createConnectionPool(config?: Partial<ConnectionPoolConfig>): MCPConnectionPool {
  return new MCPConnectionPool(config);
}
