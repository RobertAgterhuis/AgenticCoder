# Phase 1: Error Classification

**Phase ID:** F-EHR-P01  
**Feature:** ErrorHandlingRecovery  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** None

---

## 🎯 Phase Objectives

Deze phase implementeert het **Error Classification System**:
- Error taxonomy en categorization
- Severity calculation
- Error catalog met standaard codes
- Context enrichment voor debugging
- Pattern matching voor bekende errors

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── errors/
│   ├── ErrorClassifier.ts
│   ├── ErrorCatalog.ts
│   ├── SeverityCalculator.ts
│   ├── ErrorContext.ts
│   ├── ErrorPatterns.ts
│   └── types/
│       ├── ErrorCategory.ts
│       ├── ErrorCode.ts
│       └── ErrorSeverity.ts
```

---

## 🔧 Implementation Details

### 1.1 Error Types (`src/errors/types/ErrorCategory.ts`)

```typescript
/**
 * Error categories for classification
 */
export enum ErrorCategory {
  /** Temporary failures that may succeed on retry */
  TRANSIENT = 'transient',
  
  /** Input validation failures */
  VALIDATION = 'validation',
  
  /** System resource issues */
  RESOURCE = 'resource',
  
  /** Application logic errors */
  LOGIC = 'logic',
  
  /** External service failures */
  EXTERNAL = 'external',
  
  /** Security-related errors */
  SECURITY = 'security',
  
  /** Critical system errors */
  CRITICAL = 'critical',
  
  /** Configuration errors */
  CONFIGURATION = 'configuration',
  
  /** Unknown/unclassified errors */
  UNKNOWN = 'unknown',
}

/**
 * Error subcategories for finer classification
 */
export type ErrorSubcategory = 
  // Transient
  | 'network_timeout'
  | 'rate_limited'
  | 'connection_reset'
  | 'temporary_unavailable'
  // Validation
  | 'schema_invalid'
  | 'type_mismatch'
  | 'missing_required'
  | 'constraint_violation'
  // Resource
  | 'out_of_memory'
  | 'disk_full'
  | 'file_not_found'
  | 'permission_denied'
  // Logic
  | 'invalid_state'
  | 'assertion_failed'
  | 'null_reference'
  | 'index_out_of_bounds'
  // External
  | 'azure_unavailable'
  | 'mcp_failure'
  | 'api_error'
  | 'service_degraded'
  // Security
  | 'authentication_failed'
  | 'authorization_denied'
  | 'token_expired'
  | 'invalid_credentials'
  // Critical
  | 'data_corruption'
  | 'system_crash'
  | 'unrecoverable'
  // Configuration
  | 'missing_config'
  | 'invalid_config'
  | 'environment_mismatch';
```

### 1.2 Error Severity (`src/errors/types/ErrorSeverity.ts`)

```typescript
/**
 * Error severity levels
 */
export enum ErrorSeverity {
  /** Informational - no action needed */
  INFO = 'info',
  
  /** Warning - potential issue */
  WARNING = 'warning',
  
  /** Error - operation failed but system stable */
  ERROR = 'error',
  
  /** High - significant impact, needs attention */
  HIGH = 'high',
  
  /** Critical - system at risk, immediate action */
  CRITICAL = 'critical',
  
  /** Fatal - system cannot continue */
  FATAL = 'fatal',
}

/**
 * Severity configuration
 */
export interface SeverityConfig {
  level: ErrorSeverity;
  weight: number;
  requiresEscalation: boolean;
  autoRetryable: boolean;
  maxRetries: number;
  notifyChannels: NotifyChannel[];
}

export type NotifyChannel = 'log' | 'console' | 'slack' | 'email' | 'pagerduty';

/**
 * Default severity configurations
 */
export const SEVERITY_CONFIGS: Record<ErrorSeverity, SeverityConfig> = {
  [ErrorSeverity.INFO]: {
    level: ErrorSeverity.INFO,
    weight: 1,
    requiresEscalation: false,
    autoRetryable: false,
    maxRetries: 0,
    notifyChannels: ['log'],
  },
  [ErrorSeverity.WARNING]: {
    level: ErrorSeverity.WARNING,
    weight: 2,
    requiresEscalation: false,
    autoRetryable: true,
    maxRetries: 1,
    notifyChannels: ['log', 'console'],
  },
  [ErrorSeverity.ERROR]: {
    level: ErrorSeverity.ERROR,
    weight: 3,
    requiresEscalation: false,
    autoRetryable: true,
    maxRetries: 3,
    notifyChannels: ['log', 'console'],
  },
  [ErrorSeverity.HIGH]: {
    level: ErrorSeverity.HIGH,
    weight: 4,
    requiresEscalation: true,
    autoRetryable: true,
    maxRetries: 2,
    notifyChannels: ['log', 'console', 'slack'],
  },
  [ErrorSeverity.CRITICAL]: {
    level: ErrorSeverity.CRITICAL,
    weight: 5,
    requiresEscalation: true,
    autoRetryable: false,
    maxRetries: 0,
    notifyChannels: ['log', 'console', 'slack', 'email'],
  },
  [ErrorSeverity.FATAL]: {
    level: ErrorSeverity.FATAL,
    weight: 6,
    requiresEscalation: true,
    autoRetryable: false,
    maxRetries: 0,
    notifyChannels: ['log', 'console', 'slack', 'email', 'pagerduty'],
  },
};
```

### 1.3 Error Code Registry (`src/errors/types/ErrorCode.ts`)

```typescript
/**
 * Standard error codes
 */
