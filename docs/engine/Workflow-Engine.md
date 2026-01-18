# Workflow Engine

The core orchestration engine that drives AgenticCoder's multi-agent workflow.

## Overview

The Workflow Engine is the heart of AgenticCoder. It:
- Manages the 16-phase workflow
- Coordinates agent execution
- Handles message routing
- Tracks progress and state
- Enforces phase dependencies

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Engine                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Phase     │  │   Agent     │  │  Message    │         │
│  │  Manager    │  │  Scheduler  │  │    Bus      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   State     │  │  Artifact   │  │   Event     │         │
│  │   Store     │  │   Store     │  │   Emitter   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Phase Manager

Manages phase lifecycle and transitions.

```typescript
interface PhaseManager {
  currentPhase: number;
  phases: Phase[];
  
  startPhase(phaseNumber: number): Promise<void>;
  completePhase(phaseNumber: number): Promise<void>;
  skipPhase(phaseNumber: number, reason: string): Promise<void>;
  getPhaseStatus(phaseNumber: number): PhaseStatus;
}
```

**Responsibilities:**
- Track active phase
- Validate phase prerequisites
- Trigger phase transitions
- Handle phase skip logic

### Agent Scheduler

Schedules and manages agent execution.

```typescript
interface AgentScheduler {
  schedule(task: Task): Promise<string>;
  execute(taskId: string): Promise<Result>;
  cancel(taskId: string): Promise<void>;
  getStatus(taskId: string): TaskStatus;
}
```

**Scheduling Modes:**
- **Sequential** - One agent at a time
- **Parallel** - Multiple agents simultaneously
- **Priority** - High-priority tasks first

### State Store

Persists workflow state.

```typescript
interface StateStore {
  save(key: string, value: any): Promise<void>;
  load(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  checkpoint(): Promise<string>;
  restore(checkpointId: string): Promise<void>;
}
```

**Storage Locations:**
- `.agentic/state/` - Current state
- `.agentic/checkpoints/` - Recovery points

## Workflow Execution

### Starting a Workflow

```typescript
const engine = new WorkflowEngine(config);

await engine.initialize({
  scenario: 'S02',
  projectName: 'MyProject',
  settings: {
    parallelExecution: true,
    maxConcurrent: 3
  }
});

await engine.start();
```

### Phase Execution Flow

```
1. Load Phase Configuration
          │
          ▼
2. Validate Prerequisites
          │
          ▼
3. Initialize Phase Context
          │
          ▼
4. Schedule Phase Agents
          │
          ▼
5. Execute Agents (seq/parallel)
          │
          ▼
6. Collect Results
          │
          ▼
7. Validate Outputs
          │
          ▼
8. Trigger Next Phase
```

### Phase Configuration

Each phase has configuration in `.github/config/phases/`:

```yaml
# phase-5.yaml
phase: 5
name: "Code Architecture"
primaryAgent: "code-architect"
requiredPhases: [3, 4]
optional: false

agents:
  - id: code-architect
    skills:
      - folder-structure-patterns
      - code-organization-best-practices
    inputs:
      - architecture/system-design.md
      - plans/project-plan.md
    outputs:
      - code-structure/
      - patterns/

validation:
  required:
    - code-structure/README.md
    - code-structure/folder-tree.md
  
timeout: 300000
retries: 2
```

## State Management

### Workflow State

```typescript
interface WorkflowState {
  id: string;
  scenario: string;
  projectName: string;
  currentPhase: number;
  completedPhases: number[];
  skippedPhases: number[];
  artifacts: ArtifactReference[];
  startTime: Date;
  lastUpdate: Date;
  status: 'running' | 'paused' | 'completed' | 'failed';
}
```

### Checkpointing

Automatic checkpoints at:
- Phase completion
- Before risky operations
- On user request

```typescript
// Create checkpoint
const checkpointId = await engine.checkpoint('before-deployment');

// Restore from checkpoint
await engine.restore(checkpointId);
```

## Error Handling

### Error Types

| Error Type | Handling |
|------------|----------|
| Agent Failure | Retry with backoff |
| Validation Error | Re-run agent |
| Timeout | Skip or abort |
| Dependency Error | Wait or skip |
| Fatal Error | Abort workflow |

### Recovery Strategies

```typescript
const recoveryConfig = {
  onAgentFailure: {
    strategy: 'retry',
    maxRetries: 3,
    backoff: 'exponential'
  },
  onValidationFailure: {
    strategy: 'rerun',
    maxRetries: 2
  },
  onTimeout: {
    strategy: 'skip',
    notifyUser: true
  }
};
```

### Manual Intervention

```bash
# Pause workflow
node bin/agentic.js workflow pause

# Resume workflow
node bin/agentic.js workflow resume

# Skip current phase
node bin/agentic.js workflow skip-phase --reason "Manual skip"

# Abort workflow
node bin/agentic.js workflow abort
```

## Event System

### Events Emitted

| Event | Payload | When |
|-------|---------|------|
| `workflow:started` | config | Workflow begins |
| `workflow:completed` | summary | All phases done |
| `workflow:failed` | error | Fatal error |
| `phase:started` | phase | Phase begins |
| `phase:completed` | phase, artifacts | Phase ends |
| `agent:started` | agent, task | Agent begins |
| `agent:completed` | agent, result | Agent ends |

### Subscribing to Events

```typescript
engine.on('phase:completed', (event) => {
  console.log(`Phase ${event.phase} completed`);
  console.log(`Artifacts: ${event.artifacts.join(', ')}`);
});

engine.on('agent:completed', (event) => {
  console.log(`Agent ${event.agent} finished in ${event.duration}ms`);
});
```

## Configuration

### Engine Configuration

```yaml
# .agentic/config/engine.yaml
engine:
  parallelExecution: true
  maxConcurrentAgents: 3
  defaultTimeout: 300000
  checkpointInterval: 'phase'
  
  retry:
    enabled: true
    maxAttempts: 3
    backoffMultiplier: 2
    
  logging:
    level: 'info'
    destination: '.agentic/logs/'
```

### Scenario-Specific Overrides

```yaml
# scenarios/S03.yaml
overrides:
  engine:
    maxConcurrentAgents: 5
    defaultTimeout: 600000
```

## Monitoring

### Status Commands

```bash
# Current status
node bin/agentic.js status

# Detailed phase status
node bin/agentic.js status --phase 5

# Agent status
node bin/agentic.js status --agents
```

### Metrics

Engine tracks:
- Phase durations
- Agent execution times
- Token usage
- Error counts
- Retry attempts

```bash
node bin/agentic.js metrics --report
```

## Integration

### With Message Bus

```typescript
engine.messageBus.subscribe('agent:result', (message) => {
  engine.handleAgentResult(message);
});
```

### With Self-Learning

```typescript
engine.onPhaseComplete((phase, metrics) => {
  selfLearning.recordPhaseMetrics(phase, metrics);
});
```

### With Feedback Loop

```typescript
engine.onValidationFailure((phase, error) => {
  feedbackLoop.triggerCorrection(phase, error);
});
```

## CLI Commands

```bash
# Start new workflow
node bin/agentic.js start --scenario S02 --name MyProject

# Resume paused workflow
node bin/agentic.js resume

# Rerun specific phase
node bin/agentic.js rerun --phase 5

# View workflow history
node bin/agentic.js history
```

## Next Steps

- [Message Bus](Message-Bus) - Message routing
- [Phases](../agents/Phases) - Phase details
- [Agent Catalog](../agents/Catalog) - All agents
