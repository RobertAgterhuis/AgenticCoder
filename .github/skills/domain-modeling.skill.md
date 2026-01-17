# Domain Modeling Skill

**Strategic and Tactical Domain-Driven Design**

**Version**: 1.0  
**Category**: Architecture Patterns  
**Complexity**: Advanced

---

## Overview

Domain modeling is the practice of creating a conceptual model of a business domain that captures the essential concepts, relationships, and rules. This skill covers both strategic DDD (bounded contexts, context mapping) and tactical DDD (entities, value objects, aggregates).

---

## Core Concepts

### 1. Ubiquitous Language

The ubiquitous language is a shared vocabulary between developers and domain experts that appears in code, documentation, and conversations.

```typescript
// ❌ Technical naming
class OrderManager {
  processOrderTransaction(data: OrderData) { /* ... */ }
  updateOrderStatus(id: string, status: number) { /* ... */ }
}

// ✅ Domain language
class Order {
  submit() { /* ... */ }
  confirm() { /* ... */ }
  ship(trackingNumber: TrackingNumber) { /* ... */ }
  cancel(reason: CancellationReason) { /* ... */ }
}
```

### 2. Bounded Contexts

A bounded context is a linguistic boundary where a particular domain model applies. The same term can mean different things in different contexts.

```
┌─────────────────────────────────────────────────────────────────┐
│                        E-Commerce System                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Sales Context │  Shipping       │   Billing Context           │
│                 │  Context        │                             │
│  ┌───────────┐  │  ┌───────────┐  │  ┌───────────┐              │
│  │  Product  │  │  │  Package  │  │  │  Invoice  │              │
│  │  - name   │  │  │  - weight │  │  │  - amount │              │
│  │  - price  │  │  │  - dims   │  │  │  - due    │              │
│  │  - sku    │  │  │  - items  │  │  │  - status │              │
│  └───────────┘  │  └───────────┘  │  └───────────┘              │
│                 │                 │                             │
│  ┌───────────┐  │  ┌───────────┐  │  ┌───────────┐              │
│  │  Customer │  │  │  Recipient│  │  │  Payer    │              │
│  │  - name   │  │  │  - name   │  │  │  - name   │              │
│  │  - email  │  │  │  - address│  │  │  - method │              │
│  └───────────┘  │  └───────────┘  │  └───────────┘              │
└─────────────────┴─────────────────┴─────────────────────────────┘

Note: "Customer" in Sales ≠ "Recipient" in Shipping ≠ "Payer" in Billing
```

### 3. Context Mapping Patterns

```typescript
// ═══════════════════════════════════════════════════════════════
// CONFORMIST: Downstream accepts upstream's model
// ═══════════════════════════════════════════════════════════════
// Shipping context conforms to Sales context's Order model
import { Order } from '@sales/models';

class ShippingService {
  createShipment(order: Order) {
    // Use Sales order directly
  }
}

// ═══════════════════════════════════════════════════════════════
// ANTI-CORRUPTION LAYER: Translate external models
// ═══════════════════════════════════════════════════════════════
// Protect our model from external system
class LegacyOrderAdapter {
  constructor(private legacyApi: LegacyOrderAPI) {}

  async getOrder(id: string): Promise<Order> {
    const legacy = await this.legacyApi.fetchOrder(id);
    
    // Translate legacy model to our domain model
    return Order.create({
      id: OrderId.fromString(legacy.ORDER_ID),
      customer: this.translateCustomer(legacy.CUST_DATA),
      lines: legacy.LINE_ITEMS.map(this.translateLine),
      status: this.mapStatus(legacy.ORDER_STATUS_CODE),
    });
  }

  private mapStatus(code: number): OrderStatus {
    const mapping: Record<number, OrderStatus> = {
      0: OrderStatus.Draft,
      1: OrderStatus.Submitted,
      5: OrderStatus.Shipped,
      9: OrderStatus.Cancelled,
    };
    return mapping[code] ?? OrderStatus.Unknown;
  }
}

// ═══════════════════════════════════════════════════════════════
// SHARED KERNEL: Shared code between contexts (use sparingly)
// ═══════════════════════════════════════════════════════════════
// @shared/money.ts - Used by multiple contexts
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}
  
  add(other: Money): Money { /* ... */ }
  subtract(other: Money): Money { /* ... */ }
}

// ═══════════════════════════════════════════════════════════════
// OPEN HOST SERVICE: Published API for other contexts
// ═══════════════════════════════════════════════════════════════
// Sales context publishes events for other contexts
interface OrderPlacedEvent {
  orderId: string;
  customerId: string;
  total: { amount: number; currency: string };
  items: Array<{
    productId: string;
    quantity: number;
    price: { amount: number; currency: string };
  }>;
}
```

