# @ddd-specialist Agent

**Domain-Driven Design Implementation Agent**

**Version**: 1.0  
**Classification**: Architecture Specialist (Phase 10)  
**Tier**: 2 (Primary Specialist)

---

## Agent Purpose

Design and implement Domain-Driven Design (DDD) solutions including aggregates, entities, value objects, domain events, bounded contexts, and repositories. This agent specializes in tactical and strategic DDD patterns for TypeScript and C# implementations.

**Key Responsibility**: Transform business requirements into rich domain models with clear boundaries, consistent aggregates, and proper encapsulation of business rules.

---

## Activation Criteria

**Parent Orchestrator**: @architect, @code-architect, @backend-specialist  
**Trigger Condition**:
- Complex domain logic identified
- Phase 10 execution (Domain Modeling)
- DDD implementation required
- Rich domain model needed

**Dependency**: Receives business requirements from @architect or domain specifications from @code-architect

---

## Input Requirements

**Input Schema**: `ddd-specialist.input.schema.json`

**Minimum Required Fields**:
```
- project_context (project_id, phase)
- domain_name
- language (typescript | csharp)
- bounded_contexts (array)
- entities (array)
```

**Example Input**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 10
  },
  "domain_name": "OrderManagement",
  "language": "typescript",
  "bounded_contexts": [
    {
      "name": "Ordering",
      "responsibility": "Handle order lifecycle and fulfillment",
      "entities": ["Order", "OrderLine", "Customer"],
      "value_objects": ["Money", "Address", "OrderStatus"],
      "aggregates": ["OrderAggregate"],
      "domain_events": ["OrderPlaced", "OrderShipped", "OrderCompleted"]
    }
  ],
  "entities": [
    {
      "name": "Order",
      "is_aggregate_root": true,
      "properties": [
        { "name": "id", "type": "OrderId", "value_object": true },
        { "name": "customerId", "type": "CustomerId", "value_object": true },
        { "name": "lines", "type": "OrderLine[]", "entity": true },
        { "name": "status", "type": "OrderStatus", "value_object": true },
        { "name": "total", "type": "Money", "value_object": true }
      ],
      "invariants": [
        "Order must have at least one line item",
        "Total must equal sum of line items",
        "Cannot modify shipped orders"
      ]
    }
  ]
}
```

---

## Output Specifications

**Output Schema**: `ddd-specialist.output.schema.json`

**Generated Artifacts**:
1. **Value Objects** - Immutable domain primitives
2. **Entities** - Objects with identity and lifecycle
3. **Aggregates** - Consistency boundaries
4. **Domain Events** - State change notifications
5. **Repositories** - Persistence abstractions
6. **Domain Services** - Stateless domain logic

---

## Core Implementation Patterns

### 1. Value Object Pattern (TypeScript)

```typescript
// Value objects are immutable and compared by value
import { ValueObject } from '@core/ddd';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  // Factory method with validation
  static create(amount: number, currency: string): Money {
    if (amount < 0) {
      throw new DomainError('Amount cannot be negative');
    }
    if (!['USD', 'EUR', 'GBP'].includes(currency)) {
      throw new DomainError(`Invalid currency: ${currency}`);
    }
    return new Money({ amount, currency });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  // Domain operations
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError('Cannot operate on different currencies');
    }
  }

  // Value comparison
  protected equalsCore(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}
```

### 2. Entity Base Pattern

```typescript
// Entities have identity and lifecycle
import { Entity, UniqueId } from '@core/ddd';

export abstract class Entity<T, ID extends UniqueId> {
  protected readonly _id: ID;
  protected props: T;

  constructor(props: T, id: ID) {
    this._id = id;
    this.props = props;
  }

  get id(): ID {
    return this._id;
  }

  // Identity comparison
  equals(other?: Entity<T, ID>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this._id.equals(other._id);
  }
}

