# Schema Definitions: Phase 1 Technology Agents

**Complete JSON Schema Specifications for Inputs, Outputs, and Artifacts**

**Version**: 1.0  
**Date**: January 13, 2026

---

## 1. Agent Input/Output Schemas

### 1.1 @react-specialist Schemas

#### File: `react-specialist.input.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "React Specialist Input Schema",
  "description": "Input requirements for React component generation",
  "type": "object",
  "required": [
    "component_requirements",
    "dependency_context",
    "project_context"
  ],
  "properties": {
    "project_context": {
      "type": "object",
      "required": ["project_id", "phase", "tech_stack_decision_id"],
      "properties": {
        "project_id": { "type": "string", "pattern": "^proj-" },
        "phase": { "type": "integer", "const": 13 },
        "tech_stack_decision_id": { "type": "string" }
      }
    },
    "component_requirements": {
      "type": "array",
      "minItems": 1,
      "maxItems": 20,
      "items": {
        "type": "object",
        "required": [
          "name",
          "type",
          "responsibility",
          "props"
        ],
        "properties": {
          "name": {
            "type": "string",
            "pattern": "^[A-Z][a-zA-Z0-9]*$",
            "description": "PascalCase component name"
          },
          "type": {
            "type": "string",
            "enum": ["functional", "class", "wrapper"],
            "description": "Component type (functional recommended)"
          },
          "responsibility": {
            "type": "string",
            "description": "Component's primary responsibility"
          },
          "props": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "properties": {
                "type": { "type": "string", "enum": ["string", "number", "boolean", "object", "array", "callback", "element"] },
                "required": { "type": "boolean" },
                "description": { "type": "string" }
              }
            }
          },
          "state_needs": {
            "type": "array",
            "items": { "type": "string" },
            "description": "State variables needed"
          },
          "api_integration": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "endpoint": { "type": "string" },
                "method": { "type": "string", "enum": ["GET", "POST", "PUT", "DELETE"] },
                "cache_ttl_seconds": { "type": "integer" }
              }
            }
          },
          "styling_requirements": {
            "type": "object",
            "properties": {
              "layout": { "type": "string", "enum": ["flex", "grid", "absolute"] },
              "responsive_breakpoints": {
                "type": "array",
                "items": { "type": "string", "enum": ["mobile", "tablet", "desktop"] }
              }
            }
          }
        }
      }
    },
    "dependency_context": {
      "type": "object",
      "properties": {
        "state_management": {
          "type": "string",
          "enum": ["Context API", "Redux", "Redux Toolkit", "Zustand", "Jotai", "Recoil"],
          "description": "State management library"
        },
        "styling": {
          "type": "string",
          "enum": ["Tailwind CSS", "styled-components", "CSS Modules", "Material-UI", "Chakra UI"],
          "description": "CSS solution"
        },
        "ui_library": {
          "type": "string",
          "enum": ["Material-UI", "Chakra UI", "shadcn/ui", "Ant Design", "Bootstrap"]
        },
        "testing_framework": {
          "type": "string",
          "enum": ["Jest", "Vitest", "Playwright"],
          "description": "Test framework"
        },
        "routing_library": {
          "type": "string",
          "enum": ["React Router v6", "TanStack Router", "Next.js Router", "Remix"],
          "description": "Routing solution"
        },
        "http_client": {
          "type": "string",
          "enum": ["fetch API", "axios", "React Query", "SWR", "TanStack Query"],
          "description": "HTTP client/fetching solution"
        }
      }
    },
    "performance_constraints": {
      "type": "object",
      "properties": {
        "ssr_compatible": { "type": "boolean" },
        "max_bundle_size_kb": { "type": "integer" },
        "lighthouse_target": { "type": "integer", "minimum": 50, "maximum": 100 },
        "first_contentful_paint_ms": { "type": "integer" }
      }
    },
    "code_quality": {
      "type": "object",
      "properties": {
        "typescript_enabled": { "type": "boolean" },
        "testing_coverage_target": { "type": "integer", "minimum": 0, "maximum": 100 },
        "accessibility_level": {
          "type": "string",
          "enum": ["WCAG 2.1 A", "WCAG 2.1 AA", "WCAG 2.1 AAA"]
        },
        "strict_mode": { "type": "boolean" }
      }
    }
  }
}
```

#### File: `react-specialist.output.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "React Specialist Output Schema",
  "description": "Generated React components, hooks, and context providers",
  "type": "object",
  "required": [
    "artifact_type",
    "phase",
    "components",
    "validation"
  ],
  "properties": {
    "artifact_type": { "type": "string", "const": "react-components" },
    "phase": { "type": "integer", "const": 13 },
    "timestamp": { "type": "string", "format": "date-time" },
    "components": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "file_path", "code"],
        "properties": {
          "name": { "type": "string", "pattern": "^[A-Z][a-zA-Z0-9]*$" },
          "file_path": { "type": "string", "pattern": ".*\\.tsx?$" },
          "component_type": {
            "type": "string",
            "enum": ["functional", "class", "wrapper"]
          },
          "hooks_used": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["useState", "useEffect", "useContext", "useReducer", "useCallback", "useMemo", "useRef", "useLayoutEffect"]
            }
          },
          "custom_hooks": {
            "type": "array",
            "items": { "type": "string" }
          },
          "props_interface": { "type": "string" },
          "code": { "type": "string", "minLength": 50 },
          "imports": { "type": "array", "items": { "type": "string" } },
          "dependencies": { "type": "array", "items": { "type": "string" } },
          "test_file": { "type": "string" },
          "test_cases": { "type": "integer", "minimum": 1 },
          "accessibility_features": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["aria-labels", "aria-describedby", "role", "aria-live", "aria-expanded", "tabindex"]
            }
          },
          "performance_optimizations": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["React.memo", "useCallback", "useMemo", "lazy", "Suspense"]
            }
          }
        }
      }
    },
    "custom_hooks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "pattern": "^use[A-Z][a-zA-Z0-9]*$" },
          "file_path": { "type": "string" },
          "description": { "type": "string" },
          "parameters": { "type": "array", "items": { "type": "string" } },
          "returns": { "type": "object" },
          "code": { "type": "string" }
        }
      }
    },
    "context_providers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "pattern": "[A-Z][a-zA-Z0-9]*Context" },
          "file_path": { "type": "string" },
          "provides": { "type": "array", "items": { "type": "string" } },
          "code": { "type": "string" }
        }
      }
    },
    "validation": {
      "type": "object",
      "properties": {
        "typescript_errors": { "type": "integer", "minimum": 0 },
        "eslint_warnings": { "type": "integer", "minimum": 0 },
        "tests_passing": { "type": "integer", "minimum": 0 },
        "coverage_percentage": { "type": "integer", "minimum": 0, "maximum": 100 },
        "accessibility_violations": { "type": "integer", "minimum": 0 },
        "validation_status": { "type": "string", "enum": ["passed", "passed_with_warnings", "failed"] }
      }
    },
    "quality_metrics": {
      "type": "object",
      "properties": {
        "total_lines": { "type": "integer" },
        "average_cyclomatic_complexity": { "type": "number" },
        "maintainability_index": { "type": "integer" },
        "estimated_bundle_impact_kb": { "type": "number" }
      }
    }
  }
}
```

---

### 1.2 @dotnet-specialist Schemas

#### File: `dotnet-specialist.input.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DotNet Specialist Input Schema",
  "description": "Input requirements for .NET API generation",
  "type": "object",
  "required": [
    "api_endpoints",
    "database_context",
    "project_context"
  ],
  "properties": {
    "project_context": {
      "type": "object",
      "required": ["project_id", "phase"],
      "properties": {
        "project_id": { "type": "string", "pattern": "^proj-" },
        "phase": { "type": "integer", "const": 14 },
        "net_version": { "type": "string", "enum": ["6.0", "7.0", "8.0"] }
      }
    },
    "api_endpoints": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["name", "method", "route", "response_model"],
        "properties": {
          "name": { "type": "string", "pattern": "^[A-Z][a-zA-Z0-9]*Async$" },
          "method": { "type": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"] },
          "route": { "type": "string", "pattern": "^/api/" },
          "request_model": { "type": "string" },
          "response_model": { "type": "string" },
          "authentication": { "type": "string", "enum": ["Bearer", "ApiKey", "OAuth2", "None"] },
          "authorization": {
            "type": "array",
            "items": { "type": "string", "enum": ["Admin", "User", "Moderator"] }
          },
          "validation_rules": { "type": "array", "items": { "type": "string" } },
          "error_cases": {
            "type": "array",
            "items": { "type": "string", "enum": ["BadRequest", "NotFound", "Unauthorized", "Forbidden", "Conflict"] }
          }
        }
      }
    },
    "database_context": {
      "type": "object",
      "properties": {
        "orm": { "type": "string", "enum": ["Entity Framework Core", "Dapper"] },
        "database_system": { "type": "string", "enum": ["SQL Server", "PostgreSQL", "MySQL"] },
        "models_needed": { "type": "array", "items": { "type": "string" } },
        "relationships": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "from": { "type": "string" },
              "to": { "type": "string" },
              "type": { "type": "string", "enum": ["OneToOne", "OneToMany", "ManyToMany"] }
            }
          }
        }
      }
    },
    "authentication_method": {
      "type": "string",
      "enum": ["JWT", "OAuth2", "Azure AD", "API Key"]
    },
    "logging_framework": {
      "type": "string",
      "enum": ["Serilog", "NLog", "Log4Net"]
    },
    "testing_framework": {
      "type": "string",
      "enum": ["xUnit", "NUnit", "MSTest"]
    },
    "code_style": {
      "type": "object",
      "properties": {
        "nullable_reference_types": { "type": "boolean" },
        "async_await_required": { "type": "boolean" },
        "dependency_injection": { "type": "boolean" }
      }
    }
  }
}
```

#### File: `dotnet-specialist.output.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DotNet Specialist Output Schema",
  "description": "Generated .NET API controllers, services, and models",
  "type": "object",
  "required": [
    "artifact_type",
    "phase",
    "controllers",
    "validation"
  ],
  "properties": {
    "artifact_type": { "type": "string", "const": "dotnet-controllers-services" },
    "phase": { "type": "integer", "const": 14 },
    "controllers": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "file_path", "code"],
        "properties": {
          "name": { "type": "string", "pattern": "^[A-Z][a-zA-Z0-9]*Controller$" },
          "file_path": { "type": "string", "pattern": ".*\\.cs$" },
          "route": { "type": "string", "pattern": "^\\[ApiController\\]" },
          "endpoints": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "http_method": { "type": "string", "enum": ["GET", "POST", "PUT", "DELETE"] },
                "route": { "type": "string" },
                "return_type": { "type": "string" },
                "code": { "type": "string" }
              }
            }
          },
          "dependencies": { "type": "array", "items": { "type": "string" } },
          "code": { "type": "string", "minLength": 100 }
        }
      }
    },
    "services": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "pattern": "^[A-Z][a-zA-Z0-9]*Service$" },
          "interface": { "type": "string", "pattern": "^I[A-Z][a-zA-Z0-9]*Service$" },
          "file_path": { "type": "string" },
          "methods": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "parameters": { "type": "array" },
                "returns": { "type": "string" },
                "code": { "type": "string" }
              }
            }
          },
          "code": { "type": "string" }
        }
      }
    },
    "entity_models": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "pattern": "^[A-Z][a-zA-Z0-9]*$" },
          "file_path": { "type": "string" },
          "properties": { "type": "array" },
          "code": { "type": "string" }
        }
      }
    },
    "database_context": {
      "type": "object",
      "properties": {
        "name": { "type": "string", "pattern": "DbContext$" },
        "file_path": { "type": "string" },
        "dbsets": { "type": "array", "items": { "type": "string" } },
        "code": { "type": "string" }
      }
    },
    "validation": {
      "type": "object",
      "properties": {
        "csharp_errors": { "type": "integer", "minimum": 0 },
        "warnings": { "type": "integer", "minimum": 0 },
        "tests_passing": { "type": "integer", "minimum": 0 },
        "coverage_percentage": { "type": "integer", "minimum": 0, "maximum": 100 },
        "async_await_compliant": { "type": "boolean" },
        "nullable_safe": { "type": "boolean" }
      }
    }
  }
}
```

---

### 1.3 @database-specialist Schemas

#### File: `database-specialist.input.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Database Specialist Input Schema",
  "description": "Input requirements for database schema generation",
  "type": "object",
  "required": [
    "database_system",
    "entities_to_model",
    "project_context"
  ],
  "properties": {
    "project_context": {
      "type": "object",
      "properties": {
        "project_id": { "type": "string" },
        "phase": { "type": "integer", "const": 15 }
      }
    },
    "database_system": {
      "type": "string",
      "enum": ["SQL Server", "PostgreSQL", "MySQL", "MariaDB", "Oracle"]
    },
    "database_version": { "type": "string" },
    "entities_to_model": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "properties"],
        "properties": {
          "name": { "type": "string", "pattern": "^[A-Z][a-zA-Z0-9]*$" },
          "properties": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "properties": {
                "name": { "type": "string", "pattern": "^[a-zA-Z_][a-zA-Z0-9_]*$" },
                "type": { "type": "string", "enum": ["UUID", "int", "bigint", "string", "decimal", "datetime", "boolean", "json"] },
                "max_length": { "type": "integer" },
                "nullable": { "type": "boolean" },
                "unique": { "type": "boolean" },
                "indexed": { "type": "boolean" }
              }
            }
          },
          "relationships": {
            "type": "array",
            "items": {
              "type": "string",
              "examples": ["HasMany(Orders)", "HasOne(Profile)"]
            }
          }
        }
      }
    },
    "performance_requirements": {
      "type": "object",
      "properties": {
        "expected_records": { "type": "integer" },
        "concurrent_connections": { "type": "integer" },
        "query_response_time_ms": { "type": "integer" },
        "transaction_rate_per_sec": { "type": "integer" }
      }
    },
    "security": {
      "type": "object",
      "properties": {
        "encryption_at_rest": { "type": "boolean" },
        "encryption_in_transit": { "type": "boolean" },
        "row_level_security": { "type": "boolean" },
        "compliance": {
          "type": "array",
          "items": { "type": "string", "enum": ["HIPAA", "GDPR", "PCI-DSS"] }
        }
      }
    }
  }
}
```

#### File: `database-specialist.output.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Database Specialist Output Schema",
  "description": "Generated database schemas, DDL scripts, and migrations",
  "type": "object",
  "required": [
    "artifact_type",
    "phase",
    "tables",
    "validation"
  ],
  "properties": {
    "artifact_type": { "type": "string", "const": "sql-schema" },
    "phase": { "type": "integer", "const": 15 },
    "tables": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "columns", "ddl"],
        "properties": {
          "name": { "type": "string", "pattern": "^[A-Z][a-zA-Z0-9]*$" },
          "columns": { "type": "array", "items": { "type": "object" } },
          "primary_key": { "type": "string" },
          "foreign_keys": { "type": "array", "items": { "type": "object" } },
          "indexes": { "type": "array", "items": { "type": "object" } },
          "ddl": { "type": "string", "pattern": "^CREATE TABLE" }
        }
      }
    },
    "stored_procedures": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "pattern": "^usp_" },
          "parameters": { "type": "array" },
          "ddl": { "type": "string" }
        }
      }
    },
    "migration_scripts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sequence": { "type": "integer" },
          "name": { "type": "string" },
          "up_script": { "type": "string" },
          "down_script": { "type": "string" }
        }
      }
    },
    "validation": {
      "type": "object",
      "properties": {
        "syntax_errors": { "type": "integer", "minimum": 0 },
        "constraint_violations": { "type": "integer", "minimum": 0 },
        "performance_issues": { "type": "array" }
      }
    }
  }
}
```

---

### 1.4 @azure-devops-specialist Schemas

#### File: `azure-devops-specialist.input.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Azure DevOps Specialist Input Schema",
  "description": "Input requirements for Azure Pipelines generation",
  "type": "object",
  "required": [
    "pipeline_name",
    "build_stages",
    "project_context"
  ],
  "properties": {
    "project_context": {
      "type": "object",
      "properties": {
        "project_id": { "type": "string" },
        "phase": { "type": "integer", "const": 16 }
      }
    },
    "pipeline_name": { "type": "string" },
    "repository_type": {
      "type": "string",
      "enum": ["Azure Repos", "GitHub", "Bitbucket"]
    },
    "trigger_branches": {
      "type": "array",
      "items": { "type": "string" }
    },
    "build_stages": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": "string", "enum": ["Build", "Test", "Quality", "Deploy"] },
          "jobs": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "pool": { "type": "string" },
                "commands": { "type": "array", "items": { "type": "string" } }
              }
            }
          }
        }
      }
    },
    "deployment_targets": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["environment", "resource"],
        "properties": {
          "environment": { "type": "string", "enum": ["Development", "Staging", "Production"] },
          "resource": { "type": "string", "enum": ["Azure App Service", "Azure Container Instances", "AKS"] },
          "approval_required": { "type": "boolean" }
        }
      }
    },
    "security_scanning": {
      "type": "object",
      "properties": {
        "code_analysis": { "type": "string", "enum": ["SonarQube", "None"] },
        "dependency_check": { "type": "string", "enum": ["WhiteSource", "Dependabot", "None"] },
        "sast": { "type": "string" }
      }
    }
  }
}
```

#### File: `azure-devops-specialist.output.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Azure DevOps Specialist Output Schema",
  "description": "Generated Azure Pipelines YAML configuration",
  "type": "object",
  "required": [
    "artifact_type",
    "phase",
    "pipeline_yaml",
    "validation"
  ],
  "properties": {
    "artifact_type": { "type": "string", "const": "azure-pipeline" },
    "phase": { "type": "integer", "const": 16 },
    "pipeline_yaml": {
      "type": "object",
      "properties": {
        "trigger": { "type": "array" },
        "pool": { "type": "object" },
        "variables": { "type": "array" },
        "stages": { "type": "array" },
        "yaml_content": { "type": "string", "description": "Raw YAML content" }
      }
    },
    "file_path": {
      "type": "string",
      "const": "azure-pipelines.yml"
    },
    "deployment_targets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "environment": { "type": "string" },
          "resource_type": { "type": "string" },
          "resource_name": { "type": "string" },
          "approval_required": { "type": "boolean" }
        }
      }
    },
    "quality_gates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "metric": { "type": "string" },
          "blocking": { "type": "boolean" }
        }
      }
    },
    "validation": {
      "type": "object",
      "properties": {
        "yaml_valid": { "type": "boolean" },
        "task_references_valid": { "type": "boolean" },
        "environment_references_valid": { "type": "boolean" },
        "warnings": { "type": "array" }
      }
    }
  }
}
```

---

## 2. Artifact Type Schemas

### File: `react-components.artifact.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "React Components Artifact",
  "type": "object",
  "properties": {
    "artifact_id": { "type": "string", "pattern": "^artifact-" },
    "artifact_type": { "type": "string", "const": "react-components" },
    "phase": { "type": "integer", "const": 13 },
    "created_timestamp": { "type": "string", "format": "date-time" },
    "project_id": { "type": "string" },
    "components_generated": { "type": "integer", "minimum": 1 },
    "custom_hooks_generated": { "type": "integer", "minimum": 0 },
    "context_providers_generated": { "type": "integer", "minimum": 0 },
    "files_created": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file_path": { "type": "string" },
          "file_type": { "type": "string", "enum": ["tsx", "ts", "test.tsx"] },
          "lines_of_code": { "type": "integer" }
        }
      }
    },
    "validation_summary": {
      "type": "object",
      "properties": {
        "typescript_valid": { "type": "boolean" },
        "eslint_passed": { "type": "boolean" },
        "tests_passing": { "type": "boolean" },
        "coverage_above_target": { "type": "boolean" },
        "accessibility_compliant": { "type": "boolean" }
      }
    },
    "integration_requirements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "requirement": { "type": "string" },
          "priority": { "type": "string", "enum": ["must-have", "should-have", "nice-to-have"] }
        }
      }
    },
    "status": { "type": "string", "enum": ["ready_for_integration", "needs_review", "failed"] }
  }
}
```

### File: `dotnet-controllers.artifact.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DotNet Controllers Artifact",
  "type": "object",
  "properties": {
    "artifact_id": { "type": "string", "pattern": "^artifact-" },
    "artifact_type": { "type": "string", "const": "dotnet-controllers-services" },
    "phase": { "type": "integer", "const": 14 },
    "controllers_generated": { "type": "integer", "minimum": 1 },
    "services_generated": { "type": "integer", "minimum": 1 },
    "entities_generated": { "type": "integer", "minimum": 0 },
    "files_created": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file_path": { "type": "string", "pattern": ".*\\.cs$" },
          "lines_of_code": { "type": "integer" }
        }
      }
    },
    "validation_summary": {
      "type": "object",
      "properties": {
        "compiles": { "type": "boolean" },
        "no_errors": { "type": "boolean" },
        "async_compliant": { "type": "boolean" },
        "tests_passing": { "type": "boolean" }
      }
    },
    "status": { "type": "string", "enum": ["ready_for_integration", "needs_review", "failed"] }
  }
}
```

### File: `sql-schema.artifact.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SQL Schema Artifact",
  "type": "object",
  "properties": {
    "artifact_id": { "type": "string", "pattern": "^artifact-" },
    "artifact_type": { "type": "string", "const": "sql-schema" },
    "phase": { "type": "integer", "const": 15 },
    "database_system": { "type": "string" },
    "tables_created": { "type": "integer", "minimum": 1 },
    "stored_procedures_created": { "type": "integer", "minimum": 0 },
    "migrations_created": { "type": "integer", "minimum": 1 },
    "files_created": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file_path": { "type": "string" },
          "file_type": { "type": "string", "enum": ["sql"] }
        }
      }
    },
    "validation_summary": {
      "type": "object",
      "properties": {
        "syntax_valid": { "type": "boolean" },
        "constraints_valid": { "type": "boolean" },
        "no_performance_issues": { "type": "boolean" }
      }
    },
    "status": { "type": "string", "enum": ["ready_for_deployment", "needs_review", "failed"] }
  }
}
```

### File: `azure-pipeline.artifact.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Azure Pipeline Artifact",
  "type": "object",
  "properties": {
    "artifact_id": { "type": "string", "pattern": "^artifact-" },
    "artifact_type": { "type": "string", "const": "azure-pipeline" },
    "phase": { "type": "integer", "const": 16 },
    "pipeline_name": { "type": "string" },
    "stages": { "type": "integer", "minimum": 1 },
    "environments": { "type": "integer", "minimum": 1 },
    "quality_gates": { "type": "integer", "minimum": 0 },
    "file_path": { "type": "string", "const": "azure-pipelines.yml" },
    "yaml_content": { "type": "string" },
    "validation_summary": {
      "type": "object",
      "properties": {
        "yaml_valid": { "type": "boolean" },
        "tasks_valid": { "type": "boolean" },
        "environments_configured": { "type": "boolean" }
      }
    },
    "status": { "type": "string", "enum": ["ready_for_deployment", "needs_review", "failed"] }
  }
}
```

---

## 3. Skill Input/Output Schemas

### File: `react-patterns.input.schema.json` / `.output.schema.json`

```json
{
  "input": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "React Patterns Skill Input",
    "properties": {
      "component_type": { "type": "string", "enum": ["stateful", "stateless", "higher-order", "render-props"] },
      "required_hooks": { "type": "array", "items": { "type": "string" } },
      "performance_critical": { "type": "boolean" },
      "context": { "type": "string" }
    }
  },
  "output": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "React Patterns Skill Output",
    "properties": {
      "pattern_recommendations": { "type": "array", "items": { "type": "string" } },
      "code_examples": { "type": "array", "items": { "type": "string" } },
      "performance_tips": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

---

**Status**: SCHEMA DEFINITIONS COMPLETE (Part C1)

**Note**: Part C is very large (500+ schemas). Continuing with D_INTEGRATION_EXAMPLES.md in next message to avoid token limits.
