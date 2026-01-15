# Full-Stack Implementation Blueprint

**Architecture & Integration Guide for Technology-Specific Agents**

**Version**: 1.0  
**Date**: January 13, 2026  
**Phase**: Blueprint (Pre-Implementation)

---

## 1. Architecture Overview

### Current System (Prio 1-10)

```
Phase 0-5: Discovery Chain (Sequential)
├─ @plan           → Generate phase-based plan
├─ @doc            → Analyze existing documentation
├─ @backlog        → Create prioritized backlog
├─ @coordinator    → Coordinate team structure
├─ @qa             → Define QA framework
└─ @reporter       → Generate progress reports

Phase 6-12: Specialist Chain (Parallel)
├─ @architect                → Architecture decisions
├─ @code-architect           → Code architecture
├─ @azure-architect          → Azure infrastructure
├─ @bicep-specialist         → Bicep modules
├─ @frontend-specialist      → Frontend design (GENERIC)
├─ @backend-specialist       → Backend design (GENERIC)
└─ @devops-specialist        → DevOps setup (GENERIC)
```

**Problem**: Specialists 6-12 are **technology-agnostic**. They can plan but cannot implement.

### Proposed System (With Technology Layer)

```
Phase 0-5: Discovery Chain (Sequential)
└─ [UNCHANGED] - Same 6 agents

Phase 6-12: Generic Specialist Chain (Parallel)
├─ @architect                → Architecture decisions
├─ @code-architect           → Code architecture
├─ @azure-architect          → Azure infrastructure
├─ @bicep-specialist         → Bicep modules
├─ @frontend-specialist      → Frontend orchestrator (NOW ORCHESTRATOR)
├─ @backend-specialist       → Backend orchestrator (NOW ORCHESTRATOR)
└─ @devops-specialist        → DevOps orchestrator (NOW ORCHESTRATOR)

Phase 13-16: TECHNOLOGY-SPECIFIC Implementation (Conditional/Parallel)
├─ @frontend-specialist branches to:
│  ├─ @react-specialist       → React components, hooks, state
│  ├─ @nextjs-specialist      → Next.js pages, SSR/SSG
│  └─ (Vue, Angular specialists - Phase 2)
│
├─ @backend-specialist branches to:
│  ├─ @dotnet-specialist      → .NET Core APIs, EF Core
│  ├─ @nodejs-specialist      → Express APIs, Prisma
│  └─ (Python, Java - Phase 2)
│
└─ @devops-specialist branches to:
   ├─ @azure-devops-specialist → Azure Pipelines YAML
   ├─ @github-actions-specialist → GitHub Actions workflows
   └─ (Jenkins, GitLab - Phase 2)
```

### Integration Points

**Technology Decision Flow**:

```
User Input / Artifact: Tech Stack Selection
    ↓
@code-architect: "Frontend: React, Backend: .NET, CI/CD: Azure DevOps"
    ↓
@frontend-specialist: Receives tech stack context
    ├─ Detects "React" from tech stack
    ├─ Invokes: @react-specialist for implementation
    └─ Returns: React component specifications
    ↓
@backend-specialist: Receives tech stack context
    ├─ Detects ".NET" from tech stack
    ├─ Invokes: @dotnet-specialist for implementation
    └─ Returns: .NET controller specifications
    ↓
@devops-specialist: Receives tech stack context
    ├─ Detects "Azure DevOps" from tech stack
    ├─ Invokes: @azure-devops-specialist for implementation
    └─ Returns: Azure Pipelines YAML
```

---

## 2. Agent Integration Model

### Model A: Orchestrator Pattern (RECOMMENDED)

**Generic Specialist = Orchestrator**

```
@frontend-specialist (Orchestrator)
  Input: 
    - Project requirements
    - Tech stack (React, Vue, Angular)
    - Design specifications
  
  Decision: Which technology specialist?
    - If React → handoff to @react-specialist
    - If Vue → handoff to @vue-specialist
    - If Angular → handoff to @angular-specialist
  
  Output: 
    - Component specifications
    - Integration requirements
    - Deployment artifacts
```

**Pros**:
- ✅ Maintains existing agent chain structure
- ✅ Clear separation of concerns
- ✅ Easy to add new technologies (extend via handoff)
- ✅ Existing orchestration logic unchanged

