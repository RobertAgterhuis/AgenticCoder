# MCP Integration Layer

The MCP (Model Context Protocol) layer provides a unified interface for AI agents to interact with Azure and Microsoft services.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MCPBridge                                     │
│  (Unified entry point for all MCP server interactions)              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ AzurePricing      │ │ AzureResourceGraph│ │ MicrosoftDocs     │
│ MCPAdapter        │ │ MCPAdapter        │ │ MCPAdapter        │
│                   │ │                   │ │                   │
│ • priceSearch()   │ │ • query()         │ │ • search()        │
│ • costEstimate()  │ │ • listResources() │ │ • searchBicep()   │
│ • getVMPrice()    │ │ • findByTag()     │ │ • getServiceDocs()│
└───────────────────┘ └───────────────────┘ └───────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ Azure Retail      │ │ Azure Resource    │ │ Microsoft Learn   │
│ Prices API        │ │ Graph REST API    │ │ Search API        │
│ (No Auth)         │ │ (Azure CLI Auth)  │ │ (No Auth)         │
└───────────────────┘ └───────────────────┘ └───────────────────┘
```

## Features

### Native TypeScript Implementation
All MCP servers are implemented as native TypeScript classes using direct HTTP calls - no Python subprocess dependencies.

### Built-in Resilience
- **Retry Policy**: Configurable exponential backoff with jitter
- **Circuit Breaker**: Prevents cascade failures
- **Health Monitoring**: Continuous server health checks

### Type Safety
Full TypeScript type definitions for all requests and responses.

## Usage

```typescript
import { MCPBridge } from './bridge';

// Initialize the bridge
const bridge = new MCPBridge({
  defaultSubscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  defaultRegion: 'westeurope'
});

// Get Azure pricing
const pricing = bridge.getAdapter('azure-pricing-mcp');
const result = await pricing.priceSearch({
  sku: 'Standard_B2s',
  region: 'westeurope'
});

// Query Azure resources
const resourceGraph = bridge.getAdapter('azure-resource-graph-mcp');
const vms = await resourceGraph.query({
  query: "Resources | where type == 'microsoft.compute/virtualmachines'"
});

// Search documentation
const docs = bridge.getAdapter('microsoft-docs-mcp');
const articles = await docs.search({
  query: 'azure functions best practices',
  limit: 10
});
```

## Directory Structure

```
src/mcp/
├── bridge.ts              # Main MCPBridge entry point
├── types.ts               # Type definitions
├── index.ts               # Module exports
├── servers/
│   └── azure/             # Native Azure adapters
│       ├── AzurePricingMCPAdapter.ts
│       ├── AzureResourceGraphMCPAdapter.ts
│       ├── MicrosoftDocsMCPAdapter.ts
│       └── __tests__/     # Unit tests
├── core/                  # Core MCP infrastructure
├── health/                # Circuit breaker & retry policies
├── transport/             # Transport layer abstractions
├── binding/               # Tool binding utilities
└── utils/                 # Logging & utilities
```

## Available Adapters

### AzurePricingMCPAdapter
Query Azure retail prices for cost estimation.

| Tool | Description |
|------|-------------|
| `priceSearch` | Search prices by SKU, region, currency |
| `costEstimate` | Calculate monthly cost for a resource |
| `getVMPrice` | Get price for a specific VM size |
| `estimateInfrastructureCost` | Aggregate costs for multiple resources |
| `ping` | Health check |

### AzureResourceGraphMCPAdapter
Query Azure resources using KQL (Kusto Query Language).

| Tool | Description |
|------|-------------|
| `query` | Execute raw KQL query |
| `listResourcesByType` | List resources of a specific type |
| `listResourcesInGroup` | List all resources in a resource group |
| `findResourcesByTag` | Find resources with a specific tag |
| `getResourceCountByType` | Get resource counts grouped by type |
| `ping` | Health check |

### MicrosoftDocsMCPAdapter
Search Microsoft Learn documentation.

| Tool | Description |
|------|-------------|
| `search` | General documentation search |
| `searchAzureBestPractices` | Search Azure best practices |
| `searchBicepDocs` | Search Bicep documentation |
| `getServiceDocs` | Get docs for a specific Azure service |
| `searchSecurityGuidance` | Search security guidance |
| `searchArchitecturePatterns` | Search architecture patterns |
| `ping` | Health check |

## Configuration

Configuration is managed through the `MCPBridgeConfig` interface:

```typescript
interface MCPBridgeConfig {
  defaultSubscriptionId?: string;
  defaultRegion?: string;
  timeoutMs?: number;
  retryPolicy?: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
  };
}
```

## Error Handling

All adapters return typed error responses:

```typescript
interface MCPError {
  error: string;
  code?: string;
  retryable: boolean;
}
```

## Testing

Run tests for the MCP layer:

```bash
npm test -- --testPathPattern="src/mcp"
```

## See Also

- [.github/mcp/](../../.github/mcp/) - MCP configuration files
- [Files/AgenticCoderPlan/](../../Files/AgenticCoderPlan/) - Project planning documents
