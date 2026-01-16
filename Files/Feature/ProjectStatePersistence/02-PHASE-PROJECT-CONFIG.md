# Phase 2: Project Configuration

**Phase ID:** F-PSP-P02  
**Feature:** ProjectStatePersistence  
**Duration:** 2-3 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 1 (StateStore Foundation)

---

## 🎯 Phase Objectives

Deze phase implementeert **Project Configuration Management**:
- `.agenticcoder/config.json` schema en management
- Project initialization en validation
- Config versioning en migration
- Environment-specific overrides
- Secure credential storage

---

## 📦 Deliverables

### 1. Package Structure

```
packages/state/src/
├── config/
│   ├── index.ts                    # Public exports
│   ├── ProjectConfig.ts            # Main config class
│   ├── ConfigSchema.ts             # Zod schema definitions
│   ├── ConfigLoader.ts             # Load/save operations
│   ├── ConfigValidator.ts          # Validation logic
│   ├── ConfigMigrator.ts           # Version migrations
│   ├── EnvironmentConfig.ts        # Env-specific overrides
│   └── SecretManager.ts            # Credential storage
```

---

## 🔧 Implementation Details

### 2.1 Configuration Schema (`src/config/ConfigSchema.ts`)

```typescript
import { z } from 'zod';

/**
 * Current config schema version
 */
export const CONFIG_VERSION = '1.0.0';

/**
 * Technology stack configuration
 */
export const TechStackSchema = z.object({
  frontend: z.enum(['react', 'vue', 'angular', 'nextjs', 'none']).default('react'),
  backend: z.enum(['dotnet', 'nodejs', 'python', 'java', 'none']).default('dotnet'),
  database: z.enum(['sqlserver', 'postgresql', 'mongodb', 'sqlite', 'none']).default('sqlserver'),
  cloud: z.enum(['azure', 'aws', 'gcp', 'local']).default('azure'),
});

export type TechStack = z.infer<typeof TechStackSchema>;

/**
 * Agent configuration
 */
export const AgentConfigSchema = z.object({
  enabled: z.array(z.string()).default([]),
  disabled: z.array(z.string()).default([]),
  customPrompts: z.record(z.string(), z.string()).default({}),
  timeout: z.number().default(300000), // 5 minutes
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Azure configuration
 */
export const AzureConfigSchema = z.object({
  subscriptionId: z.string().optional(),
  resourceGroup: z.string().optional(),
  location: z.string().default('westeurope'),
  tags: z.record(z.string(), z.string()).default({}),
});

export type AzureConfig = z.infer<typeof AzureConfigSchema>;

/**
 * Output configuration
 */
export const OutputConfigSchema = z.object({
  basePath: z.string().default('./output'),
  structure: z.enum(['flat', 'nested', 'monorepo']).default('nested'),
  overwrite: z.boolean().default(false),
  gitInit: z.boolean().default(true),
});

export type OutputConfig = z.infer<typeof OutputConfigSchema>;

/**
 * Feature flags
 */
export const FeatureFlagsSchema = z.object({
  autoCommit: z.boolean().default(false),
  autoTest: z.boolean().default(true),
  autoDeploy: z.boolean().default(false),
  interactiveMode: z.boolean().default(true),
  verboseLogging: z.boolean().default(false),
});

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

/**
 * Main project configuration schema
 */
export const ProjectConfigSchema = z.object({
  // Meta
  $schema: z.string().optional(),
  version: z.string().default(CONFIG_VERSION),
  
  // Project info
  projectName: z.string().min(1).max(100),
  description: z.string().optional(),
  scenario: z.enum(['S01', 'S02', 'S03', 'S04', 'S05']).default('S01'),
  
  // Technical configuration
  techStack: TechStackSchema.default({}),
  agents: AgentConfigSchema.default({}),
  azure: AzureConfigSchema.default({}),
  output: OutputConfigSchema.default({}),
  features: FeatureFlagsSchema.default({}),
  
  // Custom settings
  custom: z.record(z.string(), z.unknown()).default({}),
  
  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/**
 * Partial config for updates
 */
export const PartialProjectConfigSchema = ProjectConfigSchema.partial().omit({
  version: true,
  createdAt: true,
});

export type PartialProjectConfig = z.infer<typeof PartialProjectConfigSchema>;
```

### 2.2 Project Config Manager (`src/config/ProjectConfig.ts`)

