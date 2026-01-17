# Event Sourcing Skill

**Building Event-Driven Systems with Full Audit Trails**

**Version**: 1.0  
**Category**: Architecture Patterns  
**Complexity**: Advanced

---

## Overview

Event Sourcing is an architectural pattern where the state of an application is determined by a sequence of events. Instead of storing just the current state, every state change is captured as an immutable event. This enables complete audit trails, temporal queries, and flexible state reconstruction.

---

## Core Concepts

### 1. Events as Source of Truth

In event sourcing, events are the primary source of truth. Current state is derived by replaying events.

```typescript
// Events capture what happened
interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
}

// Example: Order lifecycle events
class OrderCreated implements DomainEvent {
  readonly eventType = 'order.created';
  
  constructor(
    public readonly eventId: string,
    public readonly aggregateId: string,
    public readonly occurredAt: Date,
    public readonly version: number,
    public readonly customerId: string,
    public readonly currency: string
  ) {}
}

class OrderLineAdded implements DomainEvent {
  readonly eventType = 'order.line_added';
  
  constructor(
    public readonly eventId: string,
    public readonly aggregateId: string,
    public readonly occurredAt: Date,
    public readonly version: number,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly unitPrice: number
  ) {}
}

class OrderConfirmed implements DomainEvent {
  readonly eventType = 'order.confirmed';
  
  constructor(
    public readonly eventId: string,
    public readonly aggregateId: string,
    public readonly occurredAt: Date,
    public readonly version: number,
    public readonly totalAmount: number
  ) {}
}
```

### 2. Event Store

The event store is an append-only database that stores events in streams.

```typescript
// Event store interface
interface EventStore {
  // Append events with optimistic concurrency
  append(
    streamId: string,
    expectedVersion: number,
    events: DomainEvent[]
  ): Promise<void>;

  // Read events from a stream
  readStream(streamId: string): Promise<DomainEvent[]>;
  
  // Read events from a specific version
  readStreamFrom(streamId: string, fromVersion: number): Promise<DomainEvent[]>;
  
  // Read all events (for projections)
  readAll(fromPosition?: number): AsyncIterable<StoredEvent>;
  
  // Subscribe to new events
  subscribe(handler: EventHandler): Subscription;
}

// Stored event with metadata
interface StoredEvent {
  globalPosition: number;
  streamId: string;
  streamVersion: number;
  eventType: string;
  payload: DomainEvent;
  metadata: EventMetadata;
  createdAt: Date;
}

interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  timestamp: Date;
}
```

---

## Event-Sourced Aggregate Pattern

### Base Aggregate Implementation

```typescript
// Base class for event-sourced aggregates
abstract class EventSourcedAggregate<TId> {
  private _id: TId;
  private _version: number = -1;
  private _uncommittedEvents: DomainEvent[] = [];

  get id(): TId {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  get uncommittedEvents(): ReadonlyArray<DomainEvent> {
    return [...this._uncommittedEvents];
  }

  // Apply and record a new event
  protected apply(event: DomainEvent): void {
    this.when(event);
    this._uncommittedEvents.push(event);
  }

  // Reconstitute from history
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.when(event);
      this._version = event.version;
    }
  }

  // Clear uncommitted events after save
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  // Event handler - must be implemented
  protected abstract when(event: DomainEvent): void;

  // Snapshot support
  abstract getSnapshot(): object;
  abstract restoreFromSnapshot(snapshot: object): void;
}
```

### Concrete Aggregate Example

