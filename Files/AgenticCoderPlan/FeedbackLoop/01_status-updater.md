# Status Updater

**Component**: FLS-01  
**Purpose**: Real-time execution progress tracking and reporting  
**Status**: Design Complete  

---

## 🎯 Overview

The Status Updater maintains and communicates the real-time status of all executing tasks and orchestration phases.

Key responsibilities:
1. **Track** task execution state transitions
2. **Report** progress in real-time
3. **Maintain** execution timeline
4. **Capture** errors and exceptions
5. **Update** central status repository

---

## 💻 Status Model

### Execution States
```typescript
type ExecutionState = 
  | 'pending'        // Waiting to start
  | 'scheduled'      // Queued for execution
  | 'running'        // Currently executing
  | 'paused'         // Temporarily stopped
  | 'completed'      // Successfully finished
  | 'failed'         // Execution failed
  | 'retry'          // Retrying after failure
  | 'rolled_back'    // Reverted after failure
  | 'cancelled'      // User or system cancelled;

interface TaskStatus {
  // Identification
  task_id: string;
  task_name: string;
  phase_id: string;
  
  // Current state
  state: ExecutionState;
  state_updated_at: string;             // ISO 8601 timestamp
  
  // Progress tracking
  progress_percentage: number;           // 0-100
  started_at?: string;
  completed_at?: string;
  
  // Duration
  duration_ms: number;
  estimated_remaining_ms?: number;
  
  // Result
  result?: {
    success: boolean;
    output?: any;
    error?: {
      code: string;
      message: string;
      details: string;
      stacktrace?: string;
    }
  };
  
  // Retry info
  retry_count: number;
  max_retries: number;
  
  // Metadata
  agent: string;                        // Which agent executed this
  transport: string;                    // webhook, process, docker, api
  tags?: string[];
  
  metadata: {
    [key: string]: any;
  };
}

interface PhaseStatus {
  // Identification
  phase_id: string;
  phase_number: number;                 // 1-15
  phase_name: string;
  
  // Overall state
  state: ExecutionState;
  state_updated_at: string;
  
  // Progress
  progress_percentage: number;
  tasks_total: number;
  tasks_completed: number;
  tasks_failed: number;
  tasks_running: number;
  
  // Duration
  started_at?: string;
  completed_at?: string;
  duration_ms: number;
  
  // Child task statuses
  task_statuses: TaskStatus[];
  
  // Summary
  all_tasks_completed: boolean;
  all_tasks_succeeded: boolean;
}

interface ExecutionStatus {
  // Overall identification
  execution_id: string;
  plan_id: string;
  started_at: string;
  
  // Aggregate state
  overall_state: ExecutionState;
  progress_percentage: number;
  
  // Phase tracking
  current_phase_id: string;
  current_phase_number: number;
  
  phases: PhaseStatus[];
  
  // Statistics
  stats: {
    total_tasks: number;
    completed: number;
    running: number;
    failed: number;
    pending: number;
    average_task_duration_ms: number;
    total_duration_ms: number;
    estimated_remaining_ms: number;
  };
  
  // Errors
  errors: Array<{
    timestamp: string;
    task_id: string;
    error: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}
```

---

## 🔄 Status Transitions

### Task State Machine
```
pending → scheduled → running → completed
  ↓                      ↓         ↓
  └────────────────────→ failed ←──┘
                         ↓
                      retry
                         ↓
                    (back to scheduled)
                         ↓
                    [success or fail again]
```

### Automatic Transitions
```typescript
async function updateTaskStatus(
  taskId: string,
  newState: ExecutionState,
  details?: Partial<TaskStatus>
): Promise<void> {
  
  const task = getTask(taskId);
  const previousState = task.state;
  
  // Validate state transition
  const validTransitions: { [key: string]: ExecutionState[] } = {
    'pending': ['scheduled', 'cancelled'],
    'scheduled': ['running', 'cancelled'],
    'running': ['completed', 'failed', 'paused'],
    'paused': ['running', 'cancelled'],
    'completed': [],                    // Terminal state
    'failed': ['retry', 'rolled_back', 'cancelled'],
    'retry': ['scheduled'],
    'rolled_back': [],                  // Terminal state
    'cancelled': []                     // Terminal state
  };
  
  if (!validTransitions[previousState].includes(newState)) {
    throw new Error(
      `Invalid transition: ${previousState} → ${newState}`
    );
  }
  
  // Update task
  task.state = newState;
  task.state_updated_at = new Date().toISOString();
  
  // Update timing
  if (newState === 'running' && !task.started_at) {
    task.started_at = new Date().toISOString();
  }
  
  if (['completed', 'failed', 'rolled_back', 'cancelled'].includes(newState)) {
    task.completed_at = new Date().toISOString();
    task.duration_ms = new Date(task.completed_at).getTime() - 
                       new Date(task.started_at!).getTime();
  }
  
  // Merge additional details
  Object.assign(task, details);
  
  // Notify listeners
  await notifyStatusChange(task, previousState, newState);
}
```

