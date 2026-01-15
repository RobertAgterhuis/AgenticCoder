/**
 * UnifiedWorkflow.js
 * 
 * Unified 12-Phase Workflow Engine for AgenticCoder Platform v1.0
 * 
 * DESIGN RATIONALE:
 * This module merges two workflows:
 * 1. Azure Agentic InfraOps 7-step workflow (Infrastructure Automation)
 * 2. ProjectPlan Template 15-phase workflow (Software Development Lifecycle)
 * 
 * RESULT: 12 distinct phases that cover complete project lifecycle
 * from discovery through deployment and as-built documentation.
 * 
 * PHASE STRUCTURE:
 * - Phases 0-1: Discovery & Requirements (User-driven)
 * - Phases 2-4: Assessment & Planning (Auto + user approval)
 * - Phase 5: Code Generation (Auto, high-complexity)
 * - Phase 6: Deployment (Auto + user confirmation)
 * - Phases 7-8: Validation & Documentation (Auto)
 * - Phases 9-11: Operations & Extensions (Orchestration tier)
 */

'use strict';

/**
 * PHASE DEFINITIONS
 * ==================
 * 
 * Complete specification of all 12 phases including:
 * - Purpose and description
 * - Input requirements
 * - Expected outputs
 * - Success criteria
 * - Agents involved
 * - Transitions to next phases
 * - Estimated duration
 * - Cost and resource implications
 */
