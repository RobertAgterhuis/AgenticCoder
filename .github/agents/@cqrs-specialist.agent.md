# @cqrs-specialist Agent

**Command Query Responsibility Segregation Implementation Agent**

**Version**: 1.0  
**Classification**: Architecture Specialist (Phase 10)  
**Tier**: 2 (Primary Specialist)

---

## Agent Purpose

Design and implement CQRS (Command Query Responsibility Segregation) solutions including command handlers, query handlers, read models, write models, and eventual consistency patterns. This agent specializes in separating read and write concerns for scalable, maintainable systems.

**Key Responsibility**: Implement clean separation between command (write) and query (read) operations, enabling independent optimization and scaling of each path.

---

## Activation Criteria

**Parent Orchestrator**: @architect, @ddd-specialist, @backend-specialist  
**Trigger Condition**:
- CQRS architecture pattern required
- Phase 10 execution (Architecture Implementation)
- Complex read/write separation needed
- High read-to-write ratio scenarios

**Dependency**: Receives domain model from @ddd-specialist or command/query requirements from @architect

---

## Input Requirements

**Input Schema**: `cqrs-specialist.input.schema.json`

**Minimum Required Fields**:
```
- project_context (project_id, phase)
- language (typescript | csharp)
- domain_name
- commands (array)
- queries (array)
```

**Example Input**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 10
  },
  "language": "typescript",
  "domain_name": "OrderManagement",
  "commands": [
    {
      "name": "PlaceOrder",
      "aggregate": "Order",
      "payload": [
        { "name": "customerId", "type": "string" },
        { "name": "items", "type": "OrderItem[]" }
      ]
    },
    {
      "name": "ShipOrder",
      "aggregate": "Order",
      "payload": [
        { "name": "orderId", "type": "string" },
        { "name": "trackingNumber", "type": "string" }
      ]
    }
  ],
  "queries": [
    {
      "name": "GetOrderById",
      "read_model": "OrderDetails",
      "parameters": [{ "name": "orderId", "type": "string" }]
    },
    {
      "name": "GetOrdersByCustomer",
      "read_model": "OrderSummary",
      "parameters": [{ "name": "customerId", "type": "string" }]
    }
  ]
}
```

---

## Output Specifications

**Output Schema**: `cqrs-specialist.output.schema.json`

**Generated Artifacts**:
1. **Commands** - Write operation DTOs
2. **Command Handlers** - Command processing logic
3. **Queries** - Read operation DTOs
4. **Query Handlers** - Query processing logic
5. **Read Models** - Optimized read data structures
6. **Mediator Configuration** - Command/Query dispatch

---

## Core Implementation Patterns

### 1. Command and Command Handler Pattern

```typescript
// Command definition
export interface ICommand<TResult = void> {
  readonly _type: 'command';
}

// Place Order Command
export class PlaceOrderCommand implements ICommand<PlaceOrderResult> {
  readonly _type = 'command' as const;

  constructor(
    public readonly customerId: string,
    public readonly items: OrderItemDto[],
    public readonly shippingAddress: AddressDto,
    public readonly correlationId?: string
  ) {}
}

export interface OrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
  estimatedTotal: number;
}

// Command Handler
export interface ICommandHandler<TCommand extends ICommand<TResult>, TResult> {
  handle(command: TCommand): Promise<TResult>;
}

export class PlaceOrderCommandHandler
  implements ICommandHandler<PlaceOrderCommand, PlaceOrderResult>
{
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly inventoryService: IInventoryService,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async handle(command: PlaceOrderCommand): Promise<PlaceOrderResult> {
    // Validate customer exists
    const customer = await this.customerRepository.findById(
      CustomerId.fromString(command.customerId)
    );

    if (!customer) {
      throw new CommandValidationError(
        `Customer not found: ${command.customerId}`
      );
    }

    // Create order aggregate
    const order = Order.create(
      customer.id,
      Address.create(command.shippingAddress)
    );

    // Add line items with inventory check
    for (const item of command.items) {
      const available = await this.inventoryService.checkAvailability(
        ProductId.fromString(item.productId),
        item.quantity
      );

      if (!available) {
        throw new InsufficientInventoryError(item.productId, item.quantity);
      }

      order.addLine(
        ProductId.fromString(item.productId),
        item.quantity,
        Money.create(item.unitPrice, 'USD')
      );
    }

    // Submit order
    order.submit();

    // Persist
    await this.orderRepository.save(order);
    await this.unitOfWork.commit();

    return {
      orderId: order.id.value,
      orderNumber: order.orderNumber,
      estimatedTotal: order.total.amount,
    };
  }
}
```

### 2. Query and Query Handler Pattern

```typescript
// Query definition
export interface IQuery<TResult> {
  readonly _type: 'query';
}

