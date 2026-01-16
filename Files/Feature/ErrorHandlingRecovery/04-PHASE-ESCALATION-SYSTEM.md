# Phase 4: Escalation System

**Phase ID:** F-EHR-P04  
**Feature:** ErrorHandlingRecovery  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 3 (Rollback & Recovery)

---

## 🎯 Phase Objectives

Deze phase implementeert het **Escalation System**:
- Human handoff voor kritieke fouten
- Approval gates voor gevaarlijke operaties
- Notification channels (Slack, email, etc.)
- Escalation policies en routing
- Response tracking en SLA monitoring

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── escalation/
│   ├── EscalationManager.ts
│   ├── EscalationPolicy.ts
│   ├── ApprovalGate.ts
│   ├── NotificationService.ts
│   ├── ResponseTracker.ts
│   └── types/
│       ├── Escalation.ts
│       ├── Notification.ts
│       └── Approval.ts
```

---

## 🔧 Implementation Details

### 4.1 Escalation Types (`src/escalation/types/Escalation.ts`)

```typescript
import { ErrorContext } from '../../errors/ErrorContext';
import { ErrorSeverity } from '../../errors/types/ErrorSeverity';

/**
 * Escalation level
 */
export enum EscalationLevel {
  /** L1 - First responder */
  L1 = 'L1',
  
  /** L2 - Senior engineer */
  L2 = 'L2',
  
  /** L3 - Architect/Lead */
  L3 = 'L3',
  
  /** L4 - Management */
  L4 = 'L4',
}

/**
 * Escalation status
 */
export enum EscalationStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  EXPIRED = 'expired',
}

/**
 * Escalation priority
 */
export enum EscalationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

/**
 * Escalation target
 */
export interface EscalationTarget {
  type: 'user' | 'team' | 'role' | 'channel';
  id: string;
  name: string;
  notificationChannels: NotificationChannel[];
}

/**
 * Notification channel
 */
export type NotificationChannel = 
  | 'email'
  | 'slack'
  | 'teams'
  | 'pagerduty'
  | 'webhook'
  | 'sms'
  | 'in-app';

/**
 * Escalation request
 */
export interface EscalationRequest {
  /** Unique escalation ID */
  id: string;
  
  /** Error context */
  errorContext: ErrorContext;
  
  /** Current level */
  level: EscalationLevel;
  
  /** Priority */
  priority: EscalationPriority;
  
  /** Status */
  status: EscalationStatus;
  
  /** Targets */
  targets: EscalationTarget[];
  
  /** Title */
  title: string;
  
  /** Description */
  description: string;
  
  /** What action is needed */
  requiredAction: string;
  
  /** Available options for responder */
  responseOptions: ResponseOption[];
  
  /** Workflow context */
  workflowId?: string;
  
  /** Affected agent */
  agentId?: string;
  
  /** Created at */
  createdAt: Date;
  
  /** Last updated */
  updatedAt: Date;
  
  /** Acknowledged at */
  acknowledgedAt?: Date;
  
  /** Acknowledged by */
  acknowledgedBy?: string;
  
  /** Resolved at */
  resolvedAt?: Date;
  
  /** Resolution */
  resolution?: EscalationResolution;
  
  /** SLA deadline */
  slaDeadline?: Date;
  
  /** Escalation history */
  history: EscalationEvent[];
  
  /** Metadata */
  metadata: Record<string, unknown>;
}

/**
 * Response option
 */
export interface ResponseOption {
  id: string;
  label: string;
  description: string;
  action: 'approve' | 'reject' | 'retry' | 'abort' | 'escalate' | 'custom';
  params?: Record<string, unknown>;
}

/**
 * Escalation resolution
 */
export interface EscalationResolution {
  action: string;
  reason: string;
  resolvedBy: string;
  timestamp: Date;
  params?: Record<string, unknown>;
}

/**
 * Escalation event
 */
