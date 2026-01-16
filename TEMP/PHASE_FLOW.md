# Phase Flow & Dependencies Documentation

**Date**: January 13, 2026  
**Status**: Complete Reference - Phase 2 Complete
**Version**: 2.0

---

## Overview

AgenticCoder operates in **16 sequential phases** with clear **dependencies** and **conditional branching**. This document maps the complete flow, showing which phases depend on others and how they interconnect.

**Total System**: 26 agents across 3 tiers

- **Orchestration Tier**: 9 agents (always active)
- **Architecture Tier**: 4 agents (conditional - Azure/infrastructure)
- **Implementation Tier**: 13 agents (conditional - technology stack)

**Phase 2 Expansion**: 9 new agents added:

- Frontend alternatives: Vue, Angular, Svelte
- Backend alternatives: Node.js, Python, Go, Java
- Database: MySQL specialist
- Infrastructure: Docker specialist

**Option C Enhancements**:

- Configuration-driven phase activation
- Agent-to-agent communication protocols
- Artifact versioning and dependencies
- Feedback loops for quality gates

**See Also**:

- [Agent Activation Guide](AGENT_ACTIVATION_GUIDE.md) - Activation logic and conditions
- [Agent-Skill Mapping](AGENT_SKILL_MAPPING.md) - Complete handoff patterns
- [System Architecture](SYSTEM_ARCHITECTURE.md) - Technical architecture

---

## Phase Dependency Matrix

### Sequential Phases (Always Execute)

| Phase | Agent | Type | Duration | Input From | Output To | Blocking? |
|-------|-------|------|----------|------------|-----------|-----------|
| 1 | @plan | Planning | 30-60m | User | @doc | ✅ YES |
| 2 | @doc | Documentation | 30-45m | @plan | @backlog | ✅ YES |
| 3 | @backlog | Backlog | 20-30m | @doc | @coordinator | ✅ YES |
| 4 | @coordinator | Coordination | 20-30m | @backlog | @qa | ✅ YES |
| 5 | @qa | QA Strategy | 15-25m | @coordinator | @reporter | ✅ YES |
| 6 | @reporter | Monitoring | 15-20m | @qa | @architect | ✅ YES |
| 7 | @architect | Architecture | 45-90m | @reporter | @code-architect | ✅ YES |
| 8 | @code-architect | Code Structure | 45-90m | @architect | Phase 9-15 | ✅ YES |

### Conditional Phases (Depend on Decisions)

| Phase | Agent | Type | Duration | Activation Condition | Depends On | Blocking? |
|-------|-------|------|----------|----------------------|------------|-----------|
| 9 | @azure-architect | Cloud Arch | 30-45m | `platform == "Azure"` | @code-architect | ✅ YES |
| 9 | @bicep-specialist | IaC | 45-60m | `platform == "Azure" AND iac_required` | @azure-architect | ✅ YES |
| 12 | @devops-specialist | CI/CD | 30-45m | `ci_cd_platform == "GitHub Actions"` | @code-architect | ❌ NO |
| 13 | @react-specialist | Frontend | 60-120m | `frontend_framework == "React"` | @code-architect | ❌ NO |
| 13 | @vue-specialist | Frontend | 60-120m | `frontend_framework == "Vue.js"` | @code-architect | ❌ NO |
| 13 | @angular-specialist | Frontend | 60-120m | `frontend_framework == "Angular"` | @code-architect | ❌ NO |
| 13 | @svelte-specialist | Frontend | 60-120m | `frontend_framework == "Svelte"` | @code-architect | ❌ NO |
| 14 | @dotnet-specialist | Backend | 60-120m | `backend_framework == ".NET Core"` | @code-architect | ❌ NO |
| 14 | @nodejs-specialist | Backend | 60-120m | `backend_framework == "Node.js"` | @code-architect | ❌ NO |
| 14 | @python-specialist | Backend | 60-120m | `backend_framework == "Python"` | @code-architect | ❌ NO |
| 14 | @go-specialist | Backend | 60-120m | `backend_framework == "Go"` | @code-architect | ❌ NO |
| 14 | @java-specialist | Backend | 60-120m | `backend_framework == "Java"` | @code-architect | ❌ NO |
| 15 | @database-specialist | Database | 45-60m | `requires_database == true AND database != "MySQL"` | @code-architect | ❌ NO |
| 15 | @mysql-specialist | Database | 45-60m | `database_system == "MySQL"` | @code-architect | ❌ NO |
| 15 | @docker-specialist | Container | 30-45m | `requires_containerization == true` | Implementation agents | ❌ NO |
| 16 | @azure-devops-specialist | CI/CD | 30-45m | `ci_cd_platform == "Azure DevOps"` | @code-architect | ❌ NO |

