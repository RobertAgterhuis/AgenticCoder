# Test Scenario S01: Simple MVP

**Scenario ID**: `S01`  
**Name**: Simple MVP - Solo Developer Personal Project  
**Complexity**: Low  
**Purpose**: Validate agent chain for minimal viable product

---

## Project Context

**Project Type**: Personal task manager web app  
**Developer**: Solo developer (1 person)  
**Timeline**: 4-6 weeks  
**Budget**: $50/month (Azure free tier + minimal costs)  
**Users**: ~100-500 users (personal use + friends)

---

## Initial Request (Phase 0 Input)

```markdown
I want to build a simple personal task manager web app where I can:
- Create, edit, and delete tasks
- Mark tasks as complete
- Organize tasks by categories
- Set due dates and priorities
- View tasks in a list or calendar view

I'm a solo developer with React and Node.js experience.
I have a limited budget (~$50/month) and want to launch in 4-6 weeks.
```

---

## Expected Agent Flow

### Phase 0: @plan (Discovery)

**Input**: User's initial request (above)

**Expected Questions** (4-phase discovery):

**Context Phase**:
- Current development environment? → VS Code on Windows
- Existing codebase? → No, starting from scratch
- Team size? → Solo developer
- Timeline? → 4-6 weeks

**Goals Phase**:
- Primary objective? → Launch working MVP
- Success metrics? → 100 active users, <200ms response time
- Must-have features? → CRUD tasks, categories, due dates
- Nice-to-have? → Calendar view, email reminders

**Constraints Phase**:
- Budget? → $50/month maximum
- Technology preferences? → React, Node.js, PostgreSQL
- Deployment? → Azure (familiar platform)
- Compliance requirements? → None

**Validation Phase**:
- Confirm MVP scope: 5 core features
- Confirm timeline: 4-6 weeks realistic
- Confirm tech stack: React + Node.js + PostgreSQL + Azure

**Expected Output**:
```
ProjectPlan/
├── 01-Context/
│   ├── project-overview.md (MVP task manager, solo dev)
│   ├── stakeholders.md (solo developer only)
│   ├── business-requirements.md (5 core features)
│   └── tech-landscape.md (React/Node.js/PostgreSQL)
├── 02-Architecture/
│   ├── system-architecture.md (monolithic, single server)
│   ├── deployment-strategy.md (Azure App Service)
│   └── tech-stack-decisions.md (React 18, Express, PostgreSQL)
└── metadata.json
```

**Validation Criteria**:
- ✅ All 38 files created
- ✅ Scope limited to MVP (5 features, not 20)
- ✅ Timeline realistic (4-6 weeks for solo dev)
- ✅ Budget constraint respected ($50/month)

---

### Phase 1: @doc (Documentation)

**Input**: ProjectPlan folder from @plan

**Expected Output**:
```
ProjectPlan/
├── 03-Documentation/
│   ├── architecture-narrative.md (simple 3-tier: frontend/API/database)
│   ├── api-specification.md (5 REST endpoints: GET/POST/PUT/DELETE tasks)
│   ├── data-model.md (3 tables: users, tasks, categories)
│   ├── user-flows.md (4 flows: login, create task, mark complete, view list)
│   └── deployment-guide.md (Azure deployment steps)
└── Updated metadata.json
```

**Validation Criteria**:
- ✅ 27 documents created (Minimal scaling - skip enterprise docs)
- ✅ API spec has 5-10 endpoints (not 50)
- ✅ Data model has 3-5 tables (normalized, simple)
- ✅ Deployment guide focuses on single-region Azure

---

### Phase 2: @backlog (Backlog Planning)

**Input**: ProjectPlan folder + documentation

**Expected Output**:
```json
{
  "epics": [
    {
      "id": "E1",
      "title": "User Authentication",
      "stories": 5,
      "total_points": 21
    },
    {
      "id": "E2",
      "title": "Task Management",
      "stories": 8,
      "total_points": 34
    },
    {
      "id": "E3",
      "title": "Categories & Organization",
      "stories": 4,
      "total_points": 21
    },
    {
      "id": "E4",
      "title": "Calendar View",
      "stories": 3,
      "total_points": 21
    },
    {
      "id": "E5",
      "title": "Deployment & Monitoring",
      "stories": 3,
      "total_points": 13
    }
  ],
  "total_stories": 23,
  "total_story_points": 110
}
```

