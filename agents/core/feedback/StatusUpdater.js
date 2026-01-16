/**
 * StatusUpdater (FL-01)
 * 
 * Real-time execution progress tracking and reporting.
 * Maintains and communicates the status of all executing tasks and orchestration phases.
 * 
 * Responsibilities:
 * - Track task execution state transitions
 * - Report progress in real-time
 * - Maintain execution timeline
 * - Capture errors and exceptions
 * - Update central status repository
 */

import { EventEmitter } from 'events';

// Execution states
export const EXECUTION_STATES = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRY: 'retry',
  ROLLED_BACK: 'rolled_back',
  CANCELLED: 'cancelled'
};

// Valid state transitions
const VALID_TRANSITIONS = {
  [EXECUTION_STATES.PENDING]: [EXECUTION_STATES.SCHEDULED, EXECUTION_STATES.CANCELLED],
  [EXECUTION_STATES.SCHEDULED]: [EXECUTION_STATES.RUNNING, EXECUTION_STATES.CANCELLED],
  [EXECUTION_STATES.RUNNING]: [EXECUTION_STATES.COMPLETED, EXECUTION_STATES.FAILED, EXECUTION_STATES.PAUSED, EXECUTION_STATES.CANCELLED],
  [EXECUTION_STATES.PAUSED]: [EXECUTION_STATES.RUNNING, EXECUTION_STATES.CANCELLED],
  [EXECUTION_STATES.FAILED]: [EXECUTION_STATES.RETRY, EXECUTION_STATES.ROLLED_BACK, EXECUTION_STATES.CANCELLED],
  [EXECUTION_STATES.RETRY]: [EXECUTION_STATES.RUNNING, EXECUTION_STATES.CANCELLED],
  [EXECUTION_STATES.COMPLETED]: [],
  [EXECUTION_STATES.ROLLED_BACK]: [],
  [EXECUTION_STATES.CANCELLED]: []
};

export class StatusUpdater extends EventEmitter {
  constructor(options = {}) {
    super();
    this.executionStatuses = new Map();  // execution_id -> ExecutionStatus
    this.taskStatuses = new Map();       // task_id -> TaskStatus
    this.phaseStatuses = new Map();      // phase_id -> PhaseStatus
    this.statusHistory = [];             // Timeline of all status changes
    this.maxHistorySize = options.maxHistorySize || 10000;
    this.updateInterval = options.updateInterval || 1000;
    this.intervalHandle = null;
  }

  /**
   * Initialize tracking for a new execution
   */
  initializeExecution(executionId, planId, tasks, phases) {
    const now = new Date().toISOString();
    
    // Create execution status
    const executionStatus = {
      execution_id: executionId,
      plan_id: planId,
      started_at: now,
      overall_state: EXECUTION_STATES.PENDING,
      progress_percentage: 0,
      current_phase_id: null,
      current_phase_number: 0,
      phases: [],
      stats: {
        total_tasks: tasks.length,
        completed: 0,
        running: 0,
        failed: 0,
        pending: tasks.length,
        average_task_duration_ms: 0,
        total_duration_ms: 0,
        estimated_remaining_ms: 0
      },
      errors: []
    };
    
    this.executionStatuses.set(executionId, executionStatus);
    
    // Initialize task statuses
    for (const task of tasks) {
      const taskStatus = this._createTaskStatus(task, executionId);
      this.taskStatuses.set(task.task_id, taskStatus);
    }
    
    // Initialize phase statuses
    for (const phase of phases) {
      const phaseStatus = this._createPhaseStatus(phase, executionId, tasks);
      this.phaseStatuses.set(phase.phase_id, phaseStatus);
      executionStatus.phases.push(phaseStatus);
    }
    
    this._recordHistory('execution_initialized', executionId, null, {
      task_count: tasks.length,
      phase_count: phases.length
    });
    
    this.emit('execution-initialized', executionStatus);
    return executionStatus;
  }

