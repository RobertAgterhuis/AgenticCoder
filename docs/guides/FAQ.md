# Frequently Asked Questions

Common questions about AgenticCoder.

## General

### What is AgenticCoder?

AgenticCoder is an AI-powered software development orchestration system that uses GitHub Copilot agents to automate the software development lifecycle. It coordinates 39 specialized agents across 16 phases to generate complete, production-ready applications.

### How is it different from GitHub Copilot?

| Feature | GitHub Copilot | AgenticCoder |
|---------|---------------|--------------|
| Scope | Code completion | Full SDLC automation |
| Agents | Single assistant | 39 specialized agents |
| Output | Code snippets | Complete projects |
| Workflow | Ad-hoc | Structured 16-phase process |
| Artifacts | Code | Code + docs + infra + tests |

### What can I build with AgenticCoder?

AgenticCoder supports various project types:
- **Web Applications** (React, Angular, Vue + .NET, Node.js)
- **APIs** (REST, GraphQL)
- **Microservices** (Kubernetes-based)
- **Serverless** (Azure Functions)
- **Static Sites** (JAMstack)
- **Mobile Backends** (cross-platform support)

### Which cloud platforms are supported?

Currently optimized for **Microsoft Azure** with:
- Azure App Service
- Azure Functions
- Azure Kubernetes Service (AKS)
- Azure SQL / Cosmos DB
- Azure DevOps / GitHub Actions

Other platforms (AWS, GCP) have limited support and are on the roadmap.

## Installation

### What are the system requirements?

- **Node.js** 20.x or higher
- **VS Code** 1.85 or higher
- **GitHub Copilot** subscription (Individual, Business, or Enterprise)
- **Git** 2.30+
- **8GB RAM** minimum (16GB recommended)

### Can I use it without VS Code?

Currently, VS Code is required as AgenticCoder integrates deeply with the GitHub Copilot extension. CLI-only mode is planned for future releases.

### Is a GitHub Copilot subscription required?

Yes. AgenticCoder uses GitHub Copilot's infrastructure for AI capabilities. You need an active Copilot subscription (Individual, Business, or Enterprise).

### How do I update AgenticCoder?

```bash
# VS Code extension
Extensions → AgenticCoder → Update

# npm global
npm update -g @agentic/coder

# npm local
npm update @agentic/coder
```

## Usage

### How do I start a new project?

```bash
# Initialize with scenario
agentic init --scenario S02

# Or interactively
agentic init
# Follow prompts to select scenario and configure
```

### What are scenarios?

Scenarios are project templates that configure the workflow for specific project types:

| Scenario | Best For |
|----------|----------|
| S01 | Solo developers, small projects |
| S02 | Startup teams (3-5 people) |
| S03 | Enterprise teams |
| S04 | Agencies managing multiple clients |
| S05 | Open source projects |

### Can I customize the workflow?

Yes! You can:
- Skip phases: `phases.skip: [4, 6]`
- Disable agents: `agents.disabled: [mobile-specialist]`
- Modify timeouts: `engine.phaseTimeout: 600000`
- Create custom scenarios

### How long does a full workflow take?

Depends on project complexity:

| Scenario | Estimated Time |
|----------|----------------|
| S01 (Solo) | 2-4 hours |
| S02 (Startup) | 8-16 hours |
| S03 (Enterprise) | 20-40 hours |
| S04 (Agency) | 40-80 hours |

These are AI-assisted times. Human review checkpoints add additional time.

### Can I run specific phases only?

```bash
# Run single phase
agentic run --phase 5

# Run phase range
agentic run --from-phase 5 --to-phase 10

# Skip phases
agentic run --skip 4,6
```

## Agents

### What are agents?

Agents are specialized AI assistants, each expert in a specific domain:
- `plan` - Project planning
- `architect` - System architecture
- `react-specialist` - React development
- `bicep-specialist` - Azure infrastructure

See [Agent Catalog](agents/Catalog) for the full list.

### Can I create custom agents?

Yes! Create a markdown file in `.github/agents/`:

```markdown
# My Custom Agent

## Description
Description of what this agent does.

## Skills
@skills:my-skill

## Capabilities
- Capability 1
- Capability 2
```

See [Building Agents](guides/Building-Agents) for details.

### How do agents communicate?

Agents communicate through a structured message bus:
1. **Broadcast** - To all agents
2. **Direct** - To specific agent
3. **Phase** - To agents in a phase
4. **Request/Response** - Synchronous communication

### What are skills?

Skills are reusable knowledge modules that give agents specialized capabilities. One agent can use multiple skills, and one skill can be shared across multiple agents.

