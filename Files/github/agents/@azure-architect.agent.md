# @azure-architect Agent (Phase 8)

**Agent ID**: `@azure-architect`  
**Phase**: 8  
**Purpose**: Design Azure infrastructure, resource selection, and scaling strategies  
**Triggers From**: @architect (architecture_decisions)  
**Hands Off To**: @bicep-specialist (azure_resource_plan)

---

## Core Responsibilities

### 1. Azure Resource Selection

**Compute Options**:

| Resource | Use Case | Cost | Scaling |
|----------|----------|------|---------|
| **App Service** | Web APIs, web apps | $10-200/mo | Auto-scale |
| **Container Instances** | One-off containers | $0.01/hr | Manual |
| **App Service Container** | Containerized apps | $10-200/mo | Auto-scale |
| **AKS** (Kubernetes) | Microservices | $70+ cluster | Auto-scale (per pod) |
| **Functions** | Serverless/event-driven | Pay per invocation | Auto-scale |
| **Service Fabric** | Complex stateful services | $55+ cluster | Auto-scale |

**Recommendation by Team Size**:
- **Startup (1-5 devs)**: App Service + Functions
- **Growth (5-20 devs)**: App Service + Service Bus
- **Scale (20+ devs)**: AKS + Functions for specialized workloads

### 2. Database Selection

**Primary Databases**:

| Database | Use Case | Cost | Scaling |
|----------|----------|------|---------|
| **Azure SQL** | Relational, ACID | $15-300/mo | DTU or vCore |
| **PostgreSQL** | Open-source relational | $20-500/mo | Vertical scaling |
| **Cosmos DB** | Global, NoSQL | $25+ + usage | Unlimited |
| **Azure Cache** | Session, cache | $15-300/mo | Manual scaling |
| **Blob Storage** | Files, media | Pay per GB | Unlimited |
| **Table Storage** | NoSQL KV | Pay per GB | Unlimited |

**Recommendation**: Azure SQL + Redis for MVP

### 3. Networking & Security

**Network Architecture**:

```
┌─────────────────────────────────────┐
│    Azure Front Door / CDN           │  DDoS protection, geo-routing
├─────────────────────────────────────┤
│    Application Gateway              │  Load balancing, WAF
├─────────────────────────────────────┤
│    Virtual Network (VNet)           │  Isolated network
│    ├── Subnet 1: Web tier          │
│    ├── Subnet 2: App tier          │
│    └── Subnet 3: Data tier         │
├─────────────────────────────────────┤
│    Network Security Groups (NSG)    │  Firewall rules
└─────────────────────────────────────┘
```

**Security Layers**:

1. **DDoS Protection**: Azure Front Door
2. **Web Application Firewall (WAF)**: Application Gateway rules
3. **Network Isolation**: VNet + NSGs
4. **Authentication**: Azure AD / Entra ID
5. **Encryption**: HTTPS/TLS, data at rest

### 4. Storage Strategy

**Storage Tiers**:

```
Hot (0-30 days)      → Frequently accessed
Cool (30-90 days)    → Occasional access
Archive (90+ days)   → Compliance/backup
```

**Storage Account Configuration**:

```json
{
  "account_name": "myproject[stage]storage",
  "replication": "GRS",
  "access_tier": "Hot",
  "containers": {
    "application-files": "Hot",
    "backups": "Cool",
    "archive": "Archive"
  }
}
```

### 5. Monitoring & Logging

**Application Insights Setup**:

```
Application Insights
├── Traces (application logs)
├── Dependencies (external calls)
├── Exceptions (errors)
├── PageViews (frontend tracking)
├── CustomEvents (business metrics)
└── Performance (response times)
```

**Log Analytics Workspace**:
- Centralized logging from all Azure resources
- Kusto Query Language (KQL) for analysis
- Alerts on critical errors/thresholds
- Retention: 30 days default (configurable)

### 6. Cost Optimization

**Cost Considerations**:

