/**
 * Resource Analyzer (Component 2 of Bicep AVM Resolver)
 *
 * Responsibilities:
 * - Parse Bicep templates: parameters, variables, resources, outputs
 * - Analyze resources for AVM compatibility against a registry (AVMRegistry or module array)
 * - Produce an analysis report with risk/effort signals
 */

export default class ResourceAnalyzer {
  async analyzeBicepTemplate(bicepCode) {
    const code = typeof bicepCode === 'string' ? bicepCode : '';

    const parsed = {
      parameters: {},
      variables: {},
      resources: [],
      outputs: {}
    };

    // Parameters (best-effort, mainly single-line defaults)
    for (const match of code.matchAll(/^\s*param\s+(\w+)\s+(\w+)(?:\s*=\s*(.+?))?\s*$/gm)) {
      const [, name, type, defaultValueRaw] = match;
      parsed.parameters[name] = {
        type,
        ...(defaultValueRaw !== undefined ? { default: this._parsePropertyValue(defaultValueRaw.trim()) } : {})
      };
    }

    // Variables (best-effort, can span multiple lines)
    for (const match of code.matchAll(/\bvar\s+(\w+)\s*=\s*([\s\S]*?)(?=\n\s*(?:var|param|resource|output)\b|$)/g)) {
      const [, name, raw] = match;
      parsed.variables[name] = raw.trim();
    }

    // Resources (brace-balanced scan)
    for (const res of this._extractResourceBlocks(code)) {
      parsed.resources.push(this._parseResourceBlock(res.name, res.type, res.body));
    }

    // Outputs
    for (const match of code.matchAll(/^\s*output\s+(\w+)\s+(\w+)\s*=\s*(.+?)\s*$/gm)) {
      const [, name, type, value] = match;
      parsed.outputs[name] = { type, value: value.trim() };
    }

    return parsed;
  }

  async analyzeResource(resource, registry) {
    const analysis = {
      resourceName: resource?.name,
      resourceType: resource?.type,
      canUseAVM: false,
      avmModule: undefined,
      transformationRequired: false,
      standardProperties: [],
      customProperties: [],
      unsupportedProperties: [],
      dependencies: resource?.dependencies || [],
      complexityScore: 0,
      transformationDifficulty: 'low',
      warnings: [],
      recommendations: []
    };

    if (!resource || !resource.type) {
      analysis.recommendations.push('No resource type found to analyze');
      return analysis;
    }

    const avmModule = this._findModuleForResourceType(registry, resource.type);

    if (!avmModule) {
      analysis.canUseAVM = false;
      analysis.recommendations.push(`No AVM module found for ${resource.type}`);
      return analysis;
    }

    analysis.avmModule = avmModule.id;
    analysis.canUseAVM = true;

    const resourceProps = resource.properties || {};

    // Top-level property analysis (as in spec)
    for (const propName of Object.keys(resourceProps)) {
      if (propName === 'dependsOn') continue;

      if (avmModule.parameters && avmModule.parameters[propName]) {
        analysis.standardProperties.push(propName);
      } else if (this._isSimilarProperty(propName, avmModule.parameters || {})) {
        analysis.customProperties.push(propName);
        analysis.transformationRequired = true;
      } else {
        analysis.unsupportedProperties.push(propName);
        analysis.warnings.push(`Property ${propName} not supported in AVM module`);
      }
    }

    // Additional: detect mapped nested paths (e.g., sku.name)
    const flattened = this._flattenPropertyPaths(resourceProps);
    for (const path of flattened) {
      const mapping = this._getParameterMapping(registry, avmModule, path);
      if (mapping) {
        if (!analysis.standardProperties.includes(path)) {
          analysis.standardProperties.push(path);
        }
      }
    }

    analysis.complexityScore =
      analysis.customProperties.length * 10 + analysis.unsupportedProperties.length * 15;

    if (analysis.complexityScore > 50) {
      analysis.transformationDifficulty = 'high';
    } else if (analysis.complexityScore > 20) {
      analysis.transformationDifficulty = 'medium';
    }

    if (analysis.unsupportedProperties.length > 0) {
      analysis.recommendations.push(
        'Some properties cannot be converted to AVM. Manual review required.'
      );
    }

    if ((analysis.dependencies || []).length > 0) {
      analysis.recommendations.push(
        'Resource has dependencies. Ensure they are also converted to AVM modules.'
      );
    }

    return analysis;
  }

  async analyzeTemplate(bicepCode, registry, templateName = 'analysis_report') {
    const parsed = await this.analyzeBicepTemplate(bicepCode);
    const analyses = [];
    for (const resource of parsed.resources) {
      analyses.push(await this.analyzeResource(resource, registry));
    }
    const report = this.generateAnalysisReport(analyses, templateName);
    return { parsed, analyses, report };
  }