// Typed ID value object
export class OrderId extends UniqueId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): OrderId {
    return new OrderId(value ?? UniqueId.generate());
  }

  static fromString(value: string): OrderId {
    if (!value || value.trim() === '') {
      throw new DomainError('OrderId cannot be empty');
    }
    return new OrderId(value);
  }
}
```

### 3. Aggregate Root Pattern

```typescript
// Aggregate roots enforce consistency boundaries
import { AggregateRoot, DomainEvent } from '@core/ddd';

interface OrderProps {
  customerId: CustomerId;
  lines: OrderLine[];
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: Date;
}

export class Order extends AggregateRoot<OrderProps, OrderId> {
  private constructor(props: OrderProps, id: OrderId) {
    super(props, id);
  }

  // Factory method - enforces invariants at creation
  static create(
    customerId: CustomerId,
    shippingAddress: Address,
    id?: OrderId
  ): Order {
    const order = new Order(
      {
        customerId,
        lines: [],
        status: OrderStatus.Draft,
        shippingAddress,
        createdAt: new Date(),
      },
      id ?? OrderId.create()
    );

    // Raise domain event
    order.addDomainEvent(
      new OrderCreated({
        orderId: order.id.value,
        customerId: customerId.value,
        createdAt: order.props.createdAt,
      })
    );

    return order;
  }

  // Reconstitution from persistence (no events raised)
  static reconstitute(props: OrderProps, id: OrderId): Order {
    return new Order(props, id);
  }

  // ─────────────────────────────────────────────────────────────
  // Getters (expose read-only views)
  // ─────────────────────────────────────────────────────────────

  get customerId(): CustomerId {
    return this.props.customerId;
  }

