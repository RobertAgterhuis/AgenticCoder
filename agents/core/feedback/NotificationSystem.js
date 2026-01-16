/**
 * NotificationSystem (FL-05)
 * 
 * Multi-channel notification system for alerting stakeholders.
 * Supports email, Slack, Teams, webhooks, and SMS.
 * 
 * Responsibilities:
 * - Send notifications on execution events
 * - Support multiple notification channels
 * - Manage notification rules and templates
 * - Queue and retry failed notifications
 * - Track delivery status
 */

import { EventEmitter } from 'events';

// Notification channels
export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SLACK: 'slack',
  TEAMS: 'teams',
  WEBHOOK: 'webhook',
  SMS: 'sms',
  CONSOLE: 'console'    // For development/testing
};

// Notification severities
export const NOTIFICATION_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Notification triggers
export const NOTIFICATION_TRIGGERS = {
  PHASE_STARTED: 'phase_started',
  PHASE_COMPLETED: 'phase_completed',
  TASK_COMPLETED: 'task_completed',
  TASK_FAILED: 'task_failed',
  VALIDATION_FAILED: 'validation_failed',
  EXECUTION_COMPLETED: 'execution_completed',
  EXECUTION_FAILED: 'execution_failed',
  ERROR_OCCURRED: 'error_occurred',
  MANUAL_REVIEW_REQUIRED: 'manual_review_required'
};

// Delivery status
export const DELIVERY_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  RETRYING: 'retrying'
};