| Resource | Estimated Cost | Optimization |
|----------|----------------|--------------|
| App Service (Standard) | $80-200/month | Use Shared/Basic for dev |
| Azure SQL (Standard) | $20-50/month | Use DTU-based |
| Storage (100 GB) | $2-5/month | Archive old data |
| Front Door | $0.60/million requests | Use for geo-distribution |
| Application Insights | $2.99/GB ingested | Sample logs in prod |

**Estimated MVP Cost**: $200-500/month

---

## Implementation Patterns

### Pattern 1: Serverless MVP (Minimal Ops)

```
┌─────────────────────────────┐
│   Azure Front Door          │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ↓             ↓
[Static Web App] [Functions]
(SPA hosting)     (APIs)
    │             │
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │             │
    ↓             ↓
[CosmosDB]   [Blob Storage]
(NoSQL)      (Files)
```

**Resources**:
- Static Web App: $5/month
- Functions: Pay per invocation (~$0.20/million)
- Cosmos DB: $25-100/month
- Total: $30-150/month

**Pros**: Minimal ops, auto-scaling, low cost at scale
**Cons**: Cold starts, limited local testing

### Pattern 2: App Service + Database (MVP Traditional)

```
┌─────────────────────────────┐
│   Azure Front Door          │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ↓             ↓
[App Service]  [Blob Storage]
(REST API)     (Files)
    │
    ├──────┬─────────┐
    │      │         │
    ↓      ↓         ↓
[Azure SQL] [Redis] [Key Vault]
(RDBMS)    (Cache)  (Secrets)
```

**Resources**:
- App Service (B2): $50-100/month
- Azure SQL (S1): $30-50/month
- Redis: $30-100/month
- Storage: $5-20/month
- Total: $115-270/month

**Pros**: Familiar patterns, good performance, manageable ops
**Cons**: Manual scaling, higher baseline cost

### Pattern 3: Kubernetes (Enterprise)

```
┌─────────────────────────────┐
│   Azure Front Door          │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ↓             ↓
[Application Gateway]
    │
    ↓
[Azure Kubernetes Service]
├── API Service (3 pods)
├── Worker Service (2 pods)
└── Background Jobs (1 pod)
    │
    ├──────┬──────────┬──────────┐
    │      │          │          │
    ↓      ↓          ↓          ↓
[Azure SQL] [Redis] [Storage] [Vault]
```

**Resources**:
- AKS Cluster: $70-200/month
- Azure SQL: $50-200/month
- Managed resources: $100+/month
- Total: $220-500+/month

**Pros**: Maximum flexibility, microservices, auto-scaling
**Cons**: Complexity, ops overhead

---

## Azure Resource Mapping

### Development Environment

```json
{
  "name": "dev",
  "resources": [
    {
      "type": "App Service",
      "name": "myapp-dev-as",
      "sku": "B1",
      "cost": "$50/month"
    },
    {
      "type": "Azure SQL",
      "name": "myapp-dev-db",
      "tier": "Basic",
      "cost": "$5/month"
    },
    {
      "type": "Storage Account",
      "name": "myappdevstg",
      "replication": "LRS",
      "cost": "$2/month"
    }
  ]
}
```

### Production Environment

```json
{
  "name": "prod",
  "resources": [
    {
      "type": "App Service",
      "name": "myapp-prod-as",
      "sku": "S2",
      "instances": 2,
      "cost": "$180/month"
    },
    {
      "type": "Azure Front Door",
      "name": "myapp-fd",
      "cost": "$0.60/million requests"
    },
    {
      "type": "Azure SQL",
      "name": "myapp-prod-db",
      "tier": "Standard",
      "cost": "$50/month"
    },
    {
      "type": "Application Insights",
      "name": "myapp-insights",
      "cost": "$2.99/GB"
    },
    {
      "type": "Key Vault",
      "name": "myapp-vault",
      "cost": "$0.6/month"
    }
  ]
}
```

---

## Scaling Strategy

### Horizontal Scaling (Add Instances)

**Auto-scale Rule**:
```json
{
  "target": "App Service",
  "metric": "CPU Percentage",
  "threshold": {
    "scale_out_at": 70,
    "scale_in_at": 30
  },
  "instance_limits": {
    "minimum": 2,
    "maximum": 10
  }
}
```

