# Test Scenario S04: Large Team Enterprise

**Scenario ID**: `S04`  
**Name**: Large Team Enterprise - Distributed Banking Platform  
**Complexity**: Very High  
**Purpose**: Validate agent chain for large enterprise with strict compliance

---

## Project Context

**Project Type**: Distributed banking platform (payment processing, account management, lending)  
**Team**: Large enterprise (50+ people: 35 developers, 5 architects, 4 DBAs, 2 DevOps, 4 QA)  
**Timeline**: 48-60 weeks (12-15 months)  
**Budget**: $50,000+/month  
**Users**: 10K-100K retail customers, 1K institutions  
**Revenue Model**: Transaction fees (0.5-1.5% per transaction)

---

## Initial Request (Phase 0 Input)

```markdown
We're building a next-generation distributed banking platform for payment processing and lending.

Critical Requirements:
- 99.99% uptime SLA (4 nines, <1 hour/year downtime)
- Multi-region deployment (3 geographic regions, active-active)
- Real-time payment processing (<2 second settlement)
- Distributed transaction processing (ACID across microservices)
- PCI-DSS Level 1 compliance (highest standard)
- GDPR + CCPA + Local banking regulations
- Audit trail for every operation (immutable ledger)
- Zero data loss (99.99999% durability)
- Rate-based billing (thousands of transactions/second)

Architectural Challenges:
- Distributed consensus (payment idempotency, exactly-once semantics)
- Strong consistency (financial transactions require ACID)
- High throughput (10K+ transactions/second)
- Low latency (<2 seconds for payment settlement)
- Event sourcing (audit trail, replay capability)
- Disaster recovery (RTO <15 minutes, RPO <1 minute)

Team: 35 developers (5 per service), 5 architects, 4 DBAs, 2 DevOps
Tech preferences: Polyglot (Java, Go, Node.js), Event sourcing, CQRS
Timeline: 12-15 months for MVP (regulatory requirements extend timeline)
Budget: $50K+/month (enterprise scale)
Growth target: 100M transactions/year within 24 months

Regulatory & Compliance:
- PCI-DSS Level 1 (annual third-party audit)
- GDPR (right to be forgotten, data portability)
- CCPA (California privacy law)
- Local banking regulations (country-specific)
- SOC2 Type II (security, availability, integrity)
- Disaster recovery plan (quarterly tests)
```

---

## Expected Agent Flow Summary

### Phase 0: @plan (Discovery)

**Complex Requirements Analysis**:
- Multi-region vs single-region
- Strong consistency vs eventual consistency (ACID requirements)
- Event sourcing architecture
- Disaster recovery strategy (RTO/RPO targets)
- Regulatory roadmap (PCI, GDPR, CCPA)
- Security architecture (encryption, authentication, authorization)
- Team structure (per-service ownership, architecture review board)

**Expected Output**:
```
ProjectPlan/ (38+ files)
├── 01-Context/
│   ├── project-overview.md (Distributed banking, 50+ team, 12-15 months)
│   ├── regulatory-landscape.md (PCI, GDPR, CCPA, local banking regs)
│   ├── compliance-roadmap.md (audit timeline, certifications)
│   ├── stakeholders.md (team of 50, regulators, customers)
│   ├── business-requirements.md (payment processing, lending, 10K+ tps)
│   └── tech-landscape.md (Java/Go/Node.js, event sourcing, CQRS)
├── 02-Architecture/
│   ├── microservices-strategy.md (10 services: auth, payments, accounts, lending, etc.)
│   ├── event-sourcing-design.md (immutable event log, replay)
│   ├── distributed-consensus.md (payment idempotency, exactly-once)
│   ├── multi-region-strategy.md (active-active, data replication)
│   ├── disaster-recovery.md (RTO <15min, RPO <1min)
│   └── security-architecture.md (encryption, HSM, secrets management)
```

**Validation Criteria**:
- ✅ Regulatory requirements comprehensive
- ✅ Multi-region strategy documented
- ✅ Event sourcing architecture designed
- ✅ Disaster recovery SLOs clear (RTO/RPO)
- ✅ Security architecture includes HSM, encryption
- ✅ Scalability to 100M transactions/year planned

---

### Phase 1: @doc (Documentation)

**Comprehensive API Specification** (80+ endpoints):
```
# Payment Processing APIs
POST   /api/v1/payments/submit
GET    /api/v1/payments/:id
POST   /api/v1/payments/:id/cancel
POST   /api/v1/payments/:id/refund

# Account Management APIs
POST   /api/v1/accounts
GET    /api/v1/accounts/:id
PUT    /api/v1/accounts/:id
GET    /api/v1/accounts/:id/transactions
GET    /api/v1/accounts/:id/balance

# Lending APIs
POST   /api/v1/loans/apply
GET    /api/v1/loans/:id
PUT    /api/v1/loans/:id/status
GET    /api/v1/loans/:id/disbursements

# Administrative APIs
GET    /api/v1/admin/transactions
GET    /api/v1/admin/audit-logs
POST   /api/v1/admin/compliance-report
GET    /api/v1/admin/risk-dashboard

# Webhook APIs (outbound)
POST   /webhooks/payment.completed
POST   /webhooks/account.created
POST   /webhooks/loan.approved

# Partner Integration APIs
POST   /api/v1/partners/authenticate
GET    /api/v1/partners/:id/accounts
POST   /api/v1/partners/:id/transfers
```

**Data Model** (30+ tables):
```
Core Tables:
- customers, accounts, account_holders
- transactions, payment_orders, payment_events
- loans, loan_applications, disbursements
- exchanges, settlement_batches
- roles, permissions, audit_logs (immutable)
- encryption_keys, key_versions

Event Sourcing:
- events (immutable log of all operations)
- event_snapshots (for performance)
- saga_states (distributed transaction coordination)

Ledgers:
- general_ledger (accounting)
- account_ledger (double-entry bookkeeping)
```

