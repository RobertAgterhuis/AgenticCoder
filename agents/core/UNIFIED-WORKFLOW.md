# Unified 12-Phase Workflow Architecture

**Document**: UNIFIED-WORKFLOW.md  
**Version**: 1.0  
**Date**: January 13, 2026  
**Status**: Phase 2 - Task #3 Complete  

---

## Executive Summary

This document defines the **Unified 12-Phase Workflow** that merges two established frameworks:

1. **Azure Agentic InfraOps 7-Step Workflow** (Infrastructure Automation)
2. **ProjectPlan Template 15-Phase Workflow** (Software Development Lifecycle)

**Result**: A cohesive 12-phase system that enables complete project automation from initial discovery through deployment and documentation.

### Key Metrics

| Metric | Value |
|--------|-------|
| Total Phases | 12 |
| Phases with User Approval | 7 |
| Auto-Validation Gates | 5 |
| Orchestration Tier Agents | 9 |
| Architecture Tier Agents | 8 |
| Implementation Tier Agents | 18 |
| **Total Agents** | **35** |
| Typical Workflow Duration | ~185 minutes (~3 hours) |
| Parallel Phase Groups | 2 |

---

## Part 1: Phase Overview

### Phase 0: Project Discovery & Planning (30 min)
**Type**: User-Driven with Agent Support  
**Agents**: project-plan-generator, doc-writer, backlog-strategist, implementation-coordinator, qa-validator  
**Output**: Complete ProjectPlan/ with 50+ documents

### Phase 1: Infrastructure Requirements Discovery (10 min)
**Type**: User-Driven  
**Agents**: @plan  
**Output**: 01-requirements.md

### Phase 2: Architecture Assessment & Cost Estimation (20 min)
**Type**: Automated  
**Agents**: azure-principal-architect, diagram-generator  
**Output**: WAF assessment, cost estimates, architecture diagrams

### Phase 3: Implementation Planning & Governance (15 min)
**Type**: Automated  
**Agents**: bicep-plan  
**Output**: Implementation plan, governance constraints, phased costs

### Phase 4: Infrastructure Code Generation (20 min)
**Type**: Automated with Validation Gates  
**Agents**: bicep-implement  
**Output**: Production-ready Bicep templates

### Phase 5: Azure Deployment & Validation (10-20 min)
**Type**: Automated with User Confirmation  
**Agents**: deploy-coordinator  
**Output**: Deployed resources, deployment summary, resource inventory

### Phase 6: Post-Deployment Validation & Optimization (15 min)
**Type**: Automated  
**Agents**: workload-documentation-generator  
**Output**: As-built documentation, optimization recommendations

### Phase 7: Infrastructure-to-Application Handoff (10 min)
**Type**: Coordination  
**Agents**: implementation-coordinator  
**Output**: Environment configs, connection strings, infrastructure handoff

### Phase 8: Application Architecture & Code Generation (15 min)
**Type**: Automated  
**Agents**: implementation-coordinator, cicd-engineer, frontend-wireframe  
**Output**: Application skeleton, CI/CD baseline, project structure

### Phase 9: Project Tracking & Governance Setup (10 min)
**Type**: Coordination  
**Agents**: reporter, implementation-coordinator, backlog-strategist  
**Output**: Project dashboards, risk tracking, stakeholder reporting

### Phase 10: Quality Assurance & Testing Framework (10 min)
**Type**: Automated  
**Agents**: qa-validator  
**Output**: Test frameworks, code coverage setup, security scanning

### Phase 11: Documentation & Knowledge Transfer (20 min)
**Type**: Finalization  
**Agents**: doc-writer, workload-documentation-generator  
**Output**: API docs, deployment guides, training materials

---

## Part 2: Phase State Machine & Transitions

### Standard Linear Flow

```
Phase 0 (Discovery)
    ↓ (approval)
Phase 1 (Requirements)
    ↓ (approval)
Phase 2 (Assessment)
    ↓ (approval)
Phase 3 (Planning)
    ↓ (approval)
Phase 4 (Code Generation)
    ↓ (validation passes)
Phase 5 (Deployment)
    ↓ (success)
Phase 6 (Validation)
    ↓ (passed)
Phase 7 (Handoff)
    ↓
Phase 8 (Application Setup)
    ↓
Phase 9 (Tracking) ----┐
                        ├─→ Phase 11 (Documentation)
Phase 10 (Testing) ----┘
    ↓
PROJECT_COMPLETE
```

### Conditional Transitions

**Phase 0**: Discovery
- ✅ Approval → Phase 1
- ❌ Rejection → Phase 0 (revise)

