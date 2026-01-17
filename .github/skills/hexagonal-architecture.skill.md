# Hexagonal Architecture Skill

**Ports and Adapters Pattern**

**Version**: 1.0  
**Category**: Architecture Patterns  
**Complexity**: Advanced

---

## Overview

Hexagonal Architecture (also known as Ports and Adapters) is an architectural pattern that aims to create loosely coupled application components. The core application logic is isolated from external concerns through ports (interfaces) and adapters (implementations).

---

## Core Concepts

### The Hexagon

The hexagon represents the application core. External systems interact with it through ports.

```
                    ┌───────────────────┐
                    │    REST API       │
                    │    (Adapter)      │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────┐
                    │   Input Port      │
                    │   (Interface)     │
                    └────────┬──────────┘
                             │
    ┌───────────┐   ┌────────▼──────────┐   ┌───────────┐
    │  CLI      │   │                   │   │  Database │
    │ (Adapter) │──▶│    APPLICATION    │◀──│ (Adapter) │
    │           │   │      CORE         │   │           │
    └───────────┘   │                   │   └───────────┘
                    │   Domain Logic    │
    ┌───────────┐   │   Use Cases       │   ┌───────────┐
    │  Queue    │   │   Entities        │   │  External │
    │ (Adapter) │──▶│                   │◀──│  API      │
    │           │   └────────▲──────────┘   │ (Adapter) │
    └───────────┘            │              └───────────┘
                    ┌────────┴──────────┐
                    │   Output Port     │
                    │   (Interface)     │
                    └───────────────────┘
```

### Ports

Ports are interfaces that define how the application interacts with the outside world.

**Driving Ports (Primary/Input)**: Define what the application can do
**Driven Ports (Secondary/Output)**: Define what the application needs

```typescript
// Driving Port - What the application CAN DO
interface OrderService {
  createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse>;
  confirmOrder(orderId: string): Promise<void>;
  cancelOrder(orderId: string, reason: string): Promise<void>;
}

// Driven Port - What the application NEEDS
interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findByCustomer(customerId: CustomerId): Promise<Order[]>;
}

interface PaymentGateway {
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  refund(paymentId: string, amount: Money): Promise<RefundResult>;
}

interface NotificationSender {
  sendOrderConfirmation(order: Order): Promise<void>;
  sendShippingUpdate(order: Order, status: ShippingStatus): Promise<void>;
}
```

### Adapters

Adapters implement ports and handle the translation between external systems and the application core.

**Driving Adapters (Primary)**: Call the application (Controllers, CLI, Message Handlers)
**Driven Adapters (Secondary)**: Called by the application (Repositories, Gateways)

---

## Driving Adapters

### REST Controller Adapter

```typescript
// Driving adapter - implements HTTP interface
class OrderRestController {
  constructor(private readonly orderService: OrderService) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      // Translate HTTP request to domain request
      const request: CreateOrderRequest = {
        customerId: req.body.customerId,
        lines: req.body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: this.mapAddress(req.body.shippingAddress),
      };

      // Call application through port
      const response = await this.orderService.createOrder(request);

      // Translate domain response to HTTP response
      res.status(201).json({
        orderId: response.orderId,
        total: response.totalAmount,
        currency: response.currency,
        status: response.status,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const order = await this.orderService.getOrder(req.params.id);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(this.mapToResponse(order));
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private mapAddress(dto: any): Address {
    return Address.create({
      street: dto.street,
      city: dto.city,
      postalCode: dto.postalCode,
      country: dto.country,
    });
  }

  private mapToResponse(order: OrderDto): object {
    return {
      id: order.orderId,
      customer: order.customerId,
      items: order.lines,
      total: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
    };
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

### CLI Adapter

```typescript
// Driving adapter - implements CLI interface
class OrderCliAdapter {
  constructor(private readonly orderService: OrderService) {}

  async run(args: string[]): Promise<void> {
    const command = args[0];
    
    switch (command) {
      case 'create':
        await this.createOrder(args.slice(1));
        break;
      case 'confirm':
        await this.confirmOrder(args[1]);
        break;
      case 'list':
        await this.listOrders(args[1]);
        break;
      default:
        this.printUsage();
    }
  }

