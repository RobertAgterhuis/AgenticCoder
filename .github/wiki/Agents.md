# Agent Reference

Complete reference for all 26 AgenticCoder agents.

---

## Overview

AgenticCoder uses specialized AI agents that work together to plan, build, and deploy full-stack applications. Each agent has specific expertise and responsibilities.

## Agent Categories

| Category | Agents | Purpose |
|----------|--------|---------|
| **Planning** | 4 agents | Requirements, estimation, design |
| **Development** | 8 agents | Frontend, backend, database, API |
| **Infrastructure** | 5 agents | Cloud, security, deployment |
| **Quality** | 5 agents | Testing, validation, review |
| **Operations** | 4 agents | Monitoring, maintenance, optimization |

---

## Planning Agents

### @planning-specialist

**Role:** Project planning and orchestration

**Triggers:**
- `@plan` command
- Project initiation
- Phase transitions

**Capabilities:**
- Analyze requirements
- Select appropriate scenario (S01-S05)
- Create project timeline
- Assign phases to agents

**Example:**
```
@plan Create a task management app with user authentication
```

---

### @requirements-analyst

**Role:** Functional requirements extraction

**Triggers:**
- Called by @planning-specialist
- Phase 1 (Input Analysis)

**Capabilities:**
- Extract functional requirements
- Identify non-functional requirements
- Create user stories
- Define acceptance criteria

**Output Files:**
- `requirements.json`
- `user-stories.md`
- `acceptance-criteria.md`

---

### @architect

**Role:** System architecture design

**Triggers:**
- Phase 2 (Architecture)
- Architecture review requests

**Capabilities:**
- Design system architecture
- Select technology stack
- Define service boundaries
- Create architecture diagrams

**Output Files:**
- `architecture.json`
- `architecture-diagram.mermaid`
- `service-definitions.yaml`

---

### @estimation-analyst

**Role:** Project estimation

**Triggers:**
- After architecture phase
- Budget/timeline questions

**Capabilities:**
- Estimate development effort
- Calculate Azure costs
- Create resource timeline
- Risk assessment

**Output Files:**
- `cost-estimate.json`
- `timeline.md`
- `risk-assessment.md`

---

## Development Agents

### @frontend-developer

**Role:** Frontend application development

**Triggers:**
- Phase 5 (Frontend Development)
- UI/UX implementation

**Capabilities:**
- React/Vue/Angular development
- Component architecture
- State management
- Responsive design
- Accessibility (WCAG)

**Technologies:**
- React 18, Vue 3, Angular 17
- TypeScript
- Tailwind CSS, Material UI
- Redux, Zustand, Pinia

---

### @backend-developer

**Role:** Backend service development

**Triggers:**
- Phase 4 (Backend Development)
- API implementation

**Capabilities:**
- REST API development
- GraphQL implementation
- Authentication/Authorization
- Business logic

**Technologies:**
- Node.js, Express, NestJS
- TypeScript
- JWT, OAuth 2.0
- OpenAPI/Swagger

---

### @database-architect

**Role:** Database design and optimization

**Triggers:**
- Phase 3 (Database Design)
- Data modeling

**Capabilities:**
- Schema design
- Query optimization
- Migration scripts
- Indexing strategy

**Technologies:**
- PostgreSQL, MySQL
- MongoDB, CosmosDB
- Redis (caching)
- Prisma, TypeORM

---

### @api-designer

**Role:** API design and documentation

**Triggers:**
- Phase 3 (API Design)
- Contract-first development

**Capabilities:**
- OpenAPI specification
- API versioning strategy
- Error handling standards
- Rate limiting design

**Output Files:**
- `openapi.yaml`
- `api-docs/`

---

### @integration-specialist

**Role:** Third-party integrations

**Triggers:**
- Payment, email, external APIs
- Phase 6 (Integrations)

**Capabilities:**
- Stripe integration
- SendGrid/Mailgun
- OAuth providers
- External API clients

---

### @realtime-specialist

**Role:** Real-time features

**Triggers:**
- WebSocket requirements
- Chat, notifications

**Capabilities:**
- WebSocket implementation
- Server-Sent Events
- Real-time sync
- Presence features

**Technologies:**
- Socket.io
- Azure SignalR
- Redis Pub/Sub

---

### @file-storage-specialist

**Role:** File handling and storage

**Triggers:**
- Upload requirements
- Media processing

**Capabilities:**
- File upload/download
- Image processing
- Cloud storage integration
- CDN configuration

**Technologies:**
- Azure Blob Storage
- Sharp (image processing)
- Azure CDN

---

### @search-specialist

**Role:** Search functionality

**Triggers:**
- Full-text search requirements
- Autocomplete features

**Capabilities:**
- Search index design
- Faceted search
- Autocomplete
- Relevance tuning

**Technologies:**
- Azure Cognitive Search
- Elasticsearch
- Full-text PostgreSQL

---

## Infrastructure Agents

### @azure-architect

**Role:** Azure infrastructure design

**Triggers:**
- Phase 9 (Infrastructure)
- Cloud architecture

**Capabilities:**
- Azure resource planning
- Cost optimization
- High availability design
- Multi-region strategies

**Output Files:**
- `main.bicep`
- `azure-architecture.md`

---

### @bicep-developer