## Azure Integration

### How does Bicep generation work?

AgenticCoder uses Azure Verified Modules (AVM) when available:
1. Analyzes requirements from architecture phase
2. Discovers applicable AVM modules
3. Generates Bicep templates with proper dependencies
4. Validates generated code

### Can I use Terraform instead of Bicep?

Terraform support is planned but not yet available. Currently, Bicep is the primary IaC language.

### How do I deploy to Azure?

AgenticCoder generates GitHub Actions workflows:

```bash
# Review generated pipeline
cat .github/workflows/deploy.yml

# Configure secrets
gh secret set AZURE_SUBSCRIPTION_ID

# Push to trigger deployment
git push origin main
```

### Is multi-tenant deployment supported?

Yes! See [Azure Multi-Tenant](guides/Azure-Architecture) for:
- Separate subscriptions per tenant
- Resource isolation
- Tenant-aware configuration
- Cost allocation

## Validation

### What gets validated?

1. **Schema** - YAML/JSON structure
2. **Syntax** - Code correctness
3. **Semantic** - Logic and references
4. **Security** - Secrets and vulnerabilities
5. **Quality** - Linting and best practices

### What happens when validation fails?

1. Error details are reported
2. Auto-fix is attempted (if enabled)
3. Human review requested (if auto-fix fails)
4. Feedback loop triggers correction

### Can I disable validation?

```yaml
# .agentic/config/validation.yaml
validation:
  enabled: false  # Not recommended

# Or disable specific validators
validation:
  validators:
    security:
      enabled: false  # Disable security only
```

## Self-Learning

### How does self-learning work?

1. **Metrics Collection** - Performance data from executions
2. **Pattern Analysis** - Identify improvement opportunities
3. **Optimization** - Generate and test improvements
4. **Application** - Apply approved optimizations

### Does it learn from my code?

AgenticCoder learns from:
- Execution patterns (timing, success rates)
- Validation results
- Human feedback/corrections

It does **not** send your code to external services beyond GitHub Copilot's normal operation.

### Can I disable self-learning?

```yaml
# .agentic/config/learning.yaml
learning:
  enabled: false
```

## Troubleshooting

### Why is my workflow slow?

Common causes:
1. **Network latency** - Check internet connection
2. **Low resources** - Close other applications
3. **Large project** - Enable incremental processing
4. **Sequential execution** - Enable parallel execution

### Why do I get timeout errors?

Increase timeouts:

```yaml
# .agentic/config/engine.yaml
engine:
  defaultTimeout: 600000    # 10 minutes
  phaseTimeout: 1800000     # 30 minutes
```

### Where are logs stored?

```
.agentic/
└── logs/
    ├── agentic.log          # Main log
    ├── agents/              # Agent-specific logs
    └── workflows/           # Workflow execution logs
```

### How do I report a bug?

```bash
agentic bug-report
```

This generates a diagnostic package. Then create an issue on GitHub with the report attached.

## Privacy & Security

### What data is sent externally?

AgenticCoder uses GitHub Copilot for AI capabilities. Data flows follow GitHub Copilot's data handling:
- Code context sent to Copilot
- Responses generated by Copilot
- No additional external services

### Is my code stored anywhere?

Your code is:
- Processed locally
- Sent to GitHub Copilot (per Copilot's terms)
- **Not** stored by AgenticCoder
- **Not** sent to any other service

### How are secrets handled?

- Secrets detected in code trigger warnings
- Environment variables recommended
- Key Vault integration for Azure
- `.env` files excluded from git

## Licensing

### What license is AgenticCoder under?

AgenticCoder is available under MIT license for the open-source components.

### Can I use it commercially?

Yes. Review the license terms for specific usage rights.

### Is enterprise support available?

Enterprise support options are available. Contact support for details.

## Roadmap

### What features are planned?

- **Q1 2025**: Terraform support, AWS integration
- **Q2 2025**: CLI-only mode, plugin system
- **Q3 2025**: GCP support, multi-language
- **Q4 2025**: Visual workflow editor

### How can I contribute?

See [Contributing Guide](https://github.com/agentic/coder/blob/main/CONTRIBUTING.md):
1. Fork the repository
2. Create feature branch
3. Submit pull request
4. Follow code review process

### Where do I suggest features?

Open a [GitHub Discussion](https://github.com/agentic/coder/discussions) with the "feature request" category.

## Next Steps

- [Quick Start](overview/Quick-Start) - Get started
- [Troubleshooting](guides/Troubleshooting) - Solve issues
- [Agent Catalog](agents/Catalog) - Explore agents
