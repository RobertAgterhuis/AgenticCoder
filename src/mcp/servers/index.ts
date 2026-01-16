/**
 * MCP Server Adapters
 * @module mcp/servers
 */

// Base adapter
export { BaseServerAdapter } from './BaseServerAdapter';
export type { ServerAdapterConfig } from './BaseServerAdapter';

// Official servers
export * from './official';

// Security servers
export * from './security';

// Deployment servers
export * from './deployment';

// Data servers
export * from './data';

// Testing servers
export * from './testing';

// Documentation servers
export * from './documentation';

// Azure MCP servers (local Python servers)
export * from './azure';

