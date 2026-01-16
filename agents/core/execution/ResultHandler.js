/**
 * ResultHandler (EB-06)
 * Processes execution results and updates orchestration state.
 * 
 * Features:
 * - Validates execution results
 * - Registers artifacts
 * - Triggers validation framework
 * - Updates orchestration status
 * - Determines next action (proceed, retry, block)
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const NEXT_ACTIONS = {
  PROCEED: 'proceed',
  RETRY: 'retry',
  BLOCK: 'block',
  MANUAL_REVIEW: 'manual_review'
};

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryableStatuses: ['failure', 'timeout'],
  backoffMs: 1000,
  backoffMultiplier: 2
};

export class ResultHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Artifact registry
    this.artifactRegistry = new Map();
    this.artifactIndexPath = options.artifactIndexPath || null;
    
    // Validation framework integration
    this.validationFramework = options.validationFramework || null;
    
    // Retry configuration
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };
    
    // Orchestration state path
    this.orchestrationStatePath = options.orchestrationStatePath || null;
  }

  /**
   * Handle an execution result
   * @param {object} executionResult - Result from LifecycleManager
   * @param {object} orchestrationState - Current orchestration state
   * @param {object} config - Configuration options
   * @returns {object} ResultHandling with next action
   */
  async handle(executionResult, orchestrationState = {}, config = {}) {
    const handling = {
      execution_id: executionResult.execution_id,
      agent: executionResult.agent,
      phase: executionResult.phase,
      status: executionResult.status,
      artifact_id: null,
      validation_result: null,
      next_action: NEXT_ACTIONS.PROCEED,
      retry_info: null
    };

    try {
      // Step 1: Validate result structure
      const resultValidation = this._validateExecutionResult(executionResult);
      if (!resultValidation.valid) {
        handling.status = 'failure';
        handling.next_action = NEXT_ACTIONS.RETRY;
        handling.error = resultValidation.errors.join(', ');
        
        this.emit('result-validation-failed', {
          execution_id: executionResult.execution_id,
          errors: resultValidation.errors
        });
        
        return handling;
      }

      // Step 2: Handle different statuses
      if (executionResult.status === 'failure' || executionResult.status === 'timeout') {
        return this._handleFailure(executionResult, orchestrationState, handling, config);
      }

      // Step 3: Register artifact (success case)
      if (executionResult.artifact && executionResult.artifact_path) {
        try {
          handling.artifact_id = await this._registerArtifact(
            executionResult.artifact,
            executionResult.artifact_path,
            executionResult.agent,
            executionResult.phase
          );
          
          this.emit('artifact-registered', {
            artifact_id: handling.artifact_id,
            agent: executionResult.agent,
            phase: executionResult.phase
          });
          
        } catch (error) {
          this.emit('artifact-registration-failed', {
            execution_id: executionResult.execution_id,
            error: error.message
          });
          
          handling.next_action = NEXT_ACTIONS.RETRY;
          handling.error = `Artifact registration failed: ${error.message}`;
          return handling;
        }
      }

      // Step 4: Trigger validation (if enabled)
      if (config.validation?.enabled && executionResult.artifact) {
        try {
          handling.validation_result = await this._triggerValidation(
            executionResult.artifact,
            executionResult.agent,
            config
          );
          
          if (!handling.validation_result.passed) {
            this.emit('validation-failed', {
              execution_id: executionResult.execution_id,
              result: handling.validation_result
            });
            
            if (handling.validation_result.decision === 'REJECTED') {
              handling.next_action = NEXT_ACTIONS.BLOCK;
            } else if (handling.validation_result.decision === 'REQUIRES_REVIEW') {
              handling.next_action = NEXT_ACTIONS.MANUAL_REVIEW;
            } else {
              handling.next_action = NEXT_ACTIONS.RETRY;
            }
            
            return handling;
          }
        } catch (error) {
          this.emit('validation-error', {
            execution_id: executionResult.execution_id,
            error: error.message
          });
          
          // Don't fail on validation errors, just warn
          handling.validation_result = { 
            passed: true, 
            warning: `Validation failed: ${error.message}` 
          };
        }
      }

      // Step 5: Update orchestration state
      if (this.orchestrationStatePath) {
        await this._updateOrchestrationState(
          orchestrationState,
          executionResult,
          handling
        );
      }

      // Step 6: Report success
      this.emit('result-handled', {
        execution_id: executionResult.execution_id,
        status: 'success',
        next_action: handling.next_action,
        artifact_id: handling.artifact_id
      });

      return handling;

    } catch (error) {
      this.emit('handling-error', {
        execution_id: executionResult.execution_id,
        error: error.message
      });
      
      handling.status = 'failure';
      handling.next_action = NEXT_ACTIONS.BLOCK;
      handling.error = error.message;
      
      return handling;
    }
  }

  /**
   * Handle failure/timeout status
   */
  _handleFailure(executionResult, orchestrationState, handling, config) {
    const attemptCount = orchestrationState.attempt_count || 0;
    const maxRetries = config.maxRetries ?? this.retryConfig.maxRetries;
    const retryableStatuses = config.retryableStatuses ?? this.retryConfig.retryableStatuses;

    handling.error = executionResult.error || executionResult.stderr;

    if (retryableStatuses.includes(executionResult.status) && attemptCount < maxRetries) {
      handling.next_action = NEXT_ACTIONS.RETRY;
      handling.retry_info = {
        attempt: attemptCount + 1,
        max_attempts: maxRetries,
        delay_ms: this._calculateRetryDelay(attemptCount)
      };
      
      this.emit('retry-scheduled', {
        execution_id: executionResult.execution_id,
        retry_info: handling.retry_info
      });
      
    } else {
      handling.next_action = NEXT_ACTIONS.BLOCK;
      
      this.emit('execution-blocked', {
        execution_id: executionResult.execution_id,
        reason: attemptCount >= maxRetries 
          ? 'Max retries exceeded' 
          : `Status ${executionResult.status} is not retryable`,
        attempts: attemptCount
      });
    }

    return handling;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  _calculateRetryDelay(attemptCount) {
    const baseDelay = this.retryConfig.backoffMs;
    const multiplier = this.retryConfig.backoffMultiplier;
    return baseDelay * Math.pow(multiplier, attemptCount);
  }

  /**
   * Validate execution result structure
   */
  _validateExecutionResult(result) {
    const errors = [];

    if (!result.execution_id) {
      errors.push('Missing execution_id');
    }

    if (!result.agent) {
      errors.push('Missing agent name');
    }

    if (!result.status) {
      errors.push('Missing status');
    } else if (!['success', 'failure', 'timeout'].includes(result.status)) {
      errors.push(`Invalid status: ${result.status}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Register artifact in the registry
   */
  async _registerArtifact(artifact, artifactPath, agent, phase) {
    const artifactId = `art-${Date.now().toString(36)}-${randomUUID().split('-')[0]}`;
    
    const record = {
      id: artifactId,
      agent,
      phase,
      path: artifactPath,
      created_at: new Date().toISOString(),
      size_bytes: artifact ? JSON.stringify(artifact).length : 0,
      checksum: null, // Could add MD5/SHA256
      metadata: {
        type: this._inferArtifactType(artifact),
        keys: artifact ? Object.keys(artifact) : []
      }
    };

    // Store in memory
    this.artifactRegistry.set(artifactId, record);

    // Persist to index file if configured
    if (this.artifactIndexPath) {
      await this._persistArtifactIndex();
    }

    return artifactId;
  }

  /**
   * Infer artifact type from content
   */
  _inferArtifactType(artifact) {
    if (!artifact) return 'unknown';
    
    if (artifact.type) return artifact.type;
    
    // Infer from common patterns
    if (artifact.code || artifact.source) return 'code';
    if (artifact.tests || artifact.testCases) return 'tests';
    if (artifact.schema || artifact.definition) return 'schema';
    if (artifact.plan || artifact.tasks) return 'plan';
    if (artifact.analysis || artifact.report) return 'analysis';
    if (artifact.bicep || artifact.template) return 'infrastructure';
    
    return 'data';
  }

  /**
   * Persist artifact index to disk
   */
  async _persistArtifactIndex() {
    if (!this.artifactIndexPath) return;

    const index = Array.from(this.artifactRegistry.values());
    await fs.promises.mkdir(path.dirname(this.artifactIndexPath), { recursive: true });
    await fs.promises.writeFile(
      this.artifactIndexPath,
      JSON.stringify(index, null, 2),
      'utf8'
    );
  }

  /**
   * Load artifact index from disk
   */
  async loadArtifactIndex() {
    if (!this.artifactIndexPath || !fs.existsSync(this.artifactIndexPath)) {
      return;
    }

    const content = await fs.promises.readFile(this.artifactIndexPath, 'utf8');
    const index = JSON.parse(content);
    
    for (const record of index) {
      this.artifactRegistry.set(record.id, record);
    }
  }

  /**
   * Get artifact by ID
   */
  getArtifact(artifactId) {
    return this.artifactRegistry.get(artifactId);
  }

  /**
   * Get artifacts by agent and/or phase
   */
  findArtifacts(filters = {}) {
    const results = [];
    
    for (const record of this.artifactRegistry.values()) {
      let matches = true;
      
      if (filters.agent && record.agent !== filters.agent) {
        matches = false;
      }
      if (filters.phase !== undefined && record.phase !== filters.phase) {
        matches = false;
      }
      if (filters.type && record.metadata?.type !== filters.type) {
        matches = false;
      }
      
      if (matches) {
        results.push(record);
      }
    }
    
    return results;
  }

  /**
   * Trigger validation framework
   */
  async _triggerValidation(artifact, agent, config) {
    if (!this.validationFramework) {
      // No validation framework configured
      return { passed: true };
    }

    // Call validation framework
    const result = await this.validationFramework.validate(artifact, {
      agent,
      validateSyntax: config.validation?.validateSyntax ?? true,
      validateDependencies: config.validation?.validateDependencies ?? true,
      runTests: config.validation?.runTests ?? false,
      useGateManager: config.validation?.useGateManager ?? true
    });

    return {
      passed: result.gateManagerResult?.decision === 'APPROVED' || result.passed !== false,
      decision: result.gateManagerResult?.decision || 'APPROVED',
      score: result.gateManagerResult?.score,
      errors: result.gateManagerResult?.errors || [],
      warnings: result.gateManagerResult?.warnings || []
    };
  }

  /**
   * Update orchestration state
   */
  async _updateOrchestrationState(currentState, executionResult, handling) {
    const updatedState = {
      ...currentState,
      last_execution_id: executionResult.execution_id,
      last_status: handling.status,
      last_updated: new Date().toISOString()
    };

    if (handling.next_action === NEXT_ACTIONS.PROCEED) {
      updatedState.current_phase = (currentState.current_phase || 0) + 1;
      updatedState.attempt_count = 0;
    } else if (handling.next_action === NEXT_ACTIONS.RETRY) {
      updatedState.attempt_count = (currentState.attempt_count || 0) + 1;
    } else if (handling.next_action === NEXT_ACTIONS.BLOCK) {
      updatedState.blocked = true;
      updatedState.blocked_reason = handling.error;
    }

    if (handling.artifact_id) {
      updatedState.artifacts = updatedState.artifacts || [];
      updatedState.artifacts.push(handling.artifact_id);
    }

    // Persist to file
    if (this.orchestrationStatePath) {
      await fs.promises.writeFile(
        this.orchestrationStatePath,
        JSON.stringify(updatedState, null, 2),
        'utf8'
      );
    }

    return updatedState;
  }

  /**
   * Set validation framework reference
   */
  setValidationFramework(validationFramework) {
    this.validationFramework = validationFramework;
  }
}

export { NEXT_ACTIONS };
