/**
 * AVM Module Registry (Component 1 of Bicep AVM Resolver)
 *
 * Public API is intentionally small and stable:
 * - initialize()
 * - findModuleByResourceType(), findModuleById(), findModulesByCategory()
 * - getParameterMapping(), search(), getAllModules(), getStatistics(), clearCache()
 */

import builtInModules from './modules/index.js';

export default class AVMRegistry {
  constructor() {
    this.registry = new Map();
    this.resourceTypeIndex = new Map();
    this.categoryIndex = new Map();

    this.cache = {
      enabled: true,
      ttl: 60 * 60 * 1000,
      data: new Map()
    };

    this._initialized = false;
  }

  async initialize() {
    if (this._initialized) return;

    for (const module of this._getBuiltInModules()) {
      this._registerModule(module);
    }

    this._initialized = true;
  }

  _getBuiltInModules() {
    return builtInModules;
  }

  _registerModule(module) {
    this.registry.set(module.id, module);

    if (!this.resourceTypeIndex.has(module.resource_type)) {
      this.resourceTypeIndex.set(module.resource_type, []);
    }
    this.resourceTypeIndex.get(module.resource_type).push(module);

    if (!this.categoryIndex.has(module.category)) {
      this.categoryIndex.set(module.category, []);
    }
    this.categoryIndex.get(module.category).push(module);
  }

  _cacheResult(key, data) {
    if (!this.cache.enabled) return;
    this.cache.data.set(key, { data, timestamp: Date.now() });
  }

  findModuleByResourceType(resourceType) {
    if (!resourceType || typeof resourceType !== 'string') return null;

    const cacheKey = `resource:${resourceType}`;
    if (this.cache.enabled && this.cache.data.has(cacheKey)) {
      const cached = this.cache.data.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cache.ttl) {
        return cached.data;
      }
    }

    const exactMatches = this.resourceTypeIndex.get(resourceType);
    if (exactMatches && exactMatches.length > 0) {
      const result = exactMatches[0];
      this._cacheResult(cacheKey, result);
      return result;
    }

    const providerPrefix = resourceType.split('/')[0];
    for (const [type, modules] of this.resourceTypeIndex.entries()) {
      if (type.startsWith(providerPrefix) && modules.length > 0) {
        const result = modules[0];
        this._cacheResult(cacheKey, result);
        return result;
      }
    }

    return null;
  }

  findModuleById(moduleId) {
    return this.registry.get(moduleId) || null;
  }

  findModulesByCategory(category) {
    return this.categoryIndex.get(category) ?? [];
  }

  getParameterMapping(module, bicepProperty) {
    if (!module || !Array.isArray(module.resource_mappings) || !bicepProperty) return null;

    for (const mapping of module.resource_mappings) {
      if (mapping.bicep_property === bicepProperty) return mapping.module_parameter;
    }

    const lowerProp = String(bicepProperty).toLowerCase();
    for (const mapping of module.resource_mappings) {
      if (String(mapping.bicep_property).toLowerCase() === lowerProp) {
        return mapping.module_parameter;
      }
    }

    return null;
  }

  search(keyword) {
    if (!keyword || String(keyword).trim() === '') return [];

    const lower = String(keyword).toLowerCase();
    const results = [];

    for (const module of this.registry.values()) {
      const haystack = [
        module.name,
        module.description,
        module.resource_type,
        ...(Array.isArray(module.tags) ? module.tags : [])
      ]
        .filter(Boolean)
        .map(v => String(v).toLowerCase());

      if (haystack.some(v => v.includes(lower))) {
        results.push(module);
      }
    }

    return results;
  }

  getAllModules() {
    return Array.from(this.registry.values());
  }

  getStatistics() {
    const categories = {};
    for (const module of this.registry.values()) {
      categories[module.category] = (categories[module.category] || 0) + 1;
    }

    return {
      total_modules: this.registry.size,
      categories
    };
  }

  clearCache() {
    this.cache.data.clear();
  }
}

