# Validation Framework

Comprehensive validation system for all AgenticCoder outputs.

## Overview

The Validation Framework:
- **Schema Validation** - JSON/YAML schema compliance
- **Syntax Validation** - Code and markup syntax
- **Semantic Validation** - Logical correctness
- **Security Validation** - Security best practices
- **Quality Validation** - Code quality standards

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Validation Framework                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Schema    │  │   Syntax    │  │  Semantic   │         │
│  │  Validator  │  │  Validator  │  │  Validator  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Security   │  │   Quality   │  │  Composite  │         │
│  │  Validator  │  │  Validator  │  │  Validator  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                          │                                  │
│                          ▼                                  │
│              ┌─────────────────────────┐                   │
│              │    Validation Result    │                   │
│              └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Validation Result

### Structure

```typescript
interface ValidationResult {
  valid: boolean;
  score: number;  // 0-100
  
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  
  categories: {
    schema: CategoryResult;
    syntax: CategoryResult;
    semantic: CategoryResult;
    security: CategoryResult;
    quality: CategoryResult;
  };
  
  metadata: {
    artifact: string;
    validators: string[];
    duration: number;
    timestamp: Date;
  };
}

interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  
  suggestion?: string;
  autoFixable: boolean;
}
```

## Validators

### Schema Validator

Validates JSON/YAML against schemas.

```typescript
class SchemaValidator implements IValidator {
  private schemas: Map<string, JSONSchema>;
  
  async validate(artifact: Artifact): Promise<ValidationResult> {
    const schema = this.getSchema(artifact.type);
    const data = JSON.parse(artifact.content);
    
    const errors: ValidationIssue[] = [];
    const ajv = new Ajv({ allErrors: true });
    const valid = ajv.validate(schema, data);
    
    if (!valid) {
      for (const error of ajv.errors) {
        errors.push({
          code: 'SCHEMA_ERROR',
          message: error.message,
          severity: 'error',
          category: 'schema',
          location: {
            file: artifact.path,
            line: this.findLine(artifact.content, error.dataPath)
          }
        });
      }
    }
    
    return { valid, errors, ... };
  }
}
```

**Supported Schemas:**

| Artifact Type | Schema |
|---------------|--------|
| Agent Config | `agent-config.schema.json` |
| Skill Config | `skill-config.schema.json` |
| Scenario | `scenario.schema.json` |
| Phase Config | `phase-config.schema.json` |
| Bicep Params | `bicep-params.schema.json` |

### Syntax Validator

Validates code and markup syntax.

```typescript
class SyntaxValidator implements IValidator {
  private parsers: Map<string, Parser>;
  
  async validate(artifact: Artifact): Promise<ValidationResult> {
    const parser = this.getParser(artifact.extension);
    
    try {
      parser.parse(artifact.content);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'SYNTAX_ERROR',
          message: error.message,
          severity: 'error',
          category: 'syntax',
          location: {
            file: artifact.path,
            line: error.line,
            column: error.column
          }
        }]
      };
    }
  }
}
```

**Supported Languages:**

| Extension | Parser |
|-----------|--------|
| `.ts`, `.tsx` | TypeScript |
| `.js`, `.jsx` | Babel |
| `.cs` | Roslyn |
| `.bicep` | Bicep CLI |
| `.json` | JSON |
| `.yaml`, `.yml` | YAML |
| `.md` | Markdown |

### Semantic Validator

Validates logical correctness.

```typescript
class SemanticValidator implements IValidator {
  private rules: SemanticRule[];
  
  async validate(artifact: Artifact): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    
    for (const rule of this.rules) {
      if (rule.appliesTo(artifact)) {
        const ruleIssues = await rule.validate(artifact);
        issues.push(...ruleIssues);
      }
    }
    
    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      errors: issues.filter(i => i.severity === 'error'),
      warnings: issues.filter(i => i.severity === 'warning')
    };
  }
}
```

**Semantic Rules:**

| Rule | Description |
|------|-------------|
| `no-undefined-refs` | All references must exist |
| `dependency-order` | Dependencies in correct order |
| `no-circular-deps` | No circular dependencies |
| `complete-coverage` | All requirements addressed |
| `consistent-naming` | Naming conventions followed |

### Security Validator

Validates security best practices.

```typescript
class SecurityValidator implements IValidator {
  private scanners: SecurityScanner[];
  
  async validate(artifact: Artifact): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    
    // Check for secrets
    const secrets = await this.scanForSecrets(artifact);
    issues.push(...secrets);
    
    // Check for vulnerabilities
    const vulns = await this.scanForVulnerabilities(artifact);
    issues.push(...vulns);
    
    // Check security patterns
    const patterns = await this.checkSecurityPatterns(artifact);
    issues.push(...patterns);
    
    return { ... };
  }
}
```

**Security Checks:**

| Check | Description |
|-------|-------------|
| Secret Detection | API keys, passwords, tokens |
| Dependency Audit | Known vulnerabilities |
| OWASP Patterns | Common security issues |
| Azure Security | Azure-specific best practices |
| Encryption | Proper encryption usage |

### Quality Validator

Validates code quality.

```typescript
class QualityValidator implements IValidator {
  private linters: Map<string, Linter>;
  
  async validate(artifact: Artifact): Promise<ValidationResult> {
    const linter = this.getLinter(artifact.extension);
    const results = await linter.lint(artifact.content);
    
    return {
      valid: results.errorCount === 0,
      errors: results.errors.map(this.toLinterIssue),
      warnings: results.warnings.map(this.toLinterIssue),
      score: this.calculateScore(results)
    };
  }
}
```

