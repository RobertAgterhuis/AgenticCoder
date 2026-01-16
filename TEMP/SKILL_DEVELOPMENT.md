# Skill Development Guide

**Version**: 2.0  
**Updated**: January 13, 2026

---

## Introduction

This guide teaches you how to create new skills for AgenticCoder. By the end, you'll understand:
- Skill structure and lifecycle
- How skills integrate with agents
- How to compose and reuse skills
- How to test skills
- Best practices for skill development

---

## What is a Skill?

A skill is a reusable, focused capability that:
- **Encapsulates domain knowledge** (best practices, patterns, standards)
- **Can be used by multiple agents** (composition)
- **Has a single responsibility** (one technology or concern)
- **Is independently testable** and versioned
- **Produces consistent, high-quality output**

**Example**: `react-best-practices` skill encodes knowledge about React patterns and standards used by `@react-specialist` agent.

---

## Skill Categories

AgenticCoder organizes skills into 6 categories:

### 1. Planning Skills (5 skills)
Analyze requirements and plan projects.

```
- project-planning: Overall project planning approach
- requirements-analysis: Extract and analyze requirements
- validation-framework: Validation methodologies
```

### 2. Architecture Skills (6 skills)
Design systems and infrastructure.

```
- architecture-patterns: Design patterns
- cloud-infrastructure: Cloud architecture
- database-design: Database schema design
- deployment-patterns: Deployment strategies
- microservices-design: Microservices architecture
```

### 3. Frontend Skills (8 skills)
Build user-facing applications.

```
- react-best-practices: React patterns and standards
- vue-best-practices: Vue patterns and standards
- angular-best-practices: Angular patterns and standards
- svelte-best-practices: Svelte patterns and standards
- css-best-practices: CSS/styling standards
- accessibility-best-practices: A11y standards
- performance-optimization-frontend: Frontend perf
```

### 4. Backend Skills (6 skills)
Build server-side applications.

```
- nodejs-best-practices: Node.js/Express standards
- python-best-practices: Python/Django standards
- go-best-practices: Go standards
- java-best-practices: Java/Spring standards
- rest-api-best-practices: REST API design
- graphql-best-practices: GraphQL design
```

### 5. Database Skills (3 skills)
Design and manage databases.

```
- mysql-best-practices: MySQL patterns
- mongodb-best-practices: MongoDB patterns
- postgres-best-practices: PostgreSQL patterns
```

### 6. DevOps & Security Skills (5 skills)
Deploy and secure applications.

```
- security-best-practices: Security standards
- performance-best-practices: Performance optimization
- containerization: Docker/container patterns
- devops-practices: CI/CD and automation
- testing-framework: Testing standards
```

---

## Skill Lifecycle

```
1. Definition (What knowledge to encode)
   ↓
2. Implementation (Write the code)
   ↓
3. Usage by Agents (Agents call skill)
   ↓
4. Output Generation (Skill produces output)
   ↓
5. Continuous Improvement (Feedback loops)
```

---

## Skill Template

### Basic Structure