  get lines(): ReadonlyArray<OrderLine> {
    return [...this.props.lines];
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get shippingAddress(): Address {
    return this.props.shippingAddress;
  }

  get total(): Money {
    return this.props.lines.reduce(
      (sum, line) => sum.add(line.subtotal),
      Money.create(0, 'USD')
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Domain Operations (business logic with invariant enforcement)
  // ─────────────────────────────────────────────────────────────

  addLine(productId: ProductId, quantity: number, unitPrice: Money): void {
    this.ensureCanModify();

    // Check for existing line
    const existingLine = this.props.lines.find((l) =>
      l.productId.equals(productId)
    );

    if (existingLine) {
      existingLine.increaseQuantity(quantity);
    } else {
      const line = OrderLine.create(productId, quantity, unitPrice);
      this.props.lines.push(line);
    }

    this.addDomainEvent(
      new OrderLineAdded({
        orderId: this.id.value,
        productId: productId.value,
        quantity,
        unitPrice: unitPrice.amount,
      })
    );
  }

  removeLine(productId: ProductId): void {
    this.ensureCanModify();

    const index = this.props.lines.findIndex((l) =>
      l.productId.equals(productId)
    );

    if (index === -1) {
      throw new DomainError(`Order line not found for product: ${productId}`);
    }

    this.props.lines.splice(index, 1);

    this.addDomainEvent(
      new OrderLineRemoved({
        orderId: this.id.value,
        productId: productId.value,
      })
    );
  }

  submit(): void {
    this.ensureCanModify();

    // Invariant: Order must have at least one line
    if (this.props.lines.length === 0) {
      throw new DomainError('Cannot submit order without line items');
    }

    this.props.status = OrderStatus.Submitted;

    this.addDomainEvent(
      new OrderSubmitted({
        orderId: this.id.value,
        total: this.total.amount,
        currency: this.total.currency,
        submittedAt: new Date(),
      })
    );
  }

  confirm(): void {
    if (this.props.status !== OrderStatus.Submitted) {
      throw new DomainError('Only submitted orders can be confirmed');
    }

    this.props.status = OrderStatus.Confirmed;

    this.addDomainEvent(
      new OrderConfirmed({
        orderId: this.id.value,
        confirmedAt: new Date(),
      })
    );
  }

  ship(trackingNumber: string): void {
    if (this.props.status !== OrderStatus.Confirmed) {
      throw new DomainError('Only confirmed orders can be shipped');
    }

    this.props.status = OrderStatus.Shipped;

    this.addDomainEvent(
      new OrderShipped({
        orderId: this.id.value,
        trackingNumber,
        shippedAt: new Date(),
      })
    );
  }

  cancel(reason: string): void {
    if (this.props.status === OrderStatus.Shipped) {
      throw new DomainError('Cannot cancel shipped orders');
    }

    if (this.props.status === OrderStatus.Cancelled) {
      throw new DomainError('Order is already cancelled');
    }

    this.props.status = OrderStatus.Cancelled;

    this.addDomainEvent(
      new OrderCancelled({
        orderId: this.id.value,
        reason,
        cancelledAt: new Date(),
      })
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Invariant Guards
  // ─────────────────────────────────────────────────────────────

  private ensureCanModify(): void {
    if (
      this.props.status !== OrderStatus.Draft &&
      this.props.status !== OrderStatus.Submitted
    ) {
      throw new DomainError(
        `Cannot modify order in status: ${this.props.status}`
      );
    }
  }
}
```

### 4. Domain Event Pattern

```typescript
// Domain events capture state changes
import { DomainEvent } from '@core/ddd';

interface OrderPlacedPayload {
  orderId: string;
  customerId: string;
  total: number;
  currency: string;
  placedAt: Date;
}

export class OrderPlaced extends DomainEvent<OrderPlacedPayload> {
  static readonly EVENT_NAME = 'order.placed';

  constructor(payload: OrderPlacedPayload) {
    super(OrderPlaced.EVENT_NAME, payload);
  }

  get orderId(): string {
    return this.payload.orderId;
  }

  get customerId(): string {
    return this.payload.customerId;
  }

  get total(): number {
    return this.payload.total;
  }
}

// Domain Event Base Class
export abstract class DomainEvent<T = unknown> {
  readonly eventId: string;
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: T;

  constructor(eventName: string, payload: T) {
    this.eventId = crypto.randomUUID();
    this.eventName = eventName;
    this.occurredAt = new Date();
    this.payload = payload;
  }

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      payload: this.payload,
    };
  }
}
```

### 5. Repository Pattern

```typescript
// Repository abstraction for aggregate persistence
export interface IOrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  findByCustomerId(customerId: CustomerId): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(id: OrderId): Promise<void>;
}

// Concrete implementation
export class OrderRepository implements IOrderRepository {
  constructor(
    private readonly db: Database,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async findById(id: OrderId): Promise<Order | null> {
    const data = await this.db.query<OrderData>(
      `SELECT * FROM orders WHERE id = $1`,
      [id.value]
    );

    if (!data) return null;

    const lines = await this.db.query<OrderLineData[]>(
      `SELECT * FROM order_lines WHERE order_id = $1`,
      [id.value]
    );

    return this.toDomain(data, lines);
  }

  async findByCustomerId(customerId: CustomerId): Promise<Order[]> {
    const orders = await this.db.query<OrderData[]>(
      `SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId.value]
    );

    return Promise.all(
      orders.map(async (order) => {
        const lines = await this.db.query<OrderLineData[]>(
          `SELECT * FROM order_lines WHERE order_id = $1`,
          [order.id]
        );
        return this.toDomain(order, lines);
      })
    );
  }

  async save(order: Order): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Upsert order
      await tx.query(
        `INSERT INTO orders (id, customer_id, status, shipping_address, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           shipping_address = EXCLUDED.shipping_address`,
        [
          order.id.value,
          order.customerId.value,
          order.status.value,
          JSON.stringify(order.shippingAddress),
          order.props.createdAt,
        ]
      );

      // Replace order lines
      await tx.query(`DELETE FROM order_lines WHERE order_id = $1`, [
        order.id.value,
      ]);

      for (const line of order.lines) {
        await tx.query(
          `INSERT INTO order_lines (id, order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            line.id.value,
            order.id.value,
            line.productId.value,
            line.quantity,
            line.unitPrice.amount,
          ]
        );
      }
    });

    // Publish domain events after successful persistence
    const events = order.pullDomainEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }

  async delete(id: OrderId): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.query(`DELETE FROM order_lines WHERE order_id = $1`, [id.value]);
      await tx.query(`DELETE FROM orders WHERE id = $1`, [id.value]);
    });
  }

  private toDomain(data: OrderData, lines: OrderLineData[]): Order {
    return Order.reconstitute(
      {
        customerId: CustomerId.fromString(data.customer_id),
        lines: lines.map((l) =>
          OrderLine.reconstitute(
            {
              productId: ProductId.fromString(l.product_id),
              quantity: l.quantity,
              unitPrice: Money.create(l.unit_price, 'USD'),
            },
            OrderLineId.fromString(l.id)
          )
        ),
        status: OrderStatus.fromString(data.status),
        shippingAddress: Address.fromJSON(data.shipping_address),
        createdAt: data.created_at,
      },
      OrderId.fromString(data.id)
    );
  }
}
```

### 6. Domain Service Pattern

```typescript
// Domain services for operations spanning multiple aggregates
export interface IOrderPricingService {
  calculateOrderTotal(order: Order): Promise<Money>;
  applyDiscount(order: Order, discountCode: string): Promise<Money>;
}

