import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AgentRegistry } from '../core/AgentRegistry.js';
import { BaseAgent } from '../core/BaseAgent.js';

class MockAgent extends BaseAgent {
  async _onExecute(input) {
    return { result: 'ok' };
  }
}

describe('AgentRegistry', () => {
  it('should register an agent', async () => {
    const registry = new AgentRegistry();
    const definition = {
      id: 'test-agent',
      name: 'Test Agent',
      version: '1.0.0',
      type: 'task'
    };

    const agent = new MockAgent(definition);
    registry.register(agent);

    assert.strictEqual(registry.has('test-agent'), true);
    assert.strictEqual(registry.get('test-agent'), agent);
  });

  it('should throw error when registering duplicate agent', async () => {
    const registry = new AgentRegistry();
    const definition = {
      id: 'test-agent',
      name: 'Test Agent',
      version: '1.0.0',
      type: 'task'
    };

    const agent1 = new MockAgent(definition);
    const agent2 = new MockAgent(definition);

    registry.register(agent1);
    
    assert.throws(
      () => registry.register(agent2),
      /already registered/
    );
  });

  it('should unregister an agent', async () => {
    const registry = new AgentRegistry();
    const definition = {
      id: 'test-agent',
      name: 'Test Agent',
      version: '1.0.0',
      type: 'task'
    };

    const agent = new MockAgent(definition);
    await agent.initialize();
    registry.register(agent);

    await registry.unregister('test-agent');
    assert.strictEqual(registry.has('test-agent'), false);
  });

  it('should find agents by type', async () => {
    const registry = new AgentRegistry();
    
    const taskAgent = new MockAgent({
      id: 'task-1',
      name: 'Task Agent',
      version: '1.0.0',
      type: 'task'
    });

    const infraAgent = new MockAgent({
      id: 'infra-1',
      name: 'Infra Agent',
      version: '1.0.0',
      type: 'infrastructure'
    });

    registry.register(taskAgent);
    registry.register(infraAgent);

    const taskAgents = registry.findByType('task');
    assert.strictEqual(taskAgents.length, 1);
    assert.strictEqual(taskAgents[0].id, 'task-1');
  });

  it('should get all agents', async () => {
    const registry = new AgentRegistry();
    
    const agent1 = new MockAgent({ id: 'agent-1', name: 'Agent 1', version: '1.0.0', type: 'task' });
    const agent2 = new MockAgent({ id: 'agent-2', name: 'Agent 2', version: '1.0.0', type: 'task' });

    registry.register(agent1);
    registry.register(agent2);

    const allAgents = registry.getAll();
    assert.strictEqual(allAgents.length, 2);
  });

  it('should resolve dependencies', async () => {
    const registry = new AgentRegistry();

    const agent1 = new MockAgent({
      id: 'agent-1',
      name: 'Agent 1',
      version: '1.0.0',
      type: 'task'
    });

    const agent2 = new MockAgent({
      id: 'agent-2',
      name: 'Agent 2',
      version: '1.0.0',
      type: 'task',
      dependencies: ['agent-1']
    });

    const agent3 = new MockAgent({
      id: 'agent-3',
      name: 'Agent 3',
      version: '1.0.0',
      type: 'task',
      dependencies: ['agent-2']
    });

    registry.register(agent1);
    registry.register(agent2);
    registry.register(agent3);

    const order = registry.resolveDependencies('agent-3');
    assert.deepStrictEqual(order, ['agent-1', 'agent-2', 'agent-3']);
  });

  it('should detect circular dependencies', async () => {
    const registry = new AgentRegistry();

    const agent1 = new MockAgent({
      id: 'agent-1',
      name: 'Agent 1',
      version: '1.0.0',
      type: 'task',
      dependencies: ['agent-2']
    });

    const agent2 = new MockAgent({
      id: 'agent-2',
      name: 'Agent 2',
      version: '1.0.0',
      type: 'task',
      dependencies: ['agent-1']
    });

    registry.register(agent1);
    registry.register(agent2);

    assert.throws(
      () => registry.resolveDependencies('agent-1'),
      /circular dependency/i
    );
  });

  it('should get registry stats', async () => {
    const registry = new AgentRegistry();
    
    registry.register(new MockAgent({ id: 'task-1', name: 'Task 1', version: '1.0.0', type: 'task' }));
    registry.register(new MockAgent({ id: 'task-2', name: 'Task 2', version: '1.0.0', type: 'task' }));
    registry.register(new MockAgent({ id: 'infra-1', name: 'Infra 1', version: '1.0.0', type: 'infrastructure' }));

    const stats = registry.getStats();
    assert.strictEqual(stats.totalAgents, 3);
    assert.strictEqual(stats.agentsByType.task, 2);
    assert.strictEqual(stats.agentsByType.infrastructure, 1);
  });
});
