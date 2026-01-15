# 02. Dependency Resolver Specification

**Component**: Task Extraction Engine - Phase 2  
**Purpose**: Resolve task dependencies and create execution schedule  
**Date**: January 13, 2026  
**Status**: Specification

---

## 📖 Overview

The Dependency Resolver takes the task list and determines:

1. **Task Ordering** - Which tasks must complete before others can start
2. **Execution Blocks** - Groups of tasks that can run sequentially or in parallel
3. **Critical Path** - Longest chain of dependencies (minimum timeline)
4. **Resource Allocation** - Team capacity planning

**Input**: `task-list.json` (from Task Parser)  
**Output**: `execution-schedule.json` (ready for Phase Mapper)

---

## 🔄 Process Flow

```
task-list.json
    │
    ├─> Dependency Graph Analysis
    │   ├─> Identify all depends_on relationships
    │   └─> Check for circular dependencies
    │
    ├─> Topological Sort
    │   ├─> Order tasks by dependencies
    │   └─> Ensure prerequisites complete first
    │
    ├─> Parallel Block Identification
    │   ├─> Find tasks with no dependencies on each other
    │   └─> Group into execution blocks
    │
    ├─> Critical Path Analysis
    │   ├─> Calculate longest dependency chain
    │   └─> Identify bottleneck tasks
    │
    └─> Generate execution-schedule.json
        ├─> Execution blocks (sequential/parallel)
        ├─> Critical path
        ├─> Estimated timeline
        └─> Resource allocation
```

---

## 📥 Input: task-list.json

```json
{
  "tasks": [
    {
      "id": "TASK_001",
      "title": "Initialize Express Application",
      "estimated_hours": 2,
      "depends_on": [],
      "agent": "@nodejs-specialist"
    },
    {
      "id": "TASK_002",
      "title": "Create PostgreSQL Database Schema",
      "estimated_hours": 3,
      "depends_on": [],
      "agent": "@database-specialist"
    },
    {
      "id": "TASK_003",
      "title": "Setup Authentication Middleware",
      "estimated_hours": 3,
      "depends_on": ["TASK_001"],
      "agent": "@nodejs-specialist"
    },
    {
      "id": "TASK_004",
      "title": "Create Authentication API Routes",
      "estimated_hours": 3,
      "depends_on": ["TASK_003", "TASK_002"],
      "agent": "@nodejs-specialist"
    }
  ]
}
```

---

## 📤 Output: execution-schedule.json

```json
{
  "project_name": "MyApp",
  "generated_at": "2026-01-13T10:30:00Z",
  "execution_blocks": [
    {
      "block_id": 1,
      "sequence": 1,
      "parallel": true,
      "tasks": ["TASK_001", "TASK_002"],
      "description": "Initialize infrastructure (Express + DB)",
      "estimated_hours_total": 5,
      "estimated_days": 1,
      "resources_required": {
        "@nodejs-specialist": 1,
        "@database-specialist": 1
      }
    },
    {
      "block_id": 2,
      "sequence": 2,
      "parallel": false,
      "tasks": ["TASK_003"],
      "description": "Setup authentication middleware",
      "estimated_hours_total": 3,
      "estimated_days": 1,
      "resources_required": {
        "@nodejs-specialist": 1
      },
      "depends_on_block": [1],
      "note": "Depends on Express initialization (TASK_001)"
    },
    {
      "block_id": 3,
      "sequence": 3,
      "parallel": false,
      "tasks": ["TASK_004"],
      "description": "Create auth API routes",
      "estimated_hours_total": 3,
      "estimated_days": 1,
      "resources_required": {
        "@nodejs-specialist": 1
      },
      "depends_on_block": [2],
      "note": "Depends on middleware (TASK_003) and DB schema (TASK_002)"
    }
  ],
  "critical_path": {
    "path": ["TASK_001", "TASK_003", "TASK_004"],
    "total_hours": 8,
    "estimated_days": 2,
    "bottleneck_tasks": [
      {
        "id": "TASK_003",
        "title": "Setup Authentication Middleware",
        "reason": "Blocks both TASK_004 and downstream tasks"
      }
    ]
  },
  "timeline": {
    "total_estimated_hours": 11,
    "total_estimated_days": 3,
    "working_hours_per_day": 8,
    "team_size": 2,
    "calendar_days": 5,
    "start_date": "2026-01-13",
    "projected_end_date": "2026-01-17"
  },
  "resource_allocation": {
    "@nodejs-specialist": {
      "total_hours": 8,
      "tasks": ["TASK_001", "TASK_003", "TASK_004"],
      "utilization_percent": 40
    },
    "@database-specialist": {
      "total_hours": 3,
      "tasks": ["TASK_002"],
      "utilization_percent": 15
    }
  },
  "validation": {
    "is_valid": true,
    "errors": [],
    "warnings": [],
    "circular_dependencies": false
  }
}
```

