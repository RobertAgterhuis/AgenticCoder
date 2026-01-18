# Feedback Loop

AgenticCoder's iterative correction and improvement system.

## Overview

The Feedback Loop enables:
- **Validation-Driven Corrections** - Fix issues found during validation
- **Human Feedback Integration** - Incorporate manual corrections
- **Iterative Refinement** - Multiple passes until quality met
- **Learning from Corrections** - Improve future outputs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Feedback Loop                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ Output  │───▶│ Validate │───▶│ Analyze  │───▶│ Decide │ │
│  └─────────┘    └──────────┘    └──────────┘    └────────┘ │
│       ▲                                              │      │
│       │         ┌──────────────────────────────────┘      │
│       │         │                                          │
│       │         ▼                                          │
│       │    ┌─────────┐    ┌─────────┐                     │
│       └────│ Correct │◀───│  Agent  │                     │
│            └─────────┘    └─────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Feedback Types

### 1. Validation Feedback

Automatic feedback from validation rules:

```typescript
interface ValidationFeedback {
  type: 'validation';
  source: 'schema' | 'lint' | 'test' | 'security';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  suggestion?: string;
  autoFixable: boolean;
}
```

**Examples:**
- Schema validation failure
- Linting errors
- Test failures
- Security scan issues

### 2. Human Feedback

Manual corrections from users:

```typescript
interface HumanFeedback {
  type: 'human';
  source: 'review' | 'chat' | 'edit';
  agent: string;
  artifact: string;
  feedback: string;
  correction?: string;  // Actual corrected content
  priority: 'high' | 'normal' | 'low';
}
```

**Channels:**
- Code review comments
- Chat corrections
- Direct file edits

### 3. Quality Feedback

From quality metrics:

```typescript
interface QualityFeedback {
  type: 'quality';
  metric: string;
  threshold: number;
  actual: number;
  direction: 'above' | 'below';
  recommendation: string;
}
```

**Metrics:**
- Code coverage
- Complexity scores
- Performance benchmarks

## Feedback Flow

### Standard Flow

```
1. Agent Produces Output
         │
         ▼
2. Validation Engine Checks
         │
         ├─── Pass ──▶ Continue to Next Phase
         │
         ▼
3. Analyze Failures
         │
         ▼
4. Generate Correction Request
         │
         ▼
5. Send to Agent
         │
         ▼
6. Agent Produces Corrected Output
         │
         ▼
7. Re-Validate (loop until pass or max iterations)
```

### Configuration

```yaml
# .agentic/config/feedback.yaml
feedback:
  maxIterations: 3
  iterationDelay: 1000
  
  validation:
    failOnError: true
    failOnWarning: false
    autoFix: true
    
  human:
    requireApproval: false
    notifyOnCorrection: true
    
  quality:
    enabled: true
    blockOnFailure: false
```

## Correction Process

### Correction Request

Sent to agent for fixing:

```typescript
interface CorrectionRequest {
  requestId: string;
  agent: string;
  originalTask: Task;
  originalOutput: Artifact;
  feedback: Feedback[];
  iteration: number;
  maxIterations: number;
  
  // Context for correction
  instructions: string;
  examples?: CorrectionExample[];
}
```

### Agent Correction

Agent receives correction context:

```
You produced the following output that needs correction:

[Original Output]
---
{originalOutput}
---

Issues found:
1. ERROR: Missing required field 'description' in component schema
2. WARNING: Function 'handleClick' exceeds complexity threshold

Please fix these issues and regenerate the output.
```

### Correction Result

```typescript
interface CorrectionResult {
  requestId: string;
  success: boolean;
  correctedOutput: Artifact;
  issuesFixed: number;
  issuesRemaining: number;
  explanation: string;
}
```

## Auto-Fix System

### Fixable Issues

Some issues can be auto-fixed without agent re-run:

| Issue Type | Auto-Fix Method |
|------------|-----------------|
| Formatting | Run formatter |
| Imports | Auto-import tool |
| Lint (simple) | ESLint --fix |
| Schema defaults | Add default values |
| Trailing whitespace | Trim |

### Auto-Fix Pipeline

```typescript
class AutoFixer {
  async fix(artifact: Artifact, issues: Issue[]): Promise<FixResult> {
    const fixableIssues = issues.filter(i => i.autoFixable);
    
    for (const issue of fixableIssues) {
      const fixer = this.getFixer(issue.type);
      await fixer.apply(artifact, issue);
    }
    
    return {
      fixed: fixableIssues.length,
      remaining: issues.length - fixableIssues.length
    };
  }
}
```

