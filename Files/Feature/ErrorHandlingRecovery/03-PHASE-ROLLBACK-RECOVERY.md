# Phase 3: Rollback & Recovery

**Phase ID:** F-EHR-P03  
**Feature:** ErrorHandlingRecovery  
**Duration:** 4-5 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 2 (Retry & Circuit Breaker), ProjectStatePersistence

---

## 🎯 Phase Objectives

Deze phase implementeert **Rollback en Recovery Mechanisms**:
- Checkpoint creation en management
- Rollback to last known good state
- Partial work recovery
- Transaction-like semantics
- Recovery planning en execution

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── recovery/
│   ├── CheckpointManager.ts
│   ├── RollbackManager.ts
│   ├── RecoveryPlanner.ts
│   ├── TransactionManager.ts
│   └── types/
│       ├── Checkpoint.ts
│       ├── RollbackStrategy.ts
│       └── RecoveryPlan.ts
```

---

## 🔧 Implementation Details

### 3.1 Checkpoint Types (`src/recovery/types/Checkpoint.ts`)

```typescript
import { z } from 'zod';

/**
 * Checkpoint type
 */
export type CheckpointType = 
  | 'auto'           // Automatic checkpoint
  | 'manual'         // User-triggered checkpoint
  | 'phase-start'    // Start of phase
  | 'phase-end'      // End of phase
  | 'agent-start'    // Before agent execution
  | 'agent-end'      // After agent execution
  | 'milestone'      // Important milestone
  | 'pre-deploy'     // Before deployment
  | 'recovery';      // Created during recovery

/**
 * Checkpoint metadata
 */
export interface CheckpointMetadata {
  /** Unique checkpoint ID */
  id: string;
  
  /** Checkpoint name */
  name: string;
  
  /** Checkpoint type */
  type: CheckpointType;
  
  /** Creation timestamp */
  timestamp: Date;
  
  /** Workflow execution ID */
  workflowId: string;
  
  /** Current phase */
  phase: number;
  
  /** Current agent (if applicable) */
  agent?: string;
  
  /** Description */
  description?: string;
  
  /** Tags for filtering */
  tags: string[];
  
  /** Is this checkpoint valid for rollback */
  isValid: boolean;
  
  /** Parent checkpoint ID */
  parentId?: string;
  
  /** Checksum for integrity */
  checksum: string;
}

/**
 * Checkpoint state
 */
export interface CheckpointState {
  /** Workflow state */
  workflow: {
    currentPhase: number;
    completedPhases: number[];
    status: string;
  };
  
  /** Artifacts at this checkpoint */
  artifacts: ArtifactSnapshot[];
  
  /** Context/variables */
  context: Record<string, unknown>;
  
  /** Message bus state */
  messageBusState?: {
    pendingMessages: number;
    lastProcessedId?: string;
  };
  
  /** Agent states */
  agentStates: Record<string, unknown>;
}

/**
 * Artifact snapshot
 */
export interface ArtifactSnapshot {
  id: string;
  type: string;
  name: string;
  version: number;
  checksum: string;
  size: number;
  storagePath: string;
}

/**
 * Full checkpoint
 */
export interface Checkpoint {
  metadata: CheckpointMetadata;
  state: CheckpointState;
}

/**
 * Checkpoint schema for validation
 */
export const CheckpointMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    'auto', 'manual', 'phase-start', 'phase-end',
    'agent-start', 'agent-end', 'milestone', 'pre-deploy', 'recovery'
  ]),
  timestamp: z.coerce.date(),
  workflowId: z.string(),
  phase: z.number(),
  agent: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  isValid: z.boolean(),
  parentId: z.string().optional(),
  checksum: z.string(),
});

export const CheckpointStateSchema = z.object({
  workflow: z.object({
    currentPhase: z.number(),
    completedPhases: z.array(z.number()),
    status: z.string(),
  }),
  artifacts: z.array(z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    version: z.number(),
    checksum: z.string(),
    size: z.number(),
    storagePath: z.string(),
  })),
  context: z.record(z.unknown()),
  messageBusState: z.object({
    pendingMessages: z.number(),
    lastProcessedId: z.string().optional(),
  }).optional(),
  agentStates: z.record(z.unknown()),
});

