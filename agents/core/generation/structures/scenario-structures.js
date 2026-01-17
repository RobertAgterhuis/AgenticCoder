/**
 * Scenario Structure Definitions
 * 
 * Defines the directory structures for all 5 business scenarios (S01-S05).
 * Used by ProjectScaffolder and generators to create consistent project layouts.
 */

/**
 * S01: Startup MVP
 * Lean, fast-to-market structure for rapid prototyping
 */
const S01_STRUCTURE = {
  name: 'Startup MVP',
  description: 'Lean structure optimized for rapid development and quick iteration',
  characteristics: ['minimal', 'monolithic', 'fast-deploy'],
  layers: {
    frontend: {
      framework: 'react', // default, can be overridden
      directories: [
        'src/components',
        'src/pages',
        'src/hooks',
        'src/services',
        'src/styles',
        'src/utils',
        'public'
      ],
      entryPoints: ['src/index.js', 'src/App.js'],
      configFiles: ['package.json', 'vite.config.js', '.env.example']
    },
    backend: {
      framework: 'express', // default
      directories: [
        'src/controllers',
        'src/models',
        'src/routes',
        'src/services',
        'src/middleware',
        'src/utils',
        'tests'
      ],
      entryPoints: ['src/index.js', 'src/app.js'],
      configFiles: ['package.json', '.env.example']
    },
    infrastructure: {
      directories: ['docker', 'scripts'],
      files: ['docker-compose.yml', 'Dockerfile']
    }
  }
};

/**
 * S02: SMB Operations
 * Business process focused with workflow support
 */
const S02_STRUCTURE = {
  name: 'SMB Operations',
  description: 'Business process focused application with reporting and dashboards',
  characteristics: ['forms-heavy', 'reports', 'workflows'],
  layers: {
    frontend: {
      framework: 'react',
      directories: [
        'src/components/common',
        'src/components/forms',
        'src/components/reports',
        'src/components/dashboard',
        'src/pages',
        'src/hooks',
        'src/services',
        'src/store',
        'src/utils',
        'public'
      ],
      entryPoints: ['src/index.js', 'src/App.js'],
      configFiles: ['package.json', 'vite.config.js', '.env.example']
    },
    backend: {
      framework: 'express',
      directories: [
        'src/api',
        'src/controllers',
        'src/models',
        'src/services/business',
        'src/services/integration',
        'src/middleware',
        'src/utils',
        'src/validators',
        'tests/unit',
        'tests/integration'
      ],
      entryPoints: ['src/index.js', 'src/app.js'],
      configFiles: ['package.json', '.env.example']
    },
    infrastructure: {
      directories: ['docker', 'terraform', 'scripts'],
      files: ['docker-compose.yml', 'Dockerfile']
    },
    shared: {
      directories: ['shared/types', 'shared/constants']
    }
  }
};

/**
 * S03: Enterprise Platform
 * Full microservices architecture with event-driven communication
 */
const S03_STRUCTURE = {
  name: 'Enterprise Platform',
  description: 'Microservices architecture with event-driven patterns',
  characteristics: ['microservices', 'event-driven', 'kubernetes'],
  layers: {
    services: {
      pattern: 'per-service',
      template: {
        directories: [
          'src/controllers',
          'src/models',
          'src/services',
          'src/events',
          'tests'
        ],
        entryPoints: ['src/index.js'],
        configFiles: ['package.json', 'Dockerfile']
      },
      defaultServices: [
        'api-gateway',
        'user-service',
        'order-service',
        'notification-service'
      ]
    },
    frontend: {
      framework: 'react',
      directories: [
        'src/components',
        'src/pages',
        'src/modules',
        'src/services',
        'src/store'
      ],
      entryPoints: ['src/index.js', 'src/App.js'],
      configFiles: ['package.json', 'vite.config.js']
    },
    infrastructure: {
      directories: [
        'kubernetes/base',
        'kubernetes/overlays/dev',
        'kubernetes/overlays/staging',
        'kubernetes/overlays/prod',
        'terraform/modules',
        'terraform/environments',
        'helm'
      ],
      files: ['skaffold.yaml']
    },
    shared: {
      directories: [
        'shared/proto-definitions',
        'shared/event-schemas',
        'shared/types'
      ]
    },
    tools: {
      directories: ['tools/scripts', 'tools/generators']
    }
  }
};

/**
 * S04: E-commerce Platform
 * Product catalog, cart, checkout, and order management
 */
