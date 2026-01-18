# Agent Communication

How agents communicate and hand off work to each other in AgenticCoder.

## Communication Model

AgenticCoder uses a **message-based** communication model where agents exchange structured messages through a central message bus.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Agent A   │────▶│ Message Bus │────▶│   Agent B   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │           ┌─────────────┐             │
       └──────────▶│  Artifacts  │◀────────────┘
                   └─────────────┘
```

## Message Types

### Task Message

Sent when assigning work to an agent.

```json
{
  "type": "task",
  "from": "orchestrator",
  "to": "plan-agent",
  "payload": {
    "taskId": "T001",
    "phase": 1,
    "action": "create-project-plan",
    "context": {
      "projectName": "MyProject",
      "scenario": "S02"
    }
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Result Message

Returned when agent completes work.

```json
{
  "type": "result",
  "from": "plan-agent",
  "to": "orchestrator",
  "payload": {
    "taskId": "T001",
    "status": "completed",
    "artifacts": [
      "plans/project-plan.md"
    ],
    "metrics": {
      "duration": 5200,
      "tokensUsed": 3500
    }
  },
  "timestamp": "2024-01-15T10:00:05Z"
}
```

### Handoff Message

Used for agent-to-agent transitions.

```json
{
  "type": "handoff",
  "from": "plan-agent",
  "to": "architect-agent",
  "payload": {
    "reason": "Phase 1 complete, architecture needed",
    "context": {
      "projectPlan": "plans/project-plan.md",
      "requirements": "docs/requirements.md"
    }
  },
  "timestamp": "2024-01-15T10:00:05Z"
}
```

### Event Message

Broadcasts system events.

```json
{
  "type": "event",
  "from": "system",
  "to": "broadcast",
  "payload": {
    "event": "phase-completed",
    "phase": 1,
    "nextPhase": 2
  },
  "timestamp": "2024-01-15T10:00:05Z"
}
```

## Handoff Matrix

### Planning Phase Handoffs

| From | To | Trigger | Data Passed |
|------|-----|---------|-------------|
| @plan | @doc | Plan complete | Project plan |
| @doc | @backlog | Docs complete | Requirements |
| @backlog | @architect | Backlog ready | User stories |
| @architect | @code-architect | Architecture done | Diagrams |
| @code-architect | @azure-architect | Code arch done | Structure |

### Architecture Phase Handoffs

| From | To | Trigger | Data Passed |
|------|-----|---------|-------------|
| @azure-architect | @bicep-specialist | Azure design done | Resource list |
| @bicep-specialist | @azure-infrastructure | Templates ready | Bicep files |
| @azure-infrastructure | @security-specialist | Infra deployed | Resources |
| @security-specialist | @pipeline | Security config done | Policies |

### Implementation Phase Handoffs

| From | To | Trigger | Data Passed |
|------|-----|---------|-------------|
| @react-specialist | @nodejs-specialist | Frontend done | API contracts |
| @nodejs-specialist | @database-specialist | Backend done | Schema needs |
| @dotnet-specialist | @database-specialist | Backend done | Schema needs |
| @database-specialist | @qa | DB ready | Connection info |

### Quality Phase Handoffs

| From | To | Trigger | Data Passed |
|------|-----|---------|-------------|
| @qa | @devops-specialist | Tests written | Test config |
| @devops-specialist | @pipeline | DevOps setup | Pipeline files |
| @pipeline | @reporter | Pipeline ready | Status |
| @reporter | @orchestrator | Report done | Final report |

## Context Sharing

Agents share context through:

### 1. Artifact References

Agents reference artifacts by path:

```json
{
  "contextFiles": [
    "plans/project-plan.md",
    "architecture/system-design.md",
    "requirements/user-stories.md"
  ]
}
```

### 2. Shared Memory

In-memory context for the current session:

```json
{
  "projectName": "MyProject",
  "scenario": "S02",
  "currentPhase": 5,
  "decisions": [
    {
      "topic": "database",
      "choice": "PostgreSQL",
      "reason": "Team expertise"
    }
  ]
}
```

### 3. Skill Outputs

Skills produce structured outputs:

```json
{
  "skill": "architecture-diagrams",
  "outputs": {
    "systemContext": "diagrams/system-context.svg",
    "componentDiagram": "diagrams/components.svg",
    "sequenceDiagram": "diagrams/sequence.svg"
  }
}
```

## Error Handling

### Retry Strategy

```json
{
  "retry": {
    "maxAttempts": 3,
    "backoff": "exponential",
    "initialDelay": 1000,
    "maxDelay": 30000
  }
}
```

### Fallback Agents

Some agents have fallback alternatives:

| Primary Agent | Fallback | Condition |
|---------------|----------|-----------|
| @azure-architect | @architect | Azure not needed |
| @cosmos-specialist | @database-specialist | Cosmos not needed |
| @nextjs-specialist | @react-specialist | Next.js not needed |

### Error Escalation

1. **Agent Retry** - Agent retries failed operation
2. **Orchestrator Retry** - Orchestrator reassigns task
3. **Human Intervention** - Escalate to user
4. **Phase Abort** - Skip phase with warning

## Communication Patterns

### Sequential Pattern

One agent after another:

```
Plan → Doc → Backlog → Architect → Code
```

### Parallel Pattern

Multiple agents simultaneously:

```
          ┌─▶ React ──────┐
Backend ──┼─▶ API ────────┼──▶ Integration
          └─▶ Database ───┘
```

### Fan-Out/Fan-In Pattern

One to many, then aggregate:

```
                    ┌─▶ Security ──┐
Architect ──────────┼─▶ Azure ─────┼──▶ Aggregator
                    └─▶ Network ───┘
```

### Feedback Loop Pattern

Iterative improvement:

```
Code ─▶ Review ─▶ Fix ─▶ Review ─▶ Approve
         │               ▲
         └───────────────┘
```

## Monitoring Communication

### Message Logging

All messages are logged to:
- `.agentic/logs/messages.jsonl`

### Communication Metrics

Tracked in `.agentic/metrics/`:
- Message counts per agent
- Average response times
- Error rates
- Handoff success rates

### Dashboard View

```bash
node bin/agentic.js monitor --view communication
```

Shows:
- Active agents
- Message queue depth
- Recent handoffs
- Error alerts

## Best Practices

### 1. Minimize Context

Pass only necessary context to reduce token usage.

### 2. Validate Handoffs

Always validate artifact existence before handoff.

### 3. Log Everything

Enable verbose logging during development.

### 4. Handle Timeouts

Set appropriate timeouts for long-running agents.

### 5. Use Structured Messages

Always use the defined message schema.

## Next Steps

- [Message Bus](../engine/Message-Bus) - Bus implementation
- [Agent Catalog](Catalog) - All agents
- [Workflow Engine](../engine/Workflow-Engine) - Orchestration
