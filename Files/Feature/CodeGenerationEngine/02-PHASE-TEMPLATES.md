# Phase 2: Template System

**Duration:** 2 weeks  
**Status:** ⬜ Not Started  
**Dependencies:** Phase 1 (Foundation)

---

## 🎯 Phase Objective

Build a flexible template system that provides boilerplate code for **all supported frameworks** (18 frameworks + Azure services), enabling consistent and high-quality code generation.

---

## 📊 Template Coverage Overview

| Category | Frameworks | Templates |
|----------|------------|-----------|
| Frontend | React, Vue, Next.js, Angular, Vite | 25+ |
| Backend | Express, NestJS, FastAPI, .NET | 20+ |
| Database | PostgreSQL, Azure SQL, Cosmos DB, SQL Server | 15+ |
| Azure | Bicep (15 service types) | 20+ |
| Architecture | Microservices, Serverless, Event-Driven | 15+ |
| **Total** | **18 frameworks** | **95+ templates** |

---

## 📋 Tasks

### Task 2.1: TemplateEngine Component

**Priority:** 🔴 Critical  
**Estimated:** 2 days

**Description:**  
Create a template engine that loads, processes, and renders code templates with variable substitution.

**Implementation:**

```javascript
// agents/core/generation/templates/TemplateEngine.js

class TemplateEngine {
  constructor(templatesRoot) {
    this.templatesRoot = templatesRoot;
    this.cache = new Map();
    this.helpers = new Map();
  }

  // Load template from file
  async loadTemplate(templatePath) {}
  
  // Render template with variables
  async render(templatePath, variables) {}
  
  // Register custom helper function
  registerHelper(name, fn) {}
  
  // Render inline template string
  renderString(templateString, variables) {}
  
  // Clear template cache
  clearCache() {}
}
```

**Template Syntax:**
```javascript
// Simple variable: {{variableName}}
// Conditional: {{#if condition}}...{{/if}}
// Loop: {{#each items}}...{{/each}}
// Helper: {{helper arg1 arg2}}

// Example template:
`import React from 'react';

