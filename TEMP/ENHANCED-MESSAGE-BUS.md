# Enhanced Message Bus - Complete Documentation

## Overview

The **Enhanced Message Bus** extends the base MessageBus with production-ready features for phase-aware orchestration:

- ✅ **Phase-aware routing** - Routes messages to agents based on workflow phase
- ✅ **Priority queues** - Critical messages prioritized over normal ones
- ✅ **Dead letter queue** - Failed messages captured for manual intervention
- ✅ **Automatic retry** - Exponential backoff retry logic for transient failures
- ✅ **Approval gates** - User approval workflows integrated at critical phases
- ✅ **State machine integration** - Validates transitions using UnifiedWorkflow
- ✅ **Message ordering** - Guarantees message delivery order within priority tiers
- ✅ **Comprehensive metrics** - Monitor performance and queue health

---

## Architecture

### Priority Tiers

Messages are prioritized using a 4-tier system based on phase criticality:

| Priority | Level | Phases | Characteristics |
|----------|-------|--------|-----------------|
| CRITICAL | 0 | 4, 5 | Deployment, user confirmation, escalations |
| HIGH | 1 | 0, 1, 2, 3 | Discovery, requirements, assessment, planning |
| NORMAL | 2 | 6-10 | Validation, handoff, implementation, testing |
| LOW | 3 | 11 | Documentation, reporting |

### Message Flow

```
User Input
    ↓
publishPhaseMessage()
    ↓
[Priority Queue Selection]
    ├→ CRITICAL Queue
    ├→ HIGH Queue
    ├→ NORMAL Queue
    └→ LOW Queue
    ↓
Queue Processor (every 100ms)
    ↓
Route via AgentDiscoveryService
    ↓
[Delivery Success?]
    ├─YES→ Metrics Updated
    └─NO→ [Retries < Max?]
        ├─YES→ Exponential Backoff Retry
        └─NO→ Dead Letter Queue + Escalation
```

### Phase Transitions

Phases are connected via a state machine defined in UnifiedWorkflow:

- Phase 0 (Discovery) → Phase 1 (Requirements)
- Phase 1 → Phase 2 (Assessment)
- Phase 2 → Phase 3 (Planning)
- Phase 3 → Phase 4 (Code Generation) [User Approval Gate]
- Phase 4 → Phase 5 (Deployment) [User Confirmation Gate]
- Phase 5 → Phase 6 (Validation)
- Phase 6 → Phase 7 (Handoff)
- Phase 7 → Phase 8 (App Setup)
- Phase 8 → Phase 9 (Tracking)
- Phase 9 → Phase 10 (Testing)
- Phase 10 → Phase 11 (Documentation)

Some transitions can escalate or rollback on critical errors.

---

## API Reference

### Core Methods

#### `publishPhaseMessage(phaseMessage)`

Publish a message with phase context and automatic routing.

**Parameters:**
```javascript
{
  currentPhase: number,              // 0-11, required
  messageType: string,               // 'execution' | 'validation_gate' | 'escalation', default: 'execution'
  payload: object,                   // Message data, default: {}
  requiredCapability: string,        // Optional agent capability filter
  fromAgent: string,                 // Optional source agent ID
  approvalRequired: boolean           // Override auto-approval detection
}
```

**Returns:**
```javascript
{
  messageId: string,                 // Unique message ID
  phase: number,                     // Workflow phase
  targets: array,                    // Target agent IDs
  queued: boolean,                   // true if successfully queued
  priority: string                   // 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'
}
```

**Example:**
```javascript
const result = await messageBus.publishPhaseMessage({
  currentPhase: 2,
  messageType: 'execution',
  payload: { assessment: 'complete' },
  fromAgent: 'discovery-agent'
});

console.log(`Message ${result.messageId} queued for ${result.targets.length} agents`);
```

---

#### `processPhaseTransition(currentPhase, transitionReason, context)`

Process a phase transition with validation.

**Parameters:**
```javascript
{
  currentPhase: number,              // Current phase number
  transitionReason: string,          // Reason for transition
  context: {
    completedPhases: array,          // Phases already completed
    artifacts: object,               // Phase artifacts/outputs
    ...                              // Additional context
  }
}
```

