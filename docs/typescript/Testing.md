# Testing Guide

Comprehensive testing guide for AgenticCoder.

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── core/               # Core module tests
│   ├── agents/             # Agent tests
│   ├── validation/         # Validation tests
│   └── utils/              # Utility tests
│
├── integration/             # Integration tests
│   ├── workflow/           # Workflow tests
│   ├── agents/             # Agent integration
│   └── validation/         # Validation pipeline
│
├── e2e/                     # End-to-end tests
│   ├── scenarios/          # Full scenario tests
│   └── cli/                # CLI tests
│
├── fixtures/                # Test fixtures
│   ├── artifacts/          # Sample artifacts
│   ├── configs/            # Test configs
│   └── mocks/              # Mock data
│
└── helpers/                 # Test utilities
    ├── setup.ts            # Test setup
    ├── mocks.ts            # Mock factories
    └── assertions.ts       # Custom assertions
```

## Testing Framework

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['tests/**', 'dist/**']
    },
    setupFiles: ['tests/helpers/setup.ts']
  }
});
```

### Test Setup

```typescript
// tests/helpers/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';

beforeAll(async () => {
  // Global setup
  await setupTestEnvironment();
});

afterAll(async () => {
  // Global cleanup
  await cleanupTestEnvironment();
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});
```

## Unit Tests

### Testing Agents

```typescript
// tests/unit/agents/plan-agent.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanAgent } from '../../../src/agents/planning/plan-agent';
import { createMockContext, createMockTask } from '../../helpers/mocks';

describe('PlanAgent', () => {
  let agent: PlanAgent;
  let mockContext: AgentContext;

  beforeEach(async () => {
    mockContext = createMockContext();
    agent = new PlanAgent(testConfig);
    await agent.initialize(mockContext);
  });

  describe('execute', () => {
    it('should create project plan successfully', async () => {
      const task = createMockTask({
        type: 'create-plan',
        inputs: {
          files: ['requirements.md'],
          parameters: { projectName: 'TestProject' }
        }
      });

      const result = await agent.execute(task);

      expect(result.status).toBe('success');
      expect(result.outputs.artifacts).toHaveLength(1);
      expect(result.outputs.artifacts[0].path).toContain('project-plan.md');
    });

    it('should handle missing requirements file', async () => {
      mockContext.artifactStore.read = vi.fn().mockRejectedValue(
        new Error('File not found')
      );

      const task = createMockTask({
        inputs: { files: ['missing.md'] }
      });

      const result = await agent.execute(task);

      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('FILE_NOT_FOUND');
    });

    it('should use planning skills', async () => {
      const mockSkill = {
        execute: vi.fn().mockResolvedValue({ success: true })
      };
      mockContext.skillLoader.load = vi.fn().mockResolvedValue(mockSkill);

      await agent.execute(createMockTask());

      expect(mockContext.skillLoader.load).toHaveBeenCalledWith('project-planning');
      expect(mockSkill.execute).toHaveBeenCalled();
    });
  });

  describe('lifecycle', () => {
    it('should initialize skills on init', async () => {
      expect(mockContext.skillLoader.load).toHaveBeenCalledTimes(3);
    });

    it('should cleanup resources', async () => {
      await agent.cleanup();
      // Verify cleanup actions
    });
  });
});
```

### Testing Validation

```typescript
// tests/unit/validation/schema-validator.test.ts
import { describe, it, expect } from 'vitest';
import { SchemaValidator } from '../../../src/validation/validators/schema-validator';
import { createMockArtifact } from '../../helpers/mocks';

describe('SchemaValidator', () => {
  const validator = new SchemaValidator();

  describe('validate', () => {
    it('should pass valid JSON against schema', async () => {
      const artifact = createMockArtifact({
        path: 'config.json',
        content: JSON.stringify({
          id: 'test',
          name: 'Test Config',
          skills: ['skill-1']
        })
      });

      const result = await validator.validate(artifact);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail invalid JSON', async () => {
      const artifact = createMockArtifact({
        path: 'config.json',
        content: '{ invalid json }'
      });

      const result = await validator.validate(artifact);

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_JSON');
    });

    it('should report missing required fields', async () => {
      const artifact = createMockArtifact({
        path: 'config.json',
        content: JSON.stringify({ name: 'Test' }) // missing 'id'
      });

      const result = await validator.validate(artifact);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'SCHEMA_ERROR',
          message: expect.stringContaining('id')
        })
      );
    });
  });
});
```

### Testing Message Bus

