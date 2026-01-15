import { AgentRegistry } from '../core/AgentRegistry.js';
import { WorkflowEngine } from '../core/WorkflowEngine.js';
import { messageBus } from '../core/MessageBus.js';
import { TaskExtractionAgent } from '../task/TaskExtractionAgent.js';
import { ResourceAnalyzerAgent } from '../infrastructure/ResourceAnalyzerAgent.js';
import { CostEstimatorAgent } from '../infrastructure/CostEstimatorAgent.js';
import { DeploymentPlannerAgent } from '../infrastructure/DeploymentPlannerAgent.js';
import { ValidationAgent } from '../validation/ValidationAgent.js';

/**
 * Complete workflow example with all 5 agents
 * Demonstrates full deployment pipeline from user request to validated template
 */

async function main() {
  console.log('=== AgenticCoder Complete Workflow Demo ===\n');

  // Create registry and workflow engine
  const registry = new AgentRegistry();
  const workflowEngine = new WorkflowEngine(registry);

  // Set up message bus subscriptions for observability
  messageBus.subscribe('logger', ['workflow.*', 'agent.*'], (message) => {
    console.log(`[MessageBus] ${message.topic}:`, message.payload || message.type);
  });

  // Register all agents
  console.log('Registering agents...');
  const agents = [
    new TaskExtractionAgent(),
    new ResourceAnalyzerAgent(),
    new CostEstimatorAgent(),
    new DeploymentPlannerAgent(),
    new ValidationAgent()
  ];

  for (const agent of agents) {
    await agent.initialize();
    registry.register(agent);
    
    // Set up agent event listeners
    agent.on('execution', (data) => {
      messageBus.publish(`agent.${agent.id}.execution`, {
        type: 'event',
        payload: { status: 'completed', duration: data.duration }
      });
    });
  }

  console.log(`Registered ${registry.getAll().length} agents\n`);

  // Define complete workflow
  const workflow = {
    id: 'complete-deployment',
    name: 'Complete Azure Deployment Workflow',
    version: '1.0.0',
    description: 'Full pipeline: extraction → analysis → costing → planning → validation',
    steps: [
      {
        id: 'extract',
        agentId: 'task-extraction',
        description: 'Extract structured tasks from user request',
        inputs: {}
      },
      {
        id: 'analyze',
        agentId: 'resource-analyzer',
        description: 'Analyze required Azure resources',
        dependsOn: ['extract'],
        inputs: {
          tasks: '$steps.extract.output.tasks',
          constraints: '$input.constraints'
        }
      },
      {
        id: 'estimate',
        agentId: 'cost-estimator',
        description: 'Estimate deployment costs',
        dependsOn: ['analyze'],
        inputs: {
          resources: '$steps.analyze.output.resources',
          timeframe: 'monthly',
          currency: 'USD'
        },
        condition: '$steps.analyze.output.resources.length > 0'
      },
      {
        id: 'plan',
        agentId: 'deployment-planner',
        description: 'Generate deployment templates',
        dependsOn: ['analyze', 'estimate'],
        inputs: {
          resources: '$steps.analyze.output.resources',
          templateFormat: 'bicep',
          deploymentName: 'agenticcoder-demo',
          parameterize: true
        }
      },
      {
        id: 'validate',
        agentId: 'validation',
        description: 'Validate deployment configuration',
        dependsOn: ['plan'],
        inputs: {
          resources: '$steps.analyze.output.resources',
          template: '$steps.plan.output.template',
          complianceFramework: 'azure-security-benchmark'
        },
        retry: {
          maxRetries: 2,
          backoffMs: 1000
        },
        onError: 'stop'
      }
    ],
    outputs: {
      tasks: '$steps.extract.output.tasks',
      resources: '$steps.analyze.output.resources',
      costEstimate: {
        total: '$steps.estimate.output.totalCost',
        breakdown: '$steps.estimate.output.breakdown',
        recommendations: '$steps.estimate.output.recommendations'
      },
      deploymentPlan: {
        template: '$steps.plan.output.template',
        parameters: '$steps.plan.output.parameters',
        script: '$steps.plan.output.deploymentScript'
      },
      validationResult: {
        isValid: '$steps.validate.output.isValid',
        summary: '$steps.validate.output.summary',
        issues: '$steps.validate.output.validationResults'
      }
    },
    errorHandling: {
      strategy: 'stop',
      onError: {
        notify: true,
        rollback: false
      }
    }
  };

  workflowEngine.registerWorkflow(workflow);

  // Set up workflow event listeners
  workflowEngine.on('workflow:start', (data) => {
    console.log(`\n🚀 Workflow started: ${data.workflowId}`);
  });

  workflowEngine.on('step:start', (data) => {
    console.log(`  ⏳ Starting step: ${data.stepId}`);
  });

  workflowEngine.on('step:complete', (data) => {
    console.log(`  ✅ Completed step: ${data.stepId}`);
  });

  workflowEngine.on('workflow:complete', (data) => {
    console.log(`\n🎉 Workflow completed in ${data.duration}ms`);
  });

  // Execute workflow with real user request
  console.log('Executing complete workflow...\n');
  
  const userRequest = `Deploy a production-ready Azure Function App in West Europe with the following requirements:
- Function runtime: Node.js 20
- Storage account for function data
- Application Insights for monitoring
- Key Vault for secrets management
- Budget: $200/month
- High availability required
- HTTPS only
- Managed identity enabled`;

  try {
    const result = await workflowEngine.execute('complete-deployment', {
      userRequest,
      constraints: {
        region: 'westeurope',
        budget: 200,
        environment: 'production'
      }
    });

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('WORKFLOW RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n📋 Status: ${result.status}`);
    console.log(`⏱️  Duration: ${result.duration}ms`);

    // Tasks
    console.log(`\n📝 Extracted Tasks: ${result.outputs.tasks?.length || 0}`);
    if (result.outputs.tasks) {
      result.outputs.tasks.forEach((task, i) => {
        console.log(`   ${i + 1}. ${task.description} (${task.type})`);
      });
    }

    // Resources
    console.log(`\n☁️  Azure Resources: ${result.outputs.resources?.length || 0}`);
    if (result.outputs.resources) {
      result.outputs.resources.forEach((res) => {
        console.log(`   - ${res.type} (${res.sku || 'default'})`);
      });
    }

    // Cost
    if (result.outputs.costEstimate) {
      console.log(`\n💰 Estimated Cost: $${result.outputs.costEstimate.total?.toFixed(2) || '0.00'}/month`);
      if (result.outputs.costEstimate.breakdown) {
        console.log('\n   Cost Breakdown:');
        result.outputs.costEstimate.breakdown.forEach((item) => {
          console.log(`   - ${item.resourceType}: $${item.cost.toFixed(2)}`);
        });
      }
      if (result.outputs.costEstimate.recommendations?.length > 0) {
        console.log('\n   Recommendations:');
        result.outputs.costEstimate.recommendations.slice(0, 3).forEach((rec) => {
          console.log(`   • ${rec}`);
        });
      }
    }

    // Deployment Plan
    if (result.outputs.deploymentPlan) {
      console.log(`\n📦 Deployment Template: Generated (${result.outputs.deploymentPlan.template?.split('\n').length || 0} lines)`);
      console.log(`   Parameters: ${Object.keys(result.outputs.deploymentPlan.parameters || {}).length}`);
      
      // Show first few lines of template
      const templateLines = result.outputs.deploymentPlan.template?.split('\n').slice(0, 10);
      if (templateLines) {
        console.log('\n   Template Preview:');
        templateLines.forEach(line => console.log(`   ${line}`));
        console.log('   ...');
      }
    }

    // Validation
    if (result.outputs.validationResult) {
      const val = result.outputs.validationResult;
      console.log(`\n✓ Validation: ${val.isValid ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (val.summary) {
        console.log(`   Total Checks: ${val.summary.totalChecks}`);
        console.log(`   Passed: ${val.summary.passed}`);
        console.log(`   Failed: ${val.summary.failed}`);
        
        if (val.summary.criticalIssues > 0) {
          console.log(`   ⚠️  Critical Issues: ${val.summary.criticalIssues}`);
        }
        if (val.summary.highIssues > 0) {
          console.log(`   ⚠️  High Issues: ${val.summary.highIssues}`);
        }
      }

      // Show some validation issues
      if (val.issues && val.issues.length > 0) {
        const failedIssues = val.issues.filter(i => !i.passed).slice(0, 5);
        if (failedIssues.length > 0) {
          console.log('\n   Top Issues:');
          failedIssues.forEach((issue) => {
            console.log(`   ${issue.severity.toUpperCase()}: ${issue.message}`);
            if (issue.recommendation) {
              console.log(`      → ${issue.recommendation}`);
            }
          });
        }
      }
    }

    // Next steps
    console.log('\n' + '='.repeat(60));
    console.log('NEXT STEPS');
    console.log('='.repeat(60));
    console.log('1. Review generated Bicep template');
    console.log('2. Address validation issues (if any)');
    console.log('3. Adjust parameters in .bicepparam file');
    console.log('4. Run deployment script:');
    console.log('   ./deploy.ps1');
    console.log('5. Monitor deployment in Azure Portal');

    // Show message bus stats
    console.log('\n' + '='.repeat(60));
    console.log('MESSAGE BUS STATISTICS');
    console.log('='.repeat(60));
    const busStats = messageBus.getStats();
    console.log(`Total Messages: ${busStats.totalMessages}`);
    console.log(`Active Subscriptions: ${busStats.totalSubscribers}`);
    console.log(`Topics: ${busStats.totalTopics}`);

  } catch (error) {
    console.error('\n❌ Workflow failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  // Cleanup
  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP');
  console.log('='.repeat(60));
  
  messageBus.cleanup();
  await registry.clear();
  
  console.log('✓ All agents cleaned up');
  console.log('✓ Message bus cleared');
  console.log('\n✨ Demo complete!');
}

// Run example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
