/**
 * ProjectStatePersistence - Type Definitions
 * 
 * Core types for state management in AgenticCoder.
 * Provides persistent storage for project configuration, execution state,
 * artifacts, and decision history.
 */

// =============================================================================
// Storage Types
// =============================================================================

/**
 * Supported storage backends
 */
export type StorageBackend = 'json' | 'sqlite' | 'memory';

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Storage backend type */
  backend: StorageBackend;
  /** Base directory for file-based storage */
  baseDir: string;
  /** SQLite database path (for sqlite backend) */
  dbPath?: string;
  /** Enable auto-save */
  autoSave?: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveIntervalMs?: number;
  /** Enable compression for large states */
  compression?: boolean;
}

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// =============================================================================
// Project Configuration
// =============================================================================

/**
 * Technology stack configuration
 */
export interface TechStack {
  frontend?: {
    framework: 'react' | 'vue' | 'angular' | 'svelte' | 'none';
    language: 'typescript' | 'javascript';
    styling?: 'tailwind' | 'css-modules' | 'styled-components' | 'scss';
    stateManagement?: 'redux' | 'zustand' | 'pinia' | 'none';
  };
  backend?: {
    framework: 'express' | 'fastify' | 'nestjs' | 'dotnet' | 'python' | 'go';
    language: 'typescript' | 'javascript' | 'csharp' | 'python' | 'go';
    api?: 'rest' | 'graphql' | 'grpc';
  };
  database?: {
    type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'none';
    orm?: 'prisma' | 'typeorm' | 'drizzle' | 'mongoose' | 'none';
  };
  cloud?: {
    provider: 'azure' | 'aws' | 'gcp' | 'none';
    iac?: 'bicep' | 'terraform' | 'pulumi' | 'none';
  };
  cicd?: {
    platform: 'github-actions' | 'azure-devops' | 'gitlab-ci' | 'none';
  };
}

/**
 * Project settings
 */
export interface ProjectSettings {
  /** Enable verbose logging */
  verbose?: boolean;
  /** Maximum LLM tokens per request */
  maxTokens?: number;
  /** Temperature for LLM responses */
  temperature?: number;
  /** Enable human approval for critical decisions */
  requireApproval?: boolean;
  /** Phases that require human approval */
  approvalPhases?: number[];
  /** Output directory for generated code */
  outputDir?: string;
  /** Enable dry-run mode (no file writes) */
  dryRun?: boolean;
}

/**
 * Project configuration stored in .agenticcoder/config.json
 */
export interface ProjectConfig {
  /** Schema version for migrations */
  schemaVersion: string;
  /** Project name */
  projectName: string;
  /** Project description */
  description?: string;
  /** Scenario ID (e.g., S01, A03) */
  scenario: string;
  /** Technology stack */
  techStack: TechStack;
  /** Project settings */
  settings: ProjectSettings;
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Execution State
// =============================================================================

/**
 * Phase execution status
 */
export type PhaseStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';

/**
 * Individual phase state
 */
export interface PhaseState {
  /** Phase number (1-16) */
  phase: number;
  /** Phase name */
  name: string;
  /** Current status */
  status: PhaseStatus;
  /** Start timestamp */
  startedAt?: string;
  /** Completion timestamp */
  completedAt?: string;
  /** Agent that executed this phase */
  agent?: string;
  /** Phase output/result */
  output?: unknown;
  /** Error if failed */
  error?: string;
  /** Retry count */
  retryCount: number;
}

/**
 * Checkpoint data for resume capability
 */
export interface Checkpoint {
  /** Checkpoint ID */
  id: string;
  /** Execution ID this checkpoint belongs to */
  executionId: string;
  /** Phase number at checkpoint */
  phase: number;
  /** Checkpoint timestamp */
  timestamp: string;
  /** State snapshot at checkpoint */
  state: Record<string, unknown>;
  /** Message bus state */
  messageQueue?: unknown[];
  /** Reason for checkpoint */
  reason: 'auto' | 'manual' | 'phase-complete' | 'error';
}

/**
 * Full execution state
 */
export interface ExecutionState {
  /** Unique execution ID */
  executionId: string;
  /** Project name */
  projectName: string;
  /** Scenario being executed */
  scenario: string;
  /** Execution status */
  status: 'initializing' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  /** Current phase (1-16) */
  currentPhase: number;
  /** All phase states */
  phases: PhaseState[];
  /** Latest checkpoint ID */
  latestCheckpointId?: string;
  /** Start timestamp */
  startedAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Completion timestamp */
  completedAt?: string;
  /** Total execution time in ms */
  totalDurationMs?: number;
  /** Error if failed */
  error?: string;
  /** Custom execution data */
  data?: Record<string, unknown>;
}

// =============================================================================
// Artifact Registry
// =============================================================================

/**
 * Artifact type
 */
export type ArtifactType = 
  | 'source-code'
  | 'config'
  | 'documentation'
  | 'infrastructure'
  | 'test'
  | 'asset'
  | 'other';

/**
 * Single artifact metadata
 */
export interface ArtifactMetadata {
  /** Unique artifact ID */
  id: string;
  /** Artifact name */
  name: string;
  /** Artifact type */
  type: ArtifactType;
  /** File path relative to project root */
  path: string;
  /** Version number */
  version: number;
  /** Content hash (SHA-256) */
  hash: string;
  /** File size in bytes */
  size: number;
  /** Phase that generated this artifact */
  generatedByPhase: number;
  /** Agent that generated this artifact */
  generatedByAgent: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** Previous version ID (for versioning chain) */
  previousVersionId?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Artifact registry containing all tracked artifacts
 */
export interface ArtifactRegistry {
  /** Schema version */
  schemaVersion: string;
  /** Project name */
  projectName: string;
  /** All artifacts indexed by ID */
  artifacts: Record<string, ArtifactMetadata>;
  /** Artifact count by type */
  countByType: Record<ArtifactType, number>;
  /** Last update timestamp */
  updatedAt: string;
}

// =============================================================================
// Decision Log
// =============================================================================

/**
 * Decision severity/importance
 */
export type DecisionSeverity = 'info' | 'warning' | 'critical';

/**
 * Decision status
 */
export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'auto-approved';

/**
 * Single decision record
 */
export interface DecisionRecord {
  /** Unique decision ID */
  id: string;
  /** Execution ID */
  executionId: string;
  /** Phase number */
  phase: number;
  /** Agent that made the decision */
  agent: string;
  /** Decision category */
  category: string;
  /** Decision description */
  description: string;
  /** Decision severity */
  severity: DecisionSeverity;
  /** Options considered */
  options?: string[];
  /** Selected option */
  selected?: string;
  /** Reasoning/rationale */
  reasoning?: string;
  /** Approval status */
  status: DecisionStatus;
  /** Who approved (if applicable) */
  approvedBy?: string;
  /** Timestamp */
  timestamp: string;
  /** Custom data */
  data?: Record<string, unknown>;
}

/**
 * Decision log
 */
export interface DecisionLog {
  /** Schema version */
  schemaVersion: string;
  /** Execution ID */
  executionId: string;
  /** All decisions */
  decisions: DecisionRecord[];
  /** Pending approvals count */
  pendingApprovals: number;
  /** Last update */
  updatedAt: string;
}

// =============================================================================
// Storage Interface
// =============================================================================

/**
 * Abstract storage interface implemented by all backends
 */
export interface IStateStore {
  /** Initialize the store */
  initialize(): Promise<void>;
  
