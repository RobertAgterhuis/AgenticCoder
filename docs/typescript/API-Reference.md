# API Reference

Complete TypeScript API reference for AgenticCoder.

## Core APIs

### WorkflowEngine

Main orchestration engine.

```typescript
import { WorkflowEngine } from '@agentic-coder/core';

const engine = new WorkflowEngine(options);
```

#### Constructor

```typescript
new WorkflowEngine(options?: WorkflowEngineOptions)
```

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `configPath` | `string` | `.agentic/config/` | Config directory |
| `parallelExecution` | `boolean` | `true` | Enable parallel agents |
| `maxConcurrent` | `number` | `3` | Max concurrent agents |

#### Methods

##### initialize()

```typescript
async initialize(config: WorkflowConfig): Promise<void>
```

Initialize workflow with configuration.

```typescript
await engine.initialize({
  scenario: 'S02',
  projectName: 'MyProject',
  settings: {
    skipPhases: [8, 9]
  }
});
```

##### start()

```typescript
async start(): Promise<WorkflowResult>
```

Start workflow execution.

```typescript
const result = await engine.start();
console.log('Completed:', result.completedPhases);
```

##### pause()

```typescript
async pause(): Promise<void>
```

Pause current workflow.

##### resume()

```typescript
async resume(): Promise<void>
```

Resume paused workflow.

##### getStatus()

```typescript
async getStatus(): Promise<WorkflowStatus>
```

Get current workflow status.

```typescript
const status = await engine.getStatus();
console.log('Phase:', status.currentPhase);
console.log('Progress:', status.progress);
```

#### Events

```typescript
engine.on('workflow:started', (config) => { });
engine.on('workflow:completed', (result) => { });
engine.on('workflow:failed', (error) => { });
engine.on('phase:started', (phase) => { });
engine.on('phase:completed', (phase, artifacts) => { });
engine.on('agent:started', (agent, task) => { });
engine.on('agent:completed', (agent, result) => { });
```

---

### MessageBus

Agent communication system.

```typescript
import { MessageBus } from '@agentic-coder/core';

const bus = new MessageBus(options);
```

#### Methods

##### publish()

```typescript
async publish(message: Message): Promise<void>
```

Publish a message.

```typescript
await bus.publish({
  type: 'task',
  to: 'architect-agent',
  topic: 'agents.architect',
  payload: { action: 'design' }
});
```

##### subscribe()

```typescript
subscribe(topic: string, handler: MessageHandler): Subscription
```

Subscribe to a topic.

```typescript
const sub = bus.subscribe('agents.*', async (message) => {
  console.log('Received:', message);
});

// Unsubscribe
sub.unsubscribe();
```

##### request()

```typescript
async request(message: Message, timeout?: number): Promise<Message>
```

Request with response.

```typescript
const response = await bus.request({
  to: 'plan-agent',
  payload: { action: 'create-plan' }
}, 30000);
```

##### broadcast()

```typescript
async broadcast(message: Message): Promise<void>
```

Broadcast to all subscribers.

---

### ArtifactStore

File and artifact management.

```typescript
import { ArtifactStore } from '@agentic-coder/core';

const store = new ArtifactStore(basePath);
```

#### Methods

##### read()

```typescript
async read(path: string): Promise<string>
```

Read artifact content.

##### write()

```typescript
async write(path: string, content: string, metadata?: Metadata): Promise<Artifact>
```

Write artifact.

```typescript
const artifact = await store.write(
  'plans/project-plan.md',
  planContent,
  { agent: 'plan', phase: 1 }
);
```

##### exists()

```typescript
async exists(path: string): Promise<boolean>
```

Check if artifact exists.

##### list()

```typescript
async list(directory: string, pattern?: string): Promise<string[]>
```

List artifacts in directory.

```typescript
const files = await store.list('src/', '**/*.ts');
```

##### delete()

```typescript
async delete(path: string): Promise<void>
```

Delete artifact.

---

### BaseAgent

Foundation for agents.

```typescript
import { BaseAgent } from '@agentic-coder/core';

class MyAgent extends BaseAgent {
  protected async doExecute(task: Task): Promise<Result> {
    // Implementation
  }
}
```

#### Protected Methods

##### readArtifact()

```typescript
protected async readArtifact(path: string): Promise<string>
```

##### writeArtifact()

```typescript
protected async writeArtifact(path: string, content: string): Promise<Artifact>
```

##### getSkill()

```typescript
protected getSkill(skillId: string): Skill
```

##### sendMessage()

```typescript
protected async sendMessage(to: string, payload: any): Promise<void>
```

##### getConfig()