**Cons**:
- ❌ Requires LLM to handle handoff decisions
- ❌ More agent-to-agent interactions
- ⚠️ Needs handoff protocol documentation

### Model B: Direct Specialist Routing

**Generic Specialist = Direct Implementer**

Skip orchestrator, route directly to technology specialist based on tech stack.

```
Tech Stack Analysis → { React, .NET, Azure DevOps }
         ↓
Direct Route to:
  - @react-specialist (skip @frontend-specialist)
  - @dotnet-specialist (skip @backend-specialist)
  - @azure-devops-specialist (skip @devops-specialist)
```

**Pros**:
- ✅ Fewer agent hops
- ✅ Direct technology expertise
- ✅ Simpler routing logic

**Cons**:
- ❌ Breaks existing orchestration chain
- ❌ Loses generic specialist context
- ❌ Harder to maintain backward compatibility

### Model C: Capability-Based Routing (ALTERNATIVE)

**Extend generic specialists with technology-specific capabilities**

Generic specialist inherits tech-specific skills:

```
@frontend-specialist:
  - Generic skills: component planning, wireframing
  - + React skills: hooks, context, performance
  - + Vue skills: composition API, Pinia
  - + Angular skills: RxJS, NgRx
```

**Pros**:
- ✅ Single agent provides all capabilities
- ✅ Simpler architecture
- ✅ No handoff overhead

**Cons**:
- ❌ Single agent becomes very complex
- ❌ Requires larger context window
- ❌ Harder to maintain and update

---

## 3. Handoff Protocol (For Orchestrator Model)

### Orchestrator → Technology Specialist Handoff

**Trigger Conditions**:
```
When @frontend-specialist detects:
1. Tech stack specifies React
2. Project scope requires component implementation
3. Detail level = "implementation" (not "architecture")
```

**Handoff Message Structure**:
```json
{
  "source_agent": "@frontend-specialist",
  "target_agent": "@react-specialist",
  "context": {
    "project_id": "proj-001",
    "phase": 7,
    "components_needed": [
      {
        "name": "UserProfile",
        "type": "class-based",
        "dependencies": ["Redux", "React Router"],
        "complexity": "medium"
      }
    ],
    "styling": "Tailwind CSS",
    "testing_framework": "Jest",
    "performance_requirements": ["SSR compatible", "< 500KB bundle"]
  },
  "artifacts_to_generate": [
    "react-components.artifact",
    "custom-hooks.artifact",
    "context-providers.artifact"
  ],
  "expected_output": {
    "schema": "phase-7-frontend-components.schema.json",
    "format": "artifact",
    "validation": "strict"
  }
}
```

**Response Handoff** (Technology Specialist → Orchestrator):
```json
{
  "source_agent": "@react-specialist",
  "target_agent": "@frontend-specialist",
  "status": "complete",
  "output": {
    "artifact_id": "artifact-react-comp-001",
    "components_generated": 6,
    "validation_status": "passed",
    "implementation_ready": true
  },
  "next_phase": "testing",
  "recommendations": [
    "Add React Query for state management",
    "Implement error boundaries",
    "Add Storybook for documentation"
  ]
}
```

---

## 4. Technology Stack Detection

### Tech Stack Source (Priority Order)

1. **User Input** (Explicit selection)
   - "Use React + .NET + Azure DevOps"
   - Highest priority

2. **Project Analysis** (@code-architect decision)
   - "Based on requirements, recommend React"
   - Medium priority

3. **Artifact Detection** (Existing codebase)
   - "Found package.json → Node.js, React"
   - Medium priority

4. **Default Selection** (Fallback)
   - React, Node.js, GitHub Actions
   - Lowest priority

### Tech Stack Storage & Propagation

**Artifact: `tech-stack-decision.artifact.json`**

```json
{
  "artifact_type": "tech-stack-decision",
  "phase": 6,
  "decisions": {
    "frontend": {
      "framework": "React",
      "version": "18.x",
      "build_tool": "Vite",
      "styling": "Tailwind CSS",
      "state_management": "Redux Toolkit",
      "testing": "Jest + React Testing Library"
    },
    "backend": {
      "language": ".NET",
      "framework": "ASP.NET Core",
      "version": "8.0",
      "orm": "Entity Framework Core",
      "api_style": "REST",
      "testing": "xUnit"
    },
    "database": {
      "system": "SQL Server",
      "hosting": "Azure SQL Database"
    },
    "deployment": {
      "platform": "Azure",
      "containerization": "Docker",
      "orchestration": "App Service"
    },
    "ci_cd": {
      "platform": "Azure DevOps",
      "pipeline_trigger": "Pull Request"
    }
  },
  "rationale": "Selected for enterprise scalability and team expertise",
  "alternatives_considered": ["Node.js + MongoDB", "Vue.js + Python"],
  "timestamp": "2026-01-13T10:00:00Z"
}
```