const phases = {
  /**
   * PHASE 0: PROJECT DISCOVERY & PLANNING
   * ======================================
   * 
   * PURPOSE: Capture user's project vision, technical requirements, constraints
   * TYPE: User-Driven with Agent Support
   * 
   * This is the foundational phase where users define what they want to build.
   * Agents ask adaptive questions based on project type and gather all necessary
   * context for downstream phases.
   * 
   * FLOW:
   * 1. User invokes: /generate-project
   * 2. project-plan-generator asks 22 adaptive discovery questions
   * 3. Agents generate ProjectPlan/ with 50+ documents
   * 4. User reviews and approves plan
   */
  0: {
    name: 'Project Discovery & Planning',
    description: 'Capture project vision, technical requirements, constraints, and team context',
    type: 'user_driven',
    agents: [
      'project-plan-generator',  // Orchestrator - asks 22 questions
      'doc-writer',              // Context & architecture docs
      'backlog-strategist',      // Epics, stories, NFRs, risks
      'implementation-coordinator', // Phases, timelines, checklists
      'qa-validator'             // Testing strategy, compliance gates
    ],
    skills_required: [
      'project-structure',
      'tech-stack',
      'compliance'
    ],
    input_requirements: {
      user_input: 'Project name, organization, high-level description',
      discovery_questions: 22,
      adaptive: true
    },
    expected_outputs: {
      artifacts: [
        'ProjectPlan/README.md',
        'ProjectPlan/00-DISCOVERY.md',
        'ProjectPlan/01-REQUIREMENTS.md',
        'ProjectPlan/02-CONTEXT-ARCHITECTURE.md',
        'ProjectPlan/03-BACKLOG.md',
        'ProjectPlan/04-TIMELINE.md',
        'ProjectPlan/05-PHASES.md'
      ],
      document_count: '50+',
      document_types: [
        'Requirements',
        'Architecture overview',
        'Epics and user stories',
        'Risk register',
        'Timeline and milestones',
        'Phase breakdown',
        'Compliance checklist'
      ]
    },
    success_criteria: {
      user_approval: 'User reviews and approves ProjectPlan',
      completeness: 'All 50+ documents generated',
      clarity: 'Requirements clear enough for Phase 1',
      alignment: 'Team understands project vision'
    },
    transitions: {
      approval: 'PHASE_1',
      rejection: 'PHASE_0'  // Revise and re-plan
    },
    estimated_duration_minutes: 30,
    user_approval_required: true,
    approval_gate: 'Project Plan Approval',
    dependencies: [],
    predecessor_phases: [],
    successor_phases: [1]
  },

  /**
   * PHASE 1: INFRASTRUCTURE REQUIREMENTS & DISCOVERY
   * =================================================
   * 
   * PURPOSE: Collect specific infrastructure requirements for Azure/cloud deployment
   * TYPE: User-Driven with Agent Support
   * SOURCE: Azure Agentic InfraOps Step 1
   * 
   * User provides infrastructure-specific requirements built on the foundation
   * from Phase 0. This is the "what do you want to deploy?" phase.
   * 
   * FLOW:
   * 1. User invokes: /plan-infrastructure
   * 2. Built-in @plan agent captures infrastructure requirements
   * 3. Output: 01-requirements.md
   * 4. User reviews requirements
   */
  1: {
    name: 'Infrastructure Requirements Discovery',
    description: 'Capture infrastructure-specific requirements (Azure resources, networking, compliance)',
    type: 'user_driven',
    agents: [
      '@plan'  // Built-in VS Code agent for capturing requirements
    ],
    skills_required: [],
    input_requirements: {
      user_input: 'Infrastructure requirements (resources, networking, security, compliance)',
      project_context: 'From Phase 0 ProjectPlan',
      format: 'Conversational Q&A'
    },
    expected_outputs: {
      artifacts: [
        '01-requirements.md'
      ],
      content: [
        'Functional requirements (FR-XXX)',
        'Non-functional requirements (NFR-XXX)',
        'Constraints and compliance',
        'Resource specifications',
        'Networking requirements',
        'Security requirements',
        'Data residency requirements'
      ]
    },
    success_criteria: {
      user_approval: 'User confirms requirements are correct',
      completeness: 'All key infrastructure aspects documented',
      clarity: 'Requirements specific and measurable'
    },
    transitions: {
      approval: 'PHASE_2',
      revision: 'PHASE_1'
    },
    estimated_duration_minutes: 10,
    user_approval_required: true,
    approval_gate: 'Infrastructure Requirements Approval',
    dependencies: ['PHASE_0'],
    predecessor_phases: [0],
    successor_phases: [2]
  },

  /**
   * PHASE 2: ARCHITECTURE ASSESSMENT & VALIDATION
   * ==============================================
   * 
   * PURPOSE: Validate requirements against Azure best practices and estimate costs
   * TYPE: Automated with Review Approval
   * SOURCE: Azure Agentic InfraOps Step 2
   * 
   * Azure Principal Architect agent analyzes requirements using Well-Architected
   * Framework (WAF) and provides cost estimates using Azure Pricing API.
   * 
   * FLOW:
   * 1. azure-principal-architect analyzes requirements
   * 2. Generates WAF assessment (Security, Reliability, Performance, Cost, Operations)
   * 3. Estimates monthly/yearly costs
   * 4. Generates architecture diagrams (optional)
   * 5. User reviews and approves
   */
  2: {
    name: 'Architecture Assessment & Cost Estimation',
    description: 'Validate architecture against WAF, estimate costs, assess compliance fit',
    type: 'automated',
    agents: [
      'azure-principal-architect',  // WAF assessment + cost estimation
      'diagram-generator'           // Optional: architecture diagrams
    ],
    skills_required: [
      'azure-infrastructure',
      'cloud-cost-optimization'
    ],
    input_requirements: {
      artifact: '01-requirements.md',
      context: 'Project vision from Phase 0',
      budget: 'From discovery questions'
    },
    expected_outputs: {
      artifacts: [
        '02-architecture-assessment.md',
        '02-cost-estimate.md',
        '03-des-diagram.py',     // Optional
        '03-des-diagram.png'     // Optional
      ],
      content: [
        'WAF pillar scores (Security, Reliability, Performance, Cost, Operations)',
        'Findings and recommendations per pillar',
        'Monthly/yearly cost estimates',
        'Cost breakdown by service',
        'Region and SKU recommendations',
        'Risk analysis',
        'Architecture diagram (optional)'
      ]
    },
    success_criteria: {
      waf_assessment: 'All 5 pillars assessed',
      cost_accuracy: 'Estimates within ±10% of real costs',
      compliance: 'Architecture aligns with stated requirements',
      feasibility: 'Within project budget constraints'
    },
    transitions: {
      approval: 'PHASE_3',
      major_changes_needed: 'PHASE_1',  // Back to requirements
      cost_too_high: 'PHASE_2'  // Re-assess
    },
    estimated_duration_minutes: 20,
    user_approval_required: true,
    approval_gate: 'Architecture Assessment Approval',
    dependencies: ['PHASE_1'],
    predecessor_phases: [1],
    successor_phases: [3],
    mcp_servers: [
      'azure-pricing-mcp',
      'azure-resource-graph-mcp'
    ]
  },

  /**
   * PHASE 3: IMPLEMENTATION PLANNING & GOVERNANCE
   * =============================================
   * 
   * PURPOSE: Create detailed implementation plan with governance constraints
   * TYPE: Automated with Review Approval
   * SOURCE: Azure Agentic InfraOps Step 3
   * 
   * bicep-plan agent creates step-by-step implementation plan, identifies
   * Azure Policy constraints, documents governance requirements.
   * 
   * FLOW:
   * 1. bicep-plan queries Azure Resource Graph for policy assignments
   * 2. Maps governance constraints to implementation plan
   * 3. Creates phased implementation strategy
   * 4. Documents cost estimates aligned with phases
   * 5. User reviews and approves
   */
  3: {
    name: 'Implementation Planning & Governance Discovery',
    description: 'Create detailed implementation plan, discover governance constraints, refine costs',
    type: 'automated',
    agents: [
      'bicep-plan'  // Planning + governance discovery
    ],
    skills_required: [
      'azure-infrastructure',
      'iac-baseline'
    ],
    input_requirements: {
      artifact: '02-architecture-assessment.md',
      azure_context: 'Subscription, resource groups, policies',
      compliance_requirements: 'From requirements phase'
    },
    expected_outputs: {
      artifacts: [
        '04-implementation-plan.md',
        '04-governance-constraints.md',
        '04-governance-constraints.json',
        '04-refined-cost-estimate.md'
      ],
      content: [
        'Step-by-step implementation phases (typically 3-5 phases)',
        'Azure Policy constraints discovered',
        'Compliance alignment mapping',
        'Resource dependency diagram',
        'Deployment prerequisites',
        'Refined cost estimate (per phase)',
        'Risk mitigation strategies'
      ]
    },
    success_criteria: {
      planning_complete: 'All implementation steps documented',
      governance_aligned: 'All constraints documented and mapped',
      risk_aware: 'Risks identified and mitigated',
      cost_aligned: 'Phased costs align with budget'
    },
    transitions: {
      approval: 'PHASE_4',
      replan_needed: 'PHASE_3',
      governance_conflict: 'ESCALATION'  // Manual resolution
    },
    estimated_duration_minutes: 15,
    user_approval_required: true,
    approval_gate: 'Implementation Plan Approval',
    dependencies: ['PHASE_2'],
    predecessor_phases: [2],
    successor_phases: [4],
    mcp_servers: [
      'azure-resource-graph-mcp'
    ]
  },

  /**
   * PHASE 4: CODE GENERATION (BICEP)
   * ================================
   * 
   * PURPOSE: Generate production-ready Bicep infrastructure-as-code templates
   * TYPE: Automated with Validation Gates
   * SOURCE: Azure Agentic InfraOps Step 4
   * 
   * bicep-implement agent generates Bicep templates from plan, validates syntax,
   * applies security scanning, enforces WAF best practices.
   * 
   * FLOW:
   * 1. bicep-implement generates Bicep templates
   * 2. Runs: bicep build, bicep lint, security scan
   * 3. Validates against Azure Verified Modules (AVM)
   * 4. Applies Cloud Adoption Framework (CAF) naming
   * 5. Generates deploy.ps1 with validation gates
   * 6. User reviews code
   */
  4: {
    name: 'Infrastructure Code Generation',
    description: 'Generate Bicep templates, validate syntax, apply security scanning and best practices',
    type: 'automated',
    agents: [
      'bicep-implement'  // Code generation with validation
    ],
    skills_required: [
      'azure-infrastructure',
      'iac-baseline'
    ],
    input_requirements: {
      artifact: '04-implementation-plan.md',
      governance: '04-governance-constraints.json'
    },
    expected_outputs: {
      artifacts: [
        'infra/bicep/{project}/main.bicep',
        'infra/bicep/{project}/modules/*.bicep',
        'infra/bicep/{project}/parameters.json',
        'infra/bicep/{project}/deploy.ps1',
        '05-implementation-reference.md'
      ],
      validation_results: [
        'bicep build results',
        'bicep lint results',
        'security scan results',
        'AVM compliance check',
        'CAF naming validation'
      ]
    },
    success_criteria: {
      syntax_valid: 'bicep build passes',
      lint_clean: 'bicep lint passes',
      security_scan: 'No critical or high-severity issues',
      avm_compliant: 'Uses AVM patterns where applicable',
      waf_aligned: 'Enforces WAF best practices'
    },
    transitions: {
      validation_passes: 'PHASE_5',
      syntax_errors: 'PHASE_4',  // Fix and regenerate
      security_issues: 'PHASE_4' // Mitigate and regenerate
    },
    estimated_duration_minutes: 20,
    user_approval_required: true,
    approval_gate: 'Code Review & Approval',
    auto_validation_gates: [
      'bicep build',
      'bicep lint',
      'security scan',
      'AVM compliance',
      'CAF naming'
    ],
    dependencies: ['PHASE_3'],
    predecessor_phases: [3],
    successor_phases: [5]
  },

  /**
   * PHASE 5: DEPLOYMENT TO AZURE
   * ============================
   * 
   * PURPOSE: Deploy generated Bicep templates to Azure subscription
   * TYPE: Automated with User Confirmation
   * SOURCE: Azure Agentic InfraOps Step 5
   * 
   * deploy-coordinator validates credentials, runs what-if analysis,
   * executes deployment, collects resource IDs, generates deployment summary.
   * 
   * FLOW:
   * 1. Validate Azure CLI authentication and permissions
   * 2. Run: az deployment group what-if
   * 3. Show change summary to user
   * 4. User confirms deployment
   * 5. Execute: az deployment group create
   * 6. Monitor deployment progress
   * 7. Collect deployed resource IDs
   * 8. Generate deployment summary
   */
  5: {
    name: 'Azure Deployment & Validation',
    description: 'Deploy Bicep templates to Azure, validate deployment, collect resource inventory',
    type: 'automated',
    agents: [
      'deploy-coordinator'  // Deployment orchestration
    ],
    skills_required: [
      'azure-infrastructure'
    ],
    input_requirements: {
      artifact: '05-implementation-reference.md',
      bicep_templates: 'infra/bicep/{project}/',
      azure_credentials: 'az account (must be authenticated)',
      user_confirmation: 'After what-if analysis'
    },
    expected_outputs: {
      artifacts: [
        '06-deployment-summary.md',
        'resource-inventory.json',
        'deployment-outputs.json'
      ],
      content: [
        'Deployment status (success/partial/failed)',
        'Deployed resource list with IDs',
        'Endpoints and connection strings',
        'Deployment timing',
        'Resource group information',
        'Cost realization (actual vs estimated)'
      ]
    },
    success_criteria: {
      auth_valid: 'Azure CLI authenticated with sufficient permissions',
      whatif_reviewed: 'User reviews and confirms what-if output',
      deployment_success: 'Deployment reaches Succeeded state',
      resources_inventory: 'All expected resources deployed',
      connectivity: 'Endpoints accessible and functional'
    },
    transitions: {
      deployment_success: 'PHASE_6',
      deployment_failed: 'ESCALATION',  // Manual troubleshooting
      user_rejects: 'ROLLBACK'  // Delete resources
    },
    estimated_duration_minutes: 10-20,  // Depends on complexity
    user_approval_required: true,
    approval_gate: 'What-If Confirmation & Deployment Authorization',
    pre_deployment_checks: [
      'Azure CLI authentication',
      'Subscription validation',
      'Permissions check',
      'Resource group existence'
    ],
    post_deployment_validation: [
      'Resource group state',
      'Resource health checks',
      'Network connectivity',
      'Endpoint accessibility'
    ],
    dependencies: ['PHASE_4'],
    predecessor_phases: [4],
    successor_phases: [6]
  },

  /**
   * PHASE 6: POST-DEPLOYMENT VALIDATION & OPTIMIZATION
   * ==================================================
   * 
   * PURPOSE: Validate deployed infrastructure, optimize costs and performance
   * TYPE: Automated
   * 
   * After successful deployment, validate that all resources are correctly
   * configured, perform cost optimization analysis, and document optimization
   * recommendations.
   * 
   * FLOW:
   * 1. Validate resource health and connectivity
   * 2. Run cost optimization analysis
   * 3. Generate optimization recommendations
   * 4. Document as-built architecture
   * 5. Create operational runbooks
   */
  6: {
    name: 'Post-Deployment Validation & Optimization',
    description: 'Validate deployed resources, optimize costs, generate operational runbooks',
    type: 'automated',
    agents: [
      'workload-documentation-generator'  // As-built docs + runbooks
    ],
    skills_required: [
      'azure-infrastructure',
      'cloud-cost-optimization'
    ],
    input_requirements: {
      artifact: '06-deployment-summary.md',
      deployed_resources: 'From Phase 5'
    },
    expected_outputs: {
      artifacts: [
        '07-workload-documentation.md',
        '07-as-built-diagram.py',
        '07-optimization-recommendations.md',
        '07-operational-runbook.md'
      ],
      content: [
        'As-built architecture diagram',
        'Resource inventory with details',
        'Cost optimization recommendations',
        'Performance analysis',
        'Operational procedures',
        'Troubleshooting guide',
        'Monitoring setup'
      ]
    },
    success_criteria: {
      validation_complete: 'All resources validated',
      documentation_complete: 'As-built architecture documented',
      optimization_analyzed: 'Cost optimization opportunities identified',
      operations_ready: 'Operational runbooks created'
    },
    transitions: {
      validation_passed: 'PHASE_7',
      issues_found: 'ESCALATION'
    },
    estimated_duration_minutes: 15,
    user_approval_required: false,
    dependencies: ['PHASE_5'],
    predecessor_phases: [5],
    successor_phases: [7],
    mcp_servers: [
      'azure-pricing-mcp',
      'azure-resource-graph-mcp'
    ]
  },

  /**
   * PHASE 7: INTEGRATION WITH PROJECT IMPLEMENTATION
   * ================================================
   * 
   * PURPOSE: Hand off deployed infrastructure to project implementation teams
   * TYPE: Coordination / Integration
   * 
   * Bridge between infrastructure automation (Phases 0-6) and project software
   * implementation (Phases 8-11). Infrastructure is now ready for application
   * deployment.
   * 
   * FLOW:
   * 1. Compile infrastructure handoff document
   * 2. Generate connection strings for developers
   * 3. Create environment configuration
   * 4. Set up monitoring and logging
   * 5. Notify implementation teams
   */
  7: {
    name: 'Infrastructure-to-Application Handoff',
    description: 'Prepare infrastructure for application deployment, generate connection strings and configs',
    type: 'coordination',
    agents: [
      'implementation-coordinator'  // Handoff coordination
    ],
    skills_required: [
      'azure-infrastructure',
      'project-structure'
    ],
    input_requirements: {
      artifact: '07-workload-documentation.md',
      deployed_resources: 'Inventory from Phase 5'
    },
    expected_outputs: {
      artifacts: [
        '08-infrastructure-handoff.md',
        'environment-config/.env',
        'environment-config/appsettings.json',
        'connection-strings.md'
      ],
      content: [
        'Infrastructure overview',
        'Connection strings (masked)',
        'Environment variables',
        'Application configuration',
        'Monitoring setup instructions',
        'Logging configuration',
        'Alert rules'
      ]
    },
    success_criteria: {
      configs_generated: 'Environment configs created',
      connections_validated: 'Connection strings tested',
      team_notified: 'Implementation team has infrastructure ready',
      monitoring_active: 'Monitoring and logging operational'
    },
    transitions: {
      handoff_complete: 'PHASE_8',
      config_issues: 'PHASE_7'
    },
    estimated_duration_minutes: 10,
    user_approval_required: false,
    dependencies: ['PHASE_6'],
    predecessor_phases: [6],
    successor_phases: [8]
  },

  /**
   * PHASE 8: APPLICATION CODE GENERATION & SETUP
   * ============================================
   * 
   * PURPOSE: Generate application skeleton and project structure
   * TYPE: Automated
   * 
   * Using project plan from Phase 0 and technology stack decisions,
   * generate application skeleton, folder structure, CI/CD setup.
   * 
   * FLOW:
   * 1. Generate application folder structure
   * 2. Create technology-specific skeletons (backend, frontend, API)
   * 3. Set up CI/CD pipelines
   * 4. Initialize code repositories
   * 5. Generate development environment config
   */
  8: {
    name: 'Application Architecture & Code Generation',
    description: 'Generate application skeleton, folder structure, and CI/CD baseline',
    type: 'automated',
    agents: [
      'implementation-coordinator',  // Architecture setup
      'cicd-engineer',              // CI/CD pipeline generation
      'frontend-wireframe'          // Frontend wireframes
    ],
    skills_required: [
      'project-structure',
      'tech-stack',
      'cicd-pipeline',
      'backend-skeleton',
      'frontend-starter'
    ],
    input_requirements: {
      artifact: 'ProjectPlan/02-CONTEXT-ARCHITECTURE.md',
      tech_stack: 'From Phase 0 discovery',
      project_structure: 'Standard template'
    },
    expected_outputs: {
      artifacts: [
        'src/ folder with language-specific structure',
        'tests/ folder with test templates',
        'docs/ folder with development guides',
        '.github/workflows/ with CI/CD pipelines',
        'docker-compose.yml for local development',
        '.env.example',
        'development-setup.md'
      ]
    },
    success_criteria: {
      structure_created: 'All expected folders created',
      skeletons_generated: 'Technology-specific skeletons in place',
      cicd_baseline: 'CI/CD workflows functional',
      dev_ready: 'Developers can clone and start coding'
    },
    transitions: {
      generation_complete: 'PHASE_9',
      architecture_issues: 'PHASE_8'
    },
    estimated_duration_minutes: 15,
    user_approval_required: false,
    dependencies: ['PHASE_7'],
    predecessor_phases: [7],
    successor_phases: [9]
  },

  /**
   * PHASE 9: IMPLEMENTATION TRACKING & REPORTING
   * ===========================================
   * 
   * PURPOSE: Set up progress tracking, reporting dashboards, and risk management
   * TYPE: Coordination
   * 
   * Initialize project management tooling, create dashboards for tracking
   * progress against timeline and budget, establish risk register monitoring.
   * 
   * FLOW:
   * 1. Set up project management tool
   * 2. Create dashboard for progress tracking
   * 3. Initialize risk register monitoring
   * 4. Set up stakeholder reporting cadence
   * 5. Create budget tracking spreadsheets
   */
  9: {
    name: 'Project Tracking & Governance Setup',
    description: 'Initialize project tracking, dashboards, risk management, and reporting',
    type: 'coordination',
    agents: [
      'reporter',                  // Progress tracking setup
      'implementation-coordinator',  // Timeline tracking
      'backlog-strategist'        // Risk register monitoring
    ],
    skills_required: [
      'project-structure',
      'compliance'
    ],
    input_requirements: {
      artifact: 'ProjectPlan/04-TIMELINE.md',
      risks: 'ProjectPlan/03-BACKLOG.md (risk section)'
    },
    expected_outputs: {
      artifacts: [
        'docs/PROJECT-DASHBOARD.md',
        'docs/RISK-REGISTER.md',
        'docs/STAKEHOLDER-REPORTS.md',
        'budget-tracking.xlsx'
      ]
    },
    success_criteria: {
      tracking_setup: 'Progress tracking tool initialized',
      dashboards_active: 'Real-time dashboards operational',
      risks_tracked: 'Risk register monitoring active',
      reporting_ready: 'Stakeholder reports scheduled'
    },
    transitions: {
      setup_complete: 'PHASE_10',
      tool_issues: 'PHASE_9'
    },
    estimated_duration_minutes: 10,
    user_approval_required: false,
    dependencies: ['PHASE_8'],
    predecessor_phases: [8],
    successor_phases: [10]
  },

  /**
   * PHASE 10: TESTING FRAMEWORK SETUP
   * ================================
   * 
   * PURPOSE: Initialize testing infrastructure and quality assurance frameworks
   * TYPE: Automated
   * 
   * Set up unit testing, integration testing, end-to-end testing frameworks,
   * code coverage tracking, security scanning in CI/CD.
   * 
   * FLOW:
   * 1. Set up unit test framework
   * 2. Initialize integration test setup
   * 3. Configure end-to-end testing
   * 4. Set up code coverage tracking
   * 5. Initialize security scanning
   */
  10: {
    name: 'Quality Assurance & Testing Framework',
    description: 'Initialize testing frameworks, code coverage, security scanning',
    type: 'automated',
    agents: [
      'qa-validator'              // Testing strategy implementation
    ],
    skills_required: [
      'compliance',
      'project-structure'
    ],
    input_requirements: {
      artifact: 'ProjectPlan/05-PHASES.md',
      testing_strategy: 'From Phase 0 (qa-validator output)'
    },
    expected_outputs: {
      artifacts: [
        'tests/ with test templates',
        '.github/workflows/test.yml',
        'coverage-config.yml',
        'docs/TESTING-GUIDE.md',
        'security-scanning-rules.yml'
      ]
    },
    success_criteria: {
      frameworks_setup: 'Test frameworks initialized',
      coverage_tracking: 'Code coverage tracking active',
      security_scans: 'Security scanning in CI/CD pipeline',
      documentation: 'Testing guide for developers'
    },
    transitions: {
      setup_complete: 'PHASE_11',
      framework_issues: 'PHASE_10'
    },
    estimated_duration_minutes: 10,
    user_approval_required: false,
    dependencies: ['PHASE_8'],
    predecessor_phases: [8],
    successor_phases: [11]
  },

  /**
   * PHASE 11: DOCUMENTATION & KNOWLEDGE TRANSFER
   * ============================================
   * 
   * PURPOSE: Complete all project documentation and enable knowledge transfer
   * TYPE: Finalization
   * 
   * Generate final documentation: API docs, deployment guides, troubleshooting,
   * knowledge base articles. Prepare for handoff to operations team.
   * 
   * FLOW:
   * 1. Generate API documentation
   * 2. Create deployment runbooks
   * 3. Write troubleshooting guides
   * 4. Create knowledge base articles
   * 5. Prepare team training materials
   */
  11: {
    name: 'Documentation & Knowledge Transfer',
    description: 'Complete project documentation, create runbooks, prepare for operations handoff',
    type: 'finalization',
    agents: [
      'doc-writer',               // Documentation generation
      'workload-documentation-generator'  // Operational docs
    ],
    skills_required: [
      'project-structure',
      'azure-infrastructure'
    ],
    input_requirements: {
      artifacts: [
        'All previous phase outputs',
        'Code from Phase 8',
        'Infrastructure from Phase 6'
      ]
    },
    expected_outputs: {
      artifacts: [
        'docs/API-REFERENCE.md',
        'docs/DEPLOYMENT-GUIDE.md',
        'docs/TROUBLESHOOTING.md',
        'docs/KNOWLEDGE-BASE/',
        'docs/TRAINING-MATERIALS.md',
        'CHANGELOG.md',
        'README.md'
      ]
    },
    success_criteria: {
      api_documented: 'API documentation complete',
      deployment_guide: 'Step-by-step deployment guide',
      troubleshooting: 'Common issues and solutions documented',
      knowledge_base: 'Team can resolve 80% of issues independently',
      training_ready: 'New team members can onboard in <2 hours'
    },
    transitions: {
      documentation_complete: 'PROJECT_COMPLETE',
      feedback_received: 'PHASE_11'  // Revise
    },
    estimated_duration_minutes: 20,
    user_approval_required: true,
    approval_gate: 'Final Documentation Review',
    dependencies: ['PHASE_8', 'PHASE_6'],
    predecessor_phases: [8, 6],
    successor_phases: []
  }
};

