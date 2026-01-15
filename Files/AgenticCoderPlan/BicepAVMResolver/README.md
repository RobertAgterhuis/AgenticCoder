# Bicep AVM Resolver

**Version**: 1.0.0  
**Date**: January 13, 2026  
**Status**: Specification & Implementation  
**Purpose**: Fix @bicep-specialist to use AVM modules instead of custom code  

---

## 🎯 Executive Summary

The **Bicep AVM Resolver (BAR)** fixes a critical issue:

**Problem**: @bicep-specialist generates custom Bicep code instead of using Azure Verified Modules (AVM)  
**Impact**: Custom code is hard to maintain, not aligned with Azure best practices  
**Solution**: Intercept @bicep-specialist output and rewrite to use AVM modules  

Result: Production-grade Bicep templates using Azure's official modules.

---

## 🏗️ Architecture

```
@bicep-specialist Output
    │
    ├─→ Analyze Generated Code
    │   ├─ Parse Bicep template
    │   ├─ Identify resources
    │   └─ Find AVM equivalents
    │
    ├─→ Map to AVM Modules
    │   ├─ Resource type → AVM module
    │   ├─ Parameters → Module inputs
    │   └─ Outputs → Module outputs
    │
    ├─→ Transform Template
    │   ├─ Replace resource blocks with module calls
    │   ├─ Map variables to module parameters
    │   └─ Aggregate outputs
    │
    ├─→ Validate AVM Template
    │   ├─ Check Bicep syntax
    │   ├─ Validate parameter schemas
    │   └─ Verify AVM compatibility
    │
    └─→ Return Optimized Template
        └─ Uses AVM modules throughout
```

---

## 📦 Core Components

### 1. **AVM Module Registry** (`01_avm-registry.md`)
Central database of all available AVM modules with metadata.

### 2. **Resource Analyzer** (`02_resource-analyzer.md`)
Parses Bicep and identifies resources to replace.

### 3. **Module Mapper** (`03_module-mapper.md`)
Maps custom resources to AVM module equivalents.

### 4. **Template Transformer** (`04_template-transformer.md`)
Rewrites Bicep to use AVM modules.

### 5. **Validation Engine** (`05_validation-engine.md`)
Ensures AVM template is valid and equivalent.

### 6. **Optimization Engine** (`06_optimization-engine.md`)
Optimizes parameter passing and module composition.

---

## 🎯 Problem Statement

### Current Behavior (BAD)
```bicep
// @bicep-specialist generates custom resource code
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-09-01' = {
  name: 'st${uniqueString(resourceGroup().id)}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2021-09-01' = {
  name: 'cr${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}
```

**Issues**:
- ❌ Custom resource definitions (hard to update)
- ❌ Not using Azure best practices
- ❌ Doesn't follow organizational standards
- ❌ Difficult to maintain consistency

---

### Desired Behavior (GOOD)
```bicep
// Bicep AVM Resolver transforms to use AVM modules
module storage 'br:acr.azurecr.io/bicep/modules/storage:latest' = {
  name: 'storageModule'
  params: {
    location: location
    storageAccountName: 'st${uniqueString(resourceGroup().id)}'
    kind: 'StorageV2'
    skuName: 'Standard_LRS'
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    httpsTrafficOnly: true
  }
}

module containerRegistry 'br:acr.azurecr.io/bicep/modules/container-registry:latest' = {
  name: 'crModule'
  params: {
    location: location
    registryName: 'cr${uniqueString(resourceGroup().id)}'
    skuName: 'Standard'
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}
```

**Benefits**:
- ✅ Uses official AVM modules
- ✅ Automatically updated with Azure best practices
- ✅ Follows organizational standards
- ✅ Easier to maintain and audit
- ✅ Built-in security and compliance

---

## 🚀 Transformation Process

```
Input Bicep (Custom)
    ↓
1. Analyze Resources
   ├─ Parse: storage, container registry, cosmos db, etc.
   └─ Extract: parameters, properties, outputs
    ↓
2. Map to AVM
   ├─ Storage → br:.../storage:latest
   ├─ Container Registry → br:.../container-registry:latest
   └─ Cosmos → br:.../cosmos-db:latest
    ↓
3. Transform Template
   ├─ Replace resource blocks with module calls
   ├─ Map parameters to module inputs
   └─ Wire outputs from modules
    ↓
4. Validate
   ├─ Bicep syntax check ✓
   ├─ Parameter schema validation ✓
   └─ Equivalence check ✓
    ↓
5. Optimize
   ├─ Consolidate parameters
   ├─ Remove redundant code
   └─ Add naming conventions
    ↓
Output Bicep (AVM-based)
```

---

## 💻 Example Transformations

### Example 1: Storage Account
```bicep
// INPUT (Custom)
resource st 'Microsoft.Storage/storageAccounts@2021-09-01' = {
  name: 'st${env().name}'
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    accessTier: 'Hot'
    httpsTrafficOnly: true
  }
}

// OUTPUT (AVM)
module storage 'br:avm/storage:latest' = {
  name: 'storage'
  params: {
    location: location
    name: 'st${env().name}'
    kind: 'StorageV2'
    skuName: 'Standard_LRS'
    accessTier: 'Hot'
    httpsTrafficOnly: true
  }
}
```

---

