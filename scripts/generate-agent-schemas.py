#!/usr/bin/env python3
"""
Schema Generator for All 35 Agent Specifications
Generates JSON Schema input/output files for each agent
"""

# NOTE (canonical generator):
# This repository treats `scripts/generate-agent-schemas.js` as the single source of truth.
# To avoid drift between JS and Python, this Python entrypoint now delegates to the JS generator.
#
# Usage:
#   python scripts/generate-agent-schemas.py
#
# The legacy Python implementation is intentionally kept (below) to minimize churn, but it is no
# longer executed when run as a script.

import shutil
import subprocess
import sys


def _run_js_generator() -> int:
    node = shutil.which('node')
    if not node:
        print('ERROR: `node` not found on PATH. Install Node.js 20+ to run schema generation.')
        return 1

    cmd = [node, str((__file__[:-3] + '.js'))]
    try:
        return subprocess.call(cmd)
    except OSError as exc:
        print(f'ERROR: Failed to run {cmd}: {exc}')
        return 1


if __name__ == '__main__':
    raise SystemExit(_run_js_generator())

import json
import os
from pathlib import Path

# Schema directory
schemas_dir = Path(__file__).parent.parent / '.github' / 'schemas' / 'agents'
schemas_dir.mkdir(parents=True, exist_ok=True)