/**
 * PHASE STATE MACHINE
 * ===================
 * 
 * Defines the valid transitions between phases, including:
 * - Linear progression (typical path)
 * - Conditional branches (approval gates)
 * - Rollback paths (major changes needed)
 * - Parallel phases (where applicable)
 */
const stateTransitions = {
  // Phase 0: Discovery
  0: {
    on_approval: 1,
    on_rejection: 0,  // Revise and re-plan
    on_escalation: 'ESCALATION'
  },

  // Phase 1: Requirements
  1: {
    on_approval: 2,
    on_revision: 1,
    on_escalation: 'ESCALATION'
  },

  // Phase 2: Assessment
  2: {
    on_approval: 3,
    on_major_changes_needed: 1,  // Back to Phase 1
    on_cost_too_high: 2,  // Re-assess
    on_escalation: 'ESCALATION'
  },

  // Phase 3: Planning
  3: {
    on_approval: 4,
    on_replan_needed: 3,
    on_governance_conflict: 'ESCALATION',
    on_escalation: 'ESCALATION'
  },

  // Phase 4: Code Generation
  4: {
    on_validation_passes: 5,
    on_syntax_errors: 4,  // Fix and regenerate
    on_security_issues: 4,  // Mitigate and regenerate
    on_escalation: 'ESCALATION'
  },

  // Phase 5: Deployment
  5: {
    on_deployment_success: 6,
    on_deployment_failed: 'ESCALATION',
    on_user_rejects: 'ROLLBACK',
    on_escalation: 'ESCALATION'
  },

  // Phase 6: Validation
  6: {
    on_validation_passed: 7,
    on_issues_found: 'ESCALATION'
  },

  // Phase 7: Handoff
  7: {
    on_handoff_complete: 8,
    on_config_issues: 7
  },

  // Phase 8: Application Setup (can proceed to both 9 and 10 in parallel)
  8: {
    on_generation_complete: [9, 10],  // Parallel phases
    on_architecture_issues: 8
  },

  // Phase 9: Tracking
  9: {
    on_setup_complete: 11,
    on_tool_issues: 9
  },

  // Phase 10: Testing
  10: {
    on_setup_complete: 11,
    on_framework_issues: 10
  },

  // Phase 11: Documentation
  11: {
    on_documentation_complete: 'PROJECT_COMPLETE',
    on_feedback_received: 11  // Revise
  }
};