export enum ErrorCode {
  // Agent errors (1xxx)
  AGENT_NOT_FOUND = 'E1001',
  AGENT_EXECUTION_FAILED = 'E1002',
  AGENT_TIMEOUT = 'E1003',
  AGENT_INVALID_INPUT = 'E1004',
  AGENT_INVALID_OUTPUT = 'E1005',
  AGENT_SKILL_NOT_FOUND = 'E1006',
  AGENT_HANDOFF_FAILED = 'E1007',
  
  // Workflow errors (2xxx)
  WORKFLOW_INVALID_STATE = 'E2001',
  WORKFLOW_PHASE_FAILED = 'E2002',
  WORKFLOW_TIMEOUT = 'E2003',
  WORKFLOW_DEPENDENCY_MISSING = 'E2004',
  WORKFLOW_CYCLE_DETECTED = 'E2005',
  
  // MCP errors (3xxx)
  MCP_CONNECTION_FAILED = 'E3001',
  MCP_TOOL_NOT_FOUND = 'E3002',
  MCP_EXECUTION_FAILED = 'E3003',
  MCP_TIMEOUT = 'E3004',
  MCP_INVALID_RESPONSE = 'E3005',
  
  // Code generation errors (4xxx)
  CODEGEN_TEMPLATE_NOT_FOUND = 'E4001',
  CODEGEN_INVALID_INPUT = 'E4002',
  CODEGEN_COMPILATION_FAILED = 'E4003',
  CODEGEN_LINT_FAILED = 'E4004',
  CODEGEN_TEST_FAILED = 'E4005',
  
  // Infrastructure errors (5xxx)
  INFRA_BICEP_INVALID = 'E5001',
  INFRA_DEPLOYMENT_FAILED = 'E5002',
  INFRA_RESOURCE_EXISTS = 'E5003',
  INFRA_QUOTA_EXCEEDED = 'E5004',
  INFRA_PERMISSION_DENIED = 'E5005',
  
  // State/persistence errors (6xxx)
  STATE_SAVE_FAILED = 'E6001',
  STATE_LOAD_FAILED = 'E6002',
  STATE_CORRUPTED = 'E6003',
  STATE_VERSION_MISMATCH = 'E6004',
  CHECKPOINT_NOT_FOUND = 'E6005',
  ROLLBACK_FAILED = 'E6006',
  
  // Validation errors (7xxx)
  VALIDATION_SCHEMA_INVALID = 'E7001',
  VALIDATION_TYPE_MISMATCH = 'E7002',
  VALIDATION_CONSTRAINT_FAILED = 'E7003',
  VALIDATION_REQUIRED_MISSING = 'E7004',
  
  // External service errors (8xxx)
  EXTERNAL_AZURE_ERROR = 'E8001',
  EXTERNAL_GITHUB_ERROR = 'E8002',
  EXTERNAL_API_ERROR = 'E8003',
  EXTERNAL_RATE_LIMITED = 'E8004',
  EXTERNAL_UNAVAILABLE = 'E8005',
  
  // Security errors (9xxx)
  SECURITY_AUTH_FAILED = 'E9001',
  SECURITY_UNAUTHORIZED = 'E9002',
  SECURITY_TOKEN_EXPIRED = 'E9003',
  SECURITY_INVALID_CREDENTIALS = 'E9004',
  SECURITY_POLICY_VIOLATION = 'E9005',
  
  // Unknown
  UNKNOWN_ERROR = 'E0000',
}

/**
 * Error code metadata
 */
export interface ErrorCodeMeta {
  code: ErrorCode;
  category: import('./ErrorCategory').ErrorCategory;
  defaultSeverity: import('./ErrorSeverity').ErrorSeverity;
  message: string;
  description: string;
  possibleCauses: string[];
  suggestedActions: string[];
  documentationUrl?: string;
}
```

### 1.4 Error Catalog (`src/errors/ErrorCatalog.ts`)

```typescript
import { ErrorCode, ErrorCodeMeta } from './types/ErrorCode';
import { ErrorCategory } from './types/ErrorCategory';
import { ErrorSeverity } from './types/ErrorSeverity';

