# Test Scenario S03: Medium Team Product Company

**Scenario ID**: `S03`  
**Name**: Medium Team Product Company - SaaS Analytics Platform  
**Complexity**: High  
**Purpose**: Validate agent chain for medium team with enterprise features

---

## Project Context

**Project Type**: SaaS analytics dashboard for e-commerce businesses  
**Team**: Medium company (15 people: 10 developers, 2 designers, 1 product manager, 2 ops/support)  
**Timeline**: 24-32 weeks (6-8 months)  
**Budget**: $2000-3000/month  
**Users**: 100-1000 customers, 10K-100K end users  
**Revenue Model**: Subscription (SaaS) - $29/month Starter, $99/month Pro, $299/month Enterprise

---

## Initial Request (Phase 0 Input)

```markdown
We're building a SaaS analytics platform that helps e-commerce businesses track sales, customer behavior, and inventory.

Key features:
- Customer onboarding and account management
- Real-time analytics dashboard (sales, revenue, customer metrics)
- Data integration (Shopify, WooCommerce, custom APIs)
- Report generation (daily, weekly, monthly)
- Role-based access control (admin, analyst, viewer)
- Custom alerts and notifications
- Multi-tenant architecture
- Team collaboration (shared dashboards, comments)
- API for third-party integrations

Architectural Requirements:
- Multi-tenant SaaS (isolation between customers)
- Real-time data processing (stream analytics)
- Scalable to 100K end users
- GDPR/SOC2 compliance
- High availability (99.9% uptime SLA)

Team: 10 developers (5 full-stack, 3 frontend, 2 backend/data), 2 designers
Tech preferences: React, Node.js/Python, PostgreSQL, Kafka for streaming
Timeline: 24-32 weeks for MVP launch
Budget: $2000-3000/month
Growth target: 1000 customers within 12 months

Concerns:
- Data privacy (GDPR, customer data isolation)
- Real-time data pipeline reliability
- Multi-tenant query performance
- Analytics query performance at scale
- Team coordination (10+ developers)
- Compliance and audit trails
```

---

## Expected Agent Flow Summary

### Phase 0: @plan (Discovery)

**Key Questions Answered**:
- Multi-tenant SaaS architecture (vs single-tenant)
- Real-time analytics requirements (streaming vs batch)
- Data retention policy (30 days to 5 years)
- Compliance requirements (GDPR, SOC2, PCI-DSS)
- Data integrations scope (Shopify, WooCommerce, custom APIs)

**Expected Output**:
```
ProjectPlan/ (38+ files)
├── 01-Context/
│   ├── project-overview.md (SaaS analytics, multi-tenant, 10+ devs, 6-8 months)
│   ├── stakeholders.md (team of 15, enterprise customers)
│   ├── business-requirements.md (multi-tenant, real-time, integrations, compliance)
│   ├── market-analysis.md (competitive landscape, pricing models)
│   └── tech-landscape.md (React/Node.js/Python/Kafka/PostgreSQL)
├── 02-Architecture/
│   ├── multi-tenant-strategy.md (schema isolation vs database isolation)
│   ├── data-pipeline.md (real-time Kafka streaming, batch processing)
│   ├── scaling-strategy.md (horizontal scaling for 100K users)
│   └── compliance-roadmap.md (GDPR, SOC2, audit trails)
```

**Validation Criteria**:
- ✅ Multi-tenant architecture design documented
- ✅ Real-time data pipeline requirements defined
- ✅ Compliance checklist (GDPR, SOC2) included
- ✅ Scalability strategy to 100K users planned

---

### Phase 1: @doc (Documentation)

**API Specification** (~50 endpoints):
```
# Core APIs
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token

# Accounts
GET    /api/accounts/:id
PUT    /api/accounts/:id
DELETE /api/accounts/:id

# Subscriptions
POST   /api/subscriptions
GET    /api/subscriptions/:id
PUT    /api/subscriptions/:id/plan
POST   /api/subscriptions/:id/cancel

# Integrations
POST   /api/integrations (Shopify, WooCommerce, custom)
GET    /api/integrations/:id/status
POST   /api/integrations/:id/sync

# Analytics Queries
POST   /api/analytics/query (flexible query API)
GET    /api/analytics/dashboards
POST   /api/analytics/dashboards
PUT    /api/analytics/dashboards/:id
DELETE /api/analytics/dashboards/:id

# Reports
POST   /api/reports/generate
GET    /api/reports/:id
GET    /api/reports/scheduled
POST   /api/reports/scheduled

# Webhooks
POST   /api/webhooks (outbound - customer integrations)
POST   /api/webhooks/inbound (Shopify, WooCommerce - inbound)

# Admin APIs
GET    /api/admin/customers
GET    /api/admin/audit-logs
GET    /api/admin/billing
```

