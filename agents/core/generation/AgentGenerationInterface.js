/**
 * AgentGenerationInterface.js
 * 
 * Interface that allows agents to request code generation through the orchestration engine.
 * Provides message bus integration for async request/response pattern.
 * 
 * @module agents/core/generation/AgentGenerationInterface
 */

const crypto = require('crypto');

class AgentGenerationInterface {
  /**
   * Create an Agent Generation Interface
   * @param {CodeGenerationEngine} codeGenerationEngine - The code generation engine
   * @param {MessageBus} messageBus - The message bus for agent communication
   */
  constructor(codeGenerationEngine, messageBus) {
    this.engine = codeGenerationEngine;
    this.messageBus = messageBus;
    this.pendingRequests = new Map();
    this.progressCallbacks = new Map();
    
    this.setupMessageHandlers();
  }

  /**
   * Setup message handlers for generation events
   */
  setupMessageHandlers() {
    // Listen for generation requests from agents
    this.messageBus.subscribe('generation:request', this.handleRequest.bind(this));
    this.messageBus.subscribe('generation:file', this.handleFileRequest.bind(this));
    this.messageBus.subscribe('generation:batch', this.handleBatchRequest.bind(this));
    this.messageBus.subscribe('generation:cancel', this.handleCancelRequest.bind(this));
  }

