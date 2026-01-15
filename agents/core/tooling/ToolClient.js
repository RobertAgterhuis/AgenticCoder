/**
 * ToolClient
 * Transport-agnostic client interface for calling external tool servers.
 *
 * Current default transport remains HTTP (compatible with existing `endpoint` configs).
 * MCP stdio transport is available for migration.
 */
export class ToolClient {
  constructor(config) {
    this.name = config?.name;
  }

  async connect() {
    // Optional hook for transports that need setup.
  }

  async call(method, params = {}) {
    throw new Error('ToolClient.call must be implemented by subclass');
  }

  async healthCheck() {
    return true;
  }

  async disconnect() {
    // Optional hook for cleanup.
  }
}
