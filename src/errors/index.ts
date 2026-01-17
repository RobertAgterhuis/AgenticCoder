/**
 * Error Handling Module
 * 
 * Provides comprehensive error handling, classification, recovery, and reporting.
 * 
 * Components:
 * - ErrorClassifier: Classifies errors and determines recovery strategies
 * - RollbackManager: Manages rollback points and state recovery
 * - EscalationManager: Routes critical errors to human review
 * - ErrorReporter: Generates user-friendly error reports
 */

// =============================================================================
// Types
// =============================================================================

export {
  // Enums
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  EscalationLevel,
  
  // Classification
  RecoveryAction,
  ErrorClassification,
  ErrorPattern,
  
  // Error structure
  StructuredError,
  ErrorContext,
  
  // Rollback
  RollbackPoint,
  RollbackResult,
  
  // Escalation
  EscalationRequest,
  EscalationResponse,
  
  // Reporting
  ErrorReport,
  
  // Configuration
  ErrorHandlerConfig,
  DEFAULT_ERROR_HANDLER_CONFIG,
} from './types';

// =============================================================================
// ErrorClassifier
// =============================================================================

export {
  ErrorClassifier,
  BUILTIN_PATTERNS,
  getErrorClassifier,
  createErrorClassifier,
} from './ErrorClassifier';

// =============================================================================
// RollbackManager
// =============================================================================

export {
  RollbackManager,
  RollbackManagerConfig,
  createRollbackManager,
} from './RollbackManager';

// =============================================================================
// EscalationManager
// =============================================================================

export {
  EscalationManager,
  EscalationManagerConfig,
  EscalationHandler,
  PendingEscalation,
  createEscalationManager,
} from './EscalationManager';

// =============================================================================
// ErrorReporter
// =============================================================================

export {
  ErrorReporter,
  ErrorReporterConfig,
  OutputFormat,
  FormattedReport,
  createErrorReporter,
} from './ErrorReporter';

// =============================================================================
// Convenience Functions
// =============================================================================

import { ErrorClassifier } from './ErrorClassifier';
import { ErrorReporter } from './ErrorReporter';
import { RollbackManager } from './RollbackManager';
import { EscalationManager } from './EscalationManager';
import { StateManager } from '../state/StateManager';
import { StructuredError, ErrorReport } from './types';

/**
 * Create a complete error handling system
 */
export function createErrorHandlingSystem(
  stateManager?: StateManager
): {
  classifier: ErrorClassifier;
  reporter: ErrorReporter;
  rollback: RollbackManager | null;
  escalation: EscalationManager;
} {
  const classifier = new ErrorClassifier();
  const reporter = new ErrorReporter(classifier);
  const rollback = stateManager ? new RollbackManager(stateManager) : null;
  const escalation = new EscalationManager(stateManager);

  return {
    classifier,
    reporter,
    rollback,
    escalation,
  };
}

/**
 * Quick function to classify and report an error
 */
export function handleError(
  error: Error | unknown,
  executionId?: string,
  phase?: number
): { structured: StructuredError; report: ErrorReport } {
  const classifier = new ErrorClassifier();
  const reporter = new ErrorReporter(classifier);

  const structured = classifier.createStructuredError(error, executionId, phase);
  const report = reporter.createReport(structured);

  return { structured, report };
}

/**
 * Quick function to format an error for display
 */
export function formatError(
  error: Error | unknown,
  format: 'console' | 'markdown' | 'json' | 'html' | 'plain' = 'console'
): string {
  const { report } = handleError(error);
  const reporter = new ErrorReporter();
  return reporter.format(report, format).content;
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: Error | unknown): boolean {
  const classifier = new ErrorClassifier();
  return classifier.isRetryable(error);
}

/**
 * Get suggested recovery strategy for an error
 */
export function getSuggestedRecovery(error: Error | unknown): {
  strategy: string;
  description: string;
} {
  const classifier = new ErrorClassifier();
  const classification = classifier.classify(error);
  return classification.suggestedRecovery;
}
