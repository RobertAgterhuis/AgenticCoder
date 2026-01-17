/**
 * VueGenerator - Vue 3 Code Generator
 * 
 * Generates Vue 3 components, composables, services, and stores
 * using Composition API with TypeScript support.
 */

const BaseGenerator = require('./BaseGenerator');
const Handlebars = require('handlebars');

class VueGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'VueGenerator',
      framework: 'vue',
      version: '3.x',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'vue';
    this.supportedTypes = ['component', 'page', 'composable', 'service', 'store'];
  }

  /**
   * Generate a Vue component
   */
  async generateComponent(context) {
    const { name, props = [], emits = [], slots = [], features = {} } = context;
    
    const templateData = {
      componentName: this.toPascalCase(name),
      fileName: this.toKebabCase(name),
      props: this.buildProps(props),
      emits: this.buildEmits(emits),
      slots: this.buildSlots(slots),
      hasProps: props.length > 0,
      hasEmits: emits.length > 0,
      hasSlots: slots.length > 0,
      useTypeScript: features.typescript !== false,
      useScriptSetup: features.scriptSetup !== false,
      useScopedStyles: features.scopedStyles !== false,
      imports: this.buildImports(context),
      ...features
    };
    
    return this.renderTemplate('component', templateData);
  }

  /**
   * Generate a Vue page component
   */
  async generatePage(context) {
    const { name, route, layout, middleware = [], meta = {} } = context;
    
    const templateData = {
      pageName: this.toPascalCase(name),
      fileName: this.toKebabCase(name),
      route: this.buildRoute(route, name),
      layout: layout || 'default',
      middleware,
      meta: {
        title: meta.title || this.toPascalCase(name),
        description: meta.description || '',
        requiresAuth: meta.requiresAuth || false,
        ...meta
      },
      hasMiddleware: middleware.length > 0,
      imports: this.buildPageImports(context)
    };
    
    return this.renderTemplate('page', templateData);
  }

  /**
   * Generate a Vue composable (hook)
   */
  async generateComposable(context) {
    const { name, state = [], methods = [], computed = [], watchers = [] } = context;
    
    const templateData = {
      composableName: this.toComposableName(name),
      fileName: this.toKebabCase(name),
      state: this.buildState(state),
      methods: this.buildMethods(methods),
      computed: this.buildComputed(computed),
      watchers: this.buildWatchers(watchers),
      hasState: state.length > 0,
      hasMethods: methods.length > 0,
      hasComputed: computed.length > 0,
      hasWatchers: watchers.length > 0,
      imports: this.buildComposableImports(context)
    };
    
    return this.renderTemplate('composable', templateData);
  }

  /**
   * Generate a Vue service
   */
  async generateService(context) {
    const { name, baseUrl, endpoints = [], auth = {} } = context;
    
    const templateData = {
      serviceName: this.toPascalCase(name) + 'Service',
      fileName: this.toKebabCase(name),
      baseUrl: baseUrl || '/api',
      endpoints: this.buildEndpoints(endpoints),
      hasAuth: Object.keys(auth).length > 0,
      auth: {
        type: auth.type || 'bearer',
        headerName: auth.headerName || 'Authorization',
        ...auth
      },
      imports: this.buildServiceImports(context)
    };
    
    return this.renderTemplate('service', templateData);
  }

  /**
   * Generate a Pinia store
   */
  async generateStore(context) {
    const { name, state = [], getters = [], actions = [], persist = false } = context;
    
    const templateData = {
      storeName: this.toStoreName(name),
      storeId: this.toKebabCase(name),
      fileName: this.toKebabCase(name),
      state: this.buildStoreState(state),
      getters: this.buildGetters(getters),
      actions: this.buildActions(actions),
      persist,
      hasState: state.length > 0,
      hasGetters: getters.length > 0,
      hasActions: actions.length > 0,
      imports: this.buildStoreImports(context)
    };
    
    return this.renderTemplate('store', templateData);
  }

  // Helper methods
  buildProps(props) {
    return props.map(prop => ({
      name: prop.name,
      type: this.toTypeScriptType(prop.type),
      required: prop.required !== false,
      default: prop.default,
      validator: prop.validator
    }));
  }

  buildEmits(emits) {
    return emits.map(emit => ({
      name: emit.name || emit,
      payload: emit.payload || 'void'
    }));
  }

  buildSlots(slots) {
    return slots.map(slot => ({
      name: slot.name || slot,
      props: slot.props || []
    }));
  }

  buildRoute(route, name) {
    if (typeof route === 'string') {
      return { path: route, name: this.toKebabCase(name) };
    }
    return {
      path: route?.path || `/${this.toKebabCase(name)}`,
      name: route?.name || this.toKebabCase(name),
      ...route
    };
  }

  buildState(state) {
    return state.map(s => ({
      name: s.name,
      type: this.toTypeScriptType(s.type),
      default: this.getDefaultValue(s.type, s.default)
    }));
  }

  buildMethods(methods) {
    return methods.map(m => ({
      name: m.name,
      params: m.params || [],
      returnType: m.returnType || 'void',
      async: m.async || false,
      body: m.body || '// TODO: implement'
    }));
  }

  buildComputed(computed) {
    return computed.map(c => ({
      name: c.name,
      returnType: c.returnType || 'any',
      body: c.body || 'return undefined'
    }));
  }

  buildWatchers(watchers) {
    return watchers.map(w => ({
      source: w.source,
      handler: w.handler || `// handle ${w.source} change`,
      options: w.options || {}
    }));
  }

  buildEndpoints(endpoints) {
    return endpoints.map(ep => ({
      name: ep.name,
      method: (ep.method || 'GET').toUpperCase(),
      path: ep.path,
      params: ep.params || [],
      body: ep.body,
      response: ep.response || 'any'
    }));
  }

  buildStoreState(state) {
    return state.map(s => ({
      name: s.name,
      type: this.toTypeScriptType(s.type),
      default: this.getDefaultValue(s.type, s.default)
    }));
  }

  buildGetters(getters) {
    return getters.map(g => ({
      name: g.name,
      returnType: g.returnType || 'any',
      body: g.body || 'return undefined'
    }));
  }

  buildActions(actions) {
    return actions.map(a => ({
      name: a.name,
      params: a.params || [],
      async: a.async || false,
      body: a.body || '// TODO: implement'
    }));
  }

  toComposableName(name) {
    const pascal = this.toPascalCase(name);
    return pascal.startsWith('Use') ? pascal : `use${pascal}`;
  }

  toStoreName(name) {
    const pascal = this.toPascalCase(name);
    return pascal.endsWith('Store') ? pascal : `${pascal}Store`;
  }

  buildImports(context) {
    const imports = ['defineComponent'];
    if (context.props?.length) imports.push('defineProps');
    if (context.emits?.length) imports.push('defineEmits');
    if (context.features?.ref) imports.push('ref');
    if (context.features?.reactive) imports.push('reactive');
    if (context.features?.computed) imports.push('computed');
    if (context.features?.watch) imports.push('watch');
    if (context.features?.onMounted) imports.push('onMounted');
    return imports;
  }

  buildPageImports(context) {
    const imports = ['defineComponent'];
    if (context.middleware?.length) imports.push('definePageMeta');
    return imports;
  }

  buildComposableImports(context) {
    const imports = [];
    if (context.state?.length) imports.push('ref', 'reactive');
    if (context.computed?.length) imports.push('computed');
    if (context.watchers?.length) imports.push('watch');
    return [...new Set(imports)];
  }

  buildServiceImports(context) {
    return ['axios'];
  }

  buildStoreImports(context) {
    const imports = ['defineStore'];
    if (context.persist) imports.push('persist');
    return imports;
  }

  getDefaultValue(type, defaultVal) {
    if (defaultVal !== undefined) return JSON.stringify(defaultVal);
    const defaults = {
      string: "''",
      number: '0',
      boolean: 'false',
      array: '[]',
      object: '{}',
      null: 'null'
    };
    return defaults[type?.toLowerCase()] || 'undefined';
  }
}

module.exports = VueGenerator;