**Total Phases**: 16  
**Total Agents**: 26 (9 orchestration + 4 architecture + 13 implementation)

---

## Detailed Phase Flow

### Phase 1: @plan - Project Planning & Discovery

```
INPUT: User interview/requirements
  │
  ├─ Discover project scope
  ├─ Identify constraints (budget, timeline, team)
  ├─ Gather success criteria
  ├─ Estimate timeline
  └─ Create initial team assignments
  │
OUTPUT: ProjectPlan artifact
  └─> @doc (mandatory next)
```

**Dependencies**: None (entry point)
**Blocking**: ✅ YES (all subsequent phases depend on this)

---

### Phase 2: @doc - Technical Documentation

```
INPUT: ProjectPlan from @plan
  │
  ├─ Generate technical specification
  ├─ Document system architecture (high-level)
  ├─ Define API contracts
  ├─ Create data model sketch
  └─ Document compliance requirements
  │
OUTPUT: TechnicalSpecification artifact
  └─> @backlog (mandatory next)
```

**Dependencies**: Requires successful @plan completion
**Blocking**: ✅ YES (backlog depends on spec)

---

### Phase 3: @backlog - Backlog Management

```
INPUT: TechnicalSpecification from @doc
  │
  ├─ Break specification into user stories
  ├─ Create acceptance criteria
  ├─ Estimate story points
  ├─ Organize into phases/sprints
  └─ Identify dependencies between stories
  │
OUTPUT: ProductBacklog artifact
  └─> @coordinator (mandatory next)
```

**Dependencies**: Requires successful @doc completion
**Blocking**: ✅ YES (coordination depends on backlog)

---

### Phase 4: @coordinator - Task Coordination

```
INPUT: ProductBacklog from @backlog
  │
  ├─ Organize tasks by phase/sprint
  ├─ Assign tasks to team members
  ├─ Identify critical path
  ├─ Calculate milestone dates
  └─ Create Gantt chart
  │
OUTPUT: ExecutionPlan artifact
  └─> @qa (mandatory next)
```

**Dependencies**: Requires successful @backlog completion
**Blocking**: ✅ YES (QA strategy depends on execution plan)

---

### Phase 5: @qa - QA Strategy

```
INPUT: ExecutionPlan from @coordinator
  │
  ├─ Define testing strategy
  ├─ Create test case templates
  ├─ Define QA metrics and KPIs
  ├─ Document bug severity levels
  └─ Create release criteria checklist
  │
OUTPUT: QAStrategy artifact
  └─> @reporter (mandatory next)
```

**Dependencies**: Requires successful @coordinator completion
**Blocking**: ✅ YES (monitoring depends on QA strategy)

---

### Phase 6: @reporter - Monitoring & Reporting Setup

```
INPUT: QAStrategy from @qa
  │
  ├─ Define monitoring targets
  ├─ Create dashboard specifications
  ├─ Define alert thresholds
  ├─ Plan reporting cadence
  └─ Document metrics to track
  │
OUTPUT: MonitoringPlan artifact
  └─> @architect (mandatory next)
```

**Dependencies**: Requires successful @qa completion
**Blocking**: ✅ YES (architecture depends on all requirements)

---

### Phase 7: @architect - Architecture Decisions

```
INPUT: All previous outputs + MonitoringPlan
  │
  ├─ DECISION POINT 1: Cloud Platform?
  │  ├─ Azure → Will trigger @azure-architect (Phase 9)
  │  ├─ AWS → Skip to Phase 8
  │  ├─ GCP → Skip to Phase 8
  │  └─ On-premises → Skip to Phase 8
  │
  ├─ Select technology stack
  ├─ Document scalability approach
  ├─ Plan disaster recovery
  ├─ Security architecture
  └─ Cost estimation
  │
OUTPUT: ArchitectureDecision artifact
  └─> @code-architect (mandatory next)
```

