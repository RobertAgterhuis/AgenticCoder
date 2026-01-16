# Phase 4: Artifact Versioning

**Phase ID:** F-PSP-P04  
**Feature:** ProjectStatePersistence  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 3 (Execution State)

---

## 🎯 Phase Objectives

Deze phase implementeert **Artifact Versioning**:
- Track generated files en code artifacts
- Version history met diffs
- Rollback capabilities
- Content-addressable storage
- Dependency tracking tussen artifacts

---

## 📦 Deliverables

### 1. Package Structure

```
packages/state/src/
├── artifacts/
│   ├── index.ts                    # Public exports
│   ├── ArtifactSchema.ts           # Zod schemas
│   ├── ArtifactManager.ts          # Main manager
│   ├── VersionStore.ts             # Version storage
│   ├── DiffEngine.ts               # Diff generation
│   ├── ContentHash.ts              # Content-addressable
│   └── DependencyTracker.ts        # Dependencies
```

---

## 🔧 Implementation Details

### 4.1 Artifact Schema (`src/artifacts/ArtifactSchema.ts`)

```typescript
import { z } from 'zod';

/**
 * Artifact types
 */
export const ArtifactTypeSchema = z.enum([
  'source',        // Source code files
  'config',        // Configuration files
  'schema',        // Database/API schemas
  'test',          // Test files
  'document',      // Documentation
  'template',      // Template files
  'binary',        // Binary artifacts
  'generated',     // Auto-generated code
]);

export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

/**
 * Change type for diffs
 */
export const ChangeTypeSchema = z.enum([
  'added',
  'modified',
  'deleted',
  'renamed',
  'unchanged',
]);

export type ChangeType = z.infer<typeof ChangeTypeSchema>;

/**
 * Single line change
 */
export const LineChangeSchema = z.object({
  lineNumber: z.number(),
  type: z.enum(['add', 'remove', 'context']),
  content: z.string(),
});

export type LineChange = z.infer<typeof LineChangeSchema>;

/**
 * Diff hunk
 */
export const DiffHunkSchema = z.object({
  oldStart: z.number(),
  oldCount: z.number(),
  newStart: z.number(),
  newCount: z.number(),
  lines: z.array(LineChangeSchema),
});

export type DiffHunk = z.infer<typeof DiffHunkSchema>;

/**
 * Diff between versions
 */
export const DiffSchema = z.object({
  fromVersion: z.string(),
  toVersion: z.string(),
  changeType: ChangeTypeSchema,
  hunks: z.array(DiffHunkSchema).optional(),
  additions: z.number().default(0),
  deletions: z.number().default(0),
  renamedFrom: z.string().optional(),
});

export type Diff = z.infer<typeof DiffSchema>;

/**
 * Artifact version
 */
export const ArtifactVersionSchema = z.object({
  id: z.string(),
  version: z.number(),
  artifactId: z.string(),
  
  // Content
  contentHash: z.string(),
  size: z.number(),
  encoding: z.enum(['utf-8', 'base64']).default('utf-8'),
  
  // Metadata
  createdAt: z.string(),
  createdBy: z.string().optional(), // Agent name
  phaseId: z.string().optional(),
  executionId: z.string().optional(),
  
  // Change info
  changeType: ChangeTypeSchema,
  changeMessage: z.string().optional(),
  
  // References
  previousVersion: z.string().optional(), // Previous version ID
  diff: DiffSchema.optional(),
});

export type ArtifactVersion = z.infer<typeof ArtifactVersionSchema>;

/**
 * Artifact dependency
 */
export const ArtifactDependencySchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  type: z.enum(['imports', 'extends', 'uses', 'generates', 'references']),
  lineNumber: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type ArtifactDependency = z.infer<typeof ArtifactDependencySchema>;

/**
 * Main artifact record
 */
export const ArtifactSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  
  // File info
  path: z.string(),
  name: z.string(),
  type: ArtifactTypeSchema,
  
  // Current state
  currentVersion: z.number(),
  latestVersionId: z.string(),
  contentHash: z.string(),
  
  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
  
  // Tracking
  lastModifiedBy: z.string().optional(),
  lastPhaseId: z.string().optional(),
  
  // Tags and labels
  tags: z.array(z.string()).default([]),
  labels: z.record(z.string(), z.string()).default({}),
  
  // Dependencies
  dependencies: z.array(z.string()).default([]), // Artifact IDs this depends on
  dependents: z.array(z.string()).default([]),   // Artifacts that depend on this
  
  // Statistics
  versionCount: z.number().default(1),
  totalChanges: z.number().default(0),
});

export type Artifact = z.infer<typeof ArtifactSchema>;
```

