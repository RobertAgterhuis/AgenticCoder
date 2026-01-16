# Configuration Reference

Complete guide to configuring AgenticCoder for your projects.

---

## Overview

AgenticCoder can be configured at multiple levels:
- **Project level** - `agentic-coder.config.json`
- **Environment variables** - Runtime settings
- **VS Code settings** - Editor integration
- **Agent overrides** - Per-agent customization

---

## Project Configuration

### Configuration File

Create `agentic-coder.config.json` in your project root:

```json
{
  "scenario": "S02",
  "outputDir": "./output",
  "preferences": {
    "language": "typescript",
    "framework": "react",
    "database": "postgresql",
    "cloud": "azure"
  },
  "phases": {
    "skip": [],
    "focus": ["security", "testing"]
  },
  "azure": {
    "subscription": "your-subscription-id",
    "resourceGroup": "rg-myproject",
    "location": "westeurope"
  }
}
```

---

## Configuration Options

### scenario

Select the project complexity scenario.

```json
{
  "scenario": "S01" | "S02" | "S03" | "S04" | "S05"
}
```

| Value | Description | Team Size | Monthly Cost |
|-------|-------------|-----------|--------------|
| `S01` | Simple MVP | 1 developer | ~$35 |
| `S02` | Small Team Startup | 3 developers | ~$480 |
| `S03` | Medium Team SaaS | 10 developers | $2K-5K |
| `S04` | Large Team Enterprise | 50 people | $20K+ |
| `S05` | Regulated Healthcare | 12 people | $10K+ |

**Default:** Auto-detected based on requirements

---

### outputDir

Directory where generated code is placed.

```json
{
  "outputDir": "./output"
}
```

**Default:** `./output`

**Structure created:**
```
output/
├── frontend/
├── backend/
├── infrastructure/
├── .github/workflows/
└── docs/
```

---

### preferences

#### preferences.language

Programming language preference.

```json
{
  "preferences": {
    "language": "typescript" | "javascript"
  }
}
```

**Default:** `typescript`

---

#### preferences.framework

Frontend framework selection.

```json
{
  "preferences": {
    "framework": "react" | "vue" | "angular" | "nextjs" | "nuxt"
  }
}
```

| Framework | Version | Features |
|-----------|---------|----------|
| `react` | React 18 | Vite, React Router |
| `vue` | Vue 3 | Vite, Vue Router |
| `angular` | Angular 17 | Angular CLI |
| `nextjs` | Next.js 14 | App Router, RSC |
| `nuxt` | Nuxt 3 | Auto-imports |

**Default:** `react`

---

#### preferences.database

Database selection.

```json
{
  "preferences": {
    "database": "postgresql" | "mysql" | "mongodb" | "cosmosdb" | "sqlserver"
  }
}
```

| Database | Azure Service | Use Case |
|----------|---------------|----------|
| `postgresql` | Azure Database for PostgreSQL | General purpose |
| `mysql` | Azure Database for MySQL | WordPress, PHP |
| `mongodb` | Azure CosmosDB (MongoDB API) | Document store |
| `cosmosdb` | Azure CosmosDB | Global distribution |
| `sqlserver` | Azure SQL Database | Enterprise |

**Default:** `postgresql`

---

#### preferences.cloud

Cloud provider selection.

```json
{
  "preferences": {
    "cloud": "azure" | "aws" | "gcp"
  }
}
```

> **Note:** Azure is the primary supported provider with full Bicep integration.

**Default:** `azure`

---

#### preferences.backend

Backend framework selection.

```json
{
  "preferences": {
    "backend": "express" | "nestjs" | "fastify" | "dotnet" | "springboot"
  }
}
```

| Framework | Language | Features |
|-----------|----------|----------|
| `express` | Node.js | Lightweight, flexible |
| `nestjs` | Node.js | Enterprise, decorators |
| `fastify` | Node.js | High performance |
| `dotnet` | C# | .NET 8, Web API |
| `springboot` | Java | Enterprise Java |

**Default:** `express`

---

### phases

#### phases.skip

Skip specific phases during generation.

```json
{
  "phases": {
    "skip": ["documentation", "monitoring"]
  }
}
```

**Skippable Phases:**

| Phase | Value | Impact |
|-------|-------|--------|
| Testing | `testing` | No test generation |
| Documentation | `documentation` | No docs generation |
| Monitoring | `monitoring` | No observability setup |
| Security Review | `security-review` | Skip security audit |

---

#### phases.focus

Add emphasis to specific quality attributes.

```json
{
  "phases": {
    "focus": ["security", "performance", "accessibility"]
  }
}
```

**Focus Areas:**

| Focus | Effect |
|-------|--------|
| `security` | Enhanced security review, OWASP checks |
| `performance` | Load testing, optimization |
| `accessibility` | WCAG 2.1 compliance |
| `compliance` | Regulatory controls (HIPAA, SOC2) |
| `testing` | Higher test coverage targets |

---

### azure

Azure-specific configuration.

```json
{
  "azure": {
    "subscription": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "resourceGroup": "rg-myproject-dev",
    "location": "westeurope",
    "naming": {
      "prefix": "myapp",
      "environment": "dev"
    }
  }
}
```

#### azure.subscription

