# Skills Reference

Reusable knowledge modules that extend agent capabilities.

---

## Overview

Skills are modular knowledge packages that agents can use to apply best practices, patterns, and templates. They enable consistent, high-quality code generation across projects.

## Skill Categories

| Category | Skills | Purpose |
|----------|--------|---------|
| **Architecture** | 3 skills | Design patterns and structure |
| **Development** | 5 skills | Coding patterns and frameworks |
| **Infrastructure** | 2 skills | Cloud and DevOps patterns |
| **Planning** | 3 skills | Requirements and estimation |
| **Quality** | 2 skills | Error handling and state |

---

## Architecture Skills

### architecture-design.skill.md

**Purpose:** System architecture patterns and decisions

**Used By:** @architect, @azure-architect

**Provides:**
- Layered architecture patterns
- Microservices vs monolith guidance
- Service boundary definitions
- Component interaction patterns

**Example Application:**
```
When designing a multi-tenant SaaS:
- Apply database-per-tenant or shared schema
- Define service isolation boundaries
- Implement tenant context propagation
```

---

### adaptive-discovery.skill.md

**Purpose:** Dynamic requirement discovery

**Used By:** @requirements-analyst, @planning-specialist

**Provides:**
- Requirement elicitation techniques
- Gap analysis methods
- Stakeholder interview patterns
- Iterative refinement strategies

---

## Development Skills

### react-patterns.skill.md

**Purpose:** React best practices and patterns

**Used By:** @frontend-developer

**Provides:**
- Component composition patterns
- Hook patterns (custom hooks)
- Performance optimization
- Testing strategies

**Patterns Included:**

| Pattern | Description |
|---------|-------------|
| Container/Presentational | Separation of logic and UI |
| Compound Components | Flexible component APIs |
| Render Props | Sharing behavior |
| Custom Hooks | Reusable stateful logic |
| Error Boundaries | Graceful error handling |

**Example:**
```typescript
// Custom hook pattern from skill
function useAsync<T>(asyncFn: () => Promise<T>) {
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: T | null;
  }>({ loading: true, error: null, data: null });

  useEffect(() => {
    asyncFn()
      .then(data => setState({ loading: false, error: null, data }))
      .catch(error => setState({ loading: false, error, data: null }));
  }, [asyncFn]);

  return state;
}
```

---

### dotnet-webapi.skill.md

**Purpose:** .NET Web API development patterns

**Used By:** @backend-developer

**Provides:**
- Controller design patterns
- Dependency injection setup
- Middleware configuration
- API versioning

**Patterns Included:**

| Pattern | Description |
|---------|-------------|
| Repository Pattern | Data access abstraction |
| CQRS | Command/Query separation |
| Mediator | Request handling |
| Result Pattern | Error handling |

---

### entity-framework.skill.md

**Purpose:** Entity Framework Core best practices

**Used By:** @database-architect, @backend-developer

**Provides:**
- DbContext configuration
- Migration strategies
- Query optimization
- Relationship mapping

**Best Practices:**
- Use `AsNoTracking()` for read-only queries
- Implement repository pattern for testability
- Use explicit loading for complex graphs
- Configure indexes via Fluent API

---

### sql-schema-design.skill.md

**Purpose:** Database schema design patterns

**Used By:** @database-architect

**Provides:**
- Normalization guidelines
- Index design strategies
- Constraint patterns
- Migration best practices

**Patterns Included:**

| Pattern | Use Case |
|---------|----------|
| Soft Delete | Audit trail requirements |
| Temporal Tables | History tracking |
| JSON Columns | Flexible attributes |
| Partitioning | Large datasets |

---

### state-management.skill.md

**Purpose:** Frontend state management patterns

**Used By:** @frontend-developer

**Provides:**
- Global vs local state decisions
- Redux/Zustand patterns
- Server state management
- Optimistic updates

**Decision Matrix:**

| State Type | Solution |
|------------|----------|
| UI State | Local useState |
| Form State | React Hook Form |
| Server State | TanStack Query |
| Global State | Zustand/Redux |

---

## Infrastructure Skills

### infrastructure-automation.skill.md

**Purpose:** Infrastructure as Code patterns

**Used By:** @bicep-developer, @azure-architect

**Provides:**
- Bicep module patterns
- Parameter file organization
- Environment configuration
- Secret management

