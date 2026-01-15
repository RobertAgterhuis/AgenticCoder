# Agent Invoker

**Component**: EB-03  
**Purpose**: Actually invoke agent via selected transport  
**Status**: Design Complete  

---

## 🎯 Overview

The Agent Invoker is where **real execution happens**:

1. **Invokes** agent using prepared context
2. **Streams** output in real-time
3. **Monitors** execution progress
4. **Handles** timeouts and errors

---

## 🏗️ Process Flow

```
Prepared Execution Context
    │
    ├─→ Select Invocation Method
    │   ├─ Webhook: HTTP POST
    │   ├─ Process: spawn subprocess
    │   ├─ Docker: docker run
    │   └─ API: REST call
    │
    ├─→ Start Execution
    │   ├─ Send request/start process
    │   ├─ Begin output streaming
    │   └─ Start timeout timer
    │
    ├─→ Monitor Execution
    │   ├─ Collect stdout in real-time
    │   ├─ Collect stderr
    │   ├─ Check for completion
    │   └─ Handle timeout
    │
    └─→ Return Raw Output
        ├─ stdout
        ├─ stderr
        ├─ exit code / HTTP status
        └─ execution logs
```

---

## 💻 Invocation Methods

### Method 1: Webhook Invocation
```typescript
async function invokeViaWebhook(
  context: ExecutionContext,
  config: any
): Promise<InvocationResult> {
  
  const { endpoint, timeout_ms, headers } = config;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    timeout_ms
  );
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        execution_id: context.execution_id,
        agent: context.agent,
        phase: context.phase,
        inputs: context.inputs,
        environment: context.environment
      }),
      signal: controller.signal
    });
    
    const responseText = await response.text();
    
    // Parse response (could be JSON artifact data)
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }
    
    return {
      status: response.status,
      ok: response.ok,
      stdout: responseJson.stdout || responseText,
      stderr: responseJson.stderr || '',
      artifact: responseJson.artifact,
      logs: responseJson.logs || [],
      exit_code: response.ok ? 0 : 1
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        status: 504,
        ok: false,
        stdout: '',
        stderr: 'Request timeout',
        exit_code: -1
      };
    }
    
    return {
      status: 500,
      ok: false,
      stdout: '',
      stderr: error.message,
      exit_code: -1
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Method 2: Process Invocation
```typescript
import { spawn } from 'child_process';

async function invokeViaProcess(
  context: ExecutionContext,
  config: any
): Promise<InvocationResult> {
  
  const { command, cwd, timeout_ms, env } = config;
  
  const [cmd, ...args] = command.split(' ');
  
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    const timeoutId = setTimeout(() => {
      process.kill(childProcess.pid);
      resolve({
        status: 504,
        ok: false,
        stdout,
        stderr: 'Process timeout',
        exit_code: -1
      });
    }, timeout_ms);
    
    const childProcess = spawn(cmd, args, {
      cwd: cwd || process.cwd(),
      env: { ...process.env, ...env, ...context.environment },
      timeout: timeout_ms
    });
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[${context.agent}] ${data}`);
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[${context.agent}] ERROR: ${data}`);
    });
    
    childProcess.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({
        status: 500,
        ok: false,
        stdout,
        stderr: error.message,
        exit_code: -1
      });
    });
    
    childProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({
        status: code === 0 ? 200 : 500,
        ok: code === 0,
        stdout,
        stderr,
        exit_code: code || 0
      });
    });
  });
}
```

### Method 3: Docker Invocation
```typescript
import { exec } from 'child_process';
import * as util from 'util';
import * as fs from 'fs';

const execPromise = util.promisify(exec);

