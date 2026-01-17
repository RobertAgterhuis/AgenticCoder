# Container Apps Patterns Skill

**Skill ID**: `container-apps-patterns`  
**Version**: 1.0.0  
**Category**: Infrastructure

---

## 🎯 Purpose

Comprehensive patterns and best practices for Azure Container Apps including environment design, scaling, Dapr integration, and deployment strategies.

---

## 📚 Core Patterns

### 1. Environment Architecture

#### Multi-Environment Setup
```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Environment                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   API Gateway  │  │  User Service  │  │  Order Service │    │
│  │   (External)   │  │   (Internal)   │  │   (Internal)   │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  Features: Zone redundancy, VNET integration, Premium workloads │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Staging Environment                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   API Gateway  │  │  User Service  │  │  Order Service │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  Features: Consumption workload, No zone redundancy             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Development Environment                       │
│  ┌────────────────┐  ┌────────────────┐                        │
│  │   API + Web    │  │    All-in-one  │                        │
│  └────────────────┘  └────────────────┘                        │
│                                                                  │
│  Features: Minimal resources, Scale to zero                     │
└─────────────────────────────────────────────────────────────────┘
```

#### VNET Integration Pattern
```bicep
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
    subnets: [
      {
        name: 'container-apps'
        properties: {
          addressPrefix: '10.0.0.0/23'  // Minimum /23 for Container Apps
          delegations: [
            {
              name: 'Microsoft.App.environments'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
      {
        name: 'private-endpoints'
        properties: {
          addressPrefix: '10.0.2.0/24'
        }
      }
    ]
  }
}

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: envName
  location: location
  properties: {
    vnetConfiguration: {
      internal: true  // Internal-only access
      infrastructureSubnetId: vnet.properties.subnets[0].id
    }
    zoneRedundant: true
  }
}
```

### 2. Revision Management

#### Multiple Active Revisions
```typescript
// Configuration for blue/green deployments
const multiRevisionConfig = {
  configuration: {
    activeRevisionsMode: 'Multiple',
    ingress: {
      traffic: [
        {
          revisionName: 'myapp--v1-stable',
          weight: 90,
          label: 'stable'
        },
        {
          revisionName: 'myapp--v2-canary',
          weight: 10,
          label: 'canary'
        }
      ]
    }
  }
};
```

#### Label-Based Routing
```
┌─────────────────────────────────────────────────────────────────┐
│                    Traffic Distribution                          │
│                                                                  │
│  https://myapp.azurecontainerapps.io                            │
│  ├── 90% → v1 (stable)                                          │
│  └── 10% → v2 (canary)                                          │
│                                                                  │
│  https://myapp---stable.azurecontainerapps.io → v1 only         │
│  https://myapp---canary.azurecontainerapps.io → v2 only         │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Scaling Patterns

#### HTTP-Based Scaling
```bicep
scale: {
  minReplicas: 1
  maxReplicas: 30
  rules: [
    {
      name: 'http-scaling'
      http: {
        metadata: {
          concurrentRequests: '100'  // Scale when avg > 100 concurrent requests
        }
      }
    }
  ]
}
```

#### Queue-Based Scaling (KEDA)
```bicep
scale: {
  minReplicas: 0  // Scale to zero when no messages
  maxReplicas: 50
  rules: [
    {
      name: 'queue-scaling'
      custom: {
        type: 'azure-servicebus'
        metadata: {
          namespace: serviceBusNamespace
          queueName: 'orders'
          messageCount: '10'  // 1 replica per 10 messages
        }
        auth: [
          {
            secretRef: 'sb-connection'
            triggerParameter: 'connection'
          }
        ]
      }
    }
  ]
}
```

#### CPU/Memory Scaling
```bicep
scale: {
  minReplicas: 2
  maxReplicas: 20
  rules: [
    {
      name: 'cpu-scaling'
      custom: {
        type: 'cpu'
        metadata: {
          type: 'Utilization'
          value: '70'  // Scale when CPU > 70%
        }
      }
    }
    {
      name: 'memory-scaling'
      custom: {
        type: 'memory'
        metadata: {
          type: 'Utilization'
          value: '80'  // Scale when memory > 80%
        }
      }
    }
  ]
}
```

#### Cron-Based Scaling (Business Hours)
```bicep
scale: {
  minReplicas: 1
  maxReplicas: 20
  rules: [
    {
      name: 'business-hours'
      custom: {
        type: 'cron'
        metadata: {
          timezone: 'Europe/Amsterdam'
          start: '0 8 * * 1-5'   // 8 AM weekdays
          end: '0 20 * * 1-5'    // 8 PM weekdays
          desiredReplicas: '10'
        }
      }
    }
  ]
}
```

### 4. Dapr Integration Patterns

#### Service Invocation
```typescript
// Direct service-to-service call
const daprPort = process.env.DAPR_HTTP_PORT || '3500';