**Integration Guide**:
- Payment networks (ACH, Wire, Card networks)
- KYC/AML providers (third-party verification)
- Credit bureaus (loan underwriting)
- Regulatory reporting (FinCEN, etc.)
- HSM integration (key management)

**Compliance Documentation**:
- PCI-DSS controls (v3.2.1)
- GDPR compliance matrix
- CCPA compliance matrix
- Audit trail requirements
- Data retention policies
- Incident response plan

---

### Phase 2: @backlog (Backlog Planning)

**Epic Structure** (12 epics, 150+ stories):
```json
{
  "epics": [
    {"id": "E1", "title": "Core Banking (Accounts, Balance, Ledger)", "points": 233},
    {"id": "E2", "title": "Payment Processing (Submit, Clear, Settle)", "points": 377},
    {"id": "E3", "title": "Multi-Region Replication & Consistency", "points": 310},
    {"id": "E4", "title": "Event Sourcing & CQRS", "points": 344},
    {"id": "E5", "title": "Lending (Apply, Underwrite, Disburse)", "points": 289},
    {"id": "E6", "title": "KYC/AML & Risk Management", "points": 267},
    {"id": "E7", "title": "Security & Encryption", "points": 289},
    {"id": "E8", "title": "Compliance & Audit", "points": 278},
    {"id": "E9", "title": "Disaster Recovery & Business Continuity", "points": 233},
    {"id": "E10", "title": "Monitoring, Alerting & Observability", "points": 256},
    {"id": "E11", "title": "Partner Integration APIs", "points": 198},
    {"id": "E12", "title": "Admin Portal & Risk Dashboard", "points": 210}
  ],
  "total_stories": 160,
  "total_story_points": 3484
}
```

**Sample Enterprise Stories**:
```
US-089: Distributed Payment Idempotency (55 points)
As a payment system, I must guarantee exactly-once payment processing
so that duplicate payments cannot occur even if network fails

Acceptance Criteria:
- Idempotency key prevents duplicate charges
- Duplicate requests return same result (idempotent)
- Timeout handling (payment eventually completes or fails)
- Exactly-once semantics across 3 regions
- Audit trail records all attempts
- Network partition tolerance

Technical Implementation:
- Idempotency key (UUID) in request header
- Distributed cache (Redis) tracks processed IDs
- Saga pattern for distributed transactions
- Two-phase commit protocol
- Event log for audit trail

Testing:
- Chaos testing (network partition simulation)
- Load testing (10K+ simultaneous payments)
- Replay testing (idempotency verification)

US-134: PCI-DSS Level 1 Certification (89 points)
As a banking platform, we must achieve PCI-DSS Level 1 compliance
so that we can process credit card payments legally

Acceptance Criteria:
- Annual third-party audit scheduled
- All 12 PCI-DSS requirements implemented
- No card data stored in database
- End-to-end encryption (TLS 1.3)
- Hardware security module (HSM) for key storage
- Network segmentation (cardholder data network isolated)
- Access control (MFA, role-based access)
- Audit logging (immutable, centralized)
- Vulnerability scanning (monthly external, quarterly internal)
- Employee training (annual, documented)

PCI-DSS Requirements Mapping:
1. Firewall configuration ✓
2. No default passwords ✓
3. Data protection (encryption) ✓
4. Data vulnerability management ✓
5. Anti-malware ✓
6. Secure code ✓
7. Access restriction ✓
8. User identification & authentication ✓
9. Physical access control ✓
10. Logging & monitoring ✓
11. Testing & assessment ✓
12. Information security policy ✓

US-167: GDPR Right to Be Forgotten (34 points)
As a customer, I want to request deletion of my data
so that I comply with GDPR right to erasure

Acceptance Criteria:
- "Delete My Data" request in account settings
- PII deleted from all systems within 30 days
- Transactions anonymized (amounts, dates retained for compliance)
- Payment instrument details removed
- Access logs purged
- Audit trail records deletion request
- Email confirmation of deletion
- Regulatory reporting updated

Technical Implementation:
- Soft delete (mark as deleted, not physical removal)
- Anonymization function (hash customer ID)
- Compliance report (deleted users, dates)
- Right to access before deletion
```

**Validation Criteria**:
- ✅ 12 epics (comprehensive feature set)
- ✅ 150+ user stories (enterprise scale)
- ✅ 3500 story points (12-15 months for 35 devs at 55 points/week)
- ✅ PCI/GDPR/CCPA requirements addressed
- ✅ Enterprise-level stories (idempotency, disaster recovery)

---

### Phase 3: @coordinator (Implementation Plan)

**Phase Breakdown** (10 phases, 12-15 months):
```
Phase 1: Foundation & Architecture (2 weeks)
  - Multi-region setup
  - Event sourcing infrastructure
  - Kubernetes clusters (3 regions)
  - 110 points

Phase 2: Core Banking (4 weeks)
  - Account creation/management
  - Balance tracking
  - Double-entry ledger
  - 233 points

Phase 3: Payment Processing - Part 1 (4 weeks)
  - Payment submission
  - Payment validation
  - Payment clearing
  - 188 points

Phase 4: Payment Processing - Part 2 (4 weeks)
  - Settlement execution
  - Reconciliation
  - Failure handling
  - 189 points

Phase 5: Event Sourcing & CQRS (3 weeks)
  - Event log implementation
  - Event snapshots
  - Read model projection
  - 344 points

Phase 6: Multi-Region Replication (3 weeks)
  - Active-active replication
  - Conflict resolution
  - Consistency verification
  - 310 points

Phase 7: Security & Encryption (3 weeks)
  - HSM integration
  - End-to-end encryption
  - Key rotation
  - 289 points

Phase 8: KYC/AML & Risk Management (2 weeks)
  - Customer verification
  - Sanctions screening
  - Risk scoring
  - 267 points

Phase 9: Compliance & Audit (2 weeks)
  - Audit logging
  - Compliance reporting
  - GDPR/CCPA implementation
  - 278 points

Phase 10: Testing, DR & Launch (2 weeks)
  - Load testing (100K+ tps)
  - Chaos testing (failure scenarios)
  - DR drill (failover validation)
  - 276 points
```

