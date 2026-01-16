# Agent Handoff Matrix

**Date**: January 13, 2026  
**Version**: 2.0  
**Purpose**: Visual reference for all agent-to-agent handoff patterns

---

## Complete Handoff Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATION TIER                           │
│                    (Always Sequential)                           │
└─────────────────────────────────────────────────────────────────┘

Phase 1:  @plan
            ↓
Phase 2:  @doc
            ↓
Phase 3:  @backlog
            ↓
Phase 4:  @coordinator
            ↓
Phase 5:  @qa
            ↓
Phase 6:  @reporter
            ↓
Phase 7:  @architect
            ↓
Phase 8:  @code-architect ──────────────┐
            │                            │
            ↓                            ↓
┌───────────────────────────────────────────────────────────────────┐
│              CONDITIONAL ARCHITECTURE TIER                        │
│                (Based on platform decisions)                      │
└───────────────────────────────────────────────────────────────────┘
            │                            │
            ├─[IF Azure]─────► Phase 9:  @azure-architect
            │                            ↓
            │                  Phase 10: @azure-devops-specialist
            │                            ↓
            │                  Phase 11: @bicep-specialist
            │                            ↓
            ├─[IF Database]──► Phase 12: @database-specialist (non-MySQL)
            │                            │
            ↓                            ↓
┌───────────────────────────────────────────────────────────────────┐
│           IMPLEMENTATION TIER (Phase 13-15)                       │
│              (Parallel execution possible)                        │
└───────────────────────────────────────────────────────────────────┘
            │
            ├─[Frontend]──────────────────┐
            │   ├─[React]──► @react-specialist
            │   ├─[Vue]────► @vue-specialist
            │   ├─[Angular]► @angular-specialist
            │   ├─[Svelte]─► @svelte-specialist
            │   └─[Other]──► @frontend-specialist
            │
            ├─[Backend]───────────────────┐
            │   ├─[.NET]───► @dotnet-specialist
            │   ├─[Node.js]► @nodejs-specialist
            │   ├─[Python]─► @python-specialist
            │   ├─[Go]─────► @go-specialist
            │   ├─[Java]───► @java-specialist
            │   └─[Other]──► @backend-specialist
            │
            ├─[Database]──────────────────┐
            │   └─[MySQL]──► @mysql-specialist
            │
            └─[Container]─────────────────┐
                └─[Docker]─► @docker-specialist
                            │
                            ↓
┌───────────────────────────────────────────────────────────────────┐
│                     FINAL PHASES                                  │
└───────────────────────────────────────────────────────────────────┘
                            │
                            ↓
                  Phase 15: @devops-specialist
                            ↓
                  Phase 16: @reporter (final)
                            ↓
                          COMPLETE
```

---

## Handoff Matrix Table

| From Agent | To Agent(s) | Condition | Phase Transition |
|------------|-------------|-----------|------------------|
| @plan | @doc | Always | 1 → 2 |
| @doc | @backlog | Always | 2 → 3 |
| @backlog | @coordinator | Always | 3 → 4 |
| @coordinator | @qa | Always | 4 → 5 |
| @qa | @reporter | Always | 5 → 6 |
| @reporter | @architect | Always | 6 → 7 |
| @architect | @code-architect | Always | 7 → 8 |
| @code-architect | @azure-architect | IF platform == Azure | 8 → 9 |
| @code-architect | @react-specialist | IF frontend == React | 8 → 13 |
| @code-architect | @vue-specialist | IF frontend == Vue | 8 → 13 |
| @code-architect | @angular-specialist | IF frontend == Angular | 8 → 13 |
| @code-architect | @svelte-specialist | IF frontend == Svelte | 8 → 13 |
| @code-architect | @frontend-specialist | IF frontend == Other | 8 → 13 |
| @code-architect | @dotnet-specialist | IF backend == .NET | 8 → 13 |
| @code-architect | @nodejs-specialist | IF backend == Node.js | 8 → 13 |
| @code-architect | @python-specialist | IF backend == Python | 8 → 13 |
| @code-architect | @go-specialist | IF backend == Go | 8 → 13 |
| @code-architect | @java-specialist | IF backend == Java | 8 → 13 |
| @code-architect | @backend-specialist | IF backend == Other | 8 → 13 |
| @code-architect | @mysql-specialist | IF database == MySQL | 8 → 15 |
| @code-architect | @database-specialist | IF database != MySQL | 8 → 12 |
| @code-architect | @devops-specialist | Always (after conditional) | 8 → 15 |
| @azure-architect | @azure-devops-specialist | IF Azure && Azure DevOps | 9 → 10 |
| @azure-architect | @bicep-specialist | IF Azure && IaC | 9 → 11 |
| @azure-devops-specialist | @devops-specialist | Always | 10 → 15 |
| @bicep-specialist | @devops-specialist | Always | 11 → 15 |
| @database-specialist | @devops-specialist | Always | 12 → 15 |
| @react-specialist | @qa | Always | 13 → 5 |
| @react-specialist | @devops-specialist | Always | 13 → 15 |
| @vue-specialist | @qa | Always | 13 → 5 |
| @vue-specialist | @devops-specialist | Always | 13 → 15 |
| @angular-specialist | @qa | Always | 13 → 5 |
| @angular-specialist | @devops-specialist | Always | 13 → 15 |
| @svelte-specialist | @qa | Always | 13 → 5 |
| @svelte-specialist | @devops-specialist | Always | 13 → 15 |
| @frontend-specialist | @qa | Always | 13 → 5 |
| @frontend-specialist | @devops-specialist | Always | 13 → 15 |
| @dotnet-specialist | @qa | Always | 13 → 5 |
| @dotnet-specialist | @devops-specialist | Always | 13 → 15 |
| @nodejs-specialist | @qa | Always | 13 → 5 |
| @nodejs-specialist | @devops-specialist | Always | 13 → 15 |
| @python-specialist | @qa | Always | 13 → 5 |
| @python-specialist | @devops-specialist | Always | 13 → 15 |
| @go-specialist | @qa | Always | 13 → 5 |
| @go-specialist | @devops-specialist | Always | 13 → 15 |
| @java-specialist | @qa | Always | 13 → 5 |
| @java-specialist | @devops-specialist | Always | 13 → 15 |
| @backend-specialist | @qa | Always | 13 → 5 |
| @backend-specialist | @devops-specialist | Always | 13 → 15 |
| @mysql-specialist | @docker-specialist | IF containerization | 15 → 15 |
| @mysql-specialist | @devops-specialist | Always | 15 → 15 |
| @docker-specialist | @devops-specialist | Always | 15 → 15 |
| @devops-specialist | @reporter | Always | 15 → 16 |
| @reporter | END | Always | 16 → Done |

---

## Parallel Execution Groups

### Group 1: Frontend + Backend + Database (Phase 13-15)
These agents can run in parallel after @code-architect:

```
@code-architect (Phase 8)
    │
    ├──► @react-specialist (Phase 13)    ┐
    ├──► @nodejs-specialist (Phase 13)   ├─ PARALLEL
    └──► @mysql-specialist (Phase 15)    ┘
                │
                └──► @docker-specialist (Phase 15)
                          │
                          └──► @devops-specialist (Phase 15)
