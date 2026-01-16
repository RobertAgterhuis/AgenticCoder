/**
 * LifecycleManager (EB-05)
 * Manages the complete execution lifecycle of agent invocations.
 * 
 * Phases:
 * 1. SETUP: Prepare execution context
 * 2. EXECUTING: Run agent via invoker
 * 3. COLLECTING: Gather output and artifacts
 * 4. CLEANUP: Clean up resources
 * 5. COMPLETE: Return execution result
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { TransportSelector } from './TransportSelector.js';
import { ExecutionContext, ExecutionContextBuilder } from './ExecutionContext.js';
import { AgentInvoker } from './AgentInvoker.js';
import { OutputCollector } from './OutputCollector.js';

const LIFECYCLE_PHASES = {
  SETUP: 'setup',
  EXECUTING: 'executing',
  COLLECTING: 'collecting',
  CLEANUP: 'cleanup',
  COMPLETE: 'complete'
};

const LIFECYCLE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUCCESS: 'success',
  FAILURE: 'failure',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled'
};

export class LifecycleManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Core components
    this.transportSelector = options.transportSelector || new TransportSelector();
    this.agentInvoker = options.agentInvoker || new AgentInvoker(options);
    this.outputCollector = options.outputCollector || new OutputCollector();
    
    // Execution tracking
    this.activeExecutions = new Map();
    
    // Configuration
    this.cleanupOnSuccess = options.cleanupOnSuccess ?? true;
    this.cleanupOnFailure = options.cleanupOnFailure ?? false;
    this.archiveLogs = options.archiveLogs ?? true;
    this.maxConcurrentExecutions = options.maxConcurrentExecutions || 10;
  }

  /**
   * Execute an agent with full lifecycle management
   * @param {string} agent - Agent name
   * @param {number} phase - Phase number
   * @param {object} inputs - Input data
   * @param {object} config - Configuration options
   * @returns {object} ExecutionResult
   */
  async execute(agent, phase, inputs, config = {}) {
    // Check concurrency limit
    if (this.activeExecutions.size >= this.maxConcurrentExecutions) {
      throw new Error(`Max concurrent executions reached (${this.maxConcurrentExecutions})`);
    }

    const state = this._createState();
    
    try {
      // ===== SETUP PHASE =====
      state.phase = LIFECYCLE_PHASES.SETUP;
      state.status = LIFECYCLE_STATUS.IN_PROGRESS;
      this.emit('lifecycle-phase', { phase: state.phase, status: state.status });

      const transport = await this.transportSelector.selectTransport(agent, config.transport || {});
      
      const context = new ExecutionContextBuilder()
        .forAgent(agent)
        .forPhase(phase)
        .withInputs(inputs)
        .withEnvironment(config.environment || {})
        .withLimits(config.limits || {})
        .withProjectRoot(config.projectRoot)
        .withMetadata(config.metadata || {})
        .withPreviousArtifacts(config.previousArtifacts || [])
        .withTransport(transport)
        .build();

      // Ensure directories exist
      await context.ensureDirectories();
      
      // Save context for debugging
      await context.save();

      // Track this execution
      this.activeExecutions.set(context.execution_id, { state, context, config });

      this.emit('setup-complete', {
        execution_id: context.execution_id,
        agent,
        phase,
        transport: transport.type
      });

      // ===== EXECUTION PHASE =====
      state.phase = LIFECYCLE_PHASES.EXECUTING;
      this.emit('lifecycle-phase', { 
        execution_id: context.execution_id,
        phase: state.phase, 
        status: state.status 
      });

      const invocationResult = await this.agentInvoker.invoke(transport, context);

      if (!invocationResult.ok) {
        state.status = invocationResult.error_type === 'INVOCATION_TIMEOUT' 
          ? LIFECYCLE_STATUS.TIMEOUT 
          : LIFECYCLE_STATUS.FAILURE;
        
        this.emit('execution-failed', {
          execution_id: context.execution_id,
          error: invocationResult.stderr || invocationResult.error,
          status: state.status
        });
      } else {
        state.status = LIFECYCLE_STATUS.SUCCESS;
      }

      // ===== COLLECTION PHASE =====
      state.phase = LIFECYCLE_PHASES.COLLECTING;
      this.emit('lifecycle-phase', { 
        execution_id: context.execution_id,
        phase: state.phase, 
        status: state.status 
      });

      const collectedOutput = await this.outputCollector.collect(invocationResult, context);

      // Validate artifact if present
      let validationWarning = null;
      if (collectedOutput.artifact && config.validateArtifact) {
        const validation = this.outputCollector.validateArtifact(
          collectedOutput.artifact,
          agent
        );
        if (!validation.valid) {
          validationWarning = validation.errors.join(', ');
          this.emit('artifact-validation-warning', {
            execution_id: context.execution_id,
            errors: validation.errors
          });
        }
      }

      // ===== CLEANUP PHASE =====
      state.phase = LIFECYCLE_PHASES.CLEANUP;
      this.emit('lifecycle-phase', { 
        execution_id: context.execution_id,
        phase: state.phase, 
        status: state.status 
      });

      await this._cleanup(context, state.status, config);

      // ===== COMPLETE =====
      state.phase = LIFECYCLE_PHASES.COMPLETE;
      state.end_time = Date.now();

      const result = {
        execution_id: context.execution_id,
        agent,
        phase,
        status: state.status,
        artifact: collectedOutput.artifact,
        artifact_path: collectedOutput.artifact_path,
        logs: collectedOutput.logs,
        metrics: {
          ...collectedOutput.metrics,
          total_duration_ms: state.end_time - state.start_time
        },
        validation_warning: validationWarning,
        error: state.status !== LIFECYCLE_STATUS.SUCCESS 
          ? (invocationResult.stderr || invocationResult.error) 
          : null
      };

      // Remove from active executions
      this.activeExecutions.delete(context.execution_id);

      this.emit('lifecycle-complete', result);

      return result;

    } catch (error) {
      state.status = LIFECYCLE_STATUS.FAILURE;
      state.end_time = Date.now();

      this.emit('lifecycle-error', {
        phase: state.phase,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Cancel an active execution
   */
  async cancel(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.state.status = LIFECYCLE_STATUS.CANCELLED;
    
    // TODO: Add actual process termination if needed
    
    this.activeExecutions.delete(executionId);
    
    this.emit('execution-cancelled', { execution_id: executionId });
    
    return true;
  }

  /**
   * Get status of an active execution
   */
  getExecutionStatus(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return null;
    }

    return {
      execution_id: executionId,
      phase: execution.state.phase,
      status: execution.state.status,
      start_time: execution.state.start_time,
      agent: execution.context.agent
    };
  }

  /**
   * Get all active execution IDs
   */
  getActiveExecutions() {
    return Array.from(this.activeExecutions.keys());
  }

  /**
   * Create initial lifecycle state
   */
  _createState() {
    return {
      phase: LIFECYCLE_PHASES.SETUP,
      status: LIFECYCLE_STATUS.PENDING,
      start_time: Date.now(),
      end_time: null
    };
  }

  /**
   * Cleanup after execution
   */
  async _cleanup(context, status, config) {
    const shouldCleanup = status === LIFECYCLE_STATUS.SUCCESS 
      ? (config.cleanupOnSuccess ?? this.cleanupOnSuccess)
      : (config.cleanupOnFailure ?? this.cleanupOnFailure);

    // Archive logs if configured
    if (this.archiveLogs && context.paths.log_dir) {
      try {
        await this._archiveLogs(context);
      } catch (error) {
        this.emit('cleanup-warning', {
          execution_id: context.execution_id,
          warning: `Failed to archive logs: ${error.message}`
        });
      }
    }

    // Clean temp directory
    if (shouldCleanup && context.paths.temp_dir) {
      try {
        await this._removeDirectory(context.paths.temp_dir);
      } catch (error) {
        this.emit('cleanup-warning', {
          execution_id: context.execution_id,
          warning: `Failed to clean temp directory: ${error.message}`
        });
      }
    }

    this.emit('cleanup-complete', {
      execution_id: context.execution_id,
      cleaned: shouldCleanup
    });
  }

  /**
   * Archive logs for long-term storage
   */
  async _archiveLogs(context) {
    const logDir = context.paths.log_dir;
    if (!fs.existsSync(logDir)) return;

    const archiveDir = path.join(
      context.paths.work_dir,
      'archive',
      context.execution_id
    );
    
    await fs.promises.mkdir(archiveDir, { recursive: true });
    
    // Copy log files to archive
    const files = await fs.promises.readdir(logDir);
    for (const file of files) {
      const src = path.join(logDir, file);
      const dest = path.join(archiveDir, file);
      await fs.promises.copyFile(src, dest);
    }
  }

  /**
   * Remove a directory recursively
   */
  async _removeDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
}

export { LIFECYCLE_PHASES, LIFECYCLE_STATUS };
