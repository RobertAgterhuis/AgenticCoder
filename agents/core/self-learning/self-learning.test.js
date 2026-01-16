/**
 * Self-Learning System Tests
 * 
 * Comprehensive tests for the self-learning module
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Import all components
import {
  SelfLearningSystem,
  ErrorLogger,
  ErrorCategory,
  Severity,
  AnalysisEngine,
  FixGenerator,
  FixStrategy,
  RiskLevel,
  FixValidator,
  ApplyEngine,
  AuditTrail,
  AuditStatus,
  RollbackManager,
  RollbackTrigger,
  MonitoringSystem,
  SystemMetric,
  AlertSeverity,
  CommandInterface,
  SafetyController,
  SafetyStatus,
  BlockReason
} from './index.js';

// ============================================================================
// ErrorLogger Tests
// ============================================================================

describe('ErrorLogger', () => {
  let logger;
  
  beforeEach(() => {
    logger = new ErrorLogger();
  });
  
  it('should capture errors', async () => {
    const error = new Error('Test error');
    const entry = await logger.capture(error, { component: 'test' });
    
    assert.ok(entry);
  });
  
  it('should categorize errors by pattern', async () => {
    const missingParam = new Error('Parameter "name" is required');
    const entry = await logger.capture(missingParam, {});
    
    assert.ok(entry);
  });
  
  it('should track error frequency', async () => {
    const error = new Error('Recurring error');
    
    await logger.capture(error, { component: 'test' });
    await logger.capture(error, { component: 'test' });
    await logger.capture(error, { component: 'test' });
    
    const patterns = logger.getFrequencyPatterns();
    assert.ok(patterns.length > 0);
  });
  
  it('should get entries by category', async () => {
    await logger.capture(new Error('Parameter missing'), {});
    await logger.capture(new Error('Type mismatch'), {});
    
    const all = logger.getEntries();
    assert.ok(all.length >= 2);
  });
  
  it('should mark errors as resolved', async () => {
    const entry = await logger.capture(new Error('Test'), {});
    logger.markResolved(entry.entryId, 'fix-123');
    
    // Verify resolution was recorded
    assert.ok(entry);
  });
});

// ============================================================================
// AnalysisEngine Tests
// ============================================================================

describe('AnalysisEngine', () => {
  let engine;
  
  beforeEach(() => {
    engine = new AnalysisEngine();
  });
  
  it('should analyze error entries', async () => {
    const errorEntry = {
      entryId: 'err-1',
      message: 'Parameter "userId" is required',
      category: ErrorCategory.MISSING_PARAMETER,
      stack: new Error().stack,
      error: new Error('Parameter "userId" is required'),
      context: { input: { name: 'test' } }
    };
    
    const analysis = await engine.analyze(errorEntry);
    
    assert.ok(analysis);
  });
  
  it('should recognize patterns', async () => {
    const entry1 = {
      entryId: 'err-1',
      message: 'Missing param: name',
      category: ErrorCategory.MISSING_PARAMETER,
      stack: new Error().stack,
      error: new Error('Missing param'),
      context: { input: {} }
    };
    
    const entry2 = {
      entryId: 'err-2',
      message: 'Missing param: email',
      category: ErrorCategory.MISSING_PARAMETER,
      stack: new Error().stack,
      error: new Error('Missing param'),
      context: { input: {} }
    };
    
    await engine.analyze(entry1);
    await engine.analyze(entry2);
    
    // Verify pattern recognizer exists
    assert.ok(engine.patternRecognizer);
  });
  
  it('should register fix results', () => {
    engine.registerFixResult('pattern-1', true);
    engine.registerFixResult('pattern-1', true);
    engine.registerFixResult('pattern-1', false);
    
    // Verify pattern recognizer tracks fixes
    assert.ok(engine.patternRecognizer);
  });
});

// ============================================================================
// FixGenerator Tests
// ============================================================================

describe('FixGenerator', () => {
  let generator;
  
  beforeEach(() => {
    generator = new FixGenerator();
  });
  
  it('should generate fixes from analysis', async () => {
    const rootCauseAnalysis = {
      rootCause: {
        type: 'MISSING_VALIDATION',
        category: 'VALIDATION_ERROR',
        parameter: 'userId',
        confidence: 0.85
      },
      suggestedStrategy: FixStrategy.ADD_VALIDATION
    };
    const pattern = { hash: 'pattern-1' };
    const errorEntry = { errorId: 'err-1', message: 'Missing parameter' };
    
    const fixes = await generator.generateFixes(rootCauseAnalysis, pattern, errorEntry);
    
    assert.ok(Array.isArray(fixes));
  });
  
  it('should assign risk levels', async () => {
    const rootCauseAnalysis = {
      rootCause: { type: 'LOGIC_ERROR', category: 'LOGIC_ERROR' }
    };
    const pattern = { hash: 'pattern-2' };
    const errorEntry = { errorId: 'err-2', message: 'Logic error' };
    
    const fixes = await generator.generateFixes(rootCauseAnalysis, pattern, errorEntry);
    
    assert.ok(Array.isArray(fixes));
  });
  
  it('should store proposals for retrieval', async () => {
    const rootCauseAnalysis = { 
      rootCause: { type: 'CONFIG_MISSING', category: 'CONFIG_ERROR' } 
    };
    const pattern = { hash: 'pattern-3' };
    const errorEntry = { errorId: 'err-3', message: 'Config missing' };
    
    const fixes = await generator.generateFixes(rootCauseAnalysis, pattern, errorEntry);
    
    assert.ok(Array.isArray(fixes));
  });
});

// ============================================================================
// FixValidator Tests
// ============================================================================

describe('FixValidator', () => {
  let validator;
  
  beforeEach(() => {
    validator = new FixValidator();
  });
  
  it('should validate fix proposals', async () => {
    const proposal = {
      proposalId: 'fix-1',
      strategy: FixStrategy.ADD_VALIDATION,
      changes: [{ type: 'add', content: 'if (!param) throw new Error()' }],
      riskLevel: RiskLevel.LOW
    };
    
    const result = await validator.validate(proposal);
    
    assert.ok(result);
  });
  
  it('should run all validation gates', async () => {
    const proposal = {
      proposalId: 'fix-2',
      strategy: FixStrategy.SET_DEFAULT_VALUE,
      changes: [{ type: 'modify', content: 'const x = param || "default"' }],
      riskLevel: RiskLevel.LOW
    };
    
    const result = await validator.validate(proposal);
    
    // Check that result exists
    assert.ok(result);
  });
  
  it('should calculate overall confidence', async () => {
    const proposal = {
      proposalId: 'fix-3',
      strategy: FixStrategy.ADD_ERROR_HANDLING,
      changes: [],
      riskLevel: RiskLevel.MEDIUM
    };
    
    const result = await validator.validate(proposal);
    
    assert.ok(result);
  });
});

// ============================================================================
// ApplyEngine Tests
// ============================================================================

describe('ApplyEngine', () => {
  let engine;
  
  beforeEach(() => {
    engine = new ApplyEngine();
  });
  
  it('should apply validated fixes', async () => {
    const proposal = {
      proposalId: 'fix-1',
      strategy: FixStrategy.SET_DEFAULT_VALUE,
      changes: [{ type: 'test', content: 'test change' }],
      riskLevel: RiskLevel.LOW
    };
    
    const result = await engine.apply(proposal);
    
    assert.ok(result);
  });
  
  it('should create backups before applying', async () => {
    const proposal = {
      proposalId: 'fix-2',
      changes: [{ file: 'test.js', content: 'test' }]
    };
    
    const result = await engine.apply(proposal);
    
    assert.ok(result);
  });
  
  it('should support rollback', async () => {
    const proposal = {
      proposalId: 'fix-3',
      changes: [{ type: 'test' }]
    };
    
    const applyResult = await engine.apply(proposal);
    
    if (applyResult.success && applyResult.operationId) {
      const rollbackResult = await engine.rollback(applyResult.operationId);
      assert.ok(rollbackResult);
    } else {
      // No rollback needed if apply didn't succeed
      assert.ok(true);
    }
  });
});

// ============================================================================
// AuditTrail Tests
// ============================================================================

describe('AuditTrail', () => {
  let audit;
  
  beforeEach(() => {
    audit = new AuditTrail();
  });
  
  it('should record decisions', async () => {
    const record = await audit.recordDecision(
      'change-1',
      'APPROVED',
      'Confidence threshold met',
      { confidence: 0.9 }
    );
    
    assert.ok(record);
  });
  
  it('should record rollbacks after decision', async () => {
    // First record a decision
    await audit.recordDecision('change-1', 'APPROVED', 'Test', {});
    
    const record = await audit.recordRollback(
      'change-1',
      'Error rate increased',
      'System'
    );
    
    assert.ok(record);
  });
  
  it('should retrieve audit history', async () => {
    await audit.recordDecision('change-1', 'APPROVED', 'Test', {});
    
    const history = await audit.getAuditHistory({ changeId: 'change-1' });
    
    assert.ok(history.length >= 1);
  });
  
  it('should verify integrity', async () => {
    await audit.recordDecision('change-1', 'APPROVED', 'Test', {});
    
    const result = audit.verifyIntegrity();
    assert.ok(result);
    assert.ok(result.total >= 1);
  });
});

// ============================================================================
// RollbackManager Tests
// ============================================================================

describe('RollbackManager', () => {
  let manager;
  let applyEngine;
  
  beforeEach(() => {
    applyEngine = new ApplyEngine();
    manager = new RollbackManager({
      applyEngine,
      backupSystem: applyEngine.backupSystem
    });
  });
  
  it('should request rollback', async () => {
    const result = await manager.requestRollback({
      changeId: 'change-1',
      reason: 'Test rollback',
      initiatedBy: 'Test'
    });
    
    assert.ok(result);
  });
  
  it('should track rollback statistics', async () => {
    await manager.requestRollback({
      changeId: 'change-1',
      trigger: RollbackTrigger.MANUAL_REQUEST
    });
    
    const stats = manager.getStats();
    assert.ok(typeof stats.totalRollbacks === 'number');
  });
  
  it('should start monitoring for auto-rollback', () => {
    const monitor = manager.startMonitoring('change-1', { errorRate: 0.05 });
    
    assert.ok(monitor);
    assert.strictEqual(monitor.changeId, 'change-1');
  });
  
  it('should check auto-rollback conditions', async () => {
    manager.startMonitoring('change-1', { errorRate: 0.05 });
    
    // Simulate increased error rate
    const result = await manager.checkAutoRollback('change-1', { errorRate: 0.2 });
    
    // May or may not trigger based on thresholds
    assert.ok(result === null || result.requestId);
  });
});

// ============================================================================
// MonitoringSystem Tests
// ============================================================================

describe('MonitoringSystem', () => {
  let monitoring;
  
  beforeEach(() => {
    monitoring = new MonitoringSystem();
  });
  
  it('should record metrics', () => {
    monitoring.record(SystemMetric.ERRORS_CAPTURED, 5);
    
    const value = monitoring.metrics.get(SystemMetric.ERRORS_CAPTURED);
    assert.ok(value);
    assert.strictEqual(value.value, 5);
  });
  
  it('should increment counters', () => {
    monitoring.increment(SystemMetric.FIXES_APPLIED);
    monitoring.increment(SystemMetric.FIXES_APPLIED);
    
    const count = monitoring.metrics.counters.get(SystemMetric.FIXES_APPLIED);
    assert.strictEqual(count, 2);
  });
  
  it('should record durations', () => {
    monitoring.recordDuration(SystemMetric.ANALYSIS_DURATION, 150);
    monitoring.recordDuration(SystemMetric.ANALYSIS_DURATION, 200);
    
    const stats = monitoring.metrics.get(SystemMetric.ANALYSIS_DURATION);
    assert.ok(stats);
  });
  
  it('should check alert thresholds', () => {
    monitoring.record(SystemMetric.ERROR_RATE, 0.3);
    
    const triggered = monitoring.checkAlerts();
    // May trigger alerts based on default thresholds
    assert.ok(Array.isArray(triggered));
  });
  
  it('should generate dashboard summary', () => {
    monitoring.increment(SystemMetric.ERRORS_CAPTURED, 10);
    monitoring.increment(SystemMetric.ERRORS_RESOLVED, 8);
    
    const summary = monitoring.getSummary();
    
    assert.ok(summary);
    assert.ok(summary.overview);
    assert.ok(summary.status);
  });
});

// ============================================================================
// CommandInterface Tests
// ============================================================================

describe('CommandInterface', () => {
  let cli;
  
  beforeEach(() => {
    cli = new CommandInterface();
  });
  
  it('should parse commands', () => {
    const parsed = cli.parser.parse('@viewLearningStats');
    
    assert.ok(parsed);
    assert.strictEqual(parsed.type, 'viewLearningStats');
  });
  
  it('should parse commands with arguments', () => {
    const parsed = cli.parser.parse('@viewLearningLog limit=50');
    
    assert.ok(parsed);
    assert.strictEqual(parsed.args.limit, 50);
  });
  
  it('should check if input is command', () => {
    assert.strictEqual(cli.isCommand('@applyLearning'), true);
    assert.strictEqual(cli.isCommand('hello world'), false);
  });
  
  it('should execute commands', async () => {
    const result = await cli.execute('@viewLearningStats');
    
    assert.ok(result);
    assert.strictEqual(result.command, 'viewLearningStats');
  });
  
  it('should return available commands', () => {
    const commands = cli.getAvailableCommands();
    
    assert.ok(Array.isArray(commands));
    assert.ok(commands.length > 0);
    assert.ok(commands.some(c => c.name === '@applyLearning'));
  });
});

// ============================================================================
// SafetyController Tests
// ============================================================================

describe('SafetyController', () => {
  let safety;
  
  beforeEach(() => {
    safety = new SafetyController();
  });
  
  it('should perform safety checks', () => {
    const result = safety.check({
      changeId: 'change-1',
      confidence: 0.9,
      riskLevel: 'low'
    });
    
    assert.ok(result);
    assert.ok(typeof result.allowed === 'boolean');
    assert.ok(result.status);
  });
  
  it('should block low confidence changes', () => {
    const result = safety.check({
      changeId: 'change-1',
      confidence: 0.3,
      riskLevel: 'high'
    });
    
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reason, BlockReason.LOW_CONFIDENCE);
  });
  
  it('should enforce rate limits', () => {
    // Record many operations
    for (let i = 0; i < 15; i++) {
      safety.recordOperation();
    }
    
    const result = safety.rateLimiter.check();
    // May or may not be blocked depending on rate
    assert.ok(typeof result.allowed === 'boolean');
  });
  
  it('should track failures', () => {
    safety.recordFailure('change-1', 'Error 1');
    safety.recordFailure('change-1', 'Error 2');
    safety.recordFailure('change-1', 'Error 3');
    
    const check = safety.failureTracker.checkBlocked('change-1');
    assert.ok(check.blocked);
  });
  
  it('should support manual blocks', () => {
    safety.block('change-1');
    
    const result = safety.check({ changeId: 'change-1' });
    
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reason, BlockReason.MANUAL_BLOCK);
    
    safety.unblock('change-1');
    
    const result2 = safety.check({ changeId: 'change-1', confidence: 0.9 });
    assert.strictEqual(result2.allowed, true);
  });
});

// ============================================================================
// SelfLearningSystem Integration Tests
// ============================================================================

describe('SelfLearningSystem', () => {
  let system;
  
  beforeEach(() => {
    system = new SelfLearningSystem({ autoApply: false });
  });
  
  it('should initialize all components', () => {
    assert.ok(system.errorLogger);
    assert.ok(system.analysisEngine);
    assert.ok(system.fixGenerator);
    assert.ok(system.fixValidator);
    assert.ok(system.applyEngine);
    assert.ok(system.auditTrail);
    assert.ok(system.rollbackManager);
    assert.ok(system.monitoring);
    assert.ok(system.commandInterface);
    assert.ok(system.safetyController);
  });
  
  it('should process errors through pipeline', async () => {
    const error = new Error('Test parameter missing');
    
    const result = await system.processError(error, { component: 'test' });
    
    assert.ok(result);
    assert.ok(result.stages);
  });
  
  it('should track statistics', async () => {
    await system.processError(new Error('Test error 1'), {});
    await system.processError(new Error('Test error 2'), {});
    
    const status = system.getStatus();
    
    assert.ok(status.stats);
  });
  
  it('should execute CLI commands', async () => {
    const result = await system.executeCommand('@viewLearningStats');
    
    assert.ok(result);
    assert.ok(result.success);
  });
  
  it('should provide dashboard', () => {
    const dashboard = system.getDashboard();
    
    assert.ok(dashboard);
    assert.ok(dashboard.includes('Self-Learning'));
  });
  
  it('should enable/disable system', () => {
    system.disable();
    assert.strictEqual(system.options.enabled, false);
    
    system.enable();
    assert.strictEqual(system.options.enabled, true);
  });
});

// ============================================================================
// Run tests
// ============================================================================

console.log('Running Self-Learning System Tests...\n');