export class OrderPricingService implements IOrderPricingService {
  constructor(
    private readonly discountRepository: IDiscountRepository,
    private readonly taxService: ITaxService
  ) {}

  async calculateOrderTotal(order: Order): Promise<Money> {
    const subtotal = order.total;
    const tax = await this.taxService.calculateTax(
      subtotal,
      order.shippingAddress
    );
    return subtotal.add(tax);
  }

  async applyDiscount(order: Order, discountCode: string): Promise<Money> {
    const discount = await this.discountRepository.findByCode(discountCode);

    if (!discount) {
      throw new DomainError(`Invalid discount code: ${discountCode}`);
    }

    if (discount.isExpired()) {
      throw new DomainError('Discount code has expired');
    }

    if (!discount.isApplicable(order)) {
      throw new DomainError('Discount is not applicable to this order');
    }

    return discount.apply(order.total);
  }
}
```

---

## C# Implementation Patterns

### 1. Value Object (C#)

```csharp
// Value object with record for immutability
public sealed record Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    private Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    public static Money Create(decimal amount, string currency)
    {
        if (amount < 0)
            throw new DomainException("Amount cannot be negative");
        
        if (string.IsNullOrWhiteSpace(currency))
            throw new DomainException("Currency is required");

        return new Money(amount, currency.ToUpperInvariant());
    }

    public static Money Zero(string currency = "USD") => new(0, currency);

    public Money Add(Money other)
    {
        EnsureSameCurrency(other);
        return new Money(Amount + other.Amount, Currency);
    }

    public Money Subtract(Money other)
    {
        EnsureSameCurrency(other);
        return new Money(Amount - other.Amount, Currency);
    }

    public Money Multiply(decimal factor) => new(Amount * factor, Currency);

    private void EnsureSameCurrency(Money other)
    {
        if (Currency != other.Currency)
            throw new DomainException("Cannot operate on different currencies");
    }

    public override string ToString() => $"{Currency} {Amount:F2}";
}
```

### 2. Aggregate Root (C#)

```csharp
public sealed class Order : AggregateRoot<OrderId>
{
    private readonly List<OrderLine> _lines = new();
    
