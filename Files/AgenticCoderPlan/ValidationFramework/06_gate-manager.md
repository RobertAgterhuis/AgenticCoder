# Gate Manager

**Component**: VF-06  
**Purpose**: Make pass/fail decisions and block bad artifacts  
**Status**: Design Complete  

---

## 🎯 Overview

The Gate Manager is the decision-maker:

1. **Orchestrates** all validation checks
2. **Aggregates** results from 5 validators
3. **Makes** pass/fail decisions
4. **Blocks** bad artifacts from handoff
5. **Generates** reports and alerts

---

## 🏗️ Process Flow

```
Artifact from Agent
    │
    ├─→ Prepare Validation
    │   ├─ Load artifact
    │   ├─ Determine agent type
    │   └─ Load validation config
    │
    ├─→ Run Validation Gates (Parallel)
    │   ├─ Schema Validator
    │   ├─ Syntax Validator
    │   ├─ Dependency Resolver
    │   ├─ Security Scanner
    │   └─ Test Runner
    │
    ├─→ Aggregate Results
    │   ├─ Collect all issues
    │   ├─ Determine severity
    │   └─ Calculate score
    │
    ├─→ Make Decision
    │   ├─ Any critical failures?
    │   ├─ Any blockers?
    │   └─ Meets all requirements?
    │
    ├─→ Decision Outcome
    │   ├─ APPROVED → Allow handoff
    │   ├─ REJECTED → Block immediately
    │   └─ REQUIRES_REVIEW → Human decision
    │
    └─→ Report & Alert
        ├─ Generate report
        ├─ Send alerts
        └─ Archive results
```

---

## 🚦 Gate Stages

### Gate 1: Schema Validation (Fast)
```
Time: ~100ms
Severity: CRITICAL if fails
Action: Instant block
```

### Gate 2: Syntax Validation (Fast)
```
Time: ~500ms
Severity: CRITICAL if fails
Action: Instant block
```

### Gate 3: Dependency Check (Medium)
```
Time: ~2 seconds
Severity: CRITICAL if fails
Action: Instant block
```

### Gate 4: Security Scan (Slow)
```
Time: ~10 seconds
Severity: HIGH/CRITICAL if critical issues
Action: Block or require review
```

### Gate 5: Testing (Very Slow)
```
Time: ~30 seconds
Severity: MODERATE if fails
Action: Block or flag for review
```

---

## 💻 Algorithm

### Execute All Gates
```typescript
interface ValidationGate {
  name: string;
  validator: (artifact: any) => Promise<any>;
  timeout_ms: number;
  critical: boolean;
  parallelizable: boolean;
}

interface GateResult {
  gate: string;
  status: 'PASS' | 'FAIL';
  errors?: any[];
  duration_ms: number;
  critical: boolean;
}

async function executeAllGates(
  artifact: any,
  gates: ValidationGate[]
): Promise<GateResult[]> {
  
  const results: GateResult[] = [];
  
  // Run all gates in parallel (with timeout)
  const gatePromises = gates.map(gate =>
    executeGate(artifact, gate)
  );
  
  const gateResults = await Promise.allSettled(gatePromises);
  
  for (let i = 0; i < gateResults.length; i++) {
    const gate = gates[i];
    const result = gateResults[i];
    
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      results.push({
        gate: gate.name,
        status: 'FAIL',
        errors: [{ error: 'Gate execution failed' }],
        duration_ms: gate.timeout_ms,
        critical: gate.critical
      });
    }
  }
  
  return results;
}

async function executeGate(
  artifact: any,
  gate: ValidationGate
): Promise<GateResult> {
  const startTime = Date.now();
  
  try {
    const result = await Promise.race([
      gate.validator(artifact),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Gate timeout')),
          gate.timeout_ms
        )
      )
    ]);
    
    return {
      gate: gate.name,
      status: result.status || 'PASS',
      errors: result.errors,
      duration_ms: Date.now() - startTime,
      critical: gate.critical
    };
  } catch (error) {
    return {
      gate: gate.name,
      status: 'FAIL',
      errors: [{ error: error.message }],
      duration_ms: Date.now() - startTime,
      critical: gate.critical
    };
  }
}
```

