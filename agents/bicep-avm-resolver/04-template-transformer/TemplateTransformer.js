/**
 * Template Transformer (Component 4 of Bicep AVM Resolver)
 *
 * Responsibilities:
 * - Rewrite Bicep templates: replace eligible resource blocks with AVM module calls
 * - Update output and reference expressions to use module outputs
 * - Preserve original template as much as possible (best-effort)
 */

import ResourceAnalyzer from '../02-resource-analyzer/ResourceAnalyzer.js';
import ModuleMapper from '../03-module-mapper/ModuleMapper.js';

export default class TemplateTransformer {
  constructor(options = {}) {
    this.analyzer = options.analyzer || new ResourceAnalyzer();
    this.mapper = options.mapper || new ModuleMapper();
  }

  /**
   * End-to-end transformation:
   * - parse template
   * - map resources to modules
   * - replace transformable resources with module blocks
   * - update outputs + references
   */
  async transformBicepTemplate(bicepCode, registry) {
    const originalCode = typeof bicepCode === 'string' ? bicepCode : '';

    const parsed = await this.analyzer.analyzeBicepTemplate(originalCode);

    // Determine which resources can be transformed (best-effort: required params mapped)
    const resources = Array.isArray(parsed.resources) ? parsed.resources : [];

    const transformItems = [];

    for (const resource of resources) {
      const avmModule = registry?.findModuleByResourceType?.(resource?.type) || null;
      if (!avmModule) continue;

      const { mapping } = await this.mapper.createModuleMapping(resource, avmModule, registry);

      const requiredParams = Object.entries(avmModule.parameters || {})
        .filter(([_, meta]) => meta && meta.required)
        .map(([name]) => name);

      const missingRequired = requiredParams.filter((p) => !mapping.parameterMappings[p]);
      if (missingRequired.length > 0) continue;

      const moduleRef = this.mapper.buildModuleReference(mapping, parsed);

      transformItems.push({
        resource,
        mapping,
        avmModule,
        moduleRef
      });
    }

    const resourceToModuleName = new Map(transformItems.map((t) => [t.resource.name, t.moduleRef.name]));
    const resourceToOutputKeys = new Map(transformItems.map((t) => [t.resource.name, new Set(Object.keys(t.avmModule.outputs || {}))]));

    let transformedCode = originalCode;

    // Replace resources (brace-balanced scanning)
    for (const item of transformItems) {
      const dependsOn = (item.resource.dependencies || []).map((dep) => resourceToModuleName.get(dep) || dep);

      // Rewrite parameter expressions referencing transformed resources
      const rewrittenModuleRef = {
        ...item.moduleRef,
        parameters: this._rewriteModuleParameters(item.moduleRef.parameters, resourceToModuleName, resourceToOutputKeys)
      };

      const moduleCode = this._generateModuleCode(rewrittenModuleRef, dependsOn);
      transformedCode = this._replaceResourceBlock(transformedCode, item.resource.name, moduleCode);
    }

    // Update outputs that reference transformed resources
    transformedCode = this._rewriteOutputStatements(transformedCode, resourceToModuleName, resourceToOutputKeys);

    // Update any remaining references in the template (e.g. variables/expressions)
    transformedCode = this._rewriteReferences(transformedCode, resourceToModuleName, resourceToOutputKeys);

    transformedCode = this._cleanupFormatting(transformedCode);

    const summary = {
      resourcesTransformed: transformItems.length,
      resourcesUnchanged: resources.length - transformItems.length,
      outputsUpdated: this._countOutputsUpdated(originalCode, transformedCode)
    };

    return { bicepCode: transformedCode, summary };
  }

  _generateModuleCode(moduleRef, dependsOn = []) {
    let code = `module ${moduleRef.name} '${moduleRef.avmModuleId}' = {\n`;
    code += `  name: '${'${'}uniqueString(resourceGroup().id)${'}'}-${moduleRef.name}'\n\n`;

    code += `  params: {\n`;
    for (const [param, expr] of Object.entries(moduleRef.parameters || {})) {
      code += `    ${param}: ${expr}\n`;
    }
    code += `  }\n`;

    if (Array.isArray(dependsOn) && dependsOn.length > 0) {
      code += `\n  dependsOn: [\n`;
      for (const dep of dependsOn) {
        code += `    ${dep}\n`;
      }
      code += `  ]\n`;
    }

    code += `}`;
    return code;
  }

