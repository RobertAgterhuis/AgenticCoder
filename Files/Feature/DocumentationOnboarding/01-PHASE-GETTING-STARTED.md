# Phase 1: Getting Started Documentation

**Phase ID:** F-DOC-P01  
**Feature:** DocumentationOnboarding  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** None (can start immediately)

---

## 🎯 Phase Objectives

Deze phase implementeert de **Getting Started** documentatie:
- Installation guide voor alle platforms
- Quick Start (5-minuten tutorial)
- Your First Project walkthrough
- Core Concepts uitleg
- Prerequisites checklist

---

## 📦 Deliverables

### 1. Directory Structure

```
docs/
├── getting-started/
│   ├── README.md              # Landing page
│   ├── prerequisites.md       # What you need
│   ├── installation.md        # Install guide
│   ├── quick-start.md         # 5-minute tutorial
│   ├── your-first-project.md  # Step-by-step
│   └── concepts.md            # Core concepts
│
src/
├── docs/
│   ├── generator/
│   │   ├── DocGenerator.ts
│   │   ├── TemplateEngine.ts
│   │   └── ContentBuilder.ts
│   └── templates/
│       ├── getting-started/
│       │   └── *.hbs
│       └── partials/
│           └── *.hbs
```

---

## 🔧 Implementation Details

### 1.1 Template Engine (`src/docs/generator/TemplateEngine.ts`)

```typescript
import Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Template data context
 */
export interface TemplateContext {
  /** Project name */
  projectName: string;
  
  /** Version */
  version: string;
  
  /** Platform specific content */
  platform?: 'windows' | 'macos' | 'linux';
  
  /** Custom variables */
  variables: Record<string, unknown>;
  
  /** Partials to include */
  partials?: string[];
}

/**
 * Template engine for documentation generation
 */
export class TemplateEngine {
  private handlebars: typeof Handlebars;
  private templatesDir: string;
  private partialsDir: string;
  private loadedPartials: Set<string> = new Set();

  constructor(templatesDir: string) {
    this.handlebars = Handlebars.create();
    this.templatesDir = templatesDir;
    this.partialsDir = path.join(templatesDir, 'partials');
    this.registerHelpers();
  }

  /**
   * Initialize and load partials
   */
  async initialize(): Promise<void> {
    await this.loadPartials();
  }

  /**
   * Load all partials
   */
  private async loadPartials(): Promise<void> {
    try {
      const files = await fs.readdir(this.partialsDir);
      
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const name = file.replace('.hbs', '');
          const content = await fs.readFile(
            path.join(this.partialsDir, file),
            'utf-8'
          );
          this.handlebars.registerPartial(name, content);
          this.loadedPartials.add(name);
        }
      }
    } catch {
      // Partials dir may not exist
    }
  }

  /**
   * Register custom helpers
   */
  private registerHelpers(): void {
    // Platform-specific content
    this.handlebars.registerHelper('ifPlatform', function(
      this: TemplateContext,
      platform: string,
      options: Handlebars.HelperOptions
    ) {
      if (this.platform === platform || !this.platform) {
        return options.fn(this);
      }
      return '';
    });

    // Code block helper
    this.handlebars.registerHelper('codeBlock', function(
      language: string,
      code: string
    ) {
      return new Handlebars.SafeString(
        `\`\`\`${language}\n${code}\n\`\`\``
      );
    });

    // Include file helper
    this.handlebars.registerHelper('includeFile', function(
      this: TemplateContext,
      filePath: string
    ) {
      // Will be resolved at render time
      return `{{> ${filePath}}}`;
    });

    // Table of contents helper
    this.handlebars.registerHelper('toc', function(
      items: Array<{ title: string; anchor: string; level?: number }>
    ) {
      const lines = items.map(item => {
        const indent = '  '.repeat((item.level || 1) - 1);
        return `${indent}- [${item.title}](#${item.anchor})`;
      });
      return new Handlebars.SafeString(lines.join('\n'));
    });

    // Version comparison
    this.handlebars.registerHelper('versionGte', function(
      this: TemplateContext,
      version: string,
      options: Handlebars.HelperOptions
    ) {
      const current = this.version.split('.').map(Number);
      const compare = version.split('.').map(Number);
      
      for (let i = 0; i < 3; i++) {
        if ((current[i] || 0) > (compare[i] || 0)) return options.fn(this);
        if ((current[i] || 0) < (compare[i] || 0)) return '';
      }
      return options.fn(this);
    });

    // Date formatting
    this.handlebars.registerHelper('formatDate', function(date: Date | string) {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0];
    });

    // Emoji helper
    this.handlebars.registerHelper('emoji', function(name: string) {
      const emojis: Record<string, string> = {
        check: '✅',
        cross: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        tip: '💡',
        note: '📝',
        important: '❗',
        rocket: '🚀',
        book: '📖',
        gear: '⚙️',
      };
      return emojis[name] || '';
    });
  }

  /**
   * Render template
   */
  async render(
    templateName: string,
    context: TemplateContext
  ): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    const template = this.handlebars.compile(templateContent);
    return template(context);
  }

  /**
   * Render from string
   */
  renderString(template: string, context: TemplateContext): string {
    const compiled = this.handlebars.compile(template);
    return compiled(context);
  }

  /**
   * Register custom partial
   */
  registerPartial(name: string, content: string): void {
    this.handlebars.registerPartial(name, content);
    this.loadedPartials.add(name);
  }

  /**
   * Get available partials
   */
  getPartials(): string[] {
    return Array.from(this.loadedPartials);
  }
}

