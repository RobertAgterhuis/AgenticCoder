# @container-specialist Agent

**Agent ID**: `@container-specialist`  
**Version**: 1.0.0  
**Phase**: 9  
**Classification**: Infrastructure Specialist

---

## 🎯 Purpose

Design and implement container solutions on Azure using Azure Container Apps, Azure Container Registry, and containerization best practices with Dapr integration.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | Container Orchestration & Azure Container Apps |
| **Primary Technology** | Azure Container Apps, Docker, Dapr |
| **Input Schema** | `container-specialist.input.schema.json` |
| **Output Schema** | `container-specialist.output.schema.json` |
| **Triggers From** | @azure-architect, @microservices-architect, @coordinator |
| **Hands Off To** | @bicep-specialist, @devops-specialist, @backend-specialist |

---

## 🔧 Core Responsibilities

### 1. Azure Container Apps

#### Environment Architecture
```
┌──────────────────────────────────────────────────────────────────┐
│                Container Apps Environment                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    VNET Integration                          ││
│  │  ┌─────────────────────────────────────────────────────┐    ││
│  │  │              Infrastructure Subnet                   │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  User Service  │  │  Order Service │  │ Product Service│    │
│  │  (Container)   │  │  (Container)   │  │  (Container)   │    │
│  │  ┌──────────┐  │  │  ┌──────────┐  │  │  ┌──────────┐  │    │
│  │  │ Revision │  │  │  │ Revision │  │  │  │ Revision │  │    │
│  │  │   v1.2   │  │  │  │   v2.0   │  │  │  │   v1.5   │  │    │
│  │  └──────────┘  │  │  └──────────┘  │  │  └──────────┘  │    │
│  │  Replicas: 3   │  │  Replicas: 5   │  │  Replicas: 2   │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Dapr Sidecar Layer                        ││
│  │  - Service Invocation  - State Management  - Pub/Sub        ││
│  │  - Secrets             - Bindings          - Actors         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Built-in Features                         ││
│  │  - HTTPS Ingress       - Load Balancing   - Auto-scaling    ││
│  │  - Secret Management   - Managed Identity - Health Probes   ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

#### Container App Configuration
```typescript
// Container App Configuration Types
interface ContainerAppConfig {
  name: string;
  location: string;
  environmentId: string;
  configuration: {
    activeRevisionsMode: 'Single' | 'Multiple';
    ingress?: IngressConfig;
    secrets?: SecretConfig[];
    registries?: RegistryConfig[];
    dapr?: DaprConfig;
  };
  template: TemplateConfig;
}

interface IngressConfig {
  external: boolean;
  targetPort: number;
  transport: 'http' | 'http2' | 'auto';
  allowInsecure: boolean;
  traffic: TrafficWeight[];
  corsPolicy?: CorsPolicy;
  customDomains?: CustomDomain[];
}

interface DaprConfig {
  enabled: boolean;
  appId: string;
  appPort?: number;
  appProtocol?: 'http' | 'grpc';
  enableApiLogging?: boolean;
}
```

### 2. Container Design Best Practices

#### Multi-Stage Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only necessary files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Security hardening
USER nodejs
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

#### .dockerignore
```
# Dependencies
node_modules
npm-debug.log

# Git
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# Test files
**/*.test.ts
**/*.spec.ts
coverage/
.nyc_output/

# Build artifacts
dist/

# Environment files
.env
.env.local
.env.*

# Documentation
README.md
docs/

# CI/CD
.github/
azure-pipelines.yml
```

#### Container Security Scanning
```yaml
# Azure Pipeline for container scanning
- task: ContainerStructureTest@0
  inputs:
    dockerRegistryServiceConnection: '$(acrServiceConnection)'
    imageName: '$(acrName).azurecr.io/$(imageName):$(imageTag)'
    configFile: 'container-structure-test.yaml'

- task: trivy@1
  inputs:
    image: '$(acrName).azurecr.io/$(imageName):$(imageTag)'
    exitCode: 1
    severity: 'CRITICAL,HIGH'
```

### 3. Scaling Strategies

#### KEDA Scaling Rules
```typescript
// HTTP-based scaling
const httpScaling = {
  name: 'http-scaling',
  http: {
    metadata: {
      concurrentRequests: '100'
    }
  }
};

