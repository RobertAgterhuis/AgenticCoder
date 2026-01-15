# AgenticCoder - Agent System Core

This directory contains the core agent framework for AgenticCoder Enhanced.

## Structure

```
agents/
├── core/
│   ├── BaseAgent.js          # Base agent class
│   ├── AgentRegistry.js      # Agent registration and discovery
│   └── AgentExecutor.js      # Agent execution engine
├── task/
│   ├── TaskExtractionAgent.js
│   └── TaskValidationAgent.js
├── infrastructure/
│   ├── ResourceAnalyzerAgent.js
│   ├── CostEstimatorAgent.js
│   └── DeploymentPlannerAgent.js
└── validation/
    └── ValidationAgent.js

schemas/
├── agent.schema.json         # Agent definition schema
├── workflow.schema.json      # Workflow definition schema
└── message.schema.json       # Inter-agent message schema

workflows/
├── WorkflowEngine.js         # Workflow orchestrator
├── WorkflowExecutor.js       # Workflow execution runtime
└── WorkflowValidator.js      # Workflow validation

tests/
└── agents/
    ├── BaseAgent.test.js
    └── workflow.test.js
```

## Quick Start

```javascript
import { TaskExtractionAgent } from './agents/task/TaskExtractionAgent.js';

const agent = new TaskExtractionAgent();
const result = await agent.execute({
  input: 'Deploy a 3-tier web app to Azure with SQL database'
});
```

## Agent Lifecycle

1. **Initialize** - Agent loads configuration and connects to MCP servers
2. **Validate** - Input validation against schema
3. **Execute** - Core agent logic runs
4. **Output** - Structured output with metadata
5. **Cleanup** - Resources released
