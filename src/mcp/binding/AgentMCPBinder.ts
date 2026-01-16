/**
 * Agent MCP Binder
 * 
 * Binds MCP capabilities to agents in the AgenticCoder system
 * @module mcp/binding/AgentMCPBinder
 */

import { EventEmitter } from 'events';
import { MCPGateway } from '../integration/MCPGateway';
import { MCPServiceRegistry, AgentRequirements, ServiceBinding, ToolCapability } from '../core/MCPServiceRegistry';
import { ToolCallResponse, ServerCategory } from '../types';
import { Logger, createLogger } from '../utils/Logger';

/**
 * Agent capability profile
 */
export interface AgentCapabilityProfile {
  agentId: string;
  agentType: string;
  requiredTools: string[];
  requiredCategories: ServerCategory[];
  preferredServers: string[];
}

/**
 * Bound agent interface
 */
export interface BoundAgent {
  agentId: string;
  binding: ServiceBinding;
  callTool: (toolName: string, args: Record<string, unknown>) => Promise<ToolCallResponse>;
  getTools: () => ToolCapability[];
  hasCapability: (toolName: string) => boolean;
}

/**
 * Agent MCP Binder
 * 
 * Creates bindings between agents and MCP capabilities
 */
export class AgentMCPBinder extends EventEmitter {
  private gateway: MCPGateway;
  private serviceRegistry: MCPServiceRegistry;
  private boundAgents: Map<string, BoundAgent> = new Map();
  private profiles: Map<string, AgentCapabilityProfile> = new Map();
  private logger: Logger;

  constructor(gateway: MCPGateway) {
    super();
    this.gateway = gateway;
    this.serviceRegistry = gateway.getServiceRegistry();
    this.logger = createLogger('AgentMCPBinder');
  }

  /**
   * Register an agent capability profile
   */
  registerProfile(profile: AgentCapabilityProfile): void {
    this.profiles.set(profile.agentId, profile);
    this.logger.info(`Registered profile for agent: ${profile.agentId}`, {
      type: profile.agentType,
      tools: profile.requiredTools.length,
      categories: profile.requiredCategories.length,
    });
  }

  /**
   * Bind an agent to MCP capabilities
   */
  async bindAgent(agentId: string, profile?: AgentCapabilityProfile): Promise<BoundAgent> {
    // Use provided profile or registered profile
    const agentProfile = profile || this.profiles.get(agentId);
    
    if (!agentProfile) {
      throw new Error(`No profile found for agent: ${agentId}`);
    }

    this.logger.info(`Binding agent: ${agentId}`);

    // Create requirements from profile
    const requirements: AgentRequirements = {
      agentId: agentProfile.agentId,
      requiredTools: agentProfile.requiredTools,
      requiredCategories: agentProfile.requiredCategories,
      preferredServers: agentProfile.preferredServers,
    };

    // Create service binding
    const binding = await this.serviceRegistry.createBinding(requirements);

    // Create bound agent interface
    const boundAgent: BoundAgent = {
      agentId,
      binding,
      callTool: async (toolName: string, args: Record<string, unknown>) => {
        return this.serviceRegistry.callToolForAgent(agentId, toolName, args);
      },
      getTools: () => binding.availableTools,
      hasCapability: (toolName: string) => {
        return binding.availableTools.some(t => t.name === toolName);
      },
    };

    this.boundAgents.set(agentId, boundAgent);
    this.emit('agentBound', agentId, boundAgent);

    this.logger.info(`Agent bound: ${agentId}`, {
      servers: binding.boundServers.length,
      tools: binding.availableTools.length,
    });

    return boundAgent;
  }

  /**
   * Get bound agent
   */
  getBoundAgent(agentId: string): BoundAgent | undefined {
    return this.boundAgents.get(agentId);
  }

  /**
   * Unbind an agent
   */
  unbindAgent(agentId: string): boolean {
    const removed = this.boundAgents.delete(agentId);
    if (removed) {
      this.serviceRegistry.removeBinding(agentId);
      this.emit('agentUnbound', agentId);
      this.logger.info(`Agent unbound: ${agentId}`);
    }
    return removed;
  }

  /**
   * Check if agent is bound
   */
  isAgentBound(agentId: string): boolean {
    return this.boundAgents.has(agentId);
  }

  /**
   * Get all bound agent IDs
   */
  getBoundAgentIds(): string[] {
    return Array.from(this.boundAgents.keys());
  }

  /**
   * Call tool for an agent
   */
  async callToolForAgent(
    agentId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResponse> {
    const boundAgent = this.boundAgents.get(agentId);
    
    if (!boundAgent) {
      throw new Error(`Agent not bound: ${agentId}`);
    }

    if (!boundAgent.hasCapability(toolName)) {
      throw new Error(`Agent ${agentId} does not have capability: ${toolName}`);
    }

    return boundAgent.callTool(toolName, args);
  }

  /**
   * Get tools available to an agent
   */
  getAgentTools(agentId: string): ToolCapability[] {
    const boundAgent = this.boundAgents.get(agentId);
    return boundAgent?.getTools() || [];
  }

  /**
   * Check if agent has a capability
   */
  agentHasCapability(agentId: string, toolName: string): boolean {
    const boundAgent = this.boundAgents.get(agentId);
    return boundAgent?.hasCapability(toolName) || false;
  }

  /**
   * Refresh agent binding
   */
  async refreshBinding(agentId: string): Promise<BoundAgent> {
    const profile = this.profiles.get(agentId);
    if (!profile) {
      throw new Error(`No profile found for agent: ${agentId}`);
    }

    // Remove existing binding
    this.unbindAgent(agentId);

    // Rebind with updated capabilities
    return this.bindAgent(agentId, profile);
  }

  /**
   * Create standard profiles for common agent types
   */
  static createStandardProfile(
    agentId: string,
    agentType: 'code' | 'devops' | 'security' | 'testing' | 'documentation'
  ): AgentCapabilityProfile {
    const baseProfile: AgentCapabilityProfile = {
      agentId,
      agentType,
      requiredTools: [],
      requiredCategories: [],
      preferredServers: [],
    };

    switch (agentType) {
      case 'code':
        baseProfile.requiredCategories = ['official'];
        baseProfile.preferredServers = ['filesystem', 'git', 'memory', 'sequential-thinking'];
        break;

      case 'devops':
        baseProfile.requiredCategories = ['deployment', 'official'];
        baseProfile.preferredServers = ['github', 'docker', 'git'];
        break;

      case 'security':
        baseProfile.requiredCategories = ['security'];
        baseProfile.preferredServers = ['gitguardian', 'boostsecurity', 'safedep'];
        break;

      case 'testing':
        baseProfile.requiredCategories = ['testing', 'official'];
        baseProfile.preferredServers = ['playwright', 'filesystem'];
        break;

      case 'documentation':
        baseProfile.requiredCategories = ['documentation', 'official'];
        baseProfile.preferredServers = ['markdownify', 'fetch', 'memory'];
        break;
    }

    return baseProfile;
  }
}

/**
 * Create an Agent MCP Binder
 */
export function createAgentMCPBinder(gateway: MCPGateway): AgentMCPBinder {
  return new AgentMCPBinder(gateway);
}
