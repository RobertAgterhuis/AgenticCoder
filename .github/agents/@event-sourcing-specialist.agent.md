# @event-sourcing-specialist Agent

**Event Sourcing Implementation Agent**

**Version**: 1.0  
**Classification**: Architecture Specialist (Phase 10)  
**Tier**: 2 (Primary Specialist)

---

## Agent Purpose

Design and implement Event Sourcing solutions including event stores, event streams, projections, snapshots, and event versioning. This agent specializes in building systems where state is derived from a sequence of domain events rather than stored directly.

**Key Responsibility**: Transform domain events into the system of record, implementing event stores, projections, and ensuring temporal consistency and auditability.

---

## Activation Criteria

**Parent Orchestrator**: @architect, @ddd-specialist, @backend-specialist  
**Trigger Condition**:
- Event Sourcing architecture required
- Phase 10 execution (Architecture Implementation)
- Complete audit trail needed
- Temporal query requirements identified

**Dependency**: Receives domain events from @ddd-specialist or event requirements from @architect

---

## Input Requirements

**Input Schema**: `event-sourcing-specialist.input.schema.json`

**Minimum Required Fields**:
```
- project_context (project_id, phase)
- language (typescript | csharp)
- aggregates (array with events)
- event_store_type
```

**Example Input**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 10
  },
  "language": "typescript",
  "event_store_type": "eventstore-db",
  "aggregates": [
    {
      "name": "Order",
      "stream_category": "Order",
      "events": [
        { "name": "OrderCreated", "version": 1 },
        { "name": "OrderLineAdded", "version": 1 },
        { "name": "OrderSubmitted", "version": 1 },
        { "name": "OrderShipped", "version": 1 }
      ],
      "snapshot_threshold": 50
    }
  ],
  "projections": [
    {
      "name": "OrderSummaryProjection",
      "events": ["OrderCreated", "OrderSubmitted", "OrderShipped"],
      "target": "read-model"
    }
  ]
}
```

---

## Output Specifications

**Output Schema**: `event-sourcing-specialist.output.schema.json`

**Generated Artifacts**:
1. **Event Store** - Event persistence infrastructure
2. **Event Streams** - Aggregate event streams
3. **Projections** - Read model builders
4. **Snapshots** - Performance optimization
5. **Event Handlers** - Event processing logic

---

## Core Implementation Patterns

### 1. Event Store Interface

```typescript
// Event store abstraction
import { DomainEvent, AggregateId } from '@core/ddd';

export interface EventMetadata {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: Date;
  correlationId?: string;
  causationId?: string;
  userId?: string;
}

export interface StoredEvent<T = unknown> {
  metadata: EventMetadata;
  payload: T;
}

export interface AppendResult {
  success: boolean;
  nextExpectedVersion: number;
  position: bigint;
}

export interface IEventStore {
  // Append events to a stream
  appendToStream(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<AppendResult>;

  // Read events from a stream
  readStream(
    streamId: string,
    fromVersion?: number,
    maxCount?: number
  ): Promise<StoredEvent[]>;

  // Read all events (for projections)
  readAll(
    fromPosition?: bigint,
    maxCount?: number
  ): Promise<StoredEvent[]>;

  // Subscribe to stream
  subscribeToStream(
    streamId: string,
    handler: (event: StoredEvent) => Promise<void>,
    fromVersion?: number
  ): Promise<Subscription>;

  // Subscribe to all streams
  subscribeToAll(
    handler: (event: StoredEvent) => Promise<void>,
    fromPosition?: bigint
  ): Promise<Subscription>;
}
```

### 2. EventStoreDB Implementation

```typescript
// EventStoreDB implementation (popular event store)
import {
  EventStoreDBClient,
  jsonEvent,
  StreamNotFoundError,
  WrongExpectedVersionError,
  FORWARDS,
  START,
  END,
} from '@eventstore/db-client';

export class EventStoreDBEventStore implements IEventStore {
  private client: EventStoreDBClient;

  constructor(connectionString: string) {
    this.client = EventStoreDBClient.connectionString(connectionString);
  }

