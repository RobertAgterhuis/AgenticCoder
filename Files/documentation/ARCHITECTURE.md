# Architecture Overview

**Version**: 2.0  
**Updated**: January 13, 2026

---

## System Architecture

AgenticCoder is a multi-agent orchestration system designed for intelligent, collaborative code generation. The architecture consists of 26 specialized agents organized in 3 tiers, working through 16 orchestrated phases.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Request                           │
│           (Project Specification + Goals)                │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   @plan (Orchestrator)     │
        │   Phase 1: Analyze Input   │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼────────────────────┐
        │  Orchestration Tier (Phases 2-5) │
        │  - @requirements-analyzer        │
        │  - @security-auditor             │
        │  - @performance-optimizer        │
        │  - @project-validator            │
        └─────────────┬────────────────────┘
                      │
        ┌─────────────▼───────────────────┐
        │  Architecture Tier (Phases 6-8) │
        │  - @code-architect              │
        │  - @infrastructure-designer     │
        │  - @database-modeler            │
        │  - @deployment-strategist       │
        └─────────────┬───────────────────┘
                      │
        ┌─────────────▼──────────────────────────────┐
        │  Implementation Tier (Phases 13-14)        │
        │  Parallel Execution:                       │
        │  ├─ Frontend: @react, @vue, @svelte,       │
        │  │            @angular                     │
        │  ├─ Backend: @nodejs, @python, @go, @java │
        │  ├─ Database: @mysql, @mongodb, @postgres  │
        │  └─ APIs: @graphql, @restful               │
        └─────────────┬──────────────────────────────┘
                      │
        ┌─────────────▼─────────────────────┐
        │  DevOps & Testing (Phases 15-16)  │
        │  - @docker-specialist             │
        │  - @devops-specialist             │
        │  - @qa                            │
        └─────────────┬─────────────────────┘
                      │
        ┌─────────────▼──────────────────────┐
        │    Deliverables                    │
        │  - Complete Source Code            │
        │  - Architecture Documentation      │
        │  - CI/CD Pipelines                 │
        │  - Tests & Quality Metrics         │
        │  - Deployment Guides               │
        └──────────────────────────────────┘
```

---

## System Components

### 1. Orchestration Layer

**Purpose**: Coordinate agent execution and ensure quality standards

**Components**:

| Agent | Phase | Role | Key Skills |
|-------|-------|------|-----------|
| @plan | 1 | Entry point, orchestrates all agents | project-planning |
| @requirements-analyzer | 2 | Analyze requirements and create specifications | requirements-analysis |
| @security-auditor | 3 | Identify security requirements and threats | security-best-practices |
| @performance-optimizer | 4 | Define performance targets and metrics | performance-best-practices |
| @project-validator | 5 | Validate specifications before architecture | validation-framework |

**Responsibilities**:
- Parse user requirements
- Define project scope
- Create specifications
- Validate completeness
- Ensure quality gates

### 2. Architecture Layer

**Purpose**: Design system architecture and infrastructure

**Components**:

| Agent | Phase | Role | Key Skills |
|-------|-------|------|-----------|
| @code-architect | 8 | Design code structure and patterns | architecture-patterns |
| @infrastructure-designer | 8 | Plan infrastructure requirements | cloud-infrastructure |
| @database-modeler | 9 | Design database schema and relationships | database-design |
| @deployment-strategist | 10 | Plan deployment strategy | deployment-patterns |

**Responsibilities**:
- Design system components
- Define interfaces
- Plan infrastructure
- Create schemas
- Design deployment

### 3. Implementation Layer

**Purpose**: Generate actual source code

**Frontend Agents**:
- @react-specialist - React applications
- @vue-specialist - Vue.js applications
- @angular-specialist - Angular applications
- @svelte-specialist - Svelte applications

**Backend Agents**:
- @nodejs-specialist - Node.js/Express backends
- @python-specialist - Python/Django backends
- @go-specialist - Go backends
- @java-specialist - Java/Spring backends

**Database Agents**:
- @mysql-specialist - MySQL implementations
- @mongodb-specialist - MongoDB implementations
- @postgres-specialist - PostgreSQL implementations

**API Agents**:
- @graphql-specialist - GraphQL APIs
- @restful-specialist - REST APIs

**Responsibilities**:
- Generate source code
- Apply best practices
- Create tests
- Write documentation
- Follow design patterns

### 4. DevOps & QA Layer

**Purpose**: Package, test, and deploy

| Agent | Phase | Role | Key Skills |
|-------|-------|------|-----------|
| @docker-specialist | 15 | Create container configuration | containerization |
| @devops-specialist | 15 | Set up CI/CD pipelines | devops-practices |
| @qa | 16 | Create tests and quality checks | testing-framework |

**Responsibilities**:
- Create container images
- Set up CI/CD
- Create test suites
- Quality assurance
- Documentation

---

## Execution Flow

### Phase Breakdown (16 Phases)

**Phase 1-5: Orchestration**
```
Phase 1: @plan
  ↓