---

## Tactical DDD Building Blocks

### 1. Value Objects

Value objects are immutable, compared by value, and have no identity.

```typescript
// ═══════════════════════════════════════════════════════════════
// Value Object Base Class
// ═══════════════════════════════════════════════════════════════
export abstract class ValueObject<T extends object> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(other: ValueObject<T>): boolean {
    if (!other) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }

  protected abstract validate(): void;
}

// ═══════════════════════════════════════════════════════════════
// Email Value Object
// ═══════════════════════════════════════════════════════════════
export class Email extends ValueObject<{ value: string }> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(value: string) {
    super({ value });
    this.validate();
  }

  static create(value: string): Email {
    return new Email(value.toLowerCase().trim());
  }

  protected validate(): void {
    if (!Email.EMAIL_REGEX.test(this.props.value)) {
      throw new InvalidEmailError(this.props.value);
    }
  }

  get value(): string {
    return this.props.value;
  }

  get domain(): string {
    return this.props.value.split('@')[1];
  }

  toString(): string {
    return this.props.value;
  }
}

// ═══════════════════════════════════════════════════════════════
// Money Value Object (with behavior)
// ═══════════════════════════════════════════════════════════════
export class Money extends ValueObject<{ amount: number; currency: string }> {
  private constructor(amount: number, currency: string) {
    super({ amount, currency });
    this.validate();
  }

  static create(amount: number, currency: string): Money {
    return new Money(amount, currency.toUpperCase());
  }

  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }

  protected validate(): void {
    if (this.props.amount < 0) {
      throw new NegativeMoneyError();
    }
    if (!['USD', 'EUR', 'GBP', 'JPY'].includes(this.props.currency)) {
      throw new InvalidCurrencyError(this.props.currency);
    }
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new InsufficientFundsError();
    }
    return Money.create(result, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(
      Math.round(this.amount * factor * 100) / 100,
      this.currency
    );
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }

  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }
}

// ═══════════════════════════════════════════════════════════════
// Address Value Object (composite)
// ═══════════════════════════════════════════════════════════════
interface AddressProps {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props);
    this.validate();
  }

  static create(props: AddressProps): Address {
    return new Address({
      street: props.street.trim(),
      city: props.city.trim(),
      state: props.state.trim().toUpperCase(),
      postalCode: props.postalCode.trim(),
      country: props.country.trim().toUpperCase(),
    });
  }

  protected validate(): void {
    if (!this.props.street || this.props.street.length < 5) {
      throw new InvalidAddressError('Street is required');
    }
    if (!this.props.city) {
      throw new InvalidAddressError('City is required');
    }
    if (!this.props.postalCode) {
      throw new InvalidAddressError('Postal code is required');
    }
  }

  get street(): string { return this.props.street; }
  get city(): string { return this.props.city; }
  get state(): string { return this.props.state; }
  get postalCode(): string { return this.props.postalCode; }
  get country(): string { return this.props.country; }

  format(): string {
    return `${this.street}\n${this.city}, ${this.state} ${this.postalCode}\n${this.country}`;
  }

  toJSON(): AddressProps {
    return { ...this.props };
  }

  static fromJSON(json: AddressProps): Address {
    return Address.create(json);
  }
}
```

### 2. Entities

Entities have identity and lifecycle. They are compared by identity, not attributes.