### 4.2 Content Hash (`src/artifacts/ContentHash.ts`)

```typescript
import * as crypto from 'crypto';

/**
 * Content-addressable storage utilities
 */
export class ContentHash {
  private static readonly ALGORITHM = 'sha256';

  /**
   * Calculate hash for content
   */
  static calculate(content: string | Buffer): string {
    const hash = crypto.createHash(this.ALGORITHM);
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Calculate hash for file-like content with metadata
   */
  static calculateWithMeta(content: string, path: string): string {
    const hash = crypto.createHash(this.ALGORITHM);
    hash.update(`path:${path}\n`);
    hash.update(`size:${Buffer.byteLength(content)}\n`);
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Verify content against hash
   */
  static verify(content: string | Buffer, expectedHash: string): boolean {
    return this.calculate(content) === expectedHash;
  }

  /**
   * Generate short hash (first 8 chars)
   */
  static short(content: string | Buffer): string {
    return this.calculate(content).substring(0, 8);
  }

  /**
   * Generate content key for storage
   */
  static toKey(hash: string): string {
    // Use first 2 chars as directory prefix (for filesystem optimization)
    return `${hash.substring(0, 2)}/${hash}`;
  }
}
```

### 4.3 Diff Engine (`src/artifacts/DiffEngine.ts`)

