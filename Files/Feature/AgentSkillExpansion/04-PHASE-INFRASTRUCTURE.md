# Phase 4: Infrastructure Expansion

**Duration:** 1.5 weken  
**Status:** ✅ COMPLETE  
**Priority:** 🟡 High

---

## 🎯 Phase Objective

Uitbreiden van infrastructure capabilities met API Gateway, Container Apps, Azure Functions specifieke expertise, en Service Bus patterns.

---

## 📊 Infrastructure Capability Matrix

| Component | Current | Target |
|-----------|---------|--------|
| App Service | ✅ @bicep-specialist | ✅ Behouden |
| Azure SQL | ✅ Partial | ✅ Enhanced |
| Container Apps | ❌ None | 🆕 Full support |
| API Management | ❌ None | 🆕 Full support |
| Azure Functions | ❌ Basic only | 🆕 Advanced |
| Service Bus | ❌ None | 🆕 Full support |
| Event Grid | ❌ None | 🆕 Full support |
| Key Vault | ✅ Basic | ✅ Enhanced |

---

## 📋 Tasks

### Task 4.1: @api-gateway-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
API Gateway specialist voor Azure API Management, rate limiting, en API security.

**Agent Definition:**

```markdown
# @api-gateway-specialist Agent

**Agent ID**: `@api-gateway-specialist`  
**Phase**: 9  
**Purpose**: Design and implement API Gateway solutions  
**Triggers From**: @azure-architect, @microservices-architect  
**Hands Off To**: @bicep-specialist, @devops-specialist

---

## Core Responsibilities

### 1. API Management Design
- API versioning strategies
- Product and subscription management
- Developer portal customization
- API documentation (OpenAPI)
- Mock responses

### 2. Security Implementation
- OAuth 2.0 / OpenID Connect
- API key validation
- JWT validation
- IP filtering
- Rate limiting & throttling
- CORS policies

### 3. Traffic Management
- Load balancing
- Routing policies
- Caching
- Request/Response transformation
- Backend circuit breaker

### 4. Observability
- Request logging
- Application Insights integration
- Custom metrics
- Alert configuration
- Dashboard creation
```

**API Management Patterns:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure API Management                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Products   │  │   Policies   │  │  Developer   │          │
│  │  - Basic     │  │  - Rate Limit│  │    Portal    │          │
│  │  - Standard  │  │  - JWT Valid │  │              │          │
│  │  - Premium   │  │  - Transform │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                        API Gateway                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/v1/users    →  User Service (Container App)       │   │
│  │  /api/v1/orders   →  Order Service (Function App)       │   │
│  │  /api/v1/products →  Product Service (App Service)      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Policy Examples:**

```xml
<!-- Rate Limiting Policy -->
<rate-limit-by-key 
    calls="100" 
    renewal-period="60" 
    counter-key="@(context.Request.IpAddress)" />

<!-- JWT Validation Policy -->
<validate-jwt header-name="Authorization" require-scheme="Bearer">
    <openid-config url="https://login.microsoftonline.com/{tenant}/.well-known/openid-configuration" />
    <required-claims>
        <claim name="aud" match="all">
            <value>{api-audience}</value>
        </claim>
    </required-claims>
</validate-jwt>

<!-- Backend Circuit Breaker -->
<retry condition="@(context.Response.StatusCode == 503)" 
       count="3" 
       interval="10" />
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] API versioning patterns
- [ ] Security policies documented
- [ ] Rate limiting patterns
- [ ] Backend routing patterns

**Files to Create:**
- `.github/agents/@api-gateway-specialist.agent.md`
- `.github/schemas/api-gateway-specialist.input.schema.json`
- `.github/schemas/api-gateway-specialist.output.schema.json`

---

### Task 4.2: @container-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Container specialist voor Azure Container Apps, AKS, en container orchestration.

**Agent Definition:**

```markdown
# @container-specialist Agent