```typescript
// ═══════════════════════════════════════════════════════════════
// Entity Base Class
// ═══════════════════════════════════════════════════════════════
export abstract class Entity<TId extends UniqueId> {
  protected readonly _id: TId;
  protected _version: number = 0;

  protected constructor(id: TId) {
    this._id = id;
  }

  get id(): TId {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  equals(other?: Entity<TId>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this._id.equals(other._id);
  }
}

// ═══════════════════════════════════════════════════════════════
// Typed ID (value object)
// ═══════════════════════════════════════════════════════════════
export abstract class UniqueId extends ValueObject<{ value: string }> {
  protected constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  equals(other: UniqueId): boolean {
    return this.value === other?.value;
  }

  toString(): string {
    return this.value;
  }

  protected validate(): void {
    if (!this.props.value || this.props.value.trim() === '') {
      throw new InvalidIdError('ID cannot be empty');
    }
  }

  protected static generate(): string {
    return crypto.randomUUID();
  }
}

// Specific ID types for type safety
export class CustomerId extends UniqueId {
  private constructor(value: string) {
    super(value);
    this.validate();
  }

  static create(value?: string): CustomerId {
    return new CustomerId(value ?? UniqueId.generate());
  }

  static fromString(value: string): CustomerId {
    return new CustomerId(value);
  }
}

export class OrderId extends UniqueId {
  private constructor(value: string) {
    super(value);
    this.validate();
  }

  static create(value?: string): OrderId {
    return new OrderId(value ?? UniqueId.generate());
  }

  static fromString(value: string): OrderId {
    return new OrderId(value);
  }
}

// ═══════════════════════════════════════════════════════════════
// Customer Entity
// ═══════════════════════════════════════════════════════════════
interface CustomerProps {
  name: CustomerName;
  email: Email;
  shippingAddresses: Address[];
  defaultShippingAddress?: Address;
  status: CustomerStatus;
  createdAt: Date;
}

export class Customer extends Entity<CustomerId> {
  private props: CustomerProps;

  private constructor(props: CustomerProps, id: CustomerId) {
    super(id);
    this.props = props;
  }

  // Factory method
  static create(name: CustomerName, email: Email): Customer {
    return new Customer(
      {
        name,
        email,
        shippingAddresses: [],
        status: CustomerStatus.Active,
        createdAt: new Date(),
      },
      CustomerId.create()
    );
  }

  // Reconstitution
  static reconstitute(props: CustomerProps, id: CustomerId): Customer {
    return new Customer(props, id);
  }

  // Getters
  get name(): CustomerName { return this.props.name; }
  get email(): Email { return this.props.email; }
  get status(): CustomerStatus { return this.props.status; }
  get shippingAddresses(): ReadonlyArray<Address> {
    return [...this.props.shippingAddresses];
  }
  get defaultShippingAddress(): Address | undefined {
    return this.props.defaultShippingAddress;
  }

  // Behavior
  changeName(newName: CustomerName): void {
    this.props.name = newName;
  }

  changeEmail(newEmail: Email): void {
    this.props.email = newEmail;
  }

  addShippingAddress(address: Address): void {
    // Business rule: max 5 addresses
    if (this.props.shippingAddresses.length >= 5) {
      throw new MaxAddressesExceededError();
    }

    this.props.shippingAddresses.push(address);

    // Set as default if first address
    if (!this.props.defaultShippingAddress) {
      this.props.defaultShippingAddress = address;
    }
  }

  setDefaultShippingAddress(address: Address): void {
    const exists = this.props.shippingAddresses.some(a => a.equals(address));
    if (!exists) {
      throw new AddressNotFoundError();
    }
    this.props.defaultShippingAddress = address;
  }

  deactivate(): void {
    this.props.status = CustomerStatus.Inactive;
  }

  reactivate(): void {
    this.props.status = CustomerStatus.Active;
  }
}
```

### 3. Aggregates

Aggregates are clusters of entities and value objects with a root entity that ensures consistency.