/**
 * Create template engine
 */
export function createTemplateEngine(templatesDir: string): TemplateEngine {
  return new TemplateEngine(templatesDir);
}
```

### 1.2 Content Builder (`src/docs/generator/ContentBuilder.ts`)

```typescript
import { TemplateEngine, TemplateContext } from './TemplateEngine';

/**
 * Document section
 */
export interface DocSection {
  id: string;
  title: string;
  content: string;
  level: number;
  children?: DocSection[];
}

/**
 * Document metadata
 */
export interface DocMetadata {
  title: string;
  description?: string;
  author?: string;
  lastUpdated?: Date;
  tags?: string[];
  category?: string;
  order?: number;
}

/**
 * Built document
 */
export interface BuiltDocument {
  metadata: DocMetadata;
  frontmatter: string;
  content: string;
  sections: DocSection[];
  toc: string;
}

/**
 * Content builder for documentation
 */
export class ContentBuilder {
  private sections: DocSection[] = [];
  private metadata: DocMetadata;
  private templateEngine: TemplateEngine;

  constructor(metadata: DocMetadata, templateEngine: TemplateEngine) {
    this.metadata = metadata;
    this.templateEngine = templateEngine;
  }

  /**
   * Add section
   */
  addSection(section: Omit<DocSection, 'children'>): ContentBuilder {
    this.sections.push({ ...section, children: [] });
    return this;
  }

  /**
   * Add subsection to last section
   */
  addSubsection(subsection: Omit<DocSection, 'children'>): ContentBuilder {
    const lastSection = this.sections[this.sections.length - 1];
    if (lastSection) {
      lastSection.children = lastSection.children || [];
      lastSection.children.push({ ...subsection, children: [] });
    }
    return this;
  }

  /**
   * Add text content
   */
  addText(text: string): ContentBuilder {
    return this.addSection({
      id: `text-${Date.now()}`,
      title: '',
      content: text,
      level: 0,
    });
  }

  /**
   * Add code block
   */
  addCodeBlock(language: string, code: string, title?: string): ContentBuilder {
    const content = `\`\`\`${language}\n${code}\n\`\`\``;
    return this.addSection({
      id: `code-${Date.now()}`,
      title: title || '',
      content,
      level: 0,
    });
  }

