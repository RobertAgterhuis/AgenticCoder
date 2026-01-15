# 05. Feedback System Specification

**Component**: Task Extraction Engine - Phase 5  
**Purpose**: Track task execution, validate artifacts, report progress  
**Date**: January 13, 2026  
**Status**: Specification

---

## 📖 Overview

The Feedback System monitors agent execution in real-time, validates generated artifacts, tracks task completion, and feeds results back to @plan to keep the project status current.

**Input**: Agent execution logs and artifacts  
**Output**: Status reports, progress tracking, completion notifications

---

## 🔄 Process Flow

```
Agent Execution
    │
    ├─> Capture Execution Logs
    │   ├─> Start/end times
    │   ├─> Generated artifacts
    │   └─> Execution status (success/fail)
    │
    ├─> Validate Artifacts
    │   ├─> Schema validation
    │   ├─> Content validation
    │   └─> Dependency resolution
    │
    ├─> Track Task Status
    │   ├─> Mark task complete/failed
    │   ├─> Record metrics
    │   └─> Trigger next tasks
    │
    ├─> Update Project Status
    │   ├─> Update project-plan.json
    │   ├─> Record artifacts
    │   └─> Unlock dependent tasks
    │
    └─> Generate Reports
        ├─> Daily progress report
        ├─> Task completion summary
        └─> Risk/warning alerts
```

---

## 📥 Input: Execution Events

```json
{
  "event_type": "task_execution_started",
  "timestamp": "2026-01-13T12:00:00Z",
  "task_id": "TASK_001",
  "agent": "@nodejs-specialist",
  "phase": 13,
  "execution_data": {
    "command": "npm run generate:express-app",
    "working_directory": "/workspace/project",
    "environment": {
      "NODE_ENV": "development",
      "PROJECT_NAME": "MyApp"
    }
  }
}
```

```json
{
  "event_type": "task_execution_completed",
  "timestamp": "2026-01-13T12:45:00Z",
  "task_id": "TASK_001",
  "agent": "@nodejs-specialist",
  "phase": 13,
  "status": "success",
  "execution_metrics": {
    "duration_minutes": 45,
    "exit_code": 0
  },
  "generated_artifacts": [
    {
      "name": "express-app-structure.json",
      "path": "src/",
      "size_bytes": 2048,
      "checksum": "abc123"
    },
    {
      "name": "api-routes.json",
      "path": "src/routes/",
      "size_bytes": 1024
    }
  ],
  "logs": {
    "stdout": "Express app initialized...",
    "stderr": ""
  }
}
```

---

## 📤 Output: Status Reports

### task-completion-report.json
```json
{
  "project_name": "MyApp",
  "report_date": "2026-01-13T13:00:00Z",
  "execution_summary": {
    "total_tasks": 42,
    "completed": 5,
    "in_progress": 2,
    "pending": 35,
    "failed": 0,
    "completion_percent": 11.9
  },
  "task_status": [
    {
      "task_id": "TASK_001",
      "title": "Initialize Express Application",
      "status": "completed",
      "agent": "@nodejs-specialist",
      "started_at": "2026-01-13T12:00:00Z",
      "completed_at": "2026-01-13T12:45:00Z",
      "duration_minutes": 45,
      "result": "success",
      "artifacts_generated": ["express-app-structure.json"],
      "tests_passed": true,
      "validation_status": "passed",
      "blockers_resolved": ["TASK_003", "TASK_004"]
    },
    {
      "task_id": "TASK_002",
      "title": "Create PostgreSQL Database Schema",
      "status": "in_progress",
      "agent": "@database-specialist",
      "started_at": "2026-01-13T12:05:00Z",
      "estimated_completion": "2026-01-13T15:05:00Z",
      "progress_percent": 60,
      "current_work": "Creating indexes"
    },
    {
      "task_id": "TASK_003",
      "title": "Setup Authentication Middleware",
      "status": "pending",
      "agent": "@nodejs-specialist",
      "depends_on": ["TASK_001"],
      "can_start_when": "TASK_001 complete",
      "status": "ready_to_start",
      "expected_start": "2026-01-13T12:45:00Z"
    }
  ],
  "phase_status": [
    {
      "phase": 1,
      "agent": "@plan",
      "status": "completed",
      "completed_at": "2026-01-13T09:00:00Z"
    },
    {
      "phase": 2,
      "agent": "@doc",
      "status": "completed",
      "completed_at": "2026-01-13T10:30:00Z"
    },
    {
      "phase": 13,
      "agent": "@nodejs-specialist",
      "status": "in_progress",
      "started_at": "2026-01-13T12:00:00Z",
      "progress_percent": 40
    }
  ],
  "artifacts_generated": [
    {
      "name": "express-app-structure.json",
      "path": "tee-output/artifacts/TASK_001/",
      "generated_by": "TASK_001",
      "schema_validated": true,
      "available_to": ["TASK_003", "TASK_004"]
    }
  ],
  "alerts": [
    {
      "level": "info",
      "message": "TASK_001 completed ahead of schedule",
      "recommended_action": "none"
    }
  ]
}
```

