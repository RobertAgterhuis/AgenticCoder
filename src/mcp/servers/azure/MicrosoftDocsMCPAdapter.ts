/**
 * Microsoft Docs MCP Server Adapter
 * 
 * Native TypeScript implementation for Microsoft Learn documentation search
 * @module mcp/servers/azure/MicrosoftDocsMCPAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition, ToolCallResponse } from '../../types';

/**
 * Microsoft Learn Search API configuration
 * Using the public search endpoint
 */
const DOCS_SEARCH_URL = 'https://learn.microsoft.com/api/search';
const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF = 500;
const DEFAULT_LOCALE = 'en-us';

/**
 * Documentation search result item
 */
export interface DocSearchItem {
  title: string;
  url: string;
  description: string;
  category?: string;
  lastModified?: string;
  breadcrumbs?: string[];
}

/**
 * Documentation search result
 */
export interface DocSearchResult {
  status: string;
  tool: string;
  query: string;
  count: number;
  results: DocSearchItem[];
}

/**
 * Microsoft Learn Search API response
 */
interface DocsApiResponse {
  results: Array<{
    title: string;
    url: string;
    displayUrl: string;
    description: string;
    lastUpdatedDate?: string;
    breadcrumbs?: Array<{ title: string; url: string }>;
  }>;
  count: number;
  nextLink?: string;
}

/**
 * Microsoft Docs adapter configuration
 */
export interface MicrosoftDocsAdapterConfig extends ServerAdapterConfig {
  locale?: string;
  maxRetries?: number;
  timeoutMs?: number;
  backoffMs?: number;
}

/**
 * Microsoft Docs MCP Adapter
 * 
 * Native TypeScript implementation for Microsoft Learn documentation search
 * No Python dependency required
 */
