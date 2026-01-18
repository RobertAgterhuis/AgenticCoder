# Extension Points

Customization and extension mechanisms in AgenticCoder.

## Overview

AgenticCoder provides multiple extension points:

- **Custom Agents** - Add new agents
- **Custom Skills** - Add new skills
- **Custom Validators** - Add validation rules
- **Custom Scenarios** - Define project scenarios
- **Plugins** - Extend core functionality

## Custom Agents

### Agent Definition

Create agent configuration:

```yaml
# .github/agents/my-agent.yaml
id: my-agent
name: My Custom Agent
description: Performs custom tasks

category: implementation
phases: [5, 6]

skills:
  - my-skill-1
  - my-skill-2

inputs:
  - architecture/design.md
  - requirements/stories.md

outputs:
  - my-output/

config:
  maxTokens: 4000
  temperature: 0.7
  timeout: 60000
```

### Agent Implementation

```typescript
// src/agents/custom/my-agent.ts
import { BaseAgent, Task, Result } from '../../core/agent-base';

export class MyAgent extends BaseAgent {
  /**
   * Main execution logic
   */
  protected async doExecute(task: Task): Promise<Result> {
    // 1. Read required inputs
    const design = await this.readArtifact('architecture/design.md');
    const stories = await this.readArtifact('requirements/stories.md');
    
    // 2. Process with skills
    const skill = this.getSkill('my-skill-1');
    const processed = await skill.execute({
      design,
      stories,
      parameters: task.inputs.parameters
    });
    
    // 3. Generate output
    const output = this.generateOutput(processed);
    
    // 4. Write artifacts
    const artifact = await this.writeArtifact(
      'my-output/result.md',
      output
    );
    
    return {
      taskId: task.id,
      status: 'success',
      outputs: {
        artifacts: [artifact],
        messages: ['Custom processing complete']
      },
      metrics: {
        duration: 0,
        tokensUsed: processed.tokensUsed
      }
    };
  }
  
  /**
   * Custom initialization
   */
  protected async onInitialize(): Promise<void> {
    this.logger.info('Initializing MyAgent');
    // Custom setup
  }
  
  /**
   * Generate output from processed data
   */
  private generateOutput(data: ProcessedData): string {
    return `# Custom Output\n\n${JSON.stringify(data, null, 2)}`;
  }
}
```

### Register Agent

```typescript
// src/agents/index.ts
import { MyAgent } from './custom/my-agent';

export const customAgents = {
  'my-agent': MyAgent
};
```

---

## Custom Skills

### Skill Definition

```yaml
# .github/skills/my-skill.yaml
id: my-skill
name: My Custom Skill
description: Performs specific task

category: implementation

inputs:
  - type: string
    name: data
    required: true
  - type: object
    name: options
    required: false

outputs:
  - type: string
    name: result
  - type: array
    name: artifacts
```

### Skill Implementation

```typescript
// src/skills/implementations/my-skill.ts
import { ISkill, SkillContext, SkillResult } from '../types';

export class MySkill implements ISkill {
  id = 'my-skill';
  name = 'My Custom Skill';
  description = 'Performs specific task';
  
  async execute(context: SkillContext): Promise<SkillResult> {
    const { data, options } = context.inputs;
    
    // Skill logic
    const result = this.process(data, options);
    
    return {
      success: true,
      outputs: {
        result: result.text,
        artifacts: result.files
      },
      artifacts: [],
      tokensUsed: result.tokens
    };
  }
  
  private process(data: string, options?: ProcessOptions): ProcessResult {
    // Processing logic
    return {
      text: `Processed: ${data}`,
      files: [],
      tokens: 100
    };
  }
}
```

### Register Skill

```typescript
// src/skills/index.ts
import { MySkill } from './implementations/my-skill';

export const customSkills = {
  'my-skill': MySkill
};
```

---

## Custom Validators

### Validator Definition

```typescript
// src/validation/validators/my-validator.ts
import { IValidator, ValidationResult, Artifact } from '../types';

export class MyValidator implements IValidator {
  id = 'my-validator';
  
  /**
   * Check if this validator applies to the artifact
   */
  appliesTo(artifact: Artifact): boolean {
    return artifact.path.endsWith('.custom');
  }
  
  /**
   * Perform validation
   */
  async validate(artifact: Artifact): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    
    // Custom validation rules
    if (!this.hasRequiredHeader(artifact.content)) {
      issues.push({
        code: 'MISSING_HEADER',
        message: 'File must have required header',
        severity: 'error',
        category: 'custom',
        location: { file: artifact.path, line: 1 },
        autoFixable: true
      });
    }
    
    if (!this.meetsQualityStandards(artifact.content)) {
      issues.push({
        code: 'QUALITY_ISSUE',
        message: 'Content does not meet quality standards',
        severity: 'warning',
        category: 'custom',
        autoFixable: false
      });
    }
    
    return {
      valid: !issues.some(i => i.severity === 'error'),
      score: this.calculateScore(issues),
      errors: issues.filter(i => i.severity === 'error'),
      warnings: issues.filter(i => i.severity === 'warning'),
      info: [],
      categories: {
        custom: {
          passed: !issues.some(i => i.severity === 'error'),
          score: 100 - issues.length * 10,
          issues
        }
      },
      metadata: {
        artifact: artifact.path,
        validators: [this.id],
        duration: 0,
        timestamp: new Date()
      }
    };
  }
  
  private hasRequiredHeader(content: string): boolean {
    return content.startsWith('// Required Header');
  }
  
  private meetsQualityStandards(content: string): boolean {
    return content.length > 100;
  }
  
  private calculateScore(issues: ValidationIssue[]): number {
    return Math.max(0, 100 - issues.length * 10);
  }
}
```

### Register Validator

```typescript
// src/validation/index.ts
import { MyValidator } from './validators/my-validator';

