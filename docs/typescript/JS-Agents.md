# JavaScript Agent Runtime

Runtime implementation for AgenticCoder JavaScript agents.

## Overview

The JavaScript Agent Runtime provides:
- Agent execution environment
- Skill loading and invocation
- Message bus integration
- Artifact management
- Error handling and recovery

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  JS Agent Runtime                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Agent     │  │    Skill    │  │   Context   │         │
│  │   Loader    │  │   Loader    │  │   Manager   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Execution Environment              │       │
│  └─────────────────────────────────────────────────┘       │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Message   │  │   Artifact  │  │   Logger    │        │
│  │     Bus     │  │    Store    │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Agent Implementations

### Available JS Agents

| Agent | File | Purpose |
|-------|------|---------|
| Plan Agent | `plan.agent.js` | Project planning |
| Doc Agent | `doc.agent.js` | Documentation |
| Backlog Agent | `backlog.agent.js` | User stories |
| Architect Agent | `architect.agent.js` | System design |
| Code Architect | `code-architect.agent.js` | Code structure |
| React Specialist | `react-specialist.agent.js` | React development |
| Node.js Specialist | `nodejs-specialist.agent.js` | Node.js development |
| .NET Specialist | `dotnet-specialist.agent.js` | .NET development |
| Azure Architect | `azure-architect.agent.js` | Azure architecture |
| Bicep Specialist | `bicep-specialist.agent.js` | Bicep templates |
| QA Agent | `qa.agent.js` | Testing |
| Security Specialist | `security-specialist.agent.js` | Security |
| DevOps Specialist | `devops-specialist.agent.js` | CI/CD |
| Reporter Agent | `reporter.agent.js` | Reports |
| Orchestrator | `orchestrator.agent.js` | Coordination |

### Agent Structure

```javascript
// agents/plan.agent.js
module.exports = {
  id: 'plan',
  name: 'Plan Agent',
  description: 'Creates project plans',
  
  skills: [
    'project-planning',
    'timeline-estimation',
    'risk-assessment'
  ],
  
  async initialize(context) {
    this.context = context;
    this.logger = context.logger.child({ agent: this.id });
    this.logger.info('Plan Agent initialized');
  },
  
  async execute(task) {
    this.logger.info('Executing task', { taskId: task.id });
    
    try {
      // Read inputs
      const requirements = await this.context.artifacts.read(
        task.inputs.files[0]
      );
      
      // Use skill
      const planSkill = await this.context.skills.load('project-planning');
      const plan = await planSkill.execute({
        requirements,
        projectName: task.inputs.parameters.projectName
      });
      
      // Write output
      const artifact = await this.context.artifacts.write(
        'plans/project-plan.md',
        plan.content
      );
      
      return {
        taskId: task.id,
        status: 'success',
        outputs: {
          artifacts: [artifact],
          messages: ['Project plan created']
        },
        metrics: {
          duration: Date.now() - task.startTime,
          tokensUsed: plan.tokensUsed
        }
      };
      
    } catch (error) {
      this.logger.error('Task failed', { error });
      
      return {
        taskId: task.id,
        status: 'failed',
        outputs: { artifacts: [], messages: [] },
        metrics: { duration: 0, tokensUsed: 0 },
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message,
          recoverable: true
        }
      };
    }
  },
  
  async cleanup() {
    this.logger.info('Plan Agent cleaned up');
  }
};
```

## Runtime API

### AgentRuntime Class

```javascript
class AgentRuntime {
  constructor(config) {
    this.config = config;
    this.agents = new Map();
    this.context = null;
  }
  
  // Initialize runtime
  async initialize() {
    this.context = await this.createContext();
    await this.loadAgents();
  }
  
  // Load an agent
  async loadAgent(agentId) {
    const agentPath = path.join(this.config.agentsDir, `${agentId}.agent.js`);
    const agent = require(agentPath);
    
    await agent.initialize(this.context);
    this.agents.set(agentId, agent);
    
    return agent;
  }
  
  // Execute agent task
  async executeTask(agentId, task) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    return await agent.execute(task);
  }
  
  // Shutdown runtime
  async shutdown() {
    for (const agent of this.agents.values()) {
      await agent.cleanup();
    }
    this.agents.clear();
  }
}
```

### Context Object

```javascript
// Context provided to agents
const context = {
  // Workflow info
  workflowId: 'wf-123',
  scenario: 'S02',
  projectName: 'MyProject',
  currentPhase: 1,
  
  // Services
  artifacts: {
    read: async (path) => { /* ... */ },
    write: async (path, content) => { /* ... */ },
    exists: async (path) => { /* ... */ },
    list: async (dir) => { /* ... */ }
  },
  
  skills: {
    load: async (skillId) => { /* ... */ },
    loadAll: async (skillIds) => { /* ... */ }
  },
  
  messageBus: {
    publish: async (message) => { /* ... */ },
    subscribe: (topic, handler) => { /* ... */ },
    request: async (message, timeout) => { /* ... */ }
  },
  
  logger: {
    debug: (msg, meta) => { /* ... */ },
    info: (msg, meta) => { /* ... */ },
    warn: (msg, meta) => { /* ... */ },
    error: (msg, meta) => { /* ... */ },
    child: (meta) => { /* ... */ }
  },
  
  // Configuration
  config: {
    get: (key, defaultValue) => { /* ... */ }
  },
  
  // Shared state
  state: new Map()
};
```

