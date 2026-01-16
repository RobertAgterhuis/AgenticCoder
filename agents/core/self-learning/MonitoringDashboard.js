/**
 * MonitoringDashboard - SL-10 Monitoring & Alerts
 * 
 * Provides:
 * - Metrics collection
 * - Alert management
 * - Dashboard interface
 * 
 * @implements SelfLearning/10_MONITORING_ALERTS.md
 */

import { EventEmitter } from 'events';

/**
 * Alert severity levels
 */
const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Metric types
 */
const MetricType = {
  COUNTER: 'counter',
  GAUGE: 'gauge',
  HISTOGRAM: 'histogram',
  RATE: 'rate'
};

/**
 * System metrics to track
 */
const SystemMetric = {
  ERRORS_CAPTURED: 'errors_captured',
  ERRORS_RESOLVED: 'errors_resolved',
  FIXES_PROPOSED: 'fixes_proposed',
  FIXES_APPLIED: 'fixes_applied',
  FIXES_REJECTED: 'fixes_rejected',
  ROLLBACKS_PERFORMED: 'rollbacks_performed',
  VALIDATION_PASSES: 'validation_passes',
  VALIDATION_FAILURES: 'validation_failures',
  ANALYSIS_DURATION: 'analysis_duration',
  FIX_DURATION: 'fix_duration',
  APPLY_DURATION: 'apply_duration',
  SUCCESS_RATE: 'success_rate',
  ERROR_RATE: 'error_rate'
};

/**
 * Metric entry
 */
class MetricEntry {
  constructor(data) {
    this.name = data.name;
    this.type = data.type || MetricType.GAUGE;
    this.value = data.value || 0;
    this.labels = data.labels || {};
    this.timestamp = data.timestamp || new Date();
  }
  
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      value: this.value,
      labels: this.labels,
      timestamp: this.timestamp
    };
  }
}

/**
 * Alert entry
 */
