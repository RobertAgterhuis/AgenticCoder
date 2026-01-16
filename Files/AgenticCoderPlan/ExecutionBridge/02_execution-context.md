# Execution Context

**Component**: EB-02  
**Purpose**: Prepare execution data and environment  
**Status**: Design Complete  

---

## 🎯 Overview

The Execution Context prepares everything needed to run an agent:

1. **Creates** unique execution ID
2. **Packages** input data
3. **Configures** environment variables
4. **Sets up** timeout and resource limits

---

## 🏗️ Process Flow

```
Execution Request
    │
    ├─→ Create Execution ID
    │   └─ Generate unique ID: exec_20260113_001
    │
    ├─→ Package Inputs
    │   ├─ Validate input schema
    │   ├─ Serialize to JSON
    │   └─ Create input file
    │
    ├─→ Configure Environment
    │   ├─ Set AGENT_PHASE, AGENT_ID
    │   ├─ Set ARTIFACT_DIR
    │   ├─ Set LOG_DIR
    │   └─ Set custom vars from config
    │
    ├─→ Set Resource Limits
    │   ├─ timeout_ms: 60000
    │   ├─ memory_limit: 1024MB
    │   └─ cpu_limit: 2 cores
    │
    └─→ Return Context
        └─ Ready for execution
```

---

## 💻 Algorithm

