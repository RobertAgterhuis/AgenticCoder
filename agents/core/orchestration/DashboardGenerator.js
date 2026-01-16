/**
 * DashboardGenerator (OE-05)
 * 
 * Generates real-time text-based dashboards for orchestration monitoring.
 * Provides ASCII-art style progress visualization.
 */

import { EventEmitter } from 'events';

// Dashboard themes
export const THEMES = {
  DEFAULT: 'default',
  MINIMAL: 'minimal',
  DETAILED: 'detailed'
};

// Progress bar characters
const PROGRESS_CHARS = {
  filled: '█',
  partial: '▓',
  empty: '░',
  check: '✓',
  cross: '✗',
  arrow: '→',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
};

export class DashboardGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      theme: options.theme || THEMES.DEFAULT,
      width: options.width || 70,
      showEvents: options.showEvents !== false,
      maxEvents: options.maxEvents || 5,
      showAlerts: options.showAlerts !== false,
      maxAlerts: options.maxAlerts || 3,
      colorEnabled: options.colorEnabled !== false,
      ...options
    };
    
    this.spinnerFrame = 0;
  }

  /**
   * Generate dashboard from execution state
   */
  generate(executionState) {
    const metrics = executionState.getMetrics();
    const lines = [];
    
    // Header
    lines.push(this._generateHeader(executionState, metrics));
    lines.push('');
    
    // Progress overview
    lines.push(this._generateProgressSection(metrics));
    lines.push('');
    
    // Phase breakdown
    if (executionState.phases.size > 0) {
      lines.push(this._generatePhasesSection(executionState));
      lines.push('');
    }
    
    // Active tasks
    const activeTasks = [...executionState.tasks.values()]
      .filter(t => t.status === 'in_progress');
    if (activeTasks.length > 0) {
      lines.push(this._generateActiveTasksSection(activeTasks));
      lines.push('');
    }
    
    // Recent events
    if (this.options.showEvents) {
      lines.push(this._generateEventsSection(executionState));
      lines.push('');
    }
    
    // Metrics summary
    lines.push(this._generateMetricsSection(metrics));
    lines.push('');
    
    // Alerts
    if (this.options.showAlerts && executionState.active_alerts.length > 0) {
      lines.push(this._generateAlertsSection(executionState.active_alerts));
      lines.push('');
    }
    
    // Footer
    lines.push(this._generateFooter());
    
    return {
      text: lines.join('\n'),
      lines,
      metrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate minimal dashboard (single line)
   */
  generateMinimal(executionState) {
    const metrics = executionState.getMetrics();
    const progressBar = this._createProgressBar(metrics.task_completion_percent, 20);
    const status = this._getStatusEmoji(executionState.status);
    
    return `${status} ${executionState.project_name}: ${progressBar} ${metrics.task_completion_percent}% (${metrics.tasks_completed}/${metrics.total_tasks} tasks)`;
  }

  // ==========================================================================
  // Section Generators
  // ==========================================================================

  _generateHeader(state, metrics) {
    const border = '═'.repeat(this.options.width - 2);
    const title = 'AgenticCoder Orchestration Dashboard';
    const padding = ' '.repeat(Math.max(0, this.options.width - title.length - 4));
    
    const statusEmoji = this._getStatusEmoji(state.status);
    const statusLine = `Project: ${state.project_name.substring(0, 20)}${' '.repeat(Math.max(0, 22 - state.project_name.length))}Execution ID: ${state.execution_id.substring(0, 15)}`;
    const progressLine = `Status: ${statusEmoji} ${state.status.toUpperCase()}${' '.repeat(Math.max(0, 20 - state.status.length))}Progress: ${metrics.task_completion_percent}%`;
    
    return [
      `╔${border}╗`,
      `║ ${title}${padding}║`,
      `╠${border}╣`,
      `║ ${this._padLine(statusLine)} ║`,
      `║ ${this._padLine(progressLine)} ║`
    ].join('\n');
  }

  _generateProgressSection(metrics) {
    const header = '╠' + '═'.repeat(this.options.width - 2) + '╣';
    const progressBar = this._createProgressBar(metrics.task_completion_percent, this.options.width - 20);
    
    return [
      header,
      `║ OVERALL PROGRESS${' '.repeat(this.options.width - 20)}║`,
      `║ ${progressBar} ${String(metrics.task_completion_percent).padStart(3)}% ║`
    ].join('\n');
  }

  _generatePhasesSection(state) {
    const header = '╠' + '═'.repeat(this.options.width - 2) + '╣';
    const lines = [header, `║ PHASES${' '.repeat(this.options.width - 10)}║`];
    
    // Group phases by tier (orchestration 1-8, architecture 9-11, implementation 12+)
    const phases = [...state.phases.entries()];
    
    for (const [phaseId, phase] of phases.slice(0, 6)) { // Show max 6 phases
      const statusIcon = this._getPhaseStatusIcon(phase.status);
      const progress = phase.status === 'completed' ? 100 : 
                       phase.status === 'in_progress' ? 50 : 0;
      const progressBar = this._createProgressBar(progress, 15);
      const agent = phase.agent_id ? `@${phase.agent_id.substring(0, 15)}` : 'pending';
      
      const line = ` ${statusIcon} Phase ${String(phaseId).padEnd(3)}: ${progressBar} ${agent}`;
      lines.push(`║${this._padLine(line)}║`);
    }
    
    if (phases.length > 6) {
      lines.push(`║ ${this._padLine(`  ... and ${phases.length - 6} more phases`)} ║`);
    }
    
    return lines.join('\n');
  }

  _generateActiveTasksSection(tasks) {
    const header = '╠' + '═'.repeat(this.options.width - 2) + '╣';
    const lines = [header, `║ ACTIVE TASKS${' '.repeat(this.options.width - 16)}║`];
    
    for (const task of tasks.slice(0, 4)) { // Show max 4 active tasks
      const progressBar = this._createProgressBar(task.progress_percent, 10);
      const taskName = task.task_id.substring(0, 35);
      const line = ` ${taskName}${' '.repeat(Math.max(1, 36 - taskName.length))}${progressBar} [${task.progress_percent}%]`;
      lines.push(`║${this._padLine(line)}║`);
    }
    
    if (tasks.length > 4) {
      lines.push(`║ ${this._padLine(`  ... and ${tasks.length - 4} more tasks running`)} ║`);
    }
    
    return lines.join('\n');
  }

  _generateEventsSection(state) {
    const header = '╠' + '═'.repeat(this.options.width - 2) + '╣';
    const lines = [header, `║ RECENT EVENTS${' '.repeat(this.options.width - 17)}║`];
    
    const events = state.getRecentEvents(this.options.maxEvents);
    
    for (const event of events) {
      const time = new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false });
      const icon = this._getEventIcon(event.event_type);
      const desc = this._formatEventDescription(event).substring(0, this.options.width - 20);
      
      const line = ` ${time} ${icon} ${desc}`;
      lines.push(`║${this._padLine(line)}║`);
    }
    
    if (events.length === 0) {
      lines.push(`║ ${this._padLine('  No recent events')} ║`);
    }
    
    return lines.join('\n');
  }

  _generateMetricsSection(metrics) {
    const header = '╠' + '═'.repeat(this.options.width - 2) + '╣';
    const lines = [header, `║ METRICS${' '.repeat(this.options.width - 11)}║`];
    
    const metricsData = [
      [`Completion:`, `${metrics.tasks_completed}/${metrics.total_tasks} tasks (${metrics.task_completion_percent}%)`],
      [`Time Elapsed:`, `${this._formatDuration(metrics.elapsed_minutes)}`],
      [`Time Remaining:`, `${this._formatDuration(metrics.estimated_remaining_hours * 60)} (est.)`],
      [`Completion Time:`, metrics.estimated_completion_time ? new Date(metrics.estimated_completion_time).toLocaleString() : 'N/A'],
      [`On Track:`, metrics.on_track ? '✓ Yes' : '✗ Behind schedule']
    ];
    
    for (const [label, value] of metricsData) {
      const line = ` ${label.padEnd(18)}${value}`;
      lines.push(`║${this._padLine(line)}║`);
    }
    
    return lines.join('\n');
  }

  _generateAlertsSection(alerts) {
    const header = '╠' + '═'.repeat(this.options.width - 2) + '╣';
    const lines = [header, `║ ALERTS${' '.repeat(this.options.width - 10)}║`];
    
    for (const alert of alerts.slice(0, this.options.maxAlerts)) {
      const icon = alert.level === 'error' ? '🔴' : alert.level === 'warning' ? '🟡' : 'ℹ️';
      const msg = alert.message.substring(0, this.options.width - 15);
      const line = ` [${icon}] ${msg}`;
      lines.push(`║${this._padLine(line)}║`);
    }
    
    return lines.join('\n');
  }

  _generateFooter() {
    const border = '═'.repeat(this.options.width - 2);
    return `╚${border}╝`;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  _createProgressBar(percent, width) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return PROGRESS_CHARS.filled.repeat(filled) + PROGRESS_CHARS.empty.repeat(empty);
  }

  _padLine(line) {
    const padding = this.options.width - line.length - 3;
    return line + ' '.repeat(Math.max(0, padding));
  }

  _getStatusEmoji(status) {
    const emojis = {
      pending: '⏳',
      running: '🔄',
      paused: '⏸️',
      completed: '✅',
      failed: '❌',
      cancelled: '🚫'
    };
    return emojis[status] || '❓';
  }

  _getPhaseStatusIcon(status) {
    const icons = {
      pending: PROGRESS_CHARS.empty,
      in_progress: PROGRESS_CHARS.partial,
      completed: PROGRESS_CHARS.check,
      failed: PROGRESS_CHARS.cross,
      skipped: '○'
    };
    return icons[status] || '?';
  }

  _getEventIcon(eventType) {
    const icons = {
      task_started: PROGRESS_CHARS.arrow,
      task_completed: PROGRESS_CHARS.check,
      task_failed: PROGRESS_CHARS.cross,
      task_retrying: '↻',
      phase_started: '▶',
      phase_completed: '◆',
      workflow_started: '🚀',
      workflow_completed: '🎉',
      artifact_generated: '📄',
      handoff_completed: '🔄'
    };
    return icons[eventType] || '•';
  }

  _formatEventDescription(event) {
    const type = event.event_type;
    const taskId = event.task_id || event.details?.task_id || '';
    const phaseId = event.phase_id || event.details?.phase_id || '';
    
    if (type.includes('task_completed')) {
      const duration = event.details?.duration_minutes;
      return `${taskId} completed${duration ? ` (${duration}m)` : ''}`;
    }
    if (type.includes('task_started')) {
      return `${taskId} started`;
    }
    if (type.includes('phase_')) {
      return `Phase ${phaseId} ${type.replace('phase_', '')}`;
    }
    if (type.includes('artifact')) {
      return `Artifact: ${event.details?.name || 'generated'}`;
    }
    if (type.includes('handoff')) {
      return `Handoff: ${event.from_phase} → ${event.to_phase}`;
    }
    
    return type.replace(/_/g, ' ');
  }

  _formatDuration(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  /**
   * Advance spinner animation
   */
  tick() {
    this.spinnerFrame = (this.spinnerFrame + 1) % PROGRESS_CHARS.spinner.length;
    return PROGRESS_CHARS.spinner[this.spinnerFrame];
  }
}

export default DashboardGenerator;
