# Phase 1: Environment Management

**Phase ID:** F-DRP-P01  
**Feature:** DeploymentReleasePipeline  
**Duration:** 2-3 days  
**Status:** ⬜ Not Started  
**Depends On:** None

---

## 🎯 Phase Objectives

Deze phase implementeert environment management:
- Environment configuration per stage (dev/staging/prod)
- Secret injection per environment
- Environment variable management
- Multi-cloud environment support

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── deployment/
│   └── environment/
│       ├── index.ts
│       ├── EnvironmentManager.ts
│       ├── EnvironmentConfig.ts
│       ├── SecretInjector.ts
│       └── providers/
│           ├── AzureEnvironmentProvider.ts
│           ├── AWSEnvironmentProvider.ts
│           └── LocalEnvironmentProvider.ts
```

---

## 🔧 Implementation Details

### 1.1 Environment Types (`src/deployment/environment/EnvironmentConfig.ts`)

```typescript
/**
 * Environment stages
 */
export type EnvironmentStage = 'development' | 'staging' | 'production';

/**
 * Deployment strategy
 */
export type DeploymentStrategy = 
  | 'rolling'
  | 'blue-green'
  | 'canary'
  | 'recreate';

/**
 * Cloud provider
 */
export type CloudProvider = 'azure' | 'aws' | 'gcp' | 'local';

/**
 * Azure-specific configuration
 */
export interface AzureConfig {
  subscriptionId: string;
  resourceGroup: string;
  location: string;
  appService?: {
    name: string;
    plan: string;
    runtime: string;
  };
  containerApp?: {
    name: string;
    environment: string;
  };
  keyVault?: {
    name: string;
    secretPrefix?: string;
  };
}

/**
 * AWS-specific configuration
 */
export interface AWSConfig {
  region: string;
  accountId?: string;
  ecs?: {
    cluster: string;
    service: string;
  };
  lambda?: {
    functionName: string;
  };
}

/**
 * Secret reference
 */
export interface SecretReference {
  name: string;
  source: 'key-vault' | 'secrets-manager' | 'environment' | 'file';
  key: string;
  version?: string;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  stage: EnvironmentStage;
  provider: CloudProvider;
  variables: Record<string, string>;
  secrets: SecretReference[];
  azure?: AzureConfig;
  aws?: AWSConfig;
  deployment: {
    strategy: DeploymentStrategy;
    timeout: number;
    healthCheckPath?: string;
    approvalRequired: boolean;
    notifications?: {
      slack?: string;
      email?: string[];
    };
  };
  scaling?: {
    minInstances: number;
    maxInstances: number;
    targetCpu?: number;
  };
}

/**
 * Multi-environment configuration
 */
export interface EnvironmentsConfig {
  defaultProvider: CloudProvider;
  environments: Record<EnvironmentStage, EnvironmentConfig>;
  shared?: {
    variables: Record<string, string>;
    secrets: SecretReference[];
  };
}

/**
 * Create default environment config
 */
export function createDefaultEnvironmentConfig(
  stage: EnvironmentStage
): EnvironmentConfig {
  const baseConfig: EnvironmentConfig = {
    stage,
    provider: 'azure',
    variables: {
      NODE_ENV: stage === 'production' ? 'production' : stage,
    },
    secrets: [],
    deployment: {
      strategy: stage === 'production' ? 'blue-green' : 'rolling',
      timeout: 600,
      healthCheckPath: '/health',
      approvalRequired: stage === 'production',
    },
  };

  // Stage-specific defaults
  switch (stage) {
    case 'development':
      baseConfig.variables.LOG_LEVEL = 'debug';
      baseConfig.scaling = { minInstances: 1, maxInstances: 1 };
      break;
    case 'staging':
      baseConfig.variables.LOG_LEVEL = 'info';
      baseConfig.scaling = { minInstances: 1, maxInstances: 3 };
      break;
    case 'production':
      baseConfig.variables.LOG_LEVEL = 'warn';
      baseConfig.scaling = { minInstances: 2, maxInstances: 10, targetCpu: 70 };
      break;
  }

  return baseConfig;
}
```

### 1.2 Environment Manager (`src/deployment/environment/EnvironmentManager.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { EventEmitter } from 'events';
import {
  EnvironmentConfig,
  EnvironmentsConfig,
  EnvironmentStage,
  SecretReference,
  createDefaultEnvironmentConfig,
} from './EnvironmentConfig';
import { SecretInjector, createSecretInjector } from './SecretInjector';