---

## 🎯 Core Algorithms

### 1. Dependency Graph Creation

```javascript
function createDependencyGraph(tasks) {
  const graph = new Map();
  
  for (const task of tasks) {
    // Node: [task, [dependencies]]
    graph.set(task.id, {
      task: task,
      dependencies: task.depends_on || [],
      dependents: []
    });
  }
  
  // Build reverse edges (dependents)
  for (const [taskId, node] of graph.entries()) {
    for (const depId of node.dependencies) {
      graph.get(depId).dependents.push(taskId);
    }
  }
  
  return graph;
}
```

### 2. Circular Dependency Detection

```javascript
function detectCircularDependencies(graph) {
  const visited = new Set();
  const recursionStack = new Set();
  
  function dfs(nodeId, path = []) {
    if (recursionStack.has(nodeId)) {
      // Found cycle
      return {
        hasCycle: true,
        path: [...path, nodeId]
      };
    }
    
    if (visited.has(nodeId)) {
      return { hasCycle: false };
    }
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const node = graph.get(nodeId);
    for (const depId of node.dependencies) {
      const result = dfs(depId, [...path, nodeId]);
      if (result.hasCycle) return result;
    }
    
    recursionStack.delete(nodeId);
    return { hasCycle: false };
  }
  
  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      const result = dfs(nodeId);
      if (result.hasCycle) {
        throw new Error(`Circular dependency detected: ${result.path.join(' → ')}`);
      }
    }
  }
}
```

### 3. Topological Sort

```javascript
function topologicalSort(graph) {
  const sorted = [];
  const visited = new Set();
  
  function visit(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = graph.get(nodeId);
    for (const depId of node.dependencies) {
      visit(depId);
    }
    
    sorted.push(nodeId);
  }
  
  for (const nodeId of graph.keys()) {
    visit(nodeId);
  }
  
  return sorted;
}
```

### 4. Parallel Block Identification

```javascript
function identifyParallelBlocks(sortedTasks, graph) {
  const blocks = [];
  let currentBlock = [];
  const processed = new Set();
  
  for (const taskId of sortedTasks) {
    const node = graph.get(taskId);
    
    // Can run in parallel if:
    // 1. All dependencies are already in processed tasks
    // 2. No other tasks in current block depend on this
    
    const canParallelize = node.dependencies.every(
      depId => processed.has(depId)
    ) && !currentBlock.some(otherId => {
      const otherNode = graph.get(otherId);
      return otherNode.dependencies.includes(taskId);
    });
    
    if (canParallelize && currentBlock.length < MAX_PARALLEL) {
      currentBlock.push(taskId);
    } else {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [taskId];
      } else {
        currentBlock = [taskId];
      }
    }
    
    processed.add(taskId);
  }
  
  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }
  
  return blocks;
}
```

### 5. Critical Path Analysis

