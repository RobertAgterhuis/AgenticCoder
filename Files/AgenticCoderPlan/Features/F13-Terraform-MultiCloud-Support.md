# Feature F13: Terraform Multi-Cloud Support

**Status**: Planned  
**Priority**: High  
**Complexity**: High  
**Estimated Effort**: 5-6 weeks  
**Target Phase**: Phase 2 Integration

---

## Problem Statement

### Current Gap
In AGENT_ACTIVATION_GUIDE.md staat bij **@bicep-specialist**:

```
❌ SKIPS when:
- Infrastructure language: Terraform, Pulumi, CDK
- Platform chosen: AWS (CloudFormation native)
- Platform chosen: GCP (Deployment Manager native)
```

**Betekenis**: Als gebruiker Terraform kiest als IaC tool:
- ❌ Geen agent voor Terraform infrastructure code
- ❌ Geen multi-cloud infrastructure patterns
- ❌ Geen skill voor Terraform best practices
- ❌ Geen schemas voor Terraform generation
- ❌ Geen integration met Terraform Cloud/Enterprise

### Business Impact
- **Terraform is #1 multi-cloud IaC tool** (HashiCorp dominance)
- Dominant choice for **multi-cloud deployments**
- Used by enterprises with Azure + AWS + GCP
- Unified syntax across all cloud providers
- Strong in infrastructure governance (policy as code)
- Terraform Cloud for team collaboration

---

## Proposed Solution

### New Components Needed

#### 1. Agent: @terraform-specialist
**Responsibility**: Terraform infrastructure code generation  
**Phase**: 9b (parallel met @bicep-specialist, @cloudformation-specialist, @gcp-deployment-specialist)  
**Activation**: `IF infrastructure_language == "Terraform"`

**Output**:
- Terraform configuration files (.tf)
- Provider configuration (Azure, AWS, GCP)
- Resource definitions
- Variables and outputs
- Modules (reusable components)
- State management (remote backend)
- Terraform Cloud integration
- Policy as code (Sentinel, OPA)

#### 2. Skill: terraform-multi-cloud-patterns
**Type**: Code skill  
**Used by**: @terraform-specialist

**Content**:
- Terraform syntax and HCL
- Provider configuration (azurerm, aws, google)
- Resource definitions
- Data sources
- Variables and locals
- Outputs
- Modules (composition, registry)
- State management (S3, Azure Storage, Terraform Cloud)
- Workspaces
- Provisioners and lifecycle rules
- Terraform Cloud/Enterprise features

#### 3. Skill: terraform-best-practices
**Type**: Process skill  
**Used by**: @terraform-specialist

**Content**:
- Project structure (environments, modules)
- State management strategies
- Module design patterns
- Provider version pinning
- Security best practices (sensitive values, RBAC)
- Testing strategies (Terratest)
- CI/CD integration
- Drift detection
- Cost estimation

#### 4. Schemas (6 files)
```
.github/schemas/agents/
├── @terraform-specialist.input.schema.json
└── @terraform-specialist.output.schema.json

.github/schemas/skills/
├── terraform-multi-cloud-patterns.input.schema.json
├── terraform-multi-cloud-patterns.output.schema.json
├── terraform-best-practices.input.schema.json
└── terraform-best-practices.output.schema.json
```

---

## Implementation Phases

### Phase 1: Research & Design (Week 1-2)
**Duration**: 8 dagen  
**Deliverables**:
- [ ] Terraform vs Bicep vs CloudFormation comparison
- [ ] Provider analysis (azurerm, aws, google, kubernetes)
- [ ] Module design patterns
- [ ] State management strategies (local, S3, Azure Storage, Terraform Cloud)
- [ ] Terraform version target (1.6+, 1.7 latest stable)

**Review Points**:
- Terraform 1.6+ as target version? (Yes - modern features)
- Terraform Cloud vs self-hosted state? (Support both)
- Module Registry vs custom modules? (Both, registry preferred)
- Can Terraform replace Bicep/CloudFormation entirely? (Yes, but platform-specific tools have advantages)

---

