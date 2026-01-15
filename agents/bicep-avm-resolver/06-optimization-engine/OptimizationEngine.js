/**
 * Optimization Engine (Component 6 of Bicep AVM Resolver)
 *
 * Optimizes AVM module-based Bicep templates for:
 * - removing redundant/default parameters
 * - optional security hardening
 * - optional cost optimization
 *
 * This is intentionally best-effort and conservative: it only edits module params
 * that are known to exist in the module schema (when a registry is provided).
 */

const DEFAULT_CONTEXT = {
  environment: 'dev',
  performanceFocus: false,
  securityFocus: false,
  costOptimization: false
};

const DEFAULT_REDUNDANT_DEFAULTS = {
  httpsOnly: 'true',
  minimumTlsVersion: "'TLS1_2'",
  accessTier: "'Hot'",
  kind: "'StorageV2'",
  publicNetworkAccess: "'Enabled'"
};

export default class OptimizationEngine {
  constructor(options = {}) {
    this.redundantDefaults = {
      ...DEFAULT_REDUNDANT_DEFAULTS,
      ...(options.redundantDefaults || {})
    };

    this.optimizationRules = options.optimizationRules || this._defaultRules();
  }

  async optimizeBicepCode(bicepCode, context = {}, registry) {
    const code = typeof bicepCode === 'string' ? bicepCode : '';
    const ctx = { ...DEFAULT_CONTEXT, ...(context || {}) };

    const templateBefore = code;
    let current = code;

    const applied = [];

    const sortedRules = [...this.optimizationRules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of sortedRules) {
      try {
        if (typeof rule.canOptimize === 'function' && !rule.canOptimize(current, ctx, registry)) {
          continue;
        }

        const before = current;
        const after = await rule.optimize(current, ctx, registry, this);

        if (typeof after === 'string' && after !== before) {
          current = after;
          applied.push({
            rule: rule.name,
            description: rule.description,
            impact: this._calculateImpact(rule.id)
          });
        }
      } catch (error) {
        // non-fatal: keep going
      }
    }

    const templateAfter = current;

    return {
      templateBefore,
      templateAfter,
      optimizations: applied,
      metrics: {
        charactersBefore: templateBefore.length,
        charactersAfter: templateAfter.length,
        complexityBefore: this._calculateComplexity(templateBefore),
        complexityAfter: this._calculateComplexity(templateAfter)
      }
    };
  }

  generateOptimizationSummary(result, templateName = 'optimized_template') {
    const safe = result || { metrics: { complexityBefore: 0, complexityAfter: 0, charactersBefore: 0, charactersAfter: 0 }, optimizations: [] };

    const complexityBefore = safe.metrics?.complexityBefore || 0;
    const complexityAfter = safe.metrics?.complexityAfter || 0;

    const charsBefore = safe.metrics?.charactersBefore || 0;
    const charsAfter = safe.metrics?.charactersAfter || 0;

    const complexityReduction = complexityBefore > 0 ? (((complexityBefore - complexityAfter) / complexityBefore) * 100).toFixed(1) : '0.0';
    const sizeReduction = charsBefore > 0 ? (((charsBefore - charsAfter) / charsBefore) * 100).toFixed(1) : '0.0';

    return {
      templateName,
      originalComplexity: complexityBefore,
      optimizedComplexity: complexityAfter,
      complexityReduction: `${complexityReduction}%`,
      fileSizeBefore: charsBefore,
      fileSizeAfter: charsAfter,
      sizeReduction: `${sizeReduction}%`,
      optimizationsApplied: Array.isArray(safe.optimizations) ? safe.optimizations.length : 0,
      recommendations: this._generateRecommendations(safe)
    };
  }