export const CheckpointSchema = z.object({
  metadata: CheckpointMetadataSchema,
  state: CheckpointStateSchema,
});
```

### 3.2 Rollback Strategy Types (`src/recovery/types/RollbackStrategy.ts`)

```typescript
/**
 * Rollback strategy types
 */
export type RollbackStrategyType =
  | 'full'           // Complete rollback to checkpoint
  | 'partial'        // Rollback specific components
  | 'selective'      // User-selected items
  | 'incremental';   // Step-by-step undo

/**
 * Rollback scope
 */
export interface RollbackScope {
  /** Rollback workflow state */
  workflow: boolean;
  
  /** Rollback artifacts */
  artifacts: boolean | string[];
  
  /** Rollback context */
  context: boolean | string[];
  
  /** Rollback agent states */
  agentStates: boolean | string[];
  
  /** Rollback file system changes */
  fileSystem: boolean;
  
  /** Rollback infrastructure (dangerous) */
  infrastructure: boolean;
}

/**
 * Rollback options
 */
export interface RollbackOptions {
  /** Strategy to use */
  strategy: RollbackStrategyType;
  
  /** What to rollback */
  scope: RollbackScope;
  
  /** Create backup before rollback */
  createBackup: boolean;
  
  /** Dry run - don't actually rollback */
  dryRun: boolean;
  
  /** Force rollback even if validation fails */
  force: boolean;
  
  /** Timeout for rollback operation */
  timeout: number;
  
  /** Callback during rollback */
  onProgress?: (progress: RollbackProgress) => void;
}

/**
 * Rollback progress
 */
export interface RollbackProgress {
  phase: 'validating' | 'backup' | 'rollback' | 'verify' | 'complete';
  current: number;
  total: number;
  item?: string;
  message: string;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  success: boolean;
  checkpointId: string;
  backupId?: string;
  itemsRolledBack: RolledBackItem[];
  errors: RollbackError[];
  duration: number;
  timestamp: Date;
}

/**
 * Rolled back item
 */
export interface RolledBackItem {
  type: 'artifact' | 'state' | 'file' | 'context';
  id: string;
  name: string;
  previousVersion?: number;
  restoredVersion?: number;
}

/**
 * Rollback error
 */
export interface RollbackError {
  item: string;
  error: string;
  recoverable: boolean;
}

/**
 * Default rollback options
 */
export const DEFAULT_ROLLBACK_OPTIONS: RollbackOptions = {
  strategy: 'full',
  scope: {
    workflow: true,
    artifacts: true,
    context: true,
    agentStates: true,
    fileSystem: false,
    infrastructure: false,
  },
  createBackup: true,
  dryRun: false,
  force: false,
  timeout: 60000,
};
```

### 3.3 Recovery Plan Types (`src/recovery/types/RecoveryPlan.ts`)

```typescript
/**
 * Recovery action types
 */
export type RecoveryActionType =
  | 'rollback'
  | 'retry'
  | 'skip'
  | 'manual'
  | 'escalate'
  | 'abort';

/**
 * Recovery action
 */
export interface RecoveryAction {
  id: string;
  type: RecoveryActionType;
  description: string;
  target?: string;
  params?: Record<string, unknown>;
  order: number;
  required: boolean;
  timeout?: number;
}

/**
 * Recovery plan
 */
export interface RecoveryPlan {
  id: string;
  name: string;
  description: string;
  errorCode: string;
  errorCategory: string;
  actions: RecoveryAction[];
  estimatedDuration: number;
  requiresApproval: boolean;
  createdAt: Date;
  confidence: number; // 0-1
}

/**
 * Recovery execution result
 */
export interface RecoveryExecutionResult {
  planId: string;
  success: boolean;
  actionsExecuted: ExecutedAction[];
  finalState: 'recovered' | 'partial' | 'failed' | 'escalated';
  duration: number;
  nextSteps?: string[];
}

/**
 * Executed action
 */
export interface ExecutedAction {
  actionId: string;
  type: RecoveryActionType;
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
}
```

### 3.4 Checkpoint Manager (`src/recovery/CheckpointManager.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';
import { 
  Checkpoint, 
  CheckpointMetadata, 
  CheckpointState, 
  CheckpointType,
  CheckpointSchema 
} from './types/Checkpoint';

/**
 * Checkpoint storage interface
 */
