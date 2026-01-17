# Clean Architecture Skill

**Building Maintainable, Testable, Framework-Independent Systems**

**Version**: 1.0  
**Category**: Architecture Patterns  
**Complexity**: Advanced

---

## Overview

Clean Architecture, popularized by Robert C. Martin (Uncle Bob), is an architectural pattern that organizes code into concentric layers with dependencies pointing inward. The core principle is that business logic should be independent of frameworks, databases, and external services.

---

## Core Principles

### 1. The Dependency Rule

Dependencies can only point inward. Inner layers know nothing about outer layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRAMEWORKS & DRIVERS                          │
│  Web Framework, Database, External APIs, UI                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              INTERFACE ADAPTERS                            │  │
│  │  Controllers, Presenters, Gateways                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │            APPLICATION BUSINESS RULES                │  │  │
│  │  │  Use Cases                                           │  │  │
│  │  │  ┌─────────────────────────────────────────────┐    │  │  │
│  │  │  │       ENTERPRISE BUSINESS RULES             │    │  │  │
│  │  │  │  Entities, Value Objects, Domain Services   │    │  │  │
│  │  │  └─────────────────────────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

          Dependencies point INWARD → → → → → →
```

### 2. Dependency Inversion

High-level modules should not depend on low-level modules. Both should depend on abstractions.

```typescript
// ❌ High-level depends on low-level
class OrderService {
  private db = new PostgresDatabase();  // Direct dependency
  
  async createOrder(data: OrderData) {
    await this.db.insert('orders', data);  // Coupled to Postgres
  }
}

// ✅ Both depend on abstraction
interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
}

class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}
  
  async createOrder(data: CreateOrderData) {
    const order = Order.create(data);
    await this.orderRepository.save(order);  // Uses abstraction
  }
}

// Implementation in outer layer
class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}
  
  async save(order: Order): Promise<void> {
    // Postgres-specific implementation
  }
}
```

---

## Layer Responsibilities

### Enterprise Business Rules (Entities)

The innermost layer contains enterprise-wide business rules. These are the most stable and least likely to change.

```typescript
// Domain entity
class Order {
  private constructor(
    private readonly _id: OrderId,
    private readonly _customerId: CustomerId,
    private _lines: OrderLine[],
    private _status: OrderStatus
  ) {}

  static create(customerId: CustomerId): Order {
    return new Order(
      OrderId.generate(),
      customerId,
      [],
      OrderStatus.Draft
    );
  }

  addLine(productId: ProductId, quantity: Quantity, price: Money): void {
    if (this._status !== OrderStatus.Draft) {
      throw new OrderNotModifiableError();
    }
    this._lines.push(OrderLine.create(productId, quantity, price));
  }

  confirm(): void {
    if (this._lines.length === 0) {
      throw new EmptyOrderError();
    }
    this._status = OrderStatus.Confirmed;
  }

  get totalAmount(): Money {
    return this._lines.reduce(
      (sum, line) => sum.add(line.subtotal),
      Money.zero('USD')
    );
  }
}

