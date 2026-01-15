# Test Runner

**Component**: VF-05  
**Purpose**: Execute tests and validate code functionality  
**Status**: Design Complete  

---

## 🎯 Overview

The Test Runner ensures generated code works correctly:

1. **Discovers** test files
2. **Executes** unit and integration tests
3. **Measures** code coverage
4. **Reports** test results with failure details

---

## 🏗️ Process Flow

```
Generated Artifact
    │
    ├─→ Discover Tests
    │   ├─ Find test files (*.test.js, *.spec.js)
    │   ├─ List test cases
    │   └─ Identify test runner
    │
    ├─→ Install Dependencies
    │   ├─ npm install
    │   └─ Setup test environment
    │
    ├─→ Run Tests
    │   ├─ Execute test suite
    │   ├─ Collect results
    │   └─ Capture output
    │
    ├─→ Measure Coverage
    │   ├─ Run with coverage tool
    │   ├─ Calculate metrics
    │   └─ Check thresholds
    │
    └─→ Result
        ├─ PASS → All tests pass, coverage OK
        └─ FAIL → Tests failed or coverage low
```

---

## 🧪 Test Discovery

### Test Files
```
Common naming patterns:
- *.test.js / *.test.ts
- *.spec.js / *.spec.ts
- __tests__/*.js
- test/*.js
```

### Test Frameworks Supported
```
JavaScript/TypeScript:
- Jest (most common)
- Mocha + Chai
- Vitest
- Cypress (E2E)

Python:
- pytest
- unittest
- nose

Other:
- go test (Go)
- cargo test (Rust)
```

---

## 💻 Algorithm

### Discover Tests
```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface TestFile {
  path: string;
  framework: string;
  test_count: number;
}

function discoverTests(projectRoot: string): TestFile[] {
  const testFiles: TestFile[] = [];
  
  // Common test patterns
  const patterns = [
    '**/*.test.js',
    '**/*.test.ts',
    '**/*.spec.js',
    '**/*.spec.ts',
    '**/__tests__/**/*.js',
    '**/test/**/*.js'
  ];
  
  for (const pattern of patterns) {
    const matches = glob.sync(pattern, { cwd: projectRoot });
    
    for (const filePath of matches) {
      const content = fs.readFileSync(
        path.join(projectRoot, filePath),
        'utf8'
      );
      
      // Detect framework
      let framework = 'jest'; // default
      if (content.includes('describe(') && content.includes('it(')) {
        framework = 'mocha';
      } else if (content.includes('test(') || content.includes('it(')) {
        framework = 'jest';
      }
      
      // Count tests
      const testMatch = content.match(/(?:it|test|describe)\(/g) || [];
      const testCount = testMatch.length;
      
      testFiles.push({
        path: filePath,
        framework,
        test_count: testCount
      });
    }
  }
  
  return testFiles;
}
```

### Execute Tests
```typescript
import { spawn } from 'child_process';

interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration_ms: number;
  failures?: Array<{
    test: string;
    error: string;
    stack: string;
  }>;
}

async function runTests(
  projectRoot: string,
  timeout_ms: number = 60000
): Promise<TestResult> {
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let output = '';
    let errorOutput = '';
    
    const testProcess = spawn('npm', ['test', '--', '--json'], {
      cwd: projectRoot,
      timeout: timeout_ms
    });
    
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      try {
        // Parse Jest JSON output
        const lastLine = output.trim().split('\n').pop();
        const results = JSON.parse(lastLine);
        
        const result: TestResult = {
          passed: results.numPassedTests || 0,
          failed: results.numFailedTests || 0,
          skipped: results.numPendingTests || 0,
          total: results.numTotalTests || 0,
          duration_ms: duration,
          failures: results.testResults
            ?.flatMap((suite: any) =>
              suite.assertionResults
                .filter((test: any) => test.status === 'failed')
                .map((test: any) => ({
                  test: test.title,
                  error: test.failureMessages?.[0],
                  stack: test.failureMessages?.join('\n')
                }))
            )
        };
        
        resolve(result);
      } catch (error) {
        resolve({
          passed: 0,
          failed: 1,
          skipped: 0,
          total: 1,
          duration_ms: duration,
          failures: [{
            test: 'Test execution',
            error: errorOutput || 'Unknown error',
            stack: ''
          }]
        });
      }
    });
    
    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}
```