const S04_STRUCTURE = {
  name: 'E-commerce Platform',
  description: 'Full e-commerce with product catalog, cart, and order management',
  characteristics: ['catalog', 'cart', 'checkout', 'search'],
  layers: {
    frontend: {
      framework: 'next',
      directories: [
        'src/components/product',
        'src/components/cart',
        'src/components/checkout',
        'src/components/account',
        'src/components/common',
        'src/pages',
        'src/hooks',
        'src/services',
        'src/store/slices',
        'src/utils',
        'public/images',
        'public/icons'
      ],
      entryPoints: ['pages/_app.js', 'pages/index.js'],
      configFiles: ['package.json', 'next.config.js', '.env.example']
    },
    backend: {
      framework: 'express',
      directories: [
        'src/api/v1',
        'src/controllers',
        'src/models',
        'src/services/catalog',
        'src/services/cart',
        'src/services/order',
        'src/services/payment',
        'src/services/shipping',
        'src/services/search',
        'src/middleware',
        'src/utils',
        'src/jobs',
        'tests/unit',
        'tests/integration',
        'tests/e2e'
      ],
      entryPoints: ['src/index.js', 'src/app.js'],
      configFiles: ['package.json', '.env.example']
    },
    admin: {
      framework: 'react',
      directories: [
        'admin/src/components',
        'admin/src/pages',
        'admin/src/services'
      ],
      entryPoints: ['admin/src/index.js'],
      configFiles: ['admin/package.json']
    },
    infrastructure: {
      directories: ['docker', 'terraform', 'scripts'],
      files: ['docker-compose.yml', 'Dockerfile']
    },
    shared: {
      directories: ['shared/types', 'shared/constants']
    }
  }
};

/**
 * S05: SaaS Product
 * Multi-tenant subscription-based software
 */
const S05_STRUCTURE = {
  name: 'SaaS Product',
  description: 'Multi-tenant subscription service with billing and analytics',
  characteristics: ['multi-tenant', 'subscription', 'billing', 'analytics'],
  layers: {
    apps: {
      web: {
        framework: 'react',
        directories: [
          'apps/web/src/components',
          'apps/web/src/pages',
          'apps/web/src/features',
          'apps/web/src/hooks',
          'apps/web/src/services',
          'apps/web/src/store'
        ],
        entryPoints: ['apps/web/src/index.js'],
        configFiles: ['apps/web/package.json', 'apps/web/vite.config.js']
      },
      mobile: {
        framework: 'react-native',
        directories: ['apps/mobile/src'],
        entryPoints: ['apps/mobile/App.js'],
        configFiles: ['apps/mobile/package.json']
      },
      admin: {
        framework: 'react',
        directories: ['apps/admin/src'],
        entryPoints: ['apps/admin/src/index.js'],
        configFiles: ['apps/admin/package.json']
      }
    },
    packages: {
      'ui-kit': {
        directories: [
          'packages/ui-kit/src/components',
          'packages/ui-kit/src/themes'
        ],
        entryPoints: ['packages/ui-kit/src/index.js'],
        configFiles: ['packages/ui-kit/package.json']
      },
      'api-client': {
        directories: ['packages/api-client/src'],
        entryPoints: ['packages/api-client/src/index.js'],
        configFiles: ['packages/api-client/package.json']
      },
      utils: {
        directories: ['packages/utils/src'],
        entryPoints: ['packages/utils/src/index.js'],
        configFiles: ['packages/utils/package.json']
      }
    },
    backend: {
      framework: 'express',
      directories: [
        'backend/src/api',
        'backend/src/controllers',
        'backend/src/models',
        'backend/src/services/tenant',
        'backend/src/services/subscription',
        'backend/src/services/billing',
        'backend/src/services/analytics',
        'backend/src/middleware/tenant',
        'backend/src/middleware/auth',
        'backend/src/utils',
        'backend/tests'
      ],
      entryPoints: ['backend/src/index.js'],
      configFiles: ['backend/package.json', '.env.example']
    },
    infrastructure: {
      directories: [
        'infrastructure/terraform/modules',
        'infrastructure/terraform/environments',
        'infrastructure/kubernetes',
        'infrastructure/scripts'
      ],
      files: []
    },
    shared: {
      directories: ['shared/types', 'shared/tenant-config']
    }
  },
  monorepo: {
    manager: 'npm', // or 'pnpm', 'yarn'
    workspaces: ['apps/*', 'packages/*', 'backend']
  }
};

/**
 * Get structure by scenario ID
 * @param {string} scenarioId - Scenario ID (S01-S05)
 * @returns {Object|null}
 */
function getStructure(scenarioId) {
  const structures = {
    'S01': S01_STRUCTURE,
    'S02': S02_STRUCTURE,
    'S03': S03_STRUCTURE,
    'S04': S04_STRUCTURE,
    'S05': S05_STRUCTURE
  };
  return structures[scenarioId] || null;
}

/**
 * Get all available structures
 * @returns {Object}
 */
function getAllStructures() {
  return {
    S01: S01_STRUCTURE,
    S02: S02_STRUCTURE,
    S03: S03_STRUCTURE,
    S04: S04_STRUCTURE,
    S05: S05_STRUCTURE
  };
}

/**
 * Get scenario summary
 * @param {string} scenarioId - Scenario ID
 * @returns {Object|null}
 */
function getScenarioSummary(scenarioId) {
  const structure = getStructure(scenarioId);
  if (!structure) return null;
  
  return {
    id: scenarioId,
    name: structure.name,
    description: structure.description,
    characteristics: structure.characteristics
  };
}

/**
 * List all scenarios
 * @returns {Array<Object>}
 */
function listScenarios() {
  return ['S01', 'S02', 'S03', 'S04', 'S05'].map(getScenarioSummary);
}

module.exports = {
  S01_STRUCTURE,
  S02_STRUCTURE,
  S03_STRUCTURE,
  S04_STRUCTURE,
  S05_STRUCTURE,
  getStructure,
  getAllStructures,
  getScenarioSummary,
  listScenarios
};
