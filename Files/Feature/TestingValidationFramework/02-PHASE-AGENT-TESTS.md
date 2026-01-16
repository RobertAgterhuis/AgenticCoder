# Phase 2: Agent Unit Tests

**Phase ID:** F-TVF-P02  
**Feature:** TestingValidationFramework  
**Duration:** 4-5 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 1 (Test Infrastructure)

---

## 🎯 Phase Objectives

Deze phase implementeert **Agent Unit Tests**:
- Test harness voor individuele agents
- Input/output validation per agent
- Error handling tests
- Artifact generation tests
- Performance baseline tests

---

## 📦 Deliverables

### 1. Test Structure

```
tests/
├── unit/
│   ├── agents/
│   │   ├── planning/
│   │   │   ├── plan.test.ts
│   │   │   ├── doc.test.ts
│   │   │   └── backlog.test.ts
│   │   ├── development/
│   │   │   ├── code.test.ts
│   │   │   ├── test.test.ts
│   │   │   └── review.test.ts
│   │   ├── infrastructure/
│   │   │   ├── devops.test.ts
│   │   │   └── security.test.ts
│   │   └── specialized/
│   │       ├── ux.test.ts
│   │       ├── data.test.ts
│   │       └── api.test.ts
│   └── core/
│       └── AgentBase.test.ts
```

---

## 🔧 Implementation Details

### 2.1 Agent Test Harness (`src/harness/AgentTestHarness.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/MockRegistry';
import { FixtureManager, getFixtureManager } from '../fixtures/FixtureManager';

/**
 * Agent execution result
 */
export interface AgentResult {
  success: boolean;
  artifacts: ArtifactOutput[];
  metadata: Record<string, unknown>;
  duration: number;
  error?: string;
}

/**
 * Artifact output
 */
export interface ArtifactOutput {
  id: string;
  type: string;
  name: string;
  content: string | object;
  path?: string;
}

/**
 * Agent test context
 */
export interface AgentTestContext {
  agentName: string;
  mockRegistry: MockRegistry;
  fixtures: FixtureManager;
  input: unknown;
  result?: AgentResult;
}

/**
 * Test harness for testing individual agents
 */
export class AgentTestHarness {
  private agentName: string;
  private agentInstance: unknown;
  private mockRegistry: MockRegistry;
  private fixtures: FixtureManager;
  private results: AgentResult[] = [];
  private defaultInput: unknown = {};

  constructor(agentName: string) {
    this.agentName = agentName;
    this.mockRegistry = MockRegistry.getInstance();
    this.fixtures = getFixtureManager();
  }

  /**
   * Initialize harness with agent class
   */
  async initialize<T>(AgentClass: new (...args: unknown[]) => T): Promise<void> {
    await this.mockRegistry.initialize();
    await this.fixtures.load();
    
    // Create agent instance with mocked dependencies
    this.agentInstance = new AgentClass(/* inject mocks */);
  }

  /**
   * Set default input for tests
   */
  setDefaultInput(input: unknown): this {
    this.defaultInput = input;
    return this;
  }

  /**
   * Load input from fixture
   */
  async loadInputFixture(fixtureName: string): Promise<unknown> {
    return this.fixtures.get(fixtureName);
  }