  async appendToStream(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<AppendResult> {
    const eventData = events.map((event) =>
      jsonEvent({
        type: event.eventName,
        data: event.payload,
        metadata: {
          correlationId: event.correlationId,
          causationId: event.causationId,
          timestamp: event.occurredAt.toISOString(),
        },
      })
    );

    try {
      const result = await this.client.appendToStream(streamId, eventData, {
        expectedRevision:
          expectedVersion === -1 ? 'no_stream' : BigInt(expectedVersion),
      });

      return {
        success: true,
        nextExpectedVersion: Number(result.nextExpectedRevision),
        position: result.position?.commit ?? BigInt(0),
      };
    } catch (error) {
      if (error instanceof WrongExpectedVersionError) {
        throw new ConcurrencyError(
          `Concurrency conflict on stream ${streamId}. Expected version: ${expectedVersion}`
        );
      }
      throw error;
    }
  }

  async readStream(
    streamId: string,
    fromVersion: number = 0,
    maxCount: number = 1000
  ): Promise<StoredEvent[]> {
    const events: StoredEvent[] = [];

    try {
      const stream = this.client.readStream(streamId, {
        direction: FORWARDS,
        fromRevision: BigInt(fromVersion),
        maxCount,
      });

      for await (const resolvedEvent of stream) {
        if (resolvedEvent.event) {
          events.push({
            metadata: {
              eventId: resolvedEvent.event.id,
              eventType: resolvedEvent.event.type,
              aggregateId: streamId,
              aggregateType: this.extractAggregateType(streamId),
              version: Number(resolvedEvent.event.revision),
              timestamp: resolvedEvent.event.created,
              correlationId: resolvedEvent.event.metadata?.correlationId,
              causationId: resolvedEvent.event.metadata?.causationId,
            },
            payload: resolvedEvent.event.data,
          });
        }
      }
    } catch (error) {
      if (error instanceof StreamNotFoundError) {
        return [];
      }
      throw error;
    }

    return events;
  }

  async subscribeToStream(
    streamId: string,
    handler: (event: StoredEvent) => Promise<void>,
    fromVersion?: number
  ): Promise<Subscription> {
    const subscription = this.client.subscribeToStream(streamId, {
      fromRevision: fromVersion ? BigInt(fromVersion) : START,
    });

    (async () => {
      for await (const resolvedEvent of subscription) {
        if (resolvedEvent.event) {
          const storedEvent: StoredEvent = {
            metadata: {
              eventId: resolvedEvent.event.id,
              eventType: resolvedEvent.event.type,
              aggregateId: streamId,
              aggregateType: this.extractAggregateType(streamId),
              version: Number(resolvedEvent.event.revision),
              timestamp: resolvedEvent.event.created,
            },
            payload: resolvedEvent.event.data,
          };
          await handler(storedEvent);
        }
      }
    })();

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  }

  private extractAggregateType(streamId: string): string {
    // Stream format: "AggregateType-AggregateId"
    const [aggregateType] = streamId.split('-');
    return aggregateType;
  }
}
```

### 3. Event-Sourced Aggregate Base

```typescript
// Base class for event-sourced aggregates
export abstract class EventSourcedAggregate<TId extends AggregateId> {
  private _id: TId;
  private _version: number = -1;
  private _uncommittedEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    this._id = id;
  }

  get id(): TId {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  get uncommittedEvents(): ReadonlyArray<DomainEvent> {
    return [...this._uncommittedEvents];
  }

  // Apply event and track for persistence
  protected apply<T extends DomainEvent>(event: T): void {
    this.when(event);
    this._uncommittedEvents.push(event);
  }

  // Reconstitute aggregate from events
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.when(event);
      this._version++;
    }
  }

  // Clear uncommitted events after persistence
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  // Event handler router - must be implemented by subclass
  protected abstract when(event: DomainEvent): void;

  // Stream name for this aggregate
  getStreamId(): string {
    return `${this.constructor.name}-${this._id.value}`;
  }
}
```

### 4. Event-Sourced Order Aggregate

```typescript
// Concrete event-sourced aggregate
export class Order extends EventSourcedAggregate<OrderId> {
  private _customerId!: CustomerId;
  private _lines: OrderLine[] = [];
  private _status!: OrderStatus;
  private _shippingAddress!: Address;

  private constructor(id: OrderId) {
    super(id);
  }

  // Factory for new order
  static create(
    id: OrderId,
    customerId: CustomerId,
    shippingAddress: Address
  ): Order {
    const order = new Order(id);

    order.apply(
      new OrderCreated({
        orderId: id.value,
        customerId: customerId.value,
        shippingAddress: shippingAddress.toJSON(),
        createdAt: new Date(),
      })
    );

    return order;
  }