/**
 * Centralized error catalog with all error definitions
 */
export class ErrorCatalog {
  private static instance: ErrorCatalog;
  private catalog: Map<ErrorCode, ErrorCodeMeta> = new Map();

  private constructor() {
    this.initializeCatalog();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorCatalog {
    if (!ErrorCatalog.instance) {
      ErrorCatalog.instance = new ErrorCatalog();
    }
    return ErrorCatalog.instance;
  }

  /**
   * Initialize catalog with all error definitions
   */
  private initializeCatalog(): void {
    // Agent errors
    this.register({
      code: ErrorCode.AGENT_NOT_FOUND,
      category: ErrorCategory.CONFIGURATION,
      defaultSeverity: ErrorSeverity.ERROR,
      message: 'Agent not found',
      description: 'The requested agent does not exist or is not registered',
      possibleCauses: [
        'Agent name is misspelled',
        'Agent is not installed',
        'Agent registration failed',
      ],
      suggestedActions: [
        'Check agent name spelling',
        'Verify agent is in agents.json',
        'Run agent discovery',
      ],
      documentationUrl: '/docs/agents/registration',
    });

    this.register({
      code: ErrorCode.AGENT_EXECUTION_FAILED,
      category: ErrorCategory.LOGIC,
      defaultSeverity: ErrorSeverity.ERROR,
      message: 'Agent execution failed',
      description: 'The agent encountered an error during execution',
      possibleCauses: [
        'Invalid input provided',
        'Internal agent error',
        'Dependency not available',
      ],
      suggestedActions: [
        'Check agent logs for details',
        'Verify input format',
        'Retry with different parameters',
      ],
    });

    this.register({
      code: ErrorCode.AGENT_TIMEOUT,
      category: ErrorCategory.TRANSIENT,
      defaultSeverity: ErrorSeverity.WARNING,
      message: 'Agent execution timed out',
      description: 'The agent did not complete within the allowed time',
      possibleCauses: [
        'Complex task taking too long',
        'Agent stuck in loop',
        'External service slow',
      ],
      suggestedActions: [
        'Increase timeout if task is complex',
        'Check for infinite loops',
        'Verify external services',
      ],
    });

    // MCP errors
    this.register({
      code: ErrorCode.MCP_CONNECTION_FAILED,
      category: ErrorCategory.EXTERNAL,
      defaultSeverity: ErrorSeverity.HIGH,
      message: 'MCP connection failed',
      description: 'Could not establish connection to MCP server',
      possibleCauses: [
        'MCP server not running',
        'Network connectivity issue',
        'Invalid server URL',
      ],
      suggestedActions: [
        'Start the MCP server',
        'Check network connectivity',
        'Verify MCP configuration',
      ],
    });

    this.register({
      code: ErrorCode.MCP_TOOL_NOT_FOUND,
      category: ErrorCategory.CONFIGURATION,
      defaultSeverity: ErrorSeverity.ERROR,
      message: 'MCP tool not found',
      description: 'The requested MCP tool is not available',
      possibleCauses: [
        'Tool name is incorrect',
        'Tool not installed on server',
        'Server version mismatch',
      ],
      suggestedActions: [
        'Check tool name spelling',
        'Verify tool is installed',
        'Update MCP server',
      ],
    });

    // Infrastructure errors
    this.register({
      code: ErrorCode.INFRA_BICEP_INVALID,
      category: ErrorCategory.VALIDATION,
      defaultSeverity: ErrorSeverity.ERROR,
      message: 'Invalid Bicep template',
      description: 'The Bicep template contains syntax or semantic errors',
      possibleCauses: [
        'Syntax error in Bicep',
        'Invalid resource type',
        'Missing required parameter',
      ],
      suggestedActions: [
        'Run bicep build to see errors',
        'Check resource API version',
        'Verify all parameters are provided',
      ],
    });

    this.register({
      code: ErrorCode.INFRA_DEPLOYMENT_FAILED,
      category: ErrorCategory.EXTERNAL,
      defaultSeverity: ErrorSeverity.HIGH,
      message: 'Infrastructure deployment failed',
      description: 'Azure deployment did not complete successfully',
      possibleCauses: [
        'Resource conflict',
        'Insufficient permissions',
        'Azure service issue',
      ],
      suggestedActions: [
        'Check Azure deployment logs',
        'Verify RBAC permissions',
        'Check Azure status page',
      ],
    });

    // State errors
    this.register({
      code: ErrorCode.STATE_CORRUPTED,
      category: ErrorCategory.CRITICAL,
      defaultSeverity: ErrorSeverity.CRITICAL,
      message: 'State data corrupted',
      description: 'The persisted state data is invalid or corrupted',
      possibleCauses: [
        'Interrupted write operation',
        'Disk corruption',
        'Version incompatibility',
      ],
      suggestedActions: [
        'Restore from backup',
        'Run state recovery tool',
        'Contact support',
      ],
    });

    this.register({
      code: ErrorCode.ROLLBACK_FAILED,
      category: ErrorCategory.CRITICAL,
      defaultSeverity: ErrorSeverity.CRITICAL,
      message: 'Rollback operation failed',
      description: 'Could not restore to previous checkpoint',
      possibleCauses: [
        'Checkpoint not found',
        'Checkpoint corrupted',
        'Insufficient permissions',
      ],
      suggestedActions: [
        'Try earlier checkpoint',
        'Manual state recovery',
        'Escalate to support',
      ],
    });

    // Validation errors
    this.register({
      code: ErrorCode.VALIDATION_SCHEMA_INVALID,
      category: ErrorCategory.VALIDATION,
      defaultSeverity: ErrorSeverity.ERROR,
      message: 'Schema validation failed',
      description: 'Input does not match expected schema',
      possibleCauses: [
        'Missing required fields',
        'Invalid field types',
        'Unknown fields present',
      ],
      suggestedActions: [
        'Check input against schema',
        'Review validation errors',
        'Update input format',
      ],
    });

    // External service errors
    this.register({
      code: ErrorCode.EXTERNAL_RATE_LIMITED,
      category: ErrorCategory.TRANSIENT,
      defaultSeverity: ErrorSeverity.WARNING,
      message: 'Rate limit exceeded',
      description: 'Too many requests to external service',
      possibleCauses: [
        'High request volume',
        'Aggressive polling',
        'Shared rate limit',
      ],
      suggestedActions: [
        'Wait and retry',
        'Implement backoff',
        'Request rate limit increase',
      ],
    });

    // Security errors
    this.register({
      code: ErrorCode.SECURITY_TOKEN_EXPIRED,
      category: ErrorCategory.SECURITY,
      defaultSeverity: ErrorSeverity.ERROR,
      message: 'Authentication token expired',
      description: 'The authentication token is no longer valid',
      possibleCauses: [
        'Token TTL exceeded',
        'Token revoked',
        'Clock skew',
      ],
      suggestedActions: [
        'Refresh authentication',
        'Re-login',
        'Check system clock',
      ],
    });

    // Unknown error
    this.register({
      code: ErrorCode.UNKNOWN_ERROR,
      category: ErrorCategory.UNKNOWN,
      defaultSeverity: ErrorSeverity.ERROR,
      message: 'Unknown error occurred',
      description: 'An unexpected error occurred',
      possibleCauses: [
        'Unhandled exception',
        'System error',
        'Unknown condition',
      ],
      suggestedActions: [
        'Check error logs',
        'Report issue',
        'Retry operation',
      ],
    });
  }

  /**
   * Register an error code
   */
  register(meta: ErrorCodeMeta): void {
    this.catalog.set(meta.code, meta);
  }

  /**
   * Get error metadata
   */
  get(code: ErrorCode): ErrorCodeMeta | undefined {
    return this.catalog.get(code);
  }

  /**
   * Get all errors by category
   */
  getByCategory(category: ErrorCategory): ErrorCodeMeta[] {
    return Array.from(this.catalog.values())
      .filter(meta => meta.category === category);
  }

  /**
   * Get all errors by severity
   */
  getBySeverity(severity: ErrorSeverity): ErrorCodeMeta[] {
    return Array.from(this.catalog.values())
      .filter(meta => meta.defaultSeverity === severity);
  }

  /**
   * Get all error codes
   */
  getAllCodes(): ErrorCode[] {
    return Array.from(this.catalog.keys());
  }
}

/**
 * Get error catalog singleton
 */
export function getErrorCatalog(): ErrorCatalog {
  return ErrorCatalog.getInstance();
}
```

### 1.5 Error Context (`src/errors/ErrorContext.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import { ErrorCode } from './types/ErrorCode';
import { ErrorCategory } from './types/ErrorCategory';
import { ErrorSeverity } from './types/ErrorSeverity';

/**
 * Rich error context for debugging
 */
export interface ErrorContext {
  /** Unique error instance ID */
  errorId: string;
  
