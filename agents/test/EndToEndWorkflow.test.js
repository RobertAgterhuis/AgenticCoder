import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

import { AgentRegistry } from '../core/AgentRegistry.js';
import { WorkflowEngine } from '../core/WorkflowEngine.js';

import { TaskExtractionAgent } from '../task/TaskExtractionAgent.js';
import { ResourceAnalyzerAgent } from '../infrastructure/ResourceAnalyzerAgent.js';
import { CostEstimatorAgent } from '../infrastructure/CostEstimatorAgent.js';

describe('End-to-end workflow (offline)', () => {
  const realDateNow = Date.now;
  const realMathRandom = Math.random;

  before(() => {
    // Make ResourceAnalyzerAgent deterministic (it uses Date.now + Math.random).
    Date.now = () => 1700000000000;
    Math.random = () => 0.123456789;

    // Ensure we do not accidentally enable MCP probing.
    delete process.env.AGENTICCODER_TOOL_TRANSPORT;
    delete process.env.AGENTICCODER_ENABLE_HTTP_MCP_PROBES;
  });

  after(() => {
    Date.now = realDateNow;
    Math.random = realMathRandom;
  });

  it('runs TaskExtraction -> ResourceAnalyzer -> CostEstimator without live servers', async () => {
    const registry = new AgentRegistry();
    const workflowEngine = new WorkflowEngine(registry);

    const taskAgent = new TaskExtractionAgent();
    const resourceAgent = new ResourceAnalyzerAgent();
    const costAgent = new CostEstimatorAgent();

    await taskAgent.initialize();
    await resourceAgent.initialize();
    await costAgent.initialize();

    // Force offline fallback pricing (avoid any HTTP attempts).
    costAgent.mcpClients.delete('azure-pricing');

    registry.register(taskAgent);
    registry.register(resourceAgent);
    registry.register(costAgent);

    const workflow = {
      id: 'e2e-offline',
      name: 'E2E Offline Workflow',
      version: '1.0.0',
      steps: [
        {
          id: 'extract',
          agentId: 'task-extraction',
          inputs: {
            userRequest: '$input.userRequest'
          }
        },
        {
          id: 'analyze',
          agentId: 'resource-analyzer',
          dependsOn: ['extract'],
          inputs: {
            tasks: '$steps.extract.output.tasks',
            constraints: '$input.constraints'
          }
        },
        {
          id: 'estimate',
          agentId: 'cost-estimator',
          dependsOn: ['analyze'],
          inputs: {
            resources: '$steps.analyze.output.resources',
            timeframe: 'monthly',
            currency: 'USD'
          }
        }
      ],
      outputs: {
        tasks: '$steps.extract.output.tasks',
        resources: '$steps.analyze.output.resources',
        totalCost: '$steps.estimate.output.totalCost',
        breakdown: '$steps.estimate.output.breakdown'
      }
    };

    workflowEngine.registerWorkflow(workflow);

    const result = await workflowEngine.execute(
      'e2e-offline',
      {
        userRequest:
          'Deploy an Azure Function App with storage in westeurope with monitoring and security requirements',
        constraints: {
          region: 'westeurope'
        }
      },
      { startTime: Date.now() }
    );

    assert.strictEqual(result.status, 'completed');

    assert.ok(Array.isArray(result.outputs.tasks));
    assert.ok(result.outputs.tasks.length >= 1);

    assert.ok(Array.isArray(result.outputs.resources));
    assert.strictEqual(result.outputs.resources.length, 5);

    const types = new Set(result.outputs.resources.map(r => r.type));
    assert.ok(types.has('Microsoft.Web/serverfarms'));
    assert.ok(types.has('Microsoft.Web/sites'));
    assert.ok(types.has('Microsoft.Storage/storageAccounts'));
    assert.ok(types.has('Microsoft.OperationalInsights/workspaces'));
    assert.ok(types.has('Microsoft.KeyVault/vaults'));

    assert.strictEqual(typeof result.outputs.totalCost, 'number');
    assert.ok(result.outputs.totalCost > 0);

    assert.ok(Array.isArray(result.outputs.breakdown));
    assert.strictEqual(result.outputs.breakdown.length, 5);

    // Deterministic total: serverfarms (13.14) + function (0.20) + storage (1.84) + logs (2.76) + kv (0.03)
    // Note: serverfarms pricing added with DynamicResourceAnalyzer update
    assert.ok(result.outputs.totalCost > 4);

    await registry.clear();
  });
});
