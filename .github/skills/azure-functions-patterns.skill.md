# Azure Functions Patterns Skill

**Skill ID**: `azure-functions-patterns`  
**Version**: 1.0.0  
**Category**: Serverless

---

## 🎯 Purpose

Advanced patterns and best practices for Azure Functions v4 including triggers, bindings, Durable Functions, and production deployment strategies.

---

## 📚 Core Patterns

### 1. Trigger Selection Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                    Trigger Selection Matrix                      │
├─────────────────────────────────────────────────────────────────┤
│  HTTP Trigger                                                    │
│  Use for: REST APIs, webhooks, web endpoints                    │
│  Latency: Low (warm), ~500ms-2s (cold)                          │
│  Scale: Per-request                                              │
├─────────────────────────────────────────────────────────────────┤
│  Timer Trigger                                                   │
│  Use for: Scheduled tasks, batch jobs, cleanup                  │
│  Pattern: CRON expressions                                       │
│  Scale: Single instance per timer                                │
├─────────────────────────────────────────────────────────────────┤
│  Queue Trigger (Storage/Service Bus)                            │
│  Use for: Async processing, decoupling, load leveling           │
│  Scale: Based on queue length                                    │
│  Guarantees: At-least-once delivery                             │
├─────────────────────────────────────────────────────────────────┤
│  Blob Trigger                                                    │
│  Use for: File processing, ETL, media processing                │
│  Latency: 10-60 seconds typically                               │
│  Scale: Based on blob events                                     │
├─────────────────────────────────────────────────────────────────┤
│  Event Hub Trigger                                               │
│  Use for: High-throughput streaming, telemetry, IoT             │
│  Scale: Per-partition parallel processing                       │
│  Throughput: Millions of events/second                          │
├─────────────────────────────────────────────────────────────────┤
│  Event Grid Trigger                                              │
│  Use for: Reactive event handling, cross-service events         │
│  Latency: Sub-second                                            │
│  Pattern: Pub/sub with filtering                                │
├─────────────────────────────────────────────────────────────────┤
│  Cosmos DB Trigger                                               │
│  Use for: Change feed processing, real-time sync                │
│  Latency: Near real-time                                        │
│  Scale: Per-partition                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2. HTTP Trigger Patterns

#### Basic HTTP API
```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

app.http('getUsers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{id?}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const userId = request.params.id;
    
    try {
      if (userId) {
        const user = await getUserById(userId);
        if (!user) {
          return { status: 404, jsonBody: { error: 'User not found' } };
        }
        return { jsonBody: user };
      }
      
      const users = await getAllUsers();
      return { jsonBody: users };
    } catch (error) {
      context.error('Error fetching users:', error);
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  }
});
```

#### HTTP with Validation
```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'user', 'guest'])
});

app.http('createUser', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'users',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await request.json();
      const validated = CreateUserSchema.parse(body);
      
      const user = await createUser(validated);
      
      return {
        status: 201,
        jsonBody: user,
        headers: {
          'Location': `/api/users/${user.id}`
        }
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          status: 400,
          jsonBody: {
            error: 'Validation failed',
            details: error.errors
          }
        };
      }
      throw error;
    }
  }
});
```

### 3. Queue Trigger Patterns

#### Service Bus Queue Processing
```typescript
import { app, InvocationContext } from '@azure/functions';

interface OrderMessage {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  totalAmount: number;
}

app.serviceBusQueue('processOrder', {
  connection: 'ServiceBusConnection',
  queueName: 'orders',
  handler: async (message: OrderMessage, context: InvocationContext): Promise<void> => {
    context.log(`Processing order: ${message.orderId}`);
    
    try {
      // Idempotency check
      if (await isOrderProcessed(message.orderId)) {
        context.log(`Order ${message.orderId} already processed, skipping`);
        return;
      }
      
      // Process order
      await processOrder(message);
      await markOrderProcessed(message.orderId);
      
      context.log(`Order ${message.orderId} processed successfully`);
    } catch (error) {
      context.error(`Failed to process order ${message.orderId}:`, error);
      throw error; // Will trigger retry/dead-letter
    }
  }
});
```

#### Batch Processing
```typescript
app.serviceBusQueue('processBatch', {
  connection: 'ServiceBusConnection',
  queueName: 'batch-items',
  cardinality: 'many',
  handler: async (messages: unknown[], context: InvocationContext): Promise<void> => {
    context.log(`Processing batch of ${messages.length} messages`);
    
    const results = await Promise.allSettled(
      messages.map((msg, index) => processItem(msg, context))
    );
    
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      context.warn(`${failed.length} items failed in batch`);
    }
  }
});
```

