/**
 * ResultAggregator (FL-03)
 * 
 * Consolidate all execution outputs into a unified result package.
 * Collects outputs from all pipeline stages and creates deduplicated results.
 * 
 * Responsibilities:
 * - Gather results from all systems
 * - Deduplicate artifacts
 * - Organize outputs hierarchically
 * - Generate consolidated reports
 * - Maintain lineage tracking
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// Result status types
export const RESULT_STATUS = {
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  PARTIAL: 'partial'
};

// Artifact types
export const ARTIFACT_TYPES = {
  BICEP_TEMPLATE: 'bicep_template',
  ARM_TEMPLATE: 'arm_template',
  CODE_FILE: 'code_file',
  CONFIG_FILE: 'config_file',
  LOG_FILE: 'log_file',
  REPORT: 'report',
  VALIDATION_RESULT: 'validation_result',
  TEST_RESULT: 'test_result',
  DEPLOYMENT_OUTPUT: 'deployment_output'
};

export class ResultAggregator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.results = new Map();           // execution_id -> ExecutionResult
    this.artifacts = new Map();         // artifact_id -> Artifact
    this.lineage = new Map();           // execution_id -> ExecutionLineage
    this.deduplicationEnabled = options.deduplicationEnabled !== false;
    this.checksumAlgorithm = options.checksumAlgorithm || 'sha256';
  }

  /**
   * Initialize result aggregation for an execution
   */
  initializeResult(executionId, planId) {
    const result = {
      execution_id: executionId,
      plan_id: planId,
      execution_timestamp: new Date().toISOString(),
      
      success: false,
      overall_status: RESULT_STATUS.PARTIAL,
      
      stage_results: {
        task_extraction: this._createTaskExtractionResult(),
        orchestration: this._createOrchestrationResult(),
        execution_bridge: this._createExecutionBridgeResult(),
        validation: this._createValidationResult(),
        bicep_resolver: this._createBicepResolverResult()
      },
      
      consolidated: {
        artifacts: [],
        errors: [],
        warnings: [],
        summary: {
          total_tasks: 0,
          completed_tasks: 0,
          failed_tasks: 0,
          total_duration_ms: 0,
          total_cost: 0
        }
      },
      
      lineage: this._createLineage(executionId)
    };
    
    this.results.set(executionId, result);
    this.lineage.set(executionId, result.lineage);
    
    this.emit('result-initialized', { execution_id: executionId });
    return result;
  }

  /**
   * Add task extraction results
   */
  addTaskExtractionResult(executionId, taskResult) {
    const result = this.results.get(executionId);
    if (!result) throw new Error(`Result not found: ${executionId}`);

    result.stage_results.task_extraction = {
      success: taskResult.success,
      tasks_extracted: taskResult.tasks_extracted || 0,
      tasks_by_phase: taskResult.tasks_by_phase || {},
      dependencies_resolved: taskResult.dependencies_resolved || 0,
      circular_dependencies: taskResult.circular_dependencies || 0,
      extraction_time_ms: taskResult.extraction_time_ms || 0,
      output_files: taskResult.output_files || []
    };

    // Update consolidated summary
    result.consolidated.summary.total_tasks = taskResult.tasks_extracted || 0;

    // Add any errors
    if (taskResult.errors) {
      this._addErrors(result, taskResult.errors, 'task_extraction');
    }

    this._updateLineage(executionId, 'task_extraction', taskResult);
    this.emit('task-extraction-result', { execution_id: executionId, result: taskResult });
  }

  /**
   * Add orchestration results
   */
  addOrchestrationResult(executionId, orchResult) {
    const result = this.results.get(executionId);
    if (!result) throw new Error(`Result not found: ${executionId}`);

    result.stage_results.orchestration = {
      success: orchResult.success,
      phases: orchResult.phases || {},
      total_orchestration_time_ms: orchResult.total_orchestration_time_ms || 0,
      state_transitions: orchResult.state_transitions || 0,
      output_files: orchResult.output_files || []
    };

    // Add any errors
    if (orchResult.errors) {
      this._addErrors(result, orchResult.errors, 'orchestration');
    }

    this._updateLineage(executionId, 'orchestration', orchResult);
    this.emit('orchestration-result', { execution_id: executionId, result: orchResult });
  }

  /**
   * Add execution bridge results
   */
  addExecutionBridgeResult(executionId, ebResult) {
    const result = this.results.get(executionId);
    if (!result) throw new Error(`Result not found: ${executionId}`);

    result.stage_results.execution_bridge = {
      success: ebResult.success,
      total_executions: ebResult.total_executions || 0,
      successful_executions: ebResult.successful_executions || 0,
      failed_executions: ebResult.failed_executions || 0,
      by_transport: ebResult.by_transport || {},
      resource_outputs: ebResult.resource_outputs || [],
      total_execution_time_ms: ebResult.total_execution_time_ms || 0,
      output_files: ebResult.output_files || []
    };

    // Update consolidated summary
    result.consolidated.summary.completed_tasks = ebResult.successful_executions || 0;
    result.consolidated.summary.failed_tasks = ebResult.failed_executions || 0;
    result.consolidated.summary.total_duration_ms = ebResult.total_execution_time_ms || 0;

    // Add any errors
    if (ebResult.errors) {
      this._addErrors(result, ebResult.errors, 'execution_bridge');
    }

    this._updateLineage(executionId, 'execution_bridge', ebResult);
    this.emit('execution-bridge-result', { execution_id: executionId, result: ebResult });
  }

  /**
   * Add validation results
   */
  addValidationResult(executionId, valResult) {
    const result = this.results.get(executionId);
    if (!result) throw new Error(`Result not found: ${executionId}`);

    result.stage_results.validation = {
      success: valResult.success,
      validations_run: valResult.validations_run || 0,
      validations_passed: valResult.validations_passed || 0,
      validations_failed: valResult.validations_failed || 0,
      quality_score: valResult.quality_score || 0,
      gate_results: valResult.gate_results || {},
      issues: valResult.issues || [],
      output_files: valResult.output_files || []
    };

    // Add issues as errors/warnings
    if (valResult.issues) {
      for (const issue of valResult.issues) {
        if (issue.severity === 'error') {
          result.consolidated.errors.push({
            stage: 'validation',
            gate: issue.gate,
            message: issue.message,
            timestamp: new Date().toISOString()
          });
        } else if (issue.severity === 'warning') {
          result.consolidated.warnings.push({
            stage: 'validation',
            gate: issue.gate,
            message: issue.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    this._updateLineage(executionId, 'validation', valResult);
    this.emit('validation-result', { execution_id: executionId, result: valResult });
  }

  /**
   * Add Bicep resolver results
   */
  addBicepResolverResult(executionId, bicepResult) {
    const result = this.results.get(executionId);
    if (!result) throw new Error(`Result not found: ${executionId}`);

    result.stage_results.bicep_resolver = {
      success: bicepResult.success,
      resources_resolved: bicepResult.resources_resolved || 0,
      modules_matched: bicepResult.modules_matched || 0,
      avm_modules_used: bicepResult.avm_modules_used || [],
      template_generated: bicepResult.template_generated || false,
      template_path: bicepResult.template_path || null,
      validation_passed: bicepResult.validation_passed || false,
      output_files: bicepResult.output_files || []
    };

    // Add any errors
    if (bicepResult.errors) {
      this._addErrors(result, bicepResult.errors, 'bicep_resolver');
    }

    this._updateLineage(executionId, 'bicep_resolver', bicepResult);
    this.emit('bicep-resolver-result', { execution_id: executionId, result: bicepResult });
  }

  /**
   * Add an artifact to the result
   */
  addArtifact(executionId, artifact) {
    const result = this.results.get(executionId);
    if (!result) throw new Error(`Result not found: ${executionId}`);

    // Calculate checksum for deduplication
    const checksum = this._calculateChecksum(artifact.content || JSON.stringify(artifact.data || {}));
    
    // Check for duplicates
    if (this.deduplicationEnabled) {
      const existing = this._findArtifactByChecksum(executionId, checksum);
      if (existing) {
        this.emit('artifact-deduplicated', { 
          execution_id: executionId, 
          existing_id: existing.artifact_id,
          new_artifact: artifact 
        });
        return existing;
      }
    }

    const artifactRecord = {
      artifact_id: `${executionId}_${artifact.type || 'unknown'}_${Date.now()}`,
      execution_id: executionId,
      type: artifact.type || ARTIFACT_TYPES.CODE_FILE,
      name: artifact.name,
      path: artifact.path,
      content: artifact.content,
      data: artifact.data,
      checksum,
      size_bytes: artifact.content ? artifact.content.length : 0,
      created_at: new Date().toISOString(),
      metadata: artifact.metadata || {},
      lineage: {
        stage: artifact.stage,
        task_id: artifact.task_id,
        produced_by: artifact.produced_by
      }
    };

    this.artifacts.set(artifactRecord.artifact_id, artifactRecord);
    result.consolidated.artifacts.push(artifactRecord);

    // Update lineage
    this._addArtifactToLineage(executionId, artifactRecord);

    this.emit('artifact-added', { execution_id: executionId, artifact: artifactRecord });
    return artifactRecord;
  }

  /**
   * Finalize and consolidate the result
   */
  finalizeResult(executionId) {
    const result = this.results.get(executionId);
    if (!result) throw new Error(`Result not found: ${executionId}`);

    // Determine overall success
    const stageResults = Object.values(result.stage_results);
    const allSucceeded = stageResults.every(s => s.success);
    const anySucceeded = stageResults.some(s => s.success);

    result.success = allSucceeded;
    result.overall_status = allSucceeded 
      ? RESULT_STATUS.SUCCEEDED 
      : (anySucceeded ? RESULT_STATUS.PARTIAL : RESULT_STATUS.FAILED);

    // Calculate final cost estimate if available
    result.consolidated.summary.total_cost = this._calculateTotalCost(result);

    // Finalize lineage
    this._finalizeLineage(executionId);

    result.finalized_at = new Date().toISOString();

    this.emit('result-finalized', result);
    return result;
  }

  /**
   * Get the result for an execution
   */
  getResult(executionId) {
    return this.results.get(executionId) || null;
  }

  /**
   * Get artifacts for an execution
   */
  getArtifacts(executionId, type = null) {
    let artifacts = Array.from(this.artifacts.values())
      .filter(a => a.execution_id === executionId);
    
    if (type) {
      artifacts = artifacts.filter(a => a.type === type);
    }
    
    return artifacts;
  }

  /**
   * Get artifact by ID
   */
  getArtifactById(artifactId) {
    return this.artifacts.get(artifactId) || null;
  }

  /**
   * Get lineage for an execution
   */
  getLineage(executionId) {
    return this.lineage.get(executionId) || null;
  }

  /**
   * Generate a consolidated report
   */
  generateReport(executionId) {
    const result = this.results.get(executionId);
    if (!result) return null;

    return {
      report_id: `report_${executionId}_${Date.now()}`,
      generated_at: new Date().toISOString(),
      execution_id: executionId,
      plan_id: result.plan_id,
      
      summary: {
        overall_status: result.overall_status,
        success: result.success,
        ...result.consolidated.summary
      },
      
      stages: {
        task_extraction: {
          success: result.stage_results.task_extraction.success,
          tasks_extracted: result.stage_results.task_extraction.tasks_extracted,
          time_ms: result.stage_results.task_extraction.extraction_time_ms
        },
        orchestration: {
          success: result.stage_results.orchestration.success,
          phases: Object.keys(result.stage_results.orchestration.phases || {}).length,
          time_ms: result.stage_results.orchestration.total_orchestration_time_ms
        },
        execution_bridge: {
          success: result.stage_results.execution_bridge.success,
          total_executions: result.stage_results.execution_bridge.total_executions,
          success_rate: result.stage_results.execution_bridge.total_executions > 0
            ? (result.stage_results.execution_bridge.successful_executions / 
               result.stage_results.execution_bridge.total_executions * 100).toFixed(1) + '%'
            : 'N/A'
        },
        validation: {
          success: result.stage_results.validation.success,
          quality_score: result.stage_results.validation.quality_score,
          issues_count: result.stage_results.validation.issues?.length || 0
        },
        bicep_resolver: {
          success: result.stage_results.bicep_resolver.success,
          resources_resolved: result.stage_results.bicep_resolver.resources_resolved,
          template_generated: result.stage_results.bicep_resolver.template_generated
        }
      },
      
      artifacts: result.consolidated.artifacts.map(a => ({
        id: a.artifact_id,
        type: a.type,
        name: a.name,
        path: a.path,
        size_bytes: a.size_bytes
      })),
      
      errors: result.consolidated.errors,
      warnings: result.consolidated.warnings,
      
      lineage: result.lineage
    };
  }

  /**
   * Merge results from multiple executions
   */
  mergeResults(executionIds) {
    const merged = {
      merged_id: `merged_${Date.now()}`,
      source_executions: executionIds,
      merged_at: new Date().toISOString(),
      
      artifacts: [],
      errors: [],
      warnings: [],
      
      summary: {
        total_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        total_duration_ms: 0,
        total_cost: 0
      }
    };

    for (const executionId of executionIds) {
      const result = this.results.get(executionId);
      if (!result) continue;

      // Merge artifacts (with deduplication)
      for (const artifact of result.consolidated.artifacts) {
        const exists = merged.artifacts.some(a => a.checksum === artifact.checksum);
        if (!exists) {
          merged.artifacts.push(artifact);
        }
      }

      // Merge errors and warnings
      merged.errors.push(...result.consolidated.errors);
      merged.warnings.push(...result.consolidated.warnings);

      // Aggregate summary
      merged.summary.total_tasks += result.consolidated.summary.total_tasks;
      merged.summary.completed_tasks += result.consolidated.summary.completed_tasks;
      merged.summary.failed_tasks += result.consolidated.summary.failed_tasks;
      merged.summary.total_duration_ms += result.consolidated.summary.total_duration_ms;
      merged.summary.total_cost += result.consolidated.summary.total_cost;
    }

    return merged;
  }

  /**
   * Export result as JSON
   */
  toJSON(executionId = null) {
    if (executionId) {
      return this.results.get(executionId) || null;
    }
    
    return {
      results: Array.from(this.results.values()),
      artifacts_count: this.artifacts.size
    };
  }

  // Private methods

  _createTaskExtractionResult() {
    return {
      success: false,
      tasks_extracted: 0,
      tasks_by_phase: {},
      dependencies_resolved: 0,
      circular_dependencies: 0,
      extraction_time_ms: 0,
      output_files: []
    };
  }

  _createOrchestrationResult() {
    return {
      success: false,
      phases: {},
      total_orchestration_time_ms: 0,
      state_transitions: 0,
      output_files: []
    };
  }

  _createExecutionBridgeResult() {
    return {
      success: false,
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      by_transport: {},
      resource_outputs: [],
      total_execution_time_ms: 0,
      output_files: []
    };
  }

  _createValidationResult() {
    return {
      success: false,
      validations_run: 0,
      validations_passed: 0,
      validations_failed: 0,
      quality_score: 0,
      gate_results: {},
      issues: [],
      output_files: []
    };
  }

  _createBicepResolverResult() {
    return {
      success: false,
      resources_resolved: 0,
      modules_matched: 0,
      avm_modules_used: [],
      template_generated: false,
      template_path: null,
      validation_passed: false,
      output_files: []
    };
  }

  _createLineage(executionId) {
    return {
      execution_id: executionId,
      created_at: new Date().toISOString(),
      stages: [],
      artifacts: [],
      dependencies: []
    };
  }

  _updateLineage(executionId, stage, result) {
    const lineage = this.lineage.get(executionId);
    if (!lineage) return;

    lineage.stages.push({
      stage,
      timestamp: new Date().toISOString(),
      success: result.success,
      output_files: result.output_files || []
    });
  }

  _addArtifactToLineage(executionId, artifact) {
    const lineage = this.lineage.get(executionId);
    if (!lineage) return;

    lineage.artifacts.push({
      artifact_id: artifact.artifact_id,
      type: artifact.type,
      produced_at: artifact.created_at,
      produced_by: artifact.lineage?.produced_by,
      stage: artifact.lineage?.stage
    });
  }

  _finalizeLineage(executionId) {
    const lineage = this.lineage.get(executionId);
    if (!lineage) return;

    lineage.finalized_at = new Date().toISOString();
  }

  _addErrors(result, errors, stage) {
    for (const error of errors) {
      result.consolidated.errors.push({
        stage,
        message: error.message || String(error),
        code: error.code,
        timestamp: new Date().toISOString()
      });
    }
  }

  _calculateChecksum(content) {
    return createHash(this.checksumAlgorithm)
      .update(content)
      .digest('hex');
  }

  _findArtifactByChecksum(executionId, checksum) {
    const result = this.results.get(executionId);
    if (!result) return null;
    
    return result.consolidated.artifacts.find(a => a.checksum === checksum);
  }

  _calculateTotalCost(result) {
    // Placeholder for cost calculation logic
    // Would integrate with cloud provider cost APIs
    return 0;
  }
}

export default ResultAggregator;
