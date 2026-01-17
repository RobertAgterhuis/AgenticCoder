# Serverless Patterns Skill

## Overview

This skill provides comprehensive patterns for serverless architecture with Azure Functions, including triggers, bindings, and Durable Functions orchestrations.

---

## Function Triggers

### HTTP Trigger

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

app.http('getOrder', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'orders/{orderId}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const orderId = request.params.orderId;
    
    try {
      const order = await orderService.getById(orderId);
      return { status: 200, jsonBody: order };
    } catch (error) {
      context.error('Failed to get order:', error);
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  }
});
```

### Service Bus Trigger

```typescript
app.serviceBusQueue('processOrder', {
  connection: 'ServiceBusConnection',
  queueName: 'order-processing',
  handler: async (message: OrderMessage, context: InvocationContext): Promise<void> => {
    context.log(`Processing order: ${message.orderId}`);
    
    await orderProcessor.process(message);
  }
});
```

### Timer Trigger

```typescript
app.timer('dailyCleanup', {
  schedule: '0 0 2 * * *',  // Daily at 2 AM
  handler: async (timer: Timer, context: InvocationContext): Promise<void> => {
    context.log('Running daily cleanup');
    
    if (timer.isPastDue) {
      context.log('Timer is past due!');
    }
    
    await cleanupService.run();
  }
});
```

### Cosmos DB Trigger (Change Feed)

```typescript
app.cosmosDB('processChanges', {
  connection: 'CosmosDBConnection',
  databaseName: 'mydb',
  containerName: 'orders',
  leaseContainerName: 'leases',
  createLeaseContainerIfNotExists: true,
  handler: async (documents: Order[], context: InvocationContext): Promise<void> => {
    for (const doc of documents) {
      context.log(`Document changed: ${doc.id}`);
      await changeFeedProcessor.handle(doc);
    }
  }
});
```

---

## Output Bindings

### Multi-Output Pattern

```typescript
interface ProcessOrderOutput {
  notification: NotificationMessage;
  analytics: AnalyticsEvent;
}

app.http('processOrder', {
  methods: ['POST'],
  extraOutputs: [
    output.serviceBusQueue({
      connection: 'ServiceBusConnection',
      queueName: 'notifications',
    }),
    output.cosmosDB({
      connection: 'CosmosDBConnection',
      databaseName: 'analytics',
      containerName: 'events',
    }),
  ],
  handler: async (request, context): Promise<HttpResponseInit> => {
    const order = await request.json() as Order;
    
    // Set output bindings
    context.extraOutputs.set(notificationOutput, {
      orderId: order.id,
      type: 'OrderProcessed',
    });
    
    context.extraOutputs.set(analyticsOutput, {
      event: 'order_processed',
      data: order,
    });
    
    return { status: 200, jsonBody: { success: true } };
  }
});
```

---

## Durable Functions

### Orchestration Pattern

```typescript
import * as df from 'durable-functions';

// Orchestrator function
df.app.orchestration('orderProcessingOrchestrator', function* (context) {
  const order = context.df.getInput() as Order;
  
  // Step 1: Validate order
  const isValid = yield context.df.callActivity('validateOrder', order);
  if (!isValid) {
    return { status: 'INVALID', order };
  }
  
  // Step 2: Reserve inventory
  const reservation = yield context.df.callActivity('reserveInventory', order.items);
  
  // Step 3: Process payment
  const payment = yield context.df.callActivity('processPayment', {
    orderId: order.id,
    amount: order.total,
  });
  
  // Step 4: Confirm order
  const confirmation = yield context.df.callActivity('confirmOrder', {
    orderId: order.id,
    reservationId: reservation.id,
    paymentId: payment.id,
  });
  
  return { status: 'COMPLETED', confirmation };
});

// Activity functions
df.app.activity('validateOrder', {
  handler: async (order: Order): Promise<boolean> => {
    return orderValidator.validate(order);
  }
});

