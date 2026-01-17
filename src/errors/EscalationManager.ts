/**
 * EscalationManager
 * 
 * Routes critical errors to human review and handles escalation workflows.
 * Integrates with StateManager for decision logging.
 */

import {
  EscalationRequest,
  EscalationResponse,
  EscalationLevel,
  RecoveryStrategy,
  StructuredError,
  ErrorSeverity,
} from './types';
import { StateManager } from '../state/StateManager';

// =============================================================================
// Types
// =============================================================================

export interface EscalationHandler {
  /** Handler name */
  name: string;
  /** Minimum severity this handler accepts */
  minSeverity: ErrorSeverity;
  /** Maximum escalation level */
  maxLevel: EscalationLevel;
  /** Handle the escalation, return response or null to pass to next handler */
  handle(request: EscalationRequest): Promise<EscalationResponse | null>;
}

export interface EscalationManagerConfig {
  /** Enable automatic escalation */
  autoEscalate: boolean;
  /** Timeout for human response (ms) */
  humanResponseTimeoutMs: number;
  /** Default action on timeout */
  timeoutAction: RecoveryStrategy;
  /** Maximum escalations per execution */
  maxEscalationsPerExecution: number;
  /** Severities that trigger escalation */
  escalateSeverities: ErrorSeverity[];
}

export interface PendingEscalation {
  request: EscalationRequest;
  createdAt: Date;
  expiresAt: Date;
  resolved: boolean;
  response?: EscalationResponse;
}

const DEFAULT_CONFIG: EscalationManagerConfig = {
  autoEscalate: true,
  humanResponseTimeoutMs: 5 * 60 * 1000, // 5 minutes
  timeoutAction: 'abort',
  maxEscalationsPerExecution: 10,
  escalateSeverities: ['critical', 'fatal'],
};

// =============================================================================
// EscalationManager
// =============================================================================

export class EscalationManager {
  private config: EscalationManagerConfig;
  private stateManager: StateManager | null;
  private handlers: EscalationHandler[] = [];
  private pendingEscalations: Map<string, PendingEscalation> = new Map();
  private escalationCounts: Map<string, number> = new Map();

  constructor(
    stateManager?: StateManager,
    config?: Partial<EscalationManagerConfig>
  ) {
    this.stateManager = stateManager || null;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Register default handlers
    this.registerDefaultHandlers();
  }

  // ===========================================================================
  // Handler Registration
  // ===========================================================================

  /**
   * Register an escalation handler
   */
  registerHandler(handler: EscalationHandler): void {
    this.handlers.push(handler);
    // Sort by severity (lowest first, so most specific handlers run first)
    this.handlers.sort((a, b) => {
      const severityOrder: ErrorSeverity[] = ['debug', 'info', 'warning', 'error', 'critical', 'fatal'];
      return severityOrder.indexOf(a.minSeverity) - severityOrder.indexOf(b.minSeverity);
    });
  }

