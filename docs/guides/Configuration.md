# Configuration Guide

Complete configuration reference for AgenticCoder.

## Configuration Files

```
.agentic/
└── config/
    ├── settings.yaml      # Main settings
    ├── engine.yaml        # Workflow engine
    ├── validation.yaml    # Validation framework
    ├── learning.yaml      # Self-learning system
    ├── feedback.yaml      # Feedback loop
    └── logging.yaml       # Logging settings

.github/
├── copilot-instructions.md    # Copilot instructions
└── config/
    ├── agents.yaml        # Agent configuration
    ├── phases/            # Phase configurations
    └── scenarios/         # Scenario definitions
```

## Main Settings

### settings.yaml

```yaml
# .agentic/config/settings.yaml

# Project identification
project:
  name: "MyProject"
  version: "1.0.0"
  description: "My AgenticCoder project"
  scenario: "S02"

# Output settings
output:
  baseDir: ".agentic/artifacts/"
  versioning: true
  timestamped: false

# Environment
environment:
  name: "development"  # development, staging, production
  
# Feature flags
features:
  selfLearning: true
  feedbackLoop: true
  parallelExecution: true
  autoValidation: true
```

## Engine Configuration

### engine.yaml

```yaml
# .agentic/config/engine.yaml

engine:
  # Execution mode
  parallelExecution: true
  maxConcurrentAgents: 3
  
  # Timeouts (milliseconds)
  defaultTimeout: 300000      # 5 minutes
  phaseTimeout: 600000        # 10 minutes
  workflowTimeout: 7200000    # 2 hours
  
  # Checkpointing
  checkpointInterval: "phase"  # phase, task, time, none
  checkpointRetention: "7d"
  
  # Retry settings
  retry:
    enabled: true
    maxAttempts: 3
    backoff: "exponential"
    initialDelay: 1000
    maxDelay: 30000
    
  # Recovery
  recovery:
    enabled: true
    autoRestart: false
    preserveState: true
```

### Phase Overrides

```yaml
# Override settings for specific phases
phases:
  5:  # Code Architecture
    timeout: 600000
    retry:
      maxAttempts: 5
      
  13: # Frontend Implementation
    maxConcurrentAgents: 5
    timeout: 900000
```

## Validation Configuration

### validation.yaml

```yaml
# .agentic/config/validation.yaml

validation:
  enabled: true
  
  # Failure behavior
  failOnError: true
  failOnWarning: false
  
  # Auto-fix
  autoFix:
    enabled: true
    safeOnly: true  # Only apply safe fixes
    
  # Validators
  validators:
    schema:
      enabled: true
      schemasDir: ".github/schemas/"
      
    syntax:
      enabled: true
      
    semantic:
      enabled: true
      rules:
        - no-undefined-refs
        - dependency-order
        - consistent-naming
        - complete-coverage
        
    security:
      enabled: true
      secretsPattern: ".agentic/secrets.patterns"
      severityThreshold: "high"
      scanDependencies: true
      
    quality:
      enabled: true
      eslintConfig: ".eslintrc.json"
      minScore: 70
      
  # Reporting
  reporting:
    format: "json"
    outputDir: ".agentic/validation/"
    includeInSummary: true
    generateHtml: false
```

## Learning Configuration

### learning.yaml

```yaml
# .agentic/config/learning.yaml

learning:
  enabled: true
  
  # Metrics collection
  metrics:
    collectAgent: true
    collectPhase: true
    collectWorkflow: true
    retention: "90d"
    aggregationIntervals:
      - "1m"
      - "5m"
      - "1h"
      - "1d"
      
  # Pattern analysis
  patterns:
    analysisInterval: "1h"
    minimumSamples: 10
    confidenceThreshold: 0.8
    
    detect:
      - slow_agents
      - high_retry
      - token_heavy
      - validation_failures
      
  # Optimization
  optimization:
    autoApply: false        # Require approval
    maxChangesPerCycle: 3
    rollbackOnDegrade: true
    
    types:
      - prompt_optimization
      - config_tuning
      - timeout_adjustment
      
  # Reporting
  reporting:
    generateDaily: true
    generateWeekly: true
    outputDir: ".agentic/learning/reports/"
```

## Feedback Configuration

### feedback.yaml

```yaml
# .agentic/config/feedback.yaml

feedback:
  enabled: true
  
  # Iteration settings
  iterations:
    max: 3
    delayBetween: 2000
    
  # Validation integration
  validation:
    failOnError: true
    failOnWarning: false
    
  # Auto-fix
  autoFix:
    formatting: true
    imports: true
    lint: true
    schema: true
    
  # Human approval
  human:
    requireApproval:
      security: true
      architecture: true
      default: false
      
    notificationChannel: "vscode"
    timeout: 300000  # 5 minutes
    
  # Learning integration
  learning:
    recordCorrections: true
    analyzePatterns: true
    suggestImprovements: true
```

