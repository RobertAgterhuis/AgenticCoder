# Decision Engine

**Component**: FLS-06  
**Purpose**: Automated remediation and intelligent decision-making  
**Status**: Design Complete  

---

## 🎯 Overview

The Decision Engine analyzes failures and automatically suggests or executes remediation steps.

---

## 💻 Decision Model

```typescript
type RemediationAction = 
  | 'retry'              // Retry the task
  | 'rollback'           // Revert changes
  | 'escalate'           // Send to human
  | 'alternative'        // Try alternative
  | 'notify'             // Send notification
  | 'log_only';          // Just log it

interface DecisionContext {
  error: Error;
  task_id: string;
  phase_id: string;
  retry_count: number;
  max_retries: number;
  previous_failures?: Error[];
}

interface Decision {
  decision_id: string;
  created_at: string;
  context: DecisionContext;
  
  analysis: {
    error_type: string;
    root_cause: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  
  recommended_action: RemediationAction;
  action_confidence: number;            // 0-100
  
  alternative_actions: Array<{
    action: RemediationAction;
    confidence: number;
    reason: string;
  }>;
  
  executed: boolean;
  execution_result?: any;
}
```

---

## 🔍 Error Analysis

```typescript
class DecisionEngine {
  // Analyze error and decide action
  async analyzeAndDecide(context: DecisionContext): Promise<Decision> {
    
    const decision: Decision = {
      decision_id: generateId(),
      created_at: new Date().toISOString(),
      context,
      analysis: this.analyzeError(context.error),
      recommended_action: 'escalate',
      action_confidence: 0,
      alternative_actions: [],
      executed: false
    };
    
    // Determine action based on error type
    const errorType = context.error.name;
    
    if (errorType === 'TimeoutError' && context.retry_count < context.max_retries) {
      decision.recommended_action = 'retry';
      decision.action_confidence = 85;
      decision.alternative_actions.push({
        action: 'escalate',
        confidence: 50,
        reason: 'May indicate resource exhaustion'
      });
    } else if (errorType === 'NetworkError') {
      decision.recommended_action = 'retry';
      decision.action_confidence = 75;
    } else if (errorType === 'ValidationError') {
      decision.recommended_action = 'escalate';
      decision.action_confidence = 90;
      decision.alternative_actions.push({
        action: 'log_only',
        confidence: 40,
        reason: 'May be expected validation warning'
      });
    } else if (errorType === 'AuthorizationError') {
      decision.recommended_action = 'escalate';
      decision.action_confidence = 95;
    } else {
      decision.recommended_action = 'log_only';
      decision.action_confidence = 60;
      decision.alternative_actions.push({
        action: 'escalate',
        confidence: 80,
        reason: 'Unknown error type - may need human review'
      });
    }
    
    return decision;
  }
  
  private analyzeError(error: Error): Decision['analysis'] {
    return {
      error_type: error.name,
      root_cause: this.determineRootCause(error),
      severity: this.determineSeverity(error)
    };
  }
  
  // Execute remediation
  async executeRemedy(decision: Decision): Promise<any> {
    try {
      switch (decision.recommended_action) {
        case 'retry':
          return await this.retryTask(decision.context);
        case 'rollback':
          return await this.rollbackTask(decision.context);
        case 'escalate':
          return await this.escalateToHuman(decision);
        case 'alternative':
          return await this.tryAlternative(decision.context);
        case 'notify':
          return await this.notifyStakeholders(decision);
        case 'log_only':
          return await this.logError(decision);
      }
    } catch (error) {
      decision.execution_result = { success: false, error };
      throw error;
    }
  }
  
  private async retryTask(context: DecisionContext): Promise<any> {
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, context.retry_count), 30000);
    await sleep(delay);
    
    // Re-execute task
    return await getTask(context.task_id).execute();
  }
  
  private async rollbackTask(context: DecisionContext): Promise<any> {
    // Undo changes made by task
    const task = getTask(context.task_id);
    if (task.rollback) {
      return await task.rollback();
    }
    throw new Error(`Task ${context.task_id} does not support rollback`);
  }
  
  private async escalateToHuman(decision: Decision): Promise<any> {
    // Create ticket or alert
    const ticket = {
      title: `Manual Remediation Required: ${decision.context.error.message}`,
      severity: decision.analysis.severity,
      context: decision.context,
      decision: decision
    };
    
    // Send to issue tracking system
    return await issueTracker.create(ticket);
  }
  
  private async tryAlternative(context: DecisionContext): Promise<any> {
    // Find alternative implementation
    const alternatives = findAlternatives(context.task_id);
    
    for (const alt of alternatives) {
      try {
        return await alt.execute();
      } catch (error) {
        // Try next alternative
      }
    }
    
    throw new Error('All alternatives failed');
  }
}
```

---

## 🤖 Intelligent Remediation

```typescript
// Pattern-based remediation suggestions
const remediationPatterns = [
  {
    pattern: /timeout|timed out/i,
    action: 'retry',
    message: 'Task timed out. Will retry with exponential backoff.'
  },
  {
    pattern: /authentication|unauthorized|forbidden/i,
    action: 'escalate',
    message: 'Authentication failed. Requires manual credential review.'
  },
  {
    pattern: /resource.*not found|404/i,
    action: 'escalate',
    message: 'Required resource not found. May need manual provisioning.'
  },
  {
    pattern: /syntax error|validation failed/i,
    action: 'escalate',
    message: 'Template syntax error. Requires code review and fix.'
  }
];

function findMatchingPattern(error: Error): typeof remediationPatterns[0] | null {
  const errorText = `${error.name}: ${error.message}`;
  
  for (const pattern of remediationPatterns) {
    if (pattern.pattern.test(errorText)) {
      return pattern;
    }
  }
  
  return null;
}
```

---

## 📊 Decision Tracking

```typescript
class DecisionLog {
  private decisions: Decision[] = [];
  
  // Record decision
  recordDecision(decision: Decision): void {
    this.decisions.push(decision);
  }
  
  // Get remediation effectiveness
  getEffectiveness(): {
    success_rate: number;
    action_effectiveness: { [key: string]: number };
  } {
    
    const results = {
      success_rate: 0,
      action_effectiveness: {} as { [key: string]: number }
    };
    
    const successful = this.decisions.filter(
      d => d.execution_result?.success
    );
    results.success_rate = (successful.length / this.decisions.length) * 100;
    
    for (const action of ['retry', 'rollback', 'escalate', 'notify', 'log_only']) {
      const actionsOfType = this.decisions.filter(
        d => d.recommended_action === action
      );
      const successCount = actionsOfType.filter(
        d => d.execution_result?.success
      ).length;
      
      results.action_effectiveness[action] = 
        (successCount / actionsOfType.length) * 100;
    }
    
    return results;
  }
}
```

---

## 💡 Key Points

1. **Pattern Matching**: Recognizes common error types
2. **Escalation**: Routes complex issues to humans
3. **Retry Logic**: Smart exponential backoff
4. **Rollback Support**: Undo changes on failure
5. **Effectiveness Tracking**: Learns from remediation outcomes
6. **Audit Trail**: All decisions logged and tracked
7. **Extensible**: Easy to add new remediation patterns

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
