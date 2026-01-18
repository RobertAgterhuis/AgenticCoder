# Phase Workflow

Complete reference of the 16-phase workflow in AgenticCoder.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      PLANNING PHASES (1-5)                       │
├─────────────────────────────────────────────────────────────────┤
│ Phase 1: Requirements   │ Phase 2: Documentation                │
│ Phase 3: Backlog        │ Phase 4: Architecture                 │
│ Phase 5: Code Architecture                                      │
├─────────────────────────────────────────────────────────────────┤
│                     DESIGN PHASES (6-8)                          │
├─────────────────────────────────────────────────────────────────┤
│ Phase 6: ADR Generation │ Phase 7: Diagram Generation           │
│ Phase 8: Architecture Review                                     │
├─────────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE PHASES (9-12)                    │
├─────────────────────────────────────────────────────────────────┤
│ Phase 9: Azure Architecture  │ Phase 10: Bicep Planning         │
│ Phase 11: Bicep Implementation │ Phase 12: IaC Validation       │
├─────────────────────────────────────────────────────────────────┤
│                 IMPLEMENTATION PHASES (13-15)                    │
├─────────────────────────────────────────────────────────────────┤
│ Phase 13: Frontend      │ Phase 14: Backend                     │
│ Phase 15: Database                                              │
├─────────────────────────────────────────────────────────────────┤
│                     DELIVERY PHASE (16)                          │
├─────────────────────────────────────────────────────────────────┤
│ Phase 16: Testing, CI/CD, Documentation, Reports                │
└─────────────────────────────────────────────────────────────────┘
```

## Phase Details

### Phase 1: Requirements

**Purpose:** Gather and analyze project requirements

**Primary Agent:** @plan

**Inputs:**
- Project specification (user input)
- Constraints
- Stakeholder information

**Outputs:**
- `requirements.md` - Detailed requirements document
- `scope.json` - Project scope definition
- `constraints.json` - Technical and business constraints

**Success Criteria:**
- All functional requirements documented
- Non-functional requirements identified
- Constraints clearly defined

---

### Phase 2: Documentation

**Purpose:** Create initial project documentation

**Primary Agent:** @doc

**Inputs:**
- requirements.md
- scope.json

**Outputs:**
- `README.md` - Project README
- `docs/` - Documentation folder structure
- `CONTRIBUTING.md` - Contribution guidelines

**Success Criteria:**
- README complete with setup instructions
- Documentation structure established

---

### Phase 3: Backlog

**Purpose:** Generate backlog items from requirements

**Primary Agent:** @backlog

**Inputs:**
- requirements.md
- scope.json

**Outputs:**
- `backlog.json` - Structured backlog
- `user-stories.md` - User stories
- `tasks.json` - Task breakdown

**Success Criteria:**
- All requirements mapped to backlog items
- User stories follow INVEST criteria
- Tasks are actionable

---

### Phase 4: Architecture

**Purpose:** Design high-level system architecture

**Primary Agent:** @architect

**Inputs:**
- requirements.md
- constraints.json

**Outputs:**
- `architecture.json` - Architecture definition
- `architecture.md` - Architecture documentation
- `component-diagram.mmd` - Mermaid diagram

**Success Criteria:**
- All components identified
- Communication patterns defined
- Technology stack selected

---

### Phase 5: Code Architecture

**Purpose:** Design code-level architecture

**Primary Agent:** @code-architect

**Inputs:**
- architecture.json
- requirements.md

**Outputs:**
- `code-architecture.json` - Detailed code structure
- `folder-structure.md` - Project organization
- `module-dependencies.json` - Module relationships

**Success Criteria:**
- Folder structure defined
- Module boundaries clear
- Dependencies mapped

---

### Phase 6: ADR Generation

**Purpose:** Create Architecture Decision Records

**Primary Agent:** ADRGeneratorAgent

**Inputs:**
- architecture.json
- code-architecture.json

**Outputs:**
- `docs/adr/` - ADR documents
- `adr-index.md` - ADR index

**Success Criteria:**
- Key decisions documented
- Rationale provided
- Alternatives considered

---

### Phase 7: Diagram Generation

**Purpose:** Generate architecture diagrams

**Primary Agent:** DiagramGeneratorAgent

**Inputs:**
- architecture.json
- code-architecture.json

**Outputs:**
- `diagrams/*.mmd` - Mermaid diagrams
- `diagrams/*.png` - Rendered diagrams

**Success Criteria:**
- System context diagram
- Container diagram
- Component diagrams

---

### Phase 8: Architecture Review

**Purpose:** Review and validate architecture

**Primary Agent:** @architect

**Inputs:**
- All architecture artifacts
- ADRs
- Diagrams

**Outputs:**
- `review-report.md` - Review findings
- Updated architecture if needed

**Success Criteria:**
- Architecture validated
- Issues identified and resolved
- Sign-off obtained

---

### Phase 9: Azure Architecture

**Purpose:** Design Azure infrastructure

**Primary Agent:** @azure-architect

**Inputs:**
- architecture.json
- requirements.md
- constraints.json

**Outputs:**
- `azure-architecture.json` - Azure resource definitions
- `azure-diagram.mmd` - Azure architecture diagram
- `cost-estimate.json` - Cost estimation

**Success Criteria:**
- All Azure resources identified
- Well-Architected Framework applied
- Cost estimated

---

### Phase 10: Bicep Planning

**Purpose:** Plan Bicep template structure

**Primary Agent:** @bicep-specialist

**Inputs:**
- azure-architecture.json

**Outputs:**
- `bicep-plan.json` - Module structure
- `avm-modules.json` - AVM modules to use

**Success Criteria:**
- Modules identified
- AVM modules selected
- Dependencies mapped

---

### Phase 11: Bicep Implementation

**Purpose:** Generate Bicep templates

**Primary Agent:** @bicep-specialist

**Inputs:**
- bicep-plan.json
- azure-architecture.json

**Outputs:**
- `infrastructure/main.bicep` - Main template
- `infrastructure/modules/*.bicep` - Module files
- `infrastructure/*.bicepparam` - Parameter files

**Success Criteria:**
- All resources defined
- AVM modules used where available
- Parameters externalized

---

### Phase 12: Infrastructure Validation

**Purpose:** Validate infrastructure code

**Primary Agent:** ValidationAgent

**Inputs:**
- All Bicep files

**Outputs:**
- `validation-report.json` - Validation results

**Success Criteria:**
- Bicep syntax valid
- Best practices followed
- Security rules passed

---

### Phase 13: Frontend Implementation

**Purpose:** Generate frontend code

**Primary Agent:** @frontend-specialist (+ tech-specific agent)

**Inputs:**
- code-architecture.json
- architecture.json
- backlog.json

**Outputs:**
- `src/frontend/` - Frontend application code

**Success Criteria:**
- All components implemented
- Routing configured
- State management setup

---

### Phase 14: Backend Implementation

**Purpose:** Generate backend code

**Primary Agent:** @backend-specialist (+ tech-specific agent)

**Inputs:**
- code-architecture.json
- architecture.json
- backlog.json

**Outputs:**
- `src/backend/` - Backend application code

**Success Criteria:**
- All APIs implemented
- Authentication configured
- Database access implemented

---

### Phase 15: Database Implementation

**Purpose:** Generate database code

**Primary Agent:** @database-specialist

**Inputs:**
- code-architecture.json
- architecture.json

**Outputs:**
- `src/database/` - Database scripts
- Migrations
- Seed data

**Success Criteria:**
- Schema defined
- Migrations created
- Indexes optimized

---

### Phase 16: Delivery

**Purpose:** Complete project with tests, CI/CD, and documentation

**Primary Agents:** @qa, @devops-specialist, @reporter

**Inputs:**
- All generated code
- All documentation

**Outputs:**
- `tests/` - Test files
- `.github/workflows/` - CI/CD pipelines
- `docs/` - Final documentation
- `report.md` - Generation report

**Success Criteria:**
- Tests implemented
- CI/CD configured
- Documentation complete
- Report generated

---

## Phase Configuration

Scenarios define which phases to execute:

| Scenario | Phases |
|----------|--------|
| S01 (Simple MVP) | 1-5, 13-16 |
| S02 (Startup) | All |
| S03 (SaaS) | All |
| S04 (Enterprise) | All + Extended |
| S05 (Healthcare) | All + Compliance |
| A01-A05 (Azure) | 9-12 only |

## Next Steps

- [Agent Catalog](Catalog) - All 39 agents
- [Scenarios](Scenarios) - Project templates
- [Workflow Engine](../engine/Workflow-Engine) - Technical details
