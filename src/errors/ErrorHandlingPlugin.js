/**
 * ErrorHandlingPlugin
 * 
 * JavaScript plugin for WorkflowEngine.js that provides error handling integration.
 * Connects ErrorClassifier, RollbackManager, EscalationManager, and ErrorReporter.
 */

/**
 * @typedef {Object} ErrorHandlerPluginConfig
 * @property {boolean} autoClassify - Automatically classify errors
 * @property {boolean} autoRollback - Automatically rollback on errors
 * @property {boolean} autoEscalate - Automatically escalate critical errors
 * @property {boolean} reportErrors - Generate user-friendly error reports
 * @property {number[]} rollbackPhases - Phases to create rollback points
 */

/**
 * @typedef {Object} ErrorContext
 * @property {string} [executionId]
 * @property {number} [phase]
 * @property {string} [agent]
 * @property {string} [operation]
 */

// Note: This plugin uses dynamic imports to load TypeScript modules
// The actual modules are in src/errors/

/**
 * Creates an Error Handling Plugin for WorkflowEngine.js
 * 
 * @param {Object} options - Plugin configuration
 * @param {Object} [options.stateManager] - StateManager instance for rollback support
 * @param {ErrorHandlerPluginConfig} [options.config] - Error handling configuration
 * @returns {Object} WorkflowEngine plugin
 */