```typescript
// ═══════════════════════════════════════════════════════════════
// Aggregate Root Base Class
// ═══════════════════════════════════════════════════════════════
export abstract class AggregateRoot<TId extends UniqueId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    super(id);
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}

// ═══════════════════════════════════════════════════════════════
// Order Aggregate
// ═══════════════════════════════════════════════════════════════
interface OrderProps {
  customerId: CustomerId;
  lines: OrderLine[];
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
  createdAt: Date;
  submittedAt?: Date;
  shippedAt?: Date;
}

export class Order extends AggregateRoot<OrderId> {
  private props: OrderProps;
  private static readonly MAX_LINES = 100;
  private static readonly MIN_ORDER_VALUE = Money.create(1, 'USD');

  private constructor(props: OrderProps, id: OrderId) {
    super(id);
    this.props = props;
  }

  // ─────────────────────────────────────────────────────────────
  // Factory Methods
  // ─────────────────────────────────────────────────────────────

  static create(customerId: CustomerId, shippingAddress: Address): Order {
    const order = new Order(
      {
        customerId,
        lines: [],
        status: OrderStatus.Draft,
        shippingAddress,
        createdAt: new Date(),
      },
      OrderId.create()
    );

    order.addDomainEvent(
      new OrderCreatedEvent({
        orderId: order.id.value,
        customerId: customerId.value,
        createdAt: order.props.createdAt,
      })
    );

    return order;
  }

  static reconstitute(props: OrderProps, id: OrderId): Order {
    return new Order(props, id);
  }

  // ─────────────────────────────────────────────────────────────
  // Getters (read-only access to internal state)
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

  get total(): Money {
    return this.props.lines.reduce(
      (sum, line) => sum.add(line.subtotal),
      Money.zero('USD')
    );
  }

  get itemCount(): number {
    return this.props.lines.reduce((sum, line) => sum + line.quantity, 0);
  }

  // ─────────────────────────────────────────────────────────────
  // Commands (behavior that enforces invariants)
  // ─────────────────────────────────────────────────────────────

  addLine(productId: ProductId, quantity: number, unitPrice: Money): void {
    this.ensureCanModify();
    this.ensureMaxLinesNotExceeded();

    // Check if product already in order
    const existingLine = this.props.lines.find((l) =>
      l.productId.equals(productId)
    );

    if (existingLine) {
      // Update existing line (inside aggregate boundary)
      existingLine.updateQuantity(existingLine.quantity + quantity);
    } else {
      // Create new line
      const line = OrderLine.create(productId, quantity, unitPrice);
      this.props.lines.push(line);
    }

    this.addDomainEvent(
      new OrderLineAddedEvent({
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
      throw new OrderLineNotFoundError(productId);
    }

    this.props.lines.splice(index, 1);

    this.addDomainEvent(
      new OrderLineRemovedEvent({
        orderId: this.id.value,
        productId: productId.value,
      })
    );
  }

  updateLineQuantity(productId: ProductId, newQuantity: number): void {
    this.ensureCanModify();

    const line = this.props.lines.find((l) => l.productId.equals(productId));

    if (!line) {
      throw new OrderLineNotFoundError(productId);
    }

    if (newQuantity <= 0) {
      this.removeLine(productId);
    } else {
      line.updateQuantity(newQuantity);
    }
  }

  submit(): void {
    this.ensureCanModify();
    this.ensureHasLines();
    this.ensureMinimumOrderValue();

    this.props.status = OrderStatus.Submitted;
    this.props.submittedAt = new Date();

    this.addDomainEvent(
      new OrderSubmittedEvent({
        orderId: this.id.value,
        total: this.total.amount,
        currency: this.total.currency,
        submittedAt: this.props.submittedAt,
      })
    );
  }

  confirm(): void {
    if (this.props.status !== OrderStatus.Submitted) {
      throw new InvalidOrderStateError(
        'Only submitted orders can be confirmed'
      );
    }

    this.props.status = OrderStatus.Confirmed;

    this.addDomainEvent(
      new OrderConfirmedEvent({
        orderId: this.id.value,
        confirmedAt: new Date(),
      })
    );
  }

  ship(trackingNumber: TrackingNumber): void {
    if (this.props.status !== OrderStatus.Confirmed) {
      throw new InvalidOrderStateError('Only confirmed orders can be shipped');
    }

    this.props.status = OrderStatus.Shipped;
    this.props.shippedAt = new Date();

    this.addDomainEvent(
      new OrderShippedEvent({
        orderId: this.id.value,
        trackingNumber: trackingNumber.value,
        shippedAt: this.props.shippedAt,
      })
    );
  }

  cancel(reason: CancellationReason): void {
    if (this.props.status === OrderStatus.Shipped) {
      throw new InvalidOrderStateError('Cannot cancel shipped orders');
    }

    if (this.props.status === OrderStatus.Cancelled) {
      return; // Idempotent
    }

    this.props.status = OrderStatus.Cancelled;

    this.addDomainEvent(
      new OrderCancelledEvent({
        orderId: this.id.value,
        reason: reason.value,
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
      throw new InvalidOrderStateError(
        `Cannot modify order in status: ${this.props.status}`
      );
    }
  }

  private ensureHasLines(): void {
    if (this.props.lines.length === 0) {
      throw new EmptyOrderError();
    }
  }

  private ensureMaxLinesNotExceeded(): void {
    if (this.props.lines.length >= Order.MAX_LINES) {
      throw new MaxLinesExceededError(Order.MAX_LINES);
    }
  }

  private ensureMinimumOrderValue(): void {
    if (this.total.amount < Order.MIN_ORDER_VALUE.amount) {
      throw new MinimumOrderValueError(Order.MIN_ORDER_VALUE);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// OrderLine Entity (inside Order aggregate boundary)
// ═══════════════════════════════════════════════════════════════
export class OrderLine extends Entity<OrderLineId> {
  private _productId: ProductId;
  private _quantity: number;
  private _unitPrice: Money;

  private constructor(
    productId: ProductId,
    quantity: number,
    unitPrice: Money,
    id: OrderLineId
  ) {
    super(id);
    this._productId = productId;
    this._quantity = quantity;
    this._unitPrice = unitPrice;
  }

  static create(
    productId: ProductId,
    quantity: number,
    unitPrice: Money
  ): OrderLine {
    if (quantity <= 0) {
      throw new InvalidQuantityError(quantity);
    }
    return new OrderLine(productId, quantity, unitPrice, OrderLineId.create());
  }

  get productId(): ProductId {
    return this._productId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  get subtotal(): Money {
    return this._unitPrice.multiply(this._quantity);
  }

  // Only aggregate root can call this
  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new InvalidQuantityError(newQuantity);
    }
    this._quantity = newQuantity;
  }
}
```

