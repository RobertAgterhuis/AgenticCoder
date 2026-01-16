# Agent Specifications - All 35 Agents

## TIER 1: ORCHESTRATION AGENTS (9)

---

## 1. @plan Agent

- **ID**: `plan`
- **Name**: Requirements Planner
- **Tier**: Orchestration
- **Category**: Planning
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Parses user requirements and generates structured requirement documents that guide the entire project workflow.

### Key Responsibilities
- Parse natural language requirements from various input formats
- Extract functional requirements, non-functional requirements, and constraints
- Identify technology preferences and integrations needed
- Decompose complex requirements into phases
- Generate structured requirements document
- Hand off to @architect agent

### Inputs
- User requirements (text, file, conversation)
- Project context and scope
- Technology preferences

### Outputs
- Structured requirements document
- Functional requirements list
- Non-functional requirements (performance, security, compliance)
- Technology recommendations
- Risk assessment

### MCP Tools
- Azure Docs: Service discovery

### Successor Agents
- @architect: Architecture planning
- @code-architect: Code architecture

### Phase Position
- Phase 1: Requirements Discovery

---

## 2. @doc Agent

- **ID**: `doc`
- **Name**: Documentation Generator
- **Tier**: Orchestration
- **Category**: Documentation
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates and maintains comprehensive project documentation throughout the workflow.

### Key Responsibilities
- Generate API documentation from code
- Create user guides and tutorials
- Generate architecture documentation
- Create deployment guides
- Maintain documentation consistency
- Update docs as project evolves

### Outputs
- API documentation
- User guides
- Architecture documentation
- Deployment guides
- FAQ and troubleshooting guides

### Successor Agents
- All agents (can document at any phase)

### Phase Position
- Phase 4: Design Artifacts (optional)
- Phase 12: DevOps & Deployment

---

## 3. @backlog Agent

- **ID**: `backlog`
- **Name**: Backlog Manager
- **Tier**: Orchestration
- **Category**: Project Management
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Manages project backlog and converts high-level requirements into actionable work items.

### Key Responsibilities
- Convert requirements into user stories
- Create task breakdowns
- Estimate effort and complexity
- Prioritize work items
- Generate sprint plans
- Track dependencies

### Outputs
- User stories with acceptance criteria
- Task list with effort estimates
- Sprint plans
- Dependency graphs
- Risk log

### Successor Agents
- @coordinator: Workflow coordination

### Phase Position
- Phase 7: Application Planning

---

## 4. @coordinator Agent

- **ID**: `coordinator`
- **Name**: Workflow Coordinator
- **Tier**: Orchestration
- **Category**: Orchestration
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Orchestrates multi-agent workflows and manages phase transitions throughout the project lifecycle.

### Key Responsibilities
- Execute workflow phases sequentially
- Manage agent handoffs
- Handle failures and retries
- Track overall progress
- Generate status reports
- Manage state transitions
- Coordinate parallel execution where possible

### MCP Tools
- Message Bus: Agent communication

### Successor Agents
- All agents (orchestrates them)

### Phase Position
- All Phases: Central coordinator

---

## 5. @qa Agent

- **ID**: `qa`
- **Name**: Quality Assurance Orchestrator
- **Tier**: Orchestration
- **Category**: Quality Assurance
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Orchestrates quality assurance and validation gates throughout the project.

### Key Responsibilities
- Trigger validation gates at critical phases
- Collect quality metrics
- Generate quality reports
- Block releases on quality failures
- Track quality trends
- Execute automated tests
- Report coverage metrics

### Outputs
- Quality reports
- Test results
- Code coverage reports
- Security scan results
- Validation gate reports

### Phase Position
- Phases 8, 9, 10, 11, 12: Validation gates

---

## 6. @reporter Agent

- **ID**: `reporter`
- **Name**: Progress Reporter
- **Tier**: Orchestration
- **Category**: Reporting
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates comprehensive progress reports and project dashboards.

### Key Responsibilities
- Generate executive summaries
- Track key metrics
- Report phase completion
- Generate burndown charts
- Alert on delays or issues
- Create stakeholder reports
- Maintain project timeline

