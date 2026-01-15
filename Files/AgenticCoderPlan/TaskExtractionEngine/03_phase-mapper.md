# 03. Phase Mapper Specification

**Component**: Task Extraction Engine - Phase 3  
**Purpose**: Map tasks to agent phases, validate against phase-flow  
**Date**: January 13, 2026  
**Status**: Specification

---

## 📖 Overview

The Phase Mapper takes the execution schedule and assigns each task to the correct agent phase, validating against the existing phase-flow.gv definitions.

**Input**: `execution-schedule.json` (from Dependency Resolver)  
**Output**: `phase-assignments.json` (ready for Orchestration Planner)

---

## 🔄 Process Flow

```
execution-schedule.json
    │
    ├─> Phase-Flow.gv Parsing
    │   ├─> Extract phase definitions
    │   ├─> Extract agent → phase mappings
    │   └─> Extract conditional logic (IF Azure, etc.)
    │
    ├─> Task → Phase Mapping
    │   ├─> Match task type to phase
    │   ├─> Match agent requirement
    │   └─> Check conditional gates
    │
    ├─> Validation
    │   ├─> All tasks assigned to valid phases
    │   ├─> Conditional gates satisfied
    │   └─> Phase dependencies respected
    │
    └─> Generate phase-assignments.json
        ├─> Phased task list
        ├─> Phase dependencies
        ├─> Conditional requirements
        └─> Agent handoff sequence
```

---

## 📥 Input: execution-schedule.json

```json
{
  "execution_blocks": [
    {
      "block_id": 1,
      "tasks": ["TASK_001", "TASK_002"],
      "parallel": true
    }
  ],
  "project_name": "MyApp",
  "tech_stack": {
    "backend": "express",
    "frontend": "react",
    "database": "postgresql",
    "infrastructure": "azure",
    "iac": "bicep"
  }
}
```

---

## 📤 Output: phase-assignments.json

```json
{
  "project_name": "MyApp",
  "generated_at": "2026-01-13T11:00:00Z",
  "phase_assignments": [
    {
      "phase": 1,
      "agent": "@plan",
      "description": "Project Planning",
      "status": "completed",
      "tasks": [],
      "note": "Already completed by @plan"
    },
    {
      "phase": 2,
      "agent": "@doc",
      "description": "Documentation",
      "status": "pending",
      "tasks": ["DOC_001", "DOC_002"],
      "note": "Creates technical specification"
    },
    {
      "phase": 13,
      "agent": "@nodejs-specialist",
      "description": "Backend Implementation",
      "status": "pending",
      "tasks": ["TASK_001", "TASK_003", "TASK_004"],
      "execution_blocks": [1, 3],
      "dependencies": {
        "requires_phase": 2,
        "requires_tasks": ["TASK_002"],
        "blocked_by": []
      }
    },
    {
      "phase": 14,
      "agent": "@react-specialist",
      "description": "Frontend Implementation",
      "status": "pending",
      "tasks": ["TASK_010", "TASK_011"],
      "execution_blocks": [4, 5],
      "dependencies": {
        "requires_phase": 13,
        "requires_tasks": ["TASK_004"],
        "blocked_by": []
      }
    },
    {
      "phase": 9,
      "agent": "@azure-architect",
      "description": "Azure Architecture Design",
      "status": "pending",
      "tasks": ["INFRA_001"],
      "condition": "IF platform == azure",
      "condition_met": true,
      "dependencies": {
        "requires_phase": 8,
        "requires_tasks": [],
        "blocked_by": []
      }
    },
    {
      "phase": 11,
      "agent": "@bicep-specialist",
      "description": "Infrastructure as Code",
      "status": "pending",
      "tasks": ["INFRA_002", "INFRA_003"],
      "condition": "IF platform == azure AND iac == bicep",
      "condition_met": true,
      "dependencies": {
        "requires_phase": 9,
        "requires_tasks": ["INFRA_001"],
        "blocked_by": []
      }
    },
    {
      "phase": 12,
      "agent": "@database-specialist",
      "description": "Database Implementation",
      "status": "pending",
      "tasks": ["TASK_002"],
      "execution_blocks": [1],
      "dependencies": {
        "requires_phase": 2,
        "requires_tasks": [],
        "blocked_by": []
      }
    }
  ],
  "phase_flow": {
    "mandatory_phases": [1, 2, 3, 4, 5, 6, 7, 8],
    "conditional_phases": {
      "9": "IF platform == azure",
      "11": "IF platform == azure AND iac == bicep",
      "13": "IF backend_stack == 'express' OR backend_stack == 'nodejs'",
      "14": "IF frontend_stack == 'react'"
    },
    "execution_order": [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16],
    "parallel_allowed": [13, 14, 12]
  },
  "validation": {
    "all_tasks_assigned": true,
    "conditional_gates_satisfied": true,
    "phase_dependencies_valid": true,
    "no_missing_agents": true,
    "errors": [],
    "warnings": []
  }
}
```

---

## 🎯 Core Algorithms

### 1. Parse phase-flow.gv

```javascript
function parsePhaseFlow(graphvizFile) {
  const phases = new Map();
  
  // Extract from .gv format:
  // phase1[label="Phase 1\n@plan\n..."]
  // phase1 -> phase2 [label="ProjectPlan"]
  
  const phaseRegex = /phase\d+\[label="Phase (\d+)\\n(@[a-z-]+)\\n(.+?)\\n/g;
  const edgeRegex = /phase\d+ -> phase\d+ \[label="(.+?)"/g;
  
  let match;
  while ((match = phaseRegex.exec(graphvizFile)) !== null) {
    const phaseNum = parseInt(match[1]);
    const agent = match[2];
    const description = match[3];
    
    phases.set(phaseNum, {
      phase: phaseNum,
      agent: agent,
      description: description,
      edges: []
    });
  }
  
  // Extract dependencies
  while ((match = edgeRegex.exec(graphvizFile)) !== null) {
    // Connect phases...
  }
  
  return phases;
}
```

