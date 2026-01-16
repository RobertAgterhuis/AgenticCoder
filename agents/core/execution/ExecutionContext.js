/**
 * ExecutionContext (EB-02)
 * Creates and manages execution context for agent invocations.
 * 
 * Provides:
 * - Unique execution ID generation
 * - Input packaging and validation
 * - Environment configuration
 * - Resource limits (timeout, memory, CPU)
 * - Working directory and artifact paths
 */

import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';

const DEFAULT_LIMITS = {
  timeout_ms: 300000,      // 5 minutes
  memory_mb: 512,          // 512 MB
  cpu_percent: 100,        // 100% of one core
  max_output_bytes: 10 * 1024 * 1024  // 10 MB
};

const DEFAULT_PATHS = {
  base_dir: '.agenticcoder',
  artifacts_dir: 'artifacts',
  logs_dir: 'logs',
  temp_dir: 'temp'
};

export class ExecutionContext {
  constructor(options = {}) {
    this.execution_id = options.execution_id || this._generateExecutionId();
    this.agent = options.agent || 'unknown';
    this.phase = options.phase ?? 0;
    this.created_at = new Date().toISOString();
    
    // Input data
    this.inputs = options.inputs || {};
    this.previous_artifacts = options.previous_artifacts || [];
    
    // Environment
    this.environment = this._buildEnvironment(options.environment || {});
    
    // Resource limits
    this.limits = this._buildLimits(options.limits || {});
    
    // Paths
    this.paths = this._buildPaths(options.paths || {}, options.project_root);
    
    // Metadata
    this.metadata = {
      project_id: options.project_id || null,
      task_id: options.task_id || null,
      user_id: options.user_id || null,
      tags: options.tags || [],
      ...options.metadata
    };

    // Transport info (set by TransportSelector)
    this.transport = options.transport || null;
  }

  _generateExecutionId() {
    const timestamp = Date.now().toString(36);
    const uuid = randomUUID().split('-')[0];
    return `exec-${timestamp}-${uuid}`;
  }

  _buildEnvironment(env) {
    const baseEnv = {
      // Execution context variables
      EXECUTION_ID: this.execution_id,
      AGENT_NAME: this.agent,
      PHASE: String(this.phase),
      
      // Node.js environment
      NODE_ENV: process.env.NODE_ENV || 'production',
      
      // Disable interactive prompts
      CI: 'true',
      FORCE_COLOR: '0'
    };

    // Inherit select environment variables
    const inheritedVars = [
      'PATH', 'HOME', 'USER', 'SHELL',
      'LANG', 'LC_ALL',
      'AZURE_SUBSCRIPTION_ID', 'AZURE_TENANT_ID',
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
      'GITHUB_TOKEN'
    ];

    for (const varName of inheritedVars) {
      if (process.env[varName]) {
        baseEnv[varName] = process.env[varName];
      }
    }

    return {
      ...baseEnv,
      ...env
    };
  }

  _buildLimits(limits) {
    return {
      timeout_ms: limits.timeout_ms ?? DEFAULT_LIMITS.timeout_ms,
      memory_mb: limits.memory_mb ?? DEFAULT_LIMITS.memory_mb,
      cpu_percent: limits.cpu_percent ?? DEFAULT_LIMITS.cpu_percent,
      max_output_bytes: limits.max_output_bytes ?? DEFAULT_LIMITS.max_output_bytes
    };
  }

  _buildPaths(pathConfig, projectRoot) {
    const baseDir = projectRoot || process.cwd();
    const workDir = path.join(baseDir, pathConfig.base_dir || DEFAULT_PATHS.base_dir);

    return {
      project_root: baseDir,
      work_dir: workDir,
      artifact_dir: path.join(workDir, pathConfig.artifacts_dir || DEFAULT_PATHS.artifacts_dir, this.execution_id),
      log_dir: path.join(workDir, pathConfig.logs_dir || DEFAULT_PATHS.logs_dir, this.execution_id),
      temp_dir: path.join(workDir, pathConfig.temp_dir || DEFAULT_PATHS.temp_dir, this.execution_id),
      // Input artifact paths (from previous phases)
      input_artifacts: (pathConfig.input_artifacts || []).map(p => path.resolve(baseDir, p))
    };
  }

