# Plan Updater

**Component**: FLS-04  
**Purpose**: Write execution results back to @plan specification  
**Status**: Design Complete  

---

## 🎯 Overview

The Plan Updater writes execution results back into the original `@plan` specification, transforming it from "write-only" to a living document with complete execution history.

Key responsibilities:
1. **Update** task statuses in original plan
2. **Add** execution results and metrics
3. **Maintain** plan version history
4. **Preserve** original structure
5. **Track** execution lineage

---

## 💻 Plan Update Model

### Updated Plan Structure
```typescript
interface UpdatedPlan {
  // Original plan content
  "@plan": {
    metadata: PlanMetadata;
    tasks: TaskDefinition[];
    execution_context: any;
    // ... original plan content preserved
  };
  
  // NEW: Execution history
  "@execution": {
    execution_id: string;
    execution_timestamp: string;
    completed_timestamp: string;
    duration_ms: number;
    
    // Status
    overall_status: 'succeeded' | 'failed' | 'partial';
    success_rate: number;                // %
    quality_score: number;               // 0-100
    
    // Task execution details
    tasks: {
      [task_id: string]: TaskExecutionDetails;
    };
    
    // Phase execution
    phases: {
      [phase_id: string]: PhaseExecutionDetails;
    };
    
    // Results
    results: {
      artifacts: Artifact[];
      resources_created: Resource[];
      errors: ErrorReport[];
      warnings: WarningReport[];
    };
    
    // Metrics
    metrics: {
      total_tasks: number;
      completed: number;
      failed: number;
      average_duration_ms: number;
      total_cost: number;
    };
    
    // Next steps
    next_steps?: string[];
    
    // Recommendations
    recommendations?: string[];
  };
  
  // NEW: Execution summary
  "@summary": {
    executed_by: string;                 // User or system
    execution_count: number;             // How many times run
    last_successful: string;             // Timestamp of last success
    change_summary: {
      resources_created: number;
      resources_modified: number;
      resources_deleted: number;
    };
    tags?: string[];
  };
}

interface TaskExecutionDetails {
  // Original task info
  task_id: string;
  task_name: string;
  
  // Execution status
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  status_updated_at: string;
  
  // Timing
  started_at: string;
  completed_at: string;
  duration_ms: number;
  
  // Result
  result: {
    success: boolean;
    output?: any;
    error?: {
      code: string;
      message: string;
    };
  };
  
  // Validation
  validation_status: 'passed' | 'failed' | 'warned';
  validation_details?: {
    schema: boolean;
    syntax: boolean;
    dependency: boolean;
    security: boolean;
    testing: boolean;
  };
  
  // Metrics
  metrics?: {
    execution_time_ms: number;
    resource_count?: number;
    cost_estimate?: number;
  };
  
  // Lineage
  depends_on?: string[];
  produced_artifacts?: string[];
  
  // Agent execution
  agent_used: string;
  transport_used: string;
}

interface PhaseExecutionDetails {
  phase_number: number;
  phase_name: string;
  
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  status_updated_at: string;
  
  started_at: string;
  completed_at: string;
  duration_ms: number;
  
  tasks_in_phase: number;
  tasks_completed: number;
  tasks_failed: number;
  
  success_rate: number;
}
```

---

## 🔄 Update Plan Process

### Main Update Function
```typescript
async function updatePlanWithExecution(
  originalPlan: any,
  executionResult: ExecutionResult
): Promise<UpdatedPlan> {
  
  const updated: UpdatedPlan = {
    "@plan": JSON.parse(JSON.stringify(originalPlan["@plan"])),
    "@execution": {
      execution_id: executionResult.execution_id,
      execution_timestamp: executionResult.execution_timestamp,
      completed_timestamp: new Date().toISOString(),
      duration_ms: calculateDuration(executionResult),
      
      overall_status: executionResult.overall_status,
      success_rate: calculateSuccessRate(executionResult),
      quality_score: executionResult.consolidated.summary.quality_score || 0,
      
      tasks: {},
      phases: {},
      
      results: {
        artifacts: executionResult.consolidated.artifacts,
        resources_created: extractResources(executionResult),
        errors: executionResult.consolidated.errors,
        warnings: executionResult.consolidated.warnings
      },
      
      metrics: {
        total_tasks: executionResult.consolidated.summary.total_tasks,
        completed: executionResult.consolidated.summary.completed_tasks,
        failed: executionResult.consolidated.summary.failed_tasks,
        average_duration_ms: 0,
        total_cost: executionResult.consolidated.summary.total_cost
      }
    },
    
    "@summary": {
      executed_by: getCurrentUser(),
      execution_count: getExecutionCount(originalPlan) + 1,
      last_successful: determineLastSuccessful(executionResult),
      change_summary: calculateChangesSummary(executionResult)
    }
  };
  
  // Update task details
  for (const taskId in originalPlan["@plan"].tasks) {
    const taskDef = originalPlan["@plan"].tasks[taskId];
    const taskExecution = extractTaskExecution(
      taskId,
      executionResult
    );
    
    updated["@execution"].tasks[taskId] = taskExecution;
  }
  
  // Update phase details
  for (const phaseId in executionResult.stage_results.orchestration.phases) {
    const phaseExec = executionResult.stage_results.orchestration.phases[phaseId];
    
    updated["@execution"].phases[phaseId] = {
      phase_number: phaseExec.phase_number,
      phase_name: getPhaseName(phaseExec.phase_number),
      status: phaseExec.status === 'success' ? 'completed' : 'failed',
      status_updated_at: new Date().toISOString(),
      started_at: phaseExec.started_at,
      completed_at: phaseExec.completed_at,
      duration_ms: phaseExec.duration_ms,
      tasks_in_phase: phaseExec.tasks_in_phase,
      tasks_completed: phaseExec.tasks_completed,
      tasks_failed: phaseExec.tasks_failed,
      success_rate: (phaseExec.tasks_completed / phaseExec.tasks_in_phase) * 100
    };
  }
  
  // Generate recommendations
  updated["@execution"].next_steps = generateNextSteps(executionResult);
  updated["@execution"].recommendations = generateRecommendations(executionResult);
  
  return updated;
}
```