## Human-in-the-Loop

### When Required

Human intervention required for:
- Security-critical changes
- Architecture decisions
- Ambiguous requirements
- Low-confidence corrections

### Approval Flow

```
Correction Needed
      │
      ▼
Check if Human Approval Required
      │
      ├─── No ──▶ Auto-Correct
      │
      ▼
Notify User
      │
      ▼
Wait for Approval
      │
      ├─── Approved ──▶ Apply Correction
      │
      ├─── Rejected ──▶ Skip or Modify
      │
      └─── Modified ──▶ Apply User Version
```

### Approval Interface

```bash
# Pending approvals
node bin/agentic.js feedback pending

# Approve correction
node bin/agentic.js feedback approve --id corr-123

# Reject correction
node bin/agentic.js feedback reject --id corr-123 --reason "Not needed"

# Modify and approve
node bin/agentic.js feedback modify --id corr-123 --file corrected.md
```

## Learning Integration

### Recording Corrections

```typescript
feedbackLoop.on('correction:applied', async (event) => {
  await selfLearning.recordCorrection({
    agent: event.agent,
    originalIssue: event.issue,
    correction: event.correction,
    success: event.validationPassed,
    iterations: event.iteration
  });
});
```

### Pattern Detection

Frequent corrections indicate:
- Prompt improvement needed
- Validation rule too strict
- Missing context in instructions

```typescript
const patterns = await selfLearning.analyzeCorrections('plan-agent');
// {
//   frequentIssues: ['missing_description', 'wrong_format'],
//   suggestedPromptChanges: ['Add format examples'],
//   suggestedValidationChanges: ['Make description optional']
// }
```

## Metrics

### Feedback Metrics

```typescript
interface FeedbackMetrics {
  agent: string;
  period: string;
  
  corrections: {
    total: number;
    autoFixed: number;
    agentFixed: number;
    humanFixed: number;
  };
  
  iterations: {
    average: number;
    max: number;
    distribution: number[];
  };
  
  success: {
    firstAttempt: number;      // % pass on first try
    afterCorrection: number;    // % pass after correction
    failed: number;             // % still failed after max iterations
  };
}
```

### Dashboard

```bash
# View feedback metrics
node bin/agentic.js feedback metrics --agent plan

# Agent: plan-agent
# Period: Last 30 days
# 
# Corrections: 45
#   Auto-fixed: 30 (67%)
#   Agent-fixed: 12 (27%)
#   Human-fixed: 3 (7%)
# 
# Success Rate:
#   First attempt: 85%
#   After correction: 98%
#   Failed: 2%
# 
# Average iterations: 1.3
```

## Error Handling

### Max Iterations Reached

```typescript
if (iteration >= maxIterations) {
  if (config.failOnMaxIterations) {
    throw new MaxIterationsError(agent, issues);
  } else {
    // Log warning and continue with imperfect output
    logger.warn(`Max iterations reached for ${agent}, continuing with warnings`);
    return {
      status: 'partial',
      output: lastOutput,
      warnings: remainingIssues
    };
  }
}
```

### Correction Failure

```typescript
feedbackLoop.on('correction:failed', async (event) => {
  // Escalate to human
  await notifyUser({
    type: 'correction_failed',
    agent: event.agent,
    attempts: event.iterations,
    issues: event.remainingIssues,
    action: 'manual_intervention_required'
  });
});
```

## Configuration

### Full Configuration

```yaml
# .agentic/config/feedback.yaml
feedback:
  enabled: true
  
  iterations:
    max: 3
    delayBetween: 2000
    
  validation:
    failOnError: true
    failOnWarning: false
    autoFixEnabled: true
    
  autoFix:
    formatting: true
    imports: true
    lint: true
    schema: true
    
  human:
    requireApproval:
      security: true
      architecture: true
      default: false
    notificationChannel: 'vscode'
    timeout: 300000  # 5 minutes
    
  learning:
    recordCorrections: true
    analyzePatterns: true
    suggestImprovements: true
    
  reporting:
    generateReport: true
    includeInSummary: true
```

## CLI Commands

```bash
# View feedback status
node bin/agentic.js feedback status

# View pending corrections
node bin/agentic.js feedback pending

# Approve all pending
node bin/agentic.js feedback approve-all

# View correction history
node bin/agentic.js feedback history --agent plan

# Generate feedback report
node bin/agentic.js feedback report
```

## Next Steps

- [Self-Learning](Self-Learning) - Learning integration
- [Validation Framework](Validation-Framework) - Validation rules
- [Workflow Engine](Workflow-Engine) - Orchestration
