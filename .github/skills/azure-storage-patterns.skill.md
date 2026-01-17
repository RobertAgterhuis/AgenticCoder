# Azure Storage Patterns Skill

## Overview

This skill provides patterns and best practices for Azure Storage services including Blob, Table, Queue, and Files.

---

## Blob Storage Patterns

### Block Blob Upload Patterns

```typescript
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';

// Small files (< 256MB) - Simple upload
async function uploadSmallBlob(
  containerClient: ContainerClient,
  blobName: string,
  data: Buffer
): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(data, data.length, {
    blobHTTPHeaders: {
      blobContentType: 'application/json',
      blobCacheControl: 'max-age=3600',
    },
  });
}

// Large files - Parallel upload with progress
async function uploadLargeBlob(
  blockBlobClient: BlockBlobClient,
  filePath: string
): Promise<void> {
  const fileSize = (await fs.stat(filePath)).size;
  
  await blockBlobClient.uploadFile(filePath, {
    blockSize: 4 * 1024 * 1024,     // 4MB blocks
    concurrency: 20,                 // Parallel uploads
    onProgress: (ev) => {
      console.log(`Progress: ${((ev.loadedBytes / fileSize) * 100).toFixed(1)}%`);
    },
  });
}
```

### Streaming Download

```typescript
async function downloadBlobToStream(
  blobClient: BlobClient,
  writableStream: NodeJS.WritableStream
): Promise<void> {
  const downloadResponse = await blobClient.download(0);
  
  await new Promise<void>((resolve, reject) => {
    downloadResponse.readableStreamBody
      ?.pipe(writableStream)
      .on('finish', resolve)
      .on('error', reject);
  });
}
```

---

## Blob Naming Conventions

### Best Practices

| Pattern | Example | Use Case |
|---------|---------|----------|
| Date-based | `2024/01/15/file.json` | Time-series data |
| Tenant-based | `tenant123/uploads/doc.pdf` | Multi-tenant |
| Hash prefix | `a3b2/user/profile.jpg` | Even distribution |
| Entity ID | `users/user123/avatar.png` | Entity-centric |

### Avoid Hot Partitions

```typescript
// BAD: Sequential prefix creates hot partition
`log-2024-01-15-001.json`
`log-2024-01-15-002.json`

// GOOD: Hash prefix distributes load
function getDistributedBlobName(filename: string): string {
  const hash = createHash('md5').update(filename).digest('hex').slice(0, 4);
  return `${hash}/${filename}`;
}
```

---

## SAS Token Generation

### User Delegation SAS (Recommended)

```typescript
async function generateUserDelegationSas(
  blobServiceClient: BlobServiceClient,
  containerName: string,
  blobName: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const startsOn = new Date();
  const expiresOn = new Date(startsOn.valueOf() + expiresInMinutes * 60 * 1000);
  
  // Get user delegation key (requires AAD auth)
  const userDelegationKey = await blobServiceClient.getUserDelegationKey(
    startsOn,
    expiresOn
  );
  
  const sasToken = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('r'),  // Read only
    startsOn,
    expiresOn,
    protocol: SASProtocol.Https,
  }, userDelegationKey, blobServiceClient.accountName);
  
  return `${blobServiceClient.url}${containerName}/${blobName}?${sasToken}`;
}
```

### SAS Permission Reference

| Permission | Blob | Container |
|------------|------|-----------|
| `r` | Read content | List blobs |
| `w` | Write content | - |
| `d` | Delete | Delete blobs |
| `c` | Create | Create blobs |
| `a` | Append | - |
| `t` | Tags | - |

---

## Access Tiers

| Tier | Use Case | Access Cost | Storage Cost |
|------|----------|-------------|--------------|
| Hot | Frequent access | Low | Highest |
| Cool | Infrequent (30+ days) | Medium | Lower |
| Cold | Rare access (90+ days) | Higher | Even lower |
| Archive | Long-term (180+ days) | Highest | Lowest |

