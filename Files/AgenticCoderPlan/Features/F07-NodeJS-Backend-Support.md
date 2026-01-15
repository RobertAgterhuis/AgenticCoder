# Feature F07: Node.js Backend Support

**Status**: Planned  
**Priority**: High  
**Complexity**: Medium  
**Estimated Effort**: 4-5 weeks  
**Target Phase**: Phase 2 Integration

---

## Problem Statement

### Current Gap
In AGENT_ACTIVATION_GUIDE.md staat bij **@dotnet-specialist**:

```
❌ SKIPS when:
- Backend language: Node.js, Python, Go, Java
```

**Betekenis**: Als gebruiker Node.js kiest als backend:
- ❌ Geen agent voor Node.js backend implementation
- ❌ Geen Node.js-specific patterns (Express, Fastify, NestJS)
- ❌ Geen skill voor Node.js best practices
- ❌ Geen schemas voor Node.js API generation
- ❌ Geen integration met npm ecosystem

### Business Impact
- **Node.js is #1 backend runtime** (50%+ market share)
- JavaScript full-stack development (same language frontend + backend)
- Grootste package ecosystem (npm: 2M+ packages)
- Excellent for real-time applications (WebSockets, SSE)
- Microservices en serverless (AWS Lambda, Azure Functions)
- Strong in startups en moderne enterprises

---

## Proposed Solution

### New Components Needed

#### 1. Agent: @nodejs-specialist
**Responsibility**: Node.js backend implementation  
**Phase**: 14 (parallel met @dotnet-specialist)  
**Activation**: `IF backend_language == "Node.js"`

**Output**:
- Express.js or Fastify API routes
- NestJS modules (optional, for enterprise)
- TypeScript configuration
- Middleware (auth, validation, error handling)
- Database integration (Prisma, TypeORM, Mongoose)
- Authentication (JWT, Passport.js)
- API documentation (Swagger/OpenAPI)
- Unit tests (Jest)
- Integration tests (Supertest)

#### 2. Skill: nodejs-api-patterns
**Type**: Code skill  
**Used by**: @nodejs-specialist

**Content**:
- Express.js patterns (routing, middleware)
- Fastify patterns (performance-optimized)
- NestJS patterns (enterprise architecture)
- RESTful API design
- Error handling strategies
- Async/await best practices
- Request validation (Zod, Joi)
- Security best practices (helmet, cors)

#### 3. Skill: nodejs-database-integration
**Type**: Code skill  
**Used by**: @nodejs-specialist

**Content**:
- Prisma ORM patterns
- TypeORM patterns
- Mongoose (MongoDB) patterns
- Database migrations
- Seeding strategies
- Connection pooling
- Transaction management

#### 4. Schemas (6 files)
```
.github/schemas/agents/
├── @nodejs-specialist.input.schema.json
└── @nodejs-specialist.output.schema.json

.github/schemas/skills/
├── nodejs-api-patterns.input.schema.json
├── nodejs-api-patterns.output.schema.json
├── nodejs-database-integration.input.schema.json
└── nodejs-database-integration.output.schema.json
```

---

## Implementation Phases

### Phase 1: Research & Design (Week 1)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] Framework decision matrix (Express vs Fastify vs NestJS)
- [ ] ORM comparison (Prisma vs TypeORM vs Sequelize)
- [ ] TypeScript configuration best practices
- [ ] Package manager choice (npm vs pnpm vs yarn)
- [ ] Testing strategy (Jest, Vitest, Supertest)

**Review Points**:
- Express (simplicity) vs Fastify (performance) vs NestJS (enterprise)?
  - **Recommendation**: Support all three, Express as default
- Prisma (modern) vs TypeORM (established)?
  - **Recommendation**: Prisma as default
- CommonJS vs ES Modules?
  - **Recommendation**: ES Modules (modern)

---

