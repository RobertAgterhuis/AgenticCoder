# Installation Guide

Complete installation guide for AgenticCoder.

## Requirements

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Windows 10, macOS 11, Ubuntu 20.04 | Windows 11, macOS 14, Ubuntu 22.04 |
| RAM | 8 GB | 16 GB |
| Disk | 2 GB free | 10 GB free |
| Node.js | 18.x | 20.x LTS |

### Software Requirements

| Software | Required | Purpose |
|----------|----------|---------|
| VS Code | Yes | IDE with agent support |
| Node.js 20.x | Yes | Runtime |
| Git | Yes | Version control |
| GitHub Copilot | Yes | AI capabilities |
| Bicep CLI | Optional | Azure templates |
| Azure CLI | Optional | Azure deployment |
| Docker | Optional | Containerization |

## Installation Methods

### Method 1: VS Code Extension (Recommended)

1. **Open VS Code**

2. **Install Extension**
   - Open Extensions (`Ctrl+Shift+X`)
   - Search for "AgenticCoder"
   - Click **Install**

3. **Configure**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run `AgenticCoder: Initialize Workspace`
   - Follow the setup wizard

### Method 2: npm Global Install

```bash
# Install globally
npm install -g @agentic-coder/cli

# Verify installation
agentic --version

# Initialize in project
cd my-project
agentic init
```

### Method 3: Project Local Install

```bash
# Create project
mkdir my-project
cd my-project

# Initialize npm
npm init -y

# Install as dependency
npm install @agentic-coder/cli --save-dev

# Add to package.json scripts
# "scripts": { "agentic": "agentic" }

# Run
npm run agentic -- init
```

### Method 4: Clone Repository

```bash
# Clone
git clone https://github.com/your-org/agentic-coder.git
cd agentic-coder

# Install dependencies
npm install

# Build
npm run build

# Link globally (optional)
npm link
```

## Post-Installation Setup

### 1. Initialize Workspace

```bash
# In your project directory
agentic init

# With options
agentic init --scenario S02 --name MyProject
```

This creates:
```
.agentic/
├── config/
│   └── settings.yaml
├── artifacts/
├── logs/
└── state/

.github/
├── agents/
├── skills/
├── scenarios/
└── copilot-instructions.md
```

### 2. Configure GitHub Copilot

1. **Install GitHub Copilot Extension** in VS Code
2. **Sign in** with GitHub account
3. **Enable Copilot Chat**

### 3. Configure Environment

Create `.env` file:

```env
# Required for AI features
GITHUB_TOKEN=your_github_token

# Optional: Azure (for Azure scenarios)
AZURE_SUBSCRIPTION_ID=your_subscription
AZURE_TENANT_ID=your_tenant

# Optional: Logging
LOG_LEVEL=info
DEBUG=agentic:*
```

### 4. Verify Installation

```bash
# Check version
agentic --version

# Check status
agentic doctor

# Expected output:
# ✓ Node.js 20.x found
# ✓ npm 10.x found
# ✓ VS Code detected
# ✓ GitHub Copilot extension installed
# ✓ Configuration valid
# ✓ Ready to use!
```

## Configuration

### Basic Configuration

```yaml
# .agentic/config/settings.yaml
agentic:
  version: "1.0"
  projectName: "MyProject"
  scenario: "S02"
  
engine:
  parallelExecution: true
  maxConcurrentAgents: 3
  
logging:
  level: "info"
  file: ".agentic/logs/agentic.log"
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "agenticCoder.enabled": true,
  "agenticCoder.autoActivate": true,
  "agenticCoder.scenario": "S02",
  "agenticCoder.logging.level": "info"
}
```

## Platform-Specific Instructions

### Windows

```powershell
# Install Node.js (using winget)
winget install OpenJS.NodeJS.LTS

# Verify
node --version
npm --version

# Install AgenticCoder
npm install -g @agentic-coder/cli

# Fix execution policy if needed
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### macOS

```bash
# Install Node.js (using brew)
brew install node@20

# Verify
node --version
npm --version

# Install AgenticCoder
npm install -g @agentic-coder/cli
```

### Linux (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version

# Install AgenticCoder
sudo npm install -g @agentic-coder/cli
```

## Optional Components

### Bicep CLI (for Azure)

```bash
# Windows (PowerShell)
winget install Microsoft.Bicep

# macOS
brew install azure/bicep/bicep

# Linux
curl -Lo bicep https://github.com/Azure/bicep/releases/latest/download/bicep-linux-x64
chmod +x bicep
sudo mv bicep /usr/local/bin/
```

### Azure CLI (for Azure)

```bash
# Windows (PowerShell)
winget install Microsoft.AzureCLI

# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Docker (for containerization)

- **Windows/macOS**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow [Docker Engine installation](https://docs.docker.com/engine/install/)

## Upgrading

### Upgrade CLI

```bash
# Global install
npm update -g @agentic-coder/cli

# Project local
npm update @agentic-coder/cli
```

### Upgrade VS Code Extension

1. Open Extensions (`Ctrl+Shift+X`)
2. Find AgenticCoder
3. Click **Update** if available

### Migration Guide

When upgrading major versions:

```bash
# Backup configuration
cp -r .agentic .agentic.backup

# Upgrade
npm install -g @agentic-coder/cli@latest

# Run migration
agentic migrate

# Verify
agentic doctor
```

## Uninstallation

### Remove CLI

```bash
# Global
npm uninstall -g @agentic-coder/cli

# Local
npm uninstall @agentic-coder/cli
```

### Remove VS Code Extension

1. Open Extensions
2. Find AgenticCoder
3. Click **Uninstall**

### Clean Up Project Files

```bash
# Remove generated directories
rm -rf .agentic
rm -rf .github/agents
rm -rf .github/skills
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `command not found` | Ensure Node.js is in PATH |
| `permission denied` | Use `sudo` on Linux/macOS or run as admin on Windows |
| `EACCES` error | Fix npm permissions: `npm config set prefix ~/.npm-global` |
| Extension not loading | Reload VS Code window |
| Copilot not responding | Check GitHub Copilot subscription |

### Getting Help

```bash
# View help
agentic --help

# Specific command help
agentic init --help

# Run diagnostics
agentic doctor --verbose

# Check logs
cat .agentic/logs/agentic.log
```

### Support Resources

- [Documentation](../Home)
- [FAQ](FAQ)
- [GitHub Issues](https://github.com/your-org/agentic-coder/issues)
- [Discussions](https://github.com/your-org/agentic-coder/discussions)

## Next Steps

- [Quick Start](../overview/Quick-Start) - First project
- [Configuration](Configuration) - Advanced setup
- [Scenarios](../agents/Scenarios) - Project templates
