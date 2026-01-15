# AgenticCoder System Architecture

**Date**: January 13, 2026  
**Status**: Complete Architecture Reference - Phase 2 Complete  
**Version**: 2.0 (Post-Phase-2-Expansion + Option C)

---

## Executive Summary

AgenticCoder is a **multi-tier agent orchestration system** with **26 specialized agents** organized in **3 tiers**:

```
Input: User Project Requirements
        │
        ↓
┌────────────────────────────────────────────────────────┐
│     ORCHESTRATION TIER (9 agents, Phases 1-8)          │
│  Sequential, Mandatory, Planning-to-Architecture       │
│  Always Active: @plan, @doc, @backlog, @coordinator,  │
│                @qa, @reporter, @architect,             │
│                @code-architect, @devops-specialist     │
└────────────────────────────────────────────────────────┘
        │
        └─ Produces: Architecture Decision Matrix
        │
        ↓
┌────────────────────────────────────────────────────────┐
│  ARCHITECTURE TIER (4 agents, Phases 9-12)           │
│  Conditional, Platform-Dependent, IaC & DevOps        │
└────────────────────────────────────────────────────────┘
        │
        ├─ Conditional Paths:
        │  ├─ Azure? → @azure-architect + @bicep-specialist (Phase 9)
        │  ├─ Azure DevOps? → @azure-devops-specialist (Phase 10)
        │  └─ Database? → @database-specialist (Phase 12, non-MySQL)
        │
        ↓
┌────────────────────────────────────────────────────────┐
│  IMPLEMENTATION TIER (13 agents, Phases 13-15)        │
│  Conditional, Tech-Stack-Dependent, Code Generation   │
└────────────────────────────────────────────────────────┘
        │
        ├─ Frontend Options (Phase 13):
        │  ├─ React? → @react-specialist
        │  ├─ Vue.js? → @vue-specialist
        │  ├─ Angular? → @angular-specialist
        │  ├─ Svelte? → @svelte-specialist
        │  └─ Generic? → @frontend-specialist
        │
        ├─ Backend Options (Phase 13):
        │  ├─ .NET Core? → @dotnet-specialist
        │  ├─ Node.js? → @nodejs-specialist
        │  ├─ Python? → @python-specialist
        │  ├─ Go? → @go-specialist
        │  ├─ Java? → @java-specialist
        │  └─ Generic? → @backend-specialist
        │
        └─ Infrastructure (Phase 15):
           ├─ MySQL? → @mysql-specialist (database)
           └─ Docker? → @docker-specialist (containerization)
        │
        ↓
        ┌────────────────────────────────────────────────┐
        │  OPTION C ENHANCEMENTS (Cross-Cutting)         │
        │  - Configuration Management System             │
        │  - Artifact Versioning & Dependencies          │
        │  - Agent Communication Protocol                │
        │  - Feedback Loops & Quality Gates              │
        └────────────────────────────────────────────────┘
        │
        ↓
Output: Complete Codebase + CI/CD + Infrastructure + Config
```

**Option C Features** (NEW):
- **Configuration-Driven Behavior**: YAML-based hierarchical configs control agent behavior
- **Agent Communication**: 7 message types enable agent-to-agent coordination
- **Artifact Versioning**: Semantic versioning with rollback capability
- **Feedback Loops**: Multi-type quality gates with conditional logic

---

## System Components

### Core Components (Phase 1 + Phase 2 + Option C)

1. **26 Agents** - Specialized AI agents with explicit responsibilities
   - **Orchestration**: 9 agents (always active)
   - **Architecture**: 4 agents (conditional - Azure/infrastructure)
   - **Implementation**: 13 agents (conditional - technology stack)
   - Phase 1: 17 original agents
   - Phase 2: 9 new agents (frontend x3, backend x4, database x1, container x1)

2. **Agent Schemas** - Input/output specifications
   - 2 agent schemas in `.github/.agenticcoder/schemas/agents/`
   - Define agent interfaces, triggers, and handoffs

3. **33 Skills** - Specialized capabilities across 6 categories
   - **Planning**: 5 skills (adaptive-discovery, requirements-analysis, phase-planning, timeline-estimation, backlog-planning)
   - **Architecture**: 3 skills (architecture-design, error-handling, technical-writing)
   - **Frontend**: 9 skills (react-patterns, vue-best-practices, vue-component-patterns, angular-best-practices, angular-component-patterns, svelte-best-practices, svelte-patterns, state-management)
   - **Backend**: 12 skills (nodejs-api-patterns, nodejs-best-practices, python-api-patterns, python-best-practices, go-api-patterns, go-best-practices, java-api-patterns, java-best-practices, dotnet-webapi, entity-framework, sql-schema-design)
   - **Database**: 4 skills (mysql-schema-patterns, mysql-optimization, sql-schema-design)
   - **DevOps**: 4 skills (infrastructure-automation, azure-pipelines, docker-container-patterns, docker-optimization)