  /**
   * Add note/warning/tip
   */
  addAdmonition(
    type: 'note' | 'tip' | 'warning' | 'danger' | 'info',
    content: string,
    title?: string
  ): ContentBuilder {
    const icons: Record<string, string> = {
      note: '📝',
      tip: '💡',
      warning: '⚠️',
      danger: '🚨',
      info: 'ℹ️',
    };

    const admonition = `
> ${icons[type]} **${title || type.charAt(0).toUpperCase() + type.slice(1)}**
> 
> ${content.split('\n').join('\n> ')}
`;

    return this.addSection({
      id: `admonition-${Date.now()}`,
      title: '',
      content: admonition.trim(),
      level: 0,
    });
  }

  /**
   * Add table
   */
  addTable(
    headers: string[],
    rows: string[][],
    alignment?: Array<'left' | 'center' | 'right'>
  ): ContentBuilder {
    const alignMap = { left: ':--', center: ':-:', right: '--:' };
    const sep = alignment
      ? alignment.map(a => alignMap[a])
      : headers.map(() => '---');

    const lines = [
      `| ${headers.join(' | ')} |`,
      `| ${sep.join(' | ')} |`,
      ...rows.map(row => `| ${row.join(' | ')} |`),
    ];

    return this.addSection({
      id: `table-${Date.now()}`,
      title: '',
      content: lines.join('\n'),
      level: 0,
    });
  }

  /**
   * Add from template
   */
  async addFromTemplate(
    templateName: string,
    context: Partial<TemplateContext>
  ): ContentBuilder {
    const fullContext: TemplateContext = {
      projectName: this.metadata.title,
      version: '1.0.0',
      variables: {},
      ...context,
    };

    const content = await this.templateEngine.render(templateName, fullContext);
    return this.addText(content);
  }

  /**
   * Build final document
   */
  build(): BuiltDocument {
    const frontmatter = this.buildFrontmatter();
    const toc = this.buildToc();
    const content = this.buildContent();

    return {
      metadata: this.metadata,
      frontmatter,
      content,
      sections: this.sections,
      toc,
    };
  }

  /**
   * Build frontmatter
   */
  private buildFrontmatter(): string {
    const fm: Record<string, unknown> = {
      title: this.metadata.title,
    };

    if (this.metadata.description) fm.description = this.metadata.description;
    if (this.metadata.tags) fm.tags = this.metadata.tags;
    if (this.metadata.lastUpdated) {
      fm.lastUpdated = this.metadata.lastUpdated.toISOString().split('T')[0];
    }
    if (this.metadata.order !== undefined) fm.order = this.metadata.order;

    const yaml = Object.entries(fm)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');

    return `---\n${yaml}\n---`;
  }

  /**
   * Build table of contents
   */
  private buildToc(): string {
    const items: string[] = [];

    const addItems = (sections: DocSection[], depth: number = 0) => {
      for (const section of sections) {
        if (section.title && section.level > 0) {
          const indent = '  '.repeat(depth);
          const anchor = section.id || this.slugify(section.title);
          items.push(`${indent}- [${section.title}](#${anchor})`);
        }
        if (section.children) {
          addItems(section.children, depth + 1);
        }
      }
    };

    addItems(this.sections);
    return items.join('\n');
  }

  /**
   * Build content
   */
  private buildContent(): string {
    const lines: string[] = [];

    const addContent = (sections: DocSection[]) => {
      for (const section of sections) {
        if (section.title && section.level > 0) {
          const heading = '#'.repeat(section.level);
          lines.push(`${heading} ${section.title}`);
          lines.push('');
        }
        if (section.content) {
          lines.push(section.content);
          lines.push('');
        }
        if (section.children) {
          addContent(section.children);
        }
      }
    };

    addContent(this.sections);
    return lines.join('\n').trim();
  }

