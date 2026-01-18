# Orchestration Monitor

Real-time monitoring and observability for AgenticCoder workflows.

## Overview

The Orchestration Monitor provides:
- **Real-Time Status** - Current workflow and agent state
- **Progress Tracking** - Phase and task completion
- **Performance Metrics** - Duration, tokens, success rates
- **Alerting** - Notifications for issues
- **Dashboards** - Visual workflow representation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Orchestration Monitor                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Status    │  │   Metrics   │  │   Alert     │         │
│  │  Collector  │  │  Aggregator │  │   Manager   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Dashboard / API                     │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Status Tracking

### Workflow Status

```typescript
interface WorkflowStatus {
  id: string;
  name: string;
  scenario: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  
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
    remaining: number;
  };
  
  currentActivity: {
    phase: number;
    agent: string;
    task: string;
    started: Date;
  };
}
```

### Agent Status

```typescript
interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'waiting';
  
  currentTask?: {
    id: string;
    description: string;
    started: Date;
    progress?: number;
  };
  
  metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    averageDuration: number;
    tokensUsed: number;
  };
}
```

### Phase Status

```typescript
interface PhaseStatus {
  phase: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  
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
  
  timing: {
    started?: Date;
    completed?: Date;
    duration?: number;
  };
}
```

## Metrics Collection

### Collected Metrics

| Category | Metric | Description |
|----------|--------|-------------|
| Performance | `agent.duration` | Agent execution time |
| Performance | `phase.duration` | Phase completion time |
| Performance | `workflow.duration` | Total workflow time |
| Resources | `tokens.used` | LLM tokens consumed |
| Resources | `tokens.rate` | Tokens per minute |
| Quality | `validation.pass_rate` | % validations passed |
| Quality | `correction.count` | Number of corrections |
| Reliability | `error.count` | Errors encountered |
| Reliability | `retry.count` | Retry attempts |

### Metric Storage

```typescript
// Real-time metrics
const metrics = new MetricsStore({
  retention: '7d',
  aggregation: ['1m', '5m', '1h', '1d']
});

// Record metric
metrics.record('agent.duration', 5200, {
  agent: 'plan',
  phase: 1,
  scenario: 'S02'
});

// Query metrics
const avgDuration = await metrics.query('agent.duration', {
  agent: 'plan',
  period: '24h',
  aggregation: 'avg'
});
```

## Dashboard

### CLI Dashboard

```bash
# Real-time dashboard
node bin/agentic.js monitor

# Output:
# ┌─────────────────────────────────────────────────────────┐
# │ AgenticCoder Monitor - MyProject (S02)                  │
# ├─────────────────────────────────────────────────────────┤
# │ Status: RUNNING          Progress: ████████░░ 80%      │
# │ Phase: 13/16             Elapsed: 00:45:23             │
# │ Est. Remaining: 00:11:20                                │
# ├─────────────────────────────────────────────────────────┤
# │ Current Activity:                                       │
# │ Phase 13: Frontend Implementation                       │
# │ Agent: react-specialist (running 00:02:15)             │
# │ Task: Creating React components                         │
# ├─────────────────────────────────────────────────────────┤
# │ Recent Completions:                                     │
# │ ✓ Phase 12: Database Setup (00:05:22)                  │
# │ ✓ Phase 11: Backend Development (00:12:45)             │
# └─────────────────────────────────────────────────────────┘
```

### Phase View

```bash
node bin/agentic.js monitor --phases

# Phase Status:
# ┌───────┬──────────────────────────┬──────────┬──────────┐
# │ Phase │ Name                     │ Status   │ Duration │
# ├───────┼──────────────────────────┼──────────┼──────────┤
# │   1   │ Initial Planning         │ ✓ Done   │ 00:03:12 │
# │   2   │ Documentation            │ ✓ Done   │ 00:02:45 │
# │   3   │ Requirements             │ ✓ Done   │ 00:04:30 │
# │  ...  │ ...                      │ ...      │ ...      │
# │  13   │ Frontend Implementation  │ ▶ Running│ 00:02:15 │
# │  14   │ Integration              │ ○ Pending│ -        │
# └───────┴──────────────────────────┴──────────┴──────────┘
```

### Agent View

