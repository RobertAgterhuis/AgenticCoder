/**
 * McpClient - Real HTTP client for MCP servers
 * Replaces mock implementation in BaseAgent
 */
export class McpClient {
  constructor(config) {
    this.name = config.name;
    this.baseUrl = config.endpoint;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Call an MCP server method
   */
  async call(method, params = {}) {
    // Backwards-compatible: default POST to `${baseUrl}${method}`.
    // Also supports REST-style calls using a leading verb, e.g.:
    //   client.call('GET /api/prices', { currencyCode: 'USD', limit: 1 })
    let httpMethod = 'POST';
    let path = method;
    const verbMatch = typeof method === 'string'
      ? method.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i)
      : null;
    if (verbMatch) {
      httpMethod = verbMatch[1].toUpperCase();
      path = verbMatch[2];
    }

    const url = `${this.baseUrl}${path}`;
    
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await this._makeRequest(url, params, httpMethod);
        return response;
      } catch (error) {
        if (attempt < this.retryAttempts - 1) {
          await this._sleep(this.retryDelay * Math.pow(2, attempt));
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this._makeRequest(`${this.baseUrl}/health`, {}, 'GET');
      return response.status === 'ok' || response.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect (cleanup)
   */
  async disconnect() {
    // No persistent connections, nothing to do
    console.log(`Disconnected from ${this.name}`);
  }

  // Private methods

  async _makeRequest(url, params, method = 'POST') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AgenticCoder/1.0'
        },
        signal: controller.signal
      };

      if (method === 'POST' && Object.keys(params).length > 0) {
        options.body = JSON.stringify(params);
      } else if (method === 'GET' && Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url = `${url}?${queryString}`;
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * McpClientFactory - Creates MCP clients with configuration
 */
export class McpClientFactory {
  static create(config) {
    return new McpClient(config);
  }

  /**
   * Create multiple clients from array of configs
   */
  static createMultiple(configs) {
    const clients = new Map();
    for (const config of configs) {
      clients.set(config.name, McpClientFactory.create(config));
    }
    return clients;
  }
}
