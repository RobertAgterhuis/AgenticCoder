# Complete Agent-Skill Mapping & Handoffs

**Date**: January 13, 2026  
**Version**: 2.0

---

## Overview

This document provides the complete mapping of all **26 agents** and **33 skills**, including handoff patterns, activation logic, and dependencies.

---

## Agent Tier Classification

### Tier 1: Orchestration (Always Active)

These 9 agents run for every project in sequential order.

### Tier 2: Architecture (Conditionally Active)

These 4 agents activate based on platform/infrastructure choices.

### Tier 3: Implementation (Conditionally Active)

These 13 agents activate based on technology stack selections.

---

## Complete Agent Inventory with Skills

### 🎯 TIER 1: ORCHESTRATION AGENTS (9 agents)

#### 1. @plan (Phase 1)

- **Purpose**: Project planning and requirements discovery
- **Skills Used**:
  - `adaptive-discovery` - Dynamic requirements gathering
  - `requirements-analysis` - Requirement decomposition
  - `phase-planning` - Project phase breakdown
  - `timeline-estimation` - Time and resource estimates
- **Activation**: Always (entry point)
- **Input**: User request
- **Output**: ProjectPlan artifact
- **Hands Off To**: @doc

---

#### 2. @doc (Phase 2)

- **Purpose**: Technical documentation creation
- **Skills Used**:
  - `technical-writing` - Documentation standards
  - `architecture-design` - High-level architecture docs
- **Activation**: Always (after @plan)
- **Input**: ProjectPlan from @plan
- **Output**: TechnicalSpecification artifact
- **Hands Off To**: @backlog

---

#### 3. @backlog (Phase 3)

- **Purpose**: User story and backlog creation
- **Skills Used**:
  - `backlog-planning` - Story creation and prioritization
  - `requirements-analysis` - User story decomposition
- **Activation**: Always (after @doc)
- **Input**: TechnicalSpecification from @doc
- **Output**: Backlog artifact (user stories)
- **Hands Off To**: @architect

---

#### 4. @architect (Phase 4)

- **Purpose**: System architecture design
- **Skills Used**:
  - `architecture-design` - System design patterns
  - `error-handling` - Error management strategies
- **Activation**: Always (after @backlog)
- **Input**: Backlog from @backlog
- **Output**: SystemArchitecture artifact
- **Hands Off To**: @code-architect OR @azure-architect (if Azure)

---

#### 5. @code-architect (Phase 5)

- **Purpose**: Code structure and organization planning
- **Skills Used**:
  - `architecture-design` - Code organization patterns
  - `error-handling` - Exception handling patterns
- **Activation**: Always (after @architect, unless Azure path)
- **Input**: SystemArchitecture from @architect
- **Output**: CodeArchitecture artifact
- **Hands Off To**: Technology-specific agents (@frontend-specialist, @backend-specialist, etc.)

---

#### 6. @coordinator (Phase Running)

- **Purpose**: Multi-agent coordination and orchestration
- **Skills Used**: None (pure orchestration)
- **Activation**: Throughout project lifecycle
- **Input**: Agent status updates
- **Output**: Coordination decisions
- **Hands Off To**: Any agent as needed

---

#### 7. @qa (Phase 14)

- **Purpose**: Quality assurance and testing
- **Skills Used**: All relevant skills for validation
- **Activation**: After implementation phase
- **Input**: Implementation artifacts
- **Output**: TestResults artifact
- **Hands Off To**: @devops-specialist

---

#### 8. @devops-specialist (Phase 15)

- **Purpose**: CI/CD and deployment
- **Skills Used**:
  - `infrastructure-automation` - IaC patterns
  - `azure-pipelines` (if Azure) - Azure DevOps
- **Activation**: After @qa
- **Input**: TestResults from @qa
- **Output**: DeploymentPlan artifact
- **Hands Off To**: @reporter

---

#### 9. @reporter (Phase 16)

