/**
 * Error Handling Types
 * 
 * Core type definitions for the error handling and recovery system.
 */

// =============================================================================
// Error Categories
// =============================================================================

/**
 * Error category determines the general type of error
 */
export type ErrorCategory =
  | 'transient'    // Temporary failures (network, rate limit)
  | 'validation'   // Input/output validation errors
  | 'resource'     // Resource exhaustion (memory, disk)
  | 'logic'        // Application logic errors
  | 'external'     // External service failures (Azure, MCP)
  | 'critical'     // Security, data corruption
  | 'unknown';     // Cannot be classified

/**
 * Error severity levels
 */
export type ErrorSeverity =
  | 'debug'     // Developer information
  | 'info'      // General information
  | 'warning'   // Potential issue, operation continues
  | 'error'     // Operation failed, recovery possible
  | 'critical'  // System stability affected
  | 'fatal';    // System must stop

// =============================================================================
// Recovery Strategies
// =============================================================================

/**
 * Available recovery strategies
 */
export type RecoveryStrategy =
  | 'retry'        // Retry the operation
  | 'rollback'     // Undo partial work
  | 'skip'         // Skip and continue
  | 'escalate'     // Escalate to human
  | 'abort'        // Stop execution
  | 'fallback'     // Use alternative approach
  | 'wait'         // Wait and retry later
  | 'none';        // No recovery possible

/**
 * Recovery action definition
 */
export interface RecoveryAction {
  strategy: RecoveryStrategy;
  description: string;
  requiresHuman: boolean;
  automaticRetryDelayMs?: number;
  maxRetries?: number;
  fallbackAction?: RecoveryStrategy;
}

// =============================================================================
// Error Classification
// =============================================================================

/**
 * Classification result from ErrorClassifier
 */
export interface ErrorClassification {
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
  isRecoverable?: boolean;
  matchedPattern?: string;
  suggestedRecovery: {
    strategy: RecoveryStrategy;
    description: string;
    retryDelay?: number;
    maxRetries?: number;
  };
  rootCause?: string;
  correlationId?: string;
  affectedPhase?: number;
  affectedAgent?: string;
  tags?: string[];
}

/**
 * Error pattern for matching
 */
export interface ErrorPattern {
  id: string;
  name: string;
  messagePattern: RegExp;
  codePattern?: RegExp;
  stackPattern?: RegExp;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recovery: RecoveryAction;
  description?: string;
}

// =============================================================================
// Structured Error
// =============================================================================

/**
 * Structured error with full context
 */
export interface StructuredError {
  /** Unique error ID */
  id: string;
  /** Timestamp */
  timestamp: string;
  /** Original error */
  error: Error;
  /** Error classification */
  classification: ErrorClassification;
  /** Execution context */
  context: ErrorContext;
  /** Stack trace */
  stackTrace?: string;
}

/**
 * Error context at the time of occurrence
 */
export interface ErrorContext {
  executionId?: string;
  phase?: number;
  phaseName?: string;
  agent?: string;
  step?: string;
  operation?: string;
  input?: unknown;
  partialOutput?: unknown;
  checkpointId?: string;
}

/**
 * Recovery attempt record
 */
export interface RecoveryAttempt {
  timestamp: string;
  strategy: RecoveryStrategy;
  success: boolean;
  error?: string;
  durationMs: number;
}

// =============================================================================
// Rollback
// =============================================================================

/**
 * Rollback point for recovery
 */
export interface RollbackPoint {
  id: string;
  executionId: string;
  phase: number;
  checkpointId: string;
  createdAt: string;
  artifacts: string[];
  canRollback: boolean;
  estimatedRollbackTimeMs: number;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  success: boolean;
  rollbackPointId: string;
  restoredPhase: number;
  artifactsRemoved: string[];
  artifactsRestored: string[];
  error?: string;
  durationMs: number;
}

// =============================================================================
// Escalation
// =============================================================================

/**
 * Escalation levels
 */
export type EscalationLevel =
  | 'auto'        // System handles automatically
  | 'supervisor'  // Supervisor review
  | 'team'        // Team review
  | 'human';      // Human intervention required

/**
 * Escalation request
 */
export interface EscalationRequest {
  id: string;
  error: StructuredError;
  level: EscalationLevel;
  timestamp: string;
  context: {
    executionId?: string;
    phase?: number;
    agent?: string;
    operation?: string;
  };
  options: string[];
}

/**
 * Escalation response
 */
export interface EscalationResponse {
  requestId: string;
  action: RecoveryStrategy;
  decidedBy: 'human' | 'system';
  timestamp: string;
  reason?: string;
}

// =============================================================================
// Error Report
// =============================================================================

/**
 * User-friendly error report
 */
export interface ErrorReport {
  /** Unique report ID */
  id: string;
  /** Timestamp */
  timestamp: string;
  /** Short title */
  title: string;
  /** Summary for users */
  summary: string;
  /** Detailed explanation */
  details: string;
  /** Error category */
  category: ErrorCategory;
  /** Error severity */
  severity: ErrorSeverity;
  /** Suggested actions */
  suggestedActions: string[];
  /** Affected phase (if known) */
  affectedPhase?: number;
  /** Technical details (for debugging) */
  technicalDetails?: string;
}

// =============================================================================
// Error Handler Config
// =============================================================================

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Enable automatic retry for retryable errors */
  autoRetry: boolean;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Enable automatic rollback */
  autoRollback: boolean;
  /** Auto-escalate after this many failures */
  escalateAfterFailures: number;
  /** Log all errors */
  logErrors: boolean;
  /** Log level threshold */
  logLevel: ErrorSeverity;
  /** Send notifications for these severities */
  notifyOnSeverity: ErrorSeverity[];
  /** Custom error patterns */
  customPatterns: ErrorPattern[];
}

export const DEFAULT_ERROR_HANDLER_CONFIG: ErrorHandlerConfig = {
  autoRetry: true,
  maxRetries: 3,
  autoRollback: true,
  escalateAfterFailures: 3,
  logErrors: true,
  logLevel: 'warning',
  notifyOnSeverity: ['critical', 'fatal'],
  customPatterns: [],
};
