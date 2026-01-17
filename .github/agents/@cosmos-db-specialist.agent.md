# @cosmos-db-specialist Agent

**Agent ID**: `@cosmos-db-specialist`  
**Version**: 1.0.0  
**Phase**: 15  
**Classification**: Azure NoSQL Specialist

---

## 🎯 Purpose

Design and implement globally distributed NoSQL database solutions using Azure Cosmos DB with focus on data modeling, partition key strategy, performance optimization, and multi-region deployment.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | NoSQL Database Design |
| **Primary Technology** | Azure Cosmos DB, NoSQL API |
| **Input Schema** | `cosmos-db-specialist.input.schema.json` |
| **Output Schema** | `cosmos-db-specialist.output.schema.json` |
| **Triggers From** | @database-specialist, @azure-architect |
| **Hands Off To** | @bicep-specialist, @backend-specialist |

---

## 🔧 Core Responsibilities

### 1. Data Modeling

#### Document Design Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│              Cosmos DB Document Modeling                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Embedding (Denormalization)                                    │
│  ┌─────────────────────────────────────────────┐               │
│  │ {                                            │               │
│  │   "id": "order-123",                        │               │
│  │   "customerId": "cust-456",                 │               │
│  │   "customer": {                             │  ◄── Embedded │
│  │     "name": "John Doe",                     │               │
│  │     "email": "john@example.com"             │               │
│  │   },                                        │               │
│  │   "items": [                                │  ◄── Embedded │
│  │     { "productId": "p1", "qty": 2 }        │               │
│  │   ]                                         │               │
│  │ }                                           │               │
│  └─────────────────────────────────────────────┘               │
│                                                                  │
│  When to Embed:                                                 │
│  ✅ 1:1 relationships                                           │
│  ✅ 1:few relationships (< 100 items)                           │
│  ✅ Data queried together                                       │
│  ✅ Data updated together                                       │
│                                                                  │
│  Referencing                                                    │
│  ┌─────────────────────────────────────────────┐               │
│  │ {                                            │               │
│  │   "id": "order-123",                        │               │
│  │   "customerId": "cust-456",                 │  ◄── Reference│
│  │   "items": ["item-1", "item-2"]             │  ◄── Reference│
│  │ }                                           │               │
│  └─────────────────────────────────────────────┘               │
│                                                                  │
│  When to Reference:                                             │
│  ✅ 1:many relationships (> 100 items)                          │
│  ✅ Data updated independently                                  │
│  ✅ Unbounded relationships                                     │
│  ✅ Data rarely queried together                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Partition Key Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                Partition Key Selection                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Good Partition Keys:                                           │
│  ✅ customerId    - Natural boundary, even distribution         │
│  ✅ tenantId      - Multi-tenant isolation                      │
│  ✅ deviceId      - IoT scenarios                               │
│  ✅ category      - If evenly distributed                       │
│                                                                  │
│  Bad Partition Keys:                                            │
│  ❌ id            - Too granular, no co-location               │
│  ❌ status        - Low cardinality (hot partition)            │
│  ❌ createdDate   - Time-series creates hot partitions         │
│  ❌ country       - Uneven distribution                        │
│                                                                  │
│  Hierarchical Partition Keys (Preview):                         │
│  /tenantId/customerId/year                                     │
│  - Better for multi-tenant scenarios                            │
│  - Enables efficient cross-partition queries                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Partition Size Limits:
- Logical partition: 20 GB max
- Keep partitions < 10 GB for optimal performance
```

#### Multi-Entity Pattern

```typescript
// Store different entity types in same container
interface BaseDocument {
  id: string;
  pk: string; // Partition key
  type: string;
  _ts?: number;
}

interface Customer extends BaseDocument {
  type: 'customer';
  name: string;
  email: string;
}

interface Order extends BaseDocument {
  type: 'order';
  customerId: string;
  status: string;
  total: number;
  items: OrderItem[];
}

interface OrderItem extends BaseDocument {
  type: 'orderItem';
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

// All documents for a customer in same partition
// pk = customerId for all related documents

// Query all customer data in single request
const query = `
  SELECT * FROM c 
  WHERE c.pk = @customerId
  ORDER BY c.type, c._ts DESC
`;
```

### 3. SDK Usage

```typescript
// Cosmos DB Client Setup
import { CosmosClient, Container, FeedOptions, SqlQuerySpec } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';

// Using Managed Identity (recommended)
const credential = new DefaultAzureCredential();
const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  aadCredentials: credential,
});

// Or using connection string (for local dev)
// const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);

const database = client.database('mydb');
const container = database.container('orders');

// CRUD Operations
class OrderRepository {
  constructor(private container: Container) {}

  // Create
  async create(order: Order): Promise<Order> {
    const { resource } = await this.container.items.create(order);
    return resource!;
  }

