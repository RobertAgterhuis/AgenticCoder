# architecture-design Skill

**Skill ID**: `architecture-design`  
**Purpose**: Design system architecture, select patterns, make technology decisions  
**Used By**: @architect agent  
**Type**: Design and decision-making

---

## Knowledge Areas

- Software architecture patterns (monolithic, microservices, serverless)
- Design principles (SOLID, DRY, KISS, YAGNI)
- Technology stack selection
- NFR (Non-Functional Requirements) mapping
- Trade-off analysis

---

## Input Contract

```json
{
  "business_requirements": [...],
  "nfr_requirements": {...},
  "team_size": 5,
  "constraints": [...]
}
```

---

## Output Contract

```json
{
  "architecture_style": "Modular Monolith",
  "architecture_decisions": [...],
  "technology_choices": {...},
  "design_patterns": [...]
}
```

---

## Core Capabilities

### 1. Architecture Pattern Selection

**Decision Matrix**:

| Pattern | Team Size | Users | Complexity | Ops Overhead | Cost |
|---------|-----------|-------|------------|--------------|------|
| **Monolithic** | 1-5 | <10K | Low | Low | $ |
| **Modular Monolith** | 5-20 | 10K-100K | Medium | Low | $$ |
| **Microservices** | 20+ | 100K+ | High | High | $$$ |
| **Serverless** | Any | Variable | Medium | Very Low | $ (usage-based) |

**Selection Criteria**:

```typescript
function selectArchitecture(input: {
  teamSize: number,
  expectedUsers: number,
  domainComplexity: 'low' | 'medium' | 'high'
}): string {
  if (input.teamSize <= 5 && input.expectedUsers < 10000) {
    return 'Monolithic';
  }
  
  if (input.teamSize <= 20 && input.expectedUsers < 100000) {
    return 'Modular Monolith';
  }
  
  if (input.domainComplexity === 'high' && input.teamSize > 20) {
    return 'Microservices';
  }
  
  return 'Modular Monolith'; // Safe default
}
```

### 2. Technology Stack Selection

**Frontend Framework Decision Tree**:

```
Need SEO + Fast Initial Load?
  ├─ Yes → Next.js (SSR) or Remix
  └─ No → React SPA or Vue

Need Mobile App?
  ├─ Yes → React Native or Flutter
  └─ No → Web only

Team Experience?
  ├─ React → Use React
  ├─ Vue → Use Vue
  └─ None → Choose React (largest ecosystem)
```

**Backend Framework Decision Tree**:

```
Language Preference?
  ├─ JavaScript/TypeScript → Node.js (Express/Fastify)
  ├─ Python → FastAPI or Django
  ├─ Go → Gin or Echo
  ├─ .NET → ASP.NET Core
  └─ Java → Spring Boot

Performance Critical?
  ├─ Yes → Go or .NET
  └─ No → Node.js or Python

Team Experience?
  ├─ Full-stack JS → Node.js
  ├─ Data Science → Python
  └─ Enterprise → .NET or Java
```

**Database Selection**:

```
Data Structure?
  ├─ Relational (ACID) → PostgreSQL or SQL Server
  ├─ Document-based → MongoDB or Cosmos DB
  ├─ Key-Value → Redis or DynamoDB
  └─ Graph → Neo4j or Cosmos DB (Gremlin)

Scale Requirements?
  ├─ <1M records → PostgreSQL
  ├─ 1M-10M records → PostgreSQL with read replicas
  └─ >10M records → Cosmos DB or distributed SQL

Transactions Required?
  ├─ Yes → PostgreSQL or SQL Server
  └─ No → MongoDB or Cosmos DB
```

### 3. Create Architecture Decision Records (ADRs)

**ADR Template**:

```markdown
## ADR-001: Choose PostgreSQL over MongoDB

**Status**: Accepted  
**Date**: 2026-01-13  
**Context**: Need database for user data and transactions

**Decision**: Use PostgreSQL as primary database

**Alternatives Considered**:
1. **MongoDB**: 
   - Pros: Flexible schema, horizontal scaling
   - Cons: No ACID transactions, eventual consistency
   
2. **PostgreSQL**: 
   - Pros: ACID transactions, rich queries, mature
   - Cons: Vertical scaling primarily, schema changes require migrations

3. **Cosmos DB**: 
   - Pros: Global distribution, multi-model
   - Cons: Cost, vendor lock-in

**Rationale**:
- Application requires ACID transactions (payments)
- Team has PostgreSQL experience
- Data model is relational (users → orders → items)
- Budget constraints favor open-source

**Consequences**:
- ✅ Strong consistency guarantees
- ✅ Lower cloud costs ($50/month vs $200+/month)
- ✅ Team can start immediately (no learning curve)
- ❌ Scaling requires read replicas (manageable at current scale)
- ❌ Schema migrations require planning

**Migration Path** (if needed):
- Can migrate to Cosmos DB if global distribution becomes critical
- Or add read replicas for scaling
```

### 4. Map NFRs to Architecture

**NFR → Architecture Decisions**:

| NFR | Target | Architecture Decision |
|-----|--------|----------------------|
| **Performance** | <200ms p95 | Add Redis caching layer |
| **Scalability** | 100K users | Horizontal scaling with load balancer |
| **Availability** | 99.9% uptime | Multi-region deployment |
| **Security** | SOC2 | Encryption at rest/transit, RBAC |
| **Maintainability** | <1 day fixes | Modular architecture, clear boundaries |

