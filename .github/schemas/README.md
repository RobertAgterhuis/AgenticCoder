# JSON Schema Registry

**Status**: Complete (81 schemas)  
**Date**: January 15, 2026  
**Location**: `.github/schemas/`

## Overview

This document indexes all JSON schemas for type-safe development across AgenticCoder.

**Total Schemas**: 81
- Agent I/O Schemas: 76 (38 agents × input + output)
- Artifact Schemas: 3 (requirements, architecture, implementation plan)
- Shared Schemas: 2 (envelope, error)

## Regenerating Schemas

Single source of truth is the JavaScript generator:

```bash
node scripts/generate-agent-schemas.js
```

Python entrypoint is a thin wrapper that delegates to the JS generator (kept so existing docs/flows don’t drift):

```bash
python scripts/generate-agent-schemas.py
```

## Schema Structure

```
.github/schemas/
├── agent-envelope.schema.json          # Universal message wrapper
├── error-response.schema.json          # Standard error format
├── agents/                             # Agent I/O contracts
│   ├── plan.input.schema.json          # Requirements Planner input
│   ├── plan.output.schema.json         # Requirements Planner output
│   ├── doc.input.schema.json
│   ├── doc.output.schema.json
│   ├── backlog.input.schema.json
│   ├── backlog.output.schema.json
│   ├── coordinator.input.schema.json
│   ├── coordinator.output.schema.json
│   ├── qa.input.schema.json
│   ├── qa.output.schema.json
│   ├── reporter.input.schema.json
│   ├── reporter.output.schema.json
│   ├── architect.input.schema.json
│   ├── architect.output.schema.json
│   ├── code-architect.input.schema.json
│   ├── code-architect.output.schema.json
│   ├── devops-specialist.input.schema.json
│   ├── devops-specialist.output.schema.json
│   ├── azure-principal-architect.input.schema.json
│   ├── azure-principal-architect.output.schema.json
│   ├── aws-architect.input.schema.json
│   ├── aws-architect.output.schema.json
│   ├── gcp-architect.input.schema.json
│   ├── gcp-architect.output.schema.json
│   ├── bicep-plan.input.schema.json
│   ├── bicep-plan.output.schema.json
│   ├── terraform-plan.input.schema.json
│   ├── terraform-plan.output.schema.json
│   ├── database-specialist.input.schema.json
│   ├── database-specialist.output.schema.json
│   ├── diagram-generator.input.schema.json
│   ├── diagram-generator.output.schema.json
│   ├── adr-generator.input.schema.json
│   ├── adr-generator.output.schema.json
│   ├── react-specialist.input.schema.json
│   ├── react-specialist.output.schema.json
│   ├── vue-specialist.input.schema.json
│   ├── vue-specialist.output.schema.json
│   ├── angular-specialist.input.schema.json
│   ├── angular-specialist.output.schema.json
│   ├── typescript-specialist.input.schema.json
│   ├── typescript-specialist.output.schema.json
│   ├── css-specialist.input.schema.json
│   ├── css-specialist.output.schema.json
│   ├── dotnet-specialist.input.schema.json
│   ├── dotnet-specialist.output.schema.json
│   ├── python-specialist.input.schema.json
│   ├── python-specialist.output.schema.json
│   ├── java-specialist.input.schema.json
│   ├── java-specialist.output.schema.json
│   ├── nodejs-specialist.input.schema.json
│   ├── nodejs-specialist.output.schema.json
│   ├── golang-specialist.input.schema.json
│   ├── golang-specialist.output.schema.json
│   ├── api-specialist.input.schema.json
│   ├── api-specialist.output.schema.json
│   ├── docker-specialist.input.schema.json
│   ├── docker-specialist.output.schema.json
│   ├── kubernetes-specialist.input.schema.json
│   ├── kubernetes-specialist.output.schema.json
│   ├── bicep-implement.input.schema.json
│   ├── bicep-implement.output.schema.json
│   ├── terraform-implement.input.schema.json
│   ├── terraform-implement.output.schema.json
│   ├── ci-cd-specialist.input.schema.json
│   ├── ci-cd-specialist.output.schema.json
│   ├── monitoring-specialist.input.schema.json
│   ├── monitoring-specialist.output.schema.json
│   ├── mysql-specialist.input.schema.json
│   ├── mysql-specialist.output.schema.json
│   ├── postgres-specialist.input.schema.json
│   ├── postgres-specialist.output.schema.json
│   ├── mongodb-specialist.input.schema.json
│   ├── mongodb-specialist.output.schema.json
│   ├── data-migration-specialist.input.schema.json
│   ├── data-migration-specialist.output.schema.json
├── artifacts/                          # Artifact file formats
│   ├── requirements.schema.json
│   ├── architecture.schema.json
│   └── implementation-plan.schema.json
```

## Agent Categories

### Tier 1: Orchestration (9 agents × 2 = 18 schemas)
- `plan` - Requirements parsing and analysis
- `doc` - Documentation generation
- `backlog` - Backlog management and prioritization
- `coordinator` - Implementation coordination
- `qa` - QA strategy and testing
- `reporter` - Status reporting and dashboards
- `architect` - System architecture design
- `code-architect` - Code structure and patterns
- `devops-specialist` - Deployment and infrastructure

