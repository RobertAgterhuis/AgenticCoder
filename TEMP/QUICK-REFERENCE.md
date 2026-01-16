# AgenticCoder Enhanced - Quick Reference

## Project Status

- **Phase 1**: ✅ Complete (MCP Servers, Testing, Documentation)
- **Phase 2**: ✅ Core complete
- **Phase 3**: ✅ Bicep AVM Resolver implemented
- **Phase 4-6**: 📋 Planned

## Key Documents

### Setup & Getting Started
- [README.md](README.md) - Project overview and quick start
- [PHASE1-SETUP-GUIDE.md](PHASE1-SETUP-GUIDE.md) - Manual setup for MCP servers
- [PHASE2-AGENT-FRAMEWORK.md](PHASE2-AGENT-FRAMEWORK.md) - Agent framework guide

### Status & Summaries
- [PHASE2-COMPLETION-STATUS.md](PHASE2-COMPLETION-STATUS.md) - Current progress
- [ProjectPlan/](ProjectPlan/) - Complete 6-phase project plan (176+ pages)

### Architecture & Design
- [schemas/agent.schema.json](schemas/agent.schema.json) - Agent definition schema
- [schemas/workflow.schema.json](schemas/workflow.schema.json) - Workflow orchestration schema
- [schemas/message.schema.json](schemas/message.schema.json) - Inter-agent messages

## Quick Start

### Phase 1: MCP Servers

```powershell
# Start Pricing Server
cd servers/mcp-azure-pricing
npm install
npm start  # http://localhost:3001

# Start Resource Graph Server
cd servers/mcp-azure-resource-graph
npm install
npm start  # http://localhost:3002

# Start Docs Server
cd servers/mcp-azure-docs
npm install
npm start  # http://localhost:3003

# Run Tests
npm test  # In each server directory
```

### Phase 2: Agent Framework

```powershell
# Install
cd agents
npm install

# Run Example
npm start

# Run Tests
npm test
```

## Component Overview

### MCP Servers (Phase 1)

| Server | Port | Status | Tests |
|--------|------|--------|-------|
| Azure Pricing | 3001 | ✅ Running | 7/7 ✅ |
| Azure Resource Graph | 3002 | ✅ Running | 8/8 ✅ |
| Azure Docs | 3003 | ✅ Running | 8/8 ✅ |
| **Total** | - | **3 Servers** | **23 Tests** |

### Agent Framework (Phase 2)

| Component | Type | Status | Tests |
|-----------|------|--------|-------|
| BaseAgent | Core | ✅ Complete | 7/7 ✅ |
| AgentRegistry | Core | ✅ Complete | 8/8 ✅ |
| WorkflowEngine | Core | ✅ Complete | - |
| TaskExtractionAgent | Task | ✅ Complete | - |
| ResourceAnalyzerAgent | Infrastructure | ✅ Complete | - |
| CostEstimatorAgent | Infrastructure | ✅ Complete | - |
| **Total** | - | **6+ Components** | Run `npm test` |

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│          User Interface / API Gateway           │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│           Workflow Orchestration                │
│  (WorkflowEngine, AgentRegistry)                │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│              Agent Layer                        │
│  TaskExtraction | ResourceAnalyzer | Cost       │
│  DeploymentPlanner | Validation | ...           │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│            MCP Server Layer                     │
│  Pricing (3001) | Resource Graph (3002) |       │
│  Docs (3003) | ...                              │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│             Azure Services                      │
│  Retail Prices API | Resource Graph |           │
│  Microsoft Learn | Azure Resource Manager       │
└─────────────────────────────────────────────────┘
```

## Typical Workflow

1. **User Request** → TaskExtractionAgent
2. **Structured Tasks** → ResourceAnalyzerAgent
3. **Resource Requirements** → CostEstimatorAgent
4. **Cost Estimate** → ValidationAgent (planned)
5. **Validation** → DeploymentPlannerAgent (planned)
6. **Deployment Plan** → Execution

## Key Commands

### Development

```powershell
# Install all dependencies
cd servers/mcp-azure-pricing && npm install
cd servers/mcp-azure-resource-graph && npm install
cd servers/mcp-azure-docs && npm install
cd agents && npm install

