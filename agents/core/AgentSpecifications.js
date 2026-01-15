/**
 * Agent Specification Loader and Index
 * Loads all 35 agent specifications and creates searchable index
 */

/**
 * Complete agent specifications for all 35 agents
 */
export const AGENT_SPECIFICATIONS = [
  // TIER 1: ORCHESTRATION (9)
  {
    id: 'plan',
    name: 'Requirements Planner',
    tier: 'Orchestration',
    category: 'Planning',
    version: '1.0.0',
    status: 'Active',
    description: 'Parses user requirements and generates structured requirement documents',
    capabilities: ['requirement-parsing', 'entity-extraction', 'requirement-decomposition'],
    mcp_tools: ['azure-docs'],
    skills: ['nlp', 'requirement-analysis'],
    phases: ['Phase 1: Requirements Discovery'],
    successors: ['architect', 'code-architect']
  },
  {
    id: 'doc',
    name: 'Documentation Generator',
    tier: 'Orchestration',
    category: 'Documentation',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates and maintains comprehensive project documentation',
    capabilities: ['api-documentation', 'guide-generation', 'doc-generation'],
    skills: ['documentation', 'markdown'],
    phases: ['Phase 4: Design Artifacts', 'Phase 12: DevOps & Deployment'],
    predecessors: [],
    successors: []
  },
  {
    id: 'backlog',
    name: 'Backlog Manager',
    tier: 'Orchestration',
    category: 'Project Management',
    version: '1.0.0',
    status: 'Active',
    description: 'Manages project backlog and converts requirements into actionable work items',
    capabilities: ['user-story-creation', 'task-breakdown', 'effort-estimation', 'prioritization'],
    phases: ['Phase 7: Application Planning'],
    successors: ['coordinator']
  },
  {
    id: 'coordinator',
    name: 'Workflow Coordinator',
    tier: 'Orchestration',
    category: 'Orchestration',
    version: '1.0.0',
    status: 'Active',
    description: 'Orchestrates multi-agent workflows and manages phase transitions',
    capabilities: ['workflow-orchestration', 'phase-management', 'agent-coordination'],
    mcp_tools: ['message-bus'],
    phases: ['All Phases'],
    predecessors: [],
    successors: []
  },
  {
    id: 'qa',
    name: 'Quality Assurance Orchestrator',
    tier: 'Orchestration',
    category: 'Quality Assurance',
    version: '1.0.0',
    status: 'Active',
    description: 'Orchestrates quality assurance and validation gates',
    capabilities: ['test-execution', 'quality-reporting', 'validation-gates'],
    phases: ['Phase 8: Infrastructure Implementation', 'Phase 9: Frontend Implementation', 'Phase 10: Backend Implementation', 'Phase 11: Integration & Testing', 'Phase 12: DevOps & Deployment'],
    predecessors: [],
    successors: []
  },
  {
    id: 'reporter',
    name: 'Progress Reporter',
    tier: 'Orchestration',
    category: 'Reporting',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates comprehensive progress reports and project dashboards',
    capabilities: ['progress-reporting', 'metric-tracking', 'dashboard-generation'],
    phases: ['All Phases'],
    predecessors: [],
    successors: []
  },
  {
    id: 'architect',
    name: 'Solution Architect',
    tier: 'Orchestration',
    category: 'Architecture',
    version: '1.0.0',
    status: 'Active',
    description: 'Designs high-level solution architecture based on requirements',
    capabilities: ['architecture-design', 'tech-stack-selection', 'component-definition'],
    predecessors: ['plan'],
    successors: ['code-architect', 'azure-principal-architect']
  },
  {
    id: 'code-architect',
    name: 'Code Architect',
    tier: 'Orchestration',
    category: 'Architecture',
    version: '1.0.0',
    status: 'Active',
    description: 'Designs code-level architecture and patterns',
    capabilities: ['code-architecture', 'pattern-design', 'api-design'],
    phases: ['Phase 2: Architecture Planning'],
    predecessors: ['architect'],
    successors: ['react-specialist', 'dotnet-specialist', 'nodejs-specialist']
  },
  {
    id: 'devops-specialist',
    name: 'DevOps Specialist',
    tier: 'Orchestration',
    category: 'DevOps',
    version: '1.0.0',
    status: 'Active',
    description: 'Orchestrates DevOps and deployment activities',
    capabilities: ['pipeline-design', 'monitoring-setup', 'deployment-management'],
    phases: ['Phase 12: DevOps & Deployment'],
    predecessors: [],
    successors: []
  },

  // TIER 2: ARCHITECTURE (8)
  {
    id: 'azure-principal-architect',
    name: 'Azure Principal Architect',
    tier: 'Architecture',
    category: 'Cloud Architecture',
    version: '1.0.0',
    status: 'Active',
    description: 'Assesses and designs Azure cloud architecture using Well-Architected Framework',
    capabilities: ['waf-assessment', 'azure-design', 'cost-estimation', 'security-assessment'],
    mcp_tools: ['azure-pricing', 'azure-resource-graph', 'azure-docs'],
    phases: ['Phase 3: Infrastructure Assessment'],
    predecessors: ['architect'],
    successors: ['bicep-plan', 'diagram-generator']
  },
  {
    id: 'aws-architect',
    name: 'AWS Architect',
    tier: 'Architecture',
    category: 'Cloud Architecture',
    version: '1.0.0',
    status: 'Active',
    description: 'Assesses and designs AWS cloud architecture',
    capabilities: ['aws-design', 'well-architected-review'],
    phases: ['Phase 3: Infrastructure Assessment'],
    predecessors: ['architect'],
    successors: []
  },
  {
    id: 'gcp-architect',
    name: 'GCP Architect',
    tier: 'Architecture',
    category: 'Cloud Architecture',
    version: '1.0.0',
    status: 'Active',
    description: 'Assesses and designs Google Cloud Platform architecture',
    capabilities: ['gcp-design'],
    phases: ['Phase 3: Infrastructure Assessment'],
    predecessors: ['architect'],
    successors: []
  },
  {
    id: 'bicep-plan',
    name: 'Bicep Implementation Planner',
    tier: 'Architecture',
    category: 'Infrastructure',
    version: '1.0.0',
    status: 'Active',
    description: 'Plans Bicep-based infrastructure implementation with AVM modules',
    capabilities: ['bicep-planning', 'avm-planning', 'governance-assessment'],
    mcp_tools: ['azure-pricing', 'azure-resource-graph'],
    phases: ['Phase 5: Infrastructure Planning'],
    predecessors: ['azure-principal-architect'],
    successors: ['bicep-implement']
  },
  {
    id: 'terraform-plan',
    name: 'Terraform Implementation Planner',
    tier: 'Architecture',
    category: 'Infrastructure',
    version: '1.0.0',
    status: 'Active',
    description: 'Plans Terraform-based infrastructure implementation',
    capabilities: ['terraform-planning', 'module-design'],
    phases: ['Phase 5: Infrastructure Planning'],
    predecessors: ['architect'],
    successors: ['terraform-implement']
  },
  {
    id: 'database-specialist',
    name: 'Database Specialist',
    tier: 'Architecture',
    category: 'Database',
    version: '1.0.0',
    status: 'Active',
    description: 'Designs database architecture and schemas',
    capabilities: ['schema-design', 'data-modeling', 'migration-planning'],
    phases: ['Phase 6: Database Architecture'],
    predecessors: [],
    successors: ['mysql-specialist', 'postgres-specialist', 'mongodb-specialist']
  },
  {
    id: 'diagram-generator',
    name: 'Diagram Generator',
    tier: 'Architecture',
    category: 'Documentation',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates architecture diagrams and visualizations',
    capabilities: ['diagram-generation', 'visualization'],
    phases: ['Phase 4: Design Artifacts'],
    predecessors: ['azure-principal-architect'],
    successors: []
  },
  {
    id: 'adr-generator',
    name: 'Architecture Decision Record Generator',
    tier: 'Architecture',
    category: 'Documentation',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Architecture Decision Records documenting design decisions',
    capabilities: ['adr-generation', 'decision-documentation'],
    phases: ['Phase 4: Design Artifacts'],
    predecessors: [],
    successors: []
  },

  // TIER 3: IMPLEMENTATION - FRONTEND (5)
  {
    id: 'react-specialist',
    name: 'React Specialist',
    tier: 'Implementation',
    category: 'Frontend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates React-based frontend applications',
    capabilities: ['react-generation', 'component-creation', 'state-management'],
    skills: ['react', 'typescript', 'jest'],
    phases: ['Phase 9: Frontend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },
  {
    id: 'vue-specialist',
    name: 'Vue Specialist',
    tier: 'Implementation',
    category: 'Frontend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Vue.js-based frontend applications',
    capabilities: ['vue-generation', 'component-creation'],
    skills: ['vue', 'vitest'],
    phases: ['Phase 9: Frontend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },
  {
    id: 'angular-specialist',
    name: 'Angular Specialist',
    tier: 'Implementation',
    category: 'Frontend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Angular-based frontend applications',
    capabilities: ['angular-generation', 'component-creation'],
    skills: ['angular', 'jasmine'],
    phases: ['Phase 9: Frontend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },
  {
    id: 'svelte-specialist',
    name: 'Svelte Specialist',
    tier: 'Implementation',
    category: 'Frontend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Svelte-based frontend applications',
    capabilities: ['svelte-generation'],
    skills: ['svelte'],
    phases: ['Phase 9: Frontend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },
  {
    id: 'frontend-specialist',
    name: 'Generic Frontend Specialist',
    tier: 'Implementation',
    category: 'Frontend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generic frontend specialist for framework-agnostic projects',
    capabilities: ['frontend-generation'],
    phases: ['Phase 9: Frontend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },

  // TIER 3: IMPLEMENTATION - BACKEND (6)
  {
    id: 'dotnet-specialist',
    name: '.NET Specialist',
    tier: 'Implementation',
    category: 'Backend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates .NET/C# backend applications',
    capabilities: ['dotnet-generation', 'api-creation', 'entity-framework'],
    skills: ['dotnet', 'csharp', 'xunit'],
    phases: ['Phase 10: Backend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },
  {
    id: 'nodejs-specialist',
    name: 'Node.js Specialist',
    tier: 'Implementation',
    category: 'Backend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Node.js/Express backend applications',
    capabilities: ['nodejs-generation', 'express-setup'],
    skills: ['nodejs', 'typescript', 'jest'],
    phases: ['Phase 10: Backend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },
  {
    id: 'python-specialist',
    name: 'Python Specialist',
    tier: 'Implementation',
    category: 'Backend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Python backend applications',
    capabilities: ['python-generation', 'fastapi-setup'],
    skills: ['python', 'fastapi', 'pytest'],
    phases: ['Phase 10: Backend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },
  {
    id: 'go-specialist',
    name: 'Go Specialist',
    tier: 'Implementation',
    category: 'Backend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Go backend applications',
    capabilities: ['go-generation'],
    skills: ['go'],
    phases: ['Phase 10: Backend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },
  {
    id: 'java-specialist',
    name: 'Java Specialist',
    tier: 'Implementation',
    category: 'Backend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Java backend applications (Spring Boot)',
    capabilities: ['java-generation', 'spring-boot-setup'],
    skills: ['java', 'springboot', 'junit'],
    phases: ['Phase 10: Backend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },
  {
    id: 'backend-specialist',
    name: 'Generic Backend Specialist',
    tier: 'Implementation',
    category: 'Backend',
    version: '1.0.0',
    status: 'Active',
    description: 'Generic backend specialist for framework-agnostic projects',
    capabilities: ['backend-generation'],
    phases: ['Phase 10: Backend Implementation'],
    predecessors: ['code-architect'],
    successors: ['qa']
  },

  // TIER 3: IMPLEMENTATION - INFRASTRUCTURE (4)
  {
    id: 'bicep-implement',
    name: 'Bicep Implementation',
    tier: 'Implementation',
    category: 'Infrastructure',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Bicep infrastructure code with Azure Verified Modules',
    capabilities: ['bicep-generation', 'avm-usage', 'validation'],
    phases: ['Phase 8: Infrastructure Implementation'],
    predecessors: ['bicep-plan'],
    successors: ['qa']
  },
  {
    id: 'terraform-implement',
    name: 'Terraform Implementation',
    tier: 'Implementation',
    category: 'Infrastructure',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Terraform infrastructure code',
    capabilities: ['terraform-generation', 'module-creation'],
    phases: ['Phase 8: Infrastructure Implementation'],
    predecessors: ['terraform-plan'],
    successors: ['qa']
  },
  {
    id: 'docker-specialist',
    name: 'Docker Specialist',
    tier: 'Implementation',
    category: 'Infrastructure',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Docker containerization for applications',
    capabilities: ['dockerfile-generation', 'compose-setup'],
    skills: ['docker'],
    phases: ['Phase 11: Integration & Testing'],
    predecessors: [],
    successors: []
  },
  {
    id: 'kubernetes-specialist',
    name: 'Kubernetes Specialist',
    tier: 'Implementation',
    category: 'Infrastructure',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates Kubernetes orchestration configurations',
    capabilities: ['kubernetes-generation', 'manifest-creation'],
    skills: ['kubernetes'],
    phases: ['Phase 11: Integration & Testing'],
    predecessors: [],
    successors: []
  },

  // TIER 3: IMPLEMENTATION - DATABASE (3)
  {
    id: 'mysql-specialist',
    name: 'MySQL Specialist',
    tier: 'Implementation',
    category: 'Database',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates MySQL database schemas and configurations',
    capabilities: ['mysql-generation', 'schema-creation'],
    skills: ['mysql'],
    phases: ['Phase 6: Database Architecture'],
    predecessors: ['database-specialist'],
    successors: []
  },
  {
    id: 'postgres-specialist',
    name: 'PostgreSQL Specialist',
    tier: 'Implementation',
    category: 'Database',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates PostgreSQL database schemas',
    capabilities: ['postgres-generation', 'schema-creation'],
    skills: ['postgresql'],
    phases: ['Phase 6: Database Architecture'],
    predecessors: ['database-specialist'],
    successors: []
  },
  {
    id: 'mongodb-specialist',
    name: 'MongoDB Specialist',
    tier: 'Implementation',
    category: 'Database',
    version: '1.0.0',
    status: 'Active',
    description: 'Generates MongoDB document schemas and configurations',
    capabilities: ['mongodb-generation', 'schema-creation'],
    skills: ['mongodb'],
    phases: ['Phase 6: Database Architecture'],
    predecessors: ['database-specialist'],
    successors: []
  }
];

/**
 * Agent Specification Index
 */
export class AgentSpecificationIndex {
  constructor(specifications) {
    this.specs = specifications;
    this.buildIndexes();
  }

  buildIndexes() {
    this.byId = new Map();
    this.byTier = new Map();
    this.byCategory = new Map();
    this.byPhase = new Map();
    this.byCapability = new Map();
    this.bySkill = new Map();

    // Initialize groupings
    this.specs.forEach(spec => {
      this.byId.set(spec.id, spec);

      if (!this.byTier.has(spec.tier)) {
        this.byTier.set(spec.tier, []);
      }
      this.byTier.get(spec.tier).push(spec);

      if (!this.byCategory.has(spec.category)) {
        this.byCategory.set(spec.category, []);
      }
      this.byCategory.get(spec.category).push(spec);

      (spec.phases || []).forEach(phase => {
        if (!this.byPhase.has(phase)) {
          this.byPhase.set(phase, []);
        }
        this.byPhase.get(phase).push(spec);
      });

      (spec.capabilities || []).forEach(cap => {
        if (!this.byCapability.has(cap)) {
          this.byCapability.set(cap, []);
        }
        this.byCapability.get(cap).push(spec);
      });

      (spec.skills || []).forEach(skill => {
        if (!this.bySkill.has(skill)) {
          this.bySkill.set(skill, []);
        }
        this.bySkill.get(skill).push(spec);
      });
    });
  }

  getAgent(id) {
    return this.byId.get(id);
  }

  listByTier(tier) {
    return this.byTier.get(tier) || [];
  }

  listByCategory(category) {
    return this.byCategory.get(category) || [];
  }

  listByPhase(phase) {
    return this.byPhase.get(phase) || [];
  }

  listByCapability(capability) {
    return this.byCapability.get(capability) || [];
  }

  listBySkill(skill) {
    return this.bySkill.get(skill) || [];
  }

  listAll() {
    return this.specs;
  }

  getStats() {
    const byTierCounts = {};
    for (const [tier, agents] of this.byTier) {
      byTierCounts[tier] = agents.length;
    }
    
    const byCategoryCounts = {};
    for (const [category, agents] of this.byCategory) {
      byCategoryCounts[category] = agents.length;
    }
    
    return {
      totalAgents: this.specs.length,
      byTier: byTierCounts,
      byCategory: byCategoryCounts,
      phases: Array.from(this.byPhase.keys()).length,
      capabilities: this.byCapability.size,
      skills: this.bySkill.size
    };
  }
}

export default {
  AGENT_SPECIFICATIONS,
  AgentSpecificationIndex
};
