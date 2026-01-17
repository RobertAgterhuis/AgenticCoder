# Microservices Patterns Skill

## Overview

This skill provides comprehensive patterns and best practices for microservices architecture including Domain-Driven Design, service decomposition, and communication patterns.

---

## Service Decomposition Strategies

### By Business Capability

```
┌─────────────────────────────────────────────────────────────┐
│                    E-Commerce System                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Order Service  │ Inventory Svc   │    Payment Service      │
│  ─────────────  │  ─────────────  │    ─────────────────    │
│  - Create Order │  - Stock Check  │    - Process Payment    │
│  - Track Order  │  - Reserve      │    - Refund             │
│  - Cancel Order │  - Release      │    - Payment History    │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### By Subdomain (DDD)

| Subdomain Type | Characteristics | Example |
|----------------|-----------------|---------|
| Core | Competitive advantage | Recommendation Engine |
| Supporting | Necessary but not differentiating | User Management |
| Generic | Commodity, can outsource | Email/SMS |

---

## Bounded Context Patterns

### Context Mapping

```typescript
// Shared Kernel - common types between contexts
interface Money {
  amount: number;
  currency: string;
}

// Anti-Corruption Layer - translate external models
class PaymentGatewayAdapter {
  constructor(private externalGateway: ExternalPaymentGateway) {}
  
  async processPayment(order: Order): Promise<PaymentResult> {
    // Translate internal model to external
    const externalRequest = this.translateToExternal(order);
    const externalResponse = await this.externalGateway.charge(externalRequest);
    // Translate external response to internal model
    return this.translateFromExternal(externalResponse);
  }
}
```

### Context Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    Order Context                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Order     │  │  OrderItem  │  │ Customer (local)    │  │
│  │  Aggregate  │  │   Entity    │  │ (subset of data)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                    Anti-Corruption Layer
                           │
┌─────────────────────────────────────────────────────────────┐
│                   Customer Context                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Customer   │  │   Address   │  │   Preferences       │  │
│  │  Aggregate  │  │   Entity    │  │   Value Object      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Communication Patterns

### Synchronous (Request/Response)

```typescript
// HTTP REST
@Controller('orders')
class OrderController {
  @Post()
  async createOrder(@Body() dto: CreateOrderDto): Promise<Order> {
    // Sync call to inventory service
    const available = await this.inventoryClient.checkStock(dto.items);
    if (!available) throw new BadRequestException('Insufficient stock');
    return this.orderService.create(dto);
  }
}

// gRPC for internal service-to-service
const client = new InventoryServiceClient(address, credentials);
const response = await client.checkStock({ items: orderItems });
```

### Asynchronous (Event-Driven)

```typescript
// Publishing events
class OrderService {
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const order = await this.repository.save(dto);
    
    // Publish domain event
    await this.eventBus.publish(new OrderCreatedEvent({
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      timestamp: new Date(),
    }));
    
    return order;
  }
}

// Consuming events
@EventHandler(OrderCreatedEvent)
class InventoryEventHandler {
  async handle(event: OrderCreatedEvent): Promise<void> {
    await this.inventoryService.reserveStock(event.items);
  }
}
```

---

## Service Discovery & Load Balancing

### Client-Side Discovery

```typescript
// Using service registry (Consul/Eureka pattern)
class ServiceClient {
  private async getServiceInstances(serviceName: string): Promise<string[]> {
    return this.serviceRegistry.getInstances(serviceName);
  }
  
  async callService(serviceName: string, request: Request): Promise<Response> {
    const instances = await this.getServiceInstances(serviceName);
    const instance = this.loadBalancer.choose(instances);
    return this.httpClient.send(`${instance}${request.path}`, request);
  }
}
```

### Server-Side Discovery (Azure)

```bicep
// Container Apps with built-in service discovery
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'order-service'
  properties: {
    configuration: {
      ingress: {
        external: false  // Internal only
        targetPort: 8080
      }
    }
  }
}
// Access via: http://order-service (internal DNS)
```

---

## Resilience Patterns

### Circuit Breaker

```typescript
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(callExternalService, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

breaker.fallback(() => getCachedData());

breaker.on('open', () => console.log('Circuit opened'));
breaker.on('halfOpen', () => console.log('Circuit half-open'));
breaker.on('close', () => console.log('Circuit closed'));

async function getDataWithResilience() {
  return breaker.fire();
}
```

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Bulkhead

```typescript
// Isolate resources per service
const orderServicePool = new ConnectionPool({ max: 10 });
const paymentServicePool = new ConnectionPool({ max: 5 });

// Payment service issues don't exhaust order service connections
```

---

## Data Management

### Database per Service

| Service | Database | Rationale |
|---------|----------|-----------|
| Order | PostgreSQL | Complex transactions |
| Product | MongoDB | Flexible schema |
| Analytics | ClickHouse | Time-series queries |
| Session | Redis | Fast key-value |

### Saga Pattern for Distributed Transactions

See: [saga-patterns.skill.md](saga-patterns.skill.md)

---

## API Gateway Pattern

```
┌─────────┐     ┌─────────────┐     ┌─────────────────────┐
│ Client  │────▶│ API Gateway │────▶│ Order Service       │
└─────────┘     │             │────▶│ Inventory Service   │
                │  - Auth     │────▶│ Payment Service     │
                │  - Routing  │     └─────────────────────┘
                │  - Rate Limit│
                └─────────────┘
```

---

## Testing Strategies

| Test Type | Scope | Tools |
|-----------|-------|-------|
| Unit | Single service logic | Jest, xUnit |
| Integration | Service + DB | Testcontainers |
| Contract | API compatibility | Pact |
| End-to-End | Full flow | Playwright |

### Contract Testing

```typescript
// Provider (Order Service)
describe('Order API Contract', () => {
  it('provides order by id', async () => {
    await provider.addInteraction({
      state: 'order 123 exists',
      uponReceiving: 'a request for order 123',
      withRequest: { method: 'GET', path: '/orders/123' },
      willRespondWith: {
        status: 200,
        body: { id: '123', status: 'PENDING' },
      },
    });
  });
});
```

---

## Related Agents

- @microservices-architect - Full architecture guidance
- @event-driven-architect - Event patterns
- @container-specialist - Deployment

---

## Tags

`microservices` `ddd` `bounded-context` `service-mesh` `resilience` `architecture`
