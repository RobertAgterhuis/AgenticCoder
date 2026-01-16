/**
 * BaseResourceAnalyzer - Base class for all resource analyzers
 * 
 * Each analyzer is responsible for:
 * 1. Detecting if a task description matches its resource types (via keywords)
 * 2. Generating the appropriate Azure resources for matched tasks
 * 3. Validating generated resources against supported Bicep schemas
 */

// Import schema validator (uses require for CommonJS compatibility in Node.js test environment)
let schemaValidator;
try {
  schemaValidator = require('./schema-discovery/schemaValidator.js');
} catch (e) {
  // Graceful fallback if validator not available
  schemaValidator = {
    isSupported: () => true,
    getLatestApiVersion: () => null,
    validate: () => ({ isValid: true })
  };
}

export default class BaseResourceAnalyzer {
  /**
   * Keywords that trigger this analyzer (override in subclass)
   * @type {string[]}
   */
  static keywords = [];

  /**
   * Priority for ordering (higher = checked first)
   * @type {number}
   */
  static priority = 0;

  /**
   * Check if this analyzer matches the task description
   * @param {string} description - Lowercase task description
   * @returns {boolean}
   */
  matches(description) {
    return this.constructor.keywords.some(keyword => description.includes(keyword));
  }

  /**
   * Analyze task and return Azure resources
   * @param {object} task - Task object with description, type, requirements
   * @param {object} constraints - Constraints like region, environment, budget
   * @returns {object[]} Array of resource objects
   */
  analyze(task, constraints) {
    throw new Error('Subclass must implement analyze()');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared Helper Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create a resource object with standard structure
   * @param {string} id - Resource identifier
   * @param {string} type - Azure resource type (e.g., Microsoft.Web/sites)
   * @param {string} namePrefix - Prefix for generated name
   * @param {object} config - Resource configuration
   * @param {object} constraints - Deployment constraints
   * @returns {object}
   */
  _createResource(id, type, namePrefix, config, constraints = {}) {
    const environment = constraints.environment || 'development';
    return {
      id: `${id}-${Date.now()}`,
      type,
      name: config?.name || `${namePrefix}-${Math.random().toString(36).substring(7)}`,
      sku: config.sku,
      location: config.location,
      kind: config.kind,
      properties: config.properties || {},
      dependencies: config.dependencies || [],
      tags: {
        createdBy: 'AgenticCoder',
        environment
      }
    };
  }

  /**
   * Generate a random name with prefix
   * @param {string} prefix
   * @returns {string}
   */
  _makeName(prefix) {
    return `${prefix}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate a valid storage account name (3-24 chars, lowercase alphanumeric only)
   * @param {string} prefix
   * @returns {string}
   */
  _makeStorageAccountName(prefix = 'st') {
    const suffix = Math.random().toString(36).replace(/[^a-z0-9]/g, '').substring(0, 18);
    let name = `${prefix}${suffix}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (name.length < 3) name = (name + '000').substring(0, 3);
    if (name.length > 24) name = name.substring(0, 24);
    return name;
  }

  /**
   * Sanitize a name for use in Bicep expressions
   * @param {string} name
   * @returns {string}
   */
  _sanitizeName(name) {
    const cleaned = String(name ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!cleaned) return 'r';
    if (/^[0-9]/.test(cleaned)) return `r${cleaned}`;
    return cleaned;
  }

  /**
   * Get location from constraints with fallback
   * @param {object} constraints
   * @returns {string}
   */
  _getLocation(constraints) {
    return constraints.region || constraints.location || 'eastus';
  }

  /**
   * Get environment from constraints with fallback
   * @param {object} constraints
   * @returns {string}
   */
  _getEnvironment(constraints) {
    return constraints.environment || 'development';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Schema Validation Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Check if a resource type is supported by Azure Bicep
   * @param {string} resourceType - e.g., "Microsoft.Web/sites"
   * @returns {boolean}
   */
  _isResourceTypeSupported(resourceType) {
    return schemaValidator.isSupported(resourceType);
  }

  /**
   * Get the latest API version for a resource type
   * @param {string} resourceType 
   * @returns {string|null}
   */
  _getApiVersion(resourceType) {
    return schemaValidator.getLatestApiVersion(resourceType);
  }

  /**
   * Validate a resource type and get suggestions if unsupported
   * @param {string} resourceType 
   * @returns {{isValid: boolean, suggestion?: string, apiVersion?: string}}
   */
  _validateResourceType(resourceType) {
    return schemaValidator.validate(resourceType);
  }

  /**
   * Filter resources to only include those with supported Bicep schemas
   * @param {object[]} resources - Array of resource objects
   * @returns {object[]} Filtered resources
   */
  _filterSupportedResources(resources) {
    return resources.filter(resource => {
      const validation = this._validateResourceType(resource.type);
      if (!validation.isValid) {
        console.warn(`[Schema] Skipping unsupported resource type: ${resource.type}`);
        if (validation.suggestion) {
          console.warn(`[Schema] ${validation.suggestion}`);
        }
        return false;
      }
      return true;
    });
  }

  /**
   * Create a resource with automatic API version lookup
   * @param {string} id - Resource identifier
   * @param {string} type - Azure resource type
   * @param {string} namePrefix - Prefix for generated name
   * @param {object} config - Resource configuration
   * @param {object} constraints - Deployment constraints
   * @returns {object|null} Resource object or null if unsupported
   */
  _createValidatedResource(id, type, namePrefix, config, constraints = {}) {
    const validation = this._validateResourceType(type);
    
    if (!validation.isValid) {
      console.warn(`[Schema] Cannot create resource of type: ${type}`);
      if (validation.suggestion) {
        console.warn(`[Schema] ${validation.suggestion}`);
      }
      return null;
    }

    const resource = this._createResource(id, type, namePrefix, config, constraints);
    
    // Add API version if known
    if (validation.apiVersion) {
      resource.apiVersion = validation.apiVersion;
    }
    
    return resource;
  }
}
