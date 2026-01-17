/**
 * NestJSGenerator - NestJS Code Generator
 * 
 * Generates NestJS modules, controllers, services, DTOs,
 * guards, and interceptors with TypeScript.
 */

const BaseGenerator = require('./BaseGenerator');

class NestJSGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'NestJSGenerator',
      framework: 'nestjs',
      version: '10.x',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'nestjs';
    this.supportedTypes = ['module', 'controller', 'service', 'dto', 'guard', 'interceptor'];
  }

  /**
   * Generate a NestJS module
   */
  async generateModule(context) {
    const { 
      name, 
      controllers = [],
      providers = [],
      imports = [],
      exports = [],
      isGlobal = false
    } = context;
    
    const moduleName = this.toPascalCase(name) + 'Module';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      moduleName,
      fileName,
      controllers: this.buildControllers(controllers),
      providers: this.buildProviders(providers),
      imports: this.buildModuleImports(imports),
      exports: this.buildExports(exports),
      isGlobal,
      hasControllers: controllers.length > 0,
      hasProviders: providers.length > 0,
      hasImports: imports.length > 0,
      hasExports: exports.length > 0,
      fileImports: this.buildFileImports(context)
    };
    
    return this.renderTemplate('module', templateData);
  }

  /**
   * Generate a NestJS controller
   */
  async generateController(context) {
    const { 
      name, 
      path,
      routes = [],
      guards = [],
      interceptors = [],
      version
    } = context;
    
    const controllerName = this.toPascalCase(name) + 'Controller';
    const fileName = this.toKebabCase(name);
    const serviceName = this.toPascalCase(name) + 'Service';
    
    const templateData = {
      controllerName,
      fileName,
      path: path || this.toKebabCase(name),
      serviceName,
      serviceParam: this.toCamelCase(name) + 'Service',
      routes: this.buildRoutes(routes, name),
      guards: this.buildGuards(guards),
      interceptors: this.buildInterceptors(interceptors),
      version,
      hasRoutes: routes.length > 0,
      hasGuards: guards.length > 0,
      hasInterceptors: interceptors.length > 0,
      hasVersion: version !== undefined,
      imports: this.buildControllerImports(context)
    };
    
    return this.renderTemplate('controller', templateData);
  }

  /**
   * Generate a NestJS service
   */
  async generateService(context) {
    const { 
      name, 
      methods = [],
      inject = [],
      repository = null,
      cache = false
    } = context;
    
    const serviceName = this.toPascalCase(name) + 'Service';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      serviceName,
      fileName,
      methods: this.buildServiceMethods(methods),
      inject: this.buildInject(inject),
      repository: this.buildRepository(repository, name),
      cache,
      hasMethods: methods.length > 0,
      hasInject: inject.length > 0,
      hasRepository: repository !== null,
      hasCache: cache,
      imports: this.buildServiceImports(context)
    };
    
    return this.renderTemplate('service', templateData);
  }

  /**
   * Generate a NestJS DTO
   */
  async generateDto(context) {
    const { 
      name, 
      type = 'create',
      fields = [],
      extends: extendsDto = null,
      partialOf = null
    } = context;
    
    const dtoName = this.toPascalCase(name) + this.toPascalCase(type) + 'Dto';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      dtoName,
      fileName,
      type,
      fields: this.buildDtoFields(fields),
      extendsDto,
      partialOf,
      hasFields: fields.length > 0,
      hasExtends: extendsDto !== null,
      hasPartialOf: partialOf !== null,
      imports: this.buildDtoImports(context)
    };
    
    return this.renderTemplate('dto', templateData);
  }

  /**
   * Generate a NestJS guard
   */
  async generateGuard(context) {
    const { 
      name, 
      type = 'canActivate',
      inject = [],
      reflector = false
    } = context;
    
    const guardName = this.toPascalCase(name) + 'Guard';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      guardName,
      fileName,
      type,
      inject: this.buildInject(inject),
      reflector,
      hasInject: inject.length > 0,
      imports: this.buildGuardImports(context)
    };
    
    return this.renderTemplate('guard', templateData);
  }

  /**
   * Generate a NestJS interceptor
   */
  async generateInterceptor(context) {
    const { 
      name, 
      type = 'transform',
      inject = [],
      catchErrors = false
    } = context;
    
    const interceptorName = this.toPascalCase(name) + 'Interceptor';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      interceptorName,
      fileName,
      type,
      inject: this.buildInject(inject),
      catchErrors,
      hasInject: inject.length > 0,
      imports: this.buildInterceptorImports(context)
    };
    
    return this.renderTemplate('interceptor', templateData);
  }

  // Helper methods
  buildControllers(controllers) {
    return controllers.map(c => ({
      name: (c.name || c) + 'Controller',
      import: this.toKebabCase(c.name || c)
    }));
  }

  buildProviders(providers) {
    return providers.map(p => {
      if (typeof p === 'string') {
        return { name: p + 'Service', import: this.toKebabCase(p) };
      }
      return {
        name: p.name,
        import: p.import || this.toKebabCase(p.name),
        useClass: p.useClass,
        useValue: p.useValue,
        useFactory: p.useFactory
      };
    });
  }

  buildModuleImports(imports) {
    return imports.map(i => ({
      name: (i.name || i) + 'Module',
      forRoot: i.forRoot || false,
      async: i.async || false,
      config: i.config
    }));
  }

  buildExports(exports) {
    return exports.map(e => ({
      name: (e.name || e) + 'Service'
    }));
  }

  buildRoutes(routes, entityName) {
    if (routes.length === 0) {
      // Default CRUD routes
      return [
        { method: 'Get', path: '', handler: 'findAll', returns: `${this.toPascalCase(entityName)}[]` },
        { method: 'Get', path: ':id', handler: 'findOne', params: [{ name: 'id', type: 'string' }], returns: this.toPascalCase(entityName) },
        { method: 'Post', path: '', handler: 'create', body: `Create${this.toPascalCase(entityName)}Dto`, returns: this.toPascalCase(entityName) },
        { method: 'Patch', path: ':id', handler: 'update', params: [{ name: 'id', type: 'string' }], body: `Update${this.toPascalCase(entityName)}Dto`, returns: this.toPascalCase(entityName) },
        { method: 'Delete', path: ':id', handler: 'remove', params: [{ name: 'id', type: 'string' }], returns: 'void' }
      ];
    }
    
    return routes.map(r => ({
      method: this.toPascalCase(r.method || 'Get'),
      path: r.path || '',
      handler: r.handler || r.name,
      params: r.params || [],
      query: r.query || [],
      body: r.body,
      returns: r.returns || 'any'
    }));
  }

  buildGuards(guards) {
    return guards.map(g => ({
      name: (g.name || g) + 'Guard',
      import: this.toKebabCase(g.name || g)
    }));
  }

  buildInterceptors(interceptors) {
    return interceptors.map(i => ({
      name: (i.name || i) + 'Interceptor',
      import: this.toKebabCase(i.name || i)
    }));
  }

  buildServiceMethods(methods) {
    return methods.map(m => ({
      name: m.name,
      async: m.async !== false,
      params: m.params || [],
      returns: m.returns || 'Promise<any>',
      body: m.body || '// TODO: implement'
    }));
  }

  buildInject(inject) {
    return inject.map(i => ({
      name: i.name || i,
      type: i.type || this.toPascalCase(i.name || i),
      token: i.token
    }));
  }

  buildRepository(repository, name) {
    if (!repository) return null;
    return {
      entity: repository.entity || this.toPascalCase(name),
      type: repository.type || 'typeorm'
    };
  }

  buildDtoFields(fields) {
    return fields.map(f => ({
      name: f.name,
      type: f.type || 'string',
      required: f.required !== false,
      validators: this.buildValidators(f.validators || []),
      transform: f.transform,
      example: f.example,
      description: f.description
    }));
  }

  buildValidators(validators) {
    return validators.map(v => {
      if (typeof v === 'string') {
        return { name: v, options: {} };
      }
      return {
        name: v.name,
        options: v.options || {},
        message: v.message
      };
    });
  }

  buildFileImports(context) {
    const imports = [{ from: '@nestjs/common', items: ['Module'] }];
    
    if (context.isGlobal) {
      imports[0].items.push('Global');
    }
    
    return imports;
  }

  buildControllerImports(context) {
    const items = ['Controller'];
    
    const methods = new Set(context.routes?.map(r => r.method?.toLowerCase() || 'get') || ['get', 'post', 'patch', 'delete']);
    methods.forEach(m => items.push(this.toPascalCase(m)));
    
    if (context.routes?.some(r => r.params?.length)) items.push('Param');
    if (context.routes?.some(r => r.query?.length)) items.push('Query');
    if (context.routes?.some(r => r.body)) items.push('Body');
    if (context.guards?.length) items.push('UseGuards');
    if (context.interceptors?.length) items.push('UseInterceptors');
    if (context.version) items.push('Version');
    
    return [{ from: '@nestjs/common', items }];
  }

  buildServiceImports(context) {
    const items = ['Injectable'];
    
    if (context.inject?.length) items.push('Inject');
    if (context.cache) items.push('CACHE_MANAGER');
    
    const imports = [{ from: '@nestjs/common', items }];
    
    if (context.repository) {
      imports.push({ from: '@nestjs/typeorm', items: ['InjectRepository'] });
      imports.push({ from: 'typeorm', items: ['Repository'] });
    }
    
    return imports;
  }

  buildDtoImports(context) {
    const validators = new Set();
    
    context.fields?.forEach(f => {
      f.validators?.forEach(v => {
        validators.add(typeof v === 'string' ? v : v.name);
      });
    });
    
    const imports = [];
    
    if (validators.size > 0) {
      imports.push({ from: 'class-validator', items: Array.from(validators) });
    }
    
    if (context.fields?.some(f => f.transform)) {
      imports.push({ from: 'class-transformer', items: ['Transform', 'Type'] });
    }
    
    if (context.partialOf) {
      imports.push({ from: '@nestjs/mapped-types', items: ['PartialType'] });
    }
    
    return imports;
  }

  buildGuardImports(context) {
    const items = ['Injectable', 'CanActivate', 'ExecutionContext'];
    
    if (context.inject?.length) items.push('Inject');
    if (context.reflector) items.push('Reflector');
    
    return [{ from: '@nestjs/common', items }];
  }

  buildInterceptorImports(context) {
    const items = ['Injectable', 'NestInterceptor', 'ExecutionContext', 'CallHandler'];
    
    if (context.inject?.length) items.push('Inject');
    
    const imports = [{ from: '@nestjs/common', items }];
    imports.push({ from: 'rxjs', items: ['Observable'] });
    
    if (context.type === 'transform') {
      imports[1].items.push('map');
    }
    if (context.catchErrors) {
      imports[1].items.push('catchError');
    }
    
    return imports;
  }
}

module.exports = NestJSGenerator;
