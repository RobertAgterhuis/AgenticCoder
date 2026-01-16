# Phase 3: Reference Documentation

**Phase ID:** F-DOC-P03  
**Feature:** DocumentationOnboarding  
**Duration:** 4-5 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 2 (User Guide)

---

## 🎯 Phase Objectives

Deze phase implementeert de **Reference** documentatie:
- Agent reference (alle agents)
- Skill reference (alle skills)
- Scenario details
- API reference (indien van toepassing)

---

## 📦 Deliverables

### 1. Directory Structure

```
docs/
├── reference/
│   ├── README.md              # Reference index
│   ├── agents/
│   │   ├── index.md           # Agent overview
│   │   ├── plan-agent.md
│   │   ├── doc-agent.md
│   │   ├── architect-agent.md
│   │   └── ...
│   ├── skills/
│   │   ├── index.md           # Skill overview
│   │   ├── typescript-generator.md
│   │   └── ...
│   ├── scenarios/
│   │   ├── index.md
│   │   ├── S01-simple-mvp.md
│   │   └── ...
│   └── api/
│       ├── rest-api.md
│       └── webhook-events.md
│
src/
├── docs/
│   ├── reference/
│   │   ├── AgentDocGenerator.ts
│   │   ├── SkillDocGenerator.ts
│   │   └── ApiDocGenerator.ts
```

---

## 🔧 Implementation Details

### 3.1 Agent Doc Generator (`src/docs/reference/AgentDocGenerator.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Agent documentation info
 */
export interface AgentDocInfo {
  id: string;
  name: string;
  role: string;
  description: string;
  phase: number[];
  skills: string[];
  inputs: AgentInput[];
  outputs: AgentOutput[];
  handoffs: AgentHandoff[];
  triggers: string[];
  category: string;
  example?: string;
}

/**
 * Agent input
 */
export interface AgentInput {
  name: string;
  type: string;
  description: string;
  required: boolean;
  source?: string;
}

/**
 * Agent output
 */
export interface AgentOutput {
  name: string;
  type: string;
  description: string;
  format?: string;
}

/**
 * Agent handoff
 */
export interface AgentHandoff {
  to: string;
  trigger: string;
  data: string[];
}

/**
 * Agent documentation generator
 */
export class AgentDocGenerator {
  private agents: AgentDocInfo[] = [];

