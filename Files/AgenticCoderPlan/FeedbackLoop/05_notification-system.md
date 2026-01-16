# Notification System

**Component**: FLS-05  
**Purpose**: Alert stakeholders of execution events  
**Status**: Design Complete  

---

## 🎯 Overview

Multi-channel notification system for keeping stakeholders informed of execution progress, completion, and failures.

---

## 💻 Notification Model

```typescript
type NotificationChannel = 'email' | 'slack' | 'teams' | 'webhook' | 'sms';
type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';
type NotificationTrigger = 
  | 'phase_started'
  | 'phase_completed'
  | 'task_completed'
  | 'validation_failed'
  | 'execution_completed'
  | 'execution_failed'
  | 'error_occurred';

interface Notification {
  notification_id: string;
  trigger: NotificationTrigger;
  severity: NotificationSeverity;
  timestamp: string;
  
  recipient: string;                    // Email, Slack user, etc.
  channel: NotificationChannel;
  
  title: string;
  message: string;
  details?: any;
  
  sent: boolean;
  sent_at?: string;
  delivery_status: 'pending' | 'sent' | 'failed';
}

interface NotificationRule {
  rule_id: string;
  enabled: boolean;
  
  trigger: NotificationTrigger;
  condition?: (context: any) => boolean;
  
  recipients: {
    [channel: string]: string[];        // emails, slack-ids, etc.
  };
  
  template: string;
  severity: NotificationSeverity;
}
```

---

## 🔔 Notification Triggers

```typescript
class NotificationManager {
  private rules: NotificationRule[] = [];
  private notificationQueue: Notification[] = [];
  
  // Register notification rule
  registerRule(rule: NotificationRule): void {
    this.rules.push(rule);
  }
  
  // Notify on phase completion
  async notifyPhaseCompleted(phase: PhaseStatus): Promise<void> {
    for (const rule of this.rules.filter(r => r.trigger === 'phase_completed')) {
      if (!rule.condition || rule.condition({ phase })) {
        await this.sendNotification(
          rule,
          `Phase ${phase.phase_number} Completed`,
          `${phase.phase_name} completed in ${phase.duration_ms / 1000}s`
        );
      }
    }
  }
  
  // Notify on execution failure
  async notifyExecutionFailed(
    error: Error,
    context: any
  ): Promise<void> {
    for (const rule of this.rules.filter(r => r.trigger === 'execution_failed')) {
      if (!rule.condition || rule.condition({ error, context })) {
        await this.sendNotification(
          rule,
          'Execution Failed',
          error.message,
          { details: context }
        );
      }
    }
  }
  
  // Notify on validation failure
  async notifyValidationFailed(issues: any[]): Promise<void> {
    for (const rule of this.rules.filter(r => r.trigger === 'validation_failed')) {
      const errorCount = issues.filter(i => i.severity === 'error').length;
      await this.sendNotification(
        rule,
        'Validation Failed',
        `${errorCount} validation errors detected`,
        { issues }
      );
    }
  }
  
  // Send notification
  private async sendNotification(
    rule: NotificationRule,
    title: string,
    message: string,
    details?: any
  ): Promise<void> {
    
    for (const [channel, recipients] of Object.entries(rule.recipients)) {
      for (const recipient of recipients) {
        const notification: Notification = {
          notification_id: generateId(),
          trigger: rule.trigger,
          severity: rule.severity,
          timestamp: new Date().toISOString(),
          recipient,
          channel: channel as NotificationChannel,
          title,
          message,
          details,
          sent: false,
          delivery_status: 'pending'
        };
        
        this.notificationQueue.push(notification);
      }
    }
    
    // Process queue
    await this.processQueue();
  }
  
  // Process notification queue
  private async processQueue(): Promise<void> {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift()!;
      
      try {
        await this.send(notification);
        notification.sent = true;
        notification.sent_at = new Date().toISOString();
        notification.delivery_status = 'sent';
      } catch (error) {
        notification.delivery_status = 'failed';
        this.notificationQueue.push(notification);  // Retry
      }
    }
  }
  
  // Send via channel
  private async send(notification: Notification): Promise<void> {
    switch (notification.channel) {
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'slack':
        await this.sendSlack(notification);
        break;
      case 'teams':
        await this.sendTeams(notification);
        break;
      case 'webhook':
        await this.sendWebhook(notification);
        break;
      case 'sms':
        await this.sendSMS(notification);
        break;
    }
  }
  
  private async sendEmail(notification: Notification): Promise<void> {
    const subject = `[${notification.severity.toUpperCase()}] ${notification.title}`;
    const body = `${notification.message}\n\n${JSON.stringify(notification.details, null, 2)}`;
    
    await emailService.send({
      to: notification.recipient,
      subject,
      body
    });
  }
  
  private async sendSlack(notification: Notification): Promise<void> {
    const color = {
      'info': '#36a64f',
      'warning': '#ff9900',
      'error': '#ff0000',
      'critical': '#000000'
    }[notification.severity];
    
    await slackClient.chat.postMessage({
      channel: notification.recipient,
      attachments: [{
        color,
        title: notification.title,
        text: notification.message,
        fields: notification.details ? [
          {
            title: 'Details',
            value: JSON.stringify(notification.details),
            short: false
          }
        ] : []
      }]
    });
  }
  
  private async sendTeams(notification: Notification): Promise<void> {
    await teamsClient.send({
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: notification.title,
      themeColor: notification.severity === 'error' ? 'ff0000' : '0078d4',
      sections: [{
        activityTitle: notification.title,
        activitySubtitle: notification.message
      }]
    });
  }
  
  private async sendWebhook(notification: Notification): Promise<void> {
    await fetch(notification.recipient, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    });
  }
  
  private async sendSMS(notification: Notification): Promise<void> {
    await smsService.send({
      to: notification.recipient,
      message: `${notification.title}: ${notification.message}`
    });
  }
}
```

