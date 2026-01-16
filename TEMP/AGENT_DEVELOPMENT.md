# Agent Development Guide

**Version**: 2.0  
**Updated**: January 13, 2026

---

## Introduction

This guide teaches you how to create new agents for AgenticCoder. By the end, you'll understand:
- Agent structure and lifecycle
- How agents integrate with the system
- How to compose agents with skills
- How to test agents
- Best practices for agent development

---

## What is an Agent?

An agent is a specialized autonomous module that:
- **Performs one specific task** in code generation
- **Uses skills** to accomplish its goal
- **Handoffs to other agents** when done
- **Produces artifacts** that downstream agents consume
- **Is testable** and composable

**Example**: `@react-specialist` generates React component code using `react-best-practices` skill.

---

## Agent Lifecycle

```
1. Activation
   ↓
2. Input Validation
   ↓
3. Execute with Skills
   ↓
4. Generate Artifacts
   ↓
5. Handoff to Next Agent
```

### Activation
Agent is selected based on specification criteria.

```typescript
// Agent is activated when:
if (spec.frontend === 'React') {
  await reactSpecialist.execute(spec);
}
```

### Input Validation
Agent validates it received valid input.

```typescript
// Agent validates input before processing
const validationResult = await agent.validate(input);
if (!validationResult.isValid) {
  throw new ValidationError(validationResult.errors);
}
```

### Execution
Agent uses skills to do its work.

```typescript
// Agent executes with its skills
const output = await agent.execute(input);
// Uses: react-best-practices, css-best-practices, testing-framework, etc.
```

### Artifact Generation
Agent produces versioned artifacts.

```typescript
// Agent creates artifacts
const artifacts = [{
  id: 'App-tsx',
  type: 'code',
  version: '1.0.0',
  createdBy: '@react-specialist',
  content: 'export function App() { ... }'
}];
```

### Handoff
Agent passes work to next agent(s).

```typescript
// Agent hands off to next agents
const handoff = {
  from: '@react-specialist',
  to: ['@qa'],
  artifacts: artifacts,
  context: { /* execution context */ }
};
```

---

## Agent Template

### Basic Structure

```typescript
// src/agents/my-specialist.ts

import { BaseAgent, AgentInput, AgentOutput } from '@/core/agent';
import { Artifact, Handoff } from '@/types';

interface MySpecialistInput extends AgentInput {
  // Input-specific fields
  projectSpec: ProjectSpec;
  architecture: ArchitectureDesign;
}

interface MySpecialistOutput extends AgentOutput {
  // Output-specific fields
  code: string;
  artifacts: Artifact[];
}

export class MySpecialist extends BaseAgent {
  name = '@my-specialist';
  phase = 13; // Which phase this agent executes in
  tier = 'implementation'; // 'orchestration' | 'architecture' | 'implementation' | 'devops'
  
  // Skills this agent uses
  skills = [
    'my-best-practices',
    'testing-framework'
  ];
  
  // Which agents this agent hands off to
  handoffTo = ['@qa'];
  
  // Description for documentation
  description = 'Generates code using custom technology';
  
  /**
   * Validate input before execution
   */
  async validate(input: MySpecialistInput): Promise<ValidationResult> {
    const errors: string[] = [];
    
    if (!input.projectSpec?.projectName) {
      errors.push('projectSpec.projectName is required');
    }
    
    if (!input.architecture?.components?.length) {
      errors.push('architecture.components must have at least one component');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Main execution method
   */
  async execute(input: MySpecialistInput): Promise<MySpecialistOutput> {
    this.logger.info(`${this.name} starting execution`);
    
    try {
      // 1. Validate input
      const validation = await this.validate(input);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors);
      }
      
      // 2. Use skills to generate code
      const codeSkill = this.getSkill('my-best-practices');
      const code = await codeSkill.execute({
        architecture: input.architecture,
        components: input.architecture.components
      });
      
      // 3. Generate artifacts
      const artifacts = this.createArtifacts(code);
      
      // 4. Return output
      return {
        success: true,
        code,
        artifacts,
        handoffTarget: this.handoffTo[0]
      };
      
    } catch (error) {
      this.logger.error(`${this.name} execution failed`, error);
      throw error;
    }
  }
  
  /**
   * Create versioned artifacts
   */
  private createArtifacts(code: string): Artifact[] {
    return [{
      id: `my-code-${Date.now()}`,
      type: 'code',
      version: '1.0.0',
      createdBy: this.name,
      createdAt: new Date().toISOString(),
      content: code,
      metadata: {
        language: 'typescript',
        framework: 'my-framework',
        lineCount: code.split('\n').length
      }
    }];
  }
  
  /**
   * Get a skill by name
   */
  private getSkill(name: string): BaseSkill {
    const skill = this.skillRegistry.getSkill(name);
    if (!skill) {
      throw new SkillNotFoundError(`Skill '${name}' not found`);
    }
    return skill;
  }
}

// Register the agent
agentRegistry.register(new MySpecialist());
```

