# Task Extraction Engine (TEE)

**Version**: 1.0.0  
**Date**: January 13, 2026  
**Status**: Foundation System (Critical Priority)  
**Purpose**: Bridge gap between @plan specification and concrete executable tasks

---

## 🎯 Executive Summary

The **Task Extraction Engine (TEE)** is the critical foundation that transforms high-level project specifications from @plan into:

1. ✅ **Concrete Tasks** - Specific, measurable, actionable work items
2. ✅ **Execution Schedule** - Sequential + parallel execution blocks
3. ✅ **Dependencies** - Task ordering, blocking relationships
4. ✅ **Orchestration Instructions** - Which agent handles what, in what order
5. ✅ **Feedback Points** - Where status updates go back to @plan

**Without TEE**: Agents generate code in vacuum, no coordination, no testing, no feedback.  
**With TEE**: Agents know what to do, when to do it, and report results automatically.

---

## 📋 Core Components

### 1. **Task Parser** (`01_task-parser.md`)
Extracts tasks from @plan output structure.

**Input**: ProjectPlan folder (from @plan)  
**Output**: Task list with metadata

```json
{
  "tasks": [
    {
      "id": "task_001",
      "title": "Create Express Application",
      "description": "Setup Express app with routing",
      "type": "backend-setup",
      "priority": 1,
      "agent": "@nodejs-specialist",
      "depends_on": [],
      "estimated_hours": 2
    }
  ]
}
```

### 2. **Dependency Resolver** (`02_dependency-resolver.md`)
Maps task interdependencies, creates execution graph.

**Input**: Task list  
**Output**: Execution schedule with blocks

```json
{
  "execution_blocks": [
    {
      "block": 1,
      "parallel": false,
      "tasks": ["task_001", "task_002"]
    },
    {
      "block": 2,
      "parallel": true,
      "tasks": ["task_003", "task_004", "task_005"]
    }
  ]
}
```

### 3. **Phase Mapper** (`03_phase-mapper.md`)
Maps tasks to agent phases, validates against phase-flow.

**Input**: Execution schedule + tech stack  
**Output**: Phase assignments

```json
{
  "phase_assignments": {
    "phase_13": {
      "agent": "@react-specialist",
      "tasks": ["task_010", "task_011"],
      "condition": "IF frontend == react"
    }
  }
}
```

### 4. **Orchestration Planner** (`04_orchestration-planner.md`)
Coordinates agent handoffs, creates state machine for workflow.

**Input**: Phase assignments  
**Output**: Handoff sequence + data contracts

```json
{
  "handoff_sequence": [
    {
      "from": "@plan",
      "to": "@doc",
      "artifacts": ["project-plan.json"],
      "metadata": {...}
    }
  ]
}
```

### 5. **Feedback System** (`05_feedback-system.md`)
Tracks task status, captures artifacts, feeds back to @plan.

**Input**: Task execution results  
**Output**: Status updates, completion reports

---

## 🔄 Workflow: From Specification to Execution

```
┌─────────────────────────────────────────────────────────┐
│ @plan generates ProjectPlan                            │
│ (project-plan.json, tech-stack.json, features.json)    │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ TASK PARSER                                             │
│ Reads: ProjectPlan/*.json                               │
│ Generates: task-list.json                               │
│ Extracts: Features → Tasks, Constraints → Deps         │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ DEPENDENCY RESOLVER                                     │
│ Reads: task-list.json                                  │
│ Generates: execution-schedule.json                     │
│ Maps: Tech stack → Agent prerequisites                 │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE MAPPER                                            │
│ Reads: execution-schedule.json + phase-flow.gv         │
│ Generates: phase-assignments.json                      │
│ Validates: Against .github/phase-flow.gv               │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ ORCHESTRATION PLANNER                                   │
│ Reads: phase-assignments.json + AGENT_HANDOFF_MATRIX   │
│ Generates: orchestration-plan.json                     │
│ Creates: Agent handoff sequence                        │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ FEEDBACK SYSTEM                                         │
│ Monitors: Agent execution → Task completion            │
│ Reports: Status back to @plan → project-plan.json      │
│ Tracks: Which tasks passed/failed validation           │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### Task Object
```json
{
  "id": "string",              // unique task ID
  "title": "string",           // user-facing title
  "description": "string",     // detailed description
  "type": "string",            // task category
  "priority": "number",        // 1 (high) to 5 (low)
  "agent": "string",           // @agent-name
  "phase": "number",           // phase number
  "depends_on": ["string"],    // task IDs this depends on
  "estimated_hours": "number", // time estimate
  "acceptance_criteria": ["string"], // definition of done
  "inputs": {},                // required inputs for agent
  "outputs": {},               // expected artifacts
  "status": "pending|in-progress|completed|failed",
  "created_at": "ISO8601",
  "started_at": "ISO8601",
  "completed_at": "ISO8601",
  "result": {}                 // execution result
}
```

### Execution Block
```json
{
  "block_id": "number",
  "parallel": "boolean",       // can tasks run parallel?
  "tasks": ["string"],         // task IDs in this block
  "prerequisite_blocks": ["number"], // must complete first
  "estimated_total_hours": "number"
}
```

---

## 🔌 Integration Points

### Input: @plan Output
TEE reads from ProjectPlan folder:
- `ProjectPlan/project-plan.json` - Base project spec
- `ProjectPlan/tech-stack.json` - Technology choices
- `ProjectPlan/features.json` - Feature list
- `ProjectPlan/constraints.json` - Timeline, team, risks

### Output: For Orchestration Engine
TEE generates for orchestration:
- `tee-output/tasks.json` - All tasks
- `tee-output/execution-schedule.json` - When to run
- `tee-output/phase-assignments.json` - Which agent
- `tee-output/orchestration-plan.json` - Full execution plan

### Feedback Loops
TEE monitors:
- Agent execution (logs, outputs)
- Task completion (passed/failed)
- Validation results
- Updates project-plan.json with progress

---

## 🚀 Quick Start

### Phase 1: Parse Tasks from @plan
```bash
npm run tee:parse-tasks \
  --project-plan ./ProjectPlan \
  --output ./tee-output/tasks.json
