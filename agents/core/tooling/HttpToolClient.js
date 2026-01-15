/**
 * HttpToolClient
 * Backwards-compatible wrapper around the existing HTTP-based McpClient.
 */
import { ToolClient } from './ToolClient.js';
import { McpClient } from '../McpClient.js';

export class HttpToolClient extends ToolClient {
  constructor(config) {
    super(config);
    this._inner = new McpClient(config);
  }

  async call(method, params = {}) {
    return this._inner.call(method, params);
  }

  async healthCheck() {
    return this._inner.healthCheck();
  }

  async disconnect() {
    return this._inner.disconnect();
  }
}
