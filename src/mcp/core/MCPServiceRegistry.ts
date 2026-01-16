/**
 * MCP Service Registry
 * 
 * Service locator for agents to discover and use MCP capabilities
 * @module mcp/core/MCPServiceRegistry
 */

import { EventEmitter } from 'events';
import { MCPClientManager } from './MCPClientManager';
import { MCPServerRegistry } from './MCPServerRegistry';
import { 
  MCPServerDefinition, 
  MCPToolDefinition,
  MCPToolInfo,
  ToolCallRequest,
  ToolCallResponse,
  ServerCategory,
  JSONSchema,
} from '../types';
import { ToolNotFoundError, ServerNotFoundError } from '../errors/MCPError';
import { Logger, createLogger } from '../utils/Logger';

/**
 * Tool capability descriptor
 */
export interface ToolCapability {
  name: string;
  description: string;
  serverId: string;
  serverName: string;
  category: ServerCategory;
  inputSchema: JSONSchema | Record<string, unknown>;
}

/**
 * Agent requirements for MCP services
 */
export interface AgentRequirements {
  agentId: string;
  requiredTools?: string[];
  requiredCategories?: ServerCategory[];
  preferredServers?: string[];
}

/**
 * Service binding for an agent
 */
export interface ServiceBinding {
  agentId: string;
  boundServers: string[];
  availableTools: ToolCapability[];
  createdAt: Date;
}

/**
 * MCP Service Registry
 * 
 * Provides service discovery and capability mapping for agents
 */
export class MCPServiceRegistry extends EventEmitter {
  private clientManager: MCPClientManager;
  private serverRegistry: MCPServerRegistry;
  private bindings: Map<string, ServiceBinding> = new Map();
  private toolIndex: Map<string, ToolCapability[]> = new Map();
  private logger: Logger;
  private initialized: boolean = false;

  constructor(
    clientManager: MCPClientManager,
    serverRegistry: MCPServerRegistry
  ) {
    super();
    this.clientManager = clientManager;
    this.serverRegistry = serverRegistry;
    this.logger = createLogger('MCPServiceRegistry');
  }

  /**
   * Initialize the service registry
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Service registry already initialized');
      return;
    }

    this.logger.info('Initializing MCP Service Registry');

    // Build initial tool index
    await this.refreshToolIndex();

    // Listen for server changes
    this.serverRegistry.on('serverRegistered', (serverId) => {
      this.onServerRegistered(serverId);
    });

    this.serverRegistry.on('serverUnregistered', (serverId) => {
      this.onServerUnregistered(serverId);
    });

    this.initialized = true;
    this.emit('initialized');
    this.logger.info('MCP Service Registry initialized');
  }

  /**
   * Refresh the tool index from all servers
   */
  async refreshToolIndex(): Promise<void> {
    this.logger.info('Refreshing tool index');
    this.toolIndex.clear();

    const allTools = await this.clientManager.getAllTools();

    for (const [serverId, tools] of allTools.entries()) {
      const serverDef = this.serverRegistry.getOrNull(serverId);
      if (!serverDef) continue;

      for (const tool of tools) {
        const capability: ToolCapability = {
          name: tool.name,
          description: tool.description || '',
          serverId,
          serverName: serverDef.name,
          category: serverDef.category || 'utility',
          inputSchema: tool.inputSchema,
        };

        const existing = this.toolIndex.get(tool.name) || [];
        existing.push(capability);
        this.toolIndex.set(tool.name, existing);
      }
    }

    this.logger.info(`Tool index refreshed`, {
      totalTools: this.toolIndex.size,
    });

    this.emit('toolIndexRefreshed');
  }

  /**
   * Find tools by name pattern
   */
  findTools(pattern: string | RegExp): ToolCapability[] {
    const results: ToolCapability[] = [];
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern, 'i') 
      : pattern;

    for (const [name, capabilities] of this.toolIndex.entries()) {
      if (regex.test(name)) {
        results.push(...capabilities);
      }
    }