---

## Domain Services

Domain services contain domain logic that doesn't naturally fit within an entity or value object.

```typescript
// ═══════════════════════════════════════════════════════════════
// Pricing Domain Service
// ═══════════════════════════════════════════════════════════════
export interface IPricingService {
  calculateOrderTotal(order: Order): Promise<OrderPricing>;
  applyDiscount(order: Order, discountCode: string): Promise<Money>;
}

export interface OrderPricing {
  subtotal: Money;
  discount: Money;
  tax: Money;
  shipping: Money;
  total: Money;
}

export class PricingService implements IPricingService {
  constructor(
    private readonly discountRepository: IDiscountRepository,
    private readonly taxService: ITaxService,
    private readonly shippingCalculator: IShippingCalculator
  ) {}

  async calculateOrderTotal(order: Order): Promise<OrderPricing> {
    const subtotal = order.total;
    const tax = await this.taxService.calculate(subtotal, order.shippingAddress);
    const shipping = await this.shippingCalculator.calculate(
      order.lines,
      order.shippingAddress
    );

    return {
      subtotal,
      discount: Money.zero(subtotal.currency),
      tax,
      shipping,
      total: subtotal.add(tax).add(shipping),
    };
  }

  async applyDiscount(order: Order, discountCode: string): Promise<Money> {
    const discount = await this.discountRepository.findByCode(discountCode);

    if (!discount) {
      throw new InvalidDiscountCodeError(discountCode);
    }

    if (discount.isExpired()) {
      throw new DiscountExpiredError(discountCode);
    }

    if (!discount.isApplicableToOrder(order)) {
      throw new DiscountNotApplicableError(discountCode);
    }

    return discount.calculateDiscount(order.total);
  }
}

// ═══════════════════════════════════════════════════════════════
// Inventory Domain Service
// ═══════════════════════════════════════════════════════════════
export interface IInventoryService {
  checkAvailability(productId: ProductId, quantity: number): Promise<boolean>;
  reserve(orderId: OrderId, items: ReservationItem[]): Promise<Reservation>;
  release(reservationId: ReservationId): Promise<void>;
}

export class InventoryService implements IInventoryService {
  constructor(
    private readonly inventoryRepository: IInventoryRepository,
    private readonly reservationRepository: IReservationRepository
  ) {}

  async checkAvailability(
    productId: ProductId,
    quantity: number
  ): Promise<boolean> {
    const inventory = await this.inventoryRepository.findByProductId(productId);

    if (!inventory) return false;

    return inventory.availableQuantity >= quantity;
  }

  async reserve(
    orderId: OrderId,
    items: ReservationItem[]
  ): Promise<Reservation> {
    // Check all items available
    for (const item of items) {
      const available = await this.checkAvailability(
        item.productId,
        item.quantity
      );

      if (!available) {
        throw new InsufficientInventoryError(item.productId, item.quantity);
      }
    }

    // Create reservation
    const reservation = Reservation.create(orderId, items);
    await this.reservationRepository.save(reservation);

    // Update inventory
    for (const item of items) {
      const inventory = await this.inventoryRepository.findByProductId(
        item.productId
      );
      inventory!.reserve(item.quantity);
      await this.inventoryRepository.save(inventory!);
    }

    return reservation;
  }

  async release(reservationId: ReservationId): Promise<void> {
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) return;

    // Release inventory
    for (const item of reservation.items) {
      const inventory = await this.inventoryRepository.findByProductId(
        item.productId
      );
      inventory?.release(item.quantity);
      await this.inventoryRepository.save(inventory!);
    }

    await this.reservationRepository.delete(reservationId);
  }
}
```

