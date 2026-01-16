# Phase 2: Retry & Circuit Breaker

**Phase ID:** F-EHR-P02  
**Feature:** ErrorHandlingRecovery  
**Duration:** 4-5 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 1 (Error Classification)

---

## 🎯 Phase Objectives

Deze phase implementeert **Smart Retry en Circuit Breaker**:
- Exponential backoff retry strategy
- Configurable retry policies
- Circuit breaker pattern voor failure isolation
- Bulkhead pattern voor resource isolation
- Timeout management

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── retry/
│   ├── RetryManager.ts
│   ├── RetryPolicy.ts
│   ├── BackoffStrategy.ts
│   └── RetryContext.ts
├── circuit-breaker/
│   ├── CircuitBreaker.ts
│   ├── CircuitState.ts
│   ├── BreakerRegistry.ts
│   └── Bulkhead.ts
└── timeout/
    ├── TimeoutManager.ts
    └── DeadlineTracker.ts
```

---

## 🔧 Implementation Details

### 2.1 Backoff Strategy (`src/retry/BackoffStrategy.ts`)

```typescript
/**
 * Backoff strategy types
 */
export type BackoffType = 'fixed' | 'linear' | 'exponential' | 'decorrelated-jitter';

/**
 * Backoff configuration
 */
export interface BackoffConfig {
  type: BackoffType;
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
  jitterFactor?: number;
}

/**
 * Default backoff configurations
 */
export const DEFAULT_BACKOFF: Record<BackoffType, BackoffConfig> = {
  fixed: {
    type: 'fixed',
    initialDelay: 1000,
    maxDelay: 1000,
  },
  linear: {
    type: 'linear',
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 1000,
  },
  exponential: {
    type: 'exponential',
    initialDelay: 1000,
    maxDelay: 60000,
    multiplier: 2,
  },
  'decorrelated-jitter': {
    type: 'decorrelated-jitter',
    initialDelay: 1000,
    maxDelay: 60000,
    jitterFactor: 0.5,
  },
};

/**
 * Backoff strategy calculator
 */
export class BackoffStrategy {
  private config: BackoffConfig;
  private lastDelay: number;

  constructor(config: Partial<BackoffConfig> = {}) {
    this.config = {
      ...DEFAULT_BACKOFF.exponential,
      ...config,
    };
    this.lastDelay = this.config.initialDelay;
  }

  /**
   * Calculate next delay
   */
  nextDelay(attempt: number): number {
    let delay: number;

    switch (this.config.type) {
      case 'fixed':
        delay = this.config.initialDelay;
        break;

      case 'linear':
        delay = this.config.initialDelay + (attempt * (this.config.multiplier || 1000));
        break;

      case 'exponential':
        delay = this.config.initialDelay * Math.pow(this.config.multiplier || 2, attempt);
        break;

      case 'decorrelated-jitter':
        // AWS-style decorrelated jitter
        const jitter = this.config.jitterFactor || 0.5;
        const minDelay = this.config.initialDelay;
        delay = Math.random() * (this.lastDelay * 3 - minDelay) + minDelay;
        this.lastDelay = delay;
        break;

      default:
        delay = this.config.initialDelay;
    }

    // Apply jitter to non-jitter strategies
    if (this.config.type !== 'decorrelated-jitter' && this.config.jitterFactor) {
      const jitter = delay * this.config.jitterFactor * (Math.random() * 2 - 1);
      delay += jitter;
    }

    // Clamp to max delay
    return Math.min(Math.max(delay, 0), this.config.maxDelay);
  }

  /**
   * Reset strategy
   */
  reset(): void {
    this.lastDelay = this.config.initialDelay;
  }

  /**
   * Get total delay for N attempts
   */
  totalDelayFor(attempts: number): number {
    let total = 0;
    for (let i = 0; i < attempts; i++) {
      total += this.nextDelay(i);
    }
    this.reset();
    return total;
  }
}

/**
 * Create backoff strategy
 */
