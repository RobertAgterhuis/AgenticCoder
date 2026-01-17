/**
 * DotNetGenerator - .NET/C# Code Generator
 * 
 * Generates ASP.NET Core controllers, services, models,
 * DTOs, and middleware with C#.
 */

const BaseGenerator = require('./BaseGenerator');

class DotNetGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'DotNetGenerator',
      framework: 'dotnet',
      version: '8.x',
      language: 'csharp',
      ...options
    });
    
    this.templatePath = 'dotnet';
    this.supportedTypes = ['controller', 'service', 'model', 'dto', 'middleware'];
  }

  /**
   * Generate an ASP.NET Core controller
   */
  async generateController(context) {
    const { 
      name, 
      namespace,
      route,
      actions = [],
      attributes = [],
      inject = []
    } = context;
    
    const controllerName = this.toPascalCase(name) + 'Controller';
    const fileName = controllerName;
    
    const templateData = {
      controllerName,
      fileName,
      namespace: namespace || 'Api.Controllers',
      route: route || `api/[controller]`,
      actions: this.buildActions(actions, name),
      attributes: this.buildAttributes(attributes),
      inject: this.buildInject(inject),
      hasActions: actions.length > 0,
      hasAttributes: attributes.length > 0,
      hasInject: inject.length > 0,
      usings: this.buildControllerUsings(context)
    };
    
    return this.generateCSharpFile(templateData, 'controller');
  }

  /**
   * Generate a .NET service
   */
  async generateService(context) {
    const { 
      name, 
      namespace,
      interface: hasInterface = true,
      methods = [],
      inject = []
    } = context;
    
    const serviceName = this.toPascalCase(name) + 'Service';
    const interfaceName = 'I' + serviceName;
    const fileName = serviceName;
    
    const templateData = {
      serviceName,
      interfaceName,
      fileName,
      namespace: namespace || 'Api.Services',
      hasInterface,
      methods: this.buildServiceMethods(methods),
      inject: this.buildInject(inject),
      hasMethods: methods.length > 0,
      hasInject: inject.length > 0,
      usings: this.buildServiceUsings(context)
    };
    
    return this.generateCSharpFile(templateData, 'service');
  }

  /**
   * Generate an Entity Framework model
   */
  async generateModel(context) {
    const { 
      name, 
      namespace,
      properties = [],
      relationships = [],
      attributes = []
    } = context;
    
    const className = this.toPascalCase(name);
    const fileName = className;
    
    const templateData = {
      className,
      fileName,
      namespace: namespace || 'Api.Models',
      properties: this.buildProperties(properties),
      relationships: this.buildRelationships(relationships),
      attributes: this.buildClassAttributes(attributes),
      hasProperties: properties.length > 0,
      hasRelationships: relationships.length > 0,
      hasAttributes: attributes.length > 0,
      usings: this.buildModelUsings(context)
    };
    
    return this.generateCSharpFile(templateData, 'model');
  }

  /**
   * Generate a DTO
   */
  async generateDto(context) {
    const { 
      name, 
      namespace,
      type = 'response',
      properties = [],
      validators = []
    } = context;
    
    const className = this.toPascalCase(name) + this.getDtoTypeSuffix(type);
    const fileName = className;
    
    const templateData = {
      className,
      fileName,
      namespace: namespace || 'Api.DTOs',
      type,
      properties: this.buildDtoProperties(properties),
      validators: this.buildValidators(validators),
      hasProperties: properties.length > 0,
      hasValidators: validators.length > 0,
      usings: this.buildDtoUsings(context)
    };
    
    return this.generateCSharpFile(templateData, 'dto');
  }

  /**
   * Generate ASP.NET Core middleware
   */
  async generateMiddleware(context) {
    const { 
      name, 
      namespace,
      inject = [],
      async: isAsync = true
    } = context;
    
    const middlewareName = this.toPascalCase(name) + 'Middleware';
    const fileName = middlewareName;
    
    const templateData = {
      middlewareName,
      fileName,
      namespace: namespace || 'Api.Middleware',
      inject: this.buildInject(inject),
      isAsync,
      hasInject: inject.length > 0,
      usings: this.buildMiddlewareUsings(context)
    };
    
    return this.generateCSharpFile(templateData, 'middleware');
  }

  // C# code generation
  generateCSharpFile(data, type) {
    const lines = [];
    
    // Usings
    for (const using of data.usings) {
      lines.push(`using ${using};`);
    }
    lines.push('');
    
    // Namespace
    lines.push(`namespace ${data.namespace};`);
    lines.push('');
    
    switch (type) {
      case 'controller':
        this.generateControllerClass(lines, data);
        break;
      case 'service':
        this.generateServiceClass(lines, data);
        break;
      case 'model':
        this.generateModelClass(lines, data);
        break;
      case 'dto':
        this.generateDtoClass(lines, data);
        break;
      case 'middleware':
        this.generateMiddlewareClass(lines, data);
        break;
    }
    
    return lines.join('\n');
  }

  generateControllerClass(lines, data) {
    // Attributes
    for (const attr of data.attributes) {
      lines.push(`[${attr.name}${attr.args ? `(${attr.args})` : ''}]`);
    }
    lines.push('[ApiController]');
    lines.push(`[Route("${data.route}")]`);
    lines.push(`public class ${data.controllerName} : ControllerBase`);
    lines.push('{');
    
    // Fields
    for (const dep of data.inject) {
      lines.push(`    private readonly ${dep.type} _${this.toCamelCase(dep.name)};`);
    }
    if (data.inject.length) lines.push('');
    
    // Constructor
    if (data.inject.length) {
      const params = data.inject.map(d => `${d.type} ${this.toCamelCase(d.name)}`).join(', ');
      lines.push(`    public ${data.controllerName}(${params})`);
      lines.push('    {');
      for (const dep of data.inject) {
        lines.push(`        _${this.toCamelCase(dep.name)} = ${this.toCamelCase(dep.name)};`);
      }
      lines.push('    }');
      lines.push('');
    }
    
    // Actions
    for (const action of data.actions) {
      lines.push(`    [Http${action.method}${action.route ? `("${action.route}")` : ''}]`);
      if (action.produces) lines.push(`    [Produces("${action.produces}")]`);
      const params = action.params.map(p => `${p.attribute ? `[${p.attribute}] ` : ''}${p.type} ${p.name}`).join(', ');
      lines.push(`    public async Task<ActionResult<${action.returns}>> ${action.name}(${params})`);
      lines.push('    {');
      lines.push(`        ${action.body || '// TODO: implement'}`);
      lines.push('    }');
      lines.push('');
    }
    
    lines.push('}');
  }

  generateServiceClass(lines, data) {
    // Interface
    if (data.hasInterface) {
      lines.push(`public interface ${data.interfaceName}`);
      lines.push('{');
      for (const method of data.methods) {
        const params = method.params.map(p => `${p.type} ${p.name}`).join(', ');
        lines.push(`    Task<${method.returns}> ${method.name}(${params});`);
      }
      lines.push('}');
      lines.push('');
    }
    
    // Class
    lines.push(`public class ${data.serviceName}${data.hasInterface ? ` : ${data.interfaceName}` : ''}`);
    lines.push('{');
    
    // Fields
    for (const dep of data.inject) {
      lines.push(`    private readonly ${dep.type} _${this.toCamelCase(dep.name)};`);
    }
    if (data.inject.length) lines.push('');
    
    // Constructor
    if (data.inject.length) {
      const params = data.inject.map(d => `${d.type} ${this.toCamelCase(d.name)}`).join(', ');
      lines.push(`    public ${data.serviceName}(${params})`);
      lines.push('    {');
      for (const dep of data.inject) {
        lines.push(`        _${this.toCamelCase(dep.name)} = ${this.toCamelCase(dep.name)};`);
      }
      lines.push('    }');
      lines.push('');
    }
    
    // Methods
    for (const method of data.methods) {
      const params = method.params.map(p => `${p.type} ${p.name}`).join(', ');
      lines.push(`    public async Task<${method.returns}> ${method.name}(${params})`);
      lines.push('    {');
      lines.push(`        ${method.body || '// TODO: implement'}`);
      lines.push('    }');
      lines.push('');
    }
    
    lines.push('}');
  }

  generateModelClass(lines, data) {
    // Class attributes
    for (const attr of data.attributes) {
      lines.push(`[${attr.name}${attr.args ? `(${attr.args})` : ''}]`);
    }
    
    lines.push(`public class ${data.className}`);
    lines.push('{');
    
    // Properties
    for (const prop of data.properties) {
      for (const attr of prop.attributes || []) {
        lines.push(`    [${attr.name}${attr.args ? `(${attr.args})` : ''}]`);
      }
      lines.push(`    public ${prop.type}${prop.nullable ? '?' : ''} ${prop.name} { get; set; }${prop.default ? ` = ${prop.default};` : ''}`);
      lines.push('');
    }
    
    // Relationships
    for (const rel of data.relationships) {
      if (rel.type === 'collection') {
        lines.push(`    public ICollection<${rel.target}> ${rel.name} { get; set; } = new List<${rel.target}>();`);
      } else {
        lines.push(`    public ${rel.target}${rel.nullable ? '?' : ''} ${rel.name} { get; set; }`);
      }
      lines.push('');
    }
    
    lines.push('}');
  }

  generateDtoClass(lines, data) {
    lines.push(`public class ${data.className}`);
    lines.push('{');
    
    for (const prop of data.properties) {
      for (const val of prop.validators || []) {
        lines.push(`    [${val.name}${val.args ? `(${val.args})` : ''}]`);
      }
      lines.push(`    public ${prop.type}${prop.nullable ? '?' : ''} ${prop.name} { get; set; }${prop.default ? ` = ${prop.default};` : ''}`);
      lines.push('');
    }
    
    lines.push('}');
  }

  generateMiddlewareClass(lines, data) {
    lines.push(`public class ${data.middlewareName}`);
    lines.push('{');
    
    lines.push('    private readonly RequestDelegate _next;');
    for (const dep of data.inject) {
      lines.push(`    private readonly ${dep.type} _${this.toCamelCase(dep.name)};`);
    }
    lines.push('');
    
    // Constructor
    const ctorParams = ['RequestDelegate next', ...data.inject.map(d => `${d.type} ${this.toCamelCase(d.name)}`)].join(', ');
    lines.push(`    public ${data.middlewareName}(${ctorParams})`);
    lines.push('    {');
    lines.push('        _next = next;');
    for (const dep of data.inject) {
      lines.push(`        _${this.toCamelCase(dep.name)} = ${this.toCamelCase(dep.name)};`);
    }
    lines.push('    }');
    lines.push('');
    
    // InvokeAsync
    lines.push('    public async Task InvokeAsync(HttpContext context)');
    lines.push('    {');
    lines.push('        // TODO: Add middleware logic before');
    lines.push('        ');
    lines.push('        await _next(context);');
    lines.push('        ');
    lines.push('        // TODO: Add middleware logic after');
    lines.push('    }');
    
    lines.push('}');
    lines.push('');
    
    // Extension method
    lines.push(`public static class ${data.middlewareName}Extensions`);
    lines.push('{');
    lines.push(`    public static IApplicationBuilder Use${data.middlewareName.replace('Middleware', '')}(this IApplicationBuilder builder)`);
    lines.push('    {');
    lines.push(`        return builder.UseMiddleware<${data.middlewareName}>();`);
    lines.push('    }');
    lines.push('}');
  }

  // Helper methods
  buildActions(actions, entityName) {
    if (actions.length === 0) {
      const entity = this.toPascalCase(entityName);
      return [
        { method: 'Get', name: 'GetAll', returns: `IEnumerable<${entity}Dto>`, params: [], body: `return Ok(await _service.GetAllAsync());` },
        { method: 'Get', route: '{id}', name: 'GetById', returns: `${entity}Dto`, params: [{ name: 'id', type: 'int', attribute: 'FromRoute' }], body: `return Ok(await _service.GetByIdAsync(id));` },
        { method: 'Post', name: 'Create', returns: `${entity}Dto`, params: [{ name: 'dto', type: `Create${entity}Dto`, attribute: 'FromBody' }], body: `return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);` },
        { method: 'Put', route: '{id}', name: 'Update', returns: `${entity}Dto`, params: [{ name: 'id', type: 'int', attribute: 'FromRoute' }, { name: 'dto', type: `Update${entity}Dto`, attribute: 'FromBody' }], body: `return Ok(await _service.UpdateAsync(id, dto));` },
        { method: 'Delete', route: '{id}', name: 'Delete', returns: 'bool', params: [{ name: 'id', type: 'int', attribute: 'FromRoute' }], body: `await _service.DeleteAsync(id); return NoContent();` }
      ];
    }
    
    return actions.map(a => ({
      method: a.method || 'Get',
      route: a.route,
      name: a.name,
      returns: a.returns || 'object',
      params: a.params || [],
      produces: a.produces,
      body: a.body
    }));
  }

  buildAttributes(attributes) {
    return attributes.map(a => ({
      name: a.name || a,
      args: a.args
    }));
  }

  buildInject(inject) {
    return inject.map(i => ({
      name: i.name || i,
      type: i.type || `I${this.toPascalCase(i.name || i)}Service`
    }));
  }

  buildServiceMethods(methods) {
    return methods.map(m => ({
      name: m.name,
      returns: m.returns || 'object',
      params: m.params || [],
      body: m.body
    }));
  }

  buildProperties(properties) {
    return properties.map(p => ({
      name: this.toPascalCase(p.name),
      type: this.toCSharpType(p.type),
      nullable: p.nullable || false,
      default: p.default,
      attributes: this.buildPropertyAttributes(p)
    }));
  }

  buildPropertyAttributes(prop) {
    const attrs = [];
    if (prop.key) attrs.push({ name: 'Key' });
    if (prop.required) attrs.push({ name: 'Required' });
    if (prop.maxLength) attrs.push({ name: 'MaxLength', args: prop.maxLength.toString() });
    if (prop.column) attrs.push({ name: 'Column', args: `"${prop.column}"` });
    return attrs;
  }

  buildRelationships(relationships) {
    return relationships.map(r => ({
      name: r.name,
      target: r.target,
      type: r.type || 'reference',
      nullable: r.nullable || false
    }));
  }

  buildClassAttributes(attributes) {
    return attributes.map(a => ({
      name: a.name || a,
      args: a.args
    }));
  }

  buildDtoProperties(properties) {
    return properties.map(p => ({
      name: this.toPascalCase(p.name),
      type: this.toCSharpType(p.type),
      nullable: p.nullable || false,
      default: p.default,
      validators: this.buildValidators(p.validators || [])
    }));
  }

  buildValidators(validators) {
    return validators.map(v => ({
      name: v.name || v,
      args: v.args
    }));
  }

  getDtoTypeSuffix(type) {
    const suffixes = {
      request: 'Request',
      response: 'Dto',
      create: 'CreateDto',
      update: 'UpdateDto'
    };
    return suffixes[type] || 'Dto';
  }

  toCSharpType(type) {
    const typeMap = {
      string: 'string',
      number: 'decimal',
      integer: 'int',
      long: 'long',
      float: 'float',
      double: 'double',
      boolean: 'bool',
      date: 'DateOnly',
      datetime: 'DateTime',
      guid: 'Guid',
      uuid: 'Guid'
    };
    return typeMap[type?.toLowerCase()] || type || 'object';
  }

  buildControllerUsings(context) {
    return [
      'Microsoft.AspNetCore.Mvc',
      'System.Collections.Generic',
      'System.Threading.Tasks'
    ];
  }

  buildServiceUsings(context) {
    return [
      'System.Collections.Generic',
      'System.Threading.Tasks'
    ];
  }

  buildModelUsings(context) {
    const usings = ['System.ComponentModel.DataAnnotations'];
    if (context.relationships?.length) {
      usings.push('System.ComponentModel.DataAnnotations.Schema');
    }
    return usings;
  }

  buildDtoUsings(context) {
    const usings = [];
    if (context.validators?.length || context.properties?.some(p => p.validators?.length)) {
      usings.push('System.ComponentModel.DataAnnotations');
    }
    return usings;
  }

  buildMiddlewareUsings(context) {
    return [
      'Microsoft.AspNetCore.Http',
      'System.Threading.Tasks'
    ];
  }
}

module.exports = DotNetGenerator;