---

## Detailed Step-by-Step

### Step 1: Define Agent Class

```typescript
export class MySpecialist extends BaseAgent {
  name = '@my-specialist';
  phase = 13;
  tier = 'implementation';
  skills = ['my-best-practices'];
  handoffTo = ['@qa'];
  description = 'Generates code using custom technology';
}
```

### Step 2: Implement validate()

```typescript
async validate(input: MySpecialistInput): Promise<ValidationResult> {
  const errors: string[] = [];
  
  // Check required fields
  if (!input.projectSpec?.projectName) {
    errors.push('projectSpec.projectName is required');
  }
  
  if (!input.architecture?.components) {
    errors.push('architecture.components is required');
  }
  
  // Type validation
  if (typeof input.projectSpec.projectName !== 'string') {
    errors.push('projectSpec.projectName must be a string');
  }
  
  // Business logic validation
  if (input.architecture.components.length === 0) {
    errors.push('At least one component is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Step 3: Implement execute()

```typescript
async execute(input: MySpecialistInput): Promise<MySpecialistOutput> {
  this.logger.info(`${this.name} starting`);
  
  // 1. Validate
  const validation = await this.validate(input);
  if (!validation.isValid) {
    throw new ValidationError(validation.errors);
  }
  
  // 2. Process using skills
  const code = await this.generateCode(input);
  
  // 3. Create artifacts
  const artifacts = this.createArtifacts(code);
  
  // 4. Return structured output
  return {
    success: true,
    code,
    artifacts,
    metadata: {
      generatedAt: new Date().toISOString(),
      executionTime: Date.now() - startTime
    }
  };
}

private async generateCode(input: MySpecialistInput): Promise<string> {
  // Use skills to generate code
  const bestPractices = this.skillRegistry.getSkill('my-best-practices');
  const testingFramework = this.skillRegistry.getSkill('testing-framework');
  
  const code = await bestPractices.execute({
    components: input.architecture.components
  });
  
  const tests = await testingFramework.execute({
    sourceCode: code
  });
  
  return `${code}\n\n${tests}`;
}
```

### Step 4: Create Agent Definition

```markdown
# .github/agents/@my-specialist.agent.md

## @my-specialist Agent

### Purpose
Generates code for custom technology/framework.

### Phase
Phase: 13 (Implementation)

### Tier
Implementation Tier

### Activation Condition
Activates when `spec.technology === 'MyFramework'`

### Input
- Project specification
- Architecture design
- Component definitions

### Output
- Source code files
- Test files
- Configuration files

### Skills Used
- my-best-practices
- testing-framework
- security-best-practices

### Handoff Targets
- @qa (Phase 16)

### Success Criteria
- Code compiles without errors
- Tests pass
- Code follows best practices
- Security checks pass
```

### Step 5: Write Tests

```typescript
// tests/agents/my-specialist.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MySpecialist } from '@/agents/my-specialist';

describe('MySpecialist Agent', () => {
  let agent: MySpecialist;
  
  beforeEach(() => {
    agent = new MySpecialist();
  });
  
  describe('validate()', () => {
    it('should accept valid input', async () => {
      const input: MySpecialistInput = {
        projectSpec: { projectName: 'test' },
        architecture: { components: [{ name: 'App' }] }
      };
      
      const result = await agent.validate(input);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject missing projectSpec', async () => {
      const input: MySpecialistInput = {
        projectSpec: null,
        architecture: { components: [{ name: 'App' }] }
      };
      
      const result = await agent.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('projectSpec is required');
    });
  });
  
  describe('execute()', () => {
    it('should generate valid code', async () => {
      const input: MySpecialistInput = {
        projectSpec: { projectName: 'test-app' },
        architecture: { components: [{ name: 'App' }] }
      };
      
      const output = await agent.execute(input);
      
      expect(output.success).toBe(true);
      expect(output.code).toBeTruthy();
      expect(output.artifacts).toBeDefined();
      expect(output.artifacts.length).toBeGreaterThan(0);
    });
    
    it('should throw on invalid input', async () => {
      const invalidInput = { projectSpec: null };
      
      await expect(agent.execute(invalidInput)).rejects.toThrow();
    });
    
    it('should generate proper artifacts', async () => {
      const output = await agent.execute(validInput);
      
      const artifact = output.artifacts[0];
      expect(artifact.id).toBeDefined();
      expect(artifact.type).toBe('code');
      expect(artifact.version).toBeDefined();
      expect(artifact.createdBy).toBe('@my-specialist');
      expect(artifact.content).toBeTruthy();
    });
  });
});
```

---

## Key Concepts

### BaseAgent Properties

```typescript
abstract class BaseAgent {
  // Identification
  name: string;                    // e.g., '@react-specialist'
  description: string;             // What agent does
  
