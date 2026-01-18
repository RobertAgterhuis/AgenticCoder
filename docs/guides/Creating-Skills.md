# Creating Custom Skills

Guide to creating skills for GitHub Copilot agents.

## Skill Overview

Skills provide specialized knowledge and capabilities to agents. They:
- Contain domain expertise
- Define patterns and best practices
- Are reusable across multiple agents
- Enable focused, accurate responses

## Skill Structure

### Minimal Skill

```markdown
<!-- .github/skills/my-skill.md -->

# My Skill

## Description

Brief description of this skill's domain.

## Knowledge

Core knowledge and patterns this skill provides.
```

### Full Skill Structure

```markdown
<!-- .github/skills/my-advanced-skill.md -->

# My Advanced Skill

## Description

Comprehensive description of this skill's expertise area.
Explain what knowledge this skill provides and when it applies.

## Prerequisites

- Prerequisite skill 1 (`@skills:prerequisite-1`)
- Prerequisite skill 2 (`@skills:prerequisite-2`)

## Knowledge

### Core Concepts

Detailed explanation of fundamental concepts.

### Patterns

Common patterns and their applications.

### Best Practices

Recommended approaches and guidelines.

### Anti-Patterns

What to avoid and why.

## Examples

### Example 1: Basic Usage

```code
Example code demonstrating basic usage
```

### Example 2: Advanced Usage

```code
Example code demonstrating advanced patterns
```

## Tools

| Tool | Purpose |
|------|---------|
| Tool1 | Description of tool |
| Tool2 | Description of tool |

## References

- [Link to official documentation]
- [Link to best practices guide]

## Agents Using This Skill

- Agent1 - Usage context
- Agent2 - Usage context
```

## Creating Your First Skill

### Step 1: Identify Domain

Determine the skill's focus area:

```yaml
skill:
  name: "graphql-api-design"
  domain: "API Development"
  focus: "GraphQL schema design and best practices"
  agents:
    - api-designer
    - backend-specialist
```

### Step 2: Create Skill File

```markdown
<!-- .github/skills/graphql-api-design.md -->

# GraphQL API Design

## Description

Expertise in designing GraphQL APIs including schema design,
resolver patterns, and query optimization.

## Prerequisites

- @skills:api-design (API fundamentals)
- @skills:typescript (TypeScript syntax)

## Knowledge

### Schema Design

#### Type Definitions

```graphql
# Use clear, descriptive type names
type User {
  id: ID!
  email: String!
  name: String!
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  publishedAt: DateTime
}
```

#### Input Types

```graphql
# Separate input types for mutations
input CreateUserInput {
  email: String!
  name: String!
  password: String!
}

input UpdateUserInput {
  email: String
  name: String
}
```

#### Query Organization

```graphql
type Query {
  # Single item queries
  user(id: ID!): User
  post(id: ID!): Post
  
  # List queries with pagination
  users(
    first: Int
    after: String
    filter: UserFilter
  ): UserConnection!
  
  posts(
    first: Int
    after: String
    filter: PostFilter
  ): PostConnection!
}
```

### Pagination Patterns

#### Cursor-Based Pagination

```graphql
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Mutation Patterns

```graphql
type Mutation {
  # Return affected object
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!
  deleteUser(id: ID!): DeleteUserPayload!
}

# Payload types for consistent responses
type CreateUserPayload {
  user: User
  errors: [Error!]
}
```

### Error Handling

```graphql
type Error {
  message: String!
  path: [String!]
  code: ErrorCode!
}

enum ErrorCode {
  VALIDATION_ERROR
  NOT_FOUND
  UNAUTHORIZED
  FORBIDDEN
}
```

### Best Practices

1. **Use Relay Connection Spec** for pagination
2. **Consistent naming**: `userById`, `usersByEmail`
3. **Nullable by default**, non-null for required
4. **Separate input types** from output types
5. **Include error handling** in payloads

### Anti-Patterns

1. **Avoid deeply nested queries** - limit depth
2. **Don't expose internal IDs** directly
3. **Never return unbounded lists** - always paginate
4. **Don't duplicate data** across types

## Examples

### Example: Complete Schema