const framework = new ValidationFramework();
framework.registerValidator(new MyValidator());
```

---

## Custom Scenarios

### Scenario Definition

```yaml
# .github/scenarios/my-scenario.yaml
id: my-scenario
name: My Custom Scenario
description: Custom project type

complexity: medium
teamSize: 3-5
timeline: 4-6 weeks

technology:
  frontend: Vue.js
  backend: Python FastAPI
  database: MongoDB
  cloud: AWS

phases:
  include: [1, 2, 3, 4, 5, 13, 14, 15, 16]
  skip: [6, 7, 8, 9, 10, 11, 12]

agents:
  required:
    - plan
    - doc
    - backlog
    - architect
    - code-architect
  
  override:
    react-specialist: vue-specialist
    azure-architect: aws-architect

config:
  outputStructure:
    - plans/
    - architecture/
    - src/
      - frontend/
      - backend/
    - tests/
    - docs/
```

### Scenario Handler

```typescript
// src/scenarios/my-scenario.ts
import { BaseScenario, ScenarioContext } from '../core/scenario';

export class MyScenario extends BaseScenario {
  id = 'my-scenario';
  
  async configure(context: ScenarioContext): Promise<void> {
    // Custom scenario setup
    context.setOutputStructure([
      'plans/',
      'architecture/',
      'src/frontend/',
      'src/backend/',
      'tests/',
      'docs/'
    ]);
    
    // Override agents
    context.overrideAgent('react-specialist', 'vue-specialist');
    context.overrideAgent('azure-architect', 'aws-specialist');
    
    // Set custom variables
    context.setVariable('framework', 'vue');
    context.setVariable('cloud', 'aws');
  }
  
  async validate(context: ScenarioContext): Promise<ValidationResult> {
    // Scenario-specific validation
    return { valid: true, errors: [] };
  }
}
```

---

## Plugins

### Plugin Interface

```typescript
interface IPlugin {
  id: string;
  name: string;
  version: string;
  
  // Lifecycle hooks
  onLoad(engine: WorkflowEngine): Promise<void>;
  onUnload(): Promise<void>;
  
  // Extension points
  registerAgents?(): Agent[];
  registerSkills?(): Skill[];
  registerValidators?(): IValidator[];
  registerCommands?(): Command[];
}
```

### Plugin Implementation

```typescript
// plugins/my-plugin/index.ts
import { IPlugin, WorkflowEngine } from '@agentic-coder/core';

export class MyPlugin implements IPlugin {
  id = 'my-plugin';
  name = 'My Plugin';
  version = '1.0.0';
  
  private engine: WorkflowEngine;
  
  async onLoad(engine: WorkflowEngine): Promise<void> {
    this.engine = engine;
    
    // Register event handlers
    engine.on('phase:completed', this.onPhaseCompleted.bind(this));
    
    console.log('MyPlugin loaded');
  }
  
  async onUnload(): Promise<void> {
    // Cleanup
    console.log('MyPlugin unloaded');
  }
  
  registerAgents(): Agent[] {
    return [
      new MyCustomAgent()
    ];
  }
  
  registerSkills(): Skill[] {
    return [
      new MyCustomSkill()
    ];
  }
  
  registerValidators(): IValidator[] {
    return [
      new MyCustomValidator()
    ];
  }
  
  registerCommands(): Command[] {
    return [
      {
        name: 'my-command',
        description: 'My custom command',
        action: this.myCommand.bind(this)
      }
    ];
  }
  
  private async onPhaseCompleted(phase: number): Promise<void> {
    console.log(`Phase ${phase} completed`);
  }
  
  private async myCommand(args: string[]): Promise<void> {
    console.log('Running my command with', args);
  }
}

export default MyPlugin;
```

### Plugin Configuration

```yaml
# .agentic/plugins.yaml
plugins:
  - id: my-plugin
    enabled: true
    config:
      option1: value1
      option2: value2
```

### Loading Plugins

```typescript
// Load plugins
const pluginLoader = new PluginLoader();
await pluginLoader.loadFromConfig('.agentic/plugins.yaml');

// Manual loading
await pluginLoader.load('./plugins/my-plugin');
```

---

## Event Hooks

### Available Hooks

| Hook | Parameters | Description |
|------|------------|-------------|
| `workflow:before` | config | Before workflow starts |
| `workflow:after` | result | After workflow completes |
| `phase:before` | phase | Before phase starts |
| `phase:after` | phase, artifacts | After phase completes |
| `agent:before` | agent, task | Before agent executes |
| `agent:after` | agent, result | After agent completes |
| `validation:before` | artifact | Before validation |
| `validation:after` | result | After validation |

### Using Hooks

```typescript
// Register hooks
engine.on('workflow:before', async (config) => {
  console.log('Starting workflow:', config.projectName);
});

engine.on('phase:after', async (phase, artifacts) => {
  console.log(`Phase ${phase} created ${artifacts.length} artifacts`);
});

engine.on('agent:after', async (agent, result) => {
  if (result.status === 'failed') {
    await notifyAdmin(agent, result.error);
  }
});
```

---

## Configuration Extensions

### Custom Configuration

```yaml
# .agentic/config/custom.yaml
custom:
  my-setting: value
  nested:
    option1: true
    option2: 100
```

### Accessing Configuration

```typescript
const config = Config.load();
const mySetting = config.get('custom.my-setting');
const nested = config.get('custom.nested');
```

## Next Steps

- [Building Agents](../guides/Building-Agents) - Agent development
- [Creating Skills](../guides/Creating-Skills) - Skill development
- [TypeScript Overview](Overview) - Code structure
