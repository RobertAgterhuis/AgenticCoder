# Agent Handoff Protocol Specification

**Version**: 1.0  
**Date**: January 13, 2026  
**Status**: APPROVED for Implementation

---

## 1. Overview

This document defines the **Handoff Protocol** for agent-to-agent communication in the AgenticCoder system. It specifies how orchestrator agents (Phase 6-12) invoke technology specialist agents (Phase 13-16) and how data flows between them.

---

## 2. Handoff Mechanism: File-Based Communication

### Selected Approach: Option A (File-Based)

**Rationale**:
- ✅ Simple and reliable
- ✅ Debuggable (files can be inspected)
- ✅ Persistent (survives errors)
- ✅ Language-agnostic (works with any agent implementation)
- ✅ Testable (mock files easily)

**Transport**: JSON files written to shared directory

**Directory Structure**:
```
d:\repositories\AgenticCoder\
├─ artifacts\               # Generated artifacts (output)
│  ├─ phase-07-tech-stack\
│  ├─ phase-13-react\
│  ├─ phase-14-dotnet\
│  ├─ phase-15-database\
│  └─ phase-16-azure-devops\
│
├─ handoffs\                # Handoff messages (transient)
│  ├─ pending\              # Unprocessed handoff requests
│  ├─ in-progress\          # Currently being processed
│  ├─ completed\            # Successfully completed
│  └─ failed\               # Failed with errors
│
└─ context\                 # Shared context (persistent)
   ├─ project-context.json
   ├─ tech-stack.json
   └─ phase-status.json
```

---

## 3. Handoff Message Format

### Handoff Request (Orchestrator → Specialist)

**File**: `handoffs/pending/{request-id}.json`

```json
{
  "handoff_id": "hoff-001-1705147200000",
  "timestamp": "2026-01-13T10:00:00Z",
  "status": "pending",
  
  "source": {
    "agent_id": "@frontend-specialist",
    "phase": 11,
    "agent_type": "orchestrator"
  },
  
  "target": {
    "agent_id": "@react-specialist",
    "phase": 13,
    "agent_type": "specialist"
  },
  
  "context": {
    "project_id": "proj-001",
    "tech_stack_artifact_id": "artifact-tech-stack-001",
    "tech_stack": {
      "framework": "React",
      "version": "18.2",
      "state_management": "Redux Toolkit",
      "styling": "Tailwind CSS",
      "testing": "Jest"
    }
  },
  
  "input": {
    "schema": "react-specialist.input.schema.json",
    "data": {
      "component_requirements": [
        {
          "name": "UserProfile",
          "type": "functional",
          "responsibility": "Display user profile with edit capability",
          "props": {
            "userId": { "type": "string", "required": true },
            "onUpdate": { "type": "callback", "required": false }
          },
          "state_needs": ["userData", "isEditing", "isSaving"],
          "api_integration": [
            {
              "endpoint": "/api/users/{id}",
              "method": "GET"
            },
            {
              "endpoint": "/api/users/{id}",
              "method": "PUT"
            }
          ]
        }
      ],
      "dependency_context": {
        "state_management": "Redux Toolkit",
        "styling": "Tailwind CSS",
        "ui_library": "none",
        "testing_framework": "Jest",
        "routing_library": "React Router v6",
        "http_client": "axios"
      },
      "code_quality": {
        "typescript_enabled": true,
        "testing_coverage_target": 80,
        "accessibility_level": "WCAG 2.1 AA"
      }
    }
  },
  
  "expected_output": {
    "artifact_type": "react-components",
    "schema": "react-specialist.output.schema.json",
    "destination": "artifacts/phase-13-react/artifact-react-comp-{timestamp}.json"
  },
  
  "timeout_seconds": 300,
  "priority": "normal",
  "retry_policy": {
    "max_retries": 3,
    "retry_delay_seconds": 30
  }
}
```

---

### Handoff Response (Specialist → Orchestrator)

**File**: `handoffs/completed/{request-id}.json`

