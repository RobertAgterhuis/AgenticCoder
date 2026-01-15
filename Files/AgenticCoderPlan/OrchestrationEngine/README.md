# Orchestration Engine

**Version**: 1.0.0  
**Date**: January 13, 2026  
**Status**: Specification & Implementation  
**Purpose**: Execute the orchestration plan, coordinate agent handoffs, manage project execution

---

## 🎯 Executive Summary

The **Orchestration Engine (OE)** is the runtime that executes the plan created by the Task Extraction Engine. It:

1. ✅ **Reads** orchestration-plan.json
2. ✅ **Triggers** agents in correct sequence
3. ✅ **Validates** data contracts
4. ✅ **Manages** state and handoffs
5. ✅ **Monitors** execution in real-time
6. ✅ **Reports** progress and handles failures

Without OE: You have a perfect plan but nothing executes.  
With OE: The plan becomes reality—agents execute in coordination, artifacts flow between them, and progress is tracked.

---

## 🏗️ Architecture

```
orchestration-plan.json (from TEE)
        │
        ├─→ Engine Initialization
        │   ├─> Load orchestration config
        │   ├─> Validate prerequisites
        │   └─> Initialize state machine
        │
        ├─→ Phase Executor
        │   ├─> Phase 1-8 (Orchestration tier - sequential)
        │   ├─> Phase 9-11 (Architecture tier - conditional)
        │   └─> Phase 12-15 (Implementation tier - parallel)
        │
        ├─→ Handoff Manager
        │   ├─> Validate data contracts
        │   ├─> Transfer artifacts
        │   └─> Trigger next agent
        │
        ├─→ State Machine
        │   ├─> Track execution state
        │   ├─> Manage task status
        │   └─> Handle failures/retries
        │
        ├─→ Monitoring & Feedback
        │   ├─> Collect execution metrics
        │   ├─> Validate outputs
        │   └─> Update project status
        │
        └─→ project-plan.json (updated with progress)
```

---

## 📦 Core Components

### 1. **Engine Core** (`01_engine-core.md`)
The main orchestration loop that manages execution flow.

**Responsibilities:**
- Read orchestration-plan.json
- Initialize execution environment
- Run phase execution loop
- Handle exceptions and retries
- Manage overall state

### 2. **Phase Executor** (`02_phase-executor.md`)
Executes agents for each phase in correct sequence.

**Responsibilities:**
- Trigger agent execution
- Pass correct inputs
- Collect outputs
- Validate outputs
- Manage timing

### 3. **Handoff Manager** (`03_handoff-manager.md`)
Coordinates data transfer between agents.

**Responsibilities:**
- Validate data contracts
- Transform data between formats
- Transfer artifacts
- Track handoff success/failure

### 4. **State Machine** (`04_state-machine.md`)
Manages execution state and task transitions.

**Responsibilities:**
- Track task state (pending → in-progress → completed)
- Detect completed prerequisites
- Unlock dependent tasks
- Handle retries and failures

### 5. **Monitoring & Reporting** (`05_monitoring.md`)
Real-time execution monitoring and progress reporting.

**Responsibilities:**
- Collect execution metrics
- Generate status reports
- Trigger alerts
- Update @plan with progress

---

## 🔄 Execution Flow

```
START
  │
  ├─→ Load orchestration-plan.json
  │
  ├─→ Initialize Engine State
  │   ├─> Create task queue
  │   ├─> Set up monitoring
  │   └─> Start logging
  │
  ├─→ ORCHESTRATION TIER (Phase 1-8, Sequential)
  │   │
  │   ├─→ Phase 1: @plan (already done)
  │   ├─→ Phase 2: @doc
  │   ├─→ Phase 3: @backlog
  │   ├─→ Phase 4: @coordinator
  │   ├─→ Phase 5: @qa
  │   ├─→ Phase 6: @reporter
  │   ├─→ Phase 7: @architect
  │   └─→ Phase 8: @code-architect
  │
  ├─→ ARCHITECTURE TIER (Phase 9-11, Conditional)
  │   │
  │   ├─ [IF Azure] ──→ Phase 9: @azure-architect
  │   │                   ├─→ Validate Azure design
  │   │                   └─→ Pass to Bicep
  │   │
  │   └─ [IF Bicep] ──→ Phase 11: @bicep-specialist
  │                       ├─→ Generate IaC
  │                       └─→ Validate templates
  │
  ├─→ IMPLEMENTATION TIER (Phase 12-15, Parallel)
  │   │
  │   ├─→ Phase 12: @database-specialist ──┐
  │   │                                      │
  │   ├─→ Phase 13: @nodejs/@dotnet ────────┤ (Parallel)
  │   │                                      │
  │   └─→ Phase 14: @react/@vue ────────────┘
  │
  ├─→ FINALIZATION TIER (Phase 15-16)
  │   │
  │   ├─→ Phase 15: @devops (CI/CD setup)
  │   └─→ Phase 16: @reporter (final summary)
  │
  └─→ END
      ├─> Generate final report
      ├─> Update project-plan.json
      └─> Archive execution logs
```

