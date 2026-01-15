# Feature F08: Python Backend Support

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

**Betekenis**: Als gebruiker Python kiest als backend:
- ❌ Geen agent voor Python backend implementation
- ❌ Geen Python-specific patterns (FastAPI, Django, Flask)
- ❌ Geen skill voor Python best practices
- ❌ Geen schemas voor Python API generation
- ❌ Geen integration met Python ecosystem (pip, poetry)

### Business Impact
- **Python is #2 backend language** (na JavaScript/Node.js)
- Dominante keuze voor **AI/ML, Data Science, Scientific Computing**
- Django: mature enterprise framework (Instagram, Pinterest)
- FastAPI: moderne async framework (Netflix, Uber)
- Excellent voor data-heavy applications
- Strong in fintech, healthcare, research

---

## Proposed Solution

### New Components Needed

#### 1. Agent: @python-specialist
**Responsibility**: Python backend implementation  
**Phase**: 14 (parallel met @dotnet-specialist, @nodejs-specialist)  
**Activation**: `IF backend_language == "Python"`

**Output**:
- FastAPI or Django REST API
- Flask alternative (lightweight)
- Pydantic models (validation)
- SQLAlchemy or Django ORM (database)
- Authentication (JWT, OAuth2)
- API documentation (FastAPI auto-docs, drf-spectacular)
- Unit tests (pytest)
- Integration tests (pytest + httpx)

#### 2. Skill: python-api-patterns
**Type**: Code skill  
**Used by**: @python-specialist

**Content**:
- FastAPI patterns (async/await, dependency injection)
- Django REST Framework patterns
- Flask patterns (blueprints, extensions)
- Pydantic models and validation
- Error handling strategies
- CORS and middleware
- Background tasks (Celery, ARQ)
- API versioning

#### 3. Skill: python-database-integration
**Type**: Code skill  
**Used by**: @python-specialist

**Content**:
- SQLAlchemy ORM patterns (Core + ORM)
- Django ORM patterns
- Alembic migrations (FastAPI/Flask)
- Django migrations
- Async database patterns (databases, asyncpg)
- Connection pooling
- Transaction management

#### 4. Schemas (6 files)
```
.github/schemas/agents/
├── @python-specialist.input.schema.json
└── @python-specialist.output.schema.json

.github/schemas/skills/
├── python-api-patterns.input.schema.json
├── python-api-patterns.output.schema.json
├── python-database-integration.input.schema.json
└── python-database-integration.output.schema.json
```

---

## Implementation Phases

### Phase 1: Research & Design (Week 1)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] Framework decision matrix (FastAPI vs Django vs Flask)
- [ ] ORM comparison (SQLAlchemy vs Django ORM)
- [ ] Async vs sync patterns
- [ ] Dependency management (pip vs poetry vs pipenv)
- [ ] Testing strategy (pytest, coverage)

**Review Points**:
- FastAPI (modern, async) vs Django (mature, batteries-included) vs Flask (lightweight)?
  - **Recommendation**: Support all three, FastAPI as default for new projects
- SQLAlchemy (flexible) vs Django ORM (integrated)?
  - **Recommendation**: SQLAlchemy for FastAPI/Flask, Django ORM for Django
- Type hints enforcement?
  - **Recommendation**: Yes, use mypy

---

### Phase 2: Agent Specification (Week 1-2)
**Duration**: 8 dagen  
**Deliverables**:
- [ ] @python-specialist.agent.md (420+ lines)
  - **FastAPI Patterns**:
    - App structure and routing
    - Dependency injection system
    - Pydantic models and validation
    - Async database integration
    - Background tasks
    - OAuth2 with JWT
    - Auto-generated OpenAPI docs
  
  - **Django REST Framework Patterns**:
    - Project structure (apps, settings)
    - ViewSets and Serializers
    - Django ORM models
    - Authentication (Token, JWT)
    - Permissions and throttling
    - Django Admin integration
  
  - **Flask Patterns** (lightweight alternative):
    - Blueprint organization
    - Flask extensions ecosystem
    - SQLAlchemy integration
    - JWT authentication
  
  - **Common Patterns**:
    - Virtual environment setup
    - Requirements.txt or pyproject.toml
    - Environment variables (.env)
    - Logging configuration
    - pytest testing
    - Type hints (mypy)
    - Hands off to @postgresql-specialist

