/**
 * FixGenerator - SL-05 Fix Generation Engine
 * 
 * Generates fix proposals based on root cause analysis.
 * Multiple strategies per error type with confidence scoring.
 * 
 * @implements SelfLearning/05_FIX_GENERATION.md
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { ErrorCategory } from './ErrorLogger.js';

/**
 * Fix strategies
 */
const FixStrategy = {
  // Parameter fixes
  UPDATE_PARAMETER: 'update_parameter',
  ADD_VALIDATION: 'add_validation',
  SET_DEFAULT_VALUE: 'set_default_value',
  
  // Logic fixes
  FIX_LOGIC: 'fix_logic',
  ADD_CONDITION: 'add_condition',
  REFACTOR_FLOW: 'refactor_flow',
  
  // Dependency fixes
  UPDATE_DEPENDENCY: 'update_dependency',
  ADD_DEPENDENCY: 'add_dependency',
  
  // Skill fixes
  CHANGE_SKILL: 'change_skill',
  
  // Validation fixes
  STRENGTHEN_VALIDATION: 'strengthen_validation',
  ADD_ERROR_HANDLING: 'add_error_handling',
  
  // Logging fixes
  IMPROVE_LOGGING: 'improve_logging',
  
  // Configuration fixes
  UPDATE_CONFIG: 'update_config',
  ADD_CONFIG_OPTION: 'add_config_option'
};

/**
 * Risk levels
 */
const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Fix proposal structure
 */
class FixProposal {
  constructor(data) {
    this.changeId = data.changeId || this._generateId();
    this.errorId = data.errorId;
    this.patternHash = data.patternHash || null;
    this.timestamp = data.timestamp || new Date();
    
    this.proposedChange = {
      type: data.proposedChange?.type || 'unknown',
      target: data.proposedChange?.target || '',
      oldValue: data.proposedChange?.oldValue || null,
      newValue: data.proposedChange?.newValue || null,
      rationale: data.proposedChange?.rationale || '',
      codeExample: data.proposedChange?.codeExample || null
    };
    
    this.strategies = {
      primary: data.strategies?.primary || {
        strategy: FixStrategy.ADD_VALIDATION,
        description: '',
        implementation: '',
        riskLevel: RiskLevel.LOW
      },
      alternatives: data.strategies?.alternatives || []
    };
    
    this.confidence = data.confidence || 0;
    
    this.impactAssessment = {
      affectedAgents: data.impactAssessment?.affectedAgents || [],
      affectedSkills: data.impactAssessment?.affectedSkills || [],
      estimatedSideEffects: data.impactAssessment?.estimatedSideEffects || [],
      potentialBreakages: data.impactAssessment?.potentialBreakages || []
    };
    
    this.rollbackPlan = {
      reversible: data.rollbackPlan?.reversible !== false,
      rollbackTime: data.rollbackPlan?.rollbackTime || 10,
      dependencies: data.rollbackPlan?.dependencies || []
    };
    
    this.status = data.status || 'proposed';
  }
  