---

## 📊 Real-Time Status Updates

### Status Store
```typescript
interface StatusStore {
  // In-memory cache
  executions: Map<string, ExecutionStatus>;
  phases: Map<string, PhaseStatus>;
  tasks: Map<string, TaskStatus>;
  
  // Persistence
  saveToFile(path: string): Promise<void>;
  loadFromFile(path: string): Promise<void>;
}

class StatusUpdater {
  private store: StatusStore;
  private listeners: StatusChangeListener[] = [];
  
  // Subscribe to status changes
  subscribe(listener: StatusChangeListener): void {
    this.listeners.push(listener);
  }
  
  // Update task status
  async updateTask(
    taskId: string,
    update: Partial<TaskStatus>
  ): Promise<void> {
    
    const task = this.store.tasks.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    
    // Update task
    const previousState = task.state;
    Object.assign(task, update);
    
    // Update parent phase
    const phase = this.store.phases.get(task.phase_id);
    if (phase) {
      phase.progress_percentage = calculatePhaseProgress(phase);
      phase.tasks_completed = phase.task_statuses.filter(
        t => t.state === 'completed'
      ).length;
      phase.tasks_running = phase.task_statuses.filter(
        t => t.state === 'running'
      ).length;
    }
    
    // Update overall execution
    const execution = this.store.executions.get(
      task.phase_id.split('-')[0]
    );
    if (execution) {
      execution.progress_percentage = calculateOverallProgress(execution);
    }
    
    // Notify listeners
    for (const listener of this.listeners) {
      await listener.onStatusChanged(task, previousState);
    }
    
    // Persist
    await this.store.saveToFile('./execution-status.json');
  }
  
  // Get current status
  getStatus(taskId: string): TaskStatus | undefined {
    return this.store.tasks.get(taskId);
  }
  
  getPhaseStatus(phaseId: string): PhaseStatus | undefined {
    return this.store.phases.get(phaseId);
  }
  
  getExecutionStatus(executionId: string): ExecutionStatus | undefined {
    return this.store.executions.get(executionId);
  }
}

interface StatusChangeListener {
  onStatusChanged(
    task: TaskStatus,
    previousState: ExecutionState
  ): Promise<void>;
}
```

---

## 📈 Progress Calculation

### Calculate Task Progress
```typescript
function calculateTaskProgress(task: TaskStatus): number {
  // If completed, progress is 100%
  if (task.state === 'completed') return 100;
  if (task.state === 'failed') return 0;
  if (task.state === 'rolled_back') return 0;
  
  // Based on state
  const stateProgress: { [key: string]: number } = {
    'pending': 0,
    'scheduled': 10,
    'running': 50,
    'paused': 25,
    'retry': 20
  };
  
  return stateProgress[task.state] ?? 0;
}

function calculatePhaseProgress(phase: PhaseStatus): number {
  if (phase.task_statuses.length === 0) return 0;
  
  const totalProgress = phase.task_statuses.reduce(
    (sum, task) => sum + calculateTaskProgress(task),
    0
  );
  
  return Math.floor(totalProgress / phase.task_statuses.length);
}

function calculateOverallProgress(execution: ExecutionStatus): number {
  if (execution.phases.length === 0) return 0;
  
  const totalProgress = execution.phases.reduce(
    (sum, phase) => sum + phase.progress_percentage,
    0
  );
  
  return Math.floor(totalProgress / execution.phases.length);
}
```

---

## 🕐 Timeline and Duration Tracking