**Dependencies**: Requires all previous phases successful
**Blocking**: ✅ YES (code architecture depends on this)

---

### Phase 8: @code-architect - Code Structure Design

```
INPUT: ArchitectureDecision from @architect
  │
  ├─ DECISION POINT 2: Infrastructure-as-Code?
  │  ├─ YES + Azure → Will trigger @azure-architect (Phase 9)
  │  ├─ YES + other → Will trigger other IaC specialist
  │  └─ NO → Skip infrastructure phase
  │
  ├─ DECISION POINT 3: Frontend Framework?
  │  ├─ React → Will trigger @react-specialist (Phase 13)
  │  ├─ Vue.js → Will trigger @vue-specialist (Phase 13)
  │  ├─ Angular → Will trigger @angular-specialist (Phase 13)
  │  ├─ Svelte → Will trigger @svelte-specialist (Phase 13)
  │  └─ No frontend → Skip
  │
  ├─ DECISION POINT 4: Backend Framework?
  │  ├─ .NET Core → Will trigger @dotnet-specialist (Phase 14)
  │  ├─ Node.js → Will trigger @nodejs-specialist (Phase 14)
  │  ├─ Python → Will trigger @python-specialist (Phase 14)
  │  ├─ Go → Will trigger @go-specialist (Phase 14)
  │  ├─ Java → Will trigger @java-specialist (Phase 14)
  │  └─ No backend → Skip
  │
  ├─ DECISION POINT 5: Database?
  │  ├─ MySQL → Will trigger @mysql-specialist (Phase 15)
  │  ├─ PostgreSQL/SQL Server → Will trigger @database-specialist (Phase 15)
  │  └─ NO (stateless) → Skip database phase
  │
  ├─ DECISION POINT 6: CI/CD Platform?
  │  ├─ "GitHub Actions" → Will trigger @devops-specialist (Phase 12)
  │  ├─ "Azure DevOps" → Will trigger @azure-devops-specialist (Phase 16)
  │  └─ null/default → Will trigger @devops-specialist (Phase 12)
  │
  ├─ Generate folder structure templates
  ├─ Document layer architecture
  ├─ Define design patterns
  ├─ Frontend architecture (if applicable)
  ├─ Backend architecture (if applicable)
  └─ Data model (if applicable)
  │
OUTPUT: CodeArchitecture artifact
  └─> Phases 9-16 (parallel or sequential)
```

**Dependencies**: Requires successful @architect completion
**Blocking**: ✅ YES (all implementation depends on this)

---

## Phase 9-16: Implementation Layers

### Implementation Branch 1: Azure Infrastructure (Conditional)

```
Trigger: @architect decision = Azure AND iac_required = true

@azure-architect (Phase 9)
    │
    ├─ Resource recommendation
    ├─ Cost breakdown
    ├─ HA strategy
    ├─ Region selection
    └─ Scaling approach
    │
    └─> @bicep-specialist (Phase 9)
            │
            ├─ Generate Bicep templates
            ├─ Create parameter files
            ├─ Document deployment
            └─ Ready for deployment
            │
            └─> Next: Frontend/Backend/Database phases
```

---

### Implementation Branch 2: CI/CD Setup (Parallel to Branch 1)

```
Two Parallel Options:

Option A: GitHub Actions (default or explicit)
Trigger: ci_cd_platform = "GitHub Actions"

@devops-specialist (Phase 12)
    │
    ├─ Generate GitHub Actions workflows
    ├─ Build pipeline
    ├─ Deploy pipeline
    ├─ Testing pipeline
    └─ Ready for integration
    │
    └─> Merge with other implementation phases

---

Option B: Azure DevOps (explicit choice)
Trigger: ci_cd_platform = "Azure DevOps"

@azure-devops-specialist (Phase 16)
    │
    ├─ Generate azure-pipelines.yml
    ├─ Configure approval gates
    ├─ Set deployment strategies
    ├─ Security scanning
    └─ Ready for integration
    │
    └─> Merge with other implementation phases
```

