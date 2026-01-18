# Creating Custom Scenarios

Guide to creating custom scenarios for AgenticCoder projects.

## Scenario Overview

Scenarios are project templates that define:
- Target audience and team composition
- Technology stack preferences
- Phase configurations
- Agent selection and ordering
- Output structure and artifacts

## Built-in Scenarios

| ID | Name | Target | Complexity |
|----|------|--------|------------|
| S01 | Solo Developer | Individual developer | Low |
| S02 | Small Team Startup | 3-5 person team | Medium |
| S03 | Enterprise Team | Large enterprise | High |
| S04 | Agency/Consulting | Multi-client agency | High |
| S05 | Open Source Project | Community-driven | Medium |

## Scenario Structure

### Minimal Scenario

```yaml
# .github/scenarios/custom.yaml

id: "C01"
name: "Custom Scenario"
description: "My custom project template"

technology:
  frontend: "React"
  backend: ".NET 8"
  cloud: "Azure"
```

### Full Scenario Structure

```yaml
# .github/scenarios/my-scenario.yaml

# Identification
id: "C01"
name: "My Custom Scenario"
description: "Detailed description of this scenario's purpose and use case"
version: "1.0.0"

# Target audience
target:
  audience: "Enterprise development teams"
  teamSize: "10-20"
  experience: "senior"
  timeline: "3-6 months"

# Complexity
complexity: "high"
estimatedHours: 200

# Technology stack
technology:
  frontend: "React"
  frontendFramework: "Next.js"
  backend: ".NET 8"
  backendFramework: "Minimal APIs"
  database: "Azure SQL"
  cache: "Redis"
  messaging: "Azure Service Bus"
  cloud: "Azure"
  containerization: "Docker"
  orchestration: "AKS"

# Phase configuration
phases:
  include: "all"  # or specific phases: [1, 2, 3, 5, 7, 10, 13, 14, 15]
  skip: []
  
  # Phase-specific settings
  config:
    5:  # Code Architecture
      depth: "detailed"
      includePatterns: true
      
    13: # Frontend Implementation
      componentLibrary: "Material-UI"
      stateManagement: "Redux Toolkit"
      
    14: # Backend Implementation
      apiStyle: "REST"
      includeGraphQL: true

# Agent configuration
agents:
  required:
    - plan
    - doc
    - backlog
    - architect
    - security-architect
    - code-architect
    - azure-architect
    - bicep-specialist
    - react-specialist
    - dotnet-specialist
    - database-specialist
    - qa
    - devops-specialist
    - performance-engineer
    
  optional:
    - ai-ml-specialist
    - accessibility-specialist
    
  disabled:
    - mobile-specialist
    - ios-specialist
    - android-specialist
    
  # Agent-specific config
  config:
    bicep-specialist:
      avmPreferred: true
      targetScope: "subscription"
      
    security-architect:
      complianceFrameworks:
        - SOC2
        - GDPR

# Output structure
output:
  baseDir: ".agentic/artifacts/"
  structure:
    - plans/
    - docs/
        - architecture/
        - api/
        - user/
    - architecture/
        - diagrams/
        - decisions/
    - infra/
        - bicep/
        - terraform/
        - scripts/
    - src/
        - frontend/
            - components/
            - pages/
            - hooks/
            - store/
        - backend/
            - api/
            - services/
            - data/
        - shared/
            - types/
            - utils/
    - tests/
        - unit/
        - integration/
        - e2e/
    - scripts/
        - build/
        - deploy/
        - dev/

# Azure configuration
azure:
  subscription: "${env:AZURE_SUBSCRIPTION_ID}"
  resourceGroup: "rg-${project.name}-${environment}"
  location: "westeurope"
  
  naming:
    convention: "kebab-case"
    prefix: "myorg"
    
  resources:
    appService:
      tier: "PremiumV3"
      scaling:
        min: 2
        max: 10
        
    sql:
      tier: "Business Critical"
      
    storage:
      replication: "GRS"
      
    keyVault:
      sku: "Premium"
      softDelete: true

# Workflow customization
workflow:
  parallelExecution: true
  maxConcurrentAgents: 5
  
  checkpoints:
    afterPhase: true
    requireApproval:
      - 3  # After architecture
      - 10 # After Azure architecture
      
  validation:
    failOnWarning: true
    securityScan: true
    
# Documentation requirements
documentation:
  level: "comprehensive"
  formats:
    - markdown
    - pdf
    
  sections:
    - architecture
    - api
    - deployment
    - operations
    - security
```

## Creating Your First Scenario

### Step 1: Define Requirements

```yaml
# scenario-planning.yaml

name: "Microservices E-commerce"
purpose: "Template for microservices-based e-commerce platforms"

requirements:
  - Support multiple services (5-10)
  - Event-driven communication
  - Kubernetes deployment
  - High availability
  - Multi-region support
```

### Step 2: Create Scenario File

