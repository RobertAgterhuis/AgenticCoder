# Agent Activation Guide

**Date**: January 13, 2026  
**Status**: Complete Reference Document - Phase 2 Complete
**Version**: 2.0

---

## Overview

AgenticCoder has **26 specialized agents** organized in **3 tiers**:

1. **Orchestration Tier** (9 agents): Always activated, sequential
2. **Architecture Tier** (4 agents): Conditional, based on platform choice
3. **Implementation Tier** (13 agents): Conditional, based on technology stack

**Phase 2 Expansion** (9 new agents):
- Frontend: @vue-specialist, @angular-specialist, @svelte-specialist
- Backend: @nodejs-specialist, @python-specialist, @go-specialist, @java-specialist
- Database: @mysql-specialist
- Infrastructure: @docker-specialist

**Option C Enhancements**:
- Configuration-driven agent behavior
- Agent-to-agent communication
- Artifact versioning and rollback
- Feedback loops for quality control

This guide explains **when each agent activates**, **what triggers it**, and **what prerequisites it needs**.

**See Also**:
- [Complete Agent-Skill Mapping](AGENT_SKILL_MAPPING.md) - Full handoff patterns
- [Phase Flow](PHASE_FLOW.md) - Visual workflow diagrams
- [System Architecture](SYSTEM_ARCHITECTURE.md) - Technical architecture

---

## Tier 1: Orchestration Layer (Phases 1-8)

### Always Activated - These agents run for every project

---

## Phase 1: @plan Agent

**Status**: ✅ **ALWAYS ACTIVATED** (Entry point)

| Property | Value |
|----------|-------|
| **Agent ID** | @plan |
| **Phase** | 1 |
| **Classification** | Project Planning & Discovery |
| **Trigger** | User initiates new project |
| **Activation Condition** | Always |
| **Prerequisites** | None (first agent) |
| **Input Source** | User (interactive discovery) |
| **Output** | ProjectPlan artifact |
| **Hands Off To** | @doc |

### Activation Logic
```
Every project starts with @plan
No conditions required
```

### What @plan Generates
- Project overview and scope
- Requirements specification
- Success criteria
- Timeline estimates
- Team assignments

---

## Phase 2: @doc Agent

**Status**: ✅ **ALWAYS ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @doc |
| **Phase** | 2 |
| **Classification** | Technical Documentation |
| **Trigger** | @plan completes with ProjectPlan |
| **Activation Condition** | Always (after @plan) |
| **Prerequisites** | ProjectPlan artifact from @plan |
| **Input Source** | ProjectPlan output |
| **Output** | Technical specification documents |
| **Hands Off To** | @backlog |

### Activation Logic
```
IF phase == 1 AND @plan.status == "success"
THEN activate @doc
```

### What @doc Generates
- Technical specification
- API specification (if backend exists)
- Architecture overview
- Technology decisions
- Design documentation

---

## Phase 3: @backlog Agent

**Status**: ✅ **ALWAYS ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @backlog |
| **Phase** | 3 |
| **Classification** | Backlog Management |
| **Trigger** | @doc completes |
| **Activation Condition** | Always (after @doc) |
| **Prerequisites** | Technical spec from @doc |
| **Input Source** | @doc output |
| **Output** | User stories and task backlog |
| **Hands Off To** | @coordinator |

### Activation Logic
```
IF phase == 2 AND @doc.status == "success"
THEN activate @backlog
```

### What @backlog Generates
- User stories (estimated)
- Sprint/phase breakdown
- Task assignments
- Acceptance criteria
- Dependency graph

---

## Phase 4: @coordinator Agent

**Status**: ✅ **ALWAYS ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @coordinator |
| **Phase** | 4 |
| **Classification** | Task Coordination |
| **Trigger** | @backlog completes |
| **Activation Condition** | Always (after @backlog) |
| **Prerequisites** | Backlog from @backlog |
| **Input Source** | @backlog output |
| **Output** | Phase execution plan |
| **Hands Off To** | @qa |

### Activation Logic
```
IF phase == 3 AND @backlog.status == "success"
THEN activate @coordinator
```

### What @coordinator Generates
- Phase execution order
- Critical path analysis
- Resource allocation
- Risk assessment
- Milestone definitions

---

## Phase 5: @qa Agent

**Status**: ✅ **ALWAYS ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @qa |
| **Phase** | 5 |
| **Classification** | QA Strategy Planning |
| **Trigger** | @coordinator completes |
| **Activation Condition** | Always (after @coordinator) |
| **Prerequisites** | Execution plan from @coordinator |
| **Input Source** | @coordinator output |
| **Output** | QA strategy and test plan |
| **Hands Off To** | @reporter |

