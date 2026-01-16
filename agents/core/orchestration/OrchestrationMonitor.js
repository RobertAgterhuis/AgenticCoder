/**
 * OrchestrationMonitor (OE-05)
 * 
 * Real-time execution monitoring for the Orchestration Engine.
 * Captures events, tracks progress, and provides execution visibility.
 * 
 * Integrates with:
 * - WorkflowEngine (captures workflow events)
 * - MetricsCollector (stores/aggregates metrics)
 * - AlertManager (triggers alerts on conditions)
 * - DashboardGenerator (generates real-time view)
 * - ReportGenerator (generates completion reports)
 */

import { EventEmitter } from 'events';

// Event types we monitor
export const EVENT_TYPES = {
  // Task events
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',
  TASK_FAILED: 'task_failed',
  TASK_RETRYING: 'task_retrying',
  TASK_BLOCKED: 'task_blocked',
  
  // Phase events
  PHASE_STARTED: 'phase_started',
  PHASE_COMPLETED: 'phase_completed',
  PHASE_FAILED: 'phase_failed',
  PHASE_SKIPPED: 'phase_skipped',
  
  // Handoff events
  HANDOFF_STARTED: 'handoff_started',
  HANDOFF_COMPLETED: 'handoff_completed',
  HANDOFF_FAILED: 'handoff_failed',
  
  // Workflow events
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_COMPLETED: 'workflow_completed',
  WORKFLOW_FAILED: 'workflow_failed',
  
  // Artifact events
  ARTIFACT_GENERATED: 'artifact_generated',
  ARTIFACT_VALIDATED: 'artifact_validated',
  ARTIFACT_TRANSFERRED: 'artifact_transferred'
};

// Execution status
export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Execution state tracker
 */
export class ExecutionState {
  constructor(executionId, projectName = 'Unnamed Project') {
    this.execution_id = executionId;
    this.project_name = projectName;
    this.status = EXECUTION_STATUS.PENDING;
    
    // Timestamps
    this.start_time = null;
    this.end_time = null;
    this.last_activity = new Date().toISOString();
    
    // Phase tracking
    this.total_phases = 0;
    this.phases = new Map(); // phaseId -> PhaseState
    this.phase_order = [];
    
    // Task tracking
    this.total_tasks = 0;
    this.tasks = new Map(); // taskId -> TaskState
    
    // Artifact tracking
    this.artifacts = [];
    
    // Event log
    this.events = [];
    this.max_events = 1000;
    
    // Alerts
    this.active_alerts = [];
    
    // Estimates
    this.estimated_total_hours = 0;
    this.actual_hours_spent = 0;
  }

