import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { WorkflowEngine } from '../core/WorkflowEngine.js';
import { AgentRegistry } from '../core/AgentRegistry.js';
import { BaseAgent } from '../core/BaseAgent.js';

// Mock agents for testing
class MockAgent extends BaseAgent {
  constructor(id, executeFunc) {
    const definition = {
      id,
      name: `Mock Agent ${id}`,
      version: '1.0.0',
      type: 'task',
      inputs: { type: 'object' },
      outputs: { type: 'object' }
    };
    super(definition);
    this.executeFunc = executeFunc;
  }

  async _onExecute(input) {
    if (this.executeFunc) {
      return await this.executeFunc(input);
    }
    return { result: 'ok', input };
  }
}

describe('WorkflowEngine', () => {
  let registry;
  let workflowEngine;

  before(async () => {
    // Initial setup
  });

  after(async () => {
    // Final cleanup
  });

  it('should register and retrieve workflow', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    
    const agent = new MockAgent('test-agent');
    await agent.initialize();
    registry.register(agent);

    const workflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      version: '1.0.0',
      steps: [
        { id: 'step1', agentId: 'test-agent', inputs: {} }
      ]
    };

    workflowEngine.registerWorkflow(workflow);
    assert.strictEqual(workflowEngine.workflows.has('test-workflow'), true);

    await registry.clear();
  });

  it('should execute simple workflow with single step', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    
    const agent = new MockAgent('agent1', (input) => {
      return { value: input.value * 2 };
    });
    
    await agent.initialize();
    registry.register(agent);

    const workflow = {
      id: 'simple-workflow',
      name: 'Simple Workflow',
      version: '1.0.0',
      steps: [
        {
          id: 'double',
          agentId: 'agent1',
          inputs: { value: '$input.value' }
        }
      ],
      outputs: {
        result: '$steps.double.output.value'
      }
    };

    workflowEngine.registerWorkflow(workflow);
    const result = await workflowEngine.execute('simple-workflow', { value: 5 });

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.outputs.result, 10);

    await registry.clear();
  });

  it('should execute workflow with multiple steps in dependency order', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    
    const executionOrder = [];

    const agent1 = new MockAgent('agent1', async (input) => {
      executionOrder.push('agent1');
      return { value: 10 };
    });

    const agent2 = new MockAgent('agent2', async (input) => {
      executionOrder.push('agent2');
      return { value: input.value + 5 };
    });

    const agent3 = new MockAgent('agent3', async (input) => {
      executionOrder.push('agent3');
      return { value: input.value * 2 };
    });

    await agent1.initialize();
    await agent2.initialize();
    await agent3.initialize();
    
    registry.register(agent1);
    registry.register(agent2);
    registry.register(agent3);

    const workflow = {
      id: 'multi-step',
      name: 'Multi-step Workflow',
      version: '1.0.0',
      steps: [
        {
          id: 'step1',
          agentId: 'agent1',
          inputs: {}
        },
        {
          id: 'step2',
          agentId: 'agent2',
          dependsOn: ['step1'],
          inputs: { value: '$steps.step1.output.value' }
        },
        {
          id: 'step3',
          agentId: 'agent3',
          dependsOn: ['step2'],
          inputs: { value: '$steps.step2.output.value' }
        }
      ],
      outputs: {
        final: '$steps.step3.output.value'
      }
    };

    workflowEngine.registerWorkflow(workflow);
    const result = await workflowEngine.execute('multi-step', {});

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.outputs.final, 30); // (10 + 5) * 2
    assert.deepStrictEqual(executionOrder, ['agent1', 'agent2', 'agent3']);

    await registry.clear();
  });

  it('should skip step with false condition', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    
    const executionOrder = [];

    const agent1 = new MockAgent('cond-agent1', async () => {
      executionOrder.push('agent1');
      return { shouldContinue: false };
    });

    const agent2 = new MockAgent('cond-agent2', async () => {
      executionOrder.push('agent2');
      return { value: 'executed' };
    });

    await agent1.initialize();
    await agent2.initialize();
    
    registry.register(agent1);
    registry.register(agent2);

    const workflow = {
      id: 'conditional',
      name: 'Conditional Workflow',
      version: '1.0.0',
      steps: [
        {
          id: 'check',
          agentId: 'cond-agent1',
          inputs: {}
        },
        {
          id: 'conditional-step',
          agentId: 'cond-agent2',
          dependsOn: ['check'],
          condition: '$steps.check.output.shouldContinue === true',
          inputs: {}
        }
      ]
    };

    workflowEngine.registerWorkflow(workflow);
    const result = await workflowEngine.execute('conditional', {});

    assert.strictEqual(result.status, 'completed');
    assert.deepStrictEqual(executionOrder, ['agent1']); // agent2 should be skipped

    await registry.clear();
  });

  it('should handle step failure with stop strategy', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    const failingAgent = new MockAgent('failing-agent', async () => {
      throw new Error('Intentional failure');
    });

    await failingAgent.initialize();
    registry.register(failingAgent);

    const workflow = {
      id: 'failing-workflow',
      name: 'Failing Workflow',
      version: '1.0.0',
      steps: [
        {
          id: 'fail',
          agentId: 'failing-agent',
          inputs: {},
          onError: 'stop'
        }
      ],
      errorHandling: {
        strategy: 'stop'
      }
    };

    workflowEngine.registerWorkflow(workflow);

    await assert.rejects(
      workflowEngine.execute('failing-workflow', {}),
      /Intentional failure/
    );

    await registry.clear();
  });

  it('should retry failed step', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    
    let attemptCount = 0;

    const retryAgent = new MockAgent('retry-agent', async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Temporary failure');
      }
      return { success: true };
    });

    await retryAgent.initialize();
    registry.register(retryAgent);

    const workflow = {
      id: 'retry-workflow',
      name: 'Retry Workflow',
      version: '1.0.0',
      steps: [
        {
          id: 'retry-step',
          agentId: 'retry-agent',
          inputs: {},
          retry: {
            maxRetries: 3,
            backoffMs: 10
          }
        }
      ]
    };

    workflowEngine.registerWorkflow(workflow);
    const result = await workflowEngine.execute('retry-workflow', {});

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(attemptCount, 3);

    await registry.clear();
  });

  it('should detect circular dependencies', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    
    const agent = new MockAgent('circular-agent');
    await agent.initialize();
    registry.register(agent);

    const workflow = {
      id: 'circular',
      name: 'Circular Workflow',
      version: '1.0.0',
      steps: [
        {
          id: 'step1',
          agentId: 'circular-agent',
          dependsOn: ['step2'],
          inputs: {}
        },
        {
          id: 'step2',
          agentId: 'circular-agent',
          dependsOn: ['step1'],
          inputs: {}
        }
      ]
    };

    workflowEngine.registerWorkflow(workflow);

    await assert.rejects(
      workflowEngine.execute('circular', {}),
      /circular dependency/i
    );

    await registry.clear();
  });

  it('should aggregate outputs from multiple steps', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    
    const agent1 = new MockAgent('output1', async () => ({ name: 'Alice' }));
    const agent2 = new MockAgent('output2', async () => ({ age: 30 }));
    const agent3 = new MockAgent('output3', async () => ({ city: 'Seattle' }));

    await agent1.initialize();
    await agent2.initialize();
    await agent3.initialize();
    
    registry.register(agent1);
    registry.register(agent2);
    registry.register(agent3);

    const workflow = {
      id: 'aggregate',
      name: 'Output Aggregation',
      version: '1.0.0',
      steps: [
        { id: 'get-name', agentId: 'output1', inputs: {} },
        { id: 'get-age', agentId: 'output2', inputs: {} },
        { id: 'get-city', agentId: 'output3', inputs: {} }
      ],
      outputs: {
        name: '$steps.get-name.output.name',
        age: '$steps.get-age.output.age',
        city: '$steps.get-city.output.city'
      }
    };

    workflowEngine.registerWorkflow(workflow);
    const result = await workflowEngine.execute('aggregate', {});

    assert.strictEqual(result.outputs.name, 'Alice');
    assert.strictEqual(result.outputs.age, 30);
    assert.strictEqual(result.outputs.city, 'Seattle');

    await registry.clear();
  });

  it('should track workflow execution state', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    const agent = new MockAgent('track-agent', async (input) => {
      return { processed: true };
    });

    await agent.initialize();
    registry.register(agent);

    const workflow = {
      id: 'tracked',
      name: 'Tracked Workflow',
      version: '1.0.0',
      steps: [
        { id: 'process', agentId: 'track-agent', inputs: { data: 'test' } }
      ]
    };

    workflowEngine.registerWorkflow(workflow);
    const result = await workflowEngine.execute('tracked', {});

    // Get execution details
    const execution = workflowEngine.getExecution(result.executionId);
    
    assert.strictEqual(execution.status, 'completed');
    assert.strictEqual(execution.stepResults.length, 1);
    assert.strictEqual(execution.stepResults[0].status, 'success');
    assert.strictEqual(execution.stepResults[0].stepId, 'process');

    await registry.clear();
  });

  it('should list all workflow executions', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);
    
    const agent = new MockAgent('list-agent');
    await agent.initialize();
    registry.register(agent);

    const workflow = {
      id: 'list-test',
      name: 'List Test',
      version: '1.0.0',
      steps: [
        { id: 'step', agentId: 'list-agent', inputs: {} }
      ]
    };

    workflowEngine.registerWorkflow(workflow);
    
    // Execute multiple times
    await workflowEngine.execute('list-test', {});
    await workflowEngine.execute('list-test', {});

    const executions = workflowEngine.listExecutions('list-test');
    assert.strictEqual(executions.length >= 2, true);

    await registry.clear();
  });

  it('should continue workflow when a non-critical step fails with continue strategy', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);

    const executionOrder = [];

    const agent1 = new MockAgent('continue-agent1', async () => {
      executionOrder.push('agent1');
      return { value: 10 };
    });

    const failingAgent = new MockAgent('continue-fail', async () => {
      executionOrder.push('fail');
      throw new Error('Non-critical failure');
    });

    const agent3 = new MockAgent('continue-agent3', async (input) => {
      executionOrder.push('agent3');
      return { value: input.value + 1 };
    });

    await agent1.initialize();
    await failingAgent.initialize();
    await agent3.initialize();

    registry.register(agent1);
    registry.register(failingAgent);
    registry.register(agent3);

    const workflow = {
      id: 'continue-workflow',
      name: 'Continue Workflow',
      version: '1.0.0',
      steps: [
        { id: 'step1', agentId: 'continue-agent1', inputs: {} },
        { id: 'optional', agentId: 'continue-fail', inputs: {}, onError: 'continue' },
        {
          id: 'step3',
          agentId: 'continue-agent3',
          dependsOn: ['step1'],
          inputs: { value: '$steps.step1.output.value' }
        }
      ],
      outputs: {
        final: '$steps.step3.output.value'
      }
    };

    workflowEngine.registerWorkflow(workflow);
    const result = await workflowEngine.execute('continue-workflow', {});

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.outputs.final, 11);
    assert.strictEqual(executionOrder[0], 'agent1');
    assert.strictEqual(executionOrder[executionOrder.length - 1], 'agent3');
    assert.ok(executionOrder.includes('fail'));

    const execution = workflowEngine.getExecution(result.executionId);
    const optionalStep = execution.stepResults.find(r => r.stepId === 'optional');
    assert.strictEqual(optionalStep.status, 'failed');

    await registry.clear();
  });

  it('should record skipped step results and fail dependencies with skipped message', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);

    const agent1 = new MockAgent('skip-agent1', async () => ({ shouldRun: false }));
    const agent2 = new MockAgent('skip-agent2', async () => ({ ran: true }));

    await agent1.initialize();
    await agent2.initialize();

    registry.register(agent1);
    registry.register(agent2);

    const workflow = {
      id: 'skip-tracking',
      name: 'Skip Tracking',
      version: '1.0.0',
      steps: [
        { id: 'check', agentId: 'skip-agent1', inputs: {} },
        {
          id: 'conditional',
          agentId: 'skip-agent2',
          dependsOn: ['check'],
          condition: '$steps.check.output.shouldRun === true',
          inputs: {}
        },
        {
          id: 'downstream',
          agentId: 'skip-agent2',
          dependsOn: ['conditional'],
          inputs: {}
        }
      ]
    };

    workflowEngine.registerWorkflow(workflow);

    await assert.rejects(
      workflowEngine.execute('skip-tracking', {}),
      /skipped/i
    );

    const executionIds = Array.from(workflowEngine.executions.keys());
    assert.strictEqual(executionIds.length, 1);
    const execution = workflowEngine.getExecution(executionIds[0]);

    const conditionalStep = execution.stepResults.find(r => r.stepId === 'conditional');
    assert.strictEqual(conditionalStep.status, 'skipped');
    assert.strictEqual(conditionalStep.reason, 'condition');

    await registry.clear();
  });

  it('should throw when querying a non-existent execution id', async () => {
    registry = new AgentRegistry();
    workflowEngine = new WorkflowEngine(registry);

    assert.throws(
      () => workflowEngine.getExecution('does-not-exist'),
      /not found/i
    );
  });
});
