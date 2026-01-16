/**
 * FeedbackLoop Components (FL-01 through FL-06)
 * 
 * This module provides a comprehensive feedback loop system for tracking
 * execution progress, collecting metrics, aggregating results, and making
 * automated remediation decisions.
 * 
 * Components:
 * - StatusUpdater (FL-01): Real-time execution progress tracking
 * - MetricsCollector (FL-02): Performance and quality metrics aggregation
 * - ResultAggregator (FL-03): Consolidate execution outputs
 * - PlanUpdater (FL-04): Write results back to plan specification
 * - NotificationSystem (FL-05): Multi-channel alerts for stakeholders
 * - DecisionEngine (FL-06): Automated remediation decisions
 * 
 * Unblocks:
 * - OE/05_monitoring (via MetricsCollector)
 * - SelfLearning module (via DecisionEngine)
 */

import { StatusUpdater, EXECUTION_STATES } from './StatusUpdater.js';
import { MetricsCollector, METRIC_TYPES, COMPONENTS } from './MetricsCollector.js';
import { ResultAggregator, RESULT_STATUS, ARTIFACT_TYPES } from './ResultAggregator.js';
import { PlanUpdater, UPDATE_MODES } from './PlanUpdater.js';
import { 
  NotificationSystem, 
  NOTIFICATION_CHANNELS, 
  NOTIFICATION_SEVERITY, 
  NOTIFICATION_TRIGGERS,
  DELIVERY_STATUS 
} from './NotificationSystem.js';
import { 
  DecisionEngine, 
  REMEDIATION_ACTIONS, 
  ERROR_SEVERITY, 
  CONFIDENCE_THRESHOLDS 
} from './DecisionEngine.js';
import { EventEmitter } from 'events';

// Re-export all components and constants
export { 
  StatusUpdater, 
  EXECUTION_STATES,
  MetricsCollector, 
  METRIC_TYPES, 
  COMPONENTS,
  ResultAggregator, 
  RESULT_STATUS, 
  ARTIFACT_TYPES,
  PlanUpdater, 
  UPDATE_MODES,
  NotificationSystem, 
  NOTIFICATION_CHANNELS, 
  NOTIFICATION_SEVERITY, 
  NOTIFICATION_TRIGGERS,
  DELIVERY_STATUS,
  DecisionEngine, 
  REMEDIATION_ACTIONS, 
  ERROR_SEVERITY, 
  CONFIDENCE_THRESHOLDS
};

/**
 * FeedbackLoop - High-level facade for the feedback loop system
 * 
 * Combines all components into an integrated feedback system that tracks
 * execution, collects metrics, handles errors, and notifies stakeholders.
 */
