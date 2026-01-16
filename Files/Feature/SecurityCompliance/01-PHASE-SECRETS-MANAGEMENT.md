# Phase 1: Secrets Management

**Phase ID:** F-SEC-P01  
**Feature:** SecurityCompliance  
**Duration:** 4-5 days  
**Status:** ⬜ Not Started  
**Depends On:** None

---

## 🎯 Phase Objectives

Deze phase implementeert **secure secrets management**:
- Abstract secrets interface
- Azure Key Vault integration
- Local encrypted storage
- Environment variable support
- MCP integration (GitGuardian voor detection)

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── security/
│   └── secrets/
│       ├── index.ts
│       ├── SecretsManager.ts
│       ├── providers/
│       │   ├── AzureKeyVaultProvider.ts
│       │   ├── LocalSecretsProvider.ts
│       │   └── EnvironmentProvider.ts
│       ├── encryption/
│       │   └── CryptoService.ts
│       └── detection/
│           └── SecretDetector.ts
```

---

## 🔧 Implementation Details

### 1.1 Secrets Manager Interface (`src/security/secrets/SecretsManager.ts`)

```typescript
/**
 * Secret metadata
 */
export interface SecretMetadata {
  name: string;
  version?: string;
  createdAt: Date;
  expiresAt?: Date;
  contentType?: string;
  tags?: Record<string, string>;
}

/**
 * Secret value with metadata
 */
export interface Secret {
  name: string;
  value: string;
  metadata: SecretMetadata;
}

/**
 * Provider options
 */
export interface SecretsProviderOptions {
  cache?: boolean;
  cacheTtl?: number;  // seconds
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Secrets provider interface
 */
export interface SecretsProvider {
  readonly name: string;
  readonly priority: number;
  
  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get a secret by name
   */
  getSecret(name: string, version?: string): Promise<Secret | null>;
  
  /**
   * Set a secret
   */
  setSecret(name: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
  
  /**
   * Delete a secret
   */
  deleteSecret(name: string): Promise<void>;
  
  /**
   * List secret names
   */
  listSecrets(): Promise<string[]>;
}

/**
 * Secrets manager - orchestrates multiple providers
 */
export class SecretsManager {
  private providers: SecretsProvider[] = [];
  private cache: Map<string, { secret: Secret; expiresAt: number }> = new Map();
  private options: SecretsProviderOptions;

  constructor(options: SecretsProviderOptions = {}) {
    this.options = {
      cache: true,
      cacheTtl: 300,  // 5 minutes
      retryCount: 3,
      retryDelay: 1000,
      ...options,
    };
  }

  /**
   * Register a provider
   */
  registerProvider(provider: SecretsProvider): void {
    this.providers.push(provider);
    // Sort by priority (highest first)
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get a secret (tries providers in order)
   */
  async getSecret(name: string, version?: string): Promise<Secret | null> {
    // Check cache first
    if (this.options.cache) {
      const cached = this.cache.get(name);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.secret;
      }
    }

    // Try providers in order
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          const secret = await this.retryOperation(
            () => provider.getSecret(name, version)
          );
          
          if (secret) {
            // Cache the result
            if (this.options.cache) {
              this.cache.set(name, {
                secret,
                expiresAt: Date.now() + (this.options.cacheTtl! * 1000),
              });
            }
            return secret;
          }
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * Set a secret (uses first available provider)
   */
  async setSecret(
    name: string, 
    value: string, 
    metadata?: Partial<SecretMetadata>
  ): Promise<void> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          await this.retryOperation(
            () => provider.setSecret(name, value, metadata)
          );
          // Invalidate cache
          this.cache.delete(name);
          return;
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed to set secret:`, error);
        continue;
      }
    }
    throw new Error('No available provider to set secret');
  }

  /**
   * Delete a secret
   */
  async deleteSecret(name: string): Promise<void> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          await provider.deleteSecret(name);
          this.cache.delete(name);
          return;
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed to delete secret:`, error);
        continue;
      }
    }
    throw new Error('No available provider to delete secret');
  }

  /**
   * Get secret value (convenience method)
   */
  async getValue(name: string): Promise<string | null> {
    const secret = await this.getSecret(name);
    return secret?.value ?? null;
  }

  /**
   * Require secret (throws if not found)
   */
  async requireSecret(name: string): Promise<string> {
    const value = await this.getValue(name);
    if (!value) {
      throw new Error(`Required secret not found: ${name}`);
    }
    return value;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Retry operation with backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < this.options.retryCount!; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < this.options.retryCount! - 1) {
          await this.delay(this.options.retryDelay! * (i + 1));
        }
      }
    }
    
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create default secrets manager
 */
