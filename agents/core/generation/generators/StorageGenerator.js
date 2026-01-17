/**
 * StorageGenerator - Azure Storage Generator
 * 
 * Generates Azure Blob, Queue, and Table storage client code
 * and configuration.
 */

const BaseGenerator = require('./BaseGenerator');

class StorageGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'StorageGenerator',
      framework: 'azure-storage',
      version: 'latest',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'azure/storage';
    this.supportedTypes = ['blob', 'queue', 'table', 'file'];
  }

  /**
   * Generate Blob Storage client
   */
  async generateBlob(context) {
    const { 
      language = 'typescript',
      accountName,
      containerName,
      useManagedIdentity = true
    } = context;
    
    const templateData = {
      accountName,
      containerName,
      useManagedIdentity,
      accountUrl: `https://${accountName}.blob.core.windows.net`
    };
    
    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.generateTsBlobClient(templateData);
      case 'python':
        return this.generatePyBlobClient(templateData);
      case 'csharp':
        return this.generateCsBlobClient(templateData);
      default:
        return this.generateTsBlobClient(templateData);
    }
  }

  /**
   * Generate Queue Storage client
   */
  async generateQueue(context) {
    const { 
      language = 'typescript',
      accountName,
      queueName,
      useManagedIdentity = true
    } = context;
    
    const templateData = {
      accountName,
      queueName,
      useManagedIdentity,
      accountUrl: `https://${accountName}.queue.core.windows.net`
    };
    
    return this.generateTsQueueClient(templateData);
  }

  /**
   * Generate Table Storage client
   */
  async generateTable(context) {
    const { 
      language = 'typescript',
      accountName,
      tableName,
      useManagedIdentity = true
    } = context;
    
    const templateData = {
      accountName,
      tableName,
      useManagedIdentity,
      accountUrl: `https://${accountName}.table.core.windows.net`
    };
    
    return this.generateTsTableClient(templateData);
  }

  /**
   * Generate File Storage client
   */
  async generateFile(context) {
    const { 
      language = 'typescript',
      accountName,
      shareName
    } = context;
    
    const templateData = {
      accountName,
      shareName,
      accountUrl: `https://${accountName}.file.core.windows.net`
    };
    
    return this.generateTsFileClient(templateData);
  }

  // TypeScript generators
  generateTsBlobClient(data) {
    const lines = [];
    
    lines.push(`import { BlobServiceClient, ContainerClient, BlobClient, BlockBlobClient } from '@azure/storage-blob';`);
    lines.push(`import { DefaultAzureCredential } from '@azure/identity';`);
    lines.push(`import { Readable } from 'stream';`);
    lines.push('');
    lines.push(`const accountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL || '${data.accountUrl}';`);
    lines.push(`const containerName = process.env.AZURE_STORAGE_CONTAINER || '${data.containerName}';`);
    lines.push('');
    
    if (data.useManagedIdentity) {
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push('const blobServiceClient = new BlobServiceClient(accountUrl, credential);');
    } else {
      lines.push("const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';");
      lines.push('const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);');
    }
    
    lines.push('');
    lines.push('export class BlobStorageService {');
    lines.push('  private containerClient: ContainerClient;');
    lines.push('');
    lines.push('  constructor() {');
    lines.push('    this.containerClient = blobServiceClient.getContainerClient(containerName);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Ensure the container exists');
    lines.push('   */');
    lines.push('  async ensureContainer(): Promise<void> {');
    lines.push("    await this.containerClient.createIfNotExists({ access: 'container' });");
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Upload a blob from buffer');
    lines.push('   */');
    lines.push('  async uploadBlob(blobName: string, data: Buffer, contentType?: string): Promise<string> {');
    lines.push('    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);');
    lines.push('    await blockBlobClient.upload(data, data.length, {');
    lines.push('      blobHTTPHeaders: { blobContentType: contentType }');
    lines.push('    });');
    lines.push('    return blockBlobClient.url;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Upload a blob from stream');
    lines.push('   */');
    lines.push('  async uploadStream(blobName: string, stream: Readable, contentType?: string): Promise<string> {');
    lines.push('    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);');
    lines.push('    await blockBlobClient.uploadStream(stream, undefined, undefined, {');
    lines.push('      blobHTTPHeaders: { blobContentType: contentType }');
    lines.push('    });');
    lines.push('    return blockBlobClient.url;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Download a blob to buffer');
    lines.push('   */');
    lines.push('  async downloadBlob(blobName: string): Promise<Buffer> {');
    lines.push('    const blobClient = this.containerClient.getBlobClient(blobName);');
    lines.push('    const response = await blobClient.download();');
    lines.push('    return await this.streamToBuffer(response.readableStreamBody!);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Delete a blob');
    lines.push('   */');
    lines.push('  async deleteBlob(blobName: string): Promise<void> {');
    lines.push('    const blobClient = this.containerClient.getBlobClient(blobName);');
    lines.push('    await blobClient.delete();');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * List blobs in container');
    lines.push('   */');
    lines.push('  async listBlobs(prefix?: string): Promise<string[]> {');
    lines.push('    const blobs: string[] = [];');
    lines.push('    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {');
    lines.push('      blobs.push(blob.name);');
    lines.push('    }');
    lines.push('    return blobs;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Generate SAS URL for a blob');
    lines.push('   */');
    lines.push('  async generateSasUrl(blobName: string, expiresInMinutes = 60): Promise<string> {');
    lines.push('    const blobClient = this.containerClient.getBlobClient(blobName);');
    lines.push('    const sasUrl = await blobClient.generateSasUrl({');
    lines.push("      permissions: { read: true } as any,");
    lines.push('      expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000)');
    lines.push('    });');
    lines.push('    return sasUrl;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Check if blob exists');
    lines.push('   */');
    lines.push('  async blobExists(blobName: string): Promise<boolean> {');
    lines.push('    const blobClient = this.containerClient.getBlobClient(blobName);');
    lines.push('    return await blobClient.exists();');
    lines.push('  }');
    lines.push('');
    lines.push('  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {');
    lines.push('    return new Promise((resolve, reject) => {');
    lines.push('      const chunks: Buffer[] = [];');
    lines.push("      readableStream.on('data', (data) => chunks.push(data instanceof Buffer ? data : Buffer.from(data)));");
    lines.push("      readableStream.on('end', () => resolve(Buffer.concat(chunks)));");
    lines.push("      readableStream.on('error', reject);");
    lines.push('    });');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('export const blobStorageService = new BlobStorageService();');
    
    return lines.join('\n');
  }

  generateTsQueueClient(data) {
    const lines = [];
    
    lines.push(`import { QueueServiceClient, QueueClient } from '@azure/storage-queue';`);
    lines.push(`import { DefaultAzureCredential } from '@azure/identity';`);
    lines.push('');
    lines.push(`const accountUrl = process.env.AZURE_STORAGE_QUEUE_URL || '${data.accountUrl}';`);
    lines.push(`const queueName = process.env.AZURE_STORAGE_QUEUE || '${data.queueName}';`);
    lines.push('');
    
    if (data.useManagedIdentity) {
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push('const queueServiceClient = new QueueServiceClient(accountUrl, credential);');
    } else {
      lines.push("const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';");
      lines.push('const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);');
    }
    
    lines.push('');
    lines.push('export class QueueStorageService {');
    lines.push('  private queueClient: QueueClient;');
    lines.push('');
    lines.push('  constructor() {');
    lines.push('    this.queueClient = queueServiceClient.getQueueClient(queueName);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Ensure the queue exists');
    lines.push('   */');
    lines.push('  async ensureQueue(): Promise<void> {');
    lines.push('    await this.queueClient.createIfNotExists();');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Send a message to the queue');
    lines.push('   */');
    lines.push('  async sendMessage<T>(message: T): Promise<string> {');
    lines.push('    const messageText = Buffer.from(JSON.stringify(message)).toString("base64");');
    lines.push('    const response = await this.queueClient.sendMessage(messageText);');
    lines.push('    return response.messageId;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Receive messages from the queue');
    lines.push('   */');
    lines.push('  async receiveMessages<T>(maxMessages = 1): Promise<Array<{ messageId: string; popReceipt: string; content: T }>> {');
    lines.push('    const response = await this.queueClient.receiveMessages({ numberOfMessages: maxMessages });');
    lines.push('    return response.receivedMessageItems.map(msg => ({');
    lines.push('      messageId: msg.messageId,');
    lines.push('      popReceipt: msg.popReceipt,');
    lines.push('      content: JSON.parse(Buffer.from(msg.messageText, "base64").toString())');
    lines.push('    }));');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Delete a message from the queue');
    lines.push('   */');
    lines.push('  async deleteMessage(messageId: string, popReceipt: string): Promise<void> {');
    lines.push('    await this.queueClient.deleteMessage(messageId, popReceipt);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Peek at messages without removing them');
    lines.push('   */');
    lines.push('  async peekMessages<T>(maxMessages = 1): Promise<T[]> {');
    lines.push('    const response = await this.queueClient.peekMessages({ numberOfMessages: maxMessages });');
    lines.push('    return response.peekedMessageItems.map(msg =>');
    lines.push('      JSON.parse(Buffer.from(msg.messageText, "base64").toString())');
    lines.push('    );');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Get approximate message count');
    lines.push('   */');
    lines.push('  async getMessageCount(): Promise<number> {');
    lines.push('    const properties = await this.queueClient.getProperties();');
    lines.push('    return properties.approximateMessagesCount ?? 0;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('export const queueStorageService = new QueueStorageService();');
    
    return lines.join('\n');
  }

  generateTsTableClient(data) {
    const lines = [];
    
    lines.push(`import { TableClient, TableEntity } from '@azure/data-tables';`);
    lines.push(`import { DefaultAzureCredential } from '@azure/identity';`);
    lines.push('');
    lines.push(`const accountUrl = process.env.AZURE_STORAGE_TABLE_URL || '${data.accountUrl}';`);
    lines.push(`const tableName = process.env.AZURE_STORAGE_TABLE || '${data.tableName}';`);
    lines.push('');
    
    if (data.useManagedIdentity) {
      lines.push('const credential = new DefaultAzureCredential();');
      lines.push('const tableClient = new TableClient(accountUrl, tableName, credential);');
    } else {
      lines.push("const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';");
      lines.push('const tableClient = TableClient.fromConnectionString(connectionString, tableName);');
    }
    
    lines.push('');
    lines.push('export interface BaseEntity extends TableEntity {');
    lines.push('  partitionKey: string;');
    lines.push('  rowKey: string;');
    lines.push('}');
    lines.push('');
    lines.push('export class TableStorageService<T extends BaseEntity> {');
    lines.push('  /**');
    lines.push('   * Ensure the table exists');
    lines.push('   */');
    lines.push('  async ensureTable(): Promise<void> {');
    lines.push('    await tableClient.createTable();');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Create or update an entity');
    lines.push('   */');
    lines.push('  async upsertEntity(entity: T): Promise<void> {');
    lines.push("    await tableClient.upsertEntity(entity, 'Replace');");
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Get an entity by partition key and row key');
    lines.push('   */');
    lines.push('  async getEntity(partitionKey: string, rowKey: string): Promise<T | null> {');
    lines.push('    try {');
    lines.push('      const entity = await tableClient.getEntity<T>(partitionKey, rowKey);');
    lines.push('      return entity as T;');
    lines.push('    } catch (error: any) {');
    lines.push('      if (error.statusCode === 404) return null;');
    lines.push('      throw error;');
    lines.push('    }');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Delete an entity');
    lines.push('   */');
    lines.push('  async deleteEntity(partitionKey: string, rowKey: string): Promise<void> {');
    lines.push('    await tableClient.deleteEntity(partitionKey, rowKey);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Query entities');
    lines.push('   */');
    lines.push('  async queryEntities(filter?: string): Promise<T[]> {');
    lines.push('    const entities: T[] = [];');
    lines.push('    const iterator = tableClient.listEntities<T>({ queryOptions: { filter } });');
    lines.push('    for await (const entity of iterator) {');
    lines.push('      entities.push(entity as T);');
    lines.push('    }');
    lines.push('    return entities;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Query entities by partition key');
    lines.push('   */');
    lines.push('  async queryByPartitionKey(partitionKey: string): Promise<T[]> {');
    lines.push("    return this.queryEntities(`PartitionKey eq '${partitionKey}'`);");
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('export const tableStorageService = new TableStorageService();');
    
    return lines.join('\n');
  }

  generateTsFileClient(data) {
    const lines = [];
    
    lines.push(`import { ShareServiceClient, ShareClient, ShareDirectoryClient, ShareFileClient } from '@azure/storage-file-share';`);
    lines.push('');
    lines.push("const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';");
    lines.push(`const shareName = process.env.AZURE_STORAGE_SHARE || '${data.shareName}';`);
    lines.push('');
    lines.push('const shareServiceClient = ShareServiceClient.fromConnectionString(connectionString);');
    lines.push('');
    lines.push('export class FileStorageService {');
    lines.push('  private shareClient: ShareClient;');
    lines.push('');
    lines.push('  constructor() {');
    lines.push('    this.shareClient = shareServiceClient.getShareClient(shareName);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Ensure the share exists');
    lines.push('   */');
    lines.push('  async ensureShare(): Promise<void> {');
    lines.push('    await this.shareClient.createIfNotExists();');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Upload a file');
    lines.push('   */');
    lines.push('  async uploadFile(directory: string, fileName: string, content: Buffer): Promise<void> {');
    lines.push('    const dirClient = this.shareClient.getDirectoryClient(directory);');
    lines.push('    await dirClient.createIfNotExists();');
    lines.push('    const fileClient = dirClient.getFileClient(fileName);');
    lines.push('    await fileClient.uploadData(content);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Download a file');
    lines.push('   */');
    lines.push('  async downloadFile(directory: string, fileName: string): Promise<Buffer> {');
    lines.push('    const dirClient = this.shareClient.getDirectoryClient(directory);');
    lines.push('    const fileClient = dirClient.getFileClient(fileName);');
    lines.push('    const response = await fileClient.download();');
    lines.push('    return await this.streamToBuffer(response.readableStreamBody!);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Delete a file');
    lines.push('   */');
    lines.push('  async deleteFile(directory: string, fileName: string): Promise<void> {');
    lines.push('    const dirClient = this.shareClient.getDirectoryClient(directory);');
    lines.push('    const fileClient = dirClient.getFileClient(fileName);');
    lines.push('    await fileClient.delete();');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * List files in a directory');
    lines.push('   */');
    lines.push('  async listFiles(directory: string): Promise<string[]> {');
    lines.push('    const files: string[] = [];');
    lines.push('    const dirClient = this.shareClient.getDirectoryClient(directory);');
    lines.push('    for await (const item of dirClient.listFilesAndDirectories()) {');
    lines.push("      if (item.kind === 'file') {");
    lines.push('        files.push(item.name);');
    lines.push('      }');
    lines.push('    }');
    lines.push('    return files;');
    lines.push('  }');
    lines.push('');
    lines.push('  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {');
    lines.push('    return new Promise((resolve, reject) => {');
    lines.push('      const chunks: Buffer[] = [];');
    lines.push("      readableStream.on('data', (data) => chunks.push(data instanceof Buffer ? data : Buffer.from(data)));");
    lines.push("      readableStream.on('end', () => resolve(Buffer.concat(chunks)));");
    lines.push("      readableStream.on('error', reject);");
    lines.push('    });');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('export const fileStorageService = new FileStorageService();');
    
    return lines.join('\n');
  }

  // Python generator
  generatePyBlobClient(data) {
    const lines = [];
    
    lines.push('import os');
    lines.push('from typing import Optional, List');
    lines.push('from azure.identity import DefaultAzureCredential');
    lines.push('from azure.storage.blob import BlobServiceClient, ContainerClient, BlobClient');
    lines.push('');
    lines.push(`ACCOUNT_URL = os.environ.get('AZURE_STORAGE_ACCOUNT_URL', '${data.accountUrl}')`);
    lines.push(`CONTAINER_NAME = os.environ.get('AZURE_STORAGE_CONTAINER', '${data.containerName}')`);
    lines.push('');
    lines.push('credential = DefaultAzureCredential()');
    lines.push('blob_service_client = BlobServiceClient(account_url=ACCOUNT_URL, credential=credential)');
    lines.push('');
    lines.push('class BlobStorageService:');
    lines.push('    """Service for Azure Blob Storage operations"""');
    lines.push('');
    lines.push('    def __init__(self):');
    lines.push('        self.container_client = blob_service_client.get_container_client(CONTAINER_NAME)');
    lines.push('');
    lines.push('    def ensure_container(self) -> None:');
    lines.push('        """Ensure the container exists"""');
    lines.push('        try:');
    lines.push('            self.container_client.create_container()');
    lines.push('        except Exception:');
    lines.push('            pass  # Container already exists');
    lines.push('');
    lines.push('    def upload_blob(self, blob_name: str, data: bytes, content_type: Optional[str] = None) -> str:');
    lines.push('        """Upload a blob and return its URL"""');
    lines.push('        blob_client = self.container_client.get_blob_client(blob_name)');
    lines.push('        blob_client.upload_blob(data, overwrite=True, content_type=content_type)');
    lines.push('        return blob_client.url');
    lines.push('');
    lines.push('    def download_blob(self, blob_name: str) -> bytes:');
    lines.push('        """Download a blob"""');
    lines.push('        blob_client = self.container_client.get_blob_client(blob_name)');
    lines.push('        return blob_client.download_blob().readall()');
    lines.push('');
    lines.push('    def delete_blob(self, blob_name: str) -> None:');
    lines.push('        """Delete a blob"""');
    lines.push('        blob_client = self.container_client.get_blob_client(blob_name)');
    lines.push('        blob_client.delete_blob()');
    lines.push('');
    lines.push('    def list_blobs(self, prefix: Optional[str] = None) -> List[str]:');
    lines.push('        """List blobs in the container"""');
    lines.push('        return [blob.name for blob in self.container_client.list_blobs(name_starts_with=prefix)]');
    lines.push('');
    lines.push('');
    lines.push('blob_storage_service = BlobStorageService()');
    
    return lines.join('\n');
  }

  // C# generator
  generateCsBlobClient(data) {
    const lines = [];
    
    lines.push('using Azure.Identity;');
    lines.push('using Azure.Storage.Blobs;');
    lines.push('using Azure.Storage.Blobs.Models;');
    lines.push('');
    lines.push('namespace Services;');
    lines.push('');
    lines.push('public class BlobStorageService');
    lines.push('{');
    lines.push('    private readonly BlobContainerClient _containerClient;');
    lines.push('');
    lines.push('    public BlobStorageService()');
    lines.push('    {');
    lines.push(`        var accountUrl = Environment.GetEnvironmentVariable("AZURE_STORAGE_ACCOUNT_URL") ?? "${data.accountUrl}";`);
    lines.push(`        var containerName = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONTAINER") ?? "${data.containerName}";`);
    lines.push('        var blobServiceClient = new BlobServiceClient(new Uri(accountUrl), new DefaultAzureCredential());');
    lines.push('        _containerClient = blobServiceClient.GetBlobContainerClient(containerName);');
    lines.push('    }');
    lines.push('');
    lines.push('    public async Task EnsureContainerAsync()');
    lines.push('    {');
    lines.push('        await _containerClient.CreateIfNotExistsAsync();');
    lines.push('    }');
    lines.push('');
    lines.push('    public async Task<string> UploadBlobAsync(string blobName, byte[] data, string? contentType = null)');
    lines.push('    {');
    lines.push('        var blobClient = _containerClient.GetBlobClient(blobName);');
    lines.push('        var options = new BlobUploadOptions');
    lines.push('        {');
    lines.push('            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }');
    lines.push('        };');
    lines.push('        await blobClient.UploadAsync(new BinaryData(data), options);');
    lines.push('        return blobClient.Uri.ToString();');
    lines.push('    }');
    lines.push('');
    lines.push('    public async Task<byte[]> DownloadBlobAsync(string blobName)');
    lines.push('    {');
    lines.push('        var blobClient = _containerClient.GetBlobClient(blobName);');
    lines.push('        var response = await blobClient.DownloadContentAsync();');
    lines.push('        return response.Value.Content.ToArray();');
    lines.push('    }');
    lines.push('');
    lines.push('    public async Task DeleteBlobAsync(string blobName)');
    lines.push('    {');
    lines.push('        var blobClient = _containerClient.GetBlobClient(blobName);');
    lines.push('        await blobClient.DeleteIfExistsAsync();');
    lines.push('    }');
    lines.push('}');
    
    return lines.join('\n');
  }
}

module.exports = StorageGenerator;