```json
{
  "handoff_id": "hoff-001-1705147200000",
  "timestamp_completed": "2026-01-13T10:05:32Z",
  "status": "completed",
  "execution_time_seconds": 332,
  
  "source": {
    "agent_id": "@frontend-specialist",
    "phase": 11
  },
  
  "target": {
    "agent_id": "@react-specialist",
    "phase": 13
  },
  
  "output": {
    "artifact_id": "artifact-react-comp-1705147532000",
    "artifact_path": "artifacts/phase-13-react/artifact-react-comp-1705147532000.json",
    "artifact_type": "react-components",
    "schema_compliance": "valid"
  },
  
  "validation": {
    "status": "passed",
    "typescript_errors": 0,
    "eslint_warnings": 0,
    "tests_passing": true,
    "coverage_percentage": 87,
    "accessibility_violations": 0
  },
  
  "metadata": {
    "components_generated": 1,
    "custom_hooks_generated": 1,
    "test_files_generated": 1,
    "total_lines_generated": 290
  },
  
  "next_steps": [
    "Integrate UserProfile component into application",
    "Configure Redux store with userSlice",
    "Set up React Router routes"
  ],
  
  "warnings": [],
  "errors": []
}
```

---

### Handoff Failure (Specialist → Orchestrator)

**File**: `handoffs/failed/{request-id}.json`

```json
{
  "handoff_id": "hoff-002-1705147300000",
  "timestamp_failed": "2026-01-13T10:10:00Z",
  "status": "failed",
  "execution_time_seconds": 120,
  
  "source": {
    "agent_id": "@frontend-specialist",
    "phase": 11
  },
  
  "target": {
    "agent_id": "@react-specialist",
    "phase": 13
  },
  
  "error": {
    "code": "SCHEMA_VALIDATION_FAILED",
    "message": "Input validation failed: component_requirements[0].props is missing required field 'type'",
    "severity": "error",
    "timestamp": "2026-01-13T10:08:45Z"
  },
  
  "validation": {
    "status": "failed",
    "errors": [
      {
        "field": "component_requirements[0].props.userId",
        "error": "Missing required field 'type'",
        "schema_path": "$.component_requirements[*].props.*"
      }
    ]
  },
  
  "retry_available": true,
  "retry_count": 0,
  "max_retries": 3,
  
  "recovery_actions": [
    "Fix input schema validation errors",
    "Ensure all props have 'type' field defined",
    "Retry handoff with corrected input"
  ]
}
```

---

## 4. Handoff Lifecycle

### State Machine

```
┌─────────┐
│ PENDING │  ← Orchestrator creates handoff request
└────┬────┘
     │
     │ Specialist picks up request
     ▼
┌──────────────┐
│ IN_PROGRESS  │  ← Specialist moves file to in-progress/
└──────┬───────┘
       │
       │ Specialist completes processing
       ▼
    ┌──────────────┐
    │  COMPLETED   │  ← Success: Move to completed/
    └──────────────┘
       │
       │ OR (on error)
       ▼
    ┌──────────────┐
    │   FAILED     │  ← Error: Move to failed/ with error details
    └──────────────┘
```

### File Movement Protocol

1. **Orchestrator creates request**:
   - Write: `handoffs/pending/hoff-{id}.json`
   - Status: `"status": "pending"`

2. **Specialist picks up request**:
   - Move: `handoffs/pending/hoff-{id}.json` → `handoffs/in-progress/hoff-{id}.json`
   - Update: `"status": "in_progress"`
   - Add: `"started_at": "2026-01-13T10:00:00Z"`

3. **Specialist completes successfully**:
   - Write: `artifacts/phase-13-react/artifact-react-comp-{timestamp}.json` (output artifact)
   - Move: `handoffs/in-progress/hoff-{id}.json` → `handoffs/completed/hoff-{id}.json`
   - Update: `"status": "completed"`
   - Add: `"completed_at": "2026-01-13T10:05:00Z"`

4. **Specialist fails**:
   - Move: `handoffs/in-progress/hoff-{id}.json` → `handoffs/failed/hoff-{id}.json`
   - Update: `"status": "failed"`
   - Add: `"error": { "code": "...", "message": "..." }`

---

## 5. Implementation Examples

### Example 1: @frontend-specialist Creates Handoff

