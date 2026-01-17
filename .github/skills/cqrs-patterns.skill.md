# CQRS Patterns Skill

**Command Query Responsibility Segregation**

**Version**: 1.0  
**Category**: Architecture Patterns  
**Complexity**: Advanced

---

## Overview

CQRS (Command Query Responsibility Segregation) is an architectural pattern that separates read and write operations into different models. This enables independent scaling, optimization, and evolution of the read and write sides of an application.

---

## Core Concepts

### 1. Command Side (Write Model)

Commands represent intentions to change state. They are validated, processed, and may result in domain events.

```typescript
// Command interface
interface Command {
  readonly commandType: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
}

// Concrete commands
class CreateOrderCommand implements Command {
  readonly commandType = 'CreateOrder';
  readonly timestamp = new Date();
  
  constructor(
    public readonly customerId: string,
    public readonly currency: string,
    public readonly correlationId?: string
  ) {}
}

class AddOrderLineCommand implements Command {
  readonly commandType = 'AddOrderLine';
  readonly timestamp = new Date();
  
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly correlationId?: string
  ) {}
}

class ConfirmOrderCommand implements Command {
  readonly commandType = 'ConfirmOrder';
  readonly timestamp = new Date();
  
  constructor(
    public readonly orderId: string,
    public readonly correlationId?: string
  ) {}
}
```

### 2. Query Side (Read Model)

Queries retrieve data without modifying state. Read models are optimized for specific query patterns.

```typescript
// Query interface
interface Query<TResult> {
  readonly queryType: string;
}

// Concrete queries
class GetOrderByIdQuery implements Query<OrderDto | null> {
  readonly queryType = 'GetOrderById';
  
  constructor(public readonly orderId: string) {}
}

class GetOrdersByCustomerQuery implements Query<OrderSummaryDto[]> {
  readonly queryType = 'GetOrdersByCustomer';
  
  constructor(
    public readonly customerId: string,
    public readonly pageSize: number = 10,
    public readonly pageNumber: number = 1
  ) {}
}

class GetPendingOrdersQuery implements Query<OrderSummaryDto[]> {
  readonly queryType = 'GetPendingOrders';
  
  constructor(
    public readonly limit: number = 100
  ) {}
}
```

---

## Command Handling

### Command Handler Pattern

```typescript
// Command handler interface
interface CommandHandler<TCommand extends Command, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

// Create order handler
class CreateOrderHandler implements CommandHandler<CreateOrderCommand, string> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async handle(command: CreateOrderCommand): Promise<string> {
    // Create domain aggregate
    const order = Order.create(
      CustomerId.fromString(command.customerId),
      command.currency
    );

    // Persist
    await this.orderRepository.save(order);

    // Publish events
    await this.eventPublisher.publishAll(order.uncommittedEvents);
    order.markEventsAsCommitted();

    return order.id.value;
  }
}

// Add line handler
class AddOrderLineHandler implements CommandHandler<AddOrderLineCommand> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productService: ProductService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async handle(command: AddOrderLineCommand): Promise<void> {
    // Load aggregate
    const order = await this.orderRepository.findById(
      OrderId.fromString(command.orderId)
    );

    if (!order) {
      throw new OrderNotFoundError(command.orderId);
    }

    // Get product info
    const product = await this.productService.getById(command.productId);
    if (!product) {
      throw new ProductNotFoundError(command.productId);
    }

    // Execute business logic
    order.addLine(
      ProductId.fromString(command.productId),
      Quantity.create(command.quantity),
      product.price
    );

    // Persist
    await this.orderRepository.save(order);

    // Publish events
    await this.eventPublisher.publishAll(order.uncommittedEvents);
    order.markEventsAsCommitted();
  }
}
```

### Command Dispatcher

```typescript
class CommandDispatcher {
  private handlers = new Map<string, CommandHandler<Command, any>>();

  register<TCommand extends Command, TResult>(
    commandType: string,
    handler: CommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandType, handler as CommandHandler<Command, any>);
  }

  async dispatch<TResult>(command: Command): Promise<TResult> {
    const handler = this.handlers.get(command.commandType);
    
    if (!handler) {
      throw new UnknownCommandError(command.commandType);
    }

    return handler.handle(command);
  }
}

// Usage
const dispatcher = new CommandDispatcher();
dispatcher.register('CreateOrder', new CreateOrderHandler(/* deps */));
dispatcher.register('AddOrderLine', new AddOrderLineHandler(/* deps */));

const orderId = await dispatcher.dispatch<string>(
  new CreateOrderCommand('customer-123', 'USD')
);
```