### Activation Logic
```
IF phase == 4 AND @coordinator.status == "success"
THEN activate @qa
```

### What @qa Generates
- Test strategy document
- Test case specifications
- QA metrics and KPIs
- Bug severity guidelines
- Release criteria

---

## Phase 6: @reporter Agent

**Status**: ✅ **ALWAYS ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @reporter |
| **Phase** | 6 |
| **Classification** | Monitoring & Reporting |
| **Trigger** | @qa completes |
| **Activation Condition** | Always (after @qa) |
| **Prerequisites** | QA plan from @qa |
| **Input Source** | @qa output |
| **Output** | Monitoring and reporting plan |
| **Hands Off To** | @architect |

### Activation Logic
```
IF phase == 5 AND @qa.status == "success"
THEN activate @reporter
```

### What @reporter Generates
- Monitoring strategy
- Dashboard specifications
- Alert definitions
- Metrics to track
- Reporting templates

---

## Phase 7: @architect Agent

**Status**: ✅ **ALWAYS ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @architect |
| **Phase** | 7 |
| **Classification** | Architecture Design |
| **Trigger** | @reporter completes |
| **Activation Condition** | Always (after @reporter) |
| **Prerequisites** | Requirements from all previous phases |
| **Input Source** | All previous outputs |
| **Output** | Architecture decisions and tech stack |
| **Hands Off To** | @code-architect (always), @azure-architect (if Azure) |

### Activation Logic
```
IF phase == 6 AND @reporter.status == "success"
THEN activate @architect
```

### What @architect Generates
- Architecture decision matrix
- Technology recommendations
- High-level system design
- Scalability strategy
- Security strategy

---

## Phase 8: @code-architect Agent

**Status**: ✅ **ALWAYS ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @code-architect |
| **Phase** | 8 |
| **Classification** | Code Architecture & Structure |
| **Trigger** | @architect completes |
| **Activation Condition** | Always (after @architect) |
| **Prerequisites** | Architecture decisions from @architect |
| **Input Source** | @architect output |
| **Output** | Code structure and design patterns |
| **Hands Off To** | @azure-architect OR @bicep-specialist (infrastructure), @react-specialist, @dotnet-specialist, @database-specialist (implementation) |

### Activation Logic
```
IF phase == 7 AND @architect.status == "success"
THEN activate @code-architect
```

### What @code-architect Generates
- Folder structure templates
- Layer architecture definitions
- Design patterns to use
- Frontend architecture (React, state management)
- Backend architecture (services, repositories)
- API contract specifications
- Data model design

---

## Tier 2: Architecture Implementation (Phases 9-12)

### Conditionally Activated - Based on Architecture Decisions

---

## Phase 9: @azure-architect Agent

**Status**: ⚠️ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @azure-architect |
| **Phase** | 9 |
| **Classification** | Cloud Architecture (Azure-specific) |
| **Trigger** | @architect selects Azure as platform |
| **Activation Condition** | `architecture.platform == "Azure"` |
| **Prerequisites** | Architecture decisions from @architect |
| **Input Source** | @architect output |
| **Output** | Azure resource plan and cost breakdown |
| **Hands Off To** | @bicep-specialist |

### Activation Logic
```
IF phase == 7 AND @architect.status == "success"
AND architect_decision.platform == "Azure"
THEN activate @azure-architect (Phase 9)
ELSE skip @azure-architect
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Architecture decision: `platform = "Azure"`
- Project needs Azure infrastructure
- Team wants Azure-native services

❌ **SKIPS when:**
- Platform chosen: AWS, GCP, or on-premises
- No cloud infrastructure needed
- Different platform already selected in @architect

### What @azure-architect Generates
- Azure resource recommendations (App Service, Database, etc.)
- Cost breakdown and optimization
- Scaling strategy for Azure
- High-availability setup
- Region selection and redundancy plan

---

## Phase 9: @bicep-specialist Agent

**Status**: ⚠️ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @bicep-specialist |
| **Phase** | 9 |
| **Classification** | Infrastructure-as-Code (Azure) |
| **Trigger** | @azure-architect completes (if Azure) OR infrastructure-as-code required |
| **Activation Condition** | `platform == "Azure" AND iac_required == true` |
| **Prerequisites** | Azure resource plan from @azure-architect |
| **Input Source** | @azure-architect output |
| **Output** | Bicep infrastructure modules |
| **Hands Off To** | @devops-specialist OR @azure-devops-specialist |

### Activation Logic
```
IF @azure-architect.status == "success"
OR (iac_required == true AND platform == "Azure")
THEN activate @bicep-specialist (Phase 9)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Azure platform selected
- Infrastructure-as-code generation needed
- Deploying to Azure cloud