```graphql
# Complete e-commerce GraphQL schema

type Query {
  # Users
  viewer: User
  user(id: ID!): User
  
  # Products
  product(id: ID!): Product
  products(
    first: Int = 10
    after: String
    filter: ProductFilter
  ): ProductConnection!
  
  # Orders
  order(id: ID!): Order
  orders(
    first: Int = 10
    after: String
  ): OrderConnection!
}

type Mutation {
  # Cart
  addToCart(input: AddToCartInput!): AddToCartPayload!
  removeFromCart(itemId: ID!): RemoveFromCartPayload!
  
  # Orders
  createOrder(input: CreateOrderInput!): CreateOrderPayload!
  cancelOrder(id: ID!): CancelOrderPayload!
}

type Subscription {
  orderStatusChanged(orderId: ID!): OrderStatusEvent!
}
```

### Example: Resolver Pattern

```typescript
const resolvers = {
  Query: {
    user: (_, { id }, context) => {
      return context.dataSources.users.getById(id);
    },
    products: (_, { first, after, filter }, context) => {
      return context.dataSources.products.getConnection({
        first,
        after,
        filter
      });
    }
  },
  
  User: {
    posts: (user, _, context) => {
      return context.dataSources.posts.getByAuthor(user.id);
    }
  }
};
```

## Tools

| Tool | Purpose |
|------|---------|
| graphql-codegen | Generate types from schema |
| apollo-server | GraphQL server |
| graphql-tools | Schema utilities |
| graphql-depth-limit | Query depth limiting |

## References

