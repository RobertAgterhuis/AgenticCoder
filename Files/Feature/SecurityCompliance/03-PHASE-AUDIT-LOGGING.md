# Phase 3: Audit Logging

**Phase ID:** F-SEC-P03  
**Feature:** SecurityCompliance  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 2 (Security Scanning)

---

## 🎯 Phase Objectives

Deze phase implementeert **immutable audit logging**:
- Tamper-proof audit trail
- Structured security events
- Log rotation and retention
- Query and search capabilities
- Export for compliance

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── security/
│   └── audit/
│       ├── index.ts
│       ├── AuditLogger.ts
│       ├── AuditEvent.ts
│       ├── storage/
│       │   ├── AuditStorage.ts
│       │   ├── FileAuditStorage.ts
│       │   └── AzureAuditStorage.ts
│       ├── integrity/
│       │   └── HashChain.ts
│       └── query/
│           └── AuditQuery.ts
```

---

## 🔧 Implementation Details

### 3.1 Audit Event (`src/security/audit/AuditEvent.ts`)

```typescript
/**
 * Audit event types
 */
export type AuditEventType =
  // Lifecycle events
  | 'session_start'
  | 'session_end'
  // Execution events
  | 'execution_start'
  | 'execution_end'
  | 'execution_error'
  // Agent events
  | 'agent_start'
  | 'agent_end'
  | 'agent_handoff'
  // Code generation events
  | 'code_generated'
  | 'code_modified'
  | 'code_deleted'
  // Security events
  | 'secret_accessed'
  | 'secret_rotated'
  | 'scan_completed'
  | 'vulnerability_found'
  | 'policy_violation'
  // Configuration events
  | 'config_changed'
  | 'permission_changed'
  // External events
  | 'api_call'
  | 'azure_operation'
  | 'github_operation';

/**
 * Audit event severity
 */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Actor types
 */
export type ActorType = 'system' | 'agent' | 'user' | 'external';

/**
 * Actor information
 */
export interface AuditActor {
  type: ActorType;
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
}

/**
 * Resource information
 */
export interface AuditResource {
  type: string;
  id: string;
  name?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Security context
 */
export interface SecurityContext {
  secretsAccessed?: string[];
  complianceChecks?: string[];
  scanResults?: {
    scanner: string;
    passed: boolean;
    findingsCount: number;
  }[];
  policyViolations?: string[];
}

/**
 * Audit event
 */
export interface AuditEvent {
  // Identifiers
  id: string;
  correlationId?: string;
  parentEventId?: string;
  
  // Timing
  timestamp: Date;
  duration?: number;
  
  // Classification
  type: AuditEventType;
  severity: AuditSeverity;
  category: string;
  
  // Actors
  actor: AuditActor;
  
  // Action details
  action: string;
  resource?: AuditResource;
  outcome: 'success' | 'failure' | 'pending';
  
  // Details
  details: Record<string, unknown>;
  securityContext?: SecurityContext;
  
  // Integrity
  hash?: string;
  previousHash?: string;
}

/**
 * Create audit event builder
 */
export class AuditEventBuilder {
  private event: Partial<AuditEvent> = {
    timestamp: new Date(),
    severity: 'info',
    outcome: 'success',
    details: {},
  };

  /**
   * Set event type
   */
  type(type: AuditEventType): this {
    this.event.type = type;
    return this;
  }

  /**
   * Set severity
   */
  severity(severity: AuditSeverity): this {
    this.event.severity = severity;
    return this;
  }

  /**
   * Set category
   */
  category(category: string): this {
    this.event.category = category;
    return this;
  }

  /**
   * Set actor
   */
  actor(actor: AuditActor): this {
    this.event.actor = actor;
    return this;
  }

  /**
   * Set system actor
   */
  systemActor(component: string): this {
    this.event.actor = {
      type: 'system',
      id: `system:${component}`,
      name: component,
    };
    return this;
  }

  /**
   * Set agent actor
   */
  agentActor(agentId: string, agentName: string): this {
    this.event.actor = {
      type: 'agent',
      id: `agent:${agentId}`,
      name: agentName,
    };
    return this;
  }

  /**
   * Set action
   */
  action(action: string): this {
    this.event.action = action;
    return this;
  }