---

## Query Handling

### Read Models

```typescript
// Read model DTOs
interface OrderDto {
  orderId: string;
  customerId: string;
  customerName: string;
  status: string;
  lines: OrderLineDto[];
  totalAmount: number;
  currency: string;
  createdAt: Date;
  confirmedAt?: Date;
}

interface OrderLineDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderSummaryDto {
  orderId: string;
  customerName: string;
  status: string;
  totalAmount: number;
  lineCount: number;
  createdAt: Date;
}
```

### Query Handler Pattern

```typescript
// Query handler interface
interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

// Get order by ID handler
class GetOrderByIdHandler 
  implements QueryHandler<GetOrderByIdQuery, OrderDto | null> {
  
  constructor(private readonly db: Database) {}

  async handle(query: GetOrderByIdQuery): Promise<OrderDto | null> {
    const result = await this.db.query(
      `SELECT 
         o.id as order_id,
         o.customer_id,
         c.name as customer_name,
         o.status,
         o.total_amount,
         o.currency,
         o.created_at,
         o.confirmed_at,
         json_agg(json_build_object(
           'productId', ol.product_id,
           'productName', p.name,
           'quantity', ol.quantity,
           'unitPrice', ol.unit_price,
           'subtotal', ol.quantity * ol.unit_price
         )) as lines
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_lines ol ON ol.order_id = o.id
       LEFT JOIN products p ON p.id = ol.product_id
       WHERE o.id = $1
       GROUP BY o.id, c.name`,
      [query.orderId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToDto(result.rows[0]);
  }

  private mapToDto(row: any): OrderDto {
    return {
      orderId: row.order_id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      status: row.status,
      lines: row.lines.filter((l: any) => l.productId !== null),
      totalAmount: row.total_amount,
      currency: row.currency,
      createdAt: row.created_at,
      confirmedAt: row.confirmed_at,
    };
  }
}

// Get orders by customer handler
class GetOrdersByCustomerHandler 
  implements QueryHandler<GetOrdersByCustomerQuery, OrderSummaryDto[]> {
  
  constructor(private readonly db: Database) {}

  async handle(query: GetOrdersByCustomerQuery): Promise<OrderSummaryDto[]> {
    const offset = (query.pageNumber - 1) * query.pageSize;
    
    const result = await this.db.query(
      `SELECT 
         o.id as order_id,
         c.name as customer_name,
         o.status,
         o.total_amount,
         COUNT(ol.id) as line_count,
         o.created_at
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_lines ol ON ol.order_id = o.id
       WHERE o.customer_id = $1
       GROUP BY o.id, c.name
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [query.customerId, query.pageSize, offset]
    );

    return result.rows.map(this.mapToSummary);
  }

  private mapToSummary(row: any): OrderSummaryDto {
    return {
      orderId: row.order_id,
      customerName: row.customer_name,
      status: row.status,
      totalAmount: row.total_amount,
      lineCount: parseInt(row.line_count),
      createdAt: row.created_at,
    };
  }
}
```

### Query Dispatcher

```typescript
class QueryDispatcher {
  private handlers = new Map<string, QueryHandler<Query<any>, any>>();

  register<TQuery extends Query<TResult>, TResult>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType, handler as QueryHandler<Query<any>, any>);
  }

  async dispatch<TResult>(query: Query<TResult>): Promise<TResult> {
    const handler = this.handlers.get(query.queryType);
    
    if (!handler) {
      throw new UnknownQueryError(query.queryType);
    }

    return handler.handle(query);
  }
}
```

---

## Projections for Read Models

### Event-Driven Projections

```typescript
// Projection that builds read model from events
class OrderReadModelProjection {
  constructor(private readonly db: Database) {}

