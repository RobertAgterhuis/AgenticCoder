# Lifecycle Manager

**Component**: EB-05  
**Purpose**: Manage complete execution lifecycle  
**Status**: Design Complete  

---

## 🎯 Overview

The Lifecycle Manager orchestrates the entire execution:

1. **Setup**: Prepare execution context
2. **Execute**: Run agent via invoker
3. **Monitor**: Watch progress and timeouts
4. **Collect**: Gather output and artifacts
5. **Cleanup**: Clean up resources

---

## 🏗️ Process Flow

```
Execution Request
    │
    ├─ SETUP PHASE
    │   ├─→ Select transport
    │   ├─→ Create context
    │   ├─→ Validate inputs
    │   └─→ Prepare directories
    │
    ├─ EXECUTION PHASE
    │   ├─→ Start timeout monitor
    │   ├─→ Invoke agent
    │   ├─→ Stream output
    │   ├─→ Monitor progress
    │   └─→ Handle completion
    │
    ├─ COLLECTION PHASE
    │   ├─→ Capture output
    │   ├─→ Extract artifact
    │   ├─→ Validate artifact
    │   └─→ Store results
    │
    ├─ CLEANUP PHASE
    │   ├─→ Kill lingering processes
    │   ├─→ Remove temp files
    │   ├─→ Archive logs
    │   └─→ Free resources
    │
    └─→ COMPLETE
        └─ Return execution result
```

---

## 💻 Algorithm

### Execute Full Lifecycle
```typescript
interface LifecycleState {
  phase: 'setup' | 'executing' | 'collecting' | 'cleanup' | 'complete';
  status: 'pending' | 'in_progress' | 'success' | 'failure' | 'timeout';
  start_time: number;
  end_time?: number;
}

interface ExecutionResult {
  execution_id: string;
  status: 'success' | 'failure' | 'timeout';
  artifact?: any;
  artifact_path?: string;
  logs: any[];
  metrics: any;
  error?: string;
  duration_ms: number;
}

async function executeWithLifecycle(
  agent: string,
  phase: number,
  inputs: any,
  config: any
): Promise<ExecutionResult> {
  
  const state: LifecycleState = {
    phase: 'setup',
    status: 'pending',
    start_time: Date.now()
  };
  
  try {
    // ===== SETUP PHASE =====
    console.log(`[${agent}] Setup phase started`);
    
    const transport = await selectTransport(agent, config);
    const context = await createExecutionContext(
      agent,
      phase,
      inputs,
      config,
      transport
    );
    
    state.phase = 'setup';
    state.status = 'in_progress';
    
    // ===== EXECUTION PHASE =====
    console.log(`[${agent}] Execution phase started (ID: ${context.execution_id})`);
    
    state.phase = 'executing';
    state.status = 'in_progress';
    
    const invocationResult = await invokeAgent(
      transport,
      context,
      config
    );
    
    if (!invocationResult.ok) {
      throw new Error(`Agent failed: ${invocationResult.stderr}`);
    }
    
    state.status = 'success';
    
    // ===== COLLECTION PHASE =====
    console.log(`[${agent}] Collection phase started`);
    
    state.phase = 'collecting';
    
    const collectedOutput = await collectOutput(
      invocationResult,
      context
    );
    
    // Validate artifact
    if (collectedOutput.artifact) {
      try {
        await validateArtifact(
          collectedOutput.artifact,
          agent,
          config
        );
      } catch (error) {
        console.warn(`Artifact validation warning: ${error.message}`);
        // Don't fail, just warn
      }
    }
    
    // ===== CLEANUP PHASE =====
    console.log(`[${agent}] Cleanup phase started`);
    
    state.phase = 'cleanup';
    
    await cleanupExecution(context);
    
    // ===== COMPLETE =====
    state.phase = 'complete';
    state.end_time = Date.now();
    
    console.log(`[${agent}] Execution completed in ${state.end_time - state.start_time}ms`);
    
    return {
      execution_id: context.execution_id,
      status: 'success',
      artifact: collectedOutput.artifact,
      artifact_path: collectedOutput.artifact_path,
      logs: collectedOutput.logs,
      metrics: collectedOutput.metrics,
      duration_ms: state.end_time - state.start_time
    };
    
  } catch (error) {
    state.end_time = Date.now();
    
    console.error(`[${agent}] Execution failed: ${error.message}`);
    
    return {
      execution_id: `error_${Date.now()}`,
      status: 'failure',
      logs: [],
      metrics: { duration_ms: state.end_time - state.start_time },
      error: error.message,
      duration_ms: state.end_time - state.start_time
    };
  }
}
```

### Monitor Execution
```typescript
async function monitorExecutionWithTimeout(
  invocationPromise: Promise<any>,
  timeout_ms: number,
  context: ExecutionContext
): Promise<InvocationResult> {
  
  return Promise.race([
    invocationPromise,
    new Promise<InvocationResult>((_, reject) => {
      setTimeout(() => {
        console.warn(`[${context.agent}] Timeout after ${timeout_ms}ms`);
        reject(new Error(`Execution timeout: ${timeout_ms}ms exceeded`));
      }, timeout_ms);
    })
  ]);
}

async function invokeAgent(
  transport: Transport,
  context: ExecutionContext,
  config: any
): Promise<InvocationResult> {
  
  const invocationPromise = invokeViaTransport(
    transport,
    context,
    config
  );
  
  try {
    const result = await monitorExecutionWithTimeout(
      invocationPromise,
      context.resources.timeout_ms,
      context
    );
    
    return {
      ...result,
      duration_ms: Date.now() - context.start_time
    };
    
  } catch (error) {
    return {
      status: 504,
      ok: false,
      stdout: '',
      stderr: error.message,
      exit_code: -1,
      duration_ms: Date.now() - context.start_time
    };
  }
}
```

