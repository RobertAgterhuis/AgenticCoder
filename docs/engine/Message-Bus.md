# Message Bus

The central communication system for agent-to-agent and system messaging in AgenticCoder.

## Overview

The Message Bus provides:
- **Decoupled Communication** - Agents don't need direct references
- **Async Messaging** - Non-blocking message delivery
- **Topic-Based Routing** - Messages routed by topic
- **Reliable Delivery** - At-least-once delivery guarantee
- **Message Persistence** - Messages survive restarts

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Message Bus                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Topic     │  │   Queue     │  │  Delivery   │         │
│  │   Router    │  │   Manager   │  │   Handler   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Message Store (JSONL)              │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐
    │ Agent A │       │ Agent B │       │ System  │
    └─────────┘       └─────────┘       └─────────┘
```

## Message Structure

### Base Message

```typescript
interface Message {
  id: string;              // Unique message ID
  type: MessageType;       // task, result, event, handoff
  from: string;            // Sender ID
  to: string;              // Recipient ID or 'broadcast'
  topic: string;           // Routing topic
  payload: any;            // Message content
  timestamp: Date;         // When sent
  correlationId?: string;  // Links related messages
  replyTo?: string;        // For request-response
  ttl?: number;            // Time to live (ms)
}
```

### Message Types

| Type | Purpose | Example |
|------|---------|---------|
| `task` | Assign work | "Create project plan" |
| `result` | Return output | "Plan completed" |
| `event` | Notify state change | "Phase 3 started" |
| `handoff` | Transfer context | "Passing to architect" |
| `error` | Report failure | "Validation failed" |
| `ack` | Acknowledge receipt | "Message received" |

## Topics

### Predefined Topics

```
agents.*          # Agent-specific messages
  agents.plan     # Plan agent messages
  agents.doc      # Doc agent messages
  
phases.*          # Phase lifecycle
  phases.started  # Phase start events
  phases.completed # Phase completion events
  
system.*          # System events
  system.error    # Error notifications
  system.status   # Status updates
  
workflow.*        # Workflow control
  workflow.pause  # Pause commands
  workflow.resume # Resume commands
```

### Topic Wildcards

- `*` - Single level wildcard
- `#` - Multi-level wildcard

```typescript
// Subscribe to all agent messages
bus.subscribe('agents.*', handler);

// Subscribe to all events
bus.subscribe('#.completed', handler);
```

## Publishing Messages

### Basic Publish

```typescript
const bus = new MessageBus();

await bus.publish({
  type: 'task',
  to: 'architect-agent',
  topic: 'agents.architect',
  payload: {
    action: 'create-architecture',
    projectPlan: 'plans/project-plan.md'
  }
});
```

### Publish with Reply

```typescript
const response = await bus.request({
  type: 'task',
  to: 'plan-agent',
  topic: 'agents.plan',
  payload: { action: 'create-plan' }
}, { timeout: 30000 });

console.log('Plan created:', response.payload.artifact);
```

### Broadcast

```typescript
await bus.broadcast({
  type: 'event',
  topic: 'phases.completed',
  payload: {
    phase: 5,
    artifacts: ['code-structure/']
  }
});
```

## Subscribing

### Basic Subscription

```typescript
bus.subscribe('agents.plan', async (message) => {
  console.log('Received:', message.payload);
  
  // Process message
  const result = await processTask(message.payload);
  
  // Send result back
  await bus.publish({
    type: 'result',
    to: message.from,
    correlationId: message.id,
    payload: result
  });
});
```

### Filtered Subscription

```typescript
bus.subscribe('agents.*', async (message) => {
  // Only process tasks
  if (message.type !== 'task') return;
  
  await handleTask(message);
}, {
  filter: (msg) => msg.type === 'task'
});
```

### Group Subscription

Multiple subscribers share load:

```typescript
bus.subscribe('tasks.heavy', handler, {
  group: 'workers'  // Only one in group receives each message
});
```

## Queue Management

### Queue Configuration

```typescript
const bus = new MessageBus({
  queues: {
    'agents.plan': {
      maxSize: 100,
      maxRetries: 3,
      retryDelay: 1000,
      deadLetterQueue: 'dlq.plan'
    }
  }
});
```