  // Lifecycle
  phase: number;                   // Which phase (1-16)
  tier: AgentTier;                 // orchestration|architecture|implementation|devops
  
  // Capabilities
  skills: string[];                // Skill names to use
  handoffTo: string[];             // Target agents for handoff
  
  // Registry access
  skillRegistry: SkillRegistry;
  agentRegistry: AgentRegistry;
  logger: Logger;
  
  // Abstract methods to implement
  abstract validate(input: AgentInput): Promise<ValidationResult>;
  abstract execute(input: AgentInput): Promise<AgentOutput>;
}
```

### Error Handling

```typescript
// Validation errors
if (!input.valid) {
  throw new ValidationError('Input is invalid');
}

// Execution errors
try {
  const result = await skill.execute(input);
} catch (error) {
  if (error instanceof SkillNotFoundError) {
    throw new AgentError(`Required skill not found`, error);
  }
  throw error;
}

// Timeout handling
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new TimeoutError('Execution timeout')), 30000)
);

await Promise.race([agent.execute(input), timeout]);
```

### Artifact Management

```typescript
// Create versioned artifact
const artifact: Artifact = {
  id: `my-artifact-${Date.now()}`,
  type: 'code',
  version: '1.0.0',
  createdBy: '@my-agent',
  createdAt: new Date().toISOString(),
  content: sourceCode,
  metadata: {
    language: 'typescript',
    framework: 'my-framework',
    dependencies: ['lib1', 'lib2'],
    lineCount: 250
  }
};

// Create related artifacts
const artifacts = [
  sourceCodeArtifact,
  testArtifact,
  configArtifact,
  documentationArtifact
];
```

---

## Best Practices

### 1. Single Responsibility
Each agent should do one thing well.

```typescript
// ✅ Good
@class ReactSpecialist {
  // Only generates React code
  async execute(input): Promise<ReactCode> { ... }
}

// ❌ Bad
@class FullStackSpecialist {
  // Tries to do everything - hard to test and maintain
  async execute(input): Promise<everything> { ... }
}
```

### 2. Explicit Dependencies
Clearly define what skills are needed.

```typescript
// ✅ Good
skills = [
  'react-best-practices',
  'typescript-best-practices',
  'testing-framework',
  'accessibility-best-practices'
];

// ❌ Bad
skills = ['*']; // Generic catch-all
```

### 3. Error Messages
Provide clear, actionable error messages.

```typescript
// ✅ Good
throw new ValidationError(
  'Database schema is required. Please provide schema with at least one table.'
);

// ❌ Bad
throw new Error('Invalid input');
```

### 4. Logging
Log important steps for debugging.

```typescript
// ✅ Good
this.logger.info('Starting code generation for 5 components');
this.logger.debug('Component 1: App', componentDetails);
this.logger.info('Code generation complete - 250 lines');

// ❌ Bad - too much or too little logging
this.logger.debug('...internal call...');
this.logger.debug('...step 1...');
this.logger.debug('...done');
```

### 5. Testing
Test both happy path and edge cases.

```typescript
// ✅ Good tests
it('should generate code with valid input');
it('should reject invalid component names');
it('should handle empty component list');
it('should generate with complex nested components');
it('should fail gracefully on skill errors');

// ❌ Bad tests
it('should work');
```

### 6. Composition
Use skills to avoid duplicating logic.

```typescript
// ✅ Good - uses shared skills
class MyAgent extends BaseAgent {
  skills = ['my-best-practices', 'testing-framework'];
  
  async execute(input) {
    const code = await this.getSkill('my-best-practices').execute(input);
    const tests = await this.getSkill('testing-framework').execute(code);
  }
}