  /**
   * Remove an escalation handler
   */
  unregisterHandler(name: string): boolean {
    const index = this.handlers.findIndex(h => h.name === name);
    if (index >= 0) {
      this.handlers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get registered handlers
   */
  getHandlers(): EscalationHandler[] {
    return [...this.handlers];
  }

  // ===========================================================================
  // Escalation
  // ===========================================================================

  /**
   * Create an escalation request from a structured error
   */
  createEscalationRequest(
    error: StructuredError,
    options: string[] = []
  ): EscalationRequest {
    const level = this.determineEscalationLevel(error);
    
    return {
      id: crypto.randomUUID(),
      error,
      level,
      timestamp: new Date().toISOString(),
      context: {
        executionId: error.context.executionId,
        phase: error.context.phase,
        agent: error.context.agent,
        operation: error.context.operation,
      },
      options: options.length > 0 ? options : this.generateOptions(error, level),
    };
  }

  /**
   * Escalate an error
   */
  async escalate(request: EscalationRequest): Promise<EscalationResponse> {
    // Check escalation limits
    if (request.context.executionId) {
      const count = this.escalationCounts.get(request.context.executionId) || 0;
      if (count >= this.config.maxEscalationsPerExecution) {
        return {
          requestId: request.id,
          action: 'abort',
          decidedBy: 'system',
          timestamp: new Date().toISOString(),
          reason: 'Maximum escalation limit reached',
        };
      }
      this.escalationCounts.set(request.context.executionId, count + 1);
    }

    // Try handlers in order
    for (const handler of this.handlers) {
      if (this.handlerMatches(handler, request)) {
        const response = await handler.handle(request);
        if (response) {
          await this.logEscalation(request, response);
          return response;
        }
      }
    }

    // No handler matched - create pending escalation for human review
    return this.createPendingEscalation(request);
  }

  /**
   * Check if error should be escalated
   */
  shouldEscalate(error: StructuredError): boolean {
    if (!this.config.autoEscalate) {
      return false;
    }

    const severity = error.classification.severity;
    return this.config.escalateSeverities.includes(severity);
  }

  /**
   * Escalate a structured error (convenience method)
   */
  async escalateError(
    error: StructuredError,
    options?: string[]
  ): Promise<EscalationResponse> {
    const request = this.createEscalationRequest(error, options);
    return this.escalate(request);
  }

  // ===========================================================================
  // Pending Escalations
  // ===========================================================================

  /**
   * Get pending escalations awaiting human response
   */
  getPendingEscalations(): PendingEscalation[] {
    const pending: PendingEscalation[] = [];
    const now = new Date();
    
    for (const escalation of this.pendingEscalations.values()) {
      if (!escalation.resolved && escalation.expiresAt > now) {
        pending.push(escalation);
      }
    }
    
    return pending;
  }

  /**
   * Respond to a pending escalation
   */
  async respondToEscalation(
    requestId: string,
    action: RecoveryStrategy,
    reason?: string
  ): Promise<EscalationResponse | null> {
    const pending = this.pendingEscalations.get(requestId);
    if (!pending || pending.resolved) {
      return null;
    }

    const response: EscalationResponse = {
      requestId,
      action,
      decidedBy: 'human',
      timestamp: new Date().toISOString(),
      reason,
    };

    pending.resolved = true;
    pending.response = response;

    await this.logEscalation(pending.request, response);

    return response;
  }

  /**
   * Check for expired escalations and apply timeout action
   */
  async processExpiredEscalations(): Promise<EscalationResponse[]> {
    const responses: EscalationResponse[] = [];
    const now = new Date();

    for (const [id, pending] of this.pendingEscalations) {
      if (!pending.resolved && pending.expiresAt <= now) {
        const response: EscalationResponse = {
          requestId: id,
          action: this.config.timeoutAction,
          decidedBy: 'system',
          timestamp: new Date().toISOString(),
          reason: 'Escalation timed out',
        };

        pending.resolved = true;
        pending.response = response;

        await this.logEscalation(pending.request, response);
        responses.push(response);
      }
    }

    return responses;
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Determine escalation level based on error
   */
  private determineEscalationLevel(error: StructuredError): EscalationLevel {
    switch (error.classification.severity) {
      case 'fatal':
        return 'human';
      case 'critical':
        return 'team';
      case 'error':
        return 'supervisor';
      default:
        return 'auto';
    }
  }

  /**
   * Generate recovery options for an escalation
   */
  private generateOptions(
    error: StructuredError,
    level: EscalationLevel
  ): string[] {
    const options: string[] = [];
    const { category, isRetryable } = error.classification;

    // Always offer abort
    options.push('Abort execution');

    // Offer retry if applicable
    if (isRetryable) {
      options.push('Retry operation');
    }

    // Offer skip for non-critical
    if (category !== 'critical') {
      options.push('Skip and continue');
    }

    // Offer rollback if state is available
    if (level !== 'auto' && error.context.phase && error.context.phase > 1) {
      options.push('Rollback to previous phase');
    }

    // Offer wait for transient errors
    if (category === 'transient') {
      options.push('Wait and retry');
    }

    return options;
  }

  /**
   * Check if handler matches the escalation request
   */
  private handlerMatches(
    handler: EscalationHandler,
    request: EscalationRequest
  ): boolean {
    const severityOrder: ErrorSeverity[] = ['debug', 'info', 'warning', 'error', 'critical', 'fatal'];
    const requestSeverity = request.error.classification.severity;
    
    // Handler must accept this severity level
    const handlerSeverityIndex = severityOrder.indexOf(handler.minSeverity);
    const requestSeverityIndex = severityOrder.indexOf(requestSeverity);
    
    if (requestSeverityIndex < handlerSeverityIndex) {
      return false;
    }

    // Handler must accept this escalation level
    const levelOrder: EscalationLevel[] = ['auto', 'supervisor', 'team', 'human'];
    const handlerLevelIndex = levelOrder.indexOf(handler.maxLevel);
    const requestLevelIndex = levelOrder.indexOf(request.level);
    
    return requestLevelIndex <= handlerLevelIndex;
  }

  /**
   * Create a pending escalation for human review
   */
  private createPendingEscalation(request: EscalationRequest): EscalationResponse {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.humanResponseTimeoutMs);

    const pending: PendingEscalation = {
      request,
      createdAt: now,
      expiresAt,
      resolved: false,
    };

    this.pendingEscalations.set(request.id, pending);

    // Return a "waiting" response
    return {
      requestId: request.id,
      action: 'wait',
      decidedBy: 'system',
      timestamp: now.toISOString(),
      reason: `Awaiting human response (expires at ${expiresAt.toISOString()})`,
    };
  }

  /**
   * Log escalation to StateManager
   */
  private async logEscalation(
    request: EscalationRequest,
    response: EscalationResponse
  ): Promise<void> {
    if (!this.stateManager || !request.context.executionId) {
      return;
    }

    try {
      // Log escalation decision to console
      // Note: In future, integrate with StateManager.execution when logDecision is available
      console.log(`[Escalation] ${request.context.executionId}: ${request.error.error.message} -> ${response.action} (by ${response.decidedBy})`);
    } catch (error) {
      // Don't fail escalation if logging fails
      console.error('Failed to log escalation:', error);
    }
  }

  /**
   * Register default handlers
   */
  private registerDefaultHandlers(): void {
    // Auto-handler for retryable errors at 'auto' level
    this.registerHandler({
      name: 'auto-retry',
      minSeverity: 'warning',
      maxLevel: 'auto',
      handle: async (request) => {
        if (
          request.level === 'auto' &&
          request.error.classification.isRetryable
        ) {
          return {
            requestId: request.id,
            action: 'retry',
            decidedBy: 'system',
            timestamp: new Date().toISOString(),
            reason: 'Automatic retry for retryable error',
          };
        }
        return null;
      },
    });

    // Auto-handler for validation errors - skip
    this.registerHandler({
      name: 'auto-skip-validation',
      minSeverity: 'warning',
      maxLevel: 'auto',
      handle: async (request) => {
        if (
          request.level === 'auto' &&
          request.error.classification.category === 'validation' &&
          request.error.classification.severity === 'warning'
        ) {
          return {
            requestId: request.id,
            action: 'skip',
            decidedBy: 'system',
            timestamp: new Date().toISOString(),
            reason: 'Automatic skip for non-critical validation warning',
          };
        }
        return null;
      },
    });
  }

  /**
   * Get configuration
   */
  getConfig(): EscalationManagerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EscalationManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear pending escalations
   */
  clearPendingEscalations(): void {
    this.pendingEscalations.clear();
  }

  /**
   * Reset escalation counts
   */
  resetEscalationCounts(): void {
    this.escalationCounts.clear();
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create an EscalationManager instance
 */
export function createEscalationManager(
  stateManager?: StateManager,
  config?: Partial<EscalationManagerConfig>
): EscalationManager {
  return new EscalationManager(stateManager, config);
}
