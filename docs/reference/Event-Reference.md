# Event Reference

Event types and patterns for AgenticCoder workflows.

## Event Overview

AgenticCoder emits events throughout workflow execution:
- Workflow lifecycle events
- Phase events
- Agent events
- Validation events
- Learning events

## Event Structure

All events follow a common structure:

```typescript
interface AgenticEvent {
  id: string;           // Unique event ID (UUID)
  type: string;         // Event type identifier
  timestamp: string;    // ISO 8601 timestamp
  workflowId: string;   // Associated workflow
  correlationId?: string; // For tracing
  source: string;       // Event source component
  data: object;         // Event-specific payload
  metadata?: object;    // Additional metadata
}
```

## Workflow Events

### workflow:started

Emitted when a workflow begins execution.

```typescript
{
  id: "evt-123",
  type: "workflow:started",
  timestamp: "2024-01-15T10:00:00Z",
  workflowId: "wf-456",
  source: "engine",
  data: {
    scenario: "S02",
    phases: [1, 2, 3, 5, 7, 10, 13, 14, 15, 16],
    configuration: {
      parallelExecution: true,
      maxConcurrentAgents: 3
    }
  }
}
```

### workflow:completed

Emitted when workflow successfully completes.

```typescript
{
  id: "evt-124",
  type: "workflow:completed",
  timestamp: "2024-01-15T18:00:00Z",
  workflowId: "wf-456",
  source: "engine",
  data: {
    duration: 28800000,  // 8 hours in ms
    phasesCompleted: 10,
    agentInvocations: 45,
    artifactsGenerated: 127,
    validationsPassed: 127,
    summary: {
      plans: 3,
      documents: 15,
      diagrams: 8,
      code: 95,
      tests: 42,
      infrastructure: 12
    }
  }
}
```

### workflow:failed

Emitted when workflow fails.

```typescript
{
  id: "evt-125",
  type: "workflow:failed",
  timestamp: "2024-01-15T12:30:00Z",
  workflowId: "wf-456",
  source: "engine",
  data: {
    phase: 5,
    agent: "code-architect",
    error: {
      code: "AGENT_TIMEOUT",
      message: "Agent exceeded timeout of 300000ms",
      stack: "..."
    },
    canResume: true,
    lastCheckpoint: "phase-3-complete"
  }
}
```

### workflow:paused

Emitted when workflow is paused (human approval required).

```typescript
{
  id: "evt-126",
  type: "workflow:paused",
  timestamp: "2024-01-15T11:00:00Z",
  workflowId: "wf-456",
  source: "engine",
  data: {
    reason: "approval_required",
    phase: 3,
    checkpoint: "phase-3-pending-approval",
    requiredApprovals: ["architecture"],
    timeout: 3600000  // 1 hour
  }
}
```

### workflow:resumed

Emitted when workflow resumes after pause.

```typescript
{
  id: "evt-127",
  type: "workflow:resumed",
  timestamp: "2024-01-15T11:30:00Z",
  workflowId: "wf-456",
  source: "engine",
  data: {
    fromCheckpoint: "phase-3-pending-approval",
    approvals: {
      architecture: {
        approved: true,
        approver: "user@example.com",
        timestamp: "2024-01-15T11:25:00Z"
      }
    }
  }
}
```

## Phase Events

### phase:started

Emitted when a phase begins.

```typescript
{
  id: "evt-200",
  type: "phase:started",
  timestamp: "2024-01-15T10:30:00Z",
  workflowId: "wf-456",
  source: "engine",
  data: {
    phase: 5,
    name: "Code Architecture",
    agents: ["code-architect", "api-designer", "database-specialist"],
    expectedDuration: 3600000,
    dependencies: {
      fromPhases: [1, 2, 3],
      artifacts: [
        "plans/project-plan.md",
        "architecture/system.yaml"
      ]
    }
  }
}
```

### phase:completed

Emitted when a phase completes successfully.

```typescript
{
  id: "evt-201",
  type: "phase:completed",
  timestamp: "2024-01-15T11:45:00Z",
  workflowId: "wf-456",
  source: "engine",
  data: {
    phase: 5,
    name: "Code Architecture",
    duration: 4500000,  // 75 minutes
    agentInvocations: 8,
    artifacts: [
      { path: "architecture/code-design.md", type: "document" },
      { path: "architecture/api-spec.yaml", type: "openapi" },
      { path: "architecture/database-schema.sql", type: "sql" }
    ],
    validationResult: {
      valid: true,
      warnings: 2
    }
  }
}
```

### phase:failed