  async handle(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'order.created':
        await this.onOrderCreated(event as OrderCreatedEvent);
        break;
      case 'order.line_added':
        await this.onLineAdded(event as OrderLineAddedEvent);
        break;
      case 'order.confirmed':
        await this.onConfirmed(event as OrderConfirmedEvent);
        break;
      case 'order.cancelled':
        await this.onCancelled(event as OrderCancelledEvent);
        break;
    }
  }

  private async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.db.query(
      `INSERT INTO order_read_model 
       (order_id, customer_id, status, total_amount, currency, created_at)
       VALUES ($1, $2, 'draft', 0, $3, $4)`,
      [event.orderId, event.customerId, event.currency, event.occurredAt]
    );
  }

  private async onLineAdded(event: OrderLineAddedEvent): Promise<void> {
    // Insert line
    await this.db.query(
      `INSERT INTO order_line_read_model 
       (order_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (order_id, product_id) 
       DO UPDATE SET quantity = order_line_read_model.quantity + $3`,
      [event.orderId, event.productId, event.quantity, event.unitPrice]
    );

    // Update total
    const lineTotal = event.quantity * event.unitPrice;
    await this.db.query(
      `UPDATE order_read_model 
       SET total_amount = total_amount + $1
       WHERE order_id = $2`,
      [lineTotal, event.orderId]
    );
  }

  private async onConfirmed(event: OrderConfirmedEvent): Promise<void> {
    await this.db.query(
      `UPDATE order_read_model 
       SET status = 'confirmed', confirmed_at = $1
       WHERE order_id = $2`,
      [event.occurredAt, event.orderId]
    );
  }

  private async onCancelled(event: OrderCancelledEvent): Promise<void> {
    await this.db.query(
      `UPDATE order_read_model 
       SET status = 'cancelled', cancelled_at = $1, cancellation_reason = $2
       WHERE order_id = $3`,
      [event.occurredAt, event.reason, event.orderId]
    );
  }
}
```

### Separate Read Database

```typescript
// Configuration for separate read/write databases
interface DatabaseConfig {
  write: {
    host: string;
    port: number;
    database: string;
  };
  read: {
    host: string;
    port: number;
    database: string;
    replicas?: string[];  // For read scaling
  };
}

class DatabaseFactory {
  constructor(private readonly config: DatabaseConfig) {}

  createWriteConnection(): Pool {
    return new Pool({
      host: this.config.write.host,
      port: this.config.write.port,
      database: this.config.write.database,
    });
  }

  createReadConnection(): Pool {
    // Could implement round-robin to replicas
    return new Pool({
      host: this.config.read.host,
      port: this.config.read.port,
      database: this.config.read.database,
    });
  }
}
```

---

## Eventual Consistency

### Handling Stale Reads

```typescript
// Include version/timestamp in queries for consistency checks
interface OrderDtoWithVersion extends OrderDto {
  version: number;
  lastUpdatedAt: Date;
}

// Client can poll until version matches
class OrderService {
  constructor(
    private readonly commandDispatcher: CommandDispatcher,
    private readonly queryDispatcher: QueryDispatcher
  ) {}

  async confirmOrderAndWait(
    orderId: string,
    timeoutMs: number = 5000
  ): Promise<OrderDto> {
    // Execute command
    await this.commandDispatcher.dispatch(
      new ConfirmOrderCommand(orderId)
    );

    // Poll for updated read model
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const order = await this.queryDispatcher.dispatch(
        new GetOrderByIdQuery(orderId)
      );

      if (order?.status === 'confirmed') {
        return order;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new TimeoutError('Read model not updated in time');
  }
}
```

### Compensating Actions

```typescript
// Saga for handling failures across services
class OrderFulfillmentSaga {
  private state: SagaState = { step: 'initial' };

  async execute(orderId: string): Promise<void> {
    try {
      // Step 1: Reserve inventory
      this.state.step = 'reserving_inventory';
      const reservation = await this.inventoryService.reserve(orderId);
      this.state.reservationId = reservation.id;

      // Step 2: Process payment
      this.state.step = 'processing_payment';
      const payment = await this.paymentService.process(orderId);
      this.state.paymentId = payment.id;

      // Step 3: Create shipment
      this.state.step = 'creating_shipment';
      await this.shippingService.createShipment(orderId);

      this.state.step = 'completed';
    } catch (error) {
      await this.compensate();
      throw error;
    }
  }