**Data Model** (~20 tables):
```
Tables:
- users, accounts, subscriptions
- api_keys, oauth_integrations
- data_sources (Shopify, WooCommerce, etc.)
- analytics_events (fact table - billions of rows)
- dashboards, dashboard_widgets
- reports, scheduled_reports
- roles, permissions, audit_logs
- invoices, payments
- feature_flags, feature_access
```

**Integration Guide**:
- Shopify API (OAuth 2.0)
- WooCommerce API (REST)
- Stripe Billing (webhook subscriptions)
- Kafka (real-time event streaming)
- Segment (customer data platform)

**Compliance Documentation**:
- GDPR compliance (data retention, right to deletion)
- SOC2 controls (access control, audit trails)
- Data encryption (at rest, in transit)
- PII masking strategies

---

### Phase 2: @backlog (Backlog Planning)

**Epic Structure** (10 epics):
```json
{
  "epics": [
    {"id": "E1", "title": "Authentication & Authorization", "points": 89},
    {"id": "E2", "title": "Account & Subscription Management", "points": 76},
    {"id": "E3", "title": "Data Integration Pipeline", "points": 144},
    {"id": "E4", "title": "Real-Time Analytics Engine", "points": 233},
    {"id": "E5", "title": "Dashboard Builder", "points": 144},
    {"id": "E6", "title": "Reporting & Exports", "points": 110},
    {"id": "E7", "title": "Multi-Tenant Data Isolation", "points": 133},
    {"id": "E8", "title": "Compliance & Audit", "points": 110},
    {"id": "E9", "title": "Team Collaboration", "points": 89},
    {"id": "E10", "title": "Admin Panel & Billing", "points": 98}
  ],
  "total_stories": 120,
  "total_story_points": 1176
}
```

**Sample Complex Stories**:
```
US-045: Real-Time Event Streaming (55 points)
As an analytics system, I need to process customer events in real-time
so that dashboards reflect current sales data within seconds

Acceptance Criteria:
- Kafka topic ingestion (multiple data sources)
- Stream processing (aggregation, deduplication)
- <5 second latency from event to dashboard
- Handle 10K events/second peak
- Automatic schema evolution
- Dead letter queue for malformed events
- End-to-end monitoring

Technical Implementation:
- Apache Kafka (event bus)
- Kafka Streams or Apache Flink (stream processing)
- TimescaleDB for time-series aggregation
- Real-time WebSocket updates to dashboards
- Exactly-once processing semantics

US-078: Multi-Tenant Query Isolation (34 points)
As a data analyst, I want to query only my customer's data
so that I cannot accidentally access other customers' data

Acceptance Criteria:
- Row-level security (RLS) in PostgreSQL
- Tenant context in all queries
- Query audit trail (who queried what, when)
- No data leakage between tenants (automated tests)
- Bulk operations isolated per tenant

Testing:
- Penetration testing (attempt to query other tenants)
- Row-level security verification
- Audit log verification

US-089: GDPR Right to Deletion (21 points)
As a user, I want to request deletion of my data
so that I comply with GDPR regulations

Acceptance Criteria:
- "Delete My Data" button in account settings
- All personal data removed within 30 days
- Analytics events anonymized (if retained)
- Audit trail records deletion request
- Email confirmation sent
- Cascading delete (account, subscriptions, events)
```

**Validation Criteria**:
- ✅ 10 epics (comprehensive feature set)
- ✅ 100+ user stories (complex application)
- ✅ 1100+ story points (24-32 weeks for 10 devs at 40 points/week)
- ✅ Stories address multi-tenancy, compliance, real-time

---

### Phase 3: @coordinator (Implementation Plan)

