import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BaseAgent } from '../core/BaseAgent.js';

describe('BaseAgent', () => {
  it('should create agent with definition', async () => {
    const definition = {
      id: 'test-agent',
      name: 'Test Agent',
      version: '1.0.0',
      type: 'task',
      inputs: {
        type: 'object',
        required: ['input'],
        properties: {
          input: { type: 'string' }
        }
      },
      outputs: {
        type: 'object',
        required: ['output'],
        properties: {
          output: { type: 'string' }
        }
      }
    };

    const agent = new BaseAgent(definition);
    assert.strictEqual(agent.id, 'test-agent');
    assert.strictEqual(agent.name, 'Test Agent');
    assert.strictEqual(agent.state, 'idle');
  });

  it('should validate input against schema', async () => {
    const definition = {
      id: 'test-agent',
      name: 'Test Agent',
      version: '1.0.0',
      type: 'task',
      inputs: {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 }
        }
      }
    };

    const agent = new BaseAgent(definition);

    // Valid input
    const validResult = agent.validateInput({ name: 'John', age: 30 });
    assert.strictEqual(validResult.valid, true);

    // Invalid input - missing required field
    const invalidResult1 = agent.validateInput({ name: 'John' });
    assert.strictEqual(invalidResult1.valid, false);

    // Invalid input - wrong type
    const invalidResult2 = agent.validateInput({ name: 'John', age: 'thirty' });
    assert.strictEqual(invalidResult2.valid, false);
  });

  it('should initialize agent', async () => {
    const definition = {
      id: 'test-agent',
      name: 'Test Agent',
      version: '1.0.0',
      type: 'task'
    };

    const agent = new BaseAgent(definition);
    await agent.initialize();
    
    assert.strictEqual(agent.state, 'ready');
  });

  it('should get agent status', async () => {
    const definition = {
      id: 'test-agent',
      name: 'Test Agent',
      version: '1.0.0',
      type: 'task'
    };

    const agent = new BaseAgent(definition);
    const status = agent.getStatus();

    assert.strictEqual(status.id, 'test-agent');
    assert.strictEqual(status.name, 'Test Agent');
    assert.strictEqual(status.state, 'idle');
    assert.strictEqual(status.executionCount, 0);
  });

  it('should track execution history', async () => {
    class TestAgent extends BaseAgent {
      async _onExecute(input) {
        return { result: input.value * 2 };
      }
    }

    const definition = {
      id: 'test-agent',
      name: 'Test Agent',
      version: '1.0.0',
      type: 'task',
      inputs: {
        type: 'object',
        properties: { value: { type: 'number' } }
      },
      outputs: {
        type: 'object',
        properties: { result: { type: 'number' } }
      }
    };

    const agent = new TestAgent(definition);
    await agent.initialize();
    await agent.execute({ value: 5 });

    const history = agent.getExecutionHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].status, 'success');
    assert.deepStrictEqual(history[0].output, { result: 10 });
  });

  it('should handle execution timeout', async () => {
    class SlowAgent extends BaseAgent {
      async _onExecute() {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { result: 'done' };
      }
    }

    const definition = {
      id: 'slow-agent',
      name: 'Slow Agent',
      version: '1.0.0',
      type: 'task',
      timeout: 100
    };

    const agent = new SlowAgent(definition);
    await agent.initialize();

    await assert.rejects(
      agent.execute({}),
      /timeout/i
    );
  });

  it('should retry on failure', async () => {
    let attemptCount = 0;

    class FailingAgent extends BaseAgent {
      async _onExecute() {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return { result: 'success' };
      }
    }

    const definition = {
      id: 'failing-agent',
      name: 'Failing Agent',
      version: '1.0.0',
      type: 'task',
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 10
      },
      outputs: {
        type: 'object',
        properties: { result: { type: 'string' } }
      }
    };

    const agent = new FailingAgent(definition);
    await agent.initialize();

    const result = await agent.execute({});
    assert.strictEqual(attemptCount, 3);
    assert.deepStrictEqual(result, { result: 'success' });
  });
});
