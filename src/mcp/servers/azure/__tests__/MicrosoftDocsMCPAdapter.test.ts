/**
 * Microsoft Docs MCP Adapter Tests
 */

import { MicrosoftDocsMCPAdapter } from '../MicrosoftDocsMCPAdapter';
import { MCPClientManager } from '../../../core/MCPClientManager';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('MicrosoftDocsMCPAdapter', () => {
  let adapter: MicrosoftDocsMCPAdapter;
  let mockClientManager: MCPClientManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientManager = {} as MCPClientManager;
    adapter = new MicrosoftDocsMCPAdapter(mockClientManager, {
      locale: 'en-us',
      maxRetries: 1,
      timeoutMs: 5000,
    });
  });

  describe('Initialization', () => {
    it('should have correct server ID', () => {
      expect(adapter.getServerId()).toBe('microsoft-docs-mcp');
    });

    it('should return native transport definition', () => {
      const definition = adapter.getDefinition();
      expect(definition.transport).toBe('native');
      expect(definition.command).toBe('');
      expect(definition.category).toBe('documentation');
      expect(definition.tags).toContain('native');
    });

    it('should initialize successfully', async () => {
      await adapter.initialize();
      expect(adapter['registered']).toBe(true);
    });

    it('should define search and ping tools', async () => {
      await adapter.initialize();
      expect(adapter['tools']).toHaveLength(2);
      expect(adapter['tools'].map((t: { name: string }) => t.name)).toContain('search');
      expect(adapter['tools'].map((t: { name: string }) => t.name)).toContain('ping');
    });
  });

  describe('ping', () => {
    it('should return ok status', async () => {
      const result = await adapter.ping();
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ok');
      expect(result.data?.service).toBe('microsoft-docs-mcp');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should validate empty query', async () => {
      const result = await adapter.search('');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should search documentation successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              title: 'Azure Virtual Machines overview',
              url: '/azure/virtual-machines/overview',
              description: 'Learn about Azure Virtual Machines',
              lastUpdatedDate: '2025-01-10',
              breadcrumbs: [{ title: 'Azure', url: '/azure' }],
            },
            {
              title: 'Create a Windows VM',
              url: 'https://learn.microsoft.com/azure/virtual-machines/windows/quick-create-portal',
              description: 'Create a Windows virtual machine in Azure',
              lastUpdatedDate: '2025-01-08',
            },
          ],
          count: 2,
        }),
      });

      const result = await adapter.search('Azure virtual machines');
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ok');
      expect(result.data?.count).toBe(2);
      expect(result.data?.results[0].title).toBe('Azure Virtual Machines overview');
      expect(result.data?.results[0].url).toContain('https://learn.microsoft.com');
    });

    it('should apply limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      await adapter.search('bicep', { limit: 5 });
      
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('%24top=5');
    });

    it('should apply category filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      await adapter.search('security', { category: 'azure' });
      
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('scope=azure');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await adapter.search('test query');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_ERROR');
    });

    it('should cap limit at 50', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      await adapter.search('test', { limit: 100 });
      
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('%24top=50');
    });
  });

  describe('searchAzureBestPractices', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should search for best practices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              title: 'Azure Security Best Practices',
              url: '/azure/security/best-practices',
              description: 'Security best practices for Azure',
            },
          ],
          count: 1,
        }),
      });

      const results = await adapter.searchAzureBestPractices('security');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Security');
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'));

      const results = await adapter.searchAzureBestPractices('test');
      
      expect(results).toEqual([]);
    });
  });

  describe('searchBicepDocs', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should search Bicep documentation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              title: 'Bicep modules',
              url: '/azure/azure-resource-manager/bicep/modules',
              description: 'Learn about Bicep modules',
            },
          ],
          count: 1,
        }),
      });

      const results = await adapter.searchBicepDocs('modules');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Bicep');
    });
  });

  describe('getServiceDocs', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should get service documentation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              title: 'Azure Functions documentation',
              url: '/azure/azure-functions/',
              description: 'Azure Functions overview',
            },
          ],
          count: 1,
        }),
      });

      const results = await adapter.getServiceDocs('Functions');
      
      expect(results).toHaveLength(1);
    });
  });

  describe('searchSecurityGuidance', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should search security guidance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              title: 'Azure networking security',
              url: '/azure/security/network-security',
              description: 'Network security guidance',
            },
          ],
          count: 1,
        }),
      });

      const results = await adapter.searchSecurityGuidance('networking');
      
      expect(results).toHaveLength(1);
    });
  });

  describe('searchArchitecturePatterns', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should search architecture patterns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              title: 'Microservices architecture on Azure',
              url: '/azure/architecture/microservices/',
              description: 'Design microservices on Azure',
            },
          ],
          count: 1,
        }),
      });

      const results = await adapter.searchArchitecturePatterns('microservices');
      
      expect(results).toHaveLength(1);
    });
  });

  describe('callTool', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should route search correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      const result = await adapter.callTool('search', { query: 'test' });
      expect(result.success).toBe(true);
    });

    it('should route ping correctly', async () => {
      const result = await adapter.callTool('ping', {});
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'ok');
    });

    it('should return error for unknown tool', async () => {
      const result = await adapter.callTool('unknown', {});
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_TOOL');
    });
  });
});
