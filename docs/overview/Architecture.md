# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLI LAYER                                       │
│  bin/agentic.js → src/cli/                                                  │
│  Commands: init, generate, scan, status, config, tools, health, azure       │
├─────────────────────────────────────────────────────────────────────────────┤
│                           BRIDGE LAYER                                       │
│  agents/bridge/ (ESM modules for JS↔TS interoperability)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────┐    ┌───────────────────────────────────────┐ │
│  │   AGENT FRAMEWORK (JS)    │    │      TYPESCRIPT MODULES               │ │
│  │   agents/                 │    │      src/                             │ │
│  │                           │    │                                       │ │
│  │   ┌─────────────────────┐ │    │   ┌─────────────────────────────────┐ │ │
│  │   │ Workflow Engine     │ │    │   │ Azure Module                    │ │ │
│  │   │ - 16 Phases         │ │    │   │ - Context Manager               │ │ │
│  │   │ - Agent Sequencing  │ │    │   │ - Credential Cache (AES-256)   │ │ │
│  │   └─────────────────────┘ │    │   └─────────────────────────────────┘ │ │
│  │                           │    │                                       │ │
│  │   ┌─────────────────────┐ │    │   ┌─────────────────────────────────┐ │ │
│  │   │ Agent Registry      │ │    │   │ MCP Module                      │ │ │
│  │   │ - 15 JS Agents      │ │    │   │ - 20+ Adapters                  │ │ │
│  │   │ - BaseAgent class   │ │    │   │ - Circuit Breaker               │ │ │
│  │   └─────────────────────┘ │    │   │ - Retry Policies                │ │ │
│  │                           │    │   └─────────────────────────────────┘ │ │
│  │   ┌─────────────────────┐ │    │                                       │ │
│  │   │ Message Bus         │ │    │   ┌─────────────────────────────────┐ │ │
│  │   │ - Agent Communication│    │   │ Security Module                 │ │ │
│  │   └─────────────────────┘ │    │   │ - Code Scanner                  │ │ │
│  │                           │    │   │ - Secret Detector               │ │ │
│  │   ┌─────────────────────┐ │    │   │ - Audit Logger                  │ │ │
│  │   │ Self-Learning       │ │    │   └─────────────────────────────────┘ │ │
│  │   │ - Error Classification│   │                                       │ │
│  │   │ - Fix Generation    │ │    │   ┌─────────────────────────────────┐ │ │
│  │   └─────────────────────┘ │    │   │ Config Module                   │ │ │
│  │                           │    │   │ - JSON Schema Validation        │ │ │
│  │   ┌─────────────────────┐ │    │   └─────────────────────────────────┘ │ │
│  │   │ Feedback Loop       │ │    │                                       │ │
│  │   │ - Metrics           │ │    │   ┌─────────────────────────────────┐ │ │
│  │   │ - Decisions         │ │    │   │ State Module                    │ │ │
│  │   └─────────────────────┘ │    │   │ - Artifact Versioning           │ │ │
│  │                           │    │   └─────────────────────────────────┘ │ │
│  │   ┌─────────────────────┐ │    │                                       │ │
│  │   │ Bicep AVM Resolver  │ │    └───────────────────────────────────────┘ │
│  │   │ - 6 Pipeline Stages │ │                                              │
│  │   └─────────────────────┘ │                                              │
│  └───────────────────────────┘                                              │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                        GITHUB COPILOT LAYER                                  │
│  .github/agents/     - 39 Agent Definitions                                 │
│  .github/skills/     - 47 Skill Definitions                                 │
│  .github/scenarios/  - 10 Scenarios                                         │
│  .github/mcp/        - MCP Server Configuration                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                        EXTERNAL SERVICES                                     │
│  Azure SDK │ Azure Retail Prices API │ Resource Graph │ Microsoft Learn    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### Workflow Engine

The **Workflow Engine** orchestrates the 16-phase workflow:

```javascript
// agents/core/WorkflowEngine.js
class WorkflowEngine {
  async executePhase(phaseNumber, context) {
    const phase = this.phases[phaseNumber];
    const agents = phase.agents;
    
    for (const agentId of agents) {
      await this.activateAgent(agentId, context);
    }
    
    return phase.artifacts;
  }
}
```

### Message Bus

**Agent communication** happens via the Message Bus:

```javascript
// agents/core/MessageBus.js
class MessageBus {
  publish(topic, message) {
    this.subscribers[topic]?.forEach(handler => handler(message));
  }
  
  subscribe(topic, handler) {
    this.subscribers[topic] = this.subscribers[topic] || [];
    this.subscribers[topic].push(handler);
  }
}
```

### Self-Learning System

**Error → Analysis → Fix → Apply**:

```
┌─────────────┐    ┌─────────────────┐    ┌──────────────┐
│ ErrorLogger │───►│ AnalysisEngine  │───►│ FixGenerator │
└─────────────┘    └─────────────────┘    └──────┬───────┘
                                                  │
┌─────────────┐    ┌─────────────────┐           │
│ AuditTrail  │◄───│   ApplyEngine   │◄──────────┘
└─────────────┘    └─────────────────┘
```

### Bicep AVM Resolver

**6-stage pipeline** for Azure infrastructure:

```
Stage 1: AVM Registry      - Discover available modules
Stage 2: Resource Analyzer - Analyze resource requirements
Stage 3: Module Mapper     - Map requirements to AVM modules
Stage 4: Template Transform - Generate Bicep templates
Stage 5: Validation        - Validate templates
Stage 6: Optimization      - Optimize for cost/performance
```

### MCP Integration

**Model Context Protocol** adapters:

| Adapter | API | Purpose |
|---------|-----|---------|
| AzurePricingMCPAdapter | Retail Prices API | Cost estimation |
| AzureResourceGraphMCPAdapter | Resource Graph | Resource discovery |
| MicrosoftDocsMCPAdapter | Microsoft Learn | Documentation search |

### Security Module

**Multi-layer security**:

```
┌──────────────────┐
│ Security Scanner │ ─── SQL Injection, XSS, Path Traversal
├──────────────────┤
│ Secret Detector  │ ─── API Keys, Passwords, Tokens
├──────────────────┤
│ Audit Logger     │ ─── Hash-chained audit trail
└──────────────────┘
```

## Data Flow

### Project Generation Flow

```
1. User runs: agentic generate --scenario S03

2. CLI parses command
   └── src/cli/commands/generate.ts

3. Load scenario
   └── .github/scenarios/S03-medium-team-saas.scenario.md

4. Initialize workflow
   └── agents/core/WorkflowEngine.js

5. Execute phases 1-16
   └── Each phase activates relevant agents

6. Collect artifacts
   └── Code, infrastructure, tests, docs

7. Security scan
   └── src/security/

8. Output results
   └── ./generated/
```

### Agent Activation Flow

```
WorkflowEngine
    │
    ├──► AgentRegistry.getAgent('@architect')
    │        │
    │        └──► BaseAgent.execute(context)
    │                 │
    │                 ├──► Load skills
    │                 ├──► Process input
    │                 └──► Generate output
    │
    └──► MessageBus.publish('phase:complete', artifacts)
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| CLI | TypeScript + Commander.js |
| Agent Framework | JavaScript (ES Modules) |
| TypeScript Modules | TypeScript 5.0+ |
| Build | tsc + npm scripts |
| Testing | Jest |
| Azure SDK | @azure/identity, @azure/arm-* |
| MCP | Custom native adapters |

## Next Steps

- [Agent Catalog](../agents/Catalog) - All 39 agents
- [Phase Workflow](../agents/Phases) - 16 phases in detail
- [Self-Learning](../engine/Self-Learning) - Error learning system
