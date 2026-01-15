# 02. Phase Executor Specification

**Component**: Orchestration Engine - Phase 2  
**Purpose**: Execute agents for each phase  
**Date**: January 13, 2026  
**Status**: Specification

---

## 📖 Overview

The Phase Executor handles the actual execution of agent phases. It:
1. Prepares phase inputs
2. Triggers agent execution
3. Monitors agent progress
4. Collects outputs
5. Validates results

---

## 🔄 Phase Execution Flow

```
Receive Phase
    │
    ├─→ Prepare Inputs
    │   ├─> Gather required artifacts
    │   ├─> Validate against schema
    │   └─> Create input bundle
    │
    ├─→ Trigger Agent
    │   ├─> Call agent API/webhook
    │   ├─> Pass input bundle
    │   └─> Set timeout
    │
    ├─→ Monitor Execution
    │   ├─> Poll status
    │   ├─> Collect logs
    │   └─> Track progress
    │
    ├─→ Handle Completion
    │   ├─> Receive outputs
    │   ├─> Validate outputs
    │   └─> Register artifacts
    │
    └─→ Return Result
```

---

## 🎯 Core Methods

### executePhase()
```typescript
async executePhase(
  phase: Phase,
  state: EngineState
): Promise<PhaseResult> {
  const executionStart = now();
  const phaseId = `${phase.phase}_${phase.agent}`;
  
  try {
    logInfo(`[Phase ${phase.phase}] Starting: ${phase.agent}`);
    
    // 1. Prepare inputs
    const inputs = await preparePhaseInputs(phase, state);
    validateInputs(inputs, phase.input_schema);
    
    // 2. Trigger agent
    const agentTask = triggerAgent(phase.agent, inputs);
    const monitoring = setupMonitoring(agentTask);
    
    // 3. Wait for completion (with timeout)
    const agentOutput = await Promise.race([
      agentTask,
      timeout(phase.timeout_minutes * 60000)
    ]);
    
    // 4. Collect and validate results
    const result = await collectResults(agentOutput, phase);
    validateResults(result, phase.output_schema);
    
    // 5. Register artifacts
    for (const artifact of result.artifacts) {
      registerArtifact(artifact, phase.phase);
    }
    
    logInfo(`[Phase ${phase.phase}] Completed successfully in ${now() - executionStart}ms`);
    
    return {
      status: 'success',
      phase: phase.phase,
      duration_ms: now() - executionStart,
      artifacts: result.artifacts,
      metrics: result.metrics
    };
    
  } catch (error) {
    logError(`[Phase ${phase.phase}] Failed: ${error.message}`);
    
    return {
      status: 'failed',
      phase: phase.phase,
      error: error.message,
      duration_ms: now() - executionStart
    };
  }
}
```

### preparePhaseInputs()
```typescript
async function preparePhaseInputs(
  phase: Phase,
  state: EngineState
): Promise<PhaseInputBundle> {
  const inputs: any = {
    execution_context: {
      execution_id: state.executionId,
      phase: phase.phase,
      agent: phase.agent,
      timestamp: now()
    }
  };
  
  // Add project context
  if (phase.requires.project_plan) {
    inputs.project_plan = state.projectPlan;
  }
  
  // Add required artifacts from previous phases
  for (const artifactId of phase.requires.artifacts || []) {
    const artifact = getArtifact(artifactId);
    if (!artifact) {
      throw new Error(`Required artifact not found: ${artifactId}`);
    }
    inputs[artifactId] = artifact;
  }
  
  // Add task assignments for this phase
  const phaseTasks = state.getTasksForPhase(phase.phase);
  inputs.tasks = phaseTasks;
  
  // Add conditional context
  if (phase.condition) {
    inputs.condition_context = evaluateCondition(phase.condition);
  }
  
  // Add agent-specific instructions
  inputs.agent_instructions = phase.agent_instructions;
  
  return inputs;
}
```

### triggerAgent()
```typescript
async function triggerAgent(
  agentId: string,
  inputs: PhaseInputBundle
): Promise<AgentOutput> {
  // Get agent definition
  const agentDef = getAgentDefinition(agentId);
  
  // Determine invocation method
  if (agentDef.invocation_type === 'webhook') {
    return triggerViaWebhook(agentDef, inputs);
  } else if (agentDef.invocation_type === 'process') {
    return triggerViaProcess(agentDef, inputs);
  } else if (agentDef.invocation_type === 'docker') {
    return triggerViaDocker(agentDef, inputs);
  } else if (agentDef.invocation_type === 'api') {
    return triggerViaAPI(agentDef, inputs);
  }
}
```

### collectResults()
```typescript
async function collectResults(
  agentOutput: AgentOutput,
  phase: Phase
): Promise<PhaseResult> {
  const results: any = {
    artifacts: [],
    metrics: {},
    logs: agentOutput.logs
  };
  
  // Extract artifacts
  for (const artifactName of agentOutput.generated_artifacts || []) {
    const artifact = {
      name: artifactName,
      path: `tee-output/artifacts/phase_${phase.phase}/${artifactName}`,
      generated_at: now(),
      phase: phase.phase,
      size_bytes: getFileSize(artifact.path),
      checksum: calculateChecksum(artifact.path)
    };
    results.artifacts.push(artifact);
  }
  
  // Extract metrics
  results.metrics = agentOutput.metrics || {};
  
  return results;
}
```

---

## 📊 Agent Invocation Methods

### Webhook Invocation
```json
{
  "method": "POST",
  "url": "https://agent.example.com/webhook",
  "headers": {
    "Authorization": "Bearer ${AGENT_TOKEN}",
    "Content-Type": "application/json"
  },
  "body": {
    "execution_id": "exec_001",
    "phase": 13,
    "inputs": {...}
  },
  "timeout_seconds": 7200
}
```

### Process Invocation
```bash
node agent.js --execution-id exec_001 --phase 13 --inputs-file inputs.json
```

### Docker Invocation
```bash
docker run \
  -v /workspace:/workspace \
  -e EXECUTION_ID=exec_001 \
  -e PHASE=13 \
  agent-image:latest
```

### API Invocation
```bash
curl -X POST https://api.agenticcoder.com/execute \
  -H "Authorization: Bearer ${TOKEN}" \
  -d @execution-request.json
```

---

## ⚙️ Agent Monitoring

```typescript
class AgentMonitor {
  monitorInterval = 5000; // 5 second polling
  
  async monitor(task: AgentTask): Promise<void> {
    while (!task.completed) {
      const status = await getAgentStatus(task.id);
      
      logInfo(`[${task.agent}] Progress: ${status.progress}%`);
      
      // Update state
      state.updateTaskProgress(task.id, status.progress);
      
      // Check for warnings
      if (status.warnings) {
        for (const warning of status.warnings) {
          logWarn(`[${task.agent}] ${warning}`);
        }
      }
      
      // Check for errors
      if (status.errors) {
        throw new AgentError(status.errors);
      }
      
      await sleep(this.monitorInterval);
    }
  }
}
```

---

## ✅ Validation Rules

Phase Executor validates:

1. ✅ All required inputs present
2. ✅ Inputs match input schema
3. ✅ All artifacts collected
4. ✅ Artifacts match output schema
5. ✅ No required outputs missing
6. ✅ Checksums validate
7. ✅ File sizes reasonable

---

**Next**: Read `03_handoff-manager.md` to understand artifact handoffs.