**Module Structure:**
```
infrastructure/
├── main.bicep              # Entry point
├── modules/
│   ├── compute/
│   │   ├── app-service.bicep
│   │   └── function-app.bicep
│   ├── data/
│   │   ├── sql-database.bicep
│   │   └── storage.bicep
│   └── networking/
│       ├── vnet.bicep
│       └── private-endpoint.bicep
└── parameters/
    ├── dev.bicepparam
    ├── staging.bicepparam
    └── prod.bicepparam
```

---

### azure-pipelines.skill.md

**Purpose:** CI/CD pipeline patterns

**Used By:** @devops-engineer

**Provides:**
- GitHub Actions workflows
- Azure DevOps pipelines
- Deployment strategies
- Environment gates

**Workflow Templates:**

| Template | Purpose |
|----------|---------|
| ci.yml | Continuous Integration |
| cd.yml | Continuous Deployment |
| pr-validation.yml | Pull Request checks |
| infrastructure.yml | Bicep deployment |

---

## Planning Skills

### requirements-analysis.skill.md

**Purpose:** Requirements engineering techniques

**Used By:** @requirements-analyst

**Provides:**
- User story templates
- Acceptance criteria patterns
- Non-functional requirements
- Requirement traceability

**User Story Template:**
```markdown
## US-001: [Title]

**As a** [role]
**I want** [capability]
**So that** [benefit]

### Acceptance Criteria
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]

### Technical Notes
- Implementation considerations
- Dependencies
```

---

### backlog-planning.skill.md

**Purpose:** Backlog management and prioritization

**Used By:** @planning-specialist

**Provides:**
- Sprint planning techniques
- Story point estimation
- Priority frameworks
- Dependency mapping

**Prioritization Matrix:**

| Priority | Criteria |
|----------|----------|
| P0 - Critical | Blocks release, security issue |
| P1 - High | Core functionality |
| P2 - Medium | Important but not blocking |
| P3 - Low | Nice to have |

---

### timeline-estimation.skill.md

**Purpose:** Effort and timeline estimation

**Used By:** @estimation-analyst

**Provides:**
- Story point calibration
- Velocity calculation
- Risk buffer allocation
- Milestone planning

**Estimation Guidelines:**

| Points | Complexity | Example |
|--------|------------|---------|
| 1 | Trivial | Config change |
| 2 | Simple | CRUD endpoint |
| 3 | Medium | Feature with validation |
| 5 | Complex | Integration |
| 8 | Very Complex | New subsystem |
| 13 | Epic | Break down further |

---

### phase-planning.skill.md

**Purpose:** Project phase orchestration

**Used By:** @planning-specialist, @coordinator

**Provides:**
- Phase dependency mapping
- Milestone definitions
- Handoff protocols
- Progress tracking

---

## Quality Skills

### error-handling.skill.md

**Purpose:** Error handling patterns

**Used By:** @backend-developer, @frontend-developer

**Provides:**
- Exception hierarchy design
- Error response formats
- Logging strategies
- Recovery patterns

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "traceId": "abc-123"
  }
}
```

---

### technical-writing.skill.md

**Purpose:** Documentation standards

**Used By:** @documentation-specialist

**Provides:**
- README templates
- API documentation patterns
- Architecture decision records
- User guide structure

---

## Creating Custom Skills

### Skill File Structure

Create skills in `.github/skills/`:

```markdown
# skill-name.skill.md

## Purpose
What this skill provides

## Used By
Which agents use this skill

## Patterns

### Pattern Name
Description and when to apply

#### Implementation
```code
Code template
```

#### Example
Real-world usage example

## Best Practices
- Practice 1
- Practice 2

## Anti-Patterns
- What to avoid
```

### Registering Skills

Skills are automatically discovered from `.github/skills/`. To use a skill:

1. Create the skill file
2. Reference it in agent definitions
3. Skills are loaded when agents activate

### Skill Dependencies

Skills can reference other skills:

```markdown
## Dependencies
- architecture-design.skill.md
- error-handling.skill.md
```

---

## Skill Usage

### In Agent Definitions

```markdown
# @my-agent.agent.md

## Skills
- react-patterns.skill.md
- state-management.skill.md
- error-handling.skill.md
```

### Runtime Application

Agents automatically apply relevant skills during code generation:

```
User: @plan Create a React dashboard

Agent applies:
├── react-patterns.skill.md (component structure)
├── state-management.skill.md (data handling)
└── error-handling.skill.md (error boundaries)
```

---

<p align="center">
  <a href="Agents">← Agents</a> | <a href="API-Reference">API Reference →</a>
</p>