**Agent ID**: `@container-specialist`  
**Phase**: 9  
**Purpose**: Design and implement container solutions on Azure  
**Triggers From**: @azure-architect, @microservices-architect  
**Hands Off To**: @bicep-specialist, @devops-specialist

---

## Core Responsibilities

### 1. Azure Container Apps
- Environment configuration
- Revision management
- Scaling rules (HTTP, KEDA)
- Ingress configuration
- Dapr integration
- Managed identities

### 2. Container Design
- Dockerfile best practices
- Multi-stage builds
- Image optimization
- Security scanning
- Base image selection

### 3. Orchestration
- Service discovery
- Load balancing
- Health probes
- Secrets management
- Volume mounts

### 4. CI/CD Integration
- Azure Container Registry
- Image tagging strategies
- Deployment strategies (Blue/Green, Canary)
- Rollback procedures
```

**Container Apps Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                Container Apps Environment                     │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │  User Service  │  │  Order Service │  │ Product Service│ │
│  │  (Container)   │  │  (Container)   │  │  (Container)   │ │
│  │  ┌──────────┐  │  │  ┌──────────┐  │  │  ┌──────────┐  │ │
│  │  │ Revision │  │  │  │ Revision │  │  │  │ Revision │  │ │
│  │  │   v1.2   │  │  │  │   v2.0   │  │  │  │   v1.5   │  │ │
│  │  └──────────┘  │  │  └──────────┘  │  │  └──────────┘  │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Dapr Sidecar                          ││
│  │  - Service Invocation  - State Management               ││
│  │  - Pub/Sub             - Secrets                        ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

**Bicep Example:**

```bicep
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  properties: {
    environmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      secrets: [
        {
          name: 'db-connection'
          value: dbConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: '${acrName}.azurecr.io/${imageName}:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'db-connection'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling'
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
}
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Container Apps patterns
- [ ] Dapr integration
- [ ] Scaling patterns
- [ ] CI/CD integration

**Files to Create:**
- `.github/agents/@container-specialist.agent.md`
- `.github/schemas/container-specialist.input.schema.json`
- `.github/schemas/container-specialist.output.schema.json`

---

### Task 4.3: api-gateway-patterns Skill

**Priority:** 🔴 Critical  
**Estimated:** 1.5 dagen

**Description:**  
API Gateway patterns voor Azure API Management.

**Skill Topics:**

```markdown
# API Gateway Patterns Skill

## Core Patterns

### 1. API Versioning

​```
URL Path Versioning:
  /api/v1/users
  /api/v2/users

Header Versioning:
  Api-Version: 1.0

Query String Versioning:
  /api/users?api-version=1.0
​```

### 2. Rate Limiting Patterns

​```xml
<!-- Per subscription -->
<rate-limit calls="1000" renewal-period="3600" />

<!-- Per IP address -->
<rate-limit-by-key 
    calls="100" 
    renewal-period="60" 
    counter-key="@(context.Request.IpAddress)" />

<!-- Per user -->
<rate-limit-by-key 
    calls="500" 
    renewal-period="60" 
    counter-key="@(context.Request.Headers.GetValueOrDefault('Authorization','anonymous'))" />
​```

### 3. Backend Routing

​```xml
<!-- Route based on path -->
<choose>
    <when condition="@(context.Request.Url.Path.Contains("/users"))">
        <set-backend-service base-url="https://user-service.azurewebsites.net" />
    </when>
    <when condition="@(context.Request.Url.Path.Contains("/orders"))">
        <set-backend-service base-url="https://order-service.azurewebsites.net" />
    </when>
</choose>
​```
```

**Acceptance Criteria:**
- [ ] Versioning patterns
- [ ] Security patterns
- [ ] Rate limiting patterns
- [ ] Transformation patterns
- [ ] Caching patterns

**Files to Create:**
- `.github/skills/api-gateway-patterns.skill.md`

---

### Task 4.4: azure-functions-patterns Skill

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
Advanced Azure Functions patterns.

**Skill Topics:**
- Trigger selection guide
- Binding patterns
- Durable Functions (orchestrations, activities, entities)
- Fan-out/Fan-in
- Function chaining
- Human interaction patterns
- Eternal orchestrations
- Error handling
- Retry policies
- Cold start mitigation

**Files to Create:**
- `.github/skills/azure-functions-patterns.skill.md`

---

### Task 4.5: container-apps-patterns Skill

**Priority:** 🟡 High  
**Estimated:** 1 dag

**Description:**  
Azure Container Apps patterns en best practices.

**Skill Topics:**
- Environment design
- Revision management
- KEDA scaling
- Dapr integration
- Service-to-service communication
- Secrets management
- Volume mounts
- Health probes
- Blue/Green deployments

**Files to Create:**
- `.github/skills/container-apps-patterns.skill.md`

---

### Task 4.6: service-bus-patterns Skill

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
Azure Service Bus messaging patterns.

**Skill Topics:**

```markdown
# Service Bus Patterns Skill

## Core Patterns

### 1. Queue Patterns

​```typescript
// Send message
const sender = sbClient.createSender('orders-queue');
await sender.sendMessages({
  body: { orderId: '123', status: 'pending' },
  contentType: 'application/json',
  messageId: uuidv4(),
  sessionId: customerId // For ordered processing
});

// Receive with sessions (FIFO per customer)
const receiver = sbClient.acceptSession('orders-queue', customerId);
const messages = await receiver.receiveMessages(10);
​```

### 2. Topic/Subscription Pattern

​```typescript
// Publisher
const sender = sbClient.createSender('order-events');
await sender.sendMessages({
  body: orderCreatedEvent,
  applicationProperties: {
    eventType: 'OrderCreated',
    region: 'EU'
  }
});

// Subscriber with SQL filter
// Subscription filter: eventType = 'OrderCreated' AND region = 'EU'
​```

### 3. Dead Letter Handling

​```typescript
const dlqReceiver = sbClient.createReceiver('orders-queue', {
  subQueueType: 'deadLetter'
});

const deadMessages = await dlqReceiver.receiveMessages(10);
for (const message of deadMessages) {
  // Log, analyze, or reprocess
  console.log('Dead letter reason:', message.deadLetterReason);
  await dlqReceiver.completeMessage(message);
}
​```
```

**Acceptance Criteria:**
- [ ] Queue patterns
- [ ] Topic/Subscription patterns
- [ ] Session patterns
- [ ] Dead letter handling
- [ ] Retry patterns
- [ ] Duplicate detection

**Files to Create:**
- `.github/skills/service-bus-patterns.skill.md`

---

## 📁 Files Created This Phase

```
.github/agents/
├── @api-gateway-specialist.agent.md
└── @container-specialist.agent.md

.github/skills/
├── api-gateway-patterns.skill.md
├── azure-functions-patterns.skill.md
├── container-apps-patterns.skill.md
└── service-bus-patterns.skill.md

.github/schemas/
├── api-gateway-specialist.input.schema.json
├── api-gateway-specialist.output.schema.json
├── container-specialist.input.schema.json
└── container-specialist.output.schema.json
```

---

## ✅ Phase Completion Checklist

- [ ] @api-gateway-specialist agent complete
- [ ] @container-specialist agent complete
- [ ] api-gateway-patterns skill complete
- [ ] azure-functions-patterns skill complete
- [ ] container-apps-patterns skill complete
- [ ] service-bus-patterns skill complete
- [ ] All schemas defined
- [ ] Integration with @bicep-specialist
- [ ] Bicep templates for all components

---

## 🔗 Navigation

← [03-PHASE-ARCHITECTURE.md](03-PHASE-ARCHITECTURE.md) | → [05-PHASE-BACKEND.md](05-PHASE-BACKEND.md)
