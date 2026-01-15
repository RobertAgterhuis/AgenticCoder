# Phase 1: Foundation Setup (Weeks 1-3)

**Duration**: 3 weeks (15 working days)  
**Team Size**: 5-6 people  
**Status**: Not Started  
**Dependencies**: None (Initial phase)

---

## Phase Objectives

Establish the foundational infrastructure, repository structure, and core MCP servers that will enable all subsequent development work. This phase focuses on creating a solid, reproducible development environment and proving the MCP integration concept.

### Primary Goals
1. ✅ Create unified repository structure combining both frameworks
2. ✅ Implement advanced Dev Container with all tools
3. ✅ Deploy 3 core MCP servers (Azure Pricing, Azure Resource Graph, Microsoft Docs)
4. ✅ Establish CI/CD pipelines
5. ✅ Set up project management and tracking
6. ✅ Create initial documentation framework

### Success Criteria
- [x] Developer can clone repo and start in Dev Container < 5 minutes
- [x] All 3 MCP servers respond to health checks
- [x] CI/CD pipeline runs successfully on PR
- [x] Documentation builds without errors
- [x] Team has access to all tools and systems

---

## Week 1: Repository Structure & Project Setup

### Sprint 1.1: Repository Architecture (Days 1-2)

#### Tasks

**T1.1.1: Create Unified Repository Structure** (8 hours)
- **Owner**: Tech Lead
- **Priority**: P0 (Blocker)
- **Description**: Design and implement the folder structure that merges both frameworks
- **Deliverables**:
  ```
  d:\repositories\AgenticCoder\
  ├── .github/
  │   ├── agents/                    # 35+ agent definitions
  │   ├── workflows/                 # CI/CD workflows
  │   ├── schemas/                   # JSON schemas
  │   └── .agenticcoder/            # Config & metadata
  ├── .devcontainer/
  │   ├── devcontainer.json
  │   ├── Dockerfile
  │   └── scripts/                   # Setup scripts
  ├── mcp/
  │   ├── azure-pricing-mcp/        # From repo + enhancements
  │   ├── azure-resource-graph-mcp/ # New
  │   ├── microsoft-docs-mcp/       # New
  │   ├── aws-pricing-mcp/          # Future
  │   └── gcp-pricing-mcp/          # Future
  ├── src/
  │   ├── agents/                    # Agent implementations
  │   ├── skills/                    # Skill implementations
  │   ├── systems/                   # 6 core systems
  │   │   ├── task-extraction/
  │   │   ├── orchestration/
  │   │   ├── validation/
  │   │   ├── execution-bridge/
  │   │   ├── bicep-avm-resolver/
  │   │   └── feedback-loop/
  │   ├── mcp-sdk/                   # MCP client library
  │   └── shared/                    # Shared utilities
  ├── tests/
  │   ├── unit/
  │   ├── integration/
  │   └── e2e/
  ├── docs/
  │   ├── getting-started/
  │   ├── architecture/
  │   ├── api-reference/
  │   └── guides/
  ├── scenarios/                      # 15+ end-to-end scenarios
  ├── agent-output/                   # Generated artifacts
  ├── infra/                          # Infrastructure templates
  │   ├── bicep/
  │   └── terraform/
  └── ProjectPlan/                    # This folder
  ```
- **Acceptance Criteria**:
  - All folders created with README.md
  - .gitignore configured appropriately
  - Links from Files/ directory preserved

**T1.1.2: Configure Git & GitHub Settings** (4 hours)
- **Owner**: DevOps Engineer
- **Priority**: P0
- **Description**: Set up branch protection, PR templates, issue templates
- **Deliverables**:
  - Branch protection rules for `main` and `develop`
  - PR template with checklist
  - Issue templates (bug, feature, question)
  - CODEOWNERS file
  - GitHub Labels configured
- **Acceptance Criteria**:
  - Cannot push directly to main
  - PR requires 1 approval
  - All templates render correctly