export class MicrosoftDocsMCPAdapter extends BaseServerAdapter {
  private locale: string;
  private maxRetries: number;
  private timeoutMs: number;
  private backoffMs: number;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<MicrosoftDocsAdapterConfig>
  ) {
    super(clientManager, config);
    this.locale = config?.locale || DEFAULT_LOCALE;
    this.maxRetries = config?.maxRetries ?? DEFAULT_RETRIES;
    this.timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT;
    this.backoffMs = config?.backoffMs ?? DEFAULT_BACKOFF;
  }

  /**
   * Get server identifier
   */
  getServerId(): string {
    return 'microsoft-docs-mcp';
  }

  /**
   * Get server definition (native implementation - no external process)
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'microsoft-docs-mcp',
      name: 'Microsoft Docs MCP',
      description: 'Microsoft Learn documentation search for best practices (native TypeScript)',
      category: 'documentation',
      transport: 'native',
      command: '',
      args: [],
      env: {},
      enabled: true,
      tags: ['microsoft', 'documentation', 'best-practices', 'azure', 'native'],
      healthCheck: {
        enabled: true,
        intervalMs: 60000,
        timeoutMs: 10000,
        unhealthyThreshold: 3,
        healthyThreshold: 1,
        degradedThreshold: 2,
      },
    };
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (this.registered) {
      this.logger.warn('Adapter already initialized');
      return;
    }

    this.logger.info(`Initializing native adapter: ${this.getServerId()}`);

    // Define available tools
    this.tools = [
      {
        name: 'search',
        description: 'Search Microsoft Learn documentation',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'integer', description: 'Maximum results to return (1-50)' },
            category: { type: 'string', description: 'Filter by category (e.g., azure, dotnet)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'ping',
        description: 'Health check for the documentation service',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];

    this.registered = true;
    this.emit('initialized');
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search Microsoft documentation
   */
  async search(
    query: string,
    options?: {
      limit?: number;
      category?: string;
    }
  ): Promise<ToolCallResponse<DocSearchResult>> {
    try {
      if (!query || typeof query !== 'string' || !query.trim()) {
        return {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'query must be a non-empty string', retryable: false },
        };
      }

      const limit = Math.min(options?.limit || 10, 50);
      const searchQuery = options?.category 
        ? `${query} ${options.category}` 
        : query;

      // Build search URL
      const url = new URL(DOCS_SEARCH_URL);
      url.searchParams.set('search', searchQuery.trim());
      url.searchParams.set('locale', this.locale);
      url.searchParams.set('$top', limit.toString());
      
      // Filter to specific scopes if category is provided
      if (options?.category) {
        url.searchParams.set('scope', options.category);
      }

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const apiResponse = await response.json() as DocsApiResponse;
          
          const results: DocSearchItem[] = (apiResponse.results || []).map(item => ({
            title: item.title,
            url: item.url.startsWith('http') ? item.url : `https://learn.microsoft.com${item.url}`,
            description: item.description,
            lastModified: item.lastUpdatedDate,
            breadcrumbs: item.breadcrumbs?.map(b => b.title),
          }));

          return {
            success: true,
            data: {
              status: 'ok',
              tool: 'search',
              query,
              count: results.length,
              results,
            },
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          this.logger.warn(`Docs search attempt ${attempt + 1} failed: ${lastError.message}`);
          
          if (attempt < this.maxRetries - 1) {
            await this.sleep(this.backoffMs * Math.pow(2, attempt));
          }
        }
      }

      throw lastError || new Error('Failed to search documentation');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`search failed: ${message}`);
      return {
        success: false,
        error: { code: 'API_ERROR', message, retryable: true },
      };
    }
  }

  /**
   * Ping the service
   */
  async ping(): Promise<ToolCallResponse<{ status: string; service: string }>> {
    return {
      success: true,
      data: {
        status: 'ok',
        service: 'microsoft-docs-mcp',
      },
    };
  }

  /**
   * Search for Azure best practices
   */
  async searchAzureBestPractices(
    topic: string,
    limit: number = 5
  ): Promise<DocSearchItem[]> {
    const result = await this.search(`Azure ${topic} best practices`, {
      limit,
      category: 'azure',
    });

    if (result.success && result.data?.results) {
      return result.data.results;
    }

    return [];
  }

  /**
   * Search for Bicep documentation
   */
  async searchBicepDocs(
    topic: string,
    limit: number = 5
  ): Promise<DocSearchItem[]> {
    const result = await this.search(`Bicep ${topic}`, {
      limit,
      category: 'azure',
    });

    if (result.success && result.data?.results) {
      return result.data.results;
    }

    return [];
  }

  /**
   * Get Azure service documentation
   */
  async getServiceDocs(
    serviceName: string,
    limit: number = 5
  ): Promise<DocSearchItem[]> {
    const result = await this.search(`Azure ${serviceName} documentation`, {
      limit,
    });

    if (result.success && result.data?.results) {
      return result.data.results;
    }

    return [];
  }

  /**
   * Search for security guidance
   */
  async searchSecurityGuidance(
    topic: string,
    limit: number = 5
  ): Promise<DocSearchItem[]> {
    const result = await this.search(`Azure ${topic} security`, {
      limit,
      category: 'security',
    });

    if (result.success && result.data?.results) {
      return result.data.results;
    }

    return [];
  }

  /**
   * Search for architecture patterns
   */
  async searchArchitecturePatterns(
    pattern: string,
    limit: number = 5
  ): Promise<DocSearchItem[]> {
    const result = await this.search(`Azure architecture ${pattern}`, {
      limit,
      category: 'azure',
    });

    if (result.success && result.data?.results) {
      return result.data.results;
    }

    return [];
  }

  /**
   * Override callTool for native implementation
   */
  async callTool<T = unknown>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResponse<T>> {
    switch (toolName) {
      case 'search':
        return this.search(
          args.query as string,
          { limit: args.limit as number, category: args.category as string }
        ) as Promise<ToolCallResponse<T>>;
      
      case 'ping':
        return this.ping() as Promise<ToolCallResponse<T>>;
      
      default:
        return {
          success: false,
          error: { code: 'UNKNOWN_TOOL', message: `Unknown tool: ${toolName}`, retryable: false },
        };
    }
  }
}

/**
 * Create Microsoft Docs MCP adapter instance
 */
export function createMicrosoftDocsMCPAdapter(
  clientManager: MCPClientManager,
  config?: Partial<MicrosoftDocsAdapterConfig>
): MicrosoftDocsMCPAdapter {
  return new MicrosoftDocsMCPAdapter(clientManager, config);
}