  /**
   * Update task state
   */
  updateTaskState(taskId, newState, details = {}) {
    const taskStatus = this.taskStatuses.get(taskId);
    if (!taskStatus) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    const oldState = taskStatus.state;
    
    // Validate transition
    if (!this._isValidTransition(oldState, newState)) {
      throw new Error(`Invalid state transition: ${oldState} -> ${newState}`);
    }
    
    const now = new Date().toISOString();
    
    // Update task status
    taskStatus.state = newState;
    taskStatus.state_updated_at = now;
    
    // Handle state-specific updates
    switch (newState) {
      case EXECUTION_STATES.RUNNING:
        taskStatus.started_at = taskStatus.started_at || now;
        break;
        
      case EXECUTION_STATES.COMPLETED:
        taskStatus.completed_at = now;
        taskStatus.progress_percentage = 100;
        taskStatus.duration_ms = this._calculateDuration(taskStatus.started_at, now);
        if (details.result) {
          taskStatus.result = { success: true, output: details.result };
        }
        break;
        
      case EXECUTION_STATES.FAILED:
        taskStatus.completed_at = now;
        taskStatus.duration_ms = this._calculateDuration(taskStatus.started_at, now);
        if (details.error) {
          taskStatus.result = {
            success: false,
            error: {
              code: details.error.code || 'EXECUTION_ERROR',
              message: details.error.message || String(details.error),
              details: details.error.details || '',
              stacktrace: details.error.stack
            }
          };
        }
        break;
        
      case EXECUTION_STATES.RETRY:
        taskStatus.retry_count++;
        break;
    }
    
    // Merge additional details
    if (details.progress_percentage !== undefined) {
      taskStatus.progress_percentage = details.progress_percentage;
    }
    if (details.metadata) {
      taskStatus.metadata = { ...taskStatus.metadata, ...details.metadata };
    }
    
    // Update parent phase
    this._updatePhaseFromTask(taskStatus);
    
    // Update execution
    this._updateExecutionFromPhases(taskStatus.execution_id);
    
    this._recordHistory('task_state_changed', taskStatus.execution_id, taskId, {
      old_state: oldState,
      new_state: newState,
      details
    });
    
    this.emit('task-state-changed', {
      task_id: taskId,
      old_state: oldState,
      new_state: newState,
      task_status: taskStatus
    });
    
    return taskStatus;
  }

  /**
   * Update task progress (0-100)
   */
  updateTaskProgress(taskId, progressPercentage, estimatedRemainingMs = null) {
    const taskStatus = this.taskStatuses.get(taskId);
    if (!taskStatus) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    taskStatus.progress_percentage = Math.min(100, Math.max(0, progressPercentage));
    if (estimatedRemainingMs !== null) {
      taskStatus.estimated_remaining_ms = estimatedRemainingMs;
    }
    
    // Recalculate phase and execution progress
    this._updatePhaseFromTask(taskStatus);
    this._updateExecutionFromPhases(taskStatus.execution_id);
    
    this.emit('task-progress-updated', {
      task_id: taskId,
      progress_percentage: taskStatus.progress_percentage,
      estimated_remaining_ms: taskStatus.estimated_remaining_ms
    });
    
    return taskStatus;
  }

  /**
   * Start a phase
   */
  startPhase(phaseId) {
    const phaseStatus = this.phaseStatuses.get(phaseId);
    if (!phaseStatus) {
      throw new Error(`Phase not found: ${phaseId}`);
    }
    
    const now = new Date().toISOString();
    phaseStatus.state = EXECUTION_STATES.RUNNING;
    phaseStatus.state_updated_at = now;
    phaseStatus.started_at = now;
    
    // Update execution current phase
    const executionStatus = this.executionStatuses.get(phaseStatus.execution_id);
    if (executionStatus) {
      executionStatus.current_phase_id = phaseId;
      executionStatus.current_phase_number = phaseStatus.phase_number;
      if (executionStatus.overall_state === EXECUTION_STATES.PENDING) {
        executionStatus.overall_state = EXECUTION_STATES.RUNNING;
      }
    }
    
    this._recordHistory('phase_started', phaseStatus.execution_id, phaseId, {
      phase_number: phaseStatus.phase_number
    });
    
    this.emit('phase-started', phaseStatus);
    return phaseStatus;
  }

