/**
 * GateManager - VF-06
 * Orchestrates all validation gates, aggregates results, makes pass/fail decisions
 * This is the central decision-maker for the validation pipeline
 */

import { SyntaxValidator } from './SyntaxValidator.js';
import { DependencyValidator } from './DependencyValidator.js';
import { TestRunner } from './TestRunner.js';

/**
 * @typedef {Object} GateConfig
 * @property {string} name - Gate name
 * @property {boolean} enabled - Whether gate is enabled
 * @property {boolean} critical - Whether failure blocks handoff
 * @property {number} timeoutMs - Maximum execution time
 * @property {boolean} parallel - Whether gate can run in parallel with others
 */

/**
 * @typedef {Object} GateResult
 * @property {string} gate - Gate name
 * @property {'PASS'|'FAIL'|'SKIP'|'TIMEOUT'} status
 * @property {any[]} [errors] - Errors found
 * @property {number} durationMs - Execution time
 * @property {boolean} critical - Whether this was a critical gate
 */

/**
 * @typedef {Object} ValidationDecision
 * @property {'APPROVED'|'REJECTED'|'REQUIRES_REVIEW'} status
 * @property {string} reason - Human-readable reason
 * @property {number} criticalIssues - Count of critical issues
 * @property {number} highIssues - Count of high severity issues
 * @property {number} moderateIssues - Count of moderate severity issues
 * @property {number} overallScore - Score from 0-100
 * @property {boolean} canHandoff - Whether artifact can proceed
 */

/**
 * @typedef {Object} GateManagerResult
 * @property {ValidationDecision} decision
 * @property {GateResult[]} gateResults
 * @property {Object} summary
 * @property {number} totalDurationMs
 */

export class GateManager {
  constructor(options = {}) {
    this.syntaxValidator = new SyntaxValidator();
    this.dependencyValidator = new DependencyValidator();
    this.testRunner = new TestRunner();

    // Default gate configuration
    this.gateConfig = options.gateConfig || {
      schemaValidation: {
        name: 'Schema Validation',
        enabled: true,
        critical: true,
        timeoutMs: 5000,
        parallel: true
      },
      syntaxValidation: {
        name: 'Syntax Validation',
        enabled: true,
        critical: true,
        timeoutMs: 10000,
        parallel: true
      },
      dependencyValidation: {
        name: 'Dependency Validation',
        enabled: true,
        critical: true,
        timeoutMs: 30000,
        parallel: true
      },
      securityScan: {
        name: 'Security Scan',
        enabled: true,
        critical: false, // High issues may still allow handoff
        timeoutMs: 60000,
        parallel: true
      },
      testExecution: {
        name: 'Test Execution',
        enabled: options.runTests ?? false, // Off by default
        critical: false,
        timeoutMs: 120000,
        parallel: false // Tests should run sequentially
      }
    };

    // Decision thresholds
    this.thresholds = options.thresholds || {
      criticalIssuesBlock: true,        // Any critical issues = REJECTED
      highIssuesBlock: true,            // Any high issues = REJECTED
      moderateIssuesReview: 3,          // >3 moderate issues = REQUIRES_REVIEW
      minPassingScore: 70,              // Score below this = REJECTED
      testFailuresBlock: false          // Test failures don't block by default
    };
  }

