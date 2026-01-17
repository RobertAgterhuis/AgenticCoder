# @event-driven-architect Agent

**Agent ID**: `@event-driven-architect`  
**Version**: 1.0.0  
**Phase**: 5 (Architecture Design)  
**Purpose**: Design and implement event-driven architectures for real-time, loosely coupled systems  
**Triggers From**: @architect, @microservices-architect, @azure-architect  
**Hands Off To**: @backend-specialist, @serverless-specialist, @bicep-specialist

---

## Core Responsibilities

### 1. Event Design
- Event schema design and naming conventions
- Event versioning strategies
- Payload structure optimization
- Metadata standards
- Event catalog management

### 2. Messaging Patterns
- Publish/Subscribe patterns
- Point-to-Point messaging
- Request/Reply patterns
- Event streaming
- Dead letter handling

### 3. Event Infrastructure
- Azure Service Bus configuration
- Azure Event Hubs for streaming
- Azure Event Grid for reactive events
- Message ordering guarantees
- Partitioning strategies

### 4. Event Processing
- Event handlers design
- Event aggregation patterns
- Event filtering and routing
- Replay capability
- Idempotency implementation

---

## Event Flow Architecture

### Reference Architecture

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Producer   │────▶│   Event Bus     │────▶│   Consumer   │
│  (Service A) │     │ (Service Bus)   │     │  (Service B) │
└──────────────┘     └─────────────────┘     └──────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Event Store    │
                     │  (Cosmos DB)    │
                     └─────────────────┘
```

### Multi-Consumer Pattern

```
                              ┌───────────────────┐
                              │  Notification     │
                         ┌───▶│  Service          │
                         │    └───────────────────┘
┌──────────────┐         │    ┌───────────────────┐
│  Order       │    Topic│    │  Analytics        │
│  Service     │────────▶├───▶│  Service          │
└──────────────┘  Events │    └───────────────────┘
                         │    ┌───────────────────┐
                         └───▶│  Inventory        │
                              │  Service          │
                              └───────────────────┘
```

---

## Event Design Patterns

### Event Schema Standards

```typescript
// Base Event Interface
interface DomainEvent<T = unknown> {
  // Metadata
  eventId: string;          // Unique event identifier (UUID)
  eventType: string;        // Fully qualified event type
  eventVersion: string;     // Schema version (semver)
  timestamp: string;        // ISO 8601 timestamp
  correlationId: string;    // Request correlation
  causationId?: string;     // ID of event that caused this
  
  // Source information
  source: {
    service: string;        // Originating service
    instance?: string;      // Service instance ID
    environment: string;    // dev, staging, prod
  };
  
  // Actor information
  actor?: {
    type: 'user' | 'service' | 'system';
    id: string;
    name?: string;
  };
  
  // Event payload
  data: T;
  
  // Optional metadata
  metadata?: Record<string, unknown>;
}

// Concrete Event Example
interface OrderCreatedEvent extends DomainEvent<{
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  currency: string;
}> {
  eventType: 'order.created';
}
```

### Event Naming Conventions

```typescript
// Event Type Naming: {domain}.{entity}.{past-tense-action}
const eventTypeExamples = {
  // Order domain
  'order.created': 'Order was created',
  'order.confirmed': 'Order was confirmed',
  'order.shipped': 'Order was shipped',
  'order.delivered': 'Order was delivered',
  'order.cancelled': 'Order was cancelled',
  
  // Payment domain
  'payment.initiated': 'Payment was initiated',
  'payment.completed': 'Payment was completed',
  'payment.failed': 'Payment failed',
  'payment.refunded': 'Payment was refunded',
  
  // User domain
  'user.registered': 'User registered',
  'user.verified': 'User email verified',
  'user.profile-updated': 'User profile updated',
  'user.deactivated': 'User account deactivated'
};
```

### Event Versioning

```typescript
// Schema Registry Pattern
interface EventSchema {
  eventType: string;
  version: string;
  schema: JSONSchema;
  deprecated?: boolean;
  deprecationDate?: string;
  migrateTo?: string;
}

// Version Migration
class EventMigrator {
  private migrations: Map<string, MigrationFn> = new Map();

  register(fromVersion: string, toVersion: string, migrate: MigrationFn): void {
    this.migrations.set(`${fromVersion}->${toVersion}`, migrate);
  }

