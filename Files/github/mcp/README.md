# AgenticCoder MCP Servers

This folder contains the Model Context Protocol (MCP) servers for real-time data integration.

## Available Servers (v1.0)

### 1. azure-pricing-mcp (REQUIRED)
**Purpose**: Real-time Azure pricing data for cost estimation  
**Status**: Stub CLI in place (ping, price_search, cost_estimate return JSON); requirements.txt added  
**Tools (to implement)**: price_search, cost_estimate, price_compare, region_recommend, discover_skus, sku_discovery

### 2. azure-resource-graph-mcp (REQUIRED)
**Purpose**: Azure Resource Graph queries for governance  
**Status**: Stub CLI in place (ping, query returning JSON); requirements.txt added  
**Tools (to implement)**: Query execution, compliance checks

### 3. microsoft-docs-mcp (REQUIRED)
**Purpose**: Microsoft documentation search  
**Status**: Stub CLI in place (ping, search returning JSON); requirements.txt added  
**Tools (to implement)**: Documentation search, best practices lookup

## Configuration

MCP servers are configured in `mcp.json` and referenced in VS Code settings.

Quick CLI examples (stubs return JSON):

```bash
# Pricing
python -m azure_pricing_mcp ping
python -m azure_pricing_mcp price_search Standard_B1s
python -m azure_pricing_mcp cost_estimate Standard_B1s 2

# Resource Graph
python -m azure_resource_graph_mcp ping
python -m azure_resource_graph_mcp query "resources | limit 1"

# Docs search
python -m microsoft_docs_mcp ping
python -m microsoft_docs_mcp search bicep
```

See [Plan-E](../../AgenticCoderPlan/AgenticCoderPlan-E.md) for implementation details.

## Implementation Options

### Option A: Copy from azure-agentic-infraops
Fastest approach - copy working implementation

### Option B: Build Custom
Learning approach - implement from scratch following Plan-E specifications

## Setup Instructions

1. Use repo venv (`.venv`) via post-create to install per-server requirements.txt
2. Configure in VS Code (`.vscode/settings.json`) and `.github/mcp/mcp.json`
3. Test with `.github/mcp/smoke-test.sh` (stubs return 0 and log TODO)
4. Once implemented, add health-check commands per server

See [Plan-F Part 5](../../AgenticCoderPlan/AgenticCoderPlan-F.md#part-5-mcp-server-integration-in-dev-container) for Dev Container integration.
