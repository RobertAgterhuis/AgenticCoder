# Service Bus Patterns Skill

**Skill ID**: `service-bus-patterns`  
**Version**: 1.0.0  
**Category**: Messaging

---

## 🎯 Purpose

Comprehensive patterns and best practices for Azure Service Bus including queues, topics, sessions, dead-letter handling, and reliable messaging patterns.

---

## 📚 Core Patterns

### 1. Queue vs Topic Selection

```
┌─────────────────────────────────────────────────────────────────┐
│                    Message Pattern Selection                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  QUEUE (Point-to-Point)                                         │
│  ┌─────────┐         ┌─────────┐         ┌─────────┐           │
│  │ Sender  │ ──────► │  Queue  │ ──────► │Receiver │           │
│  └─────────┘         └─────────┘         └─────────┘           │
│                                                                  │
│  Use when:                                                       │
│  • Single consumer per message                                   │
│  • FIFO ordering needed (with sessions)                         │
│  • Load leveling / work distribution                            │
│  • Command processing                                            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TOPIC (Publish-Subscribe)                                       │
│  ┌─────────┐         ┌─────────┐         ┌─────────────────┐   │
│  │Publisher│ ──────► │  Topic  │ ──────► │ Subscription A  │   │
│  └─────────┘         └─────────┘ ──────► │ Subscription B  │   │
│                                  ──────► │ Subscription C  │   │
│                                          └─────────────────┘   │
│                                                                  │
│  Use when:                                                       │
│  • Multiple consumers for same message                          │
│  • Event broadcasting                                            │
│  • Fan-out scenarios                                             │
│  • Decoupled microservices                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Basic Queue Operations

#### Sending Messages
```typescript
import { ServiceBusClient, ServiceBusMessage } from '@azure/service-bus';

const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING!;
const queueName = 'orders';

const sbClient = new ServiceBusClient(connectionString);
const sender = sbClient.createSender(queueName);

// Send single message
async function sendOrder(order: Order): Promise<void> {
  const message: ServiceBusMessage = {
    body: order,
    contentType: 'application/json',
    messageId: order.id,  // Enables duplicate detection
    correlationId: order.correlationId,
    subject: 'OrderCreated',
    applicationProperties: {
      orderType: order.type,
      priority: order.priority,
      region: order.region
    },
    timeToLive: 60 * 60 * 1000  // 1 hour TTL
  };
  
  await sender.sendMessages(message);
}

// Send batch
async function sendOrderBatch(orders: Order[]): Promise<void> {
  const batch = await sender.createMessageBatch();
  
  for (const order of orders) {
    const message: ServiceBusMessage = {
      body: order,
      messageId: order.id
    };
    
    if (!batch.tryAddMessage(message)) {
      // Batch is full, send and create new batch
      await sender.sendMessages(batch);
      const newBatch = await sender.createMessageBatch();
      
      if (!newBatch.tryAddMessage(message)) {
        throw new Error('Message too large for batch');
      }
    }
  }
  
  // Send remaining messages
  if (batch.count > 0) {
    await sender.sendMessages(batch);
  }
}

// Scheduled message
async function scheduleOrder(order: Order, scheduledTime: Date): Promise<void> {
  const message: ServiceBusMessage = {
    body: order,
    messageId: order.id
  };
  
  const sequenceNumber = await sender.scheduleMessages(message, scheduledTime);
  console.log(`Scheduled message: ${sequenceNumber}`);
}
```

#### Receiving Messages
```typescript
const receiver = sbClient.createReceiver(queueName);

// Receive and process
async function processOrders(): Promise<void> {
  const messages = await receiver.receiveMessages(10, {
    maxWaitTimeInMs: 5000
  });
  
  for (const message of messages) {
    try {
      const order = message.body as Order;
      await processOrder(order);
      
      // Complete the message (remove from queue)
      await receiver.completeMessage(message);
    } catch (error) {
      console.error('Failed to process:', error);
      
      // Abandon for retry
      await receiver.abandonMessage(message, {
        lastProcessingError: error.message
      });
      
      // Or dead-letter for manual intervention
      // await receiver.deadLetterMessage(message, {
      //   deadLetterReason: 'ProcessingFailed',
      //   deadLetterErrorDescription: error.message
      // });
    }
  }
}

