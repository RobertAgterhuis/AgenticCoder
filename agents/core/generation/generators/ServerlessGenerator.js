/**
 * ServerlessGenerator - Azure Functions & Serverless Code Generator
 * 
 * Generates Azure Functions, Durable Functions, host configurations,
 * and related serverless artifacts.
 */

const BaseGenerator = require('./BaseGenerator');

class ServerlessGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'ServerlessGenerator',
      framework: 'azure-functions',
      version: '4.x',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'architecture/serverless';
    this.supportedTypes = ['function', 'durableFunction', 'host', 'local.settings'];
  }

  /**
   * Generate an Azure Function
   */
  async generateFunction(context) {
    const { 
      name, 
      trigger,
      bindings = [],
      authLevel = 'function',
      route
    } = context;
    
    const funcName = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      funcName,
      fileName,
      trigger: this.buildTrigger(trigger),
      inputBindings: bindings.filter(b => b.direction === 'in'),
      outputBindings: bindings.filter(b => b.direction === 'out'),
      authLevel,
      route: route || fileName,
      hasInputBindings: bindings.some(b => b.direction === 'in'),
      hasOutputBindings: bindings.some(b => b.direction === 'out')
    };
    
    return this.generateFunctionCode(templateData);
  }

  /**
   * Generate a Durable Function orchestration
   */
  async generateDurableFunction(context) {
    const { 
      name, 
      type = 'orchestrator',
      activities = [],
      subOrchestrations = [],
      retryPolicy
    } = context;
    
    const funcName = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      funcName,
      fileName,
      type,
      activities: this.buildActivities(activities),
      subOrchestrations,
      retryPolicy: this.buildRetryPolicy(retryPolicy),
      hasActivities: activities.length > 0,
      hasSubOrchestrations: subOrchestrations.length > 0,
      hasRetryPolicy: retryPolicy !== undefined
    };
    
    switch (type) {
      case 'orchestrator':
        return this.generateOrchestratorCode(templateData);
      case 'activity':
        return this.generateActivityCode(templateData);
      case 'client':
        return this.generateClientCode(templateData);
      case 'entity':
        return this.generateEntityCode(templateData);
      default:
        return this.generateOrchestratorCode(templateData);
    }
  }

  /**
   * Generate host.json configuration
   */
  async generateHost(context) {
    const { 
      version = '2.0',
      extensions = {},
      logging = {},
      functionTimeout = '00:05:00',
      healthMonitor = true
    } = context;
    
    const host = {
      version,
      logging: {
        applicationInsights: {
          samplingSettings: {
            isEnabled: true,
            excludedTypes: 'Request'
          }
        },
        ...logging
      },
      extensionBundle: {
        id: 'Microsoft.Azure.Functions.ExtensionBundle',
        version: '[4.*, 5.0.0)'
      },
      extensions: this.buildExtensions(extensions),
      functionTimeout
    };
    
    if (healthMonitor) {
      host.healthMonitor = {
        enabled: true,
        healthCheckInterval: '00:00:10',
        healthCheckWindow: '00:02:00',
        healthCheckThreshold: 6,
        counterThreshold: 0.80
      };
    }
    
    return JSON.stringify(host, null, 2);
  }

  /**
   * Generate local.settings.json
   */
  async generateLocalSettings(context) {
    const { 
      runtime = 'node',
      values = {},
      connectionStrings = {}
    } = context;
    
    const settings = {
      IsEncrypted: false,
      Values: {
        AzureWebJobsStorage: 'UseDevelopmentStorage=true',
        FUNCTIONS_WORKER_RUNTIME: runtime,
        ...values
      }
    };
    
    if (Object.keys(connectionStrings).length > 0) {
      settings.ConnectionStrings = connectionStrings;
    }
    
    return JSON.stringify(settings, null, 2);
  }

  // Code generation methods
  generateFunctionCode(data) {
    const lines = [];
    
    lines.push(`import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';`);
    
    if (data.hasInputBindings || data.hasOutputBindings) {
      lines.push(`import { input, output } from '@azure/functions';`);
    }
    
    lines.push('');
    
    // Input bindings
    for (const binding of data.inputBindings) {
      lines.push(this.generateBinding(binding, 'input'));
    }
    
    // Output bindings
    for (const binding of data.outputBindings) {
      lines.push(this.generateBinding(binding, 'output'));
    }
    
    // Function handler
    const triggerType = data.trigger.type;
    const handlerParams = this.getHandlerParams(triggerType);
    
    lines.push(`export async function ${data.funcName}(${handlerParams}): Promise<${this.getReturnType(triggerType)}> {`);
    lines.push(`    context.log('${data.funcName} function processed a request.');`);
    lines.push('');
    lines.push(this.getTriggerBody(data.trigger));
    lines.push('}');
    lines.push('');
    
    // App registration
    lines.push(this.getAppRegistration(data));
    
    return lines.join('\n');
  }

  generateOrchestratorCode(data) {
    const lines = [];
    
    lines.push(`import * as df from 'durable-functions';`);
    lines.push(`import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';`);
    lines.push('');
    
    lines.push(`const ${data.funcName}: OrchestrationHandler = function* (context: OrchestrationContext) {`);
    lines.push('    const outputs: any[] = [];');
    lines.push('');
    
    if (data.hasRetryPolicy) {
      lines.push('    const retryOptions = new df.RetryOptions(');
      lines.push(`        ${data.retryPolicy.firstRetryInterval || 5000},`);
      lines.push(`        ${data.retryPolicy.maxNumberOfAttempts || 3}`);
      lines.push('    );');
      if (data.retryPolicy.backoffCoefficient) {
        lines.push(`    retryOptions.backoffCoefficient = ${data.retryPolicy.backoffCoefficient};`);
      }
      lines.push('');
    }
    
    for (const activity of data.activities) {
      if (data.hasRetryPolicy) {
        lines.push(`    outputs.push(yield context.df.callActivityWithRetry('${activity.name}', retryOptions, ${activity.input || 'null'}));`);
      } else {
        lines.push(`    outputs.push(yield context.df.callActivity('${activity.name}', ${activity.input || 'null'}));`);
      }
    }
    
    lines.push('');
    lines.push('    return outputs;');
    lines.push('};');
    lines.push('');
    lines.push(`df.app.orchestration('${data.funcName}', ${data.funcName});`);
    
    return lines.join('\n');
  }

  generateActivityCode(data) {
    const lines = [];
    
    lines.push(`import * as df from 'durable-functions';`);
    lines.push(`import { ActivityHandler } from 'durable-functions';`);
    lines.push('');
    
    lines.push(`const ${data.funcName}: ActivityHandler = (input: any): any => {`);
    lines.push(`    // TODO: Implement activity logic`);
    lines.push('    return `Hello ${input}`;');
    lines.push('};');
    lines.push('');
    lines.push(`df.app.activity('${data.funcName}', { handler: ${data.funcName} });`);
    
    return lines.join('\n');
  }

  generateClientCode(data) {
    const lines = [];
    
    lines.push(`import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';`);
    lines.push(`import * as df from 'durable-functions';`);
    lines.push('');
    
    lines.push(`export async function ${data.funcName}(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {`);
    lines.push('    const client = df.getClient(context);');
    lines.push(`    const instanceId = await client.startNew('${data.funcName}Orchestrator', { input: await request.json() });`);
    lines.push('');
    lines.push(`    context.log(\`Started orchestration with ID = '\${instanceId}'.\`);`);
    lines.push('');
    lines.push('    return client.createCheckStatusResponse(request, instanceId);');
    lines.push('};');
    lines.push('');
    lines.push(`app.http('${data.funcName}', {`);
    lines.push(`    route: '${data.fileName}',`);
    lines.push('    extraInputs: [df.input.durableClient()],');
    lines.push(`    handler: ${data.funcName}`);
    lines.push('});');
    
    return lines.join('\n');
  }

  generateEntityCode(data) {
    const lines = [];
    
    lines.push(`import * as df from 'durable-functions';`);
    lines.push(`import { EntityContext, EntityHandler } from 'durable-functions';`);
    lines.push('');
    
    lines.push(`interface ${data.funcName}State {`);
    lines.push('    value: number;');
    lines.push('}');
    lines.push('');
    
    lines.push(`const ${data.funcName}: EntityHandler<${data.funcName}State> = (context: EntityContext<${data.funcName}State>) => {`);
    lines.push('    const currentValue = context.df.getState(() => ({ value: 0 }));');
    lines.push('');
    lines.push('    switch (context.df.operationName) {');
    lines.push("        case 'add':");
    lines.push('            currentValue.value += context.df.getInput<number>() ?? 0;');
    lines.push('            break;');
    lines.push("        case 'reset':");
    lines.push('            currentValue.value = 0;');
    lines.push('            break;');
    lines.push("        case 'get':");
    lines.push('            context.df.return(currentValue.value);');
    lines.push('            break;');
    lines.push('    }');
    lines.push('');
    lines.push('    context.df.setState(currentValue);');
    lines.push('};');
    lines.push('');
    lines.push(`df.app.entity('${data.funcName}', ${data.funcName});`);
    
    return lines.join('\n');
  }

  // Helper methods
  buildTrigger(trigger) {
    if (typeof trigger === 'string') {
      return { type: trigger };
    }
    return {
      type: trigger.type || 'http',
      ...trigger
    };
  }

  buildActivities(activities) {
    return activities.map(a => ({
      name: a.name || a,
      input: a.input
    }));
  }

  buildRetryPolicy(retryPolicy) {
    if (!retryPolicy) return null;
    return {
      firstRetryInterval: retryPolicy.firstRetryInterval || 5000,
      maxNumberOfAttempts: retryPolicy.maxNumberOfAttempts || 3,
      backoffCoefficient: retryPolicy.backoffCoefficient || 2
    };
  }

  buildExtensions(extensions) {
    const result = {};
    
    if (extensions.http) {
      result.http = {
        routePrefix: extensions.http.routePrefix || 'api',
        maxOutstandingRequests: extensions.http.maxOutstandingRequests || 200,
        maxConcurrentRequests: extensions.http.maxConcurrentRequests || 100
      };
    }
    
    if (extensions.durableTask) {
      result.durableTask = {
        hubName: extensions.durableTask.hubName || 'DurableFunctionsHub',
        storageProvider: {
          connectionStringName: extensions.durableTask.connectionStringName || 'AzureWebJobsStorage'
        }
      };
    }
    
    if (extensions.cosmosDb) {
      result.cosmosDb = {
        connectionMode: extensions.cosmosDb.connectionMode || 'Gateway',
        protocol: extensions.cosmosDb.protocol || 'Https'
      };
    }
    
    return result;
  }

  generateBinding(binding, direction) {
    const type = binding.type;
    const name = binding.name || `${type}Binding`;
    
    switch (type) {
      case 'cosmosDB':
        return `const ${name} = ${direction}.cosmosDB({\n    databaseName: '${binding.databaseName}',\n    containerName: '${binding.containerName}',\n    connection: '${binding.connection}'\n});\n`;
      case 'blob':
        return `const ${name} = ${direction}.storageBlob({\n    path: '${binding.path}',\n    connection: '${binding.connection}'\n});\n`;
      case 'queue':
        return `const ${name} = ${direction}.storageQueue({\n    queueName: '${binding.queueName}',\n    connection: '${binding.connection}'\n});\n`;
      case 'serviceBus':
        return `const ${name} = ${direction}.serviceBusQueue({\n    queueName: '${binding.queueName}',\n    connection: '${binding.connection}'\n});\n`;
      default:
        return `// ${direction} binding: ${type}\n`;
    }
  }

  getHandlerParams(triggerType) {
    switch (triggerType) {
      case 'http':
        return 'request: HttpRequest, context: InvocationContext';
      case 'timer':
        return 'timer: Timer, context: InvocationContext';
      case 'queue':
        return 'message: unknown, context: InvocationContext';
      case 'blob':
        return 'blob: Buffer, context: InvocationContext';
      case 'cosmosDB':
        return 'documents: unknown[], context: InvocationContext';
      case 'eventHub':
        return 'messages: unknown[], context: InvocationContext';
      case 'serviceBus':
        return 'message: unknown, context: InvocationContext';
      default:
        return 'request: HttpRequest, context: InvocationContext';
    }
  }

  getReturnType(triggerType) {
    switch (triggerType) {
      case 'http':
        return 'HttpResponseInit';
      default:
        return 'void';
    }
  }

  getTriggerBody(trigger) {
    switch (trigger.type) {
      case 'http':
        return `    const name = request.query.get('name') || (await request.json() as any)?.name || 'World';
    
    return {
        status: 200,
        jsonBody: { message: \`Hello, \${name}!\` }
    };`;
      case 'timer':
        return `    context.log('Timer function ran at: ' + new Date().toISOString());`;
      case 'queue':
        return `    context.log('Queue trigger processed message:', message);`;
      case 'blob':
        return `    context.log('Blob trigger processed blob of size:', blob.length);`;
      case 'cosmosDB':
        return `    context.log('CosmosDB trigger processed ' + documents.length + ' documents');`;
      default:
        return `    // TODO: Implement function logic`;
    }
  }

  getAppRegistration(data) {
    const trigger = data.trigger;
    
    switch (trigger.type) {
      case 'http':
        return `app.http('${data.funcName}', {
    methods: ['GET', 'POST'],
    authLevel: '${data.authLevel}',
    route: '${data.route}',
    handler: ${data.funcName}
});`;
      case 'timer':
        return `app.timer('${data.funcName}', {
    schedule: '${trigger.schedule || '0 */5 * * * *'}',
    handler: ${data.funcName}
});`;
      case 'queue':
        return `app.storageQueue('${data.funcName}', {
    queueName: '${trigger.queueName}',
    connection: '${trigger.connection || 'AzureWebJobsStorage'}',
    handler: ${data.funcName}
});`;
      case 'blob':
        return `app.storageBlob('${data.funcName}', {
    path: '${trigger.path}',
    connection: '${trigger.connection || 'AzureWebJobsStorage'}',
    handler: ${data.funcName}
});`;
      case 'cosmosDB':
        return `app.cosmosDB('${data.funcName}', {
    connection: '${trigger.connection}',
    databaseName: '${trigger.databaseName}',
    containerName: '${trigger.containerName}',
    createLeaseContainerIfNotExists: true,
    handler: ${data.funcName}
});`;
      case 'eventHub':
        return `app.eventHub('${data.funcName}', {
    connection: '${trigger.connection}',
    eventHubName: '${trigger.eventHubName}',
    cardinality: 'many',
    handler: ${data.funcName}
});`;
      case 'serviceBus':
        return `app.serviceBusQueue('${data.funcName}', {
    connection: '${trigger.connection}',
    queueName: '${trigger.queueName}',
    handler: ${data.funcName}
});`;
      default:
        return `app.http('${data.funcName}', { handler: ${data.funcName} });`;
    }
  }
}

module.exports = ServerlessGenerator;