  /**
   * Slugify title for anchor
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

/**
 * Create content builder
 */
export function createContentBuilder(
  metadata: DocMetadata,
  templateEngine: TemplateEngine
): ContentBuilder {
  return new ContentBuilder(metadata, templateEngine);
}
```

### 1.3 Doc Generator (`src/docs/generator/DocGenerator.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { TemplateEngine, TemplateContext } from './TemplateEngine';
import { ContentBuilder, BuiltDocument, DocMetadata } from './ContentBuilder';

/**
 * Generation options
 */
export interface GenerationOptions {
  outputDir: string;
  platform?: 'windows' | 'macos' | 'linux' | 'all';
  version: string;
  includeApi?: boolean;
  baseUrl?: string;
}

/**
 * Generated file info
 */
export interface GeneratedFile {
  path: string;
  title: string;
  category: string;
  size: number;
}

/**
 * Documentation generator
 */
export class DocGenerator {
  private templateEngine: TemplateEngine;
  private options: GenerationOptions;
  private generatedFiles: GeneratedFile[] = [];

  constructor(templatesDir: string, options: GenerationOptions) {
    this.templateEngine = new TemplateEngine(templatesDir);
    this.options = options;
  }

  /**
   * Initialize generator
   */
  async initialize(): Promise<void> {
    await this.templateEngine.initialize();
    await fs.mkdir(this.options.outputDir, { recursive: true });
  }

  /**
   * Generate all getting started docs
   */
  async generateGettingStarted(): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const outputDir = path.join(this.options.outputDir, 'getting-started');
    await fs.mkdir(outputDir, { recursive: true });

    // Landing page
    files.push(await this.generateLandingPage(outputDir));

    // Prerequisites
    files.push(await this.generatePrerequisites(outputDir));

    // Installation
    files.push(await this.generateInstallation(outputDir));

    // Quick Start
    files.push(await this.generateQuickStart(outputDir));

    // First Project
    files.push(await this.generateFirstProject(outputDir));

    // Concepts
    files.push(await this.generateConcepts(outputDir));

    this.generatedFiles.push(...files);
    return files;
  }

  /**
   * Generate landing page
   */
  private async generateLandingPage(outputDir: string): Promise<GeneratedFile> {
    const builder = this.createBuilder({
      title: 'Getting Started',
      description: 'Learn how to get started with AgenticCoder',
      order: 1,
    });

    builder
      .addSection({
        id: 'intro',
        title: 'Welcome to AgenticCoder',
        content: `
AgenticCoder is an AI-powered code generation system that uses multiple specialized agents to create production-ready applications.

This guide will help you:
- Install AgenticCoder on your system
- Create your first project in 5 minutes
- Understand the core concepts
        `.trim(),
        level: 2,
      })
      .addSection({
        id: 'quick-links',
        title: 'Quick Links',
        content: `
- 🚀 [Quick Start](./quick-start.md) - Get running in 5 minutes
- 📦 [Installation](./installation.md) - Detailed install guide
- 📖 [Your First Project](./your-first-project.md) - Step-by-step tutorial
- 🧠 [Core Concepts](./concepts.md) - Understand how it works
        `.trim(),
        level: 2,
      })
      .addAdmonition('tip', 'If you\'re new, start with the [Quick Start](./quick-start.md) guide!');

    return this.writeDocument(builder.build(), outputDir, 'README.md');
  }

  /**
   * Generate prerequisites
   */
  private async generatePrerequisites(outputDir: string): Promise<GeneratedFile> {
    const builder = this.createBuilder({
      title: 'Prerequisites',
      description: 'What you need before installing AgenticCoder',
      order: 2,
    });

    builder
      .addSection({
        id: 'required',
        title: 'Required Software',
        content: '',
        level: 2,
      })
      .addTable(
        ['Software', 'Version', 'Purpose'],
        [
          ['Node.js', '20.0+', 'Runtime environment'],
          ['npm or pnpm', 'Latest', 'Package management'],
          ['Git', '2.0+', 'Version control'],
        ]
      )
      .addSection({
        id: 'optional',
        title: 'Optional (Recommended)',
        content: '',
        level: 2,
      })
      .addTable(
        ['Software', 'Version', 'Purpose'],
        [
          ['Azure CLI', '2.50+', 'Azure deployments'],
          ['Docker', '24.0+', 'Containerization'],
          ['VS Code', 'Latest', 'Recommended editor'],
        ]
      )
      .addSection({
        id: 'verify',
        title: 'Verify Installation',
        content: 'Run these commands to verify your setup:',
        level: 2,
      })
      .addCodeBlock('bash', `node --version    # Should be 20.x or higher
npm --version     # Should be 9.x or higher
git --version     # Should be 2.x or higher`);

    return this.writeDocument(builder.build(), outputDir, 'prerequisites.md');
  }

