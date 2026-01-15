# AgenticCoder Enhanced

AI-powered multi-agent system for Azure infrastructure management and deployment.

## 🎯 Project Status

- ✅ **Phase 1**: MCP Servers (Complete)
  - 3 operational servers with live Azure integration
  - 23 tests passing
  - CI/CD automated testing

- ✅ **Phase 2**: Agent Framework (Core complete)
  - Core framework + additional agents implemented
  - Workflow orchestration engine
  - Message bus + HTTP MCP client

- ✅ **Phase 3**: Bicep AVM Resolver
  - Implemented under `agents/bicep-avm-resolver/`

- 📋 **Phase 4-6**: Planned (see [ProjectPlan/](ProjectPlan/))

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (for Dev Container)
- Node.js 20+
- Azure CLI (for authentication)
- Azure subscription (for live queries)

### Option 1: Dev Container (Recommended)

1. Open this folder in VS Code
2. Click "Reopen in Container"
3. All dependencies pre-installed

### Option 2: Local Setup

#### Phase 1: MCP Servers

```powershell
# Azure Pricing Server (Port 3001)
cd servers/mcp-azure-pricing
npm install
npm start

# Azure Resource Graph Server (Port 3002)
cd servers/mcp-azure-resource-graph
npm install
npm start

# Azure Docs Server (Port 3003)
cd servers/mcp-azure-docs
npm install
npm start

# Run Tests
npm test  # In each server directory
```

#### Phase 2: Agent Framework

```powershell
cd agents
npm install

# Run example workflow
npm start

# Run tests
npm test
```

## 📚 Documentation

- [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - Quick reference guide
- [PHASE1-SETUP-GUIDE.md](PHASE1-SETUP-GUIDE.md) - MCP server setup (Azure credentials)
- [PHASE2-AGENT-FRAMEWORK.md](PHASE2-AGENT-FRAMEWORK.md) - Agent framework guide
- [PHASE2-COMPLETION-STATUS.md](PHASE2-COMPLETION-STATUS.md) - Current progress
- [MCP-TRANSPORT-GUIDE.md](MCP-TRANSPORT-GUIDE.md) - Safe migration from HTTP stubs to MCP stdio
- [ProjectPlan/](ProjectPlan/) - Complete 6-phase project plan

## 🏗️ Architecture

```
User Request
     ↓
Workflow Orchestration (WorkflowEngine)
     ↓
Agent Layer (TaskExtraction → ResourceAnalyzer → CostEstimator → ...)
     ↓
MCP Servers (Pricing | Resource Graph | Docs)
     ↓
Azure Services
```

## 🔧 Components

### MCP Servers (Phase 1)

| Server | Port | Features | Tests |
|--------|------|----------|-------|
| **Azure Pricing** | 3001 | Real-time pricing, caching, rate limiting | 7 ✅ |
| **Resource Graph** | 3002 | KQL queries, Azure auth, multi-subscription | 8 ✅ |
| **Azure Docs** | 3003 | Microsoft Learn search, facet filtering | 8 ✅ |

### Agent Framework (Phase 2)

| Component | Type | Description |
|-----------|------|-------------|
| **BaseAgent** | Core | Abstract base with lifecycle, validation, retry |
| **AgentRegistry** | Core | Agent discovery, dependency resolution |
| **WorkflowEngine** | Core | Multi-agent orchestration, error handling |
| **TaskExtractionAgent** | Task | Natural language → structured tasks |
| **ResourceAnalyzerAgent** | Infrastructure | Task → Azure resource requirements |
| **CostEstimatorAgent** | Infrastructure | Resources → cost estimates + optimization |

## 🧪 Testing

```powershell
# MCP Servers
cd servers/mcp-azure-pricing && npm test
cd servers/mcp-azure-resource-graph && npm test
cd servers/mcp-azure-docs && npm test

# Agent Framework
cd agents && npm test
```

Run tests per package (`servers/*`, `agents/`) for current totals.

## 📦 Example Usage

### Execute Workflow

```javascript
import { AgentRegistry, WorkflowEngine } from '@agenticcoder/agents';
import { TaskExtractionAgent, ResourceAnalyzerAgent, CostEstimatorAgent } from '@agenticcoder/agents';

const registry = new AgentRegistry();
const workflowEngine = new WorkflowEngine(registry);

// Register agents
const taskAgent = new TaskExtractionAgent();
await taskAgent.initialize();
registry.register(taskAgent);
// ... register other agents

// Define workflow
const workflow = {
  id: 'deployment',
  steps: [
    { id: 'extract', agentId: 'task-extraction', inputs: {} },
    { id: 'analyze', agentId: 'resource-analyzer', dependsOn: ['extract'] },
    { id: 'estimate', agentId: 'cost-estimator', dependsOn: ['analyze'] }
  ]
};

// Execute
const result = await workflowEngine.execute('deployment', {
  userRequest: 'Deploy Azure Function with storage in West Europe'
});

console.log(`Cost: $${result.outputs.cost.toFixed(2)}/month`);
```

See [agents/examples/simple-workflow.js](agents/examples/simple-workflow.js) for complete example.

## 🔐 Configuration

### Azure Authentication

MCP servers use DefaultAzureCredential:
1. Azure CLI: `az login`
2. Environment variables (see [PHASE1-SETUP-GUIDE.md](PHASE1-SETUP-GUIDE.md))
3. Managed Identity (Azure VMs)

### Environment Variables

Each server needs `.env`:

```env
# Resource Graph Server
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

See `.env.sample` in each server directory.

## 🚦 CI/CD

GitHub Actions runs:
- MCP server tests (matrix build)
- Agent framework tests
- Automated on push/PR

See [.github/workflows/ci.yml](.github/workflows/ci.yml)

## 🗺️ Roadmap

- ✅ Phase 1: MCP Servers (Complete)
- ✅ Phase 2: Agent Framework (Core complete)
- ✅ Phase 3: Bicep AVM Resolver
- 📋 Phase 4: DevOps Integration
- 📋 Phase 5: Advanced Features
- 📋 Phase 6: Production Hardening

## 🤝 Contributing

See full project plan in [ProjectPlan/](ProjectPlan/) for detailed architecture and implementation roadmap.

## 📄 License

MIT
