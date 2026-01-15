# Agent Specifications: Phase 1 Technology Specialists

**Implementation Guide for 4 Critical Agents**

**Version**: 1.0  
**Date**: January 13, 2026  
**Agents Specified**: @react-specialist, @dotnet-specialist, @database-specialist, @azure-devops-specialist

---

## 1. @react-specialist Agent

### Purpose
Generate production-ready React components, custom hooks, context providers, and state management patterns. Translates component requirements into React code following modern hooks-based best practices.

### Agent Identifier
```
ID: @react-specialist
Phase: 13 (Technology-Specific Frontend)
Parent Orchestrator: @frontend-specialist
Trigger Condition: Tech stack includes "React"
Activation: Conditional (only when React selected)
```

### Input Schema Reference
**File**: `react-specialist.input.schema.json`

**Key Input Fields**:
```json
{
  "component_requirements": [
    {
      "name": "UserProfile",
      "type": "functional|class",
      "responsibility": "Display user info and edit capability",
      "props": { "userId": "string", "onUpdate": "callback" },
      "state_needs": ["user_data", "editing_mode"],
      "api_integration": "REST endpoints"
    }
  ],
  "dependency_context": {
    "state_management": "Redux|Context|Zustand",
    "styling": "Tailwind|styled-components|CSS Modules",
    "testing": "Jest|React Testing Library",
    "routing": "React Router v6"
  },
  "performance_constraints": [
    "Must support SSR",
    "Bundle size < 500KB",
    "Lighthouse score > 90"
  ],
  "typescript_enabled": true,
  "testing_coverage_target": 80,
  "accessibility_target": "WCAG 2.1 AA"
}
```

### Output Schema Reference
**File**: `react-specialist.output.schema.json`

**Key Output Structure**:
```json
{
  "artifact_type": "react-components",
  "phase": 13,
  "components": [
    {
      "name": "UserProfile",
      "file_path": "src/components/UserProfile.tsx",
      "component_type": "functional",
      "hooks_used": ["useState", "useEffect", "useContext"],
      "custom_hooks": ["useUserData", "useEditMode"],
      "props_interface": "IUserProfileProps",
      "state_variables": ["user", "isEditing", "isSaving"],
      "event_handlers": ["handleEdit", "handleSave", "handleCancel"],
      "code": "// Full React component code...",
      "imports": ["React", "useContext", "useCallback"],
      "dependencies": ["react", "react-dom"],
      "testing_code": "// Jest + React Testing Library tests...",
      "accessibility_features": ["aria-labels", "role attributes"],
      "performance_optimizations": ["React.memo", "useCallback", "useMemo"]
    }
  ],
  "custom_hooks": [
    {
      "name": "useUserData",
      "file_path": "src/hooks/useUserData.ts",
      "description": "Fetch and manage user data",
      "returns": "{ user, loading, error, refetch }",
      "code": "// Custom hook implementation..."
    }
  ],
  "context_providers": [
    {
      "name": "UserContext",
      "file_path": "src/context/UserContext.tsx",
      "provides": ["user", "setUser", "updateUser"],
      "code": "// Context provider implementation..."
    }
  ],
  "validation": {
    "typescript_errors": 0,
    "eslint_warnings": 0,
    "tests_passing": 15,
    "coverage_percentage": 85,
    "accessibility_violations": 0
  },
  "quality_metrics": {
    "code_lines": 450,
    "complexity_score": 6.2,
    "maintainability_index": 78,
    "bundle_impact": "12KB gzipped"
  }
}
```

### Skills Invoked
1. **react-patterns.skill** - React hooks, component patterns, performance
2. **state-management.skill** - Redux, Context API patterns
3. **error-handling.skill** - React error boundaries, error states
4. **ui-component-library.skill** - Tailwind CSS, Material-UI integration

### MCP Tools Used
- Code generation (LLM)
- TypeScript type checking
- ESLint validation
- Jest test generation