  private async compensate(): Promise<void> {
    // Reverse actions based on completed steps
    switch (this.state.step) {
      case 'creating_shipment':
        // Payment was processed, need to refund
        if (this.state.paymentId) {
          await this.paymentService.refund(this.state.paymentId);
        }
        // Fall through
      case 'processing_payment':
        // Inventory was reserved, need to release
        if (this.state.reservationId) {
          await this.inventoryService.release(this.state.reservationId);
        }
        break;
    }
  }
}
```

---

## Validation Patterns

### Command Validation

```typescript
// Validator interface
interface CommandValidator<T extends Command> {
  validate(command: T): ValidationResult;
}

// Validation result
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Create order validator
class CreateOrderValidator implements CommandValidator<CreateOrderCommand> {
  constructor(private readonly customerService: CustomerService) {}

  async validate(command: CreateOrderCommand): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Validate customer ID
    if (!command.customerId) {
      errors.push({
        field: 'customerId',
        message: 'Customer ID is required',
        code: 'REQUIRED',
      });
    } else {
      const customer = await this.customerService.exists(command.customerId);
      if (!customer) {
        errors.push({
          field: 'customerId',
          message: 'Customer not found',
          code: 'NOT_FOUND',
        });
      }
    }

    // Validate currency
    if (!['USD', 'EUR', 'GBP'].includes(command.currency)) {
      errors.push({
        field: 'currency',
        message: 'Invalid currency',
        code: 'INVALID',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Validation decorator for handlers
class ValidatingCommandHandler<TCommand extends Command, TResult>
  implements CommandHandler<TCommand, TResult> {
  
  constructor(
    private readonly validator: CommandValidator<TCommand>,
    private readonly handler: CommandHandler<TCommand, TResult>
  ) {}

  async handle(command: TCommand): Promise<TResult> {
    const validation = await this.validator.validate(command);
    
    if (!validation.isValid) {
      throw new ValidationException(validation.errors);
    }

    return this.handler.handle(command);
  }
}
```

---

## API Layer Integration

### REST Controller

```typescript
class OrderController {
  constructor(
    private readonly commandDispatcher: CommandDispatcher,
    private readonly queryDispatcher: QueryDispatcher
  ) {}

  // Commands
  @Post('/orders')
  async createOrder(@Body() body: CreateOrderRequest): Promise<{ orderId: string }> {
    const orderId = await this.commandDispatcher.dispatch<string>(
      new CreateOrderCommand(body.customerId, body.currency)
    );
    return { orderId };
  }

  @Post('/orders/:orderId/lines')
  async addLine(
    @Param('orderId') orderId: string,
    @Body() body: AddLineRequest
  ): Promise<void> {
    await this.commandDispatcher.dispatch(
      new AddOrderLineCommand(orderId, body.productId, body.quantity)
    );
  }

  @Post('/orders/:orderId/confirm')
  async confirmOrder(@Param('orderId') orderId: string): Promise<void> {
    await this.commandDispatcher.dispatch(new ConfirmOrderCommand(orderId));
  }

  // Queries
  @Get('/orders/:orderId')
  async getOrder(@Param('orderId') orderId: string): Promise<OrderDto> {
    const order = await this.queryDispatcher.dispatch(
      new GetOrderByIdQuery(orderId)
    );
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    return order;
  }

  @Get('/customers/:customerId/orders')
  async getCustomerOrders(
    @Param('customerId') customerId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10
  ): Promise<OrderSummaryDto[]> {
    return this.queryDispatcher.dispatch(
      new GetOrdersByCustomerQuery(customerId, pageSize, page)
    );
  }
}
```

---

## Best Practices

### When to Use CQRS

**Good Fit:**
- Complex domains with different read/write requirements
- Systems requiring high read scalability
- Event-sourced systems
- Multiple read model representations needed
- Collaborative domains with many concurrent users

**Poor Fit:**
- Simple CRUD applications
- Small teams without ES/CQRS experience
- Systems requiring strong consistency everywhere
- Short-lived projects

### Design Guidelines

1. **Keep commands focused**: One command = one intent
2. **Make commands idempotent**: Safe to retry
3. **Validate early**: Check before processing
4. **Optimize read models**: Denormalize for queries
5. **Handle eventual consistency**: Design for delays
6. **Use correlation IDs**: Track related operations

---

## Related Skills

- [event-sourcing.skill.md](event-sourcing.skill.md) - Event sourcing patterns
- [domain-modeling.skill.md](domain-modeling.skill.md) - Aggregate design
- [clean-architecture.skill.md](clean-architecture.skill.md) - Layer organization