**Sample User Stories**:
```
US-001: User Registration (8 points)
As a new user, I want to create an account with email/password
so that I can access my tasks securely

Acceptance Criteria:
- Email validation
- Password strength requirements (8+ chars)
- Confirmation email sent
- User redirected to dashboard after signup

US-002: Create Task (5 points)
As a user, I want to create a new task with title, description, due date, priority
so that I can track things I need to do

US-003: Mark Task Complete (3 points)
As a user, I want to mark tasks as complete
so that I can track my progress
```

**Validation Criteria**:
- ✅ 5-6 epics (focused MVP scope)
- ✅ 20-30 user stories (not 50+)
- ✅ 100-150 story points total (4-6 weeks for solo dev)
- ✅ Stories follow INVEST criteria
- ✅ Fibonacci sizing (1,2,3,5,8,13)

---

### Phase 3: @coordinator (Implementation Plan)

**Input**: Backlog + ProjectPlan

**Expected Output**:
```json
{
  "phases": [
    {
      "phase_number": 1,
      "name": "Foundation Setup",
      "duration_weeks": 1,
      "stories": ["US-001", "US-002", "US-011"],
      "story_points": 25,
      "agents": ["@architect", "@code-architect"]
    },
    {
      "phase_number": 2,
      "name": "Core Features",
      "duration_weeks": 2,
      "stories": ["US-003", "US-004", "US-005", "US-006"],
      "story_points": 34,
      "agents": ["@frontend-specialist", "@backend-specialist"]
    },
    {
      "phase_number": 3,
      "name": "Advanced Features",
      "duration_weeks": 1.5,
      "stories": ["US-007", "US-008", "US-009"],
      "story_points": 28,
      "agents": ["@frontend-specialist", "@backend-specialist"]
    },
    {
      "phase_number": 4,
      "name": "Infrastructure & Deployment",
      "duration_weeks": 0.5,
      "stories": ["US-021", "US-022"],
      "story_points": 13,
      "agents": ["@azure-architect", "@bicep-specialist", "@devops-specialist"]
    },
    {
      "phase_number": 5,
      "name": "Testing & Launch",
      "duration_weeks": 1,
      "stories": ["US-023"],
      "story_points": 10,
      "agents": ["@qa", "@reporter"]
    }
  ],
  "total_duration_weeks": 6,
  "estimated_delivery": "2026-02-24",
  "team_velocity": 20,
  "confidence": "High (solo developer, known tech stack)"
}
```

**Validation Criteria**:
- ✅ 4-6 phases (streamlined for MVP)
- ✅ 6 weeks total duration (matches requirement)
- ✅ Velocity of 18-22 points/week (solo developer)
- ✅ Agent assignments logical (architect first, then specialists)
- ✅ Dependencies respected (auth before task features)

---

### Phase 4: @qa (Quality & Validation Framework)

**Input**: Implementation plan

**Expected Output**:
```json
{
  "testing_strategies": [
    {
      "type": "Unit Testing",
      "coverage_target": 70,
      "tools": ["Jest", "React Testing Library"],
      "focus": "Business logic, API endpoints"
    },
    {
      "type": "Integration Testing",
      "coverage_target": 50,
      "tools": ["Supertest"],
      "focus": "API integration, database operations"
    },
    {
      "type": "E2E Testing",
      "coverage_target": 30,
      "tools": ["Playwright"],
      "focus": "Critical user flows (login, create task, mark complete)"
    }
  ],
  "quality_metrics": [
    {"name": "Code Coverage", "target": 70, "measurement": "Jest coverage report"},
    {"name": "Performance", "target": "<200ms p95", "measurement": "Application Insights"},
    {"name": "Availability", "target": "99%", "measurement": "Azure uptime monitoring"}
  ],
  "validation_gates": [
    {"phase": "Development", "gate": "All unit tests pass"},
    {"phase": "Pre-production", "gate": "E2E tests pass + performance <200ms"},
    {"phase": "Production", "gate": "Zero critical bugs + uptime >99%"}
  ]
}
```

