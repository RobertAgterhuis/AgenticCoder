/**
 * StatePersistencePlugin - JavaScript bridge for WorkflowEngine integration
 * 
 * This plugin provides state persistence capabilities to the JavaScript-based
 * WorkflowEngine through event-based integration.
 * 
 * Usage:
 *   const WorkflowEngine = require('./WorkflowEngine');
 *   const { StatePersistencePlugin } = require('../../src/state/StatePersistencePlugin');
 *   
 *   const engine = new WorkflowEngine();
 *   const persistence = new StatePersistencePlugin();
 *   await persistence.attach(engine);
 */

const path = require('path');
const crypto = require('crypto');

// Since this is a JavaScript file that will be used by the existing JS WorkflowEngine,
// we provide a minimal implementation that can work standalone or be enhanced
// with the TypeScript implementation when running in a TypeScript environment.

/**
 * Maps workflow steps to 16-phase model
 */
const STEP_TO_PHASE = {
  'extract': 1,
  'document': 2,
  'architect': 3,
  'tech-spec': 4,
  'api-design': 5,
  'data-model': 6,
  'security': 7,
  'devops': 8,
  'azure-arch': 9,
  'bicep': 10,
  'cost': 11,
  'provision': 12,
  'frontend': 13,
  'backend': 14,
  'database': 15,
  'validate': 16,
  // Aliases
  'task-extraction': 1,
  'resource-analyzer': 9,
  'cost-estimator': 11,
  'deployment-planner': 8,
  'validation': 16,
};

/**
 * Phase definitions matching TypeScript ExecutionManager
 */
const PHASE_DEFINITIONS = [
  { phase: 1, name: 'Project Planning', agents: ['extraction-agent'] },
  { phase: 2, name: 'Documentation', agents: ['documentation-agent'] },
  { phase: 3, name: 'Architecture Design', agents: ['architecture-agent'] },
  { phase: 4, name: 'Technical Specification', agents: ['techspec-agent'] },
  { phase: 5, name: 'API Design', agents: ['api-agent'] },
  { phase: 6, name: 'Data Modeling', agents: ['datamodel-agent'] },
  { phase: 7, name: 'Security Planning', agents: ['security-agent'] },
  { phase: 8, name: 'DevOps Planning', agents: ['devops-agent'] },
  { phase: 9, name: 'Azure Architecture', agents: ['azure-architect-agent'] },
  { phase: 10, name: 'Bicep IaC', agents: ['bicep-agent'] },
  { phase: 11, name: 'Cost Estimation', agents: ['cost-agent'] },
  { phase: 12, name: 'Resource Provisioning', agents: ['provision-agent'] },
  { phase: 13, name: 'Frontend Generation', agents: ['frontend-agent'] },
  { phase: 14, name: 'Backend Generation', agents: ['backend-agent'] },
  { phase: 15, name: 'Database Setup', agents: ['database-agent'] },
  { phase: 16, name: 'Integration & Testing', agents: ['validation-agent'] },
];

/**
 * StatePersistencePlugin - Adds state persistence to WorkflowEngine
 */
