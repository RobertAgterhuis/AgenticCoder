#!/usr/bin/env node

/**
 * Schema Generator for All 35 Agent Specifications
 * Generates JSON Schema input/output files for each agent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Schema directory path
// NOTE: scripts/ lives under repo-root/scripts, so we go up one level.
const schemasDir = path.join(__dirname, '..', '.github', 'schemas', 'agents');

// Ensure directory exists
if (!fs.existsSync(schemasDir)) {
  fs.mkdirSync(schemasDir, { recursive: true });
}

// Define schemas for all 35 agents
const agentSchemas = {
  // TIER 1: ORCHESTRATION (9)
  plan: {
    input: {
      title: "Requirements Planner Agent Input",
      description: "Parses user requirements and generates structured requirement documents",
      required: ["requirements_text"],
      properties: {
        requirements_text: {
          type: "string",
          description: "Raw requirements provided by user",
          minLength: 10
        },
        project_name: { type: "string" },
        organization: { type: "string" },
        context: {
          type: "object",
          properties: {
            industry: { type: "string" },
            existing_systems: { type: "array", items: { type: "string" } },
            constraints: { type: "array", items: { type: "string" } }
          }
        }
      }
    },
    output: {
      title: "Requirements Planner Agent Output",
      description: "Structured requirements document and analysis",
      required: ["requirements", "artifacts_created"],
      properties: {
        requirements: {
          type: "object",
          properties: {
            functional_requirements: { type: "array", items: { type: "string" } },
            non_functional_requirements: {
              type: "object",
              properties: {
                availability: { type: "number" },
                scalability: { type: "string" },
                security: { type: "string" },
                compliance: { type: "array", items: { type: "string" } }
              }
            },
            constraints: { type: "array", items: { type: "string" } }
          }
        },
        artifacts_created: {
          type: "array",
          items: {
            type: "object",
            properties: {
              filename: { type: "string" },
              path: { type: "string" },
              size_bytes: { type: "integer" }
            }
          }
        }
      }
    }
  },
  
  doc: {
    input: {
      title: "Documentation Generator Input",
      description: "Generate comprehensive project documentation",
      required: ["project_name"],
      properties: {
        project_name: { type: "string" },
        project_context: {
          type: "object",
          properties: {
            description: { type: "string" },
            components: { type: "array", items: { type: "string" } },
            architecture: { type: "string" }
          }
        },
        documentation_type: {
          type: "string",
          enum: ["api", "user-guide", "architecture", "deployment"]
        }
      }
    },
    output: {
      title: "Documentation Generator Output",
      description: "Generated documentation files and index",
      required: ["documents", "index"],
      properties: {
        documents: {
          type: "array",
          items: {
            type: "object",
            properties: {
              filename: { type: "string" },
              content: { type: "string" },
              type: { type: "string" }
            }
          }
        },
        index: {
          type: "object",
          properties: {
            sections: { type: "array", items: { type: "string" } },
            toc: { type: "string" }
          }
        }
      }
    }
  },

  backlog: {
    input: {
      title: "Backlog Manager Input",
      description: "Convert requirements into actionable work items",
      required: ["requirements"],
      properties: {
        requirements: { type: "object" },
        project_name: { type: "string" },
        prioritization_criteria: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    output: {
      title: "Backlog Manager Output",
      description: "Structured backlog with epics, stories, and tasks",
      required: ["backlog"],
      properties: {
        backlog: {
          type: "object",
          properties: {
            epics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  user_stories: { type: "array", items: { type: "object" } }
                }
              }
            },
            tasks: { type: "array", items: { type: "object" } }
          }
        }
      }
    }
  },

  coordinator: {
    input: {
      title: "Implementation Coordinator Input",
      description: "Coordinate implementation across teams",
      required: ["backlog", "team_structure"],
      properties: {
        backlog: { type: "object" },
        team_structure: {
          type: "object",
          properties: {
            teams: { type: "array", items: { type: "object" } },
            roles: { type: "array", items: { type: "string" } }
          }
        },
        timeline: { type: "string" }
      }
    },
    output: {
      title: "Implementation Coordinator Output",
      description: "Coordination plan and resource allocation",
      required: ["coordination_plan"],
      properties: {
        coordination_plan: {
          type: "object",
          properties: {
            phases: { type: "array", items: { type: "object" } },
            resource_allocation: { type: "object" },
            dependencies: { type: "array", items: { type: "string" } },
            milestones: { type: "array", items: { type: "object" } }
          }
        }
      }
    }
  },

  qa: {
    input: {
      title: "QA Validator Input",
      description: "Define quality assurance strategy",
      required: ["requirements", "project_type"],
      properties: {
        requirements: { type: "object" },
        project_type: { type: "string" },
        compliance_requirements: { type: "array", items: { type: "string" } },
        test_scope: { type: "string" }
      }
    },
    output: {
      title: "QA Validator Output",
      description: "QA strategy and test plan",
      required: ["qa_strategy", "test_plan"],
      properties: {
        qa_strategy: { type: "object" },
        test_plan: {
          type: "object",
          properties: {
            test_cases: { type: "array", items: { type: "object" } },
            test_schedule: { type: "string" },
            coverage_target: { type: "number" }
          }
        }
      }
    }
  },

  reporter: {
    input: {
      title: "Reporter Agent Input",
      description: "Generate status reports and dashboards",
      required: ["project_state"],
      properties: {
        project_state: { type: "object" },
        report_type: {
          type: "string",
          enum: ["status", "progress", "risk", "metrics"]
        },
        stakeholders: { type: "array", items: { type: "string" } }
      }
    },
    output: {
      title: "Reporter Agent Output",
      description: "Generated reports and visualizations",
      required: ["reports"],
      properties: {
        reports: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              content: { type: "string" },
              format: { type: "string" }
            }
          }
        }
      }
    }
  },

  architect: {
    input: {
      title: "Architecture Agent Input",
      description: "Design system architecture",
      required: ["requirements"],
      properties: {
        requirements: { type: "object" },
        technology_stack: {
          type: "object",
          properties: {
            languages: { type: "array", items: { type: "string" } },
            frameworks: { type: "array", items: { type: "string" } },
            databases: { type: "array", items: { type: "string" } }
          }
        },
        constraints: { type: "array", items: { type: "string" } }
      }
    },
    output: {
      title: "Architecture Agent Output",
      description: "System architecture design",
      required: ["architecture"],
      properties: {
        architecture: {
          type: "object",
          properties: {
            layers: { type: "array", items: { type: "object" } },
            components: { type: "array", items: { type: "object" } },
            data_flow: { type: "string" },
            integration_points: { type: "array", items: { type: "object" } }
          }
        }
      }
    }
  },

  "code-architect": {
    input: {
      title: "Code Architect Input",
      description: "Design code structure and patterns",
      required: ["architecture", "team_skills"],
      properties: {
        architecture: { type: "object" },
        team_skills: { type: "array", items: { type: "string" } },
        coding_standards: { type: "object" }
      }
    },
    output: {
      title: "Code Architect Output",
      description: "Code architecture and patterns",
      required: ["code_structure"],
      properties: {
        code_structure: {
          type: "object",
          properties: {
            directory_layout: { type: "object" },
            module_definitions: { type: "array", items: { type: "object" } },
            design_patterns: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  },

  "devops-specialist": {
    input: {
      title: "DevOps Specialist Input",
      description: "Plan deployment and infrastructure",
      required: ["architecture", "requirements"],
      properties: {
        architecture: { type: "object" },
        requirements: { type: "object" },
        deployment_target: { type: "string" },
        ci_cd_preference: { type: "string" }
      }
    },
    output: {
      title: "DevOps Specialist Output",
      description: "Deployment and infrastructure plan",
      required: ["devops_plan"],
      properties: {
        devops_plan: {
          type: "object",
          properties: {
            ci_cd_pipeline: { type: "object" },
            infrastructure_config: { type: "object" },
            monitoring_strategy: { type: "object" },
            security_controls: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  },

  // TIER 2: ARCHITECTURE (8)
  "azure-principal-architect": {
    input: {
      title: "Azure Principal Architect Input",
      description: "Design Azure cloud architecture",
      required: ["requirements", "project_context"],
      properties: {
        requirements: { type: "object" },
        project_context: {
          type: "object",
          properties: {
            organization: { type: "string" },
            budget: { type: "number" },
            timeline: { type: "string" }
          }
        },
        workload_characteristics: { type: "object" }
      }
    },
    output: {
      title: "Azure Principal Architect Output",
      description: "Azure architecture assessment and recommendations",
      required: ["assessment", "recommendations"],
      properties: {
        assessment: {
          type: "object",
          properties: {
            waf_pillar_assessments: { type: "object" },
            cost_estimate: {
              type: "object",
              properties: {
                currency: { type: "string" },
                monthly_cost: { type: "number" },
                breakdown: { type: "array", items: { type: "object" } }
              }
            }
          }
        },
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              priority: { type: "string" },
              category: { type: "string" },
              recommendation: { type: "string" }
            }
          }
        }
      }
    }
  },

  "aws-architect": {
    input: {
      title: "AWS Architect Input",
      description: "Design AWS cloud architecture",
      required: ["requirements"],
      properties: {
        requirements: { type: "object" },
        aws_regions: { type: "array", items: { type: "string" } },
        workload_type: { type: "string" }
      }
    },
    output: {
      title: "AWS Architect Output",
      description: "AWS architecture and cost estimate",
      required: ["architecture", "cost_estimate"],
      properties: {
        architecture: { type: "object" },
        cost_estimate: { type: "object" }
      }
    }
  },

  "gcp-architect": {
    input: {
      title: "GCP Architect Input",
      description: "Design Google Cloud architecture",
      required: ["requirements"],
      properties: {
        requirements: { type: "object" },
        gcp_regions: { type: "array", items: { type: "string" } }
      }
    },
    output: {
      title: "GCP Architect Output",
      description: "GCP architecture design",
      required: ["architecture"],
      properties: {
        architecture: { type: "object" }
      }
    }
  },

  "bicep-plan": {
    input: {
      title: "Bicep Plan Agent Input",
      description: "Plan Bicep infrastructure-as-code",
      required: ["azure_architecture"],
      properties: {
        azure_architecture: { type: "object" },
        resource_naming_convention: { type: "string" },
        parameter_strategy: { type: "string" }
      }
    },
    output: {
      title: "Bicep Plan Agent Output",
      description: "Bicep template structure and planning",
      required: ["bicep_plan"],
      properties: {
        bicep_plan: {
          type: "object",
          properties: {
            modules: { type: "array", items: { type: "object" } },
            parameters: { type: "object" },
            outputs: { type: "object" }
          }
        }
      }
    }
  },

  "terraform-plan": {
    input: {
      title: "Terraform Plan Agent Input",
      description: "Plan Terraform infrastructure",
      required: ["architecture"],
      properties: {
        architecture: { type: "object" },
        cloud_provider: { type: "string" },
        state_management: { type: "object" }
      }
    },
    output: {
      title: "Terraform Plan Agent Output",
      description: "Terraform configuration plan",
      required: ["terraform_plan"],
      properties: {
        terraform_plan: {
          type: "object",
          properties: {
            modules: { type: "array", items: { type: "object" } },
            variables: { type: "object" },
            outputs: { type: "object" }
          }
        }
      }
    }
  },

  "database-specialist": {
    input: {
      title: "Database Specialist Input",
      description: "Design database architecture",
      required: ["requirements"],
      properties: {
        requirements: { type: "object" },
        data_volume: { type: "object" },
        performance_requirements: { type: "object" }
      }
    },
    output: {
      title: "Database Specialist Output",
      description: "Database architecture and schema design",
      required: ["database_design"],
      properties: {
        database_design: {
          type: "object",
          properties: {
            schema: { type: "object" },
            indexes: { type: "array", items: { type: "object" } },
            relationships: { type: "array", items: { type: "object" } }
          }
        }
      }
    }
  },

  "diagram-generator": {
    input: {
      title: "Diagram Generator Input",
      description: "Generate architecture diagrams",
      required: ["architecture"],
      properties: {
        architecture: { type: "object" },
        diagram_types: { type: "array", items: { type: "string" } },
        tool_preference: { type: "string" }
      }
    },
    output: {
      title: "Diagram Generator Output",
      description: "Generated diagrams",
      required: ["diagrams"],
      properties: {
        diagrams: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              format: { type: "string" },
              path: { type: "string" }
            }
          }
        }
      }
    }
  },

  "adr-generator": {
    input: {
      title: "ADR Generator Input",
      description: "Generate Architecture Decision Records",
      required: ["decisions"],
      properties: {
        decisions: { type: "array", items: { type: "object" } },
        format: { type: "string" }
      }
    },
    output: {
      title: "ADR Generator Output",
      description: "Generated ADR documents",
      required: ["adrs"],
      properties: {
        adrs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              number: { type: "integer" },
              title: { type: "string" },
              status: { type: "string" },
              content: { type: "string" }
            }
          }
        }
      }
    }
  },

  // TIER 3: IMPLEMENTATION - FRONTEND (5)
  "react-specialist": {
    input: {
      title: "React Specialist Input",
      description: "Generate React application code",
      required: ["requirements", "component_specs"],
      properties: {
        requirements: { type: "object" },
        component_specs: { type: "array", items: { type: "object" } },
        styling_framework: { type: "string" },
        state_management: { type: "string" }
      }
    },
    output: {
      title: "React Specialist Output",
      description: "Generated React code and components",
      required: ["components", "files_created"],
      properties: {
        components: { type: "array", items: { type: "object" } },
        files_created: { type: "array", items: { type: "string" } }
      }
    }
  },

  "vue-specialist": {
    input: {
      title: "Vue Specialist Input",
      description: "Generate Vue application code",
      required: ["requirements"],
      properties: {
        requirements: { type: "object" },
        vue_version: { type: "string" },
        build_tool: { type: "string" }
      }
    },
    output: {
      title: "Vue Specialist Output",
      description: "Generated Vue code",
      required: ["components"],
      properties: {
        components: { type: "array", items: { type: "object" } }
      }
    }
  },

  "angular-specialist": {
    input: {
      title: "Angular Specialist Input",
      description: "Generate Angular application",
      required: ["requirements"],
      properties: {
        requirements: { type: "object" },
        angular_version: { type: "string" }
      }
    },
    output: {
      title: "Angular Specialist Output",
      description: "Generated Angular code",
      required: ["modules"],
      properties: {
        modules: { type: "array", items: { type: "object" } }
      }
    }
  },

  "typescript-specialist": {
    input: {
      title: "TypeScript Specialist Input",
      description: "Generate TypeScript code",
      required: ["requirements"],
      properties: {
        requirements: { type: "object" },
        strict_mode: { type: "boolean" }
      }
    },
    output: {
      title: "TypeScript Specialist Output",
      description: "Generated TypeScript code",
      required: ["files"],
      properties: {
        files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "css-specialist": {
    input: {
      title: "CSS Specialist Input",
      description: "Generate stylesheets and design tokens",
      required: ["design_system"],
      properties: {
        design_system: { type: "object" },
        responsive_breakpoints: { type: "array", items: { type: "string" } },
        preprocessor: { type: "string" }
      }
    },
    output: {
      title: "CSS Specialist Output",
      description: "Generated CSS and design assets",
      required: ["stylesheets"],
      properties: {
        stylesheets: { type: "array", items: { type: "object" } }
      }
    }
  },

  // TIER 3: IMPLEMENTATION - BACKEND (6)
  "dotnet-specialist": {
    input: {
      title: ".NET Specialist Input",
      description: "Generate .NET backend code",
      required: ["architecture"],
      properties: {
        architecture: { type: "object" },
        dotnet_version: { type: "string" },
        framework: { type: "string" }
      }
    },
    output: {
      title: ".NET Specialist Output",
      description: "Generated .NET code",
      required: ["files"],
      properties: {
        files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "python-specialist": {
    input: {
      title: "Python Specialist Input",
      description: "Generate Python backend code",
      required: ["architecture"],
      properties: {
        architecture: { type: "object" },
        python_version: { type: "string" },
        framework: { type: "string" }
      }
    },
    output: {
      title: "Python Specialist Output",
      description: "Generated Python code",
      required: ["files"],
      properties: {
        files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "java-specialist": {
    input: {
      title: "Java Specialist Input",
      description: "Generate Java backend code",
      required: ["architecture"],
      properties: {
        architecture: { type: "object" },
        java_version: { type: "string" },
        framework: { type: "string" }
      }
    },
    output: {
      title: "Java Specialist Output",
      description: "Generated Java code",
      required: ["files"],
      properties: {
        files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "nodejs-specialist": {
    input: {
      title: "Node.js Specialist Input",
      description: "Generate Node.js backend code",
      required: ["architecture"],
      properties: {
        architecture: { type: "object" },
        node_version: { type: "string" },
        framework: { type: "string" }
      }
    },
    output: {
      title: "Node.js Specialist Output",
      description: "Generated Node.js code",
      required: ["files"],
      properties: {
        files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "golang-specialist": {
    input: {
      title: "Go Specialist Input",
      description: "Generate Go backend code",
      required: ["architecture"],
      properties: {
        architecture: { type: "object" },
        go_version: { type: "string" }
      }
    },
    output: {
      title: "Go Specialist Output",
      description: "Generated Go code",
      required: ["files"],
      properties: {
        files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "api-specialist": {
    input: {
      title: "API Specialist Input",
      description: "Design and generate API specifications",
      required: ["architecture"],
      properties: {
        architecture: { type: "object" },
        api_style: { type: "string" },
        documentation_format: { type: "string" }
      }
    },
    output: {
      title: "API Specialist Output",
      description: "Generated API specifications",
      required: ["specifications"],
      properties: {
        specifications: { type: "array", items: { type: "object" } }
      }
    }
  },

  // TIER 3: IMPLEMENTATION - INFRASTRUCTURE (6)
  "docker-specialist": {
    input: {
      title: "Docker Specialist Input",
      description: "Generate Docker container configurations",
      required: ["services"],
      properties: {
        services: { type: "array", items: { type: "object" } },
        registry: { type: "string" },
        base_images: { type: "array", items: { type: "string" } }
      }
    },
    output: {
      title: "Docker Specialist Output",
      description: "Generated Dockerfiles and compose files",
      required: ["files"],
      properties: {
        files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "kubernetes-specialist": {
    input: {
      title: "Kubernetes Specialist Input",
      description: "Generate Kubernetes manifests",
      required: ["services"],
      properties: {
        services: { type: "array", items: { type: "object" } },
        cluster_config: { type: "object" },
        namespace: { type: "string" }
      }
    },
    output: {
      title: "Kubernetes Specialist Output",
      description: "Generated K8s manifests",
      required: ["manifests"],
      properties: {
        manifests: { type: "array", items: { type: "object" } }
      }
    }
  },

  "bicep-implement": {
    input: {
      title: "Bicep Implement Agent Input",
      description: "Generate Bicep infrastructure templates",
      required: ["plan"],
      properties: {
        plan: { type: "object" },
        azure_services: { type: "array", items: { type: "string" } }
      }
    },
    output: {
      title: "Bicep Implement Agent Output",
      description: "Generated Bicep templates",
      required: ["files"],
      properties: {
        files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "terraform-implement": {
    input: {
      title: "Terraform Implement Agent Input",
      description: "Generate Terraform configuration",
      required: ["plan"],
      properties: {
        plan: { type: "object" },
        cloud_provider: { type: "string" }
      }
    },
    output: {
      title: "Terraform Implement Agent Output",
      description: "Generated Terraform files",
      required: ["files"],
      properties: {
        files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "ci-cd-specialist": {
    input: {
      title: "CI/CD Specialist Input",
      description: "Generate CI/CD pipeline configuration",
      required: ["repository_info"],
      properties: {
        repository_info: { type: "object" },
        pipeline_platform: { type: "string" },
        stages: { type: "array", items: { type: "string" } }
      }
    },
    output: {
      title: "CI/CD Specialist Output",
      description: "Generated pipeline configuration",
      required: ["pipeline_files"],
      properties: {
        pipeline_files: { type: "array", items: { type: "object" } }
      }
    }
  },

  "monitoring-specialist": {
    input: {
      title: "Monitoring Specialist Input",
      description: "Configure monitoring and observability",
      required: ["services"],
      properties: {
        services: { type: "array", items: { type: "string" } },
        monitoring_tool: { type: "string" },
        alert_rules: { type: "array", items: { type: "object" } }
      }
    },
    output: {
      title: "Monitoring Specialist Output",
      description: "Monitoring configuration",
      required: ["config"],
      properties: {
        config: { type: "object" }
      }
    }
  },

  // TIER 3: IMPLEMENTATION - DATABASE (4)
  "mysql-specialist": {
    input: {
      title: "MySQL Specialist Input",
      description: "Generate MySQL database schemas",
      required: ["schema_design"],
      properties: {
        schema_design: { type: "object" },
        version: { type: "string" },
        collation: { type: "string" }
      }
    },
    output: {
      title: "MySQL Specialist Output",
      description: "Generated SQL schemas and migrations",
      required: ["scripts"],
      properties: {
        scripts: { type: "array", items: { type: "object" } }
      }
    }
  },

  "postgres-specialist": {
    input: {
      title: "PostgreSQL Specialist Input",
      description: "Generate PostgreSQL database schemas",
      required: ["schema_design"],
      properties: {
        schema_design: { type: "object" },
        version: { type: "string" },
        extensions: { type: "array", items: { type: "string" } }
      }
    },
    output: {
      title: "PostgreSQL Specialist Output",
      description: "Generated PostgreSQL schemas",
      required: ["scripts"],
      properties: {
        scripts: { type: "array", items: { type: "object" } }
      }
    }
  },

  "mongodb-specialist": {
    input: {
      title: "MongoDB Specialist Input",
      description: "Generate MongoDB collections and indexes",
      required: ["schema_design"],
      properties: {
        schema_design: { type: "object" },
        replica_set: { type: "boolean" },
        sharding_strategy: { type: "string" }
      }
    },
    output: {
      title: "MongoDB Specialist Output",
      description: "Generated MongoDB configuration",
      required: ["collections"],
      properties: {
        collections: { type: "array", items: { type: "object" } }
      }
    }
  },

  "data-migration-specialist": {
    input: {
      title: "Data Migration Specialist Input",
      description: "Plan and execute data migrations",
      required: ["source_schema", "target_schema"],
      properties: {
        source_schema: { type: "object" },
        target_schema: { type: "object" },
        migration_strategy: { type: "string" }
      }
    },
    output: {
      title: "Data Migration Specialist Output",
      description: "Migration scripts and validation",
      required: ["migration_scripts"],
      properties: {
        migration_scripts: { type: "array", items: { type: "object" } }
      }
    }
  }
};

// Generate schema files
function generateSchemaFile(agentId, schemaType, schema) {
  const fullSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://agenticcoder.com/schemas/agents/${agentId}.${schemaType}.schema.json`,
    type: "object",
    ...schema
  };

  return JSON.stringify(fullSchema, null, 2);
}

// Write all schema files
Object.entries(agentSchemas).forEach(([agentId, schemas]) => {
  // Input schema
  const inputPath = path.join(schemasDir, `${agentId}.input.schema.json`);
  const inputContent = generateSchemaFile(agentId, 'input', schemas.input);
  fs.writeFileSync(inputPath, inputContent);
  console.log(`✓ Created ${agentId}.input.schema.json`);

  // Output schema
  const outputPath = path.join(schemasDir, `${agentId}.output.schema.json`);
  const outputContent = generateSchemaFile(agentId, 'output', schemas.output);
  fs.writeFileSync(outputPath, outputContent);
  console.log(`✓ Created ${agentId}.output.schema.json`);
});

console.log(`\n✓ Generated ${Object.keys(agentSchemas).length * 2} schema files (${Object.keys(agentSchemas).length} agents × 2)`);
console.log(`✓ Total schemas created: ${Object.keys(agentSchemas).length * 2}`);
console.log(`✓ Location: ${schemasDir}`);