❌ **SKIPS when:**
- Non-Azure platform
- Manual infrastructure setup preferred
- No infrastructure automation needed

### What @bicep-specialist Generates
- Bicep template files (main.bicep, modules/)
- Parameter files (parameters.json)
- Deployment scripts
- Infrastructure documentation

---

## Phase 12: @devops-specialist Agent

**Status**: ⚠️ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @devops-specialist |
| **Phase** | 12 |
| **Classification** | CI/CD Pipeline (GitHub Actions) |
| **Trigger** | @code-architect completes + GitHub-based workflow chosen |
| **Activation Condition** | `ci_cd_platform == "GitHub Actions"` OR not specified (default) |
| **Prerequisites** | Code structure from @code-architect, Bicep modules (if Azure) |
| **Input Source** | @code-architect output, infrastructure code |
| **Output** | GitHub Actions workflow files |
| **Hands Off To** | Project deployment ready |

### Activation Logic
```
IF @code-architect.status == "success"
AND (ci_cd_platform == "GitHub Actions" OR ci_cd_platform == null)
THEN activate @devops-specialist (Phase 12)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Repository hosted on GitHub
- CI/CD platform not explicitly specified (default)
- Want vendor-neutral pipelines
- Deploying to any cloud platform

❌ **SKIPS when:**
- Explicitly selected Azure DevOps
- Using non-GitHub CI/CD platform

### What @devops-specialist Generates
- `.github/workflows/build.yml`
- `.github/workflows/deploy-dev.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-prod.yml`
- Security scanning workflows
- Performance testing workflows

---

## Phase 16: @azure-devops-specialist Agent

**Status**: ⚠️ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @azure-devops-specialist |
| **Phase** | 16 |
| **Classification** | CI/CD Pipeline (Azure DevOps) |
| **Trigger** | @code-architect completes + Azure DevOps platform chosen |
| **Activation Condition** | `ci_cd_platform == "Azure DevOps"` OR (`platform == "Azure"` AND enterprise_features == true) |
| **Prerequisites** | Code structure from @code-architect, infrastructure from @bicep-specialist |
| **Input Source** | @code-architect output, infrastructure code |
| **Output** | Azure Pipelines YAML configuration |
| **Hands Off To** | Project deployment ready |

### Activation Logic
```
IF @code-architect.status == "success"
AND (ci_cd_platform == "Azure DevOps" 
     OR (platform == "Azure" AND enterprise_features == true))
THEN activate @azure-devops-specialist (Phase 16)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Explicitly selected Azure DevOps
- Azure platform + enterprise approval gates needed
- Compliance requirements (HIPAA, PCI-DSS)
- Team already invested in Azure DevOps

❌ **SKIPS when:**
- GitHub Actions selected
- Non-Azure platform
- Simple approval gates acceptable

### What @azure-devops-specialist Generates
- `azure-pipelines.yml`
- Environment configurations
- Approval policies and gates
- Security scanning configurations
- Deployment strategies (Blue-Green, Canary, etc.)

---

## Tier 3: Implementation (Phases 13-16)

### Technology-Specific Agents - Based on Tech Stack

---

## Phase 13: @react-specialist Agent

**Status**: ⚠️ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @react-specialist |
| **Phase** | 13 |
| **Classification** | Frontend Implementation (React) |
| **Trigger** | @code-architect selects React as frontend framework |
| **Activation Condition** | `frontend_framework == "React"` |
| **Prerequisites** | Frontend architecture from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | React components, hooks, stores |
| **Hands Off To** | @dotnet-specialist (or other backend specialist) |

### Activation Logic
```
IF @code-architect.status == "success"
AND frontend_framework == "React"
THEN activate @react-specialist (Phase 13)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Frontend framework: React
- Building web UI with React
- SPA (Single Page Application) architecture

❌ **SKIPS when:**
- Frontend framework: Vue, Angular, Svelte
- Backend-only project
- Native mobile development

### What @react-specialist Generates
- React components (UI, feature, page)
- Custom hooks
- State management (Zustand, Redux, TanStack Query)
- API service layer
- Type definitions (TypeScript)
- Unit tests (Vitest, Jest)

---

## Phase 13b: @vue-specialist Agent

**Status**: ✅ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @vue-specialist |
| **Phase** | 13 |
| **Classification** | Frontend Implementation (Vue.js) |
| **Trigger** | @code-architect selects Vue.js as frontend framework |
| **Activation Condition** | `frontend_framework == "Vue.js"` OR `frontend_framework == "Vue 3"` |
| **Prerequisites** | Frontend architecture from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | Vue components, composables, stores |
| **Hands Off To** | Backend specialist (Node.js, Python, Go, Java, etc.) |

### Activation Logic
```
IF @code-architect.status == "success"
AND (frontend_framework == "Vue.js" OR frontend_framework == "Vue 3")
THEN activate @vue-specialist (Phase 13)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Frontend framework: Vue.js (v3+)
- Building web UI with Composition API
- Progressive enhancement with Pinia

