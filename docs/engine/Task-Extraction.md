# Task Extraction Engine

Intelligent extraction and decomposition of tasks from requirements and user input.

## Overview

The Task Extraction Engine:
- **Parses Requirements** - Extracts actionable items from documents
- **Decomposes Tasks** - Breaks large tasks into subtasks
- **Maps to Agents** - Assigns tasks to appropriate agents
- **Prioritizes Work** - Orders tasks by dependency and importance
- **Tracks Progress** - Monitors task completion

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Task Extraction Engine                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Parser    │  │ Decomposer  │  │   Mapper    │         │
│  │   Module    │  │   Module    │  │   Module    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Prioritizer │  │   Tracker   │  │  Backlog    │         │
│  │   Module    │  │   Module    │  │   Store     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Task Structure

### Task Definition

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  
  // Classification
  category: 'planning' | 'architecture' | 'implementation' | 'testing' | 'deployment';
  complexity: 'low' | 'medium' | 'high';
  effort: number;  // Story points or hours
  
  // Assignment
  assignedAgent: string;
  requiredSkills: string[];
  phase: number;
  
  // Dependencies
  dependsOn: string[];
  blockedBy: string[];
  
  // Status
  status: TaskStatus;
  progress: number;  // 0-100
  
  // Artifacts
  inputs: string[];
  outputs: string[];
  
  // Metadata
  source: {
    document: string;
    location: string;
  };
  created: Date;
  updated: Date;
}

type TaskType = 
  | 'feature'
  | 'technical'
  | 'documentation'
  | 'testing'
  | 'infrastructure'
  | 'bugfix';

type TaskStatus = 
  | 'backlog'
  | 'ready'
  | 'in-progress'
  | 'review'
  | 'done'
  | 'blocked';
```

### Task Hierarchy

```
Epic
└── Feature
    └── User Story
        └── Task
            └── Subtask
