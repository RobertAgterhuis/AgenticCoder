/**
 * WorkflowStateIntegration - Connects WorkflowEngine with StateManager
 * 
 * Provides persistence hooks for the JavaScript-based WorkflowEngine:
 * - Persists execution state after each step
 * - Enables resume from checkpoints
 * - Tracks artifacts generated during execution
 * - Records decisions made by agents
 */

import {
  StateManager,
  createStateManager,
  StateManagerConfig,
} from './StateManager';
import {
  ExecutionState,
  PhaseState,
  ArtifactMetadata,
  DecisionRecord,
  PhaseStatus,
} from './types';

export interface WorkflowEvent {
  type: string;
  executionId: string;
  workflowId?: string;
  stepId?: string;
  agentId?: string;
  timestamp?: string;
  outputs?: unknown;
  error?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface WorkflowEngineAdapter {
  /** Event emitter interface */
  on(event: string, handler: (data: WorkflowEvent) => void): void;
  off(event: string, handler: (data: WorkflowEvent) => void): void;
  emit(event: string, data: WorkflowEvent): void;
  
  /** Get current execution state */
  getExecution(executionId: string): {
    executionId: string;
    workflowId: string;
    status: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    stepResults: Array<{
      stepId: string;
      agentId: string;
      status: string;
      output?: unknown;
      error?: string;
      timestamp: string;
    }>;
    outputs: Record<string, unknown>;
    errors: Array<{ stepId: string; error: string }>;
  };
}

/**
 * Maps workflow steps to our 16-phase model
 */
const STEP_TO_PHASE_MAP: Record<string, number> = {
  'extract': 1,           // Project Planning
  'document': 2,          // Documentation
  'architect': 3,         // Architecture Design
  'tech-spec': 4,         // Technical Spec
  'api-design': 5,        // API Design
  'data-model': 6,        // Data Modeling
  'security': 7,          // Security Planning
  'devops': 8,            // DevOps Planning
  'azure-arch': 9,        // Azure Architecture
  'bicep': 10,            // Bicep IaC
  'cost': 11,             // Cost Estimation
  'provision': 12,        // Resource Provisioning
  'frontend': 13,         // Frontend Generation
  'backend': 14,          // Backend Generation
  'database': 15,         // Database Setup
  'validate': 16,         // Integration & Testing
  // Aliases
  'task-extraction': 1,
  'resource-analyzer': 9,
  'cost-estimator': 11,
  'deployment-planner': 8,
  'validation': 16,
};

export class WorkflowStateIntegration {
  private stateManager: StateManager;
  private workflowEngine: WorkflowEngineAdapter | null = null;
  private activeExecution: string | null = null;
  private eventHandlers: Map<string, (data: WorkflowEvent) => Promise<void>> = new Map();
  private initialized = false;

  constructor(config?: StateManagerConfig) {
    this.stateManager = new StateManager(config);
    this.setupEventHandlers();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize state management
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.stateManager.initialize();
    this.initialized = true;
  }

  /**
   * Attach to a WorkflowEngine instance
   */
  attach(workflowEngine: WorkflowEngineAdapter): void {
    if (this.workflowEngine) {
      this.detach();
    }

    this.workflowEngine = workflowEngine;

    // Subscribe to workflow events
    for (const [event, handler] of this.eventHandlers) {
      workflowEngine.on(event, handler);
    }
  }

  /**
   * Detach from current WorkflowEngine
   */
  detach(): void {
    if (!this.workflowEngine) return;

    for (const [event, handler] of this.eventHandlers) {
      this.workflowEngine.off(event, handler);
    }

    this.workflowEngine = null;
  }

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  private setupEventHandlers(): void {
    this.eventHandlers.set('workflow:start', this.onWorkflowStart.bind(this));
    this.eventHandlers.set('workflow:complete', this.onWorkflowComplete.bind(this));
    this.eventHandlers.set('workflow:error', this.onWorkflowError.bind(this));
    this.eventHandlers.set('step:start', this.onStepStart.bind(this));
    this.eventHandlers.set('step:complete', this.onStepComplete.bind(this));
    this.eventHandlers.set('step:error', this.onStepError.bind(this));
    this.eventHandlers.set('step:skipped', this.onStepSkipped.bind(this));
  }

  private async onWorkflowStart(data: WorkflowEvent): Promise<void> {
    try {
      const execution = await this.stateManager.startExecution({
        projectName: data.workflowId || 'unknown',
        scenario: 'workflow',
        customData: {
          workflowId: data.workflowId,
          originalExecutionId: data.executionId,
        },
      });

      this.activeExecution = execution.executionId;

      // Create initial checkpoint
      await this.stateManager.checkpoint.createCheckpoint(execution.executionId, {
        reason: 'auto',
        additionalState: { event: 'workflow:start' },
      });
    } catch (error) {
      console.error('[WorkflowStateIntegration] Failed to persist workflow start:', error);
    }
  }