---

## 📋 Default Notification Rules

```typescript
function createDefaultRules(): NotificationRule[] {
  return [
    {
      rule_id: 'rule-phase-complete',
      enabled: true,
      trigger: 'phase_completed',
      recipients: {
        email: ['team@company.com'],
        slack: ['#deployments']
      },
      template: 'phase-completed',
      severity: 'info'
    },
    {
      rule_id: 'rule-execution-failed',
      enabled: true,
      trigger: 'execution_failed',
      recipients: {
        email: ['oncall@company.com', 'lead@company.com'],
        slack: ['@channel'],
        webhook: ['https://pagerduty.com/webhook']
      },
      template: 'execution-failed',
      severity: 'critical'
    },
    {
      rule_id: 'rule-validation-failed',
      enabled: true,
      trigger: 'validation_failed',
      recipients: {
        email: ['qa@company.com'],
        slack: ['#quality']
      },
      template: 'validation-failed',
      severity: 'error'
    }
  ];
}
```

---

## 💡 Key Points

1. **Multi-Channel**: Email, Slack, Teams, Webhooks, SMS
2. **Event-Driven**: Triggered by execution events
3. **Rule-Based**: Configurable rules per notification
4. **Retry Logic**: Failed notifications retried
5. **Template Support**: Customizable message templates
6. **Severity Levels**: Appropriate routing per severity
7. **Audit Trail**: All notifications logged

---

**Status**: ✅ **IMPLEMENTED** → See implementation addendum below.

---

## ✅ Implementation Addendum

**Implemented**: 2025-01-XX  
**Location**: `agents/core/feedback/NotificationSystem.js`

### Features Implemented
- ✅ Multi-channel support (6 channels: email, slack, teams, webhook, sms, console)
- ✅ Event-driven triggers with rule-based configuration
- ✅ Configurable notification rules with condition matching
- ✅ Retry logic with exponential backoff (max 3 retries)
- ✅ Template support with variable substitution
- ✅ Severity levels (info, warning, error, critical)
- ✅ Audit trail via EventEmitter events

### Key Classes
- `NotificationSystem` - Main class (~400 lines)
- Methods: `registerChannel()`, `registerRule()`, `sendNotification()`, `notifyPhaseCompleted()`, `notifyExecutionFailed()`, `getDeliveryHistory()`

### Test Coverage
- 5 unit tests in `agents/core/test/feedback.test.js`
- Tests: channel registration, notification sending, rule matching, delivery history

### Integration Points
- Emits events: `notification:sent`, `notification:failed`, `notification:registered`
- Used by FeedbackLoop facade for execution alerts