**T1.1.3: Initialize Project Management** (4 hours)
- **Owner**: Tech Lead
- **Priority**: P0
- **Description**: Set up GitHub Projects board, milestones, and tracking
- **Deliverables**:
  - GitHub Project board with columns (Backlog, Todo, In Progress, Review, Done)
  - Milestones for all 6 phases
  - All Phase 1 tasks added as issues
  - Team members assigned
- **Acceptance Criteria**:
  - All team members can access board
  - Issues linked to milestones
  - Automated workflows configured

**T1.1.4: Create License & Contribution Guidelines** (2 hours)
- **Owner**: Tech Lead
- **Priority**: P1
- **Description**: Define licensing and contribution process
- **Deliverables**:
  - LICENSE file (MIT)
  - CONTRIBUTING.md with guidelines
  - CODE_OF_CONDUCT.md
  - SECURITY.md for vulnerability reporting
- **Acceptance Criteria**:
  - All files present and formatted correctly
  - Links work correctly

### Sprint 1.2: Development Environment (Days 3-5)

**T1.2.1: Create Base Dev Container** (12 hours)
- **Owner**: DevOps Engineer + Senior Dev
- **Priority**: P0 (Blocker)
- **Description**: Build advanced Dev Container with all required tools
- **Reference**: [Files/AgenticCoderPlan/AgenticCoderPlan-F.md](../Files/AgenticCoderPlan/AgenticCoderPlan-F.md)
- **Deliverables**:
  - `.devcontainer/devcontainer.json` with configuration
  - `.devcontainer/Dockerfile` with multi-stage build
  - `.devcontainer/docker-compose.yml` (if needed)
  - Post-create, post-start, post-attach scripts
- **Tools to Include**:
  ```
  Core Tools:
  - Ubuntu 22.04 base
  - Python 3.10+
  - Node.js 20 LTS
  - Azure CLI + Bicep extension
  - AWS CLI
  - GCP CLI
  - PowerShell 7+
  - Docker-in-Docker
  - Git 2.40+
  
  Development Tools:
  - VS Code extensions (Python, Bicep, Docker, etc.)
  - pytest, black, ruff, mypy
  - npm, yarn
  - terraform
  - kubectl
  
  MCP Tools:
  - MCP SDK
  - MCP health checker
  - MCP debugging tools
  ```
- **Acceptance Criteria**:
  - Container builds in < 5 minutes (with cache)
  - All CLIs respond to `--version`
  - VS Code extensions auto-install
  - Terminal has color and formatting
  - Python virtual environments work

**T1.2.2: Configure VS Code Settings** (4 hours)
- **Owner**: Senior Dev
- **Priority**: P1
- **Description**: Create workspace settings for consistent development
- **Deliverables**:
  - `.vscode/settings.json` with formatters, linters
  - `.vscode/extensions.json` with recommended extensions
  - `.vscode/launch.json` with debug configurations
  - `.vscode/tasks.json` with common tasks
  - `.vscode/mcp.json` template (will be populated in T1.3.x)
- **Acceptance Criteria**:
  - Python format on save works
  - Bicep validation shows in problems
  - Debug configurations launch successfully
  - Tasks run without errors

**T1.2.3: Create Environment Configuration** (4 hours)
- **Owner**: Senior Dev
- **Priority**: P1
- **Description**: Set up environment variable management
- **Deliverables**:
  - `.env.template` with all required variables
  - `.env.example` with sample values
  - `scripts/setup-env.sh` to guide setup
  - Documentation in `docs/getting-started/environment-setup.md`
- **Environment Variables**:
  ```
  # Azure
  AZURE_SUBSCRIPTION_ID=
  AZURE_TENANT_ID=
  AZURE_CLIENT_ID=
  AZURE_CLIENT_SECRET=
  
  # AWS (optional for v1.0)
  AWS_ACCESS_KEY_ID=
  AWS_SECRET_ACCESS_KEY=
  AWS_REGION=
  
  # MCP Servers
  AZURE_PRICING_API=https://prices.azure.com/api/retail/prices
  AZURE_PRICING_TIMEOUT=10
  AZURE_PRICING_RETRIES=3
  
  # Development
  LOG_LEVEL=INFO
  DEBUG_MODE=false
  ```