4. **Skill Schemas** - Skill input/output specifications
   - 4 skill schemas in `.github/.agenticcoder/schemas/skills/`
   - Define skill interfaces and data contracts

5. **Option C Systems** (NEW)
   - **Configuration Management**: `.github/.agenticcoder/config/`
     - `schema.json` - Configuration validation
     - `defaults.yaml` - Base configuration
     - `profiles/production.yaml` - Environment-specific configs
   - **Artifact Versioning**: `.github/.agenticcoder/artifacts/schema.json`
   - **Agent Communication**: `.github/.agenticcoder/communication/schema.json`
   - **Feedback Loops**: `.github/.agenticcoder/feedback/schema.json`

6. **8+ Reference Scenarios** - Real-world use cases
   - S01: Solo MVP (React + .NET + PostgreSQL + Azure)
   - S02: Startup (React + Node.js + MongoDB)
   - S03: Medium SaaS (React + Node.js + PostgreSQL + AKS)
   - S04: Enterprise (Angular + Java + Oracle + Azure)
   - S05: Healthcare (React + Node.js + PostgreSQL + HIPAA)
   - S06: Vue + Python SPA (NEW)
   - S07: Angular + Go Enterprise (NEW)
   - S08: Svelte + Java Fullstack (NEW)

### Communication Framework

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│  Agent (Phase N)     │
│  ┌────────────────┐  │
│  │ Input Schema   │  │ ← Validates input format
│  └────────────────┘  │
│  │                   │
│  │ [Process]         │
│  │                   │
│  ┌────────────────┐  │
│  │ Output Schema  │  │ ← Validates output format
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Agent Artifact       │
│ (JSON or Code)       │
└──────┬───────────────┘
       │
       ↓
  Next Agent or User
```

---

## Option C: Advanced Enhancements Architecture

### Overview

Option C provides four cross-cutting enhancements that overlay the base agent system:

```
┌─────────────────────────────────────────────────────────────┐
│                 OPTION C ENHANCEMENT LAYER                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Configuration   │      │  Artifact        │            │
│  │  Management      │◄────►│  Versioning      │            │
│  │  System          │      │  System          │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                         │                        │
│           └──────────┬──────────────┘                        │
│                     │                                       │
│  ┌──────────────────┴────────┐   ┌────────────────────┐   │
│  │  Agent Communication      │   │  Feedback Loop     │   │
│  │  Protocol                 │◄──┤  System            │   │
│  │  (7 message types)        │   │  (Quality Gates)   │   │
│  └───────────────────────────┘   └────────────────────┘   │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ↓
              ┌─────────────────────┐
              │  BASE AGENT SYSTEM   │
              │  (26 agents)         │
              └─────────────────────┘
```

### 1. Configuration Management System

**Location**: `.github/.agenticcoder/config/`

```
config/
├── schema.json          # JSON Schema validator
├── defaults.yaml        # Base configuration (all environments)
└── profiles/
    ├── development.yaml # Dev overrides
    ├── staging.yaml     # Staging overrides
    └── production.yaml  # Production overrides (strict)
```

**Architecture**:
```
User Request
    ↓
┌────────────────────────┐
│ Configuration Loader   │
│  - Load defaults.yaml  │
│  - Merge profile       │
│  - Validate schema     │
└──────────┬─────────────┘
           │ Validated Config
           ↓
┌─────────────────────────┐
│  Agent Runtime          │
│  - Apply constraints    │
│  - Enforce approval     │
│  - Trigger feedback     │
└─────────────────────────┘
```

**Key Features**:

- Hierarchical configuration (defaults → profile overrides)
- Environment-specific behavior (dev = permissive, prod = strict)
- Agent-level constraints (max tokens, parallel execution limits)
- Rules engine (security, compliance, best practices)
- Approval workflows (manual gates for sensitive operations)

### 2. Artifact Versioning System

**Location**: `.github/.agenticcoder/artifacts/schema.json`

```
Artifact Lifecycle:
  DRAFT → IN_REVIEW → APPROVED → IN_USE → DEPRECATED → ARCHIVED
```

**Architecture**:
```
Agent produces output
    ↓
┌──────────────────────┐
│ Artifact Manager     │
│  - Assign version    │
│  - Track dependencies│
│  - Store metadata    │
└────────┬─────────────┘
         │
         ↓
    Artifact Storage
    {
      id: "login-component",
      version: "1.2.0",
      status: "IN_USE",
      createdBy: "@react-specialist",
      dependencies: [
        { id: "auth-api", version: "^2.1.0" }
      ]
    }
