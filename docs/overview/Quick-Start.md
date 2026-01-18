# Quick Start Guide

Get AgenticCoder running in **15 minutes**.

## Prerequisites

- **Node.js 20+** ([download](https://nodejs.org/))
- **Azure CLI** ([install](https://docs.microsoft.com/cli/azure/install-azure-cli)) - optional for Azure features
- **VS Code** with GitHub Copilot (recommended)
- **Git**

## Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR-ORG/AgenticCoder.git
cd AgenticCoder
```

### Step 2: Install Dependencies

```bash
# Install TypeScript modules
npm install
npm run build

# Install Agent framework
cd agents
npm install
cd ..
```

### Step 3: Azure Authentication (Optional)

```bash
az login
az account set --subscription "Your Subscription"
```

## Verify Installation

### Run Tests

```bash
npm test
# Expected: 345+ tests passing
```

### Check CLI

```bash
node bin/agentic.js --version
# Output: AgenticCoder v1.0.0

node bin/agentic.js --help
# Shows available commands
```

## Your First Project

### Option A: Using CLI

```bash
# Initialize project
node bin/agentic.js init --name MyFirstProject

# Check status
node bin/agentic.js status

# Generate code using scenario
node bin/agentic.js generate --scenario S01 --name MyApp

# Security scan
node bin/agentic.js scan ./generated
```

### Option B: Using Agent Framework

```bash
cd agents

# Start the agent framework
npm start

# Run a specific scenario
npm run scenario:s01
```

## Available Scenarios

| ID | Name | Description |
|----|------|-------------|
| S01 | Simple MVP | Basic React + Node.js app |
| S02 | Small Team Startup | Full-stack with database |
| S03 | Medium Team SaaS | Multi-tier with Azure services |
| S04 | Large Team Enterprise | Microservices architecture |
| S05 | Regulated Healthcare | Compliance-focused |
| A01 | Simple App Service | Basic Azure deployment |
| A02 | Hub-Spoke Network | Network architecture |
| A03 | App Service + SQL | Web app with database |
| A04 | Multi-Tier App | Full Azure stack |
| A05 | High Availability | HA/DR setup |

## Dev Container (Recommended)

1. Open folder in VS Code
2. Install "Dev Containers" extension
3. Click **"Reopen in Container"**
4. All dependencies pre-installed

## Configuration

Create `.agentic/config.json`:

```json
{
  "project": {
    "name": "MyProject"
  },
  "azure": {
    "defaultTenantId": "your-tenant-id",
    "defaultSubscriptionId": "your-subscription-id"
  },
  "security": {
    "enabled": true
  }
}
```

## Next Steps

- [Concepts](Concepts) - Understand agents and phases
- [Agent Catalog](../agents/Catalog) - Explore all 39 agents
- [Creating Agents](../guides/Creating-Agents) - Add custom agents

## Troubleshooting

### Build Fails

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Tests Fail

```bash
# Ensure you're in project root
cd /path/to/AgenticCoder
npm test
```

### Azure Auth Issues

```bash
az logout
az login
az account show  # Verify correct subscription
```

See [Troubleshooting](../operations/Troubleshooting) for more solutions.