**Python Implementation**:

```python
import json
import os
from datetime import datetime

def create_handoff_request(source_agent, target_agent, input_data):
    """
    Create a handoff request from orchestrator to specialist.
    """
    handoff_id = f"hoff-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    handoff_request = {
        "handoff_id": handoff_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "pending",
        "source": {
            "agent_id": source_agent,
            "phase": 11,
            "agent_type": "orchestrator"
        },
        "target": {
            "agent_id": target_agent,
            "phase": 13,
            "agent_type": "specialist"
        },
        "context": {
            "project_id": "proj-001",
            "tech_stack": {
                "framework": "React",
                "version": "18.2"
            }
        },
        "input": {
            "schema": f"{target_agent.strip('@')}.input.schema.json",
            "data": input_data
        },
        "timeout_seconds": 300
    }
    
    # Write to pending directory
    pending_path = f"handoffs/pending/{handoff_id}.json"
    os.makedirs("handoffs/pending", exist_ok=True)
    
    with open(pending_path, 'w') as f:
        json.dump(handoff_request, f, indent=2)
    
    print(f"✅ Handoff created: {handoff_id}")
    return handoff_id
```

---

### Example 2: @react-specialist Picks Up Handoff

**Python Implementation**:

```python
import json
import os
import shutil
from datetime import datetime

def process_handoff_request(handoff_id):
    """
    Specialist picks up and processes handoff request.
    """
    # Move from pending to in-progress
    pending_path = f"handoffs/pending/{handoff_id}.json"
    in_progress_path = f"handoffs/in-progress/{handoff_id}.json"
    
    if not os.path.exists(pending_path):
        print(f"❌ Handoff not found: {handoff_id}")
        return None
    
    # Move file
    os.makedirs("handoffs/in-progress", exist_ok=True)
    shutil.move(pending_path, in_progress_path)
    
    # Update status
    with open(in_progress_path, 'r') as f:
        handoff = json.load(f)
    
    handoff["status"] = "in_progress"
    handoff["started_at"] = datetime.utcnow().isoformat() + "Z"
    
    with open(in_progress_path, 'w') as f:
        json.dump(handoff, f, indent=2)
    
    print(f"🔄 Processing handoff: {handoff_id}")
    
    try:
        # Process the request (generate components, etc.)
        output_artifact = generate_react_components(handoff["input"]["data"])
        
        # Complete successfully
        complete_handoff_success(handoff_id, output_artifact)
        
    except Exception as e:
        # Complete with failure
        complete_handoff_failure(handoff_id, str(e))
```

---

### Example 3: Complete Handoff Successfully

**Python Implementation**:

```python
def complete_handoff_success(handoff_id, output_artifact):
    """
    Complete handoff successfully and create response.
    """
    in_progress_path = f"handoffs/in-progress/{handoff_id}.json"
    completed_path = f"handoffs/completed/{handoff_id}.json"
    
    with open(in_progress_path, 'r') as f:
        handoff = json.load(f)
    
    # Add completion data
    handoff["status"] = "completed"
    handoff["completed_at"] = datetime.utcnow().isoformat() + "Z"
    handoff["execution_time_seconds"] = 332
    
    handoff["output"] = {
        "artifact_id": output_artifact["id"],
        "artifact_path": output_artifact["path"],
        "artifact_type": "react-components",
        "schema_compliance": "valid"
    }
    
    handoff["validation"] = {
        "status": "passed",
        "typescript_errors": 0,
        "eslint_warnings": 0,
        "tests_passing": True,
        "coverage_percentage": 87
    }
    
    # Move to completed
    os.makedirs("handoffs/completed", exist_ok=True)
    shutil.move(in_progress_path, completed_path)
    
    with open(completed_path, 'w') as f:
        json.dump(handoff, f, indent=2)
    
    print(f"✅ Handoff completed: {handoff_id}")
```

---

### Example 4: Complete Handoff with Failure

**Python Implementation**:

```python
def complete_handoff_failure(handoff_id, error_message):
    """
    Complete handoff with failure and error details.
    """
    in_progress_path = f"handoffs/in-progress/{handoff_id}.json"
    failed_path = f"handoffs/failed/{handoff_id}.json"
    
    with open(in_progress_path, 'r') as f:
        handoff = json.load(f)
    
    # Add failure data
    handoff["status"] = "failed"
    handoff["failed_at"] = datetime.utcnow().isoformat() + "Z"
    
    handoff["error"] = {
        "code": "PROCESSING_ERROR",
        "message": error_message,
        "severity": "error",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    handoff["retry_available"] = True
    handoff["retry_count"] = handoff.get("retry_count", 0)
    
    # Move to failed
    os.makedirs("handoffs/failed", exist_ok=True)
    shutil.move(in_progress_path, failed_path)
    
    with open(failed_path, 'w') as f:
        json.dump(handoff, f, indent=2)
    
    print(f"❌ Handoff failed: {handoff_id}")
```

---

## 6. Handoff Discovery & Polling

### Orchestrator Waits for Completion

**Python Implementation**:

```python
import time

def wait_for_handoff_completion(handoff_id, timeout_seconds=300):
    """
    Orchestrator waits for handoff to complete.
    """
    start_time = time.time()
    
    while time.time() - start_time < timeout_seconds:
        # Check completed
        completed_path = f"handoffs/completed/{handoff_id}.json"
        if os.path.exists(completed_path):
            with open(completed_path, 'r') as f:
                return json.load(f)
        
        # Check failed
        failed_path = f"handoffs/failed/{handoff_id}.json"
        if os.path.exists(failed_path):
            with open(failed_path, 'r') as f:
                handoff = json.load(f)
            raise HandoffFailedException(handoff["error"]["message"])
        
        # Still in progress, wait
        time.sleep(5)
    
    # Timeout
    raise HandoffTimeoutException(f"Handoff {handoff_id} timed out after {timeout_seconds}s")
```

---

## 7. Error Handling

### Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `SCHEMA_VALIDATION_FAILED` | Input doesn't match schema | Fix input, retry |
| `PROCESSING_ERROR` | Agent failed during processing | Check logs, retry |
| `TIMEOUT` | Agent didn't complete in time | Increase timeout, retry |
| `DEPENDENCY_MISSING` | Required artifact not found | Generate dependency first |
| `VALIDATION_FAILED` | Output didn't pass validation | Fix implementation |

### Retry Policy

```json
{
  "retry_policy": {
    "max_retries": 3,
    "retry_delay_seconds": 30,
    "backoff_multiplier": 2.0
  }
}
```

**Retry Logic**:
1. Attempt 1: Immediate
2. Attempt 2: After 30 seconds
3. Attempt 3: After 60 seconds (30 × 2.0)
4. Attempt 4: After 120 seconds (60 × 2.0)

---

## 8. Testing Protocol

### Test Handoff Creation

```bash
# Create test handoff
python -c "
from handoff import create_handoff_request

handoff_id = create_handoff_request(
    source_agent='@frontend-specialist',
    target_agent='@react-specialist',
    input_data={
        'component_requirements': [
            {
                'name': 'TestComponent',
                'type': 'functional',
                'props': {}
            }
        ]
    }
)

print(f'Created handoff: {handoff_id}')
"
```

### Test Handoff Processing

```bash
# Process test handoff
python -c "
from handoff import process_handoff_request

process_handoff_request('hoff-20260113100000')
"
```

---

## 9. Success Criteria

✅ Orchestrator can create handoff request  
✅ Specialist can pick up handoff request  
✅ Specialist can complete handoff successfully  
✅ Specialist can complete handoff with failure  
✅ Orchestrator can wait for completion  
✅ Orchestrator can handle timeout  
✅ Error handling works correctly  
✅ Retry logic works correctly  

---

## 10. Next Steps

1. ✅ **HANDOFF_PROTOCOL.md** - COMPLETE
2. ⏳ **ARTIFACT_REGISTRY.md** - Create artifact storage specification
3. ⏳ **VALIDATION_STRATEGY.md** - Create test-first validation approach
4. ⏳ **Implement React E2E** - Test handoff protocol with real React component generation

---

**Status**: ✅ APPROVED for Implementation  
**Last Updated**: January 13, 2026
