/**
 * ErrorReporter
 * 
 * Generates user-friendly error messages with suggested recovery actions.
 * Formats errors for different output contexts (console, UI, log files).
 */

import {
  ErrorReport,
  StructuredError,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  ErrorClassification,
} from './types';
import { ErrorClassifier } from './ErrorClassifier';

// =============================================================================
// Types
// =============================================================================

export type OutputFormat = 'console' | 'markdown' | 'json' | 'html' | 'plain';

export interface ErrorReporterConfig {
  /** Include stack traces in reports */
  includeStackTrace: boolean;
  /** Include error context in reports */
  includeContext: boolean;
  /** Include recovery suggestions */
  includeRecoverySuggestions: boolean;
  /** Maximum stack trace lines */
  maxStackTraceLines: number;
  /** Default output format */
  defaultFormat: OutputFormat;
}

export interface FormattedReport {
  format: OutputFormat;
  content: string;
  error: StructuredError;
}

const DEFAULT_CONFIG: ErrorReporterConfig = {
  includeStackTrace: true,
  includeContext: true,
  includeRecoverySuggestions: true,
  maxStackTraceLines: 10,
  defaultFormat: 'console',
};

// =============================================================================
// Severity & Category Descriptions
// =============================================================================

const SEVERITY_DESCRIPTIONS: Record<ErrorSeverity, string> = {
  debug: 'Debug information (not an error)',
  info: 'Informational message',
  warning: 'Warning - may require attention',
  error: 'Error - action required',
  critical: 'Critical error - immediate attention needed',
  fatal: 'Fatal error - execution cannot continue',
};

const CATEGORY_DESCRIPTIONS: Record<ErrorCategory, string> = {
  transient: 'Temporary issue that may resolve on retry',
  validation: 'Input validation or schema error',
  resource: 'Resource constraint (memory, disk, etc.)',
  logic: 'Logic or programming error',
  external: 'External service or dependency error',
  critical: 'Critical system error',
  unknown: 'Unknown error type',
};

const RECOVERY_DESCRIPTIONS: Record<RecoveryStrategy, string> = {
  retry: 'Retry the operation',
  rollback: 'Roll back to previous state',
  skip: 'Skip this step and continue',
  escalate: 'Escalate to human review',
  abort: 'Abort the current execution',
  fallback: 'Use alternative approach',
  wait: 'Wait before retrying',
  none: 'No automatic recovery available',
};

// =============================================================================
// ErrorReporter
// =============================================================================

export class ErrorReporter {
  private config: ErrorReporterConfig;
  private classifier: ErrorClassifier;

