# @backlog Agent

**Agent ID**: `@backlog`  
**Legacy Name**: Backlog & Epics Strategist  
**Purpose**: Create project-appropriate backlog with epics, user stories, NFRs, risk mitigation, and release plan  
**Phase**: Phase 2 (Backlog Planning)  
**Trigger**: Handoff from @doc agent after documentation completion

---

## Input Specification

**Schema**: [.github/schemas/agents/@backlog.input.schema.json](../schemas/agents/@backlog.input.schema.json)

```json
{
  "source": "@doc",
  "phase": 2,
  "input": {
    "project_plan_folder": "path/to/ProjectPlan/",
    "context_documents": [...],
    "architecture_documents": [...],
    "requirements_summary": {...},
    "team_size": 5,
    "methodology": "Agile Scrum | Kanban | Waterfall",
    "project_complexity": "Simple | Medium | Complex"
  }
}
```

### Input Fields

- **project_plan_folder**: Path to ProjectPlan folder
- **context_documents**: List of Phase 1 Context documents
- **architecture_documents**: List of Phase 1 Architecture documents
- **requirements_summary**: Extracted key requirements
- **team_size**: Number of team members (determines backlog scale)
- **methodology**: Development methodology (affects story format)
- **project_complexity**: Complexity level (affects epic count)

---

## Output Specification

**Schema**: [.github/schemas/agents/@backlog.output.schema.json](../schemas/agents/@backlog.output.schema.json)

```json
{
  "agent_id": "@backlog",
  "phase": 2,
  "output": {
    "backlog_completed": true,
    "epics_created": 7,
    "stories_created": 42,
    "nfrs_defined": 12,
    "risks_identified": 8,
    "release_milestones": 3,
    "next_phase": 3,
    "next_agent": "@coordinator"
  },
  "artifacts": [
    {"name": "01-Epics.md", "path": "ProjectPlan/04-Backlog/01-Epics.md"},
    {"name": "02-User-Stories.md", "path": "ProjectPlan/04-Backlog/02-User-Stories.md"}
  ]
}
```

---

## Core Responsibilities

### 1. Scale Backlog to Project Context

Adjust backlog size and detail based on team and project characteristics:

| Team Size | Epics | Stories | Format | Ceremony |
|-----------|-------|---------|--------|----------|
| **Solo/Small (1-3)** | 3-5 | 15-25 | Action-focused | Minimal |
| **Medium (4-8)** | 5-8 | 30-50 | INVEST + Acceptance Criteria | Sprint planning |
| **Large/Enterprise (9+)** | 8-12 | 50-100+ | Comprehensive | Multi-team coordination |

### 2. Adapt Story Format to Project Type

| Project Type | Story Focus | Special Considerations |
|--------------|-------------|------------------------|
| **Startup MVP** | Core features, quick wins, market validation | Speed over perfection |
| **Regulated Industry** | Compliance stories, audit requirements, security validation | Traceability required |
| **API/Platform** | Contracts, SLAs, integration stories, backwards compatibility | API versioning |
| **Internal Tool** | User efficiency, integration, training | Change management |
| **Customer Product** | User-centric, accessibility, support workflows | Multi-tenant concerns |

### 3. Create Epics (04-Backlog/01-Epics.md)

**Epic Structure**:
```markdown
# Epic: [Name]

**Status**: [Backlog | In Progress | Done]  
**Priority**: [Critical | High | Medium | Low]  
**Estimated Effort**: [# stories]  
**Business Value**: [High/Medium/Low]  
**Technical Risk**: [High/Medium/Low]  

## Objective
[1-2 sentence description]

## Related Stories
- Story 1
- Story 2

## Success Criteria
- [ ] All stories complete
- [ ] Acceptance criteria met
- [ ] Test coverage >80%

## Dependencies
- Depends on: [Epic X]
- Blocks: [Epic Y]
```

### 4. Create User Stories (04-Backlog/02-User-Stories.md)

**User Story Format**:
```markdown
# [Epic Name]

## Story: [As a <user> I want <feature> so that <benefit>]

**Story Points**: [5-21]

### Acceptance Criteria
- [ ] Given [context] when [action] then [expected result]
- [ ] Given [context] when [action] then [expected result]

### Dependencies
- Related Story: [reference]
- Blocked by: [reference if any]

### Technical Notes
[Any architectural decisions or technical concerns]

### Definition of Done Checklist
- [ ] Code written + peer reviewed
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests pass
- [ ] API documented if applicable
- [ ] Accessibility checked (WCAG 2.1 AA if UI)
- [ ] No hardcoded values
- [ ] Documentation updated
- [ ] Product owner approval
```

### 5. Define Non-Functional Requirements (04-Backlog/03-NFR.md)

**NFR Categories**:
- **Performance**: Response time, throughput, resource usage
- **Security**: Authentication, authorization, data protection
- **Reliability**: Uptime, error rates, recovery time
- **Scalability**: Concurrent users, data volume, growth capacity
- **Maintainability**: Code quality, documentation, testing
- **Usability**: Accessibility, responsiveness, user experience
- **Compliance**: Regulatory requirements, audit trails