/**
 * PHASE VALIDATION RULES
 * =====================
 * 
 * Rules that determine whether a phase can be entered or must be skipped
 */
const phaseValidationRules = {
  0: { 
    required_context: ['project_name'],
    skip_if: [],
    timeout_minutes: 60
  },
  1: { 
    required_context: ['phase_0_complete', 'project_plan'],
    skip_if: [],
    timeout_minutes: 30
  },
  2: { 
    required_context: ['phase_1_complete', '01-requirements'],
    skip_if: [],
    timeout_minutes: 45
  },
  3: { 
    required_context: ['phase_2_complete', '02-assessment'],
    skip_if: [],
    timeout_minutes: 30
  },
  4: { 
    required_context: ['phase_3_complete', '04-plan'],
    skip_if: [],
    timeout_minutes: 45
  },
  5: { 
    required_context: ['phase_4_complete', 'bicep_templates'],
    skip_if: ['infrastructure_already_deployed'],
    timeout_minutes: 60
  },
  6: { 
    required_context: ['phase_5_complete', 'deployment_summary'],
    skip_if: [],
    timeout_minutes: 30
  },
  7: { 
    required_context: ['phase_6_complete'],
    skip_if: [],
    timeout_minutes: 20
  },
  8: { 
    required_context: ['phase_7_complete'],
    skip_if: ['application_already_scaffolded'],
    timeout_minutes: 30
  },
  9: { 
    required_context: ['phase_8_complete'],
    skip_if: [],
    timeout_minutes: 20
  },
  10: { 
    required_context: ['phase_8_complete'],
    skip_if: [],
    timeout_minutes: 20
  },
  11: { 
    required_context: ['phase_9_complete', 'phase_10_complete'],
    skip_if: [],
    timeout_minutes: 40
  }
};

