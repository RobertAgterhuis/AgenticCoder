# Scenarios

Pre-configured project scenarios for different use cases.

---

## Overview

AgenticCoder includes 5 pre-configured scenarios designed for different team sizes, complexity levels, and compliance requirements.

| Scenario | Team Size | Duration | Monthly Cost | Best For |
|----------|-----------|----------|--------------|----------|
| **S01** | 1 developer | 4-6 weeks | ~$35 | Solo MVP |
| **S02** | 3 developers | 12-16 weeks | ~$480 | Small startup |
| **S03** | 10 developers | 24-32 weeks | $2K-5K | Medium SaaS |
| **S04** | 50 people | 48-60 weeks | $20K+ | Enterprise |
| **S05** | 12 people | 36-48 weeks | $10K+ | Healthcare/HIPAA |

---

## S01: Simple MVP

**Best for:** Solo developers building proof-of-concepts or portfolio projects.

### Overview

```yaml
Team: 1 solo developer
Duration: 4-6 weeks
Monthly Cost: ~$35
Architecture: Monolith
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 with Vite |
| Backend | Express.js with TypeScript |
| Database | PostgreSQL |
| Hosting | Azure App Service B1 |
| CI/CD | GitHub Actions |

### Features

- ✅ User authentication (JWT)
- ✅ Basic CRUD operations
- ✅ REST API
- ✅ Responsive UI
- ✅ Basic CI/CD pipeline
- ✅ Docker for local development

### Example Usage

```
@plan Create a task management app using scenario S01.
Features: create/edit/delete tasks, user authentication, task status tracking.
```

### Generated Structure

```
output/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── models/
│   └── package.json
├── infrastructure/
│   └── main.bicep
└── .github/workflows/
    └── deploy.yml
```

---

## S02: Small Team Startup

**Best for:** Small teams (2-5 developers) building startup products.

### Overview

```yaml
Team: 3 developers
Duration: 12-16 weeks
Monthly Cost: ~$480
Architecture: Modular Monolith
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 with Redux Toolkit |
| Backend | Express.js with TypeScript |
| Database | PostgreSQL + Redis (cache) |
| Payments | Stripe integration |
| Hosting | Azure App Service + Static Web Apps |
| CI/CD | GitHub Actions |

### Features

- ✅ Everything in S01, plus:
- ✅ Payment processing (Stripe)
- ✅ Email notifications
- ✅ Redis caching
- ✅ Rate limiting
- ✅ API documentation (Swagger)
- ✅ Error tracking (Sentry)

### Example Usage

```
@plan Create an e-commerce platform using scenario S02.
Features: product catalog, shopping cart, checkout with Stripe, order history.
```

---

## S03: Medium Team SaaS

**Best for:** Growing companies (8-15 developers) building SaaS platforms.

### Overview

```yaml
Team: 10 developers
Duration: 24-32 weeks
Monthly Cost: $2K-5K
Architecture: Microservices (basic)
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 with Next.js |
| Backend | Node.js microservices |
| Database | PostgreSQL + Redis |
| Messaging | Apache Kafka |
| Container | Kubernetes (AKS) |
| CI/CD | GitHub Actions + ArgoCD |

### Features

- ✅ Everything in S02, plus:
- ✅ Multi-tenant architecture
- ✅ Role-based access control (RBAC)
- ✅ Event-driven architecture
- ✅ API gateway
- ✅ Service mesh ready
- ✅ Horizontal scaling
- ✅ Blue-green deployments

### Example Usage

```
@plan Create a project management SaaS using scenario S03.
Features: multi-tenant workspaces, real-time collaboration, Kanban boards, reporting.
```

---

## S04: Large Team Enterprise

**Best for:** Large organizations (40+ people) with complex requirements.

### Overview

```yaml
Team: 50 people (10 teams)
Duration: 48-60 weeks
Monthly Cost: $20K+
Architecture: Event-Sourcing Microservices
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 17 (enterprise) |
| Backend | Java Spring Boot + Go services |
| Database | PostgreSQL + Event Store |
| Messaging | Kafka + RabbitMQ |
| Container | Multi-region AKS |
| CI/CD | Azure DevOps |

### Features

- ✅ Everything in S03, plus:
- ✅ Event sourcing & CQRS
- ✅ Multi-region deployment
- ✅ Disaster recovery
- ✅ Advanced audit logging
- ✅ Custom compliance controls
- ✅ Performance monitoring (APM)
- ✅ A/B testing infrastructure

### Example Usage

```
@plan Create a banking transaction system using scenario S04.
Features: account management, transfers, transaction history, audit trails, compliance reporting.
```

---

## S05: Regulated Healthcare

**Best for:** Healthcare companies requiring HIPAA compliance.

### Overview

```yaml
Team: 12 people (3 teams)
Duration: 36-48 weeks
Monthly Cost: $10K+
Architecture: Secure Microservices
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 (WCAG compliant) |
| Backend | Node.js with security hardening |
| Database | PostgreSQL (encrypted) |
| Security | Azure Key Vault, Private Endpoints |
| Hosting | HIPAA-compliant Azure |
| CI/CD | GitHub Actions with security gates |

### Features

- ✅ HIPAA compliance controls
- ✅ Data encryption (at rest & in transit)
- ✅ Audit logging (immutable)
- ✅ Access controls (least privilege)
- ✅ Breach notification system
- ✅ Data retention policies
- ✅ Business Associate Agreement (BAA) ready
- ✅ Penetration testing framework

### Compliance

| Requirement | Implementation |
|-------------|----------------|
| Access Control | RBAC + MFA |
| Encryption | AES-256 at rest, TLS 1.3 in transit |
| Audit Trails | Immutable log storage |
| Data Integrity | Checksums + versioning |
| Breach Response | Automated alerting |

### Example Usage

```
@plan Create a patient management system using scenario S05.
Features: patient records (PHI), appointment scheduling, secure messaging, prescription tracking.
```

---

## Choosing Your Scenario

### Decision Matrix

| Your Situation | Recommended |
|----------------|-------------|
| Building a prototype alone | **S01** |
| Small team, need to ship fast | **S02** |
| Growing company, multi-tenant | **S03** |
| Enterprise, complex requirements | **S04** |
| Healthcare/Finance, compliance | **S05** |

### Customization

You can customize any scenario:

```
@plan Use scenario S02 but with:
- Vue.js instead of React
- PostgreSQL instead of MongoDB
- Deploy to AWS instead of Azure
```

### Mixing Scenarios

Take elements from multiple scenarios:

```
@plan Use S01 as base with:
- Payment processing from S02
- HIPAA controls from S05
```

---

## Scenario Comparison

| Feature | S01 | S02 | S03 | S04 | S05 |
|---------|-----|-----|-----|-----|-----|
| Auth | Basic | OAuth | SSO | Enterprise SSO | MFA required |
| Multi-tenant | ❌ | ❌ | ✅ | ✅ | ✅ |
| Microservices | ❌ | ❌ | ✅ | ✅ | ✅ |
| Kubernetes | ❌ | ❌ | ✅ | ✅ | ✅ |
| Event Sourcing | ❌ | ❌ | ❌ | ✅ | ❌ |
| HIPAA | ❌ | ❌ | ❌ | ❌ | ✅ |
| Multi-region | ❌ | ❌ | ❌ | ✅ | Optional |

---

<p align="center">
  <a href="User-Guide">← User Guide</a> | <a href="FAQ">FAQ →</a>
</p>