**Phase Breakdown** (8 phases, 6-8 months):
```
Phase 1: Foundation & Infrastructure (2 weeks)
  - Architecture decisions
  - Database schema
  - Kubernetes setup
  - CI/CD pipeline
  - 89 points

Phase 2: Authentication & Multi-Tenancy (3 weeks)
  - User registration/login
  - Tenant isolation
  - RBAC implementation
  - JWT + session management
  - 110 points

Phase 3: Data Integration Pipeline (4 weeks)
  - Shopify integration
  - WooCommerce integration
  - Custom API connectors
  - Data transformation
  - 144 points

Phase 4: Real-Time Analytics Engine (4 weeks)
  - Kafka setup
  - Stream processing
  - Aggregation service
  - WebSocket real-time updates
  - 233 points

Phase 5: Dashboard & Visualization (3 weeks)
  - Dashboard builder UI
  - Widget library
  - Real-time updates
  - Custom queries
  - 144 points

Phase 6: Reporting & Compliance (2 weeks)
  - Report generation
  - Scheduled reports
  - GDPR compliance
  - Audit logging
  - 164 points

Phase 7: Team Collaboration & Admin (2 weeks)
  - Shared dashboards
  - Comments/annotations
  - Admin panel
  - Billing integration
  - 165 points

Phase 8: Testing, Optimization & Launch (2 weeks)
  - Load testing (100K users)
  - Security audit
  - Performance optimization
  - Production deployment
  - 162 points
```

**Team Velocity Calculation**:
```
10 developers × 40 points per developer per week = 400 points/week
32 weeks = 32 weeks
32 weeks × 40 points/week = 1280 points capacity
Planned: 1176 points (92% utilization - tight but feasible)
```

**Validation Criteria**:
- ✅ 8 phases (milestone-based)
- ✅ 32 weeks total (within 6-8 month requirement)
- ✅ Velocity realistic (400 points per week for 10 devs)
- ✅ Critical path: Foundation → Multi-tenancy → Integration → Analytics Engine
- ✅ Parallel workstreams (frontend + backend + data pipeline)

---

### Phase 4: @qa (Quality & Validation Framework)

**Testing Strategy** (comprehensive for SaaS):
```json
{
  "testing_strategies": [
    {
      "type": "Unit Testing",
      "coverage_target": 85,
      "focus": "Business logic, data transformations, analytics calculations"
    },
    {
      "type": "Integration Testing",
      "coverage_target": 75,
      "focus": "API endpoints, database queries, Kafka producers/consumers"
    },
    {
      "type": "E2E Testing",
      "coverage_target": 60,
      "focus": "Critical user journeys (signup, integration, query, dashboard)"
    },
    {
      "type": "Load Testing",
      "coverage_target": 100,
      "focus": "10K events/second streaming, 100K concurrent users, query performance"
    },
    {
      "type": "Security Testing",
      "coverage_target": 100,
      "focus": "Multi-tenant isolation, RBAC, GDPR compliance, SQL injection"
    },
    {
      "type": "Chaos Testing",
      "coverage_target": 100,
      "focus": "Kafka failures, database downtime, network partitions"
    }
  ],
  "compliance_testing": [
    "GDPR: Right to deletion, data retention, consent",
    "SOC2: Access control, audit trails, encryption",
    "Penetration testing: Tenant data isolation, privilege escalation"
  ],
  "quality_metrics": [
    {"name": "Code Coverage", "target": 85, "critical": true},
    {"name": "API Response Time", "target": "<200ms p95", "critical": true},
    {"name": "Query Performance", "target": "<1s for ad-hoc queries", "critical": true},
    {"name": "Stream Latency", "target": "<5 seconds", "critical": true},
    {"name": "Availability", "target": "99.9%", "critical": true},
    {"name": "Data Consistency", "target": "100%", "critical": true},
    {"name": "Security Scan", "target": "0 critical vulnerabilities", "critical": true},
    {"name": "Lighthouse Score", "target": ">90", "critical": false}
  ]
}
```

**Validation Criteria**:
- ✅ 6 testing strategies (including load, chaos, security)
- ✅ Compliance testing mandatory (GDPR, SOC2, penetration)
- ✅ Multi-tenant isolation verified (no data leakage)
- ✅ Stream latency targets defined (<5 seconds)
- ✅ 99.9% availability SLA tested

---

### Phase 6: @architect (Architecture Design)

**Architecture Style**: Microservices (with well-defined boundaries)

