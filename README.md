# AgenticCoder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Azure](https://img.shields.io/badge/Azure-Enabled-0078D4.svg)](https://azure.microsoft.com/)

**AgenticCoder** is an intelligent multi-agent orchestration system that generates complete, production-ready codebases from project specifications. It uses **26 specialized AI agents** working through **16 orchestrated phases** to deliver fully functional applications with CI/CD pipelines, infrastructure-as-code, and comprehensive documentation.

<p align="center">
  <img src="Files/github/phase-flow.svg" alt="AgenticCoder Phase Flow" width="600">
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **26 Specialized Agents** | From planning to deployment, each agent has expertise in its domain |
| 🔄 **16-Phase Orchestration** | Systematic workflow from requirements to production-ready code |
| ☁️ **Azure-First** | Native Azure integration with Bicep IaC and AVM modules |
| 🧪 **Self-Learning** | Error classification, pattern detection, and automatic fix generation |
| 📊 **Real-time Monitoring** | Dashboard, alerts, and execution tracking |
| 🔌 **MCP Integration** | Model Context Protocol servers for Azure pricing, docs, and resource graph |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** 
- **Azure CLI** (for Azure authentication)
- **VS Code** with GitHub Copilot (recommended)
- **Docker Desktop** (optional, for Dev Container)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR-ORG/AgenticCoder.git
cd AgenticCoder

# Install dependencies
cd agents && npm install
cd ../servers/mcp-azure-pricing && npm install
cd ../mcp-azure-docs && npm install
cd ../mcp-azure-resource-graph && npm install
```

### Run Your First Project

```bash
# Start the agent framework
cd agents
npm start

# Run tests to verify setup
npm test
```

### Dev Container (Recommended)

1. Open folder in VS Code
2. Click **"Reopen in Container"** when prompted
3. All dependencies are pre-installed

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[Wiki Home](../../wiki)** | Complete documentation hub |
| **[Getting Started](../../wiki/Getting-Started)** | Step-by-step setup guide |
| **[User Guide](../../wiki/User-Guide)** | How to use AgenticCoder |
| **[Developer Guide](../../wiki/Developer-Guide)** | Contributing and extending |
| **[API Reference](../../wiki/API-Reference)** | Technical API documentation |
| **[Roadmap](../../wiki/Roadmap)** | Future plans and releases |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER REQUEST                             │
│              (Project Specification + Goals)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────▼───────────────┐
          │   ORCHESTRATION TIER          │
          │   Phases 1-8 (9 agents)       │
          │   @plan → @doc → @architect   │
          └───────────────┬───────────────┘
                          │
          ┌───────────────▼───────────────┐
          │   ARCHITECTURE TIER           │
          │   Phases 9-12 (4 agents)      │
          │   @azure-architect → @bicep   │
          └───────────────┬───────────────┘
                          │
          ┌───────────────▼───────────────┐
          │   IMPLEMENTATION TIER         │
          │   Phases 13-15 (13 agents)    │
          │   Frontend + Backend + DB     │
          └───────────────┬───────────────┘
                          │
          ┌───────────────▼───────────────┐
          │        MCP SERVERS            │
          │   Pricing | Docs | Resources  │
          └───────────────┬───────────────┘
                          │
          ┌───────────────▼───────────────┐
          │      AZURE SERVICES           │
          └───────────────────────────────┘
```

---

## 🎯 Supported Technology Stacks

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React, Vue, Angular, Svelte |
| **Backend** | Node.js, .NET, Python, Go, Java |
| **Database** | PostgreSQL, MySQL, MongoDB |
| **Cloud** | Azure (primary), AWS, GCP (planned) |
| **IaC** | Bicep (Azure), Terraform (planned) |
| **CI/CD** | GitHub Actions, Azure DevOps |

---

## 📦 Project Structure

```
AgenticCoder/
├── agents/                    # Agent framework and implementations
│   ├── core/                  # Core orchestration engine
│   │   ├── execution/         # Execution bridge
│   │   ├── feedback/          # Feedback loop system
│   │   ├── orchestration/     # Monitoring & dashboards
│   │   └── self-learning/     # Error learning system
│   ├── bicep-avm-resolver/    # Azure Bicep AVM pipeline
│   ├── task/                  # Task extraction engine
│   └── validation/            # Validation framework
├── servers/                   # MCP servers
│   ├── mcp-azure-pricing/     # Azure pricing queries
│   ├── mcp-azure-docs/        # Azure documentation
│   └── mcp-azure-resource-graph/  # Resource graph queries
├── .github/                   # GitHub Copilot agents & skills
│   ├── agents/                # 17 agent definitions
│   ├── skills/                # 15 skill definitions
│   └── scenarios/             # 10 test scenarios
└── Files/                     # Project plans & documentation
    └── AgenticCoderPlan/      # Detailed implementation plans
```

---

## 🧪 Testing

```bash
# Run all tests
cd agents && npm test

# Run specific test suites
npm test -- --grep "WorkflowEngine"
npm test -- --grep "SelfLearning"

# Test with Azure MCP (requires Azure credentials)
AGENTICCODER_TEST_AZURE_MCP_SCHEMA=1 npm test
```

**Test Coverage:**
- ✅ 70+ unit tests passing
- ✅ Integration tests for all core components
- ✅ 17 scenario tests (S01-S17)

---

## 🗺️ Roadmap

### ✅ Completed (v2.0)
- 26 specialized agents
- 16-phase orchestration
- Azure Bicep AVM resolver
- Self-learning error system
- Real-time monitoring dashboard

### 🔜 Q1 2026 (v2.1)
- Local AI assistant (Docker container)
- Enhanced framework support (Remix, SvelteKit, Next.js)
- 40% faster execution

### 📋 Q2 2026 (v2.2)
- Microservices architecture patterns
- Enterprise features (multi-region, DR)
- Additional database agents

See full [Roadmap](../../wiki/Roadmap) for details.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../wiki/Contributing) for details.

```bash
# Fork the repository
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm test

# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Azure Verified Modules (AVM) team
- GitHub Copilot team
- All contributors

---

<p align="center">
  <b>Built with ❤️ for the Azure community</b>
</p>

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

Optional live tests:

- `AGENTICCODER_RUN_LIVE_PRICING_TESTS=1` enables a live Azure Retail Prices call from the agent MCP stdio integration test.

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
