import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * WorkflowEngine - Orchestrates multi-agent workflows
 * Executes workflows defined by workflow.schema.json
 */
export class WorkflowEngine extends EventEmitter {
  constructor(registry) {
    super();
    this.registry = registry;
    this.workflows = new Map(); // workflowId -> workflow definition
    this.executions = new Map(); // executionId -> execution state
  }

  /**
   * Register a workflow definition
   */
  registerWorkflow(workflow) {
    if (!workflow.id) {
      throw new Error('Workflow must have an id');
    }

    // Validate all referenced agents exist
    for (const step of workflow.steps) {
      if (!this.registry.has(step.agentId)) {
        throw new Error(`Agent ${step.agentId} not found in registry`);
      }
    }

    this.workflows.set(workflow.id, workflow);
    console.log(`Registered workflow: ${workflow.id} (${workflow.name} v${workflow.version})`);
  }

  /**
   * Execute a workflow
   */
  async execute(workflowId, initialInputs = {}, context = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = uuidv4();
    const execution = {
      executionId,
      workflowId,
      workflow,
      status: 'running',
      startTime: Date.now(),
      stepResults: new Map(),
      outputs: {},
      errors: []
    };

    this.executions.set(executionId, execution);
    this.emit('workflow:start', { executionId, workflowId, timestamp: new Date().toISOString() });

    try {
      // Build execution graph
      const executionOrder = this._buildExecutionOrder(workflow);
      
      // Execute steps in dependency order
      for (const stepId of executionOrder) {
        const step = workflow.steps.find(s => s.id === stepId);
        
        // Check if step should be skipped based on condition
        if (step.condition && !this._evaluateCondition(step.condition, execution.stepResults)) {
          console.log(`Skipping step ${stepId} due to condition: ${step.condition}`);
          execution.stepResults.set(stepId, {
            stepId,
            agentId: step.agentId,
            status: 'skipped',
            reason: 'condition',
            condition: step.condition,
            timestamp: new Date().toISOString()
          });

          this.emit('step:skipped', {
            executionId: execution.executionId,
            stepId,
            agentId: step.agentId,
            condition: step.condition
          });
          continue;
        }

        // Wait for dependencies
        await this._waitForDependencies(step, execution);

        // Prepare inputs
        const inputs = this._prepareInputs(step, execution.stepResults, initialInputs);

        // Execute step with retry logic
        await this._executeStep(step, inputs, context, execution);
      }

      // Prepare final outputs
      execution.outputs = this._prepareOutputs(workflow, execution.stepResults);
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      this.emit('workflow:complete', { 
        executionId, 
        workflowId, 
        outputs: execution.outputs,
        duration: execution.duration 
      });

      return {
        executionId,
        status: 'completed',
        outputs: execution.outputs,
        duration: execution.duration
      };

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      execution.error = error.message;

      this.emit('workflow:error', { 
        executionId, 
        workflowId, 
        error: error.message 
      });

      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  async _executeStep(step, inputs, context, execution) {
    const stepId = step.id;
    const agent = this.registry.get(step.agentId);
    
    this.emit('step:start', { 
      executionId: execution.executionId, 
      stepId, 
      agentId: step.agentId 
    });

    const maxRetries = step.retry?.maxRetries || 1;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await agent.execute(inputs, {
          ...context,
          workflowId: execution.workflowId,
          executionId: execution.executionId,
          stepId
        });

        execution.stepResults.set(stepId, {
          stepId,
          agentId: step.agentId,
          status: 'success',
          output: result,
          timestamp: new Date().toISOString()
        });

        this.emit('step:complete', { 
          executionId: execution.executionId, 
          stepId, 
          output: result 
        });

        return result;

      } catch (error) {
        lastError = error;
        this.emit('step:error', { 
          executionId: execution.executionId, 
          stepId, 
          attempt: attempt + 1,
          error: error.message 
        });

        if (attempt < maxRetries - 1) {
          const backoff = step.retry?.backoffMs || 1000;
          await this._sleep(backoff * Math.pow(2, attempt));
        }
      }
    }

    // Handle step failure
    execution.stepResults.set(stepId, {
      stepId,
      agentId: step.agentId,
      status: 'failed',
      error: lastError.message,
      timestamp: new Date().toISOString()
    });

    execution.errors.push({
      stepId,
      error: lastError.message
    });

    // Apply error handling strategy
    const errorStrategy = step.onError || execution.workflow.errorHandling?.strategy || 'stop';
    
    if (errorStrategy === 'stop') {
      throw new Error(`Step ${stepId} failed: ${lastError.message}`);
    } else if (errorStrategy === 'continue') {
      console.warn(`Step ${stepId} failed but continuing: ${lastError.message}`);
      return null;
    } else if (errorStrategy === 'retry') {
      throw new Error(`Step ${stepId} failed after ${maxRetries} retries: ${lastError.message}`);
    }
  }

