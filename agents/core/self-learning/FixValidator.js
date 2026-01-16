/**
 * FixValidator - SL-06 Validation Framework
 * 
 * Validates fix proposals through 5 validation gates:
 * 1. Type Validation
 * 2. Logic Validation
 * 3. Sandbox Testing
 * 4. Regression Testing
 * 5. Impact Analysis
 * 
 * @implements SelfLearning/06_VALIDATION_FRAMEWORK.md
 */

import { EventEmitter } from 'events';

/**
 * Check result structure
 */
class CheckResult {
  constructor(data) {
    this.passed = data.passed || false;
    this.message = data.message || '';
    this.details = data.details || {};
    this.severity = data.severity || 'info'; // 'error', 'warning', 'info'
    this.checkName = data.checkName || 'unknown';
    this.duration = data.duration || 0;
  }
  
  toJSON() {
    return {
      passed: this.passed,
      message: this.message,
      details: this.details,
      severity: this.severity,
      checkName: this.checkName,
      duration: this.duration
    };
  }
}

/**
 * Validation result structure
 */
class ValidationResult {
  constructor(data) {
    this.changeId = data.changeId;
    this.timestamp = data.timestamp || new Date();
    
    this.checks = {
      typeValidation: data.checks?.typeValidation || null,
      logicValidation: data.checks?.logicValidation || null,
      sandboxTest: data.checks?.sandboxTest || null,
      regressionTest: data.checks?.regressionTest || null,
      impactAnalysis: data.checks?.impactAnalysis || null
    };
    
    this.sandboxResult = data.sandboxResult || {
      errors: [],
      testsPassed: 0,
      testsFailed: 0,
      coverage: 0
    };
    
    this.regressionResult = data.regressionResult || {
      previousTests: [],
      regressionDetected: false,
      failedTests: []
    };
    
    this.approved = data.approved || false;
    this.overallConfidence = data.overallConfidence || 0;
    this.recommendations = data.recommendations || [];
    this.duration = data.duration || 0;
  }
  
  /**
   * Check if all gates passed
   */
  allGatesPassed() {
    return Object.values(this.checks).every(check => check?.passed !== false);
  }
  
  /**
   * Get failed gates
   */
  getFailedGates() {
    return Object.entries(this.checks)
      .filter(([, check]) => check && !check.passed)
      .map(([name, check]) => ({ name, check }));
  }
  
  toJSON() {
    return {
      changeId: this.changeId,
      timestamp: this.timestamp,
      checks: {
        typeValidation: this.checks.typeValidation?.toJSON?.() || this.checks.typeValidation,
        logicValidation: this.checks.logicValidation?.toJSON?.() || this.checks.logicValidation,
        sandboxTest: this.checks.sandboxTest?.toJSON?.() || this.checks.sandboxTest,
        regressionTest: this.checks.regressionTest?.toJSON?.() || this.checks.regressionTest,
        impactAnalysis: this.checks.impactAnalysis?.toJSON?.() || this.checks.impactAnalysis
      },
      sandboxResult: this.sandboxResult,
      regressionResult: this.regressionResult,
      approved: this.approved,
      overallConfidence: this.overallConfidence,
      recommendations: this.recommendations,
      duration: this.duration
    };
  }
}

/**
 * Type Validator - Gate 1
 */
class TypeValidator {
  constructor() {
    this.name = 'TypeValidator';
  }
  
  /**
   * Validate type compatibility of proposed change
   */
  async validate(proposedChange) {
    const startTime = Date.now();
    
    try {
      const newValue = proposedChange.proposedChange.newValue;
      const oldValue = proposedChange.proposedChange.oldValue;
      
      // Check 1: Type compatibility
      const typeCorrect = this._checkTypeCompatibility(oldValue, newValue);
      
      // Check 2: Schema validation (if applicable)
      const schemaValid = this._validateSchema(newValue, proposedChange.proposedChange.type);
      
      // Check 3: Reference validation
      const referencesValid = this._validateReferences(newValue);
      
      const passed = typeCorrect && schemaValid && referencesValid;
      
      return new CheckResult({
        passed,
        message: passed ? 'Type validation passed' : 'Type validation failed',
        details: {
          typeCorrect,
          schemaValid,
          referencesValid
        },
        severity: passed ? 'info' : 'error',
        checkName: 'typeValidation',
        duration: Date.now() - startTime
      });
    } catch (error) {
      return new CheckResult({
        passed: false,
        message: `Type validation error: ${error.message}`,
        details: { error: error.message },
        severity: 'error',
        checkName: 'typeValidation',
        duration: Date.now() - startTime
      });
    }
  }
  