```typescript
import { Diff, DiffHunk, LineChange, ChangeType } from './ArtifactSchema';

/**
 * Generate and apply diffs between artifact versions
 */
export class DiffEngine {
  /**
   * Generate diff between two content versions
   */
  static generateDiff(
    oldContent: string,
    newContent: string,
    fromVersion: string,
    toVersion: string
  ): Diff {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    // Detect change type
    const changeType = this.detectChangeType(oldContent, newContent);

    if (changeType === 'unchanged') {
      return {
        fromVersion,
        toVersion,
        changeType,
        hunks: [],
        additions: 0,
        deletions: 0,
      };
    }

    // Generate hunks using Myers diff algorithm (simplified)
    const hunks = this.generateHunks(oldLines, newLines);
    
    // Count changes
    let additions = 0;
    let deletions = 0;
    
    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add') additions++;
        if (line.type === 'remove') deletions++;
      }
    }

    return {
      fromVersion,
      toVersion,
      changeType,
      hunks,
      additions,
      deletions,
    };
  }

  /**
   * Detect overall change type
   */
  private static detectChangeType(oldContent: string, newContent: string): ChangeType {
    if (oldContent === newContent) return 'unchanged';
    if (oldContent === '') return 'added';
    if (newContent === '') return 'deleted';
    return 'modified';
  }

  /**
   * Generate diff hunks
   */
  private static generateHunks(oldLines: string[], newLines: string[]): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    const contextLines = 3;

    // Simple line-by-line diff (LCS-based)
    const lcs = this.longestCommonSubsequence(oldLines, newLines);
    
    let oldIdx = 0;
    let newIdx = 0;
    let lcsIdx = 0;
    let currentHunk: DiffHunk | null = null;

    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      const inLcs = lcsIdx < lcs.length && 
                    oldLines[oldIdx] === lcs[lcsIdx] && 
                    newLines[newIdx] === lcs[lcsIdx];

      if (inLcs) {
        // Common line (context)
        if (currentHunk) {
          currentHunk.lines.push({
            lineNumber: newIdx + 1,
            type: 'context',
            content: newLines[newIdx],
          });
        }
        oldIdx++;
        newIdx++;
        lcsIdx++;
      } else {
        // Start new hunk if needed
        if (!currentHunk) {
          currentHunk = {
            oldStart: oldIdx + 1,
            oldCount: 0,
            newStart: newIdx + 1,
            newCount: 0,
            lines: [],
          };
        }

        // Removed line
        if (oldIdx < oldLines.length && 
            (lcsIdx >= lcs.length || oldLines[oldIdx] !== lcs[lcsIdx])) {
          currentHunk.lines.push({
            lineNumber: oldIdx + 1,
            type: 'remove',
            content: oldLines[oldIdx],
          });
          currentHunk.oldCount++;
          oldIdx++;
        }
        
        // Added line
        if (newIdx < newLines.length && 
            (lcsIdx >= lcs.length || newLines[newIdx] !== lcs[lcsIdx])) {
          currentHunk.lines.push({
            lineNumber: newIdx + 1,
            type: 'add',
            content: newLines[newIdx],
          });
          currentHunk.newCount++;
          newIdx++;
        }
      }

      // Close hunk if we have enough context
      if (currentHunk && currentHunk.lines.length > 0 && inLcs) {
        const contextCount = currentHunk.lines
          .filter(l => l.type === 'context')
          .length;
        
        if (contextCount >= contextLines) {
          hunks.push(currentHunk);
          currentHunk = null;
        }
      }
    }

    if (currentHunk && currentHunk.lines.some(l => l.type !== 'context')) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  /**
   * Longest Common Subsequence
   */
  private static longestCommonSubsequence(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find LCS
    const result: string[] = [];
    let i = m, j = n;
    
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result.unshift(a[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return result;
  }

  /**
   * Apply diff to content
   */
  static applyDiff(content: string, diff: Diff): string {
    if (diff.changeType === 'unchanged') return content;
    if (diff.changeType === 'added') {
      // Reconstruct from added lines
      const addedLines = diff.hunks?.flatMap(h => 
        h.lines.filter(l => l.type === 'add').map(l => l.content)
      ) || [];
      return addedLines.join('\n');
    }
    if (diff.changeType === 'deleted') return '';

    const lines = content.split('\n');
    const result: string[] = [];
    let lineIdx = 0;

    for (const hunk of diff.hunks || []) {
      // Add unchanged lines before hunk
      while (lineIdx < hunk.oldStart - 1) {
        result.push(lines[lineIdx]);
        lineIdx++;
      }

      // Apply hunk changes
      for (const change of hunk.lines) {
        if (change.type === 'context') {
          result.push(change.content);
          lineIdx++;
        } else if (change.type === 'add') {
          result.push(change.content);
        } else if (change.type === 'remove') {
          lineIdx++;
        }
      }
    }

    // Add remaining lines
    while (lineIdx < lines.length) {
      result.push(lines[lineIdx]);
      lineIdx++;
    }

    return result.join('\n');
  }

  /**
   * Format diff as unified diff string
   */
  static formatUnified(diff: Diff, oldPath: string, newPath: string): string {
    const lines: string[] = [];
    
    lines.push(`--- ${oldPath}`);
    lines.push(`+++ ${newPath}`);

    for (const hunk of diff.hunks || []) {
      lines.push(`@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`);
      
      for (const change of hunk.lines) {
        const prefix = change.type === 'add' ? '+' : 
                       change.type === 'remove' ? '-' : ' ';
        lines.push(`${prefix}${change.content}`);
      }
    }

    return lines.join('\n');
  }
}
```

### 4.4 Version Store (`src/artifacts/VersionStore.ts`)

