/**
 * CheckpointManager - Workflow checkpoint and resume functionality
 * 
 * Enables saving and restoring workflow execution state for:
 * - Automatic checkpoints after each phase
 * - Manual checkpoints on user request
 * - Error recovery checkpoints
 * - Resume from any checkpoint
 */

import * as crypto from 'crypto';
import {
  IStateStore,
  ExecutionState,
  Checkpoint,
  PhaseState,
  PhaseStatus,
  SCHEMA_VERSION,
} from './types';

export interface CheckpointManagerConfig {
  /** Enable automatic checkpoints after each phase */
  autoCheckpoint: boolean;
  /** Maximum checkpoints to keep per execution */
  maxCheckpointsPerExecution: number;
  /** Enable checkpoint compression */
  compression: boolean;
}

export interface CreateCheckpointOptions {
  /** Reason for checkpoint */
  reason: 'auto' | 'manual' | 'phase-complete' | 'error';
  /** Additional state data to include */
  additionalState?: Record<string, unknown>;
  /** Message queue state */
  messageQueue?: unknown[];
}

export interface ResumeResult {
  success: boolean;
  executionState?: ExecutionState;
  checkpoint?: Checkpoint;
  error?: string;
}

const DEFAULT_CONFIG: CheckpointManagerConfig = {
  autoCheckpoint: true,
  maxCheckpointsPerExecution: 50,
  compression: false,
};

export class CheckpointManager {
  private store: IStateStore;
  private config: CheckpointManagerConfig;

  constructor(store: IStateStore, config?: Partial<CheckpointManagerConfig>) {
    this.store = store;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Checkpoint Creation
  // ==========================================================================

  /**
   * Create a new checkpoint for the current execution
   */
  async createCheckpoint(
    executionId: string,
    options: CreateCheckpointOptions
  ): Promise<Checkpoint> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const checkpoint: Checkpoint = {
      id: crypto.randomUUID(),
      executionId,
      phase: execution.currentPhase,
      timestamp: new Date().toISOString(),
      state: {
        ...execution.data,
        ...options.additionalState,
      },
      messageQueue: options.messageQueue,
      reason: options.reason,
    };

    await this.store.saveCheckpoint(checkpoint);

    // Cleanup old checkpoints if needed
    await this.cleanupOldCheckpoints(executionId);

    return checkpoint;
  }

  /**
   * Create automatic checkpoint after phase completion
   */
  async createPhaseCheckpoint(
    executionId: string,
    phaseOutput?: unknown
  ): Promise<Checkpoint> {
    if (!this.config.autoCheckpoint) {
      throw new Error('Auto checkpoint is disabled');
    }

    return this.createCheckpoint(executionId, {
      reason: 'phase-complete',
      additionalState: phaseOutput ? { lastPhaseOutput: phaseOutput } : undefined,
    });
  }

  /**
   * Create error checkpoint for recovery
   */
  async createErrorCheckpoint(
    executionId: string,
    error: Error,
    context?: Record<string, unknown>
  ): Promise<Checkpoint> {
    return this.createCheckpoint(executionId, {
      reason: 'error',
      additionalState: {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        errorContext: context,
      },
    });
  }

  // ==========================================================================
  // Resume Operations
  // ==========================================================================

  /**
   * Resume execution from latest checkpoint
   */
  async resumeLatest(executionId: string): Promise<ResumeResult> {
    const checkpoint = await this.store.getLatestCheckpoint(executionId);
    if (!checkpoint) {
      return {
        success: false,
        error: `No checkpoints found for execution: ${executionId}`,
      };
    }

    return this.resumeFromCheckpoint(checkpoint.id);
  }

  /**
   * Resume execution from specific checkpoint
   */
  async resumeFromCheckpoint(checkpointId: string): Promise<ResumeResult> {
    const checkpoint = await this.store.getCheckpoint(checkpointId);
    if (!checkpoint) {
      return {
        success: false,
        error: `Checkpoint not found: ${checkpointId}`,
      };
    }

    // Get the execution state
    let execution = await this.store.getExecutionState(checkpoint.executionId);
    if (!execution) {
      return {
        success: false,
        error: `Execution not found: ${checkpoint.executionId}`,
      };
    }

    // Restore execution state from checkpoint
    execution = {
      ...execution,
      status: 'running',
      currentPhase: checkpoint.phase,
      updatedAt: new Date().toISOString(),
      data: {
        ...execution.data,
        ...checkpoint.state,
        resumedFromCheckpoint: checkpointId,
        resumedAt: new Date().toISOString(),
      },
    };

    // Mark phases after checkpoint phase as pending
    execution.phases = execution.phases.map(phase => {
      if (phase.phase > checkpoint.phase) {
        return {
          ...phase,
          status: 'pending' as PhaseStatus,
          startedAt: undefined,
          completedAt: undefined,
          output: undefined,
          error: undefined,
        };
      }
      return phase;
    });

    await this.store.saveExecutionState(execution);

    return {
      success: true,
      executionState: execution,
      checkpoint,
    };
  }

