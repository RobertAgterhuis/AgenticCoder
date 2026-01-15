# Developer Guide

**Version**: 2.0  
**Updated**: January 13, 2026

---

## Overview

This guide helps developers:
- Set up their development environment
- Understand project structure
- Follow code standards
- Test and debug
- Contribute effectively

---

## Prerequisites

**Required**:
- Git
- Node.js 18+ (recommended: 20+)
- npm 8+
- Code editor (VS Code recommended)
- GitHub account (for contributing)

**Optional**:
- Docker (for container scenarios)
- Cloud SDKs (AWS/Azure/GCP for deployment testing)

---

## Environment Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/agenticcoder.git
cd agenticcoder

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. Install Dependencies

```bash
# Install project dependencies
npm install

# Verify installation
npm list

# Install global tools (optional)
npm install -g @agenticcoder/cli
```

### 3. Configure Your IDE

**VS Code Setup** (Recommended):

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.enablePromptUseWorkspaceTypesForJsFiles": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

**Required Extensions**:
- ESLint
- Prettier
- TypeScript Vue Plugin
- GitLens
- GitHub Copilot (optional)

### 4. Verify Setup

```bash
# Run tests
npm test

# Check linting
npm run lint

# Build project
npm build

# Start development server
npm run dev
```

All commands should pass with no errors.

---

## Project Structure

```
agenticcoder/
├── .github/                    # GitHub configuration
│   ├── agents/                 # 26 agent definitions
│   ├── skills/                 # 33 skill definitions
│   └── .agenticcoder/          # Runtime schemas
├── src/                        # Source code
│   ├── agents/                 # Agent implementations
│   ├── skills/                 # Skill implementations
│   ├── core/                   # Core orchestration
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utilities
├── tests/                      # Test files
│   ├── agents/                 # Agent tests
│   ├── skills/                 # Skill tests
│   └── integration/            # Integration tests
├── docs/                       # System documentation
├── documentation/              # GitHub-style docs (this folder)
├── examples/                   # Example projects
├── .eslintrc.json              # ESLint config
├── tsconfig.json               # TypeScript config
├── jest.config.js              # Jest config
└── package.json                # Dependencies
```

### Key Directories

**/.github/agents/**
- 26 agent definition files (.agent.md)
- Each defines agent capability and handoffs
- Example: `@code-architect.agent.md`

**/.github/skills/**
- 33 skill definition files
- Each defines reusable capability
- Example: `react-best-practices.md`

**/src/agents/**
- Agent implementations
- Match definitions in /.github/agents/
- Example: `code-architect.ts`

**/src/skills/**
- Skill implementations
- Organized by category
- Example: `frontend/react-specialist.ts`

**/tests/**
- Test files mirror source structure
- Unit tests for individual agents/skills
- Integration tests for flows
- Example: `tests/agents/code-architect.test.ts`

---

## Code Style Guide

### TypeScript

**Format**: Use Prettier (automatic on save)

**Style Rules**:

```typescript
// ✅ Good
const calculateComplexity = (code: string): number => {
  const lines = code.split('\n').length;
  return lines > 1000 ? 'high' : 'low';
};

// ❌ Bad
function calculateComplexity(code) {
  let lines = code.split('\n').length
  if(lines>1000){return 'high'}else{return 'low'}
}

// ✅ Import organization
import fs from 'fs';
import path from 'path';

import { AgentConfig } from '@/types';
import { Logger } from '@/utils';

// ❌ Don't mix styles
import {AgentConfig,Logger} from '@/types';

// ✅ Use const/let, avoid var
const config = { timeout: 5000 };
let counter = 0;

// ✅ Type everything
interface AgentOptions {
  name: string;
  timeout?: number;
  retries: number;
}

const agent = (options: AgentOptions): void => {
  // ...
};

// ✅ Error handling
try {
  await executeAgent();
} catch (error) {
  if (error instanceof AgentError) {
    logger.error('Agent failed', error);
  } else {
    throw error;
  }
}
```

### Comments

```typescript
// ✅ Document why, not what
// Retry agent execution on timeout because some operations
// are slow on first run due to caching mechanisms
const retryOnTimeout = true;

// ❌ Don't comment obvious code
const count = 5; // Set count to 5

// ✅ JSDoc for public APIs
/**
 * Execute an agent with retry logic
 * @param agentName - Name of agent to execute
 * @param options - Execution options
 * @returns Promise resolving to agent output
 * @throws {AgentError} If agent execution fails after retries
 */
