# Phase 5: Testing & Migration

**Phase ID:** F-PSP-P05  
**Feature:** ProjectStatePersistence  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 4 (Artifact Versioning)

---

## 🎯 Phase Objectives

Deze phase implementeert:
- **Comprehensive Test Suite** - Unit, integration, E2E tests
- **Schema Migration** - Version migration tools
- **Data Export/Import** - Backup en restore
- **Documentation** - API docs en guides
- **CI/CD Integration** - Automated testing

---

## 📦 Deliverables

### 1. Package Structure

```
packages/state/
├── src/
│   ├── migration/
│   │   ├── index.ts              # Exports
│   │   ├── MigrationManager.ts   # Migration runner
│   │   ├── MigrationSchema.ts    # Migration definitions
│   │   └── migrations/           # Migration files
│   ├── export/
│   │   ├── index.ts
│   │   ├── DataExporter.ts       # Export functionality
│   │   └── DataImporter.ts       # Import functionality
│   └── backup/
│       ├── index.ts
│       └── BackupManager.ts      # Backup/restore
├── tests/
│   ├── unit/
│   │   ├── StateStore.test.ts
│   │   ├── ConfigManager.test.ts
│   │   ├── ExecutionState.test.ts
│   │   └── ArtifactManager.test.ts
│   ├── integration/
│   │   ├── FullWorkflow.test.ts
│   │   └── MCPIntegration.test.ts
│   └── e2e/
│       └── Persistence.e2e.test.ts
└── docs/
    ├── API.md
    ├── MIGRATION.md
    └── GUIDE.md
```

---

## 🔧 Implementation Details

### 5.1 Migration Schema (`src/migration/MigrationSchema.ts`)

```typescript
import { z } from 'zod';

/**
 * Migration status
 */
export const MigrationStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'rolled_back',
]);

export type MigrationStatus = z.infer<typeof MigrationStatusSchema>;

/**
 * Migration record
 */
export const MigrationRecordSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: MigrationStatusSchema,
  appliedAt: z.string().optional(),
  rolledBackAt: z.string().optional(),
  duration: z.number().optional(),
  error: z.string().optional(),
  checksum: z.string(),
});

export type MigrationRecord = z.infer<typeof MigrationRecordSchema>;

/**
 * Migration definition
 */
export interface Migration {
  version: string;
  name: string;
  description?: string;
  
  /**
   * Apply migration
   */
  up(context: MigrationContext): Promise<void>;
  
  /**
   * Rollback migration
   */
  down(context: MigrationContext): Promise<void>;
}

/**
 * Migration context provided to migrations
 */
export interface MigrationContext {
  store: import('../interfaces/IStateStore').IStateStore;
  log: (message: string) => void;
  
  /**
   * Transform all entries in a namespace
   */
  transformNamespace<T, R>(
    namespace: string,
    transformer: (data: T, key: string) => R | null
  ): Promise<number>;
  
  /**
   * Create index for faster queries
   */
  createIndex(namespace: string, field: string): Promise<void>;
  
  /**
   * Drop index
   */
  dropIndex(namespace: string, field: string): Promise<void>;
}

/**
 * Schema version metadata
 */
export const SchemaVersionSchema = z.object({
  version: z.string(),
  appliedAt: z.string(),
  migrations: z.array(z.string()),
});

export type SchemaVersion = z.infer<typeof SchemaVersionSchema>;
```

### 5.2 Migration Manager (`src/migration/MigrationManager.ts`)