class StatePersistencePlugin {
  constructor(options = {}) {
    this.options = {
      baseDir: options.baseDir || '.agenticcoder',
      autoCheckpoint: options.autoCheckpoint !== false,
      checkpointOnPhaseComplete: options.checkpointOnPhaseComplete !== false,
      ...options,
    };

    this.workflowEngine = null;
    this.activeExecution = null;
    this.executions = new Map();
    this.handlers = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the persistence plugin
   */
  async initialize() {
    if (this.initialized) return;

    const fs = require('fs').promises;

    // Ensure base directory exists
    const dirs = [
      this.options.baseDir,
      path.join(this.options.baseDir, 'state'),
      path.join(this.options.baseDir, 'state', 'executions'),
      path.join(this.options.baseDir, 'state', 'checkpoints'),
      path.join(this.options.baseDir, 'artifacts'),
      path.join(this.options.baseDir, 'decisions'),
      path.join(this.options.baseDir, 'cache'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    this.setupHandlers();
    this.initialized = true;
  }

  /**
   * Attach to a WorkflowEngine instance
   */
  async attach(workflowEngine) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.workflowEngine) {
      this.detach();
    }

    this.workflowEngine = workflowEngine;

    // Subscribe to workflow events
    for (const [event, handler] of this.handlers) {
      workflowEngine.on(event, handler);
    }

    console.log('[StatePersistencePlugin] Attached to WorkflowEngine');
    return this;
  }

  /**
   * Detach from WorkflowEngine
   */
  detach() {
    if (!this.workflowEngine) return;

    for (const [event, handler] of this.handlers) {
      this.workflowEngine.off(event, handler);
    }

    this.workflowEngine = null;
    console.log('[StatePersistencePlugin] Detached from WorkflowEngine');
  }

  /**
   * Setup event handlers
   */
  setupHandlers() {
    this.handlers.set('workflow:start', this.onWorkflowStart.bind(this));
    this.handlers.set('workflow:complete', this.onWorkflowComplete.bind(this));
    this.handlers.set('workflow:error', this.onWorkflowError.bind(this));
    this.handlers.set('step:start', this.onStepStart.bind(this));
    this.handlers.set('step:complete', this.onStepComplete.bind(this));
    this.handlers.set('step:error', this.onStepError.bind(this));
    this.handlers.set('step:skipped', this.onStepSkipped.bind(this));
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  async onWorkflowStart(data) {
    try {
      const executionId = data.executionId || crypto.randomUUID();
      const now = new Date().toISOString();

      // Create execution state
      const execution = {
        executionId,
        projectName: data.workflowId || 'unknown',
        status: 'running',
        scenario: 'workflow',
        startedAt: now,
        updatedAt: now,
        currentPhase: 1,
        phases: PHASE_DEFINITIONS.map(def => ({
          phase: def.phase,
          name: def.name,
          status: 'pending',
          agent: def.agents[0],
        })),
        data: {
          workflowId: data.workflowId,
          originalExecutionId: data.executionId,
        },
      };

      this.executions.set(executionId, execution);
      this.activeExecution = executionId;

      // Persist to disk
      await this.saveExecution(execution);

      if (this.options.autoCheckpoint) {
        await this.createCheckpoint(executionId, 'workflow-start');
      }

      console.log(`[StatePersistencePlugin] Started execution: ${executionId}`);
    } catch (error) {
      console.error('[StatePersistencePlugin] Failed to persist workflow start:', error);
    }
  }

  async onWorkflowComplete(data) {
    if (!this.activeExecution) return;

    try {
      const execution = this.executions.get(this.activeExecution);
      if (!execution) return;

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      execution.updatedAt = execution.completedAt;

      if (data.duration) {
        execution.totalDurationMs = data.duration;
      }

      await this.saveExecution(execution);

      if (this.options.autoCheckpoint) {
        await this.createCheckpoint(this.activeExecution, 'workflow-complete');
      }

      console.log(`[StatePersistencePlugin] Completed execution: ${this.activeExecution}`);
      this.activeExecution = null;
    } catch (error) {
      console.error('[StatePersistencePlugin] Failed to persist workflow completion:', error);
    }
  }

  async onWorkflowError(data) {
    if (!this.activeExecution) return;

    try {
      const execution = this.executions.get(this.activeExecution);
      if (!execution) return;

      execution.status = 'failed';
      execution.error = data.error;
      execution.updatedAt = new Date().toISOString();

      await this.saveExecution(execution);
      await this.createCheckpoint(this.activeExecution, 'error', { error: data.error });

      console.error(`[StatePersistencePlugin] Execution failed: ${data.error}`);
    } catch (error) {
      console.error('[StatePersistencePlugin] Failed to persist workflow error:', error);
    }
  }

  async onStepStart(data) {
    if (!this.activeExecution) return;

    try {
      const execution = this.executions.get(this.activeExecution);
      if (!execution) return;

      const phase = this.stepToPhase(data.stepId);
      const phaseState = execution.phases.find(p => p.phase === phase);

      if (phaseState) {
        phaseState.status = 'in-progress';
        phaseState.startedAt = new Date().toISOString();
        phaseState.agent = data.agentId;
        execution.currentPhase = phase;
        execution.updatedAt = phaseState.startedAt;

        await this.saveExecution(execution);
      }
    } catch (error) {
      console.error('[StatePersistencePlugin] Failed to persist step start:', error);
    }
  }

  async onStepComplete(data) {
    if (!this.activeExecution) return;

    try {
      const execution = this.executions.get(this.activeExecution);
      if (!execution) return;

      const phase = this.stepToPhase(data.stepId);
      const phaseState = execution.phases.find(p => p.phase === phase);

      if (phaseState) {
        phaseState.status = 'completed';
        phaseState.completedAt = new Date().toISOString();
        phaseState.outputs = data.outputs;
        execution.updatedAt = phaseState.completedAt;

        await this.saveExecution(execution);

        if (this.options.checkpointOnPhaseComplete) {
          await this.createCheckpoint(this.activeExecution, 'phase-complete', {
            phase,
            stepId: data.stepId,
          });
        }

        // Register artifacts from outputs
        if (data.outputs) {
          await this.registerOutputArtifacts(phase, data.agentId, data.outputs);
        }
      }
    } catch (error) {
      console.error('[StatePersistencePlugin] Failed to persist step completion:', error);
    }
  }

  async onStepError(data) {
    if (!this.activeExecution) return;

    try {
      const execution = this.executions.get(this.activeExecution);
      if (!execution) return;

      const phase = this.stepToPhase(data.stepId);
      const phaseState = execution.phases.find(p => p.phase === phase);

      if (phaseState) {
        phaseState.status = 'failed';
        phaseState.error = data.error;
        phaseState.completedAt = new Date().toISOString();
        execution.updatedAt = phaseState.completedAt;

        await this.saveExecution(execution);
        await this.createCheckpoint(this.activeExecution, 'error', {
          phase,
          stepId: data.stepId,
          error: data.error,
        });
      }
    } catch (error) {
      console.error('[StatePersistencePlugin] Failed to persist step error:', error);
    }
  }

  async onStepSkipped(data) {
    if (!this.activeExecution) return;

    try {
      const execution = this.executions.get(this.activeExecution);
      if (!execution) return;

      const phase = this.stepToPhase(data.stepId);
      const phaseState = execution.phases.find(p => p.phase === phase);

      if (phaseState) {
        phaseState.status = 'skipped';
        phaseState.completedAt = new Date().toISOString();
        execution.updatedAt = phaseState.completedAt;

        await this.saveExecution(execution);
      }
    } catch (error) {
      console.error('[StatePersistencePlugin] Failed to persist step skip:', error);
    }
  }

  // ===========================================================================
  // Persistence Operations
  // ===========================================================================

  async saveExecution(execution) {
    const fs = require('fs').promises;
    const filePath = path.join(
      this.options.baseDir,
      'state',
      'executions',
      `${execution.executionId}.json`
    );

    await fs.writeFile(filePath, JSON.stringify(execution, null, 2));
  }

  async loadExecution(executionId) {
    const fs = require('fs').promises;
    const filePath = path.join(
      this.options.baseDir,
      'state',
      'executions',
      `${executionId}.json`
    );

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async createCheckpoint(executionId, reason, additionalState = {}) {
    const fs = require('fs').promises;
    const execution = this.executions.get(executionId);
    if (!execution) return null;

    const checkpointId = `chk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const checkpoint = {
      checkpointId,
      executionId,
      phase: execution.currentPhase,
      reason,
      createdAt: new Date().toISOString(),
      executionState: execution,
      additionalState,
    };

    const checkpointDir = path.join(
      this.options.baseDir,
      'state',
      'checkpoints',
      executionId
    );

    await fs.mkdir(checkpointDir, { recursive: true });

    const filePath = path.join(checkpointDir, `${checkpointId}.json`);
    await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2));

    console.log(`[StatePersistencePlugin] Checkpoint created: ${checkpointId}`);
    return checkpoint;
  }

  async listCheckpoints(executionId) {
    const fs = require('fs').promises;
    const checkpointDir = path.join(
      this.options.baseDir,
      'state',
      'checkpoints',
      executionId
    );

    try {
      const files = await fs.readdir(checkpointDir);
      const checkpoints = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(checkpointDir, file), 'utf-8');
          checkpoints.push(JSON.parse(content));
        }
      }

      return checkpoints.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      return [];
    }
  }

  async registerOutputArtifacts(phase, agentId, outputs) {
    if (!outputs || typeof outputs !== 'object') return;

    const artifactKeys = [
      'template', 'code', 'bicep', 'terraform', 'yaml', 'json',
      'frontend', 'backend', 'api', 'schema', 'config', 'dockerfile',
    ];

    for (const key of artifactKeys) {
      if (outputs[key]) {
        await this.registerArtifact({
          name: key,
          type: this.inferArtifactType(key),
          content: typeof outputs[key] === 'string' 
            ? outputs[key] 
            : JSON.stringify(outputs[key], null, 2),
          phase,
          agent: agentId,
        });
      }
    }
  }

  async registerArtifact(artifact) {
    const fs = require('fs').promises;
    const artifactId = crypto.randomUUID();
    const contentHash = crypto
      .createHash('sha256')
      .update(artifact.content)
      .digest('hex');

    const metadata = {
      id: artifactId,
      name: artifact.name,
      type: artifact.type,
      phase: artifact.phase,
      agent: artifact.agent,
      contentHash,
      size: Buffer.byteLength(artifact.content),
      createdAt: new Date().toISOString(),
      version: 1,
    };

    const artifactDir = path.join(this.options.baseDir, 'artifacts');
    const metaPath = path.join(artifactDir, `${artifactId}.meta.json`);
    const contentPath = path.join(artifactDir, `${artifactId}.content`);

    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));
    await fs.writeFile(contentPath, artifact.content);

    return metadata;
  }

  inferArtifactType(key) {
    if (['template', 'bicep', 'terraform', 'yaml'].includes(key)) {
      return 'infrastructure';
    }
    if (['code', 'frontend', 'backend', 'api'].includes(key)) {
      return 'source-code';
    }
    if (['config', 'json', 'dockerfile'].includes(key)) {
      return 'config';
    }
    return 'other';
  }

  // ===========================================================================
  // Resume Support
  // ===========================================================================

  /**
   * Resume from the latest checkpoint
   */
  async resumeLatest() {
    const fs = require('fs').promises;
    const executionsDir = path.join(this.options.baseDir, 'state', 'executions');

    try {
      const files = await fs.readdir(executionsDir);
      const executions = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(executionsDir, file), 'utf-8');
          executions.push(JSON.parse(content));
        }
      }

      // Find incomplete executions
      const incomplete = executions
        .filter(e => ['running', 'paused', 'failed'].includes(e.status))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      if (incomplete.length === 0) {
        return { success: false, error: 'No incomplete executions found' };
      }

      const execution = incomplete[0];
      this.executions.set(execution.executionId, execution);
      this.activeExecution = execution.executionId;

      // Find resume point
      const completedPhases = execution.phases
        .filter(p => p.status === 'completed')
        .sort((a, b) => b.phase - a.phase);

      const lastCompleted = completedPhases[0];
      const resumePhase = lastCompleted ? lastCompleted.phase + 1 : 1;

      return {
        success: true,
        executionId: execution.executionId,
        resumePhase,
        resumeStep: this.phaseToStep(resumePhase),
        context: execution.data || {},
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get list of executions that can be resumed
   */
  async getResumableExecutions() {
    const fs = require('fs').promises;
    const executionsDir = path.join(this.options.baseDir, 'state', 'executions');

    try {
      const files = await fs.readdir(executionsDir);
      const results = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(executionsDir, file), 'utf-8');
          const execution = JSON.parse(content);

          if (['running', 'paused', 'failed'].includes(execution.status)) {
            const completedPhases = execution.phases
              .filter(p => p.status === 'completed');

            results.push({
              executionId: execution.executionId,
              projectName: execution.projectName,
              status: execution.status,
              completedPhases: completedPhases.length,
              totalPhases: execution.phases.length,
              lastUpdate: execution.updatedAt,
              error: execution.error,
            });
          }
        }
      }

      return results.sort((a, b) => 
        new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
      );
    } catch (error) {
      return [];
    }
  }

  // ===========================================================================
  // Utility
  // ===========================================================================

  stepToPhase(stepId) {
    return STEP_TO_PHASE[stepId] || STEP_TO_PHASE[stepId?.toLowerCase()] || 1;
  }

  phaseToStep(phase) {
    const entry = Object.entries(STEP_TO_PHASE).find(([_, p]) => p === phase);
    return entry ? entry[0] : 'unknown';
  }

  /**
   * Get current execution state
   */
  getCurrentExecution() {
    if (!this.activeExecution) return null;
    return this.executions.get(this.activeExecution);
  }

  /**
   * Check if there are any resumable executions
   */
  async hasResumableExecutions() {
    const resumable = await this.getResumableExecutions();
    return resumable.length > 0;
  }
}

module.exports = {
  StatePersistencePlugin,
  STEP_TO_PHASE,
  PHASE_DEFINITIONS,
};