  _defaultRules() {
    return [
      {
        id: 'opt-003',
        name: 'Apply Security Best Practices',
        description: 'Ensure key security settings are hardened (only when enabled)',
        priority: 9,
        canOptimize: (_code, ctx) => !!ctx.securityFocus,
        optimize: (code, ctx, registry, engine) => {
          return engine._optimizeModules(code, registry, (moduleInfo, params) => {
            const next = { ...params };

            // Storage hardening
            if (engine._isModuleId(moduleInfo.moduleId, 'br:avm/storage:latest')) {
              // only set if parameter exists for this module
              // only override when explicitly disabled
              engine._setIfAllowed(next, moduleInfo, registry, 'httpsOnly', 'true', { onlyIfMissingOr: 'false' });
              // optionally tighten public network access if supported
              engine._setIfAllowed(next, moduleInfo, registry, 'publicNetworkAccess', "'Disabled'", { onlyIfMissingOr: "'Enabled'" });
            }

            // Web app hardening
            if (engine._isModuleId(moduleInfo.moduleId, 'br:avm/web-app:latest')) {
              // only override when explicitly disabled
              engine._setIfAllowed(next, moduleInfo, registry, 'httpsOnly', 'true', { onlyIfMissingOr: 'false' });
            }

            return next;
          });
        }
      },
      {
        id: 'opt-001',
        name: 'Consolidate Redundant Properties',
        description: 'Remove module parameters that match known defaults',
        priority: 8,
        canOptimize: () => true,
        optimize: (code, ctx, registry, engine) => {
          return engine._optimizeModules(code, registry, (moduleInfo, params) => {
            const next = { ...params };

            // When security focus is enabled, keep security-critical parameters explicit
            // (even if they match a known default) to make the hardening intent clear.
            const keepWhenSecurityFocus = new Set(['httpsOnly', 'minimumTlsVersion', 'publicNetworkAccess']);

            // Only remove keys that are known in the module schema (when available)
            for (const [key, defaultExpr] of Object.entries(engine.redundantDefaults)) {
              if (!Object.prototype.hasOwnProperty.call(next, key)) continue;

              if (ctx?.securityFocus && keepWhenSecurityFocus.has(key)) {
                continue;
              }

              if (registry && moduleInfo.moduleId) {
                const moduleDef = engine._findModuleById(registry, moduleInfo.moduleId);
                if (moduleDef && moduleDef.parameters && !moduleDef.parameters[key]) {
                  continue;
                }
              }

              const currentExpr = engine._normalizeExpr(next[key]);
              if (currentExpr === engine._normalizeExpr(defaultExpr)) {
                delete next[key];
              }
            }

            return next;
          });
        }
      },
      {
        id: 'opt-004',
        name: 'Optimize for Cost',
        description: 'Apply light cost optimizations (only when enabled)',
        priority: 7,
        canOptimize: (_code, ctx) => !!ctx.costOptimization,
        optimize: (code, _ctx, registry, engine) => {
          return engine._optimizeModules(code, registry, (moduleInfo, params) => {
            const next = { ...params };

            // Storage: prefer Standard_LRS when skuName is an expensive literal
            if (engine._isModuleId(moduleInfo.moduleId, 'br:avm/storage:latest')) {
              engine._setIfAllowed(next, moduleInfo, registry, 'skuName', "'Standard_LRS'", {
                onlyIfMissingOrMatches: [/^'Premium_/i, /^'Standard_/i]
              });
            }

            // App Service Plan: prefer S1/Standard if set to premium/expensive literal
            if (engine._isModuleId(moduleInfo.moduleId, 'br:avm/app-service-plan:latest')) {
              engine._setIfAllowed(next, moduleInfo, registry, 'skuName', "'S1'", {
                onlyIfMissingOrMatches: [/^'P/i, /^'EP/i, /^'I/i]
              });
              engine._setIfAllowed(next, moduleInfo, registry, 'skuTier', "'Standard'", {
                onlyIfMissingOrMatches: [/^'Premium/i, /^'ElasticPremium/i, /^'Isolated/i]
              });
            }

            return next;
          });
        }
      }
    ];
  }

  _calculateImpact(ruleId) {
    const impact = {};

    switch (ruleId) {
      case 'opt-003':
        impact.security = 'High - hardened defaults applied';
        break;
      case 'opt-004':
        impact.cost = 'Medium - cheaper SKU defaults applied';
        break;
      default:
        break;
    }

    return impact;
  }

  _generateRecommendations(result) {
    const recs = [];

    if ((result.metrics?.charactersAfter || 0) > (result.metrics?.charactersBefore || 0)) {
      recs.push('Template grew in size; review if changes are desired');
    }

    if ((result.metrics?.complexityAfter || 0) > (result.metrics?.complexityBefore || 0)) {
      recs.push('Complexity increased; consider reducing module parameter surface');
    }

    if ((result.optimizations || []).length === 0) {
      recs.push('No optimizations were applied');
    }

    return recs;
  }

  _calculateComplexity(code) {
    const resources = (String(code).match(/^\s*resource\s+/gm) || []).length;
    const modules = (String(code).match(/^\s*module\s+/gm) || []).length;
    const params = (String(code).match(/^\s*param\s+/gm) || []).length;
    const vars = (String(code).match(/^\s*var\s+/gm) || []).length;
    const outputs = (String(code).match(/^\s*output\s+/gm) || []).length;

    // Similar weighting as spec
    return resources * 5 + modules * 5 + params * 3 + vars * 2 + outputs * 2;
  }

  _optimizeModules(code, registry, paramsUpdater) {
    if (!code) return code;

    const blocks = this._extractModuleBlocks(code);
    if (blocks.length === 0) return code;

    let nextCode = code;

    for (const block of blocks) {
      const updated = this._updateModuleParamsBlock(block.fullText, block.moduleId, registry, paramsUpdater);
      if (updated !== block.fullText) {
        nextCode = nextCode.replace(block.fullText, updated);
      }
    }

    return nextCode;
  }

  _extractModuleBlocks(code) {
    const blocks = [];
    const text = String(code);

    const headerRe = /^\s*module\s+(\w+)\s+'([^']+)'\s*=\s*\{/gm;

    for (const match of text.matchAll(headerRe)) {
      const name = match[1];
      const moduleId = match[2];
      const headerStart = match.index;
      const openBraceIndex = headerStart + match[0].lastIndexOf('{');

      let i = openBraceIndex;
      let depth = 0;
      let inString = false;
      let stringChar = '';

      for (; i < text.length; i++) {
        const ch = text[i];
        const prev = i > 0 ? text[i - 1] : '';

        if (inString) {
          if (ch === stringChar && prev !== '\\') {
            inString = false;
            stringChar = '';
          }
          continue;
        }

        if (ch === "'" || ch === '"') {
          inString = true;
          stringChar = ch;
          continue;
        }

        if (ch === '{') depth++;
        if (ch === '}') {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
      }

      const fullText = text.slice(headerStart, i);
      blocks.push({ name, moduleId, fullText });
    }

    return blocks;
  }

  _updateModuleParamsBlock(moduleBlockText, moduleId, registry, paramsUpdater) {
    const block = String(moduleBlockText);

    const paramsKeyIndex = block.search(/\bparams\s*:\s*\{/m);
    if (paramsKeyIndex === -1) return block;

    const openBraceIndex = block.indexOf('{', paramsKeyIndex);
    if (openBraceIndex === -1) return block;

    const closeBraceIndex = this._findMatchingBrace(block, openBraceIndex);
    if (closeBraceIndex === -1) return block;

    const paramsObjectText = block.slice(openBraceIndex + 1, closeBraceIndex);
    const { params, order, indent } = this._parseParamsObject(paramsObjectText);

    const moduleInfo = { moduleId };
    const updatedParams = paramsUpdater(moduleInfo, params);

    const rebuilt = this._buildParamsObject(updatedParams, order, indent);

    return block.slice(0, openBraceIndex + 1) + rebuilt + block.slice(closeBraceIndex);
  }

  _parseParamsObject(innerText) {
    const lines = String(innerText).split(/\r?\n/);

    const params = {};
    const order = [];

    let detectedIndent = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const m = /^([ \t]*)(\w+)\s*:\s*(.+?)\s*$/.exec(line);
      if (!m) continue;

      const [, leading, key, expr] = m;
      if (detectedIndent === null) detectedIndent = leading;

      params[key] = expr.trim();
      order.push(key);
    }

    const indent = detectedIndent ?? '    ';
    return { params, order, indent };
  }

  _buildParamsObject(params, originalOrder, indent) {
    const keys = Object.keys(params || {});

    // Preserve original ordering, then append new keys.
    const order = [];
    for (const k of originalOrder || []) {
      if (Object.prototype.hasOwnProperty.call(params, k)) order.push(k);
    }
    for (const k of keys) {
      if (!order.includes(k)) order.push(k);
    }

    const lines = [];
    for (const k of order) {
      lines.push(`${indent}${k}: ${params[k]}`);
    }

    if (lines.length === 0) {
      // keep formatting stable for empty objects
      return '';
    }

    return `\n${lines.join('\n')}\n${indent.slice(0, Math.max(0, indent.length - 2))}`;
  }

  _findMatchingBrace(text, openIndex) {
    const s = String(text);
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = openIndex; i < s.length; i++) {
      const ch = s[i];
      const prev = i > 0 ? s[i - 1] : '';

      if (inString) {
        if (ch === stringChar && prev !== '\\') {
          inString = false;
          stringChar = '';
        }
        continue;
      }

      if (ch === "'" || ch === '"') {
        inString = true;
        stringChar = ch;
        continue;
      }

      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }

    return -1;
  }