**Review Points**:
- Is @python-specialist op zelfde niveau als @dotnet-specialist?
- Zijn alle populaire Python frameworks gedekt?
- Is async support goed gedocumenteerd?

---

### Phase 3: Skill Definitions (Week 2-3)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] python-api-patterns.skill.md (270+ lines)
  - **FastAPI Patterns**:
    - Path operations and routing
    - Dependency injection
    - Request/response models (Pydantic)
    - Async/await patterns
    - Background tasks
    - WebSocket support
    - Middleware
  
  - **Django REST Framework**:
    - ViewSet patterns
    - Serializer patterns
    - Authentication and permissions
    - Pagination and filtering
    - Nested serializers
    - Custom actions
  
  - **Flask Patterns**:
    - Blueprint organization
    - Request handling
    - Flask-RESTful patterns
    - Extension integration
  
  - **Common Patterns**:
    - Error handling and exceptions
    - Request validation
    - CORS configuration
    - API versioning
    - Rate limiting
    - Security best practices

- [ ] python-database-integration.skill.md (220+ lines)
  - **SQLAlchemy (FastAPI/Flask)**:
    - Model definitions (declarative)
    - Session management
    - Query patterns
    - Relationships (one-to-many, many-to-many)
    - Alembic migrations
    - Async SQLAlchemy
  
  - **Django ORM**:
    - Model definitions
    - QuerySet API
    - Relationships (ForeignKey, ManyToMany)
    - Django migrations
    - Transactions
    - Signals
  
  - **Common Patterns**:
    - Connection pooling
    - Database seeding
    - Testing with fixtures
    - Query optimization

**Review Points**:
- Zijn skills comprehensive?
- Is async complexity goed uitgelegd?

---

### Phase 4: Schema Creation (Week 3)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] @python-specialist.input.schema.json
  ```json
  {
    "backend_architecture": {
      "framework": "FastAPI | Django | Flask",
      "async_support": true,
      "project_structure": "src/routers, src/models, src/services, src/schemas",
      "dependency_manager": "pip | poetry | pipenv"
    },
    "api_endpoints": [
      {
        "path": "/api/todos",
        "method": "GET | POST | PUT | DELETE",
        "auth_required": true,
        "request_model": "TodoCreate",
        "response_model": "TodoResponse"
      }
    ],
    "database": {
      "type": "PostgreSQL | MySQL | SQLite",
      "orm": "SQLAlchemy | Django ORM",
      "async": true,
      "models": ["User", "Todo"]
    },
    "authentication": {
      "method": "JWT | OAuth2 | Token",
      "providers": ["local", "google"]
    },
    "background_tasks": {
      "library": "Celery | ARQ | FastAPI BackgroundTasks",
      "broker": "Redis | RabbitMQ"
    },
    "api_docs": "OpenAPI (auto-generated)",
    "testing_framework": "pytest"
  }
  ```

- [ ] @python-specialist.output.schema.json
  ```json
  {
    "artifacts": {
      "main": [
        {
          "file": "src/main.py",
          "content": "from fastapi import FastAPI\napp = FastAPI()..."
        }
      ],
      "routers": [
        {
          "file": "src/routers/todos.py",
          "content": "from fastapi import APIRouter\nrouter = APIRouter()..."
        }
      ],
      "models": [
        {
          "file": "src/models/todo.py",
          "content": "from sqlalchemy import Column, String\nclass Todo(Base): ..."
        }
      ],
      "schemas": [
        {
          "file": "src/schemas/todo.py",
          "content": "from pydantic import BaseModel\nclass TodoCreate(BaseModel): ..."
        }
      ],
      "services": [
        {
          "file": "src/services/todos.py",
          "content": "class TodoService:\n    async def get_todos(): ..."
        }
      ],
      "database": [
        {
          "file": "src/database.py",
          "content": "from sqlalchemy.ext.asyncio import create_async_engine..."
        }
      ],
      "migrations": [
        {
          "file": "alembic/versions/001_create_todos.py",
          "content": "def upgrade(): ..."
        }
      ],
      "tests": [
        {
          "file": "tests/test_todos.py",
          "content": "import pytest\nasync def test_get_todos(): ..."
        }
      ],
      "config": [
        {
          "file": "requirements.txt",
          "content": "fastapi==0.109.0\nuvicorn[standard]==0.27.0..."
        }
      ]
    },
    "code_quality": {
      "type_hints_coverage": 95,
      "test_coverage": 85,
      "endpoints_generated": 12
    },
    "next_phase": "@postgresql-specialist"
  }
  ```

