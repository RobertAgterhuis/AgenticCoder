/**
 * SafetyMechanisms - SL-12 Safety Controls
 * 
 * Provides safety controls for self-learning:
 * - Rate limiting
 * - Confidence thresholds
 * - Isolation/sandboxing
 * - Human override
 * 
 * @implements SelfLearning/12_SAFETY_MECHANISMS.md
 */

import { EventEmitter } from 'events';

/**
 * Safety status
 */
const SafetyStatus = {
  SAFE: 'safe',
  WARNING: 'warning',
  BLOCKED: 'blocked',
  OVERRIDE_REQUIRED: 'override_required'
};

/**
 * Block reason
 */
const BlockReason = {
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  LOW_CONFIDENCE: 'low_confidence',
  HIGH_RISK: 'high_risk',
  ISOLATION_REQUIRED: 'isolation_required',
  MANUAL_BLOCK: 'manual_block',
  CONSECUTIVE_FAILURES: 'consecutive_failures'
};

/**
 * Safety check result
 */
class SafetyCheckResult {
  constructor(data) {
    this.allowed = data.allowed !== false;
    this.status = data.status || SafetyStatus.SAFE;
    this.reason = data.reason || null;
    this.details = data.details || {};
    this.recommendations = data.recommendations || [];
    this.timestamp = data.timestamp || new Date();
  }
  
  toJSON() {
    return {
      allowed: this.allowed,
      status: this.status,
      reason: this.reason,
      details: this.details,
      recommendations: this.recommendations,
      timestamp: this.timestamp
    };
  }
}

/**
 * Rate Limiter
 */
class RateLimiter {
  constructor(options = {}) {
    this.options = {
      maxOperationsPerMinute: options.maxOperationsPerMinute || 10,
      maxOperationsPerHour: options.maxOperationsPerHour || 100,
      maxOperationsPerDay: options.maxOperationsPerDay || 500,
      cooldownAfterFailure: options.cooldownAfterFailure || 30 * 1000, // 30 seconds
      ...options
    };
    
    // Operation tracking
    this.operations = [];
    
    // Cooldown state
    this.cooldownUntil = null;
  }
  
  /**
   * Check if operation is allowed
   */
  check() {
    // Check cooldown
    if (this.cooldownUntil && Date.now() < this.cooldownUntil) {
      return {
        allowed: false,
        reason: BlockReason.RATE_LIMIT_EXCEEDED,
        details: { cooldownRemaining: this.cooldownUntil - Date.now() }
      };
    }
    
    // Clean old operations
    this._cleanup();
    
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const opsLastMinute = this.operations.filter(t => t > oneMinuteAgo).length;
    const opsLastHour = this.operations.filter(t => t > oneHourAgo).length;
    const opsLastDay = this.operations.filter(t => t > oneDayAgo).length;
    
    // Check limits
    if (opsLastMinute >= this.options.maxOperationsPerMinute) {
      return {
        allowed: false,
        reason: BlockReason.RATE_LIMIT_EXCEEDED,
        details: { limit: 'minute', count: opsLastMinute, max: this.options.maxOperationsPerMinute }
      };
    }
    
    if (opsLastHour >= this.options.maxOperationsPerHour) {
      return {
        allowed: false,
        reason: BlockReason.RATE_LIMIT_EXCEEDED,
        details: { limit: 'hour', count: opsLastHour, max: this.options.maxOperationsPerHour }
      };
    }
    
    if (opsLastDay >= this.options.maxOperationsPerDay) {
      return {
        allowed: false,
        reason: BlockReason.RATE_LIMIT_EXCEEDED,
        details: { limit: 'day', count: opsLastDay, max: this.options.maxOperationsPerDay }
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Record an operation
   */
  record() {
    this.operations.push(Date.now());
  }
  
  /**
   * Apply cooldown after failure
   */
  applyCooldown(duration = null) {
    this.cooldownUntil = Date.now() + (duration || this.options.cooldownAfterFailure);
  }
  
  /**
   * Clear cooldown
   */
  clearCooldown() {
    this.cooldownUntil = null;
  }
  
  /**
   * Cleanup old operations
   */
  _cleanup() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.operations = this.operations.filter(t => t > cutoff);
  }
  
  /**
   * Get current usage
   */
  getUsage() {
    this._cleanup();
    
    const now = Date.now();
    
    return {
      lastMinute: this.operations.filter(t => t > now - 60 * 1000).length,
      lastHour: this.operations.filter(t => t > now - 60 * 60 * 1000).length,
      lastDay: this.operations.length,
      cooldownActive: this.cooldownUntil && Date.now() < this.cooldownUntil
    };
  }
}

/**
 * Confidence Gate
 */
class ConfidenceGate {
  constructor(options = {}) {
    this.options = {
      minimumConfidence: options.minimumConfidence || 0.7,
      warningThreshold: options.warningThreshold || 0.85,
      highRiskThreshold: options.highRiskThreshold || 0.9,
      requireHumanApprovalBelow: options.requireHumanApprovalBelow || 0.5,
      ...options
    };
  }
  
  /**
   * Check confidence level
   */
  check(confidence, riskLevel = 'medium') {
    // Adjust threshold based on risk
    let threshold = this.options.minimumConfidence;
    if (riskLevel === 'high') {
      threshold = this.options.highRiskThreshold;
    }
    
    // Check if below minimum
    if (confidence < threshold) {
      return {
        allowed: false,
        status: SafetyStatus.BLOCKED,
        reason: BlockReason.LOW_CONFIDENCE,
        details: {
          confidence,
          required: threshold,
          riskLevel
        }
      };
    }
    
    // Check if human approval required
    if (confidence < this.options.requireHumanApprovalBelow) {
      return {
        allowed: false,
        status: SafetyStatus.OVERRIDE_REQUIRED,
        reason: 'Human approval required for low confidence',
        details: {
          confidence,
          threshold: this.options.requireHumanApprovalBelow
        }
      };
    }
    
    // Warning zone
    if (confidence < this.options.warningThreshold) {
      return {
        allowed: true,
        status: SafetyStatus.WARNING,
        details: {
          confidence,
          warningThreshold: this.options.warningThreshold
        },
        recommendations: ['Consider manual review before applying']
      };
    }
    
    return {
      allowed: true,
      status: SafetyStatus.SAFE,
      details: { confidence }
    };
  }
  
  /**
   * Update thresholds
   */
  setThresholds(thresholds) {
    this.options = { ...this.options, ...thresholds };
  }
}

/**
 * Isolation Manager
 */
class IsolationManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      defaultIsolationLevel: options.defaultIsolationLevel || 'sandbox',
      productionIsolationRequired: options.productionIsolationRequired !== false,
      maxConcurrentIsolated: options.maxConcurrentIsolated || 3,
      isolationTimeout: options.isolationTimeout || 5 * 60 * 1000, // 5 minutes
      ...options
    };
    