    public CustomerId CustomerId { get; private set; }
    public IReadOnlyCollection<OrderLine> Lines => _lines.AsReadOnly();
    public OrderStatus Status { get; private set; }
    public Address ShippingAddress { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public Money Total => _lines
        .Select(l => l.Subtotal)
        .Aggregate(Money.Zero(), (acc, m) => acc.Add(m));

    private Order() { } // EF Core

    private Order(OrderId id, CustomerId customerId, Address shippingAddress)
        : base(id)
    {
        CustomerId = customerId;
        ShippingAddress = shippingAddress;
        Status = OrderStatus.Draft;
        CreatedAt = DateTime.UtcNow;
    }

    public static Order Create(CustomerId customerId, Address shippingAddress)
    {
        var order = new Order(OrderId.CreateUnique(), customerId, shippingAddress);
        
        order.AddDomainEvent(new OrderCreatedEvent(
            order.Id,
            customerId,
            order.CreatedAt));

        return order;
    }

    public void AddLine(ProductId productId, int quantity, Money unitPrice)
    {
        EnsureCanModify();

        var existingLine = _lines.FirstOrDefault(l => l.ProductId == productId);

        if (existingLine is not null)
        {
            existingLine.IncreaseQuantity(quantity);
        }
        else
        {
            var line = OrderLine.Create(productId, quantity, unitPrice);
            _lines.Add(line);
        }

        AddDomainEvent(new OrderLineAddedEvent(Id, productId, quantity, unitPrice));
    }

    public void RemoveLine(ProductId productId)
    {
        EnsureCanModify();

        var line = _lines.FirstOrDefault(l => l.ProductId == productId)
            ?? throw new DomainException($"Line not found for product: {productId}");

        _lines.Remove(line);

        AddDomainEvent(new OrderLineRemovedEvent(Id, productId));
    }

    public void Submit()
    {
        EnsureCanModify();

        if (_lines.Count == 0)
            throw new DomainException("Cannot submit order without line items");

        Status = OrderStatus.Submitted;

        AddDomainEvent(new OrderSubmittedEvent(Id, Total, DateTime.UtcNow));
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Submitted)
            throw new DomainException("Only submitted orders can be confirmed");

        Status = OrderStatus.Confirmed;

        AddDomainEvent(new OrderConfirmedEvent(Id, DateTime.UtcNow));
    }

    public void Ship(string trackingNumber)
    {
        if (Status != OrderStatus.Confirmed)
            throw new DomainException("Only confirmed orders can be shipped");

        Status = OrderStatus.Shipped;

        AddDomainEvent(new OrderShippedEvent(Id, trackingNumber, DateTime.UtcNow));
    }

    public void Cancel(string reason)
    {
        if (Status == OrderStatus.Shipped)
            throw new DomainException("Cannot cancel shipped orders");

        Status = OrderStatus.Cancelled;

        AddDomainEvent(new OrderCancelledEvent(Id, reason, DateTime.UtcNow));
    }

    private void EnsureCanModify()
    {
        if (Status is not (OrderStatus.Draft or OrderStatus.Submitted))
            throw new DomainException($"Cannot modify order in status: {Status}");
    }
}
```

### 3. Domain Event Dispatcher (C#)

```csharp
public interface IDomainEventDispatcher
{
    Task DispatchAsync<TEvent>(TEvent domainEvent, CancellationToken ct = default)
        where TEvent : IDomainEvent;
    
    Task DispatchAllAsync(IEnumerable<IDomainEvent> events, CancellationToken ct = default);
}