async function invokeViaDocker(
  context: ExecutionContext,
  config: any
): Promise<InvocationResult> {
  
  const {
    image,
    container_name,
    volumes,
    timeout_ms
  } = config;
  
  const containerName = `${container_name}-${context.execution_id}`;
  
  // Build docker run command
  let dockerCmd = `docker run --rm --name ${containerName}`;
  
  // Add volume mounts
  for (const [hostPath, containerPath] of Object.entries(volumes || {})) {
    dockerCmd += ` -v ${hostPath}:${containerPath}`;
  }
  
  // Add environment variables
  for (const [key, value] of Object.entries(context.environment)) {
    dockerCmd += ` -e ${key}="${value}"`;
  }
  
  // Add resource limits
  dockerCmd += ` --memory ${context.resources.memory_limit_mb}m`;
  dockerCmd += ` --cpus ${context.resources.cpu_limit}`;
  
  // Add timeout
  dockerCmd += ` --timeout ${timeout_ms / 1000}`;
  
  // Add image
  dockerCmd += ` ${image}`;
  
  try {
    const { stdout, stderr } = await execPromise(dockerCmd, {
      timeout: timeout_ms,
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    
    // Try to extract artifact from stdout
    let artifact;
    try {
      // Look for JSON artifact marker
      const match = stdout.match(/ARTIFACT_JSON:(.*?)END_ARTIFACT/s);
      if (match) {
        artifact = JSON.parse(match[1]);
      }
    } catch {
      // Artifact parsing failed, continue
    }
    
    return {
      status: 200,
      ok: true,
      stdout,
      stderr,
      exit_code: 0,
      artifact
    };
  } catch (error) {
    return {
      status: error.killed ? 504 : 500,
      ok: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exit_code: error.code || -1
    };
  }
}
```

### Method 4: API Invocation
```typescript
async function invokeViaAPI(
  context: ExecutionContext,
  config: any
): Promise<InvocationResult> {
  
  const {
    base_url,
    endpoint,
    method = 'POST',
    timeout_ms,
    auth
  } = config;
  
  const url = base_url + endpoint;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  // Add authentication if configured
  if (auth?.type === 'bearer') {
    headers['Authorization'] = `Bearer ${auth.token}`;
  } else if (auth?.type === 'api-key') {
    headers['X-API-Key'] = auth.key;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    timeout_ms
  );
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify({
        execution_id: context.execution_id,
        agent: context.agent,
        phase: context.phase,
        inputs: context.inputs
      }),
      signal: controller.signal
    });
    
    const responseData = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      stdout: responseData.stdout || '',
      stderr: responseData.stderr || '',
      artifact: responseData.artifact,
      logs: responseData.logs || [],
      exit_code: response.ok ? 0 : 1
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        status: 504,
        ok: false,
        stdout: '',
        stderr: 'Request timeout',
        exit_code: -1
      };
    }
    
    return {
      status: 500,
      ok: false,
      stdout: '',
      stderr: error.message,
      exit_code: -1
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## 📊 Invocation Result

```typescript
interface InvocationResult {
  status: number;              // HTTP status or exit code
  ok: boolean;                 // True if successful
  stdout: string;              // Agent output
  stderr: string;              // Error output
  exit_code: number;           // Process exit code
  artifact?: any;              // Parsed artifact (if JSON)
  logs?: Array<{               // Structured logs
    level: string;
    message: string;
    timestamp: string;
  }>;
  duration_ms?: number;        // Execution time
}
```

---

## 🎯 Invocation Examples

### Example 1: Successful Webhook
```json
{
  "status": 200,
  "ok": true,
  "stdout": "✅ Generated Express application\n✅ Created 15 files",
  "stderr": "",
  "exit_code": 0,
  "artifact": {
    "type": "nodejs-app",
    "files": [
      { "path": "server.js", "content": "..." },
      { "path": "package.json", "content": "{...}" }
    ]
  },
  "duration_ms": 45000
}
```

---

### Example 2: Process Timeout
```json
{
  "status": 504,
  "ok": false,
  "stdout": "Generating files...",
  "stderr": "Process timeout after 60000ms",
  "exit_code": -1,
  "duration_ms": 60000
}
```

---

### Example 3: Docker Execution Error
```json
{
  "status": 500,
  "ok": false,
  "stdout": "",
  "stderr": "Docker image not found: agentic-coder/nodejs:latest",
  "exit_code": 125,
  "duration_ms": 5000
}
```

---

## 🔌 Integration

### Called By
- Lifecycle Manager (during execution phase)

### Calls
- Transport-specific invocation (webhook, process, docker, API)
- Output streaming (real-time capture)
- Timeout handler (kill hung processes)

---

## 💡 Key Points

1. **Multi-Transport**: Same interface for webhook, process, Docker, API
2. **Real-Time Streaming**: Output captured as it happens
3. **Timeout Protection**: Kills hung processes after timeout
4. **Error Handling**: Returns detailed error information
5. **Resource Management**: Enforces memory/CPU limits
6. **Result Parsing**: Attempts to parse JSON artifacts

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
