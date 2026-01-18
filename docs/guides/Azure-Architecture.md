# Azure Architecture Guide

Best practices for designing Azure solutions with AgenticCoder.

## Overview

AgenticCoder generates production-ready Azure architectures following:
- Azure Well-Architected Framework
- Cloud Adoption Framework
- Azure Verified Modules (AVM)
- Enterprise-grade patterns

## Architecture Agents

| Agent | Role |
|-------|------|
| `azure-architect` | Overall Azure design |
| `bicep-specialist` | Infrastructure as Code |
| `security-architect` | Security design |
| `networking-specialist` | Network architecture |
| `database-specialist` | Data tier design |
| `devops-specialist` | CI/CD pipelines |

## Well-Architected Framework

### Reliability

```yaml
# Phase 7-10: Infrastructure Design

reliability:
  # High availability
  availability:
    zones: 3
    regions: 2
    
  # Disaster recovery
  disasterRecovery:
    rpo: "15 minutes"
    rto: "1 hour"
    strategy: "active-passive"
    
  # Resilience
  resilience:
    retryPolicy: "exponential"
    circuitBreaker: true
    healthChecks: true
```

**Generated Patterns:**
- Multi-zone deployments
- Cross-region failover
- Health probes and auto-healing
- Retry and circuit breaker patterns

### Security

```yaml
security:
  # Identity
  identity:
    provider: "Entra ID"
    mfa: true
    conditionalAccess: true
    
  # Network security
  network:
    waf: true
    ddosProtection: "Standard"
    privateEndpoints: true
    
  # Data protection
  data:
    encryptionAtRest: true
    encryptionInTransit: true
    keyManagement: "Key Vault"
    
  # Compliance
  compliance:
    - SOC2
    - GDPR
    - HIPAA
```

**Generated Components:**
- Managed identities
- Private endpoints
- Key Vault integration
- NSGs and ASGs
- WAF policies

### Cost Optimization

```yaml
costOptimization:
  # Resource sizing
  sizing:
    strategy: "right-size"
    reviewInterval: "monthly"
    
  # Scaling
  scaling:
    type: "autoscale"
    scheduleBasedScaling: true
    
  # Reservations
  reservations:
    compute: "1-year"
    database: "3-year"
    
  # Governance
  governance:
    budgetAlerts: true
    resourceTags: true
```

**Generated Outputs:**
- Auto-scaling rules
- Budget alerts
- Cost analysis queries
- Reserved capacity recommendations

### Performance Efficiency

```yaml
performance:
  # Caching
  caching:
    cdn: true
    redis: true
    outputCaching: true
    
  # Database
  database:
    readReplicas: 2
    connectionPooling: true
    
  # Compute
  compute:
    tier: "Premium"
    burstable: false
```

### Operational Excellence

```yaml
operations:
  # Monitoring
  monitoring:
    applicationInsights: true
    logAnalytics: true
    alerts: true
    dashboards: true
    
  # Automation
  automation:
    iac: "Bicep"
    cicd: "GitHub Actions"
    configManagement: "App Configuration"
    
  # Documentation
  documentation:
    runbooks: true
    architectureDiagrams: true
```

## Reference Architectures

### Web Application (App Service)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Azure Front Door                             │
│                    (CDN + WAF)                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     App Service                                 │
│                  (Premium v3)                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Slot 1    │  │   Slot 2    │  │  Staging    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└──────────┬─────────────────┬─────────────────┬──────────────────┘
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  Key Vault  │   │    SQL      │   │   Storage   │
    │ (Secrets)   │   │ (Database)  │   │   (Files)   │
    └─────────────┘   └─────────────┘   └─────────────┘
```

**Bicep Module:**

```bicep
// main.bicep

targetScope = 'subscription'

param location string = 'westeurope'
param environment string = 'prod'
param projectName string

// Resource Group
module rg 'br/public:avm/res/resources/resource-group:0.4.0' = {
  name: 'rg-${projectName}-${environment}'
  params: {
    name: 'rg-${projectName}-${environment}'
    location: location
  }
}

// App Service Plan
module asp 'br/public:avm/res/web/serverfarm:0.4.0' = {
  name: 'asp-${projectName}'
  scope: resourceGroup(rg.outputs.name)
  params: {
    name: 'asp-${projectName}'
    location: location
    sku: {
      name: 'P1v3'
      tier: 'PremiumV3'
    }
  }
}

// Web App
module app 'br/public:avm/res/web/site:0.11.0' = {
  name: 'app-${projectName}'
  scope: resourceGroup(rg.outputs.name)
  params: {
    name: 'app-${projectName}'
    location: location
    kind: 'app'
    serverFarmResourceId: asp.outputs.resourceId
    managedIdentities: {
      systemAssigned: true
    }
  }
}
```

### Microservices (AKS)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Front Door                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                 Azure Kubernetes Service                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Ingress Controller                      │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────┬───────────┼───────────┬─────────────┐        │
│  │   Service   │   Service  │   Service  │   Service   │        │
│  │      A      │      B     │      C     │      D      │        │
│  └──────┬──────┴─────┬──────┴──────┬─────┴──────┬──────┘        │
│         │            │             │            │                │
│  ┌──────▼────────────▼─────────────▼────────────▼──────┐       │
│  │              Azure Service Bus                       │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
           │            │             │            │
    ┌──────▼──────┐  ┌──▼─────┐  ┌───▼────┐  ┌────▼────┐
    │ PostgreSQL  │  │ Redis  │  │Cosmos DB│  │ Storage │
    └─────────────┘  └────────┘  └────────┘  └─────────┘
```

### Event-Driven

