# Getting Started

Get up and running with AgenticCoder in **15 minutes**.

---

## 📋 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 20+ | Runtime environment |
| **npm** | 8+ | Package management |
| **Git** | Latest | Version control |
| **VS Code** | Latest | Recommended IDE |
| **Azure CLI** | Latest | Azure authentication |

### Optional

| Software | Purpose |
|----------|---------|
| **Docker Desktop** | Dev Container support |
| **GitHub Copilot** | Enhanced agent experience |

### Azure Access

For full functionality, you need:
- Azure subscription (free tier works)
- Azure CLI logged in (`az login`)

---

## 🚀 Installation

### Option 1: Dev Container (Recommended)

The easiest way to get started - everything pre-configured!

1. **Install Prerequisites**
   - [VS Code](https://code.visualstudio.com/)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Clone & Open**
   ```bash
   git clone https://github.com/YOUR-ORG/AgenticCoder.git
   code AgenticCoder
   ```

3. **Reopen in Container**
   - VS Code will prompt: "Reopen in Container"
   - Click **Yes**
   - Wait for container to build (~2-3 minutes first time)

4. **Done!** All dependencies are installed.

### Option 2: Local Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/YOUR-ORG/AgenticCoder.git
   cd AgenticCoder
   ```

2. **Install Agent Framework**
   ```bash
   cd agents
   npm install
   ```

3. **Verify Installation**
   ```bash
   npm test
   ```
   
   You should see: `✓ 38+ tests passing`

---

## ✅ Verify Setup

### Run Tests

```bash
cd agents
npm test
```

**Expected output:**
```
✓ CircuitBreaker tests (19 tests)
✓ RetryPolicy tests (19 tests)
...
ℹ tests 38+, pass 38+, fail 0
```

### Check Azure Connection (Optional)

```bash
# Login to Azure
az login

# Run Azure-enabled tests
AGENTICCODER_TEST_AZURE_MCP_SCHEMA=1 npm test
```

---

## 🎯 Your First Project

### Step 1: Choose a Scenario

AgenticCoder comes with 5 pre-configured scenarios:

| Scenario | Description | Stack | Duration |
|----------|-------------|-------|----------|
| **S01** | Solo MVP | React + Node.js + PostgreSQL | 4-6 weeks |
| **S02** | Startup | React + Node.js + MongoDB | 12-16 weeks |
| **S03** | Medium SaaS | React + Node.js + AKS | 24-32 weeks |
| **S04** | Enterprise | Angular + Java + Oracle | 48-60 weeks |
| **S05** | Healthcare | React + Node.js + HIPAA | 36-48 weeks |

**Recommendation:** Start with **S01** for your first project.

### Step 2: Run the Workflow

```bash
cd agents
npm start
```

This starts the WorkflowEngine which orchestrates all agents.

### Step 3: Invoke @plan Agent

In VS Code with GitHub Copilot, use:

```
@plan Create a todo application with React frontend and Node.js backend,
PostgreSQL database, deployed on Azure using GitHub Actions.
Team size: 1 developer. Timeline: 4 weeks. Use scenario S01.
```

### Step 4: Review Generated Output

The system generates files in `output/`:

```
output/
├── phase01-plan/           # Project planning
├── phase02-doc/            # Documentation
├── phase07-architect/      # Architecture design
├── phase09-bicep/          # Azure infrastructure
├── frontend/               # React application
├── backend/                # Node.js API
└── database/               # PostgreSQL schemas
```

---

## 📁 Project Structure

After installation, your project looks like:

```
AgenticCoder/
├── agents/                 # 🤖 Agent framework
│   ├── core/              # Core orchestration
│   ├── bicep-avm-resolver/ # Azure Bicep pipeline
│   ├── task/              # Task extraction
│   └── validation/        # Validation framework
├── src/mcp/               # 🔌 TypeScript MCP layer
│   ├── core/              # Client manager, registry
│   ├── transport/         # Stdio, SSE, HTTP
│   ├── servers/azure/     # Native Azure adapters
│   ├── health/            # Circuit breaker, retry
│   └── bridge.ts          # JS integration bridge
├── .github/               # 📋 Agent definitions
│   ├── agents/           # 17 agent specs
│   ├── skills/           # 15 skill specs
│   ├── mcp/              # MCP configuration
│   └── scenarios/        # Test scenarios
└── Files/                # 📚 Documentation
    └── AgenticCoderPlan/ # Implementation plans
```

---

## 🔧 Configuration

AgenticCoder works out of the box, but you can customize:

### Environment Variables

```bash
# .env file
AZURE_SUBSCRIPTION_ID=your-subscription-id
AGENTICCODER_LOG_LEVEL=debug
AGENTICCODER_MAX_TOKENS=2000
```

### Configuration Files

See `.github/.agenticcoder/config/` for:
- `defaults.yaml` - Base configuration
- `profiles/production.yaml` - Production settings

---

## 🆘 Troubleshooting

### "npm install" fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and retry
rm -rf node_modules package-lock.json
npm install
```

### Tests fail with Azure errors

```bash
# Make sure you're logged into Azure
az login
az account show  # Verify subscription

# Or run tests without Azure
npm test  # Skips Azure-dependent tests by default
```

### Container won't start

```bash
# Rebuild container
docker system prune -a
# Then reopen in VS Code
```

---

## ⏭️ Next Steps

Now that you're set up:

1. **[User Guide](User-Guide)** - Learn how to use AgenticCoder effectively
2. **[Scenarios](Scenarios)** - Explore pre-built project scenarios
3. **[Architecture](Architecture)** - Understand how it works

---

<p align="center">
  <a href="Home">← Home</a> | <a href="User-Guide">User Guide →</a>
</p>