// Azure Service Bus Queue scaling
const serviceBusScaling = {
  name: 'servicebus-scaling',
  custom: {
    type: 'azure-servicebus',
    metadata: {
      queueName: 'orders',
      namespace: 'my-servicebus',
      messageCount: '5'
    },
    auth: [
      {
        secretRef: 'servicebus-connection-string',
        triggerParameter: 'connection'
      }
    ]
  }
};

// CPU/Memory scaling
const resourceScaling = {
  name: 'cpu-scaling',
  custom: {
    type: 'cpu',
    metadata: {
      type: 'Utilization',
      value: '70'
    }
  }
};

// Cron-based scaling
const cronScaling = {
  name: 'business-hours-scaling',
  custom: {
    type: 'cron',
    metadata: {
      timezone: 'Europe/Amsterdam',
      start: '0 8 * * 1-5',  // 8 AM weekdays
      end: '0 18 * * 1-5',   // 6 PM weekdays
      desiredReplicas: '10'
    }
  }
};
```

#### Scaling Configuration
```
┌───────────────────────────────────────────────────────────────┐
│                    Scaling Configuration                       │
├───────────────────────────────────────────────────────────────┤
│  Min Replicas: 1 (always running)                             │
│  Max Replicas: 30 (cost protection)                           │
│                                                                │
│  Scale Rules:                                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. HTTP Requests                                        │  │
│  │    Trigger: 100 concurrent requests per replica         │  │
│  │    Cool-down: 300 seconds                               │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 2. Service Bus Queue                                    │  │
│  │    Trigger: 5 messages per replica                      │  │
│  │    Target: orders-queue                                 │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 3. CPU Utilization                                      │  │
│  │    Trigger: 70% average CPU                             │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### 4. Dapr Integration

#### Service Invocation
```typescript
// Direct service-to-service call via Dapr
import { DaprClient, HttpMethod } from '@dapr/dapr';

const daprHost = process.env.DAPR_HTTP_HOST || 'localhost';
const daprPort = process.env.DAPR_HTTP_PORT || '3500';

const client = new DaprClient({ daprHost, daprPort });

// Invoke another service
async function getUser(userId: string): Promise<User> {
  const response = await client.invoker.invoke(
    'user-service',        // App ID of target service
    `users/${userId}`,     // Method/endpoint
    HttpMethod.GET
  );
  return response as User;
}

// With retry and timeout
async function createOrder(order: Order): Promise<Order> {
  const response = await client.invoker.invoke(
    'order-service',
    'orders',
    HttpMethod.POST,
    order,
    { 
      headers: { 
        'Content-Type': 'application/json',
        'dapr-app-id': 'order-service'
      }
    }
  );
  return response as Order;
}
```

#### State Management
```typescript
// Dapr State Store
const stateStoreName = 'statestore'; // Configured in Dapr component

// Save state
async function saveUserSession(userId: string, session: Session): Promise<void> {
  await client.state.save(stateStoreName, [
    {
      key: `session:${userId}`,
      value: session,
      options: {
        ttlInSeconds: 3600 // 1 hour
      }
    }
  ]);
}

// Get state
async function getUserSession(userId: string): Promise<Session | null> {
  const state = await client.state.get(stateStoreName, `session:${userId}`);
  return state as Session | null;
}

// Delete state
async function deleteUserSession(userId: string): Promise<void> {
  await client.state.delete(stateStoreName, `session:${userId}`);
}

// Transaction (atomic operations)
async function transferFunds(fromId: string, toId: string, amount: number): Promise<void> {
  const operations = [
    {
      operation: 'upsert',
      request: {
        key: `balance:${fromId}`,
        value: await getBalance(fromId) - amount
      }
    },
    {
      operation: 'upsert',
      request: {
        key: `balance:${toId}`,
        value: await getBalance(toId) + amount
      }
    }
  ];
  
  await client.state.transaction(stateStoreName, operations);
}
```

#### Pub/Sub Messaging
```typescript
// Publisher
const pubSubName = 'pubsub'; // Configured Dapr component

async function publishOrderCreated(order: Order): Promise<void> {
  await client.pubsub.publish(
    pubSubName,
    'orders',  // Topic
    {
      eventType: 'OrderCreated',
      data: order,
      timestamp: new Date().toISOString()
    }
  );
}

// Subscriber (Express endpoint)
import express from 'express';
const app = express();

// Dapr will call this to get subscription info
app.get('/dapr/subscribe', (req, res) => {
  res.json([
    {
      pubsubname: 'pubsub',
      topic: 'orders',
      route: '/orders/handler'
    }
  ]);
});

// Handler for order events
app.post('/orders/handler', async (req, res) => {
  const event = req.body;
  
  try {
    await processOrder(event.data);
    res.status(200).send('OK');
  } catch (error) {
    // Return error for retry
    res.status(500).send(error.message);
  }
});
```