  /**
   * Register all agents
   */
  registerAllAgents(): void {
    // Planning agents
    this.addAgent({
      id: 'plan-agent',
      name: 'PlanAgent',
      role: 'Project Planning',
      description: 'Creates comprehensive project plans by breaking down requirements into phases, tasks, and milestones.',
      phase: [1],
      category: 'Planning',
      skills: ['TaskDecomposer', 'DependencyAnalyzer', 'EstimationEngine'],
      inputs: [
        { name: 'requirements', type: 'RequirementsDoc', description: 'User requirements document', required: true, source: 'User/DocAgent' },
        { name: 'scenario', type: 'ScenarioConfig', description: 'Selected scenario', required: true, source: 'Configuration' },
      ],
      outputs: [
        { name: 'projectPlan', type: 'ProjectPlan', description: 'Detailed project plan with phases and tasks', format: 'JSON/Markdown' },
        { name: 'taskGraph', type: 'TaskDependencyGraph', description: 'Task dependencies', format: 'JSON' },
      ],
      handoffs: [
        { to: 'DocAgent', trigger: 'Plan complete', data: ['projectPlan'] },
        { to: 'ArchitectAgent', trigger: 'Technical tasks identified', data: ['technicalRequirements'] },
      ],
      triggers: ['New project', 'Requirements change', 'Phase completion'],
      example: `
// PlanAgent creates a structured project plan
{
  "phases": [
    {
      "id": 1,
      "name": "Setup",
      "tasks": [
        { "id": "T1", "name": "Initialize project", "estimate": "30m" }
      ]
    }
  ]
}
      `.trim(),
    });

    this.addAgent({
      id: 'doc-agent',
      name: 'DocAgent',
      role: 'Documentation & Requirements',
      description: 'Manages project documentation, requirements gathering, and documentation generation.',
      phase: [1, 5],
      category: 'Documentation',
      skills: ['RequirementsParser', 'DocGenerator', 'MarkdownWriter'],
      inputs: [
        { name: 'userInput', type: 'string', description: 'User requirements in natural language', required: true },
        { name: 'existingDocs', type: 'Document[]', description: 'Existing documentation', required: false },
      ],
      outputs: [
        { name: 'requirements', type: 'RequirementsDoc', description: 'Structured requirements', format: 'Markdown' },
        { name: 'documentation', type: 'Document[]', description: 'Generated documentation', format: 'Markdown' },
      ],
      handoffs: [
        { to: 'PlanAgent', trigger: 'Requirements finalized', data: ['requirements'] },
        { to: 'ArchitectAgent', trigger: 'Technical requirements', data: ['technicalSpecs'] },
      ],
      triggers: ['Project start', 'User input', 'Code generation complete'],
    });

    this.addAgent({
      id: 'architect-agent',
      name: 'ArchitectAgent',
      role: 'System Architecture',
      description: 'Designs system architecture, component diagrams, and technical specifications.',
      phase: [2],
      category: 'Architecture',
      skills: ['SystemDesigner', 'DiagramGenerator', 'PatternSelector'],
      inputs: [
        { name: 'requirements', type: 'RequirementsDoc', description: 'Project requirements', required: true },
        { name: 'constraints', type: 'Constraints', description: 'Technical constraints', required: false },
      ],
      outputs: [
        { name: 'architecture', type: 'ArchitectureDoc', description: 'System architecture', format: 'Markdown/Mermaid' },
        { name: 'components', type: 'Component[]', description: 'Component definitions', format: 'JSON' },
        { name: 'dataModel', type: 'DataModel', description: 'Data model/schema', format: 'JSON/TypeScript' },
      ],
      handoffs: [
        { to: 'CodeGenAgent', trigger: 'Architecture approved', data: ['architecture', 'components'] },
        { to: 'AzureAgent', trigger: 'Infrastructure needed', data: ['infraRequirements'] },
      ],
      triggers: ['Requirements finalized', 'Architecture review'],
    });

    this.addAgent({
      id: 'codegen-agent',
      name: 'CodeGenAgent',
      role: 'Code Generation',
      description: 'Generates source code based on architecture and specifications.',
      phase: [3],
      category: 'Generation',
      skills: ['TypeScriptGenerator', 'ReactGenerator', 'APIGenerator', 'TestGenerator'],
      inputs: [
        { name: 'architecture', type: 'ArchitectureDoc', description: 'System architecture', required: true },
        { name: 'components', type: 'Component[]', description: 'Components to generate', required: true },
        { name: 'preferences', type: 'CodePreferences', description: 'Code style preferences', required: false },
      ],
      outputs: [
        { name: 'sourceCode', type: 'SourceFile[]', description: 'Generated source files', format: 'TypeScript/JavaScript' },
        { name: 'tests', type: 'TestFile[]', description: 'Generated test files', format: 'TypeScript' },
      ],
      handoffs: [
        { to: 'TestAgent', trigger: 'Code generated', data: ['sourceCode'] },
        { to: 'ReviewAgent', trigger: 'Ready for review', data: ['sourceCode', 'tests'] },
      ],
      triggers: ['Architecture complete', 'Component request'],
    });

    this.addAgent({
      id: 'test-agent',
      name: 'TestAgent',
      role: 'Test Generation',
      description: 'Creates comprehensive test suites for generated code.',
      phase: [4],
      category: 'Quality',
      skills: ['UnitTestGenerator', 'IntegrationTestGenerator', 'E2ETestGenerator'],
      inputs: [
        { name: 'sourceCode', type: 'SourceFile[]', description: 'Source code to test', required: true },
        { name: 'requirements', type: 'RequirementsDoc', description: 'Requirements for coverage', required: false },
      ],
      outputs: [
        { name: 'unitTests', type: 'TestFile[]', description: 'Unit tests', format: 'TypeScript' },
        { name: 'integrationTests', type: 'TestFile[]', description: 'Integration tests', format: 'TypeScript' },
        { name: 'coverageReport', type: 'CoverageReport', description: 'Coverage analysis', format: 'JSON' },
      ],
      handoffs: [
        { to: 'ReviewAgent', trigger: 'Tests complete', data: ['unitTests', 'coverageReport'] },
      ],
      triggers: ['Code generation complete', 'Coverage threshold not met'],
    });

    this.addAgent({
      id: 'review-agent',
      name: 'ReviewAgent',
      role: 'Code Review',
      description: 'Reviews generated code for quality, best practices, and potential issues.',
      phase: [4],
      category: 'Quality',
      skills: ['CodeAnalyzer', 'SecurityScanner', 'StyleChecker'],
      inputs: [
        { name: 'sourceCode', type: 'SourceFile[]', description: 'Code to review', required: true },
        { name: 'tests', type: 'TestFile[]', description: 'Associated tests', required: false },
      ],
      outputs: [
        { name: 'reviewReport', type: 'ReviewReport', description: 'Review findings', format: 'Markdown' },
        { name: 'suggestions', type: 'Suggestion[]', description: 'Improvement suggestions', format: 'JSON' },
      ],
      handoffs: [
        { to: 'CodeGenAgent', trigger: 'Issues found', data: ['suggestions'] },
        { to: 'DeployAgent', trigger: 'Review passed', data: ['approvedCode'] },
      ],
      triggers: ['Code ready for review', 'Test complete'],
    });

    this.addAgent({
      id: 'azure-agent',
      name: 'AzureAgent',
      role: 'Azure Infrastructure',
      description: 'Generates Azure infrastructure as code (Bicep) and deployment configurations.',
      phase: [3, 5],
      category: 'Infrastructure',
      skills: ['BicepGenerator', 'AzureResourceMapper', 'CostEstimator'],
      inputs: [
        { name: 'infraRequirements', type: 'InfraRequirements', description: 'Infrastructure needs', required: true },
        { name: 'azureConfig', type: 'AzureConfig', description: 'Azure configuration', required: false },
      ],
      outputs: [
        { name: 'bicepTemplates', type: 'BicepFile[]', description: 'Bicep templates', format: 'Bicep' },
        { name: 'parameters', type: 'ParameterFile[]', description: 'Parameter files', format: 'JSON' },
        { name: 'costEstimate', type: 'CostEstimate', description: 'Cost estimation', format: 'JSON' },
      ],
      handoffs: [
        { to: 'DeployAgent', trigger: 'Templates ready', data: ['bicepTemplates'] },
        { to: 'SecurityAgent', trigger: 'Security review', data: ['bicepTemplates'] },
      ],
      triggers: ['Architecture defines Azure resources', 'Deployment requested'],
    });

    this.addAgent({
      id: 'deploy-agent',
      name: 'DeployAgent',
      role: 'Deployment',
      description: 'Manages deployment pipelines, CI/CD, and release processes.',
      phase: [5],
      category: 'Deployment',
      skills: ['PipelineGenerator', 'GitHubActionsBuilder', 'DeploymentOrchestrator'],
      inputs: [
        { name: 'code', type: 'SourceFile[]', description: 'Code to deploy', required: true },
        { name: 'infrastructure', type: 'BicepFile[]', description: 'Infrastructure templates', required: false },
      ],
      outputs: [
        { name: 'pipeline', type: 'PipelineConfig', description: 'CI/CD pipeline', format: 'YAML' },
        { name: 'deploymentStatus', type: 'DeploymentStatus', description: 'Deployment result', format: 'JSON' },
      ],
      handoffs: [
        { to: 'MonitorAgent', trigger: 'Deployment complete', data: ['deploymentStatus'] },
      ],
      triggers: ['Review approved', 'Manual deploy request'],
    });

    this.addAgent({
      id: 'security-agent',
      name: 'SecurityAgent',
      role: 'Security Analysis',
      description: 'Analyzes code and infrastructure for security vulnerabilities.',
      phase: [4],
      category: 'Security',
      skills: ['VulnerabilityScanner', 'SecretDetector', 'ComplianceChecker'],
      inputs: [
        { name: 'sourceCode', type: 'SourceFile[]', description: 'Code to analyze', required: true },
        { name: 'infrastructure', type: 'BicepFile[]', description: 'Infrastructure to analyze', required: false },
      ],
      outputs: [
        { name: 'securityReport', type: 'SecurityReport', description: 'Security findings', format: 'Markdown/JSON' },
        { name: 'remediations', type: 'Remediation[]', description: 'Fix suggestions', format: 'JSON' },
      ],
      handoffs: [
        { to: 'CodeGenAgent', trigger: 'Vulnerabilities found', data: ['remediations'] },
        { to: 'ReviewAgent', trigger: 'Security cleared', data: ['securityReport'] },
      ],
      triggers: ['Code review', 'Infrastructure change'],
    });
  }