- **Purpose**: Progress reporting and completion summary
- **Skills Used**:
  - `technical-writing` - Report generation
- **Activation**: Final phase
- **Input**: All project artifacts
- **Output**: ProjectReport artifact
- **Hands Off To**: None (end of flow)

---

### 🏗️ TIER 2: ARCHITECTURE AGENTS (4 agents)

#### 10. @azure-architect (Phase 9 - Conditional)

- **Purpose**: Azure cloud architecture design
- **Skills Used**:
  - `architecture-design` - Cloud architecture patterns
- **Activation**: IF project.platform == "Azure"
- **Input**: SystemArchitecture from @architect
- **Output**: AzureArchitecture artifact
- **Hands Off To**: @azure-devops-specialist OR @bicep-specialist

---

#### 11. @azure-devops-specialist (Phase 10 - Conditional)

- **Purpose**: Azure DevOps CI/CD pipelines
- **Skills Used**:
  - `azure-pipelines` - Pipeline configuration
- **Activation**: IF project.platform == "Azure" AND project.requires_cicd == true
- **Input**: AzureArchitecture from @azure-architect
- **Output**: AzurePipeline artifact
- **Hands Off To**: @bicep-specialist OR implementation agents

---

#### 12. @bicep-specialist (Phase 11 - Conditional)

- **Purpose**: Azure Infrastructure as Code
- **Skills Used**:
  - `infrastructure-automation` - IaC patterns
- **Activation**: IF project.platform == "Azure" AND project.requires_iac == true
- **Input**: AzureArchitecture from @azure-architect
- **Output**: BicepTemplates artifact
- **Hands Off To**: Implementation agents

---

#### 13. @database-specialist (Phase 12 - Conditional)

- **Purpose**: Generic database design
- **Skills Used**:
  - `sql-schema-design` - Schema design patterns
- **Activation**: IF project.requires_database == true AND database != "MySQL"
- **Input**: SystemArchitecture from @architect
- **Output**: DatabaseSchema artifact
- **Hands Off To**: Backend implementation agents

---

### 💻 TIER 3: IMPLEMENTATION AGENTS (13 agents)

#### Frontend Agents (5 agents)

##### 14. @frontend-specialist (Phase 13 - Conditional)

- **Purpose**: Generic frontend development
- **Skills Used**: None (delegates to specialists)
- **Activation**: IF project.has_frontend == true AND !specific_framework
- **Input**: CodeArchitecture from @code-architect
- **Output**: FrontendCode artifact
- **Hands Off To**: @qa

---

##### 15. @react-specialist (Phase 13 - Conditional)

- **Purpose**: React application development
- **Skills Used**:
  - `react-patterns` - React best practices and component patterns
  - `state-management` - Redux/Context patterns
- **Activation**: IF project.frontend_framework == "React"
- **Input**: CodeArchitecture from @code-architect
- **Output**: ReactApplication artifact
- **Hands Off To**: @qa

---

##### 16. @vue-specialist (Phase 13 - Conditional)

- **Purpose**: Vue.js application development
- **Skills Used**:
  - `vue-best-practices` - Vue.js standards
  - `vue-component-patterns` - Component design
  - `state-management` - Pinia/Vuex patterns
- **Activation**: IF project.frontend_framework == "Vue" OR "Vue.js"
- **Input**: CodeArchitecture from @code-architect
- **Output**: VueApplication artifact
- **Hands Off To**: @qa

---

##### 17. @angular-specialist (Phase 13 - Conditional)

- **Purpose**: Angular application development
- **Skills Used**:
  - `angular-best-practices` - Angular standards
  - `angular-component-patterns` - Component design
  - `state-management` - NgRx patterns
- **Activation**: IF project.frontend_framework == "Angular"
- **Input**: CodeArchitecture from @code-architect
- **Output**: AngularApplication artifact
- **Hands Off To**: @qa

---

