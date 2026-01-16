/**
 * DecisionEngine (FL-06)
 * 
 * Automated remediation and intelligent decision-making.
 * Analyzes failures and automatically suggests or executes remediation steps.
 * 
 * NOTE: This component UNBLOCKS SelfLearning module
 * 
 * Responsibilities:
 * - Analyze error patterns
 * - Determine root causes
 * - Recommend remediation actions
 * - Execute automatic remediation
 * - Track decision outcomes
 */

import { EventEmitter } from 'events';

// Remediation actions
export const REMEDIATION_ACTIONS = {
  RETRY: 'retry',              // Retry the task
  ROLLBACK: 'rollback',        // Revert changes
  ESCALATE: 'escalate',        // Send to human
  ALTERNATIVE: 'alternative',  // Try alternative approach
  NOTIFY: 'notify',            // Send notification only
  LOG_ONLY: 'log_only',        // Just log it
  SKIP: 'skip',                // Skip and continue
  ABORT: 'abort'               // Abort execution
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Decision confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40
};

export class DecisionEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.decisions = new Map();           // decision_id -> Decision
    this.errorPatterns = new Map();       // pattern_id -> ErrorPattern
    this.remediationHandlers = new Map(); // action -> handler function
    this.learningEnabled = options.learningEnabled !== false;
    this.autoRemediateThreshold = options.autoRemediateThreshold || CONFIDENCE_THRESHOLDS.HIGH;
    this.maxRetryAttempts = options.maxRetryAttempts || 3;
    this.baseRetryDelayMs = options.baseRetryDelayMs || 1000;
    this.decisionHistory = [];
    this.outcomeTracking = new Map();     // decision_id -> outcome

    // Register default error patterns
    this._registerDefaultPatterns();
    
    // Register default remediation handlers
    this._registerDefaultHandlers();
  }

  /**
   * Analyze error and create a decision
   */
  async analyzeAndDecide(context) {
    const {
      error,
      task_id,
      phase_id,
      retry_count = 0,
      max_retries = this.maxRetryAttempts,
      previous_failures = [],
      execution_context = {}
    } = context;

    const decision = {
      decision_id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      context: {
        error: this._serializeError(error),
        task_id,
        phase_id,
        retry_count,
        max_retries,
        previous_failures: previous_failures.map(e => this._serializeError(e))
      },
      analysis: this._analyzeError(error, context),
      recommended_action: REMEDIATION_ACTIONS.LOG_ONLY,
      action_confidence: 0,
      alternative_actions: [],
      executed: false,
      execution_result: null
    };

    // Determine recommended action
    this._determineAction(decision, context);

    // Store decision
    this.decisions.set(decision.decision_id, decision);
    this.decisionHistory.push({
      decision_id: decision.decision_id,
      timestamp: decision.created_at,
      action: decision.recommended_action,
      confidence: decision.action_confidence
    });

    this.emit('decision-made', decision);
    return decision;
  }

  /**
   * Execute remediation for a decision
   */
  async executeRemedy(decisionId, options = {}) {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }

    const action = options.overrideAction || decision.recommended_action;
    const handler = this.remediationHandlers.get(action);

    if (!handler) {
      throw new Error(`No handler for action: ${action}`);
    }

    this.emit('remediation-started', { decision_id: decisionId, action });

    try {
      const result = await handler(decision.context, options);
      
      decision.executed = true;
      decision.execution_result = {
        success: result.success,
        action,
        timestamp: new Date().toISOString(),
        details: result.details
      };

      // Track outcome for learning
      this._trackOutcome(decisionId, result.success, action);

      this.emit('remediation-completed', { 
        decision_id: decisionId, 
        action, 
        success: result.success 
      });

      return result;
    } catch (error) {
      decision.executed = true;
      decision.execution_result = {
        success: false,
        action,
        timestamp: new Date().toISOString(),
        error: error.message
      };

      this._trackOutcome(decisionId, false, action);

      this.emit('remediation-failed', { 
        decision_id: decisionId, 
        action, 
        error: error.message 
      });

      throw error;
    }
  }

  /**
   * Auto-remediate if confidence is high enough
   */
  async autoRemediate(context) {
    const decision = await this.analyzeAndDecide(context);

    if (decision.action_confidence >= this.autoRemediateThreshold &&
        decision.recommended_action !== REMEDIATION_ACTIONS.ESCALATE) {
      
      this.emit('auto-remediation-triggered', decision);
      return this.executeRemedy(decision.decision_id);
    }

    // Confidence too low or escalation needed
    this.emit('manual-review-required', decision);
    return { 
      success: false, 
      requires_human: true, 
      decision 
    };
  }

  /**
   * Register a custom error pattern
   */
  registerErrorPattern(pattern) {
    const normalizedPattern = {
      pattern_id: pattern.pattern_id || `pattern_${Date.now()}`,
      name: pattern.name,
      match: pattern.match,           // Function or regex
      severity: pattern.severity || ERROR_SEVERITY.MEDIUM,
      root_cause: pattern.root_cause,
      recommended_action: pattern.recommended_action,
      confidence: pattern.confidence || 70,
      alternatives: pattern.alternatives || []
    };

    this.errorPatterns.set(normalizedPattern.pattern_id, normalizedPattern);
    return normalizedPattern;
  }

  /**
   * Register a remediation handler
   */
  registerRemediationHandler(action, handler) {
    this.remediationHandlers.set(action, handler);
  }

  /**
   * Get decision by ID
   */
  getDecision(decisionId) {
    return this.decisions.get(decisionId) || null;
  }

  /**
   * Get decision history
   */
  getDecisionHistory(limit = 100) {
    return this.decisionHistory.slice(-limit);
  }

  /**
   * Get success rate for an action
   */
  getActionSuccessRate(action) {
    const outcomes = Array.from(this.outcomeTracking.values())
      .filter(o => o.action === action);
    
    if (outcomes.length === 0) return 0;
    
    const successful = outcomes.filter(o => o.success).length;
    return (successful / outcomes.length * 100).toFixed(1);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const decisions = Array.from(this.decisions.values());
    const outcomes = Array.from(this.outcomeTracking.values());

    return {
      total_decisions: decisions.length,
      executed_decisions: decisions.filter(d => d.executed).length,
      pending_decisions: decisions.filter(d => !d.executed).length,
      
      by_action: this._groupByAction(decisions),
      by_severity: this._groupBySeverity(decisions),
      
      success_rate: outcomes.length > 0
        ? (outcomes.filter(o => o.success).length / outcomes.length * 100).toFixed(1) + '%'
        : 'N/A',
      
      average_confidence: decisions.length > 0
        ? (decisions.reduce((sum, d) => sum + d.action_confidence, 0) / decisions.length).toFixed(1)
        : 0,
      
      patterns_registered: this.errorPatterns.size
    };
  }

  /**
   * Learn from outcome (updates pattern confidence)
   */
  learnFromOutcome(decisionId, actualSuccess) {
    if (!this.learningEnabled) return;

    const decision = this.decisions.get(decisionId);
    if (!decision) return;

    const outcome = this.outcomeTracking.get(decisionId);
    if (!outcome) return;

    // Find matching pattern
    const matchedPattern = Array.from(this.errorPatterns.values())
      .find(p => p.recommended_action === decision.recommended_action);

    if (matchedPattern) {
      // Adjust confidence based on outcome
      const adjustment = actualSuccess ? 2 : -5;
      matchedPattern.confidence = Math.max(0, Math.min(100, 
        matchedPattern.confidence + adjustment
      ));

      this.emit('pattern-updated', { 
        pattern_id: matchedPattern.pattern_id,
        new_confidence: matchedPattern.confidence
      });
    }
  }

  // Private methods

  _registerDefaultPatterns() {
    // Timeout error
    this.registerErrorPattern({
      pattern_id: 'timeout_error',
      name: 'Timeout Error',
      match: (error) => error.name === 'TimeoutError' || 
                       error.message?.toLowerCase().includes('timeout'),
      severity: ERROR_SEVERITY.MEDIUM,
      root_cause: 'Operation exceeded time limit',
      recommended_action: REMEDIATION_ACTIONS.RETRY,
      confidence: 85,
      alternatives: [
        { action: REMEDIATION_ACTIONS.ESCALATE, reason: 'May indicate resource exhaustion' }
      ]
    });

    // Network error
    this.registerErrorPattern({
      pattern_id: 'network_error',
      name: 'Network Error',
      match: (error) => error.name === 'NetworkError' ||
                       error.code === 'ECONNREFUSED' ||
                       error.code === 'ENOTFOUND' ||
                       error.message?.toLowerCase().includes('network'),
      severity: ERROR_SEVERITY.MEDIUM,
      root_cause: 'Network connectivity issue',
      recommended_action: REMEDIATION_ACTIONS.RETRY,
      confidence: 75
    });

    // Validation error
    this.registerErrorPattern({
      pattern_id: 'validation_error',
      name: 'Validation Error',
      match: (error) => error.name === 'ValidationError' ||
                       error.code === 'VALIDATION_FAILED',
      severity: ERROR_SEVERITY.HIGH,
      root_cause: 'Input or output validation failed',
      recommended_action: REMEDIATION_ACTIONS.ESCALATE,
      confidence: 90,
      alternatives: [
        { action: REMEDIATION_ACTIONS.LOG_ONLY, reason: 'May be expected validation warning' }
      ]
    });

    // Authorization error
    this.registerErrorPattern({
      pattern_id: 'auth_error',
      name: 'Authorization Error',
      match: (error) => error.name === 'AuthorizationError' ||
                       error.code === 'UNAUTHORIZED' ||
                       error.code === 'FORBIDDEN' ||
                       error.message?.toLowerCase().includes('unauthorized'),
      severity: ERROR_SEVERITY.CRITICAL,
      root_cause: 'Authentication or authorization failed',
      recommended_action: REMEDIATION_ACTIONS.ESCALATE,
      confidence: 95
    });

    // Resource not found
    this.registerErrorPattern({
      pattern_id: 'not_found_error',
      name: 'Resource Not Found',
      match: (error) => error.code === 'ENOENT' ||
                       error.code === 'NOT_FOUND' ||
                       error.message?.toLowerCase().includes('not found'),
      severity: ERROR_SEVERITY.HIGH,
      root_cause: 'Required resource does not exist',
      recommended_action: REMEDIATION_ACTIONS.ESCALATE,
      confidence: 80
    });

    // Rate limiting
    this.registerErrorPattern({
      pattern_id: 'rate_limit_error',
      name: 'Rate Limit Error',
      match: (error) => error.code === 'RATE_LIMITED' ||
                       error.code === 'TOO_MANY_REQUESTS' ||
                       error.status === 429,
      severity: ERROR_SEVERITY.LOW,
      root_cause: 'API rate limit exceeded',
      recommended_action: REMEDIATION_ACTIONS.RETRY,
      confidence: 90
    });

    // Syntax error
    this.registerErrorPattern({
      pattern_id: 'syntax_error',
      name: 'Syntax Error',
      match: (error) => error.name === 'SyntaxError',
      severity: ERROR_SEVERITY.HIGH,
      root_cause: 'Code or template syntax error',
      recommended_action: REMEDIATION_ACTIONS.ESCALATE,
      confidence: 85
    });
  }

  _registerDefaultHandlers() {
    // Retry handler
    this.remediationHandlers.set(REMEDIATION_ACTIONS.RETRY, async (context, options) => {
      const delay = this._calculateRetryDelay(context.retry_count);
      
      this.emit('retry-scheduled', { 
        task_id: context.task_id, 
        delay_ms: delay,
        attempt: context.retry_count + 1
      });

      // Wait for delay
      await new Promise(resolve => setTimeout(resolve, delay));

      return {
        success: true,
        details: {
          action: 'retry',
          delay_ms: delay,
          attempt: context.retry_count + 1
        }
      };
    });

    // Rollback handler
    this.remediationHandlers.set(REMEDIATION_ACTIONS.ROLLBACK, async (context, options) => {
      this.emit('rollback-initiated', { task_id: context.task_id });
      
      // Actual rollback logic would be implemented by the caller
      return {
        success: true,
        details: {
          action: 'rollback',
          task_id: context.task_id
        }
      };
    });

    // Escalate handler
    this.remediationHandlers.set(REMEDIATION_ACTIONS.ESCALATE, async (context, options) => {
      this.emit('escalation-required', { 
        task_id: context.task_id,
        error: context.error
      });

      return {
        success: true,
        details: {
          action: 'escalate',
          reason: 'Requires human intervention'
        }
      };
    });

    // Alternative handler
    this.remediationHandlers.set(REMEDIATION_ACTIONS.ALTERNATIVE, async (context, options) => {
      const alternative = options.alternative;
      
      this.emit('alternative-initiated', { 
        task_id: context.task_id,
        alternative
      });

      return {
        success: true,
        details: {
          action: 'alternative',
          alternative
        }
      };
    });

    // Notify handler
    this.remediationHandlers.set(REMEDIATION_ACTIONS.NOTIFY, async (context, options) => {
      this.emit('notification-required', { 
        task_id: context.task_id,
        error: context.error
      });

      return {
        success: true,
        details: { action: 'notify' }
      };
    });

    // Log only handler
    this.remediationHandlers.set(REMEDIATION_ACTIONS.LOG_ONLY, async (context, options) => {
      this.emit('error-logged', { 
        task_id: context.task_id,
        error: context.error
      });

      return {
        success: true,
        details: { action: 'log_only' }
      };
    });

    // Skip handler
    this.remediationHandlers.set(REMEDIATION_ACTIONS.SKIP, async (context, options) => {
      this.emit('task-skipped', { task_id: context.task_id });

      return {
        success: true,
        details: { action: 'skip' }
      };
    });

    // Abort handler
    this.remediationHandlers.set(REMEDIATION_ACTIONS.ABORT, async (context, options) => {
      this.emit('execution-aborted', { 
        task_id: context.task_id,
        reason: context.error?.message
      });

      return {
        success: true,
        details: { action: 'abort' }
      };
    });
  }

  _analyzeError(error, context) {
    const errorName = error?.name || 'UnknownError';
    const errorMessage = error?.message || String(error);

    // Find matching pattern
    let matchedPattern = null;
    for (const [id, pattern] of this.errorPatterns) {
      if (typeof pattern.match === 'function' && pattern.match(error)) {
        matchedPattern = pattern;
        break;
      }
    }

    return {
      error_type: errorName,
      error_message: errorMessage,
      root_cause: matchedPattern?.root_cause || this._inferRootCause(error),
      severity: matchedPattern?.severity || this._determineSeverity(error, context),
      matched_pattern: matchedPattern?.pattern_id || null
    };
  }

  _determineAction(decision, context) {
    const { analysis } = decision;
    const { retry_count, max_retries } = context;

    // Find matching pattern
    const matchedPattern = analysis.matched_pattern 
      ? this.errorPatterns.get(analysis.matched_pattern)
      : null;

    if (matchedPattern) {
      // Check if retry is possible
      if (matchedPattern.recommended_action === REMEDIATION_ACTIONS.RETRY &&
          retry_count >= max_retries) {
        decision.recommended_action = REMEDIATION_ACTIONS.ESCALATE;
        decision.action_confidence = 80;
        decision.alternative_actions = [{
          action: REMEDIATION_ACTIONS.LOG_ONLY,
          confidence: 40,
          reason: 'Max retries exceeded'
        }];
      } else {
        decision.recommended_action = matchedPattern.recommended_action;
        decision.action_confidence = matchedPattern.confidence;
        decision.alternative_actions = matchedPattern.alternatives || [];
      }
    } else {
      // Default behavior for unknown errors
      decision.recommended_action = REMEDIATION_ACTIONS.LOG_ONLY;
      decision.action_confidence = 60;
      decision.alternative_actions = [{
        action: REMEDIATION_ACTIONS.ESCALATE,
        confidence: 80,
        reason: 'Unknown error type - may need human review'
      }];
    }
  }

  _inferRootCause(error) {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('timeout')) return 'Operation timeout';
    if (message.includes('network')) return 'Network issue';
    if (message.includes('permission') || message.includes('denied')) return 'Permission denied';
    if (message.includes('not found')) return 'Resource not found';
    if (message.includes('memory')) return 'Memory exhaustion';
    if (message.includes('disk') || message.includes('space')) return 'Disk space issue';
    
    return 'Unknown cause';
  }

  _determineSeverity(error, context) {
    // Higher severity if many retries already attempted
    if (context.retry_count >= 2) return ERROR_SEVERITY.HIGH;
    if (context.previous_failures?.length >= 2) return ERROR_SEVERITY.HIGH;
    
    // Check error type
    if (error?.name === 'SecurityError') return ERROR_SEVERITY.CRITICAL;
    if (error?.name === 'AuthorizationError') return ERROR_SEVERITY.CRITICAL;
    
    return ERROR_SEVERITY.MEDIUM;
  }

  _calculateRetryDelay(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = this.baseRetryDelayMs * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.3 * baseDelay;
    return Math.min(baseDelay + jitter, 30000); // Max 30 seconds
  }

  _serializeError(error) {
    if (!error) return null;
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    };
  }

  _trackOutcome(decisionId, success, action) {
    this.outcomeTracking.set(decisionId, {
      decision_id: decisionId,
      success,
      action,
      timestamp: new Date().toISOString()
    });
  }

  _groupByAction(decisions) {
    const grouped = {};
    for (const d of decisions) {
      grouped[d.recommended_action] = (grouped[d.recommended_action] || 0) + 1;
    }
    return grouped;
  }

  _groupBySeverity(decisions) {
    const grouped = {};
    for (const d of decisions) {
      const severity = d.analysis?.severity || 'unknown';
      grouped[severity] = (grouped[severity] || 0) + 1;
    }
    return grouped;
  }
}

export default DecisionEngine;
