# User Guide

Complete guide to using AgenticCoder for generating production-ready applications.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Understanding the Workflow](#understanding-the-workflow)
3. [Starting a Project](#starting-a-project)
4. [Working with Agents](#working-with-agents)
5. [Reviewing Output](#reviewing-output)
6. [Customization](#customization)
7. [Deployment](#deployment)
8. [Best Practices](#best-practices)

---

## Overview

### What AgenticCoder Does

AgenticCoder transforms your project requirements into:

| Output | Description |
|--------|-------------|
| 📁 **Source Code** | Frontend, backend, and database code |
| 🔧 **Infrastructure** | Bicep/Terraform for Azure deployment |
| 🚀 **CI/CD** | GitHub Actions or Azure DevOps pipelines |
| 📚 **Documentation** | Architecture, API, and deployment docs |
| 🧪 **Tests** | Unit, integration, and E2E tests |

### What You Provide

1. **Project description** - What are you building?
2. **Technology preferences** - React? Node.js? Azure?
3. **Requirements** - Features, constraints, timeline
4. **Scenario selection** - S01-S05 based on project size

---

## Understanding the Workflow

### The 16-Phase Pipeline

AgenticCoder executes in 16 orchestrated phases:

```
┌─────────────────────────────────────────────────────────────┐
│  ORCHESTRATION TIER (Phases 1-8)                            │
│  Sequential, mandatory, always executed                      │
├─────────────────────────────────────────────────────────────┤
│  Phase 1:  @plan        │ Project planning                  │
│  Phase 2:  @doc         │ Technical documentation           │
│  Phase 3:  @backlog     │ User stories & backlog            │
│  Phase 4:  @coordinator │ Task coordination                 │
│  Phase 5:  @qa          │ QA strategy                       │
│  Phase 6:  @reporter    │ Progress reporting                │
│  Phase 7:  @architect   │ System architecture               │
│  Phase 8:  @code-arch   │ Code structure                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ARCHITECTURE TIER (Phases 9-12)                            │
│  Conditional, based on your technology choices               │
├─────────────────────────────────────────────────────────────┤
│  Phase 9:  @azure-architect  │ If Azure selected            │
│  Phase 10: @bicep-specialist │ Infrastructure as Code       │
│  Phase 11: @azure-devops     │ If Azure DevOps CI/CD        │
│  Phase 12: @database         │ Database design              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  IMPLEMENTATION TIER (Phases 13-16)                         │
│  Parallel execution based on stack                           │
├─────────────────────────────────────────────────────────────┤
│  Phase 13: Frontend     │ @react / @vue / @angular / @svelte│
│  Phase 14: Backend      │ @nodejs / @dotnet / @python / @go │
│  Phase 15: DevOps       │ @devops-specialist / @docker      │
│  Phase 16: Final        │ @reporter (final report)          │
└─────────────────────────────────────────────────────────────┘
```

### Execution Time

| Project Complexity | Features | Approx. Time |
|-------------------|----------|--------------|
| Simple (S01) | 5-10 | 2-3 minutes |
| Medium (S02-S03) | 15-25 | 5-10 minutes |
| Complex (S04-S05) | 30+ | 15-30 minutes |

---

## Starting a Project

### Step 1: Define Your Requirements

Before starting, clarify:

**Project Basics:**
- [ ] Project name and purpose
- [ ] Target users
- [ ] Core features (5-10 max for first version)

**Technology Stack:**
- [ ] Frontend: React / Vue / Angular / Svelte / None
- [ ] Backend: Node.js / .NET / Python / Go / Java
- [ ] Database: PostgreSQL / MySQL / MongoDB
- [ ] Cloud: Azure / AWS / On-premises

**Project Parameters:**
- [ ] Team size
- [ ] Timeline
- [ ] Budget constraints
- [ ] Compliance needs (HIPAA, GDPR, etc.)

### Step 2: Select a Scenario

| Scenario | Best For | Stack | Monthly Cost |
|----------|----------|-------|--------------|
| **S01** | Solo MVP | React + Node.js + PostgreSQL + Azure | ~$35 |
| **S02** | Small startup | React + Node.js + MongoDB | ~$480 |
| **S03** | Growing SaaS | React + Node.js + AKS | $2K-5K |
| **S04** | Enterprise | Angular + Java + Oracle | $20K+ |
| **S05** | Healthcare | React + Node.js + HIPAA | $10K+ |

### Step 3: Invoke @plan Agent

In VS Code with GitHub Copilot:

```
@plan I want to build a [PROJECT NAME] with the following:

Project: [Brief description]
Frontend: [React/Vue/Angular/Svelte]
Backend: [Node.js/.NET/Python/Go/Java]
Database: [PostgreSQL/MySQL/MongoDB]
Platform: [Azure/AWS/On-premises]
Team: [Number] developers
Timeline: [Weeks/Months]
Scenario: [S01/S02/S03/S04/S05]

Key features:
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]
```

**Example:**

```
@plan I want to build a Task Management App with the following:

Project: A simple todo app for personal productivity
Frontend: React
Backend: Node.js with Express
Database: PostgreSQL
Platform: Azure
Team: 1 developer
Timeline: 4 weeks
Scenario: S01

Key features:
1. User authentication (email/password)
2. Create, edit, delete tasks
3. Mark tasks as complete
4. Filter by status
5. Due date reminders
```

### Step 4: Answer Clarifying Questions

@plan may ask:

```
@plan Questions:
1. Authentication method? (JWT / OAuth / Session)
2. API style? (REST / GraphQL)
3. Deployment region? (West Europe / East US / etc.)
4. Need real-time updates? (WebSocket / Polling)
```

Provide detailed answers for best results.

### Step 5: Confirm Architecture

@plan proposes an architecture:

```
Proposed Architecture:
─────────────────────
Frontend: React 18.2 with Redux Toolkit
Backend: Express.js 4.18 with TypeScript
Database: PostgreSQL 15 with Prisma ORM
Platform: Azure App Service B1
CI/CD: GitHub Actions
Auth: JWT with refresh tokens

Estimated Cost: $35/month
Timeline: 4-6 weeks

Proceed? (Yes / Modify / Cancel)
```

- **Yes** → Start generation
- **Modify** → Request changes
- **Cancel** → Abort

---

## Working with Agents

### Agent Categories

**Orchestration Agents** (Always Active):
| Agent | Purpose | Phase |
|-------|---------|-------|
| @plan | Project planning & orchestration | 1 |
| @doc | Technical documentation | 2 |
| @backlog | User stories & backlog | 3 |
| @coordinator | Task coordination | 4 |
| @qa | QA strategy & test planning | 5 |
| @reporter | Progress reporting | 6 |
| @architect | System architecture | 7 |
| @code-architect | Code structure design | 8 |

**Architecture Agents** (Conditional):
| Agent | Activates When | Phase |
|-------|----------------|-------|
| @azure-architect | Platform = Azure | 9 |
| @bicep-specialist | IaC required | 10 |
| @azure-devops-specialist | CI/CD = Azure DevOps | 11 |
| @database-specialist | Non-default DB config | 12 |

**Implementation Agents** (Based on Stack):
| Agent | Technology | Phase |
|-------|------------|-------|
| @react-specialist | React frontend | 13 |
| @vue-specialist | Vue.js frontend | 13 |
| @angular-specialist | Angular frontend | 13 |
| @svelte-specialist | Svelte frontend | 13 |
| @nodejs-specialist | Node.js backend | 14 |
| @dotnet-specialist | .NET backend | 14 |
| @python-specialist | Python backend | 14 |
| @go-specialist | Go backend | 14 |
| @devops-specialist | GitHub Actions | 15 |
| @docker-specialist | Containerization | 15 |

### Interacting with Agents

Each agent can be invoked directly:

```
@architect Show me the system diagram for phase 7
@react-specialist Explain the component structure
@bicep-specialist List the Azure resources
```

---

## Reviewing Output

### Output Structure

Generated files appear in `output/`:

```
output/
├── phase01-plan/
│   ├── project-overview.md
│   ├── requirements.md
│   └── scope.md
│
├── phase07-architect/
│   ├── architecture-diagram.md
│   ├── component-design.md
│   └── api-contracts.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── middleware/
│   ├── package.json
│   └── README.md
│
├── infrastructure/
│   ├── main.bicep
│   ├── modules/
│   └── parameters/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    └── DEPLOYMENT.md
```

### Quality Checks

Before using generated code:

1. **Review architecture** - Check `phase07-architect/` docs
2. **Validate infrastructure** - Run `az bicep build` on Bicep files
3. **Run tests** - Execute `npm test` in frontend/backend
4. **Check security** - Review auth and secrets handling

---

## Customization

### Configuration Options

Edit `.github/.agenticcoder/config/defaults.yaml`:

```yaml
config:
  max_tokens_per_agent: 2000
  parallel_execution: true
  auto_approval: false
  log_level: info

agents:
  react_specialist:
    framework_version: "18.2"
    state_management: "redux"
    styling: "tailwind"
  
  nodejs_specialist:
    framework: "express"
    orm: "prisma"
    typescript: true
```

### Agent Preferences

Override agent behavior:

```
@plan Use TypeScript for all code
@react-specialist Use Tailwind CSS instead of styled-components
@nodejs-specialist Use Fastify instead of Express
```

---

## Deployment

### Azure Deployment (Recommended)

1. **Review Bicep files**
   ```bash
   cd output/infrastructure
   az bicep build --file main.bicep
   ```

2. **Deploy infrastructure**
   ```bash
   az deployment group create \
     --resource-group myResourceGroup \
     --template-file main.bicep \
     --parameters @parameters/production.json
   ```

3. **Configure CI/CD**
   - Add Azure credentials to GitHub Secrets
   - Push code to trigger workflow

### Local Development

```bash
# Frontend
cd output/frontend
npm install
npm run dev  # http://localhost:3000

# Backend
cd output/backend
npm install
npm run dev  # http://localhost:4000

# Database
docker-compose up -d postgres
```

---

## Best Practices

### ✅ Do

- Start with a simple scenario (S01) for first project
- Provide detailed requirements to @plan
- Review architecture before implementation phases
- Run tests on generated code
- Customize gradually, not all at once

### ❌ Don't

- Skip the planning phase
- Ignore agent questions
- Deploy without reviewing security
- Mix incompatible technologies
- Expect perfection on first try

---

## ⏭️ Next Steps

- **[Scenarios](Scenarios)** - Detailed scenario walkthroughs
- **[Architecture](Architecture)** - Technical deep-dive
- **[FAQ](FAQ)** - Common questions answered

---

<p align="center">
  <a href="Getting-Started">← Getting Started</a> | <a href="Scenarios">Scenarios →</a>
</p>
