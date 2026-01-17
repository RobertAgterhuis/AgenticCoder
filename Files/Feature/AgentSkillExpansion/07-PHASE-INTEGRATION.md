# Phase 7: Integration & Testing

**Duration:** 1 week  
**Status:** ✅ COMPLETE  
**Completed:** 2026-01-17  
**Priority:** 🟡 High

---

## 🎯 Phase Objective

Integreren van alle nieuwe agents en skills in het bestaande systeem, updaten van handoff protocols, en valideren dat alles correct samenwerkt.

---

## 📋 Tasks

### Task 6.1: Agent Registry Update

**Priority:** 🔴 Critical  
**Estimated:** 1 dag

**Description:**  
Update het agent registry met alle nieuwe agents en hun relaties.

**Updated Agent Hierarchy:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         @coordinator                                 │
│                    (Orchestration Layer)                            │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   @architect  │     │    @plan      │     │   @backlog    │
│  (Phase 2-5)  │     │  (Phase 3)    │     │  (Phase 3)    │
└───────┬───────┘     └───────────────┘     └───────────────┘
        │
        ├─────────────────────────────────────────────────────────┐
        │                                                         │
        ▼                                                         ▼
┌───────────────────────────────────────┐     ┌───────────────────────────────────────┐
│         Architecture Specialists       │     │          Azure Specialists            │
├───────────────────────────────────────┤     ├───────────────────────────────────────┤
│ @code-architect                       │     │ @azure-architect                      │
│ @microservices-architect      🆕      │     │ @bicep-specialist                     │
│ @event-driven-architect       🆕      │     │ @serverless-specialist        🆕      │
│ @serverless-specialist        🆕      │     │ @api-gateway-specialist       🆕      │
└───────────────────────────────────────┘     │ @container-specialist         🆕      │
                                              │ @entra-id-specialist          🆕      │
                                              │ @keyvault-specialist          🆕      │
                                              │ @cosmos-db-specialist         🆕      │
                                              │ @storage-specialist           🆕      │
                                              │ @networking-specialist        🆕      │
                                              │ @monitoring-specialist        🆕      │
                                              └───────────────────────────────────────┘
        │
        ├─────────────────────────────────────────────────────────┐
        │                                                         │
        ▼                                                         ▼
┌───────────────────────────────────────┐     ┌───────────────────────────────────────┐
│         Frontend Specialists          │     │          Backend Specialists          │
├───────────────────────────────────────┤     ├───────────────────────────────────────┤
│ @frontend-specialist                  │     │ @backend-specialist                   │
│ @react-specialist                     │     │ @dotnet-specialist                    │
│ @vue-specialist               🆕      │     │ @nodejs-specialist            🆕      │
│ @nextjs-specialist            🆕      │     │ @python-specialist            🆕      │
│ @angular-specialist           🆕      │     └───────────────────────────────────────┘
└───────────────────────────────────────┘
                                              ┌───────────────────────────────────────┐
                                              │         Database Specialists          │
                                              ├───────────────────────────────────────┤
                                              │ @database-specialist                  │
                                              │ @azure-sql-specialist         🆕      │
                                              │ @sql-server-specialist        🆕      │
                                              └───────────────────────────────────────┘