  _rewriteModuleParameters(parameters, resourceToModuleName, resourceToOutputKeys) {
    const next = {};

    for (const [k, v] of Object.entries(parameters || {})) {
      next[k] = this._rewriteExpression(String(v), resourceToModuleName, resourceToOutputKeys);
    }

    return next;
  }

  _rewriteOutputStatements(code, resourceToModuleName, resourceToOutputKeys) {
    if (!code) return code;

    return code.replace(/^\s*output\s+(\w+)\s+(\w+)\s*=\s*(.+?)\s*$/gm, (line, outName, outType, expr) => {
      const rewritten = this._rewriteExpression(expr.trim(), resourceToModuleName, resourceToOutputKeys);
      return `output ${outName} ${outType} = ${rewritten}`;
    });
  }

  _rewriteReferences(code, resourceToModuleName, resourceToOutputKeys) {
    if (!code) return code;

    let next = code;
    for (const [resourceName, moduleName] of resourceToModuleName.entries()) {
      const outputKeys = resourceToOutputKeys.get(resourceName) || new Set(['id', 'name']);

      for (const key of outputKeys) {
        const pattern = new RegExp(`\\b${this._escapeRegExp(resourceName)}\\.${this._escapeRegExp(key)}\\b`, 'g');
        next = next.replace(pattern, `${moduleName}.outputs.${key}`);
      }
    }

    return next;
  }

  _rewriteExpression(expr, resourceToModuleName, resourceToOutputKeys) {
    let rewritten = expr;

    for (const [resourceName, moduleName] of resourceToModuleName.entries()) {
      const outputKeys = resourceToOutputKeys.get(resourceName) || new Set(['id', 'name']);

      for (const key of outputKeys) {
        const pattern = new RegExp(`\\b${this._escapeRegExp(resourceName)}\\.${this._escapeRegExp(key)}\\b`, 'g');
        rewritten = rewritten.replace(pattern, `${moduleName}.outputs.${key}`);
      }
    }

    return rewritten;
  }

  _replaceResourceBlock(code, resourceName, replacement) {
    if (!code || !resourceName) return code;

    // Find the start of the resource declaration for this symbolic name.
    const headerRe = new RegExp(`(^\\s*resource\\s+${this._escapeRegExp(resourceName)}\\s+'[^']+'\\s*=\\s*\\{)`, 'm');
    const headerMatch = headerRe.exec(code);
    if (!headerMatch) return code;

    const headerStart = headerMatch.index;
    const openBraceIndex = headerStart + headerMatch[1].lastIndexOf('{');

    // Scan to matching closing brace.
    let i = openBraceIndex;
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (; i < code.length; i++) {
      const ch = code[i];
      const prev = i > 0 ? code[i - 1] : '';

      if (inString) {
        if (ch === stringChar && prev !== '\\') {
          inString = false;
          stringChar = '';
        }
        continue;
      }

      if (ch === '\'' || ch === '"') {
        inString = true;
        stringChar = ch;
        continue;
      }

      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          i++; // include closing brace
          break;
        }
      }
    }

    const resourceBlock = code.slice(headerStart, i);
    return code.replace(resourceBlock, replacement);
  }

  _cleanupFormatting(code) {
    if (!code) return code;
    let next = code.replace(/\n\n\n+/g, '\n\n');
    return next.trimEnd();
  }

  _escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _countOutputsUpdated(before, after) {
    const beforeCount = (String(before).match(/^\s*output\s+/gm) || []).length;
    const afterCount = (String(after).match(/^\s*output\s+/gm) || []).length;
    return beforeCount === afterCount ? beforeCount : Math.max(0, Math.min(beforeCount, afterCount));
  }
}