  /** Error code */
  code: ErrorCode;
  
  /** Error category */
  category: ErrorCategory;
  
  /** Severity level */
  severity: ErrorSeverity;
  
  /** Human-readable message */
  message: string;
  
  /** Detailed description */
  description?: string;
  
  /** Original error (if wrapped) */
  cause?: Error;
  
  /** Stack trace */
  stack?: string;
  
  /** When error occurred */
  timestamp: Date;
  
  /** Execution context */
  execution: ExecutionContext;
  
  /** Additional metadata */
  metadata: Record<string, unknown>;
  
  /** Suggested recovery actions */
  suggestedActions: string[];
  
  /** Documentation link */
  documentationUrl?: string;
}

/**
 * Execution context when error occurred
 */
export interface ExecutionContext {
  /** Workflow execution ID */
  workflowId?: string;
  
  /** Current phase */
  phase?: number;
  
  /** Current agent */
  agent?: string;
  
  /** Current operation */
  operation?: string;
  
  /** Input that caused error */
  input?: unknown;
  
  /** Partial output before error */
  partialOutput?: unknown;
  
  /** Request ID for tracing */
  requestId?: string;
  
  /** User ID */
  userId?: string;
  
  /** Session ID */
  sessionId?: string;
}

/**
 * Build error context
 */
export class ErrorContextBuilder {
  private context: Partial<ErrorContext> = {
    errorId: uuid(),
    timestamp: new Date(),
    metadata: {},
    suggestedActions: [],
  };

