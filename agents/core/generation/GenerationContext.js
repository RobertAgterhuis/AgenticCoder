/**
 * GenerationContext - Carries all information needed for code generation
 * 
 * Provides:
 * - Immutable project configuration
 * - Mutable runtime state (generated files, errors, warnings)
 * - Tech stack access helpers
 * - Serialization for logging
 */

class GenerationContext {
  /**
   * @param {Object} options - Context configuration
   * @param {string} options.projectName - Name of the project
   * @param {string} options.scenario - Scenario ID (S01-S05)
   * @param {string} options.outputPath - Output directory path
   * @param {Object} options.requirements - Project requirements
   * @param {Object} options.architecture - Architecture decisions
   * @param {Object} options.techStack - Technology stack configuration
   */
  constructor(options) {
    // Immutable configuration
    this.projectName = options.projectName;
    this.scenario = options.scenario;
    this.outputPath = options.outputPath;
    this.requirements = Object.freeze(options.requirements || {});
    this.architecture = Object.freeze(options.architecture || {});
    this.techStack = Object.freeze(options.techStack || {});
    
    // Runtime state
    this.generatedFiles = [];
    this.errors = [];
    this.warnings = [];
    this.metadata = {};
    
    // Timestamps
    this.createdAt = new Date().toISOString();
    this.completedAt = null;
  }

  /**
   * Add generated file to tracking
   * @param {Object} file - File information
   * @param {string} file.path - Relative file path
   * @param {string} file.type - File type (component, service, model, etc.)
   * @param {string} file.generator - Generator that created it
   * @param {number} file.size - File size in bytes
   */
  addGeneratedFile(file) {
    this.generatedFiles.push({
      ...file,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record an error
   * @param {Object} error - Error information
   * @param {string} error.message - Error message
   * @param {string} error.component - Component that failed
   * @param {string} error.file - Related file path (optional)
   */
  addError(error) {
    this.errors.push({
      ...error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record a warning
   * @param {Object} warning - Warning information
   * @param {string} warning.message - Warning message
   * @param {string} warning.component - Related component
   */
  addWarning(warning) {
    this.warnings.push({
      ...warning,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get tech stack component for a layer
   * @param {string} layer - Layer name: 'frontend', 'backend', 'database', 'infrastructure'
   * @returns {Object|null}
   */
  getTechStack(layer) {
    return this.techStack[layer] || null;
  }

  /**
   * Get framework for a layer
   * @param {string} layer - Layer name
   * @returns {string|null}
   */
  getFramework(layer) {
    const stack = this.getTechStack(layer);
    return stack?.framework || null;
  }

  /**
   * Check if context has errors
   * @returns {boolean}
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Get files by type
   * @param {string} type - File type to filter by
   * @returns {Array}
   */
  getFilesByType(type) {
    return this.generatedFiles.filter(f => f.type === type);
  }

  /**
   * Get files by generator
   * @param {string} generator - Generator name
   * @returns {Array}
   */
  getFilesByGenerator(generator) {
    return this.generatedFiles.filter(f => f.generator === generator);
  }

  /**
   * Set metadata value
   * @param {string} key - Metadata key
   * @param {*} value - Metadata value
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * Get metadata value
   * @param {string} key - Metadata key
   * @returns {*}
   */
  getMetadata(key) {
    return this.metadata[key];
  }

  /**
   * Mark generation as complete
   */
  complete() {
    this.completedAt = new Date().toISOString();
  }

  /**
   * Get generation summary
   * @returns {Object}
   */
  getSummary() {
    return {
      projectName: this.projectName,
      scenario: this.scenario,
      filesGenerated: this.generatedFiles.length,
      totalSize: this.generatedFiles.reduce((sum, f) => sum + (f.size || 0), 0),
      errors: this.errors.length,
      warnings: this.warnings.length,
      duration: this.completedAt 
        ? new Date(this.completedAt) - new Date(this.createdAt)
        : null,
      status: this.hasErrors() ? 'failed' : (this.completedAt ? 'completed' : 'in-progress')
    };
  }

  /**
   * Serialize for logging/debugging
   * @returns {Object}
   */
  toJSON() {
    return {
      // Configuration
      projectName: this.projectName,
      scenario: this.scenario,
      outputPath: this.outputPath,
      requirements: this.requirements,
      architecture: this.architecture,
      techStack: this.techStack,
      
      // State
      generatedFiles: this.generatedFiles,
      errors: this.errors,
      warnings: this.warnings,
      metadata: this.metadata,
      
      // Timestamps
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      
      // Summary
      summary: this.getSummary()
    };
  }

  /**
   * Create context from JSON
   * @param {Object} json - Serialized context
   * @returns {GenerationContext}
   */
  static fromJSON(json) {
    const context = new GenerationContext({
      projectName: json.projectName,
      scenario: json.scenario,
      outputPath: json.outputPath,
      requirements: json.requirements,
      architecture: json.architecture,
      techStack: json.techStack
    });
    
    context.generatedFiles = json.generatedFiles || [];
    context.errors = json.errors || [];
    context.warnings = json.warnings || [];
    context.metadata = json.metadata || {};
    context.createdAt = json.createdAt;
    context.completedAt = json.completedAt;
    
    return context;
  }
}

module.exports = GenerationContext;