  /**
   * Generate installation guide
   */
  private async generateInstallation(outputDir: string): Promise<GeneratedFile> {
    const builder = this.createBuilder({
      title: 'Installation',
      description: 'How to install AgenticCoder on your system',
      order: 3,
    });

    builder
      .addSection({
        id: 'npm-install',
        title: 'Install via npm',
        content: 'The recommended way to install AgenticCoder:',
        level: 2,
      })
      .addCodeBlock('bash', `npm install -g @agenticcoder/cli`)
      .addSection({
        id: 'verify',
        title: 'Verify Installation',
        content: '',
        level: 2,
      })
      .addCodeBlock('bash', `agentic --version
agentic --help`)
      .addSection({
        id: 'configuration',
        title: 'Initial Configuration',
        content: 'Configure AgenticCoder for first use:',
        level: 2,
      })
      .addCodeBlock('bash', `# Set up configuration
agentic config init

# (Optional) Configure Azure
agentic config set azure.subscriptionId <your-subscription>

# (Optional) Configure GitHub
agentic config set github.token <your-token>`)
      .addSection({
        id: 'troubleshooting',
        title: 'Troubleshooting',
        content: '',
        level: 2,
      })
      .addAdmonition('warning', 'If you encounter permission errors on macOS/Linux, try:\n```bash\nsudo npm install -g @agenticcoder/cli\n```')
      .addText('\nFor more help, see [Troubleshooting](../troubleshooting/README.md).');

    return this.writeDocument(builder.build(), outputDir, 'installation.md');
  }

  /**
   * Generate quick start
   */
  private async generateQuickStart(outputDir: string): Promise<GeneratedFile> {
    const builder = this.createBuilder({
      title: 'Quick Start',
      description: 'Get started with AgenticCoder in 5 minutes',
      order: 4,
    });

    builder
      .addSection({
        id: 'intro',
        title: '',
        content: '⏱️ **Time needed: 5 minutes**\n\nThis guide will get you running with AgenticCoder in just a few steps.',
        level: 0,
      })
      .addSection({
        id: 'step-1',
        title: 'Step 1: Install',
        content: '',
        level: 2,
      })
      .addCodeBlock('bash', 'npm install -g @agenticcoder/cli')
      .addSection({
        id: 'step-2',
        title: 'Step 2: Create a Project',
        content: '',
        level: 2,
      })
      .addCodeBlock('bash', `agentic init my-first-app
cd my-first-app`)
      .addSection({
        id: 'step-3',
        title: 'Step 3: Run a Scenario',
        content: 'Use the S01 scenario for a simple TODO app:',
        level: 2,
      })
      .addCodeBlock('bash', 'agentic run S01')
      .addSection({
        id: 'step-4',
        title: 'Step 4: Review Output',
        content: 'Your generated project will be in `output/`:\n\n```\noutput/\n├── src/\n├── tests/\n├── docs/\n└── README.md\n```',
        level: 2,
      })
      .addSection({
        id: 'whats-next',
        title: 'What\'s Next?',
        content: `
- 📖 [Your First Project](./your-first-project.md) - Detailed walkthrough
- 🎯 [Scenarios](../reference/scenarios/) - Choose the right scenario
- ⚙️ [Configuration](../user-guide/configuration.md) - Customize behavior
        `.trim(),
        level: 2,
      });

    return this.writeDocument(builder.build(), outputDir, 'quick-start.md');
  }

