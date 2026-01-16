/**
 * Fetch MCP Server Adapter
 * 
 * Provides HTTP fetch operations via MCP
 * @module mcp/servers/official/FetchAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * Fetch adapter configuration
 */
export interface FetchAdapterConfig extends ServerAdapterConfig {
  userAgent?: string;
  maxRedirects?: number;
}

/**
 * HTTP response
 */
export interface FetchResponse {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  content: string;
  contentType: string;
}

/**
 * Fetch MCP Server Adapter
 */
export class FetchAdapter extends BaseServerAdapter {
  private userAgent: string;
  private maxRedirects: number;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<FetchAdapterConfig>
  ) {
    super(clientManager, config);
    this.userAgent = config?.userAgent || 'AgenticCoder-MCP-Client/1.0';
    this.maxRedirects = config?.maxRedirects ?? 5;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'fetch';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'fetch',
      name: 'Fetch Server',
      description: 'HTTP fetch operations',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-fetch'],
      category: 'official',
      enabled: true,
      tags: ['official', 'http', 'fetch'],
    };
  }

  /**
   * Fetch a URL
   */
  async fetch(
    url: string,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      maxRedirects?: number;
    }
  ): Promise<FetchResponse> {
    const response = await this.callTool('fetch', {
      url,
      method: options?.method || 'GET',
      headers: {
        'User-Agent': this.userAgent,
        ...options?.headers,
      },
      body: options?.body,
      max_redirects: options?.maxRedirects ?? this.maxRedirects,
    });
    
    if (!response.success) {
      throw new Error(`Failed to fetch: ${response.error?.message}`);
    }

    return response.result as FetchResponse;
  }

  /**
   * GET request
   */
  async get(url: string, headers?: Record<string, string>): Promise<FetchResponse> {
    return this.fetch(url, { method: 'GET', headers });
  }

  /**
   * POST request
   */
  async post(
    url: string,
    body: string | Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<FetchResponse> {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const contentType = typeof body === 'object' ? 'application/json' : undefined;

    return this.fetch(url, {
      method: 'POST',
      body: bodyStr,
      headers: {
        ...(contentType && { 'Content-Type': contentType }),
        ...headers,
      },
    });
  }

  /**
   * PUT request
   */
  async put(
    url: string,
    body: string | Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<FetchResponse> {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const contentType = typeof body === 'object' ? 'application/json' : undefined;

    return this.fetch(url, {
      method: 'PUT',
      body: bodyStr,
      headers: {
        ...(contentType && { 'Content-Type': contentType }),
        ...headers,
      },
    });
  }

  /**
   * DELETE request
   */
  async delete(url: string, headers?: Record<string, string>): Promise<FetchResponse> {
    return this.fetch(url, { method: 'DELETE', headers });
  }

  /**
   * Get JSON from URL
   */
  async getJson<T = unknown>(url: string): Promise<T> {
    const response = await this.get(url, {
      'Accept': 'application/json',
    });
    return JSON.parse(response.content) as T;
  }

  /**
   * Get text content from URL
   */
  async getText(url: string): Promise<string> {
    const response = await this.get(url);
    return response.content;
  }

  /**
   * Check if URL is reachable
   */
  async isReachable(url: string): Promise<boolean> {
    try {
      const response = await this.fetch(url, { method: 'HEAD' });
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }
}

/**
 * Create a Fetch adapter
 */
export function createFetchAdapter(
  clientManager: MCPClientManager,
  config?: Partial<FetchAdapterConfig>
): FetchAdapter {
  return new FetchAdapter(clientManager, config);
}
