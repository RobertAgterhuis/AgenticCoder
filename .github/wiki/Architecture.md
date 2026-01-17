# Architecture

Technical architecture overview of AgenticCoder.

---

## System Overview

AgenticCoder is a **multi-agent orchestration system** with 26 specialized agents organized in 3 tiers, executing through 16 orchestrated phases.

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER REQUEST                                │
│               (Project Specification + Goals)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ORCHESTRATION TIER                             │
│                   Phases 1-8 (9 agents)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ @plan   │→│ @doc    │→│@backlog │→│@coord   │→ ...          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ARCHITECTURE TIER                              │
│                   Phases 9-12 (4 agents)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │@azure-arch  │→│@bicep-spec  │→│@database    │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  IMPLEMENTATION TIER                             │
│                  Phases 13-16 (13 agents)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Frontend: @react │ @vue │ @angular │ @svelte              │ │
│  │ Backend:  @nodejs │ @dotnet │ @python │ @go │ @java       │ │
│  │ DevOps:   @devops │ @docker                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP SERVERS                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │   Pricing   │ │    Docs     │ │  Resources  │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE SERVICES                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### WorkflowEngine

The central orchestration engine that coordinates agent execution.

```javascript
class WorkflowEngine extends EventEmitter {
  constructor(config) {
    this.registry = new AgentRegistry();
    this.messageBus = new EnhancedMessageBus();
    this.executionTracker = new Map();
  }
  
  async executeWorkflow(definition) {
    // Execute workflow steps sequentially or in parallel
  }
  
  async executeStep(step) {
    // Execute single agent with input/output handling
  }
}
```

**Key Features:**
- Sequential and parallel execution
- Error handling and retry logic
- Execution tracking and metrics
- Event emission for monitoring

### AgentRegistry

Manages agent registration and lookup.

```javascript
class AgentRegistry {
  register(agent) { }
  getAgent(name) { }
  getAllAgents() { }
  getAgentsByTier(tier) { }
  getAgentsByPhase(phase) { }
}
```

### BaseAgent

Abstract base class for all agents.

```javascript
class BaseAgent {
  constructor(name, config) { }
  async execute(input) { }
  validate(input) { }
}
```

### EnhancedMessageBus

Inter-agent communication system.

```javascript
class EnhancedMessageBus extends EventEmitter {
  publish(topic, message) { }
  subscribe(topic, handler) { }
  request(topic, message) { }
}
```

---

## Subsystems

### Self-Learning System

Learns from errors and improves over time.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ ErrorClassifier │────▶│ PatternDetector │────▶│ AnalysisEngine  │
│ (23 categories) │     │                 │     │ (root cause)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ RollbackManager │◀────│  ApplyEngine    │◀────│  FixGenerator   │
│                 │     │ (safe apply)    │     │ (14 strategies) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Components:**
- **ErrorClassifier** - 23 error categories
- **PatternDetector** - Recognizes recurring issues
- **AnalysisEngine** - Root cause analysis
- **FixGenerator** - 14 fix strategies
- **FixValidator** - 5 validation gates
- **ApplyEngine** - Safe fix application
- **AuditTrail** - Change tracking
- **RollbackManager** - Rollback support

### Execution Bridge

Connects workflow engine to external systems.

```
┌───────────────────────────────────────────────────────────────┐
│                     EXECUTION BRIDGE                           │
├───────────────────────────────────────────────────────────────┤
│  TransportSelector  │  Webhook │ Process │ Docker │ MCP      │
├───────────────────────────────────────────────────────────────┤
│  ExecutionContext   │  Manages execution state                │
├───────────────────────────────────────────────────────────────┤
│  AgentInvoker       │  Invokes agents via transport           │
├───────────────────────────────────────────────────────────────┤
│  OutputCollector    │  Collects and processes output          │
├───────────────────────────────────────────────────────────────┤
│  LifecycleManager   │  Full lifecycle orchestration           │
├───────────────────────────────────────────────────────────────┤
│  ResultHandler      │  Retry logic, artifact registry         │
└───────────────────────────────────────────────────────────────┘
```

### Feedback Loop

Continuous improvement system.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│StatusUpdater│────▶│MetricsCol.  │────▶│ResultAggr.  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                  │                    │
       ▼                  ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│PlanUpdater  │◀────│Notification │◀────│DecisionEng. │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Monitoring & Dashboard

Real-time execution monitoring.

```
┌───────────────────────────────────────────────────────────────┐
│                 ORCHESTRATION MONITOR                          │
├───────────────────────────────────────────────────────────────┤
│  OrchestrationMonitor  │  Event collection & state tracking   │
├───────────────────────────────────────────────────────────────┤
│  DashboardGenerator    │  ASCII real-time dashboard           │
├───────────────────────────────────────────────────────────────┤
│  AlertManager          │  Thresholds & notifications          │
├───────────────────────────────────────────────────────────────┤
│  ReportGenerator       │  Status/completion reports           │
└───────────────────────────────────────────────────────────────┘
```

---

## Bicep AVM Resolver

Azure infrastructure generation pipeline.

