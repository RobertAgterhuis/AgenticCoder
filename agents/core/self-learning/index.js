/**
 * SelfLearning System - Main Entry Point
 * 
 * Unified self-learning system that coordinates:
 * - Error detection and logging
 * - Root cause analysis
 * - Fix generation and validation
 * - Safe application with rollback
 * - Monitoring and alerting
 * 
 * @module agents/core/self-learning
 */

import { EventEmitter } from 'events';

// Import all components
import { ErrorLogger, ErrorCategory, Severity } from './ErrorLogger.js';
import { AnalysisEngine, RootCauseDetector, PatternRecognizer } from './AnalysisEngine.js';
import { FixGenerator, FixProposal, FixStrategy, RiskLevel } from './FixGenerator.js';
import { FixValidator, ValidationResult } from './FixValidator.js';
import { ApplyEngine, ApplyOperation, BackupSystem } from './ApplyEngine.js';
import { AuditTrail, AuditRecord } from './AuditTrail.js';
import { RollbackManager, RollbackRequest, RollbackTrigger } from './RollbackManager.js';
import { MonitoringSystem, AlertManager, MetricsCollector, SystemMetric, AlertSeverity } from './MonitoringDashboard.js';
import { CommandInterface, CommandParser } from './CommandInterface.js';
import { SafetyController, SafetyStatus, BlockReason } from './SafetyMechanisms.js';

// Define missing exports
const ValidationGate = {
  TYPE: 'type',
  LOGIC: 'logic',
  SANDBOX: 'sandbox',
  REGRESSION: 'regression',
  IMPACT: 'impact'
};

const AuditStatus = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled_back',
  REJECTED: 'rejected'
};

/**
 * Self-Learning Pipeline Result
 */
class PipelineResult {
  constructor(data) {
    this.success = data.success !== false;
    this.error = data.error || null;
    this.stages = data.stages || {};
    this.duration = data.duration || 0;
    this.changeId = data.changeId || null;
    this.rollbackAvailable = data.rollbackAvailable || false;
  }
  
  toJSON() {
    return {
      success: this.success,
      error: this.error,
      stages: this.stages,
      duration: this.duration,
      changeId: this.changeId,
      rollbackAvailable: this.rollbackAvailable
    };
  }
}

/**
 * Main Self-Learning System
 * 
 * Coordinates the complete self-learning pipeline:
 * Error → Analysis → Fix Generation → Validation → Apply → Monitor
 */
class SelfLearningSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enabled: options.enabled !== false,
      autoApply: options.autoApply || false,
      autoRollback: options.autoRollback !== false,
      monitorAfterApply: options.monitorAfterApply !== false,
      ...options
    };
    
    // Initialize all components
    this._initializeComponents(options);
    
    // Wire up event handlers
    this._setupEventHandlers();
    
    // Pipeline state
    this.activePipelines = new Map();
    
    // Statistics
    this.stats = {
      errorsProcessed: 0,
      fixesGenerated: 0,
      fixesApplied: 0,
      fixesRejected: 0,
      rollbacks: 0,
      successRate: 0
    };
  }
  
  /**
   * Initialize all system components
   */
  _initializeComponents(options) {
    // Error logging
    this.errorLogger = new ErrorLogger(options.errorLogger || {});
    
    // Analysis
    this.analysisEngine = new AnalysisEngine(options.analysis || {});
    
    // Fix generation
    this.fixGenerator = new FixGenerator(options.fixGenerator || {});
    
    // Validation
    this.fixValidator = new FixValidator(options.validator || {});
    
    // Application
    this.applyEngine = new ApplyEngine(options.applyEngine || {});
    
    // Audit trail
    this.auditTrail = new AuditTrail(options.audit || {});
    
    // Rollback
    this.rollbackManager = new RollbackManager({
      ...(options.rollback || {}),
      backupSystem: this.applyEngine.backupSystem,
      auditTrail: this.auditTrail,
      applyEngine: this.applyEngine
    });
    
    // Monitoring
    this.monitoring = new MonitoringSystem(options.monitoring || {});
    
    // Command interface
    this.commandInterface = new CommandInterface(this, options.commands || {});
    
    // Safety controls
    this.safetyController = new SafetyController(options.safety || {});
  }
  
  /**
   * Setup event handlers between components
   */
  _setupEventHandlers() {
    // Error captured → start analysis
    this.errorLogger.on('error:captured', (entry) => {
      this.monitoring.increment(SystemMetric.ERRORS_CAPTURED);
      this.emit('error:captured', entry);
    });
    
    // Fix applied → start monitoring
    this.applyEngine.on('apply:success', (result) => {
      this.monitoring.increment(SystemMetric.FIXES_APPLIED);
      
      if (this.options.monitorAfterApply) {
        this.rollbackManager.startMonitoring(result.changeId);
      }
    });
    
    // Rollback performed
    this.rollbackManager.on('rollback:complete', (result) => {
      this.monitoring.increment(SystemMetric.ROLLBACKS_PERFORMED);
      this.stats.rollbacks++;
    });
    
    // Safety events
    this.safetyController.on('failure:recorded', ({ changeId, count }) => {
      if (count >= 3 && this.options.autoRollback) {
        this.rollbackManager.autoRollbackOnFailure(changeId, `${count} consecutive failures`);
      }
    });
  }
  
  /**
   * Process an error through the complete pipeline
   */
  async processError(error, context = {}) {
    if (!this.options.enabled) {
      return new PipelineResult({ success: false, error: 'System disabled' });
    }
    
    const startTime = Date.now();
    const pipelineId = `pipe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const pipeline = {
      id: pipelineId,
      startTime,
      stages: {},
      currentStage: 'capture'
    };
    
    this.activePipelines.set(pipelineId, pipeline);
    
    try {
      // Stage 1: Capture error
      pipeline.currentStage = 'capture';
      const errorEntry = await this.errorLogger.capture(error, context);
      pipeline.stages.capture = { success: true, entryId: errorEntry.entryId };
      
      // Stage 2: Analyze
      pipeline.currentStage = 'analyze';
      const analysis = await this.analysisEngine.analyze(errorEntry);
      pipeline.stages.analyze = { 
        success: true, 
        rootCause: analysis.rootCause,
        confidence: analysis.confidence 
      };
      
      // Stage 3: Generate fixes
      pipeline.currentStage = 'generate';
      const fixes = await this.fixGenerator.generateFixes(analysis);
      pipeline.stages.generate = { 
        success: true, 
        fixCount: fixes.length 
      };
      
      if (fixes.length === 0) {
        return this._completePipeline(pipeline, {
          success: false,
          error: 'No fixes generated',
          stages: pipeline.stages,
          duration: Date.now() - startTime
        });
      }
      
      // Select best fix
      const bestFix = fixes[0];
      
      // Stage 4: Validate
      pipeline.currentStage = 'validate';
      const validation = await this.fixValidator.validate(bestFix);
      pipeline.stages.validate = {
        success: validation.passed,
        confidence: validation.confidence,
        gates: validation.gateResults
      };
      
      if (!validation.passed) {
        this.monitoring.increment(SystemMetric.VALIDATION_FAILURES);
        
        return this._completePipeline(pipeline, {
          success: false,
          error: 'Validation failed',
          stages: pipeline.stages,
          duration: Date.now() - startTime
        });
      }
      
      this.monitoring.increment(SystemMetric.VALIDATION_PASSES);
      
      // Stage 5: Safety check
      pipeline.currentStage = 'safety';
      const safetyCheck = this.safetyController.check({
        changeId: bestFix.proposalId,
        confidence: validation.confidence,
        riskLevel: bestFix.riskLevel
      });
      
      pipeline.stages.safety = {
        allowed: safetyCheck.allowed,
        status: safetyCheck.status
      };
      
      if (!safetyCheck.allowed) {
        // Record in audit as blocked
        await this.auditTrail.recordDecision(
          bestFix.proposalId,
          'BLOCKED',
          safetyCheck.reason,
          { safety: safetyCheck.toJSON() }
        );
        
        return this._completePipeline(pipeline, {
          success: false,
          error: `Blocked by safety: ${safetyCheck.reason}`,
          stages: pipeline.stages,
          duration: Date.now() - startTime
        });
      }
      
      // Stage 6: Apply (if auto-apply enabled or requested)
      if (this.options.autoApply || context.apply) {
        pipeline.currentStage = 'apply';
        const applyResult = await this.applyEngine.apply(bestFix);
        
        pipeline.stages.apply = {
          success: applyResult.success,
          changeId: applyResult.changeId
        };
        
        if (applyResult.success) {
          // Record in audit
          await this.auditTrail.recordExecution(
            applyResult.changeId,
            true,
            { fix: bestFix.toJSON?.() || bestFix }
          );
          
          // Update stats
          this.stats.fixesApplied++;
          this.safetyController.recordOperation();
          this.safetyController.recordSuccess(applyResult.changeId);
          
          // Mark error as resolved
          this.errorLogger.markResolved(errorEntry.entryId, applyResult.changeId);
          this.monitoring.increment(SystemMetric.ERRORS_RESOLVED);
          
          return this._completePipeline(pipeline, {
            success: true,
            stages: pipeline.stages,
            duration: Date.now() - startTime,
            changeId: applyResult.changeId,
            rollbackAvailable: true
          });
        } else {
          this.stats.fixesRejected++;
          this.safetyController.recordFailure(bestFix.proposalId, applyResult.error);
          
          return this._completePipeline(pipeline, {
            success: false,
            error: `Apply failed: ${applyResult.error}`,
            stages: pipeline.stages,
            duration: Date.now() - startTime
          });
        }
      }
      
      // Not auto-applying, return pending result
      return this._completePipeline(pipeline, {
        success: true,
        stages: pipeline.stages,
        duration: Date.now() - startTime,
        changeId: bestFix.proposalId,
        pendingApply: true
      });
      
    } catch (err) {
      return this._completePipeline(pipeline, {
        success: false,
        error: err.message,
        stages: pipeline.stages,
        duration: Date.now() - startTime
      });
    }
  }
  
  /**
   * Complete a pipeline and cleanup
   */
  _completePipeline(pipeline, result) {
    this.activePipelines.delete(pipeline.id);
    
    const pipelineResult = new PipelineResult(result);
    
    this.stats.errorsProcessed++;
    this._updateSuccessRate();
    
    this.emit('pipeline:complete', pipelineResult);
    
    return pipelineResult;
  }
  
  /**
   * Update success rate
   */
  _updateSuccessRate() {
    const total = this.stats.fixesApplied + this.stats.fixesRejected;
    this.stats.successRate = total > 0 ? this.stats.fixesApplied / total : 0;
    
    this.monitoring.record(SystemMetric.SUCCESS_RATE, this.stats.successRate);
  }
  
  /**
   * Manually apply a pending fix
   */
  async applyFix(proposalId) {
    const proposal = this.fixGenerator.getProposal(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }
    
    return this.applyEngine.apply(proposal);
  }
  
  /**
   * Rollback a change
   */
  async rollback(changeId, reason = 'Manual rollback') {
    return this.rollbackManager.requestRollback({
      changeId,
      reason,
      initiatedBy: 'User'
    });
  }
  
  /**
   * Execute a CLI command
   */
  async executeCommand(input) {
    return this.commandInterface.execute(input);
  }
  
  /**
   * Get system status
   */
  getStatus() {
    return {
      enabled: this.options.enabled,
      autoApply: this.options.autoApply,
      stats: this.stats,
      monitoring: this.monitoring.getSummary(),
      safety: this.safetyController.getStatus(),
      activePipelines: this.activePipelines.size
    };
  }
  
  /**
   * Get dashboard summary
   */
  getDashboard() {
    return this.monitoring.getTextSummary();
  }
  
  /**
   * Enable the system
   */
  enable() {
    this.options.enabled = true;
    this.emit('system:enabled');
  }
  
  /**
   * Disable the system
   */
  disable() {
    this.options.enabled = false;
    this.emit('system:disabled');
  }
  
  /**
   * Reset all state
   */
  reset() {
    this.errorLogger.clear();
    this.analysisEngine.reset();
    this.fixGenerator.reset();
    this.applyEngine.clear();
    this.auditTrail.clear();
    this.rollbackManager.clear();
    this.monitoring.metrics.reset();
    this.safetyController.reset();
    
    this.activePipelines.clear();
    this.stats = {
      errorsProcessed: 0,
      fixesGenerated: 0,
      fixesApplied: 0,
      fixesRejected: 0,
      rollbacks: 0,
      successRate: 0
    };
    
    this.emit('system:reset');
  }
}

export {
  // Main system
  SelfLearningSystem,
  PipelineResult,
  
  // Error logging
  ErrorLogger,
  ErrorCategory,
  Severity,
  
  // Analysis
  AnalysisEngine,
  RootCauseDetector,
  PatternRecognizer,
  
  // Fix generation
  FixGenerator,
  FixProposal,
  FixStrategy,
  RiskLevel,
  
  // Validation
  FixValidator,
  ValidationResult,
  ValidationGate,
  
  // Application
  ApplyEngine,
  ApplyOperation,
  BackupSystem,
  
  // Audit
  AuditTrail,
  AuditRecord,
  AuditStatus,
  
  // Rollback
  RollbackManager,
  RollbackRequest,
  RollbackTrigger,
  
  // Monitoring
  MonitoringSystem,
  AlertManager,
  MetricsCollector,
  SystemMetric,
  AlertSeverity,
  
  // Commands
  CommandInterface,
  CommandParser,
  
  // Safety
  SafetyController,
  SafetyStatus,
  BlockReason
};