## Skill Invocation

### Loading Skills

```javascript
// Load single skill
const skill = await context.skills.load('architecture-diagrams');

// Load multiple skills
const skills = await context.skills.loadAll([
  'architecture-diagrams',
  'component-design',
  'api-contracts'
]);
```

### Executing Skills

```javascript
// Execute skill
const result = await skill.execute({
  input: inputData,
  options: {
    format: 'mermaid',
    includeSequence: true
  }
});

// Handle result
if (result.success) {
  console.log('Skill output:', result.outputs);
  console.log('Tokens used:', result.tokensUsed);
} else {
  console.error('Skill failed:', result.error);
}
```

## Message Communication

### Publishing Messages

```javascript
// Publish task message
await context.messageBus.publish({
  type: 'task',
  to: 'architect-agent',
  topic: 'agents.architect',
  payload: {
    action: 'create-design',
    projectPlan: 'plans/project-plan.md'
  }
});

// Broadcast event
await context.messageBus.publish({
  type: 'event',
  topic: 'phases.completed',
  payload: { phase: 1 }
});
```

### Subscribing to Messages

```javascript
// Subscribe to topic
const subscription = context.messageBus.subscribe(
  'agents.plan',
  async (message) => {
    console.log('Received message:', message);
    await handleMessage(message);
  }
);

// Later: unsubscribe
subscription.unsubscribe();
```

### Request/Response

```javascript
// Send request and wait for response
const response = await context.messageBus.request({
  to: 'validation-service',
  payload: { artifact: 'output.ts' }
}, 30000); // 30s timeout

console.log('Validation result:', response.payload);
```

## Artifact Management

### Reading Artifacts

```javascript
// Read single file
const content = await context.artifacts.read('requirements.md');

// Check existence
if (await context.artifacts.exists('plans/project-plan.md')) {
  const plan = await context.artifacts.read('plans/project-plan.md');
}

// List directory
const files = await context.artifacts.list('architecture/');
```

### Writing Artifacts

```javascript
// Write file
const artifact = await context.artifacts.write(
  'output/result.md',
  markdownContent,
  {
    createdBy: 'plan-agent',
    phase: 1,
    tags: ['plan', 'generated']
  }
);

console.log('Written:', artifact.path);
```

## Error Handling

### Try/Catch Pattern

```javascript
async execute(task) {
  try {
    const result = await this.performTask(task);
    return this.success(task.id, result);
  } catch (error) {
    return this.failure(task.id, error);
  }
}

success(taskId, result) {
  return {
    taskId,
    status: 'success',
    outputs: result.outputs,
    metrics: result.metrics
  };
}

failure(taskId, error) {
  this.logger.error('Task failed', { taskId, error });
  
  return {
    taskId,
    status: 'failed',
    outputs: { artifacts: [], messages: [] },
    metrics: { duration: 0, tokensUsed: 0 },
    error: {
      code: this.classifyError(error),
      message: error.message,
      recoverable: this.isRecoverable(error)
    }
  };
}
```

### Retry Logic

```javascript
async executeWithRetry(task, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.execute(task);
    } catch (error) {
      lastError = error;
      this.logger.warn(`Attempt ${attempt} failed`, { error });
      
      if (!this.isRetryable(error) || attempt === maxRetries) {
        break;
      }
      
      await this.delay(1000 * Math.pow(2, attempt - 1));
    }
  }
  
  return this.failure(task.id, lastError);
}
```

## Configuration

### Runtime Configuration

```javascript
// runtime.config.js
module.exports = {
  agentsDir: '.github/agents/js/',
  skillsDir: '.github/skills/js/',
  
  execution: {
    timeout: 60000,
    maxRetries: 3,
    parallelAgents: 3
  },
  
  logging: {
    level: 'info',
    format: 'json'
  },
  
  artifacts: {
    baseDir: '.agentic/artifacts/',
    versioning: true
  }
};
```

### Loading Configuration

```javascript
const config = require('./runtime.config');
const runtime = new AgentRuntime(config);
await runtime.initialize();
```

## Usage

### Running Agents

```javascript
// Initialize runtime
const runtime = new AgentRuntime(config);
await runtime.initialize();

// Execute task
const result = await runtime.executeTask('plan', {
  id: 'task-123',
  type: 'create-plan',
  inputs: {
    files: ['requirements.md'],
    parameters: { projectName: 'MyProject' }
  }
});

// Shutdown
await runtime.shutdown();
```

### CLI Integration

```bash
# Run agent task
node bin/agentic.js agent run plan --task create-plan

# List agents
node bin/agentic.js agent list

# Agent status
node bin/agentic.js agent status plan
```

## Next Steps

- [Agent Base](../engine/Agent-Base) - Base class
- [Agent Catalog](../agents/Catalog) - All agents
- [TypeScript Overview](Overview) - TypeScript modules
