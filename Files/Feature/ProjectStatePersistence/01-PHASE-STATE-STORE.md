# Phase 1: StateStore Foundation

**Phase ID:** F-PSP-P01  
**Feature:** ProjectStatePersistence  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started

---

## 🎯 Phase Objectives

Deze phase legt de **foundation** voor state persistence:
- Abstract storage interface design
- JSON-based file storage implementation
- SQLite storage implementation (via MCP)
- Storage factory pattern
- Basic CRUD operations

---

## 📦 Deliverables

### 1. Package Structure

```
packages/state/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Public exports
│   ├── interfaces/
│   │   ├── IStateStore.ts          # Core interface
│   │   ├── IStorageOptions.ts      # Configuration
│   │   └── IStateEntry.ts          # State entry type
│   ├── stores/
│   │   ├── JSONStateStore.ts       # JSON file storage
│   │   ├── SQLiteStateStore.ts     # SQLite via MCP
│   │   ├── MemoryStateStore.ts     # In-memory (testing)
│   │   └── MCPStateStore.ts        # Generic MCP adapter
│   ├── factory/
│   │   └── StateStoreFactory.ts    # Factory pattern
│   ├── utils/
│   │   ├── serialization.ts        # JSON serialization
│   │   ├── paths.ts                # Path resolution
│   │   └── locking.ts              # File locking
│   └── types/
│       └── index.ts                # Type definitions
└── tests/
    ├── stores/
    └── factory/
```

### 2. Dependencies

```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "proper-lockfile": "^4.1.2",
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "better-sqlite3": "^9.4.0"
  }
}
```

---

## 🔧 Implementation Details

### 1.1 Core Interface (`src/interfaces/IStateStore.ts`)

```typescript
import { z } from 'zod';

/**
 * State entry metadata
 */
export interface StateMetadata {
  createdAt: string;
  updatedAt: string;
  version: number;
  checksum?: string;
}

/**
 * State entry with metadata
 */
export interface StateEntry<T = unknown> {
  id: string;
  namespace: string;
  data: T;
  metadata: StateMetadata;
}

/**
 * Query options for listing state entries
 */
export interface QueryOptions {
  namespace?: string;
  prefix?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'id';
  orderDir?: 'asc' | 'desc';
}

/**
 * Abstract state store interface
 */
export interface IStateStore {
  /**
   * Store name/type identifier
   */
  readonly type: string;

  /**
   * Initialize the store (create dirs, tables, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Close the store and release resources
   */
  close(): Promise<void>;

  /**
   * Check if store is ready
   */
  isReady(): boolean;

  // CRUD Operations

  /**
   * Get a state entry by ID
   */
  get<T>(namespace: string, id: string): Promise<StateEntry<T> | null>;

  /**
   * Set a state entry (create or update)
   */
  set<T>(namespace: string, id: string, data: T): Promise<StateEntry<T>>;

  /**
   * Delete a state entry
   */
  delete(namespace: string, id: string): Promise<boolean>;

  /**
   * Check if entry exists
   */
  exists(namespace: string, id: string): Promise<boolean>;

  // Query Operations

  /**
   * List entries in a namespace
   */
  list<T>(options: QueryOptions): Promise<StateEntry<T>[]>;

  /**
   * Count entries matching query
   */
  count(options: QueryOptions): Promise<number>;

  /**
   * Clear all entries in a namespace
   */
  clear(namespace: string): Promise<number>;

  // Batch Operations

  /**
   * Get multiple entries by IDs
   */
  getMany<T>(namespace: string, ids: string[]): Promise<Map<string, StateEntry<T>>>;

  /**
   * Set multiple entries atomically
   */
  setMany<T>(namespace: string, entries: Array<{ id: string; data: T }>): Promise<StateEntry<T>[]>;

  /**
   * Delete multiple entries
   */
  deleteMany(namespace: string, ids: string[]): Promise<number>;

  // Transaction Support (optional)

  /**
   * Begin a transaction
   */
  beginTransaction?(): Promise<void>;

  /**
   * Commit transaction
   */
  commit?(): Promise<void>;

  /**
   * Rollback transaction
   */
  rollback?(): Promise<void>;
}
```

