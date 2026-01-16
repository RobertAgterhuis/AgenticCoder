# DevOps Agent Clarification Guide

**Date**: January 13, 2026  
**Status**: Clarification Document

## Overview

There are **2 DevOps agents** in AgenticCoder, serving different purposes:

| Agent | Phase | Platform Focus | Use Case | Technology |
|-------|-------|-----------------|----------|-----------|
| **@devops-specialist** | 12 | Platform-agnostic | All projects | GitHub Actions |
| **@azure-devops-specialist** | 16 | Azure-specific | Enterprise Azure | Azure DevOps Pipelines |

---

## 1. @devops-specialist (Phase 12)

### Purpose
Create CI/CD pipelines using **GitHub Actions** - the platform-agnostic, open-source solution.

### When to Use
✅ **Use this agent when:**
- Deploying to GitHub-based workflows
- Using any cloud provider (AWS, GCP, Azure, etc.)
- Want vendor-neutral CI/CD pipelines
- Need lightweight, easy-to-manage pipelines
- Team is familiar with GitHub ecosystem

### What It Generates
- `.github/workflows/build.yml` - Build & test pipeline
- `.github/workflows/deploy-dev.yml` - Development deployment
- `.github/workflows/deploy-staging.yml` - Staging deployment
- `.github/workflows/deploy-prod.yml` - Production deployment
- `.github/workflows/security-scan.yml` - Security scanning
- `.github/workflows/performance-test.yml` - Load testing

### Technology Stack
```yaml
- Triggers: Push/PR to main, develop
- Runners: ubuntu-latest
- Languages: Node.js, Python, Java, etc.
- Cloud: AWS, GCP, Azure, DigitalOcean, etc.
- Artifacts: Published to GitHub Releases or artifact storage
```

### Example Output
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
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
```

### Activation Criteria
```
Phase 12 (@devops-specialist) activates when:
- Tech stack decision is made (Phase 7)
- Repository hosting is GitHub
- CI/CD platform is GitHub Actions OR not specified (default)
- Deployment targets defined (dev, staging, prod)
```

### Prerequisites
- Code committed to GitHub repository
- GitHub Actions enabled in repository settings
- Secrets configured (AWS_KEY, DATABASE_URL, etc.)
- Deployment credentials in GitHub Secrets

---

## 2. @azure-devops-specialist (Phase 16)

### Purpose
Create CI/CD pipelines using **Azure DevOps Pipelines** - the enterprise-focused Azure solution.

### When to Use
✅ **Use this agent when:**
- Deploying to Azure infrastructure
- Enterprise requirements for approval gates and audit trails
- Team is using Azure DevOps for project management
- Need tight integration with Azure services
- Compliance requirements (HIPAA, PCI-DSS, etc.)

### What It Generates
- `azure-pipelines.yml` - Complete multi-stage pipeline
- Environment configurations for Dev/Staging/Prod
- Security gates and approval requirements
- Artifact publishing configuration
- Deployment strategy (Blue-Green, Rolling, Canary)

### Technology Stack
```yaml
- Triggers: Push/PR to branches
- Agents: Azure-hosted or self-hosted
- Languages: Any (uses templates)
- Cloud: Azure (primary), can deploy to other clouds
- Artifacts: Azure Artifacts or blob storage
- Gate: Manual approval, policies, security scanning
```

### Example Output
```yaml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildJob
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18'
          - script: npm install
          - script: npm test
          - script: npm run build

  - stage: Deploy_Dev
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: DeployToDev
        environment: development
        strategy:
          runOnce:
            deploy:
              steps:
                - script: az webapp deploy --resource-group rg --name app-name
```

### Activation Criteria
```
Phase 16 (@azure-devops-specialist) activates when:
- Tech stack decision is made (Phase 7)
- Platform is Azure
- CI/CD platform is Azure DevOps OR explicitly selected
- Deployment targets are Azure (App Service, AKS, Functions)
- Enterprise features needed (approval gates, audit, RBAC)
```

### Prerequisites
- Azure DevOps project created
- Azure service connections configured
- Azure credentials stored in pipelines
- Deployment environments defined in Azure DevOps
- Approval policies configured

---

## 3. Comparison Matrix

| Feature | @devops-specialist | @azure-devops-specialist |
|---------|-------------------|-------------------------|
| **Platform** | GitHub Actions | Azure DevOps |
| **Best For** | Multi-cloud, open-source | Azure, enterprise |
| **Learning Curve** | Easy | Medium |
| **YAML Syntax** | GitHub Actions | Azure Pipelines |
| **Approval Gates** | Simple (environments) | Advanced (policies) |
| **Audit Trail** | Basic | Advanced |
| **Cost** | Free (GitHub) | Free (Azure Pipelines) |
| **Integration** | GitHub-native | Azure-native |
| **Multi-cloud** | ✅ Yes | ✅ Yes (but not primary) |
| **Compliance** | Basic | Advanced (HIPAA, PCI) |

---

## 4. Decision Logic

### Choose @devops-specialist (Phase 12) if:
```
hosting == "GitHub" 
  OR ci_cd_platform == "GitHub Actions"
  OR multi_cloud_deployment == true
  OR simplicity_preferred == true
