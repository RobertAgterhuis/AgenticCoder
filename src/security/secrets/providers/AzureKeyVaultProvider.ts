/**
 * AzureKeyVaultProvider.ts
 * Azure Key Vault secrets provider
 */

import { SecretsProvider, Secret, SecretMetadata } from '../SecretsManager';

export interface AzureKeyVaultConfig {
  vaultUrl: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  useManagedIdentity?: boolean;
}

export class AzureKeyVaultProvider implements SecretsProvider {
  readonly name = 'azure-keyvault';
  readonly priority = 100;
  
  private config: AzureKeyVaultConfig;
  private client: any = null;

  constructor(config: AzureKeyVaultConfig) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.getClient();
      return true;
    } catch {
      return false;
    }
  }

  private async getClient(): Promise<any> {
    if (this.client) return this.client;

    // Dynamic import for Azure SDK
    const { SecretClient } = await import('@azure/keyvault-secrets');
    const { DefaultAzureCredential, ClientSecretCredential } = await import('@azure/identity');

    let credential;
    if (this.config.useManagedIdentity) {
      credential = new DefaultAzureCredential();
    } else if (this.config.clientId && this.config.clientSecret && this.config.tenantId) {
      credential = new ClientSecretCredential(
        this.config.tenantId,
        this.config.clientId,
        this.config.clientSecret
      );
    } else {
      credential = new DefaultAzureCredential();
    }

    this.client = new SecretClient(this.config.vaultUrl, credential);
    return this.client;
  }

  async getSecret(name: string, version?: string): Promise<Secret | null> {
    try {
      const client = await this.getClient();
      const secret = await client.getSecret(name, { version });
      
      return {
        name: secret.name,
        value: secret.value || '',
        metadata: {
          name: secret.name,
          version: secret.properties.version,
          createdAt: secret.properties.createdOn || new Date(),
          expiresAt: secret.properties.expiresOn,
          contentType: secret.properties.contentType,
          tags: secret.properties.tags,
        },
      };
    } catch (error: any) {
      if (error.code === 'SecretNotFound') {
        return null;
      }
      throw error;
    }
  }

  async setSecret(name: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void> {
    const client = await this.getClient();
    await client.setSecret(name, value, {
      contentType: metadata?.contentType,
      expiresOn: metadata?.expiresAt,
      tags: metadata?.tags,
    });
  }

  async deleteSecret(name: string): Promise<void> {
    const client = await this.getClient();
    const poller = await client.beginDeleteSecret(name);
    await poller.pollUntilDone();
  }

  async listSecrets(): Promise<string[]> {
    const client = await this.getClient();
    const secrets: string[] = [];
    
    for await (const secret of client.listPropertiesOfSecrets()) {
      secrets.push(secret.name);
    }
    
    return secrets;
  }
}

export default AzureKeyVaultProvider;
