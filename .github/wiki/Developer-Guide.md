# Developer Guide

Guide for developers who want to contribute to AgenticCoder or extend its functionality.

---

## 📋 Table of Contents

1. [Development Environment](#development-environment)
2. [Project Architecture](#project-architecture)
3. [Code Standards](#code-standards)
4. [Testing](#testing)
5. [Creating Agents](#creating-agents)
6. [Creating Skills](#creating-skills)
7. [MCP Server Development](#mcp-server-development)
8. [Debugging](#debugging)

---

## Development Environment

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| npm | 8+ | Package management |
| Git | Latest | Version control |
| VS Code | Latest | IDE (recommended) |
| Docker | Latest | Container development |
| Azure CLI | Latest | Azure integration |

### Setup

```bash
# Clone repository
git clone https://github.com/YOUR-ORG/AgenticCoder.git
cd AgenticCoder

# Install dependencies
cd agents && npm install

# Verify setup
npm test
```

### VS Code Configuration

Recommended extensions:
- ESLint
- Prettier
- GitLens
- GitHub Copilot
- Docker

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## Project Architecture

### Directory Structure

```
AgenticCoder/
├── agents/                      # 🤖 Agent Framework
│   ├── core/                    # Core orchestration
│   │   ├── BaseAgent.js         # Base agent class
│   │   ├── AgentRegistry.js     # Agent registration
│   │   ├── WorkflowEngine.js    # Orchestration engine
│   │   ├── EnhancedMessageBus.js # Inter-agent communication
│   │   ├── execution/           # Execution bridge
│   │   ├── feedback/            # Feedback loop system
│   │   ├── orchestration/       # Monitoring & dashboards
│   │   └── self-learning/       # Error learning
│   ├── bicep-avm-resolver/      # Azure Bicep AVM pipeline
│   │   ├── 01-avm-registry/     # AVM module registry
│   │   ├── 02-resource-analyzer/# Resource analysis
│   │   ├── 03-module-mapper/    # Module mapping
│   │   ├── 04-template-transformer/ # Template generation
│   │   ├── 05-validation-engine/# Validation
│   │   └── 06-optimization-engine/ # Optimization
│   ├── task/                    # Task extraction engine
│   │   └── dependency-resolver/ # Dependency resolution
│   ├── validation/              # Validation framework
│   │   └── validators/          # Individual validators
│   ├── infrastructure/          # Infrastructure agents
│   └── test/                    # Test files
│
├── servers/                     # 🔌 MCP Servers
│   ├── mcp-azure-pricing/       # Azure pricing queries
│   ├── mcp-azure-docs/          # Azure documentation
│   └── mcp-azure-resource-graph/# Resource graph queries
│
├── .github/                     # 📋 GitHub Configuration
│   ├── agents/                  # Agent definition files
│   ├── skills/                  # Skill definition files
│   ├── scenarios/               # Test scenarios
│   └── schemas/                 # JSON schemas
│
└── Files/                       # 📚 Documentation
    └── AgenticCoderPlan/        # Implementation plans
```

### Core Components

#### WorkflowEngine

Central orchestration engine that executes agent workflows.

```javascript
// agents/core/WorkflowEngine.js
class WorkflowEngine extends EventEmitter {
  constructor(config) {
    this.registry = new AgentRegistry();
    this.messageBus = new EnhancedMessageBus();
    this.executionTracker = new Map();
  }
  
  async executeWorkflow(workflowDefinition) {
    // Orchestrates multi-step agent execution
  }
  
  async executeStep(step) {
    // Executes a single agent step
  }
}
```

#### BaseAgent

Abstract base class for all agents.

```javascript
// agents/core/BaseAgent.js
class BaseAgent {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }
  
  async execute(input) {
    // Override in subclass
    throw new Error('Must implement execute()');
  }
  
  validate(input) {
    // Input validation
  }
}
```

#### Self-Learning System

Learns from errors and generates fixes.

```javascript
// agents/core/self-learning/
├── ErrorClassifier.js      # 23 error categories
├── PatternDetector.js      # Pattern recognition
├── AnalysisEngine.js       # Root cause analysis
├── FixGenerator.js         # 14 fix strategies
├── FixValidator.js         # 5 validation gates
├── ApplyEngine.js          # Safe fix application
├── AuditTrail.js           # Integrity tracking
└── RollbackManager.js      # Rollback support
```

---

## Code Standards

### JavaScript/Node.js Style

```javascript
// ✅ Good - ES Modules
import { EventEmitter } from 'events';
import fs from 'fs/promises';

// ✅ Good - Async/await
async function processTask(task) {
  const result = await executeTask(task);
  return result;
}

// ✅ Good - Descriptive names
const calculateDependencyDepth = (graph, nodeId) => {
  // Implementation
};

// ❌ Bad - var, callbacks, single letters
var x = require('fs');
function f(cb) { cb(null, result); }
```

### Documentation

```javascript
/**
 * Executes a workflow step with the specified agent.
 * 
 * @param {Object} step - Step configuration
 * @param {string} step.agent - Agent name
 * @param {Object} step.input - Agent input
 * @param {Object} [step.options] - Optional settings
 * @returns {Promise<StepResult>} Step execution result
 * @throws {AgentNotFoundError} If agent doesn't exist
 * 
 * @example
 * const result = await engine.executeStep({
 *   agent: 'task-extraction',
 *   input: { description: 'Build a todo app' }
 * });
 */
async executeStep(step) {
  // Implementation
}
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new agent for Vue.js support
fix: resolve circular dependency in task resolver
docs: update API reference for WorkflowEngine
test: add integration tests for feedback loop
refactor: simplify error classification logic
```

---

## Testing

### Test Structure

```
agents/test/
├── core.test.js           # Core components
├── execution.test.js      # Execution bridge
├── feedback.test.js       # Feedback loop
├── self-learning.test.js  # Self-learning system
├── orchestration.test.js  # Monitoring
└── scenarios/
    ├── S01.test.js        # Scenario tests
    └── S02.test.js
```

### Running Tests

```bash
cd agents

# Run all tests
npm test

# Run specific test file
npm test -- --grep "WorkflowEngine"

# Run with coverage
npm run test:coverage

# Run Azure-enabled tests
AGENTICCODER_TEST_AZURE_MCP_SCHEMA=1 npm test

# Watch mode
npm test -- --watch
```

### Writing Tests

```javascript
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { WorkflowEngine } from '../core/WorkflowEngine.js';

describe('WorkflowEngine', () => {
  let engine;
  
  beforeEach(() => {
    engine = new WorkflowEngine({ timeout: 5000 });
  });
  
  describe('executeStep', () => {
    it('should execute a valid step', async () => {
      const result = await engine.executeStep({
        agent: 'task-extraction',
        input: { description: 'Test task' }
      });
      
      assert.strictEqual(result.status, 'completed');
      assert.ok(result.output);
    });
    
    it('should throw for unknown agent', async () => {
      await assert.rejects(
        engine.executeStep({ agent: 'unknown' }),
        { name: 'AgentNotFoundError' }
      );
    });
  });
});
```

---

## Creating Agents

### Step 1: Create Agent Definition

Create `.github/agents/@my-agent.agent.md`:

```markdown
# @my-agent Agent (Phase X)

**Agent ID**: `@my-agent`
**Version**: 1.0.0
**Phase**: X

## Purpose

Describe what this agent does.

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectSpec": { "type": "object" },
    "options": { "type": "object" }
  },
  "required": ["projectSpec"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "result": { "type": "object" },
    "artifacts": { "type": "array" }
  }
}
```

## Dependencies

- Requires: @previous-agent
- Provides to: @next-agent
```

### Step 2: Implement Agent Class

Create `agents/my-category/MyAgent.js`:

```javascript
import { BaseAgent } from '../core/BaseAgent.js';

export class MyAgent extends BaseAgent {
  constructor(config = {}) {
    super('my-agent', config);
    this.version = '1.0.0';
  }
  
  async execute(input) {
    // Validate input
    this.validate(input);
    
    // Process
    const result = await this.process(input);
    
    // Return standardized output
    return {
      status: 'completed',
      output: result,
      artifacts: [],
      metrics: {
        duration: Date.now() - startTime
      }
    };
  }
  
  async process(input) {
    // Your agent logic here
  }
}
```

### Step 3: Register Agent

Add to `agents/core/AgentRegistry.js`:

```javascript
import { MyAgent } from '../my-category/MyAgent.js';

// In initialization
registry.register(new MyAgent());
```

### Step 4: Add Tests

Create `agents/test/my-agent.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MyAgent } from '../my-category/MyAgent.js';

describe('MyAgent', () => {
  it('should process valid input', async () => {
    const agent = new MyAgent();
    const result = await agent.execute({
      projectSpec: { name: 'test' }
    });
    
    assert.strictEqual(result.status, 'completed');
  });
});
```

---

## Creating Skills

### Step 1: Create Skill Definition

Create `.github/skills/my-skill.skill.md`:

```markdown
# my-skill

Reusable capability for [purpose].

## Usage

Used by agents: @agent1, @agent2

## Input

- `context`: Project context
- `options`: Configuration options

## Output

- `recommendations`: Array of recommendations
- `score`: Quality score (0-100)
```

### Step 2: Implement Skill

```javascript
// agents/skills/my-skill.js
export class MySkill {
  constructor(config = {}) {
    this.config = config;
  }
  
  async apply(context, options = {}) {
    // Skill logic
    return {
      recommendations: [],
      score: 85
    };
  }
}
```

---

## MCP Server Development

AgenticCoder uses a **TypeScript MCP integration layer** that provides unified access to multiple MCP servers.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MCPBridge (JS Integration)                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      MCPGateway                              │
│  - Unified entry point for all MCP operations               │
│  - Automatic server discovery and registration              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   MCPClientManager                           │
│  - Connection pooling                                        │
│  - Circuit breaker & retry policies                          │
│  - Health monitoring                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Transport Layer                             │
│  Stdio │ SSE │ HTTP │ WebSocket │ Native                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Azure Services                            │
│  Retail Prices API │ Resource Graph API │ Learn Search API  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/mcp/
├── core/                    # Core components
│   ├── MCPClientManager.ts  # Connection management
│   ├── MCPConnectionPool.ts # Connection pooling
│   ├── MCPServerRegistry.ts # Server definitions
│   └── MCPServiceRegistry.ts # Service discovery
├── transport/               # Transport implementations
│   ├── BaseTransport.ts     # Abstract base
│   ├── StdioTransport.ts    # Stdio transport
│   ├── SSETransport.ts      # Server-sent events
│   └── HTTPTransport.ts     # HTTP REST
├── servers/                 # Server adapters
│   └── azure/               # Native Azure adapters
│       ├── AzurePricingMCPAdapter.ts       # Azure Retail Prices API
│       ├── AzureResourceGraphMCPAdapter.ts # Azure REST API
│       ├── MicrosoftDocsMCPAdapter.ts      # Microsoft Learn API
│       └── __tests__/       # Unit tests
├── health/                  # Reliability
│   ├── CircuitBreaker.ts    # Circuit breaker pattern
│   ├── RetryPolicy.ts       # Retry strategies
│   └── HealthMonitor.ts     # Health checks
├── integration/             # Gateway
│   └── MCPGateway.ts        # Unified entry point
└── bridge.ts                # JS agent integration
```

### Creating a Server Adapter

```typescript
// src/mcp/servers/custom/MyServiceAdapter.ts
import { BaseMCPServerAdapter } from '../BaseMCPServerAdapter';
import { MCPServerDefinition, ToolCallResponse } from '../../types';
import { Logger } from '../../utils/Logger';

export interface MyResult {
  status: string;
  data: unknown;
}

export class MyServiceAdapter extends BaseMCPServerAdapter {
  private logger: Logger;

  constructor(config?: { timeout?: number }) {
    super();
    this.logger = new Logger('MyServiceAdapter');
  }

  getServerId(): string {
    return 'my-service-mcp';
  }

  getDefinition(): MCPServerDefinition {
    return {
      id: 'my-service-mcp',
      name: 'My Service MCP',
      description: 'Custom MCP server',
      category: 'custom',
      transport: 'native',  // Use 'native' for direct HTTP
      enabled: true,
    };
  }

  async myTool(query: string): Promise<ToolCallResponse<MyResult>> {
    // Implement direct HTTP call to your API
    const response = await fetch('https://api.example.com/query', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    return await response.json();
  }
}
```

### Using MCPBridge (JavaScript Integration)

```javascript
// From JavaScript agents
const { MCPBridge } = require('./src/mcp/bridge');

const bridge = new MCPBridge({ 
  workspaceFolder: process.cwd(),
  defaultSubscriptionId: process.env.AZURE_SUBSCRIPTION_ID
});
await bridge.initialize();

// Call any registered tool
const result = await bridge.callTool(
  'azure-pricing-mcp', 
  'price_search', 
  { sku: 'Standard_B2s' }
);

// Use convenience methods
const price = await bridge.getAzurePrice('Standard_B2s', 'westeurope');
const resources = await bridge.listResourcesByType('Microsoft.Compute/virtualMachines');
const docs = await bridge.getAzureBestPractices('security');

// Cleanup
await bridge.disconnect();
```

---

## Debugging

### Enable Debug Logging

```bash
# Environment variable
DEBUG=agenticcoder:* npm start

# Or in code
process.env.AGENTICCODER_LOG_LEVEL = 'debug';
```

### VS Code Debugging

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/agents/node_modules/.bin/node",
      "args": ["--test", "${workspaceFolder}/agents/test/"],
      "cwd": "${workspaceFolder}/agents"
    }
  ]
}
```

### Common Issues

**Agent not found:**
```javascript
// Check registration
console.log(registry.getAllAgents().map(a => a.name));
```

**Circular dependency:**
```javascript
// Use dependency resolver
const detector = new CircularDetector();
const cycles = detector.findCycles(graph);
```

---

## ⏭️ Next Steps

- **[Architecture](Architecture)** - Deep dive into system design
- **[API Reference](API-Reference)** - Complete API documentation
- **[Contributing](Contributing)** - Contribution guidelines

---

<p align="center">
  <a href="User-Guide">← User Guide</a> | <a href="Architecture">Architecture →</a>
</p>