export function createSecretsManager(
  options?: SecretsProviderOptions
): SecretsManager {
  return new SecretsManager(options);
}
```

### 1.2 Azure Key Vault Provider (`src/security/secrets/providers/AzureKeyVaultProvider.ts`)

```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { 
  SecretsProvider, 
  Secret, 
  SecretMetadata 
} from '../SecretsManager';

/**
 * Azure Key Vault configuration
 */
export interface KeyVaultConfig {
  vaultUrl: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

/**
 * Azure Key Vault secrets provider
 */
export class AzureKeyVaultProvider implements SecretsProvider {
  readonly name = 'azure-key-vault';
  readonly priority = 100;  // Highest priority

  private client: SecretClient | null = null;
  private config: KeyVaultConfig;

  constructor(config: KeyVaultConfig) {
    this.config = config;
  }

  /**
   * Initialize client
   */
  private getClient(): SecretClient {
    if (!this.client) {
      const credential = new DefaultAzureCredential();
      this.client = new SecretClient(this.config.vaultUrl, credential);
    }
    return this.client;
  }

  /**
   * Check if Key Vault is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const client = this.getClient();
      // Try to list secrets (just to check connection)
      const iterator = client.listPropertiesOfSecrets();
      await iterator.next();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get secret from Key Vault
   */
  async getSecret(name: string, version?: string): Promise<Secret | null> {
    try {
      const client = this.getClient();
      const secret = await client.getSecret(name, { version });
      
      if (!secret.value) {
        return null;
      }

      return {
        name: secret.name,
        value: secret.value,
        metadata: {
          name: secret.name,
          version: secret.properties.version,
          createdAt: secret.properties.createdOn ?? new Date(),
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

  /**
   * Set secret in Key Vault
   */
  async setSecret(
    name: string, 
    value: string, 
    metadata?: Partial<SecretMetadata>
  ): Promise<void> {
    const client = this.getClient();
    
    await client.setSecret(name, value, {
      contentType: metadata?.contentType,
      expiresOn: metadata?.expiresAt,
      tags: metadata?.tags,
    });
  }

  /**
   * Delete secret from Key Vault
   */
  async deleteSecret(name: string): Promise<void> {
    const client = this.getClient();
    const poller = await client.beginDeleteSecret(name);
    await poller.pollUntilDone();
  }

  /**
   * List all secrets
   */
  async listSecrets(): Promise<string[]> {
    const client = this.getClient();
    const names: string[] = [];
    
    for await (const properties of client.listPropertiesOfSecrets()) {
      names.push(properties.name);
    }
    
    return names;
  }
}

/**
 * Create Key Vault provider from environment
 */
export function createKeyVaultProvider(): AzureKeyVaultProvider | null {
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  
  if (!vaultUrl) {
    return null;
  }

  return new AzureKeyVaultProvider({ vaultUrl });
}
```

### 1.3 Local Secrets Provider (`src/security/secrets/providers/LocalSecretsProvider.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { CryptoService } from '../encryption/CryptoService';
import { 
  SecretsProvider, 
  Secret, 
  SecretMetadata 
} from '../SecretsManager';

/**
 * Local storage configuration
 */
export interface LocalSecretsConfig {
  storePath: string;
  encryptionKey?: string;
  keyDerivationSalt?: string;
}

/**
 * Encrypted secret store
 */
interface SecretStore {
  version: string;
  secrets: Record<string, {
    value: string;  // Encrypted
    metadata: SecretMetadata;
  }>;
}

/**
 * Local encrypted secrets provider
 */
export class LocalSecretsProvider implements SecretsProvider {
  readonly name = 'local-secrets';
  readonly priority = 50;

  private config: LocalSecretsConfig;
  private crypto: CryptoService;
  private store: SecretStore | null = null;

  constructor(config: LocalSecretsConfig) {
    this.config = config;
    this.crypto = new CryptoService(
      config.encryptionKey || this.getDefaultKey(),
      config.keyDerivationSalt
    );
  }

  /**
   * Get default encryption key
   */
  private getDefaultKey(): string {
    // In production, this should come from environment or secure storage
    const key = process.env.AGENTIC_SECRETS_KEY;
    if (!key) {
      throw new Error(
        'AGENTIC_SECRETS_KEY environment variable required for local secrets'
      );
    }
    return key;
  }

  /**
   * Check if local storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await fs.access(path.dirname(this.config.storePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load store from disk
   */
  private async loadStore(): Promise<SecretStore> {
    if (this.store) {
      return this.store;
    }

    try {
      const content = await fs.readFile(this.config.storePath, 'utf-8');
      this.store = JSON.parse(content);
      return this.store!;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.store = { version: '1.0', secrets: {} };
        return this.store;
      }
      throw error;
    }
  }

  /**
   * Save store to disk
   */
  private async saveStore(): Promise<void> {
    if (!this.store) return;
    
    await fs.mkdir(path.dirname(this.config.storePath), { recursive: true });
    await fs.writeFile(
      this.config.storePath,
      JSON.stringify(this.store, null, 2),
      'utf-8'
    );
  }

  /**
   * Get secret
   */
  async getSecret(name: string): Promise<Secret | null> {
    const store = await this.loadStore();
    const entry = store.secrets[name];
    
    if (!entry) {
      return null;
    }

    // Decrypt value
    const decrypted = this.crypto.decrypt(entry.value);

    return {
      name,
      value: decrypted,
      metadata: entry.metadata,
    };
  }

  /**
   * Set secret
   */
  async setSecret(
    name: string, 
    value: string, 
    metadata?: Partial<SecretMetadata>
  ): Promise<void> {
    const store = await this.loadStore();
    
    // Encrypt value
    const encrypted = this.crypto.encrypt(value);
    
    store.secrets[name] = {
      value: encrypted,
      metadata: {
        name,
        createdAt: new Date(),
        ...metadata,
      },
    };
    
    await this.saveStore();
  }

  /**
   * Delete secret
   */
  async deleteSecret(name: string): Promise<void> {
    const store = await this.loadStore();
    delete store.secrets[name];
    await this.saveStore();
  }

  /**
   * List secrets
   */
  async listSecrets(): Promise<string[]> {
    const store = await this.loadStore();
    return Object.keys(store.secrets);
  }
}

/**
 * Create local secrets provider
 */
export function createLocalSecretsProvider(
  storePath?: string
): LocalSecretsProvider {
  return new LocalSecretsProvider({
    storePath: storePath || path.join(process.cwd(), '.agentic', 'secrets.enc'),
  });
}
```

### 1.4 Environment Provider (`src/security/secrets/providers/EnvironmentProvider.ts`)

```typescript
import { 
  SecretsProvider, 
  Secret, 
  SecretMetadata 
} from '../SecretsManager';

/**
 * Environment variable secrets provider
 */
export class EnvironmentProvider implements SecretsProvider {
  readonly name = 'environment';
  readonly priority = 10;  // Lowest priority (fallback)

  private prefix: string;

  constructor(prefix: string = 'AGENTIC_SECRET_') {
    this.prefix = prefix;
  }

  /**
   * Always available
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Get secret from environment
   */
  async getSecret(name: string): Promise<Secret | null> {
    // Try exact match first
    let value = process.env[name];
    
    // Try with prefix
    if (!value) {
      value = process.env[`${this.prefix}${name}`];
    }
    
    // Try uppercase
    if (!value) {
      value = process.env[name.toUpperCase()];
    }
    
    // Try uppercase with prefix
    if (!value) {
      value = process.env[`${this.prefix}${name.toUpperCase()}`];
    }

    if (!value) {
      return null;
    }

    return {
      name,
      value,
      metadata: {
        name,
        createdAt: new Date(0),  // Unknown
      },
    };
  }

  /**
   * Cannot set environment variables
   */
  async setSecret(): Promise<void> {
    throw new Error('Cannot set secrets via environment provider');
  }

  /**
   * Cannot delete environment variables
   */
  async deleteSecret(): Promise<void> {
    throw new Error('Cannot delete secrets via environment provider');
  }

  /**
   * List secrets from environment
   */
  async listSecrets(): Promise<string[]> {
    return Object.keys(process.env)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''));
  }
}

/**
 * Create environment provider
 */
export function createEnvironmentProvider(
  prefix?: string
): EnvironmentProvider {
  return new EnvironmentProvider(prefix);
}
```

### 1.5 Crypto Service (`src/security/secrets/encryption/CryptoService.ts`)

```typescript
import * as crypto from 'crypto';

/**
 * Encryption configuration
 */
export interface CryptoConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltLength: number;
  iterations: number;
}

const DEFAULT_CONFIG: CryptoConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  saltLength: 16,
  iterations: 100000,
};