```

### Choose @azure-devops-specialist (Phase 16) if:
```
platform == "Azure"
  OR ci_cd_platform == "Azure DevOps"
  OR enterprise_approval_gates_required == true
  OR compliance_requirements == ["HIPAA", "PCI"]
  OR existing_ado_project == true
```

### Both Could Apply:
```
If deploying to Azure via GitHub-hosted code:
  - Default: Use @devops-specialist with Azure CLI tasks
  - Alternative: Use @azure-devops-specialist for native integration
  - Recommendation: Choose based on existing tooling investment
```

---

## 5. Real-World Scenarios

### Scenario S01 (Solo MVP)
```
Choice: @devops-specialist (Phase 12)
Reason: 
  - Solo developer, simplicity preferred
  - Code on GitHub
  - Deploying to Azure App Service (can use GitHub Actions)
  - No approval gates needed
```

### Scenario S02 (Startup)
```
Choice: @devops-specialist (Phase 12)
Reason:
  - Small team, GitHub-based
  - Multi-cloud flexibility (might expand to AWS later)
  - Simple approval process (one release manager)
```

### Scenario S04 (Enterprise Banking)
```
Choice: @azure-devops-specialist (Phase 16)
Reason:
  - Enterprise Azure deployment (AKS multi-region)
  - Strict approval gates (Ops team sign-off)
  - Audit trail required (banking compliance)
  - Advanced deployment strategies (canary, blue-green)
  - Tight Azure integration (Key Vault, MSI, etc.)
```

### Scenario S05 (Healthcare)
```
Choice: @azure-devops-specialist (Phase 16)
Reason:
  - HIPAA compliance requirement
  - Enterprise approval process
  - Audit logging critical
  - Azure-native PHI encryption
  - Advanced environmental control
```

---

## 6. Migration Path

### GitHub Actions → Azure DevOps
If you start with @devops-specialist and later need Azure DevOps:
1. Existing GitHub Actions pipeline continues to work
2. Run @azure-devops-specialist to generate `azure-pipelines.yml`
3. Migrate build steps from `.github/workflows/` to `azure-pipelines.yml`
4. Update CI/CD trigger in repository settings
5. Archive old GitHub Actions workflows

### Azure DevOps → GitHub Actions
If you start with @azure-devops-specialist and later switch:
1. Existing Azure DevOps pipeline continues to work
2. Run @devops-specialist to generate `.github/workflows/`
3. Migrate build steps from `azure-pipelines.yml` to workflows
4. Update repository webhook configuration
5. Archive Azure DevOps pipeline

---

## 7. Both Agents in Same Project?

**Can I use both?** ✅ Yes, with caveats.

### Use Cases for Both
1. **Gradual Migration**: Run both during transition
2. **Multi-environment**: GitHub for dev, Azure DevOps for prod
3. **Team Split**: Frontend team uses GitHub Actions, Ops uses Azure DevOps

### Best Practices
- Keep one as primary, one as secondary
- Same deployment logic in both (keep synchronized)
- Clear documentation which is active
- Monitor both (don't let secondary get stale)

---

## 8. Summary Table

```
PROJECT CHARACTERISTICS          →  RECOMMENDATION
─────────────────────────────────────────────────
Code on GitHub, any cloud           @devops-specialist
Code on GitHub, use Azure           @devops-specialist (primary)
Code in Azure Repos                 @azure-devops-specialist
Enterprise Azure, compliance        @azure-devops-specialist
Multi-cloud future                  @devops-specialist
Existing Azure DevOps investment    @azure-devops-specialist
New to DevOps, prefer simplicity    @devops-specialist
```

---

## Conclusion

**There is NO redundancy** - these are complementary agents serving different architectures:

- **@devops-specialist** = For GitHub-hosted projects, any cloud
- **@azure-devops-specialist** = For Azure-native, enterprise projects

Your project's architecture and constraints determine which to use.

---

**Need help choosing?** Run @plan with your project details - it will recommend the appropriate DevOps agent based on platform and requirements.