### Phase 2: Agent Specification (Week 2-3)
**Duration**: 10 dagen  
**Deliverables**:
- [ ] @terraform-specialist.agent.md (480+ lines)
  - **Project Structure**:
    - main.tf (primary resources)
    - variables.tf (input variables)
    - outputs.tf (output values)
    - providers.tf (provider configuration)
    - backend.tf (state backend)
    - versions.tf (version constraints)
  
  - **Multi-Cloud Support**:
    - Azure (azurerm provider)
    - AWS (aws provider)
    - GCP (google provider)
    - Kubernetes (kubernetes provider)
  
  - **Resource Types**:
    - Azure: App Service, Azure SQL, Storage, AKS
    - AWS: EC2, RDS, S3, ECS, EKS
    - GCP: Compute Engine, Cloud SQL, GCS, GKE
  
  - **Modules**:
    - Module creation (reusable components)
    - Module composition
    - Terraform Registry usage
    - Versioning modules
  
  - **State Management**:
    - Local state (development)
    - Remote state (S3, Azure Storage, Terraform Cloud)
    - State locking
    - Workspaces (environments)
  
  - **Variables & Outputs**:
    - Input variables (types, defaults, validation)
    - Local values
    - Output values (sensitive outputs)
  
  - **Advanced Features**:
    - Data sources (querying existing resources)
    - Provisioners (local-exec, remote-exec)
    - Lifecycle rules (create_before_destroy, prevent_destroy)
    - Dynamic blocks
    - For_each and count
  
  - **Security**:
    - Sensitive values (sensitive = true)
    - Provider authentication (service principals, IAM roles)
    - Secret management (Azure Key Vault, AWS Secrets Manager)
  
  - Hands off to @devops-specialist

**Review Points**:
- Is @terraform-specialist op zelfde niveau als @bicep-specialist?
- Zijn alle 3 cloud platforms gedekt (Azure, AWS, GCP)?
- Is multi-cloud complexity goed gedocumenteerd?

---

### Phase 3: Skill Definitions (Week 3-4)
**Duration**: 8 dagen  
**Deliverables**:
- [ ] terraform-multi-cloud-patterns.skill.md (300+ lines)
  - **HCL Syntax**:
    - Resource blocks
    - Variable blocks
    - Output blocks
    - Data blocks
    - Module blocks
  
  - **Azure Provider (azurerm)**:
    - Resource Group
    - App Service Plan + App Service
    - Azure SQL Database
    - Storage Account
    - Virtual Network
    - AKS (Azure Kubernetes Service)
  
  - **AWS Provider (aws)**:
    - VPC and Subnets
    - EC2 instances
    - RDS databases
    - S3 buckets
    - ECS clusters
    - EKS (Elastic Kubernetes Service)
  
  - **GCP Provider (google)**:
    - Compute Engine instances
    - Cloud SQL instances
    - Cloud Storage buckets
    - VPC networks
    - GKE (Google Kubernetes Engine)
  
  - **Modules**:
    - Module structure
    - Input variables
    - Output values
    - Module sources (local, registry, Git)
  
  - **State Management**:
    - Backend configuration
    - State locking (DynamoDB, Azure Storage)
    - Workspaces
  
  - **Variables**:
    - Primitive types (string, number, bool)
    - Collection types (list, set, map)
    - Structural types (object, tuple)
    - Variable validation rules
  
  - **Functions**:
    - String functions (format, join, split)
    - Collection functions (concat, merge, lookup)
    - Encoding functions (jsonencode, yamlencode)
    - Filesystem functions (file, templatefile)

- [ ] terraform-best-practices.skill.md (220+ lines)
  - **Project Organization**:
    - Environment separation (dev, staging, prod)
    - Module structure
    - Naming conventions
  
  - **State Management**:
    - Remote backend setup
    - State locking
    - Workspace strategies
    - State file security
  
  - **Security**:
    - Sensitive variable handling
    - Provider authentication (managed identities, IAM roles)
    - Secret management
    - RBAC for Terraform Cloud
  
  - **Module Design**:
    - Single responsibility principle
    - Composability
    - Versioning
    - Documentation (README.md)
  
  - **Version Pinning**:
    - Terraform version constraints
    - Provider version constraints
    - Module version constraints
  
  - **Testing**:
    - Terraform validate
    - Terraform plan review
    - Terratest (Go-based testing)
    - Checkov (policy as code)
  
  - **CI/CD Integration**:
    - Automated terraform plan
    - Manual terraform apply approval
    - Drift detection
    - Cost estimation (Infracost)
  
  - **Performance**:
    - Parallelism tuning
    - Resource targeting (-target)
    - Selective apply

