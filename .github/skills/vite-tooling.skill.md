# Vite Tooling Skill

**Vite Build Tool Configuration, Plugins, and Optimization**

**Version**: 1.0  
**Category**: Build Tooling  
**Related Agents**: @vue-specialist, @frontend-specialist

---

## Skill Overview

This skill covers Vite 5+ configuration, plugin ecosystem, build optimization, development server customization, and advanced features like SSR and library mode.

---

## Core Concepts

### 1. Basic Configuration

#### vite.config.ts
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [vue()], // or react()
  
  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  
  // Development server
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // Build options
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### 2. Environment Variables

#### .env Files
```bash
# .env - Base environment (all modes)
VITE_APP_TITLE=My App

# .env.local - Local overrides (gitignored)
VITE_API_KEY=secret123

# .env.development - Development mode
VITE_API_URL=http://localhost:8080/api

# .env.production - Production mode
VITE_API_URL=https://api.example.com

# .env.staging - Custom mode (vite build --mode staging)
VITE_API_URL=https://staging-api.example.com
```

#### Accessing Environment Variables
```typescript
// In code - only VITE_ prefixed vars are exposed
const apiUrl = import.meta.env.VITE_API_URL
const mode = import.meta.env.MODE // 'development' | 'production'
const isDev = import.meta.env.DEV // true in dev
const isProd = import.meta.env.PROD // true in prod

// Type definitions (src/vite-env.d.ts)
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### 3. Development Server Configuration

#### Proxy Configuration
```typescript
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true, // Fail if port in use
    host: true, // Listen on all addresses
    
    // API proxy for development
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/socket.io': {
        target: 'ws://localhost:8080',
        ws: true
      }
    },
    
    // CORS configuration
    cors: {
      origin: ['http://localhost:4000'],
      credentials: true
    },
    
    // Custom middleware
    middleware: (app) => {
      app.use('/custom', (req, res, next) => {
        // Custom middleware logic
        next()
      })
    }
  }
})
```

#### HMR Configuration
```typescript
export default defineConfig({
  server: {
    hmr: {
      overlay: true, // Show error overlay
      port: 24678, // Custom HMR port
      host: 'localhost',
      protocol: 'ws' // or 'wss' for HTTPS
    },
    watch: {
      usePolling: true, // For Docker/WSL
      interval: 1000
    }
  }
})
```

### 4. Build Optimization

#### Code Splitting
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting
        manualChunks: {
          // Vendor chunks
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['@headlessui/vue', '@heroicons/vue'],
          
          // Or function-based splitting
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lodash')) {
                return 'vendor-lodash'
              }
              if (id.includes('@sentry')) {
                return 'vendor-sentry'
              }
            }
          }
        },
        
        // Custom naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
```

#### Minification and Compression
```typescript
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  build: {
    minify: 'terser', // 'esbuild' (default) or 'terser'
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // Target browsers
    target: 'es2020', // or ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Inline assets smaller than 4kb
    assetsInlineLimit: 4096,
    
    // Chunk size warning
    chunkSizeWarningLimit: 500
  },
  
  plugins: [
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
})
```

### 5. CSS Configuration

#### CSS Preprocessors
```typescript
export default defineConfig({
  css: {
    // Preprocessor options
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
        `
      },
      less: {
        modifyVars: {
          'primary-color': '#1890ff'
        },
        javascriptEnabled: true
      }
    },
    
    // CSS Modules
    modules: {
      localsConvention: 'camelCaseOnly',
      scopeBehaviour: 'local',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    
    // PostCSS configuration
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
      ]
    },
    
    // DevTools sourcemaps
    devSourcemap: true
  }
})
```

### 6. Plugin Configuration

#### Essential Plugins
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    
    // Auto-import Vue APIs
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
      resolvers: [ElementPlusResolver()],
      eslintrc: {
        enabled: true
      }
    }),
    
    // Auto-import components
    Components({
      dirs: ['src/components'],
      dts: 'src/components.d.ts',
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: 'icon'
        })
      ]
    }),
    
    // Icons
    Icons({
      autoInstall: true,
      compiler: 'vue3'
    })
  ]
})
```

#### PWA Plugin
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'My App',
        short_name: 'App',
        description: 'My Awesome App',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### 7. Library Mode

