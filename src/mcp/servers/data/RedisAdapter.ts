/**
 * Redis MCP Server Adapter
 * 
 * Provides Redis cache operations via MCP
 * @module mcp/servers/data/RedisAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * Redis adapter configuration
 */
export interface RedisAdapterConfig extends ServerAdapterConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

/**
 * Redis info
 */
export interface RedisInfo {
  version: string;
  mode: string;
  connectedClients: number;
  usedMemory: number;
  totalKeys: number;
}

/**
 * Redis MCP Server Adapter
 */
export class RedisAdapter extends BaseServerAdapter {
  private connectionUrl: string;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<RedisAdapterConfig>
  ) {
    super(clientManager, config);
    
    if (config?.url) {
      this.connectionUrl = config.url;
    } else {
      const host = config?.host || 'localhost';
      const port = config?.port || 6379;
      const password = config?.password;
      const db = config?.db || 0;
      
      this.connectionUrl = password
        ? `redis://:${password}@${host}:${port}/${db}`
        : `redis://${host}:${port}/${db}`;
    }
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'redis';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'redis',
      name: 'Redis Server',
      description: 'Redis cache operations',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic/redis-mcp-server'],
      category: 'data',
      enabled: true,
      tags: ['data', 'redis', 'cache'],
      env: {
        REDIS_URL: this.connectionUrl,
      },
    };
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    const response = await this.callTool('get', { key });
    
    if (!response.success) {
      throw new Error(`Failed to get value: ${response.error?.message}`);
    }

    return response.result as string | null;
  }

  /**
   * Set a value with optional expiration
   */
  async set(key: string, value: string, options?: {
    ex?: number;  // Seconds
    px?: number;  // Milliseconds
    nx?: boolean; // Only set if not exists
    xx?: boolean; // Only set if exists
  }): Promise<boolean> {
    const response = await this.callTool('set', {
      key,
      value,
      ex: options?.ex,
      px: options?.px,
      nx: options?.nx,
      xx: options?.xx,
    });
    
    if (!response.success) {
      throw new Error(`Failed to set value: ${response.error?.message}`);
    }

    return response.result as boolean;
  }

  /**
   * Delete keys
   */
  async del(...keys: string[]): Promise<number> {
    const response = await this.callTool('del', { keys });
    
    if (!response.success) {
      throw new Error(`Failed to delete keys: ${response.error?.message}`);
    }

    return response.result as number;
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    const response = await this.callTool('exists', { keys });
    
    if (!response.success) {
      throw new Error(`Failed to check existence: ${response.error?.message}`);
    }

    return response.result as number;
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const response = await this.callTool('expire', { key, seconds });
    
    if (!response.success) {
      throw new Error(`Failed to set expiration: ${response.error?.message}`);
    }

    return response.result as boolean;
  }

  /**
   * Get TTL (time to live) of a key
   */
  async ttl(key: string): Promise<number> {
    const response = await this.callTool('ttl', { key });
    
    if (!response.success) {
      throw new Error(`Failed to get TTL: ${response.error?.message}`);
    }

    return response.result as number;
  }

  /**
   * Get keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const response = await this.callTool('keys', { pattern });
    
    if (!response.success) {
      throw new Error(`Failed to get keys: ${response.error?.message}`);
    }

    return response.result as string[];
  }

  /**
   * Increment a value
   */
  async incr(key: string): Promise<number> {
    const response = await this.callTool('incr', { key });
    
    if (!response.success) {
      throw new Error(`Failed to increment: ${response.error?.message}`);
    }

    return response.result as number;
  }

  /**
   * Decrement a value
   */
  async decr(key: string): Promise<number> {
    const response = await this.callTool('decr', { key });
    
    if (!response.success) {
      throw new Error(`Failed to decrement: ${response.error?.message}`);
    }

    return response.result as number;
  }

  // Hash operations

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    const response = await this.callTool('hset', { key, field, value });
    
    if (!response.success) {
      throw new Error(`Failed to set hash field: ${response.error?.message}`);
    }

    return response.result as number;
  }

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    const response = await this.callTool('hget', { key, field });
    
    if (!response.success) {
      throw new Error(`Failed to get hash field: ${response.error?.message}`);
    }

    return response.result as string | null;
  }

  /**
   * Get all hash fields and values
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    const response = await this.callTool('hgetall', { key });
    
    if (!response.success) {
      throw new Error(`Failed to get hash: ${response.error?.message}`);
    }

    return response.result as Record<string, string>;
  }

  // List operations

  /**
   * Push value to list (left)
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    const response = await this.callTool('lpush', { key, values });
    
    if (!response.success) {
      throw new Error(`Failed to push to list: ${response.error?.message}`);
    }

    return response.result as number;
  }

  /**
   * Push value to list (right)
   */
  async rpush(key: string, ...values: string[]): Promise<number> {
    const response = await this.callTool('rpush', { key, values });
    
    if (!response.success) {
      throw new Error(`Failed to push to list: ${response.error?.message}`);
    }

    return response.result as number;
  }

  /**
   * Get list range
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const response = await this.callTool('lrange', { key, start, stop });
    
    if (!response.success) {
      throw new Error(`Failed to get list range: ${response.error?.message}`);
    }

    return response.result as string[];
  }

  // Set operations

  /**
   * Add members to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    const response = await this.callTool('sadd', { key, members });
    
    if (!response.success) {
      throw new Error(`Failed to add to set: ${response.error?.message}`);
    }

    return response.result as number;
  }

  /**
   * Get all set members
   */
  async smembers(key: string): Promise<string[]> {
    const response = await this.callTool('smembers', { key });
    
    if (!response.success) {
      throw new Error(`Failed to get set members: ${response.error?.message}`);
    }

    return response.result as string[];
  }

  /**
   * Check if member is in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const response = await this.callTool('sismember', { key, member });
    
    if (!response.success) {
      throw new Error(`Failed to check set membership: ${response.error?.message}`);
    }

    return response.result as boolean;
  }

  // Utility methods

  /**
   * Get Redis server info
   */
  async info(): Promise<RedisInfo> {
    const response = await this.callTool('info', {});
    
    if (!response.success) {
      throw new Error(`Failed to get info: ${response.error?.message}`);
    }

    return response.result as RedisInfo;
  }

  /**
   * Flush current database
   */
  async flushdb(): Promise<void> {
    const response = await this.callTool('flushdb', {});
    
    if (!response.success) {
      throw new Error(`Failed to flush database: ${response.error?.message}`);
    }
  }

  /**
   * Ping server
   */
  async ping(): Promise<string> {
    const response = await this.callTool('ping', {});
    
    if (!response.success) {
      throw new Error(`Failed to ping: ${response.error?.message}`);
    }

    return response.result as string;
  }
}

/**
 * Create a Redis adapter
 */
export function createRedisAdapter(
  clientManager: MCPClientManager,
  config?: Partial<RedisAdapterConfig>
): RedisAdapter {
  return new RedisAdapter(clientManager, config);
}