### Measure Coverage
```typescript
interface CoverageReport {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  files: Array<{
    file: string;
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  }>;
}

async function measureCoverage(
  projectRoot: string,
  threshold: number = 0.75
): Promise<{ coverage: CoverageReport; meets_threshold: boolean }> {
  
  return new Promise((resolve) => {
    const coverageProcess = spawn(
      'npm',
      ['test', '--', '--coverage', '--json'],
      { cwd: projectRoot }
    );
    
    let output = '';
    
    coverageProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    coverageProcess.on('close', () => {
      try {
        // Parse coverage.json
        const coverageFile = `${projectRoot}/coverage/coverage-final.json`;
        const coverageData = JSON.parse(
          fs.readFileSync(coverageFile, 'utf8')
        );
        
        // Calculate summary
        let totalStatements = 0;
        let coveredStatements = 0;
        
        for (const [file, data] of Object.entries(coverageData)) {
          for (const stmt of Object.values(data.statementMap || {})) {
            totalStatements++;
            if (data.s[Object.keys(data.statementMap).indexOf(stmt)]) {
              coveredStatements++;
            }
          }
        }
        
        const coverage = coveredStatements / totalStatements;
        
        resolve({
          coverage: {
            statements: coverage,
            branches: coverage,
            functions: coverage,
            lines: coverage,
            files: []
          },
          meets_threshold: coverage >= threshold
        });
      } catch (error) {
        resolve({
          coverage: {
            statements: 0,
            branches: 0,
            functions: 0,
            lines: 0,
            files: []
          },
          meets_threshold: false
        });
      }
    });
  });
}
```

---

## ✅ Test Examples

### Example 1: Jest Test Suite
```typescript
describe('User Service', () => {
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const user = await userService.createUser({
        name: 'John Doe',
        email: 'john@example.com'
      });
      
      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.id).toBeDefined();
    });
    
    it('should throw error with invalid email', async () => {
      await expect(
        userService.createUser({
          name: 'John',
          email: 'invalid-email'
        })
      ).rejects.toThrow('Invalid email');
    });
  });
});
```

**Result**:
```json
{
  "passed": 2,
  "failed": 0,
  "skipped": 0,
  "total": 2,
  "duration_ms": 145,
  "coverage": {
    "statements": 0.85,
    "branches": 0.80,
    "functions": 0.90,
    "lines": 0.86
  }
}
```

---

### Example 2: Failed Test
```typescript
describe('Database', () => {
  it('should connect to database', async () => {
    const db = new Database();
    await db.connect();
    
    expect(db.isConnected()).toBe(true); // ❌ FAILS
  });
});
```

**Result**:
```json
{
  "passed": 0,
  "failed": 1,
  "skipped": 0,
  "total": 1,
  "duration_ms": 5000,
  "failures": [
    {
      "test": "should connect to database",
      "error": "Expected false to be true",
      "stack": "at Object.<anonymous> (database.test.js:5:15)"
    }
  ]
}
```

---

## 📊 Coverage Metrics

```
| Metric | Definition | Threshold |
|--------|-----------|-----------|
| Statements | % of code statements executed | 75% |
| Branches | % of code branches tested | 70% |
| Functions | % of functions called | 80% |
| Lines | % of code lines executed | 75% |
```

### Coverage Report Example
```json
{
  "statements": {
    "total": 150,
    "covered": 127,
    "percentage": 84.67
  },
  "branches": {
    "total": 42,
    "covered": 35,
    "percentage": 83.33
  },
  "functions": {
    "total": 23,
    "covered": 21,
    "percentage": 91.30
  },
  "lines": {
    "total": 145,
    "covered": 124,
    "percentage": 85.52
  }
}
```

---

## ⚙️ Configuration

### test-runner.config.json
```json
{
  "frameworks": ["jest", "mocha", "vitest"],
  "test_patterns": [
    "**/*.test.js",
    "**/*.spec.js",
    "**/__tests__/**/*.js"
  ],
  "timeout_ms": 60000,
  "coverage_threshold": 0.75,
  "fail_on_coverage_below": true,
  "collect_coverage": true,
  "coverage_reporters": ["json", "text", "html"],
  "parallel_execution": true,
  "max_workers": 4,
  "verbose": true
}
```

---

## 🔌 Integration

### Called By
- Gate Manager (validates functionality before handoff)
- Artifact validation (as part of overall checks)

### Calls
- Test discovery (finds test files)
- Test framework executors (Jest, Mocha, etc.)
- Coverage tools (coverage.js, nyc, v8)

---

## 💡 Key Points

1. **Auto-Discovery**: Finds tests automatically
2. **Framework Support**: Works with Jest, Mocha, pytest, etc.
3. **Coverage Measurement**: Tracks statement/branch/function coverage
4. **Detailed Reports**: Shows which tests failed and why
5. **Fast Feedback**: Reports errors in minutes
6. **Threshold Enforcement**: Blocks low-coverage code

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