**NOTE**: Only ONE of Phase 12 OR Phase 16 activates (mutually exclusive)

---

### Implementation Branch 3: Frontend (Conditional)

```
Four Frontend Options (mutually exclusive):

Option A: React
Trigger: frontend_framework = "React"

@react-specialist (Phase 13)
    │
    ├─ Generate React components
    ├─ State management setup (Zustand/Redux/TanStack Query)
    ├─ Custom hooks
    ├─ API service layer
    ├─ Type definitions (TypeScript)
    └─ Unit tests

---

Option B: Vue.js
Trigger: frontend_framework = "Vue.js"

@vue-specialist (Phase 13)
    │
    ├─ Generate Vue 3 components (Composition API)
    ├─ Pinia store configuration
    ├─ Composables for reusable logic
    ├─ Router setup
    ├─ API service layer
    └─ Unit tests (Vitest)

---

Option C: Angular
Trigger: frontend_framework = "Angular"

@angular-specialist (Phase 13)
    │
    ├─ Generate standalone Angular components
    ├─ Service layer with dependency injection
    ├─ RxJS observables and NgRx state
    ├─ Route guards and resolvers
    ├─ Type definitions (TypeScript)
    └─ Unit tests (Jasmine/Karma)

---

Option D: Svelte
Trigger: frontend_framework = "Svelte"

@svelte-specialist (Phase 13)
    │
    ├─ Generate Svelte components
    ├─ SvelteKit routes and layouts
    ├─ Reactive stores for state management
    ├─ Actions and custom directives
    ├─ Animations and transitions
    └─ Unit and E2E tests (Vitest, Playwright)
```

---

### Implementation Branch 4: Backend (Conditional)

```
Five Backend Options (mutually exclusive):

Option A: .NET Core
Trigger: backend_framework = ".NET Core"

@dotnet-specialist (Phase 14)
    │
    ├─ Generate ASP.NET controllers
    ├─ Business logic services
    ├─ Entity Framework models
    ├─ Dependency injection setup
    ├─ Middleware configuration
    └─ Unit tests (xUnit, NUnit)

---

Option B: Node.js
Trigger: backend_framework = "Node.js"

@nodejs-specialist (Phase 14)
    │
    ├─ Generate Express/Fastify routes
    ├─ Middleware stack configuration
    ├─ Service layer and business logic
    ├─ Error handling and logging
    ├─ Input validation and security
    └─ Unit tests (Vitest, Jest)

---

Option C: Python
Trigger: backend_framework = "Python"

@python-specialist (Phase 14)
    │
    ├─ Generate FastAPI route handlers
    ├─ Pydantic models for validation
    ├─ Dependency injection setup
    ├─ Async database queries
    ├─ Security and authentication
    └─ Unit tests (Pytest)

---

Option D: Go
Trigger: backend_framework = "Go"

@go-specialist (Phase 14)
    │
    ├─ Generate HTTP handlers
    ├─ Middleware chains
    ├─ Goroutine-based concurrency
    ├─ Channel-based communication
    ├─ Error handling patterns
    └─ Unit tests (Go testing)

---

Option E: Java
Trigger: backend_framework = "Java"

@java-specialist (Phase 14)
    │
    ├─ Generate Spring Boot controllers
    ├─ Service and repository layers
    ├─ JPA/Hibernate entity models
    ├─ Aspect-oriented programming (AOP)
    ├─ Dependency injection configuration
    └─ Unit tests (JUnit, Mockito)
```

---

### Implementation Branch 5: Database (Conditional)

```
Two Database Options:

Option A: MySQL
Trigger: database_system = "MySQL"

@mysql-specialist (Phase 15)
    │
    ├─ Generate MySQL DDL scripts
    ├─ Normalization and relationships
    ├─ Performance optimization (indexing)
    ├─ Database migrations
    ├─ Backup and recovery procedures
    └─ Query optimization examples

---

Option B: Other SQL (PostgreSQL, SQL Server, etc.)
Trigger: requires_database = true AND database != "MySQL"

@database-specialist (Phase 15)
    │
    ├─ Generate SQL DDL scripts
    ├─ Create migrations
    ├─ Define indexes and constraints
    ├─ ORM configuration
    ├─ Seed data scripts
    └─ Database documentation
```

