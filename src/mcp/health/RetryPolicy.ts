/**
 * Retry Policy
 * 
 * Implements retry strategies for transient failures
 * @module mcp/health/RetryPolicy
 */

import { Logger, createLogger } from '../utils/Logger';
import { isRetryableError } from '../errors/MCPError';

/**
 * Retry strategy types
 */
export type RetryStrategy = 'fixed' | 'exponential' | 'linear' | 'fibonacci';

/**
 * Retry policy configuration
 */
export interface RetryPolicyConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay between retries (ms) */
  baseDelayMs: number;
  /** Maximum delay between retries (ms) */
  maxDelayMs: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Retry strategy */
  strategy: RetryStrategy;
  /** Jitter to add randomness to delays */
  jitterFactor: number;
  /** Function to determine if error is retryable */
  retryableCheck?: (error: Error) => boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RetryPolicyConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  strategy: 'exponential',
  jitterFactor: 0.1,
};

/**
 * Retry attempt info
 */
export interface RetryAttemptInfo {
  attempt: number;
  delay: number;
  error: Error;
  willRetry: boolean;
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDelayMs: number;
}

/**
 * Retry Policy implementation
 */
export class RetryPolicy {
  private config: RetryPolicyConfig;
  private logger: Logger;
  private name: string;
  private fibonacciCache: number[] = [1, 1];

  constructor(name: string, config?: Partial<RetryPolicyConfig>) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = createLogger(`RetryPolicy:${name}`);
  }

  /**
   * Execute a function with retry policy
   */
  async execute<T>(
    fn: () => Promise<T>,
    isRetryable?: (error: Error) => boolean
  ): Promise<T> {
    const retryCheck = isRetryable || this.config.retryableCheck || isRetryableError;
    let lastError: Error | undefined;
    let totalDelay = 0;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await fn();
        
        if (attempt > 0) {
          this.logger.info(`Succeeded after ${attempt} retries`, {
            totalDelay,
          });
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        const shouldRetry = attempt < this.config.maxRetries && retryCheck(lastError);
        const delay = shouldRetry ? this.calculateDelay(attempt) : 0;

        const attemptInfo: RetryAttemptInfo = {
          attempt,
          delay,
          error: lastError,
          willRetry: shouldRetry,
        };

        this.logger.debug(`Attempt ${attempt + 1} failed`, {
          error: lastError.message,
          willRetry: shouldRetry,
          nextDelay: delay,
        });

        if (!shouldRetry) {
          break;
        }

        // Wait before retry
        await this.sleep(delay);
        totalDelay += delay;
      }
    }

    throw lastError;
  }

  /**
   * Execute with detailed result
   */
  async executeWithResult<T>(
    fn: () => Promise<T>,
    isRetryable?: (error: Error) => boolean
  ): Promise<RetryResult<T>> {
    const retryCheck = isRetryable || this.config.retryableCheck || isRetryableError;
    let totalDelay = 0;
    let attempts = 0;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      attempts++;
      
      try {
        const result = await fn();
        return {
          success: true,
          result,
          attempts,
          totalDelayMs: totalDelay,
        };
      } catch (error) {
        const shouldRetry = attempt < this.config.maxRetries && retryCheck(error as Error);
        
        if (!shouldRetry) {
          return {
            success: false,
            error: error as Error,
            attempts,
            totalDelayMs: totalDelay,
          };
        }

        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
        totalDelay += delay;
      }
    }

    return {
      success: false,
      error: new Error('Max retries exceeded'),
      attempts,
      totalDelayMs: totalDelay,
    };
  }

  /**
   * Calculate delay for a specific attempt
   */
  calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.strategy) {
      case 'fixed':
        delay = this.config.baseDelayMs;
        break;

      case 'linear':
        delay = this.config.baseDelayMs * (attempt + 1);
        break;

      case 'exponential':
        delay = this.config.baseDelayMs * Math.pow(this.config.backoffMultiplier, attempt);
        break;

      case 'fibonacci':
        delay = this.config.baseDelayMs * this.getFibonacci(attempt);
        break;

      default:
        delay = this.config.baseDelayMs;
    }

    // Apply jitter
    if (this.config.jitterFactor > 0) {
      const jitter = delay * this.config.jitterFactor * (Math.random() * 2 - 1);
      delay += jitter;
    }

    // Cap at max delay
    return Math.min(Math.max(0, delay), this.config.maxDelayMs);
  }

  /**
   * Get configuration
   */
  getConfig(): RetryPolicyConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryPolicyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get Fibonacci number
   */
  private getFibonacci(n: number): number {
    while (this.fibonacciCache.length <= n) {
      const len = this.fibonacciCache.length;
      this.fibonacciCache.push(
        this.fibonacciCache[len - 1] + this.fibonacciCache[len - 2]
      );
    }
    return this.fibonacciCache[n];
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a retry policy
 */
export function createRetryPolicy(
  config?: Partial<RetryPolicyConfig>,
  name: string = 'default'
): RetryPolicy {
  return new RetryPolicy(name, config);
}

/**
 * No-op retry policy that doesn't retry
 */
export const NO_RETRY: RetryPolicy = new RetryPolicy('no-retry', { maxRetries: 0 });