Emitted when a phase fails.

```typescript
{
  id: "evt-202",
  type: "phase:failed",
  timestamp: "2024-01-15T11:30:00Z",
  workflowId: "wf-456",
  source: "engine",
  data: {
    phase: 5,
    name: "Code Architecture",
    duration: 3600000,
    failedAgent: "database-specialist",
    error: {
      code: "VALIDATION_FAILED",
      message: "Schema validation failed for database design"
    },
    canRetry: true,
    retryCount: 1,
    maxRetries: 3
  }
}
```

## Agent Events

### agent:started

Emitted when an agent begins processing.

```typescript
{
  id: "evt-300",
  type: "agent:started",
  timestamp: "2024-01-15T10:35:00Z",
  workflowId: "wf-456",
  source: "agent-invoker",
  data: {
    agent: "architect",
    phase: 3,
    task: "design-system-architecture",
    inputs: [
      { name: "requirements", type: "document", path: "plans/requirements.md" }
    ],
    skills: ["system-design", "azure-architecture", "microservices"]
  }
}
```

### agent:completed

Emitted when agent completes successfully.

```typescript
{
  id: "evt-301",
  type: "agent:completed",
  timestamp: "2024-01-15T10:55:00Z",
  workflowId: "wf-456",
  source: "agent-invoker",
  data: {
    agent: "architect",
    phase: 3,
    duration: 1200000,  // 20 minutes
    outputs: [
      { path: "architecture/system.yaml", type: "yaml" },
      { path: "architecture/c4-context.mmd", type: "mermaid" },
      { path: "architecture/c4-container.mmd", type: "mermaid" }
    ],
    metrics: {
      tokensUsed: 15000,
      promptTokens: 5000,
      completionTokens: 10000
    }
  }
}
```

### agent:failed

Emitted when agent fails.

```typescript
{
  id: "evt-302",
  type: "agent:failed",
  timestamp: "2024-01-15T11:00:00Z",
  workflowId: "wf-456",
  source: "agent-invoker",
  data: {
    agent: "bicep-specialist",
    phase: 10,
    duration: 180000,
    error: {
      code: "AVM_MODULE_NOT_FOUND",
      message: "AVM module not found for resource type",
      details: {
        resourceType: "Microsoft.DocumentDB/databaseAccounts",
        requestedVersion: "0.10.0"
      }
    },
    retryable: true
  }
}
```

### agent:message

Emitted for inter-agent communication.

```typescript
{
  id: "evt-303",
  type: "agent:message",
  timestamp: "2024-01-15T10:40:00Z",
  workflowId: "wf-456",
  source: "message-bus",
  data: {
    from: "architect",
    to: "code-architect",
    messageType: "handoff",
    content: {
      architecture: "architecture/system.yaml",
      components: ["api-gateway", "user-service", "order-service"],
      patterns: ["microservices", "event-driven"]
    }
  }
}
```

## Validation Events

### validation:started

Emitted when validation begins.

```typescript
{
  id: "evt-400",
  type: "validation:started",
  timestamp: "2024-01-15T10:56:00Z",
  workflowId: "wf-456",
  source: "validation-framework",
  data: {
    artifacts: ["architecture/system.yaml"],
    validators: ["schema", "semantic", "security"]
  }
}
```

### validation:passed

Emitted when validation passes.

```typescript
{
  id: "evt-401",
  type: "validation:passed",
  timestamp: "2024-01-15T10:56:30Z",
  workflowId: "wf-456",
  source: "validation-framework",
  data: {
    artifact: "architecture/system.yaml",
    duration: 500,
    validators: {
      schema: { passed: true },
      semantic: { passed: true, warnings: 1 },
      security: { passed: true }
    }
  }
}
```

### validation:failed

Emitted when validation fails.

```typescript
{
  id: "evt-402",
  type: "validation:failed",
  timestamp: "2024-01-15T10:57:00Z",
  workflowId: "wf-456",
  source: "validation-framework",
  data: {
    artifact: "src/api/controller.ts",
    duration: 1200,
    errors: [
      {
        code: "SEC001",
        message: "Potential SQL injection vulnerability",
        severity: "error",
        line: 45,
        column: 12
      }
    ],
    autoFixAvailable: false
  }
}
```

### validation:fixed

Emitted when auto-fix is applied.

```typescript
{
  id: "evt-403",
  type: "validation:fixed",
  timestamp: "2024-01-15T10:57:30Z",
  workflowId: "wf-456",
  source: "validation-framework",
  data: {
    artifact: "src/api/model.ts",
    fixes: [
      {
        code: "FORMAT001",
        description: "Fixed indentation",
        line: 10
      }
    ],
    revalidationRequired: false
  }
}
```