### 5. Deployment Strategies

#### Blue/Green Deployment
```
┌─────────────────────────────────────────────────────────────────┐
│                    Blue/Green Deployment                         │
│                                                                  │
│  Phase 1: Deploy Green                                           │
│  ┌────────────────┐      ┌────────────────┐                     │
│  │  Blue (v1.0)   │      │  Green (v2.0)  │                     │
│  │  100% traffic  │      │   0% traffic   │                     │
│  │  [Active]      │      │   [Staging]    │                     │
│  └────────────────┘      └────────────────┘                     │
│                                                                  │
│  Phase 2: Test Green                                             │
│  ┌────────────────┐      ┌────────────────┐                     │
│  │  Blue (v1.0)   │      │  Green (v2.0)  │                     │
│  │  100% traffic  │      │   Test only    │                     │
│  └────────────────┘      └────────────────┘                     │
│                                                                  │
│  Phase 3: Switch Traffic                                         │
│  ┌────────────────┐      ┌────────────────┐                     │
│  │  Blue (v1.0)   │      │  Green (v2.0)  │                     │
│  │   0% traffic   │      │  100% traffic  │                     │
│  │   [Standby]    │      │   [Active]     │                     │
│  └────────────────┘      └────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

#### Canary Deployment
```typescript
// Traffic splitting configuration
const trafficConfig = {
  traffic: [
    {
      revisionName: 'app--v1',
      weight: 90,
      label: 'stable'
    },
    {
      revisionName: 'app--v2',
      weight: 10,
      label: 'canary'
    }
  ]
};

// Progressive rollout stages
const rolloutStages = [
  { canaryWeight: 5, duration: '10m', metrics: ['error-rate < 1%'] },
  { canaryWeight: 25, duration: '30m', metrics: ['error-rate < 1%', 'latency-p99 < 500ms'] },
  { canaryWeight: 50, duration: '1h', metrics: ['error-rate < 1%'] },
  { canaryWeight: 100, duration: 'stable' }
];
```

### 6. Health Probes

#### Probe Configuration
```typescript
interface ProbeConfig {
  // Startup probe - initial container health
  startupProbe: {
    type: 'http' | 'tcp';
    httpGet?: {
      path: '/health/startup';
      port: 3000;
    };
    initialDelaySeconds: 10;
    periodSeconds: 10;
    failureThreshold: 30;  // Allow 5 minutes for startup
  };
  
  // Liveness probe - running health
  livenessProbe: {
    type: 'http';
    httpGet: {
      path: '/health/live';
      port: 3000;
    };
    periodSeconds: 10;
    failureThreshold: 3;
  };
  
  // Readiness probe - traffic readiness
  readinessProbe: {
    type: 'http';
    httpGet: {
      path: '/health/ready';
      port: 3000;
    };
    periodSeconds: 5;
    failureThreshold: 3;
  };
}
```

#### Health Endpoint Implementation
```typescript
import express from 'express';

const app = express();

// Track dependencies
let dbConnected = false;
let cacheConnected = false;

// Startup probe - checks initial setup complete
app.get('/health/startup', (req, res) => {
  // Check if all initial connections are established
  if (dbConnected && cacheConnected) {
    res.status(200).json({ status: 'started' });
  } else {
    res.status(503).json({ 
      status: 'starting',
      db: dbConnected,
      cache: cacheConnected
    });
  }
});

// Liveness probe - is the process alive?
app.get('/health/live', (req, res) => {
  // Simple check - process is running
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Readiness probe - can we accept traffic?
app.get('/health/ready', async (req, res) => {
  try {
    // Check all critical dependencies
    await checkDatabase();
    await checkCache();
    await checkExternalServices();
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ 
      status: 'not-ready',
      error: error.message
    });
  }
});
```

---

## 📐 Bicep Infrastructure Templates

### Container Apps Environment
```bicep
param environmentName string
param location string = resourceGroup().location
param logAnalyticsWorkspaceId string
param vnetSubnetId string = ''

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsWorkspaceId, '2022-10-01').customerId
        sharedKey: listKeys(logAnalyticsWorkspaceId, '2022-10-01').primarySharedKey
      }
    }
    vnetConfiguration: !empty(vnetSubnetId) ? {
      internal: false
      infrastructureSubnetId: vnetSubnetId
    } : null
    zoneRedundant: false
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

