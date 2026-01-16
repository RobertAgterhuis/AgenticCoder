/**
 * ToolClientFactory
 * Creates tool clients based on config with safe defaults.
 *
 * Default: HTTP via `endpoint` (current behavior).
 * Optional: MCP stdio via `command`/`args`.
 */
import { HttpToolClient } from './HttpToolClient.js';
import { McpStdioToolClient } from './McpStdioToolClient.js';

export class ToolClientFactory {
  static create(config = {}) {
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
