# JSON Schema Quick Reference

**Location**: `.github/schemas/`  
**Total Schemas**: 81  
**Validation**: All valid ✅  

## Quick Links

- **Agent Input/Output**: `.github/schemas/agents/`
- **Artifacts**: `.github/schemas/artifacts/`
- **Full Documentation**: `.github/schemas/README.md`
- **Generator (canonical)**: `scripts/generate-agent-schemas.js`
- **Generator (python wrapper)**: `scripts/generate-agent-schemas.py`
- **Validation Tool**: `scripts/validate-schemas.js`

## Most Common Schemas

### Plan Agent (Requirements)
```bash
# Input schema (what to send to @plan)
.github/schemas/agents/plan.input.schema.json

# Output schema (what @plan returns)
.github/schemas/agents/plan.output.schema.json
```

### Azure Architecture
```bash
# Planning phase
.github/schemas/agents/azure-principal-architect.input.schema.json
.github/schemas/agents/azure-principal-architect.output.schema.json

# Implementation phase
.github/schemas/agents/bicep-implement.input.schema.json
.github/schemas/agents/bicep-implement.output.schema.json
```

### Frontend Development
```bash
# React
.github/schemas/agents/react-specialist.input.schema.json
.github/schemas/agents/react-specialist.output.schema.json

# TypeScript
.github/schemas/agents/typescript-specialist.input.schema.json
```

### Backend Development
```bash
# .NET
.github/schemas/agents/dotnet-specialist.input.schema.json

# Python
.github/schemas/agents/python-specialist.input.schema.json

# Node.js
.github/schemas/agents/nodejs-specialist.input.schema.json

# API Design
.github/schemas/agents/api-specialist.input.schema.json
```

### Infrastructure
```bash
# Docker
.github/schemas/agents/docker-specialist.input.schema.json

# Kubernetes
.github/schemas/agents/kubernetes-specialist.input.schema.json

# CI/CD
.github/schemas/agents/ci-cd-specialist.input.schema.json
```

### Database
```bash
# MySQL
.github/schemas/agents/mysql-specialist.input.schema.json

# PostgreSQL
.github/schemas/agents/postgres-specialist.input.schema.json

# MongoDB
.github/schemas/agents/mongodb-specialist.input.schema.json
```

## Using Schemas in Code

### JavaScript/Node.js Validation
```javascript
import Ajv from 'ajv';
import schema from './.github/schemas/agents/plan.input.schema.json';

const validate = new Ajv().compile(schema);
const valid = validate(agentInput);
```

### TypeScript Generation
```bash
json2ts .github/schemas/agents/plan.input.schema.json > types/PlanInput.ts
```

### Python Validation
```python
import json
import jsonschema

with open('.github/schemas/agents/plan.input.schema.json') as f:
    schema = json.load(f)

jsonschema.validate(agent_input, schema)
```

## Agent Schema Categories

### 38 Agent Specs = 76 Schemas

| Tier | Category | Count | Agents |
|------|----------|-------|--------|
| 1 | Orchestration | 9 | plan, doc, backlog, coordinator, qa, reporter, architect, code-architect, devops-specialist |
| 2 | Architecture | 8 | azure-principal-architect, aws-architect, gcp-architect, bicep-plan, terraform-plan, database-specialist, diagram-generator, adr-generator |
| 3 | Frontend | 5 | react-specialist, vue-specialist, angular-specialist, typescript-specialist, css-specialist |
| 3 | Backend | 6 | dotnet-specialist, python-specialist, java-specialist, nodejs-specialist, golang-specialist, api-specialist |
| 3 | Infrastructure | 6 | docker-specialist, kubernetes-specialist, bicep-implement, terraform-implement, ci-cd-specialist, monitoring-specialist |
| 3 | Database | 4 | mysql-specialist, postgres-specialist, mongodb-specialist, data-migration-specialist |

## Artifact Schemas (3)

1. **requirements.schema.json** - Phase 1 requirements documentation
2. **architecture.schema.json** - Phase 2-3 architecture design
3. **implementation-plan.schema.json** - Phase 4+ implementation planning

