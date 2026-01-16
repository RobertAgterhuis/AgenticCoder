/**
 * AnalysisEngine - SL-04 Analysis Engine
 * 
 * Analyzes errors, detects root causes, recognizes patterns,
 * and calculates confidence scores.
 * 
 * @implements SelfLearning/04_ANALYSIS_ENGINE.md
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { ErrorCategory, Severity } from './ErrorLogger.js';

/**
 * Root cause analysis result
 */
class RootCauseAnalysis {
  constructor(data) {
    this.errorId = data.errorId;
    this.analysisId = data.analysisId || this._generateId();
    this.timestamp = data.timestamp || new Date();
    this.confidence = data.confidence || 0;
    
    this.rootCause = {
      category: data.rootCause?.category || ErrorCategory.UNKNOWN,
      hypothesis: data.rootCause?.hypothesis || '',
      explanation: data.rootCause?.explanation || '',
      evidenceScore: data.rootCause?.evidenceScore || 0
    };
    
    this.contributingFactors = data.contributingFactors || [];
    
    this.affectedComponent = {
      type: data.affectedComponent?.type || 'unknown',
      name: data.affectedComponent?.name || 'unknown',
      location: data.affectedComponent?.location || null
    };
  }
  
  _generateId() {
    return `ana-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  toJSON() {
    return {
      errorId: this.errorId,
      analysisId: this.analysisId,
      timestamp: this.timestamp,
      confidence: this.confidence,
      rootCause: this.rootCause,
      contributingFactors: this.contributingFactors,
      affectedComponent: this.affectedComponent
    };
  }
}

/**
 * Error pattern for recognition
 */
class ErrorPattern {
  constructor(data) {
    this.patternId = data.patternId || this._generateId();
    this.hash = data.hash;
    
    this.characteristics = {
      errorType: data.characteristics?.errorType || '',
      errorMessage: data.characteristics?.errorMessage || '',
      agentName: data.characteristics?.agentName || '',
      skillName: data.characteristics?.skillName || null,
      category: data.characteristics?.category || ErrorCategory.UNKNOWN,
      contextHash: data.characteristics?.contextHash || ''
    };
    
    this.occurrences = {
      total: data.occurrences?.total || 1,
      recent: data.occurrences?.recent || 1,
      frequency: data.occurrences?.frequency || 1
    };
    
    this.relatedPatterns = data.relatedPatterns || [];
    this.knownFixes = data.knownFixes || [];
    
    this.createdAt = data.createdAt || new Date();
    this.lastSeenAt = data.lastSeenAt || new Date();
  }
  
  _generateId() {
    return `pat-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  toJSON() {
    return {
      patternId: this.patternId,
      hash: this.hash,
      characteristics: this.characteristics,
      occurrences: this.occurrences,
      relatedPatterns: this.relatedPatterns,
      knownFixes: this.knownFixes,
      createdAt: this.createdAt,
      lastSeenAt: this.lastSeenAt
    };
  }
}

/**
 * Root cause detector
 */
class RootCauseDetector {
  constructor() {
    // Known root cause patterns
    this.rootCausePatterns = new Map([
      ['undefined_access', {
        matcher: (error) => 
          error.error.type === 'TypeError' && 
          (error.error.message.includes('undefined') || error.error.message.includes('null')),
        hypothesis: 'Accessing property on undefined/null value',
        explanation: 'Code attempts to access a property or call a method on a value that is undefined or null',
        evidenceScore: 0.85,
        category: ErrorCategory.TYPE_MISMATCH,
        componentType: 'parameter'
      }],
      ['missing_parameter', {
        matcher: (error) => 
          error.error.message.includes('required') || 
          error.error.message.includes('missing'),
        hypothesis: 'Required parameter not provided',
        explanation: 'A required parameter was not passed to a function or method',
        evidenceScore: 0.9,
        category: ErrorCategory.MISSING_PARAMETER,
        componentType: 'parameter'
      }],
      ['type_error', {
        matcher: (error) => 
          error.error.type === 'TypeError' && 
          !error.error.message.includes('undefined'),
        hypothesis: 'Type mismatch in operation',
        explanation: 'An operation was attempted on a value of incompatible type',
        evidenceScore: 0.8,
        category: ErrorCategory.TYPE_MISMATCH,
        componentType: 'validation'
      }],
      ['skill_not_found', {
        matcher: (error) => 
          error.error.message.includes('skill') && 
          error.error.message.includes('not found'),
        hypothesis: 'Referenced skill does not exist',
        explanation: 'Code references a skill that is not registered or available',
        evidenceScore: 0.95,
        category: ErrorCategory.SKILL_NOT_FOUND,
        componentType: 'skill'
      }],
      ['timeout', {
        matcher: (error) => 
          error.error.message.includes('timeout') || 
          error.error.message.includes('timed out'),
        hypothesis: 'Operation exceeded time limit',
        explanation: 'An async operation did not complete within the allowed time',
        evidenceScore: 0.85,
        category: ErrorCategory.TIMEOUT,
        componentType: 'dependency'
      }],
      ['config_missing', {
        matcher: (error) => 
          error.error.message.includes('config') && 
          (error.error.message.includes('missing') || error.error.message.includes('not found')),
        hypothesis: 'Required configuration not provided',
        explanation: 'A required configuration value is missing',
        evidenceScore: 0.9,
        category: ErrorCategory.CONFIG_MISSING,
        componentType: 'agent'
      }],
      ['validation_failed', {
        matcher: (error) => 
          error.error.message.includes('validation') && 
          error.error.message.includes('failed'),
        hypothesis: 'Input or output validation failure',
        explanation: 'Data did not pass validation rules',
        evidenceScore: 0.85,
        category: ErrorCategory.CONDITION_FAILED,
        componentType: 'validation'
      }],
      ['dependency_error', {
        matcher: (error) => 
          error.error.message.includes('dependency') || 
          error.error.message.includes('import') ||
          error.error.message.includes("Cannot find module"),
        hypothesis: 'Dependency resolution failure',
        explanation: 'A required dependency could not be resolved or loaded',
        evidenceScore: 0.9,
        category: ErrorCategory.DEPENDENCY_NOT_FOUND,
        componentType: 'dependency'
      }]
    ]);
  }
  