- [ ] python-api-patterns skill schemas (input/output)
- [ ] python-database-integration skill schemas (input/output)

**Review Points**:
- Zijn schemas consistent met @dotnet-specialist, @nodejs-specialist?
- Is async support gemodelleerd?

---

### Phase 5: Integration with Existing System (Week 4)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] Update @code-architect.agent.md
  - Add Python to backend language options
  - Add Python architecture patterns
  - Add FastAPI/Django/Flask patterns
  
- [ ] Update AGENT_ACTIVATION_GUIDE.md
  - Add @python-specialist activation criteria
  - Update Phase 14 alternatives (.NET OR Node.js OR Python OR Go)
  - Update decision tree
  
- [ ] Update PHASE_FLOW.md
  - Update Phase 14 alternatives
  - Add Python timing estimates (80-140m)
  
- [ ] Update SYSTEM_ARCHITECTURE.md
  - Add @python-specialist to Implementation Tier
  - Update agent inventory

**Review Points**:
- Conflicteert Python path met andere backend paths?
- Is Phase 14 decision logic helder?

---

### Phase 6: Scenario Integration (Week 4-5)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] Update S01 with Python alternative
  - S01: Can use Python + FastAPI + SQLAlchemy instead of .NET
  - Similar API structure (~10 endpoints)
  - OAuth2 with JWT authentication
  - PostgreSQL with async SQLAlchemy
  
- [ ] Create Python deployment examples
  - Docker containerization (uvicorn/gunicorn)
  - Azure App Service (Python)
  - AWS Elastic Beanstalk
  - Serverless (AWS Lambda with Mangum)

**Review Points**:
- Is Python alternative voor S01 realistisch?
- Zijn deployment options helder?

---

## System Impact Analysis

### Modified Components
| Component | Change | Lines Added | Review Needed |
|-----------|--------|-------------|---------------|
| @code-architect.agent.md | Add Python backend option | ~100 | YES |
| AGENT_ACTIVATION_GUIDE.md | Add 1 agent | ~950 | YES |
| PHASE_FLOW.md | Update Phase 14 alternatives | ~250 | YES |
| SYSTEM_ARCHITECTURE.md | Add Python specialist | ~470 | YES |
| README.md | Update agent count | ~20 | YES |

### New Components
| Component | Type | Lines | Review Needed |
|-----------|------|-------|---------------|
| @python-specialist.agent.md | Agent spec | ~420 | YES |
| python-api-patterns.skill.md | Skill spec | ~270 | YES |
| python-database-integration.skill.md | Skill spec | ~220 | YES |
| 6 schema files | JSON schemas | ~1,300 | YES |
| **Total New** | - | **~2,210 lines** | - |

---

## Testing Considerations (User Will Test)

### Test Scenarios
1. **S01 Python Alternative**: Todo app met FastAPI + async SQLAlchemy + PostgreSQL
2. **Django REST Framework**: Full-featured enterprise API
3. **Flask Lightweight**: Minimal API implementation
4. **ML Integration**: Python backend met AI/ML models

### Validation Points
- [ ] @python-specialist generates valid Python 3.11+ code
- [ ] FastAPI/Django/Flask setup is correct
- [ ] Type hints are comprehensive (mypy compliant)
- [ ] Async patterns are correct
- [ ] Pydantic validation works
- [ ] pytest tests pass
- [ ] OpenAPI docs generated

---

## Dependencies

### Prerequisites
- Phase 1 (existing system) must be 100% complete ✅
- @code-architect must support backend language selection ✅
- @dotnet-specialist exists as reference ✅
- @postgresql-specialist exists (database integration) ✅

### Parallel Work
- Can be developed parallel with F07 (Node.js), F09 (Go), F10 (Java)
- Can be developed parallel with F01-F06 (Platforms, Frontends)