  /**
   * Get computed metrics
   */
  getMetrics() {
    const phasesCompleted = [...this.phases.values()].filter(p => p.status === 'completed').length;
    const phasesInProgress = [...this.phases.values()].filter(p => p.status === 'in_progress').length;
    const phasesPending = [...this.phases.values()].filter(p => p.status === 'pending').length;
    const phasesFailed = [...this.phases.values()].filter(p => p.status === 'failed').length;
    
    const tasksCompleted = [...this.tasks.values()].filter(t => t.status === 'completed').length;
    const tasksInProgress = [...this.tasks.values()].filter(t => t.status === 'in_progress').length;
    const tasksPending = [...this.tasks.values()].filter(t => t.status === 'pending').length;
    const tasksFailed = [...this.tasks.values()].filter(t => t.status === 'failed').length;
    
    const elapsedMs = this.start_time 
      ? (this.end_time ? new Date(this.end_time) : new Date()) - new Date(this.start_time)
      : 0;
    
    // Calculate velocity
    const hoursElapsed = elapsedMs / (1000 * 60 * 60);
    const velocityTasksPerHour = hoursElapsed > 0 ? tasksCompleted / hoursElapsed : 0;
    
    // Estimate remaining
    const remainingTasks = this.total_tasks - tasksCompleted;
    const estimatedRemainingHours = velocityTasksPerHour > 0 
      ? remainingTasks / velocityTasksPerHour 
      : this.estimated_total_hours - this.actual_hours_spent;
    
    return {
      execution_id: this.execution_id,
      status: this.status,
      
      // Phase metrics
      total_phases: this.total_phases,
      phases_completed: phasesCompleted,
      phases_in_progress: phasesInProgress,
      phases_pending: phasesPending,
      phases_failed: phasesFailed,
      phase_completion_percent: this.total_phases > 0 
        ? Math.round((phasesCompleted / this.total_phases) * 100) 
        : 0,
      
      // Task metrics
      total_tasks: this.total_tasks,
      tasks_completed: tasksCompleted,
      tasks_in_progress: tasksInProgress,
      tasks_pending: tasksPending,
      tasks_failed: tasksFailed,
      task_completion_percent: this.total_tasks > 0 
        ? Math.round((tasksCompleted / this.total_tasks) * 100) 
        : 0,
      
      // Time metrics
      start_time: this.start_time,
      current_time: new Date().toISOString(),
      end_time: this.end_time,
      elapsed_minutes: Math.round(elapsedMs / (1000 * 60)),
      elapsed_hours: Math.round(hoursElapsed * 10) / 10,
      
      // Estimates
      estimated_total_hours: this.estimated_total_hours,
      actual_hours_spent: Math.round(hoursElapsed * 10) / 10,
      estimated_remaining_hours: Math.round(estimatedRemainingHours * 10) / 10,
      estimated_completion_time: this.start_time 
        ? new Date(Date.now() + estimatedRemainingHours * 60 * 60 * 1000).toISOString()
        : null,
      
      // Velocity
      velocity_tasks_per_hour: Math.round(velocityTasksPerHour * 10) / 10,
      
      // Status flags
      on_track: tasksFailed === 0 && (tasksCompleted >= (this.total_tasks * (hoursElapsed / (this.estimated_total_hours || 1)))),
      
      // Artifacts
      artifacts_generated: this.artifacts.length,
      artifacts_validated: this.artifacts.filter(a => a.validated).length
    };
  }

  /**
   * Add an event to the log
   */
  addEvent(event) {
    this.events.push({
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    });
    
    // Trim old events
    if (this.events.length > this.max_events) {
      this.events = this.events.slice(-this.max_events);
    }
    
    this.last_activity = new Date().toISOString();
  }

  /**
   * Get recent events
   */
  getRecentEvents(count = 10) {
    return this.events.slice(-count);
  }
}

/**
 * Phase state
 */
export class PhaseState {
  constructor(phaseId, agentId = null) {
    this.phase_id = phaseId;
    this.agent_id = agentId;
    this.status = 'pending';
    this.start_time = null;
    this.end_time = null;
    this.tasks = [];
    this.tasks_completed = 0;
    this.artifacts_generated = [];
    this.retries = 0;
    this.errors = [];
  }

  getDurationMinutes() {
    if (!this.start_time) return 0;
    const end = this.end_time ? new Date(this.end_time) : new Date();
    return Math.round((end - new Date(this.start_time)) / (1000 * 60));
  }
}

/**
 * Task state
 */
export class TaskState {
  constructor(taskId, phaseId = null) {
    this.task_id = taskId;
    this.phase_id = phaseId;
    this.status = 'pending';
    this.agent_id = null;
    this.start_time = null;
    this.end_time = null;
    this.progress_percent = 0;
    this.retries = 0;
    this.error = null;
    this.artifacts = [];
    this.estimated_hours = 0;
    this.actual_hours = 0;
  }

  getDurationMinutes() {
    if (!this.start_time) return 0;
    const end = this.end_time ? new Date(this.end_time) : new Date();
    return Math.round((end - new Date(this.start_time)) / (1000 * 60));
  }
}

/**
 * OrchestrationMonitor - Main monitoring class
 */
