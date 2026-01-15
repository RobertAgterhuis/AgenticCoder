# 04. State Machine Specification

**Component**: Orchestration Engine - Phase 4  
**Purpose**: Track execution state and task transitions  
**Date**: January 13, 2026  
**Status**: Specification

---

## 📖 Overview

The State Machine tracks:
1. Phase transitions
2. Task status changes
3. Artifact availability
4. Dependency satisfaction
5. Retry attempts

---

## 🔀 State Diagrams

### Task State Machine

```
    ┌─────────┐
    │ created │  Task created (initial state)
    └────┬────┘
         │
         ├─ (dependencies not met) ──→ ┌─────────┐
         │                             │ pending │  Waiting for deps
         └─ (dependencies met) ──────→ └────┬────┘
                                           │
                                           ├─→ ┌────────────┐
                                           │   │ ready      │  Ready to execute
                                           └──→└────┬───────┘
                                                    │
                                      (agent picks up)
                                                    ↓
                                            ┌──────────────┐
                                            │ in_progress  │  Currently executing
                                            └──────┬───────┘
                                                   │
                                    ┌──────────────┼──────────────┐
                                    │              │              │
                                    ↓              ↓              ↓
                            (success)      (failure)      (timeout)
                                    │              │              │
                          ┌─────────────────┐     │     ┌─────────────────┐
                          │ completed       │     │     │ failed          │
                          └─────────────────┘     │     └────┬────────────┘
                                                  │          │
                                                  └──────────┤
                                                      (retry check)
                                                      │
                              ┌───────────────────────┴───────────────────┐
                              │                                           │
                        (can retry)                                  (max retries)
                              │                                           │
                              ↓                                           ↓
                        ┌─────────┐                              ┌──────────────┐
                        │ pending │                              │ failed_final │
                        └────┬────┘                              └──────────────┘
                             │
                         (retry)
                             │
                        ┌────────────┐
                        │ in_progress│
                        └────────────┘
```

### Phase State Machine

```
┌─────────┐
│ pending │  Phase waiting for prerequisites
└────┬────┘
     │
     ├─ (condition not met) ──→ ┌───────────┐
     │                          │ skipped   │
     └─ (ready to execute) ───→ └────┬──────┘
                                     │
                         (execute agent)
                                     ↓
                            ┌──────────────────┐
                            │ in_progress      │  Agent executing
                            └────────┬─────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     │               │               │
                   (success)      (failure)      (timeout)
                     │               │               │
            ┌────────────────┐       │       ┌──────────────┐
            │ completed      │       │       │ failed       │
            └────────────────┘       │       └────┬─────────┘
                   │                 │            │
                   │                 └────────────┤
                   │                         (retry)
                   │                          │
                   │          ┌───────────────┴───────────────┐
                   │          │                               │
                   │    (can retry)                    (max retries)
                   │          │                               │
                   │          ↓                               ↓
                   │   ┌──────────────┐           ┌──────────────────┐
                   │   │ in_progress  │           │ failed_permanent │
                   │   └──────────────┘           └──────────────────┘
                   │
            (unlock dependents)
                   │
                   ↓
          (all dependents unlocked)
```

---

## 🎯 Core Methods

### Task Status Transitions

```typescript
class TaskStateMachine {
  
  transitionTo(task: Task, newStatus: TaskStatus): void {
    // Validate transition
    const valid = isValidTransition(task.status, newStatus);
    if (!valid) {
      throw new InvalidTransitionError(
        `Cannot transition from ${task.status} to ${newStatus}`
      );
    }
    
    // Execute transition hooks
    const prevStatus = task.status;
    task.status = newStatus;
    task.updated_at = now();
    
    // Track transition
    task.status_history.push({
      from: prevStatus,
      to: newStatus,
      timestamp: now()
    });
    
    // Handle side effects
    this.handleTransitionSideEffects(task, prevStatus, newStatus);
  }
  
  private handleTransitionSideEffects(
    task: Task,
    prevStatus: TaskStatus,
    newStatus: TaskStatus
  ): void {
    if (newStatus === 'in_progress') {
      task.started_at = now();
    }
    
    if (newStatus === 'completed') {
      task.completed_at = now();
      task.duration_ms = task.completed_at - task.started_at;
      
      // Unlock dependent tasks
      this.unlockDependentTasks(task);
    }
    
    if (newStatus === 'failed') {
      task.failed_at = now();
      this.checkRetryPolicy(task);
    }
  }
  
  private unlockDependentTasks(task: Task): void {
    const dependents = this.findDependents(task.id);
    for (const dependent of dependents) {
      if (this.areDependenciesMet(dependent)) {
        this.transitionTo(dependent, 'ready');
      }
    }
  }
}
```