export function createBackoff(type: BackoffType, config?: Partial<BackoffConfig>): BackoffStrategy {
  return new BackoffStrategy({
    ...DEFAULT_BACKOFF[type],
    ...config,
  });
}
```

### 2.2 Retry Policy (`src/retry/RetryPolicy.ts`)

```typescript
import { ErrorCategory } from '../errors/types/ErrorCategory';
import { ErrorCode } from '../errors/types/ErrorCode';
import { BackoffConfig, BackoffType } from './BackoffStrategy';

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  /** Policy name */
  name: string;
  
  /** Maximum retry attempts */
  maxAttempts: number;
  
  /** Backoff configuration */
  backoff: BackoffConfig;
  
  /** Error categories to retry */
  retryableCategories: ErrorCategory[];
  
  /** Specific error codes to retry */
  retryableCodes?: ErrorCode[];
  
  /** Error codes to never retry */
  nonRetryableCodes?: ErrorCode[];
  
  /** Custom retry predicate */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  
  /** Timeout per attempt */
  attemptTimeout?: number;
  
  /** Total timeout across all attempts */
  totalTimeout?: number;
  
  /** Callback before retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  
  /** Callback on final failure */
  onFinalFailure?: (error: Error, attempts: number) => void;
}

/**
 * Predefined retry policies
 */
export const RETRY_POLICIES: Record<string, RetryPolicy> = {
  /** Default policy - balanced retry */
  default: {
    name: 'default',
    maxAttempts: 3,
    backoff: {
      type: 'exponential',
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
    },
    retryableCategories: [
      ErrorCategory.TRANSIENT,
      ErrorCategory.EXTERNAL,
    ],
  },

  /** Aggressive retry for transient errors */
  aggressive: {
    name: 'aggressive',
    maxAttempts: 5,
    backoff: {
      type: 'exponential',
      initialDelay: 500,
      maxDelay: 60000,
      multiplier: 2,
      jitterFactor: 0.2,
    },
    retryableCategories: [
      ErrorCategory.TRANSIENT,
      ErrorCategory.EXTERNAL,
      ErrorCategory.RESOURCE,
    ],
    attemptTimeout: 30000,
  },

  /** Conservative retry - quick failure */
  conservative: {
    name: 'conservative',
    maxAttempts: 2,
    backoff: {
      type: 'fixed',
      initialDelay: 2000,
      maxDelay: 2000,
    },
    retryableCategories: [ErrorCategory.TRANSIENT],
    totalTimeout: 10000,
  },

  /** MCP-specific policy */
  mcp: {
    name: 'mcp',
    maxAttempts: 4,
    backoff: {
      type: 'decorrelated-jitter',
      initialDelay: 1000,
      maxDelay: 30000,
      jitterFactor: 0.5,
    },
    retryableCategories: [
      ErrorCategory.TRANSIENT,
      ErrorCategory.EXTERNAL,
    ],
    retryableCodes: [
      ErrorCode.MCP_CONNECTION_FAILED,
      ErrorCode.MCP_TIMEOUT,
    ],
    nonRetryableCodes: [
      ErrorCode.MCP_TOOL_NOT_FOUND,
    ],
  },

  /** Agent execution policy */
  agent: {
    name: 'agent',
    maxAttempts: 3,
    backoff: {
      type: 'exponential',
      initialDelay: 2000,
      maxDelay: 30000,
      multiplier: 2,
    },
    retryableCategories: [
      ErrorCategory.TRANSIENT,
    ],
    nonRetryableCodes: [
      ErrorCode.AGENT_NOT_FOUND,
      ErrorCode.AGENT_INVALID_INPUT,
    ],
    attemptTimeout: 60000,
  },

  /** Infrastructure deployment policy */
  infrastructure: {
    name: 'infrastructure',
    maxAttempts: 3,
    backoff: {
      type: 'exponential',
      initialDelay: 5000,
      maxDelay: 120000,
      multiplier: 3,
    },
    retryableCategories: [
      ErrorCategory.TRANSIENT,
      ErrorCategory.EXTERNAL,
    ],
    retryableCodes: [
      ErrorCode.EXTERNAL_RATE_LIMITED,
      ErrorCode.EXTERNAL_UNAVAILABLE,
    ],
    totalTimeout: 600000, // 10 minutes
  },

  /** No retry policy */
  none: {
    name: 'none',
    maxAttempts: 1,
    backoff: {
      type: 'fixed',
      initialDelay: 0,
      maxDelay: 0,
    },
    retryableCategories: [],
  },
};

/**
 * Get retry policy by name
 */
export function getRetryPolicy(name: string): RetryPolicy {
  return RETRY_POLICIES[name] || RETRY_POLICIES.default;
}

/**
 * Create custom retry policy
 */
