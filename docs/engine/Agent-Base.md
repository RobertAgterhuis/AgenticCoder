# Agent Base

The foundational class and interfaces for all AgenticCoder agents.

## Overview

Agent Base provides:
- **Common Interface** - Standard agent contract
- **Lifecycle Management** - Initialize, execute, cleanup
- **Skill Integration** - Loading and using skills
- **Context Management** - Accessing workflow context
- **Error Handling** - Consistent error patterns

## Agent Interface

### Base Interface

```typescript
interface IAgent {
  // Identity
  id: string;
  name: string;
  description: string;
  
  // Configuration
  skills: string[];
  inputs: string[];
  outputs: string[];
  
  // Lifecycle
  initialize(context: AgentContext): Promise<void>;
  execute(task: Task): Promise<Result>;
  cleanup(): Promise<void>;
  
  // Status
  getStatus(): AgentStatus;
  getCapabilities(): Capability[];
}
```

### Agent Context

```typescript
interface AgentContext {
  // Workflow context
  workflowId: string;
  scenario: string;
  projectName: string;
  currentPhase: number;
  
  // Services
  messageBus: IMessageBus;
  artifactStore: IArtifactStore;
  skillLoader: ISkillLoader;
  logger: ILogger;
  
  // Configuration
  config: AgentConfig;
  
  // Shared state
  sharedState: Map<string, any>;
}
```

### Task and Result

```typescript
interface Task {
  id: string;
  type: string;
  description: string;
  
  inputs: {
    files: string[];
    parameters: Record<string, any>;
  };
  
  expectedOutputs: string[];
  timeout: number;
  retryPolicy: RetryPolicy;
}

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
  };
  
  error?: AgentError;
}
```

## Base Agent Class

### Implementation

```typescript
abstract class BaseAgent implements IAgent {
  id: string;
  name: string;
  description: string;
  
  protected context: AgentContext;
  protected skills: Map<string, Skill>;
  protected logger: ILogger;
  
  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
  }
  
  async initialize(context: AgentContext): Promise<void> {
    this.context = context;
    this.logger = context.logger.child({ agent: this.id });
    
    // Load skills
    await this.loadSkills();
    
    // Agent-specific initialization
    await this.onInitialize();
    
    this.logger.info('Agent initialized');
  }
  
  async execute(task: Task): Promise<Result> {
    this.logger.info('Executing task', { taskId: task.id });
    
    const startTime = Date.now();
    
    try {
      // Pre-execution hook
      await this.onBeforeExecute(task);
      
      // Main execution (implemented by subclass)
      const result = await this.doExecute(task);
      
      // Post-execution hook
      await this.onAfterExecute(task, result);
      
      return {
        ...result,
        metrics: {
          ...result.metrics,
          duration: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return this.handleError(task, error, Date.now() - startTime);
    }
  }
  
  async cleanup(): Promise<void> {
    await this.onCleanup();
    this.logger.info('Agent cleaned up');
  }
  
  // Abstract methods - must be implemented by subclasses
  protected abstract doExecute(task: Task): Promise<Result>;
  
  // Optional hooks
  protected async onInitialize(): Promise<void> {}
  protected async onBeforeExecute(task: Task): Promise<void> {}
  protected async onAfterExecute(task: Task, result: Result): Promise<void> {}
  protected async onCleanup(): Promise<void> {}
  
  // Skill management
  protected async loadSkills(): Promise<void> {
    for (const skillId of this.config.skills) {
      const skill = await this.context.skillLoader.load(skillId);
      this.skills.set(skillId, skill);
    }
  }
  
  protected getSkill(skillId: string): Skill {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error(`Skill not found: ${skillId}`);
    return skill;
  }
  
  // Error handling
  protected handleError(task: Task, error: Error, duration: number): Result {
    this.logger.error('Task failed', { taskId: task.id, error });
    
    return {
      taskId: task.id,
      status: 'failed',
      outputs: { artifacts: [], messages: [] },
      metrics: { duration, tokensUsed: 0 },
      error: {
        code: 'EXECUTION_ERROR',
        message: error.message,
        stack: error.stack
      }
    };
  }
}
```

## Creating a New Agent

### Step 1: Define Agent Configuration

```yaml
# .github/agents/my-agent.yaml
id: my-agent
name: My Custom Agent
description: Does something useful

skills:
  - my-skill-1
  - my-skill-2

inputs:
  - requirements.md
  - architecture.md

outputs:
  - my-output/

phases: [5, 6]

config:
  maxTokens: 4000
  temperature: 0.7
```

### Step 2: Implement Agent Class