**Key Architectural Decisions**:
```json
{
  "ADR-001": {
    "title": "Use Microservices with API Gateway",
    "context": "10-dev team, 100K+ users, independent scaling required",
    "decision": "5 microservices: Auth, Integrations, Analytics, Dashboard, Admin",
    "rationale": "Enables independent scaling, parallel development, different tech stacks per service"
  },
  "ADR-002": {
    "title": "Use Kafka for Event-Driven Architecture",
    "context": "Real-time analytics, multiple data sources, event-sourcing",
    "decision": "Kafka as central event bus, Kafka Streams for processing",
    "rationale": "<5 second latency, audit trail, replay events capability"
  },
  "ADR-003": {
    "title": "Multi-Tenant Database Strategy",
    "context": "GDPR compliance, data isolation, cost efficiency",
    "decision": "Shared PostgreSQL database with row-level security (RLS)",
    "rationale": "Cost-effective, easier backup/restore, strong isolation with RLS"
  },
  "ADR-004": {
    "title": "Deploy to Kubernetes",
    "context": "10+ services, auto-scaling, high availability",
    "decision": "Azure Kubernetes Service (AKS) with auto-scaling",
    "rationale": "99.9% SLA, auto-scaling, health checks, rolling updates"
  },
  "ADR-005": {
    "title": "Use TimescaleDB for Time-Series Data",
    "context": "Analytics queries on billions of rows, performance critical",
    "decision": "TimescaleDB extension for PostgreSQL",
    "rationale": "Better compression, faster time-series queries, single database"
  }
}
```

**Technology Stack**:
```
Frontend: React 18 + TypeScript + Vite + Tailwind + TanStack Query
Backend: Node.js + Express (auth, dashboard) + Python (analytics, data pipeline)
Database: PostgreSQL 15 + TimescaleDB
Cache: Redis 7 (session, query results)
Message Queue: Kafka (event streaming)
Search: Elasticsearch (log/audit trail searching)
Monitoring: Prometheus + Grafana + Application Insights
Container: Docker + Kubernetes (AKS)
Storage: Azure Blob Storage (reports, exports)
```

**Estimated Monthly Cost**: $4000-5000
```
AKS: $1000-2000 (node pool, auto-scaling)
PostgreSQL + TimescaleDB: $800-1200
Kafka: $500-800
Redis: $200-300
Elasticsearch: $200-300
Blob Storage: $100-200
CDN: $100-200
Application Insights: Free (5GB/month)
Domain + SSL: $20
```

**Validation Criteria**:
- ✅ Architecture style = Microservices (appropriate for 10-dev team, 100K+ users)
- ✅ 5 ADRs with technical depth
- ✅ Multi-tenant isolation strategy documented
- ✅ Real-time streaming architecture defined
- ✅ 99.9% uptime SLA achievable
- ✅ Cost estimate $4-5K (higher than S02, justified by scale)

---

### Phase 7: @code-architect (Code Structure)

**Microservices Structure**:
```
analytics-saas/
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── middleware/
│   │   │   └── models/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── integrations-service/
│   │   ├── src/
│   │   │   ├── connectors/      (Shopify, WooCommerce, custom)
│   │   │   ├── transformers/    (data normalization)
│   │   │   ├── sync/            (Kafka producers)
│   │   │   └── repositories/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── analytics-service/
│   │   ├── src/
│   │   │   ├── processors/      (stream processing)
│   │   │   ├── queries/         (time-series queries)
│   │   │   ├── aggregations/    (rolling windows)
│   │   │   └── repositories/
│   │   ├── Dockerfile
│   │   └── requirements.txt     (Python)
│   │
│   ├── dashboard-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── websocket/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── admin-service/
│       ├── src/
│       ├── Dockerfile
│       └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/          (Auth, Dashboard, Reports, Admin)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── services/
│   ├── Dockerfile
│   └── package.json
│
├── infrastructure/
│   ├── kubernetes/
│   │   ├── namespace.yaml
│   │   ├── configmaps.yaml
│   │   └── services/
│   │       ├── auth-deployment.yaml
│   │       ├── integrations-deployment.yaml
│   │       └── analytics-deployment.yaml
│   └── bicep/
│       ├── main.bicep
│       ├── aks.bicep
│       ├── database.bicep
│       └── kafka.bicep
│
└── scripts/
    ├── deploy.sh
    └── migrate.sh
```