## Shared Schemas (2)

1. **agent-envelope.schema.json** - Universal message wrapper
2. **error-response.schema.json** - Standard error format

## Validation Command

```bash
# Validate all schemas
node scripts/validate-schemas.js

# Expected output:
# ✨ All schemas are valid! (81 schemas)
```

## Regenerating Schemas (Single Source of Truth)

Canonical generator is JavaScript (Node.js):

```bash
node scripts/generate-agent-schemas.js
```

Python entrypoint is a thin wrapper that delegates to the JS generator (kept to avoid drift):

```bash
python scripts/generate-agent-schemas.py
```

## Finding a Schema

**By Agent Name**:
```bash
# For react-specialist
ls .github/schemas/agents/react-specialist.*
# Output:
# react-specialist.input.schema.json
# react-specialist.output.schema.json
```

**By Technology**:
```bash
# All Python-related schemas
grep -l "Python\|python" .github/schemas/agents/*.schema.json

# All Azure-related schemas
grep -l "Azure\|azure" .github/schemas/agents/*.schema.json
```

**By Phase**:
- Phase 1: Requirements (plan agent)
- Phase 2: Architecture (architect agents)
- Phase 3: IaC Planning (bicep-plan, terraform-plan)
- Phase 4+: Implementation (specialist agents)

## IDE Integration

### VS Code
Add to `.vscode/settings.json`:
```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/*.input.json"],
      "url": "file:///.github/schemas/agents/plan.input.schema.json"
    },
    {
      "fileMatch": ["requirements.json"],
      "url": "file:///.github/schemas/artifacts/requirements.schema.json"
    }
  ]
}
```

### JetBrains IDEs (IntelliJ, WebStorm)
1. Go to Settings → Languages & Frameworks → JSON Schema
2. Click "+" to add new schema
3. Select "File or pattern"
4. Enter: `.github/schemas/agents/*.input.schema.json`
5. Select schema file from `.github/schemas/agents/plan.input.schema.json`

## Schema Naming Pattern

```
{agent-id}.{input|output}.schema.json

Examples:
- plan.input.schema.json          (input to @plan)
- plan.output.schema.json         (output from @plan)
- react-specialist.input.schema.json
- docker-specialist.output.schema.json
```

## Common Schema Properties

### All Agent Input Schemas Typically Have
- `required` array - fields that must be provided
- `properties` object - field definitions
- Descriptions for all properties

### All Agent Output Schemas Typically Have
- `required` array - output fields guaranteed
- `artifacts_created` or similar - list of files/outputs
- Status/success indicators

### All Artifact Schemas Have
- `metadata` - creation date, version, author
- `constraints` or `requirements` arrays
- `timestamp` or date fields

## Error Handling

When validation fails:

```javascript
const errors = validate.errors;
// [
//   {
//     dataPath: '.requirements_text',
//     schemaPath: '#/required',
//     keyword: 'required',
//     message: "must have required property 'requirements_text'"
//   }
// ]
```

## Testing Schemas

```bash
# Validate a specific file against schema
npm install ajv-cli
ajv validate -s .github/schemas/agents/plan.input.schema.json \
             -d sample-plan-input.json
```

## Adding New Agent Schemas

When adding a new agent:

1. Create input schema: `{agent-id}.input.schema.json`
2. Create output schema: `{agent-id}.output.schema.json`
3. Place in `.github/schemas/agents/`
4. Run validation: `node scripts/validate-schemas.js`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agenticcoder.com/schemas/agents/{agent-id}.input.schema.json",
  "title": "{Agent Name} Input",
  "description": "Agent input description",
  "type": "object",
  "required": ["field1"],
  "properties": {
    "field1": { "type": "string" }
  }
}
```

## Support

- **Schema Issues**: Check `.github/schemas/README.md`
- **Validation Issues**: Run `node scripts/validate-schemas.js`
- **IDE Support**: See "IDE Integration" section above
- **Examples**: See Phase 2 completion documentation