```

**Key Features**:

- Semantic versioning (major.minor.patch)
- Status tracking (draft → approved → deprecated)
- Dependency management (artifact → artifact relationships)
- Rollback capability (revert to previous version)
- Change history (audit trail)

### 3. Agent Communication Protocol

**Location**: `.github/.agenticcoder/communication/schema.json`

**7 Message Types**:

```
1. REQUEST      - Ask another agent for information
2. RESPONSE     - Reply to a REQUEST
3. NOTIFICATION - Broadcast status update
4. FEEDBACK     - Provide improvement suggestions
5. COORDINATION - Orchestrate multi-agent task
6. HANDOFF      - Transfer control to next agent
7. ERROR        - Report failure or issue
```

**Architecture**:
```
@react-specialist                    @nodejs-specialist
       │                                    │
       │──────── REQUEST ──────────────────▶│
       │   "API contract for user auth"     │
       │                                    │
       │                                    │ (processes)
       │                                    │
       │◀───────── RESPONSE ────────────────│
       │   { endpoints, methods }           │
       │                                    │
       ├──────── FEEDBACK ────────────────▶│
       │   "Add error response codes"       │
       │                                    │
       │◀────── NOTIFICATION ───────────────│
           "API updated to v1.2"
```

**Key Features**:
- Asynchronous messaging (agents don't block)
- Priority levels (critical, high, medium, low)
- Timeout handling (automatic escalation)
- Message queuing (process in order)
- Broadcast support (one-to-many)

### 4. Feedback Loop System

**Location**: `.github/.agenticcoder/feedback/schema.json`

**4 Feedback Types**:
```
1. QUALITY_CHECK     - Validate output quality
2. APPROVAL_REQUEST  - Request human approval
3. VALIDATION        - Technical validation (tests, lint)
4. IMPROVEMENT       - Suggest enhancements
```

**Architecture**:
```
Agent completes work
    ↓
┌──────────────────────┐
│ Feedback Evaluator   │
│  - Check conditions  │
│  - Determine type    │
│  - Create question   │
└──────────┬───────────┘
           │
           ↓
    ┌──────────────┐
    │  APPROVAL?   │
    └──────┬───────┘
           │
    ┌──────┴──────┐
    YES          NO
     │            │
     ↓            ↓
  Proceed     Ask User/QA
              (wait for response)
                 │
                 ↓
              Retry agent
```

**Key Features**:
- Conditional logic (IF approval_required = true)
- Multiple question types (yes/no, text, select)
- Timeout handling (default action after N seconds)
- Async vs blocking modes
- Integration with agent communication

### Integration Points

All four systems integrate with the base agent system:

```
┌────────────────────────────────────────────────────────────┐
│                      AGENT EXECUTION                        │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Load Configuration ──→ Configuration Management         │
│     (constraints, rules, approval)                          │
│                                                              │
│  2. Check Dependencies ──→ Artifact Versioning             │
│     (input artifacts, versions)                             │
│                                                              │
│  3. Execute Agent Logic                                     │
│     - Generate code/docs/config                             │
│     - Communicate with other agents ──→ Communication       │
│                                                              │
│  4. Store Output ──→ Artifact Versioning                   │
│     (version, status, metadata)                             │
│                                                              │
│  5. Trigger Feedback ──→ Feedback Loop System              │
│     (quality check, approval)                               │
│                                                              │
│  6. Hand Off to Next Agent ──→ Communication Protocol      │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Benefits

**Configuration Management**:
- Environment parity (consistent behavior across dev/staging/prod)
- Policy enforcement (security, compliance automatically checked)
- Reduced errors (constraints prevent invalid operations)

**Artifact Versioning**:
- Reproducibility (exact artifact versions tracked)
- Rollback safety (revert to known-good state)
- Dependency clarity (understand artifact relationships)

**Agent Communication**:
- Parallel execution (agents coordinate without blocking)
- Error handling (failures propagate correctly)
- Traceability (message audit trail)

**Feedback Loops**:
- Quality assurance (automated checks before handoff)
- Human-in-the-loop (manual approval for critical operations)
- Continuous improvement (suggestions captured and applied)

**See Detailed Documentation**:
- [Option C System Overview](OPTION_C_SYSTEM_OVERVIEW.md)
- [Advanced Enhancements Implementation](ADVANCED_ENHANCEMENTS_IMPLEMENTATION.md)
- [Configuration System Quick Reference](CONFIG_SYSTEM_QUICKREF.md)
- [Artifact Versioning Quick Reference](ARTIFACT_VERSIONING_QUICKREF.md)
- [Agent Communication Quick Reference](AGENT_COMMUNICATION_QUICKREF.md)
- [Feedback Loops Quick Reference](FEEDBACK_LOOPS_QUICKREF.md)

---

## Tier 1: Orchestration Layer (Phases 1-8)

### Characteristics
- **Always Executed** - Every project requires all 8 phases
- **Sequential** - Each phase depends on the previous one
- **Blocking** - Later phases cannot start until earlier ones complete
- **Duration** - ~4.8 hours typical (287 minutes)

### Phase Breakdown

