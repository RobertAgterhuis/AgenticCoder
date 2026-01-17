# Phase 6: Azure Ecosystem

**Duration:** 2 weken  
**Status:** ✅ COMPLETE  
**Completed:** 2026-01-17  
**Priority:** 🔴 Critical

---

## 🎯 Phase Objective

Completeren van het Azure ecosysteem met essentiële services voor enterprise-grade oplossingen: Identity, Security, NoSQL, Storage, Networking, en Monitoring.

---

## 📊 Azure Ecosystem Coverage

| Service Category | Azure Service | Agent | Skill |
|------------------|---------------|-------|-------|
| **Identity** | Entra ID (Azure AD) | @entra-id-specialist | entra-id-patterns |
| **Security** | Key Vault | @keyvault-specialist | keyvault-patterns |
| **NoSQL** | Cosmos DB | @cosmos-db-specialist | cosmos-db-patterns |
| **Storage** | Blob/Table/Queue | @storage-specialist | azure-storage-patterns |
| **Networking** | VNet/NSG/Private Endpoints | @networking-specialist | azure-networking-patterns |
| **Monitoring** | App Insights/Log Analytics | @monitoring-specialist | azure-monitoring-patterns |

---

## 📋 Tasks

### Task 6.1: @entra-id-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Microsoft Entra ID (voorheen Azure AD) specialist voor identity management, authentication, en authorization.

**Agent Definition:**

```markdown
# @entra-id-specialist Agent

**Agent ID**: `@entra-id-specialist`  
**Phase**: 11  
**Purpose**: Design and implement identity and access management  
**Triggers From**: @azure-architect, @backend-specialist  
**Hands Off To**: @bicep-specialist, @devops-specialist

---

## Core Responsibilities

### 1. Authentication Patterns
- OAuth 2.0 / OpenID Connect
- MSAL.js (frontend)
- MSAL.NET / MSAL Python (backend)
- Service Principal authentication
- Managed Identity
- Certificate-based auth

### 2. Authorization Patterns
- Role-Based Access Control (RBAC)
- App Roles
- Groups and Claims
- Conditional Access policies
- Privileged Identity Management (PIM)

### 3. Application Registration
- Single-tenant vs Multi-tenant
- API permissions (delegated vs application)
- Redirect URIs configuration
- Token configuration
- Certificates & secrets management

### 4. Enterprise Scenarios
- Single Sign-On (SSO)
- B2B collaboration
- B2C customer identity
- Hybrid identity (AD Connect)
```

**Authentication Flow Patterns:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (SPA)                                │
│                                                                  │
│  1. User clicks "Login"                                         │
│  2. MSAL.js redirects to Entra ID                               │
│  3. User authenticates                                          │
│  4. Entra ID returns tokens                                     │
│  5. Frontend stores tokens, calls API with Bearer token         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Bearer Token
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API                                   │
│                                                                  │
│  1. Validate JWT token                                          │
│  2. Extract claims (roles, groups, custom)                      │
│  3. Authorize based on claims                                   │
│  4. Process request                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Code Examples:**

```typescript
// Frontend - MSAL.js Configuration
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Login
const loginRequest = {
  scopes: ['api://my-api/.default'],
};

await msalInstance.loginPopup(loginRequest);

// Get token for API call
const tokenResponse = await msalInstance.acquireTokenSilent({
  scopes: ['api://my-api/.default'],
  account: msalInstance.getAllAccounts()[0],
});

// API call with token
const response = await fetch('/api/data', {
  headers: {
    Authorization: `Bearer ${tokenResponse.accessToken}`,
  },
});
```

```typescript
// Backend - JWT Validation (Express)
import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

const jwtCheck = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
  }),
  audience: process.env.API_AUDIENCE,
  issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
  algorithms: ['RS256'],
});

// Role-based authorization middleware
const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = req.auth?.roles || [];
    if (!roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

app.get('/api/admin', jwtCheck, requireRole('Admin'), adminController);
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] OAuth 2.0 / OIDC flows documented
- [ ] MSAL integration patterns
- [ ] RBAC implementation patterns
- [ ] Bicep templates for app registration

**Files to Create:**
- `.github/agents/@entra-id-specialist.agent.md`
- `.github/schemas/entra-id-specialist.input.schema.json`
- `.github/schemas/entra-id-specialist.output.schema.json`

---

### Task 6.2: @keyvault-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 1.5 dagen

**Description:**  
Azure Key Vault specialist voor secrets, keys, en certificates management.

**Agent Definition:**

```markdown
# @keyvault-specialist Agent