  _generateId() {
    return `fix-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  toJSON() {
    return {
      changeId: this.changeId,
      errorId: this.errorId,
      patternHash: this.patternHash,
      timestamp: this.timestamp,
      proposedChange: this.proposedChange,
      strategies: this.strategies,
      confidence: this.confidence,
      impactAssessment: this.impactAssessment,
      rollbackPlan: this.rollbackPlan,
      status: this.status
    };
  }
}

/**
 * Base fix generator class
 */
class BaseFixGenerator {
  constructor(name) {
    this.name = name;
  }
  
  /**
   * Generate a fix proposal
   * @abstract
   */
  async generate(rootCauseAnalysis, errorEntry) {
    throw new Error('Must be implemented by subclass');
  }
  
  /**
   * Calculate confidence for this fix
   */
  calculateConfidence(rootCauseAnalysis, factors = {}) {
    let confidence = rootCauseAnalysis.confidence * 0.5;
    
    // Boost for high evidence score
    if (rootCauseAnalysis.rootCause.evidenceScore > 0.8) {
      confidence += 0.2;
    }
    
    // Boost for known pattern
    if (factors.hasKnownFix) {
      confidence += 0.15;
    }
    
    // Boost for low risk
    if (factors.riskLevel === RiskLevel.LOW) {
      confidence += 0.1;
    }
    
    // Penalty for high risk
    if (factors.riskLevel === RiskLevel.HIGH) {
      confidence -= 0.2;
    }
    
    return Math.min(1.0, Math.max(0, confidence));
  }
  
  /**
   * Extract parameter name from error
   */
  extractParameterName(errorEntry) {
    const message = errorEntry.error.message;
    
    // Try various patterns
    const patterns = [
      /parameter ['"]([^'"]+)['"]/i,
      /['"]([^'"]+)['"] is required/i,
      /missing ['"]([^'"]+)['"]/i,
      /undefined.*['"]([^'"]+)['"]/i,
      /Cannot read (?:property |properties of )['"]?([^'"]+)['"]?/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return 'unknown';
  }
}

/**
 * Parameter validation fix generator
 */
class ParameterValidationGenerator extends BaseFixGenerator {
  constructor() {
    super('ParameterValidationGenerator');
  }
  
  async generate(rootCauseAnalysis, errorEntry) {
    const paramName = this.extractParameterName(errorEntry);
    const target = rootCauseAnalysis.affectedComponent.name;
    
    return new FixProposal({
      errorId: errorEntry.errorId,
      proposedChange: {
        type: 'validation_rule',
        target: `${target}.${paramName}`,
        oldValue: null,
        newValue: {
          validate: `(value) => value !== undefined && value !== null`,
          errorMessage: `${paramName} is required`
        },
        rationale: 'Add validation to prevent undefined/null parameter',
        codeExample: `
if (!params.${paramName}) {
  throw new Error('${paramName} is required');
}`.trim()
      },
      strategies: {
        primary: {
          strategy: FixStrategy.ADD_VALIDATION,
          description: 'Add parameter validation before usage',
          implementation: 'Add validation check at function entry',
          riskLevel: RiskLevel.LOW
        },
        alternatives: [
          {
            strategy: FixStrategy.SET_DEFAULT_VALUE,
            description: 'Provide a sensible default value',
            riskLevel: RiskLevel.LOW
          }
        ]
      },
      confidence: this.calculateConfidence(rootCauseAnalysis, { riskLevel: RiskLevel.LOW }),
      impactAssessment: {
        affectedAgents: [target],
        affectedSkills: errorEntry.skillName ? [errorEntry.skillName] : [],
        estimatedSideEffects: [],
        potentialBreakages: []
      },
      rollbackPlan: {
        reversible: true,
        rollbackTime: 5,
        dependencies: []
      }
    });
  }
}

/**
 * Default value fix generator
 */
class DefaultValueGenerator extends BaseFixGenerator {
  constructor() {
    super('DefaultValueGenerator');
  }
  
  async generate(rootCauseAnalysis, errorEntry) {
    const paramName = this.extractParameterName(errorEntry);
    const target = rootCauseAnalysis.affectedComponent.name;
    const defaultValue = this._inferDefaultValue(paramName, errorEntry);
    
    return new FixProposal({
      errorId: errorEntry.errorId,
      proposedChange: {
        type: 'default_value',
        target: `${target}.${paramName}`,
        oldValue: undefined,
        newValue: defaultValue,
        rationale: 'Set default value for optional parameter',
        codeExample: `
const ${paramName} = params.${paramName} ?? ${JSON.stringify(defaultValue)};`.trim()
      },
      strategies: {
        primary: {
          strategy: FixStrategy.SET_DEFAULT_VALUE,
          description: 'Provide default value when parameter is missing',
          implementation: 'Use nullish coalescing or default parameter',
          riskLevel: RiskLevel.LOW
        },
        alternatives: []
      },
      confidence: this.calculateConfidence(rootCauseAnalysis, { riskLevel: RiskLevel.LOW }) * 0.9,
      impactAssessment: {
        affectedAgents: [target],
        affectedSkills: errorEntry.skillName ? [errorEntry.skillName] : [],
        estimatedSideEffects: ['Default value may not match expected behavior'],
        potentialBreakages: []
      },
      rollbackPlan: {
        reversible: true,
        rollbackTime: 5,
        dependencies: []
      }
    });
  }
  
  _inferDefaultValue(paramName, errorEntry) {
    const name = paramName.toLowerCase();
    
    // Common defaults based on name patterns
    if (name.includes('timeout')) return 30000;
    if (name.includes('limit') || name.includes('max')) return 100;
    if (name.includes('retry') || name.includes('retries')) return 3;
    if (name.includes('enabled') || name.includes('active')) return false;
    if (name.includes('options') || name.includes('config')) return {};
    if (name.includes('list') || name.includes('items') || name.includes('array')) return [];
    if (name.includes('name') || name.includes('id')) return '';
    if (name.includes('count') || name.includes('number')) return 0;
    
    return null;
  }
}

/**
 * Type validation fix generator
 */
class TypeValidationGenerator extends BaseFixGenerator {
  constructor() {
    super('TypeValidationGenerator');
  }
  
  async generate(rootCauseAnalysis, errorEntry) {
    const paramName = this.extractParameterName(errorEntry);
    const target = rootCauseAnalysis.affectedComponent.name;
    const expectedType = this._inferExpectedType(errorEntry);
    
    return new FixProposal({
      errorId: errorEntry.errorId,
      proposedChange: {
        type: 'type_check',
        target: `${target}.${paramName}`,
        oldValue: null,
        newValue: {
          expectedType,
          validate: `(value) => typeof value === '${expectedType}'`
        },
        rationale: `Add type check to ensure ${paramName} is ${expectedType}`,
        codeExample: `
if (typeof params.${paramName} !== '${expectedType}') {
  throw new TypeError(\`${paramName} must be a ${expectedType}\`);
}`.trim()
      },
      strategies: {
        primary: {
          strategy: FixStrategy.ADD_VALIDATION,
          description: 'Add type validation before usage',
          implementation: 'Check typeof before accessing properties',
          riskLevel: RiskLevel.LOW
        },
        alternatives: [
          {
            strategy: FixStrategy.ADD_ERROR_HANDLING,
            description: 'Wrap in try-catch with type conversion',
            riskLevel: RiskLevel.MEDIUM
          }
        ]
      },
      confidence: this.calculateConfidence(rootCauseAnalysis, { riskLevel: RiskLevel.LOW }),
      impactAssessment: {
        affectedAgents: [target],
        affectedSkills: errorEntry.skillName ? [errorEntry.skillName] : [],
        estimatedSideEffects: [],
        potentialBreakages: []
      },
      rollbackPlan: {
        reversible: true,
        rollbackTime: 5,
        dependencies: []
      }
    });
  }
  
  _inferExpectedType(errorEntry) {
    const message = errorEntry.error.message.toLowerCase();
    
    if (message.includes('is not a function')) return 'function';
    if (message.includes('is not iterable')) return 'array';
    if (message.includes('tostring') || message.includes('string')) return 'string';
    if (message.includes('tofixed') || message.includes('number')) return 'number';
    if (message.includes('boolean')) return 'boolean';
    
    return 'object';
  }
}