```
Phase 1: @plan (Project Planning)
├─ Input: User requirements (interview/discovery)
├─ Output: ProjectPlan artifact
├─ Duration: 30-60 minutes
└─ Next: @doc (mandatory)

Phase 2: @doc (Technical Documentation)
├─ Input: ProjectPlan
├─ Output: TechnicalSpecification artifact
├─ Duration: 30-45 minutes
└─ Next: @backlog (mandatory)

Phase 3: @backlog (Backlog Management)
├─ Input: TechnicalSpecification
├─ Output: ProductBacklog artifact
├─ Duration: 20-30 minutes
└─ Next: @coordinator (mandatory)

Phase 4: @coordinator (Task Coordination)
├─ Input: ProductBacklog
├─ Output: ExecutionPlan artifact
├─ Duration: 20-30 minutes
└─ Next: @qa (mandatory)

Phase 5: @qa (QA Strategy Planning)
├─ Input: ExecutionPlan
├─ Output: QAStrategy artifact
├─ Duration: 15-25 minutes
└─ Next: @reporter (mandatory)

Phase 6: @reporter (Monitoring & Reporting)
├─ Input: QAStrategy
├─ Output: MonitoringPlan artifact
├─ Duration: 15-20 minutes
└─ Next: @architect (mandatory)

Phase 7: @architect (Architecture Design)
├─ Input: All previous artifacts + Requirements
├─ Output: ArchitectureDecision artifact
│           ├─ platform: "Azure" | "AWS" | "GCP" | "On-Premises"
│           ├─ frontend_framework: "React" | "Vue" | "Angular"
│           ├─ backend_framework: ".NET Core" | "Node.js" | "Python" | "Go"
│           ├─ database_system: "PostgreSQL" | "SQL Server" | "MySQL"
│           ├─ ci_cd_platform: "GitHub Actions" | "Azure DevOps" | null (default)
│           └─ Additional architecture decisions...
├─ Duration: 45-90 minutes
└─ Next: @code-architect (mandatory)
    ↓
    DECISION POINT 1
    ├─ IF platform == "Azure" → Will trigger Phase 9a
    └─ IF not → Skip Phase 9

Phase 8: @code-architect (Code Structure Design)
├─ Input: ArchitectureDecision
├─ Output: CodeArchitecture artifact
│           ├─ folder_structure_template
│           ├─ frontend_architecture (if applicable)
│           │  ├─ component_patterns
│           │  ├─ state_management_approach
│           │  └─ api_integration_pattern
│           ├─ backend_architecture (if applicable)
│           │  ├─ service_layer_pattern
│           │  ├─ repository_pattern
│           │  ├─ api_design (REST/GraphQL)
│           │  └─ dependency_injection_config
│           └─ data_model (if database)
├─ Duration: 45-90 minutes
└─ Next: Phases 9-16 (parallel or sequential)
    ↓
    DECISION POINTS 2-6
    ├─ IF platform == "Azure" → Trigger @azure-architect (Phase 9a)
    ├─ IF ci_cd_platform == "GitHub Actions" → Trigger @devops-specialist (Phase 12)
    ├─ IF ci_cd_platform == "Azure DevOps" → Trigger @azure-devops-specialist (Phase 16)
    ├─ IF frontend_framework == "React" → Trigger @react-specialist (Phase 13)
    ├─ IF backend_framework == ".NET Core" → Trigger @dotnet-specialist (Phase 14)
    └─ IF has_data_models → Trigger @database-specialist (Phase 15)
```

### Orchestration Agent Details

| Agent | Responsibility | Key Inputs | Key Outputs | Skills Used |
|-------|---------------|-----------|------------|------------|
| @plan | Project discovery & scope | User requirements | ProjectPlan | adaptive-discovery, requirements-analysis |
| @doc | Technical specification | ProjectPlan | TechnicalSpec | technical-writing |
| @backlog | Backlog creation | TechnicalSpec | ProductBacklog | backlog-planning, timeline-estimation |
| @coordinator | Task assignment | ProductBacklog | ExecutionPlan | phase-planning |
| @qa | QA strategy | ExecutionPlan | QAStrategy | error-handling |
| @reporter | Monitoring setup | QAStrategy | MonitoringPlan | (process-level) |
| @architect | Architecture decisions | All above | ArchitectureDecision | architecture-design |
| @code-architect | Code structure design | ArchitectureDecision | CodeArchitecture | architecture-design, design patterns |

---

## Tier 2: Infrastructure Layer (Phases 9-12)

### Characteristics
- **Conditionally Activated** - Only if specific conditions met
- **Partially Sequential** - Phase 9a must complete before 9b, but can be parallel with 12
- **Decision-Based** - Activation depends on @architect choices

### Phase 9a: @azure-architect

**Activation Condition**:
```
IF @architect.output.platform == "Azure"
THEN activate @azure-architect
```

**Responsibility**: Azure cloud architecture design  
**Duration**: 30-45 minutes  
**Next**: @bicep-specialist (mandatory if 9a executed)