❌ **SKIPS when:**
- Frontend framework: React, Angular, Svelte
- Backend-only project
- Native mobile development

### What @vue-specialist Generates
- Single-File Components (.vue files)
- Composables for reusable logic
- Pinia store modules
- Router configuration
- API service layer
- TypeScript types
- Unit tests (Vitest)

---

## Phase 13c: @angular-specialist Agent

**Status**: ✅ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @angular-specialist |
| **Phase** | 13 |
| **Classification** | Frontend Implementation (Angular) |
| **Trigger** | @code-architect selects Angular as frontend framework |
| **Activation Condition** | `frontend_framework == "Angular"` |
| **Prerequisites** | Frontend architecture from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | Angular components, services, modules |
| **Hands Off To** | Backend specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND frontend_framework == "Angular"
THEN activate @angular-specialist (Phase 13)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Frontend framework: Angular (v15+)
- Enterprise SPA requirements
- Standalone component architecture

❌ **SKIPS when:**
- Frontend framework: React, Vue, Svelte
- Lightweight SPA preferred
- Backend-only project

### What @angular-specialist Generates
- Standalone Angular components
- Services with dependency injection
- RxJS observables and NgRx state management
- Route guards and resolvers
- Interceptors for HTTP handling
- Custom directives and pipes
- Unit tests (Jasmine/Karma)

---

## Phase 13d: @svelte-specialist Agent

**Status**: ✅ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @svelte-specialist |
| **Phase** | 13 |
| **Classification** | Frontend Implementation (Svelte) |
| **Trigger** | @code-architect selects Svelte as frontend framework |
| **Activation Condition** | `frontend_framework == "Svelte"` OR `frontend_framework == "SvelteKit"` |
| **Prerequisites** | Frontend architecture from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | Svelte components, SvelteKit routes |
| **Hands Off To** | Backend specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND (frontend_framework == "Svelte" OR frontend_framework == "SvelteKit")
THEN activate @svelte-specialist (Phase 13)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Frontend framework: Svelte or SvelteKit
- Building reactive, performant UIs
- Server-side rendering with SvelteKit

❌ **SKIPS when:**
- Frontend framework: React, Vue, Angular
- Backend-only project
- Framework already selected differently

### What @svelte-specialist Generates
- Svelte components with reactive variables
- SvelteKit page and layout routes
- Svelte stores for state management
- Actions for custom directives
- Transitions and animations
- TypeScript configuration
- Unit and E2E tests (Vitest, Playwright)

---

## Phase 14: @dotnet-specialist Agent

**Status**: ⚠️ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @dotnet-specialist |
| **Phase** | 14 |
| **Classification** | Backend Implementation (.NET) |
| **Trigger** | @code-architect selects .NET as backend |
| **Activation Condition** | `backend_framework == ".NET Core"` OR `backend_language == "C#"` |
| **Prerequisites** | Backend architecture from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | ASP.NET controllers, services, Entity Framework models |
| **Hands Off To** | @database-specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND (backend_framework == ".NET Core" OR backend_language == "C#")
THEN activate @dotnet-specialist (Phase 14)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Backend framework: ASP.NET Core
- Programming language: C#
- Enterprise .NET projects

❌ **SKIPS when:**
- Backend: Node.js, Python, Go, Java
- No backend needed
- Different language chosen

### What @dotnet-specialist Generates
- ASP.NET Core controllers
- Business logic services
- Entity Framework Core models and DbContext
- Dependency injection configuration
- Middleware components
- Unit tests (xUnit, NUnit)

---

## Phase 14b: @nodejs-specialist Agent

**Status**: ✅ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @nodejs-specialist |
| **Phase** | 14 |
| **Classification** | Backend Implementation (Node.js) |
| **Trigger** | @code-architect selects Node.js as backend |
| **Activation Condition** | `backend_framework == "Node.js"` OR `backend_language == "JavaScript"` OR `backend_language == "TypeScript"` |
| **Prerequisites** | Backend architecture from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | Express/Fastify routes, middleware, services |
| **Hands Off To** | @database-specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND (backend_framework == "Node.js" 
     OR backend_language == "JavaScript"
     OR backend_language == "TypeScript")
THEN activate @nodejs-specialist (Phase 14)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Backend framework: Node.js (Express, Fastify, etc.)
- JavaScript or TypeScript backend
- Full-stack JavaScript projects