Azure subscription ID for deployments.

```json
{
  "azure": {
    "subscription": "your-subscription-id"
  }
}
```

Can also be set via `AZURE_SUBSCRIPTION_ID` environment variable.

---

#### azure.resourceGroup

Target resource group name.

```json
{
  "azure": {
    "resourceGroup": "rg-myproject-dev"
  }
}
```

**Naming Convention:** `rg-{project}-{environment}`

---

#### azure.location

Azure region for resources.

```json
{
  "azure": {
    "location": "westeurope" | "eastus" | "northeurope" | ...
  }
}
```

**Recommended Regions:**

| Region | Code | Best For |
|--------|------|----------|
| West Europe | `westeurope` | EU users, GDPR |
| North Europe | `northeurope` | EU backup |
| East US | `eastus` | US East Coast |
| West US 2 | `westus2` | US West Coast |

---

#### azure.naming

Resource naming configuration.

```json
{
  "azure": {
    "naming": {
      "prefix": "myapp",
      "environment": "dev",
      "separator": "-"
    }
  }
}
```

**Generated Names:**
- App Service: `myapp-api-dev`
- Database: `myapp-db-dev`
- Storage: `myappstdev` (no hyphens)

---

### generation

Code generation settings.

```json
{
  "generation": {
    "includeComments": true,
    "includeTodos": false,
    "strictMode": true,
    "testCoverage": 80
  }
}
```

#### generation.includeComments

Add explanatory comments to generated code.

**Default:** `true`

---

#### generation.strictMode

Enable strict TypeScript and linting.

**Default:** `true`

---

#### generation.testCoverage

Target test coverage percentage.

**Default:** `80`

---

### integrations

Third-party integration settings.

```json
{
  "integrations": {
    "payments": {
      "provider": "stripe",
      "testMode": true
    },
    "email": {
      "provider": "sendgrid"
    },
    "auth": {
      "providers": ["google", "microsoft"]
    }
  }
}
```

---

## Environment Variables

### Required Variables

```bash
# Azure Authentication
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id

# Or use Azure CLI authentication
# Run: az login
```

### Optional Variables

```bash
# Output directory override
AGENTIC_OUTPUT_DIR=./generated

# Debug mode
AGENTIC_DEBUG=true
AGENTIC_LOG_LEVEL=verbose

# CI/CD mode (non-interactive)
AGENTIC_CI=true
```

---

## VS Code Settings

### Workspace Settings

Add to `.vscode/settings.json`:

```json
{
  "agenticCoder.scenario": "S02",
  "agenticCoder.autoFormat": true,
  "agenticCoder.showProgress": true,
  "agenticCoder.openGeneratedFiles": true
}
```

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `scenario` | string | - | Default scenario |
| `autoFormat` | boolean | true | Format generated files |
| `showProgress` | boolean | true | Show progress notifications |
| `openGeneratedFiles` | boolean | true | Open files after generation |

---

## Agent Configuration

### Per-Agent Overrides

Create `.github/agents/config.json`:

```json
{
  "@frontend-developer": {
    "framework": "vue",
    "styling": "tailwind"
  },
  "@backend-developer": {
    "framework": "nestjs",
    "orm": "prisma"
  },
  "@test-engineer": {
    "coverage": 90,
    "e2eFramework": "playwright"
  }
}
```

---

## Configuration Precedence

Settings are applied in this order (later overrides earlier):

1. **Built-in defaults**
2. **Scenario defaults** (S01-S05)
3. **Project config** (`agentic-coder.config.json`)
4. **VS Code settings**
5. **Environment variables**
6. **Command-line overrides**

---

## Configuration Examples

### Minimal MVP

```json
{
  "scenario": "S01",
  "preferences": {
    "framework": "react"
  }
}
```

### Enterprise SaaS

```json
{
  "scenario": "S04",
  "preferences": {
    "language": "typescript",
    "framework": "angular",
    "backend": "dotnet",
    "database": "sqlserver"
  },
  "phases": {
    "focus": ["security", "compliance", "performance"]
  },
  "azure": {
    "location": "westeurope",
    "naming": {
      "prefix": "enterprise",
      "environment": "prod"
    }
  }
}
```

### Healthcare Application

```json
{
  "scenario": "S05",
  "preferences": {
    "framework": "react",
    "database": "postgresql"
  },
  "phases": {
    "focus": ["security", "compliance", "accessibility"]
  },
  "compliance": {
    "hipaa": true,
    "encryption": "aes-256",
    "auditLogging": true
  }
}
```

---

## Validating Configuration

### Check Configuration

```bash
# Validate config file
npx agentic-coder validate-config

# Show effective configuration
npx agentic-coder show-config
```

### Configuration Schema

Full JSON Schema available at:
`.github/schemas/agentic-coder.config.schema.json`

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Config not found | Ensure file is in project root |
| Invalid scenario | Use S01-S05 |
| Azure auth failed | Run `az login` |
| Unknown framework | Check supported frameworks |

### Debug Mode

Enable verbose logging:

```bash
AGENTIC_DEBUG=true AGENTIC_LOG_LEVEL=verbose
```

---

<p align="center">
  <a href="Getting-Started">← Getting Started</a> | <a href="API-Reference">API Reference →</a>
</p>
