/**
 * PlanUpdater (FL-04)
 * 
 * Write execution results back to @plan specification.
 * Transforms the plan from "write-only" to a living document with execution history.
 * 
 * Responsibilities:
 * - Update task statuses in original plan
 * - Add execution results and metrics
 * - Maintain plan version history
 * - Preserve original structure
 * - Track execution lineage
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// Update modes
export const UPDATE_MODES = {
  MERGE: 'merge',           // Merge into existing plan
  APPEND: 'append',         // Append new execution section
  REPLACE: 'replace',       // Replace execution section
  VERSION: 'version'        // Create new version
};

export class PlanUpdater extends EventEmitter {
  constructor(options = {}) {
    super();
    this.outputDir = options.outputDir || './.agenticoder/plans';
    this.backupEnabled = options.backupEnabled !== false;
    this.versioningEnabled = options.versioningEnabled !== false;
    this.updateMode = options.updateMode || UPDATE_MODES.MERGE;
    this.planCache = new Map();         // plan_id -> plan content
    this.versionHistory = new Map();    // plan_id -> version list
  }

  /**
   * Load a plan from file or cache
   */
  async loadPlan(planPath) {
    // Check cache
    if (this.planCache.has(planPath)) {
      return this.planCache.get(planPath);
    }

    try {
      const content = await fs.readFile(planPath, 'utf-8');
      const plan = JSON.parse(content);
      this.planCache.set(planPath, plan);
      return plan;
    } catch (error) {
      this.emit('plan-load-error', { path: planPath, error });
      throw new Error(`Failed to load plan: ${error.message}`);
    }
  }

  /**
   * Update plan with execution results
   */
  async updatePlan(planPath, executionResult, options = {}) {
    const mode = options.mode || this.updateMode;
    
    // Load existing plan
    let plan;
    try {
      plan = await this.loadPlan(planPath);
    } catch (error) {
      // If plan doesn't exist, create a minimal structure
      plan = { '@plan': {} };
    }

    // Create backup if enabled
    if (this.backupEnabled) {
      await this._createBackup(planPath, plan);
    }

    // Apply the update based on mode
    let updatedPlan;
    switch (mode) {
      case UPDATE_MODES.MERGE:
        updatedPlan = this._mergeUpdate(plan, executionResult);
        break;
      case UPDATE_MODES.APPEND:
        updatedPlan = this._appendUpdate(plan, executionResult);
        break;
      case UPDATE_MODES.REPLACE:
        updatedPlan = this._replaceUpdate(plan, executionResult);
        break;
      case UPDATE_MODES.VERSION:
        updatedPlan = await this._versionUpdate(planPath, plan, executionResult);
        break;
      default:
        updatedPlan = this._mergeUpdate(plan, executionResult);
    }

    // Save the updated plan
    await this._savePlan(planPath, updatedPlan);

    // Update cache
    this.planCache.set(planPath, updatedPlan);

    this.emit('plan-updated', { 
      path: planPath, 
      execution_id: executionResult.execution_id,
      mode 
    });

    return updatedPlan;
  }

  /**
   * Update task status in plan
   */
  async updateTaskStatus(planPath, taskId, taskStatus) {
    const plan = await this.loadPlan(planPath);

    // Ensure @execution section exists
    if (!plan['@execution']) {
      plan['@execution'] = { tasks: {} };
    }
    if (!plan['@execution'].tasks) {
      plan['@execution'].tasks = {};
    }

    // Update task
    plan['@execution'].tasks[taskId] = {
      ...plan['@execution'].tasks[taskId],
      task_id: taskId,
      status: taskStatus.state,
      status_updated_at: taskStatus.state_updated_at,
      started_at: taskStatus.started_at,
      completed_at: taskStatus.completed_at,
      duration_ms: taskStatus.duration_ms,
      result: taskStatus.result,
      retry_count: taskStatus.retry_count,
      agent_used: taskStatus.agent,
      transport_used: taskStatus.transport
    };

    await this._savePlan(planPath, plan);
    this.planCache.set(planPath, plan);

    this.emit('task-status-updated', { 
      path: planPath, 
      task_id: taskId, 
      status: taskStatus.state 
    });

    return plan;
  }

  /**
   * Update phase status in plan
   */
  async updatePhaseStatus(planPath, phaseId, phaseStatus) {
    const plan = await this.loadPlan(planPath);

    // Ensure @execution.phases section exists
    if (!plan['@execution']) {
      plan['@execution'] = { phases: {} };
    }
    if (!plan['@execution'].phases) {
      plan['@execution'].phases = {};
    }

    // Update phase
    plan['@execution'].phases[phaseId] = {
      phase_id: phaseId,
      phase_number: phaseStatus.phase_number,
      phase_name: phaseStatus.phase_name,
      status: phaseStatus.state,
      status_updated_at: phaseStatus.state_updated_at,
      started_at: phaseStatus.started_at,
      completed_at: phaseStatus.completed_at,
      duration_ms: phaseStatus.duration_ms,
      tasks_total: phaseStatus.tasks_total,
      tasks_completed: phaseStatus.tasks_completed,
      tasks_failed: phaseStatus.tasks_failed
    };

    await this._savePlan(planPath, plan);
    this.planCache.set(planPath, plan);

    this.emit('phase-status-updated', { 
      path: planPath, 
      phase_id: phaseId, 
      status: phaseStatus.state 
    });

    return plan;
  }

  /**
   * Add execution summary to plan
   */
  async addExecutionSummary(planPath, executionResult, metrics = null) {
    const plan = await this.loadPlan(planPath);

    // Update @execution section
    plan['@execution'] = {
      ...plan['@execution'],
      execution_id: executionResult.execution_id,
      execution_timestamp: executionResult.execution_timestamp,
      completed_timestamp: new Date().toISOString(),
      duration_ms: executionResult.consolidated.summary.total_duration_ms,
      overall_status: executionResult.overall_status,
      success_rate: executionResult.consolidated.summary.total_tasks > 0
        ? (executionResult.consolidated.summary.completed_tasks / 
           executionResult.consolidated.summary.total_tasks * 100).toFixed(1)
        : 0,
      quality_score: executionResult.stage_results?.validation?.quality_score || 0,
      results: {
        artifacts: executionResult.consolidated.artifacts.map(a => ({
          id: a.artifact_id,
          type: a.type,
          name: a.name,
          path: a.path
        })),
        resources_created: executionResult.stage_results?.execution_bridge?.resource_outputs || [],
        errors: executionResult.consolidated.errors,
        warnings: executionResult.consolidated.warnings
      },
      metrics: metrics || {
        total_tasks: executionResult.consolidated.summary.total_tasks,
        completed: executionResult.consolidated.summary.completed_tasks,
        failed: executionResult.consolidated.summary.failed_tasks,
        average_duration_ms: executionResult.consolidated.summary.total_tasks > 0
          ? Math.round(executionResult.consolidated.summary.total_duration_ms / 
                       executionResult.consolidated.summary.total_tasks)
          : 0,
        total_cost: executionResult.consolidated.summary.total_cost
      }
    };

    // Update @summary section
    plan['@summary'] = {
      ...plan['@summary'],
      executed_by: executionResult.executed_by || 'system',
      execution_count: (plan['@summary']?.execution_count || 0) + 1,
      last_successful: executionResult.success 
        ? new Date().toISOString() 
        : plan['@summary']?.last_successful,
      change_summary: {
        resources_created: executionResult.stage_results?.execution_bridge?.resource_outputs?.length || 0,
        resources_modified: 0,
        resources_deleted: 0
      }
    };

    await this._savePlan(planPath, plan);
    this.planCache.set(planPath, plan);

    this.emit('execution-summary-added', { 
      path: planPath, 
      execution_id: executionResult.execution_id 
    });

    return plan;
  }

  /**
   * Add recommendations to plan
   */
  async addRecommendations(planPath, recommendations, nextSteps = []) {
    const plan = await this.loadPlan(planPath);

    plan['@execution'] = {
      ...plan['@execution'],
      recommendations: recommendations,
      next_steps: nextSteps
    };

    await this._savePlan(planPath, plan);
    this.planCache.set(planPath, plan);

    this.emit('recommendations-added', { 
      path: planPath, 
      count: recommendations.length 
    });

    return plan;
  }

  /**
   * Get version history for a plan
   */
  getVersionHistory(planPath) {
    return this.versionHistory.get(planPath) || [];
  }

  /**
   * Restore a plan to a specific version
   */
  async restoreVersion(planPath, version) {
    const backupPath = this._getBackupPath(planPath, version);
    
    try {
      const content = await fs.readFile(backupPath, 'utf-8');
      const plan = JSON.parse(content);
      
      await this._savePlan(planPath, plan);
      this.planCache.set(planPath, plan);
      
      this.emit('version-restored', { path: planPath, version });
      return plan;
    } catch (error) {
      this.emit('restore-error', { path: planPath, version, error });
      throw new Error(`Failed to restore version: ${error.message}`);
    }
  }

  /**
   * Clear plan cache
   */
  clearCache(planPath = null) {
    if (planPath) {
      this.planCache.delete(planPath);
    } else {
      this.planCache.clear();
    }
  }

  // Private methods

  async _createBackup(planPath, plan) {
    const timestamp = Date.now();
    const backupDir = path.join(this.outputDir, 'backups');
    const backupPath = this._getBackupPath(planPath, timestamp);

    try {
      await fs.mkdir(backupDir, { recursive: true });
      await fs.writeFile(backupPath, JSON.stringify(plan, null, 2));

      // Track version history
      if (!this.versionHistory.has(planPath)) {
        this.versionHistory.set(planPath, []);
      }
      this.versionHistory.get(planPath).push({
        version: timestamp,
        path: backupPath,
        created_at: new Date().toISOString()
      });

      this.emit('backup-created', { path: planPath, backupPath });
    } catch (error) {
      this.emit('backup-error', { path: planPath, error });
      // Don't throw - backup failure shouldn't stop the update
    }
  }

  _getBackupPath(planPath, version) {
    const planName = path.basename(planPath, path.extname(planPath));
    return path.join(this.outputDir, 'backups', `${planName}_${version}.json`);
  }

  async _savePlan(planPath, plan) {
    const dir = path.dirname(planPath);
    
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
    } catch (error) {
      this.emit('save-error', { path: planPath, error });
      throw new Error(`Failed to save plan: ${error.message}`);
    }
  }

  _mergeUpdate(plan, executionResult) {
    return {
      ...plan,
      '@execution': {
        execution_id: executionResult.execution_id,
        execution_timestamp: executionResult.execution_timestamp,
        completed_timestamp: new Date().toISOString(),
        duration_ms: executionResult.consolidated?.summary?.total_duration_ms || 0,
        overall_status: executionResult.overall_status,
        success_rate: this._calculateSuccessRate(executionResult),
        quality_score: executionResult.stage_results?.validation?.quality_score || 0,
        tasks: this._buildTasksMap(executionResult),
        phases: this._buildPhasesMap(executionResult),
        results: {
          artifacts: executionResult.consolidated?.artifacts || [],
          errors: executionResult.consolidated?.errors || [],
          warnings: executionResult.consolidated?.warnings || []
        },
        metrics: {
          total_tasks: executionResult.consolidated?.summary?.total_tasks || 0,
          completed: executionResult.consolidated?.summary?.completed_tasks || 0,
          failed: executionResult.consolidated?.summary?.failed_tasks || 0,
          total_cost: executionResult.consolidated?.summary?.total_cost || 0
        }
      },
      '@summary': this._buildSummary(plan, executionResult)
    };
  }

  _appendUpdate(plan, executionResult) {
    // Keep existing @execution as history
    const executionHistory = plan['@execution_history'] || [];
    if (plan['@execution']) {
      executionHistory.push(plan['@execution']);
    }

    const updated = this._mergeUpdate(plan, executionResult);
    updated['@execution_history'] = executionHistory;
    
    return updated;
  }

  _replaceUpdate(plan, executionResult) {
    // Completely replace @execution section
    const updated = { ...plan };
    delete updated['@execution'];
    return this._mergeUpdate(updated, executionResult);
  }

  async _versionUpdate(planPath, plan, executionResult) {
    // Create a new version file
    const version = Date.now();
    const versionPath = this._getVersionPath(planPath, version);
    
    const updated = this._mergeUpdate(plan, executionResult);
    updated['@version'] = {
      version,
      previous_version: plan['@version']?.version || null,
      created_at: new Date().toISOString()
    };

    await this._savePlan(versionPath, updated);
    
    return updated;
  }

  _getVersionPath(planPath, version) {
    const ext = path.extname(planPath);
    const base = path.basename(planPath, ext);
    const dir = path.dirname(planPath);
    return path.join(dir, `${base}_v${version}${ext}`);
  }

  _calculateSuccessRate(executionResult) {
    const total = executionResult.consolidated?.summary?.total_tasks || 0;
    const completed = executionResult.consolidated?.summary?.completed_tasks || 0;
    return total > 0 ? (completed / total * 100).toFixed(1) : 0;
  }

  _buildTasksMap(executionResult) {
    const tasks = {};
    // Would be populated from actual task execution details
    return tasks;
  }

  _buildPhasesMap(executionResult) {
    const phases = {};
    const orchResult = executionResult.stage_results?.orchestration;
    if (orchResult?.phases) {
      Object.assign(phases, orchResult.phases);
    }
    return phases;
  }

  _buildSummary(plan, executionResult) {
    return {
      executed_by: executionResult.executed_by || 'system',
      execution_count: (plan['@summary']?.execution_count || 0) + 1,
      last_successful: executionResult.success 
        ? new Date().toISOString() 
        : plan['@summary']?.last_successful,
      change_summary: {
        resources_created: executionResult.stage_results?.execution_bridge?.resource_outputs?.length || 0,
        resources_modified: 0,
        resources_deleted: 0
      }
    };
  }
}

export default PlanUpdater;