```
┌─────────────────────────────────────────────────────────────────┐
│                    Event Producers                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Web App │  │  IoT    │  │ Mobile  │  │  API    │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     Event Grid                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
│   Function    │  │  Logic App    │  │  Event Hub    │
│  (Process)    │  │  (Workflow)   │  │  (Stream)     │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┴──────┬───────────┘
                                  │
                        ┌─────────▼─────────┐
                        │    Cosmos DB      │
                        │   (Event Store)   │
                        └───────────────────┘
```

## Azure Verified Modules (AVM)

AgenticCoder preferentially uses AVM modules:

### Module Discovery

```typescript
// Bicep AVM Resolver finds optimal modules

const resolver = new BicepAVMResolver();

const modules = await resolver.resolveRequirements({
  compute: ['app-service', 'function-app'],
  data: ['sql-database', 'cosmos-db'],
  security: ['key-vault', 'managed-identity']
});

// Returns AVM module references
// br/public:avm/res/web/site:0.11.0
// br/public:avm/res/document-db/database-account:0.8.0
```

### Common AVM Modules

| Resource | Module |
|----------|--------|
| App Service | `br/public:avm/res/web/site` |
| Function App | `br/public:avm/res/web/site` (kind: functionapp) |
| SQL Database | `br/public:avm/res/sql/server` |
| Cosmos DB | `br/public:avm/res/document-db/database-account` |
| Key Vault | `br/public:avm/res/key-vault/vault` |
| Storage | `br/public:avm/res/storage/storage-account` |
| AKS | `br/public:avm/res/container-service/managed-cluster` |
| Virtual Network | `br/public:avm/res/network/virtual-network` |

## Network Architecture

### Hub-Spoke Pattern

```bicep
// Hub Virtual Network
module hubVnet 'br/public:avm/res/network/virtual-network:0.5.0' = {
  name: 'vnet-hub'
  params: {
    name: 'vnet-hub'
    addressPrefixes: ['10.0.0.0/16']
    subnets: [
      {
        name: 'AzureFirewallSubnet'
        addressPrefix: '10.0.1.0/24'
      }
      {
        name: 'GatewaySubnet'
        addressPrefix: '10.0.2.0/24'
      }
    ]
  }
}

// Spoke Virtual Network
module spokeVnet 'br/public:avm/res/network/virtual-network:0.5.0' = {
  name: 'vnet-spoke-${environment}'
  params: {
    name: 'vnet-spoke-${environment}'
    addressPrefixes: ['10.1.0.0/16']
    peerings: [
      {
        remoteVirtualNetworkResourceId: hubVnet.outputs.resourceId
        allowForwardedTraffic: true
        allowGatewayTransit: false
        useRemoteGateways: true
      }
    ]
  }
}
```

### Private Endpoints

```bicep
// Private Endpoint for SQL Server
module sqlPrivateEndpoint 'br/public:avm/res/network/private-endpoint:0.8.0' = {
  name: 'pe-sql'
  params: {
    name: 'pe-sql-${projectName}'
    subnetResourceId: spokeVnet.outputs.subnetResourceIds[0]
    privateLinkServiceConnections: [
      {
        name: 'sql'
        privateLinkServiceId: sqlServer.outputs.resourceId
        groupIds: ['sqlServer']
      }
    ]
    privateDnsZoneGroupName: 'sql'
    privateDnsZoneResourceIds: [
      privateDnsZone.outputs.resourceId
    ]
  }
}
```

## Security Patterns

### Zero Trust Architecture

```yaml
security:
  zeroTrust:
    # Identity
    - All access requires authentication
    - Least privilege access
    - JIT access for admin
    
    # Network
    - Network segmentation
    - Private endpoints
    - No public IPs on data tier
    
    # Data
    - Encryption everywhere
    - Classification and labeling
    - DLP policies
```

### Key Vault Integration

```bicep
// Key Vault with RBAC
module keyVault 'br/public:avm/res/key-vault/vault:0.9.0' = {
  name: 'kv-${projectName}'
  params: {
    name: 'kv-${projectName}'
    enableRbacAuthorization: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 90
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
    roleAssignments: [
      {
        principalId: app.outputs.systemAssignedMIPrincipalId
        roleDefinitionIdOrName: 'Key Vault Secrets User'
      }
    ]
  }
}
```

## DevOps Integration

### GitHub Actions Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy to Azure

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          
      - name: Deploy Bicep
        uses: azure/arm-deploy@v2
        with:
          scope: subscription
          region: westeurope
          template: ./infra/main.bicep
          parameters: ./infra/parameters/prod.bicepparam
```

## Monitoring Strategy

### Application Insights

```bicep
module appInsights 'br/public:avm/res/insights/component:0.4.0' = {
  name: 'appi-${projectName}'
  params: {
    name: 'appi-${projectName}'
    workspaceResourceId: logAnalytics.outputs.resourceId
    kind: 'web'
  }
}
```

### Alerts

```bicep
// Response time alert
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-response-time'
  location: 'global'
  properties: {
    severity: 2
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          threshold: 2000
          timeAggregation: 'Average'
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

## Cost Management

### Budget Setup

```bicep
resource budget 'Microsoft.Consumption/budgets@2023-05-01' = {
  name: 'budget-${projectName}'
  properties: {
    category: 'Cost'
    amount: 5000
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: '2024-01-01'
    }
    notifications: {
      'Actual_80': {
        enabled: true
        threshold: 80
        operator: 'GreaterThan'
        contactEmails: [notificationEmail]
      }
    }
  }
}
```

## Next Steps

- [Bicep AVM Resolver](../engine/Bicep-AVM-Resolver) - Module discovery
- [Scenarios](../agents/Scenarios) - Azure-ready templates
- [Troubleshooting](Troubleshooting) - Common issues