**Validation Criteria**:
- ✅ 3-5 testing strategies (appropriate for MVP)
- ✅ Realistic coverage targets (70% unit, not 100%)
- ✅ Open-source tools (budget constraint)
- ✅ 10-15 quality metrics (focused, not exhaustive)
- ✅ 3-5 validation gates (pragmatic for solo dev)

---

### Phase 5: @reporter (Progress Tracking)

**Input**: Implementation plan + quality framework

**Expected Output**:
```json
{
  "sprint_plan": [
    {
      "sprint": 1,
      "duration_weeks": 2,
      "planned_points": 40,
      "stories": ["US-001", "US-002", "US-003", "US-011"]
    },
    {
      "sprint": 2,
      "duration_weeks": 2,
      "planned_points": 40,
      "stories": ["US-004", "US-005", "US-006", "US-007"]
    },
    {
      "sprint": 3,
      "duration_weeks": 2,
      "planned_points": 30,
      "stories": ["US-008", "US-009", "US-021", "US-022", "US-023"]
    }
  ],
  "tracking_metrics": [
    {"metric": "Velocity", "target": 20, "frequency": "per sprint"},
    {"metric": "Story completion rate", "target": 95, "frequency": "per sprint"},
    {"metric": "Bug count", "target": "<5", "frequency": "weekly"}
  ],
  "report_schedule": {
    "weekly_summary": "Every Monday",
    "sprint_retrospective": "End of each 2-week sprint",
    "final_report": "2026-02-24"
  }
}
```

