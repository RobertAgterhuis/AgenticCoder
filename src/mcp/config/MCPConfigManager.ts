/**
 * MCP Configuration Manager
 * 
 * Manages MCP server configurations and environment setup
 * @module mcp/config/MCPConfigManager
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MCPServerDefinition, ServerCategory, TransportType } from '../types';
import { Logger, createLogger } from '../utils/Logger';

/**
 * Transport configuration for server overrides
 */
export interface TransportConfig {
  type: TransportType;
  command?: string;
  args?: string[];
  url?: string;
}

/**
 * Authentication configuration
 */
export interface AuthenticationConfig {
  type: 'env' | 'token' | 'oauth';
  variables?: string[];
  token?: string;
}

/**
 * MCP Configuration file format
 */
export interface MCPConfigFile {
  version: string;
  servers: Record<string, MCPServerConfig>;
  defaults?: MCPDefaultConfig;
}

/**
 * Individual server configuration
 */
export interface MCPServerConfig {
  enabled: boolean;
  transport?: Partial<TransportConfig>;
  authentication?: Partial<AuthenticationConfig>;
  environment?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

/**
 * Default configuration values
 */
export interface MCPDefaultConfig {
  timeout: number;
  retries: number;
  healthCheckInterval: number;
  connectionPoolSize: number;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigError[];
  warnings: ConfigWarning[];
}

/**
 * Configuration error
 */
export interface ConfigError {
  server?: string;
  path: string;
  message: string;
}

/**
 * Configuration warning
 */
export interface ConfigWarning {
  server?: string;
  path: string;
  message: string;
  suggestion?: string;
}

/**
 * MCP Configuration Manager
 */
export class MCPConfigManager extends EventEmitter {
  private config: MCPConfigFile | null = null;
  private configPath: string | null = null;
  private serverOverrides: Map<string, Partial<MCPServerConfig>> = new Map();
  private logger: Logger;
  private watchAbortController: AbortController | null = null;

  private static readonly DEFAULT_CONFIG: MCPConfigFile = {
    version: '1.0.0',
    servers: {},
    defaults: {
      timeout: 30000,
      retries: 3,
      healthCheckInterval: 30000,
      connectionPoolSize: 5,
    },
  };

  constructor() {
    super();
    this.logger = createLogger('MCPConfigManager');
  }

