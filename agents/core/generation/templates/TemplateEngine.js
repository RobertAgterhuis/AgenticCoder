/**
 * TemplateEngine - Loads, processes, and renders code templates
 * 
 * Supports:
 * - Variable substitution: {{variableName}}
 * - Conditionals: {{#if condition}}...{{/if}}, {{#unless condition}}...{{/unless}}
 * - Loops: {{#each items}}...{{/each}}
 * - Helpers: {{helperName arg1 arg2}}
 * - Comments: {{! comment }}
 * - Raw blocks: {{{{raw}}}}...{{{{/raw}}}}
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateEngine {
  /**
   * @param {string} templatesRoot - Root directory for templates
   * @param {Object} options - Engine options
   */
  constructor(templatesRoot, options = {}) {
    this.templatesRoot = templatesRoot;
    this.cache = new Map();
    this.helpers = new Map();
    this.partials = new Map();
    this.cacheEnabled = options.cache !== false;
    
    // Register built-in helpers
    this.registerBuiltInHelpers();
  }

  /**
   * Register built-in helper functions
   */
  registerBuiltInHelpers() {
    // String helpers
    this.registerHelper('uppercase', (str) => String(str).toUpperCase());
    this.registerHelper('lowercase', (str) => String(str).toLowerCase());
    this.registerHelper('capitalize', (str) => {
      const s = String(str);
      return s.charAt(0).toUpperCase() + s.slice(1);
    });
    this.registerHelper('camelCase', (str) => {
      return String(str)
        .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
        .replace(/^(.)/, (c) => c.toLowerCase());
    });
    this.registerHelper('pascalCase', (str) => {
      return String(str)
        .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
        .replace(/^(.)/, (c) => c.toUpperCase());
    });
    this.registerHelper('kebabCase', (str) => {
      return String(str)
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    });
    this.registerHelper('snakeCase', (str) => {
      return String(str)
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
    });

    // Array helpers
    this.registerHelper('join', (arr, separator = ', ') => {
      return Array.isArray(arr) ? arr.join(separator) : String(arr);
    });
    this.registerHelper('first', (arr) => Array.isArray(arr) ? arr[0] : arr);
    this.registerHelper('last', (arr) => Array.isArray(arr) ? arr[arr.length - 1] : arr);
    this.registerHelper('length', (arr) => Array.isArray(arr) ? arr.length : 0);

    // Comparison helpers
    this.registerHelper('eq', (a, b) => a === b);
    this.registerHelper('ne', (a, b) => a !== b);
    this.registerHelper('gt', (a, b) => a > b);
    this.registerHelper('gte', (a, b) => a >= b);
    this.registerHelper('lt', (a, b) => a < b);
    this.registerHelper('lte', (a, b) => a <= b);
    this.registerHelper('and', (...args) => args.every(Boolean));
    this.registerHelper('or', (...args) => args.some(Boolean));
    this.registerHelper('not', (val) => !val);

    // Date helpers
    this.registerHelper('now', () => new Date().toISOString());
    this.registerHelper('year', () => new Date().getFullYear());
    this.registerHelper('date', (format) => {
      const d = new Date();
      if (format === 'iso') return d.toISOString();
      if (format === 'date') return d.toDateString();
      return d.toLocaleDateString();
    });

    // JSON helpers
    this.registerHelper('json', (obj, spaces = 2) => JSON.stringify(obj, null, spaces));
    this.registerHelper('jsonInline', (obj) => JSON.stringify(obj));
  }

  /**
   * Register a custom helper function
   * @param {string} name - Helper name
   * @param {Function} fn - Helper function
   */
  registerHelper(name, fn) {
    this.helpers.set(name, fn);
  }

  /**
   * Register a partial template
   * @param {string} name - Partial name
   * @param {string} template - Template content
   */
  registerPartial(name, template) {
    this.partials.set(name, template);
  }

  /**
   * Load template from file
   * @param {string} templatePath - Path relative to templatesRoot
   * @returns {Promise<string>}
   */
  async loadTemplate(templatePath) {
    const fullPath = path.join(this.templatesRoot, templatePath);
    
    if (this.cacheEnabled && this.cache.has(fullPath)) {
      return this.cache.get(fullPath);
    }

    try {
      const content = await fs.readFile(fullPath, 'utf8');
      
      if (this.cacheEnabled) {
        this.cache.set(fullPath, content);
      }
      
      return content;
    } catch (error) {
      throw new Error(`Failed to load template '${templatePath}': ${error.message}`);
    }
  }

  /**
   * Render template from file with variables
   * @param {string} templatePath - Path relative to templatesRoot
   * @param {Object} variables - Template variables
   * @returns {Promise<string>}
   */
  async render(templatePath, variables = {}) {
    const template = await this.loadTemplate(templatePath);
    return this.renderString(template, variables);
  }

  /**
   * Render inline template string
   * @param {string} template - Template string
   * @param {Object} variables - Template variables
   * @returns {string}
   */
  renderString(template, variables = {}) {
    // Create context with variables and helpers
    const context = {
      ...variables,
      _helpers: this.helpers,
      _partials: this.partials
    };

    // Process template
    let result = template;
    
    // Remove comments
    result = this.processComments(result);
    
    // Process raw blocks (escape processing)
    const rawBlocks = [];
    result = this.extractRawBlocks(result, rawBlocks);
    
    // Process partials
    result = this.processPartials(result, context);
    
    // Process each loops
    result = this.processEachBlocks(result, context);
    
    // Process conditionals
    result = this.processIfBlocks(result, context);
    result = this.processUnlessBlocks(result, context);
    
    // Process helpers
    result = this.processHelpers(result, context);
    
    // Process variables
    result = this.processVariables(result, context);
    
    // Restore raw blocks
    result = this.restoreRawBlocks(result, rawBlocks);
    
    return result;
  }

  /**
   * Remove comment blocks
   */
  processComments(template) {
    return template.replace(/\{\{![\s\S]*?\}\}/g, '');
  }

  /**
   * Extract raw blocks to prevent processing
   */
  extractRawBlocks(template, rawBlocks) {
    return template.replace(/\{\{\{\{raw\}\}\}\}([\s\S]*?)\{\{\{\{\/raw\}\}\}\}/g, (_, content) => {
      const index = rawBlocks.length;
      rawBlocks.push(content);
      return `__RAW_BLOCK_${index}__`;
    });
  }

  /**
   * Restore raw blocks
   */
  restoreRawBlocks(template, rawBlocks) {
    return template.replace(/__RAW_BLOCK_(\d+)__/g, (_, index) => rawBlocks[parseInt(index)]);
  }

  /**
   * Process partial inclusions
   */
  processPartials(template, context) {
    return template.replace(/\{\{>\s*(\w+)\s*\}\}/g, (_, partialName) => {
      const partial = context._partials.get(partialName);
      if (partial) {
        return this.renderString(partial, context);
      }
      return '';
    });
  }

  /**
   * Process {{#each items}}...{{/each}} blocks
   */
  processEachBlocks(template, context) {
    const eachRegex = /\{\{#each\s+(\w+(?:\.\w+)*)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return template.replace(eachRegex, (_, itemsPath, content) => {
      const items = this.resolvePath(itemsPath, context);
      
      if (!items || !Array.isArray(items)) {
        return '';
      }

      return items.map((item, index) => {
        const itemContext = {
          ...context,
          this: item,
          '@index': index,
          '@first': index === 0,
          '@last': index === items.length - 1,
          '@length': items.length
        };
        
        // Recursively process the content
        return this.renderString(content, itemContext);
      }).join('');
    });
  }

  /**
   * Process {{#if condition}}...{{else}}...{{/if}} blocks
   */
  processIfBlocks(template, context) {
    // Handle if-else-if chains
    const ifRegex = /\{\{#if\s+(.+?)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return template.replace(ifRegex, (_, condition, content) => {
      // Check for else block
      const elseParts = content.split(/\{\{else\}\}/);
      const ifContent = elseParts[0];
      const elseContent = elseParts[1] || '';

      const conditionValue = this.evaluateCondition(condition.trim(), context);
      
      if (conditionValue) {
        return this.renderString(ifContent, context);
      } else {
        return this.renderString(elseContent, context);
      }
    });
  }

  /**
   * Process {{#unless condition}}...{{/unless}} blocks
   */
  processUnlessBlocks(template, context) {
    const unlessRegex = /\{\{#unless\s+(.+?)\s*\}\}([\s\S]*?)\{\{\/unless\}\}/g;
    
    return template.replace(unlessRegex, (_, condition, content) => {
      const elseParts = content.split(/\{\{else\}\}/);
      const unlessContent = elseParts[0];
      const elseContent = elseParts[1] || '';

      const conditionValue = this.evaluateCondition(condition.trim(), context);
      
      if (!conditionValue) {
        return this.renderString(unlessContent, context);
      } else {
        return this.renderString(elseContent, context);
      }
    });
  }

  /**
   * Process helper calls {{helperName arg1 arg2}}
   */
  processHelpers(template, context) {
    const helperRegex = /\{\{(\w+)\s+(.+?)\}\}/g;
    
    return template.replace(helperRegex, (match, helperName, argsString) => {
      const helper = context._helpers.get(helperName);
      
      if (!helper) {
        // Not a helper, might be a variable with spaces - skip
        return match;
      }

      const args = this.parseHelperArgs(argsString, context);
      
      try {
        return String(helper(...args));
      } catch (error) {
        console.warn(`Helper '${helperName}' error: ${error.message}`);
        return '';
      }
    });
  }

  /**
   * Process simple variable substitution {{variableName}}
   */
  processVariables(template, context) {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, varPath) => {
      const value = this.resolvePath(varPath, context);
      
      if (value === undefined || value === null) {
        return '';
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      return String(value);
    });
  }

  /**
   * Resolve dot-notation path in context
   */
  resolvePath(pathStr, context) {
    if (pathStr === 'this') {
      return context.this;
    }

    const parts = pathStr.split('.');
    let current = context;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      
      if (part.startsWith('@')) {
        // Special loop variables
        current = context[part];
      } else if (current.this && typeof current.this === 'object' && part in current.this) {
        current = current.this[part];
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Evaluate a condition expression
   */
  evaluateCondition(condition, context) {
    // Simple truthy check
    if (/^\w+(?:\.\w+)*$/.test(condition)) {
      const value = this.resolvePath(condition, context);
      return this.isTruthy(value);
    }

    // Comparison operators
    const comparisonMatch = condition.match(/^(\w+(?:\.\w+)*)\s*(===?|!==?|>=?|<=?)\s*(.+)$/);
    if (comparisonMatch) {
      const [, left, op, right] = comparisonMatch;
      const leftValue = this.resolvePath(left, context);
      const rightValue = this.parseValue(right.trim(), context);
      
      switch (op) {
        case '==':
        case '===': return leftValue === rightValue;
        case '!=':
        case '!==': return leftValue !== rightValue;
        case '>': return leftValue > rightValue;
        case '>=': return leftValue >= rightValue;
        case '<': return leftValue < rightValue;
        case '<=': return leftValue <= rightValue;
      }
    }

    // Default to truthy check
    const value = this.resolvePath(condition, context);
    return this.isTruthy(value);
  }

  /**
   * Check if value is truthy (handles arrays)
   */
  isTruthy(value) {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return Boolean(value);
  }

  /**
   * Parse a literal or variable value
   */
  parseValue(str, context) {
    // String literal
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(str)) {
      return parseFloat(str);
    }
    
    // Boolean
    if (str === 'true') return true;
    if (str === 'false') return false;
    if (str === 'null') return null;
    if (str === 'undefined') return undefined;
    
    // Variable reference
    return this.resolvePath(str, context);
  }

  /**
   * Parse helper arguments
   */
  parseHelperArgs(argsString, context) {
    const args = [];
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (inString) {
        if (char === stringChar && argsString[i - 1] !== '\\') {
          inString = false;
          args.push(current);
          current = '';
        } else {
          current += char;
        }
      } else if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
      } else if (char === ' ') {
        if (current) {
          args.push(this.parseValue(current, context));
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      args.push(this.parseValue(current, context));
    }

    return args;
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      templates: Array.from(this.cache.keys())
    };
  }
}

module.exports = TemplateEngine;
