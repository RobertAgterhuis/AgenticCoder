# Agent Workflow Visualization

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  (CLI, Web UI, VS Code Extension, API Gateway)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Workflow Orchestration Layer                   │
│ ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│ │ WorkflowEngine  │  │  AgentRegistry   │  │   Message Bus   │ │
│ │ - Execute       │←→│  - Discovery     │←→│   - Pub/Sub     │ │
│ │ - Dependencies  │  │  - Validation    │  │   - Routing     │ │
│ │ - Error Handle  │  │  - Lifecycle     │  │   - Events      │ │
│ └─────────────────┘  └──────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Layer                               │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │ TaskExtraction   │ Parse user request → structured tasks     │
│  │  Agent           │ (NLP, pattern matching)                   │
│  └──────────────────┘                                           │
│           │                                                      │
│           ↓                                                      │
│  ┌──────────────────┐                                           │
│  │ ResourceAnalyzer │ Analyze required Azure resources          │
│  │  Agent           │ (types, SKUs, dependencies)               │
│  └──────────────────┘                                           │
│           │                                                      │
│           ↓                                                      │
│  ┌──────────────────┐                                           │
│  │  CostEstimator   │ Calculate deployment costs                │
│  │  Agent           │ (pricing, optimization)                   │
│  └──────────────────┘                                           │
│           │                                                      │
│           ↓                                                      │
│  ┌──────────────────┐                                           │
│  │ DeploymentPlanner│ Generate Bicep/ARM templates              │
│  │  Agent           │ (IaC generation)                          │
│  └──────────────────┘                                           │
│           │                                                      │
│           ↓                                                      │
│  ┌──────────────────┐                                           │
│  │   Validation     │ Validate configurations                   │
│  │   Agent          │ (security, compliance, best practices)    │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MCP Server Layer                            │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Azure Pricing   │  │ Resource Graph   │  │  Azure Docs  │ │
│  │  (Port 3001)     │  │  (Port 3002)     │  │  (Port 3003) │ │
│  │                  │  │                  │  │              │ │
│  │ - Retail Prices  │  │ - KQL Queries    │  │ - Search API │ │
│  │ - Caching        │  │ - Multi-sub      │  │ - Facets     │ │
│  │ - Rate Limiting  │  │ - Azure Auth     │  │ - Caching    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Services                              │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Retail Prices    │  │  Resource Graph  │  │ Microsoft    │ │
│  │ API              │  │  Service         │  │ Learn        │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Azure Resource Manager (ARM)                    │  │
│  │  VMs | Storage | Functions | Networking | ...           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Typical Workflow Execution

```
User Request: "Deploy Azure Function with storage in West Europe"
    │
    ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 1: Task Extraction                                       │
│ ┌────────────┐                                                │
│ │   Input    │ userRequest: "Deploy Azure Function..."       │
│ └────────────┘                                                │
│       ↓                                                        │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ TaskExtractionAgent                                    │   │
│ │ - Parse request                                        │   │
│ │ - Extract intent: action=create, target=function       │   │
│ │ - Extract entities: region=westeurope                  │   │
│ │ - Identify requirements: storage, deployment           │   │
│ └────────────────────────────────────────────────────────┘   │
│       ↓                                                        │
│ ┌────────────┐                                                │
│ │  Output    │ tasks: [{ type: 'deployment', ... }]          │
│ │            │ intent: { action: 'create', target: ... }     │
│ │            │ confidence: 0.85                               │
│ └────────────┘                                                │
└───────────────────────────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 2: Resource Analysis                                     │
│ ┌────────────┐                                                │
│ │   Input    │ tasks: [...], constraints: { region: ... }    │
│ └────────────┘                                                │
│       ↓                                                        │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ResourceAnalyzerAgent                                  │   │
│ │ - Map tasks to Azure resources                        │   │
│ │ - Determine SKUs: Function (Y1), Storage (Standard)   │   │
│ │ - Build dependency graph                              │   │
│ │ - Generate recommendations                            │   │
│ └────────────────────────────────────────────────────────┘   │
│       ↓                                                        │
│ ┌────────────┐                                                │
│ │  Output    │ resources: [                                   │
│ │            │   { type: 'Function', sku: 'Y1', ... },       │
│ │            │   { type: 'Storage', sku: 'Standard_LRS' }    │
│ │            │ ]                                              │
│ │            │ resourceGraph: { nodes: [...], edges: [...] } │
│ └────────────┘                                                │
└───────────────────────────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────────────────────────┐
│ Step 3: Cost Estimation                                       │
│ ┌────────────┐                                                │
│ │   Input    │ resources: [...], timeframe: 'monthly'        │
│ └────────────┘                                                │
│       ↓                                                        │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ CostEstimatorAgent                                     │   │
│ │ - Query Azure Pricing API (via MCP server)            │   │
│ │ - Calculate per-resource costs                        │   │
│ │ - Aggregate total cost                                │   │
│ │ - Generate optimization recommendations               │   │
│ └────────────────────────────────────────────────────────┘   │
│       ↓                                                        │
│ ┌────────────┐                                                │
│ │  Output    │ totalCost: 24.50 USD/month                     │
│ │            │ breakdown: [                                   │
│ │            │   { resource: 'Function', cost: 0.20 },       │
│ │            │   { resource: 'Storage', cost: 1.84 }         │
│ │            │ ]                                              │
│ │            │ recommendations: [                             │
│ │            │   "Consider Reserved Instances...",           │
│ │            │   "Enable cost alerts..."                     │
│ │            │ ]                                              │
│ └────────────┘                                                │
└───────────────────────────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────────────────────────┐
│ Final Result                                                  │
│ ┌───────────────────────────────────────────────────────┐    │
│ │ Status: completed                                     │    │
│ │ Duration: 1,234 ms                                    │    │
│ │                                                       │    │
│ │ Tasks Extracted: 1                                    │    │
│ │ Resources Identified: 2                               │    │
│ │ Estimated Cost: $24.50/month                          │    │
│ │                                                       │    │
│ │ Next Steps:                                           │    │
│ │   1. Review resource configurations                   │    │
│ │   2. Approve deployment plan                          │    │
│ │   3. Execute deployment                               │    │
│ └───────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## Agent Lifecycle

```
┌─────────────┐
│    idle     │ Initial state
└─────────────┘
      │
      ↓ initialize()