```typescript
protected getConfig<T>(key: string, defaultValue?: T): T
```

---

## Validation APIs

### ValidationFramework

```typescript
import { ValidationFramework } from '@agentic-coder/validation';

const framework = new ValidationFramework();
```

#### Methods

##### registerValidator()

```typescript
registerValidator(validator: IValidator): void
```

Register a custom validator.

##### validate()

```typescript
async validate(artifact: Artifact, options?: ValidateOptions): Promise<ValidationResult>
```

Validate single artifact.

```typescript
const result = await framework.validate('src/app.ts', {
  validators: ['syntax', 'security'],
  autoFix: true
});
```

##### validateAll()

```typescript
async validateAll(patterns: string[]): Promise<ValidationResult[]>
```

Validate multiple files.

```typescript
const results = await framework.validateAll([
  'src/**/*.ts',
  'infra/**/*.bicep'
]);
```

---

## Learning APIs

### MetricsCollector

```typescript
import { MetricsCollector } from '@agentic-coder/learning';

const metrics = new MetricsCollector();
```

#### Methods

##### record()

```typescript
record(metric: string, value: number, tags?: Record<string, string>): void
```

Record a metric.

```typescript
metrics.record('agent.duration', 5200, {
  agent: 'plan',
  phase: '1'
});
```

##### query()

```typescript
async query(metric: string, options: QueryOptions): Promise<MetricData[]>
```

Query metrics.

```typescript
const data = await metrics.query('agent.duration', {
  agent: 'plan',
  period: '7d',
  aggregation: 'avg'
});
```

---

### PatternAnalyzer

```typescript
import { PatternAnalyzer } from '@agentic-coder/learning';

const analyzer = new PatternAnalyzer();
```

#### Methods

##### analyze()

```typescript
async analyze(metrics: MetricData[]): Promise<Pattern[]>
```

Analyze patterns in metrics.

##### detectAnomalies()

```typescript
async detectAnomalies(metrics: MetricData[]): Promise<Anomaly[]>
```

Detect anomalies.

##### generateRecommendations()

```typescript
async generateRecommendations(): Promise<Recommendation[]>
```

Generate optimization recommendations.

---

## Utility APIs

### Logger

```typescript
import { logger } from '@agentic-coder/utils';

logger.info('Message', { key: 'value' });
logger.error('Error', { error });
```

#### Methods

- `debug(message: string, meta?: object)`
- `info(message: string, meta?: object)`
- `warn(message: string, meta?: object)`
- `error(message: string, meta?: object)`

---

### Config

```typescript
import { Config } from '@agentic-coder/utils';

const config = Config.load('.agentic/config/');
```

#### Methods

##### load()

```typescript
static load(path?: string): Config
```

Load configuration.

##### get()

```typescript
get<T>(key: string, defaultValue?: T): T
```

Get config value.

```typescript
const timeout = config.get('engine.timeout', 30000);
```

##### set()

```typescript
set(key: string, value: any): void
```

Set config value.

---

## Type Definitions

### Interfaces

```typescript
// Agent
interface IAgent {
  id: string;
  name: string;
  initialize(context: AgentContext): Promise<void>;
  execute(task: Task): Promise<Result>;
  cleanup(): Promise<void>;
}

// Task
interface Task {
  id: string;
  type: string;
  inputs: { files: string[]; parameters: Record<string, any> };
  expectedOutputs: string[];
  timeout: number;
}

// Result
interface Result {
  taskId: string;
  status: 'success' | 'partial' | 'failed';
  outputs: { artifacts: Artifact[]; messages: string[] };
  metrics: { duration: number; tokensUsed: number };
  error?: AgentError;
}

// Message
interface Message {
  id: string;
  type: 'task' | 'result' | 'event' | 'handoff';
  from: string;
  to: string;
  topic: string;
  payload: any;
  timestamp: Date;
}

// Artifact
interface Artifact {
  path: string;
  content: string;
  metadata: ArtifactMetadata;
}

// ValidationResult
interface ValidationResult {
  valid: boolean;
  score: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}
```

### Enums

```typescript
enum TaskStatus {
  Backlog = 'backlog',
  Ready = 'ready',
  InProgress = 'in-progress',
  Review = 'review',
  Done = 'done',
  Blocked = 'blocked'
}

enum MessageType {
  Task = 'task',
  Result = 'result',
  Event = 'event',
  Handoff = 'handoff'
}

enum Severity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info'
}
```

## Next Steps

- [TypeScript Overview](Overview) - Module structure
- [Building Agents](../guides/Building-Agents) - Create agents
- [Configuration](../guides/Configuration) - Config reference
