/**
 * AlertManager (OE-05)
 * 
 * Alert system for orchestration monitoring.
 * Manages thresholds, triggers alerts, and routes to notification channels.
 */

import { EventEmitter } from 'events';

// Alert levels
export const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Alert types
export const ALERT_TYPES = {
  // Task alerts
  TASK_BLOCKED: 'task_blocked',
  TASK_TIMEOUT: 'task_timeout',
  TASK_FAILED: 'task_failed',
  TASK_RETRY_EXHAUSTED: 'task_retry_exhausted',
  
  // Phase alerts
  PHASE_SLOW: 'phase_slow',
  PHASE_FAILED: 'phase_failed',
  
  // Workflow alerts
  WORKFLOW_FAILED: 'workflow_failed',
  WORKFLOW_SLOW: 'workflow_slow',
  
  // Validation alerts
  VALIDATION_FAILED: 'validation_failed',
  ARTIFACT_INVALID: 'artifact_invalid',
  
  // Resource alerts
  LOW_DISK_SPACE: 'low_disk_space',
  HIGH_MEMORY: 'high_memory',
  RATE_LIMIT: 'rate_limit',
  
  // Custom
  CUSTOM: 'custom'
};

// Default thresholds
const DEFAULT_THRESHOLDS = {
  task_blocked_minutes: 5,
  task_timeout_multiplier: 1.5,      // Alert when elapsed > estimated * multiplier
  phase_slow_multiplier: 1.2,
  max_retries_warning: 2,
  disk_space_warning_percent: 20,
  disk_space_error_percent: 10,
  memory_warning_percent: 80,
  memory_error_percent: 90
};

/**
 * Alert object
 */
export class Alert {
  constructor(options = {}) {
    this.id = options.id || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = options.type || ALERT_TYPES.CUSTOM;
    this.level = options.level || ALERT_LEVELS.WARNING;
    this.message = options.message || '';
    this.execution_id = options.executionId || null;
    this.task_id = options.taskId || null;
    this.phase_id = options.phaseId || null;
    this.timestamp = options.timestamp || new Date().toISOString();
    this.acknowledged = false;
    this.acknowledged_at = null;
    this.acknowledged_by = null;
    this.resolved = false;
    this.resolved_at = null;
    this.details = options.details || {};
    this.action = options.action || null;
  }

  acknowledge(by = 'system') {
    this.acknowledged = true;
    this.acknowledged_at = new Date().toISOString();
    this.acknowledged_by = by;
  }

  resolve() {
    this.resolved = true;
    this.resolved_at = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      level: this.level,
      message: this.message,
      execution_id: this.execution_id,
      task_id: this.task_id,
      phase_id: this.phase_id,
      timestamp: this.timestamp,
      acknowledged: this.acknowledged,
      resolved: this.resolved,
      details: this.details
    };
  }
}

/**
 * AlertManager - Manages alerts and thresholds
 */