**Agent ID**: `@keyvault-specialist`  
**Phase**: 11  
**Purpose**: Design and implement secrets and key management  
**Triggers From**: @azure-architect, @devops-specialist  
**Hands Off To**: @bicep-specialist

---

## Core Responsibilities

### 1. Secrets Management
- Application secrets
- Connection strings
- API keys
- Secret rotation
- Versioning

### 2. Key Management
- Encryption keys
- Signing keys
- Key rotation
- RSA / EC key types
- Hardware Security Modules (HSM)

### 3. Certificate Management
- SSL/TLS certificates
- Client certificates
- Certificate auto-renewal
- Integration with App Service

### 4. Access Patterns
- Managed Identity access
- Service Principal access
- Access policies vs RBAC
- Private endpoints
```

**Access Patterns:**

```
┌─────────────────┐     Managed Identity      ┌─────────────────┐
│   App Service   │ ─────────────────────────▶│    Key Vault    │
│   (or ACA/AKS)  │    (No credentials!)      │                 │
└─────────────────┘                           │  - Secrets      │
                                              │  - Keys         │
┌─────────────────┐     Service Principal     │  - Certificates │
│  GitHub Actions │ ─────────────────────────▶│                 │
│                 │    (OIDC Federation)      └─────────────────┘
└─────────────────┘
```

**Code Examples:**

```typescript
// Node.js - Using Managed Identity
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const credential = new DefaultAzureCredential();
const client = new SecretClient(
  `https://${keyVaultName}.vault.azure.net`,
  credential
);

// Get secret
const secret = await client.getSecret('database-connection-string');
const connectionString = secret.value;

// Set secret with expiration
await client.setSecret('api-key', 'my-secret-value', {
  expiresOn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  tags: { environment: 'production' },
});
```

```bicep
// Bicep - Key Vault with Private Endpoint
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

// RBAC assignment for Managed Identity
resource keyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  name: guid(keyVault.id, appService.id, 'Key Vault Secrets User')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: appService.identity.principalId
    principalType: 'ServicePrincipal'
  }
}
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Managed Identity patterns
- [ ] Secret rotation patterns
- [ ] Private endpoint configuration
- [ ] Bicep templates

**Files to Create:**
- `.github/agents/@keyvault-specialist.agent.md`
- `.github/schemas/keyvault-specialist.input.schema.json`
- `.github/schemas/keyvault-specialist.output.schema.json`

---

### Task 6.3: @cosmos-db-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Azure Cosmos DB specialist voor globally distributed NoSQL databases.

**Agent Definition:**

```markdown
# @cosmos-db-specialist Agent

**Agent ID**: `@cosmos-db-specialist`  
**Phase**: 15  
**Purpose**: Design and implement Cosmos DB solutions  
**Triggers From**: @database-specialist, @azure-architect  
**Hands Off To**: @bicep-specialist, @backend-specialist

---

## Core Responsibilities

### 1. Data Modeling
- Document design
- Partition key selection
- Denormalization strategies
- Reference vs Embedding
- Change feed patterns

### 2. API Selection
- NoSQL (Core) API
- MongoDB API
- PostgreSQL API
- Cassandra API
- Gremlin (Graph) API
- Table API

### 3. Performance Optimization
- Request Units (RU) planning
- Indexing policies
- Query optimization
- Autoscale vs Provisioned throughput
- Hierarchical partition keys

### 4. Global Distribution
- Multi-region writes
- Consistency levels
- Conflict resolution
- Failover priorities
```

**Partition Key Strategy:**

```
Document: Order
─────────────────────────────────────────────────────────
Good Partition Keys:          Bad Partition Keys:
✅ customerId                  ❌ orderId (too granular)
✅ tenantId                    ❌ status (low cardinality)
✅ region + date               ❌ createdDate (hot partition)

Hierarchical Partition Key Example:
/tenantId/customerId/year
```

**Code Examples:**