**Team Structure**:
```
5 squads × 7 developers per squad
+ 5 architects (1 per domain)
+ 4 DBAs (1 per region + 1 central)
+ 2 DevOps + 1 SRE
+ 4 QA (3 functional, 1 performance)

Squad 1: Core Banking (5 developers)
Squad 2: Payment Processing (5 developers)
Squad 3: Lending & Risk (5 developers)
Squad 4: Multi-Region & Replication (5 developers)
Squad 5: Security & Compliance (5 developers)
```

**Team Velocity Calculation**:
```
35 developers × 55 points per developer per week = 1925 points/week
60 weeks = 60 weeks
Planned: 3484 points (avg 58 points/week)
= Realistic for enterprise development with high compliance overhead
```

**Validation Criteria**:
- ✅ 10 phases (milestone-based)
- ✅ 60 weeks total (within 12-15 month requirement)
- ✅ Team structure with architectural oversight
- ✅ Critical path: Foundation → Core Banking → Payment Processing
- ✅ Parallel workstreams (5 squads, 5 domains)
- ✅ Compliance integrated throughout (not bolt-on)

---

### Phase 4: @qa (Quality & Validation Framework)

**Enterprise Testing Strategy**:
```json
{
  "testing_strategies": [
    {
      "type": "Unit Testing",
      "coverage_target": 90,
      "focus": "Business logic, payment calculations, ledger entries"
    },
    {
      "type": "Integration Testing",
      "coverage_target": 85,
      "focus": "Service-to-service, database, event sourcing"
    },
    {
      "type": "E2E Testing",
      "coverage_target": 80,
      "focus": "Payment flows, lending workflows, multi-region sync"
    },
    {
      "type": "Load Testing",
      "coverage_target": 100,
      "focus": "100K+ transactions/second, 3 simultaneous regions"
    },
    {
      "type": "Chaos Testing",
      "coverage_target": 100,
      "focus": "Network partitions, database failures, region outages"
    },
    {
      "type": "Security Testing",
      "coverage_target": 100,
      "focus": "Penetration testing, OWASP Top 10, encryption validation"
    },
    {
      "type": "Compliance Testing",
      "coverage_target": 100,
      "focus": "PCI, GDPR, CCPA, audit trail verification"
    },
    {
      "type": "Performance Testing",
      "coverage_target": 100,
      "focus": "<2 second settlement, <500ms query, 99.99% uptime"
    }
  ],
  "quality_metrics": [
    {"name": "Code Coverage", "target": 90, "critical": true},
    {"name": "Payment Settlement Time", "target": "<2 seconds", "critical": true},
    {"name": "Query Response Time", "target": "<500ms p99", "critical": true},
    {"name": "Uptime", "target": "99.99% (4 nines)", "critical": true},
    {"name": "Data Consistency", "target": "100% across regions", "critical": true},
    {"name": "Audit Trail Integrity", "target": "100% (no gaps)", "critical": true},
    {"name": "Payment Success Rate", "target": ">99.95%", "critical": true},
    {"name": "Security Vulnerabilities", "target": "0 critical/high", "critical": true},
    {"name": "Regulatory Violations", "target": "0", "critical": true}
  ],
  "regulatory_testing": [
    "PCI-DSS: Third-party audit (annual)",
    "GDPR: Right to deletion, data portability",
    "CCPA: Opt-out mechanism, data access",
    "SOC2: Type II audit (annual)",
    "Penetration testing: Quarterly"
  ]
}
```

**Disaster Recovery Testing**:
```
Quarterly DR Drills:
- Full failover to secondary region
- Recovery time validation (RTO <15 min)
- Data loss validation (RPO <1 min)
- Communication test (notify customers)
- System state verification

Monthly Chaos Tests:
- Inject network latency (100ms+)
- Kill random pods
- Partition regions
- Corrupt data (in test environment)
- Verify automatic recovery
```

**Validation Criteria**:
- ✅ 8 testing strategies (comprehensive, including chaos)
- ✅ Regulatory testing mandatory
- ✅ 99.99% uptime SLA tested (quarterly DR drills)
- ✅ Payment idempotency verified
- ✅ Multi-region consistency validated
- ✅ Security audit trail verified

---

### Phase 6: @architect (Architecture Design)

**Architecture Style**: Distributed Event-Driven Microservices with CQRS

**Key Architectural Decisions**:
```json
{
  "ADR-001": {
    "title": "Distributed Microservices with Clear Ownership",
    "context": "50 developers, 100M transactions/year, strict consistency requirements",
    "decision": "10 services with 1-2 week deployment cycles, each owned by squad",
    "services": [
      "Auth Service", "Account Service", "Payment Service", "Settlement Service",
      "Lending Service", "KYC/AML Service", "Reporting Service", "Notification Service",
      "Admin Service", "Webhook Service"
    ]
  },
  "ADR-002": {
    "title": "Event Sourcing as Immutable Audit Trail",
    "context": "PCI requires audit log, GDPR requires deletion capability, need replay",
    "decision": "Event sourcing pattern: all state changes via events",
    "rationale": "Immutable ledger, replay capability, audit trail, temporal queries"
  },
  "ADR-003": {
    "title": "CQRS (Command Query Responsibility Segregation)",
    "context": "Complex queries on event data, strong write consistency needed",
    "decision": "Separate write (command) and read (query) models",
    "rationale": "Independent scaling, different optimization for writes vs reads"
  },
  "ADR-004": {
    "title": "Active-Active Multi-Region with Conflict Resolution",
    "context": "99.99% uptime SLA, 3 geographic regions, fast failover required",
    "decision": "Multi-master replication with last-write-wins and merge function",
    "tradeoffs": "Eventual consistency at region level, strong consistency at service level"
  },
  "ADR-005": {
    "title": "Saga Pattern for Distributed Transactions",
    "context": "Payment spans multiple services (submit → validate → clear → settle)",
    "decision": "Orchestration saga (payment service orchestrates steps)",
    "rationale": "Explicit transaction flow, compensating transactions for rollback"
  },
  "ADR-006": {
    "title": "Hardware Security Module (HSM) for Encryption Keys",
    "context": "PCI-DSS requires secure key storage, cryptographic operations",
    "decision": "Azure Key Vault with HSM-backed keys",
    "rationale": "FIPS 140-2 Level 3 compliance, automatic key rotation"
  }
}
```