  /**
   * Generate first project guide
   */
  private async generateFirstProject(outputDir: string): Promise<GeneratedFile> {
    const builder = this.createBuilder({
      title: 'Your First Project',
      description: 'Step-by-step guide to creating your first project',
      order: 5,
    });

    builder
      .addSection({
        id: 'intro',
        title: '',
        content: 'In this tutorial, you\'ll create a complete TODO application using AgenticCoder.',
        level: 0,
      })
      .addSection({
        id: 'step-1',
        title: 'Step 1: Initialize Project',
        content: 'Create a new project folder:',
        level: 2,
      })
      .addCodeBlock('bash', `agentic init todo-app
cd todo-app`)
      .addSection({
        id: 'step-2',
        title: 'Step 2: Configure Requirements',
        content: 'Edit `agentic.config.json`:',
        level: 2,
      })
      .addCodeBlock('json', `{
  "project": {
    "name": "todo-app",
    "description": "A simple TODO application"
  },
  "scenario": "S01",
  "preferences": {
    "language": "typescript",
    "framework": "react",
    "styling": "tailwind"
  }
}`)
      .addSection({
        id: 'step-3',
        title: 'Step 3: Run the Agents',
        content: 'Start the generation process:',
        level: 2,
      })
      .addCodeBlock('bash', 'agentic run')
      .addText('The system will:\n1. Analyze your requirements\n2. Design the architecture\n3. Generate code\n4. Create tests\n5. Generate documentation')
      .addSection({
        id: 'step-4',
        title: 'Step 4: Explore the Output',
        content: 'Review the generated files:',
        level: 2,
      })
      .addCodeBlock('bash', `ls -la output/

# Key directories:
# output/src/       - Source code
# output/tests/     - Test files
# output/docs/      - Documentation
# output/infra/     - Infrastructure (if applicable)`)
      .addSection({
        id: 'step-5',
        title: 'Step 5: Run the Application',
        content: '',
        level: 2,
      })
      .addCodeBlock('bash', `cd output
npm install
npm run dev`)
      .addText('Open http://localhost:3000 to see your app!')
      .addSection({
        id: 'summary',
        title: 'Summary',
        content: `
You've successfully:
- ✅ Created a new AgenticCoder project
- ✅ Configured project requirements
- ✅ Generated a complete application
- ✅ Run the application locally

**Next steps:**
- [Customize the output](../user-guide/customization.md)
- [Try different scenarios](../reference/scenarios/)
- [Learn about agents](../reference/agents/)
        `.trim(),
        level: 2,
      });

    return this.writeDocument(builder.build(), outputDir, 'your-first-project.md');
  }

  /**
   * Generate concepts
   */
  private async generateConcepts(outputDir: string): Promise<GeneratedFile> {
    const builder = this.createBuilder({
      title: 'Core Concepts',
      description: 'Understanding how AgenticCoder works',
      order: 6,
    });

    builder
      .addSection({
        id: 'overview',
        title: 'Overview',
        content: 'AgenticCoder uses a multi-agent architecture where specialized AI agents collaborate to generate code.',
        level: 2,
      })
      .addSection({
        id: 'agents',
        title: 'Agents',
        content: `
**Agents** are specialized AI components that handle specific tasks:

| Agent | Responsibility |
|-------|----------------|
| PlanAgent | Project planning and task breakdown |
| DocAgent | Requirements and documentation |
| ArchitectAgent | System architecture design |
| CodeGenAgent | Code generation |
| TestAgent | Test creation |
| ReviewAgent | Code review and quality |

Each agent has specific **skills** it can use to accomplish its tasks.
        `.trim(),
        level: 2,
      })
      .addSection({
        id: 'skills',
        title: 'Skills',
        content: `
**Skills** are reusable capabilities that agents can invoke:

- **TypeScriptGenerator** - Generate TypeScript code
- **BicepGenerator** - Generate Azure Bicep templates
- **ReactGenerator** - Generate React components
- **TestGenerator** - Generate test cases

Skills can be shared between agents.
        `.trim(),
        level: 2,
      })
      .addSection({
        id: 'scenarios',
        title: 'Scenarios',
        content: `
**Scenarios** define the complexity and scope of your project:

| Scenario | Complexity | Use Case |
|----------|------------|----------|
| S01 | Simple | Single-page apps, MVPs |
| S02 | Basic | Small web apps |
| S03 | Standard | Full-stack applications |
| S04 | Enterprise | Large-scale systems |
| S05 | Complex | Multi-service architectures |

Choose a scenario that matches your project needs.
        `.trim(),
        level: 2,
      })
      .addSection({
        id: 'workflow',
        title: 'Workflow',
        content: `
The typical AgenticCoder workflow:

\`\`\`
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│  Plan   │ -> │ Design  │ -> │ Generate │ -> │ Review  │
│  Agent  │    │  Agent  │    │  Agent   │    │  Agent  │
└─────────┘    └─────────┘    └──────────┘    └─────────┘
     │              │               │               │
     ▼              ▼               ▼               ▼
  Project       Architecture      Code &        Quality
   Plan          Design          Tests         Report
\`\`\`

Each phase produces artifacts that feed into the next.
        `.trim(),
        level: 2,
      })
      .addSection({
        id: 'artifacts',
        title: 'Artifacts',
        content: `
**Artifacts** are the outputs produced by agents:

- **Plans** - Project plans and task breakdowns
- **Designs** - Architecture diagrams and specs
- **Code** - Source code files
- **Tests** - Test files
- **Docs** - Documentation

All artifacts are stored in the \`output/\` directory.
        `.trim(),
        level: 2,
      });

    return this.writeDocument(builder.build(), outputDir, 'concepts.md');
  }

