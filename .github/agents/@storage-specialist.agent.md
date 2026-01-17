# @storage-specialist Agent

**Agent ID**: `@storage-specialist`  
**Version**: 1.0.0  
**Phase**: 15  
**Classification**: Azure Storage Specialist

---

## 🎯 Purpose

Design and implement scalable data storage solutions using Azure Blob Storage, Table Storage, Queue Storage, and Azure Files with focus on performance, security, and cost optimization.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | Cloud Storage Solutions |
| **Primary Technology** | Azure Storage Services |
| **Input Schema** | `storage-specialist.input.schema.json` |
| **Output Schema** | `storage-specialist.output.schema.json` |
| **Triggers From** | @azure-architect, @backend-specialist |
| **Hands Off To** | @bicep-specialist, @networking-specialist |

---

## 🔧 Core Responsibilities

### 1. Blob Storage Patterns

#### Storage Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Storage Services                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Blob Storage                                                   │
│  ├── Block Blobs: Files, documents, media (up to 190.7 TB)     │
│  ├── Page Blobs: VHDs, random access (up to 8 TB)              │
│  └── Append Blobs: Logs, audit trails (up to 195 GB)           │
│                                                                  │
│  Access Tiers                                                   │
│  ├── Hot: Frequently accessed data                             │
│  ├── Cool: Infrequently accessed (30+ days)                    │
│  ├── Cold: Rarely accessed (90+ days)                          │
│  └── Archive: Long-term backup (180+ days)                     │
│                                                                  │
│  Table Storage                                                  │
│  └── NoSQL key-value store, massive scale, low cost            │
│                                                                  │
│  Queue Storage                                                  │
│  └── Message queuing for async processing                       │
│                                                                  │
│  Azure Files                                                    │
│  └── SMB/NFS file shares, lift-and-shift scenarios             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Blob Storage SDK

```typescript
// Azure Blob Storage Client
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

// Using Managed Identity (recommended)
const credential = new DefaultAzureCredential();
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

// Or using connection string (local dev)
// const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

class BlobStorageService {
  private containerClient: ContainerClient;

  constructor(containerName: string) {
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  // Upload file
  async upload(
    blobName: string,
    data: Buffer | NodeJS.ReadableStream,
    contentType: string
  ): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(data as Buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'max-age=31536000', // 1 year cache
      },
      tags: {
        uploadedAt: new Date().toISOString(),
      },
    });

    return blockBlobClient.url;
  }

  // Upload large file with streaming
  async uploadLargeFile(
    blobName: string,
    filePath: string,
    contentType: string
  ): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: { blobContentType: contentType },
      concurrency: 4, // Parallel block uploads
      maxSingleShotSize: 4 * 1024 * 1024, // 4MB before chunking
      blockSize: 8 * 1024 * 1024, // 8MB blocks
      onProgress: (progress) => {
        console.log(`Uploaded ${progress.loadedBytes} bytes`);
      },
    });

    return blockBlobClient.url;
  }

  // Download file
  async download(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const response = await blockBlobClient.downloadToBuffer();
    return response;
  }

  // Stream download for large files
  async downloadStream(blobName: string): Promise<NodeJS.ReadableStream> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const response = await blockBlobClient.download();
    return response.readableStreamBody!;
  }

  // Delete blob
  async delete(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists({
      deleteSnapshots: 'include',
    });
  }

  // List blobs with pagination
  async listBlobs(
    prefix?: string,
    pageSize: number = 100
  ): Promise<{ blobs: string[]; continuationToken?: string }> {
    const blobs: string[] = [];
    
    for await (const blob of this.containerClient.listBlobsFlat({
      prefix,
    }).byPage({ maxPageSize: pageSize })) {
      for (const item of blob.segment.blobItems) {
        blobs.push(item.name);
      }
      
      if (blobs.length >= pageSize) {
        return { blobs, continuationToken: blob.continuationToken };
      }
    }

    return { blobs };
  }

  // Copy blob between containers
  async copy(sourceBlobName: string, destContainerName: string): Promise<string> {
    const sourceClient = this.containerClient.getBlockBlobClient(sourceBlobName);
    const destContainer = blobServiceClient.getContainerClient(destContainerName);
    const destClient = destContainer.getBlockBlobClient(sourceBlobName);

    const copyPoller = await destClient.beginCopyFromURL(sourceClient.url);
    await copyPoller.pollUntilDone();

    return destClient.url;
  }

  // Set access tier
  async setTier(blobName: string, tier: 'Hot' | 'Cool' | 'Cold' | 'Archive'): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.setAccessTier(tier);
  }
}
```

### 3. SAS Token Generation