  /**
   * Load configuration from file
   */
  async loadConfig(configPath: string): Promise<MCPConfigFile> {
    this.configPath = configPath;
    this.logger.info(`Loading config from: ${configPath}`);

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const parsedConfig = JSON.parse(content) as MCPConfigFile;
      
      // Validate and merge with defaults
      const validationResult = this.validateConfig(parsedConfig);
      if (!validationResult.valid) {
        throw new Error(`Invalid configuration: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      this.config = this.mergeWithDefaults(parsedConfig);
      this.emit('configLoaded', this.config);
      
      return this.config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.info('Config file not found, using defaults');
        this.config = { ...MCPConfigManager.DEFAULT_CONFIG };
        return this.config;
      }
      throw error;
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(configPath?: string): Promise<void> {
    const targetPath = configPath || this.configPath;
    if (!targetPath) {
      throw new Error('No config path specified');
    }

    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    // Apply overrides before saving
    const configToSave = this.getEffectiveConfig();

    // Ensure directory exists
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    // Write config file
    await fs.writeFile(
      targetPath,
      JSON.stringify(configToSave, null, 2),
      'utf-8'
    );

    this.logger.info(`Config saved to: ${targetPath}`);
    this.emit('configSaved', targetPath);
  }

  /**
   * Get current configuration
   */
  getConfig(): MCPConfigFile {
    if (!this.config) {
      return { ...MCPConfigManager.DEFAULT_CONFIG };
    }
    return this.config;
  }

  /**
   * Get effective configuration with overrides applied
   */
  getEffectiveConfig(): MCPConfigFile {
    const config = this.getConfig();
    const effectiveServers = { ...config.servers };

    // Apply overrides
    for (const [serverId, override] of this.serverOverrides) {
      if (effectiveServers[serverId]) {
        effectiveServers[serverId] = {
          ...effectiveServers[serverId],
          ...override,
        };
      } else {
        effectiveServers[serverId] = {
          enabled: true,
          ...override,
        };
      }
    }

    return {
      ...config,
      servers: effectiveServers,
    };
  }

  /**
   * Get server configuration
   */
  getServerConfig(serverId: string): MCPServerConfig | undefined {
    const effectiveConfig = this.getEffectiveConfig();
    return effectiveConfig.servers[serverId];
  }

  /**
   * Set server configuration
   */
  setServerConfig(serverId: string, config: Partial<MCPServerConfig>): void {
    if (!this.config) {
      this.config = { ...MCPConfigManager.DEFAULT_CONFIG };
    }

    const existing = this.config.servers[serverId] || { enabled: true };
    this.config.servers[serverId] = {
      ...existing,
      ...config,
    };

    this.emit('serverConfigChanged', serverId, this.config.servers[serverId]);
  }

  /**
   * Set temporary server override (not persisted)
   */
  setServerOverride(serverId: string, override: Partial<MCPServerConfig>): void {
    this.serverOverrides.set(serverId, override);
    this.emit('serverOverrideSet', serverId, override);
  }

  /**
   * Clear server override
   */
  clearServerOverride(serverId: string): void {
    this.serverOverrides.delete(serverId);
    this.emit('serverOverrideCleared', serverId);
  }

  /**
   * Enable a server
   */
  enableServer(serverId: string): void {
    this.setServerConfig(serverId, { enabled: true });
    this.logger.info(`Server enabled: ${serverId}`);
  }

  /**
   * Disable a server
   */
  disableServer(serverId: string): void {
    this.setServerConfig(serverId, { enabled: false });
    this.logger.info(`Server disabled: ${serverId}`);
  }

  /**
   * Check if server is enabled
   */
  isServerEnabled(serverId: string): boolean {
    const serverConfig = this.getServerConfig(serverId);
    return serverConfig?.enabled ?? true; // Default to enabled
  }

  /**
   * Get default configuration values
   */
  getDefaults(): MCPDefaultConfig {
    return this.config?.defaults || MCPConfigManager.DEFAULT_CONFIG.defaults!;
  }

  /**
   * Set default configuration values
   */
  setDefaults(defaults: Partial<MCPDefaultConfig>): void {
    if (!this.config) {
      this.config = { ...MCPConfigManager.DEFAULT_CONFIG };
    }

    this.config.defaults = {
      ...this.config.defaults!,
      ...defaults,
    };

    this.emit('defaultsChanged', this.config.defaults);
  }

  /**
   * Validate configuration
   */
  validateConfig(config: MCPConfigFile): ConfigValidationResult {
    const errors: ConfigError[] = [];
    const warnings: ConfigWarning[] = [];

    // Validate version
    if (!config.version) {
      errors.push({
        path: 'version',
        message: 'Configuration version is required',
      });
    }

    // Validate servers
    if (config.servers) {
      for (const [serverId, serverConfig] of Object.entries(config.servers)) {
        // Validate timeout
        if (serverConfig.timeout !== undefined && serverConfig.timeout < 0) {
          errors.push({
            server: serverId,
            path: `servers.${serverId}.timeout`,
            message: 'Timeout must be a positive number',
          });
        }

        // Validate retries
        if (serverConfig.retries !== undefined && serverConfig.retries < 0) {
          errors.push({
            server: serverId,
            path: `servers.${serverId}.retries`,
            message: 'Retries must be a positive number',
          });
        }

        // Warn about missing authentication
        if (serverConfig.enabled && !serverConfig.authentication && !serverConfig.environment) {
          warnings.push({
            server: serverId,
            path: `servers.${serverId}`,
            message: 'No authentication configured',
            suggestion: 'Consider adding authentication or environment variables',
          });
        }
      }
    }

    // Validate defaults
    if (config.defaults) {
      if (config.defaults.timeout < 1000) {
        warnings.push({
          path: 'defaults.timeout',
          message: 'Timeout is very low',
          suggestion: 'Consider using at least 5000ms',
        });
      }

      if (config.defaults.connectionPoolSize > 20) {
        warnings.push({
          path: 'defaults.connectionPoolSize',
          message: 'Connection pool size is high',
          suggestion: 'Consider reducing to improve resource usage',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Watch configuration file for changes
   */
  async watchConfig(): Promise<void> {
    if (!this.configPath) {
      throw new Error('No config path to watch');
    }

    this.watchAbortController = new AbortController();
    const { signal } = this.watchAbortController;

    try {
      const watcher = fs.watch(this.configPath, { signal });
      
      for await (const event of watcher) {
        if (event.eventType === 'change') {
          this.logger.info('Config file changed, reloading...');
          await this.loadConfig(this.configPath!);
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return; // Normal abort
      }
      throw error;
    }
  }

  /**
   * Stop watching configuration file
   */
  stopWatching(): void {
    if (this.watchAbortController) {
      this.watchAbortController.abort();
      this.watchAbortController = null;
    }
  }

  /**
   * Merge config with defaults
   */
  private mergeWithDefaults(config: MCPConfigFile): MCPConfigFile {
    return {
      ...config,
      defaults: {
        ...MCPConfigManager.DEFAULT_CONFIG.defaults!,
        ...config.defaults,
      },
    };
  }

  /**
   * Generate environment variables for a server
   */
  generateEnvVars(serverId: string, definition: MCPServerDefinition): Record<string, string> {
    const serverConfig = this.getServerConfig(serverId);
    const env: Record<string, string> = {};

    // Add configured environment variables
    if (serverConfig?.environment) {
      Object.assign(env, serverConfig.environment);
    }

    // Add environment variables from definition
    if (definition.env) {
      for (const [varName, defaultValue] of Object.entries(definition.env)) {
        // Use process.env value if available, otherwise use default
        if (process.env[varName]) {
          env[varName] = process.env[varName]!;
        } else if (defaultValue) {
          env[varName] = defaultValue;
        }
      }
    }

    return env;
  }

  /**
   * Create configuration file template
   */
  static createTemplate(): MCPConfigFile {
    return {
      version: '1.0.0',
      servers: {
        filesystem: {
          enabled: true,
          environment: {
            ALLOWED_PATHS: '/workspace',
          },
        },
        git: {
          enabled: true,
        },
        github: {
          enabled: true,
          environment: {
            GITHUB_TOKEN: '${env:GITHUB_TOKEN}',
          },
        },
        docker: {
          enabled: false,
          environment: {
            DOCKER_HOST: 'unix:///var/run/docker.sock',
          },
        },
      },
      defaults: {
        timeout: 30000,
        retries: 3,
        healthCheckInterval: 30000,
        connectionPoolSize: 5,
      },
    };
  }
}

/**
 * Create MCP Config Manager
 */
export function createMCPConfigManager(): MCPConfigManager {
  return new MCPConfigManager();
}