```yaml
# .github/scenarios/microservices-ecommerce.yaml

id: "ME01"
name: "Microservices E-commerce"
description: |
  Template for building microservices-based e-commerce platforms
  with event-driven architecture, Kubernetes deployment, and
  multi-region support.
version: "1.0.0"

target:
  audience: "Enterprise e-commerce teams"
  teamSize: "15-30"
  experience: "senior"
  timeline: "6-12 months"

complexity: "high"
estimatedHours: 500

technology:
  frontend: "React"
  frontendFramework: "Next.js"
  backend: ".NET 8"
  backendFramework: "Minimal APIs"
  database: "PostgreSQL"
  cache: "Redis"
  messaging: "Azure Service Bus"
  search: "Elasticsearch"
  cloud: "Azure"
  containerization: "Docker"
  orchestration: "AKS"

# Microservices definition
microservices:
  - name: "catalog-service"
    responsibility: "Product catalog management"
    database: "PostgreSQL"
    
  - name: "order-service"
    responsibility: "Order processing"
    database: "PostgreSQL"
    messaging: true
    
  - name: "inventory-service"
    responsibility: "Inventory management"
    database: "PostgreSQL"
    messaging: true
    
  - name: "payment-service"
    responsibility: "Payment processing"
    database: "PostgreSQL"
    
  - name: "notification-service"
    responsibility: "User notifications"
    messaging: true
    
  - name: "api-gateway"
    responsibility: "API routing and auth"
    type: "gateway"

phases:
  include: "all"
  config:
    5:  # Code Architecture
      pattern: "microservices"
      ddd: true
      
    7:  # Infrastructure Planning
      multiRegion: true
      highAvailability: true
      
    14: # Backend Implementation
      serviceTemplate: "microservice"
      messagingPattern: "event-driven"

agents:
  required:
    - plan
    - doc
    - backlog
    - architect
    - security-architect
    - code-architect
    - azure-architect
    - bicep-specialist
    - kubernetes-specialist
    - react-specialist
    - dotnet-specialist
    - database-specialist
    - messaging-specialist
    - qa
    - devops-specialist
    - performance-engineer
    - sre-specialist
    
  config:
    architect:
      pattern: "microservices"
      communicationStyle: "event-driven"
      
    kubernetes-specialist:
      platform: "AKS"
      serviceCount: 6
      
azure:
  resourceGroup: "rg-ecommerce-${environment}"
  location: "westeurope"
  secondaryLocation: "northeurope"
  
  resources:
    aks:
      tier: "Standard"
      nodeCount: 5
      nodeSize: "Standard_D4s_v3"
      
    postgresql:
      tier: "General Purpose"
      
    serviceBus:
      tier: "Premium"
      
    redis:
      tier: "Premium"
      
    apim:
      tier: "Developer"  # Premium for production

output:
  structure:
    - plans/
    - docs/
    - architecture/
        - c4/
        - sequence/
        - domain/
    - infra/
        - bicep/
        - helm/
        - terraform/
    - services/
        - catalog-service/
        - order-service/
        - inventory-service/
        - payment-service/
        - notification-service/
        - api-gateway/
    - shared/
        - libraries/
        - contracts/
    - tests/
    - scripts/
```

### Step 3: Create Scenario Documentation

```markdown
<!-- .github/scenarios/docs/ME01.md -->

# ME01: Microservices E-commerce

## Overview

Template for microservices-based e-commerce platforms.

## Use Cases

- Building new e-commerce platforms
- Migrating monoliths to microservices
- Adding microservices to existing platforms

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway                           │
└────────────────────────────┬────────────────────────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
┌──────▼──────┐      ┌───────▼───────┐     ┌──────▼──────┐
│   Catalog   │      │    Orders     │     │  Inventory  │
│   Service   │      │    Service    │     │   Service   │
└──────┬──────┘      └───────┬───────┘     └──────┬──────┘
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Service Bus   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
       │  Payments   │ │Notifications│ │  Analytics │
       └─────────────┘ └───────────┘ └─────────────┘
```

## Getting Started

1. Initialize project with scenario
2. Review generated architecture
3. Approve service boundaries
4. Generate infrastructure
5. Implement services
6. Deploy to AKS
```

### Step 4: Register Scenario

```yaml
# .github/config/scenarios.yaml

scenarios:
  - id: "ME01"
    file: "scenarios/microservices-ecommerce.yaml"
    enabled: true
    tags:
      - microservices
      - e-commerce
      - enterprise
```

## Scenario Configuration Options

### Phase Configuration

```yaml
phases:
  # Include all phases
  include: "all"
  
  # Or specific phases
  include: [1, 2, 3, 5, 7, 10, 13, 14, 15]
  
  # Skip phases
  skip: [4, 6]  # Skip backlog and validation phases
  
  # Phase-specific settings
  config:
    5:
      outputFormat: "detailed"
      includePatterns: true
      includeAntiPatterns: true
```

### Agent Configuration

```yaml
agents:
  # Required agents (must be available)
  required:
    - plan
    - architect
    - code-architect
    
  # Optional agents (use if available)
  optional:
    - security-specialist
    - performance-engineer
    
  # Explicitly disabled
  disabled:
    - mobile-specialist
    
  # Agent-specific settings
  config:
    architect:
      diagramStyle: "C4"
      includeSequence: true
      
    bicep-specialist:
      avmPreferred: true
      validateCompliance: true
