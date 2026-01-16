# Phase 2: User Guide Documentation

**Phase ID:** F-DOC-P02  
**Feature:** DocumentationOnboarding  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 1 (Getting Started)

---

## 🎯 Phase Objectives

Deze phase implementeert de **User Guide** documentatie:
- CLI command reference
- Configuration options
- Scenario selection guide
- Customization guide
- Best practices

---

## 📦 Deliverables

### 1. Directory Structure

```
docs/
├── user-guide/
│   ├── README.md              # User guide index
│   ├── cli-commands.md        # CLI reference
│   ├── configuration.md       # Config options
│   ├── scenarios.md           # Scenario guide
│   ├── customization.md       # Customizing behavior
│   └── best-practices.md      # Tips and tricks
│
src/
├── docs/
│   ├── cli/
│   │   ├── CommandDocGenerator.ts
│   │   └── HelpTextBuilder.ts
│   └── config/
│       └── ConfigDocGenerator.ts
```

---

## 🔧 Implementation Details

### 2.1 Command Doc Generator (`src/docs/cli/CommandDocGenerator.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * CLI command definition
 */
export interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  aliases?: string[];
  arguments?: CommandArgument[];
  options?: CommandOption[];
  examples?: CommandExample[];
  subcommands?: CommandDefinition[];
  category?: string;
}

/**
 * Command argument
 */
export interface CommandArgument {
  name: string;
  description: string;
  required: boolean;
  default?: string;
  type?: string;
}

/**
 * Command option
 */
export interface CommandOption {
  name: string;
  short?: string;
  description: string;
  required?: boolean;
  default?: unknown;
  type?: 'string' | 'number' | 'boolean' | 'array';
  choices?: string[];
}

/**
 * Command example
 */
export interface CommandExample {
  description: string;
  command: string;
  output?: string;
}

/**
 * Command documentation generator
 */
export class CommandDocGenerator {
  private commands: CommandDefinition[] = [];

  /**
   * Register command
   */
  registerCommand(command: CommandDefinition): void {
    this.commands.push(command);
  }

  /**
   * Register all AgenticCoder commands
   */
  registerAllCommands(): void {
    // Main command
    this.registerCommand({
      name: 'agentic',
      description: 'AgenticCoder CLI - AI-powered code generation',
      usage: 'agentic <command> [options]',
      subcommands: [
        this.getInitCommand(),
        this.getRunCommand(),
        this.getConfigCommand(),
        this.getStatusCommand(),
        this.getListCommand(),
        this.getValidateCommand(),
        this.getExportCommand(),
      ],
    });
  }

  /**
   * Init command
   */
  private getInitCommand(): CommandDefinition {
    return {
      name: 'init',
      description: 'Initialize a new AgenticCoder project',
      usage: 'agentic init [project-name] [options]',
      category: 'Project',
      arguments: [
        {
          name: 'project-name',
          description: 'Name of the project to create',
          required: false,
          default: 'my-app',
        },
      ],
      options: [
        {
          name: 'template',
          short: 't',
          description: 'Template to use for initialization',
          type: 'string',
          choices: ['default', 'minimal', 'full', 'enterprise'],
          default: 'default',
        },
        {
          name: 'scenario',
          short: 's',
          description: 'Initial scenario to configure',
          type: 'string',
          choices: ['S01', 'S02', 'S03', 'S04', 'S05'],
        },
        {
          name: 'force',
          short: 'f',
          description: 'Overwrite existing directory',
          type: 'boolean',
          default: false,
        },
        {
          name: 'git',
          description: 'Initialize git repository',
          type: 'boolean',
          default: true,
        },
      ],
      examples: [
        {
          description: 'Create a new project with default settings',
          command: 'agentic init my-app',
        },
        {
          description: 'Create enterprise project with S04 scenario',
          command: 'agentic init my-enterprise-app -t enterprise -s S04',
        },
        {
          description: 'Initialize in current directory',
          command: 'agentic init . --force',
        },
      ],
    };
  }