**Technology Stack**:
```
Polyglot Microservices:
- Account Service: Java Spring Boot (stability, mature ecosystem)
- Payment Service: Go (performance, concurrency)
- Settlement Service: Go (performance)
- KYC/AML Service: Python (ML libraries, compliance)
- Reporting Service: Node.js (flexible, fast iteration)

Event Processing:
- Event Store: PostgreSQL (ACID, immutable)
- Event Bus: Apache Kafka (10K+ events/second)
- Stream Processing: Apache Kafka Streams

Multi-Region:
- Database Replication: PostgreSQL logical replication
- Data Replication: CockroachDB or similar (geo-distributed)
- Conflict Resolution: Custom merge functions

Deployment:
- Container: Docker
- Orchestration: Kubernetes (Azure AKS, 3 regions)
- Service Mesh: Istio (traffic management, security policies)

Security:
- HSM: Azure Key Vault
- Secrets Management: HashiCorp Vault
- Encryption: TLS 1.3, AES-256-GCM

Monitoring:
- Metrics: Prometheus + Grafana
- Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
- Tracing: Jaeger (distributed tracing)
- APM: Datadog (application performance monitoring)
```

**Estimated Monthly Cost**: $50,000+
```
Compute (AKS, 3 regions): $15,000
- 10 services × 3 regions × high availability
- Auto-scaling to handle peak load

Database (PostgreSQL, 3 regions): $12,000
- Primary + standby per region
- Backup and recovery infrastructure

Data Storage & Replication: $8,000
- Event log (billions of events)
- Read model projections
- Backups (redundant, multiple regions)

Kafka (Event Bus): $6,000
- 10K+ events/second
- Topic replication across regions

Networking & CDN: $4,000
- Inter-region bandwidth
- Global load balancing
- DDoS protection

Monitoring & Observability: $2,000
- Datadog, ELK Stack, Jaeger

HSM & Key Management: $2,000
- Azure Key Vault Premium

Other (DNS, SSL, etc.): $1,000
----
Total: ~$50,000/month
```

**Validation Criteria**:
- ✅ Architecture = Distributed event-driven microservices (appropriate for 100M tps)
- ✅ 6 ADRs with enterprise depth
- ✅ CQRS pattern for scalability
- ✅ Multi-region active-active design
- ✅ Event sourcing for audit trail
- ✅ HSM for PCI compliance
- ✅ Cost realistic ($50K for enterprise scale)

---

### Phase 7: @code-architect (Code Structure)

**Microservices Structure** (10 services):
```
banking-platform/
├── services/
│   ├── auth-service/ (Java Spring Boot)
│   ├── account-service/ (Java Spring Boot)
│   ├── payment-service/ (Go)
│   ├── settlement-service/ (Go)
│   ├── lending-service/ (Java)
│   ├── kyc-aml-service/ (Python)
│   ├── reporting-service/ (Node.js)
│   ├── notification-service/ (Node.js)
│   ├── admin-service/ (Node.js)
│   └── webhook-service/ (Go)
│
├── shared/
│   ├── event-store/ (PostgreSQL schema)
│   ├── schemas/ (Avro for events)
│   ├── libraries/
│   │   ├── event-sourcing-lib/
│   │   ├── saga-lib/
│   │   ├── encryption-lib/
│   │   └── audit-lib/
│   └── observability/ (tracing, metrics)
│
├── infrastructure/
│   ├── kubernetes/
│   │   ├── namespaces/ (prod, staging, dev)
│   │   ├── services/
│   │   ├── ingress/
│   │   ├── network-policies/
│   │   └── rbac/
│   ├── bicep/ (Azure resources)
│   │   ├── aks.bicep (3 clusters)
│   │   ├── database.bicep
│   │   ├── keyvault.bicep
│   │   ├── kafka.bicep
│   │   └── monitoring.bicep
│   ├── terraform/ (multi-region state)
│   └── helm-charts/ (K8s deployments)
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── chaos/ (failure scenarios)
│   ├── load/ (performance testing)
│   ├── security/ (penetration tests)
│   └── compliance/ (PCI/GDPR/CCPA)
│
└── docs/
    ├── architecture/ (ADRs)
    ├── operational/ (runbooks, playbooks)
    ├── api/ (OpenAPI specs)
    └── compliance/ (audit documentation)
```

**Design Patterns**:
1. **Event Sourcing**: All state via events
2. **CQRS**: Separate command (write) and query (read) models
3. **Saga Pattern**: Orchestrated distributed transactions
4. **Circuit Breaker**: Fault tolerance
5. **Bulkhead**: Service isolation
6. **Retry with Exponential Backoff**: Transient failure handling
7. **Idempotency Pattern**: Duplicate request handling
8. **Two-Phase Commit**: Strong consistency where needed

