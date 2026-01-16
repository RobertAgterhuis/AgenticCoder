/**
 * Core module exports
 * @module mcp/core
 */

export { MCPConnectionPool, createConnectionPool } from './MCPConnectionPool';
export type { PoolStats } from './MCPConnectionPool';

export { MCPClientManager, createClientManager } from './MCPClientManager';
export type { MCPClientManagerConfig } from './MCPClientManager';

export { MCPServerRegistry, createServerRegistry, DEFAULT_SERVERS } from './MCPServerRegistry';
export type { ServerFilter, RegistryStats } from './MCPServerRegistry';

export { MCPServiceRegistry, createServiceRegistry } from './MCPServiceRegistry';
export type { ToolCapability, AgentRequirements, ServiceBinding } from './MCPServiceRegistry';