```typescript
// Generate SAS token for secure access
import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  SASProtocol,
} from '@azure/storage-blob';

class SasTokenService {
  private sharedKeyCredential: StorageSharedKeyCredential;

  constructor(accountName: string, accountKey: string) {
    this.sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  }

  // Generate blob-level SAS
  generateBlobSas(
    containerName: string,
    blobName: string,
    permissions: 'read' | 'write' | 'delete',
    expiresInMinutes: number = 60
  ): string {
    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);

    const sasPermissions = new BlobSASPermissions();
    if (permissions.includes('read')) sasPermissions.read = true;
    if (permissions.includes('write')) sasPermissions.write = true;
    if (permissions.includes('delete')) sasPermissions.delete = true;

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: sasPermissions,
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
        contentDisposition: 'attachment',
      },
      this.sharedKeyCredential
    ).toString();

    return `https://${this.sharedKeyCredential.accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
  }

  // Generate user delegation SAS (recommended - no account key)
  async generateUserDelegationSas(
    containerName: string,
    blobName: string,
    expiresInMinutes: number = 60
  ): Promise<string> {
    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );

    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000);

    // Get user delegation key
    const userDelegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      userDelegationKey,
      accountName
    ).toString();

    return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
  }
}
```

### 4. Queue Storage

```typescript
// Azure Queue Storage
import { QueueServiceClient, QueueClient } from '@azure/storage-queue';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const queueServiceClient = new QueueServiceClient(
  `https://${accountName}.queue.core.windows.net`,
  credential
);

class QueueService {
  private queueClient: QueueClient;

  constructor(queueName: string) {
    this.queueClient = queueServiceClient.getQueueClient(queueName);
  }

  // Send message
  async sendMessage<T>(message: T, visibilityTimeout?: number): Promise<string> {
    const encodedMessage = Buffer.from(JSON.stringify(message)).toString('base64');
    
    const response = await this.queueClient.sendMessage(encodedMessage, {
      visibilityTimeout,
    });

    return response.messageId;
  }

  // Receive messages
  async receiveMessages<T>(
    numberOfMessages: number = 1,
    visibilityTimeout: number = 30
  ): Promise<Array<{ id: string; receipt: string; body: T }>> {
    const response = await this.queueClient.receiveMessages({
      numberOfMessages,
      visibilityTimeout,
    });

    return response.receivedMessageItems.map((item) => ({
      id: item.messageId,
      receipt: item.popReceipt,
      body: JSON.parse(Buffer.from(item.messageText, 'base64').toString()) as T,
    }));
  }

  // Delete message after processing
  async deleteMessage(messageId: string, popReceipt: string): Promise<void> {
    await this.queueClient.deleteMessage(messageId, popReceipt);
  }

  // Update message visibility
  async updateVisibility(
    messageId: string,
    popReceipt: string,
    visibilityTimeout: number
  ): Promise<void> {
    await this.queueClient.updateMessage(messageId, popReceipt, '', visibilityTimeout);
  }

  // Get queue length
  async getMessageCount(): Promise<number> {
    const properties = await this.queueClient.getProperties();
    return properties.approximateMessagesCount || 0;
  }

  // Peek at messages without removing
  async peekMessages<T>(numberOfMessages: number = 1): Promise<T[]> {
    const response = await this.queueClient.peekMessages({
      numberOfMessages,
    });

    return response.peekedMessageItems.map(
      (item) => JSON.parse(Buffer.from(item.messageText, 'base64').toString()) as T
    );
  }
}

// Message processor pattern
async function processMessages<T>(
  queue: QueueService,
  handler: (message: T) => Promise<void>,
  options: {
    batchSize?: number;
    visibilityTimeout?: number;
    pollingInterval?: number;
  } = {}
): Promise<void> {
  const { batchSize = 10, visibilityTimeout = 300, pollingInterval = 5000 } = options;

  while (true) {
    const messages = await queue.receiveMessages<T>(batchSize, visibilityTimeout);

    if (messages.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      continue;
    }

    await Promise.all(
      messages.map(async (msg) => {
        try {
          await handler(msg.body);
          await queue.deleteMessage(msg.id, msg.receipt);
        } catch (error) {
          console.error(`Failed to process message ${msg.id}:`, error);
          // Message will become visible again after visibilityTimeout
        }
      })
    );
  }
}
```

### 5. Table Storage

```typescript
// Azure Table Storage
import { TableClient, TableEntity, odata } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const tableClient = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  'users',
  credential
);

interface UserEntity extends TableEntity {
  partitionKey: string; // e.g., "tenant-123"
  rowKey: string; // e.g., "user-456"
  email: string;
  name: string;
  createdAt: Date;
  roles: string; // JSON string for arrays
}

class TableStorageService {
  constructor(private tableClient: TableClient) {}

  // Create or update entity
  async upsert(entity: UserEntity): Promise<void> {
    await this.tableClient.upsertEntity(entity, 'Replace');
  }

  // Get single entity
  async get(partitionKey: string, rowKey: string): Promise<UserEntity | null> {
    try {
      const entity = await this.tableClient.getEntity<UserEntity>(partitionKey, rowKey);
      return entity;
    } catch (error: any) {
      if (error.statusCode === 404) return null;
      throw error;
    }
  }

