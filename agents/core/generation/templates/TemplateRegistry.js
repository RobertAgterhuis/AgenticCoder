/**
 * TemplateRegistry - Organizes and discovers templates by framework and type
 * 
 * Provides:
 * - Template registration and lookup
 * - Auto-discovery from directory structure
 * - Fallback to default templates
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateRegistry {
  /**
   * @param {import('./TemplateEngine')} templateEngine - TemplateEngine instance
   */
  constructor(templateEngine) {
    this.engine = templateEngine;
    this.templates = new Map(); // Map<framework, Map<type, templatePath>>
    this.defaults = new Map();  // Map<type, templatePath>
  }

  /**
   * Register a template
   * @param {string} framework - Framework name (react, express, etc.)
   * @param {string} componentType - Component type (component, service, etc.)
   * @param {string} templatePath - Path relative to templates root
   */
  register(framework, componentType, templatePath) {
    if (!this.templates.has(framework)) {
      this.templates.set(framework, new Map());
    }
    this.templates.get(framework).set(componentType, templatePath);
  }

  /**
   * Register a default template for a component type
   * @param {string} componentType - Component type
   * @param {string} templatePath - Path relative to templates root
   */
  registerDefault(componentType, templatePath) {
    this.defaults.set(componentType, templatePath);
  }

  /**
   * Get template path for framework/type combination
   * @param {string} framework - Framework name
   * @param {string} componentType - Component type
   * @returns {string|null}
   */
  getTemplate(framework, componentType) {
    // Try framework-specific template
    const frameworkTemplates = this.templates.get(framework);
    if (frameworkTemplates && frameworkTemplates.has(componentType)) {
      return frameworkTemplates.get(componentType);
    }

    // Try default template
    if (this.defaults.has(componentType)) {
      return this.defaults.get(componentType);
    }

    return null;
  }

  /**
   * Check if template exists
   * @param {string} framework - Framework name
   * @param {string} componentType - Component type
   * @returns {boolean}
   */
  hasTemplate(framework, componentType) {
    return this.getTemplate(framework, componentType) !== null;
  }

  /**
   * Render a template
   * @param {string} framework - Framework name
   * @param {string} componentType - Component type
   * @param {Object} variables - Template variables
   * @returns {Promise<string>}
   */
  async render(framework, componentType, variables = {}) {
    const templatePath = this.getTemplate(framework, componentType);
    
    if (!templatePath) {
      throw new Error(`No template found for ${framework}/${componentType}`);
    }

    return await this.engine.render(templatePath, variables);
  }

  /**
   * List all templates for a framework
   * @param {string} framework - Framework name
   * @returns {string[]}
   */
  listTemplates(framework) {
    const frameworkTemplates = this.templates.get(framework);
    if (!frameworkTemplates) {
      return [];
    }
    return Array.from(frameworkTemplates.keys());
  }

  /**
   * List all registered frameworks
   * @returns {string[]}
   */
  listFrameworks() {
    return Array.from(this.templates.keys());
  }

  /**
   * Auto-discover templates from directory structure
   * @param {string} rootPath - Root path relative to templates root
   * @returns {Promise<number>} Number of templates discovered
   */
  async discoverTemplates(rootPath = '') {
    const fullPath = path.join(this.engine.templatesRoot, rootPath);
    let count = 0;

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Framework directory
          const framework = entry.name;
          const frameworkPath = path.join(rootPath, framework);
          
          // Discover templates in framework directory
          const templateCount = await this.discoverFrameworkTemplates(framework, frameworkPath);
          count += templateCount;
        }
      }
    } catch (error) {
      console.warn(`Failed to discover templates in '${rootPath}': ${error.message}`);
    }

    return count;
  }

  /**
   * Discover templates for a specific framework
   * @param {string} framework - Framework name
   * @param {string} frameworkPath - Path to framework directory
   * @returns {Promise<number>}
   */
  async discoverFrameworkTemplates(framework, frameworkPath) {
    const fullPath = path.join(this.engine.templatesRoot, frameworkPath);
    let count = 0;

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && this.isTemplateFile(entry.name)) {
          const componentType = this.extractComponentType(entry.name);
          const templatePath = path.join(frameworkPath, entry.name);
          
          this.register(framework, componentType, templatePath);
          count++;
        } else if (entry.isDirectory()) {
          // Subdirectory (e.g., bicep/compute/)
          const subPath = path.join(frameworkPath, entry.name);
          const subCount = await this.discoverSubdirectoryTemplates(framework, subPath, entry.name);
          count += subCount;
        }
      }
    } catch (error) {
      console.warn(`Failed to discover templates for '${framework}': ${error.message}`);
    }

    return count;
  }

  /**
   * Discover templates in a subdirectory
   * @param {string} framework - Framework name
   * @param {string} subPath - Path to subdirectory
   * @param {string} category - Category name from directory
   * @returns {Promise<number>}
   */
  async discoverSubdirectoryTemplates(framework, subPath, category) {
    const fullPath = path.join(this.engine.templatesRoot, subPath);
    let count = 0;

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && this.isTemplateFile(entry.name)) {
          const baseName = this.extractComponentType(entry.name);
          const componentType = `${category}/${baseName}`;
          const templatePath = path.join(subPath, entry.name);
          
          this.register(framework, componentType, templatePath);
          count++;
        }
      }
    } catch (error) {
      console.warn(`Failed to discover templates in '${subPath}': ${error.message}`);
    }

    return count;
  }

  /**
   * Check if file is a template file
   * @param {string} filename - File name
   * @returns {boolean}
   */
  isTemplateFile(filename) {
    return filename.includes('.template.') || 
           filename.endsWith('.template') ||
           filename.endsWith('.tpl.js') ||
           filename.endsWith('.tpl');
  }

  /**
   * Extract component type from template filename
   * @param {string} filename - File name
   * @returns {string}
   */
  extractComponentType(filename) {
    // Remove extension and .template suffix
    return filename
      .replace(/\.template\.[^.]+$/, '')
      .replace(/\.template$/, '')
      .replace(/\.tpl\.[^.]+$/, '')
      .replace(/\.tpl$/, '');
  }

  /**
   * Get registry summary
   * @returns {Object}
   */
  getSummary() {
    const summary = {
      frameworks: {},
      defaults: Array.from(this.defaults.keys()),
      totalTemplates: 0
    };

    for (const [framework, templates] of this.templates) {
      const types = Array.from(templates.keys());
      summary.frameworks[framework] = {
        count: types.length,
        types
      };
      summary.totalTemplates += types.length;
    }

    return summary;
  }

  /**
   * Export registry as JSON (for caching/debugging)
   * @returns {Object}
   */
  toJSON() {
    const data = {
      templates: {},
      defaults: {}
    };

    for (const [framework, templates] of this.templates) {
      data.templates[framework] = Object.fromEntries(templates);
    }

    data.defaults = Object.fromEntries(this.defaults);

    return data;
  }

  /**
   * Import registry from JSON
   * @param {Object} data - JSON data
   */
  fromJSON(data) {
    // Clear existing
    this.templates.clear();
    this.defaults.clear();

    // Load templates
    for (const [framework, templates] of Object.entries(data.templates || {})) {
      this.templates.set(framework, new Map(Object.entries(templates)));
    }

    // Load defaults
    for (const [type, path] of Object.entries(data.defaults || {})) {
      this.defaults.set(type, path);
    }
  }
}

module.exports = TemplateRegistry;
