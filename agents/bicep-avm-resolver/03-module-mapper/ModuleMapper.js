/**
 * Module Mapper (Component 3 of Bicep AVM Resolver)
 *
 * Responsibilities:
 * - Map parsed Bicep resources to AVM modules
 * - Translate resource properties to module parameters (with light transforms)
 * - Capture dependencies and module output mappings
 */

const DEFAULT_SEMANTIC_MAPPINGS = {
  // Storage
  'sku.name': 'skuName',
  'sku.tier': 'skuTier',
  'properties.accessTier': 'accessTier',
  'properties.supportsHttpsTrafficOnly': 'httpsOnly',
  'properties.minimumTlsVersion': 'minimumTlsVersion',

  // Web
  'properties.serverFarmId': 'appServicePlanId',
  'properties.httpsOnly': 'httpsOnly',
  'identity.type': 'systemAssignedIdentity',

  // SQL
  'properties.collation': 'collation',
  'sku.name': 'skuName',
  'sku.tier': 'skuTier'
};

export default class ModuleMapper {
  constructor(options = {}) {
    this.semanticMappings = {
      ...DEFAULT_SEMANTIC_MAPPINGS,
      ...(options.semanticMappings || {})
    };
  }

  /**
   * Map a single resource to a module mapping.
   *
   * @param {object} resource Parsed resource (from ResourceAnalyzer)
   * @param {object} avmModule Module metadata (from AVMRegistry)
   * @param {object} [registry] Optional AVMRegistry for resource_mappings lookup
   */
  async createModuleMapping(resource, avmModule, registry) {
    const safeResource = resource || {};
    const safeModule = avmModule || {};

    const mapping = {
      sourceResourceType: safeResource.type,
      sourceResourceName: safeResource.name,

      avmModuleId: safeModule.id,
      avmModuleName: String(safeModule.id || '').split('/').pop() || safeModule.name || 'module',
      avmModuleVersion: safeModule.version || 'latest',

      parameterMappings: {},
      outputMappings: {},
      dependencyMappings: {}
    };

    const warnings = [];

    // Map properties -> parameters (including nested paths)
    const props = safeResource.properties || {};
    const flattened = this._flattenPropertyPathsWithValues(props);

    for (const { path, value } of flattened) {
      if (path === 'dependsOn') continue;

      const param = this._findMatchingParameter(path, safeModule, registry);
      if (!param) continue;

      // Avoid mapping the same AVM param twice; prefer earlier (more specific) matches
      if (mapping.parameterMappings[param.name]) {
        continue;
      }

      const transformFunction = this._determineTransform(value, safeModule.parameters?.[param.name]);

      mapping.parameterMappings[param.name] = {
        sourceProperty: path,
        transformFunction,
        defaultValue: value,
        required: !!param.required
      };
    }

    // Ensure required parameters are present (best-effort)
    const requiredParams = Object.entries(safeModule.parameters || {})
      .filter(([_, meta]) => meta && meta.required)
      .map(([name]) => name);

    for (const requiredName of requiredParams) {
      if (!mapping.parameterMappings[requiredName]) {
        warnings.push(`Required AVM parameter '${requiredName}' was not mapped from resource properties`);
      }
    }

    // Map outputs (passthrough references)
    for (const outputName of Object.keys(safeModule.outputs || {})) {
      const output = safeModule.outputs[outputName];
      mapping.outputMappings[outputName] = {
        avmOutput: outputName,
        value: output?.value
      };
    }

    // Map dependencies
    if (Array.isArray(safeResource.dependencies) && safeResource.dependencies.length > 0) {
      for (const dep of safeResource.dependencies) {
        mapping.dependencyMappings[dep] = {
          dependsOn: dep,
          property: '.id'
        };
      }
    }

    return { mapping, warnings };
  }