##### 18. @svelte-specialist (Phase 13 - Conditional)

- **Purpose**: Svelte application development
- **Skills Used**:
  - `svelte-best-practices` - Svelte standards
  - `svelte-patterns` - Component design
  - `state-management` - Svelte stores
- **Activation**: IF project.frontend_framework == "Svelte"
- **Input**: CodeArchitecture from @code-architect
- **Output**: SvelteApplication artifact
- **Hands Off To**: @qa

---

#### Backend Agents (6 agents)

##### 19. @backend-specialist (Phase 13 - Conditional)

- **Purpose**: Generic backend development
- **Skills Used**:
  - `error-handling` - Error management patterns
- **Activation**: IF project.has_backend == true AND !specific_framework
- **Input**: CodeArchitecture from @code-architect
- **Output**: BackendCode artifact
- **Hands Off To**: @qa

---

##### 20. @nodejs-specialist (Phase 13 - Conditional)

- **Purpose**: Node.js API development
- **Skills Used**:
  - `nodejs-api-patterns` - Express/Fastify patterns
  - `nodejs-best-practices` - Node.js standards
  - `error-handling` - Error middleware patterns
- **Activation**: IF project.backend_framework == "Node.js" OR "Express" OR "Fastify"
- **Input**: CodeArchitecture from @code-architect
- **Output**: NodeJSApplication artifact
- **Hands Off To**: @qa

---

##### 21. @python-specialist (Phase 13 - Conditional)

- **Purpose**: Python API development
- **Skills Used**:
  - `python-api-patterns` - FastAPI/Flask/Django patterns
  - `python-best-practices` - Python standards (PEP 8, type hints)
  - `error-handling` - Exception handling patterns
- **Activation**: IF project.backend_framework == "Python" OR "FastAPI" OR "Flask" OR "Django"
- **Input**: CodeArchitecture from @code-architect
- **Output**: PythonApplication artifact
- **Hands Off To**: @qa

---

##### 22. @go-specialist (Phase 13 - Conditional)

- **Purpose**: Go API development
- **Skills Used**:
  - `go-api-patterns` - Gin/Echo/Chi patterns
  - `go-best-practices` - Go idioms and standards
  - `error-handling` - Error handling patterns
- **Activation**: IF project.backend_framework == "Go" OR "Golang"
- **Input**: CodeArchitecture from @code-architect
- **Output**: GoApplication artifact
- **Hands Off To**: @qa

---

##### 23. @java-specialist (Phase 13 - Conditional)

- **Purpose**: Java API development
- **Skills Used**:
  - `java-api-patterns` - Spring Boot patterns
  - `java-best-practices` - Java standards
  - `error-handling` - Exception handling patterns
- **Activation**: IF project.backend_framework == "Java" OR "Spring Boot"
- **Input**: CodeArchitecture from @code-architect
- **Output**: JavaApplication artifact
- **Hands Off To**: @qa

---

##### 24. @dotnet-specialist (Phase 13 - Conditional)

- **Purpose**: .NET application development
- **Skills Used**:
  - `dotnet-webapi` - ASP.NET Core patterns
  - `entity-framework` - EF Core ORM patterns
  - `error-handling` - Exception middleware
- **Activation**: IF project.backend_framework == ".NET" OR "C#" OR "ASP.NET"
- **Input**: CodeArchitecture from @code-architect
- **Output**: DotNetApplication artifact
- **Hands Off To**: @qa

---

#### Database & Infrastructure Agents (2 agents)

##### 25. @mysql-specialist (Phase 12 - Conditional)

- **Purpose**: MySQL database design and optimization
- **Skills Used**:
  - `mysql-schema-patterns` - Schema design for MySQL
  - `mysql-optimization` - Query optimization, indexing
  - `sql-schema-design` - General SQL patterns
- **Activation**: IF project.database == "MySQL"
- **Input**: SystemArchitecture from @architect
- **Output**: MySQLSchema artifact
- **Hands Off To**: Backend implementation agents

