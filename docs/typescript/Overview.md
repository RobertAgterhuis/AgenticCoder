# TypeScript Modules

Overview of AgenticCoder's TypeScript implementation.

## Module Structure

```
src/
├── core/                    # Core engine modules
│   ├── workflow-engine.ts   # Main orchestration
│   ├── message-bus.ts       # Agent communication
│   ├── agent-base.ts        # Base agent class
│   └── artifact-store.ts    # Artifact management
│
├── agents/                  # Agent implementations
│   ├── planning/            # Planning agents
│   ├── architecture/        # Architecture agents
│   ├── implementation/      # Code agents
│   └── quality/             # QA agents
│
├── skills/                  # Skill implementations
│   ├── loader.ts            # Skill loader
│   └── implementations/     # Individual skills
│
├── validation/              # Validation framework
│   ├── framework.ts         # Main validator
│   ├── validators/          # Individual validators
│   └── rules/               # Validation rules
│
├── learning/                # Self-learning system
│   ├── metrics.ts           # Metrics collection
│   ├── analyzer.ts          # Pattern analysis
│   └── optimizer.ts         # Optimization engine
│
├── utils/                   # Utilities
│   ├── logger.ts            # Logging
│   ├── config.ts            # Configuration
│   └── helpers.ts           # Helper functions
│
└── cli/                     # CLI commands
    ├── index.ts             # Entry point
    └── commands/            # Command handlers
```

## Core Modules

### Workflow Engine

Main orchestration engine.

**Location:** `src/core/workflow-engine.ts`

```typescript
export class WorkflowEngine {
  private phases: Phase[];
  private agents: Map<string, IAgent>;
  private messageBus: IMessageBus;
  
  async initialize(config: WorkflowConfig): Promise<void>;
  async start(): Promise<WorkflowResult>;
  async pause(): Promise<void>;
  async resume(): Promise<void>;
  async getStatus(): Promise<WorkflowStatus>;
}
```

**Dependencies:**
- `message-bus` - Agent communication
- `agent-base` - Agent management
- `artifact-store` - File operations

### Message Bus

Inter-agent communication.

**Location:** `src/core/message-bus.ts`

```typescript
export class MessageBus implements IMessageBus {
  async publish(message: Message): Promise<void>;
  async subscribe(topic: string, handler: MessageHandler): Subscription;
  async request(message: Message, timeout?: number): Promise<Message>;
  async broadcast(message: Message): Promise<void>;
}
```

**Features:**
- Topic-based routing
- Request/response pattern
- Message persistence
- Dead letter queue

### Agent Base

Foundation for all agents.

**Location:** `src/core/agent-base.ts`

```typescript
export abstract class BaseAgent implements IAgent {
  protected context: AgentContext;
  protected skills: Map<string, Skill>;
  
  async initialize(context: AgentContext): Promise<void>;
  async execute(task: Task): Promise<Result>;
  async cleanup(): Promise<void>;
  
  protected abstract doExecute(task: Task): Promise<Result>;
}
```

### Artifact Store

File and artifact management.

**Location:** `src/core/artifact-store.ts`

```typescript
export class ArtifactStore implements IArtifactStore {
  async read(path: string): Promise<string>;
  async write(path: string, content: string): Promise<Artifact>;
  async exists(path: string): Promise<boolean>;
  async list(directory: string): Promise<string[]>;
  async delete(path: string): Promise<void>;
}
```

## Agent Modules

### Planning Agents

**Location:** `src/agents/planning/`

| File | Agent | Description |
|------|-------|-------------|
| `plan-agent.ts` | @plan | Project planning |
| `doc-agent.ts` | @doc | Documentation |
| `backlog-agent.ts` | @backlog | User stories |
| `reporter-agent.ts` | @reporter | Reports |

### Architecture Agents

**Location:** `src/agents/architecture/`

| File | Agent | Description |
|------|-------|-------------|
| `architect-agent.ts` | @architect | System design |
| `code-architect-agent.ts` | @code-architect | Code structure |
| `azure-architect-agent.ts` | @azure-architect | Azure design |

### Implementation Agents

**Location:** `src/agents/implementation/`

| File | Agent | Description |
|------|-------|-------------|
| `react-specialist.ts` | @react-specialist | React code |
| `nodejs-specialist.ts` | @nodejs-specialist | Node.js code |
| `dotnet-specialist.ts` | @dotnet-specialist | .NET code |
| `bicep-specialist.ts` | @bicep-specialist | Bicep templates |

### Quality Agents

**Location:** `src/agents/quality/`

| File | Agent | Description |
|------|-------|-------------|
| `qa-agent.ts` | @qa | Testing |
| `security-specialist.ts` | @security-specialist | Security |
| `devops-specialist.ts` | @devops-specialist | DevOps |

