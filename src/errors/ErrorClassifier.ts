/**
 * ErrorClassifier
 * 
 * Classifies errors into categories and determines recovery strategies.
 * Uses pattern matching and heuristics to identify error types.
 */

import {
  ErrorCategory,
  ErrorSeverity,
  ErrorClassification,
  ErrorPattern,
  RecoveryAction,
  RecoveryStrategy,
  StructuredError,
  ErrorContext,
} from './types';

// =============================================================================
// Built-in Error Patterns
// =============================================================================

export const BUILTIN_PATTERNS: ErrorPattern[] = [
  // Transient - Network
  {
    id: 'net-timeout',
    name: 'Network Timeout',
    messagePattern: /timeout|timed out|ETIMEDOUT|ESOCKETTIMEDOUT/i,
    category: 'transient',
    severity: 'warning',
    recovery: {
      strategy: 'retry',
      description: 'Network timeout - will retry with backoff',
      requiresHuman: false,
      automaticRetryDelayMs: 1000,
      maxRetries: 3,
    },
  },
  {
    id: 'net-refused',
    name: 'Connection Refused',
    messagePattern: /ECONNREFUSED|connection refused/i,
    category: 'transient',
    severity: 'warning',
    recovery: {
      strategy: 'retry',
      description: 'Connection refused - server may be starting',
      requiresHuman: false,
      automaticRetryDelayMs: 2000,
      maxRetries: 5,
    },
  },
  {
    id: 'net-reset',
    name: 'Connection Reset',
    messagePattern: /ECONNRESET|connection reset/i,
    category: 'transient',
    severity: 'warning',
    recovery: {
      strategy: 'retry',
      description: 'Connection reset - will retry',
      requiresHuman: false,
      automaticRetryDelayMs: 500,
      maxRetries: 3,
    },
  },

  // Transient - Rate Limiting
  {
    id: 'rate-limit',
    name: 'Rate Limited',
    messagePattern: /rate limit|429|too many requests/i,
    category: 'transient',
    severity: 'warning',
    recovery: {
      strategy: 'wait',
      description: 'Rate limited - waiting before retry',
      requiresHuman: false,
      automaticRetryDelayMs: 60000,
      maxRetries: 3,
    },
  },
  {
    id: 'throttled',
    name: 'Request Throttled',
    messagePattern: /throttl|slow down/i,
    category: 'transient',
    severity: 'warning',
    recovery: {
      strategy: 'wait',
      description: 'Request throttled - backing off',
      requiresHuman: false,
      automaticRetryDelayMs: 5000,
      maxRetries: 5,
    },
  },

  // Validation
  {
    id: 'val-schema',
    name: 'Schema Validation Error',
    messagePattern: /schema|validation.*fail|invalid.*type/i,
    category: 'validation',
    severity: 'error',
    recovery: {
      strategy: 'escalate',
      description: 'Schema validation failed - check input',
      requiresHuman: true,
    },
  },
  {
    id: 'val-required',
    name: 'Required Field Missing',
    messagePattern: /required|missing.*field|undefined.*property/i,
    category: 'validation',
    severity: 'error',
    recovery: {
      strategy: 'abort',
      description: 'Required field missing - check configuration',
      requiresHuman: true,
    },
  },
  {
    id: 'val-format',
    name: 'Invalid Format',
    messagePattern: /invalid.*format|malformed|parse.*error/i,
    category: 'validation',
    severity: 'error',
    recovery: {
      strategy: 'abort',
      description: 'Invalid format - check input data',
      requiresHuman: true,
    },
  },

  // Resource
  {
    id: 'res-memory',
    name: 'Out of Memory',
    messagePattern: /out of memory|heap|ENOMEM/i,
    category: 'resource',
    severity: 'critical',
    recovery: {
      strategy: 'abort',
      description: 'Out of memory - system resources exhausted',
      requiresHuman: true,
    },
  },
  {
    id: 'res-disk',
    name: 'Disk Space',
    messagePattern: /no space|ENOSPC|disk full/i,
    category: 'resource',
    severity: 'critical',
    recovery: {
      strategy: 'abort',
      description: 'Disk space exhausted - cleanup required',
      requiresHuman: true,
    },
  },
  {
    id: 'res-file',
    name: 'File Limit',
    messagePattern: /EMFILE|too many open files/i,
    category: 'resource',
    severity: 'error',
    recovery: {
      strategy: 'wait',
      description: 'Too many open files - waiting for cleanup',
      requiresHuman: false,
      automaticRetryDelayMs: 5000,
      maxRetries: 3,
    },
  },

  // External - Azure
  {
    id: 'ext-azure-auth',
    name: 'Azure Authentication Error',
    messagePattern: /azure.*auth|auth.*azure|401.*azure|unauthorized.*azure/i,
    category: 'external',
    severity: 'error',
    recovery: {
      strategy: 'escalate',
      description: 'Azure authentication failed - check credentials',
      requiresHuman: true,
    },
  },
  {
    id: 'ext-azure-quota',
    name: 'Azure Quota Exceeded',
    messagePattern: /quota.*exceeded|subscription.*limit/i,
    category: 'external',
    severity: 'error',
    recovery: {
      strategy: 'escalate',
      description: 'Azure quota exceeded - request increase or cleanup',
      requiresHuman: true,
    },
  },
  {
    id: 'ext-azure-unavail',
    name: 'Azure Service Unavailable',
    messagePattern: /503.*azure|azure.*unavailable|service.*unavailable/i,
    category: 'external',
    severity: 'warning',
    recovery: {
      strategy: 'wait',
      description: 'Azure service temporarily unavailable',
      requiresHuman: false,
      automaticRetryDelayMs: 30000,
      maxRetries: 5,
    },
  },

  // External - MCP
  {
    id: 'ext-mcp-conn',
    name: 'MCP Connection Error',
    messagePattern: /mcp.*(?:connect|server|not responding)|server.*not.*running/i,
    category: 'external',
    severity: 'error',
    recovery: {
      strategy: 'retry',
      description: 'MCP server connection failed - ensure server is running',
      requiresHuman: false,
      automaticRetryDelayMs: 5000,
      maxRetries: 3,
      fallbackAction: 'escalate',
    },
  },
  {
    id: 'ext-mcp-tool',
    name: 'MCP Tool Error',
    messagePattern: /tool.*not.*found|unknown.*tool/i,
    category: 'external',
    severity: 'error',
    recovery: {
      strategy: 'abort',
      description: 'MCP tool not found - check server configuration',
      requiresHuman: true,
    },
  },

  // Logic
  {
    id: 'logic-state',
    name: 'Invalid State',
    messagePattern: /invalid.*state|unexpected.*state|state.*machine/i,
    category: 'logic',
    severity: 'error',
    recovery: {
      strategy: 'rollback',
      description: 'Invalid state detected - rolling back to checkpoint',
      requiresHuman: false,
    },
  },
  {
    id: 'logic-assert',
    name: 'Assertion Failed',
    messagePattern: /assert|invariant|precondition|postcondition/i,
    category: 'logic',
    severity: 'error',
    recovery: {
      strategy: 'rollback',
      description: 'Assertion failed - system in unexpected state',
      requiresHuman: true,
    },
  },
  {
    id: 'logic-type',
    name: 'Type Error',
    messagePattern: /TypeError|cannot read.*undefined|cannot read.*null/i,
    category: 'logic',
    severity: 'error',
    recovery: {
      strategy: 'abort',
      description: 'Type error - possible bug in code',
      requiresHuman: true,
    },
  },

  // Critical
  {
    id: 'crit-security',
    name: 'Security Error',
    messagePattern: /security|unauthorized|forbidden|403|invalid.*signature|signature.*invalid/i,
    category: 'critical',
    severity: 'critical',
    recovery: {
      strategy: 'abort',
      description: 'Security error - immediate attention required',
      requiresHuman: true,
    },
  },
  {
    id: 'crit-corrupt',
    name: 'Data Corruption',
    messagePattern: /corrupt|checksum|integrity|invalid.*hash/i,
    category: 'critical',
    severity: 'fatal',
    recovery: {
      strategy: 'abort',
      description: 'Data corruption detected - do not proceed',
      requiresHuman: true,
    },
  },
];

