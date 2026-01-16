# Phase 4: Integration

**Duration:** 1 week  
**Status:** ⬜ Not Started  
**Dependencies:** Phase 1-3

---

## 🎯 Phase Objective

Integrate the Code Generation Engine with the existing AgenticCoder orchestration system, enabling agents to trigger and control code generation.

---

## 📋 Tasks

### Task 4.1: Agent Integration Interface

**Priority:** 🔴 Critical  
**Estimated:** 2 days

**Description:**  
Create the interface that allows agents to request code generation through the orchestration engine.

**Implementation:**

```javascript
// agents/core/generation/AgentGenerationInterface.js

class AgentGenerationInterface {
  constructor(codeGenerationEngine, messageBus) {
    this.engine = codeGenerationEngine;
    this.messageBus = messageBus;
    
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    // Listen for generation requests from agents
    this.messageBus.subscribe('generation:request', this.handleRequest.bind(this));
    this.messageBus.subscribe('generation:file', this.handleFileRequest.bind(this));
  }

  // Handle full project generation request
  async handleRequest(message) {
    const { agentId, context, options } = message;
    
    try {
      const result = await this.engine.generate(context);
      
      this.messageBus.publish('generation:complete', {
        requestId: message.id,
        agentId,
        result,
      });
    } catch (error) {
      this.messageBus.publish('generation:error', {
        requestId: message.id,
        agentId,
        error: error.message,
      });
    }
  }

  // Handle single file generation request
  async handleFileRequest(message) {
    const { agentId, context, fileSpec } = message;
    
    const result = await this.engine.generateFile(context, fileSpec);
    
    this.messageBus.publish('generation:file:complete', {
      requestId: message.id,
      agentId,
      file: result,
    });
  }

  // Request generation (for agent use)
  async requestGeneration(agentId, context) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      
      const handler = (message) => {
        if (message.requestId === requestId) {
          this.messageBus.unsubscribe('generation:complete', handler);
          this.messageBus.unsubscribe('generation:error', handler);
          
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.result);
          }
        }
      };
      
      this.messageBus.subscribe('generation:complete', handler);
      this.messageBus.subscribe('generation:error', handler);
      
      this.messageBus.publish('generation:request', {
        id: requestId,
        agentId,
        context,
      });
    });
  }
}
```

**Acceptance Criteria:**
- [ ] Agents can request code generation via message bus
- [ ] Async request/response pattern works
- [ ] Error handling propagates to agents
- [ ] Progress updates available
- [ ] Unit tests

**Files to Create:**
- `agents/core/generation/AgentGenerationInterface.js`
- `agents/core/generation/AgentGenerationInterface.test.js`

---

### Task 4.2: Workflow Integration

**Priority:** 🔴 Critical  
**Estimated:** 2 days

**Description:**  
Integrate code generation into the existing 16-phase workflow, adding generation as a core capability.

**Implementation:**

```javascript
// agents/core/generation/WorkflowIntegration.js

class WorkflowIntegration {
  constructor(workflowEngine, codeGenerationEngine) {
    this.workflow = workflowEngine;
    this.generation = codeGenerationEngine;
    
    this.registerGenerationPhases();
  }

  registerGenerationPhases() {
    // Register generation steps for each relevant phase
    
    // Phase 4: Backend Development
    this.workflow.registerStep('phase:4:generate', async (context) => {
      return this.generation.generators.get('express').generate(context);
    });
    
    // Phase 5: Frontend Development
    this.workflow.registerStep('phase:5:generate', async (context) => {
      return this.generation.generators.get('react').generate(context);
    });
    
    // Phase 6: Database
    this.workflow.registerStep('phase:6:generate', async (context) => {
      return this.generation.generators.get('postgresql').generate(context);
    });
    
    // Phase 9: Infrastructure
    this.workflow.registerStep('phase:9:generate', async (context) => {
      return this.generation.generators.get('bicep').generate(context);
    });
  }

  // Get generation status for workflow
  getGenerationStatus(context) {
    return {
      filesGenerated: context.generatedFiles.length,
      errors: context.errors.length,
      phases: this.getPhaseStatus(context),
    };
  }
}
```

**Workflow Phase Mapping:**