export interface EscalationEvent {
  id: string;
  type: 'created' | 'notified' | 'acknowledged' | 'escalated' | 'updated' | 'resolved' | 'closed' | 'expired';
  timestamp: Date;
  actor?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Map severity to priority
 */
export function severityToPriority(severity: ErrorSeverity): EscalationPriority {
  switch (severity) {
    case ErrorSeverity.INFO:
    case ErrorSeverity.WARNING:
      return EscalationPriority.LOW;
    case ErrorSeverity.ERROR:
      return EscalationPriority.MEDIUM;
    case ErrorSeverity.HIGH:
      return EscalationPriority.HIGH;
    case ErrorSeverity.CRITICAL:
      return EscalationPriority.CRITICAL;
    case ErrorSeverity.FATAL:
      return EscalationPriority.EMERGENCY;
    default:
      return EscalationPriority.MEDIUM;
  }
}
```

### 4.2 Notification Types (`src/escalation/types/Notification.ts`)

```typescript
import { NotificationChannel } from './Escalation';

/**
 * Notification template
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  format: 'text' | 'html' | 'markdown' | 'json';
  variables: string[];
}

/**
 * Notification message
 */
export interface NotificationMessage {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
  retryCount: number;
  metadata: Record<string, unknown>;
}

/**
 * Notification config per channel
 */
export interface NotificationConfig {
  slack?: {
    webhookUrl: string;
    channel?: string;
    username?: string;
    iconEmoji?: string;
  };
  email?: {
    from: string;
    smtpHost: string;
    smtpPort: number;
    username?: string;
    password?: string;
  };
  teams?: {
    webhookUrl: string;
  };
  pagerduty?: {
    integrationKey: string;
    apiUrl?: string;
  };
  webhook?: {
    url: string;
    headers?: Record<string, string>;
    method?: 'GET' | 'POST' | 'PUT';
  };
}

/**
 * Default notification templates
 */
export const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'escalation-created',
    name: 'Escalation Created',
    channel: 'slack',
    subject: '🚨 New Escalation: {{title}}',
    body: `
*🚨 Escalation Alert*
*ID:* {{id}}
*Priority:* {{priority}}
*Title:* {{title}}

{{description}}

*Required Action:* {{requiredAction}}

*Error:* \`{{errorCode}}\` - {{errorMessage}}

<{{actionUrl}}|View & Respond>
    `.trim(),
    format: 'markdown',
    variables: ['id', 'priority', 'title', 'description', 'requiredAction', 'errorCode', 'errorMessage', 'actionUrl'],
  },
  {
    id: 'escalation-created-email',
    name: 'Escalation Created (Email)',
    channel: 'email',
    subject: '[{{priority}}] Escalation: {{title}}',
    body: `
<h2>🚨 Escalation Alert</h2>
<p><strong>ID:</strong> {{id}}</p>
<p><strong>Priority:</strong> {{priority}}</p>
<p><strong>Title:</strong> {{title}}</p>
<p>{{description}}</p>
<h3>Required Action</h3>
<p>{{requiredAction}}</p>
<h3>Error Details</h3>
<p><code>{{errorCode}}</code> - {{errorMessage}}</p>
<p><a href="{{actionUrl}}">View & Respond</a></p>
    `.trim(),
    format: 'html',
    variables: ['id', 'priority', 'title', 'description', 'requiredAction', 'errorCode', 'errorMessage', 'actionUrl'],
  },
  {
    id: 'escalation-acknowledged',
    name: 'Escalation Acknowledged',
    channel: 'slack',
    subject: '✅ Escalation Acknowledged: {{title}}',
    body: `
*✅ Escalation Acknowledged*
*ID:* {{id}}
*Acknowledged by:* {{acknowledgedBy}}
*Time:* {{acknowledgedAt}}
    `.trim(),
    format: 'markdown',
    variables: ['id', 'acknowledgedBy', 'acknowledgedAt'],
  },
  {
    id: 'escalation-resolved',
    name: 'Escalation Resolved',
    channel: 'slack',
    subject: '🎉 Escalation Resolved: {{title}}',
    body: `
*🎉 Escalation Resolved*
*ID:* {{id}}
*Resolved by:* {{resolvedBy}}
*Resolution:* {{resolution}}
*Duration:* {{duration}}
    `.trim(),
    format: 'markdown',
    variables: ['id', 'resolvedBy', 'resolution', 'duration'],
  },
];
```

### 4.3 Approval Types (`src/escalation/types/Approval.ts`)

```typescript
/**
 * Approval status
 */
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * Approval request
 */