**Validation Criteria**:
- ✅ Report templates appropriate for solo dev (lightweight)
- ✅ 3 sprints (2 weeks each = 6 weeks total)
- ✅ Velocity tracking realistic (20 points/sprint)
- ✅ Minimal overhead (solo dev doesn't need complex reporting)

---

### Phase 6: @architect (Architecture Design)

**Input**: ProjectPlan + implementation plan

**Expected Output**:
```json
{
  "architecture_style": "Monolithic",
  "architecture_decisions": [
    {
      "id": "ADR-001",
      "title": "Use Monolithic Architecture",
      "context": "Solo developer, MVP scope, 100-500 users",
      "decision": "Single Node.js server handles all requests",
      "rationale": "Simplest to develop, deploy, and maintain for solo dev",
      "consequences": {
        "positive": ["Fast development", "Easy debugging", "Low operational complexity"],
        "negative": ["Harder to scale later (acceptable for MVP)"]
      }
    },
    {
      "id": "ADR-002",
      "title": "Use PostgreSQL for Data Storage",
      "decision": "Single PostgreSQL database (Azure Database for PostgreSQL)",
      "rationale": "ACID transactions, relational data, team experience"
    },
    {
      "id": "ADR-003",
      "title": "Use React SPA for Frontend",
      "decision": "React 18 single-page application with Vite",
      "rationale": "Team experience, fast development, rich ecosystem"
    },
    {
      "id": "ADR-004",
      "title": "Deploy to Azure App Service",
      "decision": "Basic tier (B1) App Service",
      "rationale": "Managed platform, $15/month, auto-scaling available later"
    },
    {
      "id": "ADR-005",
      "title": "No Caching Layer for MVP",
      "decision": "Skip Redis/caching for initial launch",
      "rationale": "Low traffic (<500 users), YAGNI principle, can add later if needed"
    }
  ],
  "technology_choices": {
    "frontend": "React 18 + TypeScript + Vite + Tailwind CSS",
    "backend": "Node.js 20 + Express + TypeScript",
    "database": "PostgreSQL 15",
    "authentication": "JWT (jsonwebtoken)",
    "deployment": "Azure App Service (B1 tier)"
  },
  "estimated_monthly_cost": "$35 ($15 App Service + $10 PostgreSQL + $10 storage/misc)"
}
```

**Validation Criteria**:
- ✅ Architecture style = Monolithic (appropriate for solo dev MVP)
- ✅ 5+ ADRs with clear rationale
- ✅ Technology choices match team experience (React, Node.js)
- ✅ Cost estimate within budget ($35 < $50)
- ✅ No over-engineering (no Kubernetes, microservices, etc.)

---

### Phase 7: @code-architect (Code Structure)

**Input**: Architecture decisions

**Expected Output**:
```
Folder Structure:
task-manager/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   └── CategoryFilter.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── CalendarPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── hooks/
│   │   │   └── useTasks.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   └── tasks.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── tasks.service.ts
│   │   ├── repositories/
│   │   │   └── tasks.repository.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── models/
│   │   │   └── task.model.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
└── README.md

Design Patterns Applied:
1. Repository Pattern (data access abstraction)
2. Service Layer (business logic)
3. Dependency Injection (services injected into routes)

API Contracts:
POST   /api/auth/register
POST   /api/auth/login
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/categories
POST   /api/categories
```

**Validation Criteria**:
- ✅ Clean separation: frontend/ and backend/ folders
- ✅ 3+ design patterns applied (Repository, Service, DI)
- ✅ 8-12 API endpoints (MVP scope)
- ✅ Testing structure included (tests/ folders)

---

### Phase 8-9: @azure-architect + @bicep-specialist

**Expected Output** (combined):

**Azure Resources**:
```bicep
// main.bicep
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: 'taskmanager-plan'
  location: 'eastus'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
}

resource appService 'Microsoft.Web/sites@2021-02-01' = {
  name: 'taskmanager-api'
  properties: {
    serverFarmId: appServicePlan.id
  }
}

resource postgresqlServer 'Microsoft.DBforPostgreSQL/flexibleServers@2021-06-01' = {
  name: 'taskmanager-db'
  location: 'eastus'
  sku: {
    name: 'B_Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    storage: {
      storageSizeGB: 32
    }
  }
}

// Estimated cost: $35/month
```

**Validation Criteria**:
- ✅ 3 Azure resources (App Service Plan, App Service, PostgreSQL)
- ✅ Basic/Burstable tiers (cost-optimized)
- ✅ Single region deployment
- ✅ Cost breakdown: $15 + $10 + $10 = $35 < $50 budget

---

### Phase 10-11: @frontend-specialist + @backend-specialist

**Expected Outputs**:

**Frontend**: 12 components, 3 pages, routing, API client  
**Backend**: 3 services, 3 repositories, 8 API endpoints, JWT auth

**Generated Frontend Code Sample** (React Component):
```typescript
// frontend/src/components/TaskForm.tsx
import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';

interface TaskFormProps {
  onTaskCreated: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  const { createTask, isLoading } = useTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask({
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
    });
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    onTaskCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full border rounded px-3 py-2"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full border rounded px-3 py-2"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as any)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="low">Low Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="high">High Priority</option>
      </select>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 text-white py-2 rounded disabled:bg-gray-400"
      >
        {isLoading ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
};
```

**Generated Backend Code Sample** (Express API):
```typescript
// backend/src/routes/tasks.routes.ts
import express from 'express';
import { TaskService } from '../services/tasks.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const taskService = new TaskService();

// GET /api/tasks - List user's tasks
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await taskService.getUserTasks(req.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Create new task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, dueDate, priority, categoryId } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await taskService.createTask({
      userId: req.userId,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      categoryId,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.userId, req.body);
    res.json(task);
  } catch (error) {
    res.status(404).json({ error: 'Task not found' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id, req.userId);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Task not found' });
  }
});

export default router;
```

**Generated Database Schema** (SQL):
```sql
-- Database schema for task manager MVP
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority VARCHAR(10) DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

**Validation Criteria**:
- ✅ 10+ frontend components created
- ✅ 3+ pages (Login, Dashboard, Calendar)
- ✅ State management (Zustand via useTasks hook)
- ✅ API integration complete (TaskForm calls createTask)
- ✅ 3+ services, 3+ repositories (TaskService shown)
- ✅ 5+ API endpoints implemented (GET/POST/PUT/DELETE shown)
- ✅ Authentication middleware working (authMiddleware enforced)

---

### Phase 12: @devops-specialist

**Expected Output**:
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Build Backend
        run: |
          cd backend
          npm ci
          npm run build
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: taskmanager-api
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
```

**Generated Bicep Infrastructure Code** (IaC):
```bicep
// infrastructure/main.bicep - Azure resource definitions
param location string = 'eastus'
param environment string = 'prod'
param appName string = 'taskmanager'

// App Service Plan (Basic B1 tier - $15/month)
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: '${appName}-plan-${environment}'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// App Service for Node.js backend
resource appService 'Microsoft.Web/sites@2021-02-01' = {
  name: '${appName}-api-${environment}'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appSettings: [
        {
          name: 'DATABASE_URL'
          value: 'postgresql://${postgresqlServer.properties.administratorLogin}:${postgresqlAdminPassword}@${postgresqlServer.properties.fullyQualifiedDomainName}:5432/${databaseName}?schema=public'
        }
        {
          name: 'JWT_SECRET'
          value: jwtSecret
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
      ]
    }
  }
}

// PostgreSQL Database (Burstable B1ms tier - $10/month)
resource postgresqlServer 'Microsoft.DBforPostgreSQL/flexibleServers@2021-06-01' = {
  name: '${appName}-db-${environment}'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: 'psqladmin'
    administratorLoginPassword: postgresqlAdminPassword
    storage: {
      storageSizeGB: 32
    }
    version: '15'
  }
}

// PostgreSQL Database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2021-06-01' = {
  name: databaseName
  parent: postgresqlServer
  properties: {}
}

// Output deployment details
output apiUrl string = 'https://${appService.properties.defaultHostName}'
output databaseUrl string = postgresqlServer.properties.fullyQualifiedDomainName
```

**Monitoring Setup** (Application Insights):
```typescript
// backend/src/server.ts - Application Insights integration
import appInsights from 'applicationinsights';

appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATION_KEY)
  .setAutoCollectConsoleAppenders(true)
  .start();

const client = appInsights.defaultClient;

// Health check endpoint for Azure monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Custom event tracking
app.post('/api/tasks', async (req, res) => {
  try {
    const task = await createTask(req.body);
    client.trackEvent({
      name: 'TaskCreated',
      properties: {
        userId: req.userId,
        taskId: task.id,
        priority: task.priority
      }
    });
    res.status(201).json(task);
  } catch (error) {
    client.trackException({ exception: error as Error });
    res.status(500).json({ error: 'Failed to create task' });
  }
});
```

**Monitoring**:
- Application Insights configured for performance monitoring
- Health check endpoint: `/api/health`
- Alerts configured:
  - High CPU (>80%)
  - Database connection errors
  - Application exceptions
  - Response time >500ms (p95)
- Log analytics for troubleshooting

**Validation Criteria**:
- ✅ 1 CI/CD pipeline (build + deploy, <10 min deployment)
- ✅ Infrastructure as Code (Bicep, fully automated)
- ✅ Monitoring configured (Application Insights)
- ✅ Cost breakdown: $15 App Service + $10 PostgreSQL + $10 storage = $35/month < $50 budget
- ✅ Secrets management (JWT_SECRET, DB passwords via KeyVault)
- ✅ Auto-healing enabled for App Service

---

## Success Criteria

**Overall Validation**:
- ✅ All 13 agents executed in correct sequence
- ✅ Total timeline: 6 weeks (matches requirement)
- ✅ Total cost: $35/month (within $50 budget)
- ✅ Scope: 23 user stories, 110 story points (realistic for solo dev)
- ✅ Architecture: Monolithic (appropriate for MVP)
- ✅ Deployment: Single App Service (simple, manageable)

**Deliverables**:
1. ProjectPlan folder (38+ files)
2. Backlog (23 user stories, 5 epics)
3. Implementation plan (5 phases, 6 weeks)
4. Architecture decisions (5 ADRs)
5. Code structure (frontend + backend folders)
6. Infrastructure code (main.bicep + 3 modules)
7. CI/CD pipeline (GitHub Actions)
8. Deployed application (Azure)

**Quality Gates**:
- 70% unit test coverage
- <200ms p95 response time
- 99% uptime
- Zero critical bugs at launch

---

## Filename: `S01-simple-mvp.scenario.md`