class Alert {
  constructor(data) {
    this.alertId = data.alertId || `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.name = data.name;
    this.severity = data.severity || AlertSeverity.WARNING;
    this.message = data.message;
    this.metric = data.metric || null;
    this.threshold = data.threshold || null;
    this.currentValue = data.currentValue || null;
    this.timestamp = data.timestamp || new Date();
    this.acknowledged = data.acknowledged || false;
    this.resolvedAt = data.resolvedAt || null;
  }
  
  acknowledge() {
    this.acknowledged = true;
  }
  
  resolve() {
    this.resolvedAt = new Date();
  }
  
  isActive() {
    return !this.resolvedAt;
  }
  
  toJSON() {
    return {
      alertId: this.alertId,
      name: this.name,
      severity: this.severity,
      message: this.message,
      metric: this.metric,
      threshold: this.threshold,
      currentValue: this.currentValue,
      timestamp: this.timestamp,
      acknowledged: this.acknowledged,
      resolvedAt: this.resolvedAt
    };
  }
}

/**
 * Alert threshold configuration
 */
class AlertThreshold {
  constructor(data) {
    this.metric = data.metric;
    this.name = data.name;
    this.operator = data.operator || 'gt'; // gt, lt, gte, lte, eq
    this.value = data.value;
    this.severity = data.severity || AlertSeverity.WARNING;
    this.cooldown = data.cooldown || 5 * 60 * 1000; // 5 minutes
    this.lastTriggered = null;
    this.enabled = data.enabled !== false;
  }
  
  check(currentValue) {
    if (!this.enabled) return false;
    
    // Check cooldown
    if (this.lastTriggered && Date.now() - this.lastTriggered < this.cooldown) {
      return false;
    }
    
    let triggered = false;
    
    switch (this.operator) {
      case 'gt':
        triggered = currentValue > this.value;
        break;
      case 'lt':
        triggered = currentValue < this.value;
        break;
      case 'gte':
        triggered = currentValue >= this.value;
        break;
      case 'lte':
        triggered = currentValue <= this.value;
        break;
      case 'eq':
        triggered = currentValue === this.value;
        break;
    }
    
    if (triggered) {
      this.lastTriggered = Date.now();
    }
    
    return triggered;
  }
}

/**
 * Metrics Collector
 */
class MetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      retentionPeriod: options.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
      aggregationInterval: options.aggregationInterval || 60 * 1000, // 1 minute
      ...options
    };
    
    // Current metrics
    this.metrics = new Map();
    
    // Historical data
    this.history = new Map();
    
    // Counters
    this.counters = new Map();
  }
  
  /**
   * Record a metric
   */
  record(name, value, labels = {}) {
    const entry = new MetricEntry({ name, value, labels, type: MetricType.GAUGE });
    
    this.metrics.set(name, entry);
    
    // Add to history
    if (!this.history.has(name)) {
      this.history.set(name, []);
    }
    this.history.get(name).push(entry);
    
    // Cleanup old history
    this._cleanupHistory(name);
    
    this.emit('metric:recorded', entry);
    
    return entry;
  }
  
  /**
   * Increment a counter
   */
  increment(name, amount = 1, labels = {}) {
    const current = this.counters.get(name) || 0;
    const newValue = current + amount;
    this.counters.set(name, newValue);
    
    const entry = new MetricEntry({ name, value: newValue, labels, type: MetricType.COUNTER });
    this.metrics.set(name, entry);
    
    this.emit('metric:incremented', { name, value: newValue });
    
    return newValue;
  }
  
  /**
   * Record duration (histogram)
   */
  recordDuration(name, duration, labels = {}) {
    const histKey = `${name}_histogram`;
    
    if (!this.history.has(histKey)) {
      this.history.set(histKey, []);
    }
    
    this.history.get(histKey).push({
      value: duration,
      timestamp: Date.now(),
      labels
    });
    
    // Calculate percentiles
    const values = this.history.get(histKey).map(h => h.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    const stats = {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this._percentile(sorted, 50),
      p95: this._percentile(sorted, 95),
      p99: this._percentile(sorted, 99)
    };
    
    this.metrics.set(name, new MetricEntry({ name, value: stats, type: MetricType.HISTOGRAM }));
    
    return stats;
  }
  
  /**
   * Get current metric value
   */
  get(name) {
    return this.metrics.get(name);
  }
  
  /**
   * Get all current metrics
   */
  getAll() {
    const result = {};
    this.metrics.forEach((entry, name) => {
      result[name] = entry.value;
    });
    return result;
  }
  
  /**
   * Get metric history
   */
  getHistory(name, duration = null) {
    const history = this.history.get(name) || [];
    
    if (duration) {
      const cutoff = Date.now() - duration;
      return history.filter(h => h.timestamp >= cutoff);
    }
    
    return history;
  }
  
  /**
   * Calculate percentile
   */
  _percentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  /**
   * Cleanup old history entries
   */
  _cleanupHistory(name) {
    const history = this.history.get(name);
    if (!history) return;
    
    const cutoff = Date.now() - this.options.retentionPeriod;
    const filtered = history.filter(h => {
      const ts = h.timestamp instanceof Date ? h.timestamp.getTime() : h.timestamp;
      return ts >= cutoff;
    });
    
    this.history.set(name, filtered);
  }
  
  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.history.clear();
    this.counters.clear();
  }
}

/**
 * Alert Manager
 */
class AlertManager extends EventEmitter {
  constructor(metricsCollector, options = {}) {
    super();
    
    this.metrics = metricsCollector;
    
    this.options = {
      maxActiveAlerts: options.maxActiveAlerts || 100,
      retentionPeriod: options.retentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
      ...options
    };
    
    // Alert thresholds
    this.thresholds = new Map();
    
    // Active alerts
    this.activeAlerts = new Map();
    
    // Alert history
    this.alertHistory = [];
    
    // Setup default thresholds
    this._setupDefaultThresholds();
  }
  
  /**
   * Setup default alert thresholds
   */
  _setupDefaultThresholds() {
    // High error rate alert
    this.addThreshold(new AlertThreshold({
      metric: SystemMetric.ERROR_RATE,
      name: 'High Error Rate',
      operator: 'gt',
      value: 0.1,
      severity: AlertSeverity.WARNING
    }));
    
    // Critical error rate
    this.addThreshold(new AlertThreshold({
      metric: SystemMetric.ERROR_RATE,
      name: 'Critical Error Rate',
      operator: 'gt',
      value: 0.25,
      severity: AlertSeverity.CRITICAL
    }));
    
    // Low success rate
    this.addThreshold(new AlertThreshold({
      metric: SystemMetric.SUCCESS_RATE,
      name: 'Low Success Rate',
      operator: 'lt',
      value: 0.5,
      severity: AlertSeverity.WARNING
    }));
    
    // High rollback count
    this.addThreshold(new AlertThreshold({
      metric: SystemMetric.ROLLBACKS_PERFORMED,
      name: 'High Rollback Count',
      operator: 'gt',
      value: 5,
      severity: AlertSeverity.WARNING
    }));
  }
  
  /**
   * Add alert threshold
   */
  addThreshold(threshold) {
    const key = `${threshold.metric}_${threshold.name}`;
    this.thresholds.set(key, threshold);
    return threshold;
  }
  
  /**
   * Remove threshold
   */
  removeThreshold(metric, name) {
    const key = `${metric}_${name}`;
    return this.thresholds.delete(key);
  }
  
  /**
   * Check all thresholds
   */
  checkThresholds() {
    const triggered = [];
    
    this.thresholds.forEach((threshold, key) => {
      const metric = this.metrics.get(threshold.metric);
      if (!metric) return;
      
      const value = typeof metric.value === 'object' ? metric.value.avg : metric.value;
      
      if (threshold.check(value)) {
        const alert = this._createAlert(threshold, value);
        triggered.push(alert);
      }
    });
    
    return triggered;
  }
  
  /**
   * Create an alert
   */
  _createAlert(threshold, currentValue) {
    const alert = new Alert({
      name: threshold.name,
      severity: threshold.severity,
      message: `${threshold.name}: ${threshold.metric} is ${currentValue} (threshold: ${threshold.operator} ${threshold.value})`,
      metric: threshold.metric,
      threshold: threshold.value,
      currentValue
    });
    
    this.activeAlerts.set(alert.alertId, alert);
    this.alertHistory.push(alert);
    
    // Cleanup if too many alerts
    if (this.activeAlerts.size > this.options.maxActiveAlerts) {
      const oldest = Array.from(this.activeAlerts.values())[0];
      this.activeAlerts.delete(oldest.alertId);
    }
    
    this.emit('alert:triggered', alert);
    
    return alert;
  }
  
  /**
   * Fire a manual alert
   */
  fireAlert(data) {
    const alert = new Alert(data);
    
    this.activeAlerts.set(alert.alertId, alert);
    this.alertHistory.push(alert);
    
    this.emit('alert:triggered', alert);
    
    return alert;
  }
  
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledge();
      this.emit('alert:acknowledged', alert);
    }
    return alert;
  }
  
  /**
   * Resolve an alert
   */
  resolveAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolve();
      this.activeAlerts.delete(alertId);
      this.emit('alert:resolved', alert);
    }
    return alert;
  }
  
  /**
   * Get active alerts
   */
  getActiveAlerts(severity = null) {
    const alerts = Array.from(this.activeAlerts.values());
    if (severity) {
      return alerts.filter(a => a.severity === severity);
    }
    return alerts;
  }
  
  /**
   * Get alert history
   */
  getAlertHistory(filter = {}) {
    let history = [...this.alertHistory];
    
    if (filter.severity) {
      history = history.filter(a => a.severity === filter.severity);
    }
    
    if (filter.metric) {
      history = history.filter(a => a.metric === filter.metric);
    }
    
    if (filter.since) {
      history = history.filter(a => a.timestamp >= filter.since);
    }
    
    return history;
  }
  
  /**
   * Clear alerts
   */
  clear() {
    this.activeAlerts.clear();
    this.alertHistory = [];
  }
}

/**
 * Dashboard Interface
 */
class Dashboard extends EventEmitter {
  constructor(metricsCollector, alertManager, options = {}) {
    super();
    
    this.metrics = metricsCollector;
    this.alerts = alertManager;
    
    this.options = {
      refreshInterval: options.refreshInterval || 30 * 1000, // 30 seconds
      ...options
    };
    
    this.lastRefresh = null;
    this.refreshTimer = null;
  }
  
  /**
   * Get dashboard summary
   */
  getSummary() {
    const metrics = this.metrics.getAll();
    const activeAlerts = this.alerts.getActiveAlerts();
    
    // Calculate key stats
    const errorsTotal = metrics[SystemMetric.ERRORS_CAPTURED] || 0;
    const errorsResolved = metrics[SystemMetric.ERRORS_RESOLVED] || 0;
    const fixesApplied = metrics[SystemMetric.FIXES_APPLIED] || 0;
    const fixesRejected = metrics[SystemMetric.FIXES_REJECTED] || 0;
    const rollbacks = metrics[SystemMetric.ROLLBACKS_PERFORMED] || 0;
    
    return {
      timestamp: new Date(),
      status: this._calculateStatus(activeAlerts),
      overview: {
        errorsTotal,
        errorsResolved,
        resolutionRate: errorsTotal > 0 ? errorsResolved / errorsTotal : 0,
        fixesApplied,
        fixesRejected,
        fixSuccessRate: (fixesApplied + fixesRejected) > 0 
          ? fixesApplied / (fixesApplied + fixesRejected) 
          : 0,
        rollbacks
      },
      alerts: {
        total: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
        warning: activeAlerts.filter(a => a.severity === AlertSeverity.WARNING).length
      },
      metrics: metrics
    };
  }
  
  /**
   * Calculate system status
   */
  _calculateStatus(activeAlerts) {
    if (activeAlerts.some(a => a.severity === AlertSeverity.CRITICAL)) {
      return 'critical';
    }
    if (activeAlerts.some(a => a.severity === AlertSeverity.ERROR)) {
      return 'error';
    }
    if (activeAlerts.some(a => a.severity === AlertSeverity.WARNING)) {
      return 'warning';
    }
    return 'healthy';
  }
  
  /**
   * Get detailed metrics
   */
  getDetailedMetrics() {
    const summary = this.getSummary();
    
    return {
      ...summary,
      durations: {
        analysis: this.metrics.get(SystemMetric.ANALYSIS_DURATION)?.value || {},
        fix: this.metrics.get(SystemMetric.FIX_DURATION)?.value || {},
        apply: this.metrics.get(SystemMetric.APPLY_DURATION)?.value || {}
      },
      trends: this._calculateTrends()
    };
  }
  
  /**
   * Calculate trends
   */
  _calculateTrends() {
    const trends = {};
    
    // Error trend (last hour vs previous hour)
    const errorHistory = this.metrics.getHistory(SystemMetric.ERRORS_CAPTURED, 2 * 60 * 60 * 1000);
    if (errorHistory.length > 0) {
      const hourAgo = Date.now() - 60 * 60 * 1000;
      const recent = errorHistory.filter(h => h.timestamp >= hourAgo).length;
      const previous = errorHistory.filter(h => h.timestamp < hourAgo).length;
      
      trends.errors = {
        recent,
        previous,
        direction: recent > previous ? 'up' : recent < previous ? 'down' : 'stable'
      };
    }
    
    return trends;
  }
  
  /**
   * Start auto-refresh
   */
  startAutoRefresh(callback) {
    this.refreshTimer = setInterval(() => {
      const summary = this.getSummary();
      this.lastRefresh = new Date();
      this.emit('dashboard:refresh', summary);
      if (callback) callback(summary);
    }, this.options.refreshInterval);
  }
  
  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  /**
   * Format summary as text
   */
  formatAsText() {
    const summary = this.getSummary();
    
    let output = [];
    output.push('=== Self-Learning Dashboard ===');
    output.push(`Status: ${summary.status.toUpperCase()}`);
    output.push(`Time: ${summary.timestamp.toISOString()}`);
    output.push('');
    output.push('--- Overview ---');
    output.push(`Errors Captured: ${summary.overview.errorsTotal}`);
    output.push(`Errors Resolved: ${summary.overview.errorsResolved} (${(summary.overview.resolutionRate * 100).toFixed(1)}%)`);
    output.push(`Fixes Applied: ${summary.overview.fixesApplied}`);
    output.push(`Fixes Rejected: ${summary.overview.fixesRejected}`);
    output.push(`Fix Success Rate: ${(summary.overview.fixSuccessRate * 100).toFixed(1)}%`);
    output.push(`Rollbacks: ${summary.overview.rollbacks}`);
    output.push('');
    output.push('--- Alerts ---');
    output.push(`Active: ${summary.alerts.total} (Critical: ${summary.alerts.critical}, Warning: ${summary.alerts.warning})`);
    
    return output.join('\n');
  }
}

/**
 * Main Monitoring System
 */
class MonitoringSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.metrics = new MetricsCollector(options.metrics || {});
    this.alerts = new AlertManager(this.metrics, options.alerts || {});
    this.dashboard = new Dashboard(this.metrics, this.alerts, options.dashboard || {});
    
    // Forward events
    this.metrics.on('metric:recorded', (entry) => this.emit('metric', entry));
    this.alerts.on('alert:triggered', (alert) => this.emit('alert', alert));
  }
  
  /**
   * Record a metric
   */
  record(name, value, labels = {}) {
    return this.metrics.record(name, value, labels);
  }
  
  /**
   * Increment a counter
   */
  increment(name, amount = 1) {
    return this.metrics.increment(name, amount);
  }
  
  /**
   * Record duration
   */
  recordDuration(name, duration) {
    return this.metrics.recordDuration(name, duration);
  }
  
  /**
   * Check thresholds and trigger alerts
   */
  checkAlerts() {
    return this.alerts.checkThresholds();
  }
  
  /**
   * Get dashboard summary
   */
  getSummary() {
    return this.dashboard.getSummary();
  }
  
  /**
   * Get dashboard as text
   */
  getTextSummary() {
    return this.dashboard.formatAsText();
  }
}

export {
  MonitoringSystem,
  MetricsCollector,
  AlertManager,
  Dashboard,
  Alert,
  AlertThreshold,
  MetricEntry,
  AlertSeverity,
  MetricType,
  SystemMetric
};