**Design Patterns**:
1. **Event Sourcing**: Kafka for event history
2. **CQRS**: Command (write) and Query (read) separation
3. **Circuit Breaker**: Resilient integration service
4. **Bulkhead**: Service isolation in K8s
5. **Repository Pattern**: Per service
6. **Dependency Injection**: Loosely coupled services

**API Gateway** (API Management):
- Azure API Management or Kong
- Rate limiting per tenant
- API versioning (v1, v2)
- Developer portal for third-party integrations

**Validation Criteria**:
- ✅ 5 microservices clearly defined
- ✅ Separate frontend deployment
- ✅ Kubernetes manifests included
- ✅ 6+ design patterns applied
- ✅ API gateway configured
- ✅ Clear service boundaries

---

### Phase 8-9: @azure-architect + @bicep-specialist

**Azure Resources** (15+ resources):
```
Compute:
- Azure Kubernetes Service (AKS) - 3 node pools (system, apps, analytics)
- Container Registry (ACR) - for microservice images

Networking:
- Virtual Network with subnets
- Network Security Groups (NSG)
- Application Gateway (API Gateway replacement)
- Azure Front Door (global CDN + DDoS)

Data:
- PostgreSQL Flexible Server (multi-zone, HA)
- Azure Cache for Redis
- Azure Blob Storage
- Azure Event Hubs (alternative to Kafka)

Analytics & Monitoring:
- Application Insights
- Log Analytics Workspace
- Azure Monitor
- Azure Advisor

Security:
- Azure Key Vault
- Azure SQL Database (optional, for some data)
- Managed Identity

DevOps:
- Azure Container Registry
- Azure Pipelines (CI/CD)
```

**Deployment Strategy**:
- Multiple environments: dev, staging, production
- Auto-scaling: 1-10 nodes per pool (based on CPU)
- Blue-green deployments (K8s rolling updates)
- Automated backups (PostgreSQL)
- Disaster recovery in different region

**Cost Breakdown**:
```
AKS Cluster: $1200 (3 Standard_D2s_v3 nodes)
PostgreSQL: $1000 (Burstable B2s, HA enabled)
Redis: $300 (Premium tier, HA)
Kafka/Event Hubs: $500
Blob Storage: $200
Application Insights: Free tier
Network/Firewalls: $200
----
Total: ~$3400/month (scalable)
```

**Validation Criteria**:
- ✅ 15+ Azure resources
- ✅ Multi-zone HA (99.9% SLA)
- ✅ Auto-scaling configured
- ✅ Disaster recovery planned
- ✅ Cost realistic ($3.4K for infrastructure)

---

### Phase 10-11: @frontend-specialist + @backend-specialist

**Frontend Deliverables**:
- 80+ components (20 shared, 60 feature-specific)
- 15+ pages (Dashboard, Reports, Settings, Admin, Integrations)
- Real-time WebSocket updates
- Advanced visualization library (Recharts, D3.js)
- Complex state management (TanStack Query + Redux)
- Mobile responsive

**Generated Dashboard Component** (Real-time Analytics):
```typescript
// frontend/src/components/AnalyticsDashboard.tsx
import React, { useEffect, useState } from 'react';
import { LineChart, BarChart, PieChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    orderCount: 0,
    conversionRate: 0,
  });

  // Real-time metrics via WebSocket
  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'METRICS_UPDATE') {
        setMetrics(prev => ({
          ...prev,
          ...data.payload,
        }));
      }
    };

    return () => ws.close();
  }, []);

  // Fetch historical data
  const { data: chartData } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => {
      const res = await api.get('/api/analytics/revenue', {
        params: { period: '30days' }
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-gray-600 text-sm">Total Revenue</h3>
        <p className="text-3xl font-bold">${metrics.totalRevenue.toFixed(2)}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-gray-600 text-sm">Orders</h3>
        <p className="text-3xl font-bold">{metrics.orderCount}</p>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-gray-600 text-sm">Conversion Rate</h3>
        <p className="text-3xl font-bold">{(metrics.conversionRate * 100).toFixed(2)}%</p>
      </div>

      {chartData && (
        <div className="col-span-3 bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <LineChart width={800} height={300} data={chartData}>
            {/* Chart configuration */}
          </LineChart>
        </div>
      )}
    </div>
  );
}
```

**Backend Deliverables**:
- 5 microservices (~50K lines of code total)
- 60+ API endpoints
- Kafka producers (event ingestion)
- Event stream processors
- Row-level security implementation
- GDPR compliance features
- Multi-tenant query isolation