  /** Check if store is initialized */
  isInitialized(): boolean;
  
  // Project Config
  getProjectConfig(): Promise<ProjectConfig | null>;
  saveProjectConfig(config: ProjectConfig): Promise<void>;
  
  // Execution State
  getExecutionState(executionId: string): Promise<ExecutionState | null>;
  saveExecutionState(state: ExecutionState): Promise<void>;
  getCurrentExecution(): Promise<ExecutionState | null>;
  listExecutions(limit?: number): Promise<ExecutionState[]>;
  
  // Checkpoints
  saveCheckpoint(checkpoint: Checkpoint): Promise<void>;
  getCheckpoint(checkpointId: string): Promise<Checkpoint | null>;
  getLatestCheckpoint(executionId: string): Promise<Checkpoint | null>;
  listCheckpoints(executionId: string): Promise<Checkpoint[]>;
  
  // Artifacts
  getArtifactRegistry(): Promise<ArtifactRegistry | null>;
  saveArtifact(artifact: ArtifactMetadata): Promise<void>;
  getArtifact(artifactId: string): Promise<ArtifactMetadata | null>;
  listArtifacts(filter?: { type?: ArtifactType; phase?: number }): Promise<ArtifactMetadata[]>;
  
  // Decisions
  saveDecision(decision: DecisionRecord): Promise<void>;
  getDecisionLog(executionId: string): Promise<DecisionLog | null>;
  getPendingApprovals(executionId: string): Promise<DecisionRecord[]>;
  updateDecisionStatus(decisionId: string, status: DecisionStatus, approvedBy?: string): Promise<void>;
  
  // Cleanup
  cleanup(olderThanDays?: number): Promise<number>;
  
  // Export/Import
  exportState(): Promise<string>;
  importState(data: string): Promise<void>;
}

// =============================================================================
// Schema Migration
// =============================================================================

/**
 * Migration definition
 */
export interface Migration {
  /** Version this migration upgrades to */
  version: string;
  /** Migration description */
  description: string;
  /** Migration function */
  migrate: (data: unknown) => unknown;
}

/**
 * Migration manager interface
 */
export interface IMigrationManager {
  /** Get current schema version */
  getCurrentVersion(): string;
  /** Check if migration is needed */
  needsMigration(dataVersion: string): boolean;
  /** Run migrations */
  migrate(data: unknown, fromVersion: string): unknown;
}

// =============================================================================
// Constants
// =============================================================================

export const SCHEMA_VERSION = '1.0.0';

export const DEFAULT_CONFIG_DIR = '.agenticcoder';
export const CONFIG_FILE = 'config.json';
export const STATE_DIR = 'state';
export const CURRENT_STATE_FILE = 'current.json';
export const HISTORY_DIR = 'history';
export const ARTIFACTS_DIR = 'artifacts';
export const ARTIFACTS_REGISTRY_FILE = 'registry.json';
export const DECISIONS_DIR = 'decisions';
export const DECISION_LOG_FILE = 'decision-log.json';
export const CACHE_DIR = 'cache';

export const DEFAULT_SETTINGS: ProjectSettings = {
  verbose: false,
  maxTokens: 4096,
  temperature: 0.7,
  requireApproval: false,
  approvalPhases: [],
  outputDir: './output',
  dryRun: false,
};
