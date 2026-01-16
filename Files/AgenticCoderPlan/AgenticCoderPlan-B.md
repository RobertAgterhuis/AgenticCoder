# AgenticCoder Comprehensive Plan - Phase B: Architecture & Design

**Document**: AgenticCoderPlan-B.md  
**Version**: 1.0  
**Date**: January 13, 2026  
**Status**: Architecture & Design Specification  

---

> ## ⚠️ Implementation Reality (January 2026)
> 
> This document contains the **original architecture vision**. Key differences in implementation:
> 
> | Planned Component | Current Implementation |
> |-------------------|----------------------|
> | 13 agents + 9 skills | **19 agents** (skills merged into agents) |
> | Individual resource analyzers | **DynamicResourceAnalyzer** (single unified engine) |
> | Phase 0-7 workflow | **5-step scenario pipeline** (Extract → Analyze → Cost → Plan → Validate) |
> | Webhook/Docker/API transports | **MCP stdio + HTTP** transports |
> 
> **Current agents in `agents/core/agents/`**:
> - CoordinatorAgent, PlanAgent, ArchitectAgent, CodeArchitectAgent
> - QAAgent, ReporterAgent, AzurePrincipalArchitectAgent
> - BicepPlanAgent, TerraformPlanAgent, DiagramAgent, ADRAgent
> - BicepImplementAgent, TerraformImplementAgent, DockerSpecialistAgent
> 
> **For current architecture, see**: [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)

---

## Executive Summary

This document specifies the **detailed architecture, design patterns, and implementation approach** for v1.0 of the merged Agentic Coder platform. It serves as the technical blueprint for integrating ProjectPlan Template and Azure Agentic InfraOps into a cohesive, extensible system.

---

## Part 1: Integrated Workflow Architecture

### 1.1 End-to-End Workflow Model

