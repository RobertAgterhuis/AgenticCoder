# CQRS with Event Sourcing Skill

## Overview

This skill covers the combined implementation of Command Query Responsibility Segregation (CQRS) with Event Sourcing, providing a powerful pattern for complex domain models.

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         Application                                │
├─────────────────────────────┬─────────────────────────────────────┤
│       Command Side          │           Query Side                 │
│  ┌─────────────────────┐    │    ┌─────────────────────┐          │
│  │   Command Handler   │    │    │   Query Handler     │          │
│  └──────────┬──────────┘    │    └──────────┬──────────┘          │
│             │               │               │                      │
│  ┌──────────▼──────────┐    │    ┌──────────▼──────────┐          │
│  │    Aggregate        │    │    │    Read Model       │          │
│  │  (Domain Logic)     │    │    │   (Projections)     │          │
│  └──────────┬──────────┘    │    └──────────┬──────────┘          │
│             │               │               │                      │
│  ┌──────────▼──────────┐    │    ┌──────────▼──────────┐          │
│  │   Event Store       │───────▶│   Read Database      │          │
│  │   (Write Model)     │    │    │   (Denormalized)    │          │
│  └─────────────────────┘    │    └─────────────────────┘          │
└─────────────────────────────┴─────────────────────────────────────┘
```

---

## Event Store Implementation

### Event Schema

```typescript
interface StoredEvent {
  eventId: string;
  streamId: string;         // Aggregate ID
  streamType: string;       // Aggregate Type
  eventType: string;
  version: number;          // Per-stream sequence
  globalPosition: number;   // Global sequence
  timestamp: Date;
  data: unknown;
  metadata: {
    correlationId: string;
    causationId: string;
    userId?: string;
  };
}
```

### Event Store Interface

```typescript
interface EventStore {
  // Append events to a stream
  appendToStream(
    streamId: string,
    expectedVersion: number,
    events: DomainEvent[]
  ): Promise<void>;
  
  // Read events from a stream
  readStream(
    streamId: string,
    fromVersion?: number
  ): Promise<StoredEvent[]>;
  
  // Subscribe to all events (for projections)
  subscribeToAll(
    fromPosition: number,
    handler: (event: StoredEvent) => Promise<void>
  ): Subscription;
}
```

### Optimistic Concurrency

```typescript
class EventStoreRepository implements EventStore {
  async appendToStream(
    streamId: string,
    expectedVersion: number,
    events: DomainEvent[]
  ): Promise<void> {
    const currentVersion = await this.getStreamVersion(streamId);
    
    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyError(
        `Expected version ${expectedVersion}, but current is ${currentVersion}`
      );
    }
    
    // Append with incremented versions
    let version = expectedVersion;
    for (const event of events) {
      await this.store({
        ...event,
        streamId,
        version: ++version,
        globalPosition: await this.getNextGlobalPosition(),
      });
    }
  }
}
```

---

## Aggregate Implementation

### Base Aggregate

```typescript
abstract class AggregateRoot<TState> {
  private _uncommittedEvents: DomainEvent[] = [];
  protected _version: number = 0;
  protected _state: TState;
  
  get id(): string {
    return this._id;
  }
  
  get version(): number {
    return this._version;
  }
  
  get uncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }
  
  // Apply event and add to uncommitted
  protected apply(event: DomainEvent): void {
    this.mutate(event);
    this._uncommittedEvents.push(event);
  }
  
  // Mutate state based on event
  protected abstract mutate(event: DomainEvent): void;
  
  // Reconstitute from history
  static rehydrate<T extends AggregateRoot<any>>(
    this: new () => T,
    events: DomainEvent[]
  ): T {
    const aggregate = new this();
    for (const event of events) {
      aggregate.mutate(event);
      aggregate._version++;
    }
    return aggregate;
  }
  
  clearUncommittedEvents(): void {
    this._uncommittedEvents = [];
  }
}
```

### Example: Order Aggregate

```typescript
interface OrderState {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
}

class Order extends AggregateRoot<OrderState> {
  // Command: Create order
  static create(customerId: string, items: OrderItem[]): Order {
    const order = new Order();
    order.apply(new OrderCreatedEvent({
      orderId: uuid(),
      customerId,
      items,
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }));
    return order;
  }
  
  // Command: Add item
  addItem(item: OrderItem): void {
    if (this._state.status !== 'DRAFT') {
      throw new Error('Can only add items to draft orders');
    }
    this.apply(new ItemAddedEvent({
      orderId: this._state.id,
      item,
    }));
  }
  
  // Command: Submit order
  submit(): void {
    if (this._state.items.length === 0) {
      throw new Error('Cannot submit empty order');
    }
    this.apply(new OrderSubmittedEvent({
      orderId: this._state.id,
      submittedAt: new Date(),
    }));
  }
  
  // Event handlers (mutate state)
  protected mutate(event: DomainEvent): void {
    switch (event.type) {
      case 'OrderCreated':
        this._state = {
          id: event.data.orderId,
          customerId: event.data.customerId,
          items: event.data.items,
          status: 'DRAFT',
          total: event.data.total,
        };
        break;
        
      case 'ItemAdded':
        this._state.items.push(event.data.item);
        this._state.total += event.data.item.price * event.data.item.quantity;
        break;
        
      case 'OrderSubmitted':
        this._state.status = 'SUBMITTED';
        break;
    }
  }
}
```

---

## Command Handler

```typescript
class OrderCommandHandler {
  constructor(
    private eventStore: EventStore,
    private eventBus: EventBus
  ) {}
  