---

## 📊 Execution Model

### Sequential Phases (1-8)
```
Phase N                Phase N+1
[Execute]             [Wait]
[Validate]            [Wait]
[Complete]            [Trigger]
                      [Execute]
```

### Conditional Phases (9-11)
```
[Check Condition] 
    ├─ True  → [Execute Phase]
    └─ False → [Skip Phase]
```

### Parallel Phases (12-15)
```
Phase 12: DB     Phase 13: Backend     Phase 14: Frontend
[Execute]        [Execute]            [Execute]
[Validate]       [Validate]           [Validate]
[Complete]       [Complete]           [Complete]
    │                │                    │
    └────────┬───────┴────────┬───────────┘
             │                │
          [Sync Point]    [All Parallel Complete]
             │
          [Phase 15: DevOps]
```

---

## 💾 Data Models

### Engine State
```json
{
  "execution_id": "exec_20260113_001",
  "orchestration_plan_id": "plan_myapp_001",
  "project_name": "MyApp",
  "status": "in_progress",
  "current_phase": 13,
  "start_time": "2026-01-13T12:00:00Z",
  "phases": {
    "1": { "status": "completed", "completed_at": "2026-01-13T09:30:00Z" },
    "2": { "status": "completed", "completed_at": "2026-01-13T10:45:00Z" },
    "13": { "status": "in_progress", "started_at": "2026-01-13T12:00:00Z" }
  },
  "tasks": {
    "TASK_001": { "status": "completed", "duration_minutes": 45 },
    "TASK_002": { "status": "in_progress", "progress": 65 }
  }
}
```

### Handoff Data
```json
{
  "handoff_id": "ho_001",
  "from": "@code-architect",
  "to": "@nodejs-specialist",
  "artifacts": {
    "code-architecture.json": {
      "location": "tee-output/artifacts/code-architecture.json",
      "checksum": "abc123def456",
      "validated": true
    }
  },
  "timestamp": "2026-01-13T12:00:00Z",
  "status": "success"
}
```

---

## 🔌 Integration Points