  /**
   * Resume from last completed phase (quick resume)
   */
  async resumeFromLastCompletedPhase(executionId: string): Promise<ResumeResult> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      return {
        success: false,
        error: `Execution not found: ${executionId}`,
      };
    }

    // Find last completed phase
    const completedPhases = execution.phases.filter(p => p.status === 'completed');
    if (completedPhases.length === 0) {
      // No completed phases, start from beginning
      execution.currentPhase = 1;
      execution.status = 'running';
      execution.updatedAt = new Date().toISOString();
      await this.store.saveExecutionState(execution);
      
      return {
        success: true,
        executionState: execution,
      };
    }

    // Get the last completed phase
    const lastCompleted = completedPhases.reduce((max, p) => 
      p.phase > max.phase ? p : max
    );

    // Find checkpoint closest to last completed phase
    const checkpoints = await this.store.listCheckpoints(executionId);
    const relevantCheckpoint = checkpoints
      .filter(c => c.phase <= lastCompleted.phase)
      .sort((a, b) => b.phase - a.phase)[0];

    if (relevantCheckpoint) {
      return this.resumeFromCheckpoint(relevantCheckpoint.id);
    }

    // No checkpoint, just update execution state
    execution.currentPhase = lastCompleted.phase + 1;
    execution.status = 'running';
    execution.updatedAt = new Date().toISOString();
    await this.store.saveExecutionState(execution);

    return {
      success: true,
      executionState: execution,
    };
  }

  // ==========================================================================
  // Checkpoint Management
  // ==========================================================================

  /**
   * List all checkpoints for an execution
   */
  async listCheckpoints(executionId: string): Promise<Checkpoint[]> {
    return this.store.listCheckpoints(executionId);
  }

  /**
   * Get checkpoint details
   */
  async getCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    return this.store.getCheckpoint(checkpointId);
  }

  /**
   * Delete a specific checkpoint
   */
  async deleteCheckpoint(checkpointId: string): Promise<void> {
    // Note: This would require adding a delete method to IStateStore
    // For now, we rely on cleanup
    console.warn('deleteCheckpoint not implemented - use cleanup instead');
  }

  /**
   * Cleanup old checkpoints keeping only the most recent ones
   */
  private async cleanupOldCheckpoints(executionId: string): Promise<void> {
    const checkpoints = await this.store.listCheckpoints(executionId);
    
    if (checkpoints.length <= this.config.maxCheckpointsPerExecution) {
      return;
    }

    // Keep the most recent checkpoints
    // Note: Actual deletion would require adding delete method to IStateStore
    // For now this is a placeholder for future implementation
    const toDelete = checkpoints.slice(
      0,
      checkpoints.length - this.config.maxCheckpointsPerExecution
    );
    
    console.log(
      `Would delete ${toDelete.length} old checkpoints for execution ${executionId}`
    );
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if execution can be resumed
   */
  async canResume(executionId: string): Promise<boolean> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) return false;

    // Can resume if paused, failed, or has checkpoints
    if (['paused', 'failed'].includes(execution.status)) {
      return true;
    }

    const checkpoints = await this.store.listCheckpoints(executionId);
    return checkpoints.length > 0;
  }

  /**
   * Get resume options for an execution
   */
  async getResumeOptions(executionId: string): Promise<{
    canResume: boolean;
    checkpoints: Checkpoint[];
    lastCompletedPhase?: number;
    suggestion: 'latest' | 'last-completed' | 'specific' | 'none';
  }> {
    const execution = await this.store.getExecutionState(executionId);
    const checkpoints = await this.store.listCheckpoints(executionId);
    
    if (!execution) {
      return {
        canResume: false,
        checkpoints: [],
        suggestion: 'none',
      };
    }

    const completedPhases = execution.phases.filter(p => p.status === 'completed');
    const lastCompletedPhase = completedPhases.length > 0
      ? Math.max(...completedPhases.map(p => p.phase))
      : undefined;

    let suggestion: 'latest' | 'last-completed' | 'specific' | 'none' = 'none';
    
    if (checkpoints.length > 0) {
      const latestCheckpoint = checkpoints[checkpoints.length - 1];
      if (latestCheckpoint.reason === 'error') {
        // If last checkpoint was due to error, suggest going back to last completed
        suggestion = 'last-completed';
      } else {
        suggestion = 'latest';
      }
    } else if (lastCompletedPhase !== undefined) {
      suggestion = 'last-completed';
    }

    return {
      canResume: suggestion !== 'none',
      checkpoints,
      lastCompletedPhase,
      suggestion,
    };
  }
}