export interface ApprovalRequest {
  id: string;
  type: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: Date;
  expiresAt?: Date;
  status: ApprovalStatus;
  approvers: ApproverInfo[];
  requiredApprovals: number;
  currentApprovals: number;
  decisions: ApprovalDecision[];
  context: Record<string, unknown>;
  onApprove?: string;
  onReject?: string;
}

/**
 * Approver info
 */
export interface ApproverInfo {
  id: string;
  name: string;
  email?: string;
  role?: string;
  required: boolean;
}

/**
 * Approval decision
 */
export interface ApprovalDecision {
  approverId: string;
  approverName: string;
  decision: 'approve' | 'reject';
  reason?: string;
  timestamp: Date;
}

/**
 * Approval gate configuration
 */
export interface ApprovalGateConfig {
  /** Gate name */
  name: string;
  
  /** When this gate is triggered */
  trigger: ApprovalTrigger;
  
  /** Who can approve */
  approvers: ApproverRule[];
  
  /** Minimum approvals needed */
  requiredApprovals: number;
  
  /** Auto-approve after timeout */
  autoApproveOnTimeout?: boolean;
  
  /** Auto-reject after timeout */
  autoRejectOnTimeout?: boolean;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Bypass conditions */
  bypassConditions?: BypassCondition[];
}

/**
 * Approval trigger
 */
export interface ApprovalTrigger {
  type: 'error' | 'operation' | 'threshold' | 'always';
  condition?: string;
  params?: Record<string, unknown>;
}

/**
 * Approver rule
 */
export interface ApproverRule {
  type: 'user' | 'team' | 'role' | 'any';
  id?: string;
  minLevel?: string;
}

/**
 * Bypass condition
 */
export interface BypassCondition {
  type: 'environment' | 'user' | 'flag';
  value: string;
}
```

### 4.4 Escalation Policy (`src/escalation/EscalationPolicy.ts`)

```typescript
import { ErrorCategory } from '../errors/types/ErrorCategory';
import { ErrorSeverity } from '../errors/types/ErrorSeverity';
import { 
  EscalationLevel, 
  EscalationPriority, 
  EscalationTarget,
  NotificationChannel 
} from './types/Escalation';

/**
 * Escalation policy rule
 */
export interface EscalationRule {
  id: string;
  name: string;
  priority: number;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  enabled: boolean;
}

/**
 * Escalation condition
 */
export interface EscalationCondition {
  type: 'category' | 'severity' | 'code' | 'agent' | 'phase' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'matches';
  value: unknown;
}

/**
 * Escalation action
 */
export interface EscalationAction {
  type: 'notify' | 'escalate' | 'create_ticket' | 'run_webhook' | 'block';
  target?: EscalationTarget;
  level?: EscalationLevel;
  channels?: NotificationChannel[];
  params?: Record<string, unknown>;
}

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  matched: boolean;
  rules: EscalationRule[];
  actions: EscalationAction[];
  level: EscalationLevel;
  priority: EscalationPriority;
  targets: EscalationTarget[];
}

/**
 * Escalation policy manager
 */
