/**
 * Data MCP Server Adapters
 * @module mcp/servers/data
 */

export { SQLiteAdapter, createSQLiteAdapter } from './SQLiteAdapter';
export type { SQLiteAdapterConfig, QueryResult, TableSchema } from './SQLiteAdapter';

export { RedisAdapter, createRedisAdapter } from './RedisAdapter';
export type { RedisAdapterConfig, RedisInfo } from './RedisAdapter';