Phase 2: @requirements-analyzer
  ↓
Phase 3: @security-auditor
  ↓
Phase 4: @performance-optimizer
  ↓
Phase 5: @project-validator
```

**Phase 6-12: Architecture Design**
```
Phase 6-7: Conditional routing based on requirements
  → @code-architect (Phase 8)
  → @infrastructure-designer (Phase 8)
  
Phase 9: @database-modeler
  
Phase 10: @deployment-strategist
  
Phase 11-12: Integration & Planning
```

**Phase 13-14: Implementation (PARALLEL)**
```
├─ Frontend Framework Selection (Phase 13)
│  ├─ @react-specialist
│  ├─ @vue-specialist
│  ├─ @angular-specialist
│  └─ @svelte-specialist
│
├─ Backend Framework Selection (Phase 13)
│  ├─ @nodejs-specialist
│  ├─ @python-specialist
│  ├─ @go-specialist
│  └─ @java-specialist
│
├─ Database Selection (Phase 14)
│  ├─ @mysql-specialist
│  ├─ @mongodb-specialist
│  └─ @postgres-specialist
│
└─ API Layer (Phase 14)
   ├─ @graphql-specialist
   └─ @restful-specialist
```

**Phase 15-16: DevOps & QA**
```
Phase 15: @docker-specialist + @devops-specialist
  ↓
Phase 16: @qa
```

---

## Data Flow

### Input

User provides project specification:

```json
{
  "projectName": "E-commerce Platform",
  "description": "Multi-vendor marketplace",
  "frontend": "React",
  "backend": "Node.js",
  "database": "MySQL",
  "api": "REST",
  "requirements": {
    "users": ["customers", "vendors", "admins"],
    "features": ["authentication", "payments", "notifications"]
  },
  "performance": {
    "targetUsers": 100000,
    "targetLatency": "< 100ms"
  },
  "security": {
    "requirements": ["encryption", "authentication", "rate-limiting"]
  },
  "deployment": {
    "platform": "AWS",
    "scaling": "auto"
  }
}
```

### Processing

Each agent processes input through its skills:

```
Input Spec
  ↓
[Agent A] - Processes with [Skill 1] + [Skill 2]
  ↓
Output Artifact A (e.g., Requirements doc)
  ↓
[Agent B] - Uses Output A + [Skill 3] + [Skill 4]
  ↓
Output Artifact B (e.g., Architecture doc)
  ↓
[Agent C] - Uses Output B + [Skill 5]
  ↓
Final Output (e.g., Source Code)
```

### Output

Deliverables include:

```
Generated Project/
├── src/
│   ├── components/          (Frontend code)
│   ├── pages/              (Backend routes)
│   ├── models/             (Database models)
│   └── utils/              (Utilities)
├── docs/
│   ├── ARCHITECTURE.md      (Design docs)
│   ├── API.md              (API reference)
│   ├── DATABASE.md         (Schema docs)
│   └── DEPLOYMENT.md       (Deployment guide)
├── tests/
│   ├── unit/               (Unit tests)
│   ├── integration/        (Integration tests)
│   └── e2e/               (End-to-end tests)
├── .github/
│   └── workflows/          (CI/CD pipelines)
├── docker/
│   ├── Dockerfile          (Container image)
│   └── docker-compose.yml  (Local dev setup)
└── package.json            (Dependencies)
```

---

## Agent Communication

### Handoff Mechanism

Agents use explicit handoffs to pass work:

```typescript
// Agent A completes work
const output = await agentA.execute(input);