### 1.2 Storage Options (`src/interfaces/IStorageOptions.ts`)

```typescript
import { z } from 'zod';

export const StorageOptionsSchema = z.object({
  type: z.enum(['json', 'sqlite', 'memory', 'mcp']),
  basePath: z.string().optional(),
  
  // JSON-specific
  pretty: z.boolean().default(true),
  
  // SQLite-specific
  sqlitePath: z.string().optional(),
  walMode: z.boolean().default(true),
  
  // MCP-specific
  mcpServerName: z.string().optional(),
  mcpTransport: z.enum(['stdio', 'http']).optional(),
  
  // General options
  encryption: z.boolean().default(false),
  compression: z.boolean().default(false),
  cacheEnabled: z.boolean().default(true),
  cacheSize: z.number().default(100),
});

export type StorageOptions = z.infer<typeof StorageOptionsSchema>;

export const DEFAULT_OPTIONS: StorageOptions = {
  type: 'json',
  basePath: '.agenticcoder',
  pretty: true,
  walMode: true,
  encryption: false,
  compression: false,
  cacheEnabled: true,
  cacheSize: 100,
};
```

### 1.3 JSON State Store (`src/stores/JSONStateStore.ts`)

```typescript
import fs from 'fs-extra';
import path from 'path';
import { lock, unlock } from 'proper-lockfile';
import { createHash } from 'crypto';
import { IStateStore, StateEntry, StateMetadata, QueryOptions } from '../interfaces/IStateStore';
import { StorageOptions } from '../interfaces/IStorageOptions';

export class JSONStateStore implements IStateStore {
  readonly type = 'json';
  private basePath: string;
  private options: StorageOptions;
  private ready = false;
  private cache = new Map<string, StateEntry>();

  constructor(options: Partial<StorageOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options, type: 'json' };
    this.basePath = this.options.basePath || '.agenticcoder';
  }

  async initialize(): Promise<void> {
    // Create base directory structure
    await fs.ensureDir(this.basePath);
    await fs.ensureDir(path.join(this.basePath, 'state'));
    this.ready = true;
  }

  async close(): Promise<void> {
    this.cache.clear();
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready;
  }

  private getFilePath(namespace: string, id: string): string {
    return path.join(this.basePath, 'state', namespace, `${id}.json`);
  }

  private generateChecksum(data: unknown): string {
    const json = JSON.stringify(data);
    return createHash('sha256').update(json).digest('hex').substring(0, 16);
  }

  private getCacheKey(namespace: string, id: string): string {
    return `${namespace}:${id}`;
  }

  async get<T>(namespace: string, id: string): Promise<StateEntry<T> | null> {
    const cacheKey = this.getCacheKey(namespace, id);
    
    // Check cache first
    if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as StateEntry<T>;
    }

    const filePath = this.getFilePath(namespace, id);

    if (!await fs.pathExists(filePath)) {
      return null;
    }

    try {
      const content = await fs.readJson(filePath);
      const entry = content as StateEntry<T>;

      // Cache the result
      if (this.options.cacheEnabled) {
        this.cache.set(cacheKey, entry);
        // Limit cache size
        if (this.cache.size > this.options.cacheSize) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
      }

      return entry;
    } catch (error) {
      console.error(`Failed to read state ${namespace}/${id}:`, error);
      return null;
    }
  }

  async set<T>(namespace: string, id: string, data: T): Promise<StateEntry<T>> {
    const filePath = this.getFilePath(namespace, id);
    const dirPath = path.dirname(filePath);

    await fs.ensureDir(dirPath);

    // Get existing entry for version increment
    const existing = await this.get<T>(namespace, id);
    const now = new Date().toISOString();

    const metadata: StateMetadata = {
      createdAt: existing?.metadata.createdAt || now,
      updatedAt: now,
      version: (existing?.metadata.version || 0) + 1,
      checksum: this.generateChecksum(data),
    };

    const entry: StateEntry<T> = {
      id,
      namespace,
      data,
      metadata,
    };

    // Write with file locking
    const releaseLock = await this.acquireLock(dirPath);
    try {
      await fs.writeJson(filePath, entry, {
        spaces: this.options.pretty ? 2 : 0,
      });
    } finally {
      await releaseLock();
    }

    // Update cache
    if (this.options.cacheEnabled) {
      this.cache.set(this.getCacheKey(namespace, id), entry);
    }

    return entry;
  }

  async delete(namespace: string, id: string): Promise<boolean> {
    const filePath = this.getFilePath(namespace, id);

    if (!await fs.pathExists(filePath)) {
      return false;
    }

    await fs.remove(filePath);

    // Remove from cache
    this.cache.delete(this.getCacheKey(namespace, id));

    return true;
  }

  async exists(namespace: string, id: string): Promise<boolean> {
    const filePath = this.getFilePath(namespace, id);
    return fs.pathExists(filePath);
  }

  async list<T>(options: QueryOptions): Promise<StateEntry<T>[]> {
    const namespace = options.namespace || 'default';
    const dirPath = path.join(this.basePath, 'state', namespace);

    if (!await fs.pathExists(dirPath)) {
      return [];
    }

    const files = await fs.readdir(dirPath);
    let entries: StateEntry<T>[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const id = path.basename(file, '.json');
      
      // Filter by prefix if specified
      if (options.prefix && !id.startsWith(options.prefix)) {
        continue;
      }

      const entry = await this.get<T>(namespace, id);
      if (entry) {
        entries.push(entry);
      }
    }

    // Sort
    const orderBy = options.orderBy || 'createdAt';
    const orderDir = options.orderDir || 'desc';
    
    entries.sort((a, b) => {
      const aVal = orderBy === 'id' ? a.id : a.metadata[orderBy];
      const bVal = orderBy === 'id' ? b.id : b.metadata[orderBy];
      return orderDir === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    // Pagination
    const offset = options.offset || 0;
    const limit = options.limit || entries.length;

    return entries.slice(offset, offset + limit);
  }

  async count(options: QueryOptions): Promise<number> {
    const entries = await this.list(options);
    return entries.length;
  }

  async clear(namespace: string): Promise<number> {
    const dirPath = path.join(this.basePath, 'state', namespace);

    if (!await fs.pathExists(dirPath)) {
      return 0;
    }

    const files = await fs.readdir(dirPath);
    await fs.emptyDir(dirPath);

    // Clear cache for namespace
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        this.cache.delete(key);
      }
    }

    return files.filter(f => f.endsWith('.json')).length;
  }

  async getMany<T>(namespace: string, ids: string[]): Promise<Map<string, StateEntry<T>>> {
    const result = new Map<string, StateEntry<T>>();

    await Promise.all(
      ids.map(async (id) => {
        const entry = await this.get<T>(namespace, id);
        if (entry) {
          result.set(id, entry);
        }
      })
    );

    return result;
  }

  async setMany<T>(
    namespace: string,
    entries: Array<{ id: string; data: T }>
  ): Promise<StateEntry<T>[]> {
    return Promise.all(
      entries.map(({ id, data }) => this.set(namespace, id, data))
    );
  }

  async deleteMany(namespace: string, ids: string[]): Promise<number> {
    let deleted = 0;

    await Promise.all(
      ids.map(async (id) => {
        if (await this.delete(namespace, id)) {
          deleted++;
        }
      })
    );

    return deleted;
  }

  private async acquireLock(dirPath: string): Promise<() => Promise<void>> {
    await fs.ensureDir(dirPath);
    
    try {
      await lock(dirPath, { retries: 3 });
      return async () => {
        try {
          await unlock(dirPath);
        } catch {
          // Ignore unlock errors
        }
      };
    } catch {
      // If locking fails, return no-op
      return async () => {};
    }
  }
}
```

