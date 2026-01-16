# Phase 3: Architecture Patterns Expansion

**Duration:** 2 weken  
**Status:** ⬜ Not Started  
**Priority:** 🔴 Critical

---

## 🎯 Phase Objective

Toevoegen van enterprise architecture patterns: Microservices, Event-Driven Architecture, en Serverless. Dit maakt het mogelijk om complexe, schaalbare systemen te genereren.

---

## 📊 Architecture Capability Matrix

| Pattern | Current | Target | Use Case |
|---------|---------|--------|----------|
| Monolith | ✅ Supported | ✅ Behouden | Simple apps, MVPs |
| Microservices | ❌ None | 🆕 Full support | Enterprise, scale |
| Event-Driven | ❌ None | 🆕 Full support | Real-time, decoupled |
| Serverless | ❌ None | 🆕 Full support | Cost-efficient, burst |
| CQRS | ❌ None | 🆕 Full support | Complex domains |
| Event Sourcing | ❌ None | 🆕 Full support | Audit, replay |

---

## 📋 Tasks

### Task 3.1: @microservices-architect Agent

**Priority:** 🔴 Critical  
**Estimated:** 3 dagen

**Description:**  
Microservices architecture specialist voor het ontwerpen en implementeren van gedistribueerde systemen.

**Agent Definition:**

```markdown
# @microservices-architect Agent

**Agent ID**: `@microservices-architect`  
**Phase**: 5  
**Purpose**: Design and implement microservices architectures  
**Triggers From**: @architect, @code-architect  
**Hands Off To**: @backend-specialist, @container-specialist, @api-gateway-specialist

---

## Core Responsibilities

### 1. Service Decomposition
- Domain-Driven Design (DDD)
- Bounded contexts identification
- Service boundaries
- Data ownership
- API contracts

### 2. Communication Patterns
- Synchronous (REST, gRPC)
- Asynchronous (Message queues)
- Service mesh (Dapr, Istio)
- Circuit breaker
- Retry policies

### 3. Data Management
- Database per service
- Saga pattern
- Event sourcing
- CQRS
- Eventual consistency

### 4. Deployment
- Container orchestration
- Service discovery
- Configuration management
- Health checks
- Observability
```

**Architecture Patterns:**

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

**Service Template:**
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

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Service decomposition patterns
- [ ] Communication patterns defined
- [ ] Data consistency patterns
- [ ] Deployment patterns

**Files to Create:**
- `.github/agents/@microservices-architect.agent.md`
- `.github/schemas/microservices-architect.input.schema.json`
- `.github/schemas/microservices-architect.output.schema.json`

---

### Task 3.2: @event-driven-architect Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Event-Driven Architecture specialist voor real-time, loosely coupled systemen.

**Agent Definition:**

```markdown
# @event-driven-architect Agent

**Agent ID**: `@event-driven-architect`  
**Phase**: 5  
**Purpose**: Design and implement event-driven architectures  
**Triggers From**: @architect, @microservices-architect  
**Hands Off To**: @backend-specialist, @serverless-specialist

---

## Core Responsibilities

### 1. Event Design
- Event schema design
- Event versioning
- Event naming conventions
- Payload structure
- Metadata standards

### 2. Messaging Patterns
- Publish/Subscribe
- Point-to-Point
- Request/Reply
- Event streaming
- Dead letter handling

### 3. Event Infrastructure
- Azure Service Bus
- Azure Event Hubs
- Azure Event Grid
- Kafka (if needed)
- Message ordering

### 4. Event Processing
- Event handlers
- Event aggregation
- Event filtering
- Replay capability
- Idempotency
```

**Event Flow Pattern:**

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Producer   │────▶│   Event Bus     │────▶│   Consumer   │
│  (Service A) │     │ (Service Bus)   │     │  (Service B) │
└──────────────┘     └─────────────────┘     └──────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Event Store    │
                     │   (Optional)    │
                     └─────────────────┘
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Event design patterns
- [ ] Azure Service Bus integration
- [ ] Event Grid patterns
- [ ] Error handling patterns

**Files to Create:**
- `.github/agents/@event-driven-architect.agent.md`
- `.github/schemas/event-driven-architect.input.schema.json`
- `.github/schemas/event-driven-architect.output.schema.json`

---

