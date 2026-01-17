# @serverless-specialist Agent

**Agent ID**: `@serverless-specialist`  
**Version**: 1.0.0  
**Phase**: 9 (Infrastructure)  
**Purpose**: Design and implement serverless solutions on Azure Functions, Logic Apps, and event-triggered computing  
**Triggers From**: @azure-architect, @event-driven-architect, @architect  
**Hands Off To**: @bicep-specialist, @devops-specialist, @backend-specialist

---

## Core Responsibilities

### 1. Azure Functions
- Trigger type selection (HTTP, Timer, Queue, Blob, Event Grid, etc.)
- Input/Output bindings configuration
- Durable Functions orchestration
- Function chaining and fan-out/fan-in
- Performance optimization

### 2. Logic Apps
- Workflow design and automation
- Built-in and custom connectors
- Error handling and retry policies
- Long-running workflow patterns
- Integration with Azure services

### 3. Event Grid
- Event subscriptions and filtering
- Custom topics and domains
- Dead-lettering configuration
- Webhook validation

### 4. Architecture Patterns
- API backend (Functions + APIM)
- Event processing pipelines
- Workflow automation
- Scheduled tasks
- File processing

---

## Serverless Patterns

### Pattern Overview

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

Pattern 5: File Processing
────────────────────────────
Blob Upload → Blob Trigger → Function → Processed Output
```

---

## Azure Functions (Node.js v4)

### HTTP Trigger

```typescript
// src/functions/orders.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OrderService } from '../services/orderService';

const orderService = new OrderService();

// GET /api/orders/{id}
app.http('getOrder', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'orders/{id}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const orderId = request.params.id;
    context.log(`Getting order: ${orderId}`);

    try {
      const order = await orderService.getById(orderId);
      
      if (!order) {
        return { status: 404, jsonBody: { error: 'Order not found' } };
      }
      
      return { status: 200, jsonBody: order };
    } catch (error) {
      context.error('Error getting order:', error);
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  }
});

// POST /api/orders
app.http('createOrder', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'orders',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await request.json() as CreateOrderDto;
      
      // Validate
      const validation = validateOrder(body);
      if (!validation.valid) {
        return { status: 400, jsonBody: { errors: validation.errors } };
      }
      
      const order = await orderService.create(body);
      
      return {
        status: 201,
        jsonBody: order,
        headers: { 'Location': `/api/orders/${order.id}` }
      };
    } catch (error) {
      context.error('Error creating order:', error);
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  }
});
```

### Queue Trigger

```typescript
// src/functions/processOrder.ts
import { app, InvocationContext } from '@azure/functions';

interface OrderMessage {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}

app.storageQueue('processOrder', {
  queueName: 'orders',
  connection: 'AzureWebJobsStorage',
  handler: async (message: OrderMessage, context: InvocationContext): Promise<void> => {
    context.log(`Processing order: ${message.orderId}`);
    
    try {
      // Process order
      await processOrderItems(message.items);
      
      // Update status
      await updateOrderStatus(message.orderId, 'processed');
      
      context.log(`Order ${message.orderId} processed successfully`);
    } catch (error) {
      context.error(`Failed to process order ${message.orderId}:`, error);
      throw error; // Will retry based on host.json settings
    }
  }
});
```

### Timer Trigger

```typescript
// src/functions/dailyReport.ts
import { app, InvocationContext, Timer } from '@azure/functions';

app.timer('dailyReport', {
  schedule: '0 0 8 * * *', // 8 AM daily
  handler: async (timer: Timer, context: InvocationContext): Promise<void> => {
    context.log('Daily report started at:', new Date().toISOString());
    
    if (timer.isPastDue) {
      context.log('Timer is running late!');
    }
    
    try {
      const report = await generateDailyReport();
      await sendReportEmail(report);
      
      context.log('Daily report completed');
    } catch (error) {
      context.error('Failed to generate report:', error);
      throw error;
    }
  }
});
```

### Blob Trigger

```typescript
// src/functions/processImage.ts
import { app, InvocationContext } from '@azure/functions';
import sharp from 'sharp';

app.storageBlob('processImage', {
  path: 'uploads/{name}',
  connection: 'AzureWebJobsStorage',
  handler: async (blob: Buffer, context: InvocationContext): Promise<void> => {
    const blobName = context.triggerMetadata.name as string;
    context.log(`Processing image: ${blobName}`);
    
    // Resize image
    const thumbnail = await sharp(blob)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Output binding would save to thumbnails container
    context.extraOutputs.set('thumbnail', thumbnail);
  }
});
```

### Event Grid Trigger

```typescript
// src/functions/handleStorageEvent.ts
import { app, EventGridEvent, InvocationContext } from '@azure/functions';