export const executeAgent = async (
  agentName: string,
  options?: ExecuteOptions
): Promise<AgentOutput> => {
  // implementation
};
```

### Naming Conventions

```typescript
// ✅ PascalCase for classes and interfaces
class AgentOrchestrator {}
interface AgentConfig {}

// ✅ camelCase for variables and functions
const maxRetries = 3;
const calculateScore = () => {};

// ✅ UPPER_CASE for constants
const MAX_TIMEOUT = 30000;
const DEFAULT_AGENT_TIER = 'implementation';

// ✅ Use descriptive names
const isReadyForDeployment = true;  // ✅
const ready = true;                 // ❌

// ✅ Prefix booleans with 'is', 'has', 'should', 'can'
const isVisible = true;
const hasPermission = false;
const shouldRetry = true;
const canExecute = true;
```

### Organization

```typescript
// ✅ Organize in this order
// 1. Types/interfaces
// 2. Constants
// 3. Helper functions
// 4. Main exported functions/classes
// 5. Error handling

interface Config {
  timeout: number;
}

const DEFAULT_TIMEOUT = 5000;

const validateConfig = (config: Config): void => {
  // ...
};

export const execute = async (config: Config): Promise<void> => {
  // ...
};

class AgentError extends Error {}
```

### Markdown

**Use GitHub Flavored Markdown (GFM)**:

```markdown
# Heading 1 (Main title)

## Heading 2 (Section)

### Heading 3 (Subsection)

**Bold** for emphasis
`code` for inline code
\`\`\`typescript ... \`\`\` for code blocks

- Bullet points
- Like this
  - Nested
  - Works too

1. Numbered lists
2. Like this
3. Work well

[Links](https://example.com)
![Images](./image.png)

> Blockquotes
> Work too

| Table | Header |
|-------|--------|
| Data  | Here   |

✅ Use emojis sparingly
❌ Not for code quality

\`\`\`typescript
// Code example
const config = { timeout: 5000 };
\`\`\`
```

---

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- agents/code-architect.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode (rerun on file change)
npm test -- --watch
```

### Write Tests

**Test Structure**:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CodeArchitect } from '@/agents/code-architect';

describe('CodeArchitect Agent', () => {
  let agent: CodeArchitect;

  beforeEach(() => {
    agent = new CodeArchitect({
      timeout: 5000,
      retries: 2,
    });
  });

  it('should generate code architecture', async () => {
    const spec = {
      projectName: 'test-project',
      frontend: 'React',
      backend: 'Node.js',
    };

    const result = await agent.execute(spec);

    expect(result).toBeDefined();
    expect(result.architecture).toBeTruthy();
    expect(result.components.length).toBeGreaterThan(0);
  });

  it('should fail with invalid input', async () => {
    const invalidSpec = {};

    await expect(agent.execute(invalidSpec)).rejects.toThrow('Invalid spec');
  });

  it('should handle timeout', async () => {
    const slowSpec = {
      projectName: 'slow-project',
      frontend: 'React',
      backend: 'Node.js',
      timeout: 100, // Very short timeout
    };

    await expect(agent.execute(slowSpec)).rejects.toThrow('Timeout');
  });
});
```

**Test Guidelines**:

- [ ] Test both happy path and edge cases
- [ ] Use descriptive test names
- [ ] Aim for 80%+ code coverage
- [ ] Mock external dependencies
- [ ] Test error handling
- [ ] Test async code properly

### Coverage Requirements

```bash
# View coverage report
npm test -- --coverage

# Required minimums:
# - Lines: 80%
# - Functions: 80%
# - Branches: 75%
# - Statements: 80%
```

---

## Building and Bundling

### Development

```bash
# Start dev server with hot reload
npm run dev

# Build for development
npm run build:dev

# Watch for changes
npm run watch
```

### Production

```bash
# Build for production
npm run build

# Build for deployment (optimized)
npm run build:prod

# Check bundle size
npm run analyze
```

### Output

Built files in `/dist/` directory:
- TypeScript compiled to JavaScript
- Minified and optimized
- Source maps included
- Tree-shaking applied

---

## Debugging

### Node.js Debugging