/**
 * Resolved environment with secrets
 */
export interface ResolvedEnvironment {
  stage: EnvironmentStage;
  variables: Record<string, string>;
  resolvedSecrets: Record<string, string>;
  config: EnvironmentConfig;
}

/**
 * Environment validation result
 */
export interface EnvironmentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Environment manager - handles multi-environment configuration
 */
export class EnvironmentManager extends EventEmitter {
  private configPath: string;
  private config: EnvironmentsConfig | null = null;
  private secretInjector: SecretInjector;
  private resolvedCache: Map<EnvironmentStage, ResolvedEnvironment> = new Map();

  constructor(configPath: string = '.agenticcoder/environments.yml') {
    super();
    this.configPath = configPath;
    this.secretInjector = createSecretInjector();
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<EnvironmentsConfig> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      this.config = yaml.parse(content) as EnvironmentsConfig;
      this.emit('config-loaded', this.config);
      return this.config;
    } catch (error) {
      // Create default config if not found
      this.config = this.createDefaultConfig();
      this.emit('config-created', this.config);
      return this.config;
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config?: EnvironmentsConfig): Promise<void> {
    const configToSave = config || this.config;
    if (!configToSave) {
      throw new Error('No configuration to save');
    }

    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    
    const content = yaml.stringify(configToSave);
    await fs.writeFile(this.configPath, content, 'utf-8');
    
    this.config = configToSave;
    this.emit('config-saved', configToSave);
  }

  /**
   * Get environment configuration
   */
  getEnvironment(stage: EnvironmentStage): EnvironmentConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    const envConfig = this.config.environments[stage];
    if (!envConfig) {
      throw new Error(`Environment '${stage}' not found`);
    }