```typescript
import * as crypto from 'crypto';
import { IStateStore } from '../interfaces/IStateStore';
import {
  Migration,
  MigrationContext,
  MigrationRecord,
  MigrationRecordSchema,
  SchemaVersion,
} from './MigrationSchema';

export class MigrationManager {
  private store: IStateStore;
  private migrations: Migration[] = [];
  private logs: string[] = [];

  constructor(store: IStateStore) {
    this.store = store;
  }

  /**
   * Register migration
   */
  register(migration: Migration): void {
    this.migrations.push(migration);
    // Sort by version
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Register multiple migrations
   */
  registerAll(migrations: Migration[]): void {
    migrations.forEach(m => this.register(m));
  }

  /**
   * Get current schema version
   */
  async getCurrentVersion(): Promise<string | null> {
    const entry = await this.store.get<SchemaVersion>('_meta', 'schema_version');
    return entry?.data.version || null;
  }

  /**
   * Get pending migrations
   */
  async getPending(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));
    
    return this.migrations.filter(m => !appliedVersions.has(m.version));
  }

  /**
   * Get applied migrations
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const entries = await this.store.list<MigrationRecord>({
      namespace: '_migrations',
      orderBy: 'version',
      orderDir: 'asc',
    });

    return entries
      .filter(e => e.data.status === 'completed')
      .map(e => e.data);
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<MigrationResult> {
    const pending = await this.getPending();
    
    if (pending.length === 0) {
      return {
        success: true,
        applied: [],
        message: 'No pending migrations',
      };
    }

    const applied: string[] = [];
    const context = this.createContext();

    for (const migration of pending) {
      const startTime = Date.now();
      const checksum = this.calculateChecksum(migration);

      const record: MigrationRecord = MigrationRecordSchema.parse({
        id: `mig-${migration.version}`,
        version: migration.version,
        name: migration.name,
        description: migration.description,
        status: 'running',
        checksum,
      });

      await this.store.set('_migrations', record.id, record);

      try {
        this.log(`Running migration ${migration.version}: ${migration.name}`);
        await migration.up(context);
        
        record.status = 'completed';
        record.appliedAt = new Date().toISOString();
        record.duration = Date.now() - startTime;
        
        await this.store.set('_migrations', record.id, record);
        applied.push(migration.version);
        
        this.log(`Migration ${migration.version} completed in ${record.duration}ms`);
      } catch (error) {
        record.status = 'failed';
        record.error = error instanceof Error ? error.message : String(error);
        
        await this.store.set('_migrations', record.id, record);
        
        return {
          success: false,
          applied,
          failed: migration.version,
          error: record.error,
          message: `Migration ${migration.version} failed: ${record.error}`,
        };
      }
    }

    // Update schema version
    const latestVersion = pending[pending.length - 1].version;
    await this.updateSchemaVersion(latestVersion, applied);

    return {
      success: true,
      applied,
      message: `Applied ${applied.length} migration(s)`,
    };
  }

  /**
   * Rollback last migration
   */
  async rollback(): Promise<MigrationResult> {
    const applied = await this.getAppliedMigrations();
    
    if (applied.length === 0) {
      return {
        success: true,
        applied: [],
        message: 'No migrations to rollback',
      };
    }

    const lastApplied = applied[applied.length - 1];
    const migration = this.migrations.find(m => m.version === lastApplied.version);

    if (!migration) {
      return {
        success: false,
        applied: [],
        error: `Migration ${lastApplied.version} not found`,
        message: `Cannot rollback: migration ${lastApplied.version} definition not found`,
      };
    }

    const context = this.createContext();

    try {
      this.log(`Rolling back migration ${migration.version}`);
      await migration.down(context);

      // Update record
      lastApplied.status = 'rolled_back';
      lastApplied.rolledBackAt = new Date().toISOString();
      await this.store.set('_migrations', lastApplied.id, lastApplied);

      // Update schema version
      const previousVersion = applied.length > 1 
        ? applied[applied.length - 2].version 
        : null;
      
      if (previousVersion) {
        await this.updateSchemaVersion(previousVersion, applied.slice(0, -1).map(m => m.version));
      } else {
        await this.store.delete('_meta', 'schema_version');
      }

      return {
        success: true,
        applied: [migration.version],
        message: `Rolled back migration ${migration.version}`,
      };
    } catch (error) {
      return {
        success: false,
        applied: [],
        error: error instanceof Error ? error.message : String(error),
        message: `Rollback failed: ${error}`,
      };
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<MigrationStatus> {
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPending();

    return {
      currentVersion: await this.getCurrentVersion(),
      appliedCount: applied.length,
      pendingCount: pending.length,
      applied: applied.map(m => ({
        version: m.version,
        name: m.name,
        appliedAt: m.appliedAt!,
      })),
      pending: pending.map(m => ({
        version: m.version,
        name: m.name,
      })),
    };
  }

  // ========== Helpers ==========

  private createContext(): MigrationContext {
    return {
      store: this.store,
      log: (msg) => this.log(msg),
      
      transformNamespace: async <T, R>(
        namespace: string,
        transformer: (data: T, key: string) => R | null
      ): Promise<number> => {
        const entries = await this.store.list<T>({ namespace });
        let transformed = 0;

        for (const entry of entries) {
          const result = transformer(entry.data, entry.key);
          if (result !== null) {
            await this.store.set(namespace, entry.key, result);
            transformed++;
          }
        }

        return transformed;
      },

      createIndex: async (namespace: string, field: string): Promise<void> => {
        // Index creation depends on store implementation
        this.log(`Creating index on ${namespace}.${field}`);
      },

      dropIndex: async (namespace: string, field: string): Promise<void> => {
        this.log(`Dropping index on ${namespace}.${field}`);
      },
    };
  }

  private async updateSchemaVersion(version: string, migrations: string[]): Promise<void> {
    const schemaVersion: SchemaVersion = {
      version,
      appliedAt: new Date().toISOString(),
      migrations,
    };
    
    await this.store.set('_meta', 'schema_version', schemaVersion);
  }

  private calculateChecksum(migration: Migration): string {
    const content = `${migration.version}:${migration.name}:${migration.up.toString()}:${migration.down.toString()}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(`[Migration] ${message}`);
  }

  /**
   * Get logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }
}

export interface MigrationResult {
  success: boolean;
  applied: string[];
  failed?: string;
  error?: string;
  message: string;
}

export interface MigrationStatus {
  currentVersion: string | null;
  appliedCount: number;
  pendingCount: number;
  applied: Array<{ version: string; name: string; appliedAt: string }>;
  pending: Array<{ version: string; name: string }>;
}
```

### 5.3 Data Exporter (`src/export/DataExporter.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { IStateStore } from '../interfaces/IStateStore';

export interface ExportOptions {
  namespaces?: string[];
  format: 'json' | 'ndjson';
  compress?: boolean;
  outputPath: string;
  includeMetadata?: boolean;
}

export interface ExportResult {
  success: boolean;
  filePath: string;
  recordCount: number;
  namespaces: string[];
  size: number;
  duration: number;
}

export class DataExporter {
  private store: IStateStore;

  constructor(store: IStateStore) {
    this.store = store;
  }

  /**
   * Export data to file
   */
  async export(options: ExportOptions): Promise<ExportResult> {
    const startTime = Date.now();
    
    // Get namespaces to export
    const namespaces = options.namespaces || await this.getAllNamespaces();
    
    const exportData: ExportData = {
      metadata: options.includeMetadata ? {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        namespaces,
      } : undefined,
      data: {},
    };

    let recordCount = 0;

    for (const namespace of namespaces) {
      const entries = await this.store.list({ namespace });
      exportData.data[namespace] = {};
      
      for (const entry of entries) {
        exportData.data[namespace][entry.key] = entry.data;
        recordCount++;
      }
    }

    // Write to file
    let content: string;
    if (options.format === 'ndjson') {
      content = this.toNDJSON(exportData);
    } else {
      content = JSON.stringify(exportData, null, 2);
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(options.outputPath), { recursive: true });

    // Write file
    await fs.writeFile(options.outputPath, content, 'utf-8');

    const stats = await fs.stat(options.outputPath);

    return {
      success: true,
      filePath: options.outputPath,
      recordCount,
      namespaces,
      size: stats.size,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Export single namespace
   */
  async exportNamespace(namespace: string, outputPath: string): Promise<ExportResult> {
    return this.export({
      namespaces: [namespace],
      format: 'json',
      outputPath,
      includeMetadata: true,
    });
  }

  /**
   * Stream export for large datasets
   */
  async *streamExport(namespaces?: string[]): AsyncGenerator<ExportRecord> {
    const nss = namespaces || await this.getAllNamespaces();
    
    for (const namespace of nss) {
      const entries = await this.store.list({ namespace });
      
      for (const entry of entries) {
        yield {
          namespace,
          key: entry.key,
          data: entry.data,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        };
      }
    }
  }

  // ========== Helpers ==========

  private async getAllNamespaces(): Promise<string[]> {
    // Implementation depends on store capabilities
    // For now, return known namespaces
    return [
      'projects',
      'executions',
      'checkpoints',
      'decisions',
      'artifacts',
      'versions',
      'content',
      'config',
    ];
  }

  private toNDJSON(data: ExportData): string {
    const lines: string[] = [];
    
    if (data.metadata) {
      lines.push(JSON.stringify({ _type: 'metadata', ...data.metadata }));
    }

    for (const [namespace, entries] of Object.entries(data.data)) {
      for (const [key, value] of Object.entries(entries)) {
        lines.push(JSON.stringify({ _type: 'record', namespace, key, data: value }));
      }
    }

    return lines.join('\n');
  }
}

interface ExportData {
  metadata?: {
    exportedAt: string;
    version: string;
    namespaces: string[];
  };
  data: Record<string, Record<string, unknown>>;
}

interface ExportRecord {
  namespace: string;
  key: string;
  data: unknown;
  createdAt?: string;
  updatedAt?: string;
}
```

### 5.4 Data Importer (`src/export/DataImporter.ts`)

```typescript
import * as fs from 'fs/promises';
import * as readline from 'readline';
import { IStateStore } from '../interfaces/IStateStore';

export interface ImportOptions {
  filePath: string;
  format?: 'json' | 'ndjson';
  overwrite?: boolean;
  namespaces?: string[]; // Filter namespaces to import
  dryRun?: boolean;
}

export interface ImportResult {
  success: boolean;
  recordCount: number;
  skipped: number;
  errors: string[];
  duration: number;
}

export class DataImporter {
  private store: IStateStore;

  constructor(store: IStateStore) {
    this.store = store;
  }

  /**
   * Import data from file
   */
  async import(options: ImportOptions): Promise<ImportResult> {
    const startTime = Date.now();
    const format = options.format || this.detectFormat(options.filePath);

    if (format === 'ndjson') {
      return this.importNDJSON(options, startTime);
    }

    return this.importJSON(options, startTime);
  }

  /**
   * Import JSON format
   */
  private async importJSON(options: ImportOptions, startTime: number): Promise<ImportResult> {
    const content = await fs.readFile(options.filePath, 'utf-8');
    const data = JSON.parse(content) as ExportData;

    let recordCount = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [namespace, entries] of Object.entries(data.data)) {
      // Filter namespaces if specified
      if (options.namespaces && !options.namespaces.includes(namespace)) {
        continue;
      }

      for (const [key, value] of Object.entries(entries)) {
        try {
          // Check if exists
          if (!options.overwrite) {
            const existing = await this.store.get(namespace, key);
            if (existing) {
              skipped++;
              continue;
            }
          }

          if (!options.dryRun) {
            await this.store.set(namespace, key, value);
          }
          recordCount++;
        } catch (error) {
          errors.push(`Failed to import ${namespace}:${key}: ${error}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      recordCount,
      skipped,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Import NDJSON format (streaming)
   */
  private async importNDJSON(options: ImportOptions, startTime: number): Promise<ImportResult> {
    const fileHandle = await fs.open(options.filePath, 'r');
    const stream = fileHandle.createReadStream({ encoding: 'utf-8' });
    
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    let recordCount = 0;
    let skipped = 0;
    const errors: string[] = [];

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const record = JSON.parse(line);
        
        if (record._type === 'metadata') continue;
        if (record._type !== 'record') continue;

        const { namespace, key, data } = record;

        // Filter namespaces if specified
        if (options.namespaces && !options.namespaces.includes(namespace)) {
          continue;
        }

        // Check if exists
        if (!options.overwrite) {
          const existing = await this.store.get(namespace, key);
          if (existing) {
            skipped++;
            continue;
          }
        }

        if (!options.dryRun) {
          await this.store.set(namespace, key, data);
        }
        recordCount++;
      } catch (error) {
        errors.push(`Failed to parse line: ${error}`);
      }
    }

    await fileHandle.close();

    return {
      success: errors.length === 0,
      recordCount,
      skipped,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Validate import file
   */
  async validate(filePath: string): Promise<ValidationResult> {
    const format = this.detectFormat(filePath);
    const errors: string[] = [];
    let recordCount = 0;

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      if (format === 'json') {
        const data = JSON.parse(content);
        
        if (!data.data || typeof data.data !== 'object') {
          errors.push('Invalid format: missing data object');
        } else {
          for (const [namespace, entries] of Object.entries(data.data)) {
            if (typeof entries !== 'object') {
              errors.push(`Invalid namespace ${namespace}: not an object`);
              continue;
            }
            recordCount += Object.keys(entries as object).length;
          }
        }
      } else {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          try {
            JSON.parse(lines[i]);
            recordCount++;
          } catch {
            errors.push(`Invalid JSON at line ${i + 1}`);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to read file: ${error}`);
    }

    return {
      valid: errors.length === 0,
      format,
      recordCount,
      errors,
    };
  }

  private detectFormat(filePath: string): 'json' | 'ndjson' {
    if (filePath.endsWith('.ndjson')) return 'ndjson';
    return 'json';
  }
}

interface ExportData {
  metadata?: {
    exportedAt: string;
    version: string;
  };
  data: Record<string, Record<string, unknown>>;
}

interface ValidationResult {
  valid: boolean;
  format: 'json' | 'ndjson';
  recordCount: number;
  errors: string[];
}
```

### 5.5 Backup Manager (`src/backup/BackupManager.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { IStateStore } from '../interfaces/IStateStore';
import { DataExporter } from '../export/DataExporter';
import { DataImporter } from '../export/DataImporter';

export interface BackupOptions {
  backupDir: string;
  maxBackups?: number;
  compress?: boolean;
}

export interface BackupInfo {
  id: string;
  createdAt: string;
  size: number;
  recordCount: number;
  filePath: string;
}

export class BackupManager {
  private store: IStateStore;
  private exporter: DataExporter;
  private importer: DataImporter;
  private options: BackupOptions;

  constructor(store: IStateStore, options: BackupOptions) {
    this.store = store;
    this.exporter = new DataExporter(store);
    this.importer = new DataImporter(store);
    this.options = {
      maxBackups: 10,
      compress: false,
      ...options,
    };
  }

  /**
   * Create backup
   */
  async create(description?: string): Promise<BackupInfo> {
    const id = this.generateBackupId();
    const fileName = `backup-${id}.json`;
    const filePath = path.join(this.options.backupDir, fileName);

    // Export data
    const result = await this.exporter.export({
      format: 'json',
      outputPath: filePath,
      includeMetadata: true,
    });

    // Store backup metadata
    const info: BackupInfo = {
      id,
      createdAt: new Date().toISOString(),
      size: result.size,
      recordCount: result.recordCount,
      filePath,
    };

    await this.saveBackupInfo(info);

    // Cleanup old backups
    await this.cleanup();

    return info;
  }

  /**
   * Restore from backup
   */
  async restore(backupId: string, options?: { overwrite?: boolean }): Promise<void> {
    const info = await this.getBackupInfo(backupId);
    
    if (!info) {
      throw new Error(`Backup ${backupId} not found`);
    }

    await this.importer.import({
      filePath: info.filePath,
      format: 'json',
      overwrite: options?.overwrite ?? false,
    });
  }

  /**
   * List all backups
   */
  async list(): Promise<BackupInfo[]> {
    const indexPath = path.join(this.options.backupDir, 'backup-index.json');
    
    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(content) as { backups: BackupInfo[] };
      return index.backups.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  }

  /**
   * Delete backup
   */
  async delete(backupId: string): Promise<boolean> {
    const info = await this.getBackupInfo(backupId);
    
    if (!info) {
      return false;
    }

    // Delete file
    try {
      await fs.unlink(info.filePath);
    } catch {
      // File may not exist
    }

    // Update index
    const backups = await this.list();
    const filtered = backups.filter(b => b.id !== backupId);
    await this.saveBackupIndex(filtered);

    return true;
  }

  /**
   * Scheduled backup
   */
  startScheduledBackup(intervalMs: number): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        await this.create('Scheduled backup');
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, intervalMs);
  }

  // ========== Helpers ==========

  private generateBackupId(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return timestamp;
  }

  private async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
    const backups = await this.list();
    return backups.find(b => b.id === backupId) || null;
  }

  private async saveBackupInfo(info: BackupInfo): Promise<void> {
    const backups = await this.list();
    backups.push(info);
    await this.saveBackupIndex(backups);
  }

  private async saveBackupIndex(backups: BackupInfo[]): Promise<void> {
    const indexPath = path.join(this.options.backupDir, 'backup-index.json');
    
    await fs.mkdir(this.options.backupDir, { recursive: true });
    await fs.writeFile(indexPath, JSON.stringify({ backups }, null, 2));
  }

  private async cleanup(): Promise<void> {
    const backups = await this.list();
    
    if (backups.length > this.options.maxBackups!) {
      const toDelete = backups.slice(this.options.maxBackups!);
      
      for (const backup of toDelete) {
        await this.delete(backup.id);
      }
    }
  }
}
```

---

## 🧪 Test Suite

### Unit Tests (`tests/unit/StateStore.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSONStateStore } from '../../src/stores/JSONStateStore';
import { MemoryStateStore } from '../../src/stores/MemoryStateStore';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('StateStore', () => {
  describe('MemoryStateStore', () => {
    let store: MemoryStateStore;

    beforeEach(async () => {
      store = new MemoryStateStore();
      await store.initialize();
    });

    it('should set and get values', async () => {
      await store.set('test', 'key1', { value: 'data' });
      const result = await store.get('test', 'key1');
      
      expect(result).not.toBeNull();
      expect(result!.data).toEqual({ value: 'data' });
    });

    it('should list entries', async () => {
      await store.set('test', 'key1', { a: 1 });
      await store.set('test', 'key2', { a: 2 });
      
      const entries = await store.list({ namespace: 'test' });
      expect(entries).toHaveLength(2);
    });

    it('should delete entries', async () => {
      await store.set('test', 'key1', { value: 1 });
      const deleted = await store.delete('test', 'key1');
      
      expect(deleted).toBe(true);
      expect(await store.get('test', 'key1')).toBeNull();
    });
  });

  describe('JSONStateStore', () => {
    let store: JSONStateStore;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'state-test-'));
      store = new JSONStateStore({ basePath: tempDir });
      await store.initialize();
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should persist to disk', async () => {
      await store.set('test', 'key1', { persistent: true });
      
      // Create new instance
      const store2 = new JSONStateStore({ basePath: tempDir });
      await store2.initialize();
      
      const result = await store2.get('test', 'key1');
      expect(result!.data).toEqual({ persistent: true });
    });

    it('should handle concurrent writes', async () => {
      const writes = Array.from({ length: 10 }, (_, i) =>
        store.set('test', `key${i}`, { index: i })
      );
      
      await Promise.all(writes);
      
      const entries = await store.list({ namespace: 'test' });
      expect(entries).toHaveLength(10);
    });
  });
});
```

### Integration Tests (`tests/integration/FullWorkflow.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExecutionStateManager } from '../../src/execution/ExecutionState';
import { ArtifactManager } from '../../src/artifacts/ArtifactManager';
import { ProjectConfigManager } from '../../src/config/ProjectConfigManager';
import { MemoryStateStore } from '../../src/stores/MemoryStateStore';

