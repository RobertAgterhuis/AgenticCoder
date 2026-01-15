# AgenticCoder Documentation

**Last Updated**: January 13, 2026  
**Version**: 2.0 (Option C Enhanced)

---

## 📚 Documentation Index

### 🚀 Getting Started
- **[Quick Start Guide](quick-start.md)** - Get up and running in 5 minutes
- **[Agent Activation Guide](AGENT_ACTIVATION_GUIDE.md)** - Understanding when and how agents activate
- **[Phase Flow](PHASE_FLOW.md)** - Complete project workflow from planning to deployment

### 🏗️ System Architecture
- **[System Architecture](SYSTEM_ARCHITECTURE.md)** - Complete system design and architecture
- **[Option C: Advanced Enhancements](OPTION_C_SYSTEM_OVERVIEW.md)** - Enterprise features overview
- **[Option C Complete Summary](OPTION_C_COMPLETE_SUMMARY.md)** - Implementation details

### 🔧 Advanced Features (Option C)
- **[Configuration Management](CONFIG_SYSTEM_QUICKREF.md)** - YAML-based agent configuration
- **[Artifact Versioning](ARTIFACT_VERSIONING_QUICKREF.md)** - Version tracking and rollback
- **[Feedback Loops](FEEDBACK_LOOPS_QUICKREF.md)** - Agent clarification requests
- **[Agent Communication](AGENT_COMMUNICATION_QUICKREF.md)** - Agent-to-agent messaging
- **[Implementation Guide](ADVANCED_ENHANCEMENTS_IMPLEMENTATION.md)** - Full implementation details

### ✅ Validation & Integration
- **[Integration Validation](INTEGRATION_VALIDATION.md)** - Testing and validation procedures
- **[Validation Checklist](VALIDATION_CHECKLIST.md)** - Quality assurance checklist
- **[Completion Summary](COMPLETION_SUMMARY.md)** - Project completion tracking

### 📖 Reference Materials
- **[DevOps Agent Clarification](DEVOPS_AGENT_CLARIFICATION.md)** - DevOps specialist details
- **[GitHub README](GITHUB_README.md)** - Original .github folder documentation

---

## 📊 System Inventory

### Agents (26 Total)

#### Orchestration Tier (9 agents)
- `@plan` - Project planning and discovery
- `@doc` - Technical documentation
- `@backlog` - User story creation
- `@architect` - System architecture design
- `@code-architect` - Code structure planning
- `@coordinator` - Agent coordination
- `@qa` - Quality assurance
- `@reporter` - Progress reporting
- `@devops-specialist` - CI/CD and deployment

#### Architecture Tier (4 agents)
- `@azure-architect` - Azure cloud architecture
- `@azure-devops-specialist` - Azure DevOps pipelines
- `@bicep-specialist` - Azure Infrastructure as Code
- `@database-specialist` - Database design

#### Implementation Tier (13 agents)
- `@frontend-specialist` - Generic frontend
- `@react-specialist` - React applications
- `@vue-specialist` - Vue.js applications
- `@angular-specialist` - Angular applications
- `@svelte-specialist` - Svelte applications
- `@backend-specialist` - Generic backend
- `@nodejs-specialist` - Node.js APIs
- `@python-specialist` - Python APIs
- `@go-specialist` - Go APIs
- `@java-specialist` - Java APIs
- `@dotnet-specialist` - .NET applications
- `@mysql-specialist` - MySQL database
- `@docker-specialist` - Container optimization

### Skills (33 Total)

#### Planning & Analysis (5 skills)
- `adaptive-discovery` - Dynamic requirements discovery
- `requirements-analysis` - Requirements gathering
- `backlog-planning` - Story creation
- `phase-planning` - Project phases
- `timeline-estimation` - Time estimates

#### Architecture & Design (3 skills)
- `architecture-design` - System architecture
- `sql-schema-design` - Database schema
- `error-handling` - Error management patterns

#### Frontend Skills (9 skills)
- `react-patterns` - React best practices
- `vue-best-practices` - Vue.js patterns
- `vue-component-patterns` - Vue components
- `angular-best-practices` - Angular patterns
- `angular-component-patterns` - Angular components
- `svelte-best-practices` - Svelte patterns
- `svelte-patterns` - Svelte components
- `state-management` - State management

#### Backend Skills (12 skills)
- `nodejs-api-patterns` - Node.js API design
- `nodejs-best-practices` - Node.js standards
- `python-api-patterns` - Python API design
- `python-best-practices` - Python standards
- `go-api-patterns` - Go API design
- `go-best-practices` - Go standards
- `java-api-patterns` - Java API design
- `java-best-practices` - Java standards
- `dotnet-webapi` - .NET Web API
- `entity-framework` - Entity Framework ORM
- `mysql-optimization` - MySQL performance
- `mysql-schema-patterns` - MySQL design

#### DevOps & Infrastructure (4 skills)
- `azure-pipelines` - Azure DevOps CI/CD
- `infrastructure-automation` - IaC patterns
- `docker-container-patterns` - Dockerfile patterns
- `docker-optimization` - Container optimization