/**
 * AGENT PHASE ASSIGNMENTS
 * ======================
 * 
 * Maps each of the 35 agents to the phases where they are active
 */
const agentPhaseAssignments = {
  // Orchestration Tier (9 agents)
  'project-plan-generator': { phases: [0], tier: 'orchestration', role: 'orchestrator' },
  'doc-writer': { phases: [0, 11], tier: 'orchestration', role: 'documentation' },
  'backlog-strategist': { phases: [0, 9], tier: 'orchestration', role: 'coordination' },
  'implementation-coordinator': { phases: [0, 3, 7, 8, 9], tier: 'orchestration', role: 'coordination' },
  'qa-validator': { phases: [0, 10], tier: 'orchestration', role: 'quality' },
  'reporter': { phases: [9], tier: 'orchestration', role: 'reporting' },
  'deploy-coordinator': { phases: [5], tier: 'orchestration', role: 'deployment' },
  'workload-documentation-generator': { phases: [6, 11], tier: 'orchestration', role: 'documentation' },
  'cicd-engineer': { phases: [8], tier: 'orchestration', role: 'infrastructure' },

  // Architecture Tier (8 agents)
  'azure-principal-architect': { phases: [2], tier: 'architecture', role: 'architecture' },
  'bicep-plan': { phases: [3], tier: 'architecture', role: 'planning' },
  'bicep-implement': { phases: [4], tier: 'architecture', role: 'implementation' },
  'adr-generator': { phases: [2], tier: 'architecture', role: 'documentation' },
  'diagram-generator': { phases: [2, 6], tier: 'architecture', role: 'visualization' },
  'database-specialist': { phases: [2, 3], tier: 'architecture', role: 'architecture' },
  'security-architect': { phases: [2, 3], tier: 'architecture', role: 'security' },
  'cost-optimizer': { phases: [2, 6], tier: 'architecture', role: 'optimization' },

  // Implementation Tier (18 agents)
  'frontend-wireframe': { phases: [8], tier: 'implementation', role: 'frontend' },
  'backend-developer': { phases: [8, 9, 10], tier: 'implementation', role: 'backend' },
  'api-developer': { phases: [8, 9, 10], tier: 'implementation', role: 'backend' },
  'database-developer': { phases: [8, 9, 10], tier: 'implementation', role: 'database' },
  'devops-engineer': { phases: [8, 9, 10], tier: 'implementation', role: 'devops' },
  'security-engineer': { phases: [8, 9, 10], tier: 'implementation', role: 'security' },
  'testing-engineer': { phases: [10], tier: 'implementation', role: 'testing' },
  'integration-specialist': { phases: [7, 8], tier: 'implementation', role: 'integration' },
  'performance-analyst': { phases: [6, 10], tier: 'implementation', role: 'performance' },
  'ui-ux-designer': { phases: [8], tier: 'implementation', role: 'design' },
  'documentation-engineer': { phases: [11], tier: 'implementation', role: 'documentation' },
  'quality-assurance-lead': { phases: [10], tier: 'implementation', role: 'quality' },
  'deployment-specialist': { phases: [5, 6], tier: 'implementation', role: 'deployment' },
  'monitoring-specialist': { phases: [6], tier: 'implementation', role: 'monitoring' },
  'incident-responder': { phases: [9], tier: 'implementation', role: 'operations' },
  'training-specialist': { phases: [11], tier: 'implementation', role: 'training' },
  'compliance-officer': { phases: [3, 10], tier: 'implementation', role: 'compliance' },
  'project-manager': { phases: [0, 9], tier: 'implementation', role: 'management' }
};

