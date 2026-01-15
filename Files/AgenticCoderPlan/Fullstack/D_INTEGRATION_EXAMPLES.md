# Integration Examples: Phase 1 Implementation Flows

**Concrete Examples of Technology Specialist Integration**

**Version**: 1.0  
**Date**: January 13, 2026

---

## 1. End-to-End Example Flow: React + .NET + SQL + Azure DevOps

### Scenario: Simple MVP User Management API

**Project**: UserManagement-API  
**Tech Stack**: React frontend, .NET Core backend, SQL Server database, Azure DevOps CI/CD

### Phase Execution Flow

```
Phase 0-5: Discovery Chain (Existing)
  ↓
Phase 6-12: Generic Specialist Chain (Existing)
  ├─ @architect: Architecture decision
  ├─ @code-architect: Tech stack → React + .NET + SQL Server + Azure DevOps
  │   └─ Generates: tech-stack-decision.artifact
  ├─ @azure-architect: Azure infrastructure plan
  ├─ @bicep-specialist: Bicep modules
  ├─ @frontend-specialist (Orchestrator): Receives tech stack
  ├─ @backend-specialist (Orchestrator): Receives tech stack
  └─ @devops-specialist (Orchestrator): Receives tech stack
  ↓
Phase 13: @react-specialist (Conditional Handoff)
  ├─ Receives: "React" from tech stack
  ├─ Input: Component requirements for user management
  └─ Output: React components (UserList, UserProfile, UserForm)
  ↓
Phase 14: @dotnet-specialist (Conditional Handoff)
  ├─ Receives: ".NET" from tech stack
  ├─ Input: API specifications (CRUD for Users)
  └─ Output: Controllers, Services, Entity models
  ↓
Phase 15: @database-specialist (Conditional Handoff)
  ├─ Receives: "SQL Server" from tech stack
  ├─ Input: Entity models from @dotnet-specialist
  └─ Output: SQL DDL scripts, migrations
  ↓
Phase 16: @azure-devops-specialist (Conditional Handoff)
  ├─ Receives: "Azure DevOps" from tech stack
  ├─ Input: Build/deploy requirements
  └─ Output: azure-pipelines.yml with stages
  ↓
Phase 17: @reporter (Existing)
  └─ Final report with all artifacts
```

---

## 2. Detailed Step-by-Step Example

### Step 1: Tech Stack Decision (Phase 7)

**@code-architect receives requirements**:
```json
{
  "project_name": "UserManagement-API",
  "requirements": {
    "frontend": "User interface for CRUD operations",
    "backend": "RESTful API for user management",
    "database": "Persistent user storage",
    "deployment": "Cloud deployment with CI/CD"
  },
  "constraints": {
    "team_expertise": "React, .NET, SQL Server",
    "budget": "Azure resources",
    "timeline": "6 weeks"
  }
}
```

**Output artifact: tech-stack-decision.artifact**
```json
{
  "artifact_type": "tech-stack-decision",
  "phase": 7,
  "decisions": {
    "frontend": {
      "framework": "React",
      "version": "18.2",
      "build_tool": "Vite",
      "styling": "Tailwind CSS",
      "state_management": "Redux Toolkit"
    },
    "backend": {
      "language": ".NET",
      "framework": "ASP.NET Core",
      "version": "8.0",
      "orm": "Entity Framework Core"
    },
    "database": {
      "system": "SQL Server",
      "hosting": "Azure SQL Database"
    },
    "ci_cd": {
      "platform": "Azure DevOps",
      "trigger": "Pull Request"
    }
  },
  "rationale": "Team expertise + managed Azure services"
}
```

**This artifact is passed to all Phase 13-16 agents**

---

### Step 2: React Component Generation (Phase 13)

**@frontend-specialist (orchestrator) detects React**:
```
Tech stack includes "React"
→ Handoff to @react-specialist
```