public class DomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DomainEventDispatcher> _logger;

    public DomainEventDispatcher(
        IServiceProvider serviceProvider,
        ILogger<DomainEventDispatcher> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task DispatchAsync<TEvent>(TEvent domainEvent, CancellationToken ct = default)
        where TEvent : IDomainEvent
    {
        _logger.LogDebug("Dispatching domain event: {EventType}", typeof(TEvent).Name);

        var handlers = _serviceProvider.GetServices<IDomainEventHandler<TEvent>>();

        foreach (var handler in handlers)
        {
            try
            {
                await handler.HandleAsync(domainEvent, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling domain event {EventType} in {HandlerType}",
                    typeof(TEvent).Name, handler.GetType().Name);
                throw;
            }
        }
    }

    public async Task DispatchAllAsync(IEnumerable<IDomainEvent> events, CancellationToken ct = default)
    {
        foreach (var domainEvent in events)
        {
            var eventType = domainEvent.GetType();
            var dispatchMethod = GetType()
                .GetMethod(nameof(DispatchAsync))!
                .MakeGenericMethod(eventType);

            await (Task)dispatchMethod.Invoke(this, new object[] { domainEvent, ct })!;
        }
    }
}
```

---

## Bounded Context Integration

### Context Mapping

```typescript
// Anti-Corruption Layer for integrating with external bounded contexts
export class CustomerAntiCorruptionLayer {
  constructor(private readonly externalCustomerService: IExternalCustomerAPI) {}

  async translateToOrderingCustomer(
    externalId: string
  ): Promise<OrderingCustomer> {
    const externalCustomer =
      await this.externalCustomerService.getCustomer(externalId);

    // Translate external model to our bounded context model
    return OrderingCustomer.create({
      id: CustomerId.create(externalCustomer.customerId),
      name: CustomerName.create(
        externalCustomer.firstName,
        externalCustomer.lastName
      ),
      email: Email.create(externalCustomer.emailAddress),
      shippingAddress: this.translateAddress(externalCustomer.defaultAddress),
    });
  }

  private translateAddress(external: ExternalAddress): Address {
    return Address.create({
      street: external.addressLine1,
      city: external.city,
      state: external.stateOrProvince,
      postalCode: external.zipCode,
      country: external.countryCode,
    });
  }
}
```

### Shared Kernel

```typescript
// Shared kernel - types shared across bounded contexts
// Keep this minimal to reduce coupling

export interface SharedCustomerId {
  readonly value: string;
}

export interface SharedOrderReference {
  readonly orderId: string;
  readonly orderNumber: string;
}