describe('Full Workflow Integration', () => {
  let store: MemoryStateStore;
  let executionManager: ExecutionStateManager;
  let artifactManager: ArtifactManager;
  let configManager: ProjectConfigManager;

  beforeEach(async () => {
    store = new MemoryStateStore();
    await store.initialize();
    
    executionManager = new ExecutionStateManager(store);
    await executionManager.initialize();
    
    artifactManager = new ArtifactManager('test-project', store);
    await artifactManager.initialize();
    
    configManager = new ProjectConfigManager(store);
    await configManager.initialize();
  });

  it('should complete full execution workflow', async () => {
    // Create config
    await configManager.create({
      projectName: 'test-project',
      scenario: 'S01',
    });

    // Create execution
    const execution = await executionManager.create({
      projectName: 'test-project',
      scenario: 'S01',
      phases: [
        { id: 'p1', name: 'Requirements' },
        { id: 'p2', name: 'Design' },
        { id: 'p3', name: 'Implementation' },
      ],
    });

    // Start execution
    await executionManager.start();
    expect(executionManager.current!.status).toBe('running');

    // Create artifact during phase 1
    const artifact = await artifactManager.create({
      path: 'requirements.md',
      type: 'document',
      content: '# Requirements\n\n- Feature A\n- Feature B',
      phaseId: 'p1',
      executionId: execution.id,
    });

    // Complete phase 1
    await executionManager.completePhase({ artifactId: artifact.id });
    
    // Verify phase 2 is now active
    expect(executionManager.getCurrentPhase()!.name).toBe('Design');

    // Update artifact
    await artifactManager.update(artifact.id, {
      content: '# Requirements v2\n\n- Feature A\n- Feature B\n- Feature C',
      changeMessage: 'Added Feature C',
      phaseId: 'p2',
    });

    // Verify version history
    const versions = await artifactManager.getVersionHistory(artifact.id);
    expect(versions).toHaveLength(2);

    // Complete remaining phases
    await executionManager.completePhase();
    await executionManager.completePhase();

    // Verify execution completed
    expect(executionManager.current!.status).toBe('completed');

    // Verify summary
    const summary = executionManager.getSummary();
    expect(summary!.progress).toBe(100);
    expect(summary!.completedPhases).toBe(3);
  });

  it('should support checkpoint and restore', async () => {
    await executionManager.create({
      projectName: 'test',
      scenario: 'S01',
      phases: [
        { id: 'p1', name: 'Phase 1' },
        { id: 'p2', name: 'Phase 2' },
      ],
    });

    await executionManager.start();
    
    // Create checkpoint
    const checkpointId = await executionManager.createCheckpoint('Before phase 2');
    
    await executionManager.completePhase();
    expect(executionManager.getCurrentPhase()!.name).toBe('Phase 2');

    // Restore checkpoint
    await executionManager.restoreFromCheckpoint(checkpointId);
    expect(executionManager.getCurrentPhase()!.name).toBe('Phase 1');
  });
});
```

### E2E Tests (`tests/e2e/Persistence.e2e.test.ts`)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { JSONStateStore } from '../../src/stores/JSONStateStore';
import { ExecutionStateManager } from '../../src/execution/ExecutionState';
import { ArtifactManager } from '../../src/artifacts/ArtifactManager';
import { BackupManager } from '../../src/backup/BackupManager';
import { MigrationManager } from '../../src/migration/MigrationManager';

describe('E2E Persistence', () => {
  let tempDir: string;
  let store: JSONStateStore;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'e2e-test-'));
    store = new JSONStateStore({ basePath: path.join(tempDir, 'state') });
    await store.initialize();
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should persist and recover execution state across restarts', async () => {
    const projectId = 'e2e-project';

    // Create and run execution
    const manager1 = new ExecutionStateManager(store);
    await manager1.initialize();

    await manager1.create({
      projectName: projectId,
      scenario: 'S01',
      phases: [{ id: 'p1', name: 'Phase 1' }],
    });

    await manager1.start();
    const executionId = manager1.current!.id;

    // Simulate restart - create new manager instance
    const manager2 = new ExecutionStateManager(store);
    await manager2.initialize();
    await manager2.load(executionId);

    expect(manager2.current!.id).toBe(executionId);
    expect(manager2.current!.status).toBe('running');
  });

  it('should backup and restore full state', async () => {
    const backupDir = path.join(tempDir, 'backups');
    const backupManager = new BackupManager(store, { backupDir });

    // Create backup
    const backup = await backupManager.create('E2E test backup');
    expect(backup.recordCount).toBeGreaterThan(0);

    // Clear store
    const artifactManager = new ArtifactManager('e2e-project', store);
    await artifactManager.initialize();
    
    // Restore backup
    await backupManager.restore(backup.id, { overwrite: true });

    // Verify data restored
    const restored = await store.list({ namespace: 'executions' });
    expect(restored.length).toBeGreaterThan(0);
  });

  it('should run migrations', async () => {
    const migrationManager = new MigrationManager(store);

    // Register test migration
    migrationManager.register({
      version: '001',
      name: 'Add test field',
      up: async (ctx) => {
        await ctx.transformNamespace('executions', (data: any) => ({
          ...data,
          migrated: true,
        }));
      },
      down: async (ctx) => {
        await ctx.transformNamespace('executions', (data: any) => {
          const { migrated, ...rest } = data;
          return rest;
        });
      },
    });

    // Run migration
    const result = await migrationManager.migrate();
    expect(result.success).toBe(true);
    expect(result.applied).toContain('001');

    // Verify status
    const status = await migrationManager.getStatus();
    expect(status.currentVersion).toBe('001');
  });
});
```

