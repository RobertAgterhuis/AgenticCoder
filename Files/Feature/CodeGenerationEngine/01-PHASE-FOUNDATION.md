# Phase 1: Foundation

**Duration:** 1 week  
**Status:** ⬜ Not Started  
**Dependencies:** None

---

## 🎯 Phase Objective

Build the foundational infrastructure for code generation: file system operations, project scaffolding, and the base generation interface.

---

## 📋 Tasks

### Task 1.1: FileWriter Component

**Priority:** 🔴 Critical  
**Estimated:** 2 days

**Description:**  
Create a robust file writing service that handles all disk operations for generated code.

**Implementation:**

```javascript
// agents/core/generation/FileWriter.js

class FileWriter {
  constructor(outputRoot) {
    this.outputRoot = outputRoot;
  }

  // Write a single file
  async writeFile(relativePath, content, options = {}) {}
  
  // Write multiple files atomically
  async writeFiles(files) {}
  
  // Ensure directory exists
  async ensureDirectory(dirPath) {}
  
  // Check if file exists (for conflict detection)
  async fileExists(relativePath) {}
  
  // Read existing file (for merge operations)
  async readFile(relativePath) {}
  
  // Delete file or directory
  async delete(relativePath) {}
}
```

**Acceptance Criteria:**
- [ ] Can write files to any nested directory
- [ ] Creates parent directories automatically
- [ ] Handles file encoding (UTF-8 default)
- [ ] Provides atomic write operations
- [ ] Handles errors gracefully
- [ ] Unit tests with 90%+ coverage

**Files to Create:**
- `agents/core/generation/FileWriter.js`
- `agents/core/generation/FileWriter.test.js`

---

### Task 1.2: ProjectScaffolder Component

**Priority:** 🔴 Critical  
**Estimated:** 2 days

**Description:**  
Create project directory structures based on scenario configuration.

**Implementation:**

```javascript
// agents/core/generation/ProjectScaffolder.js

class ProjectScaffolder {
  constructor(fileWriter) {
    this.fileWriter = fileWriter;
  }

  // Create complete project structure
  async scaffold(projectConfig) {
    // projectConfig: { name, scenario, framework, database, ... }
  }
  
  // Get structure definition for scenario
  getStructureForScenario(scenario) {}
  
  // Create frontend structure
  async scaffoldFrontend(framework) {}
  
  // Create backend structure
  async scaffoldBackend(framework) {}
  
  // Create infrastructure structure
  async scaffoldInfrastructure() {}
}
```

**Standard Structure:**
```
output/{projectName}/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── middleware/
│   └── package.json
├── infrastructure/
│   ├── modules/
│   └── main.bicep
├── .github/
│   └── workflows/
├── docs/
└── README.md
```

**Acceptance Criteria:**
- [ ] Creates full project structure from config
- [ ] Supports all 5 business scenarios (S01-S05)
- [ ] Creates appropriate .gitignore files
- [ ] Creates placeholder README files
- [ ] Idempotent (can run multiple times safely)
- [ ] Unit tests with 90%+ coverage

**Files to Create:**
- `agents/core/generation/ProjectScaffolder.js`
- `agents/core/generation/ProjectScaffolder.test.js`
- `agents/core/generation/structures/` (structure definitions)

---

### Task 1.3: GenerationContext

**Priority:** 🟡 High  
**Estimated:** 1 day

**Description:**  
Create a context object that carries all information needed for code generation through the pipeline.

**Implementation:**

```javascript
// agents/core/generation/GenerationContext.js

class GenerationContext {
  constructor(options) {
    this.projectName = options.projectName;
    this.scenario = options.scenario;        // S01-S05
    this.outputPath = options.outputPath;
    this.requirements = options.requirements;
    this.architecture = options.architecture;
    this.techStack = options.techStack;
    
    // Runtime state
    this.generatedFiles = [];
    this.errors = [];
    this.warnings = [];
  }

  // Add generated file to tracking
  addGeneratedFile(file) {}
  
  // Record error
  addError(error) {}
  
  // Get tech stack component
  getTechStack(layer) {}  // 'frontend', 'backend', 'database', 'infrastructure'
  
  // Serialize for logging/debugging
  toJSON() {}
}
```

