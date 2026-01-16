/**
 * MCP Type Definitions
 * 
 * Core types for the MCP integration layer
 * @module mcp/types
 */

// =============================================================================
// Transport Types
// =============================================================================

/**
 * MCP Server transport types
 */
export type TransportType = 'stdio' | 'sse' | 'http' | 'websocket';

/**
 * MCP Server status
 */
export type ServerStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'degraded';

/**
 * MCP Server category
 */
export type ServerCategory = 
  | 'official'      // Official reference servers
  | 'security'      // Security scanning servers
  | 'deployment'    // CI/CD and deployment servers
  | 'data'          // Database and persistence servers
  | 'testing'       // Testing and validation servers
  | 'documentation' // Documentation servers
  | 'utility'       // General utility servers
  | 'custom';       // Custom/existing servers

// =============================================================================
// Server Definitions
// =============================================================================

/**
 * MCP Server definition
 */
export interface MCPServerDefinition {
  id: string;
  name: string;
  description?: string;
  category: ServerCategory;
  transport: TransportType;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled?: boolean;
  tags?: string[];
  tools?: MCPToolDefinition[];
  healthCheck?: HealthCheckConfig;
  retryPolicy?: RetryPolicyConfig;
}

/**
 * MCP Tool definition
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  timeout?: number;
}

/**
 * JSON Schema type
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  description?: string;
  default?: unknown;
  enum?: unknown[];
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  enabled: boolean;
  intervalMs: number;
  timeoutMs: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
  degradedThreshold: number;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicyConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  idleTimeoutMs: number;
  acquireTimeoutMs: number;
}

/**
 * MCP Client Manager configuration
 */
export interface MCPClientManagerConfig {
  servers: MCPServerDefinition[];
  pool: ConnectionPoolConfig;
  healthCheck: HealthCheckConfig;
  defaultRetryPolicy: RetryPolicyConfig;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// =============================================================================
// Tool Calls
// =============================================================================

/**
 * Tool call request
 */
export interface ToolCallRequest {
  serverId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  timeout?: number;
  correlationId?: string;
}

/**
 * Tool call response
 */
export interface ToolCallResponse<T = unknown> {
  success: boolean;
  result?: T;
  data?: T;
  error?: MCPErrorInfo;
  serverId?: string;
  toolName?: string;
  executionTimeMs?: number;
  duration?: number;
  correlationId?: string;
}

/**
 * MCP Error info
 */
export interface MCPErrorInfo {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

// =============================================================================
// Health & Metrics
// =============================================================================

/**
 * Server health status
 */
export interface ServerHealthStatus {
  serverId: string;
  status: ServerStatus;
  lastCheck: Date;
  latencyMs: number;
  consecutiveFailures: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
}

/**
 * MCP metrics
 */
export interface MCPMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  activeConnections: number;
  circuitBreakerTrips: number;
}

// =============================================================================
// MCP Protocol Types (JSON-RPC)
// =============================================================================

/**
 * JSON-RPC request
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown;
}

/**
 * JSON-RPC response
 */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

/**
 * JSON-RPC error
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * JSON-RPC notification (no id)
 */
export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

// =============================================================================
// MCP Protocol Specific Types
// =============================================================================

/**
 * MCP Initialize request params
 */
export interface MCPInitializeParams {
  protocolVersion: string;
  capabilities: MCPClientCapabilities;
  clientInfo: {
    name: string;
    version: string;
  };
}

/**
 * MCP Client capabilities
 */
export interface MCPClientCapabilities {
  roots?: {
    listChanged?: boolean;
  };
  sampling?: Record<string, unknown>;
  experimental?: Record<string, unknown>;
}

/**
 * MCP Server capabilities
 */
export interface MCPServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: Record<string, unknown>;
  experimental?: Record<string, unknown>;
}

/**
 * MCP Initialize result
 */
export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPServerCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
}

/**
 * MCP Tool info
 */
export interface MCPToolInfo {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
}

/**
 * MCP Tools list result
 */
export interface MCPToolsListResult {
  tools: MCPToolInfo[];
}

/**
 * MCP Tool call params
 */
export interface MCPToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

/**
 * MCP Tool call result
 */
export interface MCPToolCallResult {
  content: MCPContent[];
  isError?: boolean;
}

/**
 * MCP Content types
 */
export type MCPContent = MCPTextContent | MCPImageContent | MCPResourceContent;

export interface MCPTextContent {
  type: 'text';
  text: string;
}

export interface MCPImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

export interface MCPResourceContent {
  type: 'resource';
  resource: {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  };
}

// =============================================================================
// Adapter Types
// =============================================================================

/**
 * MCP Server adapter interface
 */
export interface MCPServerAdapter {
  readonly serverId: string;
  readonly serverName: string;
  readonly version: string;
  
  getTools(): MCPTool[];
  executeTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult>;
  checkHealth(): Promise<{ healthy: boolean; latency: number }>;
}

/**
 * MCP Tool (simplified)
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  category?: string;
}

/**
 * MCP Tool result
 */
export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  duration: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Events
// =============================================================================

/**
 * Transport events
 */
export interface TransportEvents {
  connected: () => void;
  disconnected: (reason: string) => void;
  error: (error: Error) => void;
  message: (message: unknown) => void;
}

/**
 * Health monitor events
 */
export interface HealthMonitorEvents {
  healthy: (serverId: string) => void;
  unhealthy: (serverId: string, reason: string) => void;
  degraded: (serverId: string, latencyMs: number) => void;
  circuitOpen: (serverId: string) => void;
  circuitClosed: (serverId: string) => void;
}

// =============================================================================
// Default Configurations
// =============================================================================

/**
 * Default health check configuration
 */
export const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  enabled: true,
  intervalMs: 30000,
  timeoutMs: 5000,
  unhealthyThreshold: 3,
  healthyThreshold: 2,
  degradedThreshold: 1,
};

/**
 * Default retry policy configuration
 */
export const DEFAULT_RETRY_POLICY_CONFIG: RetryPolicyConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ECONNRESET',
    'NETWORK_ERROR',
    'TIMEOUT',
  ],
};

/**
 * Default connection pool configuration
 */
export const DEFAULT_CONNECTION_POOL_CONFIG: ConnectionPoolConfig = {
  minConnections: 1,
  maxConnections: 10,
  idleTimeoutMs: 60000,
  acquireTimeoutMs: 30000,
};
