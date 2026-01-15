# Transport Selector

**Component**: EB-01  
**Purpose**: Select execution transport (webhook, process, Docker, API)  
**Status**: Design Complete  

---

## 🎯 Overview

The Transport Selector determines **how to invoke** each agent:

1. **Reads** agent configuration
2. **Chooses** best transport method
3. **Validates** endpoint/command availability
4. **Initializes** transport connection

---

## 🏗️ Process Flow

```
Execution Request
    │
    ├─→ Identify Agent
    │   └─ @nodejs-specialist, @react-specialist, etc.
    │
    ├─→ Look Up Config
    │   └─ agents.@nodejs-specialist.transport = "webhook"
    │
    ├─→ Load Transport Config
    │   ├─ endpoint: http://localhost:3000/api/execute
    │   ├─ timeout_ms: 60000
    │   └─ verify_ssl: true
    │
    ├─→ Validate Transport
    │   ├─ Is endpoint reachable?
    │   ├─ Is command available?
    │   └─ Are permissions sufficient?
    │
    └─→ Result
        ├─ Transport object ready
        └─ READY to invoke agent
```

---

## 📋 Transport Types

### Type 1: Webhook
```
Agent Configuration:
{
  "transport": "webhook",
  "endpoint": "http://localhost:3000/api/execute",
  "method": "POST",
  "timeout_ms": 60000,
  "verify_ssl": true,
  "headers": {
    "Authorization": "Bearer token123"
  }
}

Usage:
POST http://localhost:3000/api/execute
Content-Type: application/json
Authorization: Bearer token123

{
  "phase": 13,
  "inputs": { ... }
}

Response:
200 OK
{
  "artifact": { ... },
  "stdout": "...",
  "logs": [ ... ]
}
```

### Type 2: Process
```
Agent Configuration:
{
  "transport": "process",
  "command": "npm run @nodejs-specialist",
  "cwd": "/agents",
  "timeout_ms": 60000,
  "env": {
    "AGENT_PHASE": "13",
    "AGENT_INPUTS": "{...}"
  }
}

Usage:
spawn("npm", ["run", "@nodejs-specialist"], {
  cwd: "/agents",
  env: { ...env, AGENT_PHASE: "13" },
  timeout: 60000
})

Output:
stdout/stderr from process
exit code
```

### Type 3: Docker
```
Agent Configuration:
{
  "transport": "docker",
  "image": "agentic-coder/nodejs-specialist:latest",
  "container_name": "nodejs-spec-13",
  "timeout_ms": 120000,
  "volumes": {
    "/data": "/agent-data"
  },
  "env": {
    "AGENT_PHASE": "13"
  }
}

Usage:
docker run \
  --name nodejs-spec-13 \
  -v /data:/agent-data \
  -e AGENT_PHASE=13 \
  --timeout 120s \
  agentic-coder/nodejs-specialist:latest

Output:
Container output
Mounted volumes
```

### Type 4: API
```
Agent Configuration:
{
  "transport": "api",
  "base_url": "https://api.agents.example.com",
  "endpoint": "/v1/execute",
  "method": "POST",
  "timeout_ms": 60000,
  "auth": {
    "type": "bearer",
    "token": "sk_live_..."
  }
}

Usage:
POST https://api.agents.example.com/v1/execute
Authorization: Bearer sk_live_...

{
  "agent": "@nodejs-specialist",
  "phase": 13,
  "inputs": { ... }
}

Response:
{
  "status": "success",
  "artifact": { ... }
}
```

---

## 💻 Algorithm

