# Phase 3: Execution State & Checkpoints

**Phase ID:** F-PSP-P03  
**Feature:** ProjectStatePersistence  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 2 (Project Configuration)

---

## 🎯 Phase Objectives

Deze phase implementeert **Execution State Management**:
- Workflow execution state tracking
- Checkpoint creation en resume
- Phase completion tracking
- Agent decision logging
- Execution history

---

## 📦 Deliverables

### 1. Package Structure

```
packages/state/src/
├── execution/
│   ├── index.ts                    # Public exports
│   ├── ExecutionState.ts           # Execution state manager
│   ├── ExecutionSchema.ts          # Zod schemas
│   ├── CheckpointManager.ts        # Checkpoint operations
│   ├── DecisionLog.ts              # Decision tracking
│   ├── PhaseTracker.ts             # Phase progress
│   └── ExecutionHistory.ts         # History management
```

---

## 🔧 Implementation Details

### 3.1 Execution Schema (`src/execution/ExecutionSchema.ts`)

```typescript
import { z } from 'zod';

/**
 * Execution status enum
 */
export const ExecutionStatusSchema = z.enum([
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
]);

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

/**
 * Phase status
 */
export const PhaseStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
]);

export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;

/**
 * Phase state
 */
export const PhaseStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: PhaseStatusSchema,
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  duration: z.number().optional(), // ms
  progress: z.number().min(0).max(100).optional(),
  currentTask: z.string().optional(),
  error: z.string().optional(),
  outputs: z.record(z.string(), z.unknown()).default({}),
});

export type PhaseState = z.infer<typeof PhaseStateSchema>;

/**
 * Agent invocation record
 */
export const AgentInvocationSchema = z.object({
  id: z.string(),
  agentName: z.string(),
  phaseId: z.string(),
  input: z.unknown(),
  output: z.unknown().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  duration: z.number().optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type AgentInvocation = z.infer<typeof AgentInvocationSchema>;

/**
 * Decision record
 */
export const DecisionRecordSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(['auto', 'agent', 'user', 'system']),
  agentName: z.string().optional(),
  phaseId: z.string().optional(),
  decision: z.string(),
  context: z.record(z.string(), z.unknown()).default({}),
  alternatives: z.array(z.string()).default([]),
  rationale: z.string().optional(),
  approved: z.boolean().default(true),
  approvedBy: z.string().optional(),
});

export type DecisionRecord = z.infer<typeof DecisionRecordSchema>;

/**
 * Checkpoint data
 */
export const CheckpointSchema = z.object({
  id: z.string(),
  executionId: z.string(),
  createdAt: z.string(),
  phaseId: z.string(),
  description: z.string().optional(),
  state: z.unknown(), // Full state snapshot
  isAutomatic: z.boolean().default(true),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;

/**
 * Artifact reference
 */
export const ArtifactRefSchema = z.object({
  id: z.string(),
  type: z.enum(['file', 'document', 'code', 'config', 'test', 'schema']),
  name: z.string(),
  path: z.string(),
  phaseId: z.string(),
  agentName: z.string().optional(),
  createdAt: z.string(),
  size: z.number().optional(),
  checksum: z.string().optional(),
});

export type ArtifactRef = z.infer<typeof ArtifactRefSchema>;

/**
 * Main execution state
 */
export const ExecutionStateSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  scenario: z.string(),
  status: ExecutionStatusSchema,
  
  // Timing
  createdAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  pausedAt: z.string().optional(),
  
  // Progress
  currentPhaseIndex: z.number().default(0),
  phases: z.array(PhaseStateSchema),
  
  // Records
  agentInvocations: z.array(AgentInvocationSchema).default([]),
  decisions: z.array(DecisionRecordSchema).default([]),
  artifacts: z.array(ArtifactRefSchema).default([]),
  
  // Checkpoints
  checkpoints: z.array(z.string()).default([]), // checkpoint IDs
  lastCheckpointId: z.string().optional(),
  
  // Context
  context: z.record(z.string(), z.unknown()).default({}),
  
  // Error handling
  error: z.string().optional(),
  errorStack: z.string().optional(),
  retryCount: z.number().default(0),
});

export type ExecutionState = z.infer<typeof ExecutionStateSchema>;
```