  /**
   * Complete a phase
   */
  completePhase(phaseId, success = true) {
    const phaseStatus = this.phaseStatuses.get(phaseId);
    if (!phaseStatus) {
      throw new Error(`Phase not found: ${phaseId}`);
    }
    
    const now = new Date().toISOString();
    phaseStatus.state = success ? EXECUTION_STATES.COMPLETED : EXECUTION_STATES.FAILED;
    phaseStatus.state_updated_at = now;
    phaseStatus.completed_at = now;
    phaseStatus.duration_ms = this._calculateDuration(phaseStatus.started_at, now);
    phaseStatus.progress_percentage = 100;
    phaseStatus.all_tasks_completed = true;
    phaseStatus.all_tasks_succeeded = success;
    
    this._recordHistory('phase_completed', phaseStatus.execution_id, phaseId, {
      phase_number: phaseStatus.phase_number,
      success,
      duration_ms: phaseStatus.duration_ms
    });
    
    this.emit('phase-completed', phaseStatus);
    return phaseStatus;
  }

  /**
   * Record an error
   */
  recordError(executionId, taskId, error, severity = 'error') {
    const executionStatus = this.executionStatuses.get(executionId);
    if (!executionStatus) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    
    const errorRecord = {
      timestamp: new Date().toISOString(),
      task_id: taskId,
      error: error.message || String(error),
      severity
    };
    
    executionStatus.errors.push(errorRecord);
    
    this._recordHistory('error_recorded', executionId, taskId, {
      error: error.message,
      severity
    });
    
    this.emit('error-recorded', errorRecord);
    return errorRecord;
  }

  /**
   * Complete an execution
   */
  completeExecution(executionId, success = true) {
    const executionStatus = this.executionStatuses.get(executionId);
    if (!executionStatus) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    
    const now = new Date().toISOString();
    executionStatus.overall_state = success ? EXECUTION_STATES.COMPLETED : EXECUTION_STATES.FAILED;
    executionStatus.completed_at = now;
    executionStatus.progress_percentage = 100;
    executionStatus.stats.total_duration_ms = this._calculateDuration(executionStatus.started_at, now);
    
    this._recordHistory('execution_completed', executionId, null, {
      success,
      duration_ms: executionStatus.stats.total_duration_ms
    });
    
    this.emit('execution-completed', executionStatus);
    return executionStatus;
  }

  /**
   * Get current status for a task
   */
  getTaskStatus(taskId) {
    return this.taskStatuses.get(taskId) || null;
  }

  /**
   * Get current status for a phase
   */
  getPhaseStatus(phaseId) {
    return this.phaseStatuses.get(phaseId) || null;
  }

