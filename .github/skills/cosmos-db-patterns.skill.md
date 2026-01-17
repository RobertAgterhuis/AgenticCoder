# Cosmos DB Patterns Skill

## Overview

This skill provides comprehensive patterns and best practices for Azure Cosmos DB NoSQL database design, including data modeling, partition strategies, and performance optimization.

---

## Data Modeling Patterns

### 1. Embedding vs Referencing Decision Matrix

| Criteria | Embed | Reference |
|----------|-------|-----------|
| Relationship | 1:1, 1:few | 1:many, many:many |
| Data size | < 2MB total | > 2MB or unbounded |
| Update frequency | Updated together | Updated independently |
| Query pattern | Always queried together | Queried separately |
| Cardinality | < 100 items | Unbounded |

### 2. Multi-Entity Container Pattern

```typescript
// Base document interface
interface BaseDocument {
  id: string;
  pk: string;           // Partition key
  type: string;         // Entity type discriminator
  _ts?: number;
  _etag?: string;
}

// Different entity types in same container
interface Customer extends BaseDocument {
  type: 'customer';
  name: string;
  email: string;
}

interface Order extends BaseDocument {
  type: 'order';
  customerId: string;
  total: number;
  status: string;
}

// All customer data in same partition
// pk = customerId for all documents
```

### 3. Reference Pattern with Denormalization

```typescript
interface Order extends BaseDocument {
  type: 'order';
  customerId: string;
  // Denormalized customer data (cached)
  customer: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

// Update denormalized data via change feed when customer updates
```

---

## Partition Key Strategies

### Good Partition Keys

| Scenario | Partition Key | Reasoning |
|----------|--------------|-----------|
| E-commerce | `/customerId` | Natural boundary, even distribution |
| Multi-tenant SaaS | `/tenantId` | Tenant isolation, security |
| IoT | `/deviceId` | Device-level operations |
| Social media | `/userId` | User-centric queries |

### Anti-Patterns

| Anti-Pattern | Problem |
|-------------|---------|
| `/id` | Too granular, no query co-location |
| `/status` | Low cardinality, hot partitions |
| `/createdDate` | Time-series creates hot partitions |
| `/country` | Uneven distribution |

### Hierarchical Partition Keys

```bicep
// For complex multi-tenant scenarios
partitionKey: {
  paths: ['/tenantId', '/customerId', '/year']
  kind: 'MultiHash'
  version: 2
}
```

---

## Query Patterns

### Efficient Single-Partition Query

```typescript
// Always include partition key for efficiency
const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.type = 'order' 
    AND c.status = @status
    ORDER BY c._ts DESC
  `,
  parameters: [{ name: '@status', value: 'pending' }],
};

const options = {
  partitionKey: customerId,  // Critical!
  maxItemCount: 50,
};
```

### Cross-Partition Query (Use Sparingly)

```typescript
// Only when necessary - fan-out to all partitions
const options = {
  enableCrossPartitionQuery: true,
  maxDegreeOfParallelism: 10,
};
```

### Pagination with Continuation Token

```typescript
async function* paginateResults<T>(
  container: Container,
  query: SqlQuerySpec,
  partitionKey: string,
  pageSize: number = 100
): AsyncGenerator<T[]> {
  let continuation: string | undefined;
  
  do {
    const response = await container.items
      .query<T>(query, { 
        partitionKey, 
        maxItemCount: pageSize,
        continuationToken: continuation,
      })
      .fetchNext();
    
    continuation = response.continuationToken;
    yield response.resources;
  } while (continuation);
}
```

---

## Transactional Batch

```typescript
// All operations must be in same partition
async function createOrderWithItems(
  container: Container,
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const batch = container.items.batch(order.pk);
  
  batch.create(order);
  items.forEach(item => batch.create(item));
  
  const response = await batch.execute();
  
  if (!response.result?.every(r => r.statusCode < 400)) {
    throw new Error('Batch operation failed');
  }
}
```

---

## Change Feed Patterns

### Azure Functions Trigger

```typescript
// function.json binding
/*
{
  "type": "cosmosDBTrigger",
  "name": "documents",
  "direction": "in",
  "databaseName": "mydb",
  "containerName": "orders",
  "leaseContainerName": "leases",
  "createLeaseContainerIfNotExists": true
}
*/

const handler: AzureFunction = async (context, documents) => {
  for (const doc of documents) {
    switch (doc.type) {
      case 'order':
        await processOrderChange(doc);
        break;
    }
  }
};
```

### Use Cases

- Materialized views
- Real-time analytics
- Event-driven architectures
- Search index updates
- Cache invalidation

---

## Consistency Levels Quick Reference

| Level | Use Case | Latency | Availability |
|-------|----------|---------|--------------|
| Strong | Financial, inventory | Highest | Lowest |
| Bounded Staleness | Leaderboards, geo-distributed | High | Medium |
| **Session (Default)** | Shopping carts, user profiles | Low | High |
| Consistent Prefix | Social feeds, comments | Lower | Higher |
| Eventual | Counters, likes | Lowest | Highest |

---

## Indexing Policy Optimization

```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    { "path": "/type/?" },
    { "path": "/status/?" },
    { "path": "/_ts/?" }
  ],
  "excludedPaths": [
    { "path": "/*" },
    { "path": "/\"_etag\"/?" }
  ],
  "compositeIndexes": [
    [
      { "path": "/type", "order": "ascending" },
      { "path": "/_ts", "order": "descending" }
    ]
  ]
}
```

---

## Cost Optimization

| Strategy | Savings | Trade-off |
|----------|---------|-----------|
| Serverless | Up to 90% for sporadic | 5s cold start |
| Autoscale | Match demand | Max RU limit |
| Reserved capacity | 65% | 1-3 year commitment |
| Efficient queries | Reduce RU consumption | Code complexity |
| TTL | Storage savings | Data loss |

---

## RU Estimation

| Operation | Approximate RUs |
|-----------|----------------|
| Point read (1KB) | 1 RU |
| Point read (10KB) | 10 RU |
| Create (1KB) | 5 RU |
| Replace (1KB) | 10 RU |
| Delete | 5 RU |
| Query (single partition) | 2.5-5 RU per doc |
| Query (cross-partition) | 2.5-5 RU × partitions |

---

## Related Agents

- @cosmos-db-specialist - Full implementation guidance
- @bicep-specialist - Infrastructure deployment
- @backend-specialist - Application integration

---

## Tags

`cosmos-db` `nosql` `partition-key` `data-modeling` `change-feed` `consistency` `azure`