/**
 * Cryptographic service for encryption/decryption
 */
export class CryptoService {
  private config: CryptoConfig;
  private masterKey: Buffer;

  constructor(
    password: string, 
    salt?: string,
    config?: Partial<CryptoConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Derive key from password
    const saltBuffer = salt 
      ? Buffer.from(salt, 'hex')
      : crypto.randomBytes(this.config.saltLength);
    
    this.masterKey = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      this.config.iterations,
      this.config.keyLength,
      'sha512'
    );
  }

  /**
   * Encrypt plaintext
   * Returns: iv:authTag:ciphertext (all hex encoded)
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.config.ivLength);
    
    const cipher = crypto.createCipheriv(
      this.config.algorithm,
      this.masterKey,
      iv
    ) as crypto.CipherGCM;
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt ciphertext
   */
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(
      this.config.algorithm,
      this.masterKey,
      iv
    ) as crypto.DecipherGCM;
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Hash a value (one-way)
   */
  hash(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value)
      .digest('hex');
  }

  /**
   * Generate secure random string
   */
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure password
   */
  static generatePassword(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomBytes = crypto.randomBytes(length);
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i] % chars.length];
    }
    
    return password;
  }
}
```

### 1.6 Secret Detector (`src/security/secrets/detection/SecretDetector.ts`)

```typescript
/**
 * Detection result
 */
