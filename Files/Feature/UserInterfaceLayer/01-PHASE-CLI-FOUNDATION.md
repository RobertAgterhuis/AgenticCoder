# Phase 1: CLI Foundation

**Phase ID:** F-UIL-P01  
**Feature:** UserInterfaceLayer  
**Duration:** 1 week  
**Status:** ⬜ Not Started

---

## 🎯 Phase Objectives

Deze phase legt de **foundation** voor de AgenticCoder CLI:
- Commander.js setup met TypeScript
- Basis command structuur
- Help system en versioning
- Project scaffolding voor CLI package

---

## 📦 Deliverables

### 1. CLI Package Structure

```
packages/cli/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Entry point
│   ├── cli.ts                      # Main CLI setup
│   ├── commands/
│   │   ├── index.ts                # Command exports
│   │   ├── init.ts                 # agentic init
│   │   ├── run.ts                  # agentic run
│   │   ├── status.ts               # agentic status
│   │   ├── agents.ts               # agentic agents
│   │   ├── config.ts               # agentic config
│   │   └── help.ts                 # agentic help
│   ├── utils/
│   │   ├── logger.ts               # Console output formatting
│   │   ├── config.ts               # Config file handling
│   │   ├── paths.ts                # Path resolution
│   │   └── validation.ts           # Input validation
│   └── types/
│       └── index.ts                # Type definitions
├── bin/
│   └── agentic                     # Executable entry
└── tests/
    ├── commands/
    └── utils/
```

### 2. Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "cosmiconfig": "^9.0.0",
    "zod": "^3.22.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "vitest": "^1.0.0",
    "tsup": "^8.0.0"
  }
}
```

---

## 🔧 Implementation Details

### 2.1 Main CLI Entry (`src/cli.ts`)

```typescript
import { Command } from 'commander';
import { version } from '../package.json';
import { initCommand } from './commands/init';
import { runCommand } from './commands/run';
import { statusCommand } from './commands/status';
import { agentsCommand } from './commands/agents';
import { configCommand } from './commands/config';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('agentic')
    .description('AgenticCoder - AI-powered code generation system')
    .version(version, '-v, --version', 'Output the current version')
    .option('-d, --debug', 'Enable debug mode')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('--no-color', 'Disable colored output');

  // Register commands
  program.addCommand(initCommand());
  program.addCommand(runCommand());
  program.addCommand(statusCommand());
  program.addCommand(agentsCommand());
  program.addCommand(configCommand());

  // Global error handling
  program.exitOverride((err) => {
    if (err.code === 'commander.help') {
      process.exit(0);
    }
    throw err;
  });

  return program;
}
```

### 2.2 Init Command (`src/commands/init.ts`)

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { z } from 'zod';
import { createProjectStructure } from '../utils/project';
import { loadConfig, saveConfig } from '../utils/config';

const InitOptionsSchema = z.object({
  name: z.string().min(1).max(100),
  scenario: z.enum(['S01', 'S02', 'S03', 'S04', 'S05']).optional(),
  template: z.string().optional(),
  force: z.boolean().default(false),
});

export function initCommand(): Command {
  const cmd = new Command('init');

  cmd
    .description('Initialize a new AgenticCoder project')
    .argument('[project-name]', 'Name of the project', 'my-project')
    .option('-s, --scenario <scenario>', 'Scenario to use (S01-S05)')
    .option('-t, --template <template>', 'Project template')
    .option('-f, --force', 'Overwrite existing project')
    .option('-y, --yes', 'Skip interactive prompts')
    .action(async (projectName, options) => {
      const spinner = ora('Initializing project...').start();

      try {
        const validated = InitOptionsSchema.parse({
          name: projectName,
          ...options,
        });

        // Check if directory exists
        const projectPath = await createProjectStructure(validated);

        // Create .agenticcoder/config.json
        await saveConfig(projectPath, {
          projectName: validated.name,
          scenario: validated.scenario || 'S01',
          createdAt: new Date().toISOString(),
          version: '1.0.0',
        });

        spinner.succeed(chalk.green(`Project "${validated.name}" initialized!`));
        
        console.log('\n' + chalk.cyan('Next steps:'));
        console.log(`  cd ${validated.name}`);
        console.log(`  agentic run`);
        console.log('\n' + chalk.gray('Or start the interactive wizard:'));
        console.log(`  agentic run --interactive`);

      } catch (error) {
        spinner.fail(chalk.red('Failed to initialize project'));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return cmd;
}
```

