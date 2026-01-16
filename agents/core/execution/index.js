/**
 * ExecutionBridge Components (EB-01 through EB-06)
 * 
 * This module provides a unified execution layer for invoking agents
 * across different transport mechanisms (webhook, process, docker, MCP-stdio).
 * 
 * Components:
 * - TransportSelector (EB-01): Selects and validates transport configuration
 * - ExecutionContext (EB-02): Creates and manages execution context
 * - AgentInvoker (EB-03): Invokes agents using selected transport
 * - OutputCollector (EB-04): Captures and processes execution output
 * - LifecycleManager (EB-05): Manages complete execution lifecycle
 * - ResultHandler (EB-06): Processes results and updates orchestration
 */

import { TransportSelector, TRANSPORT_TYPES } from './TransportSelector.js';
import { ExecutionContext, ExecutionContextBuilder } from './ExecutionContext.js';
import { AgentInvoker, INVOCATION_TIMEOUT_ERROR, INVOCATION_ERROR } from './AgentInvoker.js';
import { OutputCollector } from './OutputCollector.js';
import { LifecycleManager, LIFECYCLE_PHASES, LIFECYCLE_STATUS } from './LifecycleManager.js';
import { ResultHandler, NEXT_ACTIONS } from './ResultHandler.js';

// Re-export all components
export { 
  TransportSelector, 
  TRANSPORT_TYPES,
  ExecutionContext, 
  ExecutionContextBuilder,
  AgentInvoker,
  INVOCATION_TIMEOUT_ERROR,
  INVOCATION_ERROR,
  OutputCollector,
  LifecycleManager,
  LIFECYCLE_PHASES,
  LIFECYCLE_STATUS,
  ResultHandler,
  NEXT_ACTIONS
};

/**
 * ExecutionBridge - High-level facade for the execution bridge
 * 
 * Combines all components into a simple interface for executing agents.
 */
export class ExecutionBridge {
  constructor(options = {}) {
    this.lifecycleManager = options.lifecycleManager || new LifecycleManager(options);
    this.resultHandler = options.resultHandler || new ResultHandler(options);
    
    // Connect result handler to lifecycle manager events
    this.lifecycleManager.on('lifecycle-complete', (result) => {
      this.resultHandler.handle(result, options.orchestrationState || {}, options)
        .catch(err => console.error('ResultHandler error:', err));
    });
  }

  /**
   * Execute an agent with full lifecycle and result handling
   */
  async execute(agent, phase, inputs, config = {}) {
    const executionResult = await this.lifecycleManager.execute(agent, phase, inputs, config);
    const handling = await this.resultHandler.handle(executionResult, config.orchestrationState || {}, config);
    
    return {
      ...executionResult,
      handling
    };
  }

  /**
   * Cancel an execution
   */
  async cancel(executionId) {
    return this.lifecycleManager.cancel(executionId);
  }

  /**
   * Get execution status
   */
  getStatus(executionId) {
    return this.lifecycleManager.getExecutionStatus(executionId);
  }

  /**
   * Get active executions
   */
  getActiveExecutions() {
    return this.lifecycleManager.getActiveExecutions();
  }

  /**
   * Get artifact by ID
   */
  getArtifact(artifactId) {
    return this.resultHandler.getArtifact(artifactId);
  }

  /**
   * Find artifacts
   */
  findArtifacts(filters) {
    return this.resultHandler.findArtifacts(filters);
  }

  /**
   * Set validation framework
   */
  setValidationFramework(validationFramework) {
    this.resultHandler.setValidationFramework(validationFramework);
  }
}
