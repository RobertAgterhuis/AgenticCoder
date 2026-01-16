# AgenticCoder Plan-F: Docker Dev Container Setup & MCP Integration

**Status**: New Addition (January 13, 2026)  
**Purpose**: Comprehensive guide to setting up Docker Dev Container with integrated MCP servers  
**Approach**: Following azure-agentic-infraops architecture exactly  
**Scope**: v1.0 Dev Container with reproducible environment

---

> ## ✅ Document Status: CURRENT
> 
> This Dev Container guide remains **valid and current**. 
> 
> **Note**: Development can also be done without Docker using:
> ```bash
> cd d:\repositories\AgenticCoder
> npm install
> node --test agents/test/S01ScenarioRunner.test.js
> ```
> 
> The Docker setup provides isolation but is not required for local development.

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Part 1: Dev Container Architecture](#part-1-dev-container-architecture)
3. [Part 2: Devcontainer.json Complete Setup](#part-2-devcontainerjson-complete-setup)
4. [Part 3: Docker Image Configuration](#part-3-docker-image-configuration)
5. [Part 4: Post-Create Setup Scripts](#part-4-post-create-setup-scripts)
6. [Part 5: MCP Server Integration in Dev Container](#part-5-mcp-server-integration-in-dev-container)
7. [Part 6: Running Dev Container Locally](#part-6-running-dev-container-locally)

---

## Executive Summary

### What is a Dev Container?

**Definition**: A containerized development environment that:
- Runs in Docker Desktop on your local machine
- Contains all tools, dependencies, and configurations
- Isolates development from your system
- Ensures "works on my machine" → "works everywhere"
- Configured with single `.devcontainer/devcontainer.json` file

### Why Dev Container for AgenticCoder?

1. ✅ **Consistency**: Every developer has identical environment
2. ✅ **No Setup Hell**: Single click to get productive
3. ✅ **Isolation**: Don't pollute local machine with dependencies
4. ✅ **Easy Cleanup**: Delete container, everything gone
5. ✅ **CI/CD Ready**: Same environment as GitHub Actions
6. ✅ **Team Onboarding**: New members productive in 10 minutes
7. ✅ **MCP Server Integration**: All servers pre-configured

### v1.0 Dev Container Includes

**Base Image**: Ubuntu 24.04 (Microsoft Dev Container)

**Tools**:
- ✅ Python 3.12 + pip
- ✅ Node.js LTS + npm
- ✅ Azure CLI + Bicep
- ✅ PowerShell 7
- ✅ Docker (nested)
- ✅ Git + GitHub CLI
- ✅ Visual Studio Code extensions (pre-selected)

**MCP Servers** (pre-configured):
- ✅ azure-pricing-mcp (Python)
- ✅ azure-resource-graph-mcp (Python)
- ✅ microsoft-docs-mcp (Node.js)

**VS Code Extensions** (auto-installed):
- ✅ GitHub Copilot + Chat
- ✅ Azure Resource Groups
- ✅ Bicep
- ✅ PowerShell
- ✅ Python
- ✅ Markdown + Mermaid
- ✅ Git extensions

---

## Part 1: Dev Container Architecture

### 1.1 Dev Container Layers

```
┌─────────────────────────────────────────────────────────┐
│           Your Local Computer                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Docker Desktop                           │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │    VS Code Remote Container Extension       │ │  │
│  │  └───────────────┬────────────────────────────┘ │  │
│  │                  │                               │  │
│  │  ┌──────────────▼──────────────────────────────┐ │  │
│  │  │  AgenticCoder Dev Container (Ubuntu 24.04) │ │  │
│  │  │                                             │ │  │
│  │  │  Layer 1: Base OS (Ubuntu 24.04)          │ │  │
│  │  │  Layer 2: Dev Container Features           │ │  │
│  │  │    - Python 3.12                          │ │  │
│  │  │    - Node.js LTS                          │ │  │
│  │  │    - Azure CLI, Bicep                     │ │  │
│  │  │    - PowerShell 7                         │ │  │
│  │  │    - Docker CLI                           │ │  │
│  │  │                                             │ │  │
│  │  │  Layer 3: Post-Create Setup                │ │  │
│  │  │    - pip install mcp requirements          │ │  │
│  │  │    - npm install global packages           │ │  │
│  │  │    - Setup MCP servers                     │ │  │
│  │  │    - Configure .vscode/mcp.json            │ │  │
│  │  │    - Install VS Code extensions            │ │  │
│  │  │                                             │ │  │
│  │  │  Layer 4: MCP Servers (Ready to Run)       │ │  │
│  │  │    - azure-pricing-mcp (.venv)            │ │  │
│  │  │    - azure-resource-graph-mcp (.venv)     │ │  │
│  │  │    - microsoft-docs-mcp (node_modules)    │ │  │
│  │  │                                             │ │  │
│  │  │  /workspace (mounted from host)           │ │  │
│  │  │    - Your AgenticCoder repository         │ │  │
│  │  │    - All files accessible inside/outside  │ │  │
│  │  │                                             │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 How Dev Container Differs from Local Development

| Aspect | Local Development | Dev Container |
|--------|------------------|---|
| **Environment** | Your system (Python, Node, tools) | Isolated container (guaranteed) |
| **Setup** | Manual: install Python, Node, etc. | Automatic: Dockerfile handles it |
| **Consistency** | "Works for me" syndrome | Same for all developers |
| **Cleanup** | Delete files, config remains | Delete container, everything gone |
| **VS Code** | Local extensions | Container extensions |
| **Debugging** | Direct filesystem | Mounted /workspace |
| **CI/CD** | Different from GitHub Actions | Identical to CI/CD |
| **Onboarding** | Hours of setup | 10 minutes with VS Code |

### 1.3 File Structure for Dev Container

```
AgenticCoder/
├── .devcontainer/
│   ├── devcontainer.json           # Main configuration (see Part 2)
│   ├── Dockerfile                  # Container image definition (see Part 3)
│   ├── .dockerignore               # Files to exclude from image
│   ├── post-create.sh              # Setup script run after container created
│   ├── post-start.sh               # Script run when container starts
│   └── post-attach.sh              # Script run when VS Code attaches
│
├── .vscode/
│   ├── extensions.json             # Recommended extensions
│   ├── launch.json                 # Debug configurations
│   ├── tasks.json                  # Build/run tasks
│   └── mcp.json                    # MCP server configuration
│
├── mcp/
│   ├── azure-pricing-mcp/
│   ├── azure-resource-graph-mcp/
│   └── microsoft-docs-mcp/
│
├── .github/
│   ├── agents/
│   ├── skills/
│   └── workflows/
│
└── ... (other files)
```

---

## Part 2: Devcontainer.json Complete Setup

### 2.1 Full devcontainer.json Configuration

This is the **exact configuration from azure-agentic-infraops** adapted for AgenticCoder:

```json
{
  "name": "AgenticCoder",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu-24.04",

  "features": {
    "ghcr.io/devcontainers/features/terraform:1": {
      "installTFsec": true,
      "installTerragrunt": false
    },
    "ghcr.io/devcontainers/features/azure-cli:1": {
      "installBicep": true,
      "version": "latest"
    },
    "ghcr.io/devcontainers/features/powershell:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.12"
    },
    "ghcr.io/devcontainers/features/node:1": {
      "version": "lts"
    },
    "ghcr.io/devcontainers/features/docker-from-docker:1": {}
  },

  "onCreateCommand": "bash .devcontainer/post-create.sh",
  "postStartCommand": "bash .devcontainer/post-start.sh",
  "postAttachCommand": "bash .devcontainer/post-attach.sh",

  "mounts": [
    "source=${localEnv:HOME}/.azure,target=/home/vscode/.azure,type=bind,consistency=cached"
  ],

  "remoteEnv": {
    "AZURE_DEFAULTS_LOCATION": "swedencentral",
    "PATH": "${containerEnv:PATH}:/home/vscode/.local/bin"
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.copilot",
        "GitHub.copilot-chat",
        "ms-vscode.vscode-node-azure-pack",
        "ms-azuretools.vscode-azureresourcegroups",
        "ms-azuretools.vscode-bicep",
        "HashiCorp.terraform",
        "ms-vscode.powershell",
        "bierner.markdown-mermaid",
        "bierner.markdown-preview-github-styles",
        "davidanson.vscode-markdownlint",
        "ms-vscode.copilot-mermaid-diagram",
        "ms-vscode.azurecli",
        "ms-azuretools.vscode-azurecontainerapps",
        "ms-azuretools.vscode-azurelogicapps",
        "eamodio.gitlens",
        "ms-vscode-remote.remote-containers"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "python.linting.enabled": true,
        "python.linting.pylintEnabled": true,
        "python.formatting.provider": "black",
        "[python]": {
          "editor.defaultFormatter": "ms-python.python",
          "editor.formatOnSave": true
        },
        "[bicep]": {
          "editor.defaultFormatter": "Azure.bicep",
          "editor.formatOnSave": true
        },
        "[json]": {
          "editor.defaultFormatter": "esbenp.prettier-vscode",
          "editor.formatOnSave": true
        },
        "terminal.integrated.defaultProfile.linux": "bash",
        "files.exclude": {
          "**/__pycache__": true,
          "**/*.pyc": true,
          "**/node_modules": true
        }
      }
    }
  },

  "forwardPorts": [3000, 5000, 8000, 8080, 9000],

  "portsAttributes": {
    "3000": {
      "label": "Application",
      "onAutoForward": "notify"
    },
    "5000": {
      "label": "API Server",
      "onAutoForward": "notify"
    },
    "8000": {
      "label": "Web Server",
      "onAutoForward": "notify"
    },
    "8080": {
      "label": "Admin",
      "onAutoForward": "notify"
    }
  },

  "remoteUser": "vscode",
  "overrideCommand": false,
  "updateContentCommand": "bash .devcontainer/update-content.sh"
}
```

### 2.2 Understanding Each Section

**`name`**: Display name in VS Code
```json
"name": "AgenticCoder"
// Appears in VS Code Remote Extension menu
```

**`image`**: Base Docker image
```json
"image": "mcr.microsoft.com/devcontainers/base:ubuntu-24.04"
// From Microsoft's official Dev Container images
// Includes: git, curl, wget, zip, ca-certificates
```

**`features`**: Dev Container features (pre-built packages)
```json
"features": {
  // Features: ready-made tool installers
  "ghcr.io/devcontainers/features/python:1": {
    "version": "3.12"
  }
  // Alternative to manual installation: runs scripts to install Python 3.12
}
```

**Available Features** (used in config):
- `terraform` - Terraform CLI + TFsec
- `azure-cli` - Azure CLI + Bicep
- `powershell` - PowerShell 7+
- `python` - Python with pip
- `node` - Node.js + npm
- `docker-from-docker` - Docker CLI (nested)

**`onCreateCommand`**: Runs after container created (one-time)
```json
"onCreateCommand": "bash .devcontainer/post-create.sh"
// Used for: setup virtual environments, install MCP dependencies
// Runs once per container
// Takes 2-5 minutes
```

**`postStartCommand`**: Runs when container starts
```json
"postStartCommand": "bash .devcontainer/post-start.sh"
// Used for: start services, health checks
// Runs on every container start
// Should be quick (<10 seconds)
```

**`postAttachCommand`**: Runs when VS Code connects
```json
"postAttachCommand": "bash .devcontainer/post-attach.sh"
// Used for: display welcome message, tips
// Runs when you open the workspace
// User interactive
```

**`remoteEnv`**: Environment variables inside container
```json
"remoteEnv": {
  "AZURE_DEFAULTS_LOCATION": "swedencentral",
  // Sets default Azure region for all az commands
  "PATH": "${containerEnv:PATH}:/home/vscode/.local/bin"
  // Adds Python user packages to PATH
}
```

**`customizations.vscode.extensions`**: Extensions installed in container
```json
"extensions": [
  "GitHub.copilot",           // GitHub Copilot
  "ms-azuretools.vscode-bicep", // Bicep language support
  "ms-vscode.powershell",     // PowerShell debugging
  // ... etc
]
// Each extension installed automatically
// IntelliSense, debugging, formatting enabled
```

**`customizations.vscode.settings`**: VS Code settings applied in container
```json
"settings": {
  "[python]": {
    "editor.defaultFormatter": "ms-python.python",
    "editor.formatOnSave": true
  }
  // Python files auto-formatted on save
}
```

**`forwardPorts`**: Ports visible from host
```json
"forwardPorts": [3000, 5000, 8000, 8080, 9000]
// If your app listens on port 8080 inside container,
// you can access it at localhost:8080 on your host
```

**`portsAttributes`**: Port labels
```json
"portsAttributes": {
  "8000": {
    "label": "Web Server",
    "onAutoForward": "notify"
  }
}
// When app starts on port 8000, VS Code notifies you
```

---

## Part 3: Docker Image Configuration

### 3.1 Understanding the Dockerfile

The `.devcontainer/Dockerfile` extends the base image with additional setup:

```dockerfile
# .devcontainer/Dockerfile

# Start from dev container base
FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Install system dependencies (runs as root)
RUN apt-get update && apt-get install -y \
    graphviz \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Python global packages (runs as root)
RUN pip install --upgrade pip && \
    pip install \
    diagrams \
    matplotlib \
    pillow \
    black \
    pylint \
    pytest \
    pytest-asyncio \
    mcp

# Node global packages (runs as root)
RUN npm install -g \
    markdownlint-cli2 \
    typescript \
    ts-node

# Copy MCP server source code
COPY mcp/ /workspace/mcp/

# Set working directory
WORKDIR /workspace

# Switch to vscode user (non-root)
USER vscode

# Print container info (for verification)
RUN echo "Python: $(python --version)" && \
    echo "Node: $(node --version)" && \
    echo "npm: $(npm --version)"
```

### 3.2 Key Components

**System Dependencies**:
```dockerfile
RUN apt-get update && apt-get install -y \
    graphviz         # For diagram generation
    dos2unix         # Line ending conversion (Windows ↔ Unix)
```

**Python Packages**:
```dockerfile
RUN pip install \
    diagrams         # Architecture diagram generation
    matplotlib       # Plotting library
    pillow           # Image processing
    black            # Code formatter
    pylint           # Linter
    pytest           # Test framework
    pytest-asyncio   # Async test support
    mcp              # Model Context Protocol SDK
```

**Node Packages**:
```dockerfile
RUN npm install -g \
    markdownlint-cli2  # Markdown linting
    typescript         # TypeScript support
```

### 3.3 .dockerignore File

```
.dockerignore
```

Tells Docker what NOT to copy into image:

```
# .devcontainer/.dockerignore
.git
.gitignore
.vscode
.devcontainer
.github
node_modules
.venv
__pycache__
*.pyc
.pytest_cache
.coverage
dist
build
*.egg-info
.DS_Store
Thumbs.db
```

**Why?** Smaller image size, faster builds

---

## Part 4: Post-Create Setup Scripts

### 4.1 post-create.sh (Main Setup Script)

This script runs **once** after container is created, setting up MCP servers:

```bash
#!/bin/bash
# .devcontainer/post-create.sh

set -e  # Exit on error
set -x  # Print commands being run

echo "🚀 Starting AgenticCoder Dev Container Setup..."
echo "=================================================="

# Step 1: Display environment
echo "📋 Environment:"
python --version
node --version
npm --version
az version

# Step 2: Install Python dependencies globally
echo "📦 Installing global Python packages..."
pip install --upgrade pip setuptools wheel
pip install mcp>=1.0.0 aiohttp pydantic requests python-dotenv
pip install pytest pytest-asyncio pytest-cov black pylint flake8

# Step 3: Setup Azure Pricing MCP
echo "🔧 Setting up azure-pricing-mcp..."
cd /workspace/mcp/azure-pricing-mcp

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt
echo "✅ azure-pricing-mcp ready"
deactivate

# Step 4: Setup Azure Resource Graph MCP
echo "🔧 Setting up azure-resource-graph-mcp..."
cd /workspace/mcp/azure-resource-graph-mcp

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt
echo "✅ azure-resource-graph-mcp ready"
deactivate

# Step 5: Setup Microsoft Docs MCP
echo "🔧 Setting up microsoft-docs-mcp..."
cd /workspace/mcp/microsoft-docs-mcp

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
echo "✅ microsoft-docs-mcp ready"

# Step 6: Setup .vscode/mcp.json if not exists
echo "⚙️ Configuring VS Code MCP servers..."
cd /workspace

if [ ! -f ".vscode/mcp.json" ]; then
    mkdir -p .vscode
    cat > .vscode/mcp.json << 'EOF'
{
  "servers": {
    "azure-pricing": {
      "type": "stdio",
      "command": "${workspaceFolder}/mcp/azure-pricing-mcp/.venv/bin/python",
      "args": ["-m", "azure_pricing_mcp"],
      "cwd": "${workspaceFolder}/mcp/azure-pricing-mcp/src"
    },
    "azure-resource-graph": {
      "type": "stdio",
      "command": "${workspaceFolder}/mcp/azure-resource-graph-mcp/.venv/bin/python",
      "args": ["-m", "azure_resource_graph_mcp"],
      "cwd": "${workspaceFolder}/mcp/azure-resource-graph-mcp/src"
    },
    "microsoft-docs": {
      "type": "stdio",
      "command": "${workspaceFolder}/mcp/microsoft-docs-mcp/.venv/bin/node",
      "args": ["lib/index.js"],
      "cwd": "${workspaceFolder}/mcp/microsoft-docs-mcp"
    }
  }
}
EOF
    echo "✅ .vscode/mcp.json created"
else
    echo "ℹ️ .vscode/mcp.json already exists"
fi

# Step 7: Azure CLI configuration
echo "⚙️ Configuring Azure CLI..."
az config set auto-upgrade.enable=no --only-show-errors 2>/dev/null || true
az extension add --name azure-devops --only-show-errors 2>/dev/null || true

# Step 8: Display success message
echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "📌 Next Steps:"
echo "  1. Reload VS Code (Ctrl+R)"
echo "  2. Open Command Palette: Ctrl+Shift+P"
echo "  3. Run: MCP: List Servers"
echo "  4. You should see 3 MCP servers available"
echo ""
echo "🧪 To test:"
echo "  - Open Copilot Chat (Ctrl+I)"
echo "  - Ask: 'What is the price of Standard_D4s_v5 in East US 2?'"
echo "  - Azure pricing MCP should respond with pricing data"
echo ""
```

### 4.2 post-start.sh (Startup Script)

Runs **every time** container starts:

```bash
#!/bin/bash
# .devcontainer/post-start.sh

set -e

echo "🔄 Starting AgenticCoder Dev Container..."

# Quick health check on MCP servers
echo "✅ Dev Container started"

# Optional: Run health checks
if [ -f "mcp/azure-pricing-mcp/scripts/healthcheck.py" ]; then
    echo "🏥 Checking MCP servers..."
    cd mcp/azure-pricing-mcp
    source .venv/bin/activate
    python scripts/healthcheck.py || echo "⚠️ Health check warning (may be okay)"
    deactivate
fi

echo ""
echo "💡 Tip: Run 'code --remote-command=remote.openFolder' to open in VS Code"
```

### 4.3 post-attach.sh (Interactive Script)

Runs when VS Code connects:

```bash
#!/bin/bash
# .devcontainer/post-attach.sh

echo ""
echo "=========================================="
echo "  🎉 Welcome to AgenticCoder!"
echo "=========================================="
echo ""
echo "📚 Quick Start:"
echo "  - Read: AgenticCoderPlan-A.md"
echo "  - Workflow: .github/START-HERE.md"
echo ""
echo "🔌 MCP Servers (3 available):"
echo "  ✅ azure-pricing-mcp"
echo "  ✅ azure-resource-graph-mcp"
echo "  ✅ microsoft-docs-mcp"
echo ""
echo "🧪 Test Copilot Chat:"
echo "  Ctrl+I → Ask: 'What is the price of D4s_v5 in East US 2?'"
echo ""
echo "📁 Key Directories:"
echo "  ./mcp/                - MCP server source code"
echo "  ./.github/agents/     - Agent specifications"
echo "  ./.github/skills/     - Skill definitions"
echo "  ./AgenticCoderPlan/   - Implementation planning"
echo ""
echo "=========================================="
echo ""
```

---

## Part 5: MCP Server Integration in Dev Container

### 5.1 How MCP Servers Run Inside Dev Container

**Architecture**:
```
VS Code (Host) 
    ↓ (Remote Connection)
Dev Container (Docker)
    ├─ Python 3.12
    │   ├─ .venv (azure-pricing-mcp)
    │   │   └─ stdin/stdout ↔ MCP Protocol
    │   └─ .venv (azure-resource-graph-mcp)
    │       └─ stdin/stdout ↔ MCP Protocol
    └─ Node.js LTS
        └─ node_modules (microsoft-docs-mcp)
            └─ stdin/stdout ↔ MCP Protocol

Each MCP server runs as subprocess, 
communicates via stdin/stdout with VS Code
```

### 5.2 Virtual Environments in Container

**Why virtual environments?**
```
Avoid "package hell": Different projects may need different versions of same package

.venv/bin/python    → Points to Python inside .venv
.venv/bin/pip       → Points to pip inside .venv
.venv/lib/python3.12/site-packages/  → Isolated packages for this MCP server
```

**In container**:
```bash
/workspace/mcp/azure-pricing-mcp/
├── .venv/
│   ├── bin/
│   │   ├── python          # Python interpreter
│   │   ├── pip
│   │   └── activate        # Source to activate
│   └── lib/python3.12/
│       └── site-packages/
│           ├── mcp/        # MCP framework
│           ├── aiohttp/    # Async HTTP
│           ├── pydantic/   # Validation
│           └── requests/   # HTTP requests

/workspace/mcp/microsoft-docs-mcp/
├── node_modules/
│   ├── mcp/                # MCP framework
│   ├── axios/              # HTTP requests
│   └── express/            # Web framework
```

### 5.3 MCP Server Startup Sequence in Dev Container

**When VS Code opens workspace**:

```
1. VS Code reads .vscode/mcp.json
   ├─ Finds: "azure-pricing" server
   ├─ Finds command: "${workspaceFolder}/mcp/azure-pricing-mcp/.venv/bin/python"
   └─ Finds args: ["-m", "azure_pricing_mcp"]

2. VS Code spawns subprocess:
   /workspace/mcp/azure-pricing-mcp/.venv/bin/python -m azure_pricing_mcp
   
   Inside container:
   $ /workspace/mcp/azure-pricing-mcp/.venv/bin/python -m azure_pricing_mcp
   
   Python executes: src/azure_pricing_mcp/__main__.py
   
   __main__.py calls: asyncio.run(main())
   
   main() instantiates: PricingMCPServer()
   
   PricingMCPServer.start() does:
   ├─ Register 6 tools (price_search, compare, estimate, etc.)
   └─ Start listening on stdio for MCP protocol messages

3. VS Code MCP client receives tool list:
   [
     "azure_price_search",
     "azure_price_compare",
     "azure_cost_estimate",
     "azure_region_recommend",
     "azure_discover_skus",
     "azure_sku_discovery"
   ]

4. Copilot Chat shows tools available:
   "I can access azure-pricing tools to help answer your question..."

5. When user asks pricing question:
   User (Copilot Chat):
   "What's the price of Standard_D4s_v5 in East US 2?"
   
   ↓ (VS Code calls MCP tool)
   
   MCP Client → stdin:
   {
     "jsonrpc": "2.0",
     "method": "call_tool",
     "params": {
       "name": "azure_price_search",
       "arguments": {
         "sku": "Standard_D4s_v5",
         "region": "East US 2"
       }
     }
   }
   
   ↓ (MCP Server reads stdin, processes request)
   
   PricingMCPServer.handle_price_search():
   ├─ Parse arguments
   ├─ Query Azure Retail Prices API
   └─ Format response
   
   ↓ (MCP Server writes to stdout)
   
   MCP Server → stdout:
   {
     "jsonrpc": "2.0",
     "result": {
       "content": [{
         "type": "text",
         "text": "Standard_D4s_v5 in East US 2 costs $0.456/hour..."
       }]
     }
   }
   
   ↓ (VS Code receives response)
   
   Copilot Chat displays:
   "Standard_D4s_v5 in East US 2 costs $0.456/hour..."
```

### 5.4 Troubleshooting MCP in Dev Container

**Problem**: MCP servers don't appear in Copilot Chat

**Diagnosis**:
```bash
# Inside container terminal
cd /workspace

# Check .vscode/mcp.json exists
test -f .vscode/mcp.json && echo "✅ Found" || echo "❌ Missing"

# Check Python virtual environment
test -f mcp/azure-pricing-mcp/.venv/bin/python && echo "✅ Found" || echo "❌ Missing"

# Try running MCP server manually
/workspace/mcp/azure-pricing-mcp/.venv/bin/python -m azure_pricing_mcp
# Should output: "MCP server initialized on stdio"
# Press Ctrl+C to stop

# Check Node.js MCP server
cd /workspace/mcp/microsoft-docs-mcp
npm list mcp
# Should show mcp package installed
```

**Problem**: "ModuleNotFoundError: No module named 'mcp'"

**Solution**:
```bash
# Inside container, activate virtual environment
cd /workspace/mcp/azure-pricing-mcp
source .venv/bin/activate

# Verify mcp installed
pip list | grep mcp
# Should show: mcp  1.0.0 (or higher)

# If not found, install
pip install mcp>=1.0.0

# Try server again
python -m azure_pricing_mcp
```

**Problem**: Tool execution times out

**Solution**: Check tool implementation for infinite loops or missing error handling

---

## Part 6: Running Dev Container Locally

### 6.1 Prerequisites

**Required**:
- ✅ VS Code (latest version)
- ✅ VS Code Remote - Containers extension
- ✅ Docker Desktop (with Linux VM enabled)
- ✅ 10 GB free disk space
- ✅ 4 GB RAM available

**Optional**:
- Azure CLI configured (for azure-resource-graph-mcp)
- GitHub CLI configured (for gh commands)

### 6.2 Step-by-Step: Open AgenticCoder in Dev Container

**Step 1: Prerequisites Check**
```bash
# Check Docker installed
docker --version
# Output: Docker version 24.0.0 or higher

# Check VS Code installed
code --version
# Output: 1.85.0 or higher
```

**Step 2: Install Remote - Containers Extension**
```
In VS Code:
1. Ctrl+Shift+X (Open Extensions)
2. Search: "Dev Containers"
3. Install: "Dev Containers" by Microsoft
4. Reload VS Code (or click "Reload")
```

**Step 3: Open Repository in Dev Container**
```
In VS Code:
1. File → Open Folder
2. Select: d:\repositories\AgenticCoder
3. Click: "Reopen in Container" (notification appears)
   OR
   Ctrl+Shift+P → "Dev Containers: Reopen in Container"
```

**Step 4: Wait for Container to Build**
```
Process (takes 5-15 minutes first time):
1. Download base image (ubuntu:24.04)      ~2 min
2. Install Dev Container features           ~3 min
   - Python 3.12
   - Node.js LTS
   - Azure CLI + Bicep
   - PowerShell
   - Docker CLI
3. Run post-create.sh setup                 ~3-5 min
   - Create Python virtual environments
   - Install MCP dependencies
   - Configure .vscode/mcp.json
   - Azure CLI setup
4. Load extensions in container            ~2 min
5. Ready!

Terminal output shows progress
Look for: "✅ Setup Complete!"
```

**Step 5: Verify MCP Servers Ready**
```
In VS Code Terminal (inside container):

Command Palette → "MCP: List Servers"

Should show:
  ✓ azure-pricing (6 tools)
  ✓ azure-resource-graph (5 tools)
  ✓ microsoft-docs (5 tools)

If not showing:
1. Reload VS Code: Ctrl+R
2. Wait 5 seconds
3. Try again
```

**Step 6: Test MCP Tools**
```
Open Copilot Chat (Ctrl+I) and ask:

"@azure-pricing What's the price of Standard_D4s_v5 in East US 2?"

Expected response:
"Standard_D4s_v5 in East US 2 costs $0.456/hour 
 or approximately $333/month (730 hours)"
```

### 6.3 Common Commands Inside Dev Container

**Terminal Operations**:
```bash
# Check which MCP servers are available
ls -la .vscode/mcp.json

# Check Python virtual environment is working
source mcp/azure-pricing-mcp/.venv/bin/activate
python -c "import mcp; print(mcp.__version__)"
deactivate

# Check Node.js MCP
cd mcp/microsoft-docs-mcp
npm list mcp

# Run tests
cd /workspace
python -m pytest tests/

# Format code
black .

# Lint code
pylint src/

# View Azure resources (requires az login)
az resource list --output table
```

### 6.4 Stopping and Restarting Container

**Stop Container**:
```
VS Code Command Palette → "Dev Containers: Close Remote Connection"
- Container stops (files preserved)
- Takes ~10 seconds
```

**Restart Container**:
```
VS Code Command Palette → "Dev Containers: Reopen in Container"
- Container restarts (< 30 seconds)
- Files preserved
```

**Delete Container** (if corrupted):
```bash
# In PowerShell (on host)
docker ps -a  # See all containers

# Stop container
docker stop <container-id>

# Remove container
docker rm <container-id>

# Rebuild
In VS Code: "Dev Containers: Reopen in Container"
# Fresh container created (takes 10-15 min)
```

### 6.5 Accessing Host Resources from Container

**Mount Azure credentials**:
```json
// In devcontainer.json
"mounts": [
  "source=${localEnv:HOME}/.azure,target=/home/vscode/.azure,type=bind,consistency=cached"
]
// Allows: az login credentials used in container
```

**Mount SSH keys** (for GitHub):
```json
"mounts": [
  "source=${localEnv:HOME}/.ssh,target=/home/vscode/.ssh,type=bind,consistency=cached"
]
```

**Port Forwarding**:
```json
"forwardPorts": [3000, 5000, 8000, 8080, 9000]
// App listening on container:8080 
// accessible at host:localhost:8080
```

### 6.6 Dev Container Lifecycle

**First Time**:
```
1. Docker pulls base image            (2 min)
2. Dev Container features run         (3 min)
3. post-create.sh executes            (5 min)
4. VS Code extensions install         (2 min)
Total: ~15 minutes
```

**Subsequent Starts**:
```
1. Container starts from cached image (2 sec)
2. post-start.sh executes             (quick)
3. VS Code connects                   (2 sec)
Total: ~5 seconds
```

**Rebuild Needed When**:
- You change `.devcontainer/devcontainer.json`
- You add new features or dependencies
- You update base image version

**To Rebuild**:
```
VS Code Command Palette → "Dev Containers: Rebuild Container"
// Full rebuild as if first time (10-15 min)
```

---

## Summary

**Part 1**: Understood Dev Container architecture (layers, isolation, benefits)  
**Part 2**: Complete devcontainer.json configuration with all options explained  
**Part 3**: Docker image setup with system/language dependencies  
**Part 4**: Post-create setup scripts for MCP server initialization  
**Part 5**: MCP server integration and communication flow  
**Part 6**: Step-by-step local setup and troubleshooting

**Key Outcomes**:
- ✅ Dev Container with all tools pre-installed
- ✅ 3 MCP servers running inside container
- ✅ VS Code connected to container environment
- ✅ Copilot Chat accessing MCP tools
- ✅ Reproducible environment for all developers

**Setup Time**: 
- First time: 15 minutes
- Subsequent starts: 5 seconds

---

## Appendix: Quick Reference

### File Locations
```
.devcontainer/
├── devcontainer.json          ← Main configuration
├── Dockerfile                 ← Image definition
├── post-create.sh             ← One-time setup
├── post-start.sh              ← Every startup
└── post-attach.sh             ← VS Code attachment

.vscode/
└── mcp.json                   ← MCP server config

mcp/
├── azure-pricing-mcp/
├── azure-resource-graph-mcp/
└── microsoft-docs-mcp/
```

### Key Commands
```bash
# Open in Dev Container
code --new-window --remote container-name+ext+remoteExtensionId/

# List running containers
docker ps

# View container logs
docker logs <container-id>

# Execute command in running container
docker exec -it <container-id> bash

# Remove container
docker rm <container-id>
```

### Environment Variables
```bash
# Inside container
AZURE_DEFAULTS_LOCATION=swedencentral
PATH=/home/vscode/.local/bin:$PATH
PYTHONUNBUFFERED=1
```

---

**Document Status**: Complete ✅  
**Date Created**: January 13, 2026  
**Word Count**: ~5,500  
**Complexity**: Advanced (Docker knowledge helpful)  
**Time to Setup**: 15 minutes (first time), 5 seconds (subsequent)

---

**Key Files**:
- `.devcontainer/devcontainer.json` - Main config
- `.devcontainer/Dockerfile` - Image definition
- `.devcontainer/post-create.sh` - Setup automation
- `.vscode/mcp.json` - MCP server configuration

**Cross-References**:
- [Plan-E: MCP Servers](./AgenticCoderPlan-E.md) - MCP architecture and creation
- [Plan-B: Architecture](./AgenticCoderPlan-B.md#part-5-artifact-management) - Dev Container in architecture
- [Plan-C: Implementation](./AgenticCoderPlan-C.md#sprint-3-4-foundation-phase) (Sprint 3-4 Dev Container)

---

## Next: Hands-on Implementation

Ready to set up Dev Container? Follow [Plan-C Sprint 3-4](./AgenticCoderPlan-C.md#sprint-3-4-foundation-phase) for step-by-step implementation tasks.