---

## Domain Events

Domain events capture something important that happened in the domain.

```typescript
// ═══════════════════════════════════════════════════════════════
// Domain Event Base
// ═══════════════════════════════════════════════════════════════
export abstract class DomainEvent<T = unknown> {
  readonly eventId: string;
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: T;
  correlationId?: string;
  causationId?: string;

  constructor(eventName: string, payload: T) {
    this.eventId = crypto.randomUUID();
    this.eventName = eventName;
    this.occurredAt = new Date();
    this.payload = payload;
  }

  withCorrelation(correlationId: string, causationId?: string): this {
    this.correlationId = correlationId;
    this.causationId = causationId;
    return this;
  }
}

// ═══════════════════════════════════════════════════════════════
// Specific Domain Events
// ═══════════════════════════════════════════════════════════════
interface OrderCreatedPayload {
  orderId: string;
  customerId: string;
  createdAt: Date;
}

export class OrderCreatedEvent extends DomainEvent<OrderCreatedPayload> {
  static readonly EVENT_NAME = 'order.created';

  constructor(payload: OrderCreatedPayload) {
    super(OrderCreatedEvent.EVENT_NAME, payload);
  }
}

interface OrderSubmittedPayload {
  orderId: string;
  total: number;
  currency: string;
  submittedAt: Date;
}

export class OrderSubmittedEvent extends DomainEvent<OrderSubmittedPayload> {
  static readonly EVENT_NAME = 'order.submitted';

  constructor(payload: OrderSubmittedPayload) {
    super(OrderSubmittedEvent.EVENT_NAME, payload);
  }
}

// ═══════════════════════════════════════════════════════════════
// Domain Event Publisher
// ═══════════════════════════════════════════════════════════════
export interface IDomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

export interface IDomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}
```

---

## Anti-Patterns to Avoid

### ❌ Anemic Domain Model

```typescript
// BAD: All logic in services, entities are just data holders
class Order {
  public id: string;
  public status: string;
  public lines: OrderLine[] = [];
}

class OrderService {
  submitOrder(order: Order) {
    if (order.lines.length === 0) {
      throw new Error('No lines');
    }
    order.status = 'submitted'; // Direct mutation!
  }
}
```

### ✅ Rich Domain Model

```typescript
// GOOD: Logic encapsulated in aggregates
class Order extends AggregateRoot<OrderId> {
  private props: OrderProps;

  submit(): void {
    this.ensureHasLines();
    this.props.status = OrderStatus.Submitted;
    this.addDomainEvent(new OrderSubmitted(/* ... */));
  }

  private ensureHasLines(): void {
    if (this.props.lines.length === 0) {
      throw new EmptyOrderError();
    }
  }
}
```

### ❌ Primitive Obsession

```typescript
// BAD: Primitives everywhere
function createCustomer(email: string, phone: string) {
  // No validation, easy to pass wrong values
}

createCustomer('123-456-7890', 'invalid-email'); // Swapped params!
```

### ✅ Value Objects

```typescript
// GOOD: Type-safe value objects
function createCustomer(email: Email, phone: PhoneNumber) {
  // Validated and type-safe
}

createCustomer(Email.create('test@example.com'), PhoneNumber.create('123-456-7890'));
```

---

## Quick Reference

### When to Use Each Building Block

| Building Block | Use When |
|----------------|----------|
| **Value Object** | Immutable, compared by value, no identity needed |
| **Entity** | Has identity, changes over time |
| **Aggregate** | Cluster of entities with consistency rules |
| **Domain Service** | Logic that doesn't belong to any entity |
| **Domain Event** | Something important happened |
| **Repository** | Persistence abstraction for aggregates |

### Aggregate Design Rules

1. **One transaction = One aggregate** (eventual consistency across aggregates)
2. **Reference other aggregates by ID only**
3. **Keep aggregates small** (prefer smaller boundaries)
4. **Protect invariants within aggregate boundary**
5. **Use domain events for cross-aggregate communication**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