  /**
   * Set error code
   */
  withCode(code: ErrorCode): this {
    this.context.code = code;
    return this;
  }

  /**
   * Set category
   */
  withCategory(category: ErrorCategory): this {
    this.context.category = category;
    return this;
  }

  /**
   * Set severity
   */
  withSeverity(severity: ErrorSeverity): this {
    this.context.severity = severity;
    return this;
  }

  /**
   * Set message
   */
  withMessage(message: string): this {
    this.context.message = message;
    return this;
  }

  /**
   * Set description
   */
  withDescription(description: string): this {
    this.context.description = description;
    return this;
  }

  /**
   * Set cause
   */
  withCause(cause: Error): this {
    this.context.cause = cause;
    this.context.stack = cause.stack;
    return this;
  }

  /**
   * Set execution context
   */
  withExecution(execution: Partial<ExecutionContext>): this {
    this.context.execution = {
      ...this.context.execution,
      ...execution,
    } as ExecutionContext;
    return this;
  }

  /**
   * Add metadata
   */
  withMetadata(key: string, value: unknown): this {
    this.context.metadata![key] = value;
    return this;
  }

  /**
   * Add suggested action
   */
  withSuggestedAction(action: string): this {
    this.context.suggestedActions!.push(action);
    return this;
  }

  /**
   * Set documentation URL
   */
  withDocumentation(url: string): this {
    this.context.documentationUrl = url;
    return this;
  }

  /**
   * Build the context
   */
  build(): ErrorContext {
    if (!this.context.code) {
      this.context.code = ErrorCode.UNKNOWN_ERROR;
    }
    if (!this.context.category) {
      this.context.category = ErrorCategory.UNKNOWN;
    }
    if (!this.context.severity) {
      this.context.severity = ErrorSeverity.ERROR;
    }
    if (!this.context.message) {
      this.context.message = 'An error occurred';
    }
    if (!this.context.execution) {
      this.context.execution = {};
    }

    return this.context as ErrorContext;
  }
}

/**
 * Create error context builder
 */
export function errorContext(): ErrorContextBuilder {
  return new ErrorContextBuilder();
}
```

### 1.6 Error Classifier (`src/errors/ErrorClassifier.ts`)

```typescript
import { ErrorCode } from './types/ErrorCode';
import { ErrorCategory, ErrorSubcategory } from './types/ErrorCategory';
import { ErrorSeverity } from './types/ErrorSeverity';
import { ErrorContext, errorContext } from './ErrorContext';
import { getErrorCatalog } from './ErrorCatalog';
import { ErrorPatterns, getErrorPatterns } from './ErrorPatterns';

/**
 * Classification result
 */
export interface ClassificationResult {
  code: ErrorCode;
  category: ErrorCategory;
  subcategory?: ErrorSubcategory;
  severity: ErrorSeverity;
  confidence: number; // 0-1
  matchedPattern?: string;
}

/**
 * Classifier options
 */
export interface ClassifierOptions {
  /** Include stack trace analysis */
  analyzeStack?: boolean;
  
  /** Context for better classification */
  executionContext?: Partial<import('./ErrorContext').ExecutionContext>;
  