- [GraphQL Specification](https://spec.graphql.org/)
- [Relay Cursor Connection Spec](https://relay.dev/graphql/connections.htm)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)

## Agents Using This Skill

- api-designer - GraphQL API design
- backend-specialist - API implementation
- fullstack-specialist - Full-stack development
```

### Step 3: Reference in Agent

```markdown
<!-- .github/agents/api-designer.md -->

## Skills

@skills:api-design
@skills:graphql-api-design
@skills:openapi
```

## Skill Categories

### Domain Skills

Core expertise in a specific domain:

```markdown
# Azure Functions Skill

## Knowledge

### Function Types
- HTTP Triggers
- Timer Triggers
- Queue Triggers
- Blob Triggers

### Bindings
- Input bindings
- Output bindings
- Binding expressions

### Best Practices
- Cold start optimization
- Connection management
- Error handling
```

### Technology Skills

Specific technology expertise:

```markdown
# React 18 Skill

## Knowledge

### Core Concepts
- Functional components
- Hooks (useState, useEffect, useContext)
- Concurrent features

### Patterns
- Custom hooks
- Context providers
- Render props

### Performance
- Suspense and lazy loading
- useMemo and useCallback
- React.memo
```

### Pattern Skills

Design and architectural patterns:

```markdown
# CQRS Pattern Skill

## Knowledge

### Core Concepts
- Command Query Responsibility Segregation
- Separate read/write models
- Event sourcing integration

### Implementation
- Command handlers
- Query handlers
- Event projections

### When to Use
- Complex domains
- High read/write disparity
- Audit requirements
```

### Shared Skills

Common skills used across agents:

```markdown
<!-- .github/skills/shared/code-review.md -->

# Code Review Skill

## Knowledge

### Review Criteria
- Correctness
- Readability
- Performance
- Security
- Maintainability

### Feedback Patterns
- Be specific
- Suggest alternatives
- Explain reasoning
- Prioritize issues
```

## Skill Composition

### Prerequisites

```markdown
## Prerequisites

- @skills:javascript (JavaScript fundamentals)
- @skills:typescript (TypeScript basics)
- @skills:react-basics (React fundamentals)
```

### Skill Hierarchy

```
skills/
├── foundations/
│   ├── javascript.md
│   ├── typescript.md
│   └── html-css.md
├── frameworks/
│   ├── react-basics.md
│   ├── react-advanced.md
│   └── next-js.md
├── patterns/
│   ├── state-management.md
│   └── testing-patterns.md
└── shared/
    ├── code-review.md
    └── documentation.md
```

## TypeScript Skill Definition

For programmatic skill registration:

```typescript
// src/skills/graphql-api-design.ts

import { Skill, SkillConfig } from '@agentic/core';

export const graphqlApiDesign: Skill = {
  id: 'graphql-api-design',
  name: 'GraphQL API Design',
  description: 'GraphQL schema design and best practices',
  version: '1.0.0',
  
  prerequisites: [
    'api-design',
    'typescript'
  ],
  
  knowledge: {
    concepts: [
      'Schema design',
      'Type definitions',
      'Resolvers',
      'Pagination',
      'Error handling'
    ],
    
    patterns: [
      'Relay Connection Spec',
      'Input/Payload pattern',
      'DataLoader pattern'
    ],
    
    tools: [
      'graphql-codegen',
      'apollo-server',
      'graphql-tools'
    ]
  },
  
  examples: [
    {
      name: 'Basic Schema',
      input: 'Create user type with posts',
      output: `type User {
        id: ID!
        posts: [Post!]!
      }`
    }
  ],
  
  compatibleAgents: [
    'api-designer',
    'backend-specialist',
    'fullstack-specialist'
  ]
};
```

## Skill Registry

```typescript
// src/skills/registry.ts

import { SkillRegistry } from '@agentic/core';
import { graphqlApiDesign } from './graphql-api-design';
import { reactAdvanced } from './react-advanced';

export const skillRegistry = new SkillRegistry();

// Register skills
skillRegistry.register(graphqlApiDesign);
skillRegistry.register(reactAdvanced);

// Get skill by ID
const skill = skillRegistry.get('graphql-api-design');

// Get all skills for agent
const agentSkills = skillRegistry.getForAgent('api-designer');
```

## Testing Skills

### Skill Validation

```typescript
// test/skills/graphql-api-design.test.ts

import { describe, it, expect } from 'vitest';
import { graphqlApiDesign } from '../../src/skills/graphql-api-design';
import { validateSkill } from '@agentic/core';

describe('GraphQL API Design Skill', () => {
  it('should have valid structure', () => {
    const result = validateSkill(graphqlApiDesign);
    expect(result.valid).toBe(true);
  });
  
  it('should list prerequisites', () => {
    expect(graphqlApiDesign.prerequisites).toContain('api-design');
  });
  
  it('should include required knowledge areas', () => {
    expect(graphqlApiDesign.knowledge.concepts)
      .toContain('Schema design');
  });
});
```

### Agent Integration Test

```typescript
// test/integration/skill-agent.test.ts

import { describe, it, expect } from 'vitest';
import { loadAgent } from '@agentic/core';

describe('Skill-Agent Integration', () => {
  it('should load skills into agent', async () => {
    const agent = await loadAgent('api-designer');
    
    expect(agent.skills).toContainEqual(
      expect.objectContaining({ id: 'graphql-api-design' })
    );
  });
  
  it('should apply skill knowledge', async () => {
    const agent = await loadAgent('api-designer');
    const response = await agent.process(
      'Create a GraphQL schema for blog posts'
    );
    
    expect(response).toContain('type Post');
    expect(response).toContain('Connection');
  });
});
```

## Skill Best Practices

### 1. Focused Scope

```markdown
<!-- ✅ Good: Focused skill -->
# React Hooks

## Description
Expertise in React hooks patterns and custom hook development.

<!-- ❌ Bad: Too broad -->
# React Everything

## Description
All React knowledge including hooks, components, routing, state...
```

### 2. Actionable Knowledge

```markdown
## Knowledge

<!-- ✅ Good: Actionable patterns -->
### Custom Hook Pattern

```typescript
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  // ... implementation
}
```

<!-- ❌ Bad: Too theoretical -->
### Hooks Theory
Hooks are functions that let you use state and lifecycle...
```

### 3. Include Examples

```markdown
## Examples

### Example: Form Validation Hook

Input: Create a form validation hook
Output:
```typescript
function useFormValidation(schema: Schema) {
  const [errors, setErrors] = useState({});
  
  const validate = (values) => {
    const result = schema.validate(values);
    setErrors(result.errors);
    return result.valid;
  };
  
  return { errors, validate };
}
```
```

### 4. Document Tools

```markdown
## Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| React DevTools | Component debugging | Development |
| Testing Library | Component testing | Testing |
| Storybook | Component docs | Documentation |
```

## Organizing Skills

### By Domain

```
skills/
├── frontend/
│   ├── react.md
│   ├── vue.md
│   └── angular.md
├── backend/
│   ├── dotnet.md
│   ├── nodejs.md
│   └── python.md
└── cloud/
    ├── azure.md
    └── aws.md
```

### By Complexity

```
skills/
├── fundamentals/
│   ├── javascript.md
│   └── typescript.md
├── intermediate/
│   ├── react-basics.md
│   └── api-design.md
└── advanced/
    ├── react-performance.md
    └── microservices.md
```

## Next Steps

- [Creating Scenarios](Creating-Scenarios) - Custom project templates
- [Building Agents](Building-Agents) - Agent development
- [Skills Catalog](../agents/Skills) - Reference skills
