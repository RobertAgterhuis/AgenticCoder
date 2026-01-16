/**
 * Memory MCP Server Adapter
 * 
 * Provides knowledge graph and persistent memory via MCP
 * @module mcp/servers/official/MemoryAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * Memory adapter configuration
 */
export interface MemoryAdapterConfig extends ServerAdapterConfig {
  storagePath?: string;
}

/**
 * Entity in the knowledge graph
 */
export interface Entity {
  name: string;
  type: string;
  observations: string[];
}

/**
 * Relation between entities
 */
export interface Relation {
  from: string;
  to: string;
  type: string;
}

/**
 * Knowledge graph structure
 */
export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

/**
 * Memory MCP Server Adapter
 */
export class MemoryAdapter extends BaseServerAdapter {
  private storagePath: string | undefined;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<MemoryAdapterConfig>
  ) {
    super(clientManager, config);
    this.storagePath = config?.storagePath;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'memory';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    const args = ['-y', '@modelcontextprotocol/server-memory'];
    if (this.storagePath) {
      args.push('--storage-path', this.storagePath);
    }

    return {
      id: 'memory',
      name: 'Memory Server',
      description: 'Knowledge graph and persistent memory',
      transport: 'stdio',
      command: 'npx',
      args,
      category: 'official',
      enabled: true,
      tags: ['official', 'memory', 'knowledge'],
    };
  }

  /**
   * Create entities in the knowledge graph
   */
  async createEntities(entities: Array<{
    name: string;
    type: string;
    observations?: string[];
  }>): Promise<void> {
    const response = await this.callTool('create_entities', { entities });
    
    if (!response.success) {
      throw new Error(`Failed to create entities: ${response.error?.message}`);
    }
  }

  /**
   * Create relations between entities
   */
  async createRelations(relations: Array<{
    from: string;
    to: string;
    type: string;
  }>): Promise<void> {
    const response = await this.callTool('create_relations', { relations });
    
    if (!response.success) {
      throw new Error(`Failed to create relations: ${response.error?.message}`);
    }
  }

  /**
   * Add observations to an entity
   */
  async addObservations(
    entityName: string,
    observations: string[]
  ): Promise<void> {
    const response = await this.callTool('add_observations', {
      entity_name: entityName,
      observations,
    });
    
    if (!response.success) {
      throw new Error(`Failed to add observations: ${response.error?.message}`);
    }
  }

  /**
   * Delete entities from the knowledge graph
   */
  async deleteEntities(names: string[]): Promise<void> {
    const response = await this.callTool('delete_entities', { names });
    
    if (!response.success) {
      throw new Error(`Failed to delete entities: ${response.error?.message}`);
    }
  }

  /**
   * Delete observations from an entity
   */
  async deleteObservations(
    entityName: string,
    observations: string[]
  ): Promise<void> {
    const response = await this.callTool('delete_observations', {
      entity_name: entityName,
      observations,
    });
    
    if (!response.success) {
      throw new Error(`Failed to delete observations: ${response.error?.message}`);
    }
  }

  /**
   * Delete relations from the knowledge graph
   */
  async deleteRelations(relations: Array<{
    from: string;
    to: string;
    type: string;
  }>): Promise<void> {
    const response = await this.callTool('delete_relations', { relations });
    
    if (!response.success) {
      throw new Error(`Failed to delete relations: ${response.error?.message}`);
    }
  }

  /**
   * Read the entire knowledge graph
   */
  async readGraph(): Promise<KnowledgeGraph> {
    const response = await this.callTool('read_graph', {});
    
    if (!response.success) {
      throw new Error(`Failed to read graph: ${response.error?.message}`);
    }

    return response.result as KnowledgeGraph;
  }

  /**
   * Search for nodes in the knowledge graph
   */
  async searchNodes(query: string): Promise<Entity[]> {
    const response = await this.callTool('search_nodes', { query });
    
    if (!response.success) {
      throw new Error(`Failed to search nodes: ${response.error?.message}`);
    }

    return response.result as Entity[];
  }

  /**
   * Open specific nodes by name
   */
  async openNodes(names: string[]): Promise<Entity[]> {
    const response = await this.callTool('open_nodes', { names });
    
    if (!response.success) {
      throw new Error(`Failed to open nodes: ${response.error?.message}`);
    }

    return response.result as Entity[];
  }

  // High-level convenience methods

  /**
   * Store a fact in memory
   */
  async storeFact(
    subject: string,
    predicate: string,
    object: string
  ): Promise<void> {
    // Create entities if they don't exist
    await this.createEntities([
      { name: subject, type: 'concept' },
      { name: object, type: 'concept' },
    ]);

    // Create relation
    await this.createRelations([
      { from: subject, to: object, type: predicate },
    ]);
  }

  /**
   * Remember an observation about a topic
   */
  async remember(topic: string, observation: string): Promise<void> {
    await this.createEntities([{ name: topic, type: 'topic' }]);
    await this.addObservations(topic, [observation]);
  }

  /**
   * Recall observations about a topic
   */
  async recall(topic: string): Promise<string[]> {
    const entities = await this.openNodes([topic]);
    const entity = entities.find(e => e.name === topic);
    return entity?.observations || [];
  }
}

/**
 * Create a Memory adapter
 */
export function createMemoryAdapter(
  clientManager: MCPClientManager,
  config?: Partial<MemoryAdapterConfig>
): MemoryAdapter {
  return new MemoryAdapter(clientManager, config);
}
