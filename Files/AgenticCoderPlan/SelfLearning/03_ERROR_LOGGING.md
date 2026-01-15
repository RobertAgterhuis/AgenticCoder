# Error Logging System Specification

**Version**: 1.0  
**Date**: January 13, 2026

---

## Overview

Het Error Logging System is de basis van het Self-Learning mechanisme. Het vangt alle fouten op, categoriseert ze, en slaat ze op in een gestructureerd format voor analyse.

---

## Error Capture Mechanism

### 1. Capture Points

Fouten worden vastgelegd op deze momenten:

```typescript
// In Agent Execution
try {
  agentResult = await agent.execute(input);
} catch (error) {
  await errorLogger.capture({
    phase: currentPhase,
    agent: agent.name,
    error,
    context: { input, expectedOutput, state }
  });
}

// In Skill Execution
try {
  skillResult = await skill.execute(params);
} catch (error) {
  await errorLogger.capture({
    phase: currentPhase,
    agent: currentAgent,
    skill: skill.name,
    error,
    context: { params, state }
  });
}

// In Output Validation
if (!isValidOutput(result)) {
  await errorLogger.capture({
    phase: currentPhase,
    agent: currentAgent,
    errorType: 'validation_failed',
    error: new Error(validationMessage),
    context: { result, expectedSchema }
  });
}
```

### 2. Error Data Model

```typescript
interface ErrorLogEntry {
  // Identification
  errorId: string;
  batchId: string;
  
  // Timing
  timestamp: Date;
  duration?: number;
  
  // Location
  phase: number;
  agentName: string;
  skillName?: string;
  commandName?: string;
  
  // Error Details
  error: {
    type: string;
    message: string;
    code?: string;
    stack: string;
    line?: number;
  };
  
  // Context
  context: {
    input: any;
    expectedOutput?: any;
    actualOutput?: any;
    state: Record<string, any>;
    config: Record<string, any>;
    environment: {
      version: string;
      nodeVersion: string;
      timestamp: Date;
    };
  };
  
  // Frequency & Pattern
  frequency: {
    previousOccurrences: number;
    lastOccurrence?: Date;
    pattern?: string;
  };
  
  // Resolution
  resolved: boolean;
  resolutionId?: string;
  resolutionTime?: number;
  
  // Status
  severity: 'low' | 'medium' | 'high' | 'critical';
  learnable: boolean;
  autoFix: boolean;
}
```

### 3. Error Categorization

```typescript
enum ErrorCategory {
  MISSING_PARAMETER = 'missing_parameter',
  INVALID_PARAMETER = 'invalid_parameter',
  TYPE_MISMATCH = 'type_mismatch',
  FORMAT_INVALID = 'format_invalid',
  LOGIC_FAILURE = 'logic_failure',
  CONDITION_FAILED = 'condition_failed',
  STATE_INVALID = 'state_invalid',
  SEQUENCE_ERROR = 'sequence_error',
  SKILL_NOT_FOUND = 'skill_not_found',
  SKILL_TIMEOUT = 'skill_timeout',
  SKILL_FAILURE = 'skill_failure',
  SKILL_OUTPUT_INVALID = 'skill_output_invalid',
  DEPENDENCY_NOT_FOUND = 'dependency_not_found',
  DEPENDENCY_TIMEOUT = 'dependency_timeout',
  DEPENDENCY_ERROR = 'dependency_error',
  CONFIG_MISSING = 'config_missing',
  CONFIG_INVALID = 'config_invalid',
  CONFIG_CONFLICT = 'config_conflict',
  MEMORY_ERROR = 'memory_error',
  TIMEOUT = 'timeout',
  RESOURCE_EXHAUSTED = 'resource_exhausted',
  UNKNOWN = 'unknown'
}

function categorizeError(error: Error, context: any): ErrorCategory {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  
  if (message.includes('required') || message.includes('missing')) {
    return ErrorCategory.MISSING_PARAMETER;
  }
  if (message.includes('type') || error instanceof TypeError) {
    return ErrorCategory.TYPE_MISMATCH;
  }
  if (message.includes('timeout') || message.includes('exceeded')) {
    return ErrorCategory.SKILL_TIMEOUT;
  }
  if (message.includes('not found') || message.includes('undefined')) {
    return ErrorCategory.SKILL_NOT_FOUND;
  }
  
  return ErrorCategory.UNKNOWN;
}
```

### 4. Frequency Tracking

```typescript
interface FrequencyTracker {
  errorPattern: string;
  occurrences: number;
  lastOccurrence: Date;
  firstOccurrence: Date;
  locations: Array<{
    agent: string;
    skill?: string;
    count: number;
  }>;
  
  isFrequent(): boolean {
    return this.occurrences > 3;
  }
  
  isRecurring(): boolean {
    const daysSinceFirst = 
      (Date.now() - this.firstOccurrence.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceFirst > 1 && this.occurrences > 2;
  }
  
  getSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.occurrences > 10) return 'critical';
    if (this.occurrences > 5) return 'high';
    if (this.occurrences > 2) return 'medium';
    return 'low';
  }
}
```

---

## Storage Structure

### Directory Layout

```
/logs
  /errors
    /2026-01
      /13
        error-001.json
        error-002.json
      /12
        ...
    /index.json
  /patterns
    pattern-001.json
    ...
```