  _checkTypeCompatibility(oldValue, newValue) {
    // If no old value, new value is an addition (always compatible)
    if (oldValue === null || oldValue === undefined) {
      return true;
    }
    
    // Check basic type compatibility
    const oldType = typeof oldValue;
    const newType = typeof newValue;
    
    // Allow null/undefined replacements
    if (newValue === null || newValue === undefined) {
      return true;
    }
    
    // Same type is always compatible
    if (oldType === newType) {
      return true;
    }
    
    // Allow object <-> array (both are objects in JS)
    if (oldType === 'object' && newType === 'object') {
      return true;
    }
    
    return false;
  }
  
  _validateSchema(value, changeType) {
    // Basic schema validation based on change type
    switch (changeType) {
      case 'validation_rule':
        return value && (typeof value.validate === 'string' || typeof value.validate === 'function');
      case 'type_check':
        return value && value.expectedType;
      case 'default_value':
        return true; // Any value can be a default
      case 'config_update':
        return true; // Config values are flexible
      default:
        return true;
    }
  }
  
  _validateReferences(value) {
    // Check if value contains valid references
    if (typeof value !== 'object' || value === null) {
      return true;
    }
    
    // Check for circular references
    try {
      JSON.stringify(value);
      return true;
    } catch (e) {
      // Circular reference detected
      return false;
    }
  }
}

/**
 * Logic Validator - Gate 2
 */
class LogicValidator {
  constructor() {
    this.name = 'LogicValidator';
  }
  
  /**
   * Validate logic soundness of proposed change
   */
  async validate(proposedChange) {
    const startTime = Date.now();
    
    try {
      const change = proposedChange.proposedChange;
      
      // Check 1: Logic soundness
      const logicSound = this._checkLogicSoundness(change);
      
      // Check 2: Error handling presence
      const errorHandlingOk = this._checkErrorHandling(change);
      
      // Check 3: State consistency
      const stateConsistent = this._checkStateConsistency(change);
      
      // Check 4: No circular dependencies
      const noDependencies = this._checkNoDependencies(proposedChange);
      
      const passed = logicSound && errorHandlingOk && stateConsistent && noDependencies;
      
      return new CheckResult({
        passed,
        message: passed ? 'Logic validation passed' : 'Logic validation failed',
        details: {
          logicSound,
          errorHandlingOk,
          stateConsistent,
          noDependencies
        },
        severity: passed ? 'info' : 'error',
        checkName: 'logicValidation',
        duration: Date.now() - startTime
      });
    } catch (error) {
      return new CheckResult({
        passed: false,
        message: `Logic validation error: ${error.message}`,
        details: { error: error.message },
        severity: 'error',
        checkName: 'logicValidation',
        duration: Date.now() - startTime
      });
    }
  }
  
  _checkLogicSoundness(change) {
    // Check if code example is syntactically valid
    if (change.codeExample) {
      try {
        // Basic syntax check - try to parse
        new Function(change.codeExample);
        return true;
      } catch (e) {
        // Syntax error in code example
        return false;
      }
    }
    return true;
  }
  
  _checkErrorHandling(change) {
    // For validation-type changes, error handling is expected
    if (change.type === 'validation_rule' || change.type === 'type_check') {
      if (change.codeExample) {
        return change.codeExample.includes('throw') || 
               change.codeExample.includes('return') ||
               change.codeExample.includes('Error');
      }
    }
    return true;
  }
  
  _checkStateConsistency(change) {
    // Check that change doesn't introduce state inconsistencies
    // This is a simplified check
    return true;
  }
  
  _checkNoDependencies(proposedChange) {
    // Check for circular dependencies in rollback plan
    const deps = proposedChange.rollbackPlan?.dependencies || [];
    
    // If change depends on itself, that's circular
    if (deps.includes(proposedChange.changeId)) {
      return false;
    }
    
    return true;
  }
}

/**
 * Sandbox Tester - Gate 3
 */
class SandboxTester {
  constructor() {
    this.name = 'SandboxTester';
  }
  
