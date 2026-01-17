/**
 * ExecutionManager - Workflow execution state management
 * 
 * Manages the lifecycle of workflow executions:
 * - Creating new executions
 * - Updating phase states
 * - Tracking progress
 * - Completing/failing executions
 */

import * as crypto from 'crypto';
import {
  IStateStore,
  ExecutionState,
  PhaseState,
  PhaseStatus,
  ProjectConfig,
} from './types';
import { CheckpointManager } from './CheckpointManager';

/**
 * Phase definitions for the 16-phase workflow
 */
export const PHASE_DEFINITIONS: Array<{ phase: number; name: string; agent: string }> = [
  { phase: 1, name: 'Project Planning', agent: 'plan-agent' },
  { phase: 2, name: 'Documentation', agent: 'doc-agent' },
  { phase: 3, name: 'Architecture Design', agent: 'architect-agent' },
  { phase: 4, name: 'Technical Spec', agent: 'tech-spec-agent' },
  { phase: 5, name: 'API Design', agent: 'api-design-agent' },
  { phase: 6, name: 'Data Modeling', agent: 'data-model-agent' },
  { phase: 7, name: 'Security Planning', agent: 'security-agent' },
  { phase: 8, name: 'DevOps Planning', agent: 'devops-agent' },
  { phase: 9, name: 'Azure Architecture', agent: 'azure-architect-agent' },
  { phase: 10, name: 'Bicep IaC', agent: 'bicep-agent' },
  { phase: 11, name: 'Cost Estimation', agent: 'cost-agent' },
  { phase: 12, name: 'Resource Provisioning', agent: 'provision-agent' },
  { phase: 13, name: 'Frontend Generation', agent: 'frontend-agent' },
  { phase: 14, name: 'Backend Generation', agent: 'backend-agent' },
  { phase: 15, name: 'Database Setup', agent: 'database-agent' },
  { phase: 16, name: 'Integration & Testing', agent: 'integration-agent' },
];

export interface StartExecutionOptions {
  projectName: string;
  scenario: string;
  startPhase?: number;
  customData?: Record<string, unknown>;
}

export interface PhaseUpdateOptions {
  status: PhaseStatus;
  output?: unknown;
  error?: string;
  agent?: string;
}

export class ExecutionManager {
  private store: IStateStore;
  private checkpointManager: CheckpointManager;
  private autoCheckpoint: boolean;

  constructor(
    store: IStateStore,
    checkpointManager: CheckpointManager,
    options?: { autoCheckpoint?: boolean }
  ) {
    this.store = store;
    this.checkpointManager = checkpointManager;
    this.autoCheckpoint = options?.autoCheckpoint ?? true;
  }

  // ==========================================================================
  // Execution Lifecycle
  // ==========================================================================

  /**
   * Start a new execution
   */
  async startExecution(options: StartExecutionOptions): Promise<ExecutionState> {
    const executionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const startPhase = options.startPhase ?? 1;

    // Initialize all phases
    const phases: PhaseState[] = PHASE_DEFINITIONS.map(def => ({
      phase: def.phase,
      name: def.name,
      status: def.phase < startPhase ? 'skipped' : 'pending',
      agent: def.agent,
      retryCount: 0,
    }));

    // Mark first phase as in-progress
    const firstPhaseIndex = phases.findIndex(p => p.phase === startPhase);
    if (firstPhaseIndex >= 0) {
      phases[firstPhaseIndex].status = 'in-progress';
      phases[firstPhaseIndex].startedAt = now;
    }

    const execution: ExecutionState = {
      executionId,
      projectName: options.projectName,
      scenario: options.scenario,
      status: 'running',
      currentPhase: startPhase,
      phases,
      startedAt: now,
      updatedAt: now,
      data: options.customData,
    };

    await this.store.saveExecutionState(execution);

    // Create initial checkpoint
    if (this.autoCheckpoint) {
      await this.checkpointManager.createCheckpoint(executionId, {
        reason: 'auto',
        additionalState: { event: 'execution-started' },
      });
    }

    return execution;
  }

  /**
   * Get current execution
   */
  async getCurrentExecution(): Promise<ExecutionState | null> {
    return this.store.getCurrentExecution();
  }

  /**
   * Get specific execution
   */
  async getExecution(executionId: string): Promise<ExecutionState | null> {
    return this.store.getExecutionState(executionId);
  }