### Inputs
- **orchestration-plan.json** - Plan to execute
- **ProjectPlan/** - Project specification
- **.github/** - Agent definitions and schemas
- **Agent APIs** - Trigger agent execution

### Outputs
- **Execution Logs** - What happened
- **Status Reports** - Progress tracking
- **project-plan.json** (updated) - Current state
- **Artifacts** - Generated outputs

---

## ⚙️ Configuration

### engine.config.json
```json
{
  "orchestration_plan_path": "tee-output/orchestration-plan.json",
  "project_plan_path": "ProjectPlan/project-plan.json",
  "execution_log_path": "tee-output/execution-log.json",
  "state_file_path": "tee-output/engine-state.json",
  "max_concurrent_phases": 3,
  "phase_timeout_minutes": 120,
  "task_timeout_minutes": 60,
  "retry_policy": {
    "max_retries": 3,
    "backoff_seconds": 30
  },
  "monitoring_enabled": true,
  "update_project_plan_on_progress": true,
  "alert_on_failure": true
}
```

---

## ✅ Success Criteria

When OE is working correctly:

1. ✅ Phases execute in correct sequence
2. ✅ Conditional phases evaluated correctly
3. ✅ Parallel phases run concurrently
4. ✅ All handoffs validated
5. ✅ Task status updates in real-time
6. ✅ Failures are retried correctly
7. ✅ Project-plan.json stays synchronized
8. ✅ Complete execution audit trail maintained

---

## 📁 File Structure

```
OrchestrationEngine/
├── README.md (this file)
├── 01_engine-core.md              # Main orchestration loop
├── 02_phase-executor.md           # Phase execution logic
├── 03_handoff-manager.md          # Artifact handoffs
├── 04_state-machine.md            # State tracking
├── 05_monitoring.md               # Real-time monitoring
├── implementation/
│   ├── engine.ts                  # Main engine class
│   ├── phase-executor.ts          # Phase logic
│   ├── handoff-manager.ts         # Handoff coordination
│   ├── state-machine.ts           # State management
│   └── monitoring.ts              # Monitoring service
├── schemas/
│   ├── engine-state.schema.json
│   ├── handoff-record.schema.json
│   └── execution-log.schema.json
└── examples/
    ├── sample-execution-log.json
    ├── sample-engine-state.json
    └── sample-handoff-record.json
```

---

## 🚀 Quick Start

### 1. Initialize Engine
```bash
npm run orchestration:init \
  --orchestration-plan ./tee-output/orchestration-plan.json \
  --project-plan ./ProjectPlan/project-plan.json
```

### 2. Start Execution
```bash
npm run orchestration:execute \
  --execution-id exec_myapp_001 \
  --config ./engine.config.json
```

### 3. Monitor Progress
```bash
npm run orchestration:status \
  --execution-id exec_myapp_001
```

### 4. Get Report
```bash
npm run orchestration:report \
  --execution-id exec_myapp_001
```

---

## 🔀 Key Algorithms

### Phase Sequencing
Determine which phase can run next based on:
- Current phase completion
- Conditional gate evaluation
- Dependency satisfaction

### Parallel Execution
Identify and execute phases in parallel:
- Phase 12 (Database) + Phase 13 (Backend) + Phase 14 (Frontend)
- Synchronize completion before Phase 15

### Failure Recovery
On agent failure:
1. Log error with context
2. Check retry policy
3. Retry if < max_retries
4. If still failing, raise alert and wait for intervention

---

## 📊 Monitoring Outputs

Real-time dashboard shows:
```
Execution Progress
├─ Phase 1-8: ████████████░░ (8/8 complete)
├─ Phase 9-11: ░░░░░░░░░░░░░░ (0/2 enabled)
├─ Phase 12-14: ██████░░░░░░░░ (2/3 executing)
└─ Phase 15-16: ░░░░░░░░░░░░░░ (0/2 pending)

Current Execution
├─ Phase 13: @nodejs-specialist
├─ Progress: 65% (26/40 tasks)
├─ ETA: 30 minutes
└─ Status: On track

Recent Events
├─ 12:45 - TASK_001 completed
├─ 12:46 - TASK_003 started
└─ 12:47 - Artifact validated
```

---

## 🎓 Key Concepts

### Phase Tiers
- **Orchestration** (1-8): Project planning and setup
- **Architecture** (9-11): Infrastructure design and IaC
- **Implementation** (12-15): Actual coding
- **Finalization** (15-16): DevOps and reporting

### Handoff Contract
Explicit data exchange between agents:
- What data is sent
- In what format
- Schema validation
- Expected delivery time

### State Transitions
Tasks move through well-defined states:
- `pending` → `ready` → `in_progress` → `completed`
- Or: `in_progress` → `failed` → `pending` (retry)

---

## 🤝 Dependencies

OE requires:
- ✅ Task Extraction Engine (produces orchestration-plan.json)
- ✅ Agent definitions (.github/agents/*.agent.md)
- ✅ Phase definitions (.github/phase-flow.gv)
- ⏳ Validation Framework (validates artifacts)
- ⏳ Execution Bridge (runs agent commands)

---

## 📖 Next Steps

1. **Read** `01_engine-core.md` - Understand the main loop
2. **Read** `02_phase-executor.md` - Phase execution
3. **Read** `03_handoff-manager.md` - Handoff coordination
4. **Read** `04_state-machine.md` - State management
5. **Read** `05_monitoring.md` - Real-time monitoring
6. **Implement** - Build each component
7. **Test** - Use example scenarios
8. **Deploy** - Integrate with workflow

---

## 🏆 Why This Matters

**Before OE**: Plan exists but isn't executed  
**After OE**: Plan becomes reality with full execution, coordination, and tracking

OE is the runtime that makes everything happen.

---

**Status**: 🟡 **SPECIFICATION IN PROGRESS** → Implementation guide coming next.
