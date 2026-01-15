import { BaseAgent } from '../core/BaseAgent.js';

/**
 * TaskExtractionAgent - Parses user requests into structured tasks
 * Extracts intent, entities, and requirements from natural language
 */
export class TaskExtractionAgent extends BaseAgent {
  constructor() {
    const definition = {
      id: 'task-extraction',
      name: 'Task Extraction Agent',
      version: '1.0.0',
      type: 'task',
      description: 'Extracts structured tasks from user requests',
      inputs: {
        type: 'object',
        required: ['userRequest'],
        properties: {
          userRequest: {
            type: 'string',
            description: 'Natural language user request'
          },
          context: {
            type: 'object',
            description: 'Additional context (project, environment, etc.)'
          }
        }
      },
      outputs: {
        type: 'object',
        required: ['tasks', 'intent'],
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                requirements: { type: 'array', items: { type: 'string' } },
                dependencies: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          intent: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              target: { type: 'string' },
              constraints: { type: 'object' }
            }
          },
          entities: {
            type: 'object',
            description: 'Extracted entities (services, regions, etc.)'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1
          }
        }
      },
      timeout: 10000
    };

    super(definition);
  }

  async _onExecute(input, context, executionId) {
    const { userRequest, context: userContext = {} } = input;

    // Parse user request (simplified - in production, use NLP/LLM)
    const tasks = this._extractTasks(userRequest);
    const intent = this._extractIntent(userRequest);
    const entities = this._extractEntities(userRequest);
    const confidence = this._calculateConfidence(tasks, intent, entities);

    return {
      tasks,
      intent,
      entities,
      confidence,
      metadata: {
        executionId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - context.startTime
      }
    };
  }

  _extractTasks(userRequest) {
    // Simplified task extraction - in production, use LLM
    const tasks = [];
    const lowerRequest = userRequest.toLowerCase();

    // Pattern matching for common Azure operations
    const patterns = [
      { regex: /create|deploy|provision/i, type: 'deployment', action: 'create' },
      { regex: /update|modify|change/i, type: 'update', action: 'update' },
      { regex: /delete|remove|destroy/i, type: 'cleanup', action: 'delete' },
      { regex: /analyze|evaluate|assess/i, type: 'analysis', action: 'analyze' },
      { regex: /migrate|move|transfer/i, type: 'migration', action: 'migrate' }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(userRequest)) {
        tasks.push({
          id: `task-${tasks.length + 1}`,
          description: userRequest,
          type: pattern.type,
          action: pattern.action,
          priority: 'medium',
          requirements: this._extractRequirements(userRequest),
          dependencies: []
        });
      }
    }

    if (tasks.length === 0) {
      tasks.push({
        id: 'task-1',
        description: userRequest,
        type: 'generic',
        action: 'execute',
        priority: 'medium',
        requirements: [],
        dependencies: []
      });
    }

    return tasks;
  }

  _extractIntent(userRequest) {
    const lowerRequest = userRequest.toLowerCase();
    
    let action = 'unknown';
    if (/create|deploy|provision/i.test(userRequest)) action = 'create';
    else if (/update|modify/i.test(userRequest)) action = 'update';
    else if (/delete|remove/i.test(userRequest)) action = 'delete';
    else if (/analyze|evaluate/i.test(userRequest)) action = 'analyze';
    else if (/migrate/i.test(userRequest)) action = 'migrate';

    let target = 'unknown';
    const azureServices = ['vm', 'storage', 'function', 'app service', 'sql', 'cosmos', 'aks'];
    for (const service of azureServices) {
      if (lowerRequest.includes(service)) {
        target = service;
        break;
      }
    }

    return {
      action,
      target,
      constraints: this._extractConstraints(userRequest)
    };
  }

  _extractEntities(userRequest) {
    const entities = {};

    // Extract regions
    const regions = ['eastus', 'westus', 'westeurope', 'eastasia', 'southeastasia'];
    for (const region of regions) {
      if (userRequest.toLowerCase().includes(region)) {
        entities.region = region;
        break;
      }
    }

    // Extract resource names (simple pattern: words with hyphens/underscores)
    const resourceNameMatch = userRequest.match(/[a-z0-9][-a-z0-9_]+/gi);
    if (resourceNameMatch) {
      entities.potentialResourceNames = resourceNameMatch;
    }

    // Extract SKUs/sizes
    const skuMatch = userRequest.match(/\b(Standard_[A-Z0-9]+|Basic|Premium|Free)\b/gi);
    if (skuMatch) {
      entities.sku = skuMatch[0];
    }

    return entities;
  }

  _extractRequirements(userRequest) {
    const requirements = [];
    const lowerRequest = userRequest.toLowerCase();

    if (lowerRequest.includes('high availability')) requirements.push('High Availability');
    if (lowerRequest.includes('backup')) requirements.push('Backup Strategy');
    if (lowerRequest.includes('secure') || lowerRequest.includes('security')) requirements.push('Security');
    if (lowerRequest.includes('scale') || lowerRequest.includes('autoscale')) requirements.push('Scalability');
    if (lowerRequest.includes('monitor')) requirements.push('Monitoring');

    return requirements;
  }

  _extractConstraints(userRequest) {
    const constraints = {};
    const lowerRequest = userRequest.toLowerCase();

    // Extract budget constraints
    const budgetMatch = userRequest.match(/\$(\d+)/);
    if (budgetMatch) {
      constraints.budget = parseInt(budgetMatch[1]);
    }

    // Extract time constraints
    const timeMatch = userRequest.match(/(\d+)\s*(day|week|month|hour)/i);
    if (timeMatch) {
      constraints.timeframe = {
        value: parseInt(timeMatch[1]),
        unit: timeMatch[2].toLowerCase()
      };
    }

    return constraints;
  }

  _calculateConfidence(tasks, intent, entities) {
    let score = 0;
    
    // Task extraction confidence
    if (tasks.length > 0) score += 0.3;
    
    // Intent confidence
    if (intent.action !== 'unknown') score += 0.3;
    if (intent.target !== 'unknown') score += 0.2;
    
    // Entity confidence
    if (Object.keys(entities).length > 0) score += 0.2;

    return Math.min(score, 1.0);
  }
}