**VS Code**:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Agent",
      "program": "${workspaceFolder}/src/agents/code-architect.ts",
      "console": "integratedTerminal"
    }
  ]
}
```

**Command Line**:

```bash
# Debug with Node inspector
node --inspect-brk src/agents/code-architect.ts

# Visit chrome://inspect in Chrome to debug
```

### Logging

```typescript
import { Logger } from '@/utils';

const logger = new Logger('CodeArchitect');

logger.debug('Starting code generation');    // Debug info
logger.info('Architecture created');         // Information
logger.warn('Using default config');         // Warning
logger.error('Failed to generate code', error); // Error
```

### Common Issues

**Issue**: Tests fail with "module not found"
```bash
# Rebuild
npm install
npm run build
```

**Issue**: TypeScript errors not showing
```bash
# Run type check
npm run type-check
```

**Issue**: Code format issues
```bash
# Auto-fix format
npm run lint:fix
```

---

## Contributing Code

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution workflow.

**Quick checklist before submitting PR**:

```bash
# 1. Update code
# ... make changes ...

# 2. Test locally
npm test

# 3. Check types
npm run type-check

# 4. Lint and fix
npm run lint
npm run lint:fix

# 5. Build
npm run build

# 6. Commit (with conventional commits)
git add .
git commit -m "feat: add new agent capability"

# 7. Push
git push origin feature/your-feature

# 8. Create PR on GitHub
```

---

## Common Development Tasks

### Create a New Agent

See [Agent Development Guide](guides/AGENT_DEVELOPMENT.md)

Steps:
1. Create agent definition in `/.github/agents/`
2. Create agent implementation in `/src/agents/`
3. Create tests in `/tests/agents/`
4. Update agent registry
5. Write documentation

### Create a New Skill

See [Skill Development Guide](guides/SKILL_DEVELOPMENT.md)

Steps:
1. Create skill definition in `/.github/skills/`
2. Create skill implementation in `/src/skills/`
3. Create tests in `/tests/skills/`
4. Link to agents that use it
5. Write documentation

### Add a New Technology

Example: Add support for Astro framework

```bash
# 1. Check if similar agent exists (e.g., @vue-specialist)
# 2. Copy as template
# 3. Rename and update configuration
# 4. Update activation logic
# 5. Define new skills needed
# 6. Create tests
# 7. Update documentation
# 8. Submit PR
```

### Run a Scenario Locally

```bash
# 1. Choose scenario (S01-S08 in examples)
# 2. Follow example instructions
# 3. Run @plan with scenario parameters
# 4. Monitor agent execution
# 5. Check generated output
# 6. Validate against expected results
```

---

## Performance

### Optimization Guidelines

```typescript
// ✅ Cache expensive operations
const memoizedParse = memoize(parseCode);

// ✅ Use appropriate data structures
const configMap = new Map(); // Better than object for repeated lookups

// ✅ Batch operations
const results = await Promise.all(agents.map(a => a.execute()));

// ✅ Lazy load
const skills = lazy(() => import('@/skills'));

// ❌ Don't repeatedly parse same code
for (const file of files) {
  parseCode(content); // Bad if same content
  const parsed = memoize(() => parseCode(content)); // Good
}
```

### Benchmarking

```bash
# Profile agent execution
npm run benchmark

# Memory usage
npm run profile:memory

# CPU usage
npm run profile:cpu
```

---

## Security

### Guidelines

```typescript
// ✅ Validate inputs
if (!isValidInput(userInput)) {
  throw new ValidationError('Invalid input');
}

// ✅ Use parameterized queries
const result = db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ✅ Sanitize outputs
const safe = sanitizeOutput(untrustedData);

// ✅ Never log secrets
logger.info('Config loaded'); // Good
logger.info('Token:', token); // Bad

// ✅ Use environment variables
const apiKey = process.env.API_KEY;

// ✅ Validate dependencies
npm audit
npm audit fix
```

---

## Documentation for Developers

**Internal code documentation**:
- JSDoc comments for public APIs
- Inline comments for complex logic (why, not what)
- README.md in each package

**For contributions**:
- Update README.md if adding features
- Add examples if adding public API
- Document breaking changes
- Update CHANGELOG.md

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [Google Style Guide](https://google.github.io/styleguide/docguide/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Getting Help

- **Questions**: [Discussions](https://github.com/your-org/agenticcoder/discussions)
- **Issues**: [GitHub Issues](https://github.com/your-org/agenticcoder/issues)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