**Review Points**:
- Zijn multi-cloud patterns comprehensive?
- Is security goed gedocumenteerd?

---

### Phase 4: Schema Creation (Week 4)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] @terraform-specialist.input.schema.json
  ```json
  {
    "infrastructure_architecture": {
      "platforms": ["Azure", "AWS", "GCP"],
      "terraform_version": "1.6+",
      "state_backend": "azurerm | s3 | gcs | terraform_cloud",
      "use_modules": true
    },
    "cloud_resources": {
      "azure": {
        "resource_group": "rg-myapp-prod",
        "app_service": {
          "name": "app-myapp-prod",
          "sku": "B1"
        },
        "sql_database": {
          "name": "sql-myapp-prod",
          "sku": "Basic"
        }
      },
      "aws": {
        "vpc": {
          "cidr": "10.0.0.0/16"
        },
        "ec2": {
          "instance_type": "t3.micro"
        },
        "rds": {
          "engine": "postgres",
          "instance_class": "db.t3.micro"
        }
      },
      "gcp": {
        "compute_instance": {
          "machine_type": "e2-micro"
        },
        "cloud_sql": {
          "tier": "db-f1-micro"
        }
      }
    },
    "modules": [
      {
        "name": "networking",
        "source": "terraform-registry/networking/azure"
      }
    ],
    "variables": {
      "environment": "prod",
      "location": "westeurope"
    },
    "outputs": ["app_url", "database_endpoint"]
  }
  ```

- [ ] @terraform-specialist.output.schema.json
  ```json
  {
    "artifacts": {
      "main": [
        {
          "file": "main.tf",
          "content": "resource \"azurerm_resource_group\" \"main\" {...}"
        }
      ],
      "providers": [
        {
          "file": "providers.tf",
          "content": "terraform {\n  required_providers {\n    azurerm = {...}\n  }\n}\n\nprovider \"azurerm\" {...}"
        }
      ],
      "variables": [
        {
          "file": "variables.tf",
          "content": "variable \"environment\" {\n  type = string\n}"
        }
      ],
      "outputs": [
        {
          "file": "outputs.tf",
          "content": "output \"app_url\" {\n  value = azurerm_app_service.main.default_site_hostname\n}"
        }
      ],
      "backend": [
        {
          "file": "backend.tf",
          "content": "terraform {\n  backend \"azurerm\" {...}\n}"
        }
      ],
      "modules": [
        {
          "file": "modules/networking/main.tf",
          "content": "resource \"azurerm_virtual_network\" \"main\" {...}"
        }
      ]
    },
    "terraform_info": {
      "resources_created": 12,
      "modules_used": 3,
      "providers": ["azurerm", "aws", "google"]
    },
    "next_phase": "@devops-specialist"
  }
  ```

- [ ] terraform-multi-cloud-patterns skill schemas (input/output)
- [ ] terraform-best-practices skill schemas (input/output)

**Review Points**:
- Zijn schemas consistent met @bicep-specialist?
- Is multi-cloud gemodelleerd?

---

### Phase 5: Integration with Existing System (Week 5)
**Duration**: 8 dagen  
**Deliverables**:
- [ ] Update @code-architect.agent.md
  - Add Terraform to IaC options
  - Add multi-cloud considerations
  - Add when to use Terraform vs Bicep/CloudFormation
  
- [ ] Update AGENT_ACTIVATION_GUIDE.md
  - Add @terraform-specialist activation criteria
  - Update Phase 9b alternatives (Bicep OR CloudFormation OR Terraform)
  - Add multi-cloud decision logic
  - Update decision tree
  
- [ ] Update PHASE_FLOW.md
  - Update Phase 9b alternatives
  - Add Terraform timing estimates (100-180m - multi-cloud complexity)
  
- [ ] Update SYSTEM_ARCHITECTURE.md
  - Add @terraform-specialist to Infrastructure Tier
  - Update agent inventory
  
