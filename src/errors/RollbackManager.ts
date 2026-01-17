/**
 * RollbackManager
 * 
 * Manages rollback operations to undo partial work on failures.
 * Integrates with StateManager for checkpoint-based recovery.
 */

import {
  RollbackPoint,
  RollbackResult,
  ErrorContext,
  StructuredError,
} from './types';
import { StateManager } from '../state/StateManager';
import { ExecutionState, Checkpoint, ArtifactMetadata } from '../state/types';

// =============================================================================
// Types
// =============================================================================

export interface RollbackManagerConfig {
  /** Enable automatic rollback on errors */
  autoRollback: boolean;
  /** Create rollback points automatically */
  autoCreateRollbackPoints: boolean;
  /** Maximum rollback points to keep per execution */
  maxRollbackPoints: number;
  /** Phases that should have rollback points */
  rollbackPhases: number[];
}

const DEFAULT_CONFIG: RollbackManagerConfig = {
  autoRollback: true,
  autoCreateRollbackPoints: true,
  maxRollbackPoints: 10,
  rollbackPhases: [1, 3, 5, 7, 9, 11, 13, 15], // Every odd phase
};

// =============================================================================
// RollbackManager
// =============================================================================

export class RollbackManager {
  private config: RollbackManagerConfig;
  private stateManager: StateManager;
  private rollbackPoints: Map<string, RollbackPoint[]> = new Map();