  /**
   * Set resource
   */
  resource(resource: AuditResource): this {
    this.event.resource = resource;
    return this;
  }

  /**
   * Set file resource
   */
  fileResource(path: string): this {
    this.event.resource = {
      type: 'file',
      id: path,
      path,
    };
    return this;
  }

  /**
   * Set outcome
   */
  outcome(outcome: AuditEvent['outcome']): this {
    this.event.outcome = outcome;
    return this;
  }

  /**
   * Set correlation ID
   */
  correlationId(id: string): this {
    this.event.correlationId = id;
    return this;
  }

  /**
   * Set parent event
   */
  parentEvent(id: string): this {
    this.event.parentEventId = id;
    return this;
  }

  /**
   * Add detail
   */
  detail(key: string, value: unknown): this {
    this.event.details![key] = value;
    return this;
  }

  /**
   * Set details
   */
  details(details: Record<string, unknown>): this {
    this.event.details = { ...this.event.details, ...details };
    return this;
  }

  /**
   * Set security context
   */
  securityContext(context: SecurityContext): this {
    this.event.securityContext = context;
    return this;
  }

  /**
   * Set duration
   */
  duration(ms: number): this {
    this.event.duration = ms;
    return this;
  }

  /**
   * Build event
   */
  build(): AuditEvent {
    if (!this.event.type) {
      throw new Error('Event type is required');
    }
    if (!this.event.actor) {
      throw new Error('Actor is required');
    }
    if (!this.event.action) {
      throw new Error('Action is required');
    }

    return {
      id: this.generateId(),
      ...this.event,
    } as AuditEvent;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `aud-${timestamp}-${random}`;
  }
}

/**
 * Create event builder
 */
export function createAuditEvent(): AuditEventBuilder {
  return new AuditEventBuilder();
}
```

### 3.2 Hash Chain (`src/security/audit/integrity/HashChain.ts`)

```typescript
import * as crypto from 'crypto';

/**
 * Hash chain entry
 */
export interface HashChainEntry {
  index: number;
  timestamp: Date;
  dataHash: string;
  previousHash: string;
  hash: string;
}

/**
 * Hash chain for tamper-proof audit trail
 */
export class HashChain {
  private chain: HashChainEntry[] = [];
  private algorithm: string;

  constructor(algorithm: string = 'sha256') {
    this.algorithm = algorithm;
    
    // Genesis block
    this.chain.push({
      index: 0,
      timestamp: new Date(),
      dataHash: this.hash('genesis'),
      previousHash: '0'.repeat(64),
      hash: this.hash('genesis-0'.repeat(64)),
    });
  }

  /**
   * Add entry to chain
   */
  addEntry(data: unknown): HashChainEntry {
    const previousEntry = this.chain[this.chain.length - 1];
    const index = previousEntry.index + 1;
    const timestamp = new Date();
    const dataHash = this.hash(JSON.stringify(data));
    const previousHash = previousEntry.hash;
    
    const entry: HashChainEntry = {
      index,
      timestamp,
      dataHash,
      previousHash,
      hash: this.calculateHash(index, timestamp, dataHash, previousHash),
    };

    this.chain.push(entry);
    return entry;
  }