// ❌ Bad - duplicates testing logic
class MyAgent extends BaseAgent {
  async execute(input) {
    const code = await generate(input);
    // Re-implements testing logic instead of using skill
    const tests = this.writeTests(code);
  }
}
```

---

## Integration Checklist

When creating a new agent:

- [ ] **Definition**: Created `/.github/agents/@my-specialist.agent.md`
- [ ] **Implementation**: Created `/src/agents/my-specialist.ts`
- [ ] **Validation**: Implements `validate()` method
- [ ] **Execution**: Implements `execute()` method
- [ ] **Skills**: Clearly lists required skills
- [ ] **Handoffs**: Defines `handoffTo` targets
- [ ] **Tests**: Created comprehensive test suite
- [ ] **Coverage**: At least 80% test coverage
- [ ] **Documentation**: JSDoc comments on public methods
- [ ] **Error Handling**: Throws descriptive errors
- [ ] **Logging**: Logs important steps
- [ ] **Registration**: Registered with `agentRegistry`
- [ ] **Phase/Tier**: Correct phase and tier assigned
- [ ] **Activation**: Clear activation condition

---

## Common Agent Types

### Orchestration Agent

```typescript
// Coordinates other agents
export class @plan extends BaseAgent {
  name = '@plan';
  phase = 1;
  tier = 'orchestration';
  
  async execute(userInput: UserInput): Promise<OrchestrationPlan> {
    // Parse user input
    // Create execution plan
    // Hand off to @requirements-analyzer
    return plan;
  }
}
```

### Architecture Agent

```typescript
// Designs system architecture
export class @codeArchitect extends BaseAgent {
  name = '@code-architect';
  phase = 8;
  tier = 'architecture';
  
  async execute(input: ArchitectureInput): Promise<ArchitectureDesign> {
    // Design code structure
    // Define components
    // Hand off to implementation agents
    return architecture;
  }
}
```

### Implementation Agent

```typescript
// Generates source code
export class @reactSpecialist extends BaseAgent {
  name = '@react-specialist';
  phase = 13;
  tier = 'implementation';
  
  async execute(input: ImplementationInput): Promise<SourceCode> {
    // Generate React components
    // Generate tests
    // Hand off to @qa
    return sourceCode;
  }
}
```

### DevOps Agent

```typescript
// Sets up deployment
export class @dockerSpecialist extends BaseAgent {
  name = '@docker-specialist';
  phase = 15;
  tier = 'devops';
  
  async execute(input: DeploymentInput): Promise<DeploymentConfig> {
    // Create Dockerfile
    // Create docker-compose
    // Hand off to @devops-specialist
    return dockerConfig;
  }
}
```

---

## Examples

### Example 1: Simple Agent

```typescript
export class MyFrameworkSpecialist extends BaseAgent {
  name = '@my-framework-specialist';
  phase = 13;
  tier = 'implementation';
  skills = ['my-framework-best-practices'];
  handoffTo = ['@qa'];
  
  async validate(input): Promise<ValidationResult> {
    return {
      isValid: !!input.architecture,
      errors: input.architecture ? [] : ['architecture required']
    };
  }
  
  async execute(input): Promise<AgentOutput> {
    const skill = this.getSkill('my-framework-best-practices');
    const code = await skill.execute(input);
    
    return {
      success: true,
      artifacts: [{
        id: 'generated-code',
        type: 'code',
        version: '1.0.0',
        createdBy: this.name,
        content: code
      }]
    };
  }
}
```

### Example 2: Complex Agent with Multiple Skills

```typescript
export class AdvancedSpecialist extends BaseAgent {
  name = '@advanced-specialist';
  phase = 13;
  tier = 'implementation';
  skills = [
    'framework-best-practices',
    'security-best-practices',
    'performance-best-practices',
    'testing-framework'
  ];
  handoffTo = ['@docker-specialist', '@qa'];
  
  async execute(input): Promise<AgentOutput> {
    // Use multiple skills
    const frameworkSkill = this.getSkill('framework-best-practices');
    const securitySkill = this.getSkill('security-best-practices');
    const perfSkill = this.getSkill('performance-best-practices');
    const testingSkill = this.getSkill('testing-framework');
    
    // Generate with each skill
    let code = await frameworkSkill.execute(input);
    code = await securitySkill.enhance(code);
    code = await perfSkill.optimize(code);
    const tests = await testingSkill.generate(code);
    
    // Create artifacts
    return {
      success: true,
      artifacts: [
        { id: 'main', type: 'code', content: code },
        { id: 'tests', type: 'test', content: tests }
      ]
    };
  }
}
```

---

## Debugging

### Enable Debug Logging

```typescript
// In agent
this.logger.debug('Debug message', data);

// Run with debug
DEBUG=* npm start
```

### Step Through Execution

```typescript
// Use debugger
debugger;
const result = await agent.execute(input);

// Or use breakpoints in VS Code
```

### Test in Isolation

```typescript
// Test agent without full execution
const agent = new MyAgent();
const result = await agent.execute(testInput);
```

---

## Resources

- [Base Agent Class](../src/core/agent.ts)
- [Skill System](SKILL_DEVELOPMENT.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [API Reference](../API_REFERENCE.md)

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