**Example Mapping**:

```markdown
# NFR: Performance (<200ms p95 response time)

## Architecture Decisions:
1. **Caching Layer**: Add Redis for frequently accessed data
   - Cache user sessions (reduces DB queries by 80%)
   - Cache product catalog (99% hit rate)
   
2. **Database Indexing**: Index all foreign keys and query columns
   - User lookup by email: <10ms
   - Product search: <50ms
   
3. **CDN**: Use Azure Front Door for static assets
   - Images, CSS, JS served from edge locations
   - Reduces frontend load time from 2s → 400ms

4. **API Response Optimization**:
   - Pagination (max 50 items per page)
   - Field filtering (only return requested fields)
   - Compression (gzip all responses)

**Expected Result**: p95 response time of 150ms (meets target)
```

### 5. Design Patterns Selection

**Core Patterns by Layer**:

```markdown
# Recommended Design Patterns

## API Layer
- **Controller Pattern**: Handle HTTP requests/responses
- **Middleware Pattern**: Cross-cutting concerns (auth, logging, error handling)

## Business Logic Layer
- **Service Pattern**: Orchestrate business operations
- **Factory Pattern**: Create complex domain objects
- **Strategy Pattern**: Multiple algorithms (payment methods, notification channels)

## Data Access Layer
- **Repository Pattern**: Abstract data access (swappable implementations)
- **Unit of Work**: Manage transactions across multiple repositories

## Cross-Cutting
- **Dependency Injection**: Loose coupling, testability
- **Observer Pattern**: Event-driven architecture (user created → send email)
- **Circuit Breaker**: Fault tolerance for external services
```

**Pattern Application Example**:

```typescript
// Repository Pattern (Data Access)
interface IUserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
}

// Service Pattern (Business Logic)
class UserService {
  constructor(private repo: IUserRepository) {}
  
  async createUser(data: CreateUserDTO): Promise<User> {
    const user = User.create(data);
    await this.repo.save(user);
    return user;
  }
}

// Dependency Injection (Cross-Cutting)
const userRepo = new UserRepository(database);
const userService = new UserService(userRepo);
```

### 6. Trade-off Analysis

**Cost vs Performance Example**:

```markdown
# Decision: Caching Strategy

## Option 1: In-Memory Cache (Redis)
- **Cost**: $30-100/month (Azure Cache for Redis)
- **Performance**: <1ms latency
- **Pros**: Extremely fast, shared across instances
- **Cons**: Monthly cost, cache invalidation complexity
- **When**: >1000 users, high read/write ratio

## Option 2: Application-Level Cache
- **Cost**: $0 (included in app service)
- **Performance**: <10ms latency
- **Pros**: Free, simple to implement
- **Cons**: Not shared across instances, limited memory
- **When**: <1000 users, low traffic

## Decision: Use Redis
**Rationale**: Expected 10K users, 1000 req/min → cost justified by performance gains
```

### 7. System Diagram Generation

**Text-Based Architecture Diagram**:

```
┌─────────────────────────────────────────────┐
│            Azure Front Door (CDN)           │
│         DDoS Protection + WAF               │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴───────────┐
        │                      │
        ↓                      ↓
┌──────────────┐      ┌──────────────────┐
│  Static Web  │      │  App Service     │
│  (Frontend)  │      │  (REST API)      │
└──────────────┘      └────────┬─────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                    ↓          ↓          ↓
           ┌──────────┐ ┌──────────┐ ┌──────────┐
           │PostgreSQL│ │  Redis   │ │Key Vault │
           │(Primary) │ │ (Cache)  │ │(Secrets) │
           └──────────┘ └──────────┘ └──────────┘
                    │
                    ↓
           ┌──────────────────┐
           │Application       │
           │Insights          │
           │(Monitoring)      │
           └──────────────────┘
```

---

## Architecture Validation Checklist

**Quality Attributes**:

- [ ] **Scalability**: Can handle 10× traffic increase?
- [ ] **Reliability**: Single points of failure addressed?
- [ ] **Security**: Authentication, authorization, encryption in place?
- [ ] **Maintainability**: Clear module boundaries?
- [ ] **Testability**: Dependencies can be mocked?
- [ ] **Performance**: Response times meet targets?
- [ ] **Cost**: Within budget constraints?
- [ ] **Operability**: Logging, monitoring, alerting defined?

---

## Performance Characteristics

- **ADR creation**: ~15 minutes per decision
- **Architecture diagram**: ~20 minutes
- **Technology selection**: ~30 minutes (with research)
- **Full architecture design**: 4-6 hours for MVP

---

## Testing Strategy

- Validate architecture against NFRs (checklist)
- Review with senior engineers (peer review)
- Cost estimation validation (Azure Pricing Calculator)
- Load testing strategy for performance validation

---

## Used By

- **@architect Agent**: Creates system architecture and ADRs

---

## Handoff Chain

```
@coordinator (phases + requirements)
  ↓ requirements
@architect (designs architecture) ← architecture-design skill
  ↓ architecture_decisions
@code-architect (implements design)
```

---

## Filename: `architecture-design.skill.md`
