# AgenticCoder Documentation

Welcome to the AgenticCoder documentation!

## What is AgenticCoder?

AgenticCoder is an **intelligent multi-agent orchestration system** that generates complete, production-ready codebases from project specifications.

**Key capabilities:**

- **39 Specialized AI Agents** working collaboratively
- **16-Phase Workflow** from requirements to deployment
- **Azure-First** with Bicep IaC and AVM modules
- **Self-Learning** error classification and auto-fix
- **Security** built-in scanning and compliance

## Quick Navigation

### Getting Started

- [Quick Start Guide](overview/Quick-Start) - Get running in 15 minutes
- [System Overview](overview/System-Overview) - Understand what AgenticCoder does
- [Key Concepts](overview/Concepts) - Agents, Phases, Skills explained

### Core Documentation

- [Architecture](overview/Architecture) - System design and components
- [Agent Catalog](agents/Catalog) - All 39 agents documented
- [Phase Workflow](agents/Phases) - 16 phases explained

### Developer Resources

- [Creating Agents](guides/Creating-Agents) - Add new agents
- [Extending MCP](guides/Extending-MCP) - Custom MCP adapters
- [Testing Guide](guides/Testing) - How to test

### Operations

- [Deployment](operations/Deployment) - Deploy AgenticCoder
- [Configuration](operations/Configuration) - All config options
- [Troubleshooting](operations/Troubleshooting) - Common issues

## Project Stats

| Metric | Value |
|--------|-------|
| Agents | 39 |
| Skills | 47 |
| Phases | 16 |
| Test Coverage | 345+ tests |
| TypeScript | 5.0+ |
| Node.js | 20+ |

## Repository Structure

```
AgenticCoder/
├── agents/                 # JavaScript agent framework
│   ├── core/              # Core engine (WorkflowEngine, MessageBus)
│   ├── bicep-avm-resolver/# Bicep AVM pipeline
│   └── bridge/            # JS-TS interoperability
├── src/                   # TypeScript modules
│   ├── azure/            # Azure integration
│   ├── mcp/              # MCP adapters
│   ├── security/         # Security scanning
│   └── cli/              # CLI commands
├── .github/
│   ├── agents/           # 39 agent definitions
│   ├── skills/           # 47 skill definitions
│   └── scenarios/        # 10 project scenarios
└── bin/                  # CLI entry point
```

## Getting Help

1. Check this documentation
2. Search [GitHub Issues](https://github.com/YOUR-ORG/AgenticCoder/issues)
3. Join [Discussions](https://github.com/YOUR-ORG/AgenticCoder/discussions)

---

*Last updated: 2026-01-18*
