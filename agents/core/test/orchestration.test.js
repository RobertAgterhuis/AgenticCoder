/**
 * Orchestration Monitoring Tests (OE-05)
 * 
 * Tests for OrchestrationMonitor, DashboardGenerator, AlertManager, ReportGenerator
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  OrchestrationMonitor,
  ExecutionState,
  PhaseState,
  TaskState,
  EVENT_TYPES,
  EXECUTION_STATUS
} from '../orchestration/OrchestrationMonitor.js';

import {
  DashboardGenerator,
  THEMES
} from '../orchestration/DashboardGenerator.js';

import {
  AlertManager,
  Alert,
  ALERT_LEVELS,
  ALERT_TYPES
} from '../orchestration/AlertManager.js';

import {
  ReportGenerator,
  REPORT_TYPES,
  REPORT_FORMATS
} from '../orchestration/ReportGenerator.js';

// =============================================================================
// ExecutionState Tests
// =============================================================================

describe('ExecutionState', () => {
  it('should create with default values', () => {
    const state = new ExecutionState('exec-001', 'Test Project');
    
    assert.strictEqual(state.execution_id, 'exec-001');
    assert.strictEqual(state.project_name, 'Test Project');
    assert.strictEqual(state.status, EXECUTION_STATUS.PENDING);
    assert.strictEqual(state.total_phases, 0);
    assert.strictEqual(state.total_tasks, 0);
  });

  it('should compute metrics correctly', () => {
    const state = new ExecutionState('exec-001', 'Test');
    state.status = EXECUTION_STATUS.RUNNING;
    state.start_time = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    state.total_phases = 5;
    state.total_tasks = 10;
    
    // Add some completed tasks
    for (let i = 0; i < 5; i++) {
      const task = new TaskState(`task-${i}`);
      task.status = 'completed';
      state.tasks.set(task.task_id, task);
    }
    
    const metrics = state.getMetrics();
    
    assert.strictEqual(metrics.total_tasks, 10);
    assert.strictEqual(metrics.tasks_completed, 5);
    assert.strictEqual(metrics.task_completion_percent, 50);
    assert.ok(metrics.elapsed_minutes >= 59); // ~60 minutes
  });

  it('should track events', () => {
    const state = new ExecutionState('exec-001');
    
    state.addEvent({ event_type: 'test', message: 'Test event 1' });
    state.addEvent({ event_type: 'test', message: 'Test event 2' });
    state.addEvent({ event_type: 'test', message: 'Test event 3' });
    
    const recent = state.getRecentEvents(2);
    
    assert.strictEqual(recent.length, 2);
    assert.strictEqual(recent[1].message, 'Test event 3');
  });
});

// =============================================================================
// PhaseState Tests
// =============================================================================

describe('PhaseState', () => {
  it('should create phase with default values', () => {
    const phase = new PhaseState('phase-1', '@nodejs');
    
    assert.strictEqual(phase.phase_id, 'phase-1');
    assert.strictEqual(phase.agent_id, '@nodejs');
    assert.strictEqual(phase.status, 'pending');
  });

  it('should calculate duration', () => {
    const phase = new PhaseState('phase-1');
    phase.start_time = new Date(Date.now() - 300000).toISOString(); // 5 minutes ago
    
    const duration = phase.getDurationMinutes();
    
    assert.ok(duration >= 4 && duration <= 6);
  });
});

// =============================================================================
// TaskState Tests
// =============================================================================

describe('TaskState', () => {
  it('should create task with default values', () => {
    const task = new TaskState('task-1', 'phase-1');
    
    assert.strictEqual(task.task_id, 'task-1');
    assert.strictEqual(task.phase_id, 'phase-1');
    assert.strictEqual(task.status, 'pending');
    assert.strictEqual(task.progress_percent, 0);
  });

  it('should calculate duration', () => {
    const task = new TaskState('task-1');
    task.start_time = new Date(Date.now() - 120000).toISOString(); // 2 minutes ago
    
    const duration = task.getDurationMinutes();
    
    assert.ok(duration >= 1 && duration <= 3);
  });
});

// =============================================================================
// OrchestrationMonitor Tests
// =============================================================================

describe('OrchestrationMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new OrchestrationMonitor();
  });

  it('should create with default options', () => {
    assert.ok(monitor instanceof OrchestrationMonitor);
    assert.strictEqual(monitor.executions.size, 0);
  });

  it('should start execution monitoring', () => {
    const state = monitor.startExecution('exec-001', {
      projectName: 'Test Project',
      totalTasks: 10,
      totalPhases: 3
    });
    
    assert.strictEqual(state.execution_id, 'exec-001');
    assert.strictEqual(state.project_name, 'Test Project');
    assert.strictEqual(state.status, EXECUTION_STATUS.RUNNING);
    assert.strictEqual(state.total_tasks, 10);
  });

  it('should get execution metrics', () => {
    monitor.startExecution('exec-001', { totalTasks: 5 });
    
    const metrics = monitor.getExecutionMetrics('exec-001');
    
    assert.ok(metrics);
    assert.strictEqual(metrics.total_tasks, 5);
  });

  it('should record phase events', () => {
    monitor.startExecution('exec-001');
    
    monitor.recordPhaseStart('exec-001', 'phase-1', '@nodejs');
    monitor.recordPhaseComplete('exec-001', 'phase-1');
    
    const state = monitor.getExecution('exec-001');
    const phase = state.phases.get('phase-1');
    
    assert.strictEqual(phase.status, 'completed');
    assert.ok(phase.end_time);
  });

  it('should record handoff events', () => {
    monitor.startExecution('exec-001');
    
    monitor.recordHandoff('exec-001', 'phase-1', 'phase-2', 3);
    
    const state = monitor.getExecution('exec-001');
    const events = state.getRecentEvents(5);
    
    assert.ok(events.some(e => e.event_type === EVENT_TYPES.HANDOFF_COMPLETED));
  });

  it('should record artifacts', () => {
    monitor.startExecution('exec-001');
    
    monitor.recordArtifact('exec-001', { name: 'output.json', type: 'json' });
    
    const state = monitor.getExecution('exec-001');
    
    assert.strictEqual(state.artifacts.length, 1);
    assert.strictEqual(state.artifacts[0].name, 'output.json');
  });

  it('should update task progress', () => {
    monitor.startExecution('exec-001');
    const state = monitor.getExecution('exec-001');
    state.tasks.set('task-1', new TaskState('task-1'));
    
    monitor.updateTaskProgress('exec-001', 'task-1', 50);
    
    assert.strictEqual(state.tasks.get('task-1').progress_percent, 50);
  });

  it('should generate basic dashboard', () => {
    monitor.startExecution('exec-001', { projectName: 'Test' });
    
    const dashboard = monitor.getDashboard('exec-001');
    
    assert.ok(dashboard);
    assert.strictEqual(dashboard.execution_id, 'exec-001');
    assert.ok(dashboard.metrics);
  });

  it('should track statistics', () => {
    monitor.startExecution('exec-001');
    monitor.startExecution('exec-002');
    
    const stats = monitor.getStats();
    
    assert.strictEqual(stats.total_executions, 2);
  });
});

// =============================================================================
// DashboardGenerator Tests
// =============================================================================

describe('DashboardGenerator', () => {
  let dashboard;
  let state;

  beforeEach(() => {
    dashboard = new DashboardGenerator({ width: 70 });
    state = new ExecutionState('exec-001', 'Test Project');
    state.status = EXECUTION_STATUS.RUNNING;
    state.start_time = new Date().toISOString();
    state.total_tasks = 10;
  });

  it('should create with default options', () => {
    assert.ok(dashboard instanceof DashboardGenerator);
    assert.strictEqual(dashboard.options.width, 70);
  });

  it('should generate full dashboard', () => {
    const result = dashboard.generate(state);
    
    assert.ok(result.text);
    assert.ok(result.text.includes('Test Project'));
    assert.ok(result.lines.length > 0);
    assert.ok(result.metrics);
  });

  it('should generate minimal dashboard', () => {
    const minimal = dashboard.generateMinimal(state);
    
    assert.ok(typeof minimal === 'string');
    assert.ok(minimal.includes('Test Project'));
    assert.ok(minimal.includes('%'));
  });

  it('should include progress section', () => {
    const result = dashboard.generate(state);
    
    assert.ok(result.text.includes('PROGRESS'));
  });

  it('should show active tasks when present', () => {
    const task = new TaskState('task-1');
    task.status = 'in_progress';
    task.progress_percent = 50;
    state.tasks.set('task-1', task);
    
    const result = dashboard.generate(state);
    
    assert.ok(result.text.includes('ACTIVE TASKS'));
  });

  it('should animate spinner', () => {
    const frame1 = dashboard.tick();
    const frame2 = dashboard.tick();
    
    assert.ok(frame1);
    assert.ok(frame2);
  });
});

// =============================================================================
// AlertManager Tests
// =============================================================================

describe('AlertManager', () => {
  let alertManager;

  beforeEach(() => {
    alertManager = new AlertManager();
  });

  it('should create with default options', () => {
    assert.ok(alertManager instanceof AlertManager);
    assert.strictEqual(alertManager.alerts.size, 0);
  });

  it('should create alerts', () => {
    const alert = alertManager.createAlert({
      type: ALERT_TYPES.TASK_FAILED,
      level: ALERT_LEVELS.ERROR,
      message: 'Task XYZ failed',
      executionId: 'exec-001',
      taskId: 'task-1'
    });
    
    assert.ok(alert);
    assert.strictEqual(alert.type, ALERT_TYPES.TASK_FAILED);
    assert.strictEqual(alert.level, ALERT_LEVELS.ERROR);
    assert.strictEqual(alertManager.alerts.size, 1);
  });

  it('should deduplicate alerts within window', () => {
    const alert1 = alertManager.createAlert({
      type: ALERT_TYPES.TASK_FAILED,
      executionId: 'exec-001',
      taskId: 'task-1'
    });
    
    const alert2 = alertManager.createAlert({
      type: ALERT_TYPES.TASK_FAILED,
      executionId: 'exec-001',
      taskId: 'task-1'
    });
    
    assert.ok(alert1);
    assert.strictEqual(alert2, null); // Deduplicated
    assert.strictEqual(alertManager.alerts.size, 1);
  });

  it('should acknowledge alerts', () => {
    const alert = alertManager.createAlert({
      type: ALERT_TYPES.TASK_TIMEOUT,
      message: 'Timeout'
    });
    
    alertManager.acknowledgeAlert(alert.id, 'user123');
    
    assert.ok(alert.acknowledged);
    assert.strictEqual(alert.acknowledged_by, 'user123');
  });

  it('should resolve alerts', () => {
    const alert = alertManager.createAlert({
      type: ALERT_TYPES.TASK_BLOCKED,
      message: 'Blocked'
    });
    
    alertManager.resolveAlert(alert.id);
    
    assert.ok(alert.resolved);
    assert.ok(alert.resolved_at);
  });

  it('should get active alerts', () => {
    alertManager.createAlert({ type: ALERT_TYPES.TASK_FAILED, executionId: 'exec-001' });
    alertManager.createAlert({ type: ALERT_TYPES.PHASE_SLOW, executionId: 'exec-001' });
    
    const active = alertManager.getActiveAlerts('exec-001');
    
    assert.strictEqual(active.length, 2);
  });

  it('should check thresholds', () => {
    const alert = alertManager.checkThreshold('task_blocked_minutes', 10, {
      taskId: 'task-1',
      executionId: 'exec-001'
    });
    
    assert.ok(alert);
    assert.strictEqual(alert.type, ALERT_TYPES.TASK_BLOCKED);
    assert.strictEqual(alert.level, ALERT_LEVELS.ERROR); // 10 >= 5*2
  });

  it('should not alert below threshold', () => {
    const alert = alertManager.checkThreshold('task_blocked_minutes', 2, {
      taskId: 'task-1'
    });
    
    assert.strictEqual(alert, null);
  });

  it('should track statistics', () => {
    alertManager.createAlert({ type: ALERT_TYPES.TASK_FAILED, level: ALERT_LEVELS.ERROR });
    alertManager.createAlert({ type: ALERT_TYPES.PHASE_SLOW, level: ALERT_LEVELS.WARNING });
    
    const stats = alertManager.getStats();
    
    assert.strictEqual(stats.total_alerts, 2);
    assert.strictEqual(stats.alerts_by_level[ALERT_LEVELS.ERROR], 1);
    assert.strictEqual(stats.alerts_by_level[ALERT_LEVELS.WARNING], 1);
  });
});

// =============================================================================
// Alert Class Tests
// =============================================================================

describe('Alert', () => {
  it('should create with defaults', () => {
    const alert = new Alert({ message: 'Test alert' });
    
    assert.ok(alert.id);
    assert.strictEqual(alert.message, 'Test alert');
    assert.strictEqual(alert.acknowledged, false);
    assert.strictEqual(alert.resolved, false);
  });

  it('should acknowledge', () => {
    const alert = new Alert({});
    
    alert.acknowledge('tester');
    
    assert.ok(alert.acknowledged);
    assert.strictEqual(alert.acknowledged_by, 'tester');
    assert.ok(alert.acknowledged_at);
  });

  it('should resolve', () => {
    const alert = new Alert({});
    
    alert.resolve();
    
    assert.ok(alert.resolved);
    assert.ok(alert.resolved_at);
  });

  it('should serialize to JSON', () => {
    const alert = new Alert({
      type: ALERT_TYPES.WORKFLOW_FAILED,
      level: ALERT_LEVELS.CRITICAL,
      message: 'Workflow crashed'
    });
    
    const json = alert.toJSON();
    
    assert.strictEqual(json.type, ALERT_TYPES.WORKFLOW_FAILED);
    assert.strictEqual(json.level, ALERT_LEVELS.CRITICAL);
    assert.strictEqual(json.message, 'Workflow crashed');
  });
});

// =============================================================================
// ReportGenerator Tests
// =============================================================================

describe('ReportGenerator', () => {
  let reportGenerator;
  let state;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
    state = new ExecutionState('exec-001', 'Test Project');
    state.status = EXECUTION_STATUS.RUNNING;
    state.start_time = new Date(Date.now() - 3600000).toISOString();
    state.total_tasks = 10;
    state.total_phases = 3;
    
    // Add some completed tasks
    for (let i = 0; i < 5; i++) {
      const task = new TaskState(`task-${i}`, 'phase-1');
      task.status = 'completed';
      task.start_time = new Date(Date.now() - 600000).toISOString();
      task.end_time = new Date().toISOString();
      state.tasks.set(task.task_id, task);
    }
  });

  it('should create with default options', () => {
    assert.ok(reportGenerator instanceof ReportGenerator);
    assert.strictEqual(reportGenerator.options.defaultFormat, REPORT_FORMATS.JSON);
  });

  it('should generate status report (JSON)', () => {
    const report = reportGenerator.generateStatusReport(state);
    
    assert.strictEqual(report.report_type, REPORT_TYPES.STATUS);
    assert.strictEqual(report.execution_id, 'exec-001');
    assert.ok(report.progress);
    assert.ok(report.timeline);
    assert.strictEqual(report.progress.tasks_completed, 5);
  });

  it('should generate status report (Markdown)', () => {
    const report = reportGenerator.generateStatusReport(state, REPORT_FORMATS.MARKDOWN);
    
    assert.ok(typeof report === 'string');
    assert.ok(report.includes('# Status Report'));
    assert.ok(report.includes('exec-001'));
  });

  it('should generate status report (Text)', () => {
    const report = reportGenerator.generateStatusReport(state, REPORT_FORMATS.TEXT);
    
    assert.ok(typeof report === 'string');
    assert.ok(report.includes('Status Report'));
    assert.ok(report.includes('exec-001'));
  });

  it('should generate completion report', () => {
    state.status = EXECUTION_STATUS.COMPLETED;
    state.end_time = new Date().toISOString();
    
    const report = reportGenerator.generateCompletionReport('exec-001', state);
    
    assert.strictEqual(report.report_type, REPORT_TYPES.COMPLETION);
    assert.ok(report.summary);
    assert.ok(report.execution_metrics);
    assert.strictEqual(report.summary.tasks_completed, 5);
  });

  it('should generate performance report', () => {
    const report = reportGenerator.generatePerformanceReport(state);
    
    assert.strictEqual(report.report_type, REPORT_TYPES.PERFORMANCE);
    assert.ok(report.overview);
    assert.ok(report.task_performance);
  });

  it('should generate error report', () => {
    // Add a failed task
    const failedTask = new TaskState('failed-task');
    failedTask.status = 'failed';
    failedTask.error = 'Connection timeout';
    failedTask.retries = 3;
    state.tasks.set('failed-task', failedTask);
    
    const report = reportGenerator.generateErrorReport(state);
    
    assert.strictEqual(report.report_type, REPORT_TYPES.ERROR);
    assert.strictEqual(report.summary.total_failures, 1);
    assert.ok(report.errors_by_type.timeout);
  });

  it('should include recommendations', () => {
    const report = reportGenerator.generateCompletionReport('exec-001', state);
    
    assert.ok(Array.isArray(report.recommendations));
  });

  it('should format markdown tables', () => {
    const report = reportGenerator.generateStatusReport(state, REPORT_FORMATS.MARKDOWN);
    
    assert.ok(report.includes('|'));
    assert.ok(report.includes('---'));
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Monitoring Integration', () => {
  it('should wire monitor to alert manager', () => {
    const monitor = new OrchestrationMonitor();
    const alertManager = new AlertManager();
    
    monitor.attachAlertManager(alertManager);
    
    const state = monitor.startExecution('exec-001', { totalTasks: 5 });
    
    // Simulate a task failure (triggers alert)
    monitor._handleStepError({
      executionId: 'exec-001',
      stepId: 'task-1',
      attempt: 3,
      error: 'Max retries exceeded'
    });
    
    const alerts = alertManager.getActiveAlerts('exec-001');
    
    assert.ok(alerts.length > 0);
    assert.strictEqual(alerts[0].type, ALERT_TYPES.TASK_FAILED);
  });

  it('should wire monitor to dashboard generator', () => {
    const monitor = new OrchestrationMonitor();
    const dashboardGen = new DashboardGenerator();
    
    monitor.attachDashboardGenerator(dashboardGen);
    monitor.startExecution('exec-001', { projectName: 'Integration Test' });
    
    const dashboard = monitor.getDashboard('exec-001');
    
    assert.ok(dashboard);
    assert.ok(dashboard.text);
    assert.ok(dashboard.text.includes('Integration Test'));
  });

  it('should wire monitor to report generator', () => {
    const monitor = new OrchestrationMonitor();
    const reportGen = new ReportGenerator();
    
    monitor.attachReportGenerator(reportGen);
    monitor.startExecution('exec-001', { totalTasks: 3 });
    
    const report = monitor.getStatusReport('exec-001');
    
    assert.ok(report);
    assert.strictEqual(report.report_type, REPORT_TYPES.STATUS);
  });

  it('should track full execution lifecycle', async () => {
    const monitor = new OrchestrationMonitor();
    const alertManager = new AlertManager();
    
    monitor.attachAlertManager(alertManager);
    
    // Start execution
    monitor.startExecution('exec-001', {
      projectName: 'Lifecycle Test',
      totalTasks: 3,
      totalPhases: 2
    });
    
    // Phase 1
    monitor.recordPhaseStart('exec-001', 'phase-1', '@nodejs');
    
    // Task starts
    monitor._handleStepStart({
      executionId: 'exec-001',
      stepId: 'task-1',
      agentId: '@nodejs'
    });
    
    // Task completes
    monitor._handleStepComplete({
      executionId: 'exec-001',
      stepId: 'task-1',
      output: { artifacts: [{ name: 'output.json' }] }
    });
    
    // Phase completes
    monitor.recordPhaseComplete('exec-001', 'phase-1');
    
    // Handoff
    monitor.recordHandoff('exec-001', 'phase-1', 'phase-2', 1);
    
    // Get final metrics
    const metrics = monitor.getExecutionMetrics('exec-001');
    
    assert.strictEqual(metrics.tasks_completed, 1);
    assert.strictEqual(metrics.phases_completed, 1);
    assert.strictEqual(metrics.artifacts_generated, 1);
    
    const stats = monitor.getStats();
    assert.ok(stats.events_processed > 0);
  });
});

console.log('✅ All OE-05 Monitoring tests defined');
