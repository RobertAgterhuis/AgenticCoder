# Agent Catalog

Complete reference of all 39 agents in AgenticCoder.

## Planning Agents

### @plan

**Purpose:** Project planning and requirements gathering

**Skills:**
- requirements-analysis
- project-scoping
- stakeholder-analysis

**When Invoked:** Phase 1 (Requirements)

**Outputs:**
- requirements.md
- scope.json
- constraints.json

---

### @doc

**Purpose:** Documentation generation

**Skills:**
- technical-writing
- markdown-formatting
- diagram-creation

**When Invoked:** Phase 2 (Documentation)

**Outputs:**
- project-docs/
- README.md
- API documentation

---

### @backlog

**Purpose:** Generate backlog items from requirements

**Skills:**
- user-story-creation
- task-breakdown
- priority-assignment

**When Invoked:** Phase 3 (Backlog)

**Outputs:**
- backlog.json
- user-stories.md
- sprint-plan.md

---

### @coordinator

**Purpose:** Multi-agent coordination and orchestration

**Skills:**
- workflow-management
- conflict-resolution
- resource-allocation

**When Invoked:** Throughout workflow

---

## Architecture Agents

### @architect

**Purpose:** High-level system architecture design

**Skills:**
- clean-architecture
- microservices-patterns
- system-design

**When Invoked:** Phase 4, 8 (Architecture, Review)

**Outputs:**
- architecture.json
- architecture.md
- component-diagram.mmd

---

### @code-architect

**Purpose:** Detailed code-level architecture

**Skills:**
- code-organization
- design-patterns
- dependency-management

**When Invoked:** Phase 5 (Code Architecture)

**Outputs:**
- code-architecture.json
- folder-structure.md
- module-dependencies.json

---

## Azure Specialists

### @azure-architect

**Purpose:** Azure infrastructure architecture

**Skills:**
- azure-well-architected
- azure-patterns
- cost-optimization

**When Invoked:** Phase 9 (Azure Architecture)

**Outputs:**
- azure-architecture.json
- resource-diagram.mmd

---

### @bicep-specialist

**Purpose:** Bicep template generation using AVM

**Skills:**
- bicep-patterns
- avm-modules
- arm-templates

**When Invoked:** Phase 10-11 (Bicep Planning/Implementation)

**Outputs:**
- main.bicep
- modules/*.bicep
- parameters/*.bicepparam

---

### @keyvault-specialist

**Purpose:** Azure Key Vault configuration

**Skills:**
- secret-management
- key-rotation
- access-policies

---

### @appservice-specialist

**Purpose:** Azure App Service configuration

**Skills:**
- app-service-plans
- deployment-slots
- custom-domains

---

### @functions-specialist

**Purpose:** Azure Functions development

**Skills:**
- function-triggers
- durable-functions
- function-bindings

---

### @storage-specialist

**Purpose:** Azure Storage configuration

**Skills:**
- blob-storage
- table-storage
- queue-storage

---

### @sql-specialist

**Purpose:** Azure SQL Database

**Skills:**
- sql-schema-design
- performance-tuning
- security-configuration

---

### @cosmos-specialist

**Purpose:** Cosmos DB configuration

**Skills:**
- partition-design
- consistency-levels
- indexing-policies

---

## Frontend Specialists

### @frontend-specialist

**Purpose:** General frontend development

**Skills:**
- component-design
- state-management
- responsive-design

**When Invoked:** Phase 13 (Frontend Implementation)

---

### @react-specialist

**Purpose:** React application development

**Skills:**
- react-patterns
- hooks
- react-query

---

### @vue-specialist

**Purpose:** Vue.js application development

**Skills:**
- vue-composition-api
- pinia
- vue-router

---

### @angular-specialist

**Purpose:** Angular application development

**Skills:**
- angular-modules
- rxjs
- angular-material

---

### @svelte-specialist

**Purpose:** Svelte application development

**Skills:**
- svelte-stores
- sveltekit
- svelte-components

---

### @nextjs-specialist

**Purpose:** Next.js application development

**Skills:**
- app-router
- server-components
- next-api-routes

---

### @blazor-specialist

**Purpose:** Blazor application development

**Skills:**
- blazor-components
- blazor-wasm
- blazor-server

---

## Backend Specialists

### @backend-specialist

**Purpose:** General backend development

**Skills:**
- api-design
- authentication
- database-access

**When Invoked:** Phase 14 (Backend Implementation)

---

### @nodejs-specialist

**Purpose:** Node.js application development

**Skills:**
- express-patterns
- fastify
- nestjs

---

### @dotnet-specialist

**Purpose:** .NET application development

**Skills:**
- aspnet-core
- entity-framework
- minimal-apis

---

### @python-specialist

**Purpose:** Python application development

**Skills:**
- fastapi
- django
- sqlalchemy

---

### @java-specialist

**Purpose:** Java application development

**Skills:**
- spring-boot
- hibernate
- maven

---

### @go-specialist

**Purpose:** Go application development

**Skills:**
- gin
- gorm
- go-modules

---

## Database Specialists

### @database-specialist

**Purpose:** General database design

**Skills:**
- schema-design
- normalization
- indexing

**When Invoked:** Phase 15 (Database Implementation)

---

### @postgres-specialist

**Purpose:** PostgreSQL development

**Skills:**
- postgres-extensions
- postgres-performance
- postgres-security

---

### @mongodb-specialist

**Purpose:** MongoDB development

**Skills:**
- mongodb-schema
- aggregation-pipeline
- mongodb-indexes

---

## Infrastructure Specialists

### @devops-specialist

**Purpose:** CI/CD and DevOps

**Skills:**
- github-actions
- azure-devops
- deployment-strategies

**When Invoked:** Phase 16 (Delivery)

---

### @docker-specialist

**Purpose:** Docker containerization

**Skills:**
- dockerfile-patterns
- multi-stage-builds
- docker-compose

---

### @kubernetes-specialist

**Purpose:** Kubernetes orchestration

**Skills:**
- k8s-manifests
- helm-charts
- aks-configuration

---

### @terraform-specialist

**Purpose:** Terraform IaC

**Skills:**
- terraform-modules
- terraform-state
- terraform-providers

---

## Quality Agents

### @qa

**Purpose:** Quality assurance and testing

**Skills:**
- test-strategy
- unit-testing
- integration-testing

**When Invoked:** Phase 16 (Delivery)

---

### @security-specialist

**Purpose:** Security review and scanning

**Skills:**
- security-scanning
- vulnerability-assessment
- compliance-checking

---

### @reporter

**Purpose:** Report generation

**Skills:**
- report-formatting
- metrics-collection
- summary-generation

**When Invoked:** Phase 16 (Delivery)

---

## Generator Agents

### @adr-generator

**Purpose:** Architecture Decision Record generation

**Skills:**
- adr-format
- decision-documentation

**When Invoked:** Phase 6 (ADR Generation)

---

### @diagram-generator

**Purpose:** Diagram generation

**Skills:**
- mermaid-diagrams
- plantuml
- c4-model

**When Invoked:** Phase 7 (Diagram Generation)

---

## Next Steps

- [Skills Reference](Skills) - All 47 skills
- [Phase Workflow](Phases) - When agents are activated
- [Creating Agents](../guides/Creating-Agents) - Add custom agents
