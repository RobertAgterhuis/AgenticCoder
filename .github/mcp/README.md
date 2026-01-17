# AgenticCoder MCP Configuration

This folder contains MCP configuration for the AgenticCoder project.

## Architecture

All MCP servers are now **native TypeScript** implementations in `src/mcp/servers/azure/`:

| Adapter | API | Authentication |
|---------|-----|----------------|
| **AzurePricingMCPAdapter** | Azure Retail Prices API | None (public) |
| **AzureResourceGraphMCPAdapter** | Azure REST API | Azure CLI |
| **MicrosoftDocsMCPAdapter** | Microsoft Learn Search API | None (public) |

The Python implementations have been removed in favor of a unified TypeScript MCP layer.

## Configuration

- `mcp.json`: Legacy configuration template (kept for reference)
- The actual MCP integration is handled by `src/mcp/bridge.ts`

## Usage

```typescript
import { MCPBridge } from './src/mcp/bridge';

const bridge = new MCPBridge({
  defaultSubscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  defaultRegion: 'westeurope'
});

// Use native TypeScript adapters
const pricing = bridge.getAdapter('azure-pricing-mcp');
const resourceGraph = bridge.getAdapter('azure-resource-graph-mcp');
const docs = bridge.getAdapter('microsoft-docs-mcp');
```

## See Also

- [src/mcp/README.md](../../src/mcp/README.md) - Full MCP layer documentation
- [src/mcp/servers/azure/](../../src/mcp/servers/azure/) - Native adapter implementations