**API Gateway** (Kong or Azure APIM):
- Rate limiting per customer/region
- Request transformation
- Response caching
- Authentication delegation
- API versioning (v1, v2, v3)
- Rate-based billing integration

**Event Schema**:
```
Payment submitted:
{
  "event_id": "uuid",
  "event_type": "PaymentSubmitted",
  "aggregate_id": "payment_id",
  "aggregate_type": "Payment",
  "data": {
    "amount": 1000,
    "currency": "USD",
    "from_account": "acc_123",
    "to_account": "acc_456"
  },
  "metadata": {
    "timestamp": "2026-01-13T10:30:00Z",
    "user_id": "user_789",
    "region": "us-east-1",
    "request_id": "req_abc"
  }
}
```

**Validation Criteria**:
- ✅ 10 microservices with clear boundaries
- ✅ Polyglot architecture (Java, Go, Python, Node.js)
- ✅ Event sourcing infrastructure
- ✅ 8+ design patterns
- ✅ Multi-region deployment
- ✅ Comprehensive testing structure
- ✅ Operational runbooks included

---

### Phase 8-9: @azure-architect + @bicep-specialist

**Azure Resources** (30+ resources per region × 3 regions):
```
Compute:
- AKS clusters (3 regions, each ~30-50 nodes)
- Container Registry (ACR, shared across regions)

Networking:
- Virtual Networks (3 regions)
- Network Security Groups
- Application Gateway
- Azure Front Door (global DDoS + load balancing)
- ExpressRoute (dedicated network links between regions)

Data:
- PostgreSQL Flexible Servers (3 regions, HA)
- Azure Cosmos DB (optional, for geo-replication)
- Azure Blob Storage (backups, logs)
- Azure Data Explorer (time-series data)

Security:
- Key Vault (HSM-backed)
- Azure Sentinel (SIEM)
- Azure Defender (security monitoring)
- Managed Identity (service-to-service auth)

Integration:
- Event Hubs (alternative to Kafka)
- Service Bus (message queue)
- Logic Apps (orchestration)

Monitoring:
- Application Insights
- Log Analytics Workspace
- Azure Monitor
- Datadog (third-party APM)

Backup & Disaster Recovery:
- Azure Backup
- Azure Site Recovery
- Database backups (automated, geo-redundant)
```

**Deployment Strategy**:
- Blue-green deployment per region
- Canary deployments (1% → 25% → 100% traffic)
- Automated rollback on error rate spike
- Database migration with zero downtime
- DNS failover (<30 seconds)

**Disaster Recovery**:
```
RTO Target: <15 minutes
RPO Target: <1 minute

Recovery Hierarchy:
1. Zone failure (1-2 minutes) - automatic failover within AZ
2. Region failure (5-10 minutes) - automatic failover to backup region
3. Full disaster (15 minutes) - manual orchestration
```

**Cost Breakdown**:
```
Per Region:
- AKS: $8,000 (40 nodes × $200/month)
- PostgreSQL: $4,000 (high-availability setup)
- Storage & Backups: $1,500
- Networking: $1,000

Shared (3 regions):
- Front Door: $2,000
- Key Vault: $1,000
- Monitoring: $3,000
- Data replication: $1,500

Total: ~$50,000/month
(Scales with transaction volume: billing drives cost)
```

**Validation Criteria**:
- ✅ 30+ Azure resources per region
- ✅ Multi-region active-active design
- ✅ 99.99% uptime SLA achievable
- ✅ RTO <15 min, RPO <1 min
- ✅ Blue-green + canary deployment
- ✅ HSM-backed encryption keys
- ✅ Automated disaster recovery

---

### Phase 10-11: @frontend-specialist + @backend-specialist

**Backend Deliverables** (10 microservices):
- 150+ API endpoints
- Event sourcing implementation
- Distributed transaction coordination (sagas)
- Multi-region data replication
- PCI-compliant payment processing
- GDPR-compliant data deletion
- Comprehensive audit logging
- Real-time settlement processing

**Generated Payment Processing Service** (Event Sourcing + CQRS):
```typescript
// services/payment-service/src/aggregates/PaymentAggregate.ts
import { DomainEvent } from '../events/DomainEvent';
import { EventStore } from '../eventStore/EventStore';

export class PaymentAggregate {
  private id: string;
  private status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  private amount: number;
  private uncommittedEvents: DomainEvent[] = [];

  static create(id: string, amount: number, customerId: string): PaymentAggregate {
    const aggregate = new PaymentAggregate();
    aggregate.applyEvent({
      type: 'PaymentCreated',
      aggregateId: id,
      amount,
      customerId,
      timestamp: new Date(),
    });
    return aggregate;
  }

  // Idempotent authorization (exactly-once semantics)
  async authorize(authorizationId: string): Promise<void> {
    if (this.status !== 'PENDING') {
      throw new Error('Payment not in PENDING state');
    }

    this.applyEvent({
      type: 'PaymentAuthorized',
      aggregateId: this.id,
      authorizationId,
      timestamp: new Date(),
    });

    // Persist to event store (immutable ledger)
    await EventStore.append(this.id, [
      { type: 'PaymentAuthorized', data: { authorizationId } }
    ]);
  }

  // Distributed transaction: coordinate with settlement service
  async capture(): Promise<void> {
    if (this.status !== 'AUTHORIZED') {
      throw new Error('Payment not authorized');
    }

    // Saga pattern: emit command for settlement service
    const settlementCommand = {
      type: 'InitiateSettlement',
      paymentId: this.id,
      amount: this.amount,
      correlationId: this.generateIdempotencyKey(),
    };

    // Publish to event bus (at-least-once delivery with idempotency key)
    await this.publishCommand(settlementCommand);

    this.applyEvent({
      type: 'PaymentCaptureInitiated',
      aggregateId: this.id,
      timestamp: new Date(),
    });
  }

  private applyEvent(event: DomainEvent): void {
    switch (event.type) {
      case 'PaymentCreated':
        this.status = 'PENDING';
        this.amount = event.amount;
        break;
      case 'PaymentAuthorized':
        this.status = 'AUTHORIZED';
        break;
      case 'PaymentCaptured':
        this.status = 'CAPTURED';
        break;
      case 'PaymentFailed':
        this.status = 'FAILED';
        break;
    }
    this.uncommittedEvents.push(event);
  }

  private generateIdempotencyKey(): string {
    return `${this.id}-${this.status}-${this.amount}`;
  }

  private async publishCommand(command: any): Promise<void> {
    // Publish to message queue (Kafka) for idempotent processing
    await this.messageQueue.publish('settlement-commands', command);
  }
}
```