❌ **SKIPS when:**
- Backend: .NET, Python, Go, Java
- Backend-only not needed
- Different language chosen

### What @nodejs-specialist Generates
- Express/Fastify route handlers
- Middleware stack configuration
- Service layer and business logic
- Error handling and logging
- Input validation and security
- Async/await patterns
- Unit tests (Vitest, Jest)

---

## Phase 14c: @python-specialist Agent

**Status**: ✅ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @python-specialist |
| **Phase** | 14 |
| **Classification** | Backend Implementation (Python) |
| **Trigger** | @code-architect selects Python as backend |
| **Activation Condition** | `backend_framework == "FastAPI"` OR `backend_framework == "Django"` OR `backend_language == "Python"` |
| **Prerequisites** | Backend architecture from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | FastAPI routes, middleware, services |
| **Hands Off To** | @database-specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND (backend_framework == "FastAPI"
     OR backend_framework == "Django"
     OR backend_language == "Python")
THEN activate @python-specialist (Phase 14)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Backend framework: FastAPI, Django, or Flask
- Python-based REST API
- Data science API requirements

❌ **SKIPS when:**
- Backend: Node.js, .NET, Go, Java
- Different language chosen
- Backend-only not needed

### What @python-specialist Generates
- FastAPI route handlers with auto-documentation
- Pydantic models for validation
- Dependency injection and middleware
- Async database queries
- Security and authentication
- Error handling patterns
- Unit tests (Pytest)

---

## Phase 14d: @go-specialist Agent

**Status**: ✅ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @go-specialist |
| **Phase** | 14 |
| **Classification** | Backend Implementation (Go) |
| **Trigger** | @code-architect selects Go as backend |
| **Activation Condition** | `backend_framework == "Gin"` OR `backend_framework == "Echo"` OR `backend_language == "Go"` |
| **Prerequisites** | Backend architecture from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | Go handlers, middleware, services |
| **Hands Off To** | @database-specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND (backend_framework == "Gin"
     OR backend_framework == "Echo"
     OR backend_language == "Go")
THEN activate @go-specialist (Phase 14)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Backend framework: Gin, Echo, or Fiber
- Go-based microservices
- High-performance requirements

❌ **SKIPS when:**
- Backend: Node.js, .NET, Python, Java
- Different language chosen
- Backend-only not needed

### What @go-specialist Generates
- HTTP handlers and routing
- Middleware chains
- Goroutine-based concurrency
- Channel-based communication
- Error handling patterns
- Graceful shutdown logic
- Unit tests (Go testing)

---

## Phase 14e: @java-specialist Agent

**Status**: ✅ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @java-specialist |
| **Phase** | 14 |
| **Classification** | Backend Implementation (Java) |
| **Trigger** | @code-architect selects Java as backend |
| **Activation Condition** | `backend_framework == "Spring Boot"` OR `backend_language == "Java"` |
| **Prerequisites** | Backend architecture from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | Spring Boot controllers, services, repositories |
| **Hands Off To** | @database-specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND (backend_framework == "Spring Boot"
     OR backend_language == "Java")
THEN activate @java-specialist (Phase 14)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Backend framework: Spring Boot
- Enterprise Java applications
- Complex business logic requirements

❌ **SKIPS when:**
- Backend: Node.js, .NET, Python, Go
- Different language chosen
- Backend-only not needed

### What @java-specialist Generates
- Spring Boot REST controllers
- Service and business logic layers
- JPA/Hibernate entity models
- Repository interfaces
- Aspect-oriented programming (AOP)
- Dependency injection configuration
- Unit tests (JUnit, Mockito)

---

## Phase 15: @mysql-specialist Agent

**Status**: ✅ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @mysql-specialist |
| **Phase** | 15 |
| **Classification** | Database Implementation (MySQL) |
| **Trigger** | @code-architect defines MySQL as database system |
| **Activation Condition** | `database_system == "MySQL"` OR `requires_database == true AND database_choice == "MySQL"` |
| **Prerequisites** | Data models from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | MySQL schema, migrations, optimization |
| **Hands Off To** | @devops-specialist OR @azure-devops-specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND (database_system == "MySQL" OR database_choice == "MySQL")
THEN activate @mysql-specialist (Phase 15)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Database system: MySQL (5.7, 8.0)
- Relational data model
- CRUD operations on structured data

❌ **SKIPS when:**
- Database: PostgreSQL, MongoDB, etc.
- No database needed
- Using managed database without schema gen

### What @mysql-specialist Generates
- MySQL DDL scripts (CREATE TABLE, indexes)
- Normalization and relationships
- Performance optimization (indexing strategy)
- Database migrations
- Backup and recovery procedures
- Query optimization examples

