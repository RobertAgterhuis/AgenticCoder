/**
 * EventDrivenGenerator - Event-Driven Architecture Generator
 * 
 * Generates event handlers, publishers, sagas, and event schemas
 * for event-driven architectures.
 */

const BaseGenerator = require('./BaseGenerator');

class EventDrivenGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'EventDrivenGenerator',
      framework: 'event-driven',
      version: 'latest',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'architecture/event-driven';
    this.supportedTypes = ['eventHandler', 'eventPublisher', 'saga', 'eventSchema'];
  }

  /**
   * Generate an event handler
   */
  async generateEventHandler(context) {
    const { 
      name, 
      events = [],
      broker = 'servicebus',
      retry = true,
      deadLetter = true
    } = context;
    
    const handlerName = this.toPascalCase(name) + 'EventHandler';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      handlerName,
      fileName,
      events: this.buildEvents(events),
      broker,
      retry: this.buildRetryConfig(retry),
      deadLetter,
      hasEvents: events.length > 0,
      imports: this.buildHandlerImports(broker)
    };
    
    return this.generateHandlerCode(templateData, broker);
  }

  /**
   * Generate an event publisher
   */
  async generateEventPublisher(context) {
    const { 
      name, 
      events = [],
      broker = 'servicebus',
      batchSize = 100
    } = context;
    
    const publisherName = this.toPascalCase(name) + 'EventPublisher';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      publisherName,
      fileName,
      events: this.buildEvents(events),
      broker,
      batchSize,
      hasEvents: events.length > 0,
      imports: this.buildPublisherImports(broker)
    };
    
    return this.generatePublisherCode(templateData, broker);
  }

  /**
   * Generate a saga/process manager
   */
  async generateSaga(context) {
    const { 
      name, 
      steps = [],
      compensations = [],
      timeout,
      persistState = true
    } = context;
    
    const sagaName = this.toPascalCase(name) + 'Saga';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      sagaName,
      fileName,
      steps: this.buildSagaSteps(steps),
      compensations: this.buildCompensations(compensations, steps),
      timeout,
      persistState,
      hasSteps: steps.length > 0,
      hasCompensations: compensations.length > 0 || steps.some(s => s.compensation),
      hasTimeout: timeout !== undefined
    };
    
    return this.generateSagaCode(templateData);
  }

  /**
   * Generate an event schema
   */
  async generateEventSchema(context) {
    const { 
      name, 
      version = '1.0',
      fields = [],
      metadata = true
    } = context;
    
    const eventName = this.toPascalCase(name) + 'Event';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      eventName,
      fileName,
      version,
      fields: this.buildSchemaFields(fields),
      metadata,
      hasFields: fields.length > 0
    };
    
    return this.generateSchemaCode(templateData);
  }

  // Code generation methods
  generateHandlerCode(data, broker) {
    const lines = [];
    
    // Imports
    for (const imp of data.imports) {
      lines.push(`import { ${imp.items.join(', ')} } from '${imp.from}';`);
    }
    lines.push('');
    
    // Event interfaces
    for (const event of data.events) {
      lines.push(`interface ${event.name} {`);
      for (const field of event.fields) {
        lines.push(`  ${field.name}: ${field.type};`);
      }
      lines.push('}');
      lines.push('');
    }
    
    // Handler class
    lines.push(`export class ${data.handlerName} {`);
    lines.push('  private readonly logger: Logger;');
    lines.push('');
    lines.push(`  constructor(private readonly ${this.toCamelCase(broker)}Client: any) {`);
    lines.push('    this.logger = new Logger();');
    lines.push('  }');
    lines.push('');
    
    // Handler methods for each event
    for (const event of data.events) {
      lines.push(`  async handle${event.name}(event: ${event.name}): Promise<void> {`);
      lines.push(`    this.logger.log('Handling ${event.name}', { eventId: event.id });`);
      lines.push('');
      
      if (data.retry) {
        lines.push('    try {');
        lines.push(`      // TODO: Implement ${event.name} handling logic`);
        lines.push('      await this.processEvent(event);');
        lines.push('    } catch (error) {');
        lines.push(`      this.logger.error('Error handling ${event.name}', error);`);
        if (data.deadLetter) {
          lines.push('      await this.sendToDeadLetter(event, error);');
        }
        lines.push('      throw error;');
        lines.push('    }');
      } else {
        lines.push(`    // TODO: Implement ${event.name} handling logic`);
        lines.push('    await this.processEvent(event);');
      }
      
      lines.push('  }');
      lines.push('');
    }
    
    // Private methods
    lines.push('  private async processEvent(event: any): Promise<void> {');
    lines.push('    // Implementation');
    lines.push('  }');
    lines.push('');
    
    if (data.deadLetter) {
      lines.push('  private async sendToDeadLetter(event: any, error: any): Promise<void> {');
      lines.push('    // Send to dead letter queue');
      lines.push('  }');
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  generatePublisherCode(data, broker) {
    const lines = [];
    
    // Imports
    for (const imp of data.imports) {
      lines.push(`import { ${imp.items.join(', ')} } from '${imp.from}';`);
    }
    lines.push('');
    
    // Event interfaces
    for (const event of data.events) {
      lines.push(`export interface ${event.name} {`);
      lines.push('  id: string;');
      lines.push('  timestamp: Date;');
      lines.push('  version: string;');
      for (const field of event.fields) {
        lines.push(`  ${field.name}: ${field.type};`);
      }
      lines.push('}');
      lines.push('');
    }
    
    // Publisher class
    lines.push(`export class ${data.publisherName} {`);
    lines.push('  private readonly logger: Logger;');
    lines.push(`  private readonly batchSize = ${data.batchSize};`);
    lines.push('');
    lines.push(`  constructor(private readonly client: any) {`);
    lines.push('    this.logger = new Logger();');
    lines.push('  }');
    lines.push('');
    
    // Publish methods for each event
    for (const event of data.events) {
      lines.push(`  async publish${event.name}(data: Omit<${event.name}, 'id' | 'timestamp' | 'version'>): Promise<void> {`);
      lines.push(`    const event: ${event.name} = {`);
      lines.push('      id: this.generateId(),');
      lines.push('      timestamp: new Date(),');
      lines.push(`      version: '1.0',`);
      lines.push('      ...data');
      lines.push('    };');
      lines.push('');
      lines.push(`    this.logger.log('Publishing ${event.name}', { eventId: event.id });`);
      lines.push(`    await this.client.send({ body: event, subject: '${event.topic || event.name}' });`);
      lines.push('  }');
      lines.push('');
    }
    
    // Batch publish
    lines.push('  async publishBatch<T>(events: T[], topic: string): Promise<void> {');
    lines.push('    for (let i = 0; i < events.length; i += this.batchSize) {');
    lines.push('      const batch = events.slice(i, i + this.batchSize);');
    lines.push('      await Promise.all(batch.map(e => this.client.send({ body: e, subject: topic })));');
    lines.push('    }');
    lines.push('  }');
    lines.push('');
    
    // Helper methods
    lines.push('  private generateId(): string {');
    lines.push("    return 'evt_' + Math.random().toString(36).substr(2, 9);");
    lines.push('  }');
    
    lines.push('}');
    
    return lines.join('\n');
  }

  generateSagaCode(data) {
    const lines = [];
    
    lines.push(`import { Logger } from '../utils/logger';`);
    lines.push('');
    
    // State interface
    lines.push(`interface ${data.sagaName}State {`);
    lines.push('  id: string;');
    lines.push('  status: SagaStatus;');
    lines.push('  currentStep: number;');
    lines.push('  completedSteps: string[];');
    lines.push('  failedStep?: string;');
    lines.push('  error?: string;');
    lines.push('  data: Record<string, any>;');
    lines.push('  startedAt: Date;');
    lines.push('  completedAt?: Date;');
    lines.push('}');
    lines.push('');
    
    lines.push(`type SagaStatus = 'pending' | 'running' | 'completed' | 'failed' | 'compensating' | 'compensated';`);
    lines.push('');
    
    // Step interface
    lines.push('interface SagaStep {');
    lines.push('  name: string;');
    lines.push('  execute: (state: any) => Promise<any>;');
    lines.push('  compensate?: (state: any) => Promise<void>;');
    lines.push('}');
    lines.push('');
    
    // Saga class
    lines.push(`export class ${data.sagaName} {`);
    lines.push('  private readonly logger: Logger;');
    lines.push('  private readonly steps: SagaStep[];');
    lines.push('');
    
    if (data.hasTimeout) {
      lines.push(`  private readonly timeout = ${data.timeout};`);
      lines.push('');
    }
    
    lines.push('  constructor() {');
    lines.push('    this.logger = new Logger();');
    lines.push('    this.steps = this.defineSteps();');
    lines.push('  }');
    lines.push('');
    
    // Define steps
    lines.push('  private defineSteps(): SagaStep[] {');
    lines.push('    return [');
    
    for (const step of data.steps) {
      lines.push('      {');
      lines.push(`        name: '${step.name}',`);
      lines.push(`        execute: async (state) => {`);
      lines.push(`          this.logger.log('Executing step: ${step.name}');`);
      lines.push(`          ${step.execute || '// TODO: implement'}`);
      lines.push('        },');
      if (step.compensation) {
        lines.push(`        compensate: async (state) => {`);
        lines.push(`          this.logger.log('Compensating step: ${step.name}');`);
        lines.push(`          ${step.compensation || '// TODO: implement compensation'}`);
        lines.push('        }');
      }
      lines.push('      },');
    }
    
    lines.push('    ];');
    lines.push('  }');
    lines.push('');
    
    // Execute saga
    lines.push(`  async execute(input: any): Promise<${data.sagaName}State> {`);
    lines.push(`    const state: ${data.sagaName}State = {`);
    lines.push("      id: 'saga_' + Math.random().toString(36).substr(2, 9),");
    lines.push("      status: 'running',");
    lines.push('      currentStep: 0,');
    lines.push('      completedSteps: [],');
    lines.push('      data: { input },');
    lines.push('      startedAt: new Date()');
    lines.push('    };');
    lines.push('');
    lines.push('    try {');
    lines.push('      for (let i = 0; i < this.steps.length; i++) {');
    lines.push('        const step = this.steps[i];');
    lines.push('        state.currentStep = i;');
    lines.push('');
    lines.push('        const result = await step.execute(state.data);');
    lines.push('        state.data[step.name] = result;');
    lines.push('        state.completedSteps.push(step.name);');
    lines.push('      }');
    lines.push('');
    lines.push("      state.status = 'completed';");
    lines.push('      state.completedAt = new Date();');
    lines.push('    } catch (error: any) {');
    lines.push("      state.status = 'failed';");
    lines.push('      state.failedStep = this.steps[state.currentStep]?.name;');
    lines.push('      state.error = error.message;');
    lines.push('');
    lines.push('      await this.compensate(state);');
    lines.push('    }');
    lines.push('');
    lines.push('    return state;');
    lines.push('  }');
    lines.push('');
    
    // Compensate
    lines.push(`  private async compensate(state: ${data.sagaName}State): Promise<void> {`);
    lines.push("    state.status = 'compensating';");
    lines.push('');
    lines.push('    // Execute compensations in reverse order');
    lines.push('    for (let i = state.completedSteps.length - 1; i >= 0; i--) {');
    lines.push('      const stepName = state.completedSteps[i];');
    lines.push('      const step = this.steps.find(s => s.name === stepName);');
    lines.push('');
    lines.push('      if (step?.compensate) {');
    lines.push('        try {');
    lines.push('          await step.compensate(state.data);');
    lines.push('        } catch (compError) {');
    lines.push('          this.logger.error(`Compensation failed for step ${stepName}`, compError);');
    lines.push('        }');
    lines.push('      }');
    lines.push('    }');
    lines.push('');
    lines.push("    state.status = 'compensated';");
    lines.push('  }');
    
    lines.push('}');
    
    return lines.join('\n');
  }

  generateSchemaCode(data) {
    const lines = [];
    
    lines.push(`import { z } from 'zod';`);
    lines.push('');
    
    // Base event schema
    lines.push('const BaseEventSchema = z.object({');
    lines.push('  id: z.string().uuid(),');
    lines.push('  timestamp: z.date(),');
    lines.push(`  version: z.literal('${data.version}'),`);
    lines.push('  correlationId: z.string().optional(),');
    lines.push('  causationId: z.string().optional()');
    lines.push('});');
    lines.push('');
    
    if (data.metadata) {
      lines.push('const EventMetadataSchema = z.object({');
      lines.push('  source: z.string(),');
      lines.push('  type: z.string(),');
      lines.push('  contentType: z.string().default("application/json"),');
      lines.push('  traceId: z.string().optional(),');
      lines.push('  spanId: z.string().optional()');
      lines.push('});');
      lines.push('');
    }
    
    // Event schema
    lines.push(`export const ${data.eventName}Schema = BaseEventSchema.extend({`);
    
    for (const field of data.fields) {
      const zodType = this.toZodType(field);
      lines.push(`  ${field.name}: ${zodType},`);
    }
    
    if (data.metadata) {
      lines.push('  metadata: EventMetadataSchema');
    }
    
    lines.push('});');
    lines.push('');
    
    // TypeScript type
    lines.push(`export type ${data.eventName} = z.infer<typeof ${data.eventName}Schema>;`);
    lines.push('');
    
    // Factory function
    lines.push(`export function create${data.eventName}(`);
    lines.push(`  data: Omit<${data.eventName}, 'id' | 'timestamp' | 'version'${data.metadata ? " | 'metadata'" : ''}>`);
    lines.push(`): ${data.eventName} {`);
    lines.push('  return {');
    lines.push('    id: crypto.randomUUID(),');
    lines.push('    timestamp: new Date(),');
    lines.push(`    version: '${data.version}',`);
    lines.push('    ...data,');
    if (data.metadata) {
      lines.push('    metadata: {');
      lines.push(`      source: '${data.fileName}',`);
      lines.push(`      type: '${data.eventName}',`);
      lines.push("      contentType: 'application/json'");
      lines.push('    }');
    }
    lines.push('  };');
    lines.push('}');
    lines.push('');
    
    // Validation function
    lines.push(`export function validate${data.eventName}(event: unknown): ${data.eventName} {`);
    lines.push(`  return ${data.eventName}Schema.parse(event);`);
    lines.push('}');
    
    return lines.join('\n');
  }

  // Helper methods
  buildEvents(events) {
    return events.map(e => ({
      name: this.toPascalCase(e.name || e),
      topic: e.topic,
      fields: e.fields || []
    }));
  }

  buildRetryConfig(retry) {
    if (retry === false) return null;
    if (retry === true) {
      return { maxAttempts: 3, backoff: 'exponential' };
    }
    return retry;
  }

  buildSagaSteps(steps) {
    return steps.map(s => ({
      name: s.name,
      execute: s.execute,
      compensation: s.compensation
    }));
  }

  buildCompensations(compensations, steps) {
    const result = [...compensations];
    for (const step of steps) {
      if (step.compensation && !result.find(c => c.step === step.name)) {
        result.push({ step: step.name, action: step.compensation });
      }
    }
    return result;
  }

  buildSchemaFields(fields) {
    return fields.map(f => ({
      name: f.name,
      type: f.type || 'string',
      required: f.required !== false,
      description: f.description
    }));
  }

  buildHandlerImports(broker) {
    const imports = [{ from: '../utils/logger', items: ['Logger'] }];
    
    switch (broker) {
      case 'servicebus':
        imports.push({ from: '@azure/service-bus', items: ['ServiceBusClient', 'ServiceBusReceiver'] });
        break;
      case 'eventhub':
        imports.push({ from: '@azure/event-hubs', items: ['EventHubConsumerClient'] });
        break;
      case 'kafka':
        imports.push({ from: 'kafkajs', items: ['Kafka', 'Consumer'] });
        break;
      case 'rabbitmq':
        imports.push({ from: 'amqplib', items: ['Connection', 'Channel'] });
        break;
    }
    
    return imports;
  }

  buildPublisherImports(broker) {
    const imports = [{ from: '../utils/logger', items: ['Logger'] }];
    
    switch (broker) {
      case 'servicebus':
        imports.push({ from: '@azure/service-bus', items: ['ServiceBusClient', 'ServiceBusSender'] });
        break;
      case 'eventhub':
        imports.push({ from: '@azure/event-hubs', items: ['EventHubProducerClient'] });
        break;
      case 'kafka':
        imports.push({ from: 'kafkajs', items: ['Kafka', 'Producer'] });
        break;
      case 'rabbitmq':
        imports.push({ from: 'amqplib', items: ['Connection', 'Channel'] });
        break;
    }
    
    return imports;
  }

  toZodType(field) {
    const typeMap = {
      string: 'z.string()',
      number: 'z.number()',
      integer: 'z.number().int()',
      boolean: 'z.boolean()',
      date: 'z.date()',
      uuid: 'z.string().uuid()',
      email: 'z.string().email()',
      url: 'z.string().url()',
      array: `z.array(z.unknown())`,
      object: 'z.record(z.unknown())'
    };
    
    let zodType = typeMap[field.type?.toLowerCase()] || 'z.unknown()';
    
    if (field.required === false) {
      zodType += '.optional()';
    }
    
    return zodType;
  }
}

module.exports = EventDrivenGenerator;
