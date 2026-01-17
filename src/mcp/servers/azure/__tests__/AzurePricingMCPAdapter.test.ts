/**
 * Azure Pricing MCP Adapter Tests
 */

import { AzurePricingMCPAdapter } from '../AzurePricingMCPAdapter';
import { MCPClientManager } from '../../../core/MCPClientManager';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AzurePricingMCPAdapter', () => {
  let adapter: AzurePricingMCPAdapter;
  let mockClientManager: MCPClientManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientManager = {} as MCPClientManager;
    adapter = new AzurePricingMCPAdapter(mockClientManager, {
      defaultRegion: 'westeurope',
      defaultCurrency: 'EUR',
      maxRetries: 1,
      timeoutMs: 5000,
    });
  });

  describe('Initialization', () => {
    it('should have correct server ID', () => {
      expect(adapter.getServerId()).toBe('azure-pricing-mcp');
    });

    it('should return native transport definition', () => {
      const definition = adapter.getDefinition();
      expect(definition.transport).toBe('native');
      expect(definition.command).toBe('');
      expect(definition.tags).toContain('native');
    });

    it('should initialize successfully', async () => {
      await adapter.initialize();
      expect(adapter['registered']).toBe(true);
    });

    it('should define correct tools after initialization', async () => {
      await adapter.initialize();
      expect(adapter['tools']).toHaveLength(3);
      expect(adapter['tools'].map((t: { name: string }) => t.name)).toContain('price_search');
      expect(adapter['tools'].map((t: { name: string }) => t.name)).toContain('cost_estimate');
      expect(adapter['tools'].map((t: { name: string }) => t.name)).toContain('ping');
    });
  });

  describe('ping', () => {
    it('should return ok status', async () => {
      const result = await adapter.ping();
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ok');
      expect(result.data?.service).toBe('azure-pricing-mcp');
    });
  });

  describe('priceSearch', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should validate empty sku', async () => {
      const result = await adapter.priceSearch('');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should validate sku length', async () => {
      const result = await adapter.priceSearch('a'.repeat(201));
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.message).toContain('too long');
    });

    it('should search prices successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [
            {
              skuName: 'Standard_B2s',
              retailPrice: 0.0416,
              currencyCode: 'EUR',
              armRegionName: 'westeurope',
              productName: 'Virtual Machines Bs Series',
              serviceName: 'Virtual Machines',
              meterName: 'B2s',
              unitOfMeasure: '1 Hour',
            },
          ],
          Count: 1,
        }),
      });

      const result = await adapter.priceSearch('Standard_B2s');
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ok');
      expect(result.data?.count).toBe(1);
      expect(result.data?.items[0].skuName).toBe('Standard_B2s');
    });

    it('should apply region and currency filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], Count: 0 }),
      });

      await adapter.priceSearch('Standard_B2s', { region: 'eastus', currency: 'USD' });
      
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('eastus');
      expect(calledUrl).toContain('USD');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await adapter.priceSearch('Standard_B2s');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_ERROR');
    });

    it('should escape OData special characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], Count: 0 }),
      });

      await adapter.priceSearch("Standard's_B2s");
      
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("Standard%27%27s_B2s");
    });
  });

  describe('costEstimate', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should estimate cost based on search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [{ skuName: 'Standard_B2s', retailPrice: 0.05 }],
          Count: 1,
        }),
      });

      const result = await adapter.costEstimate('Standard_B2s', 2);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ok');
      expect(result.data?.quantity).toBe(2);
      expect(result.data?.unit_price).toBe(0.05);
      expect(result.data?.monthly_usd).toBe(0.05 * 2 * 730); // 73
    });

    it('should return not-found when SKU not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], Count: 0 }),
      });

      const result = await adapter.costEstimate('NonExistent_SKU');
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('not-found');
    });

    it('should default quantity to 1', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [{ skuName: 'Standard_B2s', retailPrice: 0.05 }],
          Count: 1,
        }),
      });

      const result = await adapter.costEstimate('Standard_B2s');
      
      expect(result.data?.quantity).toBe(1);
      expect(result.data?.monthly_usd).toBe(0.05 * 730);
    });
  });

  describe('getVMPrice', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should return price for VM size', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Items: [{ skuName: 'Standard_D2s_v3', retailPrice: 0.096 }],
          Count: 1,
        }),
      });

      const price = await adapter.getVMPrice('Standard_D2s_v3', 'eastus');
      
      expect(price).toBe(0.096);
    });

    it('should return null when VM not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], Count: 0 }),
      });

      const price = await adapter.getVMPrice('Unknown_VM');
      
      expect(price).toBeNull();
    });
  });

  describe('estimateInfrastructureCost', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should aggregate costs for multiple resources', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            Items: [{ skuName: 'Standard_B2s', retailPrice: 0.05 }],
            Count: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            Items: [{ skuName: 'Standard_D4s_v3', retailPrice: 0.20 }],
            Count: 1,
          }),
        });

      const result = await adapter.estimateInfrastructureCost([
        { sku: 'Standard_B2s', quantity: 2 },
        { sku: 'Standard_D4s_v3', quantity: 1 },
      ]);
      
      expect(result.breakdown).toHaveLength(2);
      expect(result.total).toBe((0.05 * 2 * 730) + (0.20 * 1 * 730));
    });
  });

  describe('callTool', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should route price_search correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], Count: 0 }),
      });

      const result = await adapter.callTool('price_search', { sku: 'test' });
      expect(result.success).toBe(true);
    });

    it('should route ping correctly', async () => {
      const result = await adapter.callTool('ping', {});
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'ok');
    });

    it('should return error for unknown tool', async () => {
      const result = await adapter.callTool('unknown_tool', {});
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_TOOL');
    });
  });
});