- [ ] Create cloud platform comparison guide
  - When to use Azure (Bicep)
  - When to use AWS (CloudFormation)
  - When to use GCP (Deployment Manager)
  - When to use Terraform (multi-cloud, standardization)

**Review Points**:
- Conflicteert Terraform met platform-specific IaC tools?
- Is multi-cloud decision logic helder?
- Wanneer Terraform kiezen vs Bicep?

---

### Phase 6: Scenario Integration (Week 5-6)
**Duration**: 6 dagen  
**Deliverables**:
- [ ] Update S01 with Terraform alternative
  - S01: Can use Terraform instead of Bicep
  - Azure resources in Terraform syntax
  
- [ ] Create multi-cloud scenario
  - S08: Multi-cloud deployment (Azure + AWS)
  - Frontend on Azure (App Service)
  - Backend on AWS (ECS)
  - Database on GCP (Cloud SQL)
  
- [ ] Create Terraform deployment examples
  - Terraform Cloud workspace
  - GitHub Actions with Terraform
  - Azure DevOps with Terraform

**Review Points**:
- Is Terraform alternative voor S01 realistisch?
- Is multi-cloud scenario haalbaar?

---

## System Impact Analysis

### Modified Components
| Component | Change | Lines Added | Review Needed |
|-----------|--------|-------------|---------------|
| @code-architect.agent.md | Add Terraform IaC option | ~120 | YES |
| AGENT_ACTIVATION_GUIDE.md | Add 1 agent | ~1,000 | YES |
| PHASE_FLOW.md | Update Phase 9b alternatives | ~300 | YES |
| SYSTEM_ARCHITECTURE.md | Add Terraform specialist | ~500 | YES |
| README.md | Update agent count | ~20 | YES |

### New Components
| Component | Type | Lines | Review Needed |
|-----------|------|-------|---------------|
| @terraform-specialist.agent.md | Agent spec | ~480 | YES |
| terraform-multi-cloud-patterns.skill.md | Skill spec | ~300 | YES |
| terraform-best-practices.skill.md | Skill spec | ~220 | YES |
| 6 schema files | JSON schemas | ~1,500 | YES |
| Cloud Platform Comparison Guide | Documentation | ~400 | YES |
| **Total New** | - | **~2,900 lines** | - |

---

## Testing Considerations (User Will Test)

### Test Scenarios
1. **S01 Terraform Alternative**: Todo app with Terraform on Azure
2. **Multi-Cloud**: Resources across Azure + AWS + GCP
3. **Terraform Modules**: Reusable infrastructure components
4. **State Management**: Remote backend with locking

### Validation Points
- [ ] @terraform-specialist generates valid Terraform 1.6+ code
- [ ] Azure provider configuration is correct
- [ ] AWS provider configuration is correct
- [ ] GCP provider configuration is correct
- [ ] Modules are properly structured
- [ ] State backend is configured
- [ ] terraform validate passes
- [ ] terraform plan succeeds

---

## Dependencies

### Prerequisites
- Phase 1 (existing system) must be 100% complete ✅
- @code-architect must support IaC selection ✅
- @bicep-specialist exists as reference ✅
- F01 (AWS) and F02 (GCP) provide platform context ✅

### Parallel Work
- Can be developed parallel with F14 (On-Premises)
- Should integrate with F01 (AWS) and F02 (GCP)

### Blocking For
- Multi-cloud scenarios require Terraform
- Enterprise multi-cloud deployments

---

## Success Criteria

### Must Have
- ✅ @terraform-specialist agent fully documented (480+ lines)
- ✅ 2 Terraform skills documented (520+ lines total)
- ✅ 6 schema files created with 100% coverage
- ✅ Phase 9b decision logic supports all IaC tools
- ✅ S01 Terraform alternative documented
- ✅ Multi-cloud scenario (S08) created
- ✅ All existing documentation updated

### Should Have
- Azure, AWS, GCP provider support
- Terraform modules patterns
- State management strategies
- Terraform Cloud integration

### Nice to Have
- Terraform testing (Terratest)
- Policy as code (Sentinel, OPA)
- Cost estimation (Infracost)
- Drift detection automation

---

