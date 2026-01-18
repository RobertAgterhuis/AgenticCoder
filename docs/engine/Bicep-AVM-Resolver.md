# Bicep AVM Resolver

Intelligent Azure Verified Module (AVM) discovery and template generation.

## Overview

The Bicep AVM Resolver:
- **Discovers AVM Modules** - Finds appropriate Azure Verified Modules
- **Analyzes Resources** - Understands resource requirements
- **Maps to Modules** - Matches resources to best AVM modules
- **Generates Templates** - Creates optimized Bicep code
- **Validates Output** - Ensures template correctness

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Bicep AVM Resolver                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    AVM      │  │  Resource   │  │   Module    │         │
│  │  Registry   │  │  Analyzer   │  │   Mapper    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Template   │  │ Validation  │  │Optimization │         │
│  │ Transformer │  │   Engine    │  │   Engine    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### AVM Registry

Maintains catalog of Azure Verified Modules.

```typescript
interface AVMModule {
  name: string;                    // Module name
  version: string;                 // Latest version
  description: string;             // What it provisions
  resourceTypes: string[];         // Azure resource types
  repository: string;              // GitHub repo
  documentationUrl: string;        // Docs link
  
  parameters: {
    required: Parameter[];
    optional: Parameter[];
  };
  
  outputs: Output[];
  
  tags: string[];                  // Categorization
}
```

**Registry Sources:**
- Azure/bicep-registry-modules (GitHub)
- Local cache (`.agentic/avm-cache/`)

```bash
# Update AVM registry cache
node bin/agentic.js avm update

# Search modules
node bin/agentic.js avm search "app service"
```

### Resource Analyzer

Analyzes architecture requirements to determine needed resources.

```typescript
interface ResourceRequirement {
  resourceType: string;           // e.g., "Microsoft.Web/sites"
  purpose: string;                // e.g., "Frontend hosting"
  tier: 'basic' | 'standard' | 'premium';
  
  requirements: {
    scalability: 'low' | 'medium' | 'high';
    availability: 'standard' | 'high' | 'geo-redundant';
    security: 'standard' | 'enhanced';
  };
  
  connections: {
    dependsOn: string[];          // Other resources
    connectsTo: string[];         // Network connections
  };
}
```

**Input Sources:**
- Architecture documents
- Scenario configuration
- User requirements

### Module Mapper

Maps resource requirements to AVM modules.

```typescript
class ModuleMapper {
  async map(requirements: ResourceRequirement[]): Promise<ModuleMapping[]> {
    const mappings: ModuleMapping[] = [];
    
    for (const req of requirements) {
      // Find best matching AVM module
      const candidates = await this.findCandidates(req.resourceType);
      const best = this.selectBest(candidates, req);
      
      mappings.push({
        requirement: req,
        module: best,
        parameters: this.inferParameters(req, best),
        confidence: this.calculateConfidence(req, best)
      });
    }
    
    return mappings;
  }
}
```

**Mapping Strategy:**

| Resource Type | Primary AVM Module |
|---------------|-------------------|
| App Service | `avm/res/web/site` |
| Azure SQL | `avm/res/sql/server` |
| Storage Account | `avm/res/storage/storage-account` |
| Key Vault | `avm/res/key-vault/vault` |
| Virtual Network | `avm/res/network/virtual-network` |
| Container App | `avm/res/app/container-app` |

### Template Transformer

Generates Bicep templates from mappings.

```typescript
interface TemplateOutput {
  mainBicep: string;              // main.bicep content
  modules: ModuleFile[];          // Module files
  parameters: ParameterFile;       // Parameters file
  
  structure: {
    files: string[];
    dependencies: DependencyGraph;
  };
}
```

**Generated Structure:**

```
infra/
├── main.bicep                # Main orchestration
├── main.parameters.json      # Parameter values
├── modules/
│   ├── app-service.bicep    # App Service module
│   ├── sql-server.bicep     # SQL Server module
│   └── key-vault.bicep      # Key Vault module
└── shared/
    ├── naming.bicep         # Naming convention
    └── tags.bicep           # Common tags
```

### Validation Engine

Validates generated templates.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  
  checks: {
    syntax: boolean;
    schema: boolean;
    bestPractices: boolean;
    security: boolean;
    cost: CostEstimate;
  };
}
```

**Validation Checks:**
- Bicep syntax validation
- ARM schema compliance
- Security best practices
- Cost estimation
- Naming conventions

### Optimization Engine

Optimizes templates for performance and cost.

```typescript
interface OptimizationResult {
  optimizations: Optimization[];
  savings: {
    cost: CostSavings;
    complexity: number;
  };
}

interface Optimization {
  type: 'cost' | 'performance' | 'security' | 'simplification';
  description: string;
  impact: 'low' | 'medium' | 'high';
  applied: boolean;
}
```

**Optimization Types:**
- SKU right-sizing
- Reserved capacity recommendations
- Resource consolidation
- Security hardening

## Usage

### CLI Commands

```bash
# Analyze architecture and generate Bicep
node bin/agentic.js bicep generate --arch architecture.md

