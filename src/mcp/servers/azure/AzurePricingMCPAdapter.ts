/**
 * Azure Pricing MCP Server Adapter
 * 
 * Native TypeScript implementation using Azure Retail Prices API
 * @module mcp/servers/azure/AzurePricingMCPAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition, ToolCallResponse } from '../../types';

/**
 * Azure Retail Prices API configuration
 */
const PRICING_API_URL = 'https://prices.azure.com/api/retail/prices';
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF = 500;

/**
 * Price search result item from Azure Retail Prices API
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
  type: string;
  isPrimaryMeterRegion: boolean;
  tierMinimumUnits?: number;
  effectiveStartDate?: string;
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
 * Azure Retail Prices API response
 */
interface AzurePricingApiResponse {
  BillingCurrency: string;
  CustomerEntityId: string;
  CustomerEntityType: string;
  Items: PriceItem[];
  NextPageLink: string | null;
  Count: number;
}

/**
 * Azure Pricing adapter configuration
 */
export interface AzurePricingAdapterConfig extends ServerAdapterConfig {
  defaultRegion?: string;
  defaultCurrency?: string;
  maxRetries?: number;
  timeoutMs?: number;
  backoffMs?: number;
}

/**
 * Azure Pricing MCP Adapter
 * 
 * Native TypeScript implementation for Azure Retail Prices API
 * No Python dependency required
 */
export class AzurePricingMCPAdapter extends BaseServerAdapter {
  private defaultRegion: string | undefined;
  private defaultCurrency: string | undefined;
  private maxRetries: number;
  private timeoutMs: number;
  private backoffMs: number;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<AzurePricingAdapterConfig>
  ) {
    super(clientManager, config);
    this.defaultRegion = config?.defaultRegion || process.env.AZURE_PRICING_REGION;
    this.defaultCurrency = config?.defaultCurrency || process.env.AZURE_PRICING_CURRENCY;
    this.maxRetries = config?.maxRetries ?? DEFAULT_RETRIES;
    this.timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT;
    this.backoffMs = config?.backoffMs ?? DEFAULT_BACKOFF;
  }

  /**
   * Get server identifier
   */
  getServerId(): string {
    return 'azure-pricing-mcp';
  }

  /**
   * Get server definition (native implementation - no external process)
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'azure-pricing-mcp',
      name: 'Azure Pricing MCP',
      description: 'Real-time Azure pricing data via Retail Prices API (native TypeScript)',
      category: 'data',
      transport: 'native', // Native implementation, no subprocess
      command: '', // No external command needed
      args: [],
      env: {},
      enabled: true,
      tags: ['azure', 'pricing', 'cost', 'estimation', 'native'],
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
   * Initialize the adapter (override - no external process to register)
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
        name: 'price_search',
        description: 'Search Azure Retail Prices for a SKU name (optionally filtered by region/currency)',
        inputSchema: {
          type: 'object',
          properties: {
            sku: { type: 'string', description: 'SKU name to search for' },
            region: { type: 'string', description: 'Azure region filter (e.g., eastus)' },
            currency: { type: 'string', description: 'Currency code (e.g., USD)' },
          },
          required: ['sku'],
        },
      },
      {
        name: 'cost_estimate',
        description: 'Estimate monthly cost for a SKU and quantity',
        inputSchema: {
          type: 'object',
          properties: {
            sku: { type: 'string', description: 'SKU name' },
            quantity: { type: 'integer', description: 'Number of instances (minimum 1)' },
            region: { type: 'string', description: 'Azure region filter' },
            currency: { type: 'string', description: 'Currency code' },
          },
          required: ['sku'],
        },
      },
      {
        name: 'ping',
        description: 'Health check for the pricing service',
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
   * OData string literal escaping
   */
  private odataEscape(value: string): string {
    return value.replace(/'/g, "''");
  }

  /**
   * Fetch prices from Azure Retail Prices API with retry logic
   */
  private async fetchPrices(filterExpr: string): Promise<AzurePricingApiResponse> {
    const url = new URL(PRICING_API_URL);
    url.searchParams.set('$filter', filterExpr);

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

        return await response.json() as AzurePricingApiResponse;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Pricing API attempt ${attempt + 1} failed: ${lastError.message}`);
        
        if (attempt < this.maxRetries - 1) {
          await this.sleep(this.backoffMs * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Failed to fetch pricing data');
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    try {
      if (!sku || typeof sku !== 'string' || !sku.trim()) {
        return {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'sku must be a non-empty string', retryable: false },
        };
      }

      if (sku.length > 200) {
        return {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'sku is too long', retryable: false },
        };
      }

      const skuEscaped = this.odataEscape(sku.trim());
      const filters: string[] = [`contains(skuName,'${skuEscaped}')`];

      const region = options?.region || this.defaultRegion;
      const currency = options?.currency || this.defaultCurrency;

      if (region) {
        filters.push(`armRegionName eq '${this.odataEscape(region)}'`);
      }
      if (currency) {
        filters.push(`currencyCode eq '${this.odataEscape(currency)}'`);
      }

      const filterExpr = filters.join(' and ');
      const data = await this.fetchPrices(filterExpr);

      return {
        success: true,
        data: {
          status: 'ok',
          tool: 'price_search',
          sku,
          count: data.Items?.length || 0,
          items: (data.Items || []).slice(0, 5),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`price_search failed: ${message}`);
      return {
        success: false,
        error: { code: 'API_ERROR', message, retryable: true },
      };
    }
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
    try {
      const search = await this.priceSearch(sku, options);
      
      if (!search.success || !search.data?.items?.length) {
        return {
          success: true,
          data: {
            status: 'not-found',
            tool: 'cost_estimate',
            sku,
          },
        };
      }

      const price = search.data.items[0].retailPrice || 0;
      const monthly = price * quantity * 730; // hours per month

      return {
        success: true,
        data: {
          status: 'ok',
          tool: 'cost_estimate',
          sku,
          quantity,
          unit_price: price,
          monthly_usd: monthly,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`cost_estimate failed: ${message}`);
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
        service: 'azure-pricing-mcp',
      },
    };
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

  /**
   * Override callTool for native implementation
   */
  async callTool<T = unknown>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResponse<T>> {
    switch (toolName) {
      case 'price_search':
        return this.priceSearch(
          args.sku as string,
          { region: args.region as string, currency: args.currency as string }
        ) as Promise<ToolCallResponse<T>>;
      
      case 'cost_estimate':
        return this.costEstimate(
          args.sku as string,
          (args.quantity as number) || 1,
          { region: args.region as string, currency: args.currency as string }
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
 * Create Azure Pricing MCP adapter instance
 */
export function createAzurePricingMCPAdapter(
  clientManager: MCPClientManager,
  config?: Partial<AzurePricingAdapterConfig>
): AzurePricingMCPAdapter {
  return new AzurePricingMCPAdapter(clientManager, config);
}