### Example 2: App Service
```bicep
// INPUT (Custom)
resource appServicePlan 'Microsoft.Web/serverfarms@2021-03-01' = {
  name: 'asp-${env().name}'
  location: location
  sku: { name: 'B1' }
}

resource webApp 'Microsoft.Web/sites@2021-03-01' = {
  name: 'app-${env().name}'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
  }
}

// OUTPUT (AVM)
module appService 'br:avm/app-service:latest' = {
  name: 'appService'
  params: {
    location: location
    appServicePlanName: 'asp-${env().name}'
    appServicePlanSku: 'B1'
    webAppName: 'app-${env().name}'
    systemAssignedIdentity: true
    httpsOnly: true
  }
}
```

---

## 🎯 AVM Module Mapping

### Storage Resources
```
Resource Type                      → AVM Module
────────────────────────────────────────────────────────
Storage Account                    → br:.../storage
Storage Blob Service               → br:.../storage/blob
Storage File Service               → br:.../storage/file-share
Storage Queue Service              → br:.../storage/queue
Storage Table Service              → br:.../storage/table
```

### Compute Resources
```
App Service Plan                   → br:.../app-service-plan
Web App (App Service)              → br:.../web-app
Container Instance                 → br:.../container-instance
App Service Environment            → br:.../app-service-environment
```

### Container Resources
```
Container Registry                 → br:.../container-registry
Container Registry Webhook         → br:.../container-registry/webhook
Kubernetes Service (AKS)           → br:.../aks
```

### Database Resources
```
SQL Server                         → br:.../sql-server
SQL Database                       → br:.../sql-database
Cosmos DB                          → br:.../cosmos-db
PostgreSQL Server                 → br:.../postgresql-server
MySQL Server                       → br:.../mysql-server
```

### Network Resources
```
Virtual Network                    → br:.../virtual-network
Network Interface                  → br:.../network-interface
Network Security Group             → br:.../network-security-group
Public IP                          → br:.../public-ip
Load Balancer                      → br:.../load-balancer
Application Gateway                → br:.../application-gateway
```

---

## 📊 Configuration

### bicep-avm-resolver.config.json
```json
{
  "enabled": true,
  "avm_registry": "br:avm",
  "module_path": "br:acr.azurecr.io/bicep/modules",
  "default_version": "latest",
  
  "mapping": {
    "Microsoft.Storage/storageAccounts": "br:avm/storage:latest",
    "Microsoft.Web/sites": "br:avm/web-app:latest",
    "Microsoft.ContainerRegistry/registries": "br:avm/container-registry:latest",
    "Microsoft.Sql/servers": "br:avm/sql-server:latest",
    "Microsoft.Sql/servers/databases": "br:avm/sql-database:latest"
  },
  
  "parameter_mapping": {
    "kind": "kind",
    "sku": { "name": "skuName" },
    "properties": { "accessTier": "accessTier" },
    "httpsTrafficOnly": "httpsOnly"
  },
  
  "ignore_resources": [
    "Microsoft.Insights/diagnosticSettings",
    "Microsoft.Authorization/roleAssignments"
  ],
  
  "validation": {
    "enabled": true,
    "check_syntax": true,
    "check_equivalence": true,
    "timeout_ms": 30000
  },
  
  "optimization": {
    "enabled": true,
    "consolidate_parameters": true,
    "remove_redundant": true,
    "apply_naming_conventions": true
  }
}
```

---

## 📁 File Structure

```
BicepAVMResolver/
├── README.md                      # Overview & purpose
├── 01_avm-registry.md             # AVM module database
├── 02_resource-analyzer.md        # Parse Bicep templates
├── 03_module-mapper.md            # Map resources to AVM
├── 04_template-transformer.md     # Rewrite to use AVM
├── 05_validation-engine.md        # Validate AVM templates
├── 06_optimization-engine.md      # Optimize templates
├── COMPLETION_SUMMARY.md          # Integration & summary
├── implementation/
│   ├── avm-registry.ts
│   ├── resource-analyzer.ts
│   ├── module-mapper.ts
│   ├── template-transformer.ts
│   ├── validation-engine.ts
│   └── optimization-engine.ts
├── configs/
│   └── bicep-avm-resolver.config.json
└── examples/
    ├── custom-to-avm.bicep
    └── avm-mapping.json
```

---

## 🏆 Success Criteria

When BAR is working correctly:

1. ✅ All custom Bicep converted to AVM modules
2. ✅ Templates remain functionally equivalent
3. ✅ Validation passes on all transformed templates
4. ✅ Parameter mapping correct
5. ✅ Outputs preserved and available
6. ✅ Security and best practices enforced

---

## 🔗 Integration Points

### Input From
- @bicep-specialist (custom Bicep output)
- AVM Registry (module definitions)

### Output To
- Validation Framework (AVM template validation)
- Artifact Storage (optimized Bicep template)

### Dependencies
- AVM Module Registry (br:avm)
- Bicep parser/compiler
- Parameter validation engine

---

## 💡 Key Concepts

### Idempotent Transformation
Same input always produces same output.

### Equivalence Preservation
Transformed template does same thing as original.

### Best Practice Enforcement
Applies Azure security and compliance standards.

### Parameter Optimization
Consolidates and renames parameters consistently.

---

**Status**: 🟡 **SPECIFICATION IN PROGRESS** → Implementation guide coming.

Next: Read detailed component specifications for AVM resolution.