```typescript
import { IStateStore } from '../interfaces/IStateStore';
import { ContentHash } from './ContentHash';
import { ArtifactVersion, ArtifactVersionSchema } from './ArtifactSchema';
import { DiffEngine } from './DiffEngine';
import { v4 as uuid } from 'uuid';

export class VersionStore {
  private store: IStateStore;

  constructor(store: IStateStore) {
    this.store = store;
  }

  /**
   * Store content and return hash
   */
  async storeContent(content: string): Promise<{ hash: string; size: number }> {
    const hash = ContentHash.calculate(content);
    const key = ContentHash.toKey(hash);
    const size = Buffer.byteLength(content);

    // Check if already exists
    const existing = await this.store.get('content', key);
    if (!existing) {
      await this.store.set('content', key, {
        hash,
        content,
        size,
        storedAt: new Date().toISOString(),
      });
    }

    return { hash, size };
  }

  /**
   * Retrieve content by hash
   */
  async getContent(hash: string): Promise<string | null> {
    const key = ContentHash.toKey(hash);
    const entry = await this.store.get<{ content: string }>('content', key);
    return entry?.data.content || null;
  }

  /**
   * Create new version
   */
  async createVersion(
    artifactId: string,
    content: string,
    options: {
      previousVersionId?: string;
      changeMessage?: string;
      createdBy?: string;
      phaseId?: string;
      executionId?: string;
    } = {}
  ): Promise<ArtifactVersion> {
    const { hash, size } = await this.storeContent(content);
    const id = `ver-${uuid().substring(0, 8)}`;

    // Get previous version for diff
    let previousContent = '';
    let version = 1;
    let diff = undefined;

    if (options.previousVersionId) {
      const prevVersion = await this.getVersion(options.previousVersionId);
      if (prevVersion) {
        previousContent = await this.getContent(prevVersion.contentHash) || '';
        version = prevVersion.version + 1;
        diff = DiffEngine.generateDiff(
          previousContent,
          content,
          options.previousVersionId,
          id
        );
      }
    }

    const artifactVersion: ArtifactVersion = ArtifactVersionSchema.parse({
      id,
      version,
      artifactId,
      contentHash: hash,
      size,
      encoding: 'utf-8',
      createdAt: new Date().toISOString(),
      createdBy: options.createdBy,
      phaseId: options.phaseId,
      executionId: options.executionId,
      changeType: options.previousVersionId ? diff?.changeType || 'modified' : 'added',
      changeMessage: options.changeMessage,
      previousVersion: options.previousVersionId,
      diff,
    });

    await this.store.set('versions', id, artifactVersion);
    return artifactVersion;
  }

  /**
   * Get version by ID
   */
  async getVersion(versionId: string): Promise<ArtifactVersion | null> {
    const entry = await this.store.get<ArtifactVersion>('versions', versionId);
    return entry?.data || null;
  }

  /**
   * List versions for artifact
   */
  async listVersions(artifactId: string): Promise<ArtifactVersion[]> {
    const entries = await this.store.list<ArtifactVersion>({
      namespace: 'versions',
      orderBy: 'createdAt',
      orderDir: 'desc',
    });

    return entries
      .filter(e => e.data.artifactId === artifactId)
      .map(e => e.data)
      .sort((a, b) => b.version - a.version);
  }

  /**
   * Get content for version
   */
  async getVersionContent(versionId: string): Promise<string | null> {
    const version = await this.getVersion(versionId);
    if (!version) return null;
    return this.getContent(version.contentHash);
  }

  /**
   * Compare two versions
   */
  async compareVersions(fromVersionId: string, toVersionId: string): Promise<Diff | null> {
    const fromVersion = await this.getVersion(fromVersionId);
    const toVersion = await this.getVersion(toVersionId);

    if (!fromVersion || !toVersion) return null;

    const fromContent = await this.getContent(fromVersion.contentHash) || '';
    const toContent = await this.getContent(toVersion.contentHash) || '';

    return DiffEngine.generateDiff(fromContent, toContent, fromVersionId, toVersionId);
  }

  /**
   * Cleanup old content (garbage collection)
   */
  async garbageCollect(): Promise<number> {
    // Get all referenced content hashes
    const versions = await this.store.list<ArtifactVersion>({ namespace: 'versions' });
    const referencedHashes = new Set(versions.map(v => v.data.contentHash));

    // Get all stored content
    const content = await this.store.list<{ hash: string }>({ namespace: 'content' });
    
    // Delete unreferenced content
    let deleted = 0;
    for (const entry of content) {
      if (!referencedHashes.has(entry.data.hash)) {
        await this.store.delete('content', entry.key);
        deleted++;
      }
    }

    return deleted;
  }
}
```