### Make Decision
```typescript
interface ValidationDecision {
  status: 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW';
  reason: string;
  critical_issues: number;
  high_issues: number;
  moderate_issues: number;
  overall_score: number; // 0-100
  can_handoff: boolean;
}

function makeDecision(
  gateResults: GateResult[],
  config: ValidationConfig
): ValidationDecision {
  
  // Count failures by severity
  let criticalFailures = 0;
  let highFailures = 0;
  let moderateFailures = 0;
  
  for (const result of gateResults) {
    if (result.status === 'FAIL') {
      if (result.critical) {
        criticalFailures++;
      } else {
        highFailures++;
      }
    }
  }
  
  // Determine decision
  if (criticalFailures > 0) {
    return {
      status: 'REJECTED',
      reason: `${criticalFailures} critical validation failures`,
      critical_issues: criticalFailures,
      high_issues: highFailures,
      moderate_issues: moderateFailures,
      overall_score: Math.max(0, 100 - (criticalFailures * 50)),
      can_handoff: false
    };
  }
  
  if (highFailures > config.max_high_failures) {
    return {
      status: 'REQUIRES_REVIEW',
      reason: `${highFailures} high-severity issues (max: ${config.max_high_failures})`,
      critical_issues: 0,
      high_issues: highFailures,
      moderate_issues: moderateFailures,
      overall_score: Math.max(0, 100 - (highFailures * 20)),
      can_handoff: false
    };
  }
  
  // All checks passed
  return {
    status: 'APPROVED',
    reason: 'All validation gates passed',
    critical_issues: 0,
    high_issues: 0,
    moderate_issues: moderateFailures,
    overall_score: Math.max(0, 100 - (moderateFailures * 5)),
    can_handoff: true
  };
}
```

### Aggregate Results
```typescript
interface ValidationReport {
  execution_id: string;
  artifact_id: string;
  agent: string;
  phase: number;
  timestamp: string;
  
  gates: {
    schema: GateResult;
    syntax: GateResult;
    dependency: GateResult;
    security: GateResult;
    testing: GateResult;
  };
  
  decision: ValidationDecision;
  
  summary: {
    total_duration_ms: number;
    fastest_gate: string;
    slowest_gate: string;
    gates_passed: number;
    gates_failed: number;
  };
  
  detailed_issues: Array<{
    gate: string;
    issue_type: string;
    severity: string;
    message: string;
  }>;
}

function aggregateResults(
  gateResults: GateResult[],
  decision: ValidationDecision,
  artifact: any,
  agent: string,
  executionId: string
): ValidationReport {
  
  const startTime = Math.min(...gateResults.map(r => r.duration_ms));
  const totalDuration = Math.max(...gateResults.map(r => r.duration_ms));
  
  const detailedIssues: any[] = [];
  for (const result of gateResults) {
    if (result.errors) {
      for (const error of result.errors) {
        detailedIssues.push({
          gate: result.gate,
          issue_type: error.type || 'error',
          severity: error.severity || 'high',
          message: error.message || JSON.stringify(error)
        });
      }
    }
  }
  
  return {
    execution_id: executionId,
    artifact_id: artifact.id,
    agent,
    phase: artifact.phase,
    timestamp: new Date().toISOString(),
    
    gates: {
      schema: gateResults[0],
      syntax: gateResults[1],
      dependency: gateResults[2],
      security: gateResults[3],
      testing: gateResults[4]
    },
    
    decision,
    
    summary: {
      total_duration_ms: totalDuration,
      fastest_gate: gateResults.reduce((a, b) =>
        a.duration_ms < b.duration_ms ? a : b
      ).gate,
      slowest_gate: gateResults.reduce((a, b) =>
        a.duration_ms > b.duration_ms ? a : b
      ).gate,
      gates_passed: gateResults.filter(r => r.status === 'PASS').length,
      gates_failed: gateResults.filter(r => r.status === 'FAIL').length
    },
    
    detailed_issues: detailedIssues
  };
}
```