  /**
   * Run command
   */
  private getRunCommand(): CommandDefinition {
    return {
      name: 'run',
      description: 'Run agents to generate code',
      usage: 'agentic run [scenario] [options]',
      category: 'Execution',
      arguments: [
        {
          name: 'scenario',
          description: 'Scenario to run (e.g., S01, S02)',
          required: false,
          default: 'from config',
        },
      ],
      options: [
        {
          name: 'phase',
          short: 'p',
          description: 'Run specific phase only',
          type: 'number',
        },
        {
          name: 'agent',
          short: 'a',
          description: 'Run specific agent only',
          type: 'string',
        },
        {
          name: 'dry-run',
          description: 'Preview without generating files',
          type: 'boolean',
          default: false,
        },
        {
          name: 'verbose',
          short: 'v',
          description: 'Show detailed output',
          type: 'boolean',
          default: false,
        },
        {
          name: 'output',
          short: 'o',
          description: 'Output directory',
          type: 'string',
          default: './output',
        },
        {
          name: 'resume',
          description: 'Resume from last checkpoint',
          type: 'boolean',
          default: false,
        },
      ],
      examples: [
        {
          description: 'Run with scenario from config',
          command: 'agentic run',
        },
        {
          description: 'Run S01 scenario',
          command: 'agentic run S01',
        },
        {
          description: 'Run only phase 2',
          command: 'agentic run S01 --phase 2',
        },
        {
          description: 'Dry run to preview',
          command: 'agentic run S01 --dry-run -v',
        },
      ],
    };
  }

  /**
   * Config command
   */
  private getConfigCommand(): CommandDefinition {
    return {
      name: 'config',
      description: 'Manage configuration',
      usage: 'agentic config <subcommand> [options]',
      category: 'Configuration',
      subcommands: [
        {
          name: 'init',
          description: 'Initialize configuration file',
          usage: 'agentic config init',
          examples: [{ description: 'Create default config', command: 'agentic config init' }],
        },
        {
          name: 'get',
          description: 'Get configuration value',
          usage: 'agentic config get <key>',
          arguments: [{ name: 'key', description: 'Config key (dot notation)', required: true }],
          examples: [{ description: 'Get scenario', command: 'agentic config get project.scenario' }],
        },
        {
          name: 'set',
          description: 'Set configuration value',
          usage: 'agentic config set <key> <value>',
          arguments: [
            { name: 'key', description: 'Config key', required: true },
            { name: 'value', description: 'Value to set', required: true },
          ],
          examples: [{ description: 'Set Azure subscription', command: 'agentic config set azure.subscriptionId abc-123' }],
        },
        {
          name: 'list',
          description: 'List all configuration',
          usage: 'agentic config list',
        },
      ],
    };
  }

  /**
   * Status command
   */
  private getStatusCommand(): CommandDefinition {
    return {
      name: 'status',
      description: 'Show project status',
      usage: 'agentic status [options]',
      category: 'Information',
      options: [
        {
          name: 'json',
          description: 'Output as JSON',
          type: 'boolean',
          default: false,
        },
      ],
      examples: [
        {
          description: 'Show current status',
          command: 'agentic status',
          output: `Project: my-app
Scenario: S01
Phase: 2/5
Progress: 40%
Last Run: 2024-01-15 10:30`,
        },
      ],
    };
  }

  /**
   * List command
   */
  private getListCommand(): CommandDefinition {
    return {
      name: 'list',
      description: 'List available resources',
      usage: 'agentic list <type>',
      category: 'Information',
      subcommands: [
        {
          name: 'scenarios',
          description: 'List available scenarios',
          usage: 'agentic list scenarios',
        },
        {
          name: 'agents',
          description: 'List available agents',
          usage: 'agentic list agents',
        },
        {
          name: 'skills',
          description: 'List available skills',
          usage: 'agentic list skills',
        },
        {
          name: 'templates',
          description: 'List available templates',
          usage: 'agentic list templates',
        },
      ],
    };
  }

  /**
   * Validate command
   */
  private getValidateCommand(): CommandDefinition {
    return {
      name: 'validate',
      description: 'Validate project configuration',
      usage: 'agentic validate [options]',
      category: 'Validation',
      options: [
        {
          name: 'strict',
          description: 'Enable strict validation',
          type: 'boolean',
          default: false,
        },
        {
          name: 'fix',
          description: 'Auto-fix issues where possible',
          type: 'boolean',
          default: false,
        },
      ],
      examples: [
        {
          description: 'Validate configuration',
          command: 'agentic validate',
        },
        {
          description: 'Strict validation with auto-fix',
          command: 'agentic validate --strict --fix',
        },
      ],
    };
  }

