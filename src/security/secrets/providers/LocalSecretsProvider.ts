/**
 * LocalSecretsProvider.ts
 * Encrypted local file-based secrets storage
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { SecretsProvider, Secret, SecretMetadata } from '../SecretsManager';

export interface LocalSecretsConfig {
  storePath: string;
  encryptionKey?: string;
  algorithm?: string;
}

export class LocalSecretsProvider implements SecretsProvider {
  readonly name = 'local-encrypted';
  readonly priority = 50;

  private config: LocalSecretsConfig;
  private secrets: Map<string, Secret> = new Map();
  private loaded = false;
  private algorithm: string;
  private key: Buffer;

  constructor(config: LocalSecretsConfig) {
    this.config = config;
    this.algorithm = config.algorithm || 'aes-256-gcm';
    this.key = this.deriveKey(config.encryptionKey || this.getDefaultKey());
  }

  private deriveKey(password: string): Buffer {
    return crypto.scryptSync(password, 'agentic-coder-salt', 32);
  }

  private getDefaultKey(): string {
    return process.env.AGENTIC_SECRET_KEY || 'default-dev-key-change-in-prod';
  }

  async isAvailable(): Promise<boolean> {
    try {
      await fs.access(path.dirname(this.config.storePath));
      return true;
    } catch {
      return true; // Will create directory
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private async load(): Promise<void> {
    if (this.loaded) return;

    try {
      const data = await fs.readFile(this.config.storePath, 'utf8');
      const decrypted = this.decrypt(data);
      const parsed = JSON.parse(decrypted);
      
      for (const [name, secret] of Object.entries(parsed)) {
        const s = secret as any;
        this.secrets.set(name, {
          name,
          value: s.value,
          metadata: {
            ...s.metadata,
            createdAt: new Date(s.metadata.createdAt),
            expiresAt: s.metadata.expiresAt ? new Date(s.metadata.expiresAt) : undefined,
          },
        });
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    this.loaded = true;
  }

  private async save(): Promise<void> {
    const data: Record<string, any> = {};
    
    for (const [name, secret] of this.secrets) {
      data[name] = {
        value: secret.value,
        metadata: secret.metadata,
      };
    }
    
    const encrypted = this.encrypt(JSON.stringify(data));
    
    await fs.mkdir(path.dirname(this.config.storePath), { recursive: true });
    await fs.writeFile(this.config.storePath, encrypted, 'utf8');
  }

  async getSecret(name: string): Promise<Secret | null> {
    await this.load();
    return this.secrets.get(name) || null;
  }

  async setSecret(name: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void> {
    await this.load();
    
    const existing = this.secrets.get(name);
    
    this.secrets.set(name, {
      name,
      value,
      metadata: {
        name,
        createdAt: existing?.metadata.createdAt || new Date(),
        ...metadata,
      },
    });
    
    await this.save();
  }

  async deleteSecret(name: string): Promise<void> {
    await this.load();
    this.secrets.delete(name);
    await this.save();
  }

  async listSecrets(): Promise<string[]> {
    await this.load();
    return Array.from(this.secrets.keys());
  }
}

export default LocalSecretsProvider;