  /**
   * Build a module reference from a mapping and a parsed template.
   *
   * Note: This produces parameter *expressions* (strings), not final Bicep.
   */
  buildModuleReference(mapping, parsedTemplate) {
    const template = parsedTemplate || { parameters: {}, variables: {} };

    const moduleRef = {
      name: `${mapping.sourceResourceName}Module`,
      avmModuleId: mapping.avmModuleId,
      parameters: {},
      outputs: {}
    };

    for (const [avmParam, paramMap] of Object.entries(mapping.parameterMappings || {})) {
      let expr = this._toBicepExpression(paramMap.defaultValue, template);

      if (paramMap.transformFunction) {
        expr = this._applyTransformExpression(expr, paramMap.transformFunction);
      }

      moduleRef.parameters[avmParam] = expr;
    }

    for (const [sourceOutput, outputMap] of Object.entries(mapping.outputMappings || {})) {
      moduleRef.outputs[sourceOutput] = outputMap.value;
    }

    return moduleRef;
  }

  /**
   * Map all resources in a parsed template to module mappings.
   */
  async mapTemplate(parsedTemplate, registry) {
    const template = parsedTemplate || { resources: [], parameters: {}, variables: {} };
    const resources = Array.isArray(template.resources) ? template.resources : [];

    const summary = {
      totalResources: resources.length,
      successfulMappings: 0,
      partialMappings: 0,
      failedMappings: 0,

      parametersMapped: 0,
      parametersPartial: 0,
      parametersFailed: 0,

      outputsMapped: 0,
      dependenciesMapped: 0,

      resources: []
    };

    for (const resource of resources) {
      const module = registry?.findModuleByResourceType?.(resource?.type) || null;

      if (!module) {
        summary.failedMappings++;
        summary.resources.push({
          resourceName: resource?.name,
          mapping: null,
          status: 'failed',
          warnings: [`No AVM module found for ${resource?.type}`]
        });
        continue;
      }

      const { mapping, warnings } = await this.createModuleMapping(resource, module, registry);

      const requiredParams = Object.entries(module.parameters || {})
        .filter(([_, meta]) => meta && meta.required)
        .map(([name]) => name);

      const missingRequired = requiredParams.filter((p) => !mapping.parameterMappings[p]);

      const status = missingRequired.length === 0 ? 'success' : 'partial';
      if (status === 'success') summary.successfulMappings++;
      else summary.partialMappings++;

      summary.parametersMapped += Object.keys(mapping.parameterMappings || {}).length;
      summary.outputsMapped += Object.keys(mapping.outputMappings || {}).length;
      summary.dependenciesMapped += Object.keys(mapping.dependencyMappings || {}).length;

      if (missingRequired.length > 0) {
        summary.parametersPartial += missingRequired.length;
      }

      summary.resources.push({
        resourceName: resource?.name,
        mapping,
        status,
        warnings
      });
    }

    return summary;
  }

  transformParameter(sourceValue, transforms) {
    let value = sourceValue;
    const transformations = [];

    if (!transforms || transforms.length === 0) {
      return { sourceValue, transformations, targetValue: value };
    }

    for (const transform of transforms) {
      try {
        switch (transform) {
          case 'uppercase':
            value = String(value).toUpperCase();
            transformations.push({ type: 'uppercase', function: (v) => String(v).toUpperCase() });
            break;
          case 'lowercase':
            value = String(value).toLowerCase();
            transformations.push({ type: 'lowercase', function: (v) => String(v).toLowerCase() });
            break;
          case 'camelCase':
            value = this._toCamelCase(String(value));
            transformations.push({ type: 'camelCase', function: (v) => this._toCamelCase(String(v)) });
            break;
          case 'toString':
            value = String(value);
            transformations.push({ type: 'toString', function: (v) => String(v) });
            break;
          case 'toBoolean':
            value = value === true || value === 'true' || value === 1;
            transformations.push({
              type: 'toBoolean',
              function: (v) => v === true || v === 'true' || v === 1
            });
            break;
          default:
            break;
        }
      } catch (error) {
        return {
          sourceValue,
          transformations,
          error: `Transform ${transform} failed: ${error}`
        };
      }
    }

    return { sourceValue, transformations, targetValue: value };
  }