// Value object
class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}

  static create(amount: number, currency: string): Money {
    if (amount < 0) throw new NegativeAmountError();
    return new Money(amount, currency);
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError();
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

### Application Business Rules (Use Cases)

Contains application-specific business rules. Orchestrates data flow to and from entities.

```typescript
// Use case interface (input port)
interface CreateOrderUseCase {
  execute(request: CreateOrderRequest): Promise<CreateOrderResponse>;
}

// Request/Response DTOs
interface CreateOrderRequest {
  customerId: string;
  lines: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface CreateOrderResponse {
  orderId: string;
  totalAmount: number;
  currency: string;
}

// Use case implementation
class CreateOrderInteractor implements CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productCatalog: ProductCatalog,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // 1. Create order aggregate
    const order = Order.create(
      CustomerId.fromString(request.customerId)
    );

    // 2. Add lines with prices from catalog
    for (const line of request.lines) {
      const product = await this.productCatalog.findById(line.productId);
      if (!product) {
        throw new ProductNotFoundError(line.productId);
      }
      order.addLine(
        ProductId.fromString(line.productId),
        Quantity.create(line.quantity),
        product.price
      );
    }

    // 3. Persist
    await this.orderRepository.save(order);

    // 4. Publish events
    await this.eventPublisher.publishAll(order.domainEvents);

    // 5. Return response
    return {
      orderId: order.id.value,
      totalAmount: order.totalAmount.amount,
      currency: order.totalAmount.currency,
    };
  }
}
```

### Interface Adapters

Convert data between formats convenient for use cases and external systems.

```typescript
// Controller (driving adapter)
class OrderController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateOrderRequest = {
        customerId: req.body.customerId,
        lines: req.body.lines,
      };

      const response = await this.createOrder.execute(request);

      res.status(201).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const order = await this.getOrder.execute({
        orderId: req.params.id,
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ProductNotFoundError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof OrderNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Repository implementation (driven adapter)
class PostgresOrderRepository implements OrderRepository {
  constructor(
    private readonly pool: Pool,
    private readonly mapper: OrderMapper
  ) {}

  async save(order: Order): Promise<void> {
    const data = this.mapper.toPersistence(order);
    
    await this.pool.query(
      `INSERT INTO orders (id, customer_id, status, total_amount, currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         total_amount = EXCLUDED.total_amount`,
      [data.id, data.customerId, data.status, data.totalAmount, data.currency]
    );

    // Save lines...
  }

  async findById(id: OrderId): Promise<Order | null> {
    const result = await this.pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [id.value]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapper.toDomain(result.rows[0]);
  }
}
```

### Frameworks & Drivers

The outermost layer contains frameworks and tools. This is where the details go.

```typescript
// Express app setup
const app = express();

app.use(express.json());
app.use(authMiddleware);

// Route configuration
app.post('/api/orders', (req, res) => orderController.create(req, res));
app.get('/api/orders/:id', (req, res) => orderController.getById(req, res));

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
```

---

## Project Structure

```
src/
├── domain/                          # Enterprise Business Rules
│   ├── entities/
│   │   ├── Order.ts
│   │   ├── Customer.ts
│   │   └── Product.ts
│   ├── value-objects/
│   │   ├── OrderId.ts
│   │   ├── Money.ts
│   │   └── Quantity.ts
│   ├── services/
│   │   └── PricingService.ts
│   ├── events/
│   │   ├── OrderCreated.ts
│   │   └── OrderConfirmed.ts
│   └── errors/
│       ├── OrderNotFoundError.ts
│       └── InvalidOrderError.ts
│
├── application/                     # Application Business Rules
│   ├── use-cases/
│   │   ├── CreateOrderUseCase.ts
│   │   ├── ConfirmOrderUseCase.ts
│   │   └── GetOrderUseCase.ts
│   ├── ports/
│   │   ├── input/                   # Driving ports (use case interfaces)
│   │   │   └── CreateOrderPort.ts
│   │   └── output/                  # Driven ports (repository interfaces)
│   │       ├── OrderRepository.ts
│   │       ├── ProductCatalog.ts
│   │       └── EventPublisher.ts
│   └── dto/
│       ├── CreateOrderRequest.ts
│       └── OrderResponse.ts
│
├── adapters/                        # Interface Adapters
│   ├── controllers/
│   │   └── OrderController.ts
│   ├── presenters/
│   │   └── OrderPresenter.ts
│   ├── repositories/
│   │   ├── PostgresOrderRepository.ts
│   │   └── mappers/
│   │       └── OrderMapper.ts
│   └── gateways/
│       ├── StripePaymentGateway.ts
│       └── SendGridEmailGateway.ts
│
├── infrastructure/                  # Frameworks & Drivers
│   ├── web/
│   │   ├── express/
│   │   │   ├── app.ts
│   │   │   ├── routes.ts
│   │   │   └── middleware/
│   │   └── graphql/
│   │       └── schema.ts
│   ├── persistence/
│   │   ├── postgres/
│   │   │   ├── connection.ts
│   │   │   └── migrations/
│   │   └── redis/
│   │       └── cache.ts
│   ├── messaging/
│   │   └── rabbitmq/
│   │       └── publisher.ts
│   └── config/
│       └── container.ts             # Dependency injection
│
└── main.ts                          # Composition root
```

---

## Dependency Injection

### Composition Root

```typescript
// infrastructure/config/container.ts
class Container {
  private instances = new Map<string, any>();

  // Register infrastructure
  registerInfrastructure(config: Config): void {
    // Database
    const pool = new Pool(config.database);
    this.register('pool', pool);

    // Repositories
    const orderMapper = new OrderMapper();
    const orderRepository = new PostgresOrderRepository(pool, orderMapper);
    this.register('orderRepository', orderRepository);

    // External services
    const paymentGateway = new StripePaymentGateway(config.stripe.apiKey);
    this.register('paymentGateway', paymentGateway);

    // Event publisher
    const eventPublisher = new RabbitMQEventPublisher(config.rabbitmq);
    this.register('eventPublisher', eventPublisher);
  }

  // Register use cases
  registerUseCases(): void {
    const createOrderUseCase = new CreateOrderInteractor(
      this.get('orderRepository'),
      this.get('productCatalog'),
      this.get('eventPublisher')
    );
    this.register('createOrderUseCase', createOrderUseCase);

    const confirmOrderUseCase = new ConfirmOrderInteractor(
      this.get('orderRepository'),
      this.get('paymentGateway'),
      this.get('eventPublisher')
    );
    this.register('confirmOrderUseCase', confirmOrderUseCase);
  }

  // Register controllers
  registerControllers(): void {
    const orderController = new OrderController(
      this.get('createOrderUseCase'),
      this.get('getOrderUseCase')
    );
    this.register('orderController', orderController);
  }

  private register<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }

  get<T>(key: string): T {
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`Dependency not found: ${key}`);
    }
    return instance as T;
  }
}

// main.ts - Application entry point
async function main(): Promise<void> {
  const config = loadConfig();
  const container = new Container();

  // Build dependency graph
  container.registerInfrastructure(config);
  container.registerUseCases();
  container.registerControllers();

  // Start web server
  const app = createExpressApp(container);
  app.listen(config.port);
}

main();
```

---

## Testing Strategy

### Unit Testing Domain Layer

```typescript
describe('Order', () => {
  describe('create', () => {
    it('should create order in draft status', () => {
      const order = Order.create(CustomerId.fromString('cust-1'));

      expect(order.status).toBe(OrderStatus.Draft);
      expect(order.totalAmount.amount).toBe(0);
    });
  });

  describe('addLine', () => {
    it('should add line to order', () => {
      const order = Order.create(CustomerId.fromString('cust-1'));

      order.addLine(
        ProductId.fromString('prod-1'),
        Quantity.create(2),
        Money.create(100, 'USD')
      );

      expect(order.lineCount).toBe(1);
      expect(order.totalAmount.amount).toBe(200);
    });

    it('should throw when order is confirmed', () => {
      const order = createConfirmedOrder();

      expect(() =>
        order.addLine(
          ProductId.fromString('prod-1'),
          Quantity.create(1),
          Money.create(100, 'USD')
        )
      ).toThrow(OrderNotModifiableError);
    });
  });
});
```

### Unit Testing Use Cases

```typescript
describe('CreateOrderInteractor', () => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockProductCatalog: jest.Mocked<ProductCatalog>;
  let mockEventPublisher: jest.Mocked<EventPublisher>;

  beforeEach(() => {
    mockOrderRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };
    mockProductCatalog = {
      findById: jest.fn(),
    };
    mockEventPublisher = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    useCase = new CreateOrderInteractor(
      mockOrderRepository,
      mockProductCatalog,
      mockEventPublisher
    );
  });

  it('should create order with lines', async () => {
    // Arrange
    mockProductCatalog.findById.mockResolvedValue({
      id: ProductId.fromString('prod-1'),
      name: 'Widget',
      price: Money.create(100, 'USD'),
    });

    const request: CreateOrderRequest = {
      customerId: 'cust-123',
      lines: [{ productId: 'prod-1', quantity: 2 }],
    };

    // Act
    const response = await useCase.execute(request);

    // Assert
    expect(response.totalAmount).toBe(200);
    expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publishAll).toHaveBeenCalledTimes(1);
  });

  it('should throw when product not found', async () => {
    mockProductCatalog.findById.mockResolvedValue(null);

    const request: CreateOrderRequest = {
      customerId: 'cust-123',
      lines: [{ productId: 'unknown', quantity: 1 }],
    };

    await expect(useCase.execute(request)).rejects.toThrow(ProductNotFoundError);
  });
});
```

### Integration Testing

```typescript
describe('PostgresOrderRepository', () => {
  let repository: OrderRepository;
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.TEST_DB_URL });
    repository = new PostgresOrderRepository(pool, new OrderMapper());
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE orders, order_lines CASCADE');
  });

  it('should save and retrieve order', async () => {
    // Arrange
    const order = Order.create(CustomerId.fromString('cust-1'));
    order.addLine(
      ProductId.fromString('prod-1'),
      Quantity.create(2),
      Money.create(100, 'USD')
    );

    // Act
    await repository.save(order);
    const retrieved = await repository.findById(order.id);

    // Assert
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id.equals(order.id)).toBe(true);
    expect(retrieved!.totalAmount.amount).toBe(200);
  });
});
```

---

## Best Practices

### Do's

1. **Keep domain layer pure**: No framework dependencies
2. **Use dependency injection**: Wire dependencies at composition root
3. **Define clear boundaries**: Each layer has specific responsibilities
4. **Test from inside out**: Unit test domain, mock outer layers
5. **Use DTOs at boundaries**: Don't expose domain objects to outer layers

### Don'ts

1. **Don't skip layers**: Always go through proper interfaces
2. **Don't put business logic in controllers**: Keep controllers thin
3. **Don't leak persistence concerns**: Use repository abstractions
4. **Don't couple to frameworks**: Wrap external dependencies
5. **Don't ignore the dependency rule**: Dependencies always point inward

---

## Related Skills

- [hexagonal-architecture.skill.md](hexagonal-architecture.skill.md) - Ports and Adapters
- [domain-modeling.skill.md](domain-modeling.skill.md) - DDD patterns
- [cqrs-patterns.skill.md](cqrs-patterns.skill.md) - CQRS implementation