```typescript
import path from 'path';
import { IStateStore } from '../interfaces/IStateStore';
import { StateStoreFactory } from '../factory/StateStoreFactory';
import { 
  ProjectConfig, 
  ProjectConfigSchema, 
  PartialProjectConfig,
  CONFIG_VERSION 
} from './ConfigSchema';
import { ConfigValidator } from './ConfigValidator';
import { ConfigMigrator } from './ConfigMigrator';
import { EnvironmentConfig } from './EnvironmentConfig';

export class ProjectConfigManager {
  private store: IStateStore;
  private projectPath: string;
  private config: ProjectConfig | null = null;
  private validator: ConfigValidator;
  private migrator: ConfigMigrator;
  private envConfig: EnvironmentConfig;

  constructor(projectPath: string, store?: IStateStore) {
    this.projectPath = path.resolve(projectPath);
    this.store = store || StateStoreFactory.getDefault();
    this.validator = new ConfigValidator();
    this.migrator = new ConfigMigrator();
    this.envConfig = new EnvironmentConfig();
  }

  /**
   * Initialize config manager and load existing config
   */
  async initialize(): Promise<void> {
    await this.store.initialize();
    await this.load();
  }

  /**
   * Get current config (throws if not initialized)
   */
  get current(): ProjectConfig {
    if (!this.config) {
      throw new Error('Config not loaded. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Check if project is initialized
   */
  async isInitialized(): Promise<boolean> {
    return this.store.exists('config', 'project');
  }

  /**
   * Create new project configuration
   */
  async create(options: {
    projectName: string;
    scenario?: string;
    techStack?: Partial<TechStack>;
    description?: string;
  }): Promise<ProjectConfig> {
    const now = new Date().toISOString();

    const config: ProjectConfig = ProjectConfigSchema.parse({
      version: CONFIG_VERSION,
      projectName: options.projectName,
      description: options.description,
      scenario: options.scenario || 'S01',
      techStack: options.techStack || {},
      createdAt: now,
      updatedAt: now,
    });

    // Validate
    const errors = this.validator.validate(config);
    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }

    // Save
    await this.store.set('config', 'project', config);
    this.config = config;

    return config;
  }

  /**
   * Load existing configuration
   */
  async load(): Promise<ProjectConfig | null> {
    const entry = await this.store.get<ProjectConfig>('config', 'project');

    if (!entry) {
      return null;
    }

    let config = entry.data;

    // Check if migration needed
    if (this.migrator.needsMigration(config.version)) {
      config = await this.migrator.migrate(config);
      await this.save(config);
    }

    // Apply environment overrides
    config = this.envConfig.apply(config);

    // Validate
    const errors = this.validator.validate(config);
    if (errors.length > 0) {
      console.warn('Config validation warnings:', errors);
    }

    this.config = config;
    return config;
  }

  /**
   * Save configuration
   */
  async save(config?: ProjectConfig): Promise<void> {
    const toSave = config || this.config;
    
    if (!toSave) {
      throw new Error('No config to save');
    }

    toSave.updatedAt = new Date().toISOString();

    await this.store.set('config', 'project', toSave);
    this.config = toSave;
  }

  /**
   * Update configuration partially
   */
  async update(updates: PartialProjectConfig): Promise<ProjectConfig> {
    if (!this.config) {
      throw new Error('No config loaded');
    }

    const updated = {
      ...this.config,
      ...updates,
      // Deep merge for nested objects
      techStack: { ...this.config.techStack, ...updates.techStack },
      agents: { ...this.config.agents, ...updates.agents },
      azure: { ...this.config.azure, ...updates.azure },
      output: { ...this.config.output, ...updates.output },
      features: { ...this.config.features, ...updates.features },
      custom: { ...this.config.custom, ...updates.custom },
    };

    // Validate
    const config = ProjectConfigSchema.parse(updated);
    const errors = this.validator.validate(config);
    
    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }

    await this.save(config);
    return config;
  }

  /**
   * Get a specific config value by path
   */
  get<T>(path: string): T | undefined {
    if (!this.config) return undefined;

    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }

    return value as T;
  }

  /**
   * Set a specific config value by path
   */
  async set<T>(path: string, value: T): Promise<void> {
    if (!this.config) {
      throw new Error('No config loaded');
    }

    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.config;

    for (const key of keys) {
      if (!target[key]) target[key] = {};
      target = target[key];
    }

    target[lastKey] = value;

    await this.save();
  }

  /**
   * Reset config to defaults
   */
  async reset(): Promise<ProjectConfig> {
    if (!this.config) {
      throw new Error('No config loaded');
    }

    return this.create({
      projectName: this.config.projectName,
      description: this.config.description,
    });
  }

  /**
   * Export config to JSON
   */
  toJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import config from JSON
   */
  async fromJSON(json: string): Promise<ProjectConfig> {
    const data = JSON.parse(json);
    const config = ProjectConfigSchema.parse(data);
    
    await this.save(config);
    return config;
  }
}
```

