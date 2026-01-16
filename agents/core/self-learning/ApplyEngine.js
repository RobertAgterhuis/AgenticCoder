/**
 * ApplyEngine - SL-07 Apply Mechanism
 * 
 * Safely applies validated fixes with:
 * - Full state backup before changes
 * - Atomic transactions
 * - Verification after apply
 * - Rollback capability
 * 
 * @implements SelfLearning/07_APPLY_MECHANISM.md
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

/**
 * Backup record structure
 */
class BackupRecord {
  constructor(data) {
    this.backupId = data.backupId || this._generateId();
    this.timestamp = data.timestamp || new Date();
    this.changeId = data.changeId;
    
    this.state = {
      agentDefinitions: data.state?.agentDefinitions || {},
      skillConfigurations: data.state?.skillConfigurations || {},
      validationRules: data.state?.validationRules || {},
      systemConfig: data.state?.systemConfig || {}
    };
    
    this.metadata = {
      size: data.metadata?.size || 0,
      compressed: data.metadata?.compressed || false,
      encrypted: data.metadata?.encrypted || false,
      expiresAt: data.metadata?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      checksums: data.metadata?.checksums || {
        md5: '',
        sha256: ''
      }
    };
  }
  
  _generateId() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = crypto.randomBytes(4).toString('hex');
    return `bak-${dateStr}-${random}`;
  }
  
  toJSON() {
    return {
      backupId: this.backupId,
      timestamp: this.timestamp,
      changeId: this.changeId,
      state: this.state,
      metadata: this.metadata
    };
  }
}

/**
 * Apply operation result
 */
class ApplyOperation {
  constructor(data) {
    this.changeId = data.changeId;
    this.backupId = data.backupId;
    
    this.operation = {
      timestamp: data.operation?.timestamp || new Date(),
      status: data.operation?.status || 'pending', // pending, applied, failed, rolled_back
      transaction: data.operation?.transaction || null,
      rolledBack: data.operation?.rolledBack || false,
      rollbackTime: data.operation?.rollbackTime || null
    };
    
    this.backup = {
      fullState: data.backup?.fullState || null,
      metadata: data.backup?.metadata || null,
      restorable: data.backup?.restorable !== false,
      expiresAt: data.backup?.expiresAt || null
    };
    
    this.verification = {
      testsRun: data.verification?.testsRun || 0,
      testsPassed: data.verification?.testsPassed || 0,
      testsFailed: data.verification?.testsFailed || 0,
      status: data.verification?.status || 'PENDING' // VERIFIED, FAILED, PENDING
    };
    
    this.error = data.error || null;
    this.duration = data.duration || 0;
  }
  
  toJSON() {
    return {
      changeId: this.changeId,
      backupId: this.backupId,
      operation: this.operation,
      backup: this.backup,
      verification: this.verification,
      error: this.error,
      duration: this.duration
    };
  }
}

/**
 * Backup System
 */
class BackupSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      storagePath: options.storagePath || './data/backups',
      retentionDays: options.retentionDays || 7,
      compress: options.compress !== false,
      ...options
    };
    
    // In-memory backup storage (for simplicity)
    this.backups = new Map();
  }
  
  /**
   * Create a backup before applying change
   */
  async createBackup(changeId, currentState = {}) {
    const backupId = this._generateBackupId();
    
    // Capture current state
    const state = await this._captureState(currentState);
    
    // Calculate size
    const stateJson = JSON.stringify(state);
    const size = Buffer.byteLength(stateJson, 'utf8');
    
    // Calculate checksums
    const checksums = {
      md5: crypto.createHash('md5').update(stateJson).digest('hex'),
      sha256: crypto.createHash('sha256').update(stateJson).digest('hex')
    };
    
    // Create backup record
    const backup = new BackupRecord({
      backupId,
      changeId,
      state,
      metadata: {
        size,
        compressed: false,
        encrypted: false,
        expiresAt: new Date(Date.now() + this.options.retentionDays * 24 * 60 * 60 * 1000),
        checksums
      }
    });
    
    // Store backup
    this.backups.set(backupId, backup);
    
    this.emit('backup:created', { backupId, changeId, size });
    
    return backup;
  }
  
  /**
   * Restore from backup
   */
  async restore(backupId) {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }
    
    // Verify integrity
    const stateJson = JSON.stringify(backup.state);
    const currentChecksum = crypto.createHash('sha256').update(stateJson).digest('hex');
    
    if (currentChecksum !== backup.metadata.checksums.sha256) {
      throw new Error('Backup integrity check failed');
    }
    
    this.emit('backup:restored', { backupId, changeId: backup.changeId });
    
    return backup.state;
  }
  
  /**
   * Get backup by ID
   */
  getBackup(backupId) {
    return this.backups.get(backupId);
  }
  
  /**
   * Find backup for a change
   */
  findBackupForChange(changeId) {
    for (const [, backup] of this.backups) {
      if (backup.changeId === changeId) {
        return backup;
      }
    }
    return null;
  }
  
  /**
   * Delete a backup
   */
  deleteBackup(backupId) {
    const deleted = this.backups.delete(backupId);
    if (deleted) {
      this.emit('backup:deleted', { backupId });
    }
    return deleted;
  }
  
  /**
   * Cleanup expired backups
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [backupId, backup] of this.backups) {
      if (new Date(backup.metadata.expiresAt).getTime() < now) {
        this.backups.delete(backupId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.emit('backup:cleanup', { count: cleaned });
    }
    
    return cleaned;
  }
  
  /**
   * Capture current state
   */
  async _captureState(currentState) {
    return {
      agentDefinitions: currentState.agentDefinitions || {},
      skillConfigurations: currentState.skillConfigurations || {},
      validationRules: currentState.validationRules || {},
      systemConfig: currentState.systemConfig || {},
      capturedAt: new Date()
    };
  }
  
  _generateBackupId() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = crypto.randomBytes(4).toString('hex');
    return `bak-${dateStr}-${random}`;
  }
  
  /**
   * Get all backups
   */
  getAllBackups() {
    return Array.from(this.backups.values());
  }
}

