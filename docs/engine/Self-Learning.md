# Self-Learning System

AgenticCoder's adaptive learning system that improves agent performance over time.

## Overview

The Self-Learning System:
- **Collects Metrics** - Tracks agent and phase performance
- **Identifies Patterns** - Finds optimization opportunities
- **Adjusts Behavior** - Tunes prompts and configurations
- **Shares Knowledge** - Propagates improvements across agents

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Self-Learning System                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Metrics   │  │   Pattern   │  │  Optimizer  │         │
│  │  Collector  │──▶│  Analyzer   │──▶│   Engine    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         ▲                │                │                 │
│         │                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Agent     │  │  Knowledge  │  │   Config    │         │
│  │  Execution  │  │    Base     │  │   Updater   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Metrics Collection

### Agent Metrics

Collected for every agent execution:

```typescript
interface AgentMetrics {
  agentId: string;
  taskId: string;
  phase: number;
  
  // Performance
  duration: number;           // Execution time (ms)
  tokensUsed: number;         // LLM tokens consumed
  retryCount: number;         // Number of retries
  
  // Quality
  validationPassed: boolean;  // Output validation result
  humanApproved: boolean;     // Manual approval status
  feedbackScore: number;      // 1-5 quality rating
  
  // Context
  scenario: string;
  inputSize: number;          // Input context size
  outputSize: number;         // Output artifact size
  
  timestamp: Date;
}
```

### Phase Metrics

Aggregated at phase level:

```typescript
interface PhaseMetrics {
  phase: number;
  scenario: string;
  
  // Timing
  totalDuration: number;
  agentDurations: Record<string, number>;
  
  // Success
  completedAgents: number;
  failedAgents: number;
  skippedAgents: number;
  
  // Quality
  validationScore: number;
  reworkRequired: boolean;
}
```

### Storage

Metrics stored in JSONL format:

```
// .agentic/learning/metrics/agents.jsonl
{"agentId":"plan","duration":5200,"tokensUsed":3500,...}
{"agentId":"architect","duration":8100,"tokensUsed":5200,...}
```

## Pattern Analysis

### Performance Patterns

Identifies trends in agent performance:

```typescript
interface PerformancePattern {
  pattern: 'slow_agent' | 'high_retry' | 'token_heavy';
  agent: string;
  threshold: number;
  currentValue: number;
  trend: 'improving' | 'stable' | 'degrading';
  recommendation: string;
}
```

**Detected Patterns:**

| Pattern | Detection | Action |
|---------|-----------|--------|
| Slow Agent | Duration > 2x average | Optimize prompt |
| High Retry | Retries > 2 average | Adjust validation |
| Token Heavy | Tokens > 1.5x average | Reduce context |
| Validation Failures | >20% failures | Refine output schema |
| Low Approval | <70% human approval | Improve instructions |

### Quality Patterns

Tracks output quality trends:

```typescript
interface QualityPattern {
  agent: string;
  metric: 'validation_rate' | 'approval_rate' | 'feedback_score';
  baseline: number;
  current: number;
  trend: 'improving' | 'stable' | 'degrading';
}
```

### Scenario Patterns

Compares performance across scenarios:

```typescript
interface ScenarioPattern {
  scenario: string;
  comparison: {
    duration: 'faster' | 'average' | 'slower';
    quality: 'better' | 'average' | 'worse';
    cost: 'lower' | 'average' | 'higher';
  };
  factors: string[];  // Contributing factors
}
```

## Optimization Engine

### Prompt Optimization

Automatically adjusts agent prompts:

```typescript
class PromptOptimizer {
  async optimize(agent: string, metrics: AgentMetrics[]) {
    const analysis = this.analyzeMetrics(metrics);
    
    if (analysis.tokenUsage === 'high') {
      return this.reduceContextInPrompt(agent);
    }
    
    if (analysis.validationRate === 'low') {
      return this.addOutputExamples(agent);
    }
    
    if (analysis.retryRate === 'high') {
      return this.clarifyInstructions(agent);
    }
  }
}
```

### Configuration Tuning

Adjusts runtime configuration:

```typescript
interface ConfigOptimization {
  type: 'timeout' | 'retries' | 'parallelism' | 'context_size';
  agent: string;
  currentValue: any;
  recommendedValue: any;
  reason: string;
  confidence: number;
}
```

### Knowledge Propagation

Shares successful patterns:

```typescript
class KnowledgePropagator {
  async propagate(pattern: SuccessPattern) {
    // Find similar agents
    const similarAgents = this.findSimilarAgents(pattern.agent);
    
    // Apply optimization to similar agents
    for (const agent of similarAgents) {
      await this.applyOptimization(agent, pattern.optimization);
    }
  }
}
```