```
┌──────────────────────────────────────────────────────────────────┐
│                    AGENTIC CODER WORKFLOW v1.0                    │
│                     (Merged Platform v1.0)                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PHASE 0: DISCOVERY & PROJECT PLANNING (User-Driven, 30 min)     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 0.1: Initiate Discovery                                    │
│  User: /generate-project                                         │
│         └─ Load: discovery framework                             │
│                                                                   │
│  Step 0.2: Answer Adaptive Questions (22 questions)              │
│  Agent: project-plan-generator                                   │
│  Skills: project-structure, tech-stack, compliance               │
│  Output: ProjectPlan/ (50+ documents)                            │
│                                                                   │
│  Step 0.3: Generate Supporting Plans                             │
│  Agents:                                                          │
│    - doc-writer → Context & Architecture docs                    │
│    - backlog-strategist → Epics, stories, NFRs, risks            │
│    - implementation-coordinator → Phases, timelines, checklists  │
│    - qa-validator → Testing strategy, compliance gates           │
│  Skills: All core skills                                         │
│  Output: Complete ProjectPlan                                    │
│                                                                   │
│  Step 0.4: Project Plan Approval                                 │
│  User reviews, provides feedback, approves for next phase        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 1: INFRASTRUCTURE DISCOVERY & REQUIREMENTS (User, 10 min)  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 1.1: User-Provided Requirements                            │
│  User: "Create HIPAA-compliant patient portal with App Service   │
│         and SQL Database in Azure"                               │
│                                                                   │
│  Step 1.2: Collect Requirements Document                         │
│  Agent: @plan (built-in VS Code feature)                         │
│  Output: 01-requirements.md                                      │
│                                                                   │
│  Step 1.3: Requirements Approval                                 │
│  User: "yes" or "approve"                                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 2: ARCHITECTURE ASSESSMENT (Auto, 20 min)                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 2.1: WAF Assessment & Cost Estimation                      │
│  Agent: azure-principal-architect                                │
│  Skills: azure-infrastructure                                    │
│  Tools: Azure Pricing MCP, Microsoft Docs MCP                    │
│  Output: 02-architecture-assessment.md                           │
│         03-des-cost-estimate.md                                  │
│                                                                   │
│  Step 2.2: (Optional) Generate Design Diagrams                   │
│  Agent: diagram-generator                                        │
│  Output: 03-des-diagram.py, .png                                │
│                                                                   │
│  Step 2.3: (Optional) Document Design Decisions                  │
│  Agent: adr-generator                                            │
│  Output: 03-des-adr-*.md                                        │
│                                                                   │
│  Step 2.4: Architecture Approval                                 │
│  User: "yes" or "approve"                                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 3: IMPLEMENTATION PLANNING (Auto, 15 min)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 3.1: Governance Discovery                                  │
│  Agent: bicep-plan                                               │
│  Skills: azure-infrastructure, iac-baseline                      │
│  Tools: Azure Resource Graph, Microsoft Docs                     │
│  Actions:                                                        │
│    - Query Azure Policy assignments                              │
│    - Identify compliance constraints                             │
│    - Generate resource dependency diagrams                       │
│  Output: 04-implementation-plan.md                               │
│         04-governance-constraints.md                             │
│         04-governance-constraints.json                           │
│                                                                   │
│  Step 3.2: Implementation Plan Approval                          │
│  User: "yes" or "approve"                                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 4: CODE GENERATION (Auto, 20-30 min)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 4.1: Generate Bicep Templates                              │
│  Agent: bicep-implement                                          │
│  Skills: azure-infrastructure, iac-baseline                      │
│  Actions:                                                        │
│    - Create infra/bicep/{project}/main.bicep                     │
│    - Generate modules/ folder with AVM-based modules             │
│    - Create deploy.ps1 with validation gates                     │
│    - Run: bicep build, bicep lint, security scan                 │
│  Output: Bicep templates in infra/bicep/{project}/               │
│         05-implementation-reference.md                           │
│         Validation results                                       │
│                                                                   │
│  Step 4.2: (Optional) Generate As-Built Diagrams                │
│  Agent: diagram-generator                                        │
│  Output: 07-ab-diagram.py, .png (preview of deployed state)     │
│                                                                   │
│  Step 4.3: Code Approval                                         │
│  User: "yes", "approve", or "deploy"                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 5: DEPLOYMENT (Auto, 10-20 min)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 5.1: Validate Azure Credentials                            │
│  Agent: deploy-coordinator (NEW)                                │
│  Actions:                                                        │
│    - Check: az account show                                      │
│    - Verify permissions (Contributor role)                       │
│    - Confirm subscription & region                               │
│                                                                   │
│  Step 5.2: Pre-Deployment Validation                             │
│  Actions:                                                        │
│    - Run: az deployment group what-if                            │
│    - Parse change summary (+ create, ~ modify, - delete)         │
│    - Display expected resources                                  │
│                                                                   │
│  Step 5.3: Deploy to Azure                                       │
│  User: Confirm what-if output, type "deploy"                    │
│  Agent: deploy-coordinator                                      │
│  Actions:                                                        │
│    - Execute: az deployment group create                         │
│    - Monitor deployment progress                                 │
│    - Collect deployed resource IDs                               │
│  Output: 06-deployment-summary.md                                │
│         Resource list with endpoints                             │
│                                                                   │
│  Step 5.4: (Optional) Generate Workload Documentation            │
│  Agent: workload-documentation-generator                         │
│  Output: 07-workload-documentation.md                            │
│         Design document, runbook, inventory                      │
│                                                                   │
│  Step 5.5: Complete Deployment Handoff                           │
│  Output: All 07-* files (as-built artifacts)                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Workflow State Machine

```
                         ┌─────────────┐
                         │   STARTUP   │
                         └──────┬──────┘
                                │
                    /generate-project
                                │
                         ┌──────▼──────┐
                         │ DISCOVERY   │
                         │ (Phase 0)   │
                         └──────┬──────┘
                                │
                     ProjectPlan approval
                                │
                    /plan-infrastructure
                                │
                         ┌──────▼──────┐
         ┌───────────────▶│ REQUIREMENT │◀─────────────┐
         │                │ (Phase 1)   │              │
         │                └──────┬──────┘              │
         │                       │                     │
         │              @plan agent outputs            │
         │                       │                     │
         │                ┌──────▼──────┐              │
         │       ┌────────▶│ ASSESSMENT  │◀────────┐   │
         │       │         │ (Phase 2)   │         │   │
         │       │         └──────┬──────┘         │   │
         │       │                │                │   │
         │   user feedback    architecture       user feedback
         │                   assessment            │   │
         │       │         ┌──────▼──────┐         │   │
         │       └────────▶│  PLANNING   │◀────────┘   │
         │                 │ (Phase 3)   │             │
         │                 └──────┬──────┘             │
         │                        │                    │
         │                  governance & plan          │
         │                  approval                   │
         │                        │                    │
         │                 ┌──────▼──────┐             │
         │       ┌────────▶│ GENERATION  │◀────────┐   │
         │       │         │ (Phase 4)   │         │   │
         │       │         └──────┬──────┘         │   │
         │       │                │                │   │
         │   validation           Bicep           code feedback
         │   failure              code             │   │
         │       │                │                │   │
         │       │         ┌──────▼──────┐         │   │
         │       └────────▶│ DEPLOYMENT  │◀────────┘   │
         │                 │ (Phase 5)   │             │
         │                 └──────┬──────┘             │
         │                        │                    │
         │               user confirms what-if         │
         │                        │                    │
         │                 ┌──────▼──────┐             │
         │                 │  DEPLOYED   │             │
         │                 │ (Complete)  │             │
         │                 └─────────────┘             │
         │                                             │
         └─────────────────────────────────────────────┘
         (User can restart at any phase)