export class OrchestrationMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Max executions to track in memory
      maxExecutions: options.maxExecutions || 100,
      // Event sampling rate (1 = all events)
      eventSamplingRate: options.eventSamplingRate || 1,
      // Enable detailed logging
      verbose: options.verbose || false,
      ...options
    };
    
    // Active execution states
    this.executions = new Map(); // executionId -> ExecutionState
    
    // Reference to external components (set via attach methods)
    this.workflowEngine = null;
    this.metricsCollector = null;
    this.alertManager = null;
    this.dashboardGenerator = null;
    this.reportGenerator = null;
    
    // Statistics
    this.stats = {
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      events_processed: 0,
      alerts_generated: 0
    };
  }

  // ==========================================================================
  // Setup & Integration
  // ==========================================================================

  /**
   * Attach to WorkflowEngine to capture events
   */
  attachWorkflowEngine(workflowEngine) {
    this.workflowEngine = workflowEngine;
    
    // Listen to workflow events
    workflowEngine.on('workflow:start', (data) => this._handleWorkflowStart(data));
    workflowEngine.on('workflow:complete', (data) => this._handleWorkflowComplete(data));
    workflowEngine.on('workflow:error', (data) => this._handleWorkflowError(data));
    
    // Listen to step events
    workflowEngine.on('step:start', (data) => this._handleStepStart(data));
    workflowEngine.on('step:complete', (data) => this._handleStepComplete(data));
    workflowEngine.on('step:error', (data) => this._handleStepError(data));
    workflowEngine.on('step:skipped', (data) => this._handleStepSkipped(data));
    
    this.emit('attached', { component: 'WorkflowEngine' });
    return this;
  }

  /**
   * Attach MetricsCollector for metric storage
   */
  attachMetricsCollector(metricsCollector) {
    this.metricsCollector = metricsCollector;
    this.emit('attached', { component: 'MetricsCollector' });
    return this;
  }

  /**
   * Attach AlertManager for alert generation
   */
  attachAlertManager(alertManager) {
    this.alertManager = alertManager;
    this.emit('attached', { component: 'AlertManager' });
    return this;
  }

  /**
   * Attach DashboardGenerator
   */
  attachDashboardGenerator(dashboardGenerator) {
    this.dashboardGenerator = dashboardGenerator;
    this.emit('attached', { component: 'DashboardGenerator' });
    return this;
  }

  /**
   * Attach ReportGenerator
   */
  attachReportGenerator(reportGenerator) {
    this.reportGenerator = reportGenerator;
    this.emit('attached', { component: 'ReportGenerator' });
    return this;
  }

  // ==========================================================================
  // Execution Management
  // ==========================================================================

  /**
   * Start monitoring an execution
   */
  startExecution(executionId, config = {}) {
    const state = new ExecutionState(executionId, config.projectName);
    state.status = EXECUTION_STATUS.RUNNING;
    state.start_time = new Date().toISOString();
    state.total_phases = config.totalPhases || 0;
    state.total_tasks = config.totalTasks || 0;
    state.estimated_total_hours = config.estimatedHours || 0;
    
    // Initialize phases if provided
    if (config.phases) {
      for (const phase of config.phases) {
        const phaseState = new PhaseState(phase.id, phase.agentId);
        phaseState.tasks = phase.tasks || [];
        state.phases.set(phase.id, phaseState);
        state.phase_order.push(phase.id);
      }
    }
    
    this.executions.set(executionId, state);
    this.stats.total_executions++;
    
    // Initialize metrics collection if available
    if (this.metricsCollector) {
      this.metricsCollector.initializeCollection(executionId);
    }
    
    state.addEvent({
      event_type: EVENT_TYPES.WORKFLOW_STARTED,
      execution_id: executionId,
      details: { project_name: state.project_name, total_tasks: state.total_tasks }
    });
    
    this.emit('execution:started', { executionId, state: state.getMetrics() });
    return state;
  }

  /**
   * Get execution state
   */
  getExecution(executionId) {
    return this.executions.get(executionId);
  }

  /**
   * Get execution metrics
   */
  getExecutionMetrics(executionId) {
    const state = this.executions.get(executionId);
    return state ? state.getMetrics() : null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions() {
    return [...this.executions.values()]
      .filter(e => e.status === EXECUTION_STATUS.RUNNING)
      .map(e => e.getMetrics());
  }

  // ==========================================================================
  // Event Handlers (from WorkflowEngine)
  // ==========================================================================

  _handleWorkflowStart(data) {
    const { executionId, workflowId, timestamp } = data;
    
    let state = this.executions.get(executionId);
    if (!state) {
      state = this.startExecution(executionId, { projectName: workflowId });
    }
    
    state.addEvent({
      event_type: EVENT_TYPES.WORKFLOW_STARTED,
      execution_id: executionId,
      workflow_id: workflowId,
      timestamp
    });
    
    this._recordMetric('workflow_started', 1, executionId);
    this.stats.events_processed++;
  }

  _handleWorkflowComplete(data) {
    const { executionId, workflowId, outputs, duration } = data;
    
    const state = this.executions.get(executionId);
    if (!state) return;
    
    state.status = EXECUTION_STATUS.COMPLETED;
    state.end_time = new Date().toISOString();
    
    state.addEvent({
      event_type: EVENT_TYPES.WORKFLOW_COMPLETED,
      execution_id: executionId,
      workflow_id: workflowId,
      details: { duration_ms: duration, outputs_count: Object.keys(outputs || {}).length }
    });
    
    this.stats.successful_executions++;
    this._recordMetric('workflow_completed', 1, executionId);
    this._recordMetric('workflow_duration_ms', duration, executionId);
    
    this.emit('execution:completed', { executionId, metrics: state.getMetrics() });
    
    // Generate completion report if available
    if (this.reportGenerator) {
      this.reportGenerator.generateCompletionReport(executionId, state);
    }
  }

  _handleWorkflowError(data) {
    const { executionId, workflowId, error } = data;
    
    const state = this.executions.get(executionId);
    if (!state) return;
    
    state.status = EXECUTION_STATUS.FAILED;
    state.end_time = new Date().toISOString();
    
    state.addEvent({
      event_type: EVENT_TYPES.WORKFLOW_FAILED,
      execution_id: executionId,
      workflow_id: workflowId,
      details: { error }
    });
    
    this.stats.failed_executions++;
    this._recordMetric('workflow_failed', 1, executionId);
    
    // Generate alert if available
    if (this.alertManager) {
      this.alertManager.createAlert({
        level: 'error',
        type: 'workflow_failed',
        executionId,
        message: `Workflow ${workflowId} failed: ${error}`,
        timestamp: new Date().toISOString()
      });
      this.stats.alerts_generated++;
    }
    
    this.emit('execution:failed', { executionId, error, metrics: state.getMetrics() });
  }

  _handleStepStart(data) {
    const { executionId, stepId, agentId } = data;
    
    const state = this.executions.get(executionId);
    if (!state) return;
    
    // Create or update task state
    let task = state.tasks.get(stepId);
    if (!task) {
      task = new TaskState(stepId);
      state.tasks.set(stepId, task);
    }
    
    task.status = 'in_progress';
    task.agent_id = agentId;
    task.start_time = new Date().toISOString();
    
    state.addEvent({
      event_type: EVENT_TYPES.TASK_STARTED,
      execution_id: executionId,
      task_id: stepId,
      details: { agent_id: agentId }
    });
    
    this._recordMetric('task_started', 1, executionId);
    this.stats.events_processed++;
    
    this.emit('task:started', { executionId, taskId: stepId, agentId });
  }

  _handleStepComplete(data) {
    const { executionId, stepId, output } = data;
    
    const state = this.executions.get(executionId);
    if (!state) return;
    
    const task = state.tasks.get(stepId);
    if (task) {
      task.status = 'completed';
      task.end_time = new Date().toISOString();
      task.progress_percent = 100;
      
      // Track artifacts
      if (output && output.artifacts) {
        task.artifacts = output.artifacts;
        state.artifacts.push(...output.artifacts.map(a => ({
          ...a,
          task_id: stepId,
          validated: false
        })));
      }
    }
    
    state.addEvent({
      event_type: EVENT_TYPES.TASK_COMPLETED,
      execution_id: executionId,
      task_id: stepId,
      details: { duration_minutes: task?.getDurationMinutes() }
    });
    
    this._recordMetric('task_completed', 1, executionId);
    this._recordMetric('task_duration_ms', task?.getDurationMinutes() * 60000 || 0, executionId);
    
    this.emit('task:completed', { executionId, taskId: stepId, duration: task?.getDurationMinutes() });
  }

  _handleStepError(data) {
    const { executionId, stepId, attempt, error } = data;
    
    const state = this.executions.get(executionId);
    if (!state) return;
    
    const task = state.tasks.get(stepId);
    if (task) {
      task.retries = attempt;
      task.error = error;
      
      // Only mark as failed if this is the final attempt (handled by workflow engine)
      if (attempt >= 3) { // Default max retries
        task.status = 'failed';
        task.end_time = new Date().toISOString();
      } else {
        task.status = 'retrying';
      }
    }
    
    state.addEvent({
      event_type: attempt >= 3 ? EVENT_TYPES.TASK_FAILED : EVENT_TYPES.TASK_RETRYING,
      execution_id: executionId,
      task_id: stepId,
      details: { attempt, error }
    });
    
    this._recordMetric('task_error', 1, executionId);
    
    // Generate alert for failures
    if (attempt >= 3 && this.alertManager) {
      this.alertManager.createAlert({
        level: 'error',
        type: 'task_failed',
        executionId,
        taskId: stepId,
        message: `Task ${stepId} failed after ${attempt} attempts: ${error}`,
        timestamp: new Date().toISOString()
      });
      this.stats.alerts_generated++;
    }
    
    this.emit('task:error', { executionId, taskId: stepId, attempt, error });
  }

  _handleStepSkipped(data) {
    const { executionId, stepId, agentId, condition } = data;
    
    const state = this.executions.get(executionId);
    if (!state) return;
    
    const task = state.tasks.get(stepId) || new TaskState(stepId);
    task.status = 'skipped';
    task.agent_id = agentId;
    state.tasks.set(stepId, task);
    
    state.addEvent({
      event_type: EVENT_TYPES.PHASE_SKIPPED,
      execution_id: executionId,
      task_id: stepId,
      details: { agent_id: agentId, condition }
    });
    
    this._recordMetric('task_skipped', 1, executionId);
    this.emit('task:skipped', { executionId, taskId: stepId, condition });
  }

  // ==========================================================================
  // Manual Event Recording
  // ==========================================================================

  /**
   * Record a phase start event
   */
  recordPhaseStart(executionId, phaseId, agentId = null) {
    const state = this.executions.get(executionId);
    if (!state) return;
    
    let phase = state.phases.get(phaseId);
    if (!phase) {
      phase = new PhaseState(phaseId, agentId);
      state.phases.set(phaseId, phase);
    }
    
    phase.status = 'in_progress';
    phase.agent_id = agentId;
    phase.start_time = new Date().toISOString();
    
    state.addEvent({
      event_type: EVENT_TYPES.PHASE_STARTED,
      execution_id: executionId,
      phase_id: phaseId,
      details: { agent_id: agentId }
    });
    
    this._recordMetric('phase_started', 1, executionId);
    this.emit('phase:started', { executionId, phaseId, agentId });
  }

  /**
   * Record a phase completion event
   */
  recordPhaseComplete(executionId, phaseId) {
    const state = this.executions.get(executionId);
    if (!state) return;
    
    const phase = state.phases.get(phaseId);
    if (phase) {
      phase.status = 'completed';
      phase.end_time = new Date().toISOString();
    }
    
    state.addEvent({
      event_type: EVENT_TYPES.PHASE_COMPLETED,
      execution_id: executionId,
      phase_id: phaseId,
      details: { duration_minutes: phase?.getDurationMinutes() }
    });
    
    this._recordMetric('phase_completed', 1, executionId);
    this.emit('phase:completed', { executionId, phaseId, duration: phase?.getDurationMinutes() });
  }

  /**
   * Record a handoff event
   */
  recordHandoff(executionId, fromPhase, toPhase, artifactsCount = 0) {
    const state = this.executions.get(executionId);
    if (!state) return;
    
    state.addEvent({
      event_type: EVENT_TYPES.HANDOFF_COMPLETED,
      execution_id: executionId,
      from_phase: fromPhase,
      to_phase: toPhase,
      details: { artifacts_transferred: artifactsCount }
    });
    
    this._recordMetric('handoff_completed', 1, executionId);
    this.emit('handoff:completed', { executionId, fromPhase, toPhase, artifactsCount });
  }

  /**
   * Record an artifact generation
   */
  recordArtifact(executionId, artifact) {
    const state = this.executions.get(executionId);
    if (!state) return;
    
    state.artifacts.push({
      ...artifact,
      timestamp: new Date().toISOString(),
      validated: false
    });
    
    state.addEvent({
      event_type: EVENT_TYPES.ARTIFACT_GENERATED,
      execution_id: executionId,
      details: artifact
    });
    
    this._recordMetric('artifact_generated', 1, executionId);
    this.emit('artifact:generated', { executionId, artifact });
  }

  /**
   * Update task progress
   */
  updateTaskProgress(executionId, taskId, progressPercent) {
    const state = this.executions.get(executionId);
    if (!state) return;
    
    const task = state.tasks.get(taskId);
    if (task) {
      task.progress_percent = progressPercent;
    }
    
    this.emit('task:progress', { executionId, taskId, progress: progressPercent });
  }

  // ==========================================================================
  // Metrics Recording
  // ==========================================================================

  _recordMetric(name, value, executionId = null) {
    if (this.metricsCollector) {
      this.metricsCollector.record(name, value, {
        component: 'OE',
        executionId
      });
    }
  }

  // ==========================================================================
  // Dashboard & Reports
  // ==========================================================================

  /**
   * Get dashboard data for an execution
   */
  getDashboard(executionId) {
    const state = this.executions.get(executionId);
    if (!state) return null;
    
    if (this.dashboardGenerator) {
      return this.dashboardGenerator.generate(state);
    }
    
    // Basic dashboard without generator
    return {
      execution_id: executionId,
      project_name: state.project_name,
      status: state.status,
      metrics: state.getMetrics(),
      recent_events: state.getRecentEvents(10),
      active_alerts: state.active_alerts,
      phases: [...state.phases.values()].map(p => ({
        id: p.phase_id,
        agent: p.agent_id,
        status: p.status,
        progress: p.tasks_completed
      })),
      active_tasks: [...state.tasks.values()]
        .filter(t => t.status === 'in_progress')
        .map(t => ({
          id: t.task_id,
          agent: t.agent_id,
          progress: t.progress_percent
        }))
    };
  }

  /**
   * Generate status report
   */
  getStatusReport(executionId) {
    const state = this.executions.get(executionId);
    if (!state) return null;
    
    if (this.reportGenerator) {
      return this.reportGenerator.generateStatusReport(state);
    }
    
    // Basic report without generator
    const metrics = state.getMetrics();
    return {
      execution_id: executionId,
      report_time: new Date().toISOString(),
      status: state.status,
      progress: {
        phases_completed: metrics.phases_completed,
        phases_total: metrics.total_phases,
        phase_percent: metrics.phase_completion_percent,
        tasks_completed: metrics.tasks_completed,
        tasks_total: metrics.total_tasks,
        task_percent: metrics.task_completion_percent
      },
      timeline: {
        start_time: metrics.start_time,
        elapsed_minutes: metrics.elapsed_minutes,
        estimated_remaining_hours: metrics.estimated_remaining_hours,
        estimated_completion_time: metrics.estimated_completion_time,
        on_track: metrics.on_track
      },
      recent_events: state.getRecentEvents(10),
      alerts: state.active_alerts,
      metrics
    };
  }

  /**
   * Get monitor statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

export default OrchestrationMonitor;
