/**
 * FastAPIGenerator - FastAPI Code Generator
 * 
 * Generates FastAPI routers, models, schemas, services,
 * and dependencies for Python applications.
 */

const BaseGenerator = require('./BaseGenerator');

class FastAPIGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'FastAPIGenerator',
      framework: 'fastapi',
      version: '0.100+',
      language: 'python',
      ...options
    });
    
    this.templatePath = 'fastapi';
    this.supportedTypes = ['router', 'model', 'schema', 'service', 'dependency'];
  }

  /**
   * Generate a FastAPI router
   */
  async generateRouter(context) {
    const { 
      name, 
      prefix,
      tags = [],
      routes = [],
      dependencies = []
    } = context;
    
    const fileName = this.toSnakeCase(name);
    
    const templateData = {
      routerName: fileName + '_router',
      fileName,
      prefix: prefix || `/${fileName}`,
      tags: tags.length > 0 ? tags : [this.toPascalCase(name)],
      routes: this.buildRoutes(routes, name),
      dependencies: this.buildDependencies(dependencies),
      hasRoutes: routes.length > 0,
      hasDependencies: dependencies.length > 0,
      imports: this.buildRouterImports(context)
    };
    
    return this.renderTemplate('router', templateData);
  }

  /**
   * Generate a SQLAlchemy model
   */
  async generateModel(context) {
    const { 
      name, 
      tableName,
      columns = [],
      relationships = [],
      mixins = [],
      indexes = []
    } = context;
    
    const className = this.toPascalCase(name);
    const fileName = this.toSnakeCase(name);
    
    const templateData = {
      className,
      fileName,
      tableName: tableName || this.toSnakeCase(name) + 's',
      columns: this.buildColumns(columns),
      relationships: this.buildRelationships(relationships),
      mixins,
      indexes: this.buildIndexes(indexes),
      hasColumns: columns.length > 0,
      hasRelationships: relationships.length > 0,
      hasMixins: mixins.length > 0,
      hasIndexes: indexes.length > 0,
      imports: this.buildModelImports(context)
    };
    
    return this.renderTemplate('model', templateData);
  }

  /**
   * Generate a Pydantic schema
   */
  async generateSchema(context) {
    const { 
      name, 
      type = 'base',
      fields = [],
      validators = [],
      config = {}
    } = context;
    
    const className = this.toPascalCase(name) + this.getSchemaTypeSuffix(type);
    const fileName = this.toSnakeCase(name);
    
    const templateData = {
      className,
      fileName,
      type,
      fields: this.buildSchemaFields(fields),
      validators: this.buildValidators(validators),
      config: this.buildSchemaConfig(config),
      hasFields: fields.length > 0,
      hasValidators: validators.length > 0,
      hasConfig: Object.keys(config).length > 0,
      imports: this.buildSchemaImports(context)
    };
    
    return this.renderTemplate('schema', templateData);
  }

  /**
   * Generate a service class
   */
  async generateService(context) {
    const { 
      name, 
      methods = [],
      inject = [],
      repository = null
    } = context;
    
    const className = this.toPascalCase(name) + 'Service';
    const fileName = this.toSnakeCase(name);
    
    const templateData = {
      className,
      fileName,
      methods: this.buildServiceMethods(methods),
      inject: this.buildInject(inject),
      repository: this.buildRepository(repository, name),
      hasMethods: methods.length > 0,
      hasInject: inject.length > 0,
      hasRepository: repository !== null,
      imports: this.buildServiceImports(context)
    };
    
    return this.renderTemplate('service', templateData);
  }

  /**
   * Generate a dependency
   */
  async generateDependency(context) {
    const { 
      name, 
      type = 'function',
      params = [],
      yields = false,
      async: isAsync = false
    } = context;
    
    const funcName = 'get_' + this.toSnakeCase(name);
    const fileName = this.toSnakeCase(name);
    
    const templateData = {
      funcName,
      fileName,
      type,
      params: this.buildDependencyParams(params),
      yields,
      isAsync,
      hasParams: params.length > 0,
      imports: this.buildDependencyImports(context)
    };
    
    return this.renderTemplate('dependency', templateData);
  }

  // Helper methods
  buildRoutes(routes, entityName) {
    if (routes.length === 0) {
      // Default CRUD routes
      const schema = this.toPascalCase(entityName);
      return [
        { method: 'get', path: '/', handler: `get_${this.toSnakeCase(entityName)}s`, returns: `list[${schema}Response]`, summary: `Get all ${entityName}s` },
        { method: 'get', path: '/{id}', handler: `get_${this.toSnakeCase(entityName)}`, params: [{ name: 'id', type: 'int' }], returns: `${schema}Response`, summary: `Get ${entityName} by ID` },
        { method: 'post', path: '/', handler: `create_${this.toSnakeCase(entityName)}`, body: `${schema}Create`, returns: `${schema}Response`, status: 201, summary: `Create ${entityName}` },
        { method: 'put', path: '/{id}', handler: `update_${this.toSnakeCase(entityName)}`, params: [{ name: 'id', type: 'int' }], body: `${schema}Update`, returns: `${schema}Response`, summary: `Update ${entityName}` },
        { method: 'delete', path: '/{id}', handler: `delete_${this.toSnakeCase(entityName)}`, params: [{ name: 'id', type: 'int' }], returns: 'None', status: 204, summary: `Delete ${entityName}` }
      ];
    }
    
    return routes.map(r => ({
      method: r.method?.toLowerCase() || 'get',
      path: r.path || '/',
      handler: r.handler || r.name,
      params: r.params || [],
      query: r.query || [],
      body: r.body,
      returns: r.returns || 'Any',
      status: r.status || 200,
      summary: r.summary,
      description: r.description
    }));
  }

  buildDependencies(dependencies) {
    return dependencies.map(d => ({
      name: d.name || d,
      type: d.type,
      import: d.import
    }));
  }

  buildColumns(columns) {
    return columns.map(c => ({
      name: c.name,
      type: this.toPythonSqlType(c.type),
      primary: c.primary || false,
      nullable: c.nullable !== false,
      unique: c.unique || false,
      index: c.index || false,
      default: c.default,
      foreignKey: c.foreignKey
    }));
  }

  buildRelationships(relationships) {
    return relationships.map(r => ({
      name: r.name,
      type: r.type || 'one-to-many',
      target: r.target,
      backPopulates: r.backPopulates,
      lazy: r.lazy || 'select'
    }));
  }

  buildIndexes(indexes) {
    return indexes.map(i => ({
      name: i.name,
      columns: i.columns,
      unique: i.unique || false
    }));
  }

  buildSchemaFields(fields) {
    return fields.map(f => ({
      name: f.name,
      type: this.toPythonType(f.type),
      required: f.required !== false,
      default: f.default,
      alias: f.alias,
      description: f.description,
      example: f.example,
      constraints: f.constraints || []
    }));
  }

  buildValidators(validators) {
    return validators.map(v => ({
      name: v.name,
      field: v.field,
      mode: v.mode || 'after',
      body: v.body || 'return v'
    }));
  }

  buildSchemaConfig(config) {
    return {
      fromAttributes: config.fromAttributes !== false,
      populateByName: config.populateByName || false,
      useEnumValues: config.useEnumValues || false,
      jsonSchemaExtra: config.jsonSchemaExtra,
      ...config
    };
  }

  buildServiceMethods(methods) {
    return methods.map(m => ({
      name: m.name,
      async: m.async !== false,
      params: m.params || [],
      returns: m.returns || 'Any',
      body: m.body || 'pass  # TODO: implement'
    }));
  }

  buildInject(inject) {
    return inject.map(i => ({
      name: i.name || i,
      type: i.type || 'Any'
    }));
  }

  buildRepository(repository, name) {
    if (!repository) return null;
    return {
      model: repository.model || this.toPascalCase(name),
      type: repository.type || 'sqlalchemy'
    };
  }

  buildDependencyParams(params) {
    return params.map(p => ({
      name: p.name,
      type: p.type || 'Any',
      default: p.default
    }));
  }

  getSchemaTypeSuffix(type) {
    const suffixes = {
      base: '',
      create: 'Create',
      update: 'Update',
      response: 'Response',
      indb: 'InDB'
    };
    return suffixes[type] || '';
  }

  toPythonType(type) {
    const typeMap = {
      string: 'str',
      number: 'float',
      integer: 'int',
      boolean: 'bool',
      array: 'list',
      object: 'dict',
      date: 'date',
      datetime: 'datetime',
      uuid: 'UUID',
      email: 'EmailStr',
      url: 'HttpUrl'
    };
    return typeMap[type?.toLowerCase()] || type || 'Any';
  }

  toPythonSqlType(type) {
    const typeMap = {
      string: 'String',
      text: 'Text',
      integer: 'Integer',
      bigint: 'BigInteger',
      float: 'Float',
      decimal: 'Numeric',
      boolean: 'Boolean',
      date: 'Date',
      datetime: 'DateTime',
      time: 'Time',
      uuid: 'UUID',
      json: 'JSON',
      binary: 'LargeBinary'
    };
    return typeMap[type?.toLowerCase()] || 'String';
  }

  toSnakeCase(str) {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/-/g, '_');
  }

  buildRouterImports(context) {
    const imports = [
      { from: 'fastapi', items: ['APIRouter', 'Depends', 'HTTPException', 'status'] }
    ];
    return imports;
  }

  buildModelImports(context) {
    const items = ['Column', 'String', 'Integer', 'Boolean', 'DateTime', 'ForeignKey'];
    
    if (context.relationships?.length) {
      items.push('relationship');
    }
    
    const imports = [
      { from: 'sqlalchemy', items },
      { from: 'sqlalchemy.orm', items: ['Mapped', 'mapped_column'] }
    ];
    
    return imports;
  }

  buildSchemaImports(context) {
    const items = ['BaseModel', 'Field'];
    
    if (context.config?.fromAttributes) {
      items.push('ConfigDict');
    }
    
    if (context.validators?.length) {
      items.push('field_validator');
    }
    
    const imports = [{ from: 'pydantic', items }];
    
    // Add typing imports
    const typingItems = [];
    if (context.fields?.some(f => !f.required)) typingItems.push('Optional');
    if (context.fields?.some(f => f.type === 'array')) typingItems.push('List');
    if (typingItems.length) {
      imports.push({ from: 'typing', items: typingItems });
    }
    
    return imports;
  }

  buildServiceImports(context) {
    const imports = [];
    
    if (context.repository) {
      imports.push({ from: 'sqlalchemy.orm', items: ['Session'] });
    }
    
    return imports;
  }

  buildDependencyImports(context) {
    const imports = [{ from: 'fastapi', items: ['Depends'] }];
    
    if (context.yields) {
      imports.push({ from: 'typing', items: ['Generator'] });
    }
    
    return imports;
  }
}

module.exports = FastAPIGenerator;