```typescript
// src/skills/my-best-practices.ts

import { BaseSkill, SkillInput, SkillOutput } from '@/core/skill';
import { ValidationResult } from '@/types';

/**
 * Input type for this skill
 */
interface MyBestPracticesInput extends SkillInput {
  sourceCode: string;
  framework: string;
  // Other input fields
}

/**
 * Output type for this skill
 */
interface MyBestPracticesOutput extends SkillOutput {
  improvedCode: string;
  suggestions: string[];
  metrics: CodeMetrics;
}

/**
 * My Best Practices Skill
 * 
 * Encodes best practices for custom technology/domain.
 * Used by: agents that work in this domain
 */
export class MyBestPracticesSkill extends BaseSkill {
  name = 'my-best-practices';
  category = 'implementation'; // Category of skill
  description = 'Best practices for custom technology';
  version = '1.0.0';
  
  /**
   * Validate input
   */
  async validate(input: MyBestPracticesInput): Promise<ValidationResult> {
    const errors: string[] = [];
    
    if (!input.sourceCode) {
      errors.push('sourceCode is required');
    }
    
    if (!input.framework) {
      errors.push('framework is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Execute skill
   */
  async execute(input: MyBestPracticesInput): Promise<MyBestPracticesOutput> {
    // 1. Validate
    const validation = await this.validate(input);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    // 2. Apply best practices
    const improvedCode = this.applyBestPractices(input.sourceCode);
    
    // 3. Generate suggestions
    const suggestions = this.generateSuggestions(improvedCode);
    
    // 4. Calculate metrics
    const metrics = this.calculateMetrics(improvedCode);
    
    // 5. Return output
    return {
      success: true,
      improvedCode,
      suggestions,
      metrics
    };
  }
  
  /**
   * Apply best practices transformation
   */
  private applyBestPractices(code: string): string {
    // Implement best practices
    let result = code;
    
    // Example transformations
    result = this.addTypeAnnotations(result);
    result = this.enforceNamingConventions(result);
    result = this.addDocumentation(result);
    result = this.optimizeImports(result);
    
    return result;
  }
  
  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(code: string): string[] {
    const suggestions: string[] = [];
    
    // Analyze code for improvement opportunities
    if (this.detectComplexFunction(code)) {
      suggestions.push('Consider breaking down complex functions');
    }
    
    if (this.detectDuplication(code)) {
      suggestions.push('Remove code duplication');
    }
    
    if (this.detectMissingTests(code)) {
      suggestions.push('Add unit tests for better coverage');
    }
    
    return suggestions;
  }
  
  /**
   * Calculate code metrics
   */
  private calculateMetrics(code: string): CodeMetrics {
    return {
      lineCount: code.split('\n').length,
      complexity: this.calculateCyclomaticComplexity(code),
      maintainability: this.calculateMaintainability(code),
      testCoverage: 85 // Example value
    };
  }
  
  // Helper methods (implement based on your needs)
  private addTypeAnnotations(code: string): string { /* ... */ }
  private enforceNamingConventions(code: string): string { /* ... */ }
  private addDocumentation(code: string): string { /* ... */ }
  private optimizeImports(code: string): string { /* ... */ }
  private detectComplexFunction(code: string): boolean { /* ... */ }
  private detectDuplication(code: string): boolean { /* ... */ }
  private detectMissingTests(code: string): boolean { /* ... */ }
  private calculateCyclomaticComplexity(code: string): number { /* ... */ }
  private calculateMaintainability(code: string): number { /* ... */ }
}

// Register skill
skillRegistry.register(new MyBestPracticesSkill());
```

---

## Step-by-Step Development

### Step 1: Define Skill Class

```typescript
export class ReactBestPracticesSkill extends BaseSkill {
  name = 'react-best-practices';
  category = 'frontend';
  description = 'Best practices for React development';
  version = '1.0.0';
}
```

### Step 2: Define Input/Output Types

```typescript
interface ReactBestPracticesInput extends SkillInput {
  components: ComponentSpec[];
  projectName: string;
  targetVersion: string;
}

interface ReactBestPracticesOutput extends SkillOutput {
  code: string;
  componentMap: Map<string, string>;
  patterns: string[];
}
```

### Step 3: Implement validate()

```typescript
async validate(input: ReactBestPracticesInput): Promise<ValidationResult> {
  const errors: string[] = [];
  
  // Type checking
  if (!Array.isArray(input.components)) {
    errors.push('components must be an array');
  }
  
  // Content validation
  if (input.components.length === 0) {
    errors.push('At least one component is required');
  }
  
  // Business logic validation
  for (const component of input.components) {
    if (!component.name) {
      errors.push('Each component must have a name');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Step 4: Implement execute()

```typescript
async execute(input: ReactBestPracticesInput): Promise<ReactBestPracticesOutput> {
  // 1. Validate
  const validation = await this.validate(input);
  if (!validation.isValid) {
    throw new ValidationError(validation.errors);
  }
  
  // 2. Generate code from components
  const components = await Promise.all(
    input.components.map(comp => this.generateComponent(comp))
  );
  
  // 3. Combine with best practices
  const code = this.combineComponents(components);
  const enhancedCode = this.applyBestPractices(code);
  
  // 4. Create component map
  const componentMap = new Map(
    components.map(comp => [comp.name, comp.code])
  );
  
  // 5. Extract patterns used
  const patterns = this.extractPatterns(enhancedCode);
  
  // 6. Return output
  return {
    success: true,
    code: enhancedCode,
    componentMap,
    patterns
  };
}

