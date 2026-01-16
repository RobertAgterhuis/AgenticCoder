/**
 * AuditTrail - SL-08 Audit Trail System
 * 
 * Complete logging of all self-learning activities:
 * - Decision records
 * - Execution results
 * - Rollback events
 * - Immutable audit trail
 * 
 * @implements SelfLearning/08_AUDIT_TRAIL_SYSTEM.md
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * Audit record structure
 */
class AuditRecord {
  constructor(data) {
    this.auditId = data.auditId || this._generateId();
    this.changeId = data.changeId;
    this.timestamp = data.timestamp || new Date();
    
    this.decision = {
      proposedBy: data.decision?.proposedBy || 'System',
      approvedBy: data.decision?.approvedBy || null,
      reasoning: data.decision?.reasoning || '',
      confidence: data.decision?.confidence || 0,
      recommendedAction: data.decision?.recommendedAction || ''
    };
    
    this.execution = {
      appliedAt: data.execution?.appliedAt || null,
      status: data.execution?.status || 'PENDING', // SUCCESS, ROLLED_BACK, PENDING, REJECTED
      duration: data.execution?.duration || 0,
      error: data.execution?.error || null
    };
    
    this.impact = {
      errorsResolved: data.impact?.errorsResolved || 0,
      newErrorsIntroduced: data.impact?.newErrorsIntroduced || 0,
      performanceImpact: data.impact?.performanceImpact || 0
    };
    
    this.rollbackInfo = data.rollbackInfo || null;
    
    this.metadata = {
      executionId: data.metadata?.executionId || this._generateId(),
      userId: data.metadata?.userId || null,
      system: data.metadata?.system || 'AgenticCoder',
      version: data.metadata?.version || '2.0.0'
    };
    
    // Integrity hash
    this.integrityHash = this._calculateHash();
  }
  
  _generateId() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const time = Math.floor(date.getTime() % 1000000).toString().padStart(6, '0');
    const random = crypto.randomBytes(4).toString('hex');
    return `aud-${dateStr}-${time}-${random}`;
  }
  
  _calculateHash() {
    const content = JSON.stringify({
      auditId: this.auditId,
      changeId: this.changeId,
      timestamp: this.timestamp,
      decision: this.decision,
      execution: this.execution,
      impact: this.impact,
      metadata: this.metadata
    });
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Verify record integrity
   */
  verifyIntegrity() {
    const currentHash = this._calculateHash();
    return currentHash === this.integrityHash;
  }
  
  toJSON() {
    return {
      auditId: this.auditId,
      changeId: this.changeId,
      timestamp: this.timestamp,
      decision: this.decision,
      execution: this.execution,
      impact: this.impact,
      rollbackInfo: this.rollbackInfo,
      metadata: this.metadata,
      integrityHash: this.integrityHash
    };
  }
}

/**
 * Audit filter for queries
 */
class AuditFilter {
  constructor(options = {}) {
    this.changeId = options.changeId || null;
    this.from = options.from || null;
    this.to = options.to || null;
    this.status = options.status || null;
    this.proposedBy = options.proposedBy || null;
    this.limit = options.limit || 100;
    this.offset = options.offset || 0;
  }
}

/**
 * Main Audit Trail
 */