**Phase 1**: Requirements
- ✅ Approval → Phase 2
- ✏️ Revision → Phase 1

**Phase 2**: Assessment
- ✅ Approval → Phase 3
- ↩️ Major changes needed → Phase 1 (back to requirements)
- 💰 Cost too high → Phase 2 (re-assess with optimizations)

**Phase 3**: Planning
- ✅ Approval → Phase 4
- 🔄 Replan needed → Phase 3
- ⚠️ Governance conflict → ESCALATION (manual)

**Phase 4**: Code Generation
- ✅ Validation passes → Phase 5
- ❌ Syntax errors → Phase 4 (fix)
- 🔒 Security issues → Phase 4 (mitigate)

**Phase 5**: Deployment
- ✅ Success → Phase 6
- ❌ Failure → ESCALATION (manual troubleshooting)
- 🛑 User rejects → ROLLBACK (delete resources)

**Phase 6**: Validation
- ✅ Passed → Phase 7
- ⚠️ Issues found → ESCALATION (manual)

**Phase 7**: Handoff
- ✅ Complete → Phase 8
- ⚙️ Config issues → Phase 7 (fix configs)

**Phase 8**: Application Setup
- ✅ Complete → **[Phase 9 AND Phase 10 in parallel]**
- ❌ Architecture issues → Phase 8 (revise)

**Phase 9 & 10**: Parallel Execution
- Phase 9 (Tracking) → Phase 11
- Phase 10 (Testing) → Phase 11
- Both must complete before proceeding

**Phase 11**: Documentation
- ✅ Complete → PROJECT_COMPLETE
- 📝 Feedback received → Phase 11 (revise)

---

## Part 3: Agent-to-Phase Mapping

### Orchestration Tier (9 agents)

| Agent | Phases | Role | Description |
|-------|--------|------|-------------|
| project-plan-generator | 0 | Orchestrator | Initiates discovery, coordinates all Phase 0 agents |
| doc-writer | 0, 11 | Documentation | Creates docs and knowledge base articles |
| backlog-strategist | 0, 9 | Coordination | Manages epics, stories, risks, and tracking |
| implementation-coordinator | 0, 3, 7, 8, 9 | Coordination | Overall project coordination across phases |
| qa-validator | 0, 10 | Quality | Defines and implements testing strategy |
| reporter | 9 | Reporting | Generates progress reports and dashboards |
| deploy-coordinator | 5 | Deployment | Orchestrates Azure deployment process |
| workload-documentation-generator | 6, 11 | Documentation | Creates operational and as-built documentation |
| cicd-engineer | 8 | Infrastructure | Creates CI/CD pipeline baseline |

### Architecture Tier (8 agents)

| Agent | Phases | Role | Description |
|-------|--------|------|-------------|
| azure-principal-architect | 2 | Architecture | WAF assessment, cost estimation |
| bicep-plan | 3 | Planning | Implementation planning with governance |
| bicep-implement | 4 | Implementation | Bicep template generation and validation |
| adr-generator | 2 | Documentation | Architecture decision records |
| diagram-generator | 2, 6 | Visualization | Architecture and as-built diagrams |
| database-specialist | 2, 3 | Architecture | Database design and optimization |
| security-architect | 2, 3 | Security | Security architecture and compliance |
| cost-optimizer | 2, 6 | Optimization | Cost optimization and region selection |

### Implementation Tier (18 agents)

| Agent | Phases | Role | Description |
|-------|--------|------|-------------|
| frontend-wireframe | 8 | Frontend | UI/UX design and wireframes |
| backend-developer | 8, 9, 10 | Backend | Backend service implementation |
| api-developer | 8, 9, 10 | Backend | REST/GraphQL API implementation |
| database-developer | 8, 9, 10 | Database | Database schema and queries |
| devops-engineer | 8, 9, 10 | DevOps | Infrastructure and deployment automation |
| security-engineer | 8, 9, 10 | Security | Security implementation and scanning |
| testing-engineer | 10 | Testing | Test automation and quality assurance |
| integration-specialist | 7, 8 | Integration | System integration between infrastructure and app |
| performance-analyst | 6, 10 | Performance | Performance testing and optimization |
| ui-ux-designer | 8 | Design | User interface and experience design |
| documentation-engineer | 11 | Documentation | Technical documentation |
| quality-assurance-lead | 10 | Quality | QA leadership and strategy |
| deployment-specialist | 5, 6 | Deployment | Deployment procedures and validation |
| monitoring-specialist | 6 | Monitoring | Monitoring and alerting setup |
| incident-responder | 9 | Operations | Incident response procedures |
| training-specialist | 11 | Training | Team training and onboarding |
| compliance-officer | 3, 10 | Compliance | Compliance verification and auditing |
| project-manager | 0, 9 | Management | Overall project management |