### Outputs
- Executive summaries
- Progress dashboards
- Risk reports
- Timeline visualizations
- Stakeholder communications

---

## 7. @architect Agent

- **ID**: `architect`
- **Name**: Solution Architect
- **Tier**: Orchestration
- **Category**: Architecture
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Designs high-level solution architecture based on requirements.

### Key Responsibilities
- Design system architecture
- Identify major components
- Define integration points
- Recommend technology stack
- Create architecture diagrams
- Define security architecture
- Plan scalability strategy

### Outputs
- Architecture diagrams
- Technology stack recommendation
- Component definitions
- Integration plan
- Security architecture
- Scalability plan

### Successor Agents
- @code-architect: Code architecture details
- azure-principal-architect: Azure-specific architecture

---

## 8. @code-architect Agent

- **ID**: `code-architect`
- **Name**: Code Architect
- **Tier**: Orchestration
- **Category**: Architecture
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Designs code-level architecture and patterns.

### Key Responsibilities
- Design code structure and patterns
- Define module boundaries
- Plan API contracts
- Design database schemas
- Plan testing strategy
- Define coding standards
- Create code templates

### Outputs
- Code architecture diagrams
- Module interface definitions
- Database schema design
- Code standards document
- Testing strategy

### Successor Agents
- Implementation specialists (@react-specialist, @dotnet-specialist, etc.)

---

## 9. @devops-specialist Agent

- **ID**: `devops-specialist`
- **Name**: DevOps Specialist
- **Tier**: Orchestration
- **Category**: DevOps
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Orchestrates DevOps and deployment activities.

### Key Responsibilities
- Design CI/CD pipelines
- Configure monitoring and alerting
- Plan disaster recovery
- Manage infrastructure as code
- Deploy applications
- Configure logging
- Plan backup strategies

### Outputs
- CI/CD pipeline configuration
- Monitoring and alerting setup
- Deployment scripts
- Disaster recovery plan
- Logging configuration
- Backup strategy

### Phase Position
- Phase 12: DevOps & Deployment

---

## TIER 2: ARCHITECTURE AGENTS (8)

---

## 10. azure-principal-architect

- **ID**: `azure-principal-architect`
- **Name**: Azure Principal Architect
- **Tier**: Architecture
- **Category**: Cloud Architecture
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Assesses and designs Azure cloud architecture using Well-Architected Framework.

### Key Responsibilities
- Assess requirements against WAF pillars
- Recommend Azure services
- Calculate cost estimates
- Identify governance constraints
- Recommend security best practices
- Plan disaster recovery on Azure
- Generate WAF assessment report

### MCP Tools
- Azure Pricing: Cost estimation
- Azure Resource Graph: Resource querying
- Azure Docs: Service documentation

### Outputs
- WAF assessment (all 5 pillars with scores)
- Service recommendations
- Cost estimates
- Governance assessment
- Security recommendations
- Disaster recovery plan

### Successor Agents
- bicep-plan: Infrastructure planning
- diagram-generator: Architecture diagrams

### Phase Position
- Phase 3: Infrastructure Assessment

---

## 11. aws-architect

- **ID**: `aws-architect`
- **Name**: AWS Architect
- **Tier**: Architecture
- **Category**: Cloud Architecture
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Assesses and designs AWS cloud architecture.

### Key Responsibilities
- Assess requirements for AWS
- Recommend AWS services
- Calculate cost estimates
- Identify compliance requirements
- Design for high availability
- Plan security architecture

### Outputs
- Architecture recommendations
- Service selection rationale
- Cost estimates
- Compliance assessment
- Security design

---

## 12. gcp-architect

- **ID**: `gcp-architect`
- **Name**: GCP Architect
- **Tier**: Architecture
- **Category**: Cloud Architecture
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Assesses and designs Google Cloud Platform architecture.

### Key Responsibilities
- Assess requirements for GCP
- Recommend GCP services
- Calculate cost estimates
- Design for scalability
- Plan security architecture

### Outputs
- GCP architecture design
- Service recommendations
- Cost estimates
- Scalability plan
- Security design

---

## 13. bicep-plan

- **ID**: `bicep-plan`
- **Name**: Bicep Implementation Planner
- **Tier**: Architecture
- **Category**: Infrastructure
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Plans Bicep-based infrastructure implementation with AVM modules and governance.

