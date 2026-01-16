# Phase 3: Code Generators

**Duration:** 3 weeks  
**Status:** ⬜ Not Started  
**Dependencies:** Phase 1 (Foundation), Phase 2 (Templates), AgentSkillExpansion

---

## 🎯 Phase Objective

Implement **23 framework-specific code generators** that use the template system to produce complete, working code files based on requirements and architecture decisions.

---

## 📊 Generator Overview

| Category | Generators | Tasks |
|----------|------------|-------|
| Frontend | React, Vue, Next.js, Angular, Vite | 3.2-3.6 |
| Backend | Express, NestJS, FastAPI, .NET | 3.7-3.10 |
| Database | PostgreSQL, Azure SQL, Cosmos DB, SQL Server | 3.11-3.14 |
| Architecture | Microservices, Serverless, Event-Driven | 3.15-3.17 |
| Azure | Bicep, Entra ID, Key Vault, Storage, Network, Monitor, Container Apps | 3.18-3.24 |
| **Total** | **23 Generators** | |

---

## 📋 Tasks

### Task 3.1: PromptComposer Component

**Priority:** 🔴 Critical  
**Estimated:** 3 days

**Description:**  
Create the component that builds effective prompts for LLM-based code generation, combining context, requirements, and best practices.

**Implementation:**

```javascript
// agents/core/generation/PromptComposer.js

class PromptComposer {
  constructor(skillsRegistry) {
    this.skillsRegistry = skillsRegistry;
  }

  // Compose prompt for code generation
  composeCodePrompt(options) {
    const { 
      task,           // 'component', 'service', 'model', etc.
      framework,      // 'react', 'express', etc.
      requirements,   // Feature requirements
      context,        // Existing code context
      constraints     // Coding standards, patterns
    } = options;
    
    return this.buildPrompt(options);
  }
  
  // Build system prompt with best practices
  buildSystemPrompt(framework) {}
  
  // Include relevant skills in prompt
  includeSkills(framework, task) {}
  
  // Add code context (existing files, imports)
  addCodeContext(context) {}
  
  // Format requirements for prompt
  formatRequirements(requirements) {}
}
```

**Prompt Structure:**
```
SYSTEM:
You are an expert {{framework}} developer. Follow these best practices:
{{skills}}

CONTEXT:
Project: {{projectName}}
Scenario: {{scenario}}
Existing files:
{{existingFiles}}

REQUIREMENTS:
{{formattedRequirements}}

TASK:
Generate a {{componentType}} that:
{{taskDetails}}

OUTPUT FORMAT:
Return only the code, no explanations. Use TypeScript.
```

**Acceptance Criteria:**
- [ ] Composes effective prompts for different tasks
- [ ] Includes relevant skills/best practices
- [ ] Provides sufficient context
- [ ] Output is parseable code
- [ ] Supports all target frameworks
- [ ] Unit tests

**Files to Create:**
- `agents/core/generation/PromptComposer.js`
- `agents/core/generation/PromptComposer.test.js`
- `agents/core/generation/prompts/` (prompt templates)

---

### Task 3.2: ReactGenerator

**Priority:** 🔴 Critical  
**Estimated:** 3 days

**Description:**  
Implement the React code generator that produces components, pages, hooks, and services.

**Implementation:**

```javascript
// agents/core/generation/generators/ReactGenerator.js

class ReactGenerator extends BaseGenerator {
  constructor(templateRegistry, promptComposer) {
    super('react');
    this.templates = templateRegistry;
    this.promptComposer = promptComposer;
  }

  // Generate all React files for a project
  async generate(context) {
    const files = [];
    
    // Generate components from requirements
    for (const component of context.requirements.components) {
      files.push(await this.generateComponent(context, component));
    }
    
    // Generate pages
    for (const page of context.requirements.pages) {
      files.push(await this.generatePage(context, page));
    }
    
    // Generate hooks
    // Generate services
    // Generate App.tsx, main.tsx, router
    
    return files;
  }

  // Generate a single component
  async generateComponent(context, componentSpec) {
    // 1. Get template
    // 2. Compose prompt for complex logic
    // 3. Render template with variables
    // 4. Return file spec
  }
  
  // Generate page with routing
  async generatePage(context, pageSpec) {}
  
  // Generate custom hook
  async generateHook(context, hookSpec) {}
  
  // Generate API service
  async generateService(context, serviceSpec) {}
  
  // Generate routing configuration
  async generateRouter(context) {}
  
  // Generate package.json
  async generatePackageJson(context) {}
  
  // Generate vite.config.ts
  async generateViteConfig(context) {}
}
```