```typescript
// src/agents/my-agent.ts
import { BaseAgent, Task, Result } from '../core/agent-base';

export class MyAgent extends BaseAgent {
  protected async doExecute(task: Task): Promise<Result> {
    // 1. Read inputs
    const requirements = await this.readArtifact(task.inputs.files[0]);
    
    // 2. Use skills
    const skill = this.getSkill('my-skill-1');
    const skillResult = await skill.execute({
      input: requirements
    });
    
    // 3. Generate output
    const output = await this.generateOutput(skillResult);
    
    // 4. Write artifact
    const artifact = await this.writeArtifact('my-output/result.md', output);
    
    return {
      taskId: task.id,
      status: 'success',
      outputs: {
        artifacts: [artifact],
        messages: ['Successfully generated output']
      },
      metrics: {
        duration: 0,  // Will be set by base class
        tokensUsed: skillResult.tokensUsed
      }
    };
  }
  
  private async generateOutput(data: any): Promise<string> {
    // Generation logic
    return `# Output\n\n${JSON.stringify(data, null, 2)}`;
  }
}
```

### Step 3: Register Agent

```typescript
// src/agents/index.ts
import { MyAgent } from './my-agent';

export const agents = {
  'my-agent': MyAgent,
  // ... other agents
};
```

## Helper Methods

### Artifact Operations

```typescript
abstract class BaseAgent {
  // Read artifact from store
  protected async readArtifact(path: string): Promise<string> {
    return this.context.artifactStore.read(path);
  }
  
  // Write artifact to store
  protected async writeArtifact(path: string, content: string): Promise<Artifact> {
    return this.context.artifactStore.write(path, content);
  }
  
  // Check if artifact exists
  protected async artifactExists(path: string): Promise<boolean> {
    return this.context.artifactStore.exists(path);
  }
  
  // List artifacts in directory
  protected async listArtifacts(dir: string): Promise<string[]> {
    return this.context.artifactStore.list(dir);
  }
}
```

### Message Bus Operations

```typescript
abstract class BaseAgent {
  // Send message to another agent
  protected async sendMessage(to: string, payload: any): Promise<void> {
    await this.context.messageBus.publish({
      type: 'message',
      from: this.id,
      to,
      payload
    });
  }
  
  // Broadcast event
  protected async broadcast(event: string, payload: any): Promise<void> {
    await this.context.messageBus.broadcast({
      type: 'event',
      from: this.id,
      topic: event,
      payload
    });
  }
  
  // Request with response
  protected async request(to: string, payload: any): Promise<any> {
    return this.context.messageBus.request({
      type: 'request',
      from: this.id,
      to,
      payload
    });
  }
}
```

### Configuration Access

```typescript
abstract class BaseAgent {
  // Get config value
  protected getConfig<T>(key: string, defaultValue?: T): T {
    return this.config[key] ?? defaultValue;
  }
  
  // Get shared state
  protected getSharedState<T>(key: string): T | undefined {
    return this.context.sharedState.get(key);
  }
  
  // Set shared state
  protected setSharedState(key: string, value: any): void {
    this.context.sharedState.set(key, value);
  }
}
```

## Agent Patterns

### Sequential Processing

```typescript
class SequentialAgent extends BaseAgent {
  protected async doExecute(task: Task): Promise<Result> {
    const results: any[] = [];
    
    for (const input of task.inputs.files) {
      const result = await this.processInput(input);
      results.push(result);
    }
    
    return this.combineResults(results);
  }
}
```

### Parallel Processing

```typescript
class ParallelAgent extends BaseAgent {
  protected async doExecute(task: Task): Promise<Result> {
    const promises = task.inputs.files.map(input => 
      this.processInput(input)
    );
    
    const results = await Promise.all(promises);
    return this.combineResults(results);
  }
}
```

### Skill Composition

```typescript
class ComposedAgent extends BaseAgent {
  protected async doExecute(task: Task): Promise<Result> {
    // Chain skills
    const analysis = await this.getSkill('analyze').execute(task);
    const plan = await this.getSkill('plan').execute(analysis);
    const output = await this.getSkill('generate').execute(plan);
    
    return this.buildResult(output);
  }
}
```

## Testing Agents

### Unit Testing

```typescript
describe('MyAgent', () => {
  let agent: MyAgent;
  let mockContext: AgentContext;
  
  beforeEach(() => {
    mockContext = createMockContext();
    agent = new MyAgent(config);
  });
  
  it('should execute task successfully', async () => {
    await agent.initialize(mockContext);
    
    const task = createTask({
      inputs: ['test-input.md']
    });
    
    const result = await agent.execute(task);
    
    expect(result.status).toBe('success');
    expect(result.outputs.artifacts).toHaveLength(1);
  });
});
```

### Integration Testing

```typescript
describe('MyAgent Integration', () => {
  it('should integrate with workflow', async () => {
    const workflow = new TestWorkflow();
    workflow.registerAgent('my-agent', MyAgent);
    
    const result = await workflow.runPhase(5);
    
    expect(result.agentResults['my-agent'].status).toBe('success');
  });
});
```

## Next Steps

- [Agent Catalog](../agents/Catalog) - All agents
- [Skills](../agents/Skills) - Skill system
- [Workflow Engine](Workflow-Engine) - Orchestration