### 4. Timer Trigger Patterns

#### Scheduled Job
```typescript
import { app, InvocationContext, Timer } from '@azure/functions';

// Run every day at 2 AM UTC
app.timer('dailyCleanup', {
  schedule: '0 0 2 * * *',
  runOnStartup: false,
  handler: async (myTimer: Timer, context: InvocationContext): Promise<void> => {
    const timestamp = new Date().toISOString();
    
    if (myTimer.isPastDue) {
      context.warn('Timer is running late!');
    }
    
    context.log(`Daily cleanup started at ${timestamp}`);
    
    try {
      await cleanupExpiredSessions();
      await archiveOldRecords();
      await generateDailyReport();
      
      context.log('Daily cleanup completed successfully');
    } catch (error) {
      context.error('Daily cleanup failed:', error);
      throw error;
    }
  }
});

// Run every 5 minutes
app.timer('healthCheck', {
  schedule: '0 */5 * * * *',
  handler: async (myTimer: Timer, context: InvocationContext): Promise<void> => {
    const services = ['database', 'cache', 'external-api'];
    
    for (const service of services) {
      const healthy = await checkServiceHealth(service);
      if (!healthy) {
        context.error(`Service ${service} is unhealthy`);
        await sendAlert(service);
      }
    }
  }
});
```

### 5. Event Trigger Patterns

#### Event Grid
```typescript
import { app, EventGridEvent, InvocationContext } from '@azure/functions';

interface BlobCreatedData {
  api: string;
  clientRequestId: string;
  requestId: string;
  eTag: string;
  contentType: string;
  contentLength: number;
  blobType: string;
  url: string;
}

app.eventGrid('handleBlobCreated', {
  handler: async (event: EventGridEvent, context: InvocationContext): Promise<void> => {
    context.log(`Event received: ${event.eventType}`);
    
    if (event.eventType === 'Microsoft.Storage.BlobCreated') {
      const data = event.data as BlobCreatedData;
      context.log(`New blob: ${data.url}`);
      
      // Process the blob
      await processBlobContent(data.url);
    }
  }
});
```

#### Event Hub Streaming
```typescript
import { app, InvocationContext } from '@azure/functions';

interface TelemetryEvent {
  deviceId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
}

app.eventHub('processTelemetry', {
  connection: 'EventHubConnection',
  eventHubName: 'telemetry',
  cardinality: 'many',
  handler: async (events: TelemetryEvent[], context: InvocationContext): Promise<void> => {
    context.log(`Received ${events.length} telemetry events`);
    
    // Process in batches
    const anomalies = events.filter(e => e.temperature > 100 || e.temperature < -40);
    
    if (anomalies.length > 0) {
      context.warn(`${anomalies.length} anomalies detected`);
      await storeAnomalies(anomalies);
      await triggerAlerts(anomalies);
    }
    
    // Store all events
    await storeTelemetryBatch(events);
  }
});
```

---

## 🔄 Durable Functions Patterns

### 1. Function Chaining
```typescript
import * as df from 'durable-functions';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

// Orchestrator
df.app.orchestration('orderProcessingOrchestrator', function* (context) {
  const orderId = context.df.getInput<string>();
  
  // Chain of activities
  const order = yield context.df.callActivity('validateOrder', orderId);
  const payment = yield context.df.callActivity('processPayment', order);
  const inventory = yield context.df.callActivity('reserveInventory', order);
  const notification = yield context.df.callActivity('sendConfirmation', { order, payment });
  
  return { orderId, status: 'completed', notification };
});

// Activities
df.app.activity('validateOrder', {
  handler: async (orderId: string): Promise<Order> => {
    const order = await getOrder(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'pending') throw new Error('Order already processed');
    return order;
  }
});

df.app.activity('processPayment', {
  handler: async (order: Order): Promise<PaymentResult> => {
    return await paymentService.process(order);
  }
});

// HTTP Starter
app.http('startOrderProcessing', {
  methods: ['POST'],
  route: 'orders/{orderId}/process',
  extraInputs: [df.input.durableClient()],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const client = df.getClient(context);
    const orderId = request.params.orderId;
    
    const instanceId = await client.startNew('orderProcessingOrchestrator', {
      input: orderId
    });
    
    return client.createCheckStatusResponse(request, instanceId);
  }
});
```

