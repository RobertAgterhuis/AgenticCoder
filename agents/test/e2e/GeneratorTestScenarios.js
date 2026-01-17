/**
 * GeneratorTestScenarios.js
 * Test scenarios for all 23 generators
 */

const testScenarios = {
  // ============================================
  // FRONTEND GENERATORS (5)
  // ============================================
  
  frontend: [
    {
      name: 'F01: React Component Generation',
      category: 'frontend',
      generator: 'react',
      input: {
        projectName: 'react-test-app',
        tech: { frontend: 'react', language: 'typescript' },
        features: ['authentication', 'api-integration']
      },
      expectedStructure: ['App.tsx', 'index.tsx', 'package.json', 'tsconfig.json']
    },
    {
      name: 'F02: Vue Application Generation',
      category: 'frontend',
      generator: 'vue',
      input: {
        projectName: 'vue-test-app',
        tech: { frontend: 'vue', language: 'typescript' },
        features: ['state-management', 'routing']
      },
      expectedStructure: ['App.vue', 'main.ts', 'package.json', 'vite.config.ts']
    },
    {
      name: 'F03: Next.js App Router Generation',
      category: 'frontend',
      generator: 'nextjs',
      input: {
        projectName: 'nextjs-test-app',
        tech: { frontend: 'nextjs', language: 'typescript' },
        features: ['server-components', 'api-routes']
      },
      expectedStructure: ['app/page.tsx', 'app/layout.tsx', 'next.config.js', 'package.json']
    },
    {
      name: 'F04: Angular Standalone Generation',
      category: 'frontend',
      generator: 'angular',
      input: {
        projectName: 'angular-test-app',
        tech: { frontend: 'angular', language: 'typescript' },
        features: ['routing', 'forms']
      },
      expectedStructure: ['app.component.ts', 'app.routes.ts', 'angular.json', 'package.json']
    },
    {
      name: 'F05: Vite Project Generation',
      category: 'frontend',
      generator: 'vite',
      input: {
        projectName: 'vite-test-app',
        tech: { frontend: 'vite', language: 'typescript' },
        features: ['hmr', 'build-optimization']
      },
      expectedStructure: ['vite.config.ts', 'index.html', 'package.json', 'tsconfig.json']
    }
  ],

  // ============================================
  // BACKEND GENERATORS (4)
  // ============================================
  
  backend: [
    {
      name: 'B01: Express API Generation',
      category: 'backend',
      generator: 'express',
      input: {
        projectName: 'express-api',
        tech: { backend: 'express', language: 'typescript' },
        features: ['rest-api', 'validation', 'error-handling']
      },
      expectedStructure: ['server.ts', 'routes/', 'middleware/', 'package.json']
    },
    {
      name: 'B02: NestJS Modular Generation',
      category: 'backend',
      generator: 'nestjs',
      input: {
        projectName: 'nestjs-api',
        tech: { backend: 'nestjs', language: 'typescript' },
        features: ['modules', 'guards', 'interceptors']
      },
      expectedStructure: ['main.ts', 'app.module.ts', 'nest-cli.json', 'package.json']
    },
    {
      name: 'B03: FastAPI Generation',
      category: 'backend',
      generator: 'fastapi',
      input: {
        projectName: 'fastapi-service',
        tech: { backend: 'fastapi', language: 'python' },
        features: ['pydantic-models', 'async-endpoints']
      },
      expectedStructure: ['main.py', 'models/', 'routers/', 'requirements.txt']
    },
    {
      name: 'B04: .NET Web API Generation',
      category: 'backend',
      generator: 'dotnet',
      input: {
        projectName: 'DotNetApi',
        tech: { backend: 'dotnet', language: 'csharp' },
        features: ['controllers', 'dependency-injection']
      },
      expectedStructure: ['Program.cs', 'Controllers/', 'appsettings.json', '.csproj']
    }
  ],

  // ============================================
  // DATABASE GENERATORS (4)
  // ============================================
  
  database: [
    {
      name: 'D01: PostgreSQL Schema Generation',
      category: 'database',
      generator: 'postgresql',
      input: {
        projectName: 'postgres-db',
        tech: { database: 'postgresql' },
        features: ['migrations', 'indexes', 'constraints']
      },
      expectedStructure: ['migrations/', 'schema.sql', 'seed.sql']
    },
    {
      name: 'D02: Azure SQL Generation',
      category: 'database',
      generator: 'azuresql',
      input: {
        projectName: 'azure-sql-db',
        tech: { database: 'azuresql' },
        features: ['stored-procedures', 't-sql']
      },
      expectedStructure: ['tables/', 'stored-procedures/', 'deploy.sql']
    },
    {
      name: 'D03: Cosmos DB Generation',
      category: 'database',
      generator: 'cosmosdb',
      input: {
        projectName: 'cosmos-db',
        tech: { database: 'cosmosdb' },
        features: ['containers', 'partition-keys']
      },
      expectedStructure: ['containers.json', 'indexing-policy.json']
    },
    {
      name: 'D04: SQL Server Generation',
      category: 'database',
      generator: 'sqlserver',
      input: {
        projectName: 'sqlserver-db',
        tech: { database: 'sqlserver' },
        features: ['tables', 'views', 'indexes']
      },
      expectedStructure: ['tables/', 'views/', 'scripts/']
    }
  ],

  // ============================================
  // ARCHITECTURE GENERATORS (3)
  // ============================================
  
  architecture: [
    {
      name: 'R01: Microservices Scaffold',
      category: 'architecture',
      generator: 'microservices',
      input: {
        projectName: 'microservices-platform',
        tech: { architecture: 'microservices' },
        features: ['service-discovery', 'api-gateway'],
        services: ['user-service', 'order-service', 'notification-service']
      },
      expectedStructure: ['services/', 'gateway/', 'docker-compose.yml']
    },
    {
      name: 'R02: Serverless Functions',
      category: 'architecture',
      generator: 'serverless',
      input: {
        projectName: 'serverless-functions',
        tech: { architecture: 'serverless', cloud: 'azure' },
        features: ['http-triggers', 'queue-triggers']
      },
      expectedStructure: ['host.json', 'local.settings.json', 'functions/']
    },
    {
      name: 'R03: Event-Driven Architecture',
      category: 'architecture',
      generator: 'eventdriven',
      input: {
        projectName: 'event-driven-system',
        tech: { architecture: 'event-driven' },
        features: ['event-sourcing', 'cqrs']
      },
      expectedStructure: ['events/', 'handlers/', 'aggregates/']
    }
  ],

  // ============================================
  // AZURE INFRASTRUCTURE GENERATORS (7)
  // ============================================
  
  azure: [
    {
      name: 'A01: Bicep Infrastructure',
      category: 'azure',
      generator: 'bicep',
      input: {
        projectName: 'azure-infra',
        tech: { infrastructure: 'bicep' },
        features: ['resource-group', 'app-service', 'sql-database']
      },
      expectedStructure: ['main.bicep', 'modules/', 'parameters/']
    },
    {
      name: 'A02: Entra ID Configuration',
      category: 'azure',
      generator: 'entraid',
      input: {
        projectName: 'entra-config',
        tech: { identity: 'entraid' },
        features: ['app-registration', 'api-permissions', 'rbac']
      },
      expectedStructure: ['app-registration.bicep', 'permissions.json']
    },
    {
      name: 'A03: Key Vault Secrets',
      category: 'azure',
      generator: 'keyvault',
      input: {
        projectName: 'keyvault-config',
        tech: { security: 'keyvault' },
        features: ['secrets', 'access-policies']
      },
      expectedStructure: ['keyvault.bicep', 'access-policies.bicep']
    },
    {
      name: 'A04: Storage Account',
      category: 'azure',
      generator: 'storage',
      input: {
        projectName: 'storage-config',
        tech: { storage: 'azurestorage' },
        features: ['blob-containers', 'queues', 'tables']
      },
      expectedStructure: ['storage.bicep', 'containers.bicep']
    },
    {
      name: 'A05: Networking Configuration',
      category: 'azure',
      generator: 'networking',
      input: {
        projectName: 'network-config',
        tech: { networking: 'azure' },
        features: ['vnet', 'subnets', 'nsg', 'private-endpoints']
      },
      expectedStructure: ['vnet.bicep', 'nsg.bicep', 'private-endpoints.bicep']
    },
    {
      name: 'A06: Monitoring Setup',
      category: 'azure',
      generator: 'monitoring',
      input: {
        projectName: 'monitoring-config',
        tech: { monitoring: 'azure' },
        features: ['app-insights', 'log-analytics', 'alerts']
      },
      expectedStructure: ['app-insights.bicep', 'log-analytics.bicep', 'alerts.bicep']
    },
    {
      name: 'A07: Container Apps',
      category: 'azure',
      generator: 'containerapps',
      input: {
        projectName: 'container-apps',
        tech: { containers: 'containerapps' },
        features: ['environment', 'apps', 'scaling']
      },
      expectedStructure: ['environment.bicep', 'apps/', 'ingress.bicep']
    }
  ]
};

/**
 * Get all test scenarios
 */
function getAllScenarios() {
  return [
    ...testScenarios.frontend,
    ...testScenarios.backend,
    ...testScenarios.database,
    ...testScenarios.architecture,
    ...testScenarios.azure
  ];
}

/**
 * Get scenarios by category
 */
function getScenariosByCategory(category) {
  return testScenarios[category] || [];
}

/**
 * Get scenarios by generator
 */
function getScenariosByGenerator(generator) {
  return getAllScenarios().filter(s => s.generator === generator);
}

/**
 * Create test suite for a category
 */
function createTestSuite(name, category) {
  return {
    name,
    tests: getScenariosByCategory(category)
  };
}

module.exports = {
  testScenarios,
  getAllScenarios,
  getScenariosByCategory,
  getScenariosByGenerator,
  createTestSuite
};