### 4.5 Artifact Manager (`src/artifacts/ArtifactManager.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import { IStateStore } from '../interfaces/IStateStore';
import { StateStoreFactory } from '../factory/StateStoreFactory';
import { VersionStore } from './VersionStore';
import { DiffEngine } from './DiffEngine';
import { ContentHash } from './ContentHash';
import {
  Artifact,
  ArtifactSchema,
  ArtifactType,
  ArtifactVersion,
  Diff,
} from './ArtifactSchema';

export interface CreateArtifactOptions {
  path: string;
  name?: string;
  type: ArtifactType;
  content: string;
  createdBy?: string;
  phaseId?: string;
  executionId?: string;
  tags?: string[];
  labels?: Record<string, string>;
}

export interface UpdateArtifactOptions {
  content: string;
  changeMessage?: string;
  updatedBy?: string;
  phaseId?: string;
  executionId?: string;
}

export class ArtifactManager {
  private store: IStateStore;
  private projectId: string;
  private versionStore: VersionStore;

  constructor(projectId: string, store?: IStateStore) {
    this.projectId = projectId;
    this.store = store || StateStoreFactory.getDefault();
    this.versionStore = new VersionStore(this.store);
  }

  /**
   * Initialize artifact manager
   */
  async initialize(): Promise<void> {
    await this.store.initialize();
  }

  /**
   * Create new artifact
   */
  async create(options: CreateArtifactOptions): Promise<Artifact> {
    const id = `art-${uuid().substring(0, 8)}`;
    const now = new Date().toISOString();

    // Create initial version
    const version = await this.versionStore.createVersion(id, options.content, {
      changeMessage: 'Initial version',
      createdBy: options.createdBy,
      phaseId: options.phaseId,
      executionId: options.executionId,
    });

    const artifact: Artifact = ArtifactSchema.parse({
      id,
      projectId: this.projectId,
      path: options.path,
      name: options.name || this.extractName(options.path),
      type: options.type,
      currentVersion: version.version,
      latestVersionId: version.id,
      contentHash: version.contentHash,
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: options.createdBy,
      lastPhaseId: options.phaseId,
      tags: options.tags || [],
      labels: options.labels || {},
      dependencies: [],
      dependents: [],
      versionCount: 1,
      totalChanges: 0,
    });

    await this.store.set('artifacts', id, artifact);
    
    // Index by path
    await this.store.set('artifact-paths', this.pathKey(options.path), { artifactId: id });

    return artifact;
  }