#### Building a Library
```typescript
// vite.config.ts for library
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true
    })
  ],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyLib',
      formats: ['es', 'umd'],
      fileName: (format) => `my-lib.${format}.js`
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
```

### 8. SSR Configuration

#### Server-Side Rendering
```typescript
// vite.config.ts
export default defineConfig({
  ssr: {
    // Externalize these packages in SSR
    external: ['vue', '@vue/server-renderer'],
    
    // Force these to be bundled in SSR
    noExternal: ['my-ui-library']
  },
  
  build: {
    ssr: true,
    rollupOptions: {
      input: 'src/entry-server.ts'
    }
  }
})
```

```typescript
// entry-server.ts
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import App from './App.vue'

export async function render() {
  const app = createSSRApp(App)
  const html = await renderToString(app)
  return html
}
```

### 9. Testing Configuration

#### Vitest Integration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  
  test: {
    globals: true,
    environment: 'happy-dom', // or 'jsdom'
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
})
```

### 10. Custom Plugin Development

#### Simple Plugin
```typescript
// plugins/my-plugin.ts
import type { Plugin } from 'vite'

export function myPlugin(): Plugin {
  return {
    name: 'my-plugin',
    
    // Called when config is resolved
    configResolved(config) {
      console.log('Config resolved:', config.mode)
    },
    
    // Transform code
    transform(code, id) {
      if (id.endsWith('.vue')) {
        // Transform Vue files
        return code.replace('__TIMESTAMP__', Date.now().toString())
      }
    },
    
    // Generate virtual modules
    resolveId(id) {
      if (id === 'virtual:my-module') {
        return '\0' + id // Prefix with \0 for virtual modules
      }
    },
    
    load(id) {
      if (id === '\0virtual:my-module') {
        return `export const time = ${Date.now()}`
      }
    },
    
    // Add HTML tags
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        '<script>console.log("Injected!")</script></head>'
      )
    }
  }
}
```

---

## Production Checklist

### Build Optimization
- [ ] Code splitting configured
- [ ] Tree shaking working
- [ ] CSS minified and purged
- [ ] Images optimized
- [ ] Compression enabled (gzip/brotli)
- [ ] Source maps for production (optional)

### Performance
- [ ] Lazy loading routes
- [ ] Async component loading
- [ ] Preload critical assets
- [ ] Cache headers configured
- [ ] Bundle analysis performed

### Security
- [ ] No sensitive env vars exposed
- [ ] CSP headers configured
- [ ] External dependencies audited

---

## Anti-Patterns

### ❌ Don't: Import Node.js Modules in Client Code
```typescript
// BAD: Node.js modules don't work in browser
import fs from 'fs'
import path from 'path'
```

### ✅ Do: Use Vite-Specific Imports
```typescript
// GOOD: Use import.meta for Vite features
const modules = import.meta.glob('./modules/*.ts')
```

### ❌ Don't: Hardcode Environment Values
```typescript
// BAD: Hardcoded values
const apiUrl = 'http://localhost:8080'
```

### ✅ Do: Use Environment Variables
```typescript
// GOOD: Environment variables
const apiUrl = import.meta.env.VITE_API_URL
```

### ❌ Don't: Large Bundle Without Splitting
```typescript
// BAD: All vendors in one chunk
build: {
  rollupOptions: {} // No manual chunks
}
```

### ✅ Do: Configure Code Splitting
```typescript
// GOOD: Split vendors by size/usage
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-core': ['vue', 'vue-router'],
        'vendor-ui': ['element-plus']
      }
    }
  }
}
```

---

## Quick Reference

### CLI Commands
| Command | Description |
|---------|-------------|
| `vite` | Start dev server |
| `vite build` | Production build |
| `vite preview` | Preview production build |
| `vite optimize` | Pre-bundle dependencies |
| `vite --mode staging` | Custom mode |

### Config Options
| Option | Description |
|--------|-------------|
| `root` | Project root directory |
| `base` | Base public path |
| `publicDir` | Static assets directory |
| `cacheDir` | Cache directory |
| `mode` | Build mode |

### Environment Variables
| Variable | Description |
|----------|-------------|
| `import.meta.env.MODE` | Current mode |
| `import.meta.env.DEV` | Is development |
| `import.meta.env.PROD` | Is production |
| `import.meta.env.SSR` | Is SSR build |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
