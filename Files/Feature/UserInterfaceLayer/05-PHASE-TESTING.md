# Phase 5: Testing & Polish

**Phase ID:** F-UIL-P05  
**Feature:** UserInterfaceLayer  
**Duration:** 1 week  
**Status:** ⬜ Not Started  
**Depends On:** Phase 4 (Agent Console)

---

## 🎯 Phase Objectives

Deze phase focust op **Testing, Documentatie en Polish**:
- Comprehensive E2E tests voor alle CLI commands
- Unit tests voor alle components
- Performance optimization
- Accessibility improvements
- User documentation
- Package publishing setup

---

## 📦 Deliverables

### 1. Test Structure

```
packages/cli/
├── tests/
│   ├── e2e/
│   │   ├── init.e2e.test.ts        # agentic init tests
│   │   ├── run.e2e.test.ts         # agentic run tests
│   │   ├── status.e2e.test.ts      # agentic status tests
│   │   ├── agents.e2e.test.ts      # agentic agents tests
│   │   ├── config.e2e.test.ts      # agentic config tests
│   │   ├── console.e2e.test.ts     # agentic console tests
│   │   └── wizard.e2e.test.ts      # Interactive wizard tests
│   ├── unit/
│   │   ├── commands/
│   │   │   └── *.test.ts
│   │   ├── wizard/
│   │   │   └── *.test.ts
│   │   ├── dashboard/
│   │   │   └── *.test.ts
│   │   ├── console/
│   │   │   └── *.test.ts
│   │   └── utils/
│   │       └── *.test.ts
│   ├── integration/
│   │   ├── mcp-integration.test.ts
│   │   ├── agent-invocation.test.ts
│   │   └── websocket.test.ts
│   ├── fixtures/
│   │   ├── projects/
│   │   │   ├── valid-project/
│   │   │   └── invalid-project/
│   │   ├── configs/
│   │   │   └── *.json
│   │   └── mocks/
│   │       └── *.ts
│   └── setup.ts                    # Test setup
```

### 2. Documentation Structure

```
packages/cli/
├── docs/
│   ├── README.md                   # Package overview
│   ├── INSTALLATION.md             # Installation guide
│   ├── COMMANDS.md                 # Command reference
│   ├── CONFIGURATION.md            # Configuration guide
│   ├── WIZARD.md                   # Wizard guide
│   ├── DASHBOARD.md                # Dashboard guide
│   ├── CONSOLE.md                  # Console guide
│   ├── TROUBLESHOOTING.md          # Common issues
│   └── API.md                      # Programmatic API
```

---

## 🔧 Implementation Details

### 5.1 E2E Test Setup (`tests/e2e/setup.ts`)

```typescript
import { execSync, spawn, ChildProcess } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { afterAll, beforeAll, beforeEach } from 'vitest';

export const TEST_DIR = path.join(__dirname, '../fixtures/test-workspace');
export const CLI_PATH = path.join(__dirname, '../../bin/agentic');

let serverProcess: ChildProcess | null = null;

beforeAll(async () => {
  // Build CLI
  execSync('npm run build', { cwd: path.join(__dirname, '../..') });
  
  // Start mock server for integration tests
  serverProcess = spawn('node', ['./tests/mocks/server.js'], {
    cwd: path.join(__dirname, '../..'),
    stdio: 'pipe',
  });

  // Wait for server to start
  await new Promise(r => setTimeout(r, 1000));
});

afterAll(async () => {
  // Stop mock server
  serverProcess?.kill();
  
  // Clean up test directory
  await fs.remove(TEST_DIR);
});

beforeEach(async () => {
  // Reset test directory
  await fs.ensureDir(TEST_DIR);
  await fs.emptyDir(TEST_DIR);
});

export function runCLI(args: string[], options?: { cwd?: string; input?: string }): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const proc = spawn('node', [CLI_PATH, ...args], {
      cwd: options?.cwd || TEST_DIR,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    if (options?.input) {
      proc.stdin.write(options.input);
      proc.stdin.end();
    }

    proc.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });
  });
}
```

### 5.2 E2E Tests for Init Command (`tests/e2e/init.e2e.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { runCLI, TEST_DIR } from './setup';