### Phase 2: Agent Specification (Week 1-2)
**Duration**: 8 dagen  
**Deliverables**:
- [ ] @nodejs-specialist.agent.md (400+ lines)
  - Express.js API setup
  - Fastify alternative patterns
  - NestJS enterprise patterns (optional)
  - TypeScript configuration
  - Prisma schema and migrations
  - Authentication middleware (JWT)
  - Validation middleware (Zod)
  - Error handling middleware
  - Logging (Winston, Pino)
  - Environment configuration (.env)
  - API documentation (Swagger)
  - Unit testing (Jest)
  - Integration testing (Supertest)
  - Hands off to @postgresql-specialist or @database-specialist

**Review Points**:
- Is @nodejs-specialist op zelfde niveau als @dotnet-specialist?
- Zijn alle populaire Node.js frameworks gedekt?
- Is output format compatible met database agents?

---

### Phase 3: Skill Definitions (Week 2-3)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] nodejs-api-patterns.skill.md (250+ lines)
  - **Express.js Patterns**:
    - Router setup and organization
    - Middleware chains
    - Request/response handling
    - Error handling middleware
    - Async/await patterns
  
  - **Fastify Patterns** (performance):
    - Schema-based validation
    - Plugin architecture
    - Hooks system
    - Reply serialization
  
  - **NestJS Patterns** (enterprise):
    - Module architecture
    - Dependency injection
    - Guards and interceptors
    - Pipes and filters
  
  - **Common Patterns**:
    - RESTful API design
    - Request validation (Zod, Joi)
    - Authentication middleware
    - CORS configuration
    - Security headers (helmet)
    - Rate limiting

- [ ] nodejs-database-integration.skill.md (200+ lines)
  - **Prisma ORM**:
    - Schema definition
    - Migrations workflow
    - Query patterns
    - Relations handling
    - Transactions
  
  - **TypeORM** (alternative):
    - Entity definitions
    - Repository pattern
    - Query builder
    - Migrations
  
  - **Mongoose** (MongoDB):
    - Schema definition
    - Model patterns
    - Query patterns
    - Population (joins)
  
  - **Common Patterns**:
    - Connection pooling
    - Seeding data
    - Database testing strategies

**Review Points**:
- Zijn skills comprehensive?
- Is framework keuze flexibility geborgd?

---

### Phase 4: Schema Creation (Week 3)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] @nodejs-specialist.input.schema.json
  ```json
  {
    "backend_architecture": {
      "framework": "Express | Fastify | NestJS",
      "language": "TypeScript",
      "project_structure": "src/routes, src/controllers, src/services, src/models",
      "package_manager": "npm | pnpm | yarn"
    },
    "api_endpoints": [
      {
        "path": "/api/todos",
        "method": "GET | POST | PUT | DELETE",
        "auth_required": true,
        "validation": {
          "body": "TodoCreateSchema",
          "query": "PaginationSchema"
        }
      }
    ],
    "database": {
      "type": "PostgreSQL | MySQL | MongoDB",
      "orm": "Prisma | TypeORM | Mongoose",
      "models": ["User", "Todo"]
    },
    "authentication": {
      "method": "JWT | OAuth2 | Passport",
      "providers": ["local", "google"]
    },
    "middleware": ["cors", "helmet", "rate-limit", "compression"],
    "api_docs": "Swagger | OpenAPI",
    "testing_framework": "Jest | Vitest"
  }
  ```