export interface SharedMoney {
  readonly amount: number;
  readonly currency: string;
}
```

---

## Application Service Pattern

```typescript
// Application service orchestrates use cases
export class PlaceOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly inventoryService: IInventoryService,
    private readonly pricingService: IOrderPricingService,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(command: PlaceOrderCommand): Promise<PlaceOrderResult> {
    // Validate customer exists
    const customer = await this.customerRepository.findById(
      CustomerId.fromString(command.customerId)
    );

    if (!customer) {
      throw new ApplicationError(`Customer not found: ${command.customerId}`);
    }

    // Create order aggregate
    const order = Order.create(
      customer.id,
      Address.create(command.shippingAddress)
    );

    // Add line items
    for (const item of command.items) {
      // Check inventory
      const available = await this.inventoryService.checkAvailability(
        ProductId.fromString(item.productId),
        item.quantity
      );

      if (!available) {
        throw new ApplicationError(
          `Insufficient inventory for product: ${item.productId}`
        );
      }

      order.addLine(
        ProductId.fromString(item.productId),
        item.quantity,
        Money.create(item.unitPrice, command.currency)
      );
    }

    // Submit order
    order.submit();

    // Reserve inventory
    await this.inventoryService.reserveItems(
      order.id,
      command.items.map((i) => ({
        productId: ProductId.fromString(i.productId),
        quantity: i.quantity,
      }))
    );

    // Persist
    await this.orderRepository.save(order);
    await this.unitOfWork.commit();

    return {
      orderId: order.id.value,
      orderNumber: order.orderNumber,
      total: order.total.amount,
      currency: order.total.currency,
    };
  }
}
```

---

## Testing Patterns

### Domain Model Testing

```typescript
describe('Order Aggregate', () => {
  describe('create', () => {
    it('should create order with draft status', () => {
      const order = Order.create(
        CustomerId.create('cust-1'),
        Address.create({
          street: '123 Main St',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'US',
        })
      );

      expect(order.status).toEqual(OrderStatus.Draft);
      expect(order.lines).toHaveLength(0);
    });

    it('should raise OrderCreated domain event', () => {
      const order = Order.create(
        CustomerId.create('cust-1'),
        Address.create({ /* ... */ })
      );

      const events = order.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderCreated);
    });
  });

  describe('addLine', () => {
    it('should add line item to order', () => {
      const order = createTestOrder();

      order.addLine(
        ProductId.create('prod-1'),
        2,
        Money.create(10.00, 'USD')
      );

      expect(order.lines).toHaveLength(1);
      expect(order.total.amount).toBe(20.00);
    });

    it('should increase quantity for existing product', () => {
      const order = createTestOrder();
      const productId = ProductId.create('prod-1');

      order.addLine(productId, 2, Money.create(10.00, 'USD'));
      order.addLine(productId, 3, Money.create(10.00, 'USD'));

      expect(order.lines).toHaveLength(1);
      expect(order.lines[0].quantity).toBe(5);
    });

    it('should throw when order is shipped', () => {
      const order = createShippedOrder();

      expect(() =>
        order.addLine(ProductId.create('prod-1'), 1, Money.create(10.00, 'USD'))
      ).toThrow('Cannot modify order in status: Shipped');
    });
  });

  describe('submit', () => {
    it('should change status to submitted', () => {
      const order = createTestOrder();
      order.addLine(ProductId.create('prod-1'), 1, Money.create(10.00, 'USD'));

      order.submit();

      expect(order.status).toEqual(OrderStatus.Submitted);
    });

    it('should throw when no line items', () => {
      const order = createTestOrder();

      expect(() => order.submit()).toThrow(
        'Cannot submit order without line items'
      );
    });
  });
});
```

---

## Handoff Protocol

**Receives From:**
- `@architect` - Strategic domain design
- `@code-architect` - Technical domain specifications
- `@backend-specialist` - Domain implementation requests

**Hands Off To:**
- `@event-sourcing-specialist` - When event sourcing is required
- `@cqrs-specialist` - When CQRS pattern is needed
- `@backend-specialist` - For infrastructure implementation

**Handoff Data:**
```json
{
  "handoff_type": "domain_model_complete",
  "source_agent": "@ddd-specialist",
  "target_agent": "@backend-specialist",
  "artifacts": {
    "value_objects": ["Money", "Address", "OrderId", "CustomerId"],
    "entities": ["Order", "OrderLine"],
    "aggregates": ["OrderAggregate"],
    "domain_events": ["OrderCreated", "OrderSubmitted", "OrderShipped"],
    "repositories": ["IOrderRepository"],
    "domain_services": ["OrderPricingService"]
  },
  "bounded_context": "Ordering",
  "context_map": {
    "upstream": ["Identity", "Catalog"],
    "downstream": ["Fulfillment", "Notifications"]
  }
}
```

---

## Anti-Patterns to Avoid

### ❌ Anemic Domain Model
```typescript
// BAD: Logic outside the entity
class OrderService {
  submitOrder(order: Order) {
    if (order.lines.length === 0) throw new Error('No items');
    order.status = 'submitted'; // Direct mutation!
  }
}
```

### ✅ Rich Domain Model
```typescript
// GOOD: Logic inside the aggregate
class Order extends AggregateRoot {
  submit(): void {
    if (this.lines.length === 0) {
      throw new DomainError('Cannot submit order without items');
    }
    this.props.status = OrderStatus.Submitted;
    this.addDomainEvent(new OrderSubmitted(/*...*/));
  }
}
```

### ❌ Exposing Internal State
```typescript
// BAD: Returning mutable collections
get lines(): OrderLine[] {
  return this.props.lines; // Can be mutated externally!
}
```

### ✅ Protecting Invariants
```typescript
// GOOD: Return immutable view
get lines(): ReadonlyArray<OrderLine> {
  return [...this.props.lines];
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release with TypeScript and C# patterns |