    // Merge shared config
    return this.mergeWithShared(envConfig);
  }

  /**
   * Get all environments
   */
  getAllEnvironments(): Record<EnvironmentStage, EnvironmentConfig> {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    return Object.fromEntries(
      Object.entries(this.config.environments).map(([stage, config]) => [
        stage as EnvironmentStage,
        this.mergeWithShared(config),
      ])
    ) as Record<EnvironmentStage, EnvironmentConfig>;
  }

  /**
   * Resolve environment (fetch secrets)
   */
  async resolveEnvironment(
    stage: EnvironmentStage
  ): Promise<ResolvedEnvironment> {
    // Check cache
    const cached = this.resolvedCache.get(stage);
    if (cached) {
      return cached;
    }

    const config = this.getEnvironment(stage);
    
    // Resolve secrets
    const resolvedSecrets: Record<string, string> = {};
    for (const secret of config.secrets) {
      try {
        const value = await this.secretInjector.resolveSecret(secret, config);
        resolvedSecrets[secret.name] = value;
      } catch (error) {
        this.emit('secret-error', { secret, error });
        throw new Error(`Failed to resolve secret '${secret.name}': ${(error as Error).message}`);
      }
    }

    const resolved: ResolvedEnvironment = {
      stage,
      variables: { ...config.variables },
      resolvedSecrets,
      config,
    };

    this.resolvedCache.set(stage, resolved);
    this.emit('environment-resolved', resolved);
    
    return resolved;
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment(stage: EnvironmentStage): EnvironmentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const config = this.getEnvironment(stage);

      // Check required fields
      if (!config.provider) {
        errors.push('Provider is required');
      }

      // Check deployment config
      if (!config.deployment) {
        errors.push('Deployment configuration is required');
      } else {
        if (config.deployment.timeout < 60) {
          warnings.push('Deployment timeout is very short (< 60s)');
        }
        if (stage === 'production' && !config.deployment.approvalRequired) {
          warnings.push('Production deployment does not require approval');
        }
      }

      // Check Azure config
      if (config.provider === 'azure') {
        if (!config.azure) {
          errors.push('Azure configuration required when provider is azure');
        } else {
          if (!config.azure.resourceGroup) {
            errors.push('Azure resource group is required');
          }
          if (!config.azure.subscriptionId) {
            warnings.push('Azure subscription ID not specified');
          }
        }
      }

      // Check secrets
      for (const secret of config.secrets) {
        if (!secret.name || !secret.key) {
          errors.push(`Invalid secret configuration: ${JSON.stringify(secret)}`);
        }
      }

      // Check scaling
      if (config.scaling) {
        if (config.scaling.minInstances > config.scaling.maxInstances) {
          errors.push('minInstances cannot be greater than maxInstances');
        }
        if (stage === 'production' && config.scaling.minInstances < 2) {
          warnings.push('Production environment has less than 2 minimum instances');
        }
      }

    } catch (error) {
      errors.push((error as Error).message);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate all environments
   */
  validateAllEnvironments(): Map<EnvironmentStage, EnvironmentValidationResult> {
    const results = new Map<EnvironmentStage, EnvironmentValidationResult>();
    const stages: EnvironmentStage[] = ['development', 'staging', 'production'];

    for (const stage of stages) {
      results.set(stage, this.validateEnvironment(stage));
    }

    return results;
  }

  /**
   * Update environment configuration
   */
  updateEnvironment(
    stage: EnvironmentStage,
    updates: Partial<EnvironmentConfig>
  ): void {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    this.config.environments[stage] = {
      ...this.config.environments[stage],
      ...updates,
    };

    // Clear cache
    this.resolvedCache.delete(stage);
    this.emit('environment-updated', { stage, updates });
  }

  /**
   * Add secret to environment
   */
  addSecret(stage: EnvironmentStage, secret: SecretReference): void {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const envConfig = this.config.environments[stage];
    if (!envConfig.secrets) {
      envConfig.secrets = [];
    }

    // Check for duplicate
    const existing = envConfig.secrets.findIndex(s => s.name === secret.name);
    if (existing >= 0) {
      envConfig.secrets[existing] = secret;
    } else {
      envConfig.secrets.push(secret);
    }

    this.resolvedCache.delete(stage);
    this.emit('secret-added', { stage, secret });
  }

  /**
   * Get environment variables for deployment
   */
  async getDeploymentVariables(
    stage: EnvironmentStage
  ): Promise<Record<string, string>> {
    const resolved = await this.resolveEnvironment(stage);
    
    return {
      ...resolved.variables,
      ...resolved.resolvedSecrets,
    };
  }

  /**
   * Compare environments
   */
  compareEnvironments(
    stage1: EnvironmentStage,
    stage2: EnvironmentStage
  ): {
    added: string[];
    removed: string[];
    changed: string[];
  } {
    const config1 = this.getEnvironment(stage1);
    const config2 = this.getEnvironment(stage2);

    const vars1 = Object.keys(config1.variables);
    const vars2 = Object.keys(config2.variables);

    const added = vars2.filter(v => !vars1.includes(v));
    const removed = vars1.filter(v => !vars2.includes(v));
    const changed = vars1.filter(
      v => vars2.includes(v) && config1.variables[v] !== config2.variables[v]
    );

    return { added, removed, changed };
  }

  /**
   * Clear resolved cache
   */
  clearCache(): void {
    this.resolvedCache.clear();
  }

  /**
   * Merge environment config with shared config
   */
  private mergeWithShared(envConfig: EnvironmentConfig): EnvironmentConfig {
    if (!this.config?.shared) {
      return envConfig;
    }

    return {
      ...envConfig,
      variables: {
        ...this.config.shared.variables,
        ...envConfig.variables,
      },
      secrets: [
        ...(this.config.shared.secrets || []),
        ...(envConfig.secrets || []),
      ],
    };
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): EnvironmentsConfig {
    return {
      defaultProvider: 'azure',
      environments: {
        development: createDefaultEnvironmentConfig('development'),
        staging: createDefaultEnvironmentConfig('staging'),
        production: createDefaultEnvironmentConfig('production'),
      },
      shared: {
        variables: {
          APP_NAME: 'my-app',
        },
        secrets: [],
      },
    };
  }
}

