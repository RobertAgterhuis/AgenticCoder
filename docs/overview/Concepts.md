# Key Concepts

Understanding these concepts is essential for working with AgenticCoder.

## Agents

**Agents** are specialized AI workers, each expert in a specific domain.

### What is an Agent?

An agent is defined by:

- **Name:** Unique identifier (e.g., @azure-architect)
- **Role:** What the agent does
- **Skills:** Capabilities the agent has
- **Context:** Information the agent needs

### Agent Types

| Type | Examples | Purpose |
|------|----------|---------|
| Planning | @plan, @doc, @backlog | Requirements and planning |
| Architecture | @architect, @code-architect | System design |
| Azure | @azure-architect, @bicep-specialist | Azure infrastructure |
| Implementation | @frontend-specialist, @backend-specialist | Code generation |
| Quality | @qa, @devops-specialist | Testing and deployment |

### Agent Communication

Agents communicate via the **Message Bus**:

```
@plan ──message──► MessageBus ──message──► @architect
                       │
                       └──message──► @doc
```

## Phases

**Phases** are sequential stages in the workflow.

### The 16 Phases

| # | Phase | Description | Key Agents |
|---|-------|-------------|------------|
| 1 | Requirements | Gather and analyze requirements | @plan |
| 2 | Documentation | Create project documentation | @doc |
| 3 | Backlog | Generate backlog items | @backlog |
| 4 | Architecture | High-level architecture | @architect |
| 5 | Code Architecture | Detailed code design | @code-architect |
| 6 | ADR Generation | Architecture Decision Records | ADRGenerator |
| 7 | Diagram Generation | Create diagrams | DiagramGenerator |
| 8 | Review | Review architecture | @architect |
| 9 | Azure Architecture | Azure infrastructure design | @azure-architect |
| 10 | Bicep Planning | Plan Bicep templates | @bicep-specialist |
| 11 | Bicep Implementation | Generate Bicep code | @bicep-specialist |
| 12 | Infrastructure Validation | Validate infrastructure | Validation |
| 13 | Frontend Implementation | Generate frontend code | @frontend-specialist |
| 14 | Backend Implementation | Generate backend code | @backend-specialist |
| 15 | Database Implementation | Generate database code | @database-specialist |
| 16 | Delivery | Tests, CI/CD, docs | @qa, @devops |

### Phase Flow

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► ... ──► Phase 16
    │           │           │
    └───────feedback loop───┘
```

Each phase:

1. Receives input from previous phases
2. Activates relevant agents
3. Produces artifacts
4. Feeds into next phase

## Skills

**Skills** are capabilities that agents can use.

### What is a Skill?

A skill defines:

- **Name:** Skill identifier
- **Description:** What the skill does
- **Instructions:** How to apply the skill

### Skill Categories

| Category | Skills | Purpose |
|----------|--------|---------|
| Architecture | clean-architecture, hexagonal, microservices | Design patterns |
| Azure | azure-functions, cosmos-db, keyvault | Azure services |
| Frontend | react-patterns, vue-patterns, nextjs | Frontend frameworks |
| Backend | dotnet-webapi, nodejs-patterns, fastapi | Backend frameworks |
| Data | sql-schema, entity-framework, cosmos-db | Data layer |

### Skills vs Agents

- **Agent:** WHO does the work (@frontend-specialist)
- **Skill:** HOW to do the work (react-patterns)

An agent can have multiple skills:

```
@frontend-specialist
├── react-patterns (skill)
├── state-management (skill)
└── frontend-testing (skill)
```

## Scenarios

**Scenarios** are predefined project templates.

### What is a Scenario?

A scenario defines:

- Project type and complexity
- Technology stack
- Team size assumptions
- Required agents and phases

### Available Scenarios

| ID | Name | Stack | Complexity |
|----|------|-------|------------|
| S01 | Simple MVP | React + Node | Low |
| S02 | Startup | Full-stack | Medium |
| S03 | SaaS | Multi-tier | High |
| S04 | Enterprise | Microservices | Very High |
| S05 | Healthcare | Regulated | High + Compliance |

### Using Scenarios

```bash
node bin/agentic.js generate --scenario S03 --name MySaaS
```

## Artifacts

**Artifacts** are outputs produced by agents.

### Artifact Types

| Type | Example | Produced By |
|------|---------|-------------|
| Documentation | requirements.md | @doc |
| Architecture | architecture.json | @architect |
| Backlog | backlog.json | @backlog |
| Code | src/components/*.tsx | @frontend-specialist |
| Infrastructure | main.bicep | @bicep-specialist |
| Tests | *.test.ts | @qa |
| Pipelines | .github/workflows/*.yml | @devops-specialist |

### Artifact Flow

```
@plan ──► requirements.md ──► @architect ──► architecture.json ──► @code-architect
```

## Self-Learning

AgenticCoder **learns from errors** and improves over time.

### How It Works

1. **Error Logger** captures errors
2. **Analysis Engine** classifies patterns
3. **Fix Generator** creates solutions
4. **Fix Validator** tests fixes
5. **Apply Engine** applies fixes
6. **Audit Trail** logs everything

### Example

```
Error: "Cannot find module '@azure/identity'"

1. Classify: Missing dependency
2. Analyze: Pattern = missing npm package
3. Generate Fix: npm install @azure/identity
4. Validate: Build succeeds
5. Apply: Add to package.json
6. Log: Fix applied successfully
```

## Next Steps

- [Architecture](Architecture) - Deep dive into system design
- [Agent Catalog](../agents/Catalog) - Explore all agents
- [Phase Workflow](../agents/Phases) - Understand the workflow