### Select Transport
```typescript
import * as fs from 'fs';

interface AgentConfig {
  agent: string;
  transport: 'webhook' | 'process' | 'docker' | 'api';
  endpoint?: string;
  command?: string;
  image?: string;
  base_url?: string;
  timeout_ms: number;
}

interface Transport {
  type: 'webhook' | 'process' | 'docker' | 'api';
  config: AgentConfig;
  ready: boolean;
}

async function selectTransport(
  agent: string,
  config: any
): Promise<Transport> {
  
  // Step 1: Load agent configuration
  const agentConfig = config.agents[agent];
  
  if (!agentConfig) {
    throw new Error(`No configuration for agent: ${agent}`);
  }
  
  const transport: Transport = {
    type: agentConfig.transport,
    config: agentConfig,
    ready: false
  };
  
  // Step 2: Validate transport-specific config
  switch (agentConfig.transport) {
    case 'webhook':
      await validateWebhookTransport(transport);
      break;
    
    case 'process':
      await validateProcessTransport(transport);
      break;
    
    case 'docker':
      await validateDockerTransport(transport);
      break;
    
    case 'api':
      await validateApiTransport(transport);
      break;
    
    default:
      throw new Error(`Unknown transport: ${agentConfig.transport}`);
  }
  
  transport.ready = true;
  return transport;
}

async function validateWebhookTransport(
  transport: Transport
): Promise<void> {
  const { endpoint, verify_ssl } = transport.config;
  
  if (!endpoint) {
    throw new Error('Webhook transport requires endpoint');
  }
  
  try {
    // Quick health check
    const response = await fetch(endpoint, {
      method: 'OPTIONS',
      timeout: 5000
    });
    
    if (!response.ok && response.status !== 405) {
      console.warn(`Webhook endpoint may be unavailable: ${endpoint}`);
    }
  } catch (error) {
    // Warning, not fatal (endpoint may be behind firewall)
    console.warn(`Could not verify webhook endpoint: ${endpoint}`);
  }
}

async function validateProcessTransport(
  transport: Transport
): Promise<void> {
  const { command, cwd } = transport.config;
  
  if (!command) {
    throw new Error('Process transport requires command');
  }
  
  // Verify command exists
  const [cmd, ...args] = command.split(' ');
  
  try {
    // Check if command is available
    const { execSync } = require('child_process');
    execSync(`which ${cmd}`, { stdio: 'ignore' });
  } catch (error) {
    throw new Error(`Command not found: ${cmd}`);
  }
  
  // Verify working directory if specified
  if (cwd && !fs.existsSync(cwd)) {
    throw new Error(`Working directory not found: ${cwd}`);
  }
}

async function validateDockerTransport(
  transport: Transport
): Promise<void> {
  const { image } = transport.config;
  
  if (!image) {
    throw new Error('Docker transport requires image');
  }
  
  try {
    // Check if Docker is available
    const { execSync } = require('child_process');
    execSync('docker --version', { stdio: 'ignore' });
  } catch (error) {
    throw new Error('Docker not available');
  }
  
  try {
    // Check if image exists locally or can be pulled
    execSync(`docker inspect ${image}`, { stdio: 'ignore' });
  } catch (error) {
    console.warn(`Docker image may need to be pulled: ${image}`);
  }
}

async function validateApiTransport(
  transport: Transport
): Promise<void> {
  const { base_url, endpoint } = transport.config;
  
  if (!base_url || !endpoint) {
    throw new Error('API transport requires base_url and endpoint');
  }
  
  try {
    // Quick health check
    const fullUrl = base_url + endpoint;
    const response = await fetch(fullUrl, {
      method: 'OPTIONS',
      timeout: 5000
    });
    
    if (!response.ok && response.status !== 405 && response.status !== 404) {
      console.warn(`API endpoint may be unavailable: ${fullUrl}`);
    }
  } catch (error) {
    console.warn(`Could not verify API endpoint`);
  }
}
```

---

## 🎯 Default Transport Selection

```
Agent                    Default Transport    Reason
────────────────────────────────────────────────────
@nodejs-specialist      webhook              Cloud function
@react-specialist       webhook              Cloud function
@bicep-specialist       process              Local execution
@database-specialist    webhook              Cloud function
@azure-architect        api                  REST endpoint
@terraform-specialist   docker               Isolated execution
```

---

## 📊 Transport Decision Matrix

```
Requirement              Webhook   Process   Docker    API
────────────────────────────────────────────────────────────
Fast                     ✓✓        ✓✓        ✓         ✓
Isolated                 ✗         ✗         ✓✓        ✗
Local                    ✗         ✓✓        ✓         ✗
Remote                   ✓✓        ✗         ~         ✓✓
Easy to setup           ✓✓        ✓         ✗         ✓
Scalable                ✓✓        ✓         ✓✓        ✓✓
Cost effective          ✓         ✓✓        ~         ✓
```

---

## ⚙️ Configuration Structure

### Top-Level Config
```json
{
  "transports": {
    "webhook": {
      "enabled": true,
      "default": true,
      "timeout_ms": 60000,
      "verify_ssl": true,
      "max_retries": 3
    },
    "process": { ... },
    "docker": { ... },
    "api": { ... }
  },
  "agents": {
    "@nodejs-specialist": {
      "transport": "webhook",
      "endpoint": "http://localhost:3000/api/execute",
      ...
    }
  }
}
```

---

## ✅ Validation Examples

### Example 1: Valid Webhook Transport
```typescript
const config = {
  agents: {
    "@nodejs-specialist": {
      "transport": "webhook",
      "endpoint": "http://localhost:3000/api/execute",
      "timeout_ms": 60000
    }
  }
};

const transport = await selectTransport("@nodejs-specialist", config);
// Result: { type: "webhook", ready: true, ... }
```

---

### Example 2: Invalid Transport Config
```typescript
const config = {
  agents: {
    "@nodejs-specialist": {
      "transport": "webhook"
      // Missing: endpoint
    }
  }
};

const transport = await selectTransport("@nodejs-specialist", config);
// Error: Webhook transport requires endpoint
```

---

### Example 3: Command Not Found
```typescript
const config = {
  agents: {
    "@custom-agent": {
      "transport": "process",
      "command": "npm run @custom-agent-nonexistent"
    }
  }
};

const transport = await selectTransport("@custom-agent", config);
// Error: Command not found: npm
```

---

## 🔌 Integration

### Called By
- Agent Invoker (needs transport to execute)
- Lifecycle Manager (setup phase)

### Returns
- Transport object ready for use
- Configuration loaded and validated
- Health checks completed

---

## 💡 Key Points

1. **Config-Driven**: Transport selection from configuration
2. **Validation**: Checks that endpoint/command available
3. **Flexible**: Supports 4 transport methods
4. **Fallback**: Can specify fallback transports
5. **Health Checks**: Verifies endpoint before execution
6. **Error Clarity**: Clear messages when config invalid

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