app.eventGrid('handleStorageEvent', {
  handler: async (event: EventGridEvent, context: InvocationContext): Promise<void> => {
    context.log('Event Grid event received:', event.eventType);
    
    switch (event.eventType) {
      case 'Microsoft.Storage.BlobCreated':
        await handleBlobCreated(event.data);
        break;
      case 'Microsoft.Storage.BlobDeleted':
        await handleBlobDeleted(event.data);
        break;
      default:
        context.log('Unknown event type:', event.eventType);
    }
  }
});

async function handleBlobCreated(data: any): Promise<void> {
  console.log('Blob created:', data.url);
  // Process new blob
}
```

### Service Bus Trigger

```typescript
// src/functions/processEvent.ts
import { app, InvocationContext } from '@azure/functions';

interface DomainEvent {
  eventId: string;
  eventType: string;
  data: unknown;
}

app.serviceBusTopic('processEvent', {
  topicName: 'events',
  subscriptionName: 'order-processor',
  connection: 'ServiceBusConnection',
  handler: async (message: DomainEvent, context: InvocationContext): Promise<void> => {
    context.log(`Processing event: ${message.eventType}`);
    
    try {
      await routeEvent(message);
    } catch (error) {
      context.error('Event processing failed:', error);
      throw error; // Message will be dead-lettered after max retries
    }
  }
});
```

---

## Durable Functions

### Orchestrator Pattern

```typescript
// src/functions/orderOrchestrator.ts
import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';

interface OrderWorkflowInput {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
}

const orderOrchestrator: OrchestrationHandler = function* (
  context: OrchestrationContext
): Generator<df.Task, any, any> {
  const input = context.df.getInput() as OrderWorkflowInput;
  
  // Step 1: Validate order
  const validationResult = yield context.df.callActivity('validateOrder', input);
  if (!validationResult.valid) {
    return { status: 'failed', reason: 'validation_failed', errors: validationResult.errors };
  }
  
  // Step 2: Reserve inventory
  const inventoryResult = yield context.df.callActivity('reserveInventory', {
    orderId: input.orderId,
    items: input.items
  });
  
  if (!inventoryResult.success) {
    return { status: 'failed', reason: 'inventory_unavailable' };
  }
  
  // Step 3: Process payment
  const paymentResult = yield context.df.callActivity('processPayment', {
    orderId: input.orderId,
    amount: calculateTotal(input.items)
  });
  
  if (!paymentResult.success) {
    // Compensate: Release inventory
    yield context.df.callActivity('releaseInventory', { orderId: input.orderId });
    return { status: 'failed', reason: 'payment_failed' };
  }
  
  // Step 4: Confirm order
  yield context.df.callActivity('confirmOrder', { orderId: input.orderId });
  
  // Step 5: Send notifications (fire and forget)
  yield context.df.callActivity('sendOrderConfirmation', {
    orderId: input.orderId,
    customerId: input.customerId
  });
  
  return { status: 'completed', orderId: input.orderId };
};

df.app.orchestration('orderOrchestrator', orderOrchestrator);
```

### Activity Functions

```typescript
// src/functions/activities.ts
import * as df from 'durable-functions';

// Validate Order
df.app.activity('validateOrder', {
  handler: async (input: OrderWorkflowInput) => {
    const errors: string[] = [];
    
    if (!input.items || input.items.length === 0) {
      errors.push('Order must have at least one item');
    }
    
    if (input.items.some(item => item.quantity <= 0)) {
      errors.push('Item quantities must be positive');
    }
    
    return { valid: errors.length === 0, errors };
  }
});

// Reserve Inventory
df.app.activity('reserveInventory', {
  handler: async (input: { orderId: string; items: any[] }) => {
    const inventoryService = new InventoryService();
    
    for (const item of input.items) {
      const available = await inventoryService.checkAvailability(
        item.productId,
        item.quantity
      );
      
      if (!available) {
        return { success: false, unavailableProduct: item.productId };
      }
    }
    
    await inventoryService.reserveItems(input.orderId, input.items);
    return { success: true };
  }
});