### Decision Logic
```
IF tech_stack.frontend == "React" AND phase == 13:
  IF component_requirements.exists:
    FOR each component:
      1. Analyze props and state needs
      2. Invoke react-patterns.skill
      3. Generate functional component
      4. Add custom hooks as needed
      5. Generate unit tests
      6. Validate TypeScript
      7. Check ESLint compliance
  IF state_management.needed:
    1. Determine Redux vs Context
    2. Generate store/context code
    3. Create selectors and actions
  RETURN react-components.artifact
```

### Example Interaction

**Input**:
```
Component needed: "UserList" 
- Display paginated list of users
- Filter by role
- Inline edit capability
- Real-time updates via WebSocket
```

**Output**:
```
✓ UserList.tsx (functional component, 180 lines)
✓ useUserList custom hook (60 lines)
✓ UserContext provider (50 lines)
✓ UserList.test.tsx (85 lines, 90% coverage)
✓ TypeScript: 0 errors
✓ ESLint: 0 errors
✓ Accessibility: WCAG 2.1 AA compliant
```

---

## 2. @dotnet-specialist Agent

### Purpose
Generate production-ready .NET/C# code including ASP.NET Core controllers, services, middleware, Entity Framework Core models, and dependency injection configuration. Follows .NET 8.0+ best practices and conventions.

### Agent Identifier
```
ID: @dotnet-specialist
Phase: 14 (Technology-Specific Backend)
Parent Orchestrator: @backend-specialist
Trigger Condition: Tech stack includes ".NET" or "C#"
Activation: Conditional (only when .NET selected)
```

### Input Schema Reference
**File**: `dotnet-specialist.input.schema.json`

**Key Input Fields**:
```json
{
  "api_endpoints": [
    {
      "name": "GetUser",
      "method": "GET",
      "route": "/api/users/{id}",
      "request_model": "GetUserRequest",
      "response_model": "UserResponse",
      "authentication": "Bearer|ApiKey",
      "authorization": "roles|policies",
      "validation_rules": ["id required", "UUID format"],
      "error_cases": ["NotFound", "Unauthorized", "BadRequest"]
    }
  ],
  "database_context": {
    "orm": "Entity Framework Core",
    "database_type": "SQL Server|PostgreSQL|MySQL",
    "models_needed": ["User", "Product", "Order"]
  },
  "authentication_method": "JWT|OAuth2|Azure AD",
  "logging_framework": "Serilog",
  "testing_framework": "xUnit",
  "net_version": "8.0",
  "nullable_reference_types": true,
  "dependency_injection": "Microsoft.Extensions.DependencyInjection"
}
```

### Output Schema Reference
**File**: `dotnet-specialist.output.schema.json`