async function callOrderService(orderId: string): Promise<Order> {
  const response = await fetch(
    `http://localhost:${daprPort}/v1.0/invoke/order-service/method/orders/${orderId}`,
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
  return response.json();
}

// With Dapr SDK
import { DaprClient, HttpMethod } from '@dapr/dapr';

const client = new DaprClient();

async function getOrder(orderId: string): Promise<Order> {
  return await client.invoker.invoke(
    'order-service',
    `orders/${orderId}`,
    HttpMethod.GET
  );
}
```

#### State Management
```typescript
const stateStoreName = 'statestore';

// Save state
async function saveSession(userId: string, session: Session): Promise<void> {
  await client.state.save(stateStoreName, [
    {
      key: `session:${userId}`,
      value: session,
      options: { ttlInSeconds: 3600 }
    }
  ]);
}

// Get state
async function getSession(userId: string): Promise<Session | null> {
  return await client.state.get(stateStoreName, `session:${userId}`);
}

// Transaction
async function transferBalance(from: string, to: string, amount: number): Promise<void> {
  await client.state.transaction(stateStoreName, [
    {
      operation: 'upsert',
      request: { key: `balance:${from}`, value: fromBalance - amount }
    },
    {
      operation: 'upsert', 
      request: { key: `balance:${to}`, value: toBalance + amount }
    }
  ]);
}
```

#### Pub/Sub Messaging
```typescript
// Publisher
async function publishEvent(topic: string, data: unknown): Promise<void> {
  await client.pubsub.publish('pubsub', topic, data);
}

// Subscriber (Express app)
import express from 'express';
const app = express();

// Dapr subscription configuration
app.get('/dapr/subscribe', (req, res) => {
  res.json([
    {
      pubsubname: 'pubsub',
      topic: 'orders',
      route: '/handlers/orders',
      metadata: {
        rawPayload: 'true'
      }
    },
    {
      pubsubname: 'pubsub',
      topic: 'notifications',
      route: '/handlers/notifications'
    }
  ]);
});

// Event handler
app.post('/handlers/orders', async (req, res) => {
  try {
    const event = req.body;
    await processOrderEvent(event.data);
    res.sendStatus(200);
  } catch (error) {
    console.error('Failed to process order:', error);
    res.sendStatus(500); // Will trigger retry
  }
});
```

#### Dapr Components Configuration
```bicep
// State Store (Cosmos DB)
resource stateStore 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  parent: containerAppEnv
  name: 'statestore'
  properties: {
    componentType: 'state.azure.cosmosdb'
    version: 'v1'
    metadata: [
      { name: 'url', value: cosmosEndpoint }
      { name: 'database', value: 'dapr' }
      { name: 'collection', value: 'state' }
      { name: 'masterKey', secretRef: 'cosmos-key' }
    ]
    secrets: [
      { name: 'cosmos-key', value: cosmosKey }
    ]
    scopes: ['user-service', 'order-service']
  }
}