**Generated Microservice** (Analytics Service):
```typescript
// services/analytics-service/src/routes/analytics.ts
import express from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { authMiddleware, tenantMiddleware } from '../middleware';
import { rowLevelSecurityMiddleware } from '../middleware/rls';

const router = express.Router();
const analyticsService = new AnalyticsService();

// GET /api/analytics/revenue - Multi-tenant revenue analytics with RLS
router.get('/revenue', authMiddleware, tenantMiddleware, rowLevelSecurityMiddleware, async (req, res) => {
  try {
    const { tenantId, userId } = req.context;
    const { period = '30days' } = req.query;

    // Row-level security: Users can only see their own data
    const revenue = await analyticsService.getRevenueByPeriod(tenantId, userId, period as string);

    res.json(revenue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// GET /api/analytics/customers - Customer demographics with RLS
router.get('/customers', authMiddleware, tenantMiddleware, rowLevelSecurityMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.context;

    const customers = await analyticsService.getCustomerMetrics(tenantId);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer data' });
  }
});

export default router;
```

**Event Processing Pipeline** (Kafka Consumers):
```typescript
// services/event-processor/src/processors/EventProcessor.ts
import { Kafka, Consumer } from 'kafkajs';
import { AnalyticsStore } from '../stores/AnalyticsStore';

const kafka = new Kafka({
  clientId: 'event-processor',
  brokers: process.env.KAFKA_BROKERS!.split(','),
});

export class EventProcessor {
  private consumer: Consumer;

  async start() {
    this.consumer = kafka.consumer({ groupId: 'analytics-group' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'orders', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value!.toString());
          
          // Process order event for analytics
          if (event.type === 'ORDER_CREATED') {
            await this.processOrderCreated(event);
          } else if (event.type === 'PAYMENT_COMPLETED') {
            await this.processPaymentCompleted(event);
          }
        } catch (error) {
          console.error('Event processing error:', error);
        }
      },
    });
  }

  private async processOrderCreated(event: any) {
    const { tenantId, orderId, amount, customerId } = event;
    
    // Update analytics in real-time
    await AnalyticsStore.recordOrder({
      tenantId,
      orderId,
      amount,
      customerId,
      timestamp: new Date(),
    });

    // Publish metrics update via WebSocket
    this.publishMetricsUpdate(tenantId, {
      type: 'ORDER_CREATED',
      amount,
    });
  }

  private publishMetricsUpdate(tenantId: string, data: any) {
    // WebSocket broadcast to connected clients
    console.log(`Broadcasting to tenant ${tenantId}:`, data);
  }
}
```

**GDPR Compliance Features** (Data Export):
```typescript
// services/data-export/src/routes/gdpr.ts
// POST /api/gdpr/export - GDPR Right to be Forgotten
router.post('/export', authMiddleware, async (req, res) => {
  try {
    const { userId, tenantId } = req.context;

    // Collect all user data across services
    const userData = {
      user: await fetchUserData(userId),
      orders: await fetchUserOrders(userId),
      analytics: await fetchUserAnalytics(tenantId, userId),
      webhooks: await fetchUserWebhooks(userId),
    };

    // Generate GDPR-compliant export
    const exportData = JSON.stringify(userData, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=gdpr-export.json');
    res.send(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// DELETE /api/gdpr/delete - GDPR Right to be Forgotten
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const { userId, tenantId } = req.context;

    // Soft delete across all services (audit trail retention)
    await deleteUserData(userId, tenantId);

    // Log for compliance
    await auditLog({
      action: 'USER_DATA_DELETED',
      userId,
      tenantId,
      timestamp: new Date(),
      reason: 'GDPR Right to be Forgotten',
    });

    res.json({ message: 'User data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Deletion failed' });
  }
});
```

**Row-Level Security Middleware**:
```typescript
// middleware/rowLevelSecurityMiddleware.ts
export async function rowLevelSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const { tenantId, userId } = req.context;

  // Inject RLS context into database queries
  const client = await db.connect();
  
  try {
    // PostgreSQL RLS - set user context
    await client.query(`
      SET app.current_user_id = '${userId}';
      SET app.current_tenant_id = '${tenantId}';
    `);
    
    req.dbClient = client;
    next();
  } finally {
    client.release();
  }
}
```