  /**
   * Get current status for an execution
   */
  getExecutionStatus(executionId) {
    return this.executionStatuses.get(executionId) || null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions() {
    const active = [];
    for (const [id, status] of this.executionStatuses) {
      if (status.overall_state === EXECUTION_STATES.RUNNING || 
          status.overall_state === EXECUTION_STATES.PENDING) {
        active.push(status);
      }
    }
    return active;
  }

  /**
   * Get status history for an execution
   */
  getHistory(executionId = null, limit = 100) {
    let history = this.statusHistory;
    if (executionId) {
      history = history.filter(h => h.execution_id === executionId);
    }
    return history.slice(-limit);
  }

  /**
   * Start periodic status updates
   */
  startPeriodicUpdates(callback) {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
    
    this.intervalHandle = setInterval(() => {
      const activeExecutions = this.getActiveExecutions();
      for (const execution of activeExecutions) {
        // Recalculate estimated remaining time
        this._updateEstimatedRemaining(execution);
        callback(execution);
      }
    }, this.updateInterval);
  }

  /**
   * Stop periodic updates
   */
  stopPeriodicUpdates() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Create serializable snapshot of all statuses
   */
  toJSON() {
    return {
      executions: Array.from(this.executionStatuses.values()),
      tasks: Array.from(this.taskStatuses.values()),
      phases: Array.from(this.phaseStatuses.values()),
      history_count: this.statusHistory.length
    };
  }

  // Private methods

  _createTaskStatus(task, executionId) {
    return {
      task_id: task.task_id,
      task_name: task.task_name || task.name || task.task_id,
      phase_id: task.phase_id,
      execution_id: executionId,
      state: EXECUTION_STATES.PENDING,
      state_updated_at: new Date().toISOString(),
      progress_percentage: 0,
      started_at: null,
      completed_at: null,
      duration_ms: 0,
      estimated_remaining_ms: null,
      result: null,
      retry_count: 0,
      max_retries: task.max_retries || 3,
      agent: task.agent || 'unknown',
      transport: task.transport || 'process',
      tags: task.tags || [],
      metadata: task.metadata || {}
    };
  }

  _createPhaseStatus(phase, executionId, tasks) {
    const phaseTasks = tasks.filter(t => t.phase_id === phase.phase_id);
    return {
      phase_id: phase.phase_id,
      phase_number: phase.phase_number || phase.order || 0,
      phase_name: phase.phase_name || phase.name || phase.phase_id,
      execution_id: executionId,
      state: EXECUTION_STATES.PENDING,
      state_updated_at: new Date().toISOString(),
      progress_percentage: 0,
      tasks_total: phaseTasks.length,
      tasks_completed: 0,
      tasks_failed: 0,
      tasks_running: 0,
      started_at: null,
      completed_at: null,
      duration_ms: 0,
      task_statuses: [],
      all_tasks_completed: false,
      all_tasks_succeeded: false
    };
  }

  _isValidTransition(fromState, toState) {
    const validTargets = VALID_TRANSITIONS[fromState];
    return validTargets && validTargets.includes(toState);
  }

  _calculateDuration(startTime, endTime) {
    if (!startTime) return 0;
    return new Date(endTime).getTime() - new Date(startTime).getTime();
  }

  _updatePhaseFromTask(taskStatus) {
    const phaseStatus = this.phaseStatuses.get(taskStatus.phase_id);
    if (!phaseStatus) return;
    
    // Get all tasks for this phase
    const phaseTasks = Array.from(this.taskStatuses.values())
      .filter(t => t.phase_id === taskStatus.phase_id);
    
    // Count states
    let completed = 0, failed = 0, running = 0;
    let totalProgress = 0;
    
    for (const task of phaseTasks) {
      if (task.state === EXECUTION_STATES.COMPLETED) completed++;
      else if (task.state === EXECUTION_STATES.FAILED) failed++;
      else if (task.state === EXECUTION_STATES.RUNNING) running++;
      totalProgress += task.progress_percentage;
    }
    
    phaseStatus.tasks_completed = completed;
    phaseStatus.tasks_failed = failed;
    phaseStatus.tasks_running = running;
    phaseStatus.progress_percentage = phaseTasks.length > 0 
      ? Math.round(totalProgress / phaseTasks.length) 
      : 0;
    phaseStatus.task_statuses = phaseTasks;
  }

  _updateExecutionFromPhases(executionId) {
    const executionStatus = this.executionStatuses.get(executionId);
    if (!executionStatus) return;
    
    // Get all tasks for this execution
    const allTasks = Array.from(this.taskStatuses.values())
      .filter(t => t.execution_id === executionId);
    
    // Count states
    let completed = 0, failed = 0, running = 0, pending = 0;
    let totalDuration = 0;
    
    for (const task of allTasks) {
      if (task.state === EXECUTION_STATES.COMPLETED) {
        completed++;
        totalDuration += task.duration_ms;
      } else if (task.state === EXECUTION_STATES.FAILED) {
        failed++;
        totalDuration += task.duration_ms;
      } else if (task.state === EXECUTION_STATES.RUNNING) {
        running++;
      } else {
        pending++;
      }
    }
    
    executionStatus.stats.completed = completed;
    executionStatus.stats.failed = failed;
    executionStatus.stats.running = running;
    executionStatus.stats.pending = pending;
    executionStatus.stats.average_task_duration_ms = completed > 0 
      ? Math.round(totalDuration / completed) 
      : 0;
    
    // Calculate progress
    executionStatus.progress_percentage = allTasks.length > 0
      ? Math.round((completed / allTasks.length) * 100)
      : 0;
  }

  _updateEstimatedRemaining(executionStatus) {
    const { stats } = executionStatus;
    if (stats.average_task_duration_ms > 0 && stats.pending > 0) {
      stats.estimated_remaining_ms = stats.average_task_duration_ms * stats.pending;
    }
  }

  _recordHistory(eventType, executionId, entityId, details) {
    const record = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      execution_id: executionId,
      entity_id: entityId,
      details
    };
    
    this.statusHistory.push(record);
    
    // Trim history if needed
    if (this.statusHistory.length > this.maxHistorySize) {
      this.statusHistory = this.statusHistory.slice(-this.maxHistorySize);
    }
  }
}

export default StatusUpdater;