```

### Group 2: Multiple Microservices
When building multiple services:

```
@code-architect (Phase 8)
    │
    ├──► @react-specialist (Frontend)     ┐
    ├──► @nodejs-specialist (Service 1)   │
    ├──► @python-specialist (Service 2)   ├─ PARALLEL
    ├──► @go-specialist (Service 3)       │
    └──► @mysql-specialist (Database)     ┘
                │
                └──► @docker-specialist
                          │
                          └──► @devops-specialist
```

---

## Conditional Branches

### Branch 1: Azure Platform
```
IF platform == "Azure":
  @code-architect → @azure-architect
                      ↓
                   @azure-devops-specialist (optional)
                      ↓
                   @bicep-specialist (optional)
                      ↓
                   [Continue to implementation]
```

### Branch 2: Frontend Selection
```
IF frontend_framework == "React":
  @code-architect → @react-specialist → @qa → @devops-specialist

IF frontend_framework == "Vue":
  @code-architect → @vue-specialist → @qa → @devops-specialist

IF frontend_framework == "Angular":
  @code-architect → @angular-specialist → @qa → @devops-specialist

IF frontend_framework == "Svelte":
  @code-architect → @svelte-specialist → @qa → @devops-specialist

ELSE:
  @code-architect → @frontend-specialist → @qa → @devops-specialist
```

### Branch 3: Backend Selection
```
IF backend_framework == ".NET":
  @code-architect → @dotnet-specialist → @qa → @devops-specialist

IF backend_framework == "Node.js":
  @code-architect → @nodejs-specialist → @qa → @devops-specialist

IF backend_framework == "Python":
  @code-architect → @python-specialist → @qa → @devops-specialist

IF backend_framework == "Go":
  @code-architect → @go-specialist → @qa → @devops-specialist

IF backend_framework == "Java":
  @code-architect → @java-specialist → @qa → @devops-specialist

ELSE:
  @code-architect → @backend-specialist → @qa → @devops-specialist
```

### Branch 4: Database Selection
```
IF database == "MySQL":
  @code-architect → @mysql-specialist → @docker-specialist (opt) → @devops-specialist

IF database != "MySQL" AND requires_database:
  @code-architect → @database-specialist → @docker-specialist (opt) → @devops-specialist

ELSE:
  Skip database phase
```

### Branch 5: Containerization
```
IF requires_containerization == true:
  [Implementation agents] → @docker-specialist → @devops-specialist

ELSE:
  [Implementation agents] → @devops-specialist