### Key Responsibilities
- Generate implementation plan with module structure
- Query Azure Policy for governance constraints
- Validate cost against budgets
- Plan module dependencies
- Create module decomposition
- Generate task list for bicep-implement

### MCP Tools
- Azure Pricing: Cost validation
- Azure Resource Graph: Governance discovery

### Outputs
- Implementation plan with module structure
- Governance constraints document
- Cost validation report
- Module dependency graph
- Task breakdown for implementation

### Successor Agents
- bicep-implement: Infrastructure implementation

### Phase Position
- Phase 5: Infrastructure Planning

---

## 14. terraform-plan

- **ID**: `terraform-plan`
- **Name**: Terraform Implementation Planner
- **Tier**: Architecture
- **Category**: Infrastructure
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Plans Terraform-based infrastructure implementation.

### Key Responsibilities
- Generate Terraform module structure
- Plan state management strategy
- Design backend configuration
- Plan provider configuration
- Create module breakdown

### Outputs
- Terraform project structure
- Module plan
- State management strategy
- Backend configuration plan
- Provider specifications

### Successor Agents
- terraform-implement: Infrastructure implementation

---

## 15. database-specialist

- **ID**: `database-specialist`
- **Name**: Database Specialist
- **Tier**: Architecture
- **Category**: Database
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Designs database architecture and schemas.

### Key Responsibilities
- Design database schema
- Plan data modeling
- Design indexes and partitioning
- Plan backup and recovery
- Design for scalability
- Plan data migration strategy

### Outputs
- Database schema diagrams
- DDL scripts
- Backup strategy
- Migration plan
- Performance tuning recommendations

### Phase Position
- Phase 6: Database Architecture

---

## 16. diagram-generator

- **ID**: `diagram-generator`
- **Name**: Diagram Generator
- **Tier**: Architecture
- **Category**: Documentation
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates architecture diagrams and visualizations.

### Key Responsibilities
- Generate system architecture diagrams
- Create data flow diagrams
- Generate deployment diagrams
- Create component diagrams
- Generate sequence diagrams
- Export in multiple formats (SVG, PNG, PDF)

### Outputs
- Architecture diagrams (SVG, PNG, PDF)
- Data flow diagrams
- Deployment diagrams
- Component diagrams

### Phase Position
- Phase 4: Design Artifacts

---

## 17. adr-generator

- **ID**: `adr-generator`
- **Name**: Architecture Decision Record Generator
- **Tier**: Architecture
- **Category**: Documentation
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Architecture Decision Records (ADRs) documenting key design decisions.

### Key Responsibilities
- Document architectural decisions
- Capture decision rationale
- Record alternatives considered
- Document decision consequences
- Format as ADRs

### Outputs
- ADR documents in Markdown
- Decision matrix
- Trade-off analysis
- Consequence documentation

### Phase Position
- Phase 4: Design Artifacts (optional)

---

## TIER 3: IMPLEMENTATION AGENTS (18)

### FRONTEND (5)

---

## 18. @react-specialist

- **ID**: `react-specialist`
- **Name**: React Specialist
- **Tier**: Implementation
- **Category**: Frontend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates React-based frontend applications with best practices.

### Key Responsibilities
- Generate React project structure
- Create React components with TypeScript
- Set up state management (Redux/Context)
- Configure routing
- Set up testing (Jest, React Testing Library)
- Apply accessibility standards
- Configure build and deployment

### Skills
- react-patterns: Component patterns
- state-management: Redux, Context API
- testing: Jest, RTL
- accessibility: WCAG compliance

### Outputs
- React project source code
- Component library
- Test suite
- Configuration files
- Documentation

### Phase Position
- Phase 9: Frontend Implementation

---

## 19. @vue-specialist

- **ID**: `vue-specialist`
- **Name**: Vue Specialist
- **Tier**: Implementation
- **Category**: Frontend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Vue.js-based frontend applications.

### Key Responsibilities
- Generate Vue project structure
- Create Vue components with TypeScript
- Set up state management (Pinia/Vuex)
- Configure routing
- Set up testing (Vitest, Vue Test Utils)