| Phase | Name | Generation Actions |
|-------|------|-------------------|
| 1 | Input Analysis | - |
| 2 | Architecture | Architecture pattern selection |
| 3 | Planning | - |
| 4 | Backend Dev | `ExpressGenerator`, `NestJSGenerator`, `FastAPIGenerator`, `DotNetGenerator` |
| 5 | Frontend Dev | `ReactGenerator`, `VueGenerator`, `NextJSGenerator`, `AngularGenerator` |
| 6 | Database | `PostgreSQLGenerator`, `AzureSQLGenerator`, `CosmosDBGenerator`, `SQLServerGenerator` |
| 7 | Testing | Test file generation |
| 8 | Review | - |
| 9 | Infrastructure | `BicepGenerator`, `EntraIDGenerator`, `KeyVaultGenerator`, `StorageGenerator`, `NetworkingGenerator`, `MonitoringGenerator`, `ContainerAppsGenerator` |
| 10 | CI/CD | Workflow generation |
| 11 | Security | `EntraIDGenerator`, `KeyVaultGenerator` |
| 12 | Documentation | README generation |
| 13-16 | Deployment | - |

**Generator-to-Agent Mapping:**

| Generator | Primary Agent | Skills Used |
|-----------|---------------|-------------|
| ReactGenerator | @react-specialist | react-patterns |
| VueGenerator | @vue-specialist | vue-patterns |
| NextJSGenerator | @nextjs-specialist | nextjs-patterns |
| AngularGenerator | @angular-specialist | angular-patterns |
| ExpressGenerator | @nodejs-specialist | express-patterns |
| NestJSGenerator | @nodejs-specialist | nestjs-patterns |
| FastAPIGenerator | @python-specialist | fastapi-patterns |
| DotNetGenerator | @backend-dev | dotnet-patterns |
| PostgreSQLGenerator | @database-specialist | database-design |
| AzureSQLGenerator | @azure-sql-specialist | azure-sql-patterns, tsql-programming |
| CosmosDBGenerator | @cosmos-db-specialist | cosmos-db-patterns |
| BicepGenerator | @bicep-specialist | azure-bicep-mastery |
| EntraIDGenerator | @entra-id-specialist | entra-id-patterns |
| KeyVaultGenerator | @keyvault-specialist | keyvault-patterns |
| StorageGenerator | @storage-specialist | azure-storage-patterns |
| NetworkingGenerator | @networking-specialist | azure-networking-patterns |
| MonitoringGenerator | @monitoring-specialist | azure-monitoring-patterns |
| MicroservicesGenerator | @microservices-architect | microservices-patterns |
| ServerlessGenerator | @serverless-specialist | serverless-patterns |
| EventDrivenGenerator | @event-driven-architect | event-driven-patterns |
| ContainerAppsGenerator | @container-specialist | container-apps-patterns |

**Acceptance Criteria:**
- [ ] Generation integrated into workflow phases
- [ ] Phase transitions trigger correct generators
- [ ] Context flows through workflow to generators
- [ ] Status reporting works
- [ ] Integration tests with workflow engine

**Files to Create:**
- `agents/core/generation/WorkflowIntegration.js`
- `agents/core/generation/WorkflowIntegration.test.js`

---

### Task 4.3: Agent Implementations

**Priority:** 🔴 Critical  
**Estimated:** 3 days

**Description:**  
Update existing agent definitions to use the code generation engine.

**Implementation:**

```javascript
// agents/core/agents/FrontendSpecialistAgent.js

class FrontendSpecialistAgent extends BaseAgent {
  constructor(generationInterface) {
    super('@frontend-specialist');
    this.generation = generationInterface;
  }

  async execute(context, task) {
    switch (task.type) {
      case 'generate:component':
        return this.generateComponent(context, task);
      case 'generate:page':
        return this.generatePage(context, task);
      case 'generate:all':
        return this.generateAll(context);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  async generateComponent(context, task) {
    const { componentSpec } = task;
    
    // Use skills to enhance generation
    const skills = await this.loadSkills(['react-patterns', 'state-management']);
    
    // Request generation
    const result = await this.generation.requestGeneration(
      this.name,
      {
        ...context,
        skills,
        componentSpec,
      }
    );
    
    return result;
  }

  async generateAll(context) {
    return this.generation.requestGeneration(this.name, context);
  }
}
```

**Agents to Implement:**

| Agent | File | Generation Capability |
|-------|------|----------------------|
| @frontend-specialist | FrontendSpecialistAgent.js | React components, pages |
| @backend-specialist | BackendSpecialistAgent.js | Express routes, services |
| @database-specialist | DatabaseSpecialistAgent.js | Schema, migrations |
| @bicep-specialist | BicepSpecialistAgent.js | Infrastructure code |
| @qa | QAAgent.js | Test files |