```

---

## Part 2: Agent Architecture

### 2.1 Agent Specification Template

**Each agent defined in `.github/agents/{name}.agent.md` includes**:

```yaml
---
name: Human-readable agent name
description: One-sentence purpose
tools:
  - list of available tools
handoffs:
  - label: Target agent/action
    agent: agent-name
    prompt: Context to pass
    send: boolean
---

# Agent Name

## Core Responsibilities
- Primary goal
- Key outputs
- Success criteria

## Workflow Integration
- Position in workflow
- Input requirements
- Output specifications
- Approval gates

## Guardrails
- DO list (required actions)
- DO NOT list (prohibited actions)
- Edge cases and constraints

## Best Practices
- Standards and patterns
- Common mistakes to avoid
- Reference materials
```

### 2.2 Agent Roster with Specifications

**Agent 1: project-plan-generator**
```
Role: Orchestrator (Phase 0)
Inputs: User requirements (22 questions)
Outputs: Complete ProjectPlan/ structure (50+ documents)
Skills: project-structure, tech-stack, compliance
Handoffs: doc-writer, backlog-strategist, implementation-coordinator, qa-validator
Key Tasks:
  - Ask 22 adaptive discovery questions
  - Generate ProjectPlan with all 5 phases
  - Configure agent team
  - Create initial checklists
Success Metric: ProjectPlan complete, user approval received
```

**Agent 2: doc-writer**
```
Role: Documentation specialist (Phase 0-1)
Inputs: ProjectPlan, requirements
Outputs: Context docs, architecture documents
Skills: project-structure, tech-stack, compliance
Handoffs: (no handoffs, supports other agents)
Key Tasks:
  - Write context documents
  - Create architecture documentation
  - Generate runbooks and guides
Success Metric: All documentation complete, > 90% coverage
```

**Agent 3: backlog-strategist**
```
Role: Backlog specialist (Phase 0)
Inputs: ProjectPlan, requirements
Outputs: Epics, user stories, acceptance criteria
Skills: project-structure
Handoffs: (no handoffs, supports other agents)
Key Tasks:
  - Create epics from requirements
  - Generate user stories with acceptance criteria
  - Identify risks and dependencies
  - Estimate effort and timeline
Success Metric: Backlog complete, stories testable
```

**Agent 4: implementation-coordinator**
```
Role: Phase planner (Phase 0)
Inputs: ProjectPlan, timeline, scope
Outputs: Phase folders, checklists, milestones
Skills: project-structure
Handoffs: (no handoffs, supports orchestrator)
Key Tasks:
  - Create phase structure
  - Generate phase checklists
  - Define DoD (Definition of Done)
  - Plan timelines and dependencies