---

## ✅ Decision Examples

### Example 1: Full Approval
```json
{
  "status": "APPROVED",
  "reason": "All validation gates passed",
  "can_handoff": true,
  "gates_passed": 5,
  "gates_failed": 0,
  "overall_score": 98
}
```

---

### Example 2: Rejected (Critical)
```json
{
  "status": "REJECTED",
  "reason": "1 critical validation failure",
  "can_handoff": false,
  "critical_issues": 1,
  "gates_passed": 3,
  "gates_failed": 2,
  "overall_score": 40,
  "detailed_issues": [
    {
      "gate": "schema",
      "issue_type": "required_field_missing",
      "severity": "critical",
      "message": "Missing required field 'dependencies'"
    },
    {
      "gate": "syntax",
      "issue_type": "parse_error",
      "severity": "critical",
      "message": "Unexpected token } at line 42"
    }
  ]
}
```

---

### Example 3: Requires Review
```json
{
  "status": "REQUIRES_REVIEW",
  "reason": "2 high-severity issues (max: 1)",
  "can_handoff": false,
  "high_issues": 2,
  "gates_passed": 3,
  "gates_failed": 2,
  "overall_score": 55,
  "detailed_issues": [
    {
      "gate": "security",
      "issue_type": "hardcoded_secret",
      "severity": "high",
      "message": "Hardcoded API key found at line 15"
    },
    {
      "gate": "testing",
      "issue_type": "low_coverage",
      "severity": "high",
      "message": "Test coverage 60% below threshold of 75%"
    }
  ]
}
```

---

## 📊 Metrics

```typescript
interface ValidationMetrics {
  total_validations: number;
  approved: number;
  rejected: number;
  requires_review: number;
  average_duration_ms: number;
  common_issues: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}
```

---

## ⚙️ Configuration

### gate-manager.config.json
```json
{
  "gates": [
    {
      "name": "schema",
      "enabled": true,
      "critical": true,
      "timeout_ms": 1000,
      "parallelizable": true
    },
    {
      "name": "syntax",
      "enabled": true,
      "critical": true,
      "timeout_ms": 5000,
      "parallelizable": true
    },
    {
      "name": "dependency",
      "enabled": true,
      "critical": true,
      "timeout_ms": 10000,
      "parallelizable": true
    },
    {
      "name": "security",
      "enabled": true,
      "critical": false,
      "timeout_ms": 30000,
      "parallelizable": true
    },
    {
      "name": "testing",
      "enabled": true,
      "critical": false,
      "timeout_ms": 60000,
      "parallelizable": true
    }
  ],
  "decision_rules": {
    "max_critical_failures": 0,
    "max_high_failures": 1,
    "max_moderate_failures": 5,
    "min_overall_score": 70,
    "require_human_review": false
  },
  "timeout_ms": 120000,
  "parallel_execution": true,
  "archive_reports": true
}
```

---

## 🔌 Integration

### Called By
- Orchestration Engine (validates artifacts before handoff)
- Artifact Transfer (gate check before handoff)

### Calls
- All 5 validators (schema, syntax, dependency, security, test)
- Report Generator (creates validation reports)
- Alert System (sends notifications)

---

## 💡 Key Points

1. **All-or-Nothing**: All gates must pass for approval
2. **Parallel Execution**: Runs all gates concurrently for speed
3. **Fast Fail**: Returns immediately on critical failures
4. **Detailed Reporting**: Clear reasons why artifacts are rejected
5. **Configurable Thresholds**: Adjust pass/fail criteria
6. **Audit Trail**: Archives all validation decisions

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