export class AlertManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Thresholds
      thresholds: { ...DEFAULT_THRESHOLDS, ...options.thresholds },
      // Maximum alerts to retain
      maxAlerts: options.maxAlerts || 1000,
      // Auto-acknowledge after (ms), 0 = never
      autoAcknowledgeMs: options.autoAcknowledgeMs || 0,
      // Deduplicate similar alerts within window (ms)
      dedupeWindowMs: options.dedupeWindowMs || 60000,
      // Enable notification channels
      enableEmail: options.enableEmail || false,
      enableSlack: options.enableSlack || false,
      enableWebhook: options.enableWebhook || false,
      webhookUrl: options.webhookUrl || null,
      ...options
    };
    
    // Alert storage
    this.alerts = new Map();         // id -> Alert
    this.alertsByExecution = new Map(); // executionId -> Set<alertId>
    this.recentAlertKeys = new Map();   // dedupeKey -> timestamp (for deduplication)
    
    // Statistics
    this.stats = {
      total_alerts: 0,
      alerts_by_level: {
        [ALERT_LEVELS.INFO]: 0,
        [ALERT_LEVELS.WARNING]: 0,
        [ALERT_LEVELS.ERROR]: 0,
        [ALERT_LEVELS.CRITICAL]: 0
      },
      alerts_acknowledged: 0,
      alerts_resolved: 0,
      notifications_sent: 0
    };
    
    // Notification handlers
    this.notificationHandlers = new Map();
  }

  // ==========================================================================
  // Alert Creation
  // ==========================================================================

  /**
   * Create a new alert
   */
  createAlert(options) {
    // Check for duplicate
    const dedupeKey = this._getDedupeKey(options);
    if (this._isDuplicate(dedupeKey)) {
      return null;
    }
    
    const alert = new Alert(options);
    
    // Store alert
    this.alerts.set(alert.id, alert);
    
    // Index by execution
    if (alert.execution_id) {
      if (!this.alertsByExecution.has(alert.execution_id)) {
        this.alertsByExecution.set(alert.execution_id, new Set());
      }
      this.alertsByExecution.get(alert.execution_id).add(alert.id);
    }
    
    // Mark as recent for deduplication
    this.recentAlertKeys.set(dedupeKey, Date.now());
    
    // Update stats
    this.stats.total_alerts++;
    this.stats.alerts_by_level[alert.level]++;
    
    // Trim old alerts
    this._trimAlerts();
    
    // Clean old dedupe keys
    this._cleanDedupeKeys();
    
    // Emit event
    this.emit('alert:created', alert);
    
    // Send notifications
    this._sendNotifications(alert);
    
    // Auto-acknowledge if configured
    if (this.options.autoAcknowledgeMs > 0) {
      setTimeout(() => {
        if (!alert.acknowledged) {
          this.acknowledgeAlert(alert.id, 'auto');
        }
      }, this.options.autoAcknowledgeMs);
    }
    
    return alert;
  }

  /**
   * Create alert from threshold check
   */
  checkThreshold(type, value, context = {}) {
    const { thresholds } = this.options;
    let alert = null;
    
    switch (type) {
      case 'task_blocked_minutes':
        if (value >= thresholds.task_blocked_minutes) {
          alert = this.createAlert({
            type: ALERT_TYPES.TASK_BLOCKED,
            level: value >= thresholds.task_blocked_minutes * 2 ? ALERT_LEVELS.ERROR : ALERT_LEVELS.WARNING,
            message: `Task ${context.taskId} blocked for ${value} minutes`,
            action: 'investigate_blocking_task',
            ...context
          });
        }
        break;
        
      case 'task_timeout':
        if (value >= context.estimatedMinutes * thresholds.task_timeout_multiplier) {
          alert = this.createAlert({
            type: ALERT_TYPES.TASK_TIMEOUT,
            level: ALERT_LEVELS.WARNING,
            message: `Task ${context.taskId} exceeding time estimate (${value}/${context.estimatedMinutes} min)`,
            action: 'escalate_or_cancel',
            ...context
          });
        }
        break;
        
      case 'phase_slow':
        if (value >= context.estimatedMinutes * thresholds.phase_slow_multiplier) {
          alert = this.createAlert({
            type: ALERT_TYPES.PHASE_SLOW,
            level: ALERT_LEVELS.WARNING,
            message: `Phase ${context.phaseId} behind schedule`,
            action: 'monitor_closely',
            ...context
          });
        }
        break;
        
      case 'retry_count':
        if (value >= thresholds.max_retries_warning) {
          alert = this.createAlert({
            type: ALERT_TYPES.TASK_RETRY_EXHAUSTED,
            level: value >= 3 ? ALERT_LEVELS.ERROR : ALERT_LEVELS.WARNING,
            message: `Task ${context.taskId} retry count: ${value}`,
            action: 'manual_intervention',
            ...context
          });
        }
        break;
        
      case 'disk_space_percent':
        if (value <= thresholds.disk_space_error_percent) {
          alert = this.createAlert({
            type: ALERT_TYPES.LOW_DISK_SPACE,
            level: ALERT_LEVELS.ERROR,
            message: `Disk space critically low: ${value}% free`,
            action: 'cleanup_or_add_storage',
            ...context
          });
        } else if (value <= thresholds.disk_space_warning_percent) {
          alert = this.createAlert({
            type: ALERT_TYPES.LOW_DISK_SPACE,
            level: ALERT_LEVELS.WARNING,
            message: `Disk space running low: ${value}% free`,
            action: 'cleanup_or_add_storage',
            ...context
          });
        }
        break;
        
      case 'memory_percent':
        if (value >= thresholds.memory_error_percent) {
          alert = this.createAlert({
            type: ALERT_TYPES.HIGH_MEMORY,
            level: ALERT_LEVELS.ERROR,
            message: `Memory usage critical: ${value}%`,
            action: 'reduce_load',
            ...context
          });
        } else if (value >= thresholds.memory_warning_percent) {
          alert = this.createAlert({
            type: ALERT_TYPES.HIGH_MEMORY,
            level: ALERT_LEVELS.WARNING,
            message: `Memory usage high: ${value}%`,
            action: 'monitor_closely',
            ...context
          });
        }
        break;
    }
    
    return alert;
  }

  // ==========================================================================
  // Alert Management
  // ==========================================================================

  /**
   * Get alert by ID
   */
  getAlert(alertId) {
    return this.alerts.get(alertId);
  }

  /**
   * Get alerts for execution
   */
  getAlertsForExecution(executionId, options = {}) {
    const alertIds = this.alertsByExecution.get(executionId) || new Set();
    let alerts = [...alertIds].map(id => this.alerts.get(id)).filter(Boolean);
    
    // Filter by level
    if (options.level) {
      alerts = alerts.filter(a => a.level === options.level);
    }
    
    // Filter by type
    if (options.type) {
      alerts = alerts.filter(a => a.type === options.type);
    }
    
    // Filter by resolved status
    if (options.resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === options.resolved);
    }
    
    // Filter by acknowledged status
    if (options.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === options.acknowledged);
    }
    
    // Sort by timestamp (newest first)
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit
    if (options.limit) {
      alerts = alerts.slice(0, options.limit);
    }
    
    return alerts;
  }

  /**
   * Get active (unresolved) alerts
   */
  getActiveAlerts(executionId = null) {
    if (executionId) {
      return this.getAlertsForExecution(executionId, { resolved: false });
    }
    return [...this.alerts.values()].filter(a => !a.resolved);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId, by = 'user') {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledge(by);
      this.stats.alerts_acknowledged++;
      this.emit('alert:acknowledged', alert);
    }
    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolve();
      this.stats.alerts_resolved++;
      this.emit('alert:resolved', alert);
    }
    return alert;
  }

  /**
   * Resolve all alerts for an execution
   */
  resolveAllForExecution(executionId) {
    const alertIds = this.alertsByExecution.get(executionId) || new Set();
    for (const alertId of alertIds) {
      this.resolveAlert(alertId);
    }
  }

  // ==========================================================================
  // Notifications
  // ==========================================================================

  /**
   * Register a notification handler
   */
  registerNotificationHandler(name, handler) {
    this.notificationHandlers.set(name, handler);
  }

  /**
   * Send notifications for an alert
   */
  async _sendNotifications(alert) {
    // Only send for warning, error, critical
    if (alert.level === ALERT_LEVELS.INFO) {
      return;
    }
    
    // Custom handlers
    for (const [name, handler] of this.notificationHandlers) {
      try {
        await handler(alert);
        this.stats.notifications_sent++;
      } catch (error) {
        this.emit('notification:error', { handler: name, error: error.message });
      }
    }
    
    // Built-in webhook
    if (this.options.enableWebhook && this.options.webhookUrl) {
      try {
        await this._sendWebhook(alert);
        this.stats.notifications_sent++;
      } catch (error) {
        this.emit('notification:error', { handler: 'webhook', error: error.message });
      }
    }
    
    this.emit('alert:notified', alert);
  }

  async _sendWebhook(alert) {
    // In production, use fetch or axios
    // For now, just emit an event that can be handled externally
    this.emit('webhook:send', {
      url: this.options.webhookUrl,
      payload: alert.toJSON()
    });
  }

  // ==========================================================================
  // Internal Helpers
  // ==========================================================================

  _getDedupeKey(options) {
    return `${options.type}_${options.executionId || ''}_${options.taskId || ''}_${options.phaseId || ''}`;
  }

  _isDuplicate(dedupeKey) {
    const lastTime = this.recentAlertKeys.get(dedupeKey);
    if (!lastTime) return false;
    return (Date.now() - lastTime) < this.options.dedupeWindowMs;
  }

  _cleanDedupeKeys() {
    const now = Date.now();
    for (const [key, time] of this.recentAlertKeys) {
      if (now - time > this.options.dedupeWindowMs) {
        this.recentAlertKeys.delete(key);
      }
    }
  }

  _trimAlerts() {
    if (this.alerts.size > this.options.maxAlerts) {
      // Remove oldest resolved alerts first
      const sorted = [...this.alerts.values()]
        .sort((a, b) => {
          // Prioritize keeping unresolved alerts
          if (a.resolved !== b.resolved) return a.resolved ? -1 : 1;
          // Then by timestamp
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
      
      const toRemove = sorted.slice(0, this.alerts.size - this.options.maxAlerts);
      for (const alert of toRemove) {
        this.alerts.delete(alert.id);
        if (alert.execution_id) {
          this.alertsByExecution.get(alert.execution_id)?.delete(alert.id);
        }
      }
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      active_alerts: this.getActiveAlerts().length
    };
  }
}

export default AlertManager;
