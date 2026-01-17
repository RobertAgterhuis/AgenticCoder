/**
 * ReactGenerator - Generates complete React application code
 * 
 * Produces:
 * - Components with TypeScript and CSS modules
 * - Pages with routing integration
 * - Custom hooks
 * - API services
 * - Configuration files
 */

const BaseGenerator = require('./BaseGenerator');
const path = require('path');

class ReactGenerator extends BaseGenerator {
  /**
   * @param {Object} templateRegistry - Template registry instance
   * @param {Object} promptComposer - Prompt composer instance
   */
  constructor(templateRegistry, promptComposer) {
    super('react', { framework: 'react', version: '18.x' });
    this.templateRegistry = templateRegistry;
    this.promptComposer = promptComposer;
  }

  /**
   * Check if this generator supports the given tech stack
   * @param {Object} techStack - Technology stack configuration
   * @returns {boolean}
   */
  supports(techStack) {
    const frontend = techStack.frontend;
    return frontend && (
      frontend.framework === 'react' ||
      frontend.framework === 'vite-react'
    );
  }

  /**
   * Priority - React generator runs early
   */
  get priority() {
    return 100;
  }

  /**
   * Generate all React files for a project
   * @param {import('../GenerationContext')} context - Generation context
   * @returns {Promise<Array<{path: string, content: string, type: string}>>}
   */
  async generate(context) {
    const files = [];
    const requirements = context.requirements;

    // Generate components
    if (requirements.components) {
      for (const componentSpec of requirements.components) {
        files.push(...await this.generateComponent(context, componentSpec));
      }
    }

    // Generate pages
    if (requirements.pages) {
      for (const pageSpec of requirements.pages) {
        files.push(await this.generatePage(context, pageSpec));
      }
    }

    // Generate hooks
    if (requirements.hooks) {
      for (const hookSpec of requirements.hooks) {
        files.push(await this.generateHook(context, hookSpec));
      }
    }

    // Generate services
    if (requirements.services) {
      for (const serviceSpec of requirements.services) {
        files.push(await this.generateService(context, serviceSpec));
      }
    }

    // Generate context providers
    if (requirements.contexts) {
      for (const contextSpec of requirements.contexts) {
        files.push(await this.generateContext(context, contextSpec));
      }
    }

    // Generate core application files
    files.push(await this.generateApp(context));
    files.push(await this.generateMain(context));
    files.push(await this.generateRouter(context));
    
    // Generate configuration
    files.push(await this.generatePackageJson(context));
    files.push(await this.generateViteConfig(context));
    files.push(await this.generateTsConfig(context));
    files.push(await this.generateIndexHtml(context));

    return files;
  }

  /**
   * Generate a component with CSS module and index
   * @param {Object} context - Generation context
   * @param {Object} spec - Component specification
   * @returns {Promise<Array>}
   */
  async generateComponent(context, spec) {
    const files = [];
    const componentName = this.toPascalCase(spec.name);
    const basePath = `frontend/src/components/${componentName}`;

    // Main component file
    const componentContent = this.renderComponentTemplate(spec);
    files.push(this.createFile(
      `${basePath}/${componentName}.tsx`,
      componentContent,
      'component'
    ));

    // CSS module
    if (spec.styles !== false) {
      const cssContent = this.renderCssModuleTemplate(spec);
      files.push(this.createFile(
        `${basePath}/${componentName}.module.css`,
        cssContent,
        'styles'
      ));
    }

    // Index file for clean imports
    const indexContent = `export { ${componentName} } from './${componentName}';\nexport { default } from './${componentName}';\n`;
    files.push(this.createFile(
      `${basePath}/index.ts`,
      indexContent,
      'index'
    ));

    return files;
  }

