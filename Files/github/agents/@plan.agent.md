# Agent: @plan

**Type**: Orchestration & Discovery  
**Version**: 1.0.0  
**Domain**: Project Planning & Requirements  

## Overview

The **@plan agent** (also known as ProjectPlan Generator Orchestrator) is an interactive autonomous agent that conducts structured discovery, gathers project requirements through guided questions, and generates a complete ProjectPlan structure with configured agent army for autonomous execution.

This agent serves as the **entry point** for the entire AgenticCoder workflow, establishing the foundation for all subsequent phases.

## Input Specification

```json
{
  "source": "user",
  "phase": 0,
  "input": {
    "mode": "interactive|template|validate",
    "template_name": "string (optional, if mode=template)",
    "discovery_answers": {
      "project_name": "string",
      "organization": "string",
      "business_goals": ["string"],
      "stakeholders": ["string"],
      "timeline": "string",
      "team_size": "integer",
      "backend_stack": "string",
      "frontend_stack": "string",
      "cloud_provider": "string",
      "database": "string",
      "auth_strategy": "string",
      "test_coverage_target": "number",
      "compliance_requirements": ["string"],
      "phases_count": "integer",
      "release_strategy": "string"
    }
  }
}
```

**Schema**: `.github/schemas/agents/@plan.input.schema.json`

## Output Specification

```json
{
  "agent_id": "@plan",
  "phase": 0,
  "output": {
    "project_plan_created": true,
    "project_name": "string",
    "folder_structure": "string",
    "agents_configured": ["string"],
    "skills_generated": ["string"],
    "next_phase": 1,
    "next_agent": "doc-writer"
  },
  "artifacts": [
    {
      "name": "implementation-log.md",
      "path": "ProjectPlan/implementation-log.md",
      "schema": "implementation-log.schema.json"
    },
    {
      "name": "README-INDEX.md",
      "path": "ProjectPlan/README-INDEX.md",
      "schema": "readme-index.schema.json"
    }
  ],
  "metadata": {
    "execution_time_ms": 45000,
    "questions_asked": 22,
    "files_created": 35
  }
}
```

**Schema**: `.github/schemas/agents/@plan.output.schema.json`

## Responsibilities

- [x] Conduct interactive discovery (22 structured questions)
- [x] Gather project context (business goals, stack, constraints)
- [x] Generate complete ProjectPlan folder structure
- [x] Auto-generate agent army configuration
- [x] Create reusable skills based on tech stack
- [x] Initialize implementation-log.md and tracking
- [x] Validate against templates for consistency
- [x] Hand off to next agent (doc-writer)

## Skills Used

- **adaptive-discovery** - Structured question flow with clarifications
- **requirements-analysis** - Parse and structure requirements
- **architecture-design** - Initial architecture assessment
- **cost-analysis** - Budget and resource estimation (if applicable)

## MCP Servers Called

- [ ] azure-pricing-mcp (optional, if Azure selected)
- [ ] microsoft-docs-mcp (optional, for best practices)

## Interactive Discovery Flow