Success Metric: All phases planned, gates defined
```

**Agent 5: qa-validator**
```
Role: QA specialist (Phase 0 + parallel)
Inputs: ProjectPlan, each deliverable
Outputs: Test strategy, compliance matrix
Skills: compliance
Handoffs: (no handoffs, validation gate)
Key Tasks:
  - Create test strategy
  - Define compliance gates
  - Check accessibility requirements
  - Validate deliverables
Success Metric: Test coverage ≥ 80%, all gates pass
```

**Agent 6: azure-principal-architect**
```
Role: Infrastructure architect (Phase 2)
Inputs: Requirements (from @plan)
Outputs: WAF assessment, cost estimate, architecture recommendations
Skills: azure-infrastructure
Tools: Azure Pricing MCP, Azure Resource Graph, Microsoft Docs
Handoffs: diagram-generator, adr-generator, bicep-plan
Key Tasks:
  - Score all 5 WAF pillars (0-10)
  - Generate cost estimates using real-time pricing
  - Recommend Azure services and SKUs
  - Document architecture trade-offs
Success Metric: WAF scores complete, costs validated, user approval
```

**Agent 7: bicep-plan**
```
Role: IaC planner (Phase 3)
Inputs: Architecture assessment
Outputs: Implementation plan, governance constraints
Skills: azure-infrastructure, iac-baseline
Tools: Azure Resource Graph, Microsoft Docs
Handoffs: bicep-implement
Key Tasks:
  - Query Azure Policy assignments
  - Identify governance constraints
  - Plan resource dependencies
  - Specify AVM modules and versions
  - Estimate costs per phase
Success Metric: Implementation plan complete, governance documented
```

**Agent 8: bicep-implement**
```
Role: IaC specialist (Phase 4)
Inputs: Implementation plan
Outputs: Bicep templates, deploy script, validation results
Skills: azure-infrastructure, iac-baseline
Tools: Bicep CLI, Microsoft Docs
Handoffs: deploy-coordinator, diagram-generator, adr-generator
Key Tasks:
  - Generate Bicep templates
  - Create modules for reusability
  - Run bicep build, lint, security scan
  - Generate deploy.ps1 with validation
  - Create 05-implementation-reference.md
Success Metric: bicep build passes, all validation gates pass
```

**Agent 9: deploy-coordinator (NEW)**
```
Role: Deployment orchestrator (Phase 5)
Inputs: Bicep templates, what-if approval
Outputs: Deployment summary, resource endpoints
Skills: azure-infrastructure
Tools: Azure CLI, PowerShell
Handoffs: workload-documentation-generator
Key Tasks:
  - Validate Azure credentials and permissions
  - Run what-if analysis
  - Execute deployment
  - Monitor progress
  - Collect resource details
Success Metric: Deployment successful, all resources created
```

**Agent 10: reporter**
```
Role: Progress tracker (All phases)
Inputs: Phase outputs, execution logs
Outputs: Implementation log, progress summaries
Skills: project-structure
Handoffs: (no handoffs, supports all agents)
Key Tasks:
  - Update implementation-log.md
  - Generate phase summaries
  - Flag blockers and risks
  - Create executive summaries
Success Metric: Log complete, all phases documented
```

**Agent 11: diagram-generator**
```
Role: Visualization specialist (Phases 2, 5)
Inputs: Architecture assessment or Bicep code
Outputs: Python diagrams library code, PNG images
Skills: azure-infrastructure
Tools: Python diagrams library
Handoffs: (no handoffs, on-demand)
Key Tasks:
  - Create architecture diagrams
  - Visualize resource relationships
  - Generate as-built diagrams
  - Export to PNG
Success Metric: Diagrams complete, PNG images generated
```

**Agent 12: adr-generator**
```
Role: ADR specialist (Phases 2, 5)
Inputs: Architecture decisions
Outputs: ADR markdown files
Skills: azure-infrastructure
Handoffs: (no handoffs, on-demand)
Key Tasks:
  - Document architectural decisions
  - Capture trade-offs and rationale
  - Record implementation decisions
  - Maintain ADR index
Success Metric: ADRs complete, linked from phase documentation
```

**Agent 13: workload-documentation-generator**
```
Role: Final documentation (Phase 5)
Inputs: All artifacts (WAF assessment, plan, code, deployment)
Outputs: Workload documentation package
Skills: azure-infrastructure
Handoffs: (terminal agent, no handoffs)
Key Tasks:
  - Create design document
  - Generate operations runbook
  - Build resource inventory
  - Document compliance matrix