## Learning Events

### learning:metrics-collected

Emitted when metrics are collected.

```typescript
{
  id: "evt-500",
  type: "learning:metrics-collected",
  timestamp: "2024-01-15T12:00:00Z",
  workflowId: "wf-456",
  source: "self-learning",
  data: {
    period: "1h",
    metrics: {
      agentPerformance: {
        "architect": { avgDuration: 1200000, successRate: 0.95 },
        "code-architect": { avgDuration: 900000, successRate: 0.98 }
      },
      validationMetrics: {
        passRate: 0.92,
        autoFixRate: 0.75
      }
    }
  }
}
```

### learning:pattern-detected

Emitted when a pattern is detected.

```typescript
{
  id: "evt-501",
  type: "learning:pattern-detected",
  timestamp: "2024-01-15T12:05:00Z",
  workflowId: "wf-456",
  source: "self-learning",
  data: {
    pattern: "slow_agent",
    agent: "bicep-specialist",
    confidence: 0.85,
    details: {
      avgDuration: 450000,
      threshold: 300000,
      samples: 15
    },
    suggestedAction: "increase_timeout"
  }
}
```

### learning:optimization-applied

Emitted when optimization is applied.

```typescript
{
  id: "evt-502",
  type: "learning:optimization-applied",
  timestamp: "2024-01-15T12:10:00Z",
  workflowId: "wf-456",
  source: "self-learning",
  data: {
    optimization: "timeout_adjustment",
    agent: "bicep-specialist",
    changes: {
      before: { timeout: 300000 },
      after: { timeout: 600000 }
    },
    approved: true,
    approver: "auto"
  }
}
```

## Feedback Events

### feedback:correction-requested

Emitted when human correction is requested.

```typescript
{
  id: "evt-600",
  type: "feedback:correction-requested",
  timestamp: "2024-01-15T11:30:00Z",
  workflowId: "wf-456",
  source: "feedback-loop",
  data: {
    artifact: "architecture/security.yaml",
    reason: "validation_failed",
    issues: [
      { code: "SEC005", message: "Missing encryption at rest" }
    ],
    agent: "security-architect",
    iteration: 2,
    maxIterations: 3
  }
}
```

### feedback:correction-applied

Emitted when correction is applied.

```typescript
{
  id: "evt-601",
  type: "feedback:correction-applied",
  timestamp: "2024-01-15T11:35:00Z",
  workflowId: "wf-456",
  source: "feedback-loop",
  data: {
    artifact: "architecture/security.yaml",
    correctedBy: "security-architect",
    changes: [
      {
        type: "addition",
        path: "$.encryption.atRest",
        value: { enabled: true, keySource: "Microsoft.KeyVault" }
      }
    ],
    validationPassed: true
  }
}
```

## Event Subscriptions

### TypeScript API

```typescript
import { EventBus } from '@agentic/core';

const bus = new EventBus();

// Subscribe to specific event
bus.on('workflow:completed', (event) => {
  console.log(`Workflow ${event.workflowId} completed`);
});

// Subscribe to event pattern
bus.on('agent:*', (event) => {
  console.log(`Agent event: ${event.type}`);
});

// Subscribe to all events
bus.on('*', (event) => {
  logEvent(event);
});

// Unsubscribe
const handler = (event) => { /* ... */ };
bus.on('phase:completed', handler);
bus.off('phase:completed', handler);
```

### Webhook Integration

```yaml
# .agentic/config/webhooks.yaml

webhooks:
  - name: "Slack Notifications"
    url: "https://hooks.slack.com/services/xxx"
    events:
      - "workflow:completed"
      - "workflow:failed"
    format: "slack"
    
  - name: "Custom Logger"
    url: "https://api.example.com/events"
    events:
      - "*"
    headers:
      Authorization: "Bearer ${env:WEBHOOK_TOKEN}"
    format: "json"
```

## Event Filtering

```typescript
// Filter by event type
const completionEvents = events.filter(e => 
  e.type.endsWith(':completed')
);

// Filter by time range
const recentEvents = events.filter(e =>
  new Date(e.timestamp) > new Date(Date.now() - 3600000)
);

// Filter by agent
const architectEvents = events.filter(e =>
  e.data?.agent === 'architect'
);
```

## Next Steps

- [CLI Reference](CLI-Reference) - Command-line interface
- [Schema Reference](Schema-Reference) - Schema definitions
- [Error Reference](Error-Reference) - Error codes