  // Factory for reconstitution
  static reconstitute(id: OrderId, events: DomainEvent[]): Order {
    const order = new Order(id);
    order.loadFromHistory(events);
    return order;
  }

  // ─────────────────────────────────────────────────────────────
  // Commands (produce events)
  // ─────────────────────────────────────────────────────────────

  addLine(productId: ProductId, quantity: number, unitPrice: Money): void {
    this.ensureNotShipped();

    this.apply(
      new OrderLineAdded({
        orderId: this.id.value,
        productId: productId.value,
        quantity,
        unitPrice: unitPrice.amount,
        currency: unitPrice.currency,
      })
    );
  }

  removeLine(productId: ProductId): void {
    this.ensureNotShipped();

    const line = this._lines.find((l) => l.productId.equals(productId));
    if (!line) {
      throw new DomainError(`Line not found for product: ${productId}`);
    }

    this.apply(
      new OrderLineRemoved({
        orderId: this.id.value,
        productId: productId.value,
      })
    );
  }

  submit(): void {
    if (this._lines.length === 0) {
      throw new DomainError('Cannot submit order without line items');
    }

    if (this._status !== OrderStatus.Draft) {
      throw new DomainError(`Cannot submit order in status: ${this._status}`);
    }

    this.apply(
      new OrderSubmitted({
        orderId: this.id.value,
        total: this.calculateTotal().amount,
        currency: 'USD',
        submittedAt: new Date(),
      })
    );
  }