**Returns:**
```javascript
{
  phaseTransitioned: boolean,        // true if successfully transitioned
  nextPhase: number,                 // Next phase number (if transitioned)
  messageId: string,                 // Entry message for next phase
  escalated: boolean,                // true if escalated (optional)
  rollback: boolean                  // true if rolled back (optional)
}
```

**Example:**
```javascript
const transition = await messageBus.processPhaseTransition(2, 'success', {
  completedPhases: [0, 1, 2],
  artifacts: { assessment: { issues: [] } }
});

if (transition.escalated) {
  console.log('Critical issue - escalated for manual intervention');
} else {
  console.log(`Transitioned to Phase ${transition.nextPhase}`);
}
```

---

#### `requestApproval(phase, artifacts)`

Request user approval for a phase gate.

**Parameters:**
```javascript
{
  phase: number,                     // Phase requiring approval
  artifacts: object                  // Phase artifacts for review
}
```

**Returns:**
```javascript
{
  approvalId: string,                // Unique approval request ID
  phase: number,                     // Phase number
  status: string,                    // 'awaiting_approval'
  artifacts: object                  // Reviewed artifacts
}
```

**Example:**
```javascript
const approval = await messageBus.requestApproval(4, {
  generatedCode: 'const app = ...',
  codeQuality: 0.95,
  coverage: 0.88
});

console.log(`Awaiting approval: ${approval.approvalId}`);
```

---

#### `submitApprovalDecision(approvalId, decision, feedback)`

Submit a decision for an approval gate.

**Parameters:**
```javascript
{
  approvalId: string,                // Approval request ID
  decision: string,                  // 'approve' | 'reject' | 'revise'
  feedback: object                   // Optional user feedback
}
```

**Returns:**
```javascript
{
  approvalId: string,
  decision: string,
  processed: boolean                 // true if accepted
}
```

**Example:**
```javascript
await messageBus.submitApprovalDecision(
  approval.approvalId,
  'approve',
  { comment: 'Looks good, ready for deployment' }
);
```

---

#### `getRoutingTargets(currentPhase, message)`

Get available agents for routing in a phase.

**Parameters:**
```javascript
{
  currentPhase: number,              // Phase number
  message: {
    requiredCapability: string       // Optional: filter by capability
  }
}
```

**Returns:**
```javascript
array  // Array of agent IDs available for this phase
```

**Example:**
```javascript
const agents = messageBus.getRoutingTargets(5, {
  requiredCapability: 'deployment'
});

console.log(`Available deployment agents: ${agents.join(', ')}`);
```

---

### Dead Letter Queue Management

#### `getDeadLetterQueue(options)`

Retrieve messages from dead letter queue.

**Parameters:**
```javascript
{
  limit: number,                     // Max results (default: 100)
  phase: number,                     // Optional: filter by phase
  since: ISO8601String              // Optional: messages since date
}
```

**Example:**
```javascript
const dlq = messageBus.getDeadLetterQueue({
  phase: 4,
  since: new Date(Date.now() - 3600000).toISOString()
});

console.log(`${dlq.length} failed messages in Phase 4 in last hour`);
```

---

#### `retryDeadLetterMessage(messageId)`

Retry a message from dead letter queue.

**Parameters:**
```javascript
messageId: string  // Message ID from DLQ
```

**Returns:**
```javascript
{
  messageId: string,
  requeued: boolean              // true if successfully re-queued
}
```

**Example:**
```javascript
const dlqMessages = messageBus.getDeadLetterQueue({ limit: 1 });
if (dlqMessages.length > 0) {
  await messageBus.retryDeadLetterMessage(dlqMessages[0].id);
}
```

---

### Metrics & Monitoring

#### `getMetrics()`

Get comprehensive metrics.

**Returns:**
```javascript
{
  messagesReceived: number,
  messagesProcessed: number,
  messagesFailed: number,
  messagesRetried: number,
  deadLetterCount: number,
  phaseTransitions: number,
  approvalGatesTriggered: number,
  queueStats: {
    critical: number,
    high: number,
    normal: number,
    low: number,
    total: number
  },
  deadLetterQueueSize: number,
  currentlyProcessing: number,
  routingTargets: number,
  definedPhases: number,
  approvalGatesConfigured: number
}
```

**Example:**
```javascript
const metrics = messageBus.getMetrics();

console.log(`
Queue Health:
  - Processing: ${metrics.currentlyProcessing} messages
  - Critical Queue: ${metrics.queueStats.critical}
  - Dead Letter: ${metrics.deadLetterCount}
  