export interface CheckpointStorage {
  save(checkpoint: Checkpoint): Promise<void>;
  load(id: string): Promise<Checkpoint | null>;
  list(workflowId: string): Promise<CheckpointMetadata[]>;
  delete(id: string): Promise<void>;
  getLatest(workflowId: string): Promise<Checkpoint | null>;
}

/**
 * In-memory checkpoint storage
 */
export class InMemoryCheckpointStorage implements CheckpointStorage {
  private checkpoints: Map<string, Checkpoint> = new Map();

  async save(checkpoint: Checkpoint): Promise<void> {
    this.checkpoints.set(checkpoint.metadata.id, checkpoint);
  }

  async load(id: string): Promise<Checkpoint | null> {
    return this.checkpoints.get(id) || null;
  }

  async list(workflowId: string): Promise<CheckpointMetadata[]> {
    return Array.from(this.checkpoints.values())
      .filter(cp => cp.metadata.workflowId === workflowId)
      .map(cp => cp.metadata)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async delete(id: string): Promise<void> {
    this.checkpoints.delete(id);
  }

  async getLatest(workflowId: string): Promise<Checkpoint | null> {
    const checkpoints = Array.from(this.checkpoints.values())
      .filter(cp => cp.metadata.workflowId === workflowId && cp.metadata.isValid)
      .sort((a, b) => b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime());
    
    return checkpoints[0] || null;
  }
}

/**
 * Checkpoint manager
 */
export class CheckpointManager {
  private storage: CheckpointStorage;
  private currentWorkflowId: string | null = null;
  private lastCheckpointId: string | null = null;

  constructor(storage?: CheckpointStorage) {
    this.storage = storage || new InMemoryCheckpointStorage();
  }

  /**
   * Set current workflow
   */
  setWorkflow(workflowId: string): void {
    this.currentWorkflowId = workflowId;
  }

  /**
   * Create checkpoint
   */
  async createCheckpoint(
    state: CheckpointState,
    options: {
      name?: string;
      type?: CheckpointType;
      description?: string;
      tags?: string[];
      agent?: string;
      phase?: number;
    } = {}
  ): Promise<CheckpointMetadata> {
    if (!this.currentWorkflowId) {
      throw new Error('No workflow set. Call setWorkflow() first.');
    }

    const id = `cp-${uuid().substring(0, 12)}`;
    const checksum = this.calculateChecksum(state);

    const metadata: CheckpointMetadata = {
      id,
      name: options.name || `Checkpoint ${id}`,
      type: options.type || 'auto',
      timestamp: new Date(),
      workflowId: this.currentWorkflowId,
      phase: options.phase ?? state.workflow.currentPhase,
      agent: options.agent,
      description: options.description,
      tags: options.tags || [],
      isValid: true,
      parentId: this.lastCheckpointId || undefined,
      checksum,
    };

    const checkpoint: Checkpoint = { metadata, state };

    // Validate checkpoint
    const validation = CheckpointSchema.safeParse(checkpoint);
    if (!validation.success) {
      throw new Error(`Invalid checkpoint: ${validation.error.message}`);
    }

    await this.storage.save(checkpoint);
    this.lastCheckpointId = id;

    return metadata;
  }

  /**
   * Create phase start checkpoint
   */
  async createPhaseStartCheckpoint(
    phase: number,
    state: CheckpointState
  ): Promise<CheckpointMetadata> {
    return this.createCheckpoint(state, {
      name: `Phase ${phase} Start`,
      type: 'phase-start',
      phase,
      tags: ['phase-boundary'],
    });
  }

  /**
   * Create phase end checkpoint
   */
  async createPhaseEndCheckpoint(
    phase: number,
    state: CheckpointState
  ): Promise<CheckpointMetadata> {
    return this.createCheckpoint(state, {
      name: `Phase ${phase} Complete`,
      type: 'phase-end',
      phase,
      tags: ['phase-boundary', 'milestone'],
    });
  }

  /**
   * Create agent checkpoint
   */
  async createAgentCheckpoint(
    agent: string,
    type: 'start' | 'end',
    state: CheckpointState
  ): Promise<CheckpointMetadata> {
    return this.createCheckpoint(state, {
      name: `Agent ${agent} ${type}`,
      type: type === 'start' ? 'agent-start' : 'agent-end',
      agent,
      tags: ['agent'],
    });
  }