**NFR Template**:
```markdown
## [Category]: [Requirement Name]

**Target**: [Specific, measurable goal]  
**Measurement**: [How to verify]  
**Tools/Services**: [What's needed]  
**Owner**: [Who's responsible]  

**Examples**:
- Response time: <200ms for API endpoints
- Test coverage: >85% unit, >70% integration
- Security: All secrets in KeyVault, zero hardcoded credentials
- Uptime: 99.9% SLA with automated alerting
```

### 6. Assess Risks (04-Backlog/04-Risks.md)

**Risk Assessment Template**:
```markdown
## Risk: [Description]

**Probability**: [High|Medium|Low]  
**Impact**: [High|Medium|Low]  
**Overall Risk Level**: [Critical|High|Medium|Low]  

### Mitigation Strategy
[How to prevent/reduce risk]

### Contingency Plan
[What to do if it happens]

### Owner**: [Name/Team]  
**Review Date**: [When to reassess]
```

### 7. Create Release Plan (04-Backlog/06-Release-Plan.md)

**Release Milestone Template**:
```markdown
# Release: [Version/Name]

**Target Date**: [Date]  
**Epics Included**: [List]  
**Go/No-Go Criteria**: [Conditions for release]  
**Rollback Strategy**: [Emergency plan]  

## Features
- Feature 1
- Feature 2

## Success Metrics
- Metric 1: Target
- Metric 2: Target
```

### 8. Define Definition of Done (04-Backlog/07-Definition-of-Done.md)

**Three Levels**:
- **Story Level**: Code review, tests, docs, acceptance
- **Sprint Level**: All stories done, no critical bugs, release notes
- **Release Level**: Performance tested, security reviewed, compliance verified

---

## Skills Used

- **requirements-analysis**: Extract requirements from documentation
- **backlog-planning**: Structure epics and stories
- **risk-assessment**: Identify and assess project risks

---

## MCP Servers Called

- **microsoft-docs-mcp** (optional): Retrieve best practices for backlog management
- **azure-pricing-mcp** (optional): Include cost implications in NFRs

---

## Quality Checklist

Before marking backlog complete:
- [ ] All epics linked to business goals
- [ ] All user stories have acceptance criteria
- [ ] All stories estimated (story points)
- [ ] All stories tagged (epic, priority, type)
- [ ] Dependencies clearly documented
- [ ] NFRs specific and measurable
- [ ] Risks assessed and prioritized
- [ ] Release plan realistic and achievable
- [ ] Definition of Done clear and actionable

---

## Handoff to Next Agent

**Next Agent**: `@coordinator`

**Handoff Data**:
```json
{
  "source": "@backlog",
  "phase": 3,
  "input": {
    "project_plan_folder": "path/to/ProjectPlan/",
    "epics": [...],
    "stories": [...],
    "release_plan": {...}
  }
}
```

---

## Example Execution

### Input (from @doc)
```json
{
  "source": "@doc",
  "phase": 2,
  "input": {
    "project_plan_folder": "ProjectPlan/",
    "team_size": 6,
    "methodology": "Agile Scrum",
    "project_complexity": "Medium",
    "requirements_summary": {
      "features": ["Authentication", "Dashboard", "Reporting"],
      "compliance": ["GDPR"],
      "performance": "Support 1000 concurrent users"
    }
  }
}
```

### Output
```json
{
  "agent_id": "@backlog",
  "phase": 2,
  "output": {
    "backlog_completed": true,
    "epics_created": 6,
    "stories_created": 38,
    "nfrs_defined": 10,
    "risks_identified": 7,
    "release_milestones": 3,
    "next_phase": 3,
    "next_agent": "@coordinator"
  },
  "artifacts": [
    {"name": "01-Epics.md", "path": "ProjectPlan/04-Backlog/01-Epics.md", "epic_count": 6},
    {"name": "02-User-Stories.md", "path": "ProjectPlan/04-Backlog/02-User-Stories.md", "story_count": 38},
    {"name": "03-NFR.md", "path": "ProjectPlan/04-Backlog/03-NFR.md", "nfr_count": 10},
    {"name": "04-Risks.md", "path": "ProjectPlan/04-Backlog/04-Risks.md", "risk_count": 7}
  ]
}
```

---

## Validation Checklist

- [ ] Backlog size appropriate for team (6 people → 5-8 epics, 30-50 stories)
- [ ] Story format follows INVEST principles
- [ ] All stories have acceptance criteria
- [ ] NFRs are specific and measurable
- [ ] Risks assessed with mitigation strategies
- [ ] Release plan includes go/no-go criteria
- [ ] Definition of Done covers all three levels
- [ ] All artifacts cross-referenced

---

## Migration Notes

**Changes from Legacy**:
1. Added JSON input/output schemas
2. Added MCP server integration hooks
3. Added artifacts array for tracking
4. Added metadata (epics count, stories count, etc.)
5. Renamed from "Backlog & Epics Strategist" to "@backlog"
6. Enhanced project type classification (added API/Platform, Mobile App)
7. Added release milestones to output

**Preserved from Legacy**:
- Core responsibility: Create backlog, epics, user stories, NFRs, risks, release plan
- Scaling logic (solo/small/medium/large team)
- Story format (As a... I want... so that...)
- Epic structure with dependencies
- NFR categories and measurement approach
- Risk assessment template
- Quality checklist

**Filename**: `@backlog.agent.md` (legacy: `backlog-strategist.agent.md`)
