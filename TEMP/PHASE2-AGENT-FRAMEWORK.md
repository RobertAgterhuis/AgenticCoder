# AgenticCoder Phase 2: Agent Integration

## Overview
Phase 2 implements the core agent framework with workflow orchestration capabilities. This document provides setup instructions and architecture overview for the agent system.

## What We Built

### Core Components

1. **BaseAgent** (`agents/core/BaseAgent.js`)
   - Abstract base class for all agents
   - Lifecycle management (initialize → execute → cleanup)
   - Input/output validation using JSON Schema (AJV)
   - Retry logic with exponential backoff
   - Timeout protection
   - Event emission for observability
   - Execution history tracking

2. **AgentRegistry** (`agents/core/AgentRegistry.js`)
   - Agent discovery and registration
   - Type-based agent lookup
   - Dependency resolution (topological sort)
   - Circular dependency detection
   - Registry statistics

3. **WorkflowEngine** (`agents/core/WorkflowEngine.js`)
   - Multi-agent workflow orchestration
   - Dependency graph execution
   - Conditional step execution
   - Error handling strategies (stop/continue/retry)
   - Output aggregation from multiple steps
   - Workflow execution tracking

### Implemented Agents

1. **TaskExtractionAgent** (`agents/task/TaskExtractionAgent.js`)
   - Parses natural language requests into structured tasks
   - Extracts intent, entities, and requirements
   - Pattern matching for Azure operations (create, update, delete, analyze, migrate)
   - Identifies Azure services, regions, SKUs, and constraints

2. **ResourceAnalyzerAgent** (`agents/infrastructure/ResourceAnalyzerAgent.js`)
   - Analyzes required Azure resources for tasks
   - Determines resource types, SKUs, and configurations
   - Builds resource dependency graph
   - Generates architecture recommendations
   - Integrates with Azure Resource Graph MCP server

3. **CostEstimatorAgent** (`agents/infrastructure/CostEstimatorAgent.js`)
   - Estimates Azure resource costs
   - Integrates with Azure Pricing MCP server
   - Calculates costs by timeframe (hourly/daily/monthly/yearly)
   - Provides cost optimization recommendations
   - Reserved instance savings suggestions

### JSON Schemas

1. **agent.schema.json** - Agent definition structure
2. **workflow.schema.json** - Workflow definition structure
3. **message.schema.json** - Inter-agent message format

### Example Workflow

**azure-deployment.workflow.json** demonstrates:
- Multi-step workflow (task extraction → resource analysis → cost estimation → validation)
- Step dependencies (`dependsOn`)
- Conditional execution (`condition`)
- Error handling strategies
- Output aggregation

## Installation

```powershell
cd d:\repositories\AgenticCoder\agents
npm install
```

### Dependencies

- **ajv** (^8.12.0) - JSON Schema validator
- **ajv-formats** (^2.1.1) - Additional validation formats
- **uuid** (^9.0.1) - Unique ID generation

## Running the Example

### Simple Workflow Demo

```powershell
cd d:\repositories\AgenticCoder\agents
npm start
```

This executes `examples/simple-workflow.js`, which:
1. Registers 3 agents (TaskExtraction, ResourceAnalyzer, CostEstimator)
2. Defines a 3-step workflow
3. Executes workflow with sample user request
4. Displays results (tasks, resources, cost estimate)

### Expected Output

```
=== AgenticCoder Agent Framework Demo ===

Registering agents...
Registered agent: task-extraction (Task Extraction Agent v1.0.0)
Registered agent: resource-analyzer (Resource Analyzer Agent v1.0.0)
Registered agent: cost-estimator (Cost Estimator Agent v1.0.0)
Registered 3 agents

Executing workflow...

=== Workflow Results ===
Status: completed
Duration: XXXms

Extracted Tasks: 1
Identified Resources: 4
Estimated Monthly Cost: $XX.XX

=== Cost Breakdown ===
  Microsoft.Web/sites (Y1): $X.XX
  Microsoft.Storage/storageAccounts (Standard_LRS): $X.XX
  ...
```

## Running Tests

```powershell
cd d:\repositories\AgenticCoder\agents
npm test
```

### Test Coverage

- **BaseAgent.test.js** (8 tests)
  - Agent creation and initialization
  - Input/output validation
  - Execution with retry logic
  - Timeout handling
  - Execution history tracking

- **AgentRegistry.test.js** (8 tests)
  - Agent registration/unregistration
  - Type-based lookup
  - Dependency resolution
  - Circular dependency detection
  - Registry statistics

Total: **16 tests**

## Architecture

### Agent Lifecycle

```
idle → initialize → ready → execute → ready
                           ↓ (error)
                         error → cleanup → stopped
```

### Workflow Execution Flow

1. **Build Execution Order** - Topological sort of steps based on `dependsOn`
2. **For Each Step**:
   - Evaluate condition (skip if false)
   - Wait for dependencies
   - Prepare inputs (resolve `$steps.X.output.Y` references)
   - Execute agent with retry logic
   - Handle errors based on strategy
