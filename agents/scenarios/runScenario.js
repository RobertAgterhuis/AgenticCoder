import fs from 'node:fs/promises';
import path from 'node:path';

import { AgentRegistry } from '../core/AgentRegistry.js';
import { WorkflowEngine } from '../core/WorkflowEngine.js';

import { TaskExtractionAgent } from '../task/TaskExtractionAgent.js';
import { ResourceAnalyzerAgent } from '../infrastructure/ResourceAnalyzerAgent.js';
import { CostEstimatorAgent } from '../infrastructure/CostEstimatorAgent.js';
import { DeploymentPlannerAgent } from '../infrastructure/DeploymentPlannerAgent.js';
import { ValidationAgent } from '../validation/ValidationAgent.js';

export async function loadScenarioFromFile(scenarioPath) {
  const content = await fs.readFile(scenarioPath, 'utf8');
  const data = JSON.parse(content);

  if (!data?.id || !data?.userRequest) {
    throw new Error('Invalid scenario file: expected at least { id, userRequest }');
  }

  return data;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, obj) {
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function createWorkflowDefinition() {
  return {
    id: 'scenario-runner',
    name: 'Scenario Runner Workflow',
    version: '1.0.0',
    description: 'Extraction → analysis → costing → planning → validation',
    steps: [
      {
        id: 'extract',
        agentId: 'task-extraction',
        description: 'Extract structured tasks from user request',
        inputs: {
          userRequest: '$input.userRequest'
        }
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
          deploymentName: 'agenticcoder-scenario',
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
          maxRetries: 1,
          backoffMs: 500
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
      strategy: 'stop'
    }
  };
}

export async function runScenario({
  scenario,
  scenarioPath,
  outDir,
  offline = true
}) {
  if (!scenario) {
    throw new Error('runScenario requires a scenario object');
  }
  if (!outDir) {
    throw new Error('runScenario requires outDir');
  }

  await ensureDir(outDir);

  const registry = new AgentRegistry();
  const workflowEngine = new WorkflowEngine(registry);

  const taskAgent = new TaskExtractionAgent();
  const resourceAgent = new ResourceAnalyzerAgent();
  const costAgent = new CostEstimatorAgent();
  const deployAgent = new DeploymentPlannerAgent();
  const validationAgent = new ValidationAgent();

  const agents = [taskAgent, resourceAgent, costAgent, deployAgent, validationAgent];
  let execResult;
  let execution;
  const startedAt = new Date().toISOString();

  try {
    for (const agent of agents) {
      await agent.initialize();
      registry.register(agent);
    }

    if (offline) {
      costAgent.mcpClients?.delete?.('azure-pricing');
    }

    const workflow = createWorkflowDefinition();
    workflowEngine.registerWorkflow(workflow);

    execResult = await workflowEngine.execute('scenario-runner', {
      userRequest: scenario.userRequest,
      constraints: scenario.constraints || {}
    });

    execution = workflowEngine.getExecution(execResult.executionId);
  } finally {
    // Always cleanup to avoid leaving MCP stdio child processes running (which will keep Node alive).
    for (const agent of agents.slice().reverse()) {
      try {
        await agent.cleanup();
      } catch {
        // best-effort
      }
    }
  }

  const stepResultsById = new Map(execution.stepResults.map((r) => [r.stepId, r]));

  const extractOut = stepResultsById.get('extract')?.output;
  const analyzeOut = stepResultsById.get('analyze')?.output;
  const estimateOut = stepResultsById.get('estimate')?.output;
  const planOut = stepResultsById.get('plan')?.output;
  const validateOut = stepResultsById.get('validate')?.output;

  const derivedOutputs = {
    tasks: extractOut?.tasks || [],
    resources: analyzeOut?.resources || [],
    costEstimate: estimateOut
      ? {
          total: estimateOut.totalCost,
          breakdown: estimateOut.breakdown,
          recommendations: estimateOut.recommendations
        }
      : null,
    deploymentPlan: planOut
      ? {
          template: planOut.template,
          parameters: planOut.parameters,
          script: planOut.deploymentScript
        }
      : null,
    validationResult: validateOut
      ? {
          isValid: validateOut.isValid,
          summary: validateOut.summary,
          issues: validateOut.validationResults
        }
      : null
  };

  const manifest = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: execution.status,
    durationMs: execution.duration,
    offline
  };

  await writeJson(path.join(outDir, 'manifest.json'), manifest);

  if (scenarioPath) {
    const scenarioOutPath = path.join(outDir, 'scenario.json');
    await fs.copyFile(scenarioPath, scenarioOutPath);
  } else {
    await writeJson(path.join(outDir, 'scenario.json'), scenario);
  }

  await writeJson(path.join(outDir, 'workflow-result.json'), {
    status: execution.status,
    duration: execution.duration,
    stepResults: execution.stepResults,
    outputs: derivedOutputs
  });

  await writeJson(path.join(outDir, 'tasks.json'), derivedOutputs.tasks);
  await writeJson(path.join(outDir, 'resources.json'), derivedOutputs.resources);
  await writeJson(path.join(outDir, 'cost-estimate.json'), derivedOutputs.costEstimate);
  await writeJson(path.join(outDir, 'validation.json'), derivedOutputs.validationResult);

  await fs.writeFile(path.join(outDir, 'template.bicep'), derivedOutputs.deploymentPlan?.template || '', 'utf8');
  await writeJson(path.join(outDir, 'parameters.json'), derivedOutputs.deploymentPlan?.parameters || {});
  await fs.writeFile(path.join(outDir, 'deploy.sh'), derivedOutputs.deploymentPlan?.script || '', 'utf8');

  return {
    executionId: execResult.executionId,
    status: execution.status,
    duration: execution.duration,
    outputs: derivedOutputs
  };
}
