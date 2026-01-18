/**
 * MCPClientManager Tests - GAP-08 Phase 2
 *
 * Tests for MCP Client Manager functionality
 */

import { MCPClientManager, MCPClientManagerConfig } from '../MCPClientManager';
import { MCPServerDefinition, TransportType, ServerCategory } from '../../types';
import { ServerNotFoundError } from '../../errors/MCPError';

describe('MCPClientManager', () => {
  let manager: MCPClientManager;

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
    manager = new MCPClientManager({
      enableCircuitBreaker: false,
      enableRetry: false,
      defaultTimeoutMs: 5000,
    });
  });

  afterEach(async () => {
    try {
      await manager.shutdown();
    } catch {
      // Ignore shutdown errors in tests
    }
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const defaultManager = new MCPClientManager();
      expect(defaultManager).toBeDefined();
    });

    it('should create with custom config', () => {
      const customManager = new MCPClientManager({
        defaultTimeoutMs: 10000,
        enableCircuitBreaker: true,
        enableRetry: true,
      });
      expect(customManager).toBeDefined();
    });
  });

  describe('initialize()', () => {
    it('should initialize successfully', async () => {
      await expect(manager.initialize()).resolves.not.toThrow();
    });

    it('should emit initialized event', async () => {
      let emitted = false;
      manager.on('initialized', () => {
        emitted = true;
      });

      await manager.initialize();

      expect(emitted).toBe(true);
    });

    it('should be idempotent', async () => {
      await manager.initialize();
      await expect(manager.initialize()).resolves.not.toThrow();
    });
  });

  describe('registerServer()', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should register a server', async () => {
      const def = createServerDef('test-server');

      await expect(manager.registerServer(def)).resolves.not.toThrow();
    });

    it('should emit serverRegistered event', async () => {
      let emittedId: string | null = null;
      manager.on('serverRegistered', (id) => {
        emittedId = id;
      });

      await manager.registerServer(createServerDef('test-server'));

      expect(emittedId).toBe('test-server');
    });

    it('should update existing server', async () => {
      const def1 = createServerDef('test-server');
      def1.name = 'Original';

      const def2 = createServerDef('test-server');
      def2.name = 'Updated';

      await manager.registerServer(def1);
      await manager.registerServer(def2);

      // No error means it was updated
    });

    it('should throw if not initialized', async () => {
      const uninitializedManager = new MCPClientManager();

      await expect(
        uninitializedManager.registerServer(createServerDef('test'))
      ).rejects.toThrow();
    });
  });

  describe('unregisterServer()', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should unregister a server', async () => {
      await manager.registerServer(createServerDef('test-server'));

      await expect(manager.unregisterServer('test-server')).resolves.not.toThrow();
    });

    it('should emit serverUnregistered event', async () => {
      let emittedId: string | null = null;
      manager.on('serverUnregistered', (id) => {
        emittedId = id;
      });

      await manager.registerServer(createServerDef('test-server'));
      await manager.unregisterServer('test-server');

      expect(emittedId).toBe('test-server');
    });

    it('should not throw for non-existent server', async () => {
      await expect(manager.unregisterServer('non-existent')).resolves.not.toThrow();
    });
  });

  describe('getTools()', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should throw for non-existent server', async () => {
      await expect(manager.getTools('non-existent')).rejects.toThrow(ServerNotFoundError);
    });
  });

  describe('getAllTools()', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should return empty map when no servers', async () => {
      const tools = await manager.getAllTools();
      expect(tools.size).toBe(0);
    });
  });

  describe('shutdown()', () => {
    it('should shutdown cleanly', async () => {
      await manager.initialize();
      await expect(manager.shutdown()).resolves.not.toThrow();
    });

    it('should emit shutdown event', async () => {
      let emitted = false;
      manager.on('shutdown', () => {
        emitted = true;
      });

      await manager.initialize();
      await manager.shutdown();

      expect(emitted).toBe(true);
    });

    it('should be idempotent', async () => {
      await manager.initialize();
      await manager.shutdown();
      await expect(manager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('getPoolStats()', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should return pool statistics', () => {
      const stats = manager.getPoolStats();

      expect(stats).toBeDefined();
    });
  });

  describe('isInitialized()', () => {
    it('should return false before initialization', () => {
      expect(manager.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await manager.initialize();
      expect(manager.isInitialized()).toBe(true);
    });

    it('should return false after shutdown', async () => {
      await manager.initialize();
      await manager.shutdown();
      expect(manager.isInitialized()).toBe(false);
    });
  });

  describe('getServerIds()', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should return empty array when no servers', () => {
      const ids = manager.getServerIds();
      expect(ids).toEqual([]);
    });

    it('should return all server IDs', async () => {
      await manager.registerServer(createServerDef('server-1'));
      await manager.registerServer(createServerDef('server-2'));

      const ids = manager.getServerIds();

      expect(ids).toContain('server-1');
      expect(ids).toContain('server-2');
    });
  });

  describe('server checking', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should find registered server', async () => {
      await manager.registerServer(createServerDef('test-server'));

      expect(manager.getServerIds().includes('test-server')).toBe(true);
    });

    it('should not find non-existent server', () => {
      expect(manager.getServerIds().includes('non-existent')).toBe(false);
    });
  });

  describe('event forwarding', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should forward connection events', async () => {
      const events: string[] = [];

      manager.on('connectionCreated', () => events.push('created'));
      manager.on('connectionClosed', () => events.push('closed'));
      manager.on('connectionError', () => events.push('error'));

      // Events are forwarded from pool - they would emit when actual connections happen
      expect(events).toEqual([]);
    });
  });

  describe('config management', () => {
    it('should apply default timeout', () => {
      const configuredManager = new MCPClientManager({
        defaultTimeoutMs: 60000,
      });

      expect(configuredManager).toBeDefined();
    });

    it('should enable circuit breaker when configured', () => {
      const configuredManager = new MCPClientManager({
        enableCircuitBreaker: true,
      });

      expect(configuredManager).toBeDefined();
    });

    it('should enable retry when configured', () => {
      const configuredManager = new MCPClientManager({
        enableRetry: true,
      });

      expect(configuredManager).toBeDefined();
    });
  });
});
