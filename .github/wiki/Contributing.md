# Contributing

Thank you for your interest in contributing to AgenticCoder! This guide explains how to contribute effectively.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Types of Contributions](#types-of-contributions)
3. [Getting Started](#getting-started)
4. [Development Workflow](#development-workflow)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
7. [Recognition](#recognition)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- ✅ Be respectful and considerate
- ✅ Use welcoming and inclusive language
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what's best for the community
- ❌ No harassment, trolling, or personal attacks
- ❌ No publishing others' private information

---

## Types of Contributions

### 🐛 Bug Reports

Found a bug? Help us fix it!

1. **Search existing issues** - Maybe it's already reported
2. **Create new issue** with:
   - Clear title: `[BUG] Brief description`
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Node version)
   - Screenshots/logs if applicable

**Example:**
```markdown
[BUG] WorkflowEngine timeout not respected

**Steps to reproduce:**
1. Create workflow with timeout: 1000
2. Add slow step (takes 5000ms)
3. Execute workflow

**Expected:** Workflow should timeout after 1000ms
**Actual:** Workflow completes after 5000ms

**System:** Windows 11, Node 20.10, npm 10.2
```

### 💡 Feature Requests

Have an idea? Share it!

1. **Search discussions** - Similar idea might exist
2. **Create discussion** in Ideas category with:
   - What you want to build
   - Why it's needed
   - Use cases
   - Proposed approach (optional)

### 💻 Code Contributions

Ready to code? Great!

**Good for beginners:**
- Issues labeled `good first issue`
- Documentation improvements
- Test coverage increases
- Bug fixes

**For experienced contributors:**
- New agents
- New skills
- Performance improvements
- Architecture changes

### 📚 Documentation

Help improve docs:
- Fix typos
- Clarify explanations
- Add examples
- Create tutorials

---

## Getting Started

### Step 1: Fork & Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR-USERNAME/AgenticCoder.git
cd AgenticCoder

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL-ORG/AgenticCoder.git
```

### Step 2: Setup Development Environment

```bash
# Install dependencies
cd agents && npm install

# Verify setup
npm test
```

See [Developer Guide](Developer-Guide) for detailed setup.

### Step 3: Create Feature Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create branch
git checkout -b feature/your-feature-name
```

**Branch naming:**
- `feature/description` - New feature
- `fix/description` - Bug fix
- `docs/description` - Documentation
- `refactor/description` - Code improvement
- `test/description` - Test additions

---

## Development Workflow

### 1. Make Changes

```bash
# Make your changes
# Follow coding standards (see below)
```

### 2. Test Your Changes

```bash
cd agents

# Run all tests
npm test

# Run specific tests
npm test -- --grep "YourFeature"

# Check linting
npm run lint
```

### 3. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description

git commit -m "feat(agents): add Vue specialist agent"
git commit -m "fix(workflow): resolve timeout handling"
git commit -m "docs(readme): update installation steps"
git commit -m "test(self-learning): add pattern detection tests"
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code improvement
- `chore` - Maintenance

### 4. Push Changes

```bash
git push origin feature/your-feature-name
```

---

## Pull Request Process

### Creating a PR

1. **Go to GitHub** - Your fork
2. **Click "Compare & pull request"**
3. **Fill out PR template:**

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Existing tests still pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### PR Review Process

1. **Automated checks** run (tests, linting)
2. **Maintainer review** within 3-5 days
3. **Address feedback** if requested
4. **Merge** when approved

### After Merge

```bash
# Update your main
git checkout main
git pull upstream main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## Coding Standards

### JavaScript/Node.js

```javascript
// ✅ Good
import { EventEmitter } from 'events';

const processTask = async (task) => {
  const result = await executeTask(task);
  return result;
};

// ❌ Bad
var EventEmitter = require('events');

function processTask(task, callback) {
  executeTask(task, function(err, result) {
    callback(err, result);
  });
}
```

### Documentation

```javascript
/**
 * Executes a workflow step.
 * 
 * @param {Object} step - Step configuration
 * @param {string} step.agent - Agent name
 * @returns {Promise<Result>} Execution result
 * @throws {Error} If agent not found
 * 
 * @example
 * const result = await executeStep({ agent: 'task-extraction' });
 */
async function executeStep(step) {
  // Implementation
}
```

### Testing

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('FeatureName', () => {
  it('should do expected behavior', async () => {
    const result = await feature.execute(input);
    assert.strictEqual(result.status, 'success');
  });
  
  it('should handle edge case', async () => {
    await assert.rejects(
      feature.execute(invalidInput),
      { name: 'ValidationError' }
    );
  });
});
```

### Commits

- Keep commits atomic (one logical change per commit)
- Write clear commit messages
- Reference issues when applicable: `fix(api): resolve timeout #123`

---

## Recognition

### Contributors

All contributors are recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

### Significant Contributions

For significant contributions:
- Credited in CHANGELOG.md
- Mentioned in release announcements
- Added to maintainers list (for ongoing contributors)

---

## ❓ Questions?

- **General questions**: [Discussions](https://github.com/YOUR-ORG/AgenticCoder/discussions)
- **Bug reports**: [Issues](https://github.com/YOUR-ORG/AgenticCoder/issues)
- **Security issues**: Email security@your-org.com (do not create public issue)

---

<p align="center">
  Thank you for contributing to AgenticCoder! 🎉
</p>

---

<p align="center">
  <a href="API-Reference">← API Reference</a> | <a href="Home">Home →</a>
</p>
