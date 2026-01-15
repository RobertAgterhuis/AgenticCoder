# Dependency Resolver

**Component**: VF-03  
**Purpose**: Validate that all dependencies are resolved and available  
**Status**: Design Complete  

---

## 🎯 Overview

The Dependency Resolver ensures:

1. **All imports** can be resolved to existing modules
2. **Version compatibility** requirements are met
3. **Circular dependencies** are detected
4. **Missing packages** are identified before execution

---

## 🏗️ Process Flow

```
Artifact with Imports
    │
    ├─→ Extract Imports
    │   ├─ Parse import statements
    │   ├─ Identify package names
    │   └─ Extract versions
    │
    ├─→ Resolve Each Import
    │   ├─ Check if installed
    │   ├─ Verify version
    │   └─ Validate compatibility
    │
    ├─→ Check Circular Deps
    │   ├─ Build dependency graph
    │   ├─ Detect cycles
    │   └─ Report findings
    │
    ├─→ Validate Versions
    │   ├─ Check version ranges
    │   ├─ Detect conflicts
    │   └─ Ensure compatibility
    │
    └─→ Result
        ├─ PASS → All dependencies available
        └─ FAIL → Report missing/conflicting
```

---

## 💻 Algorithm

### Extract Imports
```typescript
import * as traverse from '@babel/traverse';
import * as parser from '@babel/parser';

function extractImports(code: string): string[] {
  const imports: string[] = [];
  
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });
  
  traverse.default(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      imports.push(source);
    },
    RequireCall(path) {
      if (path.node.callee.name === 'require') {
        const source = path.node.arguments[0].value;
        imports.push(source);
      }
    }
  });
  
  return [...new Set(imports)]; // Deduplicate
}
```

### Resolve Imports
```typescript
import * as path from 'path';
import * as fs from 'fs';

interface ResolveResult {
  import: string;
  resolved: boolean;
  version?: string;
  path?: string;
  error?: string;
}

function resolveImports(
  imports: string[],
  projectRoot: string
): ResolveResult[] {
  const results: ResolveResult[] = [];
  
  for (const importName of imports) {
    // Skip relative imports (they're local)
    if (importName.startsWith('.')) {
      results.push({
        import: importName,
        resolved: true,
        path: path.resolve(projectRoot, importName)
      });
      continue;
    }
    
    // Resolve from node_modules
    const modulePath = path.join(projectRoot, 'node_modules', importName);
    
    if (!fs.existsSync(modulePath)) {
      results.push({
        import: importName,
        resolved: false,
        error: 'Module not found in node_modules'
      });
      continue;
    }
    
    // Get version from package.json
    try {
      const pkgJsonPath = path.join(modulePath, 'package.json');
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      
      results.push({
        import: importName,
        resolved: true,
        version: pkgJson.version,
        path: modulePath
      });
    } catch (error) {
      results.push({
        import: importName,
        resolved: true,
        path: modulePath,
        error: 'Could not read package.json'
      });
    }
  }
  
  return results;
}
```

### Detect Circular Dependencies
```typescript
interface DepGraph {
  [key: string]: string[];
}

function detectCircularDeps(depGraph: DepGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    const dependencies = depGraph[node] || [];
    
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        dfs(dep, [...path]);
      } else if (recursionStack.has(dep)) {
        // Found a cycle
        const cycleStart = path.indexOf(dep);
        const cycle = path.slice(cycleStart);
        cycles.push(cycle);
      }
    }
    
    recursionStack.delete(node);
  }
  
  for (const node of Object.keys(depGraph)) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }
  
  return cycles;
}
```

### Validate Versions
```typescript
import * as semver from 'semver';

interface VersionRequirement {
  package: string;
  required: string;
  installed: string;
}

function validateVersions(
  requirements: VersionRequirement[]
): VersionRequirement[] {
  return requirements.filter(req => {
    try {
      return !semver.satisfies(req.installed, req.required);
    } catch {
      return true; // Invalid version, flag as conflict
    }
  });
}
```

---

## 📋 Validation Rules

### Rule 1: Import Resolution
```
Check: All non-relative imports resolve to installed packages
Error: {"import": "unknown-package", "error": "Module not found"}
```