  private async createOrder(args: string[]): Promise<void> {
    const [customerId, ...productArgs] = args;
    
    const lines = this.parseProductArgs(productArgs);
    
    const response = await this.orderService.createOrder({
      customerId,
      lines,
    });

    console.log(`Order created: ${response.orderId}`);
    console.log(`Total: ${response.totalAmount} ${response.currency}`);
  }

  private async confirmOrder(orderId: string): Promise<void> {
    await this.orderService.confirmOrder(orderId);
    console.log(`Order ${orderId} confirmed`);
  }

  private parseProductArgs(args: string[]): OrderLineRequest[] {
    // Parse "productId:quantity" format
    return args.map(arg => {
      const [productId, quantity] = arg.split(':');
      return { productId, quantity: parseInt(quantity) };
    });
  }
}
```

### Message Handler Adapter

```typescript
// Driving adapter - handles async messages
class OrderMessageHandler {
  constructor(private readonly orderService: OrderService) {}

  async handleMessage(message: Message): Promise<void> {
    const payload = JSON.parse(message.body);
    
    switch (message.type) {
      case 'order.create_requested':
        await this.handleCreateOrder(payload);
        break;
      case 'order.confirmation_requested':
        await this.handleConfirmOrder(payload);
        break;
      case 'order.cancellation_requested':
        await this.handleCancelOrder(payload);
        break;
    }
  }

  private async handleCreateOrder(payload: any): Promise<void> {
    const request: CreateOrderRequest = {
      customerId: payload.customerId,
      lines: payload.items,
    };

    await this.orderService.createOrder(request);
  }

  private async handleConfirmOrder(payload: any): Promise<void> {
    await this.orderService.confirmOrder(payload.orderId);
  }

  private async handleCancelOrder(payload: any): Promise<void> {
    await this.orderService.cancelOrder(payload.orderId, payload.reason);
  }
}
```

---

## Driven Adapters

### Repository Adapter

```typescript
// Driven adapter - implements persistence
class PostgresOrderRepository implements OrderRepository {
  constructor(
    private readonly pool: Pool,
    private readonly mapper: OrderPersistenceMapper
  ) {}

  async save(order: Order): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const orderData = this.mapper.toPersistence(order);

      // Upsert order
      await client.query(
        `INSERT INTO orders (id, customer_id, status, total_amount, currency, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           total_amount = EXCLUDED.total_amount,
           updated_at = NOW()`,
        [
          orderData.id,
          orderData.customerId,
          orderData.status,
          orderData.totalAmount,
          orderData.currency,
          orderData.createdAt,
        ]
      );

      // Update lines
      await client.query(
        'DELETE FROM order_lines WHERE order_id = $1',
        [orderData.id]
      );

      for (const line of orderData.lines) {
        await client.query(
          `INSERT INTO order_lines (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [orderData.id, line.productId, line.quantity, line.unitPrice]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new PersistenceError('Failed to save order', error);
    } finally {
      client.release();
    }
  }

  async findById(id: OrderId): Promise<Order | null> {
    const result = await this.pool.query(
      `SELECT o.*, 
              json_agg(ol.*) as lines
       FROM orders o
       LEFT JOIN order_lines ol ON ol.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id.value]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapper.toDomain(result.rows[0]);
  }

