# Schema Validator

**Component**: VF-01  
**Purpose**: Validate artifact structure against JSON schemas  
**Status**: Design Complete  

---

## 🎯 Overview

The Schema Validator ensures artifacts match their defined schemas. It:

1. **Loads** schema definitions from `.github/schemas`
2. **Validates** artifacts against schemas
3. **Reports** schema mismatches
4. **Prevents** malformed artifacts from propagating

---

## 🏗️ Process Flow

```
Artifact
    │
    ├─→ Determine Schema
    │   ├─ Lookup schema by artifact type
    │   └─ Load schema from .github/schemas
    │
    ├─→ Validate Structure
    │   ├─ Check required fields
    │   ├─ Validate field types
    │   ├─ Check field formats
    │   └─ Validate field constraints
    │
    ├─→ Check Constraints
    │   ├─ Min/max lengths
    │   ├─ Pattern matching
    │   ├─ Enum validation
    │   └─ Relationship validation
    │
    └─→ Result
        ├─ PASS → Artifact is valid
        └─ FAIL → Return detailed errors
```

---

## 📋 Validation Rules

### Rule 1: Required Fields
```
Check: All fields marked "required" are present
Error: {"field": "name", "error": "required_field_missing"}
```

### Rule 2: Type Validation
```
Check: Field values match declared type
Error: {"field": "port", "expected": "number", "actual": "string"}
```

### Rule 3: Format Validation
```
Check: String formats match patterns
Error: {"field": "email", "expected": "email_format", "actual": "invalid"}
```

### Rule 4: Enum Validation
```
Check: Values in allowed enum list
Error: {"field": "environment", "allowed": ["dev", "staging", "prod"], "actual": "testing"}
```

### Rule 5: Constraint Validation
```
Check: Min/max, length, pattern constraints
Error: {"field": "name", "constraint": "minLength:3", "value": "ab"}
```

---

## 💻 Algorithm

### Input
```typescript
interface SchemaValidationInput {
  artifact: Record<string, any>;
  schema_id: string;
  schema_path: string;
  strict_mode: boolean;
}
```

### Process
```typescript
async function validateAgainstSchema(input: SchemaValidationInput) {
  // Step 1: Load schema
  const schema = loadSchema(input.schema_path, input.schema_id);
  if (!schema) return { status: "FAIL", error: "Schema not found" };
  
  // Step 2: Initialize validator
  const validator = new JSONValidator(schema);
  
  // Step 3: Validate required fields
  for (const field of schema.required || []) {
    if (!(field in input.artifact)) {
      return {
        status: "FAIL",
        errors: [{ field, error: "Required field missing" }]
      };
    }
  }
  
  // Step 4: Validate each property
  const errors = [];
  for (const [field, value] of Object.entries(input.artifact)) {
    const fieldSchema = schema.properties[field];
    if (!fieldSchema && input.strict_mode) {
      errors.push({ field, error: "Unexpected field" });
      continue;
    }
    
    // Type validation
    if (fieldSchema.type !== getType(value)) {
      errors.push({
        field,
        expected: fieldSchema.type,
        actual: getType(value)
      });
      continue;
    }
    
    // Format validation
    if (fieldSchema.format) {
      if (!validateFormat(value, fieldSchema.format)) {
        errors.push({
          field,
          expected: fieldSchema.format,
          actual: value
        });
        continue;
      }
    }
    
    // Enum validation
    if (fieldSchema.enum) {
      if (!fieldSchema.enum.includes(value)) {
        errors.push({
          field,
          allowed: fieldSchema.enum,
          actual: value
        });
        continue;
      }
    }
    
    // Constraint validation
    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
      errors.push({
        field,
        constraint: `minLength:${fieldSchema.minLength}`,
        value
      });
    }
    
    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors.push({
        field,
        constraint: `maxLength:${fieldSchema.maxLength}`,
        value
      });
    }
    
    if (fieldSchema.minimum && value < fieldSchema.minimum) {
      errors.push({
        field,
        constraint: `minimum:${fieldSchema.minimum}`,
        value
      });
    }
    
    if (fieldSchema.maximum && value > fieldSchema.maximum) {
      errors.push({
        field,
        constraint: `maximum:${fieldSchema.maximum}`,
        value
      });
    }
    
    // Nested object validation
    if (fieldSchema.type === "object" && fieldSchema.properties) {
      const nestedErrors = validateNestedObject(
        value,
        fieldSchema,
        field
      );
      errors.push(...nestedErrors);
    }
    
    // Array validation
    if (fieldSchema.type === "array") {
      const arrayErrors = validateArray(value, fieldSchema, field);
      errors.push(...arrayErrors);
    }
  }
  
  // Step 5: Return result
  if (errors.length > 0) {
    return {
      status: "FAIL",
      errors,
      error_count: errors.length
    };
  }
  
  return {
    status: "PASS",
    validated_fields: Object.keys(input.artifact).length,
    errors: []
  };
}
```