  /**
   * Verify chain integrity
   */
  verifyIntegrity(): { valid: boolean; error?: string; brokenAt?: number } {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Check previous hash
      if (current.previousHash !== previous.hash) {
        return {
          valid: false,
          error: 'Previous hash mismatch',
          brokenAt: i,
        };
      }

      // Verify current hash
      const expectedHash = this.calculateHash(
        current.index,
        current.timestamp,
        current.dataHash,
        current.previousHash
      );

      if (current.hash !== expectedHash) {
        return {
          valid: false,
          error: 'Hash verification failed',
          brokenAt: i,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get entry by index
   */
  getEntry(index: number): HashChainEntry | null {
    return this.chain[index] || null;
  }

  /**
   * Get latest entry
   */
  getLatest(): HashChainEntry {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Get chain length
   */
  get length(): number {
    return this.chain.length;
  }

  /**
   * Export chain
   */
  export(): HashChainEntry[] {
    return [...this.chain];
  }

  /**
   * Import chain (for restoration)
   */
  static import(entries: HashChainEntry[], algorithm: string = 'sha256'): HashChain {
    const chain = new HashChain(algorithm);
    chain.chain = entries;
    
    // Verify imported chain
    const verification = chain.verifyIntegrity();
    if (!verification.valid) {
      throw new Error(`Invalid chain: ${verification.error} at index ${verification.brokenAt}`);
    }
    
    return chain;
  }

  /**
   * Calculate hash
   */
  private calculateHash(
    index: number,
    timestamp: Date,
    dataHash: string,
    previousHash: string
  ): string {
    const data = `${index}-${timestamp.toISOString()}-${dataHash}-${previousHash}`;
    return this.hash(data);
  }

  /**
   * Hash string
   */
  private hash(data: string): string {
    return crypto
      .createHash(this.algorithm)
      .update(data)
      .digest('hex');
  }
}

/**
 * Create new hash chain
 */
export function createHashChain(algorithm?: string): HashChain {
  return new HashChain(algorithm);
}
```

### 3.3 Audit Logger (`src/security/audit/AuditLogger.ts`)

```typescript
import { EventEmitter } from 'events';
import { AuditEvent, AuditEventType, AuditSeverity, createAuditEvent } from './AuditEvent';
import { AuditStorage } from './storage/AuditStorage';
import { HashChain, createHashChain } from './integrity/HashChain';

/**
 * Audit logger options
 */
export interface AuditLoggerOptions {
  storage: AuditStorage;
  enableHashChain?: boolean;
  bufferSize?: number;
  flushInterval?: number;
  minSeverity?: AuditSeverity;
}

/**
 * Audit logger - central audit logging facility
 */
export class AuditLogger extends EventEmitter {
  private storage: AuditStorage;
  private hashChain: HashChain | null = null;
  private buffer: AuditEvent[] = [];
  private options: Required<Omit<AuditLoggerOptions, 'storage'>>;
  private flushTimer: NodeJS.Timeout | null = null;
  private correlationStack: string[] = [];

  constructor(options: AuditLoggerOptions) {
    super();
    this.storage = options.storage;
    this.options = {
      enableHashChain: options.enableHashChain ?? true,
      bufferSize: options.bufferSize ?? 100,
      flushInterval: options.flushInterval ?? 5000,
      minSeverity: options.minSeverity ?? 'info',
    };

    if (this.options.enableHashChain) {
      this.hashChain = createHashChain();
    }

    // Start flush timer
    this.startFlushTimer();
  }

  /**
   * Log an audit event
   */
  async log(event: AuditEvent): Promise<void> {
    // Check severity threshold
    if (!this.shouldLog(event.severity)) {
      return;
    }

    // Add correlation ID if in context
    if (this.correlationStack.length > 0 && !event.correlationId) {
      event.correlationId = this.correlationStack[this.correlationStack.length - 1];
    }

    // Add to hash chain if enabled
    if (this.hashChain) {
      const entry = this.hashChain.addEntry(event);
      event.hash = entry.hash;
      event.previousHash = entry.previousHash;
    }

    // Add to buffer
    this.buffer.push(event);

    // Emit event
    this.emit('event', event);

    // Flush if buffer is full
    if (this.buffer.length >= this.options.bufferSize) {
      await this.flush();
    }
  }

  /**
   * Log session start
   */
  async logSessionStart(sessionId: string, metadata?: Record<string, unknown>): Promise<void> {
    const event = createAuditEvent()
      .type('session_start')
      .category('lifecycle')
      .systemActor('session-manager')
      .action('start_session')
      .details({ sessionId, ...metadata })
      .build();

    await this.log(event);
  }

  /**
   * Log session end
   */
  async logSessionEnd(sessionId: string, duration: number): Promise<void> {
    const event = createAuditEvent()
      .type('session_end')
      .category('lifecycle')
      .systemActor('session-manager')
      .action('end_session')
      .details({ sessionId })
      .duration(duration)
      .build();

    await this.log(event);
  }

  /**
   * Log execution start
   */
  async logExecutionStart(executionId: string, config: Record<string, unknown>): Promise<string> {
    this.pushCorrelation(executionId);

    const event = createAuditEvent()
      .type('execution_start')
      .category('execution')
      .systemActor('orchestrator')
      .action('start_execution')
      .correlationId(executionId)
      .details({ executionId, config })
      .build();

    await this.log(event);
    return event.id;
  }

  /**
   * Log execution end
   */
  async logExecutionEnd(
    executionId: string, 
    outcome: 'success' | 'failure',
    duration: number,
    summary?: Record<string, unknown>
  ): Promise<void> {
    const event = createAuditEvent()
      .type('execution_end')
      .category('execution')
      .systemActor('orchestrator')
      .action('end_execution')
      .correlationId(executionId)
      .outcome(outcome)
      .duration(duration)
      .details({ executionId, ...summary })
      .build();

    await this.log(event);
    this.popCorrelation();
  }

  /**
   * Log agent activity
   */
  async logAgentStart(agentId: string, agentName: string, inputs: Record<string, unknown>): Promise<string> {
    const event = createAuditEvent()
      .type('agent_start')
      .category('agent')
      .agentActor(agentId, agentName)
      .action('start_agent')
      .details({ inputs: this.sanitizeDetails(inputs) })
      .build();

    await this.log(event);
    return event.id;
  }

  /**
   * Log agent completion
   */
  async logAgentEnd(
    agentId: string, 
    agentName: string,
    outcome: 'success' | 'failure',
    duration: number,
    outputs?: Record<string, unknown>
  ): Promise<void> {
    const event = createAuditEvent()
      .type('agent_end')
      .category('agent')
      .agentActor(agentId, agentName)
      .action('end_agent')
      .outcome(outcome)
      .duration(duration)
      .details({ outputs: this.sanitizeDetails(outputs || {}) })
      .build();

    await this.log(event);
  }

  /**
   * Log code generation
   */
  async logCodeGenerated(
    generatorName: string,
    filePath: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const event = createAuditEvent()
      .type('code_generated')
      .category('codegen')
      .systemActor(generatorName)
      .action('generate_code')
      .fileResource(filePath)
      .details(metadata || {})
      .build();

    await this.log(event);
  }

  /**
   * Log secret access
   */
  async logSecretAccessed(
    secretName: string, 
    accessor: string,
    purpose: string
  ): Promise<void> {
    const event = createAuditEvent()
      .type('secret_accessed')
      .severity('warning')
      .category('security')
      .systemActor(accessor)
      .action('access_secret')
      .resource({ type: 'secret', id: secretName })
      .details({ purpose })
      .securityContext({ secretsAccessed: [secretName] })
      .build();

    await this.log(event);
  }

  /**
   * Log security scan
   */
  async logScanCompleted(
    scannerName: string,
    scanType: string,
    passed: boolean,
    findingsCount: number,
    details?: Record<string, unknown>
  ): Promise<void> {
    const event = createAuditEvent()
      .type('scan_completed')
      .severity(passed ? 'info' : 'warning')
      .category('security')
      .systemActor(scannerName)
      .action('complete_scan')
      .outcome(passed ? 'success' : 'failure')
      .details({ scanType, passed, findingsCount, ...details })
      .securityContext({
        scanResults: [{ scanner: scannerName, passed, findingsCount }],
      })
      .build();

    await this.log(event);
  }

  /**
   * Log vulnerability found
   */
  async logVulnerabilityFound(
    vulnerability: {
      type: string;
      severity: string;
      title: string;
      file?: string;
      line?: number;
    }
  ): Promise<void> {
    const event = createAuditEvent()
      .type('vulnerability_found')
      .severity(vulnerability.severity as AuditSeverity)
      .category('security')
      .systemActor('security-scanner')
      .action('detect_vulnerability')
      .resource(vulnerability.file ? {
        type: 'file',
        id: vulnerability.file,
        path: vulnerability.file,
        metadata: { line: vulnerability.line },
      } : undefined)
      .details(vulnerability)
      .build();

    await this.log(event);
  }

  /**
   * Log policy violation
   */
  async logPolicyViolation(
    policyId: string,
    policyName: string,
    violationDetails: Record<string, unknown>
  ): Promise<void> {
    const event = createAuditEvent()
      .type('policy_violation')
      .severity('warning')
      .category('compliance')
      .systemActor('policy-engine')
      .action('detect_violation')
      .details({ policyId, policyName, ...violationDetails })
      .securityContext({ policyViolations: [policyId] })
      .build();

    await this.log(event);
  }

  /**
   * Log Azure operation
   */
  async logAzureOperation(
    operation: string,
    resourceType: string,
    resourceName: string,
    outcome: 'success' | 'failure',
    details?: Record<string, unknown>
  ): Promise<void> {
    const event = createAuditEvent()
      .type('azure_operation')
      .category('azure')
      .systemActor('azure-client')
      .action(operation)
      .resource({ type: resourceType, id: resourceName, name: resourceName })
      .outcome(outcome)
      .details(details || {})
      .build();

    await this.log(event);
  }

  /**
   * Flush buffer to storage
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const events = [...this.buffer];
    this.buffer = [];

    try {
      await this.storage.writeEvents(events);
      this.emit('flush', events.length);
    } catch (error) {
      // Put events back in buffer
      this.buffer.unshift(...events);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Verify audit trail integrity
   */
  verifyIntegrity(): { valid: boolean; error?: string; brokenAt?: number } {
    if (!this.hashChain) {
      return { valid: true };
    }
    return this.hashChain.verifyIntegrity();
  }

  /**
   * Push correlation context
   */
  pushCorrelation(id: string): void {
    this.correlationStack.push(id);
  }

  /**
   * Pop correlation context
   */
  popCorrelation(): string | undefined {
    return this.correlationStack.pop();
  }

  /**
   * Close logger
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
    await this.storage.close();
  }

  /**
   * Check if severity should be logged
   */
  private shouldLog(severity: AuditSeverity): boolean {
    const levels = ['info', 'warning', 'error', 'critical'];
    const minLevel = levels.indexOf(this.options.minSeverity);
    const eventLevel = levels.indexOf(severity);
    return eventLevel >= minLevel;
  }

  /**
   * Sanitize details (remove sensitive data)
   */
  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'credential'];
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(details)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitizeDetails(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(
      () => this.flush().catch(err => this.emit('error', err)),
      this.options.flushInterval
    );
  }
}

/**
 * Create audit logger
 */
export function createAuditLogger(options: AuditLoggerOptions): AuditLogger {
  return new AuditLogger(options);
}
```

### 3.4 File Audit Storage (`src/security/audit/storage/FileAuditStorage.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { AuditEvent } from '../AuditEvent';
import { AuditStorage, AuditQueryOptions, AuditQueryResult } from './AuditStorage';

/**
 * File storage options
 */
export interface FileAuditStorageOptions {
  directory: string;
  maxFileSize?: number;
  maxFiles?: number;
  compress?: boolean;
}

/**
 * File-based audit storage
 */
export class FileAuditStorage implements AuditStorage {
  private options: Required<FileAuditStorageOptions>;
  private currentFile: string | null = null;
  private currentSize: number = 0;

  constructor(options: FileAuditStorageOptions) {
    this.options = {
      maxFileSize: options.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      maxFiles: options.maxFiles ?? 100,
      compress: options.compress ?? false,
      ...options,
    };
  }

  /**
   * Initialize storage
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.options.directory, { recursive: true });
    await this.rotateIfNeeded();
  }

  /**
   * Write events
   */
  async writeEvents(events: AuditEvent[]): Promise<void> {
    await this.rotateIfNeeded();

    const lines = events.map(e => JSON.stringify(e)).join('\n') + '\n';
    const filePath = this.getCurrentFilePath();

    await fs.appendFile(filePath, lines, 'utf-8');
    this.currentSize += Buffer.byteLength(lines, 'utf-8');
  }

  /**
   * Query events
   */
  async query(options: AuditQueryOptions): Promise<AuditQueryResult> {
    const files = await this.getLogFiles();
    const events: AuditEvent[] = [];
    let totalMatches = 0;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const event = JSON.parse(line) as AuditEvent;
          
          if (this.matchesQuery(event, options)) {
            totalMatches++;
            
            if (options.offset && totalMatches <= options.offset) {
              continue;
            }
            
            if (!options.limit || events.length < options.limit) {
              events.push(event);
            }
          }
        } catch {
          // Skip invalid lines
        }
      }
    }

    return {
      events,
      total: totalMatches,
      hasMore: options.limit ? totalMatches > (options.offset || 0) + options.limit : false,
    };
  }