  /**
   * Add agent
   */
  private addAgent(agent: AgentDocInfo): void {
    this.agents.push(agent);
  }

  /**
   * Generate agent index
   */
  generateIndex(): string {
    const lines: string[] = [];

    lines.push('# Agent Reference');
    lines.push('');
    lines.push('Complete reference for all AgenticCoder agents.');
    lines.push('');

    // Overview table
    lines.push('## Overview');
    lines.push('');
    lines.push('| Agent | Role | Phase | Category |');
    lines.push('|-------|------|-------|----------|');
    for (const agent of this.agents) {
      const phases = agent.phase.join(', ');
      lines.push(`| [${agent.name}](./${agent.id}.md) | ${agent.role} | ${phases} | ${agent.category} |`);
    }
    lines.push('');

    // By category
    const categories = [...new Set(this.agents.map(a => a.category))];
    for (const category of categories) {
      lines.push(`## ${category} Agents`);
      lines.push('');
      const categoryAgents = this.agents.filter(a => a.category === category);
      for (const agent of categoryAgents) {
        lines.push(`### [${agent.name}](./${agent.id}.md)`);
        lines.push('');
        lines.push(agent.description);
        lines.push('');
        lines.push(`**Skills:** ${agent.skills.join(', ')}`);
        lines.push('');
      }
    }

    // Agent interaction diagram
    lines.push('## Agent Interactions');
    lines.push('');
    lines.push('```mermaid');
    lines.push('graph LR');
    for (const agent of this.agents) {
      for (const handoff of agent.handoffs) {
        lines.push(`  ${agent.name} --> ${handoff.to}`);
      }
    }
    lines.push('```');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate single agent doc
   */
  generateAgentDoc(agent: AgentDocInfo): string {
    const lines: string[] = [];

    lines.push(`# ${agent.name}`);
    lines.push('');
    lines.push(`**Role:** ${agent.role}  `);
    lines.push(`**Category:** ${agent.category}  `);
    lines.push(`**Phase:** ${agent.phase.join(', ')}`);
    lines.push('');

    lines.push('## Description');
    lines.push('');
    lines.push(agent.description);
    lines.push('');

    // Skills
    lines.push('## Skills');
    lines.push('');
    for (const skill of agent.skills) {
      lines.push(`- [${skill}](../skills/${skill.toLowerCase()}.md)`);
    }
    lines.push('');

    // Inputs
    lines.push('## Inputs');
    lines.push('');
    lines.push('| Name | Type | Required | Description |');
    lines.push('|------|------|----------|-------------|');
    for (const input of agent.inputs) {
      const req = input.required ? 'Yes' : 'No';
      const source = input.source ? ` (from ${input.source})` : '';
      lines.push(`| \`${input.name}\` | ${input.type} | ${req} | ${input.description}${source} |`);
    }
    lines.push('');

    // Outputs
    lines.push('## Outputs');
    lines.push('');
    lines.push('| Name | Type | Format | Description |');
    lines.push('|------|------|--------|-------------|');
    for (const output of agent.outputs) {
      const format = output.format || '-';
      lines.push(`| \`${output.name}\` | ${output.type} | ${format} | ${output.description} |`);
    }
    lines.push('');

    // Handoffs
    if (agent.handoffs.length > 0) {
      lines.push('## Handoffs');
      lines.push('');
      lines.push('| To Agent | Trigger | Data |');
      lines.push('|----------|---------|------|');
      for (const handoff of agent.handoffs) {
        const data = handoff.data.map(d => `\`${d}\``).join(', ');
        lines.push(`| [${handoff.to}](./${handoff.to.toLowerCase().replace('agent', '-agent')}.md) | ${handoff.trigger} | ${data} |`);
      }
      lines.push('');
    }

    // Triggers
    lines.push('## Triggers');
    lines.push('');
    for (const trigger of agent.triggers) {
      lines.push(`- ${trigger}`);
    }
    lines.push('');

    // Example
    if (agent.example) {
      lines.push('## Example');
      lines.push('');
      lines.push('```typescript');
      lines.push(agent.example);
      lines.push('```');
      lines.push('');
    }

    // Navigation
    lines.push('---');
    lines.push('');
    lines.push('[← Back to Agent Index](./index.md)');

    return lines.join('\n');
  }

  /**
   * Generate all agent docs
   */
  async generateAll(outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    // Index
    await fs.writeFile(
      path.join(outputDir, 'index.md'),
      this.generateIndex(),
      'utf-8'
    );

    // Individual agent docs
    for (const agent of this.agents) {
      await fs.writeFile(
        path.join(outputDir, `${agent.id}.md`),
        this.generateAgentDoc(agent),
        'utf-8'
      );
    }
  }

  /**
   * Get all agents
   */
  getAgents(): AgentDocInfo[] {
    return this.agents;
  }
}

/**
 * Create agent doc generator
 */
export function createAgentDocGenerator(): AgentDocGenerator {
  const generator = new AgentDocGenerator();
  generator.registerAllAgents();
  return generator;
}
```

### 3.2 Skill Doc Generator (`src/docs/reference/SkillDocGenerator.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Skill documentation info
 */
export interface SkillDocInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  usedBy: string[];
  parameters: SkillParameter[];
  returns: SkillReturn;
  example?: string;
  relatedSkills?: string[];
}