---

##### 26. @docker-specialist (Phase 13 - Conditional)

- **Purpose**: Docker containerization and optimization
- **Skills Used**:
  - `docker-container-patterns` - Dockerfile patterns
  - `docker-optimization` - Image size and build optimization
- **Activation**: IF project.requires_containerization == true
- **Input**: Implementation artifacts
- **Output**: DockerConfiguration artifact (Dockerfile, docker-compose)
- **Hands Off To**: @qa

---

## Handoff Flow Patterns

### Standard Flow (No Azure, No Specific Framework)

```
@plan → @doc → @backlog → @architect → @code-architect
  → @frontend-specialist + @backend-specialist
  → @qa → @devops-specialist → @reporter
```

### Azure Flow

```
@plan → @doc → @backlog → @architect
  → @azure-architect
    → @azure-devops-specialist
    → @bicep-specialist
  → @code-architect
  → Implementation agents
  → @qa → @devops-specialist → @reporter
```

### React + Node.js + MySQL Flow

```
@plan → @doc → @backlog → @architect → @code-architect
  → @react-specialist (frontend)
  → @nodejs-specialist (backend)
  → @mysql-specialist (database)
  → @docker-specialist (containerization)
  → @qa → @devops-specialist → @reporter
```

### Vue + Python + Docker Flow

```
@plan → @doc → @backlog → @architect → @code-architect
  → @vue-specialist (frontend)
  → @python-specialist (backend)
  → @docker-specialist (containerization)
  → @qa → @devops-specialist → @reporter
```

### Angular + Java + Azure Flow

```
@plan → @doc → @backlog → @architect
  → @azure-architect
    → @azure-devops-specialist
    → @bicep-specialist
  → @code-architect
  → @angular-specialist (frontend)
  → @java-specialist (backend)
  → @docker-specialist (containerization)
  → @qa → @devops-specialist → @reporter
```

---

## Activation Decision Tree

```
START → @plan (always)
  ↓
@doc (always)
  ↓
@backlog (always)
  ↓
@architect (always)
  ↓
  ├─ [Azure?] → YES → @azure-architect
  │                     ↓
  │                   [CI/CD?] → YES → @azure-devops-specialist
  │                     ↓
  │                   [IaC?] → YES → @bicep-specialist
  │                     ↓
  │                   @code-architect
  │
  └─ [Azure?] → NO → @code-architect
                       ↓
                     [Database?]
                       ├─ MySQL → @mysql-specialist
                       └─ Other → @database-specialist
                       ↓
                     [Frontend Framework?]
                       ├─ React → @react-specialist
                       ├─ Vue → @vue-specialist
                       ├─ Angular → @angular-specialist
                       ├─ Svelte → @svelte-specialist
                       └─ Generic → @frontend-specialist
                       ↓
                     [Backend Framework?]
                       ├─ Node.js → @nodejs-specialist
                       ├─ Python → @python-specialist
                       ├─ Go → @go-specialist
                       ├─ Java → @java-specialist
                       ├─ .NET → @dotnet-specialist
                       └─ Generic → @backend-specialist
                       ↓
                     [Containerization?] → YES → @docker-specialist
                       ↓
                     @qa (always)
                       ↓
                     @devops-specialist (always)
                       ↓
                     @reporter (always)
                       ↓
                     END
```

---

## Parallel Execution Patterns

Some agents can run in parallel:

### Parallel Pattern 1: Frontend + Backend

```
@code-architect
    ├─→ @react-specialist ─┐
    │                       ├→ @qa
    └─→ @nodejs-specialist ┘
```

### Parallel Pattern 2: Multiple Backends

```
@code-architect
    ├─→ @nodejs-specialist (Microservice 1) ─┐
    ├─→ @python-specialist (Microservice 2) ─┤
    └─→ @go-specialist (Microservice 3) ──────┴→ @qa
```

