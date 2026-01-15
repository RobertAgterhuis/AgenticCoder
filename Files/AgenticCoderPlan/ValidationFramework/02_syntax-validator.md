# Syntax Validator

**Component**: VF-02  
**Purpose**: Validate code syntax across multiple languages  
**Status**: Design Complete  

---

## 🎯 Overview

The Syntax Validator ensures generated code is syntactically correct:

1. **Detects** syntax errors in code
2. **Validates** across JavaScript, TypeScript, Python, JSON, YAML, Bicep
3. **Reports** exact line/column of errors
4. **Prevents** broken code from propagating

---

## 🏗️ Process Flow

```
Code File
    │
    ├─→ Detect Language
    │   ├─ By file extension
    │   ├─ By content sniffing
    │   └─ By configuration
    │
    ├─→ Parse Code
    │   ├─ Use language-specific parser
    │   ├─ Collect tokens
    │   └─ Build AST
    │
    ├─→ Check Errors
    │   ├─ Syntax errors
    │   ├─ Parse failures
    │   └─ Semantic issues
    │
    └─→ Result
        ├─ PASS → Code is valid
        └─ FAIL → Return line/column/error
```

---

## 🔧 Supported Languages

### 1. JavaScript/TypeScript
- Parser: `@babel/parser`
- Support: ES2020+, JSX, TypeScript
- Checks: Syntax, imports, declarations

### 2. Python
- Parser: `python-ast`
- Support: Python 3.8+
- Checks: Syntax, indentation, imports

### 3. JSON
- Parser: `JSON.parse()`
- Support: JSON5
- Checks: Valid JSON structure

### 4. YAML
- Parser: `yaml` package
- Support: YAML 1.2
- Checks: Valid YAML structure

### 5. Bicep
- Parser: `bicep-cli`
- Support: Bicep syntax
- Checks: Template validity

---

## 💻 Algorithm

### JavaScript/TypeScript Validation
```typescript
import * as parser from "@babel/parser";

async function validateTypeScript(code: string, filePath: string) {
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: [
        "typescript",
        "jsx",
        "dynamicImport",
        "optionalChaining",
        "nullishCoalescingOperator"
      ]
    });
    
    return {
      status: "PASS",
      errors: []
    };
  } catch (error) {
    return {
      status: "FAIL",
      errors: [{
        line: error.loc.line,
        column: error.loc.column,
        message: error.message,
        code: extractCode(code, error.loc.line)
      }]
    };
  }
}

function extractCode(code: string, lineNum: number): string {
  const lines = code.split('\n');
  return lines[lineNum - 1] || "";
}
```

### Python Validation
```typescript
import { spawn } from 'child_process';

async function validatePython(code: string, filePath: string) {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', ['-m', 'py_compile', filePath]);
    
    let stderr = '';
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          status: "PASS",
          errors: []
        });
      } else {
        // Parse stderr to extract line/column
        const match = stderr.match(/line (\d+)/);
        const lineNum = match ? parseInt(match[1]) : 0;
        
        resolve({
          status: "FAIL",
          errors: [{
            line: lineNum,
            message: stderr.trim(),
            code: extractCode(code, lineNum)
          }]
        });
      }
    });
  });
}
```

### JSON Validation
```typescript
function validateJSON(code: string, filePath: string) {
  try {
    JSON.parse(code);
    return {
      status: "PASS",
      errors: []
    };
  } catch (error) {
    // Extract line number from error
    const match = error.message.match(/position (\d+)/);
    const position = match ? parseInt(match[1]) : 0;
    const lineNum = code.substring(0, position).split('\n').length;
    
    return {
      status: "FAIL",
      errors: [{
        line: lineNum,
        message: error.message,
        column: position - code.lastIndexOf('\n', position - 1)
      }]
    };
  }
}
```

### YAML Validation
```typescript
import * as yaml from 'yaml';

function validateYAML(code: string, filePath: string) {
  try {
    yaml.parse(code);
    return {
      status: "PASS",
      errors: []
    };
  } catch (error) {
    // YAML parser provides line info
    return {
      status: "FAIL",
      errors: [{
        line: error.line,
        column: error.column,
        message: error.message,
        code: extractCode(code, error.line)
      }]
    };
  }
}
```