**Propagation**: This artifact is passed through Phase 13-16 agents as context for technology decisions.

---

## 5. New Agent Interaction Map

### Phase Execution with Technology Agents

```
Existing Phase 0-5 (Sequential)
│
├─ Phase 0: @plan
│   ├─ Input: Requirements
│   └─ Output: Phase plan
│
├─ Phase 1: @doc
│   └─ Output: Existing docs analysis
│
├─ Phase 2: @backlog
│   └─ Output: Prioritized backlog
│
├─ Phase 3: @coordinator
│   └─ Output: Team structure
│
├─ Phase 4: @qa
│   └─ Output: QA framework
│
├─ Phase 5: @reporter (START OF CYCLE)
│   └─ Output: Initial report
│
Existing Phase 6-12 (Parallel)
│
├─ Phase 6: @architect
│   └─ Output: Architecture decisions
│
├─ Phase 7: @code-architect
│   ├─ Output: Code architecture
│   └─ GENERATES: tech-stack-decision.artifact
│
├─ Phase 8: @azure-architect
│   └─ Output: Azure infrastructure
│
├─ Phase 9: @bicep-specialist
│   └─ Output: Bicep modules
│
├─ Phase 10: @frontend-specialist (ORCHESTRATOR)
│   ├─ Receives: tech-stack-decision artifact
│   ├─ Decision: Invoke @react-specialist
│   └─ Handoff → Phase 13
│
├─ Phase 11: @backend-specialist (ORCHESTRATOR)
│   ├─ Receives: tech-stack-decision artifact
│   ├─ Decision: Invoke @dotnet-specialist
│   └─ Handoff → Phase 14
│
└─ Phase 12: @devops-specialist (ORCHESTRATOR)
    ├─ Receives: tech-stack-decision artifact
    ├─ Decision: Invoke @azure-devops-specialist
    └─ Handoff → Phase 15

NEW Phase 13-16 (Conditional/Parallel)
│
├─ Phase 13: TECHNOLOGY-SPECIFIC FRONTEND
│   ├─ @react-specialist
│   │  ├─ Input: Component requirements + React context
│   │  └─ Output: React components, hooks, context
│   │
│   ├─ @nextjs-specialist (alternative)
│   │  └─ Output: Next.js pages, API routes, layouts
│   │
│   └─ @vue-specialist, @angular-specialist (Phase 2)
│
├─ Phase 14: TECHNOLOGY-SPECIFIC BACKEND
│   ├─ @dotnet-specialist
│   │  ├─ Input: API requirements + .NET context
│   │  └─ Output: Controllers, services, migrations
│   │
│   ├─ @nodejs-specialist (alternative)
│   │  └─ Output: Express routes, services, models
│   │
│   └─ @python-specialist (Phase 2)
│
├─ Phase 15: TECHNOLOGY-SPECIFIC DATABASE
│   ├─ @database-specialist
│   │  ├─ Input: Data model + DB context
│   │  └─ Output: SQL schemas, stored procs
│   │
│   └─ Invoked from @backend-specialist
│
└─ Phase 16: TECHNOLOGY-SPECIFIC CI/CD
    ├─ @azure-devops-specialist
    │  ├─ Input: Deployment requirements
    │  └─ Output: Azure Pipelines YAML
    │
    ├─ @github-actions-specialist (alternative)
    │  └─ Output: GitHub Actions workflows
    │
    └─ @jenkins-specialist (Phase 2)

Phase 17: @reporter (END OF CYCLE)
└─ Output: Final implementation report
```

---

## 6. Schema & Artifact Changes

### New Agent Input/Output Schemas

**Each new agent needs 2 schemas**:

1. **Input Schema**: What it receives
   - Example: `react-specialist.input.schema.json`
   - Defines: Component requirements, dependencies, constraints

