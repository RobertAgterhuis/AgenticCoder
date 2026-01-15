# Validation Framework

**Version**: 1.0.0  
**Date**: January 13, 2026  
**Status**: Specification & Implementation  
**Purpose**: Validate artifact quality, prevent bad outputs from cascading

---

## 🎯 Executive Summary

The **Validation Framework (VF)** ensures every agent output meets quality standards before handoff to the next agent. It:

1. ✅ **Validates** artifact schemas
2. ✅ **Tests** generated code
3. ✅ **Checks** dependencies and imports
4. ✅ **Scans** for security issues
5. ✅ **Performs** syntax validation
6. ✅ **Runs** integration tests
7. ✅ **Blocks** bad artifacts from propagating

Without VF: Bad outputs cascade through the system.  
With VF: Only quality artifacts progress to next phase.

---

## 🏗️ Architecture

```
Agent Output
    │
    ├─→ Schema Validation
    │   ├─> JSON schema check
    │   ├─> Required fields
    │   └─> Type validation
    │
    ├─→ Syntax Validation
    │   ├─> JavaScript/TypeScript
    │   ├─> Python
    │   ├─> JSON/YAML
    │   └─> Bicep/HCL
    │
    ├─→ Dependency Check
    │   ├─> Import resolution
    │   ├─> Module existence
    │   └─> Version compatibility
    │
    ├─→ Security Scan
    │   ├─> Vulnerability check
    │   ├─> Code quality
    │   └─> SAST scanning
    │
    ├─→ Testing
    │   ├─> Unit tests
    │   ├─> Integration tests
    │   └─> Coverage check
    │
    ├─→ Gate Decision
    │   ├─ PASS → Allow handoff ✓
    │   └─ FAIL → Block & alert ✗
    │
    └─→ Generate Report
        ├─> Validation results
        ├─> Coverage metrics
        └─> Remediation steps
```

---

## 📦 Core Components

### 1. **Schema Validator** (`01_schema-validator.md`)
Validates artifact structure against JSON schemas.

### 2. **Syntax Validator** (`02_syntax-validator.md`)
Validates code syntax across multiple languages.

### 3. **Dependency Resolver** (`03_dependency-resolver.md`)
Checks that all imports and dependencies exist.

### 4. **Security Scanner** (`04_security-scanner.md`)
Scans for security vulnerabilities and best practices.

### 5. **Test Runner** (`05_test-runner.md`)
Executes unit/integration tests and checks coverage.

### 6. **Gate Manager** (`06_gate-manager.md`)
Makes pass/fail decisions and blocks bad artifacts.

---

## 🎯 Validation Gates

### Gate 1: Schema Validation
```
✓ PASS: Artifact matches JSON schema
✗ FAIL: Missing required fields, wrong types, etc.
```

### Gate 2: Syntax Validation
```
✓ PASS: Code compiles/parses without errors
✗ FAIL: Syntax errors, parse failures
```

### Gate 3: Dependency Check
```
✓ PASS: All imports resolve, versions match
✗ FAIL: Missing dependencies, version conflicts
```

### Gate 4: Security Scan
```
✓ PASS: No vulnerabilities, meets security standards
✗ FAIL: Vulnerabilities found, code quality issues
```

### Gate 5: Testing
```
✓ PASS: Tests pass, coverage >= threshold
✗ FAIL: Tests fail, coverage too low
```

### Gate 6: Integration Check
```
✓ PASS: Integrates with previous artifacts
✗ FAIL: Conflicts or compatibility issues
```

---

## ✅ Validation Rules by Agent

### @nodejs-specialist Output
- ✓ JavaScript/TypeScript valid syntax
- ✓ All imports resolve
- ✓ Package.json valid
- ✓ Tests pass (80%+ coverage)
- ✓ No security vulnerabilities
- ✓ Follows eslint rules
- ✓ Integrates with @database output

### @react-specialist Output
- ✓ JSX/TSX valid syntax
- ✓ All component imports resolve
- ✓ package.json valid
- ✓ Components render without errors
- ✓ Tests pass (80%+ coverage)
- ✓ Follows component best practices
- ✓ Works with @nodejs API

### @bicep-specialist Output
- ✓ Bicep syntax valid
- ✓ Uses AVM modules where available
- ✓ All variable references valid
- ✓ Deploys successfully (dry-run)
- ✓ Follows Azure best practices
- ✓ Security policies met
- ✓ Integrates with @azure-architect design

---

## 🚀 Quick Start

### 1. Initialize Validator
```bash
npm run validation:init \
  --schema-path .github/schemas \
  --config validation.config.json
```

### 2. Validate Artifact
```bash
npm run validation:validate \
  --artifact express-app.json \
  --schema express-output.schema.json \
  --agent @nodejs-specialist
```

### 3. Run Full Check
```bash
npm run validation:full-check \
  --artifact-dir tee-output/artifacts/phase_13 \
  --agent @nodejs-specialist \
  --report validation-report.json
```

### 4. Get Report
```bash
npm run validation:report \
  --execution-id exec_001 \
  --format json
```

---

## 📊 Validation Report Example