**Acceptance Criteria:**
- [ ] 5 agents implemented with generation capability
- [ ] Agents use skills for context
- [ ] Agents integrate with message bus
- [ ] Agents report progress
- [ ] Unit tests per agent

**Files to Create:**
- `agents/core/agents/FrontendSpecialistAgent.js`
- `agents/core/agents/BackendSpecialistAgent.js`
- `agents/core/agents/DatabaseSpecialistAgent.js`
- `agents/core/agents/BicepSpecialistAgent.js`
- `agents/core/agents/QAAgent.js`
- Tests for each agent

---

### Task 4.4: Skill Integration

**Priority:** 🟡 High  
**Estimated:** 1 day

**Description:**  
Enable skills to be loaded and applied during code generation.

**Implementation:**

```javascript
// agents/core/generation/SkillIntegration.js

class SkillIntegration {
  constructor(skillsPath) {
    this.skillsPath = skillsPath;
    this.skills = new Map();
  }

  // Load skill from .skill.md file
  async loadSkill(skillName) {
    if (this.skills.has(skillName)) {
      return this.skills.get(skillName);
    }
    
    const skillPath = path.join(this.skillsPath, `${skillName}.skill.md`);
    const content = await fs.readFile(skillPath, 'utf-8');
    const skill = this.parseSkill(content);
    
    this.skills.set(skillName, skill);
    return skill;
  }

  // Parse skill markdown into structured data
  parseSkill(content) {
    // Extract sections: Purpose, Patterns, Best Practices, Anti-Patterns
    return {
      purpose: this.extractSection(content, 'Purpose'),
      patterns: this.extractSection(content, 'Patterns'),
      bestPractices: this.extractSection(content, 'Best Practices'),
      antiPatterns: this.extractSection(content, 'Anti-Patterns'),
    };
  }

  // Get relevant skills for a framework/task
  async getSkillsForContext(framework, task) {
    const skillMap = {
      react: ['react-patterns', 'state-management', 'error-handling'],
      express: ['dotnet-webapi', 'error-handling'],  // patterns apply
      postgresql: ['sql-schema-design', 'entity-framework'],
      bicep: ['infrastructure-automation', 'azure-pipelines'],
    };
    
    const skillNames = skillMap[framework] || [];
    return Promise.all(skillNames.map(name => this.loadSkill(name)));
  }

  // Format skills for prompt injection
  formatSkillsForPrompt(skills) {
    return skills.map(skill => `
## ${skill.name}
${skill.bestPractices}

### Patterns to Follow:
${skill.patterns}

### Anti-Patterns to Avoid:
${skill.antiPatterns}
`).join('\n\n');
  }
}
```

**Acceptance Criteria:**
- [ ] Skills loaded from .skill.md files
- [ ] Skills parsed into structured data
- [ ] Skills injected into generation prompts
- [ ] Skill caching for performance
- [ ] Unit tests

**Files to Create:**
- `agents/core/generation/SkillIntegration.js`
- `agents/core/generation/SkillIntegration.test.js`

---

### Task 4.5: Output Management

**Priority:** 🟡 High  
**Estimated:** 1 day

**Description:**  
Manage generated output: file organization, conflict resolution, and cleanup.

**Implementation:**

```javascript
// agents/core/generation/OutputManager.js

class OutputManager {
  constructor(fileWriter) {
    this.fileWriter = fileWriter;
  }

  // Prepare output directory
  async prepareOutput(projectName, options = {}) {
    const outputPath = path.join('output', projectName);
    
    if (options.clean) {
      await this.fileWriter.delete(outputPath);
    }
    
    await this.fileWriter.ensureDirectory(outputPath);
    
    return outputPath;
  }

  // Check for conflicts with existing files
  async checkConflicts(outputPath, files) {
    const conflicts = [];
    
    for (const file of files) {
      const fullPath = path.join(outputPath, file.path);
      if (await this.fileWriter.fileExists(fullPath)) {
        conflicts.push(file.path);
      }
    }
    
    return conflicts;
  }

  // Write all generated files
  async writeOutput(outputPath, files, options = {}) {
    const results = {
      written: [],
      skipped: [],
      errors: [],
    };
    
    for (const file of files) {
      try {
        const fullPath = path.join(outputPath, file.path);
        
        if (options.skipExisting && await this.fileWriter.fileExists(fullPath)) {
          results.skipped.push(file.path);
          continue;
        }
        
        await this.fileWriter.writeFile(fullPath, file.content);
        results.written.push(file.path);
      } catch (error) {
        results.errors.push({ path: file.path, error: error.message });
      }
    }
    
    return results;
  }

  // Generate output summary
  generateSummary(results) {
    return {
      totalFiles: results.written.length + results.skipped.length,
      written: results.written.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
      files: results.written,
    };
  }
}
```

