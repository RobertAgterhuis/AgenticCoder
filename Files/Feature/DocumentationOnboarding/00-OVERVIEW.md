# Feature: Documentation & Onboarding

**Feature ID:** F-DOC-001  
**Priority:** 🟡 High  
**Status:** ⬜ Not Started  
**Estimated Duration:** 2-3 weeks  
**Dependencies:** UserInterfaceLayer

---

## 🎯 Problem Statement

AgenticCoder heeft momenteel **onvoldoende documentatie voor gebruikers**:
- ❌ Geen getting started guide
- ❌ Geen user manual
- ❌ Geen API documentatie
- ❌ Geen troubleshooting guide
- ❌ Geen video tutorials of walkthroughs
- ❌ Wiki is developer-focused, niet user-focused

**Nieuwe gebruikers kunnen het systeem niet leren gebruiken.**

---

## 📊 Gap Analysis

### Huidige Documentatie

| Document | Status | Audience |
|----------|--------|----------|
| Wiki (Architecture.md) | ✅ Exists | Developers |
| Wiki (Developer-Guide.md) | ✅ Exists | Developers |
| README.md | ⚠️ Minimal | Mixed |
| Agent .md files | ✅ Exists | System |
| Skill .md files | ✅ Exists | System |
| **User Guide** | ❌ Missing | End Users |
| **Getting Started** | ❌ Missing | New Users |
| **API Reference** | ❌ Missing | Integrators |
| **Troubleshooting** | ❌ Missing | All |

### Vereiste Documentatie

| Document | Target | Format |
|----------|--------|--------|
| Quick Start Guide | New Users | Markdown |
| User Manual | End Users | Markdown + Diagrams |
| CLI Reference | All Users | Markdown |
| Agent Reference | Advanced Users | Markdown |
| Scenario Guide | Project Managers | Markdown |
| API Reference | Integrators | OpenAPI/Markdown |
| Troubleshooting | Support | FAQ format |
| Video Tutorials | Visual Learners | MP4/YouTube |

---

## 🏗️ Proposed Documentation Structure

```
docs/
├── getting-started/
│   ├── README.md                  # Landing page
│   ├── installation.md            # Install guide
│   ├── quick-start.md             # 5-minute tutorial
│   ├── your-first-project.md      # Step-by-step
│   └── concepts.md                # Core concepts
│
├── user-guide/
│   ├── README.md                  # User guide index
│   ├── cli-commands.md            # CLI reference
│   ├── configuration.md           # Config options
│   ├── scenarios.md               # Using scenarios
│   ├── customization.md           # Customizing behavior
│   └── best-practices.md          # Tips and tricks
│
├── reference/
│   ├── agents/                    # Agent reference
│   │   ├── index.md
│   │   ├── plan-agent.md
│   │   ├── doc-agent.md
│   │   └── ...
│   ├── skills/                    # Skill reference
│   │   ├── index.md
│   │   └── ...
│   ├── scenarios/                 # Scenario details
│   │   ├── S01-simple-mvp.md
│   │   └── ...
│   └── api/                       # API docs
│       ├── rest-api.md
│       └── webhook-events.md
│
├── troubleshooting/
│   ├── README.md                  # FAQ index
│   ├── common-errors.md           # Error solutions
│   ├── debugging.md               # Debug tips
│   └── support.md                 # Getting help
│
├── tutorials/
│   ├── README.md                  # Tutorial index
│   ├── building-todo-app.md       # S01 walkthrough
│   ├── enterprise-project.md      # S04 walkthrough
│   └── custom-agents.md           # Advanced
│
└── contributing/
    ├── README.md
    ├── development-setup.md
    ├── adding-agents.md
    └── code-standards.md
```

---

## 📦 Proposed Deliverables

### Getting Started (Priority 1)
- [ ] Installation Guide - All platforms
- [ ] Quick Start - 5-minute first run
- [ ] Your First Project - Tutorial
- [ ] Core Concepts - Architecture overview

### User Guide (Priority 1)
- [ ] CLI Command Reference
- [ ] Configuration Guide
- [ ] Scenario Selection Guide
- [ ] Customization Guide

### Reference (Priority 2)
- [ ] Agent Reference (all 17+ agents)
- [ ] Skill Reference (all 15+ skills)
- [ ] Scenario Details (S01-S05, A01-A05)
- [ ] API Reference (if applicable)

### Troubleshooting (Priority 2)
- [ ] Common Errors FAQ
- [ ] Debugging Guide
- [ ] Support Channels

### Tutorials (Priority 3)
- [ ] S01 Walkthrough (Video + Text)
- [ ] Custom Agent Tutorial
- [ ] Integration Guide

---

## 📝 Sample Documents

