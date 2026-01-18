/**
 * MCPServerRegistry Tests - GAP-08 Phase 2
 *
 * Tests for MCP Server Registry functionality
 */

import { MCPServerRegistry, ServerFilter, RegistryStats } from '../MCPServerRegistry';
import { MCPServerDefinition, ServerCategory, TransportType, MCPToolDefinition, JSONSchema } from '../../types';
import { ServerNotFoundError } from '../../errors/MCPError';

describe('MCPServerRegistry', () => {
  let registry: MCPServerRegistry;

  const createServerDef = (
    id: string,
    category: ServerCategory = 'utility',
    transport: TransportType = 'stdio',
    enabled: boolean = true
  ): MCPServerDefinition => {
    const base: MCPServerDefinition = {
      id,
      name: `Test Server ${id}`,
      description: `Test server ${id}`,
      category,
      transport,
      enabled,
    };

    // Add required properties based on transport type
    if (transport === 'stdio') {
      base.command = 'echo';
      base.args = ['test'];
    } else if (transport === 'http' || transport === 'sse') {
      base.url = 'http://localhost:3000';
    }

    return base;
  };

  const createToolDef = (name: string): MCPToolDefinition => ({
    name,
    description: `Tool ${name}`,
    inputSchema: { type: 'object' } as JSONSchema,
  });

  beforeEach(() => {
    registry = new MCPServerRegistry();
  });

  describe('register()', () => {
    it('should register a new server', () => {
      const def = createServerDef('server-1');

      registry.register(def);

      expect(registry.has('server-1')).toBe(true);
    });

    it('should emit serverRegistered event', () => {
      const def = createServerDef('server-1');
      let emittedId: string | null = null;

      registry.on('serverRegistered', (id) => {
        emittedId = id;
      });

      registry.register(def);

      expect(emittedId).toBe('server-1');
    });

    it('should update existing server', () => {
      const def1 = createServerDef('server-1');
      def1.name = 'Original Name';

      const def2 = createServerDef('server-1');
      def2.name = 'Updated Name';

      registry.register(def1);
      registry.register(def2);

      expect(registry.get('server-1').name).toBe('Updated Name');
    });

    it('should emit serverUpdated event on update', () => {
      const def1 = createServerDef('server-1');
      const def2 = createServerDef('server-1');
      let emittedId: string | null = null;

      registry.register(def1);

      registry.on('serverUpdated', (id) => {
        emittedId = id;
      });

      registry.register(def2);

      expect(emittedId).toBe('server-1');
    });
  });

  describe('registerBulk()', () => {
    it('should register multiple servers', () => {
      const servers = [
        createServerDef('server-1'),
        createServerDef('server-2'),
        createServerDef('server-3'),
      ];

      registry.registerBulk(servers);

      expect(registry.has('server-1')).toBe(true);
      expect(registry.has('server-2')).toBe(true);
      expect(registry.has('server-3')).toBe(true);
    });
  });

  describe('unregister()', () => {
    it('should unregister an existing server', () => {
      const def = createServerDef('server-1');
      registry.register(def);

      const result = registry.unregister('server-1');

      expect(result).toBe(true);
      expect(registry.has('server-1')).toBe(false);
    });

    it('should return false for non-existent server', () => {
      const result = registry.unregister('non-existent');

      expect(result).toBe(false);
    });

    it('should emit serverUnregistered event', () => {
      const def = createServerDef('server-1');
      registry.register(def);
      let emittedId: string | null = null;

      registry.on('serverUnregistered', (id) => {
        emittedId = id;
      });

      registry.unregister('server-1');

      expect(emittedId).toBe('server-1');
    });
  });

  describe('get()', () => {
    it('should return server definition', () => {
      const def = createServerDef('server-1');
      registry.register(def);

      const result = registry.get('server-1');

      expect(result.id).toBe('server-1');
      expect(result.name).toBe('Test Server server-1');
    });

    it('should throw ServerNotFoundError for non-existent server', () => {
      expect(() => registry.get('non-existent')).toThrow(ServerNotFoundError);
    });
  });

  describe('getOrNull()', () => {
    it('should return server definition if exists', () => {
      const def = createServerDef('server-1');
      registry.register(def);

      const result = registry.getOrNull('server-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('server-1');
    });

    it('should return undefined for non-existent server', () => {
      const result = registry.getOrNull('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('has()', () => {
    it('should return true for existing server', () => {
      registry.register(createServerDef('server-1'));

      expect(registry.has('server-1')).toBe(true);
    });

    it('should return false for non-existent server', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('getServerIds()', () => {
    it('should return all server IDs', () => {
      registry.register(createServerDef('server-1'));
      registry.register(createServerDef('server-2'));
      registry.register(createServerDef('server-3'));

      const ids = registry.getServerIds();

      expect(ids).toContain('server-1');
      expect(ids).toContain('server-2');
      expect(ids).toContain('server-3');
      expect(ids.length).toBe(3);
    });

    it('should return empty array when no servers', () => {
      const ids = registry.getServerIds();

      expect(ids).toEqual([]);
    });
  });

  describe('getAll()', () => {
    it('should return all server definitions', () => {
      registry.register(createServerDef('server-1'));
      registry.register(createServerDef('server-2'));

      const all = registry.getAll();

      expect(all.length).toBe(2);
      expect(all.some(s => s.id === 'server-1')).toBe(true);
      expect(all.some(s => s.id === 'server-2')).toBe(true);
    });
  });

  describe('filter()', () => {
    beforeEach(() => {
      registry.register(createServerDef('utility-1', 'utility', 'stdio', true));
      registry.register(createServerDef('utility-2', 'utility', 'http', true));
      registry.register(createServerDef('data-1', 'data', 'stdio', true));
      registry.register(createServerDef('disabled-1', 'utility', 'stdio', false));
    });

    it('should filter by category', () => {
      const result = registry.filter({ category: 'utility' });

      expect(result.length).toBe(3);
      expect(result.every(s => s.category === 'utility')).toBe(true);
    });

    it('should filter by transport', () => {
      const result = registry.filter({ transport: 'stdio' });

      expect(result.length).toBe(3);
      expect(result.every(s => s.transport === 'stdio')).toBe(true);
    });

    it('should filter by enabled status', () => {
      const result = registry.filter({ enabled: true });

      expect(result.length).toBe(3);
      expect(result.every(s => s.enabled === true)).toBe(true);
    });

    it('should combine multiple filters', () => {
      const result = registry.filter({
        category: 'utility',
        transport: 'stdio',
        enabled: true,
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('utility-1');
    });
  });

  describe('getByCategory()', () => {
    it('should return servers by category', () => {
      registry.register(createServerDef('utility-1', 'utility'));
      registry.register(createServerDef('data-1', 'data'));

      const utilityServers = registry.getByCategory('utility');

      expect(utilityServers.length).toBe(1);
      expect(utilityServers[0].id).toBe('utility-1');
    });
  });

  describe('getEnabled()', () => {
    it('should return only enabled servers', () => {
      registry.register(createServerDef('enabled', 'utility', 'stdio', true));
      registry.register(createServerDef('disabled', 'utility', 'stdio', false));

      const enabled = registry.getEnabled();

      expect(enabled.length).toBe(1);
      expect(enabled[0].id).toBe('enabled');
    });
  });

  describe('enable() / disable()', () => {
    it('should enable a disabled server', () => {
      const def = createServerDef('server-1', 'utility', 'stdio', false);
      registry.register(def);

      registry.enable('server-1');

      expect(registry.get('server-1').enabled).toBe(true);
    });

    it('should disable an enabled server', () => {
      const def = createServerDef('server-1', 'utility', 'stdio', true);
      registry.register(def);

      registry.disable('server-1');

      expect(registry.get('server-1').enabled).toBe(false);
    });

    it('should emit serverEnabled event', () => {
      const def = createServerDef('server-1', 'utility', 'stdio', false);
      registry.register(def);
      let emittedId: string | null = null;

      registry.on('serverEnabled', (id) => {
        emittedId = id;
      });

      registry.enable('server-1');

      expect(emittedId).toBe('server-1');
    });

    it('should emit serverDisabled event', () => {
      const def = createServerDef('server-1', 'utility', 'stdio', true);
      registry.register(def);
      let emittedId: string | null = null;

      registry.on('serverDisabled', (id) => {
        emittedId = id;
      });

      registry.disable('server-1');

      expect(emittedId).toBe('server-1');
    });

    it('should throw for non-existent server', () => {
      expect(() => registry.enable('non-existent')).toThrow(ServerNotFoundError);
      expect(() => registry.disable('non-existent')).toThrow(ServerNotFoundError);
    });
  });

  describe('tool cache', () => {
    const mockTools = [
      { name: 'tool1', description: 'Tool 1', inputSchema: { type: 'object' } },
      { name: 'tool2', description: 'Tool 2', inputSchema: { type: 'object' } },
    ];

    beforeEach(() => {
      registry.register(createServerDef('server-1'));
    });

    it('should update tool cache', () => {
      registry.updateToolCache('server-1', mockTools);

      const cached = registry.getCachedTools('server-1');
      expect(cached).toEqual(mockTools);
    });

    it('should return null for empty cache', () => {
      const cached = registry.getCachedTools('server-1');
      expect(cached).toBeNull();
    });

    it('should return null for non-existent server', () => {
      const cached = registry.getCachedTools('non-existent');
      expect(cached).toBeNull();
    });

    it('should clear tool cache', () => {
      registry.updateToolCache('server-1', mockTools);
      registry.clearToolCache('server-1');

      const cached = registry.getCachedTools('server-1');
      expect(cached).toBeNull();
    });

    it('should clear all tool caches', () => {
      registry.register(createServerDef('server-2'));
      registry.updateToolCache('server-1', mockTools);
      registry.updateToolCache('server-2', mockTools);

      registry.clearAllToolCaches();

      expect(registry.getCachedTools('server-1')).toBeNull();
      expect(registry.getCachedTools('server-2')).toBeNull();
    });
  });

  describe('findServersByTool()', () => {
    it('should find servers that have a specific tool', () => {
      registry.register(createServerDef('server-1'));
      registry.register(createServerDef('server-2'));

      registry.updateToolCache('server-1', [
        { name: 'shared-tool', description: '', inputSchema: { type: 'object' } },
        { name: 'unique-tool-1', description: '', inputSchema: { type: 'object' } },
      ]);
      registry.updateToolCache('server-2', [
        { name: 'shared-tool', description: '', inputSchema: { type: 'object' } },
        { name: 'unique-tool-2', description: '', inputSchema: { type: 'object' } },
      ]);

      const servers = registry.findServersByTool('shared-tool');

      expect(servers.length).toBe(2);
    });

    it('should return empty array if tool not found', () => {
      registry.register(createServerDef('server-1'));

      const servers = registry.findServersByTool('non-existent-tool');

      expect(servers).toEqual([]);
    });
  });

  describe('getStats()', () => {
    it('should return registry statistics', () => {
      registry.register(createServerDef('utility-1', 'utility', 'stdio', true));
      registry.register(createServerDef('utility-2', 'utility', 'http', true));
      registry.register(createServerDef('data-1', 'data', 'stdio', false));

      const stats = registry.getStats();

      expect(stats.total).toBe(3);
      expect(stats.enabled).toBe(2);
      expect(stats.disabled).toBe(1);
      expect(stats.byCategory['utility']).toBe(2);
      expect(stats.byCategory['data']).toBe(1);
    });

    it('should return zero stats for empty registry', () => {
      const stats = registry.getStats();

      expect(stats.total).toBe(0);
      expect(stats.enabled).toBe(0);
      expect(stats.disabled).toBe(0);
    });
  });
});
