/**
 * AngularGenerator - Angular 17+ Code Generator
 * 
 * Generates Angular standalone components, services, directives,
 * guards, and modules with TypeScript.
 */

const BaseGenerator = require('./BaseGenerator');

class AngularGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'AngularGenerator',
      framework: 'angular',
      version: '17.x',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'angular';
    this.supportedTypes = ['component', 'service', 'directive', 'guard', 'module'];
  }

  /**
   * Generate an Angular component
   */
  async generateComponent(context) {
    const { 
      name, 
      selector,
      inputs = [],
      outputs = [],
      standalone = true,
      signals = true,
      changeDetection = 'OnPush',
      styles = 'scss'
    } = context;
    
    const componentName = this.toPascalCase(name) + 'Component';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      componentName,
      fileName,
      selector: selector || `app-${fileName}`,
      inputs: this.buildInputs(inputs, signals),
      outputs: this.buildOutputs(outputs, signals),
      standalone,
      useSignals: signals,
      changeDetection,
      styleUrl: `./${fileName}.component.${styles}`,
      templateUrl: `./${fileName}.component.html`,
      imports: this.buildComponentImports(context),
      hasInputs: inputs.length > 0,
      hasOutputs: outputs.length > 0
    };
    
    return this.renderTemplate('component', templateData);
  }

  /**
   * Generate an Angular service
   */
  async generateService(context) {
    const { 
      name, 
      providedIn = 'root',
      httpClient = false,
      endpoints = [],
      state = []
    } = context;
    
    const templateData = {
      serviceName: this.toPascalCase(name) + 'Service',
      fileName: this.toKebabCase(name),
      providedIn,
      httpClient,
      endpoints: this.buildEndpoints(endpoints),
      state: this.buildServiceState(state),
      hasEndpoints: endpoints.length > 0,
      hasState: state.length > 0,
      imports: this.buildServiceImports(context)
    };
    
    return this.renderTemplate('service', templateData);
  }

  /**
   * Generate an Angular directive
   */
  async generateDirective(context) {
    const { 
      name, 
      selector,
      standalone = true,
      inputs = [],
      hostListeners = [],
      hostBindings = []
    } = context;
    
    const directiveName = this.toPascalCase(name) + 'Directive';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      directiveName,
      fileName,
      selector: selector || `[app${this.toPascalCase(name)}]`,
      standalone,
      inputs: this.buildDirectiveInputs(inputs),
      hostListeners: this.buildHostListeners(hostListeners),
      hostBindings: this.buildHostBindings(hostBindings),
      hasInputs: inputs.length > 0,
      hasHostListeners: hostListeners.length > 0,
      hasHostBindings: hostBindings.length > 0,
      imports: this.buildDirectiveImports(context)
    };
    
    return this.renderTemplate('directive', templateData);
  }

  /**
   * Generate an Angular guard
   */
  async generateGuard(context) {
    const { 
      name, 
      type = 'canActivate',
      inject = [],
      async = true
    } = context;
    
    const guardName = this.toKebabCase(name);
    
    const templateData = {
      guardName,
      fileName: guardName,
      functionName: this.toCamelCase(name) + 'Guard',
      type,
      inject: this.buildInjects(inject),
      async,
      hasInject: inject.length > 0,
      imports: this.buildGuardImports(context, type)
    };
    
    return this.renderTemplate('guard', templateData);
  }

  /**
   * Generate an Angular module
   */
  async generateModule(context) {
    const { 
      name, 
      declarations = [],
      imports = [],
      exports = [],
      providers = [],
      routing = false
    } = context;
    
    const moduleName = this.toPascalCase(name) + 'Module';
    const fileName = this.toKebabCase(name);
    
    const templateData = {
      moduleName,
      fileName,
      declarations: this.buildDeclarations(declarations),
      imports: this.buildModuleImports(imports),
      exports: this.buildExports(exports),
      providers: this.buildProviders(providers),
      routing,
      routingModuleName: routing ? `${this.toPascalCase(name)}RoutingModule` : null,
      hasDeclarations: declarations.length > 0,
      hasImports: imports.length > 0,
      hasExports: exports.length > 0,
      hasProviders: providers.length > 0,
      fileImports: this.buildModuleFileImports(context)
    };
    
    return this.renderTemplate('module', templateData);
  }

  // Helper methods
  buildInputs(inputs, useSignals) {
    return inputs.map(input => ({
      name: input.name || input,
      type: input.type || 'any',
      required: input.required || false,
      alias: input.alias,
      transform: input.transform,
      useSignal: useSignals
    }));
  }

  buildOutputs(outputs, useSignals) {
    return outputs.map(output => ({
      name: output.name || output,
      type: output.type || 'void',
      alias: output.alias,
      useSignal: useSignals
    }));
  }

  buildEndpoints(endpoints) {
    return endpoints.map(ep => ({
      name: ep.name,
      method: (ep.method || 'GET').toLowerCase(),
      path: ep.path,
      params: ep.params || [],
      body: ep.body,
      response: ep.response || 'any',
      options: ep.options || {}
    }));
  }

  buildServiceState(state) {
    return state.map(s => ({
      name: s.name,
      type: s.type || 'any',
      initial: s.initial,
      private: s.private !== false
    }));
  }

  buildDirectiveInputs(inputs) {
    return inputs.map(input => ({
      name: input.name || input,
      type: input.type || 'any',
      setter: input.setter || false
    }));
  }

  buildHostListeners(listeners) {
    return listeners.map(l => ({
      event: l.event,
      args: l.args || ['$event'],
      handler: l.handler || `on${this.toPascalCase(l.event)}`
    }));
  }

  buildHostBindings(bindings) {
    return bindings.map(b => ({
      property: b.property,
      attribute: b.attribute,
      class: b.class,
      style: b.style
    }));
  }

  buildInjects(inject) {
    return inject.map(i => ({
      name: i.name || i,
      type: i.type || this.toPascalCase(i.name || i),
      private: i.private !== false
    }));
  }

  buildDeclarations(declarations) {
    return declarations.map(d => ({
      name: d.name || d,
      type: d.type || 'component'
    }));
  }

  buildModuleImports(imports) {
    return imports.map(i => ({
      name: i.name || i,
      forRoot: i.forRoot || false,
      config: i.config
    }));
  }

  buildExports(exports) {
    return exports.map(e => ({
      name: e.name || e
    }));
  }

  buildProviders(providers) {
    return providers.map(p => {
      if (typeof p === 'string') return { name: p };
      return {
        name: p.name,
        useClass: p.useClass,
        useValue: p.useValue,
        useFactory: p.useFactory,
        deps: p.deps || []
      };
    });
  }

  buildComponentImports(context) {
    const imports = [
      { from: '@angular/core', items: ['Component', 'ChangeDetectionStrategy'] }
    ];
    
    if (context.signals) {
      imports[0].items.push('input', 'output');
    } else {
      imports[0].items.push('Input', 'Output', 'EventEmitter');
    }
    
    if (context.standalone) {
      imports.push({ from: '@angular/common', items: ['CommonModule'] });
    }
    
    return imports;
  }

  buildServiceImports(context) {
    const imports = [{ from: '@angular/core', items: ['Injectable'] }];
    
    if (context.httpClient) {
      imports.push({ from: '@angular/common/http', items: ['HttpClient'] });
    }
    
    if (context.state?.length) {
      imports[0].items.push('signal');
    }
    
    return imports;
  }

  buildDirectiveImports(context) {
    const items = ['Directive'];
    if (context.inputs?.length) items.push('Input');
    if (context.hostListeners?.length) items.push('HostListener');
    if (context.hostBindings?.length) items.push('HostBinding');
    
    return [{ from: '@angular/core', items }];
  }

  buildGuardImports(context, type) {
    const imports = [{ from: '@angular/core', items: ['inject'] }];
    
    const guardTypes = {
      canActivate: 'CanActivateFn',
      canActivateChild: 'CanActivateChildFn',
      canDeactivate: 'CanDeactivateFn',
      canMatch: 'CanMatchFn'
    };
    
    imports.push({ from: '@angular/router', items: [guardTypes[type] || 'CanActivateFn', 'Router'] });
    
    return imports;
  }

  buildModuleFileImports(context) {
    const imports = [{ from: '@angular/core', items: ['NgModule'] }];
    
    if (context.imports?.some(i => i.name === 'CommonModule' || i === 'CommonModule')) {
      imports.push({ from: '@angular/common', items: ['CommonModule'] });
    }
    
    if (context.routing) {
      imports.push({ from: '@angular/router', items: ['RouterModule'] });
    }
    
    return imports;
  }
}

module.exports = AngularGenerator;
