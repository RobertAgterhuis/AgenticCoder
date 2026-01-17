/**
 * Express Route Template
 * 
 * Generates an Express router with:
 * - RESTful route definitions
 * - Middleware support
 * - Controller binding
 */

const template = `import { Router } from 'express';
{{#each controllerImports}}
import { {{this.name}} } from '../controllers/{{this.file}}';
{{/each}}
{{#if hasMiddleware}}
{{#each middlewareImports}}
import { {{join this.named}} } from '{{this.from}}';
{{/each}}
{{/if}}
{{#if hasValidation}}
import { {{join validationImports}} } from '../validators/{{validationFile}}';
{{/if}}

const router = Router();

{{#if description}}/**
 * {{description}}
 * Base path: {{basePath}}
 */
{{/if}}
{{#each routes}}
{{#if this.description}}
/**
 * {{this.description}}
 * @route {{uppercase this.method}} {{this.fullPath}}
 */
{{/if}}
router.{{this.method}}(
  '{{this.path}}'{{#if this.middleware}},
  {{#each this.middleware}}{{this}},
  {{/each}}{{/if}}{{#if this.validation}},
  {{this.validation}},{{/if}}
  {{this.controller}}.{{this.handler}}
);

{{/each}}
export default router;
`;

/**
 * Prepare variables for route generation
 */
function prepareVariables(config) {
  const routes = (config.routes || []).map(route => ({
    method: route.method || 'get',
    path: route.path || '/',
    fullPath: `${config.basePath || ''}${route.path || '/'}`,
    description: route.description || '',
    controller: route.controller || config.controllerName,
    handler: route.handler,
    middleware: route.middleware || [],
    validation: route.validation || ''
  }));

  return {
    description: config.description || '',
    basePath: config.basePath || '',
    routes,
    controllerImports: config.controllerImports || [
      { name: config.controllerName, file: config.controllerFile || config.controllerName.toLowerCase() }
    ],
    hasMiddleware: routes.some(r => r.middleware && r.middleware.length > 0) || (config.middlewareImports && config.middlewareImports.length > 0),
    middlewareImports: config.middlewareImports || [],
    hasValidation: routes.some(r => r.validation),
    validationImports: config.validationImports || [],
    validationFile: config.validationFile || ''
  };
}

module.exports = {
  template,
  prepareVariables
};
