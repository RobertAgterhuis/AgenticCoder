/**
 * CodeGenerationEngine - Main orchestrator for code generation
 * 
 * Coordinates all generation components:
 * - FileWriter: File I/O operations
 * - ProjectScaffolder: Directory structure creation
 * - Generators: Framework-specific code generation
 * - SecurityBridge: Security scanning and validation (optional)
 */

const path = require('path');
const FileWriter = require('./FileWriter');
const ProjectScaffolder = require('./ProjectScaffolder');
const GenerationContext = require('./GenerationContext');

// Security bridge for JS-TS interoperability (lazy-loaded via dynamic import)
let securityBridgePromise = null;
let securityBridge = null;

async function loadSecurityBridge() {
  if (securityBridge) {
    return securityBridge;
  }
  if (!securityBridgePromise) {
    securityBridgePromise = import('../../bridge/security.js')
      .then(mod => {
        securityBridge = mod.default || mod;
        return securityBridge;
      })
      .catch(() => {
        securityBridge = false; // Mark as unavailable
        return null;
      });
  }
  return securityBridgePromise;
}

// Pre-load security bridge
loadSecurityBridge();

class CodeGenerationEngine {
  /**
   * @param {Object} options - Engine configuration
   * @param {string} options.outputRoot - Root directory for generated output
   * @param {boolean} options.dryRun - If true, don't write files
   * @param {boolean} options.overwrite - Allow overwriting existing files
   * @param {boolean} options.securityEnabled - Enable security scanning (default: true)
   */
  constructor(options = {}) {
    this.outputRoot = options.outputRoot || './generated';
    this.dryRun = options.dryRun || false;
    this.overwrite = options.overwrite !== false;
    this.securityEnabled = options.securityEnabled !== false;
    
    // Core components
    this.fileWriter = new FileWriter(this.outputRoot, {
      createBackups: !this.overwrite,
      encoding: 'utf8'
    });
    this.scaffolder = new ProjectScaffolder(this.fileWriter);
    
    // Security hooks (initialized lazily)
    this.securityHooks = null;
    if (this.securityEnabled) {
      this._initializeSecurity();
    }
    
    // Plugin registry
    this.generators = new Map();
    this.hooks = {
      beforeGenerate: [],
      afterScaffold: [],
      beforeWrite: [],
      afterWrite: [],
      afterGenerate: [],
      onError: []
    };
  }

  /**
   * Initialize security hooks from TypeScript bridge (async)
   * @private
   * @returns {Promise<void>}
   */
  async _initializeSecurity() {
    try {
      const bridge = await loadSecurityBridge();
      if (bridge && typeof bridge.isAvailable === 'function' && bridge.isAvailable()) {
        const config = bridge.getDefaultSecurityConfig();
        const orchestrator = bridge.createSecurityOrchestrator(config);
        if (orchestrator) {
          this.securityHooks = bridge.createCodeGenHooks(orchestrator);
          // console.log('[CodeGenEngine] Security hooks initialized');
        }
      }
    } catch (error) {
      console.warn('[CodeGenEngine] Security initialization failed:', error.message);
    }
  }

  /**
   * Ensure security is initialized (call before generation)
   * @returns {Promise<void>}
   */
  async ensureSecurityInitialized() {
    if (this.securityEnabled && !this.securityHooks) {
      await this._initializeSecurity();
    }
  }

  /**
   * Validate generated content before writing
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @returns {Promise<{valid: boolean, issues: string[]}>}
   */
  async validateGeneratedFile(filePath, content) {
    if (!this.securityHooks) {
      return { valid: true, issues: [] };
    }
    try {
      const decision = await this.securityHooks.afterGenerate(filePath, content);
      return {
        valid: decision.allowed,
        issues: [...(decision.warnings || []), ...(decision.blockers || [])]
      };
    } catch {
      return { valid: true, issues: [] }; // Fail open on error
    }
  }

  /**
   * Register a generator plugin
   * @param {import('./generators/BaseGenerator')} generator - Generator instance
   */
  registerGenerator(generator) {
    this.generators.set(generator.name, generator);
  }

  /**
   * Unregister a generator
   * @param {string} name - Generator name
   */
  unregisterGenerator(name) {
    this.generators.delete(name);
  }

  /**
   * Get registered generator by name
   * @param {string} name - Generator name
   * @returns {import('./generators/BaseGenerator')|undefined}
   */
  getGenerator(name) {
    return this.generators.get(name);
  }

  /**
   * Register a hook callback
   * @param {string} hookName - Hook name
   * @param {Function} callback - Hook callback
   */
  on(hookName, callback) {
    if (this.hooks[hookName]) {
      this.hooks[hookName].push(callback);
    }
  }

  /**
   * Execute hooks
   * @param {string} hookName - Hook to execute
   * @param {Object} data - Data to pass to hooks
   */
  async executeHooks(hookName, data) {
    const hooks = this.hooks[hookName] || [];
    for (const hook of hooks) {
      await hook(data);
    }
  }