- **Acceptance Criteria**:
  - Template has all variables documented
  - Setup script creates .env from template
  - Application reads from .env correctly

---

## Week 2: MCP Server Implementation

### Sprint 1.3: Azure Pricing MCP Server (Days 6-8)

**T1.3.1: Copy & Enhance Azure Pricing MCP** (16 hours)
- **Owner**: Senior Dev 1 + Senior Dev 2
- **Priority**: P0 (Blocker)
- **Description**: Copy server from Azure Agentic InfraOps repo and enhance with caching
- **Reference**: `https://github.com/jonathan-vella/azure-agentic-infraops/tree/main/mcp/azure-pricing-mcp`
- **Source Structure to Copy**:
  ```
  mcp/azure-pricing-mcp/
  ├── src/
  │   └── azure_pricing_mcp/
  │       ├── __init__.py
  │       ├── server.py          # Main MCP server
  │       ├── handlers.py         # Tool implementations
  │       └── models.py           # Data models
  ├── tests/
  ├── requirements.txt
  ├── pyproject.toml
  ├── README.md
  └── Dockerfile
  ```
- **Enhancements to Add**:
  1. **Redis caching** for API responses (1-hour TTL)
  2. **Enhanced error handling** with retry logic
  3. **Logging** with structured logging (JSON format)
  4. **Metrics collection** (request count, latency, cache hits)
  5. **Health check endpoint** (`/health`)
  6. **Version endpoint** (`/version`)
- **Deliverables**:
  - Enhanced source code in `mcp/azure-pricing-mcp/`
  - Updated README with new features
  - Docker image builds successfully
  - Health check responds
- **Acceptance Criteria**:
  - All 7 tools work (azure_price_search, azure_cost_estimate, etc.)
  - Cache hit rate > 60% in testing
  - Response time < 2 seconds (99th percentile)
  - Docker image < 200MB

**T1.3.2: Create MCP SDK/Client Library** (12 hours)
- **Owner**: Senior Dev 1
- **Priority**: P0
- **Description**: Build reusable MCP client library for agents to use
- **Deliverables**:
  - `src/mcp-sdk/client.py` with MCP client
  - `src/mcp-sdk/types.py` with type definitions
  - `src/mcp-sdk/exceptions.py` with custom exceptions
  - Unit tests with mocking
  - Documentation
- **Features**:
  ```python
  from mcp_sdk import MCPClient
  
  client = MCPClient("azure-pricing")
  result = await client.call_tool(
      "azure_price_search",
      {"service": "Virtual Machines", "sku": "Standard_D2s_v3"}
  )
  ```
- **Acceptance Criteria**:
  - Client connects to MCP server via stdio
  - All 7 Azure Pricing tools callable
  - Error handling works (timeout, connection errors)
  - Unit tests pass with 90%+ coverage

**T1.3.3: Integration Testing** (8 hours)
- **Owner**: QA Engineer
- **Priority**: P1
- **Description**: Create comprehensive integration tests
- **Deliverables**:
  - Integration tests in `tests/integration/mcp/`
  - Test scenarios for all tools
  - Performance benchmarks
  - Load testing script
- **Test Scenarios**:
  1. Health check responds
  2. All tools return valid data
  3. Cache works correctly
  4. Concurrent requests handled
  5. Error handling works (bad parameters, API down)
  6. Timeout handling works
- **Acceptance Criteria**:
  - All tests pass
  - Performance meets SLA (< 2s response)
  - Cache hit rate verified
  - Load test handles 100 concurrent requests

### Sprint 1.4: Additional MCP Servers (Days 9-10)