**Generates**:

- Azure resource recommendations
- Cost breakdown and optimization
- High-availability strategy
- Disaster recovery plan
- Region selection

---

### Phase 9b: @bicep-specialist

**Activation Condition**:
```
IF @azure-architect.status == "completed"
AND iac_required == true
THEN activate @bicep-specialist
```

**Responsibility**: Infrastructure-as-Code for Azure  
**Duration**: 45-60 minutes  
**Next**: Implementation phases (13-15) or DevOps (12/16)

**Generates**:
- Bicep template files (main.bicep, modules/)
- Parameter files
- Deployment documentation
- Resource naming conventions

---

### Phase 12: @devops-specialist (GitHub Actions)

**Activation Condition**:
```
IF @code-architect.status == "completed"
AND (ci_cd_platform == "GitHub Actions" 
     OR ci_cd_platform == null)  // default
THEN activate @devops-specialist
```

**Responsibility**: GitHub Actions CI/CD pipeline  
**Duration**: 30-45 minutes  
**Parallel With**: Phases 13-15 (no dependency)  
**Mutually Exclusive With**: Phase 16 (@azure-devops-specialist)

**Generates**:
- .github/workflows/build.yml
- .github/workflows/deploy.yml
- Security scanning workflows
- Performance testing workflows

---

### Phase 16: @azure-devops-specialist (Azure DevOps)

**Activation Condition**:
```
IF @code-architect.status == "completed"
AND ci_cd_platform == "Azure DevOps"
THEN activate @azure-devops-specialist
```

**Responsibility**: Azure Pipelines CI/CD configuration  
**Duration**: 30-45 minutes  
**Parallel With**: Phases 13-15 (no dependency)  
**Mutually Exclusive With**: Phase 12 (@devops-specialist)

**Generates**:
- azure-pipelines.yml
- Approval gates configuration
- Environment setup
- Deployment strategies (Blue-Green, Canary)

---

### Infrastructure Layer Decision Logic

```
After Phase 8 (@code-architect) completes:

┌─ Architecture Decision Analysis
│
├─ DECISION: platform == "Azure"?
│  ├─ YES → Execute Phase 9a (@azure-architect)
│  │         └─ YES → Execute Phase 9b (@bicep-specialist)
│  └─ NO  → Skip Phase 9a-9b
│
├─ DECISION: ci_cd_platform?
│  ├─ "GitHub Actions" → Execute Phase 12 (@devops-specialist)
│  ├─ "Azure DevOps"   → Execute Phase 16 (@azure-devops-specialist)
│  └─ null (default)   → Execute Phase 12 (@devops-specialist)
│
└─ Merge with Implementation Layer (Phases 13-15)
```

---

## Tier 3: Implementation Layer (Phases 13-15)

### Characteristics
- **Conditionally Activated** - Based on tech stack choices
- **Parallel Execution** - Can run simultaneously (no inter-dependencies)
- **Independent** - Each produces code for different layer
- **Duration Per Phase** - 60-120 minutes each (can run in parallel)

### Phase 13: @react-specialist

**Activation Condition**:
```
IF frontend_framework == "React"
THEN activate @react-specialist
```

**Responsibility**: React frontend implementation  
**Duration**: 60-120 minutes  
**Parallel With**: Phases 12, 14, 15, 16  
**Skills Used**: react-patterns, state-management

**Generates**:
```
src/
├── components/
│   ├── [UI Components]
│   ├── [Page Components]
│   └── [Layout Components]
├── hooks/
│   └── [Custom Hooks]
├── store/
│   └── [State Management - Zustand/Redux]
├── services/
│   └── [API Service Layer]
├── types/
│   └── [TypeScript Interfaces]
└── __tests__/
    └── [Unit Tests - Vitest]
```

---

### Phase 14: @dotnet-specialist

**Activation Condition**:
```
IF backend_framework == ".NET Core"
THEN activate @dotnet-specialist
```

**Responsibility**: ASP.NET Core backend implementation  
**Duration**: 60-120 minutes  
**Parallel With**: Phases 12, 13, 15, 16  
**Skills Used**: dotnet-webapi, entity-framework

**Generates**:
```
src/
├── Controllers/
│   └── [API Endpoints]
├── Services/
│   └── [Business Logic]
├── Repositories/
│   └── [Data Access]
├── Models/
│   ├── [Entity Models]
│   ├── [DTOs]
│   └── [Request/Response Models]
├── DbContext/
│   └── [Entity Framework Context]
├── Middleware/
│   └── [Request Processing]
└── Tests/
    └── [Unit Tests]
```

---

### Phase 15: @database-specialist

**Activation Condition**:
```
IF has_data_models == true
THEN activate @database-specialist
```

**Responsibility**: Database schema and migrations  
**Duration**: 45-60 minutes  
**Parallel With**: Phases 12, 13, 14, 16  
**Skills Used**: sql-schema-design