// Agent A passes to Agent B
const handoff = {
  from: 'agent-a',
  to: 'agent-b',
  artifacts: [output],
  context: { /* execution context */ },
  timestamp: Date.now()
};

// Agent B receives and continues
const result = await agentB.execute(handoff);
```

### Artifact Versioning (Option C)

Each artifact has version and metadata:

```json
{
  "artifact": {
    "id": "arch-001",
    "type": "architecture",
    "version": "2.0",
    "createdBy": "code-architect",
    "createdAt": "2026-01-13T10:00:00Z",
    "content": { /* architectural design */ },
    "metadata": {
      "dependencies": ["requirements-v1.0"],
      "status": "active"
    }
  }
}
```

### Agent Communication Protocol (Option C)

Agents communicate through structured messages:

```json
{
  "message": {
    "from": "agent-a",
    "to": ["agent-b", "agent-c"],
    "type": "handoff",
    "payload": { /* work data */ },
    "context": { /* execution context */ }
  }
}
```

### Feedback Loops (Option C)

Agents provide feedback for continuous improvement:

```json
{
  "feedback": {
    "agent": "react-specialist",
    "phase": 13,
    "quality": 0.95,
    "issues": [],
    "improvements": ["added TypeScript strict mode"],
    "timestamp": "2026-01-13T10:30:00Z"
  }
}
```

---

## Skill System

### Skill Categories

**Planning Skills** (5):
- project-planning
- requirements-analysis
- validation-framework

**Architecture Skills** (6):
- architecture-patterns
- cloud-infrastructure
- database-design
- deployment-patterns
- microservices-design

**Frontend Skills** (8):
- react-best-practices
- vue-best-practices
- angular-best-practices
- svelte-best-practices
- css-best-practices
- accessibility-best-practices
- performance-optimization-frontend

**Backend Skills** (6):
- nodejs-best-practices
- python-best-practices
- go-best-practices
- java-best-practices
- rest-api-best-practices
- graphql-best-practices

**Database Skills** (3):
- mysql-best-practices
- mongodb-best-practices
- postgres-best-practices

**DevOps Skills** (5):
- security-best-practices
- performance-best-practices
- containerization
- devops-practices
- testing-framework

### Skill Composition

Each agent uses multiple skills:

```typescript
@reactSpecialist = [
  'react-best-practices',
  'css-best-practices',
  'accessibility-best-practices',
  'performance-optimization-frontend',
  'testing-framework'
]

@nodeSpecialist = [
  'nodejs-best-practices',
  'rest-api-best-practices',
  'security-best-practices',
  'performance-best-practices',
  'testing-framework'
]
```

---

## Error Handling & Resilience

### Retry Logic

```typescript
interface RetryPolicy {
  maxRetries: number;           // Default: 3
  backoffMultiplier: number;    // Default: 2
  initialBackoffMs: number;     // Default: 1000
  timeoutMs: number;            // Default: 30000
}

// Exponential backoff:
// Attempt 1: fail
// Wait 1s, Attempt 2: fail
// Wait 2s, Attempt 3: fail
// Wait 4s, Attempt 4: success
```

### Fallback Mechanisms

```typescript
// If specialized agent fails, use generic implementation
try {
  return await specialized(input);
} catch (error) {
  logger.warn('Specialist failed, using fallback');
  return await generic(input);
}
```

### Validation Gates

Quality checks between phases:

```
Phase 1: Input validation
Phase 2-5: Specification validation
Phase 6-8: Architecture validation
Phase 9-12: Design validation
Phase 13-14: Code quality validation
Phase 15: Container/CI validation
Phase 16: Test coverage validation
```

---

## Performance Considerations

### Parallelization

**Phase 13 (Implementation)**: All agents run in parallel

```typescript
const implementations = await Promise.all([
  reactAgent.generate(),
  nodeAgent.generate(),
  mysqlAgent.generate(),
  graphqlAgent.generate()
]);
```

**Benefit**: 60-70% faster execution vs sequential

### Caching

**Artifact Caching**: Cache generated artifacts for reuse

```typescript
const cache = new Map<string, Artifact>();