  /**
   * Get event by ID
   */
  async getById(id: string): Promise<AuditEvent | null> {
    const result = await this.query({ eventId: id, limit: 1 });
    return result.events[0] || null;
  }

  /**
   * Close storage
   */
  async close(): Promise<void> {
    // Nothing to close for file storage
  }

  /**
   * Get current file path
   */
  private getCurrentFilePath(): string {
    if (!this.currentFile) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.currentFile = `audit-${timestamp}.log`;
      this.currentSize = 0;
    }
    return path.join(this.options.directory, this.currentFile);
  }

  /**
   * Rotate if needed
   */
  private async rotateIfNeeded(): Promise<void> {
    if (this.currentSize >= this.options.maxFileSize) {
      this.currentFile = null;
      this.currentSize = 0;
    }

    // Clean up old files
    const files = await this.getLogFiles();
    if (files.length > this.options.maxFiles) {
      const toDelete = files.slice(0, files.length - this.options.maxFiles);
      for (const file of toDelete) {
        await fs.unlink(file);
      }
    }
  }

  /**
   * Get all log files sorted by date
   */
  private async getLogFiles(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.options.directory);
      const logFiles = entries
        .filter(e => e.startsWith('audit-') && e.endsWith('.log'))
        .map(e => path.join(this.options.directory, e))
        .sort();
      return logFiles;
    } catch {
      return [];
    }
  }

  /**
   * Check if event matches query
   */
  private matchesQuery(event: AuditEvent, options: AuditQueryOptions): boolean {
    if (options.eventId && event.id !== options.eventId) {
      return false;
    }

    if (options.correlationId && event.correlationId !== options.correlationId) {
      return false;
    }

    if (options.types && !options.types.includes(event.type)) {
      return false;
    }

    if (options.severities && !options.severities.includes(event.severity)) {
      return false;
    }

    if (options.categories && !options.categories.includes(event.category)) {
      return false;
    }

    if (options.actorId && event.actor.id !== options.actorId) {
      return false;
    }

    if (options.startTime && new Date(event.timestamp) < options.startTime) {
      return false;
    }

    if (options.endTime && new Date(event.timestamp) > options.endTime) {
      return false;
    }

    return true;
  }
}