┌─────────────┐
│initializing │ Connect MCP servers, load resources
└─────────────┘
      │
      ↓ _onInitialize()
┌─────────────┐
│   ready     │ Waiting for execution
└─────────────┘
      │
      ↓ execute(input)
┌─────────────┐
│ executing   │ Running agent logic with retry/timeout
└─────────────┘
      │
      ├─→ Success ──→ ready (can execute again)
      │
      ├─→ Timeout ──→ error
      │
      └─→ Failure ──→ retry (up to maxRetries) → error
                                                    │
                                                    ↓ cleanup()
                                              ┌─────────────┐
                                              │  stopped    │
                                              └─────────────┘
```

## Workflow Step Dependencies

Example: Azure Deployment Workflow

```
extract-tasks (TaskExtractionAgent)
      │
      ↓
analyze-resources (ResourceAnalyzerAgent)
      │
      ├──────────────────┐
      ↓                  ↓
estimate-costs     generate-plan
(CostEstimatorAgent) (DeploymentPlannerAgent)
      │                  │
      └────────┬─────────┘
               ↓
        validate-deployment
        (ValidationAgent)
               │
               ↓
           deploy
        (Deployment)
```

## Event Flow

```
WorkflowEngine.execute()
    │
    ├─→ emit('workflow:start')
    │
    ├─→ For each step:
    │   │
    │   ├─→ emit('step:start')
    │   │
    │   ├─→ Agent.execute()
    │   │   │
    │   │   ├─→ emit('lifecycle', { phase: 'execute' })
    │   │   │
    │   │   ├─→ _onExecute()
    │   │   │   │
    │   │   │   ├─→ Success
    │   │   │   │   └─→ emit('execution', { status: 'success' })
    │   │   │   │
    │   │   │   └─→ Failure
    │   │   │       └─→ emit('retry') × maxRetries
    │   │   │           └─→ emit('error')
    │   │   │
    │   │   └─→ Return result
    │   │
    │   ├─→ emit('step:complete')
    │   │
    │   └─→ Continue or handle error
    │
    ├─→ Aggregate outputs
    │
    └─→ emit('workflow:complete')
```

## Data Flow Example

```json
// Input to workflow
{
  "userRequest": "Deploy Azure Function",
  "constraints": {
    "region": "westeurope",
    "budget": 500
  }
}

// After TaskExtractionAgent
{
  "tasks": [
    {
      "id": "task-1",
      "description": "Deploy Azure Function",
      "type": "deployment",
      "priority": "medium"
    }
  ],
  "intent": {
    "action": "create",
    "target": "function"
  }
}

// After ResourceAnalyzerAgent
{
  "resources": [
    {
      "id": "function-app-12345",
      "type": "Microsoft.Web/sites",
      "sku": "Y1",
      "location": "westeurope"
    },
    {
      "id": "storage-12345",
      "type": "Microsoft.Storage/storageAccounts",
      "sku": "Standard_LRS",
      "location": "westeurope"
    }
  ]
}

// After CostEstimatorAgent
{
  "totalCost": 24.50,
  "currency": "USD",
  "timeframe": "monthly",
  "breakdown": [
    {
      "resourceId": "function-app-12345",
      "cost": 0.20
    },
    {
      "resourceId": "storage-12345",
      "cost": 1.84
    }
  ]
}

// Final workflow output
{
  "tasks": [...],
  "resources": [...],
  "costEstimate": {
    "total": 24.50,
    "breakdown": [...],
    "recommendations": [...]
  }
}
```

## Error Handling Flow

```
Step Execution
    │
    ├─→ Input Validation
    │   │
    │   ├─→ Valid → Continue
    │   │
    │   └─→ Invalid → ValidationError
    │           └─→ onError: "stop" → Abort Workflow
    │
    ├─→ Execute with Timeout
    │   │
    │   ├─→ Success → Output Validation
    │   │               │
    │   │               ├─→ Valid → Continue
    │   │               │
    │   │               └─→ Invalid → ValidationError
    │   │
    │   └─→ Failure/Timeout
    │       │
    │       └─→ Retry Logic
    │           │
    │           ├─→ Attempt 1 → Fail
    │           │   └─→ Backoff 1s
    │           │
    │           ├─→ Attempt 2 → Fail
    │           │   └─→ Backoff 2s (exponential)
    │           │
    │           └─→ Attempt 3 → Fail
    │               │
    │               └─→ Apply Error Strategy
    │                   │
    │                   ├─→ "stop" → Abort workflow
    │                   │
    │                   ├─→ "continue" → Skip step, continue
    │                   │
    │                   └─→ "retry" → Retry with different params
    │
    └─→ Step Complete / Error Reported
```