### 2.3 Config Validator (`src/config/ConfigValidator.ts`)

```typescript
import { ProjectConfig } from './ConfigSchema';

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export class ConfigValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  /**
   * Register default validation rules
   */
  private registerDefaultRules(): void {
    // Project name validation
    this.addRule({
      name: 'projectName',
      validate: (config) => {
        if (!/^[a-z][a-z0-9-]*$/.test(config.projectName)) {
          return {
            path: 'projectName',
            message: 'Project name must be lowercase alphanumeric with hyphens',
            severity: 'error',
          };
        }
        return null;
      },
    });

    // Tech stack compatibility
    this.addRule({
      name: 'techStackCompatibility',
      validate: (config) => {
        const { frontend, backend } = config.techStack;
        
        if (frontend !== 'none' && backend === 'none') {
          return {
            path: 'techStack',
            message: 'Frontend without backend may need API configuration',
            severity: 'warning',
          };
        }
        return null;
      },
    });

    // Azure configuration completeness
    this.addRule({
      name: 'azureConfig',
      validate: (config) => {
        if (config.techStack.cloud === 'azure') {
          if (!config.azure.subscriptionId) {
            return {
              path: 'azure.subscriptionId',
              message: 'Azure subscription ID recommended for cloud deployment',
              severity: 'warning',
            };
          }
        }
        return null;
      },
    });

    // Scenario-specific validation
    this.addRule({
      name: 'scenarioValidation',
      validate: (config) => {
        const { scenario, techStack } = config;

        switch (scenario) {
          case 'S01': // Full Stack
            if (techStack.frontend === 'none' || techStack.backend === 'none') {
              return {
                path: 'scenario',
                message: 'S01 (Full Stack) requires both frontend and backend',
                severity: 'error',
              };
            }
            break;
          case 'S02': // API Only
            if (techStack.backend === 'none') {
              return {
                path: 'scenario',
                message: 'S02 (API Only) requires backend',
                severity: 'error',
              };
            }
            break;
          case 'S03': // Frontend Only
            if (techStack.frontend === 'none') {
              return {
                path: 'scenario',
                message: 'S03 (Frontend) requires frontend',
                severity: 'error',
              };
            }
            break;
        }
        return null;
      },
    });
  }

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Validate configuration
   */
  validate(config: ProjectConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of this.rules) {
      const error = rule.validate(config);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Check if config has errors (not just warnings)
   */
  hasErrors(config: ProjectConfig): boolean {
    const errors = this.validate(config);
    return errors.some(e => e.severity === 'error');
  }
}

interface ValidationRule {
  name: string;
  validate: (config: ProjectConfig) => ValidationError | null;
}
```

### 2.4 Config Migrator (`src/config/ConfigMigrator.ts`)

```typescript
import { ProjectConfig, CONFIG_VERSION } from './ConfigSchema';

type Migration = {
  from: string;
  to: string;
  migrate: (config: any) => any;
};

export class ConfigMigrator {
  private migrations: Migration[] = [];

  constructor() {
    this.registerMigrations();
  }

  /**
   * Register all migrations
   */
  private registerMigrations(): void {
    // Example migration from 0.9.0 to 1.0.0
    this.addMigration({
      from: '0.9.0',
      to: '1.0.0',
      migrate: (config) => {
        // Rename 'stack' to 'techStack'
        if (config.stack && !config.techStack) {
          config.techStack = config.stack;
          delete config.stack;
        }
        
        // Add new required fields with defaults
        config.features = config.features || {};
        config.custom = config.custom || {};
        
        return config;
      },
    });

    // Add future migrations here
  }

  /**
   * Add migration
   */
  addMigration(migration: Migration): void {
    this.migrations.push(migration);
  }

  /**
   * Check if migration is needed
   */
  needsMigration(currentVersion: string): boolean {
    return this.compareVersions(currentVersion, CONFIG_VERSION) < 0;
  }

  /**
   * Migrate config to latest version
   */
  async migrate(config: any): Promise<ProjectConfig> {
    let currentVersion = config.version || '0.9.0';
    let migratedConfig = { ...config };

    // Apply migrations in order
    while (this.needsMigration(currentVersion)) {
      const migration = this.migrations.find(m => m.from === currentVersion);
      
      if (!migration) {
        // No migration path, try to parse with defaults
        console.warn(`No migration path from ${currentVersion}, attempting best effort`);
        break;
      }

      console.log(`Migrating config from ${migration.from} to ${migration.to}`);
      migratedConfig = migration.migrate(migratedConfig);
      currentVersion = migration.to;
    }

    migratedConfig.version = CONFIG_VERSION;
    return migratedConfig as ProjectConfig;
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const diff = (partsA[i] || 0) - (partsB[i] || 0);
      if (diff !== 0) return diff;
    }

    return 0;
  }
}
```