### 1.4 MCP State Store Adapter (`src/stores/MCPStateStore.ts`)

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { IStateStore, StateEntry, QueryOptions } from '../interfaces/IStateStore';
import { StorageOptions } from '../interfaces/IStorageOptions';

/**
 * MCP-based state store using Memory or SQLite MCP servers
 */
export class MCPStateStore implements IStateStore {
  readonly type = 'mcp';
  private client: Client | null = null;
  private options: StorageOptions;
  private ready = false;

  constructor(options: Partial<StorageOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options, type: 'mcp' };
  }

  async initialize(): Promise<void> {
    // Connect to MCP server
    this.client = new Client({
      name: 'agentic-state-store',
      version: '1.0.0',
    });

    // Initialize based on MCP server type
    if (this.options.mcpServerName === 'memory') {
      await this.initializeMemoryMCP();
    } else if (this.options.mcpServerName === 'sqlite') {
      await this.initializeSQLiteMCP();
    }

    this.ready = true;
  }

  private async initializeMemoryMCP(): Promise<void> {
    // Memory MCP uses knowledge graph
    // Create initial entities for namespaces
  }

  private async initializeSQLiteMCP(): Promise<void> {
    // Create tables via SQLite MCP
    await this.client?.callTool('query', {
      sql: `
        CREATE TABLE IF NOT EXISTS state_entries (
          id TEXT NOT NULL,
          namespace TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          checksum TEXT,
          PRIMARY KEY (namespace, id)
        )
      `,
    });

    await this.client?.callTool('query', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_namespace ON state_entries(namespace);
        CREATE INDEX IF NOT EXISTS idx_created_at ON state_entries(created_at);
      `,
    });
  }

  async close(): Promise<void> {
    await this.client?.close();
    this.client = null;
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready;
  }

  async get<T>(namespace: string, id: string): Promise<StateEntry<T> | null> {
    if (this.options.mcpServerName === 'memory') {
      return this.getFromMemoryMCP<T>(namespace, id);
    }
    return this.getFromSQLiteMCP<T>(namespace, id);
  }

  private async getFromMemoryMCP<T>(namespace: string, id: string): Promise<StateEntry<T> | null> {
    const result = await this.client?.callTool('retrieve', {
      query: `state:${namespace}:${id}`,
    });

    if (!result || !result.entities?.length) {
      return null;
    }

    return JSON.parse(result.entities[0].value);
  }

  private async getFromSQLiteMCP<T>(namespace: string, id: string): Promise<StateEntry<T> | null> {
    const result = await this.client?.callTool('query', {
      sql: `SELECT * FROM state_entries WHERE namespace = ? AND id = ?`,
      params: [namespace, id],
    });

    if (!result || !result.rows?.length) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      namespace: row.namespace,
      data: JSON.parse(row.data),
      metadata: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version,
        checksum: row.checksum,
      },
    };
  }

  async set<T>(namespace: string, id: string, data: T): Promise<StateEntry<T>> {
    if (this.options.mcpServerName === 'memory') {
      return this.setToMemoryMCP<T>(namespace, id, data);
    }
    return this.setToSQLiteMCP<T>(namespace, id, data);
  }

  private async setToMemoryMCP<T>(namespace: string, id: string, data: T): Promise<StateEntry<T>> {
    const existing = await this.get<T>(namespace, id);
    const now = new Date().toISOString();

    const entry: StateEntry<T> = {
      id,
      namespace,
      data,
      metadata: {
        createdAt: existing?.metadata.createdAt || now,
        updatedAt: now,
        version: (existing?.metadata.version || 0) + 1,
      },
    };

    await this.client?.callTool('store', {
      entities: [{
        name: `state:${namespace}:${id}`,
        entityType: 'state_entry',
        value: JSON.stringify(entry),
      }],
    });

    return entry;
  }

  private async setToSQLiteMCP<T>(namespace: string, id: string, data: T): Promise<StateEntry<T>> {
    const existing = await this.get<T>(namespace, id);
    const now = new Date().toISOString();

    const entry: StateEntry<T> = {
      id,
      namespace,
      data,
      metadata: {
        createdAt: existing?.metadata.createdAt || now,
        updatedAt: now,
        version: (existing?.metadata.version || 0) + 1,
      },
    };

    await this.client?.callTool('query', {
      sql: `
        INSERT OR REPLACE INTO state_entries 
        (id, namespace, data, created_at, updated_at, version)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      params: [
        id,
        namespace,
        JSON.stringify(data),
        entry.metadata.createdAt,
        entry.metadata.updatedAt,
        entry.metadata.version,
      ],
    });

    return entry;
  }

  async delete(namespace: string, id: string): Promise<boolean> {
    if (this.options.mcpServerName === 'memory') {
      await this.client?.callTool('delete', {
        entities: [`state:${namespace}:${id}`],
      });
    } else {
      await this.client?.callTool('query', {
        sql: `DELETE FROM state_entries WHERE namespace = ? AND id = ?`,
        params: [namespace, id],
      });
    }
    return true;
  }

  async exists(namespace: string, id: string): Promise<boolean> {
    const entry = await this.get(namespace, id);
    return entry !== null;
  }

  async list<T>(options: QueryOptions): Promise<StateEntry<T>[]> {
    if (this.options.mcpServerName === 'sqlite') {
      const result = await this.client?.callTool('query', {
        sql: `
          SELECT * FROM state_entries 
          WHERE namespace = ?
          ORDER BY ${options.orderBy || 'created_at'} ${options.orderDir || 'DESC'}
          LIMIT ? OFFSET ?
        `,
        params: [options.namespace || 'default', options.limit || 100, options.offset || 0],
      });

      return (result?.rows || []).map((row: any) => ({
        id: row.id,
        namespace: row.namespace,
        data: JSON.parse(row.data),
        metadata: {
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          version: row.version,
          checksum: row.checksum,
        },
      }));
    }

    // Memory MCP - use search
    const result = await this.client?.callTool('search', {
      query: `state:${options.namespace || 'default'}:*`,
    });

    return (result?.entities || []).map((e: any) => JSON.parse(e.value));
  }

  async count(options: QueryOptions): Promise<number> {
    const entries = await this.list(options);
    return entries.length;
  }

  async clear(namespace: string): Promise<number> {
    const count = await this.count({ namespace });
    
    if (this.options.mcpServerName === 'sqlite') {
      await this.client?.callTool('query', {
        sql: `DELETE FROM state_entries WHERE namespace = ?`,
        params: [namespace],
      });
    }

    return count;
  }

  async getMany<T>(namespace: string, ids: string[]): Promise<Map<string, StateEntry<T>>> {
    const result = new Map<string, StateEntry<T>>();
    await Promise.all(ids.map(async (id) => {
      const entry = await this.get<T>(namespace, id);
      if (entry) result.set(id, entry);
    }));
    return result;
  }

  async setMany<T>(namespace: string, entries: Array<{ id: string; data: T }>): Promise<StateEntry<T>[]> {
    return Promise.all(entries.map(({ id, data }) => this.set(namespace, id, data)));
  }

  async deleteMany(namespace: string, ids: string[]): Promise<number> {
    let deleted = 0;
    await Promise.all(ids.map(async (id) => {
      if (await this.delete(namespace, id)) deleted++;
    }));
    return deleted;
  }
}
```

### 1.5 State Store Factory (`src/factory/StateStoreFactory.ts`)

```typescript
import { IStateStore } from '../interfaces/IStateStore';
import { StorageOptions, DEFAULT_OPTIONS } from '../interfaces/IStorageOptions';
import { JSONStateStore } from '../stores/JSONStateStore';
import { MCPStateStore } from '../stores/MCPStateStore';
import { MemoryStateStore } from '../stores/MemoryStateStore';