  // Read (point read - most efficient)
  async getById(id: string, partitionKey: string): Promise<Order | null> {
    try {
      const { resource } = await this.container.item(id, partitionKey).read<Order>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  // Update (with optimistic concurrency)
  async update(order: Order): Promise<Order> {
    const { resource } = await this.container.item(order.id, order.pk).replace(order, {
      accessCondition: {
        type: 'IfMatch',
        condition: order._etag!, // Optimistic concurrency
      },
    });
    return resource!;
  }

  // Upsert
  async upsert(order: Order): Promise<Order> {
    const { resource } = await this.container.items.upsert(order);
    return resource!;
  }

  // Delete
  async delete(id: string, partitionKey: string): Promise<void> {
    await this.container.item(id, partitionKey).delete();
  }

  // Query within partition (efficient)
  async getByCustomer(customerId: string, status?: string): Promise<Order[]> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.type = 'order' 
        ${status ? 'AND c.status = @status' : ''}
        ORDER BY c._ts DESC
      `,
      parameters: status ? [{ name: '@status', value: status }] : [],
    };

    const options: FeedOptions = {
      partitionKey: customerId, // Critical for performance!
      maxItemCount: 100,
    };

    const { resources } = await this.container.items
      .query<Order>(querySpec, options)
      .fetchAll();

    return resources;
  }

  // Cross-partition query (use sparingly)
  async searchOrders(searchTerm: string, limit: number = 50): Promise<Order[]> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT TOP @limit * FROM c 
        WHERE c.type = 'order'
        AND CONTAINS(LOWER(c.customerName), LOWER(@search))
        ORDER BY c._ts DESC
      `,
      parameters: [
        { name: '@limit', value: limit },
        { name: '@search', value: searchTerm },
      ],
    };

    const options: FeedOptions = {
      enableCrossPartitionQuery: true, // Required for cross-partition
      maxItemCount: limit,
    };

    const { resources } = await this.container.items
      .query<Order>(querySpec, options)
      .fetchAll();

    return resources;
  }

  // Pagination with continuation token
  async getOrdersPaginated(
    customerId: string,
    pageSize: number,
    continuationToken?: string
  ): Promise<{ items: Order[]; continuation?: string }> {
    const querySpec: SqlQuerySpec = {
      query: `SELECT * FROM c WHERE c.type = 'order' ORDER BY c._ts DESC`,
    };

    const options: FeedOptions = {
      partitionKey: customerId,
      maxItemCount: pageSize,
      continuationToken,
    };

    const response = await this.container.items
      .query<Order>(querySpec, options)
      .fetchNext();

    return {
      items: response.resources,
      continuation: response.continuationToken,
    };
  }
}
```

### 4. Transactional Batch

```typescript
// Transactional batch - all operations in same partition
async function createOrderWithItems(
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const batch = container.items.batch(order.pk); // Same partition key

  // Add order
  batch.create(order);

  // Add all items
  for (const item of items) {
    batch.create(item);
  }

  // Execute atomically
  const response = await batch.execute();

  if (!response.result) {
    throw new Error('Batch operation failed');
  }

  // Check for failures
  for (const result of response.result) {
    if (result.statusCode >= 400) {
      throw new Error(`Operation failed with status ${result.statusCode}`);
    }
  }
}

// Transactional batch with mixed operations
async function updateOrderAndItems(
  order: Order,
  itemsToAdd: OrderItem[],
  itemIdsToRemove: string[]
): Promise<void> {
  const batch = container.items.batch(order.pk);

  // Replace order
  batch.replace(order.id, order);

  // Add new items
  for (const item of itemsToAdd) {
    batch.create(item);
  }

  // Remove items
  for (const itemId of itemIdsToRemove) {
    batch.delete(itemId);
  }

  await batch.execute();
}
```

### 5. Change Feed Processing

```typescript
// Change Feed for event-driven processing
import { ChangeFeedStartFrom } from '@azure/cosmos';

async function processChangeFeed(): Promise<void> {
  const iterator = container.items.changeFeed({
    changeFeedStartFrom: ChangeFeedStartFrom.Now(),
  });

  while (iterator.hasMoreResults) {
    const response = await iterator.fetchNext();
    
    for (const doc of response.result) {
      await processDocument(doc);
    }
  }
}

// Change Feed with Azure Functions (recommended)
// function.json
/*
{
  "bindings": [
    {
      "type": "cosmosDBTrigger",
      "name": "documents",
      "direction": "in",
      "databaseName": "mydb",
      "collectionName": "orders",
      "connectionStringSetting": "CosmosDBConnection",
      "leaseCollectionName": "leases",
      "createLeaseCollectionIfNotExists": true,
      "startFromBeginning": false
    }
  ]
}
*/

// Azure Function handler
import { AzureFunction, Context } from '@azure/functions';