function createErrorHandlingPlugin(options = {}) {
  const {
    stateManager = null,
    config = {}
  } = options;

  // Default configuration
  const pluginConfig = {
    autoClassify: true,
    autoRollback: true,
    autoEscalate: true,
    reportErrors: true,
    rollbackPhases: [1, 3, 5, 7, 9, 11, 13, 15],
    ...config
  };

  // Module instances (lazy loaded)
  let errorClassifier = null;
  let rollbackManager = null;
  let escalationManager = null;
  let errorReporter = null;

  // Error tracking
  const errorHistory = new Map(); // executionId -> errors[]
  const rollbackPoints = new Map(); // executionId -> rollbackPointIds[]

  /**
   * Initialize error handling modules
   */
  async function initializeModules() {
    if (errorClassifier) return; // Already initialized

    try {
      // Dynamic import of TypeScript modules (compiled to JS)
      const { ErrorClassifier } = await import('./ErrorClassifier.js');
      const { RollbackManager } = await import('./RollbackManager.js');
      const { EscalationManager } = await import('./EscalationManager.js');
      const { ErrorReporter } = await import('./ErrorReporter.js');

      errorClassifier = new ErrorClassifier();
      errorReporter = new ErrorReporter(errorClassifier);

      if (stateManager) {
        rollbackManager = new RollbackManager(stateManager, {
          autoRollback: pluginConfig.autoRollback,
          rollbackPhases: pluginConfig.rollbackPhases,
        });
        escalationManager = new EscalationManager(stateManager, {
          autoEscalate: pluginConfig.autoEscalate,
        });
      }
    } catch (error) {
      console.warn('Error handling modules not available, using fallback:', error.message);
      // Use fallback implementations
      errorClassifier = createFallbackClassifier();
      errorReporter = createFallbackReporter();
    }
  }

  /**
   * Fallback classifier when modules aren't available
   */
  function createFallbackClassifier() {
    return {
      classify: (error) => ({
        category: 'unknown',
        severity: 'error',
        isRetryable: false,
        suggestedRecovery: { strategy: 'none', description: 'No recovery available' },
      }),
      createStructuredError: (error, executionId, phase) => ({
        id: crypto.randomUUID?.() || Date.now().toString(),
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error : new Error(String(error)),
        classification: {
          category: 'unknown',
          severity: 'error',
          isRetryable: false,
          suggestedRecovery: { strategy: 'none', description: 'No recovery available' },
        },
        context: { executionId, phase },
        stackTrace: error instanceof Error ? error.stack : undefined,
      }),
      isRetryable: () => false,
    };
  }

  /**
   * Fallback reporter when modules aren't available
   */
  function createFallbackReporter() {
    return {
      createReportFromError: (error, executionId, phase) => ({
        id: crypto.randomUUID?.() || Date.now().toString(),
        timestamp: new Date().toISOString(),
        title: error instanceof Error ? error.name : 'Error',
        summary: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.message : String(error),
        category: 'unknown',
        severity: 'error',
        suggestedActions: ['Check error details', 'Retry operation'],
        affectedPhase: phase,
        technicalDetails: error instanceof Error ? error.stack : undefined,
      }),
      format: (report) => ({
        format: 'plain',
        content: `${report.title}\n${report.summary}`,
        error: null,
      }),
    };
  }

  /**
   * Handle an error through the error handling pipeline
   */
  async function handleError(error, context = {}) {
    await initializeModules();

    const { executionId, phase, agent, operation } = context;

    // 1. Classify the error
    const structuredError = errorClassifier.createStructuredError(
      error,
      executionId,
      phase
    );

    // Add additional context
    structuredError.context.agent = agent;
    structuredError.context.operation = operation;

    // 2. Track in history
    if (executionId) {
      const history = errorHistory.get(executionId) || [];
      history.push(structuredError);
      errorHistory.set(executionId, history);
    }

    // 3. Check if retryable
    const isRetryable = errorClassifier.isRetryable(error);

    // 4. Generate report if configured
    let report = null;
    if (pluginConfig.reportErrors) {
      report = errorReporter.createReportFromError(error, executionId, phase);
    }

    // 5. Handle escalation for critical/fatal errors
    let escalationResult = null;
    if (
      pluginConfig.autoEscalate &&
      escalationManager &&
      ['critical', 'fatal'].includes(structuredError.classification.severity)
    ) {
      escalationResult = await escalationManager.escalateError(structuredError);
    }

    // 6. Handle rollback if needed
    let rollbackResult = null;
    if (
      pluginConfig.autoRollback &&
      rollbackManager &&
      structuredError.classification.suggestedRecovery.strategy === 'rollback'
    ) {
      rollbackResult = await rollbackManager.handleErrorWithRollback(structuredError);
    }

    return {
      structuredError,
      isRetryable,
      report,
      escalationResult,
      rollbackResult,
      shouldContinue: !['critical', 'fatal'].includes(structuredError.classification.severity),
    };
  }

  /**
   * Create a rollback point at current state
   */
  async function createRollbackPoint(executionId) {
    if (!rollbackManager) {
      console.warn('RollbackManager not available');
      return null;
    }

    try {
      const point = await rollbackManager.createRollbackPoint(executionId);
      
      // Track rollback point
      const points = rollbackPoints.get(executionId) || [];
      points.push(point.id);
      rollbackPoints.set(executionId, points);

      return point;
    } catch (error) {
      console.error('Failed to create rollback point:', error.message);
      return null;
    }
  }

  /**
   * Rollback to a previous state
   */
  async function rollback(executionId, rollbackPointId) {
    if (!rollbackManager) {
      return { success: false, error: 'RollbackManager not available' };
    }

    if (rollbackPointId) {
      return rollbackManager.rollback(rollbackPointId);
    }

    return rollbackManager.rollbackToLatest(executionId);
  }

  /**
   * Get error history for an execution
   */
  function getErrorHistory(executionId) {
    return errorHistory.get(executionId) || [];
  }

  /**
   * Get pending escalations
   */
  function getPendingEscalations() {
    if (!escalationManager) {
      return [];
    }
    return escalationManager.getPendingEscalations();
  }

  /**
   * Respond to a pending escalation
   */
  async function respondToEscalation(requestId, action, reason) {
    if (!escalationManager) {
      return null;
    }
    return escalationManager.respondToEscalation(requestId, action, reason);
  }

  // =========================================================================
  // WorkflowEngine Plugin Interface
  // =========================================================================

  return {
    name: 'ErrorHandlingPlugin',
    version: '1.0.0',

    /**
     * Called when plugin is registered
     */
    async onRegister(engine) {
      await initializeModules();
      console.log('ErrorHandlingPlugin registered');
    },

    /**
     * Called when workflow starts
     */
    async onWorkflowStart(context) {
      const { executionId } = context;
      
      // Initialize error tracking for this execution
      errorHistory.set(executionId, []);
      rollbackPoints.set(executionId, []);
    },

    /**
     * Called before each phase
     */
    async onPhaseStart(context) {
      const { executionId, phase } = context;

      // Create rollback point if configured for this phase
      if (rollbackManager?.shouldCreateRollbackPoint(phase)) {
        await createRollbackPoint(executionId);
      }
    },

    /**
     * Called after each phase completes
     */
    async onPhaseComplete(context) {
      // Nothing special needed here
    },

    /**
     * Called when a phase fails
     */
    async onPhaseError(context) {
      const { executionId, phase, agent, error } = context;

      const result = await handleError(error, {
        executionId,
        phase,
        agent,
        operation: `Phase ${phase}`,
      });

      // Log the error report
      if (result.report && pluginConfig.reportErrors) {
        const formatted = errorReporter.format(result.report, 'console');
        console.error(formatted.content);
      }

      // Return result so workflow can decide what to do
      return result;
    },

    /**
     * Called when workflow completes
     */
    async onWorkflowComplete(context) {
      const { executionId } = context;

      // Get final error summary
      const errors = getErrorHistory(executionId);
      if (errors.length > 0) {
        console.log(`Workflow ${executionId} completed with ${errors.length} error(s)`);
      }
    },

    /**
     * Called when workflow fails
     */
    async onWorkflowError(context) {
      const { executionId, error } = context;

      // Final error handling
      const result = await handleError(error, {
        executionId,
        operation: 'Workflow',
      });

      if (result.report && pluginConfig.reportErrors) {
        const formatted = errorReporter.format(result.report, 'console');
        console.error(formatted.content);
      }

      return result;
    },

    // =========================================================================
    // Public API
    // =========================================================================

    /**
     * Manually handle an error
     */
    handleError,

    /**
     * Create a rollback point
     */
    createRollbackPoint,

    /**
     * Perform a rollback
     */
    rollback,

    /**
     * Get error history
     */
    getErrorHistory,

    /**
     * Get pending escalations
     */
    getPendingEscalations,

    /**
     * Respond to escalation
     */
    respondToEscalation,

    /**
     * Format an error for display
     */
    async formatError(error, format = 'console') {
      await initializeModules();
      const report = errorReporter.createReportFromError(error);
      return errorReporter.format(report, format).content;
    },

    /**
     * Check if error is retryable
     */
    async isRetryable(error) {
      await initializeModules();
      return errorClassifier.isRetryable(error);
    },

    /**
     * Get plugin configuration
     */
    getConfig() {
      return { ...pluginConfig };
    },

    /**
     * Update plugin configuration
     */
    updateConfig(newConfig) {
      Object.assign(pluginConfig, newConfig);
    },
  };
}

module.exports = {
  createErrorHandlingPlugin,
};