export interface SecretDetection {
  type: string;
  pattern: string;
  line: number;
  column: number;
  match: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

/**
 * Secret pattern
 */
interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: SecretDetection['severity'];
  suggestion: string;
}

/**
 * Secret detector - detects hardcoded secrets in code
 * 
 * Note: For production use, integrate with GitGuardian MCP
 * which has 500+ secret detectors.
 */
export class SecretDetector {
  private patterns: SecretPattern[] = [
    // API Keys
    {
      name: 'Generic API Key',
      pattern: /api[_-]?key\s*[:=]\s*['"]([^'"]{20,})['"]|API_KEY\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
      severity: 'high',
      suggestion: 'Use environment variable or secrets manager',
    },
    // Passwords
    {
      name: 'Hardcoded Password',
      pattern: /password\s*[:=]\s*['"]([^'"]+)['"]/gi,
      severity: 'critical',
      suggestion: 'Never hardcode passwords. Use secrets manager.',
    },
    // AWS
    {
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      severity: 'critical',
      suggestion: 'Use AWS IAM roles or secrets manager',
    },
    {
      name: 'AWS Secret Key',
      pattern: /[A-Za-z0-9/+=]{40}/g,
      severity: 'critical',
      suggestion: 'Use AWS IAM roles or secrets manager',
    },
    // Azure
    {
      name: 'Azure Storage Key',
      pattern: /AccountKey=[A-Za-z0-9+/=]{88}/g,
      severity: 'critical',
      suggestion: 'Use Azure Key Vault or managed identity',
    },
    {
      name: 'Azure Connection String',
      pattern: /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[^;]+/g,
      severity: 'critical',
      suggestion: 'Store connection strings in Key Vault',
    },
    // GitHub
    {
      name: 'GitHub Token',
      pattern: /ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g,
      severity: 'critical',
      suggestion: 'Use GITHUB_TOKEN or secrets',
    },
    // Private Keys
    {
      name: 'Private Key',
      pattern: /-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
      severity: 'critical',
      suggestion: 'Never commit private keys. Use Key Vault.',
    },
    // JWT
    {
      name: 'JWT Secret',
      pattern: /jwt[_-]?secret\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
      severity: 'high',
      suggestion: 'Store JWT secrets in secrets manager',
    },
    // Generic Secret
    {
      name: 'Generic Secret',
      pattern: /secret\s*[:=]\s*['"]([^'"]{16,})['"]/gi,
      severity: 'medium',
      suggestion: 'Review if this is a sensitive value',
    },
    // Database URLs
    {
      name: 'Database URL with credentials',
      pattern: /(mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@/gi,
      severity: 'critical',
      suggestion: 'Use secrets manager for database credentials',
    },
  ];

  /**
   * Scan content for secrets
   */
  scan(content: string, filename?: string): SecretDetection[] {
    const detections: SecretDetection[] = [];
    const lines = content.split('\n');

    for (const pattern of this.patterns) {
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        let match: RegExpExecArray | null;
        
        // Reset regex lastIndex
        pattern.pattern.lastIndex = 0;
        
        while ((match = pattern.pattern.exec(line)) !== null) {
          // Skip if in comment
          if (this.isInComment(line, match.index)) {
            continue;
          }

          // Skip common false positives
          if (this.isFalsePositive(match[0], pattern.name)) {
            continue;
          }

          detections.push({
            type: pattern.name,
            pattern: pattern.pattern.source,
            line: lineNum + 1,
            column: match.index + 1,
            match: this.maskSecret(match[0]),
            severity: pattern.severity,
            suggestion: pattern.suggestion,
          });
        }
      }
    }

    return detections;
  }