```typescript
// Cosmos DB Client Setup
import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
  // Or use Managed Identity:
  // aadCredentials: new DefaultAzureCredential()
});

const database = client.database('mydb');
const container = database.container('orders');

// Query with partition key
const { resources: orders } = await container.items
  .query({
    query: 'SELECT * FROM c WHERE c.customerId = @customerId AND c.status = @status',
    parameters: [
      { name: '@customerId', value: customerId },
      { name: '@status', value: 'pending' },
    ],
  }, {
    partitionKey: customerId, // Critical for performance!
  })
  .fetchAll();

// Transactional batch (same partition key)
const batch = container.items.batch(customerId);
batch.create({ id: '1', customerId, type: 'order', ... });
batch.create({ id: '2', customerId, type: 'orderItem', ... });
await batch.execute();
```

**Consistency Levels:**

| Level | Latency | Availability | Consistency |
|-------|---------|--------------|-------------|
| Strong | Highest | Lower | Perfect |
| Bounded Staleness | High | Medium | Good |
| Session | Medium | High | Per session |
| Consistent Prefix | Low | High | Ordered |
| Eventual | Lowest | Highest | Eventually |

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Partition key patterns
- [ ] Consistency level guidance
- [ ] Change feed patterns
- [ ] Bicep templates

**Files to Create:**
- `.github/agents/@cosmos-db-specialist.agent.md`
- `.github/schemas/cosmos-db-specialist.input.schema.json`
- `.github/schemas/cosmos-db-specialist.output.schema.json`

---

### Task 6.4: @storage-specialist Agent

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
Azure Storage specialist voor Blob, Table, Queue, en File storage.

**Agent Definition:**

```markdown
# @storage-specialist Agent

**Agent ID**: `@storage-specialist`  
**Phase**: 15  
**Purpose**: Design and implement Azure Storage solutions  
**Triggers From**: @azure-architect, @backend-specialist  
**Hands Off To**: @bicep-specialist

---

## Core Responsibilities

### 1. Blob Storage
- Container organization
- Access tiers (Hot/Cool/Archive)
- Lifecycle management
- Immutable storage
- Soft delete & versioning

### 2. Security
- Shared Access Signatures (SAS)
- Managed Identity access
- Private endpoints
- Encryption (SSE, CMK)
- Network rules

### 3. Performance
- Premium vs Standard
- Block vs Page vs Append blobs
- Parallel upload/download
- CDN integration

### 4. Data Management
- Blob indexing
- Blob inventory
- Object replication
- Data Lake Storage Gen2
```

**Storage Patterns:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Storage Account                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Blob       │  │   Queue      │  │   Table      │      │
│  │   Storage    │  │   Storage    │  │   Storage    │      │
│  │              │  │              │  │              │      │
│  │ - images/    │  │ - orders     │  │ - logs       │      │
│  │ - documents/ │  │ - emails     │  │ - sessions   │      │
│  │ - backups/   │  │ - tasks      │  │ - cache      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Code Examples:**

```typescript
// Blob Storage with Managed Identity
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new DefaultAzureCredential()
);

const containerClient = blobServiceClient.getContainerClient('uploads');

// Upload with metadata
const blockBlobClient = containerClient.getBlockBlobClient(`${userId}/${filename}`);
await blockBlobClient.uploadData(buffer, {
  blobHTTPHeaders: { blobContentType: contentType },
  metadata: { uploadedBy: userId, originalName: filename },
  tags: { department: 'marketing' },
});

// Generate SAS URL for download (time-limited)
const sasUrl = await blockBlobClient.generateSasUrl({
  permissions: BlobSASPermissions.parse('r'),
  expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
});
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Blob patterns
- [ ] SAS token patterns
- [ ] Lifecycle management
- [ ] Bicep templates

**Files to Create:**
- `.github/agents/@storage-specialist.agent.md`
- `.github/schemas/storage-specialist.input.schema.json`
- `.github/schemas/storage-specialist.output.schema.json`

---

### Task 6.5: @networking-specialist Agent

**Priority:** 🟡 High  
**Estimated:** 2 dagen

**Description:**  
Azure Networking specialist voor VNets, NSGs, Private Endpoints, en network security.

**Agent Definition:**

```markdown
# @networking-specialist Agent

**Agent ID**: `@networking-specialist`  
**Phase**: 8  
**Purpose**: Design and implement Azure networking solutions  
**Triggers From**: @azure-architect  
**Hands Off To**: @bicep-specialist