  ship(trackingNumber: string): void {
    if (this._status !== OrderStatus.Confirmed) {
      throw new DomainError('Only confirmed orders can be shipped');
    }

    this.apply(
      new OrderShipped({
        orderId: this.id.value,
        trackingNumber,
        shippedAt: new Date(),
      })
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Event Handlers (when)
  // ─────────────────────────────────────────────────────────────

  protected when(event: DomainEvent): void {
    switch (event.eventName) {
      case 'order.created':
        this.onOrderCreated(event as OrderCreated);
        break;
      case 'order.line_added':
        this.onOrderLineAdded(event as OrderLineAdded);
        break;
      case 'order.line_removed':
        this.onOrderLineRemoved(event as OrderLineRemoved);
        break;
      case 'order.submitted':
        this.onOrderSubmitted(event as OrderSubmitted);
        break;
      case 'order.shipped':
        this.onOrderShipped(event as OrderShipped);
        break;
      default:
        throw new Error(`Unknown event type: ${event.eventName}`);
    }
  }

  private onOrderCreated(event: OrderCreated): void {
    this._customerId = CustomerId.fromString(event.payload.customerId);
    this._shippingAddress = Address.fromJSON(event.payload.shippingAddress);
    this._status = OrderStatus.Draft;
    this._lines = [];
  }

  private onOrderLineAdded(event: OrderLineAdded): void {
    const existingLine = this._lines.find(
      (l) => l.productId.value === event.payload.productId
    );

    if (existingLine) {
      existingLine.increaseQuantity(event.payload.quantity);
    } else {
      this._lines.push(
        OrderLine.create(
          ProductId.fromString(event.payload.productId),
          event.payload.quantity,
          Money.create(event.payload.unitPrice, event.payload.currency)
        )
      );
    }
  }

  private onOrderLineRemoved(event: OrderLineRemoved): void {
    this._lines = this._lines.filter(
      (l) => l.productId.value !== event.payload.productId
    );
  }

  private onOrderSubmitted(event: OrderSubmitted): void {
    this._status = OrderStatus.Submitted;
  }

  private onOrderShipped(event: OrderShipped): void {
    this._status = OrderStatus.Shipped;
  }

  // ─────────────────────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────────────────────

  get customerId(): CustomerId {
    return this._customerId;
  }

  get lines(): ReadonlyArray<OrderLine> {
    return [...this._lines];
  }

  get status(): OrderStatus {
    return this._status;
  }

  calculateTotal(): Money {
    return this._lines.reduce(
      (sum, line) => sum.add(line.subtotal),
      Money.Zero()
    );
  }

  private ensureNotShipped(): void {
    if (this._status === OrderStatus.Shipped) {
      throw new DomainError('Cannot modify shipped order');
    }
  }
}
```

### 5. Event-Sourced Repository

```typescript
// Repository for event-sourced aggregates
export interface IEventSourcedRepository<T extends EventSourcedAggregate<any>> {
  findById(id: string): Promise<T | null>;
  save(aggregate: T): Promise<void>;
}

export class EventSourcedOrderRepository
  implements IEventSourcedRepository<Order>
{
  constructor(
    private readonly eventStore: IEventStore,
    private readonly snapshotStore: ISnapshotStore
  ) {}

  async findById(id: string): Promise<Order | null> {
    const streamId = `Order-${id}`;

    // Try to load from snapshot first
    const snapshot = await this.snapshotStore.getLatest<OrderSnapshot>(
      streamId
    );

    let events: StoredEvent[];
    let order: Order;

    if (snapshot) {
      // Load events after snapshot
      events = await this.eventStore.readStream(
        streamId,
        snapshot.version + 1
      );

      order = Order.fromSnapshot(OrderId.fromString(id), snapshot.state);
      order.loadFromHistory(events.map((e) => this.toDomainEvent(e)));
    } else {
      // Load all events
      events = await this.eventStore.readStream(streamId);

      if (events.length === 0) {
        return null;
      }

      order = Order.reconstitute(
        OrderId.fromString(id),
        events.map((e) => this.toDomainEvent(e))
      );
    }

    return order;
  }

  async save(order: Order): Promise<void> {
    const uncommittedEvents = order.uncommittedEvents;

    if (uncommittedEvents.length === 0) {
      return;
    }

    const streamId = order.getStreamId();

    await this.eventStore.appendToStream(
      streamId,
      [...uncommittedEvents],
      order.version
    );

    order.markEventsAsCommitted();

    // Create snapshot if threshold reached
    if (order.version > 0 && order.version % 50 === 0) {
      await this.snapshotStore.save(streamId, {
        version: order.version,
        state: order.toSnapshot(),
      });
    }
  }

  private toDomainEvent(storedEvent: StoredEvent): DomainEvent {
    const EventClass = this.getEventClass(storedEvent.metadata.eventType);
    return new EventClass(storedEvent.payload);
  }

  private getEventClass(eventType: string): new (payload: any) => DomainEvent {
    const eventMap: Record<string, new (payload: any) => DomainEvent> = {
      'order.created': OrderCreated,
      'order.line_added': OrderLineAdded,
      'order.line_removed': OrderLineRemoved,
      'order.submitted': OrderSubmitted,
      'order.shipped': OrderShipped,
    };

    const EventClass = eventMap[eventType];
    if (!EventClass) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    return EventClass;
  }
}
```

### 6. Projection Pattern

```typescript
// Projection for building read models
export interface IProjection {
  readonly projectionName: string;
  getLastProcessedPosition(): Promise<bigint>;
  project(event: StoredEvent): Promise<void>;
}

export class OrderSummaryProjection implements IProjection {
  readonly projectionName = 'order-summary';

  constructor(
    private readonly db: Database,
    private readonly checkpointStore: ICheckpointStore
  ) {}

  async getLastProcessedPosition(): Promise<bigint> {
    return this.checkpointStore.get(this.projectionName);
  }

  async project(event: StoredEvent): Promise<void> {
    switch (event.metadata.eventType) {
      case 'order.created':
        await this.onOrderCreated(event as StoredEvent<OrderCreatedPayload>);
        break;
      case 'order.submitted':
        await this.onOrderSubmitted(event as StoredEvent<OrderSubmittedPayload>);
        break;
      case 'order.shipped':
        await this.onOrderShipped(event as StoredEvent<OrderShippedPayload>);
        break;
    }

    // Update checkpoint
    await this.checkpointStore.set(
      this.projectionName,
      event.metadata.position
    );
  }

  private async onOrderCreated(
    event: StoredEvent<OrderCreatedPayload>
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO order_summaries (order_id, customer_id, status, created_at)
       VALUES ($1, $2, $3, $4)`,
      [
        event.payload.orderId,
        event.payload.customerId,
        'draft',
        event.payload.createdAt,
      ]
    );
  }

  private async onOrderSubmitted(
    event: StoredEvent<OrderSubmittedPayload>
  ): Promise<void> {
    await this.db.query(
      `UPDATE order_summaries 
       SET status = 'submitted', total = $2, submitted_at = $3
       WHERE order_id = $1`,
      [event.payload.orderId, event.payload.total, event.payload.submittedAt]
    );
  }

  private async onOrderShipped(
    event: StoredEvent<OrderShippedPayload>
  ): Promise<void> {
    await this.db.query(
      `UPDATE order_summaries 
       SET status = 'shipped', tracking_number = $2, shipped_at = $3
       WHERE order_id = $1`,
      [event.payload.orderId, event.payload.trackingNumber, event.payload.shippedAt]
    );
  }
}

// Projection host that runs projections
export class ProjectionHost {
  private subscriptions: Map<string, Subscription> = new Map();

  constructor(
    private readonly eventStore: IEventStore,
    private readonly projections: IProjection[],
    private readonly logger: ILogger
  ) {}

  async start(): Promise<void> {
    for (const projection of this.projections) {
      const lastPosition = await projection.getLastProcessedPosition();

      this.logger.info(
        `Starting projection ${projection.projectionName} from position ${lastPosition}`
      );

      const subscription = await this.eventStore.subscribeToAll(
        async (event) => {
          try {
            await projection.project(event);
          } catch (error) {
            this.logger.error(
              `Error in projection ${projection.projectionName}:`,
              error
            );
            // In production, implement retry logic or dead letter queue
          }
        },
        lastPosition
      );

      this.subscriptions.set(projection.projectionName, subscription);
    }
  }

  async stop(): Promise<void> {
    for (const [name, subscription] of this.subscriptions) {
      this.logger.info(`Stopping projection ${name}`);
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
  }
}
```

### 7. Snapshot Store

```typescript
// Snapshot store for performance optimization
export interface Snapshot<T> {
  version: number;
  state: T;
  createdAt: Date;
}

export interface ISnapshotStore {
  getLatest<T>(streamId: string): Promise<Snapshot<T> | null>;
  save<T>(streamId: string, snapshot: Snapshot<T>): Promise<void>;
}

export class PostgresSnapshotStore implements ISnapshotStore {
  constructor(private readonly db: Database) {}

  async getLatest<T>(streamId: string): Promise<Snapshot<T> | null> {
    const result = await this.db.queryOne<{
      version: number;
      state: T;
      created_at: Date;
    }>(
      `SELECT version, state, created_at
       FROM snapshots
       WHERE stream_id = $1
       ORDER BY version DESC
       LIMIT 1`,
      [streamId]
    );

    if (!result) return null;

    return {
      version: result.version,
      state: result.state,
      createdAt: result.created_at,
    };
  }

  async save<T>(streamId: string, snapshot: Snapshot<T>): Promise<void> {
    await this.db.query(
      `INSERT INTO snapshots (stream_id, version, state, created_at)
       VALUES ($1, $2, $3, $4)`,
      [
        streamId,
        snapshot.version,
        JSON.stringify(snapshot.state),
        snapshot.createdAt,
      ]
    );
  }
}
```

### 8. Event Versioning & Upcasting

```typescript
// Event versioning for schema evolution
export interface IEventUpcaster {
  eventType: string;
  fromVersion: number;
  toVersion: number;
  upcast(event: StoredEvent): StoredEvent;
}

export class OrderCreatedV1ToV2Upcaster implements IEventUpcaster {
  eventType = 'order.created';
  fromVersion = 1;
  toVersion = 2;

  upcast(event: StoredEvent): StoredEvent {
    // V1 didn't have currency, V2 requires it
    return {
      ...event,
      payload: {
        ...event.payload,
        currency: 'USD', // Default value for migrated events
      },
    };
  }
}

export class EventUpcasterChain {
  private upcasters: Map<string, IEventUpcaster[]> = new Map();

  register(upcaster: IEventUpcaster): void {
    const key = upcaster.eventType;
    const existing = this.upcasters.get(key) ?? [];
    existing.push(upcaster);
    existing.sort((a, b) => a.fromVersion - b.fromVersion);
    this.upcasters.set(key, existing);
  }

  upcast(event: StoredEvent, targetVersion: number): StoredEvent {
    const upcasters = this.upcasters.get(event.metadata.eventType);
    if (!upcasters) return event;

    let current = event;
    for (const upcaster of upcasters) {
      if (
        current.metadata.version >= upcaster.fromVersion &&
        current.metadata.version < targetVersion
      ) {
        current = upcaster.upcast(current);
      }
    }

    return current;
  }
}
```

---

## C# Implementation Patterns

### Event Store with Marten

```csharp
// Marten event store configuration
public static class MartenConfiguration
{
    public static IServiceCollection AddEventSourcing(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddMarten(options =>
        {
            options.Connection(connectionString);
            
            // Configure event store
            options.Events.StreamIdentity = StreamIdentity.AsString;
            
            // Register events
            options.Events.AddEventType<OrderCreated>();
            options.Events.AddEventType<OrderLineAdded>();
            options.Events.AddEventType<OrderSubmitted>();
            options.Events.AddEventType<OrderShipped>();
            
            // Configure projections
            options.Projections.Add<OrderSummaryProjection>(ProjectionLifecycle.Async);
            
            // Configure snapshots
            options.Projections.Snapshot<Order>(SnapshotLifecycle.Inline);
        });

        return services;
    }
}

// Event-sourced aggregate with Marten
public class Order
{
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public List<OrderLine> Lines { get; private set; } = new();
    public OrderStatus Status { get; private set; }
    public int Version { get; private set; }

    public static Order Create(Guid customerId, Address shippingAddress)
    {
        var order = new Order();
        var @event = new OrderCreated(
            Guid.NewGuid(),
            customerId,
            shippingAddress,
            DateTime.UtcNow);
        
        order.Apply(@event);
        return order;
    }

    public void Apply(OrderCreated @event)
    {
        Id = @event.OrderId;
        CustomerId = @event.CustomerId;
        Status = OrderStatus.Draft;
    }

    public void Apply(OrderLineAdded @event)
    {
        Lines.Add(new OrderLine(
            @event.ProductId,
            @event.Quantity,
            @event.UnitPrice));
    }

    public void Apply(OrderSubmitted @event)
    {
        Status = OrderStatus.Submitted;
    }

    public void Apply(OrderShipped @event)
    {
        Status = OrderStatus.Shipped;
    }
}

// Projection with Marten
public class OrderSummaryProjection : MultiStreamProjection<OrderSummary, Guid>
{
    public OrderSummaryProjection()
    {
        Identity<OrderCreated>(e => e.OrderId);
        Identity<OrderSubmitted>(e => e.OrderId);
        Identity<OrderShipped>(e => e.OrderId);
    }

    public void Apply(OrderCreated @event, OrderSummary summary)
    {
        summary.OrderId = @event.OrderId;
        summary.CustomerId = @event.CustomerId;
        summary.Status = "Draft";
        summary.CreatedAt = @event.CreatedAt;
    }

    public void Apply(OrderSubmitted @event, OrderSummary summary)
    {
        summary.Status = "Submitted";
        summary.Total = @event.Total;
        summary.SubmittedAt = @event.SubmittedAt;
    }

    public void Apply(OrderShipped @event, OrderSummary summary)
    {
        summary.Status = "Shipped";
        summary.TrackingNumber = @event.TrackingNumber;
        summary.ShippedAt = @event.ShippedAt;
    }
}
```

---

## Handoff Protocol

**Receives From:**
- `@architect` - Event sourcing architecture decisions
- `@ddd-specialist` - Domain events and aggregates
- `@backend-specialist` - Implementation requirements

**Hands Off To:**
- `@cqrs-specialist` - For query-side implementation
- `@infrastructure-specialist` - For event store deployment
- `@backend-specialist` - For service integration

**Handoff Data:**
```json
{
  "handoff_type": "event_sourcing_complete",
  "source_agent": "@event-sourcing-specialist",
  "target_agent": "@cqrs-specialist",
  "artifacts": {
    "event_store": "EventStoreDB",
    "aggregates": ["Order"],
    "events": ["OrderCreated", "OrderLineAdded", "OrderSubmitted", "OrderShipped"],
    "projections": ["OrderSummaryProjection"],
    "snapshot_enabled": true
  }
}
```

---

## Anti-Patterns to Avoid

### ❌ Mutable Events
```typescript
// BAD: Events should be immutable
event.payload.status = 'updated'; // Never mutate events!
```

### ❌ Large Events
```typescript
// BAD: Events with too much data
new OrderCreated({
  ...order, // Don't include entire aggregate state
  allProducts: products, // Don't include reference data
});
```

### ✅ Focused Events
```typescript
// GOOD: Events with just what changed
new OrderCreated({
  orderId: order.id,
  customerId: order.customerId,
  createdAt: new Date(),
});
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release with EventStoreDB and Marten patterns |