export class EscalationPolicy {
  private rules: EscalationRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default escalation rules
   */
  private initializeDefaultRules(): void {
    // Critical errors - immediate L3 escalation
    this.addRule({
      id: 'critical-immediate',
      name: 'Critical Error Immediate Escalation',
      priority: 100,
      conditions: [
        { type: 'severity', operator: 'in', value: ['critical', 'fatal'] },
      ],
      actions: [
        {
          type: 'notify',
          channels: ['slack', 'pagerduty'],
          target: {
            type: 'team',
            id: 'on-call',
            name: 'On-Call Team',
            notificationChannels: ['pagerduty', 'slack'],
          },
        },
        { type: 'escalate', level: EscalationLevel.L3 },
      ],
      enabled: true,
    });

    // Security errors - L2 escalation
    this.addRule({
      id: 'security-escalation',
      name: 'Security Error Escalation',
      priority: 90,
      conditions: [
        { type: 'category', operator: 'equals', value: ErrorCategory.SECURITY },
      ],
      actions: [
        {
          type: 'notify',
          channels: ['slack', 'email'],
          target: {
            type: 'team',
            id: 'security',
            name: 'Security Team',
            notificationChannels: ['slack', 'email'],
          },
        },
        { type: 'escalate', level: EscalationLevel.L2 },
      ],
      enabled: true,
    });

    // Infrastructure errors - L1 with auto-escalate
    this.addRule({
      id: 'infra-escalation',
      name: 'Infrastructure Error Escalation',
      priority: 80,
      conditions: [
        { type: 'code', operator: 'matches', value: /^E5/ }, // E5xxx codes
      ],
      actions: [
        {
          type: 'notify',
          channels: ['slack'],
          target: {
            type: 'team',
            id: 'devops',
            name: 'DevOps Team',
            notificationChannels: ['slack'],
          },
        },
        { type: 'escalate', level: EscalationLevel.L1 },
      ],
      enabled: true,
    });

    // High severity - L1 escalation
    this.addRule({
      id: 'high-severity',
      name: 'High Severity Escalation',
      priority: 70,
      conditions: [
        { type: 'severity', operator: 'equals', value: 'high' },
      ],
      actions: [
        {
          type: 'notify',
          channels: ['slack'],
          target: {
            type: 'role',
            id: 'engineer',
            name: 'Engineers',
            notificationChannels: ['slack'],
          },
        },
        { type: 'escalate', level: EscalationLevel.L1 },
      ],
      enabled: true,
    });

    // Default - L1 escalation after retries
    this.addRule({
      id: 'default-escalation',
      name: 'Default Escalation',
      priority: 0,
      conditions: [],
      actions: [
        {
          type: 'notify',
          channels: ['slack'],
          target: {
            type: 'channel',
            id: 'alerts',
            name: '#alerts',
            notificationChannels: ['slack'],
          },
        },
        { type: 'escalate', level: EscalationLevel.L1 },
      ],
      enabled: true,
    });
  }

