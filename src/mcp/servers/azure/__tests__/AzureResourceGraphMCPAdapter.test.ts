/**
 * Azure Resource Graph MCP Adapter Tests
 */

import { AzureResourceGraphMCPAdapter } from '../AzureResourceGraphMCPAdapter';
import { MCPClientManager } from '../../../core/MCPClientManager';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock child_process for Azure CLI token
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => {
    if (cmd.includes('az account get-access-token')) {
      callback(null, { 
        stdout: JSON.stringify({
          accessToken: 'mock-token-123',
          expiresOn: new Date(Date.now() + 3600000).toISOString(),
        }),
      });
    }
  }),
}));

jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: (fn: Function) => {
    if (fn.name === 'exec') {
      return async () => ({
        stdout: JSON.stringify({
          accessToken: 'mock-token-123',
          expiresOn: new Date(Date.now() + 3600000).toISOString(),
        }),
      });
    }
    return jest.requireActual('util').promisify(fn);
  },
}));

describe('AzureResourceGraphMCPAdapter', () => {
  let adapter: AzureResourceGraphMCPAdapter;
  let mockClientManager: MCPClientManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientManager = {} as MCPClientManager;
    adapter = new AzureResourceGraphMCPAdapter(mockClientManager, {
      subscriptionId: 'test-subscription-id',
      maxRetries: 1,
      timeoutMs: 5000,
    });
  });

  describe('Initialization', () => {
    it('should have correct server ID', () => {
      expect(adapter.getServerId()).toBe('azure-resource-graph-mcp');
    });

    it('should return native transport definition', () => {
      const definition = adapter.getDefinition();
      expect(definition.transport).toBe('native');
      expect(definition.command).toBe('');
      expect(definition.tags).toContain('native');
      expect(definition.tags).toContain('governance');
    });

    it('should initialize successfully', async () => {
      await adapter.initialize();
      expect(adapter['registered']).toBe(true);
    });

    it('should define query and ping tools', async () => {
      await adapter.initialize();
      expect(adapter['tools']).toHaveLength(2);
      expect(adapter['tools'].map((t: { name: string }) => t.name)).toContain('query');
      expect(adapter['tools'].map((t: { name: string }) => t.name)).toContain('ping');
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should validate empty query', async () => {
      const result = await adapter.query('');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should execute Resource Graph query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalRecords: 2,
          count: 2,
          data: {
            columns: [
              { name: 'id', type: 'string' },
              { name: 'name', type: 'string' },
              { name: 'type', type: 'string' },
            ],
            rows: [
              ['/subscriptions/xxx/resourceGroups/rg1/providers/Microsoft.Compute/virtualMachines/vm1', 'vm1', 'microsoft.compute/virtualmachines'],
              ['/subscriptions/xxx/resourceGroups/rg1/providers/Microsoft.Compute/virtualMachines/vm2', 'vm2', 'microsoft.compute/virtualmachines'],
            ],
          },
        }),
      });

      const result = await adapter.query('resources | limit 10');
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ok');
      expect(result.data?.count).toBe(2);
      expect(result.data?.data[0].name).toBe('vm1');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const result = await adapter.query('resources | limit 10');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_ERROR');
    });
  });

  describe('listResourcesByType', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should list VMs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            columns: [
              { name: 'id', type: 'string' },
              { name: 'name', type: 'string' },
              { name: 'type', type: 'string' },
              { name: 'location', type: 'string' },
              { name: 'resourceGroup', type: 'string' },
              { name: 'subscriptionId', type: 'string' },
              { name: 'properties', type: 'object' },
              { name: 'tags', type: 'object' },
            ],
            rows: [
              ['/subscriptions/xxx/resourceGroups/rg1/providers/Microsoft.Compute/virtualMachines/vm1', 'vm1', 'microsoft.compute/virtualmachines', 'westeurope', 'rg1', 'xxx', {}, {}],
            ],
          },
        }),
      });

      const vms = await adapter.listResourcesByType('Microsoft.Compute/virtualMachines');
      
      expect(vms).toHaveLength(1);
      expect(vms[0].name).toBe('vm1');
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const vms = await adapter.listResourcesByType('Microsoft.Compute/virtualMachines');
      
      expect(vms).toEqual([]);
    });
  });

  describe('listResourcesInGroup', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should list resources in resource group', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            columns: [
              { name: 'id', type: 'string' },
              { name: 'name', type: 'string' },
              { name: 'type', type: 'string' },
              { name: 'location', type: 'string' },
              { name: 'resourceGroup', type: 'string' },
              { name: 'subscriptionId', type: 'string' },
              { name: 'properties', type: 'object' },
              { name: 'tags', type: 'object' },
            ],
            rows: [
              ['id1', 'resource1', 'type1', 'westeurope', 'test-rg', 'xxx', {}, {}],
              ['id2', 'resource2', 'type2', 'westeurope', 'test-rg', 'xxx', {}, {}],
            ],
          },
        }),
      });

      const resources = await adapter.listResourcesInGroup('test-rg');
      
      expect(resources).toHaveLength(2);
    });
  });

  describe('findResourcesByTag', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should find resources by tag name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            columns: [
              { name: 'id', type: 'string' },
              { name: 'name', type: 'string' },
              { name: 'type', type: 'string' },
              { name: 'location', type: 'string' },
              { name: 'resourceGroup', type: 'string' },
              { name: 'subscriptionId', type: 'string' },
              { name: 'properties', type: 'object' },
              { name: 'tags', type: 'object' },
            ],
            rows: [
              ['id1', 'app1', 'type1', 'westeurope', 'rg1', 'xxx', {}, { environment: 'prod' }],
            ],
          },
        }),
      });

      const resources = await adapter.findResourcesByTag('environment', 'prod');
      
      expect(resources).toHaveLength(1);
    });
  });

  describe('getResourceCountByType', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should return resource counts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            columns: [
              { name: 'type', type: 'string' },
              { name: 'count_', type: 'long' },
            ],
            rows: [
              ['microsoft.compute/virtualmachines', 10],
              ['microsoft.storage/storageaccounts', 5],
            ],
          },
        }),
      });

      const counts = await adapter.getResourceCountByType();
      
      expect(counts).toHaveLength(2);
      expect(counts[0].type).toBe('microsoft.compute/virtualmachines');
      expect(counts[0].count).toBe(10);
    });
  });

  describe('callTool', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should route query correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { columns: [], rows: [] },
        }),
      });

      const result = await adapter.callTool('query', { query: 'resources | limit 1' });
      expect(result.success).toBe(true);
    });

    it('should return error for unknown tool', async () => {
      const result = await adapter.callTool('unknown', {});
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_TOOL');
    });
  });
});
