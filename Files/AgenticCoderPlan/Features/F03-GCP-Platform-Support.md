# Feature F02: GCP Platform Support

**Status**: Planned  
**Priority**: Medium  
**Complexity**: High  
**Estimated Effort**: 4-6 weeks  
**Target Phase**: Phase 2 Integration

---

## Problem Statement

### Current Gap
In AGENT_ACTIVATION_GUIDE.md staat bij **@azure-architect**:

```
❌ SKIPS when:
- Platform chosen: AWS, GCP, or on-premises
```

En bij **@bicep-specialist**:

```
❌ SKIPS when:
- Non-Azure platform
```

**Betekenis**: Als gebruiker GCP (Google Cloud Platform) kiest:
- ❌ Geen agent voor GCP cloud architectuur
- ❌ Geen IaC templates (Deployment Manager/Terraform)
- ❌ Geen cost optimization voor GCP
- ❌ Geen skill voor GCP best practices
- ❌ Geen schemas voor GCP resources

### Business Impact
- **10-15% van enterprise cloud gebruik is GCP**
- Startups met data-intensive workloads kiezen vaak GCP (BigQuery, Vertex AI)
- Google Workspace integratie (Firebase, Cloud Run)
- Kubernetes-native deployments (GKE is origin van K8s)
- Machine Learning workloads (TensorFlow, Vertex AI)

---

## Proposed Solution

### New Components Needed

#### 1. Agent: @gcp-architect
**Responsibility**: GCP cloud infrastructure design  
**Phase**: 9 (parallel met @azure-architect en @aws-architect)  
**Activation**: `IF platform == "GCP"`

**Output**:
- GCP service recommendations (Compute Engine, Cloud Run, GKE, Cloud SQL)
- Cost breakdown per service
- Region selection (us-central1, europe-west1, etc.)
- High-availability setup (Multi-zone, Load Balancing)
- VPC design (subnets, firewall rules, Cloud NAT)

#### 2. Agent: @gcp-deployment-specialist
**Responsibility**: Infrastructure-as-Code for GCP  
**Phase**: 9 (parallel met @bicep-specialist, @cloudformation-specialist)  
**Activation**: `IF @gcp-architect completed AND iac_required == true`

**Output**:
- Deployment Manager templates (YAML/Jinja2)
- OR: Use Terraform for GCP (zie F13)
- gcloud deployment scripts
- Environment configuration files
- Service account setup

**Note**: GCP heeft minder native IaC dan Azure/AWS, vaak wordt Terraform gebruikt

#### 3. Skill: gcp-architecture
**Type**: Process skill  
**Used by**: @gcp-architect

**Content**:
- GCP Architecture Framework
- Service selection matrix (Compute Engine vs Cloud Run vs GKE)
- Cost optimization patterns (Committed Use Discounts, Sustained Use)
- Security best practices (IAM, Cloud KMS, VPC Service Controls)
- Networking patterns (VPC, Shared VPC, Private Google Access)

#### 4. Skill: gcp-deployment-manager
**Type**: Code skill  
**Used by**: @gcp-deployment-specialist

**Content**:
- Deployment Manager template structure
- Jinja2 templating for reusability
- Resource types (compute.v1.instance, sqladmin.v1beta4.database)
- gcloud deployment commands
- Configuration inheritance

#### 5. Schemas (4 files)
```
.github/schemas/agents/
├── @gcp-architect.input.schema.json
├── @gcp-architect.output.schema.json
├── @gcp-deployment-specialist.input.schema.json
└── @gcp-deployment-specialist.output.schema.json

.github/schemas/skills/
├── gcp-architecture.input.schema.json
├── gcp-architecture.output.schema.json
├── gcp-deployment-manager.input.schema.json
└── gcp-deployment-manager.output.schema.json
```

---

## Implementation Phases

### Phase 1: Research & Design (Week 1-2)
**Duration**: 10 dagen  
**Deliverables**:
- [ ] GCP service mapping (Compute Engine, Cloud Run, GKE, Cloud SQL)
- [ ] Cost analysis (GCP pricing model: per-second billing, sustained use discounts)
- [ ] GCP Architecture Framework review
- [ ] Deployment Manager vs Terraform decision (Terraform vaak preferred)
- [ ] Activation logic design (Phase 9 met 3 opties: Azure XOR AWS XOR GCP)

**Review Points**:
- Welke GCP services zijn "must have" in MVP?
- Deployment Manager of direct Terraform integreren?
- Hoe GCP IAM differs van Azure RBAC en AWS IAM?

---