**Key Output Structure**:
```json
{
  "artifact_type": "dotnet-controllers-services",
  "phase": 14,
  "controllers": [
    {
      "name": "UsersController",
      "file_path": "src/Controllers/UsersController.cs",
      "base_class": "ControllerBase",
      "route": "[ApiController]\n[Route(\"api/[controller]\")]",
      "endpoints": [
        {
          "name": "GetUser",
          "method": "GetAsync",
          "http_method": "GET",
          "route": "{id:guid}",
          "parameters": ["Guid id"],
          "return_type": "Task<ActionResult<UserResponse>>",
          "authorization": "[Authorize]",
          "code": "// Full endpoint implementation..."
        }
      ],
      "dependencies": ["IUserService", "ILogger<UsersController>"],
      "code": "// Full controller class..."
    }
  ],
  "services": [
    {
      "name": "UserService",
      "file_path": "src/Services/UserService.cs",
      "interface": "IUserService",
      "methods": [
        {
          "name": "GetUserAsync",
          "parameters": ["Guid userId"],
          "returns": "Task<UserDTO>",
          "code": "// Service method implementation..."
        }
      ],
      "dependencies": ["IUserRepository", "ILogger"],
      "code": "// Full service implementation..."
    }
  ],
  "entity_models": [
    {
      "name": "User",
      "file_path": "src/Data/Models/User.cs",
      "properties": [
        {
          "name": "Id",
          "type": "Guid",
          "attributes": ["[Key]", "[Required]"],
          "database_generated": true
        }
      ],
      "relationships": ["HasMany(Orders)", "HasOne(Profile)"],
      "code": "// Entity model with EF Core attributes..."
    }
  ],
  "database_context": {
    "name": "ApplicationDbContext",
    "file_path": "src/Data/ApplicationDbContext.cs",
    "dbsets": ["Users", "Products", "Orders"],
    "migrations": ["Initial", "AddUserProfile"],
    "code": "// DbContext with model configuration..."
  },
  "startup_configuration": {
    "file_path": "src/Program.cs",
    "di_registrations": [
      "services.AddScoped<IUserService, UserService>()",
      "services.AddScoped<IUserRepository, UserRepository>()"
    ],
    "middleware_setup": [
      "app.UseAuthentication()",
      "app.UseAuthorization()"
    ],
    "code": "// Program.cs with dependency injection..."
  },
  "migration_scripts": [
    {
      "name": "AddUserTable",
      "file_path": "src/Data/Migrations/20260113000001_AddUserTable.cs",
      "code": "// EF Core migration code..."
    }
  ],
  "validation": {
    "csharp_errors": 0,
    "warnings": 2,
    "tests_passing": 24,
    "coverage_percentage": 87
  },
  "quality_metrics": {
    "code_lines": 1200,
    "cyclomatic_complexity": 5.4,
    "maintainability_index": 82,
    "async_await_usage": "100%"
  }
}
```

### Skills Invoked
1. **dotnet-webapi.skill** - ASP.NET Core patterns, controllers, middleware
2. **entity-framework.skill** - Entity Framework Core, ORM patterns, migrations
3. **api-authentication.skill** - JWT, OAuth 2.0, .NET Identity
4. **error-handling.skill** - Exception handling, validation, custom middleware

### MCP Tools Used
- C# code generation
- .NET syntax validation
- Entity Framework migration generation
- xUnit test generation

### Decision Logic
```
IF tech_stack.backend == ".NET" AND phase == 14:
  IF api_endpoints.exists:
    FOR each endpoint:
      1. Generate controller class
      2. Generate request/response DTOs
      3. Generate service interface and implementation
      4. Generate repository for data access
      5. Configure dependency injection
      6. Generate unit tests
  IF database_context.needed:
    1. Generate entity models
    2. Generate DbContext
    3. Generate initial migration
    4. Create migration scripts
  VALIDATE:
    - C# syntax correctness
    - Async/await patterns
    - Null safety (nullable reference types)
  RETURN dotnet-controllers-services.artifact
```

### Example Interaction

**Input**:
```
API Endpoints needed:
- GET /api/users (paginated list)
- GET /api/users/{id} (single user)
- POST /api/users (create)
- PUT /api/users/{id} (update)
Database: SQL Server, EF Core
Auth: JWT Bearer tokens
Validation: FluentValidation
```

**Output**:
```
✓ UsersController.cs (8 endpoints, 280 lines)
✓ IUserService.cs + UserService.cs (180 lines)
✓ User.cs entity model with EF Core config
✓ ApplicationDbContext.cs
✓ Initial migration script
✓ CreateUserValidator.cs with FluentValidation
✓ UsersControllerTests.cs (35 tests, 90% coverage)
✓ C#: 0 errors, 2 warnings
✓ All async/await properly implemented
```

---

## 3. @database-specialist Agent

### Purpose
Generate database schemas, DDL scripts, optimization recommendations, migration strategies, and stored procedures for specific database systems (SQL Server, PostgreSQL, MySQL). Ensures schema design aligns with application requirements and performance constraints.

### Agent Identifier
```
ID: @database-specialist
Phase: 15 (Technology-Specific Database)
Parent Orchestrator: @backend-specialist
Trigger Condition: Backend requires database setup
Activation: Conditional (invoked from @backend-specialist)
```

### Input Schema Reference
**File**: `database-specialist.input.schema.json`