### 2.5 Environment Config (`src/config/EnvironmentConfig.ts`)

```typescript
import { ProjectConfig, PartialProjectConfig } from './ConfigSchema';

export class EnvironmentConfig {
  private overrides: Map<string, PartialProjectConfig> = new Map();

  constructor() {
    this.loadEnvironmentOverrides();
  }

  /**
   * Load overrides from environment variables
   */
  private loadEnvironmentOverrides(): void {
    const env = process.env.AGENTIC_ENV || process.env.NODE_ENV || 'development';

    // Environment-specific defaults
    if (env === 'development') {
      this.overrides.set('development', {
        features: {
          verboseLogging: true,
          autoCommit: false,
        },
        output: {
          overwrite: true,
        },
      });
    }

    if (env === 'production') {
      this.overrides.set('production', {
        features: {
          verboseLogging: false,
          interactiveMode: false,
        },
      });
    }

    if (env === 'ci') {
      this.overrides.set('ci', {
        features: {
          interactiveMode: false,
          autoTest: true,
          verboseLogging: true,
        },
        output: {
          gitInit: false,
        },
      });
    }

    // Load from AGENTIC_CONFIG_* environment variables
    this.loadFromEnvironmentVariables();
  }

  /**
   * Load specific config values from env vars
   */
  private loadFromEnvironmentVariables(): void {
    const envOverrides: PartialProjectConfig = {};

    // Azure config from env
    if (process.env.AZURE_SUBSCRIPTION_ID) {
      envOverrides.azure = envOverrides.azure || {};
      envOverrides.azure.subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    }

    if (process.env.AZURE_RESOURCE_GROUP) {
      envOverrides.azure = envOverrides.azure || {};
      envOverrides.azure.resourceGroup = process.env.AZURE_RESOURCE_GROUP;
    }

    if (process.env.AZURE_LOCATION) {
      envOverrides.azure = envOverrides.azure || {};
      envOverrides.azure.location = process.env.AZURE_LOCATION;
    }

    // Feature flags from env
    if (process.env.AGENTIC_AUTO_COMMIT === 'true') {
      envOverrides.features = envOverrides.features || {};
      envOverrides.features.autoCommit = true;
    }

    if (process.env.AGENTIC_VERBOSE === 'true') {
      envOverrides.features = envOverrides.features || {};
      envOverrides.features.verboseLogging = true;
    }

    this.overrides.set('env', envOverrides);
  }

  /**
   * Apply environment overrides to config
   */
  apply(config: ProjectConfig): ProjectConfig {
    const env = process.env.AGENTIC_ENV || process.env.NODE_ENV || 'development';
    let result = { ...config };

    // Apply environment-specific overrides
    const envOverride = this.overrides.get(env);
    if (envOverride) {
      result = this.deepMerge(result, envOverride);
    }

    // Apply env var overrides (highest priority)
    const varOverride = this.overrides.get('env');
    if (varOverride) {
      result = this.deepMerge(result, varOverride);
    }

    return result;
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Get current environment
   */
  getCurrentEnvironment(): string {
    return process.env.AGENTIC_ENV || process.env.NODE_ENV || 'development';
  }
}
```

### 2.6 Secret Manager (`src/config/SecretManager.ts`)