### Task 3.3: @serverless-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Serverless architecture specialist voor Azure Functions, Logic Apps, en event-triggered computing.

**Agent Definition:**

```markdown
# @serverless-specialist Agent

**Agent ID**: `@serverless-specialist`  
**Phase**: 9  
**Purpose**: Design and implement serverless solutions on Azure  
**Triggers From**: @azure-architect, @event-driven-architect  
**Hands Off To**: @bicep-specialist, @devops-specialist

---

## Core Responsibilities

### 1. Azure Functions
- Trigger types (HTTP, Timer, Queue, Blob, Event Grid, etc.)
- Bindings (input/output)
- Durable Functions
- Function chaining
- Fan-out/Fan-in

### 2. Logic Apps
- Workflow design
- Connectors
- Custom connectors
- Error handling
- Retry policies

### 3. Event Grid
- Event subscriptions
- Event filtering
- Dead-lettering
- Custom topics

### 4. Architecture Patterns
- API backend (Functions + APIM)
- Event processing (Functions + Event Hubs)
- Workflow automation (Logic Apps)
- Scheduled tasks (Timer triggers)
- File processing (Blob triggers)
```

**Serverless Patterns:**

```
Pattern 1: HTTP API
────────────────────
Client → API Management → Azure Function → Database

Pattern 2: Event Processing
────────────────────────────
Event Source → Event Grid → Azure Function → Storage

Pattern 3: Scheduled Processing
────────────────────────────────
Timer Trigger → Azure Function → External API

Pattern 4: Durable Workflow
─────────────────────────────
HTTP Trigger → Orchestrator → Activity Functions → Result
```

**Project Structure:**
```
functions/
├── src/
│   ├── functions/
│   │   ├── httpTriggers/
│   │   │   ├── getUsers.ts
│   │   │   ├── createUser.ts
│   │   │   └── index.ts
│   │   ├── queueTriggers/
│   │   │   ├── processOrder.ts
│   │   │   └── index.ts
│   │   ├── timerTriggers/
│   │   │   ├── cleanupJob.ts
│   │   │   └── index.ts
│   │   └── durableFunctions/
│   │       ├── orchestrators/
│   │       ├── activities/
│   │       └── index.ts
│   ├── shared/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   └── index.ts
├── host.json
├── local.settings.json
├── package.json
└── tsconfig.json
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Azure Functions patterns
- [ ] Durable Functions patterns
- [ ] Logic Apps integration
- [ ] Cost optimization guidance

**Files to Create:**
- `.github/agents/@serverless-specialist.agent.md`
- `.github/schemas/serverless-specialist.input.schema.json`
- `.github/schemas/serverless-specialist.output.schema.json`

---

### Task 3.4: microservices-patterns Skill

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Microservices design patterns, communication strategies, en best practices.

**Skill Topics:**

```markdown
# Microservices Patterns Skill

## Core Patterns

### 1. Service Decomposition
- Decompose by business capability
- Decompose by subdomain (DDD)
- Strangler fig pattern
- Anti-corruption layer

### 2. Communication Patterns
- API Gateway
- Backend for Frontend (BFF)
- Service mesh
- gRPC vs REST

### 3. Data Patterns
- Database per service
- Shared database (anti-pattern awareness)
- Saga pattern
- Event sourcing
- CQRS

### 4. Resilience Patterns
- Circuit breaker
- Retry with exponential backoff
- Bulkhead
- Timeout
- Fallback

### 5. Observability
- Distributed tracing
- Centralized logging
- Health checks
- Metrics collection
```

**Acceptance Criteria:**
- [ ] 20+ microservices patterns
- [ ] Code examples
- [ ] Anti-patterns documented
- [ ] Azure-specific implementations

**Files to Create:**
- `.github/skills/microservices-patterns.skill.md`

---

### Task 3.5: event-driven-patterns Skill

**Priority:** 🔴 Critical  
**Estimated:** 1.5 dagen

**Description:**  
Event-driven architecture patterns voor Azure.

**Skill Topics:**
- Event schema design
- Event versioning
- Pub/Sub patterns
- Event sourcing
- Azure Service Bus patterns
- Azure Event Grid patterns
- Azure Event Hubs patterns
- Idempotency
- Ordering guarantees

**Files to Create:**
- `.github/skills/event-driven-patterns.skill.md`

---

### Task 3.6: serverless-patterns Skill

**Priority:** 🔴 Critical  
**Estimated:** 1.5 dagen

**Description:**  
Serverless design patterns voor Azure Functions en Logic Apps.

**Skill Topics:**
- Function design
- Trigger selection
- Binding patterns
- Durable Functions patterns
- Cold start mitigation
- Cost optimization
- Security patterns
- Testing patterns

**Files to Create:**
- `.github/skills/serverless-patterns.skill.md`

---

### Task 3.7: cqrs-event-sourcing Skill

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
CQRS en Event Sourcing patterns voor complexe domains.

**Skill Topics:**

```markdown
# CQRS & Event Sourcing Skill