export function createRetryPolicy(config: Partial<RetryPolicy>): RetryPolicy {
  return {
    ...RETRY_POLICIES.default,
    ...config,
    name: config.name || 'custom',
  };
}
```

### 2.3 Retry Manager (`src/retry/RetryManager.ts`)

```typescript
import { RetryPolicy, getRetryPolicy } from './RetryPolicy';
import { BackoffStrategy } from './BackoffStrategy';
import { getErrorClassifier, ClassificationResult } from '../errors/ErrorClassifier';
import { ErrorCategory } from '../errors/types/ErrorCategory';
import { ErrorCode } from '../errors/types/ErrorCode';

/**
 * Retry context for tracking attempts
 */
export interface RetryContext {
  attempt: number;
  totalAttempts: number;
  startTime: Date;
  lastError?: Error;
  delays: number[];
  totalDelay: number;
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  context: RetryContext;
}

/**
 * Retry manager for executing operations with retry
 */
export class RetryManager {
  private classifier = getErrorClassifier();

  /**
   * Execute with retry
   */
  async execute<T>(
    operation: () => Promise<T>,
    policyOrName: RetryPolicy | string = 'default'
  ): Promise<RetryResult<T>> {
    const policy = typeof policyOrName === 'string' 
      ? getRetryPolicy(policyOrName) 
      : policyOrName;

    const backoff = new BackoffStrategy(policy.backoff);
    const context: RetryContext = {
      attempt: 0,
      totalAttempts: policy.maxAttempts,
      startTime: new Date(),
      delays: [],
      totalDelay: 0,
    };

    const totalTimeout = policy.totalTimeout;
    const startTime = Date.now();

    while (context.attempt < policy.maxAttempts) {
      context.attempt++;

      try {
        // Check total timeout
        if (totalTimeout && (Date.now() - startTime) > totalTimeout) {
          throw new Error(`Total timeout exceeded (${totalTimeout}ms)`);
        }

        // Execute with optional attempt timeout
        const result = policy.attemptTimeout
          ? await this.withTimeout(operation, policy.attemptTimeout)
          : await operation();

        return {
          success: true,
          result,
          context,
        };

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        context.lastError = err;

        // Check if we should retry
        if (context.attempt >= policy.maxAttempts) {
          policy.onFinalFailure?.(err, context.attempt);
          return {
            success: false,
            error: err,
            context,
          };
        }

        if (!this.shouldRetry(err, policy, context.attempt)) {
          policy.onFinalFailure?.(err, context.attempt);
          return {
            success: false,
            error: err,
            context,
          };
        }

        // Calculate and apply delay
        const delay = backoff.nextDelay(context.attempt - 1);
        context.delays.push(delay);
        context.totalDelay += delay;

        // Callback before retry
        policy.onRetry?.(err, context.attempt, delay);

        // Wait before retry
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: context.lastError,
      context,
    };
  }

  /**
   * Execute with retry (simple version - throws on failure)
   */
  async executeOrThrow<T>(
    operation: () => Promise<T>,
    policyOrName: RetryPolicy | string = 'default'
  ): Promise<T> {
    const result = await this.execute(operation, policyOrName);
    
    if (!result.success) {
      throw result.error || new Error('Operation failed after retries');
    }
    
    return result.result!;
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: Error, policy: RetryPolicy, attempt: number): boolean {
    // Custom predicate takes precedence
    if (policy.shouldRetry) {
      return policy.shouldRetry(error, attempt);
    }

    // Classify the error
    const classification = this.classifier.classify(error);

    // Check non-retryable codes first
    if (policy.nonRetryableCodes?.includes(classification.code)) {
      return false;
    }

    // Check specific retryable codes
    if (policy.retryableCodes?.includes(classification.code)) {
      return true;
    }

    // Check category
    return policy.retryableCategories.includes(classification.category);
  }

  /**
   * Execute with timeout
   */
  private async withTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Sleep for duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create retry manager
 */
export function createRetryManager(): RetryManager {
  return new RetryManager();
}

/**
 * Retry decorator for methods
 */
export function withRetry(policyOrName: RetryPolicy | string = 'default') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const manager = new RetryManager();

    descriptor.value = async function (...args: any[]) {
      return manager.executeOrThrow(
        () => originalMethod.apply(this, args),
        policyOrName
      );
    };

    return descriptor;
  };
}
```

### 2.4 Circuit State (`src/circuit-breaker/CircuitState.ts`)

```typescript
/**
 * Circuit breaker states
 */