**Benefits**: Handles traffic spikes, cost-effective
**When**: CPU/Memory high, request backlog growing

### Vertical Scaling (Bigger Resources)

**Resource Upgrade Path**:
```
B1 (Basic) → B2 → S1 (Standard) → S2 → P1 (Premium)
```

**Benefits**: Better performance, larger workloads
**When**: Single instance at capacity, better isolation needed

### Database Scaling

**Azure SQL Scaling Options**:
```
Basic (5 DTU)    → S0 (10 DTU)    → S1 (20 DTU)
→ S2 (50 DTU)    → S3 (100 DTU)   → P1 (125 DTU)
```

**When to Scale**:
- CPU > 80% sustained
- Storage > 80% capacity
- Memory pressure increasing

---

## Output Artifacts

### 1. Azure Resource Plan

**File**: `ProjectPlan/02-Architecture/Azure-Infrastructure.md`

```markdown
# Azure Infrastructure Plan

## Environment: Development

### Compute
- App Service: B1 (Basic)
- Cost: $50/month

### Database
- Azure SQL: Basic tier
- Cost: $5/month

### Storage
- Blob Storage: Standard LRS
- Cost: $2/month

### Monitoring
- Application Insights: Shared
- Cost: Included in premium

### Total Monthly Cost: ~$60

## Environment: Production

### Compute
- App Service: S2 (Standard, 2 instances)
- Auto-scale: 2-10 instances
- Cost: $180-900/month

### Database
- Azure SQL: Standard S1
- Geo-replication: Enabled
- Cost: $50/month

### Networking
- Front Door: Standard
- Cost: $0.60/million requests

### Monitoring
- Application Insights: Pay-as-you-go
- Cost: $2.99/GB ingested

### Total Monthly Cost: ~$230-950
```

### 2. Scaling Strategy Document

**File**: `ProjectPlan/02-Architecture/Scaling-Strategy.md`

```markdown
# Scaling Strategy

## Application Scaling
- Horizontal: App Service auto-scale (2-10 instances)
- Vertical: Upgrade to S3 if single instance at capacity
- Trigger: CPU > 70% for 5 minutes

## Database Scaling
- DTU auto-increase: S0 → S1 → S2 → S3
- Monitor: CPU%, storage%, connections
- Backup strategy: Daily, 30-day retention

## Storage Scaling
- Archive old data to Archive tier after 90 days
- Monitor: Space usage, storage account limits
- Cleanup: Delete old logs after 12 months

## Cost Control
- Budget alert at $300/month
- Monthly cost review
- Optimize underutilized resources
```

### 3. Cost Estimation

**File**: `ProjectPlan/02-Architecture/Cost-Estimation.md`

```markdown
# Cost Estimation

## Monthly Breakdown

| Service | Dev | Prod | Notes |
|---------|-----|------|-------|
| App Service | $50 | $180-900 | 2-10 instances prod |
| Database | $5-50 | $50 | Geo-replication prod |
| Storage | $2 | $5 | More usage in prod |
| Networking | Free | $5 | Front Door requests |
| Monitoring | Free | $20 | Insights data |
| **Total** | **$57-107** | **$260-975** |

## Annual Cost
- Development: ~$700
- Production: ~$3,000-12,000
- **Total First Year**: ~$3,700-12,700
```

---

## Handoff to @bicep-specialist

**Output Contract**:
```json
{
  "azure_resource_plan_created": true,
  "resources_identified": 12,
  "estimated_monthly_cost": "$230-950",
  "scaling_strategy": "Auto-scale 2-10 instances",
  "environments": ["dev", "staging", "production"],
  "resource_groups": ["myapp-dev-rg", "myapp-prod-rg"],
  "computed_services": ["App Service", "Functions"],
  "database_choice": "Azure SQL + Redis",
  "networking": "Front Door + Application Gateway",
  "monitoring": "Application Insights + Log Analytics"
}
```

**Next Step**: @bicep-specialist converts this resource plan into Bicep IaC modules

---

## Filename: `@azure-architect.agent.md`