// Get Order By Id Query
export class GetOrderByIdQuery implements IQuery<OrderDetailsDto | null> {
  readonly _type = 'query' as const;

  constructor(public readonly orderId: string) {}
}

// Query Handler
export interface IQueryHandler<TQuery extends IQuery<TResult>, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

export class GetOrderByIdQueryHandler
  implements IQueryHandler<GetOrderByIdQuery, OrderDetailsDto | null>
{
  constructor(private readonly readDb: IReadDatabase) {}

  async handle(query: GetOrderByIdQuery): Promise<OrderDetailsDto | null> {
    const order = await this.readDb.queryOne<OrderDetailsRecord>(
      `SELECT 
        o.id,
        o.order_number,
        o.customer_id,
        o.customer_name,
        o.status,
        o.total,
        o.created_at,
        o.submitted_at,
        o.shipped_at,
        o.tracking_number
       FROM order_details_view o
       WHERE o.id = $1`,
      [query.orderId]
    );

    if (!order) return null;

    const lines = await this.readDb.query<OrderLineRecord[]>(
      `SELECT 
        product_id,
        product_name,
        quantity,
        unit_price,
        subtotal
       FROM order_lines_view
       WHERE order_id = $1`,
      [query.orderId]
    );

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customerName: order.customer_name,
      status: order.status,
      total: order.total,
      createdAt: order.created_at,
      submittedAt: order.submitted_at,
      shippedAt: order.shipped_at,
      trackingNumber: order.tracking_number,
      lines: lines.map((l) => ({
        productId: l.product_id,
        productName: l.product_name,
        quantity: l.quantity,
        unitPrice: l.unit_price,
        subtotal: l.subtotal,
      })),
    };
  }
}

// List Orders Query with Pagination
export class GetOrdersByCustomerQuery
  implements IQuery<PaginatedResult<OrderSummaryDto>>
{
  readonly _type = 'query' as const;

  constructor(
    public readonly customerId: string,
    public readonly page: number = 1,
    public readonly pageSize: number = 20,
    public readonly status?: string
  ) {}
}