  /**
   * Check if position is inside a comment
   */
  private isInComment(line: string, position: number): boolean {
    // Simple check for common comment patterns
    const beforePosition = line.substring(0, position);
    return (
      beforePosition.includes('//') ||
      beforePosition.includes('#') ||
      beforePosition.includes('/*')
    );
  }

  /**
   * Check for common false positives
   */
  private isFalsePositive(match: string, patternName: string): boolean {
    const falsePositives = [
      'password123',
      'your-api-key',
      'your-secret',
      'xxx',
      'placeholder',
      'example',
      'test',
      '<',
      '>',
      '${',
      '{{',
    ];

    const lowerMatch = match.toLowerCase();
    return falsePositives.some(fp => lowerMatch.includes(fp));
  }

  /**
   * Mask secret for safe display
   */
  private maskSecret(secret: string): string {
    if (secret.length <= 8) {
      return '***';
    }
    return secret.substring(0, 4) + '***' + secret.substring(secret.length - 4);
  }

  /**
   * Get severity level
   */
  getSeverityLevel(severity: SecretDetection['severity']): number {
    const levels: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    return levels[severity] || 0;
  }

  /**
   * Filter by minimum severity
   */
  filterBySeverity(
    detections: SecretDetection[], 
    minSeverity: SecretDetection['severity']
  ): SecretDetection[] {
    const minLevel = this.getSeverityLevel(minSeverity);
    return detections.filter(d => this.getSeverityLevel(d.severity) >= minLevel);
  }
}

/**
 * Create secret detector
 */
export function createSecretDetector(): SecretDetector {
  return new SecretDetector();
}
```

---

## 🔌 MCP Integration

### GitGuardian MCP voor Secret Detection

```typescript
// src/security/mcp/GitGuardianMCP.ts

import { MCPClient } from '../../mcp/MCPClient';

/**
 * GitGuardian MCP integration
 * Uses 500+ secret detectors from GitGuardian
 */
export class GitGuardianMCP {
  private client: MCPClient;

  constructor() {
    this.client = new MCPClient('gitguardian');
  }

  /**
   * Scan content for secrets
   */
  async scanContent(content: string): Promise<SecretDetection[]> {
    const result = await this.client.call('scan_content', {
      content,
      include_all_detectors: true,
    });
    
    return result.detections.map((d: any) => ({
      type: d.detector_name,
      pattern: d.detector_id,
      line: d.location?.start_line ?? 0,
      column: d.location?.start_column ?? 0,
      match: d.match_preview,
      severity: this.mapSeverity(d.severity),
      suggestion: d.remediation || 'Remove this secret',
    }));
  }

  /**
   * Scan file
   */
  async scanFile(filePath: string): Promise<SecretDetection[]> {
    const result = await this.client.call('scan_file', {
      path: filePath,
    });
    
    return result.detections;
  }

  /**
   * Map GitGuardian severity to our severity
   */
  private mapSeverity(ggSeverity: string): SecretDetection['severity'] {
    const mapping: Record<string, SecretDetection['severity']> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      info: 'low',
    };
    return mapping[ggSeverity.toLowerCase()] || 'medium';
  }
}
```

---

## 📋 Acceptance Criteria

- [ ] SecretsManager supports multiple providers
- [ ] Azure Key Vault provider works with real vault
- [ ] Local secrets are encrypted at rest
- [ ] Environment provider works as fallback
- [ ] Secret detection finds common patterns
- [ ] Encryption uses secure algorithms (AES-256-GCM)
- [ ] Cache invalidation works correctly
- [ ] MCP integration ready for GitGuardian

---

## 🔗 Navigation

← [00-OVERVIEW.md](00-OVERVIEW.md) | [02-PHASE-SECURITY-SCANNING.md](02-PHASE-SECURITY-SCANNING.md) →
