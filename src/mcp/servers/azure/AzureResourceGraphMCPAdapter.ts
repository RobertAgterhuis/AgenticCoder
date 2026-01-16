/**
 * Azure Resource Graph MCP Server Adapter
 * 
 * Connects to the local Python MCP server for Azure Resource Graph queries
 * @module mcp/servers/azure/AzureResourceGraphMCPAdapter
 */

import { BaseServerAdapter } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition, ToolCallResponse } from '../../types';
import * as path from 'path';

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
 * Azure Resource Graph MCP Adapter
 * 
 * Provides access to Azure Resource Graph for governance and compliance queries
 */
export class AzureResourceGraphMCPAdapter extends BaseServerAdapter {
  private workspaceFolder: string;
  private subscriptionId: string | undefined;

  constructor(
    clientManager: MCPClientManager,
    workspaceFolder?: string,
    subscriptionId?: string
  ) {
    super(clientManager);
    this.workspaceFolder = workspaceFolder || process.cwd();
    this.subscriptionId = subscriptionId || process.env.AZURE_SUBSCRIPTION_ID;
  }

  /**
   * Get server identifier
   */
  getServerId(): string {
    return 'azure-resource-graph-mcp';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    const mcpPath = path.join(this.workspaceFolder, '.github', 'mcp', 'azure-resource-graph-mcp');
    
    return {
      id: 'azure-resource-graph-mcp',
      name: 'Azure Resource Graph MCP',
      description: 'Azure Resource Graph queries for governance and compliance',
      category: 'data',
      transport: 'stdio',
      command: 'python',
      args: ['-m', 'azure_resource_graph_mcp'],
      env: {
        PYTHONPATH: mcpPath,
        AZURE_SUBSCRIPTION_ID: this.subscriptionId || '',
      },
      enabled: true,
      tags: ['azure', 'resource-graph', 'governance', 'compliance'],
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
   * Execute a Resource Graph query
   */
  async query(
    kusto: string
  ): Promise<ToolCallResponse<ResourceGraphResult>> {
    return this.callTool('query', { query: kusto });
  }

  /**
   * Ping the server
   */
  async ping(): Promise<ToolCallResponse<{ status: string; service: string }>> {
    return this.callTool('ping', {});
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
}

/**
 * Create Azure Resource Graph MCP adapter instance
 */
export function createAzureResourceGraphMCPAdapter(
  clientManager: MCPClientManager,
  workspaceFolder?: string,
  subscriptionId?: string
): AzureResourceGraphMCPAdapter {
  return new AzureResourceGraphMCPAdapter(clientManager, workspaceFolder, subscriptionId);
}
