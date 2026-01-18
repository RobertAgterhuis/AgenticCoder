# Building Custom Agents

Guide to creating custom GitHub Copilot agents for AgenticCoder.

## Agent Overview

Agents are specialized AI assistants that handle specific tasks within the AgenticCoder workflow. Each agent:
- Has a defined role and expertise
- Contains a system prompt
- Includes one or more skills
- Produces specific artifact types

## Agent Structure

### Minimal Agent

```markdown
<!-- .github/agents/my-agent.md -->

# My Agent

## Description

Brief description of what this agent does.

## Skills

@skills:my-skill

## Capabilities

- Capability 1
- Capability 2
```

### Full Agent Structure

```markdown
<!-- .github/agents/my-custom-agent.md -->

# My Custom Agent

## Description

Detailed description of this agent's purpose and responsibilities.
Explain when this agent should be invoked and what it delivers.

## Skills

@skills:skill-one
@skills:skill-two
@skills:shared/common-skill

## System Prompt

You are an expert in [domain]. Your responsibilities include:
- Task 1
- Task 2
- Task 3

When completing tasks:
1. Follow the established patterns
2. Reference existing architecture
3. Produce artifacts in the correct format

## Capabilities

- Capability 1 with details
- Capability 2 with details
- Capability 3 with details

## Input Requirements

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| projectContext | Context | Yes | Project information |
| requirements | Document | Yes | Requirements to implement |
| architecture | Diagram | No | Existing architecture |

## Output Artifacts

| Artifact | Format | Path | Description |
|----------|--------|------|-------------|
| design.md | Markdown | docs/design/ | Design document |
| diagram.mmd | Mermaid | docs/diagrams/ | System diagram |

## Examples

### Example 1: Basic Task

User: Create a design for the user module

Agent Response:
- Analyzes requirements
- Creates component diagram
- Documents interfaces
- Outputs design.md

### Example 2: Complex Task

User: Design authentication system with OAuth integration

Agent Response:
- Reviews security requirements
- Creates auth flow diagrams
- Documents token handling
- Produces security-design.md

## Invocation

Invoke when:
- Scenario requires [specific capability]
- Phase [X] needs [specific output]
- User requests [specific action]

## Handoffs

| From Agent | Receives |
|------------|----------|
| architect | System architecture |
| plan | Project requirements |

| To Agent | Provides |
|----------|----------|
| code-architect | Detailed design |
| qa | Test requirements |
```

## Creating Your First Agent

### Step 1: Define Purpose

```yaml
# agent-plan.yaml
name: "api-designer"
role: "API Design Specialist"
purpose: "Design REST and GraphQL APIs"
phase: 5
scenario_support: ["S01", "S02", "S03", "S04", "S05"]
```

### Step 2: Create Agent File

```markdown
<!-- .github/agents/api-designer.md -->

# API Designer

## Description

Designs RESTful and GraphQL APIs following best practices.
Creates OpenAPI specifications and API documentation.

## Skills

@skills:api-design
@skills:openapi
@skills:shared/code-review

## System Prompt

You are an expert API designer specializing in REST and GraphQL.

Your expertise includes:
- RESTful API design principles
- OpenAPI/Swagger specification
- GraphQL schema design
- API versioning strategies
- Rate limiting and pagination

When designing APIs:
1. Follow REST conventions (resources, verbs, status codes)
2. Create comprehensive OpenAPI specs
3. Include request/response examples
4. Document error handling
5. Consider security (auth, CORS, rate limits)

## Capabilities

- Design RESTful APIs following best practices
- Create OpenAPI 3.0 specifications
- Design GraphQL schemas
- Document API endpoints
- Define authentication flows
- Specify rate limiting strategies

## Input Requirements

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| requirements | Document | Yes | Feature requirements |
| entities | Schema | Yes | Data models/entities |
| architecture | Diagram | No | System architecture |

## Output Artifacts

| Artifact | Format | Path |
|----------|--------|------|
| openapi.yaml | OpenAPI 3.0 | docs/api/ |
| api-docs.md | Markdown | docs/api/ |
| graphql.schema | GraphQL | src/schema/ |

## Invocation

Invoke during Phase 5 (Code Architecture) when:
- Designing new API endpoints
- Creating API documentation
- Defining service interfaces
```

