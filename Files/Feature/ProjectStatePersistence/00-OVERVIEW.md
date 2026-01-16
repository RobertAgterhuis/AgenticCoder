# Feature: Project State & Persistence

**Feature ID:** F-PSP-001  
**Priority:** 🔴 Critical  
**Status:** ⬜ Not Started  
**Estimated Duration:** 2-3 weeks  
**Dependencies:** None (Foundation)

---

## 🎯 Problem Statement

AgenticCoder heeft momenteel **geen persistente state management**:
- ❌ Workflow execution state gaat verloren bij restart
- ❌ Geen project configuratie opslag
- ❌ Geen artifact tracking over sessies heen
- ❌ Geen resume capability voor onderbroken workflows
- ❌ Geen versioning van generated code

**Zonder state persistence kan het systeem geen long-running workflows ondersteunen.**

---

## 📊 Gap Analysis

### Huidige Staat

| Aspect | Status | Impact |
|--------|--------|--------|
| Execution State | ❌ In-memory only | Lost on restart |
| Project Config | ❌ None | No persistence |
| Artifact Registry | ⚠️ Partial | No cross-session |
| Workflow Resume | ❌ None | Must restart from 0 |
| Generated Code | ❌ No tracking | No versioning |
| Decision History | ❌ None | No audit trail |

### Vereiste Componenten

| Component | Type | Beschrijving |
|-----------|------|--------------|
| StateStore | Core | Persistent state storage (JSON/SQLite) |
| ProjectConfig | Module | `.agenticcoder/config.json` management |
| ExecutionCheckpoint | Module | Workflow checkpoint/resume |
| ArtifactVersioning | Module | Track generated artifacts |
| DecisionLog | Module | Record all agent decisions |
| MigrationManager | Module | State schema migrations |

---

## 🏗️ Proposed Architecture

```
┌──────────────────────────────────────────────────────┐
│                   State Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │   Project   │ │  Execution  │ │  Artifact   │    │
│  │   Config    │ │    State    │ │  Registry   │    │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘    │
│         │               │               │            │
│         └───────────────┼───────────────┘            │
│                         ▼                            │
│              ┌─────────────────┐                     │
│              │   StateStore    │                     │
│              │  (Persistence)  │                     │
│              └────────┬────────┘                     │
└───────────────────────┼──────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│                  File System                          │
│  .agenticcoder/                                       │
│  ├── config.json        # Project configuration      │
│  ├── state/             # Execution states           │
│  │   ├── current.json   # Current execution          │
│  │   └── history/       # Past executions            │
│  ├── artifacts/         # Artifact metadata          │
│  ├── decisions/         # Agent decision log         │
│  └── cache/             # Template/prompt cache      │
└───────────────────────────────────────────────────────┘
```

---

## 📦 Proposed Deliverables

### Core Storage
- [ ] StateStore - Abstract storage interface
- [ ] JSONStateStore - JSON file-based storage
- [ ] SQLiteStateStore - SQLite storage (optional)

### State Types
- [ ] ProjectConfig - Project-level configuration
- [ ] ExecutionState - Workflow execution state
- [ ] ArtifactMetadata - Generated artifact tracking
- [ ] DecisionRecord - Agent decision logging

### Operations
- [ ] Checkpoint/Resume - Save and restore execution
- [ ] Export/Import - Project portability
- [ ] Cleanup - Old state cleanup
- [ ] Migration - Schema version handling

---

## 📁 Project Structure

```
.agenticcoder/
├── config.json                    # Project configuration
│   {
│     "projectName": "my-app",
│     "scenario": "S01",
│     "techStack": {...},
│     "settings": {...}
│   }
│
├── state/
│   ├── current.json               # Current execution
│   │   {
│   │     "executionId": "...",
│   │     "currentPhase": 5,
│   │     "completedPhases": [1,2,3,4],
│   │     "lastCheckpoint": "..."
│   │   }
│   └── history/
│       ├── exec-001.json          # Past executions
│       └── exec-002.json
│
├── artifacts/
│   ├── registry.json              # Artifact index
│   └── versions/
│       ├── frontend-v1/
│       └── frontend-v2/
│
├── decisions/
│   ├── decision-log.json          # All decisions
│   └── approvals.json             # Human approvals
│
└── cache/
    ├── templates/                 # Cached templates
    └── prompts/                   # Cached prompts
```

