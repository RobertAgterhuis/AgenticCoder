# AgenticCoder Plan-G: Scenario Specifications

**Status**: New Addition (January 13, 2026)  
**Purpose**: Complete test scenarios for v1.0 validation  
**Approach**: Each scenario is a complete end-to-end workflow example  
**Scope**: 5 core scenarios (S01-S05) + testing approach

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Part 1: Scenario Framework & Approach](#part-1-scenario-framework--approach)
3. [Part 2: Scenario S01 - Simple App Service](#part-2-scenario-s01--simple-app-service)
4. [Part 3: Scenario S02 - Hub-Spoke Network](#part-3-scenario-s02--hub-spoke-network)
5. [Part 4: Scenario S03 - App Service + SQL Database](#part-4-scenario-s03--app-service--sql-database)
6. [Part 5: Scenario S04 - Multi-Tier Application](#part-5-scenario-s04--multi-tier-application)
7. [Part 6: Scenario S05 - High-Availability Setup](#part-6-scenario-s05--high-availability-setup)
8. [Part 7: Testing Strategy & Validation](#part-7-testing-strategy--validation)

---

## Executive Summary

### What are Scenarios?

**Definition**: End-to-end workflow examples that test all phases (Phase 0-7) with real requirements.

**Why Scenarios?**
- ✅ Validate agents work together correctly
- ✅ Test MCP server integration
- ✅ Verify Bicep generation quality
- ✅ Document expected behavior
- ✅ Enable regression testing
- ✅ Provide learning examples

### V1.0 Scenario Coverage

**5 Core Scenarios**:
1. **S01**: Simple App Service (baseline, fastest)
2. **S02**: Hub-Spoke Network (networking, advanced)
3. **S03**: App Service + SQL Database (data layer)
4. **S04**: Multi-Tier Application (full stack)
5. **S05**: High-Availability Setup (production ready)

**Progression**:
- S01: Simplest (30 min execution)
- S02-S03: Intermediate (60 min each)
- S04: Complex (90 min)
- S05: Most complex (120+ min, optional for v1.0)

### What Gets Tested

Per scenario:
- ✅ Phase 0: Discovery (user input capture)
- ✅ Phase 1: Requirements parsing
- ✅ Phase 2: WAF assessment + cost estimation
- ✅ Phase 3: Design artifacts generation
- ✅ Phase 4: Bicep planning + governance
- ✅ Phase 5: Bicep code generation
- ✅ Phase 6: Azure deployment (what-if)
- ✅ Phase 7: Documentation generation

---

## Part 1: Scenario Framework & Approach

### 1.1 Scenario Structure Template

Each scenario has:

```yaml
Metadata:
  name: S01 - Simple App Service
  complexity: Basic
  execution_time: 30 min
  target_version: v1.0
  
User Input (Phase 0):
  discovery_answers: [answers to 22 questions]
  
Expected Artifacts (Per Phase):
  phase_0: [project-plan.md]
  phase_1: [01-requirements.md]
  phase_2: [02-assessment.md, cost-estimate.md, architecture-diagram.md]
  phase_3: [03-design.md, adr-*.md]
  phase_4: [04-plan.md, governance-findings.md]
  phase_5: [05-implementation.md, bicep-templates/]
  phase_7: [07-asbuilt.md, reference-architecture.md]

Success Criteria:
  - All phases complete without error
  - Bicep validates with `bicep build`
  - Cost estimate within 10% accuracy
  - Documentation complete
  - WAF assessment includes all 5 pillars

Test Data:
  input_files: [requirements.md, discovery.json]
  expected_output_files: [list of all files]
  validation_scripts: [script to verify outputs]
```

### 1.2 How Scenarios Work

**Scenario Execution Flow**:

```
1. User provides input (Phase 0)
   └─ 22 discovery questions answered
   └─ Project plan generated
   
2. @plan agent processes (Phase 1)
   └─ Validates requirements
   └─ Parses into requirements doc
   
3. azure-principal-architect assesses (Phase 2)
   └─ WAF assessment (5 pillars)
   └─ Cost estimation via azure-pricing-mcp
   └─ Architecture diagram generation
   
4. Design agents generate (Phase 3)
   └─ Design decisions
   └─ Architecture Decision Records (ADRs)
   
5. bicep-plan prepares (Phase 4)
   └─ Resource specifications
   └─ Governance checks via azure-resource-graph-mcp
   └─ Implementation plan with Bicep outline
   
6. bicep-implement generates (Phase 5)
   └─ Bicep templates from plan
   └─ Deployment script
   └─ Validation scripts
   
7. deploy-coordinator deploys (Phase 6)
   └─ What-if analysis
   └─ Actual deployment (if approved)
   
8. doc-writer finalizes (Phase 7)
   └─ As-built documentation
   └─ Reference architecture
   └─ Troubleshooting guide
```

### 1.3 Scenario Test Data Format

**Input File**: `test-data/S01-requirements.json`
```json
{
  "scenario": "S01",
  "phase_0": {
    "discovery": {
      "q1_project_name": "Simple Web App",
      "q2_organization": "Contoso",
      "q3_environment": "Production",
      // ... all 22 questions
    }
  },
  "expected_outputs": {
    "phase_1": ["01-requirements.md"],
    "phase_2": ["02-assessment.md", "cost-estimate.md"],
    // ... per phase
  },
  "validation": {
    "cost_estimate_range": [100, 500],  // $/month
    "bicep_resources_min": 2,
    "bicep_resources_max": 5,
    "documentation_sections": ["Overview", "Architecture", "Cost", "Security"]
  }
}
```

---

## Part 2: Scenario S01 - Simple App Service

### 2.1 Scenario Overview

**Name**: Simple Web App  
**Complexity**: Basic  
**Time**: 30 minutes execution  
**Agents Used**: 8 core (all except specialized)  
**MCP Calls**: 3-5 (pricing + docs)  
**Resources Created**: 3-5 (App Service, App Service Plan, Storage)  
**Monthly Cost**: $100-150

### 2.2 User Requirements Input (Phase 0)

```yaml
Discovery Answers (22 questions):
  Project:
    name: "Simple Web App"
    description: "Basic web application for internal team"
    type: "Web Application"
    
  Organization:
    name: "Contoso"
    size: "Medium"
    maturity: "Intermediate"
    
  Environment:
    target: "Azure"
    regions: ["East US 2"]
    environments: ["Production"]
    
  Technology:
    languages: ["C#", ".NET 8"]
    framework: "ASP.NET Core"
    database: "No (static content)"
    
  Requirements:
    availability: "99.5% uptime"
    scale: "50 concurrent users"
    compliance: "None (internal)"
    security: "Standard (HTTPS)"
    
  Timeline:
    start: "Immediate"
    deadline: "2 weeks"
```

**Expected Output (Phase 0)**:
- `project-plan.md` - Generated project plan
- `discovery.json` - Structured answers

### 2.3 Expected Artifacts (Per Phase)

**Phase 1: Requirements**
```
01-requirements.md
├─ Project Overview
├─ Functional Requirements
│  ├─ Web app deployment
│  ├─ 50 concurrent user support
│  └─ HTTPS endpoint
├─ Non-Functional Requirements
│  ├─ 99.5% availability
│  ├─ <2s page load
│  └─ Disaster recovery: 4-hour RPO
└─ Constraints
   ├─ Budget: <$200/month
   └─ Timeline: 2 weeks
```

**Phase 2: Assessment**
```
02-assessment.md
├─ WAF Pillar Assessment
│  ├─ Security: ✅ HTTPS, managed identity
│  ├─ Reliability: ✅ App Service multi-instance
│  ├─ Performance: ✅ CDN recommended
│  ├─ Cost: ✅ $120/month estimated
│  └─ Ops: ✅ Monitoring via Application Insights
├─ Architecture Diagram (ASCII/Mermaid)
└─ Risk Assessment

cost-estimate.md
├─ App Service Plan (P1v2): $73/month
├─ Storage Account: $5/month
├─ Application Insights: $10/month (estimated)
├─ Total: ~$88/month (well under $200 budget)
└─ Savings Opportunities
   └─ Use Standard plan instead of Premium: Could save $40/month
```

**Phase 3: Design**
```
03-design.md
├─ Architecture Decision Records (2-3)
│  ├─ ADR-001: Why App Service Plan P1v2
│  ├─ ADR-002: Why CDN not required initially
│  └─ ADR-003: Managed Identity for deployment
└─ Deployment Architecture
   └─ App Service → Application Insights
      └─ Storage for assets
```

**Phase 4: Planning**
```
04-plan.md
├─ Resource Specifications
│  ├─ AppServicePlan: P1v2 (2 instances), Linux
│  ├─ AppService: Node.js 20 LTS runtime
│  ├─ StorageAccount: Standard GRS
│  └─ ApplicationInsights: Standard
├─ Governance Findings
│  ├─ Compliance: ✅ No violations
│  ├─ Naming: ✅ Follows CAF conventions
│  └─ Tags: ✅ Applied correctly
├─ Bicep Implementation Outline
│  └─ Parameters, variables, resources
└─ Deployment Order
   └─ 1. Storage, 2. App Service Plan, 3. App Service
```

**Phase 5: Implementation**
```
bicep-templates/
├─ main.bicep (main entry point)
├─ app-service.bicep (module)
├─ storage.bicep (module)
├─ monitoring.bicep (module)
├─ parameters.json (dev parameters)
├─ parameters-prod.json (prod parameters)
└─ deploy.sh (deployment script)

05-implementation.md
├─ Bicep Generation Summary
├─ Template Structure
├─ Parameters Reference
├─ Deployment Instructions
└─ Validation Results
   └─ bicep build: ✅ Success
   └─ bicep lint: ✅ 0 warnings
```

**Phase 6: Deployment (What-If)**
```
06-deployment.md
├─ What-if Analysis
│  ├─ Resource Group: Will be created
│  ├─ App Service Plan: Will be created
│  ├─ App Service: Will be created
│  └─ Storage: Will be created
├─ Estimated Changes
│  ├─ 4 new resources
│  └─ ~$88/month cost impact
└─ Approval: READY FOR DEPLOYMENT
```

**Phase 7: As-Built**
```
07-asbuilt.md
├─ Deployed Resource Details
│  ├─ App Service: contoso-web-prod.azurewebsites.net
│  ├─ App Service Plan: contoso-asp-prod
│  └─ Resource Group: rg-contoso-web-prod
├─ Access URLs
│  └─ Application: https://contoso-web-prod.azurewebsites.net
├─ Monitoring
│  └─ Application Insights Instrumentation Key: ***
└─ Troubleshooting Guide
   ├─ Common Issues
   └─ Support Links

reference-architecture.md
├─ Architecture Diagram
├─ Data Flow
├─ Security Posture
└─ Performance Characteristics
```

### 2.4 Success Criteria for S01

```yaml
Execution:
  - ✅ All 7 phases complete without errors
  - ✅ No manual agent interventions needed
  - ✅ Execution time: 25-35 minutes
  
Output Quality:
  - ✅ All 8+ documents generated
  - ✅ Bicep validates with bicep build
  - ✅ Cost estimate: $80-120/month (actual: ~$88)
  - ✅ 0 linting errors
  
Content Quality:
  - ✅ All WAF pillars assessed
  - ✅ Security recommendations present
  - ✅ Cost breakdown detailed
  - ✅ Architecture documented
  
Testing:
  - ✅ Bicep deployment succeeds
  - ✅ What-if shows correct changes
  - ✅ 4 resources created
  - ✅ Application accessible
```

### 2.5 Test Data & Validation

**Test File**: `test-data/S01-simple-app-service.json`

```json
{
  "scenario": "S01",
  "metadata": {
    "name": "Simple Web App",
    "complexity": "Basic",
    "estimated_time_minutes": 30
  },
  "input": {
    "discovery": {
      "project_name": "Simple Web App",
      "organization": "Contoso",
      "environment": "Production",
      "language": "C#, .NET 8",
      "database_required": false,
      "availability_target": "99.5%",
      "concurrent_users": 50,
      "budget_monthly": 200
    }
  },
  "expected_artifacts": {
    "phase_0": ["project-plan.md", "discovery.json"],
    "phase_1": ["01-requirements.md"],
    "phase_2": ["02-assessment.md", "cost-estimate.md"],
    "phase_3": ["03-design.md"],
    "phase_4": ["04-plan.md"],
    "phase_5": ["05-implementation.md", "bicep-templates/main.bicep"],
    "phase_7": ["07-asbuilt.md", "reference-architecture.md"]
  },
  "validation": {
    "cost_estimate_min": 80,
    "cost_estimate_max": 120,
    "currency": "USD",
    "bicep_resources": ["Microsoft.Web/serverfarms", "Microsoft.Web/sites", "Microsoft.Storage/storageAccounts"],
    "waf_pillars": ["Security", "Reliability", "Performance", "Cost", "Operations"],
    "required_documents": 8
  }
}
```

**Validation Script** (`test-data/validate-S01.sh`):
```bash
#!/bin/bash
# Validate S01 scenario outputs

SCENARIO_OUTPUT="./output/S01"

# Check artifacts exist
check_file() {
  if [ -f "$SCENARIO_OUTPUT/$1" ]; then
    echo "✅ $1 found"
    return 0
  else
    echo "❌ $1 NOT FOUND"
    return 1
  fi
}

# Validate Bicep
validate_bicep() {
  cd $SCENARIO_OUTPUT
  bicep build bicep-templates/main.bicep
  if [ $? -eq 0 ]; then
    echo "✅ Bicep validation passed"
    return 0
  else
    echo "❌ Bicep validation failed"
    return 1
  fi
}

# Validate cost estimate
validate_cost() {
  COST=$(grep -oP 'Total: ~\$\K[0-9]+' "$SCENARIO_OUTPUT/cost-estimate.md")
  if [ "$COST" -ge 80 ] && [ "$COST" -le 120 ]; then
    echo "✅ Cost estimate in expected range: \$$COST"
    return 0
  else
    echo "❌ Cost estimate out of range: \$$COST"
    return 1
  fi
}

echo "Validating S01 scenario..."
check_file "01-requirements.md"
check_file "02-assessment.md"
check_file "bicep-templates/main.bicep"
validate_bicep
validate_cost

echo "S01 validation complete"
```

---

## Part 3: Scenario S02 - Hub-Spoke Network

### 3.1 Overview

**Name**: Hub-Spoke Network with NSGs  
**Complexity**: Intermediate  
**Time**: 60 minutes  
**Resources**: 8-12 (vnets, subnets, NSGs, route tables)  
**Monthly Cost**: $200-300  
**Key Focus**: Networking, security, complexity

### 3.2 Requirements Summary

```yaml
Architecture:
  - Hub VNet (10.0.0.0/16) - shared services
  - Spoke 1 VNet (10.1.0.0/16) - web tier
  - Spoke 2 VNet (10.2.0.0/16) - app tier
  - VNet Peering between all
  
Security:
  - NSGs per subnet
  - Azure Firewall in hub
  - No direct internet access from spokes
  
Connectivity:
  - Bastion host for jump access
  - VPN Gateway for on-prem
  
Monitoring:
  - Network Watcher enabled
  - Flow logs to storage
```

**Expected Artifacts**: 12+ documents  
**Bicep Resources**: 15+ resources  
**Cost Estimate**: ~$280/month

### 3.3 Success Criteria

- ✅ All 3 VNets created with correct CIDR
- ✅ VNet peering configured and tested
- ✅ NSGs created with sample rules (deny all, allow specific)
- ✅ Azure Firewall provisioned
- ✅ Network topology documented
- ✅ Security posture validated

---

## Part 4: Scenario S03 - App Service + SQL Database

### 4.1 Overview

**Name**: App Service with SQL Database  
**Complexity**: Intermediate  
**Time**: 60 minutes  
**Resources**: 6-8 (App Service, SQL, VNet integration, backups)  
**Monthly Cost**: $300-500  
**Key Focus**: Data layer, backup, disaster recovery

### 4.2 Requirements Summary

```yaml
Compute:
  - App Service Plan (Standard: S1)
  - 2 app instances
  
Database:
  - Azure SQL Database (Standard S1)
  - 20 GB storage
  - Geo-replication enabled
  
Connectivity:
  - VNet integration
  - Private endpoints for SQL
  
Backup:
    - Daily backups, 30-day retention
    - Geo-redundant storage
```

**Expected Artifacts**: 10+ documents  
**Bicep Resources**: 10+ resources  
**Cost Estimate**: ~$420/month

### 4.3 Key Validations

- ✅ Connection string generated
- ✅ Database firewall configured
- ✅ Backup retention policy set
- ✅ Disaster recovery RTO/RPO documented
- ✅ Performance monitoring configured

---

## Part 5: Scenario S04 - Multi-Tier Application

### 5.1 Overview

**Name**: Complete 3-Tier Application  
**Complexity**: Advanced  
**Time**: 90 minutes  
**Resources**: 12-15 (full stack)  
**Monthly Cost**: $600-900  
**Key Focus**: Full architecture, load balancing, scaling

### 5.2 Architecture

```
Internet
    ↓ (Application Gateway)
    ├─ Web Tier (2x App Service)
    ├─ App Tier (2x App Service)
    └─ Data Tier
       ├─ SQL Database (primary)
       └─ SQL Database (replica)
```

**Expected Artifacts**: 15+ documents  
**Bicep Resources**: 18+ resources  
**Cost Estimate**: ~$750/month

### 5.3 Key Validations

- ✅ Load balancer routes traffic correctly
- ✅ Auto-scaling rules configured
- ✅ Database replication working
- ✅ SSL/TLS certificates valid
- ✅ End-to-end encryption configured

---

## Part 6: Scenario S05 - High-Availability Setup

### 6.1 Overview

**Name**: Production High-Availability  
**Complexity**: Expert  
**Time**: 120+ minutes  
**Resources**: 15-20 (multi-region, failover)  
**Monthly Cost**: $1200-1800  
**Key Focus**: Resilience, disaster recovery, compliance

### 6.2 Architecture

```
Primary Region (East US 2)
├─ App Service (3 instances)
├─ SQL Database (primary)
└─ All supporting services

Secondary Region (West US)
├─ App Service (2 instances)
├─ SQL Database (replica)
└─ Traffic Manager routing

Cross-Region:
├─ Traffic Manager (endpoint monitoring)
├─ Automated failover
└─ RTO: 5 minutes, RPO: 1 minute
```

**Expected Artifacts**: 18+ documents  
**Bicep Resources**: 25+ resources  
**Cost Estimate**: ~$1500/month  
**Status**: Optional for v1.0 (nice-to-have)

---

## Part 7: Testing Strategy & Validation

### 7.1 Scenario Testing Framework

**Test Phases**:

```
1. Setup
   └─ Load test data (S01-S05)
   └─ Initialize agents & MCP servers
   
2. Phase Execution
   ├─ Phase 0-7 workflow per scenario
   └─ Capture output at each phase
   
3. Artifact Validation
   ├─ Check all expected files generated
   ├─ Validate file format (markdown, JSON, Bicep)
   └─ Verify content completeness
   
4. Technical Validation
   ├─ Bicep build & lint
   ├─ Cost estimate accuracy
   ├─ Deployment what-if
   └─ Documentation quality
   
5. Reporting
   ├─ Generate test report
   ├─ Compare against baseline
   └─ Flag regressions
```

### 7.2 Test Data Organization

```
test-data/
├── S01-simple-app-service/
│   ├── input.json
│   ├── expected-output.json
│   └── validate.sh
│
├── S02-hub-spoke-network/
│   ├── input.json
│   └── validate.sh
│
├── S03-app-service-sql/
│   ├── input.json
│   └── validate.sh
│
├── S04-multi-tier-app/
│   ├── input.json
│   └── validate.sh
│
└── S05-high-availability/
    ├── input.json
    └── validate.sh

test-output/
├── S01/
│   ├── 01-requirements.md
│   ├── 02-assessment.md
│   ├── bicep-templates/
│   └── validation-report.json
├── S02/
├── S03/
├── S04/
└── S05/
```

### 7.3 Validation Checklist Per Scenario

```yaml
Checklist Template:
  Artifacts:
    - [ ] All expected files generated
    - [ ] File formats correct (markdown, JSON, Bicep)
    - [ ] No empty files
    - [ ] All cross-references valid
    
  Content:
    - [ ] Phase 0: Discovery complete
    - [ ] Phase 1: Requirements clear
    - [ ] Phase 2: WAF assessment complete
    - [ ] Phase 3: Design documented
    - [ ] Phase 4: Plan detailed
    - [ ] Phase 5: Bicep generated
    - [ ] Phase 7: Documentation complete
    
  Quality:
    - [ ] No grammatical errors
    - [ ] Consistent terminology
    - [ ] All sections populated
    - [ ] Examples provided
    
  Technical:
    - [ ] Bicep validates
    - [ ] Cost estimate reasonable
    - [ ] Security recommendations present
    - [ ] Monitoring configured
    
  MCP Integration:
    - [ ] azure-pricing-mcp used correctly
    - [ ] Cost estimates in budget
    - [ ] azure-resource-graph-mcp validated policies
    - [ ] microsoft-docs-mcp references valid
```

### 7.4 Regression Testing

**After each agent/MCP change**:

```bash
# Run all scenarios
./scripts/run-all-scenarios.sh

# Compare outputs against baseline
./scripts/compare-to-baseline.sh

# Generate regression report
./scripts/generate-regression-report.sh
```

**Expected output**: Regression report showing any differences from v1.0 baseline

### 7.5 Performance Targets

| Scenario | Execution Time | Memory Used | CPU Peak |
|----------|---|---|---|
| S01 | 25-35 min | <500 MB | <30% |
| S02 | 50-70 min | <800 MB | <50% |
| S03 | 50-70 min | <700 MB | <40% |
| S04 | 80-100 min | <1.2 GB | <60% |
| S05 | 110-140 min | <1.5 GB | <70% |

---

## Summary

**5 Complete Scenarios**:
- S01: Simple App Service (baseline)
- S02: Hub-Spoke Network (networking)
- S03: App Service + SQL (data layer)
- S04: Multi-Tier App (full stack)
- S05: High-Availability (resilience)

**Testing Framework**:
- Test data structure
- Artifact validation
- Technical checks (Bicep, cost, etc.)
- Regression testing
- Performance targets

**Each Scenario Includes**:
- Complete requirements
- Expected artifacts per phase
- Success criteria
- Test data
- Validation scripts

---

**Document Status**: Complete ✅  
**Date Created**: January 13, 2026  
**Word Count**: ~4,000  
**Test Data**: Structured JSON + validation scripts  
**Integration**: Used in Sprint 7-8 (Testing phase)

---

**Cross-References**:
- [Plan-C Sprint 7-8](./AgenticCoderPlan-C.md#sprint-7-8-testing-phase) - Testing execution
- [Plan-H: Data Schemas](./AgenticCoderPlan-H.md) - Artifact formats
- [Plan-F: Dev Container](./AgenticCoderPlan-F.md) - Test environment