```

## Parser Module

### Supported Sources

| Source | Format | Example |
|--------|--------|---------|
| Requirements Doc | Markdown | `requirements.md` |
| User Stories | Gherkin | `features/*.feature` |
| Issue Tracker | JSON | GitHub Issues |
| Chat Input | Natural Language | User prompts |
| Architecture | Markdown | `architecture.md` |

### Parsing Process

```typescript
class TaskParser {
  async parse(source: Source): Promise<RawTask[]> {
    switch (source.type) {
      case 'markdown':
        return this.parseMarkdown(source.content);
      case 'gherkin':
        return this.parseGherkin(source.content);
      case 'json':
        return this.parseJson(source.content);
      case 'natural':
        return this.parseNaturalLanguage(source.content);
    }
  }
  
  private async parseMarkdown(content: string): Promise<RawTask[]> {
    const tasks: RawTask[] = [];
    
    // Extract from headers
    const headers = content.match(/^#{1,3}\s+(.+)$/gm);
    
    // Extract from lists
    const listItems = content.match(/^[-*]\s+(.+)$/gm);
    
    // Extract from checkboxes
    const checkboxes = content.match(/^[-*]\s+\[([ x])\]\s+(.+)$/gm);
    
    // Analyze and structure
    return this.structureTasks(headers, listItems, checkboxes);
  }
}
```

### Extraction Patterns

```typescript
const extractionPatterns = {
  // Feature indicators
  feature: [
    /as a (.+), i want (.+) so that (.+)/i,
    /implement (.+)/i,
    /create (.+)/i,
    /add (.+)/i
  ],
  
  // Technical task indicators
  technical: [
    /setup (.+)/i,
    /configure (.+)/i,
    /integrate (.+)/i,
    /refactor (.+)/i
  ],
  
  // Testing indicators
  testing: [
    /test (.+)/i,
    /verify (.+)/i,
    /validate (.+)/i
  ],
  
  // Documentation indicators
  documentation: [
    /document (.+)/i,
    /write (.+) docs/i,
    /update (.+) documentation/i
  ]
};
```

## Decomposer Module

### Decomposition Rules

```typescript
interface DecompositionRule {
  condition: (task: RawTask) => boolean;
  decompose: (task: RawTask) => Task[];
}

const decompositionRules: DecompositionRule[] = [
  {
    // Large features into stories
    condition: (task) => task.type === 'feature' && task.complexity === 'high',
    decompose: (task) => this.decomposeFeature(task)
  },
  {
    // Stories into tasks
    condition: (task) => task.type === 'story' && task.effort > 5,
    decompose: (task) => this.decomposeStory(task)
  },
  {
    // Technical into subtasks
    condition: (task) => task.type === 'technical' && task.complexity === 'high',
    decompose: (task) => this.decomposeTechnical(task)
  }
];
```

### Decomposition Strategies

**Feature Decomposition:**
```
Feature: User Authentication
├── Story: User can register
│   ├── Task: Create registration form
│   ├── Task: Implement validation
│   ├── Task: Create user service
│   └── Task: Write unit tests
├── Story: User can login
│   ├── Task: Create login form
│   ├── Task: Implement JWT tokens
│   └── Task: Create auth middleware
└── Story: User can reset password
    ├── Task: Create reset form
    └── Task: Implement email sending
```

**Technical Decomposition:**
```
Technical: Setup CI/CD Pipeline
├── Subtask: Create GitHub Actions workflow
├── Subtask: Configure build steps
├── Subtask: Setup test automation
├── Subtask: Configure deployment
└── Subtask: Add status badges
```

## Mapper Module

### Agent Mapping

```typescript
class TaskMapper {
  private agentCapabilities: Map<string, Capability[]>;
  
  async mapToAgent(task: Task): Promise<string> {
    // Find agents with required skills
    const candidates = this.findCandidates(task.requiredSkills);
    
    // Score candidates
    const scored = candidates.map(agent => ({
      agent,
      score: this.calculateScore(agent, task)
    }));
    
    // Select best match
    scored.sort((a, b) => b.score - a.score);
    return scored[0].agent;
  }
  
  private calculateScore(agent: string, task: Task): number {
    let score = 0;
    
    // Skill match
    const skills = this.agentCapabilities.get(agent);
    for (const required of task.requiredSkills) {
      if (skills.includes(required)) score += 10;
    }
    
    // Complexity match
    if (this.complexityMatch(agent, task.complexity)) score += 5;
    
    // Category match
    if (this.categoryMatch(agent, task.category)) score += 5;
    
    return score;
  }
}
```

### Mapping Rules

| Task Category | Primary Agent | Fallback |
|---------------|---------------|----------|
| Planning | @plan | @doc |
| Architecture | @architect | @code-architect |
| Frontend | @react-specialist | @nextjs-specialist |
| Backend .NET | @dotnet-specialist | @code-architect |
| Backend Node | @nodejs-specialist | @code-architect |
| Database | @database-specialist | @sql-specialist |
| Azure | @azure-architect | @bicep-specialist |
| Testing | @qa | @devops-specialist |
| Documentation | @doc | @reporter |

## Prioritizer Module

### Priority Factors

```typescript
interface PriorityFactors {
  dependency: number;      // Blocking others = higher
  complexity: number;      // Lower complexity = higher (quick wins)
  business: number;        // Business value
  risk: number;            // Risk mitigation
  effort: number;          // Lower effort = higher (quick wins)
}

class TaskPrioritizer {
  calculate(task: Task, factors: PriorityFactors): number {
    const weights = {
      dependency: 0.3,
      complexity: 0.15,
      business: 0.25,
      risk: 0.2,
      effort: 0.1
    };
    
    return (
      factors.dependency * weights.dependency +
      factors.complexity * weights.complexity +
      factors.business * weights.business +
      factors.risk * weights.risk +
      factors.effort * weights.effort
    );
  }
}
```

### Priority Queue

```typescript
class PriorityQueue {
  private tasks: Task[] = [];
  
  enqueue(task: Task): void {
    this.tasks.push(task);
    this.tasks.sort((a, b) => b.priority - a.priority);
  }
  
  dequeue(): Task | undefined {
    return this.tasks.shift();
  }
  
  getReady(): Task[] {
    return this.tasks.filter(t => 
      t.status === 'ready' && 
      this.dependenciesMet(t)
    );
  }
}
```

## Tracker Module

### Progress Tracking

```typescript
interface TaskProgress {
  taskId: string;
  status: TaskStatus;
  progress: number;
  
  timeline: {
    created: Date;
    started?: Date;
    completed?: Date;
  };
  
  metrics: {
    estimatedEffort: number;
    actualEffort: number;
    rework: number;
  };
  
  history: StatusChange[];
}

interface StatusChange {
  from: TaskStatus;
  to: TaskStatus;
  timestamp: Date;
  reason?: string;
}
```

### Tracking Events

```typescript
tracker.on('task:started', (task) => {
  console.log(`Started: ${task.title}`);
});

tracker.on('task:completed', (task) => {
  console.log(`Completed: ${task.title} in ${task.actualEffort}h`);
});

tracker.on('task:blocked', (task, reason) => {
  console.log(`Blocked: ${task.title} - ${reason}`);
});
```

## Usage

### CLI Commands

```bash
# Extract tasks from document
node bin/agentic.js tasks extract --source requirements.md

# Show task backlog
node bin/agentic.js tasks list

# Show task details
node bin/agentic.js tasks show TASK-123

# Update task status
node bin/agentic.js tasks update TASK-123 --status done

# View dependencies
node bin/agentic.js tasks deps TASK-123
```

### Programmatic API

```typescript
const engine = new TaskExtractionEngine();

// Extract from document
const tasks = await engine.extract('requirements.md');

// Decompose complex tasks
const decomposed = await engine.decompose(tasks);

// Map to agents
const mapped = await engine.mapToAgents(decomposed);

// Prioritize
const prioritized = await engine.prioritize(mapped);

// Get next tasks
const nextTasks = prioritized.getReady();
```

## Integration

### With Backlog Agent

```typescript
const backlogAgent = agents.get('backlog');

backlogAgent.on('user-stories:generated', async (stories) => {
  for (const story of stories) {
    await taskEngine.addTask(story);
  }
});
```

### With Workflow Engine

```typescript
engine.on('phase:started', async (phase) => {
  const tasks = await taskEngine.getTasksForPhase(phase);
  await engine.scheduleTasks(tasks);
});
```

## Configuration

```yaml
# .agentic/config/tasks.yaml
tasks:
  extraction:
    sources:
      - requirements/**/*.md
      - features/**/*.feature
      - .github/issues/*.json
      
  decomposition:
    maxDepth: 3
    minEffort: 0.5
    maxEffort: 8
    
  mapping:
    strictSkillMatch: false
    allowFallback: true
    
  priority:
    weights:
      dependency: 0.3
      business: 0.25
      risk: 0.2
      complexity: 0.15
      effort: 0.1
      
  tracking:
    persistence: '.agentic/tasks/'
    historyRetention: '90d'
```

## Next Steps

- [Workflow Engine](Workflow-Engine) - Task execution
- [Agent Catalog](../agents/Catalog) - Task assignments
- [Backlog Agent](../agents/Catalog#backlog) - Story generation