  _normalizeExpr(expr) {
    return String(expr || '').trim().replace(/\s+/g, '');
  }

  _findModuleById(registry, moduleId) {
    if (!registry || !moduleId) return null;

    if (typeof registry.findModuleById === 'function') {
      return registry.findModuleById(moduleId);
    }

    // fallback array
    if (Array.isArray(registry)) {
      return registry.find((m) => m?.id === moduleId) || null;
    }

    return null;
  }

  _isModuleId(actual, expected) {
    return String(actual || '') === String(expected || '');
  }

  _setIfAllowed(params, moduleInfo, registry, key, valueExpr, options = {}) {
    // schema check
    if (registry && moduleInfo?.moduleId) {
      const moduleDef = this._findModuleById(registry, moduleInfo.moduleId);
      if (moduleDef && moduleDef.parameters && !moduleDef.parameters[key]) {
        return;
      }
    }

    const onlyIfMissingOr = options.onlyIfMissingOr;
    const onlyIfMissingOrMatches = options.onlyIfMissingOrMatches;

    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      params[key] = valueExpr;
      return;
    }

    const current = String(params[key]).trim();

    if (onlyIfMissingOr !== undefined) {
      if (this._normalizeExpr(current) === this._normalizeExpr(onlyIfMissingOr)) {
        params[key] = valueExpr;
      }
      return;
    }

    if (Array.isArray(onlyIfMissingOrMatches) && onlyIfMissingOrMatches.length > 0) {
      if (onlyIfMissingOrMatches.some((re) => re.test(current))) {
        params[key] = valueExpr;
      }
      return;
    }

    // default: do not override
  }
}
