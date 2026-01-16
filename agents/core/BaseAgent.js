import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';

const ajv = new Ajv();
addFormats(ajv);

/**
 * BaseAgent - Abstract base class for all agents
 * Provides lifecycle management, validation, MCP integration, and communication
 */
export class BaseAgent extends EventEmitter {
  constructor(definition, options = {}) {
    super();
    this.definition = definition;
    this.id = definition.id;
    this.name = definition.name;
    this.version = definition.version;
    this.type = definition.type;
    this.state = 'idle'; // idle | initializing | ready | executing | error | stopped
    this.mcpClients = new Map();
    this.executionHistory = [];
    this.options = {
      timeout: definition.timeout || 30000,
      maxRetries: definition.retryPolicy?.maxRetries || 3,
      backoffMs: definition.retryPolicy?.backoffMs || 1000,
      ...options
    };

    // Compile input/output validators
    this.inputValidator = definition.inputs ? ajv.compile(definition.inputs) : null;
    this.outputValidator = definition.outputs ? ajv.compile(definition.outputs) : null;
  }

  /**
   * Initialize the agent (setup MCP connections, load resources)
   */
  async initialize() {
    this.state = 'initializing';
    try {
      this.emit('lifecycle', { phase: 'initialize', agentId: this.id, timestamp: new Date().toISOString() });
      
      // Connect to required MCP servers
      if (this.definition.mcpServers?.length > 0) {
        await this._connectMcpServers();
      }

      await this._onInitialize();
      this.state = 'ready';
      this.emit('lifecycle', { phase: 'ready', agentId: this.id });
    } catch (error) {
      this.state = 'error';
      this.emit('agent:error', { agentId: this.id, phase: 'initialize', error: error.message });
      throw error;
    }
  }

  /**
   * Validate input data against schema
   */
  validateInput(input) {
    if (!this.inputValidator) return { valid: true };
    
    const valid = this.inputValidator(input);
    if (!valid) {
      return {
        valid: false,
        errors: this.inputValidator.errors
      };
    }
    return { valid: true };
  }

  /**
   * Validate output data against schema
   */
  validateOutput(output) {
    if (!this.outputValidator) return { valid: true };
    
    const valid = this.outputValidator(output);
    if (!valid) {
      return {
        valid: false,
        errors: this.outputValidator.errors
      };
    }
    return { valid: true };
  }

  /**
   * Execute the agent with retry logic
   */
  async execute(input, context = {}) {
    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      this.state = 'executing';
      this.emit('lifecycle', { 
        phase: 'execute', 
        agentId: this.id, 
        executionId,
        timestamp: new Date().toISOString() 
      });

      // Validate input
      const validation = this.validateInput(input);
      if (!validation.valid) {
        throw new Error(`Input validation failed: ${JSON.stringify(validation.errors)}`);
      }

      // Execute with retry logic
      let lastError;
      for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
        try {
          const result = await this._executeWithTimeout(input, context, executionId);
          
          // Validate output
          const outputValidation = this.validateOutput(result);
          if (!outputValidation.valid) {
            throw new Error(`Output validation failed: ${JSON.stringify(outputValidation.errors)}`);
          }

          // Record successful execution
          const execution = {
            executionId,
            agentId: this.id,
            input,
            output: result,
            startTime,
            endTime: Date.now(),
            duration: Date.now() - startTime,
            attempt: attempt + 1,
            status: 'success'
          };
          this.executionHistory.push(execution);
          this.state = 'ready';
          
          this.emit('execution', execution);
          return result;

        } catch (error) {
          lastError = error;
          if (attempt < this.options.maxRetries) {
            const backoff = this.options.backoffMs * Math.pow(2, attempt);
            this.emit('retry', { 
              agentId: this.id, 
              executionId, 
              attempt: attempt + 1, 
              error: error.message,
              backoffMs: backoff 
            });
            await this._sleep(backoff);
          }
        }
      }

      // All retries failed
      throw lastError;

    } catch (error) {
      this.state = 'error';
      const execution = {
        executionId,
        agentId: this.id,
        input,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        status: 'error',
        error: error.message
      };
      this.executionHistory.push(execution);
      this.emit('agent:error', { agentId: this.id, executionId, error: error.message });
      throw error;
    }
  }

  /**
   * Execute with timeout wrapper
   */
  async _executeWithTimeout(input, context, executionId) {
    let timeoutHandle;
    const timeoutMs = this.options.timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error(`Execution timeout after ${timeoutMs}ms`)),
        timeoutMs
      );
    });

    try {
      return await Promise.race([
        this._onExecute(input, context, executionId),
        timeoutPromise
      ]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.emit('lifecycle', { phase: 'cleanup', agentId: this.id });
    
    // Disconnect MCP clients
    for (const [serverName, client] of this.mcpClients) {
      try {
        await client.disconnect();
      } catch (error) {
        console.warn(`Failed to disconnect from ${serverName}:`, error.message);
      }
    }
    this.mcpClients.clear();

    await this._onCleanup();
    this.state = 'stopped';
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      type: this.type,
      state: this.state,
      executionCount: this.executionHistory.length,
      successRate: this._calculateSuccessRate(),
      averageDuration: this._calculateAverageDuration(),
      mcpServers: Array.from(this.mcpClients.keys())
    };
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }

  // ===== Protected Methods (override in subclasses) =====

  /**
   * Override: Custom initialization logic
   */
  async _onInitialize() {
    // Subclasses can override
  }

  /**
   * Override: Core execution logic (MUST be implemented by subclasses)
   */
  async _onExecute(input, context, executionId) {
    throw new Error('_onExecute must be implemented by subclass');
  }

  /**
   * Override: Custom cleanup logic
   */
  async _onCleanup() {
    // Subclasses can override
  }

  // ===== Private Methods =====

  async _connectMcpServers() {
    for (const serverConfig of this.definition.mcpServers) {
      let client;
      try {
        client = await this._createToolClient(serverConfig);
        // Track the client before connecting so we can always clean up on failure.
        this.mcpClients.set(serverConfig.name, client);
        await client.connect?.();
      } catch (error) {
        try {
          await client?.disconnect?.();
        } catch {
          // ignore
        }
        this.mcpClients.delete(serverConfig.name);
        throw new Error(`Failed to connect to MCP server ${serverConfig.name}: ${error.message}`);
      }
    }
  }

  async _createToolClient(config) {
    const { ToolClientFactory } = await import('./tooling/ToolClientFactory.js');
    return ToolClientFactory.create(config);
  }

  _calculateSuccessRate() {
    if (this.executionHistory.length === 0) return 0;
    const successful = this.executionHistory.filter(e => e.status === 'success').length;
    return (successful / this.executionHistory.length) * 100;
  }

  _calculateAverageDuration() {
    if (this.executionHistory.length === 0) return 0;
    const total = this.executionHistory.reduce((sum, e) => sum + e.duration, 0);
    return total / this.executionHistory.length;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