## CQRS Pattern

### Command Side
​```typescript
// Command
interface CreateOrderCommand {
  orderId: string;
  customerId: string;
  items: OrderItem[];
}

// Command Handler
class CreateOrderCommandHandler {
  async handle(command: CreateOrderCommand): Promise<void> {
    const order = Order.create(command);
    await this.repository.save(order);
    await this.eventBus.publish(order.getUncommittedEvents());
  }
}
​```

### Query Side
​```typescript
// Query
interface GetOrdersByCustomerQuery {
  customerId: string;
  page: number;
  pageSize: number;
}

// Query Handler
class GetOrdersByCustomerQueryHandler {
  async handle(query: GetOrdersByCustomerQuery): Promise<OrderReadModel[]> {
    return this.readRepository.findByCustomer(
      query.customerId,
      query.page,
      query.pageSize
    );
  }
}
​```

## Event Sourcing Pattern

### Aggregate
​```typescript
class Order extends AggregateRoot {
  private status: OrderStatus;
  
  static create(command: CreateOrderCommand): Order {
    const order = new Order();
    order.apply(new OrderCreatedEvent(command));
    return order;
  }
  
  confirm(): void {
    if (this.status !== OrderStatus.Pending) {
      throw new Error('Order cannot be confirmed');
    }
    this.apply(new OrderConfirmedEvent(this.id));
  }
  
  // Event handlers
  onOrderCreated(event: OrderCreatedEvent): void {
    this.id = event.orderId;
    this.status = OrderStatus.Pending;
  }
  
  onOrderConfirmed(event: OrderConfirmedEvent): void {
    this.status = OrderStatus.Confirmed;
  }
}
​```
```

**Files to Create:**
- `.github/skills/cqrs-event-sourcing.skill.md`

---

### Task 3.8: saga-patterns Skill

**Priority:** 🟡 High  
**Estimated:** 1 dag

**Description:**  
Saga patterns voor distributed transactions.

**Skill Topics:**
- Choreography-based saga
- Orchestration-based saga
- Compensating transactions
- Saga execution coordinator
- Error handling
- Timeout handling

**Files to Create:**
- `.github/skills/saga-patterns.skill.md`

---

## 📁 Files Created This Phase

```
.github/agents/
├── @microservices-architect.agent.md
├── @event-driven-architect.agent.md
└── @serverless-specialist.agent.md

.github/skills/
├── microservices-patterns.skill.md
├── event-driven-patterns.skill.md
├── serverless-patterns.skill.md
├── cqrs-event-sourcing.skill.md
└── saga-patterns.skill.md

.github/schemas/
├── microservices-architect.input.schema.json
├── microservices-architect.output.schema.json
├── event-driven-architect.input.schema.json
├── event-driven-architect.output.schema.json
├── serverless-specialist.input.schema.json
└── serverless-specialist.output.schema.json
```

---

## ✅ Phase Completion Checklist

- [ ] @microservices-architect agent complete
- [ ] @event-driven-architect agent complete
- [ ] @serverless-specialist agent complete
- [ ] microservices-patterns skill complete
- [ ] event-driven-patterns skill complete
- [ ] serverless-patterns skill complete
- [ ] cqrs-event-sourcing skill complete
- [ ] saga-patterns skill complete
- [ ] All schemas defined
- [ ] Integration with existing agents

---

## 🔗 Navigation

← [02-PHASE-FRONTEND.md](02-PHASE-FRONTEND.md) | → [04-PHASE-INFRASTRUCTURE.md](04-PHASE-INFRASTRUCTURE.md)