// Check cache before generating
if (cache.has(spec.hash)) {
  return cache.get(spec.hash);
}

// Generate and cache
const artifact = await generate(spec);
cache.set(spec.hash, artifact);
```

### Resource Management

**Memory**: Stream large artifacts instead of loading fully

**CPU**: Distribute heavy computation across workers

**I/O**: Batch file operations where possible

---

## Security Architecture

### Input Validation

```typescript
// Validate all user inputs
const spec = validateProjectSpec(input);
const sanitized = sanitizeInput(spec);
const authenticated = verifyUser(request);
```

### Code Generation Safety

```typescript
// Generated code audited for:
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication/authorization flaws
- Hardcoded secrets
- Dependency vulnerabilities
```

### Secret Management

```json
{
  "secrets": {
    "api_keys": "use-env-vars",
    "database_passwords": "use-secrets-manager",
    "oauth_tokens": "use-oauth-flow",
    "never_hardcode": true
  }
}
```

---

## Extensibility

### Adding New Agents

**Process**:
1. Define agent in `/.github/agents/{name}.agent.md`
2. Implement in `/src/agents/{name}.ts`
3. Define skills needed
4. Configure activation conditions
5. Define handoff targets
6. Add tests
7. Update documentation

### Adding New Skills

**Process**:
1. Define skill in `/.github/skills/{name}.md`
2. Implement in `/src/skills/{name}.ts`
3. Create tests
4. Link to agents that use it
5. Document usage
6. Add examples

### Custom Agent Example

```typescript
// 1. Define
// .github/agents/@firebase-specialist.agent.md

// 2. Implement
export class FirebaseSpecialist extends BaseAgent {
  skills = [
    'firebase-realtime-db',
    'firebase-authentication',
    'firebase-hosting'
  ];
  
  async execute(input: ProjectSpec): Promise<FirebaseConfig> {
    // Implementation
  }
  
  handoffTo = ['@devops-specialist'];
}

// 3. Register
agentRegistry.register(new FirebaseSpecialist());

// 4. Activate
if (input.backend === 'Firebase') {
  await firebaseSpecialist.execute(input);
}
```

---

## Design Decisions

### Why Multi-Agent?

**Problem**: Single monolithic system can't handle diverse technologies

**Solution**: Specialized agents for each technology + domain

**Benefits**:
- Expertise focus
- Parallel execution
- Easy to extend
- Maintainability

### Why 16 Phases?

**Problem**: Complex dependencies between components

**Solution**: Ordered phases with validation gates

**Benefits**:
- Quality assurance
- Error detection early
- Clear handoff points
- Testability

### Why Option C Architecture?

**Problem**: Traditional systems lack visibility and control

**Solution**: Versioned artifacts, structured communication, feedback loops

**Benefits**:
- Full audit trail
- Agent accountability
- Continuous improvement
- Quality metrics

---

## Scalability

### Horizontal Scaling

- Run agents on different machines
- Use message queue for communication
- Load balance between agent instances

### Vertical Scaling

- Increase resources per agent
- Use caching for expensive operations
- Optimize skill implementations

### Current Limits

- Single machine: ~100 projects/day
- Distributed: Scale to 1000s/day

---

## Related Documentation

- [User Guide](USER_GUIDE.md) - How to use the system
- [Agent Development Guide](guides/AGENT_DEVELOPMENT.md) - Create new agents
- [Skill Development Guide](guides/SKILL_DEVELOPMENT.md) - Create new skills
- [System Summary](../docs/SYSTEM_SUMMARY_V2.md) - Detailed component list
- [Agent Handoff Matrix](../.github/AGENT_HANDOFF_MATRIX.md) - Complete flow diagram

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