// =============================================================================
// ErrorClassifier
// =============================================================================

export class ErrorClassifier {
  private patterns: ErrorPattern[];
  private customPatterns: ErrorPattern[] = [];

  constructor(customPatterns?: ErrorPattern[]) {
    this.patterns = [...BUILTIN_PATTERNS];
    if (customPatterns) {
      this.customPatterns = customPatterns;
      this.patterns = [...customPatterns, ...this.patterns];
    }
  }

  /**
   * Add custom error patterns
   */
  addPattern(pattern: ErrorPattern): void {
    this.customPatterns.push(pattern);
    this.patterns = [...this.customPatterns, ...BUILTIN_PATTERNS];
  }

  /**
   * Classify an error
   */
  classify(error: Error | unknown, context?: ErrorContext): ErrorClassification {
    // Handle non-Error objects
    if (error === null || error === undefined) {
      return this.createDefaultClassification('Null or undefined error');
    }

    const errorObj = error instanceof Error ? error : new Error(String(error));
    const matchedPattern = this.findMatchingPattern(errorObj);

    if (matchedPattern) {
      return this.createClassificationFromPattern(matchedPattern, errorObj, context);
    }

    // Fallback: heuristic classification
    return this.heuristicClassification(errorObj, context);
  }

  /**
   * Create a default classification for edge cases
   */
  private createDefaultClassification(rootCause: string): ErrorClassification {
    return {
      category: 'unknown',
      severity: 'error',
      isRetryable: false,
      isRecoverable: false,
      suggestedRecovery: {
        strategy: 'escalate',
        description: 'Unknown error - human review required',
      },
      rootCause,
      correlationId: crypto.randomUUID(),
      tags: ['unknown'],
    };
  }