### 3.2 Execution State Manager (`src/execution/ExecutionState.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import { IStateStore } from '../interfaces/IStateStore';
import { StateStoreFactory } from '../factory/StateStoreFactory';
import {
  ExecutionState,
  ExecutionStateSchema,
  ExecutionStatus,
  PhaseState,
  PhaseStatus,
  AgentInvocation,
  ArtifactRef,
} from './ExecutionSchema';
import { CheckpointManager } from './CheckpointManager';
import { DecisionLog } from './DecisionLog';

export class ExecutionStateManager {
  private store: IStateStore;
  private execution: ExecutionState | null = null;
  private checkpointManager: CheckpointManager;
  private decisionLog: DecisionLog;
  private autoCheckpointEnabled = true;

  constructor(store?: IStateStore) {
    this.store = store || StateStoreFactory.getDefault();
    this.checkpointManager = new CheckpointManager(this.store);
    this.decisionLog = new DecisionLog(this.store);
  }

  /**
   * Initialize execution manager
   */
  async initialize(): Promise<void> {
    await this.store.initialize();
  }

  /**
   * Get current execution
   */
  get current(): ExecutionState | null {
    return this.execution;
  }

  /**
   * Create new execution
   */
  async create(options: {
    projectName: string;
    scenario: string;
    phases: Array<{ id: string; name: string }>;
    context?: Record<string, unknown>;
  }): Promise<ExecutionState> {
    const now = new Date().toISOString();
    const id = `exec-${uuid().substring(0, 8)}`;

    const phases: PhaseState[] = options.phases.map(p => ({
      id: p.id,
      name: p.name,
      status: 'pending' as PhaseStatus,
      outputs: {},
    }));

    const execution: ExecutionState = ExecutionStateSchema.parse({
      id,
      projectName: options.projectName,
      scenario: options.scenario,
      status: 'pending',
      createdAt: now,
      currentPhaseIndex: 0,
      phases,
      context: options.context || {},
      agentInvocations: [],
      decisions: [],
      artifacts: [],
      checkpoints: [],
    });

    await this.store.set('executions', id, execution);
    await this.store.set('executions', 'current', { executionId: id });

    this.execution = execution;
    return execution;
  }

  /**
   * Load execution by ID
   */
  async load(executionId: string): Promise<ExecutionState | null> {
    const entry = await this.store.get<ExecutionState>('executions', executionId);
    
    if (entry) {
      this.execution = entry.data;
      return this.execution;
    }
    
    return null;
  }

  /**
   * Load current execution
   */
  async loadCurrent(): Promise<ExecutionState | null> {
    const currentRef = await this.store.get<{ executionId: string }>('executions', 'current');
    
    if (!currentRef) {
      return null;
    }

    return this.load(currentRef.data.executionId);
  }

  /**
   * Save current execution state
   */
  async save(): Promise<void> {
    if (!this.execution) {
      throw new Error('No execution to save');
    }

    await this.store.set('executions', this.execution.id, this.execution);
  }

  /**
   * Start execution
   */
  async start(): Promise<void> {
    this.ensureExecution();
    
    this.execution!.status = 'running';
    this.execution!.startedAt = new Date().toISOString();
    
    // Start first phase
    await this.startPhase(0);
    
    await this.save();
  }

  /**
   * Pause execution
   */
  async pause(): Promise<void> {
    this.ensureExecution();
    
    if (this.execution!.status !== 'running') {
      throw new Error('Can only pause running execution');
    }

    this.execution!.status = 'paused';
    this.execution!.pausedAt = new Date().toISOString();

    // Create checkpoint
    if (this.autoCheckpointEnabled) {
      await this.createCheckpoint('Auto-checkpoint on pause');
    }

    await this.save();
  }

  /**
   * Resume execution
   */
  async resume(): Promise<void> {
    this.ensureExecution();
    
    if (this.execution!.status !== 'paused') {
      throw new Error('Can only resume paused execution');
    }

    this.execution!.status = 'running';
    this.execution!.pausedAt = undefined;

    await this.save();
  }