// Process Payment
df.app.activity('processPayment', {
  handler: async (input: { orderId: string; amount: number }) => {
    const paymentService = new PaymentService();
    
    try {
      const result = await paymentService.charge(input.orderId, input.amount);
      return { success: true, transactionId: result.transactionId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});
```

### Fan-Out/Fan-In Pattern

```typescript
// src/functions/parallelProcessing.ts
import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';

interface BatchInput {
  items: string[];
}

const fanOutFanInOrchestrator: OrchestrationHandler = function* (
  context: OrchestrationContext
): Generator<df.Task, any, any> {
  const input = context.df.getInput() as BatchInput;
  
  // Fan-out: Create parallel tasks
  const tasks = input.items.map(item =>
    context.df.callActivity('processItem', item)
  );
  
  // Fan-in: Wait for all tasks to complete
  const results = yield context.df.Task.all(tasks);
  
  // Aggregate results
  const summary = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  };
  
  return summary;
};

df.app.orchestration('fanOutFanIn', fanOutFanInOrchestrator);

// Activity
df.app.activity('processItem', {
  handler: async (item: string) => {
    try {
      await processItem(item);
      return { item, success: true };
    } catch (error) {
      return { item, success: false, error: error.message };
    }
  }
});
```

### Human Interaction Pattern

```typescript
// src/functions/approvalWorkflow.ts
import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';

interface ApprovalInput {
  requestId: string;
  amount: number;
  requestedBy: string;
}

const approvalOrchestrator: OrchestrationHandler = function* (
  context: OrchestrationContext
): Generator<df.Task, any, any> {
  const input = context.df.getInput() as ApprovalInput;
  
  // Send approval request
  yield context.df.callActivity('sendApprovalRequest', input);
  
  // Wait for external event (approval/rejection)
  const timeout = DateTime.fromJSDate(context.df.currentUtcDateTime)
    .plus({ hours: 24 })
    .toJSDate();
  
  const approvalEvent = context.df.waitForExternalEvent('approval');
  const timeoutEvent = context.df.createTimer(timeout);
  
  const winner = yield context.df.Task.any([approvalEvent, timeoutEvent]);
  
  if (winner === approvalEvent) {
    const approval = approvalEvent.result as { approved: boolean; approvedBy: string };
    
    if (approval.approved) {
      yield context.df.callActivity('processApprovedRequest', input);
      return { status: 'approved', approvedBy: approval.approvedBy };
    } else {
      yield context.df.callActivity('sendRejectionNotice', input);
      return { status: 'rejected' };
    }
  } else {
    // Timeout
    yield context.df.callActivity('handleTimeout', input);
    return { status: 'timeout' };
  }
};

df.app.orchestration('approvalWorkflow', approvalOrchestrator);

// HTTP endpoint to raise approval event
app.http('submitApproval', {
  methods: ['POST'],
  route: 'approval/{instanceId}',
  handler: async (request, context) => {
    const client = df.getClient(context);
    const instanceId = request.params.instanceId;
    const body = await request.json();
    
    await client.raiseEvent(instanceId, 'approval', body);
    
    return { status: 202, body: 'Approval submitted' };
  }
});
```

---

## Logic Apps (Standard)

### Workflow Definition

```json
{
  "definition": {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "contentVersion": "1.0.0.0",
    "triggers": {
      "When_a_HTTP_request_is_received": {
        "type": "Request",
        "kind": "Http",
        "inputs": {
          "method": "POST",
          "schema": {
            "type": "object",
            "properties": {
              "orderId": { "type": "string" },
              "customerId": { "type": "string" }
            }
          }
        }
      }
    },
    "actions": {
      "Get_Order_Details": {
        "type": "Http",
        "inputs": {
          "method": "GET",
          "uri": "https://api.example.com/orders/@{triggerBody()?['orderId']}"
        },
        "runAfter": {}
      },
      "Check_Order_Status": {
        "type": "If",
        "expression": {
          "equals": ["@body('Get_Order_Details')?['status']", "pending"]
        },
        "actions": {
          "Process_Order": {
            "type": "Http",
            "inputs": {
              "method": "POST",
              "uri": "https://api.example.com/orders/@{triggerBody()?['orderId']}/process"
            }
          }
        },
        "else": {
          "actions": {
            "Send_Notification": {
              "type": "SendEmail",
              "inputs": {
                "to": "@body('Get_Order_Details')?['customerEmail']",
                "subject": "Order Already Processed",
                "body": "Your order has already been processed."
              }
            }
          }
        },
        "runAfter": { "Get_Order_Details": ["Succeeded"] }
      }
    }
  }
}
```

---

## Function Configuration

### host.json

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20,
        "excludedTypes": "Request;Exception"
      }
    },
    "logLevel": {
      "default": "Information",
      "Host.Results": "Error",
      "Function": "Information",
      "Host.Aggregator": "Trace"
    }
  },
  "extensions": {
    "queues": {
      "maxPollingInterval": "00:00:02",
      "visibilityTimeout": "00:00:30",
      "batchSize": 16,
      "maxDequeueCount": 5,
      "newBatchThreshold": 8
    },
    "serviceBus": {
      "prefetchCount": 100,
      "messageHandlerOptions": {
        "autoComplete": true,
        "maxConcurrentCalls": 32,
        "maxAutoRenewDuration": "00:05:00"
      }
    },
    "durableTask": {
      "storageProvider": {
        "type": "AzureStorage",
        "connectionStringName": "AzureWebJobsStorage"
      },
      "maxConcurrentActivityFunctions": 10,
      "maxConcurrentOrchestratorFunctions": 10
    }
  },
  "functionTimeout": "00:10:00",
  "healthMonitor": {
    "enabled": true,
    "healthCheckInterval": "00:00:10",
    "healthCheckWindow": "00:02:00"
  }
}
```

### local.settings.json

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "ServiceBusConnection": "Endpoint=sb://...",
    "CosmosDBConnection": "AccountEndpoint=...",
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=..."
  }
}
```

---

## Bicep Infrastructure

```bicep
// serverless-infrastructure.bicep
targetScope = 'resourceGroup'