/**
 * PHASE DEPENDENCIES
 * ==================
 * 
 * Explicit dependencies between phases (artifacts, context, etc.)
 */
const phaseDependencies = {
  1: ['0'],       // Phase 1 requires Phase 0 complete
  2: ['1'],       // Phase 2 requires Phase 1 complete
  3: ['2'],       // Phase 3 requires Phase 2 complete
  4: ['3'],       // Phase 4 requires Phase 3 complete
  5: ['4'],       // Phase 5 requires Phase 4 complete
  6: ['5'],       // Phase 6 requires Phase 5 complete
  7: ['6'],       // Phase 7 requires Phase 6 complete
  8: ['7'],       // Phase 8 requires Phase 7 complete
  9: ['8'],       // Phase 9 requires Phase 8 complete
  10: ['8'],      // Phase 10 requires Phase 8 complete (can be parallel with 9)
  11: ['9', '10'] // Phase 11 requires phases 9 and 10 complete
};

/**
 * WORKFLOW SUMMARY STATISTICS
 * ==========================
 */
const workflowStats = {
  total_phases: 12,
  orchestration_tier_agents: 9,
  architecture_tier_agents: 8,
  implementation_tier_agents: 18,
  total_agents: 35,
  phases_with_user_approval: [0, 1, 2, 3, 4, 5, 11],
  phases_with_automation_gates: [4],
  parallel_phases: [[9, 10]],
  typical_workflow_minutes: 30 + 10 + 20 + 15 + 20 + 10 + 15 + 10 + 15 + 10 + 10 + 20,  // ~185 minutes (~3 hours)
  azure_infrastructure_phases: [1, 2, 3, 4, 5, 6, 7],
  project_implementation_phases: [0, 8, 9, 10, 11],
  bridge_phases: [7]
};