```typescript
// tests/unit/core/message-bus.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MessageBus } from '../../../src/core/message-bus';

describe('MessageBus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = new MessageBus();
  });

  describe('publish/subscribe', () => {
    it('should deliver messages to subscribers', async () => {
      const handler = vi.fn();
      bus.subscribe('test.topic', handler);

      await bus.publish({
        type: 'task',
        to: 'test-agent',
        topic: 'test.topic',
        payload: { data: 'test' }
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'test.topic',
          payload: { data: 'test' }
        })
      );
    });

    it('should support wildcard subscriptions', async () => {
      const handler = vi.fn();
      bus.subscribe('agents.*', handler);

      await bus.publish({ topic: 'agents.plan', payload: {} });
      await bus.publish({ topic: 'agents.doc', payload: {} });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should allow unsubscribe', async () => {
      const handler = vi.fn();
      const sub = bus.subscribe('test.topic', handler);

      sub.unsubscribe();
      await bus.publish({ topic: 'test.topic', payload: {} });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('request/response', () => {
    it('should handle request-response pattern', async () => {
      bus.subscribe('service.echo', async (msg) => {
        await bus.publish({
          type: 'result',
          correlationId: msg.id,
          payload: { echo: msg.payload }
        });
      });

      const response = await bus.request({
        topic: 'service.echo',
        payload: { message: 'hello' }
      });

      expect(response.payload).toEqual({ echo: { message: 'hello' } });
    });

    it('should timeout on no response', async () => {
      await expect(
        bus.request({ topic: 'no.subscriber', payload: {} }, 100)
      ).rejects.toThrow('Request timeout');
    });
  });
});
```

## Integration Tests

### Testing Workflow

```typescript
// tests/integration/workflow/workflow-engine.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WorkflowEngine } from '../../../src/core/workflow-engine';
import { TestEnvironment } from '../../helpers/test-environment';

describe('WorkflowEngine Integration', () => {
  let engine: WorkflowEngine;
  let env: TestEnvironment;

  beforeAll(async () => {
    env = await TestEnvironment.create();
    engine = new WorkflowEngine();
  });

  afterAll(async () => {
    await env.cleanup();
  });

  describe('workflow execution', () => {
    it('should execute phases in order', async () => {
      const phaseOrder: number[] = [];

      engine.on('phase:started', (phase) => {
        phaseOrder.push(phase.number);
      });

      await engine.initialize({
        scenario: 'S01',
        projectName: 'IntegrationTest'
      });

      await engine.start();

      expect(phaseOrder).toEqual([1, 2, 3, 4, 5]);
    });

    it('should skip configured phases', async () => {
      await engine.initialize({
        scenario: 'S01',
        projectName: 'SkipTest',
        settings: { skipPhases: [3, 4] }
      });

      const result = await engine.start();

      expect(result.skippedPhases).toContain(3);
      expect(result.skippedPhases).toContain(4);
    });

    it('should handle phase failures', async () => {
      // Inject failure
      env.injectFailure('phase-2', new Error('Simulated failure'));

      await engine.initialize({
        scenario: 'S01',
        projectName: 'FailureTest'
      });

      const result = await engine.start();

      expect(result.status).toBe('failed');
      expect(result.failedPhases).toContain(2);
    });
  });

  describe('pause/resume', () => {
    it('should pause and resume workflow', async () => {
      await engine.initialize({
        scenario: 'S02',
        projectName: 'PauseTest'
      });

      // Start in background
      const promise = engine.start();

      // Pause after phase 1
      engine.on('phase:completed', async (phase) => {
        if (phase.number === 1) {
          await engine.pause();
        }
      });

      // Wait for pause
      await new Promise(resolve => setTimeout(resolve, 1000));
      const status = await engine.getStatus();
      expect(status.state).toBe('paused');

      // Resume
      await engine.resume();
      const result = await promise;

      expect(result.status).toBe('success');
    });
  });
});
```

### Testing Agent Integration

```typescript
// tests/integration/agents/agent-communication.test.ts
import { describe, it, expect } from 'vitest';
import { AgentOrchestrator } from '../../../src/core/agent-orchestrator';
import { MessageBus } from '../../../src/core/message-bus';

describe('Agent Communication Integration', () => {
  let orchestrator: AgentOrchestrator;
  let bus: MessageBus;

  beforeEach(async () => {
    bus = new MessageBus();
    orchestrator = new AgentOrchestrator(bus);
    await orchestrator.loadAgents(['plan', 'doc', 'architect']);
  });

  it('should handoff between agents', async () => {
    const handoffs: string[] = [];

    bus.subscribe('*.handoff', (msg) => {
      handoffs.push(`${msg.from} -> ${msg.to}`);
    });

    await orchestrator.executePhase(1);
    await orchestrator.executePhase(2);

    expect(handoffs).toContain('plan -> doc');
    expect(handoffs).toContain('doc -> architect');
  });

  it('should share artifacts between agents', async () => {
    await orchestrator.executePhase(1); // Creates plan
    await orchestrator.executePhase(2); // Doc reads plan

    const docAgent = orchestrator.getAgent('doc');
    const inputs = await docAgent.getLastInputs();

    expect(inputs).toContainEqual(
      expect.stringContaining('project-plan.md')
    );
  });
});
```

