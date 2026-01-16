/**
 * Configuration Index - Central export point for all configuration modules
 * 
 * This file provides a single import point for all configuration data:
 * - Dependency Graph
 * - Solution Templates
 * - Best Practices
 * - Naming Conventions
 * - Resource Type Mappings
 */

// Re-export all configurations
export { DEPENDENCY_GRAPH, getDependencies, getAllRequiredDependencies } from './dependencyGraph.js';
export { SOLUTION_TEMPLATES, findSolutionTemplate, getAllTemplates } from './solutionTemplates.js';
export { BEST_PRACTICES } from './bestPractices.js';
export { ALL_BEST_PRACTICES, getBestPractices } from './bestPracticesExtended.js';
export { NAMING_PREFIXES, getPrefix, generateName, getEnvironmentShort, generateUniqueId } from './namingConventions.js';

// Import for combined export
import { DEPENDENCY_GRAPH } from './dependencyGraph.js';
import { SOLUTION_TEMPLATES } from './solutionTemplates.js';
import { ALL_BEST_PRACTICES } from './bestPracticesExtended.js';
import { NAMING_PREFIXES } from './namingConventions.js';

/**
 * Get all configuration stats
 */
export function getConfigStats() {
  return {
    dependencies: Object.keys(DEPENDENCY_GRAPH).length,
    solutionTemplates: Object.keys(SOLUTION_TEMPLATES).length,
    bestPractices: Object.keys(ALL_BEST_PRACTICES).length,
    namingPrefixes: Object.keys(NAMING_PREFIXES).length
  };
}

// Default export with all configurations
export default {
  DEPENDENCY_GRAPH,
  SOLUTION_TEMPLATES,
  ALL_BEST_PRACTICES,
  NAMING_PREFIXES
};