  constructor(
    classifier?: ErrorClassifier,
    config?: Partial<ErrorReporterConfig>
  ) {
    this.classifier = classifier || new ErrorClassifier();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // Report Generation
  // ===========================================================================

  /**
   * Create an error report from a structured error
   */
  createReport(error: StructuredError): ErrorReport {
    const { classification, context, error: originalError } = error;

    const report: ErrorReport = {
      id: error.id,
      timestamp: error.timestamp,
      title: this.generateTitle(error),
      summary: this.generateSummary(error),
      details: originalError.message,
      category: classification.category,
      severity: classification.severity,
      suggestedActions: this.generateSuggestedActions(error),
    };

    if (this.config.includeContext && context.phase) {
      report.affectedPhase = context.phase;
    }

    if (this.config.includeStackTrace && error.stackTrace) {
      report.technicalDetails = this.formatStackTrace(error.stackTrace);
    }

    return report;
  }

  /**
   * Create a report from any error
   */
  createReportFromError(
    error: Error | unknown,
    executionId?: string,
    phase?: number
  ): ErrorReport {
    const structuredError = this.classifier.createStructuredError(
      error,
      executionId,
      phase
    );
    return this.createReport(structuredError);
  }

  // ===========================================================================
  // Formatting
  // ===========================================================================

  /**
   * Format report for output
   */
  format(report: ErrorReport, outputFormat?: OutputFormat): FormattedReport {
    const format = outputFormat || this.config.defaultFormat;
    
    // We need the original structured error for the FormattedReport
    // Create a minimal one for the response
    const minimalError: StructuredError = {
      id: report.id,
      timestamp: report.timestamp,
      error: new Error(report.details),
      classification: {
        category: report.category,
        severity: report.severity,
        isRetryable: ['transient', 'external'].includes(report.category),
        suggestedRecovery: {
          strategy: 'none',
          description: report.suggestedActions.join('; '),
        },
      },
      context: {
        phase: report.affectedPhase,
      },
      stackTrace: report.technicalDetails,
    };

    let content: string;

    switch (format) {
      case 'console':
        content = this.formatForConsole(report);
        break;
      case 'markdown':
        content = this.formatForMarkdown(report);
        break;
      case 'json':
        content = this.formatForJson(report);
        break;
      case 'html':
        content = this.formatForHtml(report);
        break;
      case 'plain':
      default:
        content = this.formatForPlain(report);
        break;
    }

    return { format, content, error: minimalError };
  }

  /**
   * Format for console output with colors
   */
  private formatForConsole(report: ErrorReport): string {
    const lines: string[] = [];
    const severityColor = this.getSeverityColor(report.severity);

    // Header
    lines.push(`\n${severityColor}╔══════════════════════════════════════════════════════════════╗\x1b[0m`);
    lines.push(`${severityColor}║ ${report.severity.toUpperCase().padEnd(10)} │ ${report.title.slice(0, 48).padEnd(48)} ║\x1b[0m`);
    lines.push(`${severityColor}╠══════════════════════════════════════════════════════════════╣\x1b[0m`);

    // Summary
    lines.push(`${severityColor}║\x1b[0m ${report.summary.slice(0, 62).padEnd(62)} ${severityColor}║\x1b[0m`);
    lines.push(`${severityColor}╠══════════════════════════════════════════════════════════════╣\x1b[0m`);

    // Category info
    lines.push(`${severityColor}║\x1b[0m Category: ${report.category.padEnd(51)} ${severityColor}║\x1b[0m`);
    lines.push(`${severityColor}║\x1b[0m ${CATEGORY_DESCRIPTIONS[report.category].slice(0, 62).padEnd(62)} ${severityColor}║\x1b[0m`);

    // Phase if available
    if (report.affectedPhase !== undefined) {
      lines.push(`${severityColor}║\x1b[0m Affected Phase: ${String(report.affectedPhase).padEnd(45)} ${severityColor}║\x1b[0m`);
    }

    // Suggested actions
    if (this.config.includeRecoverySuggestions && report.suggestedActions.length > 0) {
      lines.push(`${severityColor}╠══════════════════════════════════════════════════════════════╣\x1b[0m`);
      lines.push(`${severityColor}║\x1b[0m \x1b[1mSuggested Actions:\x1b[0m${' '.repeat(43)} ${severityColor}║\x1b[0m`);
      for (const action of report.suggestedActions.slice(0, 3)) {
        lines.push(`${severityColor}║\x1b[0m  • ${action.slice(0, 58).padEnd(58)} ${severityColor}║\x1b[0m`);
      }
    }

    // Technical details
    if (this.config.includeStackTrace && report.technicalDetails) {
      lines.push(`${severityColor}╠══════════════════════════════════════════════════════════════╣\x1b[0m`);
      lines.push(`${severityColor}║\x1b[0m \x1b[2mTechnical Details:\x1b[0m${' '.repeat(43)} ${severityColor}║\x1b[0m`);
      const techLines = report.technicalDetails.split('\n').slice(0, 5);
      for (const line of techLines) {
        lines.push(`${severityColor}║\x1b[0m \x1b[2m${line.slice(0, 60).padEnd(60)}\x1b[0m ${severityColor}║\x1b[0m`);
      }
    }

    lines.push(`${severityColor}╚══════════════════════════════════════════════════════════════╝\x1b[0m\n`);

    return lines.join('\n');
  }

  /**
   * Format for markdown
   */
  private formatForMarkdown(report: ErrorReport): string {
    const lines: string[] = [];

    lines.push(`## ${this.getSeverityEmoji(report.severity)} ${report.title}`);
    lines.push('');
    lines.push(`**Severity:** ${report.severity.toUpperCase()}`);
    lines.push(`**Category:** ${report.category}`);
    lines.push(`**Time:** ${report.timestamp}`);
    if (report.affectedPhase !== undefined) {
      lines.push(`**Phase:** ${report.affectedPhase}`);
    }
    lines.push('');
    lines.push('### Summary');
    lines.push(report.summary);
    lines.push('');
    lines.push('### Details');
    lines.push(report.details);

    if (this.config.includeRecoverySuggestions && report.suggestedActions.length > 0) {
      lines.push('');
      lines.push('### Suggested Actions');
      for (const action of report.suggestedActions) {
        lines.push(`- ${action}`);
      }
    }

    if (this.config.includeStackTrace && report.technicalDetails) {
      lines.push('');
      lines.push('### Technical Details');
      lines.push('```');
      lines.push(report.technicalDetails);
      lines.push('```');
    }

    return lines.join('\n');
  }

  /**
   * Format for JSON
   */
  private formatForJson(report: ErrorReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Format for HTML
   */
  private formatForHtml(report: ErrorReport): string {
    const severityClass = `severity-${report.severity}`;
    const lines: string[] = [];

    lines.push(`<div class="error-report ${severityClass}">`);
    lines.push(`  <h2>${this.escapeHtml(report.title)}</h2>`);
    lines.push(`  <div class="error-meta">`);
    lines.push(`    <span class="severity">${report.severity.toUpperCase()}</span>`);
    lines.push(`    <span class="category">${report.category}</span>`);
    lines.push(`    <span class="timestamp">${report.timestamp}</span>`);
    if (report.affectedPhase !== undefined) {
      lines.push(`    <span class="phase">Phase ${report.affectedPhase}</span>`);
    }
    lines.push(`  </div>`);
    lines.push(`  <div class="error-summary">${this.escapeHtml(report.summary)}</div>`);
    lines.push(`  <div class="error-details">${this.escapeHtml(report.details)}</div>`);

    if (this.config.includeRecoverySuggestions && report.suggestedActions.length > 0) {
      lines.push(`  <div class="suggested-actions">`);
      lines.push(`    <h3>Suggested Actions</h3>`);
      lines.push(`    <ul>`);
      for (const action of report.suggestedActions) {
        lines.push(`      <li>${this.escapeHtml(action)}</li>`);
      }
      lines.push(`    </ul>`);
      lines.push(`  </div>`);
    }

    if (this.config.includeStackTrace && report.technicalDetails) {
      lines.push(`  <details class="technical-details">`);
      lines.push(`    <summary>Technical Details</summary>`);
      lines.push(`    <pre>${this.escapeHtml(report.technicalDetails)}</pre>`);
      lines.push(`  </details>`);
    }

    lines.push(`</div>`);

    return lines.join('\n');
  }

  /**
   * Format for plain text
   */
  private formatForPlain(report: ErrorReport): string {
    const lines: string[] = [];

    lines.push(`=== ${report.severity.toUpperCase()}: ${report.title} ===`);
    lines.push(`Category: ${report.category}`);
    lines.push(`Time: ${report.timestamp}`);
    if (report.affectedPhase !== undefined) {
      lines.push(`Phase: ${report.affectedPhase}`);
    }
    lines.push('');
    lines.push('Summary:');
    lines.push(report.summary);
    lines.push('');
    lines.push('Details:');
    lines.push(report.details);

    if (this.config.includeRecoverySuggestions && report.suggestedActions.length > 0) {
      lines.push('');
      lines.push('Suggested Actions:');
      for (const action of report.suggestedActions) {
        lines.push(`  * ${action}`);
      }
    }

    if (this.config.includeStackTrace && report.technicalDetails) {
      lines.push('');
      lines.push('Technical Details:');
      lines.push(report.technicalDetails);
    }

    return lines.join('\n');
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Generate a title for the error
   */
  private generateTitle(error: StructuredError): string {
    const { classification, context } = error;
    const baseTitle = error.error.name || 'Error';
    
    if (classification.matchedPattern) {
      return classification.matchedPattern.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    if (context.operation) {
      return `${baseTitle} in ${context.operation}`;
    }

    return `${baseTitle}: ${classification.category}`;
  }

  /**
   * Generate a summary for the error
   */
  private generateSummary(error: StructuredError): string {
    const { classification } = error;
    const categoryDesc = CATEGORY_DESCRIPTIONS[classification.category];
    const severityDesc = SEVERITY_DESCRIPTIONS[classification.severity];

    return `${severityDesc}. ${categoryDesc}.`;
  }

  /**
   * Generate suggested actions
   */
  private generateSuggestedActions(error: StructuredError): string[] {
    const actions: string[] = [];
    const { classification, context } = error;
    const recovery = classification.suggestedRecovery;

    // Primary recovery action
    const recoveryDesc = RECOVERY_DESCRIPTIONS[recovery.strategy];
    if (recovery.strategy !== 'none') {
      actions.push(recoveryDesc);
    }

    // Additional context-specific suggestions
    if (classification.category === 'transient') {
      if (recovery.retryDelay) {
        actions.push(`Wait ${recovery.retryDelay}ms before retrying`);
      }
      if (recovery.maxRetries) {
        actions.push(`Retry up to ${recovery.maxRetries} times`);
      }
    }

    if (classification.category === 'validation') {
      actions.push('Check input data format and required fields');
      actions.push('Review schema requirements');
    }

    if (classification.category === 'resource') {
      actions.push('Check available system resources');
      actions.push('Consider cleaning up temporary files');
    }

    if (classification.category === 'external') {
      actions.push('Verify external service availability');
      actions.push('Check authentication credentials');
    }

    if (classification.category === 'critical') {
      actions.push('Contact system administrator');
      actions.push('Review system logs for more details');
    }

    // Phase-specific suggestions
    if (context.phase && context.phase > 1) {
      actions.push(`Consider rolling back to phase ${context.phase - 1}`);
    }

    return actions;
  }

  /**
   * Format stack trace
   */
  private formatStackTrace(stackTrace: string): string {
    const lines = stackTrace.split('\n');
    if (lines.length <= this.config.maxStackTraceLines) {
      return stackTrace;
    }
    const truncated = lines.slice(0, this.config.maxStackTraceLines);
    truncated.push(`... (${lines.length - this.config.maxStackTraceLines} more lines)`);
    return truncated.join('\n');
  }

  /**
   * Get console color code for severity
   */
  private getSeverityColor(severity: ErrorSeverity): string {
    const colors: Record<ErrorSeverity, string> = {
      debug: '\x1b[90m',    // Gray
      info: '\x1b[36m',     // Cyan
      warning: '\x1b[33m',  // Yellow
      error: '\x1b[31m',    // Red
      critical: '\x1b[35m', // Magenta
      fatal: '\x1b[41m',    // Red background
    };
    return colors[severity];
  }

  /**
   * Get emoji for severity
   */
  private getSeverityEmoji(severity: ErrorSeverity): string {
    const emojis: Record<ErrorSeverity, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🔥',
      fatal: '💀',
    };
    return emojis[severity];
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get configuration
   */
  getConfig(): ErrorReporterConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorReporterConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create an ErrorReporter instance
 */
export function createErrorReporter(
  classifier?: ErrorClassifier,
  config?: Partial<ErrorReporterConfig>
): ErrorReporter {
  return new ErrorReporter(classifier, config);
}