- [ ] @nodejs-specialist.output.schema.json
  ```json
  {
    "artifacts": {
      "server": [
        {
          "file": "src/index.ts",
          "content": "import express from 'express'..."
        }
      ],
      "routes": [
        {
          "file": "src/routes/todos.routes.ts",
          "content": "import { Router } from 'express'..."
        }
      ],
      "controllers": [
        {
          "file": "src/controllers/todos.controller.ts",
          "content": "export class TodosController {...}"
        }
      ],
      "services": [
        {
          "file": "src/services/todos.service.ts",
          "content": "export class TodosService {...}"
        }
      ],
      "models": [
        {
          "file": "prisma/schema.prisma",
          "content": "model Todo { id String @id... }"
        }
      ],
      "middleware": [
        {
          "file": "src/middleware/auth.middleware.ts",
          "content": "export const authenticate = (req, res, next) => {...}"
        }
      ],
      "config": [
        {
          "file": "src/config/database.ts",
          "content": "import { PrismaClient } from '@prisma/client'..."
        }
      ],
      "tests": [
        {
          "file": "src/routes/__tests__/todos.routes.test.ts",
          "content": "import request from 'supertest'..."
        }
      ]
    },
    "code_quality": {
      "type_coverage": 95,
      "test_coverage": 80,
      "endpoints_generated": 12
    },
    "next_phase": "@postgresql-specialist"
  }
  ```

- [ ] nodejs-api-patterns skill schemas (input/output)
- [ ] nodejs-database-integration skill schemas (input/output)

**Review Points**:
- Zijn schemas consistent met @dotnet-specialist?
- Is framework flexibility gemodelleerd?

---

### Phase 5: Integration with Existing System (Week 4)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] Update @code-architect.agent.md
  - Add Node.js to backend language options
  - Add Node.js architecture patterns
  - Add Express/Fastify/NestJS patterns
  
- [ ] Update AGENT_ACTIVATION_GUIDE.md
  - Add @nodejs-specialist activation criteria
  - Update Phase 14 alternatives (.NET OR Node.js OR Python OR Go)
  - Update decision tree
  
- [ ] Update PHASE_FLOW.md
  - Update Phase 14 alternatives
  - Add Node.js timing estimates (80-140m)
  
- [ ] Update SYSTEM_ARCHITECTURE.md
  - Add @nodejs-specialist to Implementation Tier
  - Update agent inventory

**Review Points**:
- Conflicteert Node.js path met .NET path?
- Is Phase 14 decision logic helder?

---

### Phase 6: Scenario Integration (Week 4-5)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] Update S01 with Node.js alternative
  - S01: Can use Node.js + Express + Prisma instead of .NET
  - Similar API structure (~10 endpoints)
  - JWT authentication
  - PostgreSQL with Prisma
  
- [ ] Create Node.js deployment examples
  - Docker containerization
  - Azure App Service (Node.js)
  - AWS Elastic Beanstalk
  - Vercel/Netlify serverless functions

**Review Points**:
- Is Node.js alternative voor S01 realistisch?
- Zijn deployment options helder?

---

## System Impact Analysis

### Modified Components
| Component | Change | Lines Added | Review Needed |
|-----------|--------|-------------|---------------|
| @code-architect.agent.md | Add Node.js backend option | ~100 | YES |
| AGENT_ACTIVATION_GUIDE.md | Add 1 agent | ~900 | YES |
| PHASE_FLOW.md | Update Phase 14 alternatives | ~250 | YES |
| SYSTEM_ARCHITECTURE.md | Add Node.js specialist | ~450 | YES |
| README.md | Update agent count | ~20 | YES |

### New Components
| Component | Type | Lines | Review Needed |
|-----------|------|-------|---------------|
| @nodejs-specialist.agent.md | Agent spec | ~400 | YES |
| nodejs-api-patterns.skill.md | Skill spec | ~250 | YES |
| nodejs-database-integration.skill.md | Skill spec | ~200 | YES |
| 6 schema files | JSON schemas | ~1,200 | YES |
| **Total New** | - | **~2,050 lines** | - |

---

## Testing Considerations (User Will Test)

### Test Scenarios
1. **S01 Node.js Alternative**: Todo app met Express + Prisma + PostgreSQL
2. **Fastify Performance**: High-throughput API
3. **NestJS Enterprise**: Large-scale application
4. **MongoDB Alternative**: Mongoose integration

### Validation Points
- [ ] @nodejs-specialist generates valid TypeScript code
- [ ] Express/Fastify/NestJS setup is correct
- [ ] Prisma schema is valid
- [ ] JWT authentication works
- [ ] API tests pass (Supertest)
- [ ] Swagger documentation generated