/**
 * Skill parameter
 */
export interface SkillParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
}

/**
 * Skill return
 */
export interface SkillReturn {
  type: string;
  description: string;
}

/**
 * Skill documentation generator
 */
export class SkillDocGenerator {
  private skills: SkillDocInfo[] = [];

  /**
   * Register all skills
   */
  registerAllSkills(): void {
    // Code generation skills
    this.addSkill({
      id: 'typescript-generator',
      name: 'TypeScriptGenerator',
      description: 'Generates TypeScript code including classes, interfaces, functions, and modules.',
      category: 'Code Generation',
      usedBy: ['CodeGenAgent'],
      parameters: [
        { name: 'component', type: 'ComponentSpec', description: 'Component specification', required: true },
        { name: 'style', type: 'CodeStyle', description: 'Code style preferences', required: false, default: 'standard' },
        { name: 'strict', type: 'boolean', description: 'Enable strict TypeScript', required: false, default: true },
      ],
      returns: { type: 'SourceFile[]', description: 'Generated TypeScript files' },
      example: `
const generator = new TypeScriptGenerator();
const files = await generator.generate({
  component: {
    name: 'UserService',
    type: 'service',
    methods: ['getUser', 'createUser']
  },
  style: 'functional'
});
      `.trim(),
      relatedSkills: ['ReactGenerator', 'APIGenerator'],
    });

    this.addSkill({
      id: 'react-generator',
      name: 'ReactGenerator',
      description: 'Generates React components with hooks, state management, and styling.',
      category: 'Code Generation',
      usedBy: ['CodeGenAgent'],
      parameters: [
        { name: 'component', type: 'ReactComponentSpec', description: 'React component spec', required: true },
        { name: 'styling', type: 'string', description: 'Styling approach', required: false, default: 'tailwind' },
        { name: 'hooks', type: 'string[]', description: 'React hooks to include', required: false },
      ],
      returns: { type: 'SourceFile[]', description: 'React component files' },
      example: `
const generator = new ReactGenerator();
const files = await generator.generate({
  component: {
    name: 'TodoList',
    props: ['items', 'onToggle'],
    state: ['filter']
  },
  styling: 'tailwind'
});
      `.trim(),
      relatedSkills: ['TypeScriptGenerator', 'TestGenerator'],
    });

    this.addSkill({
      id: 'bicep-generator',
      name: 'BicepGenerator',
      description: 'Generates Azure Bicep templates for infrastructure as code.',
      category: 'Infrastructure',
      usedBy: ['AzureAgent'],
      parameters: [
        { name: 'resources', type: 'AzureResource[]', description: 'Resources to generate', required: true },
        { name: 'useModules', type: 'boolean', description: 'Use AVM modules', required: false, default: true },
        { name: 'environment', type: 'string', description: 'Target environment', required: false, default: 'dev' },
      ],
      returns: { type: 'BicepFile[]', description: 'Bicep template files' },
      example: `
const generator = new BicepGenerator();
const files = await generator.generate({
  resources: [
    { type: 'Microsoft.Web/sites', name: 'webapp' },
    { type: 'Microsoft.Sql/servers', name: 'sqlserver' }
  ],
  useModules: true
});
      `.trim(),
      relatedSkills: ['AzureResourceMapper', 'CostEstimator'],
    });

    this.addSkill({
      id: 'api-generator',
      name: 'APIGenerator',
      description: 'Generates REST API endpoints with routing, validation, and documentation.',
      category: 'Code Generation',
      usedBy: ['CodeGenAgent'],
      parameters: [
        { name: 'endpoints', type: 'APIEndpoint[]', description: 'API endpoints to generate', required: true },
        { name: 'framework', type: 'string', description: 'API framework', required: false, default: 'express' },
        { name: 'validation', type: 'boolean', description: 'Include validation', required: false, default: true },
      ],
      returns: { type: 'SourceFile[]', description: 'API route files' },
      relatedSkills: ['TypeScriptGenerator', 'OpenAPIGenerator'],
    });

    // Test skills
    this.addSkill({
      id: 'unit-test-generator',
      name: 'UnitTestGenerator',
      description: 'Generates unit tests for functions, classes, and components.',
      category: 'Testing',
      usedBy: ['TestAgent'],
      parameters: [
        { name: 'sourceFile', type: 'SourceFile', description: 'Source file to test', required: true },
        { name: 'framework', type: 'string', description: 'Test framework', required: false, default: 'vitest' },
        { name: 'coverage', type: 'number', description: 'Target coverage %', required: false, default: 80 },
      ],
      returns: { type: 'TestFile', description: 'Unit test file' },
      relatedSkills: ['IntegrationTestGenerator', 'E2ETestGenerator'],
    });

    this.addSkill({
      id: 'integration-test-generator',
      name: 'IntegrationTestGenerator',
      description: 'Generates integration tests for API endpoints and service interactions.',
      category: 'Testing',
      usedBy: ['TestAgent'],
      parameters: [
        { name: 'components', type: 'Component[]', description: 'Components to test', required: true },
        { name: 'mockExternal', type: 'boolean', description: 'Mock external services', required: false, default: true },
      ],
      returns: { type: 'TestFile[]', description: 'Integration test files' },
      relatedSkills: ['UnitTestGenerator', 'MockGenerator'],
    });

    // Analysis skills
    this.addSkill({
      id: 'code-analyzer',
      name: 'CodeAnalyzer',
      description: 'Analyzes code for quality issues, complexity, and best practices.',
      category: 'Analysis',
      usedBy: ['ReviewAgent'],
      parameters: [
        { name: 'files', type: 'SourceFile[]', description: 'Files to analyze', required: true },
        { name: 'rules', type: 'LintRule[]', description: 'Rules to check', required: false },
      ],
      returns: { type: 'AnalysisReport', description: 'Analysis findings' },
      relatedSkills: ['SecurityScanner', 'StyleChecker'],
    });

    this.addSkill({
      id: 'security-scanner',
      name: 'SecurityScanner',
      description: 'Scans code for security vulnerabilities and secrets.',
      category: 'Security',
      usedBy: ['SecurityAgent', 'ReviewAgent'],
      parameters: [
        { name: 'files', type: 'SourceFile[]', description: 'Files to scan', required: true },
        { name: 'severity', type: 'string', description: 'Minimum severity', required: false, default: 'medium' },
      ],
      returns: { type: 'SecurityReport', description: 'Security findings' },
      relatedSkills: ['SecretDetector', 'ComplianceChecker'],
    });

    // Documentation skills
    this.addSkill({
      id: 'doc-generator',
      name: 'DocGenerator',
      description: 'Generates documentation from code and specifications.',
      category: 'Documentation',
      usedBy: ['DocAgent'],
      parameters: [
        { name: 'source', type: 'SourceFile[] | Spec', description: 'Source to document', required: true },
        { name: 'format', type: 'string', description: 'Output format', required: false, default: 'markdown' },
      ],
      returns: { type: 'Document[]', description: 'Generated documentation' },
      relatedSkills: ['MarkdownWriter', 'OpenAPIGenerator'],
    });

    // Planning skills
    this.addSkill({
      id: 'task-decomposer',
      name: 'TaskDecomposer',
      description: 'Breaks down requirements into manageable tasks.',
      category: 'Planning',
      usedBy: ['PlanAgent'],
      parameters: [
        { name: 'requirements', type: 'RequirementsDoc', description: 'Requirements to decompose', required: true },
        { name: 'maxDepth', type: 'number', description: 'Max task nesting', required: false, default: 3 },
      ],
      returns: { type: 'Task[]', description: 'Decomposed tasks' },
      relatedSkills: ['DependencyAnalyzer', 'EstimationEngine'],
    });
  }