```typescript
class Order extends EventSourcedAggregate<OrderId> {
  private _customerId: CustomerId;
  private _lines: Map<string, OrderLine> = new Map();
  private _status: OrderStatus = OrderStatus.Draft;
  private _totalAmount: Money;

  // Factory for new orders
  static create(customerId: CustomerId, currency: string): Order {
    const order = new Order();
    const event = new OrderCreated(
      crypto.randomUUID(),
      OrderId.generate().value,
      new Date(),
      0,
      customerId.value,
      currency
    );
    order.apply(event);
    return order;
  }

  // Command: Add line
  addLine(productId: ProductId, quantity: Quantity, unitPrice: Money): void {
    this.ensureCanModify();
    
    const event = new OrderLineAdded(
      crypto.randomUUID(),
      this.id.value,
      new Date(),
      this.version + this.uncommittedEvents.length + 1,
      productId.value,
      quantity.value,
      unitPrice.amount
    );
    this.apply(event);
  }

  // Command: Confirm order
  confirm(): void {
    this.ensureCanModify();
    
    if (this._lines.size === 0) {
      throw new DomainError('Cannot confirm empty order');
    }

    const event = new OrderConfirmed(
      crypto.randomUUID(),
      this.id.value,
      new Date(),
      this.version + this.uncommittedEvents.length + 1,
      this._totalAmount.amount
    );
    this.apply(event);
  }

  // Event handlers
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'order.created':
        this.whenOrderCreated(event as OrderCreated);
        break;
      case 'order.line_added':
        this.whenLineAdded(event as OrderLineAdded);
        break;
      case 'order.confirmed':
        this.whenConfirmed(event as OrderConfirmed);
        break;
    }
  }

  private whenOrderCreated(event: OrderCreated): void {
    this._id = OrderId.fromString(event.aggregateId);
    this._customerId = CustomerId.fromString(event.customerId);
    this._status = OrderStatus.Draft;
    this._totalAmount = Money.zero(event.currency);
    this._lines = new Map();
  }

  private whenLineAdded(event: OrderLineAdded): void {
    const line = OrderLine.create({
      productId: ProductId.fromString(event.productId),
      quantity: Quantity.create(event.quantity),
      unitPrice: Money.create(event.unitPrice, this._totalAmount.currency),
    });
    this._lines.set(event.productId, line);
    this.recalculateTotal();
  }

  private whenConfirmed(event: OrderConfirmed): void {
    this._status = OrderStatus.Confirmed;
  }

  private ensureCanModify(): void {
    if (this._status !== OrderStatus.Draft) {
      throw new DomainError(`Cannot modify order in ${this._status} status`);
    }
  }

  private recalculateTotal(): void {
    this._totalAmount = Array.from(this._lines.values())
      .reduce((sum, line) => sum.add(line.subtotal), Money.zero(this._totalAmount.currency));
  }

  // Snapshot
  getSnapshot(): object {
    return {
      customerId: this._customerId.value,
      status: this._status,
      totalAmount: this._totalAmount.amount,
      currency: this._totalAmount.currency,
      lines: Array.from(this._lines.entries()),
    };
  }

  restoreFromSnapshot(snapshot: any): void {
    this._customerId = CustomerId.fromString(snapshot.customerId);
    this._status = snapshot.status;
    this._totalAmount = Money.create(snapshot.totalAmount, snapshot.currency);
    this._lines = new Map(snapshot.lines);
  }
}
```

---

## Event Store Implementation

### PostgreSQL Implementation

```sql
-- Event store schema
CREATE TABLE events (
  global_position BIGSERIAL PRIMARY KEY,
  stream_id VARCHAR(255) NOT NULL,
  stream_version INT NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (stream_id, stream_version)
);

CREATE INDEX idx_events_stream ON events (stream_id, stream_version);
CREATE INDEX idx_events_type ON events (event_type);
CREATE INDEX idx_events_created ON events (created_at);

-- Stream version tracking
CREATE TABLE event_streams (
  stream_id VARCHAR(255) PRIMARY KEY,
  current_version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Snapshots table
CREATE TABLE snapshots (
  stream_id VARCHAR(255) PRIMARY KEY,
  stream_version INT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### TypeScript Implementation

```typescript
class PostgresEventStore implements EventStore {
  constructor(private readonly pool: Pool) {}

  async append(
    streamId: string,
    expectedVersion: number,
    events: DomainEvent[]
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Optimistic concurrency check
      const result = await client.query(
        `SELECT current_version FROM event_streams 
         WHERE stream_id = $1 FOR UPDATE`,
        [streamId]
      );

      const currentVersion = result.rows[0]?.current_version ?? -1;
      
      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(
          `Expected version ${expectedVersion}, but found ${currentVersion}`
        );
      }