### Dependency Checking

```typescript
function areDependenciesMet(task: Task, state: EngineState): boolean {
  // Check if all dependencies are completed
  for (const depId of task.depends_on) {
    const depTask = state.tasks[depId];
    if (!depTask || depTask.status !== 'completed') {
      return false;
    }
  }
  
  // Check if all prerequisite artifacts are available
  for (const artifactId of task.requires_artifacts || []) {
    if (!hasArtifact(artifactId)) {
      return false;
    }
  }
  
  return true;
}
```

### Phase Status Transitions

```typescript
class PhaseStateMachine {
  
  transitionPhase(phase: Phase, newStatus: PhaseStatus): void {
    const prevStatus = phase.status;
    phase.status = newStatus;
    phase.updated_at = now();
    
    // Track transition
    phase.status_history.push({
      from: prevStatus,
      to: newStatus,
      timestamp: now()
    });
    
    // Handle side effects
    if (newStatus === 'completed') {
      phase.completed_at = now();
      phase.duration_ms = phase.completed_at - phase.started_at;
      
      // Check for dependent phases
      this.unlockDependentPhases(phase);
    }
    
    if (newStatus === 'failed') {
      phase.failed_at = now();
      this.checkRetryPolicy(phase);
    }
  }
  
  private unlockDependentPhases(phase: Phase): void {
    const dependents = this.findDependentPhases(phase.phase);
    for (const dependent of dependents) {
      if (this.shouldExecutePhase(dependent)) {
        this.transitionPhase(dependent, 'ready');
      }
    }
  }
}
```

---

## 💾 State Persistence

### State Checkpoint

```json
{
  "checkpoint_id": "cp_20260113_001",
  "timestamp": "2026-01-13T12:30:00Z",
  "execution_state": {
    "current_phase": 13,
    "phases_completed": [1, 2, 3, 4, 5, 6, 7, 8],
    "phases_in_progress": [13],
    "phases_pending": [14, 15, 16],
    "tasks": {
      "TASK_001": {
        "status": "completed",
        "started_at": "2026-01-13T12:00:00Z",
        "completed_at": "2026-01-13T12:45:00Z",
        "duration_ms": 2700000
      },
      "TASK_002": {
        "status": "in_progress",
        "started_at": "2026-01-13T12:05:00Z",
        "progress": 65
      }
    }
  }
}
```

### Recovery from Checkpoint

```typescript
async function recoverFromCheckpoint(checkpointId: string): Promise<EngineState> {
  const checkpoint = loadCheckpoint(checkpointId);
  const state = restoreState(checkpoint.execution_state);
  
  logInfo(`Recovered from checkpoint ${checkpointId}`);
  logInfo(`Resuming from phase ${state.current_phase}`);
  
  return state;
}
```

---

## ⚙️ Retry Policy

```json
{
  "retry_policy": {
    "task_max_retries": 3,
    "phase_max_retries": 2,
    "initial_backoff_seconds": 30,
    "max_backoff_seconds": 300,
    "backoff_multiplier": 1.5,
    "retry_conditions": [
      "timeout",
      "agent_unavailable",
      "network_error"
    ],
    "no_retry_conditions": [
      "validation_error",
      "schema_mismatch",
      "circular_dependency"
    ]
  }
}
```

### Backoff Calculation

```typescript
function calculateBackoff(attemptNumber: number, config: RetryPolicy): number {
  const exponentialBackoff = 
    config.initial_backoff_seconds * 
    Math.pow(config.backoff_multiplier, attemptNumber - 1);
  
  return Math.min(exponentialBackoff, config.max_backoff_seconds);
}
```

---

## ✅ Valid State Transitions

| From | To | Condition |
|------|----|-----------| 
| created | pending | Always |
| pending | ready | Dependencies met |
| ready | in_progress | Agent starts |
| in_progress | completed | Agent succeeds |
| in_progress | failed | Agent fails |
| failed | pending | Retry policy allows |
| completed | - | Terminal |
| failed_final | - | Terminal |

---

**Next**: Read `05_monitoring.md` to understand real-time monitoring.
