/**
 * ArtifactManager - Generated artifact tracking and versioning
 * 
 * Tracks all generated code artifacts with:
 * - Version history
 * - Content hashing
 * - Metadata (phase, agent, type)
 * - Query capabilities
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  IStateStore,
  ArtifactMetadata,
  ArtifactType,
  ArtifactRegistry,
  SCHEMA_VERSION,
} from './types';

export interface RegisterArtifactOptions {
  /** Artifact name */
  name: string;
  /** File path relative to project root */
  path: string;
  /** Artifact type */
  type: ArtifactType;
  /** Phase that generated this artifact */
  generatedByPhase: number;
  /** Agent that generated this artifact */
  generatedByAgent: string;
  /** File content (for hashing) */
  content?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

export interface ArtifactQuery {
  type?: ArtifactType;
  phase?: number;
  agent?: string;
  pathPattern?: string;
  namePattern?: string;
}

export interface ArtifactVersion {
  version: number;
  artifactId: string;
  createdAt: string;
  hash: string;
}

export class ArtifactManager {
  private store: IStateStore;
  private projectRoot: string;

  constructor(store: IStateStore, projectRoot?: string) {
    this.store = store;
    this.projectRoot = projectRoot || process.cwd();
  }

  // ==========================================================================
  // Registration
  // ==========================================================================

  /**
   * Register a new artifact or new version of existing artifact
   */
  async registerArtifact(options: RegisterArtifactOptions): Promise<ArtifactMetadata> {
    const now = new Date().toISOString();
    
    // Calculate content hash
    let hash: string;
    let size: number;
    
    if (options.content) {
      hash = this.hashContent(options.content);
      size = Buffer.byteLength(options.content, 'utf-8');
    } else {
      // Read file to get hash and size
      const fullPath = path.join(this.projectRoot, options.path);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        hash = this.hashContent(content);
        size = Buffer.byteLength(content, 'utf-8');
      } catch {
        throw new Error(`Cannot read artifact file: ${options.path}`);
      }
    }

    // Check for existing artifact at same path
    const existingArtifacts = await this.store.listArtifacts();
    const existingAtPath = existingArtifacts.find(a => a.path === options.path);

    let artifact: ArtifactMetadata;

    if (existingAtPath) {
      // This is a new version
      if (existingAtPath.hash === hash) {
        // Content unchanged, return existing
        return existingAtPath;
      }

      artifact = {
        id: crypto.randomUUID(),
        name: options.name,
        type: options.type,
        path: options.path,
        version: existingAtPath.version + 1,
        hash,
        size,
        generatedByPhase: options.generatedByPhase,
        generatedByAgent: options.generatedByAgent,
        createdAt: now,
        updatedAt: now,
        previousVersionId: existingAtPath.id,
        metadata: options.metadata,
      };
    } else {
      // New artifact
      artifact = {
        id: crypto.randomUUID(),
        name: options.name,
        type: options.type,
        path: options.path,
        version: 1,
        hash,
        size,
        generatedByPhase: options.generatedByPhase,
        generatedByAgent: options.generatedByAgent,
        createdAt: now,
        updatedAt: now,
        metadata: options.metadata,
      };
    }