**Multi-Region Data Replication**:
```typescript
// services/replication-coordinator/src/RegionSynchronizer.ts
export class RegionSynchronizer {
  private regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];

  async replicateTransaction(transaction: any): Promise<void> {
    const replicationId = uuid();
    
    // Write to local region first (fast path)
    await this.localDB.writeTransaction(transaction);

    // Asynchronously replicate to other regions
    const replicationTasks = this.regions
      .filter(region => region !== this.localRegion)
      .map(region =>
        this.sendReplicationMessage(region, transaction, replicationId)
      );

    // Fire and forget - replication happens asynchronously
    Promise.all(replicationTasks).catch(error => {
      // Alert on replication failures (consistency monitor)
      this.alertOnReplicationFailure(replicationId, error);
    });
  }

  private async sendReplicationMessage(region: string, transaction: any, replicationId: string) {
    const queue = this.getRegionQueue(region);
    
    await queue.send({
      type: 'ReplicateTransaction',
      transactionId: transaction.id,
      replicationId,  // Idempotency key
      region: this.localRegion,
      data: transaction,
      timestamp: Date.now(),
    }, {
      deduplicationId: replicationId,  // Kafka/SQS deduplication
    });
  }

  // Consistency monitor: verify all regions have transaction
  async verifyConsistency(transactionId: string): Promise<boolean> {
    const checks = await Promise.all(
      this.regions.map(region =>
        this.checkRegionHasTransaction(region, transactionId)
      )
    );

    const consistent = checks.every(result => result === true);
    
    if (!consistent) {
      // Alert: consistency violation
      await this.alertOnConsistencyViolation(transactionId, checks);
    }

    return consistent;
  }
}
```

**PCI Compliance** (Tokenization):
```typescript
// services/payment-vault/src/PaymentVault.ts
export class PaymentVault {
  // Never store raw card data - tokenize with HSM
  async tokenizeCard(cardData: CardData): Promise<string> {
    // Send to HSM (Hardware Security Module) for encryption
    const encryptedToken = await this.hsm.encrypt({
      pan: cardData.cardNumber,
      exp: cardData.expirationDate,
      cvv: cardData.cvv,
    });

    // Store only token reference
    await this.tokenStore.save({
      token: encryptedToken,
      cardLast4: cardData.cardNumber.slice(-4),
      customerId: cardData.customerId,
    });

    return encryptedToken;
  }

  // Process payment using tokenized data (no card data exposure)
  async processPayment(token: string, amount: number): Promise<string> {
    // Decrypt in HSM (never exposed to application layer)
    const authorizer = new PaymentProcessor(process.env.PROCESSOR_KEY);
    
    const result = await authorizer.authorize({
      token,  // Only token, no raw card data
      amount,
      merchantId: process.env.MERCHANT_ID,
    });

    return result.authorizationCode;
  }
}
```

**Frontend Deliverables**:
- 100+ pages/components
- Admin dashboard (transaction monitoring, risk dashboard)
- Customer portal (account management, reporting)
- Mobile responsive (React Native for mobile app)
- Real-time updates (WebSocket)
- Advanced charting (D3.js for analytics)

**Generated Admin Dashboard** (Real-time Monitoring):
```typescript
// frontend/src/components/TransactionMonitor.tsx
import React, { useEffect, useState } from 'react';
import { LineChart, BarChart } from 'recharts';
import { api } from '../services/api';

export function TransactionMonitor() {
  const [metrics, setMetrics] = useState({
    tps: 0,  // Transactions per second
    p99Latency: 0,
    errorRate: 0,
    failedSettlements: 0,
  });

  useEffect(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/admin/metrics`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(prev => ({
        ...prev,
        ...data,
      }));

      // Auto-alert on anomalies
      if (data.errorRate > 0.001) {
        this.alertOnError(data);
      }
      if (data.p99Latency > 5000) {
        this.alertOnLatency(data);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 p-6">
      <MetricCard label="TPS" value={metrics.tps.toFixed(0)} />
      <MetricCard label="P99 Latency" value={`${metrics.p99Latency}ms`} />
      <MetricCard label="Error Rate" value={`${(metrics.errorRate * 100).toFixed(3)}%`} />
      <MetricCard 
        label="Failed Settlements" 
        value={metrics.failedSettlements} 
        alert={metrics.failedSettlements > 0}
      />
    </div>
  );
}
```

**Validation Criteria**:
- ✅ 10 microservices fully implemented
- ✅ 150+ API endpoints
- ✅ Event sourcing working (immutable event log)
- ✅ Multi-region consistency verified
- ✅ Payment idempotency enforced (exactly-once semantics)
- ✅ Audit trail complete (every operation logged)
- ✅ GDPR/CCPA compliance verified
- ✅ PCI Level 1 compliance (HSM, tokenization, no card data)
- ✅ Real-time settlement monitoring

---

### Phase 12: @devops-specialist

**Enterprise CI/CD Pipeline** (Multi-Stage, Multi-Region):
```yaml
name: Enterprise Banking Platform Deployment

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 3 * * 0'  # Weekly security full scan

