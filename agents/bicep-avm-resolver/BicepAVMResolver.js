/**
 * Bicep AVM Resolver (Phase 3 Orchestrator)
 *
 * End-to-end pipeline wiring:
 * - BAR-01 AVM Registry
 * - BAR-02 Resource Analyzer
 * - BAR-04 Template Transformer (internally uses BAR-03 Module Mapper)
 * - BAR-05 Validation Engine
 * - BAR-06 Optimization Engine
 */

import AVMRegistry from './01-avm-registry/AVMRegistry.js';
import ResourceAnalyzer from './02-resource-analyzer/ResourceAnalyzer.js';
import TemplateTransformer from './04-template-transformer/TemplateTransformer.js';
import ValidationEngine from './05-validation-engine/ValidationEngine.js';
import OptimizationEngine from './06-optimization-engine/OptimizationEngine.js';

export default class BicepAVMResolver {
  constructor(options = {}) {
    this.registry = options.registry || new AVMRegistry();
    this.analyzer = options.analyzer || new ResourceAnalyzer();
    this.transformer = options.transformer || new TemplateTransformer({ analyzer: this.analyzer });
    this.validator = options.validator || new ValidationEngine();
    this.optimizer = options.optimizer || new OptimizationEngine();

    this._initialized = false;
  }

  async initialize() {
    if (this._initialized) return;

    if (this.registry?.initialize) {
      await this.registry.initialize();
    }

    this._initialized = true;
  }

  /**
   * Resolve a Bicep template using the full BAR pipeline.
   *
   * @param {string} bicepCode
   * @param {object} [options]
   * @param {string} [options.templateName]
   * @param {object} [options.optimizationContext] Passed to OptimizationEngine
   */
  async resolve(bicepCode, options = {}) {
    const code = typeof bicepCode === 'string' ? bicepCode : '';
    const templateName = options.templateName || 'bicep_avm_resolver';
    const optimizationContext = options.optimizationContext || {};

    await this.initialize();

    const errors = [];

    let analysis = null;
    try {
      analysis = await this.analyzer.analyzeTemplate(code, this.registry, templateName);
    } catch (error) {
      errors.push(`analysis: ${error?.message || String(error)}`);
    }

    let transformation = { bicepCode: code, summary: { resourcesTransformed: 0, resourcesUnchanged: 0, outputsUpdated: 0 } };
    try {
      transformation = await this.transformer.transformBicepTemplate(code, this.registry);
    } catch (error) {
      errors.push(`transformation: ${error?.message || String(error)}`);
    }

    let validationTransformed = null;
    try {
      validationTransformed = await this.validator.validateTemplates(code, transformation.bicepCode);
    } catch (error) {
      errors.push(`validation(transformed): ${error?.message || String(error)}`);
    }

    let optimization = null;
    let optimizedBicepCode = transformation.bicepCode;
    try {
      optimization = await this.optimizer.optimizeBicepCode(transformation.bicepCode, optimizationContext, this.registry);
      optimizedBicepCode = optimization.templateAfter;
    } catch (error) {
      errors.push(`optimization: ${error?.message || String(error)}`);
    }

    let validationOptimized = null;
    try {
      validationOptimized = await this.validator.validateTemplates(code, optimizedBicepCode);
    } catch (error) {
      errors.push(`validation(optimized): ${error?.message || String(error)}`);
    }

    const optimizationSummary = optimization
      ? this.optimizer.generateOptimizationSummary(optimization, templateName)
      : this.optimizer.generateOptimizationSummary({ metrics: {}, optimizations: [] }, templateName);

    const summary = {
      templateName,
      resourcesTransformed: transformation?.summary?.resourcesTransformed ?? 0,
      outputsUpdated: transformation?.summary?.outputsUpdated ?? 0,
      optimizationsApplied: optimization?.optimizations?.length ?? 0,
      errors: errors.length
    };

    return {
      templateName,
      inputBicepCode: code,
      analysis,
      transformation,
      validation: {
        transformed: validationTransformed,
        optimized: validationOptimized
      },
      optimization,
      optimizationSummary,
      outputBicepCode: optimizedBicepCode,
      summary,
      errors
    };
  }
}