```

---

## Agent Input/Output Summary

| Agent | Primary Input From | Output Artifact(s) | Hands Off To |
|-------|-------------------|-------------------|--------------|
| @plan | User | ProjectPlan | @doc |
| @doc | @plan | TechnicalSpecification | @backlog |
| @backlog | @doc | Backlog (user stories) | @coordinator |
| @coordinator | @backlog | ExecutionPlan | @qa |
| @qa | @coordinator | QAStrategy | @reporter |
| @reporter | @qa | ProgressReport | @architect |
| @architect | @reporter | SystemArchitecture | @code-architect |
| @code-architect | @architect | CodeArchitecture | Multiple (conditional) |
| @azure-architect | @code-architect | AzureArchitecture | @azure-devops, @bicep |
| @azure-devops-specialist | @azure-architect | AzurePipeline | @devops-specialist |
| @bicep-specialist | @azure-architect | BicepTemplates | @devops-specialist |
| @database-specialist | @code-architect | DatabaseSchema | @devops-specialist |
| @react-specialist | @code-architect | ReactApplication | @qa, @devops |
| @vue-specialist | @code-architect | VueApplication | @qa, @devops |
| @angular-specialist | @code-architect | AngularApplication | @qa, @devops |
| @svelte-specialist | @code-architect | SvelteApplication | @qa, @devops |
| @frontend-specialist | @code-architect | FrontendCode | @qa, @devops |
| @dotnet-specialist | @code-architect | DotNetApplication | @qa, @devops |
| @nodejs-specialist | @code-architect | NodeJSApplication | @qa, @devops |
| @python-specialist | @code-architect | PythonApplication | @qa, @devops |
| @go-specialist | @code-architect | GoApplication | @qa, @devops |
| @java-specialist | @code-architect | JavaApplication | @qa, @devops |
| @backend-specialist | @code-architect | BackendCode | @qa, @devops |
| @mysql-specialist | @code-architect | MySQLSchema | @docker (opt), @devops |
| @docker-specialist | Implementation agents | DockerConfiguration | @devops-specialist |
| @devops-specialist | Multiple | DeploymentPipeline | @reporter |
| @reporter (final) | @devops-specialist | FinalReport | END |

---

## Complete Execution Paths

### Path 1: Standard SPA (React + Node.js + MySQL + Docker)
```
@plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect
  ↓
[PARALLEL]
  ├─ @react-specialist → @qa → @devops-specialist
  ├─ @nodejs-specialist → @qa → @devops-specialist
  └─ @mysql-specialist → @docker-specialist → @devops-specialist
  ↓
@reporter (final) → COMPLETE
```

### Path 2: Azure Enterprise (Angular + .NET + Azure SQL + Azure)
```
@plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect
  ↓
@azure-architect → @azure-devops-specialist → @bicep-specialist
  ↓
[PARALLEL]
  ├─ @angular-specialist → @qa → @devops-specialist
  ├─ @dotnet-specialist → @qa → @devops-specialist
  └─ @database-specialist → @devops-specialist
  ↓
@reporter (final) → COMPLETE
```

### Path 3: Microservices (Vue + Python + Go + MySQL + Docker)
```
@plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect
  ↓
[PARALLEL]
  ├─ @vue-specialist → @qa → @devops-specialist
  ├─ @python-specialist → @qa → @devops-specialist
  ├─ @go-specialist → @qa → @devops-specialist
  └─ @mysql-specialist → @docker-specialist → @devops-specialist
  ↓
@reporter (final) → COMPLETE
```

---

## Handoff Data Flow

### Artifact Dependencies
```
ProjectPlan (v1.0)
  ├─ TechnicalSpecification (v1.0)
  │   ├─ Backlog (v1.0)
  │   │   ├─ ExecutionPlan (v1.0)
  │   │   │   ├─ QAStrategy (v1.0)
  │   │   │   │   ├─ ProgressReport (v1.0)
  │   │   │   │   │   ├─ SystemArchitecture (v1.0)
  │   │   │   │   │   │   └─ CodeArchitecture (v1.0)
  │   │   │   │   │   │       ├─ ReactApplication (v1.0)
  │   │   │   │   │   │       ├─ NodeJSApplication (v1.0)
  │   │   │   │   │   │       ├─ MySQLSchema (v1.0)
  │   │   │   │   │   │       └─ DockerConfiguration (v1.0)
  │   │   │   │   │   │           └─ DeploymentPipeline (v1.0)
  │   │   │   │   │   │               └─ FinalReport (v1.0)
```

---

## Summary

- **26 Total Agents**
- **16 Phases**
- **50+ Possible Handoff Paths**
- **Parallel Execution**: Up to 10+ agents simultaneously (implementation phase)
- **Conditional Branching**: 5 major decision points
- **End-to-End**: ~9-11 hours typical execution time

**See Also**:
- [docs/AGENT_ACTIVATION_GUIDE.md](../docs/AGENT_ACTIVATION_GUIDE.md) - Activation conditions
- [docs/PHASE_FLOW.md](../docs/PHASE_FLOW.md) - Phase dependencies
- [docs/AGENT_SKILL_MAPPING.md](../docs/AGENT_SKILL_MAPPING.md) - Agent-skill relationships

---

**Document Version**: 1.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