  /**
   * Create content builder with defaults
   */
  private createBuilder(metadata: DocMetadata): ContentBuilder {
    return new ContentBuilder(
      {
        ...metadata,
        lastUpdated: new Date(),
      },
      this.templateEngine
    );
  }

  /**
   * Write document to file
   */
  private async writeDocument(
    doc: BuiltDocument,
    outputDir: string,
    filename: string
  ): Promise<GeneratedFile> {
    const filePath = path.join(outputDir, filename);
    const content = `${doc.frontmatter}\n\n# ${doc.metadata.title}\n\n${doc.content}`;
    
    await fs.writeFile(filePath, content, 'utf-8');
    
    return {
      path: filePath,
      title: doc.metadata.title,
      category: 'getting-started',
      size: content.length,
    };
  }

  /**
   * Get all generated files
   */
  getGeneratedFiles(): GeneratedFile[] {
    return this.generatedFiles;
  }
}

/**
 * Create doc generator
 */
export function createDocGenerator(
  templatesDir: string,
  options: GenerationOptions
): DocGenerator {
  return new DocGenerator(templatesDir, options);
}
```

---

## 📋 Template Files

### `templates/getting-started/quick-start.hbs`

```handlebars
# Quick Start Guide

{{emoji "rocket"}} Get started with {{projectName}} in just 5 minutes!

## Prerequisites

{{> prerequisites}}

## Installation

{{#ifPlatform "windows"}}
```powershell
npm install -g @agenticcoder/cli
```
{{/ifPlatform}}

{{#ifPlatform "macos"}}
```bash
npm install -g @agenticcoder/cli
```
{{/ifPlatform}}

{{#ifPlatform "linux"}}
```bash
sudo npm install -g @agenticcoder/cli
```
{{/ifPlatform}}

## Create Your First Project

```bash
agentic init my-app
cd my-app
agentic run S01
```

## What's Next?

- [Your First Project](./your-first-project.md)
- [Configuration Guide](../user-guide/configuration.md)
- [Scenario Reference](../reference/scenarios/)
```

---

## 📋 Acceptance Criteria

- [ ] Landing page exists with quick links
- [ ] Prerequisites clearly listed
- [ ] Installation works on all platforms
- [ ] Quick start completable in 5 minutes
- [ ] First project tutorial is complete
- [ ] Core concepts are clearly explained
- [ ] All internal links work

---

## 🔗 Navigation

← [00-OVERVIEW.md](00-OVERVIEW.md) | [02-PHASE-USER-GUIDE.md](02-PHASE-USER-GUIDE.md) →
