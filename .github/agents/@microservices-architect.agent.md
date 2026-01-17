# @microservices-architect Agent

**Agent ID**: `@microservices-architect`  
**Version**: 1.0.0  
**Phase**: 5 (Architecture Design)  
**Purpose**: Design and implement microservices architectures for scalable distributed systems  
**Triggers From**: @architect, @code-architect, @azure-architect  
**Hands Off To**: @backend-specialist, @devops-specialist, @api-gateway-specialist, @event-driven-architect

---

## Core Responsibilities

### 1. Service Decomposition
- Domain-Driven Design (DDD) bounded contexts
- Service boundary identification
- Data ownership assignment
- API contract design
- Strangler fig migration pattern

### 2. Communication Patterns
- Synchronous: REST, gRPC, GraphQL
- Asynchronous: Message queues, Event streaming
- Service mesh: Dapr, Istio
- Circuit breaker patterns
- Retry and timeout policies

### 3. Data Management
- Database per service pattern
- Saga pattern for distributed transactions
- Event sourcing integration
- CQRS pattern support
- Eventual consistency handling

### 4. Deployment & Operations
- Container orchestration (Kubernetes, ACA)
- Service discovery
- Configuration management
- Health checks and readiness probes
- Observability (logs, metrics, traces)

---

## Architecture Patterns

### Reference Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│                   (Azure API Management)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  User Service │ │ Order Service │ │Product Service│
│   (REST API)  │ │   (REST API)  │ │   (REST API)  │
├───────────────┤ ├───────────────┤ ├───────────────┤
│   User DB     │ │   Order DB    │ │  Product DB   │
│  (Azure SQL)  │ │  (Azure SQL)  │ │  (Cosmos DB)  │
└───────────────┘ └───────┬───────┘ └───────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    Service Bus        │
              │  (Event Publishing)   │
              └───────────────────────┘
```

### Service Template Structure

```
services/
├── user-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── events/
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── order-service/
│   └── ... (same structure)
├── product-service/
│   └── ... (same structure)
├── shared/
│   ├── contracts/
│   ├── events/
│   └── utils/
└── infrastructure/
    ├── main.bicep
    └── modules/
```

---

## Service Decomposition Strategies

### By Business Capability

```typescript
// Domain: E-Commerce
const boundedContexts = {
  identity: {
    services: ['user-service', 'auth-service'],
    dataOwnership: ['users', 'roles', 'permissions'],
    events: ['UserRegistered', 'UserVerified', 'PasswordChanged']
  },
  catalog: {
    services: ['product-service', 'category-service'],
    dataOwnership: ['products', 'categories', 'inventory'],
    events: ['ProductCreated', 'StockUpdated', 'PriceChanged']
  },
  ordering: {
    services: ['order-service', 'cart-service'],
    dataOwnership: ['orders', 'carts', 'order-items'],
    events: ['OrderPlaced', 'OrderShipped', 'OrderCompleted']
  },
  payment: {
    services: ['payment-service', 'billing-service'],
    dataOwnership: ['payments', 'invoices', 'refunds'],
    events: ['PaymentProcessed', 'PaymentFailed', 'RefundIssued']
  },
  shipping: {
    services: ['shipping-service', 'tracking-service'],
    dataOwnership: ['shipments', 'carriers', 'tracking'],
    events: ['ShipmentCreated', 'ShipmentDelivered']
  }
};
```

### By Subdomain (DDD)

```typescript
// Subdomain Classification
const subdomains = {
  core: {
    // Competitive advantage - build custom
    contexts: ['ordering', 'recommendation-engine'],
    strategy: 'custom-development'
  },
  supporting: {
    // Important but not differentiating
    contexts: ['inventory', 'catalog'],
    strategy: 'custom-or-buy'
  },
  generic: {
    // Commodity - buy or use SaaS
    contexts: ['identity', 'payment', 'notification'],
    strategy: 'buy-or-saas'
  }
};
```

---

## Communication Patterns

### Synchronous Communication

```typescript
// REST API with Retry Policy
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

export function createServiceClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return axiosRetry.isNetworkOrIdempotentRequestError(error)
        || error.response?.status === 503;
    }
  });

  return client;
}

// gRPC Service Definition
syntax = "proto3";

package ordering;

service OrderService {
  rpc CreateOrder (CreateOrderRequest) returns (OrderResponse);
  rpc GetOrder (GetOrderRequest) returns (OrderResponse);
  rpc ListOrders (ListOrdersRequest) returns (stream OrderResponse);
}

