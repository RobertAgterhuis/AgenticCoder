/**
 * Code Generation Templates - Main Index
 * 
 * Exports all template components and registrations
 */

const TemplateEngine = require('./TemplateEngine');
const TemplateRegistry = require('./TemplateRegistry');

// Framework templates
const reactTemplates = require('./react');
const expressTemplates = require('./express');
const bicepTemplates = require('./bicep');

/**
 * Create a fully configured template registry
 * @param {string} templatesRoot - Root directory for template files
 * @returns {Object} { engine, registry }
 */
function createTemplateSystem(templatesRoot) {
  const engine = new TemplateEngine(templatesRoot);
  const registry = new TemplateRegistry(engine);

  // Register React templates
  registry.register('react', 'component', 'react/component.template.js');
  registry.register('react', 'page', 'react/page.template.js');
  registry.register('react', 'hook', 'react/hook.template.js');
  registry.register('react', 'service', 'react/service.template.js');
  registry.register('react', 'context', 'react/context.template.js');

  // Register Express templates
  registry.register('express', 'route', 'express/route.template.js');
  registry.register('express', 'controller', 'express/controller.template.js');
  registry.register('express', 'service', 'express/service.template.js');
  registry.register('express', 'middleware', 'express/middleware.template.js');
  registry.register('express', 'model', 'express/model.template.js');

  // Register Bicep templates
  registry.register('bicep', 'module', 'bicep/core/module.template.js');
  registry.register('bicep', 'app-service', 'bicep/compute/app-service.template.js');
  registry.register('bicep', 'sql-database', 'bicep/data/sql-database.template.js');
  registry.register('bicep', 'storage', 'bicep/data/storage.template.js');
  registry.register('bicep', 'keyvault', 'bicep/security/keyvault.template.js');
  registry.register('bicep', 'app-insights', 'bicep/monitoring/app-insights.template.js');

  return { engine, registry };
}

module.exports = {
  // Core classes
  TemplateEngine,
  TemplateRegistry,
  
  // Framework templates
  react: reactTemplates,
  express: expressTemplates,
  bicep: bicepTemplates,
  
  // Factory function
  createTemplateSystem,
  
  // Supported frameworks
  supportedFrameworks: [
    'react',
    'vue',
    'nextjs',
    'angular',
    'express',
    'nestjs',
    'fastapi',
    'dotnet',
    'bicep'
  ],
  
  // Template metadata
  metadata: {
    version: '1.0.0',
    totalTemplates: 16, // Current count
    categories: {
      frontend: ['react', 'vue', 'nextjs', 'angular'],
      backend: ['express', 'nestjs', 'fastapi', 'dotnet'],
      infrastructure: ['bicep']
    }
  }
};