  migrate<T>(event: DomainEvent<unknown>, targetVersion: string): DomainEvent<T> {
    let current = event;
    
    while (current.eventVersion !== targetVersion) {
      const nextVersion = this.getNextVersion(current.eventVersion, targetVersion);
      const key = `${current.eventVersion}->${nextVersion}`;
      const migrateFn = this.migrations.get(key);
      
      if (!migrateFn) {
        throw new Error(`No migration path from ${current.eventVersion} to ${nextVersion}`);
      }
      
      current = migrateFn(current);
    }
    
    return current as DomainEvent<T>;
  }
}

// Example Migration
migrator.register('1.0.0', '2.0.0', (event) => ({
  ...event,
  eventVersion: '2.0.0',
  data: {
    ...event.data,
    // Split 'name' into 'firstName' and 'lastName'
    firstName: event.data.name.split(' ')[0],
    lastName: event.data.name.split(' ').slice(1).join(' '),
  }
}));
```

---

## Azure Service Bus Patterns

### Topic/Subscription Setup

```typescript
// Service Bus Configuration
import { 
  ServiceBusClient, 
  ServiceBusAdministrationClient,
  CreateSubscriptionOptions 
} from '@azure/service-bus';

export class ServiceBusManager {
  private adminClient: ServiceBusAdministrationClient;
  private client: ServiceBusClient;

  constructor(connectionString: string) {
    this.adminClient = new ServiceBusAdministrationClient(connectionString);
    this.client = new ServiceBusClient(connectionString);
  }

  // Create topic with partitioning
  async createTopic(topicName: string): Promise<void> {
    if (!(await this.adminClient.topicExists(topicName))) {
      await this.adminClient.createTopic(topicName, {
        enablePartitioning: true,
        maxSizeInMegabytes: 5120,
        defaultMessageTimeToLive: 'P14D', // 14 days
        requiresDuplicateDetection: true,
        duplicateDetectionHistoryTimeWindow: 'PT10M' // 10 minutes
      });
    }
  }

  // Create subscription with SQL filter
  async createSubscription(
    topicName: string,
    subscriptionName: string,
    eventTypes: string[]
  ): Promise<void> {
    const options: CreateSubscriptionOptions = {
      lockDuration: 'PT5M', // 5 minutes
      maxDeliveryCount: 10,
      deadLetteringOnMessageExpiration: true,
      enableBatchedOperations: true
    };

    if (!(await this.adminClient.subscriptionExists(topicName, subscriptionName))) {
      await this.adminClient.createSubscription(topicName, subscriptionName, options);
      
      // Add event type filter
      const filterExpression = eventTypes
        .map(t => `eventType = '${t}'`)
        .join(' OR ');
      
      await this.adminClient.createRule(topicName, subscriptionName, 'EventTypeFilter', {
        filter: { sqlExpression: filterExpression }
      });
      
      // Remove default rule
      await this.adminClient.deleteRule(topicName, subscriptionName, '$Default');
    }
  }
}
```

### Event Publisher

```typescript
import { ServiceBusClient, ServiceBusSender, ServiceBusMessage } from '@azure/service-bus';

export class EventPublisher {
  private senders: Map<string, ServiceBusSender> = new Map();

  constructor(private client: ServiceBusClient) {}

  async publish<T>(
    topicName: string,
    event: DomainEvent<T>
  ): Promise<void> {
    const sender = await this.getSender(topicName);
    
    const message: ServiceBusMessage = {
      body: event,
      messageId: event.eventId,
      correlationId: event.correlationId,
      contentType: 'application/json',
      applicationProperties: {
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        source: event.source.service
      },
      // Set partition key for ordering
      partitionKey: this.getPartitionKey(event)
    };

    await sender.sendMessages(message);
  }

  async publishBatch<T>(
    topicName: string,
    events: DomainEvent<T>[]
  ): Promise<void> {
    const sender = await this.getSender(topicName);
    const batch = await sender.createMessageBatch();
    
    for (const event of events) {
      const message: ServiceBusMessage = {
        body: event,
        messageId: event.eventId,
        correlationId: event.correlationId,
        applicationProperties: {
          eventType: event.eventType
        }
      };
      
      if (!batch.tryAddMessage(message)) {
        // Batch is full, send and create new
        await sender.sendMessages(batch);
        const newBatch = await sender.createMessageBatch();
        newBatch.tryAddMessage(message);
      }
    }
    
    // Send remaining messages
    if (batch.count > 0) {
      await sender.sendMessages(batch);
    }
  }

  private getPartitionKey<T>(event: DomainEvent<T>): string {
    // Use aggregate ID for ordering within aggregate
    return event.data['aggregateId'] || event.correlationId;
  }

  private async getSender(topicName: string): Promise<ServiceBusSender> {
    if (!this.senders.has(topicName)) {
      this.senders.set(topicName, this.client.createSender(topicName));
    }
    return this.senders.get(topicName)!;
  }
}
```

### Event Consumer

```typescript
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ServiceBusReceivedMessage,
  ProcessErrorArgs
} from '@azure/service-bus';