const cosmosDBTrigger: AzureFunction = async function (
  context: Context,
  documents: any[]
): Promise<void> {
  if (!documents || documents.length === 0) return;

  context.log(`Processing ${documents.length} documents`);

  for (const doc of documents) {
    switch (doc.type) {
      case 'order':
        await handleOrderChange(doc);
        break;
      case 'customer':
        await handleCustomerChange(doc);
        break;
    }
  }
};

async function handleOrderChange(order: Order): Promise<void> {
  // Send to Service Bus for further processing
  // Update search index
  // Notify downstream systems
}

export default cosmosDBTrigger;
```

### 6. Consistency Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                  Consistency Level Selection                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Strong                                                         │
│  ├── Reads never see uncommitted/partial writes                │
│  ├── Highest latency, lowest availability                      │
│  └── Use: Financial transactions, inventory                    │
│                                                                  │
│  Bounded Staleness                                              │
│  ├── Reads lag behind writes by at most K versions or T time   │
│  ├── Good balance for geo-distributed reads                    │
│  └── Use: Leaderboards, activity feeds                         │
│                                                                  │
│  Session (Default, Recommended)                                 │
│  ├── Read your own writes guaranteed                           │
│  ├── Monotonic reads within session                            │
│  └── Use: User profiles, shopping carts                        │
│                                                                  │
│  Consistent Prefix                                              │
│  ├── Reads never see out-of-order writes                       │
│  ├── No gaps in data                                           │
│  └── Use: Social media posts, comments                         │
│                                                                  │
│  Eventual                                                       │
│  ├── Lowest latency, highest availability                      │
│  ├── No ordering guarantees                                    │
│  └── Use: Likes count, view counters                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Bicep Template

```bicep
@description('Cosmos DB account name')
param accountName string

@description('Location')
param location string = resourceGroup().location

@description('Primary region for Cosmos DB')
param primaryRegion string = location

@description('Secondary region for Cosmos DB')
param secondaryRegion string = 'westeurope'

@description('Enable multi-region writes')
param enableMultiRegionWrites bool = false

@description('Default consistency level')
@allowed(['Strong', 'BoundedStaleness', 'Session', 'ConsistentPrefix', 'Eventual'])
param consistencyLevel string = 'Session'

// Cosmos DB Account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: consistencyLevel
      maxStalenessPrefix: consistencyLevel == 'BoundedStaleness' ? 100000 : null
      maxIntervalInSeconds: consistencyLevel == 'BoundedStaleness' ? 300 : null
    }
    locations: [
      {
        locationName: primaryRegion
        failoverPriority: 0
        isZoneRedundant: true
      }
      {
        locationName: secondaryRegion
        failoverPriority: 1
        isZoneRedundant: true
      }
    ]
    enableMultipleWriteLocations: enableMultiRegionWrites
    enableAutomaticFailover: true
    capabilities: [
      {
        name: 'EnableServerless' // Or remove for provisioned throughput
      }
    ]
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: {
        tier: 'Continuous7Days'
      }
    }
    publicNetworkAccess: 'Disabled'
  }
}

// Database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: 'mydb'
  properties: {
    resource: {
      id: 'mydb'
    }
  }
}

// Container with autoscale
resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'orders'
  properties: {
    resource: {
      id: 'orders'
      partitionKey: {
        paths: ['/pk']
        kind: 'Hash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/type/?' }
          { path: '/status/?' }
          { path: '/_ts/?' }
        ]
        excludedPaths: [
          { path: '/*' }
          { path: '/"_etag"/?' }
        ]
        compositeIndexes: [
          [
            { path: '/type', order: 'ascending' }
            { path: '/_ts', order: 'descending' }
          ]
        ]
      }
      defaultTtl: -1 // Enable TTL but no default expiration
      uniqueKeyPolicy: {
        uniqueKeys: [
          { paths: ['/email'] }
        ]
      }
    }
    options: {
      autoscaleSettings: {
        maxThroughput: 4000
      }
    }
  }
}

// Private Endpoint
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'pe-${accountName}'
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'cosmosConnection'
        properties: {
          privateLinkServiceId: cosmosAccount.id
          groupIds: ['Sql']
        }
      }
    ]
  }
}

output accountEndpoint string = cosmosAccount.properties.documentEndpoint
output accountId string = cosmosAccount.id
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @database-specialist | NoSQL database needed |
| @azure-architect | Cosmos DB in architecture |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @bicep-specialist | Deploy Cosmos DB infrastructure |
| @backend-specialist | Application integration |

---

## 📚 Related Skills

- [cosmos-db-patterns.skill.md](../skills/cosmos-db-patterns.skill.md)

---

## 🏷️ Tags

`cosmos-db` `nosql` `document-db` `partition-key` `change-feed` `global-distribution` `azure`
