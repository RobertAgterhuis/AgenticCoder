# Type Definitions

Complete type definitions for AgenticCoder.

## Core Types

### Agent Types

```typescript
/**
 * Agent interface - all agents must implement this
 */
interface IAgent {
  /** Unique agent identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Agent description */
  description: string;
  
  /** Skills this agent uses */
  skills: string[];
  
  /** Expected input artifacts */
  inputs: string[];
  
  /** Expected output artifacts */
  outputs: string[];
  
  /** Initialize agent with context */
  initialize(context: AgentContext): Promise<void>;
  
  /** Execute a task */
  execute(task: Task): Promise<Result>;
  
  /** Cleanup resources */
  cleanup(): Promise<void>;
  
  /** Get current status */
  getStatus(): AgentStatus;
  
  /** Get capabilities */
  getCapabilities(): Capability[];
}

/**
 * Agent execution context
 */
interface AgentContext {
  workflowId: string;
  scenario: string;
  projectName: string;
  currentPhase: number;
  
  messageBus: IMessageBus;
  artifactStore: IArtifactStore;
  skillLoader: ISkillLoader;
  logger: ILogger;
  
  config: AgentConfig;
  sharedState: Map<string, unknown>;
}

/**
 * Agent configuration
 */
interface AgentConfig {
  id: string;
  name: string;
  description: string;
  skills: string[];
  inputs: string[];
  outputs: string[];
  phases: number[];
  
  settings: {
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
    retries?: number;
  };
}

/**
 * Agent status
 */
interface AgentStatus {
  id: string;
  state: 'idle' | 'initializing' | 'running' | 'completed' | 'failed';
  currentTask?: string;
  progress?: number;
  lastActivity: Date;
  metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    averageDuration: number;
  };
}

/**
 * Agent capability
 */
interface Capability {
  name: string;
  description: string;
  skills: string[];
}
```

### Task Types

```typescript
/**
 * Task definition
 */
interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  
  inputs: {
    files: string[];
    parameters: Record<string, unknown>;
  };
  
  expectedOutputs: string[];
  timeout: number;
  retryPolicy: RetryPolicy;
  
  metadata: {
    phase: number;
    priority: number;
    source: string;
    created: Date;
  };
}

/**
 * Task types
 */
type TaskType = 
  | 'feature'
  | 'technical'
  | 'documentation'
  | 'testing'
  | 'infrastructure'
  | 'bugfix';

/**
 * Task status
 */
type TaskStatus = 
  | 'backlog'
  | 'ready'
  | 'in-progress'
  | 'review'
  | 'done'
  | 'blocked';

/**
 * Retry policy
 */
interface RetryPolicy {
  maxRetries: number;
  backoff: 'fixed' | 'exponential';
  initialDelay: number;
  maxDelay: number;
}

/**
 * Task result
 */
interface Result {
  taskId: string;
  status: 'success' | 'partial' | 'failed';
  
  outputs: {
    artifacts: Artifact[];
    messages: string[];
  };
  
  metrics: {
    duration: number;
    tokensUsed: number;
    retries: number;
  };
  
  error?: AgentError;
}

/**
 * Agent error
 */
interface AgentError {
  code: string;
  message: string;
  stack?: string;
  recoverable: boolean;
  suggestions?: string[];
}
```

### Message Types

```typescript
/**
 * Message structure
 */
interface Message {
  id: string;
  type: MessageType;
  from: string;
  to: string;
  topic: string;
  payload: unknown;
  timestamp: Date;
  
  correlationId?: string;
  replyTo?: string;
  ttl?: number;
}

/**
 * Message types
 */
type MessageType = 
  | 'task'
  | 'result'
  | 'event'
  | 'handoff'
  | 'error'
  | 'ack';

/**
 * Message handler
 */
type MessageHandler = (message: Message) => Promise<void>;

/**
 * Subscription
 */
interface Subscription {
  id: string;
  topic: string;
  unsubscribe(): void;
}

/**
 * Message bus interface
 */
interface IMessageBus {
  publish(message: Message): Promise<void>;
  subscribe(topic: string, handler: MessageHandler): Subscription;
  request(message: Message, timeout?: number): Promise<Message>;
  broadcast(message: Message): Promise<void>;
  getQueueDepth(topic: string): Promise<number>;
}
```

