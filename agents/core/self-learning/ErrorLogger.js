/**
 * ErrorLogger - SL-03 Error Logging System
 * 
 * Captures, categorizes, and stores errors for analysis.
 * Foundation component for the Self-Learning system.
 * 
 * @implements SelfLearning/03_ERROR_LOGGING.md
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

/**
 * Error categories for classification
 */
const ErrorCategory = {
  // Parameter errors
  MISSING_PARAMETER: 'missing_parameter',
  INVALID_PARAMETER: 'invalid_parameter',
  TYPE_MISMATCH: 'type_mismatch',
  FORMAT_INVALID: 'format_invalid',
  
  // Logic errors
  LOGIC_FAILURE: 'logic_failure',
  CONDITION_FAILED: 'condition_failed',
  STATE_INVALID: 'state_invalid',
  SEQUENCE_ERROR: 'sequence_error',
  
  // Skill errors
  SKILL_NOT_FOUND: 'skill_not_found',
  SKILL_TIMEOUT: 'skill_timeout',
  SKILL_FAILURE: 'skill_failure',
  SKILL_OUTPUT_INVALID: 'skill_output_invalid',
  
  // Dependency errors
  DEPENDENCY_NOT_FOUND: 'dependency_not_found',
  DEPENDENCY_TIMEOUT: 'dependency_timeout',
  DEPENDENCY_ERROR: 'dependency_error',
  
  // Configuration errors
  CONFIG_MISSING: 'config_missing',
  CONFIG_INVALID: 'config_invalid',
  CONFIG_CONFLICT: 'config_conflict',
  
  // System errors
  MEMORY_ERROR: 'memory_error',
  TIMEOUT: 'timeout',
  RESOURCE_EXHAUSTED: 'resource_exhausted',
  
  // Unknown
  UNKNOWN: 'unknown'
};

/**
 * Severity levels
 */
const Severity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error log entry structure
 */
class ErrorLogEntry {
  constructor(data) {
    // Identification
    this.errorId = data.errorId || this._generateErrorId();
    this.batchId = data.batchId || null;
    
    // Timing
    this.timestamp = data.timestamp || new Date();
    this.duration = data.duration || null;
    
    // Location
    this.phase = data.phase || 0;
    this.agentName = data.agentName || 'unknown';
    this.skillName = data.skillName || null;
    this.commandName = data.commandName || null;
    
    // Error details
    this.error = {
      type: data.error?.type || data.error?.name || 'Error',
      message: data.error?.message || String(data.error),
      code: data.error?.code || null,
      stack: data.error?.stack || null,
      line: this._extractLineNumber(data.error?.stack)
    };
    
    // Context
    this.context = {
      input: data.context?.input || null,
      expectedOutput: data.context?.expectedOutput || null,
      actualOutput: data.context?.actualOutput || null,
      state: data.context?.state || {},
      config: data.context?.config || {},
      environment: {
        version: data.context?.environment?.version || '2.0.0',
        nodeVersion: process.version,
        timestamp: new Date()
      }
    };
    
    // Frequency & Pattern
    this.frequency = {
      previousOccurrences: data.frequency?.previousOccurrences || 0,
      lastOccurrence: data.frequency?.lastOccurrence || null,
      pattern: data.frequency?.pattern || null
    };
    
    // Resolution
    this.resolved = data.resolved || false;
    this.resolutionId = data.resolutionId || null;
    this.resolutionTime = data.resolutionTime || null;
    
    // Classification
    this.category = data.category || ErrorCategory.UNKNOWN;
    this.severity = data.severity || Severity.MEDIUM;
    this.learnable = data.learnable !== false;
    this.autoFix = data.autoFix || false;
  }
  
  _generateErrorId() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = crypto.randomBytes(4).toString('hex');
    return `err-${dateStr}-${random}`;
  }
  
  _extractLineNumber(stack) {
    if (!stack) return null;
    const match = stack.match(/:(\d+):\d+/);
    return match ? parseInt(match[1], 10) : null;
  }
  
  toJSON() {
    return {
      errorId: this.errorId,
      batchId: this.batchId,
      timestamp: this.timestamp,
      duration: this.duration,
      phase: this.phase,
      agentName: this.agentName,
      skillName: this.skillName,
      commandName: this.commandName,
      error: this.error,
      context: this.context,
      frequency: this.frequency,
      resolved: this.resolved,
      resolutionId: this.resolutionId,
      resolutionTime: this.resolutionTime,
      category: this.category,
      severity: this.severity,
      learnable: this.learnable,
      autoFix: this.autoFix
    };
  }
}