    await this.store.saveArtifact(artifact);
    return artifact;
  }

  /**
   * Register multiple artifacts at once
   */
  async registerArtifacts(
    artifacts: RegisterArtifactOptions[]
  ): Promise<ArtifactMetadata[]> {
    const results: ArtifactMetadata[] = [];
    for (const artifact of artifacts) {
      const registered = await this.registerArtifact(artifact);
      results.push(registered);
    }
    return results;
  }

  // ==========================================================================
  // Query
  // ==========================================================================

  /**
   * Get artifact by ID
   */
  async getArtifact(artifactId: string): Promise<ArtifactMetadata | null> {
    return this.store.getArtifact(artifactId);
  }

  /**
   * Get artifact by path (latest version)
   */
  async getArtifactByPath(artifactPath: string): Promise<ArtifactMetadata | null> {
    const artifacts = await this.store.listArtifacts();
    return artifacts.find(a => a.path === artifactPath) || null;
  }

  /**
   * List all artifacts with optional filter
   */
  async listArtifacts(query?: ArtifactQuery): Promise<ArtifactMetadata[]> {
    let artifacts = await this.store.listArtifacts({
      type: query?.type,
      phase: query?.phase,
    });

    // Additional filtering
    if (query?.agent) {
      artifacts = artifacts.filter(a => a.generatedByAgent === query.agent);
    }
    if (query?.pathPattern) {
      const regex = new RegExp(query.pathPattern);
      artifacts = artifacts.filter(a => regex.test(a.path));
    }
    if (query?.namePattern) {
      const regex = new RegExp(query.namePattern);
      artifacts = artifacts.filter(a => regex.test(a.name));
    }

    return artifacts;
  }

  /**
   * Get artifact version history
   */
  async getVersionHistory(artifactPath: string): Promise<ArtifactVersion[]> {
    const versions: ArtifactVersion[] = [];
    const artifacts = await this.store.listArtifacts();
    
    // Find all versions at this path and get the one with highest version number
    const pathArtifacts = artifacts.filter(a => a.path === artifactPath);
    
    if (pathArtifacts.length === 0) {
      return [];
    }

    // Sort by version descending to get the latest
    pathArtifacts.sort((a, b) => b.version - a.version);
    let current: ArtifactMetadata | undefined = pathArtifacts[0];
    
    while (current) {
      versions.push({
        version: current.version,
        artifactId: current.id,
        createdAt: current.createdAt,
        hash: current.hash,
      });
      
      if (current.previousVersionId) {
        const prev = await this.store.getArtifact(current.previousVersionId);
        current = prev ?? undefined;
      } else {
        break;
      }
    }

    return versions.sort((a, b) => b.version - a.version);
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get artifact statistics
   */
  async getStatistics(): Promise<{
    totalArtifacts: number;
    totalSize: number;
    byType: Record<ArtifactType, number>;
    byPhase: Record<number, number>;
    byAgent: Record<string, number>;
  }> {
    const artifacts = await this.store.listArtifacts();
    
    const byType: Record<string, number> = {};
    const byPhase: Record<number, number> = {};
    const byAgent: Record<string, number> = {};
    let totalSize = 0;

    for (const artifact of artifacts) {
      totalSize += artifact.size;
      byType[artifact.type] = (byType[artifact.type] || 0) + 1;
      byPhase[artifact.generatedByPhase] = (byPhase[artifact.generatedByPhase] || 0) + 1;
      byAgent[artifact.generatedByAgent] = (byAgent[artifact.generatedByAgent] || 0) + 1;
    }

    return {
      totalArtifacts: artifacts.length,
      totalSize,
      byType: byType as Record<ArtifactType, number>,
      byPhase,
      byAgent,
    };
  }

  /**
   * Get artifacts generated in a specific phase
   */
  async getPhaseArtifacts(phase: number): Promise<ArtifactMetadata[]> {
    return this.store.listArtifacts({ phase });
  }

  /**
   * Get artifacts by type
   */
  async getArtifactsByType(type: ArtifactType): Promise<ArtifactMetadata[]> {
    return this.store.listArtifacts({ type });
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Verify artifact integrity (check if file still exists and hash matches)
   */
  async verifyArtifact(artifactId: string): Promise<{
    valid: boolean;
    exists: boolean;
    hashMatch: boolean;
    error?: string;
  }> {
    const artifact = await this.store.getArtifact(artifactId);
    if (!artifact) {
      return { valid: false, exists: false, hashMatch: false, error: 'Artifact not found' };
    }

    const fullPath = path.join(this.projectRoot, artifact.path);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const currentHash = this.hashContent(content);
      const hashMatch = currentHash === artifact.hash;
      
      return {
        valid: hashMatch,
        exists: true,
        hashMatch,
        error: hashMatch ? undefined : 'File content has changed',
      };
    } catch (error: unknown) {
      return {
        valid: false,
        exists: false,
        hashMatch: false,
        error: `File not found: ${artifact.path}`,
      };
    }
  }

  /**
   * Verify all artifacts
   */
  async verifyAllArtifacts(): Promise<{
    total: number;
    valid: number;
    missing: number;
    modified: number;
    issues: Array<{ artifactId: string; path: string; issue: string }>;
  }> {
    const artifacts = await this.store.listArtifacts();
    const issues: Array<{ artifactId: string; path: string; issue: string }> = [];
    let valid = 0;
    let missing = 0;
    let modified = 0;

    for (const artifact of artifacts) {
      const verification = await this.verifyArtifact(artifact.id);
      
      if (verification.valid) {
        valid++;
      } else if (!verification.exists) {
        missing++;
        issues.push({
          artifactId: artifact.id,
          path: artifact.path,
          issue: 'File not found',
        });
      } else if (!verification.hashMatch) {
        modified++;
        issues.push({
          artifactId: artifact.id,
          path: artifact.path,
          issue: 'Content modified outside AgenticCoder',
        });
      }
    }

    return {
      total: artifacts.length,
      valid,
      missing,
      modified,
      issues,
    };
  }

  // ==========================================================================
  // Utility
  // ==========================================================================

  /**
   * Infer artifact type from file path
   */
  inferArtifactType(filePath: string): ArtifactType {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath).toLowerCase();

    // Check directory patterns
    if (dir.includes('test') || dir.includes('spec')) return 'test';
    if (dir.includes('doc') || dir.includes('wiki')) return 'documentation';
    if (dir.includes('infra') || dir.includes('bicep') || dir.includes('terraform')) return 'infrastructure';

    // Check file extensions
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.cs', '.go', '.java', '.vue', '.svelte'];
    const configExtensions = ['.json', '.yaml', '.yml', '.toml', '.env', '.config'];
    const docExtensions = ['.md', '.mdx', '.txt', '.rst'];
    const assetExtensions = ['.png', '.jpg', '.svg', '.ico', '.gif', '.webp'];

    if (codeExtensions.includes(ext)) return 'source-code';
    if (configExtensions.includes(ext)) return 'config';
    if (docExtensions.includes(ext)) return 'documentation';
    if (assetExtensions.includes(ext)) return 'asset';

    // Specific config files
    const configFiles = ['package.json', 'tsconfig.json', 'vite.config', '.eslintrc', '.prettierrc'];
    const fileName = path.basename(filePath).toLowerCase();
    if (configFiles.some(cf => fileName.includes(cf))) return 'config';

    return 'other';
  }

  /**
   * Hash content using SHA-256
   */
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
  }
}