  /**
   * Analyze an error to find root cause
   */
  async analyze(errorEntry) {
    let bestMatch = null;
    let bestScore = 0;
    
    // Try each root cause pattern
    for (const [name, pattern] of this.rootCausePatterns) {
      try {
        if (pattern.matcher(errorEntry)) {
          const score = pattern.evidenceScore;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { name, pattern };
          }
        }
      } catch (e) {
        // Matcher failed, continue
      }
    }
    
    // Create analysis
    const analysis = new RootCauseAnalysis({
      errorId: errorEntry.errorId,
      confidence: bestMatch ? bestMatch.pattern.evidenceScore : 0.3,
      rootCause: bestMatch ? {
        category: bestMatch.pattern.category,
        hypothesis: bestMatch.pattern.hypothesis,
        explanation: bestMatch.pattern.explanation,
        evidenceScore: bestMatch.pattern.evidenceScore
      } : {
        category: errorEntry.category || ErrorCategory.UNKNOWN,
        hypothesis: 'Unknown root cause',
        explanation: 'Could not determine specific root cause',
        evidenceScore: 0.3
      },
      affectedComponent: {
        type: bestMatch?.pattern.componentType || 'unknown',
        name: errorEntry.skillName || errorEntry.agentName,
        location: this._extractLocation(errorEntry)
      }
    });
    
    // Add contributing factors
    analysis.contributingFactors = this._extractContributingFactors(errorEntry);
    
    return analysis;
  }
  
  /**
   * Extract location from error stack
   */
  _extractLocation(errorEntry) {
    if (!errorEntry.error.stack) return null;
    
    const match = errorEntry.error.stack.match(/at\s+(?:\S+\s+)?\(?([^:]+):(\d+):(\d+)\)?/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
    return null;
  }
  
  /**
   * Extract contributing factors from context
   */
  _extractContributingFactors(errorEntry) {
    const factors = [];
    
    // Check input
    if (!errorEntry.context.input) {
      factors.push({
        factor: 'missing_input',
        impact: 0.8,
        description: 'No input data was provided'
      });
    }
    
    // Check configuration
    if (!errorEntry.context.config || Object.keys(errorEntry.context.config).length === 0) {
      factors.push({
        factor: 'missing_config',
        impact: 0.5,
        description: 'No configuration context available'
      });
    }
    
    // Check state
    if (!errorEntry.context.state || Object.keys(errorEntry.context.state).length === 0) {
      factors.push({
        factor: 'missing_state',
        impact: 0.4,
        description: 'No state context available'
      });
    }
    
    // Check frequency
    if (errorEntry.frequency?.previousOccurrences > 0) {
      factors.push({
        factor: 'recurring_error',
        impact: 0.7,
        description: `This error has occurred ${errorEntry.frequency.previousOccurrences} times before`
      });
    }
    
    return factors;
  }
}

/**
 * Pattern recognizer
 */
class PatternRecognizer {
  constructor() {
    this.patterns = new Map();
  }
  
