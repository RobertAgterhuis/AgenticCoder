# Result Handler

**Component**: EB-06  
**Purpose**: Process execution results and report status  
**Status**: Design Complete  

---

## 🎯 Overview

The Result Handler:

1. **Processes** execution results
2. **Updates** orchestration status
3. **Triggers** validation (if configured)
4. **Reports** to OE and logging systems

---

## 🏗️ Process Flow

```
Execution Result
    │
    ├─→ Validate Result
    │   ├─ Check status (success/failure/timeout)
    │   ├─ Verify artifact present (if expected)
    │   └─ Check result schema
    │
    ├─→ Register Artifact
    │   ├─ Create artifact record
    │   ├─ Store metadata
    │   └─ Index for retrieval
    │
    ├─→ Trigger Validation
    │   ├─ Send to Validation Framework
    │   ├─ Wait for validation result
    │   └─ Handle validation failure
    │
    ├─→ Update Orchestration
    │   ├─ Mark phase complete/failed
    │   ├─ Update project-plan.json
    │   └─ Trigger next phase
    │
    └─→ Report Result
        ├─ Log execution
        ├─ Send alerts
        └─ Archive result
```

---

## 💻 Algorithm

### Handle Execution Result
```typescript
interface ResultHandling {
  execution_id: string;
  agent: string;
  phase: number;
  status: 'success' | 'failure' | 'timeout';
  artifact_id?: string;
  validation_result?: any;
  next_action: 'proceed' | 'retry' | 'block' | 'manual_review';
}

async function handleExecutionResult(
  executionResult: ExecutionResult,
  orchestrationState: any,
  config: any
): Promise<ResultHandling> {
  
  const handling: ResultHandling = {
    execution_id: executionResult.execution_id,
    agent: orchestrationState.current_agent,
    phase: orchestrationState.current_phase,
    status: executionResult.status,
    next_action: 'proceed'
  };
  
  // Step 1: Validate result
  try {
    validateExecutionResult(executionResult);
  } catch (error) {
    console.error(`Result validation failed: ${error.message}`);
    handling.status = 'failure';
    handling.next_action = 'retry';
    return handling;
  }
  
  // Step 2: Handle different statuses
  if (executionResult.status === 'failure') {
    console.error(`Agent execution failed: ${executionResult.error}`);
    
    // Check if we should retry
    if (shouldRetry(orchestrationState, config)) {
      handling.next_action = 'retry';
      console.log(`Retrying agent execution (attempt ${orchestrationState.attempt_count + 1})`);
    } else {
      handling.next_action = 'block';
      console.error(`Execution failed and max retries exceeded`);
    }
    
    return handling;
  }
  
  if (executionResult.status === 'timeout') {
    console.error(`Agent execution timed out`);
    
    if (shouldRetry(orchestrationState, config)) {
      handling.next_action = 'retry';
    } else {
      handling.next_action = 'block';
    }
    
    return handling;
  }
  
  // Step 3: Register artifact
  if (executionResult.artifact && executionResult.artifact_path) {
    try {
      const artifactId = await registerArtifact(
        executionResult.artifact,
        executionResult.artifact_path,
        orchestrationState.current_agent,
        orchestrationState.current_phase,
        config
      );
      
      handling.artifact_id = artifactId;
      console.log(`Artifact registered: ${artifactId}`);
      
    } catch (error) {
      console.error(`Failed to register artifact: ${error.message}`);
      handling.next_action = 'retry';
      return handling;
    }
  }
  
  // Step 4: Trigger validation
  if (config.validation?.enabled) {
    try {
      const validationResult = await triggerValidation(
        executionResult.artifact,
        orchestrationState.current_agent,
        config
      );
      
      handling.validation_result = validationResult;
      
      if (!validationResult.can_handoff) {
        console.error(`Validation failed: ${validationResult.reason}`);
        
        if (validationResult.status === 'REJECTED') {
          handling.next_action = 'block';
        } else if (validationResult.status === 'REQUIRES_REVIEW') {
          handling.next_action = 'manual_review';
        }
        
        return handling;
      }
      
      console.log(`Validation passed`);
      
    } catch (error) {
      console.warn(`Validation error (non-blocking): ${error.message}`);
      // Continue despite validation error
    }
  }
  
  // Step 5: Update orchestration state
  try {
    await updateOrchestrationState(
      orchestrationState,
      executionResult,
      handling,
      config
    );
  } catch (error) {
    console.error(`Failed to update orchestration state: ${error.message}`);
    handling.next_action = 'retry';
    return handling;
  }
  
  // Step 6: Prepare for next phase
  if (handling.next_action === 'proceed') {
    handling.next_action = 'proceed';
    console.log(`Execution complete, proceeding to next phase`);
  }
  
  return handling;
}

function validateExecutionResult(result: ExecutionResult): void {
  
  if (!result.execution_id) {
    throw new Error('Missing execution_id');
  }
  
  if (!result.status || !['success', 'failure', 'timeout'].includes(result.status)) {
    throw new Error(`Invalid status: ${result.status}`);
  }
  
  // Artifact required on success (unless configured otherwise)
  if (result.status === 'success' && !result.artifact) {
    throw new Error('Artifact missing on successful execution');
  }
}

function shouldRetry(
  orchestrationState: any,
  config: any
): boolean {
  
  const maxRetries = config.retry?.max_retries || 3;
  const attemptCount = orchestrationState.attempt_count || 0;
  
  return attemptCount < maxRetries;
}

async function registerArtifact(
  artifact: any,
  artifactPath: string,
  agent: string,
  phase: number,
  config: any
): Promise<string> {
  
  const artifactId = `artifact_${phase}_${Date.now()}`;
  
  const record = {
    id: artifactId,
    agent,
    phase,
    path: artifactPath,
    size_bytes: getFileSize(artifactPath),
    created: new Date().toISOString(),
    content_hash: hashFile(artifactPath),
    type: detectArtifactType(artifact, agent),
    schema_version: artifact._schema_version || '1.0.0'
  };
  
  // Store in artifact registry
  const registryPath = path.join(config.registry_path, `${artifactId}.json`);
  fs.writeFileSync(registryPath, JSON.stringify(record, null, 2));
  
  return artifactId;
}

async function triggerValidation(
  artifact: any,
  agent: string,
  config: any
): Promise<any> {
  
  // Send to validation framework via HTTP
  const validationEndpoint = config.validation?.endpoint;
  
  if (!validationEndpoint) {
    throw new Error('Validation endpoint not configured');
  }
  
  try {
    const response = await fetch(`${validationEndpoint}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifact,
        agent,
        timeout_ms: config.validation?.timeout_ms || 120000
      })
    });
    
    return await response.json();
    
  } catch (error) {
    throw new Error(`Validation service error: ${error.message}`);
  }
}