**Generates**:
```
database/
├── migrations/
│   └── [Migration Scripts]
├── schemas/
│   ├── [CREATE TABLE statements]
│   ├── [Indexes]
│   └── [Constraints]
├── seed-data/
│   └── [Initial Data Scripts]
└── documentation/
    └── [Schema Documentation]
```

---

## Complete Agent Inventory

### Tier 1: Orchestration (8 agents)

| Phase | Agent | Type | Always? | Duration | Next Phase |
|-------|-------|------|---------|----------|-----------|
| 1 | @plan | Discovery | ✅ YES | 30-60m | Phase 2 |
| 2 | @doc | Documentation | ✅ YES | 30-45m | Phase 3 |
| 3 | @backlog | Planning | ✅ YES | 20-30m | Phase 4 |
| 4 | @coordinator | Planning | ✅ YES | 20-30m | Phase 5 |
| 5 | @qa | Planning | ✅ YES | 15-25m | Phase 6 |
| 6 | @reporter | Planning | ✅ YES | 15-20m | Phase 7 |
| 7 | @architect | Design | ✅ YES | 45-90m | Phase 8 |
| 8 | @code-architect | Design | ✅ YES | 45-90m | Phases 9-16 |

### Tier 2: Infrastructure (4 agents)

| Phase | Agent | Type | Condition | Duration | Exclusive? |
|-------|-------|------|-----------|----------|-----------|
| 9a | @azure-architect | Cloud | `platform="Azure"` | 30-45m | No |
| 9b | @bicep-specialist | IaC | `Phase 9a done` | 45-60m | No |
| 12 | @devops-specialist | CI/CD | `ci_cd="GitHub"` (default) | 30-45m | YES vs 16 |
| 16 | @azure-devops-specialist | CI/CD | `ci_cd="AzureDevOps"` | 30-45m | YES vs 12 |

### Tier 3: Implementation (5 agents)

| Phase | Agent | Type | Condition | Duration | Parallel? |
|-------|-------|------|-----------|----------|-----------|
| 13 | @react-specialist | Frontend | `frontend="React"` | 60-120m | YES |
| 14 | @dotnet-specialist | Backend | `backend=".NET"` | 60-120m | YES |
| 15 | @database-specialist | Database | `has_data_models` | 45-60m | YES |

---

## Technology Skill Architecture

### Code Skills (6)

**Purpose**: Specific technical implementation patterns

1. **react-patterns** (Frontend)
   - Component structure
   - Functional components
   - Hook patterns
   - Re-render optimization

2. **state-management** (Frontend)
   - Zustand patterns
   - Redux integration
   - TanStack Query setup
   - Context API alternatives

3. **dotnet-webapi** (Backend)
   - ASP.NET Core setup
   - Routing and controllers
   - Authentication/Authorization
   - API versioning

4. **entity-framework** (Backend)
   - DbContext configuration
   - Entity relationships
   - Migrations management
   - Query optimization

5. **sql-schema-design** (Database)
   - Relational design
   - Normalization
   - Indexing strategies
   - Constraint definition

6. **azure-pipelines** (DevOps)
   - Azure DevOps YAML
   - Build/Release pipelines
   - Deployment stages
   - Approval gates

### Process Skills (9)

**Purpose**: Project-level orchestration and management

1. **adaptive-discovery** - Dynamic requirement discovery
2. **phase-planning** - Project phase organization
3. **requirements-analysis** - Requirement specification
4. **architecture-design** - System architecture patterns
5. **infrastructure-automation** - IaC principles
6. **error-handling** - Error management strategies
7. **technical-writing** - Documentation standards
8. **backlog-planning** - User story creation
9. **timeline-estimation** - Project timeline calculation

---

## Schema Validation Architecture

### Agent Schemas (34 files total)

Each agent has 2 schema files:
```
.github/schemas/agents/
├── @agent-name.input.schema.json    (input specification)
└── @agent-name.output.schema.json   (output specification)
```

**Example: @react-specialist**
```json
// Input Schema validates:
{
  "frontend_architecture": { ... },
  "components_to_build": [ ... ],
  "api_integration": { ... },
  "styling_framework": "Tailwind|Material|...",
  "testing_framework": "Vitest|Jest|..."
}

// Output Schema validates:
{
  "artifacts": {
    "components": [ { file, content } ],
    "hooks": [ { file, content } ],
    "stores": [ { file, content } ],
    "tests": [ { file, content } ]
  },
  "code_quality": { ... },
  "next_phase": "@dotnet-specialist"
}
```

### Artifact Schemas (4 files)

```
.github/schemas/artifacts/
├── ProjectPlan.artifact.schema.json
├── TechnicalSpecification.artifact.schema.json
├── CodeArchitecture.artifact.schema.json
└── ArchitectureDecision.artifact.schema.json
```

### Skill Schemas (30 files total)

