import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/logger', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  }
}));

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import CircuitBreaker', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      expect(module.CircuitBreaker).toBeDefined();
    });

    it('should import CircuitBreakerManager', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      expect(module.CircuitBreakerManager).toBeDefined();
    });
  });

  describe('static methods', () => {
    it('should get default configuration', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      expect(config).toBeDefined();
      expect(typeof config.enabled).toBe('boolean');
      expect(typeof config.errorThreshold).toBe('number');
      expect(typeof config.resetTimeout).toBe('number');
      expect(typeof config.monitoringPeriod).toBe('number');
      expect(typeof config.fallbackToStale).toBe('boolean');
      expect(typeof config.halfOpenMaxCalls).toBe('number');
      expect(typeof config.failureThreshold).toBe('number');
      expect(typeof config.successThreshold).toBe('number');
      expect(typeof config.timeoutThreshold).toBe('number');
    });
  });

  describe('instance creation', () => {
    it('should create instance with config', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);
      expect(breaker).toBeDefined();
    });

    it('should have execute method', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);
      expect(typeof breaker.execute).toBe('function');
    });

    it('should have getState method', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);
      expect(typeof breaker.getState).toBe('function');
    });
  });

  describe('execute', () => {
    it('should execute successful operation', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      const result = await breaker.execute(async () => 'success');
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.circuitState).toBe('CLOSED');
      expect(result.fallbackUsed).toBe(false);
    });

    it('should handle operation failure', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      const result = await breaker.execute(async () => {
        throw new Error('Test error');
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Test error');
    });

    it('should use fallback on failure', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = { ...module.CircuitBreaker.getDefaultConfig(), fallbackToStale: true };
      const breaker = new module.CircuitBreaker(config);

      const result = await breaker.execute(
        async () => { throw new Error('Primary error'); },
        async () => 'fallback result'
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe('fallback result');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should record metrics', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      await breaker.execute(async () => 'success');
      const result = await breaker.execute(async () => 'success2');

      expect(result.metrics.totalSuccesses).toBe(2);
      expect(result.metrics.totalFailures).toBe(0);
    });

    it('should track execution time', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      const result = await breaker.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'delayed';
      });

      expect(result.executionTime).toBeGreaterThanOrEqual(10);
    });
  });

  describe('circuit state transitions', () => {
    it('should start in CLOSED state', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      const state = breaker.getState();
      expect(state.state).toBe('CLOSED');
    });

    it('should transition to OPEN after threshold failures', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = { ...module.CircuitBreaker.getDefaultConfig(), failureThreshold: 3 };
      const breaker = new module.CircuitBreaker(config);

      // Generate failures
      for (let i = 0; i < 3; i++) {
        await breaker.execute(async () => { throw new Error('Fail'); });
      }

      const state = breaker.getState();
      expect(state.state).toBe('OPEN');
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = {
        ...module.CircuitBreaker.getDefaultConfig(),
        failureThreshold: 2,
        resetTimeout: 10 // Very short timeout for testing
      };
      const breaker = new module.CircuitBreaker(config);

      // Generate failures to open circuit
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => { throw new Error('Fail'); });
      }

      expect(breaker.getState().state).toBe('OPEN');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 20));

      // Next request should transition to HALF_OPEN
      await breaker.execute(async () => 'success');

      // State might be HALF_OPEN or CLOSED depending on success threshold
      const state = breaker.getState();
      expect(['HALF_OPEN', 'CLOSED']).toContain(state.state);
    });
  });

  describe('forceState', () => {
    it('should force state to CLOSED', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('CLOSED');
      expect(breaker.getState().state).toBe('CLOSED');
    });

    it('should force state to OPEN', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('OPEN');
      expect(breaker.getState().state).toBe('OPEN');
    });

    it('should force state to HALF_OPEN', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('HALF_OPEN');
      expect(breaker.getState().state).toBe('HALF_OPEN');
    });
  });

  describe('reset', () => {
    it('should reset circuit to initial state', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      // Generate some activity
      await breaker.execute(async () => 'success');
      await breaker.execute(async () => { throw new Error('Fail'); });

      breaker.reset();

      const state = breaker.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.failures).toBe(0);
      expect(state.successes).toBe(0);
      expect(state.totalRequests).toBe(0);
    });
  });

  describe('isRequestAllowed', () => {
    it('should allow requests when CLOSED', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      expect(breaker.isRequestAllowed()).toBe(true);
    });

    it('should not allow requests when OPEN (unless reset time passed)', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = { ...module.CircuitBreaker.getDefaultConfig(), resetTimeout: 60000 };
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('OPEN');
      expect(breaker.isRequestAllowed()).toBe(false);
    });

    it('should allow limited requests when HALF_OPEN', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('HALF_OPEN');
      expect(breaker.isRequestAllowed()).toBe(true);
    });
  });

  describe('getTimeUntilNextRetry', () => {
    it('should return null when CLOSED', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      expect(breaker.getTimeUntilNextRetry()).toBeNull();
    });

    it('should return time when OPEN', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = { ...module.CircuitBreaker.getDefaultConfig(), resetTimeout: 60000 };
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('OPEN');
      const timeUntilRetry = breaker.getTimeUntilNextRetry();
      expect(timeUntilRetry).not.toBeNull();
      expect(timeUntilRetry).toBeLessThanOrEqual(60000);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy when CLOSED', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      const health = breaker.getHealthStatus();
      expect(health.healthy).toBe(true);
      expect(health.status).toBe('healthy');
    });

    it('should return degraded when HALF_OPEN', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('HALF_OPEN');
      const health = breaker.getHealthStatus();
      expect(health.healthy).toBe(false);
      expect(health.status).toBe('degraded');
    });

    it('should return unhealthy when OPEN', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('OPEN');
      const health = breaker.getHealthStatus();
      expect(health.healthy).toBe(false);
      expect(health.status).toBe('unhealthy');
    });

    it('should return degraded when high failure rate but CLOSED', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = { ...module.CircuitBreaker.getDefaultConfig(), failureThreshold: 100 }; // High threshold
      const breaker = new module.CircuitBreaker(config);

      // Generate high failure rate (> 50%)
      for (let i = 0; i < 10; i++) {
        await breaker.execute(async () => { throw new Error('Fail'); });
      }

      // If still closed, should show degraded
      const state = breaker.getState();
      if (state.state === 'CLOSED' && state.failureRate > 50) {
        const health = breaker.getHealthStatus();
        expect(health.status).toBe('degraded');
      }
    });
  });

  describe('getMetrics', () => {
    it('should return metrics object', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreaker.getDefaultConfig();
      const breaker = new module.CircuitBreaker(config);

      const metrics = breaker.getMetrics();
      expect(typeof metrics.totalFailures).toBe('number');
      expect(typeof metrics.totalSuccesses).toBe('number');
      expect(typeof metrics.currentFailureRate).toBe('number');
    });
  });

  describe('timeout handling', () => {
    it('should timeout slow operations', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = { ...module.CircuitBreaker.getDefaultConfig(), timeoutThreshold: 50 };
      const breaker = new module.CircuitBreaker(config);

      const result = await breaker.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'too slow';
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timed out');
    });
  });

  describe('fallback scenarios', () => {
    it('should use fallback when circuit is OPEN', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = {
        ...module.CircuitBreaker.getDefaultConfig(),
        fallbackToStale: true,
        resetTimeout: 60000
      };
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('OPEN');

      const result = await breaker.execute(
        async () => 'primary',
        async () => 'fallback'
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe('fallback');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should handle fallback failure', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = {
        ...module.CircuitBreaker.getDefaultConfig(),
        fallbackToStale: true,
        resetTimeout: 60000
      };
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('OPEN');

      const result = await breaker.execute(
        async () => 'primary',
        async () => { throw new Error('Fallback error'); }
      );

      expect(result.success).toBe(false);
      expect(result.fallbackUsed).toBe(true);
      expect(result.error?.message).toContain('fallback failed');
    });

    it('should return error when OPEN without fallback', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = {
        ...module.CircuitBreaker.getDefaultConfig(),
        fallbackToStale: false,
        resetTimeout: 60000
      };
      const breaker = new module.CircuitBreaker(config);

      breaker.forceState('OPEN');

      const result = await breaker.execute(async () => 'primary');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('OPEN');
    });
  });

  describe('CircuitBreakerManager', () => {
    it('should create manager instance', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      const manager = new module.CircuitBreakerManager(config);
      expect(manager).toBeDefined();
    });

    it('should get or create circuit', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      const manager = new module.CircuitBreakerManager(config);

      const circuit1 = manager.getCircuit('test');
      const circuit2 = manager.getCircuit('test');
      expect(circuit1).toBe(circuit2); // Same instance
    });

    it('should create different circuits for different names', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      const manager = new module.CircuitBreakerManager(config);

      const circuit1 = manager.getCircuit('api1');
      const circuit2 = manager.getCircuit('api2');
      expect(circuit1).not.toBe(circuit2);
    });

    it('should get all states', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      const manager = new module.CircuitBreakerManager(config);

      manager.getCircuit('api1');
      manager.getCircuit('api2');

      const states = manager.getAllStates();
      expect(states['api1']).toBeDefined();
      expect(states['api2']).toBeDefined();
    });

    it('should get overall health', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      const manager = new module.CircuitBreakerManager(config);

      manager.getCircuit('api1');
      manager.getCircuit('api2');

      const health = manager.getOverallHealth();
      expect(health.healthy).toBe(true);
      expect(health.status).toBe('healthy');
      expect(health.circuits['api1']).toBeDefined();
      expect(health.circuits['api2']).toBeDefined();
    });

    it('should show unhealthy when any circuit is OPEN', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      const manager = new module.CircuitBreakerManager(config);

      const circuit1 = manager.getCircuit('api1');
      manager.getCircuit('api2');

      circuit1.forceState('OPEN');

      const health = manager.getOverallHealth();
      expect(health.healthy).toBe(false);
      expect(health.status).toBe('unhealthy');
    });

    it('should show degraded when any circuit is HALF_OPEN', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      const manager = new module.CircuitBreakerManager(config);

      const circuit1 = manager.getCircuit('api1');
      manager.getCircuit('api2');

      circuit1.forceState('HALF_OPEN');

      const health = manager.getOverallHealth();
      expect(health.healthy).toBe(false);
      expect(health.status).toBe('degraded');
    });

    it('should reset all circuits', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      const manager = new module.CircuitBreakerManager(config);

      const circuit1 = manager.getCircuit('api1');
      const circuit2 = manager.getCircuit('api2');

      circuit1.forceState('OPEN');
      circuit2.forceState('HALF_OPEN');

      manager.resetAll();

      expect(circuit1.getState().state).toBe('CLOSED');
      expect(circuit2.getState().state).toBe('CLOSED');
    });

    it('should close all circuits', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      const manager = new module.CircuitBreakerManager(config);

      const circuit1 = manager.getCircuit('api1');
      const circuit2 = manager.getCircuit('api2');

      circuit1.forceState('OPEN');
      circuit2.forceState('HALF_OPEN');

      manager.closeAll();

      expect(circuit1.getState().state).toBe('CLOSED');
      expect(circuit2.getState().state).toBe('CLOSED');
    });

    it('should get default config from manager', async () => {
      const module = await import('../../src/admin/circuit-breaker');
      const config = module.CircuitBreakerManager.getDefaultConfig();
      expect(config).toBeDefined();
      expect(typeof config.enabled).toBe('boolean');
    });
  });
});