  /**
   * Render component template
   */
  renderComponentTemplate(spec) {
    const name = this.toPascalCase(spec.name);
    const hasProps = spec.props && spec.props.length > 0;
    const hasState = spec.state && spec.state.length > 0;
    const hasEffects = spec.effects && spec.effects.length > 0;

    let imports = "import React";
    const hooks = [];
    if (hasState) hooks.push('useState');
    if (hasEffects) hooks.push('useEffect');
    if (hooks.length > 0) {
      imports += `, { ${hooks.join(', ')} }`;
    }
    imports += " from 'react';\n";
    imports += `import styles from './${name}.module.css';\n`;

    // Props interface
    let propsInterface = '';
    if (hasProps) {
      propsInterface = `\nexport interface ${name}Props {\n`;
      spec.props.forEach(prop => {
        const optional = prop.required ? '' : '?';
        propsInterface += `  ${prop.name}${optional}: ${prop.type};\n`;
      });
      propsInterface += '}\n';
    }

    // Component body
    let body = '';
    if (hasState) {
      spec.state.forEach(s => {
        body += `  const [${s.name}, set${this.toPascalCase(s.name)}] = useState${s.type ? `<${s.type}>` : ''}(${s.initial || 'null'});\n`;
      });
      body += '\n';
    }

    if (hasEffects) {
      spec.effects.forEach(effect => {
        body += `  useEffect(() => {\n`;
        body += `    ${effect.body || '// Effect logic'}\n`;
        if (effect.cleanup) {
          body += `    return () => { ${effect.cleanup} };\n`;
        }
        body += `  }, [${(effect.deps || []).join(', ')}]);\n\n`;
      });
    }

    const propsParam = hasProps ? `{ ${spec.props.map(p => p.name).join(', ')} }: ${name}Props` : '';
    
    return `${imports}${propsInterface}
/**
 * ${spec.description || name + ' component'}
 */
export function ${name}(${propsParam}) {
${body}  return (
    <div className={styles.container}>
      ${spec.jsx || `<h2>${name}</h2>`}
    </div>
  );
}

export default ${name};
`;
  }

  /**
   * Render CSS module template
   */
  renderCssModuleTemplate(spec) {
    const name = this.toKebabCase(spec.name);
    return `.container {
  /* ${name} styles */
}
`;
  }

  /**
   * Generate a page component
   */
  async generatePage(context, spec) {
    const pageName = this.toPascalCase(spec.name);
    const content = this.renderPageTemplate(spec, context);
    
    return this.createFile(
      `frontend/src/pages/${pageName}Page.tsx`,
      content,
      'page'
    );
  }

  /**
   * Render page template
   */
  renderPageTemplate(spec, context) {
    const name = this.toPascalCase(spec.name);
    const hasData = spec.dataFetching || false;

    let imports = `import React${hasData ? ', { useState, useEffect }' : ''} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
`;

    let body = '';
    if (hasData) {
      body = `
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch data logic
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load'));
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
`;
    }

    return `${imports}
/**
 * ${spec.description || name + ' page'}
 */
export function ${name}Page() {
  const params = useParams();
  const navigate = useNavigate();
${body}
  return (
    <div className="page ${this.toKebabCase(name)}-page">
      <h1>${spec.title || name}</h1>
      ${spec.content || ''}
    </div>
  );
}

export default ${name}Page;
`;
  }

  /**
   * Generate a custom hook
   */
  async generateHook(context, spec) {
    const hookName = spec.name.startsWith('use') ? spec.name : `use${this.toPascalCase(spec.name)}`;
    const content = this.renderHookTemplate(spec);
    
    return this.createFile(
      `frontend/src/hooks/${hookName}.ts`,
      content,
      'hook'
    );
  }

  /**
   * Render hook template
   */
  renderHookTemplate(spec) {
    const name = spec.name.startsWith('use') ? spec.name : `use${this.toPascalCase(spec.name)}`;
    
    return `import { useState, useEffect, useCallback } from 'react';

/**
 * ${spec.description || name + ' hook'}
 */
export function ${name}(${spec.params || ''}) {
${spec.body || '  // Hook implementation'}

  return {
    ${spec.returns || '// return values'}
  };
}
`;
  }

  /**
   * Generate an API service
   */
  async generateService(context, spec) {
    const serviceName = spec.name;
    const content = this.renderServiceTemplate(spec);
    
    return this.createFile(
      `frontend/src/services/${serviceName}.ts`,
      content,
      'service'
    );
  }