### Dead Letter Queue

Failed messages go to DLQ:

```typescript
bus.subscribe('dlq.*', async (message) => {
  console.error('Message failed:', message.id);
  await notifyAdmin(message);
});
```

### Queue Inspection

```typescript
// Get queue depth
const depth = await bus.getQueueDepth('agents.plan');

// Get pending messages
const pending = await bus.getPendingMessages('agents.plan');

// Purge queue
await bus.purgeQueue('agents.plan');
```

## Persistence

### Storage Format

Messages stored in JSONL format:

```
// .agentic/messages/2024-01-15.jsonl
{"id":"msg-1","type":"task","to":"plan-agent",...}
{"id":"msg-2","type":"result","from":"plan-agent",...}
```

### Replay Messages

```typescript
// Replay messages from timestamp
await bus.replay({
  from: new Date('2024-01-15T10:00:00Z'),
  topics: ['agents.*']
});
```

### Message Retention

```yaml
# .agentic/config/bus.yaml
retention:
  default: '7d'
  'agents.*': '30d'
  'system.error': '90d'
```

## Delivery Guarantees

### At-Least-Once

Default behavior - messages may be delivered multiple times.

```typescript
bus.subscribe('topic', handler, {
  ackMode: 'auto'  // Ack after handler completes
});
```

### At-Most-Once

Fire and forget:

```typescript
await bus.publish(message, {
  persist: false,
  retry: false
});
```

### Exactly-Once (Idempotent)

Handle duplicates:

```typescript
const processed = new Set();

bus.subscribe('topic', async (message) => {
  if (processed.has(message.id)) {
    return; // Skip duplicate
  }
  
  await processMessage(message);
  processed.add(message.id);
});
```

## Monitoring

### Bus Metrics

```typescript
const metrics = bus.getMetrics();
// {
//   messagesPublished: 1523,
//   messagesDelivered: 1520,
//   messagesFailed: 3,
//   avgDeliveryTime: 45,
//   queueDepths: { 'agents.plan': 5, ... }
// }
```

### Event Hooks

```typescript
bus.on('message:published', (message) => {
  logger.debug('Published:', message.id);
});

bus.on('message:delivered', (message, subscriber) => {
  logger.debug('Delivered:', message.id, 'to', subscriber);
});

bus.on('message:failed', (message, error) => {
  logger.error('Failed:', message.id, error);
});
```

### CLI Commands

```bash
# View bus status
node bin/agentic.js bus status

# View queue depths
node bin/agentic.js bus queues

# View recent messages
node bin/agentic.js bus messages --last 10

# Purge dead letter queue
node bin/agentic.js bus purge-dlq
```

## Configuration

### Full Configuration

```yaml
# .agentic/config/bus.yaml
bus:
  storage: '.agentic/messages/'
  
  defaults:
    ttl: 3600000          # 1 hour
    maxRetries: 3
    retryDelay: 1000
    retryBackoff: 2       # Exponential
    
  topics:
    'agents.*':
      maxQueueSize: 100
      priority: 'normal'
      
    'system.error':
      maxQueueSize: 1000
      priority: 'high'
      
  deadLetter:
    enabled: true
    prefix: 'dlq.'
    retention: '30d'
    
  monitoring:
    metricsInterval: 60000
    logMessages: false
```

## Integration

### With Workflow Engine

```typescript
const engine = new WorkflowEngine();
const bus = new MessageBus();

engine.setMessageBus(bus);

// Engine publishes phase events
engine.on('phase:completed', (phase) => {
  bus.broadcast({
    type: 'event',
    topic: 'phases.completed',
    payload: { phase }
  });
});
```

### With Agents

```typescript
class PlanAgent {
  constructor(bus) {
    this.bus = bus;
    this.bus.subscribe('agents.plan', this.handleMessage.bind(this));
  }
  
  async handleMessage(message) {
    const result = await this.execute(message.payload);
    
    await this.bus.publish({
      type: 'result',
      to: message.from,
      correlationId: message.id,
      payload: result
    });
  }
}
```

## Next Steps

- [Workflow Engine](Workflow-Engine) - Orchestration
- [Agent Communication](../agents/Communication) - Patterns
- [Self-Learning](Self-Learning) - Metrics collection
