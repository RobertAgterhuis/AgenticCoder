/**
 * Express Service Template
 * 
 * Generates a service class with:
 * - Repository/model integration
 * - Business logic methods
 * - TypeScript interfaces
 */

const template = `{{#each imports}}
import {{#if this.default}}{{this.default}}{{else}}{ {{join this.named}} }{{/if}} from '{{this.from}}';
{{/each}}
{{#if hasModel}}
import { {{modelName}} } from '../models/{{modelFile}}';
{{/if}}
{{#if hasRepository}}
import { {{repositoryName}} } from '../repositories/{{repositoryFile}}';
{{/if}}

{{#each types}}
export interface {{this.name}} {
{{#each this.fields}}
  {{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
}

{{/each}}
{{#if description}}/**
 * {{description}}
 */
{{/if}}export class {{serviceName}} {
{{#if hasConstructorDeps}}
  {{#each constructorDeps}}
  private {{this.name}}: {{this.type}};
  {{/each}}

  constructor({{#each constructorDeps}}{{this.name}}: {{this.type}}{{#unless @last}}, {{/unless}}{{/each}}) {
{{#each constructorDeps}}
    this.{{this.name}} = {{this.name}};
{{/each}}
  }
{{/if}}

{{#each methods}}
  {{#if this.description}}/**
   * {{this.description}}
{{#each this.paramDocs}}
   * @param {{this.name}} - {{this.description}}
{{/each}}
{{#if this.returns}}   * @returns {{this.returns}}{{/if}}
   */
  {{/if}}async {{this.name}}({{this.params}}){{#if this.returnType}}: Promise<{{this.returnType}}>{{/if}} {
{{this.body}}
  }

{{/each}}
}

{{#if createInstance}}
export const {{instanceName}} = new {{serviceName}}({{constructorArgs}});
{{/if}}
`;

/**
 * Default CRUD methods for a service
 */
const defaultCrudMethods = (modelName) => [
  {
    name: 'findAll',
    description: 'Find all records',
    params: 'options?: { skip?: number; take?: number }',
    returnType: `${modelName}[]`,
    body: `    return ${modelName}.find(options);`
  },
  {
    name: 'findById',
    description: 'Find record by ID',
    params: 'id: string',
    returnType: `${modelName} | null`,
    paramDocs: [{ name: 'id', description: 'Record ID' }],
    body: `    return ${modelName}.findById(id);`
  },
  {
    name: 'findOne',
    description: 'Find single record by criteria',
    params: 'criteria: Partial<' + modelName + '>',
    returnType: `${modelName} | null`,
    body: `    return ${modelName}.findOne(criteria);`
  },
  {
    name: 'create',
    description: 'Create new record',
    params: `data: Create${modelName}DTO`,
    returnType: modelName,
    paramDocs: [{ name: 'data', description: 'Record data' }],
    body: `    const record = new ${modelName}(data);
    return record.save();`
  },
  {
    name: 'update',
    description: 'Update existing record',
    params: `id: string, data: Update${modelName}DTO`,
    returnType: `${modelName} | null`,
    paramDocs: [
      { name: 'id', description: 'Record ID' },
      { name: 'data', description: 'Update data' }
    ],
    body: `    return ${modelName}.findByIdAndUpdate(id, data, { new: true });`
  },
  {
    name: 'delete',
    description: 'Delete record',
    params: 'id: string',
    returnType: 'boolean',
    paramDocs: [{ name: 'id', description: 'Record ID' }],
    body: `    const result = await ${modelName}.findByIdAndDelete(id);
    return !!result;`
  }
];

/**
 * Prepare variables for service generation
 */
function prepareVariables(config) {
  const modelName = config.modelName || config.name;
  
  return {
    serviceName: config.name.endsWith('Service') ? config.name : `${config.name}Service`,
    instanceName: config.instanceName || `${config.name.charAt(0).toLowerCase()}${config.name.slice(1)}Service`,
    description: config.description || '',
    hasModel: !!config.modelName,
    modelName: config.modelName || '',
    modelFile: config.modelFile || (config.modelName || '').toLowerCase(),
    hasRepository: !!config.repositoryName,
    repositoryName: config.repositoryName || '',
    repositoryFile: config.repositoryFile || (config.repositoryName || '').toLowerCase(),
    hasConstructorDeps: !!(config.constructorDeps && config.constructorDeps.length > 0),
    constructorDeps: config.constructorDeps || [],
    constructorArgs: (config.constructorDeps || []).map(d => d.defaultValue || 'null').join(', '),
    createInstance: config.createInstance !== false,
    methods: config.methods || defaultCrudMethods(modelName),
    types: config.types || [],
    imports: config.imports || []
  };
}

module.exports = {
  template,
  defaultCrudMethods,
  prepareVariables
};
