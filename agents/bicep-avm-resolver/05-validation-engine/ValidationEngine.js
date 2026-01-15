/**
 * Validation Engine (Component 5 of Bicep AVM Resolver)
 *
 * Responsibilities (best-effort):
 * - Validate that transformed templates preserve key surface area (params/outputs)
 * - Provide actionable validation results (errors/warnings/info)
 *
 * Notes:
 * - The current ResourceAnalyzer focuses on resources, not modules.
 *   For transformed templates we therefore also use lightweight code scanning.
 */

import ResourceAnalyzer from '../02-resource-analyzer/ResourceAnalyzer.js';

export default class ValidationEngine {
  constructor(options = {}) {
    this.analyzer = options.analyzer || new ResourceAnalyzer();
  }

  /**
   * Validate two templates (original + transformed).
   *
   * @returns {Promise<{ results: Array<object>, summary: object }>} validation results
   */
  async validateTemplates(originalCode, transformedCode) {
    const origCode = typeof originalCode === 'string' ? originalCode : '';
    const transCode = typeof transformedCode === 'string' ? transformedCode : '';

    const original = await this.analyzer.analyzeBicepTemplate(origCode);
    const transformed = await this.analyzer.analyzeBicepTemplate(transCode);

    const results = [
      ...this._ruleAllParametersMapped(original, transformed, transCode),
      ...this._ruleAllOutputsPreserved(original, transformed, transCode),
      ...this._ruleResourceCountReasonable(original, transCode)
    ];

    const summary = {
      errors: results.filter((r) => r.severity === 'error').length,
      warnings: results.filter((r) => r.severity === 'warning').length,
      info: results.filter((r) => r.severity === 'info').length,
      original: {
        parameters: Object.keys(original.parameters || {}).length,
        outputs: Object.keys(original.outputs || {}).length,
        resources: Array.isArray(original.resources) ? original.resources.length : 0
      },
      transformed: {
        parameters: Object.keys(transformed.parameters || {}).length,
        outputs: Object.keys(transformed.outputs || {}).length,
        resources: this._countResources(transCode),
        modules: this._countModules(transCode)
      }
    };

    return { results, summary };
  }

  _ruleAllParametersMapped(original, transformed, transformedCode) {
    const results = [];

    for (const paramName of Object.keys(original.parameters || {})) {
      const inTransParams = Object.prototype.hasOwnProperty.call(transformed.parameters || {}, paramName);
      const referenced = this._isWordReferenced(transformedCode, paramName);

      if (!inTransParams && !referenced) {
        results.push({
          ruleId: 'rule-001',
          resourceName: paramName,
          severity: 'error',
          message: `Parameter ${paramName} not found in transformed template`,
          details: `Original template declares parameter '${paramName}' but it is not declared or referenced in the transformed template.`,
          suggestion: `Ensure parameter '${paramName}' is preserved or inlined into module parameters.`
        });
      }
    }

    return results;
  }

  _ruleAllOutputsPreserved(original, transformed, transformedCode) {
    const results = [];

    for (const outputName of Object.keys(original.outputs || {})) {
      const inTransOutputs = Object.prototype.hasOwnProperty.call(transformed.outputs || {}, outputName);
      const inCode = new RegExp(`^\\s*output\\s+${this._escapeRegExp(outputName)}\\b`, 'm').test(transformedCode);

      if (!inTransOutputs && !inCode) {
        results.push({
          ruleId: 'rule-002',
          resourceName: outputName,
          severity: 'error',
          message: `Output ${outputName} not found in transformed template`,
          details: `Original template exports '${outputName}' but it is not present after transformation.`,
          suggestion: `Map the output to a module output (e.g. <module>.outputs.<key>).`
        });
      }
    }

    return results;
  }

  _ruleResourceCountReasonable(original, transformedCode) {
    const results = [];

    const origResourceCount = Array.isArray(original.resources) ? original.resources.length : 0;
    const transUnitCount = this._countResources(transformedCode) + this._countModules(transformedCode);

    if (origResourceCount > 0 && transUnitCount > origResourceCount * 1.5) {
      results.push({
        ruleId: 'rule-003',
        resourceName: 'template',
        severity: 'warning',
        message: 'Transformed template has significantly more deployment units than original',
        details: `Original resources: ${origResourceCount}. Transformed resources+modules: ${transUnitCount}.`,
        suggestion: 'Check for unintended module expansion or duplicate transformations.'
      });
    }

    return results;
  }

  _countResources(code) {
    return (String(code).match(/^\s*resource\s+\w+\s+'[^']+'\s*=\s*\{/gm) || []).length;
  }

  _countModules(code) {
    return (String(code).match(/^\s*module\s+\w+\s+'[^']+'\s*=\s*\{/gm) || []).length;
  }

  _isWordReferenced(code, word) {
    if (!word) return false;
    return new RegExp(`\\b${this._escapeRegExp(word)}\\b`, 'm').test(String(code));
  }

  _escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
