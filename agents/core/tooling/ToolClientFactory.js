/**
 * ToolClientFactory
 * Creates tool clients based on config with safe defaults.
 *
 * @deprecated This module is deprecated. Use the new TypeScript MCP infrastructure instead:
 * 
 * ```javascript
 * // New approach using MCPBridge
 * const { MCPBridge } = require('./src/mcp/bridge');
 * const bridge = new MCPBridge({ workspaceFolder: process.cwd() });
 * await bridge.initialize();
 * const result = await bridge.callTool('azure-pricing-mcp', 'price_search', { sku: 'Standard_B1s' });
 * ```
 * 
 * The new infrastructure provides:
 * - TransportFactory with multiple transport types
 * - Automatic transport selection based on server configuration
 * - Circuit breaker pattern for fault tolerance
 * - Retry policies with exponential backoff
 * 
 * This class will be removed in a future version.
 *
 * Default: HTTP via `endpoint` (current behavior).
 * Optional: MCP stdio via `command`/`args`.
 */
import { HttpToolClient } from './HttpToolClient.js';
import { McpStdioToolClient } from './McpStdioToolClient.js';

export class ToolClientFactory {
  static create(config = {}) {
    console.warn('[DEPRECATED] ToolClientFactory is deprecated. Use MCPBridge from src/mcp/bridge instead.');
    const globalTransport = process.env.AGENTICCODER_TOOL_TRANSPORT;
    const requestedTransport = (globalTransport || config.transport || '').toLowerCase();

    // Allow agents to provide stdio details without forcing stdio by default.
    // When MCP is requested, we can derive the actual spawn config from these fields.
    const normalized = { ...config };
    if (requestedTransport.startsWith('mcp') && !normalized.command && normalized.stdioCommand) {
      normalized.command = normalized.stdioCommand;
      normalized.args = normalized.stdioArgs || normalized.args;
      normalized.cwd = normalized.cwd || normalized.stdioCwd;
      normalized.env = normalized.env || normalized.stdioEnv;
      if (normalized.shell === undefined && normalized.stdioShell !== undefined) {
        normalized.shell = normalized.stdioShell;
      }
      if (normalized.framing === undefined && normalized.stdioFraming !== undefined) {
        normalized.framing = normalized.stdioFraming;
      }
    }

    const looksLikeStdio = Boolean(normalized.command);
    const wantsMcp = requestedTransport.startsWith('mcp');

    if (wantsMcp || looksLikeStdio) {
      return new McpStdioToolClient(normalized);
    }

    return new HttpToolClient(normalized);
  }
}
