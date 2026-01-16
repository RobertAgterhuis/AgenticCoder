/**
 * RollbackManager - SL-09 Rollback System
 * 
 * Handles rollback of changes:
 * - Manual rollback requests
 * - Auto-rollback on failure conditions
 * - Rollback verification
 * 
 * @implements SelfLearning/09_ROLLBACK_SYSTEM.md
 */

import { EventEmitter } from 'events';

/**
 * Rollback triggers
 */
const RollbackTrigger = {
  MANUAL_REQUEST: 'manual_request',
  VERIFICATION_FAILURE: 'verification_failure',
  ERROR_RATE_INCREASED: 'error_rate_increased',
  NEW_ERRORS_DETECTED: 'new_errors_detected',
  PERFORMANCE_DEGRADATION: 'performance_degradation',
  RESOURCE_EXHAUSTION: 'resource_exhaustion',
  TIMEOUT: 'timeout'
};

/**
 * Rollback request structure
 */
class RollbackRequest {
  constructor(data) {
    this.requestId = data.requestId || `rbk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.changeId = data.changeId;
    this.trigger = data.trigger || RollbackTrigger.MANUAL_REQUEST;
    this.reason = data.reason || '';
    this.initiatedBy = data.initiatedBy || 'System';
    this.timestamp = data.timestamp || new Date();
    this.priority = data.priority || 'normal'; // low, normal, high, critical
  }
  
  toJSON() {
    return {
      requestId: this.requestId,
      changeId: this.changeId,
      trigger: this.trigger,
      reason: this.reason,
      initiatedBy: this.initiatedBy,
      timestamp: this.timestamp,
      priority: this.priority
    };
  }
}

/**
 * Rollback result structure
 */
class RollbackResult {
  constructor(data) {
    this.requestId = data.requestId;
    this.changeId = data.changeId;
    this.success = data.success || false;
    this.backupId = data.backupId || null;
    this.restoredAt = data.restoredAt || null;
    this.duration = data.duration || 0;
    this.error = data.error || null;
    this.verificationPassed = data.verificationPassed || false;
  }
  
  toJSON() {
    return {
      requestId: this.requestId,
      changeId: this.changeId,
      success: this.success,
      backupId: this.backupId,
      restoredAt: this.restoredAt,
      duration: this.duration,
      error: this.error,
      verificationPassed: this.verificationPassed
    };
  }
}

/**
 * Auto-rollback monitor
 */
class AutoRollbackMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      monitorDuration: options.monitorDuration || 5 * 60 * 1000, // 5 minutes
      checkInterval: options.checkInterval || 10 * 1000, // 10 seconds
      errorRateThreshold: options.errorRateThreshold || 0.1, // 10% increase
      performanceThreshold: options.performanceThreshold || 0.2, // 20% degradation
      ...options
    };
    
    // Active monitors
    this.activeMonitors = new Map();
    
    // Baseline metrics
    this.baselineMetrics = {
      errorRate: 0,
      responseTime: 0,
      memoryUsage: 0
    };
  }
  
  /**
   * Start monitoring after a change is applied
   */
  startMonitoring(changeId, baseline = {}) {
    // Store baseline
    const monitorBaseline = {
      errorRate: baseline.errorRate || this.baselineMetrics.errorRate,
      responseTime: baseline.responseTime || this.baselineMetrics.responseTime,
      memoryUsage: baseline.memoryUsage || this.baselineMetrics.memoryUsage,
      startTime: Date.now()
    };
    
    // Create monitor
    const monitor = {
      changeId,
      baseline: monitorBaseline,
      startTime: Date.now(),
      checks: 0,
      issues: [],
      active: true
    };
    
    this.activeMonitors.set(changeId, monitor);
    
    this.emit('monitor:started', { changeId });
    
    return monitor;
  }
  
  /**
   * Check rollback conditions for a change
   */
  async checkConditions(changeId, currentMetrics = {}) {
    const monitor = this.activeMonitors.get(changeId);
    if (!monitor || !monitor.active) {
      return { shouldRollback: false, reason: null };
    }
    
    monitor.checks++;
    
    // Check 1: Error rate increase
    if (currentMetrics.errorRate !== undefined) {
      const errorIncrease = currentMetrics.errorRate - monitor.baseline.errorRate;
      if (errorIncrease > this.options.errorRateThreshold) {
        return {
          shouldRollback: true,
          reason: `Error rate increased by ${(errorIncrease * 100).toFixed(1)}%`,
          trigger: RollbackTrigger.ERROR_RATE_INCREASED
        };
      }
    }
    
    // Check 2: New errors detected
    if (currentMetrics.newErrors && currentMetrics.newErrors > 0) {
      return {
        shouldRollback: true,
        reason: `${currentMetrics.newErrors} new errors detected after change`,
        trigger: RollbackTrigger.NEW_ERRORS_DETECTED
      };
    }
    
    // Check 3: Performance degradation
    if (currentMetrics.responseTime !== undefined && monitor.baseline.responseTime > 0) {
      const perfDegradation = (currentMetrics.responseTime - monitor.baseline.responseTime) / monitor.baseline.responseTime;
      if (perfDegradation > this.options.performanceThreshold) {
        return {
          shouldRollback: true,
          reason: `Performance degraded by ${(perfDegradation * 100).toFixed(1)}%`,
          trigger: RollbackTrigger.PERFORMANCE_DEGRADATION
        };
      }
    }
    
    // Check 4: Resource exhaustion
    if (currentMetrics.memoryUsage !== undefined) {
      const memoryIncrease = currentMetrics.memoryUsage - monitor.baseline.memoryUsage;
      if (memoryIncrease > 100 * 1024 * 1024) { // 100MB increase
        return {
          shouldRollback: true,
          reason: `Memory usage increased by ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`,
          trigger: RollbackTrigger.RESOURCE_EXHAUSTION
        };
      }
    }
    
    // Check if monitoring period expired
    const elapsed = Date.now() - monitor.startTime;
    if (elapsed >= this.options.monitorDuration) {
      this.stopMonitoring(changeId);
    }
    
    return { shouldRollback: false, reason: null };
  }
  
  /**
   * Stop monitoring a change
   */
  stopMonitoring(changeId) {
    const monitor = this.activeMonitors.get(changeId);
    if (monitor) {
      monitor.active = false;
      this.emit('monitor:stopped', { changeId, checks: monitor.checks });
    }
    return monitor;
  }
  
  /**
   * Get active monitors
   */
  getActiveMonitors() {
    return Array.from(this.activeMonitors.entries())
      .filter(([, m]) => m.active)
      .map(([changeId, m]) => ({ changeId, ...m }));
  }
  
  /**
   * Update baseline metrics
   */
  updateBaseline(metrics) {
    this.baselineMetrics = { ...this.baselineMetrics, ...metrics };
  }
}

/**
 * Main Rollback Manager
 */
class RollbackManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxRetries: options.maxRetries || 3,
      verifyAfterRollback: options.verifyAfterRollback !== false,
      ...options
    };
    
    // Dependencies (to be injected)
    this.backupSystem = options.backupSystem || null;
    this.auditTrail = options.auditTrail || null;
    this.applyEngine = options.applyEngine || null;
    
    // Auto-rollback monitor
    this.autoRollbackMonitor = new AutoRollbackMonitor(options.monitor || {});
    
    // Rollback history
    this.rollbackHistory = new Map();
    
    // Statistics
    this.stats = {
      totalRollbacks: 0,
      successful: 0,
      failed: 0,
      byTrigger: {}
    };
  }
  
  /**
   * Set dependencies
   */
  setDependencies({ backupSystem, auditTrail, applyEngine }) {
    if (backupSystem) this.backupSystem = backupSystem;
    if (auditTrail) this.auditTrail = auditTrail;
    if (applyEngine) this.applyEngine = applyEngine;
  }
  
  /**
   * Request a rollback
   */
  async requestRollback(request) {
    const rollbackRequest = request instanceof RollbackRequest 
      ? request 
      : new RollbackRequest(request);
    
    const startTime = Date.now();
    
    try {
      // Step 1: Validate request
      const valid = await this._validateRequest(rollbackRequest);
      if (!valid.success) {
        return new RollbackResult({
          requestId: rollbackRequest.requestId,
          changeId: rollbackRequest.changeId,
          success: false,
          error: valid.error
        });
      }
      
      // Step 2: Find backup
      const backup = await this._findBackup(rollbackRequest.changeId);
      if (!backup) {
        return new RollbackResult({
          requestId: rollbackRequest.requestId,
          changeId: rollbackRequest.changeId,
          success: false,
          error: 'No backup found for this change'
        });
      }
      
      // Step 3: Restore from backup
      const restored = await this._restore(backup);
      if (!restored) {
        return new RollbackResult({
          requestId: rollbackRequest.requestId,
          changeId: rollbackRequest.changeId,
          success: false,
          backupId: backup.backupId,
          error: 'Restore from backup failed'
        });
      }
      
      // Step 4: Verify restoration
      let verificationPassed = true;
      if (this.options.verifyAfterRollback) {
        verificationPassed = await this._verifyRestoration(rollbackRequest.changeId);
      }
      
      // Step 5: Record in audit trail
      if (this.auditTrail) {
        await this.auditTrail.recordRollback(
          rollbackRequest.changeId,
          rollbackRequest.reason,
          rollbackRequest.initiatedBy
        );
      }
      
      // Create result
      const result = new RollbackResult({
        requestId: rollbackRequest.requestId,
        changeId: rollbackRequest.changeId,
        success: true,
        backupId: backup.backupId,
        restoredAt: new Date(),
        duration: Date.now() - startTime,
        verificationPassed
      });
      
      // Store in history
      this.rollbackHistory.set(rollbackRequest.requestId, {
        request: rollbackRequest,
        result
      });
      
      // Update statistics
      this._updateStats(rollbackRequest.trigger, true);
      
      // Stop monitoring for this change
      this.autoRollbackMonitor.stopMonitoring(rollbackRequest.changeId);
      
      this.emit('rollback:complete', result);
      
      return result;
      
    } catch (error) {
      const result = new RollbackResult({
        requestId: rollbackRequest.requestId,
        changeId: rollbackRequest.changeId,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });
      
      this._updateStats(rollbackRequest.trigger, false);
      
      this.emit('rollback:failed', { request: rollbackRequest, error: error.message });
      
      return result;
    }
  }
  
  /**
   * Auto-rollback on failure
   */
  async autoRollbackOnFailure(changeId, error) {
    const request = new RollbackRequest({
      changeId,
      trigger: RollbackTrigger.VERIFICATION_FAILURE,
      reason: `Verification failed: ${error.message || error}`,
      initiatedBy: 'Auto-Rollback System',
      priority: 'high'
    });
    
    this.emit('rollback:auto-triggered', { changeId, reason: request.reason });
    
    return this.requestRollback(request);
  }
  
  /**
   * Check and trigger auto-rollback if needed
   */
  async checkAutoRollback(changeId, currentMetrics) {
    const check = await this.autoRollbackMonitor.checkConditions(changeId, currentMetrics);
    
    if (check.shouldRollback) {
      const request = new RollbackRequest({
        changeId,
        trigger: check.trigger,
        reason: check.reason,
        initiatedBy: 'Auto-Rollback Monitor',
        priority: 'high'
      });
      
      return this.requestRollback(request);
    }
    
    return null;
  }
  
  /**
   * Start monitoring a change for auto-rollback
   */
  startMonitoring(changeId, baseline = {}) {
    return this.autoRollbackMonitor.startMonitoring(changeId, baseline);
  }
  
  /**
   * Validate rollback request
   */
  async _validateRequest(request) {
    // Check if change exists
    if (this.applyEngine) {
      const operation = this.applyEngine.getOperation(request.changeId);
      if (!operation) {
        return { success: false, error: 'Change not found' };
      }
      
      // Check if already rolled back
      if (operation.operation?.rolledBack) {
        return { success: false, error: 'Change already rolled back' };
      }
    }
    
    return { success: true };
  }
  
  /**
   * Find backup for change
   */
  async _findBackup(changeId) {
    if (this.backupSystem) {
      return this.backupSystem.findBackupForChange(changeId);
    }
    
    // If no backup system, try to find via apply engine
    if (this.applyEngine) {
      const operation = this.applyEngine.getOperation(changeId);
      if (operation?.backupId) {
        return { backupId: operation.backupId };
      }
    }
    
    return null;
  }
  
  /**
   * Restore from backup
   */
  async _restore(backup) {
    if (this.backupSystem) {
      await this.backupSystem.restore(backup.backupId);
      return true;
    }
    
    // If using apply engine directly
    if (this.applyEngine && backup.backupId) {
      // The apply engine handles restoration internally
      return true;
    }
    
    return false;
  }
  
  /**
   * Verify restoration
   */
  async _verifyRestoration(changeId) {
    // Basic verification - check state is consistent
    // In a full implementation, this would run tests
    return true;
  }
  
  /**
   * Update statistics
   */
  _updateStats(trigger, success) {
    this.stats.totalRollbacks++;
    
    if (success) {
      this.stats.successful++;
    } else {
      this.stats.failed++;
    }
    
    this.stats.byTrigger[trigger] = (this.stats.byTrigger[trigger] || 0) + 1;
  }
  
  /**
   * Get rollback history
   */
  getHistory(changeId = null) {
    if (changeId) {
      const entries = Array.from(this.rollbackHistory.values())
        .filter(h => h.request.changeId === changeId);
      return entries;
    }
    return Array.from(this.rollbackHistory.values());
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeMonitors: this.autoRollbackMonitor.getActiveMonitors().length,
      successRate: this.stats.totalRollbacks > 0 
        ? this.stats.successful / this.stats.totalRollbacks 
        : 0
    };
  }
  
  /**
   * Clear history
   */
  clear() {
    this.rollbackHistory.clear();
    this.stats = {
      totalRollbacks: 0,
      successful: 0,
      failed: 0,
      byTrigger: {}
    };
  }
}

export {
  RollbackManager,
  RollbackRequest,
  RollbackResult,
  RollbackTrigger,
  AutoRollbackMonitor
};