# Resolve specific resource to AVM
node bin/agentic.js avm resolve "Microsoft.Web/sites"

# Validate Bicep template
node bin/agentic.js bicep validate infra/main.bicep

# Optimize existing template
node bin/agentic.js bicep optimize infra/main.bicep
```

### Programmatic API

```typescript
const resolver = new BicepAVMResolver();

// Generate from requirements
const template = await resolver.generate({
  scenario: 'S02',
  resources: [
    { type: 'appService', tier: 'standard' },
    { type: 'sqlDatabase', tier: 'basic' },
    { type: 'keyVault' }
  ]
});

// Write files
await template.writeToDirectory('./infra');
```

## Generated Templates

### Main Template

```bicep
// main.bicep
targetScope = 'subscription'

@description('Environment name')
param environment string = 'dev'

@description('Azure region')
param location string = 'westeurope'

@description('Project name')
param projectName string

// Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${projectName}-${environment}'
  location: location
  tags: {
    Environment: environment
    Project: projectName
    ManagedBy: 'AgenticCoder'
  }
}

// Modules
module appService 'modules/app-service.bicep' = {
  scope: rg
  name: 'appService'
  params: {
    name: 'app-${projectName}-${environment}'
    location: location
    // ...
  }
}
```

### AVM Module Reference

```bicep
// modules/app-service.bicep
module appService 'br/public:avm/res/web/site:0.3.0' = {
  name: 'appServiceDeployment'
  params: {
    name: name
    location: location
    kind: 'app'
    serverFarmResourceId: appServicePlan.outputs.resourceId
    
    // AVM standard parameters
    managedIdentities: {
      systemAssigned: true
    }
    
    appSettingsKeyValuePairs: {
      WEBSITE_NODE_DEFAULT_VERSION: '~18'
    }
    
    diagnosticSettings: [
      {
        workspaceResourceId: logAnalytics.outputs.resourceId
      }
    ]
  }
}
```

## Configuration

### Resolver Configuration

```yaml
# .agentic/config/bicep.yaml
bicep:
  avm:
    preferLatest: true
    allowPrerelease: false
    cacheDir: '.agentic/avm-cache/'
    
  generation:
    targetScope: 'subscription'
    modulePattern: 'modules/{resource}.bicep'
    namingConvention: 'kebab-case'
    
  validation:
    syntaxCheck: true
    schemaCheck: true
    securityCheck: true
    costEstimate: true
    
  optimization:
    autoOptimize: true
    costThreshold: 100  # USD/month
```

### AVM Preferences

```yaml
# Preferred module versions
avmVersions:
  'avm/res/web/site': '0.3.0'
  'avm/res/sql/server': '0.2.0'
  
# Module overrides
avmOverrides:
  'Microsoft.Web/sites':
    module: 'custom/web-site'  # Use custom module
```

## Integration

### With Bicep Specialist Agent

```typescript
const bicepAgent = agents.get('bicep-specialist');

bicepAgent.on('generate:start', async (context) => {
  // Use AVM resolver
  const mappings = await avmResolver.mapRequirements(context.requirements);
  context.avmMappings = mappings;
});
```

### With Azure Infrastructure Agent

```typescript
const azureAgent = agents.get('azure-infrastructure');

azureAgent.on('deploy:before', async (template) => {
  // Validate before deployment
  const validation = await avmResolver.validate(template);
  if (!validation.valid) {
    throw new ValidationError(validation.errors);
  }
});
```

### With Validation Framework

```typescript
validationFramework.register('bicep', {
  validate: async (file) => {
    return avmResolver.validate(file);
  }
});
```

## Best Practices

### AVM Module Selection

1. **Prefer AVM over custom** - Use verified modules when available
2. **Pin versions** - Lock module versions for reproducibility
3. **Check compatibility** - Verify module supports required features
4. **Review parameters** - Understand all required/optional params

### Template Organization

1. **Modular structure** - One module per logical resource
2. **Shared resources** - Extract common patterns
3. **Environment separation** - Use parameters for env differences
4. **Output dependencies** - Chain modules via outputs

### Security

1. **Key Vault integration** - Store secrets in Key Vault
2. **Managed identities** - Prefer over connection strings
3. **Network isolation** - Use Private Endpoints where possible
4. **Diagnostic settings** - Enable logging for all resources

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Module not found | Old cache | Run `avm update` |
| Version conflict | Incompatible versions | Pin compatible versions |
| Validation fails | Schema mismatch | Check module documentation |
| Deployment fails | Missing dependencies | Check dependency order |

### Debug Mode

```bash
# Verbose output
node bin/agentic.js bicep generate --arch arch.md --verbose

# Dry run (no file writes)
node bin/agentic.js bicep generate --arch arch.md --dry-run

# Show mappings only
node bin/agentic.js bicep generate --arch arch.md --show-mappings
```

## Next Steps

- [Azure Architecture](../guides/Azure-Architecture) - Design patterns
- [Bicep Specialist](../agents/Catalog#bicep-specialist) - Agent details
- [Validation Framework](Validation-Framework) - Template validation