Success Metric: Documentation complete, customer-ready
```

---

## Part 3: Skills Architecture

### 3.1 Skill Specification Template

**Each skill defined in `.github/skills/{name}.skill.md` includes**:

```markdown
# Skill Name

## Domain
[Description of what this skill covers]

## Applicable Agents
[List of agents that use this skill]

## Knowledge Areas
### Topic 1
[Detailed guidance]
- Best practices
- Common patterns
- Anti-patterns and gotchas
- References

### Topic 2
[Detailed guidance]

## Guardrails
[Domain-specific constraints]

## Tools & References
[External resources, documentation links]

## Examples
[Code snippets, templates, scenarios]
```

### 3.2 Skills Library (v1.0)

**Existing Skills (Retained from ProjectPlan)**:

1. **project-structure.skill.md**
   - ProjectPlan folder map and organization
   - Cross-document references
   - Artifact location conventions
   - Phase lifecycle management

2. **tech-stack.skill.md**
   - Technology selection methodology
   - FinOps / Cost guardrails
   - Language/framework/tool evaluation
   - Dependency management

3. **compliance.skill.md**
   - Security patterns
   - Authentication & authorization
   - Testing strategies
   - AI safety and bias considerations
   - Data protection and residency

4. **iac-baseline.skill.md**
   - Infrastructure-as-code structure
   - Secrets management
   - Validation hooks and gates
   - Cost controls and guardrails

5. **cicd-pipeline.skill.md**
   - Multi-stage pipeline design
   - Quality gates and approvals
   - Artifact management and signing
   - Release automation

6. **backend-skeleton.skill.md**
   - Service skeleton patterns
   - Health checks and monitoring
   - Authentication integration
   - Logging and tracing

7. **middleware-gateway.skill.md**
   - Edge policies (authentication, rate limiting)
   - CORS and header management
   - Request/response transformation
   - Security policies

8. **frontend-starter.skill.md**
   - SVG-first design approach
   - Mandated color palette
   - Manrope typography
   - Accessibility standards (WCAG 2.1 AA)

**New Skill (Azure-Specific)**:

9. **azure-infrastructure.skill.md** (NEW - COMPREHENSIVE)
   ```
   ### Architecture Patterns
   - Hub-spoke network topology
   - Multi-tier application patterns
   - High-availability configurations
   - Disaster recovery strategies
   
   ### Azure Services (curated list for v1.0)
   - Compute: App Service, Azure Functions, Container Instances, VMs
   - Networking: VNet, NSG, Load Balancer, Application Gateway
   - Data: SQL Database, Cosmos DB, Storage Accounts
   - Monitoring: Application Insights, Log Analytics
   - Security: Key Vault, Azure AD, Network Security
   - DevOps: Azure Repos, Pipelines, Artifacts
   
   ### Well-Architected Framework (WAF)
   - Security pillar patterns
   - Reliability patterns (failover, backup, DR)
   - Performance optimization
   - Cost optimization strategies
   - Operational excellence patterns
   
   ### Azure Verified Modules (AVM)
   - Using AVM modules (br/public:avm/...)
   - Latest module versions
   - Module composition and dependencies
   - When to use raw resources vs AVM
   
   ### Cloud Adoption Framework (CAF)
   - Resource naming conventions
   - Tagging strategy
   - Subscription and resource group structure
   - Governance patterns
   
   ### Cost Optimization
   - Azure Pricing MCP integration
   - SKU selection and recommendations
   - Reserved instances and Hybrid Benefit
   - Cost monitoring and alerts
   
   ### Governance & Compliance
   - Azure Policy alignment
   - Compliance frameworks (HIPAA, PCI-DSS, etc.)
   - Audit logging and monitoring
   - Role-based access control (RBAC)
   
   ### Bicep Best Practices
   - Bicep syntax and structure
   - Module patterns and reusability
   - Parameterization and outputs
   - Deployment scripts and validation
   - Progressive deployment for complex infrastructure
   ```

---

## Part 4: Integration Layer Design

### 4.1 MCP Server Architecture

```
┌─────────────────────────────────────────────────────────┐
│              MCP Server Configuration                   │
│            (.vscode/mcp.json)                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ azure-pricing-mcp                                │  │
│  │ Purpose: Real-time Azure pricing and cost est.  │  │
│  │ Tools:                                            │  │
│  │   - azure_price_search                           │  │
│  │   - azure_cost_estimate                          │  │
│  │   - azure_price_compare                          │  │
│  │   - azure_region_recommend                       │  │
│  │   - azure_discover_skus                          │  │
│  │   - azure_sku_discovery                          │  │
│  │ Used By: architect, bicep-plan                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ azure-resource-graph-mcp                         │  │
│  │ Purpose: Query governance and policy             │  │
│  │ Tools:                                            │  │
│  │   - azure_query_azure_resource_graph             │  │
│  │   - azure_get_auth_context                       │  │
│  │   - azure_set_auth_context                       │  │
│  │ Used By: bicep-plan, deploy-coordinator          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ microsoft-docs-mcp                               │  │
│  │ Purpose: Fetch latest Microsoft documentation    │  │
│  │ Tools:                                            │  │
│  │   - microsoft_docs_search                        │  │
│  │   - azure_query_learn                            │  │
│  │ Used By: All agents (research-first guardrail)   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ web-search-mcp                                   │  │
│  │ Purpose: Fallback documentation lookup           │  │
│  │ Tools:                                            │  │
│  │   - web_search                                   │  │
│  │ Used By: All agents (when docs unavailable)      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ bicep-mcp (EXPERIMENTAL)                         │  │
│  │ Purpose: Bicep validation and best practices     │  │
│  │ Tools:                                            │  │
│  │   - bicep_build (validation)                     │  │
│  │   - bicep_lint (best practices)                  │  │
│  │   - bicep_format (code formatting)               │  │
│  │ Used By: bicep-implement                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow Through Integration Layer