  /**
   * Recognize or create pattern for error
   */
  async recognize(errorEntry) {
    const hash = this._generateHash(errorEntry);
    
    let pattern = this.patterns.get(hash);
    if (!pattern) {
      pattern = new ErrorPattern({
        hash,
        characteristics: {
          errorType: errorEntry.error.type,
          errorMessage: this._normalizeMessage(errorEntry.error.message),
          agentName: errorEntry.agentName,
          skillName: errorEntry.skillName,
          category: errorEntry.category,
          contextHash: this._hashContext(errorEntry.context)
        }
      });
      this.patterns.set(hash, pattern);
    } else {
      // Update existing pattern
      pattern.occurrences.total++;
      pattern.occurrences.recent++;
      pattern.lastSeenAt = new Date();
    }
    
    // Find related patterns
    pattern.relatedPatterns = this._findRelatedPatterns(pattern);
    
    return pattern;
  }
  
  /**
   * Generate hash for error
   */
  _generateHash(errorEntry) {
    const key = `${errorEntry.error.type}:${this._normalizeMessage(errorEntry.error.message)}:${errorEntry.agentName}`;
    return crypto.createHash('md5').update(key).digest('hex').substring(0, 16);
  }
  
  /**
   * Normalize error message (remove specific values)
   */
  _normalizeMessage(message) {
    if (!message) return '';
    return message
      .replace(/\d+/g, 'N')
      .replace(/'[^']*'/g, "'X'")
      .replace(/"[^"]*"/g, '"X"')
      .replace(/0x[0-9a-fA-F]+/g, '0xHEX')
      .substring(0, 150);
  }
  
  /**
   * Hash context for comparison
   */
  _hashContext(context) {
    const keys = Object.keys(context || {}).sort();
    return crypto.createHash('md5').update(keys.join(':')).digest('hex').substring(0, 8);
  }
  
  /**
   * Find patterns related to given pattern
   */
  _findRelatedPatterns(pattern) {
    const related = [];
    
    for (const [hash, otherPattern] of this.patterns) {
      if (hash === pattern.hash) continue;
      
      const similarity = this._calculateSimilarity(pattern, otherPattern);
      if (similarity > 0.5) {
        related.push({
          patternId: otherPattern.patternId,
          similarity,
          cause: this._describeSimilarity(pattern, otherPattern)
        });
      }
    }
    
    return related.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }
  
  /**
   * Calculate similarity between patterns
   */
  _calculateSimilarity(p1, p2) {
    let score = 0;
    let weights = 0;
    
    // Same error type
    if (p1.characteristics.errorType === p2.characteristics.errorType) {
      score += 0.3;
    }
    weights += 0.3;
    
    // Same category
    if (p1.characteristics.category === p2.characteristics.category) {
      score += 0.3;
    }
    weights += 0.3;
    
    // Same agent
    if (p1.characteristics.agentName === p2.characteristics.agentName) {
      score += 0.2;
    }
    weights += 0.2;
    
    // Same skill
    if (p1.characteristics.skillName && p1.characteristics.skillName === p2.characteristics.skillName) {
      score += 0.2;
    }
    weights += 0.2;
    
    return score / weights;
  }
  
  /**
   * Describe why patterns are similar
   */
  _describeSimilarity(p1, p2) {
    const reasons = [];
    
    if (p1.characteristics.errorType === p2.characteristics.errorType) {
      reasons.push('Same error type');
    }
    if (p1.characteristics.category === p2.characteristics.category) {
      reasons.push('Same category');
    }
    if (p1.characteristics.agentName === p2.characteristics.agentName) {
      reasons.push('Same agent');
    }
    
    return reasons.join(', ') || 'Similar signature';
  }
  