jobs:
  # Stage 1: Build & Unit Tests (15 min)
  build:
    runs-on: ubuntu-latest-large
    strategy:
      matrix:
        service: [auth, payments, settlement, accounts, lending, risk, compliance, notifications, reporting, analytics]
    
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/configure-aws-credentials@v2
      
      - name: Compile service (polyglot)
        run: |
          case "${{ matrix.service }}" in
            auth|accounts) cd services/${{ matrix.service }} && ./gradlew clean build ;;
            payments|settlement) cd services/${{ matrix.service }} && go build ./cmd ;;
            *) cd services/${{ matrix.service }} && npm ci && npm run build ;;
          esac
      
      - name: Unit tests (90% coverage required)
        run: cd services/${{ matrix.service }} && ./gradlew test jacocoTestReport --coverage-threshold=90
      
      - name: SAST scan (SonarQube)
        run: |
          sonar-scanner \
            -Dsonar.projectKey=${{ matrix.service }} \
            -Dsonar.coverage.exclusions=tests/**
      
      - name: Dependency check (security)
        run: dependency-check --project ${{ matrix.service }} --scan . --format JSON
      
      - name: Build and push container image
        run: |
          docker build -t ${{ env.ECR_URL }}/${{ matrix.service }}:${{ github.sha }} \
            -t ${{ env.ECR_URL }}/${{ matrix.service }}:latest \
            services/${{ matrix.service }}/
          aws ecr get-login-password | docker login --username AWS --password-stdin ${{ env.ECR_URL }}
          docker push ${{ env.ECR_URL }}/${{ matrix.service }}:${{ github.sha }}
      
      - name: Container image scanning (Trivy)
        run: |
          trivy image --severity HIGH,CRITICAL \
            ${{ env.ECR_URL }}/${{ matrix.service }}:${{ github.sha }}

  # Stage 2: Integration Tests (20 min)
  integration-tests:
    needs: build
    runs-on: ubuntu-latest-large
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Start test infrastructure (Docker Compose)
        run: docker-compose -f docker-compose.test.yml up -d
      
      - name: Run integration tests
        run: npm run test:integration -- --reporter=json > results.json
      
      - name: Database schema validation
        run: |
          npm run db:migrate:test
          npm run db:validate:schema
      
      - name: Event sourcing verification
        run: npm run test:event-sourcing
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: results.json

  # Stage 3: Deploy to Staging (10 min)
  deploy-staging:
    needs: [build, integration-tests]
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to staging EKS cluster
        run: |
          kubectl set image deployment/${{ matrix.service }} \
            ${{ matrix.service }}=${{ env.ECR_URL }}/${{ matrix.service }}:${{ github.sha }} \
            --kubeconfig=${{ secrets.KUBECONFIG_STAGING }}
      
      - name: Run smoke tests
        run: npm run test:smoke:staging
      
      - name: Run E2E tests (payment flows)
        run: npm run test:e2e:staging
      
      - name: Run load tests (1000 TPS, 60 seconds)
        run: k6 run load-test.js --vus 100 --duration 60s

  # Stage 4: Canary Deployment (15 min, 1% traffic)
  canary-deployment:
    needs: deploy-staging
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy canary (1% traffic)
        run: |
          kubectl patch virtualservice ${{ matrix.service }} \
            --type merge \
            -p '{"spec":{"hosts":[{"name":"*","http":[{"weight":99,"destination":{"host":"${{ matrix.service }}-blue"}},{"weight":1,"destination":{"host":"${{ matrix.service }}-canary"}}]}]}}' \
            --kubeconfig=${{ secrets.KUBECONFIG_PROD_REGION_1 }}
      
      - name: Monitor canary (5 min)
        run: |
          npm run test:canary:monitor -- \
            --error-threshold=0.001 \
            --latency-threshold=5000 \
            --duration=300
      
      - name: Canary results decision
        run: |
          CANARY_ERRORS=$(npm run test:canary:check:errors)
          if [ "$CANARY_ERRORS" -gt 0 ]; then
            echo "Canary errors detected. Automatic rollback..."
            kubectl patch virtualservice ${{ matrix.service }} \
              --type merge \
              -p '{"spec":{"hosts":[{"name":"*","http":[{"weight":100,"destination":{"host":"${{ matrix.service }}-blue"}}]}]}}' \
              --kubeconfig=${{ secrets.KUBECONFIG_PROD_REGION_1 }}
            exit 1
          fi
      
      - name: Increase canary traffic (25%)
        run: |
          kubectl patch virtualservice ${{ matrix.service }} \
            --type merge \
            -p '{"spec":{"hosts":[{"name":"*","http":[{"weight":75,"destination":{"host":"${{ matrix.service }}-blue"}},{"weight":25,"destination":{"host":"${{ matrix.service }}-canary"}}]}]}}'

  # Stage 5: Progressive Production Rollout (15 min total, per region)
  prod-us-east-1:
    needs: canary-deployment
    runs-on: ubuntu-latest
    environment:
      name: production-us-east-1
      url: https://api-us-east-1.banking.internal
    
    steps:
      - name: Progressive rollout (1% → 50% → 100%)
        run: |
          for weight in 1 10 25 50 100; do
            kubectl patch virtualservice ${{ matrix.service }} \
              --type merge \
              -p "{\"spec\":{\"hosts\":[{\"name\":\"*\",\"http\":[{\"weight\":$((100-weight)),\"destination\":{\"host\":\"${{ matrix.service }}-blue\"}},{\"weight\":$weight,\"destination\":{\"host\":\"${{ matrix.service }}-canary\"}}]}]}}" \
              --kubeconfig=${{ secrets.KUBECONFIG_PROD_US_EAST_1 }}
            
            sleep 60
            npm run test:health:check -- --region=us-east-1
          done
      
      - name: Smoke tests on production
        run: npm run test:smoke:prod:us-east-1
      
      - name: Verify replication to other regions
        run: npm run test:replication:verify

  prod-eu-west-1:
    needs: prod-us-east-1
    runs-on: ubuntu-latest
    environment: production-eu-west-1
    # Same steps as prod-us-east-1, but for EU region

  prod-ap-southeast-1:
    needs: prod-us-east-1
    runs-on: ubuntu-latest
    environment: production-ap-southeast-1
    # Same steps as prod-us-east-1, but for APAC region
```

**Generated Kubernetes Multi-Region Architecture**:
```yaml
# infrastructure/kubernetes/banking-service-multiregion.yaml
---
# US-EAST-1 Region
apiVersion: v1
kind: ConfigMap
metadata:
  name: region-config
  namespace: banking
data:
  local_region: "us-east-1"
  peer_regions: "eu-west-1,ap-southeast-1"
  replication_mode: "active-active"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments-service
  namespace: banking
spec:
  replicas: 5  # High availability
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 0
  
  template:
    metadata:
      labels:
        app: payments
        version: blue  # For canary deployments
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - payments
            topologyKey: kubernetes.io/hostname
      
      containers:
      - name: payments
        image: ecr.aws/banking/payments:latest
        imagePullPolicy: Always
        
        ports:
        - name: http
          containerPort: 8080
        - name: metrics
          containerPort: 9090
        
        env:
        - name: SERVICE_NAME
          value: payments
        - name: LOG_LEVEL
          value: INFO
        - name: ENABLE_EVENT_SOURCING
          value: "true"
        - name: REPLICATION_MODE
          value: "active-active"
        - name: CIRCUIT_BREAKER_THRESHOLD
          value: "50"
        
        resources:
          requests:
            cpu: "1000m"
            memory: "2Gi"
          limits:
            cpu: "2000m"
            memory: "4Gi"
        
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
        
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 30"]  # Graceful shutdown

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payments-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: payments-service
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 50
        periodSeconds: 30
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: payments-pdb
spec:
  minAvailable: 3  # Always keep 3 pods running during disruptions
  selector:
    matchLabels:
      app: payments
```

**Monitoring & Alerting** (SLO/SLI based):
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: banking-platform-slos
  namespace: banking
spec:
  groups:
  - name: banking-slos
    interval: 30s
    rules:
    # SLI: Error Rate
    - record: sli:request_errors:ratio
      expr: |
        (
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))
        )
    
    # SLI: Latency (p99)
    - record: sli:settlement_latency:p99
      expr: histogram_quantile(0.99, rate(settlement_duration_seconds_bucket[5m]))
    
    # Alert: Error Rate SLO violation (target: 99.99% success)
    - alert: ErrorRateSLOViolation
      expr: sli:request_errors:ratio > 0.0001
      for: 1m
      annotations:
        severity: critical
        summary: "Payment error rate exceeds SLO: {{ $value }}"
    
    # Alert: Settlement Latency SLO violation (target: <5s p99)
    - alert: SettlementLatencySLOViolation
      expr: sli:settlement_latency:p99 > 5
      for: 5m
      annotations:
        severity: critical
        summary: "Settlement latency p99 exceeds SLO: {{ $value }}s"
    
    # Alert: Payment idempotency violation detected
    - alert: IdempotencyViolationDetected
      expr: increase(duplicate_payment_attempts[5m]) > 0
      for: 1m
      annotations:
        severity: critical
        summary: "Duplicate payment processing detected"
```

**Validation Criteria**:
- ✅ Multi-stage CI/CD (build → test → canary → progressive production)
- ✅ 10 microservices deployed independently (polyglot: Java, Go, Node.js)
- ✅ Automated testing mandatory (unit 90%, integration, E2E, load)
- ✅ Canary deployment with auto-rollback (<0.1% error threshold)
- ✅ Progressive rollout (1% → 50% → 100%) per region
- ✅ Multi-region consistency verified
- ✅ SLO/SLI based alerting (99.99% availability, <5s settlement)
- ✅ Operational runbooks automated
- ✅ PCI compliance enforced (HSM, tokenization)
- ✅ Disaster recovery tested (RTO <15min, RPO <1min)
- ✅ On-call rotation with incident tracking

---

## Success Criteria

**Overall Validation**:
- ✅ All 13 agents executed perfectly
- ✅ Total timeline: 60 weeks (within 12-15 month requirement)
- ✅ Total cost: $50,000+/month (enterprise scale)
- ✅ Scope: 160 user stories, 3484 story points
- ✅ Team velocity: 1925 points per week (35 developers)
- ✅ Architecture: Distributed event-driven microservices
- ✅ Compliance: PCI Level 1, GDPR, CCPA, SOC2 Type II
- ✅ Uptime: 99.99% (4 nines)
- ✅ Scalability: 100M+ transactions/year

**Deliverables**:
1. ProjectPlan (38+ files, enterprise scope)
2. Backlog (160 stories, 12 epics)
3. Implementation plan (10 phases, 60 weeks)
4. Architecture decisions (6 ADRs)
5. Code structure (10 microservices)
6. Infrastructure code (30+ resources per region × 3)
7. Event sourcing implementation
8. Multi-region replication strategy
9. Disaster recovery plan
10. Enterprise CI/CD pipeline
11. Compliance documentation (PCI, GDPR, CCPA)
12. Deployed banking platform (production-ready)

**Quality Gates**:
- 90% unit test coverage
- <2 second payment settlement
- <500ms p99 query latency
- 99.99% uptime (4 nines)
- 100% data consistency across regions
- 100% audit trail integrity
- >99.95% payment success rate
- 0 critical security vulnerabilities
- PCI Level 1 audit passed
- SOC2 Type II audit passed
- 0 regulatory violations

---

## Filename: `S04-large-team-enterprise.scenario.md`
