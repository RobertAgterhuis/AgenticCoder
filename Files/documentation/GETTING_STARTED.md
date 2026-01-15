# Getting Started with AgenticCoder

**Version**: 2.0  
**Updated**: January 13, 2026

---

## Welcome!

AgenticCoder automates project creation by orchestrating 26 specialized agents that work together to generate complete, production-ready codebases with CI/CD pipelines.

This guide will help you get started in **5 minutes**.

---

## 📋 Prerequisites

- Basic understanding of software development concepts
- Familiarity with one of the supported technology stacks:
  - **Frontend**: React, Vue, Angular, Svelte
  - **Backend**: Node.js, Python, Go, Java, .NET
  - **Database**: MySQL, PostgreSQL
  - **Platform**: Azure, AWS, On-premises

**No coding required** to use AgenticCoder - it generates code for you!

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Understand Your Project Type

AgenticCoder works best when you know:
- ✅ What **frontend framework** you want (React, Vue, Angular, Svelte)
- ✅ What **backend framework** you want (Node.js, Python, Go, Java, .NET)
- ✅ What **database** you need (MySQL, PostgreSQL, or other)
- ✅ What **platform** to deploy on (Azure, AWS, On-premises)
- ✅ Whether you need **containerization** (Docker)

### Step 2: Choose Your Scenario

Find a scenario that matches your project:

| Scenario | Frontend | Backend | Database | Platform | Best For |
|----------|----------|---------|----------|----------|----------|
| **S01** | React | .NET | PostgreSQL | Azure | Solo MVP |
| **S02** | React | Node.js | MongoDB | Any | Startup |
| **S03** | React | Node.js | PostgreSQL | AKS | Medium SaaS |
| **S04** | Angular | Java | Oracle | Azure | Enterprise |
| **S05** | React | Node.js | PostgreSQL | Azure | Healthcare (HIPAA) |
| **S06** | Vue | Python | MySQL | Any | SPA with Python |
| **S07** | Angular | Go | PostgreSQL | Any | Microservices |
| **S08** | Svelte | Java | MySQL | Any | Fullstack |

**See**: [Examples](examples/) folder for full scenario walkthroughs

### Step 3: Run AgenticCoder

1. **Initiate @plan agent**:
   ```
   Tell @plan: "I want to build [Project Name] with [Frontend] + [Backend] + [Database] on [Platform]"
   ```

2. **@plan determines your architecture** by asking:
   - Project scope and requirements
   - Technology stack details
   - Deployment strategy
   - Team composition
   - Success criteria

3. **System automatically activates remaining agents**:
   - Phases 1-8: Orchestration agents (mandatory)
   - Phases 9-12: Architecture agents (conditional)
   - Phases 13-15: Implementation agents (based on stack)
   - Phase 16: Final deployment setup

4. **Get your complete project**:
   - Source code for all layers
   - CI/CD pipelines (GitHub Actions or Azure DevOps)
   - Database schemas and migrations
   - Docker configurations (if needed)
   - Infrastructure as Code (if Azure)
   - Complete documentation

---

## 📚 System Flow at a Glance

```
START
  ↓
@plan Agent (Project Planning)
  ├─ What's your project?
  ├─ What tech stack?
  └─ What platform?
  ↓
@doc (Technical Documentation)
  ↓
@backlog (User Stories)
  ↓
@coordinator (Coordination)
  ↓
@qa (QA Strategy)
  ↓
@reporter (Progress)
  ↓
@architect (System Architecture)
  ↓
@code-architect (Code Structure)
  ↓
[CONDITIONAL BRANCHES]
  ├─ Frontend: React/Vue/Angular/Svelte specialist
  ├─ Backend: Node.js/Python/Go/Java/.NET specialist
  ├─ Database: MySQL or Generic specialist
  ├─ Platform: Azure services (if selected)
  └─ Infrastructure: Docker (if selected)
  ↓
@devops (CI/CD Pipeline)
  ↓
@reporter (Final Report)
  ↓
COMPLETE: Production-ready codebase
```

---

## 🎯 Example: React + Node.js + MySQL on AWS

### Your Input to @plan:
```
"Build a todo list application with React frontend and Node.js backend, 
MySQL database, and deploy on AWS using GitHub Actions. 
Timeline: 2 weeks, team of 2 developers"
```

### What AgenticCoder Will Generate:

**Frontend**:
- React project structure
- Component library setup
- State management (Redux/Context)
- API integration layer
- Unit test examples

**Backend**:
- Node.js API server (Express/Fastify)
- Authentication & authorization
- API endpoints for all features
- Error handling middleware
- API documentation

**Database**:
- MySQL schema design
- Entity relationships
- Migration scripts
- Seed data (examples)
- Query optimization

**Infrastructure**:
- GitHub Actions CI/CD workflow
- Docker setup for local development
- Production deployment configuration
- Environment configuration
- Monitoring setup recommendations

**Documentation**:
- Architecture overview
- Setup instructions
- Deployment guide
- API reference
- Development guide

---