```

### Phase 2: Resolve Dependencies
```bash
npm run tee:resolve-deps \
  --tasks ./tee-output/tasks.json \
  --tech-stack ./ProjectPlan/tech-stack.json \
  --output ./tee-output/execution-schedule.json
```

### Phase 3: Map to Phases
```bash
npm run tee:map-phases \
  --schedule ./tee-output/execution-schedule.json \
  --phase-flow ./.github/phase-flow.gv \
  --output ./tee-output/phase-assignments.json
```

### Phase 4: Generate Orchestration Plan
```bash
npm run tee:orchestrate \
  --assignments ./tee-output/phase-assignments.json \
  --handoff-matrix ./.github/AGENT_HANDOFF_MATRIX.md \
  --output ./tee-output/orchestration-plan.json
```

---

## 📁 File Structure

```
TaskExtractionEngine/
├── README.md (this file)
├── 01_task-parser.md           # Specifications
├── 02_dependency-resolver.md
├── 03_phase-mapper.md
├── 04_orchestration-planner.md
├── 05_feedback-system.md
├── schemas/
│   ├── task.schema.json        # Task data structure
│   ├── execution-schedule.schema.json
│   ├── phase-assignments.schema.json
│   ├── orchestration-plan.schema.json
│   └── feedback-report.schema.json
├── templates/
│   ├── task-list-template.json
│   ├── execution-schedule-template.json
│   └── orchestration-plan-template.json
├── examples/
│   ├── example-project-plan.json
│   ├── example-tasks.json
│   ├── example-execution-schedule.json
│   └── example-orchestration-plan.json
└── integration/
    ├── @plan-integration.md     # How TEE integrates with @plan
    ├── orchestration-integration.md
    └── feedback-hook-specification.md
```

---

## ✅ Success Metrics

When TEE is fully implemented:

1. ✅ **100% of @plan output** → Converted to executable tasks
2. ✅ **Zero manual task creation** → All from specs
3. ✅ **Dependencies resolved** → Correct execution order
4. ✅ **Agent routing automated** → Right agent gets right task
5. ✅ **Progress tracking** → Real-time status updates
6. ✅ **Feedback loops** → Results go back to @plan

---

## 🎓 Key Concepts

### Task Extraction
Convert high-level requirements (from @plan) into low-level actionable work items that agents can execute.

### Dependency Resolution
Determine ordering - which tasks must complete before others can start.

### Phase Mapping
Assign tasks to correct agent phases based on tech stack and dependencies.

### Orchestration
Coordinate handoffs between agents, manage data contracts, ensure proper sequencing.

### Feedback
Track execution results, validate completeness, update master project plan.

---

## 📖 Next Steps

1. **Read** `01_task-parser.md` - How to extract tasks
2. **Read** `02_dependency-resolver.md` - How to resolve dependencies
3. **Read** `03_phase-mapper.md` - How to map to phases
4. **Read** `04_orchestration-planner.md` - How to plan orchestration
5. **Read** `05_feedback-system.md` - How to track progress
6. **Review** `integration/@plan-integration.md` - Integration points

---

## 🤝 Related Systems

- **Orchestration Engine** (coming next) - Actually executes the plan
- **Validation Framework** - Validates tasks before execution
- **Execution Bridge** - Runs agent commands
- **Feedback Loop** - Reports results back

---

**Questions?** Check the detailed specifications in each component markdown file.