  /** Custom patterns to match first */
  customPatterns?: ErrorPattern[];
}

/**
 * Error pattern for matching
 */
export interface ErrorPattern {
  id: string;
  pattern: RegExp | string;
  code: ErrorCode;
  category: ErrorCategory;
  subcategory?: ErrorSubcategory;
  severity?: ErrorSeverity;
  priority?: number;
}

/**
 * Error classifier that categorizes errors
 */
export class ErrorClassifier {
  private catalog = getErrorCatalog();
  private patterns = getErrorPatterns();

  /**
   * Classify an error
   */
  classify(error: Error | unknown, options: ClassifierOptions = {}): ClassificationResult {
    const errorObj = this.normalizeError(error);
    
    // Try custom patterns first
    if (options.customPatterns) {
      const customMatch = this.matchPatterns(errorObj, options.customPatterns);
      if (customMatch && customMatch.confidence > 0.8) {
        return customMatch;
      }
    }

    // Try built-in patterns
    const patternMatch = this.matchPatterns(errorObj, this.patterns.getAll());
    if (patternMatch && patternMatch.confidence > 0.7) {
      return patternMatch;
    }

    // Try error name/code matching
    const codeMatch = this.matchByCode(errorObj);
    if (codeMatch) {
      return codeMatch;
    }

    // Stack trace analysis
    if (options.analyzeStack && errorObj.stack) {
      const stackMatch = this.analyzeStack(errorObj.stack);
      if (stackMatch && stackMatch.confidence > 0.5) {
        return stackMatch;
      }
    }

    // Context-based classification
    if (options.executionContext) {
      const contextMatch = this.classifyByContext(errorObj, options.executionContext);
      if (contextMatch) {
        return contextMatch;
      }
    }

    // Default to unknown
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      confidence: 0.1,
    };
  }

  /**
   * Build full error context
   */
  buildContext(error: Error | unknown, options: ClassifierOptions = {}): ErrorContext {
    const classification = this.classify(error, options);
    const errorObj = this.normalizeError(error);
    const catalogEntry = this.catalog.get(classification.code);

    return errorContext()
      .withCode(classification.code)
      .withCategory(classification.category)
      .withSeverity(classification.severity)
      .withMessage(catalogEntry?.message || errorObj.message)
      .withDescription(catalogEntry?.description)
      .withCause(errorObj)
      .withExecution(options.executionContext || {})
      .withMetadata('confidence', classification.confidence)
      .withMetadata('matchedPattern', classification.matchedPattern)
      .withDocumentation(catalogEntry?.documentationUrl)
      .build();
  }

  /**
   * Normalize error to Error object
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'string') {
      return new Error(error);
    }
    if (typeof error === 'object' && error !== null) {
      const obj = error as Record<string, unknown>;
      const err = new Error(String(obj.message || obj.error || 'Unknown error'));
      if (obj.code) (err as any).code = obj.code;
      if (obj.stack) err.stack = String(obj.stack);
      return err;
    }
    return new Error('Unknown error');
  }

  /**
   * Match error against patterns
   */
  private matchPatterns(error: Error, patterns: ErrorPattern[]): ClassificationResult | null {
    const message = error.message.toLowerCase();
    const errorCode = (error as any).code;
    
    // Sort by priority
    const sorted = [...patterns].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const pattern of sorted) {
      let matches = false;
      
      if (pattern.pattern instanceof RegExp) {
        matches = pattern.pattern.test(error.message) || pattern.pattern.test(error.stack || '');
      } else {
        matches = message.includes(pattern.pattern.toLowerCase());
      }

      if (matches) {
        const catalogEntry = this.catalog.get(pattern.code);
        return {
          code: pattern.code,
          category: pattern.category,
          subcategory: pattern.subcategory,
          severity: pattern.severity || catalogEntry?.defaultSeverity || ErrorSeverity.ERROR,
          confidence: 0.85,
          matchedPattern: pattern.id,
        };
      }
    }