  /**
   * Execute agent with input
   */
  async execute(input?: unknown): Promise<AgentResult> {
    const effectiveInput = input || this.defaultInput;
    const startTime = Date.now();

    try {
      // Execute agent
      const agent = this.agentInstance as { execute: (input: unknown) => Promise<AgentResult> };
      const result = await agent.execute(effectiveInput);
      
      const finalResult: AgentResult = {
        ...result,
        duration: Date.now() - startTime,
      };

      this.results.push(finalResult);
      return finalResult;
    } catch (error) {
      const errorResult: AgentResult = {
        success: false,
        artifacts: [],
        metadata: {},
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
      
      this.results.push(errorResult);
      return errorResult;
    }
  }

  /**
   * Get all execution results
   */
  getResults(): AgentResult[] {
    return [...this.results];
  }

  /**
   * Get last execution result
   */
  getLastResult(): AgentResult | undefined {
    return this.results[this.results.length - 1];
  }

  /**
   * Assert last execution succeeded
   */
  assertSuccess(): void {
    const result = this.getLastResult();
    if (!result) {
      throw new Error('No execution result');
    }
    if (!result.success) {
      throw new Error(`Agent failed: ${result.error}`);
    }
  }

  /**
   * Assert artifact was generated
   */
  assertArtifactGenerated(type: string, namePattern?: RegExp): void {
    const result = this.getLastResult();
    if (!result) {
      throw new Error('No execution result');
    }

    const artifact = result.artifacts.find(a => {
      if (a.type !== type) return false;
      if (namePattern && !namePattern.test(a.name)) return false;
      return true;
    });

    if (!artifact) {
      const available = result.artifacts.map(a => `${a.type}:${a.name}`).join(', ');
      throw new Error(`Artifact ${type}${namePattern ? ` matching ${namePattern}` : ''} not found. Available: ${available}`);
    }
  }

  /**
   * Get artifact by type
   */
  getArtifact(type: string): ArtifactOutput | undefined {
    const result = this.getLastResult();
    return result?.artifacts.find(a => a.type === type);
  }

  /**
   * Assert metadata contains key
   */
  assertMetadata(key: string, value?: unknown): void {
    const result = this.getLastResult();
    if (!result) {
      throw new Error('No execution result');
    }

    if (!(key in result.metadata)) {
      throw new Error(`Metadata key '${key}' not found`);
    }

    if (value !== undefined && result.metadata[key] !== value) {
      throw new Error(`Metadata '${key}' expected ${value}, got ${result.metadata[key]}`);
    }
  }

  /**
   * Assert execution time is within limit
   */
  assertDuration(maxMs: number): void {
    const result = this.getLastResult();
    if (!result) {
      throw new Error('No execution result');
    }

    if (result.duration > maxMs) {
      throw new Error(`Execution took ${result.duration}ms, expected < ${maxMs}ms`);
    }
  }

  /**
   * Reset harness
   */
  reset(): void {
    this.results = [];
    this.mockRegistry.resetAll();
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    this.reset();
    await this.mockRegistry.cleanup();
  }
}

/**
 * Create agent test suite
 */
export function createAgentTestSuite(
  agentName: string,
  tests: (harness: AgentTestHarness) => void
): void {
  describe(`@${agentName} Agent`, () => {
    let harness: AgentTestHarness;

    beforeEach(() => {
      harness = new AgentTestHarness(agentName);
    });

    afterEach(async () => {
      await harness.cleanup();
    });

    tests(harness);
  });
}
```

### 2.2 Agent Test Base Patterns (`tests/unit/agents/AgentTestPatterns.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { AgentTestHarness, AgentResult } from '../../../src/harness/AgentTestHarness';

/**
 * Standard agent test patterns
 */
export const AgentTestPatterns = {
  /**
   * Test agent handles empty input gracefully
   */
  testEmptyInput: (harness: AgentTestHarness) => {
    it('should handle empty input', async () => {
      const result = await harness.execute({});
      // Should not throw, but may fail gracefully
      expect(result.duration).toBeGreaterThan(0);
    });
  },

  /**
   * Test agent handles invalid input
   */
  testInvalidInput: (harness: AgentTestHarness) => {
    it('should handle invalid input', async () => {
      const result = await harness.execute({ invalid: true, missing: 'required' });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  },

  /**
   * Test agent respects timeout
   */
  testTimeout: (harness: AgentTestHarness, maxMs = 60000) => {
    it(`should complete within ${maxMs}ms`, async () => {
      const result = await harness.execute();
      expect(result.duration).toBeLessThan(maxMs);
    });
  },

  /**
   * Test agent generates expected artifact types
   */
  testArtifactTypes: (harness: AgentTestHarness, expectedTypes: string[]) => {
    it('should generate expected artifact types', async () => {
      await harness.execute();
      harness.assertSuccess();
      
      for (const type of expectedTypes) {
        harness.assertArtifactGenerated(type);
      }
    });
  },

  /**
   * Test agent provides metadata
   */
  testMetadata: (harness: AgentTestHarness, requiredKeys: string[]) => {
    it('should provide required metadata', async () => {
      await harness.execute();
      harness.assertSuccess();
      
      for (const key of requiredKeys) {
        harness.assertMetadata(key);
      }
    });
  },

  /**
   * Test agent is idempotent
   */
  testIdempotency: (harness: AgentTestHarness) => {
    it('should produce consistent results', async () => {
      const result1 = await harness.execute();
      harness.reset();
      const result2 = await harness.execute();
      
      expect(result1.success).toBe(result2.success);
      expect(result1.artifacts.length).toBe(result2.artifacts.length);
    });
  },
};
```

### 2.3 Plan Agent Tests (`tests/unit/agents/planning/plan.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentTestHarness, createAgentTestSuite } from '../../../../src/harness/AgentTestHarness';
import { AgentTestPatterns } from '../AgentTestPatterns';

describe('@plan Agent', () => {
  let harness: AgentTestHarness;

  beforeEach(async () => {
    harness = new AgentTestHarness('plan');
    harness.setDefaultInput({
      projectName: 'test-project',
      description: 'A test project for unit testing',
      requirements: [
        'User authentication',
        'Dashboard with charts',
        'REST API',
      ],
      scenario: 'S01',
    });
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  // Standard patterns
  AgentTestPatterns.testEmptyInput(harness);
  AgentTestPatterns.testTimeout(harness, 30000);

  describe('artifact generation', () => {
    it('should generate ProjectPlan folder structure', async () => {
      const result = await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('folder', /ProjectPlan/);
    });

    it('should generate README.md', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('document', /README\.md/);
    });

    it('should generate architecture overview', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('document', /architecture/i);
    });

    it('should include all requirements in output', async () => {
      const result = await harness.execute();
      
      harness.assertSuccess();
      
      const readme = harness.getArtifact('document');
      expect(readme?.content).toContain('User authentication');
      expect(readme?.content).toContain('Dashboard');
      expect(readme?.content).toContain('REST API');
    });
  });

  describe('scenario handling', () => {
    it('should adapt to S01 Simple MVP scenario', async () => {
      harness.setDefaultInput({
        projectName: 'mvp-project',
        scenario: 'S01',
        requirements: ['Basic feature'],
      });

      const result = await harness.execute();
      
      harness.assertSuccess();
      harness.assertMetadata('scenario', 'S01');
    });

    it('should adapt to S03 Medium SaaS scenario', async () => {
      harness.setDefaultInput({
        projectName: 'saas-project',
        scenario: 'S03',
        requirements: ['Multi-tenant', 'Billing', 'Analytics'],
      });

      const result = await harness.execute();
      
      harness.assertSuccess();
      harness.assertMetadata('scenario', 'S03');
      harness.assertArtifactGenerated('document', /multi-tenant|architecture/i);
    });
  });

  describe('error handling', () => {
    it('should fail gracefully with missing project name', async () => {
      const result = await harness.execute({
        description: 'No project name',
        requirements: ['Feature'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('project');
    });

    it('should fail gracefully with empty requirements', async () => {
      const result = await harness.execute({
        projectName: 'test',
        requirements: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('requirements');
    });
  });

  describe('handoff preparation', () => {
    it('should prepare handoff data for @doc agent', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertMetadata('nextAgent', 'doc');
      harness.assertMetadata('handoffReady', true);
    });

    it('should include context for next agent', async () => {
      const result = await harness.execute();
      
      harness.assertSuccess();
      expect(result.metadata.handoffContext).toBeDefined();
      expect(typeof result.metadata.handoffContext).toBe('object');
    });
  });
});
```

### 2.4 Code Agent Tests (`tests/unit/agents/development/code.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentTestHarness } from '../../../../src/harness/AgentTestHarness';
import { AgentTestPatterns } from '../AgentTestPatterns';

describe('@code Agent', () => {
  let harness: AgentTestHarness;

  beforeEach(async () => {
    harness = new AgentTestHarness('code');
    harness.setDefaultInput({
      backlogItem: {
        id: 'BLI-001',
        title: 'User Authentication',
        description: 'Implement user login and registration',
        acceptanceCriteria: [
          'User can register with email',
          'User can login with credentials',
          'JWT tokens are issued',
        ],
      },
      stack: {
        frontend: 'react',
        backend: 'express',
        database: 'postgresql',
      },
      existingCode: [],
    });
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  AgentTestPatterns.testEmptyInput(harness);
  AgentTestPatterns.testTimeout(harness, 60000);

  describe('code generation', () => {
    it('should generate frontend components', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('code', /\.tsx$/);
    });

    it('should generate backend routes', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('code', /routes?\.(ts|js)$/);
    });

    it('should generate database migrations', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('migration', /\.sql$/);
    });

    it('should respect stack configuration', async () => {
      const result = await harness.execute({
        ...harness.loadInputFixture('agents/code/react-express-input'),
        stack: { frontend: 'vue', backend: 'fastify' },
      });

      harness.assertSuccess();
      
      // Should use Vue syntax
      const frontend = harness.getArtifact('code');
      expect(frontend?.content).not.toContain('jsx');
    });
  });

  describe('acceptance criteria coverage', () => {
    it('should implement all acceptance criteria', async () => {
      const result = await harness.execute();
      
      harness.assertSuccess();
      
      // Check metadata indicates coverage
      expect(result.metadata.acceptanceCriteriaCoverage).toBeDefined();
      expect(result.metadata.acceptanceCriteriaCoverage).toBe(100);
    });

    it('should generate tests for each criteria', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('test', /\.test\.(ts|js)$/);
      
      const tests = harness.getArtifact('test');
      expect(tests?.content).toContain('register');
      expect(tests?.content).toContain('login');
      expect(tests?.content).toContain('JWT');
    });
  });

  describe('code quality', () => {
    it('should generate typed code', async () => {
      await harness.execute();
      
      const code = harness.getArtifact('code');
      expect(code?.content).toContain('interface');
      expect(code?.content).toContain(': string');
    });

    it('should include error handling', async () => {
      await harness.execute();
      
      const code = harness.getArtifact('code');
      expect(code?.content).toMatch(/try\s*{|catch\s*\(|throw\s+new/);
    });

    it('should include JSDoc comments', async () => {
      await harness.execute();
      
      const code = harness.getArtifact('code');
      expect(code?.content).toContain('/**');
      expect(code?.content).toContain('@param');
    });
  });

  describe('integration preparation', () => {
    it('should prepare for @test agent handoff', async () => {
      await harness.execute();
      
      harness.assertMetadata('nextAgent', 'test');
      harness.assertMetadata('testableComponents');
    });

    it('should include import statements', async () => {
      await harness.execute();
      
      const code = harness.getArtifact('code');
      expect(code?.content).toMatch(/^import\s+/m);
    });
  });
});
```

### 2.5 DevOps Agent Tests (`tests/unit/agents/infrastructure/devops.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentTestHarness } from '../../../../src/harness/AgentTestHarness';

describe('@devops Agent', () => {
  let harness: AgentTestHarness;

  beforeEach(async () => {
    harness = new AgentTestHarness('devops');
    harness.setDefaultInput({
      infrastructure: {
        cloud: 'azure',
        services: ['app-service', 'sql-database', 'storage'],
        environment: 'production',
      },
      deployment: {
        strategy: 'blue-green',
        regions: ['westeurope'],
      },
      monitoring: {
        enabled: true,
        alerts: true,
      },
    });
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  describe('Bicep generation', () => {
    it('should generate main.bicep', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('infrastructure', /main\.bicep$/);
    });

    it('should generate module files', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('infrastructure', /modules\//);
    });

    it('should use Azure Verified Modules', async () => {
      await harness.execute();
      
      const bicep = harness.getArtifact('infrastructure');
      expect(bicep?.content).toContain('br/public:avm/');
    });

    it('should include parameters file', async () => {
      await harness.execute();
      
      harness.assertArtifactGenerated('config', /\.bicepparam$/);
    });
  });

  describe('CI/CD pipeline generation', () => {
    it('should generate GitHub Actions workflow', async () => {
      await harness.execute();
      
      harness.assertSuccess();
      harness.assertArtifactGenerated('workflow', /\.ya?ml$/);
    });

    it('should include deployment stages', async () => {
      await harness.execute();
      
      const workflow = harness.getArtifact('workflow');
      expect(workflow?.content).toContain('deploy');
      expect(workflow?.content).toContain('production');
    });

    it('should include security scanning', async () => {
      await harness.execute();
      
      const workflow = harness.getArtifact('workflow');
      expect(workflow?.content).toMatch(/security|scan|codeql/i);
    });
  });

  describe('monitoring setup', () => {
    it('should generate Application Insights config', async () => {
      await harness.execute();
      
      harness.assertArtifactGenerated('infrastructure', /insights|monitoring/i);
    });

    it('should include alert rules', async () => {
      await harness.execute();
      
      const result = harness.getLastResult();
      const alerts = result?.artifacts.filter(a => 
        a.name.includes('alert') || a.content.toString().includes('alertRules')
      );
      
      expect(alerts?.length).toBeGreaterThan(0);
    });
  });

  describe('cloud provider handling', () => {
    it('should handle Azure configuration', async () => {
      await harness.execute({
        infrastructure: { cloud: 'azure', services: ['app-service'] },
      });
      
      harness.assertSuccess();
      const artifact = harness.getArtifact('infrastructure');
      expect(artifact?.content).toContain('Microsoft.');
    });

    it('should fail gracefully for unsupported providers', async () => {
      const result = await harness.execute({
        infrastructure: { cloud: 'unsupported', services: [] },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('unsupported');
    });
  });
});
```

### 2.6 Shared Test Fixtures (`tests/fixtures/agents/`)

```json
// tests/fixtures/agents/plan/simple-mvp-input.json
{
  "metadata": {
    "description": "Simple MVP project input",
    "tags": ["plan", "S01", "mvp"],
    "version": "1.0"
  },
  "data": {
    "projectName": "simple-mvp",
    "description": "A simple MVP for testing",
    "requirements": [
      "User can sign up",
      "User can view dashboard",
      "Basic CRUD operations"
    ],
    "scenario": "S01",
    "constraints": {
      "timeline": "2 weeks",
      "budget": "low"
    }
  }
}
```

```json
// tests/fixtures/agents/code/react-express-input.json
{
  "metadata": {
    "description": "React + Express stack input",
    "tags": ["code", "react", "express"],
    "version": "1.0"
  },
  "data": {
    "backlogItem": {
      "id": "BLI-TEST-001",
      "title": "Test Feature",
      "description": "A test feature for unit testing",
      "acceptanceCriteria": [
        "Feature works correctly",
        "Feature has tests",
        "Feature is documented"
      ]
    },
    "stack": {
      "frontend": "react",
      "backend": "express",
      "database": "postgresql"
    },
    "existingCode": []
  }
}
```

---

## 🧪 Test Matrix

| Agent | Input Tests | Output Tests | Error Tests | Handoff Tests |
|-------|-------------|--------------|-------------|---------------|
| @plan | ✅ | ✅ | ✅ | ✅ |
| @doc | ✅ | ✅ | ✅ | ✅ |
| @backlog | ✅ | ✅ | ✅ | ✅ |
| @code | ✅ | ✅ | ✅ | ✅ |
| @test | ✅ | ✅ | ✅ | ✅ |
| @review | ✅ | ✅ | ✅ | ✅ |
| @devops | ✅ | ✅ | ✅ | ✅ |
| @security | ✅ | ✅ | ✅ | ✅ |
| @ux | ✅ | ✅ | ✅ | ✅ |
| @data | ✅ | ✅ | ✅ | ✅ |
| @api | ✅ | ✅ | ✅ | ✅ |

---

## 📋 Acceptance Criteria

- [ ] AgentTestHarness fully functional
- [ ] All 18 agents have unit tests
- [ ] Each agent test covers: input, output, errors, handoff
- [ ] Test fixtures available for all scenarios
- [ ] >80% code coverage per agent
- [ ] All tests pass in CI

---

## 🔗 Navigation

← [01-PHASE-TEST-INFRASTRUCTURE.md](01-PHASE-TEST-INFRASTRUCTURE.md) | [03-PHASE-INTEGRATION-TESTS.md](03-PHASE-INTEGRATION-TESTS.md) →
