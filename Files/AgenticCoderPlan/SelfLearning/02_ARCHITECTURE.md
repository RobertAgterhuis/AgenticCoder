# Self-Learning Architecture

**Version**: 1.0  
**Date**: January 13, 2026

---

## System Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     EXECUTION LAYER                            │
│  (AgenticCoder Agents executing and generating code)           │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    ERROR DETECTION                             │
│  • Catch exceptions                                            │
│  • Capture context                                             │
│  • Tag agent/skill                                             │
│  • Timestamp event                                             │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              ERROR LOGGING & STORAGE                           │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Structured     │  │  Pattern         │  │  Frequency   │  │
│  │  JSON Logs      │  │  Categorization  │  │  Tracking    │  │
│  └─────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              ANALYSIS ENGINE                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Root Cause   │  │ Pattern      │  │ Confidence   │          │
│  │ Detection    │  │ Matching     │  │ Scoring      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│           FIX GENERATION ENGINE                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Multiple     │  │ Confidence   │  │ Dependency   │          │
│  │ Strategies   │  │ Evaluation   │  │ Analysis     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│          VALIDATION FRAMEWORK                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Type Check  │  │ Logic Check  │  │ Sandbox Test │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Regression   │  │ Impact       │                            │
│  │ Testing      │  │ Analysis     │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                         ┌────┴────┐
                         │ Approved?│
                         └────┬────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                   YES                  NO
                    │                   │
                    ▼                   ▼
        ┌─────────────────┐    ┌──────────────────┐
        │ BACKUP SYSTEM   │    │ REJECT & LOG     │
        │                 │    │ (Try next time)  │
        │ • Full state    │    └──────────────────┘
        │ • Timestamps    │
        │ • Restoration   │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ APPLY MECHANISM │
        │                 │
        │ • Transaction   │
        │ • Atomic update │
        │ • Rollback-safe │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ VERIFICATION    │
        │                 │
        │ • Run tests     │
        │ • Check metrics │
        │ • Monitor       │
        └────────┬────────┘
                 │
            ┌────┴────┐
            │ Success? │
            └────┬────┘
                 │
        ┌────────┴─────────┐
        ▼                  ▼
       YES                 NO
        │                  │
        ▼                  ▼
    ┌─────┐        ┌──────────────┐
    │ LOG │        │ ROLLBACK     │
    │ OK  │        │ RESTORE      │
    └─────┘        │ LOG FAILURE  │
                   └──────────────┘
        │
        ▼
    ┌──────────────┐
    │ AUDIT TRAIL  │
    │ & FEEDBACK   │
    └──────────────┘
```

---

## Component Details

### 1. Error Detection & Logging

```typescript
interface ErrorCapture {
  errorId: string;
  timestamp: Date;
  phase: number;
  agentName: string;
  skillName?: string;
  
  error: {
    type: string;
    message: string;
    stack: string;
    code?: string;
  };
  
  context: {
    input: any;
    output: any;
    state: any;
    configuration: any;
  };
  
  metadata: {
    executionId: string;
    userId?: string;
    environmentHash: string;
    previousErrors?: string[];
  };
}
```

### 2. Analysis Engine

```typescript
interface AnalysisResult {
  errorId: string;
  rootCause: {
    category: 'input_validation' | 'logic_error' | 'skill_issue' | 'dependency' | 'config';
    description: string;
    affectedComponent: string;
  };
  
  recommendations: {
    fixType: 'parameter_update' | 'logic_fix' | 'validation_rule' | 'dependency_update';
    targetComponent: string;
    proposedChange: string;
    confidence: number;
  }[];
  
  patterns: {
    frequency: number;
    lastOccurrence: Date;
    relatedErrors: string[];
  };
}
```

### 3. Fix Generation

```typescript
interface FixProposal {
  changeId: string;
  errorId: string;
  
  proposedChange: {
    type: 'agent_definition' | 'skill_parameter' | 'validation_rule' | 'configuration';
    target: string;
    oldValue: any;
    newValue: any;
    rationale: string;
  };
  
  strategies: {
    primary: FixStrategy;
    alternatives: FixStrategy[];
  };
  
  confidence: number;
  impactAssessment: {
    affectedAgents: string[];
    affectedSkills: string[];
    estimatedSideEffects: string[];
  };
}
```

### 4. Validation Framework

```typescript
interface ValidationResult {
  changeId: string;
  
  checks: {
    typeValidation: CheckResult;
    logicValidation: CheckResult;
    sandboxTest: CheckResult;
    regressionTest: CheckResult;
    impactAnalysis: CheckResult;
  };
  
  sandboxResult: {
    errors: any[];
    testsPassed: number;
    testsFailed: number;
    coverage: number;
  };
  
  approved: boolean;
  overallConfidence: number;
  recommendations: string[];
}
```

### 5. Apply & Backup

```typescript
interface ApplyOperation {
  changeId: string;
  backupId: string;
  
  operation: {
    timestamp: Date;
    transaction: Transaction;
    rolledBack: boolean;
    rollbackTime?: Date;
  };
  