export class FeedbackLoop extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Initialize components
    this.statusUpdater = options.statusUpdater || new StatusUpdater(options);
    this.metricsCollector = options.metricsCollector || new MetricsCollector(options);
    this.resultAggregator = options.resultAggregator || new ResultAggregator(options);
    this.planUpdater = options.planUpdater || new PlanUpdater(options);
    this.notificationSystem = options.notificationSystem || new NotificationSystem(options);
    this.decisionEngine = options.decisionEngine || new DecisionEngine(options);
    
    // Connect components
    this._connectComponents();
  }

  /**
   * Initialize feedback loop for a new execution
   */
  async initialize(executionId, planId, tasks, phases, options = {}) {
    // Initialize all components
    this.statusUpdater.initializeExecution(executionId, planId, tasks, phases);
    this.metricsCollector.initializeCollection(executionId);
    this.resultAggregator.initializeResult(executionId, planId);

    // Register default notification rules if provided
    if (options.notificationRules) {
      for (const rule of options.notificationRules) {
        this.notificationSystem.registerRule(rule);
      }
    }

    this.emit('feedback-initialized', { 
      execution_id: executionId, 
      plan_id: planId,
      tasks_count: tasks.length,
      phases_count: phases.length
    });

    return {
      execution_id: executionId,
      status: this.statusUpdater.getExecutionStatus(executionId),
      metrics: this.metricsCollector.getCollection(executionId)
    };
  }

  /**
   * Update task state and trigger relevant actions
   */
  async updateTaskState(taskId, newState, details = {}) {
    const taskStatus = this.statusUpdater.updateTaskState(taskId, newState, details);
    
    // Record metrics
    if (newState === EXECUTION_STATES.COMPLETED) {
      this.metricsCollector.recordDuration('task_duration', taskStatus.duration_ms, {
        component: COMPONENTS.ORCHESTRATION,
        taskId,
        executionId: taskStatus.execution_id
      });
      
      // Notify task completion
      await this.notificationSystem.notifyTaskCompleted(taskStatus);
    } else if (newState === EXECUTION_STATES.FAILED) {
      // Analyze failure and decide on remediation
      if (details.error) {
        const decision = await this.decisionEngine.analyzeAndDecide({
          error: details.error,
          task_id: taskId,
          phase_id: taskStatus.phase_id,
          retry_count: taskStatus.retry_count,
          max_retries: taskStatus.max_retries
        });

        // Notify failure
        await this.notificationSystem.notifyTaskFailed(taskStatus, details.error);

        return { taskStatus, decision };
      }
    }

    return { taskStatus };
  }

  /**
   * Start a phase
   */
  async startPhase(phaseId) {
    const phaseStatus = this.statusUpdater.startPhase(phaseId);
    
    this.metricsCollector.recordOrchestration(phaseStatus.execution_id, {
      phases_started: 1
    });

    await this.notificationSystem.notifyPhaseStarted(phaseStatus);

    return phaseStatus;
  }

  /**
   * Complete a phase
   */
  async completePhase(phaseId, success = true) {
    const phaseStatus = this.statusUpdater.completePhase(phaseId, success);
    
    this.metricsCollector.recordOrchestration(phaseStatus.execution_id, {
      phase: {
        phase_id: phaseId,
        phase_number: phaseStatus.phase_number,
        tasks_completed: phaseStatus.tasks_completed,
        tasks_failed: phaseStatus.tasks_failed,
        phase_duration_ms: phaseStatus.duration_ms
      },
      phases_completed: success ? 1 : 0,
      phases_failed: success ? 0 : 1
    });

    await this.notificationSystem.notifyPhaseCompleted(phaseStatus);

    return phaseStatus;
  }

  /**
   * Add stage results
   */
  addStageResult(executionId, stage, result) {
    switch (stage) {
      case 'task_extraction':
        this.resultAggregator.addTaskExtractionResult(executionId, result);
        this.metricsCollector.recordTaskExtraction(executionId, result);
        break;
      case 'orchestration':
        this.resultAggregator.addOrchestrationResult(executionId, result);
        break;
      case 'execution_bridge':
        this.resultAggregator.addExecutionBridgeResult(executionId, result);
        this.metricsCollector.recordExecutionBridge(executionId, result);
        break;
      case 'validation':
        this.resultAggregator.addValidationResult(executionId, result);
        this.metricsCollector.recordValidation(executionId, result);
        break;
      case 'bicep_resolver':
        this.resultAggregator.addBicepResolverResult(executionId, result);
        this.metricsCollector.recordBicepResolver(executionId, result);
        break;
    }
  }

  /**
   * Add an artifact
   */
  addArtifact(executionId, artifact) {
    return this.resultAggregator.addArtifact(executionId, artifact);
  }

  /**
   * Handle an error with automatic analysis and remediation
   */
  async handleError(executionId, error, context = {}) {
    // Record error in status
    this.statusUpdater.recordError(
      executionId,
      context.task_id,
      error,
      context.severity || 'error'
    );

    // Analyze and decide on remediation
    const decision = await this.decisionEngine.analyzeAndDecide({
      error,
      task_id: context.task_id,
      phase_id: context.phase_id,
      retry_count: context.retry_count || 0,
      max_retries: context.max_retries || 3,
      execution_context: context
    });

    // Notify stakeholders
    await this.notificationSystem.notifyError(error, {
      execution_id: executionId,
      decision,
      ...context
    });

    return decision;
  }

  /**
   * Auto-remediate an error
   */
  async autoRemediate(error, context) {
    return this.decisionEngine.autoRemediate({
      error,
      ...context
    });
  }

  /**
   * Finalize the execution
   */
  async finalize(executionId, planPath = null) {
    // Complete execution status
    const executionStatus = this.statusUpdater.getExecutionStatus(executionId);
    const success = executionStatus.stats.failed === 0;
    
    this.statusUpdater.completeExecution(executionId, success);

    // Finalize metrics
    const metrics = this.metricsCollector.finalizeCollection(executionId);

    // Finalize results
    const result = this.resultAggregator.finalizeResult(executionId);

    // Update plan if path provided
    if (planPath) {
      await this.planUpdater.addExecutionSummary(planPath, result, metrics?.aggregate);
    }

    // Send completion notification
    if (success) {
      await this.notificationSystem.notifyExecutionCompleted(result);
    } else {
      await this.notificationSystem.notifyExecutionFailed(
        new Error(`Execution failed with ${executionStatus.stats.failed} failed tasks`),
        { result }
      );
    }

    this.emit('feedback-finalized', {
      execution_id: executionId,
      success,
      result,
      metrics
    });

    return {
      success,
      status: executionStatus,
      result,
      metrics,
      report: this.resultAggregator.generateReport(executionId),
      dashboard: this.metricsCollector.generateDashboard(executionId)
    };
  }

  /**
   * Get current status
   */
  getStatus(executionId) {
    return {
      execution: this.statusUpdater.getExecutionStatus(executionId),
      metrics: this.metricsCollector.getCollection(executionId),
      result: this.resultAggregator.getResult(executionId)
    };
  }

  /**
   * Get statistics across all components
   */
  getStatistics() {
    return {
      notifications: this.notificationSystem.getStatistics(),
      decisions: this.decisionEngine.getStatistics()
    };
  }

  /**
   * Start all periodic processes
   */
  startProcessing() {
    this.statusUpdater.startPeriodicUpdates((status) => {
      this.emit('status-update', status);
    });
    this.metricsCollector.startPeriodicAggregation();
    this.notificationSystem.startProcessing();
  }

  /**
   * Stop all periodic processes
   */
  stopProcessing() {
    this.statusUpdater.stopPeriodicUpdates();
    this.metricsCollector.stopPeriodicAggregation();
    this.notificationSystem.stopProcessing();
  }

  // Private methods

  _connectComponents() {
    // Connect status updates to metrics
    this.statusUpdater.on('task-state-changed', ({ task_id, new_state, task_status }) => {
      if (new_state === EXECUTION_STATES.RUNNING) {
        this.metricsCollector.increment('tasks_running', {
          component: COMPONENTS.ORCHESTRATION,
          executionId: task_status.execution_id
        });
      }
    });

    // Connect error recording to decision engine
    this.statusUpdater.on('error-recorded', (error) => {
      this.emit('error-recorded', error);
    });

    // Connect decision events
    this.decisionEngine.on('escalation-required', (data) => {
      this.notificationSystem.notifyManualReviewRequired(
        'Decision engine escalation',
        data
      );
    });

    // Forward events
    this.statusUpdater.on('execution-completed', (status) => {
      this.emit('execution-completed', status);
    });

    this.resultAggregator.on('result-finalized', (result) => {
      this.emit('result-finalized', result);
    });
  }
}

export default FeedbackLoop;
