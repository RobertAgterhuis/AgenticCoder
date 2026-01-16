# Feature: User Interface Layer (CLI/TUI)

**Feature ID:** F-UIL-001  
**Priority:** 🔴 Critical  
**Status:** ⬜ Not Started  
**Estimated Duration:** 3-4 weeks  
**Dependencies:** AgentSkillExpansion, CodeGenerationEngine

---

## 🎯 Problem Statement

AgenticCoder heeft momenteel **geen gebruikersinterface**. Er is:
- ❌ Geen CLI om het systeem te starten
- ❌ Geen manier om projecten te initiëren
- ❌ Geen interactieve wizard voor requirements gathering
- ❌ Geen progress monitoring interface
- ❌ Geen manier om handmatig agents aan te roepen

**Het systeem is niet bruikbaar zonder een interface.**

---

## 📊 Gap Analysis

### Huidige Staat

| Component | Status |
|-----------|--------|
| WorkflowEngine | ✅ Implemented |
| AgentRegistry | ✅ Implemented |
| MessageBus | ✅ Implemented |
| OrchestrationMonitor | ✅ Implemented |
| **CLI Entry Point** | ❌ Missing |
| **Interactive Mode** | ❌ Missing |
| **Progress Display** | ❌ Missing |
| **Configuration UI** | ❌ Missing |

### Vereiste Componenten

| Component | Type | Beschrijving |
|-----------|------|--------------|
| `agentic` CLI | Command | Hoofdcommando voor het systeem |
| `agentic init` | Subcommand | Initieer nieuw project |
| `agentic run` | Subcommand | Run workflow/scenario |
| `agentic status` | Subcommand | Bekijk execution status |
| `agentic agents` | Subcommand | List/invoke agents |
| Interactive Wizard | TUI | Vraag-antwoord requirements gathering |
| Progress Dashboard | TUI | Real-time progress weergave |
| Config Manager | Module | .agenticcoder/config.json beheer |

---

## 🏗️ Proposed Architecture

```
┌────────────────────────────────────────────────┐
│                  User                          │
│                   │                            │
│    ┌──────────────▼──────────────┐            │
│    │     CLI Entry Point         │            │
│    │  (agentic command)          │            │
│    └──────────────┬──────────────┘            │
│                   │                            │
│    ┌──────────────▼──────────────┐            │
│    │   Command Router            │            │
│    │  init | run | status | ...  │            │
│    └──────────────┬──────────────┘            │
│                   │                            │
│    ┌──────────────▼──────────────┐            │
│    │   Interactive Mode (TUI)    │            │
│    │  - Wizard                   │            │
│    │  - Progress Dashboard       │            │
│    │  - Agent Console            │            │
│    └──────────────┬──────────────┘            │
│                   │                            │
└───────────────────┼────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────┐
│           Orchestration Engine                │
│           (Already Implemented)               │
└───────────────────────────────────────────────┘
```

---

## 📦 Proposed Deliverables

### CLI Commands
- [ ] `agentic init [project-name]` - Initialize new project
- [ ] `agentic run [scenario]` - Run a scenario/workflow
- [ ] `agentic status [execution-id]` - Check execution status
- [ ] `agentic agents list` - List available agents
- [ ] `agentic agents invoke <agent>` - Invoke specific agent
- [ ] `agentic config` - Manage configuration
- [ ] `agentic help` - Show help

### Interactive Components
- [ ] Requirements Wizard - Multi-step project requirements gathering
- [ ] Progress Dashboard - Real-time TUI progress display
- [ ] Agent Console - Interactive agent communication
- [ ] Log Viewer - Scrollable log output

### Configuration
- [ ] `.agenticcoder/config.json` - Project configuration
- [ ] `.agenticcoder/state.json` - Execution state persistence
- [ ] Global config in `~/.agenticcoder/`

---

## 🔗 Related Components

| Component | Relation |
|-----------|----------|
| WorkflowEngine | CLI triggers workflow execution |
| OrchestrationMonitor | Progress Dashboard uses this |
| AgentRegistry | Agent listing uses this |
| @plan Agent | Wizard feeds into @plan |

---

## 📝 Phase Structure (To Be Detailed)

| Phase | Name | Focus |
|-------|------|-------|
| 1 | CLI Foundation | Commander.js setup, basic commands |
| 2 | Interactive Wizard | Ink/React TUI for requirements |
| 3 | Progress Dashboard | Real-time execution display |
| 4 | Agent Console | Direct agent interaction |
| 5 | Testing & Polish | E2E tests, documentation |

---

## 🌐 MCP Server Integration

> **UPDATE**: We kunnen bestaande MCP servers gebruiken voor file/git operaties in de CLI. Dit reduceert onze custom code met ~70%.

### Beschikbare MCP Servers

| MCP Server | Functionaliteit | Licentie |
|------------|-----------------|----------|
| **Filesystem MCP** | Secure file operations | MIT (Official Reference) |
| **Git MCP** | Read, search, manipulate Git repos | MIT (Official Reference) |
| **Memory MCP** | Knowledge graph persistent memory | MIT (Official Reference) |
| **Desktop Commander MCP** | Edit files, run terminal, SSH | Open Source |
| **Windows CLI MCP** | PowerShell, CMD, Git Bash | Open Source |

### Component Mapping naar MCP

| Originele Component | MCP Alternatief | Code Reductie |
|---------------------|-----------------|---------------|
| File Operations | **Filesystem MCP** | 90% |
| Git Operations | **Git MCP** | 85% |
| Terminal Commands | **Windows CLI MCP** | 80% |
| Project State | **Memory MCP** | 60% |
| CLI Framework | ❌ Commander.js (custom) | 0% |
| TUI Components | ❌ Ink/React (custom) | 0% |

### Aanbevolen MCP Configuratie

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "."]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Aangepaste Architecture (met MCPs)

```
┌────────────────────────────────────────────────┐
│                  User                          │
│                   │                            │
│    ┌──────────────▼──────────────┐            │
│    │     CLI Entry Point         │            │
│    │  (agentic command)          │            │
│    │      CUSTOM                 │            │
│    └──────────────┬──────────────┘            │
│                   │                            │
│    ┌──────────────▼──────────────┐            │
│    │   Command Router            │            │
│    │      CUSTOM                 │            │
│    └──────────────┬──────────────┘            │
│                   │                            │
│  ┌────────────────┼────────────────┐          │
│  ▼                ▼                ▼          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │Filesystem│ │   Git    │ │  Memory  │       │
│ │   MCP    │ │   MCP    │ │   MCP    │       │
│ └──────────┘ └──────────┘ └──────────┘       │
│                                               │
│    ┌──────────────────────────────┐          │
│    │   Interactive TUI (Custom)   │          │
│    │   - Wizard, Dashboard        │          │
│    └──────────────────────────────┘          │
└───────────────────────────────────────────────┘
```

### Remaining Custom Code

Met MCP integratie hoeven we alleen nog te bouwen:
1. **CLI Framework** - Commander.js setup
2. **Command Router** - Route naar subcommands
3. **Interactive Wizard** - Ink/React TUI
4. **Progress Dashboard** - TUI progress display
5. **Agent Console** - Direct agent interaction

**Totale code reductie: ~70%**

---

## 🔗 Navigation

← [../CodeGenerationEngine/00-OVERVIEW.md](../CodeGenerationEngine/00-OVERVIEW.md) | [Index](../../README.md) | [MCP Integration](../MCP-INTEGRATION.md)
