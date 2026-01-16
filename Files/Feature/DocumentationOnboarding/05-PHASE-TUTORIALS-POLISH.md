# Phase 5: Tutorials & Polish

**Phase ID:** F-DOC-P05  
**Feature:** DocumentationOnboarding  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 4 (Troubleshooting)

---

## 🎯 Phase Objectives

Deze phase implementeert de **Tutorials & Final Polish**:
- Step-by-step tutorials
- Video script generation
- Static site generation (VitePress/Docusaurus)
- Search index
- Contributing guidelines

---

## 📦 Deliverables

### 1. Directory Structure

```
docs/
├── tutorials/
│   ├── README.md              # Tutorials index
│   ├── building-todo-app.md   # Tutorial 1
│   ├── enterprise-project.md  # Tutorial 2
│   ├── custom-agents.md       # Tutorial 3
│   └── azure-deployment.md    # Tutorial 4
│
├── contributing/
│   ├── README.md              # Contributing index
│   ├── development-setup.md   # Dev environment
│   ├── code-style.md          # Code guidelines
│   └── pull-requests.md       # PR process
│
├── .vitepress/                # VitePress config
│   ├── config.ts
│   └── theme/
│
src/
├── docs/
│   └── tutorials/
│       ├── TutorialGenerator.ts
│       └── VideoScriptGenerator.ts
│
├── site/
│   ├── SiteGenerator.ts
│   └── SearchIndexGenerator.ts
```

---

## 🔧 Implementation Details

### 5.1 Tutorial Generator (`src/docs/tutorials/TutorialGenerator.ts`)

```typescript
import * as fs from 'fs/promises';

/**
 * Tutorial step
 */
export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  instruction: string;
  code?: {
    language: string;
    content: string;
    filename?: string;
  };
  expectedOutput?: string;
  tips?: string[];
  warnings?: string[];
  checkpoint?: string;
}

/**
 * Tutorial info
 */
export interface TutorialInfo {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  prerequisites: string[];
  objectives: string[];
  steps: TutorialStep[];
  summary: string;
  nextSteps: string[];
}

/**
 * Tutorial generator
 */
export class TutorialGenerator {
  private tutorials: TutorialInfo[] = [];

  /**
   * Register all tutorials
   */
  registerAllTutorials(): void {
    // Tutorial 1: Building a Todo App
    this.addTutorial({
      id: 'building-todo-app',
      title: 'Build a Todo App with AgenticCoder',
      description: 'Create a full-stack Todo application using AgenticCoder.',
      difficulty: 'beginner',
      duration: '30 minutes',
      prerequisites: [
        'Node.js 20+ installed',
        'AgenticCoder CLI installed',
        'Basic TypeScript knowledge',
      ],
      objectives: [
        'Initialize an AgenticCoder project',
        'Configure the S01 scenario',
        'Generate a Todo app',
        'Understand the generated code',
      ],
      steps: [
        {
          id: 1,
          title: 'Create Project Directory',
          description: 'Start by creating a new directory for your project.',
          instruction: 'Create a new directory and navigate into it.',
          code: {
            language: 'bash',
            content: `mkdir my-todo-app
cd my-todo-app`,
          },
          tips: ['Choose a meaningful name for your project'],
        },
        {
          id: 2,
          title: 'Initialize AgenticCoder',
          description: 'Initialize AgenticCoder in your project.',
          instruction: 'Run the init command to create configuration.',
          code: {
            language: 'bash',
            content: 'agentic init',
          },
          expectedOutput: `✓ Created agentic.config.json
✓ Created .agentic/ directory
✓ Ready to run!`,
          tips: ['You can edit agentic.config.json manually'],
        },
        {
          id: 3,
          title: 'Configure Your Project',
          description: 'Edit the configuration file to describe your Todo app.',
          instruction: 'Update agentic.config.json with your project details.',
          code: {
            language: 'json',
            content: `{
  "project": {
    "name": "my-todo-app",
    "description": "A simple todo application with React frontend and Node.js backend"
  },
  "scenario": {
    "id": "S01",
    "requirements": [
      "User can add todo items",
      "User can mark items as complete",
      "User can delete items",
      "Items persist in local storage"
    ]
  },
  "output": {
    "directory": "./generated"
  }
}`,
            filename: 'agentic.config.json',
          },
          tips: ['Be specific in your requirements', 'S01 is best for simple apps'],
        },
        {
          id: 4,
          title: 'Generate the Application',
          description: 'Run AgenticCoder to generate your Todo app.',
          instruction: 'Execute the run command.',
          code: {
            language: 'bash',
            content: 'agentic run',
          },
          expectedOutput: `⏳ Planning...