  /**
   * Cancel execution
   */
  async cancel(): Promise<void> {
    this.ensureExecution();
    
    this.execution!.status = 'cancelled';
    this.execution!.completedAt = new Date().toISOString();

    await this.save();
  }

  /**
   * Mark execution as failed
   */
  async fail(error: Error): Promise<void> {
    this.ensureExecution();
    
    this.execution!.status = 'failed';
    this.execution!.completedAt = new Date().toISOString();
    this.execution!.error = error.message;
    this.execution!.errorStack = error.stack;

    // Mark current phase as failed
    const currentPhase = this.getCurrentPhase();
    if (currentPhase) {
      currentPhase.status = 'failed';
      currentPhase.error = error.message;
    }

    await this.save();
  }

  /**
   * Complete execution
   */
  async complete(): Promise<void> {
    this.ensureExecution();
    
    this.execution!.status = 'completed';
    this.execution!.completedAt = new Date().toISOString();

    await this.save();
  }

  // ========== Phase Management ==========

  /**
   * Get current phase
   */
  getCurrentPhase(): PhaseState | null {
    if (!this.execution) return null;
    return this.execution.phases[this.execution.currentPhaseIndex] || null;
  }

  /**
   * Start a phase
   */
  async startPhase(index: number): Promise<void> {
    this.ensureExecution();
    
    const phase = this.execution!.phases[index];
    if (!phase) {
      throw new Error(`Phase at index ${index} not found`);
    }

    phase.status = 'running';
    phase.startedAt = new Date().toISOString();
    phase.progress = 0;
    
    this.execution!.currentPhaseIndex = index;

    await this.save();
  }

  /**
   * Update phase progress
   */
  async updatePhaseProgress(progress: number, currentTask?: string): Promise<void> {
    this.ensureExecution();
    
    const phase = this.getCurrentPhase();
    if (!phase) {
      throw new Error('No current phase');
    }

    phase.progress = Math.min(100, Math.max(0, progress));
    if (currentTask) {
      phase.currentTask = currentTask;
    }

    await this.save();
  }

  /**
   * Complete current phase
   */
  async completePhase(outputs?: Record<string, unknown>): Promise<void> {
    this.ensureExecution();
    
    const phase = this.getCurrentPhase();
    if (!phase) {
      throw new Error('No current phase');
    }

    const now = new Date().toISOString();
    
    phase.status = 'completed';
    phase.completedAt = now;
    phase.progress = 100;
    phase.currentTask = undefined;
    
    if (phase.startedAt) {
      phase.duration = new Date(now).getTime() - new Date(phase.startedAt).getTime();
    }
    
    if (outputs) {
      phase.outputs = outputs;
    }

    // Create checkpoint after phase completion
    if (this.autoCheckpointEnabled) {
      await this.createCheckpoint(`Phase ${phase.name} completed`);
    }

    // Move to next phase or complete execution
    const nextIndex = this.execution!.currentPhaseIndex + 1;
    if (nextIndex < this.execution!.phases.length) {
      await this.startPhase(nextIndex);
    } else {
      await this.complete();
    }
  }

  /**
   * Skip current phase
   */
  async skipPhase(reason?: string): Promise<void> {
    this.ensureExecution();
    
    const phase = this.getCurrentPhase();
    if (!phase) {
      throw new Error('No current phase');
    }

    phase.status = 'skipped';
    phase.completedAt = new Date().toISOString();

    // Log decision
    await this.decisionLog.log({
      type: 'system',
      phaseId: phase.id,
      decision: `Skipped phase: ${reason || 'No reason provided'}`,
    });

    // Move to next phase
    const nextIndex = this.execution!.currentPhaseIndex + 1;
    if (nextIndex < this.execution!.phases.length) {
      await this.startPhase(nextIndex);
    } else {
      await this.complete();
    }
  }

  // ========== Agent Invocations ==========