```javascript
function analyzeCriticalPath(graph, sortedTasks) {
  // Calculate earliest start/finish times
  const earliestFinish = new Map();
  
  for (const taskId of sortedTasks) {
    const task = graph.get(taskId).task;
    const depTimes = task.depends_on.map(
      depId => earliestFinish.get(depId)
    );
    const earliestStart = Math.max(...depTimes, 0);
    earliestFinish.set(taskId, earliestStart + task.estimated_hours);
  }
  
  // Calculate latest times (backward pass)
  const projectEnd = Math.max(...earliestFinish.values());
  const latestFinish = new Map();
  const latestStart = new Map();
  
  for (const taskId of [...sortedTasks].reverse()) {
    const task = graph.get(taskId).task;
    const dependents = graph.get(taskId).dependents;
    
    if (dependents.length === 0) {
      latestFinish.set(taskId, projectEnd);
    } else {
      const minDependentStart = Math.min(
        ...dependents.map(depId => latestStart.get(depId))
      );
      latestFinish.set(taskId, minDependentStart);
    }
    
    latestStart.set(taskId, latestFinish.get(taskId) - task.estimated_hours);
  }
  
  // Find critical tasks (slack = 0)
  const criticalTasks = [];
  for (const taskId of sortedTasks) {
    const slack = latestStart.get(taskId) - (earliestFinish.get(taskId) - graph.get(taskId).task.estimated_hours);
    if (Math.abs(slack) < 0.01) {
      criticalTasks.push(taskId);
    }
  }
  
  return {
    criticalPath: criticalTasks,
    totalDuration: projectEnd,
    earliestFinish,
    latestFinish
  };
}
```

---

## 📊 Execution Block Strategies

### Strategy 1: Maximum Parallelization
```
Block 1: [TASK_001, TASK_002, TASK_003] (all parallel if no deps)
Block 2: [TASK_004]
Block 3: [TASK_005, TASK_006] (parallel)
```

**Pros**: Fastest timeline  
**Cons**: May require many resources simultaneously

### Strategy 2: Sequential with Minimal Parallel
```
Block 1: [TASK_001]
Block 2: [TASK_002, TASK_003]
Block 3: [TASK_004]
```

**Pros**: Lower resource contention  
**Cons**: Longer timeline

### Strategy 3: Agent-Aware Parallelization
```
Block 1: [TASK_001 (@nodejs), TASK_002 (@database)]  // Different agents
Block 2: [TASK_003 (@nodejs)]                         // Wait for 001
Block 3: [TASK_004 (@frontend), TASK_005 (@backend)] // Can run parallel
```

**Pros**: Realistic resource allocation  
**Cons**: More complex logic

---

## ⚙️ Configuration

### dependency-resolver.config.json
```json
{
  "strategy": "agent-aware-parallelization",
  "max_parallel_tasks": 5,
  "max_parallel_per_agent": 2,
  "working_hours_per_day": 8,
  "team_size": 5,
  "buffer_percent": 0.1,
  "critical_path_analysis_enabled": true,
  "allow_parallel_same_agent": false
}
```

---

## ✅ Validation Rules

Dependency Resolver must validate:

1. ✅ No circular dependencies
2. ✅ All dependencies exist
3. ✅ Topological sort produces valid ordering
4. ✅ Parallel blocks have no inter-dependencies
5. ✅ Critical path calculable
6. ✅ Timeline estimates reasonable
7. ✅ Resource allocation feasible

---

## 📈 Output Metrics

execution-schedule.json includes:

```json
{
  "metrics": {
    "total_tasks": 42,
    "total_blocks": 12,
    "parallel_blocks": 5,
    "sequential_blocks": 7,
    "critical_path_length": 45,
    "total_duration_sequential": 11,
    "total_duration_parallel": 45,
    "speedup_factor": 4.1,
    "average_block_size": 3.5,
    "max_parallel_tasks": 6
  }
}
```

---

## 🚀 Implementation Notes

### Key Libraries
- `dagre` - Directed acyclic graph library
- `topological-sort` - TS sort implementation
- `topo` - Another topo sort library

### Edge Cases
1. **No dependencies** → All tasks can run in parallel
2. **All dependent** → Everything sequential
3. **Mixed patterns** → Hybrid approach
4. **Resource constraints** → May override parallelization

---

## 📖 Examples

See `examples/example-execution-schedule.json` for complete worked example.

---

**Next**: Read `03_phase-mapper.md` to understand agent phase assignment.
