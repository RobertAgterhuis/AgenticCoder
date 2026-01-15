# Frequently Asked Questions (FAQ)

**Version**: 2.0  
**Updated**: January 13, 2026

---

## Table of Contents

- [Getting Started](#getting-started)
- [General Questions](#general-questions)
- [Technical Questions](#technical-questions)
- [Customization & Integration](#customization--integration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Getting Started

### Q: What is AgenticCoder?

**A**: AgenticCoder is an intelligent multi-agent code generation system. It uses 26 specialized AI agents working together to generate complete, production-ready applications from your specifications. Instead of building code manually, you describe what you want and AgenticCoder builds it with best practices, architecture, tests, and deployment configuration.

### Q: What can AgenticCoder build?

**A**: AgenticCoder can generate full-stack applications with:

- **Frontend**: React, Vue, Angular, or Svelte
- **Backend**: Node.js, Python, Go, or Java
- **Database**: MySQL, MongoDB, or PostgreSQL
- **APIs**: REST or GraphQL
- **Deployment**: Docker, CI/CD pipelines, cloud infrastructure
- **Tests**: Unit, integration, and end-to-end tests
- **Documentation**: Architecture, API, and deployment guides

### Q: How long does it take to generate a project?

**A**: Execution time depends on project complexity:

- **Simple project** (5-10 features): 2-3 minutes
- **Medium project** (15-25 features): 5-10 minutes
- **Complex project** (30+ features): 15-30 minutes

Note: Actual implementation time would take days/weeks for a developer.

### Q: Do I need to be a programmer to use AgenticCoder?

**A**: No! You don't need to code. You just need to describe your project clearly:
- What problem does it solve?
- Who are the users?
- What are the main features?
- What technologies do you prefer?

AgenticCoder handles all the coding.

### Q: What technologies does AgenticCoder use?

**A**: AgenticCoder is built with:
- TypeScript for type safety
- Node.js for runtime
- Jest for testing
- ESLint for code quality
- GitHub Actions for CI/CD

Generated code uses the technologies you choose (React, Python, etc.).

---

## General Questions

### Q: Can I run AgenticCoder locally?

**A**: Yes! You can:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/agenticcoder.git
   ```

2. **Install dependencies**:
   ```bash
   cd agenticcoder
   npm install
   ```

3. **Run a project**:
   ```bash
   npm start
   @plan
   ```

See [Getting Started](GETTING_STARTED.md) for detailed setup.

### Q: Can I use AgenticCoder for production applications?

**A**: Yes! AgenticCoder generates production-ready code with:
- Best practices applied
- Security hardening
- Performance optimization
- Comprehensive tests
- Infrastructure-as-code for deployment

However, review the generated code and tests before deploying to production.

### Q: What's the cost of using AgenticCoder?

**A**: AgenticCoder is open-source and free! You can:
- Use it locally without paying
- Generate unlimited projects
- Modify the code freely
- Share and redistribute

Optional commercial support and cloud hosting available.

### Q: Can I customize the generated code?

**A**: Absolutely! Generated code is yours to modify. You can:
- Edit source files
- Add custom features
- Change styling
- Integrate third-party libraries
- Deploy anywhere you want

It's your project - do what you need!

### Q: What if I don't like the generated code?

**A**: You can:

1. **Specify preferences**: Tell AgenticCoder what you prefer
   ```
   @plan
   Please use TypeScript strict mode
   Use ESLint with Prettier
   Add comprehensive error handling
   ```

2. **Regenerate**: Run again with different specifications

3. **Modify**: Edit generated code directly

4. **Combine**: Take the generated code and modify as needed

### Q: How does AgenticCoder handle errors?

**A**: AgenticCoder has multiple safety layers:

1. **Validation**: Input validation at each phase
2. **Quality gates**: Checks between phases ensure quality
3. **Error recovery**: Automatic retry with exponential backoff
4. **Fallbacks**: Uses generic implementations if specialists fail
5. **Comprehensive testing**: Generated code includes tests

If something fails, you get detailed error messages to fix it.

---

## Technical Questions

### Q: What is a "Phase" in AgenticCoder?

**A**: AgenticCoder works in 16 sequential phases:

1. **Phases 1-5**: Analyze requirements and plan
2. **Phases 6-12**: Design architecture
3. **Phases 13-14**: Generate code (all frameworks in parallel)
4. **Phases 15-16**: Package and test

Each phase builds on the previous, ensuring quality at every step.

### Q: What is an "Agent"?

**A**: An agent is a specialized AI assistant responsible for one part of code generation. Examples:

- `@plan` - Orchestrates the entire process
- `@react-specialist` - Generates React code
- `@nodejs-specialist` - Generates Node.js backend
- `@docker-specialist` - Creates Docker configuration

26 agents work together like a development team.

### Q: What is a "Skill"?

**A**: A skill is a reusable capability that agents use. Examples:

- `react-best-practices` - React patterns and standards
- `nodejs-best-practices` - Node.js patterns and standards
- `security-best-practices` - Security guidelines
- `testing-framework` - Test setup and patterns

33 skills ensure best practices are followed.

### Q: How do agents communicate?

**A**: Agents use structured handoffs:

1. **Agent A** completes its work and generates an artifact
2. **Agent A** explicitly hands off to **Agent B** with artifacts
3. **Agent B** receives input and continues work
4. Process repeats until all agents complete

This ensures clear dependencies and no missed steps.

### Q: What happens if an agent fails?

**A**: AgenticCoder has automatic recovery:

1. **Retry logic**: Automatically retries with exponential backoff
2. **Fallbacks**: Uses generic implementation if specialist fails
3. **Error details**: Provides detailed error information
4. **Manual override**: You can manually intervene if needed

### Q: Can I use AgenticCoder with an existing project?

**A**: Currently, AgenticCoder is designed for new projects. However, you can:

1. Generate a new project with AgenticCoder
2. Integrate pieces into your existing project
3. Use generated code as reference/template
4. Adopt AgenticCoder architecture gradually

Coming soon: Support for augmenting existing projects.

### Q: What happens to my data?

**A**: Your data is safe:

- **Local execution**: Runs on your machine, no cloud upload
- **Open source**: You can see and audit all code
- **No tracking**: No usage tracking or analytics
- **Your project**: You own all generated code

---

## Customization & Integration

### Q: Can I add my own agent?

**A**: Yes! See [Agent Development Guide](guides/AGENT_DEVELOPMENT.md).

Steps:
1. Create agent definition
2. Implement agent logic
3. Register with system
4. Write tests and documentation
5. Contribute back (optional)

### Q: Can I add my own skill?

**A**: Yes! See [Skill Development Guide](guides/SKILL_DEVELOPMENT.md).

Steps:
1. Create skill definition
2. Implement skill
3. Link to agents that need it
4. Write tests
5. Document usage

### Q: Can I add support for a new framework?

**A**: Yes! For example, to add NestJS support:

1. Create `@nestjs-specialist` agent
2. Define `nestjs-best-practices` skill
3. Implement agent with skill
4. Set activation condition: `backend === 'NestJS'`
5. Add to agent registry

See [Contributing Guide](CONTRIBUTING.md) for details.

### Q: Can I integrate with existing tools?

**A**: The generated code works with any tools:

- **Version control**: Git, GitHub, GitLab
- **Package managers**: npm, pip, cargo
- **CI/CD**: GitHub Actions, Jenkins, GitLab CI
- **Deployment**: Docker, Kubernetes, Heroku, AWS, Azure
- **Monitoring**: Datadog, New Relic, CloudWatch
- **Databases**: Any SQL or NoSQL database

---

## Deployment

### Q: How do I deploy generated projects?

**A**: AgenticCoder generates deployment configuration:

1. **Docker**: Containerized for any environment
2. **CI/CD**: GitHub Actions workflows included
3. **Infrastructure**: Cloud setup instructions (AWS, Azure, GCP)
4. **Guides**: Detailed deployment guides in documentation

See generated `DEPLOYMENT.md` or [User Guide](USER_GUIDE.md#deployment).

### Q: Which cloud platforms are supported?

**A**: AgenticCoder generates configuration for:

- **AWS**: EC2, ECS, Lambda, RDS, CloudFront
- **Azure**: App Service, Container Instances, SQL Database
- **GCP**: Cloud Run, Cloud SQL, Firestore
- **Kubernetes**: Docker + Kubernetes manifests
- **Self-hosted**: Docker + docker-compose

### Q: Can I deploy to my own servers?

**A**: Yes! Generated code:

1. Includes Docker configuration
2. Uses standard deployment patterns
3. Works with any deployment system
4. Includes docker-compose for local development

You can deploy to any server that supports:
- Docker, or
- Direct node/python/go/java deployment

### Q: Does AgenticCoder handle database migrations?

**A**: Yes! Generated projects include:

- Initial schema creation scripts
- Migration system setup
- Seed data scripts
- Rollback procedures
- Database documentation

### Q: How do I set up environment variables?

**A**: Generated projects include:

- `.env.example` file with all required variables
- Documentation for each variable
- Default values where applicable
- Setup instructions

Copy `.env.example` to `.env` and fill in your values.

---

## Troubleshooting

### Q: The generated code doesn't compile. What do I do?

**A**: First, ensure you have the right dependencies:

```bash
# Install dependencies
npm install

# For other languages
pip install -r requirements.txt  # Python
go mod download                   # Go
gradle dependencies               # Java
```

If still failing:

1. Check [User Guide](USER_GUIDE.md#troubleshooting)
2. Check generated `TROUBLESHOOTING.md`
3. Check GitHub Issues for similar problems
4. Open a new issue with error details

### Q: Tests are failing. What do I do?

**A**: 
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test
npm test -- specific-test.test.ts

# Check test coverage
npm test -- --coverage
```

If tests fail:

1. Check test output for error messages
2. See if generated code has known issues
3. Check if your environment setup is correct
4. See [Troubleshooting section](USER_GUIDE.md#troubleshooting)

### Q: My project won't build. What do I do?

**A**: 
```bash
# Check what's wrong
npm run build -- --verbose

# Sometimes clear cache helps
rm -rf node_modules
npm install
npm run build
```

Common issues:

- **Missing dependencies**: Run `npm install`
- **Wrong Node version**: Check `package.json` for `engines.node`
- **Type errors**: Run `npm run type-check` to see details
- **Linting errors**: Run `npm run lint` to see what failed

### Q: How do I debug generated code?

**A**: See [Developer Guide](DEVELOPER_GUIDE.md#debugging).

**Quick steps**:

1. **Add console.log**:
   ```javascript
   console.log('Debug info:', variable);
   ```

2. **Run with debugger**:
   ```bash
   node --inspect-brk src/index.js
   # Then visit chrome://inspect
   ```

3. **VS Code debugging**:
   - Press `F5` or click Debug
   - Set breakpoints and step through

### Q: The agent execution is slow. How can I speed it up?

**A**: AgenticCoder execution depends on:
- Project complexity
- System resources (CPU, memory)
- Network speed (if using cloud)

**To speed up**:
- Use faster machine for execution
- Reduce project complexity
- Disable optional features
- Run specific phases instead of all

### Q: Can I see what each agent is doing?

**A**: Yes! Check logs:

```bash
# Show execution logs
npm start -- --verbose

# Save logs to file
npm start > execution.log 2>&1

# Follow logs in real-time
npm start -- --watch
```

Generated projects also include detailed logs in `/logs/` directory.

---

## Contributing

### Q: How do I contribute to AgenticCoder?

**A**: See [Contributing Guide](CONTRIBUTING.md).

Quick steps:
1. Fork repository
2. Create feature branch
3. Make changes
4. Write tests
5. Submit pull request

We welcome contributions! Issues labeled "good first issue" are great starting points.

### Q: Can I report bugs?

**A**: Yes! Please report via [GitHub Issues](https://github.com/your-org/agenticcoder/issues):

Include:
- Steps to reproduce
- Expected vs actual behavior
- System information (OS, Node version, etc.)
- Error messages and logs

### Q: Can I suggest features?

**A**: Absolutely! Open a [Discussion](https://github.com/your-org/agenticcoder/discussions):

Describe:
- What you want to build
- Why it's needed
- How it would be used
- Any implementation ideas

Great feature ideas get implemented!

### Q: I found a security issue. What should I do?

**A**: **Don't create a public issue!**

Instead, email [security@example.com](mailto:security@example.com) with:
- Description of vulnerability
- How to reproduce
- Potential impact
- Your contact info

We'll respond within 24 hours and work with you to fix it.

### Q: Can I see the project roadmap?

**A**: Yes! See [ROADMAP.md](ROADMAP.md) for:
- Planned features
- Estimated timelines
- Current priorities
- Community requests

You can also see progress in [GitHub Projects](https://github.com/your-org/agenticcoder/projects).

---

## Getting Help

**Still have questions?**

- 📖 Check [Documentation](README.md)
- 💬 Open a [Discussion](https://github.com/your-org/agenticcoder/discussions)
- 🐛 Report [Issues](https://github.com/your-org/agenticcoder/issues)
- 📧 Email [help@example.com](mailto:help@example.com)

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