### 2. Map Task to Phase

```javascript
function mapTaskToPhase(task, techStack, phases) {
  // Determine phase based on task type and tech stack
  
  switch (task.type) {
    case 'backend-setup':
    case 'backend-feature':
      if (techStack.backend === 'nodejs' || techStack.backend === 'express') {
        return 13; // @nodejs-specialist
      } else if (techStack.backend === 'dotnet') {
        return 13; // @dotnet-specialist
      }
      break;
      
    case 'frontend-setup':
    case 'frontend-feature':
      if (techStack.frontend === 'react') {
        return 14; // @react-specialist
      } else if (techStack.frontend === 'vue') {
        return 14; // @vue-specialist
      }
      break;
      
    case 'database-schema':
    case 'database-feature':
      return 12; // @database-specialist
      break;
      
    case 'infrastructure':
      if (techStack.cloud === 'azure') {
        if (techStack.iac === 'bicep') {
          return 11; // @bicep-specialist
        }
      }
      break;
  }
  
  throw new Error(`Cannot map task ${task.id} to phase`);
}
```

### 3. Validate Conditional Gates

```javascript
function validateConditionalGates(phaseAssignments, techStack) {
  const conditionals = {
    "9": () => techStack.cloud === 'azure',
    "11": () => techStack.cloud === 'azure' && techStack.iac === 'bicep',
    "13": () => techStack.backend === 'express' || techStack.backend === 'nodejs',
    "14": () => techStack.frontend === 'react'
  };
  
  for (const [phase, condition] of Object.entries(conditionals)) {
    const phaseAssignment = phaseAssignments.find(p => p.phase === parseInt(phase));
    if (phaseAssignment && phaseAssignment.tasks.length > 0) {
      if (!condition()) {
        throw new Error(`Phase ${phase} has tasks but condition not met`);
      }
    }
  }
}
```

### 4. Determine Phase Dependencies

```javascript
function determinePhaseDependencies(sortedPhases) {
  const dependencies = new Map();
  
  for (let i = 0; i < sortedPhases.length; i++) {
    const phase = sortedPhases[i];
    
    // Phase depends on all previous phases
    const deps = sortedPhases
      .slice(0, i)
      .filter(p => p.tasks.length > 0)
      .map(p => p.phase);
    
    // Also check task-level dependencies across phases
    const crossPhaseDeps = phase.tasks
      .flatMap(taskId => taskGraph.get(taskId).dependencies)
      .map(depTaskId => getPhaseOfTask(depTaskId))
      .filter((p, i, arr) => arr.indexOf(p) === i);
    
    dependencies.set(phase.phase, {
      phase_dependencies: deps,
      task_dependencies: crossPhaseDeps
    });
  }
  
  return dependencies;
}
```

---

## 🏷️ Task → Phase Mapping Table

| Task Type | Tech Stack | Phase | Agent |
|-----------|-----------|-------|-------|
| backend-setup | Express | 13 | @nodejs-specialist |
| backend-setup | .NET | 13 | @dotnet-specialist |
| backend-feature | Express | 13 | @nodejs-specialist |
| frontend-setup | React | 14 | @react-specialist |
| frontend-feature | React | 14 | @react-specialist |
| frontend-setup | Vue | 14 | @vue-specialist |
| database-schema | PostgreSQL | 12 | @database-specialist |
| infrastructure | Azure + Bicep | 11 | @bicep-specialist |
| infrastructure | Azure | 9 | @azure-architect |
| testing | Any | 5 | @qa |
| documentation | Any | 2 | @doc |

---

## 🔀 Conditional Phase Logic

### Azure Detection
```json
{
  "condition": "IF platform == azure",
  "phases_enabled": [9, 10, 11],
  "description": "Enable Azure-specific phases"
}
```

### Bicep Detection
```json
{
  "condition": "IF platform == azure AND iac == bicep",
  "phases_enabled": [11],
  "description": "Use Bicep for infrastructure"
}
```

### Framework Detection
```json
{
  "condition": "IF frontend == react",
  "phases_enabled": [14],
  "agent": "@react-specialist"
}
```

---

## ⚙️ Configuration

### phase-mapper.config.json
```json
{
  "phase_flow_file": ".github/phase-flow.gv",
  "handoff_matrix_file": ".github/AGENT_HANDOFF_MATRIX.md",
  "strict_validation": true,
  "allow_missing_optional_phases": true,
  "conditional_phase_detection": true
}
```

---

## ✅ Validation Rules

Phase Mapper must validate:

1. ✅ All tasks assigned to valid phases
2. ✅ All assignments match phase-flow.gv
3. ✅ Conditional gates properly evaluated
4. ✅ No tasks in disabled phases
5. ✅ Phase dependencies respected
6. ✅ Agent matches phase definition
7. ✅ No conflicts in phase assignments

---

## 📊 Output Structure

phase-assignments.json includes:

```json
{
  "summary": {
    "total_phases_active": 11,
    "total_phases_skipped": 5,
    "conditional_phases_enabled": 2,
    "tasks_per_phase": {
      "2": 1,
      "11": 2,
      "12": 1,
      "13": 3,
      "14": 2
    }
  }
}
```

---

**Next**: Read `04_orchestration-planner.md` to understand agent handoff coordination.