/**
 * Frequency tracker for error patterns
 */
class FrequencyTracker {
  constructor() {
    this.patterns = new Map();
  }
  
  /**
   * Track an error occurrence
   */
  track(errorEntry) {
    const patternKey = this._generatePatternKey(errorEntry);
    
    let tracker = this.patterns.get(patternKey);
    if (!tracker) {
      tracker = {
        errorPattern: patternKey,
        occurrences: 0,
        lastOccurrence: null,
        firstOccurrence: new Date(),
        locations: new Map(),
        errorIds: []
      };
      this.patterns.set(patternKey, tracker);
    }
    
    // Update occurrences
    tracker.occurrences++;
    tracker.lastOccurrence = new Date();
    tracker.errorIds.push(errorEntry.errorId);
    
    // Track location
    const locationKey = `${errorEntry.agentName}:${errorEntry.skillName || 'none'}`;
    const locationCount = tracker.locations.get(locationKey) || 0;
    tracker.locations.set(locationKey, locationCount + 1);
    
    return {
      previousOccurrences: tracker.occurrences - 1,
      lastOccurrence: tracker.lastOccurrence,
      pattern: patternKey,
      isFrequent: this.isFrequent(patternKey),
      isRecurring: this.isRecurring(patternKey),
      severity: this.getSeverity(patternKey)
    };
  }
  
  /**
   * Generate a pattern key for grouping similar errors
   */
  _generatePatternKey(errorEntry) {
    // Normalize error message (remove specific values)
    const normalizedMessage = errorEntry.error.message
      .replace(/\d+/g, 'N')
      .replace(/'[^']*'/g, "'X'")
      .replace(/"[^"]*"/g, '"X"')
      .substring(0, 100);
    
    const key = `${errorEntry.error.type}:${normalizedMessage}:${errorEntry.category}`;
    return crypto.createHash('md5').update(key).digest('hex').substring(0, 12);
  }
  
  /**
   * Check if error is frequent (>3 occurrences)
   */
  isFrequent(patternKey) {
    const tracker = this.patterns.get(patternKey);
    return tracker ? tracker.occurrences > 3 : false;
  }
  
