# Frequently Asked Questions (FAQ)

Common questions and answers about AgenticCoder.

---

## General Questions

### What is AgenticCoder?

AgenticCoder is an intelligent **multi-agent code generation system**. It uses 26 specialized AI agents working together through 16 orchestrated phases to generate complete, production-ready applications from your project specifications.

Instead of writing code manually, you describe what you want and AgenticCoder builds it with:
- ✅ Source code (frontend, backend, database)
- ✅ Infrastructure as Code (Azure Bicep)
- ✅ CI/CD pipelines (GitHub Actions)
- ✅ Tests and documentation

### Who is AgenticCoder for?

- **Solo developers** building MVPs quickly
- **Startups** needing to move fast
- **Teams** wanting consistent architecture
- **Enterprises** standardizing development
- **Anyone** who wants to focus on business logic, not boilerplate

### Do I need programming experience?

**No!** You don't need to code. You describe your project in plain language:
- What problem does it solve?
- Who are the users?
- What are the main features?
- What technologies do you prefer?

AgenticCoder handles all the coding.

### What technologies does AgenticCoder support?

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React, Vue, Angular, Svelte |
| **Backend** | Node.js, .NET, Python, Go, Java |
| **Database** | PostgreSQL, MySQL, MongoDB |
| **Cloud** | Azure (primary), AWS/GCP (planned) |
| **IaC** | Bicep, Terraform (planned) |
| **CI/CD** | GitHub Actions, Azure DevOps |

---

## Getting Started

### How do I install AgenticCoder?

```bash
# Clone repository
git clone https://github.com/YOUR-ORG/AgenticCoder.git
cd AgenticCoder

# Install dependencies
cd agents && npm install

# Run tests
npm test
```

See [Getting Started](Getting-Started) for detailed instructions.

### What are the prerequisites?

**Required:**
- Node.js 20+
- npm 8+
- Git

**Recommended:**
- VS Code with GitHub Copilot
- Azure CLI (for Azure features)
- Docker (for Dev Container)

### How long does it take to generate a project?

| Project Size | Features | Time |
|--------------|----------|------|
| Simple | 5-10 | 2-3 minutes |
| Medium | 15-25 | 5-10 minutes |
| Complex | 30+ | 15-30 minutes |

Note: Manual implementation would take days or weeks!

---

## Usage

### How do I start a new project?

1. Define your requirements (features, tech stack, platform)
2. Choose a scenario (S01-S05)
3. Invoke the @plan agent with your description
4. Answer clarifying questions
5. Confirm architecture
6. Review generated output

See [User Guide](User-Guide) for detailed walkthrough.

### What are scenarios?

Scenarios are pre-configured project templates:

| Scenario | Description | Best For |
|----------|-------------|----------|
| **S01** | Solo MVP | Quick prototypes, 1 developer |
| **S02** | Startup | Small teams, fast iteration |
| **S03** | Medium SaaS | Growing companies, Kubernetes |
| **S04** | Enterprise | Large organizations, complex requirements |
| **S05** | Healthcare | Regulated industries, HIPAA compliance |

### Can I customize the generated code?

**Absolutely!** Generated code is yours to modify:
- Edit source files
- Add custom features
- Change styling
- Integrate third-party libraries
- Deploy anywhere

### What if I don't like the output?

You can:
1. **Specify preferences** - Tell @plan your requirements upfront
2. **Regenerate** - Run again with different specifications
3. **Modify** - Edit generated code directly
4. **Combine** - Use parts you like, change what you don't

---

## Technical Questions

### How does the agent system work?

AgenticCoder uses a 3-tier, 16-phase architecture:

1. **Orchestration Tier** (Phases 1-8): Planning, documentation, architecture
2. **Architecture Tier** (Phases 9-12): Cloud setup, database design
3. **Implementation Tier** (Phases 13-16): Code generation, testing, deployment

Each phase has specialized agents that collaborate via message passing.

### What are MCP servers?

MCP (Model Context Protocol) servers provide real-time Azure integration through a unified TypeScript layer:

**Native TypeScript Adapters** (`src/mcp/servers/azure/`):
- **AzurePricingMCPAdapter** - Query Azure Retail Prices API
- **AzureResourceGraphMCPAdapter** - Query Azure resources with KQL
- **MicrosoftDocsMCPAdapter** - Search Microsoft Learn documentation

**TypeScript MCP Layer** (`src/mcp/`):
- **MCPBridge** - Unified entry point for all MCP operations
- **MCPClientManager** - Connection pooling and lifecycle management
- **Health Monitoring** - Circuit breaker, retry policies

### How does self-learning work?

The self-learning system:
1. **Classifies errors** - 23 error categories
2. **Detects patterns** - Recognizes recurring issues
3. **Generates fixes** - 14 fix strategies
4. **Validates** - 5 validation gates before applying
5. **Rolls back** - If fixes don't work

### Is my code secure?

AgenticCoder follows security best practices:
- ✅ Secrets management (environment variables)
- ✅ Input validation
- ✅ Authentication/authorization patterns
- ✅ HTTPS enforcement
- ✅ SQL injection prevention

**Always review** generated code before production deployment!

---

## Deployment

### How do I deploy generated code?

**Azure (Recommended):**
```bash
cd output/infrastructure
az deployment group create \
  --resource-group myRG \
  --template-file main.bicep
```

**Local Development:**
```bash
# Frontend
cd output/frontend && npm run dev

# Backend
cd output/backend && npm run dev
```

See [User Guide - Deployment](User-Guide#deployment) for details.

### What cloud platforms are supported?

| Platform | Status |
|----------|--------|
| **Azure** | ✅ Full support |
| **AWS** | 📋 Planned Q3 2026 |
| **GCP** | 📋 Planned Q3 2026 |
| **On-premises** | ✅ Docker/Kubernetes |

---

## Troubleshooting

### Tests are failing

```bash
# Clear cache and reinstall
cd agents
rm -rf node_modules package-lock.json
npm install
npm test
```

### Azure connection errors

```bash
# Verify Azure login
az login
az account show

# Set subscription
az account set --subscription "Your Subscription"
```

### Agent not found errors

Check that the agent is registered in `AgentRegistry.js`:
```javascript
console.log(registry.getAllAgents().map(a => a.name));
```

### Slow generation

- Reduce max_tokens in config
- Use simpler scenario (S01)
- Check network connectivity

---

## Contributing

### How can I contribute?

- 🐛 Report bugs
- 💡 Suggest features
- 💻 Submit code
- 📚 Improve documentation

See [Contributing](Contributing) for guidelines.

### Can I create my own agents?

Yes! See [Developer Guide - Creating Agents](Developer-Guide#creating-agents).

### Where do I report security issues?

**Do not** create public issues for security vulnerabilities. Email security@your-org.com directly.

---

## More Questions?

- **Documentation**: Explore this wiki
- **Discussions**: [GitHub Discussions](https://github.com/YOUR-ORG/AgenticCoder/discussions)
- **Issues**: [GitHub Issues](https://github.com/YOUR-ORG/AgenticCoder/issues)

---

<p align="center">
  <a href="User-Guide">← User Guide</a> | <a href="Home">Home →</a>
</p>
