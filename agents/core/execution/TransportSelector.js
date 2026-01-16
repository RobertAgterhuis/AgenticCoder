/**
 * TransportSelector (EB-01)
 * Selects and validates transport configuration for agent execution.
 * 
 * Supports 4 transport types:
 * - webhook: HTTP POST to endpoint
 * - process: Spawn subprocess
 * - docker: Docker container execution
 * - api: REST API call (alias for webhook with different semantics)
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';

const TRANSPORT_TYPES = {
  WEBHOOK: 'webhook',
  PROCESS: 'process',
  DOCKER: 'docker',
  API: 'api',
  MCP_STDIO: 'mcp-stdio'
};

const DEFAULT_TRANSPORT_CONFIG = {
  [TRANSPORT_TYPES.WEBHOOK]: {
    timeout_ms: 60000,
    retries: 3,
    retry_delay_ms: 1000,
    headers: { 'Content-Type': 'application/json' }
  },
  [TRANSPORT_TYPES.PROCESS]: {
    timeout_ms: 300000,
    max_memory_mb: 512,
    shell: false
  },
  [TRANSPORT_TYPES.DOCKER]: {
    timeout_ms: 600000,
    memory_limit: '1g',
    cpu_limit: '1.0',
    network: 'none',
    remove_after: true
  },
  [TRANSPORT_TYPES.API]: {
    timeout_ms: 30000,
    retries: 2,
    headers: { 'Content-Type': 'application/json' }
  },
  [TRANSPORT_TYPES.MCP_STDIO]: {
    timeout_ms: 60000,
    framing: 'content-length'
  }
};

export class TransportSelector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.configPath = options.configPath || null;
    this.agentConfigs = new Map();
    this.globalDefaults = { ...DEFAULT_TRANSPORT_CONFIG };
    this._loaded = false;
  }

  /**
   * Load agent transport configurations from file or object
   */
  async loadConfig(configSource = null) {
    if (configSource && typeof configSource === 'object') {
      // Direct config object
      this._parseConfig(configSource);
      this._loaded = true;
      return;
    }

    const configFile = configSource || this.configPath;
    if (configFile && fs.existsSync(configFile)) {
      try {
        const content = await fs.promises.readFile(configFile, 'utf8');
        const config = JSON.parse(content);
        this._parseConfig(config);
        this._loaded = true;
      } catch (error) {
        this.emit('error', { type: 'config_load', error: error.message });
        throw new Error(`Failed to load transport config: ${error.message}`);
      }
    }
  }

  _parseConfig(config) {
    // Parse global defaults
    if (config.defaults) {
      for (const [transport, defaults] of Object.entries(config.defaults)) {
        this.globalDefaults[transport] = {
          ...this.globalDefaults[transport],
          ...defaults
        };
      }
    }

    // Parse agent-specific configurations
    if (config.agents) {
      for (const [agentName, agentConfig] of Object.entries(config.agents)) {
        this.agentConfigs.set(agentName, agentConfig);
      }
    }
  }

  /**
   * Register agent transport configuration programmatically
   */
  registerAgent(agentName, transportConfig) {
    this.agentConfigs.set(agentName, transportConfig);
    this.emit('agent-registered', { agent: agentName, config: transportConfig });
  }

  /**
   * Select transport for a given agent
   * @param {string} agentName - Name of the agent
   * @param {object} overrides - Optional config overrides
   * @returns {object} Complete transport configuration
   */
  async selectTransport(agentName, overrides = {}) {
    // Step 1: Check environment override
    const envTransport = process.env.AGENTICCODER_TOOL_TRANSPORT;
    
    // Step 2: Look up agent-specific config
    let agentConfig = this.agentConfigs.get(agentName) || {};
    
    // Step 3: Determine transport type
    let transportType = overrides.transport 
      || envTransport 
      || agentConfig.transport 
      || this._inferTransportType(agentConfig, overrides);

    transportType = transportType.toLowerCase();

    // Step 4: Build complete config
    const config = this._buildTransportConfig(transportType, agentConfig, overrides);

    // Step 5: Validate
    const validation = this._validateTransportConfig(transportType, config);
    if (!validation.valid) {
      this.emit('validation-failed', { agent: agentName, errors: validation.errors });
      throw new Error(`Invalid transport config for ${agentName}: ${validation.errors.join(', ')}`);
    }

    this.emit('transport-selected', { 
      agent: agentName, 
      transport: transportType, 
      config 
    });

    return {
      type: transportType,
      config,
      agent: agentName
    };
  }

  _inferTransportType(agentConfig, overrides) {
    const combined = { ...agentConfig, ...overrides };

    // Infer from available config fields
    if (combined.command || combined.stdioCommand) {
      return combined.framing || combined.stdioFraming 
        ? TRANSPORT_TYPES.MCP_STDIO 
        : TRANSPORT_TYPES.PROCESS;
    }
    
    if (combined.image || combined.dockerfile) {
      return TRANSPORT_TYPES.DOCKER;
    }
    
    if (combined.endpoint || combined.url) {
      return TRANSPORT_TYPES.WEBHOOK;
    }

    // Default to webhook
    return TRANSPORT_TYPES.WEBHOOK;
  }

  _buildTransportConfig(transportType, agentConfig, overrides) {
    const defaults = this.globalDefaults[transportType] || {};
    
    const config = {
      ...defaults,
      ...agentConfig,
      ...overrides
    };

    // Normalize field names for consistency
    switch (transportType) {
      case TRANSPORT_TYPES.WEBHOOK:
      case TRANSPORT_TYPES.API:
        config.endpoint = config.endpoint || config.url;
        config.method = config.method || 'POST';
        break;
        
      case TRANSPORT_TYPES.PROCESS:
        config.command = config.command || config.cmd;
        config.args = config.args || [];
        config.cwd = config.cwd || process.cwd();
        break;
        
      case TRANSPORT_TYPES.DOCKER:
        config.image = config.image || config.imageName;
        config.command = config.command || config.cmd || [];
        config.volumes = config.volumes || [];
        config.env = config.env || {};
        break;
        
      case TRANSPORT_TYPES.MCP_STDIO:
        config.command = config.command || config.stdioCommand;
        config.args = config.args || config.stdioArgs || [];
        config.framing = config.framing || config.stdioFraming || 'content-length';
        break;
    }

    // Remove transport field to avoid confusion
    delete config.transport;

    return config;
  }

  _validateTransportConfig(transportType, config) {
    const errors = [];

    switch (transportType) {
      case TRANSPORT_TYPES.WEBHOOK:
      case TRANSPORT_TYPES.API:
        if (!config.endpoint) {
          errors.push('endpoint is required for webhook/api transport');
        } else {
          try {
            new URL(config.endpoint);
          } catch {
            errors.push('endpoint must be a valid URL');
          }
        }
        break;
        
      case TRANSPORT_TYPES.PROCESS:
        if (!config.command) {
          errors.push('command is required for process transport');
        }
        break;
        
      case TRANSPORT_TYPES.DOCKER:
        if (!config.image) {
          errors.push('image is required for docker transport');
        }
        break;
        
      case TRANSPORT_TYPES.MCP_STDIO:
        if (!config.command) {
          errors.push('command is required for mcp-stdio transport');
        }
        if (config.framing && !['content-length', 'ndjson'].includes(config.framing)) {
          errors.push('framing must be "content-length" or "ndjson"');
        }
        break;
        
      default:
        errors.push(`Unknown transport type: ${transportType}`);
    }

    // Common validations
    if (config.timeout_ms !== undefined && (typeof config.timeout_ms !== 'number' || config.timeout_ms <= 0)) {
      errors.push('timeout_ms must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get list of supported transport types
   */
  getSupportedTransports() {
    return Object.values(TRANSPORT_TYPES);
  }

  /**
   * Get default configuration for a transport type
   */
  getTransportDefaults(transportType) {
    return { ...this.globalDefaults[transportType] } || {};
  }

  /**
   * Check if an agent has a registered configuration
   */
  hasAgentConfig(agentName) {
    return this.agentConfigs.has(agentName);
  }

  /**
   * Get all registered agent names
   */
  getRegisteredAgents() {
    return Array.from(this.agentConfigs.keys());
  }
}

export { TRANSPORT_TYPES };