#### Documentation (1 skill)
- `technical-writing` - Technical documentation

---

## 🎯 Key Concepts

### Agent Tiers
Agents are organized in three tiers:
1. **Orchestration** - Always run (project planning, coordination, QA)
2. **Architecture** - Platform-specific (Azure, databases)
3. **Implementation** - Technology-specific (React, Node.js, Go, etc.)

### Activation Logic
Agents activate based on:
- **Sequential triggers** - After previous phase completes
- **Conditional activation** - Based on project requirements
- **Technology detection** - Based on selected tech stack

### Handoff Pattern
```
User Request → @plan → @doc → @backlog → @architect
    ↓
Platform Decision (Azure? On-prem?)
    ↓
@azure-architect OR Standard Architecture
    ↓
Tech Stack Decision (React? Vue? Node.js? Go?)
    ↓
@react-specialist, @nodejs-specialist, etc.
    ↓
@qa → @devops-specialist → @reporter
```

### Option C Enhancements
Advanced enterprise features:
- **Configuration Management** - YAML-based behavior control
- **Artifact Versioning** - Complete history and rollback
- **Feedback Loops** - Agents ask clarifying questions
- **Agent Communication** - Coordination between agents

---

## 🛠️ System Structure

```
AgenticCoder/
├── .github/
│   ├── .agenticcoder/          # System configuration
│   │   ├── config/             # Agent behavior configs
│   │   ├── artifacts/          # Version tracking
│   │   ├── feedback/           # Clarification requests
│   │   └── communication/      # Agent messaging
│   ├── agents/                 # 26 agent definitions
│   ├── skills/                 # 33 skill modules
│   ├── schemas/                # JSON schemas
│   ├── scenarios/              # Test scenarios
│   ├── templates/              # Code templates
│   └── mcp/                    # MCP configurations
│
├── docs/                       # All documentation (YOU ARE HERE)
│
└── AgenticCoderPlan/          # Legacy planning artifacts
```

---

## 📖 How to Use This Documentation

### For New Users
1. Start with [Quick Start Guide](quick-start.md)
2. Read [Phase Flow](PHASE_FLOW.md) to understand the workflow
3. Review [Agent Activation Guide](AGENT_ACTIVATION_GUIDE.md)

### For Developers
1. Read [System Architecture](SYSTEM_ARCHITECTURE.md)
2. Study [Advanced Enhancements Implementation](ADVANCED_ENHANCEMENTS_IMPLEMENTATION.md)
3. Review individual quick reference guides for each feature

### For Contributors
1. Understand [System Architecture](SYSTEM_ARCHITECTURE.md)
2. Review agent and skill files in `.github/` folders
3. Follow patterns in existing agents/skills

---

## 🔗 Quick Links

| Document | Purpose | Audience |
|----------|---------|----------|
| [Quick Start](quick-start.md) | Get started fast | All users |
| [Agent Activation](AGENT_ACTIVATION_GUIDE.md) | Agent triggers | All users |
| [Phase Flow](PHASE_FLOW.md) | Project workflow | All users |
| [System Architecture](SYSTEM_ARCHITECTURE.md) | Architecture | Developers |
| [Option C Overview](OPTION_C_SYSTEM_OVERVIEW.md) | Advanced features | Architects |
| [Config Management](CONFIG_SYSTEM_QUICKREF.md) | Configuration | Ops teams |
| [Artifact Versioning](ARTIFACT_VERSIONING_QUICKREF.md) | Version control | Developers |
| [Implementation Guide](ADVANCED_ENHANCEMENTS_IMPLEMENTATION.md) | Build Option C | Developers |

---

## 📈 Version History

### Version 2.0 (January 13, 2026) - Option C Enhanced
- ✅ Added 8 new specialist agents (Vue, Angular, Svelte, Node.js, Python, Go, Java, MySQL)
- ✅ Added Docker specialist with optimization skills
- ✅ Implemented Option C: Configuration Management
- ✅ Implemented Option C: Artifact Versioning
- ✅ Implemented Option C: Feedback Loops
- ✅ Implemented Option C: Agent Communication
- ✅ Added 20+ new skills for technology specialists
- ✅ Reorganized documentation structure

### Version 1.0 (January 2026) - Initial Release
- ✅ Core orchestration agents (9 agents)
- ✅ Azure architecture tier (4 agents)
- ✅ Initial implementation agents (5 agents)
- ✅ Phase flow system
- ✅ Agent activation logic

---

## 🤝 Contributing

To contribute to AgenticCoder:
1. Follow existing agent/skill patterns
2. Update this documentation
3. Add integration tests
4. Follow JSON schema validation

---

## 📞 Support

For questions or issues:
- Review documentation in this folder
- Check agent/skill definitions in `.github/` folders
- Refer to schemas for validation

---

**Status**: ✅ Complete and Production-Ready  
**Total Agents**: 26  
**Total Skills**: 33  
**Total Schemas**: 6 (4 skill + 2 agent)  
**Documentation Files**: 16