export enum CircuitState {
  /** Circuit is closed - normal operation */
  CLOSED = 'closed',
  
  /** Circuit is open - failing fast */
  OPEN = 'open',
  
  /** Circuit is testing - allowing test requests */
  HALF_OPEN = 'half_open',
}

/**
 * Circuit breaker metrics
 */
export interface CircuitMetrics {
  /** Total requests */
  totalRequests: number;
  
  /** Successful requests */
  successfulRequests: number;
  
  /** Failed requests */
  failedRequests: number;
  
  /** Consecutive failures */
  consecutiveFailures: number;
  
  /** Consecutive successes */
  consecutiveSuccesses: number;
  
  /** Last failure time */
  lastFailureTime?: Date;
  
  /** Last success time */
  lastSuccessTime?: Date;
  
  /** Last state change time */
  lastStateChange: Date;
  
  /** Current state */
  state: CircuitState;
  
  /** Failure rate (0-1) */
  failureRate: number;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Name/identifier */
  name: string;
  
  /** Failure threshold to open circuit */
  failureThreshold: number;
  
  /** Success threshold to close circuit */
  successThreshold: number;
  
  /** Time window for failure counting (ms) */
  failureWindow: number;
  
  /** Time to wait before testing (ms) */
  resetTimeout: number;
  
  /** Failure rate threshold (0-1) */
  failureRateThreshold?: number;
  
  /** Minimum requests before calculating rate */
  minimumRequests?: number;
  
  /** Callback on state change */
  onStateChange?: (from: CircuitState, to: CircuitState, metrics: CircuitMetrics) => void;
  
  /** Callback on open */
  onOpen?: (metrics: CircuitMetrics) => void;
  
  /** Callback on close */
  onClose?: (metrics: CircuitMetrics) => void;
  