describe('agentic init', () => {
  describe('basic initialization', () => {
    it('should create project with default settings', async () => {
      const { stdout, exitCode } = await runCLI(['init', 'my-project']);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Project "my-project" initialized');
      
      // Check structure
      const projectPath = path.join(TEST_DIR, 'my-project');
      expect(await fs.pathExists(projectPath)).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, '.agenticcoder/config.json'))).toBe(true);
    });

    it('should use specified scenario', async () => {
      const { exitCode } = await runCLI(['init', 'api-project', '--scenario', 'S02']);

      expect(exitCode).toBe(0);
      
      const config = await fs.readJson(
        path.join(TEST_DIR, 'api-project/.agenticcoder/config.json')
      );
      expect(config.scenario).toBe('S02');
    });

    it('should fail when directory exists without --force', async () => {
      await fs.ensureDir(path.join(TEST_DIR, 'existing-project'));

      const { exitCode, stderr } = await runCLI(['init', 'existing-project']);

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('already exists');
    });

    it('should overwrite with --force', async () => {
      await fs.ensureDir(path.join(TEST_DIR, 'existing-project'));
      await fs.writeFile(
        path.join(TEST_DIR, 'existing-project/old-file.txt'),
        'old content'
      );

      const { exitCode } = await runCLI(['init', 'existing-project', '--force']);

      expect(exitCode).toBe(0);
      expect(await fs.pathExists(
        path.join(TEST_DIR, 'existing-project/.agenticcoder/config.json')
      )).toBe(true);
    });
  });

  describe('template handling', () => {
    it('should apply specified template', async () => {
      const { exitCode } = await runCLI(['init', 'template-project', '--template', 'fullstack']);

      expect(exitCode).toBe(0);
      
      const config = await fs.readJson(
        path.join(TEST_DIR, 'template-project/.agenticcoder/config.json')
      );
      expect(config.template).toBe('fullstack');
    });
  });

  describe('validation', () => {
    it('should reject invalid project names', async () => {
      const { exitCode, stderr } = await runCLI(['init', 'Invalid Name!']);

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('invalid');
    });

    it('should reject invalid scenarios', async () => {
      const { exitCode, stderr } = await runCLI(['init', 'my-project', '--scenario', 'INVALID']);

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('scenario');
    });
  });
});
```

### 5.3 E2E Tests for Status Command (`tests/e2e/status.e2e.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { runCLI, TEST_DIR } from './setup';

describe('agentic status', () => {
  beforeEach(async () => {
    // Create a valid project
    await runCLI(['init', 'test-project']);
    process.chdir(path.join(TEST_DIR, 'test-project'));
  });

  describe('without execution', () => {
    it('should show no active execution message', async () => {
      const { stdout, exitCode } = await runCLI(['status'], {
        cwd: path.join(TEST_DIR, 'test-project'),
      });

      expect(exitCode).toBe(0);
      expect(stdout).toContain('No active execution');
    });
  });

  describe('with active execution', () => {
    beforeEach(async () => {
      // Create mock state file
      await fs.writeJson(
        path.join(TEST_DIR, 'test-project/.agenticcoder/state.json'),
        {
          currentExecution: {
            id: 'exec-123',
            scenario: 'S01',
            status: 'running',
            currentPhase: 2,
            totalPhases: 5,
            startedAt: new Date().toISOString(),
            completedPhases: ['Requirements'],
          },
        }
      );
    });

    it('should show execution status', async () => {
      const { stdout, exitCode } = await runCLI(['status'], {
        cwd: path.join(TEST_DIR, 'test-project'),
      });

      expect(exitCode).toBe(0);
      expect(stdout).toContain('exec-123');
      expect(stdout).toContain('S01');
      expect(stdout).toContain('Running');
    });

    it('should output JSON with --json flag', async () => {
      const { stdout, exitCode } = await runCLI(['status', '--json'], {
        cwd: path.join(TEST_DIR, 'test-project'),
      });

      expect(exitCode).toBe(0);
      
      const json = JSON.parse(stdout);
      expect(json.currentExecution.id).toBe('exec-123');
    });
  });

  describe('outside project directory', () => {
    it('should show error message', async () => {
      const { exitCode, stderr } = await runCLI(['status'], {
        cwd: TEST_DIR,
      });

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('Not in an AgenticCoder project');
    });
  });
});
```

### 5.4 Unit Tests for Components (`tests/unit/wizard/ScenarioStep.test.tsx`)

```tsx
import React from 'react';
import { render } from 'ink-testing-library';
import { WizardProvider } from '../../../src/wizard/context/WizardContext';
import { ScenarioStep } from '../../../src/wizard/steps/ScenarioStep';