export class StateStoreFactory {
  private static instances = new Map<string, IStateStore>();

  /**
   * Create a new state store instance
   */
  static create(options: Partial<StorageOptions> = {}): IStateStore {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    switch (opts.type) {
      case 'json':
        return new JSONStateStore(opts);
      
      case 'sqlite':
        return new MCPStateStore({ ...opts, mcpServerName: 'sqlite' });
      
      case 'memory':
        return new MemoryStateStore(opts);
      
      case 'mcp':
        return new MCPStateStore(opts);
      
      default:
        throw new Error(`Unknown storage type: ${opts.type}`);
    }
  }

  /**
   * Get or create a singleton instance
   */
  static getInstance(name: string, options?: Partial<StorageOptions>): IStateStore {
    if (!this.instances.has(name)) {
      const store = this.create(options);
      this.instances.set(name, store);
    }
    return this.instances.get(name)!;
  }

  /**
   * Get the default instance
   */
  static getDefault(): IStateStore {
    return this.getInstance('default', { type: 'json' });
  }

  /**
   * Close all instances
   */
  static async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.instances.values()).map(store => store.close())
    );
    this.instances.clear();
  }
}
```

---

## 🧪 Testing Strategy

```typescript
// tests/stores/JSONStateStore.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { JSONStateStore } from '../../src/stores/JSONStateStore';