**Role:** Infrastructure as Code

**Triggers:**
- Bicep file generation
- Resource deployment

**Capabilities:**
- Bicep template authoring
- AVM module integration
- Parameter files
- Modular templates

**Output Files:**
- `modules/*.bicep`
- `parameters/*.bicepparam`

---

### @devops-engineer

**Role:** CI/CD pipeline design

**Triggers:**
- Phase 10 (CI/CD)
- Pipeline optimization

**Capabilities:**
- GitHub Actions workflows
- Azure DevOps pipelines
- Deployment strategies
- Environment management

**Output Files:**
- `.github/workflows/*.yml`
- `azure-pipelines.yml`

---

### @security-specialist

**Role:** Security implementation

**Triggers:**
- Phase 11 (Security)
- Security review

**Capabilities:**
- Authentication flows
- Secret management
- Vulnerability scanning
- Security headers

**Technologies:**
- Azure Key Vault
- OWASP guidelines
- Dependabot
- CodeQL

---

### @networking-specialist

**Role:** Network architecture

**Triggers:**
- VNet requirements
- Private networking

**Capabilities:**
- Virtual network design
- Private endpoints
- DNS configuration
- WAF setup

**Technologies:**
- Azure VNet
- Azure Front Door
- Application Gateway

---

## Quality Agents

### @test-engineer

**Role:** Test strategy and implementation

**Triggers:**
- Phase 7 (Testing)
- Test coverage analysis

**Capabilities:**
- Unit test generation
- Integration test design
- E2E test scenarios
- Test coverage reporting

**Technologies:**
- Jest, Vitest
- Playwright, Cypress
- Supertest
- MSW (mocking)

---

### @code-reviewer

**Role:** Code quality review

**Triggers:**
- Phase 8 (Review)
- PR reviews

**Capabilities:**
- Code style analysis
- Pattern detection
- Security review
- Performance review

**Standards:**
- ESLint/Prettier
- SonarQube rules
- OWASP Top 10

---

### @performance-engineer

**Role:** Performance optimization

**Triggers:**
- Performance requirements
- Load testing

**Capabilities:**
- Load test design
- Performance profiling
- Caching strategies
- Bundle optimization

**Technologies:**
- k6, Artillery
- Lighthouse
- Bundle analyzers

---

### @accessibility-specialist

**Role:** Accessibility compliance

**Triggers:**
- WCAG requirements
- Accessibility audit

**Capabilities:**
- WCAG 2.1 compliance
- Screen reader testing
- Keyboard navigation
- Color contrast

**Tools:**
- axe-core
- WAVE
- Lighthouse a11y

---

### @documentation-specialist

**Role:** Documentation generation

**Triggers:**
- Phase 12 (Documentation)
- API docs requests

**Capabilities:**
- README generation
- API documentation
- Architecture docs
- User guides

**Output Files:**
- `README.md`
- `docs/*.md`
- `API.md`

---

## Operations Agents

### @monitoring-specialist

**Role:** Observability setup

**Triggers:**
- Phase 13 (Monitoring)
- Alert configuration

**Capabilities:**
- Application Insights setup
- Custom dashboards
- Alert rules
- Log queries

**Technologies:**
- Azure Monitor
- Application Insights
- Log Analytics

---

### @sre-engineer

**Role:** Reliability engineering

**Triggers:**
- SLA requirements
- Incident response

**Capabilities:**
- SLO/SLI definition
- Runbook creation
- Chaos engineering
- Incident playbooks

---

### @optimization-specialist

**Role:** Cost and performance optimization

**Triggers:**
- Cost review
- Resource optimization

**Capabilities:**
- Azure Advisor integration
- Reserved instance recommendations
- Right-sizing analysis
- Cost allocation

---

### @maintenance-specialist

**Role:** Ongoing maintenance

**Triggers:**
- Update requirements
- Dependency updates

**Capabilities:**
- Dependency updates
- Security patches
- Database maintenance
- Backup verification

---

## Agent Communication

### How Agents Collaborate

```
┌─────────────┐
│  @planning  │
│ specialist  │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ @requirements│
│   analyst    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  @architect  │
└──────┬───────┘
       │
       ├─────────────┬─────────────┐
       ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ @frontend│  │ @backend │  │ @database│
│developer │  │developer │  │ architect│
└──────────┘  └──────────┘  └──────────┘
```

### Handoff Protocol

Agents communicate via structured handoffs:

```json
{
  "from": "@architect",
  "to": "@frontend-developer",
  "phase": 5,
  "context": {
    "architecture": "...",
    "techStack": "react-typescript",
    "requirements": [...]
  }
}
```

---

## Custom Agents

### Creating Custom Agents

You can create custom agents in `.github/agents/`:

```markdown
# @custom-agent.agent.md

## Role
Your custom agent description

## Triggers
- @custom command
- specific phase

## Capabilities
- capability 1
- capability 2

## Technologies
- tech 1
- tech 2
```

### Agent Skills

Extend agents with skills in `.github/skills/`:

```markdown
# custom-pattern.skill.md

## Pattern Name
Description of the pattern

## When to Apply
Conditions for using this pattern

## Implementation
Code templates and examples
```

---

<p align="center">
  <a href="Architecture">← Architecture</a> | <a href="API-Reference">API Reference →</a>
</p>