2. **Output Schema**: What it generates
   - Example: `react-specialist.output.schema.json`
   - Defines: React component structure, hook patterns, testing code

### New Artifact Schemas

**Technology-specific artifact types**:

- `react-components.artifact.schema.json` - React component generation output
- `dotnet-controllers.artifact.schema.json` - .NET API controller output
- `sql-schema.artifact.schema.json` - Database DDL output
- `azure-pipeline.artifact.schema.json` - Azure DevOps YAML output
- `github-workflow.artifact.schema.json` - GitHub Actions YAML output
- `next-pages.artifact.schema.json` - Next.js pages/layouts output
- `unit-tests.artifact.schema.json` - Generated unit test files

### Skill Input/Output Schemas

**Each new skill needs 2 schemas**:

- `react-patterns.input.schema.json` / `.output.schema.json`
- `dotnet-webapi.input.schema.json` / `.output.schema.json`
- Etc. (15 new skills, 30 new schemas)

---

## 7. Implementation Sequence

### Phase 1: Critical Infrastructure (Week 1-2)

**Step 1**: Create @react-specialist agent specification

**Step 2**: Create @dotnet-specialist agent specification

**Step 3**: Create @database-specialist agent specification

**Step 4**: Create @azure-devops-specialist agent specification

### Phase 1b: Schema Layer (Week 2)

**Step 5**: Create all input/output schemas for 4 agents (8 schemas)

**Step 6**: Create artifact schemas for technology outputs (7 schemas)

### Phase 1c: Skills Layer (Week 3)

**Step 7**: Create 4-6 technology-specific skills

**Step 8**: Create skill input/output schemas (8-12 schemas)

### Phase 1d: Validation (Week 4)

**Step 9**: Create test scenarios with generated code

**Step 10**: Validate end-to-end integration

**Step 11**: Update orchestration logic for handoffs

---

## 8. Backward Compatibility

### Current Tests Still Work

**S01-S05 scenarios**:
- ✅ Still execute Phase 0-12 exactly as before
- ✅ Generic specialists still function (unchanged)
- ✅ Tech-specific Phase 13-16 optional (opt-in)

### Migration Path

**For new projects**:
1. Execute Phase 0-12 (generic architecture) - UNCHANGED
2. At Phase 6-12, include tech stack decision
3. Phase 13-16 automatically invokes technology specialists

**For existing projects**:
1. Continue using Phase 0-12 generically
2. Optionally add tech-specific agents when needed
3. No breaking changes to existing workflows

---

## 9. Dependencies & Requirements

### LLM Context Window

**Minimum required**:
- Generic agent context: ~8K tokens
- Technology specialist context: ~12K tokens  
- Total with handoff: ~20K tokens
- **Requirement**: 100K+ context window preferred

### Agent Prompt Engineering

**New considerations**:
- Technology-specific instruction sets
- Code generation quality assurance
- Output validation against schemas
- Framework/library version management

### Validation Framework

**New validations needed**:
- Generated React code passes ESLint
- Generated .NET code passes C# formatter
- Generated SQL passes syntax validation
- Generated YAML is valid Azure DevOps format

---

## 10. Success Criteria

### Phase 1 Complete When

- ✅ All 4 agents have specifications (A_SPEC template)
- ✅ All 8 agent schemas created and validated
- ✅ All 15 artifact schemas created and validated
- ✅ All 4-6 skills specified and schemas created
- ✅ S01-S05 test scenarios updated with tech-specific outputs
- ✅ Integration tests pass (end-to-end handoffs)
- ✅ Generated code quality acceptable (>80% linting pass)
- ✅ Backward compatibility verified (old tests still pass)

### Coverage Increase

- Before: ~50% automation coverage
- After Phase 1: ~80% automation coverage
- After Phase 2-3: 90%+ automation coverage

---

## 11. Document References

**Related Documents**:
- `FULLSTACK_GAP_ANALYSIS.md` - Gap analysis and recommendations
- `B_AGENT_SPECIFICATIONS.md` - Detailed specs for 4 Phase 1 agents
- `C_SCHEMA_DEFINITIONS.md` - Complete schema definitions
- `D_INTEGRATION_EXAMPLES.md` - Concrete examples and flows

---

**Status**: READY FOR AGENT SPECIFICATION PHASE

**Next Document**: B_AGENT_SPECIFICATIONS.md (Detailed agent specs)
