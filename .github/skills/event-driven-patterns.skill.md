# Event-Driven Patterns Skill

## Overview

This skill provides comprehensive patterns for event-driven architecture including event design, messaging patterns, and implementation strategies.

---

## Event Types

### Domain Events

Events that capture something important that happened in the domain.

```typescript
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  version: number;
  payload: unknown;
}

// Example
const orderCreatedEvent: DomainEvent = {
  eventId: 'evt-123',
  eventType: 'OrderCreated',
  aggregateId: 'order-456',
  aggregateType: 'Order',
  timestamp: new Date(),
  version: 1,
  payload: {
    customerId: 'cust-789',
    items: [{ productId: 'prod-1', quantity: 2 }],
    totalAmount: 99.99,
  },
};
```

### Integration Events

Events shared between bounded contexts/services.

```typescript
interface IntegrationEvent {
  eventId: string;
  eventType: string;
  source: string;
  timestamp: Date;
  correlationId?: string;
  payload: unknown;
}

// Example
const paymentReceivedEvent: IntegrationEvent = {
  eventId: 'evt-456',
  eventType: 'PaymentReceived',
  source: 'payment-service',
  timestamp: new Date(),
  correlationId: 'corr-123',
  payload: {
    orderId: 'order-456',
    amount: 99.99,
    paymentMethod: 'credit-card',
  },
};
```

---

## Messaging Patterns

### Publish/Subscribe

```
┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Publisher  │────▶│    Topic    │────▶│  Subscriber A    │
│ OrderService │     │ OrderEvents │────▶│  Subscriber B    │
└──────────────┘     └─────────────┘────▶│  Subscriber C    │
                                         └──────────────────┘
```

```typescript
// Publisher
class OrderService {
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const order = await this.repository.save(dto);
    
    await this.serviceBus.sendToTopic('order-events', {
      type: 'OrderCreated',
      data: order,
    });
    
    return order;
  }
}

// Subscriber
@ServiceBusSubscription('order-events', 'inventory-subscription')
async handleOrderCreated(message: OrderCreatedEvent) {
  await this.inventoryService.reserveStock(message.data.items);
}
```

### Point-to-Point (Queue)

```
┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Producer   │────▶│    Queue    │────▶│    Consumer      │
│              │     │             │     │  (single)        │
└──────────────┘     └─────────────┘     └──────────────────┘
```

```typescript
// For work items that should be processed once
await serviceBus.sendToQueue('payment-processing', {
  orderId: order.id,
  amount: order.total,
});
```

### Request/Reply

```typescript
// Async request/reply with correlation
class OrderService {
  async processOrder(order: Order): Promise<PaymentResult> {
    const correlationId = uuid();
    
    await this.bus.send('payment-requests', {
      correlationId,
      orderId: order.id,
      amount: order.total,
    });
    
    // Wait for reply
    return this.bus.waitForReply('payment-responses', correlationId, {
      timeout: 30000,
    });
  }
}
```

---

## Event Design Principles

### Event Naming

| Pattern | Example | Use Case |
|---------|---------|----------|
| Past tense | `OrderCreated` | Domain events |
| Noun + Past Participle | `PaymentProcessed` | Integration events |
| Imperative (commands) | `ProcessPayment` | Commands (not events) |

### Event Envelope

```typescript
interface EventEnvelope<T> {
  // Metadata
  eventId: string;
  eventType: string;
  timestamp: Date;
  version: string;
  
  // Tracing
  correlationId: string;
  causationId: string;
  
  // Source
  source: string;
  aggregateId?: string;
  
  // Payload
  data: T;
}
```

### Event Versioning

```typescript
// V1
interface OrderCreatedV1 {
  orderId: string;
  customerId: string;
  total: number;
}

// V2 - Added shipping address
interface OrderCreatedV2 {
  orderId: string;
  customerId: string;
  total: number;
  shippingAddress?: Address;  // Optional for backward compatibility
}

// Upcaster
function upcastOrderCreated(event: OrderCreatedV1): OrderCreatedV2 {
  return {
    ...event,
    shippingAddress: undefined,
  };
}
```

---

## Event Ordering

### Partition-Based Ordering

```typescript
// Azure Service Bus - session-based ordering
await sender.sendMessages({
  body: orderEvent,
  sessionId: orderId,  // All events for same order go to same partition
});

// Consumer processes events in order per session
const receiver = client.acceptSession('order-events', 'sub', sessionId);
```

### Sequence Numbers

```typescript
interface SequencedEvent extends DomainEvent {
  sequenceNumber: number;
  
  // Detect gaps
  validateSequence(lastProcessed: number): boolean {
    return this.sequenceNumber === lastProcessed + 1;
  }
}
```

---

## Delivery Guarantees

| Guarantee | Description | Implementation |
|-----------|-------------|----------------|
| At-most-once | May lose messages | Fire and forget |
| At-least-once | May duplicate | Retry + idempotency |
| Exactly-once | No loss, no duplicates | Transactions + deduplication |

### Idempotent Consumer

```typescript
class IdempotentEventHandler {
  private processedEvents = new Set<string>();
  
  async handle(event: DomainEvent): Promise<void> {
    // Check if already processed
    if (await this.isProcessed(event.eventId)) {
      console.log(`Event ${event.eventId} already processed, skipping`);
      return;
    }
    
    // Process event
    await this.processEvent(event);
    
    // Mark as processed
    await this.markProcessed(event.eventId);
  }
  
  private async isProcessed(eventId: string): Promise<boolean> {
    return this.repository.exists({ eventId });
  }
}
```

---

## Dead Letter Handling

```typescript
class DeadLetterProcessor {
  async processDeadLetters(): Promise<void> {
    const receiver = client.createReceiver(queue, { subQueueType: 'deadLetter' });
    
    const messages = await receiver.receiveMessages(10);
    
    for (const message of messages) {
      console.log('Dead letter reason:', message.deadLetterReason);
      console.log('Error:', message.deadLetterErrorDescription);
      
      // Analyze and potentially reprocess
      if (this.isRetryable(message)) {
        await this.requeue(message);
      } else {
        await this.logToMonitoring(message);
      }
      
      await receiver.completeMessage(message);
    }
  }
}
```

---

## Event Sourcing

See: [event-sourcing.skill.md](event-sourcing.skill.md)

---

## Saga Pattern

See: [saga-patterns.skill.md](saga-patterns.skill.md)

---

## Azure Service Bus Patterns

```typescript
// Topic with subscriptions
const adminClient = new ServiceBusAdministrationClient(connectionString);

// Create topic
await adminClient.createTopic('order-events');

// Create filtered subscriptions
await adminClient.createSubscription('order-events', 'high-value-orders', {
  defaultRuleOptions: {
    filter: {
      sqlExpression: "total > 1000"
    }
  }
});

await adminClient.createSubscription('order-events', 'international-orders', {
  defaultRuleOptions: {
    filter: {
      sqlExpression: "country != 'NL'"
    }
  }
});
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| God Event | Too much data in one event | Split into focused events |
| Event Sourcing Everything | Complexity overhead | Use selectively |
| Synchronous Disguised as Async | Waiting for response | True async or sync call |
| Missing Correlation | Can't trace flow | Always include correlationId |
| No Schema | Breaking changes | Version events, use schemas |

---

## Related Agents

- @event-driven-architect - Full architecture guidance
- @microservices-architect - Service design
- @serverless-specialist - Azure Functions triggers

---

## Tags

`event-driven` `messaging` `pub-sub` `service-bus` `domain-events` `integration`