    return null;
  }

  /**
   * Match by error code property
   */
  private matchByCode(error: Error): ClassificationResult | null {
    const code = (error as any).code;
    if (!code) return null;

    // Node.js error codes
    const nodeCodeMap: Record<string, { code: ErrorCode; category: ErrorCategory }> = {
      'ENOENT': { code: ErrorCode.STATE_LOAD_FAILED, category: ErrorCategory.RESOURCE },
      'EACCES': { code: ErrorCode.SECURITY_UNAUTHORIZED, category: ErrorCategory.SECURITY },
      'ETIMEDOUT': { code: ErrorCode.AGENT_TIMEOUT, category: ErrorCategory.TRANSIENT },
      'ECONNREFUSED': { code: ErrorCode.MCP_CONNECTION_FAILED, category: ErrorCategory.EXTERNAL },
      'ECONNRESET': { code: ErrorCode.MCP_CONNECTION_FAILED, category: ErrorCategory.TRANSIENT },
    };

    const mapping = nodeCodeMap[code];
    if (mapping) {
      const catalogEntry = this.catalog.get(mapping.code);
      return {
        ...mapping,
        severity: catalogEntry?.defaultSeverity || ErrorSeverity.ERROR,
        confidence: 0.9,
      };
    }

    return null;
  }

  /**
   * Analyze stack trace for classification hints
   */
  private analyzeStack(stack: string): ClassificationResult | null {
    const stackLower = stack.toLowerCase();

    // MCP-related
    if (stackLower.includes('mcp') || stackLower.includes('modelcontextprotocol')) {
      return {
        code: ErrorCode.MCP_EXECUTION_FAILED,
        category: ErrorCategory.EXTERNAL,
        severity: ErrorSeverity.ERROR,
        confidence: 0.6,
      };
    }

    // Agent-related
    if (stackLower.includes('agent') && stackLower.includes('execute')) {
      return {
        code: ErrorCode.AGENT_EXECUTION_FAILED,
        category: ErrorCategory.LOGIC,
        severity: ErrorSeverity.ERROR,
        confidence: 0.6,
      };
    }

    // Workflow-related
    if (stackLower.includes('workflow') || stackLower.includes('orchestrat')) {
      return {
        code: ErrorCode.WORKFLOW_PHASE_FAILED,
        category: ErrorCategory.LOGIC,
        severity: ErrorSeverity.ERROR,
        confidence: 0.6,
      };
    }

    return null;
  }

  /**
   * Classify based on execution context
   */
  private classifyByContext(
    error: Error,
    context: Partial<import('./ErrorContext').ExecutionContext>
  ): ClassificationResult | null {
    // Agent context
    if (context.agent) {
      return {
        code: ErrorCode.AGENT_EXECUTION_FAILED,
        category: ErrorCategory.LOGIC,
        severity: ErrorSeverity.ERROR,
        confidence: 0.5,
      };
    }

    // Workflow context
    if (context.workflowId) {
      return {
        code: ErrorCode.WORKFLOW_PHASE_FAILED,
        category: ErrorCategory.LOGIC,
        severity: ErrorSeverity.ERROR,
        confidence: 0.5,
      };
    }

    return null;
  }
}

/**
 * Get error classifier singleton
 */
let classifierInstance: ErrorClassifier | null = null;

export function getErrorClassifier(): ErrorClassifier {
  if (!classifierInstance) {
    classifierInstance = new ErrorClassifier();
  }
  return classifierInstance;
}
```

### 1.7 Error Patterns (`src/errors/ErrorPatterns.ts`)

```typescript
import { ErrorCode } from './types/ErrorCode';
import { ErrorCategory, ErrorSubcategory } from './types/ErrorCategory';
import { ErrorPattern } from './ErrorClassifier';

/**
 * Error patterns registry
 */
export class ErrorPatterns {
  private patterns: ErrorPattern[] = [];

  constructor() {
    this.initializePatterns();
  }

