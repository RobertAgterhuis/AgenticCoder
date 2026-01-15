# Analysis Engine Specification

**Version**: 1.0  
**Date**: January 13, 2026

---

## Overview

De Analysis Engine analyseert vastgestelde fouten, detecteert root causes, herkent patronen, en bepaalt vertrouwensscores.

---

## Root Cause Detection

```typescript
interface RootCauseAnalysis {
  errorId: string;
  confidence: number;
  
  rootCause: {
    category: ErrorCategory;
    hypothesis: string;
    explanation: string;
    evidenceScore: number;
  };
  
  contributingFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  
  affectedComponent: {
    type: 'agent' | 'skill' | 'parameter' | 'validation' | 'dependency';
    name: string;
    location?: string;
  };
}

class RootCauseDetector {
  async analyze(error: ErrorLogEntry): Promise<RootCauseAnalysis> {
    const category = error.error.type;
    const message = error.error.message.toLowerCase();
    
    let rootCause = this.analyzeByErrorType(category, message);
    const contextClues = this.extractContextClues(error.context);
    rootCause.contributingFactors.push(...contextClues);
    
    const similarErrors = await this.findSimilarErrors(error);
    if (similarErrors.length > 0) {
      rootCause.confidence += 0.2;
    }
    
    return rootCause;
  }
  
  private analyzeByErrorType(type: string, message: string): RootCauseAnalysis {
    if (type === 'TypeError' && message.includes('undefined')) {
      return {
        errorId: '',
        confidence: 0.8,
        rootCause: {
          category: ErrorCategory.TYPE_MISMATCH,
          hypothesis: 'Variable undefined or null',
          explanation: 'Trying to access property on undefined/null value',
          evidenceScore: 0.8
        },
        contributingFactors: [
          {
            factor: 'missing_validation',
            impact: 0.9,
            description: 'Input parameter not validated before use'
          }
        ],
        affectedComponent: {
          type: 'skill',
          name: 'unknown'
        }
      };
    }
    
    return this.createDefaultAnalysis();
  }
  
  private extractContextClues(context: any): any[] {
    const clues = [];
    
    if (!context.input) {
      clues.push({
        factor: 'missing_input',
        impact: 0.8,
        description: 'No input provided'
      });
    }
    
    return clues;
  }
  
  private async findSimilarErrors(error: ErrorLogEntry): Promise<ErrorLogEntry[]> {
    return [];
  }
}
```

---

## Pattern Recognition

```typescript
interface ErrorPattern {
  patternId: string;
  hash: string;
  
  characteristics: {
    errorType: string;
    errorMessage: string;
    agentName: string;
    skillName?: string;
    contextHash: string;
  };
  
  occurrences: {
    total: number;
    recent: number;
    frequency: number;
  };
  
  relatedPatterns: Array<{
    patternId: string;
    similarity: number;
    cause: string;
  }>;
  
  knownFixes: Array<{
    fixId: string;
    effectiveness: number;
    successRate: number;
  }>;
}

class PatternRecognizer {
  private patterns: Map<string, ErrorPattern> = new Map();
  
  async recognizePattern(error: ErrorLogEntry): Promise<ErrorPattern | null> {
    const hash = this.generateErrorHash(error);
    
    let pattern = this.patterns.get(hash);
    if (!pattern) {
      pattern = this.createNewPattern(error, hash);
    } else {
      pattern.occurrences.total++;
      pattern.occurrences.recent++;
      this.patterns.set(hash, pattern);
    }
    
    pattern.relatedPatterns = await this.findRelatedPatterns(pattern);
    pattern.knownFixes = await this.findKnownFixes(pattern);
    
    return pattern;
  }
  
  private generateErrorHash(error: ErrorLogEntry): string {
    const key = `${error.error.type}:${error.error.message}:${error.agentName}`;
    return hashString(key);
  }
  
  private createNewPattern(error: ErrorLogEntry, hash: string): ErrorPattern {
    return {
      patternId: generateId(),
      hash,
      characteristics: {
        errorType: error.error.type,
        errorMessage: error.error.message,
        agentName: error.agentName,
        skillName: error.skillName,
        contextHash: hashString(JSON.stringify(error.context))
      },
      occurrences: {
        total: 1,
        recent: 1,
        frequency: 1
      },
      relatedPatterns: [],
      knownFixes: []
    };
  }
  
  private async findRelatedPatterns(pattern: ErrorPattern): Promise<any[]> {
    const related = [];
    for (const [_, existingPattern] of this.patterns) {
      const similarity = this.calculateSimilarity(pattern, existingPattern);
      if (similarity > 0.6) {
        related.push({
          patternId: existingPattern.patternId,
          similarity,
          cause: 'Similar error signature'
        });
      }
    }
    return related;
  }
  
  private async findKnownFixes(pattern: ErrorPattern): Promise<any[]> {
    return [];
  }
  
  private calculateSimilarity(p1: ErrorPattern, p2: ErrorPattern): number {
    return 0.5;
  }
}
```

---

## Confidence Scoring