  /**
   * Update artifact with new content
   */
  async update(artifactId: string, options: UpdateArtifactOptions): Promise<Artifact> {
    const artifact = await this.get(artifactId);
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`);
    }

    // Create new version
    const version = await this.versionStore.createVersion(artifactId, options.content, {
      previousVersionId: artifact.latestVersionId,
      changeMessage: options.changeMessage,
      createdBy: options.updatedBy,
      phaseId: options.phaseId,
      executionId: options.executionId,
    });

    // Update artifact
    artifact.currentVersion = version.version;
    artifact.latestVersionId = version.id;
    artifact.contentHash = version.contentHash;
    artifact.updatedAt = new Date().toISOString();
    artifact.lastModifiedBy = options.updatedBy;
    artifact.lastPhaseId = options.phaseId;
    artifact.versionCount++;
    artifact.totalChanges += (version.diff?.additions || 0) + (version.diff?.deletions || 0);

    await this.store.set('artifacts', artifactId, artifact);

    return artifact;
  }

  /**
   * Get artifact by ID
   */
  async get(artifactId: string): Promise<Artifact | null> {
    const entry = await this.store.get<Artifact>('artifacts', artifactId);
    return entry?.data || null;
  }

  /**
   * Get artifact by path
   */
  async getByPath(path: string): Promise<Artifact | null> {
    const entry = await this.store.get<{ artifactId: string }>('artifact-paths', this.pathKey(path));
    if (!entry) return null;
    return this.get(entry.data.artifactId);
  }

  /**
   * Get or create artifact
   */
  async getOrCreate(options: CreateArtifactOptions): Promise<Artifact> {
    const existing = await this.getByPath(options.path);
    if (existing) {
      return this.update(existing.id, {
        content: options.content,
        changeMessage: 'Updated via getOrCreate',
        updatedBy: options.createdBy,
        phaseId: options.phaseId,
        executionId: options.executionId,
      });
    }
    return this.create(options);
  }

  /**
   * List artifacts for project
   */
  async list(options?: {
    type?: ArtifactType;
    tags?: string[];
    phaseId?: string;
  }): Promise<Artifact[]> {
    const entries = await this.store.list<Artifact>({
      namespace: 'artifacts',
      orderBy: 'updatedAt',
      orderDir: 'desc',
    });

    let artifacts = entries
      .filter(e => e.data.projectId === this.projectId)
      .map(e => e.data);

    if (options?.type) {
      artifacts = artifacts.filter(a => a.type === options.type);
    }

    if (options?.tags?.length) {
      artifacts = artifacts.filter(a => 
        options.tags!.some(t => a.tags.includes(t))
      );
    }

    if (options?.phaseId) {
      artifacts = artifacts.filter(a => a.lastPhaseId === options.phaseId);
    }

    return artifacts;
  }

  /**
   * Get artifact content
   */
  async getContent(artifactId: string): Promise<string | null> {
    const artifact = await this.get(artifactId);
    if (!artifact) return null;
    return this.versionStore.getVersionContent(artifact.latestVersionId);
  }

  /**
   * Get version history
   */
  async getVersionHistory(artifactId: string): Promise<ArtifactVersion[]> {
    return this.versionStore.listVersions(artifactId);
  }

  /**
   * Get specific version content
   */
  async getVersionContent(versionId: string): Promise<string | null> {
    return this.versionStore.getVersionContent(versionId);
  }

  /**
   * Compare versions
   */
  async compareVersions(fromVersionId: string, toVersionId: string): Promise<Diff | null> {
    return this.versionStore.compareVersions(fromVersionId, toVersionId);
  }

  /**
   * Rollback to specific version
   */
  async rollback(artifactId: string, targetVersionId: string): Promise<Artifact> {
    const targetContent = await this.versionStore.getVersionContent(targetVersionId);
    if (!targetContent) {
      throw new Error(`Version ${targetVersionId} content not found`);
    }

    const targetVersion = await this.versionStore.getVersion(targetVersionId);
    
    return this.update(artifactId, {
      content: targetContent,
      changeMessage: `Rollback to version ${targetVersion?.version}`,
    });
  }

  /**
   * Delete artifact
   */
  async delete(artifactId: string): Promise<boolean> {
    const artifact = await this.get(artifactId);
    if (!artifact) return false;

    // Remove path index
    await this.store.delete('artifact-paths', this.pathKey(artifact.path));

    // Delete artifact (versions are kept for history)
    return this.store.delete('artifacts', artifactId);
  }

  /**
   * Add dependency between artifacts
   */
  async addDependency(sourceId: string, targetId: string): Promise<void> {
    const source = await this.get(sourceId);
    const target = await this.get(targetId);

    if (!source || !target) {
      throw new Error('Source or target artifact not found');
    }

    if (!source.dependencies.includes(targetId)) {
      source.dependencies.push(targetId);
      await this.store.set('artifacts', sourceId, source);
    }

    if (!target.dependents.includes(sourceId)) {
      target.dependents.push(sourceId);
      await this.store.set('artifacts', targetId, target);
    }
  }

  /**
   * Get dependent artifacts
   */
  async getDependents(artifactId: string): Promise<Artifact[]> {
    const artifact = await this.get(artifactId);
    if (!artifact) return [];

    const dependents = await Promise.all(
      artifact.dependents.map(id => this.get(id))
    );

    return dependents.filter((a): a is Artifact => a !== null);
  }

  /**
   * Get artifacts changed in execution
   */
  async getChangedInExecution(executionId: string): Promise<Artifact[]> {
    const allArtifacts = await this.list();
    
    const changed: Artifact[] = [];
    for (const artifact of allArtifacts) {
      const versions = await this.getVersionHistory(artifact.id);
      const hasExecutionVersion = versions.some(v => v.executionId === executionId);
      if (hasExecutionVersion) {
        changed.push(artifact);
      }
    }

    return changed;
  }

  // ========== Helpers ==========

  private extractName(path: string): string {
    return path.split('/').pop() || path;
  }

  private pathKey(path: string): string {
    return `${this.projectId}:${path.replace(/\//g, ':')}`;
  }
}
```

### 4.6 Dependency Tracker (`src/artifacts/DependencyTracker.ts`)

```typescript
import { ArtifactManager } from './ArtifactManager';
import { Artifact, ArtifactDependency } from './ArtifactSchema';

/**
 * Track and analyze dependencies between artifacts
 */
export class DependencyTracker {
  private manager: ArtifactManager;

  constructor(manager: ArtifactManager) {
    this.manager = manager;
  }

  /**
   * Analyze import statements in code
   */
  async analyzeImports(artifactId: string): Promise<string[]> {
    const content = await this.manager.getContent(artifactId);
    if (!content) return [];

    const importPatterns = [
      // ES6 imports
      /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
      // require statements
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      // dynamic imports
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    const imports = new Set<string>();

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.add(match[1]);
      }
    }

    return Array.from(imports);
  }

  /**
   * Build dependency graph for project
   */
  async buildDependencyGraph(): Promise<DependencyGraph> {
    const artifacts = await this.manager.list();
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
    };

    // Add all artifacts as nodes
    for (const artifact of artifacts) {
      graph.nodes.push({
        id: artifact.id,
        path: artifact.path,
        type: artifact.type,
      });
    }

    // Analyze dependencies for source files
    for (const artifact of artifacts) {
      if (artifact.type !== 'source') continue;

      const imports = await this.analyzeImports(artifact.id);
      
      for (const importPath of imports) {
        // Resolve import to artifact
        const targetArtifact = await this.resolveImport(importPath, artifact.path, artifacts);
        
        if (targetArtifact) {
          graph.edges.push({
            source: artifact.id,
            target: targetArtifact.id,
            type: 'imports',
          });

          // Update artifact dependencies
          await this.manager.addDependency(artifact.id, targetArtifact.id);
        }
      }
    }

    return graph;
  }