## 🔧 Configuration (Optional)

AgenticCoder has sensible defaults, but you can customize:

**Configuration File**: `.github/.agenticcoder/config/`

```yaml
# defaults.yaml - Base configuration
config:
  max_tokens_per_agent: 2000
  parallel_execution: true
  auto_approval: false
  
agents:
  react_specialist:
    framework_version: "18.2"
    state_management: "redux"
```

**Profiles** (for different environments):
- `development.yaml` - Permissive settings
- `staging.yaml` - Medium strictness
- `production.yaml` - Strict validation

See: [Configuration System Guide](ARCHITECT.md#configuration-management)

---

## 📖 Understanding Agent Tiers

### Tier 1: Orchestration (Always Active)
```
9 agents that run for every project in sequence:
@plan → @doc → @backlog → @coordinator → @qa → @reporter → @architect → @code-architect → @devops
```

Handles planning, documentation, and architecture decisions.

### Tier 2: Architecture (Conditional)
```
4 agents that activate based on platform/infrastructure choices:
- @azure-architect (IF Azure selected)
- @bicep-specialist (IF Azure IaC selected)
- @azure-devops-specialist (IF Azure DevOps selected)
- @database-specialist (IF non-MySQL database selected)
```

Handles cloud infrastructure and database design.

### Tier 3: Implementation (Conditional)
```
13 agents that activate based on technology stack:
- Frontend: @react-specialist, @vue-specialist, @angular-specialist, @svelte-specialist
- Backend: @nodejs-specialist, @python-specialist, @go-specialist, @java-specialist, @dotnet-specialist
- Database: @mysql-specialist
- Infrastructure: @docker-specialist
```

Handles code generation for all layers.

---

## 🎓 Learning Path

### Beginner (30 minutes)
1. Read this **Getting Started** guide
2. Pick a scenario from [Examples](examples/)
3. Understand the system flow above

### Intermediate (1 hour)
1. Read [User Guide](USER_GUIDE.md)
2. Review [System Architecture](ARCHITECTURE.md) overview
3. Explore [FAQ](FAQ.md)

### Advanced (2-3 hours)
1. Read [Developer Guide](DEVELOPER_GUIDE.md)
2. Study [Agent Development Guide](guides/AGENT_DEVELOPMENT.md)
3. Review [API Reference](API_REFERENCE.md)

### Contributing (varies)
1. Read [Contributing Guide](CONTRIBUTING.md)
2. Follow [Developer Guide](DEVELOPER_GUIDE.md) setup
3. Choose: Agent development, Skill development, or Documentation

---

## 💡 Key Concepts

### Agents
Specialized AI workers that:
- Perform specific tasks
- Take input from previous agent
- Hand off to next agent
- Use appropriate skills
- Generate artifacts (code, docs, etc.)

### Skills
Reusable capabilities that agents use:
- Code patterns and best practices
- Framework-specific guidelines
- Security standards
- Optimization techniques

### Artifacts
Outputs from agents:
- Code files
- Documentation
- Configurations
- Migration scripts
- CI/CD pipelines

### Scenarios
Pre-configured project templates:
- Real-world tech stack combinations
- Proven agent activation patterns
- Best practices for that combination

---

## ❓ Common Questions

**Q: Do I need to know how to code?**  
A: No! AgenticCoder generates all the code for you. You just specify what you want.

**Q: Which technology stack should I choose?**  
A: See [Scenarios](examples/) for recommendations, or check [FAQ](FAQ.md#choosing-technology-stack).

**Q: How long does it take to generate a project?**  
A: Typical: 9-11 hours. Factors: project size, complexity, number of agents activated.

**Q: Can I customize the generated code?**  
A: Yes! The generated code is a complete starting point. You can modify any part.

**Q: How do I deploy the generated project?**  
A: Each scenario includes deployment instructions for your chosen platform.

**Q: Is there a cost?**  
A: Check our [Pricing](../README.md#pricing) (if applicable).

**More questions?** See [FAQ](FAQ.md)

---

## 🚦 Next Steps

### Option 1: Quick Walkthrough
→ Pick a [Scenario Example](examples/) and read the walkthrough

### Option 2: Deep Dive
→ Read the [User Guide](USER_GUIDE.md)

### Option 3: Contribute
→ Read [Contributing Guide](CONTRIBUTING.md) and [Developer Guide](DEVELOPER_GUIDE.md)

### Option 4: Understand Architecture
→ Read [Architecture Overview](ARCHITECTURE.md)

---

## 📞 Need Help?

1. **Check [FAQ](FAQ.md)** - Most questions are answered there
2. **Review [User Guide](USER_GUIDE.md)** - Detailed instructions
3. **Open GitHub Issue** - For bugs or unexpected behavior
4. **Start Discussion** - For questions or ideas

---

## 🎉 You're Ready!

You now understand:
- ✅ What AgenticCoder does
- ✅ How it works
- ✅ The system flow
- ✅ How to get started

**Next**: Pick a scenario or read the [User Guide](USER_GUIDE.md)!

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