private async generateComponent(spec: ComponentSpec): Promise<Component> {
  return {
    name: spec.name,
    code: `
      export function ${spec.name}() {
        return <div>${spec.name}</div>;
      }
    `
  };
}

private applyBestPractices(code: string): string {
  // Apply React best practices
  code = this.addPropTypes(code);
  code = this.addErrorBoundary(code);
  code = this.optimizePerformance(code);
  code = this.formatCode(code);
  return code;
}
```

### Step 5: Create Skill Definition

```markdown
# .github/skills/react-best-practices.md

## react-best-practices Skill

### Category
Frontend

### Purpose
Encodes React best practices, patterns, and standards for generating high-quality React components.

### Used By
- @react-specialist agent
- Other frontend agents that need React knowledge

### Implements
- Component structure patterns
- Hook usage guidelines
- Performance optimization
- Error handling patterns
- Testing patterns
- Documentation standards

### Output Quality
- Production-ready React code
- TypeScript type safety
- Comprehensive prop validation
- Performance optimized
- Thoroughly tested
- Well-documented

### Version
1.0.0

### Dependencies
- None (foundational skill)

### Related Skills
- css-best-practices
- testing-framework
- accessibility-best-practices
```

### Step 6: Write Tests

```typescript
// tests/skills/react-best-practices.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ReactBestPracticesSkill } from '@/skills/react-best-practices';