**Quality Tools:**

| Language | Linter |
|----------|--------|
| TypeScript | ESLint |
| JavaScript | ESLint |
| C# | Roslyn Analyzers |
| Bicep | Bicep Linter |
| Markdown | markdownlint |
| YAML | yamllint |

## Composite Validation

### Validation Pipeline

```typescript
class ValidationPipeline {
  private validators: IValidator[];
  
  async validate(artifact: Artifact): Promise<ValidationResult> {
    const results: ValidationResult[] = [];
    
    for (const validator of this.validators) {
      if (validator.appliesTo(artifact)) {
        const result = await validator.validate(artifact);
        results.push(result);
        
        // Stop on critical error
        if (result.errors.some(e => e.severity === 'critical')) {
          break;
        }
      }
    }
    
    return this.mergeResults(results);
  }
}
```

### Artifact-Type Pipelines

```yaml
# .agentic/config/validation.yaml
pipelines:
  typescript:
    - syntax
    - schema
    - quality
    - security
    
  bicep:
    - syntax
    - schema
    - security
    - semantic
    
  markdown:
    - syntax
    - quality
    - semantic
    
  config:
    - schema
    - semantic
```

## Usage

### CLI Commands

```bash
# Validate single file
node bin/agentic.js validate file.ts

# Validate directory
node bin/agentic.js validate src/

# Validate with specific validators
node bin/agentic.js validate file.ts --validators syntax,security

# Auto-fix issues
node bin/agentic.js validate file.ts --fix

# Output JSON report
node bin/agentic.js validate src/ --output report.json
```

### Programmatic API

```typescript
const framework = new ValidationFramework();

// Validate single artifact
const result = await framework.validate('src/component.tsx');

if (!result.valid) {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
}

// Validate with options
const result2 = await framework.validate('infra/main.bicep', {
  validators: ['syntax', 'security'],
  failOnWarning: true,
  autoFix: true
});

// Batch validation
const results = await framework.validateAll([
  'src/**/*.ts',
  'infra/**/*.bicep'
]);
```

## Custom Validators

### Creating a Validator

```typescript
class CustomValidator implements IValidator {
  id = 'custom-validator';
  
  appliesTo(artifact: Artifact): boolean {
    return artifact.extension === '.custom';
  }
  
  async validate(artifact: Artifact): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    
    // Custom validation logic
    if (!artifact.content.includes('required-header')) {
      issues.push({
        code: 'MISSING_HEADER',
        message: 'File must include required header',
        severity: 'error',
        category: 'custom',
        autoFixable: true
      });
    }
    
    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      errors: issues.filter(i => i.severity === 'error'),
      warnings: issues.filter(i => i.severity === 'warning'),
      ...
    };
  }
}

// Register validator
framework.registerValidator(new CustomValidator());
```

### Custom Rules

```typescript
const customRule: SemanticRule = {
  id: 'my-rule',
  description: 'My custom semantic rule',
  
  appliesTo: (artifact) => artifact.type === 'component',
  
  validate: async (artifact) => {
    // Rule logic
    return [];
  }
};

semanticValidator.addRule(customRule);
```

## Integration

### With Feedback Loop

```typescript
feedbackLoop.onValidationFailed(async (artifact, result) => {
  // Trigger correction
  await feedbackLoop.requestCorrection({
    artifact,
    issues: result.errors,
    maxIterations: 3
  });
});
```

### With Workflow Engine

```typescript
engine.on('agent:completed', async (event) => {
  for (const artifact of event.artifacts) {
    const result = await framework.validate(artifact);
    
    if (!result.valid) {
      engine.emit('validation:failed', { artifact, result });
    }
  }
});
```

### With Self-Learning

```typescript
framework.on('validation:completed', async (result) => {
  await selfLearning.recordValidation({
    artifact: result.metadata.artifact,
    score: result.score,
    issues: result.errors.length + result.warnings.length
  });
});
```

## Configuration

```yaml
# .agentic/config/validation.yaml
validation:
  enabled: true
  failOnError: true
  failOnWarning: false
  
  autoFix:
    enabled: true
    safeOnly: true
    
  validators:
    schema:
      enabled: true
      schemasDir: '.github/schemas/'
      
    syntax:
      enabled: true
      
    semantic:
      enabled: true
      rules:
        - no-undefined-refs
        - dependency-order
        - consistent-naming
        
    security:
      enabled: true
      secretsPattern: '.agentic/secrets.patterns'
      severityThreshold: 'high'
      
    quality:
      enabled: true
      eslintConfig: '.eslintrc.json'
      minScore: 70
      
  reporting:
    format: 'json'
    outputDir: '.agentic/validation/'
    includeInSummary: true
```

## Reports

### Validation Report

```markdown
## Validation Report

**Artifact:** src/components/Button.tsx
**Date:** 2024-01-15 10:30:00
**Score:** 85/100

### Errors (0)
None

### Warnings (3)
1. [QUALITY] Line 15: Unused variable 'temp'
2. [QUALITY] Line 28: Missing return type
3. [SECURITY] Line 45: Consider using parameterized query

### Summary
- Schema: ✓ Passed
- Syntax: ✓ Passed
- Semantic: ✓ Passed
- Security: ⚠ 1 warning
- Quality: ⚠ 2 warnings
```

## Next Steps

- [Feedback Loop](Feedback-Loop) - Correction system
- [Self-Learning](Self-Learning) - Quality tracking
- [Agent Base](Agent-Base) - Agent validation
