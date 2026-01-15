# 04. Orchestration Planner Specification

**Component**: Task Extraction Engine - Phase 4  
**Purpose**: Create agent handoff sequence and execution orchestration  
**Date**: January 13, 2026  
**Status**: Specification

---

## 📖 Overview

The Orchestration Planner takes phase assignments and creates the complete orchestration sequence that tells each agent what to do, when, and in what order.

**Input**: `phase-assignments.json` (from Phase Mapper)  
**Output**: `orchestration-plan.json` (ready for execution engine)

---

## 🔄 Process Flow

```
phase-assignments.json
    │
    ├─> Parse AGENT_HANDOFF_MATRIX
    │   ├─> Extract handoff patterns
    │   ├─> Extract data contracts
    │   └─> Extract conditional routes
    │
    ├─> Create Handoff Sequence
    │   ├─> Determine handoff order
    │   ├─> Create data contracts
    │   └─> Define artifact expectations
    │
    ├─> Generate Agent Instructions
    │   ├─> What each agent should do
    │   ├─> What inputs to expect
    │   └─> What outputs to produce
    │
    └─> Generate orchestration-plan.json
        ├─> Handoff sequence
        ├─> Agent instructions
        ├─> Data contracts
        └─> Execution triggers
```

---

## 📥 Input: phase-assignments.json

```json
{
  "phase_assignments": [
    {
      "phase": 13,
      "agent": "@nodejs-specialist",
      "tasks": ["TASK_001", "TASK_003", "TASK_004"],
      "dependencies": {
        "requires_phase": 2,
        "requires_tasks": ["TASK_002"]
      }
    }
  ],
  "tech_stack": {
    "backend": "express",
    "frontend": "react"
  }
}
```

---

## 📤 Output: orchestration-plan.json

```json
{
  "project_name": "MyApp",
  "generated_at": "2026-01-13T11:30:00Z",
  "handoff_sequence": [
    {
      "sequence": 1,
      "from_agent": "@plan",
      "to_agent": "@doc",
      "phase_transition": "1 → 2",
      "trigger": "after_phase_1_complete",
      "data_contract": {
        "required_artifacts": [
          "project-plan.json",
          "tech-stack.json",
          "features.json"
        ],
        "validation_schema": "project-plan.schema.json"
      },
      "timeout_minutes": 60,
      "status": "pending"
    },
    {
      "sequence": 8,
      "from_agent": "@code-architect",
      "to_agent": "@nodejs-specialist",
      "phase_transition": "8 → 13",
      "trigger": "after_phase_8_complete AND tech_stack.backend == express",
      "condition": "IF backend == express",
      "data_contract": {
        "required_artifacts": [
          "code-architecture.json",
          "module-structure.json",
          "coding-standards.md"
        ],
        "validation_schema": "code-architecture.schema.json",
        "expected_inputs": {
          "tech_stack": "object",
          "project_structure": "object",
          "coding_standards": "array"
        }
      },
      "agent_instructions": {
        "what": "Implement Express backend",
        "tasks": ["TASK_001", "TASK_003", "TASK_004"],
        "expected_outputs": [
          "Express app skeleton",
          "Routing structure",
          "Middleware setup",
          "API routes",
          "Database integration"
        ],
        "acceptance_criteria": [
          "Express app runs on port 3000",
          "Routes respond correctly",
          "Database connected",
          "Tests pass (80% coverage)"
        ]
      },
      "timeout_minutes": 120,
      "retry_policy": {
        "max_retries": 3,
        "backoff_seconds": 30
      },
      "status": "pending",
      "dependencies": {
        "requires_artifacts": ["code-architecture.json"],
        "requires_tasks_complete": [],
        "blocked_by": []
      }
    },
    {
      "sequence": 9,
      "from_agent": "@code-architect",
      "to_agent": "@database-specialist",
      "phase_transition": "8 → 12",
      "trigger": "after_phase_8_complete AND database_exists",
      "condition": "IF database != none",
      "data_contract": {
        "required_artifacts": [
          "code-architecture.json",
          "data-model.json"
        ],
        "validation_schema": "data-model.schema.json"
      },
      "agent_instructions": {
        "what": "Implement PostgreSQL database",
        "tasks": ["TASK_002"],
        "expected_outputs": [
          "Database schema",
          "Migrations",
          "Indexes",
          "Test data"
        ]
      },
      "timeout_minutes": 90,
      "status": "pending"
    }
  ],
  "agent_instructions": {
    "@nodejs-specialist": {
      "phase": 13,
      "triggered_by": "after_phase_8_complete",
      "condition": "IF backend == express",
      "tasks": ["TASK_001", "TASK_003", "TASK_004"],
      "inputs": {
        "required_artifacts": ["code-architecture.json"],
        "required_from_phases": [2, 8]
      },
      "outputs": {
        "generate_artifacts": [
          "express-app-structure",
          "api-routes.json",
          "middleware-setup.json"
        ],
        "must_produce": [
          "src/server.ts",
          "src/routes/",
          "tests/"
        ]
      },
      "execution": {
        "parallel_with": ["@react-specialist", "@database-specialist"],
        "sequence_after": ["@code-architect", "@database-specialist (TASK_002)"]
      },
      "validation": {
        "schema": "phase13-nodejs-output.schema.json",
        "gates": [
          "Syntax validation",
          "Dependency check",
          "Test coverage >= 80%"
        ]
      },
      "feedback_channel": "task-completion-tracker"
    },
    "@react-specialist": {
      "phase": 14,
      "triggered_by": "after_@nodejs-specialist_complete",
      "condition": "IF frontend == react",
      "tasks": ["TASK_010", "TASK_011"],
      "inputs": {
        "required_artifacts": ["api-routes.json"],
        "required_from_phases": [2, 8, 13]
      },
      "outputs": {
        "generate_artifacts": ["react-components.json"],
        "must_produce": ["src/components/", "src/pages/", "tests/"]
      },
      "execution": {
        "can_start_when": "Backend API routes defined",
        "blocked_by": ["@nodejs-specialist (TASK_004)"]
      },
      "validation": {
        "schema": "phase14-react-output.schema.json",
        "gates": [
          "Component compilation",
          "TypeScript strict mode",
          "Storybook generation"
        ]
      }
    }
  },
  "execution_strategy": {
    "approach": "phase-sequential-with-parallel-impl",
    "orchestration_phases": [1, 2, 3, 4, 5, 6, 7, 8],
    "implementation_phases": [9, 11, 12, 13, 14],
    "parallel_implementation_allowed": true,
    "max_parallel_agents": 3
  },
  "feedback_integration": {
    "status_tracker": "project-plan.json:task_status",
    "completion_report": "tee-output/completion-report.json",
    "on_task_complete": "update_project_plan_and_trigger_next",
    "on_task_fail": "log_error_and_wait_for_retry"
  },
  "validation": {
    "all_handoffs_defined": true,
    "all_agents_have_instructions": true,
    "circular_handoffs": false,
    "timing_feasible": true,
    "errors": [],
    "warnings": []
  }
}
```

