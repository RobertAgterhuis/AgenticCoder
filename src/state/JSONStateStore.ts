/**
 * JSONStateStore - File-based state storage using JSON files
 * 
 * Implements IStateStore using the filesystem for persistence.
 * State is stored in .agenticcoder/ directory structure.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  IStateStore,
  StorageConfig,
  ProjectConfig,
  ExecutionState,
  Checkpoint,
  ArtifactRegistry,
  ArtifactMetadata,
  ArtifactType,
  DecisionRecord,
  DecisionLog,
  DecisionStatus,
  SCHEMA_VERSION,
  DEFAULT_CONFIG_DIR,
  CONFIG_FILE,
  STATE_DIR,
  CURRENT_STATE_FILE,
  HISTORY_DIR,
  ARTIFACTS_DIR,
  ARTIFACTS_REGISTRY_FILE,
  DECISIONS_DIR,
  DECISION_LOG_FILE,
} from './types';

export class JSONStateStore implements IStateStore {
  private config: StorageConfig;
  private initialized: boolean = false;
  private baseDir: string;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      backend: 'json',
      baseDir: config?.baseDir || process.cwd(),
      autoSave: config?.autoSave ?? true,
      autoSaveIntervalMs: config?.autoSaveIntervalMs ?? 5000,
      compression: config?.compression ?? false,
    };
    this.baseDir = path.join(this.config.baseDir, DEFAULT_CONFIG_DIR);
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create directory structure
    await this.ensureDirectories();
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.baseDir,
      path.join(this.baseDir, STATE_DIR),
      path.join(this.baseDir, STATE_DIR, HISTORY_DIR),
      path.join(this.baseDir, ARTIFACTS_DIR),
      path.join(this.baseDir, ARTIFACTS_DIR, 'versions'),
      path.join(this.baseDir, DECISIONS_DIR),
      path.join(this.baseDir, 'cache'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private async readJSON<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  private async writeJSON<T>(filePath: string, data: T): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  // ==========================================================================
  // Project Config
  // ==========================================================================

  async getProjectConfig(): Promise<ProjectConfig | null> {
    const configPath = path.join(this.baseDir, CONFIG_FILE);
    return this.readJSON<ProjectConfig>(configPath);
  }

  async saveProjectConfig(config: ProjectConfig): Promise<void> {
    const configPath = path.join(this.baseDir, CONFIG_FILE);
    config.updatedAt = this.getTimestamp();
    config.schemaVersion = SCHEMA_VERSION;
    await this.writeJSON(configPath, config);
  }

  // ==========================================================================
  // Execution State
  // ==========================================================================

  async getExecutionState(executionId: string): Promise<ExecutionState | null> {
    // Check current first
    const current = await this.getCurrentExecution();
    if (current?.executionId === executionId) {
      return current;
    }

    // Check history
    const historyPath = path.join(
      this.baseDir,
      STATE_DIR,
      HISTORY_DIR,
      `${executionId}.json`
    );
    return this.readJSON<ExecutionState>(historyPath);
  }

  async saveExecutionState(state: ExecutionState): Promise<void> {
    state.updatedAt = this.getTimestamp();
    
    // Always save to current
    const currentPath = path.join(this.baseDir, STATE_DIR, CURRENT_STATE_FILE);
    await this.writeJSON(currentPath, state);

    // If completed/failed/cancelled, also save to history
    if (['completed', 'failed', 'cancelled'].includes(state.status)) {
      const historyPath = path.join(
        this.baseDir,
        STATE_DIR,
        HISTORY_DIR,
        `${state.executionId}.json`
      );
      await this.writeJSON(historyPath, state);
    }
  }

  async getCurrentExecution(): Promise<ExecutionState | null> {
    const currentPath = path.join(this.baseDir, STATE_DIR, CURRENT_STATE_FILE);
    return this.readJSON<ExecutionState>(currentPath);
  }

  async listExecutions(limit: number = 50): Promise<ExecutionState[]> {
    const executions: ExecutionState[] = [];

    // Include current execution if exists
    const current = await this.getCurrentExecution();
    if (current) {
      executions.push(current);
    }

    // Also include from history
    const historyDir = path.join(this.baseDir, STATE_DIR, HISTORY_DIR);

    try {
      const files = await fs.readdir(historyDir);
      const jsonFiles = files.filter(f => f.endsWith('.json')).slice(0, limit);

      for (const file of jsonFiles) {
        const state = await this.readJSON<ExecutionState>(
          path.join(historyDir, file)
        );
        // Avoid duplicates (current might also be in history if completed)
        if (state && !executions.find(e => e.executionId === state.executionId)) {
          executions.push(state);
        }
      }
    } catch {
      // Directory might not exist yet
    }

    // Sort by startedAt descending
    return executions.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    ).slice(0, limit);
  }

  // ==========================================================================
  // Checkpoints
  // ==========================================================================

  async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const checkpointDir = path.join(
      this.baseDir,
      STATE_DIR,
      'checkpoints',
      checkpoint.executionId
    );
    await fs.mkdir(checkpointDir, { recursive: true });

    const checkpointPath = path.join(checkpointDir, `${checkpoint.id}.json`);
    await this.writeJSON(checkpointPath, checkpoint);

    // Update execution state with latest checkpoint
    const execution = await this.getExecutionState(checkpoint.executionId);
    if (execution) {
      execution.latestCheckpointId = checkpoint.id;
      await this.saveExecutionState(execution);
    }
  }

  async getCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    // Search through all checkpoint directories
    const checkpointsDir = path.join(this.baseDir, STATE_DIR, 'checkpoints');
    
    try {
      const executionDirs = await fs.readdir(checkpointsDir);
      
      for (const execDir of executionDirs) {
        const checkpointPath = path.join(
          checkpointsDir,
          execDir,
          `${checkpointId}.json`
        );
        const checkpoint = await this.readJSON<Checkpoint>(checkpointPath);
        if (checkpoint) return checkpoint;
      }
    } catch {
      // Directory might not exist yet
    }

    return null;
  }

  async getLatestCheckpoint(executionId: string): Promise<Checkpoint | null> {
    const execution = await this.getExecutionState(executionId);
    if (!execution?.latestCheckpointId) return null;

    return this.getCheckpoint(execution.latestCheckpointId);
  }

  async listCheckpoints(executionId: string): Promise<Checkpoint[]> {
    const checkpointDir = path.join(
      this.baseDir,
      STATE_DIR,
      'checkpoints',
      executionId
    );

    try {
      const files = await fs.readdir(checkpointDir);
      const checkpoints: Checkpoint[] = [];

      for (const file of files.filter(f => f.endsWith('.json'))) {
        const checkpoint = await this.readJSON<Checkpoint>(
          path.join(checkpointDir, file)
        );
        if (checkpoint) checkpoints.push(checkpoint);
      }

      // Sort by timestamp ascending
      return checkpoints.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch {
      return [];
    }
  }

  // ==========================================================================
  // Artifacts
  // ==========================================================================

  async getArtifactRegistry(): Promise<ArtifactRegistry | null> {
    const registryPath = path.join(
      this.baseDir,
      ARTIFACTS_DIR,
      ARTIFACTS_REGISTRY_FILE
    );
    return this.readJSON<ArtifactRegistry>(registryPath);
  }

  private async ensureArtifactRegistry(): Promise<ArtifactRegistry> {
    let registry = await this.getArtifactRegistry();
    if (!registry) {
      const config = await this.getProjectConfig();
      registry = {
        schemaVersion: SCHEMA_VERSION,
        projectName: config?.projectName || 'unknown',
        artifacts: {},
        countByType: {
          'source-code': 0,
          'config': 0,
          'documentation': 0,
          'infrastructure': 0,
          'test': 0,
          'asset': 0,
          'other': 0,
        },
        updatedAt: this.getTimestamp(),
      };
    }
    return registry;
  }

  async saveArtifact(artifact: ArtifactMetadata): Promise<void> {
    const registry = await this.ensureArtifactRegistry();
    
    // Check if this is an update (existing artifact)
    const existing = registry.artifacts[artifact.id];
    if (existing) {
      // Decrement old type count
      registry.countByType[existing.type]--;
    }

    // Update registry
    registry.artifacts[artifact.id] = artifact;
    registry.countByType[artifact.type]++;
    registry.updatedAt = this.getTimestamp();

    // Save registry
    const registryPath = path.join(
      this.baseDir,
      ARTIFACTS_DIR,
      ARTIFACTS_REGISTRY_FILE
    );
    await this.writeJSON(registryPath, registry);
  }

  async getArtifact(artifactId: string): Promise<ArtifactMetadata | null> {
    const registry = await this.getArtifactRegistry();
    return registry?.artifacts[artifactId] || null;
  }

  async listArtifacts(filter?: {
    type?: ArtifactType;
    phase?: number;
  }): Promise<ArtifactMetadata[]> {
    const registry = await this.getArtifactRegistry();
    if (!registry) return [];

    let artifacts = Object.values(registry.artifacts);

    if (filter?.type) {
      artifacts = artifacts.filter(a => a.type === filter.type);
    }
    if (filter?.phase !== undefined) {
      artifacts = artifacts.filter(a => a.generatedByPhase === filter.phase);
    }

    // Sort by creation date descending
    return artifacts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ==========================================================================
  // Decisions
  // ==========================================================================

  async saveDecision(decision: DecisionRecord): Promise<void> {
    const logPath = path.join(this.baseDir, DECISIONS_DIR, DECISION_LOG_FILE);
    let log = await this.readJSON<DecisionLog>(logPath);

    if (!log) {
      log = {
        schemaVersion: SCHEMA_VERSION,
        executionId: decision.executionId,
        decisions: [],
        pendingApprovals: 0,
        updatedAt: this.getTimestamp(),
      };
    }

    // Add decision
    log.decisions.push(decision);
    if (decision.status === 'pending') {
      log.pendingApprovals++;
    }
    log.updatedAt = this.getTimestamp();

    await this.writeJSON(logPath, log);
  }

  async getDecisionLog(executionId: string): Promise<DecisionLog | null> {
    const logPath = path.join(this.baseDir, DECISIONS_DIR, DECISION_LOG_FILE);
    const log = await this.readJSON<DecisionLog>(logPath);
    
    if (log?.executionId === executionId) {
      return log;
    }

    // Check history
    const historyLogPath = path.join(
      this.baseDir,
      DECISIONS_DIR,
      `${executionId}.json`
    );
    return this.readJSON<DecisionLog>(historyLogPath);
  }

  async getPendingApprovals(executionId: string): Promise<DecisionRecord[]> {
    const log = await this.getDecisionLog(executionId);
    if (!log) return [];

    return log.decisions.filter(d => d.status === 'pending');
  }

  async updateDecisionStatus(
    decisionId: string,
    status: DecisionStatus,
    approvedBy?: string
  ): Promise<void> {
    const logPath = path.join(this.baseDir, DECISIONS_DIR, DECISION_LOG_FILE);
    const log = await this.readJSON<DecisionLog>(logPath);
    if (!log) return;

    const decision = log.decisions.find(d => d.id === decisionId);
    if (decision) {
      const wasPending = decision.status === 'pending';
      decision.status = status;
      if (approvedBy) decision.approvedBy = approvedBy;

      // Update pending count
      if (wasPending && status !== 'pending') {
        log.pendingApprovals--;
      }

      log.updatedAt = this.getTimestamp();
      await this.writeJSON(logPath, log);
    }
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    let deletedCount = 0;

    // Clean up old executions in history
    const historyDir = path.join(this.baseDir, STATE_DIR, HISTORY_DIR);
    try {
      const files = await fs.readdir(historyDir);
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const filePath = path.join(historyDir, file);
        const state = await this.readJSON<ExecutionState>(filePath);
        if (state && new Date(state.updatedAt) < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;

          // Also delete associated checkpoints
          const checkpointDir = path.join(
            this.baseDir,
            STATE_DIR,
            'checkpoints',
            state.executionId
          );
          try {
            await fs.rm(checkpointDir, { recursive: true });
          } catch {
            // Ignore if doesn't exist
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return deletedCount;
  }

  // ==========================================================================
  // Export/Import
  // ==========================================================================

  async exportState(): Promise<string> {
    const exportData = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: this.getTimestamp(),
      projectConfig: await this.getProjectConfig(),
      currentExecution: await this.getCurrentExecution(),
      artifactRegistry: await this.getArtifactRegistry(),
      executions: await this.listExecutions(100),
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importState(data: string): Promise<void> {
    const importData = JSON.parse(data);

    // Validate schema version
    if (!importData.schemaVersion) {
      throw new Error('Invalid import data: missing schemaVersion');
    }

    // Import config (support both 'config' and 'projectConfig')
    const config = importData.projectConfig || importData.config;
    if (config) {
      await this.saveProjectConfig(config);
    }

    // Import current execution
    if (importData.currentExecution) {
      await this.saveExecutionState(importData.currentExecution);
    }

    // Import artifact registry
    if (importData.artifactRegistry) {
      const registryPath = path.join(
        this.baseDir,
        ARTIFACTS_DIR,
        ARTIFACTS_REGISTRY_FILE
      );
      await this.writeJSON(registryPath, importData.artifactRegistry);
    }
  }
}