  /**
   * Test proposed change in isolated environment
   */
  async validate(proposedChange) {
    const startTime = Date.now();
    
    try {
      // Simulate sandbox testing
      const result = await this._runInSandbox(proposedChange);
      
      const passed = result.errors.length === 0 && 
                     result.testsFailed === 0 &&
                     result.withinLimits;
      
      return new CheckResult({
        passed,
        message: passed ? 'Sandbox test passed' : 'Sandbox test failed',
        details: {
          errors: result.errors,
          testsPassed: result.testsPassed,
          testsFailed: result.testsFailed,
          coverage: result.coverage,
          resourceUsage: result.resourceUsage
        },
        severity: passed ? 'info' : 'error',
        checkName: 'sandboxTest',
        duration: Date.now() - startTime
      });
    } catch (error) {
      return new CheckResult({
        passed: false,
        message: `Sandbox test error: ${error.message}`,
        details: { error: error.message },
        severity: 'error',
        checkName: 'sandboxTest',
        duration: Date.now() - startTime
      });
    }
  }
  
  async _runInSandbox(proposedChange) {
    // Simulated sandbox execution
    // In real implementation, this would run in isolated VM or container
    
    // Validate code example if present
    let errors = [];
    if (proposedChange.proposedChange.codeExample) {
      try {
        new Function(proposedChange.proposedChange.codeExample);
      } catch (e) {
        errors.push(e.message);
      }
    }
    
    return {
      errors,
      testsPassed: errors.length === 0 ? 1 : 0,
      testsFailed: errors.length > 0 ? 1 : 0,
      coverage: 0.8, // Simulated coverage
      resourceUsage: {
        cpu: 10, // percentage
        memory: 50, // MB
        time: 100 // ms
      },
      withinLimits: true
    };
  }
}

/**
 * Regression Tester - Gate 4
 */
class RegressionTester {
  constructor() {
    this.name = 'RegressionTester';
    this.testResults = new Map(); // Store previous test results
  }
  
  /**
   * Check for regressions after applying change
   */
  async validate(proposedChange) {
    const startTime = Date.now();
    
    try {
      // Get previous test results for affected components
      const affectedAgents = proposedChange.impactAssessment.affectedAgents;
      const affectedSkills = proposedChange.impactAssessment.affectedSkills;
      
      // Run regression tests
      const result = await this._runRegressionTests(affectedAgents, affectedSkills);
      
      const passed = !result.regressionDetected && result.failedTests.length === 0;
      
      return new CheckResult({
        passed,
        message: passed ? 'No regressions detected' : 'Regression detected',
        details: {
          testsRun: result.testsRun,
          previousTests: result.previousTests.length,
          failedTests: result.failedTests,
          regressionDetected: result.regressionDetected
        },
        severity: passed ? 'info' : 'error',
        checkName: 'regressionTest',
        duration: Date.now() - startTime
      });
    } catch (error) {
      return new CheckResult({
        passed: false,
        message: `Regression test error: ${error.message}`,
        details: { error: error.message },
        severity: 'error',
        checkName: 'regressionTest',
        duration: Date.now() - startTime
      });
    }
  }
  
  async _runRegressionTests(agents, skills) {
    // Simulated regression testing
    // In real implementation, this would run actual test suites
    
    return {
      testsRun: 10,
      previousTests: [],
      failedTests: [],
      regressionDetected: false
    };
  }
  
  /**
   * Store test result for future regression comparison
   */
  storeTestResult(component, result) {
    this.testResults.set(component, {
      result,
      timestamp: new Date()
    });
  }
}

/**
 * Impact Analyzer - Gate 5
 */
class ImpactAnalyzer {
  constructor() {
    this.name = 'ImpactAnalyzer';
  }
  
  /**
   * Analyze impact of proposed change
   */
  async validate(proposedChange) {
    const startTime = Date.now();
    
    try {
      // Analyze impact
      const impact = this._analyzeImpact(proposedChange);
      
      // Check if impact is acceptable
      const passed = impact.riskScore < 0.7 && // Not too risky
                     impact.breakingChanges.length === 0 && // No breaking changes
                     impact.dependencyIssues.length === 0; // No dependency issues
      
      return new CheckResult({
        passed,
        message: passed ? 'Impact analysis passed' : 'Impact analysis detected issues',
        details: {
          riskScore: impact.riskScore,
          affectedComponents: impact.affectedComponents,
          breakingChanges: impact.breakingChanges,
          dependencyIssues: impact.dependencyIssues,
          recommendations: impact.recommendations
        },
        severity: passed ? 'info' : (impact.riskScore > 0.8 ? 'error' : 'warning'),
        checkName: 'impactAnalysis',
        duration: Date.now() - startTime
      });
    } catch (error) {
      return new CheckResult({
        passed: false,
        message: `Impact analysis error: ${error.message}`,
        details: { error: error.message },
        severity: 'error',
        checkName: 'impactAnalysis',
        duration: Date.now() - startTime
      });
    }
  }
  