**Multi-tenant Query Isolation** (Database Level):
```sql
-- PostgreSQL Row-Level Security (RLS)
-- Create policies for multi-tenant data isolation

-- Users can only see their own tenant's data
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY user_isolation ON user_data
  USING (
    user_id = current_setting('app.current_user_id')::uuid
    AND tenant_id = current_setting('app.current_tenant_id')::uuid
  );

-- Superuser (service) can see all data for backups
CREATE POLICY superuser_bypass ON orders
  USING (current_user = 'analytics_user');

ENABLE ROW LEVEL SECURITY ON orders;
ENABLE ROW LEVEL SECURITY ON user_data;
```

**Validation Criteria**:
- ✅ 80+ frontend components
- ✅ 15+ pages
- ✅ Real-time functionality (WebSocket + Kafka)
- ✅ 5 microservices (Orders, Analytics, Auth, Reporting, Data Processing)
- ✅ 60+ API endpoints
- ✅ Multi-tenant isolation verified (RLS enforced)
- ✅ GDPR compliance implemented (export + delete)
- ✅ Event streaming (Kafka producers/consumers)
- ✅ Rate limiting and auth on all endpoints

---

### Phase 12: @devops-specialist

**CI/CD Pipeline** (Kubernetes-native):
```yaml
# .github/workflows/deploy-production.yml
name: Deploy SaaS Platform to AKS

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * 0'  # Weekly security scan

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [orders, analytics, auth, reporting, data-processor]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push Docker image
        run: |
          docker build -t ${{ env.ACR_URL }}/${{ matrix.service }}:${{ github.sha }} \
            services/${{ matrix.service }}/
          az acr login --name ${{ env.ACR_NAME }}
          docker push ${{ env.ACR_URL }}/${{ matrix.service }}:${{ github.sha }}

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run unit tests (85% coverage required)
        run: npm run test:unit -- --coverage --coverageThreshold='{"global":{"lines":85}}'
      
      - name: Run integration tests
        run: docker-compose -f docker-compose.test.yml up --abort-on-container-exit
      
      - name: Security: Container scan
        run: trivy image ${{ env.ACR_URL }}/orders:${{ github.sha }}
      
      - name: Security: OWASP dependency check
        run: npm audit --audit-level=moderate

  deploy-staging:
    needs: [build, test]
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to AKS staging
        run: |
          kubectl set image deployment/orders-staging \
            orders=${{ env.ACR_URL }}/orders:${{ github.sha }} \
            --record --kubeconfig=${{ secrets.KUBECONFIG_STAGING }}

      - name: Run E2E tests on staging
        run: npm run test:e2e:staging

      - name: Run load tests (1000 RPS)
        run: k6 run load-test.js --vus 100 --duration 5m

  deploy-production-blue-green:
    needs: deploy-staging
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to AKS production (blue-green)
        run: |
          # Deploy new version as "green"
          kubectl set image deployment/orders-green \
            orders=${{ env.ACR_URL }}/orders:${{ github.sha }} \
            --record --kubeconfig=${{ secrets.KUBECONFIG_PROD }}
          
          # Wait for rollout
          kubectl rollout status deployment/orders-green \
            --kubeconfig=${{ secrets.KUBECONFIG_PROD }} \
            --timeout=5m
      
      - name: Run smoke tests on green deployment
        run: npm run test:smoke:green
      
      - name: Switch traffic to green (blue-green swap)
        run: |
          kubectl patch service orders -p '{"spec":{"selector":{"version":"green"}}}' \
            --kubeconfig=${{ secrets.KUBECONFIG_PROD }}

      - name: Monitor for 5 minutes
        run: sleep 300 && npm run test:health:check
      
      - name: Automated rollback if failures detected
        if: failure()
        run: |
          kubectl patch service orders -p '{"spec":{"selector":{"version":"blue"}}}' \
            --kubeconfig=${{ secrets.KUBECONFIG_PROD }}
```

**Generated Kubernetes Manifests** (IaC):
```yaml
# infrastructure/kubernetes/orders-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders
  labels:
    app: orders
    version: v1
spec:
  replicas: 3  # High availability
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: orders
  template:
    metadata:
      labels:
        app: orders
        version: blue  # For blue-green deployments
    spec:
      containers:
      - name: orders
        image: acr.azurecr.io/orders:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        - name: KAFKA_BROKERS
          value: kafka-0.kafka:9092,kafka-1.kafka:9092,kafka-2.kafka:9092
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: orders-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: orders
  minReplicas: 3
  maxReplicas: 10
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

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: orders-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: orders
```