  generateAnalysisReport(analyses, templateName = 'analysis_report') {
    const safeAnalyses = Array.isArray(analyses) ? analyses : [];

    const report = {
      template_name: templateName,
      total_resources: safeAnalyses.length,
      avm_compatible: 0,
      partial_transformation: 0,
      not_avm_compatible: 0,
      total_properties: 0,
      standard_properties: 0,
      custom_properties: 0,
      unsupported_properties: 0,
      overall_complexity: 'low',
      estimated_effort_hours: 0,
      resource_analyses: safeAnalyses,
      risks: [],
      mitigations: [],
      next_steps: []
    };

    for (const analysis of safeAnalyses) {
      if (analysis.canUseAVM && !analysis.transformationRequired) {
        report.avm_compatible++;
      } else if (analysis.canUseAVM && analysis.transformationRequired) {
        report.partial_transformation++;
      } else {
        report.not_avm_compatible++;
      }

      const props =
        (analysis.standardProperties?.length || 0) +
        (analysis.customProperties?.length || 0) +
        (analysis.unsupportedProperties?.length || 0);

      report.total_properties += props;
      report.standard_properties += analysis.standardProperties?.length || 0;
      report.custom_properties += analysis.customProperties?.length || 0;
      report.unsupported_properties += analysis.unsupportedProperties?.length || 0;

      report.estimated_effort_hours += (analysis.complexityScore || 0) / 10;
    }

    if (safeAnalyses.length > 0) {
      const avgComplexity =
        safeAnalyses.reduce((sum, a) => sum + (a.complexityScore || 0), 0) / safeAnalyses.length;

      if (avgComplexity > 50) {
        report.overall_complexity = 'high';
      } else if (avgComplexity > 20) {
        report.overall_complexity = 'medium';
      }
    }

    if (report.not_avm_compatible > 0) {
      report.risks.push(
        `${report.not_avm_compatible} resource(s) cannot be converted to AVM modules`
      );
    }

    if (report.unsupported_properties > 0) {
      report.risks.push(
        `${report.unsupported_properties} property mappings may require manual adjustment`
      );
    }

    return report;
  }

  _findModuleForResourceType(registry, resourceType) {
    if (!registry) return null;

    if (typeof registry.findModuleByResourceType === 'function') {
      return registry.findModuleByResourceType(resourceType);
    }

    if (Array.isArray(registry)) {
      return registry.find((m) => m?.resource_type === resourceType) || null;
    }

    return null;
  }

  _getParameterMapping(registry, module, bicepPropertyPath) {
    if (!module || !bicepPropertyPath) return null;

    if (registry && typeof registry.getParameterMapping === 'function') {
      return registry.getParameterMapping(module, bicepPropertyPath);
    }

    // Fallback: direct parameter name match
    const lastSegment = String(bicepPropertyPath).split('.').pop();
    if (module.parameters && module.parameters[lastSegment]) return lastSegment;

    return null;
  }

  _parseResourceBlock(symbolicName, typeWithVersion, body) {
    const { type, apiVersion } = this._splitTypeAndApiVersion(typeWithVersion);

    const properties = this._parseObjectLiteral(body);

    const resource = {
      name: symbolicName,
      type,
      apiVersion,
      properties,
      dependencies: [],
      outputs: undefined,
      location: properties.location,
      tags: properties.tags
    };

    const dependencies = new Set();

    // Explicit dependsOn
    if (Array.isArray(properties.dependsOn)) {
      for (const item of properties.dependsOn) {
        const token = this._extractDependencyToken(item);
        if (token) dependencies.add(token);
      }
    }

    // Implicit dependencies via "<symbol>.id" references anywhere in properties
    const json = JSON.stringify(properties);
    for (const match of json.matchAll(/\b(\w+)\.id\b/g)) {
      if (match[1]) dependencies.add(match[1]);
    }

    resource.dependencies = Array.from(dependencies);

    return resource;
  }

  _splitTypeAndApiVersion(typeWithVersion) {
    const raw = String(typeWithVersion || '').trim();
    const at = raw.indexOf('@');
    if (at === -1) {
      return { type: raw, apiVersion: '' };
    }
    return { type: raw.slice(0, at), apiVersion: raw.slice(at + 1) };
  }

  _extractDependencyToken(value) {
    if (value === null || value === undefined) return null;

    const v = typeof value === 'string' ? value : JSON.stringify(value);

    // Common cases: "storage", "storage.id", "resourceId(...)"
    const direct = v.match(/^\s*(\w+)\s*$/);
    if (direct) return direct[1];

    const dot = v.match(/\b(\w+)\.id\b/);
    if (dot) return dot[1];

    return null;
  }