**Acceptance Criteria:**
- [ ] Output directory management
- [ ] Conflict detection
- [ ] Skip existing option
- [ ] Clean output option
- [ ] Summary generation
- [ ] Unit tests

**Files to Create:**
- `agents/core/generation/OutputManager.js`
- `agents/core/generation/OutputManager.test.js`

---

## 📁 Files Created This Phase

```
agents/core/generation/
├── AgentGenerationInterface.js
├── AgentGenerationInterface.test.js
├── WorkflowIntegration.js
├── WorkflowIntegration.test.js
├── SkillIntegration.js
├── SkillIntegration.test.js
├── OutputManager.js
└── OutputManager.test.js

agents/core/agents/
│   # Existing Core Agents (updated)
├── FrontendSpecialistAgent.js          # Routes to React/Vue/Next/Angular
├── FrontendSpecialistAgent.test.js
├── BackendSpecialistAgent.js           # Routes to Express/NestJS/FastAPI/.NET
├── BackendSpecialistAgent.test.js
├── DatabaseSpecialistAgent.js          # Routes to PostgreSQL/Azure SQL/Cosmos/SQL Server
├── DatabaseSpecialistAgent.test.js
├── BicepSpecialistAgent.js             # Routes to all Azure infrastructure generators
├── BicepSpecialistAgent.test.js
│
│   # New Agent Integrations (from AgentSkillExpansion)
├── VueSpecialistAgent.js
├── NextJSSpecialistAgent.js
├── AngularSpecialistAgent.js
├── NestJSSpecialistAgent.js
├── FastAPISpecialistAgent.js
├── AzureSQLSpecialistAgent.js
├── CosmosDBSpecialistAgent.js
├── MicroservicesArchitectAgent.js
├── ServerlessSpecialistAgent.js
├── EventDrivenArchitectAgent.js
├── EntraIDSpecialistAgent.js
├── KeyVaultSpecialistAgent.js
├── StorageSpecialistAgent.js
├── NetworkingSpecialistAgent.js
├── MonitoringSpecialistAgent.js
├── ContainerSpecialistAgent.js
└── QAAgent.js
```

---

## ✅ Phase Completion Checklist

### Core Integration
- [ ] AgentGenerationInterface connects agents to generation
- [ ] WorkflowIntegration enables phase-based generation
- [ ] Skills integration working
- [ ] Output management complete

### Agent Integrations (by category)

**Frontend Agents (4)**
- [ ] VueSpecialistAgent → VueGenerator
- [ ] NextJSSpecialistAgent → NextJSGenerator
- [ ] AngularSpecialistAgent → AngularGenerator
- [ ] (ReactSpecialist already exists)

**Backend Agents (3)**
- [ ] NestJSSpecialistAgent → NestJSGenerator
- [ ] FastAPISpecialistAgent → FastAPIGenerator
- [ ] (ExpressSpecialist already exists)

**Database Agents (3)**
- [ ] AzureSQLSpecialistAgent → AzureSQLGenerator
- [ ] CosmosDBSpecialistAgent → CosmosDBGenerator
- [ ] (PostgreSQLSpecialist already exists)

**Architecture Agents (3)**
- [ ] MicroservicesArchitectAgent → MicroservicesGenerator
- [ ] ServerlessSpecialistAgent → ServerlessGenerator
- [ ] EventDrivenArchitectAgent → EventDrivenGenerator

**Azure Infrastructure Agents (6)**
- [ ] EntraIDSpecialistAgent → EntraIDGenerator
- [ ] KeyVaultSpecialistAgent → KeyVaultGenerator
- [ ] StorageSpecialistAgent → StorageGenerator
- [ ] NetworkingSpecialistAgent → NetworkingGenerator
- [ ] MonitoringSpecialistAgent → MonitoringGenerator
- [ ] ContainerSpecialistAgent → ContainerAppsGenerator

### Quality
- [ ] All integration tests passing
- [ ] Generator-Agent mapping complete

---

## 🔗 Navigation

← [03-PHASE-GENERATORS.md](03-PHASE-GENERATORS.md) | → [05-PHASE-TESTING.md](05-PHASE-TESTING.md)