✓ Plan created (12 tasks)
⏳ Generating architecture...
✓ Architecture complete
⏳ Generating code...
✓ Code generated (15 files)
⏳ Running tests...
✓ 12/12 tests passed
✓ Complete!`,
          checkpoint: 'Code generated successfully',
          tips: ['Use --verbose for more details', 'This may take 2-5 minutes'],
        },
        {
          id: 5,
          title: 'Review Generated Code',
          description: 'Explore what AgenticCoder created.',
          instruction: 'Look at the generated directory structure.',
          code: {
            language: 'bash',
            content: `ls -la generated/
# or on Windows:
dir generated`,
          },
          expectedOutput: `generated/
├── src/
│   ├── components/
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   └── AddTodo.tsx
│   ├── hooks/
│   │   └── useTodos.ts
│   ├── types/
│   │   └── todo.ts
│   └── App.tsx
├── tests/
│   └── ...
├── package.json
└── README.md`,
        },
        {
          id: 6,
          title: 'Run the Application',
          description: 'Start the generated application.',
          instruction: 'Install dependencies and run the app.',
          code: {
            language: 'bash',
            content: `cd generated
npm install
npm run dev`,
          },
          expectedOutput: 'App running at http://localhost:3000',
          tips: ['The app includes hot reload'],
        },
      ],
      summary: 'You\'ve successfully created a Todo app using AgenticCoder!',
      nextSteps: [
        '[Customize the app](./customization.md)',
        '[Deploy to Azure](./azure-deployment.md)',
        '[Add authentication](../user-guide/scenarios.md#s02)',
      ],
    });

    // Tutorial 2: Enterprise Project
    this.addTutorial({
      id: 'enterprise-project',
      title: 'Building an Enterprise Application',
      description: 'Create a production-ready enterprise application with all features.',
      difficulty: 'advanced',
      duration: '60 minutes',
      prerequisites: [
        'Completed beginner tutorial',
        'Azure subscription',
        'GitHub account',
        'Docker installed',
      ],
      objectives: [
        'Use the S05 full enterprise scenario',
        'Configure Azure integration',
        'Set up CI/CD pipeline',
        'Deploy to Azure',
      ],
      steps: [
        {
          id: 1,
          title: 'Initialize Enterprise Project',
          description: 'Create a new enterprise project with the S05 scenario.',
          instruction: 'Initialize with enterprise settings.',
          code: {
            language: 'bash',
            content: `mkdir enterprise-app
cd enterprise-app
agentic init --scenario S05`,
          },
        },
        {
          id: 2,
          title: 'Configure Azure',
          description: 'Set up Azure authentication and configuration.',
          instruction: 'Configure Azure settings.',
          code: {
            language: 'bash',
            content: `# Login to Azure
az login

# Set subscription
az account set --subscription <your-subscription>

# Update config
agentic config set azure.subscriptionId <subscription-id>
agentic config set azure.resourceGroup enterprise-app-rg
agentic config set azure.location westeurope`,
          },
          tips: ['Create a dedicated resource group', 'Use a dev/test subscription first'],
        },
        {
          id: 3,
          title: 'Configure GitHub',
          description: 'Set up GitHub integration for CI/CD.',
          instruction: 'Configure GitHub settings.',
          code: {
            language: 'json',
            content: `{
  "github": {
    "enabled": true,
    "repository": "your-org/enterprise-app",
    "actions": true
  }
}`,
            filename: 'agentic.config.json (partial)',
          },
        },
        {
          id: 4,
          title: 'Run Full Generation',
          description: 'Generate the complete enterprise application.',
          instruction: 'Run AgenticCoder with all features.',
          code: {
            language: 'bash',
            content: 'agentic run --verbose',
          },
          tips: ['This will take 10-15 minutes', 'Monitor the agent progress'],
          warnings: ['Ensure sufficient Azure quota', 'Will create billable resources'],
        },
        {
          id: 5,
          title: 'Deploy Infrastructure',
          description: 'Deploy Azure infrastructure using generated Bicep.',
          instruction: 'Deploy the infrastructure.',
          code: {
            language: 'bash',
            content: `cd generated/infra
