/**
 * MCP Server Registry
 * 
 * Catalog of all available MCP servers with their configurations
 * @module mcp/core/MCPServerRegistry
 */

import { EventEmitter } from 'events';
import { 
  MCPServerDefinition, 
  ServerCategory, 
  TransportType,
  MCPToolDefinition,
} from '../types';
import { ServerNotFoundError, ValidationError } from '../errors/MCPError';
import { Logger, createLogger } from '../utils/Logger';

/**
 * Server filter criteria
 */
export interface ServerFilter {
  category?: ServerCategory;
  transport?: TransportType;
  enabled?: boolean;
  tags?: string[];
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  total: number;
  enabled: number;
  disabled: number;
  byCategory: Record<ServerCategory, number>;
  byTransport: Record<TransportType, number>;
}

/**
 * Server with metadata
 */
interface ServerEntry {
  definition: MCPServerDefinition;
  registeredAt: Date;
  updatedAt: Date;
  toolCache: MCPToolDefinition[];
  toolCacheExpiry: Date | null;
}

/**
 * MCP Server Registry
 */
export class MCPServerRegistry extends EventEmitter {
  private servers: Map<string, ServerEntry> = new Map();
  private logger: Logger;
  private toolCacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super();
    this.logger = createLogger('MCPServerRegistry');
  }

  /**
   * Register a server
   */
  register(definition: MCPServerDefinition): void {
    this.validateDefinition(definition);

    const existing = this.servers.get(definition.id);
    const now = new Date();

    const entry: ServerEntry = {
      definition,
      registeredAt: existing?.registeredAt || now,
      updatedAt: now,
      toolCache: existing?.toolCache || [],
      toolCacheExpiry: existing?.toolCacheExpiry || null,
    };

    this.servers.set(definition.id, entry);

    if (existing) {
      this.logger.info(`Updated server: ${definition.id}`);
      this.emit('serverUpdated', definition.id);
    } else {
      this.logger.info(`Registered server: ${definition.id}`, {
        category: definition.category,
        transport: definition.transport,
      });
      this.emit('serverRegistered', definition.id);
    }
  }

  /**
   * Register multiple servers
   */
  registerBulk(definitions: MCPServerDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  /**
   * Unregister a server
   */
  unregister(serverId: string): boolean {
    if (!this.servers.has(serverId)) {
      return false;
    }

    this.servers.delete(serverId);
    this.logger.info(`Unregistered server: ${serverId}`);
    this.emit('serverUnregistered', serverId);
    return true;
  }

  /**
   * Get a server definition
   */
  get(serverId: string): MCPServerDefinition {
    const entry = this.servers.get(serverId);
    if (!entry) {
      throw new ServerNotFoundError(serverId);
    }
    return entry.definition;
  }

  /**
   * Get a server definition or undefined
   */
  getOrNull(serverId: string): MCPServerDefinition | undefined {
    return this.servers.get(serverId)?.definition;
  }

  /**
   * Check if server exists
   */
  has(serverId: string): boolean {
    return this.servers.has(serverId);
  }

  /**
   * Get all server IDs
   */
  getServerIds(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * Get all server definitions
   */
  getAll(): MCPServerDefinition[] {
    return Array.from(this.servers.values()).map(e => e.definition);
  }

  /**
   * Get servers by filter
   */
  filter(criteria: ServerFilter): MCPServerDefinition[] {
    return this.getAll().filter(server => {
      if (criteria.category && server.category !== criteria.category) {
        return false;
      }
      if (criteria.transport && server.transport !== criteria.transport) {
        return false;
      }
      if (criteria.enabled !== undefined && server.enabled !== criteria.enabled) {
        return false;
      }
      if (criteria.tags && criteria.tags.length > 0) {
        const serverTags = server.tags || [];
        if (!criteria.tags.some(tag => serverTags.includes(tag))) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Get servers by category
   */
  getByCategory(category: ServerCategory): MCPServerDefinition[] {
    return this.filter({ category });
  }

  /**
   * Get enabled servers
   */
  getEnabled(): MCPServerDefinition[] {
    return this.filter({ enabled: true });
  }

  /**
   * Enable a server
   */
  enable(serverId: string): void {
    const entry = this.servers.get(serverId);
    if (!entry) {
      throw new ServerNotFoundError(serverId);
    }

    entry.definition.enabled = true;
    entry.updatedAt = new Date();
    
    this.emit('serverEnabled', serverId);
  }

  /**
   * Disable a server
   */
  disable(serverId: string): void {
    const entry = this.servers.get(serverId);
    if (!entry) {
      throw new ServerNotFoundError(serverId);
    }

    entry.definition.enabled = false;
    entry.updatedAt = new Date();
    
    this.emit('serverDisabled', serverId);
  }

  /**
   * Update tool cache for a server
   */
  updateToolCache(serverId: string, tools: MCPToolDefinition[]): void {
    const entry = this.servers.get(serverId);
    if (!entry) {
      throw new ServerNotFoundError(serverId);
    }

    entry.toolCache = tools;
    entry.toolCacheExpiry = new Date(Date.now() + this.toolCacheTTL);
    entry.updatedAt = new Date();
  }

  /**
   * Get cached tools for a server
   */
  getCachedTools(serverId: string): MCPToolDefinition[] | null {
    const entry = this.servers.get(serverId);
    if (!entry) {
      return null;
    }

    // Check expiry
    if (entry.toolCacheExpiry && entry.toolCacheExpiry.getTime() < Date.now()) {
      entry.toolCache = [];
      entry.toolCacheExpiry = null;
      return null;
    }

    return entry.toolCache.length > 0 ? entry.toolCache : null;
  }

  /**
   * Clear tool cache for a server
   */
  clearToolCache(serverId: string): void {
    const entry = this.servers.get(serverId);
    if (entry) {
      entry.toolCache = [];
      entry.toolCacheExpiry = null;
    }
  }

  /**
   * Clear all tool caches
   */
  clearAllToolCaches(): void {
    for (const entry of this.servers.values()) {
      entry.toolCache = [];
      entry.toolCacheExpiry = null;
    }
  }

  /**
   * Find servers that provide a specific tool
   */
  findServersByTool(toolName: string): MCPServerDefinition[] {
    const results: MCPServerDefinition[] = [];

    for (const entry of this.servers.values()) {
      if (entry.toolCache.some(t => t.name === toolName)) {
        results.push(entry.definition);
      }
    }

    return results;
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const stats: RegistryStats = {
      total: this.servers.size,
      enabled: 0,
      disabled: 0,
      byCategory: {
        official: 0,
        security: 0,
        deployment: 0,
        data: 0,
        testing: 0,
        documentation: 0,
        utility: 0,
        custom: 0,
      },
      byTransport: {
        stdio: 0,
        sse: 0,
        http: 0,
        websocket: 0,
        native: 0,
      },
    };

    for (const entry of this.servers.values()) {
      const def = entry.definition;

      if (def.enabled) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }

      if (def.category && stats.byCategory[def.category] !== undefined) {
        stats.byCategory[def.category]++;
      }

      if (def.transport && stats.byTransport[def.transport] !== undefined) {
        stats.byTransport[def.transport]++;
      }
    }

    return stats;
  }

  /**
   * Export registry to JSON
   */
  toJSON(): MCPServerDefinition[] {
    return this.getAll();
  }

  /**
   * Import registry from JSON
   */
  fromJSON(data: MCPServerDefinition[]): void {
    for (const definition of data) {
      this.register(definition);
    }
  }

  /**
   * Clear all servers
   */
  clear(): void {
    this.servers.clear();
    this.emit('cleared');
  }

  /**
   * Validate a server definition
   */
  private validateDefinition(definition: MCPServerDefinition): void {
    if (!definition.id || typeof definition.id !== 'string') {
      throw new ValidationError('Server ID is required', 'id');
    }

    if (!definition.name || typeof definition.name !== 'string') {
      throw new ValidationError('Server name is required', 'name');
    }

    if (!definition.transport) {
      throw new ValidationError('Transport type is required', 'transport');
    }

    const validTransports: TransportType[] = ['stdio', 'sse', 'http', 'websocket'];
    if (!validTransports.includes(definition.transport)) {
      throw new ValidationError(
        `Invalid transport type: ${definition.transport}`,
        'transport'
      );
    }

    // Validate transport-specific config
    switch (definition.transport) {
      case 'stdio':
        if (!definition.command) {
          throw new ValidationError(
            'Command is required for stdio transport',
            'command'
          );
        }
        break;
      case 'sse':
      case 'http':
        if (!definition.url) {
          throw new ValidationError(
            'URL is required for HTTP/SSE transport',
            'url'
          );
        }
        break;
    }
  }
}

/**
 * Create a server registry
 */
export function createServerRegistry(): MCPServerRegistry {
  return new MCPServerRegistry();
}

/**
 * Default server definitions
 */
export const DEFAULT_SERVERS: MCPServerDefinition[] = [
  // Official MCP Servers
  {
    id: 'filesystem',
    name: 'Filesystem Server',
    description: 'Read/write access to local filesystem',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/'],
    category: 'official',
    enabled: true,
    tags: ['official', 'filesystem', 'io'],
  },
  {
    id: 'git',
    name: 'Git Server',
    description: 'Git repository operations',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    category: 'official',
    enabled: true,
    tags: ['official', 'git', 'vcs'],
  },
  {
    id: 'memory',
    name: 'Memory Server',
    description: 'Knowledge graph and persistent memory',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    category: 'official',
    enabled: true,
    tags: ['official', 'memory', 'knowledge'],
  },
  {
    id: 'fetch',
    name: 'Fetch Server',
    description: 'HTTP fetch operations',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    category: 'official',
    enabled: true,
    tags: ['official', 'http', 'fetch'],
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking Server',
    description: 'Step-by-step reasoning support',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    category: 'official',
    enabled: true,
    tags: ['official', 'reasoning', 'thinking'],
  },

  // Security Servers
  {
    id: 'gitguardian',
    name: 'GitGuardian Server',
    description: 'Secret detection and scanning',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'gitguardian-mcp-server'],
    category: 'security',
    enabled: false,
    tags: ['security', 'secrets', 'scanning'],
    env: {
      GITGUARDIAN_API_KEY: '${GITGUARDIAN_API_KEY}',
    },
  },
  {
    id: 'boostsecurity',
    name: 'BoostSecurity Server',
    description: 'SAST and security scanning',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/boostsecurity-mcp-server'],
    category: 'security',
    enabled: false,
    tags: ['security', 'sast', 'scanning'],
  },
  {
    id: 'safedep',
    name: 'SafeDep Server',
    description: 'Dependency vulnerability analysis',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/safedep-mcp-server'],
    category: 'security',
    enabled: false,
    tags: ['security', 'dependencies', 'vulnerabilities'],
  },

  // Deployment Servers
  {
    id: 'github',
    name: 'GitHub Server',
    description: 'GitHub API operations',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    category: 'deployment',
    enabled: true,
    tags: ['deployment', 'github', 'vcs'],
    env: {
      GITHUB_TOKEN: '${GITHUB_TOKEN}',
    },
  },
  {
    id: 'docker',
    name: 'Docker Server',
    description: 'Docker container operations',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/docker-mcp-server'],
    category: 'deployment',
    enabled: false,
    tags: ['deployment', 'docker', 'containers'],
  },

  // Data Servers
  {
    id: 'sqlite',
    name: 'SQLite Server',
    description: 'SQLite database operations',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', './data/mcp.db'],
    category: 'data',
    enabled: true,
    tags: ['data', 'sqlite', 'database'],
  },
  {
    id: 'redis',
    name: 'Redis Server',
    description: 'Redis cache operations',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/redis-mcp-server'],
    category: 'data',
    enabled: false,
    tags: ['data', 'redis', 'cache'],
    env: {
      REDIS_URL: '${REDIS_URL}',
    },
  },

  // Testing Servers
  {
    id: 'playwright',
    name: 'Playwright Server',
    description: 'Browser automation and E2E testing',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/playwright-mcp-server'],
    category: 'testing',
    enabled: false,
    tags: ['testing', 'e2e', 'browser'],
  },
  {
    id: 'apimatic',
    name: 'APIMatic Server',
    description: 'API validation and documentation',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/apimatic-mcp-server'],
    category: 'testing',
    enabled: false,
    tags: ['testing', 'api', 'openapi'],
  },

  // Documentation Servers
  {
    id: 'gitmcp',
    name: 'GitMCP Server',
    description: 'Repository documentation extraction',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/gitmcp-server'],
    category: 'documentation',
    enabled: false,
    tags: ['documentation', 'git', 'extraction'],
  },
  {
    id: 'markdownify',
    name: 'Markdownify Server',
    description: 'HTML to Markdown conversion',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/markdownify-mcp-server'],
    category: 'documentation',
    enabled: false,
    tags: ['documentation', 'markdown', 'conversion'],
  },
];