/**
 * Create environment manager
 */
export function createEnvironmentManager(
  configPath?: string
): EnvironmentManager {
  return new EnvironmentManager(configPath);
}
```

### 1.3 Secret Injector (`src/deployment/environment/SecretInjector.ts`)

```typescript
import { EnvironmentConfig, SecretReference } from './EnvironmentConfig';

/**
 * Secret provider interface
 */
export interface SecretProvider {
  name: string;
  canHandle(secret: SecretReference): boolean;
  resolve(secret: SecretReference, config: EnvironmentConfig): Promise<string>;
}

/**
 * Azure Key Vault secret provider
 */
export class AzureKeyVaultSecretProvider implements SecretProvider {
  name = 'azure-key-vault';

  canHandle(secret: SecretReference): boolean {
    return secret.source === 'key-vault';
  }

  async resolve(
    secret: SecretReference,
    config: EnvironmentConfig
  ): Promise<string> {
    // In production, would use @azure/keyvault-secrets
    // For now, use Azure MCP or fallback to environment
    
    const keyVaultName = config.azure?.keyVault?.name;
    if (!keyVaultName) {
      throw new Error('Azure Key Vault name not configured');
    }

    // Try environment variable fallback for local development
    const envKey = `${secret.key.toUpperCase().replace(/-/g, '_')}`;
    const envValue = process.env[envKey];
    
    if (envValue) {
      return envValue;
    }

    // In production, would call:
    // const client = new SecretClient(`https://${keyVaultName}.vault.azure.net/`, credential);
    // const secretValue = await client.getSecret(secret.key);
    // return secretValue.value;

    throw new Error(
      `Secret '${secret.key}' not found in Key Vault '${keyVaultName}'. ` +
      `Set ${envKey} environment variable for local development.`
    );
  }
}

/**
 * AWS Secrets Manager provider
 */
export class AWSSecretsManagerProvider implements SecretProvider {
  name = 'aws-secrets-manager';

  canHandle(secret: SecretReference): boolean {
    return secret.source === 'secrets-manager';
  }

  async resolve(
    secret: SecretReference,
    config: EnvironmentConfig
  ): Promise<string> {
    // Would use @aws-sdk/client-secrets-manager
    const envKey = `${secret.key.toUpperCase().replace(/-/g, '_')}`;
    const envValue = process.env[envKey];
    
    if (envValue) {
      return envValue;
    }

    throw new Error(
      `Secret '${secret.key}' not found. Set ${envKey} environment variable.`
    );
  }
}

/**
 * Environment variable provider
 */
export class EnvironmentSecretProvider implements SecretProvider {
  name = 'environment';

  canHandle(secret: SecretReference): boolean {
    return secret.source === 'environment';
  }

  async resolve(secret: SecretReference): Promise<string> {
    const value = process.env[secret.key];
    
    if (!value) {
      throw new Error(`Environment variable '${secret.key}' not set`);
    }

    return value;
  }
}

/**
 * File-based secret provider
 */
export class FileSecretProvider implements SecretProvider {
  name = 'file';

  canHandle(secret: SecretReference): boolean {
    return secret.source === 'file';
  }

  async resolve(secret: SecretReference): Promise<string> {
    const fs = await import('fs/promises');
    
    try {
      const content = await fs.readFile(secret.key, 'utf-8');
      return content.trim();
    } catch (error) {
      throw new Error(`Failed to read secret from file '${secret.key}'`);
    }
  }
}

/**
 * Secret injector - resolves secrets from various sources
 */
export class SecretInjector {
  private providers: SecretProvider[] = [];

  constructor() {
    // Register default providers
    this.registerProvider(new AzureKeyVaultSecretProvider());
    this.registerProvider(new AWSSecretsManagerProvider());
    this.registerProvider(new EnvironmentSecretProvider());
    this.registerProvider(new FileSecretProvider());
  }