```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import fs from 'fs-extra';
import path from 'path';

export class SecretManager {
  private basePath: string;
  private encryptionKey: Buffer | null = null;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Initialize secret manager
   */
  async initialize(passphrase?: string): Promise<void> {
    const secretsDir = path.join(this.basePath, '.agenticcoder', 'secrets');
    await fs.ensureDir(secretsDir);

    if (passphrase) {
      this.encryptionKey = scryptSync(passphrase, 'agentic-salt', 32);
    }
  }

  /**
   * Store a secret
   */
  async setSecret(name: string, value: string): Promise<void> {
    const secretPath = path.join(this.basePath, '.agenticcoder', 'secrets', `${name}.enc`);

    if (this.encryptionKey) {
      const encrypted = this.encrypt(value);
      await fs.writeFile(secretPath, encrypted);
    } else {
      // Store in env file instead
      await this.addToEnvFile(name, value);
    }
  }

  /**
   * Get a secret
   */
  async getSecret(name: string): Promise<string | null> {
    // First check environment variable
    const envKey = `AGENTIC_SECRET_${name.toUpperCase()}`;
    if (process.env[envKey]) {
      return process.env[envKey]!;
    }

    // Then check encrypted file
    const secretPath = path.join(this.basePath, '.agenticcoder', 'secrets', `${name}.enc`);
    
    if (await fs.pathExists(secretPath) && this.encryptionKey) {
      const encrypted = await fs.readFile(secretPath, 'utf-8');
      return this.decrypt(encrypted);
    }

    return null;
  }

  /**
   * Delete a secret
   */
  async deleteSecret(name: string): Promise<boolean> {
    const secretPath = path.join(this.basePath, '.agenticcoder', 'secrets', `${name}.enc`);
    
    if (await fs.pathExists(secretPath)) {
      await fs.remove(secretPath);
      return true;
    }

    return false;
  }

  /**
   * List all secrets (names only)
   */
  async listSecrets(): Promise<string[]> {
    const secretsDir = path.join(this.basePath, '.agenticcoder', 'secrets');
    
    if (!await fs.pathExists(secretsDir)) {
      return [];
    }

    const files = await fs.readdir(secretsDir);
    return files
      .filter(f => f.endsWith('.enc'))
      .map(f => path.basename(f, '.enc'));
  }

  /**
   * Encrypt value
   */
  private encrypt(text: string): string {
    if (!this.encryptionKey) throw new Error('No encryption key');

    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt value
   */
  private decrypt(encrypted: string): string {
    if (!this.encryptionKey) throw new Error('No encryption key');

    const [ivHex, data] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Add secret to .env.local file
   */
  private async addToEnvFile(name: string, value: string): Promise<void> {
    const envPath = path.join(this.basePath, '.env.local');
    const key = `AGENTIC_SECRET_${name.toUpperCase()}`;
    const line = `${key}=${value}\n`;

    let content = '';
    if (await fs.pathExists(envPath)) {
      content = await fs.readFile(envPath, 'utf-8');
      
      // Replace existing line
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += line;
      }
    } else {
      content = line;
    }

    await fs.writeFile(envPath, content);
  }
}
```

---

## 🧪 Testing Strategy

```typescript
// tests/config/ProjectConfig.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { ProjectConfigManager } from '../../src/config/ProjectConfig';

describe('ProjectConfigManager', () => {
  const testDir = path.join(__dirname, '../fixtures/test-project');
  let configManager: ProjectConfigManager;

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    configManager = new ProjectConfigManager(testDir);
    await configManager.initialize();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('create', () => {
    it('should create new config', async () => {
      const config = await configManager.create({
        projectName: 'test-project',
        scenario: 'S01',
      });

      expect(config.projectName).toBe('test-project');
      expect(config.scenario).toBe('S01');
      expect(config.version).toBeDefined();
    });

    it('should reject invalid project name', async () => {
      await expect(configManager.create({
        projectName: 'Invalid Name!',
      })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update config partially', async () => {
      await configManager.create({ projectName: 'test' });
      
      const updated = await configManager.update({
        description: 'New description',
        techStack: { frontend: 'vue' },
      });

      expect(updated.description).toBe('New description');
      expect(updated.techStack.frontend).toBe('vue');
      expect(updated.techStack.backend).toBe('dotnet'); // default preserved
    });
  });

  describe('get/set', () => {
    it('should get nested values', async () => {
      await configManager.create({ projectName: 'test' });
      
      const frontend = configManager.get<string>('techStack.frontend');
      expect(frontend).toBe('react');
    });

    it('should set nested values', async () => {
      await configManager.create({ projectName: 'test' });
      
      await configManager.set('azure.location', 'eastus');
      
      expect(configManager.get('azure.location')).toBe('eastus');
    });
  });
});
```

---

## 📋 Acceptance Criteria

- [ ] Config schema validates all required fields
- [ ] `ProjectConfigManager` creates, loads, saves config
- [ ] Partial updates work without overwriting defaults
- [ ] Environment overrides apply correctly
- [ ] Config migrations handle version differences
- [ ] Secrets are stored encrypted or in `.env.local`
- [ ] Invalid configs throw clear errors
- [ ] Config exports to/imports from JSON

---

## 🔗 MCP Integration Points

| MCP Server | Gebruik |
|------------|---------|
| **Filesystem MCP** | Config file read/write operations |
| **Memory MCP** | Cache frequently accessed config values |

---

## 🔗 Navigation

← [01-PHASE-STATE-STORE.md](01-PHASE-STATE-STORE.md) | [03-PHASE-EXECUTION-STATE.md](03-PHASE-EXECUTION-STATE.md) →