**Generated Files Example:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   └── Card/
│   │       ├── Card.tsx
│   │       └── index.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── LoginPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useApi.ts
│   ├── services/
│   │   └── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

**Acceptance Criteria:**
- [ ] Generates functional React components
- [ ] Generates pages with routing
- [ ] Generates custom hooks
- [ ] Generates API services
- [ ] Generates configuration files
- [ ] Output compiles without errors
- [ ] Follows React best practices
- [ ] TypeScript support
- [ ] Integration tests

**Files to Create:**
- `agents/core/generation/generators/ReactGenerator.js`
- `agents/core/generation/generators/ReactGenerator.test.js`

---

### Task 3.3: ExpressGenerator

**Priority:** 🔴 Critical  
**Estimated:** 3 days

**Description:**  
Implement the Express.js code generator for backend APIs.

**Implementation:**

```javascript
// agents/core/generation/generators/ExpressGenerator.js

class ExpressGenerator extends BaseGenerator {
  constructor(templateRegistry, promptComposer) {
    super('express');
    this.templates = templateRegistry;
    this.promptComposer = promptComposer;
  }

  // Generate all Express files
  async generate(context) {
    const files = [];
    
    // Generate from API specification
    for (const resource of context.architecture.resources) {
      files.push(...await this.generateResource(context, resource));
    }
    
    // Generate middleware
    // Generate app.ts, server.ts
    // Generate configuration
    
    return files;
  }

  // Generate complete resource (route, controller, service, model)
  async generateResource(context, resourceSpec) {
    return [
      await this.generateRoute(context, resourceSpec),
      await this.generateController(context, resourceSpec),
      await this.generateService(context, resourceSpec),
      await this.generateModel(context, resourceSpec),
    ];
  }
  
  // Generate route file
  async generateRoute(context, resourceSpec) {}
  
  // Generate controller
  async generateController(context, resourceSpec) {}
  
  // Generate service with business logic
  async generateService(context, resourceSpec) {}
  
  // Generate model/entity
  async generateModel(context, resourceSpec) {}
  
  // Generate middleware
  async generateMiddleware(context, middlewareSpec) {}
  
  // Generate app.ts (Express app setup)
  async generateApp(context) {}
  
  // Generate server.ts (entry point)
  async generateServer(context) {}
  
  // Generate package.json
  async generatePackageJson(context) {}
}
```

**Generated Files Example:**
```
backend/
├── src/
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   └── tasks.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   └── tasks.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   └── tasks.service.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Task.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── config/
│   │   └── database.ts
│   ├── app.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── .env.example
```

**Acceptance Criteria:**
- [ ] Generates complete REST API structure
- [ ] Generates CRUD operations per resource
- [ ] Generates authentication middleware
- [ ] Generates error handling
- [ ] Generates validation
- [ ] Output compiles without errors
- [ ] Follows Express best practices
- [ ] TypeScript support
- [ ] Integration tests

**Files to Create:**
- `agents/core/generation/generators/ExpressGenerator.js`
- `agents/core/generation/generators/ExpressGenerator.test.js`

---

### Task 3.4: PostgreSQLGenerator

**Priority:** 🟡 High  
**Estimated:** 2 days

**Description:**  
Implement the database schema and migration generator.

**Implementation:**

```javascript
// agents/core/generation/generators/PostgreSQLGenerator.js

class PostgreSQLGenerator extends BaseGenerator {
  constructor(templateRegistry, promptComposer) {
    super('postgresql');
    this.templates = templateRegistry;
    this.promptComposer = promptComposer;
  }

  // Generate all database files
  async generate(context) {
    const files = [];
    
    files.push(await this.generateSchema(context));
    files.push(...await this.generateMigrations(context));
    files.push(await this.generateSeedData(context));
    files.push(await this.generatePrismaSchema(context));
    
    return files;
  }

  // Generate complete schema
  async generateSchema(context) {}
  
  // Generate migrations
  async generateMigrations(context) {}
  
  // Generate seed data
  async generateSeedData(context) {}
  
  // Generate Prisma schema
  async generatePrismaSchema(context) {}
  
  // Generate TypeORM entities (alternative)
  async generateTypeORMEntities(context) {}
}
```