```bash
node bin/agentic.js monitor --agents

# Agent Status:
# ┌─────────────────────┬──────────┬───────┬───────┬────────┐
# │ Agent               │ Status   │ Tasks │ Avg   │ Tokens │
# ├─────────────────────┼──────────┼───────┼───────┼────────┤
# │ plan                │ ✓ Done   │  1/1  │ 3.2s  │ 2,500  │
# │ doc                 │ ✓ Done   │  1/1  │ 2.8s  │ 1,800  │
# │ react-specialist    │ ▶ Running│  2/5  │ 8.5s  │ 4,200  │
# │ nodejs-specialist   │ ○ Idle   │  0/3  │ -     │ -      │
# └─────────────────────┴──────────┴───────┴───────┴────────┘
```

## Alerting

### Alert Rules

```yaml
# .agentic/config/alerts.yaml
alerts:
  - name: slow_agent
    condition: agent.duration > 30000
    severity: warning
    action: notify
    
  - name: high_token_usage
    condition: tokens.rate > 1000/min
    severity: warning
    action: throttle
    
  - name: validation_failure
    condition: validation.pass_rate < 0.8
    severity: error
    action: pause_and_notify
    
  - name: agent_failure
    condition: agent.status == 'failed'
    severity: critical
    action: notify_and_escalate
```

### Alert Actions

| Action | Description |
|--------|-------------|
| `notify` | Send notification (VS Code, email) |
| `throttle` | Slow down execution |
| `pause_and_notify` | Pause workflow, notify user |
| `notify_and_escalate` | Notify user and log for review |
| `auto_remediate` | Attempt automatic fix |

### Notification Channels

```yaml
notifications:
  vscode:
    enabled: true
    severity: [warning, error, critical]
    
  email:
    enabled: false
    recipients: [admin@example.com]
    severity: [critical]
    
  webhook:
    enabled: false
    url: https://hooks.example.com/agentic
    severity: [error, critical]
```

## API

### Status Endpoint

```typescript
// Get current status
const status = monitor.getStatus();

// Subscribe to status changes
monitor.on('status:changed', (status) => {
  console.log('Status:', status);
});
```

### Metrics Endpoint

```typescript
// Get metrics summary
const summary = await monitor.getMetricsSummary();

// Get specific metric
const agentDurations = await monitor.getMetric('agent.duration', {
  period: '1h',
  groupBy: 'agent'
});
```

### Events Stream

```typescript
// Subscribe to all events
monitor.on('*', (event) => {
  console.log(event.type, event.payload);
});

// Subscribe to specific events
monitor.on('phase:completed', (event) => {
  console.log(`Phase ${event.phase} completed in ${event.duration}ms`);
});
```

## VS Code Integration

### Status Bar

Shows current workflow status in VS Code status bar:
- Phase progress
- Current agent
- Elapsed time

### Output Channel

Dedicated output channel for workflow logs:
- Agent activities
- Validation results
- Error messages

### Webview Dashboard

Rich dashboard in VS Code webview:
- Visual phase diagram
- Real-time metrics charts
- Agent activity timeline

## Configuration

### Monitor Configuration

```yaml
# .agentic/config/monitor.yaml
monitor:
  enabled: true
  
  dashboard:
    refreshInterval: 1000
    showAgentDetails: true
    showPhaseDetails: true
    
  metrics:
    collectInterval: 5000
    aggregations: [1m, 5m, 1h]
    retention: '7d'
    
  logging:
    level: 'info'
    file: '.agentic/logs/monitor.log'
    console: true
    
  alerts:
    enabled: true
    configFile: 'alerts.yaml'
```

## CLI Commands

```bash
# Start monitor dashboard
node bin/agentic.js monitor

# View specific aspect
node bin/agentic.js monitor --phases
node bin/agentic.js monitor --agents
node bin/agentic.js monitor --metrics

# Export metrics
node bin/agentic.js monitor export --format json --output metrics.json

# View alerts
node bin/agentic.js monitor alerts

# Acknowledge alert
node bin/agentic.js monitor alerts ack --id alert-123
```

## Integration

### With Workflow Engine

```typescript
const engine = new WorkflowEngine();
const monitor = new OrchestrationMonitor();

engine.setMonitor(monitor);

// Engine automatically reports status
engine.on('*', (event) => {
  monitor.recordEvent(event);
});
```

### With Self-Learning

```typescript
monitor.on('workflow:completed', async (event) => {
  await selfLearning.recordWorkflowMetrics({
    scenario: event.scenario,
    duration: event.duration,
    phaseDurations: event.phaseDurations,
    tokenUsage: event.tokenUsage
  });
});
```

## Next Steps

- [Workflow Engine](Workflow-Engine) - Orchestration
- [Self-Learning](Self-Learning) - Metrics analysis
- [Configuration](../guides/Configuration) - Settings