### 2.3 Run Command (`src/commands/run.ts`)

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { z } from 'zod';
import { loadConfig } from '../utils/config';
import { validateProject } from '../utils/validation';

const ScenarioSchema = z.enum(['S01', 'S02', 'S03', 'S04', 'S05', 'A01', 'A02', 'A03', 'A04', 'A05']);

export function runCommand(): Command {
  const cmd = new Command('run');

  cmd
    .description('Run a scenario or workflow')
    .argument('[scenario]', 'Scenario to run (S01-S05, A01-A05)')
    .option('-i, --interactive', 'Start interactive wizard')
    .option('-r, --resume', 'Resume from last checkpoint')
    .option('--dry-run', 'Validate without executing')
    .option('-p, --phase <phase>', 'Start from specific phase')
    .action(async (scenario, options) => {
      try {
        // Load project config
        const config = await loadConfig(process.cwd());
        
        if (!config) {
          console.error(chalk.red('Error: Not in an AgenticCoder project directory.'));
          console.log(chalk.gray('Run "agentic init" to create a new project.'));
          process.exit(1);
        }

        // Determine scenario
        const targetScenario = scenario || config.scenario || 'S01';
        
        if (!ScenarioSchema.safeParse(targetScenario).success) {
          console.error(chalk.red(`Invalid scenario: ${targetScenario}`));
          console.log(chalk.gray('Valid scenarios: S01-S05, A01-A05'));
          process.exit(1);
        }

        if (options.interactive) {
          // Phase 2: Launch interactive wizard
          console.log(chalk.yellow('Interactive mode will be available in Phase 2'));
          // await launchWizard(config);
        } else {
          const spinner = ora(`Starting scenario ${targetScenario}...`).start();
          
          // Validate project structure
          await validateProject(process.cwd());
          
          spinner.text = 'Connecting to orchestration engine...';
          
          // TODO: Connect to WorkflowEngine
          // const engine = await WorkflowEngine.connect();
          // await engine.executeScenario(targetScenario, options);
          
          spinner.succeed(chalk.green(`Scenario ${targetScenario} started`));
          console.log(chalk.gray('Use "agentic status" to monitor progress'));
        }

      } catch (error) {
        console.error(chalk.red('Failed to run scenario'));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return cmd;
}
```

### 2.4 Status Command (`src/commands/status.ts`)

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../utils/config';
import { loadState } from '../utils/state';

export function statusCommand(): Command {
  const cmd = new Command('status');

  cmd
    .description('Check execution status')
    .argument('[execution-id]', 'Specific execution ID')
    .option('-w, --watch', 'Watch for changes')
    .option('-j, --json', 'Output as JSON')
    .action(async (executionId, options) => {
      try {
        const config = await loadConfig(process.cwd());
        
        if (!config) {
          console.error(chalk.red('Error: Not in an AgenticCoder project directory.'));
          process.exit(1);
        }

        const state = await loadState(process.cwd());

        if (!state || !state.currentExecution) {
          console.log(chalk.yellow('No active execution found.'));
          console.log(chalk.gray('Run "agentic run" to start a scenario.'));
          return;
        }

        if (options.json) {
          console.log(JSON.stringify(state, null, 2));
          return;
        }

        // Pretty print status
        console.log(chalk.bold('\n📊 Execution Status\n'));
        console.log(`  Execution ID: ${chalk.cyan(state.currentExecution.id)}`);
        console.log(`  Scenario:     ${chalk.cyan(state.currentExecution.scenario)}`);
        console.log(`  Status:       ${formatStatus(state.currentExecution.status)}`);
        console.log(`  Phase:        ${state.currentExecution.currentPhase}/${state.currentExecution.totalPhases}`);
        console.log(`  Started:      ${new Date(state.currentExecution.startedAt).toLocaleString()}`);
        
        if (state.currentExecution.completedPhases) {
          console.log(chalk.bold('\n✅ Completed Phases:'));
          state.currentExecution.completedPhases.forEach((phase: string) => {
            console.log(`  ${chalk.green('✓')} ${phase}`);
          });
        }

        if (options.watch) {
          // Phase 3: Real-time status updates
          console.log(chalk.yellow('\nWatch mode will be available in Phase 3'));
        }

      } catch (error) {
        console.error(chalk.red('Failed to get status'));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return cmd;
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'running': chalk.blue('● Running'),
    'paused': chalk.yellow('◐ Paused'),
    'completed': chalk.green('✓ Completed'),
    'failed': chalk.red('✗ Failed'),
    'pending': chalk.gray('○ Pending'),
  };
  return statusMap[status] || status;
}
```

### 2.5 Agents Command (`src/commands/agents.ts`)

```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function agentsCommand(): Command {
  const cmd = new Command('agents');

  cmd
    .description('Manage and interact with agents');

  // Subcommand: list
  cmd
    .command('list')
    .description('List all available agents')
    .option('-c, --category <category>', 'Filter by category')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      try {
        // TODO: Connect to AgentRegistry
        const agents = await getAgentList();

        if (options.json) {
          console.log(JSON.stringify(agents, null, 2));
          return;
        }

        console.log(chalk.bold('\n🤖 Available Agents\n'));

        const categories = groupByCategory(agents);
        
        for (const [category, categoryAgents] of Object.entries(categories)) {
          if (options.category && options.category !== category) continue;
          
          console.log(chalk.cyan(`  ${category}:`));
          categoryAgents.forEach((agent: any) => {
            console.log(`    ${chalk.white(agent.name.padEnd(20))} ${chalk.gray(agent.description)}`);
          });
          console.log();
        }

      } catch (error) {
        console.error(chalk.red('Failed to list agents'));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Subcommand: invoke
  cmd
    .command('invoke <agent>')
    .description('Invoke a specific agent')
    .option('-i, --input <json>', 'Input data as JSON')
    .option('-f, --file <file>', 'Input data from file')
    .action(async (agent, options) => {
      console.log(chalk.yellow(`Agent invocation will be available in Phase 4`));
      console.log(chalk.gray(`Requested agent: @${agent}`));
    });

  // Subcommand: info
  cmd
    .command('info <agent>')
    .description('Show detailed information about an agent')
    .action(async (agent) => {
      try {
        // TODO: Get agent details from registry
        console.log(chalk.bold(`\n📋 Agent: @${agent}\n`));
        console.log(chalk.gray('Detailed agent info will be implemented...'));
      } catch (error) {
        console.error(chalk.red('Agent not found'));
        process.exit(1);
      }
    });

  return cmd;
}

// Placeholder functions
async function getAgentList() {
  // TODO: Import from AgentRegistry
  return [
    { name: '@plan', category: 'Core', description: 'Generate project plans' },
    { name: '@doc', category: 'Core', description: 'Generate documentation' },
    { name: '@backlog', category: 'Core', description: 'Create backlog items' },
    { name: '@coordinator', category: 'Core', description: 'Coordinate workflows' },
    { name: '@react', category: 'Frontend', description: 'React components' },
    { name: '@dotnet', category: 'Backend', description: '.NET code generation' },
    { name: '@bicep', category: 'Infrastructure', description: 'Azure Bicep templates' },
    // ... more agents
  ];
}

function groupByCategory(agents: any[]) {
  return agents.reduce((acc, agent) => {
    const category = agent.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(agent);
    return acc;
  }, {} as Record<string, any[]>);
}
```

### 2.6 Config Command (`src/commands/config.ts`)

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, saveConfig, getConfigPath } from '../utils/config';

export function configCommand(): Command {
  const cmd = new Command('config');

  cmd
    .description('Manage AgenticCoder configuration');

  // Subcommand: show
  cmd
    .command('show')
    .description('Show current configuration')
    .option('-g, --global', 'Show global configuration')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      try {
        const configPath = options.global 
          ? getConfigPath('global') 
          : process.cwd();
        
        const config = await loadConfig(configPath);

        if (!config) {
          console.log(chalk.yellow('No configuration found.'));
          return;
        }

        if (options.json) {
          console.log(JSON.stringify(config, null, 2));
          return;
        }

        console.log(chalk.bold('\n⚙️  Configuration\n'));
        printConfig(config);

      } catch (error) {
        console.error(chalk.red('Failed to load configuration'));
        process.exit(1);
      }
    });

  // Subcommand: set
  cmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .option('-g, --global', 'Set in global configuration')
    .action(async (key, value, options) => {
      try {
        const configPath = options.global 
          ? getConfigPath('global') 
          : process.cwd();
        
        const config = await loadConfig(configPath) || {};
        
        // Parse value (handle JSON, numbers, booleans)
        const parsedValue = parseValue(value);
        
        // Set nested key (e.g., "azure.subscriptionId")
        setNestedValue(config, key, parsedValue);
        
        await saveConfig(configPath, config);
        
        console.log(chalk.green(`✓ Set ${key} = ${JSON.stringify(parsedValue)}`));

      } catch (error) {
        console.error(chalk.red('Failed to set configuration'));
        process.exit(1);
      }
    });

  // Subcommand: get
  cmd
    .command('get <key>')
    .description('Get a configuration value')
    .option('-g, --global', 'Get from global configuration')
    .action(async (key, options) => {
      try {
        const configPath = options.global 
          ? getConfigPath('global') 
          : process.cwd();
        
        const config = await loadConfig(configPath);
        
        if (!config) {
          console.log(chalk.yellow('No configuration found.'));
          return;
        }

        const value = getNestedValue(config, key);
        
        if (value === undefined) {
          console.log(chalk.yellow(`Key "${key}" not found.`));
          return;
        }

        console.log(JSON.stringify(value, null, 2));

      } catch (error) {
        console.error(chalk.red('Failed to get configuration'));
        process.exit(1);
      }
    });

  return cmd;
}