### Automatic Tiering

```bicep
// Lifecycle management policy
resource policy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  name: 'default'
  parent: storageAccount
  properties: {
    policy: {
      rules: [
        {
          enabled: true
          name: 'autotier'
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: ['blockBlob']
              prefixMatch: ['logs/']
            }
            actions: {
              baseBlob: {
                tierToCool: { daysAfterModificationGreaterThan: 30 }
                tierToArchive: { daysAfterModificationGreaterThan: 180 }
                delete: { daysAfterModificationGreaterThan: 365 }
              }
            }
          }
        }
      ]
    }
  }
}
```

---

## Queue Storage Patterns

### Poison Message Handling

```typescript
async function processQueueMessage(
  queueClient: QueueClient,
  maxRetries: number = 5
): Promise<void> {
  const messages = await queueClient.receiveMessages({
    numberOfMessages: 1,
    visibilityTimeout: 30,
  });
  
  for (const message of messages.receivedMessageItems) {
    try {
      if (message.dequeueCount > maxRetries) {
        // Move to poison queue
        const poisonQueue = queueServiceClient.getQueueClient(`${queueClient.name}-poison`);
        await poisonQueue.sendMessage(message.messageText);
        await queueClient.deleteMessage(message.messageId, message.popReceipt);
        continue;
      }
      
      await processMessage(JSON.parse(message.messageText));
      await queueClient.deleteMessage(message.messageId, message.popReceipt);
    } catch (error) {
      // Message will become visible again after timeout
      console.error('Processing failed, will retry:', error);
    }
  }
}
```

### Visibility Timeout Extension

```typescript
// For long-running operations
async function processWithExtendedVisibility(
  queueClient: QueueClient,
  message: ReceivedMessageItem,
  processor: () => Promise<void>
): Promise<void> {
  const extensionInterval = setInterval(async () => {
    const response = await queueClient.updateMessage(
      message.messageId,
      message.popReceipt,
      undefined,
      60  // Extend by 60 seconds
    );
    message.popReceipt = response.popReceipt;
  }, 30000);  // Every 30 seconds
  
  try {
    await processor();
    await queueClient.deleteMessage(message.messageId, message.popReceipt);
  } finally {
    clearInterval(extensionInterval);
  }
}
```

---

## Table Storage Patterns

### Entity Design

```typescript
interface TableEntity {
  partitionKey: string;  // Group related entities
  rowKey: string;        // Unique within partition
  [key: string]: any;
}

// Example: Customer orders
// PartitionKey: customerId (queries by customer)
// RowKey: orderId (unique order)
```

### Batch Operations

```typescript
async function batchInsertEntities(
  tableClient: TableClient,
  entities: TableEntity[]
): Promise<void> {
  // Group by partition key (required for batch)
  const grouped = groupBy(entities, e => e.partitionKey);
  
  for (const [pk, pkEntities] of Object.entries(grouped)) {
    // Max 100 entities per batch, same partition
    for (const batch of chunk(pkEntities, 100)) {
      const transaction = batch.map(entity => ['create', entity] as const);
      await tableClient.submitTransaction(transaction);
    }
  }
}
```

---

## Security Best Practices

| Practice | Implementation |
|----------|----------------|
| Use AAD auth | DefaultAzureCredential over connection strings |
| Minimum SAS duration | Short expiry + refresh pattern |
| Private endpoints | Disable public access |
| Encryption | Customer-managed keys for sensitive data |
| Soft delete | Enable for blob and container recovery |
| Versioning | Enable for data protection |

---

## Bicep Deployment

```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_GRS' }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}
```

---

## Related Agents

- @storage-specialist - Full implementation guidance
- @networking-specialist - Private endpoint setup
- @bicep-specialist - Infrastructure deployment

---

## Tags

`azure-storage` `blob` `queue` `table` `sas` `lifecycle` `security`
