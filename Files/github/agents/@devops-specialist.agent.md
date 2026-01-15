# @devops-specialist Agent (Phase 15)

**Agent ID**: `@devops-specialist`  
**Phase**: 15  
**Purpose**: Create CI/CD pipelines, deployment automation, monitoring setup  
**Triggers From**: 
- **Architecture**: @bicep-specialist (bicep_modules), @azure-architect (azure_resource_plan)
- **Frontend**: @react-specialist, @vue-specialist, @angular-specialist, @svelte-specialist, @frontend-specialist
- **Backend**: @dotnet-specialist, @nodejs-specialist, @python-specialist, @go-specialist, @java-specialist, @backend-specialist
- **Infrastructure**: @docker-specialist (container_configs), @mysql-specialist (database_migrations), @database-specialist
- **Always**: @code-architect (code_structure)
**Hands Off To**: @reporter (deployment ready)

---

## Core Responsibilities

### 1. CI/CD Pipeline Design

**GitHub Actions Workflow Structure**:

```
.github/workflows/
├── build.yml              # Build & test on PR
├── deploy-dev.yml         # Deploy to development
├── deploy-staging.yml     # Deploy to staging
├── deploy-prod.yml        # Deploy to production
├── security-scan.yml      # Security checks
└── performance-test.yml   # Load testing
```

### 2. Build Pipeline

**build.yml** (Runs on every push/PR):

```yaml
name: Build & Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint code
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Build application
        run: npm run build
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Build Docker image
        if: github.event_name == 'push'
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker tag myapp:${{ github.sha }} myapp:latest
      
      - name: Push to registry
        if: github.event_name == 'push'
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USERNAME }} --password-stdin myregistry.azurecr.io
          docker push myregistry.azurecr.io/myapp:${{ github.sha }}
          docker push myregistry.azurecr.io/myapp:latest
```

### 3. Deployment Pipeline

**deploy-prod.yml** (Manual trigger to production):

```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy Bicep
        run: |
          az deployment group create \
            --resource-group myapp-prod-rg \
            --template-file infra/main.bicep \
            --parameters infra/parameters/prod.parameters.json \
            --parameters version=${{ github.event.inputs.version }}
      
      - name: Update App Service
        run: |
          az webapp deployment source config-zip \
            --resource-group myapp-prod-rg \
            --name myapp-prod-as \
            --src-path dist.zip
      
      - name: Run smoke tests
        run: npm run test:smoke -- https://myapp.com
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Deployed to production",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment*\nVersion: ${{ github.event.inputs.version }}\nStatus: Success"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 4. Docker Configuration

**Dockerfile** (Multi-stage build):

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm run test:unit

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

**docker-compose.yml** (Local development):

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/myapp
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 5. Monitoring & Logging

**Application Insights Setup**:

```typescript
// src/shared/monitoring/ApplicationInsights.ts
import appInsights from 'applicationinsights';

export const initApplicationInsights = () => {
  appInsights
    .setup(process.env.APPINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .start();

  return appInsights.defaultClient;
};

// Usage
const client = initApplicationInsights();

// Log custom metric
client.trackEvent({
  name: 'UserCreated',
  properties: { userId: '123' },
});

// Log dependency
client.trackDependency({
  target: 'myapp',
  name: 'GET /api/users',
  duration: 100,
  resultCode: 200,
  success: true,
});
```

**Log Analytics Queries**:

```kusto
// Error rate over time
requests
| where timestamp > ago(1d)
| summarize ErrorRate = (todouble(sum(itemCount) - sum(iff(success == true, itemCount, 0))) / sum(itemCount)) * 100 by bin(timestamp, 1h)
| render timechart

// Slow requests
requests
| where timestamp > ago(1d)
| where duration > 2000
| project timestamp, name, duration, client_Browser
| top 20 by duration desc

// Exception summary
exceptions
| where timestamp > ago(1d)
| summarize Count = count() by type, message
| order by Count desc
```

### 6. Health Checks & Alerts

**Azure Monitor Alert Rules**:

```json
{
  "name": "HighCPUAlert",
  "description": "Alert when CPU > 80%",
  "scopes": [
    "/subscriptions/{subId}/resourceGroups/myapp-prod-rg/providers/Microsoft.Web/serverfarms/myapp-prod-asp"
  ],
  "condition": {
    "allOf": [
      {
        "name": "Percentage CPU",
        "metricName": "CpuPercentage",
        "operator": "GreaterThan",
        "threshold": 80,
        "timeAggregation": "Average",
        "dimensions": []
      }
    ]
  },
  "actions": [
    {
      "actionGroupId": "/subscriptions/{subId}/resourceGroups/myapp-prod-rg/providers/microsoft.insights/actiongroups/myapp-alerts"
    }
  ]
}
```

**Health Check Endpoint**:

```typescript
// src/api/routes/health.routes.ts
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION,
  });
});

router.get('/ready', async (req, res) => {
  try {
    // Check database
    await db.query('SELECT 1');
    
    // Check cache
    await redis.ping();
    
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

### 7. Secrets Management

**GitHub Secrets Setup**:

```bash
# Add secrets to GitHub
gh secret set REGISTRY_USERNAME --body $REGISTRY_USERNAME
gh secret set REGISTRY_PASSWORD --body $REGISTRY_PASSWORD
gh secret set AZURE_CREDENTIALS --body @azure-credentials.json
gh secret set DATABASE_PASSWORD --body $DB_PASSWORD
gh secret set JWT_SECRET --body $JWT_SECRET
```

**Key Vault Integration**:

```bicep
// Reference in Bicep
resource keyVault 'Microsoft.KeyVault/vaults@2021-06-01-preview' = {
  name: '${applicationName}-vault'
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: appService.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// App Service references secrets
resource appService 'Microsoft.Web/sites@2021-02-01' = {
  properties: {
    siteConfig: {
      appSettings: [
        {
          name: 'JWT_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/jwt-secret/)'
        }
      ]
    }
  }
}
```

---

## Output Artifacts

**Files Created**:
- CI/CD workflows (5+ GitHub Actions)
- Docker configuration
- docker-compose for local development
- Bicep deployment validation
- Application Insights setup
- Azure Monitor alerts
- Health check endpoints
- Smoke tests for post-deployment verification
- Deployment documentation

---

## Filename: `@devops-specialist.agent.md`