### Outputs
- Vue project source code
- Component library
- Test suite
- Configuration files

---

## 20. @angular-specialist

- **ID**: `angular-specialist`
- **Name**: Angular Specialist
- **Tier**: Implementation
- **Category**: Frontend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Angular-based frontend applications.

### Key Responsibilities
- Generate Angular project structure
- Create Angular components and services
- Set up routing and lazy loading
- Configure dependency injection
- Set up testing (Jasmine, Karma)

### Outputs
- Angular project source code
- Component and service modules
- Test suite

---

## 21. @svelte-specialist

- **ID**: `svelte-specialist`
- **Name**: Svelte Specialist
- **Tier**: Implementation
- **Category**: Frontend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Svelte-based frontend applications.

### Key Responsibilities
- Generate Svelte project structure
- Create Svelte components
- Set up routing
- Set up testing
- Configure build

### Outputs
- Svelte project source code
- Component library
- Test suite

---

## 22. @frontend-specialist

- **ID**: `frontend-specialist`
- **Name**: Generic Frontend Specialist
- **Tier**: Implementation
- **Category**: Frontend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generic frontend specialist for framework-agnostic projects.

### Key Responsibilities
- Generate frontend project structure
- Create HTML, CSS, JavaScript
- Set up build tooling
- Configure testing

### Outputs
- Frontend project source code

---

### BACKEND (6)

---

## 23. @dotnet-specialist

- **ID**: `dotnet-specialist`
- **Name**: .NET Specialist
- **Tier**: Implementation
- **Category**: Backend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates .NET/C# backend applications with best practices.

### Key Responsibilities
- Generate .NET project structure
- Create Web API controllers
- Set up Entity Framework
- Configure authentication/authorization
- Set up logging and monitoring
- Configure testing (xUnit, Moq)

### Skills
- dotnet-webapi: ASP.NET Core
- entity-framework: EF Core
- testing: xUnit

### Outputs
- .NET project source code
- API controllers and services
- Database context and models
- Test suite
- Configuration files

### Phase Position
- Phase 10: Backend Implementation

---

## 24. @nodejs-specialist

- **ID**: `nodejs-specialist`
- **Name**: Node.js Specialist
- **Tier**: Implementation
- **Category**: Backend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Node.js/Express backend applications.

### Key Responsibilities
- Generate Node.js project structure
- Create Express API routes
- Set up middleware
- Configure database connections
- Set up logging
- Configure testing (Jest, Supertest)

### Outputs
- Node.js project source code
- API routes and controllers
- Middleware configuration
- Test suite

---

## 25. @python-specialist

- **ID**: `python-specialist`
- **Name**: Python Specialist
- **Tier**: Implementation
- **Category**: Backend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Python backend applications (FastAPI, Django, etc.).

### Key Responsibilities
- Generate Python project structure
- Create API endpoints
- Set up database ORM
- Configure authentication
- Set up testing (pytest)

### Outputs
- Python project source code
- API modules
- Database models
- Test suite

---

## 26. @go-specialist

- **ID**: `go-specialist`
- **Name**: Go Specialist
- **Tier**: Implementation
- **Category**: Backend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Go backend applications.

### Key Responsibilities
- Generate Go project structure
- Create API handlers
- Set up routing
- Configure database connections
- Set up testing

### Outputs
- Go project source code
- Handler implementations
- Configuration files

---

## 27. @java-specialist

- **ID**: `java-specialist`
- **Name**: Java Specialist
- **Tier**: Implementation
- **Category**: Backend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Java backend applications (Spring Boot, etc.).

### Key Responsibilities
- Generate Spring Boot project structure
- Create REST controllers
- Set up repositories and services
- Configure Spring configuration
- Set up testing (JUnit, Mockito)

### Outputs
- Spring Boot project source code
- Controllers and services
- Configuration files
- Test suite

---

## 28. @backend-specialist

- **ID**: `backend-specialist`
- **Name**: Generic Backend Specialist
- **Tier**: Implementation
- **Category**: Backend
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generic backend specialist for framework-agnostic projects.

### Key Responsibilities
- Generate backend server code
- Create API endpoints
- Set up basic routing and middleware

