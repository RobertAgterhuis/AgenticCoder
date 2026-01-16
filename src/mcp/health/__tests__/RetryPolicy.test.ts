/**
 * Retry Policy Tests
 */

import { RetryPolicy, RetryPolicyConfig, createRetryPolicy, NO_RETRY, RetryResult } from '../RetryPolicy';

describe('RetryPolicy', () => {
  describe('Creation', () => {
    it('should create with default config', () => {
      const policy = new RetryPolicy('test');
      expect(policy).toBeDefined();
      
      const config = policy.getConfig();
      expect(config.maxRetries).toBe(3);
      expect(config.strategy).toBe('exponential');
    });

    it('should create with custom config', () => {
      const policy = new RetryPolicy('test', {
        maxRetries: 5,
        baseDelayMs: 100,
        strategy: 'fixed',
      });
      
      const config = policy.getConfig();
      expect(config.maxRetries).toBe(5);
      expect(config.baseDelayMs).toBe(100);
      expect(config.strategy).toBe('fixed');
    });

    it('should create using factory function', () => {
      const policy = createRetryPolicy({ maxRetries: 2 }, 'custom');
      expect(policy).toBeDefined();
      
      const config = policy.getConfig();
      expect(config.maxRetries).toBe(2);
    });
  });

  describe('NO_RETRY constant', () => {
    it('should not retry', () => {
      const config = NO_RETRY.getConfig();
      expect(config.maxRetries).toBe(0);
    });
  });

  describe('Execute - Success', () => {
    it('should succeed on first attempt', async () => {
      const policy = new RetryPolicy('test', { maxRetries: 3, baseDelayMs: 10 });
      
      const result = await policy.execute(async () => 'success');
      
      expect(result).toBe('success');
    });

    it('should succeed after retries', async () => {
      const policy = new RetryPolicy('test', { maxRetries: 3, baseDelayMs: 10 });
      
      let attempts = 0;
      const result = await policy.execute(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('transient error');
        }
        return 'success';
      }, () => true); // Make all errors retryable
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });

  describe('Execute - Failure', () => {
    it('should throw after max retries', async () => {
      const policy = new RetryPolicy('test', { maxRetries: 2, baseDelayMs: 10 });
      
      await expect(policy.execute(async () => {
        throw new Error('persistent error');
      })).rejects.toThrow('persistent error');
    });
  });

  describe('ExecuteWithResult', () => {
    it('should return success result', async () => {
      const policy = new RetryPolicy('test', { maxRetries: 3, baseDelayMs: 10 });
      
      const result = await policy.executeWithResult(async () => 'success');
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
    });

    it('should return failure result after retries', async () => {
      const policy = new RetryPolicy('test', { maxRetries: 2, baseDelayMs: 10 });
      
      const result = await policy.executeWithResult(async () => {
        throw new Error('persistent error');
      }, () => true); // Make all errors retryable
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(3); // 1 initial + 2 retries
    });

    it('should track total delay', async () => {
      const policy = new RetryPolicy('test', {
        maxRetries: 2,
        baseDelayMs: 10,
        strategy: 'fixed',
        jitterFactor: 0,
      });
      
      const result = await policy.executeWithResult(async () => {
        throw new Error('error');
      }, () => true); // Make all errors retryable
      
      expect(result.totalDelayMs).toBeGreaterThan(0);
    });
  });

  describe('Delay Calculation', () => {
    describe('Fixed Strategy', () => {
      it('should return constant delay', () => {
        const policy = new RetryPolicy('test', {
          strategy: 'fixed',
          baseDelayMs: 100,
          jitterFactor: 0,
        });
        
        expect(policy.calculateDelay(0)).toBe(100);
        expect(policy.calculateDelay(1)).toBe(100);
        expect(policy.calculateDelay(5)).toBe(100);
      });
    });

    describe('Linear Strategy', () => {
      it('should return linearly increasing delay', () => {
        const policy = new RetryPolicy('test', {
          strategy: 'linear',
          baseDelayMs: 100,
          jitterFactor: 0,
        });
        
        expect(policy.calculateDelay(0)).toBe(100);  // 100 * 1
        expect(policy.calculateDelay(1)).toBe(200);  // 100 * 2
        expect(policy.calculateDelay(2)).toBe(300);  // 100 * 3
      });
    });

    describe('Exponential Strategy', () => {
      it('should return exponentially increasing delay', () => {
        const policy = new RetryPolicy('test', {
          strategy: 'exponential',
          baseDelayMs: 100,
          backoffMultiplier: 2,
          jitterFactor: 0,
        });
        
        expect(policy.calculateDelay(0)).toBe(100);  // 100 * 2^0
        expect(policy.calculateDelay(1)).toBe(200);  // 100 * 2^1
        expect(policy.calculateDelay(2)).toBe(400);  // 100 * 2^2
      });
    });

    describe('Max Delay', () => {
      it('should cap delay at maxDelayMs', () => {
        const policy = new RetryPolicy('test', {
          strategy: 'exponential',
          baseDelayMs: 100,
          backoffMultiplier: 2,
          maxDelayMs: 300,
          jitterFactor: 0,
        });
        
        expect(policy.calculateDelay(0)).toBe(100);
        expect(policy.calculateDelay(1)).toBe(200);
        expect(policy.calculateDelay(2)).toBe(300);  // Capped
        expect(policy.calculateDelay(3)).toBe(300);  // Capped
      });
    });

    describe('Jitter', () => {
      it('should add randomness when jitter enabled', () => {
        const policy = new RetryPolicy('test', {
          strategy: 'fixed',
          baseDelayMs: 100,
          jitterFactor: 0.5,
        });
        
        // Run multiple times to verify jitter adds variation
        const delays = new Set<number>();
        for (let i = 0; i < 10; i++) {
          delays.add(policy.calculateDelay(0));
        }
        
        // With 50% jitter, we expect variation
        expect(delays.size).toBeGreaterThan(1);
      });
    });
  });

  describe('Config Management', () => {
    it('should get config', () => {
      const policy = new RetryPolicy('test', { maxRetries: 5 });
      
      const config = policy.getConfig();
      expect(config.maxRetries).toBe(5);
    });

    it('should update config', () => {
      const policy = new RetryPolicy('test', { maxRetries: 3 });
      
      policy.updateConfig({ maxRetries: 10 });
      
      const config = policy.getConfig();
      expect(config.maxRetries).toBe(10);
    });
  });

  describe('Custom Retry Condition', () => {
    it('should use custom retryable check', async () => {
      const policy = new RetryPolicy('test', {
        maxRetries: 3,
        baseDelayMs: 10,
        retryableCheck: (error) => error.message === 'retryable',
      });
      
      let attempts = 0;
      
      await expect(policy.execute(async () => {
        attempts++;
        throw new Error('non-retryable');
      })).rejects.toThrow('non-retryable');
      
      // Should not retry because error is not retryable
      expect(attempts).toBe(1);
    });

    it('should retry with custom condition', async () => {
      const policy = new RetryPolicy('test', {
        maxRetries: 3,
        baseDelayMs: 10,
        retryableCheck: (error) => error.message === 'retryable',
      });
      
      let attempts = 0;
      
      const result = await policy.execute(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('retryable');
        }
        return 'success';
      });
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });
});