### Create Execution Context
```typescript
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

interface ExecutionInput {
  project_name: string;
  tech_stack: any;
  database_schema?: any;
  [key: string]: any;
}

interface ExecutionContext {
  execution_id: string;
  agent: string;
  phase: number;
  timestamp: string;
  
  inputs: ExecutionInput;
  input_file: string;
  
  environment: Record<string, string>;
  
  resources: {
    timeout_ms: number;
    memory_limit_mb: number;
    cpu_limit: number;
  };
  
  paths: {
    artifact_dir: string;
    log_dir: string;
    input_dir: string;
    temp_dir: string;
  };
  
  transport: {
    type: string;
    endpoint?: string;
  };
}

async function createExecutionContext(
  agent: string,
  phase: number,
  inputs: ExecutionInput,
  config: any,
  transportConfig: any
): Promise<ExecutionContext> {
  
  // Step 1: Create execution ID
  const timestamp = new Date().toISOString();
  const executionId = generateExecutionId(agent, phase, timestamp);
  
  // Step 2: Validate inputs
  validateInputs(inputs, agent, phase);
  
  // Step 3: Create directory structure
  const basePath = config.base_path || '/var/agentic-coder';
  const executionPath = path.join(basePath, 'executions', executionId);
  
  const paths = {
    artifact_dir: path.join(executionPath, 'artifacts'),
    log_dir: path.join(executionPath, 'logs'),
    input_dir: path.join(executionPath, 'inputs'),
    temp_dir: path.join(executionPath, 'temp')
  };
  
  // Create directories
  for (const dir of Object.values(paths)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Step 4: Write input file
  const inputFile = path.join(paths.input_dir, 'inputs.json');
  fs.writeFileSync(inputFile, JSON.stringify(inputs, null, 2));
  
  // Step 5: Configure environment variables
  const environment = createEnvironment(
    agent,
    phase,
    executionId,
    paths,
    config,
    inputs
  );
  
  // Step 6: Get resource limits
  const resources = getResourceLimits(agent, config);
  
  // Step 7: Assemble context
  const context: ExecutionContext = {
    execution_id: executionId,
    agent,
    phase,
    timestamp,
    
    inputs,
    input_file: inputFile,
    
    environment,
    
    resources,
    
    paths,
    
    transport: {
      type: transportConfig.type,
      endpoint: transportConfig.endpoint
    }
  };
  
  // Step 8: Validate context
  validateExecutionContext(context);
  
  return context;
}

function generateExecutionId(
  agent: string,
  phase: number,
  timestamp: string
): string {
  const date = timestamp.split('T')[0].replace(/-/g, '');
  const time = timestamp.split('T')[1].split(':').slice(0, 2).join('');
  const agentShort = agent.replace('@', '').substring(0, 3);
  
  return `exec_${date}_${time}_${agentShort}_${phase}`;
  // Example: exec_20260113_1245_nod_13
}

function createEnvironment(
  agent: string,
  phase: number,
  executionId: string,
  paths: any,
  config: any,
  inputs: ExecutionInput
): Record<string, string> {
  
  const env: Record<string, string> = {
    // Execution metadata
    AGENT_NAME: agent,
    AGENT_PHASE: phase.toString(),
    EXECUTION_ID: executionId,
    
    // Paths
    ARTIFACT_DIR: paths.artifact_dir,
    LOG_DIR: paths.log_dir,
    INPUT_DIR: paths.input_dir,
    TEMP_DIR: paths.temp_dir,
    
    // Input data
    INPUTS_FILE: path.join(paths.input_dir, 'inputs.json'),
    
    // Configuration
    NODE_ENV: config.environment || 'production',
    LOG_LEVEL: config.log_level || 'info',
    
    // LLM settings (for agents that need it)
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    AZURE_OPENAI_KEY: process.env.AZURE_OPENAI_KEY || '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    
    // Custom environment from config
    ...getCustomEnvironment(agent, config)
  };
  
  // Serialize complex input as JSON
  env.INPUTS_JSON = JSON.stringify(inputs);
  
  return env;
}

function getCustomEnvironment(
  agent: string,
  config: any
): Record<string, string> {
  
  const agentEnv = config.agents[agent]?.environment || {};
  const globalEnv = config.environment || {};
  
  const result: Record<string, string> = {};
  
  // Apply global environment
  for (const [key, value] of Object.entries(globalEnv)) {
    result[key] = String(value);
  }
  
  // Apply agent-specific environment (overrides global)
  for (const [key, value] of Object.entries(agentEnv)) {
    result[key] = String(value);
  }
  
  // Resolve references to other variables
  for (const [key, value] of Object.entries(result)) {
    // Support ${VAR} syntax
    result[key] = value.replace(/\$\{(\w+)\}/g, (match, varName) => {
      return result[varName] || process.env[varName] || match;
    });
  }
  
  return result;
}

function getResourceLimits(
  agent: string,
  config: any
): ExecutionContext['resources'] {
  
  const defaultResources = {
    timeout_ms: 60000,
    memory_limit_mb: 1024,
    cpu_limit: 2
  };
  
  const agentResources = config.agents[agent]?.resources || {};
  
  return {
    timeout_ms: agentResources.timeout_ms || defaultResources.timeout_ms,
    memory_limit_mb: agentResources.memory_limit_mb || defaultResources.memory_limit_mb,
    cpu_limit: agentResources.cpu_limit || defaultResources.cpu_limit
  };
}

function validateInputs(
  inputs: ExecutionInput,
  agent: string,
  phase: number
): void {
  
  if (!inputs.project_name) {
    throw new Error('Missing required input: project_name');
  }
  
  if (!inputs.tech_stack) {
    throw new Error('Missing required input: tech_stack');
  }
  
  // Agent-specific validation
  if (agent === '@database-specialist' && !inputs.database_schema) {
    throw new Error('Database specialist requires database_schema input');
  }
  
  if (agent === '@bicep-specialist' && !inputs.azure_resources) {
    throw new Error('Bicep specialist requires azure_resources input');
  }
}

function validateExecutionContext(context: ExecutionContext): void {
  
  // Check required fields
  if (!context.execution_id || !context.agent || !context.phase) {
    throw new Error('Invalid execution context');
  }
  
  // Check paths are valid
  for (const [key, dir] of Object.entries(context.paths)) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Path does not exist: ${key} = ${dir}`);
    }
  }
  
  // Check input file
  if (!fs.existsSync(context.input_file)) {
    throw new Error(`Input file not created: ${context.input_file}`);
  }
  
  // Check environment
  if (!context.environment.AGENT_NAME) {
    throw new Error('Missing AGENT_NAME in environment');
  }
}
```

---

## 📋 Input Schema

### Base Input Schema (all agents)
```json
{
  "project_name": {
    "type": "string",
    "description": "Project name",
    "required": true
  },
  "description": {
    "type": "string",
    "description": "Project description"
  },
  "tech_stack": {
    "type": "object",
    "description": "Technology stack",
    "required": true,
    "properties": {
      "language": { "type": "string" },
      "framework": { "type": "string" },
      "database": { "type": "string" }
    }
  }
}
```

### Agent-Specific Input Schemas

**@nodejs-specialist**
```json
{
  "backend_framework": { "type": "string", "enum": ["express", "fastify", "hapi"] },
  "api_endpoints": { "type": "array" },
  "middleware": { "type": "array" }
}
```

**@react-specialist**
```json
{
  "pages": { "type": "array" },
  "components": { "type": "array" },
  "styling": { "type": "string", "enum": ["css", "tailwind", "emotion"] }
}
```

**@database-specialist**
```json
{
  "database_schema": { "type": "object", "required": true },
  "migrations": { "type": "boolean" }
}
```

**@bicep-specialist**
```json
{
  "azure_resources": { "type": "array", "required": true },
  "environment": { "type": "string", "enum": ["dev", "staging", "prod"] }
}
```

---

## 📊 Example Context

### Request Input
```json
{
  "project_name": "my-app",
  "description": "E-commerce platform",
  "tech_stack": {
    "backend": "express",
    "frontend": "react",
    "database": "postgresql",
    "hosting": "azure"
  },
  "database_schema": {
    "users": { ... },
    "products": { ... }
  }
}
```

### Generated Context
```json
{
  "execution_id": "exec_20260113_1245_nod_13",
  "agent": "@nodejs-specialist",
  "phase": 13,
  "timestamp": "2026-01-13T12:45:00Z",
  
  "inputs": { ... },
  "input_file": "/var/agentic-coder/executions/exec_.../inputs/inputs.json",
  
  "environment": {
    "AGENT_NAME": "@nodejs-specialist",
    "AGENT_PHASE": "13",
    "EXECUTION_ID": "exec_20260113_1245_nod_13",
    "ARTIFACT_DIR": "/var/agentic-coder/executions/exec_.../artifacts",
    "LOG_DIR": "/var/agentic-coder/executions/exec_.../logs",
    "INPUTS_FILE": "/var/agentic-coder/executions/exec_.../inputs/inputs.json",
    "NODE_ENV": "production",
    "INPUTS_JSON": "{...}"
  },
  
  "resources": {
    "timeout_ms": 60000,
    "memory_limit_mb": 1024,
    "cpu_limit": 2
  },
  
  "paths": {
    "artifact_dir": "/var/agentic-coder/executions/exec_.../artifacts",
    "log_dir": "/var/agentic-coder/executions/exec_.../logs",
    "input_dir": "/var/agentic-coder/executions/exec_.../inputs",
    "temp_dir": "/var/agentic-coder/executions/exec_.../temp"
  }
}
```

---

## ⚙️ Configuration

### Base Configuration
```json
{
  "base_path": "/var/agentic-coder",
  "environment": "production",
  "log_level": "info",
  
  "agents": {
    "@nodejs-specialist": {
      "resources": {
        "timeout_ms": 60000,
        "memory_limit_mb": 1024,
        "cpu_limit": 2
      },
      "environment": {
        "NODE_ENV": "production",
        "NPM_REGISTRY": "https://registry.npmjs.org"
      }
    }
  }
}
```

---

## 🔌 Integration

### Called By
- Lifecycle Manager (prepares context for execution)

### Calls
- Input validator (validates inputs)
- Environment builder (creates env vars)
- File system (creates directories)

---

## 💡 Key Points

1. **Unique IDs**: Every execution gets unique execution_id
2. **Input Packaging**: Inputs serialized and written to files
3. **Environment Setup**: Variables ready for agent use
4. **Resource Limits**: Timeout and memory configured
5. **Path Management**: All paths created and ready
6. **Validation**: Context validated before return

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.

---

## 📋 ADDENDUM: Implementation (January 2026)

### Implementation Location
```
agents/core/execution/ExecutionContext.js (~250 lines)
```

### Implemented Features
- ✅ Unique execution ID generation (exec-{timestamp}-{uuid})
- ✅ Input packaging for agent execution
- ✅ Environment variable inheritance (PATH, API keys, etc.)
- ✅ Resource limits (timeout, memory, CPU, max output)
- ✅ Working directory and artifact path management
- ✅ Fluent builder pattern (ExecutionContextBuilder)
- ✅ Serialization to/from JSON
- ✅ Context save/load to file

### Key Classes/Methods
```javascript
class ExecutionContext {
  ensureDirectories()     // Create all required directories
  packageInputs()         // Package inputs for agent
  getEnvironment()        // Get env vars for execution
  setTransport(config)    // Set transport configuration
  toJSON() / fromJSON()   // Serialization
}

class ExecutionContextBuilder {
  forAgent(name).forPhase(n).withInputs({}).build()
}
```

### Tests
- 9 unit tests in `core/test/execution.test.js`
- All tests passing ✅

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