### Step 3: Create Required Skills

```markdown
<!-- .github/skills/api-design.md -->

# API Design Skill

## Description

Expertise in RESTful API design patterns and conventions.

## Knowledge

### REST Principles
- Resource-based URLs
- HTTP verbs (GET, POST, PUT, PATCH, DELETE)
- Status codes (2xx, 4xx, 5xx)
- HATEOAS

### Design Patterns
- Pagination (cursor, offset)
- Filtering and sorting
- Versioning (URL, header, query)
- Rate limiting

### Best Practices
- Use nouns for resources
- Use plural names
- Nest related resources
- Use query params for filtering
```

### Step 4: Register Agent

Add to agent registry:

```yaml
# .github/config/agents.yaml

agents:
  api-designer:
    enabled: true
    phases: [5]
    scenarios: [S01, S02, S03, S04, S05]
    priority: 3
    timeout: 180000
    skills:
      - api-design
      - openapi
      - shared/code-review
```

## Agent Best Practices

### 1. Clear Responsibility

Each agent should have ONE clear responsibility:

```markdown
## Description

<!-- ✅ Good: Specific responsibility -->
Designs database schemas and creates migration scripts
for relational databases.

<!-- ❌ Bad: Too broad -->
Handles all database-related tasks including design,
implementation, optimization, and monitoring.
```

### 2. Detailed System Prompts

```markdown
## System Prompt

<!-- ✅ Good: Detailed instructions -->
You are a database design specialist with expertise in:
- Relational database modeling
- Normalization (1NF through 5NF)
- Index optimization
- Migration script creation

When designing schemas:
1. Start with entity identification
2. Define relationships (1:1, 1:N, N:M)
3. Apply normalization rules
4. Create indexes for query patterns
5. Generate migration scripts

Always consider:
- Data integrity constraints
- Performance implications
- Future scalability

<!-- ❌ Bad: Vague instructions -->
Design databases. Make them good.
```

### 3. Explicit Input/Output

```markdown
## Input Requirements

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| entityModel | JSON | Yes | Entity definitions |
| queryPatterns | Document | Yes | Expected queries |
| volumeEstimates | Data | No | Data volume projections |

## Output Artifacts

| Artifact | Format | Path |
|----------|--------|------|
| schema.sql | SQL | infra/database/ |
| migrations/ | SQL | infra/database/migrations/ |
| erd.mmd | Mermaid | docs/diagrams/ |
```

### 4. Meaningful Examples

```markdown
## Examples

### Example: E-commerce Schema

**Input**: Entity model with User, Product, Order
**Query patterns**: Find orders by user, search products

**Output**:
- schema.sql with normalized tables
- Indexes for common queries
- Migration scripts 001-005
- ERD diagram showing relationships
```

## TypeScript Agent Implementation

For programmatic agents:

```typescript
// src/agents/api-designer.ts

import { AgentBase, AgentConfig } from '@agentic/core';
import { Message, Artifact, ValidationResult } from '@agentic/types';

export interface ApiDesignerConfig extends AgentConfig {
  outputFormat: 'openapi' | 'graphql' | 'both';
  includeExamples: boolean;
}

export class ApiDesignerAgent extends AgentBase<ApiDesignerConfig> {
  
  name = 'api-designer';
  description = 'Designs REST and GraphQL APIs';
  
  constructor(config: ApiDesignerConfig) {
    super(config);
  }
  
  async processMessage(message: Message): Promise<Artifact[]> {
    const requirements = this.extractRequirements(message);
    const entities = await this.loadEntities();
    
    const artifacts: Artifact[] = [];
    
    if (this.config.outputFormat !== 'graphql') {
      artifacts.push(await this.generateOpenApi(requirements, entities));
    }
    
    if (this.config.outputFormat !== 'openapi') {
      artifacts.push(await this.generateGraphQL(requirements, entities));
    }
    
    return artifacts;
  }
  
  async validate(artifacts: Artifact[]): Promise<ValidationResult> {
    // Validate generated API specs
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }
  
  private async generateOpenApi(
    requirements: string[], 
    entities: Entity[]
  ): Promise<Artifact> {
    // Generate OpenAPI specification
    const spec = this.buildOpenApiSpec(requirements, entities);
    
    return {
      type: 'openapi',
      path: 'docs/api/openapi.yaml',
      content: yaml.dump(spec)
    };
  }
}
```

## Testing Agents

### Unit Testing

```typescript
// test/agents/api-designer.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { ApiDesignerAgent } from '../../src/agents/api-designer';

describe('ApiDesignerAgent', () => {
  let agent: ApiDesignerAgent;
  
  beforeEach(() => {
    agent = new ApiDesignerAgent({
      outputFormat: 'openapi',
      includeExamples: true
    });
  });
  
  it('should generate valid OpenAPI spec', async () => {
    const message = createTestMessage('Design user API');
    
    const artifacts = await agent.processMessage(message);
    
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].type).toBe('openapi');
    expect(artifacts[0].content).toContain('openapi: 3.0');
  });
  
  it('should include examples when configured', async () => {
    const artifacts = await agent.processMessage(
      createTestMessage('Design product API')
    );
    
    const spec = yaml.parse(artifacts[0].content);
    expect(spec.paths['/products'].get.responses['200'].content
      ['application/json'].examples).toBeDefined();
  });
});
```

### Integration Testing

```typescript
// test/integration/api-designer.test.ts

import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../../src/engine';
import { ApiDesignerAgent } from '../../src/agents/api-designer';

describe('ApiDesigner Integration', () => {
  it('should work within workflow', async () => {
    const engine = new WorkflowEngine();
    engine.registerAgent(new ApiDesignerAgent(config));
    
    const result = await engine.executePhase(5, {
      requirements: sampleRequirements,
      entities: sampleEntities
    });
    
    expect(result.artifacts).toContainEqual(
      expect.objectContaining({ type: 'openapi' })
    );
  });
});
```

## Registering in Workflow

```yaml
# .github/config/phases/phase-5.yaml

phases:
  - id: 5
    name: "Code Architecture"
    agents:
      - code-architect
      - api-designer    # Your new agent
      - database-specialist
    sequence:
      - code-architect  # First
      - api-designer    # After code architect
      - database-specialist
```

## Agent Communication

### Receiving Handoffs

```typescript
async receiveHandoff(fromAgent: string, data: any): Promise<void> {
  if (fromAgent === 'architect') {
    this.systemArchitecture = data.architecture;
    this.componentList = data.components;
  }
}
```

### Sending Handoffs

```typescript
async prepareHandoff(toAgent: string): Promise<any> {
  if (toAgent === 'code-architect') {
    return {
      apiSpec: this.generatedSpec,
      endpoints: this.endpoints,
      schemas: this.schemas
    };
  }
}
```

## Debugging Agents

### Enable Debug Logging

```yaml
# .agentic/config/logging.yaml
components:
  agents: "debug"
```

### Agent State Inspection

```bash
# Check agent status
agentic agent status api-designer

# View agent logs
agentic logs --agent api-designer

# Test agent in isolation
agentic agent test api-designer --input test-input.json
```

## Next Steps

- [Creating Skills](Creating-Skills) - Build agent capabilities
- [Creating Scenarios](Creating-Scenarios) - Custom project templates
- [Agent Catalog](../agents/Catalog) - Reference implementation