```

**Registry Configuration:**

```json
{
  "agents": {
    "orchestration": ["@coordinator"],
    "planning": ["@plan", "@backlog", "@architect"],
    "architecture": [
      "@code-architect",
      "@microservices-architect",
      "@event-driven-architect"
    ],
    "azure": [
      "@azure-architect",
      "@bicep-specialist",
      "@serverless-specialist",
      "@api-gateway-specialist",
      "@container-specialist",
      "@entra-id-specialist",
      "@keyvault-specialist",
      "@cosmos-db-specialist",
      "@storage-specialist",
      "@networking-specialist",
      "@monitoring-specialist"
    ],
    "frontend": [
      "@frontend-specialist",
      "@react-specialist",
      "@vue-specialist",
      "@nextjs-specialist",
      "@angular-specialist"
    ],
    "backend": [
      "@backend-specialist",
      "@dotnet-specialist",
      "@nodejs-specialist",
      "@python-specialist"
    ],
    "database": [
      "@database-specialist",
      "@azure-sql-specialist",
      "@sql-server-specialist"
    ],
    "quality": ["@qa", "@doc", "@reporter"],
    "devops": ["@devops-specialist", "@azure-devops-specialist"]
  }
}
```

**Acceptance Criteria:**
- [ ] All 12 new agents in registry
- [ ] Agent relationships defined
- [ ] Phase assignments correct
- [ ] Handoff triggers documented

**Files to Update:**
- `.github/integration/agent-registry.json`
- `docs/wiki/Agents.md`

---

### Task 6.2: Skill Registry Update

**Priority:** 🔴 Critical  
**Estimated:** 1 dag

**Description:**  
Update het skill registry met alle nieuwe skills en hun mappings naar agents.

**Skill-to-Agent Mapping:**

```json
{
  "skills": {
    "database": {
      "azure-sql-patterns": ["@azure-sql-specialist"],
      "tsql-programming": ["@azure-sql-specialist", "@sql-server-specialist"],
      "sql-performance-tuning": ["@azure-sql-specialist", "@sql-server-specialist", "@database-specialist"],
      "database-migration": ["@database-specialist", "@azure-sql-specialist"],
      "sql-schema-design": ["@database-specialist"],
      "cosmos-db-patterns": ["@cosmos-db-specialist"]
    },
    "frontend": {
      "react-patterns": ["@react-specialist", "@frontend-specialist"],
      "vue-patterns": ["@vue-specialist"],
      "nextjs-patterns": ["@nextjs-specialist"],
      "angular-patterns": ["@angular-specialist"],
      "vite-tooling": ["@vue-specialist", "@react-specialist", "@frontend-specialist"],
      "state-management": ["@frontend-specialist", "@react-specialist", "@vue-specialist"]
    },
    "architecture": {
      "microservices-patterns": ["@microservices-architect"],
      "event-driven-patterns": ["@event-driven-architect"],
      "serverless-patterns": ["@serverless-specialist"],
      "cqrs-event-sourcing": ["@microservices-architect", "@event-driven-architect"],
      "saga-patterns": ["@microservices-architect", "@event-driven-architect"],
      "architecture-design": ["@architect", "@code-architect"]
    },
    "infrastructure": {
      "api-gateway-patterns": ["@api-gateway-specialist"],
      "azure-functions-patterns": ["@serverless-specialist"],
      "container-apps-patterns": ["@container-specialist"],
      "service-bus-patterns": ["@event-driven-architect", "@microservices-architect"],
      "infrastructure-automation": ["@bicep-specialist", "@azure-architect"],
      "azure-networking-patterns": ["@networking-specialist", "@azure-architect"],
      "azure-storage-patterns": ["@storage-specialist"],
      "azure-monitoring-patterns": ["@monitoring-specialist"]
    },
    "security": {
      "entra-id-patterns": ["@entra-id-specialist"],
      "keyvault-patterns": ["@keyvault-specialist", "@azure-architect"]
    },
    "backend": {
      "express-patterns": ["@nodejs-specialist"],
      "fastapi-patterns": ["@python-specialist"],
      "nestjs-patterns": ["@nodejs-specialist"],
      "dotnet-webapi": ["@dotnet-specialist"],
      "error-handling": ["@backend-specialist"]
    }
  }
}
```

**Acceptance Criteria:**
- [ ] All 20 new skills in registry
- [ ] Skill-agent mappings defined
- [ ] Skill categories correct
- [ ] Documentation updated

**Files to Update:**
- `.github/integration/skill-registry.json`
- `docs/wiki/Skills.md`

---

### Task 6.3: Handoff Protocol Updates

**Priority:** 🔴 Critical  
**Estimated:** 1 dag

**Description:**  
Update handoff protocols voor alle nieuwe agent combinaties.

**New Handoff Patterns:**

```markdown
## Architecture Handoffs

@architect → @microservices-architect
  Trigger: architecture_pattern = "microservices"
  Payload: domain_model, bounded_contexts, service_list

@architect → @event-driven-architect
  Trigger: architecture_pattern = "event-driven"
  Payload: event_catalog, producer_consumer_map

@architect → @serverless-specialist
  Trigger: architecture_pattern = "serverless"
  Payload: function_list, trigger_types, bindings

## Frontend Handoffs

@frontend-specialist → @vue-specialist
  Trigger: frontend_framework = "vue"
  Payload: component_tree, state_requirements, routing

@frontend-specialist → @nextjs-specialist
  Trigger: frontend_framework = "nextjs"
  Payload: pages, api_routes, data_fetching_strategy

@frontend-specialist → @angular-specialist
  Trigger: frontend_framework = "angular"
  Payload: modules, components, services