**@react-specialist receives**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 13,
    "tech_stack": {
      "framework": "React",
      "styling": "Tailwind CSS",
      "state_management": "Redux Toolkit",
      "testing": "Jest"
    }
  },
  "component_requirements": [
    {
      "name": "UserList",
      "responsibility": "Display paginated list of users with search and filter",
      "props": {
        "users": { "type": "array" },
        "onDelete": { "type": "callback" }
      },
      "state_needs": ["searchTerm", "currentPage", "sortBy"],
      "api_integration": [
        {
          "endpoint": "/api/users",
          "method": "GET",
          "cache_ttl_seconds": 300
        }
      ]
    },
    {
      "name": "UserProfile",
      "responsibility": "Display and edit individual user profile",
      "props": {
        "userId": { "type": "string" }
      },
      "state_needs": ["formData", "isEditing", "isSaving"],
      "api_integration": [
        {
          "endpoint": "/api/users/{id}",
          "method": "GET"
        },
        {
          "endpoint": "/api/users/{id}",
          "method": "PUT"
        }
      ]
    },
    {
      "name": "UserForm",
      "responsibility": "Create or edit user with validation",
      "props": {
        "initialData": { "type": "object" },
        "onSubmit": { "type": "callback" }
      }
    }
  ]
}
```

**@react-specialist generates output**:
```
artifact-react-comp-001.json containing:

✓ UserList.tsx (180 lines)
  - Uses Redux for user state
  - React Query for API calls
  - Tailwind CSS for styling
  - Jest tests with 85% coverage
  - Accessibility: WCAG 2.1 AA

✓ UserProfile.tsx (200 lines)
  - useEffect for data loading
  - Custom useUserProfile hook
  - Form validation with react-hook-form
  - Tests: 10 test cases

✓ UserForm.tsx (150 lines)
  - Reusable form component
  - React Hook Form integration
  - Field-level validation
  - Tests: 8 test cases

✓ useUserProfile.ts (60 lines)
  - Custom hook for profile data
  - API integration
  - Error handling

Validation:
✓ TypeScript: 0 errors
✓ ESLint: 0 errors
✓ Tests: 23/23 passing
✓ Coverage: 86%
✓ Accessibility: 0 violations
```

**React artifact passed to integration**

---

### Step 3: .NET API Generation (Phase 14)

**@backend-specialist detects .NET**:
```
Tech stack includes ".NET"
→ Handoff to @dotnet-specialist
```

**@dotnet-specialist receives**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 14,
    "net_version": "8.0"
  },
  "api_endpoints": [
    {
      "name": "GetUsersAsync",
      "method": "GET",
      "route": "/api/users",
      "response_model": "IEnumerable<UserDTO>",
      "validation_rules": ["pagination_valid", "sort_valid"],
      "error_cases": ["BadRequest", "InternalServerError"]
    },
    {
      "name": "GetUserByIdAsync",
      "method": "GET",
      "route": "/api/users/{id}",
      "response_model": "UserDTO",
      "error_cases": ["NotFound"]
    },
    {
      "name": "CreateUserAsync",
      "method": "POST",
      "route": "/api/users",
      "request_model": "CreateUserRequest",
      "response_model": "UserDTO",
      "validation_rules": ["email_unique", "password_strong"],
      "error_cases": ["BadRequest", "Conflict"]
    },
    {
      "name": "UpdateUserAsync",
      "method": "PUT",
      "route": "/api/users/{id}",
      "request_model": "UpdateUserRequest",
      "error_cases": ["NotFound", "Conflict"]
    },
    {
      "name": "DeleteUserAsync",
      "method": "DELETE",
      "route": "/api/users/{id}",
      "error_cases": ["NotFound"]
    }
  ],
  "database_context": {
    "orm": "Entity Framework Core",
    "database_system": "SQL Server",
    "models_needed": ["User", "Role", "UserRole"]
  },
  "authentication_method": "JWT",
  "testing_framework": "xUnit"
}
```