// Subscribe with handler
async function subscribeToOrders(): Promise<void> {
  receiver.subscribe({
    processMessage: async (message) => {
      const order = message.body as Order;
      await processOrder(order);
    },
    processError: async (args) => {
      console.error('Error:', args.error);
      console.error('Source:', args.errorSource);
    }
  }, {
    autoCompleteMessages: true,
    maxConcurrentCalls: 10
  });
}
```

### 3. Session Pattern (Ordered Processing)

#### FIFO Ordering with Sessions
```typescript
// Send with session ID (messages with same sessionId processed in order)
async function sendOrderWithSession(order: Order): Promise<void> {
  const message: ServiceBusMessage = {
    body: order,
    messageId: order.id,
    sessionId: order.customerId  // All orders from same customer in sequence
  };
  
  await sender.sendMessages(message);
}

// Receive session messages
async function processCustomerOrders(customerId: string): Promise<void> {
  // Accept specific session
  const sessionReceiver = await sbClient.acceptSession(queueName, customerId);
  
  try {
    const messages = await sessionReceiver.receiveMessages(100, {
      maxWaitTimeInMs: 30000
    });
    
    for (const message of messages) {
      await processOrder(message.body);
      await sessionReceiver.completeMessage(message);
    }
  } finally {
    await sessionReceiver.close();
  }
}

// Process any available session
async function processNextSession(): Promise<void> {
  try {
    // Accept next available session
    const sessionReceiver = await sbClient.acceptNextSession(queueName, {
      maxAutoLockRenewalDurationInMs: 5 * 60 * 1000  // 5 minutes
    });
    
    console.log(`Processing session: ${sessionReceiver.sessionId}`);
    
    const messages = await sessionReceiver.receiveMessages(100);
    
    for (const message of messages) {
      await processOrder(message.body);
      await sessionReceiver.completeMessage(message);
    }
    
    // Set session state (checkpoint)
    await sessionReceiver.setSessionState({
      lastProcessedAt: new Date().toISOString(),
      processedCount: messages.length
    });
    
    await sessionReceiver.close();
  } catch (error) {
    if (error.code === 'SessionCannotBeLocked') {
      console.log('No sessions available');
    } else {
      throw error;
    }
  }
}
```

### 4. Topic/Subscription Pattern

#### Publishing to Topic
```typescript
const topicName = 'order-events';
const topicSender = sbClient.createSender(topicName);

async function publishOrderEvent(event: OrderEvent): Promise<void> {
  const message: ServiceBusMessage = {
    body: event,
    messageId: event.eventId,
    subject: event.eventType,  // OrderCreated, OrderShipped, OrderCompleted
    applicationProperties: {
      eventType: event.eventType,
      orderType: event.orderType,
      region: event.region,
      priority: event.priority
    }
  };
  
  await topicSender.sendMessages(message);
}
```

#### Subscription with Filters
```bicep
// Bicep: Create filtered subscriptions
resource inventorySubscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: orderEventsTopic
  name: 'inventory-updates'
  properties: {
    maxDeliveryCount: 10
    lockDuration: 'PT5M'
    defaultMessageTimeToLive: 'P14D'
  }
}

resource inventoryFilter 'Microsoft.ServiceBus/namespaces/topics/subscriptions/rules@2022-10-01-preview' = {
  parent: inventorySubscription
  name: 'inventory-events'
  properties: {
    filterType: 'SqlFilter'
    sqlFilter: {
      sqlExpression: 'eventType IN (\'OrderCreated\', \'OrderCancelled\')'
    }
  }
}

resource shippingSubscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: orderEventsTopic
  name: 'shipping-updates'
  properties: {
    maxDeliveryCount: 10
  }
}

resource shippingFilter 'Microsoft.ServiceBus/namespaces/topics/subscriptions/rules@2022-10-01-preview' = {
  parent: shippingSubscription
  name: 'shipping-events'
  properties: {
    filterType: 'SqlFilter'
    sqlFilter: {
      sqlExpression: 'eventType = \'OrderPaid\' AND region = \'EU\''
    }
  }
}

resource highPrioritySubscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: orderEventsTopic
  name: 'high-priority'
  properties: {
    maxDeliveryCount: 5
  }
}

resource highPriorityFilter 'Microsoft.ServiceBus/namespaces/topics/subscriptions/rules@2022-10-01-preview' = {
  parent: highPrioritySubscription
  name: 'high-priority-filter'
  properties: {
    filterType: 'CorrelationFilter'
    correlationFilter: {
      properties: {
        priority: 'high'
      }
    }
  }
}
```

#### Receiving from Subscription
```typescript
const topicName = 'order-events';
const subscriptionName = 'inventory-updates';

const subscriptionReceiver = sbClient.createReceiver(topicName, subscriptionName);

