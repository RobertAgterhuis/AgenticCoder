/**
 * Express Controller Template
 * 
 * Generates an Express controller with:
 * - Request/Response typing
 * - Error handling
 * - Service integration
 */

const template = `import { Request, Response, NextFunction } from 'express';
{{#each serviceImports}}
import { {{this.name}} } from '../services/{{this.file}}';
{{/each}}
{{#each imports}}
import {{#if this.default}}{{this.default}}{{else}}{ {{join this.named}} }{{/if}} from '{{this.from}}';
{{/each}}

{{#if hasTypes}}
{{#each types}}
interface {{this.name}} {
{{#each this.fields}}
  {{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
}

{{/each}}
{{/if}}
{{#if description}}/**
 * {{description}}
 */
{{/if}}export const {{controllerName}} = {
{{#each methods}}
  {{#if this.description}}/**
   * {{this.description}}
   */
  {{/if}}async {{this.name}}(
    req: Request{{#if this.reqParams}}<{{this.reqParams}}>{{/if}}{{#if this.reqBody}}<any, any, {{this.reqBody}}>{{/if}},
    res: Response{{#if this.resBody}}<{{this.resBody}}>{{/if}},
    next: NextFunction
  ): Promise<void> {
    try {
{{this.body}}
    } catch (error) {
      next(error);
    }
  },

{{/each}}
};
`;

/**
 * Default CRUD methods
 */
const defaultCrudMethods = (resourceName, serviceName) => [
  {
    name: 'getAll',
    description: `Get all ${resourceName}s`,
    body: `      const items = await ${serviceName}.findAll();
      res.json(items);`
  },
  {
    name: 'getById',
    description: `Get ${resourceName} by ID`,
    reqParams: '{ id: string }',
    body: `      const { id } = req.params;
      const item = await ${serviceName}.findById(id);
      
      if (!item) {
        res.status(404).json({ error: '${resourceName} not found' });
        return;
      }
      
      res.json(item);`
  },
  {
    name: 'create',
    description: `Create new ${resourceName}`,
    reqBody: 'CreateDTO',
    body: `      const data = req.body;
      const item = await ${serviceName}.create(data);
      res.status(201).json(item);`
  },
  {
    name: 'update',
    description: `Update ${resourceName}`,
    reqParams: '{ id: string }',
    reqBody: 'UpdateDTO',
    body: `      const { id } = req.params;
      const data = req.body;
      const item = await ${serviceName}.update(id, data);
      
      if (!item) {
        res.status(404).json({ error: '${resourceName} not found' });
        return;
      }
      
      res.json(item);`
  },
  {
    name: 'delete',
    description: `Delete ${resourceName}`,
    reqParams: '{ id: string }',
    body: `      const { id } = req.params;
      const deleted = await ${serviceName}.delete(id);
      
      if (!deleted) {
        res.status(404).json({ error: '${resourceName} not found' });
        return;
      }
      
      res.status(204).send();`
  }
];

/**
 * Prepare variables for controller generation
 */
function prepareVariables(config) {
  const serviceName = config.serviceName || `${config.name}Service`;
  
  return {
    controllerName: config.name,
    description: config.description || '',
    hasTypes: !!(config.types && config.types.length > 0),
    types: config.types || [],
    methods: config.methods || defaultCrudMethods(config.resourceName || config.name, serviceName),
    serviceImports: config.serviceImports || [
      { name: serviceName, file: config.serviceFile || serviceName.toLowerCase() }
    ],
    imports: config.imports || []
  };
}

module.exports = {
  template,
  defaultCrudMethods,
  prepareVariables
};