**@dotnet-specialist generates**:
```
artifact-dotnet-001.json containing:

✓ UsersController.cs (280 lines)
  - 5 endpoints (GET, POST, PUT, DELETE)
  - Dependency injection of IUserService
  - JWT Authorization
  - Input validation with FluentValidation
  - Async/await patterns
  - Proper error handling

✓ IUserService.cs + UserService.cs (220 lines)
  - Service interface and implementation
  - Business logic isolation
  - Repository pattern
  - Logging with Serilog
  - Unit testable

✓ UserDTO.cs, CreateUserRequest.cs, UpdateUserRequest.cs
  - Data transfer objects
  - Validation attributes
  - AutoMapper mapping profiles

✓ User.cs (Entity model) (80 lines)
  - EF Core data annotations
  - Relationships (HasMany, HasOne)
  - Shadow properties for audit

✓ ApplicationDbContext.cs (100 lines)
  - DbSet<User>, DbSet<Role>, DbSet<UserRole>
  - OnModelCreating configurations
  - Connection string management

✓ Program.cs (50 lines)
  - Dependency injection setup
  - Authentication configuration
  - Middleware pipeline

✓ UsersControllerTests.cs (220 lines)
  - 18 test cases
  - Mocked IUserService
  - Happy path + error scenarios
  - 87% coverage

✓ UserServiceTests.cs (180 lines)
  - 15 test cases
  - Mocked repositories
  - 90% coverage

Validation:
✓ C# compiles: 0 errors
✓ Warnings: 2 (handled)
✓ Async/await: 100% compliant
✓ Nullable safety: enabled
✓ Tests: 33/33 passing
✓ Coverage: 88%
```

**.NET artifact passed to integration**

---

### Step 4: SQL Schema Generation (Phase 15)

**@backend-specialist invokes @database-specialist**:
```
Backend needs database
→ Invoke @database-specialist
```

**@database-specialist receives entity models from @dotnet-specialist**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 15
  },
  "database_system": "SQL Server",
  "database_version": "2022",
  "entities_to_model": [
    {
      "name": "User",
      "properties": [
        { "name": "Id", "type": "UUID", "key": true },
        { "name": "Email", "type": "string", "max_length": 255, "unique": true },
        { "name": "FirstName", "type": "string", "max_length": 100 },
        { "name": "LastName", "type": "string", "max_length": 100 },
        { "name": "PasswordHash", "type": "string", "max_length": 255 },
        { "name": "IsActive", "type": "boolean", "default": true },
        { "name": "CreatedAt", "type": "datetime", "default": "GETUTCDATE()" },
        { "name": "UpdatedAt", "type": "datetime" }
      ],
      "relationships": ["HasMany(UserRoles)"]
    }
  ],
  "performance_requirements": {
    "expected_users": 10000,
    "concurrent_connections": 50,
    "query_response_time_ms": 200
  }
}
```

**@database-specialist generates**:
```
artifact-sql-schema-001.json containing:

