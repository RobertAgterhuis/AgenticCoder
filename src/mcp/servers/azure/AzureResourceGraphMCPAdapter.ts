/**
 * Azure Resource Graph MCP Server Adapter
 * 
 * Native TypeScript implementation for Azure Resource Graph queries
 * @module mcp/servers/azure/AzureResourceGraphMCPAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition, ToolCallResponse } from '../../types';

/**
 * Azure Resource Graph REST API configuration
 */
const RESOURCE_GRAPH_API_VERSION = '2022-10-01';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF = 500;

/**
 * Resource Graph query result
 */
export interface ResourceGraphResult {
  status: string;
  tool: string;
  query: string;
  count: number;
  data: Array<Record<string, unknown>>;
}

/**
 * Azure resource information from Resource Graph
 */
export interface ResourceGraphResource {
  id: string;
  name: string;
  type: string;
  location: string;
  resourceGroup: string;
  subscriptionId: string;
  properties?: Record<string, unknown>;
  tags?: Record<string, string>;
}

/**
 * Azure Resource Graph API response
 */
interface ResourceGraphApiResponse {
  totalRecords: number;
  count: number;
  data: {
    columns: Array<{ name: string; type: string }>;
    rows: Array<Array<unknown>>;
  };
  facets?: Array<unknown>;
  resultTruncated?: string;
  $skipToken?: string;
}

/**
 * Azure Resource Graph adapter configuration
 */
export interface AzureResourceGraphAdapterConfig extends ServerAdapterConfig {
  subscriptionId?: string;
  tenantId?: string;
  maxRetries?: number;
  timeoutMs?: number;
  backoffMs?: number;
}

/**
 * Azure Resource Graph MCP Adapter
 * 
 * Native TypeScript implementation for Azure Resource Graph API
 * Uses Azure REST API directly with Azure CLI authentication
 */