// Pub/Sub (Service Bus)
resource pubsub 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  parent: containerAppEnv
  name: 'pubsub'
  properties: {
    componentType: 'pubsub.azure.servicebus.topics'
    version: 'v1'
    metadata: [
      { name: 'connectionString', secretRef: 'sb-connection' }
    ]
    secrets: [
      { name: 'sb-connection', value: serviceBusConnectionString }
    ]
    scopes: ['order-service', 'notification-service']
  }
}
```

### 5. Health Probes Configuration

#### Complete Probe Setup
```bicep
probes: [
  {
    type: 'Startup'
    httpGet: {
      path: '/health/startup'
      port: 3000
    }
    initialDelaySeconds: 5
    periodSeconds: 10
    failureThreshold: 30  // 5 minutes to start
    timeoutSeconds: 3
  }
  {
    type: 'Liveness'
    httpGet: {
      path: '/health/live'
      port: 3000
    }
    periodSeconds: 10
    failureThreshold: 3
    timeoutSeconds: 3
  }
  {
    type: 'Readiness'
    httpGet: {
      path: '/health/ready'
      port: 3000
    }
    periodSeconds: 5
    failureThreshold: 3
    timeoutSeconds: 3
  }
]
```

#### Health Endpoint Implementation
```typescript
import express from 'express';

const app = express();

// Track service health state
let isStarted = false;
let isReady = true;

// Startup probe - initial checks
app.get('/health/startup', async (req, res) => {
  try {
    // Check all required services are reachable
    await checkDatabase();
    await checkCache();
    isStarted = true;
    res.status(200).json({ status: 'started' });
  } catch (error) {
    res.status(503).json({ status: 'starting', error: error.message });
  }
});