  /**
   * Check if error is recurring (over multiple days)
   */
  isRecurring(patternKey) {
    const tracker = this.patterns.get(patternKey);
    if (!tracker) return false;
    
    const daysSinceFirst = (Date.now() - tracker.firstOccurrence.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceFirst > 1 && tracker.occurrences > 2;
  }
  
  /**
   * Get severity based on frequency
   */
  getSeverity(patternKey) {
    const tracker = this.patterns.get(patternKey);
    if (!tracker) return Severity.LOW;
    
    if (tracker.occurrences > 10) return Severity.CRITICAL;
    if (tracker.occurrences > 5) return Severity.HIGH;
    if (tracker.occurrences > 2) return Severity.MEDIUM;
    return Severity.LOW;
  }
  
  /**
   * Get all tracked patterns
   */
  getPatterns() {
    const patterns = [];
    for (const [key, tracker] of this.patterns) {
      patterns.push({
        patternKey: key,
        occurrences: tracker.occurrences,
        firstOccurrence: tracker.firstOccurrence,
        lastOccurrence: tracker.lastOccurrence,
        locations: Array.from(tracker.locations.entries()).map(([loc, count]) => ({
          location: loc,
          count
        })),
        errorIds: tracker.errorIds
      });
    }
    return patterns.sort((a, b) => b.occurrences - a.occurrences);
  }
  
  /**
   * Clear old patterns (retention policy)
   */
  cleanup(maxAgeDays = 30) {
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;
    
    for (const [key, tracker] of this.patterns) {
      if (tracker.lastOccurrence.getTime() < cutoff) {
        this.patterns.delete(key);
      }
    }
  }
}

/**
 * Main ErrorLogger class
 */
class ErrorLogger extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      storagePath: options.storagePath || './data/errors',
      maxEntriesInMemory: options.maxEntriesInMemory || 1000,
      retentionDays: options.retentionDays || 30,
      autoCategorizate: options.autoCategorizate !== false,
      ...options
    };
    
    // In-memory storage
    this.entries = [];
    this.entriesById = new Map();
    
    // Frequency tracking
    this.frequencyTracker = new FrequencyTracker();
    
    // Batch tracking
    this.currentBatchId = null;
    
    // Statistics
    this.stats = {
      totalCaptured: 0,
      byCategory: {},
      bySeverity: {},
      byAgent: {},
      resolved: 0,
      unresolved: 0
    };
  }
  
  /**
   * Start a new batch (for grouping related errors)
   */
  startBatch(batchId = null) {
    this.currentBatchId = batchId || `batch-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    this.emit('batch:started', { batchId: this.currentBatchId });
    return this.currentBatchId;
  }
  
  /**
   * End the current batch
   */
  endBatch() {
    const batchId = this.currentBatchId;
    this.currentBatchId = null;
    this.emit('batch:ended', { batchId });
    return batchId;
  }
  
  /**
   * Capture an error
   */
  async capture(data) {
    // Create entry
    const entry = new ErrorLogEntry({
      ...data,
      batchId: this.currentBatchId
    });
    
    // Auto-categorize if enabled
    if (this.options.autoCategorizate) {
      entry.category = this.categorize(data.error, data.context);
    }
    
    // Track frequency
    const frequencyInfo = this.frequencyTracker.track(entry);
    entry.frequency = frequencyInfo;
    
    // Update severity based on frequency
    if (frequencyInfo.severity !== Severity.LOW) {
      entry.severity = frequencyInfo.severity;
    }
    
    // Store in memory
    this.entries.push(entry);
    this.entriesById.set(entry.errorId, entry);
    
    // Enforce memory limit
    if (this.entries.length > this.options.maxEntriesInMemory) {
      const removed = this.entries.shift();
      this.entriesById.delete(removed.errorId);
    }
    
    // Update statistics
    this._updateStats(entry);
    
    // Emit event
    this.emit('error:captured', entry);
    
    // Check for frequent errors
    if (frequencyInfo.isFrequent) {
      this.emit('error:frequent', {
        entry,
        pattern: frequencyInfo.pattern,
        occurrences: frequencyInfo.previousOccurrences + 1
      });
    }
    
    return entry;
  }
  
  /**
   * Categorize an error based on message and context
   */
  categorize(error, context = {}) {
    const message = (error?.message || String(error)).toLowerCase();
    const type = error?.name || error?.type || 'Error';
    const stack = error?.stack?.toLowerCase() || '';
    
    // Parameter errors
    if (message.includes('required') || message.includes('missing parameter')) {
      return ErrorCategory.MISSING_PARAMETER;
    }
    if (message.includes('invalid') && (message.includes('parameter') || message.includes('argument'))) {
      return ErrorCategory.INVALID_PARAMETER;
    }
    if (message.includes('format') && message.includes('invalid')) {
      return ErrorCategory.FORMAT_INVALID;
    }
    
    // Type errors
    if (type === 'TypeError' || message.includes('type') || message.includes('undefined is not')) {
      return ErrorCategory.TYPE_MISMATCH;
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('exceeded') || message.includes('timed out')) {
      if (message.includes('skill') || stack.includes('skill')) {
        return ErrorCategory.SKILL_TIMEOUT;
      }
      if (message.includes('dependency')) {
        return ErrorCategory.DEPENDENCY_TIMEOUT;
      }
      return ErrorCategory.TIMEOUT;
    }
    
    // Not found errors
    if (message.includes('not found') || message.includes('does not exist')) {
      if (message.includes('skill')) {
        return ErrorCategory.SKILL_NOT_FOUND;
      }
      if (message.includes('dependency') || message.includes('module')) {
        return ErrorCategory.DEPENDENCY_NOT_FOUND;
      }
      if (message.includes('config')) {
        return ErrorCategory.CONFIG_MISSING;
      }
    }
    
    // Configuration errors
    if (message.includes('config')) {
      if (message.includes('invalid')) {
        return ErrorCategory.CONFIG_INVALID;
      }
      if (message.includes('conflict')) {
        return ErrorCategory.CONFIG_CONFLICT;
      }
      return ErrorCategory.CONFIG_MISSING;
    }
    
    // State errors
    if (message.includes('state') && (message.includes('invalid') || message.includes('inconsistent'))) {
      return ErrorCategory.STATE_INVALID;
    }
    
    // Logic errors
    if (message.includes('assertion') || message.includes('condition') || message.includes('failed')) {
      if (message.includes('condition')) {
        return ErrorCategory.CONDITION_FAILED;
      }
      return ErrorCategory.LOGIC_FAILURE;
    }
    
    // Skill errors
    if (message.includes('skill')) {
      if (message.includes('output') || message.includes('result')) {
        return ErrorCategory.SKILL_OUTPUT_INVALID;
      }
      return ErrorCategory.SKILL_FAILURE;
    }
    
    // Dependency errors
    if (message.includes('dependency') || message.includes('import') || message.includes('require')) {
      return ErrorCategory.DEPENDENCY_ERROR;
    }
    
    // Resource errors
    if (message.includes('memory') || message.includes('heap') || message.includes('oom')) {
      return ErrorCategory.MEMORY_ERROR;
    }
    if (message.includes('resource') && message.includes('exhaust')) {
      return ErrorCategory.RESOURCE_EXHAUSTED;
    }
    
    return ErrorCategory.UNKNOWN;
  }
  
  /**
   * Update internal statistics
   */
  _updateStats(entry) {
    this.stats.totalCaptured++;
    
    // By category
    this.stats.byCategory[entry.category] = (this.stats.byCategory[entry.category] || 0) + 1;
    
    // By severity
    this.stats.bySeverity[entry.severity] = (this.stats.bySeverity[entry.severity] || 0) + 1;
    
    // By agent
    this.stats.byAgent[entry.agentName] = (this.stats.byAgent[entry.agentName] || 0) + 1;
    
    // Resolution status
    if (entry.resolved) {
      this.stats.resolved++;
    } else {
      this.stats.unresolved++;
    }
  }
  
  /**
   * Get an error entry by ID
   */
  getById(errorId) {
    return this.entriesById.get(errorId) || null;
  }
  
  /**
   * Get entries matching a filter
   */
  getEntries(filter = {}) {
    let results = [...this.entries];
    
    if (filter.category) {
      results = results.filter(e => e.category === filter.category);
    }
    if (filter.severity) {
      results = results.filter(e => e.severity === filter.severity);
    }
    if (filter.agentName) {
      results = results.filter(e => e.agentName === filter.agentName);
    }
    if (filter.resolved !== undefined) {
      results = results.filter(e => e.resolved === filter.resolved);
    }
    if (filter.learnable !== undefined) {
      results = results.filter(e => e.learnable === filter.learnable);
    }
    if (filter.from) {
      const fromDate = new Date(filter.from);
      results = results.filter(e => new Date(e.timestamp) >= fromDate);
    }
    if (filter.to) {
      const toDate = new Date(filter.to);
      results = results.filter(e => new Date(e.timestamp) <= toDate);
    }
    if (filter.limit) {
      results = results.slice(-filter.limit);
    }
    
    return results;
  }
  
  /**
   * Get unresolved learnable errors
   */
  getLearnableErrors() {
    return this.getEntries({
      resolved: false,
      learnable: true
    });
  }
  
  /**
   * Mark an error as resolved
   */
  markResolved(errorId, resolutionId) {
    const entry = this.entriesById.get(errorId);
    if (!entry) return false;
    
    entry.resolved = true;
    entry.resolutionId = resolutionId;
    entry.resolutionTime = Date.now() - new Date(entry.timestamp).getTime();
    
    this.stats.resolved++;
    this.stats.unresolved--;
    
    this.emit('error:resolved', { errorId, resolutionId });
    return true;
  }
  
  /**
   * Get frequency patterns
   */
  getFrequencyPatterns() {
    return this.frequencyTracker.getPatterns();
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      entriesInMemory: this.entries.length,
      patterns: this.frequencyTracker.patterns.size
    };
  }
  
  /**
   * Export entries to JSON
   */
  exportToJSON(filter = {}) {
    const entries = this.getEntries(filter);
    return JSON.stringify(entries.map(e => e.toJSON()), null, 2);
  }
  
  /**
   * Clear all entries
   */
  clear() {
    this.entries = [];
    this.entriesById.clear();
    this.frequencyTracker.patterns.clear();
    this.stats = {
      totalCaptured: 0,
      byCategory: {},
      bySeverity: {},
      byAgent: {},
      resolved: 0,
      unresolved: 0
    };
    this.emit('cleared');
  }
  
  /**
   * Cleanup old entries
   */
  cleanup() {
    this.frequencyTracker.cleanup(this.options.retentionDays);
  }
}

export {
  ErrorLogger,
  ErrorLogEntry,
  FrequencyTracker,
  ErrorCategory,
  Severity
};
