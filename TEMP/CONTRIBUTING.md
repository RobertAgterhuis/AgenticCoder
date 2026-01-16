# Contributing Guide

**Version**: 2.0  
**Updated**: January 13, 2026

---

## Welcome Contributors!

Thank you for your interest in contributing to AgenticCoder. This guide explains how to contribute code, documentation, and ideas.

---

## Code of Conduct

Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We expect all contributors to follow it.

---

## Types of Contributions

### 1. Bug Reports 🐛

Found a bug? Report it!

**How to report**:
1. Check if the bug is already reported in [Issues](https://github.com/your-org/agenticcoder/issues)
2. Open a new issue with:
   - Title: `[BUG] Brief description`
   - Description: Detailed problem description
   - Steps to reproduce
   - Expected vs actual behavior
   - System info (OS, Node version, etc.)
   - Screenshots/logs if applicable

**Example**:
```
[BUG] @react-specialist fails with "module not found"

When running S06 scenario with Vue + Python + MySQL, the @react-specialist 
agent fails with error: "Error: Cannot find module 'react'"

Steps to reproduce:
1. Run @plan with "Vue + Python + MySQL"
2. When @react-specialist activates
3. Check logs

Expected: @react-specialist should not activate for Vue projects
Actual: @react-specialist activates and fails

System: Windows 11, Node 18.12.1, npm 8.19.2
```

### 2. Feature Requests 💡

Have an idea? Suggest it!

**How to suggest**:
1. Check [Issues](https://github.com/your-org/agenticcoder/issues) and [Discussions](https://github.com/your-org/agenticcoder/discussions)
2. Open a Discussion with:
   - Title: What you want to build
   - Description: Why it's needed
   - Use cases
   - Proposed solution (optional)

**Example**:
```
New Feature: Support for NestJS backend framework

Why: Many users want NestJS for its enterprise features and strong typing
Use cases:
  - Large teams building backend APIs
  - Projects needing enterprise architecture

Proposed solution:
  - Create @nestjs-specialist agent
  - Use nestjs-best-practices skill
  - Activate when backend_framework == "NestJS"
```

### 3. Code Contributions 💻

Want to contribute code? Great!

**Types of code contributions**:
- **New Agent**: Add support for new technology/framework
- **New Skill**: Add new capability for existing agents
- **Bug Fix**: Fix reported bugs
- **Improvement**: Optimize existing agents/skills
- **Refactoring**: Improve code quality

### 4. Documentation Contributions 📚

Help improve documentation!

**Types of doc contributions**:
- Clarifications
- Examples
- Tutorials
- Translations
- Fixing typos

---

## Getting Started

### Step 1: Set Up Development Environment

See [Developer Guide](DEVELOPER_GUIDE.md) for detailed setup instructions.

**Quick start**:
```bash
# Clone repository
git clone https://github.com/your-org/agenticcoder.git
cd agenticcoder

# Create feature branch
git checkout -b feature/your-feature-name

# Follow development guide for language-specific setup
```

### Step 2: Choose What to Contribute

Pick from:
- [Good First Issues](https://github.com/your-org/agenticcoder/issues?label=good%20first%20issue) - Great for first-time contributors
- [Help Wanted](https://github.com/your-org/agenticcoder/issues?label=help%20wanted) - Areas we need help
- [Discussions](https://github.com/your-org/agenticcoder/discussions) - Open discussions
- [Roadmap](ROADMAP.md) - Planned features

### Step 3: Understand the Architecture

Read:
- [Architecture Overview](ARCHITECTURE.md)
- [Agent Development Guide](guides/AGENT_DEVELOPMENT.md) (if creating agent)
- [Skill Development Guide](guides/SKILL_DEVELOPMENT.md) (if creating skill)

### Step 4: Make Your Changes

Follow the [Development Guide](DEVELOPER_GUIDE.md):
- Code style guidelines
- Testing requirements
- Documentation standards
- Commit message format

### Step 5: Submit Pull Request

See [Pull Request Process](#pull-request-process) below.

---

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/agenticcoder.git
cd agenticcoder

# Add upstream remote
git remote add upstream https://github.com/your-org/agenticcoder.git
```

### 2. Create Feature Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Branch naming convention:
# feature/description - New feature
# fix/description - Bug fix
# docs/description - Documentation
# refactor/description - Code improvement
```

### 3. Make Changes

```bash
# Make your code changes
# Follow code style guidelines (see Developer Guide)

# Test your changes
npm test                # Run tests
npm run lint            # Check code style
npm run type-check      # Check TypeScript
npm run build           # Build project
```

### 4. Commit Changes

```bash
# Commit with conventional commits
git add .
git commit -m "feat: add support for new framework"
git commit -m "fix: resolve issue with agent handoff"
git commit -m "docs: update setup instructions"
git commit -m "test: add tests for new feature"

# Conventional commit format:
# <type>(<scope>): <subject>
# feat: new feature
# fix: bug fix
# docs: documentation
# style: code formatting
# refactor: code improvement
# test: tests
# chore: build/dependency updates
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Fill in PR template
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows [style guidelines](DEVELOPER_GUIDE.md#code-style)
- [ ] All tests pass: `npm test`
- [ ] Code is linted: `npm run lint`
- [ ] Types checked: `npm run type-check`
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts

### PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #123 (if fixing an issue)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Checklist
- [ ] Tests pass
- [ ] Code is linted
- [ ] Documentation updated
- [ ] No breaking changes (unless intended)

## Screenshots (if applicable)
```

### Review Process

1. **Automated checks**:
   - Tests must pass
   - Linting must pass
   - Code coverage minimum met

2. **Manual review** (1-2 business days):
   - Code quality
   - Architecture fit
   - Documentation quality
   - Test coverage

3. **Approval and merge**:
   - Approved by at least 1 maintainer
   - All conversations resolved
   - Ready to merge

### After Merge

- Your code is deployed to production automatically (or scheduled)
- Your contribution is credited
- You're invited to add yourself to [CONTRIBUTORS.md](../CONTRIBUTORS.md)

---

## Contribution Guidelines

### Code Quality

**Style Guide**: Follow [Developer Guide](DEVELOPER_GUIDE.md#code-style)

**Testing**:
- Write tests for new code
- Minimum 80% code coverage
- Tests should be descriptive
- Test both happy path and edge cases

**Documentation**:
- Add JSDoc comments for public APIs
- Update README if needed
- Add examples if applicable
- Document breaking changes

### Agent Development

See [Agent Development Guide](guides/AGENT_DEVELOPMENT.md)

Requirements:
- [ ] Agent specification document
- [ ] Input/output schemas
- [ ] Activation logic
- [ ] Handoff targets
- [ ] Skills used
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation

### Skill Development

See [Skill Development Guide](guides/SKILL_DEVELOPMENT.md)

Requirements:
- [ ] Skill specification
- [ ] Implementation
- [ ] Usage examples
- [ ] Unit tests
- [ ] Documentation

### Documentation

**Style**: Follow [Google Documentation Style Guide](https://google.github.io/styleguide/docguide/)

**Format**: GitHub Flavored Markdown

**Requirements**:
- [ ] Clear and concise
- [ ] Examples provided
- [ ] Links to related docs
- [ ] No typos
- [ ] Tested instructions

---

## License

By contributing, you agree that your contributions are licensed under the [MIT License](../LICENSE).

---

## Contact

- **Issues**: [GitHub Issues](https://github.com/your-org/agenticcoder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/agenticcoder/discussions)
- **Email**: [maintainers@example.com](mailto:maintainers@example.com)

---

## Recognition

Contributors will be recognized in:
- [CONTRIBUTORS.md](../CONTRIBUTORS.md) file
- GitHub contributors list
- Release notes for their contribution
- Project website

---

## Questions?

- Check [Developer Guide](DEVELOPER_GUIDE.md)
- Check [FAQ](FAQ.md)
- Open a Discussion
- Email maintainers

---

**Thank you for contributing!** 🎉

Your contributions make AgenticCoder better for everyone.

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