# Run all tests
cd servers/mcp-azure-pricing && npm test
cd servers/mcp-azure-resource-graph && npm test
cd servers/mcp-azure-docs && npm test
cd agents && npm test

# Start Dev Container
# Open folder in VS Code, then "Reopen in Container"
```

### Testing Individual Components

```powershell
# Test specific MCP server endpoint
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Query pricing
curl "http://localhost:3001/api/prices?serviceName=Virtual%20Machines&limit=10"

# Query resources
curl -X POST http://localhost:3002/api/query `
  -H "Content-Type: application/json" `
  -d '{"query":"Resources | take 5"}'

# Search docs
curl "http://localhost:3003/api/search?q=Azure+Functions"
```

### Azure CLI Commands

```powershell
# Login
az login

# List subscriptions
az account list --output table

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Test Resource Graph query
az graph query -q "Resources | take 5"
```

## Configuration Files

### MCP Servers

Each server needs `.env` file:

**servers/mcp-azure-pricing/.env**
```
PORT=3001
```

**servers/mcp-azure-resource-graph/.env**
```
PORT=3002
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

**servers/mcp-azure-docs/.env**
```
PORT=3003
```

See [PHASE1-SETUP-GUIDE.md](PHASE1-SETUP-GUIDE.md) for details.

## Testing Strategy

### Unit Tests
- Each component tested in isolation
- Mocked dependencies
- Fast execution (<1s per test)

### Integration Tests
- Real MCP server connections
- Agent workflow execution
- End-to-end scenarios

### CI/CD
- Automated on push/PR
- Matrix build (3 MCP servers + agents)
- All tests must pass

## Common Issues & Solutions

### Issue: MCP Server Won't Start

**Solution:**
1. Check `.env` file exists and has correct values
2. Verify port not already in use: `netstat -an | findstr :3001`
3. Check Azure credentials: `az account show`

### Issue: Agent Validation Fails

**Solution:**
1. Check input matches agent's JSON Schema
2. Verify all required fields present
3. Review agent definition's `inputs` property

### Issue: Workflow Step Fails

**Solution:**
1. Check agent is registered in AgentRegistry
2. Verify step dependencies form valid DAG
3. Check `dependsOn` references exist
4. Review error handling strategy

## Monitoring & Observability

### Agent Events

```javascript
agent.on('lifecycle', (data) => { /* ... */ });
agent.on('execution', (data) => { /* ... */ });
agent.on('error', (data) => { /* ... */ });
agent.on('retry', (data) => { /* ... */ });
```

### Workflow Events

```javascript
workflowEngine.on('workflow:start', (data) => { /* ... */ });
workflowEngine.on('workflow:complete', (data) => { /* ... */ });
workflowEngine.on('step:start', (data) => { /* ... */ });
workflowEngine.on('step:complete', (data) => { /* ... */ });
```

### Metrics

- Agent execution count: `agent.executionHistory.length`
- Success rate: `agent._calculateSuccessRate()`
- Average duration: `agent._calculateAverageDuration()`
- Registry stats: `registry.getStats()`

## Next Development Priorities

### High Priority
1. DeploymentPlannerAgent - Generate Bicep templates
2. ValidationAgent - Validate configurations
3. Workflow engine tests
4. Real MCP client SDK integration

### Medium Priority
1. Message bus for agent communication
2. Parallel workflow step execution
3. Additional agent implementations
4. Performance optimization

### Low Priority
1. Sub-workflow support
2. Workflow templates
3. Advanced error recovery
4. Distributed tracing

## Resources

- [Azure Resource Graph Documentation](https://learn.microsoft.com/en-us/azure/governance/resource-graph/)
- [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices)
- [Microsoft Learn API](https://learn.microsoft.com/api/)
- [JSON Schema Specification](https://json-schema.org/)

## Contact & Support

For issues or questions:
1. Check documentation in `docs/` and `PHASE1-SETUP-GUIDE.md`
2. Review example workflows in `workflows/`
3. Examine test files for usage patterns
4. Refer to project plan in `ProjectPlan/`

---

**Last Updated**: Phase 2 Implementation (Agent Framework Core)
**Version**: 1.0.0
**Status**: Development