/**
 * Condition fix generator
 */
class ConditionFixGenerator extends BaseFixGenerator {
  constructor() {
    super('ConditionFixGenerator');
  }
  
  async generate(rootCauseAnalysis, errorEntry) {
    const target = rootCauseAnalysis.affectedComponent.name;
    
    return new FixProposal({
      errorId: errorEntry.errorId,
      proposedChange: {
        type: 'condition_check',
        target,
        oldValue: null,
        newValue: {
          condition: 'Add guard condition',
          action: 'Early return or throw'
        },
        rationale: 'Add condition check to prevent logic failure',
        codeExample: `
// Add guard condition
if (!preconditionMet) {
  return { success: false, reason: 'Precondition not met' };
}`.trim()
      },
      strategies: {
        primary: {
          strategy: FixStrategy.ADD_CONDITION,
          description: 'Add guard condition before critical operation',
          implementation: 'Check state/input before proceeding',
          riskLevel: RiskLevel.MEDIUM
        },
        alternatives: [
          {
            strategy: FixStrategy.ADD_ERROR_HANDLING,
            description: 'Wrap in try-catch with recovery logic',
            riskLevel: RiskLevel.MEDIUM
          }
        ]
      },
      confidence: this.calculateConfidence(rootCauseAnalysis, { riskLevel: RiskLevel.MEDIUM }) * 0.8,
      impactAssessment: {
        affectedAgents: [target],
        affectedSkills: errorEntry.skillName ? [errorEntry.skillName] : [],
        estimatedSideEffects: ['May change control flow'],
        potentialBreakages: ['Dependent code may expect different behavior']
      },
      rollbackPlan: {
        reversible: true,
        rollbackTime: 10,
        dependencies: []
      }
    });
  }
}