### Parallel Pattern 3: Azure Services

```
@azure-architect
    ├─→ @azure-devops-specialist ─┐
    └─→ @bicep-specialist ─────────┴→ @code-architect
```

---

## Agent-Skill Matrix

| Agent | Skills Used | Count |
|-------|-------------|-------|
| @plan | adaptive-discovery, requirements-analysis, phase-planning, timeline-estimation | 4 |
| @doc | technical-writing, architecture-design | 2 |
| @backlog | backlog-planning, requirements-analysis | 2 |
| @architect | architecture-design, error-handling | 2 |
| @code-architect | architecture-design, error-handling | 2 |
| @coordinator | (none - orchestration only) | 0 |
| @qa | (all relevant skills for validation) | * |
| @devops-specialist | infrastructure-automation, azure-pipelines | 2 |
| @reporter | technical-writing | 1 |
| @azure-architect | architecture-design | 1 |
| @azure-devops-specialist | azure-pipelines | 1 |
| @bicep-specialist | infrastructure-automation | 1 |
| @database-specialist | sql-schema-design | 1 |
| @frontend-specialist | (none - delegates) | 0 |
| @react-specialist | react-patterns, state-management | 2 |
| @vue-specialist | vue-best-practices, vue-component-patterns, state-management | 3 |
| @angular-specialist | angular-best-practices, angular-component-patterns, state-management | 3 |
| @svelte-specialist | svelte-best-practices, svelte-patterns, state-management | 3 |
| @backend-specialist | error-handling | 1 |
| @nodejs-specialist | nodejs-api-patterns, nodejs-best-practices, error-handling | 3 |
| @python-specialist | python-api-patterns, python-best-practices, error-handling | 3 |
| @go-specialist | go-api-patterns, go-best-practices, error-handling | 3 |
| @java-specialist | java-api-patterns, java-best-practices, error-handling | 3 |
| @dotnet-specialist | dotnet-webapi, entity-framework, error-handling | 3 |
| @mysql-specialist | mysql-schema-patterns, mysql-optimization, sql-schema-design | 3 |
| @docker-specialist | docker-container-patterns, docker-optimization | 2 |

**Total Skill Usages**: 50+  
**Skills with Multiple Users**: state-management (4), error-handling (8), architecture-design (4)

---

## Communication Patterns (Option C)

With Option C enabled, agents can communicate:

### Request Pattern

```
@react-specialist → REQUEST → @nodejs-specialist
  "Provide API contract for user authentication"
    ↓
@nodejs-specialist → RESPONSE → @react-specialist
  { endpoints, methods, parameters }
```

### Feedback Pattern

```
@nodejs-specialist → generates API
    ↓
@react-specialist → FEEDBACK → @nodejs-specialist
  "Consider adding error response codes"
    ↓
@nodejs-specialist → updates API
```

### Coordination Pattern

```
@coordinator → COORDINATION → [@react-specialist, @nodejs-specialist, @mysql-specialist]
  "Feature: User Authentication - coordinate implementation"
    ↓
Agents exchange messages and artifacts
    ↓
@coordinator → NOTIFICATION → all agents
  "Feature complete and integrated"
```

---

## Version Control (Option C)

All agents produce versioned artifacts:

```
Artifact: login-component
  v0.1 → @react-specialist (draft)
  v0.2 → @react-specialist (after @qa feedback)
  v1.0 → @react-specialist (approved, in-use)
  
Dependencies:
  - auth-api-contract v1.2 (@nodejs-specialist)
  - user-schema v1.0 (@mysql-specialist)
```

---

## Summary

- **26 Total Agents**
- **33 Total Skills**
- **50+ Skill Usages**
- **3 Tier Classification**
- **16 Phase Workflow**
- **Multiple Parallel Execution Patterns**
- **Option C Communication Enabled**
- **Option C Versioning Enabled**

---

**Document Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete and Current
