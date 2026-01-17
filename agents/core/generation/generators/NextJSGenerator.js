/**
 * NextJSGenerator - Next.js 14+ Code Generator
 * 
 * Generates Next.js App Router pages, layouts, server actions,
 * API routes, and middleware with TypeScript support.
 */

const BaseGenerator = require('./BaseGenerator');

class NextJSGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'NextJSGenerator',
      framework: 'nextjs',
      version: '14.x',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'nextjs';
    this.supportedTypes = ['page', 'layout', 'serverAction', 'apiRoute', 'middleware'];
  }

  /**
   * Generate a Next.js page component
   */
  async generatePage(context) {
    const { 
      name, 
      route,
      params = [],
      searchParams = [],
      metadata = {},
      dataFetching = null,
      isAsync = true
    } = context;
    
    const templateData = {
      pageName: this.toPascalCase(name) + 'Page',
      fileName: 'page',
      route: this.buildRoute(route, name),
      params: this.buildParams(params),
      searchParams: this.buildSearchParams(searchParams),
      metadata: this.buildMetadata(metadata, name),
      dataFetching: this.buildDataFetching(dataFetching),
      hasParams: params.length > 0,
      hasSearchParams: searchParams.length > 0,
      hasDataFetching: dataFetching !== null,
      isAsync,
      imports: this.buildPageImports(context)
    };
    
    return this.renderTemplate('page', templateData);
  }

  /**
   * Generate a Next.js layout component
   */
  async generateLayout(context) {
    const { 
      name, 
      route,
      metadata = {},
      providers = [],
      fonts = [],
      scripts = []
    } = context;
    
    const templateData = {
      layoutName: this.toPascalCase(name) + 'Layout',
      fileName: 'layout',
      route: this.buildRoute(route, name),
      metadata: this.buildMetadata(metadata, name),
      providers: this.buildProviders(providers),
      fonts: this.buildFonts(fonts),
      scripts: this.buildScripts(scripts),
      hasProviders: providers.length > 0,
      hasFonts: fonts.length > 0,
      hasScripts: scripts.length > 0,
      isRootLayout: route === '/' || context.isRoot,
      imports: this.buildLayoutImports(context)
    };
    
    return this.renderTemplate('layout', templateData);
  }

  /**
   * Generate a Next.js server action
   */
  async generateServerAction(context) {
    const { 
      name, 
      actions = [],
      schema = null,
      revalidatePath = null,
      revalidateTag = null
    } = context;
    
    const templateData = {
      fileName: this.toKebabCase(name),
      actions: this.buildActions(actions),
      schema: this.buildSchema(schema),
      revalidatePath,
      revalidateTag,
      hasSchema: schema !== null,
      hasRevalidate: revalidatePath || revalidateTag,
      imports: this.buildServerActionImports(context)
    };
    
    return this.renderTemplate('serverAction', templateData);
  }

  /**
   * Generate a Next.js API route
   */
  async generateApiRoute(context) {
    const { 
      name, 
      methods = ['GET'],
      params = [],
      middleware = [],
      cors = false,
      rateLimit = null
    } = context;
    
    const templateData = {
      fileName: 'route',
      routeName: this.toPascalCase(name),
      methods: this.buildApiMethods(methods),
      params: this.buildParams(params),
      middleware: this.buildApiMiddleware(middleware),
      cors: this.buildCorsConfig(cors),
      rateLimit: this.buildRateLimitConfig(rateLimit),
      hasParams: params.length > 0,
      hasMiddleware: middleware.length > 0,
      hasCors: cors !== false,
      hasRateLimit: rateLimit !== null,
      imports: this.buildApiRouteImports(context)
    };
    
    return this.renderTemplate('apiRoute', templateData);
  }

  /**
   * Generate Next.js middleware
   */
  async generateMiddleware(context) {
    const { 
      name,
      matchers = [],
      auth = null,
      redirects = [],
      rewrites = [],
      headers = []
    } = context;
    
    const templateData = {
      fileName: 'middleware',
      middlewareName: this.toPascalCase(name),
      matchers: this.buildMatchers(matchers),
      auth: this.buildAuthConfig(auth),
      redirects: this.buildRedirects(redirects),
      rewrites: this.buildRewrites(rewrites),
      headers: this.buildHeaders(headers),
      hasMatchers: matchers.length > 0,
      hasAuth: auth !== null,
      hasRedirects: redirects.length > 0,
      hasRewrites: rewrites.length > 0,
      hasHeaders: headers.length > 0,
      imports: this.buildMiddlewareImports(context)
    };
    
    return this.renderTemplate('middleware', templateData);
  }

  // Helper methods
  buildRoute(route, name) {
    if (typeof route === 'string') return route;
    return route?.path || `/${this.toKebabCase(name)}`;
  }

  buildParams(params) {
    return params.map(p => ({
      name: p.name || p,
      type: p.type || 'string',
      optional: p.optional || false
    }));
  }

  buildSearchParams(searchParams) {
    return searchParams.map(sp => ({
      name: sp.name || sp,
      type: sp.type || 'string',
      default: sp.default
    }));
  }

  buildMetadata(metadata, name) {
    return {
      title: metadata.title || this.toPascalCase(name),
      description: metadata.description || '',
      keywords: metadata.keywords || [],
      openGraph: metadata.openGraph || null,
      twitter: metadata.twitter || null,
      robots: metadata.robots || null,
      ...metadata
    };
  }

  buildDataFetching(dataFetching) {
    if (!dataFetching) return null;
    return {
      type: dataFetching.type || 'fetch',
      url: dataFetching.url,
      options: {
        cache: dataFetching.cache || 'force-cache',
        revalidate: dataFetching.revalidate,
        tags: dataFetching.tags || [],
        ...dataFetching.options
      }
    };
  }

  buildProviders(providers) {
    return providers.map(p => ({
      name: p.name || p,
      import: p.import || p.name || p,
      props: p.props || {}
    }));
  }

  buildFonts(fonts) {
    return fonts.map(f => ({
      name: f.name,
      variable: f.variable || `--font-${this.toKebabCase(f.name)}`,
      subsets: f.subsets || ['latin'],
      weight: f.weight || ['400', '700'],
      display: f.display || 'swap'
    }));
  }

  buildScripts(scripts) {
    return scripts.map(s => ({
      src: s.src,
      strategy: s.strategy || 'afterInteractive',
      id: s.id
    }));
  }

  buildActions(actions) {
    return actions.map(a => ({
      name: a.name,
      params: a.params || [],
      returnType: a.returnType || 'Promise<void>',
      validation: a.validation || null,
      body: a.body || '// TODO: implement'
    }));
  }

  buildSchema(schema) {
    if (!schema) return null;
    return {
      name: schema.name || 'FormSchema',
      fields: schema.fields || [],
      library: schema.library || 'zod'
    };
  }

  buildApiMethods(methods) {
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    return methods
      .map(m => (typeof m === 'string' ? { method: m.toUpperCase() } : m))
      .filter(m => httpMethods.includes(m.method))
      .map(m => ({
        method: m.method,
        handler: m.handler || `// Handle ${m.method} request`,
        params: m.params || []
      }));
  }

  buildApiMiddleware(middleware) {
    return middleware.map(m => ({
      name: m.name || m,
      options: m.options || {}
    }));
  }

  buildCorsConfig(cors) {
    if (cors === false) return null;
    if (cors === true) {
      return {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        headers: ['Content-Type', 'Authorization']
      };
    }
    return cors;
  }

  buildRateLimitConfig(rateLimit) {
    if (!rateLimit) return null;
    return {
      limit: rateLimit.limit || 100,
      window: rateLimit.window || '1m',
      identifier: rateLimit.identifier || 'ip'
    };
  }

  buildMatchers(matchers) {
    return matchers.map(m => ({
      source: typeof m === 'string' ? m : m.source,
      has: m.has || [],
      missing: m.missing || []
    }));
  }

  buildAuthConfig(auth) {
    if (!auth) return null;
    return {
      provider: auth.provider || 'custom',
      protectedRoutes: auth.protectedRoutes || [],
      publicRoutes: auth.publicRoutes || ['/login', '/register'],
      loginUrl: auth.loginUrl || '/login',
      ...auth
    };
  }

  buildRedirects(redirects) {
    return redirects.map(r => ({
      source: r.source,
      destination: r.destination,
      permanent: r.permanent || false,
      condition: r.condition
    }));
  }

  buildRewrites(rewrites) {
    return rewrites.map(r => ({
      source: r.source,
      destination: r.destination,
      condition: r.condition
    }));
  }

  buildHeaders(headers) {
    return headers.map(h => ({
      key: h.key,
      value: h.value
    }));
  }

  buildPageImports(context) {
    const imports = [];
    if (context.metadata) imports.push({ from: 'next', items: ['Metadata'] });
    return imports;
  }

  buildLayoutImports(context) {
    const imports = [{ from: 'next', items: ['Metadata'] }];
    if (context.fonts?.length) {
      imports.push({ from: 'next/font/google', items: context.fonts.map(f => f.name) });
    }
    if (context.scripts?.length) {
      imports.push({ from: 'next/script', items: ['Script'] });
    }
    return imports;
  }

  buildServerActionImports(context) {
    const imports = [];
    if (context.revalidatePath) imports.push({ from: 'next/cache', items: ['revalidatePath'] });
    if (context.revalidateTag) imports.push({ from: 'next/cache', items: ['revalidateTag'] });
    if (context.schema) imports.push({ from: 'zod', items: ['z'] });
    return imports;
  }

  buildApiRouteImports(context) {
    const imports = [{ from: 'next/server', items: ['NextRequest', 'NextResponse'] }];
    return imports;
  }

  buildMiddlewareImports(context) {
    const imports = [{ from: 'next/server', items: ['NextRequest', 'NextResponse'] }];
    return imports;
  }
}

module.exports = NextJSGenerator;