---

## 📝 Plan Modification Strategies

### Merge Strategies
```typescript
type MergeStrategy = 'overwrite' | 'append' | 'merge';

interface MergeOptions {
  preserve_original: boolean;           // Keep original plan unchanged
  append_history: boolean;              // Add to history
  version_control: boolean;             // Track versions
  merge_strategy: MergeStrategy;
}

async function updatePlanFile(
  planPath: string,
  executionResult: ExecutionResult,
  options: MergeOptions = {
    preserve_original: true,
    append_history: true,
    version_control: true,
    merge_strategy: 'append'
  }
): Promise<void> {
  
  // Read original plan
  const originalPlan = await readPlanFile(planPath);
  
  // Create updated plan
  const updated = await updatePlanWithExecution(
    originalPlan,
    executionResult
  );
  
  if (options.preserve_original) {
    // Create backup of original
    const timestamp = Date.now();
    const backupPath = `${planPath}.backup.${timestamp}`;
    await copyFile(planPath, backupPath);
  }
  
  if (options.version_control) {
    // Store version in VCS
    await storeVersion(planPath, updated);
  }
  
  // Merge execution into plan
  switch (options.merge_strategy) {
    case 'overwrite':
      // Replace entire plan
      await writePlanFile(planPath, updated);
      break;
      
    case 'append':
      // Add execution history
      const merged = mergeAppend(originalPlan, updated);
      await writePlanFile(planPath, merged);
      break;
      
    case 'merge':
      // Intelligent merge
      const intelligent = mergeIntelligent(originalPlan, updated);
      await writePlanFile(planPath, intelligent);
      break;
  }
  
  // Create git commit if in repo
  if (isGitRepository(planPath)) {
    await gitCommit(
      planPath,
      `Execution: ${executionResult.execution_id}`
    );
  }
}

function mergeAppend(original: any, updated: UpdatedPlan): any {
  // Keep original plan, append execution history
  const merged = JSON.parse(JSON.stringify(original));
  
  if (!merged["@executions"]) {
    merged["@executions"] = [];
  }
  
  merged["@executions"].push(updated["@execution"]);
  merged["@summary"] = updated["@summary"];
  
  return merged;
}

function mergeIntelligent(original: any, updated: UpdatedPlan): any {
  // Merge intelligently based on content
  const merged = JSON.parse(JSON.stringify(original));
  
  // Update task statuses
  for (const taskId in updated["@execution"].tasks) {
    const execution = updated["@execution"].tasks[taskId];
    
    // Only update if task exists in original
    if (merged["@plan"].tasks[taskId]) {
      merged["@plan"].tasks[taskId]["@execution"] = execution;
    }
  }
  
  // Add execution summary
  merged["@execution"] = updated["@execution"];
  merged["@summary"] = updated["@summary"];
  
  return merged;
}
```

---

## 📊 Execution History