  /**
   * Initialize built-in patterns
   */
  private initializePatterns(): void {
    // Network patterns
    this.add({
      id: 'net-timeout',
      pattern: /timeout|ETIMEDOUT|timed out/i,
      code: ErrorCode.AGENT_TIMEOUT,
      category: ErrorCategory.TRANSIENT,
      subcategory: 'network_timeout',
      priority: 10,
    });

    this.add({
      id: 'net-refused',
      pattern: /ECONNREFUSED|connection refused/i,
      code: ErrorCode.MCP_CONNECTION_FAILED,
      category: ErrorCategory.EXTERNAL,
      subcategory: 'connection_reset',
      priority: 10,
    });

    this.add({
      id: 'net-reset',
      pattern: /ECONNRESET|connection reset/i,
      code: ErrorCode.MCP_CONNECTION_FAILED,
      category: ErrorCategory.TRANSIENT,
      subcategory: 'connection_reset',
      priority: 10,
    });

    // Rate limiting
    this.add({
      id: 'rate-limit',
      pattern: /rate limit|429|too many requests/i,
      code: ErrorCode.EXTERNAL_RATE_LIMITED,
      category: ErrorCategory.TRANSIENT,
      subcategory: 'rate_limited',
      priority: 15,
    });

    // File system
    this.add({
      id: 'file-not-found',
      pattern: /ENOENT|no such file|file not found/i,
      code: ErrorCode.STATE_LOAD_FAILED,
      category: ErrorCategory.RESOURCE,
      subcategory: 'file_not_found',
      priority: 10,
    });

    this.add({
      id: 'permission-denied',
      pattern: /EACCES|permission denied|access denied/i,
      code: ErrorCode.SECURITY_UNAUTHORIZED,
      category: ErrorCategory.SECURITY,
      subcategory: 'permission_denied',
      priority: 10,
    });

    // Memory
    this.add({
      id: 'out-of-memory',
      pattern: /out of memory|heap|ENOMEM/i,
      code: ErrorCode.UNKNOWN_ERROR,
      category: ErrorCategory.RESOURCE,
      subcategory: 'out_of_memory',
      priority: 20,
    });

    // Authentication
    this.add({
      id: 'auth-failed',
      pattern: /401|unauthorized|authentication failed/i,
      code: ErrorCode.SECURITY_AUTH_FAILED,
      category: ErrorCategory.SECURITY,
      subcategory: 'authentication_failed',
      priority: 15,
    });

    this.add({
      id: 'token-expired',
      pattern: /token expired|jwt expired|token invalid/i,
      code: ErrorCode.SECURITY_TOKEN_EXPIRED,
      category: ErrorCategory.SECURITY,
      subcategory: 'token_expired',
      priority: 15,
    });

    // Validation
    this.add({
      id: 'validation-schema',
      pattern: /schema|validation failed|invalid format/i,
      code: ErrorCode.VALIDATION_SCHEMA_INVALID,
      category: ErrorCategory.VALIDATION,
      subcategory: 'schema_invalid',
      priority: 5,
    });

    // MCP specific
    this.add({
      id: 'mcp-tool',
      pattern: /tool not found|unknown tool|MCP.*tool/i,
      code: ErrorCode.MCP_TOOL_NOT_FOUND,
      category: ErrorCategory.CONFIGURATION,
      priority: 10,
    });

    // Bicep/Infrastructure
    this.add({
      id: 'bicep-error',
      pattern: /BCP\d+|bicep.*error/i,
      code: ErrorCode.INFRA_BICEP_INVALID,
      category: ErrorCategory.VALIDATION,
      priority: 10,
    });

    this.add({
      id: 'azure-deployment',
      pattern: /deployment failed|Azure.*error|ResourceNotFound/i,
      code: ErrorCode.INFRA_DEPLOYMENT_FAILED,
      category: ErrorCategory.EXTERNAL,
      priority: 10,
    });

    // Agent specific
    this.add({
      id: 'agent-not-found',
      pattern: /agent.*not found|unknown agent/i,
      code: ErrorCode.AGENT_NOT_FOUND,
      category: ErrorCategory.CONFIGURATION,
      priority: 10,
    });

    this.add({
      id: 'agent-handoff',
      pattern: /handoff failed|handoff error/i,
      code: ErrorCode.AGENT_HANDOFF_FAILED,
      category: ErrorCategory.LOGIC,
      priority: 10,
    });
  }

  /**
   * Add pattern
   */
  add(pattern: ErrorPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Get all patterns
   */
  getAll(): ErrorPattern[] {
    return this.patterns;
  }

  /**
   * Get patterns by category
   */
  getByCategory(category: ErrorCategory): ErrorPattern[] {
    return this.patterns.filter(p => p.category === category);
  }
}

/**
 * Get error patterns singleton
 */
let patternsInstance: ErrorPatterns | null = null;

export function getErrorPatterns(): ErrorPatterns {
  if (!patternsInstance) {
    patternsInstance = new ErrorPatterns();
  }
  return patternsInstance;
}
```

---

## 📊 Error Category Matrix

| Category | Subcategories | Auto-Retry | Escalate |
|----------|---------------|------------|----------|
| TRANSIENT | timeout, rate_limit, connection | ✅ Yes | ⚠️ After retries |
| VALIDATION | schema, type, constraint | ❌ No | ❌ No |
| RESOURCE | memory, disk, file | ⚠️ Maybe | ✅ Yes |
| LOGIC | state, assertion, null | ❌ No | ✅ Yes |
| EXTERNAL | azure, mcp, api | ✅ Yes | ⚠️ After retries |
| SECURITY | auth, token, permission | ❌ No | ✅ Yes |
| CRITICAL | corruption, crash | ❌ No | ✅ Immediate |

---

## 📋 Acceptance Criteria

- [ ] ErrorCatalog contains all error codes
- [ ] ErrorClassifier correctly categorizes 90%+ of errors
- [ ] Pattern matching works for common errors
- [ ] Stack trace analysis provides hints
- [ ] ErrorContext captures full debugging info
- [ ] Severity calculation is accurate

---

## 🔗 Navigation

← [00-OVERVIEW.md](00-OVERVIEW.md) | [02-PHASE-RETRY-CIRCUIT-BREAKER.md](02-PHASE-RETRY-CIRCUIT-BREAKER.md) →