  /** Fallback function when open */
  fallback?: <T>() => T | Promise<T>;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_CONFIG: Omit<CircuitBreakerConfig, 'name'> = {
  failureThreshold: 5,
  successThreshold: 3,
  failureWindow: 60000, // 1 minute
  resetTimeout: 30000, // 30 seconds
  failureRateThreshold: 0.5,
  minimumRequests: 10,
};
```

### 2.5 Circuit Breaker (`src/circuit-breaker/CircuitBreaker.ts`)

```typescript
import { CircuitState, CircuitMetrics, CircuitBreakerConfig, DEFAULT_CIRCUIT_CONFIG } from './CircuitState';

/**
 * Circuit breaker error
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly circuitName: string,
    public readonly state: CircuitState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private metrics: CircuitMetrics;
  private config: CircuitBreakerConfig;
  private failureTimestamps: number[] = [];
  private resetTimer?: NodeJS.Timeout;

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = {
      ...DEFAULT_CIRCUIT_CONFIG,
      ...config,
    };

    this.metrics = this.createInitialMetrics();
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): CircuitMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastStateChange: new Date(),
      state: CircuitState.CLOSED,
      failureRate: 0,
    };
  }

  /**
   * Execute protected operation
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit allows request
    if (!this.canExecute()) {
      if (this.config.fallback) {
        return this.config.fallback<T>();
      }
      throw new CircuitBreakerError(
        `Circuit ${this.config.name} is ${this.state}`,
        this.config.name,
        this.state
      );
    }

    this.metrics.totalRequests++;

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Check if circuit allows execution
   */
  private canExecute(): boolean {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if reset timeout has passed
        if (this.shouldAttemptReset()) {
          this.transitionTo(CircuitState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  /**
   * Check if we should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.metrics.lastFailureTime) return true;
    
    const elapsed = Date.now() - this.metrics.lastFailureTime.getTime();
    return elapsed >= this.config.resetTimeout;
  }

  /**
   * Record successful execution
   */
  private recordSuccess(): void {
    this.metrics.successfulRequests++;
    this.metrics.consecutiveSuccesses++;
    this.metrics.consecutiveFailures = 0;
    this.metrics.lastSuccessTime = new Date();
    this.updateFailureRate();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.metrics.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Record failed execution
   */
  private recordFailure(): void {
    const now = Date.now();
    
    this.metrics.failedRequests++;
    this.metrics.consecutiveFailures++;
    this.metrics.consecutiveSuccesses = 0;
    this.metrics.lastFailureTime = new Date();
    
    // Track failure timestamp for windowed counting
    this.failureTimestamps.push(now);
    this.cleanOldFailures(now);
    
    this.updateFailureRate();

    // Check if we should open circuit
    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      if (this.shouldOpen()) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Check if circuit should open
   */
  private shouldOpen(): boolean {
    // Check consecutive failures
    if (this.metrics.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }

    // Check failure rate
    if (this.config.failureRateThreshold && this.config.minimumRequests) {
      if (this.metrics.totalRequests >= this.config.minimumRequests) {
        if (this.metrics.failureRate >= this.config.failureRateThreshold) {
          return true;
        }
      }
    }

    // Check failures in window
    const windowedFailures = this.failureTimestamps.length;
    if (windowedFailures >= this.config.failureThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Clean old failures outside window
   */
  private cleanOldFailures(now: number): void {
    const cutoff = now - this.config.failureWindow;
    this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
  }

  /**
   * Update failure rate
   */
  private updateFailureRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.failureRate = this.metrics.failedRequests / this.metrics.totalRequests;
    }
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.metrics.state = newState;
    this.metrics.lastStateChange = new Date();

    // Reset counters on state change
    if (newState === CircuitState.CLOSED) {
      this.metrics.consecutiveFailures = 0;
      this.failureTimestamps = [];
      this.config.onClose?.(this.metrics);
    } else if (newState === CircuitState.HALF_OPEN) {
      this.metrics.consecutiveSuccesses = 0;
    } else if (newState === CircuitState.OPEN) {
      this.config.onOpen?.(this.metrics);
      this.scheduleReset();
    }

    this.config.onStateChange?.(oldState, newState, this.metrics);
  }

  /**
   * Schedule reset attempt
   */
  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }, this.config.resetTimeout);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get metrics
   */
  getMetrics(): CircuitMetrics {
    return { ...this.metrics };
  }

  /**
   * Force open circuit
   */
  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN);
  }

  /**
   * Force close circuit
   */
  forceClose(): void {
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Reset circuit
   */
  reset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    this.state = CircuitState.CLOSED;
    this.metrics = this.createInitialMetrics();
    this.failureTimestamps = [];
  }
}
```

### 2.6 Circuit Breaker Registry (`src/circuit-breaker/BreakerRegistry.ts`)

```typescript
import { CircuitBreaker } from './CircuitBreaker';
import { CircuitBreakerConfig, CircuitState, CircuitMetrics } from './CircuitState';

/**
 * Registry for managing multiple circuit breakers
 */
export class BreakerRegistry {
  private static instance: BreakerRegistry;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BreakerRegistry {
    if (!BreakerRegistry.instance) {
      BreakerRegistry.instance = new BreakerRegistry();
    }
    return BreakerRegistry.instance;
  }

  /**
   * Get or create circuit breaker
   */
  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);
    
    if (!breaker) {
      breaker = new CircuitBreaker({ name, ...config });
      this.breakers.set(name, breaker);
    }

