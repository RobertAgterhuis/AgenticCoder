/**
 * EnvironmentProvider.ts
 * Environment variables secrets provider
 */

import { SecretsProvider, Secret, SecretMetadata } from '../SecretsManager';

export interface EnvironmentProviderConfig {
  prefix?: string;
  allowWrite?: boolean;
}

export class EnvironmentProvider implements SecretsProvider {
  readonly name = 'environment';
  readonly priority = 25;

  private config: EnvironmentProviderConfig;

  constructor(config: EnvironmentProviderConfig = {}) {
    this.config = {
      prefix: '',
      allowWrite: false,
      ...config,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  private getEnvName(name: string): string {
    const envName = name.toUpperCase().replace(/[-.]/g, '_');
    return this.config.prefix ? `${this.config.prefix}${envName}` : envName;
  }

  async getSecret(name: string): Promise<Secret | null> {
    const envName = this.getEnvName(name);
    const value = process.env[envName];
    
    if (value === undefined) {
      return null;
    }

    return {
      name,
      value,
      metadata: {
        name,
        createdAt: new Date(),
        tags: { source: 'environment', envVar: envName },
      },
    };
  }

  async setSecret(name: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void> {
    if (!this.config.allowWrite) {
      throw new Error('EnvironmentProvider is read-only by default');
    }
    
    const envName = this.getEnvName(name);
    process.env[envName] = value;
  }

  async deleteSecret(name: string): Promise<void> {
    if (!this.config.allowWrite) {
      throw new Error('EnvironmentProvider is read-only by default');
    }
    
    const envName = this.getEnvName(name);
    delete process.env[envName];
  }

  async listSecrets(): Promise<string[]> {
    const secrets: string[] = [];
    const prefix = this.config.prefix || '';
    
    for (const key of Object.keys(process.env)) {
      if (!prefix || key.startsWith(prefix)) {
        const name = prefix ? key.slice(prefix.length) : key;
        secrets.push(name.toLowerCase().replace(/_/g, '-'));
      }
    }
    
    return secrets;
  }
}

export default EnvironmentProvider;