---

### Implementation Branch 6: Containerization (Conditional)

```
Trigger: requires_containerization = true OR deploy_strategy = "containerized"

@docker-specialist (Phase 15)
    │
    ├─ Generate multi-stage Dockerfiles
    ├─ Create docker-compose.yml for local dev
    ├─ Configure .dockerignore
    ├─ Image optimization (layer caching, Alpine base)
    ├─ Health checks and readiness probes
    └─ Container security best practices

Dependencies: Implementation agents complete (frontend/backend/database)
Hands Off To: @devops-specialist OR @azure-devops-specialist

Scenarios:
  ✅ Kubernetes/AKS deployment
  ✅ Microservices architecture
  ✅ Multi-environment deployment (dev/staging/prod)
  ❌ Serverless deployment (Azure Functions, AWS Lambda)
  ❌ Static site hosting
```

---

## Complete Flow Diagram

```
                        START
                         │
                    ┌────┴────┐
                    │ @plan   │ Phase 1
                    │ (30-60m)│
                    └────┬────┘
                         │
                    ┌────┴────┐
                    │ @doc    │ Phase 2
                    │ (30-45m)│
                    └────┬────┘
                         │
                   ┌─────┴─────┐
                   │ @backlog  │ Phase 3
                   │ (20-30m)  │
                   └────┬──────┘
                        │
                  ┌─────┴──────┐
                  │@coordinator│ Phase 4
                  │ (20-30m)   │
                  └────┬───────┘
                       │
                   ┌───┴────┐
                   │  @qa   │ Phase 5
                   │(15-25m)│
                   └───┬────┘
                       │
                  ┌────┴────┐
                  │@reporter│ Phase 6
                  │(15-20m) │
                  └────┬────┘
                       │
                  ┌────┴────────┐
                  │ @architect  │ Phase 7
                  │ (45-90m)    │
                  └────┬────────┘
                       │
                 ┌─────┴──────┐
                 │@code-arch  │ Phase 8
                 │ (45-90m)   │
                 └─────┬──────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
    ┌───┴────┐    ┌────┴────┐   ┌────┴────┐    ┌──┴──┐
    │Azure?  │    │Frontend?│   │Backend? │    │Data?│
    └───┬────┘    └────┬────┘   └────┬────┘    └──┬──┘
    ┌───┴───┐        ┌──┴──┐      ┌──┴──┐       ┌──┴──┐
    │@azure │        │React?      │.NET?│       │Yes  │
    │-arch  │        │  Yes       │Yes  │       │    │
    │(30m)  │        └──┬──┘      └──┬──┘       └──┬──┘
    └───┬───┘        ┌──┴──────┐   ┌──┴─────┐   ┌──┴────────┐
    ┌───┴──────┐     │@react   │   │@dotnet │   │@database  │
    │@bicep    │     │(60-120m)│   │(60-120m)   │(45-60m)   │
    │(45-60m)  │     └────┬────┘   └───┬────┘   └────┬──────┘
    └───┬──────┘          │            │             │
        └────────┬────────┴────────────┴─────────────┘
                 │
            ┌────┴─────────────────────┐
            │   CI/CD Platform?        │
            └────┬──────────────────┬──┘
              ┌──┴──┐           ┌──┴──┐
              │GitHub           │Azure │
              │Actions?         │DevOps?
              └──┬──┘           └──┬──┘
            ┌───┴─────────┐   ┌────┴──────┐
            │@devops-spec │   │@azure-dev │
            │(30-45m)     │   │(30-45m)   │
            └───┬─────────┘   └────┬──────┘
                └────┬─────────────┘
                     │
                  COMPLETE
```

---

## Dependency Graph (Text Format)

### Strict Linear Dependencies (Phases 1-8)
```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6 ──→ Phase 7 ──→ Phase 8
(BLOCKING)  (BLOCKING)  (BLOCKING)  (BLOCKING)  (BLOCKING)  (BLOCKING)  (BLOCKING)
```

