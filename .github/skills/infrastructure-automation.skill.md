# infrastructure-automation Skill

**Skill ID**: `infrastructure-automation`  
**Purpose**: Automate infrastructure provisioning, deployment, and management  
**Used By**: @bicep-specialist, @devops-specialist agents  
**Type**: Automation and orchestration

---

## Knowledge Areas

- Infrastructure as Code (IaC) - Bicep, Terraform
- CI/CD pipeline design (GitHub Actions, Azure Pipelines)
- Container orchestration (Docker, Kubernetes)
- Secret management (Key Vault, GitHub Secrets)
- Deployment strategies (blue-green, canary, rolling)

---

## Input Contract

```json
{
  "azure_resources": [...],
  "environments": ["dev", "staging", "production"],
  "deployment_strategy": "blue-green"
}
```

---

## Output Contract

```json
{
  "bicep_modules_created": 8,
  "deployment_scripts_ready": true,
  "cicd_pipelines_configured": true,
  "automated_rollback": true
}
```

---

## Core Capabilities

### 1. Bicep Module Organization

**Module Structure Pattern**:

```
infra/
├── main.bicep                   # Orchestration
├── modules/
│   ├── app-service/
│   │   ├── main.bicep
│   │   └── outputs.bicep
│   ├── sql-database/
│   │   ├── main.bicep
│   │   └── outputs.bicep
│   └── networking/
│       ├── main.bicep
│       └── outputs.bicep
├── parameters/
│   ├── dev.parameters.json
│   ├── staging.parameters.json
│   └── prod.parameters.json
└── scripts/
    ├── deploy.sh
    └── validate.sh
```

**Modular Design Principles**:
- Each module = one resource type (App Service, SQL, etc.)
- Outputs for cross-module dependencies
- Parameters for environment-specific values
- Validation at module level

### 2. Parameterization Strategy

**Environment-Specific Parameters**:

```bicep
// main.bicep
@description('Environment name')
@allowed(['dev', 'staging', 'production'])
param environment string

@description('Application name')
param applicationName string

// Compute SKU based on environment
var appServiceSku = environment == 'production' ? 'S2' : 'B1'
var sqlTier = environment == 'production' ? 'Standard' : 'Basic'

// Resource naming convention
var resourcePrefix = '${applicationName}-${environment}'
var appServiceName = '${resourcePrefix}-as'
var sqlServerName = '${resourcePrefix}-sql'
```

**Parameter Files**:

```json
// prod.parameters.json
{
  "parameters": {
    "environment": {"value": "production"},
    "applicationName": {"value": "myapp"},
    "sqlAdminPassword": {
      "reference": {
        "keyVault": {
          "id": "/subscriptions/.../vaults/myapp-vault"
        },
        "secretName": "sql-admin-password"
      }
    }
  }
}
```

### 3. Deployment Automation Scripts

**Bash Deployment Script**:

```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
RESOURCE_GROUP="myapp-${ENVIRONMENT}-rg"
LOCATION="eastus"

echo "🚀 Deploying to ${ENVIRONMENT}..."

# 1. Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# 2. Validate Bicep
echo "✓ Validating Bicep files..."
az bicep build --file infra/main.bicep

# 3. What-if analysis
echo "✓ Running what-if analysis..."
az deployment group what-if \
  --resource-group $RESOURCE_GROUP \
  --template-file infra/main.bicep \
  --parameters infra/parameters/${ENVIRONMENT}.parameters.json

# 4. Deploy (with confirmation)
read -p "Proceed with deployment? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file infra/main.bicep \
    --parameters infra/parameters/${ENVIRONMENT}.parameters.json \
    --mode Incremental
  
  echo "✅ Deployment complete!"
else
  echo "❌ Deployment cancelled"
  exit 1
fi
```

### 4. CI/CD Pipeline Design

**GitHub Actions Workflow Structure**:

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate Bicep
        run: |
          az bicep build --file infra/main.bicep
          az bicep lint --file infra/main.bicep
      
      - name: Run what-if
        run: |
          az deployment group what-if \
            --resource-group myapp-prod-rg \
            --template-file infra/main.bicep \
            --parameters infra/parameters/prod.parameters.json

  deploy-infrastructure:
    needs: validate
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy Bicep
        run: |
          az deployment group create \
            --resource-group myapp-prod-rg \
            --template-file infra/main.bicep \
            --parameters infra/parameters/prod.parameters.json

  deploy-application:
    needs: deploy-infrastructure
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Image
        run: docker build -t myapp:${{ github.event.inputs.version }} .
      
      - name: Push to Registry
        run: |
          docker tag myapp:${{ github.event.inputs.version }} myregistry.azurecr.io/myapp:${{ github.event.inputs.version }}
          docker push myregistry.azurecr.io/myapp:${{ github.event.inputs.version }}
      
      - name: Deploy to App Service
        run: |
          az webapp config container set \
            --name myapp-prod-as \
            --resource-group myapp-prod-rg \
            --docker-custom-image-name myregistry.azurecr.io/myapp:${{ github.event.inputs.version }}

  smoke-tests:
    needs: deploy-application
    runs-on: ubuntu-latest
    steps:
      - name: Run Smoke Tests
        run: |
          curl -f https://myapp.com/health || exit 1
          curl -f https://myapp.com/api/health || exit 1
      
      - name: Notify Success
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Production deployment successful",
              "blocks": [{
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Production Deployment*\nVersion: ${{ github.event.inputs.version }}\nStatus: Success ✅"
                }
              }]
            }