### Tier 2: Architecture (8 agents × 2 = 16 schemas)
- `azure-principal-architect` - Azure cloud design
- `aws-architect` - AWS cloud design
- `gcp-architect` - GCP cloud design
- `bicep-plan` - Bicep IaC planning
- `terraform-plan` - Terraform IaC planning
- `database-specialist` - Database architecture
- `diagram-generator` - Architecture diagrams
- `adr-generator` - Architecture Decision Records

### Tier 3: Implementation - Frontend (5 agents × 2 = 10 schemas)
- `react-specialist` - React component generation
- `vue-specialist` - Vue.js development
- `angular-specialist` - Angular development
- `typescript-specialist` - TypeScript code generation
- `css-specialist` - Stylesheet and design tokens

### Tier 3: Implementation - Backend (6 agents × 2 = 12 schemas)
- `dotnet-specialist` - .NET backend code
- `python-specialist` - Python backend code
- `java-specialist` - Java backend code
- `nodejs-specialist` - Node.js backend code
- `golang-specialist` - Go backend code
- `api-specialist` - API design and specifications

### Tier 3: Implementation - Infrastructure (6 agents × 2 = 12 schemas)
- `docker-specialist` - Docker containers
- `kubernetes-specialist` - Kubernetes orchestration
- `bicep-implement` - Bicep template generation
- `terraform-implement` - Terraform configuration
- `ci-cd-specialist` - CI/CD pipeline setup
- `monitoring-specialist` - Monitoring configuration

### Tier 3: Implementation - Database (4 agents × 2 = 8 schemas)
- `mysql-specialist` - MySQL schema generation
- `postgres-specialist` - PostgreSQL schema generation
- `mongodb-specialist` - MongoDB configuration
- `data-migration-specialist` - Data migration planning

## Schema Standards

### Version
All schemas follow **JSON Schema Draft 2020-12**

### Naming Convention
```
{agent-id}.{input|output}.schema.json
```

Examples:
- `plan.input.schema.json`
- `azure-principal-architect.output.schema.json`
- `docker-specialist.input.schema.json`

### File Format
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agenticcoder.com/schemas/agents/{agent-id}.{type}.schema.json",
  "title": "...",
  "description": "...",
  "type": "object",
  "required": ["..."],
  "properties": {
    // schema properties
  }
}
```

## Usage in Code

### JavaScript Validation
```javascript
const Ajv = require('ajv');
const schema = require('./agents/plan.input.schema.json');

const ajv = new Ajv();
const validate = ajv.compile(schema);

const data = { /* agent input */ };
const valid = validate(data);

if (!valid) {
  console.error('Validation failed:', validate.errors);
}
```

### IDE Intellisense
Add schema validation to your editor:

**VS Code (settings.json)**:
```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/agents/*.input.json"],
      "url": "./file:///path/to/.github/schemas/agents/plan.input.schema.json"
    }
  ]
}
```

### API Documentation
Each schema serves as API documentation:
- **Input schema**: Documents what data agents expect
- **Output schema**: Documents what data agents produce

## Shared Schemas

### Agent Envelope (`agent-envelope.schema.json`)
Standard wrapper for all agent messages:

```json
{
  "version": "1.0.0",
  "agent_id": "plan",
  "phase": 1,
  "timestamp": "2026-01-15T10:30:00Z",
  "content": { /* agent-specific payload */ },
  "metadata": {
    "execution_time_ms": 5000,
    "tokens_used": 2500,
    "mcp_calls": ["azure-docs"],
    "errors": []
  }
}
```

### Error Response (`error-response.schema.json`)
Standard error format:

```json
{
  "error_code": "AGENT_TIMEOUT",
  "message": "Agent execution exceeded timeout",
  "timestamp": "2026-01-15T10:30:00Z",
  "agent_id": "azure-principal-architect",
  "phase": 2,
  "retryable": true,
  "retry_after_seconds": 30
}
```

## Artifact Schemas

### Requirements (`requirements.schema.json`)
Phase 1 output - structured requirements document

### Architecture (`architecture.schema.json`)
Phase 2-3 output - system architecture design

### Implementation Plan (`implementation-plan.schema.json`)
Phase 4+ output - development and deployment planning

## Integration

### CI/CD Validation
All agent outputs must validate against their output schema:

```bash
# In GitHub Actions
npm install ajv ajv-cli
ajv validate -s .github/schemas/agents/plan.output.schema.json -d artifact.json
```

### Type Safety
Generate TypeScript types from schemas:

```bash
npm install json-schema-to-typescript
json2ts -i .github/schemas/agents/plan.input.schema.json -o types/PlanInput.ts
```

## Validation Rules

1. **Required Fields**: All fields marked `required` must be present
2. **Type Validation**: Values must match specified types
3. **Enum Values**: Must match exactly (case-sensitive)
4. **Pattern Validation**: Strings matching patterns (e.g., `REQ-123`)
5. **Number Ranges**: Must be within min/max bounds

## Maintenance

- **Add Agent**: Create `{agent-id}.input.schema.json` and `.output.schema.json`
- **Update Schema**: Bump version in `agent-envelope.schema.json`
- **Breaking Changes**: Increment major version in schema `$id`

## References

- [JSON Schema Official Docs](https://json-schema.org/)
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/json-schema-core.html)
- [Ajv Validation Library](https://ajv.js.org/)