### Phase 2: Agent Specifications (Week 2-3)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] @gcp-architect.agent.md (400+ lines)
  - GCP service recommendations (Compute, Cloud Run, GKE)
  - Multi-zone setup patterns
  - Cost breakdown methodology (per-second billing, CUD)
  - Security baseline (IAM, Cloud Armor, VPC Service Controls)
  - Hands off to @gcp-deployment-specialist
  
- [ ] @gcp-deployment-specialist.agent.md (300+ lines)
  - Deployment Manager template generation
  - OR: Terraform for GCP (if F13 integrated)
  - gcloud CLI automation
  - Service account management
  - Hands off to @devops-specialist

**Review Points**:
- Zijn GCP services vergelijkbaar gedekt als Azure/AWS?
- Is Deployment Manager genoeg of moet Terraform nu al?
- Zijn IAM best practices included?

---

### Phase 3: Skill Definitions (Week 3)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] gcp-architecture.skill.md (250+ lines)
  - GCP Architecture Framework
  - Service selection decision trees
  - Cost optimization (CUD, Sustained Use)
  - Multi-region strategies
  - Kubernetes-native patterns (GKE)

- [ ] gcp-deployment-manager.skill.md (200+ lines)
  - Deployment Manager syntax
  - Jinja2 templating
  - Resource dependencies
  - gcloud deployment workflow
  - Best practices (modularity, environment separation)

**Review Points**:
- Zijn skills op zelfde niveau als aws-architecture?
- Is Kubernetes expertise included voor GKE?

---

### Phase 4: Schema Creation (Week 4)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] @gcp-architect.input.schema.json
  ```json
  {
    "architecture_requirements": {
      "compute_type": "Compute Engine | Cloud Run | GKE | Cloud Functions",
      "database_type": "Cloud SQL | Firestore | BigQuery",
      "storage_type": "Cloud Storage | Persistent Disk",
      "regions": ["us-central1", "europe-west1"],
      "high_availability": true
    },
    "cost_constraints": {
      "budget_limit": 400,
      "use_committed_discounts": true
    }
  }
  ```

- [ ] @gcp-architect.output.schema.json
  ```json
  {
    "gcp_resources": [
      {
        "service": "Compute Engine | Cloud SQL | GKE",
        "configuration": {},
        "estimated_monthly_cost": 120
      }
    ],
    "vpc_design": {
      "network_name": "custom-vpc",
      "subnets": [],
      "firewall_rules": []
    },
    "total_estimated_cost": 400
  }
  ```

- [ ] @gcp-deployment-specialist schemas (input/output)
- [ ] gcp-architecture skill schemas (input/output)
- [ ] gcp-deployment-manager skill schemas (input/output)

**Review Points**:
- Zijn schemas consistent met @azure-architect en @aws-architect?
- Is GCP pricing model (per-second billing) correct gemodelleerd?

---

### Phase 5: Integration with Existing System (Week 5)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] Update @architect.agent.md
  - Add GCP to platform decision matrix (3 opties: Azure/AWS/GCP)
  - Add GCP-specific architecture patterns
  - Add GKE Kubernetes patterns
  
- [ ] Update @code-architect.agent.md
  - Add Cloud Run patterns (container-native)
  - Add GCP SDK integration examples
  
- [ ] Update AGENT_ACTIVATION_GUIDE.md
  - Add @gcp-architect activation criteria
  - Add @gcp-deployment-specialist flow
  - Update decision tree (Azure OR AWS OR GCP)
  
- [ ] Update PHASE_FLOW.md
  - Update Phase 9 alternatives (Azure OR AWS OR GCP)
  - Add parallel execution notes for 3 cloud options
  - Update timing estimates with GCP path

- [ ] Update SYSTEM_ARCHITECTURE.md
  - Add @gcp-architect to Infrastructure Tier
  - Update agent inventory (19 → 21 agents als F01 ook done)
  - Add multi-cloud decision logic

**Review Points**:
- Hoe werkt Phase 9 met 3 opties (Azure XOR AWS XOR GCP)?
- Is orchestrator logic complex genoeg?
- Zijn alle documentatie links correct?

---

### Phase 6: Scenario Integration (Week 6)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] Create S07-gcp-ml-platform.scenario.md
  - React + Python FastAPI + Cloud SQL + GKE + BigQuery
  - Cost breakdown: $350/month
  - Resources: GKE cluster + Cloud SQL + BigQuery
  - ML workload with Vertex AI
  
- [ ] Update S03 with GCP alternative
  - S03: Can use GKE instead of AKS or EKS
  - Cost comparison: GCP vs Azure vs AWS

- [ ] Create GCP deployment guide
  - gcloud setup
  - Service account permissions
  - Deployment Manager deployment

**Review Points**:
- Is S07 scenario realistisch voor ML workload?
- Zijn cost breakdowns accuraat?

---

## System Impact Analysis