  _findMatchingParameter(sourcePropertyPath, avmModule, registry) {
    const moduleParams = avmModule?.parameters || {};
    if (!sourcePropertyPath) return null;

    // Exact match
    if (moduleParams[sourcePropertyPath]) {
      return { name: sourcePropertyPath, required: !!moduleParams[sourcePropertyPath].required };
    }

    // Registry-defined resource_mappings (preferred for nested paths)
    const mapped = registry?.getParameterMapping?.(avmModule, sourcePropertyPath);
    if (mapped && moduleParams[mapped]) {
      return { name: mapped, required: !!moduleParams[mapped].required };
    }

    // Semantic mapping fallback
    const semantic = this.semanticMappings[sourcePropertyPath] || this.semanticMappings[String(sourcePropertyPath).toLowerCase()];
    if (semantic && moduleParams[semantic]) {
      return { name: semantic, required: !!moduleParams[semantic].required };
    }

    // Case-insensitive match against param names
    const lower = String(sourcePropertyPath).toLowerCase();
    for (const paramName of Object.keys(moduleParams)) {
      if (String(paramName).toLowerCase() === lower) {
        return { name: paramName, required: !!moduleParams[paramName].required };
      }
    }

    // Try last segment (e.g. properties.httpsOnly -> httpsOnly)
    const last = String(sourcePropertyPath).split('.').pop();
    if (last && moduleParams[last]) {
      return { name: last, required: !!moduleParams[last].required };
    }

    const lastLower = String(last || '').toLowerCase();
    for (const paramName of Object.keys(moduleParams)) {
      if (String(paramName).toLowerCase() === lastLower) {
        return { name: paramName, required: !!moduleParams[paramName].required };
      }
    }

    return null;
  }

  _determineTransform(value, avmParamMeta) {
    if (!avmParamMeta) return undefined;

    // Conservative: only do transforms we are confident about.
    if (typeof value === 'boolean' && avmParamMeta.type === 'string') {
      return 'toString';
    }

    if (typeof value === 'string' && Array.isArray(avmParamMeta.allowed_values) && avmParamMeta.allowed_values.length > 0) {
      const upperValue = String(value).toUpperCase();
      if (avmParamMeta.allowed_values.includes(upperValue)) {
        return 'uppercase';
      }
    }

    return undefined;
  }

  _applyTransformExpression(expression, transform) {
    switch (transform) {
      case 'uppercase':
        return `toUpper(${expression})`;
      case 'lowercase':
        return `toLower(${expression})`;
      case 'camelCase':
        return `toCamelCase(${expression})`;
      case 'toString':
        return `string(${expression})`;
      default:
        return expression;
    }
  }

  _toBicepExpression(value, template) {
    // Keep identifiers as-is if they match params/vars.
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (template?.parameters && Object.prototype.hasOwnProperty.call(template.parameters, trimmed)) {
        return trimmed;
      }
      if (template?.variables && Object.prototype.hasOwnProperty.call(template.variables, trimmed)) {
        return trimmed;
      }

      // Best-effort: treat as expression only when it clearly looks like one.
      // Otherwise assume it's a string literal (since the parser doesn't preserve quoting).
      const looksLikeExpression =
        trimmed.includes('(') ||
        trimmed.includes(')') ||
        trimmed.includes('.') ||
        trimmed.includes('[') ||
        trimmed.includes(']') ||
        trimmed.includes('?') ||
        trimmed.includes(':') ||
        trimmed.includes('+') ||
        trimmed.includes('-') ||
        trimmed.includes('*') ||
        trimmed.includes('/') ||
        trimmed.includes('!') ||
        trimmed.includes('||') ||
        trimmed.includes('&&');

      if (looksLikeExpression) return trimmed;

      return this._quoteString(trimmed);
    }

    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    if (value === null || value === undefined) return 'null';

    // Object/array: fallback to JSON representation for now
    try {
      return JSON.stringify(value);
    } catch {
      return 'null';
    }
  }

  _quoteString(str) {
    const escaped = String(str).replace(/'/g, "''");
    return `'${escaped}'`;
  }

  _flattenPropertyPathsWithValues(obj, prefix = '') {
    const results = [];
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return results;

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        results.push({ path, value });
        results.push(...this._flattenPropertyPathsWithValues(value, path));
      } else {
        results.push({ path, value });
      }
    }

    return results;
  }

  _toCamelCase(str) {
    return str
      .split(/[-_\s]/g)
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');
  }
}