async function updateOrchestrationState(
  orchestrationState: any,
  executionResult: ExecutionResult,
  handling: ResultHandling,
  config: any
): Promise<void> {
  
  // Update execution record
  const executionRecord = {
    ...orchestrationState,
    execution_id: executionResult.execution_id,
    status: executionResult.status,
    artifact_id: handling.artifact_id,
    validation_result: handling.validation_result,
    logs: executionResult.logs,
    metrics: executionResult.metrics,
    completed_at: new Date().toISOString(),
    next_action: handling.next_action
  };
  
  // Save to database or file
  const statePath = config.state_path || './orchestration-state.json';
  fs.writeFileSync(statePath, JSON.stringify(executionRecord, null, 2));
  
  // Update project plan
  await updateProjectPlan(executionRecord, config);
}

async function updateProjectPlan(
  executionRecord: any,
  config: any
): Promise<void> {
  
  const projectPlanPath = config.project_plan_path || './project-plan.json';
  
  if (!fs.existsSync(projectPlanPath)) {
    return; // Not a fatal error
  }
  
  const projectPlan = JSON.parse(
    fs.readFileSync(projectPlanPath, 'utf8')
  );
  
  // Update phase status
  const phase = projectPlan.phases?.[executionRecord.phase - 1];
  if (phase) {
    phase.status = executionRecord.status === 'success' ? 'completed' : 'failed';
    phase.completion_date = new Date().toISOString();
    phase.execution_id = executionRecord.execution_id;
    phase.artifact_id = executionRecord.artifact_id;
  }
  
  // Persist updated plan
  fs.writeFileSync(projectPlanPath, JSON.stringify(projectPlan, null, 2));
}
```

---

## 📋 Result Handling Decisions

```
Execution Status     Has Artifact   Validation   Action
────────────────────────────────────────────────────────
SUCCESS              YES             PASS         → PROCEED
SUCCESS              YES             FAIL         → MANUAL_REVIEW
SUCCESS              NO              -            → RETRY
FAILURE              -               -            → RETRY/BLOCK
TIMEOUT              -               -            → RETRY/BLOCK
```

---

## 📊 Result Handling Examples

### Example 1: Successful Execution
```json
{
  "execution_id": "exec_20260113_1245_nod_13",
  "status": "success",
  "artifact_id": "artifact_13_1673615100000",
  "validation_result": {
    "status": "APPROVED",
    "can_handoff": true
  },
  "next_action": "proceed"
}
```

---

### Example 2: Validation Failure
```json
{
  "execution_id": "exec_20260113_1245_rea_14",
  "status": "success",
  "artifact_id": "artifact_14_1673615200000",
  "validation_result": {
    "status": "REJECTED",
    "can_handoff": false,
    "reason": "Test coverage below threshold"
  },
  "next_action": "manual_review"
}
```

---

### Example 3: Timeout
```json
{
  "execution_id": "exec_20260113_1245_dab_15",
  "status": "timeout",
  "validation_result": null,
  "next_action": "retry"
}
```

---

## ⚙️ Configuration

### result-handler.config.json
```json
{
  "validation": {
    "enabled": true,
    "endpoint": "http://localhost:4000",
    "timeout_ms": 120000,
    "fail_on_validation_error": false
  },
  "retry": {
    "max_retries": 3,
    "delay_ms": 5000,
    "backoff_multiplier": 2
  },
  "artifact_registry": {
    "path": "/var/agentic-coder/artifacts",
    "index_enabled": true
  },
  "state_management": {
    "state_path": "./orchestration-state.json",
    "project_plan_path": "./project-plan.json",
    "auto_update": true
  },
  "notifications": {
    "on_success": true,
    "on_failure": true,
    "on_timeout": true,
    "webhook": "http://localhost:5000/webhooks/execution"
  }
}
```

---

## 🔌 Integration

### Called By
- Lifecycle Manager (after execution completes)
- Orchestration Engine (to determine next action)

### Calls
- Validation Framework (to validate artifacts)
- Orchestration State (to update status)
- Project Plan (to update progress)
- Notification System (to alert)

---

## 💡 Key Points

1. **Status Processing**: Handles success, failure, timeout
2. **Artifact Registration**: Records artifacts in registry
3. **Validation Integration**: Triggers validation before handoff
4. **State Management**: Updates orchestration and project state
5. **Retry Logic**: Handles transient failures
6. **Decision Making**: Determines proceed/retry/block/review

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