interface EventHandler<T = unknown> {
  eventType: string;
  handle(event: DomainEvent<T>): Promise<void>;
}

export class EventConsumer {
  private handlers: Map<string, EventHandler> = new Map();
  private receivers: ServiceBusReceiver[] = [];

  constructor(private client: ServiceBusClient) {}

  register<T>(handler: EventHandler<T>): void {
    this.handlers.set(handler.eventType, handler);
  }

  async subscribe(topicName: string, subscriptionName: string): Promise<void> {
    const receiver = this.client.createReceiver(topicName, subscriptionName, {
      receiveMode: 'peekLock',
      maxAutoLockRenewalDurationInMs: 300000 // 5 minutes
    });

    this.receivers.push(receiver);

    receiver.subscribe({
      processMessage: async (message) => {
        await this.processMessage(message, receiver);
      },
      processError: async (args) => {
        await this.processError(args);
      }
    }, {
      maxConcurrentCalls: 10,
      autoCompleteMessages: false
    });
  }

  private async processMessage(
    message: ServiceBusReceivedMessage,
    receiver: ServiceBusReceiver
  ): Promise<void> {
    const event = message.body as DomainEvent;
    const handler = this.handlers.get(event.eventType);

    if (!handler) {
      console.warn(`No handler for event type: ${event.eventType}`);
      await receiver.completeMessage(message);
      return;
    }

    try {
      await handler.handle(event);
      await receiver.completeMessage(message);
    } catch (error) {
      if (message.deliveryCount >= 10) {
        // Max retries exceeded, dead letter
        await receiver.deadLetterMessage(message, {
          deadLetterReason: 'MaxRetriesExceeded',
          deadLetterErrorDescription: error.message
        });
      } else {
        // Abandon for retry
        await receiver.abandonMessage(message);
      }
    }
  }

  private async processError(args: ProcessErrorArgs): Promise<void> {
    console.error('Error processing message:', {
      error: args.error,
      errorSource: args.errorSource,
      entityPath: args.entityPath
    });
  }

  async close(): Promise<void> {
    await Promise.all(this.receivers.map(r => r.close()));
  }
}
```

---

## Azure Event Hubs (Streaming)

### Event Hubs Producer

```typescript
import { EventHubProducerClient, EventData } from '@azure/event-hubs';

export class EventStreamPublisher {
  private producer: EventHubProducerClient;

  constructor(connectionString: string, eventHubName: string) {
    this.producer = new EventHubProducerClient(connectionString, eventHubName);
  }

  async publish<T>(event: DomainEvent<T>, partitionKey?: string): Promise<void> {
    const eventData: EventData = {
      body: event,
      properties: {
        eventType: event.eventType,
        eventVersion: event.eventVersion
      }
    };

    const batch = await this.producer.createBatch({
      partitionKey: partitionKey || event.correlationId
    });

    batch.tryAdd(eventData);
    await this.producer.sendBatch(batch);
  }

  async publishStream<T>(
    events: AsyncIterable<DomainEvent<T>>,
    partitionKey?: string
  ): Promise<void> {
    let batch = await this.producer.createBatch({ partitionKey });
    
    for await (const event of events) {
      const eventData: EventData = {
        body: event,
        properties: { eventType: event.eventType }
      };
      
      if (!batch.tryAdd(eventData)) {
        await this.producer.sendBatch(batch);
        batch = await this.producer.createBatch({ partitionKey });
        batch.tryAdd(eventData);
      }
    }
    
    if (batch.count > 0) {
      await this.producer.sendBatch(batch);
    }
  }
}
```

### Event Hubs Consumer

```typescript
import {
  EventHubConsumerClient,
  earliestEventPosition,
  CheckpointStore,
  ReceivedEventData
} from '@azure/event-hubs';
import { ContainerClient } from '@azure/storage-blob';
import { BlobCheckpointStore } from '@azure/eventhubs-checkpointstore-blob';

export class EventStreamConsumer {
  private consumer: EventHubConsumerClient;
  private checkpointStore: CheckpointStore;
  private subscription: { close: () => Promise<void> } | null = null;

  constructor(
    connectionString: string,
    eventHubName: string,
    consumerGroup: string,
    storageConnectionString: string,
    containerName: string
  ) {
    const containerClient = new ContainerClient(
      storageConnectionString,
      containerName
    );
    
    this.checkpointStore = new BlobCheckpointStore(containerClient);
    
    this.consumer = new EventHubConsumerClient(
      consumerGroup,
      connectionString,
      eventHubName,
      this.checkpointStore
    );
  }