  /**
   * Record agent invocation start
   */
  async recordAgentStart(agentName: string, input: unknown): Promise<string> {
    this.ensureExecution();
    
    const id = `inv-${uuid().substring(0, 8)}`;
    const phase = this.getCurrentPhase();

    const invocation: AgentInvocation = {
      id,
      agentName,
      phaseId: phase?.id || 'unknown',
      input,
      status: 'running',
      startedAt: new Date().toISOString(),
      metadata: {},
    };

    this.execution!.agentInvocations.push(invocation);
    await this.save();

    return id;
  }

  /**
   * Record agent invocation completion
   */
  async recordAgentComplete(invocationId: string, output: unknown): Promise<void> {
    this.ensureExecution();
    
    const invocation = this.execution!.agentInvocations.find(i => i.id === invocationId);
    if (!invocation) {
      throw new Error(`Invocation ${invocationId} not found`);
    }

    const now = new Date().toISOString();
    
    invocation.status = 'completed';
    invocation.output = output;
    invocation.completedAt = now;
    invocation.duration = new Date(now).getTime() - new Date(invocation.startedAt).getTime();

    await this.save();
  }

  /**
   * Record agent invocation failure
   */
  async recordAgentFailure(invocationId: string, error: Error): Promise<void> {
    this.ensureExecution();
    
    const invocation = this.execution!.agentInvocations.find(i => i.id === invocationId);
    if (!invocation) {
      throw new Error(`Invocation ${invocationId} not found`);
    }

    invocation.status = 'failed';
    invocation.error = error.message;
    invocation.completedAt = new Date().toISOString();

    await this.save();
  }

  // ========== Artifacts ==========

  /**
   * Register artifact
   */
  async registerArtifact(artifact: Omit<ArtifactRef, 'id' | 'createdAt'>): Promise<string> {
    this.ensureExecution();
    
    const id = `art-${uuid().substring(0, 8)}`;
    const phase = this.getCurrentPhase();

    const ref: ArtifactRef = {
      id,
      ...artifact,
      phaseId: artifact.phaseId || phase?.id || 'unknown',
      createdAt: new Date().toISOString(),
    };

    this.execution!.artifacts.push(ref);
    await this.save();

    return id;
  }

  /**
   * Get artifacts for phase
   */
  getArtifactsForPhase(phaseId: string): ArtifactRef[] {
    if (!this.execution) return [];
    return this.execution.artifacts.filter(a => a.phaseId === phaseId);
  }

  // ========== Checkpoints ==========

  /**
   * Create checkpoint
   */
  async createCheckpoint(description?: string): Promise<string> {
    this.ensureExecution();
    
    const checkpointId = await this.checkpointManager.create(
      this.execution!,
      description
    );

    this.execution!.checkpoints.push(checkpointId);
    this.execution!.lastCheckpointId = checkpointId;

    await this.save();
    return checkpointId;
  }

  /**
   * Restore from checkpoint
   */
  async restoreFromCheckpoint(checkpointId: string): Promise<void> {
    const checkpoint = await this.checkpointManager.load(checkpointId);
    
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    this.execution = checkpoint.state as ExecutionState;
    this.execution.status = 'paused'; // Always pause after restore
    
    await this.save();
  }

  /**
   * Get available checkpoints
   */
  async getCheckpoints(): Promise<Checkpoint[]> {
    if (!this.execution) return [];
    return this.checkpointManager.list(this.execution.id);
  }

  // ========== Context ==========

  /**
   * Update execution context
   */
  async updateContext(updates: Record<string, unknown>): Promise<void> {
    this.ensureExecution();
    
    this.execution!.context = {
      ...this.execution!.context,
      ...updates,
    };

    await this.save();
  }

  /**
   * Get context value
   */
  getContext<T>(key: string): T | undefined {
    if (!this.execution) return undefined;
    return this.execution.context[key] as T;
  }

  // ========== Helpers ==========

  private ensureExecution(): void {
    if (!this.execution) {
      throw new Error('No execution loaded');
    }
  }