  async handle(command: CreateOrderCommand): Promise<string> {
    // Create new aggregate
    const order = Order.create(command.customerId, command.items);
    
    // Persist events
    await this.eventStore.appendToStream(
      order.id,
      -1,  // New stream
      order.uncommittedEvents
    );
    
    // Publish events
    for (const event of order.uncommittedEvents) {
      await this.eventBus.publish(event);
    }
    
    return order.id;
  }
  
  async handle(command: SubmitOrderCommand): Promise<void> {
    // Load aggregate from events
    const events = await this.eventStore.readStream(command.orderId);
    const order = Order.rehydrate(events);
    
    // Execute command
    order.submit();
    
    // Persist with expected version
    await this.eventStore.appendToStream(
      command.orderId,
      order.version,
      order.uncommittedEvents
    );
    
    // Publish events
    for (const event of order.uncommittedEvents) {
      await this.eventBus.publish(event);
    }
  }
}
```

---

## Projections (Read Models)

### Projection Handler

```typescript
class OrderSummaryProjection {
  constructor(private readDb: ReadDatabase) {}
  
  @EventHandler(OrderCreatedEvent)
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.readDb.insert('order_summaries', {
      orderId: event.data.orderId,
      customerId: event.data.customerId,
      itemCount: event.data.items.length,
      total: event.data.total,
      status: 'DRAFT',
      createdAt: event.timestamp,
    });
  }
  
  @EventHandler(ItemAddedEvent)
  async onItemAdded(event: ItemAddedEvent): Promise<void> {
    await this.readDb.update('order_summaries', 
      { orderId: event.data.orderId },
      { 
        $inc: { 
          itemCount: 1,
          total: event.data.item.price * event.data.item.quantity,
        },
      }
    );
  }
  
  @EventHandler(OrderSubmittedEvent)
  async onOrderSubmitted(event: OrderSubmittedEvent): Promise<void> {
    await this.readDb.update('order_summaries',
      { orderId: event.data.orderId },
      { status: 'SUBMITTED', submittedAt: event.data.submittedAt }
    );
  }
}
```

### Query Handler

```typescript
class OrderQueryHandler {
  constructor(private readDb: ReadDatabase) {}
  
  async getOrderSummary(orderId: string): Promise<OrderSummaryDto> {
    return this.readDb.findOne('order_summaries', { orderId });
  }
  
  async getCustomerOrders(customerId: string): Promise<OrderSummaryDto[]> {
    return this.readDb.find('order_summaries', { customerId });
  }
  
  async getRecentOrders(limit: number = 10): Promise<OrderSummaryDto[]> {
    return this.readDb.find('order_summaries', {}, {
      sort: { createdAt: -1 },
      limit,
    });
  }
}
```

---

## Snapshot Pattern

For aggregates with many events:

```typescript
interface Snapshot<TState> {
  streamId: string;
  version: number;
  state: TState;
  timestamp: Date;
}

class SnapshotStore {
  async save<TState>(aggregate: AggregateRoot<TState>): Promise<void> {
    await this.store({
      streamId: aggregate.id,
      version: aggregate.version,
      state: aggregate.state,
      timestamp: new Date(),
    });
  }
  
  async load<TState>(streamId: string): Promise<Snapshot<TState> | null> {
    return this.findLatest(streamId);
  }
}

// Loading with snapshot
async function loadAggregate(id: string): Promise<Order> {
  const snapshot = await snapshotStore.load<OrderState>(id);
  
  let events: DomainEvent[];
  if (snapshot) {
    // Load only events after snapshot
    events = await eventStore.readStream(id, snapshot.version + 1);
    return Order.rehydrateFromSnapshot(snapshot.state, events);
  } else {
    events = await eventStore.readStream(id);
    return Order.rehydrate(events);
  }
}
```

---

## Event Upcasting

```typescript
class EventUpcaster {
  upcast(event: StoredEvent): StoredEvent {
    switch (event.eventType) {
      case 'OrderCreated':
        return this.upcastOrderCreated(event);
      default:
        return event;
    }
  }
  
  private upcastOrderCreated(event: StoredEvent): StoredEvent {
    // V1 → V2: Add shippingAddress field
    if (!event.data.shippingAddress) {
      return {
        ...event,
        data: {
          ...event.data,
          shippingAddress: null,  // Default value
        },
      };
    }
    return event;
  }
}
```

---

## Eventual Consistency

| Strategy | Description |
|----------|-------------|
| UI Polling | Poll read model until updated |
| WebSocket | Push updates when projection completes |
| Optimistic UI | Show expected result immediately |
| Correlation ID | Track command → projection update |

---

## Related Skills

- [event-sourcing](event-sourcing.skill.md) - Pure event sourcing
- [cqrs-patterns](cqrs-patterns.skill.md) - Pure CQRS
- [saga-patterns](saga-patterns.skill.md) - Distributed transactions

---

## Related Agents

- @event-driven-architect - Architecture guidance
- @microservices-architect - Service design
- @cosmos-db-specialist - Event store implementation

---

## Tags

`cqrs` `event-sourcing` `ddd` `aggregate` `projections` `event-store`