## Skill Module

**Location:** `src/skills/`

### Skill Loader

```typescript
// src/skills/loader.ts
export class SkillLoader {
  async load(skillId: string): Promise<Skill>;
  async loadAll(skillIds: string[]): Promise<Skill[]>;
  getAvailable(): string[];
}
```

### Skill Implementation

```typescript
// src/skills/implementations/architecture-diagrams.ts
export class ArchitectureDiagramsSkill implements ISkill {
  id = 'architecture-diagrams';
  
  async execute(context: SkillContext): Promise<SkillResult> {
    // Generate diagrams using Mermaid/PlantUML
    return {
      artifacts: [
        'diagrams/system-context.mmd',
        'diagrams/container.mmd'
      ]
    };
  }
}
```

## Validation Module

**Location:** `src/validation/`

### Framework

```typescript
// src/validation/framework.ts
export class ValidationFramework {
  registerValidator(validator: IValidator): void;
  async validate(artifact: Artifact): Promise<ValidationResult>;
  async validateAll(patterns: string[]): Promise<ValidationResult[]>;
}
```

### Validators

```typescript
// src/validation/validators/schema-validator.ts
export class SchemaValidator implements IValidator {
  async validate(artifact: Artifact): Promise<ValidationResult>;
}

// src/validation/validators/security-validator.ts
export class SecurityValidator implements IValidator {
  async validate(artifact: Artifact): Promise<ValidationResult>;
}
```

## Learning Module

**Location:** `src/learning/`

### Metrics Collector

```typescript
// src/learning/metrics.ts
export class MetricsCollector {
  record(metric: string, value: number, tags?: Tags): void;
  async query(metric: string, options: QueryOptions): Promise<MetricData>;
  async aggregate(metric: string, period: string): Promise<AggregateData>;
}
```

### Pattern Analyzer

```typescript
// src/learning/analyzer.ts
export class PatternAnalyzer {
  async analyze(metrics: MetricData[]): Promise<Pattern[]>;
  async detectAnomalies(metrics: MetricData[]): Promise<Anomaly[]>;
  async generateRecommendations(): Promise<Recommendation[]>;
}
```

## Utility Modules

### Logger

```typescript
// src/utils/logger.ts
export const logger = {
  debug: (message: string, meta?: object) => void,
  info: (message: string, meta?: object) => void,
  warn: (message: string, meta?: object) => void,
  error: (message: string, meta?: object) => void
};
```

### Configuration

```typescript
// src/utils/config.ts
export class Config {
  static load(path?: string): Config;
  get<T>(key: string, defaultValue?: T): T;
  set(key: string, value: any): void;
}
```

## CLI Module

**Location:** `src/cli/`

### Entry Point

```typescript
// src/cli/index.ts
import { program } from 'commander';

program
  .command('start')
  .description('Start a new workflow')
  .option('-s, --scenario <name>', 'Scenario to use')
  .action(startCommand);

program.parse();
```

### Commands

| Command | File | Description |
|---------|------|-------------|
| `start` | `commands/start.ts` | Start workflow |
| `status` | `commands/status.ts` | View status |
| `validate` | `commands/validate.ts` | Run validation |
| `avm` | `commands/avm.ts` | AVM operations |
| `learning` | `commands/learning.ts` | Learning system |

## Type Definitions

**Location:** `src/types/`

```typescript
// src/types/agent.ts
export interface IAgent { ... }
export interface AgentContext { ... }
export interface Task { ... }
export interface Result { ... }

// src/types/message.ts
export interface Message { ... }
export interface MessageHandler { ... }

// src/types/artifact.ts
export interface Artifact { ... }
export interface ArtifactMetadata { ... }

// src/types/validation.ts
export interface ValidationResult { ... }
export interface ValidationIssue { ... }
```

## Build Configuration

### TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Package Scripts

```json
// package.json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/cli/index.ts",
    "test": "vitest",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

## Dependencies

### Runtime

| Package | Purpose |
|---------|---------|
| `commander` | CLI framework |
| `ajv` | JSON Schema validation |
| `winston` | Logging |
| `glob` | File pattern matching |
| `yaml` | YAML parsing |

### Development

| Package | Purpose |
|---------|---------|
| `typescript` | TypeScript compiler |
| `tsx` | TypeScript execution |
| `vitest` | Testing |
| `eslint` | Linting |
| `prettier` | Formatting |

## Next Steps

- [Agent Base](../engine/Agent-Base) - Agent implementation
- [Workflow Engine](../engine/Workflow-Engine) - Orchestration
- [Building Agents](../guides/Building-Agents) - Create agents