  /**
   * Run all validation gates on an artifact
   * @param {Object} artifact - The artifact to validate
   * @param {Object} [context] - Additional context
   * @returns {Promise<GateManagerResult>}
   */
  async validate(artifact, context = {}) {
    const startTime = Date.now();
    const gateResults = [];

    // Determine which gates to run based on artifact type
    const gates = this._selectGates(artifact, context);

    // Run parallel gates first
    const parallelGates = gates.filter(g => g.parallel);
    const sequentialGates = gates.filter(g => !g.parallel);

    // Execute parallel gates
    if (parallelGates.length > 0) {
      const parallelResults = await Promise.allSettled(
        parallelGates.map(gate => this._executeGate(gate, artifact, context))
      );

      for (let i = 0; i < parallelResults.length; i++) {
        const result = parallelResults[i];
        if (result.status === 'fulfilled') {
          gateResults.push(result.value);
        } else {
          gateResults.push({
            gate: parallelGates[i].name,
            status: 'FAIL',
            errors: [{ message: result.reason?.message || 'Gate execution failed' }],
            durationMs: parallelGates[i].timeoutMs,
            critical: parallelGates[i].critical
          });
        }
      }
    }

    // Execute sequential gates
    for (const gate of sequentialGates) {
      try {
        const result = await this._executeGate(gate, artifact, context);
        gateResults.push(result);

        // Early exit if critical gate fails and configured to stop
        if (result.status === 'FAIL' && result.critical && context.earlyExit) {
          break;
        }
      } catch (error) {
        gateResults.push({
          gate: gate.name,
          status: 'FAIL',
          errors: [{ message: error.message }],
          durationMs: 0,
          critical: gate.critical
        });
      }
    }

    // Aggregate results and make decision
    const summary = this._aggregateResults(gateResults);
    const decision = this._makeDecision(summary, gateResults);

    return {
      decision,
      gateResults,
      summary,
      totalDurationMs: Date.now() - startTime
    };
  }

  /**
   * Select which gates to run based on artifact type
   */
  _selectGates(artifact, context) {
    const gates = [];
    const config = this.gateConfig;

    // Always run schema validation if there's a schema
    if (config.schemaValidation.enabled && artifact.schema) {
      gates.push({ ...config.schemaValidation, type: 'schema' });
    }

    // Syntax validation for code artifacts
    if (config.syntaxValidation.enabled && (artifact.code || artifact.files)) {
      gates.push({ ...config.syntaxValidation, type: 'syntax' });
    }

    // Dependency validation for code with imports
    if (config.dependencyValidation.enabled && (artifact.code || artifact.projectRoot)) {
      gates.push({ ...config.dependencyValidation, type: 'dependency' });
    }

    // Security scan for Azure resources
    if (config.securityScan.enabled && artifact.resources) {
      gates.push({ ...config.securityScan, type: 'security' });
    }

    // Test execution if tests exist
    if (config.testExecution.enabled && artifact.projectRoot) {
      gates.push({ ...config.testExecution, type: 'test' });
    }

    return gates;
  }

