# Workflow Orchestrator

## Purpose
Define end-to-end coordination across phases 0–5 (planning through deployment), including agent ordering, approvals, and failure handling. Aligns with Plan-B (architecture) and Plan-C (phased plan).

## Phase Flow (summary)
- Phase 0: Discovery & project plan (@plan, @doc, @backlog, @coordinator, @qa, @reporter)
- Phase 1: Requirements (@plan output -> 01-requirements.md)
- Phase 2: Assessment (azure-principal-architect, diagram/ADR optional)
- Phase 3: Planning (azure-iac-planner; governance constraints)
- Phase 4: Generation (azure-implement; Bicep + validation)
- Phase 5: Deployment (deploy-coordinator; what-if, deploy)

## Handoffs (high level)
- @plan → azure-principal-architect: requirements doc
- azure-principal-architect → diagram-generator / adr-generator → azure-iac-planner
- azure-iac-planner → azure-implement: implementation plan + governance constraints
- azure-implement → deploy-coordinator: validated Bicep + scripts
- deploy-coordinator → workload-documentation-generator: deployed resource inventory

## Approval & Gates
- User approvals after Phase 1, Phase 2, Phase 3, Phase 4 what-if.
- Validation gates: schema, syntax (bicep build/lint), dependency, security, testing (Plan-G, Plan-H).

## Error Handling
- Fail-fast on schema/syntax; retry MCP tool calls with backoff.
- Escalate to user on failed what-if or deployment; log outputs under agent-output/.

## TODO
- Add concrete file paths per artifact once Bicep/infra scaffolds exist.
- Add state machine table with statuses (PENDING, READY, RUNNING, COMPLETED, FAILED, VALIDATED, REPORTED).