  private async onWorkflowComplete(data: WorkflowEvent): Promise<void> {
    if (!this.activeExecution) return;

    try {
      // Update execution state
      const currentState = await this.stateManager.execution.getCurrentExecution();
      if (currentState) {
        currentState.status = 'completed';
        currentState.completedAt = new Date().toISOString();
        currentState.totalDurationMs = data.duration;

        // Get final state from workflow engine if available
        if (this.workflowEngine) {
          const engineState = this.workflowEngine.getExecution(data.executionId);
          if (engineState) {
            currentState.data = {
              ...currentState.data,
              outputs: engineState.outputs,
            };
          }
        }

        await this.stateManager.getStore().saveExecutionState(currentState);
      }

      // Create final checkpoint
      await this.stateManager.checkpoint.createCheckpoint(this.activeExecution, {
        reason: 'phase-complete',
        additionalState: { 
          event: 'workflow:complete',
          duration: data.duration,
        },
      });

      this.activeExecution = null;
    } catch (error) {
      console.error('[WorkflowStateIntegration] Failed to persist workflow completion:', error);
    }
  }

  private async onWorkflowError(data: WorkflowEvent): Promise<void> {
    if (!this.activeExecution) return;

    try {
      // Create error checkpoint
      await this.stateManager.checkpoint.createErrorCheckpoint(
        this.activeExecution,
        new Error(data.error || 'Unknown workflow error'),
        { event: 'workflow:error', workflowId: data.workflowId }
      );

      // Update execution state
      const currentState = await this.stateManager.execution.getCurrentExecution();
      if (currentState) {
        currentState.status = 'failed';
        currentState.error = data.error;
        currentState.updatedAt = new Date().toISOString();
        await this.stateManager.getStore().saveExecutionState(currentState);
      }
    } catch (error) {
      console.error('[WorkflowStateIntegration] Failed to persist workflow error:', error);
    }
  }

  private async onStepStart(data: WorkflowEvent): Promise<void> {
    if (!this.activeExecution) return;

    try {
      const phase = this.stepToPhase(data.stepId || '');
      
      // Update phase state
      const currentState = await this.stateManager.execution.getCurrentExecution();
      if (currentState) {
        const phaseState = currentState.phases.find(p => p.phase === phase);
        if (phaseState) {
          phaseState.status = 'in-progress';
          phaseState.startedAt = new Date().toISOString();
          phaseState.agent = data.agentId;
          await this.stateManager.getStore().saveExecutionState(currentState);
        }
      }
    } catch (error) {
      console.error('[WorkflowStateIntegration] Failed to persist step start:', error);
    }
  }

  private async onStepComplete(data: WorkflowEvent): Promise<void> {
    if (!this.activeExecution) return;

    try {
      const phase = this.stepToPhase(data.stepId || '');
      
      // Complete the phase
      await this.stateManager.completePhase(this.activeExecution, phase, data.outputs);

      // Register any artifacts from step output
      if (data.outputs && typeof data.outputs === 'object') {
        await this.registerOutputArtifacts(phase, data.agentId || 'unknown', data.outputs);
      }
    } catch (error) {
      console.error('[WorkflowStateIntegration] Failed to persist step completion:', error);
    }
  }

  private async onStepError(data: WorkflowEvent): Promise<void> {
    if (!this.activeExecution) return;

    try {
      const phase = this.stepToPhase(data.stepId || '');
      
      // Record the error
      await this.stateManager.execution.failPhase(
        this.activeExecution,
        phase,
        new Error(data.error || 'Step failed')
      );

      // Record decision for retry
      const decision: DecisionRecord = {
        id: crypto.randomUUID(),
        executionId: this.activeExecution,
        phase,
        agent: data.agentId || 'unknown',
        category: 'error-handling',
        description: `Step ${data.stepId} failed: ${data.error}`,
        severity: 'warning',
        options: ['retry', 'skip', 'abort'],
        status: 'auto-approved',
        selected: 'continue',
        reasoning: 'Automatic error handling',
        timestamp: new Date().toISOString(),
      };

      await this.stateManager.saveDecision(decision);
    } catch (error) {
      console.error('[WorkflowStateIntegration] Failed to persist step error:', error);
    }
  }

  private async onStepSkipped(data: WorkflowEvent): Promise<void> {
    if (!this.activeExecution) return;

    try {
      const phase = this.stepToPhase(data.stepId || '');
      
      // Update phase as skipped
      const currentState = await this.stateManager.execution.getCurrentExecution();
      if (currentState) {
        const phaseState = currentState.phases.find(p => p.phase === phase);
        if (phaseState) {
          phaseState.status = 'skipped';
          phaseState.completedAt = new Date().toISOString();
          await this.stateManager.getStore().saveExecutionState(currentState);
        }
      }
    } catch (error) {
      console.error('[WorkflowStateIntegration] Failed to persist step skip:', error);
    }
  }

