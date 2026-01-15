# 01. Engine Core Specification

**Component**: Orchestration Engine - Phase 1  
**Purpose**: Main orchestration loop and initialization  
**Date**: January 13, 2026  
**Status**: Specification

---

## 📖 Overview

The Engine Core is the heart of the Orchestration Engine. It:
1. Loads and validates the orchestration plan
2. Initializes execution environment
3. Runs the main orchestration loop
4. Manages overall execution state
5. Handles errors and recovery

**Responsibility**: Make sure the right thing happens at the right time.

---

## 🔄 Initialization Flow

```
START
  │
  ├─→ Load Configuration
  │   ├─> engine.config.json
  │   ├─> Validate paths
  │   └─> Set up logging
  │
  ├─→ Load Orchestration Plan
  │   ├─> orchestration-plan.json
  │   ├─> Validate schema
  │   └─> Parse handoff sequences
  │
  ├─→ Load Project Context
  │   ├─> project-plan.json
  │   ├─> tech-stack.json
  │   ├─> features.json
  │   └─> constraints.json
  │
  ├─→ Initialize State
  │   ├─> Create execution ID
  │   ├─> Set current phase = 1
  │   ├─> Mark prerequisites complete
  │   └─> Initialize task queue
  │
  ├─→ Validate Prerequisites
  │   ├─> Check required artifacts
  │   ├─> Verify agent availability
  │   └─> Confirm paths accessible
  │
  └─→ START ORCHESTRATION LOOP
```

---

## 📥 Input: Configuration Files

### engine.config.json
```json
{
  "orchestration_plan_path": "tee-output/orchestration-plan.json",
  "project_plan_path": "ProjectPlan/project-plan.json",
  "execution_log_path": "tee-output/execution-log.json",
  "state_file_path": "tee-output/engine-state.json",
  "artifact_base_path": "tee-output/artifacts/",
  "max_concurrent_phases": 3,
  "phase_timeout_minutes": 120,
  "task_timeout_minutes": 60,
  "retry_policy": {
    "max_retries": 3,
    "backoff_seconds": 30,
    "backoff_multiplier": 1.5
  },
  "monitoring": {
    "enabled": true,
    "report_frequency_seconds": 60,
    "dashboard_enabled": true
  },
  "update_project_plan": true,
  "strict_validation": true
}
```

### orchestration-plan.json (from TEE)
```json
{
  "handoff_sequence": [...],
  "agent_instructions": {...},
  "execution_strategy": {...},
  "validation": {...}
}
```

---

## 📤 Output: Engine State

### engine-state.json
```json
{
  "execution_id": "exec_20260113_001",
  "execution_status": "in_progress",
  "project_name": "MyApp",
  "start_time": "2026-01-13T12:00:00Z",
  "current_phase": 13,
  "phases_completed": [1, 2, 3, 4, 5, 6, 7, 8],
  "phases_in_progress": [13],
  "phases_pending": [14, 15, 16],
  "tasks_by_status": {
    "completed": ["TASK_001", "TASK_002"],
    "in_progress": ["TASK_003"],
    "pending": ["TASK_004", ...]
  },
  "handoffs_completed": [
    {
      "from": "@plan",
      "to": "@doc",
      "timestamp": "2026-01-13T09:30:00Z",
      "status": "success"
    }
  ],
  "errors": [],
  "warnings": [],
  "metrics": {
    "total_duration_minutes": 180,
    "tasks_completed": 2,
    "tasks_total": 42,
    "completion_percent": 4.8
  }
}
```

---

## 🎯 Core Algorithms

### 1. Phase Execution Loop

```javascript
async function orchestrationLoop(orchestrationPlan, projectPlan) {
  let currentPhase = 1;
  const state = initializeState(orchestrationPlan);
  
  while (currentPhase <= FINAL_PHASE) {
    try {
      // Get phase from plan
      const phase = orchestrationPlan.phases[currentPhase];
      
      // Check if phase should execute
      if (!shouldExecutePhase(phase, state)) {
        logInfo(`Skipping phase ${currentPhase} (conditional gate not met)`);
        currentPhase++;
        continue;
      }
      
      // Execute phase
      logInfo(`Starting phase ${currentPhase}: ${phase.agent}`);
      const result = await executePhase(phase, state);
      
      // Handle result
      if (result.success) {
        logInfo(`Phase ${currentPhase} completed successfully`);
        state.markPhaseComplete(currentPhase);
        
        // Check for parallel phases
        if (canRunParallel(orchestrationPlan, currentPhase)) {
          await executeParallelPhases(orchestrationPlan, state);
        }
        
        currentPhase++;
      } else {
        // Handle failure with retry logic
        const canRetry = state.canRetry(currentPhase);
        if (canRetry) {
          logWarn(`Phase ${currentPhase} failed, retrying...`);
          state.scheduleRetry(currentPhase);
          await backoff(state.getBackoffTime(currentPhase));
        } else {
          logError(`Phase ${currentPhase} failed after ${MAX_RETRIES} retries`);
          throw new OrchestrationError(`Phase ${currentPhase} failed permanently`);
        }
      }
      
    } catch (error) {
      logError(`Orchestration error at phase ${currentPhase}: ${error.message}`);
      state.addError(error);
      
      // Try recovery
      if (state.canRecover()) {
        logInfo(`Attempting recovery...`);
        // Recovery logic
      } else {
        logError(`Cannot recover from error`);
        state.status = 'failed';
        break;
      }
    }
  }
  
  // Finalize
  await finalizeExecution(state);
  return state;
}
```