### 2. Fan-Out/Fan-In Pattern
```typescript
df.app.orchestration('parallelProcessingOrchestrator', function* (context) {
  const items = context.df.getInput<string[]>();
  
  // Fan-out: Start all tasks in parallel
  const parallelTasks = items.map(item => 
    context.df.callActivity('processItem', item)
  );
  
  // Fan-in: Wait for all tasks to complete
  const results = yield context.df.Task.all(parallelTasks);
  
  // Aggregate results
  const summary = yield context.df.callActivity('aggregateResults', results);
  
  return summary;
});

df.app.activity('processItem', {
  handler: async (item: string): Promise<ProcessingResult> => {
    // Long-running processing
    return await heavyProcessing(item);
  }
});

df.app.activity('aggregateResults', {
  handler: async (results: ProcessingResult[]): Promise<Summary> => {
    return {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }
});
```

### 3. Async HTTP API Pattern (Long-Running Operations)
```typescript
df.app.orchestration('longRunningOperation', function* (context) {
  const input = context.df.getInput<OperationInput>();
  
  // Step 1: Initialize
  yield context.df.callActivity('initializeOperation', input);
  
  // Step 2: Long processing with checkpoints
  const batches = splitIntoBatches(input.data, 100);
  for (let i = 0; i < batches.length; i++) {
    yield context.df.callActivity('processBatch', { batch: batches[i], index: i });
    
    // Checkpoint progress
    context.df.setCustomStatus({ progress: ((i + 1) / batches.length) * 100 });
  }
  
  // Step 3: Finalize
  const result = yield context.df.callActivity('finalizeOperation', input.id);
  
  return result;
});

// Status endpoint
app.http('getOperationStatus', {
  methods: ['GET'],
  route: 'operations/{instanceId}',
  extraInputs: [df.input.durableClient()],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const client = df.getClient(context);
    const instanceId = request.params.instanceId;
    
    const status = await client.getStatus(instanceId);
    
    if (!status) {
      return { status: 404, jsonBody: { error: 'Operation not found' } };
    }
    
    return {
      jsonBody: {
        instanceId: status.instanceId,
        status: status.runtimeStatus,
        progress: status.customStatus?.progress ?? 0,
        output: status.output
      }
    };
  }
});
```

### 4. Human Interaction Pattern
```typescript
df.app.orchestration('approvalWorkflow', function* (context) {
  const request = context.df.getInput<ApprovalRequest>();
  
  // Send approval request
  yield context.df.callActivity('sendApprovalRequest', request);
  
  // Wait for approval (with timeout)
  const approvalEvent = context.df.waitForExternalEvent('ApprovalReceived');
  const timeout = context.df.createTimer(
    new Date(context.df.currentUtcDateTime.getTime() + 72 * 60 * 60 * 1000) // 72 hours
  );
  
  const winner = yield context.df.Task.any([approvalEvent, timeout]);
  
  if (winner === timeout) {
    // Timeout - escalate
    yield context.df.callActivity('escalateRequest', request);
    return { status: 'escalated' };
  }
  
  const approval = winner.result as ApprovalResponse;
  
  if (approval.approved) {
    yield context.df.callActivity('processApproval', { request, approval });
    return { status: 'approved' };
  } else {
    yield context.df.callActivity('processRejection', { request, approval });
    return { status: 'rejected', reason: approval.reason };
  }
});

// Endpoint to submit approval decision
app.http('submitApproval', {
  methods: ['POST'],
  route: 'approvals/{instanceId}',
  extraInputs: [df.input.durableClient()],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const client = df.getClient(context);
    const instanceId = request.params.instanceId;
    const body = await request.json() as ApprovalResponse;
    
    await client.raiseEvent(instanceId, 'ApprovalReceived', body);
    
    return { status: 202, jsonBody: { message: 'Approval submitted' } };
  }
});
```

