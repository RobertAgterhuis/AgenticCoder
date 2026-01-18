/**
 * MCP Mixin - Adds MCP tool capabilities to agents
 * @module agents/mixins/MCPMixin
 * 
 * Provides a composition-based approach for adding MCP tool
 * capabilities to any agent class, integrating with the central
 * AdapterRegistry.
 */

import { AdapterRegistry, ToolRequest, ToolResult } from '../../mcp/registry';

/**
 * Interface for agents that can use MCP tools
 */
export interface MCPCapable {
  /** Registry instance */
  mcpRegistry: AdapterRegistry;
  
  /** Check if a tool is available */
  hasTool(toolName: string): boolean;
  
  /** Use an MCP tool */
  useTool<T = unknown>(toolName: string, params: Record<string, unknown>): Promise<ToolResult<T>>;
  
  /** List available tools */
  listAvailableTools(): string[];
  
  /** List tools by category */
  listToolsByCategory(category: string): string[];
}

/**
 * MCP Mixin class for agent composition
 * 
 * @example
 * ```typescript
 * // In a JavaScript agent
 * import { MCPMixin } from '../../src/agents/mixins/MCPMixin.js';
 * 
 * class MyAgent {
 *   constructor() {
 *     this.mcp = new MCPMixin();
 *   }
 *   
 *   async initialize() {
 *     await this.mcp.initializeMCP();
 *     console.log('Tools:', this.mcp.listAvailableTools());
 *   }
 *   
 *   async doWork() {
 *     const result = await this.mcp.useTool('azure_query', { query: '...' });
 *     return result;
 *   }
 * }
 * ```
 */
export class MCPMixin implements MCPCapable {
  mcpRegistry: AdapterRegistry;
  private toolCache: Set<string> | null = null;
  private toolCategoryCache: Map<string, string[]> | null = null;
  private initialized: boolean = false;
  
  constructor() {
    this.mcpRegistry = AdapterRegistry.getInstance();
  }
  
  /**
   * Initialize MCP capabilities
   */
  async initializeMCP(): Promise<void> {
    if (this.initialized) return;
    
    await this.mcpRegistry.initialize();
    this.buildToolCache();
    this.initialized = true;
  }
  
  /**
   * Check if MCP is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Build local tool cache for quick lookups
   */
  private buildToolCache(): void {
    const tools = this.mcpRegistry.listTools();
    this.toolCache = new Set(tools.map(t => t.tool));
    
    // Build category cache
    this.toolCategoryCache = new Map();
    for (const adapter of this.mcpRegistry.listAdapters()) {
      const category = adapter.category;
      if (!this.toolCategoryCache.has(category)) {
        this.toolCategoryCache.set(category, []);
      }
      this.toolCategoryCache.get(category)!.push(...adapter.tools);
    }
  }
  
  /**
   * Check if a tool is available
   */
  hasTool(toolName: string): boolean {
    if (!this.toolCache) {
      if (!this.initialized) {
        // Check registry directly if not initialized
        return this.mcpRegistry.hasTool(toolName);
      }
      this.buildToolCache();
    }
    return this.toolCache?.has(toolName) ?? false;
  }
  
  /**
   * Use an MCP tool
   */
  async useTool<T = unknown>(
    toolName: string,
    params: Record<string, unknown>
  ): Promise<ToolResult<T>> {
    if (!this.initialized) {
      await this.initializeMCP();
    }
    
    const request: ToolRequest = {
      tool: toolName,
      params,
    };
    
    return this.mcpRegistry.invokeTool<T>(request);
  }
  
  /**
   * Use multiple tools in parallel
   */
  async useToolsParallel<T = unknown>(
    requests: Array<{ tool: string; params: Record<string, unknown> }>
  ): Promise<ToolResult<T>[]> {
    if (!this.initialized) {
      await this.initializeMCP();
    }
    
    return Promise.all(
      requests.map(req => this.useTool<T>(req.tool, req.params))
    );
  }
  
  /**
   * List available tools
   */
  listAvailableTools(): string[] {
    if (!this.toolCache) {
      if (!this.initialized) {
        return this.mcpRegistry.listTools().map(t => t.tool);
      }
      this.buildToolCache();
    }
    return Array.from(this.toolCache || []);
  }
  
  /**
   * List tools by category
   */
  listToolsByCategory(category: string): string[] {
    if (!this.toolCategoryCache) {
      this.buildToolCache();
    }
    return this.toolCategoryCache?.get(category) || [];
  }
  
  /**
   * Get all categories
   */
  getCategories(): string[] {
    if (!this.toolCategoryCache) {
      this.buildToolCache();
    }
    return Array.from(this.toolCategoryCache?.keys() || []);
  }
  
  /**
   * Get tool details
   */
  getToolInfo(toolName: string): { tool: string; adapter: string; description: string } | null {
    const tools = this.mcpRegistry.listTools();
    return tools.find(t => t.tool === toolName) || null;
  }
  
  /**
   * Invalidate tool cache (call if adapters change)
   */
  invalidateCache(): void {
    this.toolCache = null;
    this.toolCategoryCache = null;
  }
}

/**
 * Create a new MCPMixin instance
 */
export function createMCPMixin(): MCPMixin {
  return new MCPMixin();
}
