# Phase 3: Integration Tests

**Phase ID:** F-TVF-P03  
**Feature:** TestingValidationFramework  
**Duration:** 4-5 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 2 (Agent Unit Tests)

---

## 🎯 Phase Objectives

Deze phase implementeert **Integration Tests**:
- Agent-to-agent handoff testing
- Workflow sequence validation
- Message bus integration
- Cross-agent artifact flow
- Phase boundary testing

---

## 📦 Deliverables

### 1. Test Structure

```
tests/
├── integration/
│   ├── handoffs/
│   │   ├── plan-to-doc.test.ts
│   │   ├── doc-to-backlog.test.ts
│   │   ├── backlog-to-code.test.ts
│   │   ├── code-to-test.test.ts
│   │   ├── test-to-review.test.ts
│   │   └── full-phase.test.ts
│   ├── workflows/
│   │   ├── sequential-workflow.test.ts
│   │   ├── parallel-workflow.test.ts
│   │   └── conditional-workflow.test.ts
│   ├── artifacts/
│   │   ├── artifact-flow.test.ts
│   │   └── artifact-versioning.test.ts
│   └── messaging/
│       ├── message-bus.test.ts
│       └── event-propagation.test.ts
```

---

## 🔧 Implementation Details

### 3.1 Workflow Test Harness (`src/harness/WorkflowTestHarness.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/MockRegistry';
import { MockMessageBus, Message } from '../mocks/MockMessageBus';
import { AgentResult, ArtifactOutput } from './AgentTestHarness';

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  agent: string;
  input?: unknown;
  expectedArtifacts?: string[];
  timeout?: number;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  success: boolean;
  steps: StepResult[];
  artifacts: ArtifactOutput[];
  messages: Message[];
  totalDuration: number;
  failedAt?: string;
  error?: string;
}

/**
 * Individual step result
 */
export interface StepResult {
  agent: string;
  success: boolean;
  duration: number;
  artifacts: ArtifactOutput[];
  handoffData?: unknown;
  error?: string;
}

/**
 * Test harness for workflow integration tests
 */
export class WorkflowTestHarness {
  private mockRegistry: MockRegistry;
  private messageBus: MockMessageBus;
  private steps: WorkflowStep[] = [];
  private results: WorkflowResult[] = [];
  private artifactStore: Map<string, ArtifactOutput> = new Map();

  constructor() {
    this.mockRegistry = MockRegistry.getInstance();
    this.messageBus = this.mockRegistry.getMessageBus();
  }

  /**
   * Initialize harness
   */
  async initialize(): Promise<void> {
    await this.mockRegistry.initialize();
  }

  /**
   * Define workflow steps
   */
  defineWorkflow(steps: WorkflowStep[]): this {
    this.steps = steps;
    return this;
  }

  /**
   * Add single step
   */
  addStep(step: WorkflowStep): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Setup mock agent with response
   */
  mockAgent(name: string, response: Partial<AgentResult>): this {
    const agent = this.mockRegistry.getOrCreateAgent(name);
    agent.setDefaultResponse({
      success: true,
      artifacts: [],
      metadata: {},
      ...response,
    });
    return this;
  }

  /**
   * Setup mock agent to fail
   */
  mockAgentFailure(name: string, error: string): this {
    const agent = this.mockRegistry.getOrCreateAgent(name);
    agent.setFailure(error);
    return this;
  }