  // ==========================================================================
  // Artifact Registration
  // ==========================================================================

  private async registerOutputArtifacts(
    phase: number,
    agent: string,
    outputs: unknown
  ): Promise<void> {
    if (!outputs || typeof outputs !== 'object') return;

    const outputObj = outputs as Record<string, unknown>;

    // Look for common artifact patterns
    const artifactKeys = [
      'template', 'code', 'bicep', 'terraform', 'yaml', 'json',
      'frontend', 'backend', 'api', 'schema', 'config', 'dockerfile',
    ];

    for (const key of artifactKeys) {
      if (outputObj[key]) {
        const content = typeof outputObj[key] === 'string' 
          ? outputObj[key] as string
          : JSON.stringify(outputObj[key], null, 2);

        await this.stateManager.registerArtifact({
          name: key,
          type: this.inferArtifactType(key),
          path: `/output/${key}`,
          generatedByPhase: phase,
          generatedByAgent: agent,
          content,
          metadata: { source: 'workflow-output' },
        });
      }
    }
  }

  private inferArtifactType(key: string): 'source-code' | 'config' | 'infrastructure' | 'documentation' | 'other' {
    if (['template', 'bicep', 'terraform', 'yaml'].includes(key)) {
      return 'infrastructure';
    }
    if (['code', 'frontend', 'backend', 'api'].includes(key)) {
      return 'source-code';
    }
    if (['config', 'json', 'dockerfile'].includes(key)) {
      return 'config';
    }
    if (['schema'].includes(key)) {
      return 'documentation';
    }
    return 'other';
  }

  // ==========================================================================
  // Resume Support
  // ==========================================================================

  /**
   * Resume a workflow from checkpoint
   */
  async resumeWorkflow(executionId: string): Promise<{
    success: boolean;
    resumePoint?: {
      phase: number;
      stepId: string;
      context: Record<string, unknown>;
    };
    error?: string;
  }> {
    try {
      const result = await this.stateManager.checkpoint.resumeLatest(executionId);
      
      if (!result.success || !result.executionState) {
        return { success: false, error: result.error };
      }

      const execution = result.executionState;
      
      // Find last completed phase
      const completedPhases = execution.phases
        .filter(p => p.status === 'completed')
        .sort((a, b) => b.phase - a.phase);

      const lastCompleted = completedPhases[0];
      const resumePhase = lastCompleted ? lastCompleted.phase + 1 : 1;
      const resumeStepId = this.phaseToStep(resumePhase);

      this.activeExecution = executionId;

      return {
        success: true,
        resumePoint: {
          phase: resumePhase,
          stepId: resumeStepId,
          context: execution.data || {},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Resume failed',
      };
    }
  }

  /**
   * Get resume options for interrupted workflows
   */
  async getResumeOptions(): Promise<Array<{
    executionId: string;
    projectName: string;
    lastPhase: number;
    lastPhaseName: string;
    status: string;
    stoppedAt: string;
  }>> {
    const executions = await this.stateManager.getStore().listExecutions();
    
    return executions
      .filter(e => ['paused', 'failed', 'running'].includes(e.status))
      .map(e => {
        const lastCompleted = e.phases
          .filter(p => p.status === 'completed')
          .sort((a, b) => b.phase - a.phase)[0];

        return {
          executionId: e.executionId,
          projectName: e.projectName,
          lastPhase: lastCompleted?.phase || 0,
          lastPhaseName: lastCompleted?.name || 'Not started',
          status: e.status,
          stoppedAt: e.updatedAt,
        };
      });
  }

  // ==========================================================================
  // Utility
  // ==========================================================================

  private stepToPhase(stepId: string): number {
    return STEP_TO_PHASE_MAP[stepId] || STEP_TO_PHASE_MAP[stepId.toLowerCase()] || 1;
  }

  private phaseToStep(phase: number): string {
    const entry = Object.entries(STEP_TO_PHASE_MAP).find(([_, p]) => p === phase);
    return entry ? entry[0] : 'unknown';
  }

  /**
   * Get state manager for direct access
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }
}

// =============================================================================
// Factory function
// =============================================================================

/**
 * Create and initialize a WorkflowStateIntegration instance
 */
export async function createWorkflowIntegration(
  config?: StateManagerConfig
): Promise<WorkflowStateIntegration> {
  const integration = new WorkflowStateIntegration(config);
  await integration.initialize();
  return integration;
}