### JSON Storage Format

```json
{
  "errorId": "err-2026-0113-001-abc123",
  "batchId": "batch-2026-0113-001",
  "timestamp": "2026-01-13T14:35:42.123Z",
  "phase": 3,
  "agentName": "CodeAnalysisAgent",
  "skillName": "analyze_code_structure",
  "error": {
    "type": "TypeError",
    "message": "Cannot read property 'trim' of undefined",
    "code": "ERR_INVALID_ARG",
    "stack": "Error: ...",
    "line": 42
  },
  "context": {
    "input": {
      "code": "const x = 123;",
      "language": "typescript"
    },
    "state": {
      "processedFiles": 5,
      "totalFiles": 10
    },
    "config": {
      "timeout": 5000,
      "retries": 3
    }
  },
  "frequency": {
    "previousOccurrences": 2,
    "lastOccurrence": "2026-01-13T10:20:15.000Z"
  },
  "resolved": false,
  "severity": "high",
  "learnable": true
}
```

---

## Error Logger Implementation

```typescript
class ErrorLogger {
  private logPath = './logs/errors';
  private patterns: Map<string, FrequencyTracker> = new Map();
  
  async capture(errorData: ErrorCaptureRequest): Promise<string> {
    const errorId = this.generateErrorId();
    const category = categorizeError(errorData.error, errorData.context);
    const pattern = this.getErrorPattern(errorData);
    
    const frequency = this.patterns.get(pattern) || {
      occurrences: 0,
      firstOccurrence: new Date(),
      locations: []
    };
    
    const entry: ErrorLogEntry = {
      errorId,
      batchId: this.getCurrentBatchId(),
      timestamp: new Date(),
      phase: errorData.phase,
      agentName: errorData.agent,
      skillName: errorData.skill,
      error: {
        type: errorData.error.constructor.name,
        message: errorData.error.message,
        stack: errorData.error.stack || '',
        code: (errorData.error as any).code
      },
      context: errorData.context,
      frequency: {
        previousOccurrences: frequency.occurrences,
        lastOccurrence: frequency.lastOccurrence,
        pattern
      },
      resolved: false,
      severity: frequency.occurrences > 5 ? 'critical' : 
                frequency.occurrences > 2 ? 'high' : 'medium',
      learnable: this.isLearnable(errorData),
      autoFix: false
    };
    
    await this.saveEntry(entry);
    
    frequency.occurrences++;
    frequency.lastOccurrence = new Date();
    this.patterns.set(pattern, frequency);
    
    return errorId;
  }
  
  async getErrors(filter: ErrorFilter): Promise<ErrorLogEntry[]> {
    // Implementation to retrieve errors
  }
  
  async getFrequentErrors(): Promise<ErrorLogEntry[]> {
    return [];
  }
  
  async markResolved(errorId: string, resolutionId: string): Promise<void> {
    // Mark error as resolved
  }
  
  private generateErrorId(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const time = Math.floor(date.getTime() % 1000000).toString().padStart(6, '0');
    const random = Math.random().toString(36).substring(2, 8);
    return `err-${dateStr}-${time}-${random}`;
  }
  
  private getErrorPattern(errorData: ErrorCaptureRequest): string {
    const key = `${errorData.agent}:${errorData.skill || 'none'}:${errorData.error.message}`;
    return hashString(key);
  }
  
  private isLearnable(errorData: ErrorCaptureRequest): boolean {
    const nonLearnable = ['ENOENT', 'EACCES', 'ECONNREFUSED'];
    return !nonLearnable.some(code => 
      errorData.error.message.includes(code)
    );
  }
  
  private async saveEntry(entry: ErrorLogEntry): Promise<void> {
    const date = new Date(entry.timestamp);
    const dateStr = date.toISOString().split('T')[0];
    const dir = path.join(this.logPath, dateStr);
    
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(
      path.join(dir, `${entry.errorId}.json`),
      JSON.stringify(entry, null, 2)
    );
  }
}
```

---

## Error Analysis Metrics

### Aggregated Metrics

```typescript
interface ErrorMetrics {
  totalErrors: number;
  uniqueErrors: number;
  errorsByAgent: Record<string, number>;
  errorsByPhase: Record<number, number>;
  errorsBySeverity: Record<string, number>;
  mostFrequentErrors: ErrorLogEntry[];
  errorsPerHour: number;
  errorsPerDay: number;
  resolvedCount: number;
  unresolvedCount: number;
  averageResolutionTime: number;
}

async function getMetrics(timeRange: TimeRange): Promise<ErrorMetrics> {
  // Calculate and return metrics
}
```

---

## Error Cleanup & Retention

### Retention Policy

```typescript
const RETENTION_POLICY = {
  resolved: 30,
  unresolved: 90,
  critical: 365,
  archived: true
};

async function cleanupLogs(): Promise<void> {
  const now = Date.now();
  
  for (const entry of await getAllErrors()) {
    const age = (now - entry.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const maxAge = entry.severity === 'critical' ? 365 :
                   entry.resolved ? 30 : 90;
    
    if (age > maxAge) {
      await archiveError(entry.errorId);
      await deleteError(entry.errorId);
    }
  }
}
```

---

**Version**: 1.0  
**Status**: Ready for Implementation  
**Next Document**: 04_ANALYSIS_ENGINE.md