  /**
   * Register a secret provider
   */
  registerProvider(provider: SecretProvider): void {
    this.providers.push(provider);
  }

  /**
   * Resolve a secret
   */
  async resolveSecret(
    secret: SecretReference,
    config: EnvironmentConfig
  ): Promise<string> {
    const provider = this.providers.find(p => p.canHandle(secret));
    
    if (!provider) {
      throw new Error(`No provider found for secret source: ${secret.source}`);
    }

    return provider.resolve(secret, config);
  }

  /**
   * Resolve all secrets for an environment
   */
  async resolveAllSecrets(
    secrets: SecretReference[],
    config: EnvironmentConfig
  ): Promise<Record<string, string>> {
    const resolved: Record<string, string> = {};

    for (const secret of secrets) {
      resolved[secret.name] = await this.resolveSecret(secret, config);
    }

    return resolved;
  }

  /**
   * Validate secret reference
   */
  validateSecret(secret: SecretReference): { valid: boolean; error?: string } {
    if (!secret.name) {
      return { valid: false, error: 'Secret name is required' };
    }

    if (!secret.source) {
      return { valid: false, error: 'Secret source is required' };
    }

    if (!secret.key) {
      return { valid: false, error: 'Secret key is required' };
    }

    const provider = this.providers.find(p => p.canHandle(secret));
    if (!provider) {
      return { valid: false, error: `Unknown secret source: ${secret.source}` };
    }

    return { valid: true };
  }
}

/**
 * Create secret injector
 */
export function createSecretInjector(): SecretInjector {
  return new SecretInjector();
}
```

### 1.4 Azure Environment Provider (`src/deployment/environment/providers/AzureEnvironmentProvider.ts`)

```typescript
import { EnvironmentConfig, AzureConfig, EnvironmentStage } from '../EnvironmentConfig';

/**
 * Azure resource naming conventions
 */
export interface AzureNamingConvention {
  resourceGroup: (appName: string, stage: EnvironmentStage) => string;
  appService: (appName: string, stage: EnvironmentStage) => string;
  keyVault: (appName: string, stage: EnvironmentStage) => string;
  storageAccount: (appName: string, stage: EnvironmentStage) => string;
  containerApp: (appName: string, stage: EnvironmentStage) => string;
}

/**
 * Default Azure naming convention
 */
export const defaultAzureNaming: AzureNamingConvention = {
  resourceGroup: (appName, stage) => `rg-${appName}-${stage}`,
  appService: (appName, stage) => `app-${appName}-${stage}`,
  keyVault: (appName, stage) => `kv-${appName}-${stage}`.substring(0, 24),
  storageAccount: (appName, stage) => `st${appName}${stage}`.replace(/-/g, '').substring(0, 24),
  containerApp: (appName, stage) => `ca-${appName}-${stage}`,
};

/**
 * Azure environment provider - generates Azure-specific config
 */
export class AzureEnvironmentProvider {
  private subscriptionId: string;
  private location: string;
  private naming: AzureNamingConvention;

  constructor(options: {
    subscriptionId: string;
    location?: string;
    naming?: Partial<AzureNamingConvention>;
  }) {
    this.subscriptionId = options.subscriptionId;
    this.location = options.location || 'westeurope';
    this.naming = { ...defaultAzureNaming, ...options.naming };
  }

  /**
   * Generate Azure configuration for environment
   */
  generateConfig(
    appName: string,
    stage: EnvironmentStage,
    options?: {
      useContainerApps?: boolean;
      useAppService?: boolean;
      runtime?: string;
    }
  ): AzureConfig {
    const config: AzureConfig = {
      subscriptionId: this.subscriptionId,
      resourceGroup: this.naming.resourceGroup(appName, stage),
      location: this.location,
      keyVault: {
        name: this.naming.keyVault(appName, stage),
        secretPrefix: stage,
      },
    };

    if (options?.useContainerApps) {
      config.containerApp = {
        name: this.naming.containerApp(appName, stage),
        environment: `cae-${appName}-${stage}`,
      };
    }

    if (options?.useAppService !== false) {
      config.appService = {
        name: this.naming.appService(appName, stage),
        plan: `asp-${appName}-${stage}`,
        runtime: options?.runtime || 'NODE|18-lts',
      };
    }

    return config;
  }