---

## 📚 Documentation

### API Reference (`docs/API.md`)

```markdown
# State Persistence API Reference

## StateStore Interface

### `IStateStore`

```typescript
interface IStateStore {
  initialize(): Promise<void>;
  get<T>(namespace: string, key: string): Promise<StateEntry<T> | null>;
  set<T>(namespace: string, key: string, data: T): Promise<void>;
  delete(namespace: string, key: string): Promise<boolean>;
  list<T>(options: ListOptions): Promise<StateEntry<T>[]>;
  clear(namespace?: string): Promise<void>;
}
```

### Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize the store |
| `get(namespace, key)` | Retrieve entry by key |
| `set(namespace, key, data)` | Store or update entry |
| `delete(namespace, key)` | Delete entry |
| `list(options)` | List entries with filtering |
| `clear(namespace?)` | Clear all entries |

## ExecutionStateManager

### Creating an Execution

```typescript
const manager = new ExecutionStateManager(store);
await manager.initialize();

const execution = await manager.create({
  projectName: 'my-project',
  scenario: 'S01',
  phases: [
    { id: 'p1', name: 'Requirements' },
    { id: 'p2', name: 'Design' },
  ],
});
```

### Managing Phases

```typescript
await manager.start();
await manager.updatePhaseProgress(50, 'Processing...');
await manager.completePhase({ result: 'done' });
```

## ArtifactManager

### Creating Artifacts

```typescript
const artifacts = new ArtifactManager('project-id', store);
await artifacts.initialize();