  /**
   * Render service template
   */
  renderServiceTemplate(spec) {
    let endpoints = '';
    if (spec.endpoints) {
      spec.endpoints.forEach(ep => {
        const params = ep.params || '';
        const returnType = ep.returnType || 'any';
        const method = ep.method || 'GET';
        
        endpoints += `
export async function ${ep.name}(${params}): Promise<${returnType}> {
  const response = await fetch(\`\${API_BASE}${ep.path}\`, {
    method: '${method}',
    headers: { 'Content-Type': 'application/json' },${method !== 'GET' ? `
    body: JSON.stringify(data),` : ''}
  });
  
  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }
  
  return response.json();
}
`;
      });
    }

    return `const API_BASE = import.meta.env.VITE_API_URL || '/api';
${endpoints}
`;
  }

  /**
   * Generate a context provider
   */
  async generateContext(context, spec) {
    const contextName = this.toPascalCase(spec.name);
    const content = this.renderContextTemplate(spec);
    
    return this.createFile(
      `frontend/src/contexts/${contextName}Context.tsx`,
      content,
      'context'
    );
  }

  /**
   * Render context template
   */
  renderContextTemplate(spec) {
    const name = this.toPascalCase(spec.name);
    
    return `import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ${name}ContextValue {
  ${spec.values || '// context values'}
}

const ${name}Context = createContext<${name}ContextValue | undefined>(undefined);

export function ${name}Provider({ children }: { children: ReactNode }) {
  ${spec.state || ''}

  const value: ${name}ContextValue = {
    ${spec.valueAssignments || ''}
  };

  return (
    <${name}Context.Provider value={value}>
      {children}
    </${name}Context.Provider>
  );
}

export function use${name}() {
  const context = useContext(${name}Context);
  if (!context) {
    throw new Error('use${name} must be used within ${name}Provider');
  }
  return context;
}
`;
  }

  /**
   * Generate App.tsx
   */
  async generateApp(context) {
    const content = `import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
`;
    return this.createFile('frontend/src/App.tsx', content, 'app');
  }

  /**
   * Generate main.tsx entry point
   */
  async generateMain(context) {
    const content = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
    return this.createFile('frontend/src/main.tsx', content, 'entry');
  }

  /**
   * Generate router.tsx
   */
  async generateRouter(context) {
    const pages = context.requirements.pages || [];
    
    let imports = "import { Routes, Route } from 'react-router-dom';\n";
    let routes = '';
    
    pages.forEach(page => {
      const name = this.toPascalCase(page.name);
      imports += `import { ${name}Page } from './pages/${name}Page';\n`;
      routes += `      <Route path="${page.path || '/' + this.toKebabCase(page.name)}" element={<${name}Page />} />\n`;
    });

    // Add default home route if not present
    if (!pages.some(p => p.path === '/')) {
      routes = `      <Route path="/" element={<div>Welcome</div>} />\n` + routes;
    }

    const content = `${imports}
export function AppRouter() {
  return (
    <Routes>
${routes}    </Routes>
  );
}
`;
    return this.createFile('frontend/src/router.tsx', content, 'router');
  }

  /**
   * Generate package.json
   */
  async generatePackageJson(context) {
    const pkg = {
      name: this.toKebabCase(context.projectName),
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        preview: "vite preview"
      },
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.20.0"
      },
      devDependencies: {
        "@types/react": "^18.2.43",
        "@types/react-dom": "^18.2.17",
        "@typescript-eslint/eslint-plugin": "^6.14.0",
        "@typescript-eslint/parser": "^6.14.0",
        "@vitejs/plugin-react": "^4.2.1",
        "eslint": "^8.55.0",
        "eslint-plugin-react-hooks": "^4.6.0",
        "eslint-plugin-react-refresh": "^0.4.5",
        "typescript": "^5.2.2",
        "vite": "^5.0.8"
      }
    };

    return this.createFile(
      'frontend/package.json',
      JSON.stringify(pkg, null, 2),
      'config'
    );
  }

  /**
   * Generate vite.config.ts
   */
  async generateViteConfig(context) {
    const content = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
`;
    return this.createFile('frontend/vite.config.ts', content, 'config');
  }

  /**
   * Generate tsconfig.json
   */
  async generateTsConfig(context) {
    const config = {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }]
    };

    return this.createFile(
      'frontend/tsconfig.json',
      JSON.stringify(config, null, 2),
      'config'
    );
  }

  /**
   * Generate index.html
   */
  async generateIndexHtml(context) {
    const content = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${context.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
    return this.createFile('frontend/index.html', content, 'html');
  }
}

module.exports = ReactGenerator;