  async subscribe(
    handler: (event: DomainEvent) => Promise<void>,
    options?: { startPosition?: 'earliest' | 'latest' }
  ): Promise<void> {
    this.subscription = this.consumer.subscribe({
      processEvents: async (events, context) => {
        for (const event of events) {
          const domainEvent = event.body as DomainEvent;
          await handler(domainEvent);
        }
        
        // Checkpoint after processing batch
        if (events.length > 0) {
          await context.updateCheckpoint(events[events.length - 1]);
        }
      },
      processError: async (err, context) => {
        console.error(`Error in partition ${context.partitionId}:`, err);
      }
    }, {
      startPosition: options?.startPosition === 'earliest'
        ? earliestEventPosition
        : undefined
    });
  }

  async close(): Promise<void> {
    if (this.subscription) {
      await this.subscription.close();
    }
    await this.consumer.close();
  }
}
```

---

## Azure Event Grid (Reactive)

### Event Grid Publisher

```typescript
import { EventGridPublisherClient, AzureKeyCredential } from '@azure/eventgrid';

export class EventGridPublisher {
  private client: EventGridPublisherClient;

  constructor(endpoint: string, accessKey: string) {
    this.client = new EventGridPublisherClient(
      endpoint,
      'CloudEvent',
      new AzureKeyCredential(accessKey)
    );
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    await this.client.send([{
      type: event.eventType,
      source: `/${event.source.service}/${event.source.environment}`,
      id: event.eventId,
      time: new Date(event.timestamp),
      data: event.data,
      datacontenttype: 'application/json'
    }]);
  }
}

// Event Grid Trigger (Azure Function)
import { app, EventGridEvent } from '@azure/functions';

app.eventGrid('processEvent', {
  handler: async (event: EventGridEvent, context) => {
    context.log('Event received:', event.eventType);
    
    const domainEvent = {
      eventId: event.id,
      eventType: event.eventType,
      timestamp: event.eventTime,
      data: event.data
    };
    
    // Process based on event type
    switch (event.eventType) {
      case 'order.created':
        await handleOrderCreated(domainEvent);
        break;
      case 'payment.completed':
        await handlePaymentCompleted(domainEvent);
        break;
    }
  }
});
```

---

## Idempotency Patterns

```typescript
// Idempotent Event Handler
export class IdempotentEventHandler {
  constructor(
    private eventStore: EventStore,
    private handler: EventHandler
  ) {}

  async handle<T>(event: DomainEvent<T>): Promise<void> {
    // Check if already processed
    const processed = await this.eventStore.isProcessed(event.eventId);
    
    if (processed) {
      console.log(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    // Process in transaction
    await this.eventStore.transaction(async (tx) => {
      // Mark as processing
      await tx.markProcessing(event.eventId);
      
      // Handle event
      await this.handler.handle(event);
      
      // Mark as completed
      await tx.markCompleted(event.eventId);
    });
  }
}

// Deduplication with Redis
import { Redis } from 'ioredis';

export class RedisDeduplicator {
  constructor(private redis: Redis) {}

  async isDuplicate(eventId: string, ttlSeconds: number = 86400): Promise<boolean> {
    const key = `event:processed:${eventId}`;
    const result = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === null; // null means key already existed
  }
}
```

---

## Dead Letter Handling

```typescript
// Dead Letter Processor
export class DeadLetterProcessor {
  constructor(
    private client: ServiceBusClient,
    private alertService: AlertService
  ) {}

  async processDeadLetters(
    topicName: string,
    subscriptionName: string
  ): Promise<void> {
    const receiver = this.client.createReceiver(
      topicName,
      subscriptionName,
      { subQueueType: 'deadLetter' }
    );

    const messages = await receiver.receiveMessages(100, { maxWaitTimeInMs: 5000 });
    
    for (const message of messages) {
      const event = message.body as DomainEvent;
      
      // Log for investigation
      await this.logDeadLetter({
        eventId: event.eventId,
        eventType: event.eventType,
        deadLetterReason: message.deadLetterReason,
        deadLetterErrorDescription: message.deadLetterErrorDescription,
        enqueuedTime: message.enqueuedTimeUtc,
        deliveryCount: message.deliveryCount
      });

      // Alert if critical event
      if (this.isCriticalEvent(event.eventType)) {
        await this.alertService.sendAlert({
          severity: 'high',
          message: `Critical event in dead letter: ${event.eventType}`,
          details: { eventId: event.eventId }
        });
      }

      // Complete (remove from dead letter) after logging
      await receiver.completeMessage(message);
    }

    await receiver.close();
  }

  private isCriticalEvent(eventType: string): boolean {
    const criticalTypes = ['payment.completed', 'order.created', 'user.registered'];
    return criticalTypes.includes(eventType);
  }
}
```

---

## Event Replay

```typescript
// Event Replay Service
export class EventReplayService {
  constructor(
    private eventStore: EventStore,
    private publisher: EventPublisher
  ) {}

  async replayEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<void> {
    const events = await this.eventStore.getEvents(
      aggregateId,
      fromVersion,
      toVersion
    );

    for (const event of events) {
      // Mark as replay
      const replayEvent = {
        ...event,
        metadata: {
          ...event.metadata,
          isReplay: true,
          originalTimestamp: event.timestamp,
          replayTimestamp: new Date().toISOString()
        }
      };

      await this.publisher.publish('events', replayEvent);
    }
  }

  async replayByTimeRange(
    startTime: Date,
    endTime: Date,
    eventTypes?: string[]
  ): Promise<number> {
    const events = await this.eventStore.getEventsByTimeRange(
      startTime,
      endTime,
      eventTypes
    );

    let count = 0;
    for (const event of events) {
      await this.publisher.publish('events', {
        ...event,
        metadata: { ...event.metadata, isReplay: true }
      });
      count++;
    }

    return count;
  }
}
```

---

## Bicep Infrastructure

```bicep
// event-driven-infrastructure.bicep
targetScope = 'resourceGroup'

param location string = resourceGroup().location
param environmentName string
param topics array = ['orders', 'payments', 'inventory', 'notifications']

// Service Bus Namespace
resource serviceBus 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: 'sb-${environmentName}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    zoneRedundant: true
  }
}