// Liveness probe - is the process alive?
app.get('/health/live', (req, res) => {
  // Simple check - if we can respond, we're alive
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe - can we accept traffic?
app.get('/health/ready', async (req, res) => {
  if (!isReady) {
    return res.status(503).json({ status: 'not-ready', reason: 'draining' });
  }
  
  try {
    // Check critical dependencies
    await checkDatabase({ timeout: 2000 });
    await checkDownstreamServices({ timeout: 2000 });
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not-ready', error: error.message });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown');
  isReady = false;  // Stop accepting new traffic
  
  // Wait for in-flight requests
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Cleanup
  await closeConnections();
  process.exit(0);
});
```

### 6. Secrets Management

#### Key Vault Integration
```bicep
// Container App with Key Vault secrets
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: appName
  properties: {
    configuration: {
      secrets: [
        {
          name: 'db-connection'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/db-connection'
          identity: managedIdentity.id
        }
        {
          name: 'api-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/api-key'
          identity: managedIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: appName
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'db-connection'
            }
            {
              name: 'API_KEY'
              secretRef: 'api-key'
            }
          ]
        }
      ]
    }
  }
}
```

### 7. Deployment Strategies

#### Blue/Green Deployment
```yaml
# Azure DevOps Pipeline
stages:
  - stage: Deploy
    jobs:
      - job: BlueGreen
        steps:
          # Deploy new revision (Green)
          - task: AzureCLI@2
            inputs:
              azureSubscription: $(serviceConnection)
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                az containerapp update \
                  --name $(appName) \
                  --resource-group $(resourceGroup) \
                  --image $(acrName).azurecr.io/$(imageName):$(Build.BuildId) \
                  --revision-suffix v$(Build.BuildId)
          
          # Verify new revision is healthy
          - task: AzureCLI@2
            inputs:
              azureSubscription: $(serviceConnection)
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                # Wait for revision to be ready
                sleep 30
                HEALTH=$(curl -s https://$(appName)---v$(Build.BuildId).$(envDomain)/health/ready)
                if [ "$HEALTH" != '{"status":"ready"}' ]; then
                  exit 1
                fi
          
          # Switch traffic
          - task: AzureCLI@2
            inputs:
              azureSubscription: $(serviceConnection)
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                az containerapp ingress traffic set \
                  --name $(appName) \
                  --resource-group $(resourceGroup) \
                  --revision-weight latest=100
```

#### Canary Deployment
```bash
#!/bin/bash

# Phase 1: 5% canary
az containerapp ingress traffic set \
  --name $APP_NAME \
  --resource-group $RG \
  --revision-weight $STABLE_REVISION=95 $CANARY_REVISION=5

# Monitor for 10 minutes
sleep 600
check_error_rate

# Phase 2: 25% canary
az containerapp ingress traffic set \
  --name $APP_NAME \
  --resource-group $RG \
  --revision-weight $STABLE_REVISION=75 $CANARY_REVISION=25

# Monitor for 30 minutes
sleep 1800
check_error_rate

# Phase 3: 50% canary
az containerapp ingress traffic set \
  --name $APP_NAME \
  --resource-group $RG \
  --revision-weight $STABLE_REVISION=50 $CANARY_REVISION=50

# Monitor for 1 hour
sleep 3600
check_error_rate

# Phase 4: Full rollout
az containerapp ingress traffic set \
  --name $APP_NAME \
  --resource-group $RG \
  --revision-weight $CANARY_REVISION=100
```

### 8. Networking Patterns

#### Internal Service Communication
```
┌─────────────────────────────────────────────────────────────────┐
│                Container Apps Environment                        │
│                                                                  │
│  ┌────────────────┐     Internal DNS      ┌────────────────┐   │
│  │   API Gateway  │ ──────────────────► │  User Service  │   │
│  │   (External)   │   user-service         │   (Internal)   │   │
│  │                │                        │                │   │
│  │   Port: 443    │     order-service      │   Port: 80     │   │
│  └────────────────┘ ──────────────────► └────────────────┘   │
│         │                                        │             │
│         │                                        ▼             │
│         │              ┌────────────────┐                      │
│         └────────────► │  Order Service │                      │
│                        │   (Internal)   │                      │
│                        │   Port: 80     │                      │
│                        └────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘

Internal DNS: <app-name>.<environment-unique-id>.internal
External DNS: <app-name>.<region>.azurecontainerapps.io
```

#### Service Discovery with Dapr
```typescript
// Without Dapr - direct HTTP call
const response = await fetch('http://user-service.abc123.internal/users/1');

// With Dapr - service invocation
const response = await fetch('http://localhost:3500/v1.0/invoke/user-service/method/users/1');
```

---

## 📐 Bicep Templates

### Complete Container App
```bicep
param containerAppName string
param location string = resourceGroup().location
param containerAppEnvId string
param acrName string
param imageName string
param imageTag string = 'latest'

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
        targetPort: 3000
        transport: 'http'
        traffic: [
          { latestRevision: true, weight: 100 }
        ]
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: 'system'
        }
      ]
      dapr: {
        enabled: true
        appId: containerAppName
        appPort: 3000
        appProtocol: 'http'
      }
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: '${acrName}.azurecr.io/${imageName}:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          probes: [
            {
              type: 'Startup'
              httpGet: { path: '/health/startup', port: 3000 }
              initialDelaySeconds: 5
              periodSeconds: 10
              failureThreshold: 30
            }
            {
              type: 'Liveness'
              httpGet: { path: '/health/live', port: 3000 }
              periodSeconds: 10
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: { path: '/health/ready', port: 3000 }
              periodSeconds: 5
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling'
            http: { metadata: { concurrentRequests: '100' } }
          }
        ]
      }
    }
  }
}

output fqdn string = containerApp.properties.configuration.ingress.fqdn
output principalId string = containerApp.identity.principalId
```

---

## 🏷️ Tags

`container-apps` `aca` `dapr` `keda` `scaling` `deployment` `microservices` `azure`