  /**
   * Load checkpoint
   */
  async loadCheckpoint(id: string): Promise<Checkpoint | null> {
    const checkpoint = await this.storage.load(id);
    
    if (checkpoint) {
      // Verify integrity
      const calculatedChecksum = this.calculateChecksum(checkpoint.state);
      if (calculatedChecksum !== checkpoint.metadata.checksum) {
        throw new Error(`Checkpoint ${id} failed integrity check`);
      }
    }

    return checkpoint;
  }

  /**
   * Get latest valid checkpoint
   */
  async getLatestCheckpoint(): Promise<Checkpoint | null> {
    if (!this.currentWorkflowId) {
      return null;
    }
    return this.storage.getLatest(this.currentWorkflowId);
  }

  /**
   * List checkpoints
   */
  async listCheckpoints(options?: {
    type?: CheckpointType;
    tags?: string[];
    limit?: number;
  }): Promise<CheckpointMetadata[]> {
    if (!this.currentWorkflowId) {
      return [];
    }

    let checkpoints = await this.storage.list(this.currentWorkflowId);

    if (options?.type) {
      checkpoints = checkpoints.filter(cp => cp.type === options.type);
    }

    if (options?.tags && options.tags.length > 0) {
      checkpoints = checkpoints.filter(cp => 
        options.tags!.some(tag => cp.tags.includes(tag))
      );
    }

    if (options?.limit) {
      checkpoints = checkpoints.slice(0, options.limit);
    }

    return checkpoints;
  }

  /**
   * Invalidate checkpoint
   */
  async invalidateCheckpoint(id: string): Promise<void> {
    const checkpoint = await this.storage.load(id);
    if (checkpoint) {
      checkpoint.metadata.isValid = false;
      await this.storage.save(checkpoint);
    }
  }