```
Agent Request
    ↓
[Agent evaluates which MCP tool is needed]
    ↓
[Calls appropriate MCP server with parameters]
    ↓
[MCP server fetches real-time data from Azure/Microsoft]
    ↓
[Agent receives structured response]
    ↓
[Agent processes and incorporates into output]
    ↓
[Document updated with sourced information]
```

---

## Part 5: Artifact Management Architecture

### 5.1 Output Folder Structure

```
{workspace}/
├── AgenticCoderPlan-A.md              # Overview & Analysis
├── AgenticCoderPlan-B.md              # Architecture & Design
├── AgenticCoderPlan-C.md              # Implementation & Phase 1
├── AgenticCoderPlan-D.md              # Extended Roadmap
│
├── .github/
│   ├── GUARDRAILS.md                 # [CANONICAL] Non-negotiable rules
│   ├── AGENTS.md                      # Agent orchestration guide
│   ├── INDEX.md                       # Complete navigation
│   │
│   ├── agents/                        # Agent specifications
│   │   ├── project-plan-generator.agent.md
│   │   ├── doc-writer.agent.md
│   │   ├── ... (9 existing agents)
│   │   ├── deploy-coordinator.agent.md (NEW)
│   │   └── README.md
│   │
│   ├── skills/                        # Knowledge base
│   │   ├── project-structure.skill.md
│   │   ├── ... (8 existing skills)
│   │   ├── azure-infrastructure.skill.md (NEW)
│   │   └── README.md
│   │
│   ├── integration/                   # Integration utilities (NEW)
│   │   ├── workflow-orchestrator.md   # Multi-phase coordination
│   │   ├── mcp-server-manager.md      # MCP lifecycle
│   │   └── artifact-manager.md        # Cross-phase handling
│   │
│   └── workflows/                     # GitHub Actions
│       └── ...
│
├── .vscode/
│   ├── mcp.json                       # MCP server configuration
│   ├── settings.json
│   └── extensions.json
│
├── .devcontainer/
│   ├── Dockerfile
│   ├── devcontainer.json
│   └── post-create-command.sh
│
├── ProjectPlan/                       # Generated on first run
│   ├── 01-Context/
│   ├── 02-Architecture/
│   ├── 03-Phases/
│   ├── 04-Backlog/
│   ├── 05-Appendix/
│   └── implementation-log.md
│
├── agent-output/                      # Infrastructure outputs
│   └── {project-name}/
│       ├── 01-requirements.md
│       ├── 02-architecture-assessment.md
│       ├── 03-des-cost-estimate.md
│       ├── 03-des-diagram.py / .png
│       ├── 03-des-adr-*.md
│       ├── 04-implementation-plan.md
│       ├── 04-governance-constraints.md
│       ├── 04-governance-constraints.json
│       ├── 05-implementation-reference.md
│       ├── 06-deployment-summary.md
│       ├── 07-ab-diagram.py / .png
│       ├── 07-ab-adr-*.md
│       └── 07-workload-documentation.md
│
├── infra/
│   └── bicep/
│       └── {project-name}/
│           ├── main.bicep
│           ├── modules/
│           │   ├── networking.bicep
│           │   ├── security.bicep
│           │   └── ... (service modules)
│           ├── deploy.ps1
│           └── parameters.json
│
├── docs/
│   ├── getting-started/
│   │   ├── quickstart.md
│   │   ├── installation.md
│   │   └── first-project.md
│   │
│   ├── workflow/
│   │   ├── overview.md
│   │   ├── phases.md
│   │   └── agent-interactions.md
│   │
│   ├── agents/
│   │   ├── specifications.md
│   │   ├── orchestration.md
│   │   └── how-to-create.md
│   │
│   ├── skills/
│   │   ├── library.md
│   │   └── how-to-create.md
│   │
│   ├── azure/
│   │   ├── bicep-patterns.md
│   │   ├── waf-framework.md
│   │   ├── caf-compliance.md
│   │   ├── governance.md
│   │   └── cost-optimization.md
│   │
│   ├── guides/
│   │   ├── troubleshooting.md
│   │   ├── best-practices.md
│   │   └── extension-patterns.md
│   │
│   ├── adr/
│   │   ├── ADR-001-why-merged-framework.md
│   │   ├── ADR-002-agent-architecture.md
│   │   └── ... (more ADRs)
│   │
│   ├── scenarios/
│   │   ├── S01-simple-app-service/
│   │   ├── S02-hub-spoke-network/
│   │   └── ... (5+ scenarios)
│   │
│   └── reference/
│       ├── defaults.md
│       └── version-history.md
│
├── mcp/
│   └── azure-pricing-mcp/
│       ├── .venv/
│       ├── src/
│       ├── requirements.txt
│       └── README.md
│
└── README.md                          # Root overview
```