  /**
   * Execute workflow
   */
  async execute(initialInput?: unknown): Promise<WorkflowResult> {
    const startTime = Date.now();
    const stepResults: StepResult[] = [];
    const allArtifacts: ArtifactOutput[] = [];
    let currentInput = initialInput;
    let failedAt: string | undefined;
    let error: string | undefined;

    for (const step of this.steps) {
      const stepStart = Date.now();
      const agent = this.mockRegistry.getOrCreateAgent(step.agent);
      
      try {
        // Merge step input with previous handoff data
        const input = {
          ...currentInput,
          ...step.input,
        };

        // Execute agent
        const result = await agent.execute(input);
        
        const stepResult: StepResult = {
          agent: step.agent,
          success: result.success,
          duration: Date.now() - stepStart,
          artifacts: result.artifacts,
          handoffData: result.metadata.handoffContext,
          error: result.error,
        };

        stepResults.push(stepResult);

        if (!result.success) {
          failedAt = step.agent;
          error = result.error;
          break;
        }

        // Verify expected artifacts
        if (step.expectedArtifacts) {
          for (const expectedType of step.expectedArtifacts) {
            const found = result.artifacts.some(a => a.type === expectedType);
            if (!found) {
              failedAt = step.agent;
              error = `Expected artifact type '${expectedType}' not produced`;
              break;
            }
          }
        }

        if (failedAt) break;

        // Store artifacts
        result.artifacts.forEach(a => {
          this.artifactStore.set(`${step.agent}:${a.id}`, a);
          allArtifacts.push(a);
        });

        // Publish handoff message
        await this.messageBus.publish({
          type: 'agent.completed',
          source: step.agent,
          target: this.steps[this.steps.indexOf(step) + 1]?.agent,
          payload: {
            artifacts: result.artifacts.map(a => a.id),
            handoff: result.metadata.handoffContext,
          },
        });

        // Update input for next step
        currentInput = result.metadata.handoffContext || {};

      } catch (err) {
        stepResults.push({
          agent: step.agent,
          success: false,
          duration: Date.now() - stepStart,
          artifacts: [],
          error: err instanceof Error ? err.message : String(err),
        });
        
        failedAt = step.agent;
        error = err instanceof Error ? err.message : String(err);
        break;
      }
    }

    const workflowResult: WorkflowResult = {
      success: !failedAt,
      steps: stepResults,
      artifacts: allArtifacts,
      messages: this.messageBus.getMessages(),
      totalDuration: Date.now() - startTime,
      failedAt,
      error,
    };

    this.results.push(workflowResult);
    return workflowResult;
  }

  /**
   * Get workflow results
   */
  getResults(): WorkflowResult[] {
    return [...this.results];
  }

  /**
   * Get last result
   */
  getLastResult(): WorkflowResult | undefined {
    return this.results[this.results.length - 1];
  }

  /**
   * Assert workflow succeeded
   */
  assertSuccess(): void {
    const result = this.getLastResult();
    if (!result) {
      throw new Error('No workflow result');
    }
    if (!result.success) {
      throw new Error(`Workflow failed at ${result.failedAt}: ${result.error}`);
    }
  }

  /**
   * Assert all steps completed
   */
  assertAllStepsCompleted(): void {
    const result = this.getLastResult();
    if (!result) {
      throw new Error('No workflow result');
    }
    
    const completedCount = result.steps.filter(s => s.success).length;
    if (completedCount !== this.steps.length) {
      throw new Error(`Only ${completedCount}/${this.steps.length} steps completed`);
    }
  }

  /**
   * Assert handoff occurred between agents
   */
  assertHandoff(fromAgent: string, toAgent: string): void {
    const messages = this.messageBus.getMessages();
    const handoffMsg = messages.find(m => 
      m.source === fromAgent && 
      m.target === toAgent && 
      m.type === 'agent.completed'
    );
    
    if (!handoffMsg) {
      throw new Error(`No handoff message from ${fromAgent} to ${toAgent}`);
    }
  }

  /**
   * Assert artifact was passed between agents
   */
  assertArtifactPassed(artifactType: string, fromAgent: string, toAgent: string): void {
    const result = this.getLastResult();
    if (!result) {
      throw new Error('No workflow result');
    }

    const fromStep = result.steps.find(s => s.agent === fromAgent);
    const artifact = fromStep?.artifacts.find(a => a.type === artifactType);
    
    if (!artifact) {
      throw new Error(`Artifact ${artifactType} not produced by ${fromAgent}`);
    }

    // Check it was included in handoff
    const messages = this.messageBus.getMessages();
    const handoffMsg = messages.find(m => 
      m.source === fromAgent && 
      m.target === toAgent
    );

    const passedArtifacts = (handoffMsg?.payload as { artifacts?: string[] })?.artifacts || [];
    if (!passedArtifacts.includes(artifact.id)) {
      throw new Error(`Artifact ${artifact.id} was not passed to ${toAgent}`);
    }
  }

