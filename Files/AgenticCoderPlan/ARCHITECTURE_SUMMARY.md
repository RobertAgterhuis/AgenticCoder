# AgenticCoder v2.0 - System Architecture

**Status**: ✅ **CORE IMPLEMENTATION COMPLETE**  
**Version**: 2.0.0  
**Last Updated**: January 2026

---

## 🎯 Executive Summary

**AgenticCoder** is a production-ready Azure infrastructure planning system that:

1. ✅ **Extracts** tasks from natural language requirements
2. ✅ **Analyzes** resources using DynamicResourceAnalyzer (94 providers, 365+ types)
3. ✅ **Estimates** costs via Azure Pricing MCP
4. ✅ **Generates** Bicep templates with schema validation
5. ✅ **Validates** against security and best practices

---

## 📊 System Overview

### Current Architecture

```
INPUT: User requirement (natural language or JSON scenario)
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO RUNNER (agents/scenarios/runScenario.js)               │
│   Orchestrates the full pipeline                                │
└─────────────────────────────────────────────────────────────────┘
  │
  ├──▶ [1] TASK EXTRACTION AGENT
  │         └─ Parse requirements → structured tasks
  │         └─ Location: agents/task/TaskExtractionAgent.js
  │
  ├──▶ [2] RESOURCE ANALYZER AGENT
  │         └─ Uses DynamicResourceAnalyzer
  │         └─ 94 providers, 365+ resource types
  │         └─ Solution template matching
  │         └─ Automatic dependency detection
  │         └─ Location: agents/infrastructure/ResourceAnalyzerAgent.js
  │
  ├──▶ [3] COST ESTIMATOR AGENT
  │         └─ Azure Pricing MCP integration
  │         └─ Dev/Prod cost differentiation
  │         └─ Location: agents/infrastructure/CostEstimatorAgent.js
  │
  ├──▶ [4] DEPLOYMENT PLANNER AGENT
  │         └─ Generates Bicep templates
  │         └─ Creates parameters.json
  │         └─ Creates deploy.sh
  │         └─ Location: agents/infrastructure/DeploymentPlannerAgent.js
  │
  └──▶ [5] VALIDATION AGENT
            └─ Security rules
            └─ Compliance checks
            └─ Best practices
            └─ Location: agents/validation/ValidationAgent.js
  │
  ▼
OUTPUT: Manifest + Resources + Cost Estimate + Bicep + Validation Report
```

---

## 🏗️ Core Components

### 1. DynamicResourceAnalyzer (⭐ Key Innovation)

**Location**: `agents/infrastructure/resource-analyzers/`

The heart of the system - replaces 22 individual analyzers with one unified engine.

```
DynamicResourceAnalyzer.js (647 lines)
│
├── analyze(task)           # Main entry point
├── _matchSolutionTemplate  # Find matching architecture template
├── _generateFromTemplate   # Generate resources from template
├── _inferResourcesFromContext  # Intelligent resource inference
├── _applyBestPractices     # Apply dev/prod settings
├── _detectDependencies     # Build dependency graph
└── _generateResourceForType # Create individual resource

Configuration (config/):
├── dependencyGraph.js      # "VM requires VNet, NIC"
├── solutionTemplates.js    # 15+ pre-built architectures
├── bestPractices.js        # Security defaults per environment
├── namingConventions.js    # Azure CAF naming (rg-, st, vm-, etc.)
└── index.js                # Central getConfig() export

Schema Discovery (schema-discovery/):
├── provider-schemas.json   # 94 Azure providers
└── SchemaValidator.js      # Runtime validation
```

### 2. Agent Framework

**Location**: `agents/core/`

| Component | File | Purpose |
|-----------|------|---------|
| BaseAgent | BaseAgent.js | Abstract base with lifecycle, validation |
| AgentRegistry | AgentRegistry.js | Discovery and registration |
| WorkflowEngine | WorkflowEngine.js | Multi-step orchestration |
| EnhancedMessageBus | EnhancedMessageBus.js | Phase-aware routing |
| UnifiedWorkflow | UnifiedWorkflow.js | 12-phase SDLC workflow |

### 3. Tooling Layer

**Location**: `agents/core/tooling/`

| Component | Purpose |
|-----------|---------|
| BaseToolClient | Abstract client interface |
| ToolClientFactory | Creates appropriate client type |
| HttpToolClient | HTTP-based tool calls |
| McpStdioToolClient | MCP stdio transport |

### 4. MCP Servers

**Location**: `servers/`

| Server | Port | Purpose |
|--------|------|---------|
| mcp-azure-docs | stdio | Microsoft Learn documentation |
| mcp-azure-pricing | 3001 | Azure Retail Prices API |
| mcp-azure-resource-graph | stdio | Resource Graph queries |

---

## 📁 Folder Structure