  /**
   * Register a known fix for a pattern
   */
  registerFix(patternHash, fixId, effectiveness) {
    const pattern = this.patterns.get(patternHash);
    if (!pattern) return false;
    
    // Check if fix already registered
    const existingFix = pattern.knownFixes.find(f => f.fixId === fixId);
    if (existingFix) {
      // Update effectiveness
      existingFix.successRate = (existingFix.successRate + effectiveness) / 2;
      existingFix.applications++;
    } else {
      pattern.knownFixes.push({
        fixId,
        effectiveness,
        successRate: effectiveness,
        applications: 1
      });
    }
    
    // Sort by effectiveness
    pattern.knownFixes.sort((a, b) => b.effectiveness - a.effectiveness);
    
    return true;
  }
  
  /**
   * Get all patterns
   */
  getPatterns() {
    return Array.from(this.patterns.values());
  }
  
  /**
   * Get pattern by hash
   */
  getPattern(hash) {
    return this.patterns.get(hash);
  }
}

/**
 * Main Analysis Engine
 */
class AnalysisEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      minConfidenceForFix: options.minConfidenceForFix || 0.5,
      ...options
    };
    
    this.rootCauseDetector = new RootCauseDetector();
    this.patternRecognizer = new PatternRecognizer();
    
    // Analysis history
    this.analyses = new Map();
    
    // Statistics
    this.stats = {
      totalAnalyzed: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      patternsRecognized: 0
    };
  }
  
  /**
   * Analyze an error
   */
  async analyze(errorEntry) {
    const startTime = Date.now();
    
    // Perform root cause analysis
    const rootCauseAnalysis = await this.rootCauseDetector.analyze(errorEntry);
    
    // Recognize pattern
    const pattern = await this.patternRecognizer.recognize(errorEntry);
    
    // Boost confidence if pattern has known fixes
    if (pattern.knownFixes.length > 0) {
      rootCauseAnalysis.confidence = Math.min(1.0, rootCauseAnalysis.confidence + 0.1);
    }
    
    // Create analysis result
    const result = {
      analysis: rootCauseAnalysis,
      pattern,
      analysisTime: Date.now() - startTime,
      suggestFix: rootCauseAnalysis.confidence >= this.options.minConfidenceForFix
    };
    
    // Store analysis
    this.analyses.set(errorEntry.errorId, result);
    
    // Update statistics
    this._updateStats(rootCauseAnalysis);
    
    // Emit events
    this.emit('analysis:complete', result);
    
    if (result.suggestFix) {
      this.emit('analysis:fix-suggested', {
        errorId: errorEntry.errorId,
        confidence: rootCauseAnalysis.confidence,
        pattern
      });
    }
    
    return result;
  }
  
  /**
   * Get analysis for an error
   */
  getAnalysis(errorId) {
    return this.analyses.get(errorId);
  }
  
  /**
   * Update statistics
   */
  _updateStats(analysis) {
    this.stats.totalAnalyzed++;
    
    if (analysis.confidence >= 0.8) {
      this.stats.highConfidence++;
    } else if (analysis.confidence >= 0.5) {
      this.stats.mediumConfidence++;
    } else {
      this.stats.lowConfidence++;
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      patterns: this.patternRecognizer.getPatterns().length,
      analyses: this.analyses.size
    };
  }
  
  /**
   * Register a fix result for learning
   */
  registerFixResult(patternHash, fixId, success) {
    const effectiveness = success ? 1.0 : 0.0;
    this.patternRecognizer.registerFix(patternHash, fixId, effectiveness);
    
    this.emit('fix:result-registered', { patternHash, fixId, success });
  }
  
  /**
   * Get patterns with known fixes
   */
  getPatternsWithFixes() {
    return this.patternRecognizer.getPatterns()
      .filter(p => p.knownFixes.length > 0);
  }
  
  /**
   * Clear analysis history
   */
  clear() {
    this.analyses.clear();
    this.stats = {
      totalAnalyzed: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      patternsRecognized: 0
    };
  }
}

export {
  AnalysisEngine,
  RootCauseDetector,
  PatternRecognizer,
  RootCauseAnalysis,
  ErrorPattern
};