### Rule 2: Version Compatibility
```
Check: Installed versions satisfy requirements
Error: {"package": "express", "required": "^4.0.0", "installed": "3.0.0"}
```

### Rule 3: Circular Dependencies
```
Check: No circular dependencies detected
Error: {"cycle": ["a", "b", "a"], "error": "Circular dependency"}
```

### Rule 4: Relative Imports
```
Check: Relative imports point to existing files
Error: {"import": "./missing.js", "error": "File not found"}
```

---

## ✅ Validation Examples

### Example 1: Valid Dependencies
```typescript
import express from 'express';
import { Pool } from 'pg';
import axios from 'axios';
import * as fs from 'fs'; // Built-in
```

**Resolving**:
- ✅ `express` → found in node_modules, v4.18.2
- ✅ `pg` → found in node_modules, v8.8.0
- ✅ `axios` → found in node_modules, v1.4.0
- ✅ `fs` → Node.js built-in

**Result**: ✅ PASS

---

### Example 2: Missing Dependency
```typescript
import express from 'express';
import { Pool } from 'postgres';
```

**Resolving**:
- ✅ `express` → found, v4.18.2
- ❌ `postgres` → NOT found in node_modules

**Result**: ❌ FAIL
```json
{
  "status": "FAIL",
  "errors": [
    {
      "import": "postgres",
      "resolved": false,
      "error": "Module not found in node_modules"
    }
  ]
}
```

---

### Example 3: Version Conflict
```json
{
  "dependencies": {
    "express": "^5.0.0",
    "old-middleware": "1.0.0"
  }
}
```

Where `old-middleware` requires `express@^3.0.0`.

**Result**: ❌ FAIL
```json
{
  "status": "FAIL",
  "errors": [
    {
      "package": "express",
      "conflict_with": "old-middleware",
      "required_by": "old-middleware@1.0.0",
      "requirement": "^3.0.0",
      "installed": "5.0.0"
    }
  ]
}
```

---

### Example 4: Circular Dependency
```
Module A imports B
Module B imports C
Module C imports A
```

**Result**: ❌ FAIL
```json
{
  "status": "FAIL",
  "errors": [
    {
      "error": "Circular dependency detected",
      "cycle": ["moduleA", "moduleB", "moduleC", "moduleA"]
    }
  ]
}
```

---

## 🎯 Dependency Types

### Built-in Modules
- Node.js: `fs`, `path`, `http`, `crypto`, `util`, etc.
- Always available, skip checks

### npm Packages
- Must exist in `node_modules/`
- Version must satisfy semver ranges
- Check dependency tree for conflicts

### Local Modules
- Relative imports like `./utils`, `../config`
- Must point to existing files
- Support `.js`, `.ts`, `.json` extensions

### Scoped Packages
- Format: `@scope/package-name`
- Resolve from `node_modules/@scope/package-name/`

---

## 📊 Metrics

| Metric | Purpose |
|--------|---------|
| Imports found | Track dependencies |
| Resolved | Monitor availability |
| Missing | Identify gaps |
| Version conflicts | Detect incompatibilities |
| Circular deps | Prevent infinite loops |

---

## ⚙️ Configuration

### dependency-resolver.config.json
```json
{
  "project_root": ".",
  "check_versions": true,
  "detect_circular": true,
  "validate_relative": true,
  "allow_peer_deps": true,
  "ignore_packages": ["@types/*"],
  "timeout_ms": 10000,
  "built_in_modules": [
    "fs", "path", "http", "crypto", "util",
    "events", "stream", "buffer", "os"
  ]
}
```

---

## 🔌 Integration

### Called By
- Gate Manager (validates imports before handoff)
- Pre-execution (ensures setup is complete)

### Calls
- Module Resolver (resolves imports)
- Version Validator (checks semver compatibility)
- Graph Analyzer (detects cycles)

---

## 💡 Key Points

1. **Import Extraction**: Parses code to find all imports
2. **Resolution**: Checks installed packages in node_modules
3. **Version Validation**: Ensures versions satisfy ranges
4. **Circular Detection**: Prevents infinite dependency loops
5. **Path Validation**: Checks relative imports exist
6. **Detailed Errors**: Reports exactly what's missing

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
