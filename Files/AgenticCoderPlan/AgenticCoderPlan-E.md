# AgenticCoder Plan-E: MCP Server Architecture & Creation Strategy

**Status**: New Addition (January 13, 2026)  
**Purpose**: Comprehensive guide to creating and managing MCP (Model Context Protocol) servers  
**Approach**: Following azure-agentic-infraops patterns and best practices  
**Scope**: v1.0 focus with extensibility for v1.1+

---

> ## ✅ Document Status: CURRENT (Azure-Only)
> 
> This MCP architecture document is **accurate and current**. The three Azure MCP servers are implemented:
> 
> | Server | Location | Status |
> |--------|----------|--------|
> | mcp-azure-docs | `servers/mcp-azure-docs/` | ✅ Operational |
> | mcp-azure-pricing | `servers/mcp-azure-pricing/` | ✅ Operational |
> | mcp-azure-resource-graph | `servers/mcp-azure-resource-graph/` | ✅ Operational |
> 
> **Note**: AgenticCoder is Azure-only. References to AWS/GCP MCP servers in this document are historical.
> 
> **Tooling Layer**: `agents/core/tooling/` provides:
> - `McpStdioToolClient.js` - stdio transport
> - `HttpToolClient.js` - HTTP transport
> - `ToolClientFactory.js` - Creates appropriate client

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Part 1: MCP Architecture Foundation](#part-1-mcp-architecture-foundation)
3. [Part 2: MCP Server Specifications](#part-2-mcp-server-specifications)
4. [Part 3: Azure Pricing MCP Server - Complete Guide](#part-3-azure-pricing-mcp-server--complete-guide)
5. [Part 4: MCP Integration with Agents](#part-4-mcp-integration-with-agents)
6. [Part 5: MCP Configuration in VS Code](#part-5-mcp-configuration-in-vs-code)
7. [Part 6: Extensibility Patterns for New MCP Servers](#part-6-extensibility-patterns-for-new-mcp-servers)

---

## Executive Summary

**What is MCP?**
Model Context Protocol (MCP) is an open-source protocol that enables AI assistants (Claude, GitHub Copilot) to interact with external tools and data sources through standardized interfaces. Each MCP server exposes a set of tools that agents can invoke.

**Why MCP in AgenticCoder?**
- **Real-Time Data**: Access current pricing, governance data, documentation
- **Agent Autonomy**: Agents can make decisions based on accurate external information
- **Extensibility**: New Azure services = new MCP tools
- **Decoupling**: Tools are independent, can be versioned/deployed separately
- **Vendor Neutral**: Not locked into a single AI platform

**v1.0 MCP Servers** (3 required + 2 optional):
1. ✅ **azure-pricing-mcp** - Real-time Azure pricing (REQUIRED)
2. ✅ **azure-resource-graph-mcp** - Azure governance queries (REQUIRED)
3. ✅ **microsoft-docs-mcp** - Search Microsoft documentation (REQUIRED)
4. 📋 **web-search-mcp** - General web search (OPTIONAL)
5. 📋 **bicep-validator-mcp** - Local Bicep validation (OPTIONAL)

**Future Expansion** (Azure-focused):
- azure-security-mcp (security recommendations)
- azure-advisor-mcp (cost/performance optimization)
- azure-monitor-mcp (metrics and logs)

---

## Part 1: MCP Architecture Foundation

### 1.1 What is the Model Context Protocol?

**Definition**: MCP is a standardized protocol for connecting AI models to external tools, data, and services.

**Core Concepts**:
```
┌─────────────────┐
│   AI Assistant  │  (Claude, Copilot, etc.)
│  (ChatGPT, etc) │
└────────┬────────┘
         │
    (MCP Protocol)
         │
┌────────▼─────────────┬──────────────────┬────────────────┐
│ MCP Server 1         │ MCP Server 2     │ MCP Server 3   │
│ (azure-pricing)      │ (azure-resource) │ (microsoft-doc)│
├──────────────────────┼──────────────────┼────────────────┤
│ Tools:               │ Tools:           │ Tools:         │
│ • price_search       │ • query_policies │ • search_docs  │
│ • price_compare      │ • list_resources │ • get_section  │
│ • cost_estimate      │ • assess_scope   │ • code_example │
│ • region_recommend   │ • check_compliance
│ • sku_discovery      │
└──────────────────────┴──────────────────┴────────────────┘
         │                    │                    │
    (REST API)        (Azure GraphAPI)     (Search API)
         │                    │                    │
    ┌────▼─────┐   ┌─────────▼────┐  ┌────────────▼───┐
    │Azure      │   │Azure         │  │Microsoft       │
    │Retail     │   │Resource      │  │Learn           │
    │Prices API │   │Graph API     │  │Documentation   │
    └──────────┘    └──────────────┘  └────────────────┘
```

### 1.2 MCP vs Traditional API Integration

| Aspect | Traditional API | MCP Server |
|--------|-----------------|-----------|
| **Discovery** | Manual documentation | Built-in tool listing |
| **Type Safety** | Variable | Strong (typed tools) |
| **Error Handling** | Manual try-catch | Standardized protocol |
| **Tool Versioning** | External management | Server version controlled |
| **Agent Integration** | Custom code | Plug-and-play |
| **Extensibility** | Code changes needed | New server + config |

### 1.3 How Agents Use MCP Tools

**Example: bicep-plan Agent Workflow**

```
User Request:
"Create a bicep plan for a 3-tier app with SQL DB in East US 2"

↓

bicep-plan Agent:
├─ Parse requirements
├─ Call azure-pricing-mcp:
│  ├─ "What's the price of Standard_D4s_v5 in East US 2?"
│  └─ "Compare storage costs across East/West regions"
├─ Call azure-resource-graph-mcp:
│  ├─ "List governance policies for compute"
│  └─ "Check resource naming conventions"
├─ Call microsoft-docs-mcp:
│  ├─ "Best practices for 3-tier apps"
│  └─ "SQL Database disaster recovery patterns"
├─ Synthesize findings
└─ Generate implementation plan

↓

Output:
"02-implementation-plan.md" with:
  - Resource specifications (size, location)
  - Cost estimates (monthly breakdown)
  - Governance compliance checklist
  - Best practice references
```

### 1.4 MCP Protocol Flow

**Startup Sequence**:
```
1. VS Code loads mcp.json
   ├─ Reads server definitions
   └─ Finds command/args for each server

2. For each MCP server:
   ├─ Spawn process (Python, Node, Docker)
   ├─ Establish stdio connection
   ├─ Exchange initialization handshake
   └─ Server responds with available tools

3. Agent/Copilot receives tool list
   ├─ Registers tools in local namespace
   └─ Tools become available in chat/code

4. When agent calls a tool:
   ├─ Request sent via MCP protocol
   ├─ Server processes request
   ├─ Response sent back with result
   └─ Agent continues with result
```

---

## Part 2: MCP Server Specifications

### 2.1 V1.0 Required Servers

#### **Server 1: azure-pricing-mcp** (Python)

**Purpose**: Real-time Azure pricing queries  
**Status**: Existing in azure-agentic-infraops (copy or reference)  
**Language**: Python 3.10+  
**Location**: `mcp/azure-pricing-mcp/`

**Tools Provided**:
```python
tools = {
    "azure_price_search": {
        "description": "Search Azure retail prices with flexible filtering",
        "params": {
            "service": "str (e.g., 'Virtual Machine', 'SQL Database')",
            "region": "str (e.g., 'East US 2')",
            "filter": "str (optional additional filters)"
        }
    },
    "azure_price_compare": {
        "description": "Compare prices across regions or SKUs",
        "params": {
            "sku": "str (e.g., 'Standard_D4s_v5')",
            "regions": "list[str]"
        }
    },
    "azure_cost_estimate": {
        "description": "Estimate monthly/yearly costs",
        "params": {
            "sku": "str",
            "region": "str",
            "hours_per_month": "float",
            "quantity": "int"
        }
    },
    "azure_region_recommend": {
        "description": "Find cheapest regions for a SKU",
        "params": {
            "sku": "str",
            "max_results": "int (default: 5)"
        }
    },
    "azure_discover_skus": {
        "description": "List available SKUs for a service",
        "params": {
            "service": "str"
        }
    },
    "azure_sku_discovery": {
        "description": "Fuzzy match service name to SKUs",
        "params": {
            "query": "str (e.g., 'vm' → 'Virtual Machines')"
        }
    }
}
```

**Data Source**: Azure Retail Prices API (public, no auth)  
**Rate Limit**: Built-in retry logic  
**Typical Latency**: 200-500ms per query

---

#### **Server 2: azure-resource-graph-mcp** (Python)

**Purpose**: Query Azure governance, policies, compliance  
**Status**: Needs to be created  
**Language**: Python 3.10+  
**Location**: `mcp/azure-resource-graph-mcp/`

**Tools Provided**:
```python
tools = {
    "query_resource_graph": {
        "description": "Execute KQL queries on Azure resources",
        "params": {
            "query": "str (KQL query)",
            "subscription": "str (optional)"
        }
    },
    "list_policies": {
        "description": "List applicable Azure Policy definitions",
        "params": {
            "scope": "str (subscription, resource group)"
        }
    },
    "check_compliance": {
        "description": "Check if a resource design complies with policies",
        "params": {
            "resource_type": "str (e.g., 'Microsoft.Compute/virtualMachines')",
            "properties": "dict (resource properties)"
        }
    },
    "get_naming_conventions": {
        "description": "Get CAF naming conventions for resource type",
        "params": {
            "resource_type": "str",
            "environment": "str (prod, dev, test)"
        }
    },
    "assess_governance_scope": {
        "description": "Assess governance maturity level",
        "params": {
            "scope": "str"
        }
    }
}
```

**Authentication**: Azure CLI (uses existing credentials)  
**Rate Limit**: Azure Resource Graph defaults  
**Typical Latency**: 300-1000ms per query

---

#### **Server 3: microsoft-docs-mcp** (Node.js or Python)

**Purpose**: Search and retrieve Microsoft documentation  
**Status**: Needs to be created  
**Language**: Node.js or Python  
**Location**: `mcp/microsoft-docs-mcp/`

**Tools Provided**:
```javascript
tools = {
    "search_docs": {
        "description": "Search Microsoft Learn and Azure Docs",
        "params": {
            "query": "str",
            "service": "str (optional: 'Azure', 'Microsoft365', etc.)"
        }
    },
    "get_doc_section": {
        "description": "Get specific section from documentation",
        "params": {
            "url": "str",
            "section": "str (optional)"
        }
    },
    "find_code_samples": {
        "description": "Find code examples for a topic",
        "params": {
            "topic": "str",
            "language": "str (Bicep, PowerShell, Python, etc.)"
        }
    },
    "get_best_practices": {
        "description": "Get best practices for a service",
        "params": {
            "service": "str (e.g., 'App Service', 'SQL Database')"
        }
    },
    "get_waf_pillar_guidance": {
        "description": "Get WAF guidance for a specific pillar",
        "params": {
            "pillar": "str (Security, Reliability, Performance, Cost, Operations)",
            "service": "str (optional)"
        }
    }
}
```

**Data Source**: Microsoft Learn API + web scraping  
**Cache Strategy**: Store popular results locally  
**Typical Latency**: 500-2000ms per query (with cache benefits)

---

### 2.2 V1.0 Optional Servers

#### **Server 4: web-search-mcp** (Node.js)

**Purpose**: General web search for architecture decisions  
**Status**: Optional for v1.0  
**Language**: Node.js  
**Location**: `mcp/web-search-mcp/`

**Tools**:
- `web_search` - Search the internet
- `get_webpage_content` - Retrieve and summarize webpage

---

#### **Server 5: bicep-validator-mcp** (Local Node.js)

**Purpose**: Validate Bicep templates locally (vs. remote)  
**Status**: Optional for v1.0  
**Language**: Node.js (wraps Azure CLI)  
**Location**: `mcp/bicep-validator-mcp/`

**Tools**:
- `validate_bicep` - Run `bicep build` locally
- `lint_bicep` - Run linting rules
- `analyze_bicep_security` - Basic security checks

---

## Part 3: Azure Pricing MCP Server - Complete Guide

### 3.1 Why Start with Azure Pricing MCP?

**Strategic Importance**:
1. ✅ Fully open-source (MIT license)
2. ✅ Production-ready in azure-agentic-infraops
3. ✅ High-value agent tool (used in Phase 2 & Phase 3)
4. ✅ No authentication required (public API)
5. ✅ Good example for creating other MCP servers

### 3.2 Project Structure

```
mcp/azure-pricing-mcp/
├── .venv/                          # Virtual environment (created during setup)
│   ├── bin/ (Linux/Mac)
│   │   ├── python
│   │   ├── pip
│   │   └── activate
│   └── Scripts/ (Windows)
│       ├── python.exe
│       ├── pip.exe
│       └── activate.bat
│
├── src/
│   └── azure_pricing_mcp/
│       ├── __init__.py             # Package initialization
│       ├── __main__.py             # Entry point: python -m azure_pricing_mcp
│       ├── server.py               # Main MCP server implementation (500+ lines)
│       │   ├── ServerConfig dataclass
│       │   ├── class PricingMCPServer
│       │   ├── async def main()
│       │   └── Tool definitions + handlers
│       ├── handlers.py             # Tool handler functions
│       │   ├── async def handle_price_search()
│       │   ├── async def handle_price_compare()
│       │   ├── async def handle_cost_estimate()
│       │   ├── async def handle_region_recommend()
│       │   ├── async def handle_discover_skus()
│       │   └── async def handle_sku_discovery()
│       └── utils.py               # Helper functions
│           ├── format_price()
│           ├── parse_region()
│           ├── calculate_monthly_cost()
│           └── apply_savings_plans()
│
├── scripts/
│   ├── install.py                 # Cross-platform setup script
│   ├── setup.ps1                  # PowerShell setup (Windows)
│   ├── run_server.py              # Server runner with error handling
│   ├── healthcheck.py             # Validate server is running
│   ├── setup_vscode.py            # Configure .vscode/mcp.json
│   └── test_tools.py              # Test each tool
│
├── tests/                         # 51+ tests
│   ├── test_server.py
│   ├── test_handlers.py
│   ├── test_utils.py
│   ├── test_integration.py
│   └── fixtures/
│
├── docs/
│   ├── DEVELOPMENT.md             # Development setup
│   ├── PROJECT_STRUCTURE.md       # Detailed structure
│   ├── API_EXAMPLES.md            # Tool usage examples
│   └── TROUBLESHOOTING.md
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated testing
│
├── Dockerfile                      # Docker image definition
├── .dockerignore
│
├── requirements.txt               # Python dependencies:
│                                  # mcp>=1.0.0
│                                  # aiohttp>=3.9.0
│                                  # pydantic>=2.0.0
│                                  # requests>=2.31.0
│                                  # (+ dev: pytest, black, flake8)
│
├── pyproject.toml                 # Package metadata
├── INSTALL.md                     # Detailed installation guide
├── DOCKER.md                      # Docker setup guide
├── README.md                      # Main documentation
└── LICENSE                        # MIT license
```

### 3.3 Implementation Path: Option A (Copy from azure-agentic-infraops)

**FASTEST for v1.0**: Copy existing implementation

**Steps**:
```bash
# 1. Create directory
mkdir -p mcp/azure-pricing-mcp
cd mcp/azure-pricing-mcp

# 2. Copy from azure-agentic-infraops (or clone)
git clone https://github.com/jonathan-vella/azure-agentic-infraops.git temp-repo
cp -r temp-repo/mcp/azure-pricing-mcp/* .
rm -rf temp-repo

# 3. Set up Python virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows PowerShell

# 4. Install dependencies
pip install -r requirements.txt

# 5. Test the server
cd src
python -m azure_pricing_mcp
# Should output: MCP server starting on stdio...
```

**Time**: ~15 minutes  
**Result**: Production-ready azure-pricing-mcp with all 6 tools

### 3.4 Implementation Path: Option B (Build Custom Version)

**For learning or customization**

**Step 1: Create Base Structure**
```bash
mkdir -p mcp/azure-pricing-mcp/src/azure_pricing_mcp
mkdir -p mcp/azure-pricing-mcp/scripts
mkdir -p mcp/azure-pricing-mcp/tests
mkdir -p mcp/azure-pricing-mcp/docs
```

**Step 2: Create requirements.txt**
```
mcp>=1.0.0
aiohttp>=3.9.0
pydantic>=2.0.0
requests>=2.31.0
python-dotenv>=1.0.0
```

**Step 3: Create __init__.py**
```python
# src/azure_pricing_mcp/__init__.py
__version__ = "1.0.0"
__author__ = "AgenticCoder"

from .server import PricingMCPServer, ServerConfig

__all__ = ["PricingMCPServer", "ServerConfig"]
```

**Step 4: Create __main__.py** (Entry point)
```python
# src/azure_pricing_mcp/__main__.py
import asyncio
import sys

from .server import main

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
```

**Step 5: Create server.py** (Main implementation - 400-600 lines)
```python
# src/azure_pricing_mcp/server.py
import asyncio
import json
from dataclasses import dataclass
from typing import Any

import aiohttp
from mcp.server import Server
from mcp.types import Tool, TextContent
from pydantic import BaseModel

@dataclass
class ServerConfig:
    """Configuration for the MCP server"""
    api_base_url: str = "https://prices.azure.com/api/retail/prices"
    timeout: int = 30
    max_retries: int = 3

class PricingMCPServer:
    def __init__(self, config: ServerConfig = None):
        self.config = config or ServerConfig()
        self.server = Server("azure-pricing")
        self.session: aiohttp.ClientSession = None
        
    async def initialize(self):
        """Initialize the server and register tools"""
        # Register tools
        self.server.set_tool(
            Tool(
                name="azure_price_search",
                description="Search Azure retail prices with flexible filtering",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "service": {"type": "string", "description": "Service name"},
                        "region": {"type": "string", "description": "Azure region"},
                        "filter": {"type": "string", "description": "Additional filter"}
                    },
                    "required": ["service"]
                }
            ),
            self.handle_price_search
        )
        # ... register other tools similarly

    async def handle_price_search(self, service: str, region: str = None, filter: str = None):
        """Query Azure Retail Prices API"""
        # Build query
        # Execute request
        # Parse response
        # Return formatted result
        pass

    async def start(self):
        """Start the server"""
        self.session = aiohttp.ClientSession()
        await self.initialize()
        await self.server.start()

async def main():
    config = ServerConfig()
    server = PricingMCPServer(config)
    await server.start()

if __name__ == "__main__":
    asyncio.run(main())
```

**Step 6: Create handlers.py** (Tool implementations)
```python
# src/azure_pricing_mcp/handlers.py
import requests
from typing import Dict, List, Optional

class PricingAPI:
    BASE_URL = "https://prices.azure.com/api/retail/prices"
    
    @staticmethod
    def search_prices(service: str, region: str = None) -> List[Dict]:
        """Query Azure Retail Prices API"""
        filters = [f"serviceName eq '{service}'"]
        if region:
            filters.append(f"armRegionName eq '{region}'")
        
        filter_str = " and ".join(filters)
        params = {"$filter": filter_str}
        
        response = requests.get(PricingAPI.BASE_URL, params=params, timeout=30)
        response.raise_for_status()
        
        return response.json().get("Items", [])
    
    @staticmethod
    def compare_regions(sku: str, regions: List[str]) -> Dict:
        """Compare prices across regions"""
        results = {}
        for region in regions:
            prices = PricingAPI.search_prices(sku, region)
            results[region] = prices[0] if prices else None
        return results
    
    @staticmethod
    def estimate_monthly_cost(sku: str, region: str, hours_per_month: float, quantity: int) -> float:
        """Estimate monthly cost"""
        prices = PricingAPI.search_prices(sku, region)
        if not prices:
            return 0
        
        hourly_rate = float(prices[0]["retailPrice"])
        return hourly_rate * hours_per_month * quantity
```

**Step 7: Test the Server**
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Test
cd src
python -m azure_pricing_mcp

# In another terminal, test a tool
python -c "
from azure_pricing_mcp.handlers import PricingAPI
prices = PricingAPI.search_prices('Virtual Machines', 'East US 2')
print(f'Found {len(prices)} prices')
for p in prices[:3]:
    print(f\"  {p['armSkuName']}: \${p['retailPrice']}/hour\")
"
```

**Time**: ~2-3 hours for custom implementation  
**Result**: Deep understanding of MCP architecture + custom features

### 3.5 Recommendation for v1.0

**Use Option A (Copy)** ✅
- Saves 2+ weeks of development time
- Production-tested code
- All tools already implemented
- Can customize later for v1.1+

---

## Part 4: MCP Integration with Agents

### 4.1 How bicep-plan Agent Uses azure-pricing-mcp

**Scenario: Agent planning infrastructure for 3-tier app**

```yaml
Agent: bicep-plan
Phase: Phase 3 (Planning)

Workflow:
  Step 1: Parse requirements
    Input: "3-tier app (web, app, db), East US 2, prod"
    ↓
    
  Step 2: Estimate compute needs
    azure-pricing-mcp call:
      tool: azure_price_search
      params:
        service: "Virtual Machines"
        region: "East US 2"
    Response: [
      { armSkuName: "Standard_D4s_v5", retailPrice: 0.456 },
      { armSkuName: "Standard_D8s_v5", retailPrice: 0.912 },
      ...
    ]
    ↓
    
  Step 3: Calculate monthly costs
    azure-pricing-mcp call:
      tool: azure_cost_estimate
      params:
        sku: "Standard_D4s_v5"
        region: "East US 2"
        hours_per_month: 730
        quantity: 3  # Web + App + DB nodes
    Response: monthly_cost = $1,001.52
    ↓
    
  Step 4: Compare region options
    azure-pricing-mcp call:
      tool: azure_region_recommend
      params:
        sku: "Standard_D4s_v5"
    Response: [
      { region: "East US", price: $0.436, savings_vs_primary: "5%" },
      { region: "Central US", price: $0.408, savings_vs_primary: "11%" },
      { region: "East US 2", price: $0.456, savings_vs_primary: "0%" }
    ]
    ↓
    
  Step 5: Generate plan
    Output: "02-implementation-plan.md"
      Resource Configuration:
        - Web tier: 2x Standard_D4s_v5 = $912/month
        - App tier: 2x Standard_D8s_v5 = $1,331/month  
        - DB tier: 1x Standard_D16s_v5 = $3,648/month
      Total Monthly Cost: $5,891
      Regional Savings: Could save 11% by using Central US
```

### 4.2 How azure-principal-architect Agent Uses Multiple MCPs

```yaml
Agent: azure-principal-architect
Phase: Phase 2 (Assessment)

Workflow:
  Step 1: Analyze requirements → use microsoft-docs-mcp
    tool: get_waf_pillar_guidance
    params: pillar="Security", service="App Service"
    
  Step 2: Estimate costs → use azure-pricing-mcp
    tool: azure_cost_estimate
    params: sku="Premium_P1V2", region="East US 2", hours=730
    
  Step 3: Check compliance → use azure-resource-graph-mcp
    tool: check_compliance
    params: resource_type="Microsoft.Web/sites", properties={...}
    
  Step 4: Get naming conventions → use azure-resource-graph-mcp
    tool: get_naming_conventions
    params: resource_type="Microsoft.Web/sites", environment="prod"
    
  Output: "02-assessment.md" with WAF scores, cost estimates, compliance status
```

### 4.3 MCP Tool Availability by Phase

| Phase | Agent | Required Tools | Optional Tools |
|-------|-------|-----------------|----------------|
| **Phase 0** | None | None | None |
| **Phase 1** | @plan | None | web-search-mcp |
| **Phase 2** | azure-principal-architect | azure-pricing-mcp, microsoft-docs-mcp, azure-resource-graph-mcp | web-search-mcp |
| **Phase 3** | Design agents | microsoft-docs-mcp | web-search-mcp |
| **Phase 4** | bicep-plan | azure-pricing-mcp, azure-resource-graph-mcp, microsoft-docs-mcp | bicep-validator-mcp |
| **Phase 5** | bicep-implement | microsoft-docs-mcp, bicep-validator-mcp | None |
| **Phase 6** | deploy-coordinator | None | None |
| **Phase 7** | doc-writer | microsoft-docs-mcp | None |

---

## Part 5: MCP Configuration in VS Code

### 5.1 Understanding .vscode/mcp.json

**Purpose**: Tells VS Code where MCP servers are located and how to start them

**Location**: `.vscode/mcp.json` in repository root

**Template**:
```json
{
  "servers": {
    "server-id": {
      "type": "stdio",
      "command": "path/to/executable",
      "args": ["arg1", "arg2"],
      "cwd": "/path/to/working/directory",
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

### 5.2 Configuration for v1.0 Servers

**Complete mcp.json for AgenticCoder v1.0**:
```json
{
  "servers": {
    "azure-pricing": {
      "type": "stdio",
      "command": "${workspaceFolder}/mcp/azure-pricing-mcp/.venv/bin/python",
      "args": ["-m", "azure_pricing_mcp"],
      "cwd": "${workspaceFolder}/mcp/azure-pricing-mcp/src",
      "env": {
        "PYTHONUNBUFFERED": "1"
      }
    },
    "azure-resource-graph": {
      "type": "stdio",
      "command": "${workspaceFolder}/mcp/azure-resource-graph-mcp/.venv/bin/python",
      "args": ["-m", "azure_resource_graph_mcp"],
      "cwd": "${workspaceFolder}/mcp/azure-resource-graph-mcp/src",
      "env": {
        "PYTHONUNBUFFERED": "1"
      }
    },
    "microsoft-docs": {
      "type": "stdio",
      "command": "${workspaceFolder}/mcp/microsoft-docs-mcp/.venv/bin/node",
      "args": ["lib/index.js"],
      "cwd": "${workspaceFolder}/mcp/microsoft-docs-mcp",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**For Windows PowerShell** (path format adjustment):
```json
{
  "servers": {
    "azure-pricing": {
      "type": "stdio",
      "command": "C:/Users/YourUser/path/to/AgenticCoder/mcp/azure-pricing-mcp/.venv/Scripts/python.exe",
      "args": ["-m", "azure_pricing_mcp"],
      "cwd": "${workspaceFolder}/mcp/azure-pricing-mcp/src"
    }
  }
}
```

### 5.3 Testing MCP Configuration

**Step 1: Verify .vscode/mcp.json syntax**
```bash
# In VS Code, open Command Palette (Ctrl+Shift+P)
# Run: Preferences: Open Settings (JSON)
# Look for section on MCP servers
```

**Step 2: List available servers**
```
Command Palette → "MCP: List Servers"
Should show:
  ✓ azure-pricing (with 6 tools)
  ✓ azure-resource-graph (with 5 tools)
  ✓ microsoft-docs (with 5 tools)
```

**Step 3: Test tool invocation**
```
Open Copilot Chat and type:
"@azure-pricing What's the price of Standard_D4s_v5 in East US 2?"

Should return:
"According to azure-pricing MCP server: 
 Standard_D4s_v5 in East US 2 costs $0.456/hour or ~$333/month (730 hours)"
```

---

## Part 6: Extensibility Patterns for New MCP Servers

### 6.1 Template for Creating New MCP Server

**Use this template when building new servers (aws-pricing-mcp, gcp-pricing-mcp, etc.)**

**Step 1: Project Structure**
```
mcp/[service]-mcp/
├── .venv/
├── src/[service]_mcp/
│   ├── __init__.py
│   ├── __main__.py
│   ├── server.py       # Main server + tool registration
│   ├── handlers.py     # Tool implementations
│   └── utils.py        # Helper functions
├── scripts/
│   ├── install.py
│   ├── setup.ps1
│   └── run_server.py
├── tests/
│   ├── test_server.py
│   ├── test_handlers.py
│   └── test_integration.py
├── docs/
│   ├── README.md
│   ├── INSTALL.md
│   └── API_EXAMPLES.md
├── requirements.txt
├── Dockerfile
└── README.md
```

**Step 2: Minimal __main__.py**
```python
import asyncio
from .server import main

if __name__ == "__main__":
    asyncio.run(main())
```

**Step 3: server.py Pattern**
```python
import asyncio
from mcp.server import Server
from mcp.types import Tool, TextContent

class CustomMCPServer:
    def __init__(self):
        self.server = Server(name="[service]-mcp")
        
    async def initialize(self):
        """Register all tools"""
        self.server.set_tool(
            Tool(
                name="tool_name",
                description="What this tool does",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "param1": {"type": "string"},
                        "param2": {"type": "integer"}
                    },
                    "required": ["param1"]
                }
            ),
            self.handle_tool_name
        )
        
    async def handle_tool_name(self, param1: str, param2: int = None):
        """Implement tool logic here"""
        # 1. Validate inputs
        # 2. Call external API
        # 3. Format response
        # 4. Return result
        return TextContent(text="Result here")
        
    async def start(self):
        await self.initialize()
        await self.server.start()

async def main():
    server = CustomMCPServer()
    await server.start()
```

**Step 4: Testing Template**
```python
import pytest
from [service]_mcp.handlers import CustomAPI

@pytest.mark.asyncio
async def test_tool_name():
    # Setup
    # Execute
    result = await CustomAPI.method()
    # Assert
    assert result is not None
```

### 6.2 Version-Specific MCP Servers

**v1.0 (Current)**: 3 required, 2 optional
```
✅ azure-pricing-mcp
✅ azure-resource-graph-mcp
✅ microsoft-docs-mcp
📋 web-search-mcp (optional)
📋 bicep-validator-mcp (optional)
```

**v1.1 (AWS Support)**: Add 2
```
➕ aws-pricing-mcp (new)
➕ aws-governance-mcp (new)
```

**v2.0 (GCP + K8s)**: Add 2
```
➕ gcp-pricing-mcp (new)
➕ kubernetes-resource-mcp (new)
```

**v3.0+ (Specialized Domains)**: Add N
```
➕ dataops-catalog-mcp
➕ mlops-registry-mcp
➕ security-governance-mcp
➕ finops-optimization-mcp
```

### 6.3 MCP Server Development Checklist

**For each new MCP server** ✅

- [ ] **Project Setup**
  - [ ] Create folder in `mcp/[name]-mcp/`
  - [ ] Initialize Git repo
  - [ ] Create virtual environment
  - [ ] Setup requirements.txt

- [ ] **Core Implementation**
  - [ ] Write __init__.py
  - [ ] Write __main__.py (entry point)
  - [ ] Write server.py (main class)
  - [ ] Write handlers.py (tool implementations)
  - [ ] Write utils.py (helpers)

- [ ] **Tool Registration**
  - [ ] Define each tool with proper schema
  - [ ] Implement tool handlers
  - [ ] Add error handling
  - [ ] Add rate limiting (if needed)

- [ ] **Testing**
  - [ ] Write unit tests
  - [ ] Write integration tests
  - [ ] Test each tool manually
  - [ ] Test in VS Code

- [ ] **Documentation**
  - [ ] Write README.md
  - [ ] Write INSTALL.md
  - [ ] Write API_EXAMPLES.md
  - [ ] Add inline code documentation

- [ ] **Docker & CI/CD**
  - [ ] Create Dockerfile
  - [ ] Test Docker build
  - [ ] Create GitHub Actions workflow
  - [ ] Test automated tests

- [ ] **Integration**
  - [ ] Add to .vscode/mcp.json
  - [ ] Test with agents
  - [ ] Update agent documentation
  - [ ] Add to AgenticCoderPlan-F (Docker Dev Container)

---

## Summary

**Part 1**: Understood MCP architecture and why it matters for AgenticCoder  
**Part 2**: Reviewed 3 required v1.0 servers and future expansion  
**Part 3**: Deep dive into azure-pricing-mcp with 2 implementation options  
**Part 4**: Mapped agent tool usage patterns  
**Part 5**: Configured VS Code for MCP servers  
**Part 6**: Created extensibility patterns for new servers

**Next Step**: See [AgenticCoderPlan-F](./AgenticCoderPlan-F.md) for Docker Dev Container setup with MCP server integration.

---

**Document Status**: Complete ✅  
**Date Created**: January 13, 2026  
**Word Count**: ~4,500  
**Complexity**: Advanced (requires MCP protocol knowledge)  
**Time to Implement**: 2-4 weeks (v1.0 servers)

---

**Key Files Created**:
- Plan-E.md (this document) - MCP architecture and creation
- Plan-F.md (next) - Docker Dev Container integration

**Cross-References**:
- [Plan-B: Architecture](./AgenticCoderPlan-B.md#part-4-integration-layer-design) (MCP architecture overview)
- [Plan-C: Implementation](./AgenticCoderPlan-C.md#sprint-3-4-foundation-phase) (Sprint 3-4 MCP setup)
- [Plan-D: Extended Roadmap](./AgenticCoderPlan-D.md#part-1-version-roadmap) (v1.1+ MCP servers)
