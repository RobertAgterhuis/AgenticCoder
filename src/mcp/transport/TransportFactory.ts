/**
 * Transport Factory
 * 
 * Factory for creating MCP transport instances
 * @module mcp/transport/TransportFactory
 */

import { BaseTransport } from './BaseTransport';
import { StdioTransport, createStdioTransport } from './StdioTransport';
import { TransportType, MCPServerDefinition } from '../types';
import { ValidationError } from '../errors/MCPError';
import { createLogger } from '../utils/Logger';

const logger = createLogger('TransportFactory');

/**
 * Transport factory configuration
 */
export interface TransportFactoryConfig {
  defaultTimeout?: number;
  enableMetrics?: boolean;
}

/**
 * Transport registry entry
 */
interface TransportRegistryEntry {
  type: TransportType;
  factory: (definition: MCPServerDefinition) => BaseTransport;
  description: string;
}

/**
 * Transport Factory
 * 
 * Creates appropriate transport instances based on server definitions
 */
export class TransportFactory {
  private static registry: Map<TransportType, TransportRegistryEntry> = new Map();
  private static initialized = false;

  /**
   * Initialize the factory with default transports
   */
  private static initialize(): void {
    if (this.initialized) return;

    // Register stdio transport
    this.register({
      type: 'stdio',
      factory: createStdioTransport,
      description: 'Standard I/O transport using stdin/stdout',
    });

    // SSE transport placeholder
    this.register({
      type: 'sse',
      factory: (def) => {
        throw new ValidationError(`SSE transport not yet implemented for server ${def.id}`);
      },
      description: 'Server-Sent Events transport (not implemented)',
    });

    // HTTP transport placeholder
    this.register({
      type: 'http',
      factory: (def) => {
        throw new ValidationError(`HTTP transport not yet implemented for server ${def.id}`);
      },
      description: 'HTTP REST transport (not implemented)',
    });

    // WebSocket transport placeholder
    this.register({
      type: 'websocket',
      factory: (def) => {
        throw new ValidationError(`WebSocket transport not yet implemented for server ${def.id}`);
      },
      description: 'WebSocket transport (not implemented)',
    });

    this.initialized = true;
    logger.debug('TransportFactory initialized with default transports');
  }

  /**
   * Register a transport implementation
   */
  static register(entry: TransportRegistryEntry): void {
    this.registry.set(entry.type, entry);
    logger.debug(`Registered transport: ${entry.type}`);
  }

  /**
   * Create a transport for the given server definition
   */
  static create(definition: MCPServerDefinition): BaseTransport {
    this.initialize();

    const entry = this.registry.get(definition.transport);
    
    if (!entry) {
      throw new ValidationError(
        `Unknown transport type: ${definition.transport}`,
        'transport',
        { 
          serverId: definition.id,
          availableTransports: Array.from(this.registry.keys()),
        }
      );
    }

    logger.debug(`Creating ${definition.transport} transport for ${definition.id}`);
    return entry.factory(definition);
  }

  /**
   * Check if a transport type is supported
   */
  static isSupported(type: TransportType): boolean {
    this.initialize();
    const entry = this.registry.get(type);
    
    // Check if it's registered and not a placeholder
    if (!entry) return false;
    
    try {
      // Try creating a dummy to see if it throws
      const dummy: MCPServerDefinition = {
        id: 'test',
        name: 'test',
        category: 'custom',
        transport: type,
        tools: [],
      };
      entry.factory(dummy);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all registered transport types
   */
  static getRegisteredTypes(): TransportType[] {
    this.initialize();
    return Array.from(this.registry.keys());
  }

  /**
   * Get transport description
   */
  static getDescription(type: TransportType): string | undefined {
    this.initialize();
    return this.registry.get(type)?.description;
  }

  /**
   * Validate server definition for transport compatibility
   */
  static validate(definition: MCPServerDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!definition.id) {
      errors.push('Server ID is required');
    }

    if (!definition.transport) {
      errors.push('Transport type is required');
    } else if (!this.registry.has(definition.transport)) {
      errors.push(`Unknown transport type: ${definition.transport}`);
    }

    // Transport-specific validation
    switch (definition.transport) {
      case 'stdio':
        if (!definition.command) {
          errors.push('Command is required for stdio transport');
        }
        break;
      
      case 'http':
      case 'sse':
      case 'websocket':
        if (!definition.url) {
          errors.push(`URL is required for ${definition.transport} transport`);
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Create a transport instance
 */
export function createTransport(definition: MCPServerDefinition): BaseTransport {
  return TransportFactory.create(definition);
}

/**
 * Validate server definition
 */
export function validateServerDefinition(definition: MCPServerDefinition): { valid: boolean; errors: string[] } {
  return TransportFactory.validate(definition);
}
