# Deployment Guide

Production deployment strategies for AgenticCoder projects.

## Deployment Overview

AgenticCoder generates deployment-ready artifacts:
- Infrastructure as Code (Bicep)
- CI/CD pipelines (GitHub Actions)
- Container configurations (Docker)
- Kubernetes manifests (Helm)

## Deployment Strategies

### Blue-Green Deployment

Zero-downtime deployments with instant rollback capability.

```yaml
# .github/workflows/blue-green-deploy.yml

name: Blue-Green Deployment

on:
  push:
    branches: [main]

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
      
      - name: Deploy to Staging Slot
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ vars.APP_NAME }}
          slot-name: staging
          package: ./dist
      
      - name: Health Check Staging
        run: |
          curl --fail https://${{ vars.APP_NAME }}-staging.azurewebsites.net/health
      
      - name: Swap Slots
        run: |
          az webapp deployment slot swap \
            --name ${{ vars.APP_NAME }} \
            --resource-group ${{ vars.RESOURCE_GROUP }} \
            --slot staging \
            --target-slot production
```

### Canary Deployment

Gradual rollout with traffic splitting.

```yaml
# .github/workflows/canary-deploy.yml

name: Canary Deployment

jobs:
  deploy-canary:
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy Canary (10%)
        run: |
          az webapp traffic-routing set \
            --name ${{ vars.APP_NAME }} \
            --resource-group ${{ vars.RESOURCE_GROUP }} \
            --distribution staging=10
      
      - name: Monitor Canary (15 min)
        run: |
          sleep 900
          # Check error rates, latency
          ./scripts/check-canary-health.sh
      
      - name: Increase Traffic (50%)
        if: success()
        run: |
          az webapp traffic-routing set \
            --distribution staging=50
      
      - name: Full Rollout (100%)
        if: success()
        run: |
          az webapp deployment slot swap \
            --slot staging --target-slot production
```

### Rolling Deployment (AKS)

Kubernetes rolling updates with health checks.

```yaml
# kubernetes/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: myapp
          image: myregistry.azurecr.io/myapp:latest
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
```

## Infrastructure Deployment

### Bicep Deployment

```bash
# Deploy to subscription scope
az deployment sub create \
  --location westeurope \
  --template-file infra/main.bicep \
  --parameters infra/parameters/prod.bicepparam

# Deploy to resource group
az deployment group create \
  --resource-group rg-myapp-prod \
  --template-file infra/app.bicep \
  --parameters @infra/parameters/prod.json
```

### GitHub Actions Pipeline

```yaml
# .github/workflows/infra-deploy.yml

name: Infrastructure Deployment

on:
  push:
    branches: [main]
    paths:
      - 'infra/**'

permissions:
  id-token: write
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Validate Bicep
        run: az bicep build --file infra/main.bicep
      
      - name: What-If Analysis
        run: |
          az deployment sub what-if \
            --location westeurope \
            --template-file infra/main.bicep \
            --parameters infra/parameters/prod.bicepparam

  deploy:
    needs: validate
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
      
      - name: Deploy Infrastructure
        uses: azure/arm-deploy@v2
        with:
          scope: subscription
          region: westeurope
          template: infra/main.bicep
          parameters: infra/parameters/prod.bicepparam
          failOnStdErr: false
```

## Application Deployment

### App Service Deployment

```yaml
# .github/workflows/app-deploy.yml

name: Application Deployment

on:
  push:
    branches: [main]
    paths:
      - 'src/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Download Artifact
        uses: actions/download-artifact@v4
        with:
          name: app
          path: dist/
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Deploy to App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ vars.APP_NAME }}
          package: dist/
```

### Container Deployment

```yaml
# .github/workflows/container-deploy.yml

name: Container Deployment

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Login to ACR
        run: az acr login --name ${{ vars.ACR_NAME }}
      
      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ vars.ACR_NAME }}.azurecr.io/myapp:${{ github.sha }}
            ${{ vars.ACR_NAME }}.azurecr.io/myapp:latest

  deploy-aks:
    needs: build-and-push
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Get AKS Credentials
        run: |
          az aks get-credentials \
            --name ${{ vars.AKS_NAME }} \
            --resource-group ${{ vars.RESOURCE_GROUP }}
      
      - name: Deploy to AKS
        run: |
          helm upgrade myapp ./helm/myapp \
            --install \
            --namespace production \
            --set image.tag=${{ github.sha }}
```