### Modified Components
| Component | Change | Lines Added | Review Needed |
|-----------|--------|-------------|---------------|
| @architect.agent.md | Add GCP platform option | ~60 | YES |
| @code-architect.agent.md | Add Cloud Run patterns | ~120 | YES |
| AGENT_ACTIVATION_GUIDE.md | Add 2 agents | ~1,500 | YES |
| PHASE_FLOW.md | Update Phase 9 (3 options) | ~600 | YES |
| SYSTEM_ARCHITECTURE.md | Add GCP tier | ~800 | YES |
| README.md | Update agent count | ~30 | YES |

### New Components
| Component | Type | Lines | Review Needed |
|-----------|------|-------|---------------|
| @gcp-architect.agent.md | Agent spec | ~400 | YES |
| @gcp-deployment-specialist.agent.md | Agent spec | ~300 | YES |
| gcp-architecture.skill.md | Skill spec | ~250 | YES |
| gcp-deployment-manager.skill.md | Skill spec | ~200 | YES |
| 8 schema files | JSON schemas | ~1,200 | YES |
| S07 scenario | Scenario | ~500 | YES |
| **Total New** | - | **~2,850 lines** | - |

---

## Testing Considerations (User Will Test)

### Test Scenarios
1. **S07 GCP ML Platform**: Deploy React + Python + Cloud SQL to GKE
2. **GCP Cloud Run**: Serverless container deployment
3. **Multi-cloud**: Azure frontend + GCP BigQuery backend

### Validation Points
- [ ] @gcp-architect generates valid GCP resource recommendations
- [ ] Deployment Manager templates deploy successfully
- [ ] Cost estimates are accurate (including sustained use discounts)
- [ ] VPC firewall rules follow best practices
- [ ] IAM roles follow least-privilege principle
- [ ] GKE clusters are production-ready

---

## Dependencies

### Prerequisites
- F01 (AWS support) should be complete or in parallel ✅
- Phase 1 (existing system) must be 100% complete ✅
- @architect agent must support 3 platform options ✅

### Parallel Work
- Can be developed parallel with F01 (AWS support)
- Can be developed parallel with F04-F06 (Vue/Angular/Svelte)

### Blocking For
- F13 (Terraform multi-cloud) - needs Azure + AWS + GCP all complete

---

## Success Criteria

### Must Have
- ✅ @gcp-architect agent fully documented (400+ lines)
- ✅ @gcp-deployment-specialist agent fully documented (300+ lines)
- ✅ 2 GCP skills documented (450+ lines total)
- ✅ 8 schema files created with 100% coverage
- ✅ Phase 9 decision logic supports Azure XOR AWS XOR GCP
- ✅ At least 1 GCP scenario (S07) documented
- ✅ All existing documentation updated

### Should Have
- GCP cost calculator integration
- Deployment Manager linting
- GKE security best practices

### Nice to Have
- Terraform for GCP (kan wachten op F13)
- Multi-region GKE clusters
- BigQuery cost optimization

---

## Review Checklist

### Architecture Review
- [ ] Zijn @gcp-architect responsibilities duidelijk?
- [ ] Is Deployment Manager voldoende of moet Terraform nu al?
- [ ] Zijn GCP services goed gemapt?
- [ ] Is cost breakdown correct (per-second billing, CUD)?

### Integration Review
- [ ] Hoe werkt Phase 9 met 3 cloud opties?
- [ ] Is orchestrator logic te complex?
- [ ] Zijn alle schema dependencies opgelost?

### Documentation Review
- [ ] Zijn alle 6 documentatie files updated?
- [ ] Is agent count correct?
- [ ] Zijn decision trees met 3 opties helder?

### Quality Review
- [ ] Zijn schemas syntactisch correct?
- [ ] Zijn agent specifications compleet?
- [ ] Is S07 scenario realistisch voor ML workload?

---

## Risks & Mitigations

### Risk 1: Deployment Manager adoption low
**Impact**: Medium  
**Probability**: High  
**Mitigation**: Consider Terraform from start (F13 early integration)

### Risk 2: GKE complexity
**Impact**: High  
**Probability**: Medium  
**Mitigation**: Start met simple GKE cluster, uitbreiden later

### Risk 3: Cost modeling inaccurate (sustained use)
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**: Use GCP Pricing Calculator API

---

## Next Steps

1. **Review F01 eerst** - AWS is prioriteit, GCP kan parallel
2. **Beslissing: Deployment Manager vs Terraform** - Overleg met team
3. **GKE expertise** - Kubernetes knowledge needed

---

**Status**: ⏳ Awaiting Review  
**Reviewer**: [User]  
**Next Document**: F03-Terraform-Multi-Cloud-Support.md