describe('ReactBestPracticesSkill', () => {
  let skill: ReactBestPracticesSkill;
  
  beforeEach(() => {
    skill = new ReactBestPracticesSkill();
  });
  
  describe('validate()', () => {
    it('should accept valid input', async () => {
      const input = {
        components: [
          { name: 'App' },
          { name: 'Header' }
        ],
        projectName: 'my-app',
        targetVersion: '18.0'
      };
      
      const result = await skill.validate(input);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject empty components', async () => {
      const input = {
        components: [],
        projectName: 'my-app',
        targetVersion: '18.0'
      };
      
      const result = await skill.validate(input);
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('execute()', () => {
    it('should generate valid React code', async () => {
      const input = {
        components: [{ name: 'App' }],
        projectName: 'test-app',
        targetVersion: '18.0'
      };
      
      const output = await skill.execute(input);
      
      expect(output.success).toBe(true);
      expect(output.code).toContain('export function');
      expect(output.componentMap.has('App')).toBe(true);
    });
    
    it('should apply best practices', async () => {
      const output = await skill.execute(validInput);
      
      expect(output.code).toContain('React.memo');
      expect(output.code).toContain('PropTypes');
      expect(output.patterns).toContain('functional-component');
    });
  });
});
```

---

## Key Concepts

### BaseSkill Interface

```typescript
abstract class BaseSkill {
  // Metadata
  name: string;                    // Unique identifier
  category: string;                // Skill category
  description: string;             // What skill does
  version: string;                 // Semantic version
  
  // Dependencies (optional)
  dependencies?: string[];         // Other skills needed
  
  // Required methods
  abstract validate(input: SkillInput): Promise<ValidationResult>;
  abstract execute(input: SkillInput): Promise<SkillOutput>;
  
  // Optional methods
  canHandle?(input: SkillInput): boolean;
  enhance?(content: string): Promise<string>;
  validate?(input: SkillInput): Promise<ValidationResult>;
}
```

### Skill Composition

Skills can be composed to create more powerful capabilities:

```typescript
// Compose multiple skills
const composedSkill = skillRegistry.compose([
  'react-best-practices',
  'testing-framework',
  'accessibility-best-practices'
]);

const output = await composedSkill.execute(input);
// Output has benefits of all three skills
```

### Error Handling

```typescript
// Validation errors
if (!input.code) {
  throw new ValidationError('Code is required');
}

// Execution errors
try {
  const enhanced = await enhance(code);
} catch (error) {
  this.logger.error('Enhancement failed', error);
  throw new SkillError('Enhancement failed', error);
}

// Graceful degradation
async execute(input: SkillInput): Promise<SkillOutput> {
  try {
    return await this.applyAdvancedFeatures(input);
  } catch (error) {
    // Fallback to basic features
    this.logger.warn('Advanced features failed, using basic');
    return await this.applyBasicFeatures(input);
  }
}
```

---

## Best Practices

### 1. Single Responsibility
Each skill should focus on one technology or concern.

```typescript
// ✅ Good - focused skill
class ReactBestPracticesSkill extends BaseSkill {
  // Only React-specific knowledge
  async execute(input: ReactInput): Promise<ReactOutput> { ... }
}

// ❌ Bad - too broad
class AllFrameworksSkill extends BaseSkill {
  // Tries to handle React, Vue, Angular, etc.
  async execute(input: AnyInput): Promise<AnyOutput> { ... }
}
```

### 2. Clear Dependencies
Document what skills depend on what.

```typescript
// ✅ Good - declares dependencies
class AdvancedReactSkill extends BaseSkill {
  dependencies = [
    'react-best-practices',
    'testing-framework'
  ];
}

// ❌ Bad - hidden dependencies
class AdvancedReactSkill extends BaseSkill {
  async execute(input) {
    // Assumes testing-framework exists but doesn't declare it
  }
}
```

### 3. Reusability
Write skills to be reused by multiple agents.

```typescript
// ✅ Good - used by multiple agents
skillRegistry.register(new TestingFrameworkSkill());
// Used by @react-specialist, @nodejs-specialist, etc.

// ❌ Bad - agent-specific skill
skillRegistry.register(new ReactOnlyTestingSkill());
// Only usable by @react-specialist
```

### 4. Consistent Output
Skills should produce consistent, predictable output.

```typescript
// ✅ Good - consistent structure
interface SkillOutput {
  success: boolean;
  code: string;
  metrics: CodeMetrics;
  suggestions: string[];
}

// ❌ Bad - unpredictable output
// Sometimes returns string, sometimes object
// Sometimes includes metrics, sometimes doesn't
```

### 5. Comprehensive Testing
Test edge cases and error scenarios.

```typescript
// ✅ Good tests
- Valid input with all fields
- Valid input with optional fields
- Invalid input (missing required)
- Invalid input (wrong types)
- Large input (performance)
- Edge case (empty array, null, etc.)
- Error handling (when dependency fails)

// ❌ Bad tests
- Only happy path
- No error testing
- No edge cases
```

### 6. Documentation
Provide clear documentation for skill usage.

```typescript
/**
 * Apply React best practices to component code
 * 
 * This skill transforms raw component code into production-ready
 * React code following best practices.
 * 
 * @param input - Component specifications
 * @returns Enhanced React code with best practices applied
 * 
 * @example
 * const skill = new ReactBestPracticesSkill();
 * const output = await skill.execute({
 *   components: [{ name: 'App' }],
 *   projectName: 'my-app'
 * });
 * console.log(output.code); // Production-ready React code
 */
async execute(input: ReactBestPracticesInput): Promise<ReactBestPracticesOutput> { ... }
```

---

## Common Skill Types

### 1. Framework Skills
Encode knowledge about specific frameworks.

```typescript
class ReactBestPracticesSkill extends BaseSkill {
  // React-specific patterns:
  // - Functional components
  // - Hooks (useState, useEffect, etc.)
  // - Context API
  // - Error boundaries
  // - Performance optimization (React.memo, useMemo)
}
```

### 2. Pattern Skills
Encode architectural and design patterns.

```typescript
class ArchitecturePatternsSkill extends BaseSkill {
  // Patterns:
  // - MVC / MVVM
  // - Observer pattern
  // - Factory pattern
  // - Dependency injection
  // - Service locator
}
```

### 3. Quality Skills
Encode code quality standards.

```typescript
class TestingFrameworkSkill extends BaseSkill {
  // Testing patterns:
  // - Unit testing
  // - Integration testing
  // - Mocking
  // - Assertions
  // - Coverage targets
}
```

### 4. Best Practice Skills
Encode domain-specific best practices.

```typescript
class SecurityBestPracticesSkill extends BaseSkill {
  // Security practices:
  // - Input validation
  // - SQL injection prevention
  // - XSS prevention
  // - Authentication
  // - Authorization
  // - Encryption
}
```

---

## Integration Checklist

When creating a new skill:

- [ ] **Definition**: Created `/.github/skills/{name}.md`
- [ ] **Implementation**: Created `/src/skills/{name}.ts`
- [ ] **Type Safety**: Defined input and output interfaces
- [ ] **Validation**: Implements `validate()` method
- [ ] **Execution**: Implements `execute()` method
- [ ] **Error Handling**: Throws descriptive errors
- [ ] **Tests**: Created comprehensive test suite
- [ ] **Coverage**: At least 80% test coverage
- [ ] **Documentation**: JSDoc comments
- [ ] **Registration**: Registered with `skillRegistry`
- [ ] **Category**: Correct category assigned
- [ ] **Version**: Semantic version assigned
- [ ] **Reusability**: Can be used by multiple agents

---

## Examples

### Example 1: Simple Skill

```typescript
export class MyFrameworkBestPracticesSkill extends BaseSkill {
  name = 'my-framework-best-practices';
  category = 'implementation';
  description = 'Best practices for my framework';
  version = '1.0.0';
  
  async validate(input: MyInput): Promise<ValidationResult> {
    return {
      isValid: !!input.code,
      errors: input.code ? [] : ['code is required']
    };
  }
  
  async execute(input: MyInput): Promise<MyOutput> {
    const enhanced = this.applyPatterns(input.code);
    return { success: true, code: enhanced };
  }
  
  private applyPatterns(code: string): string {
    // Apply best practices
    return code;
  }
}
```

### Example 2: Complex Skill

```typescript
export class AdvancedSecuritySkill extends BaseSkill {
  name = 'advanced-security-practices';
  category = 'devops';
  description = 'Advanced security practices';
  version = '2.0.0';
  dependencies = ['security-best-practices'];
  
  async execute(input: SecurityInput): Promise<SecurityOutput> {
    // Scan for vulnerabilities
    const vulns = await this.scanVulnerabilities(input.code);
    
    // Generate security recommendations
    const recommendations = this.generateRecommendations(vulns);
    
    // Enhance code with security
    const enhanced = await this.enhanceCode(input.code, vulns);
    
    return {
      success: true,
      code: enhanced,
      vulnerabilities: vulns,
      recommendations,
      securityScore: this.calculateScore(vulns)
    };
  }
  
  private async scanVulnerabilities(code: string): Promise<Vulnerability[]> {
    // Implementation...
  }
  
  private generateRecommendations(vulns: Vulnerability[]): string[] {
    // Implementation...
  }
  
  private async enhanceCode(code: string, vulns: Vulnerability[]): Promise<string> {
    // Implementation...
  }
  
  private calculateScore(vulns: Vulnerability[]): number {
    // Implementation...
  }
}
```

---

## Debugging

### Enable Logging

```typescript
// In skill
this.logger.debug('Processing component', componentName);
this.logger.info('Generated code', lineCount);

// Run with debug
DEBUG=my-skill npm start
```

### Step Through Execution

```typescript
// In test
const skill = new MySkill();
debugger; // Set breakpoint
const output = await skill.execute(input);
```

### Test in Isolation

```typescript
// Test without full orchestration
const skill = new MySkill();
const result = await skill.execute(testInput);
console.log(result);
```

---

## Resources

- [Base Skill Class](../src/core/skill.ts)
- [Agent Development Guide](AGENT_DEVELOPMENT.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [API Reference](../API_REFERENCE.md)

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