  /**
   * Delete checkpoint
   */
  async deleteCheckpoint(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  /**
   * Cleanup old checkpoints
   */
  async cleanup(options: {
    keepLast?: number;
    keepPhaseEndpoints?: boolean;
    olderThan?: Date;
  } = {}): Promise<number> {
    if (!this.currentWorkflowId) {
      return 0;
    }

    const checkpoints = await this.storage.list(this.currentWorkflowId);
    let deleted = 0;

    const keepLast = options.keepLast || 10;
    const toKeep = new Set<string>();

    // Keep most recent N
    checkpoints.slice(0, keepLast).forEach(cp => toKeep.add(cp.id));

    // Keep phase endpoints
    if (options.keepPhaseEndpoints) {
      checkpoints
        .filter(cp => cp.type === 'phase-end')
        .forEach(cp => toKeep.add(cp.id));
    }

    // Delete others
    for (const cp of checkpoints) {
      if (!toKeep.has(cp.id)) {
        if (options.olderThan && cp.timestamp > options.olderThan) {
          continue;
        }
        await this.storage.delete(cp.id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Calculate checksum for state
   */
  private calculateChecksum(state: CheckpointState): string {
    const content = JSON.stringify(state);
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
}

/**
 * Create checkpoint manager
 */
export function createCheckpointManager(storage?: CheckpointStorage): CheckpointManager {
  return new CheckpointManager(storage);
}
```

### 3.5 Rollback Manager (`src/recovery/RollbackManager.ts`)

```typescript
import { CheckpointManager } from './CheckpointManager';
import { Checkpoint, CheckpointState } from './types/Checkpoint';
import {
  RollbackOptions,
  RollbackResult,
  RollbackProgress,
  RolledBackItem,
  RollbackError,
  DEFAULT_ROLLBACK_OPTIONS,
} from './types/RollbackStrategy';

/**
 * State restorer interface
 */
export interface StateRestorer {
  restore(state: CheckpointState, scope: RollbackOptions['scope']): Promise<RestoreResult>;
}

/**
 * Restore result
 */
export interface RestoreResult {
  success: boolean;
  itemsRestored: string[];
  errors: string[];
}

/**
 * Rollback manager
 */
export class RollbackManager {
  private checkpointManager: CheckpointManager;
  private restorer?: StateRestorer;

  constructor(checkpointManager: CheckpointManager, restorer?: StateRestorer) {
    this.checkpointManager = checkpointManager;
    this.restorer = restorer;
  }

  /**
   * Rollback to checkpoint
   */
  async rollbackTo(
    checkpointId: string,
    options: Partial<RollbackOptions> = {}
  ): Promise<RollbackResult> {
    const opts = { ...DEFAULT_ROLLBACK_OPTIONS, ...options };
    const startTime = Date.now();
    const itemsRolledBack: RolledBackItem[] = [];
    const errors: RollbackError[] = [];
    let backupId: string | undefined;

    try {
      // Progress: validating
      opts.onProgress?.({
        phase: 'validating',
        current: 0,
        total: 4,
        message: 'Validating checkpoint...',
      });

      // Load checkpoint
      const checkpoint = await this.checkpointManager.loadCheckpoint(checkpointId);
      if (!checkpoint) {
        throw new Error(`Checkpoint ${checkpointId} not found`);
      }

      if (!checkpoint.metadata.isValid && !opts.force) {
        throw new Error(`Checkpoint ${checkpointId} is invalid`);
      }

      // Dry run - just validate
      if (opts.dryRun) {
        return {
          success: true,
          checkpointId,
          itemsRolledBack: this.simulateRollback(checkpoint, opts),
          errors: [],
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      // Progress: backup
      opts.onProgress?.({
        phase: 'backup',
        current: 1,
        total: 4,
        message: 'Creating backup...',
      });

      // Create backup of current state
      if (opts.createBackup) {
        const backup = await this.createBackup();
        backupId = backup.metadata.id;
      }

      // Progress: rollback
      opts.onProgress?.({
        phase: 'rollback',
        current: 2,
        total: 4,
        message: 'Rolling back state...',
      });

      // Perform rollback
      if (this.restorer) {
        const restoreResult = await this.restorer.restore(checkpoint.state, opts.scope);
        
        restoreResult.itemsRestored.forEach(item => {
          itemsRolledBack.push({
            type: 'state',
            id: item,
            name: item,
          });
        });

        restoreResult.errors.forEach(error => {
          errors.push({
            item: 'unknown',
            error,
            recoverable: true,
          });
        });
      } else {
        // Default rollback implementation
        const result = await this.defaultRollback(checkpoint, opts);
        itemsRolledBack.push(...result.items);
        errors.push(...result.errors);
      }

      // Progress: verify
      opts.onProgress?.({
        phase: 'verify',
        current: 3,
        total: 4,
        message: 'Verifying rollback...',
      });

      // Verify rollback
      const verified = await this.verifyRollback(checkpoint, opts);
      if (!verified && !opts.force) {
        errors.push({
          item: 'verification',
          error: 'Rollback verification failed',
          recoverable: false,
        });
      }

      // Progress: complete
      opts.onProgress?.({
        phase: 'complete',
        current: 4,
        total: 4,
        message: 'Rollback complete',
      });

      return {
        success: errors.filter(e => !e.recoverable).length === 0,
        checkpointId,
        backupId,
        itemsRolledBack,
        errors,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

    } catch (error) {
      errors.push({
        item: 'rollback',
        error: error instanceof Error ? error.message : String(error),
        recoverable: false,
      });

      return {
        success: false,
        checkpointId,
        backupId,
        itemsRolledBack,
        errors,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Rollback to latest checkpoint
   */
  async rollbackToLatest(options?: Partial<RollbackOptions>): Promise<RollbackResult> {
    const latest = await this.checkpointManager.getLatestCheckpoint();
    if (!latest) {
      throw new Error('No checkpoint available for rollback');
    }
    return this.rollbackTo(latest.metadata.id, options);
  }

  /**
   * Rollback to phase start
   */
  async rollbackToPhaseStart(phase: number, options?: Partial<RollbackOptions>): Promise<RollbackResult> {
    const checkpoints = await this.checkpointManager.listCheckpoints({
      type: 'phase-start',
    });

    const phaseCheckpoint = checkpoints.find(cp => cp.phase === phase);
    if (!phaseCheckpoint) {
      throw new Error(`No checkpoint found for phase ${phase} start`);
    }

    return this.rollbackTo(phaseCheckpoint.id, options);
  }

  /**
   * Create backup of current state
   */
  private async createBackup(): Promise<Checkpoint> {
    // In real implementation, capture current state
    const currentState: CheckpointState = {
      workflow: {
        currentPhase: 0,
        completedPhases: [],
        status: 'backup',
      },
      artifacts: [],
      context: {},
      agentStates: {},
    };

    const metadata = await this.checkpointManager.createCheckpoint(currentState, {
      name: 'Pre-rollback backup',
      type: 'recovery',
      tags: ['backup', 'auto'],
    });

    const checkpoint = await this.checkpointManager.loadCheckpoint(metadata.id);
    return checkpoint!;
  }

  /**
   * Default rollback implementation
   */
  private async defaultRollback(
    checkpoint: Checkpoint,
    options: RollbackOptions
  ): Promise<{ items: RolledBackItem[]; errors: RollbackError[] }> {
    const items: RolledBackItem[] = [];
    const errors: RollbackError[] = [];

    // Rollback workflow state
    if (options.scope.workflow) {
      items.push({
        type: 'state',
        id: 'workflow',
        name: 'Workflow State',
      });
    }

    // Rollback artifacts
    if (options.scope.artifacts) {
      const artifactIds = Array.isArray(options.scope.artifacts)
        ? options.scope.artifacts
        : checkpoint.state.artifacts.map(a => a.id);

      for (const artifactId of artifactIds) {
        const artifact = checkpoint.state.artifacts.find(a => a.id === artifactId);
        if (artifact) {
          items.push({
            type: 'artifact',
            id: artifact.id,
            name: artifact.name,
            restoredVersion: artifact.version,
          });
        }
      }
    }

    // Rollback context
    if (options.scope.context) {
      items.push({
        type: 'context',
        id: 'context',
        name: 'Execution Context',
      });
    }

    return { items, errors };
  }

  /**
   * Verify rollback was successful
   */
  private async verifyRollback(
    checkpoint: Checkpoint,
    options: RollbackOptions
  ): Promise<boolean> {
    // In real implementation, verify state matches checkpoint
    return true;
  }

  /**
   * Simulate rollback for dry run
   */
  private simulateRollback(
    checkpoint: Checkpoint,
    options: RollbackOptions
  ): RolledBackItem[] {
    const items: RolledBackItem[] = [];

    if (options.scope.workflow) {
      items.push({
        type: 'state',
        id: 'workflow',
        name: 'Workflow State',
      });
    }

    if (options.scope.artifacts) {
      checkpoint.state.artifacts.forEach(a => {
        items.push({
          type: 'artifact',
          id: a.id,
          name: a.name,
          restoredVersion: a.version,
        });
      });
    }

    if (options.scope.context) {
      items.push({
        type: 'context',
        id: 'context',
        name: 'Execution Context',
      });
    }

    return items;
  }
}

/**
 * Create rollback manager
 */
export function createRollbackManager(
  checkpointManager: CheckpointManager,
  restorer?: StateRestorer
): RollbackManager {
  return new RollbackManager(checkpointManager, restorer);
}
```

### 3.6 Recovery Planner (`src/recovery/RecoveryPlanner.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import { ErrorContext } from '../errors/ErrorContext';
import { ErrorCategory } from '../errors/types/ErrorCategory';
import { ErrorCode } from '../errors/types/ErrorCode';
import { ErrorSeverity } from '../errors/types/ErrorSeverity';
import { 
  RecoveryPlan, 
  RecoveryAction, 
  RecoveryActionType,
  RecoveryExecutionResult,
  ExecutedAction 
} from './types/RecoveryPlan';
import { RollbackManager } from './RollbackManager';
import { RetryManager } from '../retry/RetryManager';

/**
 * Recovery planner creates and executes recovery plans
 */
export class RecoveryPlanner {
  private rollbackManager?: RollbackManager;
  private retryManager?: RetryManager;
  private customPlanners: Map<ErrorCode, (ctx: ErrorContext) => RecoveryPlan> = new Map();

  constructor(options?: {
    rollbackManager?: RollbackManager;
    retryManager?: RetryManager;
  }) {
    this.rollbackManager = options?.rollbackManager;
    this.retryManager = options?.retryManager;
  }

  /**
   * Create recovery plan for error
   */
  createPlan(errorContext: ErrorContext): RecoveryPlan {
    // Check for custom planner
    const customPlanner = this.customPlanners.get(errorContext.code);
    if (customPlanner) {
      return customPlanner(errorContext);
    }

    // Create plan based on error category
    return this.createPlanByCategory(errorContext);
  }

  /**
   * Create plan based on error category
   */
  private createPlanByCategory(errorContext: ErrorContext): RecoveryPlan {
    const planId = `rp-${uuid().substring(0, 8)}`;
    const actions: RecoveryAction[] = [];
    let requiresApproval = false;
    let confidence = 0.7;

    switch (errorContext.category) {
      case ErrorCategory.TRANSIENT:
        actions.push(
          this.createRetryAction(1),
          this.createRetryAction(2),
          this.createRetryAction(3),
          this.createEscalateAction(4)
        );
        confidence = 0.9;
        break;

      case ErrorCategory.VALIDATION:
        actions.push(
          this.createManualAction(1, 'Fix validation errors'),
          this.createRetryAction(2)
        );
        confidence = 0.8;
        break;

      case ErrorCategory.RESOURCE:
        actions.push(
          this.createManualAction(1, 'Free up resources'),
          this.createRetryAction(2),
          this.createEscalateAction(3)
        );
        confidence = 0.6;
        break;

      case ErrorCategory.LOGIC:
        actions.push(
          this.createRollbackAction(1),
          this.createManualAction(2, 'Investigate logic error'),
          this.createRetryAction(3)
        );
        requiresApproval = true;
        confidence = 0.5;
        break;

      case ErrorCategory.EXTERNAL:
        actions.push(
          this.createRetryAction(1),
          this.createRetryAction(2),
          this.createSkipAction(3, 'Skip external dependency'),
          this.createEscalateAction(4)
        );
        confidence = 0.7;
        break;

      case ErrorCategory.SECURITY:
        actions.push(
          this.createManualAction(1, 'Re-authenticate'),
          this.createRetryAction(2),
          this.createEscalateAction(3)
        );
        requiresApproval = true;
        confidence = 0.6;
        break;

      case ErrorCategory.CRITICAL:
        actions.push(
          this.createAbortAction(1),
          this.createRollbackAction(2),
          this.createEscalateAction(3)
        );
        requiresApproval = true;
        confidence = 0.3;
        break;

      default:
        actions.push(
          this.createRetryAction(1),
          this.createRollbackAction(2),
          this.createEscalateAction(3)
        );
        confidence = 0.5;
    }

    return {
      id: planId,
      name: `Recovery Plan for ${errorContext.code}`,
      description: `Auto-generated recovery plan for ${errorContext.category} error`,
      errorCode: errorContext.code,
      errorCategory: errorContext.category,
      actions,
      estimatedDuration: this.estimateDuration(actions),
      requiresApproval,
      createdAt: new Date(),
      confidence,
    };
  }

  /**
   * Create retry action
   */
  private createRetryAction(order: number): RecoveryAction {
    return {
      id: `action-retry-${order}`,
      type: 'retry',
      description: `Retry operation (attempt ${order})`,
      order,
      required: false,
      timeout: 30000,
    };
  }

  /**
   * Create rollback action
   */
  private createRollbackAction(order: number): RecoveryAction {
    return {
      id: `action-rollback-${order}`,
      type: 'rollback',
      description: 'Rollback to last checkpoint',
      order,
      required: false,
      timeout: 60000,
    };
  }

  /**
   * Create skip action
   */
  private createSkipAction(order: number, description: string): RecoveryAction {
    return {
      id: `action-skip-${order}`,
      type: 'skip',
      description,
      order,
      required: false,
    };
  }

  /**
   * Create manual action
   */
  private createManualAction(order: number, description: string): RecoveryAction {
    return {
      id: `action-manual-${order}`,
      type: 'manual',
      description,
      order,
      required: true,
    };
  }

  /**
   * Create escalate action
   */
  private createEscalateAction(order: number): RecoveryAction {
    return {
      id: `action-escalate-${order}`,
      type: 'escalate',
      description: 'Escalate to human operator',
      order,
      required: true,
    };
  }

  /**
   * Create abort action
   */
  private createAbortAction(order: number): RecoveryAction {
    return {
      id: `action-abort-${order}`,
      type: 'abort',
      description: 'Abort current operation',
      order,
      required: true,
    };
  }

  /**
   * Estimate plan duration
   */
  private estimateDuration(actions: RecoveryAction[]): number {
    return actions.reduce((total, action) => {
      return total + (action.timeout || 10000);
    }, 0);
  }

  /**
   * Execute recovery plan
   */
  async execute(
    plan: RecoveryPlan,
    operation?: () => Promise<unknown>
  ): Promise<RecoveryExecutionResult> {
    const startTime = Date.now();
    const executedActions: ExecutedAction[] = [];
    let finalState: 'recovered' | 'partial' | 'failed' | 'escalated' = 'failed';

    for (const action of plan.actions.sort((a, b) => a.order - b.order)) {
      const actionStart = Date.now();
      let success = false;
      let result: unknown;
      let error: string | undefined;

      try {
        switch (action.type) {
          case 'retry':
            if (operation && this.retryManager) {
              const retryResult = await this.retryManager.execute(operation);
              success = retryResult.success;
              result = retryResult.result;
              if (success) {
                finalState = 'recovered';
              }
            }
            break;

          case 'rollback':
            if (this.rollbackManager) {
              const rollbackResult = await this.rollbackManager.rollbackToLatest();
              success = rollbackResult.success;
              result = rollbackResult;
              if (success) {
                finalState = 'partial';
              }
            }
            break;

          case 'skip':
            success = true;
            finalState = 'partial';
            break;

          case 'manual':
            // Manual actions require external intervention
            success = false;
            error = 'Requires manual intervention';
            break;

          case 'escalate':
            // Escalation is always "successful" in that it completes
            success = true;
            finalState = 'escalated';
            break;

          case 'abort':
            success = true;
            finalState = 'failed';
            break;
        }

      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        success = false;
      }

      executedActions.push({
        actionId: action.id,
        type: action.type,
        success,
        result,
        error,
        duration: Date.now() - actionStart,
      });

      // Stop if we've recovered or if required action failed
      if (finalState === 'recovered') {
        break;
      }
      if (!success && action.required) {
        break;
      }
    }

    return {
      planId: plan.id,
      success: finalState === 'recovered',
      actionsExecuted: executedActions,
      finalState,
      duration: Date.now() - startTime,
      nextSteps: this.getNextSteps(finalState, plan),
    };
  }

  /**
   * Get next steps based on final state
   */
  private getNextSteps(
    finalState: 'recovered' | 'partial' | 'failed' | 'escalated',
    plan: RecoveryPlan
  ): string[] {
    switch (finalState) {
      case 'recovered':
        return ['Continue with workflow', 'Verify system state'];
      case 'partial':
        return ['Review partial recovery', 'Decide next action', 'May need manual intervention'];
      case 'failed':
        return ['Check error logs', 'Contact support', 'Consider manual recovery'];
      case 'escalated':
        return ['Wait for operator response', 'Check escalation queue', 'Provide additional context'];
      default:
        return [];
    }
  }

  /**
   * Register custom planner for error code
   */
  registerCustomPlanner(
    code: ErrorCode,
    planner: (ctx: ErrorContext) => RecoveryPlan
  ): void {
    this.customPlanners.set(code, planner);
  }
}

/**
 * Create recovery planner
 */
export function createRecoveryPlanner(options?: {
  rollbackManager?: RollbackManager;
  retryManager?: RetryManager;
}): RecoveryPlanner {
  return new RecoveryPlanner(options);
}
```

---

## 📊 Recovery Strategy Matrix

| Error Category | Primary Strategy | Fallback | Escalate |
|----------------|------------------|----------|----------|
| TRANSIENT | Retry (3x) | Skip | After retries |
| VALIDATION | Manual fix | - | If critical |
| RESOURCE | Wait + Retry | Manual | Yes |
| LOGIC | Rollback | Manual | Yes |
| EXTERNAL | Retry + Skip | Fallback | After retries |
| CRITICAL | Abort + Rollback | Manual | Immediate |

---

## 📋 Acceptance Criteria

- [ ] Checkpoints capture full state
- [ ] Checksum verification works
- [ ] Rollback restores correct state
- [ ] Backup is created before rollback
- [ ] Recovery plans are generated correctly
- [ ] Plan execution follows correct order
- [ ] Escalation is triggered appropriately

---

## 🔗 Navigation

← [02-PHASE-RETRY-CIRCUIT-BREAKER.md](02-PHASE-RETRY-CIRCUIT-BREAKER.md) | [04-PHASE-ESCALATION-SYSTEM.md](04-PHASE-ESCALATION-SYSTEM.md) →