```json
{
  "execution_id": "exec_001",
  "artifact": "express-app.json",
  "agent": "@nodejs-specialist",
  "phase": 13,
  "validation_timestamp": "2026-01-13T12:45:00Z",
  
  "results": {
    "schema_validation": {
      "status": "PASSED",
      "checks": 12,
      "passed": 12,
      "failed": 0
    },
    "syntax_validation": {
      "status": "PASSED",
      "language": "typescript",
      "errors": [],
      "warnings": []
    },
    "dependency_check": {
      "status": "PASSED",
      "dependencies": 15,
      "resolved": 15,
      "unresolved": 0
    },
    "security_scan": {
      "status": "PASSED",
      "vulnerabilities": 0,
      "warnings": 1,
      "critical_issues": 0
    },
    "testing": {
      "status": "PASSED",
      "tests_run": 24,
      "tests_passed": 24,
      "tests_failed": 0,
      "coverage": 85.3
    },
    "integration_check": {
      "status": "PASSED",
      "integrates_with": ["database-schema.json"],
      "conflicts": [],
      "compatibility": "OK"
    }
  },
  
  "summary": {
    "gates_passed": 6,
    "gates_failed": 0,
    "overall_status": "APPROVED",
    "can_handoff": true
  },
  
  "details": {
    "duration_seconds": 45,
    "timestamp": "2026-01-13T12:45:45Z"
  }
}
```

---

## ⚙️ Configuration

### validation.config.json
```json
{
  "schema_path": ".github/schemas",
  "enabled_gates": [
    "schema",
    "syntax",
    "dependency",
    "security",
    "testing",
    "integration"
  ],
  "fail_on": {
    "schema_failure": true,
    "syntax_failure": true,
    "dependency_failure": true,
    "security_critical": true,
    "test_failure": true,
    "coverage_below": 0.75,
    "integration_conflict": true
  },
  "timeout_seconds": 300,
  "parallel_validation": true,
  "max_parallel_checks": 4,
  "report_format": "json",
  "archive_reports": true
}
```

---

## 🏆 Success Criteria

When VF is working correctly:

1. ✅ All artifacts validated against schemas
2. ✅ All code syntax correct
3. ✅ All dependencies resolved
4. ✅ No security vulnerabilities
5. ✅ All tests passing
6. ✅ Integration checks pass
7. ✅ Bad artifacts blocked from handoff
8. ✅ Reports generated automatically

---

## 📁 File Structure

```
ValidationFramework/
├── README.md (this file)
├── 01_schema-validator.md       # JSON schema validation
├── 02_syntax-validator.md       # Code syntax validation
├── 03_dependency-resolver.md    # Dependency checking
├── 04_security-scanner.md       # Security scanning
├── 05_test-runner.md            # Test execution
├── 06_gate-manager.md           # Pass/fail decisions
├── implementation/
│   ├── schema-validator.ts
│   ├── syntax-validator.ts
│   ├── dependency-resolver.ts
│   ├── security-scanner.ts
│   ├── test-runner.ts
│   └── gate-manager.ts
├── schemas/
│   ├── validation-config.schema.json
│   └── validation-report.schema.json
└── examples/
    ├── sample-validation-report.json
    └── sample-failed-validation.json
```

---

## 🔌 Integration with OE

Validation Framework runs **parallel** with Orchestration Engine:

```
Agent Execution (OE)         Validation (VF)
    │                            │
    ├─→ Collect outputs ────────→├─→ Schema validation
    │                            │
    ├─→ Register artifacts ─────→├─→ Syntax validation
    │                            │
    ├─→ Transfer artifacts ─────→├─→ Dependency check
    │                            │
    │ [Wait for validation]       ├─→ Security scan
    │←────────────────────────────│
    │ [Validation passed?]        ├─→ Testing
    │                            │
    ├─ YES → Allow handoff      ├─→ Integration check
    ├─ NO  → Block & alert       │
    │                            ├─→ Generate report
    │                            │
    └────────────────────────────┴─→ Done
```

---

## 💡 Key Concepts

### Gate Concept
Each artifact must pass through 6 validation gates:
1. Schema validation (structure)
2. Syntax validation (code quality)
3. Dependency check (completeness)
4. Security scan (vulnerabilities)
5. Testing (functionality)
6. Integration check (compatibility)

**If any gate fails: Block and alert**

### Artifact Quarantine
Failed artifacts are:
- Not transferred to next phase
- Logged with detailed errors
- Made available for review
- Can trigger agent retry

### Coverage Thresholds
- Minimum test coverage: 75%
- Minimum security score: 80/100
- Maximum vulnerabilities: 0 critical

---

## 📊 Metrics Tracked

| Metric | Tracked | Used For |
|--------|---------|----------|
| Schema passes | ✅ | Validation success rate |
| Syntax errors | ✅ | Code quality |
| Dependency issues | ✅ | Completeness |
| Security issues | ✅ | Risk assessment |
| Test coverage | ✅ | Quality assurance |
| Validation time | ✅ | Performance tracking |
| Blocked artifacts | ✅ | Reliability |

---

## 🎯 Why This Matters

**Before VF**: Bad code cascades through system  
**After VF**: Only quality artifacts progress

Real example:
- Agent generates Express app without error handling
- Without VF: Broken code goes to next phase, breaks everything
- With VF: Caught immediately, blocked, agent retries with error

---

**Status**: 🟡 **SPECIFICATION IN PROGRESS** → Implementation guide coming.

Next: Read detailed gate specifications for each validation type.
