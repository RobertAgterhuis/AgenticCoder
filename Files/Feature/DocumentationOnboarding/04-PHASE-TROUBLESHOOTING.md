# Phase 4: Troubleshooting Documentation

**Phase ID:** F-DOC-P04  
**Feature:** DocumentationOnboarding  
**Duration:** 2-3 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 3 (Reference)

---

## 🎯 Phase Objectives

Deze phase implementeert de **Troubleshooting** documentatie:
- Common errors FAQ
- Debugging guide
- Support channels
- Known issues
- Error code reference

---

## 📦 Deliverables

### 1. Directory Structure

```
docs/
├── troubleshooting/
│   ├── README.md              # Troubleshooting index
│   ├── common-errors.md       # Common error solutions
│   ├── error-codes.md         # Error code reference
│   ├── debugging.md           # Debug tips
│   ├── known-issues.md        # Known issues
│   └── support.md             # Getting help
│
src/
├── docs/
│   └── troubleshooting/
│       ├── FaqGenerator.ts
│       └── ErrorCodeDocGenerator.ts
```

---

## 🔧 Implementation Details

### 4.1 FAQ Generator (`src/docs/troubleshooting/FaqGenerator.ts`)

```typescript
import * as fs from 'fs/promises';

/**
 * FAQ item
 */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  relatedErrors?: string[];
  links?: { text: string; url: string }[];
}

/**
 * FAQ category
 */
export interface FaqCategory {
  name: string;
  description: string;
  icon: string;
}

/**
 * FAQ generator
 */
export class FaqGenerator {
  private faqs: FaqItem[] = [];
  private categories: FaqCategory[] = [
    { name: 'Installation', description: 'Issues with installing AgenticCoder', icon: '📦' },
    { name: 'Configuration', description: 'Configuration problems', icon: '⚙️' },
    { name: 'Execution', description: 'Runtime and execution issues', icon: '▶️' },
    { name: 'Agents', description: 'Agent-related problems', icon: '🤖' },
    { name: 'Azure', description: 'Azure integration issues', icon: '☁️' },
    { name: 'Output', description: 'Generated code issues', icon: '📄' },
  ];

  /**
   * Register all FAQs
   */
  registerAllFaqs(): void {
    // Installation FAQs
    this.addFaq({
      id: 'install-permission-denied',
      question: 'I get "permission denied" when installing globally',
      answer: `
This usually happens on macOS/Linux when npm doesn't have permission to write to the global packages directory.

**Solutions:**