---

## Phase 15b: @docker-specialist Agent

**Status**: ✅ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @docker-specialist |
| **Phase** | 15 |
| **Classification** | Containerization & Optimization |
| **Trigger** | @code-architect or implementation agents complete |
| **Activation Condition** | `requires_containerization == true` OR `deploy_strategy == "containerized"` |
| **Prerequisites** | Application code from implementation agents |
| **Input Source** | @react-specialist, @nodejs-specialist, @python-specialist, etc. |
| **Output** | Dockerfile, docker-compose.yml, optimization configs |
| **Hands Off To** | @devops-specialist OR @azure-devops-specialist |

### Activation Logic
```
IF implementation_phase.status == "success"
AND (requires_containerization == true OR deploy_strategy == "containerized")
THEN activate @docker-specialist (Phase 15)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Deployment strategy: Containerized
- Platform: Kubernetes, AKS, Docker Swarm
- Multi-environment deployment (dev/staging/prod)
- Microservices architecture

❌ **SKIPS when:**
- Deployment strategy: Serverless (Azure Functions, AWS Lambda)
- Platform: Traditional VM/server deployment
- Static site hosting (no backend)

### What @docker-specialist Generates
- Multi-stage Dockerfiles (optimized for each service)
- docker-compose.yml for local development
- .dockerignore files
- Image optimization strategies (layer caching, Alpine base images)
- Health checks and readiness probes
- Container security best practices

---

## Phase 15c: @database-specialist Agent

**Status**: ⚠️ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @database-specialist |
| **Phase** | 15 |
| **Classification** | Database Implementation (General) |
| **Trigger** | @code-architect defines data models |
| **Activation Condition** | `requires_database == true AND database_system != "MySQL"` |
| **Prerequisites** | Data models from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | SQL schema, migrations, indexes |
| **Hands Off To** | @devops-specialist OR @azure-devops-specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND data_models.length > 0
AND database_system != "MySQL"
THEN activate @database-specialist (Phase 15)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Database: PostgreSQL, SQL Server, other SQL
- Project has data persistence requirements
- ORM configuration needed

❌ **SKIPS when:**
- Database: MySQL (use @mysql-specialist)
- Serverless/stateless architecture
- No database needed

---

## Phase 15: @database-specialist Agent

**Status**: ⚠️ **CONDITIONALLY ACTIVATED**

| Property | Value |
|----------|-------|
| **Agent ID** | @database-specialist |
| **Phase** | 15 |
| **Classification** | Database Implementation |
| **Trigger** | @code-architect defines data models |
| **Activation Condition** | `requires_database == true` |
| **Prerequisites** | Data models from @code-architect |
| **Input Source** | @code-architect output |
| **Output** | SQL schema, migrations, indexes |
| **Hands Off To** | @devops-specialist OR @azure-devops-specialist |

### Activation Logic
```
IF @code-architect.status == "success"
AND data_models.length > 0
THEN activate @database-specialist (Phase 15)
```

### Activation Scenarios

✅ **ACTIVATES when:**
- Project has data persistence requirements
- Database schema needs generation
- ORM (Entity Framework, Prisma, TypeORM) configuration

❌ **SKIPS when:**
- Serverless/stateless architecture
- No database needed
- Using managed databases without schema generation

### What @database-specialist Generates
- SQL DDL scripts (CREATE TABLE, indexes, constraints)
- Database migrations (flyway, Entity Framework)
- ORM configurations
- Seed data scripts (optional)
- Database documentation

---

## Activation Decision Tree

```
Start: @plan (Phase 1)
  ↓
  Execute: @doc (Phase 2)
  ↓
  Execute: @backlog (Phase 3)
  ↓
  Execute: @coordinator (Phase 4)
  ↓
  Execute: @qa (Phase 5)
  ↓
  Execute: @reporter (Phase 6)
  ↓
  Execute: @architect (Phase 7)
  │
  Execute: @code-architect (Phase 8)
  ├─ DECISION: platform == "Azure"?
  │  ├─ YES → Execute: @azure-architect (Phase 9) → @bicep-specialist
  │  └─ NO  → Skip infrastructure phase
  │
  ├─ DECISION: ci_cd_platform?
  │  ├─ "GitHub Actions" → Execute: @devops-specialist (Phase 12)
  │  ├─ "Azure DevOps"   → Execute: @azure-devops-specialist (Phase 16)
  │  └─ null (default)   → Execute: @devops-specialist (Phase 12)
  │
  ├─ DECISION: frontend_framework?
  │  ├─ "React"   → Execute: @react-specialist (Phase 13)
  │  ├─ "Vue.js"  → Execute: @vue-specialist (Phase 13)
  │  ├─ "Angular" → Execute: @angular-specialist (Phase 13)
  │  ├─ "Svelte"  → Execute: @svelte-specialist (Phase 13)
  │  └─ null      → Skip frontend phase
  │
  ├─ DECISION: backend_framework?
  │  ├─ ".NET Core" → Execute: @dotnet-specialist (Phase 14)
  │  ├─ "Node.js"   → Execute: @nodejs-specialist (Phase 14)
  │  ├─ "Python"    → Execute: @python-specialist (Phase 14)
  │  ├─ "Go"        → Execute: @go-specialist (Phase 14)
  │  ├─ "Java"      → Execute: @java-specialist (Phase 14)
  │  └─ null        → Skip backend phase
  │
  └─ DECISION: requires_database?
     ├─ YES → Execute: @database-specialist (Phase 15)
     └─ NO  → Skip database phase