### Output
```typescript
interface SchemaValidationResult {
  status: "PASS" | "FAIL";
  errors?: Array<{
    field: string;
    error?: string;
    expected?: any;
    actual?: any;
    constraint?: string;
  }>;
  validated_fields?: number;
  error_count?: number;
}
```

---

## 📦 Schema Definitions

### Schema Structure
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Express Application Output",
  "type": "object",
  "required": ["name", "framework", "port", "files"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 3,
      "maxLength": 50,
      "pattern": "^[a-zA-Z0-9-_]+$"
    },
    "framework": {
      "type": "string",
      "enum": ["express", "fastify", "hapi"]
    },
    "port": {
      "type": "integer",
      "minimum": 1024,
      "maximum": 65535
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "files": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["path", "content"],
        "properties": {
          "path": { "type": "string" },
          "content": { "type": "string" }
        }
      }
    }
  },
  "additionalProperties": false
}
```

### Schema by Agent

**@nodejs-specialist**
```json
{
  "type": "object",
  "required": ["name", "version", "main", "scripts", "dependencies", "files"],
  "properties": {
    "name": { "type": "string" },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "main": { "type": "string" },
    "scripts": { "type": "object" },
    "dependencies": { "type": "object" },
    "devDependencies": { "type": "object" },
    "files": { "type": "array", "items": { "type": "object" } }
  }
}
```

**@react-specialist**
```json
{
  "type": "object",
  "required": ["components", "pages", "styles"],
  "properties": {
    "components": { "type": "array", "items": { "type": "object" } },
    "pages": { "type": "array", "items": { "type": "object" } },
    "styles": { "type": "object" },
    "package_json": { "type": "object" }
  }
}
```

**@bicep-specialist**
```json
{
  "type": "object",
  "required": ["template", "parameters"],
  "properties": {
    "template": { "type": "object" },
    "parameters": { "type": "object" },
    "variables": { "type": "object" },
    "outputs": { "type": "object" },
    "metadata": { "type": "object" }
  }
}
```

---

## ✅ Validation Examples

### Example 1: Valid Artifact
```json
{
  "name": "my-app",
  "framework": "express",
  "port": 3000,
  "description": "My Express app",
  "files": [
    {
      "path": "server.js",
      "content": "const express = require('express');"
    }
  ]
}
```

**Result**: ✅ PASS

---

### Example 2: Missing Required Field
```json
{
  "name": "my-app",
  "framework": "express",
  "files": []
}
```

**Result**: ❌ FAIL
```json
{
  "status": "FAIL",
  "errors": [
    {
      "field": "port",
      "error": "required_field_missing"
    }
  ]
}
```

---

### Example 3: Type Mismatch
```json
{
  "name": "my-app",
  "framework": "express",
  "port": "3000",
  "files": []
}
```

**Result**: ❌ FAIL
```json
{
  "status": "FAIL",
  "errors": [
    {
      "field": "port",
      "expected": "integer",
      "actual": "string"
    }
  ]
}
```

---

### Example 4: Invalid Enum Value
```json
{
  "name": "my-app",
  "framework": "django",
  "port": 3000,
  "files": []
}
```

**Result**: ❌ FAIL
```json
{
  "status": "FAIL",
  "errors": [
    {
      "field": "framework",
      "allowed": ["express", "fastify", "hapi"],
      "actual": "django"
    }
  ]
}
```

---

## 🔍 Checking Nested Objects

### Input
```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "mydb"
  }
}
```

### Schema
```json
{
  "properties": {
    "database": {
      "type": "object",
      "required": ["host", "port"],
      "properties": {
        "host": { "type": "string" },
        "port": { "type": "integer" },
        "name": { "type": "string" }
      }
    }
  }
}
```

### Process
1. Detect `database` is object with sub-schema
2. Validate nested fields recursively
3. Report nested field errors with path: `database.port`

---

## 📊 Metrics

| Metric | Purpose |
|--------|---------|
| Fields validated | Track coverage |
| Errors found | Identify issues |
| Error types | Understand patterns |
| Validation time | Monitor performance |

---

## ⚙️ Configuration

### schema-validator.config.json
```json
{
  "schema_path": ".github/schemas",
  "strict_mode": true,
  "allow_additional_properties": false,
  "recursive_validation": true,
  "error_limit": 100,
  "timeout_ms": 5000,
  "cache_schemas": true
}
```

---

## 🔌 Integration

### Called By
- Gate Manager (before allowing artifact handoff)
- Artifact Transfer (to validate before transfer)

### Calls
- Schema Loader (loads .github/schemas)
- Error Reporter (reports validation failures)

---

## 💡 Key Points

1. **Schema-Driven**: Every validation based on JSON schema
2. **Detailed Errors**: Report exactly what failed and why
3. **Recursive**: Validates nested objects and arrays
4. **Type-Safe**: Enforces types at validation time
5. **Fast**: Caches schemas for performance
6. **Extensible**: Easy to add new schema definitions

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