## Backend Handoffs

@backend-specialist → @nodejs-specialist
  Trigger: backend_framework in ["express", "nestjs"]
  Payload: api_spec, service_definitions

@backend-specialist → @python-specialist
  Trigger: backend_framework in ["fastapi", "django"]
  Payload: api_spec, service_definitions

## Database Handoffs

@database-specialist → @azure-sql-specialist
  Trigger: database_system = "azure-sql"
  Payload: entity_model, performance_requirements

@database-specialist → @sql-server-specialist
  Trigger: database_system = "sql-server"
  Payload: entity_model, stored_procedures_required
```

**Acceptance Criteria:**
- [ ] All new handoffs documented
- [ ] Trigger conditions defined
- [ ] Payload schemas created
- [ ] Integration tested

**Files to Update:**
- `.github/agents/AGENT_HANDOFF_MATRIX.md`
- Individual agent files (handoff sections)

---

### Task 6.4: Framework Selection Logic

**Priority:** 🟡 High  
**Estimated:** 1 dag

**Description:**  
Implementeer logica voor automatische framework selectie op basis van requirements.

**Selection Matrix:**

```typescript
interface FrameworkSelector {
  selectFrontend(requirements: Requirements): FrontendFramework;
  selectBackend(requirements: Requirements): BackendFramework;
  selectDatabase(requirements: Requirements): DatabaseSystem;
  selectArchitecture(requirements: Requirements): ArchitecturePattern;
}