    // Active isolated environments
    this.activeEnvironments = new Map();
    
    // Risk-based isolation requirements
    this.isolationRules = new Map([
      ['low', { required: false, level: 'none' }],
      ['medium', { required: true, level: 'sandbox' }],
      ['high', { required: true, level: 'full-isolation' }]
    ]);
  }
  
  /**
   * Check if isolation is required
   */
  checkRequired(riskLevel, context = {}) {
    const rule = this.isolationRules.get(riskLevel) || this.isolationRules.get('medium');
    
    // Production always requires isolation
    if (context.isProduction && this.options.productionIsolationRequired) {
      return {
        required: true,
        level: 'full-isolation',
        reason: 'Production environment requires full isolation'
      };
    }
    
    return {
      required: rule.required,
      level: rule.level,
      reason: rule.required ? `Risk level '${riskLevel}' requires isolation` : null
    };
  }
  
  /**
   * Create isolated environment
   */
  async createEnvironment(changeId, options = {}) {
    // Check capacity
    if (this.activeEnvironments.size >= this.options.maxConcurrentIsolated) {
      return {
        success: false,
        error: 'Maximum concurrent isolated environments reached'
      };
    }
    
    const env = {
      id: `iso-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      changeId,
      level: options.level || this.options.defaultIsolationLevel,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.options.isolationTimeout,
      state: 'active'
    };
    
    this.activeEnvironments.set(env.id, env);
    
    this.emit('environment:created', env);
    
    return { success: true, environment: env };
  }
  
  /**
   * Release isolated environment
   */
  releaseEnvironment(envId) {
    const env = this.activeEnvironments.get(envId);
    if (env) {
      env.state = 'released';
      this.activeEnvironments.delete(envId);
      this.emit('environment:released', env);
      return true;
    }
    return false;
  }
  
  /**
   * Get active environments
   */
  getActiveEnvironments() {
    return Array.from(this.activeEnvironments.values());
  }
  
  /**
   * Cleanup expired environments
   */
  cleanup() {
    const now = Date.now();
    const expired = [];
    
    this.activeEnvironments.forEach((env, id) => {
      if (env.expiresAt < now) {
        expired.push(id);
      }
    });
    
    expired.forEach(id => this.releaseEnvironment(id));
    
    return expired.length;
  }
}

/**
 * Failure Tracker
 */
class FailureTracker {
  constructor(options = {}) {
    this.options = {
      maxConsecutiveFailures: options.maxConsecutiveFailures || 3,
      failureWindowMs: options.failureWindowMs || 10 * 60 * 1000, // 10 minutes
      ...options
    };
    
    // Track failures by component/operation
    this.failures = new Map();
  }
  
  /**
   * Record a failure
   */
  recordFailure(key, error = null) {
    const now = Date.now();
    
    if (!this.failures.has(key)) {
      this.failures.set(key, []);
    }
    
    const failures = this.failures.get(key);
    failures.push({ timestamp: now, error });
    
    // Cleanup old failures
    const cutoff = now - this.options.failureWindowMs;
    const recent = failures.filter(f => f.timestamp > cutoff);
    this.failures.set(key, recent);
    
    return recent.length;
  }
  
  /**
   * Record success (clears failure count)
   */
  recordSuccess(key) {
    this.failures.delete(key);
  }
  
  /**
   * Check if blocked due to failures
   */
  checkBlocked(key) {
    const failures = this.failures.get(key) || [];
    const now = Date.now();
    const cutoff = now - this.options.failureWindowMs;
    
    const recentFailures = failures.filter(f => f.timestamp > cutoff);
    
    if (recentFailures.length >= this.options.maxConsecutiveFailures) {
      return {
        blocked: true,
        reason: BlockReason.CONSECUTIVE_FAILURES,
        details: {
          failureCount: recentFailures.length,
          maxAllowed: this.options.maxConsecutiveFailures
        }
      };
    }
    
    return { blocked: false };
  }
  
  /**
   * Clear failures for a key
   */
  clear(key) {
    this.failures.delete(key);
  }
  
  /**
   * Clear all failures
   */
  clearAll() {
    this.failures.clear();
  }
}

/**
 * Human Override Manager
 */
class HumanOverrideManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      overrideExpirationMs: options.overrideExpirationMs || 60 * 60 * 1000, // 1 hour
      requireReason: options.requireReason !== false,
      ...options
    };
    
    // Active overrides
    this.overrides = new Map();
    
    // Override requests pending approval
    this.pendingRequests = new Map();
  }
  
  /**
   * Request human override
   */
  requestOverride(changeId, context = {}) {
    const request = {
      requestId: `ovr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      changeId,
      reason: context.reason || 'Override requested',
      requestedAt: new Date(),
      context,
      status: 'pending'
    };
    
    this.pendingRequests.set(request.requestId, request);
    
    this.emit('override:requested', request);
    
    return request;
  }
  
  /**
   * Approve override
   */
  approveOverride(requestId, approver, reason = null) {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }
    
    if (this.options.requireReason && !reason) {
      return { success: false, error: 'Approval reason required' };
    }
    
    // Create override
    const override = {
      overrideId: `active-${requestId}`,
      changeId: request.changeId,
      approvedBy: approver,
      approvedAt: new Date(),
      expiresAt: new Date(Date.now() + this.options.overrideExpirationMs),
      reason
    };
    
    this.overrides.set(request.changeId, override);
    this.pendingRequests.delete(requestId);
    
    this.emit('override:approved', override);
    
    return { success: true, override };
  }
  
  /**
   * Deny override
   */
  denyOverride(requestId, denier, reason = null) {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }
    
    request.status = 'denied';
    request.deniedBy = denier;
    request.deniedAt = new Date();
    request.denyReason = reason;
    
    this.pendingRequests.delete(requestId);
    
    this.emit('override:denied', request);
    
    return { success: true };
  }
  
  /**
   * Check if override exists
   */
  hasOverride(changeId) {
    const override = this.overrides.get(changeId);
    
    if (!override) return false;
    
    // Check expiration
    if (new Date() > override.expiresAt) {
      this.overrides.delete(changeId);
      return false;
    }
    
    return true;
  }
  
  /**
   * Revoke override
   */
  revokeOverride(changeId) {
    return this.overrides.delete(changeId);
  }
  
  /**
   * Get pending requests
   */
  getPendingRequests() {
    return Array.from(this.pendingRequests.values());
  }
  
  /**
   * Get active overrides
   */
  getActiveOverrides() {
    // Cleanup expired
    const now = new Date();
    this.overrides.forEach((override, changeId) => {
      if (now > override.expiresAt) {
        this.overrides.delete(changeId);
      }
    });
    
    return Array.from(this.overrides.values());
  }
}