### Artifact Types

```typescript
/**
 * Artifact structure
 */
interface Artifact {
  path: string;
  content: string;
  type: ArtifactType;
  metadata: ArtifactMetadata;
}

/**
 * Artifact types
 */
type ArtifactType = 
  | 'document'
  | 'code'
  | 'config'
  | 'template'
  | 'diagram'
  | 'test'
  | 'other';

/**
 * Artifact metadata
 */
interface ArtifactMetadata {
  created: Date;
  modified: Date;
  createdBy: string;
  modifiedBy: string;
  phase: number;
  version: number;
  checksum: string;
  tags: string[];
}

/**
 * Artifact store interface
 */
interface IArtifactStore {
  read(path: string): Promise<string>;
  write(path: string, content: string, metadata?: Partial<ArtifactMetadata>): Promise<Artifact>;
  exists(path: string): Promise<boolean>;
  list(directory: string, pattern?: string): Promise<string[]>;
  delete(path: string): Promise<void>;
  getMetadata(path: string): Promise<ArtifactMetadata>;
}
```

### Workflow Types

```typescript
/**
 * Workflow configuration
 */
interface WorkflowConfig {
  scenario: string;
  projectName: string;
  outputDir: string;
  
  settings: {
    skipPhases?: number[];
    parallelExecution?: boolean;
    maxConcurrent?: number;
    timeout?: number;
  };
}

/**
 * Workflow status
 */
interface WorkflowStatus {
  id: string;
  scenario: string;
  projectName: string;
  state: WorkflowState;
  
  progress: {
    currentPhase: number;
    totalPhases: number;
    completedPhases: number[];
    skippedPhases: number[];
    percentage: number;
  };
  
  timing: {
    started: Date;
    elapsed: number;
    estimated: number;
  };
  
  currentActivity?: {
    phase: number;
    agent: string;
    task: string;
    started: Date;
  };
}

/**
 * Workflow state
 */
type WorkflowState = 
  | 'initializing'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Workflow result
 */
interface WorkflowResult {
  id: string;
  status: 'success' | 'partial' | 'failed';
  
  completedPhases: number[];
  skippedPhases: number[];
  failedPhases: number[];
  
  artifacts: Artifact[];
  
  metrics: {
    totalDuration: number;
    phaseDurations: Record<number, number>;
    tokensUsed: number;
    agentExecutions: number;
  };
  
  errors: WorkflowError[];
}

/**
 * Workflow error
 */
interface WorkflowError {
  phase: number;
  agent: string;
  error: AgentError;
  timestamp: Date;
}
```

### Validation Types

```typescript
/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  score: number;
  
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  
  categories: {
    schema: CategoryResult;
    syntax: CategoryResult;
    semantic: CategoryResult;
    security: CategoryResult;
    quality: CategoryResult;
  };
  
  metadata: {
    artifact: string;
    validators: string[];
    duration: number;
    timestamp: Date;
  };
}

/**
 * Validation issue
 */
interface ValidationIssue {
  code: string;
  message: string;
  severity: Severity;
  category: string;
  
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  
  suggestion?: string;
  autoFixable: boolean;
}

/**
 * Severity levels
 */
type Severity = 'error' | 'warning' | 'info';

/**
 * Category result
 */
interface CategoryResult {
  passed: boolean;
  score: number;
  issues: ValidationIssue[];
}

/**
 * Validator interface
 */
interface IValidator {
  id: string;
  appliesTo(artifact: Artifact): boolean;
  validate(artifact: Artifact): Promise<ValidationResult>;
}
```

### Skill Types

```typescript
/**
 * Skill interface
 */
interface ISkill {
  id: string;
  name: string;
  description: string;
  
  execute(context: SkillContext): Promise<SkillResult>;
}

/**
 * Skill context
 */
interface SkillContext {
  inputs: Record<string, unknown>;
  config: Record<string, unknown>;
  artifacts: Artifact[];
}

/**
 * Skill result
 */
interface SkillResult {
  success: boolean;
  outputs: Record<string, unknown>;
  artifacts: Artifact[];
  tokensUsed: number;
}

/**
 * Skill loader interface
 */
interface ISkillLoader {
  load(skillId: string): Promise<ISkill>;
  loadAll(skillIds: string[]): Promise<ISkill[]>;
  getAvailable(): string[];
}
```

