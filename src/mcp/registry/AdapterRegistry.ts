/**
 * Central registry for MCP adapters
 * Provides discovery, lazy initialization, and tool invocation
 * 
 * @module mcp/registry/AdapterRegistry
 */

import { EventEmitter } from 'events';
import {
  AdapterMetadata,
  AdapterRegistration,
  AdapterCategory,
  AdapterFactory,
  ToolRequest,
  ToolResult,
} from './types';
import { BaseServerAdapter } from '../servers/BaseServerAdapter';
import { ConfigLoader } from '../../config';

/**
 * Central adapter registry for MCP servers
 * 
 * @example
 * ```typescript
 * const registry = AdapterRegistry.getInstance();
 * await registry.initialize();
 * 
 * // List available tools
 * const tools = registry.listTools();
 * 
 * // Invoke a tool
 * const result = await registry.invokeTool({
 *   tool: 'azure_query',
 *   params: { query: 'Resources | count' }
 * });
 * ```
 */
export class AdapterRegistry extends EventEmitter {
  private static instance: AdapterRegistry;
  private adapters: Map<string, AdapterRegistration> = new Map();
  private toolIndex: Map<string, string> = new Map(); // tool -> adapterId
  private initialized: boolean = false;
  
  private constructor() {
    super();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }
  
  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    if (AdapterRegistry.instance) {
      AdapterRegistry.instance.adapters.clear();
      AdapterRegistry.instance.toolIndex.clear();
      AdapterRegistry.instance.initialized = false;
    }
    AdapterRegistry.instance = undefined as unknown as AdapterRegistry;
  }
  
  /**
   * Initialize registry and register built-in adapters
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load config to check which adapters are enabled
      const loader = ConfigLoader.getInstance();
      const config = await loader.getConfig();
      const mcpConfig = (config.mcp?.servers || {}) as Record<string, Record<string, { enabled?: boolean }>>;
      
      // Register built-in adapters
      await this.registerBuiltInAdapters(mcpConfig);
    } catch {
      // Config might not be available, register with defaults
      await this.registerBuiltInAdapters({});
    }
    
    this.initialized = true;
  }
  
  /**
   * Register built-in adapters based on config
   * 
   * Adapter enabled state is determined ONLY by config.json:
   * - mcp.servers.<category>.<adapter>.enabled = true/false
   * - If not specified in config, defaults to true
   */
  private async registerBuiltInAdapters(
    mcpConfig: Record<string, Record<string, { enabled?: boolean }>>
  ): Promise<void> {
    // Define built-in adapter metadata
    // NOTE: enabled state comes from config.json, NOT from code
    const builtInAdapters: Array<{
      metadata: AdapterMetadata;
      configPath: string[];
      importPath: string;
      className: string;
    }> = [
      // ============ Azure adapters ============
      {
        metadata: {
          id: 'azure-resource-graph',
          name: 'Azure Resource Graph',
          description: 'Query Azure resources using Resource Graph',
          category: 'azure',
          version: '1.0.0',
          tools: ['azure_query', 'azure_resources_list'],
          requiredConfig: ['AZURE_SUBSCRIPTION_ID'],
        },
        configPath: ['azure', 'resourcegraph'],
        importPath: '../servers/azure/AzureResourceGraphMCPAdapter',
        className: 'AzureResourceGraphMCPAdapter',
      },
      {
        metadata: {
          id: 'azure-pricing',
          name: 'Azure Pricing',
          description: 'Get Azure pricing information',
          category: 'azure',
          version: '1.0.0',
          tools: ['azure_pricing_get', 'azure_pricing_compare'],
        },
        configPath: ['azure', 'pricing'],
        importPath: '../servers/azure/AzurePricingMCPAdapter',
        className: 'AzurePricingMCPAdapter',
      },
      {
        metadata: {
          id: 'microsoft-docs',
          name: 'Microsoft Docs',
          description: 'Search Microsoft documentation',
          category: 'azure',
          version: '1.0.0',
          tools: ['docs_search', 'docs_get'],
        },
        configPath: ['azure', 'docs'],
        importPath: '../servers/azure/MicrosoftDocsMCPAdapter',
        className: 'MicrosoftDocsMCPAdapter',
      },
      
      // ============ Security adapters ============
      {
        metadata: {
          id: 'gitguardian',
          name: 'GitGuardian',
          description: 'Scan for secrets and credentials',
          category: 'security',
          version: '1.0.0',
          tools: ['secrets_scan', 'secrets_report'],
          requiredConfig: ['GITGUARDIAN_API_KEY'],
        },
        configPath: ['security', 'gitguardian'],
        importPath: '../servers/security/GitGuardianAdapter',
        className: 'GitGuardianAdapter',
      },
      {
        metadata: {
          id: 'boost-security',
          name: 'Boost Security',
          description: 'Security scanning and vulnerability detection',
          category: 'security',
          version: '1.0.0',
          tools: ['security_scan', 'vulnerability_check'],
        },
        configPath: ['security', 'boost'],
        importPath: '../servers/security/BoostSecurityAdapter',
        className: 'BoostSecurityAdapter',
      },
      {
        metadata: {
          id: 'safedep',
          name: 'SafeDep',
          description: 'Dependency security scanning',
          category: 'security',
          version: '1.0.0',
          tools: ['deps_scan', 'deps_audit'],
        },
        configPath: ['security', 'safedep'],
        importPath: '../servers/security/SafeDepAdapter',
        className: 'SafeDepAdapter',
      },
      
      // ============ Testing adapters ============
      {
        metadata: {
          id: 'test-runner',
          name: 'Test Runner',
          description: 'Run tests and report results',
          category: 'testing',
          version: '1.0.0',
          tools: ['tests_run', 'tests_list', 'tests_watch'],
        },
        configPath: ['testing', 'runner'],
        importPath: '../servers/testing/TestRunnerAdapter',
        className: 'TestRunnerAdapter',
      },
      {
        metadata: {
          id: 'playwright',
          name: 'Playwright',
          description: 'Browser automation and E2E testing',
          category: 'testing',
          version: '1.0.0',
          tools: ['browser_navigate', 'browser_screenshot', 'browser_click'],
        },
        configPath: ['testing', 'playwright'],
        importPath: '../servers/testing/PlaywrightAdapter',
        className: 'PlaywrightAdapter',
      },
      {
        metadata: {
          id: 'apimatic',
          name: 'APIMatic',
          description: 'API testing and SDK generation',
          category: 'testing',
          version: '1.0.0',
          tools: ['api_validate', 'api_test', 'sdk_generate'],
        },
        configPath: ['testing', 'apimatic'],
        importPath: '../servers/testing/APIMaticAdapter',
        className: 'APIMaticAdapter',
      },
      
      // ============ Documentation adapters ============
      {
        metadata: {
          id: 'doc-generator',
          name: 'Documentation Generator',
          description: 'Generate API and code documentation',
          category: 'documentation',
          version: '1.0.0',
          tools: ['docs_generate', 'docs_update'],
        },
        configPath: ['documentation', 'generator'],
        importPath: '../servers/documentation/DocumentationGeneratorAdapter',
        className: 'DocumentationGeneratorAdapter',
      },
      {
        metadata: {
          id: 'markdownify',
          name: 'Markdownify',
          description: 'Convert content to Markdown',
          category: 'documentation',
          version: '1.0.0',
          tools: ['markdown_convert', 'markdown_format'],
        },
        configPath: ['documentation', 'markdownify'],
        importPath: '../servers/documentation/MarkdownifyAdapter',
        className: 'MarkdownifyAdapter',
      },
      {
        metadata: {
          id: 'git-mcp',
          name: 'Git MCP',
          description: 'Git repository documentation',
          category: 'documentation',
          version: '1.0.0',
          tools: ['git_docs_search', 'git_readme_get'],
        },
        configPath: ['documentation', 'git'],
        importPath: '../servers/documentation/GitMCPAdapter',
        className: 'GitMCPAdapter',
      },
      
      // ============ Data adapters ============
      {
        metadata: {
          id: 'sqlite',
          name: 'SQLite',
          description: 'SQLite database operations',
          category: 'data',
          version: '1.0.0',
          tools: ['sqlite_query', 'sqlite_execute'],
        },
        configPath: ['data', 'sqlite'],
        importPath: '../servers/data/SQLiteAdapter',
        className: 'SQLiteAdapter',
      },
      {
        metadata: {
          id: 'redis',
          name: 'Redis',
          description: 'Redis cache operations',
          category: 'data',
          version: '1.0.0',
          tools: ['redis_get', 'redis_set', 'redis_del'],
          requiredConfig: ['REDIS_URL'],
        },
        configPath: ['data', 'redis'],
        importPath: '../servers/data/RedisAdapter',
        className: 'RedisAdapter',
      },
      
      // ============ Deployment adapters ============
      {
        metadata: {
          id: 'azure-deploy',
          name: 'Azure Deployment',
          description: 'Deploy to Azure services',
          category: 'deployment',
          version: '1.0.0',
          tools: ['azure_deploy', 'azure_deploy_status'],
          requiredConfig: ['AZURE_SUBSCRIPTION_ID'],
        },
        configPath: ['deployment', 'azure'],
        importPath: '../servers/deployment/AzureAdapter',
        className: 'AzureAdapter',
      },
      {
        metadata: {
          id: 'azure-devops',
          name: 'Azure DevOps',
          description: 'Azure DevOps pipelines and repos',
          category: 'deployment',
          version: '1.0.0',
          tools: ['devops_pipeline_run', 'devops_repo_list'],
          requiredConfig: ['AZURE_DEVOPS_ORG'],
        },
        configPath: ['deployment', 'devops'],
        importPath: '../servers/deployment/AzureDevOpsAdapter',
        className: 'AzureDevOpsAdapter',
      },
      {
        metadata: {
          id: 'docker',
          name: 'Docker',
          description: 'Docker container management',
          category: 'deployment',
          version: '1.0.0',
          tools: ['docker_build', 'docker_push', 'docker_run'],
        },
        configPath: ['deployment', 'docker'],
        importPath: '../servers/deployment/DockerAdapter',
        className: 'DockerAdapter',
      },
      {
        metadata: {
          id: 'github-deploy',
          name: 'GitHub',
          description: 'GitHub Actions and deployments',
          category: 'deployment',
          version: '1.0.0',
          tools: ['github_workflow_run', 'github_release'],
        },
        configPath: ['deployment', 'github'],
        importPath: '../servers/deployment/GitHubAdapter',
        className: 'GitHubAdapter',
      },
      
      // ============ Official MCP adapters ============
      {
        metadata: {
          id: 'filesystem',
          name: 'Filesystem',
          description: 'File system operations',
          category: 'official',
          version: '1.0.0',
          tools: ['fs_read', 'fs_write', 'fs_list', 'fs_delete'],
        },
        configPath: ['official', 'filesystem'],
        importPath: '../servers/official/FilesystemAdapter',
        className: 'FilesystemAdapter',
      },
      {
        metadata: {
          id: 'fetch',
          name: 'Fetch',
          description: 'HTTP fetch operations',
          category: 'official',
          version: '1.0.0',
          tools: ['http_get', 'http_post', 'http_fetch'],
        },
        configPath: ['official', 'fetch'],
        importPath: '../servers/official/FetchAdapter',
        className: 'FetchAdapter',
      },
      {
        metadata: {
          id: 'git',
          name: 'Git',
          description: 'Git repository operations',
          category: 'official',
          version: '1.0.0',
          tools: ['git_status', 'git_diff', 'git_commit', 'git_log'],
        },
        configPath: ['official', 'git'],
        importPath: '../servers/official/GitAdapter',
        className: 'GitAdapter',
      },
      {
        metadata: {
          id: 'memory',
          name: 'Memory',
          description: 'In-memory key-value storage',
          category: 'official',
          version: '1.0.0',
          tools: ['memory_get', 'memory_set', 'memory_list'],
        },
        configPath: ['official', 'memory'],
        importPath: '../servers/official/MemoryAdapter',
        className: 'MemoryAdapter',
      },
      {
        metadata: {
          id: 'sequential-thinking',
          name: 'Sequential Thinking',
          description: 'Step-by-step reasoning',
          category: 'official',
          version: '1.0.0',
          tools: ['think_step', 'think_chain'],
        },
        configPath: ['official', 'thinking'],
        importPath: '../servers/official/SequentialThinkingAdapter',
        className: 'SequentialThinkingAdapter',
      },
    ];

    for (const adapter of builtInAdapters) {
      // Check if enabled in config (default: true if not specified)
      const [category, name] = adapter.configPath;
      const adapterConfig = mcpConfig[category]?.[name];
      const isEnabled = adapterConfig?.enabled ?? true;
      
      if (isEnabled) {
        // Create lazy factory
        const factory: AdapterFactory = async () => {
          const module = await import(adapter.importPath);
          const AdapterClass = module[adapter.className] || module.default;
          return new AdapterClass();
        };
        
        this.register(adapter.metadata, factory);
      }
    }
  }
  
  /**
   * Register an adapter
   */
  register(
    metadata: AdapterMetadata,
    factory: AdapterFactory
  ): void {
    if (this.adapters.has(metadata.id)) {
      console.warn(`Adapter ${metadata.id} is already registered, skipping`);
      return;
    }
    
    const registration: AdapterRegistration = {
      metadata,
      factory,
      status: 'registered',
    };
    
    this.adapters.set(metadata.id, registration);
    
    // Index tools for quick lookup
    for (const tool of metadata.tools) {
      if (this.toolIndex.has(tool)) {
        console.warn(`Tool ${tool} is already provided by another adapter`);
      }
      this.toolIndex.set(tool, metadata.id);
    }
    
    this.emit('adapter:registered', metadata);
  }
  
  /**
   * Get adapter by ID, initializing if necessary
   */
  async getAdapter(id: string): Promise<BaseServerAdapter | null> {
    const registration = this.adapters.get(id);
    if (!registration) return null;
    
    // Return existing instance if ready
    if (registration.status === 'ready' && registration.instance) {
      registration.lastUsed = new Date();
      return registration.instance;
    }
    
    // Check for error state
    if (registration.status === 'error') {
      throw registration.error || new Error(`Adapter ${id} failed to initialize`);
    }
    
    // Initialize adapter
    try {
      registration.status = 'initializing';
      registration.instance = await registration.factory();
      registration.status = 'ready';
      registration.lastUsed = new Date();
      
      this.emit('adapter:initialized', registration.metadata);
      return registration.instance;
    } catch (error) {
      registration.status = 'error';
      registration.error = error instanceof Error ? error : new Error(String(error));
      
      this.emit('adapter:error', { id, error: registration.error });
      throw registration.error;
    }
  }
  
  /**
   * Invoke a tool by name
   */
  async invokeTool<T = unknown>(request: ToolRequest): Promise<ToolResult<T>> {
    const startTime = Date.now();
    
    // Find adapter that provides this tool
    const adapterId = this.toolIndex.get(request.tool);
    if (!adapterId) {
      return {
        success: false,
        error: `Tool ${request.tool} not found`,
        duration: Date.now() - startTime,
        adapter: 'unknown',
      };
    }
    
    try {
      const adapter = await this.getAdapter(adapterId);
      if (!adapter) {
        return {
          success: false,
          error: `Adapter ${adapterId} not available`,
          duration: Date.now() - startTime,
          adapter: adapterId,
        };
      }
      
      // Check if adapter has callTool method (using callTool instead of invokeTool)
      if (typeof (adapter as any).callTool !== 'function') {
        return {
          success: false,
          error: `Adapter ${adapterId} does not support tool invocation`,
          duration: Date.now() - startTime,
          adapter: adapterId,
        };
      }
      
      // Invoke tool on adapter using callTool
      const result = await (adapter as any).callTool(request.tool, request.params);
      
      this.emit('tool:invoked', {
        tool: request.tool,
        adapter: adapterId,
        success: true,
        duration: Date.now() - startTime,
      });
      
      return {
        success: true,
        data: result as T,
        duration: Date.now() - startTime,
        adapter: adapterId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.emit('tool:invoked', {
        tool: request.tool,
        adapter: adapterId,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      });
      
      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
        adapter: adapterId,
      };
    }
  }
  
  /**
   * Check if a tool is available
   */
  hasTool(toolName: string): boolean {
    return this.toolIndex.has(toolName);
  }
  
  /**
   * Get adapter ID for a tool
   */
  getAdapterForTool(toolName: string): string | undefined {
    return this.toolIndex.get(toolName);
  }
  
  /**
   * List all registered adapters
   */
  listAdapters(category?: AdapterCategory): AdapterMetadata[] {
    const adapters: AdapterMetadata[] = [];
    
    for (const registration of this.adapters.values()) {
      if (!category || registration.metadata.category === category) {
        adapters.push(registration.metadata);
      }
    }
    
    return adapters;
  }
  
  /**
   * List all available tools
   */
  listTools(): Array<{ tool: string; adapter: string; description: string }> {
    const tools: Array<{ tool: string; adapter: string; description: string }> = [];
    
    for (const [tool, adapterId] of this.toolIndex) {
      const registration = this.adapters.get(adapterId);
      if (registration) {
        tools.push({
          tool,
          adapter: adapterId,
          description: registration.metadata.description,
        });
      }
    }
    
    return tools;
  }
  
  /**
   * Get adapter status
   */
  getAdapterStatus(id: string): AdapterRegistration | undefined {
    return this.adapters.get(id);
  }
  
  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Dispose all adapters
   */
  async dispose(): Promise<void> {
    for (const [id, registration] of this.adapters) {
      if (registration.instance) {
        try {
          // Use shutdown instead of dispose
          if (typeof (registration.instance as any).shutdown === 'function') {
            await (registration.instance as any).shutdown();
          }
          this.emit('adapter:disposed', registration.metadata);
        } catch (error) {
          console.warn(`Error disposing adapter ${id}:`, error);
        }
      }
    }
    
    this.adapters.clear();
    this.toolIndex.clear();
    this.initialized = false;
  }
}

// Export singleton getter
export const getRegistry = (): AdapterRegistry => AdapterRegistry.getInstance();