  /**
   * Ensure all required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      this.paths.work_dir,
      this.paths.artifact_dir,
      this.paths.log_dir,
      this.paths.temp_dir
    ];

    for (const dir of dirs) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Package inputs for agent execution
   */
  packageInputs() {
    return {
      // Core execution info
      execution_id: this.execution_id,
      agent: this.agent,
      phase: this.phase,
      
      // User inputs
      inputs: this.inputs,
      
      // Previous artifacts
      previous_artifacts: this.previous_artifacts,
      
      // Paths for agent to use
      paths: {
        artifact_dir: this.paths.artifact_dir,
        temp_dir: this.paths.temp_dir,
        project_root: this.paths.project_root
      },
      
      // Metadata
      metadata: this.metadata
    };
  }

  /**
   * Get environment variables for agent execution
   */
  getEnvironment() {
    return { ...this.environment };
  }

  /**
   * Add an input artifact from a previous phase
   */
  addPreviousArtifact(artifact) {
    this.previous_artifacts.push({
      phase: artifact.phase,
      agent: artifact.agent,
      path: artifact.path,
      type: artifact.type || 'unknown',
      size_bytes: artifact.size_bytes || 0
    });
  }

  /**
   * Set transport configuration
   */
  setTransport(transportConfig) {
    this.transport = transportConfig;
    
    // Update environment with transport-specific vars
    if (transportConfig.type === 'docker') {
      this.environment.DOCKER_MODE = 'true';
    }
  }

  /**
   * Get timeout in milliseconds
   */
  getTimeoutMs() {
    return this.limits.timeout_ms;
  }

  /**
   * Serialize context to JSON
   */
  toJSON() {
    return {
      execution_id: this.execution_id,
      agent: this.agent,
      phase: this.phase,
      created_at: this.created_at,
      inputs: this.inputs,
      previous_artifacts: this.previous_artifacts,
      environment: this.environment,
      limits: this.limits,
      paths: this.paths,
      metadata: this.metadata,
      transport: this.transport
    };
  }

  /**
   * Create context from serialized JSON
   */
  static fromJSON(json) {
    const context = new ExecutionContext(json);
    context.execution_id = json.execution_id;
    context.created_at = json.created_at;
    return context;
  }

  /**
   * Save context to file
   */
  async save(filePath = null) {
    const targetPath = filePath || path.join(this.paths.log_dir, 'context.json');
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, JSON.stringify(this.toJSON(), null, 2));
    return targetPath;
  }

  /**
   * Load context from file
   */
  static async load(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return ExecutionContext.fromJSON(JSON.parse(content));
  }
}

/**
 * ExecutionContextBuilder - Fluent builder for ExecutionContext
 */
export class ExecutionContextBuilder {
  constructor() {
    this._options = {};
  }

  forAgent(agentName) {
    this._options.agent = agentName;
    return this;
  }

  forPhase(phase) {
    this._options.phase = phase;
    return this;
  }

  withInputs(inputs) {
    this._options.inputs = inputs;
    return this;
  }

  withEnvironment(env) {
    this._options.environment = { ...this._options.environment, ...env };
    return this;
  }

  withLimits(limits) {
    this._options.limits = { ...this._options.limits, ...limits };
    return this;
  }

  withTimeout(timeoutMs) {
    this._options.limits = { ...this._options.limits, timeout_ms: timeoutMs };
    return this;
  }

  withProjectRoot(projectRoot) {
    this._options.project_root = projectRoot;
    return this;
  }

  withMetadata(metadata) {
    this._options.metadata = { ...this._options.metadata, ...metadata };
    return this;
  }

  withPreviousArtifacts(artifacts) {
    this._options.previous_artifacts = artifacts;
    return this;
  }

  withTransport(transport) {
    this._options.transport = transport;
    return this;
  }

  build() {
    return new ExecutionContext(this._options);
  }
}
