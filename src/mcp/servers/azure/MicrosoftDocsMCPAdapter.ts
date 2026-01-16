/**
 * Microsoft Docs MCP Server Adapter
 * 
 * Connects to the local Python MCP server for Microsoft documentation search
 * @module mcp/servers/azure/MicrosoftDocsMCPAdapter
 */

import { BaseServerAdapter } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition, ToolCallResponse } from '../../types';
import * as path from 'path';

/**
 * Documentation search result item
 */
export interface DocSearchItem {
  title: string;
  url: string;
  description: string;
  category?: string;
  lastModified?: string;
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
 * Microsoft Docs MCP Adapter
 * 
 * Provides access to Microsoft Learn documentation for best practices
 */
export class MicrosoftDocsMCPAdapter extends BaseServerAdapter {
  private workspaceFolder: string;

  constructor(
    clientManager: MCPClientManager,
    workspaceFolder?: string
  ) {
    super(clientManager);
    this.workspaceFolder = workspaceFolder || process.cwd();
  }

  /**
   * Get server identifier
   */
  getServerId(): string {
    return 'microsoft-docs-mcp';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    const mcpPath = path.join(this.workspaceFolder, '.github', 'mcp', 'microsoft-docs-mcp');
    
    return {
      id: 'microsoft-docs-mcp',
      name: 'Microsoft Docs MCP',
      description: 'Microsoft documentation search for best practices',
      category: 'documentation',
      transport: 'stdio',
      command: 'python',
      args: ['-m', 'microsoft_docs_mcp'],
      env: {
        PYTHONPATH: mcpPath,
      },
      enabled: true,
      tags: ['microsoft', 'documentation', 'best-practices', 'azure'],
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
   * Search Microsoft documentation
   */
  async search(
    query: string,
    options?: {
      limit?: number;
      category?: string;
    }
  ): Promise<ToolCallResponse<DocSearchResult>> {
    return this.callTool('search', {
      query,
      limit: options?.limit,
      category: options?.category,
    });
  }

  /**
   * Ping the server
   */
  async ping(): Promise<ToolCallResponse<{ status: string; service: string }>> {
    return this.callTool('ping', {});
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
}

/**
 * Create Microsoft Docs MCP adapter instance
 */
export function createMicrosoftDocsMCPAdapter(
  clientManager: MCPClientManager,
  workspaceFolder?: string
): MicrosoftDocsMCPAdapter {
  return new MicrosoftDocsMCPAdapter(clientManager, workspaceFolder);
}
