/**
 * MCP Bridge for JavaScript Agents
 * 
 * Provides a CommonJS-compatible interface for JavaScript agents
 * to use the TypeScript MCP infrastructure.
 * 
 * @module mcp/bridge
 */

import { MCPGateway, createMCPGateway } from './integration/MCPGateway';
import { MCPClientManager, createClientManager } from './core/MCPClientManager';
import { 
  AzurePricingMCPAdapter,
  AzureResourceGraphMCPAdapter,
  MicrosoftDocsMCPAdapter,
} from './servers/azure';
import { ToolCallResponse, MCPServerDefinition } from './types';

/**
 * Simplified interface for JS agents
 */
export interface MCPBridgeConfig {
  workspaceFolder?: string;
  subscriptionId?: string;
  defaultRegion?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * MCP Bridge - Single entry point for JS agents
 * 
 * Usage from JavaScript:
 * ```javascript
 * const { MCPBridge } = require('./src/mcp/bridge');
 * 
 * const bridge = new MCPBridge({ workspaceFolder: process.cwd() });
 * await bridge.initialize();
 * 
 * // Call a tool
 * const result = await bridge.callTool('azure-pricing-mcp', 'price_search', { sku: 'Standard_B1s' });
 * 
 * // Use convenience methods
 * const price = await bridge.getAzurePrice('Standard_B2s', 'westeurope');
 * ```
 */
export class MCPBridge {
  private config: MCPBridgeConfig;
  private gateway: MCPGateway | null = null;
  private clientManager: MCPClientManager | null = null;
  private initialized = false;

  constructor(config: MCPBridgeConfig = {}) {
    this.config = {
      workspaceFolder: config.workspaceFolder || process.cwd(),
      subscriptionId: config.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID,
      logLevel: config.logLevel || 'info',
    };
  }

  /**
   * Initialize the MCP bridge
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Create client manager
    this.clientManager = createClientManager();
    await this.clientManager.initialize();

    // Register native TypeScript MCP adapters
    const workspaceFolder = this.config.workspaceFolder!;
    
    const pricingAdapter = new AzurePricingMCPAdapter(this.clientManager, {
      defaultRegion: this.config.defaultRegion,
    });
    const resourceGraphAdapter = new AzureResourceGraphMCPAdapter(this.clientManager, {
      subscriptionId: this.config.subscriptionId,
    });
    const docsAdapter = new MicrosoftDocsMCPAdapter(this.clientManager, {});

    // Initialize adapters (no external process registration needed)
    await pricingAdapter.initialize();
    await resourceGraphAdapter.initialize();
    await docsAdapter.initialize();

    // Create gateway with config
    this.gateway = createMCPGateway({
      enableDefaultServers: false,
      autoInitialize: false,
    });
    await this.gateway.initialize();

    this.initialized = true;
  }

  /**
   * Ensure bridge is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.gateway) {
      throw new Error('MCPBridge not initialized. Call initialize() first.');
    }
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool<T = unknown>(
    serverId: string,
    toolName: string,
    args: Record<string, unknown> = {}
  ): Promise<ToolCallResponse<T>> {
    this.ensureInitialized();
    return this.gateway!.callTool(toolName, args, { serverId }) as Promise<ToolCallResponse<T>>;
  }

  /**
   * Check if a server is healthy
   */
  async isServerHealthy(serverId: string): Promise<boolean> {
    this.ensureInitialized();
    try {
      const result = await this.callTool(serverId, 'ping', {});
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get all registered servers
   */
  getRegisteredServers(): string[] {
    this.ensureInitialized();
    return this.clientManager!.getServerIds();
  }

  // =========================================================================
  // Convenience methods for Azure Pricing
  // =========================================================================

  /**
   * Search Azure prices for a SKU
   */
  async searchAzurePrices(
    sku: string,
    region?: string,
    currency?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('azure-pricing-mcp', 'price_search', {
      sku,
      region,
      currency,
    });
  }

  /**
   * Get Azure price for a VM size
   */
  async getAzurePrice(
    vmSize: string,
    region: string = 'westeurope'
  ): Promise<number | null> {
    const result = await this.searchAzurePrices(vmSize, region);
    
    if (result.success && result.data) {
      const data = result.data as { items?: Array<{ retailPrice: number }> };
      if (data.items?.length) {
        return data.items[0].retailPrice;
      }
    }
    
    return null;
  }

  /**
   * Estimate monthly cost
   */
  async estimateMonthlyCost(
    sku: string,
    quantity: number = 1,
    region?: string
  ): Promise<number | null> {
    const result = await this.callTool('azure-pricing-mcp', 'cost_estimate', {
      sku,
      quantity,
      region,
    });

    if (result.success && result.data) {
      const data = result.data as { monthly_usd?: number };
      return data.monthly_usd ?? null;
    }

    return null;
  }

  // =========================================================================
  // Convenience methods for Azure Resource Graph
  // =========================================================================

  /**
   * Execute a Resource Graph query
   */
  async queryResourceGraph(query: string): Promise<ToolCallResponse> {
    return this.callTool('azure-resource-graph-mcp', 'query', { query });
  }

  /**
   * List resources by type
   */
  async listResourcesByType(
    resourceType: string,
    limit: number = 100
  ): Promise<Array<Record<string, unknown>>> {
    const result = await this.queryResourceGraph(`
      resources
      | where type =~ '${resourceType}'
      | limit ${limit}
    `);

    if (result.success && result.data) {
      const data = result.data as { data?: Array<Record<string, unknown>> };
      return data.data || [];
    }

    return [];
  }

  // =========================================================================
  // Convenience methods for Microsoft Docs
  // =========================================================================

  /**
   * Search Microsoft documentation
   */
  async searchDocs(
    query: string,
    limit: number = 5
  ): Promise<ToolCallResponse> {
    return this.callTool('microsoft-docs-mcp', 'search', { query, limit });
  }

  /**
   * Get Azure best practices documentation
   */
  async getAzureBestPractices(
    topic: string
  ): Promise<Array<{ title: string; url: string; description: string }>> {
    const result = await this.searchDocs(`Azure ${topic} best practices`);

    if (result.success && result.data) {
      const data = result.data as { results?: Array<{ title: string; url: string; description: string }> };
      return data.results || [];
    }

    return [];
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================

  /**
   * Disconnect all servers
   */
  async disconnect(): Promise<void> {
    if (this.clientManager) {
      await this.clientManager.shutdown();
    }
    this.initialized = false;
    this.gateway = null;
    this.clientManager = null;
  }
}

/**
 * Create an MCPBridge instance
 */
export function createMCPBridge(config?: MCPBridgeConfig): MCPBridge {
  return new MCPBridge(config);
}

// Default export for CommonJS compatibility
export default MCPBridge;
