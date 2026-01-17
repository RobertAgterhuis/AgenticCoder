# Saga Patterns Skill

## Overview

This skill provides comprehensive patterns for implementing the Saga pattern to manage distributed transactions across microservices.

---

## Saga Overview

A Saga is a sequence of local transactions where each step publishes events or messages to trigger the next step. If a step fails, compensating transactions are executed to undo the previous steps.

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Step 1  │────▶│ Step 2  │────▶│ Step 3  │────▶│ Step 4  │
│ Order   │     │Inventory│     │ Payment │     │Shipping │
└────┬────┘     └────┬────┘     └────┬────┘     └─────────┘
     │               │               │
     │ FAIL?         │ FAIL?         │ FAIL?
     ▼               ▼               ▼
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Comp 1  │◀────│ Comp 2  │◀────│ Comp 3  │
│ Cancel  │     │ Release │     │ Refund  │
└─────────┘     └─────────┘     └─────────┘
```

---

## Saga Types

### Choreography-Based Saga

Services react to events and publish new events. No central coordinator.

```typescript
// Order Service
class OrderService {
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const order = await this.repository.save({ ...dto, status: 'PENDING' });
    
    // Publish event - Inventory service will react
    await this.eventBus.publish(new OrderCreatedEvent({
      orderId: order.id,
      items: order.items,
    }));
    
    return order;
  }
  
  // Listen for inventory events
  @OnEvent(InventoryReservedEvent)
  async onInventoryReserved(event: InventoryReservedEvent) {
    await this.repository.updateStatus(event.orderId, 'INVENTORY_RESERVED');
    
    // Publish next event
    await this.eventBus.publish(new PaymentRequestedEvent({
      orderId: event.orderId,
      amount: event.totalAmount,
    }));
  }
  
  @OnEvent(InventoryReservationFailedEvent)
  async onInventoryFailed(event: InventoryReservationFailedEvent) {
    // Compensate - cancel order
    await this.repository.updateStatus(event.orderId, 'CANCELLED');
    await this.eventBus.publish(new OrderCancelledEvent({ orderId: event.orderId }));
  }
}

// Inventory Service
class InventoryService {
  @OnEvent(OrderCreatedEvent)
  async onOrderCreated(event: OrderCreatedEvent) {
    try {
      const reservation = await this.reserveStock(event.items);
      
      await this.eventBus.publish(new InventoryReservedEvent({
        orderId: event.orderId,
        reservationId: reservation.id,
      }));
    } catch (error) {
      await this.eventBus.publish(new InventoryReservationFailedEvent({
        orderId: event.orderId,
        reason: error.message,
      }));
    }
  }
}
```

### Orchestration-Based Saga

A central orchestrator coordinates the saga steps.

```typescript
class OrderSagaOrchestrator {
  private steps: SagaStep[] = [
    {
      name: 'createOrder',
      execute: (ctx) => this.orderService.create(ctx.data),
      compensate: (ctx) => this.orderService.cancel(ctx.orderId),
    },
    {
      name: 'reserveInventory',
      execute: (ctx) => this.inventoryService.reserve(ctx.orderId, ctx.items),
      compensate: (ctx) => this.inventoryService.release(ctx.reservationId),
    },
    {
      name: 'processPayment',
      execute: (ctx) => this.paymentService.charge(ctx.orderId, ctx.amount),
      compensate: (ctx) => this.paymentService.refund(ctx.paymentId),
    },
    {
      name: 'arrangeShipping',
      execute: (ctx) => this.shippingService.schedule(ctx.orderId),
      compensate: (ctx) => this.shippingService.cancel(ctx.shipmentId),
    },
  ];
  
  async execute(orderData: CreateOrderDto): Promise<SagaResult> {
    const context: SagaContext = { data: orderData, completedSteps: [] };
    
    for (const step of this.steps) {
      try {
        const result = await step.execute(context);
        context.completedSteps.push({ step, result });
        Object.assign(context, result);  // Merge result into context
      } catch (error) {
        // Compensate in reverse order
        await this.compensate(context);
        return { status: 'FAILED', failedStep: step.name, error };
      }
    }
    
    return { status: 'COMPLETED', context };
  }
  
  private async compensate(context: SagaContext): Promise<void> {
    // Execute compensations in reverse order
    for (const { step, result } of context.completedSteps.reverse()) {
      try {
        await step.compensate({ ...context, ...result });
      } catch (compensateError) {
        // Log but continue compensating
        console.error(`Compensation failed for ${step.name}:`, compensateError);
      }
    }
  }
}
```

---

## Durable Functions Saga

```typescript
import * as df from 'durable-functions';