### Maintain Execution History
```typescript
interface ExecutionHistory {
  plan_id: string;
  executions: Array<{
    execution_id: string;
    timestamp: string;
    status: 'succeeded' | 'failed' | 'partial';
    success_rate: number;
    duration_ms: number;
    quality_score: number;
    notes?: string;
  }>;
}

class ExecutionHistoryTracker {
  private history: ExecutionHistory;
  
  async loadHistory(planPath: string): Promise<ExecutionHistory> {
    const historyPath = `${planPath}.history.json`;
    
    try {
      const content = await readFile(historyPath);
      this.history = JSON.parse(content);
    } catch {
      // Create new history
      this.history = {
        plan_id: extractPlanId(planPath),
        executions: []
      };
    }
    
    return this.history;
  }
  
  async recordExecution(
    planPath: string,
    result: ExecutionResult
  ): Promise<void> {
    
    const history = await this.loadHistory(planPath);
    
    history.executions.push({
      execution_id: result.execution_id,
      timestamp: result.execution_timestamp,
      status: result.overall_status,
      success_rate: calculateSuccessRate(result),
      duration_ms: calculateDuration(result),
      quality_score: result.consolidated.summary.quality_score || 0
    });
    
    // Keep last 100 executions
    if (history.executions.length > 100) {
      history.executions = history.executions.slice(-100);
    }
    
    // Save history
    const historyPath = `${planPath}.history.json`;
    await writeFile(historyPath, JSON.stringify(history, null, 2));
  }
  
  getSuccessRate(planPath: string): number {
    if (this.history.executions.length === 0) return 0;
    
    const successful = this.history.executions.filter(
      e => e.status === 'succeeded'
    ).length;
    
    return (successful / this.history.executions.length) * 100;
  }
  
  getTrend(planPath: string, days: number = 7): TrendAnalysis {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const recent = this.history.executions.filter(
      e => new Date(e.timestamp).getTime() > cutoff
    );
    
    return {
      period_days: days,
      execution_count: recent.length,
      average_success_rate: this.average(recent.map(e => e.success_rate)),
      average_quality_score: this.average(recent.map(e => e.quality_score)),
      trend: this.calculateTrend(recent)
    };
  }
}

interface TrendAnalysis {
  period_days: number;
  execution_count: number;
  average_success_rate: number;
  average_quality_score: number;
  trend: 'improving' | 'stable' | 'degrading';
}
```

---

## 🔍 Plan Validation

### Validate Updated Plan
```typescript
async function validateUpdatedPlan(plan: UpdatedPlan): Promise<ValidationResult[]> {
  
  const validations: ValidationResult[] = [];
  
  // Validate original plan preserved
  if (!plan["@plan"]) {
    validations.push({
      severity: 'error',
      message: 'Original plan structure not preserved'
    });
  }
  
  // Validate execution details
  if (!plan["@execution"]) {
    validations.push({
      severity: 'error',
      message: 'Execution details missing'
    });
  } else {
    // Check required fields
    const required = [
      'execution_id',
      'overall_status',
      'success_rate',
      'tasks',
      'metrics'
    ];
    
    for (const field of required) {
      if (!plan["@execution"][field]) {
        validations.push({
          severity: 'error',
          message: `Execution field missing: ${field}`
        });
      }
    }
  }
  
  // Validate summary
  if (!plan["@summary"]) {
    validations.push({
      severity: 'error',
      message: 'Summary section missing'
    });
  }
  
  // Validate task execution details match plan tasks
  if (plan["@plan"].tasks) {
    for (const taskId of Object.keys(plan["@plan"].tasks)) {
      if (!plan["@execution"].tasks[taskId]) {
        validations.push({
          severity: 'warning',
          message: `Task ${taskId} has no execution details`
        });
      }
    }
  }
  
  return validations;
}
```

---

## 💾 Plan Storage & Versioning

### Save with Versioning
```typescript
async function savePlanWithVersioning(
  planPath: string,
  updated: UpdatedPlan,
  options?: { create_backup: boolean; git_commit: boolean }
): Promise<void> {
  
  // Create backup
  if (options?.create_backup) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${planPath}.v${timestamp}.backup`;
    await copyFile(planPath, backupPath);
  }
  
  // Write updated plan
  await writePlanFile(planPath, updated);
  
  // Git commit
  if (options?.git_commit && isGitRepository(planPath)) {
    const message = `Update plan: execution ${updated["@execution"].execution_id}`;
    await gitAdd(planPath);
    await gitCommit(message);
    await gitPush();
  }
}
```

---

## 💡 Key Points

1. **Plan Preservation**: Original plan content kept intact
2. **Execution Details**: Complete execution history added
3. **Versioning**: Historical versions preserved
4. **Git Integration**: Automatic version control commits
5. **Backward Compatible**: Updated plan still valid as input
6. **Audit Trail**: Complete history of all executions
7. **Merge Strategies**: Flexible ways to combine data

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.

---

## 📦 Implementation Addendum (January 2026)

### ✅ IMPLEMENTED

**Location**: `agents/core/feedback/PlanUpdater.js`

**Features Implemented**:
- 4 update modes (merge, append, replace, version)
- Plan loading with caching
- Backup creation with version history
- Task status updates (@execution.tasks)
- Phase status updates (@execution.phases)
- Execution summary (@execution + @summary sections)
- Recommendations and next steps
- Version restoration
- Async file I/O with fs/promises
- EventEmitter for plan events

**Key Classes**:
- `PlanUpdater` - Main class (~350 lines)
- `UPDATE_MODES` - Update mode enum

**Test Coverage**: 4 unit tests in `core/test/feedback.test.js`