### Phase Types

```typescript
/**
 * Phase configuration
 */
interface PhaseConfig {
  phase: number;
  name: string;
  description: string;
  
  primaryAgent: string;
  supportingAgents: string[];
  
  requiredPhases: number[];
  optional: boolean;
  
  inputs: string[];
  outputs: string[];
  
  validation: {
    required: string[];
    optional: string[];
  };
  
  timeout: number;
  retries: number;
}

/**
 * Phase status
 */
interface PhaseStatus {
  phase: number;
  name: string;
  state: PhaseState;
  
  agents: {
    total: number;
    completed: number;
    running: number;
    failed: number;
  };
  
  artifacts: {
    expected: string[];
    created: string[];
    validated: string[];
  };
  
  timing?: {
    started: Date;
    completed?: Date;
    duration?: number;
  };
}

/**
 * Phase state
 */
type PhaseState = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'skipped'
  | 'failed';
```

### Metrics Types

```typescript
/**
 * Metric data point
 */
interface MetricData {
  metric: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}

/**
 * Metric query options
 */
interface QueryOptions {
  period: string;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string[];
  filter?: Record<string, string>;
}

/**
 * Aggregate data
 */
interface AggregateData {
  metric: string;
  period: string;
  aggregation: string;
  value: number;
  dataPoints: number;
}

/**
 * Pattern detection
 */
interface Pattern {
  type: string;
  description: string;
  confidence: number;
  affected: string[];
  recommendation: string;
}

/**
 * Anomaly detection
 */
interface Anomaly {
  metric: string;
  timestamp: Date;
  expected: number;
  actual: number;
  deviation: number;
  severity: Severity;
}
```

### Configuration Types

```typescript
/**
 * Engine configuration
 */
interface EngineConfig {
  parallelExecution: boolean;
  maxConcurrentAgents: number;
  defaultTimeout: number;
  checkpointInterval: 'phase' | 'task' | 'none';
  
  retry: {
    enabled: boolean;
    maxAttempts: number;
    backoffMultiplier: number;
  };
  
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    destination: string;
  };
}

/**
 * Validation configuration
 */
interface ValidationConfig {
  failOnError: boolean;
  failOnWarning: boolean;
  
  autoFix: {
    enabled: boolean;
    safeOnly: boolean;
  };
  
  validators: {
    schema: { enabled: boolean };
    syntax: { enabled: boolean };
    semantic: { enabled: boolean; rules: string[] };
    security: { enabled: boolean; severityThreshold: string };
    quality: { enabled: boolean; minScore: number };
  };
}

/**
 * Learning configuration
 */
interface LearningConfig {
  enabled: boolean;
  
  metrics: {
    collectAgent: boolean;
    collectPhase: boolean;
    retention: string;
  };
  
  patterns: {
    analysisInterval: string;
    minimumSamples: number;
    confidenceThreshold: number;
  };
  
  optimization: {
    autoApply: boolean;
    maxChangesPerCycle: number;
    rollbackOnDegrade: boolean;
  };
}
```

## Utility Types

```typescript
/**
 * Logger interface
 */
interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(meta: Record<string, unknown>): ILogger;
}

/**
 * Event emitter type
 */
interface IEventEmitter<Events extends Record<string, unknown[]>> {
  on<E extends keyof Events>(event: E, handler: (...args: Events[E]) => void): void;
  off<E extends keyof Events>(event: E, handler: (...args: Events[E]) => void): void;
  emit<E extends keyof Events>(event: E, ...args: Events[E]): void;
}

/**
 * Result type for error handling
 */
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Maybe type
 */
type Maybe<T> = T | null | undefined;

/**
 * Deep partial type
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

## Next Steps

- [API Reference](API-Reference) - API documentation
- [TypeScript Overview](Overview) - Module structure
- [Building Agents](../guides/Building-Agents) - Create agents