  /**
   * Resolve import path to artifact
   */
  private async resolveImport(
    importPath: string,
    sourcePath: string,
    artifacts: Artifact[]
  ): Promise<Artifact | null> {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
      const resolvedPath = this.resolvePath(sourceDir, importPath);
      
      // Try with common extensions
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
      
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        const artifact = artifacts.find(a => a.path === fullPath);
        if (artifact) return artifact;
      }
    }

    return null;
  }

  /**
   * Resolve relative path
   */
  private resolvePath(basePath: string, relativePath: string): string {
    const parts = basePath.split('/').filter(Boolean);
    const relParts = relativePath.split('/');

    for (const part of relParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.') {
        parts.push(part);
      }
    }

    return parts.join('/');
  }

  /**
   * Find circular dependencies
   */
  async findCircularDependencies(): Promise<string[][]> {
    const graph = await this.buildDependencyGraph();
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const edges = graph.edges.filter(e => e.source === nodeId);
      
      for (const edge of edges) {
        if (!visited.has(edge.target)) {
          dfs(edge.target);
        } else if (recursionStack.has(edge.target)) {
          // Found cycle
          const cycleStart = path.indexOf(edge.target);
          cycles.push([...path.slice(cycleStart), edge.target]);
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
    };

    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return cycles;
  }

  /**
   * Get impact analysis for artifact change
   */
  async getImpactAnalysis(artifactId: string): Promise<ImpactAnalysis> {
    const artifact = await this.manager.get(artifactId);
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`);
    }

    const directDependents = await this.manager.getDependents(artifactId);
    const allAffected = new Set<string>();
    const queue = directDependents.map(a => a.id);

    // BFS to find all affected artifacts
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (allAffected.has(id)) continue;
      
      allAffected.add(id);
      const dependents = await this.manager.getDependents(id);
      queue.push(...dependents.map(a => a.id));
    }

    return {
      artifactId,
      directDependents: directDependents.length,
      totalAffected: allAffected.size,
      affectedIds: Array.from(allAffected),
    };
  }
}

export interface DependencyGraph {
  nodes: Array<{
    id: string;
    path: string;
    type: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
  }>;
}

export interface ImpactAnalysis {
  artifactId: string;
  directDependents: number;
  totalAffected: number;
  affectedIds: string[];
}
```

---

## 🧪 Testing Strategy

```typescript
// tests/artifacts/ArtifactManager.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ArtifactManager } from '../../src/artifacts/ArtifactManager';
import { MemoryStateStore } from '../../src/stores/MemoryStateStore';

describe('ArtifactManager', () => {
  let manager: ArtifactManager;
  let store: MemoryStateStore;

  beforeEach(async () => {
    store = new MemoryStateStore();
    await store.initialize();
    manager = new ArtifactManager('test-project', store);
    await manager.initialize();
  });

  describe('artifact lifecycle', () => {
    it('should create artifact', async () => {
      const artifact = await manager.create({
        path: 'src/index.ts',
        type: 'source',
        content: 'export const hello = "world";',
      });

      expect(artifact.id).toMatch(/^art-/);
      expect(artifact.path).toBe('src/index.ts');
      expect(artifact.currentVersion).toBe(1);
    });

    it('should update artifact with version history', async () => {
      const artifact = await manager.create({
        path: 'src/index.ts',
        type: 'source',
        content: 'const v1 = 1;',
      });

      const updated = await manager.update(artifact.id, {
        content: 'const v2 = 2;',
        changeMessage: 'Updated to v2',
      });

      expect(updated.currentVersion).toBe(2);
      expect(updated.versionCount).toBe(2);

      const versions = await manager.getVersionHistory(artifact.id);
      expect(versions).toHaveLength(2);
    });

    it('should rollback to previous version', async () => {
      const artifact = await manager.create({
        path: 'src/index.ts',
        type: 'source',
        content: 'const original = true;',
      });

      const v1Id = artifact.latestVersionId;

      await manager.update(artifact.id, {
        content: 'const modified = true;',
      });

      const rolledBack = await manager.rollback(artifact.id, v1Id);
      const content = await manager.getContent(rolledBack.id);

      expect(content).toBe('const original = true;');
    });
  });

  describe('version diffs', () => {
    it('should generate diff between versions', async () => {
      const artifact = await manager.create({
        path: 'src/index.ts',
        type: 'source',
        content: 'line 1\nline 2\nline 3',
      });

      const v1Id = artifact.latestVersionId;

      const updated = await manager.update(artifact.id, {
        content: 'line 1\nline 2 modified\nline 3',
      });

      const diff = await manager.compareVersions(v1Id, updated.latestVersionId);

      expect(diff).not.toBeNull();
      expect(diff!.changeType).toBe('modified');
      expect(diff!.additions).toBeGreaterThan(0);
      expect(diff!.deletions).toBeGreaterThan(0);
    });
  });
});
```

---

## 📋 Acceptance Criteria

- [ ] Artifacts create with initial version
- [ ] Updates create new versions with diffs
- [ ] Version history retrieves all versions
- [ ] Content-addressable storage prevents duplicates
- [ ] Diff generation shows accurate changes
- [ ] Rollback restores previous version content
- [ ] Dependency tracking builds graph
- [ ] Circular dependency detection works
- [ ] Impact analysis finds all affected artifacts

---

## 🔗 MCP Integration Points

| MCP Server | Gebruik |
|------------|---------|
| **Filesystem MCP** | Read/write artifact files |
| **SQLite MCP** | Version metadata storage |
| **Git MCP** | Integrate with git history |

---

## 🔗 Navigation

← [03-PHASE-EXECUTION-STATE.md](03-PHASE-EXECUTION-STATE.md) | [05-PHASE-TESTING-MIGRATION.md](05-PHASE-TESTING-MIGRATION.md) →