```typescript
interface ConfidenceScore {
  changeId: string;
  
  scores: {
    analysisPrecision: number;
    fixRelevance: number;
    validationCoverage: number;
    similarityMatch: number;
    historicalSuccess: number;
  };
  
  weightedScore: number;
  
  factors: Array<{
    name: string;
    weight: number;
    score: number;
    impact: string;
  }>;
  
  recommendation: 'auto_apply' | 'manual_review' | 'reject';
}

class ConfidenceScorer {
  calculateConfidence(
    rootCause: RootCauseAnalysis,
    pattern: ErrorPattern,
    proposedFix: FixProposal,
    validationResult: ValidationResult
  ): ConfidenceScore {
    
    const scores = {
      analysisPrecision: rootCause.confidence,
      fixRelevance: this.calculateFixRelevance(rootCause, proposedFix),
      validationCoverage: this.calculateValidationCoverage(validationResult),
      similarityMatch: this.calculateSimilarityMatch(pattern, proposedFix),
      historicalSuccess: this.calculateHistoricalSuccess(pattern, proposedFix)
    };
    
    const weights = {
      analysisPrecision: 0.25,
      fixRelevance: 0.25,
      validationCoverage: 0.25,
      similarityMatch: 0.15,
      historicalSuccess: 0.10
    };
    
    const weighted = Object.entries(scores).reduce((sum, [key, score]) => {
      return sum + (score * weights[key as keyof typeof weights]);
    }, 0);
    
    let recommendation: 'auto_apply' | 'manual_review' | 'reject';
    if (weighted >= 0.8) {
      recommendation = 'auto_apply';
    } else if (weighted >= 0.5) {
      recommendation = 'manual_review';
    } else {
      recommendation = 'reject';
    }
    
    return {
      changeId: proposedFix.changeId,
      scores,
      weightedScore: weighted,
      factors: this.buildFactorsList(scores, weights),
      recommendation
    };
  }
  
  private calculateFixRelevance(
    rootCause: RootCauseAnalysis,
    fix: FixProposal
  ): number {
    if (fix.proposedChange.target === rootCause.affectedComponent.name) {
      return Math.min(1, rootCause.confidence + 0.2);
    }
    return rootCause.confidence * 0.5;
  }
  
  private calculateValidationCoverage(result: ValidationResult): number {
    const checksCount = Object.values(result.checks).length;
    const passedCount = Object.values(result.checks)
      .filter(check => check.passed).length;
    return passedCount / checksCount;
  }
  
  private calculateSimilarityMatch(pattern: ErrorPattern, fix: FixProposal): number {
    if (pattern.knownFixes.length === 0) return 0.5;
    
    const matches = pattern.knownFixes.filter(known => 
      known.fixId === fix.changeId
    );
    
    if (matches.length > 0) {
      return matches[0].effectiveness;
    }
    
    return 0.6;
  }
  
  private calculateHistoricalSuccess(pattern: ErrorPattern, fix: FixProposal): number {
    if (pattern.knownFixes.length === 0) return 0.5;
    
    const avgSuccess = pattern.knownFixes.reduce((sum, fix) => 
      sum + fix.successRate, 0
    ) / pattern.knownFixes.length;
    
    return avgSuccess;
  }
  
  private buildFactorsList(scores: any, weights: any): any[] {
    return Object.entries(scores).map(([name, score]) => ({
      name,
      weight: weights[name],
      score,
      impact: score > 0.8 ? 'positive' : score < 0.5 ? 'negative' : 'neutral'
    }));
  }
}
```

---

## Analysis Pipeline

```typescript
class AnalysisEngine {
  private rootCauseDetector = new RootCauseDetector();
  private patternRecognizer = new PatternRecognizer();
  private confidenceScorer = new ConfidenceScorer();
  
  async analyzeError(error: ErrorLogEntry): Promise<AnalysisResult> {
    const rootCause = await this.rootCauseDetector.analyze(error);
    const pattern = await this.patternRecognizer.recognizePattern(error);
    const recommendations = await this.generateRecommendations(
      rootCause,
      pattern,
      error
    );
    
    return {
      errorId: error.errorId,
      rootCause: rootCause.rootCause,
      recommendations,
      patterns: {
        frequency: error.frequency.previousOccurrences + 1,
        lastOccurrence: error.timestamp,
        relatedErrors: pattern?.relatedPatterns.map(p => p.patternId) || []
      }
    };
  }
  
  private async generateRecommendations(
    rootCause: RootCauseAnalysis,
    pattern: ErrorPattern | null,
    error: ErrorLogEntry
  ): Promise<any[]> {
    const recommendations = [];
    
    recommendations.push({
      fixType: this.mapCategoryToFixType(rootCause.rootCause.category),
      targetComponent: rootCause.affectedComponent.name,
      proposedChange: this.generateFixFromRootCause(rootCause),
      confidence: rootCause.confidence
    });
    
    if (pattern && pattern.knownFixes.length > 0) {
      const bestFix = pattern.knownFixes[0];
      recommendations.push({
        fixType: 'known_fix',
        targetComponent: pattern.characteristics.skillName,
        proposedChange: `Apply known fix ${bestFix.fixId}`,
        confidence: bestFix.effectiveness
      });
    }
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }
  
  private mapCategoryToFixType(category: ErrorCategory): string {
    const map: Record<ErrorCategory, string> = {
      [ErrorCategory.MISSING_PARAMETER]: 'parameter_update',
      [ErrorCategory.TYPE_MISMATCH]: 'type_fix',
      [ErrorCategory.LOGIC_FAILURE]: 'logic_fix'
    };
    return map[category] || 'unknown_fix';
  }
  
  private generateFixFromRootCause(rootCause: RootCauseAnalysis): string {
    return `Fix for ${rootCause.rootCause.category}: ${rootCause.rootCause.explanation}`;
  }
}
```

---

**Version**: 1.0  
**Status**: Ready for Implementation  
**Next Document**: 05_FIX_GENERATION.md
