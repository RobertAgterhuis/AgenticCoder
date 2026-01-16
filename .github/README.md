# AgenticCoder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Azure](https://img.shields.io/badge/Azure-Enabled-0078D4.svg)](https://azure.microsoft.com/)

**AgenticCoder** is an intelligent multi-agent orchestration system that generates complete, production-ready codebases from project specifications. It uses **26 specialized AI agents** working through **16 orchestrated phases** to deliver fully functional applications with CI/CD pipelines, infrastructure-as-code, and comprehensive documentation.

<p align="center">
  <img src="./images/StackDroidSmall.jpg" alt="AgenticCoder Phase Flow" width="600">
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
├── src/mcp/                   # TypeScript MCP integration layer
│   ├── core/                  # Client manager, connection pool
│   ├── transport/             # Stdio, SSE, HTTP transports
│   ├── servers/               # 19+ server adapters
│   ├── health/                # Circuit breaker, retry policies
│   └── bridge.ts              # JS agent integration bridge
├── .github/                   # GitHub Copilot agents & skills
│   ├── agents/                # 17 agent definitions
│   ├── skills/                # 15 skill definitions
│   ├── mcp/                   # Python MCP servers
│   │   ├── azure-pricing-mcp/     # Azure pricing queries
│   │   ├── azure-resource-graph-mcp/ # Resource graph queries
│   │   └── microsoft-docs-mcp/    # Documentation search
│   └── scenarios/             # 10 test scenarios
└── Files/                     # Project plans & documentation
    └── AgenticCoderPlan/      # Detailed implementation plans
```

---

## 🔌 MCP Integration

### Python MCP Servers

| Server | Transport | Description |
|--------|-----------|-------------|
| **azure-pricing-mcp** | Stdio | Real-time Azure pricing via Retail Prices API |
| **azure-resource-graph-mcp** | Stdio | KQL queries for resource discovery |
| **microsoft-docs-mcp** | Stdio | Microsoft Learn documentation search |

### TypeScript MCP Layer (`src/mcp/`)

| Component | Description |
|-----------|-------------|
| **MCPGateway** | Unified entry point for all MCP operations |
| **MCPClientManager** | Connection pool and lifecycle management |
| **MCPBridge** | JavaScript agent integration bridge |
| **19+ Server Adapters** | GitHub, Docker, Kubernetes, Azure, etc. |
| **Health Monitoring** | Circuit breaker, retry policies, metrics |

### Usage Example

```typescript
import { MCPBridge } from './src/mcp/bridge';

const bridge = new MCPBridge({ workspaceFolder: process.cwd() });
await bridge.initialize();

// Azure pricing
const price = await bridge.getAzurePrice('Standard_B2s', 'westeurope');

// Resource discovery  
const vms = await bridge.listResourcesByType('Microsoft.Compute/virtualMachines');

// Documentation search
const docs = await bridge.getAzureBestPractices('security');
```

---

## 🧪 Testing

```bash
# Run all tests
cd agents && npm test
```

**Test Coverage:**
- ✅ 38+ MCP integration tests (CircuitBreaker, RetryPolicy)
- ✅ TypeScript compilation passing
- ✅ Health monitoring tests

Optional environment variables for live tests:
- `AGENTICCODER_RUN_LIVE_PRICING_TESTS=1` enables live Azure Retail Prices calls

---

## 🗺️ Roadmap

### ✅ Completed (v2.0)
- 26 specialized agents
- 16-phase orchestration
- Azure Bicep AVM resolver
- Self-learning error system
- Real-time monitoring dashboard
- **TypeScript MCP integration layer**
- **19+ MCP server adapters**
- **Circuit breaker & retry policies**

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

