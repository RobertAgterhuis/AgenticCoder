/**
 * Circuit Breaker
 * 
 * Prevents cascading failures by stopping requests to failing servers
 * @module mcp/health/CircuitBreaker
 */

import { EventEmitter } from 'events';
import { Logger, createLogger } from '../utils/Logger';
import { CircuitBreakerOpenError } from '../errors/MCPError';

/**
 * Circuit breaker states
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time to wait before transitioning to half-open (ms) */
  resetTimeoutMs: number;
  /** Number of successful calls in half-open to close circuit */
  successThreshold: number;
  /** Max calls allowed in half-open state */
  halfOpenMaxCalls: number;
  /** Time window for counting failures (ms) */
  failureWindowMs?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  successThreshold: 3,
  halfOpenMaxCalls: 3,
  failureWindowMs: 60000,
};

/**
 * Failure record
 */
interface FailureRecord {
  timestamp: Date;
  error: string;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailure: Date | null;
  lastStateChange: Date;
  openCount: number;
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker extends EventEmitter {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState = 'closed';
  private failures: FailureRecord[] = [];
  private successCount: number = 0;
  private halfOpenCalls: number = 0;
  private lastStateChange: Date = new Date();
  private resetTimer: NodeJS.Timeout | null = null;
  private totalCalls: number = 0;
  private openCount: number = 0;
  private logger: Logger;
  private name: string;

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    super();
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = createLogger(`CircuitBreaker:${name}`);
  }

  /**
   * Check if execution is allowed
   */
  canExecute(): boolean {
    this.cleanupOldFailures();

    switch (this.state) {
      case 'closed':
        return true;
      case 'open':
        return false;
      case 'half-open':
        return this.halfOpenCalls < this.config.halfOpenMaxCalls;
      default:
        return false;
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      const resetTime = this.resetTimer 
        ? new Date(Date.now() + this.config.resetTimeoutMs)
        : new Date();
      throw new CircuitBreakerOpenError(this.name, resetTime);
    }

    this.totalCalls++;

    if (this.state === 'half-open') {
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error as Error);
      throw error;
    }
  }

  /**
   * Record a successful call
   */
  recordSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount++;
      this.logger.debug(`Success in half-open state`, {
        successCount: this.successCount,
        threshold: this.config.successThreshold,
      });

      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('closed');
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success
      this.failures = [];
    }
  }

  /**
   * Record a failed call
   */
  recordFailure(error?: Error): void {
    const record: FailureRecord = {
      timestamp: new Date(),
      error: error?.message || 'Unknown error',
    };

    this.failures.push(record);
    this.logger.debug(`Recorded failure`, {
      error: record.error,
      failureCount: this.failures.length,
    });

    if (this.state === 'half-open') {
      // Any failure in half-open goes back to open
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      this.cleanupOldFailures();
      
      if (this.failures.length >= this.config.failureThreshold) {
        this.transitionTo('open');
      }
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failures.length,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailure: this.failures.length > 0 
        ? this.failures[this.failures.length - 1].timestamp 
        : null,
      lastStateChange: this.lastStateChange,
      openCount: this.openCount,
    };
  }

  /**
   * Force circuit to close
   */
  forceClose(): void {
    this.transitionTo('closed');
  }

  /**
   * Force circuit to open
   */
  forceOpen(): void {
    this.transitionTo('open');
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.clearResetTimer();
    this.state = 'closed';
    this.failures = [];
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.lastStateChange = new Date();
    this.logger.info('Circuit breaker reset');
    this.emit('reset');
  }

  /**
   * Destroy the circuit breaker
   */
  destroy(): void {
    this.clearResetTimer();
    this.removeAllListeners();
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.clearResetTimer();

    this.state = newState;
    this.lastStateChange = new Date();

    switch (newState) {
      case 'closed':
        this.failures = [];
        this.successCount = 0;
        this.halfOpenCalls = 0;
        this.logger.info('Circuit closed');
        break;

      case 'open':
        this.openCount++;
        this.successCount = 0;
        this.halfOpenCalls = 0;
        this.scheduleReset();
        this.logger.warn('Circuit opened', {
          failureCount: this.failures.length,
          resetTimeout: this.config.resetTimeoutMs,
        });
        break;

      case 'half-open':
        this.successCount = 0;
        this.halfOpenCalls = 0;
        this.logger.info('Circuit half-open');
        break;
    }

    this.emit('stateChange', { from: oldState, to: newState });
  }

  /**
   * Schedule transition to half-open
   */
  private scheduleReset(): void {
    this.resetTimer = setTimeout(() => {
      this.transitionTo('half-open');
    }, this.config.resetTimeoutMs);
  }

  /**
   * Clear reset timer
   */
  private clearResetTimer(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Cleanup old failures outside the window
   */
  private cleanupOldFailures(): void {
    if (!this.config.failureWindowMs) return;

    const cutoff = Date.now() - this.config.failureWindowMs;
    this.failures = this.failures.filter(f => f.timestamp.getTime() > cutoff);
  }
}

/**
 * Create a circuit breaker
 */
export function createCircuitBreaker(
  config?: Partial<CircuitBreakerConfig>,
  name: string = 'default'
): CircuitBreaker {
  return new CircuitBreaker(name, config);
}