3. **Aggregate Outputs** - Collect outputs from completed steps

### Input/Output Resolution

Workflows support dynamic input resolution:

```json
{
  "inputs": {
    "tasks": "$steps.extract-tasks.output.tasks",
    "region": "$input.region"
  }
}
```

- `$input.X` - Initial workflow inputs
- `$steps.stepId.output.X` - Output from previous step

## Agent Development Guide

### Creating a New Agent

1. **Extend BaseAgent**

```javascript
import { BaseAgent } from '../core/BaseAgent.js';

export class MyAgent extends BaseAgent {
  constructor() {
    const definition = {
      id: 'my-agent',
      name: 'My Agent',
      version: '1.0.0',
      type: 'task', // task | infrastructure | application | validation | orchestration
      inputs: { /* JSON Schema */ },
      outputs: { /* JSON Schema */ },
      mcpServers: [
        { name: 'azure-pricing', endpoint: 'http://localhost:3001' }
      ],
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000
      }
    };
    super(definition);
  }

  async _onExecute(input, context, executionId) {
    // Your agent logic here
    return { result: 'success' };
  }
}
```

2. **Register Agent**

```javascript
import { AgentRegistry } from './core/AgentRegistry.js';
const registry = new AgentRegistry();
const agent = new MyAgent();
await agent.initialize();
registry.register(agent);
```

3. **Use in Workflow**

```json
{
  "steps": [
    {
      "id": "my-step",
      "agentId": "my-agent",
      "inputs": { /* ... */ }
    }
  ]
}
```

## MCP Server Integration

Agents can connect to MCP servers defined in their `mcpServers` array:

```javascript
const definition = {
  mcpServers: [
    { name: 'azure-pricing', endpoint: 'http://localhost:3001' },
    { name: 'azure-resource-graph', endpoint: 'http://localhost:3002' }
  ]
};
```

BaseAgent automatically connects during initialization. Access via:

```javascript
const pricingClient = this.mcpClients.get('azure-pricing');
await pricingClient.call('getPrices', { serviceName: 'Virtual Machines' });
```

## Event System

BaseAgent emits events for observability:

```javascript
agent.on('lifecycle', (data) => {
  console.log(`Agent ${data.agentId} - ${data.phase}`);
});

agent.on('execution', (data) => {
  console.log(`Execution ${data.executionId} completed in ${data.duration}ms`);
});

agent.on('error', (data) => {
  console.error(`Agent ${data.agentId} error:`, data.error);
});

agent.on('retry', (data) => {
  console.warn(`Retrying attempt ${data.attempt} after ${data.backoffMs}ms`);
});
```

## Error Handling

### Agent-Level

- **Validation Errors** - Input/output schema violations
- **Timeout Errors** - Execution exceeds timeout
- **Execution Errors** - Agent logic failures

Retry logic automatically handles transient failures.

### Workflow-Level

Error strategies:
- **stop** - Abort workflow immediately
- **continue** - Skip failed step, continue workflow
- **retry** - Retry step according to retry policy

```json
{
  "onError": "stop",
  "retry": {
    "maxRetries": 3,
    "backoffMs": 1000
  }
}
```

## Next Steps

### Phase 2 Remaining Tasks

1. **Additional Agents**
   - DeploymentPlannerAgent (generates Bicep/ARM templates)
   - ValidationAgent (validates configurations)
   - More task-specific agents

2. **Agent Communication**
   - Message bus implementation
   - Pub/sub for agent coordination
   - Event-driven architecture

3. **MCP Integration**
   - Real MCP client SDK integration
   - Connection pooling
   - Error handling and retries

4. **Workflow Features**
   - Parallel step execution
   - Sub-workflows
   - Workflow versioning
   - Workflow templates

5. **Observability**
   - Structured logging
   - Metrics collection
   - Distributed tracing
   - Performance monitoring

6. **Testing**
   - Integration tests
   - Workflow tests
   - End-to-end scenarios
   - Performance tests

## Troubleshooting

### Agent Won't Initialize

Check:
- Definition has required fields (id, name, version, type)
- MCP server endpoints are accessible
- No syntax errors in _onInitialize

### Validation Errors

Check:
- Input matches JSON Schema in agent definition
- Required fields are present
- Data types are correct

### Workflow Fails

Check:
- All referenced agents are registered
- Step dependencies form valid DAG (no cycles)
- Input references point to existing steps
- Error handling strategy is appropriate

## Resources

- [Agent Schema](../schemas/agent.schema.json)
- [Workflow Schema](../schemas/workflow.schema.json)
- [Message Schema](../schemas/message.schema.json)
- [Example Workflow](../workflows/azure-deployment.workflow.json)
- [Phase 1 Setup Guide](../PHASE1-SETUP-GUIDE.md)