## End-to-End Tests

### Scenario Tests

```typescript
// tests/e2e/scenarios/s01-mvp.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('S01: Simple MVP E2E', () => {
  const testDir = path.join(__dirname, '../../fixtures/e2e-output');

  beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should generate complete MVP project', () => {
    execSync(
      `node bin/agentic.js generate --scenario S01 --name TestMVP --output ${testDir}`,
      { timeout: 300000 }
    );

    // Verify project structure
    expect(fs.existsSync(path.join(testDir, 'plans/project-plan.md'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'architecture/system-design.md'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'src/index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'package.json'))).toBe(true);
  });

  it('should pass all validations', () => {
    const result = execSync(
      `node bin/agentic.js validate ${testDir}`,
      { encoding: 'utf-8' }
    );

    expect(result).toContain('All validations passed');
  });
});
```

### CLI Tests

```typescript
// tests/e2e/cli/cli-commands.test.ts
import { describe, it, expect } from 'vitest';
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';

const execOptions: ExecSyncOptionsWithStringEncoding = {
  encoding: 'utf-8',
  stdio: 'pipe'
};

describe('CLI Commands E2E', () => {
  describe('agentic status', () => {
    it('should display status', () => {
      const output = execSync('node bin/agentic.js status', execOptions);
      expect(output).toContain('AgenticCoder Status');
    });
  });

  describe('agentic validate', () => {
    it('should validate files', () => {
      const output = execSync(
        'node bin/agentic.js validate tests/fixtures/sample.ts',
        execOptions
      );
      expect(output).toContain('Validation');
    });
  });

  describe('agentic avm search', () => {
    it('should search AVM modules', () => {
      const output = execSync(
        'node bin/agentic.js avm search "app service"',
        execOptions
      );
      expect(output).toContain('avm/res/web/site');
    });
  });
});
```

## Mock Factories

```typescript
// tests/helpers/mocks.ts
import { vi } from 'vitest';

export function createMockContext(): AgentContext {
  return {
    workflowId: 'test-workflow',
    scenario: 'S01',
    projectName: 'TestProject',
    currentPhase: 1,
    
    messageBus: {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      request: vi.fn().mockResolvedValue({ payload: {} }),
      broadcast: vi.fn().mockResolvedValue(undefined)
    },
    
    artifactStore: {
      read: vi.fn().mockResolvedValue('mock content'),
      write: vi.fn().mockResolvedValue({ path: 'mock/path' }),
      exists: vi.fn().mockResolvedValue(true),
      list: vi.fn().mockResolvedValue([])
    },
    
    skillLoader: {
      load: vi.fn().mockResolvedValue({ execute: vi.fn() }),
      loadAll: vi.fn().mockResolvedValue([]),
      getAvailable: vi.fn().mockReturnValue([])
    },
    
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis()
    },
    
    config: {},
    sharedState: new Map()
  };
}

export function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: 'task-123',
    type: 'feature',
    title: 'Test Task',
    description: 'Test description',
    inputs: {
      files: [],
      parameters: {}
    },
    expectedOutputs: [],
    timeout: 30000,
    retryPolicy: { maxRetries: 3, backoff: 'exponential', initialDelay: 1000, maxDelay: 30000 },
    metadata: { phase: 1, priority: 1, source: 'test', created: new Date() },
    ...overrides
  };
}

export function createMockArtifact(overrides?: Partial<Artifact>): Artifact {
  return {
    path: 'test/artifact.ts',
    content: '// test content',
    type: 'code',
    metadata: {
      created: new Date(),
      modified: new Date(),
      createdBy: 'test',
      modifiedBy: 'test',
      phase: 1,
      version: 1,
      checksum: 'abc123',
      tags: []
    },
    ...overrides
  };
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/agents/plan-agent.test.ts

# Run tests matching pattern
npm test -- --grep "MessageBus"

# Run e2e tests only
npm test -- tests/e2e/

# Watch mode
npm test -- --watch
```

## Next Steps

- [TypeScript Overview](Overview) - Module structure
- [API Reference](API-Reference) - API documentation
- [CI/CD](../guides/CI-CD) - Continuous integration