  /**
   * Get execution summary
   */
  getSummary(): ExecutionSummary | null {
    if (!this.execution) return null;

    const completedPhases = this.execution.phases.filter(p => p.status === 'completed').length;
    const totalPhases = this.execution.phases.length;
    
    let totalDuration = 0;
    if (this.execution.startedAt) {
      const endTime = this.execution.completedAt || new Date().toISOString();
      totalDuration = new Date(endTime).getTime() - new Date(this.execution.startedAt).getTime();
    }

    return {
      id: this.execution.id,
      status: this.execution.status,
      scenario: this.execution.scenario,
      progress: Math.round((completedPhases / totalPhases) * 100),
      completedPhases,
      totalPhases,
      currentPhase: this.getCurrentPhase()?.name || null,
      totalDuration,
      artifactCount: this.execution.artifacts.length,
      decisionCount: this.execution.decisions.length,
    };
  }
}

export interface ExecutionSummary {
  id: string;
  status: ExecutionStatus;
  scenario: string;
  progress: number;
  completedPhases: number;
  totalPhases: number;
  currentPhase: string | null;
  totalDuration: number;
  artifactCount: number;
  decisionCount: number;
}
```

### 3.3 Checkpoint Manager (`src/execution/CheckpointManager.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import { IStateStore } from '../interfaces/IStateStore';
import { Checkpoint, CheckpointSchema, ExecutionState } from './ExecutionSchema';

export class CheckpointManager {
  private store: IStateStore;
  private maxCheckpoints = 20; // Per execution

  constructor(store: IStateStore) {
    this.store = store;
  }

  /**
   * Create a checkpoint
   */
  async create(execution: ExecutionState, description?: string): Promise<string> {
    const id = `chk-${uuid().substring(0, 8)}`;
    const currentPhase = execution.phases[execution.currentPhaseIndex];

    const checkpoint: Checkpoint = CheckpointSchema.parse({
      id,
      executionId: execution.id,
      createdAt: new Date().toISOString(),
      phaseId: currentPhase?.id || 'unknown',
      description: description || `Checkpoint at phase ${currentPhase?.name}`,
      state: JSON.parse(JSON.stringify(execution)), // Deep clone
      isAutomatic: !description, // Manual checkpoints have descriptions
    });

    await this.store.set('checkpoints', id, checkpoint);

    // Cleanup old checkpoints
    await this.cleanup(execution.id);

    return id;
  }

  /**
   * Load a checkpoint
   */
  async load(checkpointId: string): Promise<Checkpoint | null> {
    const entry = await this.store.get<Checkpoint>('checkpoints', checkpointId);
    return entry?.data || null;
  }

  /**
   * List checkpoints for execution
   */
  async list(executionId: string): Promise<Checkpoint[]> {
    const entries = await this.store.list<Checkpoint>({
      namespace: 'checkpoints',
      orderBy: 'createdAt',
      orderDir: 'desc',
    });

    return entries
      .filter(e => e.data.executionId === executionId)
      .map(e => e.data);
  }

  /**
   * Delete a checkpoint
   */
  async delete(checkpointId: string): Promise<boolean> {
    return this.store.delete('checkpoints', checkpointId);
  }

  /**
   * Cleanup old checkpoints
   */
  private async cleanup(executionId: string): Promise<void> {
    const checkpoints = await this.list(executionId);

    if (checkpoints.length > this.maxCheckpoints) {
      // Keep manual checkpoints longer
      const automatic = checkpoints.filter(c => c.isAutomatic);
      const manual = checkpoints.filter(c => !c.isAutomatic);

      // Remove oldest automatic checkpoints
      const toRemove = automatic.slice(this.maxCheckpoints - manual.length);
      
      await Promise.all(
        toRemove.map(c => this.delete(c.id))
      );
    }
  }

  /**
   * Find checkpoint closest to a phase
   */
  async findClosestToPhase(executionId: string, phaseId: string): Promise<Checkpoint | null> {
    const checkpoints = await this.list(executionId);
    
    // Find checkpoint at or before this phase
    const matching = checkpoints.find(c => c.phaseId === phaseId);
    if (matching) return matching;

    // Return most recent
    return checkpoints[0] || null;
  }
}
```

### 3.4 Decision Log (`src/execution/DecisionLog.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import { IStateStore } from '../interfaces/IStateStore';
import { DecisionRecord, DecisionRecordSchema } from './ExecutionSchema';