  /**
   * Main generation method
   * @param {Object} config - Generation configuration
   * @param {string} config.projectName - Project name
   * @param {string} config.scenario - Scenario ID (S01-S05)
   * @param {Object} config.requirements - Project requirements
   * @param {Object} config.architecture - Architecture decisions
   * @param {Object} config.techStack - Technology stack
   * @returns {Promise<import('./GenerationContext')>}
   */
  async generate(config) {
    // Ensure security is initialized (async)
    await this.ensureSecurityInitialized();
    
    // Create generation context
    const context = new GenerationContext({
      projectName: config.projectName,
      scenario: config.scenario,
      outputPath: path.join(this.outputRoot, config.projectName),
      requirements: config.requirements,
      architecture: config.architecture,
      techStack: config.techStack
    });

    try {
      // Security pre-check (if available)
      if (this.securityHooks) {
        try {
          const decision = await this.securityHooks.beforeGenerate(
            config.scenario || 'default',
            config.requirements || {}
          );
          if (!decision.allowed) {
            throw new Error(`Security blocked: ${decision.reason || 'Unknown reason'}`);
          }
          if (decision.warnings && decision.warnings.length > 0) {
            decision.warnings.forEach(w => context.addWarning({
              message: w,
              component: 'SecurityBridge'
            }));
          }
        } catch (secError) {
          if (secError.message.startsWith('Security blocked:')) {
            throw secError;
          }
          // Non-blocking: log and continue
          context.addWarning({
            message: `Security pre-check failed: ${secError.message}`,
            component: 'SecurityBridge'
          });
        }
      }

      // Execute pre-generation hooks
      await this.executeHooks('beforeGenerate', { context, config });

      // Phase 1: Scaffold project structure
      const scaffoldResult = await this.scaffold(context);
      await this.executeHooks('afterScaffold', { context, scaffoldResult });

      // Phase 2: Run applicable generators
      const generators = this.getApplicableGenerators(context.techStack);
      for (const generator of generators) {
        try {
          const files = await generator.generate(context);
          
          // Write generated files
          await this.executeHooks('beforeWrite', { context, files, generator });
          
          if (!this.dryRun) {
            for (const file of files) {
              await this.fileWriter.writeFile(file.path, file.content);
              context.addGeneratedFile({
                path: file.path,
                type: file.type,
                generator: generator.name,
                size: file.size || file.content.length
              });
            }
          } else {
            // Dry run - just track files
            files.forEach(file => {
              context.addGeneratedFile({
                path: file.path,
                type: file.type,
                generator: generator.name,
                size: file.size || file.content.length,
                dryRun: true
              });
            });
          }
          
          await this.executeHooks('afterWrite', { context, files, generator });
        } catch (error) {
          context.addError({
            message: error.message,
            component: generator.name,
            stack: error.stack
          });
          await this.executeHooks('onError', { context, error, generator });
        }
      }

      // Security completion callback (if available)
      if (this.securityHooks && this.securityHooks.onComplete) {
        try {
          const generatedPaths = context.generatedFiles.map(f => f.path);
          await this.securityHooks.onComplete(generatedPaths);
        } catch {
          // Non-blocking: security completion is optional
        }
      }

      // Mark complete
      context.complete();
      await this.executeHooks('afterGenerate', { context });

    } catch (error) {
      context.addError({
        message: error.message,
        component: 'CodeGenerationEngine',
        stack: error.stack
      });
      await this.executeHooks('onError', { context, error });
    }

    return context;
  }

  /**
   * Scaffold project structure
   * @param {import('./GenerationContext')} context - Generation context
   * @returns {Promise<Object>}
   */
  async scaffold(context) {
    if (this.dryRun) {
      context.addWarning({
        message: 'Scaffolding skipped in dry run mode',
        component: 'ProjectScaffolder'
      });
      return { directories: [], files: [] };
    }

    return await this.scaffolder.scaffold(context);
  }

  /**
   * Get generators applicable to the given tech stack
   * @param {Object} techStack - Technology stack
   * @returns {Array<import('./generators/BaseGenerator')>}
   */
  getApplicableGenerators(techStack) {
    const applicable = [];
    
    for (const generator of this.generators.values()) {
      if (generator.supports(techStack)) {
        applicable.push(generator);
      }
    }
    
    // Sort by priority (higher first)
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Validate configuration before generation
   * @param {Object} config - Generation configuration
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validateConfig(config) {
    const errors = [];

    if (!config.projectName) {
      errors.push('projectName is required');
    }

    if (!config.scenario) {
      errors.push('scenario is required');
    } else if (!ProjectScaffolder.getScenarios().includes(config.scenario)) {
      errors.push(`Invalid scenario: ${config.scenario}. Must be one of: ${ProjectScaffolder.getScenarios().join(', ')}`);
    }

    if (!config.techStack || Object.keys(config.techStack).length === 0) {
      errors.push('techStack is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get engine statistics
   * @returns {Object}
   */
  getStats() {
    return {
      outputRoot: this.outputRoot,
      dryRun: this.dryRun,
      generators: Array.from(this.generators.keys()),
      fileWriterStats: this.fileWriter.getStats()
    };
  }

  /**
   * Get list of available generators
   * @returns {Array<Object>}
   */
  listGenerators() {
    return Array.from(this.generators.values()).map(g => g.getInfo());
  }

  /**
   * Clear written files tracking
   */
  reset() {
    this.fileWriter = new FileWriter(this.outputRoot, {
      createBackups: !this.overwrite,
      encoding: 'utf8'
    });
    this.scaffolder = new ProjectScaffolder(this.fileWriter);
  }
}

module.exports = CodeGenerationEngine;
