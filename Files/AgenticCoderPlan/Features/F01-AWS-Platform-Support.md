# Feature F01: AWS Platform Support

**Status**: Planned  
**Priority**: High  
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
- No cloud infrastructure needed
- Different platform already selected in @architect
```

**Betekenis**: Als gebruiker AWS kiest als platform, is er:
- ❌ Geen agent voor AWS cloud architectuur
- ❌ Geen IaC templates (CloudFormation/CDK)
- ❌ Geen cost optimization voor AWS
- ❌ Geen skill voor AWS best practices
- ❌ Geen schemas voor AWS resources

### Business Impact
- **50% van enterprise cloud gebruik is AWS** (vs 30% Azure)
- Grote enterprises gebruiken multi-cloud (AWS + Azure)
- Startup ecosysteem gebruikt veel AWS (samen met Vercel/Netlify)
- Kan geen AWS-native projecten ondersteunen

---

## Proposed Solution

### New Components Needed

#### 1. Agent: @aws-architect
**Responsibility**: AWS cloud infrastructure design  
**Phase**: 9 (parallel met @azure-architect)  
**Activation**: `IF platform == "AWS"`

**Output**:
- AWS service recommendations (EC2, ECS, Lambda, RDS, etc.)
- Cost breakdown per service
- Region selection (us-east-1, eu-west-1, etc.)
- High-availability setup (Multi-AZ, Auto Scaling)
- VPC design (subnets, security groups, NAT gateways)

#### 2. Agent: @cloudformation-specialist
**Responsibility**: Infrastructure-as-Code for AWS  
**Phase**: 9 (parallel met @bicep-specialist)  
**Activation**: `IF @aws-architect completed AND iac_required == true`

**Output**:
- CloudFormation templates (YAML/JSON)
- Nested stacks voor modularity
- Parameter files per environment
- Deployment scripts (AWS CLI, aws cloudformation deploy)

**Alternative**: @cdk-specialist (AWS CDK in TypeScript/Python)

#### 3. Skill: aws-architecture
**Type**: Process skill  
**Used by**: @aws-architect

**Content**:
- Well-Architected Framework (5 pillars)
- Service selection matrix (EC2 vs ECS vs Lambda)
- Cost optimization patterns
- Security best practices (IAM, KMS, Secrets Manager)
- Networking patterns (VPC, Transit Gateway)

#### 4. Skill: aws-cloudformation
**Type**: Code skill  
**Used by**: @cloudformation-specialist

**Content**:
- CloudFormation template structure
- Intrinsic functions (Ref, GetAtt, Sub)
- Resource types (AWS::EC2::Instance, AWS::RDS::DBInstance)
- Stack outputs and exports
- Change sets and drift detection

#### 5. Schemas (4 files)
```
.github/schemas/agents/
├── @aws-architect.input.schema.json
├── @aws-architect.output.schema.json
├── @cloudformation-specialist.input.schema.json
└── @cloudformation-specialist.output.schema.json