Performance:
  - Processed: ${metrics.messagesProcessed}
  - Failed: ${metrics.messagesFailed}
  - Retry Rate: ${(metrics.messagesRetried / metrics.messagesReceived * 100).toFixed(2)}%
`);
```

---

### State Persistence

#### `exportState()`

Export complete message bus state for persistence.

**Returns:**
```javascript
{
  queues: object,                    // All priority queues
  deadLetterQueue: array,            // DLQ contents
  metrics: object,                   // All metrics
  timestamp: ISO8601String           // Export timestamp
}
```

---

#### `importState(state)`

Import previously exported state.

**Parameters:**
```javascript
state: object  // Exported state object
```

**Example:**
```javascript
const savedState = JSON.parse(fs.readFileSync('bus-state.json'));
messageBus.importState(savedState);
```

---

## Event Emissions

The EnhancedMessageBus emits events for monitoring:

### `message:queued`
```javascript
messageBus.on('message:queued', (data) => {
  console.log(`Message ${data.messageId} queued (Priority: ${data.priority})`);
});
```

### `message:processed`
```javascript
messageBus.on('message:processed', (data) => {
  console.log(`Message ${data.messageId} delivered to ${data.targets} agents`);
});
```

### `message:retry`
```javascript
messageBus.on('message:retry', (data) => {
  console.log(`Retrying message (attempt ${data.retryCount}/${maxRetries})`);
});
```

### `message:deadletter`
```javascript
messageBus.on('message:deadletter', (data) => {
  console.log(`Message ${data.messageId} moved to DLQ: ${data.reason}`);
});
```

### `phase:transitioned`
```javascript
messageBus.on('phase:transitioned', (data) => {
  console.log(`Phase ${data.from} → ${data.to} (${data.reason})`);
});
```

### `approval:requested`
```javascript
messageBus.on('approval:requested', (data) => {
  console.log(`Approval ${data.approvalId} for Phase ${data.phase}`);
});
```

### `approval:decided`
```javascript
messageBus.on('approval:decided', (data) => {
  console.log(`Approval ${data.decision}: ${data.feedback.comment}`);
});
```

---

## Configuration

### Constructor Options

```javascript
const bus = new EnhancedMessageBus({
  maxHistorySize: 1000,              // Base MessageBus config
  messageTimeout: 30000,             // 30 second timeout
  
  maxRetries: 3,                     // Retry configuration
  initialBackoff: 1000,              // 1 second initial backoff
  maxBackoff: 30000,                 // 30 second max backoff
  backoffMultiplier: 2               // Exponential: 1s, 2s, 4s, 8s, 16s...
});
```

### Retry Logic

Failed messages retry with exponential backoff:

```
Attempt 1: Immediate
Attempt 2: 1s × 2^0 = 1 second
Attempt 3: 1s × 2^1 = 2 seconds
Attempt 4: 1s × 2^2 = 4 seconds
Attempt 5: 1s × 2^3 = 8 seconds (capped at 30s max)

After final failure → Dead Letter Queue + Escalation Alert
```

---

## Usage Patterns

### Complete Workflow

```javascript
import { enhancedMessageBus } from './agents/core/EnhancedMessageBus.js';

async function executePhase() {
  // Phase 0: Discovery with approval
  const approval = await enhancedMessageBus.requestApproval(0, {
    userInput: { projectType: 'web' },
    systemPrompt: 'Analyze requirements...'
  });

  // User reviews and approves
  await enhancedMessageBus.submitApprovalDecision(
    approval.approvalId,
    'approve'
  );

  // Publish discovery phase message
  const discoverMsg = await enhancedMessageBus.publishPhaseMessage({
    currentPhase: 0,
    messageType: 'execution',
    payload: { scope: 'full' }
  });

  // Transition to Phase 1
  const transition = await enhancedMessageBus.processPhaseTransition(
    0,
    'success',
    { completedPhases: [0] }
  );

  return transition.nextPhase;
}
```

### Monitoring Queue Health