export function {{componentName}}({{#if hasProps}}props{{/if}}) {
  return (
    <div className="{{className}}">
      {{#each children}}
      <{{this.type}} />
      {{/each}}
    </div>
  );
}
`
```

**Acceptance Criteria:**
- [ ] Variable substitution works
- [ ] Conditionals (if/else) work
- [ ] Loops (each) work
- [ ] Custom helpers supported
- [ ] Template caching for performance
- [ ] Clear error messages for invalid templates
- [ ] Unit tests with 90%+ coverage

**Files to Create:**
- `agents/core/generation/templates/TemplateEngine.js`
- `agents/core/generation/templates/TemplateEngine.test.js`

---

### Task 2.2: Template Registry

**Priority:** 🟡 High  
**Estimated:** 1 day

**Description:**  
Create a registry that organizes and discovers templates by framework and component type.

**Implementation:**

```javascript
// agents/core/generation/templates/TemplateRegistry.js

class TemplateRegistry {
  constructor(templateEngine) {
    this.engine = templateEngine;
    this.templates = new Map();
  }

  // Register template
  register(framework, componentType, templatePath) {}
  
  // Get template for framework/type combination
  getTemplate(framework, componentType) {}
  
  // List all templates for a framework
  listTemplates(framework) {}
  
  // Auto-discover templates from directory
  async discoverTemplates(rootPath) {}
  
  // Check if template exists
  hasTemplate(framework, componentType) {}
}
```

**Registry Structure:**
```
templates/
├── react/
│   ├── component.template.js
│   ├── page.template.js
│   ├── hook.template.js
│   ├── context.template.js
│   └── service.template.js
├── vue/
│   ├── component.template.vue
│   ├── composable.template.js
│   ├── store.template.js
│   └── page.template.vue
├── nextjs/
│   ├── page.template.tsx
│   ├── layout.template.tsx
│   ├── server-action.template.ts
│   ├── api-route.template.ts
│   └── middleware.template.ts
├── angular/
│   ├── component.template.ts
│   ├── service.template.ts
│   ├── directive.template.ts
│   └── module.template.ts
├── express/
│   ├── route.template.js
│   ├── controller.template.js
│   ├── middleware.template.js
│   ├── service.template.js
│   └── model.template.js
├── nestjs/
│   ├── module.template.ts
│   ├── controller.template.ts
│   ├── service.template.ts
│   ├── dto.template.ts
│   └── guard.template.ts
├── fastapi/
│   ├── router.template.py
│   ├── model.template.py
│   ├── schema.template.py
│   ├── service.template.py
│   └── dependency.template.py
├── database/
│   ├── postgresql/
│   │   ├── schema.template.sql
│   │   ├── migration.template.sql
│   │   └── seed.template.sql
│   ├── azure-sql/
│   │   ├── schema.template.sql
│   │   ├── stored-procedure.template.sql
│   │   └── migration.template.sql
│   └── cosmos-db/
│       ├── container.template.json
│       └── stored-procedure.template.js
├── bicep/
│   ├── core/
│   │   ├── module.template.bicep
│   │   └── main.template.bicep
│   ├── compute/
│   │   ├── app-service.template.bicep
│   │   ├── function-app.template.bicep
│   │   └── container-app.template.bicep
│   ├── data/
│   │   ├── sql-database.template.bicep
│   │   ├── cosmos-db.template.bicep
│   │   └── storage.template.bicep
│   ├── identity/
│   │   ├── entra-id.template.bicep
│   │   └── managed-identity.template.bicep
│   ├── security/
│   │   ├── keyvault.template.bicep
│   │   └── private-endpoint.template.bicep
│   ├── networking/
│   │   ├── vnet.template.bicep
│   │   ├── nsg.template.bicep
│   │   └── app-gateway.template.bicep
│   └── monitoring/
│       ├── app-insights.template.bicep
│       └── log-analytics.template.bicep
└── architecture/
    ├── microservices/
    │   ├── docker-compose.template.yml
    │   ├── api-gateway.template.yml
    │   └── service.template.yml
    ├── serverless/
    │   ├── function.template.js
    │   ├── durable-function.template.js
    │   └── host.template.json
    └── event-driven/
        ├── event-handler.template.js
        ├── event-publisher.template.js
        └── saga.template.js
```

**Acceptance Criteria:**
- [ ] Templates organized by framework
- [ ] Auto-discovery from directory structure
- [ ] Fallback to default templates
- [ ] Version support for templates
- [ ] Unit tests

**Files to Create:**
- `agents/core/generation/templates/TemplateRegistry.js`
- `agents/core/generation/templates/TemplateRegistry.test.js`

---

### Task 2.3: React Templates

**Priority:** 🔴 Critical  
**Estimated:** 2 days

**Description:**  
Create comprehensive React templates for all common component types.

**Templates to Create:**

#### 2.3.1 Function Component
```javascript
// templates/react/component.template.js
export const template = `
import React{{#if hasState}}, { useState }{{/if}}{{#if hasEffect}}, { useEffect }{{/if}} from 'react';
{{#if hasStyles}}
import styles from './{{componentName}}.module.css';
{{/if}}
{{#each imports}}
import { {{this.named}} } from '{{this.from}}';
{{/each}}

{{#if hasProps}}
interface {{componentName}}Props {
{{#each props}}
  {{this.name}}{{#unless this.required}}?{{/unless}}: {{this.type}};
{{/each}}
}
{{/if}}

export function {{componentName}}({{#if hasProps}}{ {{propsDestructure}} }: {{componentName}}Props{{/if}}) {
{{#each stateVars}}
  const [{{this.name}}, set{{this.nameCapitalized}}] = useState<{{this.type}}>({{this.initial}});
{{/each}}

{{#if hasEffect}}
  useEffect(() => {
    {{effectBody}}
  }, [{{effectDeps}}]);
{{/if}}

  return (
    {{jsxContent}}
  );
}

export default {{componentName}};
`;
```

#### 2.3.2 Page Component
```javascript
// templates/react/page.template.js
export const template = `
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
{{#each imports}}
import { {{this.named}} } from '{{this.from}}';
{{/each}}

export function {{pageName}}Page() {
  const params = useParams();
  const navigate = useNavigate();

  return (
    <div className="page {{pageClassName}}">
      <h1>{{pageTitle}}</h1>
      {{pageContent}}
    </div>
  );
}

export default {{pageName}}Page;
`;
```

#### 2.3.3 Custom Hook
```javascript
// templates/react/hook.template.js
export const template = `
import { useState, useEffect, useCallback } from 'react';

{{#if hasTypes}}
interface {{hookName}}Options {
{{#each options}}
  {{this.name}}?: {{this.type}};
{{/each}}
}

interface {{hookName}}Return {
{{#each returns}}
  {{this.name}}: {{this.type}};
{{/each}}
}
{{/if}}

export function {{hookName}}({{#if hasOptions}}options: {{hookName}}Options = {}{{/if}}){{#if hasTypes}}: {{hookName}}Return{{/if}} {
{{#each stateVars}}
  const [{{this.name}}, set{{this.nameCapitalized}}] = useState<{{this.type}}>({{this.initial}});
{{/each}}

{{hookBody}}

  return {
{{#each returns}}
    {{this.name}},
{{/each}}
  };
}
`;
```

#### 2.3.4 API Service
```javascript
// templates/react/service.template.js
export const template = `
const API_BASE = import.meta.env.VITE_API_URL || '/api';

{{#each endpoints}}
export async function {{this.name}}({{this.params}}): Promise<{{this.returnType}}> {
  const response = await fetch(\`\${API_BASE}{{this.path}}\`, {
    method: '{{this.method}}',
    headers: {
      'Content-Type': 'application/json',
    },
{{#if this.hasBody}}
    body: JSON.stringify({{this.bodyParam}}),
{{/if}}
  });

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status}\`);
  }

  return response.json();
}

{{/each}}
`;
```

**Acceptance Criteria:**
- [ ] Component template with props, state, effects
- [ ] Page template with routing
- [ ] Hook template
- [ ] Service template for API calls
- [ ] Context template for state management
- [ ] All templates TypeScript compatible
- [ ] Templates follow React best practices

**Files to Create:**
- `agents/core/generation/templates/react/component.template.js`
- `agents/core/generation/templates/react/page.template.js`
- `agents/core/generation/templates/react/hook.template.js`
- `agents/core/generation/templates/react/service.template.js`
- `agents/core/generation/templates/react/context.template.js`
- `agents/core/generation/templates/react/index.js`

---

### Task 2.4: Express Templates

**Priority:** 🔴 Critical  
**Estimated:** 2 days

**Description:**  
Create comprehensive Express.js templates for backend development.

**Templates to Create:**

#### 2.4.1 Route
```javascript
// templates/express/route.template.js
export const template = `
import { Router } from 'express';
import { {{controllerName}} } from '../controllers/{{controllerFile}}';
{{#if hasMiddleware}}
import { {{middlewareImports}} } from '../middleware';
{{/if}}

const router = Router();

{{#each routes}}
router.{{this.method}}('{{this.path}}'{{#if this.middleware}}, {{this.middleware}}{{/if}}, {{controllerName}}.{{this.handler}});
{{/each}}

export default router;
`;
```

#### 2.4.2 Controller
```javascript
// templates/express/controller.template.js
export const template = `
import { Request, Response, NextFunction } from 'express';
import { {{serviceName}} } from '../services/{{serviceFile}}';

export const {{controllerName}} = {
{{#each methods}}
  async {{this.name}}(req: Request, res: Response, next: NextFunction) {
    try {
{{this.body}}
    } catch (error) {
      next(error);
    }
  },

{{/each}}
};
`;
```

#### 2.4.3 Service
```javascript
// templates/express/service.template.js
export const template = `
{{#if hasModel}}
import { {{modelName}} } from '../models/{{modelFile}}';
{{/if}}
{{#if hasRepository}}
import { {{repositoryName}} } from '../repositories/{{repositoryFile}}';
{{/if}}

export class {{serviceName}} {
{{#if hasConstructor}}
  constructor({{constructorParams}}) {
{{constructorBody}}
  }
{{/if}}

{{#each methods}}
  async {{this.name}}({{this.params}}): Promise<{{this.returnType}}> {
{{this.body}}
  }

{{/each}}
}

export const {{serviceInstanceName}} = new {{serviceName}}({{serviceConstructorArgs}});
`;
```

#### 2.4.4 Middleware
```javascript
// templates/express/middleware.template.js
export const template = `
import { Request, Response, NextFunction } from 'express';

export function {{middlewareName}}({{#if hasOptions}}options: {{optionsType}} = {}{{/if}}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
{{middlewareBody}}
      next();
    } catch (error) {
      next(error);
    }
  };
}
`;
```

**Acceptance Criteria:**
- [ ] Route template with middleware support
- [ ] Controller template with error handling
- [ ] Service template with dependency injection
- [ ] Middleware template
- [ ] Model template (TypeORM/Prisma compatible)
- [ ] All templates TypeScript compatible
- [ ] Templates follow Express best practices

**Files to Create:**
- `agents/core/generation/templates/express/route.template.js`
- `agents/core/generation/templates/express/controller.template.js`
- `agents/core/generation/templates/express/service.template.js`
- `agents/core/generation/templates/express/middleware.template.js`
- `agents/core/generation/templates/express/model.template.js`
- `agents/core/generation/templates/express/index.js`

---

### Task 2.5: Infrastructure Templates

**Priority:** 🟡 High  
**Estimated:** 1 day

**Description:**  
Create Bicep templates for Azure infrastructure.

**Templates to Create:**

#### 2.5.1 Bicep Module
```bicep
// templates/bicep/module.template.bicep
@description('{{description}}')
param {{paramName}} {{paramType}}{{#if hasDefault}} = {{defaultValue}}{{/if}}

{{#each resources}}
resource {{this.symbolicName}} '{{this.type}}@{{this.apiVersion}}' = {
  name: {{this.name}}
  location: {{this.location}}
  properties: {
{{#each this.properties}}
    {{this.key}}: {{this.value}}
{{/each}}
  }
}

{{/each}}
{{#each outputs}}
output {{this.name}} {{this.type}} = {{this.value}}
{{/each}}
```

**Acceptance Criteria:**
- [ ] Module template
- [ ] App Service template
- [ ] SQL Database template
- [ ] Storage Account template
- [ ] Key Vault template
- [ ] Templates use AVM patterns

**Files to Create:**
- `agents/core/generation/templates/bicep/module.template.bicep`
- `agents/core/generation/templates/bicep/app-service.template.bicep`
- `agents/core/generation/templates/bicep/sql-database.template.bicep`
- `agents/core/generation/templates/bicep/storage.template.bicep`
- `agents/core/generation/templates/bicep/index.js`

---

## 📁 Files Created This Phase

```
agents/core/generation/templates/
├── TemplateEngine.js
├── TemplateEngine.test.js
├── TemplateRegistry.js
├── TemplateRegistry.test.js
│
├── react/                          # 5 templates
│   ├── index.js
│   ├── component.template.js
│   ├── page.template.js
│   ├── hook.template.js
│   ├── service.template.js
│   └── context.template.js
│
├── vue/                            # 5 templates
│   ├── index.js
│   ├── component.template.vue
│   ├── composable.template.js
│   ├── store.template.js
│   ├── page.template.vue
│   └── service.template.js
│
├── nextjs/                         # 5 templates
│   ├── index.js
│   ├── page.template.tsx
│   ├── layout.template.tsx
│   ├── server-action.template.ts
│   ├── api-route.template.ts
│   └── middleware.template.ts
│
├── angular/                        # 5 templates
│   ├── index.js
│   ├── component.template.ts
│   ├── service.template.ts
│   ├── directive.template.ts
│   ├── guard.template.ts
│   └── module.template.ts
│
├── express/                        # 5 templates
│   ├── index.js
│   ├── route.template.js
│   ├── controller.template.js
│   ├── service.template.js
│   ├── middleware.template.js
│   └── model.template.js
│
├── nestjs/                         # 6 templates
│   ├── index.js
│   ├── module.template.ts
│   ├── controller.template.ts
│   ├── service.template.ts
│   ├── dto.template.ts
│   ├── guard.template.ts
│   └── interceptor.template.ts
│
├── fastapi/                        # 5 templates
│   ├── index.js
│   ├── router.template.py
│   ├── model.template.py
│   ├── schema.template.py
│   ├── service.template.py
│   └── dependency.template.py
│
├── database/                       # 10 templates
│   ├── postgresql/
│   │   ├── schema.template.sql
│   │   ├── migration.template.sql
│   │   └── seed.template.sql
│   ├── azure-sql/
│   │   ├── schema.template.sql
│   │   ├── stored-procedure.template.sql
│   │   └── migration.template.sql
│   └── cosmos-db/
│       ├── container.template.json
│       ├── stored-procedure.template.js
│       └── index-policy.template.json
│
├── bicep/                          # 15 templates
│   ├── index.js
│   ├── core/
│   │   ├── module.template.bicep
│   │   └── main.template.bicep
│   ├── compute/
│   │   ├── app-service.template.bicep
│   │   ├── function-app.template.bicep
│   │   └── container-app.template.bicep
│   ├── data/
│   │   ├── sql-database.template.bicep
│   │   ├── cosmos-db.template.bicep
│   │   └── storage.template.bicep
│   ├── identity/
│   │   └── managed-identity.template.bicep
│   ├── security/
│   │   ├── keyvault.template.bicep
│   │   └── private-endpoint.template.bicep
│   ├── networking/
│   │   ├── vnet.template.bicep
│   │   └── nsg.template.bicep
│   └── monitoring/
│       └── app-insights.template.bicep
│
└── architecture/                   # 9 templates
    ├── microservices/
    │   ├── docker-compose.template.yml
    │   ├── api-gateway.template.yml
    │   └── service.template.yml
    ├── serverless/
    │   ├── function.template.js
    │   ├── durable-function.template.js
    │   └── host.template.json
    └── event-driven/
        ├── event-handler.template.js
        ├── event-publisher.template.js
        └── saga.template.js
```

**Template Count Summary:**
| Category | Templates |
|----------|-----------|
| React | 5 |
| Vue | 5 |
| Next.js | 5 |
| Angular | 5 |
| Express | 5 |
| NestJS | 6 |
| FastAPI | 5 |
| Database | 10 |
| Bicep | 15 |
| Architecture | 9 |
| **Total** | **70** |

---

## ✅ Phase Completion Checklist

- [ ] TemplateEngine implemented and tested
- [ ] TemplateRegistry implemented and tested
- [ ] React templates complete (5 types)
- [ ] Vue templates complete (5 types)
- [ ] Next.js templates complete (5 types)
- [ ] Angular templates complete (5 types)
- [ ] Express templates complete (5 types)
- [ ] NestJS templates complete (6 types)
- [ ] FastAPI templates complete (5 types)
- [ ] Database templates complete (10 types)
- [ ] Bicep templates complete (15 types)
- [ ] Architecture templates complete (9 types)
- [ ] All tests passing
- [ ] Templates documented

---

## 🔗 Navigation

← [01-PHASE-FOUNDATION.md](01-PHASE-FOUNDATION.md) | → [03-PHASE-GENERATORS.md](03-PHASE-GENERATORS.md)