Each skill has 2 schema files:
```
.github/schemas/skills/
├── [skill-name].input.schema.json
└── [skill-name].output.schema.json
```

---

## Data Flow Architecture

### Within Orchestration Tier (Phases 1-8)

```
User Input
    ↓
@plan → ProjectPlan
    ↓
@doc → TechnicalSpecification
    ↓
@backlog → ProductBacklog
    ↓
@coordinator → ExecutionPlan
    ↓
@qa → QAStrategy
    ↓
@reporter → MonitoringPlan
    ↓
@architect → ArchitectureDecision
    ↓
@code-architect → CodeArchitecture
    ↓ [Contains decision triggers]
```

### From Orchestration to Implementation

```
ArchitectureDecision (from @architect)
    ├─ platform = "Azure" → Phase 9a
    ├─ frontend_framework = "React" → Phase 13
    ├─ backend_framework = ".NET" → Phase 14
    ├─ has_database = true → Phase 15
    └─ ci_cd_platform → Phase 12 or 16

CodeArchitecture (from @code-architect)
    ├─ frontend_architecture → Phase 13
    ├─ backend_architecture → Phase 14
    ├─ data_model → Phase 15
    └─ code_structure_templates → All
```

### Between Implementation Phases

```
@react-specialist → React Components + API Types
                ↓
@dotnet-specialist consumes → API contract types

@database-specialist → SQL Schema
                ↓
@dotnet-specialist consumes → Entity definitions
@react-specialist consumes → API data structure reference
```

---

## Execution Models

### Sequential Execution (Simplest)

```
Phases 1-8 (Sequential - Mandatory)
    ↓
Phase 9a (If Azure)
    ↓
Phase 9b (If Azure)
    ↓
Phase 13 (If React)
    ↓
Phase 14 (If .NET)
    ↓
Phase 15 (If Database)
    ↓
Phase 12 or 16 (CI/CD)

Total Time: ~7-9 hours (worst case with all phases)
```

### Parallel Execution (Optimized)

```
Phases 1-8 (Sequential - Mandatory: 4.8h)
    ↓
Parallel Split:
├─ Phase 9a → 9b (Serial: 1.3h)
├─ Phase 13 (@react: 1.5h)
├─ Phase 14 (@dotnet: 1.5h)
├─ Phase 15 (@database: 1h)
└─ Phase 12 or 16 (CI/CD: 45m)

Critical Path: Phase 13 or 14 (1.5h) whichever longer
Total Time: 4.8h + 1.5h = 6.3h (optimized)
```

---

## Real-World Scenario Mappings

### S01: Solo MVP (React + .NET + PostgreSQL + Azure + GitHub)

**Agents Activated**:
1-8 (Orchestration: mandatory)
9a-9b (Azure infrastructure)
13 (@react-specialist)
14 (@dotnet-specialist)
15 (@database-specialist)
12 (@devops-specialist, GitHub default)

**Duration**: 6-7 hours
**Output**: Full React+.NET+PostgreSQL app deployed to Azure with GitHub Actions

---

### S03: Medium SaaS (React + Node.js + PostgreSQL + Azure)

**Agents Activated**:
1-8 (Orchestration: mandatory)
9a-9b (Azure infrastructure)
13 (@react-specialist)
[Skip 14 - backend is Node.js]
15 (@database-specialist)
12 (@devops-specialist, GitHub default)

**Duration**: 5-6 hours
**Output**: Full React+Node.js+PostgreSQL app, IaC templates

---

### S05: Healthcare (React + Node.js + PostgreSQL + Azure + Azure DevOps + HIPAA)

**Agents Activated**:
1-8 (Orchestration: mandatory)
9a-9b (Azure infrastructure with HIPAA compliance)
13 (@react-specialist)
[Skip 14 - backend is Node.js]
15 (@database-specialist with HIPAA encryption)
16 (@azure-devops-specialist for enterprise approval gates)

**Duration**: 6-7 hours
**Output**: HIPAA-compliant app, enterprise CI/CD, encrypted infrastructure

---

## Extension Points

### Adding New Agents

To add a new agent (e.g., @vue-specialist):

1. Create agent specification: `.github/agents/@vue-specialist.agent.md`
2. Create input schema: `.github/schemas/agents/@vue-specialist.input.schema.json`
3. Create output schema: `.github/schemas/agents/@vue-specialist.output.schema.json`
4. Update @code-architect to recognize condition: `frontend_framework == "Vue"`
5. Add activation logic in orchestrator

---

### Adding New Skills

To add a new skill (e.g., python-fastapi):

1. Create skill spec: `.github/skills/python-fastapi.skill.md`
2. Create input schema: `.github/schemas/skills/python-fastapi.input.schema.json`
3. Create output schema: `.github/schemas/skills/python-fastapi.output.schema.json`
4. Link skill to agent that uses it
5. Reference in agent output specification

---