export class AzureResourceGraphMCPAdapter extends BaseServerAdapter {
  private subscriptionId: string | undefined;
  private tenantId: string | undefined;
  private maxRetries: number;
  private timeoutMs: number;
  private backoffMs: number;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<AzureResourceGraphAdapterConfig>
  ) {
    super(clientManager, config);
    this.subscriptionId = config?.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID;
    this.tenantId = config?.tenantId || process.env.AZURE_TENANT_ID;
    this.maxRetries = config?.maxRetries ?? DEFAULT_RETRIES;
    this.timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT;
    this.backoffMs = config?.backoffMs ?? DEFAULT_BACKOFF;
  }

  /**
   * Get server identifier
   */
  getServerId(): string {
    return 'azure-resource-graph-mcp';
  }

  /**
   * Get server definition (native implementation - no external process)
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'azure-resource-graph-mcp',
      name: 'Azure Resource Graph MCP',
      description: 'Azure Resource Graph queries for governance and compliance (native TypeScript)',
      category: 'data',
      transport: 'native',
      command: '',
      args: [],
      env: {},
      enabled: true,
      tags: ['azure', 'resource-graph', 'governance', 'compliance', 'native'],
      healthCheck: {
        enabled: true,
        intervalMs: 60000,
        timeoutMs: 15000,
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
        name: 'query',
        description: 'Execute a Kusto (KQL) query against Azure Resource Graph',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Kusto query string' },
          },
          required: ['query'],
        },
      },
      {
        name: 'ping',
        description: 'Health check for the Resource Graph service',
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
   * Get Azure access token using Azure CLI
   */
  private async getAccessToken(): Promise<string> {
    // Check if cached token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    try {
      // Use Azure CLI to get token
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout } = await execAsync('az account get-access-token --resource https://management.azure.com/ --output json');
      const tokenData = JSON.parse(stdout);
      
      this.accessToken = tokenData.accessToken as string;
      this.tokenExpiry = new Date(tokenData.expiresOn).getTime();
      
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get Azure access token. Make sure Azure CLI is installed and logged in.');
      throw new Error('Azure authentication failed. Run "az login" first.');
    }
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute a Resource Graph query
   */
  async query(
    kusto: string
  ): Promise<ToolCallResponse<ResourceGraphResult>> {
    try {
      if (!kusto || typeof kusto !== 'string' || !kusto.trim()) {
        return {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'query must be a non-empty string', retryable: false },
        };
      }

      const token = await this.getAccessToken();
      const url = `https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=${RESOURCE_GRAPH_API_VERSION}`;

      const body = {
        query: kusto.trim(),
        subscriptions: this.subscriptionId ? [this.subscriptionId] : undefined,
      };

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(body),
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorBody}`);
          }

          const apiResponse = await response.json() as ResourceGraphApiResponse;
          
          // Convert columnar data to array of objects
          const columns = apiResponse.data?.columns || [];
          const rows = apiResponse.data?.rows || [];
          const data = rows.map(row => {
            const obj: Record<string, unknown> = {};
            columns.forEach((col, idx) => {
              obj[col.name] = row[idx];
            });
            return obj;
          });

          return {
            success: true,
            data: {
              status: 'ok',
              tool: 'query',
              query: kusto,
              count: data.length,
              data,
            },
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          this.logger.warn(`Resource Graph query attempt ${attempt + 1} failed: ${lastError.message}`);
          
          if (attempt < this.maxRetries - 1) {
            await this.sleep(this.backoffMs * Math.pow(2, attempt));
          }
        }
      }

      throw lastError || new Error('Failed to execute Resource Graph query');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`query failed: ${message}`);
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
    try {
      // Try to get a token to verify authentication
      await this.getAccessToken();
      return {
        success: true,
        data: {
          status: 'ok',
          service: 'azure-resource-graph-mcp',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: { 
          code: 'AUTH_ERROR', 
          message: error instanceof Error ? error.message : 'Authentication failed',
          retryable: false,
        },
      };
    }
  }

  /**
   * List all resources of a specific type
   */
  async listResourcesByType(
    resourceType: string,
    limit: number = 100
  ): Promise<ResourceGraphResource[]> {
    const result = await this.query(`
      resources
      | where type =~ '${resourceType}'
      | limit ${limit}
      | project id, name, type, location, resourceGroup, subscriptionId, properties, tags
    `);

    if (result.success && result.data?.data) {
      return result.data.data as unknown as ResourceGraphResource[];
    }

    return [];
  }

  /**
   * List all resources in a resource group
   */
  async listResourcesInGroup(
    resourceGroup: string,
    limit: number = 100
  ): Promise<ResourceGraphResource[]> {
    const result = await this.query(`
      resources
      | where resourceGroup =~ '${resourceGroup}'
      | limit ${limit}
      | project id, name, type, location, resourceGroup, subscriptionId, properties, tags
    `);

    if (result.success && result.data?.data) {
      return result.data.data as unknown as ResourceGraphResource[];
    }

    return [];
  }

  /**
   * Find resources by tag
   */
  async findResourcesByTag(
    tagName: string,
    tagValue?: string,
    limit: number = 100
  ): Promise<ResourceGraphResource[]> {
    const tagFilter = tagValue
      ? `tags['${tagName}'] == '${tagValue}'`
      : `isnotnull(tags['${tagName}'])`;

    const result = await this.query(`
      resources
      | where ${tagFilter}
      | limit ${limit}
      | project id, name, type, location, resourceGroup, subscriptionId, properties, tags
    `);

    if (result.success && result.data?.data) {
      return result.data.data as unknown as ResourceGraphResource[];
    }

    return [];
  }

  /**
   * Get resource count by type
   */
  async getResourceCountByType(): Promise<Array<{ type: string; count: number }>> {
    const result = await this.query(`
      resources
      | summarize count() by type
      | order by count_ desc
    `);

    if (result.success && result.data?.data) {
      return result.data.data.map((r: Record<string, unknown>) => ({
        type: r.type as string,
        count: r.count_ as number,
      }));
    }

    return [];
  }

  /**
   * Find non-compliant resources (no tags)
   */
  async findUntaggedResources(
    requiredTags: string[] = ['environment', 'owner'],
    limit: number = 100
  ): Promise<ResourceGraphResource[]> {
    const tagChecks = requiredTags
      .map(tag => `isempty(tags['${tag}'])`)
      .join(' or ');

    const result = await this.query(`
      resources
      | where ${tagChecks}
      | limit ${limit}
      | project id, name, type, location, resourceGroup, subscriptionId, tags
    `);

    if (result.success && result.data?.data) {
      return result.data.data as unknown as ResourceGraphResource[];
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
      case 'query':
        return this.query(args.query as string) as Promise<ToolCallResponse<T>>;
      
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
 * Create Azure Resource Graph MCP adapter instance
 */
export function createAzureResourceGraphMCPAdapter(
  clientManager: MCPClientManager,
  config?: Partial<AzureResourceGraphAdapterConfig>
): AzureResourceGraphMCPAdapter {
  return new AzureResourceGraphMCPAdapter(clientManager, config);
}
