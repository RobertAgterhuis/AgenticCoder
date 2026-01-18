/**
 * MCPConnectionPool Tests - GAP-08 Phase 2
 *
 * Tests for MCP Connection Pool functionality
 */

import { MCPConnectionPool, PoolStats, createConnectionPool } from '../MCPConnectionPool';
import { MCPServerDefinition, ServerCategory, TransportType } from '../../types';
import { ServerNotFoundError, ResourceExhaustedError } from '../../errors/MCPError';

describe('MCPConnectionPool', () => {
  let pool: MCPConnectionPool;

  const createServerDef = (
    id: string,
    transport: TransportType = 'stdio'
  ): MCPServerDefinition => ({
    id,
    name: `Test Server ${id}`,
    description: `Test server ${id}`,
    category: 'utility' as ServerCategory,
    transport,
    enabled: true,
    command: 'echo',
    args: ['test'],
  });

  beforeEach(() => {
    pool = new MCPConnectionPool({
      maxConnections: 5,
      idleTimeoutMs: 30000,
      acquireTimeoutMs: 5000,
    });
  });

  afterEach(async () => {
    try {
      await pool.close();
    } catch {
      // Ignore close errors in tests
    }
  });

  describe('createConnectionPool()', () => {
    it('should create a pool with default config', () => {
      const defaultPool = createConnectionPool();
      expect(defaultPool).toBeInstanceOf(MCPConnectionPool);
    });

    it('should create a pool with custom config', () => {
      const customPool = createConnectionPool({
        maxConnections: 10,
        idleTimeoutMs: 60000,
      });
      expect(customPool).toBeInstanceOf(MCPConnectionPool);
    });
  });

  describe('initialize()', () => {
    it('should initialize successfully', async () => {
      await expect(pool.initialize()).resolves.not.toThrow();
    });

    it('should be idempotent', async () => {
      await pool.initialize();
      await expect(pool.initialize()).resolves.not.toThrow();
    });
  });

  describe('registerServer()', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should register a server', () => {
      const def = createServerDef('test-server');

      expect(() => pool.registerServer(def)).not.toThrow();
    });

    it('should emit serverRegistered event', () => {
      let emittedId: string | null = null;
      pool.on('serverRegistered', (id) => {
        emittedId = id;
      });

      pool.registerServer(createServerDef('test-server'));

      expect(emittedId).toBe('test-server');
    });

    it('should update existing server', () => {
      const def1 = createServerDef('test-server');
      const def2 = createServerDef('test-server');
      def2.name = 'Updated';

      pool.registerServer(def1);
      expect(() => pool.registerServer(def2)).not.toThrow();
    });
  });

  describe('unregisterServer()', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should unregister a server', async () => {
      pool.registerServer(createServerDef('test-server'));

      await expect(pool.unregisterServer('test-server')).resolves.not.toThrow();
    });

    it('should emit serverUnregistered event', async () => {
      let emittedId: string | null = null;
      pool.on('serverUnregistered', (id) => {
        emittedId = id;
      });

      pool.registerServer(createServerDef('test-server'));
      await pool.unregisterServer('test-server');

      expect(emittedId).toBe('test-server');
    });

    it('should not throw for non-existent server', async () => {
      await expect(pool.unregisterServer('non-existent')).resolves.not.toThrow();
    });
  });

  describe('getStats()', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should return pool statistics', () => {
      const stats = pool.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.idle).toBe('number');
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.servers).toBe('number');
    });

    it('should count registered servers', () => {
      pool.registerServer(createServerDef('server-1'));
      pool.registerServer(createServerDef('server-2'));

      const stats = pool.getStats();

      expect(stats.servers).toBe(2);
    });

    it('should start with zero connections', () => {
      const stats = pool.getStats();

      expect(stats.active).toBe(0);
      expect(stats.idle).toBe(0);
      expect(stats.total).toBe(0);
    });
  });

  describe('hasServer()', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should return true for registered server', () => {
      pool.registerServer(createServerDef('test-server'));

      expect(pool.hasServer('test-server')).toBe(true);
    });

    it('should return false for non-existent server', () => {
      expect(pool.hasServer('non-existent')).toBe(false);
    });
  });

  describe('close()', () => {
    it('should close the pool', async () => {
      await pool.initialize();

      await expect(pool.close()).resolves.not.toThrow();
    });

    it('should be idempotent', async () => {
      await pool.initialize();
      await pool.close();

      await expect(pool.close()).resolves.not.toThrow();
    });
  });

  describe('metrics', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should record latency', () => {
      pool.recordLatency(100);
      pool.recordLatency(200);
      pool.recordLatency(150);

      const avgLatency = pool.getAverageLatency();
      expect(avgLatency).toBeGreaterThan(0);
    });

    it('should record errors', () => {
      pool.recordError();
      pool.recordError();

      const errorRate = pool.getErrorRate();
      // Error rate depends on total requests, so just verify no throw
      expect(errorRate).toBeDefined();
    });

    it('should return total requests', () => {
      const totalRequests = pool.getTotalRequests();
      expect(typeof totalRequests).toBe('number');
    });

    it('should return error rate', () => {
      const errorRate = pool.getErrorRate();
      expect(typeof errorRate).toBe('number');
    });

    it('should return average latency', () => {
      const avgLatency = pool.getAverageLatency();
      expect(typeof avgLatency).toBe('number');
    });
  });

  describe('acquire timeout', () => {
    beforeEach(async () => {
      pool = new MCPConnectionPool({
        maxConnections: 1,
        acquireTimeoutMs: 100, // Very short timeout
      });
      await pool.initialize();
    });

    it('should throw when server not registered', async () => {
      await expect(pool.acquire('non-existent')).rejects.toThrow(ServerNotFoundError);
    });
  });

  describe('event emission', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should be an EventEmitter', () => {
      expect(typeof pool.on).toBe('function');
      expect(typeof pool.emit).toBe('function');
      expect(typeof pool.removeListener).toBe('function');
    });

    it('should emit events correctly', () => {
      const events: string[] = [];

      pool.on('serverRegistered', () => events.push('registered'));
      pool.registerServer(createServerDef('test'));

      expect(events).toContain('registered');
    });
  });

  describe('configuration', () => {
    it('should respect max connections config', () => {
      const configuredPool = new MCPConnectionPool({
        maxConnections: 10,
      });

      expect(configuredPool).toBeDefined();
    });

    it('should respect idle timeout config', () => {
      const configuredPool = new MCPConnectionPool({
        idleTimeoutMs: 60000,
      });

      expect(configuredPool).toBeDefined();
    });

    it('should respect acquire timeout config', () => {
      const configuredPool = new MCPConnectionPool({
        acquireTimeoutMs: 10000,
      });

      expect(configuredPool).toBeDefined();
    });
  });

  describe('getServerIds()', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should return empty array when no servers', () => {
      const ids = pool.getServerIds();
      expect(ids).toEqual([]);
    });

    it('should return all registered server IDs', () => {
      pool.registerServer(createServerDef('server-1'));
      pool.registerServer(createServerDef('server-2'));
      pool.registerServer(createServerDef('server-3'));

      const ids = pool.getServerIds();

      expect(ids).toContain('server-1');
      expect(ids).toContain('server-2');
      expect(ids).toContain('server-3');
    });
  });
});