✓ CreateUsersTable.sql (50 lines)
  CREATE TABLE [dbo].[Users]
  [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID()
  [Email] NVARCHAR(255) NOT NULL UNIQUE
  [FirstName] NVARCHAR(100)
  [LastName] NVARCHAR(100)
  [PasswordHash] NVARCHAR(255)
  [IsActive] BIT DEFAULT 1
  [CreatedAt] DATETIME DEFAULT GETUTCDATE()
  [UpdatedAt] DATETIME

✓ IndexStrategies.sql (30 lines)
  - Clustered index on Id
  - Non-clustered on Email
  - Non-clustered on IsActive + CreatedAt

✓ 20260113_InitialSchema.cs (Migration file)
  - EF Core migration
  - Up/Down scripts
  - Rollback support

Validation:
✓ Syntax: valid
✓ Constraints: valid
✓ Performance: optimal
✓ Index coverage: 95%
✓ Storage estimate: 5 MB initial
```

**SQL schema artifact passed to integration**

---

### Step 5: Azure DevOps Pipeline Generation (Phase 16)

**@devops-specialist detects Azure DevOps**:
```
Tech stack includes "Azure DevOps"
→ Handoff to @azure-devops-specialist
```

**@azure-devops-specialist receives**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 16
  },
  "pipeline_name": "Build and Deploy UserManagement API",
  "repository_type": "Azure Repos",
  "trigger_branches": ["main", "develop"],
  "build_stages": [
    {
      "name": "Build",
      "jobs": [
        {
          "name": "BuildDotNet",
          "commands": ["dotnet build", "dotnet test"]
        }
      ]
    },
    {
      "name": "Quality",
      "jobs": [
        {
          "name": "CodeAnalysis",
          "tool": "SonarQube"
        }
      ]
    }
  ],
  "deployment_targets": [
    {
      "environment": "Development",
      "resource": "Azure App Service",
      "approval_required": false
    },
    {
      "environment": "Production",
      "resource": "Azure App Service",
      "approval_required": true
    }
  ],
  "security_scanning": {
    "code_analysis": "SonarQube",
    "dependency_check": "Dependabot"
  }
}
```

**@azure-devops-specialist generates**:
```
artifact-azure-pipeline-001.json containing:

✓ azure-pipelines.yml (180 lines)

trigger:
  - main
  - develop

pool:
  vmImage: 'windows-latest'

variables:
  buildConfiguration: 'Release'
  dotnetVersion: '8.0'

stages:
- stage: Build
  displayName: 'Build and Test'
  jobs:
  - job: BuildDotNet
    displayName: 'Build .NET Application'
    steps:
    - task: UseDotNet@2
      inputs:
        packageType: 'sdk'
        version: '$(dotnetVersion)'
    
    - script: 'dotnet build --configuration $(buildConfiguration)'
      displayName: 'Build'
    
    - script: 'dotnet test --configuration $(buildConfiguration) /p:CollectCoverage=true'
      displayName: 'Run Tests'
    
    - task: PublishCodeCoverageResults@1
      inputs:
        codeCoverageTool: Cobertura
        summaryFileLocation: '$(Agent.TempDirectory)/**/*coverage.cobertura.xml'

- stage: CodeQuality
  displayName: 'Code Quality Analysis'
  dependsOn: Build
  jobs:
  - job: SonarQubeAnalysis
    displayName: 'SonarQube Analysis'
    steps:
    - task: SonarQubePrepare@5
      inputs:
        SonarQube: 'SonarQube Server'
        projectKey: 'UserManagement-API'
        projectName: 'UserManagement API'

- stage: DeployDev
  displayName: 'Deploy to Development'
  dependsOn: CodeQuality
  jobs:
  - deployment: DeployDev
    environment: 'Development'
    strategy:
      runOnce:
        deploy:
        - task: AzureWebApp@1
          inputs:
            azureSubscription: 'Azure Subscription'
            appName: 'user-api-dev'

- stage: DeployProd
  displayName: 'Deploy to Production'
  dependsOn: DeployDev
  condition: 'succeeded()'
  jobs:
  - deployment: DeployProd
    environment: 'Production'
    strategy:
      runOnce:
        deploy:
        - task: AzureWebApp@1
          inputs:
            azureSubscription: 'Azure Subscription'
            appName: 'user-api-prod'

Validation:
✓ YAML valid: true
✓ Task references: valid
✓ Environments: configured
✓ Stages: 4 (Build, Quality, DeployDev, DeployProd)
✓ Quality gates: 3 (Build, Test Coverage > 80%, SQ Quality Gate)
```

**Azure DevOps artifact passed to integration**

---

## 3. Artifact Integration Summary

**All artifacts created in sequence**:

```
Phase 13: artifact-react-comp-001.json
          ├─ UserList.tsx
          ├─ UserProfile.tsx
          ├─ UserForm.tsx
          └─ 23 tests passing

Phase 14: artifact-dotnet-001.json
          ├─ UsersController.cs
          ├─ UserService.cs
          ├─ User.cs (Entity)
          └─ 33 tests passing

Phase 15: artifact-sql-schema-001.json
          ├─ CreateUsersTable.sql
          ├─ Indexes.sql
          └─ 20260113_InitialSchema migration

Phase 16: artifact-azure-pipeline-001.json
          ├─ azure-pipelines.yml
          ├─ 4 stages configured
          └─ Approvals for Production
```

**Complete flow executed**:
- React components ready for development
- .NET API ready for compilation
- SQL migrations ready for deployment
- CI/CD pipeline ready for integration

---

## 4. Handoff Protocol in Action

### Orchestrator → Technology Specialist Handoff

**@frontend-specialist → @react-specialist**:
```json
{
  "source_agent": "@frontend-specialist",
  "target_agent": "@react-specialist",
  "handoff_type": "conditional_delegation",
  "trigger": "tech_stack.frontend == 'React'",
  "context": {
    "project_id": "proj-001",
    "phase": 13,
    "tech_stack_decision": {
      "framework": "React",
      "version": "18.2",
      "styling": "Tailwind CSS",
      "state_management": "Redux Toolkit"
    },
    "component_requirements": [...],
    "performance_constraints": [...]
  },
  "expected_output_schema": "react-specialist.output.schema.json",
  "validation_rules": [
    "TypeScript errors == 0",
    "ESLint warnings == 0",
    "Test coverage >= 80%",
    "Accessibility violations == 0"
  ],
  "timeout_seconds": 300
}
```

**@react-specialist → @frontend-specialist (Response)**:
```json
{
  "source_agent": "@react-specialist",
  "target_agent": "@frontend-specialist",
  "status": "complete",
  "artifact_id": "artifact-react-comp-001",
  "summary": {
    "components_generated": 3,
    "custom_hooks_generated": 1,
    "context_providers_generated": 0,
    "test_cases": 23,
    "coverage_percentage": 86,
    "all_validations_passed": true
  },
  "recommendations": [
    "Integrate with React Router for navigation",
    "Add Redux middleware for logging",
    "Consider Storybook for component documentation"
  ],
  "next_action": "proceed_to_backend_specialist"
}
```

---

## 5. Error Handling Example

### Scenario: React Specialist Validation Failure

**@react-specialist detects issues**:
```json
{
  "status": "failed",
  "error_type": "validation_failed",
  "validation_errors": [
    {
      "component": "UserForm",
      "error": "TypeScript error: Property 'email' not found on type 'UserData'",
      "severity": "critical",
      "file": "src/components/UserForm.tsx",
      "line": 45
    },
    {
      "component": "UserList",
      "error": "ESLint: missing-key-prop in map function",
      "severity": "warning",
      "file": "src/components/UserList.tsx",
      "line": 120
    }
  ],
  "test_results": {
    "total_tests": 23,
    "passing": 21,
    "failing": 2,
    "errors": [
      {
        "test": "UserForm renders correctly",
        "error": "TypeError: Cannot read property 'email' of undefined"
      }
    ]
  },
  "coverage_report": {
    "percentage": 73,
    "below_target": true,
    "uncovered_lines": ["src/components/UserForm.tsx (lines 40-50)"]
  },
  "recommendations": [
    "Fix TypeScript type definitions for UserData",
    "Add missing test cases for UserForm component",
    "Resolve ESLint key-prop warning",
    "Increase test coverage to >= 80%"
  ],
  "status": "waiting_for_fix"
}
```

**@frontend-specialist routes back to engineer for fixes**

---

## 6. Success Criteria Validation

### Full MVP Delivery Checklist

```
✅ React Components Generated
   ✓ 3 components implemented
   ✓ 1 custom hook
   ✓ TypeScript: 0 errors
   ✓ ESLint: 0 errors
   ✓ Tests: 23/23 passing (86% coverage)
   ✓ Accessibility: WCAG 2.1 AA

✅ .NET API Implementation
   ✓ 5 endpoints (CRUD)
   ✓ Controllers, Services, Entities
   ✓ C# compiles: 0 errors
   ✓ Tests: 33/33 passing (88% coverage)
   ✓ Async/await: 100% compliant

✅ Database Schema
   ✓ Tables created
   ✓ Indexes optimized
   ✓ Migrations ready
   ✓ Performance: 95% index coverage

✅ CI/CD Pipeline
   ✓ Azure Pipelines YAML generated
   ✓ 4 stages configured
   ✓ Quality gates defined
   ✓ Approvals configured

✅ Documentation
   ✓ All artifacts generated
   ✓ All validations passed
   ✓ Ready for integration
```

---

**Status**: INTEGRATION EXAMPLES COMPLETE

**Total Blueprint Delivery**:
- ✅ A_IMPLEMENTATION_BLUEPRINT.md - Architecture & integration guide
- ✅ B_AGENT_SPECIFICATIONS.md - Detailed agent specs for Phase 1
- ✅ C_SCHEMA_DEFINITIONS.md - Complete JSON schema definitions
- ✅ D_INTEGRATION_EXAMPLES.md - Concrete integration flows

**Next Action**: Implement agents based on these blueprints

---

**Document Version**: 1.0  
**Date**: January 13, 2026  
**Status**: READY FOR IMPLEMENTATION