```

### Technology Stack

```yaml
technology:
  # Frontend
  frontend: "React"
  frontendFramework: "Next.js"
  frontendUI: "Tailwind CSS"
  stateManagement: "Redux Toolkit"
  
  # Backend
  backend: ".NET 8"
  backendFramework: "Minimal APIs"
  
  # Data
  database: "PostgreSQL"
  cache: "Redis"
  search: "Elasticsearch"
  
  # Messaging
  messaging: "Azure Service Bus"
  eventStore: "Event Store"
  
  # Cloud
  cloud: "Azure"
  containerization: "Docker"
  orchestration: "AKS"
  
  # DevOps
  cicd: "GitHub Actions"
  iac: "Bicep"
```

### Output Structure

```yaml
output:
  baseDir: ".agentic/artifacts/"
  versioning: true
  
  structure:
    - plans/
        - project-plan.md
        - timeline.md
    - docs/
        - architecture/
        - api/
    - src/
        - frontend/
        - backend/
    - infra/
    - tests/
```

## TypeScript Scenario Definition

```typescript
// src/scenarios/microservices-ecommerce.ts

import { Scenario, ScenarioConfig } from '@agentic/core';

export const microservicesEcommerce: Scenario = {
  id: 'ME01',
  name: 'Microservices E-commerce',
  description: 'Microservices-based e-commerce platform template',
  version: '1.0.0',
  
  target: {
    audience: 'Enterprise teams',
    teamSize: { min: 15, max: 30 },
    experience: 'senior',
    timeline: { min: 6, max: 12, unit: 'months' }
  },
  
  complexity: 'high',
  estimatedHours: 500,
  
  technology: {
    frontend: 'React',
    frontendFramework: 'Next.js',
    backend: '.NET 8',
    database: 'PostgreSQL',
    cloud: 'Azure',
    orchestration: 'AKS'
  },
  
  phases: {
    include: 'all',
    config: {
      5: { pattern: 'microservices', ddd: true }
    }
  },
  
  agents: {
    required: [
      'plan', 'architect', 'code-architect',
      'azure-architect', 'kubernetes-specialist'
    ],
    optional: ['sre-specialist'],
    config: {
      'architect': { pattern: 'microservices' }
    }
  }
};
```

## Scenario Registry

```typescript
// src/scenarios/registry.ts

import { ScenarioRegistry } from '@agentic/core';
import { microservicesEcommerce } from './microservices-ecommerce';

export const scenarioRegistry = new ScenarioRegistry();

// Register scenarios
scenarioRegistry.register(microservicesEcommerce);

// Get by ID
const scenario = scenarioRegistry.get('ME01');

// Get by tag
const enterpriseScenarios = scenarioRegistry.getByTag('enterprise');

// Get all
const allScenarios = scenarioRegistry.getAll();
```

## Validating Scenarios

```bash
# Validate scenario file
agentic scenario validate ME01

# Check agent availability
agentic scenario check ME01 --agents

# Preview output structure
agentic scenario preview ME01 --output

# Dry run with scenario
agentic run --scenario ME01 --dry-run
```

## Scenario Best Practices

### 1. Clear Target Audience

```yaml
# ✅ Good: Specific target
target:
  audience: "Enterprise e-commerce teams building multi-region platforms"
  teamSize: "15-30"
  experience: "senior"
  timeline: "6-12 months"

# ❌ Bad: Vague target
target:
  audience: "Developers"
```

### 2. Appropriate Agent Selection

```yaml
# ✅ Good: Agents match scenario
agents:
  required:
    - architect           # Core architecture
    - kubernetes-specialist  # For AKS deployment
    - messaging-specialist   # For event-driven

# ❌ Bad: Generic agents only
agents:
  required:
    - plan
    - doc
```

### 3. Realistic Complexity

```yaml
# ✅ Good: Honest complexity
complexity: "high"
estimatedHours: 500
target:
  timeline: "6-12 months"

# ❌ Bad: Unrealistic estimates
complexity: "low"
estimatedHours: 50
target:
  timeline: "1 week"  # For microservices platform?
```

### 4. Complete Output Structure

```yaml
# ✅ Good: Comprehensive structure
output:
  structure:
    - plans/
    - docs/
        - architecture/
        - api/
    - services/
        - catalog/
        - orders/
    - infra/
    - tests/
        - unit/
        - integration/
        - e2e/

# ❌ Bad: Minimal structure
output:
  structure:
    - code/
```

## Extending Built-in Scenarios

```yaml
# .github/scenarios/custom-startup.yaml

# Extend S02 (Small Team Startup)
extends: "S02"

id: "CS01"
name: "Custom Startup"

# Override specific settings
technology:
  database: "MongoDB"  # Changed from Azure SQL
  
agents:
  required:
    - mongodb-specialist  # Added
    
  disabled:
    - database-specialist  # Using MongoDB specialist instead
```

## Next Steps

- [Scenarios Reference](../agents/Scenarios) - Built-in scenarios
- [Building Agents](Building-Agents) - Custom agents
- [Configuration](Configuration) - System settings