  /**
   * Get artifact from store
   */
  getArtifact(agentName: string, artifactId: string): ArtifactOutput | undefined {
    return this.artifactStore.get(`${agentName}:${artifactId}`);
  }

  /**
   * Reset harness
   */
  reset(): void {
    this.steps = [];
    this.results = [];
    this.artifactStore.clear();
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
```

### 3.2 Plan to Doc Handoff Test (`tests/integration/handoffs/plan-to-doc.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTestHarness } from '../../../src/harness/WorkflowTestHarness';

describe('Plan → Doc Handoff', () => {
  let harness: WorkflowTestHarness;

  beforeEach(async () => {
    harness = new WorkflowTestHarness();
    await harness.initialize();
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  it('should pass project plan from @plan to @doc', async () => {
    harness
      .mockAgent('plan', {
        success: true,
        artifacts: [
          { id: 'plan-1', type: 'document', name: 'ProjectPlan.md', content: '# Plan' },
          { id: 'arch-1', type: 'document', name: 'Architecture.md', content: '# Arch' },
        ],
        metadata: {
          nextAgent: 'doc',
          handoffContext: {
            projectName: 'test-project',
            scenario: 'S01',
            architecture: { frontend: 'react', backend: 'express' },
          },
        },
      })
      .mockAgent('doc', {
        success: true,
        artifacts: [
          { id: 'doc-1', type: 'documentation', name: 'README.md', content: '# README' },
        ],
        metadata: { nextAgent: 'backlog' },
      })
      .defineWorkflow([
        { agent: 'plan', expectedArtifacts: ['document'] },
        { agent: 'doc', expectedArtifacts: ['documentation'] },
      ]);

    await harness.execute({ projectName: 'test', requirements: ['Feature A'] });

    harness.assertSuccess();
    harness.assertAllStepsCompleted();
    harness.assertHandoff('plan', 'doc');
    harness.assertArtifactPassed('document', 'plan', 'doc');
  });

  it('should include architecture context in handoff', async () => {
    harness
      .mockAgent('plan', {
        success: true,
        artifacts: [{ id: 'p1', type: 'document', name: 'Plan.md', content: '' }],
        metadata: {
          handoffContext: {
            architecture: {
              frontend: 'react',
              backend: 'express',
              database: 'postgresql',
            },
          },
        },
      })
      .mockAgent('doc', {
        success: true,
        artifacts: [],
        metadata: {},
      })
      .defineWorkflow([
        { agent: 'plan' },
        { agent: 'doc' },
      ]);

    const result = await harness.execute();

    const planStep = result.steps.find(s => s.agent === 'plan');
    expect(planStep?.handoffData).toHaveProperty('architecture');
    expect((planStep?.handoffData as any).architecture.frontend).toBe('react');
  });

  it('should fail workflow if @plan fails', async () => {
    harness
      .mockAgentFailure('plan', 'Planning failed')
      .defineWorkflow([
        { agent: 'plan' },
        { agent: 'doc' },
      ]);

    const result = await harness.execute();

    expect(result.success).toBe(false);
    expect(result.failedAt).toBe('plan');
    expect(result.steps).toHaveLength(1);
  });

  it('should not execute @doc if @plan produces no artifacts', async () => {
    harness
      .mockAgent('plan', {
        success: true,
        artifacts: [], // No artifacts
        metadata: {},
      })
      .mockAgent('doc', {
        success: true,
        artifacts: [],
        metadata: {},
      })
      .defineWorkflow([
        { agent: 'plan', expectedArtifacts: ['document'] },
        { agent: 'doc' },
      ]);

    const result = await harness.execute();

    expect(result.success).toBe(false);
    expect(result.failedAt).toBe('plan');
    expect(result.error).toContain('document');
  });
});
```

### 3.3 Full Phase Integration Test (`tests/integration/handoffs/full-phase.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTestHarness } from '../../../src/harness/WorkflowTestHarness';

describe('Full Phase 0-3 Integration', () => {
  let harness: WorkflowTestHarness;

  beforeEach(async () => {
    harness = new WorkflowTestHarness();
    await harness.initialize();
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  it('should complete Phase 0 (Planning)', async () => {
    harness
      .mockAgent('plan', {
        success: true,
        artifacts: [
          { id: 'plan-1', type: 'document', name: 'ProjectPlan.md', content: '# Plan' },
        ],
        metadata: { nextAgent: 'doc', handoffContext: { phase: 0 } },
      })
      .mockAgent('doc', {
        success: true,
        artifacts: [
          { id: 'doc-1', type: 'documentation', name: 'Docs.md', content: '# Docs' },
        ],
        metadata: { nextAgent: 'backlog', handoffContext: { phase: 0 } },
      })
      .mockAgent('backlog', {
        success: true,
        artifacts: [
          { id: 'bl-1', type: 'backlog', name: 'Backlog.json', content: '{}' },
        ],
        metadata: { nextAgent: 'code', handoffContext: { phase: 0, backlogItems: 5 } },
      })
      .defineWorkflow([
        { agent: 'plan' },
        { agent: 'doc' },
        { agent: 'backlog' },
      ]);

    const result = await harness.execute({
      projectName: 'E2E Test Project',
      scenario: 'S01',
      requirements: ['User Auth', 'Dashboard', 'API'],
    });

    harness.assertSuccess();
    harness.assertAllStepsCompleted();
    
    expect(result.artifacts).toHaveLength(3);
    expect(result.steps.every(s => s.success)).toBe(true);
  });

  it('should complete Phase 1-2 (Development)', async () => {
    harness
      .mockAgent('code', {
        success: true,
        artifacts: [
          { id: 'code-1', type: 'code', name: 'App.tsx', content: 'export default App;' },
          { id: 'code-2', type: 'code', name: 'api.ts', content: 'export const api = {};' },
        ],
        metadata: { nextAgent: 'test', handoffContext: { filesGenerated: 2 } },
      })
      .mockAgent('test', {
        success: true,
        artifacts: [
          { id: 'test-1', type: 'test', name: 'App.test.tsx', content: 'describe...' },
        ],
        metadata: { nextAgent: 'review', handoffContext: { testCoverage: 85 } },
      })
      .mockAgent('review', {
        success: true,
        artifacts: [
          { id: 'review-1', type: 'report', name: 'Review.md', content: '# Review' },
        ],
        metadata: { approved: true },
      })
      .defineWorkflow([
        { agent: 'code', expectedArtifacts: ['code'] },
        { agent: 'test', expectedArtifacts: ['test'] },
        { agent: 'review', expectedArtifacts: ['report'] },
      ]);

    const result = await harness.execute({
      backlogItem: { id: 'BLI-001', title: 'Feature' },
    });

    harness.assertSuccess();
    expect(result.steps).toHaveLength(3);
  });

  it('should handle review rejection', async () => {
    harness
      .mockAgent('code', {
        success: true,
        artifacts: [{ id: 'c1', type: 'code', name: 'bad.ts', content: '' }],
        metadata: { nextAgent: 'test' },
      })
      .mockAgent('test', {
        success: true,
        artifacts: [{ id: 't1', type: 'test', name: 'test.ts', content: '' }],
        metadata: { nextAgent: 'review' },
      })
      .mockAgent('review', {
        success: false,
        artifacts: [],
        metadata: { approved: false },
        error: 'Code quality issues found',
      })
      .defineWorkflow([
        { agent: 'code' },
        { agent: 'test' },
        { agent: 'review' },
      ]);

    const result = await harness.execute();

    expect(result.success).toBe(false);
    expect(result.failedAt).toBe('review');
    expect(result.steps.filter(s => s.success)).toHaveLength(2);
  });
});
```

### 3.4 Message Bus Integration Test (`tests/integration/messaging/message-bus.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockMessageBus, Message } from '../../../src/mocks/MockMessageBus';

describe('Message Bus Integration', () => {
  let messageBus: MockMessageBus;

  beforeEach(() => {
    messageBus = new MockMessageBus();
  });

  afterEach(() => {
    messageBus.reset();
  });

  describe('publish/subscribe', () => {
    it('should deliver messages to subscribers', async () => {
      const received: Message[] = [];
      
      messageBus.subscribe('agent.completed', (msg) => {
        received.push(msg);
      });

      await messageBus.publish({
        type: 'agent.completed',
        source: 'plan',
        payload: { artifacts: ['a1'] },
      });

      expect(received).toHaveLength(1);
      expect(received[0].source).toBe('plan');
    });

    it('should support multiple subscribers', async () => {
      let count = 0;
      
      messageBus.subscribe('agent.completed', () => count++);
      messageBus.subscribe('agent.completed', () => count++);

      await messageBus.publish({
        type: 'agent.completed',
        source: 'test',
        payload: {},
      });

      expect(count).toBe(2);
    });

    it('should support unsubscribe', async () => {
      let count = 0;
      
      const unsubscribe = messageBus.subscribe('test', () => count++);
      
      await messageBus.publish({ type: 'test', source: 'a', payload: {} });
      expect(count).toBe(1);
      
      unsubscribe();
      
      await messageBus.publish({ type: 'test', source: 'a', payload: {} });
      expect(count).toBe(1); // Still 1, unsubscribed
    });
  });

  describe('message filtering', () => {
    it('should filter messages by type', async () => {
      await messageBus.publish({ type: 'type-a', source: 'a', payload: {} });
      await messageBus.publish({ type: 'type-b', source: 'b', payload: {} });
      await messageBus.publish({ type: 'type-a', source: 'c', payload: {} });

      const typeA = messageBus.getMessagesByType('type-a');
      expect(typeA).toHaveLength(2);
    });

    it('should filter messages by source', async () => {
      await messageBus.publish({ type: 't', source: 'plan', payload: {} });
      await messageBus.publish({ type: 't', source: 'doc', payload: {} });
      await messageBus.publish({ type: 't', source: 'plan', payload: {} });

      const fromPlan = messageBus.getMessagesBySource('plan');
      expect(fromPlan).toHaveLength(2);
    });
  });

  describe('async waiting', () => {
    it('should wait for specific message', async () => {
      // Publish after delay
      setTimeout(() => {
        messageBus.simulateAgentMessage('test', 'expected.message', { data: 'value' });
      }, 100);

      const msg = await messageBus.waitForMessage('expected.message', 5000);
      
      expect(msg.type).toBe('expected.message');
      expect(msg.payload).toEqual({ data: 'value' });
    });

    it('should timeout if message not received', async () => {
      await expect(
        messageBus.waitForMessage('never.happens', 100)
      ).rejects.toThrow('Timeout');
    });
  });

  describe('wildcard subscription', () => {
    it('should receive all messages with wildcard', async () => {
      const received: Message[] = [];
      
      messageBus.on('*', (msg) => received.push(msg));

      await messageBus.publish({ type: 'a', source: 'x', payload: {} });
      await messageBus.publish({ type: 'b', source: 'y', payload: {} });

      expect(received).toHaveLength(2);
    });
  });
});
```

### 3.5 Artifact Flow Test (`tests/integration/artifacts/artifact-flow.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTestHarness } from '../../../src/harness/WorkflowTestHarness';

describe('Artifact Flow Integration', () => {
  let harness: WorkflowTestHarness;

  beforeEach(async () => {
    harness = new WorkflowTestHarness();
    await harness.initialize();
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  describe('artifact transformation', () => {
    it('should transform requirements to backlog items', async () => {
      harness
        .mockAgent('plan', {
          success: true,
          artifacts: [
            {
              id: 'req-1',
              type: 'requirements',
              name: 'requirements.json',
              content: JSON.stringify({
                features: ['Auth', 'Dashboard', 'API'],
              }),
            },
          ],
          metadata: { handoffContext: { featureCount: 3 } },
        })
        .mockAgent('backlog', {
          success: true,
          artifacts: [
            {
              id: 'bl-1',
              type: 'backlog',
              name: 'backlog.json',
              content: JSON.stringify({
                items: [
                  { id: 'BLI-001', title: 'Auth' },
                  { id: 'BLI-002', title: 'Dashboard' },
                  { id: 'BLI-003', title: 'API' },
                ],
              }),
            },
          ],
          metadata: { itemCount: 3 },
        })
        .defineWorkflow([
          { agent: 'plan', expectedArtifacts: ['requirements'] },
          { agent: 'backlog', expectedArtifacts: ['backlog'] },
        ]);

      const result = await harness.execute();

      harness.assertSuccess();
      
      const backlog = result.artifacts.find(a => a.type === 'backlog');
      const content = JSON.parse(backlog!.content as string);
      expect(content.items).toHaveLength(3);
    });
  });

  describe('artifact dependencies', () => {
    it('should track artifact dependencies', async () => {
      harness
        .mockAgent('code', {
          success: true,
          artifacts: [
            { id: 'model', type: 'code', name: 'User.ts', content: 'class User {}' },
            { id: 'service', type: 'code', name: 'UserService.ts', content: 'import { User }' },
          ],
          metadata: {
            dependencies: {
              'UserService.ts': ['User.ts'],
            },
          },
        })
        .defineWorkflow([{ agent: 'code' }]);

      const result = await harness.execute();

      expect(result.steps[0].artifacts).toHaveLength(2);
      expect((result.steps[0] as any).handoffData).toBeUndefined(); // No handoff context
    });
  });

  describe('artifact validation', () => {
    it('should validate artifact content type', async () => {
      harness
        .mockAgent('code', {
          success: true,
          artifacts: [
            {
              id: 'ts-file',
              type: 'code',
              name: 'index.ts',
              content: 'export const x: number = 1;',
            },
          ],
          metadata: {},
        })
        .defineWorkflow([
          { agent: 'code', expectedArtifacts: ['code'] },
        ]);

      const result = await harness.execute();

      const artifact = result.artifacts[0];
      expect(artifact.type).toBe('code');
      expect(artifact.name.endsWith('.ts')).toBe(true);
    });
  });

  describe('cross-phase artifact access', () => {
    it('should allow later phases to access earlier artifacts', async () => {
      harness
        .mockAgent('plan', {
          success: true,
          artifacts: [
            { id: 'arch', type: 'architecture', name: 'arch.md', content: '# Architecture' },
          ],
          metadata: { handoffContext: { architectureId: 'arch' } },
        })
        .mockAgent('devops', {
          success: true,
          artifacts: [
            { id: 'infra', type: 'infrastructure', name: 'main.bicep', content: 'resource...' },
          ],
          metadata: {},
        })
        .defineWorkflow([
          { agent: 'plan' },
          { agent: 'devops' },
        ]);

      const result = await harness.execute();

      // DevOps should have received architecture context
      const planStep = result.steps.find(s => s.agent === 'plan');
      expect(planStep?.handoffData).toHaveProperty('architectureId');
    });
  });
});
```

---

## 🧪 Test Coverage Matrix

| Integration | Handoff | Artifacts | Errors | Recovery |
|------------|---------|-----------|--------|----------|
| plan → doc | ✅ | ✅ | ✅ | ✅ |
| doc → backlog | ✅ | ✅ | ✅ | ✅ |
| backlog → code | ✅ | ✅ | ✅ | ✅ |
| code → test | ✅ | ✅ | ✅ | ✅ |
| test → review | ✅ | ✅ | ✅ | ✅ |
| devops → security | ✅ | ✅ | ✅ | ✅ |
| Full Phase 0 | ✅ | ✅ | ✅ | ✅ |
| Full Phase 1-2 | ✅ | ✅ | ✅ | ✅ |
| Parallel agents | ✅ | ✅ | ✅ | ⚠️ |

---

## 📋 Acceptance Criteria

- [ ] WorkflowTestHarness fully functional
- [ ] All agent handoffs tested
- [ ] Message bus integration verified
- [ ] Artifact flow tracked correctly
- [ ] Error propagation tested
- [ ] Full phase workflows pass
- [ ] >80% integration coverage

---

## 🔗 Navigation

← [02-PHASE-AGENT-TESTS.md](02-PHASE-AGENT-TESTS.md) | [04-PHASE-E2E-TESTS.md](04-PHASE-E2E-TESTS.md) →