  /**
   * Add skill
   */
  private addSkill(skill: SkillDocInfo): void {
    this.skills.push(skill);
  }

  /**
   * Generate skill index
   */
  generateIndex(): string {
    const lines: string[] = [];

    lines.push('# Skill Reference');
    lines.push('');
    lines.push('Complete reference for all AgenticCoder skills.');
    lines.push('');

    // Overview
    lines.push('## Overview');
    lines.push('');
    lines.push('| Skill | Category | Used By |');
    lines.push('|-------|----------|---------|');
    for (const skill of this.skills) {
      const usedBy = skill.usedBy.join(', ');
      lines.push(`| [${skill.name}](./${skill.id}.md) | ${skill.category} | ${usedBy} |`);
    }
    lines.push('');

    // By category
    const categories = [...new Set(this.skills.map(s => s.category))];
    for (const category of categories) {
      lines.push(`## ${category}`);
      lines.push('');
      const categorySkills = this.skills.filter(s => s.category === category);
      for (const skill of categorySkills) {
        lines.push(`- [${skill.name}](./${skill.id}.md) - ${skill.description.split('.')[0]}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate single skill doc
   */
  generateSkillDoc(skill: SkillDocInfo): string {
    const lines: string[] = [];

    lines.push(`# ${skill.name}`);
    lines.push('');
    lines.push(`**Category:** ${skill.category}  `);
    lines.push(`**Used by:** ${skill.usedBy.join(', ')}`);
    lines.push('');

    lines.push('## Description');
    lines.push('');
    lines.push(skill.description);
    lines.push('');

    // Parameters
    lines.push('## Parameters');
    lines.push('');
    lines.push('| Parameter | Type | Required | Default | Description |');
    lines.push('|-----------|------|----------|---------|-------------|');
    for (const param of skill.parameters) {
      const req = param.required ? 'Yes' : 'No';
      const def = param.default !== undefined ? `\`${JSON.stringify(param.default)}\`` : '-';
      lines.push(`| \`${param.name}\` | ${param.type} | ${req} | ${def} | ${param.description} |`);
    }
    lines.push('');

    // Returns
    lines.push('## Returns');
    lines.push('');
    lines.push(`**Type:** \`${skill.returns.type}\``);
    lines.push('');
    lines.push(skill.returns.description);
    lines.push('');

    // Example
    if (skill.example) {
      lines.push('## Example');
      lines.push('');
      lines.push('```typescript');
      lines.push(skill.example);
      lines.push('```');
      lines.push('');
    }

    // Related
    if (skill.relatedSkills && skill.relatedSkills.length > 0) {
      lines.push('## Related Skills');
      lines.push('');
      for (const related of skill.relatedSkills) {
        const relatedId = related.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1);
        lines.push(`- [${related}](./${relatedId}.md)`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('[← Back to Skill Index](./index.md)');

    return lines.join('\n');
  }

  /**
   * Generate all skill docs
   */
  async generateAll(outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(
      path.join(outputDir, 'index.md'),
      this.generateIndex(),
      'utf-8'
    );

    for (const skill of this.skills) {
      await fs.writeFile(
        path.join(outputDir, `${skill.id}.md`),
        this.generateSkillDoc(skill),
        'utf-8'
      );
    }
  }
}

/**
 * Create skill doc generator
 */
export function createSkillDocGenerator(): SkillDocGenerator {
  const generator = new SkillDocGenerator();
  generator.registerAllSkills();
  return generator;
}
```

### 3.3 API Doc Generator (`src/docs/reference/ApiDocGenerator.ts`)

```typescript
import * as fs from 'fs/promises';

/**
 * API endpoint
 */
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description?: string;
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  tags?: string[];
  auth?: boolean;
}

/**
 * API parameter
 */
export interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  type: string;
  required: boolean;
  description: string;
}

/**
 * Request body
 */
export interface ApiRequestBody {
  contentType: string;
  schema: object;
  example?: object;
}

/**
 * API response
 */
export interface ApiResponse {
  status: number;
  description: string;
  schema?: object;
  example?: object;
}

/**
 * API documentation generator
 */
export class ApiDocGenerator {
  private endpoints: ApiEndpoint[] = [];

  /**
   * Register endpoints
   */
  registerEndpoints(): void {
    // Project endpoints
    this.addEndpoint({
      method: 'POST',
      path: '/api/projects',
      summary: 'Create a new project',
      tags: ['Projects'],
      auth: true,
      requestBody: {
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            scenario: { type: 'string' },
          },
          required: ['name'],
        },
        example: { name: 'my-app', scenario: 'S01' },
      },
      responses: [
        { status: 201, description: 'Project created', example: { id: 'proj-123', name: 'my-app' } },
        { status: 400, description: 'Invalid request' },
      ],
    });

    this.addEndpoint({
      method: 'GET',
      path: '/api/projects/{id}',
      summary: 'Get project details',
      tags: ['Projects'],
      auth: true,
      parameters: [
        { name: 'id', in: 'path', type: 'string', required: true, description: 'Project ID' },
      ],
      responses: [
        { status: 200, description: 'Project details' },
        { status: 404, description: 'Project not found' },
      ],
    });

    // Execution endpoints
    this.addEndpoint({
      method: 'POST',
      path: '/api/projects/{id}/run',
      summary: 'Start project execution',
      tags: ['Execution'],
      auth: true,
      parameters: [
        { name: 'id', in: 'path', type: 'string', required: true, description: 'Project ID' },
      ],
      requestBody: {
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            scenario: { type: 'string' },
            phase: { type: 'number' },
            dryRun: { type: 'boolean' },
          },
        },
      },
      responses: [
        { status: 202, description: 'Execution started', example: { executionId: 'exec-456' } },
        { status: 400, description: 'Invalid configuration' },
      ],
    });