  /**
   * Build execution order using topological sort
   */
  _buildExecutionOrder(workflow) {
    const steps = workflow.steps;
    const visited = new Set();
    const order = [];
    const visiting = new Set();

    const visit = (stepId) => {
      if (visited.has(stepId)) return;
      if (visiting.has(stepId)) {
        throw new Error(`Circular dependency detected at step ${stepId}`);
      }

      visiting.add(stepId);

      const step = steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error(`Step ${stepId} not found`);
      }

      // Visit dependencies first
      if (step.dependsOn) {
        for (const depId of step.dependsOn) {
          visit(depId);
        }
      }

      visiting.delete(stepId);
      visited.add(stepId);
      order.push(stepId);
    };

    // Visit all steps
    for (const step of steps) {
      visit(step.id);
    }

    return order;
  }

  /**
   * Wait for step dependencies to complete
   */
  async _waitForDependencies(step, execution) {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return;
    }

    for (const depId of step.dependsOn) {
      const depResult = execution.stepResults.get(depId);
      if (!depResult) {
        throw new Error(`Dependency ${depId} has not completed`);
      }
      if (depResult.status === 'failed') {
        throw new Error(`Dependency ${depId} failed`);
      }
      if (depResult.status === 'skipped') {
        throw new Error(`Dependency ${depId} was skipped`);
      }
    }
  }

  /**
   * Prepare inputs for a step
   */
  _prepareInputs(step, stepResults, initialInputs) {
    const inputs = {};

    // Resolve input references
    if (step.inputs) {
      for (const [key, value] of Object.entries(step.inputs)) {
        if (typeof value === 'string' && value.startsWith('$input.')) {
          // Reference to initial workflow inputs
          const path = value.substring(7); // Remove "$input."
          inputs[key] = this._resolvePath(initialInputs, path);
        } else if (typeof value === 'string' && value.startsWith('$steps.')) {
          // Reference to previous step outputs
          const path = value.substring(7); // Remove "$steps."
          const [stepId, ...rest] = path.split('.');
          const stepResult = stepResults.get(stepId);
          
          if (stepResult && stepResult.status === 'success') {
            inputs[key] = this._resolvePath(stepResult.output, rest.join('.'));
          }
        } else {
          // Literal value
          inputs[key] = value;
        }
      }
    }

    return inputs;
  }

  /**
   * Prepare final workflow outputs
   */
  _prepareOutputs(workflow, stepResults) {
    const outputs = {};

    if (!workflow.outputs) {
      return outputs;
    }

    for (const [key, value] of Object.entries(workflow.outputs)) {
      if (typeof value === 'string' && value.startsWith('$steps.')) {
        const path = value.substring(7);
        const [stepId, ...rest] = path.split('.');
        const stepResult = stepResults.get(stepId);
        
        if (stepResult && stepResult.status === 'success') {
          outputs[key] = this._resolvePath(stepResult.output, rest.join('.'));
        }
      } else {
        outputs[key] = value;
      }
    }

    return outputs;
  }

  /**
   * Evaluate a condition expression
   */
  _evaluateCondition(condition, stepResults) {
    // Simple condition evaluation
    // Example: "$steps.validate.output.isValid === true"
    try {
      // For safety, we'd use a sandboxed evaluator in production
      // For now, simple string replacement
      let expr = condition;
      
      for (const [stepId, result] of stepResults) {
        if (result.status === 'success') {
          const pattern = new RegExp(`\\$steps\\.${stepId}\\.output`, 'g');
          expr = expr.replace(pattern, JSON.stringify(result.output));
        }
      }

      // Use Function constructor for simple evaluation (not safe for production!)
      return new Function(`return ${expr}`)();
    } catch (error) {
      console.warn(`Failed to evaluate condition "${condition}":`, error.message);
      return false;
    }
  }

  /**
   * Resolve nested object path
   */
  _resolvePath(obj, path) {
    if (!path || path === '') return obj;
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (part === '' || part === 'output') continue; // Skip empty parts
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Get workflow execution status
   */
  getExecution(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    return {
      executionId: execution.executionId,
      workflowId: execution.workflowId,
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime,
      duration: execution.duration,
      stepResults: Array.from(execution.stepResults.values()),
      outputs: execution.outputs,
      errors: execution.errors
    };
  }

  /**
   * List all workflow executions
   */
  listExecutions(workflowId = null) {
    const executions = Array.from(this.executions.values());
    
    if (workflowId) {
      return executions
        .filter(e => e.workflowId === workflowId)
        .map(e => ({
          executionId: e.executionId,
          workflowId: e.workflowId,
          status: e.status,
          startTime: e.startTime,
          duration: e.duration
        }));
    }

    return executions.map(e => ({
      executionId: e.executionId,
      workflowId: e.workflowId,
      status: e.status,
      startTime: e.startTime,
      duration: e.duration
    }));
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
