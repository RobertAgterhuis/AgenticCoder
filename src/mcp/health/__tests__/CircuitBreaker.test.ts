/**
 * Circuit Breaker Tests
 */

import { CircuitBreaker, CircuitBreakerConfig, CircuitBreakerState, CircuitBreakerStats } from '../CircuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-server', {
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      successThreshold: 2,
      halfOpenMaxCalls: 2,
    });
  });

  describe('Initial State', () => {
    it('should start in closed state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('closed');
    });

    it('should have zero counts initially', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.totalCalls).toBe(0);
    });

    it('should allow execution in closed state', () => {
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe('Success Recording', () => {
    it('should track success in half-open state and close circuit', async () => {
      const cb = new CircuitBreaker('test', {
        failureThreshold: 3,
        resetTimeoutMs: 100,
        successThreshold: 2,
        halfOpenMaxCalls: 3,
      });
      
      // First open the circuit
      for (let i = 0; i < 3; i++) {
        cb.recordFailure(new Error(`error ${i}`));
      }
      
      // Wait for reset timeout to go to half-open
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Now in half-open, record successes
      cb.recordSuccess();
      cb.recordSuccess();
      
      // After 2 successes, circuit should close
      const stats = cb.getStats();
      expect(stats.state).toBe('closed');
    });

    it('should reset failures on success in closed state', () => {
      // Record a failure first
      circuitBreaker.recordFailure(new Error('test'));
      
      // Then record success (clears failures in closed state)
      circuitBreaker.recordSuccess();
      
      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(0);
    });
  });

  describe('Failure Recording', () => {
    it('should record failed calls', () => {
      circuitBreaker.recordFailure(new Error('test error'));
      
      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(1);
    });

    it('should track last failure', () => {
      circuitBreaker.recordFailure(new Error('test error'));
      
      const stats = circuitBreaker.getStats();
      expect(stats.lastFailure).not.toBeNull();
    });
  });

  describe('State Transitions', () => {
    it('should open after failure threshold', () => {
      // Record failures up to threshold
      circuitBreaker.recordFailure(new Error('error 1'));
      circuitBreaker.recordFailure(new Error('error 2'));
      circuitBreaker.recordFailure(new Error('error 3'));
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('open');
    });

    it('should not allow execution when open', () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure(new Error(`error ${i}`));
      }
      
      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it('should transition to half-open after reset timeout', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure(new Error(`error ${i}`));
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('half-open');
    });

    it('should allow limited execution in half-open state', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure(new Error(`error ${i}`));
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe('Execute Method', () => {
    it('should execute function successfully', async () => {
      const result = await circuitBreaker.execute(async () => 'success');
      expect(result).toBe('success');
    });

    it('should record success after successful execution', async () => {
      // First open the circuit
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure(new Error(`error ${i}`));
      }
      
      // Wait for reset timeout to go to half-open
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      await circuitBreaker.execute(async () => 'success');
      
      const stats = circuitBreaker.getStats();
      expect(stats.successCount).toBeGreaterThan(0);
    });

    it('should record failure after failed execution', async () => {
      try {
        await circuitBreaker.execute(async () => {
          throw new Error('test error');
        });
      } catch (e) {
        // Expected
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.failureCount).toBe(1);
    });

    it('should throw when circuit is open', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error(`error ${i}`);
          });
        } catch (e) {
          // Expected
        }
      }
      
      // Now circuit is open
      await expect(circuitBreaker.execute(async () => 'success'))
        .rejects.toThrow();
    });
  });

  describe('Reset', () => {
    it('should reset to closed state', () => {
      // Accumulate some failures
      circuitBreaker.recordFailure(new Error('error 1'));
      circuitBreaker.recordFailure(new Error('error 2'));
      
      circuitBreaker.reset();
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('closed');
      expect(stats.failureCount).toBe(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit state change event', () => {
      const handler = jest.fn();
      circuitBreaker.on('stateChange', handler);
      
      // Trigger state change to open
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure(new Error(`error ${i}`));
      }
      
      expect(handler).toHaveBeenCalled();
    });

    it('should include old and new state in stateChange event', () => {
      const handler = jest.fn();
      circuitBreaker.on('stateChange', handler);
      
      // Trigger circuit open
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure(new Error(`error ${i}`));
      }
      
      expect(handler).toHaveBeenCalledWith({ from: 'closed', to: 'open' });
    });
  });

  describe('Custom Configuration', () => {
    it('should respect custom failure threshold', () => {
      const customCB = new CircuitBreaker('custom', {
        failureThreshold: 5,
        resetTimeoutMs: 1000,
        successThreshold: 2,
        halfOpenMaxCalls: 2,
      });
      
      // 3 failures should not open
      for (let i = 0; i < 3; i++) {
        customCB.recordFailure(new Error(`error ${i}`));
      }
      
      expect(customCB.getStats().state).toBe('closed');
      
      // 5 failures should open
      customCB.recordFailure(new Error('error 4'));
      customCB.recordFailure(new Error('error 5'));
      
      expect(customCB.getStats().state).toBe('open');
    });
  });
});