```javascript
setInterval(() => {
  const metrics = enhancedMessageBus.getMetrics();
  
  if (metrics.deadLetterCount > 10) {
    console.warn('High DLQ count - intervention needed');
    const dlq = enhancedMessageBus.getDeadLetterQueue({ limit: 5 });
    dlq.forEach(msg => {
      console.log(`  Failed: ${msg.id} - ${msg.failureReason}`);
    });
  }
  
  if (metrics.queueStats.critical > 5) {
    console.warn('Critical queue building up');
  }
}, 60000);  // Check every minute
```

### Escalation Handling

```javascript
enhancedMessageBus.on('message:deadletter', async (data) => {
  console.error(`Message failed: ${data.reason}`);
  
  // Create incident ticket
  const incident = await createIncident({
    severity: 'high',
    phase: data.phase,
    messageId: data.messageId,
    error: data.reason
  });

  // Notify on-call engineer
  await notifyEngineer(incident);
});
```

---

## Integration with Agents

### In Agent Implementation

```javascript
import { enhancedMessageBus } from '../core/EnhancedMessageBus.js';

export class MyAgent {
  async execute(phase, context) {
    try {
      // Do work...
      
      // Publish results to next phase agents
      await enhancedMessageBus.publishPhaseMessage({
        currentPhase: phase + 1,
        messageType: 'execution',
        fromAgent: this.id,
        payload: { results: context.output }
      });
      
    } catch (error) {
      // Escalate critical errors
      await enhancedMessageBus.publishPhaseMessage({
        currentPhase: phase,
        messageType: 'escalation',
        fromAgent: this.id,
        payload: { error: error.message }
      });
    }
  }
}
```

---

## Troubleshooting

### Message Not Processing

1. Check queue metrics: `messageBus.getMetrics()`
2. Verify routing targets: `messageBus.getRoutingTargets(phase)`
3. Review queue state: `messageBus.exportState()`

### High Dead Letter Queue

1. Retrieve failed messages: `messageBus.getDeadLetterQueue()`
2. Analyze failure reasons
3. Fix root cause
4. Retry: `messageBus.retryDeadLetterMessage(messageId)`

### Approval Gates Not Triggering

1. Check approval configuration: `messageBus.approvalGates`
2. Ensure correct phase number
3. Verify `approvalRequired` parameter in message

---

## Performance Characteristics

- **Queue Processing**: 100ms cycle
- **Retry Backoff**: Exponential (1s to 30s)
- **Message History**: 1000 messages max (configurable)
- **Concurrent Messages**: Unlimited queuing, serial delivery
- **Memory**: ~1MB per 10,000 queued messages

---

## Migration from MessageBus

The EnhancedMessageBus extends MessageBus, so existing code works unchanged:

```javascript
// Old code still works
messageBus.publish('topic', message);
messageBus.send('agent1', 'agent2', payload);

// New phase-aware code
await messageBus.publishPhaseMessage({
  currentPhase: 3,
  messageType: 'execution'
});
```

---

## Testing

Run the comprehensive test suite:

```bash
npm test -- agents/test/EnhancedMessageBus.test.js
```

Tests cover:
- ✅ Phase routing
- ✅ Priority queuing
- ✅ Deadletter handling
- ✅ Approval gates
- ✅ Phase transitions
- ✅ Retry logic
- ✅ Event emissions
- ✅ Integration workflows

---

## Next Steps

The EnhancedMessageBus is ready for:

1. **Task #5**: Agent implementation (DiscoveryAgent, PlannerAgent, etc.)
2. **Integration**: Connect agents to message bus routing
3. **Testing**: Full end-to-end workflow tests
4. **Deployment**: Production orchestration across agents

---

## Summary

| Feature | Status | Tests |
|---------|--------|-------|
| Phase Routing | ✅ Complete | 4 tests |
| Priority Queuing | ✅ Complete | 4 tests |
| Dead Letter Queue | ✅ Complete | 4 tests |
| Phase Transitions | ✅ Complete | 5 tests |
| Approval Gates | ✅ Complete | 5 tests |
| Message Publishing | ✅ Complete | 5 tests |
| Metrics | ✅ Complete | 3 tests |
| Events | ✅ Complete | 6 tests |
| Integration | ✅ Complete | 3 tests |

**Total: 39 test cases covering all functionality**

---

*Created: January 15, 2026*
*Status: Production Ready*
*Dependencies: UnifiedWorkflow.js, AgentDiscoveryService.js, MessageBus.js*