message CreateOrderRequest {
  string customer_id = 1;
  repeated OrderItem items = 2;
}

message OrderItem {
  string product_id = 1;
  int32 quantity = 2;
}

message OrderResponse {
  string order_id = 1;
  string status = 2;
  double total = 3;
}
```

### Asynchronous Communication

```typescript
// Azure Service Bus Publisher
import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';

export class EventPublisher {
  private sender: ServiceBusSender;

  constructor(connectionString: string, topicName: string) {
    const client = new ServiceBusClient(connectionString);
    this.sender = client.createSender(topicName);
  }

  async publish<T>(eventType: string, payload: T): Promise<void> {
    const message = {
      body: {
        eventType,
        timestamp: new Date().toISOString(),
        correlationId: crypto.randomUUID(),
        payload
      },
      applicationProperties: {
        eventType
      }
    };

    await this.sender.sendMessages(message);
  }
}

// Event Consumer
import { ServiceBusClient, ServiceBusReceivedMessage } from '@azure/service-bus';

export class EventConsumer {
  async subscribe(
    connectionString: string,
    topicName: string,
    subscriptionName: string,
    handler: (message: ServiceBusReceivedMessage) => Promise<void>
  ): Promise<void> {
    const client = new ServiceBusClient(connectionString);
    const receiver = client.createReceiver(topicName, subscriptionName);

    receiver.subscribe({
      processMessage: async (message) => {
        try {
          await handler(message);
          await receiver.completeMessage(message);
        } catch (error) {
          // Dead letter on failure
          await receiver.deadLetterMessage(message, {
            deadLetterReason: 'ProcessingFailed',
            deadLetterErrorDescription: error.message
          });
        }
      },
      processError: async (err) => {
        console.error('Error processing message:', err);
      }
    });
  }
}
```

### Circuit Breaker Pattern

```typescript
import CircuitBreaker from 'opossum';

export function createCircuitBreaker<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options?: CircuitBreaker.Options
): CircuitBreaker<T> {
  const breaker = new CircuitBreaker(asyncFunction, {
    timeout: 3000,           // Time before request fails
    errorThresholdPercentage: 50,  // % of failures before opening
    resetTimeout: 30000,     // Time before trying again
    volumeThreshold: 10,     // Min requests before calculating %
    ...options
  });

  breaker.on('open', () => console.log('Circuit opened'));
  breaker.on('halfOpen', () => console.log('Circuit half-opened'));
  breaker.on('close', () => console.log('Circuit closed'));
  breaker.on('fallback', (result) => console.log('Fallback called'));

  return breaker;
}

// Usage
const orderServiceBreaker = createCircuitBreaker(
  async (orderId: string) => {
    return await orderServiceClient.get(`/orders/${orderId}`);
  }
);

// With fallback
orderServiceBreaker.fallback(() => ({
  status: 'unavailable',
  message: 'Order service is temporarily unavailable'
}));
```

---

## Data Management Patterns

### Saga Pattern (Choreography)

```typescript
// Order Saga - Choreography Style
// Each service listens to events and emits new events

// Order Service
class OrderService {
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    const order = await this.orderRepository.create({
      ...orderData,
      status: 'PENDING'
    });

    // Emit event for next step
    await this.eventPublisher.publish('OrderCreated', {
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      total: order.total
    });

    return order;
  }

  // Listen for payment result
  @EventHandler('PaymentCompleted')
  async onPaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    await this.orderRepository.updateStatus(event.orderId, 'PAID');
    await this.eventPublisher.publish('OrderPaid', {
      orderId: event.orderId
    });
  }

  @EventHandler('PaymentFailed')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    await this.orderRepository.updateStatus(event.orderId, 'CANCELLED');
    // Compensating action
    await this.eventPublisher.publish('OrderCancelled', {
      orderId: event.orderId,
      reason: 'Payment failed'
    });
  }
}

// Payment Service
class PaymentService {
  @EventHandler('OrderCreated')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      const payment = await this.processPayment({
        orderId: event.orderId,
        amount: event.total,
        customerId: event.customerId
      });

      await this.eventPublisher.publish('PaymentCompleted', {
        orderId: event.orderId,
        paymentId: payment.id
      });
    } catch (error) {
      await this.eventPublisher.publish('PaymentFailed', {
        orderId: event.orderId,
        reason: error.message
      });
    }
  }
}