**T1.4.1: Azure Resource Graph MCP Server** (12 hours)
- **Owner**: Senior Dev 2
- **Priority**: P0
- **Description**: Create MCP server for Azure Resource Graph queries
- **Purpose**: Query existing Azure resources, policy assignments, compliance
- **Deliverables**:
  - Server implementation in `mcp/azure-resource-graph-mcp/`
  - 5 tools implemented:
    1. `query_resources` - Query resources with KQL
    2. `get_policy_assignments` - Get policy assignments for subscription/RG
    3. `get_compliance_state` - Get compliance state for resources
    4. `list_resource_groups` - List resource groups
    5. `get_resource_tags` - Get tags for resources
  - Dockerfile
  - Tests
  - Documentation
- **Authentication**: Uses Azure CLI credentials or Managed Identity
- **Acceptance Criteria**:
  - All tools work against real Azure subscription
  - Query results cached for 5 minutes
  - Policy assignment discovery works
  - Tests pass

**T1.4.2: Microsoft Docs MCP Server** (10 hours)
- **Owner**: Senior Dev 1
- **Priority**: P1
- **Description**: Create MCP server for searching Microsoft documentation
- **Purpose**: Provide agents with real-time access to official docs
- **Deliverables**:
  - Server implementation in `mcp/microsoft-docs-mcp/`
  - 3 tools implemented:
    1. `search_docs` - Search Microsoft Learn
    2. `get_article` - Get article content
    3. `search_bicep_examples` - Search Bicep examples
  - Uses Microsoft Learn API or web scraping
  - Documentation
- **Acceptance Criteria**:
  - Search returns relevant results
  - Article content retrieved correctly
  - Bicep examples valid and up-to-date

---

## Week 3: CI/CD & Documentation Foundation

### Sprint 1.5: CI/CD Pipelines (Days 11-12)

**T1.5.1: Create GitHub Actions Workflows** (16 hours)
- **Owner**: DevOps Engineer + Senior Dev
- **Priority**: P0
- **Description**: Implement CI/CD pipelines for testing and deployment
- **Deliverables**:
  - `.github/workflows/ci.yml` - Run on every PR
  - `.github/workflows/cd.yml` - Run on merge to main
  - `.github/workflows/mcp-build.yml` - Build MCP Docker images
  - `.github/workflows/docs.yml` - Build and deploy docs
  - `.github/workflows/security.yml` - Security scanning
- **CI Workflow** (`ci.yml`):
  ```yaml
  name: CI
  on: [pull_request]
  jobs:
    lint:
      - black, ruff, mypy for Python
      - eslint for JavaScript
      - markdownlint for docs
    test:
      - pytest with coverage
      - Integration tests
    build:
      - Dev Container builds
      - MCP servers build
    security:
      - Bandit (Python security)
      - npm audit
      - Trivy (container scanning)
  ```
- **Acceptance Criteria**:
  - CI runs in < 10 minutes
  - All checks pass on sample PR
  - Security scan finds no critical issues
  - Coverage report generated

**T1.5.2: Configure Secrets & Environment** (4 hours)
- **Owner**: DevOps Engineer
- **Priority**: P0
- **Description**: Set up GitHub Secrets for CI/CD
- **Deliverables**:
  - GitHub Secrets configured:
    - `AZURE_CREDENTIALS` (service principal)
    - `DOCKER_USERNAME` / `DOCKER_PASSWORD`
    - `CODECOV_TOKEN` (code coverage)
  - GitHub Environments configured:
    - `development`
    - `staging`
    - `production`
  - Environment protection rules
- **Acceptance Criteria**:
  - Secrets accessible in workflows
  - Environments require approval
  - Service principal can deploy to Azure

**T1.5.3: Set Up Automated Testing** (8 hours)
- **Owner**: QA Engineer
- **Priority**: P1
- **Description**: Configure test automation and reporting
- **Deliverables**:
  - pytest configuration in `pyproject.toml`
  - Coverage configuration (.coveragerc)
  - Test reporting to Codecov/Coveralls
  - Performance benchmarking setup
  - Integration with GitHub Actions
