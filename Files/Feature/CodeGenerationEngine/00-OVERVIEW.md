# Feature: Code Generation Engine

## 📋 Overview

**Feature ID:** F-CGE-001  
**Priority:** 🔴 Critical  
**Estimated Duration:** 6-8 weeks  
**Dependencies:** AgentSkillExpansion (for full framework support)

---

## 🎯 Objective

Implement the core code generation capability that enables AgenticCoder to actually produce application code for ALL supported frameworks and Azure services.

---

## 📊 Current State vs Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Code Output | ❌ None | ✅ Full project generation |
| File Creation | ❌ None | ✅ Structured output |
| Templates | ❌ None | ✅ Framework templates (18 frameworks) |
| LLM Integration | ⚠️ MCP only | ✅ Code generation prompts |
| Azure Services | ❌ None | ✅ Full Bicep generation (15 services) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Orchestration Engine                   │
│                    (Already Exists)                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Code Generation Engine (NEW)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   Prompt    │ │  Template   │ │    Code     │       │
│  │  Composer   │ │   Engine    │ │  Validator  │       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         │               │               │               │
│         └───────────────┼───────────────┘               │
│                         ▼                               │
│              ┌─────────────────┐                        │
│              │   File Writer   │                        │
│              └────────┬────────┘                        │
└───────────────────────┼─────────────────────────────────┘
                        ▼
                ┌───────────────┐
                │    output/    │
                │  (Generated)  │
                └───────────────┘
```

---

## 📁 Phase Structure

| Phase | Name | Duration | Files |
|-------|------|----------|-------|
| 1 | Foundation | 1 week | [01-PHASE-FOUNDATION.md](01-PHASE-FOUNDATION.md) |
| 2 | Template System | 2 weeks | [02-PHASE-TEMPLATES.md](02-PHASE-TEMPLATES.md) |
| 3 | Code Generators | 3 weeks | [03-PHASE-GENERATORS.md](03-PHASE-GENERATORS.md) |
| 4 | Integration | 1 week | [04-PHASE-INTEGRATION.md](04-PHASE-INTEGRATION.md) |
| 5 | Testing & Polish | 1 week | [05-PHASE-TESTING.md](05-PHASE-TESTING.md) |

---

## 📦 Deliverables

### Core Components
- [ ] PromptComposer - Builds LLM prompts for code generation
- [ ] TemplateEngine - Manages boilerplate templates
- [ ] CodeValidator - Validates generated code
- [ ] FileWriter - Writes files to disk
- [ ] ProjectScaffolder - Creates project structure

### Frontend Generators (5)
- [ ] ReactGenerator - React 18+ with TypeScript
- [ ] VueGenerator - Vue 3 Composition API
- [ ] NextJSGenerator - Next.js 14+ App Router
- [ ] AngularGenerator - Angular 17+ standalone
- [ ] ViteGenerator - Vite toolchain configuration

### Backend Generators (4)
- [ ] ExpressGenerator - Express.js with TypeScript
- [ ] NestJSGenerator - NestJS modular architecture
- [ ] FastAPIGenerator - FastAPI with Pydantic
- [ ] DotNetGenerator - .NET 8+ Web API

### Database Generators (4)
- [ ] PostgreSQLGenerator - PostgreSQL with migrations
- [ ] AzureSQLGenerator - Azure SQL with T-SQL
- [ ] CosmosDBGenerator - Cosmos DB data modeling
- [ ] SQLServerGenerator - SQL Server on-premises

### Architecture Generators (3)
- [ ] MicroservicesGenerator - Multi-service scaffolding
- [ ] ServerlessGenerator - Azure Functions projects
- [ ] EventDrivenGenerator - Event-driven patterns

### Azure Infrastructure Generators (7)
- [ ] BicepGenerator - Azure IaC templates (existing)
- [ ] EntraIDGenerator - Identity/Auth configuration
- [ ] KeyVaultGenerator - Secrets management
- [ ] StorageGenerator - Blob/Table/Queue storage
- [ ] NetworkingGenerator - VNet/NSG/Private Endpoints
- [ ] MonitoringGenerator - App Insights/Log Analytics
- [ ] ContainerAppsGenerator - Container orchestration

### Tests
- [ ] Unit tests per component
- [ ] Integration tests
- [ ] E2E scenario tests (per framework)

---

## 📊 Generator Summary

| Category | Count | Generators |
|----------|-------|------------|
| Frontend | 5 | React, Vue, Next.js, Angular, Vite |
| Backend | 4 | Express, NestJS, FastAPI, .NET |
| Database | 4 | PostgreSQL, Azure SQL, Cosmos DB, SQL Server |
| Architecture | 3 | Microservices, Serverless, Event-Driven |
| Azure Infra | 7 | Bicep, Entra ID, Key Vault, Storage, Network, Monitor, Container Apps |
| **Total** | **23** | |

---

## 🔗 Related Files

- Wiki: [docs/wiki/Architecture.md](../../../docs/wiki/Architecture.md)
- Agents: [.github/agents/](../../../.github/agents/)
- Skills: [.github/skills/](../../../.github/skills/)

---

## 📝 Progress Tracking

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 1. Foundation | ⬜ Not Started | - | - |
| 2. Templates | ⬜ Not Started | - | - |
| 3. Generators | ⬜ Not Started | - | - |
| 4. Integration | ⬜ Not Started | - | - |
| 5. Testing | ⬜ Not Started | - | - |

**Overall Progress:** 0%
