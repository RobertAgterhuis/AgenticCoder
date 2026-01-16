/**
 * Schema Validator - Dynamically validates resource types against known supported schemas
 * Uses cached data from Azure Bicep MCP tool responses
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SchemaValidator {
  constructor() {
    this.supportedResources = null;
    this.resourceTypeIndex = new Map();
    this._loadCache();
  }

  /**
   * Load the supported resources cache
   */
  _loadCache() {
    try {
      const cachePath = path.join(__dirname, 'supported-resources.json');
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      this.supportedResources = data;
      this._buildIndex();
    } catch (error) {
      console.warn('Schema cache not found, validator will run in permissive mode');
      this.supportedResources = null;
    }
  }

  /**
   * Build an index for fast lookup
   */
  _buildIndex() {
    if (!this.supportedResources?.providers) return;

    for (const [provider, data] of Object.entries(this.supportedResources.providers)) {
      for (const [resourceType, apiVersion] of Object.entries(data.latestApiVersions || {})) {
        this.resourceTypeIndex.set(resourceType.toLowerCase(), {
          resourceType,
          apiVersion,
          provider
        });
      }
    }
  }

  /**
   * Check if a resource type is supported
   * @param {string} resourceType - e.g., "Microsoft.Web/sites"
   * @returns {boolean}
   */
  isSupported(resourceType) {
    if (!this.supportedResources) return true; // Permissive mode
    return this.resourceTypeIndex.has(resourceType.toLowerCase());
  }

  /**
   * Get the latest API version for a resource type
   * @param {string} resourceType - e.g., "Microsoft.Web/sites"
   * @returns {string|null} API version or null if not found
   */
  getLatestApiVersion(resourceType) {
    const entry = this.resourceTypeIndex.get(resourceType.toLowerCase());
    return entry?.apiVersion || null;
  }

  /**
   * Get resource info including API version
   * @param {string} resourceType 
   * @returns {Object|null}
   */
  getResourceInfo(resourceType) {
    return this.resourceTypeIndex.get(resourceType.toLowerCase()) || null;
  }

  /**
   * Filter a list of resource types to only include supported ones
   * @param {string[]} resourceTypes 
   * @returns {string[]}
   */
  filterSupported(resourceTypes) {
    return resourceTypes.filter(rt => this.isSupported(rt));
  }

  /**
   * Get all supported resource types for a provider
   * @param {string} providerNamespace - e.g., "Microsoft.Web"
   * @returns {string[]}
   */
  getResourceTypesForProvider(providerNamespace) {
    const results = [];
    const prefix = providerNamespace.toLowerCase();
    
    for (const [key, value] of this.resourceTypeIndex.entries()) {
      if (key.startsWith(prefix.toLowerCase())) {
        results.push(value.resourceType);
      }
    }
    return results;
  }

  /**
   * Get all supported providers
   * @returns {string[]}
   */
  getProviders() {
    return Object.keys(this.supportedResources?.providers || {});
  }

  /**
   * Validate and suggest alternatives for unsupported resources
   * @param {string} resourceType 
   * @returns {{isValid: boolean, suggestion?: string, apiVersion?: string}}
   */
  validate(resourceType) {
    if (this.isSupported(resourceType)) {
      return {
        isValid: true,
        apiVersion: this.getLatestApiVersion(resourceType)
      };
    }

    // Find similar resources
    const provider = resourceType.split('/')[0];
    const similar = this.getResourceTypesForProvider(provider);
    
    return {
      isValid: false,
      suggestion: similar.length > 0 
        ? `Consider using: ${similar.slice(0, 3).join(', ')}`
        : `Provider ${provider} has no supported resource types in cache`
    };
  }

  /**
   * Get statistics about supported resources
   * @returns {Object}
   */
  getStats() {
    return {
      totalProviders: this.supportedResources?.totalProviders || 0,
      totalResourceTypes: this.resourceTypeIndex.size,
      generatedAt: this.supportedResources?.generatedAt || 'unknown'
    };
  }
}

// Singleton instance
const validator = new SchemaValidator();

// Named exports
export { SchemaValidator, validator };

// Convenience function exports
export const isSupported = (rt) => validator.isSupported(rt);
export const getLatestApiVersion = (rt) => validator.getLatestApiVersion(rt);
export const validate = (rt) => validator.validate(rt);
export const filterSupported = (rts) => validator.filterSupported(rts);
export const getProviders = () => validator.getProviders();
export const getStats = () => validator.getStats();

// Default export
export default validator;