---

## Dependencies

### Prerequisites
- Phase 1 (existing system) must be 100% complete ✅
- @code-architect must support backend language selection ✅
- @dotnet-specialist exists as reference ✅
- @postgresql-specialist exists (database integration) ✅

### Parallel Work
- Can be developed parallel with F08 (Python), F09 (Go), F10 (Java)
- Can be developed parallel with F01-F06 (Platforms, Frontends)

### Blocking For
- F11 (MySQL) - Node.js can use MySQL
- F12 (MongoDB) - Node.js with Mongoose

---

## Success Criteria

### Must Have
- ✅ @nodejs-specialist agent fully documented (400+ lines)
- ✅ 2 Node.js skills documented (450+ lines total)
- ✅ 6 schema files created with 100% coverage
- ✅ Phase 14 decision logic supports .NET OR Node.js
- ✅ S01 Node.js alternative documented
- ✅ All existing documentation updated

### Should Have
- Express, Fastify, NestJS support
- Prisma, TypeORM, Mongoose support
- JWT authentication patterns
- Swagger API documentation

### Nice to Have
- GraphQL support (Apollo Server)
- WebSocket support (Socket.io)
- Serverless patterns (AWS Lambda, Azure Functions)
- Microservices patterns

---

## Review Checklist

### Architecture Review
- [ ] Zijn @nodejs-specialist responsibilities duidelijk?
- [ ] Is framework keuze flexibility voldoende?
- [ ] Is ORM support comprehensive?
- [ ] Is output compatible met database agents?

### Integration Review
- [ ] Conflicteert Node.js met .NET in Phase 14?
- [ ] Is orchestrator logic updated?
- [ ] Zijn schema dependencies opgelost?

### Documentation Review
- [ ] Zijn alle documentatie files updated?
- [ ] Is agent count correct?
- [ ] Zijn decision trees helder?

### Quality Review
- [ ] Zijn schemas syntactisch correct?
- [ ] Is TypeScript configuration modern?
- [ ] Zijn async patterns correct?

---

## Risks & Mitigations

### Risk 1: Framework Choice Overload
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**: 
- Default to Express (most popular, simple)
- Provide Fastify alternative (performance)
- NestJS for enterprise (optional)

### Risk 2: ORM Fragmentation
**Impact**: Low  
**Probability**: Medium  
**Mitigation**: 
- Default to Prisma (modern, type-safe)
- Document TypeORM alternative
- Mongoose for MongoDB only

### Risk 3: Package Ecosystem Complexity
**Impact**: High  
**Probability**: High  
**Mitigation**: 
- Provide curated package recommendations
- Lock dependency versions
- Document security update strategy

### Risk 4: TypeScript Configuration
**Impact**: Medium  
**Probability**: Low  
**Mitigation**: 
- Provide standard tsconfig.json
- Use strict mode
- Document common issues

---

## Node.js-Specific Considerations

### Why Node.js is Important

**1. JavaScript Everywhere**
- Same language frontend + backend
- Code sharing (validation, types)
- Reduced context switching

**2. Performance**
- Non-blocking I/O
- Event-driven architecture
- Excellent for real-time apps

**3. Ecosystem**
- 2M+ npm packages
- Rich middleware ecosystem
- Strong community

**4. Developer Experience**
- Fast development cycle
- Hot reload (nodemon)
- Great debugging tools

**5. Deployment Flexibility**
- Serverless (AWS Lambda, Azure Functions)
- Containers (Docker)
- Traditional servers
- Edge computing (Cloudflare Workers)

---

## Next Steps

1. **Review dit document** - Valideer Node.js approach
2. **Goedkeuring voor Phase 1** - Start Node.js research
3. **Framework defaults?** - Express vs Fastify vs NestJS

---

**Status**: ⏳ Awaiting Review  
**Reviewer**: [User]  
**Next Document**: F08-Python-Backend-Support.md