---

## 🔗 Related Components

| Component | Relation |
|-----------|----------|
| WorkflowEngine | State persisted after each step |
| ResultHandler | Artifacts registered here |
| CLI | Reads/writes project config |
| OrchestrationMonitor | State used for dashboard |

---

## 📝 Phase Structure (To Be Detailed)

| Phase | Name | Focus |
|-------|------|-------|
| 1 | StateStore Foundation | Core storage abstraction |
| 2 | Project Configuration | Config management |
| 3 | Execution Persistence | Checkpoint/resume |
| 4 | Artifact Versioning | Track generated code |
| 5 | Testing & Migration | Tests, schema migration |

---

## 🌐 MCP Server Integration

> **UPDATE**: We kunnen bestaande MCP servers gebruiken voor state persistence. Dit reduceert onze custom code met ~65%.

### Beschikbare MCP Servers

| MCP Server | Functionaliteit | Licentie |
|------------|-----------------|----------|
| **Memory MCP** | Knowledge graph persistent memory | MIT (Official Reference) |
| **SQLite MCP** | Local database operations | MIT (Official) |
| **Redis MCP** | Redis database operations | Open Source |
| **PostgreSQL MCP** | PostgreSQL database access | Open Source |
| **MongoDB MCP** | MongoDB operations | Open Source |
| **Filesystem MCP** | File-based storage | MIT (Official Reference) |

### Component Mapping naar MCP

| Originele Component | MCP Alternatief | Code Reductie |
|---------------------|-----------------|---------------|
| In-memory State | **Memory MCP** | 80% |
| JSON Storage | **Filesystem MCP** | 70% |
| SQLite Storage | **SQLite MCP** | 90% |
| Session State | **Redis MCP** | 70% |
| State Abstraction | ❌ Custom interface nodig | 20% |
| Migration Manager | ❌ Custom nodig | 0% |

### Aanbevolen MCP Configuratie

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "description": "Knowledge graph for in-memory state"
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./.agenticcoder"],
      "description": "File-based persistence"
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "mcp-server-sqlite", "--db", "./.agenticcoder/state.db"],
      "description": "SQLite for structured state"
    }
  }
}
```

### Aangepaste Architecture (met MCPs)

```
┌──────────────────────────────────────────────────────┐
│                   State Layer (Simplified)            │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │       StateStore Abstraction (Custom)        │     │
│  │  - Routes to appropriate MCP                 │     │
│  │  - Handles serialization                     │     │
│  └─────────────────────┬───────────────────────┘     │
│                        │                              │
│     ┌──────────────────┼──────────────────┐          │
│     ▼                  ▼                  ▼          │
│ ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│ │ Memory   │     │Filesystem│     │  SQLite  │      │
│ │   MCP    │     │   MCP    │     │   MCP    │      │
│ │(in-mem)  │     │(JSON)    │     │(struct.) │      │
│ └──────────┘     └──────────┘     └──────────┘      │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │     Migration Manager (Custom - Needed)      │     │
│  └─────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘
```

### Memory MCP Capabilities

Memory MCP (Official Reference Server) biedt:
- ✅ Knowledge graph-based storage
- ✅ Persistent memory across sessions
- ✅ Entity and relation management
- ✅ Semantic search capabilities
- ✅ Perfect voor decision/execution history

### Remaining Custom Code

Met MCP integratie hoeven we alleen nog te bouwen:
1. **StateStoreInterface** - Abstract storage interface
2. **MCPStateAdapter** - Connect to MCP servers
3. **MigrationManager** - Schema versioning
4. **CheckpointManager** - Workflow checkpoints
5. **ExportImportManager** - Project portability

**Totale code reductie: ~65%**

---

## 🔗 Navigation

← [../UserInterfaceLayer/00-OVERVIEW.md](../UserInterfaceLayer/00-OVERVIEW.md) | [Index](../../README.md) | [MCP Integration](../MCP-INTEGRATION.md)