### Outputs
- Backend source code

---

### INFRASTRUCTURE (4)

---

## 29. bicep-implement

- **ID**: `bicep-implement`
- **Name**: Bicep Implementation
- **Tier**: Implementation
- **Category**: Infrastructure
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Bicep infrastructure code with Azure Verified Modules (AVM).

### Key Responsibilities
- Generate Bicep code for infrastructure
- Use Azure Verified Modules where available
- Validate Bicep syntax and best practices
- Generate parameter files
- Create deployment scripts
- Generate documentation

### Outputs
- Bicep main orchestrator
- Bicep module files
- Parameter files
- Deployment scripts
- Documentation

### Phase Position
- Phase 8: Infrastructure Implementation

---

## 30. terraform-implement

- **ID**: `terraform-implement`
- **Name**: Terraform Implementation
- **Tier**: Implementation
- **Category**: Infrastructure
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Terraform infrastructure code.

### Key Responsibilities
- Generate Terraform code
- Create modules
- Configure providers
- Generate tfvars files
- Create deployment scripts

### Outputs
- Terraform configuration files
- Module structure
- Variable definitions
- Output definitions

---

## 31. @docker-specialist

- **ID**: `docker-specialist`
- **Name**: Docker Specialist
- **Tier**: Implementation
- **Category**: Infrastructure
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Docker containerization for applications.

### Key Responsibilities
- Generate Dockerfiles
- Create docker-compose files
- Optimize container images
- Configure registry integration
- Document container deployment

### Outputs
- Dockerfile
- docker-compose.yml
- Container registry configuration
- Container documentation

### Phase Position
- Phase 11: Integration & Testing

---

## 32. @kubernetes-specialist

- **ID**: `kubernetes-specialist`
- **Name**: Kubernetes Specialist
- **Tier**: Implementation
- **Category**: Infrastructure
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates Kubernetes orchestration configurations.

### Key Responsibilities
- Generate Kubernetes manifests
- Configure deployments, services, ingress
- Set up health checks and scaling
- Configure network policies
- Create documentation

### Outputs
- Kubernetes manifests (YAML)
- Deployment configurations
- Service definitions
- Ingress configurations

---

### DATABASE (3)

---

## 33. @mysql-specialist

- **ID**: `mysql-specialist`
- **Name**: MySQL Specialist
- **Tier**: Implementation
- **Category**: Database
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates MySQL database schemas and configurations.

### Key Responsibilities
- Generate MySQL schemas
- Create indexes and constraints
- Generate migration scripts
- Configure replication
- Create documentation

### Outputs
- SQL schema files
- Migration scripts
- Configuration files

---

## 34. @postgres-specialist

- **ID**: `postgres-specialist`
- **Name**: PostgreSQL Specialist
- **Tier**: Implementation
- **Category**: Database
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates PostgreSQL database schemas and configurations.

### Key Responsibilities
- Generate PostgreSQL schemas
- Create advanced features (views, functions, triggers)
- Generate migration scripts
- Configure replication
- Create documentation

### Outputs
- SQL schema files
- Function and trigger definitions
- Migration scripts

---

## 35. @mongodb-specialist

- **ID**: `mongodb-specialist`
- **Name**: MongoDB Specialist
- **Tier**: Implementation
- **Category**: Database
- **Version**: 1.0.0
- **Status**: Active

### Purpose
Generates MongoDB document schemas and configurations.

### Key Responsibilities
- Design MongoDB collections and indexes
- Generate schema validation
- Create aggregation pipelines
- Generate migration scripts
- Configure replication

### Outputs
- MongoDB schema validation files
- Collection definitions
- Index configurations
- Migration scripts

---

## Summary

**Total Agents**: 35
- **Tier 1 (Orchestration)**: 9 agents
- **Tier 2 (Architecture)**: 8 agents
- **Tier 3 (Implementation)**: 18 agents
  - Frontend: 5
  - Backend: 6
  - Infrastructure: 4
  - Database: 3

All agent specifications follow the standard template and define:
- Purpose and responsibilities
- Input/output contracts
- MCP tool usage
- Workflow position (predecessors/successors)
- Phase integration
- Key capabilities