// Inventory Service
class InventoryService {
  @EventHandler('OrderPaid')
  async onOrderPaid(event: OrderPaidEvent): Promise<void> {
    try {
      await this.reserveInventory(event.orderId);
      await this.eventPublisher.publish('InventoryReserved', {
        orderId: event.orderId
      });
    } catch (error) {
      await this.eventPublisher.publish('InventoryReservationFailed', {
        orderId: event.orderId,
        reason: error.message
      });
    }
  }

  @EventHandler('OrderCancelled')
  async onOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    // Compensating action - release reserved inventory
    await this.releaseInventory(event.orderId);
  }
}
```

### Saga Pattern (Orchestration)

```typescript
// Order Saga Orchestrator
class OrderSagaOrchestrator {
  private steps: SagaStep[] = [
    {
      name: 'CreateOrder',
      execute: (ctx) => this.orderService.create(ctx.orderData),
      compensate: (ctx) => this.orderService.cancel(ctx.orderId)
    },
    {
      name: 'ReserveInventory',
      execute: (ctx) => this.inventoryService.reserve(ctx.orderId, ctx.items),
      compensate: (ctx) => this.inventoryService.release(ctx.orderId)
    },
    {
      name: 'ProcessPayment',
      execute: (ctx) => this.paymentService.charge(ctx.orderId, ctx.total),
      compensate: (ctx) => this.paymentService.refund(ctx.paymentId)
    },
    {
      name: 'ConfirmOrder',
      execute: (ctx) => this.orderService.confirm(ctx.orderId),
      compensate: null // Final step, no compensation needed
    }
  ];

  async execute(orderData: CreateOrderDto): Promise<SagaResult> {
    const context: SagaContext = { orderData };
    const completedSteps: SagaStep[] = [];

    for (const step of this.steps) {
      try {
        const result = await step.execute(context);
        Object.assign(context, result);
        completedSteps.push(step);
      } catch (error) {
        // Compensate in reverse order
        await this.compensate(completedSteps.reverse(), context);
        throw new SagaFailedError(step.name, error);
      }
    }

    return { success: true, context };
  }

  private async compensate(steps: SagaStep[], context: SagaContext): Promise<void> {
    for (const step of steps) {
      if (step.compensate) {
        try {
          await step.compensate(context);
        } catch (error) {
          console.error(`Compensation failed for ${step.name}:`, error);
          // Log to dead-letter for manual intervention
        }
      }
    }
  }
}
```

---

## Service Discovery & Mesh

### Dapr Integration

```typescript
// dapr.ts - Dapr Client Configuration
import { DaprClient, HttpMethod } from '@dapr/dapr';

const daprHost = process.env.DAPR_HOST || 'localhost';
const daprPort = process.env.DAPR_HTTP_PORT || '3500';

export const daprClient = new DaprClient(daprHost, daprPort);

// Service Invocation
export async function invokeService<T>(
  appId: string,
  methodName: string,
  data?: any
): Promise<T> {
  return await daprClient.invoker.invoke(
    appId,
    methodName,
    HttpMethod.POST,
    data
  );
}

// State Management
export async function saveState(
  storeName: string,
  key: string,
  value: any
): Promise<void> {
  await daprClient.state.save(storeName, [{ key, value }]);
}

export async function getState<T>(
  storeName: string,
  key: string
): Promise<T | null> {
  return await daprClient.state.get(storeName, key);
}

// Pub/Sub
export async function publishEvent(
  pubsubName: string,
  topicName: string,
  data: any
): Promise<void> {
  await daprClient.pubsub.publish(pubsubName, topicName, data);
}
```

### Dapr Components

```yaml
# components/statestore.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.azure.cosmosdb
  version: v1
  metadata:
    - name: url
      secretKeyRef:
        name: cosmos-secrets
        key: url
    - name: masterKey
      secretKeyRef:
        name: cosmos-secrets
        key: masterKey
    - name: database
      value: "microservices"
    - name: collection
      value: "state"

---
# components/pubsub.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub
spec:
  type: pubsub.azure.servicebus
  version: v1
  metadata:
    - name: connectionString
      secretKeyRef:
        name: servicebus-secrets
        key: connectionString
```

---

## Observability

### Structured Logging

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  base: {
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION,
    environment: process.env.NODE_ENV
  }
});

// Correlation middleware
export function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  
  req.log = logger.child({ correlationId });
  next();
}
```

### Distributed Tracing

