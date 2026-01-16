/**
 * FeedbackLoop Components Unit Tests
 * 
 * Tests for FL-01 through FL-06:
 * - StatusUpdater
 * - MetricsCollector
 * - ResultAggregator
 * - PlanUpdater
 * - NotificationSystem
 * - DecisionEngine
 * - FeedbackLoop (facade)
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import {
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
  DecisionEngine,
  REMEDIATION_ACTIONS,
  ERROR_SEVERITY,
  FeedbackLoop
} from '../feedback/index.js';

// ============================================================================
// StatusUpdater Tests (FL-01)
// ============================================================================
describe('StatusUpdater (FL-01)', () => {
  let statusUpdater;

  beforeEach(() => {
    statusUpdater = new StatusUpdater();
  });

  it('should initialize execution with tasks and phases', () => {
    const tasks = [
      { task_id: 'task-1', phase_id: 'phase-1', task_name: 'Test Task 1' },
      { task_id: 'task-2', phase_id: 'phase-1', task_name: 'Test Task 2' }
    ];
    const phases = [
      { phase_id: 'phase-1', phase_number: 1, phase_name: 'Phase 1' }
    ];

    const status = statusUpdater.initializeExecution('exec-1', 'plan-1', tasks, phases);

    assert.strictEqual(status.execution_id, 'exec-1');
    assert.strictEqual(status.plan_id, 'plan-1');
    assert.strictEqual(status.overall_state, EXECUTION_STATES.PENDING);
    assert.strictEqual(status.stats.total_tasks, 2);
  });

  it('should update task state from pending to running', () => {
    const tasks = [{ task_id: 'task-1', phase_id: 'phase-1' }];
    const phases = [{ phase_id: 'phase-1', phase_number: 1 }];
    
    statusUpdater.initializeExecution('exec-1', 'plan-1', tasks, phases);
    
    // First transition to scheduled
    statusUpdater.updateTaskState('task-1', EXECUTION_STATES.SCHEDULED);
    const taskStatus = statusUpdater.updateTaskState('task-1', EXECUTION_STATES.RUNNING);

    assert.strictEqual(taskStatus.state, EXECUTION_STATES.RUNNING);
    assert.ok(taskStatus.started_at);
  });

  it('should reject invalid state transitions', () => {
    const tasks = [{ task_id: 'task-1', phase_id: 'phase-1' }];
    const phases = [{ phase_id: 'phase-1', phase_number: 1 }];
    
    statusUpdater.initializeExecution('exec-1', 'plan-1', tasks, phases);

    // Cannot go directly from pending to completed
    assert.throws(() => {
      statusUpdater.updateTaskState('task-1', EXECUTION_STATES.COMPLETED);
    }, /Invalid state transition/);
  });

  it('should calculate progress correctly', () => {
    const tasks = [
      { task_id: 'task-1', phase_id: 'phase-1' },
      { task_id: 'task-2', phase_id: 'phase-1' }
    ];
    const phases = [{ phase_id: 'phase-1', phase_number: 1 }];
    
    statusUpdater.initializeExecution('exec-1', 'plan-1', tasks, phases);
    
    // Complete one task
    statusUpdater.updateTaskState('task-1', EXECUTION_STATES.SCHEDULED);
    statusUpdater.updateTaskState('task-1', EXECUTION_STATES.RUNNING);
    statusUpdater.updateTaskState('task-1', EXECUTION_STATES.COMPLETED);

    const execStatus = statusUpdater.getExecutionStatus('exec-1');
    assert.strictEqual(execStatus.stats.completed, 1);
    assert.strictEqual(execStatus.progress_percentage, 50);
  });

  it('should record errors', () => {
    const tasks = [{ task_id: 'task-1', phase_id: 'phase-1' }];
    const phases = [{ phase_id: 'phase-1', phase_number: 1 }];
    
    statusUpdater.initializeExecution('exec-1', 'plan-1', tasks, phases);
    
    const error = statusUpdater.recordError('exec-1', 'task-1', new Error('Test error'), 'error');

    assert.ok(error.timestamp);
    assert.strictEqual(error.task_id, 'task-1');
    assert.strictEqual(error.severity, 'error');
  });
});

// ============================================================================
// MetricsCollector Tests (FL-02)
// ============================================================================
describe('MetricsCollector (FL-02)', () => {
  let metricsCollector;

  beforeEach(() => {
    metricsCollector = new MetricsCollector();
  });

  it('should initialize collection', () => {
    const collection = metricsCollector.initializeCollection('exec-1');

    assert.strictEqual(collection.execution_id, 'exec-1');
    assert.ok(collection.task_extraction);
    assert.ok(collection.orchestration);
    assert.ok(collection.execution_bridge);
    assert.ok(collection.validation);
  });

  it('should record metrics', () => {
    metricsCollector.initializeCollection('exec-1');
    
    const metric = metricsCollector.record('test_metric', 42, {
      type: METRIC_TYPES.GAUGE,
      component: COMPONENTS.ORCHESTRATION,
      executionId: 'exec-1'
    });

    assert.strictEqual(metric.metric_name, 'test_metric');
    assert.strictEqual(metric.value, 42);
    assert.strictEqual(metric.metric_type, METRIC_TYPES.GAUGE);
  });

  it('should record duration metrics', () => {
    const metric = metricsCollector.recordDuration('task_duration', 1500, {
      component: COMPONENTS.EXECUTION_BRIDGE
    });

    assert.strictEqual(metric.value, 1500);
    assert.strictEqual(metric.unit, 'ms');
    assert.strictEqual(metric.metric_type, METRIC_TYPES.DURATION);
  });

  it('should record execution bridge metrics', () => {
    metricsCollector.initializeCollection('exec-1');
    
    metricsCollector.recordExecutionBridge('exec-1', {
      success: true,
      transport: 'process',
      latency_ms: 500
    });

    const collection = metricsCollector.getCollection('exec-1');
    assert.strictEqual(collection.execution_bridge.total_executions, 1);
    assert.strictEqual(collection.execution_bridge.successful_executions, 1);
    assert.ok(collection.execution_bridge.by_transport.process);
  });

  it('should calculate percentiles', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const percentiles = metricsCollector.calculatePercentiles(values);

    assert.strictEqual(percentiles.p50, 50);
    assert.strictEqual(percentiles.p90, 90);
    assert.strictEqual(percentiles.p99, 100);
  });

  it('should generate dashboard', () => {
    metricsCollector.initializeCollection('exec-1');
    
    const dashboard = metricsCollector.generateDashboard('exec-1');

    assert.strictEqual(dashboard.execution_id, 'exec-1');
    assert.ok(dashboard.overview);
    assert.ok(dashboard.task_extraction);
    assert.ok(dashboard.orchestration);
  });
});

// ============================================================================
// ResultAggregator Tests (FL-03)
// ============================================================================
describe('ResultAggregator (FL-03)', () => {
  let resultAggregator;

  beforeEach(() => {
    resultAggregator = new ResultAggregator();
  });

  it('should initialize result', () => {
    const result = resultAggregator.initializeResult('exec-1', 'plan-1');

    assert.strictEqual(result.execution_id, 'exec-1');
    assert.strictEqual(result.plan_id, 'plan-1');
    assert.strictEqual(result.overall_status, RESULT_STATUS.PARTIAL);
    assert.ok(result.stage_results);
  });

  it('should add task extraction result', () => {
    resultAggregator.initializeResult('exec-1', 'plan-1');
    
    resultAggregator.addTaskExtractionResult('exec-1', {
      success: true,
      tasks_extracted: 10,
      extraction_time_ms: 500
    });

    const result = resultAggregator.getResult('exec-1');
    assert.strictEqual(result.stage_results.task_extraction.tasks_extracted, 10);
    assert.strictEqual(result.consolidated.summary.total_tasks, 10);
  });

  it('should add artifacts with deduplication', () => {
    resultAggregator.initializeResult('exec-1', 'plan-1');
    
    const artifact1 = resultAggregator.addArtifact('exec-1', {
      type: ARTIFACT_TYPES.BICEP_TEMPLATE,
      name: 'main.bicep',
      content: 'resource test'
    });

    // Add same content again
    const artifact2 = resultAggregator.addArtifact('exec-1', {
      type: ARTIFACT_TYPES.BICEP_TEMPLATE,
      name: 'main2.bicep',
      content: 'resource test'  // Same content
    });

    // Should be deduplicated
    assert.strictEqual(artifact1.artifact_id, artifact2.artifact_id);
  });

  it('should finalize result with overall status', () => {
    resultAggregator.initializeResult('exec-1', 'plan-1');
    
    resultAggregator.addTaskExtractionResult('exec-1', { success: true });
    resultAggregator.addOrchestrationResult('exec-1', { success: true });
    resultAggregator.addExecutionBridgeResult('exec-1', { success: true });
    resultAggregator.addValidationResult('exec-1', { success: true });
    resultAggregator.addBicepResolverResult('exec-1', { success: true });

    const result = resultAggregator.finalizeResult('exec-1');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.overall_status, RESULT_STATUS.SUCCEEDED);
  });

  it('should generate consolidated report', () => {
    resultAggregator.initializeResult('exec-1', 'plan-1');
    resultAggregator.addTaskExtractionResult('exec-1', { 
      success: true, 
      tasks_extracted: 5 
    });
    resultAggregator.finalizeResult('exec-1');

    const report = resultAggregator.generateReport('exec-1');

    assert.ok(report.report_id);
    assert.ok(report.summary);
    assert.ok(report.stages);
  });
});

// ============================================================================
// PlanUpdater Tests (FL-04)
// ============================================================================
describe('PlanUpdater (FL-04)', () => {
  let planUpdater;

  beforeEach(() => {
    planUpdater = new PlanUpdater({
      outputDir: './.test-output',
      backupEnabled: false  // Disable backup for tests
    });
  });

  it('should be created with options', () => {
    assert.ok(planUpdater);
    assert.strictEqual(planUpdater.updateMode, UPDATE_MODES.MERGE);
  });

  it('should build execution summary', () => {
    // Access private method for testing
    const summary = planUpdater._buildSummary({}, {
      success: true,
      executed_by: 'test'
    });

    assert.strictEqual(summary.executed_by, 'test');
    assert.strictEqual(summary.execution_count, 1);
  });

  it('should calculate success rate', () => {
    const rate = planUpdater._calculateSuccessRate({
      consolidated: {
        summary: {
          total_tasks: 10,
          completed_tasks: 8
        }
      }
    });

    assert.strictEqual(rate, '80.0');
  });

  it('should support different update modes', () => {
    const modes = [UPDATE_MODES.MERGE, UPDATE_MODES.APPEND, UPDATE_MODES.REPLACE, UPDATE_MODES.VERSION];
    
    for (const mode of modes) {
      const updater = new PlanUpdater({ updateMode: mode });
      assert.strictEqual(updater.updateMode, mode);
    }
  });
});

// ============================================================================
// NotificationSystem Tests (FL-05)
// ============================================================================
describe('NotificationSystem (FL-05)', () => {
  let notificationSystem;

  beforeEach(() => {
    notificationSystem = new NotificationSystem();
  });

  it('should register notification rules', () => {
    const rule = notificationSystem.registerRule({
      trigger: NOTIFICATION_TRIGGERS.EXECUTION_COMPLETED,
      recipients: {
        console: ['test']
      },
      severity: NOTIFICATION_SEVERITY.INFO
    });

    assert.ok(rule.rule_id);
    assert.strictEqual(rule.trigger, NOTIFICATION_TRIGGERS.EXECUTION_COMPLETED);
  });

  it('should send notifications via console provider', async () => {
    const notifications = [];
    notificationSystem.on('notification-sent', (n) => notifications.push(n));

    await notificationSystem.sendNotification({
      channel: NOTIFICATION_CHANNELS.CONSOLE,
      recipient: 'test',
      title: 'Test',
      message: 'Test message'
    });

    assert.strictEqual(notifications.length, 1);
    assert.strictEqual(notifications[0].title, 'Test');
  });

  it('should trigger notifications based on rules', async () => {
    notificationSystem.registerRule({
      trigger: NOTIFICATION_TRIGGERS.PHASE_COMPLETED,
      recipients: {
        console: ['test']
      },
      template: 'phase_completed'
    });

    const triggered = await notificationSystem.notifyPhaseCompleted({
      phase_number: 1,
      phase_name: 'Test Phase',
      duration_ms: 1000
    });

    assert.strictEqual(triggered.length, 1);
  });

  it('should get statistics', () => {
    const stats = notificationSystem.getStatistics();

    assert.strictEqual(stats.total_notifications, 0);
    assert.strictEqual(stats.queue_length, 0);
  });

  it('should support multiple channels', () => {
    const channels = Object.values(NOTIFICATION_CHANNELS);
    
    for (const channel of channels) {
      assert.ok(notificationSystem.channelProviders.has(channel));
    }
  });
});

// ============================================================================
// DecisionEngine Tests (FL-06)
// ============================================================================
describe('DecisionEngine (FL-06)', () => {
  let decisionEngine;

  beforeEach(() => {
    decisionEngine = new DecisionEngine();
  });

  it('should analyze timeout errors and recommend retry', async () => {
    const error = new Error('Connection timeout');
    error.name = 'TimeoutError';

    const decision = await decisionEngine.analyzeAndDecide({
      error,
      task_id: 'task-1',
      retry_count: 0,
      max_retries: 3
    });

    assert.strictEqual(decision.recommended_action, REMEDIATION_ACTIONS.RETRY);
    assert.ok(decision.action_confidence >= 80);
  });

  it('should escalate after max retries', async () => {
    const error = new Error('Connection timeout');
    error.name = 'TimeoutError';

    const decision = await decisionEngine.analyzeAndDecide({
      error,
      task_id: 'task-1',
      retry_count: 3,
      max_retries: 3
    });

    assert.strictEqual(decision.recommended_action, REMEDIATION_ACTIONS.ESCALATE);
  });

  it('should analyze validation errors and recommend escalate', async () => {
    const error = new Error('Schema validation failed');
    error.name = 'ValidationError';

    const decision = await decisionEngine.analyzeAndDecide({
      error,
      task_id: 'task-1'
    });

    assert.strictEqual(decision.recommended_action, REMEDIATION_ACTIONS.ESCALATE);
    assert.ok(decision.action_confidence >= 90);
  });

  it('should execute retry remediation', async () => {
    const error = new Error('Timeout');
    error.name = 'TimeoutError';

    const decision = await decisionEngine.analyzeAndDecide({
      error,
      task_id: 'task-1',
      retry_count: 0
    });

    const result = await decisionEngine.executeRemedy(decision.decision_id);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.details.action, 'retry');
  });

  it('should register custom error patterns', () => {
    decisionEngine.registerErrorPattern({
      pattern_id: 'custom_error',
      name: 'Custom Error',
      match: (error) => error.code === 'CUSTOM_CODE',
      severity: ERROR_SEVERITY.HIGH,
      root_cause: 'Custom error occurred',
      recommended_action: REMEDIATION_ACTIONS.NOTIFY,
      confidence: 85
    });

    assert.ok(decisionEngine.errorPatterns.has('custom_error'));
  });

  it('should track decision outcomes', async () => {
    const error = new Error('Test');
    
    const decision = await decisionEngine.analyzeAndDecide({
      error,
      task_id: 'task-1'
    });

    await decisionEngine.executeRemedy(decision.decision_id);

    const stats = decisionEngine.getStatistics();
    assert.strictEqual(stats.executed_decisions, 1);
  });

  it('should calculate action success rate', async () => {
    const error = new Error('Timeout');
    error.name = 'TimeoutError';

    const decision = await decisionEngine.analyzeAndDecide({
      error,
      task_id: 'task-1'
    });

    await decisionEngine.executeRemedy(decision.decision_id);

    const rate = decisionEngine.getActionSuccessRate(REMEDIATION_ACTIONS.RETRY);
    assert.ok(parseFloat(rate) > 0);
  });
});

// ============================================================================
// FeedbackLoop Facade Tests
// ============================================================================
describe('FeedbackLoop (Facade)', () => {
  let feedbackLoop;

  beforeEach(() => {
    feedbackLoop = new FeedbackLoop();
  });

  it('should initialize all components', async () => {
    const tasks = [
      { task_id: 'task-1', phase_id: 'phase-1' }
    ];
    const phases = [
      { phase_id: 'phase-1', phase_number: 1 }
    ];

    const result = await feedbackLoop.initialize('exec-1', 'plan-1', tasks, phases);

    assert.ok(result.status);
    assert.ok(result.metrics);
    assert.strictEqual(result.execution_id, 'exec-1');
  });

  it('should update task state and return status', async () => {
    const tasks = [{ task_id: 'task-1', phase_id: 'phase-1' }];
    const phases = [{ phase_id: 'phase-1', phase_number: 1 }];
    
    await feedbackLoop.initialize('exec-1', 'plan-1', tasks, phases);

    feedbackLoop.statusUpdater.updateTaskState('task-1', EXECUTION_STATES.SCHEDULED);
    const result = await feedbackLoop.updateTaskState('task-1', EXECUTION_STATES.RUNNING);

    assert.ok(result.taskStatus);
    assert.strictEqual(result.taskStatus.state, EXECUTION_STATES.RUNNING);
  });

  it('should handle errors with decision', async () => {
    const tasks = [{ task_id: 'task-1', phase_id: 'phase-1' }];
    const phases = [{ phase_id: 'phase-1', phase_number: 1 }];
    
    await feedbackLoop.initialize('exec-1', 'plan-1', tasks, phases);

    const decision = await feedbackLoop.handleError('exec-1', new Error('Test error'), {
      task_id: 'task-1'
    });

    assert.ok(decision.decision_id);
    assert.ok(decision.recommended_action);
  });

  it('should add stage results', async () => {
    const tasks = [{ task_id: 'task-1', phase_id: 'phase-1' }];
    const phases = [{ phase_id: 'phase-1', phase_number: 1 }];
    
    await feedbackLoop.initialize('exec-1', 'plan-1', tasks, phases);

    feedbackLoop.addStageResult('exec-1', 'task_extraction', {
      success: true,
      tasks_extracted: 5
    });

    const status = feedbackLoop.getStatus('exec-1');
    assert.ok(status.result.stage_results.task_extraction.success);
  });

  it('should get combined status', async () => {
    const tasks = [{ task_id: 'task-1', phase_id: 'phase-1' }];
    const phases = [{ phase_id: 'phase-1', phase_number: 1 }];
    
    await feedbackLoop.initialize('exec-1', 'plan-1', tasks, phases);

    const status = feedbackLoop.getStatus('exec-1');

    assert.ok(status.execution);
    assert.ok(status.metrics);
    assert.ok(status.result);
  });

  it('should get statistics from all components', () => {
    const stats = feedbackLoop.getStatistics();

    assert.ok(stats.notifications);
    assert.ok(stats.decisions);
  });
});

console.log('FeedbackLoop unit tests loaded');