az deployment group create \\
  --resource-group enterprise-app-rg \\
  --template-file main.bicep \\
  --parameters main.parameters.json`,
          },
          checkpoint: 'Infrastructure deployed',
        },
        {
          id: 6,
          title: 'Deploy Application',
          description: 'Deploy the application to Azure.',
          instruction: 'Deploy using the generated scripts.',
          code: {
            language: 'bash',
            content: `# Build and push containers
./scripts/build.sh

# Deploy application
./scripts/deploy.sh`,
          },
        },
        {
          id: 7,
          title: 'Verify Deployment',
          description: 'Check that everything is working.',
          instruction: 'Verify the deployment.',
          code: {
            language: 'bash',
            content: `# Check status
agentic status --azure

# Open application
az webapp browse --name enterprise-app`,
          },
          expectedOutput: 'Application running at https://enterprise-app.azurewebsites.net',
        },
      ],
      summary: 'You\'ve deployed a full enterprise application to Azure!',
      nextSteps: [
        '[Configure monitoring](../user-guide/configuration.md#monitoring)',
        '[Set up alerts](../reference/api/alerts.md)',
        '[Scale the application](./scaling.md)',
      ],
    });

    // Tutorial 3: Custom Agents
    this.addTutorial({
      id: 'custom-agents',
      title: 'Creating Custom Agents',
      description: 'Extend AgenticCoder with your own agents.',
      difficulty: 'advanced',
      duration: '45 minutes',
      prerequisites: [
        'Strong TypeScript knowledge',
        'Understanding of AgenticCoder architecture',
        'Development environment set up',
      ],
      objectives: [
        'Understand the agent architecture',
        'Create a custom agent',
        'Register the agent',
        'Test your agent',
      ],
      steps: [
        {
          id: 1,
          title: 'Understand Agent Architecture',
          description: 'Learn how agents work in AgenticCoder.',
          instruction: 'Review the agent interface.',
          code: {
            language: 'typescript',
            content: `// Every agent implements this interface
interface Agent {
  id: string;
  name: string;
  description: string;
  
  // Inputs the agent accepts
  inputs: AgentInput[];
  
  // Outputs the agent produces
  outputs: AgentOutput[];
  
  // Main execution method
  execute(context: ExecutionContext): Promise<AgentResult>;
  
  // Handoff to next agents
  getNextAgents(result: AgentResult): string[];
}`,
          },
        },
        {
          id: 2,
          title: 'Create Agent Directory',
          description: 'Set up the directory for your custom agent.',
          instruction: 'Create the agent files.',
          code: {
            language: 'bash',
            content: `mkdir -p src/agents/custom
touch src/agents/custom/DocumentationAgent.ts`,
          },
        },
        {
          id: 3,
          title: 'Implement the Agent',
          description: 'Write your custom agent code.',
          instruction: 'Implement the agent class.',
          code: {
            language: 'typescript',
            content: `import { Agent, AgentInput, AgentOutput, ExecutionContext, AgentResult } from '@agenticcoder/core';

export class DocumentationAgent implements Agent {
  id = 'documentation-agent';
  name = 'Documentation Agent';
  description = 'Generates project documentation';
  
  inputs: AgentInput[] = [
    { name: 'sourceFiles', type: 'FileList', required: true },
    { name: 'template', type: 'string', required: false },
  ];
  
  outputs: AgentOutput[] = [
    { name: 'documentation', type: 'FileList' },
    { name: 'docIndex', type: 'DocIndex' },
  ];
  
  async execute(context: ExecutionContext): Promise<AgentResult> {
    const { sourceFiles, template } = context.inputs;
    
    // 1. Analyze source files
    const analysis = await this.analyzeCode(sourceFiles);
    
    // 2. Generate documentation
    const docs = await this.generateDocs(analysis, template);
    
    // 3. Create index
    const index = this.createIndex(docs);
    
    return {
      success: true,
      outputs: {
        documentation: docs,
        docIndex: index,
      },
    };
  }
  
  getNextAgents(result: AgentResult): string[] {
    return result.success ? ['review-agent'] : [];
  }
  