/**
 * Error handling fix generator
 */
class ErrorHandlingGenerator extends BaseFixGenerator {
  constructor() {
    super('ErrorHandlingGenerator');
  }
  
  async generate(rootCauseAnalysis, errorEntry) {
    const target = rootCauseAnalysis.affectedComponent.name;
    
    return new FixProposal({
      errorId: errorEntry.errorId,
      proposedChange: {
        type: 'error_handling',
        target,
        oldValue: null,
        newValue: {
          tryBlock: 'Wrap risky operation',
          catchBlock: 'Handle error gracefully',
          finallyBlock: 'Cleanup if needed'
        },
        rationale: 'Add try-catch to handle potential errors gracefully',
        codeExample: `
try {
  // Risky operation
  result = await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error.message);
  // Handle gracefully or rethrow with context
  throw new Error(\`Operation failed: \${error.message}\`);
}`.trim()
      },
      strategies: {
        primary: {
          strategy: FixStrategy.ADD_ERROR_HANDLING,
          description: 'Wrap operation in try-catch block',
          implementation: 'Add error handling with recovery',
          riskLevel: RiskLevel.LOW
        },
        alternatives: []
      },
      confidence: this.calculateConfidence(rootCauseAnalysis, { riskLevel: RiskLevel.LOW }) * 0.85,
      impactAssessment: {
        affectedAgents: [target],
        affectedSkills: errorEntry.skillName ? [errorEntry.skillName] : [],
        estimatedSideEffects: ['May mask underlying issues'],
        potentialBreakages: []
      },
      rollbackPlan: {
        reversible: true,
        rollbackTime: 5,
        dependencies: []
      }
    });
  }
}

/**
 * Configuration fix generator
 */
class ConfigurationFixGenerator extends BaseFixGenerator {
  constructor() {
    super('ConfigurationFixGenerator');
  }
  
  async generate(rootCauseAnalysis, errorEntry) {
    const target = rootCauseAnalysis.affectedComponent.name;
    const configKey = this._extractConfigKey(errorEntry);
    
    return new FixProposal({
      errorId: errorEntry.errorId,
      proposedChange: {
        type: 'config_update',
        target: `config.${configKey}`,
        oldValue: null,
        newValue: this._inferConfigValue(configKey),
        rationale: 'Add missing configuration value',
        codeExample: `
// Add to configuration
{
  "${configKey}": ${JSON.stringify(this._inferConfigValue(configKey))}
}`.trim()
      },
      strategies: {
        primary: {
          strategy: FixStrategy.ADD_CONFIG_OPTION,
          description: 'Add missing configuration option',
          implementation: 'Update configuration file or defaults',
          riskLevel: RiskLevel.LOW
        },
        alternatives: [
          {
            strategy: FixStrategy.UPDATE_CONFIG,
            description: 'Update existing configuration',
            riskLevel: RiskLevel.LOW
          }
        ]
      },
      confidence: this.calculateConfidence(rootCauseAnalysis, { riskLevel: RiskLevel.LOW }),
      impactAssessment: {
        affectedAgents: [target],
        affectedSkills: [],
        estimatedSideEffects: [],
        potentialBreakages: []
      },
      rollbackPlan: {
        reversible: true,
        rollbackTime: 5,
        dependencies: []
      }
    });
  }
  