df.app.orchestration('orderSaga', function* (context) {
  const order = context.df.getInput() as CreateOrderDto;
  const compensations: CompensationStep[] = [];
  
  try {
    // Step 1: Create Order
    const orderId = yield context.df.callActivity('createOrder', order);
    compensations.push({ activity: 'cancelOrder', input: { orderId } });
    
    // Step 2: Reserve Inventory
    const reservation = yield context.df.callActivity('reserveInventory', {
      orderId,
      items: order.items,
    });
    compensations.push({ activity: 'releaseInventory', input: reservation });
    
    // Step 3: Process Payment
    const payment = yield context.df.callActivity('processPayment', {
      orderId,
      amount: order.total,
    });
    compensations.push({ activity: 'refundPayment', input: payment });
    
    // Step 4: Arrange Shipping
    const shipment = yield context.df.callActivity('arrangeShipping', { orderId });
    
    return { status: 'COMPLETED', orderId, shipment };
    
  } catch (error) {
    // Execute compensations in reverse
    for (const comp of compensations.reverse()) {
      try {
        yield context.df.callActivity(comp.activity, comp.input);
      } catch (compError) {
        context.log(`Compensation ${comp.activity} failed:`, compError);
      }
    }
    
    return { status: 'FAILED', error: error.message };
  }
});
```

---

## Saga State Machine

```typescript
enum OrderSagaState {
  CREATED = 'CREATED',
  INVENTORY_RESERVED = 'INVENTORY_RESERVED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  COMPENSATING = 'COMPENSATING',
  FAILED = 'FAILED',
}

interface SagaTransition {
  from: OrderSagaState;
  to: OrderSagaState;
  on: string;
  action: () => Promise<void>;
}

const transitions: SagaTransition[] = [
  { from: 'CREATED', to: 'INVENTORY_RESERVED', on: 'INVENTORY_OK', action: reserveInventory },
  { from: 'CREATED', to: 'FAILED', on: 'INVENTORY_FAIL', action: cancelOrder },
  { from: 'INVENTORY_RESERVED', to: 'PAYMENT_PROCESSED', on: 'PAYMENT_OK', action: processPayment },
  { from: 'INVENTORY_RESERVED', to: 'COMPENSATING', on: 'PAYMENT_FAIL', action: startCompensation },
  // ... more transitions
];
```

---

## Compensating Transactions

### Design Principles

| Principle | Description |
|-----------|-------------|
| Semantic Undo | May not restore exact state, but business-equivalent |
| Idempotent | Safe to execute multiple times |
| Always succeed | Compensations should not fail |
| Independent | Don't depend on other compensations |

### Examples

| Forward Transaction | Compensation |
|--------------------|--------------|
| Create Order | Mark as Cancelled |
| Reserve Inventory | Release Reservation |
| Charge Payment | Issue Refund |
| Schedule Shipment | Cancel Shipment |
| Send Confirmation Email | Send Cancellation Email |

---

## Saga Log

```typescript
interface SagaLogEntry {
  sagaId: string;
  stepName: string;
  stepType: 'EXECUTE' | 'COMPENSATE';
  status: 'STARTED' | 'COMPLETED' | 'FAILED';
  timestamp: Date;
  input: unknown;
  output?: unknown;
  error?: string;
}

class SagaLog {
  async logStep(entry: SagaLogEntry): Promise<void> {
    await this.repository.save(entry);
  }
  
  async getSagaHistory(sagaId: string): Promise<SagaLogEntry[]> {
    return this.repository.findBySagaId(sagaId);
  }
  
  async getFailedSagas(): Promise<string[]> {
    return this.repository.findDistinct('sagaId', { 
      status: 'FAILED',
      stepType: 'EXECUTE',
    });
  }
}
```

---

## Error Recovery

### Retry with Timeout

```typescript
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  timeout: number = 30000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await delay(Math.pow(2, attempt) * 1000);  // Exponential backoff
      }
    }
  }
  
  throw lastError;
}
```

### Dead Saga Recovery

```typescript
class SagaRecoveryService {
  async recoverFailedSagas(): Promise<void> {
    const failedSagas = await this.sagaLog.getFailedSagas();
    
    for (const sagaId of failedSagas) {
      const history = await this.sagaLog.getSagaHistory(sagaId);
      const completedSteps = this.getCompletedSteps(history);
      
      // Resume compensation from where it left off
      await this.orchestrator.resumeCompensation(sagaId, completedSteps);
    }
  }
}
```

---

## Choreography vs Orchestration

| Aspect | Choreography | Orchestration |
|--------|--------------|---------------|
| Coupling | Loose | Tighter to orchestrator |
| Complexity | Distributed | Centralized |
| Visibility | Harder to track | Easy to monitor |
| Single point of failure | No | Yes (orchestrator) |
| Testing | More difficult | Easier |
| Changes | Update multiple services | Update orchestrator |

**Recommendation:**
- **Simple sagas (2-3 steps)**: Choreography
- **Complex sagas (4+ steps)**: Orchestration
- **Need visibility**: Orchestration

---

## Related Skills

- [event-driven-patterns](event-driven-patterns.skill.md) - Event handling
- [microservices-patterns](microservices-patterns.skill.md) - Service design
- [cqrs-patterns](cqrs-patterns.skill.md) - Command/Query separation

---

## Related Agents

- @microservices-architect - Architecture guidance
- @event-driven-architect - Event design
- @serverless-specialist - Durable Functions implementation

---

## Tags

`saga` `distributed-transactions` `compensation` `orchestration` `choreography` `microservices`