  private async analyzeCode(files: FileList): Promise<CodeAnalysis> {
    // Analysis logic here
    return { modules: [], functions: [], classes: [] };
  }
  
  private async generateDocs(analysis: CodeAnalysis, template?: string): Promise<FileList> {
    // Generation logic here
    return [];
  }
  
  private createIndex(docs: FileList): DocIndex {
    return { entries: [] };
  }
}`,
            filename: 'src/agents/custom/DocumentationAgent.ts',
          },
          tips: ['Keep agents focused on one task', 'Use clear input/output contracts'],
        },
        {
          id: 4,
          title: 'Register the Agent',
          description: 'Make your agent available to AgenticCoder.',
          instruction: 'Register in the agent registry.',
          code: {
            language: 'typescript',
            content: `// src/agents/custom/index.ts
import { AgentRegistry } from '@agenticcoder/core';
import { DocumentationAgent } from './DocumentationAgent';

export function registerCustomAgents(registry: AgentRegistry): void {
  registry.register(new DocumentationAgent());
}

// Usage in main config
// agentic.config.json
{
  "agents": {
    "custom": [
      "./src/agents/custom"
    ]
  }
}`,
          },
        },
        {
          id: 5,
          title: 'Test Your Agent',
          description: 'Write tests for your agent.',
          instruction: 'Create unit tests.',
          code: {
            language: 'typescript',
            content: `import { describe, it, expect } from 'vitest';
import { DocumentationAgent } from './DocumentationAgent';
import { createMockContext } from '@agenticcoder/testing';

describe('DocumentationAgent', () => {
  it('should generate documentation', async () => {
    const agent = new DocumentationAgent();
    const context = createMockContext({
      inputs: {
        sourceFiles: [
          { path: 'src/index.ts', content: 'export const hello = () => "world";' }
        ],
      },
    });
    
    const result = await agent.execute(context);
    
    expect(result.success).toBe(true);
    expect(result.outputs.documentation).toBeDefined();
    expect(result.outputs.documentation.length).toBeGreaterThan(0);
  });
  
  it('should handle empty input', async () => {
    const agent = new DocumentationAgent();
    const context = createMockContext({
      inputs: { sourceFiles: [] },
    });
    
    const result = await agent.execute(context);
    
    expect(result.success).toBe(true);
    expect(result.outputs.documentation).toHaveLength(0);
  });
});`,
            filename: 'src/agents/custom/DocumentationAgent.test.ts',
          },
        },
        {
          id: 6,
          title: 'Use Your Agent',
          description: 'Include your agent in a run.',
          instruction: 'Configure and run with your agent.',
          code: {
            language: 'bash',
            content: `# Run with your custom agent
agentic run --agents PlanAgent,CodeGenAgent,DocumentationAgent

