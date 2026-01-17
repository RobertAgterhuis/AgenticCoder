/**
 * Tests for Error Handling Module
 * 
 * Tests ErrorClassifier, RollbackManager, EscalationManager, and ErrorReporter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ErrorClassifier,
  BUILTIN_PATTERNS,
  createErrorClassifier,
} from '../ErrorClassifier';
import { ErrorReporter, createErrorReporter } from '../ErrorReporter';
import { EscalationManager, createEscalationManager } from '../EscalationManager';
import {
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  StructuredError,
} from '../types';

// =============================================================================
// ErrorClassifier Tests
// =============================================================================

describe('ErrorClassifier', () => {
  let classifier: ErrorClassifier;

  beforeEach(() => {
    classifier = new ErrorClassifier();
  });

  describe('classify', () => {
    it('should classify network timeout errors as transient', () => {
      const error = new Error('Connection timed out');
      const result = classifier.classify(error);

      expect(result.category).toBe('transient');
      expect(result.isRetryable).toBe(true);
      expect(result.suggestedRecovery.strategy).toBe('retry');
    });

    it('should classify ECONNREFUSED as transient', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:8080');
      const result = classifier.classify(error);

      expect(result.category).toBe('transient');
      expect(result.matchedPattern).toBe('net-refused');
    });

    it('should classify rate limit errors as transient', () => {
      const error = new Error('Rate limit exceeded');
      const result = classifier.classify(error);

      expect(result.category).toBe('transient');
      expect(result.suggestedRecovery.strategy).toBe('wait');
    });

    it('should classify validation errors as validation category', () => {
      const error = new Error('Schema validation failed');
      const result = classifier.classify(error);

      expect(result.category).toBe('validation');
      expect(result.severity).toBe('error');
      expect(result.isRetryable).toBe(false);
    });

    it('should classify required field errors as validation', () => {
      const error = new Error("Missing required field 'name'");
      const result = classifier.classify(error);

      expect(result.category).toBe('validation');
      expect(result.matchedPattern).toBe('val-required');
    });

    it('should classify out of memory as resource error', () => {
      const error = new Error('JavaScript heap out of memory');
      const result = classifier.classify(error);

      expect(result.category).toBe('resource');
      expect(result.severity).toBe('critical');
    });

    it('should classify disk space errors as resource', () => {
      const error = new Error('ENOSPC: no space left on device');
      const result = classifier.classify(error);

      expect(result.category).toBe('resource');
      expect(result.matchedPattern).toBe('res-disk');
    });

    it('should classify Azure auth errors as external', () => {
      const error = new Error('Authentication failed for Azure');
      const result = classifier.classify(error);

      expect(result.category).toBe('external');
      expect(result.matchedPattern).toBe('ext-azure-auth');
    });

    it('should classify MCP connection errors as external', () => {
      const error = new Error('MCP server not responding');
      const result = classifier.classify(error);

      expect(result.category).toBe('external');
      expect(result.suggestedRecovery.strategy).toBe('retry');
    });

    it('should classify assertion errors as logic', () => {
      const error = new Error('Assertion failed: value should be positive');
      const result = classifier.classify(error);

      expect(result.category).toBe('logic');
      expect(result.matchedPattern).toBe('logic-assert');
    });

    it('should classify security errors as critical', () => {
      const error = new Error('Invalid signature detected');
      const result = classifier.classify(error);

      expect(result.category).toBe('critical');
      expect(result.severity).toBe('critical');
    });

    it('should classify unknown errors with heuristics', () => {
      const error = new Error('Something unexpected happened');
      const result = classifier.classify(error);

      expect(result.category).toBe('unknown');
      expect(result.severity).toBe('error');
    });

    it('should handle non-Error objects', () => {
      const result = classifier.classify('string error');

      expect(result.category).toBe('unknown');
    });

    it('should handle null/undefined', () => {
      const result = classifier.classify(null);
      expect(result.category).toBe('unknown');

      const result2 = classifier.classify(undefined);
      expect(result2.category).toBe('unknown');
    });
  });

  describe('createStructuredError', () => {
    it('should create structured error with all fields', () => {
      const error = new Error('Test error');
      const result = classifier.createStructuredError(error, 'exec-123', 5);

      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.error).toBe(error);
      expect(result.classification).toBeDefined();
      expect(result.context.executionId).toBe('exec-123');
      expect(result.context.phase).toBe(5);
    });

    it('should include stack trace', () => {
      const error = new Error('Test error');
      const result = classifier.createStructuredError(error);

      expect(result.stackTrace).toBeDefined();
      expect(result.stackTrace).toContain('Error: Test error');
    });
  });

  describe('isRetryable', () => {
    it('should return true for transient errors', () => {
      expect(classifier.isRetryable(new Error('Connection timeout'))).toBe(true);
      expect(classifier.isRetryable(new Error('ECONNRESET'))).toBe(true);
    });

    it('should return false for validation errors', () => {
      expect(classifier.isRetryable(new Error('Schema validation failed'))).toBe(false);
    });

    it('should return false for logic errors', () => {
      expect(classifier.isRetryable(new Error('Assertion failed'))).toBe(false);
    });
  });

  describe('custom patterns', () => {
    it('should allow adding custom patterns', () => {
      classifier.addPattern({
        id: 'custom-auth',
        name: 'Custom Auth Error',
        messagePattern: /MyApp authentication failed/i,
        category: 'external',
        severity: 'error',
        recovery: {
          strategy: 'escalate',
          description: 'Contact admin',
          requiresHuman: true,
        },
      });

      const error = new Error('MyApp authentication failed');
      const result = classifier.classify(error);

      expect(result.matchedPattern).toBe('custom-auth');
      expect(result.category).toBe('external');
    });
  });

  describe('BUILTIN_PATTERNS', () => {
    it('should have patterns for all major categories', () => {
      const categories = new Set(BUILTIN_PATTERNS.map(p => p.category));

      expect(categories.has('transient')).toBe(true);
      expect(categories.has('validation')).toBe(true);
      expect(categories.has('resource')).toBe(true);
      expect(categories.has('external')).toBe(true);
      expect(categories.has('logic')).toBe(true);
      expect(categories.has('critical')).toBe(true);
    });

    it('should have at least 15 patterns', () => {
      expect(BUILTIN_PATTERNS.length).toBeGreaterThanOrEqual(15);
    });
  });
});

// =============================================================================
// ErrorReporter Tests
// =============================================================================

describe('ErrorReporter', () => {
  let reporter: ErrorReporter;
  let classifier: ErrorClassifier;

  beforeEach(() => {
    classifier = new ErrorClassifier();
    reporter = new ErrorReporter(classifier);
  });

  describe('createReportFromError', () => {
    it('should create a user-friendly report', () => {
      const error = new Error('Connection timeout');
      const report = reporter.createReportFromError(error, 'exec-123', 3);

      expect(report.id).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.title).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.details).toContain('timeout');
      expect(report.category).toBe('transient');
      expect(report.affectedPhase).toBe(3);
    });

    it('should include suggested actions', () => {
      const error = new Error('Connection refused');
      const report = reporter.createReportFromError(error);

      expect(report.suggestedActions).toBeDefined();
      expect(report.suggestedActions.length).toBeGreaterThan(0);
    });

    it('should include technical details', () => {
      const error = new Error('Test error');
      const report = reporter.createReportFromError(error);

      expect(report.technicalDetails).toBeDefined();
    });
  });

  describe('format', () => {
    it('should format as console output', () => {
      const error = new Error('Test error');
      const report = reporter.createReportFromError(error);
      const formatted = reporter.format(report, 'console');

      expect(formatted.format).toBe('console');
      expect(formatted.content).toContain('═'); // Box drawing characters
    });

    it('should format as markdown', () => {
      const error = new Error('Test error');
      const report = reporter.createReportFromError(error);
      const formatted = reporter.format(report, 'markdown');

      expect(formatted.format).toBe('markdown');
      expect(formatted.content).toContain('##');
      expect(formatted.content).toContain('**Severity:**');
    });

    it('should format as JSON', () => {
      const error = new Error('Test error');
      const report = reporter.createReportFromError(error);
      const formatted = reporter.format(report, 'json');

      expect(formatted.format).toBe('json');
      const parsed = JSON.parse(formatted.content);
      expect(parsed.title).toBeDefined();
    });

    it('should format as HTML', () => {
      const error = new Error('Test error');
      const report = reporter.createReportFromError(error);
      const formatted = reporter.format(report, 'html');

      expect(formatted.format).toBe('html');
      expect(formatted.content).toContain('<div class="error-report');
      expect(formatted.content).toContain('</div>');
    });

    it('should format as plain text', () => {
      const error = new Error('Test error');
      const report = reporter.createReportFromError(error);
      const formatted = reporter.format(report, 'plain');

      expect(formatted.format).toBe('plain');
      expect(formatted.content).toContain('===');
    });
  });

  describe('configuration', () => {
    it('should respect includeStackTrace setting', () => {
      const reporterNoStack = new ErrorReporter(classifier, {
        includeStackTrace: false,
      });

      const error = new Error('Test error');
      const report = reporterNoStack.createReportFromError(error);

      expect(report.technicalDetails).toBeUndefined();
    });

    it('should respect maxStackTraceLines setting', () => {
      const reporterLimited = new ErrorReporter(classifier, {
        maxStackTraceLines: 3,
      });

      const error = new Error('Test error');
      const report = reporterLimited.createReportFromError(error);

      if (report.technicalDetails) {
        const lines = report.technicalDetails.split('\n');
        expect(lines.length).toBeLessThanOrEqual(5); // 3 + potential truncation message
      }
    });
  });
});

// =============================================================================
// EscalationManager Tests
// =============================================================================

describe('EscalationManager', () => {
  let manager: EscalationManager;
  let classifier: ErrorClassifier;

  beforeEach(() => {
    classifier = new ErrorClassifier();
    manager = new EscalationManager(undefined, {
      humanResponseTimeoutMs: 1000, // Short timeout for tests
    });
  });

  describe('createEscalationRequest', () => {
    it('should create escalation request from structured error', () => {
      const error = new Error('Critical failure');
      const structured = classifier.createStructuredError(error, 'exec-123', 5);
      
      const request = manager.createEscalationRequest(structured);

      expect(request.id).toBeDefined();
      expect(request.error).toBe(structured);
      expect(request.level).toBeDefined();
      expect(request.options.length).toBeGreaterThan(0);
    });

    it('should include custom options', () => {
      const error = new Error('Test error');
      const structured = classifier.createStructuredError(error);
      
      const request = manager.createEscalationRequest(structured, [
        'Option A',
        'Option B',
      ]);

      expect(request.options).toContain('Option A');
      expect(request.options).toContain('Option B');
    });
  });

  describe('shouldEscalate', () => {
    it('should escalate critical errors', () => {
      // Create a critical error
      const error = new Error('Security violation detected');
      const structured = classifier.createStructuredError(error);

      // Force severity to critical for test
      structured.classification.severity = 'critical';

      expect(manager.shouldEscalate(structured)).toBe(true);
    });

    it('should not escalate warning errors by default', () => {
      const error = new Error('Minor issue');
      const structured = classifier.createStructuredError(error);
      structured.classification.severity = 'warning';

      expect(manager.shouldEscalate(structured)).toBe(false);
    });
  });

  describe('escalation handlers', () => {
    it('should register custom handlers', () => {
      const mockHandler = {
        name: 'test-handler',
        minSeverity: 'error' as ErrorSeverity,
        maxLevel: 'team' as const,
        handle: vi.fn().mockResolvedValue(null),
      };

      manager.registerHandler(mockHandler);

      expect(manager.getHandlers()).toContainEqual(
        expect.objectContaining({ name: 'test-handler' })
      );
    });

    it('should unregister handlers', () => {
      const mockHandler = {
        name: 'test-handler',
        minSeverity: 'error' as ErrorSeverity,
        maxLevel: 'team' as const,
        handle: vi.fn().mockResolvedValue(null),
      };

      manager.registerHandler(mockHandler);
      const removed = manager.unregisterHandler('test-handler');

      expect(removed).toBe(true);
      expect(manager.getHandlers()).not.toContainEqual(
        expect.objectContaining({ name: 'test-handler' })
      );
    });
  });

  describe('escalate', () => {
    it('should use auto-retry handler for retryable errors', async () => {
      const error = new Error('Connection timeout');
      const structured = classifier.createStructuredError(error);
      
      // Ensure it's classified as retryable
      structured.classification.isRetryable = true;
      structured.classification.severity = 'error';

      const request = manager.createEscalationRequest(structured);
      request.level = 'auto';

      const response = await manager.escalate(request);

      expect(response.action).toBe('retry');
      expect(response.decidedBy).toBe('system');
    });

    it('should create pending escalation for human-level requests', async () => {
      const error = new Error('Critical failure');
      const structured = classifier.createStructuredError(error);
      structured.classification.severity = 'fatal';

      const request = manager.createEscalationRequest(structured);
      request.level = 'human';

      const response = await manager.escalate(request);

      expect(response.action).toBe('wait');
      expect(manager.getPendingEscalations().length).toBe(1);
    });
  });

  describe('respondToEscalation', () => {
    it('should respond to pending escalation', async () => {
      const error = new Error('Critical failure');
      const structured = classifier.createStructuredError(error);
      structured.classification.severity = 'fatal';

      const request = manager.createEscalationRequest(structured);
      request.level = 'human';

      await manager.escalate(request);

      const response = await manager.respondToEscalation(
        request.id,
        'retry',
        'User decided to retry'
      );

      expect(response).not.toBeNull();
      expect(response?.action).toBe('retry');
      expect(response?.decidedBy).toBe('human');
      expect(response?.reason).toBe('User decided to retry');
    });

    it('should return null for non-existent escalation', async () => {
      const response = await manager.respondToEscalation(
        'non-existent',
        'abort'
      );

      expect(response).toBeNull();
    });
  });

  describe('processExpiredEscalations', () => {
    it('should process expired escalations with timeout action', async () => {
      const error = new Error('Critical failure');
      const structured = classifier.createStructuredError(error);
      structured.classification.severity = 'fatal';

      const request = manager.createEscalationRequest(structured);
      request.level = 'human';

      await manager.escalate(request);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      const responses = await manager.processExpiredEscalations();

      expect(responses.length).toBe(1);
      expect(responses[0].action).toBe('abort'); // Default timeout action
      expect(responses[0].decidedBy).toBe('system');
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Error Handling Integration', () => {
  it('should work together: classify -> report -> escalate', async () => {
    const classifier = new ErrorClassifier();
    const reporter = new ErrorReporter(classifier);
    const escalation = new EscalationManager();

    // 1. Classify
    const error = new Error('Connection refused to Azure');
    const structured = classifier.createStructuredError(error, 'exec-123', 3);

    expect(structured.classification.category).toBe('transient');

    // 2. Report
    const report = reporter.createReport(structured);
    const formatted = reporter.format(report, 'plain');

    expect(formatted.content).toContain('Azure');

    // 3. Escalate if needed
    if (escalation.shouldEscalate(structured)) {
      const request = escalation.createEscalationRequest(structured);
      const response = await escalation.escalate(request);
      
      expect(response).toBeDefined();
    }
  });

  it('should determine recovery strategies correctly', () => {
    const classifier = new ErrorClassifier();

    // Transient -> retry
    const timeout = classifier.classify(new Error('Connection timeout'));
    expect(timeout.suggestedRecovery.strategy).toBe('retry');

    // Rate limit -> wait
    const rateLimit = classifier.classify(new Error('Rate limit exceeded'));
    expect(rateLimit.suggestedRecovery.strategy).toBe('wait');

    // Validation -> escalate
    const validation = classifier.classify(new Error('Schema validation failed'));
    expect(validation.suggestedRecovery.strategy).toBe('escalate');

    // Security -> abort
    const security = classifier.classify(new Error('Invalid signature'));
    expect(security.suggestedRecovery.strategy).toBe('abort');
  });
});
