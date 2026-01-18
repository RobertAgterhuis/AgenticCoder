# Scenarios Reference

Complete reference of all 10 scenarios in AgenticCoder.

## Business Scenarios (S01-S05)

### S01: Simple MVP

**Complexity:** Low  
**Team Size:** 1-2 developers  
**Timeline:** 1-2 weeks

**Description:**  
Basic MVP for validation. Minimal features, simple architecture.

**Technology Stack:**

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Cloud | Optional |

**Phases Executed:**
- Phase 1-5: Planning and Architecture
- Phase 13-16: Implementation and Delivery
- Skips: Azure infrastructure phases

**Agents Used:**
- @plan, @doc, @backlog, @architect
- @code-architect
- @react-specialist, @nodejs-specialist
- @database-specialist
- @qa, @devops-specialist, @reporter

**Usage:**
```bash
node bin/agentic.js generate --scenario S01 --name MyMVP
```

---

### S02: Small Team Startup

**Complexity:** Medium  
**Team Size:** 3-5 developers  
**Timeline:** 4-6 weeks

**Description:**  
Full-stack application with database and basic Azure deployment.

**Technology Stack:**

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| Backend | .NET 8 Web API |
| Database | Azure SQL |
| Cloud | Azure App Service |

**Phases Executed:** All 16 phases

**Agents Used:**
- All planning agents
- @azure-architect, @bicep-specialist
- @react-specialist, @dotnet-specialist
- @sql-specialist
- All quality agents

**Usage:**
```bash
node bin/agentic.js generate --scenario S02 --name MyStartup
```

---

### S03: Medium Team SaaS

**Complexity:** High  
**Team Size:** 5-10 developers  
**Timeline:** 8-12 weeks

**Description:**  
Multi-tenant SaaS application with comprehensive Azure services.

**Technology Stack:**

| Layer | Technology |
|-------|------------|
| Frontend | Next.js |
| Backend | .NET 8 Microservices |
| Database | Azure SQL + Cosmos DB |
| Cloud | Azure (Full stack) |
| Messaging | Azure Service Bus |
| Cache | Azure Redis |

**Phases Executed:** All 16 phases + extended validation

**Agents Used:**
- All planning and architecture agents
- All Azure specialists
- @nextjs-specialist, @dotnet-specialist
- @sql-specialist, @cosmos-specialist
- All infrastructure and quality agents

**Azure Resources:**
- App Service (Frontend)
- Container Apps (Backend services)
- Azure SQL Database
- Cosmos DB
- Service Bus
- Redis Cache
- Key Vault
- Application Insights

**Usage:**
```bash
node bin/agentic.js generate --scenario S03 --name MySaaS
```

---

### S04: Large Team Enterprise

**Complexity:** Very High  
**Team Size:** 10+ developers  
**Timeline:** 12-24 weeks

**Description:**  
Enterprise microservices with full DevOps, monitoring, and governance.

**Technology Stack:**

| Layer | Technology |
|-------|------------|
| Frontend | React + Micro-frontends |
| Backend | .NET + Node.js Microservices |
| Database | Azure SQL + Cosmos DB + Redis |
| Cloud | Azure (Enterprise) |
| Orchestration | AKS |
| API Gateway | Azure API Management |

**Phases Executed:** All 16 phases + extended phases

**Extended Features:**
- Multi-region deployment
- Blue-green deployments
- Feature flags
- A/B testing infrastructure
- Advanced monitoring

**Usage:**
```bash
node bin/agentic.js generate --scenario S04 --name MyEnterprise
```

---

### S05: Regulated Healthcare

**Complexity:** High + Compliance  
**Team Size:** 5-10 developers  
**Timeline:** 12-16 weeks

**Description:**  
Healthcare application with HIPAA compliance requirements.

**Technology Stack:**

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| Backend | .NET 8 Web API |
| Database | Azure SQL (encrypted) |
| Cloud | Azure (Healthcare compliant) |

**Compliance Features:**
- HIPAA compliance
- Audit logging
- Data encryption at rest and in transit
- Access controls
- PHI data handling

**Additional Agents:**
- @security-specialist (enhanced)
- Compliance validators

**Usage:**
```bash
node bin/agentic.js generate --scenario S05 --name MyHealthApp
```

---

## Azure Infrastructure Scenarios (A01-A05)

### A01: Simple App Service

**Complexity:** Low  
**Focus:** Basic web hosting

**Resources:**
- Resource Group
- App Service Plan
- App Service
- Application Insights

**Phases:** 9-12 only (Infrastructure phases)

**Usage:**
```bash
node bin/agentic.js generate --scenario A01 --name SimpleApp
```

---

### A02: Hub-Spoke Network

**Complexity:** Medium  
**Focus:** Network architecture

**Resources:**
- Hub Virtual Network
- Spoke Virtual Networks
- VNet Peering
- Network Security Groups
- Azure Firewall (optional)

**Use Case:**  
Enterprise network topology for multi-workload environments.

**Usage:**
```bash
node bin/agentic.js generate --scenario A02 --name HubSpoke
```

---

### A03: App Service + SQL

**Complexity:** Medium  
**Focus:** Web app with database

**Resources:**
- Resource Group
- App Service Plan
- App Service
- Azure SQL Server
- Azure SQL Database
- Key Vault
- Application Insights

**Use Case:**  
Standard web application with relational database.

**Usage:**
```bash
node bin/agentic.js generate --scenario A03 --name WebAppSQL
```

---

### A04: Multi-Tier Application

**Complexity:** High  
**Focus:** Full Azure stack

**Resources:**
- Virtual Network with subnets
- App Service (Frontend)
- Container Apps (API)
- Azure SQL Database
- Redis Cache
- Service Bus
- Key Vault
- Application Insights
- Front Door (optional)

**Use Case:**  
Production-ready multi-tier application.

**Usage:**
```bash
node bin/agentic.js generate --scenario A04 --name MultiTier
```

---

### A05: High Availability

**Complexity:** High  
**Focus:** HA/DR setup

**Resources:**
- Multi-region deployment
- Traffic Manager / Front Door
- Geo-replicated databases
- Availability Zones
- Backup and recovery

**Features:**
- 99.99% SLA target
- Automatic failover
- Geo-redundancy
- Disaster recovery plan

**Use Case:**  
Mission-critical applications requiring high availability.

**Usage:**
```bash
node bin/agentic.js generate --scenario A05 --name HighAvail
```

---

## Scenario Comparison

| Scenario | Phases | Agents | Azure Resources | Effort |
|----------|--------|--------|-----------------|--------|
| S01 | 12 | 8 | 0 | 1-2 weeks |
| S02 | 16 | 15 | 5 | 4-6 weeks |
| S03 | 16 | 20+ | 10+ | 8-12 weeks |
| S04 | 16+ | 30+ | 15+ | 12-24 weeks |
| S05 | 16 | 25+ | 10+ | 12-16 weeks |
| A01 | 4 | 5 | 4 | 1-2 days |
| A02 | 4 | 4 | 5+ | 2-3 days |
| A03 | 4 | 6 | 6 | 2-3 days |
| A04 | 4 | 10 | 10+ | 1 week |
| A05 | 4 | 8 | 15+ | 1-2 weeks |

## Next Steps

- [Agent Catalog](Catalog) - All agents
- [Phase Workflow](Phases) - Phase details
- [Creating Scenarios](../guides/Creating-Scenarios) - Custom scenarios