**Key Input Fields**:
```json
{
  "database_system": "SQL Server|PostgreSQL|MySQL|MongoDB",
  "database_version": "2019|2022|14|15|8.0",
  "entities_to_model": [
    {
      "name": "User",
      "properties": [
        { "name": "Id", "type": "UUID", "key": true },
        { "name": "Email", "type": "string", "unique": true },
        { "name": "IsActive", "type": "boolean" }
      ],
      "relationships": ["HasMany(Orders)", "HasOne(Profile)"]
    }
  ],
  "performance_requirements": {
    "expected_users": 100000,
    "concurrent_connections": 500,
    "query_response_time_ms": 200,
    "transaction_rate_per_sec": 1000
  },
  "backup_strategy": "Full|Incremental",
  "high_availability": "Replication|Always-On",
  "encryption_at_rest": true,
  "encryption_in_transit": true,
  "compliance": "HIPAA|GDPR|PCI-DSS"
}
```

### Output Schema Reference
**File**: `database-specialist.output.schema.json`

**Key Output Structure**:
```json
{
  "artifact_type": "sql-schema",
  "phase": 15,
  "database_design": {
    "database_name": "ApplicationDb",
    "owner": "dbo",
    "collation": "SQL_Latin1_General_CP1_CI_AS"
  },
  "tables": [
    {
      "name": "Users",
      "schema": "dbo",
      "columns": [
        {
          "name": "Id",
          "data_type": "UNIQUEIDENTIFIER",
          "nullable": false,
          "is_primary_key": true,
          "is_identity": false,
          "default_value": "NEWID()"
        },
        {
          "name": "Email",
          "data_type": "NVARCHAR(255)",
          "nullable": false,
          "is_unique": true,
          "index_type": "NONCLUSTERED"
        }
      ],
      "primary_key": "PK_Users_Id",
      "foreign_keys": [
        {
          "name": "FK_Orders_UserId",
          "references_table": "Orders",
          "references_column": "UserId",
          "action_delete": "CASCADE"
        }
      ],
      "indexes": [
        {
          "name": "IX_Users_Email",
          "type": "NONCLUSTERED",
          "columns": ["Email"],
          "include_columns": ["IsActive"],
          "unique": false
        }
      ],
      "ddl": "CREATE TABLE [dbo].[Users] ..."
    }
  ],
  "views": [
    {
      "name": "vw_ActiveUsers",
      "schema": "dbo",
      "description": "View of active users with order count",
      "ddl": "CREATE VIEW [dbo].[vw_ActiveUsers] AS ..."
    }
  ],
  "stored_procedures": [
    {
      "name": "usp_GetUserWithOrders",
      "schema": "dbo",
      "parameters": [
        { "name": "@UserId", "type": "UNIQUEIDENTIFIER" }
      ],
      "returns": "Result set with user and orders",
      "performance_notes": "Uses index on Users.Id",
      "ddl": "CREATE PROCEDURE [dbo].[usp_GetUserWithOrders] ..."
    }
  ],
  "migration_scripts": [
    {
      "sequence": 1,
      "name": "20260113_InitialSchema",
      "description": "Create initial database schema",
      "up_script": "CREATE TABLE [dbo].[Users] ...",
      "down_script": "DROP TABLE [dbo].[Users]"
    }
  ],
  "indexing_strategy": {
    "clustered_indexes": ["PK_Users_Id"],
    "nonclustered_indexes": [
      "IX_Users_Email",
      "IX_Orders_UserId",
      "IX_Orders_CreatedDate"
    ],
    "optimization_notes": "Covering indexes on frequently joined columns"
  },
  "security": {
    "encryption_at_rest": {
      "enabled": true,
      "algorithm": "AES-256",
      "key_management": "Azure Key Vault"
    },
    "row_level_security": {
      "enabled": true,
      "policy": "Filter by department"
    },
    "column_encryption": [
      { "table": "Users", "column": "Email", "encrypted": true }
    ]
  },
  "validation": {
    "syntax_errors": 0,
    "warnings": 0,
    "constraint_violations": 0,
    "index_coverage": 95
  },
  "performance_analysis": {
    "estimated_storage_mb": 250,
    "growth_per_month_mb": 5,
    "query_plan_analysis": "All queries use optimal indexes"
  }
}
```

