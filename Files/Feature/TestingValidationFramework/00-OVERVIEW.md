# Feature: Testing & Validation Framework

**Feature ID:** F-TVF-001  
**Priority:** 🔴 Critical  
**Status:** ⬜ Not Started  
**Estimated Duration:** 3-4 weeks  
**Dependencies:** CodeGenerationEngine

---

## 🎯 Problem Statement

AgenticCoder heeft momenteel **geen systematische testing**:
- ❌ Geen automated tests voor agents
- ❌ Geen scenario validation tests
- ❌ Geen code quality validation voor gegenereerde code
- ❌ Geen regression testing bij agent updates
- ❌ Geen benchmark/performance testing

**Zonder testing framework is kwaliteitsborging onmogelijk.**

---

## 📊 Gap Analysis

### Huidige Staat

| Test Type | Status | Coverage |
|-----------|--------|----------|
| Unit Tests (Core) | ⚠️ Minimal | ~30% |
| Agent Tests | ❌ Missing | 0% |
| Integration Tests | ❌ Missing | 0% |
| E2E Scenario Tests | ❌ Missing | 0% |
| Generated Code Validation | ❌ Missing | 0% |
| Performance Benchmarks | ❌ Missing | 0% |

### Wat Wel Bestaat

| Component | File | Status |
|-----------|------|--------|
| CI Workflow | `.github/workflows/ci.yml` | ✅ Basic |
| Schema Validation | `scripts/validate-schemas.js` | ✅ Exists |
| MCP Server Tests | `servers/*/` | ⚠️ Basic |

### Vereiste Componenten

| Component | Type | Beschrijving |
|-----------|------|--------------|
| AgentTestFramework | Framework | Test harness voor agents |
| ScenarioRunner | Tool | Run S01-S05 scenarios |
| CodeValidator | Tool | Validate generated code |
| BenchmarkSuite | Tool | Performance benchmarks |
| TestReporter | Tool | Test result reporting |
| MockRegistry | Utility | Mock agents/services |

---

## 🏗️ Proposed Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Testing Framework                       │
│                                                          │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │  Unit Tests   │ │ Integration   │ │   E2E Tests   │ │
│  │   (Vitest)    │ │    Tests      │ │  (Scenarios)  │ │
│  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ │
│          │                 │                 │          │
│          └─────────────────┼─────────────────┘          │
│                            ▼                            │
│              ┌─────────────────────┐                    │
│              │   Test Orchestrator │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│  ┌──────────────────────┼──────────────────────┐       │
│  │                      │                       │       │
│  ▼                      ▼                       ▼       │
│ ┌────────┐        ┌──────────┐          ┌───────────┐  │
│ │ Mocks  │        │Validators│          │ Reporters │  │
│ │Registry│        │          │          │           │  │
│ └────────┘        └──────────┘          └───────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Proposed Deliverables

### Test Frameworks
- [ ] AgentTestHarness - Test single agent execution
- [ ] WorkflowTestHarness - Test workflow sequences
- [ ] ScenarioTestRunner - Run full S01-S05 scenarios

### Validators
- [ ] TypeScriptValidator - TS/JS syntax check
- [ ] BicepValidator - Bicep linting
- [ ] SQLValidator - SQL syntax validation
- [ ] PythonValidator - Python syntax check
- [ ] SchemaValidator - JSON schema validation

### Mocking
- [ ] MockAgent - Stub agent for testing
- [ ] MockMessageBus - Isolated message testing
- [ ] MockMCPServer - Fake MCP responses
- [ ] FixtureGenerator - Generate test data

### Reporting
- [ ] JUnitReporter - JUnit XML output
- [ ] HTMLReporter - Human-readable reports
- [ ] CoverageReporter - Code coverage
- [ ] BenchmarkReporter - Performance metrics

---

## 🧪 Test Categories

### 1. Agent Unit Tests
```javascript
describe('@plan Agent', () => {
  it('should generate ProjectPlan folder structure', async () => {
    const agent = new PlanAgent();
    const result = await agent.execute(mockInput);
    expect(result.artifacts).toContain('ProjectPlan/');
  });
});
```

### 2. Integration Tests
```javascript
describe('Phase 0 → Phase 1 Handoff', () => {
  it('should pass correct artifacts from @plan to @doc', async () => {
    // Test agent-to-agent handoff
  });
});
```

### 3. Scenario E2E Tests
```javascript
describe('S01-Simple-MVP', () => {
  it('should complete all 16 phases', async () => {
    const result = await runScenario('S01');
    expect(result.completedPhases).toBe(16);
  });
  
  it('should generate functional code', async () => {
    // Validate generated code compiles
  });
});
```

### 4. Generated Code Validation
```javascript
describe('Generated React Component', () => {
  it('should compile without errors', async () => {
    const code = await generateReactComponent(spec);
    const result = await TypeScriptValidator.validate(code);
    expect(result.errors).toHaveLength(0);
  });
});
```

---

## 📁 Test Structure