### project-plan-update.json
```json
{
  "project_name": "MyApp",
  "update_timestamp": "2026-01-13T13:00:00Z",
  "updates": {
    "task_status_changes": [
      {
        "task_id": "TASK_001",
        "previous_status": "in_progress",
        "new_status": "completed",
        "completion_time_actual": 45,
        "completion_time_estimated": 120,
        "status_change_reason": "execution_successful"
      }
    ],
    "artifact_registrations": [
      {
        "artifact_id": "express-app-structure.json",
        "registered_at": "2026-01-13T12:45:00Z",
        "available_to_tasks": ["TASK_003", "TASK_004"]
      }
    ],
    "unlocked_tasks": ["TASK_003", "TASK_004"],
    "execution_metrics": {
      "cumulative_hours": 45,
      "remaining_hours": 75,
      "velocity": 1.0,
      "estimated_completion": "2026-01-15"
    }
  }
}
```

---

## 🎯 Core Tracking Mechanisms

### 1. Task State Machine

```
┌─────────┐
│ pending │  Task waiting for dependencies
└────┬────┘
     │ (dependencies met)
     ↓
┌────────────┐
│ ready      │  Ready to execute
└────┬───────┘
     │ (agent picks up)
     ↓
┌────────────┐
│ in_progress│  Currently executing
└────┬───────┘
     │
     ├─ (success) ──→ ┌───────────┐
     │                │ completed │
     │                └───────────┘
     │
     └─ (failure) ──→ ┌────────┐
                      │ failed │
                      └───┬────┘
                          │ (retry)
                          ↓
                     ┌──────────────┐
                     │ pending      │
                     │ (retry count)│
                     └──────────────┘
```

### 2. Artifact Validation

```javascript
function validateArtifact(artifact, schema) {
  const validations = [
    {
      name: "schema_validation",
      test: () => validateJsonSchema(artifact, schema),
      critical: true
    },
    {
      name: "required_fields",
      test: () => schema.required.every(f => artifact[f] !== undefined),
      critical: true
    },
    {
      name: "dependency_resolution",
      test: () => artifact.imports.every(imp => isAvailable(imp)),
      critical: false
    },
    {
      name: "type_validation",
      test: () => validateTypes(artifact),
      critical: false
    }
  ];
  
  const results = validations.map(v => ({
    name: v.name,
    passed: v.test(),
    critical: v.critical
  }));
  
  return {
    valid: !results.some(r => r.critical && !r.passed),
    results: results
  };
}
```

### 3. Progress Calculation

```javascript
function calculateProjectProgress(tasks) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionPercent = (completedTasks / totalTasks) * 100;
  
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);
  const actualHours = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.actual_hours, 0);
  const remainingHours = totalEstimatedHours - actualHours;
  
  const velocity = actualHours / completedTasks; // avg hours per task
  const remainingTasks = totalTasks - completedTasks;
  const projectedHours = remainingTasks * velocity;
  
  return {
    completion_percent: completionPercent,
    tasks_completed: completedTasks,
    total_tasks: totalTasks,
    actual_hours_spent: actualHours,
    estimated_hours_remaining: remainingHours,
    projected_hours_remaining: projectedHours,
    on_track: remainingHours <= projectedHours
  };
}
```

---

## 📊 Real-Time Monitoring