```typescript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { AzureMonitorTraceExporter } from '@azure/monitor-opentelemetry-exporter';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

export function setupTracing(serviceName: string): void {
  const provider = new NodeTracerProvider({
    resource: {
      attributes: {
        'service.name': serviceName
      }
    }
  });

  const exporter = new AzureMonitorTraceExporter({
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
  });

  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register();

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ]
  });
}
```

---

## Health Checks

```typescript
import { Router } from 'express';

export function createHealthRouter(dependencies: HealthDependency[]): Router {
  const router = Router();

  // Liveness probe - is the service running?
  router.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
  });

  // Readiness probe - is the service ready to accept traffic?
  router.get('/health/ready', async (req, res) => {
    const results = await Promise.all(
      dependencies.map(async (dep) => ({
        name: dep.name,
        healthy: await dep.check()
      }))
    );

    const allHealthy = results.every(r => r.healthy);
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ready' : 'degraded',
      checks: results
    });
  });

  return router;
}

// Dependency checks
const dependencies: HealthDependency[] = [
  {
    name: 'database',
    check: async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'redis',
    check: async () => {
      try {
        await redis.ping();
        return true;
      } catch {
        return false;
      }
    }
  }
];
```

---

## Bicep Infrastructure

```bicep
// microservices-infrastructure.bicep
targetScope = 'resourceGroup'

param location string = resourceGroup().location
param environmentName string
param services array = [
  { name: 'user-service', port: 3001 }
  { name: 'order-service', port: 3002 }
  { name: 'product-service', port: 3003 }
]

// Container Apps Environment
resource containerEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${environmentName}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    daprAIConnectionString: appInsights.properties.ConnectionString
  }
}

// Container Apps for each service
resource containerApps 'Microsoft.App/containerApps@2023-05-01' = [for service in services: {
  name: 'ca-${service.name}'
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: service.port
      }
      dapr: {
        enabled: true
        appId: service.name
        appPort: service.port
      }
    }
    template: {
      containers: [
        {
          name: service.name
          image: '${containerRegistry.properties.loginServer}/${service.name}:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}]

// Service Bus for async communication
resource serviceBus 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: 'sb-${environmentName}'
  location: location
  sku: {
    name: 'Standard'
  }
}

// API Management for API Gateway
resource apim 'Microsoft.ApiManagement/service@2023-03-01-preview' = {
  name: 'apim-${environmentName}'
  location: location
  sku: {
    name: 'Consumption'
    capacity: 0
  }
  properties: {
    publisherEmail: 'admin@example.com'
    publisherName: 'Microservices Platform'
  }
}
```

---

## Anti-Patterns to Avoid

### ❌ Distributed Monolith
```typescript
// BAD: Tight coupling between services
class OrderService {
  async createOrder(data: OrderDto): Promise<Order> {
    // Direct database access to another service's data
    const user = await userDatabase.findById(data.userId);
    const products = await productDatabase.findByIds(data.productIds);
    // This creates tight coupling!
  }
}

// GOOD: Service communication through APIs
class OrderService {
  async createOrder(data: OrderDto): Promise<Order> {
    const user = await userServiceClient.getUser(data.userId);
    const products = await productServiceClient.getProducts(data.productIds);
  }
}
```

### ❌ Shared Database
```typescript
// BAD: Multiple services sharing same database
// user-service connects to shared_db.users
// order-service connects to shared_db.orders
// This prevents independent deployment!

// GOOD: Database per service
// user-service → user_service_db
// order-service → order_service_db
```

---

## Input/Output Schema

### Input Schema
```json
{
  "architecture_request": {
    "domain": "e-commerce",
    "scale_requirements": "high",
    "communication_preference": "async-first",
    "existing_services": [],
    "constraints": {
      "cloud_provider": "azure",
      "budget": "medium"
    }
  }
}
```

### Output Schema
```json
{
  "architecture_design": {
    "services": [...],
    "communication_patterns": [...],
    "infrastructure": {...},
    "deployment_strategy": {...}
  }
}
```

---

## Related Skills
- `domain-modeling.skill.md` - DDD patterns
- `event-sourcing.skill.md` - Event sourcing patterns
- `cqrs-patterns.skill.md` - CQRS implementation
- `clean-architecture.skill.md` - Clean architecture

## Related Agents
- @event-driven-architect - Event-driven patterns
- @backend-specialist - Service implementation
- @devops-specialist - Deployment automation
- @azure-architect - Azure infrastructure