### Bicep Validation
```typescript
import { exec } from 'child_process';
import * as util from 'util';

const execPromise = util.promisify(exec);

async function validateBicep(code: string, filePath: string) {
  try {
    // Write code to temp file
    const tempFile = `/tmp/${Date.now()}.bicep`;
    fs.writeFileSync(tempFile, code);
    
    // Validate using bicep CLI
    const { stdout } = await execPromise(`bicep build ${tempFile} --no-output`);
    
    return {
      status: "PASS",
      errors: []
    };
  } catch (error) {
    // Parse bicep CLI output
    const lines = error.stderr.split('\n');
    const errors = lines
      .filter(line => line.includes('error'))
      .map(line => {
        const match = line.match(/(\d+):(\d+)/);
        return {
          line: parseInt(match[1]),
          column: parseInt(match[2]),
          message: line
        };
      });
    
    return {
      status: "FAIL",
      errors
    };
  }
}
```

---

## 📋 Error Detection

### JavaScript Errors
```javascript
// ❌ Missing closing brace
function test() {
  console.log("hello")

// Error: Unexpected token }
```

### TypeScript Errors
```typescript
// ❌ Type mismatch
const x: number = "hello";

// Error: Type 'string' is not assignable to type 'number'
```

### Python Errors
```python
# ❌ Indentation error
def test():
console.log("hello")

# Error: expected an indented block
```

### JSON Errors
```json
// ❌ Trailing comma
{
  "name": "test",
  "version": "1.0.0",
}

// Error: Unexpected token }
```

### YAML Errors
```yaml
# ❌ Invalid indentation
test:
  name: value
 invalid: indentation

# Error: bad indentation of mapping value
```

### Bicep Errors
```bicep
// ❌ Undefined variable
param location string = locationVar

// Error: The expression is not valid
```

---

## ✅ Validation Examples

### Example 1: Valid TypeScript
```typescript
interface User {
  name: string;
  age: number;
}

function getUser(id: string): User {
  return { name: "John", age: 30 };
}
```

**Result**: ✅ PASS

---

### Example 2: Invalid TypeScript
```typescript
const x: number = "hello";
const y: string = 123;

function test(param: number) {
  return param.toLowerCase(); // ❌ number has no method toLowerCase
}
```

**Result**: ❌ FAIL
```json
{
  "status": "FAIL",
  "errors": [
    {
      "line": 1,
      "message": "Type 'string' is not assignable to type 'number'"
    },
    {
      "line": 2,
      "message": "Type 'number' is not assignable to type 'string'"
    }
  ]
}
```

---

### Example 3: Valid JSON
```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "Test app",
  "main": "index.js"
}
```

**Result**: ✅ PASS

---

### Example 4: Invalid JSON
```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "Test app"
  "main": "index.js"
}
```

**Result**: ❌ FAIL
```json
{
  "status": "FAIL",
  "errors": [
    {
      "line": 4,
      "message": "Expected ',' but found '\"'",
      "code": "  \"description\": \"Test app\""
    }
  ]
}
```

---

## 🎯 Validation Strategies

### Strategy 1: Parse-Only
Fastest, just check if code parses.
```typescript
validateSyntax(code, { strategy: "parse-only" })
```

### Strategy 2: Parse + Lint
Parse and check for common issues.
```typescript
validateSyntax(code, { strategy: "parse-lint" })
```

### Strategy 3: Full Analysis
Parse, lint, and semantic analysis.
```typescript
validateSyntax(code, { strategy: "full" })
```

---

## ⚙️ Configuration

### syntax-validator.config.json
```json
{
  "enabled_languages": [
    "javascript",
    "typescript",
    "python",
    "json",
    "yaml",
    "bicep"
  ],
  "strategies": {
    "javascript": "full",
    "typescript": "full",
    "python": "parse-lint",
    "json": "parse-only",
    "yaml": "parse-only",
    "bicep": "full"
  },
  "timeout_ms": 10000,
  "max_errors": 50,
  "lint_config": {
    "eslint": ".eslintrc.json",
    "pylint": "pylintrc"
  }
}
```

---

## 📊 Metrics

| Metric | Purpose |
|--------|---------|
| Syntax errors | Track quality issues |
| Error types | Identify patterns |
| Languages validated | Track coverage |
| Validation time | Monitor performance |

---

## 🔌 Integration

### Called By
- Gate Manager (validates code syntax before handoff)
- Artifact Validation (as part of overall checks)

### Calls
- Language Parsers (language-specific validation)
- Error Reporter (reports syntax issues)

---

## 💡 Key Points

1. **Multi-Language**: Supports 6+ languages out of the box
2. **Detailed Errors**: Reports exact line/column of errors
3. **Fast**: Parse-only strategy for quick validation
4. **Extensible**: Easy to add new languages
5. **Configurable**: Choose validation strategy per language
6. **Actionable**: Errors show problematic code line

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