```
tests/
├── unit/
│   ├── agents/
│   │   ├── plan.test.js
│   │   ├── doc.test.js
│   │   ├── backlog.test.js
│   │   └── ...
│   ├── core/
│   │   ├── WorkflowEngine.test.js
│   │   ├── MessageBus.test.js
│   │   └── ...
│   └── generators/
│       ├── ReactGenerator.test.js
│       ├── ExpressGenerator.test.js
│       └── ...
│
├── integration/
│   ├── handoffs/
│   │   ├── plan-to-doc.test.js
│   │   ├── doc-to-backlog.test.js
│   │   └── ...
│   └── workflows/
│       ├── basic-workflow.test.js
│       └── parallel-execution.test.js
│
├── e2e/
│   ├── scenarios/
│   │   ├── S01-simple-mvp.test.js
│   │   ├── S02-small-team.test.js
│   │   ├── S03-medium-saas.test.js
│   │   ├── S04-enterprise.test.js
│   │   └── S05-healthcare.test.js
│   └── infrastructure/
│       ├── A01-app-service.test.js
│       └── ...
│
├── validators/
│   ├── typescript.test.js
│   ├── bicep.test.js
│   └── sql.test.js
│
├── benchmarks/
│   ├── agent-execution.bench.js
│   ├── workflow-throughput.bench.js
│   └── code-generation.bench.js
│
├── fixtures/
│   ├── agents/
│   ├── scenarios/
│   └── generated/
│
└── mocks/
    ├── MockAgent.js
    ├── MockMessageBus.js
    └── MockMCPServer.js
```

---

## 🔗 Related Components

| Component | Relation |
|-----------|----------|
| CodeGenerationEngine | Validates generated code |
| CI Workflow | Runs all tests |
| Agents | Each agent needs tests |
| Scenarios | E2E tests per scenario |

---

## 📝 Phase Structure (To Be Detailed)

| Phase | Name | Focus |
|-------|------|-------|
| 1 | Test Infrastructure | Vitest setup, mocks, fixtures |
| 2 | Agent Unit Tests | Test each agent |
| 3 | Integration Tests | Handoff testing |
| 4 | E2E Scenario Tests | Full scenario runs |
| 5 | Validators & Benchmarks | Code validation, perf |

---

## 🌐 MCP Server Integration

> **UPDATE**: We kunnen bestaande MCP servers gebruiken voor testing en validation. Dit reduceert onze custom code met ~60%.

### Beschikbare MCP Servers

| MCP Server | Functionaliteit | Licentie |
|------------|-----------------|----------|
| **Playwright MCP (Microsoft)** | Browser automation, web testing | Apache 2.0 |
| **LambdaTest MCP** | Accessibility, SmartUI, Automation, HyperExecute | Commercial |
| **APIMatic MCP** | OpenAPI specification validation | Commercial |
| **Mandoline MCP** | AI performance reflection and improvement | Open Source |

### Component Mapping naar MCP

| Originele Component | MCP Alternatief | Code Reductie |
|---------------------|-----------------|---------------|
| E2E Browser Testing | **Playwright MCP** | 70% |
| API Testing | **APIMatic MCP** | 60% |
| UI Testing | **LambdaTest MCP** | 50% |
| AI Agent Validation | **Mandoline MCP** | 40% |
| Unit Tests | ❌ Vitest (geen MCP) | 0% |
| Agent Tests | ❌ Custom harness nodig | 0% |

### Aanbevolen MCP Configuratie

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"],
      "description": "Browser automation and E2E testing"
    },
    "apimatic": {
      "command": "npx",
      "args": ["-y", "@apimatic/validator-mcp"],
      "description": "OpenAPI specification validation"
    }
  }
}
```

### Aangepaste Architecture (met MCPs)

```
┌─────────────────────────────────────────────────────────┐
│              Testing Framework (Simplified)              │
│                                                          │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │ Agent Tests   │ │ Integration   │ │   E2E Tests   │ │
│  │  (Vitest)     │ │ (Vitest)      │ │(Playwright MCP│ │
│  │   CUSTOM      │ │   CUSTOM      │ │   via MCP)    │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ │
│                                                          │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │ TypeScript    │ │  API Valid.   │ │    Bicep      │ │
│  │  Validator    │ │ (APIMatic MCP)│ │   Validator   │ │
│  │   CUSTOM      │ │   via MCP     │ │    CUSTOM     │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │       Test Orchestrator (Custom - Simplified)    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Playwright MCP Capabilities

Playwright MCP (Microsoft's official server) biedt:
- ✅ Browser automation zonder screenshots
- ✅ Accessibility snapshots
- ✅ Web interaction via structured data
- ✅ Multi-browser support
- ✅ Apache 2.0 licentie

### Remaining Custom Code

Met MCP integratie hoeven we alleen nog te bouwen:
1. **AgentTestHarness** - Agent-specifieke tests
2. **WorkflowTestHarness** - Workflow sequence tests
3. **TypeScriptValidator** - TS syntax validation
4. **BicepValidator** - Bicep linting
5. **TestOrchestrator** - Route naar MCP of custom tests

**Totale code reductie: ~60%**

---

## 🔗 Navigation

← [../ProjectStatePersistence/00-OVERVIEW.md](../ProjectStatePersistence/00-OVERVIEW.md) | [Index](../../README.md) | [MCP Integration](../MCP-INTEGRATION.md)