---

## Part 4: Phase Validation Rules

Each phase has specific validation rules that determine:
- **Required context**: What must be available to enter the phase
- **Skip conditions**: When a phase can be skipped
- **Timeout**: Maximum duration for the phase

### Example: Phase 4 Validation

```javascript
{
  required_context: ['phase_3_complete', '04-plan'],
  skip_if: [],
  timeout_minutes: 45,
  
  // Auto-validation gates that must pass
  validation_gates: [
    'bicep build',
    'bicep lint',
    'security scan',
    'AVM compliance',
    'CAF naming'
  ],
  
  // If all gates pass, auto-transition to Phase 5
  auto_transition: true
}
```

### All Phase Validation Rules

| Phase | Required Context | Skip If | Timeout |
|-------|-----------------|---------|---------|
| 0 | project_name | — | 60 min |
| 1 | phase_0_complete, project_plan | — | 30 min |
| 2 | phase_1_complete, 01-requirements | — | 45 min |
| 3 | phase_2_complete, 02-assessment | — | 30 min |
| 4 | phase_3_complete, 04-plan | — | 45 min |
| 5 | phase_4_complete, bicep_templates | infrastructure_already_deployed | 60 min |
| 6 | phase_5_complete, deployment_summary | — | 30 min |
| 7 | phase_6_complete | — | 20 min |
| 8 | phase_7_complete | application_already_scaffolded | 30 min |
| 9 | phase_8_complete | — | 20 min |
| 10 | phase_8_complete | — | 20 min |
| 11 | phase_9_complete AND phase_10_complete | — | 40 min |

---

## Part 5: Infrastructure vs. Application Split

This workflow uniquely bridges infrastructure (Azure) automation with application development:

### Infrastructure Focus (Phases 1-7)
- Handles all Azure infrastructure setup
- Uses Azure Agentic InfraOps patterns
- Completes autonomously with user approvals
- Hands off to application teams

### Application Focus (Phases 8-11)
- Handles application architecture and implementation
- Uses ProjectPlan Template patterns
- Integrates with deployed infrastructure
- Completes project setup and documentation

### Bridge: Phase 7
- Infrastructure-to-Application Handoff
- Generates connection strings and configs
- Sets up environment variables
- Enables application developers to start work

---

## Part 6: Integration with Message Bus & Discovery Service

### Discovery Service Integration

The [AgentDiscoveryService](./AgentDiscoveryService.js) provides REST endpoints for:

```
GET /agents/by-phase/:phase
  → Returns all agents active in phase

GET /agents/by-tier/:tier
  → Returns agents in orchestration/architecture/implementation tiers

GET /agents/routing/:phaseNumber/:capability
  → Returns appropriate agent for phase + capability

GET /workflow/sequence
  → Returns standard phase sequence

GET /workflow/agents/:phaseNumber
  → Returns agents involved in specific phase

GET /workflow/stats
  → Returns workflow statistics
```

### Message Bus Integration

Each phase transition triggers:

1. **Phase Exit**: Agents publish completion event
   ```json
   {
     "event": "phase_complete",
     "phase": 2,
     "status": "success",
     "artifacts": ["02-assessment.md", "02-cost.md"],
     "next_phase": 3
   }
   ```

2. **Validation**: Workflow engine validates transition conditions
   ```javascript
   const canProceed = validatePhaseExit(currentPhase, artifacts, context);
   ```

3. **Phase Entry**: New phase agents are discovered and initialized
   ```javascript
   const nextAgents = discovery.getAgentsForPhase(nextPhase);
   ```

4. **Context Passing**: Workflow context and artifacts passed to next phase
   ```javascript
   messageBus.publish({
     type: 'phase_start',
     phase: 3,
     context: previousPhaseContext,
     artifacts: generatedArtifacts
   });
   ```

---

## Part 7: Approval Gates

### User Approval Gates

**7 phases require user approval**:

1. **Phase 0**: ProjectPlan approval (user reviews generated plan)
2. **Phase 1**: Infrastructure requirements (user confirms requirements)
3. **Phase 2**: Architecture assessment (user reviews WAF scores and costs)
4. **Phase 3**: Implementation plan (user approves phased approach)
5. **Phase 4**: Code review (user reviews generated Bicep code)
6. **Phase 5**: Deployment authorization (user confirms what-if output)
7. **Phase 11**: Documentation review (user approves final documentation)

