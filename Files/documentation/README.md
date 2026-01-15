# AgenticCoder Documentation

Welcome to AgenticCoder's comprehensive documentation. This folder contains everything you need to understand, use, and contribute to AgenticCoder.

---

## 📚 Documentation Structure

### For End Users
- **[Getting Started](GETTING_STARTED.md)** - Quick start guide, installation, first project
- **[User Guide](USER_GUIDE.md)** - Complete guide for running projects with AgenticCoder
- **[Examples](examples/)** - Real-world scenario walkthroughs (S01-S08)
- **[FAQ](FAQ.md)** - Frequently asked questions and troubleshooting

### For Developers
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Setup development environment
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute code, agents, and skills
- **[Architecture Overview](ARCHITECTURE.md)** - Technical architecture and design decisions
- **[Agent Development](guides/AGENT_DEVELOPMENT.md)** - How to create new agents
- **[Skill Development](guides/SKILL_DEVELOPMENT.md)** - How to create new skills
- **[API Reference](API_REFERENCE.md)** - Technical API documentation

### Additional Resources
- **[Glossary](GLOSSARY.md)** - Term definitions and abbreviations
- **[Changelog](CHANGELOG.md)** - Version history and release notes
- **[Roadmap](ROADMAP.md)** - Future features and planned enhancements
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community guidelines

---

## 🚀 Quick Navigation

### I want to...

**Get started with AgenticCoder**
→ Start with [Getting Started](GETTING_STARTED.md)

**Run my first project**
→ Read [User Guide](USER_GUIDE.md) → Try an [Example](examples/)

**Contribute to AgenticCoder**
→ Read [Contributing Guide](CONTRIBUTING.md) → Follow [Developer Guide](DEVELOPER_GUIDE.md)

**Build a new Agent**
→ Read [Agent Development Guide](guides/AGENT_DEVELOPMENT.md)

**Build a new Skill**
→ Read [Skill Development Guide](guides/SKILL_DEVELOPMENT.md)

**Understand the architecture**
→ Read [Architecture Overview](ARCHITECTURE.md)

**Find answers to common questions**
→ Check [FAQ](FAQ.md)

---

## 📖 System Overview

**AgenticCoder** is a multi-tier agent orchestration system with:
- **26 Specialized Agents** across 3 tiers
- **33 Reusable Skills** organized by technology
- **4 Advanced Features** (Option C enhancements)
- **8+ Reference Scenarios** for real-world use cases
- **15+ Technology Stacks** supported

### Key Statistics

| Metric | Value |
|--------|-------|
| Total Agents | 26 |
| Orchestration Agents | 9 |
| Conditional Agents | 4 |
| Implementation Agents | 13 |
| Total Skills | 33 |
| Documentation Files | 20+ |
| Supported Tech Stacks | 1000+ |
| Average Project Time | 9-11 hours |

---

## 🎯 System Flow

```
USER INPUT (Project Requirements)
    ↓
ORCHESTRATION TIER (Phases 1-8)
    @plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect
    ↓
ARCHITECTURE TIER (Conditional, Phases 9-12)
    [IF Azure] → @azure-architect → @bicep-specialist → @azure-devops-specialist
    [IF Database] → @database-specialist
    ↓
IMPLEMENTATION TIER (Conditional, Phases 13-15)
    [PARALLEL]
    ├─ Frontend: @react-specialist | @vue-specialist | @angular-specialist | @svelte-specialist
    ├─ Backend: @nodejs-specialist | @python-specialist | @go-specialist | @java-specialist | @dotnet-specialist
    ├─ Database: @mysql-specialist
    └─ Infrastructure: @docker-specialist
    ↓
FINAL PHASE (Phase 16)
    @devops-specialist → @reporter
    ↓
COMPLETE: Production-ready codebase with CI/CD
```

---

## 💡 Core Concepts

### Agents
Specialized AI agents that perform specific tasks in the project creation pipeline. Each agent has:
- Clear input/output specifications
- Handoff logic to next agent(s)
- Skills it uses
- Activation conditions

### Skills
Reusable, composable capabilities that agents use. Skills include:
- Best practices for technologies
- Code patterns and templates
- Security guidelines
- Optimization strategies

### Option C Enhancements
- **Configuration Management** - Environment-specific behavior control
- **Artifact Versioning** - Semantic versioning with rollback
- **Agent Communication** - Inter-agent messaging protocol
- **Feedback Loops** - Quality gates and human-in-the-loop

### Scenarios
Real-world project templates (S01-S08):
- Solo MVP (React + .NET + Azure)
- Startup (React + Node.js)
- Medium SaaS (React + Node.js + AKS)
- Enterprise (Angular + Java + Azure)
- Healthcare (React + Node.js + HIPAA)
- Vue SPA (Vue + Python + MySQL)
- Go Microservices (Angular + Go)
- Svelte Fullstack (Svelte + Java)

---

## 🔗 Related Resources

### Main Documentation (in `/docs`)
- [System Architecture](../docs/SYSTEM_ARCHITECTURE.md)
- [Phase Flow](../docs/PHASE_FLOW.md)
- [Agent Activation Guide](../docs/AGENT_ACTIVATION_GUIDE.md)
- [Agent-Skill Mapping](../docs/AGENT_SKILL_MAPPING.md)

### Source Code
- Agent definitions: [`.github/agents/`](../.github/agents/)
- Skill definitions: [`.github/skills/`](../.github/skills/)
- Schemas: [`.github/schemas/`](../.github/schemas/)
- Configuration: [`.github/.agenticcoder/`](../.github/.agenticcoder/)

---

## 📝 Documentation Conventions

This documentation follows [GitHub Flavored Markdown (GFM)](https://github.github.com/gfm/) and [Google Documentation Style Guide](https://google.github.io/styleguide/docguide/) conventions.

### How to Navigate
- **Bold** (`**text**`) = important terms, UI elements, commands
- **Code** (backticks) = file paths, commands, code snippets
- **Links** = related documentation, external resources
- **Callouts** = notes, warnings, tips

---

## ❓ Getting Help

### Documentation
1. Check [FAQ](FAQ.md) for common questions
2. Search in relevant guide ([User Guide](USER_GUIDE.md), [Developer Guide](DEVELOPER_GUIDE.md))
3. Review [Architecture Overview](ARCHITECTURE.md) for technical details

### Contributing
1. Read [Contributing Guide](CONTRIBUTING.md)
2. Follow [Code of Conduct](CODE_OF_CONDUCT.md)
3. Check [Developer Guide](DEVELOPER_GUIDE.md) for setup

### Issues & Discussions
- Report bugs: GitHub Issues
- Ask questions: GitHub Discussions
- Share ideas: GitHub Discussions

---

## 🤝 Contributing

We welcome contributions! See [Contributing Guide](CONTRIBUTING.md) for:
- How to report bugs
- How to suggest features
- How to submit pull requests
- Development setup instructions

---

## 📄 License

AgenticCoder is available under the [MIT License](../LICENSE).

---

## 📞 Support

For questions or issues:
1. Check [FAQ](FAQ.md)
2. Review [Troubleshooting](USER_GUIDE.md#troubleshooting)
3. Open a GitHub Issue
4. Start a GitHub Discussion

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