// Topics
resource sbTopics 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = [for topic in topics: {
  parent: serviceBus
  name: topic
  properties: {
    enablePartitioning: true
    maxSizeInMegabytes: 5120
    defaultMessageTimeToLive: 'P14D'
    requiresDuplicateDetection: true
  }
}]

// Event Hubs for Streaming
resource eventHubNamespace 'Microsoft.EventHub/namespaces@2022-10-01-preview' = {
  name: 'evhns-${environmentName}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
    capacity: 2
  }
  properties: {
    isAutoInflateEnabled: true
    maximumThroughputUnits: 10
  }
}

resource eventHub 'Microsoft.EventHub/namespaces/eventhubs@2022-10-01-preview' = {
  parent: eventHubNamespace
  name: 'event-stream'
  properties: {
    partitionCount: 4
    messageRetentionInDays: 7
  }
}

// Event Grid Topic
resource eventGridTopic 'Microsoft.EventGrid/topics@2022-06-15' = {
  name: 'egt-${environmentName}'
  location: location
  properties: {
    inputSchema: 'CloudEventSchemaV1_0'
    publicNetworkAccess: 'Enabled'
  }
}
```

---

## Anti-Patterns to Avoid

### ❌ Event Payload Too Large
```typescript
// BAD: Including full entity in event
{
  eventType: 'order.created',
  data: {
    order: { /* entire order with 100 line items */ },
    customer: { /* full customer profile */ },
    products: [ /* all product details */ ]
  }
}

// GOOD: Include only IDs and essential data
{
  eventType: 'order.created',
  data: {
    orderId: 'ord-123',
    customerId: 'cust-456',
    itemCount: 5,
    totalAmount: 299.99
  }
}
```

### ❌ Synchronous Event Handling
```typescript
// BAD: Waiting for all handlers
await Promise.all([
  handler1.handle(event),
  handler2.handle(event),
  handler3.handle(event)
]);

// GOOD: Fire and forget, each handler processes independently
await publisher.publish(event);
// Handlers subscribe and process asynchronously
```

---

## Input/Output Schema

### Input Schema
```json
{
  "event_architecture_request": {
    "domain": "e-commerce",
    "event_volume": "10000/hour",
    "ordering_requirements": "per-aggregate",
    "retention_days": 30,
    "replay_needed": true
  }
}
```

### Output Schema
```json
{
  "event_architecture": {
    "events_catalog": [...],
    "infrastructure": {...},
    "subscriptions": [...],
    "dead_letter_strategy": {...}
  }
}
```

---

## Related Skills
- `event-sourcing.skill.md` - Event sourcing patterns
- `cqrs-patterns.skill.md` - CQRS implementation
- `domain-modeling.skill.md` - DDD event modeling

## Related Agents
- @microservices-architect - Service decomposition
- @serverless-specialist - Function-based handlers
- @azure-architect - Azure infrastructure