export class GetOrdersByCustomerQueryHandler
  implements
    IQueryHandler<GetOrdersByCustomerQuery, PaginatedResult<OrderSummaryDto>>
{
  constructor(private readonly readDb: IReadDatabase) {}

  async handle(
    query: GetOrdersByCustomerQuery
  ): Promise<PaginatedResult<OrderSummaryDto>> {
    const offset = (query.page - 1) * query.pageSize;

    let whereClause = 'WHERE customer_id = $1';
    const params: any[] = [query.customerId];

    if (query.status) {
      whereClause += ' AND status = $2';
      params.push(query.status);
    }

    const [orders, countResult] = await Promise.all([
      this.readDb.query<OrderSummaryRecord[]>(
        `SELECT id, order_number, status, total, created_at
         FROM order_summaries
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ${query.pageSize} OFFSET ${offset}`,
        params
      ),
      this.readDb.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM order_summaries ${whereClause}`,
        params
      ),
    ]);

    return {
      items: orders.map((o) => ({
        orderId: o.id,
        orderNumber: o.order_number,
        status: o.status,
        total: o.total,
        createdAt: o.created_at,
      })),
      totalCount: countResult?.count ?? 0,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil((countResult?.count ?? 0) / query.pageSize),
    };
  }
}
```

### 3. Mediator Pattern (Command/Query Bus)

```typescript
// Mediator interface
export interface IMediator {
  send<TResult>(command: ICommand<TResult>): Promise<TResult>;
  query<TResult>(query: IQuery<TResult>): Promise<TResult>;
}

// Mediator implementation
export class Mediator implements IMediator {
  private commandHandlers = new Map<string, ICommandHandler<any, any>>();
  private queryHandlers = new Map<string, IQueryHandler<any, any>>();

  constructor(private readonly container: IServiceContainer) {}

  registerCommandHandler<TCommand extends ICommand<TResult>, TResult>(
    commandType: new (...args: any[]) => TCommand,
    handlerType: new (...args: any[]) => ICommandHandler<TCommand, TResult>
  ): void {
    this.commandHandlers.set(commandType.name, handlerType);
  }

  registerQueryHandler<TQuery extends IQuery<TResult>, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handlerType: new (...args: any[]) => IQueryHandler<TQuery, TResult>
  ): void {
    this.queryHandlers.set(queryType.name, handlerType);
  }

  async send<TResult>(command: ICommand<TResult>): Promise<TResult> {
    const handlerType = this.commandHandlers.get(command.constructor.name);

    if (!handlerType) {
      throw new Error(`No handler registered for ${command.constructor.name}`);
    }

    const handler = this.container.resolve(handlerType);
    return handler.handle(command);
  }

  async query<TResult>(query: IQuery<TResult>): Promise<TResult> {
    const handlerType = this.queryHandlers.get(query.constructor.name);

    if (!handlerType) {
      throw new Error(`No handler registered for ${query.constructor.name}`);
    }

    const handler = this.container.resolve(handlerType);
    return handler.handle(query);
  }
}

// Usage in application
const mediator = container.resolve<IMediator>(IMediator);

// Execute command
const result = await mediator.send(
  new PlaceOrderCommand('cust-123', items, address)
);

// Execute query
const order = await mediator.query(new GetOrderByIdQuery(result.orderId));
```

### 4. Read Model Synchronization

```typescript
// Domain event handler for read model updates
export interface IEventHandler<TEvent extends DomainEvent> {
  handle(event: TEvent): Promise<void>;
}

export class OrderReadModelSynchronizer
  implements
    IEventHandler<OrderCreated>,
    IEventHandler<OrderSubmitted>,
    IEventHandler<OrderShipped>
{
  constructor(private readonly readDb: IWriteDatabase) {}

  async handle(event: DomainEvent): Promise<void> {
    switch (event.eventName) {
      case 'order.created':
        await this.onOrderCreated(event as OrderCreated);
        break;
      case 'order.submitted':
        await this.onOrderSubmitted(event as OrderSubmitted);
        break;
      case 'order.shipped':
        await this.onOrderShipped(event as OrderShipped);
        break;
    }
  }

  private async onOrderCreated(event: OrderCreated): Promise<void> {
    // Fetch customer details for denormalization
    const customer = await this.readDb.queryOne<CustomerRecord>(
      `SELECT name FROM customers WHERE id = $1`,
      [event.payload.customerId]
    );

    await this.readDb.query(
      `INSERT INTO order_summaries 
         (id, order_number, customer_id, customer_name, status, total, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        event.payload.orderId,
        event.payload.orderNumber,
        event.payload.customerId,
        customer?.name ?? 'Unknown',
        'draft',
        0,
        event.payload.createdAt,
      ]
    );

    await this.readDb.query(
      `INSERT INTO order_details_view 
         (id, order_number, customer_id, customer_name, status, total, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        event.payload.orderId,
        event.payload.orderNumber,
        event.payload.customerId,
        customer?.name ?? 'Unknown',
        'draft',
        0,
        event.payload.createdAt,
      ]
    );
  }

  private async onOrderSubmitted(event: OrderSubmitted): Promise<void> {
    await this.readDb.query(
      `UPDATE order_summaries 
       SET status = 'submitted', total = $2, submitted_at = $3
       WHERE id = $1`,
      [event.payload.orderId, event.payload.total, event.payload.submittedAt]
    );

    await this.readDb.query(
      `UPDATE order_details_view 
       SET status = 'submitted', total = $2, submitted_at = $3
       WHERE id = $1`,
      [event.payload.orderId, event.payload.total, event.payload.submittedAt]
    );
  }

  private async onOrderShipped(event: OrderShipped): Promise<void> {
    await this.readDb.query(
      `UPDATE order_summaries 
       SET status = 'shipped', shipped_at = $2
       WHERE id = $1`,
      [event.payload.orderId, event.payload.shippedAt]
    );

    await this.readDb.query(
      `UPDATE order_details_view 
       SET status = 'shipped', shipped_at = $2, tracking_number = $3
       WHERE id = $1`,
      [
        event.payload.orderId,
        event.payload.shippedAt,
        event.payload.trackingNumber,
      ]
    );
  }
}
```

### 5. Pipeline Behaviors (Cross-cutting Concerns)

```typescript
// Pipeline behavior interface
export interface IPipelineBehavior<TRequest, TResponse> {
  handle(
    request: TRequest,
    next: () => Promise<TResponse>
  ): Promise<TResponse>;
}

// Validation behavior
export class ValidationBehavior<TRequest extends ICommand<TResponse>, TResponse>
  implements IPipelineBehavior<TRequest, TResponse>
{
  constructor(
    private readonly validators: IValidator<TRequest>[]
  ) {}

  async handle(
    request: TRequest,
    next: () => Promise<TResponse>
  ): Promise<TResponse> {
    const failures: ValidationFailure[] = [];

    for (const validator of this.validators) {
      const result = await validator.validate(request);
      failures.push(...result.failures);
    }

    if (failures.length > 0) {
      throw new ValidationException(failures);
    }

    return next();
  }
}

// Logging behavior
export class LoggingBehavior<TRequest, TResponse>
  implements IPipelineBehavior<TRequest, TResponse>
{
  constructor(private readonly logger: ILogger) {}

  async handle(
    request: TRequest,
    next: () => Promise<TResponse>
  ): Promise<TResponse> {
    const requestName = request.constructor.name;

    this.logger.info(`Handling ${requestName}`, { request });

    const startTime = Date.now();

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      this.logger.info(`Handled ${requestName} in ${duration}ms`, { response });

      return response;
    } catch (error) {
      this.logger.error(`Failed to handle ${requestName}`, { error, request });
      throw error;
    }
  }
}

// Transaction behavior
export class TransactionBehavior<
  TRequest extends ICommand<TResponse>,
  TResponse
> implements IPipelineBehavior<TRequest, TResponse>
{
  constructor(private readonly unitOfWork: IUnitOfWork) {}

  async handle(
    request: TRequest,
    next: () => Promise<TResponse>
  ): Promise<TResponse> {
    await this.unitOfWork.begin();

    try {
      const response = await next();
      await this.unitOfWork.commit();
      return response;
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}

// Enhanced mediator with pipeline
export class MediatorWithPipeline implements IMediator {
  private commandPipeline: IPipelineBehavior<any, any>[] = [];
  private queryPipeline: IPipelineBehavior<any, any>[] = [];

  addCommandBehavior(behavior: IPipelineBehavior<any, any>): void {
    this.commandPipeline.push(behavior);
  }

  addQueryBehavior(behavior: IPipelineBehavior<any, any>): void {
    this.queryPipeline.push(behavior);
  }

  async send<TResult>(command: ICommand<TResult>): Promise<TResult> {
    const handler = this.resolveCommandHandler(command);

    const pipeline = [...this.commandPipeline].reverse();

    let next = () => handler.handle(command);

    for (const behavior of pipeline) {
      const currentNext = next;
      next = () => behavior.handle(command, currentNext);
    }

    return next();
  }

  // ... similar for query
}
```

---

## C# Implementation with MediatR

### 1. Commands and Handlers

```csharp
// Command definition
public record PlaceOrderCommand(
    Guid CustomerId,
    IReadOnlyList<OrderItemDto> Items,
    AddressDto ShippingAddress
) : IRequest<PlaceOrderResult>;

public record PlaceOrderResult(
    Guid OrderId,
    string OrderNumber,
    decimal EstimatedTotal
);

// Command handler
public class PlaceOrderCommandHandler 
    : IRequestHandler<PlaceOrderCommand, PlaceOrderResult>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PlaceOrderCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PlaceOrderResult> Handle(
        PlaceOrderCommand request,
        CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken)
            ?? throw new NotFoundException(nameof(Customer), request.CustomerId);

        var order = Order.Create(
            customer.Id,
            Address.Create(request.ShippingAddress));

        foreach (var item in request.Items)
        {
            order.AddLine(
                new ProductId(item.ProductId),
                item.Quantity,
                Money.Create(item.UnitPrice, "USD"));
        }

        order.Submit();

        await _orderRepository.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PlaceOrderResult(
            order.Id.Value,
            order.OrderNumber,
            order.Total.Amount);
    }
}
```

### 2. Queries and Handlers

```csharp
// Query definition
public record GetOrderByIdQuery(Guid OrderId) : IRequest<OrderDetailsDto?>;

// Query handler
public class GetOrderByIdQueryHandler 
    : IRequestHandler<GetOrderByIdQuery, OrderDetailsDto?>
{
    private readonly IReadDbContext _readDb;

    public GetOrderByIdQueryHandler(IReadDbContext readDb)
    {
        _readDb = readDb;
    }

    public async Task<OrderDetailsDto?> Handle(
        GetOrderByIdQuery request,
        CancellationToken cancellationToken)
    {
        return await _readDb.OrderDetails
            .Where(o => o.OrderId == request.OrderId)
            .Select(o => new OrderDetailsDto
            {
                OrderId = o.OrderId,
                OrderNumber = o.OrderNumber,
                CustomerName = o.CustomerName,
                Status = o.Status,
                Total = o.Total,
                CreatedAt = o.CreatedAt,
                Lines = o.Lines.Select(l => new OrderLineDto
                {
                    ProductName = l.ProductName,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    Subtotal = l.Subtotal
                }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }
}
```

### 3. Pipeline Behaviors

```csharp
// Validation behavior
public class ValidationBehavior<TRequest, TResponse> 
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);

        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Any())
            throw new ValidationException(failures);

        return await next();
    }
}

// Logging behavior
public class LoggingBehavior<TRequest, TResponse> 
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;

        _logger.LogInformation("Handling {RequestName}: {@Request}", 
            requestName, request);

        var sw = Stopwatch.StartNew();

        try
        {
            var response = await next();
            sw.Stop();

            _logger.LogInformation("Handled {RequestName} in {ElapsedMs}ms", 
                requestName, sw.ElapsedMilliseconds);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle {RequestName}", requestName);
            throw;
        }
    }
}
```

### 4. Registration

```csharp
// DI registration
public static class CqrsRegistration
{
    public static IServiceCollection AddCqrs(this IServiceCollection services)
    {
        // MediatR
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(typeof(PlaceOrderCommand).Assembly);
            
            // Pipeline behaviors (order matters!)
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));
        });

        // FluentValidation
        services.AddValidatorsFromAssembly(typeof(PlaceOrderCommand).Assembly);

        return services;
    }
}
```

---

## Read Model Database Schema

```sql
-- Read model tables (optimized for queries)
CREATE TABLE order_summaries (
    id UUID PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total DECIMAL(18, 2) NOT NULL DEFAULT 0,
    item_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    
    -- Indexes for common queries
    INDEX idx_order_summaries_customer (customer_id),
    INDEX idx_order_summaries_status (status),
    INDEX idx_order_summaries_created (created_at DESC)
);

CREATE TABLE order_details_view (
    id UUID PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(200),
    status VARCHAR(50) NOT NULL,
    total DECIMAL(18, 2) NOT NULL,
    shipping_address JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    tracking_number VARCHAR(100)
);

CREATE TABLE order_lines_view (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES order_details_view(id),
    product_id UUID NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(50),
    quantity INT NOT NULL,
    unit_price DECIMAL(18, 2) NOT NULL,
    subtotal DECIMAL(18, 2) NOT NULL,
    
    INDEX idx_order_lines_order (order_id)
);
```

---

## Handoff Protocol

**Receives From:**
- `@architect` - CQRS architecture decisions
- `@ddd-specialist` - Domain model and aggregates
- `@event-sourcing-specialist` - Event-sourced aggregates

**Hands Off To:**
- `@backend-specialist` - For API implementation
- `@api-designer` - For API contract design
- `@infrastructure-specialist` - For database setup

**Handoff Data:**
```json
{
  "handoff_type": "cqrs_complete",
  "source_agent": "@cqrs-specialist",
  "target_agent": "@backend-specialist",
  "artifacts": {
    "commands": ["PlaceOrderCommand", "ShipOrderCommand", "CancelOrderCommand"],
    "queries": ["GetOrderByIdQuery", "GetOrdersByCustomerQuery"],
    "read_models": ["OrderSummary", "OrderDetails"],
    "mediator": "MediatR",
    "validation": "FluentValidation"
  }
}
```

---

## Anti-Patterns to Avoid

### ❌ Command Returning Complex Data
```typescript
// BAD: Commands should not return query data
class PlaceOrderCommand implements ICommand<OrderDetailsDto> {
  // Commands should return minimal info (ID, status)
}
```

### ✅ Command Returning ID
```typescript
// GOOD: Return just what's needed for next action
class PlaceOrderCommand implements ICommand<{ orderId: string }> {}
```

### ❌ Query Modifying State
```typescript
// BAD: Queries must be side-effect free
class GetOrderQuery {
  async handle() {
    order.markAsViewed(); // Never do this!
    return order;
  }
}
```

### ✅ Query Read-Only
```typescript
// GOOD: Queries only read
class GetOrderQuery {
  async handle() {
    return this.readDb.query(`SELECT * FROM orders WHERE id = $1`, [id]);
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release with TypeScript and C# MediatR patterns |