  /**
   * Handle full project generation request
   * @param {Object} message - The generation request message
   */
  async handleRequest(message) {
    const { agentId, context, options = {} } = message;
    
    try {
      // Notify start
      this.messageBus.publish('generation:started', {
        requestId: message.id,
        agentId,
        timestamp: new Date().toISOString(),
      });

      // Track progress
      const progressHandler = (progress) => {
        this.messageBus.publish('generation:progress', {
          requestId: message.id,
          agentId,
          progress,
        });
      };

      // Generate code
      const result = await this.engine.generate(context, {
        ...options,
        onProgress: progressHandler,
      });
      
      this.messageBus.publish('generation:complete', {
        requestId: message.id,
        agentId,
        result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.messageBus.publish('generation:error', {
        requestId: message.id,
        agentId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle single file generation request
   * @param {Object} message - The file generation request message
   */
  async handleFileRequest(message) {
    const { agentId, context, fileSpec } = message;
    
    try {
      const result = await this.engine.generateFile(context, fileSpec);
      
      this.messageBus.publish('generation:file:complete', {
        requestId: message.id,
        agentId,
        file: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.messageBus.publish('generation:file:error', {
        requestId: message.id,
        agentId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle batch file generation request
   * @param {Object} message - The batch generation request message
   */
  async handleBatchRequest(message) {
    const { agentId, context, fileSpecs } = message;
    const results = [];
    const errors = [];
    
    for (let i = 0; i < fileSpecs.length; i++) {
      try {
        const result = await this.engine.generateFile(context, fileSpecs[i]);
        results.push(result);
        
        // Report progress
        this.messageBus.publish('generation:batch:progress', {
          requestId: message.id,
          agentId,
          current: i + 1,
          total: fileSpecs.length,
          file: result.path,
        });
      } catch (error) {
        errors.push({
          spec: fileSpecs[i],
          error: error.message,
        });
      }
    }
    
    this.messageBus.publish('generation:batch:complete', {
      requestId: message.id,
      agentId,
      results,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle cancel request
   * @param {Object} message - The cancel request message
   */
  handleCancelRequest(message) {
    const { requestId } = message;
    
    if (this.pendingRequests.has(requestId)) {
      const pending = this.pendingRequests.get(requestId);
      pending.cancelled = true;
      this.pendingRequests.delete(requestId);
      
      this.messageBus.publish('generation:cancelled', {
        requestId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Request generation (for agent use) - Promise-based API
   * @param {string} agentId - The requesting agent's ID
   * @param {Object} context - The generation context
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} The generation result
   */
  async requestGeneration(agentId, context, options = {}) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      
      // Store pending request
      this.pendingRequests.set(requestId, {
        agentId,
        resolve,
        reject,
        startTime: Date.now(),
        cancelled: false,
      });

      // Setup response handlers
      const completeHandler = (message) => {
        if (message.requestId === requestId) {
          this.cleanup(requestId, completeHandler, errorHandler);
          resolve(message.result);
        }
      };
      
      const errorHandler = (message) => {
        if (message.requestId === requestId) {
          this.cleanup(requestId, completeHandler, errorHandler);
          reject(new Error(message.error));
        }
      };
      
      this.messageBus.subscribe('generation:complete', completeHandler);
      this.messageBus.subscribe('generation:error', errorHandler);
      
      // Apply timeout if specified
      if (options.timeout) {
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.cleanup(requestId, completeHandler, errorHandler);
            reject(new Error(`Generation timeout after ${options.timeout}ms`));
          }
        }, options.timeout);
      }
      
      // Publish the request
      this.messageBus.publish('generation:request', {
        id: requestId,
        agentId,
        context,
        options,
      });
    });
  }

  /**
   * Request single file generation (for agent use)
   * @param {string} agentId - The requesting agent's ID
   * @param {Object} context - The generation context
   * @param {Object} fileSpec - The file specification
   * @returns {Promise<Object>} The generated file
   */
  async requestFileGeneration(agentId, context, fileSpec) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      
      const completeHandler = (message) => {
        if (message.requestId === requestId) {
          this.messageBus.unsubscribe('generation:file:complete', completeHandler);
          this.messageBus.unsubscribe('generation:file:error', errorHandler);
          resolve(message.file);
        }
      };
      
      const errorHandler = (message) => {
        if (message.requestId === requestId) {
          this.messageBus.unsubscribe('generation:file:complete', completeHandler);
          this.messageBus.unsubscribe('generation:file:error', errorHandler);
          reject(new Error(message.error));
        }
      };
      
      this.messageBus.subscribe('generation:file:complete', completeHandler);
      this.messageBus.subscribe('generation:file:error', errorHandler);
      
      this.messageBus.publish('generation:file', {
        id: requestId,
        agentId,
        context,
        fileSpec,
      });
    });
  }

  /**
   * Request batch file generation (for agent use)
   * @param {string} agentId - The requesting agent's ID
   * @param {Object} context - The generation context
   * @param {Array<Object>} fileSpecs - Array of file specifications
   * @param {Function} onProgress - Optional progress callback
   * @returns {Promise<Object>} The batch generation result
   */
  async requestBatchGeneration(agentId, context, fileSpecs, onProgress = null) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      
      const progressHandler = (message) => {
        if (message.requestId === requestId && onProgress) {
          onProgress(message);
        }
      };
      
      const completeHandler = (message) => {
        if (message.requestId === requestId) {
          this.messageBus.unsubscribe('generation:batch:complete', completeHandler);
          this.messageBus.unsubscribe('generation:batch:progress', progressHandler);
          resolve(message);
        }
      };
      
      this.messageBus.subscribe('generation:batch:complete', completeHandler);
      this.messageBus.subscribe('generation:batch:progress', progressHandler);
      
      this.messageBus.publish('generation:batch', {
        id: requestId,
        agentId,
        context,
        fileSpecs,
      });
    });
  }

  /**
   * Cancel a pending generation request
   * @param {string} requestId - The request ID to cancel
   */
  cancelRequest(requestId) {
    this.messageBus.publish('generation:cancel', { requestId });
  }

  /**
   * Subscribe to generation progress for a specific request
   * @param {string} requestId - The request ID
   * @param {Function} callback - Progress callback
   */
  onProgress(requestId, callback) {
    this.progressCallbacks.set(requestId, callback);
    
    const handler = (message) => {
      if (message.requestId === requestId) {
        callback(message.progress);
      }
    };
    
    this.messageBus.subscribe('generation:progress', handler);
    return () => this.messageBus.unsubscribe('generation:progress', handler);
  }

  /**
   * Get status of a pending request
   * @param {string} requestId - The request ID
   * @returns {Object|null} Request status or null if not found
   */
  getRequestStatus(requestId) {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) return null;
    
    return {
      agentId: pending.agentId,
      elapsedTime: Date.now() - pending.startTime,
      cancelled: pending.cancelled,
    };
  }

  /**
   * Get all pending requests
   * @returns {Array<Object>} Array of pending request statuses
   */
  getPendingRequests() {
    const requests = [];
    for (const [requestId, pending] of this.pendingRequests) {
      requests.push({
        requestId,
        ...this.getRequestStatus(requestId),
      });
    }
    return requests;
  }

  /**
   * Cleanup handlers after request completion
   * @private
   */
  cleanup(requestId, completeHandler, errorHandler) {
    this.pendingRequests.delete(requestId);
    this.progressCallbacks.delete(requestId);
    this.messageBus.unsubscribe('generation:complete', completeHandler);
    this.messageBus.unsubscribe('generation:error', errorHandler);
  }

  /**
   * Shutdown the interface
   */
  shutdown() {
    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      pending.reject(new Error('AgentGenerationInterface shutting down'));
    }
    this.pendingRequests.clear();
    this.progressCallbacks.clear();
  }
}

module.exports = AgentGenerationInterface;