  _extractConfigKey(errorEntry) {
    const message = errorEntry.error.message;
    const match = message.match(/config[.\[]+'?([^'"]+)'?/i) ||
                  message.match(/['"]([^'"]+)['"] is not configured/i);
    return match ? match[1] : 'unknown';
  }
  
  _inferConfigValue(configKey) {
    const key = configKey.toLowerCase();
    
    if (key.includes('timeout')) return 30000;
    if (key.includes('url') || key.includes('endpoint')) return 'http://localhost:3000';
    if (key.includes('enabled')) return true;
    if (key.includes('path')) return './';
    if (key.includes('limit')) return 100;
    
    return '';
  }
}

/**
 * Default fix generator for unknown errors
 */
class DefaultFixGenerator extends BaseFixGenerator {
  constructor() {
    super('DefaultFixGenerator');
  }
  
  async generate(rootCauseAnalysis, errorEntry) {
    const target = rootCauseAnalysis.affectedComponent.name;
    
    return new FixProposal({
      errorId: errorEntry.errorId,
      proposedChange: {
        type: 'generic_fix',
        target,
        oldValue: null,
        newValue: {
          suggestion: 'Review and fix manually',
          errorContext: errorEntry.error.message
        },
        rationale: 'Generic fix suggestion - requires manual review',
        codeExample: `
// Manual review required
// Error: ${errorEntry.error.message}
// Location: ${target}`.trim()
      },
      strategies: {
        primary: {
          strategy: FixStrategy.IMPROVE_LOGGING,
          description: 'Add logging to help diagnose issue',
          implementation: 'Add debug logging around failure point',
          riskLevel: RiskLevel.LOW
        },
        alternatives: [
          {
            strategy: FixStrategy.ADD_ERROR_HANDLING,
            description: 'Add error handling to prevent crash',
            riskLevel: RiskLevel.LOW
          }
        ]
      },
      confidence: 0.3, // Low confidence for generic fixes
      impactAssessment: {
        affectedAgents: [target],
        affectedSkills: errorEntry.skillName ? [errorEntry.skillName] : [],
        estimatedSideEffects: ['May not fully resolve issue'],
        potentialBreakages: []
      },
      rollbackPlan: {
        reversible: true,
        rollbackTime: 5,
        dependencies: []
      }
    });
  }
}

/**
 * Main Fix Generator
 */
class FixGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      minConfidence: options.minConfidence || 0.3,
      maxProposals: options.maxProposals || 3,
      ...options
    };
    
    // Initialize generators by category
    this.generators = new Map([
      [ErrorCategory.MISSING_PARAMETER, [
        new ParameterValidationGenerator(),
        new DefaultValueGenerator()
      ]],
      [ErrorCategory.INVALID_PARAMETER, [
        new ParameterValidationGenerator(),
        new TypeValidationGenerator()
      ]],
      [ErrorCategory.TYPE_MISMATCH, [
        new TypeValidationGenerator(),
        new ParameterValidationGenerator()
      ]],
      [ErrorCategory.LOGIC_FAILURE, [
        new ConditionFixGenerator(),
        new ErrorHandlingGenerator()
      ]],
      [ErrorCategory.CONDITION_FAILED, [
        new ConditionFixGenerator(),
        new ErrorHandlingGenerator()
      ]],
      [ErrorCategory.CONFIG_MISSING, [
        new ConfigurationFixGenerator()
      ]],
      [ErrorCategory.CONFIG_INVALID, [
        new ConfigurationFixGenerator()
      ]],
      [ErrorCategory.SKILL_FAILURE, [
        new ErrorHandlingGenerator()
      ]],
      [ErrorCategory.TIMEOUT, [
        new ConfigurationFixGenerator(),
        new ErrorHandlingGenerator()
      ]]
    ]);
    