/**
 * Create file audit storage
 */
export function createFileAuditStorage(
  options: FileAuditStorageOptions
): FileAuditStorage {
  return new FileAuditStorage(options);
}
```

### 3.5 Audit Storage Interface (`src/security/audit/storage/AuditStorage.ts`)

```typescript
import { AuditEvent, AuditEventType, AuditSeverity } from '../AuditEvent';

/**
 * Query options
 */
export interface AuditQueryOptions {
  eventId?: string;
  correlationId?: string;
  types?: AuditEventType[];
  severities?: AuditSeverity[];
  categories?: string[];
  actorId?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query result
 */
export interface AuditQueryResult {
  events: AuditEvent[];
  total: number;
  hasMore: boolean;
}

/**
 * Audit storage interface
 */
export interface AuditStorage {
  /**
   * Initialize storage
   */
  initialize(): Promise<void>;

  /**
   * Write events
   */
  writeEvents(events: AuditEvent[]): Promise<void>;

  /**
   * Query events
   */
  query(options: AuditQueryOptions): Promise<AuditQueryResult>;

  /**
   * Get event by ID
   */
  getById(id: string): Promise<AuditEvent | null>;

  /**
   * Close storage
   */
  close(): Promise<void>;
}
```

---

## 📋 Acceptance Criteria

- [ ] Audit events are logged correctly
- [ ] Hash chain provides tamper detection
- [ ] Events can be queried efficiently
- [ ] Sensitive data is redacted from logs
- [ ] Log rotation works correctly
- [ ] Correlation tracking works across executions
- [ ] Storage supports both file and Azure backends

---

## 🔗 Navigation

← [02-PHASE-SECURITY-SCANNING.md](02-PHASE-SECURITY-SCANNING.md) | [04-PHASE-COMPLIANCE.md](04-PHASE-COMPLIANCE.md) →
