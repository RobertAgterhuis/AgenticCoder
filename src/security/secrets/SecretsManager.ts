/**
 * SecretsManager.ts
 * Core secrets management with multi-provider support
 */

export interface SecretMetadata {
  name: string;
  version?: string;
  createdAt: Date;
  expiresAt?: Date;
  contentType?: string;
  tags?: Record<string, string>;
}

export interface Secret {
  name: string;
  value: string;
  metadata: SecretMetadata;
}

export interface SecretsProviderOptions {
  cache?: boolean;
  cacheTtl?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface SecretsProvider {
  readonly name: string;
  readonly priority: number;
  isAvailable(): Promise<boolean>;
  getSecret(name: string, version?: string): Promise<Secret | null>;
  setSecret(name: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void>;
  deleteSecret(name: string): Promise<void>;
  listSecrets(): Promise<string[]>;
}

export class SecretsManager {
  private providers: SecretsProvider[] = [];
  private cache: Map<string, { secret: Secret; expiresAt: number }> = new Map();
  private options: SecretsProviderOptions;

  constructor(options: SecretsProviderOptions = {}) {
    this.options = {
      cache: true,
      cacheTtl: 300,
      retryCount: 3,
      retryDelay: 1000,
      ...options,
    };
  }

  registerProvider(provider: SecretsProvider): void {
    this.providers.push(provider);
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  async getSecret(name: string, version?: string): Promise<Secret | null> {
    if (this.options.cache) {
      const cached = this.cache.get(name);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.secret;
      }
    }

    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        const secret = await this.retryOperation(() => provider.getSecret(name, version));
        if (secret) {
          if (this.options.cache) {
            this.cache.set(name, {
              secret,
              expiresAt: Date.now() + (this.options.cacheTtl! * 1000),
            });
          }
          return secret;
        }
      }
    }
    return null;
  }

  async setSecret(name: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        await this.retryOperation(() => provider.setSecret(name, value, metadata));
        this.cache.delete(name);
        return;
      }
    }
    throw new Error('No available secrets provider');
  }

  async deleteSecret(name: string): Promise<void> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        await this.retryOperation(() => provider.deleteSecret(name));
        this.cache.delete(name);
        return;
      }
    }
    throw new Error('No available secrets provider');
  }

  async listSecrets(): Promise<string[]> {
    const allSecrets = new Set<string>();
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        const secrets = await provider.listSecrets();
        secrets.forEach(s => allSecrets.add(s));
      }
    }
    return Array.from(allSecrets);
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let i = 0; i < this.options.retryCount!; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < this.options.retryCount! - 1) {
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay!));
        }
      }
    }
    throw lastError;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default SecretsManager;