## Review Checklist

### Architecture Review
- [ ] Zijn @terraform-specialist responsibilities duidelijk?
- [ ] Is multi-cloud support comprehensive?
- [ ] Is module design goed gedocumenteerd?
- [ ] Is output compatible met @devops-specialist?

### Integration Review
- [ ] Conflicteert Terraform met Bicep/CloudFormation?
- [ ] Is multi-cloud orchestrator logic helder?
- [ ] Wanneer Terraform kiezen vs platform-specific tools?

### Documentation Review
- [ ] Zijn alle documentatie files updated?
- [ ] Is agent count correct?
- [ ] Zijn decision trees helder (multi-cloud)?

### Quality Review
- [ ] Zijn schemas syntactisch correct?
- [ ] Is HCL syntax modern (Terraform 1.6+)?
- [ ] Zijn best practices gedocumenteerd?

---

## Risks & Mitigations

### Risk 1: Provider Version Compatibility
**Impact**: High  
**Probability**: Medium  
**Mitigation**: 
- Pin provider versions
- Document version constraints
- Test with multiple provider versions

### Risk 2: State Management Complexity
**Impact**: High  
**Probability**: High  
**Mitigation**: 
- Clear documentation on remote backends
- State locking best practices
- Backup strategies

### Risk 3: Multi-Cloud Complexity
**Impact**: High  
**Probability**: High  
**Mitigation**: 
- Start with single cloud
- Document provider differences
- Provide clear examples for each platform

### Risk 4: Terraform vs Platform-Specific Tools
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**: 
- Document trade-offs clearly
- Provide decision matrix
- Support both approaches

---

## Terraform-Specific Considerations

### Why Terraform is Important

**1. Multi-Cloud Standard**
- Works across Azure, AWS, GCP
- Unified syntax and tooling
- Single state management

**2. Provider Ecosystem**
- 3,000+ providers (clouds, SaaS, databases)
- Community-driven
- Extensible

**3. Enterprise Features**
- Terraform Cloud/Enterprise
- Policy as code (Sentinel)
- Team collaboration
- RBAC and governance

**4. Mature Tooling**
- HashiCorp ecosystem (Vault, Consul, Nomad)
- Terraform Registry (modules)
- Rich CLI experience

**5. Industry Adoption**
- De facto multi-cloud standard
- Used by most Fortune 500
- Strong community support

### Terraform vs Alternatives

**vs Bicep (Azure)**:
- ✅ Multi-cloud (Azure, AWS, GCP)
- ✅ More mature ecosystem
- ❌ More complex
- ❌ Not Azure-native

**vs CloudFormation (AWS)**:
- ✅ Multi-cloud
- ✅ Better module system
- ✅ State management
- ❌ Not AWS-native

**vs Pulumi**:
- ✅ Declarative (HCL)
- ✅ More mature
- ❌ No full programming languages
- ✅ Simpler for most use cases

**When to Choose Terraform**:
- Multi-cloud deployments
- Need unified IaC across platforms
- Enterprise governance (Terraform Cloud)
- Standardization across teams
- Provider ecosystem (SaaS, databases)

**When to Choose Platform-Specific**:
- Single cloud commitment
- Deep platform integration
- Native tooling preferred
- Team expertise in platform tool

---

## Decision Matrix: IaC Tool Selection

| Criterion | Bicep (Azure) | CloudFormation (AWS) | Terraform | Score |
|-----------|---------------|---------------------|-----------|-------|
| **Azure-only** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | Bicep wins |
| **AWS-only** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | CloudFormation wins |
| **GCP-only** | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ | Terraform wins |
| **Multi-cloud** | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ | Terraform wins |
| **Provider ecosystem** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | Terraform wins |
| **Learning curve** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Bicep easiest |
| **Native features** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Platform tools win |
| **Governance** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Terraform Cloud |

---

## Next Steps

1. **Review dit document** - Valideer Terraform approach
2. **Goedkeuring voor Phase 1** - Start Terraform research
3. **Multi-cloud strategy** - When to use Terraform vs platform tools?

---

**Status**: ⏳ Awaiting Review  
**Reviewer**: [User]  
**Next Document**: F14-OnPremises-Infrastructure-Support.md

