/**
 * StateManager - Unified state management facade
 * 
 * Provides a single entry point for all state operations,
 * coordinating the various sub-managers.
 */

import { JSONStateStore } from './JSONStateStore';
import { CheckpointManager } from './CheckpointManager';
import { ProjectConfigManager, InitProjectOptions } from './ProjectConfigManager';
import { ExecutionManager, StartExecutionOptions } from './ExecutionManager';
import { ArtifactManager, RegisterArtifactOptions } from './ArtifactManager';
import {
  IStateStore,
  StorageBackend,
  ProjectConfig,
  ExecutionState,
  Checkpoint,
  ArtifactMetadata,
  DecisionRecord,
  DecisionStatus,
} from './types';

export interface StateManagerConfig {
  /** Working directory (default: process.cwd()) */
  workingDirectory?: string;
  /** Base directory for state storage - alias for workingDirectory */
  baseDir?: string;
  /** Storage backend (default: 'json') */
  backend?: StorageBackend;
  /** Enable auto-checkpoints (default: true) */
  autoCheckpoint?: boolean;
  /** Maximum checkpoints per execution (default: 50) */
  maxCheckpoints?: number;
}

/**
 * Unified state management for AgenticCoder
 */
export class StateManager {
  private store: IStateStore;
  private config: StateManagerConfig;
  
  // Sub-managers
  public readonly checkpoint: CheckpointManager;
  public readonly project: ProjectConfigManager;
  public readonly execution: ExecutionManager;
  public readonly artifact: ArtifactManager;

  private initialized = false;

  constructor(config?: StateManagerConfig) {
    // Support both workingDirectory and baseDir (alias)
    const workingDir = config?.workingDirectory || config?.baseDir || process.cwd();
    
    this.config = {
      workingDirectory: workingDir,
      backend: config?.backend || 'json',
      autoCheckpoint: config?.autoCheckpoint ?? true,
      maxCheckpoints: config?.maxCheckpoints ?? 50,
    };

    // Initialize store based on backend
    this.store = this.createStore();

    // Initialize sub-managers
    this.checkpoint = new CheckpointManager(this.store, {
      autoCheckpoint: this.config.autoCheckpoint,
      maxCheckpointsPerExecution: this.config.maxCheckpoints,
      compression: false,
    });

    this.project = new ProjectConfigManager(this.store);
    
    this.execution = new ExecutionManager(this.store, this.checkpoint, {
      autoCheckpoint: this.config.autoCheckpoint,
    });

    this.artifact = new ArtifactManager(this.store, this.config.workingDirectory);
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the state manager and underlying storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.store.initialize();
    this.initialized = true;
  }

  /**
   * Check if state manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Ensure initialized (throws if not)
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('StateManager not initialized. Call initialize() first.');
    }
  }

  // ==========================================================================
  // Quick Access Methods
  // ==========================================================================

  /**
   * Initialize a new project
   */
  async initProject(options: InitProjectOptions): Promise<ProjectConfig> {
    this.ensureInitialized();
    return this.project.initProject(options);
  }

  /**
   * Get current project config
   */
  async getProjectConfig(): Promise<ProjectConfig | null> {
    this.ensureInitialized();
    return this.project.getConfig();
  }

  /**
   * Start a new execution
   */
  async startExecution(options: StartExecutionOptions): Promise<ExecutionState> {
    this.ensureInitialized();
    return this.execution.startExecution(options);
  }

  /**
   * Get current execution
   */
  async getCurrentExecution(): Promise<ExecutionState | null> {
    this.ensureInitialized();
    return this.execution.getCurrentExecution();
  }

  /**
   * Complete current phase and advance
   */
  async completePhase(executionId: string, phase: number, output?: unknown): Promise<ExecutionState> {
    this.ensureInitialized();
    return this.execution.completePhase(executionId, phase, output);
  }

  /**
   * Register a generated artifact
   */
  async registerArtifact(options: RegisterArtifactOptions): Promise<ArtifactMetadata> {
    this.ensureInitialized();
    return this.artifact.registerArtifact(options);
  }

  /**
   * Resume from latest checkpoint
   */
  async resumeLatest(executionId: string): Promise<ExecutionState | null> {
    this.ensureInitialized();
    const result = await this.checkpoint.resumeLatest(executionId);
    return result.success ? result.executionState || null : null;
  }

  // ==========================================================================
  // Decision Management
  // ==========================================================================

  /**
   * Save a decision record
   */
  async saveDecision(decision: DecisionRecord): Promise<void> {
    this.ensureInitialized();
    await this.store.saveDecision(decision);
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(executionId: string): Promise<DecisionRecord[]> {
    this.ensureInitialized();
    return this.store.getPendingApprovals(executionId);
  }

  /**
   * Approve or reject a decision
   */
  async updateDecisionStatus(
    decisionId: string,
    status: DecisionStatus,
    approvedBy?: string
  ): Promise<void> {
    this.ensureInitialized();
    await this.store.updateDecisionStatus(decisionId, status, approvedBy);
  }

  // ==========================================================================
  // Export/Import
  // ==========================================================================

  /**
   * Export all state as JSON string
   */
  async exportState(): Promise<string> {
    this.ensureInitialized();
    return this.store.exportState();
  }

  /**
   * Import state from JSON string
   */
  async importState(data: string): Promise<void> {
    this.ensureInitialized();
    await this.store.importState(data);
  }

  /**
   * Cleanup old state (executions older than N days)
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    this.ensureInitialized();
    return this.store.cleanup(olderThanDays);
  }

  // ==========================================================================
  // Status
  // ==========================================================================

  /**
   * Get comprehensive status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    hasProject: boolean;
    projectName?: string;
    hasCurrentExecution: boolean;
    currentExecutionId?: string;
    currentPhase?: number;
    executionStatus?: string;
    artifactCount: number;
  }> {
    if (!this.initialized) {
      return {
        initialized: false,
        hasProject: false,
        hasCurrentExecution: false,
        artifactCount: 0,
      };
    }

    const project = await this.project.getConfig();
    const execution = await this.execution.getCurrentExecution();
    const artifacts = await this.artifact.listArtifacts();

    return {
      initialized: true,
      hasProject: project !== null,
      projectName: project?.projectName,
      hasCurrentExecution: execution !== null,
      currentExecutionId: execution?.executionId,
      currentPhase: execution?.currentPhase,
      executionStatus: execution?.status,
      artifactCount: artifacts.length,
    };
  }

  // ==========================================================================
  // Internal
  // ==========================================================================

  private createStore(): IStateStore {
    switch (this.config.backend) {
      case 'json':
        return new JSONStateStore({
          baseDir: this.config.workingDirectory,
        });
      case 'sqlite':
        // TODO: Implement SQLiteStateStore
        throw new Error('SQLite backend not yet implemented');
      case 'memory':
        // TODO: Implement MemoryStateStore
        throw new Error('Memory backend not yet implemented');
      default:
        throw new Error(`Unknown backend: ${this.config.backend}`);
    }
  }

  /**
   * Get underlying store (for advanced use)
   */
  getStore(): IStateStore {
    return this.store;
  }
}

// =============================================================================
// Factory function
// =============================================================================

/**
 * Create and initialize a StateManager
 */
export async function createStateManager(
  config?: StateManagerConfig
): Promise<StateManager> {
  const manager = new StateManager(config);
  await manager.initialize();
  return manager;
}