---

## 🎯 Core Concepts

### Data Contracts
Explicit agreements between agents about input/output formats:

```json
{
  "handoff": "@code-architect → @nodejs-specialist",
  "contract": {
    "sends": {
      "code-architecture.json": {
        "schema": "code-architecture.schema.json",
        "required_fields": ["modules", "api_structure", "dependencies"]
      }
    },
    "expects_in_return": {
      "express-app-structure.json": {
        "schema": "express-output.schema.json",
        "expected_in": 120,
        "timeout_action": "retry"
      }
    }
  }
}
```

### Agent Triggers
Define when agents should start work:

```json
{
  "agent": "@nodejs-specialist",
  "triggers": [
    {
      "type": "phase_complete",
      "condition": "phase == 8",
      "action": "start_phase_13"
    },
    {
      "type": "artifact_available",
      "condition": "code-architecture.json exists",
      "action": "validate_and_start"
    },
    {
      "type": "task_assignment",
      "condition": "task in [TASK_001, TASK_003, TASK_004]",
      "action": "execute_task"
    }
  ]
}
```

### Execution Blocks
Define what runs when:

```json
{
  "execution_blocks": [
    {
      "block": 1,
      "phases": [1, 2, 3, 4, 5, 6, 7, 8],
      "sequential": true,
      "description": "Orchestration tier (mandatory, sequential)"
    },
    {
      "block": 2,
      "phases": [9, 11],
      "sequential": true,
      "condition": "IF azure",
      "description": "Azure setup (sequential prerequisite)"
    },
    {
      "block": 3,
      "phases": [12, 13, 14],
      "sequential": false,
      "description": "Implementation (can run parallel)"
    }
  ]
}
```

---

## 📊 Handoff State Machine

```
@plan (Phase 1)
    ↓ [project-plan.json]
@doc (Phase 2)
    ↓ [technical-spec.json]
@backlog (Phase 3)
    ↓ [product-backlog.json]
@coordinator (Phase 4)
    ↓ [execution-plan.json]
@qa (Phase 5)
    ↓ [qa-strategy.json]
@reporter (Phase 6)
    ↓ [monitoring-plan.json]
@architect (Phase 7)
    ↓ [architecture-decision.json]
@code-architect (Phase 8)
    ├─ [IF Azure] ──→ @azure-architect (Phase 9)
    │                    ↓ [azure-design.json]
    │              @bicep-specialist (Phase 11)
    │
    ├─ [IF Database] ──→ @database-specialist (Phase 12)
    │
    ├─ [IF Backend] ──→ @nodejs-specialist / @dotnet-specialist (Phase 13)
    │
    └─ [IF Frontend] ──→ @react-specialist / @vue-specialist (Phase 14)
```

---

## ⚙️ Configuration

### orchestration-planner.config.json
```json
{
  "handoff_matrix_file": ".github/AGENT_HANDOFF_MATRIX.md",
  "artifact_validation_enabled": true,
  "timeout_default_minutes": 120,
  "retry_policy_default": {
    "max_retries": 3,
    "backoff_exponential": true
  },
  "parallel_execution_allowed": true,
  "max_parallel_agents": 3,
  "feedback_tracking_enabled": true
}
```

---

## ✅ Validation Rules

Orchestration Planner must validate:

1. ✅ All handoffs have data contracts
2. ✅ All agents have instructions
3. ✅ No circular handoffs
4. ✅ Conditional logic consistent
5. ✅ Artifact names match schemas
6. ✅ Timing estimates feasible
7. ✅ Parallel blocks have no dependencies

---

**Next**: Read `05_feedback-system.md` to understand progress tracking.