  _extractResourceBlocks(code) {
    const blocks = [];
    const re = /\bresource\s+(\w+)\s+'([^']+)'\s*=\s*\{/g;

    while (true) {
      const match = re.exec(code);
      if (!match) break;

      const [, name, type] = match;
      const openIndex = re.lastIndex - 1; // at '{'
      const closeIndex = this._findMatchingBrace(code, openIndex);
      if (closeIndex === -1) continue;

      const body = code.slice(openIndex + 1, closeIndex);
      blocks.push({ name, type, body });

      re.lastIndex = closeIndex + 1;
    }

    return blocks;
  }

  _findMatchingBrace(text, openIndex) {
    let depth = 0;
    let inSingle = false;
    let inDouble = false;

    for (let i = openIndex; i < text.length; i++) {
      const ch = text[i];
      const next = i + 1 < text.length ? text[i + 1] : '';

      // Line comments
      if (!inSingle && !inDouble && ch === '/' && next === '/') {
        i = text.indexOf('\n', i);
        if (i === -1) return -1;
        continue;
      }

      // Block comments
      if (!inSingle && !inDouble && ch === '/' && next === '*') {
        const end = text.indexOf('*/', i + 2);
        if (end === -1) return -1;
        i = end + 1;
        continue;
      }

      if (!inDouble && ch === "'") {
        if (inSingle) {
          // Escaped single quote in Bicep uses ''
          if (next === "'") {
            i++;
            continue;
          }
          inSingle = false;
        } else {
          inSingle = true;
        }
        continue;
      }

      if (!inSingle && ch === '"') {
        inDouble = !inDouble;
        continue;
      }

      if (inSingle || inDouble) continue;

      if (ch === '{') depth++;
      else if (ch === '}') depth--;

      if (depth === 0 && i > openIndex) return i;
    }

    return -1;
  }

  _parseObjectLiteral(text) {
    const input = (text ?? '').trim();
    if (!input) return {};

    // If wrapped in braces, strip one layer
    let inner = input;
    if (inner.startsWith('{') && inner.endsWith('}')) {
      inner = inner.slice(1, -1);
    }

    inner = this._stripComments(inner);

    const obj = {};

    let currentKey = null;
    let currentValueLines = [];
    let nestingDepth = 0;
    let inSingle = false;
    let inDouble = false;

    const flush = () => {
      if (!currentKey) return;
      const rawValue = currentValueLines.join('\n').trim();
      obj[currentKey] = this._parsePropertyValue(rawValue);
      currentKey = null;
      currentValueLines = [];
      nestingDepth = 0;
      inSingle = false;
      inDouble = false;
    };

    const lines = inner.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // After stripping comments, a line might still be empty
      if (!trimmed) continue;

      if (currentKey === null) {
        const colonIndex = this._findTopLevelColon(trimmed);
        if (colonIndex === -1) continue;

        currentKey = trimmed.slice(0, colonIndex).trim();
        const valuePart = trimmed.slice(colonIndex + 1).trim();
        currentValueLines = [valuePart];

        ({ nestingDepth, inSingle, inDouble } = this._updateDepthState(valuePart, {
          nestingDepth,
          inSingle,
          inDouble
        }));

        if (nestingDepth === 0) flush();
      } else {
        currentValueLines.push(trimmed);
        ({ nestingDepth, inSingle, inDouble } = this._updateDepthState(trimmed, {
          nestingDepth,
          inSingle,
          inDouble
        }));

        if (nestingDepth === 0) flush();
      }
    }

    flush();

    return obj;
  }

  _findTopLevelColon(text) {
    let depth = 0;
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = i + 1 < text.length ? text[i + 1] : '';

      if (!inDouble && ch === "'") {
        if (inSingle) {
          if (next === "'") {
            i++;
            continue;
          }
          inSingle = false;
        } else {
          inSingle = true;
        }
        continue;
      }

      if (!inSingle && ch === '"') {
        inDouble = !inDouble;
        continue;
      }

      if (inSingle || inDouble) continue;

      if (ch === '{' || ch === '[' || ch === '(') depth++;
      else if (ch === '}' || ch === ']' || ch === ')') depth--;

      if (depth === 0 && ch === ':') return i;
    }

    return -1;
  }

  _updateDepthState(text, state) {
    let { nestingDepth, inSingle, inDouble } = state;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = i + 1 < text.length ? text[i + 1] : '';

      if (!inDouble && ch === "'") {
        if (inSingle) {
          if (next === "'") {
            i++;
            continue;
          }
          inSingle = false;
        } else {
          inSingle = true;
        }
        continue;
      }

      if (!inSingle && ch === '"') {
        inDouble = !inDouble;
        continue;
      }

      if (inSingle || inDouble) continue;

      if (ch === '{' || ch === '[' || ch === '(') nestingDepth++;
      else if (ch === '}' || ch === ']' || ch === ')') nestingDepth--;
    }

    return { nestingDepth, inSingle, inDouble };
  }

  _parseArrayLiteral(text) {
    let input = (text ?? '').trim();
    if (!input) return [];

    // Strip one layer of brackets
    if (input.startsWith('[') && input.endsWith(']')) {
      input = input.slice(1, -1);
    }

    input = this._stripComments(input);

    const items = [];
    let current = '';
    let depth = 0;
    let inSingle = false;
    let inDouble = false;

    const push = () => {
      const candidate = current.trim().replace(/,$/, '').trim();
      if (candidate) items.push(this._parsePropertyValue(candidate));
      current = '';
    };

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      const next = i + 1 < input.length ? input[i + 1] : '';

      if (!inDouble && ch === "'") {
        if (inSingle) {
          if (next === "'") {
            current += ch + next;
            i++;
            continue;
          }
          inSingle = false;
        } else {
          inSingle = true;
        }
        current += ch;
        continue;
      }

      if (!inSingle && ch === '"') {
        inDouble = !inDouble;
        current += ch;
        continue;
      }

      if (!inSingle && !inDouble) {
        if (ch === '{' || ch === '[' || ch === '(') depth++;
        else if (ch === '}' || ch === ']' || ch === ')') depth--;

        if (depth === 0 && (ch === ',' || ch === '\n')) {
          push();
          continue;
        }
      }

      current += ch;
    }

    push();

    return items;
  }

  _stripComments(text) {
    const s = String(text ?? '');
    let out = '';

    let inSingle = false;
    let inDouble = false;
    let inBlock = false;

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      const next = i + 1 < s.length ? s[i + 1] : '';

      if (inBlock) {
        if (ch === '*' && next === '/') {
          inBlock = false;
          i++;
        }
        continue;
      }

      // Toggle single quotes. In Bicep, escaped single quote is '' inside a single-quoted string.
      if (!inDouble && ch === "'") {
        if (inSingle) {
          if (next === "'") {
            out += "''";
            i++;
            continue;
          }
          inSingle = false;
          out += ch;
          continue;
        }
        inSingle = true;
        out += ch;
        continue;
      }

      if (!inSingle && ch === '"') {
        inDouble = !inDouble;
        out += ch;
        continue;
      }

      if (!inSingle && !inDouble && ch === '/' && next === '*') {
        inBlock = true;
        i++;
        continue;
      }

      if (!inSingle && !inDouble && ch === '/' && next === '/') {
        const nl = s.indexOf('\n', i + 2);
        if (nl === -1) {
          break;
        }
        out += '\n';
        i = nl;
        continue;
      }

      out += ch;
    }

    return out;
  }

  _parsePropertyValue(raw) {
    let value = (raw ?? '').trim();
    if (!value) return null;

    value = value.replace(/,$/, '').trim();

    if (value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;

    if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return Number.parseFloat(value);

    if (value.startsWith('{')) return this._parseObjectLiteral(value);
    if (value.startsWith('[')) return this._parseArrayLiteral(value);

    // Strings
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      return value.slice(1, -1);
    }

    // Expressions / identifiers (leave as string)
    return value;
  }

  _flattenPropertyPaths(obj, prefix = '') {
    const paths = [];

    if (obj === null || obj === undefined) return paths;

    if (Array.isArray(obj)) {
      if (prefix) paths.push(prefix);
      return paths;
    }

    if (typeof obj !== 'object') {
      if (prefix) paths.push(prefix);
      return paths;
    }

    for (const [key, value] of Object.entries(obj)) {
      const next = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        paths.push(...this._flattenPropertyPaths(value, next));
      } else {
        paths.push(next);
      }
    }

    return paths;
  }

  _isSimilarProperty(property, avmParams) {
    const normalized = this._normalizePropertyName(property);

    for (const avmParam of Object.keys(avmParams || {})) {
      const avmNorm = this._normalizePropertyName(avmParam);

      if (normalized === avmNorm) return true;
      if (this._levenshtein(normalized, avmNorm) <= 2) return true;
    }

    return false;
  }

  _normalizePropertyName(name) {
    return String(name || '')
      .replace(/_/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  _levenshtein(a, b) {
    const s = String(a);
    const t = String(b);
    if (s === t) return 0;
    if (!s) return t.length;
    if (!t) return s.length;

    const rows = s.length + 1;
    const cols = t.length + 1;
    const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let i = 0; i < rows; i++) dp[i][0] = i;
    for (let j = 0; j < cols; j++) dp[0][j] = j;

    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[rows - 1][cols - 1];
  }
}