subscriptionReceiver.subscribe({
  processMessage: async (message) => {
    const event = message.body as OrderEvent;
    console.log(`Received ${event.eventType} for order ${event.orderId}`);
    
    await updateInventory(event);
  },
  processError: async (args) => {
    console.error('Subscription error:', args.error);
  }
});
```

### 5. Dead Letter Queue Handling

#### Dead Letter Processing
```typescript
// Create DLQ receiver
const dlqReceiver = sbClient.createReceiver(queueName, {
  subQueueType: 'deadLetter'
});

async function processDeadLetters(): Promise<void> {
  const messages = await dlqReceiver.receiveMessages(10);
  
  for (const message of messages) {
    console.log('Dead letter message:');
    console.log('  Reason:', message.deadLetterReason);
    console.log('  Description:', message.deadLetterErrorDescription);
    console.log('  Delivery count:', message.deliveryCount);
    console.log('  Enqueued time:', message.enqueuedTimeUtc);
    
    // Analyze and decide action
    if (canBeRetried(message)) {
      // Resubmit to main queue
      await sender.sendMessages({
        body: message.body,
        messageId: `${message.messageId}-retry`,
        applicationProperties: {
          ...message.applicationProperties,
          retryFromDlq: true,
          originalDeliveryCount: message.deliveryCount
        }
      });
      await dlqReceiver.completeMessage(message);
    } else {
      // Archive for manual review
      await archiveMessage(message);
      await dlqReceiver.completeMessage(message);
    }
  }
}

// Monitor DLQ
async function monitorDeadLetterQueue(): Promise<void> {
  const admin = new ServiceBusAdministrationClient(connectionString);
  const queueRuntimeProperties = await admin.getQueueRuntimeProperties(queueName);
  
  const dlqCount = queueRuntimeProperties.deadLetterMessageCount;
  
  if (dlqCount > 0) {
    console.warn(`DLQ has ${dlqCount} messages`);
    await sendAlert(`Dead letter queue has ${dlqCount} messages`);
  }
}
```

### 6. Duplicate Detection

#### Enable Duplicate Detection
```bicep
resource queue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: namespace
  name: 'orders'
  properties: {
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'  // 10 minute window
    maxDeliveryCount: 10
    lockDuration: 'PT5M'
    defaultMessageTimeToLive: 'P14D'
  }
}
```

#### Client-Side Idempotency
```typescript
// Use consistent message ID
async function sendIdempotentMessage(order: Order): Promise<void> {
  const message: ServiceBusMessage = {
    body: order,
    // Same messageId = duplicate detected and rejected
    messageId: `order-${order.id}-${order.version}`,
  };
  
  await sender.sendMessages(message);
}

// Receiver-side idempotency
const processedIds = new Set<string>();

async function processWithIdempotency(message: ServiceBusReceivedMessage): Promise<void> {
  const messageId = message.messageId as string;
  
  // Check if already processed
  if (await isProcessed(messageId)) {
    console.log(`Message ${messageId} already processed, skipping`);
    return;
  }
  
  try {
    // Process
    await processOrder(message.body);
    
    // Mark as processed (in database/cache)
    await markAsProcessed(messageId);
  } catch (error) {
    // Don't mark as processed on failure
    throw error;
  }
}
```

### 7. Retry Patterns

#### Exponential Backoff with Dead Letter
```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

async function processWithRetry(
  message: ServiceBusReceivedMessage,
  receiver: ServiceBusReceiver,
  config: RetryConfig
): Promise<void> {
  const deliveryCount = message.deliveryCount;
  
  try {
    await processMessage(message.body);
    await receiver.completeMessage(message);
  } catch (error) {
    if (deliveryCount >= config.maxRetries) {
      // Max retries exceeded, dead-letter
      await receiver.deadLetterMessage(message, {
        deadLetterReason: 'MaxRetriesExceeded',
        deadLetterErrorDescription: `Failed after ${deliveryCount} attempts: ${error.message}`
      });
    } else {
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelayMs * Math.pow(2, deliveryCount - 1),
        config.maxDelayMs
      );
      
      // Abandon to retry (after lock expires, message becomes available)
      await receiver.abandonMessage(message, {
        retryCount: deliveryCount,
        lastError: error.message
      });
      
      console.log(`Retry ${deliveryCount} for message ${message.messageId}, delay: ${delay}ms`);
    }
  }
}
```

#### Scheduled Retry
```typescript
async function processWithScheduledRetry(message: ServiceBusReceivedMessage): Promise<void> {
  const deliveryCount = message.deliveryCount;
  const maxRetries = 5;
  
  try {
    await processMessage(message.body);
    await receiver.completeMessage(message);
  } catch (error) {
    await receiver.completeMessage(message);  // Remove original
    
    if (deliveryCount < maxRetries) {
      // Schedule retry with exponential backoff
      const delayMinutes = Math.pow(2, deliveryCount);
      const retryTime = new Date(Date.now() + delayMinutes * 60 * 1000);
      
      await sender.scheduleMessages({
        body: message.body,
        messageId: `${message.messageId}-retry-${deliveryCount + 1}`,
        applicationProperties: {
          ...message.applicationProperties,
          retryCount: deliveryCount + 1,
          originalMessageId: message.messageId
        }
      }, retryTime);
    } else {
      // Send to DLQ manually
      await sendToDeadLetterTopic(message, error);
    }
  }
}
```

### 8. Transaction Pattern

#### Atomic Send Operations
```typescript
import { ServiceBusClient } from '@azure/service-bus';