1. **Use sudo (not recommended):**
   \`\`\`bash
   sudo npm install -g @agenticcoder/cli
   \`\`\`

2. **Fix npm permissions (recommended):**
   \`\`\`bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   \`\`\`

3. **Use a Node version manager (best):**
   Use nvm or fnm to manage Node.js installations.
      `.trim(),
      category: 'Installation',
      tags: ['npm', 'permissions', 'macos', 'linux'],
      relatedErrors: ['EACCES', 'EPERM'],
    });

    this.addFaq({
      id: 'install-node-version',
      question: 'Error: "Unsupported Node.js version"',
      answer: `
AgenticCoder requires Node.js 20 or higher.

**Check your version:**
\`\`\`bash
node --version
\`\`\`

**Update Node.js:**

- **Using nvm:**
  \`\`\`bash
  nvm install 20
  nvm use 20
  \`\`\`

- **Using fnm:**
  \`\`\`bash
  fnm install 20
  fnm use 20
  \`\`\`

- **Direct download:** Visit [nodejs.org](https://nodejs.org)
      `.trim(),
      category: 'Installation',
      tags: ['node', 'version'],
      relatedErrors: ['E1010'],
    });

    // Configuration FAQs
    this.addFaq({
      id: 'config-not-found',
      question: 'Error: "Configuration file not found"',
      answer: `
AgenticCoder looks for \`agentic.config.json\` in your project root.

**Solutions:**

1. **Create the config file:**
   \`\`\`bash
   agentic config init
   \`\`\`

2. **Make sure you're in the right directory:**
   \`\`\`bash
   cd your-project-folder
   ls agentic.config.json
   \`\`\`

3. **Specify config location:**
   \`\`\`bash
   agentic run --config ./path/to/config.json
   \`\`\`
      `.trim(),
      category: 'Configuration',
      tags: ['config', 'file-not-found'],
      relatedErrors: ['E8001', 'E8002'],
    });

    this.addFaq({
      id: 'config-invalid-scenario',
      question: 'Error: "Invalid scenario: X"',
      answer: `
The scenario ID must be one of the supported values.

**Valid scenarios:**
- S01, S02, S03, S04, S05 (Standard)
- A01, A02, A03, A04, A05 (Azure)

**Check your config:**
\`\`\`json
{
  "scenario": {
    "id": "S01"  // Must be valid
  }
}
\`\`\`

**List available scenarios:**
\`\`\`bash
agentic list scenarios
\`\`\`
      `.trim(),
      category: 'Configuration',
      tags: ['scenario', 'validation'],
      relatedErrors: ['E2001'],
    });

    // Execution FAQs
    this.addFaq({
      id: 'exec-timeout',
      question: 'Execution times out or hangs',
      answer: `
Long execution times can be caused by several factors.

**Increase timeout:**
\`\`\`json
{
  "advanced": {
    "timeout": 600
  }
}
\`\`\`

**Check for issues:**

1. **Network issues:**
   - Check internet connection
   - Verify API endpoints are reachable

2. **Large projects:**
   - Consider using a simpler scenario first
   - Break down complex requirements

3. **Debug mode:**
   \`\`\`bash
   agentic run --verbose
   \`\`\`

**Resume from checkpoint:**
\`\`\`bash
agentic run --resume
\`\`\`
      `.trim(),
      category: 'Execution',
      tags: ['timeout', 'performance'],
      relatedErrors: ['E1003'],
    });

    this.addFaq({
      id: 'exec-retry-exhausted',
      question: 'Error: "Max retries exceeded"',
      answer: `
This happens when an operation fails repeatedly.

**Common causes:**
- Network instability
- API rate limiting
- Service unavailability

**Solutions:**

1. **Increase retries:**
   \`\`\`json
   {
     "advanced": {
       "maxRetries": 5
     }
   }
   \`\`\`

2. **Wait and retry:**
   \`\`\`bash
   # Wait a few minutes, then
   agentic run --resume
   \`\`\`

3. **Check service status:**
   - Verify all required services are available
   - Check for rate limiting
      `.trim(),
      category: 'Execution',
      tags: ['retry', 'network'],
      relatedErrors: ['E1001', 'E1002'],
    });

    // Agent FAQs
    this.addFaq({
      id: 'agent-skill-not-found',
      question: 'Error: "Skill X not found for agent Y"',
      answer: `
This means an agent is trying to use a skill that isn't registered.

**Solutions:**

1. **Check skill name:**
   \`\`\`bash
   agentic list skills
   \`\`\`

2. **Verify agent configuration:**
   Check that the agent has access to the required skills.

3. **Update AgenticCoder:**
   \`\`\`bash
   npm update -g @agenticcoder/cli
   \`\`\`

**Custom skills:**
If using custom skills, ensure they are properly registered.
      `.trim(),
      category: 'Agents',
      tags: ['skills', 'agents'],
      relatedErrors: ['E4001'],
    });

    this.addFaq({
      id: 'agent-handoff-failed',
      question: 'Error: "Agent handoff failed"',
      answer: `
Handoff failures occur when one agent can't pass data to another.

**Common causes:**
- Previous agent produced invalid output
- Missing required data
- Agent crash

**Debug:**
\`\`\`bash
agentic run --verbose
\`\`\`

**View agent logs:**
Check the \`.agentic/logs/\` directory for detailed logs.

**Resume:**
\`\`\`bash
agentic run --resume
\`\`\`
      `.trim(),
      category: 'Agents',
      tags: ['handoff', 'agents'],
      relatedErrors: ['E4002'],
    });

    // Azure FAQs
    this.addFaq({
      id: 'azure-auth-failed',
      question: 'Error: "Azure authentication failed"',
      answer: `
Azure operations require proper authentication.

**Solutions:**

1. **Login to Azure CLI:**
   \`\`\`bash
   az login
   \`\`\`

2. **Set subscription:**
   \`\`\`bash
   az account set --subscription <id>
   \`\`\`

3. **Verify in config:**
   \`\`\`json
   {
     "azure": {
       "subscriptionId": "your-subscription-id"
     }
   }
   \`\`\`

4. **Use environment variable:**
   \`\`\`bash
   export AZURE_SUBSCRIPTION_ID=your-subscription-id
   \`\`\`
      `.trim(),
      category: 'Azure',
      tags: ['azure', 'authentication'],
      relatedErrors: ['E5004', 'E6001'],
    });

    this.addFaq({
      id: 'azure-resource-exists',
      question: 'Error: "Resource already exists"',
      answer: `
This happens when trying to create a resource that already exists.

**Solutions:**

1. **Use different name:**
   Update the resource naming in your configuration.

2. **Delete existing resource:**
   \`\`\`bash
   az resource delete --ids <resource-id>
   \`\`\`

3. **Import existing:**
   If the resource should be managed, import it.

4. **Use naming prefix:**
   \`\`\`json
   {
     "azure": {
       "naming": {
         "prefix": "myapp-dev"
       }
     }
   }
   \`\`\`
      `.trim(),
      category: 'Azure',
      tags: ['azure', 'resources'],
      relatedErrors: ['E5004'],
    });

    // Output FAQs
    this.addFaq({
      id: 'output-overwrite',
      question: 'Generated files overwrite my changes',
      answer: `
By default, AgenticCoder won't overwrite existing files.

**To preserve your changes:**

1. **Check config:**
   \`\`\`json
   {
     "output": {
       "overwrite": false
     }
   }
   \`\`\`

2. **Use different output dir:**
   \`\`\`bash
   agentic run --output ./generated
   \`\`\`

3. **Use git:**
   Commit your changes before running generation.

**Merge changes:**
For selective updates, use:
\`\`\`bash
agentic run --merge
\`\`\`
      `.trim(),
      category: 'Output',
      tags: ['output', 'files'],
    });

    this.addFaq({
      id: 'output-typescript-errors',
      question: 'Generated TypeScript has errors',
      answer: `
TypeScript errors in generated code can have several causes.

**Quick fixes:**

1. **Install dependencies:**
   \`\`\`bash
   cd output
   npm install
   \`\`\`

2. **Check TypeScript version:**
   Ensure your TypeScript version matches the generated code.

3. **Run type check:**
   \`\`\`bash
   npx tsc --noEmit
   \`\`\`

**Common issues:**
- Missing type definitions: \`npm install @types/xxx\`
- Strict mode mismatch: Check \`tsconfig.json\`
- Import paths: Verify path aliases

**Report issue:**
If errors persist, please report with the error details.
      `.trim(),
      category: 'Output',
      tags: ['typescript', 'errors'],
      relatedErrors: ['E2002'],
    });
  }

  /**
   * Add FAQ
   */
  private addFaq(faq: FaqItem): void {
    this.faqs.push(faq);
  }

  /**
   * Generate index
   */
  generateIndex(): string {
    const lines: string[] = [];

    lines.push('# Troubleshooting');
    lines.push('');
    lines.push('Find solutions to common problems and get help.');
    lines.push('');

    // Quick links
    lines.push('## Quick Links');
    lines.push('');
    lines.push('- [Common Errors](./common-errors.md) - Solutions to frequent issues');
    lines.push('- [Error Codes](./error-codes.md) - Error code reference');
    lines.push('- [Debugging](./debugging.md) - Debug tips and techniques');
    lines.push('- [Known Issues](./known-issues.md) - Current limitations');
    lines.push('- [Get Support](./support.md) - Contact and community');
    lines.push('');

    // Categories
    lines.push('## Browse by Category');
    lines.push('');
    for (const cat of this.categories) {
      const count = this.faqs.filter(f => f.category === cat.name).length;
      lines.push(`### ${cat.icon} ${cat.name}`);
      lines.push('');
      lines.push(cat.description);
      lines.push('');

      const catFaqs = this.faqs.filter(f => f.category === cat.name);
      for (const faq of catFaqs) {
        lines.push(`- [${faq.question}](./common-errors.md#${faq.id})`);
      }
      lines.push('');
    }

    // Search tips
    lines.push('## Can\'t Find Your Issue?');
    lines.push('');
    lines.push('1. Search the [error codes](./error-codes.md)');
    lines.push('2. Check [known issues](./known-issues.md)');
    lines.push('3. Ask in [GitHub Discussions](https://github.com/org/agenticcoder/discussions)');
    lines.push('4. [Open an issue](https://github.com/org/agenticcoder/issues/new)');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate common errors page
   */
  generateCommonErrors(): string {
    const lines: string[] = [];

    lines.push('# Common Errors & Solutions');
    lines.push('');
    lines.push('Solutions to frequently encountered problems.');
    lines.push('');

    // Table of contents
    lines.push('## Contents');
    lines.push('');
    for (const cat of this.categories) {
      const catFaqs = this.faqs.filter(f => f.category === cat.name);
      if (catFaqs.length > 0) {
        lines.push(`- [${cat.name}](#${cat.name.toLowerCase()})`);
      }
    }
    lines.push('');

    // FAQs by category
    for (const cat of this.categories) {
      const catFaqs = this.faqs.filter(f => f.category === cat.name);
      if (catFaqs.length === 0) continue;

      lines.push(`## ${cat.name}`);
      lines.push('');

      for (const faq of catFaqs) {
        lines.push(`### ${faq.question} {#${faq.id}}`);
        lines.push('');
        lines.push(faq.answer);
        lines.push('');

        if (faq.relatedErrors && faq.relatedErrors.length > 0) {
          lines.push(`**Related errors:** ${faq.relatedErrors.map(e => `\`${e}\``).join(', ')}`);
          lines.push('');
        }

        if (faq.tags.length > 0) {
          lines.push(`**Tags:** ${faq.tags.join(', ')}`);
          lines.push('');
        }

        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Write all files
   */
  async writeAll(outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(
      `${outputDir}/README.md`,
      this.generateIndex(),
      'utf-8'
    );

    await fs.writeFile(
      `${outputDir}/common-errors.md`,
      this.generateCommonErrors(),
      'utf-8'
    );
  }
}

/**
 * Create FAQ generator
 */
export function createFaqGenerator(): FaqGenerator {
  const generator = new FaqGenerator();
  generator.registerAllFaqs();
  return generator;
}
```

### 4.2 Error Code Doc Generator (`src/docs/troubleshooting/ErrorCodeDocGenerator.ts`)

```typescript
import * as fs from 'fs/promises';

/**
 * Error code info
 */
export interface ErrorCodeInfo {
  code: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  causes: string[];
  solutions: string[];
  example?: string;
}

/**
 * Error code doc generator
 */
export class ErrorCodeDocGenerator {
  private errors: ErrorCodeInfo[] = [];

  /**
   * Register all error codes
   */
  registerAllCodes(): void {
    // Transient errors (E1xxx)
    this.addError({
      code: 'E1001',
      name: 'TransientError',
      description: 'A temporary error that may resolve on retry',
      category: 'Transient',
      severity: 'low',
      causes: ['Network timeout', 'Service temporarily unavailable', 'Rate limiting'],
      solutions: ['Wait and retry', 'Check network connection', 'Reduce request rate'],
    });

    this.addError({
      code: 'E1002',
      name: 'NetworkError',
      description: 'Network connection failed',
      category: 'Transient',
      severity: 'medium',
      causes: ['No internet connection', 'DNS resolution failed', 'Firewall blocking'],
      solutions: ['Check internet connection', 'Verify DNS settings', 'Check firewall rules'],
    });

    this.addError({
      code: 'E1003',
      name: 'TimeoutError',
      description: 'Operation timed out',
      category: 'Transient',
      severity: 'medium',
      causes: ['Slow network', 'Overloaded service', 'Large operation'],
      solutions: ['Increase timeout', 'Retry with backoff', 'Check service status'],
    });

    // Validation errors (E2xxx)
    this.addError({
      code: 'E2001',
      name: 'ValidationError',
      description: 'Input validation failed',
      category: 'Validation',
      severity: 'medium',
      causes: ['Invalid input format', 'Missing required field', 'Value out of range'],
      solutions: ['Check input format', 'Provide all required fields', 'Verify value constraints'],
    });

    this.addError({
      code: 'E2002',
      name: 'TypeScriptError',
      description: 'TypeScript compilation error',
      category: 'Validation',
      severity: 'medium',
      causes: ['Type mismatch', 'Missing types', 'Syntax error'],
      solutions: ['Fix type errors', 'Install missing @types packages', 'Correct syntax'],
    });

    this.addError({
      code: 'E2003',
      name: 'BicepValidationError',
      description: 'Bicep template validation failed',
      category: 'Validation',
      severity: 'medium',
      causes: ['Invalid resource type', 'Missing required properties', 'Invalid parameter'],
      solutions: ['Check resource definition', 'Add required properties', 'Verify parameter values'],
    });

    // Resource errors (E3xxx)
    this.addError({
      code: 'E3001',
      name: 'FileNotFoundError',
      description: 'File or resource not found',
      category: 'Resource',
      severity: 'medium',
      causes: ['File doesn\'t exist', 'Wrong path', 'File deleted'],
      solutions: ['Verify file path', 'Check file exists', 'Restore from backup'],
    });

    this.addError({
      code: 'E3002',
      name: 'PermissionDeniedError',
      description: 'Permission denied for operation',
      category: 'Resource',
      severity: 'high',
      causes: ['Insufficient permissions', 'File locked', 'Read-only filesystem'],
      solutions: ['Check permissions', 'Close file locks', 'Use appropriate user'],
    });

    this.addError({
      code: 'E3003',
      name: 'DiskFullError',
      description: 'Insufficient disk space',
      category: 'Resource',
      severity: 'high',
      causes: ['Disk full', 'Quota exceeded', 'Large generated output'],
      solutions: ['Free disk space', 'Increase quota', 'Clean old outputs'],
    });

    // Logic errors (E4xxx)
    this.addError({
      code: 'E4001',
      name: 'UnexpectedStateError',
      description: 'System in unexpected state',
      category: 'Logic',
      severity: 'high',
      causes: ['Corrupted state', 'Race condition', 'Missing precondition'],
      solutions: ['Reset state', 'Restart execution', 'Check preconditions'],
    });

    this.addError({
      code: 'E4002',
      name: 'InvalidOperationError',
      description: 'Operation not valid in current context',
      category: 'Logic',
      severity: 'medium',
      causes: ['Wrong execution order', 'Missing dependency', 'Conflicting operations'],
      solutions: ['Check execution order', 'Resolve dependencies', 'Avoid conflicts'],
    });

    // External errors (E5xxx)
    this.addError({
      code: 'E5001',
      name: 'MCPServerError',
      description: 'MCP server communication failed',
      category: 'External',
      severity: 'high',
      causes: ['Server not running', 'Connection refused', 'Protocol error'],
      solutions: ['Start MCP server', 'Check server configuration', 'Verify protocol'],
    });

    this.addError({
      code: 'E5002',
      name: 'APIError',
      description: 'External API returned error',
      category: 'External',
      severity: 'medium',
      causes: ['API error response', 'Rate limited', 'Invalid credentials'],
      solutions: ['Check API response', 'Wait for rate limit', 'Verify credentials'],
    });

    this.addError({
      code: 'E5003',
      name: 'GitHubError',
      description: 'GitHub API error',
      category: 'External',
      severity: 'medium',
      causes: ['Invalid token', 'Repository not found', 'Rate limited'],
      solutions: ['Check GitHub token', 'Verify repository', 'Wait for rate limit'],
    });

    this.addError({
      code: 'E5004',
      name: 'AzureError',
      description: 'Azure operation failed',
      category: 'External',
      severity: 'high',
      causes: ['Auth failed', 'Resource not found', 'Quota exceeded'],
      solutions: ['Login to Azure CLI', 'Check resource exists', 'Request quota increase'],
    });

    // Security errors (E6xxx)
    this.addError({
      code: 'E6001',
      name: 'UnauthorizedError',
      description: 'Not authorized for this operation',
      category: 'Security',
      severity: 'high',
      causes: ['Invalid credentials', 'Token expired', 'Insufficient permissions'],
      solutions: ['Re-authenticate', 'Refresh token', 'Request permissions'],
    });

    this.addError({
      code: 'E6002',
      name: 'TokenExpiredError',
      description: 'Authentication token has expired',
      category: 'Security',
      severity: 'medium',
      causes: ['Token TTL exceeded', 'Session timeout', 'Clock skew'],
      solutions: ['Refresh token', 'Re-login', 'Check system time'],
    });

    // Critical errors (E7xxx)
    this.addError({
      code: 'E7001',
      name: 'CriticalSystemError',
      description: 'Critical system failure',
      category: 'Critical',
      severity: 'critical',
      causes: ['Out of memory', 'System crash', 'Unrecoverable state'],
      solutions: ['Restart application', 'Check system resources', 'Contact support'],
    });

    // Configuration errors (E8xxx)
    this.addError({
      code: 'E8001',
      name: 'ConfigurationError',
      description: 'Configuration is invalid',
      category: 'Configuration',
      severity: 'medium',
      causes: ['Invalid JSON', 'Missing required field', 'Type mismatch'],
      solutions: ['Validate JSON syntax', 'Add missing fields', 'Check value types'],
    });

    this.addError({
      code: 'E8002',
      name: 'MissingConfigurationError',
      description: 'Required configuration is missing',
      category: 'Configuration',
      severity: 'high',
      causes: ['Config file not found', 'Environment variable not set', 'Missing section'],
      solutions: ['Create config file', 'Set environment variable', 'Add missing section'],
    });
  }

  /**
   * Add error
   */
  private addError(error: ErrorCodeInfo): void {
    this.errors.push(error);
  }

  /**
   * Generate markdown
   */
  generateMarkdown(): string {
    const lines: string[] = [];

    lines.push('# Error Code Reference');
    lines.push('');
    lines.push('Complete reference for all AgenticCoder error codes.');
    lines.push('');

    // Overview
    lines.push('## Error Code Ranges');
    lines.push('');
    lines.push('| Range | Category | Severity |');
    lines.push('|-------|----------|----------|');
    lines.push('| E1xxx | Transient | Low-Medium |');
    lines.push('| E2xxx | Validation | Medium |');
    lines.push('| E3xxx | Resource | Medium-High |');
    lines.push('| E4xxx | Logic | Medium-High |');
    lines.push('| E5xxx | External | Medium-High |');
    lines.push('| E6xxx | Security | High |');
    lines.push('| E7xxx | Critical | Critical |');
    lines.push('| E8xxx | Configuration | Medium-High |');
    lines.push('');

    // By category
    const categories = [...new Set(this.errors.map(e => e.category))];

    for (const category of categories) {
      const catErrors = this.errors.filter(e => e.category === category);
      
      lines.push(`## ${category} Errors`);
      lines.push('');

      for (const error of catErrors) {
        lines.push(`### ${error.code} - ${error.name}`);
        lines.push('');
        lines.push(`**Severity:** ${error.severity}`);
        lines.push('');
        lines.push(error.description);
        lines.push('');

        lines.push('**Possible causes:**');
        for (const cause of error.causes) {
          lines.push(`- ${cause}`);
        }
        lines.push('');

        lines.push('**Solutions:**');
        for (const solution of error.solutions) {
          lines.push(`- ${solution}`);
        }
        lines.push('');

        if (error.example) {
          lines.push('**Example:**');
          lines.push('```');
          lines.push(error.example);
          lines.push('```');
          lines.push('');
        }

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
 * Create error code doc generator
 */
export function createErrorCodeDocGenerator(): ErrorCodeDocGenerator {
  const generator = new ErrorCodeDocGenerator();
  generator.registerAllCodes();
  return generator;
}
```

---

## 📄 Static Documents

### `docs/troubleshooting/debugging.md`

```markdown
# Debugging Guide

Tips and techniques for debugging AgenticCoder issues.

## Enable Debug Mode

```bash
# Via environment variable
export AGENTIC_DEBUG=true
agentic run

# Via CLI flag
agentic run --verbose

# Via config
{
  "advanced": {
    "debug": true
  }
}
```

## Log Files

Logs are stored in `.agentic/logs/`:

```
.agentic/
├── logs/
│   ├── agentic.log         # Main log
│   ├── agents/             # Per-agent logs
│   │   ├── plan-agent.log
│   │   └── ...
│   └── executions/         # Per-execution logs
│       └── exec-abc123.log
```

## View Real-time Logs

```bash
# Follow main log
tail -f .agentic/logs/agentic.log

# Filter by level
grep "ERROR" .agentic/logs/agentic.log
```

## Debug Specific Agents

```bash
# Run single agent
agentic run --agent PlanAgent --verbose

# Skip to specific phase
agentic run --phase 3 --verbose
```

## Checkpoint Recovery

```bash
# List checkpoints
agentic status --checkpoints

# Resume from checkpoint
agentic run --resume

# Reset to specific checkpoint
agentic run --from-checkpoint <id>
```

## Common Debug Scenarios

### Agent Hangs
1. Check `.agentic/logs/agents/<agent>.log`
2. Look for pending operations
3. Increase timeout: `"timeout": 600`

### Wrong Output
1. Enable verbose: `--verbose`
2. Check agent inputs in logs
3. Verify configuration

### Memory Issues
1. Monitor with `top` or Task Manager
2. Reduce parallel execution
3. Clear checkpoint cache

## Getting More Help

- [Support Channels](./support.md)
- [GitHub Issues](https://github.com/org/agenticcoder/issues)
```

### `docs/troubleshooting/support.md`

```markdown
# Getting Support

Ways to get help with AgenticCoder.

## Self-Service

1. **Documentation**
   - [User Guide](../user-guide/)
   - [FAQ](./common-errors.md)
   - [Error Codes](./error-codes.md)

2. **Search Issues**
   - [GitHub Issues](https://github.com/org/agenticcoder/issues)

## Community Support

### GitHub Discussions
Ask questions and share ideas:
- [Q&A](https://github.com/org/agenticcoder/discussions/categories/q-a)
- [Ideas](https://github.com/org/agenticcoder/discussions/categories/ideas)

### Discord
Join our community Discord:
- [Discord Server](https://discord.gg/agenticcoder)

## Report Issues

### Bug Reports
1. Search existing issues first
2. Use the bug report template
3. Include:
   - AgenticCoder version
   - Node.js version
   - OS and version
   - Steps to reproduce
   - Error logs

[Report a Bug](https://github.com/org/agenticcoder/issues/new?template=bug_report.md)

### Feature Requests
[Request a Feature](https://github.com/org/agenticcoder/issues/new?template=feature_request.md)

## Enterprise Support

For enterprise support options:
- Email: enterprise@agenticcoder.com
- [Enterprise Plans](https://agenticcoder.com/enterprise)
```

---

## 📋 Acceptance Criteria

- [ ] FAQ covers most common issues
- [ ] Error codes fully documented
- [ ] Debugging guide is helpful
- [ ] Support channels are clear
- [ ] Search/navigation works well
- [ ] Related errors are linked
- [ ] Solutions are actionable

---

## 🔗 Navigation

← [03-PHASE-REFERENCE.md](03-PHASE-REFERENCE.md) | [05-PHASE-TUTORIALS.md](05-PHASE-TUTORIALS.md) →