  /**
   * Create a structured error with full context
   */
  createStructuredError(
    error: Error | unknown,
    executionId?: string,
    phase?: number
  ): StructuredError {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const context: ErrorContext = {
      executionId,
      phase,
    };
    const classification = this.classify(errorObj, context);

    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      error: errorObj,
      classification,
      context,
      stackTrace: errorObj.stack,
    };
  }

  /**
   * Find matching error pattern
   */
  private findMatchingPattern(error: Error): ErrorPattern | null {
    const message = error.message || '';
    const code = (error as any).code || '';
    const stack = error.stack || '';

    for (const pattern of this.patterns) {
      // Match message
      if (pattern.messagePattern.test(message)) {
        return pattern;
      }

      // Match code if pattern has codePattern
      if (pattern.codePattern && pattern.codePattern.test(code)) {
        return pattern;
      }

      // Match stack if pattern has stackPattern
      if (pattern.stackPattern && pattern.stackPattern.test(stack)) {
        return pattern;
      }
    }

    return null;
  }

  /**
   * Create classification from matched pattern
   */
  private createClassificationFromPattern(
    pattern: ErrorPattern,
    error: Error,
    context?: ErrorContext
  ): ErrorClassification {
    const isRetryable = ['retry', 'wait'].includes(pattern.recovery.strategy);
    const isRecoverable = pattern.recovery.strategy !== 'abort' || 
                          pattern.recovery.fallbackAction !== undefined;

    return {
      category: pattern.category,
      severity: pattern.severity,
      isRetryable,
      isRecoverable,
      matchedPattern: pattern.id,
      suggestedRecovery: {
        strategy: pattern.recovery.strategy,
        description: pattern.recovery.description,
        retryDelay: pattern.recovery.automaticRetryDelayMs,
        maxRetries: pattern.recovery.maxRetries,
      },
      rootCause: pattern.name,
      correlationId: crypto.randomUUID(),
      affectedPhase: context?.phase,
      affectedAgent: context?.agent,
      tags: [pattern.id, pattern.category],
    };
  }

  /**
   * Heuristic classification for unknown errors
   */
  private heuristicClassification(
    error: Error,
    context?: ErrorContext
  ): ErrorClassification {
    const message = (error.message || '').toLowerCase();
    const name = (error.name || '').toLowerCase();

    // Try to infer category from error characteristics
    let category: ErrorCategory = 'unknown';
    let severity: ErrorSeverity = 'error';
    let isRetryable = false;
    let recovery: RecoveryAction = {
      strategy: 'escalate',
      description: 'Unknown error - human review required',
      requiresHuman: true,
    };

    // Network-like errors
    if (message.includes('network') || message.includes('socket')) {
      category = 'transient';
      severity = 'warning';
      isRetryable = true;
      recovery = {
        strategy: 'retry',
        description: 'Possible network issue',
        requiresHuman: false,
        maxRetries: 3,
        automaticRetryDelayMs: 1000,
      };
    }
    // Type errors usually indicate bugs
    else if (name === 'typeerror' || name === 'referenceerror') {
      category = 'logic';
      severity = 'error';
    }
    // Syntax errors are validation
    else if (name === 'syntaxerror') {
      category = 'validation';
      severity = 'error';
    }
    // Range errors are often resource-related
    else if (name === 'rangeerror') {
      category = 'resource';
      severity = 'error';
    }

    return {
      category,
      severity,
      isRetryable,
      isRecoverable: true, // Heuristic classifications are always recoverable
      suggestedRecovery: {
        strategy: recovery.strategy,
        description: recovery.description,
        retryDelay: recovery.automaticRetryDelayMs,
        maxRetries: recovery.maxRetries,
      },
      correlationId: crypto.randomUUID(),
      affectedPhase: context?.phase,
      affectedAgent: context?.agent,
      tags: ['heuristic', category],
    };
  }

  /**
   * Extract error chain from nested errors
   */
  private extractErrorChain(error: Error): Error[] {
    const chain: Error[] = [error];
    let current: any = error;

    while (current.cause && current.cause instanceof Error) {
      chain.push(current.cause);
      current = current.cause;
    }

    return chain;
  }

  /**
   * Get all available patterns (for debugging/documentation)
   */
  getPatterns(): ErrorPattern[] {
    return [...this.patterns];
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error | unknown): boolean {
    const classification = this.classify(error);
    return classification.isRetryable;
  }

  /**
   * Get suggested recovery strategy
   */
  getSuggestedRecovery(error: Error | unknown, context?: ErrorContext): { strategy: string; description: string } {
    const classification = this.classify(error, context);
    return classification.suggestedRecovery;
  }
}

// =============================================================================
// Factory
// =============================================================================

let defaultClassifier: ErrorClassifier | null = null;

/**
 * Get or create the default error classifier
 */
export function getErrorClassifier(): ErrorClassifier {
  if (!defaultClassifier) {
    defaultClassifier = new ErrorClassifier();
  }
  return defaultClassifier;
}

/**
 * Create a new error classifier with custom patterns
 */
export function createErrorClassifier(patterns?: ErrorPattern[]): ErrorClassifier {
  return new ErrorClassifier(patterns);
}