  /**
   * Add escalation rule
   */
  addRule(rule: EscalationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove rule
   */
  removeRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Evaluate policy for error context
   */
  evaluate(context: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    code?: string;
    agent?: string;
    phase?: number;
    custom?: Record<string, unknown>;
  }): PolicyEvaluationResult {
    const matchedRules: EscalationRule[] = [];
    const allActions: EscalationAction[] = [];
    const allTargets: EscalationTarget[] = [];
    let highestLevel = EscalationLevel.L1;
    let highestPriority = EscalationPriority.LOW;

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.matchesConditions(rule.conditions, context)) {
        matchedRules.push(rule);
        allActions.push(...rule.actions);

        // Collect targets
        for (const action of rule.actions) {
          if (action.target) {
            allTargets.push(action.target);
          }
          if (action.level && this.levelPriority(action.level) > this.levelPriority(highestLevel)) {
            highestLevel = action.level;
          }
        }
      }
    }

    // Determine priority from severity
    if (context.severity) {
      const severityPriority = this.severityToPriority(context.severity);
      if (this.priorityWeight(severityPriority) > this.priorityWeight(highestPriority)) {
        highestPriority = severityPriority;
      }
    }

    return {
      matched: matchedRules.length > 0,
      rules: matchedRules,
      actions: allActions,
      level: highestLevel,
      priority: highestPriority,
      targets: this.deduplicateTargets(allTargets),
    };
  }

  /**
   * Check if conditions match
   */
  private matchesConditions(
    conditions: EscalationCondition[],
    context: Record<string, unknown>
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const value = context[condition.type];
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(value);
        case 'matches':
          return condition.value instanceof RegExp && condition.value.test(String(value));
        default:
          return false;
      }
    });
  }

  /**
   * Get level priority
   */
  private levelPriority(level: EscalationLevel): number {
    const priorities: Record<EscalationLevel, number> = {
      [EscalationLevel.L1]: 1,
      [EscalationLevel.L2]: 2,
      [EscalationLevel.L3]: 3,
      [EscalationLevel.L4]: 4,
    };
    return priorities[level] || 0;
  }

  /**
   * Severity to priority
   */
  private severityToPriority(severity: ErrorSeverity): EscalationPriority {
    const map: Record<ErrorSeverity, EscalationPriority> = {
      [ErrorSeverity.INFO]: EscalationPriority.LOW,
      [ErrorSeverity.WARNING]: EscalationPriority.LOW,
      [ErrorSeverity.ERROR]: EscalationPriority.MEDIUM,
      [ErrorSeverity.HIGH]: EscalationPriority.HIGH,
      [ErrorSeverity.CRITICAL]: EscalationPriority.CRITICAL,
      [ErrorSeverity.FATAL]: EscalationPriority.EMERGENCY,
    };
    return map[severity] || EscalationPriority.MEDIUM;
  }

  /**
   * Priority weight
   */
  private priorityWeight(priority: EscalationPriority): number {
    const weights: Record<EscalationPriority, number> = {
      [EscalationPriority.LOW]: 1,
      [EscalationPriority.MEDIUM]: 2,
      [EscalationPriority.HIGH]: 3,
      [EscalationPriority.CRITICAL]: 4,
      [EscalationPriority.EMERGENCY]: 5,
    };
    return weights[priority] || 0;
  }

  /**
   * Deduplicate targets
   */
  private deduplicateTargets(targets: EscalationTarget[]): EscalationTarget[] {
    const seen = new Set<string>();
    return targets.filter(t => {
      const key = `${t.type}:${t.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

/**
 * Create escalation policy
 */
export function createEscalationPolicy(): EscalationPolicy {
  return new EscalationPolicy();
}
```

### 4.5 Notification Service (`src/escalation/NotificationService.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import {
  NotificationChannel,
  NotificationConfig,
  NotificationMessage,
  NotificationTemplate,
  DEFAULT_TEMPLATES,
} from './types/Notification';

/**
 * Channel sender interface
 */
export interface ChannelSender {
  channel: NotificationChannel;
  send(message: NotificationMessage): Promise<boolean>;
}

/**
 * Notification service
 */
export class NotificationService {
  private config: NotificationConfig;
  private senders: Map<NotificationChannel, ChannelSender> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private messageQueue: NotificationMessage[] = [];

  constructor(config: NotificationConfig) {
    this.config = config;
    this.initializeSenders();
    this.initializeTemplates();
  }

  /**
   * Initialize channel senders
   */
  private initializeSenders(): void {
    if (this.config.slack) {
      this.senders.set('slack', new SlackSender(this.config.slack));
    }
    if (this.config.email) {
      this.senders.set('email', new EmailSender(this.config.email));
    }
    // Add other senders as needed
  }

  /**
   * Initialize templates
   */
  private initializeTemplates(): void {
    DEFAULT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Send notification
   */
  async send(
    channel: NotificationChannel,
    recipient: string,
    templateId: string,
    variables: Record<string, unknown>,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      metadata?: Record<string, unknown>;
    }
  ): Promise<NotificationMessage> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const message: NotificationMessage = {
      id: `notif-${uuid().substring(0, 8)}`,
      channel,
      recipient,
      subject: template.subject ? this.interpolate(template.subject, variables) : undefined,
      body: this.interpolate(template.body, variables),
      priority: options?.priority || 'normal',
      status: 'pending',
      retryCount: 0,
      metadata: options?.metadata || {},
    };

    const sender = this.senders.get(channel);
    if (!sender) {
      message.status = 'failed';
      message.error = `No sender configured for channel: ${channel}`;
      return message;
    }

    try {
      const success = await sender.send(message);
      message.status = success ? 'sent' : 'failed';
      message.sentAt = new Date();
    } catch (error) {
      message.status = 'failed';
      message.error = error instanceof Error ? error.message : String(error);
    }

    return message;
  }

  /**
   * Send to multiple channels
   */
  async sendMultiple(
    channels: NotificationChannel[],
    recipient: string,
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<NotificationMessage[]> {
    const results = await Promise.all(
      channels.map(channel => this.send(channel, recipient, templateId, variables))
    );
    return results;
  }

  /**
   * Add custom template
   */
  addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Interpolate variables in template
   */
  private interpolate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Register custom sender
   */
  registerSender(sender: ChannelSender): void {
    this.senders.set(sender.channel, sender);
  }
}

/**
 * Slack sender implementation
 */
class SlackSender implements ChannelSender {
  channel: NotificationChannel = 'slack';
  private config: NonNullable<NotificationConfig['slack']>;

  constructor(config: NonNullable<NotificationConfig['slack']>) {
    this.config = config;
  }

  async send(message: NotificationMessage): Promise<boolean> {
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: this.config.channel || message.recipient,
          username: this.config.username || 'AgenticCoder',
          icon_emoji: this.config.iconEmoji || ':robot_face:',
          text: message.body,
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Email sender implementation (mock)
 */
class EmailSender implements ChannelSender {
  channel: NotificationChannel = 'email';
  private config: NonNullable<NotificationConfig['email']>;

  constructor(config: NonNullable<NotificationConfig['email']>) {
    this.config = config;
  }

  async send(message: NotificationMessage): Promise<boolean> {
    // In real implementation, use nodemailer or similar
    console.log(`[Email] To: ${message.recipient}, Subject: ${message.subject}`);
    return true;
  }
}

/**
 * Create notification service
 */
export function createNotificationService(config: NotificationConfig): NotificationService {
  return new NotificationService(config);
}
```

### 4.6 Escalation Manager (`src/escalation/EscalationManager.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import { ErrorContext } from '../errors/ErrorContext';
import {
  EscalationRequest,
  EscalationStatus,
  EscalationLevel,
  EscalationPriority,
  EscalationTarget,
  EscalationEvent,
  EscalationResolution,
  ResponseOption,
  severityToPriority,
} from './types/Escalation';
import { EscalationPolicy, PolicyEvaluationResult } from './EscalationPolicy';
import { NotificationService } from './NotificationService';

/**
 * Escalation manager configuration
 */
export interface EscalationManagerConfig {
  policy: EscalationPolicy;
  notificationService: NotificationService;
  actionUrl?: string;
  defaultTimeout?: number;
  autoEscalateAfter?: number;
}

/**
 * Escalation manager
 */
export class EscalationManager {
  private config: EscalationManagerConfig;
  private escalations: Map<string, EscalationRequest> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: EscalationManagerConfig) {
    this.config = config;
  }

  /**
   * Create escalation for error
   */
  async createEscalation(
    errorContext: ErrorContext,
    options?: {
      title?: string;
      description?: string;
      requiredAction?: string;
      responseOptions?: ResponseOption[];
    }
  ): Promise<EscalationRequest> {
    // Evaluate policy
    const evaluation = this.config.policy.evaluate({
      category: errorContext.category,
      severity: errorContext.severity,
      code: errorContext.code,
      agent: errorContext.execution.agent,
      phase: errorContext.execution.phase,
    });

    const id = `esc-${uuid().substring(0, 12)}`;
    const now = new Date();

    const escalation: EscalationRequest = {
      id,
      errorContext,
      level: evaluation.level,
      priority: evaluation.priority,
      status: EscalationStatus.PENDING,
      targets: evaluation.targets,
      title: options?.title || `Error: ${errorContext.code}`,
      description: options?.description || errorContext.message,
      requiredAction: options?.requiredAction || 'Please investigate and resolve',
      responseOptions: options?.responseOptions || this.getDefaultResponseOptions(),
      workflowId: errorContext.execution.workflowId,
      agentId: errorContext.execution.agent,
      createdAt: now,
      updatedAt: now,
      slaDeadline: this.calculateSLADeadline(evaluation.priority),
      history: [{
        id: uuid(),
        type: 'created',
        timestamp: now,
        details: `Escalation created at level ${evaluation.level}`,
      }],
      metadata: {},
    };

    this.escalations.set(id, escalation);

    // Send notifications
    await this.notifyTargets(escalation, 'escalation-created');

    // Set auto-escalation timer
    this.setAutoEscalationTimer(escalation);

    return escalation;
  }

  /**
   * Acknowledge escalation
   */
  async acknowledge(
    escalationId: string,
    acknowledgedBy: string
  ): Promise<EscalationRequest> {
    const escalation = this.escalations.get(escalationId);
    if (!escalation) {
      throw new Error(`Escalation ${escalationId} not found`);
    }

    const now = new Date();
    escalation.status = EscalationStatus.ACKNOWLEDGED;
    escalation.acknowledgedAt = now;
    escalation.acknowledgedBy = acknowledgedBy;
    escalation.updatedAt = now;
    
    escalation.history.push({
      id: uuid(),
      type: 'acknowledged',
      timestamp: now,
      actor: acknowledgedBy,
      details: `Acknowledged by ${acknowledgedBy}`,
    });

    // Notify acknowledgement
    await this.notifyTargets(escalation, 'escalation-acknowledged');

    // Cancel auto-escalation
    this.clearAutoEscalationTimer(escalationId);

    return escalation;
  }

  /**
   * Resolve escalation
   */
  async resolve(
    escalationId: string,
    resolution: Omit<EscalationResolution, 'timestamp'>
  ): Promise<EscalationRequest> {
    const escalation = this.escalations.get(escalationId);
    if (!escalation) {
      throw new Error(`Escalation ${escalationId} not found`);
    }

    const now = new Date();
    escalation.status = EscalationStatus.RESOLVED;
    escalation.resolvedAt = now;
    escalation.resolution = { ...resolution, timestamp: now };
    escalation.updatedAt = now;

    escalation.history.push({
      id: uuid(),
      type: 'resolved',
      timestamp: now,
      actor: resolution.resolvedBy,
      details: `Resolved: ${resolution.action} - ${resolution.reason}`,
    });

    // Notify resolution
    await this.notifyTargets(escalation, 'escalation-resolved');

    // Cleanup timer
    this.clearAutoEscalationTimer(escalationId);

    return escalation;
  }

  /**
   * Escalate to higher level
   */
  async escalateToNextLevel(escalationId: string): Promise<EscalationRequest> {
    const escalation = this.escalations.get(escalationId);
    if (!escalation) {
      throw new Error(`Escalation ${escalationId} not found`);
    }

    const nextLevel = this.getNextLevel(escalation.level);
    if (!nextLevel) {
      throw new Error('Already at highest escalation level');
    }

    const now = new Date();
    escalation.level = nextLevel;
    escalation.updatedAt = now;
    escalation.status = EscalationStatus.PENDING;

    escalation.history.push({
      id: uuid(),
      type: 'escalated',
      timestamp: now,
      details: `Escalated to ${nextLevel}`,
    });

    // Get new targets for this level
    const evaluation = this.config.policy.evaluate({
      category: escalation.errorContext.category,
      severity: escalation.errorContext.severity,
      code: escalation.errorContext.code,
    });

    escalation.targets = evaluation.targets;

    // Notify new targets
    await this.notifyTargets(escalation, 'escalation-created');

    // Reset auto-escalation timer
    this.setAutoEscalationTimer(escalation);

    return escalation;
  }

  /**
   * Get escalation
   */
  getEscalation(id: string): EscalationRequest | undefined {
    return this.escalations.get(id);
  }

  /**
   * List escalations
   */
  listEscalations(filter?: {
    status?: EscalationStatus;
    level?: EscalationLevel;
    priority?: EscalationPriority;
  }): EscalationRequest[] {
    let escalations = Array.from(this.escalations.values());

    if (filter?.status) {
      escalations = escalations.filter(e => e.status === filter.status);
    }
    if (filter?.level) {
      escalations = escalations.filter(e => e.level === filter.level);
    }
    if (filter?.priority) {
      escalations = escalations.filter(e => e.priority === filter.priority);
    }

    return escalations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get default response options
   */
  private getDefaultResponseOptions(): ResponseOption[] {
    return [
      { id: 'retry', label: 'Retry', description: 'Retry the failed operation', action: 'retry' },
      { id: 'skip', label: 'Skip', description: 'Skip this step and continue', action: 'approve' },
      { id: 'abort', label: 'Abort', description: 'Abort the workflow', action: 'abort' },
      { id: 'escalate', label: 'Escalate', description: 'Escalate to next level', action: 'escalate' },
    ];
  }

  /**
   * Calculate SLA deadline based on priority
   */
  private calculateSLADeadline(priority: EscalationPriority): Date {
    const now = Date.now();
    const slaMinutes: Record<EscalationPriority, number> = {
      [EscalationPriority.LOW]: 480, // 8 hours
      [EscalationPriority.MEDIUM]: 240, // 4 hours
      [EscalationPriority.HIGH]: 60, // 1 hour
      [EscalationPriority.CRITICAL]: 15, // 15 minutes
      [EscalationPriority.EMERGENCY]: 5, // 5 minutes
    };
    return new Date(now + slaMinutes[priority] * 60 * 1000);
  }

  /**
   * Get next escalation level
   */
  private getNextLevel(current: EscalationLevel): EscalationLevel | null {
    const levels = [EscalationLevel.L1, EscalationLevel.L2, EscalationLevel.L3, EscalationLevel.L4];
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  /**
   * Notify escalation targets
   */
  private async notifyTargets(
    escalation: EscalationRequest,
    templateId: string
  ): Promise<void> {
    const variables = {
      id: escalation.id,
      title: escalation.title,
      description: escalation.description,
      priority: escalation.priority,
      requiredAction: escalation.requiredAction,
      errorCode: escalation.errorContext.code,
      errorMessage: escalation.errorContext.message,
      acknowledgedBy: escalation.acknowledgedBy,
      acknowledgedAt: escalation.acknowledgedAt?.toISOString(),
      resolvedBy: escalation.resolution?.resolvedBy,
      resolution: escalation.resolution?.reason,
      duration: escalation.resolvedAt && escalation.createdAt
        ? `${Math.round((escalation.resolvedAt.getTime() - escalation.createdAt.getTime()) / 60000)} minutes`
        : undefined,
      actionUrl: `${this.config.actionUrl || 'http://localhost:3000'}/escalations/${escalation.id}`,
    };

    for (const target of escalation.targets) {
      for (const channel of target.notificationChannels) {
        await this.config.notificationService.send(
          channel,
          target.id,
          templateId,
          variables,
          { priority: escalation.priority === EscalationPriority.EMERGENCY ? 'urgent' : 'high' }
        );
      }
    }
  }

  /**
   * Set auto-escalation timer
   */
  private setAutoEscalationTimer(escalation: EscalationRequest): void {
    const timeout = this.config.autoEscalateAfter || 30 * 60 * 1000; // 30 minutes default

    const timer = setTimeout(async () => {
      const current = this.escalations.get(escalation.id);
      if (current && current.status === EscalationStatus.PENDING) {
        try {
          await this.escalateToNextLevel(escalation.id);
        } catch {
          // Already at highest level
        }
      }
    }, timeout);

    this.escalationTimers.set(escalation.id, timer);
  }

  /**
   * Clear auto-escalation timer
   */
  private clearAutoEscalationTimer(escalationId: string): void {
    const timer = this.escalationTimers.get(escalationId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(escalationId);
    }
  }
}

/**
 * Create escalation manager
 */
export function createEscalationManager(config: EscalationManagerConfig): EscalationManager {
  return new EscalationManager(config);
}
```

---

## 📊 Escalation Level Matrix

| Level | Who | SLA | When |
|-------|-----|-----|------|
| L1 | On-call engineer | 4h | Standard errors |
| L2 | Senior engineer | 1h | High severity |
| L3 | Architect/Lead | 15min | Critical errors |
| L4 | Management | 5min | Emergency |

---

## 📋 Acceptance Criteria

- [ ] Escalation policy evaluates correctly
- [ ] Notifications sent to correct channels
- [ ] SLA deadlines calculated properly
- [ ] Auto-escalation triggers after timeout
- [ ] Acknowledgement stops auto-escalation
- [ ] Resolution closes escalation
- [ ] History tracks all events

---

## 🔗 Navigation

← [03-PHASE-ROLLBACK-RECOVERY.md](03-PHASE-ROLLBACK-RECOVERY.md) | [05-PHASE-USER-EXPERIENCE.md](05-PHASE-USER-EXPERIENCE.md) →
