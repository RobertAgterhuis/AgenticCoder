import { AgentRegistry } from '../core/AgentRegistry.js';
import { WorkflowEngine } from '../core/WorkflowEngine.js';
import { TaskExtractionAgent } from '../task/TaskExtractionAgent.js';
import { ResourceAnalyzerAgent } from '../infrastructure/ResourceAnalyzerAgent.js';
import { CostEstimatorAgent } from '../infrastructure/CostEstimatorAgent.js';

/**
 * Simple example demonstrating the agent framework
 * Executes a workflow to analyze and estimate costs for an Azure deployment
 */

async function main() {
  console.log('=== AgenticCoder Agent Framework Demo ===\n');

  // Create registry and workflow engine
  const registry = new AgentRegistry();
  const workflowEngine = new WorkflowEngine(registry);

  // Register agents
  console.log('Registering agents...');
  const taskAgent = new TaskExtractionAgent();
  const resourceAgent = new ResourceAnalyzerAgent();
  const costAgent = new CostEstimatorAgent();

  await taskAgent.initialize();
  await resourceAgent.initialize();
  await costAgent.initialize();

  registry.register(taskAgent);
  registry.register(resourceAgent);
  registry.register(costAgent);

  console.log(`Registered ${registry.getAll().length} agents\n`);

  // Define workflow
  const workflow = {
    id: 'simple-deployment',
    name: 'Simple Azure Deployment',
    version: '1.0.0',
    steps: [
      {
        id: 'extract',
        agentId: 'task-extraction',
        inputs: {}
      },
      {
        id: 'analyze',
        agentId: 'resource-analyzer',
        dependsOn: ['extract'],
        inputs: {
          tasks: '$steps.extract.output.tasks'
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
      cost: '$steps.estimate.output.totalCost',
      breakdown: '$steps.estimate.output.breakdown'
    }
  };

  workflowEngine.registerWorkflow(workflow);

  // Execute workflow
  console.log('Executing workflow...\n');
  
  const userRequest = 'Deploy an Azure Function App with storage in West Europe for a payment processing system';
  
  try {
    const result = await workflowEngine.execute('simple-deployment', {
      userRequest,
      constraints: {
        region: 'westeurope',
        budget: 500
      }
    });

    console.log('\n=== Workflow Results ===');
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`\nExtracted Tasks: ${result.outputs.tasks?.length || 0}`);
    console.log(`Identified Resources: ${result.outputs.resources?.length || 0}`);
    console.log(`Estimated Monthly Cost: $${result.outputs.cost?.toFixed(2) || '0.00'}`);
    
    if (result.outputs.breakdown) {
      console.log('\n=== Cost Breakdown ===');
      for (const item of result.outputs.breakdown) {
        console.log(`  ${item.resourceType} (${item.sku}): $${item.cost.toFixed(2)}`);
      }
    }

  } catch (error) {
    console.error('Workflow failed:', error.message);
  }

  // Cleanup
  console.log('\n=== Cleanup ===');
  await registry.clear();
  console.log('All agents cleaned up');
}

// Run example
main().catch(console.error);