  /**
   * List past executions
   */
  async listExecutions(limit?: number): Promise<ExecutionState[]> {
    return this.store.listExecutions(limit);
  }

  // ==========================================================================
  // Phase Management
  // ==========================================================================

  /**
   * Start a specific phase
   */
  async startPhase(executionId: string, phase: number): Promise<ExecutionState> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const phaseIndex = execution.phases.findIndex(p => p.phase === phase);
    if (phaseIndex < 0) {
      throw new Error(`Phase not found: ${phase}`);
    }

    const now = new Date().toISOString();
    execution.phases[phaseIndex] = {
      ...execution.phases[phaseIndex],
      status: 'in-progress',
      startedAt: now,
      error: undefined,
    };
    execution.currentPhase = phase;
    execution.updatedAt = now;

    await this.store.saveExecutionState(execution);
    return execution;
  }

  /**
   * Complete a phase
   */
  async completePhase(
    executionId: string,
    phase: number,
    output?: unknown
  ): Promise<ExecutionState> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const phaseIndex = execution.phases.findIndex(p => p.phase === phase);
    if (phaseIndex < 0) {
      throw new Error(`Phase not found: ${phase}`);
    }

    const now = new Date().toISOString();
    execution.phases[phaseIndex] = {
      ...execution.phases[phaseIndex],
      status: 'completed',
      completedAt: now,
      output,
    };
    execution.updatedAt = now;

    // Auto-advance to next phase if not the last one
    const nextPhase = execution.phases.find(
      p => p.phase > phase && p.status === 'pending'
    );
    if (nextPhase) {
      execution.currentPhase = nextPhase.phase;
      nextPhase.status = 'in-progress';
      nextPhase.startedAt = now;
    } else {
      // All phases completed
      execution.status = 'completed';
      execution.completedAt = now;
      execution.totalDurationMs = 
        new Date(now).getTime() - new Date(execution.startedAt).getTime();
    }

    await this.store.saveExecutionState(execution);

    // Create checkpoint after phase completion
    if (this.autoCheckpoint) {
      await this.checkpointManager.createPhaseCheckpoint(executionId, output);
    }

    return execution;
  }

  /**
   * Fail a phase
   */
  async failPhase(
    executionId: string,
    phase: number,
    error: string | Error
  ): Promise<ExecutionState> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const phaseIndex = execution.phases.findIndex(p => p.phase === phase);
    if (phaseIndex < 0) {
      throw new Error(`Phase not found: ${phase}`);
    }

    const errorMessage = error instanceof Error ? error.message : error;
    const now = new Date().toISOString();

    execution.phases[phaseIndex] = {
      ...execution.phases[phaseIndex],
      status: 'failed',
      completedAt: now,
      error: errorMessage,
      retryCount: execution.phases[phaseIndex].retryCount + 1,
    };
    execution.status = 'failed';
    execution.error = errorMessage;
    execution.updatedAt = now;

    await this.store.saveExecutionState(execution);

    // Create error checkpoint
    if (this.autoCheckpoint) {
      await this.checkpointManager.createErrorCheckpoint(
        executionId,
        error instanceof Error ? error : new Error(errorMessage),
        { phase, phaseState: execution.phases[phaseIndex] }
      );
    }

    return execution;
  }

  /**
   * Skip a phase
   */
  async skipPhase(
    executionId: string,
    phase: number,
    reason?: string
  ): Promise<ExecutionState> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const phaseIndex = execution.phases.findIndex(p => p.phase === phase);
    if (phaseIndex < 0) {
      throw new Error(`Phase not found: ${phase}`);
    }

    const now = new Date().toISOString();
    execution.phases[phaseIndex] = {
      ...execution.phases[phaseIndex],
      status: 'skipped',
      completedAt: now,
      output: { skippedReason: reason },
    };
    execution.updatedAt = now;

    // Move to next phase
    const nextPhase = execution.phases.find(
      p => p.phase > phase && p.status === 'pending'
    );
    if (nextPhase) {
      execution.currentPhase = nextPhase.phase;
      nextPhase.status = 'in-progress';
      nextPhase.startedAt = now;
    }

    await this.store.saveExecutionState(execution);
    return execution;
  }

  /**
   * Retry a failed phase
   */
  async retryPhase(executionId: string, phase: number): Promise<ExecutionState> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const phaseIndex = execution.phases.findIndex(p => p.phase === phase);
    if (phaseIndex < 0) {
      throw new Error(`Phase not found: ${phase}`);
    }

    if (execution.phases[phaseIndex].status !== 'failed') {
      throw new Error(`Phase ${phase} is not in failed state`);
    }

    const now = new Date().toISOString();
    execution.phases[phaseIndex] = {
      ...execution.phases[phaseIndex],
      status: 'in-progress',
      startedAt: now,
      completedAt: undefined,
      error: undefined,
      output: undefined,
    };
    execution.status = 'running';
    execution.error = undefined;
    execution.currentPhase = phase;
    execution.updatedAt = now;

    await this.store.saveExecutionState(execution);
    return execution;
  }

  // ==========================================================================
  // Execution Control
  // ==========================================================================

  /**
   * Pause execution
   */
  async pauseExecution(executionId: string): Promise<ExecutionState> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status !== 'running') {
      throw new Error(`Cannot pause execution in ${execution.status} state`);
    }

    execution.status = 'paused';
    execution.updatedAt = new Date().toISOString();

    await this.store.saveExecutionState(execution);

    // Create pause checkpoint
    if (this.autoCheckpoint) {
      await this.checkpointManager.createCheckpoint(executionId, {
        reason: 'manual',
        additionalState: { event: 'paused' },
      });
    }

    return execution;
  }

  /**
   * Resume paused execution
   */
  async resumeExecution(executionId: string): Promise<ExecutionState> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status !== 'paused') {
      throw new Error(`Cannot resume execution in ${execution.status} state`);
    }

    execution.status = 'running';
    execution.updatedAt = new Date().toISOString();

    await this.store.saveExecutionState(execution);
    return execution;
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string, reason?: string): Promise<ExecutionState> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (['completed', 'cancelled'].includes(execution.status)) {
      throw new Error(`Cannot cancel execution in ${execution.status} state`);
    }

    const now = new Date().toISOString();
    execution.status = 'cancelled';
    execution.completedAt = now;
    execution.updatedAt = now;
    execution.error = reason || 'Cancelled by user';
    execution.totalDurationMs = 
      new Date(now).getTime() - new Date(execution.startedAt).getTime();

    await this.store.saveExecutionState(execution);
    return execution;
  }

  // ==========================================================================
  // Progress Tracking
  // ==========================================================================

  /**
   * Get execution progress
   */
  async getProgress(executionId: string): Promise<{
    totalPhases: number;
    completedPhases: number;
    failedPhases: number;
    skippedPhases: number;
    currentPhase: number;
    percentComplete: number;
    status: string;
    estimatedRemainingMs?: number;
  }> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const completed = execution.phases.filter(p => p.status === 'completed');
    const failed = execution.phases.filter(p => p.status === 'failed');
    const skipped = execution.phases.filter(p => p.status === 'skipped');

    const progressPhases = completed.length + skipped.length;
    const percentComplete = Math.round((progressPhases / execution.phases.length) * 100);

    // Estimate remaining time based on average phase duration
    let estimatedRemainingMs: number | undefined;
    if (completed.length > 0) {
      const completedDurations = completed
        .filter(p => p.startedAt && p.completedAt)
        .map(p => new Date(p.completedAt!).getTime() - new Date(p.startedAt!).getTime());
      
      if (completedDurations.length > 0) {
        const avgDuration = completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length;
        const remainingPhases = execution.phases.filter(
          p => p.status === 'pending' || p.status === 'in-progress'
        ).length;
        estimatedRemainingMs = avgDuration * remainingPhases;
      }
    }

    return {
      totalPhases: execution.phases.length,
      completedPhases: completed.length,
      failedPhases: failed.length,
      skippedPhases: skipped.length,
      currentPhase: execution.currentPhase,
      percentComplete,
      status: execution.status,
      estimatedRemainingMs,
    };
  }

  /**
   * Get phase details
   */
  async getPhaseDetails(
    executionId: string,
    phase: number
  ): Promise<PhaseState | null> {
    const execution = await this.store.getExecutionState(executionId);
    if (!execution) return null;

    return execution.phases.find(p => p.phase === phase) || null;
  }
}
