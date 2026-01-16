/**
 * Azure MCP Server Adapters
 * 
 * Local Python MCP servers for Azure operations
 * @module mcp/servers/azure
 */

export { 
  AzurePricingMCPAdapter, 
  createAzurePricingMCPAdapter 
} from './AzurePricingMCPAdapter';
export type { 
  PriceItem, 
  PriceSearchResult, 
  CostEstimateResult 
} from './AzurePricingMCPAdapter';

export { 
  AzureResourceGraphMCPAdapter, 
  createAzureResourceGraphMCPAdapter 
} from './AzureResourceGraphMCPAdapter';
export type { 
  ResourceGraphResult, 
  ResourceGraphResource 
} from './AzureResourceGraphMCPAdapter';

export { 
  MicrosoftDocsMCPAdapter, 
  createMicrosoftDocsMCPAdapter 
} from './MicrosoftDocsMCPAdapter';
export type { 
  DocSearchItem, 
  DocSearchResult 
} from './MicrosoftDocsMCPAdapter';
