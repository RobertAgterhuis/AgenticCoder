/**
 * ViteGenerator - Vite Project Configuration Generator
 * 
 * Generates Vite configuration files, plugins setup, and
 * build configurations for various frameworks.
 */

const BaseGenerator = require('./BaseGenerator');

class ViteGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'ViteGenerator',
      framework: 'vite',
      version: '5.x',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'vite';
    this.supportedTypes = ['config', 'plugin', 'env', 'tsconfig'];
  }

  /**
   * Generate Vite configuration
   */
  async generateConfig(context) {
    const { 
      framework = 'react',
      plugins = [],
      server = {},
      build = {},
      resolve = {},
      css = {},
      optimizeDeps = {}
    } = context;
    
    const templateData = {
      framework,
      plugins: this.buildPlugins(plugins, framework),
      server: this.buildServerConfig(server),
      build: this.buildBuildConfig(build),
      resolve: this.buildResolveConfig(resolve),
      css: this.buildCssConfig(css),
      optimizeDeps: this.buildOptimizeDepsConfig(optimizeDeps),
      hasPlugins: plugins.length > 0 || framework !== 'vanilla',
      hasServer: Object.keys(server).length > 0,
      hasBuild: Object.keys(build).length > 0,
      hasResolve: Object.keys(resolve).length > 0,
      hasCss: Object.keys(css).length > 0,
      hasOptimizeDeps: Object.keys(optimizeDeps).length > 0,
      imports: this.buildConfigImports(context)
    };
    
    return this.generateConfigFile(templateData);
  }

  /**
   * Generate a Vite plugin
   */
  async generatePlugin(context) {
    const { 
      name, 
      hooks = [],
      options = {}
    } = context;
    
    const templateData = {
      pluginName: this.toCamelCase(name) + 'Plugin',
      fileName: this.toKebabCase(name),
      hooks: this.buildHooks(hooks),
      options: this.buildPluginOptions(options),
      hasHooks: hooks.length > 0,
      hasOptions: Object.keys(options).length > 0
    };
    
    return this.generatePluginFile(templateData);
  }

  /**
   * Generate environment configuration
   */
  async generateEnv(context) {
    const { 
      mode = 'development',
      variables = []
    } = context;
    
    const templateData = {
      mode,
      variables: this.buildEnvVariables(variables),
      fileName: mode === 'production' ? '.env.production' : 
                mode === 'development' ? '.env.development' : '.env'
    };
    
    return this.generateEnvFile(templateData);
  }

  /**
   * Generate TypeScript configuration for Vite
   */
  async generateTsConfig(context) {
    const { 
      framework = 'react',
      paths = {},
      strict = true,
      target = 'ES2022'
    } = context;
    
    const templateData = {
      framework,
      compilerOptions: this.buildCompilerOptions(framework, target, strict, paths),
      include: this.buildInclude(framework),
      exclude: this.buildExclude(),
      references: this.buildReferences(framework)
    };
    
    return this.generateTsConfigFile(templateData);
  }

  // Config generation methods
  generateConfigFile(data) {
    const lines = [];
    
    // Imports
    lines.push(`import { defineConfig } from 'vite';`);
    for (const imp of data.imports) {
      lines.push(`import ${imp.default ? imp.name : `{ ${imp.items.join(', ')} }`} from '${imp.from}';`);
    }
    lines.push('');
    
    // Export
    lines.push('export default defineConfig({');
    
    // Plugins
    if (data.hasPlugins) {
      lines.push('  plugins: [');
      for (const plugin of data.plugins) {
        const opts = plugin.options ? JSON.stringify(plugin.options) : '';
        lines.push(`    ${plugin.name}(${opts}),`);
      }
      lines.push('  ],');
    }
    
    // Server
    if (data.hasServer) {
      lines.push('  server: {');
      if (data.server.port) lines.push(`    port: ${data.server.port},`);
      if (data.server.host) lines.push(`    host: '${data.server.host}',`);
      if (data.server.proxy) {
        lines.push('    proxy: {');
        for (const [path, target] of Object.entries(data.server.proxy)) {
          lines.push(`      '${path}': '${target}',`);
        }
        lines.push('    },');
      }
      lines.push('  },');
    }
    
    // Build
    if (data.hasBuild) {
      lines.push('  build: {');
      if (data.build.outDir) lines.push(`    outDir: '${data.build.outDir}',`);
      if (data.build.sourcemap) lines.push(`    sourcemap: ${data.build.sourcemap},`);
      if (data.build.minify) lines.push(`    minify: '${data.build.minify}',`);
      if (data.build.target) lines.push(`    target: '${data.build.target}',`);
      lines.push('  },');
    }
    
    // Resolve
    if (data.hasResolve) {
      lines.push('  resolve: {');
      if (data.resolve.alias) {
        lines.push('    alias: {');
        for (const [key, value] of Object.entries(data.resolve.alias)) {
          lines.push(`      '${key}': '${value}',`);
        }
        lines.push('    },');
      }
      lines.push('  },');
    }
    
    // CSS
    if (data.hasCss) {
      lines.push('  css: {');
      if (data.css.preprocessorOptions) {
        lines.push('    preprocessorOptions: {');
        for (const [prep, opts] of Object.entries(data.css.preprocessorOptions)) {
          lines.push(`      ${prep}: ${JSON.stringify(opts)},`);
        }
        lines.push('    },');
      }
      lines.push('  },');
    }
    
    lines.push('});');
    
    return lines.join('\n');
  }

  generatePluginFile(data) {
    const lines = [];
    
    lines.push(`import type { Plugin } from 'vite';`);
    lines.push('');
    
    // Options interface
    if (data.hasOptions) {
      lines.push(`interface ${this.toPascalCase(data.pluginName)}Options {`);
      for (const [key, value] of Object.entries(data.options)) {
        lines.push(`  ${key}?: ${typeof value};`);
      }
      lines.push('}');
      lines.push('');
    }
    
    // Plugin function
    const optionsParam = data.hasOptions ? `options: ${this.toPascalCase(data.pluginName)}Options = {}` : '';
    lines.push(`export function ${data.pluginName}(${optionsParam}): Plugin {`);
    lines.push('  return {');
    lines.push(`    name: '${data.fileName}',`);
    
    // Hooks
    for (const hook of data.hooks) {
      lines.push(`    ${hook.name}(${hook.params || ''}) {`);
      lines.push(`      ${hook.body || '// TODO: implement'}`);
      lines.push('    },');
    }
    
    lines.push('  };');
    lines.push('}');
    
    return lines.join('\n');
  }

  generateEnvFile(data) {
    const lines = [];
    
    for (const variable of data.variables) {
      if (variable.comment) {
        lines.push(`# ${variable.comment}`);
      }
      lines.push(`${variable.name}=${variable.value}`);
    }
    
    return lines.join('\n');
  }

  generateTsConfigFile(data) {
    return JSON.stringify({
      compilerOptions: data.compilerOptions,
      include: data.include,
      exclude: data.exclude,
      references: data.references
    }, null, 2);
  }

  // Helper methods
  buildPlugins(plugins, framework) {
    const result = [];
    
    // Add framework-specific plugins
    const frameworkPlugins = {
      react: { name: 'react', import: '@vitejs/plugin-react' },
      vue: { name: 'vue', import: '@vitejs/plugin-vue' },
      svelte: { name: 'svelte', import: '@sveltejs/vite-plugin-svelte' },
      solid: { name: 'solid', import: 'vite-plugin-solid' }
    };
    
    if (frameworkPlugins[framework]) {
      result.push(frameworkPlugins[framework]);
    }
    
    // Add custom plugins
    for (const plugin of plugins) {
      result.push({
        name: plugin.name || plugin,
        import: plugin.import,
        options: plugin.options
      });
    }
    
    return result;
  }

  buildServerConfig(server) {
    return {
      port: server.port || 5173,
      host: server.host,
      proxy: server.proxy,
      https: server.https,
      cors: server.cors,
      ...server
    };
  }

  buildBuildConfig(build) {
    return {
      outDir: build.outDir || 'dist',
      sourcemap: build.sourcemap,
      minify: build.minify || 'esbuild',
      target: build.target || 'esnext',
      ...build
    };
  }

  buildResolveConfig(resolve) {
    return {
      alias: {
        '@': '/src',
        ...resolve.alias
      },
      ...resolve
    };
  }

  buildCssConfig(css) {
    return css;
  }

  buildOptimizeDepsConfig(optimizeDeps) {
    return optimizeDeps;
  }

  buildHooks(hooks) {
    return hooks.map(h => ({
      name: h.name || h,
      params: h.params || '',
      body: h.body || '// TODO: implement'
    }));
  }

  buildPluginOptions(options) {
    return options;
  }

  buildEnvVariables(variables) {
    return variables.map(v => ({
      name: v.name.startsWith('VITE_') ? v.name : `VITE_${v.name}`,
      value: v.value || '',
      comment: v.comment
    }));
  }

  buildCompilerOptions(framework, target, strict, paths) {
    const base = {
      target,
      useDefineForClassFields: true,
      module: 'ESNext',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      strict,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      paths: {
        '@/*': ['./src/*'],
        ...paths
      }
    };
    
    if (framework === 'react') {
      base.jsx = 'react-jsx';
    }
    
    return base;
  }

  buildInclude(framework) {
    const includes = ['src'];
    if (framework === 'vue') includes.push('src/**/*.vue');
    return includes;
  }

  buildExclude() {
    return ['node_modules', 'dist'];
  }

  buildReferences(framework) {
    return [{ path: './tsconfig.node.json' }];
  }

  buildConfigImports(context) {
    const imports = [];
    
    const frameworkImports = {
      react: { name: 'react', from: '@vitejs/plugin-react', default: true },
      vue: { name: 'vue', from: '@vitejs/plugin-vue', default: true },
      svelte: { name: 'svelte', from: '@sveltejs/vite-plugin-svelte', items: ['svelte'] },
      solid: { name: 'solid', from: 'vite-plugin-solid', default: true }
    };
    
    if (frameworkImports[context.framework]) {
      imports.push(frameworkImports[context.framework]);
    }
    
    return imports;
  }
}

module.exports = ViteGenerator;