### Automated Validation Gates

**Phase 4** has 5 automatic validation gates that must pass:
- ✅ bicep build (syntax validation)
- ✅ bicep lint (style and best practices)
- ✅ security scan (vulnerability detection)
- ✅ AVM compliance (Azure Verified Modules alignment)
- ✅ CAF naming (Cloud Adoption Framework conventions)

If all gates pass, Phase 4 auto-transitions to Phase 5 (pending user approval of Phase 5 deployment).

---

## Part 8: Workflow Statistics

```javascript
{
  total_phases: 12,
  orchestration_tier_agents: 9,
  architecture_tier_agents: 8,
  implementation_tier_agents: 18,
  total_agents: 35,
  
  phases_with_user_approval: [0, 1, 2, 3, 4, 5, 11],  // 7 phases
  phases_with_automation_gates: [4],                   // 1 phase
  
  parallel_phases: [[9, 10]],  // Two phases that run simultaneously
  
  typical_workflow_minutes: 185,  // ~3 hours
  
  phases_by_duration: {
    phase_0: 30,   // Longest user interaction
    phase_5: '10-20',  // Variable based on complexity
    phase_8: 15,
    phase_11: 20
  },
  
  azure_infrastructure_phases: [1, 2, 3, 4, 5, 6, 7],
  project_implementation_phases: [0, 8, 9, 10, 11],
  bridge_phases: [7],
  
  total_expected_artifacts: '50+',
  documentation_pages: '100+'
}
```

---

## Part 9: Error Handling & Escalation

### Escalation Conditions

Certain conditions require manual intervention (ESCALATION):

1. **Phase 2**: Major changes needed → Back to Phase 1
2. **Phase 3**: Governance conflict → Manual resolution
3. **Phase 4**: Security issues → Mitigate and regenerate
4. **Phase 5**: Deployment failure → Troubleshooting required
5. **Phase 6**: Resource validation issues → Investigation needed

### Rollback Procedures

**Phase 5 Rollback**: If user rejects deployment
```
1. Azure CLI: az deployment group delete
2. Release resources
3. Generate rollback summary
4. Option to restart from Phase 4 with modifications
```

### Retry Logic

- Phase 4 (Code Generation): Auto-retry on syntax errors
- Phase 5 (Deployment): Retry with exponential backoff
- All phases: Max 3 retries before escalation

---

## Part 10: Examples by Project Type

### Simple Project: Single App Service
```
Typical flow: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9, 10 → 11
Duration: ~2 hours
Infrastructure phases: 30 min
Application phases: 45 min
```

### Medium Project: App Service + SQL Database + API
```
Typical flow: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9, 10 → 11
Duration: ~3 hours
Infrastructure phases: 45 min
Application phases: 90 min
```

### Complex Project: Multi-Tier with Multiple Services
```
Typical flow: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9, 10 → 11
Duration: ~4 hours
Infrastructure phases: 60 min (with multiple what-if iterations)
Application phases: 120+ min
Additional escalations: 1-2 for governance/security reviews
```

---

## Part 11: Implementation Roadmap

### Phase 2 Tasks Using This Workflow

**Task #3** (Current): ✅ Unified Workflow Design
- Created 12-phase definitions
- Mapped 35 agents to phases
- Defined state machine and transitions
- Documented validation rules
- Created UnifiedWorkflow.js module

**Task #4**: Enhanced Message Bus
- Implement routing based on AgentDiscoveryService
- Add priority queues per phase
- Implement dead letter queue for failed agents
- Create phase transition state machine

**Task #5**: Implement 10 Core Agents
- project-plan-generator (Phase 0)
- doc-writer (Phases 0, 11)
- azure-principal-architect (Phase 2)
- bicep-plan (Phase 3)
- bicep-implement (Phase 4)
- deploy-coordinator (Phase 5)
- implementation-coordinator (Phases 7, 8)
- qa-validator (Phases 0, 10)
- diagram-generator (Phase 2)

---

## Part 12: References

- **Agent Specifications**: `agents/core/AgentSpecifications.js`
- **Discovery Service**: `agents/core/AgentDiscoveryService.js`
- **Unified Workflow**: `agents/core/UnifiedWorkflow.js` (this module)
- **JSON Schemas**: `.github/schemas/` (79 schemas)
- **Original Azure Workflow**: Azure Agentic InfraOps 7-step
- **Original Project Planning**: ProjectPlan Template Framework

---

**Document Status**: Complete ✅  
**Integration Status**: Ready for Task #4 (Message Bus Enhancement)  
**Quality Assurance**: All phases validated, all agents mapped, all transitions documented