**Acceptance Criteria:**
- [ ] Carries all project configuration
- [ ] Tracks generated files
- [ ] Tracks errors and warnings
- [ ] Serializable for logging
- [ ] Immutable configuration, mutable state

**Files to Create:**
- `agents/core/generation/GenerationContext.js`
- `agents/core/generation/GenerationContext.test.js`

---

### Task 1.4: CodeGenerationEngine Base

**Priority:** 🔴 Critical  
**Estimated:** 2 days

**Description:**  
Create the main engine class that orchestrates all code generation components.

**Implementation:**

```javascript
// agents/core/generation/CodeGenerationEngine.js

class CodeGenerationEngine {
  constructor(options) {
    this.fileWriter = new FileWriter(options.outputRoot);
    this.scaffolder = new ProjectScaffolder(this.fileWriter);
    this.generators = new Map();  // framework -> generator
  }

  // Register a generator
  registerGenerator(name, generator) {}
  
  // Main entry point
  async generate(context) {
    // 1. Scaffold project structure
    // 2. Generate code per layer
    // 3. Validate output
    // 4. Return summary
  }
  
  // Generate single file
  async generateFile(context, fileSpec) {}
  
  // Get generation summary
  getSummary(context) {}
}
```

**Acceptance Criteria:**
- [ ] Coordinates all generation components
- [ ] Plugin architecture for generators
- [ ] Provides generation summary
- [ ] Handles errors gracefully
- [ ] Supports dry-run mode

**Files to Create:**
- `agents/core/generation/CodeGenerationEngine.js`
- `agents/core/generation/CodeGenerationEngine.test.js`
- `agents/core/generation/index.js` (exports)

---

### Task 1.5: Base Generator Interface

**Priority:** 🟡 High  
**Estimated:** 1 day

**Description:**  
Define the interface that all framework-specific generators must implement.

**Implementation:**

```javascript
// agents/core/generation/generators/BaseGenerator.js

class BaseGenerator {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
  }

  // Generate all files for this generator's domain
  async generate(context) {
    throw new Error('Subclass must implement generate()');
  }
  
  // Generate a single component
  async generateComponent(context, componentSpec) {
    throw new Error('Subclass must implement generateComponent()');
  }
  
  // Get file extension for this generator
  getFileExtension() {
    throw new Error('Subclass must implement getFileExtension()');
  }
  
  // Validate generated code
  async validate(code) {
    return { valid: true, errors: [] };
  }
}
```

**Acceptance Criteria:**
- [ ] Clear interface for all generators
- [ ] Supports async operations
- [ ] Includes validation hook
- [ ] Documented extension points

**Files to Create:**
- `agents/core/generation/generators/BaseGenerator.js`
- `agents/core/generation/generators/index.js`

---

## 📁 Files Created This Phase

```
agents/core/generation/
├── index.js
├── FileWriter.js
├── FileWriter.test.js
├── ProjectScaffolder.js
├── ProjectScaffolder.test.js
├── GenerationContext.js
├── GenerationContext.test.js
├── CodeGenerationEngine.js
├── CodeGenerationEngine.test.js
├── structures/
│   ├── s01-structure.js
│   ├── s02-structure.js
│   ├── s03-structure.js
│   ├── s04-structure.js
│   └── s05-structure.js
└── generators/
    ├── index.js
    └── BaseGenerator.js
```

---

## ✅ Phase Completion Checklist

- [ ] All 5 tasks completed
- [ ] All tests passing (target: 90%+ coverage)
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Integration verified with existing components

---

## 🔗 Next Phase

→ [02-PHASE-TEMPLATES.md](02-PHASE-TEMPLATES.md)