    return results;
  }

  /**
   * Find tools by category
   */
  findToolsByCategory(category: ServerCategory): ToolCapability[] {
    const results: ToolCapability[] = [];

    for (const capabilities of this.toolIndex.values()) {
      for (const cap of capabilities) {
        if (cap.category === category) {
          results.push(cap);
        }
      }
    }

    return results;
  }

  /**
   * Get all available tools
   */
  getAllTools(): ToolCapability[] {
    const results: ToolCapability[] = [];
    for (const capabilities of this.toolIndex.values()) {
      results.push(...capabilities);
    }
    return results;
  }

  /**
   * Get tool capability by name
   */
  getTool(toolName: string): ToolCapability | undefined {
    const capabilities = this.toolIndex.get(toolName);
    return capabilities?.[0];
  }

  /**
   * Check if a tool is available
   */
  hasTool(toolName: string): boolean {
    return this.toolIndex.has(toolName);
  }

  /**
   * Create a service binding for an agent
   */
  async createBinding(requirements: AgentRequirements): Promise<ServiceBinding> {
    this.logger.info(`Creating binding for agent: ${requirements.agentId}`);

    const boundServers = new Set<string>();
    const availableTools: ToolCapability[] = [];

    // Bind by required tools
    if (requirements.requiredTools) {
      for (const toolName of requirements.requiredTools) {
        const capabilities = this.toolIndex.get(toolName);
        if (capabilities && capabilities.length > 0) {
          const cap = capabilities[0];
          boundServers.add(cap.serverId);
          availableTools.push(cap);
        }
      }
    }

    // Bind by required categories
    if (requirements.requiredCategories) {
      for (const category of requirements.requiredCategories) {
        const servers = this.serverRegistry.getByCategory(category);
        for (const server of servers) {
          if (server.enabled) {
            boundServers.add(server.id);
            
            // Add all tools from this server
            const tools = await this.clientManager.getTools(server.id);
            for (const tool of tools) {
              availableTools.push({
                name: tool.name,
                description: tool.description || '',
                serverId: server.id,
                serverName: server.name,
                category,
                inputSchema: tool.inputSchema,
              });
            }
          }
        }
      }
    }

    // Bind preferred servers
    if (requirements.preferredServers) {
      for (const serverId of requirements.preferredServers) {
        if (this.serverRegistry.has(serverId)) {
          const server = this.serverRegistry.get(serverId);
          if (server.enabled) {
            boundServers.add(serverId);

            const tools = await this.clientManager.getTools(serverId);
            for (const tool of tools) {
              if (!availableTools.some(t => t.name === tool.name && t.serverId === serverId)) {
                availableTools.push({
                  name: tool.name,
                  description: tool.description || '',
                  serverId,
                  serverName: server.name,
                  category: server.category || 'utility',
                  inputSchema: tool.inputSchema,
                });
              }
            }
          }
        }
      }
    }

    const binding: ServiceBinding = {
      agentId: requirements.agentId,
      boundServers: Array.from(boundServers),
      availableTools,
      createdAt: new Date(),
    };

    this.bindings.set(requirements.agentId, binding);

    this.logger.info(`Created binding for agent: ${requirements.agentId}`, {
      serverCount: binding.boundServers.length,
      toolCount: binding.availableTools.length,
    });

    this.emit('bindingCreated', binding);
    return binding;
  }

  /**
   * Get binding for an agent
   */
  getBinding(agentId: string): ServiceBinding | undefined {
    return this.bindings.get(agentId);
  }

  /**
   * Remove binding for an agent
   */
  removeBinding(agentId: string): boolean {
    const removed = this.bindings.delete(agentId);
    if (removed) {
      this.emit('bindingRemoved', agentId);
    }
    return removed;
  }

  /**
   * Call a tool for an agent
   */
  async callToolForAgent(
    agentId: string,
    toolName: string,
    args: Record<string, unknown>,
    timeout?: number
  ): Promise<ToolCallResponse> {
    const binding = this.bindings.get(agentId);
    
    if (binding) {
      // Use bound tool if available
      const boundTool = binding.availableTools.find(t => t.name === toolName);
      if (boundTool) {
        return this.clientManager.callTool({
          serverId: boundTool.serverId,
          toolName,
          arguments: args,
          timeout,
        });
      }
    }

    // Fall back to finding any available tool
    return this.clientManager.callToolByName(toolName, args, timeout);
  }

  /**
   * Get tools available to an agent
   */
  getToolsForAgent(agentId: string): ToolCapability[] {
    const binding = this.bindings.get(agentId);
    return binding?.availableTools || [];
  }

  /**
   * Get all bindings
   */
  getAllBindings(): ServiceBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * Handle server registration
   */
  private async onServerRegistered(serverId: string): Promise<void> {
    this.logger.debug(`Server registered: ${serverId}, refreshing index`);
    
    try {
      // Get tools for the new server
      const tools = await this.clientManager.getTools(serverId);
      const serverDef = this.serverRegistry.get(serverId);

      for (const tool of tools) {
        const capability: ToolCapability = {
          name: tool.name,
          description: tool.description || '',
          serverId,
          serverName: serverDef.name,
          category: serverDef.category || 'utility',
          inputSchema: tool.inputSchema,
        };

        const existing = this.toolIndex.get(tool.name) || [];
        existing.push(capability);
        this.toolIndex.set(tool.name, existing);
      }

      this.emit('serverAdded', serverId);
    } catch (error) {
      this.logger.warn(`Failed to get tools for new server: ${serverId}`, {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Handle server unregistration
   */
  private onServerUnregistered(serverId: string): void {
    this.logger.debug(`Server unregistered: ${serverId}, updating index`);

    // Remove tools from index
    for (const [name, capabilities] of this.toolIndex.entries()) {
      const filtered = capabilities.filter(c => c.serverId !== serverId);
      if (filtered.length === 0) {
        this.toolIndex.delete(name);
      } else {
        this.toolIndex.set(name, filtered);
      }
    }

    // Update bindings
    for (const binding of this.bindings.values()) {
      binding.boundServers = binding.boundServers.filter(id => id !== serverId);
      binding.availableTools = binding.availableTools.filter(t => t.serverId !== serverId);
    }

    this.emit('serverRemoved', serverId);
  }

  /**
   * Shutdown the service registry
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down MCP Service Registry');
    
    this.bindings.clear();
    this.toolIndex.clear();
    this.initialized = false;

    this.emit('shutdown');
  }
}

/**
 * Create a service registry
 */
export function createServiceRegistry(
  clientManager: MCPClientManager,
  serverRegistry: MCPServerRegistry
): MCPServiceRegistry {
  return new MCPServiceRegistry(clientManager, serverRegistry);
}