### Quick Start Example
```markdown
# Quick Start (5 minutes)

## Prerequisites
- Node.js 20+
- Azure CLI (optional)

## Installation
\`\`\`bash
npm install -g @agenticcoder/cli
\`\`\`

## Create Your First Project
\`\`\`bash
agentic init my-todo-app
cd my-todo-app
agentic run S01
\`\`\`

## What Happens Next?
1. Interactive wizard asks about your requirements
2. Agents collaborate to design your architecture
3. Code is generated in the `output/` folder
4. Review and customize as needed

## Next Steps
- [User Guide](./user-guide/) - Learn all features
- [Scenarios](./reference/scenarios/) - Choose the right scenario
- [Troubleshooting](./troubleshooting/) - Get help
```

---

## 🔗 Related Components

| Component | Relation |
|-----------|----------|
| CLI (UserInterfaceLayer) | Documents CLI usage |
| Agents | Reference documentation |
| Scenarios | Scenario guides |
| Wiki | Complements developer docs |

---

## 📝 Phase Structure (To Be Detailed)

| Phase | Name | Focus |
|-------|------|-------|
| 1 | Getting Started | Installation, quick start |
| 2 | User Guide | CLI, config, scenarios |
| 3 | Reference | Agents, skills, API |
| 4 | Troubleshooting | FAQ, debugging |
| 5 | Tutorials & Polish | Walkthroughs, videos |

---

## 🌐 MCP Server Integration

> **UPDATE**: We kunnen bestaande MCP servers gebruiken voor documentatie access en generation. Dit reduceert onze custom code met ~50%.

### Beschikbare MCP Servers

| MCP Server | Functionaliteit | Licentie |
|------------|-----------------|----------|
| **Fetch MCP** | Web content fetching and conversion | MIT (Official Reference) |
| **Git MCP** | Read, search Git repos | MIT (Official Reference) |
| **GitMCP** | Connect to ANY GitHub repository docs | Open Source |
| **Markdownify MCP** | Convert PPTX, HTML, PDF to Markdown | Open Source |
| **Docy MCP** | Direct technical documentation access | Open Source |
| **Microsoft Docs MCP** | Search Microsoft/Azure documentation | Azure MCP |

### Component Mapping naar MCP

| Originele Component | MCP Alternatief | Code Reductie |
|---------------------|-----------------|---------------|
| Doc Retrieval | **Fetch MCP** + **GitMCP** | 70% |
| Doc Conversion | **Markdownify MCP** | 60% |
| Doc Search | **Docy MCP** | 70% |
| Azure Docs | **Microsoft Docs MCP** | 80% |
| Doc Generation | ❌ Custom templates nodig | 0% |
| Doc Structure | ❌ Custom nodig | 0% |

### Aanbevolen MCP Configuratie

```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "description": "Fetch and convert web content"
    },
    "gitmcp": {
      "command": "npx",
      "args": ["-y", "git-mcp"],
      "description": "Access any GitHub repository docs"
    },
    "markdownify": {
      "command": "npx",
      "args": ["-y", "mcp-markdownify-server"],
      "description": "Convert various formats to Markdown"
    }
  }
}
```

### Aangepaste Architecture (met MCPs)

```
┌──────────────────────────────────────────────────────┐
│              Documentation System                     │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │       Doc Generator (Custom Templates)       │     │
│  │  - Agent reference generation                │     │
│  │  - Scenario documentation                    │     │
│  │  - CLI help generation                       │     │
│  └─────────────────────┬───────────────────────┘     │
│                        │                              │
│     ┌──────────────────┼──────────────────┐          │
│     ▼                  ▼                  ▼          │
│ ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│ │  Fetch   │     │  GitMCP  │     │Markdownify│     │
│ │   MCP    │     │   MCP    │     │   MCP    │      │
│ │(web docs)│     │(repo docs)│    │(convert) │      │
│ └──────────┘     └──────────┘     └──────────┘      │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │          Static Site Generator              │     │
│  │    (VitePress/Docusaurus - Custom)          │     │
│  └─────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘
```

### Fetch MCP Capabilities

Fetch MCP (Official Reference Server) biedt:
- ✅ Web content fetching
- ✅ HTML to Markdown conversion
- ✅ Efficient LLM consumption
- ✅ Perfect voor external docs

### Remaining Custom Code

Met MCP integratie hoeven we alleen nog te bouwen:
1. **DocTemplates** - Templates voor agent/skill docs
2. **DocGenerator** - Generate from templates
3. **SiteGenerator** - VitePress/Docusaurus setup
4. **DocIndex** - Search index generation
5. **Tutorial Content** - Actual tutorial writing

**Totale code reductie: ~50%**

---

## 🔗 Navigation

← [../TestingValidationFramework/00-OVERVIEW.md](../TestingValidationFramework/00-OVERVIEW.md) | [Index](../../README.md) | [MCP Integration](../MCP-INTEGRATION.md)