      // Insert events
      let version = expectedVersion;
      for (const event of events) {
        version++;
        await client.query(
          `INSERT INTO events 
           (stream_id, stream_version, event_type, payload, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            streamId,
            version,
            event.eventType,
            JSON.stringify(event),
            JSON.stringify({
              correlationId: event.correlationId,
              causationId: event.causationId,
            }),
            event.occurredAt,
          ]
        );
      }

      // Update stream version
      await client.query(
        `INSERT INTO event_streams (stream_id, current_version, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (stream_id) 
         DO UPDATE SET current_version = $2, updated_at = NOW()`,
        [streamId, version]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async readStream(streamId: string): Promise<DomainEvent[]> {
    const result = await this.pool.query(
      `SELECT payload FROM events 
       WHERE stream_id = $1 
       ORDER BY stream_version ASC`,
      [streamId]
    );
    return result.rows.map(row => row.payload as DomainEvent);
  }

  async readStreamFrom(
    streamId: string, 
    fromVersion: number
  ): Promise<DomainEvent[]> {
    const result = await this.pool.query(
      `SELECT payload FROM events 
       WHERE stream_id = $1 AND stream_version > $2
       ORDER BY stream_version ASC`,
      [streamId, fromVersion]
    );
    return result.rows.map(row => row.payload as DomainEvent);
  }

  async *readAll(fromPosition: number = 0): AsyncIterable<StoredEvent> {
    const batchSize = 1000;
    let position = fromPosition;

    while (true) {
      const result = await this.pool.query(
        `SELECT * FROM events 
         WHERE global_position > $1 
         ORDER BY global_position ASC 
         LIMIT $2`,
        [position, batchSize]
      );

      if (result.rows.length === 0) break;

      for (const row of result.rows) {
        yield {
          globalPosition: row.global_position,
          streamId: row.stream_id,
          streamVersion: row.stream_version,
          eventType: row.event_type,
          payload: row.payload,
          metadata: row.metadata,
          createdAt: row.created_at,
        };
        position = row.global_position;
      }

      if (result.rows.length < batchSize) break;
    }
  }
}
```

---

## Snapshotting

For aggregates with long event histories, snapshotting improves load performance.

```typescript
class SnapshotRepository<T extends EventSourcedAggregate<any>> {
  constructor(
    private readonly eventStore: EventStore,
    private readonly snapshotStore: SnapshotStore,
    private readonly snapshotFrequency: number = 100
  ) {}

  async load(
    aggregateId: string, 
    factory: () => T
  ): Promise<T | null> {
    const aggregate = factory();
    
    // Try to load snapshot
    const snapshot = await this.snapshotStore.load(aggregateId);
    let fromVersion = 0;

    if (snapshot) {
      aggregate.restoreFromSnapshot(snapshot.data);
      fromVersion = snapshot.version;
    }

    // Load events after snapshot
    const events = fromVersion > 0
      ? await this.eventStore.readStreamFrom(aggregateId, fromVersion)
      : await this.eventStore.readStream(aggregateId);

    if (events.length === 0 && !snapshot) {
      return null;
    }

    aggregate.loadFromHistory(events);
    return aggregate;
  }

  async save(aggregate: T): Promise<void> {
    const events = aggregate.uncommittedEvents;
    if (events.length === 0) return;

    const expectedVersion = aggregate.version - events.length;
    
    await this.eventStore.append(
      aggregate.id.toString(),
      expectedVersion,
      events
    );

    aggregate.markEventsAsCommitted();

    // Create snapshot if needed
    if (aggregate.version % this.snapshotFrequency === 0) {
      await this.snapshotStore.save({
        aggregateId: aggregate.id.toString(),
        version: aggregate.version,
        data: aggregate.getSnapshot(),
      });
    }
  }
}
```

---

## Event Versioning and Upcasting

### Schema Evolution Strategy

```typescript
// Event versions
interface OrderCreatedV1 {
  eventType: 'order.created';
  eventVersion: 1;
  orderId: string;
  customerId: string;
}

interface OrderCreatedV2 {
  eventType: 'order.created';
  eventVersion: 2;
  orderId: string;
  customerId: string;
  currency: string;  // New field
}

// Upcaster interface
interface EventUpcaster<TFrom, TTo> {
  sourceVersion: number;
  targetVersion: number;
  eventType: string;
  upcast(event: TFrom): TTo;
}

// Concrete upcaster
class OrderCreatedV1ToV2Upcaster 
  implements EventUpcaster<OrderCreatedV1, OrderCreatedV2> {
  
  sourceVersion = 1;
  targetVersion = 2;
  eventType = 'order.created';

  upcast(event: OrderCreatedV1): OrderCreatedV2 {
    return {
      ...event,
      eventVersion: 2,
      currency: 'USD', // Default value for missing field
    };
  }
}

// Upcaster chain
class UpcasterChain {
  private upcasters = new Map<string, EventUpcaster<any, any>[]>();

  register(upcaster: EventUpcaster<any, any>): void {
    const key = `${upcaster.eventType}:${upcaster.sourceVersion}`;
    const existing = this.upcasters.get(key) ?? [];
    this.upcasters.set(key, [...existing, upcaster]);
  }

  upcast(event: any): any {
    let current = event;
    const eventType = current.eventType;
    
    while (true) {
      const version = current.eventVersion ?? 1;
      const key = `${eventType}:${version}`;
      const upcasters = this.upcasters.get(key);
      
      if (!upcasters || upcasters.length === 0) {
        break;
      }
      
      for (const upcaster of upcasters) {
        current = upcaster.upcast(current);
      }
    }
    
    return current;
  }
}
```

---

## Projections

Projections create read-optimized views from events.

### Projection Implementation

```typescript
// Projection interface
interface Projection {
  handle(event: StoredEvent): Promise<void>;
  reset(): Promise<void>;
}

// Order summary projection
class OrderSummaryProjection implements Projection {
  constructor(private readonly db: Database) {}

  async handle(event: StoredEvent): Promise<void> {
    switch (event.eventType) {
      case 'order.created':
        await this.onOrderCreated(event);
        break;
      case 'order.line_added':
        await this.onLineAdded(event);
        break;
      case 'order.confirmed':
        await this.onConfirmed(event);
        break;
    }
  }

  private async onOrderCreated(event: StoredEvent): Promise<void> {
    const payload = event.payload as OrderCreated;
    await this.db.query(
      `INSERT INTO order_summaries 
       (order_id, customer_id, status, total_amount, line_count, created_at)
       VALUES ($1, $2, 'draft', 0, 0, $3)`,
      [payload.aggregateId, payload.customerId, payload.occurredAt]
    );
  }

  private async onLineAdded(event: StoredEvent): Promise<void> {
    const payload = event.payload as OrderLineAdded;
    const lineTotal = payload.quantity * payload.unitPrice;
    
    await this.db.query(
      `UPDATE order_summaries 
       SET total_amount = total_amount + $1, line_count = line_count + 1
       WHERE order_id = $2`,
      [lineTotal, payload.aggregateId]
    );
  }

  private async onConfirmed(event: StoredEvent): Promise<void> {
    const payload = event.payload as OrderConfirmed;
    await this.db.query(
      `UPDATE order_summaries 
       SET status = 'confirmed', confirmed_at = $1
       WHERE order_id = $2`,
      [payload.occurredAt, payload.aggregateId]
    );
  }

  async reset(): Promise<void> {
    await this.db.query('TRUNCATE TABLE order_summaries');
  }
}

// Projection manager
class ProjectionManager {
  constructor(
    private readonly eventStore: EventStore,
    private readonly checkpointStore: CheckpointStore
  ) {}

  async runProjection(
    projection: Projection,
    projectionName: string
  ): Promise<void> {
    const checkpoint = await this.checkpointStore.get(projectionName);
    let lastPosition = checkpoint?.position ?? 0;

    for await (const event of this.eventStore.readAll(lastPosition)) {
      await projection.handle(event);
      lastPosition = event.globalPosition;
      
      // Checkpoint every 100 events
      if (lastPosition % 100 === 0) {
        await this.checkpointStore.save(projectionName, lastPosition);
      }
    }

    await this.checkpointStore.save(projectionName, lastPosition);
  }

  async rebuildProjection(
    projection: Projection,
    projectionName: string
  ): Promise<void> {
    await projection.reset();
    await this.checkpointStore.reset(projectionName);
    await this.runProjection(projection, projectionName);
  }
}
```

---

## Temporal Queries

Event sourcing enables point-in-time queries.

```typescript
class TemporalOrderRepository {
  constructor(private readonly eventStore: EventStore) {}

  // Get order state at a specific point in time
  async getOrderAt(orderId: string, timestamp: Date): Promise<Order | null> {
    const events = await this.eventStore.readStream(`order-${orderId}`);
    
    // Filter events up to timestamp
    const eventsAtTime = events.filter(e => e.occurredAt <= timestamp);
    
    if (eventsAtTime.length === 0) {
      return null;
    }

    const order = new Order();
    order.loadFromHistory(eventsAtTime);
    return order;
  }

  // Get order history
  async getOrderHistory(orderId: string): Promise<OrderStateHistory[]> {
    const events = await this.eventStore.readStream(`order-${orderId}`);
    const history: OrderStateHistory[] = [];
    
    let order: Order | null = null;
    
    for (const event of events) {
      if (!order) {
        order = new Order();
      }
      order.loadFromHistory([event]);
      
      history.push({
        timestamp: event.occurredAt,
        eventType: event.eventType,
        status: order.status,
        totalAmount: order.totalAmount,
      });
    }
    
    return history;
  }
}
```

---

## Best Practices

### Event Design

1. **Events are past tense**: `OrderCreated`, not `CreateOrder`
2. **Events are immutable**: Never modify stored events
3. **Include all relevant data**: Events should be self-contained
4. **Version events**: Include version for schema evolution
5. **Keep events small**: Split large events into multiple smaller ones

### Performance Considerations

1. **Use snapshotting** for aggregates with many events
2. **Batch event reads** when processing projections
3. **Use checkpointing** for projection recovery
4. **Index event streams** for fast lookups
5. **Consider event archiving** for old events

### Common Pitfalls

1. **Don't store derived data** in events
2. **Don't couple events** to specific projections
3. **Don't modify events** - use upcasting instead
4. **Don't ignore concurrency** - use optimistic locking
5. **Don't forget idempotency** in projections

---

## Related Skills

- [domain-modeling.skill.md](domain-modeling.skill.md) - Aggregate design
- [cqrs-patterns.skill.md](cqrs-patterns.skill.md) - CQRS implementation
- [clean-architecture.skill.md](clean-architecture.skill.md) - Layer organization