## Logging Configuration

### logging.yaml

```yaml
# .agentic/config/logging.yaml

logging:
  # Global level
  level: "info"  # debug, info, warn, error
  
  # Output destinations
  destinations:
    console:
      enabled: true
      format: "pretty"  # pretty, json
      
    file:
      enabled: true
      path: ".agentic/logs/agentic.log"
      maxSize: "10m"
      maxFiles: 5
      format: "json"
      
    vscode:
      enabled: true
      channel: "AgenticCoder"
      
  # Component-specific levels
  components:
    engine: "info"
    agents: "info"
    validation: "warn"
    learning: "info"
    bus: "warn"
    
  # Structured logging fields
  defaultMeta:
    project: "${project.name}"
    environment: "${environment.name}"
```

## Agent Configuration

### agents.yaml

```yaml
# .github/config/agents.yaml

agents:
  # Global defaults
  defaults:
    timeout: 60000
    retries: 2
    temperature: 0.7
    
  # Agent-specific settings
  plan:
    enabled: true
    priority: 1
    timeout: 120000
    skills:
      - project-planning
      - timeline-estimation
      
  architect:
    enabled: true
    priority: 2
    config:
      diagramFormat: "mermaid"
      includeC4: true
      
  bicep-specialist:
    enabled: true
    config:
      avmPreferred: true
      targetScope: "subscription"
      
  # Disable agent for scenario
  cosmos-specialist:
    enabled: false
    reason: "Not needed for this project"
```

## Scenario Configuration

### S02.yaml Example

```yaml
# .github/scenarios/S02.yaml

id: "S02"
name: "Small Team Startup"
description: "Full-stack app with Azure deployment"

# Complexity settings
complexity: "medium"
teamSize: "3-5"
timeline: "4-6 weeks"

# Technology stack
technology:
  frontend: "React"
  backend: ".NET 8"
  database: "Azure SQL"
  cloud: "Azure"
  
# Phase configuration
phases:
  include: "all"
  skip: []
  
# Agent configuration
agents:
  required:
    - plan
    - doc
    - backlog
    - architect
    - code-architect
    - azure-architect
    - bicep-specialist
    - react-specialist
    - dotnet-specialist
    - database-specialist
    - qa
    - devops-specialist
    
  optional:
    - security-specialist
    
# Output structure
outputStructure:
  - plans/
  - docs/
  - architecture/
  - infra/
  - src/
    - frontend/
    - backend/
    - shared/
  - tests/
  - scripts/
  
# Azure resources
azure:
  resourceGroup: "rg-${project.name}-${environment}"
  location: "westeurope"
  
  resources:
    - type: "appService"
      tier: "standard"
    - type: "sqlDatabase"
      tier: "basic"
    - type: "keyVault"
```

## Environment Variables

### Supported Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AGENTIC_CONFIG_PATH` | Config directory | `.agentic/config/` |
| `AGENTIC_LOG_LEVEL` | Log level override | `info` |
| `AGENTIC_SCENARIO` | Default scenario | - |
| `GITHUB_TOKEN` | GitHub API token | - |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription | - |
| `AZURE_TENANT_ID` | Azure tenant | - |
| `DEBUG` | Debug namespaces | - |

### .env File

```env
# .env
AGENTIC_LOG_LEVEL=debug
AGENTIC_SCENARIO=S02

GITHUB_TOKEN=ghp_xxx

AZURE_SUBSCRIPTION_ID=xxx-xxx-xxx
AZURE_TENANT_ID=xxx-xxx-xxx

DEBUG=agentic:*
```

## Variable Substitution

Configuration files support variable substitution:

```yaml
# Use project variables
output:
  baseDir: "${project.name}/artifacts/"
  
# Use environment variables
azure:
  resourceGroup: "rg-${env:PROJECT_NAME}-${environment}"
  
# Use config references
agents:
  timeout: "${engine.defaultTimeout}"
```

## Configuration Precedence

1. **Command line arguments** (highest)
2. **Environment variables**
3. **Project .agentic/config/ files**
4. **User-level config** (~/.agentic/config/)
5. **Default values** (lowest)

## Validating Configuration

```bash
# Validate all configuration
agentic config validate

# Show effective configuration
agentic config show

# Show specific setting
agentic config get engine.timeout

# Set configuration
agentic config set engine.timeout 600000
```

## Next Steps

- [Scenarios](../agents/Scenarios) - Project templates
- [Installation](Installation) - Setup guide
- [Quick Start](../overview/Quick-Start) - First project
