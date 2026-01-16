/**
 * Azure Pricing MCP Server Adapter
 * 
 * Connects to the local Python MCP server for Azure pricing data
 * @module mcp/servers/azure/AzurePricingMCPAdapter
 */

import { BaseServerAdapter } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition, ToolCallResponse } from '../../types';
import * as path from 'path';

/**
 * Price search result item
 */
export interface PriceItem {
  skuName: string;
  productName: string;
  serviceName: string;
  armRegionName: string;
  retailPrice: number;
  currencyCode: string;
  unitOfMeasure: string;
  meterName: string;
}

/**
 * Price search result
 */
export interface PriceSearchResult {
  status: string;
  tool: string;
  sku: string;
  count: number;
  items: PriceItem[];
}

/**
 * Cost estimate result
 */
export interface CostEstimateResult {
  status: string;
  tool: string;
  sku: string;
  quantity?: number;
  unit_price?: number;
  monthly_usd?: number;
}

/**
 * Azure Pricing MCP Adapter
 * 
 * Provides access to Azure Retail Prices API via local Python MCP server
 */
export class AzurePricingMCPAdapter extends BaseServerAdapter {
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
    return 'azure-pricing-mcp';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    const mcpPath = path.join(this.workspaceFolder, '.github', 'mcp', 'azure-pricing-mcp');
    
    return {
      id: 'azure-pricing-mcp',
      name: 'Azure Pricing MCP',
      description: 'Real-time Azure pricing data for cost estimation',
      category: 'data',
      transport: 'stdio',
      command: 'python',
      args: ['-m', 'azure_pricing_mcp'],
      env: {
        PYTHONPATH: mcpPath,
      },
      enabled: true,
      tags: ['azure', 'pricing', 'cost', 'estimation'],
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
   * Search for Azure pricing by SKU name
   */
  async priceSearch(
    sku: string,
    options?: {
      region?: string;
      currency?: string;
    }
  ): Promise<ToolCallResponse<PriceSearchResult>> {
    return this.callTool('price_search', {
      sku,
      region: options?.region,
      currency: options?.currency,
    });
  }

  /**
   * Estimate monthly cost for a SKU
   */
  async costEstimate(
    sku: string,
    quantity: number = 1,
    options?: {
      region?: string;
      currency?: string;
    }
  ): Promise<ToolCallResponse<CostEstimateResult>> {
    return this.callTool('cost_estimate', {
      sku,
      quantity,
      region: options?.region,
      currency: options?.currency,
    });
  }

  /**
   * Ping the server
   */
  async ping(): Promise<ToolCallResponse<{ status: string; service: string }>> {
    return this.callTool('ping', {});
  }

  /**
   * Get price for a specific VM size
   */
  async getVMPrice(
    vmSize: string,
    region: string = 'westeurope'
  ): Promise<number | null> {
    const result = await this.priceSearch(vmSize, { region });
    
    if (result.success && result.data?.items?.length) {
      return result.data.items[0].retailPrice;
    }
    
    return null;
  }

  /**
   * Estimate monthly cost for infrastructure
   */
  async estimateInfrastructureCost(
    resources: Array<{ sku: string; quantity: number; region?: string }>
  ): Promise<{
    total: number;
    breakdown: Array<{ sku: string; monthly: number }>;
  }> {
    const breakdown: Array<{ sku: string; monthly: number }> = [];
    let total = 0;

    for (const resource of resources) {
      const estimate = await this.costEstimate(
        resource.sku,
        resource.quantity,
        { region: resource.region }
      );

      if (estimate.success && estimate.data?.monthly_usd) {
        breakdown.push({
          sku: resource.sku,
          monthly: estimate.data.monthly_usd,
        });
        total += estimate.data.monthly_usd;
      }
    }

    return { total, breakdown };
  }
}

/**
 * Create Azure Pricing MCP adapter instance
 */
export function createAzurePricingMCPAdapter(
  clientManager: MCPClientManager,
  workspaceFolder?: string
): AzurePricingMCPAdapter {
  return new AzurePricingMCPAdapter(clientManager, workspaceFolder);
}