/**
 * Main Safety Controller
 */
class SafetyController extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enabled: options.enabled !== false,
      strictMode: options.strictMode || false,
      ...options
    };
    
    // Initialize components
    this.rateLimiter = new RateLimiter(options.rateLimiter || {});
    this.confidenceGate = new ConfidenceGate(options.confidence || {});
    this.isolationManager = new IsolationManager(options.isolation || {});
    this.failureTracker = new FailureTracker(options.failures || {});
    this.overrideManager = new HumanOverrideManager(options.overrides || {});
    
    // Manual blocks
    this.manualBlocks = new Set();
  }
  
  /**
   * Perform comprehensive safety check
   */
  check(context) {
    if (!this.options.enabled) {
      return new SafetyCheckResult({ allowed: true, status: SafetyStatus.SAFE });
    }
    
    const { changeId, confidence, riskLevel = 'medium' } = context;
    
    // Check manual block
    if (this.manualBlocks.has(changeId)) {
      return new SafetyCheckResult({
        allowed: false,
        status: SafetyStatus.BLOCKED,
        reason: BlockReason.MANUAL_BLOCK
      });
    }
    
    // Check human override
    if (this.overrideManager.hasOverride(changeId)) {
      return new SafetyCheckResult({
        allowed: true,
        status: SafetyStatus.SAFE,
        details: { hasOverride: true }
      });
    }
    
    // Check rate limit
    const rateCheck = this.rateLimiter.check();
    if (!rateCheck.allowed) {
      return new SafetyCheckResult({
        allowed: false,
        status: SafetyStatus.BLOCKED,
        reason: rateCheck.reason,
        details: rateCheck.details
      });
    }
    
    // Check failure history
    const failureCheck = this.failureTracker.checkBlocked(changeId);
    if (failureCheck.blocked) {
      return new SafetyCheckResult({
        allowed: false,
        status: SafetyStatus.BLOCKED,
        reason: failureCheck.reason,
        details: failureCheck.details
      });
    }
    
    // Check confidence
    if (confidence !== undefined) {
      const confCheck = this.confidenceGate.check(confidence, riskLevel);
      if (!confCheck.allowed) {
        return new SafetyCheckResult({
          allowed: false,
          status: confCheck.status,
          reason: confCheck.reason || BlockReason.LOW_CONFIDENCE,
          details: confCheck.details,
          recommendations: confCheck.recommendations
        });
      }
    }
    
    // Check isolation requirements
    const isoCheck = this.isolationManager.checkRequired(riskLevel, context);
    
    return new SafetyCheckResult({
      allowed: true,
      status: isoCheck.required ? SafetyStatus.WARNING : SafetyStatus.SAFE,
      details: {
        isolationRequired: isoCheck.required,
        isolationLevel: isoCheck.level
      },
      recommendations: isoCheck.required ? [`Apply in isolated environment (${isoCheck.level})`] : []
    });
  }
  
  /**
   * Record operation for rate limiting
   */
  recordOperation() {
    this.rateLimiter.record();
  }
  
  /**
   * Record failure
   */
  recordFailure(changeId, error = null) {
    const count = this.failureTracker.recordFailure(changeId, error);
    this.rateLimiter.applyCooldown();
    
    this.emit('failure:recorded', { changeId, count, error });
    
    return count;
  }
  
  /**
   * Record success
   */
  recordSuccess(changeId) {
    this.failureTracker.recordSuccess(changeId);
    this.rateLimiter.clearCooldown();
    
    this.emit('success:recorded', { changeId });
  }
  
  /**
   * Block a change manually
   */
  block(changeId) {
    this.manualBlocks.add(changeId);
    this.emit('change:blocked', { changeId });
  }
  
  /**
   * Unblock a change
   */
  unblock(changeId) {
    this.manualBlocks.delete(changeId);
    this.emit('change:unblocked', { changeId });
  }
  
  /**
   * Get status summary
   */
  getStatus() {
    return {
      enabled: this.options.enabled,
      strictMode: this.options.strictMode,
      rateLimiter: this.rateLimiter.getUsage(),
      activeEnvironments: this.isolationManager.getActiveEnvironments().length,
      manualBlocks: this.manualBlocks.size,
      pendingOverrides: this.overrideManager.getPendingRequests().length,
      activeOverrides: this.overrideManager.getActiveOverrides().length
    };
  }
  
  /**
   * Reset all safety state
   */
  reset() {
    this.manualBlocks.clear();
    this.failureTracker.clearAll();
    this.rateLimiter.operations = [];
    this.rateLimiter.cooldownUntil = null;
  }
}

export {
  SafetyController,
  RateLimiter,
  ConfidenceGate,
  IsolationManager,
  FailureTracker,
  HumanOverrideManager,
  SafetyCheckResult,
  SafetyStatus,
  BlockReason
};