param location string = resourceGroup().location
param environmentName string

// Function App with Consumption Plan
resource functionPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'asp-${environmentName}-func'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true // Linux
  }
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: 'func-${environmentName}'
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: functionPlan.id
    siteConfig: {
      linuxFxVersion: 'Node|20'
      appSettings: [
        { name: 'AzureWebJobsStorage', value: storageConnectionString }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'ServiceBusConnection', value: serviceBusConnectionString }
      ]
    }
    httpsOnly: true
  }
}

// Premium Plan for production (with VNET)
resource premiumPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'asp-${environmentName}-premium'
  location: location
  sku: {
    name: 'EP1'
    tier: 'ElasticPremium'
  }
  properties: {
    reserved: true
    maximumElasticWorkerCount: 20
  }
}

// Logic App Standard
resource logicApp 'Microsoft.Web/sites@2022-09-01' = {
  name: 'logic-${environmentName}'
  location: location
  kind: 'functionapp,workflowapp'
  properties: {
    serverFarmId: premiumPlan.id
    siteConfig: {
      appSettings: [
        { name: 'AzureWebJobsStorage', value: storageConnectionString }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'APP_KIND', value: 'workflowApp' }
      ]
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${environmentName}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}
```

---

## Performance Optimization

### Cold Start Mitigation

```typescript
// Keep functions warm
app.timer('warmup', {
  schedule: '*/5 * * * *', // Every 5 minutes
  handler: async (timer, context) => {
    context.log('Warmup function executed');
    // Light operation to keep instance warm
  }
});

// Pre-connect to dependencies at startup
import { CosmosClient } from '@azure/cosmos';

// Initialize outside handler (singleton)
const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION);
const container = cosmosClient.database('mydb').container('items');

// Handler reuses connection
app.http('getData', {
  handler: async (request, context) => {
    // Connection already established
    const { resources } = await container.items.readAll().fetchAll();
    return { jsonBody: resources };
  }
});
```

### Batching and Concurrency

```typescript
// Configure for high throughput
// host.json
{
  "extensions": {
    "serviceBus": {
      "prefetchCount": 500,
      "messageHandlerOptions": {
        "maxConcurrentCalls": 32
      },
      "batchOptions": {
        "maxMessageCount": 100,
        "operationTimeout": "00:01:00"
      }
    }
  }
}
```

---

## Error Handling

```typescript
// Structured error handling
app.http('processRequest', {
  handler: async (request, context) => {
    try {
      const result = await processWithRetry(async () => {
        return await externalService.call();
      }, { retries: 3, backoff: 'exponential' });
      
      return { status: 200, jsonBody: result };
    } catch (error) {
      // Log with correlation
      context.error('Processing failed', {
        correlationId: request.headers.get('x-correlation-id'),
        error: error.message,
        stack: error.stack
      });
      
      // Return appropriate error
      if (error instanceof ValidationError) {
        return { status: 400, jsonBody: { error: error.message } };
      }
      if (error instanceof NotFoundError) {
        return { status: 404, jsonBody: { error: 'Resource not found' } };
      }
      
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  }
});
```

---

## Input/Output Schema

### Input Schema
```json
{
  "serverless_request": {
    "workload_type": "event-processing",
    "triggers": ["http", "queue", "timer"],
    "scale_requirements": "burst",
    "cold_start_tolerance": "low"
  }
}
```

### Output Schema
```json
{
  "serverless_architecture": {
    "functions": [...],
    "workflows": [...],
    "infrastructure": {...},
    "deployment_config": {...}
  }
}
```

---

## Related Skills
- `event-sourcing.skill.md` - Event patterns
- `azure-pipelines.skill.md` - CI/CD for Functions

## Related Agents
- @event-driven-architect - Event architecture
- @azure-architect - Azure infrastructure
- @bicep-specialist - IaC deployment