class AuditTrail extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      storagePath: options.storagePath || './data/audit',
      retentionDays: options.retentionDays || 365,
      maxRecordsInMemory: options.maxRecordsInMemory || 10000,
      ...options
    };
    
    // In-memory storage
    this.records = new Map();
    this.recordsByChange = new Map(); // changeId -> auditId
    
    // Statistics
    this.stats = {
      totalRecords: 0,
      byStatus: {},
      byProposer: {}
    };
  }
  
  /**
   * Record a decision
   */
  async recordDecision(changeId, decision) {
    const auditId = this._generateAuditId();
    
    const record = new AuditRecord({
      auditId,
      changeId,
      decision: {
        proposedBy: decision.proposedBy || 'Self-Learning',
        approvedBy: decision.approvedBy || null,
        reasoning: decision.reasoning || '',
        confidence: decision.confidence || 0,
        recommendedAction: decision.recommendedAction || ''
      },
      execution: {
        status: 'PENDING'
      },
      metadata: {
        executionId: decision.executionId || null,
        userId: decision.userId || null
      }
    });
    
    // Store record
    this.records.set(auditId, record);
    this.recordsByChange.set(changeId, auditId);
    
    // Update stats
    this._updateStats(record);
    
    this.emit('audit:decision-recorded', { auditId, changeId });
    
    return auditId;
  }
  
  /**
   * Record execution result
   */
  async recordExecution(auditId, result) {
    const record = this.records.get(auditId);
    if (!record) {
      throw new Error(`Audit record not found: ${auditId}`);
    }
    
    // Update execution info (create new record for immutability)
    const updatedRecord = new AuditRecord({
      ...record.toJSON(),
      execution: {
        appliedAt: result.appliedAt || new Date(),
        status: result.status,
        duration: result.duration || 0,
        error: result.error || null
      },
      impact: {
        errorsResolved: result.errorsResolved || 0,
        newErrorsIntroduced: result.newErrorsIntroduced || 0,
        performanceImpact: result.performanceImpact || 0
      }
    });
    
    // Replace record
    this.records.set(auditId, updatedRecord);
    
    // Update stats
    this._updateStatusStats(result.status);
    
    this.emit('audit:execution-recorded', { auditId, status: result.status });
    
    return updatedRecord;
  }
  
  /**
   * Record rollback
   */
  async recordRollback(changeId, reason, initiatedBy = 'System') {
    const auditId = this.recordsByChange.get(changeId);
    if (!auditId) {
      throw new Error(`No audit record for change: ${changeId}`);
    }
    
    const record = this.records.get(auditId);
    if (!record) {
      throw new Error(`Audit record not found: ${auditId}`);
    }
    
    // Update with rollback info
    const updatedRecord = new AuditRecord({
      ...record.toJSON(),
      execution: {
        ...record.execution,
        status: 'ROLLED_BACK'
      },
      rollbackInfo: {
        reason,
        initiatedAt: new Date(),
        completedAt: new Date(),
        initiatedBy
      }
    });
    
    // Replace record
    this.records.set(auditId, updatedRecord);
    
    this.emit('audit:rollback-recorded', { auditId, changeId, reason });
    
    return updatedRecord;
  }
  
  /**
   * Get audit history with filter
   */
  async getAuditHistory(filter = {}) {
    const auditFilter = new AuditFilter(filter);
    let records = Array.from(this.records.values());
    
    // Apply filters
    if (auditFilter.changeId) {
      records = records.filter(r => r.changeId === auditFilter.changeId);
    }
    
    if (auditFilter.from) {
      const fromDate = new Date(auditFilter.from);
      records = records.filter(r => new Date(r.timestamp) >= fromDate);
    }
    
    if (auditFilter.to) {
      const toDate = new Date(auditFilter.to);
      records = records.filter(r => new Date(r.timestamp) <= toDate);
    }
    
    if (auditFilter.status) {
      records = records.filter(r => r.execution.status === auditFilter.status);
    }
    
    if (auditFilter.proposedBy) {
      records = records.filter(r => r.decision.proposedBy === auditFilter.proposedBy);
    }
    
    // Sort by timestamp descending
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const start = auditFilter.offset;
    const end = start + auditFilter.limit;
    
    return records.slice(start, end);
  }
  
  /**
   * Get single audit record
   */
  getRecord(auditId) {
    return this.records.get(auditId);
  }
  
  /**
   * Get audit record by change ID
   */
  getRecordByChange(changeId) {
    const auditId = this.recordsByChange.get(changeId);
    return auditId ? this.records.get(auditId) : null;
  }
  
  /**
   * Verify integrity of all records
   */
  verifyIntegrity() {
    const results = {
      total: this.records.size,
      valid: 0,
      invalid: []
    };
    
    for (const [auditId, record] of this.records) {
      if (record.verifyIntegrity()) {
        results.valid++;
      } else {
        results.invalid.push(auditId);
      }
    }
    
    return results;
  }
  
  /**
   * Generate audit report
   */
  generateReport(options = {}) {
    const from = options.from ? new Date(options.from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = options.to ? new Date(options.to) : new Date();
    
    const records = Array.from(this.records.values()).filter(r => {
      const timestamp = new Date(r.timestamp);
      return timestamp >= from && timestamp <= to;
    });
    
    // Calculate metrics
    const successCount = records.filter(r => r.execution.status === 'SUCCESS').length;
    const failedCount = records.filter(r => r.execution.status === 'FAILED' || r.execution.status === 'REJECTED').length;
    const rolledBackCount = records.filter(r => r.execution.status === 'ROLLED_BACK').length;
    const pendingCount = records.filter(r => r.execution.status === 'PENDING').length;
    
    const totalErrorsResolved = records.reduce((sum, r) => sum + (r.impact.errorsResolved || 0), 0);
    const totalNewErrors = records.reduce((sum, r) => sum + (r.impact.newErrorsIntroduced || 0), 0);
    
    const avgConfidence = records.length > 0
      ? records.reduce((sum, r) => sum + r.decision.confidence, 0) / records.length
      : 0;
    
    return {
      period: { from, to },
      summary: {
        totalChanges: records.length,
        successful: successCount,
        failed: failedCount,
        rolledBack: rolledBackCount,
        pending: pendingCount,
        successRate: records.length > 0 ? successCount / (records.length - pendingCount) : 0
      },
      impact: {
        errorsResolved: totalErrorsResolved,
        newErrorsIntroduced: totalNewErrors,
        netImprovement: totalErrorsResolved - totalNewErrors
      },
      confidence: {
        average: avgConfidence,
        distribution: this._getConfidenceDistribution(records)
      },
      recentChanges: records.slice(0, 10).map(r => ({
        changeId: r.changeId,
        status: r.execution.status,
        timestamp: r.timestamp,
        confidence: r.decision.confidence
      }))
    };
  }
  
  /**
   * Get confidence distribution
   */
  _getConfidenceDistribution(records) {
    const distribution = {
      high: 0,    // >= 0.8
      medium: 0,  // 0.5-0.8
      low: 0      // < 0.5
    };
    
    for (const record of records) {
      if (record.decision.confidence >= 0.8) {
        distribution.high++;
      } else if (record.decision.confidence >= 0.5) {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    }
    
    return distribution;
  }
  
  /**
   * Update statistics
   */
  _updateStats(record) {
    this.stats.totalRecords++;
    
    const status = record.execution.status;
    this.stats.byStatus[status] = (this.stats.byStatus[status] || 0) + 1;
    
    const proposer = record.decision.proposedBy;
    this.stats.byProposer[proposer] = (this.stats.byProposer[proposer] || 0) + 1;
  }
  
  _updateStatusStats(status) {
    this.stats.byStatus[status] = (this.stats.byStatus[status] || 0) + 1;
  }
  
  _generateAuditId() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const time = Math.floor(date.getTime() % 1000000).toString().padStart(6, '0');
    const random = crypto.randomBytes(4).toString('hex');
    return `aud-${dateStr}-${time}-${random}`;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      recordsInMemory: this.records.size
    };
  }
  
  /**
   * Export to JSON
   */
  exportToJSON(filter = {}) {
    const records = this.getAuditHistory(filter);
    return JSON.stringify(records.map(r => r.toJSON()), null, 2);
  }
  
  /**
   * Clear all records
   */
  clear() {
    this.records.clear();
    this.recordsByChange.clear();
    this.stats = {
      totalRecords: 0,
      byStatus: {},
      byProposer: {}
    };
    this.emit('audit:cleared');
  }
}

export {
  AuditTrail,
  AuditRecord,
  AuditFilter
};