# Define schemas for all 35 agents
agent_schemas = {
    # TIER 1: ORCHESTRATION (9)
    'plan': {
        'input': {
            'title': 'Requirements Planner Agent Input',
            'description': 'Parses user requirements and generates structured requirement documents',
            'required': ['requirements_text'],
            'properties': {
                'requirements_text': {
                    'type': 'string',
                    'description': 'Raw requirements provided by user',
                    'minLength': 10
                },
                'project_name': {'type': 'string'},
                'organization': {'type': 'string'},
                'context': {
                    'type': 'object',
                    'properties': {
                        'industry': {'type': 'string'},
                        'existing_systems': {'type': 'array', 'items': {'type': 'string'}},
                        'constraints': {'type': 'array', 'items': {'type': 'string'}}
                    }
                }
            }
        },
        'output': {
            'title': 'Requirements Planner Agent Output',
            'description': 'Structured requirements document and analysis',
            'required': ['requirements', 'artifacts_created'],
            'properties': {
                'requirements': {
                    'type': 'object',
                    'properties': {
                        'functional_requirements': {'type': 'array', 'items': {'type': 'string'}},
                        'non_functional_requirements': {
                            'type': 'object',
                            'properties': {
                                'availability': {'type': 'number'},
                                'scalability': {'type': 'string'},
                                'security': {'type': 'string'},
                                'compliance': {'type': 'array', 'items': {'type': 'string'}}
                            }
                        },
                        'constraints': {'type': 'array', 'items': {'type': 'string'}}
                    }
                },
                'artifacts_created': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'filename': {'type': 'string'},
                            'path': {'type': 'string'},
                            'size_bytes': {'type': 'integer'}
                        }
                    }
                }
            }
        }
    },

    'doc': {
        'input': {
            'title': 'Documentation Generator Input',
            'description': 'Generate comprehensive project documentation',
            'required': ['project_name'],
            'properties': {
                'project_name': {'type': 'string'},
                'project_context': {
                    'type': 'object',
                    'properties': {
                        'description': {'type': 'string'},
                        'components': {'type': 'array', 'items': {'type': 'string'}},
                        'architecture': {'type': 'string'}
                    }
                },
                'documentation_type': {
                    'type': 'string',
                    'enum': ['api', 'user-guide', 'architecture', 'deployment']
                }
            }
        },
        'output': {
            'title': 'Documentation Generator Output',
            'description': 'Generated documentation files and index',
            'required': ['documents', 'index'],
            'properties': {
                'documents': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'filename': {'type': 'string'},
                            'content': {'type': 'string'},
                            'type': {'type': 'string'}
                        }
                    }
                },
                'index': {
                    'type': 'object',
                    'properties': {
                        'sections': {'type': 'array', 'items': {'type': 'string'}},
                        'toc': {'type': 'string'}
                    }
                }
            }
        }
    },

    'backlog': {
        'input': {
            'title': 'Backlog Manager Input',
            'required': ['requirements'],
            'properties': {
                'requirements': {'type': 'object'},
                'project_name': {'type': 'string'},
                'prioritization_criteria': {'type': 'array', 'items': {'type': 'string'}}
            }
        },
        'output': {
            'title': 'Backlog Manager Output',
            'required': ['backlog'],
            'properties': {
                'backlog': {
                    'type': 'object',
                    'properties': {
                        'epics': {'type': 'array', 'items': {'type': 'object'}},
                        'tasks': {'type': 'array', 'items': {'type': 'object'}}
                    }
                }
            }
        }
    },

    'coordinator': {
        'input': {
            'title': 'Implementation Coordinator Input',
            'required': ['backlog', 'team_structure'],
            'properties': {
                'backlog': {'type': 'object'},
                'team_structure': {'type': 'object'},
                'timeline': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Implementation Coordinator Output',
            'required': ['coordination_plan'],
            'properties': {
                'coordination_plan': {'type': 'object'}
            }
        }
    },

    'qa': {
        'input': {
            'title': 'QA Validator Input',
            'required': ['requirements', 'project_type'],
            'properties': {
                'requirements': {'type': 'object'},
                'project_type': {'type': 'string'},
                'compliance_requirements': {'type': 'array', 'items': {'type': 'string'}},
                'test_scope': {'type': 'string'}
            }
        },
        'output': {
            'title': 'QA Validator Output',
            'required': ['qa_strategy', 'test_plan'],
            'properties': {
                'qa_strategy': {'type': 'object'},
                'test_plan': {'type': 'object'}
            }
        }
    },

    'reporter': {
        'input': {
            'title': 'Reporter Agent Input',
            'required': ['project_state'],
            'properties': {
                'project_state': {'type': 'object'},
                'report_type': {
                    'type': 'string',
                    'enum': ['status', 'progress', 'risk', 'metrics']
                },
                'stakeholders': {'type': 'array', 'items': {'type': 'string'}}
            }
        },
        'output': {
            'title': 'Reporter Agent Output',
            'required': ['reports'],
            'properties': {
                'reports': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'architect': {
        'input': {
            'title': 'Architecture Agent Input',
            'required': ['requirements'],
            'properties': {
                'requirements': {'type': 'object'},
                'technology_stack': {'type': 'object'},
                'constraints': {'type': 'array', 'items': {'type': 'string'}}
            }
        },
        'output': {
            'title': 'Architecture Agent Output',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'}
            }
        }
    },

    'code-architect': {
        'input': {
            'title': 'Code Architect Input',
            'required': ['architecture', 'team_skills'],
            'properties': {
                'architecture': {'type': 'object'},
                'team_skills': {'type': 'array', 'items': {'type': 'string'}},
                'coding_standards': {'type': 'object'}
            }
        },
        'output': {
            'title': 'Code Architect Output',
            'required': ['code_structure'],
            'properties': {
                'code_structure': {'type': 'object'}
            }
        }
    },

    'devops-specialist': {
        'input': {
            'title': 'DevOps Specialist Input',
            'required': ['architecture', 'requirements'],
            'properties': {
                'architecture': {'type': 'object'},
                'requirements': {'type': 'object'},
                'deployment_target': {'type': 'string'},
                'ci_cd_preference': {'type': 'string'}
            }
        },
        'output': {
            'title': 'DevOps Specialist Output',
            'required': ['devops_plan'],
            'properties': {
                'devops_plan': {'type': 'object'}
            }
        }
    },

    # TIER 2: ARCHITECTURE (8)
    'azure-principal-architect': {
        'input': {
            'title': 'Azure Principal Architect Input',
            'required': ['requirements', 'project_context'],
            'properties': {
                'requirements': {'type': 'object'},
                'project_context': {'type': 'object'},
                'workload_characteristics': {'type': 'object'}
            }
        },
        'output': {
            'title': 'Azure Principal Architect Output',
            'required': ['assessment', 'recommendations'],
            'properties': {
                'assessment': {'type': 'object'},
                'recommendations': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'aws-architect': {
        'input': {
            'title': 'AWS Architect Input',
            'required': ['requirements'],
            'properties': {
                'requirements': {'type': 'object'},
                'aws_regions': {'type': 'array', 'items': {'type': 'string'}},
                'workload_type': {'type': 'string'}
            }
        },
        'output': {
            'title': 'AWS Architect Output',
            'required': ['architecture', 'cost_estimate'],
            'properties': {
                'architecture': {'type': 'object'},
                'cost_estimate': {'type': 'object'}
            }
        }
    },

    'gcp-architect': {
        'input': {
            'title': 'GCP Architect Input',
            'required': ['requirements'],
            'properties': {
                'requirements': {'type': 'object'},
                'gcp_regions': {'type': 'array', 'items': {'type': 'string'}}
            }
        },
        'output': {
            'title': 'GCP Architect Output',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'}
            }
        }
    },

    'bicep-plan': {
        'input': {
            'title': 'Bicep Plan Agent Input',
            'required': ['azure_architecture'],
            'properties': {
                'azure_architecture': {'type': 'object'},
                'resource_naming_convention': {'type': 'string'},
                'parameter_strategy': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Bicep Plan Agent Output',
            'required': ['bicep_plan'],
            'properties': {
                'bicep_plan': {'type': 'object'}
            }
        }
    },

    'terraform-plan': {
        'input': {
            'title': 'Terraform Plan Agent Input',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'},
                'cloud_provider': {'type': 'string'},
                'state_management': {'type': 'object'}
            }
        },
        'output': {
            'title': 'Terraform Plan Agent Output',
            'required': ['terraform_plan'],
            'properties': {
                'terraform_plan': {'type': 'object'}
            }
        }
    },

    'database-specialist': {
        'input': {
            'title': 'Database Specialist Input',
            'required': ['requirements'],
            'properties': {
                'requirements': {'type': 'object'},
                'data_volume': {'type': 'object'},
                'performance_requirements': {'type': 'object'}
            }
        },
        'output': {
            'title': 'Database Specialist Output',
            'required': ['database_design'],
            'properties': {
                'database_design': {'type': 'object'}
            }
        }
    },

    'diagram-generator': {
        'input': {
            'title': 'Diagram Generator Input',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'},
                'diagram_types': {'type': 'array', 'items': {'type': 'string'}},
                'tool_preference': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Diagram Generator Output',
            'required': ['diagrams'],
            'properties': {
                'diagrams': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'adr-generator': {
        'input': {
            'title': 'ADR Generator Input',
            'required': ['decisions'],
            'properties': {
                'decisions': {'type': 'array', 'items': {'type': 'object'}},
                'format': {'type': 'string'}
            }
        },
        'output': {
            'title': 'ADR Generator Output',
            'required': ['adrs'],
            'properties': {
                'adrs': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    # TIER 3: IMPLEMENTATION - FRONTEND (5)
    'react-specialist': {
        'input': {
            'title': 'React Specialist Input',
            'required': ['requirements', 'component_specs'],
            'properties': {
                'requirements': {'type': 'object'},
                'component_specs': {'type': 'array', 'items': {'type': 'object'}},
                'styling_framework': {'type': 'string'},
                'state_management': {'type': 'string'}
            }
        },
        'output': {
            'title': 'React Specialist Output',
            'required': ['components', 'files_created'],
            'properties': {
                'components': {'type': 'array', 'items': {'type': 'object'}},
                'files_created': {'type': 'array', 'items': {'type': 'string'}}
            }
        }
    },

    'vue-specialist': {
        'input': {
            'title': 'Vue Specialist Input',
            'required': ['requirements'],
            'properties': {
                'requirements': {'type': 'object'},
                'vue_version': {'type': 'string'},
                'build_tool': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Vue Specialist Output',
            'required': ['components'],
            'properties': {
                'components': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'angular-specialist': {
        'input': {
            'title': 'Angular Specialist Input',
            'required': ['requirements'],
            'properties': {
                'requirements': {'type': 'object'},
                'angular_version': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Angular Specialist Output',
            'required': ['modules'],
            'properties': {
                'modules': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'typescript-specialist': {
        'input': {
            'title': 'TypeScript Specialist Input',
            'required': ['requirements'],
            'properties': {
                'requirements': {'type': 'object'},
                'strict_mode': {'type': 'boolean'}
            }
        },
        'output': {
            'title': 'TypeScript Specialist Output',
            'required': ['files'],
            'properties': {
                'files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'css-specialist': {
        'input': {
            'title': 'CSS Specialist Input',
            'required': ['design_system'],
            'properties': {
                'design_system': {'type': 'object'},
                'responsive_breakpoints': {'type': 'array', 'items': {'type': 'string'}},
                'preprocessor': {'type': 'string'}
            }
        },
        'output': {
            'title': 'CSS Specialist Output',
            'required': ['stylesheets'],
            'properties': {
                'stylesheets': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    # TIER 3: IMPLEMENTATION - BACKEND (6)
    'dotnet-specialist': {
        'input': {
            'title': '.NET Specialist Input',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'},
                'dotnet_version': {'type': 'string'},
                'framework': {'type': 'string'}
            }
        },
        'output': {
            'title': '.NET Specialist Output',
            'required': ['files'],
            'properties': {
                'files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'python-specialist': {
        'input': {
            'title': 'Python Specialist Input',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'},
                'python_version': {'type': 'string'},
                'framework': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Python Specialist Output',
            'required': ['files'],
            'properties': {
                'files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'java-specialist': {
        'input': {
            'title': 'Java Specialist Input',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'},
                'java_version': {'type': 'string'},
                'framework': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Java Specialist Output',
            'required': ['files'],
            'properties': {
                'files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'nodejs-specialist': {
        'input': {
            'title': 'Node.js Specialist Input',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'},
                'node_version': {'type': 'string'},
                'framework': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Node.js Specialist Output',
            'required': ['files'],
            'properties': {
                'files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'golang-specialist': {
        'input': {
            'title': 'Go Specialist Input',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'},
                'go_version': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Go Specialist Output',
            'required': ['files'],
            'properties': {
                'files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'api-specialist': {
        'input': {
            'title': 'API Specialist Input',
            'required': ['architecture'],
            'properties': {
                'architecture': {'type': 'object'},
                'api_style': {'type': 'string'},
                'documentation_format': {'type': 'string'}
            }
        },
        'output': {
            'title': 'API Specialist Output',
            'required': ['specifications'],
            'properties': {
                'specifications': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    # TIER 3: IMPLEMENTATION - INFRASTRUCTURE (6)
    'docker-specialist': {
        'input': {
            'title': 'Docker Specialist Input',
            'required': ['services'],
            'properties': {
                'services': {'type': 'array', 'items': {'type': 'object'}},
                'registry': {'type': 'string'},
                'base_images': {'type': 'array', 'items': {'type': 'string'}}
            }
        },
        'output': {
            'title': 'Docker Specialist Output',
            'required': ['files'],
            'properties': {
                'files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'kubernetes-specialist': {
        'input': {
            'title': 'Kubernetes Specialist Input',
            'required': ['services'],
            'properties': {
                'services': {'type': 'array', 'items': {'type': 'object'}},
                'cluster_config': {'type': 'object'},
                'namespace': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Kubernetes Specialist Output',
            'required': ['manifests'],
            'properties': {
                'manifests': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'bicep-implement': {
        'input': {
            'title': 'Bicep Implement Agent Input',
            'required': ['plan'],
            'properties': {
                'plan': {'type': 'object'},
                'azure_services': {'type': 'array', 'items': {'type': 'string'}}
            }
        },
        'output': {
            'title': 'Bicep Implement Agent Output',
            'required': ['files'],
            'properties': {
                'files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'terraform-implement': {
        'input': {
            'title': 'Terraform Implement Agent Input',
            'required': ['plan'],
            'properties': {
                'plan': {'type': 'object'},
                'cloud_provider': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Terraform Implement Agent Output',
            'required': ['files'],
            'properties': {
                'files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'ci-cd-specialist': {
        'input': {
            'title': 'CI/CD Specialist Input',
            'required': ['repository_info'],
            'properties': {
                'repository_info': {'type': 'object'},
                'pipeline_platform': {'type': 'string'},
                'stages': {'type': 'array', 'items': {'type': 'string'}}
            }
        },
        'output': {
            'title': 'CI/CD Specialist Output',
            'required': ['pipeline_files'],
            'properties': {
                'pipeline_files': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'monitoring-specialist': {
        'input': {
            'title': 'Monitoring Specialist Input',
            'required': ['services'],
            'properties': {
                'services': {'type': 'array', 'items': {'type': 'string'}},
                'monitoring_tool': {'type': 'string'},
                'alert_rules': {'type': 'array', 'items': {'type': 'object'}}
            }
        },
        'output': {
            'title': 'Monitoring Specialist Output',
            'required': ['config'],
            'properties': {
                'config': {'type': 'object'}
            }
        }
    },

    # TIER 3: IMPLEMENTATION - DATABASE (4)
    'mysql-specialist': {
        'input': {
            'title': 'MySQL Specialist Input',
            'required': ['schema_design'],
            'properties': {
                'schema_design': {'type': 'object'},
                'version': {'type': 'string'},
                'collation': {'type': 'string'}
            }
        },
        'output': {
            'title': 'MySQL Specialist Output',
            'required': ['scripts'],
            'properties': {
                'scripts': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'postgres-specialist': {
        'input': {
            'title': 'PostgreSQL Specialist Input',
            'required': ['schema_design'],
            'properties': {
                'schema_design': {'type': 'object'},
                'version': {'type': 'string'},
                'extensions': {'type': 'array', 'items': {'type': 'string'}}
            }
        },
        'output': {
            'title': 'PostgreSQL Specialist Output',
            'required': ['scripts'],
            'properties': {
                'scripts': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'mongodb-specialist': {
        'input': {
            'title': 'MongoDB Specialist Input',
            'required': ['schema_design'],
            'properties': {
                'schema_design': {'type': 'object'},
                'replica_set': {'type': 'boolean'},
                'sharding_strategy': {'type': 'string'}
            }
        },
        'output': {
            'title': 'MongoDB Specialist Output',
            'required': ['collections'],
            'properties': {
                'collections': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    },

    'data-migration-specialist': {
        'input': {
            'title': 'Data Migration Specialist Input',
            'required': ['source_schema', 'target_schema'],
            'properties': {
                'source_schema': {'type': 'object'},
                'target_schema': {'type': 'object'},
                'migration_strategy': {'type': 'string'}
            }
        },
        'output': {
            'title': 'Data Migration Specialist Output',
            'required': ['migration_scripts'],
            'properties': {
                'migration_scripts': {'type': 'array', 'items': {'type': 'object'}}
            }
        }
    }
}

def generate_schema_file(agent_id, schema_type, schema):
    """Generate a complete schema file content"""
    full_schema = {
        '$schema': 'https://json-schema.org/draft/2020-12/schema',
        '$id': f'https://agenticcoder.com/schemas/agents/{agent_id}.{schema_type}.schema.json',
        'type': 'object',
        **schema
    }
    return json.dumps(full_schema, indent=2)

# Write all schema files
count = 0
for agent_id, schemas in agent_schemas.items():
    # Input schema
    input_path = schemas_dir / f'{agent_id}.input.schema.json'
    input_content = generate_schema_file(agent_id, 'input', schemas['input'])
    input_path.write_text(input_content)
    print(f'✓ Created {agent_id}.input.schema.json')
    count += 1

    # Output schema
    output_path = schemas_dir / f'{agent_id}.output.schema.json'
    output_content = generate_schema_file(agent_id, 'output', schemas['output'])
    output_path.write_text(output_content)
    print(f'✓ Created {agent_id}.output.schema.json')
    count += 1

print(f'\n✓ Generated {count} schema files ({len(agent_schemas)} agents × 2)')
print(f'✓ Location: {schemas_dir}')
