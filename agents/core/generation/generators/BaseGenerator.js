/**
 * BaseGenerator - Abstract base class for all code generators
 * 
 * Provides common interface and utilities for framework-specific generators.
 * Extend this class to create generators for different frameworks.
 */

class BaseGenerator {
  /**
   * @param {string} name - Generator name
   * @param {Object} options - Generator options
   */
  constructor(name, options = {}) {
    if (this.constructor === BaseGenerator) {
      throw new Error('BaseGenerator is abstract and cannot be instantiated directly');
    }
    
    this.name = name;
    this.options = options;
    this.templates = new Map();
    this.helpers = new Map();
  }

  /**
   * Generate code for a context - must be implemented by subclasses
   * @param {import('../GenerationContext')} context - Generation context
   * @returns {Promise<Array<{path: string, content: string}>>}
   */
  async generate(context) {
    throw new Error('generate() must be implemented by subclass');
  }

  /**
   * Check if this generator supports the given tech stack
   * @param {Object} techStack - Technology stack configuration
   * @returns {boolean}
   */
  supports(techStack) {
    throw new Error('supports() must be implemented by subclass');
  }

  /**
   * Get generator priority (higher runs first)
   * @returns {number}
   */
  get priority() {
    return 0;
  }

  /**
   * Register a template
   * @param {string} name - Template name
   * @param {Function} templateFn - Template function (context) => string
   */
  registerTemplate(name, templateFn) {
    this.templates.set(name, templateFn);
  }

  /**
   * Get template by name
   * @param {string} name - Template name
   * @returns {Function|undefined}
   */
  getTemplate(name) {
    return this.templates.get(name);
  }

  /**
   * Render a template
   * @param {string} name - Template name
   * @param {Object} data - Template data
   * @returns {string}
   */
  renderTemplate(name, data) {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template '${name}' not found in generator '${this.name}'`);
    }
    return template(data);
  }

  /**
   * Register a helper function
   * @param {string} name - Helper name
   * @param {Function} helperFn - Helper function
   */
  registerHelper(name, helperFn) {
    this.helpers.set(name, helperFn);
  }

  /**
   * Get helper function
   * @param {string} name - Helper name
   * @returns {Function|undefined}
   */
  getHelper(name) {
    return this.helpers.get(name);
  }

  /**
   * Create a file output object
   * @param {string} path - File path relative to output root
   * @param {string} content - File content
   * @param {string} type - File type for tracking
   * @returns {Object}
   */
  createFile(path, content, type = 'generated') {
    return {
      path,
      content,
      type,
      generator: this.name,
      size: Buffer.byteLength(content, 'utf8')
    };
  }

  /**
   * Utility: Convert string to PascalCase
   * @param {string} str - Input string
   * @returns {string}
   */
  toPascalCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, (c) => c.toUpperCase());
  }

  /**
   * Utility: Convert string to camelCase
   * @param {string} str - Input string
   * @returns {string}
   */
  toCamelCase(str) {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Utility: Convert string to kebab-case
   * @param {string} str - Input string
   * @returns {string}
   */
  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Utility: Convert string to snake_case
   * @param {string} str - Input string
   * @returns {string}
   */
  toSnakeCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  /**
   * Utility: Pluralize a word (basic)
   * @param {string} word - Word to pluralize
   * @returns {string}
   */
  pluralize(word) {
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    }
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) {
      return word + 'es';
    }
    return word + 's';
  }

  /**
   * Utility: Singularize a word (basic)
   * @param {string} word - Word to singularize
   * @returns {string}
   */
  singularize(word) {
    if (word.endsWith('ies')) {
      return word.slice(0, -3) + 'y';
    }
    if (word.endsWith('es') && (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('ches') || word.endsWith('shes'))) {
      return word.slice(0, -2);
    }
    if (word.endsWith('s') && !word.endsWith('ss')) {
      return word.slice(0, -1);
    }
    return word;
  }

  /**
   * Utility: Generate import statement
   * @param {string} module - Module to import
   * @param {string|string[]} imports - What to import
   * @param {Object} options - Import options
   * @returns {string}
   */
  generateImport(module, imports, options = {}) {
    const { isDefault = false, isType = false } = options;
    
    if (isDefault) {
      return `import ${imports} from '${module}';`;
    }
    
    const importItems = Array.isArray(imports) ? imports.join(', ') : imports;
    const typeKeyword = isType ? 'type ' : '';
    
    return `import ${typeKeyword}{ ${importItems} } from '${module}';`;
  }

  /**
   * Utility: Generate export statement
   * @param {string|string[]} exports - What to export
   * @param {Object} options - Export options
   * @returns {string}
   */
  generateExport(exports, options = {}) {
    const { isDefault = false } = options;
    
    if (isDefault) {
      return `export default ${exports};`;
    }
    
    const exportItems = Array.isArray(exports) ? exports.join(', ') : exports;
    return `export { ${exportItems} };`;
  }

  /**
   * Utility: Indent lines
   * @param {string} text - Text to indent
   * @param {number} spaces - Number of spaces
   * @returns {string}
   */
  indent(text, spaces = 2) {
    const indent = ' '.repeat(spaces);
    return text
      .split('\n')
      .map(line => line ? indent + line : line)
      .join('\n');
  }

  /**
   * Utility: Wrap in comment block
   * @param {string} text - Comment text
   * @param {string} style - Comment style: 'jsdoc', 'block', 'line'
   * @returns {string}
   */
  wrapComment(text, style = 'jsdoc') {
    const lines = text.split('\n');
    
    switch (style) {
      case 'jsdoc':
        return [
          '/**',
          ...lines.map(line => ` * ${line}`),
          ' */'
        ].join('\n');
      
      case 'block':
        return [
          '/*',
          ...lines.map(line => ` * ${line}`),
          ' */'
        ].join('\n');
      
      case 'line':
        return lines.map(line => `// ${line}`).join('\n');
      
      default:
        return text;
    }
  }

  /**
   * Get generator info for logging
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.name,
      priority: this.priority,
      templates: Array.from(this.templates.keys()),
      helpers: Array.from(this.helpers.keys())
    };
  }
}

module.exports = BaseGenerator;
