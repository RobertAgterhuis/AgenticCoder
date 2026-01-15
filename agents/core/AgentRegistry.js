import { BaseAgent } from './BaseAgent.js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * AgentRegistry - Manages agent discovery, registration, and retrieval
 */
export class AgentRegistry {
  constructor() {
    this.agents = new Map(); // agentId -> agent instance
    this.definitions = new Map(); // agentId -> agent definition
    this.typeIndex = new Map(); // type -> Set of agent IDs
  }

  /**
   * Register an agent instance
   */
  register(agent) {
    if (!agent.id) {
      throw new Error('Agent must have an id');
    }

    if (this.agents.has(agent.id)) {
      throw new Error(`Agent ${agent.id} already registered`);
    }

    this.agents.set(agent.id, agent);
    this.definitions.set(agent.id, agent.definition);

    // Update type index
    if (!this.typeIndex.has(agent.type)) {
      this.typeIndex.set(agent.type, new Set());
    }
    this.typeIndex.get(agent.type).add(agent.id);

    console.log(`Registered agent: ${agent.id} (${agent.name} v${agent.version})`);
  }

  /**
   * Unregister an agent
   */
  async unregister(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Cleanup agent
    await agent.cleanup();

    // Remove from indexes
    this.agents.delete(agentId);
    this.definitions.delete(agentId);
    
    if (this.typeIndex.has(agent.type)) {
      this.typeIndex.get(agent.type).delete(agentId);
    }

    console.log(`Unregistered agent: ${agentId}`);
  }

  /**
   * Get agent by ID
   */
  get(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    return agent;
  }

  /**
   * Check if agent exists
   */
  has(agentId) {
    return this.agents.has(agentId);
  }

  /**
   * Get agent definition
   */
  getDefinition(agentId) {
    return this.definitions.get(agentId);
  }

  /**
   * Find agents by type
   */
  findByType(type) {
    const ids = this.typeIndex.get(type) || new Set();
    return Array.from(ids).map(id => this.agents.get(id));
  }

  /**
   * Get all agents
   */
  getAll() {
    return Array.from(this.agents.values());
  }

  /**
   * Get all agent IDs
   */
  getAllIds() {
    return Array.from(this.agents.keys());
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const typeStats = {};
    for (const [type, ids] of this.typeIndex) {
      typeStats[type] = ids.size;
    }

    return {
      totalAgents: this.agents.size,
      agentsByType: typeStats,
      registeredAgents: this.getAllIds()
    };
  }

  /**
   * Resolve agent dependencies
   * Returns array of agent IDs in dependency order (topological sort)
   */
  resolveDependencies(agentId) {
    const visited = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (id) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected involving agent ${id}`);
      }

      visiting.add(id);

      const definition = this.definitions.get(id);
      if (!definition) {
        throw new Error(`Agent ${id} not found in registry`);
      }

      // Visit dependencies first
      if (definition.dependencies) {
        for (const depId of definition.dependencies) {
          visit(depId);
        }
      }

      visiting.delete(id);
      visited.add(id);
      order.push(id);
    };

    visit(agentId);
    return order;
  }

  /**
   * Load agent definitions from directory
   */
  async loadDefinitions(directory) {
    // TODO: Implement directory scanning and agent loading
    // This would scan a directory for agent definition JSON files
    // and instantiate agents based on those definitions
    console.log(`Loading agent definitions from ${directory}`);
  }

  /**
   * Clear all agents
   */
  async clear() {
    const agentIds = this.getAllIds();
    for (const id of agentIds) {
      await this.unregister(id);
    }
  }
}

/**
 * Global registry singleton
 */
export const registry = new AgentRegistry();