**Generated Files Example:**
```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   │   ├── 001_initial/
│   │   │   └── migration.sql
│   │   └── 002_add_tasks/
│   │       └── migration.sql
│   └── seed.ts
└── src/
    └── database/
        └── client.ts
```

**Acceptance Criteria:**
- [ ] Generates Prisma schema from requirements
- [ ] Generates SQL migrations
- [ ] Generates seed data
- [ ] Supports relationships (1:1, 1:N, N:M)
- [ ] Supports indexes and constraints
- [ ] Schema is valid and can run

**Files to Create:**
- `agents/core/generation/generators/PostgreSQLGenerator.js`
- `agents/core/generation/generators/PostgreSQLGenerator.test.js`

---

### Task 3.5: BicepGenerator

**Priority:** 🟡 High  
**Estimated:** 2 days

**Description:**  
Implement the Azure Bicep infrastructure generator using AVM patterns.

**Implementation:**

```javascript
// agents/core/generation/generators/BicepGenerator.js

class BicepGenerator extends BaseGenerator {
  constructor(templateRegistry, promptComposer, avmRegistry) {
    super('bicep');
    this.templates = templateRegistry;
    this.promptComposer = promptComposer;
    this.avmRegistry = avmRegistry;  // Azure Verified Modules
  }

  // Generate all Bicep files
  async generate(context) {
    const files = [];
    
    files.push(await this.generateMain(context));
    files.push(...await this.generateModules(context));
    files.push(...await this.generateParameterFiles(context));
    
    return files;
  }

  // Generate main.bicep
  async generateMain(context) {}
  
  // Generate resource modules
  async generateModules(context) {}
  
  // Generate parameter files per environment
  async generateParameterFiles(context) {}
  
  // Resolve AVM module reference
  async resolveAVMModule(resourceType) {}
}
```

**Generated Files Example:**
```
infrastructure/
├── main.bicep
├── modules/
│   ├── app-service.bicep
│   ├── sql-database.bicep
│   ├── storage.bicep
│   └── keyvault.bicep
└── parameters/
    ├── dev.bicepparam
    ├── staging.bicepparam
    └── prod.bicepparam
```

**Acceptance Criteria:**
- [ ] Generates valid Bicep files
- [ ] Uses AVM modules where available
- [ ] Generates environment-specific parameters
- [ ] Supports all scenario infrastructure needs
- [ ] Bicep compiles without errors

**Files to Create:**
- `agents/core/generation/generators/BicepGenerator.js`
- `agents/core/generation/generators/BicepGenerator.test.js`

---

### Task 3.6: CodeValidator Component

**Priority:** 🟡 High  
**Estimated:** 2 days

**Description:**  
Validate generated code for syntax errors and basic correctness.

**Implementation:**

```javascript
// agents/core/generation/CodeValidator.js

class CodeValidator {
  constructor() {
    this.validators = new Map();
  }

  // Register validator for file type
  registerValidator(extension, validator) {}
  
  // Validate single file
  async validateFile(filePath, content) {
    const extension = path.extname(filePath);
    const validator = this.validators.get(extension);
    
    if (!validator) {
      return { valid: true, errors: [] };
    }
    
    return validator.validate(content);
  }
  
  // Validate all generated files
  async validateAll(files) {}
}

// TypeScript/JavaScript validator
class TypeScriptValidator {
  async validate(content) {
    // Use TypeScript compiler API
  }
}

// Bicep validator
class BicepValidator {
  async validate(content) {
    // Use bicep CLI
  }
}

// SQL validator
class SQLValidator {
  async validate(content) {
    // Basic SQL syntax check
  }
}
```

**Acceptance Criteria:**
- [ ] Validates TypeScript/JavaScript syntax
- [ ] Validates Bicep syntax (using CLI)
- [ ] Validates SQL syntax
- [ ] Returns clear error messages
- [ ] Fast enough for real-time feedback

**Files to Create:**
- `agents/core/generation/CodeValidator.js`
- `agents/core/generation/validators/TypeScriptValidator.js`
- `agents/core/generation/validators/BicepValidator.js`
- `agents/core/generation/validators/SQLValidator.js`
- `agents/core/generation/CodeValidator.test.js`

---

## 📁 Files Created This Phase