    // Default generator for unknown categories
    this.defaultGenerator = new DefaultFixGenerator();
    
    // Generated proposals
    this.proposals = new Map();
    
    // Statistics
    this.stats = {
      totalGenerated: 0,
      byStrategy: {},
      averageConfidence: 0
    };
  }
  
  /**
   * Generate fix proposals for an error
   */
  async generateFixes(rootCauseAnalysis, pattern, errorEntry) {
    const category = rootCauseAnalysis.rootCause.category;
    const generators = this.generators.get(category) || [this.defaultGenerator];
    
    const proposals = [];
    
    for (const generator of generators) {
      try {
        const proposal = await generator.generate(rootCauseAnalysis, errorEntry);
        
        if (proposal.confidence >= this.options.minConfidence) {
          proposal.patternHash = pattern?.hash || null;
          proposals.push(proposal);
          
          // Store proposal
          this.proposals.set(proposal.changeId, proposal);
          
          // Update statistics
          this._updateStats(proposal);
        }
      } catch (error) {
        // Generator failed, continue with others
        console.error(`Generator ${generator.name} failed:`, error.message);
      }
    }
    
    // Sort by confidence
    proposals.sort((a, b) => b.confidence - a.confidence);
    
    // Limit proposals
    const limitedProposals = proposals.slice(0, this.options.maxProposals);
    
    // Emit event
    this.emit('fixes:generated', {
      errorId: errorEntry.errorId,
      count: limitedProposals.length,
      proposals: limitedProposals
    });
    
    return limitedProposals;
  }
  
  /**
   * Get a proposal by ID
   */
  getProposal(changeId) {
    return this.proposals.get(changeId);
  }
  
  /**
   * Update proposal status
   */
  updateProposalStatus(changeId, status) {
    const proposal = this.proposals.get(changeId);
    if (!proposal) return false;
    
    proposal.status = status;
    this.emit('proposal:status-changed', { changeId, status });
    return true;
  }
  
  /**
   * Get all proposals for an error
   */
  getProposalsForError(errorId) {
    const proposals = [];
    for (const [, proposal] of this.proposals) {
      if (proposal.errorId === errorId) {
        proposals.push(proposal);
      }
    }
    return proposals;
  }
  
  /**
   * Update statistics
   */
  _updateStats(proposal) {
    this.stats.totalGenerated++;
    
    const strategy = proposal.strategies.primary.strategy;
    this.stats.byStrategy[strategy] = (this.stats.byStrategy[strategy] || 0) + 1;
    
    // Update average confidence
    const total = this.stats.totalGenerated;
    this.stats.averageConfidence = 
      (this.stats.averageConfidence * (total - 1) + proposal.confidence) / total;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalProposals: this.proposals.size
    };
  }
  
  /**
   * Register custom generator
   */
  registerGenerator(category, generator) {
    if (!this.generators.has(category)) {
      this.generators.set(category, []);
    }
    this.generators.get(category).push(generator);
  }
  
  /**
   * Clear all proposals
   */
  clear() {
    this.proposals.clear();
    this.stats = {
      totalGenerated: 0,
      byStrategy: {},
      averageConfidence: 0
    };
  }
}

export {
  FixGenerator,
  FixProposal,
  FixStrategy,
  RiskLevel,
  // Export generators for extension
  BaseFixGenerator,
  ParameterValidationGenerator,
  DefaultValueGenerator,
  TypeValidationGenerator,
  ConditionFixGenerator,
  ErrorHandlingGenerator,
  ConfigurationFixGenerator,
  DefaultFixGenerator
};