function printConfig(config: any, indent = '  ') {
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.log(`${indent}${chalk.cyan(key)}:`);
      printConfig(value, indent + '  ');
    } else {
      console.log(`${indent}${chalk.cyan(key)}: ${chalk.white(JSON.stringify(value))}`);
    }
  }
}

function parseValue(value: string): any {
  // Try JSON parse
  try {
    return JSON.parse(value);
  } catch {
    // Return as string
    return value;
  }
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// tests/commands/init.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

describe('agentic init', () => {
  const testDir = path.join(__dirname, '../fixtures/test-project');

  beforeEach(() => {
    fs.ensureDirSync(testDir);
  });

  afterEach(() => {
    fs.removeSync(testDir);
  });

  it('should create project structure', () => {
    execSync(`agentic init test-app`, { cwd: testDir });
    
    expect(fs.existsSync(path.join(testDir, 'test-app'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'test-app/.agenticcoder/config.json'))).toBe(true);
  });

  it('should respect --scenario option', () => {
    execSync(`agentic init test-app --scenario S02`, { cwd: testDir });
    
    const config = fs.readJsonSync(
      path.join(testDir, 'test-app/.agenticcoder/config.json')
    );
    
    expect(config.scenario).toBe('S02');
  });

  it('should fail if directory exists without --force', () => {
    fs.ensureDirSync(path.join(testDir, 'test-app'));
    
    expect(() => {
      execSync(`agentic init test-app`, { cwd: testDir });
    }).toThrow();
  });
});
```

---

## 📋 Acceptance Criteria

- [ ] `agentic --version` shows current version
- [ ] `agentic --help` shows all available commands
- [ ] `agentic init my-project` creates project structure
- [ ] `agentic init my-project --scenario S02` sets scenario in config
- [ ] `agentic run` validates project directory
- [ ] `agentic status` shows "no execution" when appropriate
- [ ] `agentic agents list` shows available agents
- [ ] `agentic config show` displays configuration
- [ ] `agentic config set key value` updates configuration
- [ ] All commands have proper error handling
- [ ] Colors can be disabled with `--no-color`

---

## 🔗 MCP Integration Points

In deze phase:
- **Filesystem MCP**: Wordt gebruikt voor project file creation
- **Git MCP**: Optioneel - git init bij project creation

```typescript
// Voorbeeld MCP client integratie
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function createProjectWithMCP(projectPath: string) {
  const fsClient = new Client({
    name: 'agentic-cli',
    version: '1.0.0'
  });

  // Connect to filesystem MCP
  await fsClient.connect(/* transport */);

  // Use MCP to create files
  await fsClient.callTool('write_file', {
    path: `${projectPath}/.agenticcoder/config.json`,
    content: JSON.stringify(defaultConfig, null, 2)
  });
}
```

---

## 🔗 Navigation

← [00-OVERVIEW.md](00-OVERVIEW.md) | [02-PHASE-INTERACTIVE-WIZARD.md](02-PHASE-INTERACTIVE-WIZARD.md) →