const frameworkRules = {
  frontend: {
    // Default to React
    default: 'react',
    
    // SSR/SEO required → Next.js
    ssr: 'nextjs',
    seo: 'nextjs',
    
    // Simple SPA, Vue preference → Vue
    simpleSpa: 'vue',
    
    // Enterprise, strict typing → Angular
    enterprise: 'angular',
    largeTeam: 'angular',
  },
  
  backend: {
    // Default to Express (simple)
    default: 'express',
    
    // Enterprise Node → NestJS
    enterpriseNode: 'nestjs',
    microservices: 'nestjs',
    
    // ML/Data → FastAPI
    mlIntegration: 'fastapi',
    dataHeavy: 'fastapi',
    
    // .NET ecosystem → dotnet
    microsoftStack: 'dotnet',
    existingDotnet: 'dotnet',
  },
  
  database: {
    // Default to PostgreSQL
    default: 'postgresql',
    
    // Azure deployment → Azure SQL
    azureDeployment: 'azure-sql',
    
    // On-premises SQL Server
    onPremises: 'sql-server',
    existingSqlServer: 'sql-server',
  },
  
  architecture: {
    // Default to monolith
    default: 'monolith',
    
    // Scale requirements → Microservices
    highScale: 'microservices',
    multipleTeams: 'microservices',
    
    // Real-time, async → Event-driven
    realTime: 'event-driven',
    asyncProcessing: 'event-driven',
    
    // Cost-sensitive, burst → Serverless
    costSensitive: 'serverless',
    burstTraffic: 'serverless',
  }
};
```

**Acceptance Criteria:**
- [ ] Selection logic implemented
- [ ] All frameworks covered
- [ ] Override capability
- [ ] Documentation

**Files to Create:**
- `.github/integration/framework-selector.md`

---

### Task 6.5: Integration Testing

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Validate alle nieuwe agents en skills werken correct met het bestaande systeem.

**Test Scenarios:**

| Scenario | Agents Involved | Expected Flow |
|----------|-----------------|---------------|
| Vue + Express + Azure SQL | @vue-specialist, @nodejs-specialist, @azure-sql-specialist | Full stack generation |
| Next.js + Serverless | @nextjs-specialist, @serverless-specialist | SSR + Azure Functions |
| Microservices + Event-Driven | @microservices-architect, @event-driven-architect, @container-specialist | Service mesh generation |
| NestJS + Azure SQL + APIM | @nodejs-specialist, @azure-sql-specialist, @api-gateway-specialist | Enterprise API |
| FastAPI + PostgreSQL | @python-specialist, @database-specialist | Python API |
| Angular + .NET + SQL Server | @angular-specialist, @dotnet-specialist, @sql-server-specialist | Microsoft stack |

**Test Categories:**

1. **Agent Activation Tests**
   - Each new agent activates on correct triggers
   - Input schema validation
   - Output schema compliance

2. **Handoff Tests**
   - Correct agent receives handoff
   - Payload transformation correct
   - Error handling works

3. **Skill Loading Tests**
   - Skills load for correct agents
   - Skill content accessible
   - No circular dependencies

4. **End-to-End Tests**
   - Complete scenario execution
   - All agents participate correctly
   - Output is valid and complete

**Acceptance Criteria:**
- [ ] All 12 new agents tested
- [ ] All 20 new skills tested
- [ ] All handoff combinations tested
- [ ] E2E scenarios pass

**Files to Create:**
- `tests/integration/new-agents.test.js`
- `tests/integration/new-skills.test.js`
- `tests/e2e/expanded-scenarios.test.js`

---

### Task 6.6: Documentation Update

**Priority:** 🟡 High  
**Estimated:** 1 dag

**Description:**  
Update alle documentatie met nieuwe agents en skills.

**Documentation Updates:**

| Document | Updates Needed |
|----------|----------------|
| docs/wiki/Home.md | Add new agent/skill counts |
| docs/wiki/Agents.md | Add 12 new agents |
| docs/wiki/Skills.md | Add 20 new skills |
| docs/wiki/Architecture.md | Update diagrams |
| docs/wiki/Workflows.md | Add new workflow patterns |
| docs/wiki/Scenarios.md | Add new scenario types |
| README.md | Update feature list |

**Acceptance Criteria:**
- [ ] All wiki pages updated
- [ ] Diagrams updated
- [ ] README updated
- [ ] No broken links

---

## 📊 Summary: Before vs After

### Agents

| Category | Before | After | Change |
|----------|--------|-------|--------|
| Frontend | 2 | 5 | +3 |
| Backend | 2 | 4 | +2 |
| Database | 1 | 3 | +2 |
| Architecture | 2 | 5 | +3 |
| Azure/Infrastructure | 2 | 11 | +9 |
| **Total** | **17** | **35** | **+18** |

### Skills

| Category | Before | After | Change |
|----------|--------|-------|--------|
| Frontend | 2 | 6 | +4 |
| Backend | 3 | 6 | +3 |
| Database | 2 | 7 | +5 |
| Architecture | 1 | 6 | +5 |
| Infrastructure | 2 | 6 | +4 |
| Security | 0 | 2 | +2 |
| Azure Services | 0 | 3 | +3 |
| **Total** | **15** | **41** | **+26** |

### Technology Coverage

| Technology | Before | After |
|------------|--------|-------|
| React | ✅ | ✅ |
| Vue | ❌ | ✅ |
| Next.js | ❌ | ✅ |
| Angular | ❌ | ✅ |
| Express | Partial | ✅ |
| NestJS | ❌ | ✅ |
| FastAPI | ❌ | ✅ |
| Azure SQL | ❌ | ✅ |
| SQL Server/T-SQL | Partial | ✅ |
| Cosmos DB | ❌ | ✅ |
| Microservices | ❌ | ✅ |
| Event-Driven | ❌ | ✅ |
| Serverless | ❌ | ✅ |
| API Gateway | ❌ | ✅ |
| Container Apps | ❌ | ✅ |
| Entra ID (Auth) | ❌ | ✅ |
| Key Vault | ❌ | ✅ |
| Azure Storage | ❌ | ✅ |
| VNet/Networking | ❌ | ✅ |
| App Insights | ❌ | ✅ |

---

## ✅ Phase Completion Checklist

- [ ] Agent registry updated
- [ ] Skill registry updated
- [ ] Handoff protocols updated
- [ ] Framework selection logic implemented
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] All E2E scenarios pass

---

## 🔗 Navigation

← [06-PHASE-AZURE-ECOSYSTEM.md](06-PHASE-AZURE-ECOSYSTEM.md) | → [COMPLETE]

---

## 🎯 Next Steps After Completion

Na completion van deze feature:

1. **Update CodeGenerationEngine Feature**
   - Voeg nieuwe generators toe (VueGenerator, NextJSGenerator, etc.)
   - Update template registry met nieuwe framework templates
   - Implementeer framework-specifieke validators

2. **Create New Scenarios**
   - S06: Vue + FastAPI + PostgreSQL
   - S07: Next.js + Serverless + Azure SQL
   - S08: Angular + NestJS + SQL Server
   - S09: Microservices met Event-Driven
   - S10: Full Serverless Architecture

3. **Roadmap Update**
   - Mark AgentSkillExpansion als complete
   - Update timeline voor CodeGenerationEngine
