# Execution Bridge

**Version**: 1.0.0  
**Date**: January 13, 2026  
**Status**: Specification & Implementation  
**Purpose**: Execute agent commands via multiple transport mechanisms  

---

## 🎯 Executive Summary

The **Execution Bridge (EB)** enables **actual execution** of agent commands. It:

1. ✅ **Invokes** agents via webhook, process, Docker, or API
2. ✅ **Manages** agent lifecycle (startup, execution, shutdown)
3. ✅ **Captures** agent output and logs
4. ✅ **Handles** timeouts and failures
5. ✅ **Reports** execution status back to OE

Without EB: Agents never actually run - just "pretend" execution.  
With EB: Agents genuinely execute and produce real artifacts.

---

## 🏗️ Architecture

```
Orchestration Engine
    │
    ├─→ Execution Bridge
    │   │
    │   ├─→ Select Transport
    │   │   ├─ Webhook (HTTP POST to /api/execute)
    │   │   ├─ Process (spawn local process)
    │   │   ├─ Docker (docker run container)
    │   │   └─ API (REST API call)
    │   │
    │   ├─→ Prepare Execution
    │   │   ├─ Create execution context
    │   │   ├─ Prepare input data
    │   │   └─ Set environment variables
    │   │
    │   ├─→ Execute Agent
    │   │   ├─ Start execution
    │   │   ├─ Stream output
    │   │   ├─ Monitor progress
    │   │   └─ Handle timeouts
    │   │
    │   ├─→ Capture Results
    │   │   ├─ Collect stdout/stderr
    │   │   ├─ Parse JSON output
    │   │   └─ Extract artifacts
    │   │
    │   └─→ Report Status
    │       ├─ Success/failure
    │       ├─ Execution logs
    │       └─ Generated artifacts
    │
    ←─── Execution Result
```

---

## 📦 Core Components

### 1. **Transport Selector** (`01_transport-selector.md`)
Chooses webhook, process, Docker, or API based on agent config.

### 2. **Execution Context** (`02_execution-context.md`)
Prepares data, environment, and execution parameters.

### 3. **Agent Invoker** (`03_agent-invoker.md`)
Actually invokes agent via selected transport.

### 4. **Output Collector** (`04_output-collector.md`)
Captures stdout, stderr, logs, and artifacts.

### 5. **Lifecycle Manager** (`05_lifecycle-manager.md`)
Manages startup, execution, monitoring, shutdown.

### 6. **Result Handler** (`06_result-handler.md`)
Processes execution results and reports back.

---

## 🎯 Transport Methods

### Transport 1: Webhook
```
Execution Bridge → HTTP POST → Agent Endpoint
                  ↓
              Agent receives request
              Agent executes
              Agent returns JSON response
                  ↓
         Execution Bridge ← Agent
```

**Use Case**: Agents exposed as cloud functions or APIs  
**Example**: Azure Function, AWS Lambda, Google Cloud Function

---

### Transport 2: Process
```
Execution Bridge → spawn process → npm run @agent-name
                                   ↓
                          Agent runs locally
                          Writes to stdout
                                   ↓
         Execution Bridge ← reads output
```

**Use Case**: Local agent execution  
**Example**: npm script or Python script

---

### Transport 3: Docker
```
Execution Bridge → docker run → Container
                  ↓
              Container starts
              Agent code executes
              Outputs written to files
                  ↓
         Execution Bridge ← docker cp (copy files)
```

**Use Case**: Isolated agent execution  
**Example**: Docker container with agent code

---

### Transport 4: API
```
Execution Bridge → POST /api/execute → REST API Server
                                       ↓
                                  Execute agent
                                  Return results
                                       ↓
         Execution Bridge ← JSON response
```

**Use Case**: Remote API-based agents  
**Example**: Node.js server, Python Flask/FastAPI

---

## 🚀 Execution Flow

```
1. Receive Execution Request
   ├─ Agent: @nodejs-specialist
   ├─ Phase: 13
   ├─ Inputs: { project_name, tech_stack, ... }
   └─ Transport: webhook

2. Select Transport
   └─ Determine: Is it webhook? docker? process? API?

3. Prepare Context
   ├─ Create execution ID
   ├─ Set up input files
   ├─ Configure environment
   └─ Prepare timeout (60s default)

4. Execute Agent
   ├─ Call webhook → POST /api/execute
   ├─ Stream output in real-time
   ├─ Monitor for completion
   └─ Handle timeout after 60s

5. Capture Output
   ├─ Collect stdout/stderr
   ├─ Extract JSON artifact
   ├─ Validate output structure
   └─ Register artifact file

6. Report Result
   ├─ Status: SUCCESS / FAILURE / TIMEOUT
   ├─ Duration: 45 seconds
   ├─ Artifact: express-app.json
   └─ Logs: execution.log
```

---

## ✅ Transport Comparison

| Transport | Speed | Isolation | Cost | Setup |
|-----------|-------|-----------|------|-------|
| **Webhook** | Fast | None | Free (if existing API) | Needs HTTP endpoint |
| **Process** | Very Fast | Low | Free | Local system |
| **Docker** | Medium | High | Medium | Docker installed |
| **API** | Medium | Low | Low | REST server |

---

## 📊 Execution Example