---

## Core Responsibilities

### 1. Virtual Networks
- VNet design and addressing
- Subnet segmentation
- VNet peering
- Hub-spoke topology
- Service endpoints

### 2. Security
- Network Security Groups (NSG)
- Application Security Groups (ASG)
- Azure Firewall
- DDoS Protection
- Web Application Firewall (WAF)

### 3. Private Connectivity
- Private Endpoints
- Private Link
- Service Endpoints
- VPN Gateway
- ExpressRoute

### 4. Load Balancing
- Azure Load Balancer
- Application Gateway
- Front Door
- Traffic Manager
```

**Network Architecture Pattern:**

```
                    ┌─────────────────────────────┐
                    │      Azure Front Door       │
                    │   (Global Load Balancing)   │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │    Application Gateway      │
                    │        (WAF + SSL)          │
                    └─────────────┬───────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│                         Virtual Network                            │
│                        (10.0.0.0/16)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   Web Subnet    │  │   App Subnet    │  │   Data Subnet   │   │
│  │  10.0.1.0/24    │  │  10.0.2.0/24    │  │  10.0.3.0/24    │   │
│  │                 │  │                 │  │                 │   │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │   │
│  │  │App Service│  │  │  │ Container │  │  │  │ Private   │  │   │
│  │  │(with VNet │  │  │  │   Apps    │  │  │  │ Endpoint  │  │   │
│  │  │integration)│  │  │  │           │  │  │  │ (SQL/KV)  │  │   │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │   │
│  │       NSG       │  │       NSG       │  │       NSG       │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

**Private Endpoint Pattern:**

```bicep
// Private Endpoint for SQL Database
resource sqlPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'pe-${sqlServerName}'
  location: location
  properties: {
    subnet: {
      id: dataSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: 'sqlConnection'
        properties: {
          privateLinkServiceId: sqlServer.id
          groupIds: ['sqlServer']
        }
      }
    ]
  }
}

// Private DNS Zone
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink${environment().suffixes.sqlServerHostname}'
  location: 'global'
}

// Link DNS Zone to VNet
resource privateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'link-${vnetName}'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] VNet design patterns
- [ ] NSG rules patterns
- [ ] Private endpoint patterns
- [ ] Hub-spoke topology

**Files to Create:**
- `.github/agents/@networking-specialist.agent.md`
- `.github/schemas/networking-specialist.input.schema.json`
- `.github/schemas/networking-specialist.output.schema.json`

---

### Task 6.6: @monitoring-specialist Agent

**Priority:** 🟡 High  
**Estimated:** 2 dagen

**Description:**  
Azure Monitoring specialist voor Application Insights, Log Analytics, en alerting.

**Agent Definition:**

```markdown
# @monitoring-specialist Agent

**Agent ID**: `@monitoring-specialist`  
**Phase**: 16  
**Purpose**: Design and implement monitoring and observability  
**Triggers From**: @azure-architect, @devops-specialist  
**Hands Off To**: @bicep-specialist

---

## Core Responsibilities

### 1. Application Insights
- Telemetry collection
- Custom metrics
- Distributed tracing
- Live metrics stream
- Availability tests

### 2. Log Analytics
- KQL queries
- Log retention
- Workspaces design
- Data collection rules
- Custom tables

### 3. Alerting
- Metric alerts
- Log alerts
- Smart detection
- Action groups
- Alert processing rules

### 4. Dashboards
- Azure Dashboards
- Workbooks
- Power BI integration
- Grafana integration
```

**Monitoring Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Insights                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Requests   │  │Dependencies│  │ Exceptions │                │
│  │ Traces     │  │ Metrics    │  │ Events     │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Log Analytics Workspace                     │   │
│  │                                                          │   │
│  │  KQL: requests | where success == false                  │   │
│  │       | summarize count() by bin(timestamp, 5m)         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│            ┌─────────────┼─────────────┐                        │
│            ▼             ▼             ▼                        │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│     │  Alerts  │  │Workbooks │  │Dashboards│                   │
│     └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

**Code Examples:**

```typescript
// Application Insights SDK
import { TelemetryClient } from 'applicationinsights';

const client = new TelemetryClient(process.env.APPINSIGHTS_CONNECTION_STRING);

