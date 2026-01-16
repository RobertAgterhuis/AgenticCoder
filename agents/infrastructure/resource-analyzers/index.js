/**
 * Resource Analyzer Registry
 * 
 * Simplified registry using only DynamicResourceAnalyzer.
 * All resource generation is now handled by the consolidated analyzer with:
 * - Schema-validated resource generation (94 providers, 365+ types)
 * - Automatic dependency detection
 * - Solution templates for common architectures
 * - Best practices injection (dev/prod)
 */

import DynamicResourceAnalyzer from './DynamicResourceAnalyzer.js';

// Single analyzer handles everything
const analyzer = new DynamicResourceAnalyzer();

/**
 * Get the resource analyzer
 * @returns {DynamicResourceAnalyzer}
 */
export function getAnalyzer() {
  return analyzer;
}

/**
 * Get all registered analyzers (for backwards compatibility)
 * @returns {DynamicResourceAnalyzer[]}
 */
export function getAnalyzers() {
  return [analyzer];
}

/**
 * Find all analyzers that match the given description
 * @param {string} description - Task description
 * @returns {DynamicResourceAnalyzer[]}
 */
export function findMatchingAnalyzers(description) {
  if (analyzer.matches(description)) {
    return [analyzer];
  }
  return [];
}

/**
 * Analyze a task and generate Azure resources
 * @param {object} task - Task object with description, type, requirements
 * @param {object} constraints - Constraints like region, environment, budget
 * @returns {object[]} Array of generated resources
 */
export function analyzeTask(task, constraints) {
  return analyzer.analyze(task, constraints);
}

/**
 * Get supported resource types
 * @returns {Array<{keyword: string, resourceType: string}>}
 */
export function getSupportedTypes() {
  return DynamicResourceAnalyzer.getSupportedTypes();
}

/**
 * Get available solution templates
 * @returns {Array<{id: string, description: string, keywords: string[], resourceCount: number}>}
 */
export function getSolutionTemplates() {
  return DynamicResourceAnalyzer.getSolutionTemplates();
}

/**
 * Get schema statistics
 * @returns {object}
 */
export function getSchemaStats() {
  return DynamicResourceAnalyzer.getSchemaStats();
}

/**
 * Get configuration statistics
 * @returns {object}
 */
export function getConfigStats() {
  return DynamicResourceAnalyzer.getConfigStats();
}

// Default export
export default {
  getAnalyzer,
  getAnalyzers,
  findMatchingAnalyzers,
  analyzeTask,
  getSupportedTypes,
  getSolutionTemplates,
  getSchemaStats,
  getConfigStats
};