### Request
```json
{
  "execution_id": "exec_001",
  "agent": "@nodejs-specialist",
  "phase": 13,
  "transport": "webhook",
  "endpoint": "http://localhost:3000/api/execute",
  "timeout_ms": 60000,
  "inputs": {
    "project_name": "my-app",
    "tech_stack": {
      "backend": "express",
      "database": "postgresql"
    },
    "database_schema": {
      "users": { ... },
      "posts": { ... }
    }
  }
}
```

### Response
```json
{
  "status": "SUCCESS",
  "execution_id": "exec_001",
  "agent": "@nodejs-specialist",
  "phase": 13,
  "duration_ms": 45000,
  "timestamp": "2026-01-13T12:45:00Z",
  
  "artifact": {
    "id": "artifact_013_001",
    "type": "nodejs-app",
    "path": "/artifacts/phase_13/express-app.json",
    "size_bytes": 125432,
    "created": "2026-01-13T12:44:15Z"
  },
  
  "output": {
    "stdout": "✅ Generated Express application\n✅ Created 15 files\n✅ Installed dependencies\n",
    "stderr": "",
    "logs": [
      { "level": "info", "message": "Starting generation", "timestamp": "2026-01-13T12:44:15Z" },
      { "level": "info", "message": "Created server.js", "timestamp": "2026-01-13T12:44:17Z" },
      { "level": "info", "message": "Installed express v4.18.2", "timestamp": "2026-01-13T12:44:25Z" }
    ]
  },
  
  "metrics": {
    "start_time": "2026-01-13T12:44:15Z",
    "end_time": "2026-01-13T12:45:00Z",
    "duration_ms": 45000,
    "cpu_percent": 45,
    "memory_mb": 256,
    "tokens_used": 3500
  }
}
```

---

## 🔧 Configuration

### execution-bridge.config.json
```json
{
  "default_timeout_ms": 60000,
  "max_timeout_ms": 300000,
  "max_concurrent_executions": 5,
  "max_retries": 3,
  "retry_delay_ms": 5000,
  
  "transports": {
    "webhook": {
      "enabled": true,
      "default": true,
      "timeout_ms": 60000,
      "verify_ssl": true
    },
    "process": {
      "enabled": true,
      "timeout_ms": 60000,
      "max_workers": 4
    },
    "docker": {
      "enabled": false,
      "timeout_ms": 120000,
      "registry": "docker.io",
      "network": "bridge"
    },
    "api": {
      "enabled": true,
      "timeout_ms": 60000,
      "verify_ssl": true
    }
  },
  
  "agents": {
    "@nodejs-specialist": {
      "transport": "webhook",
      "endpoint": "http://localhost:3000/api/execute",
      "timeout_ms": 60000
    },
    "@react-specialist": {
      "transport": "webhook",
      "endpoint": "http://localhost:3001/api/execute",
      "timeout_ms": 60000
    },
    "@bicep-specialist": {
      "transport": "process",
      "command": "npm run @bicep-specialist",
      "timeout_ms": 30000
    },
    "@database-specialist": {
      "transport": "webhook",
      "endpoint": "http://localhost:3002/api/execute",
      "timeout_ms": 45000
    }
  },
  
  "output": {
    "capture_stdout": true,
    "capture_stderr": true,
    "capture_logs": true,
    "max_log_size_mb": 100,
    "compress_logs": true
  }
}
```

---

## 📁 File Structure

```
ExecutionBridge/
├── README.md (this file)
├── 01_transport-selector.md     # Choose webhook/process/docker/API
├── 02_execution-context.md      # Prepare execution data
├── 03_agent-invoker.md          # Actually invoke agent
├── 04_output-collector.md       # Capture results
├── 05_lifecycle-manager.md      # Manage execution lifecycle
├── 06_result-handler.md         # Process results
├── COMPLETION_SUMMARY.md        # Integration & summary
├── implementation/
│   ├── transport-selector.ts
│   ├── execution-context.ts
│   ├── agent-invoker.ts
│   ├── output-collector.ts
│   ├── lifecycle-manager.ts
│   └── result-handler.ts
├── configs/
│   ├── execution-bridge.config.json
│   ├── agent-endpoints.config.json
│   └── transport-defaults.config.json
└── examples/
    ├── webhook-request.json
    ├── webhook-response.json
    ├── process-execution.json
    └── docker-execution.json
```

---

## 🏆 Success Criteria

When EB is working correctly:

1. ✅ Agents actually execute (not simulated)
2. ✅ Output captured correctly
3. ✅ Artifacts generated and stored
4. ✅ Timeouts enforced
5. ✅ Failures handled gracefully
6. ✅ Execution logs available
7. ✅ Performance metrics collected

---

## 🔗 Integration Points

### Input From
- Orchestration Engine (execution requests)
- Execution Context (prepared parameters)

### Output To
- Artifact Storage (generated artifacts)
- Execution Logs (execution details)
- Orchestration Engine (execution status)

### Dependencies
- Transport implementations (webhook, process, docker, API)
- File storage (for artifacts & logs)
- Monitoring/logging system

---

## 💡 Key Concepts

### Idempotent Execution
Each execution should produce same results given same inputs.

### Timeout Management
Prevent hung executions - kill after 60s (configurable).

### Resource Isolation
Docker/process isolation prevents agents from interfering.

### Output Streaming
Capture output in real-time, not just final result.

### Error Recovery
Retry failed executions, report detailed errors.

---

**Status**: 🟡 **SPECIFICATION IN PROGRESS** → Implementation guide coming.

Next: Read detailed transport and execution component specifications.