// Dapr State Store Component
resource daprStateStore 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  parent: containerAppEnv
  name: 'statestore'
  properties: {
    componentType: 'state.azure.cosmosdb'
    version: 'v1'
    metadata: [
      {
        name: 'url'
        value: cosmosDbEndpoint
      }
      {
        name: 'database'
        value: 'dapr'
      }
      {
        name: 'collection'
        value: 'state'
      }
    ]
    secrets: [
      {
        name: 'master-key'
        value: cosmosDbKey
      }
    ]
    scopes: [
      'user-service'
      'order-service'
    ]
  }
}

output environmentId string = containerAppEnv.id
```

### Container App
```bicep
param containerAppName string
param location string = resourceGroup().location
param containerAppEnvId string
param acrName string
param imageName string
param imageTag string = 'latest'
param targetPort int = 3000
param minReplicas int = 1
param maxReplicas int = 10
param cpuCore string = '0.5'
param memorySize string = '1Gi'
param secrets array = []
param envVars array = []
param daprEnabled bool = true
param daprAppId string = ''

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: containerAppEnvId
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'http'
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          maxAge: 3600
        }
      }
      secrets: secrets
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: 'system'
        }
      ]
      dapr: daprEnabled ? {
        enabled: true
        appId: !empty(daprAppId) ? daprAppId : containerAppName
        appPort: targetPort
        appProtocol: 'http'
        enableApiLogging: true
      } : null
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: '${acrName}.azurecr.io/${imageName}:${imageTag}'
          resources: {
            cpu: json(cpuCore)
            memory: memorySize
          }
          env: envVars
          probes: [
            {
              type: 'Startup'
              httpGet: {
                path: '/health/startup'
                port: targetPort
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              failureThreshold: 30
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health/live'
                port: targetPort
              }
              periodSeconds: 10
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health/ready'
                port: targetPort
              }
              periodSeconds: 5
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output containerAppId string = containerApp.id
output containerAppPrincipalId string = containerApp.identity.principalId
```

### Azure Container Registry
```bicep
param acrName string
param location string = resourceGroup().location
param sku string = 'Basic'
param adminUserEnabled bool = false

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: adminUserEnabled
    policies: {
      quarantinePolicy: {
        status: 'disabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'disabled'
      }
      retentionPolicy: {
        days: 30
        status: sku == 'Premium' ? 'enabled' : 'disabled'
      }
    }
    encryption: {
      status: 'disabled'
    }
    dataEndpointEnabled: false
    publicNetworkAccess: 'Enabled'
    zoneRedundancy: 'Disabled'
  }
}

// Role assignment for Container Apps to pull images
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, 'acrpull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: containerAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output acrLoginServer string = acr.properties.loginServer
output acrId string = acr.id
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @azure-architect | Container-based solution needed |
| @microservices-architect | Service containerization |
| @coordinator | Direct container request |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @bicep-specialist | Infrastructure deployment |
| @devops-specialist | CI/CD pipeline for containers |
| @backend-specialist | Application code within containers |

---

## 📝 Decision Framework

### Container Apps vs AKS
```
Use Container Apps when:
├── Microservices with HTTP/event-driven workloads
├── Serverless containers (scale to zero)
├── Built-in Dapr support needed
├── Simplified operations (no cluster management)
├── Event-driven scaling (KEDA built-in)
└── Lower operational overhead preferred

Use AKS when:
├── Need full Kubernetes API access
├── Complex networking requirements
├── Windows containers required
├── GPU workloads
├── Existing Kubernetes expertise/tooling
└── Maximum control over infrastructure
```

### Image Registry Selection
```
Azure Container Registry tiers:
├── Basic    → Dev/test, small teams, <10GB storage
├── Standard → Production, multiple repos, geo-replication (single)
└── Premium  → Enterprise, geo-replication, content trust, private link
```

---

## 📚 Related Skills

- [container-apps-patterns.skill.md](../skills/container-apps-patterns.skill.md)
- [docker-best-practices.skill.md](../skills/docker-best-practices.skill.md)
- [dapr-integration.skill.md](../skills/dapr-integration.skill.md)

---

## 🏷️ Tags

`containers` `azure-container-apps` `docker` `dapr` `keda` `scaling` `microservices` `acr` `deployment-strategies`