async function processOrderTransaction(order: Order): Promise<void> {
  const sbClient = new ServiceBusClient(connectionString);
  
  // Create senders for different queues
  const orderSender = sbClient.createSender('orders');
  const notificationSender = sbClient.createSender('notifications');
  const auditSender = sbClient.createSender('audit-log');
  
  // Send all messages in a single transaction
  // Note: Cross-entity transactions require Premium tier
  const batch = await orderSender.createMessageBatch();
  
  batch.tryAddMessage({ body: order });
  batch.tryAddMessage({ 
    body: { type: 'OrderCreated', orderId: order.id },
    // Transfer to different queue
    applicationProperties: { transferTo: 'notifications' }
  });
  
  await orderSender.sendMessages(batch);
}
```

### 9. Message Deferral

#### Defer and Process Later
```typescript
// Defer message for later processing
async function deferMessage(message: ServiceBusReceivedMessage): Promise<void> {
  // Defer the message
  await receiver.deferMessage(message, {
    deferredReason: 'DependencyNotReady',
    requiredDependency: 'payment-service'
  });
  
  // Store sequence number for later retrieval
  const sequenceNumber = message.sequenceNumber!;
  await storeSequenceNumber(message.messageId as string, sequenceNumber);
}

// Receive deferred message
async function processDeferred(sequenceNumbers: bigint[]): Promise<void> {
  const deferredMessages = await receiver.receiveDeferredMessages(sequenceNumbers);
  
  for (const message of deferredMessages) {
    try {
      await processMessage(message.body);
      await receiver.completeMessage(message);
    } catch (error) {
      // Re-defer or dead-letter
      await receiver.deferMessage(message);
    }
  }
}
```

---

## 📐 Bicep Infrastructure

### Complete Service Bus Setup
```bicep
param namespaceName string
param location string = resourceGroup().location
param sku string = 'Standard'

resource namespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: namespaceName
  location: location
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    minimumTlsVersion: '1.2'
  }
}

// Order processing queue
resource ordersQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: namespace
  name: 'orders'
  properties: {
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    maxDeliveryCount: 10
    lockDuration: 'PT5M'
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: true
    enablePartitioning: false
    requiresSession: false
  }
}

// Order events topic
resource orderEventsTopic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: namespace
  name: 'order-events'
  properties: {
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    defaultMessageTimeToLive: 'P7D'
    enablePartitioning: false
  }
}

// Inventory subscription
resource inventorySubscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: orderEventsTopic
  name: 'inventory'
  properties: {
    maxDeliveryCount: 10
    lockDuration: 'PT5M'
    deadLetteringOnMessageExpiration: true
  }
}

resource inventoryRule 'Microsoft.ServiceBus/namespaces/topics/subscriptions/rules@2022-10-01-preview' = {
  parent: inventorySubscription
  name: 'inventory-events'
  properties: {
    filterType: 'SqlFilter'
    sqlFilter: {
      sqlExpression: 'eventType IN (\'OrderCreated\', \'OrderCancelled\')'
    }
  }
}

// Shipping subscription
resource shippingSubscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: orderEventsTopic
  name: 'shipping'
  properties: {
    maxDeliveryCount: 10
    lockDuration: 'PT5M'
  }
}

resource shippingRule 'Microsoft.ServiceBus/namespaces/topics/subscriptions/rules@2022-10-01-preview' = {
  parent: shippingSubscription
  name: 'paid-orders'
  properties: {
    filterType: 'SqlFilter'
    sqlFilter: {
      sqlExpression: 'eventType = \'OrderPaid\''
    }
  }
}

output namespaceEndpoint string = namespace.properties.serviceBusEndpoint
```

---

## 🏷️ Tags

`service-bus` `messaging` `queues` `topics` `pub-sub` `sessions` `dead-letter` `retry` `azure`