**Monitoring & Observability** (Prometheus + Grafana):
```typescript
// Services register metrics with Prometheus
import promClient from 'prom-client';

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const kafkaEventProcessingDuration = new promClient.Histogram({
  name: 'kafka_event_processing_duration_ms',
  help: 'Time to process Kafka event',
  labelNames: ['event_type'],
  buckets: [10, 50, 100, 500, 1000],
});

// Middleware to track requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

**Alert Rules** (Kubernetes):
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: saas-platform-alerts
spec:
  groups:
  - name: application
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
      for: 5m
      annotations:
        summary: "High error rate in {{ $labels.service }}"
    
    - alert: HighLatency
      expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
      for: 5m
      annotations:
        summary: "p95 latency > 1s in {{ $labels.service }}"
    
    - alert: KafkaLag
      expr: kafka_consumer_lag > 100000
      for: 10m
      annotations:
        summary: "Kafka consumer lagging behind"

  - name: infrastructure
    interval: 30s
    rules:
    - alert: PodCrashLoop
      expr: rate(kube_pod_container_status_restarts_total[15m]) > 0.1
      annotations:
        summary: "Pod {{ $labels.pod }} in crash loop"
    
    - alert: PersistentVolumeUsage
      expr: kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.9
      annotations:
        summary: "PV {{ $labels.persistentvolumeclaim }} > 90% full"
```

**Disaster Recovery**:
```yaml
# automated-backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-postgresql
spec:
  schedule: "0 * * * *"  # Hourly
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h $DATABASE_HOST -U $DATABASE_USER \
                -d $DATABASE_NAME \
                | gzip \
                | az storage blob upload \
                  --container-name backups \
                  --name backup-$(date +%s).sql.gz \
                  --account-name $STORAGE_ACCOUNT
          restartPolicy: OnFailure
```

**Validation Criteria**:
- ✅ CI/CD pipeline fully automated (build → test → staging → production)
- ✅ Blue-green deployment (zero-downtime)
- ✅ Automated rollback on failures
- ✅ Load testing in pipeline (1000 RPS)
- ✅ Security scanning (container, dependencies, OWASP)
- ✅ Kubernetes manifests (Deployment, HPA, PDB, Service)
- ✅ Prometheus metrics + Grafana dashboards
- ✅ Alert rules for SLO monitoring
- ✅ Automated backups (hourly, 35-day retention)
- ✅ RTO: 1 hour, RPO: 15 minutes
- ✅ Monthly DR drills scheduled

**Validation Criteria**:
- ✅ Multi-stage CI/CD pipeline
- ✅ Automated testing mandatory
- ✅ Blue-green deployment
- ✅ Comprehensive monitoring
- ✅ Disaster recovery plan
- ✅ Load testing automated

---

## Success Criteria

**Overall Validation**:
- ✅ All 13 agents executed
- ✅ Total timeline: 32 weeks (within 6-8 months)
- ✅ Total cost: $3400/month (within $2-3K budget for infrastructure)
- ✅ Scope: 120 user stories, 1176 story points
- ✅ Team velocity: 400 points per week (10 developers)
- ✅ Architecture: Microservices (scalable to 100K users)
- ✅ Performance: <200ms API, <5s stream latency, <1s query
- ✅ Compliance: GDPR, SOC2, multi-tenant isolation verified

**Deliverables**:
1. ProjectPlan (38+ files, comprehensive)
2. Backlog (120 stories, 10 epics)
3. Implementation plan (8 phases, 32 weeks)
4. Architecture decisions (5 ADRs)
5. Code structure (5 microservices)
6. Infrastructure code (15+ Azure resources, K8s manifests)
7. CI/CD pipeline (multi-stage, automated testing)
8. Monitoring and alerting (Application Insights, Prometheus)
9. Disaster recovery plan
10. Deployed SaaS application (production-ready)

**Quality Gates**:
- 85% unit test coverage
- <200ms p95 API response
- <5 second stream latency
- <1 second ad-hoc query
- 99.9% availability
- 0 data leakage (multi-tenant isolation verified)
- GDPR compliant
- 0 critical security vulnerabilities
- SOC2 audit passed

---

## Filename: `S03-medium-team-saas.scenario.md`
