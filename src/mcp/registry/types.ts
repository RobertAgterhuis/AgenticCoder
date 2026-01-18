/**
 * MCP Adapter Registry Types
 * @module mcp/registry/types
 */

import { BaseServerAdapter } from '../servers/BaseServerAdapter';

/**
 * Adapter categories for organization
 */
export type AdapterCategory = 
  | 'azure'
  | 'security'
  | 'deployment'
  | 'data'
  | 'testing'
  | 'documentation'
  | 'official'
  | 'custom';

/**
 * Adapter metadata
 */
export interface AdapterMetadata {
  /** Unique adapter identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of adapter capabilities */
  description: string;
  
  /** Category for grouping */
  category: AdapterCategory;
  
  /** Version string */
  version: string;
  
  /** Required configuration keys (environment variables or config values) */
  requiredConfig?: string[];
  
  /** Optional configuration keys */
  optionalConfig?: string[];
  
  /** List of tools provided */
  tools: string[];
  
  /** Dependencies on other adapters */
  dependencies?: string[];
}

/**
 * Adapter registration info
 */
export interface AdapterRegistration {
  metadata: AdapterMetadata;
  factory: AdapterFactory;
  instance?: BaseServerAdapter;
  status: AdapterStatus;
  error?: Error;
  lastUsed?: Date;
}

export type AdapterStatus = 'registered' | 'initializing' | 'ready' | 'error';

export type AdapterFactory = () => BaseServerAdapter | Promise<BaseServerAdapter>;

/**
 * Registry events
 */
export type RegistryEvent = 
  | 'adapter:registered'
  | 'adapter:initialized'
  | 'adapter:error'
  | 'adapter:disposed'
  | 'tool:invoked';

/**
 * Tool invocation request
 */
export interface ToolRequest {
  tool: string;
  params: Record<string, unknown>;
  timeout?: number;
}

/**
 * Tool invocation result
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  adapter: string;
}