### Skills Invoked
1. **sql-schema-design.skill** - Schema design, normalization, relationships
2. **query-optimization.skill** - Indexing strategies, query tuning
3. **database-migration.skill** - Migration scripts, versioning, rollback
4. **data-modeling.skill** - Entity relationships, constraints

### MCP Tools Used
- SQL DDL generation
- Query plan analysis
- Index recommendation
- Migration script generation

---

## 4. @azure-devops-specialist Agent

### Purpose
Generate production-ready Azure Pipelines YAML configurations including multi-stage builds, artifact management, automated testing, security scanning, and deployment strategies. Ensures CI/CD pipeline aligns with quality and security requirements.

### Agent Identifier
```
ID: @azure-devops-specialist
Phase: 16 (Technology-Specific DevOps)
Parent Orchestrator: @devops-specialist
Trigger Condition: Tech stack includes "Azure DevOps"
Activation: Conditional (only when Azure DevOps selected)
```

### Input Schema Reference
**File**: `azure-devops-specialist.input.schema.json`

**Key Input Fields**:
```json
{
  "pipeline_name": "Build and Deploy API",
  "repository_type": "Azure Repos|GitHub",
  "trigger_branches": ["main", "develop"],
  "build_stages": [
    {
      "name": "Build",
      "jobs": [
        {
          "name": "BuildDotNet",
          "agent_pool": "Azure Pipelines",
          "image": "windows-latest",
          "commands": ["dotnet build", "dotnet test"]
        }
      ]
    }
  ],
  "artifact_repository": "Azure Artifacts",
  "deployment_targets": [
    {
      "environment": "Development",
      "resource": "Azure App Service",
      "approval_required": false
    },
    {
      "environment": "Production",
      "resource": "Azure App Service",
      "approval_required": true,
      "approvers": ["architect@company.com"]
    }
  ],
  "security_scanning": {
    "code_analysis": "SonarQube",
    "dependency_check": "WhiteSource|Dependabot",
    "sast": "GitHub Advanced Security",
    "container_scan": "Aqua|Twistlock"
  },
  "notifications": {
    "on_failure": "email|slack",
    "recipients": ["team@company.com"]
  }
}
```

### Output Schema Reference
**File**: `azure-devops-specialist.output.schema.json`