### Conditional Branches from Phase 8
```
Phase 8 ────→ Phase 9-16 (NOT ALL REQUIRED)
  │
  ├──→ Phase 9a (@azure-architect)    ─→ Phase 9b (@bicep-specialist)  [IF Azure]
  ├──→ Phase 12 (@devops-specialist)  [IF GitHub Actions]
  ├──→ Phase 13 (@react-specialist)   [IF React]
  ├──→ Phase 14 (@dotnet-specialist)  [IF .NET Core]
  ├──→ Phase 15 (@database-specialist) [IF Database]
  └──→ Phase 16 (@azure-devops-specialist) [IF Azure DevOps]
```

### Parallelization Opportunity
```
After Phase 8 completes:
- Phases 12, 13, 14, 15 CAN run in parallel (no dependencies between them)
- Phase 9a must complete before Phase 9b
- EITHER Phase 12 OR Phase 16 (mutually exclusive)
```

---

## Phase Execution Scenarios

### Scenario 1: S01 Solo MVP (React + .NET + PostgreSQL + Azure)

**Activation Sequence**:
```
1. @plan         (30m) ─────────┐
2. @doc          (35m) ─────────┤
3. @backlog      (25m) ─────────┤
4. @coordinator  (25m) ─────────┤ SEQUENTIAL
5. @qa           (20m) ─────────┤ (BLOCKING)
6. @reporter     (17m) ─────────┤
7. @architect    (60m) ─────────┤ Total: 6.5h
8. @code-architect(60m)─────────┘
                       │
                    DECISION: Azure + React + .NET + PostgreSQL + Default CI/CD
                       │
   ┌────────────────────┼────────────────────┬────────────────────┐
   │                    │                    │                    │
9a. @azure-architect   9b. @react-sp.        @dotnet-sp.          @database-sp.
   (35m)  ──→           (90m)               (90m)                (50m)
                    [CAN PARALLEL]      [CAN PARALLEL]      [CAN PARALLEL]
   │                    │                    │                    │
9b. @bicep-specialist  │                    │                    │
   (50m)  ─────┐       │                    │                    │
              └─────────┼────────────────────┼────────────────────┘
                        │
                    @devops-specialist (GitHub Actions default)
                    (40m)
                        │
                    COMPLETE: 8.5-9h total
```

---

### Scenario 3: S03 Medium SaaS (React + Node.js + PostgreSQL + Azure)

**Activation Sequence**:
```
1-8: Same as S01 (6.5h orchestration)

After @code-architect decision:
- ✅ Azure selected → @azure-architect (Phase 9a)
- ✅ React frontend → @react-specialist (Phase 13)
- ❌ .NET NOT selected → Skip @dotnet-specialist
- ✅ Database needed → @database-specialist (Phase 15)
- ✅ Default CI/CD → @devops-specialist (Phase 12)

Parallel phases:
   9a. @azure-architect  (35m)  ──→ 9b. @bicep-specialist (50m)
   13. @react-specialist (90m)
   15. @database-specialist (50m)
   12. @devops-specialist (40m)

Critical path: 9a → 9b takes longest in infrastructure (85m)
But 13 (@react) takes 90m, so overall time ~90m for all branches
Total: 6.5h + 1.5h = 8h
```

---

### Scenario 4: S04 Enterprise SPA (React only, API elsewhere)

**Activation Sequence**:
```
1-8: Same (6.5h)

After @code-architect decision:
- ❌ Azure NOT selected (on-premises) → Skip @azure-architect
- ✅ React frontend → @react-specialist (Phase 13)
- ❌ No backend (API elsewhere) → Skip @dotnet-specialist
- ❌ No database (stateless) → Skip @database-specialist
- ✅ GitHub Actions → @devops-specialist (Phase 12)

Phases executed:
   13. @react-specialist (90m)
   12. @devops-specialist (40m)

Critical path: @react takes longest (90m)
Total: 6.5h + 1.5h = 8h
```

---

### Scenario 5: S05 Healthcare (React + Node.js + PostgreSQL + Azure + Azure DevOps + HIPAA)