### Event Stream
```json
{
  "event_stream": [
    {
      "timestamp": "2026-01-13T12:00:00Z",
      "event_type": "task_started",
      "task_id": "TASK_001",
      "agent": "@nodejs-specialist"
    },
    {
      "timestamp": "2026-01-13T12:15:00Z",
      "event_type": "artifact_created",
      "artifact": "express-app-structure.json",
      "task_id": "TASK_001"
    },
    {
      "timestamp": "2026-01-13T12:45:00Z",
      "event_type": "task_completed",
      "task_id": "TASK_001",
      "status": "success",
      "duration_minutes": 45
    },
    {
      "timestamp": "2026-01-13T12:45:01Z",
      "event_type": "dependent_tasks_unlocked",
      "unlocked_tasks": ["TASK_003", "TASK_004"]
    }
  ]
}
```

### Status Dashboard
```json
{
  "dashboard": {
    "current_time": "2026-01-13T13:00:00Z",
    "active_tasks": ["TASK_002", "TASK_003"],
    "next_tasks": ["TASK_004", "TASK_005"],
    "risk_level": "low",
    "timeline_status": "on_track",
    "active_agents": ["@nodejs-specialist", "@database-specialist"],
    "completion_timeline": {
      "current": "11.9%",
      "projected": "100% on 2026-01-15 (16:00 UTC)"
    }
  }
}
```

---

## 🔔 Alert System

### Alert Types
```json
{
  "alert_types": {
    "task_blocked": {
      "level": "warning",
      "message": "Task {task_id} blocked by {blocking_task}",
      "action": "Investigate blocking task"
    },
    "artifact_invalid": {
      "level": "error",
      "message": "Artifact {artifact} failed validation: {error}",
      "action": "Retry task or manual intervention"
    },
    "timeline_slipping": {
      "level": "warning",
      "message": "Project falling behind schedule",
      "action": "Add resources or adjust timeline"
    },
    "resource_bottleneck": {
      "level": "warning",
      "message": "Agent {agent} overloaded",
      "action": "Redistribute tasks"
    }
  ]
}
```

---

## 💾 Persistence

### Status Storage
```
ProjectPlan/
├── task-status.json          # Current status of all tasks
├── execution-log.json        # Chronological execution log
├── artifacts-manifest.json   # Registry of all generated artifacts
└── completion-report.json    # Final completion report
```

---

## 🔌 Integration with @plan

Feedback system updates project-plan.json:

```json
{
  "project_name": "MyApp",
  "original_spec": {...},
  "execution_status": {
    "start_time": "2026-01-13T09:00:00Z",
    "current_time": "2026-01-13T13:00:00Z",
    "tasks": {
      "total": 42,
      "completed": 5,
      "in_progress": 2,
      "pending": 35,
      "failed": 0
    },
    "timeline": {
      "estimated_total_hours": 120,
      "actual_hours_spent": 45,
      "estimated_hours_remaining": 75,
      "projected_end": "2026-01-15T16:00:00Z",
      "on_track": true
    },
    "artifacts": [
      {
        "task_id": "TASK_001",
        "artifact_name": "express-app-structure.json",
        "generated_at": "2026-01-13T12:45:00Z"
      }
    ]
  }
}
```

---

## ⚙️ Configuration

### feedback-system.config.json
```json
{
  "monitoring_enabled": true,
  "real_time_updates": true,
  "update_frequency_seconds": 60,
  "artifact_validation_enabled": true,
  "alert_system_enabled": true,
  "storage_backend": "filesystem",
  "retention_days": 90,
  "project_plan_update_on_complete": true
}
```

---

## ✅ Validation Rules

Feedback System must validate:

1. ✅ All artifacts match expected schemas
2. ✅ Task status transitions are valid
3. ✅ Dependent tasks unlocked only when dependencies complete
4. ✅ All generated artifacts are registered
5. ✅ Progress calculations are accurate
6. ✅ Status reports are generated on schedule
7. ✅ Alerts are triggered for critical issues

---

## 📊 Metrics Tracked

| Metric | Type | Used For |
|--------|------|----------|
| Task completion % | percent | Overall progress |
| Hours spent | number | Resource tracking |
| Task duration actual vs estimated | comparison | Velocity calculation |
| Artifacts generated | count | Completeness verification |
| Validation pass rate | percent | Quality assurance |
| Alert count by type | count | Risk assessment |
| Agent utilization | percent | Resource allocation |

---

**Integration**: The Feedback System is the closing loop that makes the entire TEE system functional - turning one-way code generation into bidirectional project execution.

---

**Next**: Read `integration/@plan-integration.md` to understand how TEE connects with @plan.