/**
 * UTILITIES
 * =========
 */
const getPhase = (phaseNumber) => phases[phaseNumber];
const getAllPhases = () => Object.values(phases);
const getPhasesByTier = (tier) => {
  const result = {};
  for (const [agent, assignment] of Object.entries(agentPhaseAssignments)) {
    if (assignment.tier === tier) {
      assignment.phases.forEach(phase => {
        result[phase] = result[phase] || [];
        result[phase].push(agent);
      });
    }
  }
  return result;
};
const getAgentsForPhase = (phaseNumber) => {
  return Object.entries(agentPhaseAssignments)
    .filter(([_, assignment]) => assignment.phases.includes(phaseNumber))
    .map(([agent, _]) => agent);
};
const getNextPhase = (currentPhase, transitionReason = 'approval') => {
  const transitions = stateTransitions[currentPhase];
  const transition = transitions[`on_${transitionReason}`];
  return Array.isArray(transition) ? transition : [transition]; // Return array for consistency
};
const getPhaseSequence = () => Object.keys(phases).map(k => parseInt(k)).sort((a, b) => a - b);
const getWorkflowDuration = () => workflowStats.typical_workflow_minutes;

/**
 * EXPORTS
 * =======
 */
export {
  phases,
  stateTransitions,
  phaseValidationRules,
  agentPhaseAssignments,
  phaseDependencies,
  workflowStats,
  getPhase,
  getAllPhases,
  getPhasesByTier,
  getAgentsForPhase,
  getNextPhase,
  getPhaseSequence,
  getWorkflowDuration
};