    this.addEndpoint({
      method: 'GET',
      path: '/api/executions/{id}/status',
      summary: 'Get execution status',
      tags: ['Execution'],
      auth: true,
      parameters: [
        { name: 'id', in: 'path', type: 'string', required: true, description: 'Execution ID' },
      ],
      responses: [
        { status: 200, description: 'Execution status', example: { status: 'running', progress: 45 } },
        { status: 404, description: 'Execution not found' },
      ],
    });

    // Agent endpoints
    this.addEndpoint({
      method: 'GET',
      path: '/api/agents',
      summary: 'List available agents',
      tags: ['Agents'],
      responses: [
        { status: 200, description: 'List of agents' },
      ],
    });

    // Webhook endpoints
    this.addEndpoint({
      method: 'POST',
      path: '/api/webhooks',
      summary: 'Register webhook',
      tags: ['Webhooks'],
      auth: true,
      requestBody: {
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            events: { type: 'array', items: { type: 'string' } },
          },
          required: ['url', 'events'],
        },
      },
      responses: [
        { status: 201, description: 'Webhook registered' },
      ],
    });
  }

  /**
   * Add endpoint
   */
  private addEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.push(endpoint);
  }

  /**
   * Generate markdown
   */
  generateMarkdown(): string {
    const lines: string[] = [];

    lines.push('# REST API Reference');
    lines.push('');
    lines.push('API reference for AgenticCoder REST endpoints.');
    lines.push('');

    // Base URL
    lines.push('## Base URL');
    lines.push('');
    lines.push('```');
    lines.push('https://api.agenticcoder.com/v1');
    lines.push('```');
    lines.push('');

    // Authentication
    lines.push('## Authentication');
    lines.push('');
    lines.push('Include your API key in the `Authorization` header:');
    lines.push('');
    lines.push('```');
    lines.push('Authorization: Bearer <your-api-key>');
    lines.push('```');
    lines.push('');

    // Endpoints by tag
    const tags = [...new Set(this.endpoints.flatMap(e => e.tags || ['Other']))];

    for (const tag of tags) {
      lines.push(`## ${tag}`);
      lines.push('');

      const tagEndpoints = this.endpoints.filter(e => e.tags?.includes(tag));

      for (const endpoint of tagEndpoints) {
        lines.push(`### ${endpoint.method} ${endpoint.path}`);
        lines.push('');
        lines.push(endpoint.summary);
        lines.push('');

        if (endpoint.auth) {
          lines.push('🔒 **Requires authentication**');
          lines.push('');
        }

        // Parameters
        if (endpoint.parameters && endpoint.parameters.length > 0) {
          lines.push('**Parameters:**');
          lines.push('');
          lines.push('| Name | In | Type | Required | Description |');
          lines.push('|------|----|----|----------|-------------|');
          for (const param of endpoint.parameters) {
            const req = param.required ? 'Yes' : 'No';
            lines.push(`| \`${param.name}\` | ${param.in} | ${param.type} | ${req} | ${param.description} |`);
          }
          lines.push('');
        }

        // Request body
        if (endpoint.requestBody) {
          lines.push('**Request Body:**');
          lines.push('');
          lines.push('```json');
          lines.push(JSON.stringify(endpoint.requestBody.example || endpoint.requestBody.schema, null, 2));
          lines.push('```');
          lines.push('');
        }

        // Responses
        lines.push('**Responses:**');
        lines.push('');
        for (const response of endpoint.responses) {
          lines.push(`- \`${response.status}\` - ${response.description}`);
          if (response.example) {
            lines.push('  ```json');
            lines.push('  ' + JSON.stringify(response.example));
            lines.push('  ```');
          }
        }
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Write to file
   */
  async writeToFile(outputPath: string): Promise<void> {
    const content = this.generateMarkdown();
    await fs.writeFile(outputPath, content, 'utf-8');
  }
}

/**
 * Create API doc generator
 */
export function createApiDocGenerator(): ApiDocGenerator {
  const generator = new ApiDocGenerator();
  generator.registerEndpoints();
  return generator;
}
```

---

## 📋 Acceptance Criteria

- [ ] Agent reference complete for all agents
- [ ] Skill reference complete for all skills
- [ ] API reference documents all endpoints
- [ ] Scenario details are accurate
- [ ] All cross-references work
- [ ] Mermaid diagrams render correctly
- [ ] Index pages link to all content

---

## 🔗 Navigation

← [02-PHASE-USER-GUIDE.md](02-PHASE-USER-GUIDE.md) | [04-PHASE-TROUBLESHOOTING.md](04-PHASE-TROUBLESHOOTING.md) →