### 5. Eternal Orchestration (Singleton)
```typescript
df.app.orchestration('continuousMonitor', function* (context) {
  const config = context.df.getInput<MonitorConfig>();
  
  // Check health
  const health = yield context.df.callActivity('checkHealth', config.endpoint);
  
  if (!health.healthy) {
    yield context.df.callActivity('sendAlert', {
      endpoint: config.endpoint,
      status: health
    });
  }
  
  // Schedule next check
  const nextCheck = new Date(context.df.currentUtcDateTime.getTime() + config.intervalMs);
  yield context.df.createTimer(nextCheck);
  
  // Continue as new (restart orchestration with fresh history)
  context.df.continueAsNew(config);
});

// Start monitor (singleton pattern)
app.http('startMonitor', {
  methods: ['POST'],
  route: 'monitor/start',
  extraInputs: [df.input.durableClient()],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const client = df.getClient(context);
    const config = await request.json() as MonitorConfig;
    
    // Use deterministic instance ID for singleton
    const instanceId = `monitor-${config.endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    const existing = await client.getStatus(instanceId);
    if (existing && existing.runtimeStatus === 'Running') {
      return { 
        status: 409, 
        jsonBody: { error: 'Monitor already running', instanceId } 
      };
    }
    
    await client.startNew('continuousMonitor', {
      instanceId,
      input: config
    });
    
    return { status: 201, jsonBody: { instanceId } };
  }
});
```

---

## 🔧 Bindings Patterns

### Output Bindings
```typescript
import { app, HttpRequest, InvocationContext, output } from '@azure/functions';

// Queue output binding
const queueOutput = output.storageQueue({
  connection: 'AzureWebJobsStorage',
  queueName: 'notifications'
});

app.http('createNotification', {
  methods: ['POST'],
  extraOutputs: [queueOutput],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const notification = await request.json();
    
    // Send to queue
    context.extraOutputs.set(queueOutput, notification);
    
    return { status: 202, jsonBody: { message: 'Notification queued' } };
  }
});

// Multiple output bindings
const blobOutput = output.storageBlob({
  connection: 'AzureWebJobsStorage',
  path: 'reports/{rand-guid}.json'
});

const cosmosOutput = output.cosmosDB({
  connection: 'CosmosDBConnection',
  databaseName: 'app',
  containerName: 'reports'
});

app.http('generateReport', {
  methods: ['POST'],
  extraOutputs: [blobOutput, cosmosOutput],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const report = await generateReport();
    
    // Output to both blob and Cosmos
    context.extraOutputs.set(blobOutput, JSON.stringify(report));
    context.extraOutputs.set(cosmosOutput, report);
    
    return { jsonBody: report };
  }
});
```

---

## ⚡ Cold Start Mitigation

### Strategies
```typescript
// 1. Keep-warm timer (runs every 5 minutes)
app.timer('keepWarm', {
  schedule: '0 */5 * * * *',
  handler: async (timer, context) => {
    context.log('Keep-warm ping');
  }
});

// 2. Premium plan with pre-warmed instances
// Configure in host.json:
// {
//   "extensions": {
//     "http": {
//       "routePrefix": "api"
//     }
//   },
//   "functionTimeout": "00:10:00"
// }

// 3. Lazy initialization
let dbConnection: Connection | null = null;

async function getDbConnection(): Promise<Connection> {
  if (!dbConnection) {
    dbConnection = await createConnection();
  }
  return dbConnection;
}

// 4. Minimal dependencies
// - Use lightweight packages
// - Lazy-load heavy modules
// - Tree-shake unused code
```

---

## 🛡️ Error Handling & Retry

### Retry Policies
```typescript
// Service Bus with retry
app.serviceBusQueue('processWithRetry', {
  connection: 'ServiceBusConnection',
  queueName: 'orders',
  handler: async (message, context) => {
    try {
      await processMessage(message);
    } catch (error) {
      // Will be retried based on Service Bus retry policy
      // After max retries, moves to dead-letter queue
      throw error;
    }
  }
});

// Manual retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

### Circuit Breaker
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private resetTimeMs: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure!.getTime() > this.resetTimeMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailure = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

---

## 📊 Monitoring & Observability

### Application Insights Integration
```typescript
import { app, InvocationContext } from '@azure/functions';
import * as appInsights from 'applicationinsights';

// Initialize (in function app initialization)
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .start();

const client = appInsights.defaultClient;

app.http('trackedOperation', {
  methods: ['POST'],
  handler: async (request, context) => {
    const startTime = Date.now();
    
    // Custom event
    client.trackEvent({
      name: 'OperationStarted',
      properties: { requestId: context.invocationId }
    });
    
    try {
      const result = await performOperation();
      
      // Track success metric
      client.trackMetric({
        name: 'OperationDuration',
        value: Date.now() - startTime
      });
      
      return { jsonBody: result };
    } catch (error) {
      // Track exception
      client.trackException({ exception: error as Error });
      throw error;
    }
  }
});
```

---

## 🏷️ Tags

`azure-functions` `serverless` `triggers` `bindings` `durable-functions` `orchestration` `scaling` `cold-start`