### Cleanup Execution
```typescript
async function cleanupExecution(context: ExecutionContext): Promise<void> {
  
  // Step 1: Kill any lingering processes
  try {
    // Cleanup transport-specific resources
    if (context.transport.type === 'docker') {
      await killDockerContainer(context.execution_id);
    } else if (context.transport.type === 'process') {
      // Process already exited
    }
  } catch (error) {
    console.warn(`Failed to cleanup processes: ${error.message}`);
  }
  
  // Step 2: Remove temporary files (keep artifacts and logs)
  try {
    const tempDir = context.paths.temp_dir;
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  } catch (error) {
    console.warn(`Failed to cleanup temp files: ${error.message}`);
  }
  
  // Step 3: Compress logs if configured
  try {
    await compressLogsIfNeeded(context.paths.log_dir);
  } catch (error) {
    console.warn(`Failed to compress logs: ${error.message}`);
  }
  
  // Step 4: Archive execution metadata
  try {
    await archiveExecutionMetadata(context);
  } catch (error) {
    console.warn(`Failed to archive metadata: ${error.message}`);
  }
}

async function cleanupAfterError(
  context: ExecutionContext,
  error: Error
): Promise<void> {
  
  // Aggressive cleanup on error
  try {
    // Kill process
    if (context.transport.type === 'process') {
      process.kill(context.execution_id);
    }
    
    // Kill docker container
    if (context.transport.type === 'docker') {
      await killDockerContainer(context.execution_id);
    }
    
    // Remove execution directory
    if (fs.existsSync(context.paths.artifact_dir)) {
      const parentDir = path.dirname(context.paths.artifact_dir);
      fs.rmSync(parentDir, { recursive: true });
    }
  } catch (cleanupError) {
    console.error(`Cleanup after error failed: ${cleanupError.message}`);
  }
}
```

---

## 📊 Execution State Machine

```
         START
           │
           ▼
    ┌─────────────┐
    │   SETUP     │ ──→ Validate inputs, create context
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │  EXECUTING  │ ──→ Invoke agent, monitor timeout
    └─────────────┘
     │         │
   OK │         │ TIMEOUT/ERROR
     ▼         │
┌─────────┐    │
│COLLECTING│   │
└─────────┘    │
     │         │
     ▼         ▼
┌──────────────────┐
│  CLEANUP         │ ──→ Kill processes, remove temp files
└──────────────────┘
     │
     ▼
┌──────────────────┐
│  COMPLETE/ERROR  │
└──────────────────┘
```

---

## 📋 Lifecycle Events

Each phase can emit events for monitoring:

```typescript
interface LifecycleEvent {
  execution_id: string;
  phase: string;
  event: string;
  timestamp: string;
  data?: any;
}

// Example events:
// - setup:start
// - setup:complete
// - executing:start
// - executing:output (streaming)
// - executing:complete
// - executing:timeout
// - collecting:start
// - collecting:artifact
// - collecting:complete
// - cleanup:start
// - cleanup:complete
// - complete:success
// - complete:failure
```

---

## ⚙️ Configuration

### lifecycle-manager.config.json
```json
{
  "default_timeout_ms": 60000,
  "max_timeout_ms": 300000,
  "cleanup_on_error": true,
  "archive_on_success": true,
  "emit_events": true,
  "max_concurrent_executions": 5,
  "execution_queue": {
    "enabled": true,
    "max_queue_size": 100
  },
  "cleanup": {
    "remove_temp_files": true,
    "compress_logs": true,
    "archive_metadata": true,
    "retention_days": 30
  }
}
```

---

## 🔌 Integration

### Phases Involved

```
Setup Phase:
  ├─→ Transport Selector
  └─→ Execution Context

Execution Phase:
  ├─→ Agent Invoker
  └─→ Timeout Monitor

Collection Phase:
  └─→ Output Collector

Cleanup Phase:
  └─→ Resource Cleanup
```

---

## 💡 Key Points

1. **Complete Orchestration**: Manages all phases of execution
2. **Error Recovery**: Handles failures at any phase
3. **Resource Management**: Cleans up after execution
4. **Timeout Protection**: Prevents hung executions
5. **Event-Driven**: Emits events for monitoring
6. **Configurable**: Customize behavior per agent

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.

---

## 📋 ADDENDUM: Implementation (January 2026)

### Implementation Location
```
agents/core/execution/LifecycleManager.js (~300 lines)
```

### Implemented Features
- ✅ Full lifecycle orchestration (setup→execute→collect→cleanup)
- ✅ Concurrent execution tracking with Map
- ✅ Max concurrent executions limit
- ✅ Execution cancellation support
- ✅ Context saving for debugging
- ✅ Artifact validation integration
- ✅ Log archiving on completion
- ✅ Temp directory cleanup
- ✅ Event emission for all lifecycle phases

### Key Classes/Methods
```javascript
class LifecycleManager extends EventEmitter {
  execute(agent, phase, inputs, config) // Full lifecycle
  cancel(executionId)                   // Cancel execution
  getExecutionStatus(executionId)       // Get status
  getActiveExecutions()                 // List active IDs
  _cleanup(context, status, config)     // Cleanup resources
  _archiveLogs(context)                 // Archive to storage
}
```

### Lifecycle Phases
```
SETUP → EXECUTING → COLLECTING → CLEANUP → COMPLETE
```

### Tests
- Integration test in `core/test/execution.test.js`
- All tests passing ✅