  /**
   * Generate full environment configuration
   */
  generateEnvironmentConfig(
    appName: string,
    stage: EnvironmentStage,
    options?: {
      useContainerApps?: boolean;
      runtime?: string;
    }
  ): EnvironmentConfig {
    const azureConfig = this.generateConfig(appName, stage, options);

    return {
      stage,
      provider: 'azure',
      variables: {
        NODE_ENV: stage === 'production' ? 'production' : stage,
        AZURE_RESOURCE_GROUP: azureConfig.resourceGroup,
        AZURE_LOCATION: azureConfig.location,
      },
      secrets: [
        {
          name: 'DATABASE_URL',
          source: 'key-vault',
          key: `${stage}-database-url`,
        },
        {
          name: 'API_KEY',
          source: 'key-vault',
          key: `${stage}-api-key`,
        },
      ],
      azure: azureConfig,
      deployment: {
        strategy: stage === 'production' ? 'blue-green' : 'rolling',
        timeout: stage === 'production' ? 900 : 600,
        healthCheckPath: '/health',
        approvalRequired: stage === 'production',
      },
      scaling: this.getScalingConfig(stage),
    };
  }

  /**
   * Generate all environment configurations
   */
  generateAllEnvironments(
    appName: string,
    options?: {
      useContainerApps?: boolean;
      runtime?: string;
    }
  ): Record<EnvironmentStage, EnvironmentConfig> {
    const stages: EnvironmentStage[] = ['development', 'staging', 'production'];
    
    return Object.fromEntries(
      stages.map(stage => [
        stage,
        this.generateEnvironmentConfig(appName, stage, options),
      ])
    ) as Record<EnvironmentStage, EnvironmentConfig>;
  }

  /**
   * Get scaling configuration for stage
   */
  private getScalingConfig(stage: EnvironmentStage) {
    switch (stage) {
      case 'development':
        return { minInstances: 0, maxInstances: 1 };
      case 'staging':
        return { minInstances: 1, maxInstances: 3 };
      case 'production':
        return { minInstances: 2, maxInstances: 10, targetCpu: 70 };
    }
  }

  /**
   * Get Azure CLI commands for setup
   */
  getSetupCommands(appName: string, stage: EnvironmentStage): string[] {
    const config = this.generateConfig(appName, stage);
    
    return [
      `# Create resource group`,
      `az group create --name ${config.resourceGroup} --location ${config.location}`,
      ``,
      `# Create Key Vault`,
      `az keyvault create --name ${config.keyVault?.name} --resource-group ${config.resourceGroup} --location ${config.location}`,
      ``,
      `# Create App Service Plan`,
      `az appservice plan create --name ${config.appService?.plan} --resource-group ${config.resourceGroup} --sku B1 --is-linux`,
      ``,
      `# Create App Service`,
      `az webapp create --name ${config.appService?.name} --resource-group ${config.resourceGroup} --plan ${config.appService?.plan} --runtime "${config.appService?.runtime}"`,
    ];
  }
}

/**
 * Create Azure environment provider
 */
export function createAzureEnvironmentProvider(options: {
  subscriptionId: string;
  location?: string;
  naming?: Partial<AzureNamingConvention>;
}): AzureEnvironmentProvider {
  return new AzureEnvironmentProvider(options);
}
```

---

## 📋 Acceptance Criteria

- [ ] Environment configurations load from YAML
- [ ] Secrets resolve from multiple sources
- [ ] Environment validation catches misconfigurations
- [ ] Azure-specific config generation works
- [ ] Environment comparison works correctly
- [ ] Caching prevents redundant secret fetches

---

## 🔗 Navigation

← [00-OVERVIEW.md](00-OVERVIEW.md) | [02-PHASE-PIPELINE-GENERATION.md](02-PHASE-PIPELINE-GENERATION.md) →