describe('ScenarioStep', () => {
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <WizardProvider>
        {ui}
      </WizardProvider>
    );
  };

  it('should render all 5 scenarios', () => {
    const { lastFrame } = renderWithProvider(
      <ScenarioStep onNext={vi.fn()} onBack={vi.fn()} />
    );

    const frame = lastFrame();
    expect(frame).toContain('S01');
    expect(frame).toContain('S02');
    expect(frame).toContain('S03');
    expect(frame).toContain('S04');
    expect(frame).toContain('S05');
  });

  it('should show description for selected scenario', async () => {
    const { lastFrame, stdin } = renderWithProvider(
      <ScenarioStep onNext={vi.fn()} onBack={vi.fn()} />
    );

    // First scenario should be highlighted by default
    expect(lastFrame()).toContain('Full Stack Application');
  });

  it('should call onNext when scenario is selected', async () => {
    const onNext = vi.fn();
    const { stdin } = renderWithProvider(
      <ScenarioStep onNext={onNext} onBack={vi.fn()} />
    );

    // Press Enter to select
    stdin.write('\r');

    await new Promise(r => setTimeout(r, 100));
    
    expect(onNext).toHaveBeenCalled();
  });

  it('should navigate between scenarios with arrow keys', async () => {
    const { lastFrame, stdin } = renderWithProvider(
      <ScenarioStep onNext={vi.fn()} onBack={vi.fn()} />
    );

    // Navigate down
    stdin.write('\u001B[B'); // Arrow down

    await new Promise(r => setTimeout(r, 100));

    expect(lastFrame()).toContain('API-Only Backend');
  });
});
```

### 5.5 Integration Tests (`tests/integration/mcp-integration.test.ts`)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('MCP Integration', () => {
  let client: Client;

  beforeAll(async () => {
    // Connect to filesystem MCP for testing
    client = new Client({
      name: 'test-client',
      version: '1.0.0',
    });

    // Note: In real tests, you'd start the MCP server first
  });

  afterAll(async () => {
    await client.close();
  });

  describe('Filesystem MCP', () => {
    it('should read file contents', async () => {
      // This would test actual MCP integration
      // Placeholder for now
      expect(true).toBe(true);
    });

    it('should write file contents', async () => {
      // Placeholder
      expect(true).toBe(true);
    });
  });

  describe('Memory MCP', () => {
    it('should store and retrieve values', async () => {
      // Placeholder
      expect(true).toBe(true);
    });
  });
});
```

