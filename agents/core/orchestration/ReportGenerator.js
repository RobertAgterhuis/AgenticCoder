/**
 * ReportGenerator (OE-05)
 * 
 * Generates status and completion reports for orchestration executions.
 * Supports multiple formats: JSON, Markdown, Text.
 */

import { EventEmitter } from 'events';

// Report types
export const REPORT_TYPES = {
  STATUS: 'status',           // Real-time status report
  COMPLETION: 'completion',   // Final completion report
  DAILY: 'daily',             // Daily summary
  PERFORMANCE: 'performance', // Performance analysis
  ERROR: 'error'              // Error summary
};

// Report formats
export const REPORT_FORMATS = {
  JSON: 'json',
  MARKDOWN: 'markdown',
  TEXT: 'text'
};

export class ReportGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      defaultFormat: options.defaultFormat || REPORT_FORMATS.JSON,
      includeRecommendations: options.includeRecommendations !== false,
      maxEventsInReport: options.maxEventsInReport || 20,
      ...options
    };
  }

  // ==========================================================================
  // Status Report
  // ==========================================================================

  /**
   * Generate real-time status report
   */
  generateStatusReport(executionState, format = null) {
    const metrics = executionState.getMetrics();
    
    const report = {
      report_type: REPORT_TYPES.STATUS,
      execution_id: executionState.execution_id,
      project_name: executionState.project_name,
      report_time: new Date().toISOString(),
      status: executionState.status,
      
      progress: {
        phases_completed: metrics.phases_completed,
        phases_total: metrics.total_phases,
        phase_percent: metrics.phase_completion_percent,
        tasks_completed: metrics.tasks_completed,
        tasks_in_progress: metrics.tasks_in_progress,
        tasks_pending: metrics.tasks_pending,
        tasks_failed: metrics.tasks_failed,
        tasks_total: metrics.total_tasks,
        task_percent: metrics.task_completion_percent
      },
      
      timeline: {
        start_time: metrics.start_time,
        current_time: metrics.current_time,
        elapsed_minutes: metrics.elapsed_minutes,
        elapsed_hours: metrics.elapsed_hours,
        estimated_total_hours: metrics.estimated_total_hours,
        estimated_remaining_hours: metrics.estimated_remaining_hours,
        estimated_completion_time: metrics.estimated_completion_time,
        on_track: metrics.on_track
      },
      
      velocity: {
        tasks_per_hour: metrics.velocity_tasks_per_hour,
        current_rate: metrics.tasks_completed > 0 
          ? (metrics.elapsed_hours / metrics.tasks_completed).toFixed(2) + ' hours/task'
          : 'N/A'
      },
      
      artifacts: {
        generated: metrics.artifacts_generated,
        validated: metrics.artifacts_validated
      },
      
      recent_events: executionState.getRecentEvents(this.options.maxEventsInReport),
      active_alerts: executionState.active_alerts,
      
      metrics: metrics
    };
    
    return this._formatReport(report, format || this.options.defaultFormat);
  }

  // ==========================================================================
  // Completion Report
  // ==========================================================================

  /**
   * Generate final completion report
   */
  generateCompletionReport(executionId, executionState, format = null) {
    const metrics = executionState.getMetrics();
    
    // Calculate efficiency
    const efficiency = metrics.estimated_total_hours > 0
      ? Math.round((metrics.actual_hours_spent / metrics.estimated_total_hours) * 100)
      : 100;
    
    // Gather failed tasks
    const failedTasks = [...executionState.tasks.values()]
      .filter(t => t.status === 'failed')
      .map(t => ({
        task_id: t.task_id,
        phase_id: t.phase_id,
        error: t.error,
        retries: t.retries
      }));
    
    // Gather skipped phases
    const skippedPhases = [...executionState.phases.values()]
      .filter(p => p.status === 'skipped')
      .map(p => p.phase_id);
    
    const report = {
      report_type: REPORT_TYPES.COMPLETION,
      execution_id: executionId,
      project_name: executionState.project_name,
      status: executionState.status,
      completion_time: new Date().toISOString(),
      
      summary: {
        total_phases: metrics.total_phases,
        phases_executed: metrics.phases_completed,
        phases_skipped: skippedPhases.length,
        phases_failed: metrics.phases_failed,
        total_tasks: metrics.total_tasks,
        tasks_completed: metrics.tasks_completed,
        tasks_failed: metrics.tasks_failed,
        tasks_skipped: [...executionState.tasks.values()].filter(t => t.status === 'skipped').length,
        success_rate: metrics.total_tasks > 0 
          ? Math.round((metrics.tasks_completed / metrics.total_tasks) * 100)
          : 0
      },
      
      execution_metrics: {
        start_time: metrics.start_time,
        end_time: metrics.end_time || metrics.current_time,
        total_duration_minutes: metrics.elapsed_minutes,
        total_duration_hours: metrics.elapsed_hours,
        estimated_hours: metrics.estimated_total_hours,
        actual_hours: metrics.elapsed_hours,
        efficiency_percent: efficiency
      },
      
      artifacts_generated: {
        total: executionState.artifacts.length,
        by_type: this._groupArtifactsByType(executionState.artifacts),
        all_valid: executionState.artifacts.every(a => a.validated),
        validation_rate: executionState.artifacts.length > 0
          ? Math.round((executionState.artifacts.filter(a => a.validated).length / executionState.artifacts.length) * 100)
          : 100
      },
      
      failures: {
        count: failedTasks.length,
        tasks: failedTasks,
        phases_with_failures: [...new Set(failedTasks.map(t => t.phase_id))].filter(Boolean)
      },
      
      skipped: {
        phases: skippedPhases,
        reason: 'Conditional execution - dependencies not met'
      },
      
      recommendations: this.options.includeRecommendations 
        ? this._generateRecommendations(executionState, metrics)
        : []
    };
    
    this.emit('report:generated', { type: REPORT_TYPES.COMPLETION, executionId });
    
    return this._formatReport(report, format || this.options.defaultFormat);
  }

  // ==========================================================================
  // Performance Report
  // ==========================================================================

  /**
   * Generate performance analysis report
   */
  generatePerformanceReport(executionState, format = null) {
    const metrics = executionState.getMetrics();
    
    // Calculate phase durations
    const phaseDurations = [...executionState.phases.values()]
      .filter(p => p.status === 'completed')
      .map(p => ({
        phase_id: p.phase_id,
        agent_id: p.agent_id,
        duration_minutes: p.getDurationMinutes(),
        tasks_count: p.tasks.length,
        retries: p.retries
      }))
      .sort((a, b) => b.duration_minutes - a.duration_minutes);
    
    // Calculate task durations
    const taskDurations = [...executionState.tasks.values()]
      .filter(t => t.status === 'completed')
      .map(t => ({
        task_id: t.task_id,
        agent_id: t.agent_id,
        duration_minutes: t.getDurationMinutes(),
        retries: t.retries
      }))
      .sort((a, b) => b.duration_minutes - a.duration_minutes);
    
    // Calculate bottlenecks
    const avgTaskDuration = taskDurations.length > 0
      ? taskDurations.reduce((sum, t) => sum + t.duration_minutes, 0) / taskDurations.length
      : 0;
    
    const bottlenecks = taskDurations
      .filter(t => t.duration_minutes > avgTaskDuration * 1.5)
      .slice(0, 5);
    
    const report = {
      report_type: REPORT_TYPES.PERFORMANCE,
      execution_id: executionState.execution_id,
      report_time: new Date().toISOString(),
      
      overview: {
        total_duration_hours: metrics.elapsed_hours,
        estimated_hours: metrics.estimated_total_hours,
        efficiency_percent: metrics.estimated_total_hours > 0
          ? Math.round((metrics.estimated_total_hours / metrics.elapsed_hours) * 100)
          : 100,
        velocity_tasks_per_hour: metrics.velocity_tasks_per_hour
      },
      
      phase_performance: {
        total_phases: phaseDurations.length,
        slowest_phases: phaseDurations.slice(0, 3),
        fastest_phases: phaseDurations.slice(-3).reverse(),
        average_duration_minutes: phaseDurations.length > 0
          ? Math.round(phaseDurations.reduce((sum, p) => sum + p.duration_minutes, 0) / phaseDurations.length)
          : 0
      },
      
      task_performance: {
        total_tasks: taskDurations.length,
        slowest_tasks: taskDurations.slice(0, 5),
        average_duration_minutes: Math.round(avgTaskDuration),
        tasks_with_retries: taskDurations.filter(t => t.retries > 0).length,
        total_retries: taskDurations.reduce((sum, t) => sum + t.retries, 0)
      },
      
      bottlenecks: {
        identified: bottlenecks.length,
        tasks: bottlenecks,
        impact_minutes: bottlenecks.reduce((sum, t) => sum + (t.duration_minutes - avgTaskDuration), 0)
      },
      
      recommendations: this.options.includeRecommendations
        ? this._generatePerformanceRecommendations(bottlenecks, metrics)
        : []
    };
    
    return this._formatReport(report, format || this.options.defaultFormat);
  }

  // ==========================================================================
  // Error Report
  // ==========================================================================

  /**
   * Generate error summary report
   */
  generateErrorReport(executionState, format = null) {
    const failedTasks = [...executionState.tasks.values()]
      .filter(t => t.status === 'failed');
    
    const retriedTasks = [...executionState.tasks.values()]
      .filter(t => t.retries > 0);
    
    // Group errors by type
    const errorsByType = {};
    for (const task of failedTasks) {
      const errorType = this._classifyError(task.error);
      if (!errorsByType[errorType]) {
        errorsByType[errorType] = [];
      }
      errorsByType[errorType].push({
        task_id: task.task_id,
        error: task.error,
        retries: task.retries
      });
    }
    
    const report = {
      report_type: REPORT_TYPES.ERROR,
      execution_id: executionState.execution_id,
      report_time: new Date().toISOString(),
      
      summary: {
        total_failures: failedTasks.length,
        total_retries: retriedTasks.reduce((sum, t) => sum + t.retries, 0),
        tasks_with_retries: retriedTasks.length,
        retry_success_rate: retriedTasks.length > 0
          ? Math.round(((retriedTasks.length - failedTasks.length) / retriedTasks.length) * 100)
          : 100
      },
      
      errors_by_type: errorsByType,
      
      failed_tasks: failedTasks.map(t => ({
        task_id: t.task_id,
        phase_id: t.phase_id,
        agent_id: t.agent_id,
        error: t.error,
        retries: t.retries,
        duration_minutes: t.getDurationMinutes()
      })),
      
      retried_tasks: retriedTasks
        .filter(t => t.status !== 'failed')
        .map(t => ({
          task_id: t.task_id,
          retries: t.retries,
          final_status: t.status
        })),
      
      recommendations: this.options.includeRecommendations
        ? this._generateErrorRecommendations(errorsByType)
        : []
    };
    
    return this._formatReport(report, format || this.options.defaultFormat);
  }

  // ==========================================================================
  // Format Helpers
  // ==========================================================================

  _formatReport(report, format) {
    switch (format) {
      case REPORT_FORMATS.MARKDOWN:
        return this._toMarkdown(report);
      case REPORT_FORMATS.TEXT:
        return this._toText(report);
      case REPORT_FORMATS.JSON:
      default:
        return report;
    }
  }

  _toMarkdown(report) {
    const lines = [];
    
    lines.push(`# ${this._titleCase(report.report_type)} Report`);
    lines.push('');
    lines.push(`**Execution ID:** ${report.execution_id}`);
    if (report.project_name) lines.push(`**Project:** ${report.project_name}`);
    lines.push(`**Generated:** ${report.report_time || new Date().toISOString()}`);
    if (report.status) lines.push(`**Status:** ${report.status}`);
    lines.push('');
    
    // Summary section
    if (report.summary) {
      lines.push('## Summary');
      lines.push('');
      for (const [key, value] of Object.entries(report.summary)) {
        lines.push(`- **${this._titleCase(key.replace(/_/g, ' '))}:** ${value}`);
      }
      lines.push('');
    }
    
    // Progress section
    if (report.progress) {
      lines.push('## Progress');
      lines.push('');
      lines.push(`| Metric | Value |`);
      lines.push(`|--------|-------|`);
      for (const [key, value] of Object.entries(report.progress)) {
        lines.push(`| ${this._titleCase(key.replace(/_/g, ' '))} | ${value} |`);
      }
      lines.push('');
    }
    
    // Timeline section
    if (report.timeline) {
      lines.push('## Timeline');
      lines.push('');
      for (const [key, value] of Object.entries(report.timeline)) {
        lines.push(`- **${this._titleCase(key.replace(/_/g, ' '))}:** ${value}`);
      }
      lines.push('');
    }
    
    // Failures section
    if (report.failures && report.failures.count > 0) {
      lines.push('## Failures');
      lines.push('');
      lines.push(`Total failures: ${report.failures.count}`);
      lines.push('');
      if (report.failures.tasks && report.failures.tasks.length > 0) {
        lines.push('| Task | Error | Retries |');
        lines.push('|------|-------|---------|');
        for (const task of report.failures.tasks) {
          lines.push(`| ${task.task_id} | ${task.error?.substring(0, 50) || 'Unknown'} | ${task.retries} |`);
        }
      }
      lines.push('');
    }
    
    // Recommendations section
    if (report.recommendations && report.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const rec of report.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }

  _toText(report) {
    const lines = [];
    
    lines.push(`=== ${this._titleCase(report.report_type)} Report ===`);
    lines.push(`Execution: ${report.execution_id}`);
    lines.push(`Generated: ${report.report_time || new Date().toISOString()}`);
    if (report.status) lines.push(`Status: ${report.status}`);
    lines.push('');
    
    // Flatten and print key sections
    const printSection = (title, data) => {
      if (!data) return;
      lines.push(`--- ${title} ---`);
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object') {
          lines.push(`  ${key}:`);
          for (const [k, v] of Object.entries(value)) {
            lines.push(`    ${k}: ${v}`);
          }
        } else {
          lines.push(`  ${key}: ${value}`);
        }
      }
      lines.push('');
    };
    
    printSection('Summary', report.summary);
    printSection('Progress', report.progress);
    printSection('Timeline', report.timeline);
    
    return lines.join('\n');
  }

  _titleCase(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  _groupArtifactsByType(artifacts) {
    const grouped = {};
    for (const artifact of artifacts) {
      const type = artifact.type || 'unknown';
      grouped[type] = (grouped[type] || 0) + 1;
    }
    return grouped;
  }

  _classifyError(error) {
    if (!error) return 'unknown';
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('timeout')) return 'timeout';
    if (errorLower.includes('permission') || errorLower.includes('access denied')) return 'permission';
    if (errorLower.includes('not found') || errorLower.includes('404')) return 'not_found';
    if (errorLower.includes('validation')) return 'validation';
    if (errorLower.includes('network') || errorLower.includes('connection')) return 'network';
    if (errorLower.includes('memory') || errorLower.includes('heap')) return 'memory';
    if (errorLower.includes('syntax') || errorLower.includes('parse')) return 'syntax';
    
    return 'other';
  }

  _generateRecommendations(state, metrics) {
    const recommendations = [];
    
    if (metrics.tasks_failed > 0) {
      recommendations.push(`Review ${metrics.tasks_failed} failed task(s) and address root causes before next run`);
    }
    
    if (!metrics.on_track) {
      recommendations.push('Execution is behind schedule - consider parallelizing more tasks or reducing scope');
    }
    
    if (metrics.velocity_tasks_per_hour < 1) {
      recommendations.push('Low task velocity detected - investigate potential bottlenecks');
    }
    
    const retriedTasks = [...state.tasks.values()].filter(t => t.retries > 0).length;
    if (retriedTasks > metrics.total_tasks * 0.1) {
      recommendations.push(`High retry rate (${retriedTasks} tasks) - investigate transient failures`);
    }
    
    return recommendations;
  }

  _generatePerformanceRecommendations(bottlenecks, metrics) {
    const recommendations = [];
    
    if (bottlenecks.length > 0) {
      recommendations.push(`Address ${bottlenecks.length} bottleneck task(s) that are significantly slower than average`);
    }
    
    if (metrics.estimated_total_hours > 0 && metrics.elapsed_hours > metrics.estimated_total_hours * 1.2) {
      recommendations.push('Execution taking longer than estimated - update time estimates for future runs');
    }
    
    return recommendations;
  }

  _generateErrorRecommendations(errorsByType) {
    const recommendations = [];
    
    if (errorsByType.timeout) {
      recommendations.push(`${errorsByType.timeout.length} timeout error(s) - consider increasing timeout limits or optimizing slow operations`);
    }
    
    if (errorsByType.permission) {
      recommendations.push('Permission errors detected - verify access credentials and permissions');
    }
    
    if (errorsByType.network) {
      recommendations.push('Network errors detected - check connectivity and add retry logic for network operations');
    }
    
    if (errorsByType.validation) {
      recommendations.push('Validation errors detected - review input data and validation rules');
    }
    
    return recommendations;
  }
}

export default ReportGenerator;