**Key Output Structure**:
```json
{
  "artifact_type": "azure-pipeline",
  "phase": 16,
  "pipeline_yaml": {
    "trigger": ["main", "develop"],
    "pr_triggers": ["main"],
    "pool": {
      "vmImage": "windows-latest"
    },
    "variables": [
      {
        "name": "buildConfiguration",
        "value": "Release"
      },
      {
        "name": "projectPath",
        "value": "$(Build.SourcesDirectory)/src/Api"
      }
    ],
    "stages": [
      {
        "stage": "Build",
        "displayName": "Build and Test",
        "jobs": [
          {
            "job": "BuildJob",
            "displayName": "Build .NET Application",
            "steps": [
              {
                "task": "UseDotNet@2",
                "inputs": {
                  "packageType": "sdk",
                  "version": "8.x"
                }
              },
              {
                "script": "dotnet build --configuration $(buildConfiguration)",
                "displayName": "Build"
              },
              {
                "script": "dotnet test --configuration $(buildConfiguration) /p:CollectCoverage=true",
                "displayName": "Run Tests"
              }
            ]
          }
        ]
      },
      {
        "stage": "CodeQuality",
        "displayName": "Code Quality & Security",
        "dependsOn": "Build",
        "jobs": [
          {
            "job": "SonarQube",
            "displayName": "Run SonarQube Analysis",
            "steps": [
              {
                "task": "SonarQubePrepare@5",
                "inputs": {
                  "SonarQube": "SonarQube Server",
                  "scannerMode": "MSBuild"
                }
              }
            ]
          }
        ]
      },
      {
        "stage": "Deploy_Dev",
        "displayName": "Deploy to Development",
        "dependsOn": "CodeQuality",
        "jobs": [
          {
            "deployment": "DeployDev",
            "environment": "Development",
            "strategy": {
              "runOnce": {
                "deploy": {
                  "steps": [
                    {
                      "task": "AzureWebApp@1",
                      "inputs": {
                        "azureSubscription": "Azure Subscription",
                        "appType": "webAppLinux",
                        "appName": "api-dev"
                      }
                    }
                  ]
                }
              }
            }
          }
        ]
      },
      {
        "stage": "Deploy_Prod",
        "displayName": "Deploy to Production",
        "dependsOn": "Deploy_Dev",
        "condition": "succeeded()",
        "jobs": [
          {
            "deployment": "DeployProd",
            "environment": "Production",
            "strategy": {
              "runOnce": {
                "preDeploy": {
                  "steps": [
                    {
                      "script": "echo Waiting for approval",
                      "displayName": "Pre-deployment approval"
                    }
                  ]
                },
                "deploy": {
                  "steps": [
                    {
                      "task": "AzureWebApp@1",
                      "inputs": {
                        "azureSubscription": "Azure Subscription",
                        "appName": "api-prod"
                      }
                    }
                  ]
                }
              }
            }
          }
        ]
      }
    ]
  },
  "validation": {
    "yaml_syntax_valid": true,
    "task_references_valid": true,
    "environment_references_valid": true,
    "warnings": 0
  },
  "deployment_targets": [
    {
      "environment": "Development",
      "resource_type": "Azure App Service",
      "resource_name": "api-dev-app-service",
      "deployment_approval": "automatic"
    },
    {
      "environment": "Production",
      "resource_type": "Azure App Service",
      "resource_name": "api-prod-app-service",
      "deployment_approval": "manual",
      "approvers": ["architect@company.com", "devops-lead@company.com"]
    }
  ],
  "quality_gates": [
    {
      "gate": "Build Success",
      "metric": "Build passed",
      "blocking": true
    },
    {
      "gate": "Test Coverage",
      "metric": ">= 80%",
      "blocking": true
    },
    {
      "gate": "SonarQube Quality Gate",
      "metric": "SQ Quality Gate passed",
      "blocking": true
    },
    {
      "gate": "Security Scanning",
      "metric": "No critical vulnerabilities",
      "blocking": false
    }
  ]
}
```

### Skills Invoked
1. **azure-pipelines.skill** - Azure Pipelines YAML, stages, jobs, tasks
2. **pipeline-optimization.skill** - Caching, parallelization, efficiency
3. **security-scanning.skill** - SonarQube, dependency scanning, container scanning
4. **deployment-strategies.skill** - Blue-green, canary, rolling deployments

### MCP Tools Used
- Azure Pipelines YAML validation
- Task reference validation
- Environment variable substitution
- YAML generation

---

## Summary: Phase 1 Agents

| Agent | Purpose | Input | Output | Skills | Status |
|-------|---------|-------|--------|--------|--------|
| @react-specialist | React components, hooks, state | Component specs | React code, tests | react-patterns, state-mgmt | Ready to spec |
| @dotnet-specialist | .NET APIs, services, EF Core | API specs | Controllers, services, migrations | dotnet-webapi, entity-framework | Ready to spec |
| @database-specialist | SQL schema, optimization, migrations | Entity models | DDL scripts, migrations | sql-design, query-optimization | Ready to spec |
| @azure-devops-specialist | Azure Pipelines YAML generation | Pipeline specs | azure-pipelines.yml, environments | azure-pipelines, security-scanning | Ready to spec |

---

**Status**: PHASE 1 AGENT SPECIFICATIONS COMPLETE

**Next Document**: C_SCHEMA_DEFINITIONS.md (Input/output schemas for all 4 agents)