## Knowledge Base

### Structure

```
.agentic/learning/
├── metrics/
│   ├── agents.jsonl      # Raw agent metrics
│   ├── phases.jsonl      # Phase metrics
│   └── aggregates/       # Computed aggregates
├── patterns/
│   ├── performance.json  # Performance patterns
│   ├── quality.json      # Quality patterns
│   └── scenarios.json    # Scenario patterns
├── optimizations/
│   ├── applied.json      # Applied optimizations
│   └── pending.json      # Pending recommendations
└── knowledge/
    ├── prompts/          # Optimized prompt versions
    └── configs/          # Optimized configurations
```

### Query Interface

```typescript
const kb = new KnowledgeBase();

// Get agent performance history
const history = await kb.getAgentHistory('plan-agent', {
  period: '30d',
  metrics: ['duration', 'tokensUsed', 'validationRate']
});

// Get optimization recommendations
const recommendations = await kb.getRecommendations('plan-agent');

// Get scenario benchmarks
const benchmarks = await kb.getScenarioBenchmarks('S02');
```

## Learning Cycles

### Real-Time Learning

During workflow execution:

```
Agent Execution
      │
      ▼
Collect Metrics ──▶ Update Aggregates
      │
      ▼
Check Thresholds
      │
      ├─▶ Within Limits: Continue
      │
      └─▶ Exceeded: Trigger Optimization
```

### Batch Learning

After workflow completion:

```
Workflow Complete
      │
      ▼
Aggregate All Metrics
      │
      ▼
Run Pattern Analysis
      │
      ▼
Generate Recommendations
      │
      ▼
Apply Auto-Optimizations
      │
      ▼
Update Knowledge Base
```

### Periodic Learning

Scheduled analysis:

```typescript
// Run daily at midnight
schedule('0 0 * * *', async () => {
  await selfLearning.runBatchAnalysis({
    period: '24h',
    generateReport: true
  });
});
```

## Configuration

### Learning Configuration

```yaml
# .agentic/config/learning.yaml
learning:
  enabled: true
  
  metrics:
    collectAgent: true
    collectPhase: true
    retention: '90d'
    
  patterns:
    analysisInterval: '1h'
    minimumSamples: 10
    confidenceThreshold: 0.8
    
  optimization:
    autoApply: false  # Require approval
    maxChangesPerCycle: 3
    rollbackOnDegrade: true
    
  reporting:
    generateDaily: true
    generateWeekly: true
    emailRecipients: []
```

### Agent-Specific Settings

```yaml
# Disable learning for specific agent
agents:
  security-specialist:
    learning:
      enabled: false
      reason: "Critical agent - manual tuning only"
```

## Reports

### Performance Report

```markdown
## Agent Performance Report (2024-01-15)

### Top Performers
| Agent | Avg Duration | Success Rate | Trend |
|-------|--------------|--------------|-------|
| plan | 4.2s | 98% | ↑ |
| doc | 3.8s | 97% | → |
| architect | 7.5s | 95% | ↑ |

### Needs Attention
| Agent | Issue | Recommendation |
|-------|-------|----------------|
| bicep-specialist | High retries (2.3 avg) | Review validation rules |
| cosmos-specialist | Slow (15s avg) | Reduce context size |
```

### Optimization Report

```markdown
## Optimizations Applied (2024-01-15)

### Auto-Applied
1. **plan-agent**: Reduced context window from 8000 to 6000 tokens
   - Result: 15% faster, same quality

### Pending Approval
1. **architect-agent**: Add output examples to prompt
   - Expected: 10% improvement in validation rate
   - Confidence: 85%
```

## CLI Commands

```bash
# View learning status
node bin/agentic.js learning status

# View metrics for agent
node bin/agentic.js learning metrics --agent plan

# Generate report
node bin/agentic.js learning report --period 7d

# Apply pending optimizations
node bin/agentic.js learning apply --optimization opt-123

# Reset learning data
node bin/agentic.js learning reset --confirm
```

## Integration

### With Workflow Engine

```typescript
engine.on('agent:completed', async (event) => {
  await selfLearning.recordAgentMetrics({
    agentId: event.agent,
    duration: event.duration,
    ...event.metrics
  });
});
```

### With Feedback Loop

```typescript
feedbackLoop.on('correction:applied', async (event) => {
  await selfLearning.recordCorrection({
    agent: event.agent,
    type: event.correctionType,
    success: event.success
  });
});
```

## Next Steps

- [Feedback Loop](Feedback-Loop) - Correction system
- [Workflow Engine](Workflow-Engine) - Integration point
- [Configuration](../guides/Configuration) - Settings