### 5.2 Artifact Lifecycle

**Phase 0 (Discovery)**:
- ProjectPlan/ created at root
- 50+ documents generated
- implementation-log.md started

**Phase 1 (Requirements)**:
- agent-output/{project}/ created
- 01-requirements.md generated and saved

**Phase 2 (Assessment)**:
- 02-architecture-assessment.md saved
- 03-des-cost-estimate.md saved
- 03-des-*.md (diagrams, ADRs) generated on-demand

**Phase 3 (Planning)**:
- 04-implementation-plan.md saved
- 04-governance-constraints.* saved
- Resource dependency diagrams generated

**Phase 4 (Generation)**:
- infra/bicep/{project}/ created
- Bicep templates generated
- deploy.ps1 created
- 05-implementation-reference.md saved
- Validation results logged

**Phase 5 (Deployment)**:
- Resources deployed to Azure
- 06-deployment-summary.md saved
- 07-*.md files generated
- implementation-log.md updated

---

## Part 6: Extensibility Patterns

### 6.1 Adding New Agents

**Checklist**:
1. ✅ Create `.github/agents/{agent-name}.agent.md`
2. ✅ Follow agent specification template
3. ✅ Define inputs, outputs, responsibilities
4. ✅ Specify required skills
5. ✅ Document handoff points
6. ✅ Add to `.github/agents/README.md` roster
7. ✅ Create scenarios to test agent
8. ✅ Document in `.github/AGENTS.md` workflow