```
AgenticCoder/
├── agents/
│   ├── index.js                    # Main exports (v2.0.0)
│   ├── package.json
│   │
│   ├── core/                       # Framework
│   │   ├── BaseAgent.js
│   │   ├── AgentRegistry.js
│   │   ├── WorkflowEngine.js
│   │   ├── EnhancedMessageBus.js
│   │   ├── UnifiedWorkflow.js
│   │   ├── McpClient.js
│   │   ├── agents/                 # 14 specialized agents
│   │   └── tooling/                # Tool clients
│   │
│   ├── infrastructure/             # Infrastructure agents
│   │   ├── ResourceAnalyzerAgent.js
│   │   ├── CostEstimatorAgent.js
│   │   ├── DeploymentPlannerAgent.js
│   │   └── resource-analyzers/     # ⭐ Dynamic system
│   │       ├── DynamicResourceAnalyzer.js
│   │       ├── BaseResourceAnalyzer.js
│   │       ├── index.js
│   │       ├── config/
│   │       │   ├── dependencyGraph.js
│   │       │   ├── solutionTemplates.js
│   │       │   ├── bestPractices.js
│   │       │   ├── bestPracticesExtended.js
│   │       │   ├── namingConventions.js
│   │       │   └── index.js
│   │       └── schema-discovery/
│   │           ├── provider-schemas.json
│   │           └── SchemaValidator.js
│   │
│   ├── task/
│   │   └── TaskExtractionAgent.js
│   │
│   ├── validation/
│   │   └── ValidationAgent.js
│   │
│   ├── bicep-avm-resolver/         # AVM integration
│   │   ├── BicepAVMResolver.js
│   │   ├── 01-avm-registry/
│   │   ├── 02-resource-analyzer/
│   │   ├── 03-module-mapper/
│   │   ├── 04-template-transformer/
│   │   ├── 05-validation-engine/
│   │   └── 06-optimization-engine/
│   │
│   ├── scenarios/
│   │   └── runScenario.js
│   │
│   └── test/                       # 17 test files
│
├── servers/                        # MCP Servers
│   ├── mcp-azure-docs/
│   ├── mcp-azure-pricing/
│   └── mcp-azure-resource-graph/
│
├── test-data/                      # S01-S17 scenarios
├── schemas/                        # JSON schemas
└── Files/AgenticCoderPlan/         # Documentation
```

---

## 🔄 Data Flow

### Scenario Execution Flow

```
1. Load Scenario (JSON)
   └─ test-data/S01-simple-app-service.json

2. Task Extraction
   └─ Input:  { description, requirements, constraints }
   └─ Output: { tasks: [...], metadata }

3. Resource Analysis
   └─ Input:  { tasks }
   └─ Output: { resources: [...], dependencies: [...], solutionTemplate }
   └─ Uses:   DynamicResourceAnalyzer + config modules

4. Cost Estimation
   └─ Input:  { resources }
   └─ Output: { costEstimate: { monthly, yearly }, breakdown }
   └─ Uses:   Azure Pricing MCP

5. Deployment Planning
   └─ Input:  { resources, dependencies }
   └─ Output: { bicep: string, parameters: {}, deployScript: string }

6. Validation
   └─ Input:  { resources, bicep }
   └─ Output: { validationResults: [...], passed: bool, issues: [] }

7. Output Generation
   └─ manifest.json, resources.json, cost-estimate.json
   └─ validation.json, template.bicep, parameters.json, deploy.sh
```

---

## 📊 Supported Resources

### Provider Coverage

| Category | Providers | Example Types |
|----------|-----------|---------------|
| Compute | 8 | VMs, VMSS, Functions, Container Apps |
| Storage | 4 | Storage Accounts, Blob, Files, Queues |
| Network | 12 | VNets, NSGs, Load Balancers, App Gateway |
| Database | 6 | SQL, Cosmos DB, MySQL, PostgreSQL |
| Web | 4 | App Service, Static Web Apps |
| Containers | 5 | AKS, Container Instances, ACR |
| AI/ML | 8 | Cognitive Services, OpenAI, ML Workspace |
| Integration | 6 | Event Grid, Service Bus, Logic Apps |
| Security | 5 | Key Vault, Managed Identity |
| Monitoring | 4 | App Insights, Log Analytics |
| **Total** | **94** | **365+ resource types** |

### Solution Templates

| Template | Resources Generated |
|----------|---------------------|
| web-app-sql | App Service + SQL + App Insights |
| microservices-aks | AKS + ACR + Key Vault + VNet |
| event-driven | Functions + Event Grid + Storage |
| hub-spoke-network | Hub VNet + Spoke VNets + Firewall |
| data-platform | Synapse + Data Factory + Data Lake |
| ml-workspace | ML Workspace + Storage + Key Vault |
| api-management | APIM + App Service + Cosmos DB |
| iot-solution | IoT Hub + Stream Analytics + Storage |

---

## 🧪 Testing

### Run Tests

```bash
# Core framework tests
node --test agents/test/BaseAgent.test.js

# Workflow tests
node --test agents/test/WorkflowEngine.test.js

# Full scenario test
node --test agents/test/S01ScenarioRunner.test.js

# All together
node --test agents/test/BaseAgent.test.js agents/test/WorkflowEngine.test.js agents/test/S01ScenarioRunner.test.js
```

### Expected Results

```
✔ BaseAgent (7 tests)
✔ WorkflowEngine (14 tests)
✔ S01 scenario runner generates expected artifacts
ℹ tests 21 | pass 21 | fail 0
```

---

## 🔌 Extension Points

### Adding a New Resource Type

1. Add to `config/dependencyGraph.js`:
```javascript
'Microsoft.NewProvider/resources': {
  requires: ['Microsoft.Resources/resourceGroups'],
  optional: ['Microsoft.ManagedIdentity/userAssignedIdentities']
}
```

2. Add to `schema-discovery/provider-schemas.json`:
```json
{
  "Microsoft.NewProvider": {
    "resources": ["2024-01-01"]
  }
}
```

### Adding a Solution Template

Edit `config/solutionTemplates.js`:
```javascript
{
  id: 'my-template',
  name: 'My Architecture',
  keywords: ['specific', 'keywords'],
  resources: [
    { type: 'Microsoft.Web/sites', role: 'frontend' },
    { type: 'Microsoft.Sql/servers', role: 'database' }
  ]
}
```

---

*Last updated: January 2026*