## Key Architectural Decisions

### 1. Three-Tier Architecture
- **Rationale**: Separates concerns (orchestration vs infrastructure vs implementation)
- **Benefit**: Easy to add new implementation agents without affecting orchestration
- **Trade-off**: More moving parts to coordinate

### 2. Mandatory Phases 1-8, Conditional Phases 9-16
- **Rationale**: Core workflow same for all projects, customization only on technology choices
- **Benefit**: Predictable core planning phase, flexible implementation
- **Trade-off**: Cannot skip core phases even if not needed

### 3. Parallel Implementation Phases (13-15)
- **Rationale**: No dependencies between frontend/backend/database work
- **Benefit**: 30-40% faster execution (~3 hours saved)
- **Trade-off**: Requires careful coordination of API contracts

### 4. Mutually Exclusive CI/CD (Phase 12 vs 16)
- **Rationale**: GitHub Actions and Azure DevOps have different paradigms
- **Benefit**: Consistent pipeline structure, no duplication
- **Trade-off**: User must choose one platform upfront

### 5. JSON Schema Validation
- **Rationale**: Type-safe communication between agents
- **Benefit**: Early error detection, clear contracts
- **Trade-off**: Additional 34 schema files to maintain

---

## Performance Characteristics

### Execution Time by Scenario

| Scenario | Phases Executed | Orchestration | Infrastructure | Implementation | Total |
|----------|-----------------|----------------|-----------------|-----------------|-------|
| S01 (Full Stack + Azure) | 1-16 | 4.8h | 1.3h | 1.5h | ~7.5h |
| S03 (React+Node+Azure) | 1-13,15-16 | 4.8h | 1.3h | 1.5h | ~7.5h |
| S04 (SPA Only) | 1-8,12-13 | 4.8h | 0.7h | 1.5h | ~7h |
| S05 (Healthcare) | 1-16 | 4.8h | 1.3h | 1.5h | ~7.5h |

### Parallelization Impact

- **Sequential Execution**: 8-9 hours
- **Optimized Parallel**: 6-7 hours
- **Savings**: ~20-30% execution time

---

## Quality Metrics

### Schema Coverage

- **Agent Schemas**: 34/34 (100%)
- **Artifact Schemas**: 4/4 (100%)
- **Skill Schemas**: 30/30 (100%)
- **Total Coverage**: 68/68 (100%)

### Agent Specification Quality

- **All agents documented**: 17/17 (100%)
- **All agents have activation criteria**: 17/17 (100%)
- **All agents have output schemas**: 17/17 (100%)
- **All agents have prerequisite documentation**: 17/17 (100%)

---

## System Constraints & Guarantees

### Guarantees

1. **Sequential Phases 1-8** - Phases always execute in order
2. **Non-Blocking Implementation** - Phases 13-15 can run concurrently
3. **Schema Validation** - All inputs/outputs match schemas
4. **Artifact Persistence** - All outputs saved to `output/` directory
5. **Documentation Generated** - Each phase produces runbooks

### Constraints

1. **Phase 8 Required** - Cannot skip @code-architect
2. **One CI/CD Platform** - Must choose GitHub Actions OR Azure DevOps
3. **No Circular Dependencies** - Phases flow unidirectionally
4. **Input Dependency** - Each phase depends on previous artifacts

---

## Troubleshooting by Phase

### Phase 1-8 Issues
- Typically input validation errors
- Check @plan user input meets specification
- Verify artifact format matches schema

### Phase 9 Issues (Azure-specific)
- Verify Azure subscription exists
- Check region availability for resources
- Validate cost estimates against budget

### Phase 12 vs 16 Issues
- Ensure only one CI/CD platform selected
- Verify authentication credentials valid
- Check deployment permissions configured

### Phase 13-15 Issues
- Usually framework-specific (React, .NET, SQL)
- Check generated code compiles
- Verify type definitions match API contracts

---

## Future Roadmap

### Potential Extensions

1. **New Frontend Frameworks**
   - @vue-specialist (Phase 13 alternative)
   - @angular-specialist (Phase 13 alternative)
   - @svelte-specialist (Phase 13 alternative)

2. **New Backend Frameworks**
   - @python-specialist (Phase 14 alternative)
   - @java-specialist (Phase 14 alternative)
   - @go-specialist (Phase 14 alternative)

3. **New Infrastructure Platforms**
   - @aws-architect (Phase 9 alternative)
   - @gcp-architect (Phase 9 alternative)

4. **Mobile Development**
   - @react-native-specialist (Phase 13 alternative)
   - @flutter-specialist (Phase 13 alternative)

---

**Complete architectural reference document for AgenticCoder v1.0**

Next Steps: Use [AGENT_ACTIVATION_GUIDE.md](AGENT_ACTIVATION_GUIDE.md) for specific agent details, or [PHASE_FLOW.md](PHASE_FLOW.md) for detailed phase timings.

