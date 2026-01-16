# API Reference

Complete API reference for AgenticCoder commands and configuration.

---

## Commands

### @plan

The main command to start a new project.

```
@plan <project description>
```

**Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| Description | Natural language project description | "Create a task management app" |

**Options (inline):**

```
@plan Create a task management app
- Scenario: S02
- Framework: React with TypeScript
- Database: PostgreSQL
- Auth: OAuth with Google
```

**Example:**

```
@plan Create an e-commerce platform with:
- Product catalog with categories
- Shopping cart
- Stripe checkout
- Order history
- Admin dashboard
```

---

### @continue

Continue with the next phase of generation.

```
@continue
```

**With modifications:**

```
@continue but use MongoDB instead of PostgreSQL
```

---

### @modify

Modify existing generated code.

```
@modify <change description>
```

**Example:**

```
@modify Add email verification to the authentication flow
```

---

### @review

Request a review of generated code.

```
@review <optional focus area>
```

**Example:**

```
@review security
@review performance
@review architecture
```

---

### @deploy

Prepare deployment configuration.

```
@deploy <environment>
```

**Environments:**

- `dev` - Development environment
- `staging` - Staging environment
- `production` - Production environment

**Example:**

```
@deploy production
```

---

### @cost

Estimate Azure costs.

```
@cost
```

**With scenario:**

```
@cost for S03 scenario
```

---

### @help

Get help with AgenticCoder.

```
@help <topic>
```

**Topics:**

- `commands` - List all commands
- `scenarios` - Scenario information
- `agents` - Agent reference
- `phases` - Phase workflow

---

## Configuration

### Project Configuration

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
  }
}
```

---

### Configuration Options

#### scenario

```json
{
  "scenario": "S01" | "S02" | "S03" | "S04" | "S05"
}
```

| Value | Description |
|-------|-------------|
| S01 | Simple MVP (solo developer) |
| S02 | Small Team Startup |
| S03 | Medium Team SaaS |
| S04 | Large Team Enterprise |
| S05 | Regulated Healthcare |

---

#### outputDir

```json
{
  "outputDir": "./output"
}
```

Directory where generated code will be placed.

---

#### preferences.language

```json
{
  "preferences": {
    "language": "typescript" | "javascript"
  }
}
```

---

#### preferences.framework

```json
{
  "preferences": {
    "framework": "react" | "vue" | "angular" | "nextjs"
  }
}
```

| Framework | Description |
|-----------|-------------|
| react | React 18 with Vite |
| vue | Vue 3 with Vite |
| angular | Angular 17 |
| nextjs | Next.js 14 |

---

#### preferences.database

```json
{
  "preferences": {
    "database": "postgresql" | "mysql" | "mongodb" | "cosmosdb"
  }
}
```

---

#### preferences.cloud

```json
{
  "preferences": {
    "cloud": "azure" | "aws" | "gcp"
  }
}
```

> **Note:** Azure is the primary supported cloud provider.

---

#### phases.skip

```json
{
  "phases": {
    "skip": ["documentation"]
  }
}
```

Phases that can be skipped:

| Phase | Skip Value |
|-------|------------|
| Testing | `testing` |
| Documentation | `documentation` |
| Monitoring | `monitoring` |

---

#### phases.focus

```json
{
  "phases": {
    "focus": ["security", "performance"]
  }
}
```

Additional focus areas:

| Focus | Description |
|-------|-------------|
| security | Enhanced security review |
| performance | Performance optimization |
| accessibility | WCAG compliance |
| compliance | Regulatory compliance |

---

### Environment Variables

Set these in your environment or `.env` file:

```bash
# Required for Azure deployment
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id

# Optional: Custom output location
AGENTIC_OUTPUT_DIR=./generated

# Optional: Debug mode
AGENTIC_DEBUG=true
```

---

## Output Structure

### Generated Project Structure

```
output/
├── frontend/                    # Frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # API services
│   │   ├── store/               # State management
│   │   └── utils/               # Utilities
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Backend services
│   ├── src/
│   │   ├── routes/              # API routes
│   │   ├── controllers/         # Route handlers
│   │   ├── services/            # Business logic
│   │   ├── models/              # Data models
│   │   ├── middleware/          # Express middleware
│   │   └── utils/               # Utilities
│   ├── package.json
│   └── tsconfig.json
│
├── infrastructure/              # Azure Bicep files
│   ├── main.bicep               # Main deployment
│   ├── modules/                 # Bicep modules
│   │   ├── app-service.bicep
│   │   ├── database.bicep
│   │   └── storage.bicep
│   └── parameters/
│       ├── dev.bicepparam
│       ├── staging.bicepparam
│       └── prod.bicepparam
│
├── .github/                     # GitHub configuration
│   └── workflows/
│       ├── ci.yml               # CI pipeline
│       └── cd.yml               # CD pipeline
│
├── docs/                        # Generated documentation
│   ├── README.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── docker-compose.yml           # Local development
└── README.md                    # Project README
```

---

### Output Files

#### requirements.json

```json
{
  "functional": [
    {
      "id": "FR-001",
      "title": "User Registration",
      "description": "Users can create accounts",
      "priority": "high"
    }
  ],
  "nonFunctional": [
    {
      "id": "NFR-001",
      "category": "performance",
      "requirement": "Page load < 3s"
    }
  ]
}
```

---

#### architecture.json

```json
{
  "type": "modular-monolith",
  "layers": ["frontend", "api", "business", "data"],
  "components": [
    {
      "name": "AuthService",
      "type": "service",
      "responsibilities": ["login", "register", "jwt"]
    }
  ],
  "integrations": ["stripe", "sendgrid"]
}
```

---

#### cost-estimate.json

```json
{
  "monthly": {
    "compute": 35.00,
    "database": 12.00,
    "storage": 2.50,
    "networking": 5.00,
    "total": 54.50
  },
  "yearly": 654.00,
  "services": [
    {
      "name": "App Service B1",
      "cost": 35.00,
      "tier": "Basic"
    }
  ]
}
```

---

## Events & Hooks

### Phase Events

AgenticCoder emits events during execution that you can hook into:

| Event | Description |
|-------|-------------|
| `phase:start` | Phase is starting |
| `phase:complete` | Phase completed |
| `phase:error` | Phase encountered error |
| `generation:file` | File was generated |
| `validation:result` | Validation completed |

---

### Custom Hooks

Create hooks in `hooks/` directory:

```javascript
// hooks/post-generate.js
export async function onPhaseComplete(phase, context) {
  if (phase === 'testing') {
    // Run additional tests
    console.log('Running custom test suite...');
  }
}
```

---

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `E001` | Invalid scenario | Use S01-S05 |
| `E002` | Missing requirements | Add more project details |
| `E003` | Unsupported framework | Check supported frameworks |
| `E004` | Azure auth failed | Run `az login` |
| `E005` | Template validation failed | Check Bicep syntax |
| `E006` | Test failure | Review test output |

---

## Rate Limits

| Operation | Limit |
|-----------|-------|
| @plan commands | 10 per hour |
| @continue | 50 per hour |
| @modify | 30 per hour |
| File generation | 500 per project |

---

## Debugging

Enable debug mode:

```bash
AGENTIC_DEBUG=true
```

Or in config:

```json
{
  "debug": {
    "enabled": true,
    "logLevel": "verbose",
    "saveIntermediateFiles": true
  }
}
```

Debug output location: `output/.debug/`

---

<p align="center">
  <a href="Agents">← Agents</a> | <a href="FAQ">FAQ →</a>
</p>