**Activation Sequence**:
```
1-8: Same (6.5h)

After @code-architect decision:
- ✅ Azure + Enterprise features → @azure-architect (Phase 9a)
- ✅ React frontend → @react-specialist (Phase 13)
- ❌ .NET NOT selected → Skip @dotnet-specialist
- ✅ Database needed (HIPAA encrypted) → @database-specialist (Phase 15)
- ✅ Azure DevOps explicit → @azure-devops-specialist (Phase 16)

Parallel phases:
   9a. @azure-architect  (35m)  ──→ 9b. @bicep-specialist (50m, HIPAA security)
   13. @react-specialist (90m)
   15. @database-specialist (60m, HIPAA compliance)
   16. @azure-devops-specialist (45m, enterprise approval gates)

Critical path: Either 9a→9b (85m) or @react (90m)
Total: 6.5h + 1.5h = 8h
```

---

## Phase Duration Summary

### Orchestration Phases (Always Run)
| Phase | Agent | Min | Max | Typical |
|-------|-------|-----|-----|---------|
| 1 | @plan | 30m | 60m | 45m |
| 2 | @doc | 30m | 45m | 35m |
| 3 | @backlog | 20m | 30m | 25m |
| 4 | @coordinator | 20m | 30m | 25m |
| 5 | @qa | 15m | 25m | 20m |
| 6 | @reporter | 15m | 20m | 17m |
| 7 | @architect | 45m | 90m | 60m |
| 8 | @code-architect | 45m | 90m | 60m |
| **Total (1-8)** | - | **220m** | **390m** | **287m** (4.8h) |

### Infrastructure Phases (Conditional)
| Phase | Agent | Min | Max | Typical |
|-------|-------|-----|-----|---------|
| 9a | @azure-architect | 30m | 45m | 35m |
| 9b | @bicep-specialist | 45m | 60m | 50m |

### Implementation Phases (Conditional, Parallel)
| Phase | Agent | Min | Max | Typical |
|-------|-------|-----|-----|---------|
| 12 | @devops-specialist | 30m | 45m | 40m |
| 13 | @react-specialist | 60m | 120m | 90m |
| 14 | @dotnet-specialist | 60m | 120m | 90m |
| 15 | @database-specialist | 45m | 60m | 50m |
| 16 | @azure-devops-specialist | 30m | 45m | 40m |

---

## Key Rules

### Rule 1: Sequential Blocking (Phases 1-8)
Each phase must complete successfully before the next starts. No parallelization in orchestration tier.

### Rule 2: Conditional Activation
Phases 9-16 only activate based on explicit conditions in @code-architect output.

### Rule 3: Parallelization Allowed
After Phase 8, phases 12, 13, 14, 15 can run simultaneously (no dependencies).

### Rule 4: Infrastructure Sequencing
If Azure selected, @azure-architect must complete before @bicep-specialist starts.

### Rule 5: Mutual Exclusivity
Exactly ONE of Phase 12 (@devops-specialist) OR Phase 16 (@azure-devops-specialist) activates.

### Rule 6: Optional Phases
Phases 9, 12, 13, 14, 15, 16 are completely optional based on architecture decisions.

---

## Optimization Strategies

### Parallel Execution
```
After Phase 8 completes, execute in parallel:
- Phase 9a + 9b (infrastructure, sequential internally)
- Phase 13 (@react-specialist)
- Phase 14 (@dotnet-specialist)
- Phase 15 (@database-specialist)
- Phase 12 OR 16 (@devops-specialist OR @azure-devops-specialist)

Fastest path: ~90-100m for Phase 13 (React) + Phase 9a→9b (85m)
Bottleneck: Usually Phase 13 or Phase 9b (85-90m whichever is longer)
```

### Sequential Execution
```
Run phases one by one:
Phase 8 → 9a → 9b → 13 → 14 → 15 → 12/16
Time: ~50m (infrastructure) + ~90m (React) + ~90m (.NET) + ~50m (DB) + ~40m (CI/CD)
Total: 320m (5.3h) - Less efficient
```

### Hybrid Approach (Recommended)
```
Sequential: Phases 1-8 (required dependencies)
Parallel: Phase 9a runs alone, then 9b starts while 13/14/15/12-16 run in parallel
Time: 4.8h (phases 1-8) + 1.5h (phase 9a→9b parallel with 13/14/15/12)
Total: 6.3h - Optimized
```

---

**Next Steps**: Use this guide to:
- Understand the complete system flow
- Optimize phase execution order
- Debug dependencies
- Plan project timelines
- Add new phases in the future