- **Acceptance Criteria**:
  - Tests run automatically on PR
  - Coverage report shows in PR comment
  - Failed tests block merge
  - Performance regression detected

### Sprint 1.6: Initial Documentation (Days 13-15)

**T1.6.1: Create Getting Started Guide** (8 hours)
- **Owner**: Technical Writer + Tech Lead
- **Priority**: P0
- **Description**: Write comprehensive getting started documentation
- **Deliverables**:
  - `docs/getting-started/README.md`
  - `docs/getting-started/prerequisites.md`
  - `docs/getting-started/installation.md`
  - `docs/getting-started/first-project.md`
  - `docs/getting-started/troubleshooting.md`
- **Content**:
  1. Prerequisites (Docker, VS Code, Azure account)
  2. Clone and open in Dev Container
  3. Verify MCP servers running
  4. Run first example scenario
  5. Common issues and solutions
- **Acceptance Criteria**:
  - New team member can onboard in < 30 minutes
  - All links work
  - Screenshots up-to-date
  - Troubleshooting covers 90% of issues

**T1.6.2: Create Architecture Documentation** (12 hours)
- **Owner**: Tech Lead + Senior Dev
- **Priority**: P1
- **Description**: Document the system architecture
- **Reference**: Create enhanced version of [Files/docs/SYSTEM_ARCHITECTURE.md](../Files/docs/SYSTEM_ARCHITECTURE.md)
- **Deliverables**:
  - `docs/architecture/overview.md`
  - `docs/architecture/agents.md`
  - `docs/architecture/mcp-servers.md`
  - `docs/architecture/data-flow.md`
  - `docs/architecture/decision-records/` (ADRs)
  - Diagrams in Mermaid format
- **Acceptance Criteria**:
  - All diagrams render correctly
  - Agent responsibilities clear
  - Data flow documented
  - At least 5 ADRs created

**T1.6.3: Create API Reference Skeleton** (6 hours)
- **Owner**: Technical Writer
- **Priority**: P2
- **Description**: Set up API documentation framework
- **Deliverables**:
  - `docs/api-reference/` structure
  - Automated API doc generation configured (Sphinx for Python)
  - OpenAPI spec for MCP servers
  - Example API usage
- **Acceptance Criteria**:
  - Docs build without errors
  - API reference auto-updates from code
  - OpenAPI spec validates

**T1.6.4: Create README & Contributing Guide** (4 hours)
- **Owner**: Technical Writer
- **Priority**: P1
- **Description**: Write top-level README and contribution guidelines
- **Deliverables**:
  - Root `README.md` with project overview
  - `CONTRIBUTING.md` with contribution process
  - Issue templates
  - PR checklist
- **Acceptance Criteria**:
  - README has badges (build status, coverage)
  - Clear instructions for contributors
  - Templates render correctly

---

## Phase 1 Deliverables Summary

### Code Deliverables
- [x] Repository structure with 200+ files/folders
- [x] Dev Container with all tools configured
- [x] 3 MCP servers (Azure Pricing, Resource Graph, Microsoft Docs)
- [x] MCP SDK/client library
- [x] CI/CD pipelines (4 workflows)
- [x] Test framework with 50+ tests

### Documentation Deliverables
- [x] Getting Started Guide (5 documents)
- [x] Architecture Documentation (5 documents)
- [x] API Reference framework
- [x] README and Contributing Guide
- [x] At least 5 ADRs

### Infrastructure Deliverables
- [x] Docker images for 3 MCP servers
- [x] Dev Container image
- [x] GitHub Actions workflows
- [x] GitHub Project board configured
- [x] Secrets and environments configured

---

## Phase 1 Success Metrics

### Functional Metrics
- ✅ Developer onboarding time < 30 minutes
- ✅ Dev Container starts in < 3 minutes
- ✅ All MCP servers respond to health checks (100% uptime)
- ✅ CI pipeline passes on 95%+ of commits
- ✅ Documentation builds without errors

