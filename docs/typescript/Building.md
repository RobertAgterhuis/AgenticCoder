# Building from Source

Guide to building AgenticCoder from source code.

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| npm | 10.x | Package manager |
| Git | 2.x | Version control |
| VS Code | Latest | Development |

### Optional Software

| Software | Version | Purpose |
|----------|---------|---------|
| Bicep CLI | Latest | Bicep validation |
| Azure CLI | Latest | Azure testing |
| Docker | Latest | Container testing |

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/your-org/agentic-coder.git
cd agentic-coder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
code .env
```

**Environment Variables:**

```env
# Development
NODE_ENV=development
LOG_LEVEL=debug

# GitHub Copilot (for testing)
GITHUB_TOKEN=your_token

# Azure (optional, for Azure features)
AZURE_SUBSCRIPTION_ID=your_subscription
```

### 4. Build Project

```bash
npm run build
```

## Project Structure

```
agentic-coder/
├── src/                     # Source code
│   ├── core/               # Core modules
│   ├── agents/             # Agent implementations
│   ├── skills/             # Skill implementations
│   ├── validation/         # Validation framework
│   ├── learning/           # Self-learning system
│   ├── utils/              # Utilities
│   └── cli/                # CLI commands
│
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
│
├── dist/                    # Build output
│
├── bin/                     # CLI entry points
│   └── agentic.js          # Main CLI
│
├── .github/                 # GitHub config
│   ├── agents/             # Agent definitions
│   ├── skills/             # Skill definitions
│   ├── scenarios/          # Scenario configs
│   └── workflows/          # CI/CD workflows
│
└── docs/                    # Documentation
```

## Build Commands

### Development Build

```bash
# Build with source maps
npm run build:dev

# Watch mode (auto-rebuild)
npm run build:watch
```

### Production Build

```bash
# Optimized build
npm run build:prod

# Build with type checking
npm run build:check
```

### Clean Build

```bash
# Remove build artifacts
npm run clean

# Full clean and rebuild
npm run rebuild
```

## Development Workflow

### Running in Development

```bash
# Run CLI in dev mode
npm run dev -- start --scenario S01

# Run specific command
npm run dev -- validate src/

# With debug logging
DEBUG=agentic:* npm run dev -- start
```

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific test file
npm test -- tests/unit/agents/plan-agent.test.ts
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Type Checking

```bash
# Check types
npm run typecheck

# Watch mode
npm run typecheck:watch
```

## Build Configuration

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### ESLint Configuration

```json
// .eslintrc.json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100
}
```

## Build Output

### Directory Structure

```
dist/
├── core/
│   ├── workflow-engine.js
│   ├── workflow-engine.d.ts
│   ├── workflow-engine.js.map
│   └── ...
├── agents/
├── validation/
├── learning/
├── utils/
└── cli/
    └── index.js
```

### Package Exports

```json
// package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./core": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.js"
    },
    "./validation": {
      "types": "./dist/validation/index.d.ts",
      "import": "./dist/validation/index.js"
    }
  }
}
```

## Debugging

### VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CLI",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["tsx", "src/cli/index.ts"],
      "args": ["start", "--scenario", "S01"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose", "${file}"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Debug Logging

```typescript
// Enable debug logging
import debug from 'debug';

const log = debug('agentic:workflow');
log('Starting workflow %s', workflowId);
```

```bash
# Enable specific debug namespace
DEBUG=agentic:workflow npm run dev

# Enable all debug logging
DEBUG=agentic:* npm run dev
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Module not found | Run `npm install` |
| Type errors | Run `npm run typecheck` |
| Build fails | Run `npm run clean && npm run build` |
| Tests fail | Check Node.js version (20.x required) |

### Clearing Caches

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules

# Remove build output
rm -rf dist

# Fresh install
npm install
```

### Verifying Installation

```bash
# Check Node.js version
node --version  # Should be 20.x

# Check npm version
npm --version  # Should be 10.x

# Verify build
npm run build && npm test
```

## Contributing

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new validation rule
fix: correct message bus timeout
docs: update API reference
refactor: simplify agent lifecycle
test: add workflow integration tests
```

### Pull Request Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Types check (`npm run typecheck`)
- [ ] Documentation updated
- [ ] Changelog updated

## Next Steps

- [Testing Guide](Testing) - Running tests
- [TypeScript Overview](Overview) - Code structure
- [Contributing](../guides/Contributing) - Contribution guide