**Example** (Adding AWS Agent):
```
.github/agents/aws-principal-architect.agent.md
├── Name: AWS Principal Architect
├── Inputs: Requirements (from @plan)
├── Outputs: AWS architecture assessment, cost estimate
├── Skills: aws-infrastructure (NEW skill)
├── Handoffs: bicep-plan → aws-plan (NEW)
└── Tools: aws-pricing-mcp (NEW MCP server)
```

### 6.2 Adding New Skills

**Checklist**:
1. ✅ Create `.github/skills/{skill-name}.skill.md`
2. ✅ Follow skill specification template
3. ✅ Define domain and knowledge areas
4. ✅ List applicable agents
5. ✅ Include examples and guardrails
6. ✅ Add to `.github/skills/README.md` library
7. ✅ Link from agent specifications
8. ✅ Include in scenarios

### 6.3 Adding New Domains (Multi-Cloud)

**Pattern** (AWS example):
```
Step 1: Create AWS agent suite
  .github/agents/aws-principal-architect.agent.md
  .github/agents/aws-iac-planner.agent.md
  .github/agents/aws-implement.agent.md
  .github/agents/aws-deploy-coordinator.agent.md

Step 2: Create AWS skills
  .github/skills/aws-infrastructure.skill.md
  .github/skills/aws-cost-optimization.skill.md

Step 3: Create AWS pricing MCP
  mcp/aws-pricing-mcp/ (similar to azure-pricing-mcp)

Step 4: Update orchestration
  .github/AGENTS.md → add AWS workflow
  .github/integration/workflow-orchestrator.md → handle cloud selection

Step 5: Create scenarios
  docs/scenarios/aws-scenarios/
    S01-vpc-baseline/
    S02-ec2-cluster/
    S03-rds-multi-az/

Step 6: Documentation
  docs/aws/ → AWS-specific guides
```

---

## Part 7: Validation & Quality Gates

### 7.1 Phase Validation Gates

**Phase 0 (Discovery)**:
- ✅ 22 questions answered
- ✅ ProjectPlan structure complete
- ✅ No blocked dependencies
- ✅ User approval obtained

**Phase 1 (Requirements)**:
- ✅ @plan output captured
- ✅ NFRs clearly defined
- ✅ Compliance requirements documented
- ✅ User approval obtained

**Phase 2 (Assessment)**:
- ✅ All 5 WAF pillars scored
- ✅ Cost estimates validated with MCP
- ✅ Architecture trade-offs documented
- ✅ User approval obtained

**Phase 3 (Planning)**:
- ✅ Governance constraints discovered
- ✅ Resource dependencies mapped
- ✅ AVM modules specified with versions
- ✅ Implementation phases defined
- ✅ User approval obtained

**Phase 4 (Generation)**:
- ✅ `bicep build` passes
- ✅ `bicep lint` passes (all warnings addressed)
- ✅ Security scan (`bicep lint --diagnostics-format sarif`) clean
- ✅ CAF naming conventions verified
- ✅ WAF best practices enforced
- ✅ Unique suffix for globally-unique resources
- ✅ User approval obtained

**Phase 5 (Deployment)**:
- ✅ Azure credentials validated
- ✅ What-if analysis reviewed
- ✅ Deployment executes successfully
- ✅ All resources created
- ✅ Endpoints documented

### 7.2 Guardrails Enforcement

**Automatic Checks**:
- ❌ Prevents deployment without bicep build passing
- ❌ Flags deprecated Azure services
- ❌ Warns on low WAF scores
- ❌ Blocks non-compliant resource naming
- ❌ Prevents hardcoded secrets in outputs

**Manual Gates**:
- ✅ User approval required before each phase transition
- ✅ Cost review before deployment
- ✅ What-if review before actual deployment
- ✅ Governance constraint acknowledgment

---

## Conclusion

This architecture provides:

1. **Integrated Workflow**: Seamless progression from discovery → planning → deployment
2. **Modular Design**: Clear separation between agents, skills, and integration points
3. **Extensibility**: Easy patterns for adding new agents, skills, and cloud providers
4. **Quality & Safety**: Multiple validation gates and guardrails
5. **Production-Ready**: All components tested and documented

---

**Document Navigation**:
- **A** - Overview & Analysis
- **B** (this file) - Architecture & Design
- **C** - Implementation & Phase 1
- **D** - Extended Roadmap & Future
