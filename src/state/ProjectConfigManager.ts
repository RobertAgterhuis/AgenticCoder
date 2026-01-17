/**
 * ProjectConfigManager - Project configuration management
 * 
 * Manages .agenticcoder/config.json for project-level settings.
 * Handles initialization, validation, and updates.
 */

import * as path from 'path';
import {
  IStateStore,
  ProjectConfig,
  TechStack,
  ProjectSettings,
  DEFAULT_SETTINGS,
  SCHEMA_VERSION,
} from './types';

export interface InitProjectOptions {
  projectName: string;
  description?: string;
  scenario: string;
  techStack?: Partial<TechStack>;
  settings?: Partial<ProjectSettings>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ProjectConfigManager {
  private store: IStateStore;

  constructor(store: IStateStore) {
    this.store = store;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize a new project configuration
   */
  async initProject(options: InitProjectOptions): Promise<ProjectConfig> {
    // Check if project already exists
    const existing = await this.store.getProjectConfig();
    if (existing) {
      throw new Error(
        `Project already initialized: ${existing.projectName}. ` +
        'Use updateConfig() to modify existing configuration.'
      );
    }

    const now = new Date().toISOString();
    
    const config: ProjectConfig = {
      schemaVersion: SCHEMA_VERSION,
      projectName: options.projectName,
      description: options.description,
      scenario: options.scenario,
      techStack: this.normalizeTechStack(options.techStack),
      settings: {
        ...DEFAULT_SETTINGS,
        ...options.settings,
      },
      createdAt: now,
      updatedAt: now,
    };

    // Validate before saving
    const validation = await this.validate(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    await this.store.saveProjectConfig(config);
    return config;
  }

  /**
   * Get current project configuration
   */
  async getConfig(): Promise<ProjectConfig | null> {
    return this.store.getProjectConfig();
  }

  /**
   * Check if project is initialized
   */
  async isInitialized(): Promise<boolean> {
    const config = await this.store.getProjectConfig();
    return config !== null;
  }

  // ==========================================================================
  // Updates
  // ==========================================================================

  /**
   * Update project configuration
   */
  async updateConfig(
    updates: Partial<Omit<ProjectConfig, 'schemaVersion' | 'createdAt' | 'updatedAt'>>
  ): Promise<ProjectConfig> {
    const existing = await this.store.getProjectConfig();
    if (!existing) {
      throw new Error('Project not initialized. Use initProject() first.');
    }

    const updated: ProjectConfig = {
      ...existing,
      ...updates,
      techStack: updates.techStack
        ? { ...existing.techStack, ...updates.techStack }
        : existing.techStack,
      settings: updates.settings
        ? { ...existing.settings, ...updates.settings }
        : existing.settings,
      updatedAt: new Date().toISOString(),
    };

    // Validate before saving
    const validation = await this.validate(updated);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    await this.store.saveProjectConfig(updated);
    return updated;
  }

  /**
   * Update tech stack
   */
  async updateTechStack(techStack: Partial<TechStack>): Promise<ProjectConfig> {
    return this.updateConfig({ techStack });
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<ProjectSettings>): Promise<ProjectConfig> {
    return this.updateConfig({ settings });
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate project configuration
   */
  async validate(config?: ProjectConfig): Promise<ValidationResult> {
    // If no config provided, use current config
    const configToValidate = config || await this.store.getProjectConfig();
    if (!configToValidate) {
      return {
        valid: false,
        errors: ['No project configuration found'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!configToValidate.projectName || configToValidate.projectName.trim() === '') {
      errors.push('projectName is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(configToValidate.projectName)) {
      errors.push('projectName must contain only alphanumeric characters, underscores, and hyphens');
    }

    if (!configToValidate.scenario || configToValidate.scenario.trim() === '') {
      errors.push('scenario is required');
    } else if (!/^[SA]\d{2}$/.test(configToValidate.scenario)) {
      warnings.push(`scenario "${configToValidate.scenario}" does not match expected pattern (e.g., S01, A03)`);
    }

    // Tech stack validation
    if (configToValidate.techStack) {
      const ts = configToValidate.techStack;
      
      // Frontend validation
      if (ts.frontend) {
        const validFrontendFrameworks = ['react', 'vue', 'angular', 'svelte', 'none'];
        if (!validFrontendFrameworks.includes(ts.frontend.framework)) {
          errors.push(`Invalid frontend framework: ${ts.frontend.framework}`);
        }
      }

      // Backend validation
      if (ts.backend) {
        const validBackendFrameworks = ['express', 'fastify', 'nestjs', 'dotnet', 'python', 'go'];
        if (!validBackendFrameworks.includes(ts.backend.framework)) {
          errors.push(`Invalid backend framework: ${ts.backend.framework}`);
        }
      }

      // Database validation
      if (ts.database) {
        const validDatabases = ['postgresql', 'mysql', 'mongodb', 'sqlite', 'none'];
        if (!validDatabases.includes(ts.database.type)) {
          errors.push(`Invalid database type: ${ts.database.type}`);
        }
      }

      // Cloud validation
      if (ts.cloud) {
        const validProviders = ['azure', 'aws', 'gcp', 'none'];
        if (!validProviders.includes(ts.cloud.provider)) {
          errors.push(`Invalid cloud provider: ${ts.cloud.provider}`);
        }
      }
    }

    // Settings validation
    if (configToValidate.settings) {
      if (configToValidate.settings.maxTokens !== undefined) {
        if (configToValidate.settings.maxTokens < 100 || configToValidate.settings.maxTokens > 128000) {
          warnings.push('maxTokens should be between 100 and 128000');
        }
      }

      if (configToValidate.settings.temperature !== undefined) {
        if (configToValidate.settings.temperature < 0 || configToValidate.settings.temperature > 2) {
          errors.push('temperature must be between 0 and 2');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Normalize tech stack with defaults
   */
  private normalizeTechStack(techStack?: Partial<TechStack>): TechStack {
    return {
      frontend: techStack?.frontend ?? {
        framework: 'react',
        language: 'typescript',
        styling: 'tailwind',
      },
      backend: techStack?.backend ?? {
        framework: 'express',
        language: 'typescript',
        api: 'rest',
      },
      database: techStack?.database ?? {
        type: 'postgresql',
        orm: 'prisma',
      },
      cloud: techStack?.cloud ?? {
        provider: 'azure',
        iac: 'bicep',
      },
      cicd: techStack?.cicd ?? {
        platform: 'github-actions',
      },
    };
  }

  /**
   * Get project name from config or infer from directory
   */
  async getProjectName(): Promise<string> {
    const config = await this.store.getProjectConfig();
    if (config) {
      return config.projectName;
    }
    // Infer from current directory
    return path.basename(process.cwd());
  }

  /**
   * Reset project (delete configuration)
   * WARNING: This will delete all project state!
   */
  async resetProject(): Promise<void> {
    const config = await this.store.getProjectConfig();
    if (!config) {
      throw new Error('No project to reset');
    }

    // Create a minimal config to mark as reset
    const resetConfig: ProjectConfig = {
      ...config,
      metadata: {
        ...config.metadata,
        resetAt: new Date().toISOString(),
        previousProjectName: config.projectName,
      },
      projectName: `${config.projectName}-reset`,
      updatedAt: new Date().toISOString(),
    };

    await this.store.saveProjectConfig(resetConfig);
  }

  /**
   * Export configuration as YAML-like string for display
   */
  async exportAsReadable(): Promise<string> {
    const config = await this.store.getProjectConfig();
    if (!config) {
      return 'No project configuration found.';
    }

    const lines: string[] = [
      `# AgenticCoder Project Configuration`,
      `# Generated: ${new Date().toISOString()}`,
      ``,
      `project:`,
      `  name: ${config.projectName}`,
      `  description: ${config.description || '(none)'}`,
      `  scenario: ${config.scenario}`,
      ``,
      `techStack:`,
    ];

    if (config.techStack.frontend) {
      lines.push(
        `  frontend:`,
        `    framework: ${config.techStack.frontend.framework}`,
        `    language: ${config.techStack.frontend.language}`,
        config.techStack.frontend.styling ? `    styling: ${config.techStack.frontend.styling}` : '',
      );
    }

    if (config.techStack.backend) {
      lines.push(
        `  backend:`,
        `    framework: ${config.techStack.backend.framework}`,
        `    language: ${config.techStack.backend.language}`,
        config.techStack.backend.api ? `    api: ${config.techStack.backend.api}` : '',
      );
    }

    if (config.techStack.database) {
      lines.push(
        `  database:`,
        `    type: ${config.techStack.database.type}`,
        config.techStack.database.orm ? `    orm: ${config.techStack.database.orm}` : '',
      );
    }

    if (config.techStack.cloud) {
      lines.push(
        `  cloud:`,
        `    provider: ${config.techStack.cloud.provider}`,
        config.techStack.cloud.iac ? `    iac: ${config.techStack.cloud.iac}` : '',
      );
    }

    lines.push(
      ``,
      `settings:`,
      `  verbose: ${config.settings.verbose}`,
      `  maxTokens: ${config.settings.maxTokens}`,
      `  temperature: ${config.settings.temperature}`,
      `  requireApproval: ${config.settings.requireApproval}`,
      `  outputDir: ${config.settings.outputDir}`,
      `  dryRun: ${config.settings.dryRun}`,
    );

    return lines.filter(l => l !== '').join('\n');
  }
}