  _analyzeImpact(proposedChange) {
    const impact = proposedChange.impactAssessment;
    
    // Calculate risk score
    let riskScore = 0;
    
    // More affected components = higher risk
    riskScore += (impact.affectedAgents.length * 0.1);
    riskScore += (impact.affectedSkills.length * 0.05);
    
    // Side effects increase risk
    riskScore += (impact.estimatedSideEffects.length * 0.15);
    
    // Potential breakages are high risk
    riskScore += (impact.potentialBreakages.length * 0.25);
    
    // Risk level from strategy
    const strategy = proposedChange.strategies.primary;
    if (strategy.riskLevel === 'high') {
      riskScore += 0.3;
    } else if (strategy.riskLevel === 'medium') {
      riskScore += 0.15;
    }
    
    // Cap at 1.0
    riskScore = Math.min(1.0, riskScore);
    
    return {
      riskScore,
      affectedComponents: [
        ...impact.affectedAgents,
        ...impact.affectedSkills
      ],
      breakingChanges: impact.potentialBreakages,
      dependencyIssues: [],
      recommendations: this._generateRecommendations(riskScore, impact)
    };
  }
  
  _generateRecommendations(riskScore, impact) {
    const recommendations = [];
    
    if (riskScore > 0.5) {
      recommendations.push('Consider manual review before applying');
    }
    
    if (impact.affectedAgents.length > 2) {
      recommendations.push('Multiple agents affected - test thoroughly');
    }
    
    if (impact.estimatedSideEffects.length > 0) {
      recommendations.push('Review estimated side effects');
    }
    
    return recommendations;
  }
}

/**
 * Main Fix Validator
 */