```
agents/core/generation/
├── PromptComposer.js
├── PromptComposer.test.js
├── CodeValidator.js
├── CodeValidator.test.js
├── prompts/
│   ├── system-prompts.js
│   └── task-prompts.js
├── validators/
│   ├── TypeScriptValidator.js
│   ├── PythonValidator.js
│   ├── BicepValidator.js
│   └── SQLValidator.js
└── generators/
    │
    │   # Frontend Generators (5)
    ├── ReactGenerator.js
    ├── ReactGenerator.test.js
    ├── VueGenerator.js
    ├── VueGenerator.test.js
    ├── NextJSGenerator.js
    ├── NextJSGenerator.test.js
    ├── AngularGenerator.js
    ├── AngularGenerator.test.js
    ├── ViteGenerator.js
    ├── ViteGenerator.test.js
    │
    │   # Backend Generators (4)
    ├── ExpressGenerator.js
    ├── ExpressGenerator.test.js
    ├── NestJSGenerator.js
    ├── NestJSGenerator.test.js
    ├── FastAPIGenerator.js
    ├── FastAPIGenerator.test.js
    ├── DotNetGenerator.js
    ├── DotNetGenerator.test.js
    │
    │   # Database Generators (4)
    ├── PostgreSQLGenerator.js
    ├── PostgreSQLGenerator.test.js
    ├── AzureSQLGenerator.js
    ├── AzureSQLGenerator.test.js
    ├── CosmosDBGenerator.js
    ├── CosmosDBGenerator.test.js
    ├── SQLServerGenerator.js
    ├── SQLServerGenerator.test.js
    │
    │   # Architecture Generators (3)
    ├── MicroservicesGenerator.js
    ├── MicroservicesGenerator.test.js
    ├── ServerlessGenerator.js
    ├── ServerlessGenerator.test.js
    ├── EventDrivenGenerator.js
    ├── EventDrivenGenerator.test.js
    │
    │   # Azure Infrastructure Generators (7)
    ├── BicepGenerator.js
    ├── BicepGenerator.test.js
    ├── EntraIDGenerator.js
    ├── EntraIDGenerator.test.js
    ├── KeyVaultGenerator.js
    ├── KeyVaultGenerator.test.js
    ├── StorageGenerator.js
    ├── StorageGenerator.test.js
    ├── NetworkingGenerator.js
    ├── NetworkingGenerator.test.js
    ├── MonitoringGenerator.js
    ├── MonitoringGenerator.test.js
    ├── ContainerAppsGenerator.js
    └── ContainerAppsGenerator.test.js
```

**Generator Count:** 23 generators + 23 test files = 46 files

---

## ✅ Phase Completion Checklist

### Core Components
- [ ] PromptComposer implemented
- [ ] CodeValidator validates all output

### Frontend Generators (5)
- [ ] ReactGenerator produces working code
- [ ] VueGenerator produces working code
- [ ] NextJSGenerator produces working code
- [ ] AngularGenerator produces working code
- [ ] ViteGenerator produces configuration

### Backend Generators (4)
- [ ] ExpressGenerator produces working code
- [ ] NestJSGenerator produces working code
- [ ] FastAPIGenerator produces working code
- [ ] DotNetGenerator produces working code

### Database Generators (4)
- [ ] PostgreSQLGenerator produces valid schemas
- [ ] AzureSQLGenerator produces T-SQL scripts
- [ ] CosmosDBGenerator produces data models
- [ ] SQLServerGenerator produces valid schemas

### Architecture Generators (3)
- [ ] MicroservicesGenerator produces multi-service scaffolding
- [ ] ServerlessGenerator produces Azure Functions
- [ ] EventDrivenGenerator produces event patterns

### Azure Infrastructure Generators (7)
- [ ] BicepGenerator produces valid infrastructure
- [ ] EntraIDGenerator produces identity config
- [ ] KeyVaultGenerator produces secrets setup
- [ ] StorageGenerator produces storage config
- [ ] NetworkingGenerator produces VNet/NSG
- [ ] MonitoringGenerator produces App Insights
- [ ] ContainerAppsGenerator produces container config

### Quality
- [ ] All generators have integration tests
- [ ] Generated code compiles
- [ ] Code follows best practices per framework

---

## 🔗 Navigation

← [02-PHASE-TEMPLATES.md](02-PHASE-TEMPLATES.md) | → [04-PHASE-INTEGRATION.md](04-PHASE-INTEGRATION.md)