# Or configure in config
# "execution": { "agents": ["..."] }`,
          },
        },
      ],
      summary: 'You\'ve created a custom agent for AgenticCoder!',
      nextSteps: [
        '[Publish your agent](./publishing-agents.md)',
        '[Create agent skills](./custom-skills.md)',
        '[Agent best practices](../reference/agents/best-practices.md)',
      ],
    });

    // Tutorial 4: Azure Deployment
    this.addTutorial({
      id: 'azure-deployment',
      title: 'Deploying to Azure',
      description: 'Deploy your AgenticCoder project to Azure.',
      difficulty: 'intermediate',
      duration: '30 minutes',
      prerequisites: [
        'Azure subscription',
        'Azure CLI installed',
        'Basic Azure knowledge',
      ],
      objectives: [
        'Configure Azure integration',
        'Generate Bicep templates',
        'Deploy infrastructure',
        'Deploy application',
      ],
      steps: [
        {
          id: 1,
          title: 'Configure Azure Integration',
          description: 'Set up Azure in your project.',
          instruction: 'Update configuration for Azure.',
          code: {
            language: 'json',
            content: `{
  "scenario": {
    "id": "A01"
  },
  "azure": {
    "subscriptionId": "your-subscription-id",
    "resourceGroup": "my-app-rg",
    "location": "westeurope",
    "naming": {
      "prefix": "myapp",
      "environment": "dev"
    }
  }
}`,
            filename: 'agentic.config.json',
          },
        },
        {
          id: 2,
          title: 'Generate Azure Infrastructure',
          description: 'Generate Bicep templates for Azure resources.',
          instruction: 'Run generation.',
          code: {
            language: 'bash',
            content: 'agentic run',
          },
          expectedOutput: `Generated files:
- infra/main.bicep
- infra/modules/*.bicep
- infra/main.parameters.json`,
        },
        {
          id: 3,
          title: 'Review Generated Bicep',
          description: 'Understand the generated infrastructure.',
          instruction: 'Review the main Bicep file.',
          code: {
            language: 'bicep',
            content: `// Example generated main.bicep
targetScope = 'subscription'

@description('The environment name')
param environment string = 'dev'

@description('The location for resources')
param location string = 'westeurope'

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'myapp-\${environment}-rg'
  location: location
}

module webApp 'modules/web-app.bicep' = {
  scope: rg
  name: 'webApp'
  params: {
    location: location
    appName: 'myapp-\${environment}'
  }
}`,
          },
        },
        {
          id: 4,
          title: 'Deploy Infrastructure',
          description: 'Deploy to Azure.',
          instruction: 'Run the deployment.',
          code: {
            language: 'bash',
            content: `# Create resource group
az group create --name my-app-rg --location westeurope

# Deploy infrastructure
az deployment group create \\
  --resource-group my-app-rg \\
  --template-file generated/infra/main.bicep \\
  --parameters generated/infra/main.parameters.json`,
          },
          checkpoint: 'Infrastructure deployed',
          tips: ['Use --what-if to preview changes'],
        },
        {
          id: 5,
          title: 'Deploy Application',
          description: 'Deploy the application code.',
          instruction: 'Deploy to the provisioned resources.',
          code: {
            language: 'bash',
            content: `# Build the application
cd generated
npm run build

# Deploy to Azure Web App
az webapp deploy \\
  --resource-group my-app-rg \\
  --name myapp-dev \\
  --src-path ./dist`,
          },
        },
        {
          id: 6,
          title: 'Verify Deployment',
          description: 'Check the deployment status.',
          instruction: 'Open and test the application.',
          code: {
            language: 'bash',
            content: `# Check status
agentic status --azure

# Open in browser
az webapp browse --resource-group my-app-rg --name myapp-dev`,
          },
        },
      ],
      summary: 'Your application is now running on Azure!',
      nextSteps: [
        '[Set up CI/CD](../user-guide/scenarios.md#a03)',
        '[Configure monitoring](./monitoring.md)',
        '[Scale your app](./scaling.md)',
      ],
    });
  }

  /**
   * Add tutorial
   */
  private addTutorial(tutorial: TutorialInfo): void {
    this.tutorials.push(tutorial);
  }

  /**
   * Generate tutorial markdown
   */
  generateTutorialMarkdown(tutorial: TutorialInfo): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${tutorial.title}`);
    lines.push('');
    lines.push(tutorial.description);
    lines.push('');

    // Meta info
    lines.push('| Property | Value |');
    lines.push('|----------|-------|');
    lines.push(`| Difficulty | ${this.getDifficultyBadge(tutorial.difficulty)} |`);
    lines.push(`| Duration | ${tutorial.duration} |`);
    lines.push('');

    // Prerequisites
    lines.push('## Prerequisites');
    lines.push('');
    for (const prereq of tutorial.prerequisites) {
      lines.push(`- ${prereq}`);
    }
    lines.push('');

    // Objectives
    lines.push('## What You\'ll Learn');
    lines.push('');
    for (const obj of tutorial.objectives) {
      lines.push(`- ${obj}`);
    }
    lines.push('');

    // Steps
    lines.push('## Steps');
    lines.push('');

    for (const step of tutorial.steps) {
      lines.push(`### Step ${step.id}: ${step.title}`);
      lines.push('');
      lines.push(step.description);
      lines.push('');
      lines.push(`**${step.instruction}**`);
      lines.push('');

      if (step.code) {
        if (step.code.filename) {
          lines.push(`\`${step.code.filename}\`:`);
          lines.push('');
        }
        lines.push(`\`\`\`${step.code.language}`);
        lines.push(step.code.content);
        lines.push('```');
        lines.push('');
      }

      if (step.expectedOutput) {
        lines.push('**Expected output:**');
        lines.push('');
        lines.push('```');
        lines.push(step.expectedOutput);
        lines.push('```');
        lines.push('');
      }

      if (step.tips && step.tips.length > 0) {
        lines.push('> 💡 **Tips:**');
        for (const tip of step.tips) {
          lines.push(`> - ${tip}`);
        }
        lines.push('');
      }

      if (step.warnings && step.warnings.length > 0) {
        lines.push('> ⚠️ **Warnings:**');
        for (const warning of step.warnings) {
          lines.push(`> - ${warning}`);
        }
        lines.push('');
      }

      if (step.checkpoint) {
        lines.push(`✅ **Checkpoint:** ${step.checkpoint}`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(tutorial.summary);
    lines.push('');

    // Next steps
    lines.push('## Next Steps');
    lines.push('');
    for (const next of tutorial.nextSteps) {
      lines.push(`- ${next}`);
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Get difficulty badge
   */
  private getDifficultyBadge(difficulty: string): string {
    const badges: Record<string, string> = {
      beginner: '🟢 Beginner',
      intermediate: '🟡 Intermediate',
      advanced: '🔴 Advanced',
    };
    return badges[difficulty] || difficulty;
  }

  /**
   * Generate index
   */
  generateIndex(): string {
    const lines: string[] = [];

    lines.push('# Tutorials');
    lines.push('');
    lines.push('Step-by-step guides to learn AgenticCoder.');
    lines.push('');

    // By difficulty
    const byDifficulty = {
      beginner: this.tutorials.filter(t => t.difficulty === 'beginner'),
      intermediate: this.tutorials.filter(t => t.difficulty === 'intermediate'),
      advanced: this.tutorials.filter(t => t.difficulty === 'advanced'),
    };

    if (byDifficulty.beginner.length > 0) {
      lines.push('## 🟢 Beginner');
      lines.push('');
      for (const t of byDifficulty.beginner) {
        lines.push(`- [${t.title}](./${t.id}.md) - ${t.duration}`);
        lines.push(`  ${t.description}`);
      }
      lines.push('');
    }

    if (byDifficulty.intermediate.length > 0) {
      lines.push('## 🟡 Intermediate');
      lines.push('');
      for (const t of byDifficulty.intermediate) {
        lines.push(`- [${t.title}](./${t.id}.md) - ${t.duration}`);
        lines.push(`  ${t.description}`);
      }
      lines.push('');
    }

    if (byDifficulty.advanced.length > 0) {
      lines.push('## 🔴 Advanced');
      lines.push('');
      for (const t of byDifficulty.advanced) {
        lines.push(`- [${t.title}](./${t.id}.md) - ${t.duration}`);
        lines.push(`  ${t.description}`);
      }
      lines.push('');
    }

    // Learning path
    lines.push('## 📚 Suggested Learning Path');
    lines.push('');
    lines.push('1. Start with [Building a Todo App](./building-todo-app.md)');
    lines.push('2. Move to [Azure Deployment](./azure-deployment.md)');
    lines.push('3. Try [Enterprise Project](./enterprise-project.md)');
    lines.push('4. Explore [Custom Agents](./custom-agents.md)');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Write all tutorials
   */
  async writeAll(outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    // Write index
    await fs.writeFile(`${outputDir}/README.md`, this.generateIndex(), 'utf-8');

    // Write each tutorial
    for (const tutorial of this.tutorials) {
      const content = this.generateTutorialMarkdown(tutorial);
      await fs.writeFile(`${outputDir}/${tutorial.id}.md`, content, 'utf-8');
    }
  }
}

/**
 * Create tutorial generator
 */
export function createTutorialGenerator(): TutorialGenerator {
  const generator = new TutorialGenerator();
  generator.registerAllTutorials();
  return generator;
}
```

---

### 5.2 Site Generator (`src/site/SiteGenerator.ts`)

```typescript
import * as fs from 'fs/promises';

/**
 * Site config
 */
export interface SiteConfig {
  title: string;
  description: string;
  base: string;
  theme: 'vitepress' | 'docusaurus';
  nav: NavItem[];
  sidebar: SidebarConfig;
  socialLinks?: SocialLink[];
  footer?: FooterConfig;
  search?: SearchConfig;
}

/**
 * Nav item
 */
export interface NavItem {
  text: string;
  link: string;
  activeMatch?: string;
}

/**
 * Sidebar config
 */
export interface SidebarConfig {
  [path: string]: SidebarGroup[];
}

/**
 * Sidebar group
 */
export interface SidebarGroup {
  text: string;
  collapsed?: boolean;
  items: SidebarItem[];
}

/**
 * Sidebar item
 */
export interface SidebarItem {
  text: string;
  link: string;
}

/**
 * Social link
 */
export interface SocialLink {
  icon: string;
  link: string;
}

/**
 * Footer config
 */
export interface FooterConfig {
  message?: string;
  copyright?: string;
}

/**
 * Search config
 */
export interface SearchConfig {
  provider: 'local' | 'algolia';
  algolia?: {
    appId: string;
    apiKey: string;
    indexName: string;
  };
}

/**
 * Site generator
 */
export class SiteGenerator {
  /**
   * Generate VitePress config
   */
  generateVitePressConfig(config: SiteConfig): string {
    return `import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '${config.title}',
  description: '${config.description}',
  base: '${config.base}',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: ${JSON.stringify(config.nav, null, 6)},
    
    sidebar: ${JSON.stringify(config.sidebar, null, 6)},
    
    socialLinks: ${JSON.stringify(config.socialLinks || [], null, 6)},
    
    footer: {
      message: '${config.footer?.message || 'Released under the MIT License.'}',
      copyright: '${config.footer?.copyright || 'Copyright © 2024'}',
    },
    
    search: {
      provider: '${config.search?.provider || 'local'}',
      ${config.search?.algolia ? `options: ${JSON.stringify(config.search.algolia, null, 8)}` : ''}
    },
    
    editLink: {
      pattern: 'https://github.com/org/agenticcoder/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    
    lastUpdated: {
      text: 'Last updated',
    },
  },
  
  markdown: {
    lineNumbers: true,
    container: {
      tipLabel: 'TIP',
      warningLabel: 'WARNING',
      dangerLabel: 'DANGER',
      infoLabel: 'INFO',
      detailsLabel: 'Details',
    },
  },
})`;
  }

  /**
   * Generate default config
   */
  generateDefaultConfig(): SiteConfig {
    return {
      title: 'AgenticCoder',
      description: 'AI-powered code generation platform',
      base: '/',
      theme: 'vitepress',
      nav: [
        { text: 'Guide', link: '/getting-started/', activeMatch: '/getting-started/' },
        { text: 'Reference', link: '/reference/', activeMatch: '/reference/' },
        { text: 'Tutorials', link: '/tutorials/', activeMatch: '/tutorials/' },
      ],
      sidebar: {
        '/getting-started/': [
          {
            text: 'Getting Started',
            items: [
              { text: 'Introduction', link: '/getting-started/' },
              { text: 'Installation', link: '/getting-started/installation' },
              { text: 'Quick Start', link: '/getting-started/quick-start' },
              { text: 'Concepts', link: '/getting-started/concepts' },
            ],
          },
        ],
        '/user-guide/': [
          {
            text: 'User Guide',
            items: [
              { text: 'CLI Commands', link: '/user-guide/cli-commands' },
              { text: 'Configuration', link: '/user-guide/configuration' },
              { text: 'Scenarios', link: '/user-guide/scenarios' },
            ],
          },
        ],
        '/reference/': [
          {
            text: 'Agents',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/reference/agents/' },
              { text: 'PlanAgent', link: '/reference/agents/plan-agent' },
              { text: 'CodeGenAgent', link: '/reference/agents/codegen-agent' },
            ],
          },
          {
            text: 'Skills',
            collapsed: true,
            items: [
              { text: 'Overview', link: '/reference/skills/' },
            ],
          },
          {
            text: 'API',
            collapsed: true,
            items: [
              { text: 'REST API', link: '/reference/api/' },
            ],
          },
        ],
        '/tutorials/': [
          {
            text: 'Tutorials',
            items: [
              { text: 'Overview', link: '/tutorials/' },
              { text: 'Todo App', link: '/tutorials/building-todo-app' },
              { text: 'Azure Deployment', link: '/tutorials/azure-deployment' },
              { text: 'Enterprise Project', link: '/tutorials/enterprise-project' },
              { text: 'Custom Agents', link: '/tutorials/custom-agents' },
            ],
          },
        ],
        '/troubleshooting/': [
          {
            text: 'Troubleshooting',
            items: [
              { text: 'Overview', link: '/troubleshooting/' },
              { text: 'Common Errors', link: '/troubleshooting/common-errors' },
              { text: 'Error Codes', link: '/troubleshooting/error-codes' },
              { text: 'Debugging', link: '/troubleshooting/debugging' },
              { text: 'Support', link: '/troubleshooting/support' },
            ],
          },
        ],
      },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/org/agenticcoder' },
        { icon: 'discord', link: 'https://discord.gg/agenticcoder' },
      ],
      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2024 AgenticCoder',
      },
      search: {
        provider: 'local',
      },
    };
  }

  /**
   * Generate package.json for docs site
   */
  generatePackageJson(): string {
    return `{
  "name": "agenticcoder-docs",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vitepress dev docs",
    "build": "vitepress build docs",
    "preview": "vitepress preview docs",
    "search-index": "node scripts/build-search-index.js"
  },
  "devDependencies": {
    "vitepress": "^1.3.0",
    "vue": "^3.4.0"
  }
}`;
  }

  /**
   * Write site config
   */
  async writeSiteConfig(outputDir: string, config?: SiteConfig): Promise<void> {
    const siteConfig = config || this.generateDefaultConfig();
    
    // Create directories
    await fs.mkdir(`${outputDir}/.vitepress`, { recursive: true });
    
    // Write config
    await fs.writeFile(
      `${outputDir}/.vitepress/config.ts`,
      this.generateVitePressConfig(siteConfig),
      'utf-8'
    );
    
    // Write package.json
    await fs.writeFile(
      `${outputDir}/package.json`,
      this.generatePackageJson(),
      'utf-8'
    );
  }
}
```

---

## 📄 Contributing Documentation

### `docs/contributing/README.md`

```markdown
# Contributing to AgenticCoder