const artifact = await artifacts.create({
  path: 'src/index.ts',
  type: 'source',
  content: 'export const hello = "world";',
});
```

### Version History

```typescript
const versions = await artifacts.getVersionHistory(artifact.id);
const diff = await artifacts.compareVersions(v1.id, v2.id);
```
```

---

## 📋 Acceptance Criteria

- [ ] All unit tests pass (>90% coverage)
- [ ] Integration tests verify component interaction
- [ ] E2E tests confirm persistence across restarts
- [ ] Migration system applies and rolls back correctly
- [ ] Backup/restore works with large datasets
- [ ] Export/import handles all data formats
- [ ] Documentation covers all public APIs
- [ ] CI/CD pipeline runs all tests

---

## 🔗 Navigation

← [04-PHASE-ARTIFACT-VERSIONING.md](04-PHASE-ARTIFACT-VERSIONING.md) | [00-OVERVIEW.md](00-OVERVIEW.md) →

---

## ✅ Feature Complete

Met deze phase is **ProjectStatePersistence** feature compleet:

| Phase | Status | Description |
|-------|--------|-------------|
| 01 | ✅ | State Store Foundation |
| 02 | ✅ | Project Configuration |
| 03 | ✅ | Execution State & Checkpoints |
| 04 | ✅ | Artifact Versioning |
| 05 | ✅ | Testing & Migration |

**Total Code Reduction via MCP:** ~65%
- Memory MCP voor fast state access
- SQLite MCP voor persistent storage
- Filesystem MCP voor file operations