### Execution Timeline
```typescript
interface ExecutionTimeline {
  event_id: string;
  timestamp: string;
  task_id: string;
  event_type: 'state_change' | 'progress_update' | 'error' | 'milestone';
  event_data: {
    previous_state?: ExecutionState;
    new_state?: ExecutionState;
    progress?: number;
    error?: string;
    milestone?: string;
  };
}

class TimelineTracker {
  private timeline: ExecutionTimeline[] = [];
  
  recordEvent(
    taskId: string,
    eventType: string,
    eventData: any
  ): void {
    
    this.timeline.push({
      event_id: generateId(),
      timestamp: new Date().toISOString(),
      task_id: taskId,
      event_type: eventType,
      event_data: eventData
    });
  }
  
  // Calculate task duration
  getTaskDuration(taskId: string): { start: string; end: string; ms: number } | null {
    const startEvent = this.timeline.find(
      e => e.task_id === taskId && 
           e.event_data.new_state === 'running'
    );
    
    const endEvent = this.timeline.find(
      e => e.task_id === taskId && 
           ['completed', 'failed'].includes(e.event_data.new_state)
    );
    
    if (!startEvent || !endEvent) return null;
    
    return {
      start: startEvent.timestamp,
      end: endEvent.timestamp,
      ms: new Date(endEvent.timestamp).getTime() - 
          new Date(startEvent.timestamp).getTime()
    };
  }
  
  // Calculate phase duration
  getPhaseDuration(phaseId: string): { start: string; end: string; ms: number } | null {
    const phaseEvents = this.timeline.filter(
      e => e.task_id.startsWith(phaseId)
    );
    
    if (phaseEvents.length === 0) return null;
    
    const startEvent = phaseEvents[0];
    const endEvent = phaseEvents[phaseEvents.length - 1];
    
    return {
      start: startEvent.timestamp,
      end: endEvent.timestamp,
      ms: new Date(endEvent.timestamp).getTime() - 
          new Date(startEvent.timestamp).getTime()
    };
  }
}
```

---

## 🚨 Error Tracking

### Error Capture
```typescript
async function captureTaskError(
  taskId: string,
  error: Error,
  context?: any
): Promise<void> {
  
  const task = getTask(taskId);
  
  task.result = {
    success: false,
    error: {
      code: error.name,
      message: error.message,
      details: error.stack || JSON.stringify(context),
      stacktrace: error.stack
    }
  };
  
  // Update state
  await updateTaskStatus(taskId, 'failed', {
    result: task.result
  });
  
  // Add to execution errors
  const execution = getExecution(task.phase_id.split('-')[0]);
  execution.errors.push({
    timestamp: new Date().toISOString(),
    task_id: taskId,
    error: error.message,
    severity: 'error'
  });
}
```

---

## 📄 Status Reports

### Generate Status Report
```typescript
function generateStatusReport(
  execution: ExecutionStatus,
  format: 'json' | 'markdown' | 'html'
): string {
  
  if (format === 'json') {
    return JSON.stringify(execution, null, 2);
  }
  
  if (format === 'markdown') {
    return `
# Execution Status Report

**Execution ID**: ${execution.execution_id}
**Status**: ${execution.overall_state}
**Progress**: ${execution.progress_percentage}%
**Started**: ${execution.started_at}

## Summary
- Total Tasks: ${execution.stats.total_tasks}
- Completed: ${execution.stats.completed}
- Failed: ${execution.stats.failed}
- Running: ${execution.stats.running}

## Current Phase
- Phase: ${execution.current_phase_number}
- Progress: ${execution.phases[execution.current_phase_number - 1]?.progress_percentage}%

## Timeline
${execution.phases.map(p => `
### Phase ${p.phase_number}: ${p.phase_name}
- Status: ${p.state}
- Duration: ${(p.duration_ms / 1000).toFixed(1)}s
- Tasks: ${p.tasks_completed}/${p.tasks_total} completed
`).join('\n')}

## Errors
${execution.errors.length > 0 ? execution.errors.map(e => `
- [${e.timestamp}] Task ${e.task_id}: ${e.error}
`).join('\n') : 'No errors'}
    `;
  }
  
  return '';
}
```

---

## 💡 Key Points

1. **Real-Time Updates**: Status changes propagate immediately
2. **State Machine**: Validated transitions prevent invalid states
3. **Timeline Tracking**: Complete audit trail of all events
4. **Error Capture**: Detailed error tracking with context
5. **Progress Calculation**: Aggregate progress from all tasks
6. **Persistence**: Status saved to file for recovery
7. **Event-Driven**: Listeners notified of all changes

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.

---

## 📦 Implementation Addendum (January 2026)

### ✅ IMPLEMENTED

**Location**: `agents/core/feedback/StatusUpdater.js`

**Features Implemented**:
- Full execution state management (9 states: pending, scheduled, running, paused, completed, failed, retry, rolled_back, cancelled)
- State transition validation with VALID_TRANSITIONS map
- Task/Phase/Execution status tracking with Maps
- Progress calculation (percentage-based)
- Duration tracking (started_at, completed_at, duration_ms)
- Error recording with severity levels
- Status history with configurable max size
- Periodic status updates via startPeriodicUpdates()
- EventEmitter events for all state changes
- toJSON() serialization

**Key Classes**:
- `StatusUpdater` - Main class (~400 lines)
- `EXECUTION_STATES` - State enum export

**Test Coverage**: 5 unit tests in `core/test/feedback.test.js`