Thank you for your interest in contributing!

## Quick Links

- [Development Setup](./development-setup.md)
- [Code Style Guide](./code-style.md)
- [Pull Request Process](./pull-requests.md)

## Ways to Contribute

### 🐛 Report Bugs
- Search existing issues first
- Use the bug report template
- Include reproduction steps

### 💡 Suggest Features
- Describe the use case
- Explain expected behavior
- Consider implementation approach

### 📝 Improve Documentation
- Fix typos and errors
- Add examples
- Improve clarity

### 💻 Submit Code
- Follow the code style guide
- Write tests
- Update documentation

## Getting Started

1. Fork the repository
2. Clone your fork
3. Set up development environment
4. Create a feature branch
5. Make your changes
6. Submit a pull request

See [Development Setup](./development-setup.md) for details.

## Code of Conduct

Please read and follow our [Code of Conduct](../CODE_OF_CONDUCT.md).
```

### `docs/contributing/development-setup.md`

```markdown
# Development Setup

Set up your development environment for contributing.

## Prerequisites

- Node.js 20+
- pnpm 8+
- Git
- VS Code (recommended)

## Setup Steps

### 1. Fork and Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR-USERNAME/agenticcoder.git
cd agenticcoder
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build

```bash
pnpm build
```

### 4. Run Tests

```bash
pnpm test
```

### 5. Start Development

```bash
pnpm dev
```

## VS Code Setup

Install recommended extensions:
- ESLint
- Prettier
- TypeScript

Open workspace settings: `Ctrl+Shift+P` → "Open Workspace Settings"

## Project Structure

```
agenticcoder/
├── packages/
│   ├── cli/           # CLI application
│   ├── core/          # Core library
│   ├── agents/        # Agent implementations
│   └── skills/        # Skill implementations
├── docs/              # Documentation
├── tests/             # Integration tests
└── scripts/           # Build scripts
```

## Running Locally

```bash
# Link CLI globally
pnpm link --global

# Test CLI
agentic --help
```
```

---

## 📋 Acceptance Criteria

- [ ] All tutorials are complete and tested
- [ ] VitePress/Docusaurus site builds
- [ ] Search works correctly
- [ ] Navigation is intuitive
- [ ] Contributing docs are clear
- [ ] All links work
- [ ] Code samples are correct

---

## 🔗 Navigation

← [04-PHASE-TROUBLESHOOTING.md](04-PHASE-TROUBLESHOOTING.md) | [../README.md](../README.md) →