### 5.6 Performance Tests (`tests/unit/performance.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('Performance', () => {
  describe('CLI startup', () => {
    it('should start within 500ms', async () => {
      const start = performance.now();
      
      // Import CLI module
      await import('../../src/cli');
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Command parsing', () => {
    it('should parse commands within 10ms', () => {
      const { createCLI } = require('../../src/cli');
      
      const start = performance.now();
      const program = createCLI();
      program.parse(['node', 'agentic', 'status', '--json'], { from: 'user' });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Config loading', () => {
    it('should load config within 50ms', async () => {
      const { loadConfig } = await import('../../src/utils/config');
      
      const start = performance.now();
      await loadConfig(process.cwd());
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });
  });
});
```

---

## 📚 Documentation

### 5.7 Command Reference (`docs/COMMANDS.md`)

```markdown
# AgenticCoder CLI Command Reference

## Global Options

| Option | Description |
|--------|-------------|
| `-v, --version` | Show version number |
| `-h, --help` | Show help |
| `-d, --debug` | Enable debug mode |
| `-q, --quiet` | Suppress non-essential output |
| `--no-color` | Disable colored output |

## Commands

### `agentic init [project-name]`

Initialize a new AgenticCoder project.

**Arguments:**
- `project-name` - Name of the project (default: "my-project")

**Options:**
- `-s, --scenario <scenario>` - Scenario to use (S01-S05)
- `-t, --template <template>` - Project template
- `-f, --force` - Overwrite existing project
- `-y, --yes` - Skip interactive prompts

**Examples:**
```bash
agentic init my-app
agentic init my-api --scenario S02
agentic init existing-project --force
```

### `agentic run [scenario]`

Run a scenario or workflow.

**Arguments:**
- `scenario` - Scenario to run (S01-S05, A01-A05)

**Options:**
- `-i, --interactive` - Start interactive wizard
- `-r, --resume` - Resume from last checkpoint
- `--dry-run` - Validate without executing
- `-p, --phase <phase>` - Start from specific phase

**Examples:**
```bash
agentic run
agentic run S02
agentic run --interactive
agentic run --resume
```

### `agentic status [execution-id]`

Check execution status.

**Arguments:**
- `execution-id` - Specific execution ID (optional)

**Options:**
- `-w, --watch` - Watch for changes (dashboard mode)
- `-j, --json` - Output as JSON

**Examples:**
```bash
agentic status
agentic status --watch
agentic status exec-abc123 --json
```

### `agentic agents <subcommand>`

Manage and interact with agents.

**Subcommands:**

#### `agentic agents list`
List all available agents.

**Options:**
- `-c, --category <category>` - Filter by category
- `-j, --json` - Output as JSON

#### `agentic agents invoke <agent>`
Invoke a specific agent.

**Options:**
- `-i, --input <json>` - Input data as JSON
- `-f, --file <file>` - Input data from file

#### `agentic agents info <agent>`
Show detailed information about an agent.

**Examples:**
```bash
agentic agents list
agentic agents list --category Frontend
agentic agents invoke plan --input '{"project": "my-app"}'
agentic agents info @react
```

### `agentic config <subcommand>`

Manage AgenticCoder configuration.

**Subcommands:**

#### `agentic config show`
Show current configuration.

**Options:**
- `-g, --global` - Show global configuration
- `-j, --json` - Output as JSON

#### `agentic config set <key> <value>`
Set a configuration value.

**Options:**
- `-g, --global` - Set in global configuration

#### `agentic config get <key>`
Get a configuration value.

**Options:**
- `-g, --global` - Get from global configuration

**Examples:**
```bash
agentic config show
agentic config set azure.subscriptionId "abc-123"
agentic config get scenario
```

### `agentic console`

Launch interactive agent console.

**Options:**
- `--agent <agent>` - Pre-select agent

**Console Commands:**
- `/help` - Show available commands
- `/agents` - List available agents
- `/agent <name>` - Switch to agent
- `/context` - Show current context
- `/clear` - Clear messages
- `/exit` - Exit console

**Examples:**
```bash
agentic console
agentic console --agent plan
```
```

### 5.8 Troubleshooting Guide (`docs/TROUBLESHOOTING.md`)

```markdown
# Troubleshooting Guide

## Common Issues

### "Not in an AgenticCoder project directory"

**Problem:** You're running commands outside a project directory.

**Solution:**
1. Navigate to your project: `cd my-project`
2. Or initialize a new project: `agentic init my-project`

### "Connection refused" errors

**Problem:** Cannot connect to the execution server.

**Solution:**
1. Check if the server is running
2. Verify the server URL in config: `agentic config get serverUrl`
3. Check firewall settings
4. Try restarting the server

### Wizard not responding to keyboard input

**Problem:** Interactive wizard doesn't respond to keys.

**Solution:**
1. Ensure your terminal supports TTY
2. Try running with `--no-color` flag
3. Check if running in a piped/non-interactive context

### "Agent not found" errors

**Problem:** Specified agent doesn't exist.

**Solution:**
1. List available agents: `agentic agents list`
2. Check spelling of agent name
3. Ensure agent server is running

### Colors not displaying correctly

**Problem:** Terminal shows escape codes instead of colors.

**Solution:**
1. Use a terminal that supports ANSI colors
2. Run with `--no-color` to disable colors
3. Check `TERM` environment variable

## Debug Mode

Enable debug mode for detailed logging:

```bash
agentic --debug run
```

This will show:
- API calls and responses
- WebSocket messages
- File operations
- Configuration loading

## Getting Help

- Documentation: https://docs.agenticcoder.dev
- GitHub Issues: https://github.com/agenticcoder/cli/issues
- Discord: https://discord.gg/agenticcoder
```

---

## 📦 Package Publishing Setup

### 5.9 Package Configuration (`package.json`)

```json
{
  "name": "@agenticcoder/cli",
  "version": "1.0.0",
  "description": "Command-line interface for AgenticCoder",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "agentic": "./bin/agentic"
  },
  "files": [
    "dist",
    "bin",
    "docs"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm test"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/agenticcoder/cli.git"
  },
  "keywords": [
    "agentic",
    "ai",
    "code-generation",
    "cli"
  ],
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  }
}
```

### 5.10 CI/CD Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]

    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test

  e2e:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e

  publish:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'
          
      - run: npm ci
      - run: npm run build
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 📋 Acceptance Criteria

### Testing
- [ ] All E2E tests pass for init, run, status, agents, config commands
- [ ] All unit tests pass with >80% coverage
- [ ] Integration tests pass with mock MCP servers
- [ ] Performance tests confirm <500ms startup time

### Documentation
- [ ] README.md with quick start guide
- [ ] Complete command reference in COMMANDS.md
- [ ] Configuration guide in CONFIGURATION.md
- [ ] Troubleshooting guide in TROUBLESHOOTING.md
- [ ] API documentation for programmatic usage

### Publishing
- [ ] Package builds successfully
- [ ] Package published to npm
- [ ] CI/CD pipeline runs all tests
- [ ] Version management configured

### Polish
- [ ] All commands have helpful error messages
- [ ] `--help` works for all commands
- [ ] Colors can be disabled
- [ ] Works on Windows, macOS, Linux
- [ ] Accessibility: screen reader compatible output available

---

## 🔗 Navigation

← [04-PHASE-AGENT-CONSOLE.md](04-PHASE-AGENT-CONSOLE.md) | [00-OVERVIEW.md](00-OVERVIEW.md) (Complete Feature)