```
┌───────────────────────────────────────────────────────────────┐
│                    BICEP AVM RESOLVER                          │
├───────────────────────────────────────────────────────────────┤
│  01-avm-registry      │  Azure Verified Module registry       │
├───────────────────────────────────────────────────────────────┤
│  02-resource-analyzer │  Resource requirement analysis        │
├───────────────────────────────────────────────────────────────┤
│  03-module-mapper     │  Map requirements to AVM modules      │
├───────────────────────────────────────────────────────────────┤
│  04-template-transform│  Generate Bicep templates             │
├───────────────────────────────────────────────────────────────┤
│  05-validation-engine │  Validate generated templates         │
├───────────────────────────────────────────────────────────────┤
│  06-optimization-eng. │  Optimize for cost/performance        │
└───────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Request Processing

```
1. User Input
   │
   ▼
2. @plan Agent (Phase 1)
   ├── Parse requirements
   ├── Select scenario
   └── Create execution plan
   │
   ▼
3. Orchestration Phases (2-8)
   ├── Documentation
   ├── Backlog creation
   ├── QA strategy
   └── Architecture design
   │
   ▼
4. Architecture Phases (9-12)
   ├── Azure architecture
   ├── Bicep generation
   └── Database design
   │
   ▼
5. Implementation Phases (13-16)
   ├── Frontend code
   ├── Backend code
   ├── CI/CD pipelines
   └── Final report
   │
   ▼
6. Output Artifacts
   ├── Source code
   ├── Infrastructure
   ├── Documentation
   └── Tests
```

### Inter-Agent Communication

```javascript
// Agent A publishes result
messageBus.publish('phase-complete', {
  agent: 'architect',
  phase: 7,
  artifacts: [/* ... */]
});

// Agent B subscribes
messageBus.subscribe('phase-complete', (msg) => {
  if (msg.phase === 7) {
    // Start phase 8
  }
});
```

---

## MCP Integration

AgenticCoder uses a **TypeScript MCP integration layer** (`src/mcp/`) that provides unified, reliable access to MCP servers.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│               JavaScript Agents (agents/core/)                   │
│                                                                  │
│  WorkflowEngine │ BaseAgent │ TaskExtractionAgent               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ require()
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCPBridge (bridge.ts)                         │
│   - Simplified API for JS agents                                 │
│   - Convenience methods for Azure pricing, resources, docs       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MCPGateway (integration/)                      │
│   - Unified entry point                                          │
│   - Server discovery and registration                            │
│   - Tool routing                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                MCPClientManager (core/)                          │
│   - Connection pooling                                           │
│   - Server lifecycle management                                  │
│   - Request/response handling                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Health Monitoring (health/)                      │
│   - CircuitBreaker (38 tests)                                    │
│   - RetryPolicy (exponential backoff)                            │
│   - HealthMonitor (periodic checks)                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                Transport Layer (transport/)                      │
│   - NativeTransport (direct HTTP)                                │
│   - StdioTransport (subprocess)                                  │
│   - SSETransport (streaming)                                     │
│   - HTTPTransport (REST APIs)                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    ▼                       ▼                       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Native TS  │     │Official MCP │     │External MCP │
│  Adapters   │     │ (GitHub,    │     │ (Custom)    │
│  (Azure)    │     │  Docker...) │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Server Adapters

| Category | Adapters | Transport |
|----------|----------|-----------|
| **Azure** | AzurePricingMCPAdapter, AzureResourceGraphMCPAdapter, MicrosoftDocsMCPAdapter | Native (direct HTTP) |
| **Official** | GitHub, Filesystem, Git, Fetch, Puppeteer, Memory, SQLite, Sequential | Stdio |
| **Deployment** | Docker, Kubernetes, AzureDevOps, GitHub Actions | HTTP/Stdio |
| **Security** | Semgrep, Trivy, OWASP Dependency Check | Stdio |
| **Data** | PostgreSQL, MongoDB, Redis | HTTP |
| **Testing** | Playwright | Stdio |

### Key Features

**Reliability:**
- **Circuit Breaker** - Prevents cascading failures
- **Retry Policy** - Exponential backoff with jitter
- **Health Monitoring** - Periodic health checks

**Performance:**
- **Connection Pooling** - Reuse connections
- **Request Caching** - Cache repeated queries
- **Parallel Execution** - Multi-server queries

**Observability:**
- **Metrics Collection** - Latency, error rates
- **Event Emission** - Real-time monitoring
- **Logging** - Structured logs

### Usage Example

```typescript
import { MCPBridge } from './src/mcp/bridge';

const bridge = new MCPBridge();
await bridge.initialize();

// Azure pricing
const price = await bridge.getAzurePrice('Standard_B2s', 'westeurope');

// Resource discovery
const vms = await bridge.listResourcesByType('Microsoft.Compute/virtualMachines');

// Documentation
const docs = await bridge.getAzureBestPractices('security');

await bridge.disconnect();
```

---

## Scalability

### Horizontal Scaling

- Stateless agent execution
- Message queue for distribution
- Independent MCP servers

### Performance Optimizations

- Parallel phase execution
- Caching for repeated queries
- Streaming artifact generation

---

## Security

### Authentication

- Azure AD for cloud access
- JWT for API endpoints
- Secret management via environment variables

### Data Protection

- No sensitive data stored
- Encrypted communication
- Audit logging

---

<p align="center">
  <a href="Developer-Guide">← Developer Guide</a> | <a href="API-Reference">API Reference →</a>
</p>