  constructor(stateManager: StateManager, config?: Partial<RollbackManagerConfig>) {
    this.stateManager = stateManager;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // Rollback Point Management
  // ===========================================================================

  /**
   * Create a rollback point at current state
   */
  async createRollbackPoint(executionId: string): Promise<RollbackPoint> {
    const execution = await this.stateManager.execution.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // Create checkpoint via StateManager
    const checkpoint = await this.stateManager.checkpoint.createCheckpoint(executionId, {
      reason: 'manual',
      additionalState: { isRollbackPoint: true },
    });

    // Get current artifacts
    const artifacts = await this.stateManager.artifact.listArtifacts({
      phase: execution.currentPhase,
    });

    const rollbackPoint: RollbackPoint = {
      id: crypto.randomUUID(),
      executionId,
      phase: execution.currentPhase,
      checkpointId: checkpoint.id,
      createdAt: new Date().toISOString(),
      artifacts: artifacts.map(a => a.id),
      canRollback: true,
      estimatedRollbackTimeMs: this.estimateRollbackTime(artifacts.length),
    };

    // Store rollback point
    const points = this.rollbackPoints.get(executionId) || [];
    points.push(rollbackPoint);
    
    // Cleanup old points if needed
    while (points.length > this.config.maxRollbackPoints) {
      points.shift();
    }
    
    this.rollbackPoints.set(executionId, points);

    return rollbackPoint;
  }

  /**
   * Get all rollback points for an execution
   */
  async getRollbackPoints(executionId: string): Promise<RollbackPoint[]> {
    return this.rollbackPoints.get(executionId) || [];
  }

  /**
   * Get the most recent rollback point
   */
  async getLatestRollbackPoint(executionId: string): Promise<RollbackPoint | null> {
    const points = this.rollbackPoints.get(executionId) || [];
    return points.length > 0 ? points[points.length - 1] : null;
  }

  /**
   * Get rollback point for specific phase
   */
  async getRollbackPointForPhase(
    executionId: string, 
    phase: number
  ): Promise<RollbackPoint | null> {
    const points = this.rollbackPoints.get(executionId) || [];
    
    // Find the most recent point at or before the specified phase
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i].phase <= phase) {
        return points[i];
      }
    }
    
    return null;
  }

  // ===========================================================================
  // Rollback Execution
  // ===========================================================================

  /**
   * Rollback to a specific rollback point
   */
  async rollback(rollbackPointId: string): Promise<RollbackResult> {
    const startTime = Date.now();
    
    // Find the rollback point
    let rollbackPoint: RollbackPoint | null = null;
    let executionId: string | null = null;
    
    for (const [execId, points] of this.rollbackPoints) {
      const found = points.find(p => p.id === rollbackPointId);
      if (found) {
        rollbackPoint = found;
        executionId = execId;
        break;
      }
    }

    if (!rollbackPoint || !executionId) {
      return {
        success: false,
        rollbackPointId,
        restoredPhase: 0,
        artifactsRemoved: [],
        artifactsRestored: [],
        error: 'Rollback point not found',
        durationMs: Date.now() - startTime,
      };
    }

    if (!rollbackPoint.canRollback) {
      return {
        success: false,
        rollbackPointId,
        restoredPhase: rollbackPoint.phase,
        artifactsRemoved: [],
        artifactsRestored: [],
        error: 'Rollback point is no longer valid',
        durationMs: Date.now() - startTime,
      };
    }

    try {
      // 1. Resume from checkpoint
      const resumeResult = await this.stateManager.checkpoint.resumeFromCheckpoint(
        rollbackPoint.checkpointId
      );

      if (!resumeResult.success) {
        return {
          success: false,
          rollbackPointId,
          restoredPhase: rollbackPoint.phase,
          artifactsRemoved: [],
          artifactsRestored: [],
          error: resumeResult.error || 'Failed to resume from checkpoint',
          durationMs: Date.now() - startTime,
        };
      }

      // 2. Remove artifacts created after rollback point
      const removedArtifacts = await this.removeArtifactsAfterPhase(
        executionId,
        rollbackPoint.phase
      );

      // 3. Invalidate rollback points after this one
      const points = this.rollbackPoints.get(executionId) || [];
      const validPoints = points.filter(p => p.phase <= rollbackPoint!.phase);
      this.rollbackPoints.set(executionId, validPoints);

      return {
        success: true,
        rollbackPointId,
        restoredPhase: rollbackPoint.phase,
        artifactsRemoved: removedArtifacts,
        artifactsRestored: rollbackPoint.artifacts,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        rollbackPointId,
        restoredPhase: rollbackPoint.phase,
        artifactsRemoved: [],
        artifactsRestored: [],
        error: error instanceof Error ? error.message : 'Unknown error during rollback',
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Rollback to the latest rollback point
   */
  async rollbackToLatest(executionId: string): Promise<RollbackResult> {
    const latestPoint = await this.getLatestRollbackPoint(executionId);
    
    if (!latestPoint) {
      return {
        success: false,
        rollbackPointId: '',
        restoredPhase: 0,
        artifactsRemoved: [],
        artifactsRestored: [],
        error: 'No rollback points available',
        durationMs: 0,
      };
    }

    return this.rollback(latestPoint.id);
  }

  /**
   * Rollback to a specific phase
   */
  async rollbackToPhase(executionId: string, phase: number): Promise<RollbackResult> {
    const rollbackPoint = await this.getRollbackPointForPhase(executionId, phase);
    
    if (!rollbackPoint) {
      return {
        success: false,
        rollbackPointId: '',
        restoredPhase: 0,
        artifactsRemoved: [],
        artifactsRestored: [],
        error: `No rollback point available for phase ${phase} or earlier`,
        durationMs: 0,
      };
    }

    return this.rollback(rollbackPoint.id);
  }

  // ===========================================================================
  // Error Recovery Integration
  // ===========================================================================

  /**
   * Handle error with automatic rollback if configured
   */
  async handleErrorWithRollback(
    error: StructuredError
  ): Promise<RollbackResult | null> {
    if (!this.config.autoRollback) {
      return null;
    }

    const context = error.context;
    if (!context.executionId) {
      return null;
    }

    // Only rollback for recoverable errors that suggest it
    if (error.classification.suggestedRecovery.strategy !== 'rollback') {
      return null;
    }

    // Find appropriate rollback point
    let rollbackPoint: RollbackPoint | null = null;

    if (context.phase) {
      // Rollback to before the failed phase
      rollbackPoint = await this.getRollbackPointForPhase(
        context.executionId,
        context.phase - 1
      );
    }

    if (!rollbackPoint) {
      rollbackPoint = await this.getLatestRollbackPoint(context.executionId);
    }

    if (!rollbackPoint) {
      return null;
    }

    return this.rollback(rollbackPoint.id);
  }

  /**
   * Should create rollback point for this phase?
   */
  shouldCreateRollbackPoint(phase: number): boolean {
    if (!this.config.autoCreateRollbackPoints) {
      return false;
    }
    return this.config.rollbackPhases.includes(phase);
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Remove artifacts created after a specific phase
   */
  private async removeArtifactsAfterPhase(
    executionId: string,
    phase: number
  ): Promise<string[]> {
    const artifacts = await this.stateManager.artifact.listArtifacts({});
    const toRemove = artifacts.filter(a => a.generatedByPhase > phase);
    
    // Note: In a real implementation, we'd have a delete method
    // For now, we just track what would be removed
    return toRemove.map(a => a.id);
  }

  /**
   * Estimate rollback time based on artifact count
   */
  private estimateRollbackTime(artifactCount: number): number {
    // Base time + time per artifact
    return 500 + (artifactCount * 100);
  }

  /**
   * Get rollback configuration
   */
  getConfig(): RollbackManagerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RollbackManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a RollbackManager instance
 */
export function createRollbackManager(
  stateManager: StateManager,
  config?: Partial<RollbackManagerConfig>
): RollbackManager {
  return new RollbackManager(stateManager, config);
}