  async findByCustomer(customerId: CustomerId): Promise<Order[]> {
    const result = await this.pool.query(
      `SELECT o.*, 
              json_agg(ol.*) as lines
       FROM orders o
       LEFT JOIN order_lines ol ON ol.order_id = o.id
       WHERE o.customer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [customerId.value]
    );

    return result.rows.map(row => this.mapper.toDomain(row));
  }
}
```

### External API Adapter

```typescript
// Driven adapter - implements external API integration
class StripePaymentAdapter implements PaymentGateway {
  private readonly stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Translate domain request to Stripe request
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: this.toStripeAmount(request.amount),
        currency: request.amount.currency.toLowerCase(),
        payment_method: request.paymentMethodId,
        confirm: true,
        metadata: {
          orderId: request.orderId,
          customerId: request.customerId,
        },
      });

      // Translate Stripe response to domain response
      return {
        success: paymentIntent.status === 'succeeded',
        paymentId: paymentIntent.id,
        status: this.mapStatus(paymentIntent.status),
        processedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeCardError) {
        return {
          success: false,
          paymentId: null,
          status: PaymentStatus.Declined,
          errorMessage: error.message,
          errorCode: error.code,
        };
      }
      throw new PaymentProcessingError('Payment processing failed', error);
    }
  }

  async refund(paymentId: string, amount: Money): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount: this.toStripeAmount(amount),
    });

    return {
      success: refund.status === 'succeeded',
      refundId: refund.id,
      status: this.mapRefundStatus(refund.status),
    };
  }

  private toStripeAmount(money: Money): number {
    // Stripe uses smallest currency unit (cents)
    return Math.round(money.amount * 100);
  }

  private mapStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      succeeded: PaymentStatus.Completed,
      processing: PaymentStatus.Processing,
      requires_payment_method: PaymentStatus.Failed,
      requires_confirmation: PaymentStatus.Pending,
      canceled: PaymentStatus.Cancelled,
    };
    return statusMap[stripeStatus] ?? PaymentStatus.Unknown;
  }
}
```

### Notification Adapter

```typescript
// Driven adapter - implements notification sending
class SendGridNotificationAdapter implements NotificationSender {
  private readonly client: SendGridClient;

  constructor(apiKey: string) {
    this.client = new SendGridClient(apiKey);
  }

  async sendOrderConfirmation(order: Order): Promise<void> {
    const customer = await this.customerRepository.findById(order.customerId);
    
    await this.client.send({
      to: customer.email,
      templateId: 'd-order-confirmation',
      dynamicTemplateData: {
        orderId: order.id.value,
        customerName: customer.name,
        orderTotal: order.totalAmount.format(),
        orderDate: order.createdAt.toLocaleDateString(),
        items: order.lines.map(line => ({
          name: line.productName,
          quantity: line.quantity.value,
          price: line.unitPrice.format(),
          subtotal: line.subtotal.format(),
        })),
      },
    });
  }

  async sendShippingUpdate(order: Order, status: ShippingStatus): Promise<void> {
    const customer = await this.customerRepository.findById(order.customerId);
    
    await this.client.send({
      to: customer.email,
      templateId: 'd-shipping-update',
      dynamicTemplateData: {
        orderId: order.id.value,
        customerName: customer.name,
        status: status.description,
        trackingNumber: status.trackingNumber,
        estimatedDelivery: status.estimatedDelivery?.toLocaleDateString(),
      },
    });
  }
}
```

---

## Application Core

### Use Case Implementation

```typescript
// Application service implementing driving port
class OrderApplicationService implements OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productCatalog: ProductCatalog,
    private readonly paymentGateway: PaymentGateway,
    private readonly notificationSender: NotificationSender,
    private readonly eventPublisher: EventPublisher
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Create domain aggregate
    const order = Order.create({
      customerId: CustomerId.fromString(request.customerId),
      shippingAddress: request.shippingAddress,
    });

    // Add lines
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

    // Persist through repository port
    await this.orderRepository.save(order);

    // Publish events through publisher port
    await this.eventPublisher.publishAll(order.domainEvents);

    return {
      orderId: order.id.value,
      totalAmount: order.totalAmount.amount,
      currency: order.totalAmount.currency,
      status: order.status,
    };
  }

  async confirmOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId)
    );

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    // Process payment through gateway port
    const paymentResult = await this.paymentGateway.processPayment({
      orderId: order.id.value,
      customerId: order.customerId.value,
      amount: order.totalAmount,
    });

    if (!paymentResult.success) {
      throw new PaymentFailedError(paymentResult.errorMessage);
    }

    // Update domain
    order.confirm(paymentResult.paymentId);

    // Persist
    await this.orderRepository.save(order);

    // Send notification through sender port
    await this.notificationSender.sendOrderConfirmation(order);

    // Publish events
    await this.eventPublisher.publishAll(order.domainEvents);
  }
}
```

---

## Project Structure

```
src/
├── core/                            # Application Core (Hexagon)
│   ├── domain/                      # Domain Model
│   │   ├── model/
│   │   │   ├── Order.ts
│   │   │   ├── OrderLine.ts
│   │   │   └── Customer.ts
│   │   ├── value-objects/
│   │   │   ├── OrderId.ts
│   │   │   ├── Money.ts
│   │   │   └── Address.ts
│   │   ├── events/
│   │   │   ├── OrderCreated.ts
│   │   │   └── OrderConfirmed.ts
│   │   └── services/
│   │       └── PricingService.ts
│   │
│   ├── ports/                       # Port Interfaces
│   │   ├── driving/                 # Primary/Input Ports
│   │   │   ├── OrderService.ts
│   │   │   └── CustomerService.ts
│   │   └── driven/                  # Secondary/Output Ports
│   │       ├── OrderRepository.ts
│   │       ├── PaymentGateway.ts
│   │       └── NotificationSender.ts
│   │
│   └── application/                 # Use Case Implementations
│       ├── OrderApplicationService.ts
│       └── CustomerApplicationService.ts
│
├── adapters/                        # Adapters
│   ├── driving/                     # Primary/Input Adapters
│   │   ├── rest/
│   │   │   ├── OrderController.ts
│   │   │   └── CustomerController.ts
│   │   ├── graphql/
│   │   │   └── OrderResolver.ts
│   │   ├── cli/
│   │   │   └── OrderCommands.ts
│   │   └── messaging/
│   │       └── OrderMessageHandler.ts
│   │
│   └── driven/                      # Secondary/Output Adapters
│       ├── persistence/
│       │   ├── postgres/
│       │   │   ├── PostgresOrderRepository.ts
│       │   │   └── mappers/
│       │   └── mongodb/
│       │       └── MongoOrderRepository.ts
│       ├── payment/
│       │   ├── StripePaymentAdapter.ts
│       │   └── PayPalPaymentAdapter.ts
│       └── notification/
│           ├── SendGridNotificationAdapter.ts
│           └── TwilioNotificationAdapter.ts
│
├── infrastructure/                  # Infrastructure
│   ├── config/
│   │   ├── container.ts
│   │   └── settings.ts
│   ├── web/
│   │   ├── express.ts
│   │   └── routes.ts
│   └── messaging/
│       └── rabbitmq.ts
│
└── main.ts                          # Entry point
```

---

## Testing

### Testing the Hexagon in Isolation

```typescript
describe('OrderApplicationService', () => {
  let service: OrderService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockProductCatalog: jest.Mocked<ProductCatalog>;
  let mockPaymentGateway: jest.Mocked<PaymentGateway>;
  let mockNotificationSender: jest.Mocked<NotificationSender>;

  beforeEach(() => {
    // Create mock adapters
    mockOrderRepository = createMock<OrderRepository>();
    mockProductCatalog = createMock<ProductCatalog>();
    mockPaymentGateway = createMock<PaymentGateway>();
    mockNotificationSender = createMock<NotificationSender>();

    // Inject mocks into application service
    service = new OrderApplicationService(
      mockOrderRepository,
      mockProductCatalog,
      mockPaymentGateway,
      mockNotificationSender,
      createMock<EventPublisher>()
    );
  });

  describe('createOrder', () => {
    it('should create order with correct total', async () => {
      mockProductCatalog.findById.mockResolvedValue({
        id: ProductId.fromString('prod-1'),
        name: 'Widget',
        price: Money.create(100, 'USD'),
      });

      const response = await service.createOrder({
        customerId: 'cust-123',
        lines: [{ productId: 'prod-1', quantity: 2 }],
      });

      expect(response.totalAmount).toBe(200);
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmOrder', () => {
    it('should process payment and send notification', async () => {
      const order = createTestOrder();
      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentGateway.processPayment.mockResolvedValue({
        success: true,
        paymentId: 'pay-123',
        status: PaymentStatus.Completed,
      });

      await service.confirmOrder(order.id.value);

      expect(mockPaymentGateway.processPayment).toHaveBeenCalledTimes(1);
      expect(mockNotificationSender.sendOrderConfirmation).toHaveBeenCalledTimes(1);
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
```

---

## Best Practices

1. **Keep the hexagon pure**: No framework code inside
2. **Use dependency injection**: Wire adapters at composition root
3. **Define clear port contracts**: Ports are stable interfaces
4. **Adapters handle translation**: Convert between external and domain formats
5. **Test the hexagon independently**: Mock all ports for unit tests
6. **One adapter per external system**: Isolate external dependencies

---

## Related Skills

- [clean-architecture.skill.md](clean-architecture.skill.md) - Layer organization
- [domain-modeling.skill.md](domain-modeling.skill.md) - Domain design
- [cqrs-patterns.skill.md](cqrs-patterns.skill.md) - CQRS patterns
