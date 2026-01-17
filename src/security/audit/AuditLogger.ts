/**
 * AuditLogger.ts
 * Immutable audit trail for security events
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  actor: AuditActor;
  action: string;
  resource: string;
  details: Record<string, any>;
  securityContext?: SecurityContext;
  result: 'success' | 'failure' | 'blocked';
  previousHash?: string;
  hash?: string;
}

export type AuditEventType = 
  | 'code_generation'
  | 'secret_access'
  | 'secret_modification'
  | 'security_scan'
  | 'authentication'
  | 'authorization'
  | 'configuration_change'
  | 'deployment'
  | 'error'
  | 'compliance_check';

export interface AuditActor {
  type: 'system' | 'agent' | 'user' | 'service';
  id: string;
  name?: string;
}

export interface SecurityContext {
  secretsAccessed?: string[];
  complianceChecks?: string[];
  scanResult?: 'clean' | 'warning' | 'blocked';
  permissions?: string[];
}

export interface AuditQuery {
  eventType?: AuditEventType;
  actor?: string;
  resource?: string;
  result?: AuditEvent['result'];
  from?: Date;
  to?: Date;
  limit?: number;
}

export class AuditLogger {
  private logPath: string;
  private events: AuditEvent[] = [];
  private lastHash: string = '';
  private initialized = false;

  constructor(logPath: string) {
    this.logPath = logPath;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(path.dirname(this.logPath), { recursive: true });
      
      try {
        const data = await fs.readFile(this.logPath, 'utf8');
        const lines = data.trim().split('\n').filter(l => l);
        
        for (const line of lines) {
          const event = JSON.parse(line);
          this.events.push(event);
          this.lastHash = event.hash || '';
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
      }
    } finally {
      this.initialized = true;
    }
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'previousHash' | 'hash'>): Promise<AuditEvent> {
    await this.initialize();

    const fullEvent: AuditEvent = {
      ...event,
      id: `aud-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      previousHash: this.lastHash || undefined,
    };

    // Calculate hash for integrity (includes previous hash for chain)
    fullEvent.hash = this.calculateHash(fullEvent);
    this.lastHash = fullEvent.hash;

    this.events.push(fullEvent);

    // Append to file
    await fs.appendFile(this.logPath, JSON.stringify(fullEvent) + '\n', 'utf8');

    return fullEvent;
  }

  private calculateHash(event: AuditEvent): string {
    const data = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      eventType: event.eventType,
      actor: event.actor,
      action: event.action,
      resource: event.resource,
      details: event.details,
      result: event.result,
      previousHash: event.previousHash,
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async query(query: AuditQuery): Promise<AuditEvent[]> {
    await this.initialize();

    let results = [...this.events];

    if (query.eventType) {
      results = results.filter(e => e.eventType === query.eventType);
    }
    if (query.actor) {
      results = results.filter(e => e.actor.id === query.actor);
    }
    if (query.resource) {
      results = results.filter(e => e.resource.includes(query.resource));
    }
    if (query.result) {
      results = results.filter(e => e.result === query.result);
    }
    if (query.from) {
      results = results.filter(e => new Date(e.timestamp) >= query.from!);
    }
    if (query.to) {
      results = results.filter(e => new Date(e.timestamp) <= query.to!);
    }
    if (query.limit) {
      results = results.slice(-query.limit);
    }

    return results;
  }

  async verifyIntegrity(): Promise<{ valid: boolean; invalidEvents: string[] }> {
    await this.initialize();

    const invalidEvents: string[] = [];
    let previousHash = '';

    for (const event of this.events) {
      // Verify chain
      if (event.previousHash !== (previousHash || undefined)) {
        invalidEvents.push(`${event.id}: Chain broken`);
      }

      // Verify hash
      const expectedHash = this.calculateHash({ ...event, hash: undefined });
      if (event.hash !== expectedHash) {
        invalidEvents.push(`${event.id}: Hash mismatch`);
      }

      previousHash = event.hash || '';
    }

    return {
      valid: invalidEvents.length === 0,
      invalidEvents,
    };
  }

  // Convenience methods for common events
  async logCodeGeneration(
    agentId: string,
    resource: string,
    details: Record<string, any>,
    result: AuditEvent['result'] = 'success'
  ): Promise<AuditEvent> {
    return this.log({
      eventType: 'code_generation',
      actor: { type: 'agent', id: agentId },
      action: 'generate_file',
      resource,
      details,
      result,
    });
  }

  async logSecretAccess(
    actorId: string,
    secretName: string,
    action: 'read' | 'write' | 'delete',
    result: AuditEvent['result'] = 'success'
  ): Promise<AuditEvent> {
    return this.log({
      eventType: 'secret_access',
      actor: { type: 'system', id: actorId },
      action: `secret_${action}`,
      resource: secretName,
      details: { secretName, action },
      securityContext: { secretsAccessed: [secretName] },
      result,
    });
  }

  async logSecurityScan(
    resource: string,
    scanType: string,
    vulnerabilities: number,
    passed: boolean
  ): Promise<AuditEvent> {
    return this.log({
      eventType: 'security_scan',
      actor: { type: 'system', id: 'security-scanner' },
      action: 'security_scan',
      resource,
      details: { scanType, vulnerabilities, passed },
      securityContext: { scanResult: passed ? 'clean' : 'warning' },
      result: passed ? 'success' : 'failure',
    });
  }

  async getStats(): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    byResult: Record<string, number>;
    last24h: number;
  }> {
    await this.initialize();

    const byType: Record<string, number> = {};
    const byResult: Record<string, number> = {};
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let last24h = 0;

    for (const event of this.events) {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1;
      byResult[event.result] = (byResult[event.result] || 0) + 1;
      
      if (new Date(event.timestamp) >= yesterday) {
        last24h++;
      }
    }

    return {
      totalEvents: this.events.length,
      byType,
      byResult,
      last24h,
    };
  }
}

export default AuditLogger;