### Performance Metrics
- ✅ MCP server response time < 2 seconds (P99)
- ✅ CI pipeline completion time < 10 minutes
- ✅ Docker image build time < 5 minutes (with cache)
- ✅ Test suite runs in < 5 minutes

### Quality Metrics
- ✅ Code coverage > 80% for MCP servers
- ✅ Zero critical security vulnerabilities
- ✅ All linters pass (black, ruff, mypy)
- ✅ No broken links in documentation

---

## Phase 1 Risks & Mitigation

### High Risk
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| MCP server integration issues | High | Medium | Copy proven implementation from Azure Agentic InfraOps first, enhance later |
| Dev Container performance | Medium | Medium | Use multi-stage builds, optimize image layers |
| Team unfamiliarity with MCP | Medium | High | Dedicate first 2 days to MCP training, create examples |

### Medium Risk
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Azure API rate limiting | Medium | Low | Implement caching, backoff strategies |
| Documentation quality | Low | Medium | Peer review all docs, user testing |
| CI/CD complexity | Medium | Low | Start simple, add features iteratively |

---

## Phase 1 Dependencies

### External Dependencies
- GitHub repository access
- Azure subscription for testing
- Docker Hub or GitHub Container Registry
- Access to Azure Agentic InfraOps repository (for copying MCP server)

### Team Dependencies
- All team members available
- Development machines ready
- Tools installed (Docker Desktop, VS Code)

### Knowledge Dependencies
- Team trained on MCP protocol
- Understanding of Azure services
- Git/GitHub workflow familiarity

---

## Phase 1 Handoff to Phase 2

### Completion Criteria
Before moving to Phase 2, the following must be complete:

- [x] All Phase 1 tasks marked as Done
- [x] All tests passing
- [x] Documentation reviewed and approved
- [x] MCP servers deployed and accessible
- [x] Dev Container tested on Windows, macOS, Linux
- [x] Team retrospective completed
- [x] Phase 2 sprint planning completed

### Artifacts to Hand Off
1. **Working Dev Container** - Ready for agent development
2. **3 MCP Servers** - Tested and documented
3. **MCP SDK** - Ready for agents to integrate
4. **CI/CD Pipelines** - Running smoothly
5. **Documentation** - Getting started + architecture
6. **Test Framework** - Ready for expansion

### Known Issues / Tech Debt
Document any issues that can be addressed in later phases:
- [ ] Cache invalidation strategy needs refinement
- [ ] MCP server load testing under heavy concurrent load
- [ ] Advanced monitoring and alerting not yet implemented
- [ ] Documentation could use more examples

---

## Appendix

### Reference Documents
- [Files/AgenticCoderPlan/AgenticCoderPlan-F.md](../Files/AgenticCoderPlan/AgenticCoderPlan-F.md) - Dev Container reference
- [Files/AgenticCoderPlan/AgenticCoderPlan-E.md](../Files/AgenticCoderPlan/AgenticCoderPlan-E.md) - MCP Server architecture
- [Azure Agentic InfraOps - MCP Server](https://github.com/jonathan-vella/azure-agentic-infraops/tree/main/mcp/azure-pricing-mcp)

### Team Contacts
- Tech Lead: [Name/Email]
- DevOps Engineer: [Name/Email]
- Senior Devs: [Names/Emails]
- QA Engineer: [Name/Email]
- Technical Writer: [Name/Email]

### Communication Plan
- **Daily Standups**: 9:00 AM daily (15 minutes)
- **Sprint Planning**: Monday, Week start (2 hours)
- **Sprint Review**: Friday, Week end (1 hour)
- **Sprint Retrospective**: Friday, Week end (30 minutes)
- **Slack Channel**: #agenticcoder-phase1
- **Documentation**: Wiki pages in GitHub

---

**Phase 1 Start Date**: [TBD]  
**Phase 1 End Date**: [TBD + 3 weeks]  
**Status**: Planning Complete, Ready to Start