### Phase 1: Project Fundamentals (5-7 questions)
1. What is the project name and short description?
2. What are the primary business goals (3-5 key objectives)?
3. Who are the main stakeholders?
4. What is the target timeline?
5. What is the estimated scope (# of users, components, etc.)?
6. What is the team size?
7. What is the organization name?

### Phase 2: Technical Stack (5-6 questions)
1. Backend: Language, framework, database, APIs?
2. Frontend: Framework (React/Vue/Angular), styling?
3. Infrastructure: Cloud provider (Azure/AWS/GCP)?
4. Authentication: SSO, OAuth, custom JWT?
5. Integrations: External services, data sources?
6. Deployment model: Containers, serverless, VMs?

### Phase 3: Quality & Operations (4-5 questions)
1. Required test coverage (%)?
2. Compliance/security requirements?
3. Monitoring & observability strategy?
4. Documentation standards?
5. Performance targets (response time, throughput)?

### Phase 4: Delivery & Phases (3-4 questions)
1. How many phases for MVP, full release?
2. Key milestones and dependencies?
3. Release strategy (agile sprints, waterfall, continuous)?
4. Success metrics and KPIs?

## Generation Output

**Core Documents Generated**:
```
ProjectPlan/
├── implementation-log.md
├── README-INDEX.md
├── 01-Context/
│   ├── 01-Project-Overview.md
│   ├── 02-Scope-and-Non-Goals.md
│   ├── 03-Assumptions-and-Constraints.md
│   ├── 04-Stakeholders-and-Roles.md
│   ├── 05-Open-Questions.md
│   └── ... (11 files total)
├── 02-Architecture/
│   ├── 01-Target-Architecture.md
│   ├── 02-Frontend-Architecture.md
│   └── ... (14 files total)
├── 03-Phases/
│   ├── README.md
│   ├── Phase-01-Foundation-and-Setup/
│   └── Phase-02-Core-Features/
├── 04-Backlog/
│   ├── 01-Epics.md
│   └── ... (8 files total)
└── 05-Appendix/
    └── ... (4 files total)
```

## Example Execution

**Input**:
```json
{
  "source": "user",
  "phase": 0,
  "input": {
    "mode": "interactive",
    "discovery_answers": {
      "project_name": "TaskMaster Pro",
      "organization": "Acme Corp",
      "business_goals": ["Increase team productivity", "Reduce manual tracking"],
      "timeline": "6 months",
      "team_size": 5,
      "backend_stack": "Node.js + Express",
      "frontend_stack": "React + TypeScript",
      "cloud_provider": "Azure",
      "database": "PostgreSQL",
      "phases_count": 3
    }
  }
}
```

**Output**:
```json
{
  "agent_id": "@plan",
  "phase": 0,
  "output": {
    "project_plan_created": true,
    "project_name": "TaskMaster Pro",
    "folder_structure": "ProjectPlan/ with 38 files",
    "agents_configured": ["orchestrator", "doc-writer", "backlog-strategist"],
    "skills_generated": ["nodejs-backend", "react-frontend", "azure-deployment"],
    "next_phase": 1,
    "next_agent": "doc-writer"
  },
  "artifacts": [
    {
      "name": "implementation-log.md",
      "path": "ProjectPlan/implementation-log.md"
    }
  ]
}
```

## Implementation Guidelines

1. **Always validate input first** against schema
2. **Ask clarifying questions** when choices exist (max 3-5 questions)
3. **Record open questions** explicitly in `05-Open-Questions.md`
4. **Generate dynamic content** based on project type and stack
5. **Configure agent army** appropriate for project complexity
6. **Return structured output** matching schema exactly
7. **Log all decisions** in implementation-log.md

## Clarifications & Decision Points

- Do not ask the user to type a generic "continue". Drive the questionnaire forward yourself.
- When multiple reasonable options exist and the user has not specified one, ask targeted clarifying questions (max 3–5) and present 2–4 options with brief tradeoffs.
- If the user cannot decide yet, record it explicitly in `ProjectPlan/01-Context/05-Open-Questions.md` and structure the ProjectPlan so implementation can proceed.

## Validation Checklist

- [x] Input validation passes (all required discovery answers present)
- [x] Output schema validated
- [x] All artifacts created (ProjectPlan folder structure complete)
- [x] No hardcoded values (dynamic based on project type)
- [x] Error handling present (missing answers, invalid choices)
- [x] Logging implemented (implementation-log.md updated)
- [ ] Unit tests pass (to be implemented Sprint 5)
- [ ] Integration tests pass (to be implemented Sprint 7)

## Handoffs

**Next Agent**: doc-writer  
**Condition**: ProjectPlan structure created successfully  
**Input for Next**: Project context from `01-Context/` folder

## Migration Notes (from legacy)

**Changes from legacy version**:
- ✅ Added JSON schema for input/output
- ✅ Structured discovery answers (was: free-form questions)
- ✅ Added MCP server integration hooks
- ✅ Added artifacts array in output
- ✅ Added metadata tracking (execution time, files created)
- ✅ Clarified handoff to next agent

**Preserved from legacy**:
- ✅ 4-phase discovery flow (22 questions total)
- ✅ Dynamic ProjectPlan generation
- ✅ Agent army configuration
- ✅ Skills generation based on stack