.github/schemas/skills/
├── aws-architecture.input.schema.json
├── aws-architecture.output.schema.json
├── aws-cloudformation.input.schema.json
└── aws-cloudformation.output.schema.json
```

---

## Implementation Phases

### Phase 1: Research & Design (Week 1-2)
**Duration**: 10 dagen  
**Deliverables**:
- [ ] AWS service mapping (welke services voor welke use cases)
- [ ] Cost analysis vergelijking (Azure vs AWS)
- [ ] Well-Architected Framework review
- [ ] CloudFormation vs CDK decision document
- [ ] Activation logic design (hoe @aws-architect triggert)

**Review Points**:
- Welke AWS services zijn "must have" in MVP?
- CloudFormation of AWS CDK of beide?
- Hoe koppelen we AWS aan scenario's S01-S05?

---

### Phase 2: Agent Specifications (Week 2-3)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] @aws-architect.agent.md (400+ lines)
  - AWS service recommendations
  - Multi-AZ setup patterns
  - Cost breakdown methodology
  - Security baseline (IAM roles, security groups)
  - Hands off to @cloudformation-specialist
  
- [ ] @cloudformation-specialist.agent.md (300+ lines)
  - CloudFormation template generation
  - Nested stacks pattern
  - Parameter store integration
  - Stack outputs definition
  - Hands off to @devops-specialist

**Review Points**:
- Zijn alle AWS services gedekt die Azure architect ook doet?
- Is cost breakdown vergelijkbaar met Azure cost analysis?
- Zijn security best practices included (IAM, KMS)?

---

### Phase 3: Skill Definitions (Week 3)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] aws-architecture.skill.md (250+ lines)
  - Well-Architected Framework pillars
  - Service selection decision trees
  - Cost optimization patterns
  - Multi-region strategies
  - Disaster recovery patterns

- [ ] aws-cloudformation.skill.md (200+ lines)
  - CloudFormation syntax and structure
  - Resource dependencies
  - Stack policies
  - Change sets workflow
  - Best practices (parameterization, modularity)

**Review Points**:
- Zijn skills op zelfde niveau als azure-pipelines?
- Is er overlap met bestaande infrastructure-automation skill?

---

### Phase 4: Schema Creation (Week 4)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] @aws-architect.input.schema.json
  ```json
  {
    "architecture_requirements": {
      "compute_type": "EC2 | ECS | Lambda | EKS",
      "database_type": "RDS | DynamoDB | Aurora",
      "storage_type": "S3 | EFS | EBS",
      "regions": ["us-east-1", "eu-west-1"],
      "high_availability": true
    },
    "cost_constraints": {
      "budget_limit": 500,
      "cost_optimization_priority": "high | medium | low"
    }
  }
  ```

- [ ] @aws-architect.output.schema.json
  ```json
  {
    "aws_resources": [
      {
        "service": "EC2 | RDS | S3 | ...",
        "configuration": {},
        "estimated_monthly_cost": 150
      }
    ],
    "vpc_design": {
      "cidr_block": "10.0.0.0/16",
      "subnets": [],
      "security_groups": []
    },
    "total_estimated_cost": 500
  }
  ```

- [ ] @cloudformation-specialist schemas (input/output)
- [ ] aws-architecture skill schemas (input/output)
- [ ] aws-cloudformation skill schemas (input/output)

**Review Points**:
- Zijn schemas consistent met @azure-architect schemas?
- Is output format compatible met downstream agents?

---

### Phase 5: Integration with Existing System (Week 5)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] Update @architect.agent.md
  - Add AWS to platform decision matrix
  - Add AWS-specific architecture patterns
  
- [ ] Update @code-architect.agent.md
  - Add AWS Lambda patterns (if serverless)
  - Add AWS SDK integration examples
  
- [ ] Update AGENT_ACTIVATION_GUIDE.md
  - Add @aws-architect activation criteria
  - Add @cloudformation-specialist flow
  - Update decision tree (Azure OR AWS OR GCP)
  
- [ ] Update PHASE_FLOW.md
  - Add Phase 9 alternatives (Azure OR AWS)
  - Add parallel execution notes
  - Update timing estimates with AWS path

- [ ] Update SYSTEM_ARCHITECTURE.md
  - Add @aws-architect to Infrastructure Tier
  - Add extension points documentation
  - Update agent inventory (17 → 19 agents)

**Review Points**:
- Conflicteert AWS path met Azure path?
- Is Phase 9 decision logic helder (Azure XOR AWS)?
- Zijn alle documentatie links correct?

---

### Phase 6: Scenario Integration (Week 6)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] Create S06-aws-startup.scenario.md
  - React + Node.js + PostgreSQL RDS + AWS
  - Cost breakdown: $200/month
  - Resources: EC2 t3.small + RDS t3.micro + S3
  
- [ ] Update S01-S05 scenarios with AWS alternatives
  - S01: Can also deploy to AWS Elastic Beanstalk
  - S03: Can use AWS EKS instead of AKS
  - S05: Can use AWS with HIPAA compliance

- [ ] Create AWS deployment guide
  - Step-by-step CloudFormation deployment
  - IAM permissions needed
  - Cost monitoring setup

**Review Points**:
- Is S06 scenario realistisch qua kosten?
- Zijn AWS alternatieven helder gedocumenteerd?

---

## System Impact Analysis

### Modified Components
| Component | Change | Lines Added | Review Needed |
|-----------|--------|-------------|---------------|
| @architect.agent.md | Add AWS platform option | ~50 | YES |
| @code-architect.agent.md | Add AWS SDK patterns | ~100 | YES |
| AGENT_ACTIVATION_GUIDE.md | Add 2 agents | ~1,500 | YES |
| PHASE_FLOW.md | Update Phase 9 logic | ~500 | YES |
| SYSTEM_ARCHITECTURE.md | Add AWS tier | ~800 | YES |
| README.md | Update agent count 17→19 | ~30 | YES |

### New Components
| Component | Type | Lines | Review Needed |
|-----------|------|-------|---------------|
| @aws-architect.agent.md | Agent spec | ~400 | YES |
| @cloudformation-specialist.agent.md | Agent spec | ~300 | YES |
| aws-architecture.skill.md | Skill spec | ~250 | YES |
| aws-cloudformation.skill.md | Skill spec | ~200 | YES |
| 8 schema files | JSON schemas | ~1,200 | YES |
| S06 scenario | Scenario | ~500 | YES |
| **Total New** | - | **~2,850 lines** | - |

---

## Testing Considerations (User Will Test)

### Test Scenarios
1. **S06 AWS Startup**: Deploy React + Node.js + RDS to AWS
2. **S01 AWS Alternative**: Deploy same as S01 but on AWS instead of Azure
3. **Multi-cloud**: Azure frontend + AWS backend (edge case)

### Validation Points
- [ ] @aws-architect generates valid AWS resource recommendations
- [ ] CloudFormation templates deploy successfully
- [ ] Cost estimates are accurate (within 10% of actual)
- [ ] Security groups follow best practices
- [ ] VPC design is production-ready
- [ ] IAM roles follow least-privilege principle

---

## Dependencies

### Prerequisites
- Phase 1 (existing system) must be 100% complete ✅
- @architect agent must support platform selection ✅
- Schema validation framework must be in place ✅

### Parallel Work
- Can be developed parallel with F02 (GCP support)
- Can be developed parallel with F04-F06 (Vue/Angular/Svelte)

### Blocking For
- F13 (Terraform multi-cloud) - needs AWS + Azure both complete
- F14 (AWS CDK alternative) - needs @aws-architect complete

---

## Success Criteria

### Must Have
- ✅ @aws-architect agent fully documented (400+ lines)
- ✅ @cloudformation-specialist agent fully documented (300+ lines)
- ✅ 2 AWS skills documented (450+ lines total)
- ✅ 8 schema files created with 100% coverage
- ✅ Phase 9 decision logic supports AWS XOR Azure
- ✅ At least 1 AWS scenario (S06) documented
- ✅ All existing documentation updated (agent counts, flows)

### Should Have
- AWS cost calculator integration
- CloudFormation linting in @cloudformation-specialist
- AWS Well-Architected Tool integration

### Nice to Have
- AWS CDK alternative agent (@cdk-specialist)
- Multi-region deployment support
- AWS cost anomaly detection

---

## Review Checklist

### Architecture Review
- [ ] Zijn @aws-architect responsibilities duidelijk?
- [ ] Is CloudFormation template structuur correct?
- [ ] Zijn AWS services goed gemapt (EC2, RDS, Lambda, etc)?
- [ ] Is cost breakdown methodologie consistent met Azure?

### Integration Review
- [ ] Conflicteert AWS path met bestaande Azure path?
- [ ] Is Phase 9 decision logic helder (Azure XOR AWS XOR GCP)?
- [ ] Zijn alle schema dependencies opgelost?
- [ ] Is orchestrator logic updated?

### Documentation Review
- [ ] Zijn alle 6 documentatie files updated?
- [ ] Is agent count correct (17 → 19)?
- [ ] Zijn alle decision trees updated?
- [ ] Zijn links naar nieuwe agents correct?

### Quality Review
- [ ] Zijn schemas syntactisch correct (valid JSON)?
- [ ] Zijn agent specifications compleet (all sections)?
- [ ] Zijn skill definitions op zelfde niveau als bestaande?
- [ ] Is S06 scenario realistisch en testbaar?

---

## Risks & Mitigations

### Risk 1: CloudFormation complexity
**Impact**: Medium  
**Probability**: High  
**Mitigation**: Start met simpele templates (EC2 + RDS), uitbreiden in iteraties

### Risk 2: Cost estimates inaccurate
**Impact**: High  
**Probability**: Medium  
**Mitigation**: Gebruik AWS Pricing Calculator API, valideer met real deployments

### Risk 3: Security misconfigurations
**Impact**: High  
**Probability**: Medium  
**Mitigation**: Gebruik AWS security best practices, integreer CloudFormation Guard

### Risk 4: Integration conflicts
**Impact**: Medium  
**Probability**: Low  
**Mitigation**: Phased integration, test na elke fase

---

## Next Steps

1. **Review dit document** - Valideer of approach klopt
2. **Goedkeuring voor Phase 1** - Start research & design
3. **Parallel features identificeren** - Welke andere features kunnen parallel?
4. **Resource allocation** - Wie werkt aan AWS support?

---

**Status**: ⏳ Awaiting Review  
**Reviewer**: [User]  
**Next Document**: F02-GCP-Platform-Support.md