describe('JSONStateStore', () => {
  const testDir = path.join(__dirname, '../fixtures/test-store');
  let store: JSONStateStore;

  beforeEach(async () => {
    store = new JSONStateStore({ basePath: testDir });
    await store.initialize();
  });

  afterEach(async () => {
    await store.close();
    await fs.remove(testDir);
  });

  describe('basic CRUD', () => {
    it('should set and get a value', async () => {
      const data = { foo: 'bar', count: 42 };
      
      await store.set('test', 'item-1', data);
      const result = await store.get('test', 'item-1');

      expect(result).not.toBeNull();
      expect(result!.data).toEqual(data);
      expect(result!.metadata.version).toBe(1);
    });

    it('should increment version on update', async () => {
      await store.set('test', 'item-1', { v: 1 });
      await store.set('test', 'item-1', { v: 2 });
      
      const result = await store.get('test', 'item-1');

      expect(result!.data).toEqual({ v: 2 });
      expect(result!.metadata.version).toBe(2);
    });

    it('should delete entry', async () => {
      await store.set('test', 'item-1', { foo: 'bar' });
      
      const deleted = await store.delete('test', 'item-1');
      const result = await store.get('test', 'item-1');

      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });

    it('should check existence', async () => {
      await store.set('test', 'item-1', { foo: 'bar' });

      expect(await store.exists('test', 'item-1')).toBe(true);
      expect(await store.exists('test', 'item-2')).toBe(false);
    });
  });

  describe('listing', () => {
    it('should list all entries in namespace', async () => {
      await store.set('test', 'item-1', { n: 1 });
      await store.set('test', 'item-2', { n: 2 });
      await store.set('other', 'item-3', { n: 3 });

      const entries = await store.list({ namespace: 'test' });

      expect(entries).toHaveLength(2);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 10; i++) {
        await store.set('test', `item-${i}`, { n: i });
      }

      const page1 = await store.list({ namespace: 'test', limit: 3, offset: 0 });
      const page2 = await store.list({ namespace: 'test', limit: 3, offset: 3 });

      expect(page1).toHaveLength(3);
      expect(page2).toHaveLength(3);
    });
  });

  describe('batch operations', () => {
    it('should set many entries', async () => {
      const entries = [
        { id: 'a', data: { n: 1 } },
        { id: 'b', data: { n: 2 } },
        { id: 'c', data: { n: 3 } },
      ];

      const results = await store.setMany('test', entries);

      expect(results).toHaveLength(3);
      expect(await store.count({ namespace: 'test' })).toBe(3);
    });

    it('should delete many entries', async () => {
      await store.setMany('test', [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
      ]);

      const deleted = await store.deleteMany('test', ['a', 'c']);

      expect(deleted).toBe(2);
      expect(await store.exists('test', 'b')).toBe(true);
    });
  });
});
```

---

## 📋 Acceptance Criteria

- [ ] `IStateStore` interface defined with all CRUD operations
- [ ] `JSONStateStore` implements all interface methods
- [ ] `MCPStateStore` works with Memory MCP and SQLite MCP
- [ ] `StateStoreFactory` creates correct store types
- [ ] File locking prevents concurrent write issues
- [ ] Cache improves read performance
- [ ] All tests pass with >90% coverage
- [ ] Type safety with Zod schemas

---

## 🔗 MCP Integration Points

| MCP Server | Gebruik |
|------------|---------|
| **Memory MCP** | In-memory state met persistence |
| **SQLite MCP** | Structured local database |
| **Filesystem MCP** | Backup/export operations |

---

## 🔗 Navigation

← [00-OVERVIEW.md](00-OVERVIEW.md) | [02-PHASE-PROJECT-CONFIG.md](02-PHASE-PROJECT-CONFIG.md) →