// Track custom event
client.trackEvent({
  name: 'OrderPlaced',
  properties: {
    orderId: order.id,
    customerId: order.customerId,
    itemCount: order.items.length,
  },
  measurements: {
    orderTotal: order.total,
  },
});

// Track custom metric
client.trackMetric({
  name: 'OrderProcessingTime',
  value: processingTimeMs,
  properties: { region: 'EU' },
});

// Track dependency
client.trackDependency({
  name: 'PaymentGateway',
  dependencyTypeName: 'HTTP',
  data: 'POST /api/payments',
  duration: responseTimeMs,
  success: response.ok,
  resultCode: response.status.toString(),
});
```

**Alert Configuration (Bicep):**

```bicep
resource failureRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'High Failure Rate'
  location: 'global'
  properties: {
    severity: 1
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'FailedRequests'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Application Insights patterns
- [ ] KQL query patterns
- [ ] Alert configuration patterns
- [ ] Dashboard/Workbook patterns

**Files to Create:**
- `.github/agents/@monitoring-specialist.agent.md`
- `.github/schemas/monitoring-specialist.input.schema.json`
- `.github/schemas/monitoring-specialist.output.schema.json`

---

## 📋 Skills

### Task 6.7: entra-id-patterns Skill

**Topics:**
- OAuth 2.0 flows (Authorization Code, Client Credentials, On-Behalf-Of)
- MSAL configuration patterns
- Token caching strategies
- Role-based authorization
- Multi-tenant patterns

### Task 6.8: keyvault-patterns Skill

**Topics:**
- Secret management patterns
- Key rotation strategies
- Certificate auto-renewal
- Managed Identity integration
- Disaster recovery

### Task 6.9: cosmos-db-patterns Skill

**Topics:**
- Partition key strategies
- Data modeling patterns
- Change feed processing
- Consistency level selection
- Cost optimization

### Task 6.10: azure-storage-patterns Skill

**Topics:**
- Blob organization patterns
- SAS token best practices
- Lifecycle policies
- CDN integration
- Event Grid triggers

### Task 6.11: azure-networking-patterns Skill

**Topics:**
- Hub-spoke topology
- NSG rule design
- Private endpoint patterns
- DNS resolution
- Network segmentation

### Task 6.12: azure-monitoring-patterns Skill

**Topics:**
- Telemetry best practices
- KQL query patterns
- Alert design patterns
- Dashboard design
- Cost management

---

## 📁 Files Created This Phase

```
.github/agents/
├── @entra-id-specialist.agent.md
├── @keyvault-specialist.agent.md
├── @cosmos-db-specialist.agent.md
├── @storage-specialist.agent.md
├── @networking-specialist.agent.md
└── @monitoring-specialist.agent.md

.github/skills/
├── entra-id-patterns.skill.md
├── keyvault-patterns.skill.md
├── cosmos-db-patterns.skill.md
├── azure-storage-patterns.skill.md
├── azure-networking-patterns.skill.md
└── azure-monitoring-patterns.skill.md

.github/schemas/
├── entra-id-specialist.input.schema.json
├── entra-id-specialist.output.schema.json
├── keyvault-specialist.input.schema.json
├── keyvault-specialist.output.schema.json
├── cosmos-db-specialist.input.schema.json
├── cosmos-db-specialist.output.schema.json
├── storage-specialist.input.schema.json
├── storage-specialist.output.schema.json
├── networking-specialist.input.schema.json
├── networking-specialist.output.schema.json
├── monitoring-specialist.input.schema.json
└── monitoring-specialist.output.schema.json
```

---

## ✅ Phase Completion Checklist

- [ ] @entra-id-specialist agent complete
- [ ] @keyvault-specialist agent complete
- [ ] @cosmos-db-specialist agent complete
- [ ] @storage-specialist agent complete
- [ ] @networking-specialist agent complete
- [ ] @monitoring-specialist agent complete
- [ ] All 6 skills complete
- [ ] All schemas defined
- [ ] Integration with @azure-architect
- [ ] Bicep templates for all services

---

## 🔗 Navigation

← [05-PHASE-BACKEND.md](05-PHASE-BACKEND.md) | → [07-PHASE-INTEGRATION.md](07-PHASE-INTEGRATION.md)