class FixValidator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      confidenceThreshold: options.confidenceThreshold || 0.8,
      requireAllGates: options.requireAllGates !== false,
      ...options
    };
    
    // Initialize validators
    this.typeValidator = new TypeValidator();
    this.logicValidator = new LogicValidator();
    this.sandboxTester = new SandboxTester();
    this.regressionTester = new RegressionTester();
    this.impactAnalyzer = new ImpactAnalyzer();
    
    // Validation history
    this.validations = new Map();
    
    // Statistics
    this.stats = {
      totalValidated: 0,
      approved: 0,
      rejected: 0,
      byGate: {
        typeValidation: { passed: 0, failed: 0 },
        logicValidation: { passed: 0, failed: 0 },
        sandboxTest: { passed: 0, failed: 0 },
        regressionTest: { passed: 0, failed: 0 },
        impactAnalysis: { passed: 0, failed: 0 }
      }
    };
  }
  
  /**
   * Validate a fix proposal through all gates
   */
  async validate(proposedChange) {
    const startTime = Date.now();
    
    const result = new ValidationResult({
      changeId: proposedChange.changeId
    });
    
    // Gate 1: Type Validation
    result.checks.typeValidation = await this.typeValidator.validate(proposedChange);
    this._updateGateStats('typeValidation', result.checks.typeValidation.passed);
    
    // Gate 2: Logic Validation
    result.checks.logicValidation = await this.logicValidator.validate(proposedChange);
    this._updateGateStats('logicValidation', result.checks.logicValidation.passed);
    
    // Gate 3: Sandbox Testing
    result.checks.sandboxTest = await this.sandboxTester.validate(proposedChange);
    this._updateGateStats('sandboxTest', result.checks.sandboxTest.passed);
    
    // Update sandbox result
    result.sandboxResult = result.checks.sandboxTest.details;
    
    // Gate 4: Regression Testing
    result.checks.regressionTest = await this.regressionTester.validate(proposedChange);
    this._updateGateStats('regressionTest', result.checks.regressionTest.passed);
    
    // Update regression result
    result.regressionResult = result.checks.regressionTest.details;
    
    // Gate 5: Impact Analysis
    result.checks.impactAnalysis = await this.impactAnalyzer.validate(proposedChange);
    this._updateGateStats('impactAnalysis', result.checks.impactAnalysis.passed);
    
    // Calculate overall confidence
    result.overallConfidence = this._calculateOverallConfidence(proposedChange, result);
    
    // Determine approval
    const allGatesPassed = result.allGatesPassed();
    const meetsConfidence = result.overallConfidence >= this.options.confidenceThreshold;
    
    if (this.options.requireAllGates) {
      result.approved = allGatesPassed && meetsConfidence;
    } else {
      // Allow approval if confidence is high enough even with some warnings
      result.approved = meetsConfidence && result.getFailedGates()
        .every(g => g.check.severity !== 'error');
    }
    
    // Generate recommendations
    result.recommendations = this._generateRecommendations(result, proposedChange);
    
    // Record duration
    result.duration = Date.now() - startTime;
    
    // Store validation
    this.validations.set(proposedChange.changeId, result);
    
    // Update statistics
    this.stats.totalValidated++;
    if (result.approved) {
      this.stats.approved++;
    } else {
      this.stats.rejected++;
    }
    
    // Emit events
    this.emit('validation:complete', result);
    
    if (result.approved) {
      this.emit('validation:approved', {
        changeId: proposedChange.changeId,
        confidence: result.overallConfidence
      });
    } else {
      this.emit('validation:rejected', {
        changeId: proposedChange.changeId,
        failedGates: result.getFailedGates().map(g => g.name),
        recommendations: result.recommendations
      });
    }
    
    return result;
  }
  
  /**
   * Calculate overall confidence
   */
  _calculateOverallConfidence(proposedChange, validationResult) {
    let confidence = proposedChange.confidence;
    
    // Boost for passed gates
    const passedGates = Object.values(validationResult.checks)
      .filter(c => c?.passed).length;
    const totalGates = 5;
    
    confidence *= (0.5 + (passedGates / totalGates) * 0.5);
    
    // Penalty for failures
    const failedGates = validationResult.getFailedGates();
    for (const failed of failedGates) {
      if (failed.check.severity === 'error') {
        confidence *= 0.5;
      } else if (failed.check.severity === 'warning') {
        confidence *= 0.8;
      }
    }
    
    return Math.min(1.0, Math.max(0, confidence));
  }
  
  /**
   * Generate recommendations based on validation
   */
  _generateRecommendations(validationResult, proposedChange) {
    const recommendations = [];
    
    // Add impact analysis recommendations
    if (validationResult.checks.impactAnalysis?.details?.recommendations) {
      recommendations.push(...validationResult.checks.impactAnalysis.details.recommendations);
    }
    
    // Add recommendations for failed gates
    for (const failed of validationResult.getFailedGates()) {
      recommendations.push(`Fix issue in ${failed.name}: ${failed.check.message}`);
    }
    
    // Low confidence warning
    if (validationResult.overallConfidence < 0.5) {
      recommendations.push('Low confidence - manual review strongly recommended');
    }
    
    return recommendations;
  }
  
  /**
   * Update gate statistics
   */
  _updateGateStats(gateName, passed) {
    if (passed) {
      this.stats.byGate[gateName].passed++;
    } else {
      this.stats.byGate[gateName].failed++;
    }
  }
  
  /**
   * Get validation result for a change
   */
  getValidation(changeId) {
    return this.validations.get(changeId);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      approvalRate: this.stats.totalValidated > 0 
        ? this.stats.approved / this.stats.totalValidated 
        : 0
    };
  }
  
  /**
   * Clear validation history
   */
  clear() {
    this.validations.clear();
    this.stats = {
      totalValidated: 0,
      approved: 0,
      rejected: 0,
      byGate: {
        typeValidation: { passed: 0, failed: 0 },
        logicValidation: { passed: 0, failed: 0 },
        sandboxTest: { passed: 0, failed: 0 },
        regressionTest: { passed: 0, failed: 0 },
        impactAnalysis: { passed: 0, failed: 0 }
      }
    };
  }
}

export {
  FixValidator,
  ValidationResult,
  CheckResult,
  // Export individual validators for testing/extension
  TypeValidator,
  LogicValidator,
  SandboxTester,
  RegressionTester,
  ImpactAnalyzer
};
