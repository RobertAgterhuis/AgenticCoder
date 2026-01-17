/**
 * ProjectStatePersistence - Main entry point
 * 
 * Unified API for all state management operations in AgenticCoder.
 * Provides a single StateManager that coordinates all sub-managers.
 */

// Core types
export {
  StorageBackend,
  StorageConfig,
  StorageResult,
  TechStack,
  ProjectSettings,
  ProjectConfig,
  PhaseStatus,
  PhaseState,
  Checkpoint,
  ExecutionState,
  ArtifactType,
  ArtifactMetadata,
  ArtifactRegistry,
  DecisionSeverity,
  DecisionStatus,
  DecisionRecord,
  DecisionLog,
  IStateStore,
  Migration,
  IMigrationManager,
  SCHEMA_VERSION,
  DEFAULT_CONFIG_DIR,
  DEFAULT_SETTINGS,
} from './types';

// Storage implementations
export { JSONStateStore } from './JSONStateStore';

// Managers
export { CheckpointManager, CheckpointManagerConfig, CreateCheckpointOptions, ResumeResult } from './CheckpointManager';
export { ProjectConfigManager, InitProjectOptions, ValidationResult } from './ProjectConfigManager';
export { ExecutionManager, StartExecutionOptions, PhaseUpdateOptions, PHASE_DEFINITIONS } from './ExecutionManager';
export { ArtifactManager, RegisterArtifactOptions, ArtifactQuery, ArtifactVersion } from './ArtifactManager';

// Main StateManager
export { StateManager, StateManagerConfig } from './StateManager';

// WorkflowEngine Integration
export {
  WorkflowStateIntegration,
  WorkflowEvent,
  WorkflowEngineAdapter,
  createWorkflowIntegration,
} from './WorkflowStateIntegration';