export class NotificationSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.rules = new Map();              // rule_id -> NotificationRule
    this.notifications = new Map();       // notification_id -> Notification
    this.queue = [];                     // Pending notifications
    this.channelProviders = new Map();   // channel -> provider function
    this.templates = new Map();          // template_id -> template
    this.retryDelayMs = options.retryDelayMs || 5000;
    this.maxRetries = options.maxRetries || 3;
    this.batchSize = options.batchSize || 10;
    this.processingInterval = options.processingInterval || 1000;
    this.intervalHandle = null;

    // Register default providers
    this._registerDefaultProviders();
    
    // Load default templates
    this._loadDefaultTemplates();
  }

  /**
   * Register a notification rule
   */
  registerRule(rule) {
    if (!rule.rule_id) {
      rule.rule_id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const normalizedRule = {
      rule_id: rule.rule_id,
      enabled: rule.enabled !== false,
      trigger: rule.trigger,
      condition: rule.condition || null,
      recipients: rule.recipients || {},
      template: rule.template || 'default',
      severity: rule.severity || NOTIFICATION_SEVERITY.INFO,
      throttle_ms: rule.throttle_ms || 0,
      last_triggered: null
    };

    this.rules.set(rule.rule_id, normalizedRule);
    this.emit('rule-registered', normalizedRule);
    return normalizedRule;
  }

  /**
   * Remove a notification rule
   */
  removeRule(ruleId) {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.emit('rule-removed', { rule_id: ruleId });
    }
    return removed;
  }

  /**
   * Register a channel provider
   */
  registerChannelProvider(channel, provider) {
    this.channelProviders.set(channel, provider);
    this.emit('provider-registered', { channel });
  }

  /**
   * Register a notification template
   */
  registerTemplate(templateId, template) {
    this.templates.set(templateId, template);
  }

  /**
   * Notify on phase started
   */
  async notifyPhaseStarted(phase, context = {}) {
    return this._triggerNotifications(NOTIFICATION_TRIGGERS.PHASE_STARTED, {
      phase,
      ...context
    });
  }

  /**
   * Notify on phase completed
   */
  async notifyPhaseCompleted(phase, context = {}) {
    return this._triggerNotifications(NOTIFICATION_TRIGGERS.PHASE_COMPLETED, {
      phase,
      ...context
    });
  }

  /**
   * Notify on task completed
   */
  async notifyTaskCompleted(task, context = {}) {
    return this._triggerNotifications(NOTIFICATION_TRIGGERS.TASK_COMPLETED, {
      task,
      ...context
    });
  }

  /**
   * Notify on task failed
   */
  async notifyTaskFailed(task, error, context = {}) {
    return this._triggerNotifications(NOTIFICATION_TRIGGERS.TASK_FAILED, {
      task,
      error,
      ...context
    });
  }

  /**
   * Notify on validation failed
   */
  async notifyValidationFailed(issues, context = {}) {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    return this._triggerNotifications(NOTIFICATION_TRIGGERS.VALIDATION_FAILED, {
      issues,
      error_count: errorCount,
      ...context
    });
  }

  /**
   * Notify on execution completed
   */
  async notifyExecutionCompleted(result, context = {}) {
    return this._triggerNotifications(NOTIFICATION_TRIGGERS.EXECUTION_COMPLETED, {
      result,
      ...context
    });
  }

  /**
   * Notify on execution failed
   */
  async notifyExecutionFailed(error, context = {}) {
    return this._triggerNotifications(NOTIFICATION_TRIGGERS.EXECUTION_FAILED, {
      error,
      ...context
    });
  }

  /**
   * Notify on error occurred
   */
  async notifyError(error, context = {}) {
    return this._triggerNotifications(NOTIFICATION_TRIGGERS.ERROR_OCCURRED, {
      error,
      ...context
    });
  }

  /**
   * Notify on manual review required
   */
  async notifyManualReviewRequired(reason, details, context = {}) {
    return this._triggerNotifications(NOTIFICATION_TRIGGERS.MANUAL_REVIEW_REQUIRED, {
      reason,
      details,
      ...context
    });
  }

  /**
   * Send a direct notification (bypasses rules)
   */
  async sendNotification(notification) {
    const normalizedNotification = this._normalizeNotification(notification);
    this.notifications.set(normalizedNotification.notification_id, normalizedNotification);
    
    return this._sendToChannel(normalizedNotification);
  }

  /**
   * Get notification by ID
   */
  getNotification(notificationId) {
    return this.notifications.get(notificationId) || null;
  }

  /**
   * Get notifications by status
   */
  getNotificationsByStatus(status) {
    return Array.from(this.notifications.values())
      .filter(n => n.delivery_status === status);
  }

  /**
   * Get pending notifications
   */
  getPendingNotifications() {
    return [...this.queue];
  }

  /**
   * Start queue processing
   */
  startProcessing() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }

    this.intervalHandle = setInterval(() => {
      this._processQueue();
    }, this.processingInterval);

    this.emit('processing-started');
  }

  /**
   * Stop queue processing
   */
  stopProcessing() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.emit('processing-stopped');
  }

  /**
   * Get all registered rules
   */
  getRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const notifications = Array.from(this.notifications.values());
    
    return {
      total_notifications: notifications.length,
      pending: notifications.filter(n => n.delivery_status === DELIVERY_STATUS.PENDING).length,
      sent: notifications.filter(n => n.delivery_status === DELIVERY_STATUS.SENT).length,
      failed: notifications.filter(n => n.delivery_status === DELIVERY_STATUS.FAILED).length,
      retrying: notifications.filter(n => n.delivery_status === DELIVERY_STATUS.RETRYING).length,
      queue_length: this.queue.length,
      rules_count: this.rules.size,
      by_channel: this._groupByChannel(notifications),
      by_severity: this._groupBySeverity(notifications)
    };
  }

  // Private methods

  _registerDefaultProviders() {
    // Console provider (for development)
    this.channelProviders.set(NOTIFICATION_CHANNELS.CONSOLE, async (notification) => {
      const prefix = this._getSeverityPrefix(notification.severity);
      console.log(`${prefix} [${notification.channel}] ${notification.title}: ${notification.message}`);
      return { success: true };
    });

    // Webhook provider
    this.channelProviders.set(NOTIFICATION_CHANNELS.WEBHOOK, async (notification) => {
      const url = notification.recipient;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: notification.title,
            message: notification.message,
            severity: notification.severity,
            details: notification.details,
            timestamp: notification.timestamp
          })
        });
        return { success: response.ok, status: response.status };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Placeholder providers for other channels
    // In production, these would integrate with actual services
    this.channelProviders.set(NOTIFICATION_CHANNELS.EMAIL, async (notification) => {
      // Would use nodemailer, SendGrid, etc.
      this.emit('email-notification', notification);
      return { success: true, simulated: true };
    });

    this.channelProviders.set(NOTIFICATION_CHANNELS.SLACK, async (notification) => {
      // Would use Slack API
      this.emit('slack-notification', notification);
      return { success: true, simulated: true };
    });

    this.channelProviders.set(NOTIFICATION_CHANNELS.TEAMS, async (notification) => {
      // Would use Microsoft Teams webhook
      this.emit('teams-notification', notification);
      return { success: true, simulated: true };
    });

    this.channelProviders.set(NOTIFICATION_CHANNELS.SMS, async (notification) => {
      // Would use Twilio, etc.
      this.emit('sms-notification', notification);
      return { success: true, simulated: true };
    });
  }

  _loadDefaultTemplates() {
    this.templates.set('default', {
      title: (context) => context.title || 'AgenticCoder Notification',
      message: (context) => context.message || 'No message provided'
    });

    this.templates.set('phase_completed', {
      title: (context) => `Phase ${context.phase?.phase_number || '?'} Completed`,
      message: (context) => {
        const phase = context.phase || {};
        return `${phase.phase_name || 'Unknown phase'} completed in ${(phase.duration_ms / 1000).toFixed(1)}s`;
      }
    });

    this.templates.set('execution_failed', {
      title: () => 'Execution Failed',
      message: (context) => {
        const error = context.error || {};
        return error.message || 'Unknown error occurred';
      }
    });

    this.templates.set('validation_failed', {
      title: () => 'Validation Failed',
      message: (context) => `${context.error_count || 0} validation errors detected`
    });

    this.templates.set('manual_review', {
      title: () => 'Manual Review Required',
      message: (context) => context.reason || 'Human intervention needed'
    });
  }

  async _triggerNotifications(trigger, context) {
    const triggeredNotifications = [];
    
    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled || rule.trigger !== trigger) continue;
      
      // Check condition if specified
      if (rule.condition && !rule.condition(context)) continue;
      
      // Check throttling
      if (rule.throttle_ms > 0 && rule.last_triggered) {
        const elapsed = Date.now() - new Date(rule.last_triggered).getTime();
        if (elapsed < rule.throttle_ms) continue;
      }
      
      // Update last triggered
      rule.last_triggered = new Date().toISOString();
      
      // Get template
      const template = this.templates.get(rule.template) || this.templates.get('default');
      
      // Create notifications for each recipient
      for (const [channel, recipients] of Object.entries(rule.recipients)) {
        for (const recipient of recipients) {
          const notification = this._normalizeNotification({
            trigger,
            severity: rule.severity,
            recipient,
            channel,
            title: template.title(context),
            message: template.message(context),
            details: context
          });
          
          this.notifications.set(notification.notification_id, notification);
          this.queue.push(notification);
          triggeredNotifications.push(notification);
        }
      }
    }
    
    // Process queue immediately if not already processing
    if (!this.intervalHandle) {
      await this._processQueue();
    }
    
    return triggeredNotifications;
  }

  _normalizeNotification(notification) {
    return {
      notification_id: notification.notification_id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trigger: notification.trigger || 'manual',
      severity: notification.severity || NOTIFICATION_SEVERITY.INFO,
      timestamp: notification.timestamp || new Date().toISOString(),
      recipient: notification.recipient,
      channel: notification.channel || NOTIFICATION_CHANNELS.CONSOLE,
      title: notification.title,
      message: notification.message,
      details: notification.details,
      sent: false,
      sent_at: null,
      delivery_status: DELIVERY_STATUS.PENDING,
      retry_count: 0
    };
  }

  async _sendToChannel(notification) {
    const provider = this.channelProviders.get(notification.channel);
    
    if (!provider) {
      notification.delivery_status = DELIVERY_STATUS.FAILED;
      notification.error = `No provider for channel: ${notification.channel}`;
      this.emit('notification-failed', notification);
      return { success: false, error: notification.error };
    }
    
    try {
      const result = await provider(notification);
      
      if (result.success) {
        notification.sent = true;
        notification.sent_at = new Date().toISOString();
        notification.delivery_status = DELIVERY_STATUS.SENT;
        this.emit('notification-sent', notification);
      } else {
        notification.delivery_status = DELIVERY_STATUS.FAILED;
        notification.error = result.error;
        this.emit('notification-failed', notification);
      }
      
      return result;
    } catch (error) {
      notification.delivery_status = DELIVERY_STATUS.FAILED;
      notification.error = error.message;
      this.emit('notification-error', { notification, error });
      return { success: false, error: error.message };
    }
  }

  async _processQueue() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    
    for (const notification of batch) {
      const result = await this._sendToChannel(notification);
      
      if (!result.success && notification.retry_count < this.maxRetries) {
        // Re-queue for retry
        notification.retry_count++;
        notification.delivery_status = DELIVERY_STATUS.RETRYING;
        
        setTimeout(() => {
          this.queue.push(notification);
        }, this.retryDelayMs * notification.retry_count);
      }
    }
  }

  _getSeverityPrefix(severity) {
    switch (severity) {
      case NOTIFICATION_SEVERITY.CRITICAL: return '🔴';
      case NOTIFICATION_SEVERITY.ERROR: return '❌';
      case NOTIFICATION_SEVERITY.WARNING: return '⚠️';
      case NOTIFICATION_SEVERITY.INFO: return 'ℹ️';
      default: return '📣';
    }
  }

  _groupByChannel(notifications) {
    const grouped = {};
    for (const n of notifications) {
      grouped[n.channel] = (grouped[n.channel] || 0) + 1;
    }
    return grouped;
  }

  _groupBySeverity(notifications) {
    const grouped = {};
    for (const n of notifications) {
      grouped[n.severity] = (grouped[n.severity] || 0) + 1;
    }
    return grouped;
  }
}

export default NotificationSystem;