export interface LogDecisionOptions {
  type: 'auto' | 'agent' | 'user' | 'system';
  agentName?: string;
  phaseId?: string;
  decision: string;
  context?: Record<string, unknown>;
  alternatives?: string[];
  rationale?: string;
}

export class DecisionLog {
  private store: IStateStore;
  private executionId: string | null = null;

  constructor(store: IStateStore) {
    this.store = store;
  }

  /**
   * Set current execution for logging
   */
  setExecution(executionId: string): void {
    this.executionId = executionId;
  }

  /**
   * Log a decision
   */
  async log(options: LogDecisionOptions): Promise<string> {
    const id = `dec-${uuid().substring(0, 8)}`;

    const record: DecisionRecord = DecisionRecordSchema.parse({
      id,
      timestamp: new Date().toISOString(),
      type: options.type,
      agentName: options.agentName,
      phaseId: options.phaseId,
      decision: options.decision,
      context: options.context || {},
      alternatives: options.alternatives || [],
      rationale: options.rationale,
      approved: true,
    });

    // Store with execution reference
    const key = this.executionId ? `${this.executionId}:${id}` : id;
    await this.store.set('decisions', key, record);

    return id;
  }

  /**
   * Log an agent decision
   */
  async logAgentDecision(
    agentName: string,
    decision: string,
    options?: Partial<LogDecisionOptions>
  ): Promise<string> {
    return this.log({
      type: 'agent',
      agentName,
      decision,
      ...options,
    });
  }

  /**
   * Log a user decision (requires approval)
   */
  async logUserDecision(
    decision: string,
    approved: boolean,
    approvedBy?: string
  ): Promise<string> {
    const id = `dec-${uuid().substring(0, 8)}`;

    const record: DecisionRecord = DecisionRecordSchema.parse({
      id,
      timestamp: new Date().toISOString(),
      type: 'user',
      decision,
      approved,
      approvedBy,
      context: {},
      alternatives: [],
    });

    const key = this.executionId ? `${this.executionId}:${id}` : id;
    await this.store.set('decisions', key, record);

    return id;
  }

  /**
   * Get decisions for execution
   */
  async getDecisions(executionId?: string): Promise<DecisionRecord[]> {
    const targetId = executionId || this.executionId;
    
    if (!targetId) {
      return [];
    }

    const entries = await this.store.list<DecisionRecord>({
      namespace: 'decisions',
      prefix: `${targetId}:`,
      orderBy: 'createdAt',
      orderDir: 'asc',
    });

    return entries.map(e => e.data);
  }