### 2. State Initialization

```javascript
function initializeState(orchestrationPlan) {
  return {
    executionId: generateExecutionId(),
    status: 'in_progress',
    startTime: now(),
    currentPhase: 1,
    phasesCompleted: [],
    tasksCompleted: {},
    tasksInProgress: {},
    tasksPending: {},
    handoffsCompleted: [],
    errors: [],
    warnings: [],
    
    // Methods
    markPhaseComplete: function(phase) {
      this.phasesCompleted.push(phase);
    },
    
    markTaskComplete: function(taskId, result) {
      this.tasksCompleted[taskId] = {
        completedAt: now(),
        duration: getDuration(this.tasksInProgress[taskId].startedAt),
        result: result
      };
      delete this.tasksInProgress[taskId];
    },
    
    canRetry: function(phase) {
      return (this.phaseRetries[phase] || 0) < MAX_RETRIES;
    },
    
    scheduleRetry: function(phase) {
      this.phaseRetries[phase] = (this.phaseRetries[phase] || 0) + 1;
    }
  };
}
```

### 3. Phase Shouldering Decision

```javascript
function shouldExecutePhase(phase, state) {
  // Check mandatory phases
  if (phase.required === true) {
    return true;
  }
  
  // Check conditional phases
  if (phase.condition) {
    return evaluateCondition(phase.condition, state.projectPlan);
  }
  
  // Check prerequisites
  if (phase.depends_on_phases) {
    return phase.depends_on_phases.every(
      p => state.phasesCompleted.includes(p)
    );
  }
  
  return false;
}
```

### 4. Parallel Phase Coordination

```javascript
async function executeParallelPhases(orchestrationPlan, state) {
  const parallelPhases = identifyParallelPhases(orchestrationPlan, state);
  
  if (parallelPhases.length === 0) return;
  
  logInfo(`Executing ${parallelPhases.length} phases in parallel`);
  
  const promises = parallelPhases.map(phase =>
    executePhase(phase, state)
      .then(result => ({
        phase: phase.phase,
        result: result
      }))
      .catch(error => ({
        phase: phase.phase,
        error: error
      }))
  );
  
  const results = await Promise.all(promises);
  
  // Process results
  for (const { phase, result, error } of results) {
    if (error) {
      logError(`Parallel phase ${phase} failed: ${error.message}`);
      state.addError(error);
    } else if (result.success) {
      state.markPhaseComplete(phase);
    }
  }
}
```

---

## 🔧 Key Methods

### Engine.initialize()
```typescript
async initialize(configPath: string): Promise<void> {
  // Load configuration
  this.config = loadConfig(configPath);
  
  // Load orchestration plan
  this.orchestrationPlan = loadOrchestrationPlan(this.config.orchestration_plan_path);
  
  // Load project context
  this.projectPlan = loadProjectPlan(this.config.project_plan_path);
  
  // Validate plan
  validateOrchestrationPlan(this.orchestrationPlan);
  
  // Initialize state
  this.state = initializeState(this.orchestrationPlan);
  
  // Setup logging
  setupLogging(this.config.execution_log_path);
}
```

### Engine.execute()
```typescript
async execute(): Promise<ExecutionResult> {
  logInfo(`Starting orchestration execution: ${this.state.executionId}`);
  
  try {
    await this.orchestrationLoop();
    
    await this.finalize();
    
    logInfo(`Orchestration completed successfully`);
    return {
      status: 'success',
      executionId: this.state.executionId,
      state: this.state
    };
  } catch (error) {
    logError(`Orchestration failed: ${error.message}`);
    return {
      status: 'failed',
      error: error,
      executionId: this.state.executionId,
      state: this.state
    };
  }
}
```

### Engine.getStatus()
```typescript
getStatus(): EngineStatus {
  return {
    executionId: this.state.executionId,
    status: this.state.status,
    currentPhase: this.state.currentPhase,
    completionPercent: (this.state.phasesCompleted.length / TOTAL_PHASES) * 100,
    tasksCompleted: Object.keys(this.state.tasksCompleted).length,
    tasksTotal: this.orchestrationPlan.total_tasks,
    estimatedTimeRemaining: this.calculateTimeRemaining(),
    errors: this.state.errors,
    warnings: this.state.warnings
  };
}
```

---

## ⚙️ Configuration Options

### Execution Modes

**Normal Mode** (default)
- Sequential phases 1-8
- Conditional phases 9-11
- Parallel phases 12-14
- Finalization 15-16

**Fast Mode**
- Skip some validation
- Max concurrent = 5
- Shorter timeouts

**Debug Mode**
- Verbose logging
- Save intermediate states
- Breakpoints on errors

---

## ✅ Validation Rules

Engine Core validates:

1. ✅ orchestration-plan.json schema valid
2. ✅ All required files exist
3. ✅ Agent definitions available
4. ✅ Phase definitions valid
5. ✅ Conditional logic parseable
6. ✅ State directory writable
7. ✅ Timeout values reasonable

---

## 📊 Metrics Tracked

| Metric | Tracked | Used For |
|--------|---------|----------|
| Execution ID | ✅ | Unique identification |
| Start time | ✅ | Duration calculation |
| Phase durations | ✅ | Velocity tracking |
| Task completion | ✅ | Progress percentage |
| Handoff timing | ✅ | Bottleneck detection |
| Error count | ✅ | Reliability tracking |
| Retry count | ✅ | Stability assessment |

---

**Next**: Read `02_phase-executor.md` to understand phase execution.