```

### 5. Deployment Strategies

**Blue-Green Deployment**:

```bicep
// Create two identical environments (blue and green)
module blueEnvironment 'modules/app-service/main.bicep' = {
  name: 'blueDeployment'
  params: {
    slotName: 'blue'
    containerImage: blueVersion
  }
}

module greenEnvironment 'modules/app-service/main.bicep' = {
  name: 'greenDeployment'
  params: {
    slotName: 'green'
    containerImage: greenVersion
  }
}

// Traffic Manager switches traffic
resource trafficManager 'Microsoft.Network/trafficManagerProfiles@2018-08-01' = {
  name: 'myapp-tm'
  properties: {
    trafficRoutingMethod: 'Weighted'
    endpoints: [
      {
        name: 'blue'
        weight: 100  // 100% to blue initially
      }
      {
        name: 'green'
        weight: 0    // 0% to green (switch after validation)
      }
    ]
  }
}
```

**Rolling Deployment**:

```yaml
# Kubernetes rolling update
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Add 1 new pod at a time
      maxUnavailable: 1  # Max 1 pod down at a time
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:v2
```

**Canary Deployment** (10% traffic to new version):

```bicep
resource appService 'Microsoft.Web/sites@2021-02-01' = {
  name: appServiceName
  properties: {
    siteConfig: {
      routingRules: [
        {
          name: 'canary'
          actionHostName: '${appServiceName}-canary.azurewebsites.net'
          reroutePercentage: 10  // 10% to canary
        }
      ]
    }
  }
}
```

### 6. Secret Management

**Key Vault Integration**:

```bicep
// Create Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2021-06-01-preview' = {
  name: '${applicationName}-vault'
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
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

// Store secrets
resource dbPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2021-06-01-preview' = {
  parent: keyVault
  name: 'database-password'
  properties: {
    value: databasePassword
  }
}

// App Service references secrets
resource appService 'Microsoft.Web/sites@2021-02-01' = {
  properties: {
    siteConfig: {
      appSettings: [
        {
          name: 'DATABASE_PASSWORD'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/database-password/)'
        }
      ]
    }
  }
}
```

### 7. Automated Rollback

**Rollback Strategy**:

```bash
#!/bin/bash
# rollback.sh

ENVIRONMENT=$1
PREVIOUS_VERSION=$2

echo "🔄 Rolling back to version ${PREVIOUS_VERSION}..."

# 1. Get current deployment
CURRENT_DEPLOYMENT=$(az webapp deployment list \
  --name myapp-${ENVIRONMENT}-as \
  --resource-group myapp-${ENVIRONMENT}-rg \
  --query "[0].id" -o tsv)

# 2. Rollback to previous version
az webapp deployment source config-zip \
  --resource-group myapp-${ENVIRONMENT}-rg \
  --name myapp-${ENVIRONMENT}-as \
  --src-path releases/${PREVIOUS_VERSION}.zip

# 3. Verify health
sleep 10
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://myapp.com/health)

if [ $HEALTH -eq 200 ]; then
  echo "✅ Rollback successful"
else
  echo "❌ Rollback failed - health check returned ${HEALTH}"
  exit 1
fi
```

**Automated Rollback in Pipeline**:

```yaml
- name: Deploy Application
  id: deploy
  run: ./deploy.sh production
  
- name: Health Check
  id: health
  run: |
    sleep 30
    curl -f https://myapp.com/health || exit 1

- name: Rollback on Failure
  if: failure() && steps.deploy.outcome == 'success'
  run: |
    echo "❌ Deployment failed health check, rolling back..."
    ./rollback.sh production ${{ env.PREVIOUS_VERSION }}
```

---

## Validation & Testing

**Infrastructure Validation**:

```bash
# Lint Bicep files
az bicep lint --file infra/main.bicep

# Build Bicep (syntax check)
az bicep build --file infra/main.bicep

# What-if analysis (dry run)
az deployment group what-if \
  --resource-group myapp-dev-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters/dev.parameters.json
```

**Pipeline Testing**:

```yaml
# Test pipeline locally with act
act -j deploy-infrastructure --secret-file .secrets
```

---

## Performance Characteristics

- **Bicep deployment**: 5-10 minutes (typical)
- **Docker build**: 2-5 minutes
- **Application deployment**: 2-3 minutes
- **Total deployment time**: 10-20 minutes
- **Rollback time**: 2-3 minutes

---

## Used By

- **@bicep-specialist Agent**: Creates IaC modules and deployment automation
- **@devops-specialist Agent**: Creates CI/CD pipelines and monitoring

---

## Handoff Chain

```
@azure-architect (resource plan)
  ↓ azure_resources
@bicep-specialist (creates IaC) ← infrastructure-automation skill
  ↓ bicep_modules
@devops-specialist (creates CI/CD) ← infrastructure-automation skill
  ↓ cicd_pipeline
Production Deployment
```

---

## Filename: `infrastructure-automation.skill.md`