## Environment Configuration

### Multi-Environment Setup

```
environments/
├── dev/
│   ├── main.bicepparam
│   ├── app.config
│   └── secrets.env
├── staging/
│   ├── main.bicepparam
│   ├── app.config
│   └── secrets.env
└── prod/
    ├── main.bicepparam
    ├── app.config
    └── secrets.env
```

### Environment-Specific Parameters

```bicep
// infra/parameters/prod.bicepparam

using '../main.bicep'

param environment = 'prod'
param location = 'westeurope'
param skuTier = 'PremiumV3'

param scaling = {
  minInstances: 3
  maxInstances: 10
  targetCPU: 70
}

param features = {
  highAvailability: true
  geoRedundancy: true
  advancedThreatProtection: true
}
```

## Secret Management

### GitHub Secrets

```bash
# Set secrets
gh secret set AZURE_CLIENT_ID --body "xxx"
gh secret set AZURE_TENANT_ID --body "xxx"
gh secret set AZURE_SUBSCRIPTION_ID --body "xxx"

# Set environment-specific
gh secret set DB_PASSWORD --env production --body "xxx"
```

### Azure Key Vault Integration

```yaml
# Deploy with Key Vault references
- name: Get Secrets from Key Vault
  run: |
    DB_PASSWORD=$(az keyvault secret show \
      --vault-name ${{ vars.KEY_VAULT }} \
      --name db-password \
      --query value -o tsv)
    echo "::add-mask::$DB_PASSWORD"
    echo "DB_PASSWORD=$DB_PASSWORD" >> $GITHUB_ENV
```

### App Configuration

```bicep
// Use Key Vault references in App Service
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: appName
  properties: {
    siteConfig: {
      appSettings: [
        {
          name: 'DatabasePassword'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=db-password)'
        }
      ]
    }
  }
}
```

## Rollback Procedures

### App Service Rollback

```bash
# List deployment history
az webapp deployment list \
  --name myapp \
  --resource-group rg-myapp

# Rollback to previous version
az webapp deployment slot swap \
  --name myapp \
  --resource-group rg-myapp \
  --slot staging \
  --target-slot production

# Or redeploy specific version
az webapp deployment source config-zip \
  --name myapp \
  --resource-group rg-myapp \
  --src previous-version.zip
```

### AKS Rollback

```bash
# View rollout history
kubectl rollout history deployment/myapp

# Rollback to previous
kubectl rollout undo deployment/myapp

# Rollback to specific revision
kubectl rollout undo deployment/myapp --to-revision=3
```

### Infrastructure Rollback

```bash
# View deployment history
az deployment sub list --query "[?name.contains(@, 'main')]"

# Redeploy previous state
az deployment sub create \
  --location westeurope \
  --template-file infra/main.bicep \
  --parameters @backup/previous-params.json
```

## Health Checks

### Readiness and Liveness Probes

```yaml
# Kubernetes
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 20
```

### App Service Health Check

```bicep
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  properties: {
    siteConfig: {
      healthCheckPath: '/health'
    }
  }
}
```

## Post-Deployment Verification

```yaml
# .github/workflows/verify.yml

verify:
  needs: deploy
  runs-on: ubuntu-latest
  
  steps:
    - name: Smoke Tests
      run: |
        # Check health endpoint
        curl --fail https://${{ vars.APP_URL }}/health
        
        # Check API
        curl --fail https://${{ vars.APP_URL }}/api/status
    
    - name: Run E2E Tests
      run: |
        npm run test:e2e -- --baseUrl=https://${{ vars.APP_URL }}
    
    - name: Performance Check
      run: |
        # Simple load test
        ab -n 100 -c 10 https://${{ vars.APP_URL }}/
```

## Next Steps

- [Monitoring](Monitoring) - Production monitoring
- [Security](Security) - Security practices
- [Maintenance](Maintenance) - Ongoing maintenance