### Blocking For
- F11 (MySQL) - Python can use MySQL
- F12 (MongoDB) - Python with Motor (async) or PyMongo

---

## Success Criteria

### Must Have
- ✅ @python-specialist agent fully documented (420+ lines)
- ✅ 2 Python skills documented (490+ lines total)
- ✅ 6 schema files created with 100% coverage
- ✅ Phase 14 decision logic supports .NET OR Node.js OR Python
- ✅ S01 Python alternative documented
- ✅ All existing documentation updated
- ✅ Type hints enforced (mypy)

### Should Have
- FastAPI, Django, Flask support
- SQLAlchemy (async), Django ORM support
- OAuth2 with JWT patterns
- Auto-generated OpenAPI docs
- Async/await patterns

### Nice to Have
- GraphQL support (Strawberry, Graphene)
- WebSocket support
- Celery background tasks
- AI/ML integration patterns (TensorFlow, PyTorch)

---

## Review Checklist

### Architecture Review
- [ ] Zijn @python-specialist responsibilities duidelijk?
- [ ] Is framework keuze flexibility voldoende?
- [ ] Is async support comprehensive?
- [ ] Is output compatible met database agents?

### Integration Review
- [ ] Conflicteert Python met andere backends in Phase 14?
- [ ] Is orchestrator logic updated?
- [ ] Zijn schema dependencies opgelost?

### Documentation Review
- [ ] Zijn alle documentatie files updated?
- [ ] Is agent count correct?
- [ ] Zijn decision trees helder?

### Quality Review
- [ ] Zijn schemas syntactisch correct?
- [ ] Zijn type hints enforced?
- [ ] Zijn async patterns correct?

---

## Risks & Mitigations

### Risk 1: Framework Choice Overload
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**: 
- Default to FastAPI (modern, async, auto-docs)
- Django for enterprise/admin-heavy apps
- Flask for lightweight APIs

### Risk 2: Async Complexity
**Impact**: High  
**Probability**: Medium  
**Mitigation**: 
- Provide clear async/await patterns
- Document sync alternatives
- Show async SQLAlchemy examples

### Risk 3: Type Hints Adoption
**Impact**: Low  
**Probability**: Low  
**Mitigation**: 
- Enforce type hints with mypy
- Pydantic provides runtime validation
- FastAPI leverages type hints heavily

### Risk 4: Python Version Compatibility
**Impact**: Medium  
**Probability**: Low  
**Mitigation**: 
- Target Python 3.11+ (latest stable)
- Use modern syntax (match/case, type unions)
- Document minimum version (3.10+)

---

## Python-Specific Considerations

### Why Python is Important

**1. AI/ML Ecosystem**
- TensorFlow, PyTorch, scikit-learn
- Dominant in data science
- Easy integration with ML models

**2. Data Processing**
- Pandas, NumPy, Polars
- Excellent for data-heavy apps
- Strong in ETL pipelines

**3. Mature Frameworks**
- Django: 15+ years, battle-tested
- FastAPI: Modern, high-performance
- Flask: Flexible, lightweight

**4. Developer Productivity**
- Concise, readable syntax
- Huge standard library
- Rich package ecosystem (PyPI)

**5. Enterprise Adoption**
- Instagram (Django)
- Netflix (FastAPI)
- Uber (data pipelines)
- Finance/Healthcare sectors

### Python vs Other Backends

**vs Node.js**:
- ✅ Better for data science/ML
- ✅ More mature frameworks
- ❌ Slower raw performance
- ❌ Smaller async ecosystem

**vs .NET**:
- ✅ Faster development
- ✅ Better for data/ML
- ❌ Less enterprise tooling
- ❌ Lower performance

**vs Go**:
- ✅ Easier to learn
- ✅ Better for data/ML
- ❌ Much slower performance
- ❌ Higher memory usage

---

## Next Steps

1. **Review dit document** - Valideer Python approach
2. **Goedkeuring voor Phase 1** - Start Python research
3. **Framework defaults?** - FastAPI as default?

---

**Status**: ⏳ Awaiting Review  
**Reviewer**: [User]  
**Next Document**: F09-Go-Backend-Support.md