/**
 * Transaction wrapper for atomic operations
 */
class Transaction {
  constructor(changeId) {
    this.transactionId = `txn-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    this.changeId = changeId;
    this.status = 'pending'; // pending, committed, rolled_back
    this.operations = [];
    this.startTime = Date.now();
    this.endTime = null;
  }
  
  /**
   * Record an operation
   */
  recordOperation(operation) {
    this.operations.push({
      ...operation,
      timestamp: new Date()
    });
  }
  
  /**
   * Commit transaction
   */
  commit() {
    this.status = 'committed';
    this.endTime = Date.now();
    return {
      transactionId: this.transactionId,
      status: this.status,
      duration: this.endTime - this.startTime,
      operationCount: this.operations.length
    };
  }
  
  /**
   * Rollback transaction
   */
  rollback() {
    this.status = 'rolled_back';
    this.endTime = Date.now();
    return {
      transactionId: this.transactionId,
      status: this.status,
      duration: this.endTime - this.startTime,
      operationsRolledBack: this.operations.length
    };
  }
}

/**
 * Main Apply Engine
 */
class ApplyEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      verifyAfterApply: options.verifyAfterApply !== false,
      autoRollbackOnFailure: options.autoRollbackOnFailure !== false,
      ...options
    };
    
    // Backup system
    this.backupSystem = new BackupSystem(options.backup || {});
    
    // Applied changes
    this.appliedChanges = new Map();
    
    // Current state (in-memory representation)
    this.currentState = {
      agentDefinitions: {},
      skillConfigurations: {},
      validationRules: {},
      systemConfig: {}
    };
    
    // Statistics
    this.stats = {
      totalApplied: 0,
      successful: 0,
      failed: 0,
      rolledBack: 0
    };
  }
  
  /**
   * Apply a validated fix proposal
   */
  async apply(proposedChange, validationResult) {
    const startTime = Date.now();
    const changeId = proposedChange.changeId;
    
    // Create operation record
    const operation = new ApplyOperation({
      changeId,
      backupId: null
    });
    
    try {
      // Step 1: Create backup
      const backup = await this.backupSystem.createBackup(changeId, this.currentState);
      operation.backupId = backup.backupId;
      operation.backup = {
        fullState: backup.state,
        metadata: backup.metadata,
        restorable: true,
        expiresAt: backup.metadata.expiresAt
      };
      
      this.emit('apply:backup-created', { changeId, backupId: backup.backupId });
      
      // Step 2: Start transaction
      const transaction = new Transaction(changeId);
      operation.operation.transaction = transaction;
      
      // Step 3: Apply change
      await this._applyChange(proposedChange, transaction);
      
      // Step 4: Commit transaction
      const commitResult = transaction.commit();
      operation.operation.status = 'applied';
      operation.operation.timestamp = new Date();
      
      this.emit('apply:change-applied', { changeId, transactionId: commitResult.transactionId });
      
      // Step 5: Verify if enabled
      if (this.options.verifyAfterApply) {
        const verification = await this._verify(proposedChange);
        operation.verification = verification;
        
        if (verification.status === 'FAILED' && this.options.autoRollbackOnFailure) {
          // Auto-rollback on verification failure
          await this._rollback(changeId, backup.backupId, 'Verification failed');
          operation.operation.status = 'rolled_back';
          operation.operation.rolledBack = true;
          operation.operation.rollbackTime = new Date();
          
          this.stats.rolledBack++;
          
          this.emit('apply:auto-rollback', { changeId, reason: 'Verification failed' });
        } else {
          this.stats.successful++;
        }
      } else {
        this.stats.successful++;
      }
      
      // Record duration
      operation.duration = Date.now() - startTime;
      
      // Store operation
      this.appliedChanges.set(changeId, operation);
      this.stats.totalApplied++;
      
      this.emit('apply:complete', operation);
      
      return operation;
      
    } catch (error) {
      operation.operation.status = 'failed';
      operation.error = error.message;
      operation.duration = Date.now() - startTime;
      
      this.stats.failed++;
      
      // Attempt rollback on failure
      if (operation.backupId && this.options.autoRollbackOnFailure) {
        try {
          await this._rollback(changeId, operation.backupId, error.message);
          operation.operation.rolledBack = true;
          operation.operation.rollbackTime = new Date();
          this.stats.rolledBack++;
        } catch (rollbackError) {
          operation.error += ` (Rollback also failed: ${rollbackError.message})`;
        }
      }
      
      this.appliedChanges.set(changeId, operation);
      
      this.emit('apply:failed', { changeId, error: error.message });
      
      return operation;
    }
  }
  
  /**
   * Apply the actual change to state
   */
  async _applyChange(proposedChange, transaction) {
    const change = proposedChange.proposedChange;
    const target = change.target;
    
    // Determine what to update based on change type
    switch (change.type) {
      case 'validation_rule':
        // Add/update validation rule
        this.currentState.validationRules[target] = change.newValue;
        transaction.recordOperation({
          type: 'add_validation_rule',
          target,
          value: change.newValue
        });
        break;
        
      case 'type_check':
        // Add type check
        this.currentState.validationRules[`typecheck_${target}`] = change.newValue;
        transaction.recordOperation({
          type: 'add_type_check',
          target,
          value: change.newValue
        });
        break;
        
      case 'default_value':
        // Set default value in config
        this.currentState.systemConfig[target] = change.newValue;
        transaction.recordOperation({
          type: 'set_default',
          target,
          value: change.newValue
        });
        break;
        
      case 'config_update':
        // Update configuration
        this.currentState.systemConfig[target] = change.newValue;
        transaction.recordOperation({
          type: 'update_config',
          target,
          oldValue: change.oldValue,
          newValue: change.newValue
        });
        break;
        
      case 'error_handling':
      case 'condition_check':
      case 'generic_fix':
        // These require code changes - record intent
        this.currentState.validationRules[`fix_${proposedChange.changeId}`] = {
          type: change.type,
          target,
          codeExample: change.codeExample,
          rationale: change.rationale,
          appliedAt: new Date()
        };
        transaction.recordOperation({
          type: 'record_fix',
          target,
          changeType: change.type
        });
        break;
        
      default:
        transaction.recordOperation({
          type: 'unknown',
          target,
          changeType: change.type
        });
    }
    
    return true;
  }
  
  /**
   * Verify change was applied correctly
   */
  async _verify(proposedChange) {
    // Run basic verification
    const verification = {
      testsRun: 1,
      testsPassed: 0,
      testsFailed: 0,
      status: 'PENDING'
    };
    
    try {
      // Check that state was updated
      const target = proposedChange.proposedChange.target;
      const hasValidationRule = this.currentState.validationRules[target] || 
                                this.currentState.validationRules[`typecheck_${target}`] ||
                                this.currentState.validationRules[`fix_${proposedChange.changeId}`];
      const hasConfig = this.currentState.systemConfig[target];
      
      if (hasValidationRule || hasConfig) {
        verification.testsPassed = 1;
        verification.status = 'VERIFIED';
      } else {
        verification.testsFailed = 1;
        verification.status = 'FAILED';
      }
    } catch (error) {
      verification.testsFailed = 1;
      verification.status = 'FAILED';
    }
    
    return verification;
  }
  
  /**
   * Rollback a change
   */
  async _rollback(changeId, backupId, reason) {
    const previousState = await this.backupSystem.restore(backupId);
    
    // Restore state
    this.currentState = { ...previousState };
    
    this.emit('apply:rollback', { changeId, backupId, reason });
    
    return true;
  }
  
  /**
   * Manually request rollback
   */
  async rollback(changeId, reason = 'Manual rollback') {
    const operation = this.appliedChanges.get(changeId);
    if (!operation) {
      throw new Error(`No applied change found: ${changeId}`);
    }
    
    if (operation.operation.rolledBack) {
      throw new Error(`Change already rolled back: ${changeId}`);
    }
    
    await this._rollback(changeId, operation.backupId, reason);
    
    operation.operation.rolledBack = true;
    operation.operation.rollbackTime = new Date();
    operation.operation.status = 'rolled_back';
    
    this.stats.rolledBack++;
    
    return operation;
  }
  
  /**
   * Get applied operation
   */
  getOperation(changeId) {
    return this.appliedChanges.get(changeId);
  }
  
  /**
   * Get all applied changes
   */
  getAppliedChanges() {
    return Array.from(this.appliedChanges.values());
  }
  
  /**
   * Get current state
   */
  getCurrentState() {
    return { ...this.currentState };
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      backups: this.backupSystem.getAllBackups().length,
      successRate: this.stats.totalApplied > 0 
        ? this.stats.successful / this.stats.totalApplied 
        : 0
    };
  }
  
  /**
   * Clear all data
   */
  clear() {
    this.appliedChanges.clear();
    this.currentState = {
      agentDefinitions: {},
      skillConfigurations: {},
      validationRules: {},
      systemConfig: {}
    };
    this.stats = {
      totalApplied: 0,
      successful: 0,
      failed: 0,
      rolledBack: 0
    };
  }
}

export {
  ApplyEngine,
  ApplyOperation,
  BackupSystem,
  BackupRecord,
  Transaction
};