```

---

## Prerequisites Summary Table

| Agent | Prerequisites | Trigger |
|-------|---------------|---------|
| @plan | None | User input |
| @doc | ProjectPlan | @plan success |
| @backlog | Tech spec | @doc success |
| @coordinator | Backlog | @backlog success |
| @qa | Execution plan | @coordinator success |
| @reporter | QA plan | @qa success |
| @architect | All above | @reporter success |
| @code-architect | Architecture decisions | @architect success |
| @azure-architect | `platform == "Azure"` | @architect success |
| @bicep-specialist | Azure resource plan | @azure-architect success |
| @devops-specialist | Code structure | @code-architect success (GitHub default) |
| @azure-devops-specialist | Code structure | @code-architect success (if Azure DevOps) |
| @react-specialist | `frontend_framework == "React"` | @code-architect success |
| @vue-specialist | `frontend_framework == "Vue.js"` | @code-architect success |
| @angular-specialist | `frontend_framework == "Angular"` | @code-architect success |
| @svelte-specialist | `frontend_framework == "Svelte"` | @code-architect success |
| @dotnet-specialist | `backend_framework == ".NET"` | @code-architect success |
| @nodejs-specialist | `backend_framework == "Node.js"` | @code-architect success |
| @python-specialist | `backend_framework == "Python"` | @code-architect success |
| @go-specialist | `backend_framework == "Go"` | @code-architect success |
| @java-specialist | `backend_framework == "Java"` | @code-architect success |
| @mysql-specialist | `database_system == "MySQL"` | @code-architect success |
| @docker-specialist | `requires_containerization == true` | Implementation agents success |
| @database-specialist | Data models (non-MySQL) | @code-architect success |

**Total Agents**: 26 (9 orchestration + 4 architecture + 13 implementation)

---

## Real-World Activation Sequences

### S01: Solo MVP (React + .NET + PostgreSQL + Azure)

```
Phase 1-8: ALWAYS
  @plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect

Phase 9+: CONDITIONAL
  @azure-architect (Azure selected)
    ↓
  @bicep-specialist (infrastructure-as-code)
    ↓
  @react-specialist (frontend = React)
    ↓
  @dotnet-specialist (backend = .NET Core)
    ↓
  @database-specialist (has data models)
    ↓
  @devops-specialist OR @azure-devops-specialist (CI/CD)
```

### S03: Medium SaaS (React + Node.js + PostgreSQL + AKS + GitHub)

```
Phase 1-8: ALWAYS
  @plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect

Phase 9+: CONDITIONAL
  @azure-architect (Azure selected)
    ↓
  @bicep-specialist (infrastructure-as-code for AKS)
    ↓
  @react-specialist (frontend = React)
    ↓
  [No @dotnet-specialist - backend is Node.js]
    ↓
  @database-specialist (PostgreSQL)
    ↓
  @devops-specialist (GitHub Actions default)
```

### S05: Healthcare (React + Node.js + PostgreSQL + Azure + Azure DevOps + HIPAA)

```
Phase 1-8: ALWAYS
  @plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect

Phase 9+: CONDITIONAL
  @azure-architect (Azure selected, enterprise features required)
    ↓
  @bicep-specialist (infrastructure-as-code with HIPAA compliance)
    ↓
  @react-specialist (frontend = React)
    ↓
  @nodejs-specialist (backend = Node.js with security focus)
    ↓
  @database-specialist (PostgreSQL with HIPAA encryption)
    ↓
  @azure-devops-specialist (explicitly chosen for enterprise gates and audit)
```

### S06: Vue + Python SPA (Vue 3 + FastAPI + MySQL + Docker + GitHub)

```
Phase 1-8: ALWAYS
  @plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect

Phase 9+: CONDITIONAL
  [No @azure-architect - platform not Azure]
    ↓
  @vue-specialist (frontend = Vue.js with SvelteKit patterns)
    ↓
  @python-specialist (backend = Python FastAPI)
    ↓
  @mysql-specialist (database = MySQL with optimization)
    ↓
  @docker-specialist (containerization for deployment)
    ↓
  @devops-specialist (CI/CD via GitHub Actions)
```

### S07: Angular + Go Enterprise (Angular + Go + PostgreSQL)

```
Phase 1-8: ALWAYS
  @plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect

Phase 9+: CONDITIONAL
  [No infrastructure phase - on-premises deployment]
    ↓
  @angular-specialist (frontend = Angular with NgRx)
    ↓
  @go-specialist (backend = Go with goroutines and microservices)
    ↓
  @database-specialist (PostgreSQL optimization)
    ↓
  @devops-specialist (GitHub Actions for deployment)
```

### S08: Svelte + Java Fullstack (Svelte + Spring Boot + MySQL)

```
Phase 1-8: ALWAYS
  @plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect

Phase 9+: CONDITIONAL
  [No cloud infrastructure - on-premises]
    ↓
  @svelte-specialist (frontend = Svelte with reactive patterns)
    ↓
  @java-specialist (backend = Spring Boot enterprise)
    ↓
  @mysql-specialist (database = MySQL with Spring Data JPA)
    ↓
  @devops-specialist (GitHub Actions)
```

---

## Configuration Example

### S01 Simple MVP Config
```json
{
  "project": "Todo App MVP",
  "platform": "Azure",
  "frontend_framework": "React",
  "backend_framework": ".NET Core",
  "database_system": "PostgreSQL",
  "ci_cd_platform": "GitHub Actions",
  "requires_database": true,
  "iac_required": true
}
```

**Results in activation**:
- ✅ @azure-architect (platform = Azure)
- ✅ @bicep-specialist (iac_required = true)
- ✅ @react-specialist (frontend = React)
- ✅ @dotnet-specialist (backend = .NET Core)
- ✅ @database-specialist (requires_database = true)
- ✅ @devops-specialist (ci_cd_platform = GitHub Actions)

### S06 Vue + Python Config
```json
{
  "project": "Analytics Dashboard",
  "platform": "AWS",
  "frontend_framework": "Vue.js",
  "backend_framework": "FastAPI",
  "database_system": "MySQL",
  "ci_cd_platform": "GitHub Actions",
  "requires_database": true,
  "requires_containerization": true,
  "iac_required": false
}
```

**Results in activation**:
- ✅ @vue-specialist (frontend = Vue.js)
- ✅ @python-specialist (backend = Python)
- ✅ @mysql-specialist (database_system = MySQL)
- ✅ @docker-specialist (requires_containerization = true)
- ✅ @devops-specialist (ci_cd_platform = GitHub Actions)

### S08 Svelte + Java Config
```json
{
  "project": "Enterprise Portal",
  "platform": "on-premises",
  "frontend_framework": "Svelte",
  "backend_framework": "Spring Boot",
  "database_system": "MySQL",
  "ci_cd_platform": "GitHub Actions",
  "requires_database": true,
  "iac_required": false
}
```

**Results in activation**:
- ✅ @svelte-specialist (frontend = Svelte)
- ✅ @java-specialist (backend = Spring Boot)
- ✅ @mysql-specialist (database_system = MySQL)
- ✅ @devops-specialist (ci_cd_platform = GitHub Actions)

---

## Key Takeaways

1. **Phases 1-8 Always Run** - Orchestration is mandatory for every project (9 agents)
2. **Phases 9-15 Are Conditional** - Based on architecture and technology decisions (17 agents)
3. **26 Total Agents** - 9 orchestration + 4 architecture + 13 implementation
4. **Option C Integration** - Configuration-driven behavior, agent communication, versioning, feedback loops
5. **Flexible Technology Stack** - Supports React/Vue/Angular/Svelte, Node.js/Python/Go/Java/.NET, MySQL/PostgreSQL, Azure/AWS/On-Prem
6. **Parallel Execution** - Frontend and backend agents can run simultaneously for faster delivery

**See Complete Mapping**: [Agent-Skill Mapping](AGENT_SKILL_MAPPING.md) for detailed handoff patterns and communication flows
3. **Decision Points Matter** - @architect output determines everything downstream
4. **No Agent Overlap** - Each agent has clear, non-overlapping responsibilities
5. **Clear Prerequisites** - Every agent knows exactly what it needs before activation

---

**Next Steps**: Use this guide when:
- Building the orchestrator logic
- Deciding which agents to run for a project
- Debugging why an agent didn't activate
- Adding new agents in the future