    return breaker;
  }

  /**
   * Get existing circuit breaker
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Check if breaker exists
   */
  has(name: string): boolean {
    return this.breakers.has(name);
  }

  /**
   * Remove circuit breaker
   */
  remove(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
      this.breakers.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Get all breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, CircuitMetrics> {
    const metrics = new Map<string, CircuitMetrics>();
    for (const [name, breaker] of this.breakers) {
      metrics.set(name, breaker.getMetrics());
    }
    return metrics;
  }

  /**
   * Get breakers by state
   */
  getByState(state: CircuitState): CircuitBreaker[] {
    return Array.from(this.breakers.values())
      .filter(b => b.getState() === state);
  }

  /**
   * Reset all breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    total: number;
    closed: number;
    open: number;
    halfOpen: number;
  } {
    const breakers = Array.from(this.breakers.values());
    return {
      total: breakers.length,
      closed: breakers.filter(b => b.getState() === CircuitState.CLOSED).length,
      open: breakers.filter(b => b.getState() === CircuitState.OPEN).length,
      halfOpen: breakers.filter(b => b.getState() === CircuitState.HALF_OPEN).length,
    };
  }
}

/**
 * Get breaker registry
 */
export function getBreakerRegistry(): BreakerRegistry {
  return BreakerRegistry.getInstance();
}

/**
 * Circuit breaker decorator
 */
export function withCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const registry = getBreakerRegistry();

    descriptor.value = async function (...args: any[]) {
      const breaker = registry.getOrCreate(name, config);
      return breaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
```

### 2.7 Bulkhead Pattern (`src/circuit-breaker/Bulkhead.ts`)

```typescript
/**
 * Bulkhead configuration
 */
export interface BulkheadConfig {
  name: string;
  maxConcurrent: number;
  maxQueue: number;
  queueTimeout: number;
}

/**
 * Bulkhead error
 */
export class BulkheadError extends Error {
  constructor(
    message: string,
    public readonly bulkheadName: string,
    public readonly reason: 'full' | 'timeout'
  ) {
    super(message);
    this.name = 'BulkheadError';
  }
}

/**
 * Bulkhead pattern for resource isolation
 */
export class Bulkhead {
  private config: BulkheadConfig;
  private active: number = 0;
  private queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];

  constructor(config: BulkheadConfig) {
    this.config = config;
  }

  /**
   * Execute with bulkhead protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();
    
    try {
      return await operation();
    } finally {
      this.release();
    }
  }

  /**
   * Acquire permit
   */
  private async acquire(): Promise<void> {
    // If under limit, proceed immediately
    if (this.active < this.config.maxConcurrent) {
      this.active++;
      return;
    }

    // If queue is full, reject
    if (this.queue.length >= this.config.maxQueue) {
      throw new BulkheadError(
        `Bulkhead ${this.config.name} is full`,
        this.config.name,
        'full'
      );
    }

    // Wait in queue
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.queue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
          reject(new BulkheadError(
            `Bulkhead ${this.config.name} queue timeout`,
            this.config.name,
            'timeout'
          ));
        }
      }, this.config.queueTimeout);

      this.queue.push({ resolve, reject, timer });
    });
  }

  /**
   * Release permit
   */
  private release(): void {
    this.active--;

    // Process next in queue
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      clearTimeout(next.timer);
      this.active++;
      next.resolve();
    }
  }

  /**
   * Get current stats
   */
  getStats(): {
    active: number;
    queued: number;
    available: number;
  } {
    return {
      active: this.active,
      queued: this.queue.length,
      available: Math.max(0, this.config.maxConcurrent - this.active),
    };
  }
}

/**
 * Bulkhead registry
 */
export class BulkheadRegistry {
  private static instance: BulkheadRegistry;
  private bulkheads: Map<string, Bulkhead> = new Map();

  private constructor() {}

  static getInstance(): BulkheadRegistry {
    if (!BulkheadRegistry.instance) {
      BulkheadRegistry.instance = new BulkheadRegistry();
    }
    return BulkheadRegistry.instance;
  }

  getOrCreate(config: BulkheadConfig): Bulkhead {
    let bulkhead = this.bulkheads.get(config.name);
    
    if (!bulkhead) {
      bulkhead = new Bulkhead(config);
      this.bulkheads.set(config.name, bulkhead);
    }

    return bulkhead;
  }

  get(name: string): Bulkhead | undefined {
    return this.bulkheads.get(name);
  }
}

export function getBulkheadRegistry(): BulkheadRegistry {
  return BulkheadRegistry.getInstance();
}
```

---

## 📊 Retry & Circuit Breaker Matrix

| Component | Pattern | Use Case |
|-----------|---------|----------|
| MCP calls | Circuit Breaker + Retry | Prevent cascade, auto-recover |
| Agent execution | Retry + Timeout | Transient failures |
| Azure deployment | Retry (aggressive) | Rate limits, temp errors |
| File operations | Retry (conservative) | Quick failure |
| Parallel agents | Bulkhead | Resource isolation |

---

## 📋 Acceptance Criteria

- [ ] RetryManager retries transient errors
- [ ] Exponential backoff works correctly
- [ ] Circuit breaker opens after threshold
- [ ] Half-open state allows test requests
- [ ] Bulkhead limits concurrent execution
- [ ] Metrics are accurate
- [ ] Decorators work on methods

---

## 🔗 Navigation

← [01-PHASE-ERROR-CLASSIFICATION.md](01-PHASE-ERROR-CLASSIFICATION.md) | [03-PHASE-ROLLBACK-RECOVERY.md](03-PHASE-ROLLBACK-RECOVERY.md) →