  backup: {
    fullState: StateSnapshot;
    metadata: BackupMetadata;
    restorable: boolean;
    expiresAt: Date;
  };
  
  verification: {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    status: 'VERIFIED' | 'FAILED' | 'PENDING';
  };
}
```

### 6. Audit Trail

```typescript
interface AuditRecord {
  changeId: string;
  timestamp: Date;
  
  decision: {
    proposedBy: string;
    approvedBy: string;
    reasoning: string;
  };
  
  execution: {
    appliedAt: Date;
    status: 'SUCCESS' | 'ROLLED_BACK' | 'PENDING';
    duration: number;
  };
  
  impact: {
    errorsResolved: number;
    newErrorsIntroduced: number;
    performanceImpact: number;
  };
  
  rollbackInfo?: {
    reason: string;
    initiatedAt: Date;
    completedAt: Date;
  };
}
```

---

## Data Flow Diagram

```
ERROR OCCURS
    │
    ▼
ERROR LOGGED
    │ {errorId, timestamp, context}
    ▼
ANALYSIS
    │ {rootCause, confidence, recommendations}
    ▼
FIX GENERATION
    │ {changeId, proposedChange, confidence}
    ▼
VALIDATION
    │ {approved: boolean, sandboxResult}
    ▼
APPROVAL GATE
    │
    ├─ confidence >= 0.8 & sandbox pass → APPLY
    └─ confidence < 0.8 | sandbox fail → REJECT
    │
    ▼
BACKUP CREATED
    │ {backupId, fullState, timestamp}
    ▼
CHANGE APPLIED
    │ {transaction, atomic}
    ▼
VERIFICATION
    │ {testResults, regressionCheck}
    ▼
AUDIT LOGGED
    │ {complete record, rollback info}
    ▼
FEEDBACK LOOP
    {learning recorded, patterns updated}
```

---

## Integration Points

### With AgenticCoder Core

```
AgenticCoder Execution
    │
    ├─ Phase Completion
    │   └─ Log success/failure
    │
    ├─ Agent Execution
    │   └─ Capture errors
    │
    ├─ Skill Execution
    │   └─ Record performance
    │
    └─ Output Validation
        └─ Verify results
```

### With @applyLearning Agent

```
@applyLearning Command
    │
    ├─ Reads error logs
    ├─ Analyzes patterns
    ├─ Generates fixes
    ├─ Validates changes
    ├─ Applies approved
    ├─ Monitors results
    └─ Reports status
```

---

## Safety Safeguards

### Confidence-Based Actions

```
Confidence Score
    │
    ├─ >= 0.8: Auto-apply (with backup)
    ├─ 0.5-0.8: Manual review required
    └─ < 0.5: Reject & log
```

### Validation Gates

```
Change Proposal
    │
    ├─ Type Check ──┐
    ├─ Logic Check  ├─ ALL PASS?
    ├─ Sandbox Test ├─ YES → APPLY
    ├─ Regression   ├─ NO → REJECT
    └─ Impact Test ─┘
```

### Rollback Triggers

```
After Apply
    │
    ├─ Verification fails → Auto-rollback
    ├─ Error rate increases → Auto-rollback
    ├─ New errors detected → Auto-rollback
    └─ Manual trigger → Rollback
```

---

## Storage & Persistence

### Error Logs Storage
- Location: `/logs/errors/`
- Format: JSON (one per error)
- Retention: 90 days
- Indexed: Yes (by agent, phase, timestamp)

### Backup Storage
- Location: `/backups/`
- Format: Compressed JSON
- Retention: 7 days (configurable)
- Encryption: Yes

### Audit Trail Storage
- Location: `/audit/`
- Format: Immutable JSON log
- Retention: Permanent
- Searchable: Yes

---

## Performance Considerations

### Execution Time
- Error analysis: < 100ms
- Fix generation: < 500ms
- Validation: < 1000ms
- Apply: < 100ms
- Verification: < 2000ms

### Storage Impact
- Error logs: ~2KB per error
- Backups: ~10-50MB per backup
- Audit logs: ~1KB per change

### Database/Storage
- Efficient indexing
- Archival strategy
- Cleanup policies
- Compression enabled

---

## Security Considerations

### Access Control
- Only @applyLearning can initiate changes
- Audit trail immutable
- Backups encrypted
- Logs protected

### Data Integrity
- Checksums on all data
- Atomicity guaranteed
- Consistency maintained
- Durability assured

### Compliance
- GDPR considerations
- Data retention policies
- Audit trail compliance
- Rollback audit trail

---

## Monitoring & Observability

### Metrics Tracked
- Success rate
- Confidence accuracy
- Fix effectiveness
- Rollback rate
- System performance

### Alerts Generated
- Learning failure
- Confidence drop
- Rollback triggered
- Storage usage
- Performance degradation

### Dashboard Shows
- Learning status
- Recent changes
- Success rate
- Rollback history
- System health

---

**Version**: 1.0  
**Status**: Ready for Implementation  
**Next Document**: 03_ERROR_LOGGING.md