  /**
   * Get decisions by agent
   */
  async getDecisionsByAgent(agentName: string): Promise<DecisionRecord[]> {
    const all = await this.getDecisions();
    return all.filter(d => d.agentName === agentName);
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<DecisionRecord[]> {
    const all = await this.getDecisions();
    return all.filter(d => d.type === 'user' && !d.approved);
  }

  /**
   * Approve a decision
   */
  async approve(decisionId: string, approvedBy: string): Promise<void> {
    const key = this.executionId ? `${this.executionId}:${decisionId}` : decisionId;
    const entry = await this.store.get<DecisionRecord>('decisions', key);

    if (!entry) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    entry.data.approved = true;
    entry.data.approvedBy = approvedBy;

    await this.store.set('decisions', key, entry.data);
  }

  /**
   * Export decisions to markdown
   */
  async exportToMarkdown(executionId?: string): Promise<string> {
    const decisions = await this.getDecisions(executionId);
    
    let md = '# Decision Log\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;
    md += '| Time | Type | Agent | Decision | Approved |\n';
    md += '|------|------|-------|----------|----------|\n';

    for (const d of decisions) {
      const time = new Date(d.timestamp).toLocaleTimeString();
      const approved = d.approved ? '✅' : '❌';
      md += `| ${time} | ${d.type} | ${d.agentName || '-'} | ${d.decision} | ${approved} |\n`;
    }

    return md;
  }
}
```

---

## 🧪 Testing Strategy

```typescript
// tests/execution/ExecutionState.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExecutionStateManager } from '../../src/execution/ExecutionState';
import { MemoryStateStore } from '../../src/stores/MemoryStateStore';

describe('ExecutionStateManager', () => {
  let manager: ExecutionStateManager;
  let store: MemoryStateStore;

  beforeEach(async () => {
    store = new MemoryStateStore();
    await store.initialize();
    manager = new ExecutionStateManager(store);
    await manager.initialize();
  });

  describe('execution lifecycle', () => {
    it('should create execution', async () => {
      const execution = await manager.create({
        projectName: 'test-project',
        scenario: 'S01',
        phases: [
          { id: 'p1', name: 'Requirements' },
          { id: 'p2', name: 'Design' },
        ],
      });

      expect(execution.id).toMatch(/^exec-/);
      expect(execution.status).toBe('pending');
      expect(execution.phases).toHaveLength(2);
    });

    it('should start and complete phases', async () => {
      await manager.create({
        projectName: 'test',
        scenario: 'S01',
        phases: [
          { id: 'p1', name: 'Phase 1' },
          { id: 'p2', name: 'Phase 2' },
        ],
      });

      await manager.start();
      expect(manager.current!.status).toBe('running');
      expect(manager.getCurrentPhase()!.status).toBe('running');

      await manager.completePhase({ result: 'done' });
      expect(manager.current!.phases[0].status).toBe('completed');
      expect(manager.getCurrentPhase()!.name).toBe('Phase 2');
    });

    it('should pause and resume', async () => {
      await manager.create({
        projectName: 'test',
        scenario: 'S01',
        phases: [{ id: 'p1', name: 'Phase 1' }],
      });

      await manager.start();
      await manager.pause();
      
      expect(manager.current!.status).toBe('paused');
      expect(manager.current!.checkpoints.length).toBeGreaterThan(0);

      await manager.resume();
      expect(manager.current!.status).toBe('running');
    });
  });

  describe('checkpoints', () => {
    it('should create and restore checkpoints', async () => {
      await manager.create({
        projectName: 'test',
        scenario: 'S01',
        phases: [
          { id: 'p1', name: 'Phase 1' },
          { id: 'p2', name: 'Phase 2' },
        ],
      });

      await manager.start();
      const checkpointId = await manager.createCheckpoint('Test checkpoint');

      await manager.completePhase();
      expect(manager.getCurrentPhase()!.name).toBe('Phase 2');

      await manager.restoreFromCheckpoint(checkpointId);
      expect(manager.getCurrentPhase()!.name).toBe('Phase 1');
    });
  });

  describe('agent invocations', () => {
    it('should record agent invocations', async () => {
      await manager.create({
        projectName: 'test',
        scenario: 'S01',
        phases: [{ id: 'p1', name: 'Phase 1' }],
      });

      await manager.start();

      const invocationId = await manager.recordAgentStart('plan', { input: 'data' });
      await manager.recordAgentComplete(invocationId, { output: 'result' });

      const invocation = manager.current!.agentInvocations[0];
      expect(invocation.agentName).toBe('plan');
      expect(invocation.status).toBe('completed');
      expect(invocation.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
```

---

## 📋 Acceptance Criteria

- [ ] Execution state creates, loads, and saves correctly
- [ ] Phase lifecycle (start, progress, complete, skip) works
- [ ] Checkpoints create automatically on pause and phase completion
- [ ] Checkpoint restore returns to correct state
- [ ] Agent invocations track start, complete, and failure
- [ ] Decision log records all decision types
- [ ] Artifacts register and query by phase
- [ ] Execution summary provides accurate progress

---

## 🔗 MCP Integration Points

| MCP Server | Gebruik |
|------------|---------|
| **Memory MCP** | Fast state access during execution |
| **SQLite MCP** | Persistent state storage |
| **Filesystem MCP** | Checkpoint storage |

---

## 🔗 Navigation

← [02-PHASE-PROJECT-CONFIG.md](02-PHASE-PROJECT-CONFIG.md) | [04-PHASE-ARTIFACT-VERSIONING.md](04-PHASE-ARTIFACT-VERSIONING.md) →