  /**
   * Export command
   */
  private getExportCommand(): CommandDefinition {
    return {
      name: 'export',
      description: 'Export project artifacts',
      usage: 'agentic export <format> [options]',
      category: 'Export',
      arguments: [
        {
          name: 'format',
          description: 'Export format',
          required: true,
          type: 'string',
        },
      ],
      options: [
        {
          name: 'output',
          short: 'o',
          description: 'Output file/directory',
          type: 'string',
        },
      ],
      subcommands: [
        {
          name: 'zip',
          description: 'Export as ZIP archive',
          usage: 'agentic export zip -o project.zip',
        },
        {
          name: 'diagram',
          description: 'Export architecture diagram',
          usage: 'agentic export diagram -o architecture.png',
        },
        {
          name: 'report',
          description: 'Export status report',
          usage: 'agentic export report -o report.md',
        },
      ],
    };
  }

  /**
   * Generate markdown documentation
   */
  generateMarkdown(): string {
    const lines: string[] = [];

    lines.push('# CLI Command Reference');
    lines.push('');
    lines.push('Complete reference for all AgenticCoder CLI commands.');
    lines.push('');

    // Table of contents
    lines.push('## Contents');
    lines.push('');
    for (const cmd of this.commands) {
      if (cmd.subcommands) {
        for (const sub of cmd.subcommands) {
          lines.push(`- [${sub.name}](#${sub.name})`);
        }
      }
    }
    lines.push('');

    // Commands
    for (const cmd of this.commands) {
      if (cmd.subcommands) {
        for (const sub of cmd.subcommands) {
          lines.push(...this.formatCommand(sub, 2));
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Format single command
   */
  private formatCommand(cmd: CommandDefinition, level: number): string[] {
    const lines: string[] = [];
    const heading = '#'.repeat(level);

    lines.push(`${heading} ${cmd.name}`);
    lines.push('');
    lines.push(cmd.description);
    lines.push('');

    // Usage
    lines.push('**Usage:**');
    lines.push('```bash');
    lines.push(cmd.usage);
    lines.push('```');
    lines.push('');

    // Arguments
    if (cmd.arguments && cmd.arguments.length > 0) {
      lines.push('**Arguments:**');
      lines.push('');
      lines.push('| Argument | Description | Required | Default |');
      lines.push('|----------|-------------|----------|---------|');
      for (const arg of cmd.arguments) {
        const req = arg.required ? 'Yes' : 'No';
        const def = arg.default || '-';
        lines.push(`| \`${arg.name}\` | ${arg.description} | ${req} | ${def} |`);
      }
      lines.push('');
    }

    // Options
    if (cmd.options && cmd.options.length > 0) {
      lines.push('**Options:**');
      lines.push('');
      lines.push('| Option | Short | Description | Default |');
      lines.push('|--------|-------|-------------|---------|');
      for (const opt of cmd.options) {
        const short = opt.short ? `-${opt.short}` : '-';
        const def = opt.default !== undefined ? String(opt.default) : '-';
        lines.push(`| \`--${opt.name}\` | ${short} | ${opt.description} | ${def} |`);
      }
      lines.push('');
    }

    // Examples
    if (cmd.examples && cmd.examples.length > 0) {
      lines.push('**Examples:**');
      lines.push('');
      for (const ex of cmd.examples) {
        lines.push(`*${ex.description}:*`);
        lines.push('```bash');
        lines.push(ex.command);
        lines.push('```');
        if (ex.output) {
          lines.push('Output:');
          lines.push('```');
          lines.push(ex.output);
          lines.push('```');
        }
        lines.push('');
      }
    }

    // Subcommands
    if (cmd.subcommands && cmd.subcommands.length > 0) {
      lines.push('**Subcommands:**');
      lines.push('');
      for (const sub of cmd.subcommands) {
        lines.push(`- \`${sub.name}\` - ${sub.description}`);
      }
      lines.push('');

      for (const sub of cmd.subcommands) {
        lines.push(...this.formatCommand(sub, level + 1));
      }
    }

    lines.push('---');
    lines.push('');

    return lines;
  }

  /**
   * Write to file
   */
  async writeToFile(outputPath: string): Promise<void> {
    const content = this.generateMarkdown();
    await fs.writeFile(outputPath, content, 'utf-8');
  }
}

/**
 * Create command doc generator
 */
export function createCommandDocGenerator(): CommandDocGenerator {
  const generator = new CommandDocGenerator();
  generator.registerAllCommands();
  return generator;
}
```

### 2.2 Config Doc Generator (`src/docs/config/ConfigDocGenerator.ts`)

```typescript
import * as fs from 'fs/promises';

/**
 * Configuration option
 */
export interface ConfigOption {
  key: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: unknown;
  required?: boolean;
  choices?: unknown[];
  example?: unknown;
  section: string;
  env?: string;
}

/**
 * Configuration section
 */
export interface ConfigSection {
  name: string;
  description: string;
  options: ConfigOption[];
}

/**
 * Config documentation generator
 */
export class ConfigDocGenerator {
  private sections: ConfigSection[] = [];

  /**
   * Register all configuration options
   */
  registerAllOptions(): void {
    // Project section
    this.addSection({
      name: 'project',
      description: 'Project-level configuration',
      options: [
        {
          key: 'project.name',
          description: 'Name of the project',
          type: 'string',
          required: true,
          example: 'my-awesome-app',
          section: 'project',
        },
        {
          key: 'project.description',
          description: 'Project description',
          type: 'string',
          required: false,
          example: 'A todo application built with React',
          section: 'project',
        },
        {
          key: 'project.version',
          description: 'Project version',
          type: 'string',
          default: '0.1.0',
          section: 'project',
        },
        {
          key: 'project.author',
          description: 'Project author',
          type: 'string',
          section: 'project',
        },
      ],
    });

    // Scenario section
    this.addSection({
      name: 'scenario',
      description: 'Scenario configuration',
      options: [
        {
          key: 'scenario.id',
          description: 'Scenario identifier',
          type: 'string',
          choices: ['S01', 'S02', 'S03', 'S04', 'S05', 'A01', 'A02', 'A03', 'A04', 'A05'],
          required: true,
          example: 'S01',
          section: 'scenario',
        },
        {
          key: 'scenario.phases',
          description: 'Phases to execute (empty = all)',
          type: 'array',
          default: [],
          example: [1, 2, 3],
          section: 'scenario',
        },
        {
          key: 'scenario.skipAgents',
          description: 'Agents to skip',
          type: 'array',
          default: [],
          section: 'scenario',
        },
      ],
    });

    // Preferences section
    this.addSection({
      name: 'preferences',
      description: 'Code generation preferences',
      options: [
        {
          key: 'preferences.language',
          description: 'Primary programming language',
          type: 'string',
          choices: ['typescript', 'javascript', 'python', 'csharp'],
          default: 'typescript',
          section: 'preferences',
        },
        {
          key: 'preferences.framework',
          description: 'Frontend framework',
          type: 'string',
          choices: ['react', 'vue', 'angular', 'svelte', 'none'],
          default: 'react',
          section: 'preferences',
        },
        {
          key: 'preferences.styling',
          description: 'Styling approach',
          type: 'string',
          choices: ['tailwind', 'css-modules', 'styled-components', 'scss'],
          default: 'tailwind',
          section: 'preferences',
        },
        {
          key: 'preferences.testing',
          description: 'Testing framework',
          type: 'string',
          choices: ['vitest', 'jest', 'mocha'],
          default: 'vitest',
          section: 'preferences',
        },
        {
          key: 'preferences.packageManager',
          description: 'Package manager',
          type: 'string',
          choices: ['npm', 'pnpm', 'yarn'],
          default: 'pnpm',
          section: 'preferences',
        },
      ],
    });

    // Azure section
    this.addSection({
      name: 'azure',
      description: 'Azure configuration',
      options: [
        {
          key: 'azure.subscriptionId',
          description: 'Azure subscription ID',
          type: 'string',
          env: 'AZURE_SUBSCRIPTION_ID',
          section: 'azure',
        },
        {
          key: 'azure.resourceGroup',
          description: 'Default resource group',
          type: 'string',
          section: 'azure',
        },
        {
          key: 'azure.location',
          description: 'Default Azure region',
          type: 'string',
          default: 'westeurope',
          choices: ['westeurope', 'northeurope', 'eastus', 'westus2'],
          section: 'azure',
        },
        {
          key: 'azure.naming.prefix',
          description: 'Resource naming prefix',
          type: 'string',
          section: 'azure',
        },
      ],
    });

    // GitHub section
    this.addSection({
      name: 'github',
      description: 'GitHub integration',
      options: [
        {
          key: 'github.token',
          description: 'GitHub personal access token',
          type: 'string',
          env: 'GITHUB_TOKEN',
          section: 'github',
        },
        {
          key: 'github.owner',
          description: 'GitHub repository owner',
          type: 'string',
          section: 'github',
        },
        {
          key: 'github.repo',
          description: 'GitHub repository name',
          type: 'string',
          section: 'github',
        },
        {
          key: 'github.createPR',
          description: 'Auto-create pull requests',
          type: 'boolean',
          default: false,
          section: 'github',
        },
      ],
    });

    // Output section
    this.addSection({
      name: 'output',
      description: 'Output configuration',
      options: [
        {
          key: 'output.directory',
          description: 'Output directory for generated files',
          type: 'string',
          default: './output',
          section: 'output',
        },
        {
          key: 'output.overwrite',
          description: 'Overwrite existing files',
          type: 'boolean',
          default: false,
          section: 'output',
        },
        {
          key: 'output.format',
          description: 'Code formatting',
          type: 'boolean',
          default: true,
          section: 'output',
        },
        {
          key: 'output.lint',
          description: 'Run linting on output',
          type: 'boolean',
          default: true,
          section: 'output',
        },
      ],
    });

    // Advanced section
    this.addSection({
      name: 'advanced',
      description: 'Advanced options',
      options: [
        {
          key: 'advanced.parallel',
          description: 'Enable parallel agent execution',
          type: 'boolean',
          default: true,
          section: 'advanced',
        },
        {
          key: 'advanced.maxRetries',
          description: 'Maximum retry attempts',
          type: 'number',
          default: 3,
          section: 'advanced',
        },
        {
          key: 'advanced.timeout',
          description: 'Agent timeout in seconds',
          type: 'number',
          default: 300,
          section: 'advanced',
        },
        {
          key: 'advanced.checkpoint',
          description: 'Enable checkpoint saves',
          type: 'boolean',
          default: true,
          section: 'advanced',
        },
        {
          key: 'advanced.debug',
          description: 'Enable debug logging',
          type: 'boolean',
          default: false,
          env: 'AGENTIC_DEBUG',
          section: 'advanced',
        },
      ],
    });
  }

  /**
   * Add section
   */
  private addSection(section: ConfigSection): void {
    this.sections.push(section);
  }

  /**
   * Generate markdown
   */
  generateMarkdown(): string {
    const lines: string[] = [];

    lines.push('# Configuration Guide');
    lines.push('');
    lines.push('Complete reference for AgenticCoder configuration options.');
    lines.push('');

    // Config file location
    lines.push('## Configuration File');
    lines.push('');
    lines.push('Configuration is stored in `agentic.config.json` in your project root:');
    lines.push('');
    lines.push('```json');
    lines.push(this.generateExampleConfig());
    lines.push('```');
    lines.push('');

    // Table of contents
    lines.push('## Sections');
    lines.push('');
    for (const section of this.sections) {
      lines.push(`- [${section.name}](#${section.name}) - ${section.description}`);
    }
    lines.push('');

    // Sections
    for (const section of this.sections) {
      lines.push(`## ${section.name}`);
      lines.push('');
      lines.push(section.description);
      lines.push('');

      lines.push('| Key | Type | Default | Description |');
      lines.push('|-----|------|---------|-------------|');

      for (const opt of section.options) {
        const def = opt.default !== undefined ? `\`${JSON.stringify(opt.default)}\`` : '-';
        const envNote = opt.env ? ` (env: \`${opt.env}\`)` : '';
        lines.push(`| \`${opt.key}\` | ${opt.type} | ${def} | ${opt.description}${envNote} |`);
      }
      lines.push('');

      // Detailed options
      for (const opt of section.options) {
        if (opt.choices || opt.example) {
          lines.push(`### \`${opt.key}\``);
          lines.push('');
          lines.push(opt.description);
          lines.push('');

          if (opt.choices) {
            lines.push('**Choices:**');
            for (const choice of opt.choices) {
              lines.push(`- \`${choice}\``);
            }
            lines.push('');
          }

          if (opt.example !== undefined) {
            lines.push('**Example:**');
            lines.push('```json');
            lines.push(`"${opt.key.split('.').pop()}": ${JSON.stringify(opt.example, null, 2)}`);
            lines.push('```');
            lines.push('');
          }
        }
      }
    }

    // Environment variables
    lines.push('## Environment Variables');
    lines.push('');
    lines.push('Some options can be set via environment variables:');
    lines.push('');
    lines.push('| Variable | Config Key | Description |');
    lines.push('|----------|------------|-------------|');

    for (const section of this.sections) {
      for (const opt of section.options) {
        if (opt.env) {
          lines.push(`| \`${opt.env}\` | \`${opt.key}\` | ${opt.description} |`);
        }
      }
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate example config
   */
  private generateExampleConfig(): string {
    const config: Record<string, unknown> = {};

    for (const section of this.sections) {
      const sectionConfig: Record<string, unknown> = {};
      
      for (const opt of section.options) {
        const keyParts = opt.key.split('.');
        const localKey = keyParts[keyParts.length - 1];
        
        if (opt.example !== undefined) {
          sectionConfig[localKey] = opt.example;
        } else if (opt.default !== undefined) {
          sectionConfig[localKey] = opt.default;
        }
      }

      if (Object.keys(sectionConfig).length > 0) {
        config[section.name] = sectionConfig;
      }
    }

    return JSON.stringify(config, null, 2);
  }

  /**
   * Write to file
   */
  async writeToFile(outputPath: string): Promise<void> {
    const content = this.generateMarkdown();
    await fs.writeFile(outputPath, content, 'utf-8');
  }
}

/**
 * Create config doc generator
 */
export function createConfigDocGenerator(): ConfigDocGenerator {
  const generator = new ConfigDocGenerator();
  generator.registerAllOptions();
  return generator;
}
```

### 2.3 Scenario Guide Generator (`src/docs/generator/ScenarioGuideGenerator.ts`)

```typescript
import * as fs from 'fs/promises';

/**
 * Scenario definition
 */
export interface ScenarioDefinition {
  id: string;
  name: string;
  complexity: 'Simple' | 'Basic' | 'Standard' | 'Enterprise' | 'Complex';
  description: string;
  useCase: string;
  phases: number;
  agents: string[];
  estimatedTime: string;
  features: string[];
  prerequisites: string[];
  output: string[];
}

/**
 * Scenario guide generator
 */
export class ScenarioGuideGenerator {
  private scenarios: ScenarioDefinition[] = [];

  /**
   * Register all scenarios
   */
  registerAllScenarios(): void {
    // Standard scenarios
    this.addScenario({
      id: 'S01',
      name: 'Simple MVP',
      complexity: 'Simple',
      description: 'Quick MVP for validation or demos',
      useCase: 'Single-page applications, proof of concepts, demos',
      phases: 3,
      agents: ['PlanAgent', 'DocAgent', 'CodeGenAgent'],
      estimatedTime: '5-15 minutes',
      features: [
        'Basic project structure',
        'Single page/component',
        'Minimal configuration',
        'README documentation',
      ],
      prerequisites: ['Node.js 20+'],
      output: ['src/', 'package.json', 'README.md'],
    });

    this.addScenario({
      id: 'S02',
      name: 'Basic Web App',
      complexity: 'Basic',
      description: 'Small web application with frontend',
      useCase: 'Landing pages, small web apps, personal projects',
      phases: 4,
      agents: ['PlanAgent', 'DocAgent', 'ArchitectAgent', 'CodeGenAgent'],
      estimatedTime: '15-30 minutes',
      features: [
        'React/Vue/Angular frontend',
        'Multiple pages/routes',
        'Basic styling',
        'Unit tests',
      ],
      prerequisites: ['Node.js 20+'],
      output: ['src/', 'tests/', 'package.json', 'README.md'],
    });

    this.addScenario({
      id: 'S03',
      name: 'Full-Stack Application',
      complexity: 'Standard',
      description: 'Complete full-stack web application',
      useCase: 'Professional web applications, SaaS products',
      phases: 5,
      agents: ['PlanAgent', 'DocAgent', 'ArchitectAgent', 'CodeGenAgent', 'TestAgent', 'ReviewAgent'],
      estimatedTime: '30-60 minutes',
      features: [
        'Frontend (React/Vue)',
        'Backend API',
        'Database schema',
        'Authentication',
        'Comprehensive tests',
        'CI/CD pipeline',
      ],
      prerequisites: ['Node.js 20+', 'Docker (optional)'],
      output: ['frontend/', 'backend/', 'tests/', 'docker-compose.yml', 'README.md'],
    });

    this.addScenario({
      id: 'S04',
      name: 'Enterprise Application',
      complexity: 'Enterprise',
      description: 'Large-scale enterprise application',
      useCase: 'Enterprise systems, complex business applications',
      phases: 6,
      agents: ['PlanAgent', 'DocAgent', 'ArchitectAgent', 'SecurityAgent', 'CodeGenAgent', 'TestAgent', 'ReviewAgent', 'DeployAgent'],
      estimatedTime: '1-2 hours',
      features: [
        'Microservices architecture',
        'Event-driven design',
        'Azure infrastructure',
        'Security compliance',
        'Monitoring & logging',
        'Full test coverage',
      ],
      prerequisites: ['Node.js 20+', 'Azure CLI', 'Docker'],
      output: ['services/', 'infra/', 'tests/', 'docs/', '.github/workflows/'],
    });

    this.addScenario({
      id: 'S05',
      name: 'Complex Multi-Service',
      complexity: 'Complex',
      description: 'Complex distributed system',
      useCase: 'Large platforms, multi-team projects',
      phases: 7,
      agents: ['All agents'],
      estimatedTime: '2-4 hours',
      features: [
        'Multiple microservices',
        'Message queues',
        'Caching layer',
        'API gateway',
        'Service mesh',
        'Full observability',
      ],
      prerequisites: ['Node.js 20+', 'Azure CLI', 'Docker', 'Kubernetes (optional)'],
      output: ['services/*/', 'infra/', 'api-gateway/', 'docs/', 'k8s/'],
    });

    // Azure scenarios
    this.addScenario({
      id: 'A01',
      name: 'Azure Static Web App',
      complexity: 'Simple',
      description: 'Static site with Azure hosting',
      useCase: 'Marketing sites, documentation, blogs',
      phases: 3,
      agents: ['PlanAgent', 'CodeGenAgent', 'AzureAgent'],
      estimatedTime: '10-20 minutes',
      features: [
        'Static HTML/React',
        'Azure Static Web Apps',
        'GitHub Actions deployment',
        'Custom domain ready',
      ],
      prerequisites: ['Node.js 20+', 'Azure CLI', 'GitHub account'],
      output: ['src/', 'infra/', '.github/workflows/'],
    });

    this.addScenario({
      id: 'A03',
      name: 'Azure Functions API',
      complexity: 'Standard',
      description: 'Serverless API with Azure Functions',
      useCase: 'REST APIs, webhooks, background jobs',
      phases: 4,
      agents: ['PlanAgent', 'ArchitectAgent', 'CodeGenAgent', 'AzureAgent'],
      estimatedTime: '20-40 minutes',
      features: [
        'Azure Functions',
        'API endpoints',
        'Cosmos DB integration',
        'Application Insights',
      ],
      prerequisites: ['Node.js 20+', 'Azure CLI', 'Azure Functions Core Tools'],
      output: ['src/functions/', 'infra/', 'tests/', 'local.settings.json'],
    });
  }

  /**
   * Add scenario
   */
  private addScenario(scenario: ScenarioDefinition): void {
    this.scenarios.push(scenario);
  }

  /**
   * Generate markdown
   */
  generateMarkdown(): string {
    const lines: string[] = [];

    lines.push('# Scenario Selection Guide');
    lines.push('');
    lines.push('Choose the right scenario for your project needs.');
    lines.push('');

    // Quick comparison table
    lines.push('## Quick Comparison');
    lines.push('');
    lines.push('| Scenario | Complexity | Time | Use Case |');
    lines.push('|----------|------------|------|----------|');
    for (const s of this.scenarios) {
      lines.push(`| [${s.id}](#${s.id.toLowerCase()}) | ${s.complexity} | ${s.estimatedTime} | ${s.useCase.split(',')[0]} |`);
    }
    lines.push('');

    // Decision flowchart
    lines.push('## How to Choose');
    lines.push('');
    lines.push('```');
    lines.push('Start');
    lines.push('  │');
    lines.push('  ▼');
    lines.push('Simple MVP/Demo? ──Yes──> S01');
    lines.push('  │ No');
    lines.push('  ▼');
    lines.push('Frontend only? ──Yes──> S02');
    lines.push('  │ No');
    lines.push('  ▼');
    lines.push('Need backend? ──Yes──> S03');
    lines.push('  │ No (Azure)');
    lines.push('  ▼');
    lines.push('Static site? ──Yes──> A01');
    lines.push('  │ No');
    lines.push('  ▼');
    lines.push('Serverless API? ──Yes──> A03');
    lines.push('  │ No');
    lines.push('  ▼');
    lines.push('Enterprise scale? ──Yes──> S04');
    lines.push('  │ No');
    lines.push('  ▼');
    lines.push('Multi-service? ──Yes──> S05');
    lines.push('```');
    lines.push('');

    // Detailed scenarios
    lines.push('## Scenario Details');
    lines.push('');

    for (const s of this.scenarios) {
      lines.push(`### ${s.id}`);
      lines.push('');
      lines.push(`**${s.name}** (${s.complexity})`);
      lines.push('');
      lines.push(s.description);
      lines.push('');
      
      lines.push('**Use Case:**');
      lines.push(s.useCase);
      lines.push('');

      lines.push('**Details:**');
      lines.push(`- ⏱️ Estimated time: ${s.estimatedTime}`);
      lines.push(`- 📊 Phases: ${s.phases}`);
      lines.push(`- 🤖 Agents: ${s.agents.join(', ')}`);
      lines.push('');

      lines.push('**Features:**');
      for (const f of s.features) {
        lines.push(`- ${f}`);
      }
      lines.push('');

      lines.push('**Prerequisites:**');
      for (const p of s.prerequisites) {
        lines.push(`- ${p}`);
      }
      lines.push('');

      lines.push('**Output:**');
      lines.push('```');
      for (const o of s.output) {
        lines.push(o);
      }
      lines.push('```');
      lines.push('');

      lines.push('**Run:**');
      lines.push('```bash');
      lines.push(`agentic run ${s.id}`);
      lines.push('```');
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Write to file
   */
  async writeToFile(outputPath: string): Promise<void> {
    const content = this.generateMarkdown();
    await fs.writeFile(outputPath, content, 'utf-8');
  }
}

/**
 * Create scenario guide generator
 */
export function createScenarioGuideGenerator(): ScenarioGuideGenerator {
  const generator = new ScenarioGuideGenerator();
  generator.registerAllScenarios();
  return generator;
}
```

---

## 📄 Generated Documents

### `docs/user-guide/README.md`

```markdown
# User Guide

Welcome to the AgenticCoder User Guide. This guide covers everything you need to know to use AgenticCoder effectively.

## Contents

- [CLI Commands](./cli-commands.md) - Complete CLI reference
- [Configuration](./configuration.md) - All configuration options
- [Scenarios](./scenarios.md) - Choosing the right scenario
- [Customization](./customization.md) - Customizing behavior
- [Best Practices](./best-practices.md) - Tips and tricks

## Quick Reference

### Common Commands

```bash
agentic init <name>     # Create new project
agentic run <scenario>  # Run generation
agentic status          # Check progress
agentic config list     # View configuration
```

### Scenarios at a Glance

| Scenario | For |
|----------|-----|
| S01 | Simple MVPs |
| S02 | Basic web apps |
| S03 | Full-stack apps |
| S04 | Enterprise |
| S05 | Complex systems |

## Need Help?

- [Troubleshooting](../troubleshooting/README.md)
- [FAQ](../troubleshooting/faq.md)
- [GitHub Issues](https://github.com/org/agenticcoder/issues)
```

---

## 📋 Acceptance Criteria

- [ ] CLI command reference is complete
- [ ] All commands have examples
- [ ] Configuration options documented
- [ ] Scenario guide helps users choose
- [ ] Best practices section exists
- [ ] Customization options explained
- [ ] All links work correctly

---

## 🔗 Navigation

← [01-PHASE-GETTING-STARTED.md](01-PHASE-GETTING-STARTED.md) | [03-PHASE-REFERENCE.md](03-PHASE-REFERENCE.md) →