df.app.activity('reserveInventory', {
  handler: async (items: OrderItem[]): Promise<Reservation> => {
    return inventoryService.reserve(items);
  }
});
```

### Fan-Out/Fan-In Pattern

```typescript
df.app.orchestration('parallelProcessing', function* (context) {
  const items = context.df.getInput() as Item[];
  
  // Fan-out: Process all items in parallel
  const tasks = items.map(item => 
    context.df.callActivity('processItem', item)
  );
  
  // Fan-in: Wait for all to complete
  const results = yield context.df.Task.all(tasks);
  
  // Aggregate results
  return results.reduce((acc, r) => acc + r.value, 0);
});
```

### Human Interaction Pattern

```typescript
df.app.orchestration('approvalWorkflow', function* (context) {
  const request = context.df.getInput() as ApprovalRequest;
  
  // Send approval request
  yield context.df.callActivity('sendApprovalRequest', request);
  
  // Wait for external event (human approval)
  const approved = yield context.df.waitForExternalEvent('ApprovalResult', {
    timeout: df.Duration.fromHours(72),  // 3 days timeout
  });
  
  if (approved) {
    yield context.df.callActivity('processApproval', request);
    return { status: 'APPROVED' };
  } else {
    yield context.df.callActivity('notifyRejection', request);
    return { status: 'REJECTED' };
  }
});

// External event trigger
app.http('submitApproval', {
  methods: ['POST'],
  handler: async (request, context) => {
    const { instanceId, approved } = await request.json();
    
    const client = df.getClient(context);
    await client.raiseEvent(instanceId, 'ApprovalResult', approved);
    
    return { status: 200 };
  }
});
```

### Monitoring Pattern

```typescript
df.app.orchestration('monitorJob', function* (context) {
  const jobId = context.df.getInput() as string;
  const pollingInterval = 30000;  // 30 seconds
  const expiryTime = context.df.currentUtcDateTime.getTime() + 3600000;  // 1 hour
  
  while (context.df.currentUtcDateTime.getTime() < expiryTime) {
    const status = yield context.df.callActivity('checkJobStatus', jobId);
    
    if (status === 'COMPLETED') {
      return { status: 'SUCCESS' };
    }
    
    if (status === 'FAILED') {
      return { status: 'FAILURE' };
    }
    
    // Wait before polling again
    const nextCheck = new Date(context.df.currentUtcDateTime.getTime() + pollingInterval);
    yield context.df.createTimer(nextCheck);
  }
  
  return { status: 'TIMEOUT' };
});
```

---

## Cold Start Optimization

| Strategy | Impact | Trade-off |
|----------|--------|-----------|
| Premium Plan | Eliminates cold start | Higher cost |
| Pre-warming | Reduces cold start | Timer function cost |
| Smaller packages | Faster load | Code organization |
| Lazy loading | Faster initial load | Delayed functionality |

### Lazy Loading Pattern

```typescript
let dbConnection: Connection | null = null;

async function getConnection(): Promise<Connection> {
  if (!dbConnection) {
    dbConnection = await createConnection();
  }
  return dbConnection;
}

app.http('getData', {
  handler: async (request, context) => {
    // Connection created only when needed
    const conn = await getConnection();
    const data = await conn.query('SELECT * FROM items');
    return { jsonBody: data };
  }
});
```

---

## Error Handling

### Retry Policies

```typescript
df.app.activity('unreliableActivity', {
  extraInputs: [df.input.durableClient()],
  handler: async (input: unknown): Promise<Result> => {
    // Automatic retry on failure
    return await unreliableService.call(input);
  },
  retry: {
    strategy: 'exponentialBackoff',
    maxNumberOfAttempts: 3,
    firstRetryIntervalInMilliseconds: 1000,
    backoffCoefficient: 2,
  }
});
```

### Dead Letter Handling

```typescript
app.serviceBusQueue('processWithDLQ', {
  connection: 'ServiceBusConnection',
  queueName: 'my-queue',
  handler: async (message, context) => {
    try {
      await processMessage(message);
    } catch (error) {
      context.error('Processing failed', error);
      throw error;  // Message goes to DLQ after max retries
    }
  }
});
```

---

## Security Best Practices

| Practice | Implementation |
|----------|----------------|
| Managed Identity | `DefaultAzureCredential` |
| Key Vault refs | `@Microsoft.KeyVault(SecretUri=...)` |
| Function keys | Use for public endpoints |
| Easy Auth | Azure AD integration |
| IP restrictions | Network access rules |

---

## Bicep Deployment

```bicep
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'AzureWebJobsStorage', value: storageConnectionString }
      ]
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
    }
    httpsOnly: true
  }
}
```

---

## Related Agents

- @serverless-specialist - Full implementation guidance
- @azure-architect - Architecture decisions
- @bicep-specialist - Infrastructure deployment

---

## Tags

`serverless` `azure-functions` `durable-functions` `event-driven` `triggers` `bindings`
