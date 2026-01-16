/**
 * Base MCP Server Adapter
 * 
 * Abstract base class for all MCP server adapters
 * @module mcp/servers/BaseServerAdapter
 */

import { EventEmitter } from 'events';
import { MCPClientManager } from '../core/MCPClientManager';
import { 
  MCPServerDefinition, 
  MCPToolDefinition,
  MCPToolInfo,
  ToolCallResponse,
} from '../types';
import { Logger, createLogger } from '../utils/Logger';
import { ServerNotFoundError, ToolNotFoundError } from '../errors/MCPError';

/**
 * Server adapter configuration
 */
export interface ServerAdapterConfig {
  autoRegister?: boolean;
  timeout?: number;
  customEnv?: Record<string, string>;
}

/**
 * Default adapter configuration
 */
const DEFAULT_ADAPTER_CONFIG: ServerAdapterConfig = {
  autoRegister: true,
  timeout: 30000,
};

/**
 * Base Server Adapter
 * 
 * Provides common functionality for all MCP server adapters
 */
export abstract class BaseServerAdapter extends EventEmitter {
  protected clientManager: MCPClientManager;
  protected config: ServerAdapterConfig;
  protected logger: Logger;
  protected registered: boolean = false;
  protected tools: MCPToolInfo[] = [];

  /**
   * Get the server definition
   */
  abstract getDefinition(): MCPServerDefinition;

  /**
   * Get the server ID
   */
  abstract getServerId(): string;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<ServerAdapterConfig>
  ) {
    super();
    this.clientManager = clientManager;
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
    this.logger = createLogger(this.constructor.name);
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (this.registered) {
      this.logger.warn('Adapter already initialized');
      return;
    }

    this.logger.info(`Initializing adapter: ${this.getServerId()}`);

    const definition = this.getDefinition();

    // Merge custom environment
    if (this.config.customEnv) {
      definition.env = { ...definition.env, ...this.config.customEnv };
    }

    // Register with client manager
    if (this.config.autoRegister) {
      await this.clientManager.registerServer(definition);
    }

    // Load tools
    await this.loadTools();

    this.registered = true;
    this.emit('initialized');
  }

  /**
   * Load available tools from the server
   */
  async loadTools(): Promise<MCPToolInfo[]> {
    try {
      this.tools = await this.clientManager.getTools(this.getServerId());
      this.logger.info(`Loaded ${this.tools.length} tools`);
      return this.tools;
    } catch (error) {
      this.logger.error(`Failed to load tools: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Get available tools
   */
  getTools(): MCPToolInfo[] {
    return this.tools;
  }

  /**
   * Check if a tool is available
   */
  hasTool(toolName: string): boolean {
    return this.tools.some(t => t.name === toolName);
  }

  /**
   * Call a tool
   */
  protected async callTool<T = unknown>(
    toolName: string,
    args: Record<string, unknown>,
    timeout?: number
  ): Promise<ToolCallResponse<T>> {
    if (!this.hasTool(toolName)) {
      throw new ToolNotFoundError(this.getServerId(), toolName, this.tools.map(t => t.name));
    }

    return this.clientManager.callTool({
      serverId: this.getServerId(),
      toolName,
      arguments: args,
      timeout: timeout || this.config.timeout,
    }) as Promise<ToolCallResponse<T>>;
  }

  /**
   * Check if adapter is registered
   */
  isRegistered(): boolean {
    return this.registered;
  }

  /**
   * Get server status
   */
  getStatus(): string {
    return this.clientManager.getServerStatus(this.getServerId());
  }

  /**
   * Shutdown the adapter
   */
  async shutdown(): Promise<void> {
    if (!this.registered) {
      return;
    }

    this.logger.info(`Shutting down adapter: ${this.getServerId()}`);
    await this.clientManager.unregisterServer(this.getServerId());
    this.registered = false;
    this.emit('shutdown');
  }
}