  /**
   * Execute a single gate with timeout
   */
  async _executeGate(gate, artifact, context) {
    const startTime = Date.now();

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gate timeout')), gate.timeoutMs);
    });

    try {
      // Run the appropriate validator
      const validationPromise = this._runGateValidator(gate, artifact, context);
      const result = await Promise.race([validationPromise, timeoutPromise]);

      return {
        gate: gate.name,
        status: result.status,
        errors: result.errors || [],
        details: result.details || {},
        durationMs: Date.now() - startTime,
        critical: gate.critical
      };
    } catch (error) {
      if (error.message === 'Gate timeout') {
        return {
          gate: gate.name,
          status: 'TIMEOUT',
          errors: [{ message: `Gate exceeded timeout of ${gate.timeoutMs}ms` }],
          durationMs: gate.timeoutMs,
          critical: gate.critical
        };
      }
      throw error;
    }
  }

  /**
   * Run the appropriate validator for a gate type
   */
  async _runGateValidator(gate, artifact, context) {
    switch (gate.type) {
      case 'schema':
        return this._runSchemaValidation(artifact);

      case 'syntax':
        return this._runSyntaxValidation(artifact);

      case 'dependency':
        return this._runDependencyValidation(artifact);

      case 'security':
        return this._runSecurityValidation(artifact, context);

      case 'test':
        return this._runTestValidation(artifact);

      default:
        return { status: 'SKIP', errors: [] };
    }
  }

  /**
   * Run schema validation
   */
  async _runSchemaValidation(artifact) {
    // If artifact has a schema, validate against it
    if (!artifact.schema || !artifact.data) {
      return { status: 'SKIP', errors: [] };
    }

    // Basic JSON schema validation
    try {
      // This is a simplified version - in production, use ajv or similar
      const valid = this._validateAgainstSchema(artifact.data, artifact.schema);
      return {
        status: valid ? 'PASS' : 'FAIL',
        errors: valid ? [] : [{ message: 'Schema validation failed' }]
      };
    } catch (error) {
      return {
        status: 'FAIL',
        errors: [{ message: error.message }]
      };
    }
  }

  /**
   * Simple schema validation (for production, use ajv)
   */
  _validateAgainstSchema(data, schema) {
    // Check required properties
    if (schema.required) {
      for (const prop of schema.required) {
        if (!(prop in data)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Run syntax validation on code artifacts
   */
  async _runSyntaxValidation(artifact) {
    const errors = [];

    if (artifact.code) {
      const result = await this.syntaxValidator.validate(
        artifact.code,
        artifact.filePath || ''
      );
      if (result.status === 'FAIL') {
        errors.push(...result.errors);
      }
    }

    if (artifact.files) {
      for (const file of artifact.files) {
        const result = await this.syntaxValidator.validate(file.content, file.path);
        if (result.status === 'FAIL') {
          errors.push(...result.errors.map(e => ({
            ...e,
            file: file.path
          })));
        }
      }
    }

    return {
      status: errors.length === 0 ? 'PASS' : 'FAIL',
      errors
    };
  }

  /**
   * Run dependency validation
   */
  async _runDependencyValidation(artifact) {
    if (artifact.projectRoot) {
      const result = await this.dependencyValidator.validateProject(artifact.projectRoot);
      return {
        status: result.status,
        errors: result.allMissingDependencies.map(d => ({
          message: `Missing dependency: ${d.dependency}`,
          file: d.file
        })),
        details: {
          circularDependencies: result.allCircularDependencies,
          summary: result.summary
        }
      };
    }

    if (artifact.code && artifact.filePath) {
      const result = await this.dependencyValidator.validate(
        artifact.code,
        artifact.filePath,
        artifact.projectRoot
      );
      return {
        status: result.status,
        errors: result.missingDependencies.map(d => ({
          message: `Missing dependency: ${d}`
        })),
        details: {
          circularDependencies: result.circularDependencies
        }
      };
    }

    return { status: 'SKIP', errors: [] };
  }

  /**
   * Run security validation (delegates to ValidationAgent's security checks)
   */
  async _runSecurityValidation(artifact, context) {
    // This will be enhanced when integrated with ValidationAgent
    const errors = [];

    if (artifact.resources) {
      for (const resource of artifact.resources) {
        // Check for common security issues
        if (resource.properties?.publicNetworkAccess === 'Enabled') {
          errors.push({
            resourceId: resource.id || resource.name,
            severity: 'high',
            message: 'Public network access is enabled'
          });
        }

        if (resource.type?.includes('Storage') && 
            !resource.properties?.encryption?.services?.blob?.enabled) {
          errors.push({
            resourceId: resource.id || resource.name,
            severity: 'critical',
            message: 'Storage encryption is not enabled'
          });
        }
      }
    }

    return {
      status: errors.length === 0 ? 'PASS' : 'FAIL',
      errors
    };
  }

  /**
   * Run test validation
   */
  async _runTestValidation(artifact) {
    if (!artifact.projectRoot) {
      return { status: 'SKIP', errors: [] };
    }

    const result = await this.testRunner.run(artifact.projectRoot, {
      runTests: true,
      coverage: false
    });

    return {
      status: result.status,
      errors: result.testResult.failures.map(f => ({
        message: `Test failed: ${f.name}`,
        details: f.message
      })),
      details: {
        passed: result.testResult.passed,
        failed: result.testResult.failed,
        total: result.testResult.total
      }
    };
  }

  /**
   * Aggregate results from all gates
   */
  _aggregateResults(gateResults) {
    const summary = {
      totalGates: gateResults.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      timedOut: 0,
      criticalFailures: 0,
      highIssues: 0,
      moderateIssues: 0,
      totalErrors: 0,
      totalDurationMs: 0
    };

    for (const result of gateResults) {
      summary.totalDurationMs += result.durationMs;

      switch (result.status) {
        case 'PASS':
          summary.passed++;
          break;
        case 'FAIL':
          summary.failed++;
          if (result.critical) {
            summary.criticalFailures++;
          }
          summary.totalErrors += result.errors?.length || 0;
          break;
        case 'SKIP':
          summary.skipped++;
          break;
        case 'TIMEOUT':
          summary.timedOut++;
          if (result.critical) {
            summary.criticalFailures++;
          }
          break;
      }

      // Count severity levels from errors
      for (const error of result.errors || []) {
        if (error.severity === 'critical') summary.criticalFailures++;
        else if (error.severity === 'high') summary.highIssues++;
        else if (error.severity === 'medium' || error.severity === 'moderate') summary.moderateIssues++;
      }
    }

    // Calculate overall score (0-100)
    const baseScore = 100;
    const criticalPenalty = summary.criticalFailures * 30;
    const highPenalty = summary.highIssues * 15;
    const moderatePenalty = summary.moderateIssues * 5;
    const failurePenalty = (summary.failed - summary.criticalFailures) * 10;
    
    summary.overallScore = Math.max(0, baseScore - criticalPenalty - highPenalty - moderatePenalty - failurePenalty);

    return summary;
  }

  /**
   * Make the final validation decision
   */
  _makeDecision(summary, gateResults) {
    const t = this.thresholds;

    // Check for immediate rejection
    if (t.criticalIssuesBlock && summary.criticalFailures > 0) {
      return {
        status: 'REJECTED',
        reason: `${summary.criticalFailures} critical issue(s) found`,
        criticalIssues: summary.criticalFailures,
        highIssues: summary.highIssues,
        moderateIssues: summary.moderateIssues,
        overallScore: summary.overallScore,
        canHandoff: false
      };
    }

    if (t.highIssuesBlock && summary.highIssues > 0) {
      return {
        status: 'REJECTED',
        reason: `${summary.highIssues} high severity issue(s) found`,
        criticalIssues: summary.criticalFailures,
        highIssues: summary.highIssues,
        moderateIssues: summary.moderateIssues,
        overallScore: summary.overallScore,
        canHandoff: false
      };
    }

    if (summary.overallScore < t.minPassingScore) {
      return {
        status: 'REJECTED',
        reason: `Overall score ${summary.overallScore} below threshold ${t.minPassingScore}`,
        criticalIssues: summary.criticalFailures,
        highIssues: summary.highIssues,
        moderateIssues: summary.moderateIssues,
        overallScore: summary.overallScore,
        canHandoff: false
      };
    }

    // Check for review requirement
    if (summary.moderateIssues > t.moderateIssuesReview) {
      return {
        status: 'REQUIRES_REVIEW',
        reason: `${summary.moderateIssues} moderate issues exceed review threshold`,
        criticalIssues: summary.criticalFailures,
        highIssues: summary.highIssues,
        moderateIssues: summary.moderateIssues,
        overallScore: summary.overallScore,
        canHandoff: true // Can proceed with review
      };
    }

    // All checks passed
    return {
      status: 'APPROVED',
      reason: `All validation gates passed (score: ${summary.overallScore})`,
      criticalIssues: 0,
      highIssues: 0,
      moderateIssues: summary.moderateIssues,
      overallScore: summary.overallScore,
      canHandoff: true
    };
  }

  /**
   * Validate a single file quickly
   */
  async validateFile(code, filePath) {
    const syntaxResult = await this.syntaxValidator.validate(code, filePath);
    
    return {
      decision: {
        status: syntaxResult.status === 'PASS' ? 'APPROVED' : 'REJECTED',
        reason: syntaxResult.status === 'PASS' ? 'Syntax valid' : 'Syntax errors found',
        canHandoff: syntaxResult.status === 'PASS'
      },
      gateResults: [{
        gate: 'Syntax Validation',
        status: syntaxResult.status,
        errors: syntaxResult.errors,
        durationMs: syntaxResult.durationMs,
        critical: true
      }]
    };
  }

  /**
   * Update gate configuration
   */
  configure(config) {
    this.gateConfig = { ...this.gateConfig, ...config };
  }

  /**
   * Update thresholds
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

export default GateManager;
