/**
 * ConfigLoader - Central configuration loading and management
 * @module config/ConfigLoader
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  AgenticConfig,
  DEFAULT_CONFIG,
  CONFIG_DIR,
  CONFIG_FILE_NAME,
} from './types';

export interface ConfigLoadResult {
  config: AgenticConfig;
  source: 'file' | 'default' | 'merged';
  errors?: string[];
  warnings?: string[];
}

export class ConfigLoader {
  private static instance: ConfigLoader | null = null;
  private config: AgenticConfig | null = null;
  private configPath: string;

  private constructor(rootPath?: string) {
    const root = rootPath || process.cwd();
    this.configPath = path.join(root, CONFIG_DIR, CONFIG_FILE_NAME);
  }

  /**
   * Get singleton instance
   */
  static getInstance(rootPath?: string): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader(rootPath);
    }
    return ConfigLoader.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    ConfigLoader.instance = null;
  }

  /**
   * Load configuration from file
   */
  async load(): Promise<ConfigLoadResult> {
    const warnings: string[] = [];
    
    // Check if config file exists
    if (!fs.existsSync(this.configPath)) {
      this.config = { ...DEFAULT_CONFIG };
      return {
        config: this.config,
        source: 'default',
        warnings: ['Config file not found, using defaults'],
      };
    }

    try {
      // Read and parse config
      const content = fs.readFileSync(this.configPath, 'utf8');
      const parsed = JSON.parse(content);

      // Interpolate environment variables
      const interpolated = this.interpolateEnvVars(parsed);

      // Merge with defaults for missing values
      this.config = this.mergeWithDefaults(interpolated);
      
      return {
        config: this.config,
        source: 'file',
        warnings,
      };
    } catch (error: any) {
      this.config = { ...DEFAULT_CONFIG };
      return {
        config: this.config,
        source: 'default',
        errors: [`Failed to load config: ${error.message}`],
      };
    }
  }

  /**
   * Get current config (loads if not yet loaded)
   */
  async getConfig(): Promise<AgenticConfig> {
    if (!this.config) {
      await this.load();
    }
    return this.config!;
  }

  /**
   * Get specific config section
   */
  async getSection<K extends keyof AgenticConfig>(
    section: K
  ): Promise<AgenticConfig[K]> {
    const config = await this.getConfig();
    return config[section];
  }

  /**
   * Save configuration to file
   */
  async save(config: AgenticConfig): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.configPath,
      JSON.stringify(config, null, 2),
      'utf8'
    );
    
    this.config = config;
  }

  /**
   * Initialize default config file
   */
  async initDefault(): Promise<void> {
    if (fs.existsSync(this.configPath)) {
      throw new Error('Config file already exists');
    }
    await this.save(DEFAULT_CONFIG);
  }

  /**
   * Interpolate environment variables in config
   * Supports ${VAR_NAME} syntax
   */
  private interpolateEnvVars(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        return process.env[varName] || '';
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item) => this.interpolateEnvVars(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateEnvVars(value);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Deep merge config with defaults
   */
  private mergeWithDefaults(config: Partial<AgenticConfig>): AgenticConfig {
    return this.deepMerge(DEFAULT_CONFIG, config) as AgenticConfig;
  }

  private deepMerge(target: any, source: any): any {
    if (source === undefined) return target;
    if (typeof source !== 'object' || source === null) return source;
    if (typeof target !== 'object' || target === null) return source;
    
    const result = { ...target };
    
    for (const key of Object.keys(source)) {
      if (key in target) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Validate config file exists
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    if (!fs.existsSync(this.configPath)) {
      return { valid: false, errors: ['Config file not found'] };
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf8');
      JSON.parse(content);
      return { valid: true, errors: [] };
    } catch (error: any) {
      return { valid: false, errors: [`Invalid JSON: ${error.message}`] };
    }
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return this.configPath;
  }
}

// Export singleton getter for convenience
export const getConfig = async (): Promise<AgenticConfig> => {
  return ConfigLoader.getInstance().getConfig();
};

export const loadConfig = async (): Promise<ConfigLoadResult> => {
  return ConfigLoader.getInstance().load();
};