  // Delete entity
  async delete(partitionKey: string, rowKey: string): Promise<void> {
    await this.tableClient.deleteEntity(partitionKey, rowKey);
  }

  // Query entities
  async queryByPartition(partitionKey: string): Promise<UserEntity[]> {
    const entities: UserEntity[] = [];
    
    const queryResults = this.tableClient.listEntities<UserEntity>({
      queryOptions: {
        filter: odata`PartitionKey eq ${partitionKey}`,
      },
    });

    for await (const entity of queryResults) {
      entities.push(entity);
    }

    return entities;
  }

  // Batch operations (same partition only)
  async batchUpsert(entities: UserEntity[]): Promise<void> {
    // Group by partition key
    const batches = new Map<string, UserEntity[]>();
    
    for (const entity of entities) {
      const existing = batches.get(entity.partitionKey) || [];
      existing.push(entity);
      batches.set(entity.partitionKey, existing);
    }

    // Execute batches (max 100 per batch)
    for (const [, batchEntities] of batches) {
      const transaction = batchEntities.map((e) => ['upsert', e] as const);
      await this.tableClient.submitTransaction(
        transaction.slice(0, 100).map(([action, entity]) => ({ [action]: entity }))
      );
    }
  }
}
```

### 6. Lifecycle Management

```json
// Lifecycle management policy (Azure Portal or ARM/Bicep)
{
  "rules": [
    {
      "enabled": true,
      "name": "move-to-cool-after-30-days",
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["uploads/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 30
            },
            "tierToCold": {
              "daysAfterModificationGreaterThan": 90
            },
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 180
            },
            "delete": {
              "daysAfterModificationGreaterThan": 365
            }
          },
          "snapshot": {
            "delete": {
              "daysAfterCreationGreaterThan": 90
            }
          }
        }
      }
    }
  ]
}
```

### 7. Bicep Template

```bicep
@description('Storage account name')
param storageAccountName string

@description('Location')
param location string = resourceGroup().location

@description('Storage account SKU')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_RAGRS', 'Standard_ZRS', 'Premium_LRS'])
param sku string = 'Standard_ZRS'

@description('Enable hierarchical namespace (Data Lake Gen2)')
param enableHns bool = false

@description('Virtual network subnet ID for private endpoint')
param subnetId string

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: sku
  }
  kind: enableHns ? 'StorageV2' : 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false // Enforce Entra ID auth only
    isHnsEnabled: enableHns
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    }
    encryption: {
      services: {
        blob: { enabled: true, keyType: 'Account' }
        file: { enabled: true, keyType: 'Account' }
        table: { enabled: true, keyType: 'Account' }
        queue: { enabled: true, keyType: 'Account' }
      }
      keySource: 'Microsoft.Storage'
      requireInfrastructureEncryption: true
    }
  }
}

// Blob Services
resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    changeFeed: {
      enabled: true
      retentionInDays: 7
    }
    isVersioningEnabled: true
  }
}

// Container for uploads
resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'uploads'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'User uploads'
    }
  }
}

// Lifecycle Management Policy
resource lifecyclePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          name: 'move-to-cool'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: ['blockBlob']
              prefixMatch: ['uploads/']
            }
            actions: {
              baseBlob: {
                tierToCool: { daysAfterModificationGreaterThan: 30 }
                tierToArchive: { daysAfterModificationGreaterThan: 180 }
                delete: { daysAfterModificationGreaterThan: 730 }
              }
            }
          }
        }
      ]
    }
  }
}

// Private Endpoint
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'pe-${storageAccountName}-blob'
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'blobConnection'
        properties: {
          privateLinkServiceId: storageAccount.id
          groupIds: ['blob']
        }
      }
    ]
  }
}

// Diagnostic Settings
resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'storage-diagnostics'
  scope: blobServices
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        category: 'StorageRead'
        enabled: true
        retentionPolicy: { days: 30, enabled: true }
      }
      {
        category: 'StorageWrite'
        enabled: true
        retentionPolicy: { days: 30, enabled: true }
      }
      {
        category: 'StorageDelete'
        enabled: true
        retentionPolicy: { days: 30, enabled: true }
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: true
        retentionPolicy: { days: 30, enabled: true }
      }
    ]
  }
}

output storageAccountId string = storageAccount.id
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
output queueEndpoint string = storageAccount.properties.primaryEndpoints.queue
output tableEndpoint string = storageAccount.properties.primaryEndpoints.table
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @azure-architect | Storage needed in solution |
| @backend-specialist | File upload/download features |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @bicep-specialist | Deploy storage infrastructure |
| @networking-specialist | Private endpoints needed |

---

## 📚 Related Skills

- [azure-storage-patterns.skill.md](../skills/azure-storage-patterns.skill.md)

---

## 🏷️ Tags

`blob-storage` `table-storage` `queue-storage` `azure-files` `sas-token` `lifecycle` `azure`
