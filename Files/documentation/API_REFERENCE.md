# API Reference

**Version**: 2.0  
**Updated**: January 13, 2026

---

## Overview

Complete API reference for AgenticCoder agents, skills, and core services.

---

## Table of Contents

1. [Core API](#core-api)
2. [Orchestration Agents](#orchestration-agents)
3. [Architecture Agents](#architecture-agents)
4. [Implementation Agents](#implementation-agents)
5. [DevOps Agents](#devops-agents)
6. [Skills API](#skills-api)
7. [Data Types](#data-types)
8. [Error Handling](#error-handling)
9. [Examples](#examples)

---

## Core API

### AgentOrchestrator

Main entry point for executing projects.

```typescript
class AgentOrchestrator {
  /**
   * Execute a complete project generation
   * @param spec - Project specification
   * @param options - Execution options
   * @returns Project artifacts
   */
  execute(spec: ProjectSpec, options?: ExecuteOptions): Promise<ProjectArtifacts>;
  
  /**
   * Execute specific phases
   * @param spec - Project specification
   * @param phases - Phase numbers to execute
   */
  executePhases(spec: ProjectSpec, phases: number[]): Promise<PhaseResults>;
  
  /**
   * Get execution status
   * @param projectId - Project identifier
   */
  getStatus(projectId: string): Promise<ExecutionStatus>;
  
  /**
   * Cancel execution
   * @param projectId - Project identifier
   */
  cancel(projectId: string): Promise<void>;
}
```

### AgentRegistry

Manages agent registration and lookup.

```typescript
class AgentRegistry {
  /**
   * Register an agent
   * @param agent - Agent instance
   */
  register(agent: BaseAgent): void;
  
  /**
   * Get agent by name
   * @param name - Agent name (e.g., 'react-specialist')
   */
  getAgent(name: string): BaseAgent;
  
  /**
   * Get all agents
   */
  getAllAgents(): BaseAgent[];
  
  /**
   * Get agents by tier
   * @param tier - 'orchestration' | 'architecture' | 'implementation' | 'devops'
   */
  getAgentsByTier(tier: AgentTier): BaseAgent[];
  
  /**
   * Get agents by phase
   * @param phase - Phase number
   */
  getAgentsByPhase(phase: number): BaseAgent[];
}
```

### SkillRegistry

Manages skill registration and composition.

```typescript
class SkillRegistry {
  /**
   * Register a skill
   * @param skill - Skill instance
   */
  register(skill: BaseSkill): void;
  
  /**
   * Get skill by name
   * @param name - Skill name
   */
  getSkill(name: string): BaseSkill;
  
  /**
   * Get skills by category
   * @param category - Skill category
   */
  getSkillsByCategory(category: SkillCategory): BaseSkill[];
  
  /**
   * Compose skills
   * @param skillNames - Names of skills to combine
   */
  compose(skillNames: string[]): ComposedSkill;
}
```

---

## Orchestration Agents

### @plan

Entry point agent that orchestrates all execution.

```typescript
interface PlanInput {
  projectName: string;
  description: string;
  requirements: Record<string, any>;
  constraints?: {
    budget?: number;
    timeline?: string;
    team?: string;
  };
}

interface PlanOutput {
  projectId: string;
  executionPlan: ExecutionPlan;
  timeline: Timeline;
  estimatedCost: number;
}

@plan.execute(input: PlanInput): Promise<PlanOutput>;
```

### @requirements-analyzer

Analyzes and validates requirements.

```typescript
interface RequirementsInput {
  description: string;
  targetUsers?: number;
  features: string[];
  constraints?: Record<string, any>;
}

interface RequirementsOutput {
  requirements: Requirement[];
  validationResults: ValidationResult[];
  gaps: string[];
  recommendations: string[];
}

@requirementsAnalyzer.execute(input: RequirementsInput): Promise<RequirementsOutput>;
```

### @security-auditor

Identifies security requirements.

```typescript
interface SecurityInput {
  requirements: Requirement[];
  dataTypes: string[];
  userTypes: string[];
}

interface SecurityOutput {
  threats: Threat[];
  controls: SecurityControl[];
  recommendations: string[];
  complianceRequirements: string[];
}

@securityAuditor.execute(input: SecurityInput): Promise<SecurityOutput>;
```

### @performance-optimizer

Defines performance targets and metrics.

```typescript
interface PerformanceInput {
  targetUsers: number;
  features: Feature[];
  dataVolume?: number;
}

interface PerformanceOutput {
  targets: PerformanceTarget[];
  metrics: PerformanceMetric[];
  optimization: OptimizationPlan[];
}

@performanceOptimizer.execute(input: PerformanceInput): Promise<PerformanceOutput>;
```

### @project-validator

Validates all specifications.

```typescript
interface ValidationInput {
  requirements: RequirementsOutput;
  security: SecurityOutput;
  performance: PerformanceOutput;
}

interface ValidationOutput {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

@projectValidator.execute(input: ValidationInput): Promise<ValidationOutput>;
```

---

## Architecture Agents

### @code-architect

Designs code structure and patterns.

```typescript
interface ArchitectureInput {
  frontend: string;           // 'React', 'Vue', etc.
  backend: string;            // 'Node.js', 'Python', etc.
  database: string;           // 'MySQL', 'MongoDB', etc.
  api: string;               // 'REST', 'GraphQL'
  requirements: Requirement[];
}

interface ArchitectureOutput {
  architecture: ArchitectureDesign;
  components: Component[];
  patterns: DesignPattern[];
  interfaces: Interface[];
}

@codeArchitect.execute(input: ArchitectureInput): Promise<ArchitectureOutput>;
```

### @infrastructure-designer

Plans cloud infrastructure.

```typescript
interface InfrastructureInput {
  platform: 'AWS' | 'Azure' | 'GCP';
  scalingRequirements: ScalingRequirement;
  availabilityRequirements: AvailabilityRequirement;
}

interface InfrastructureOutput {
  architecture: CloudArchitecture;
  resources: CloudResource[];
  networking: NetworkingPlan;
  monitoring: MonitoringPlan;
}

@infrastructureDesigner.execute(input: InfrastructureInput): Promise<InfrastructureOutput>;
```

### @database-modeler

Designs database schema.

```typescript
interface DatabaseInput {
  entities: Entity[];
  relationships: Relationship[];
  requirements: DatabaseRequirement[];
}

interface DatabaseOutput {
  schema: DatabaseSchema;
  tables: Table[];
  indexes: Index[];
  constraints: Constraint[];
}

@databaseModeler.execute(input: DatabaseInput): Promise<DatabaseOutput>;
```

### @deployment-strategist

Plans deployment strategy.

```typescript
interface DeploymentInput {
  architecture: ArchitectureDesign;
  environments: DeploymentEnvironment[];
  constraints: DeploymentConstraint[];
}

interface DeploymentOutput {
  strategy: DeploymentStrategy;
  pipelines: PipelineDefinition[];
  environments: EnvironmentConfig[];
}

@deploymentStrategist.execute(input: DeploymentInput): Promise<DeploymentOutput>;
```

---

## Implementation Agents

### Frontend Specialists

#### @react-specialist

```typescript
interface ReactInput {
  specification: ProjectSpec;
  architecture: ArchitectureDesign;
  components: ComponentSpec[];
}

interface ReactOutput {
  sourceCode: string;
  components: Component[];
  tests: TestSuite;
  documentation: string;
}

@reactSpecialist.execute(input: ReactInput): Promise<ReactOutput>;
```

#### @vue-specialist

```typescript
interface VueInput {
  specification: ProjectSpec;
  architecture: ArchitectureDesign;
  components: ComponentSpec[];
}

@vueSpecialist.execute(input: VueInput): Promise<ReactOutput>;
```

#### @angular-specialist & @svelte-specialist

Similar interfaces to React/Vue specialists.

### Backend Specialists

#### @nodejs-specialist

```typescript
interface NodeJsInput {
  specification: ProjectSpec;
  architecture: ArchitectureDesign;
  endpoints: EndpointSpec[];
}

interface NodeJsOutput {
  sourceCode: string;
  routes: RouteDefinition[];
  middleware: Middleware[];
  tests: TestSuite;
}

@nodeSpecialist.execute(input: NodeJsInput): Promise<NodeJsOutput>;
```

#### @python-specialist, @go-specialist, @java-specialist

Similar interfaces to Node.js specialist.

### Database Specialists

#### @mysql-specialist

```typescript
interface MySQLInput {
  schema: DatabaseSchema;
  architecture: ArchitectureDesign;
}

interface MySQLOutput {
  sqlScript: string;
  indexes: Index[];
  migrations: Migration[];
  seedData: SeedData;
}

@mysqlSpecialist.execute(input: MySQLInput): Promise<MySQLOutput>;
```

#### @mongodb-specialist, @postgres-specialist

Similar interfaces to MySQL specialist.

### API Specialists

#### @graphql-specialist

```typescript
interface GraphQLInput {
  schema: DatabaseSchema;
  endpoints: EndpointSpec[];
}

interface GraphQLOutput {
  schemaDefinition: string;
  resolvers: Resolver[];
  tests: TestSuite;
}

@graphqlSpecialist.execute(input: GraphQLInput): Promise<GraphQLOutput>;
```

#### @restful-specialist

```typescript
interface RestfulInput {
  schema: DatabaseSchema;
  endpoints: EndpointSpec[];
}

interface RestfulOutput {
  controllers: string;
  routes: RouteDefinition[];
  openapi: OpenAPISpec;
}

@restfulSpecialist.execute(input: RestfulInput): Promise<RestfulOutput>;
```

---

## DevOps Agents

### @docker-specialist

Creates container configuration.

```typescript
interface DockerInput {
  sourceCode: string;
  runtime: string;           // 'node', 'python', etc.
  dependencies: Dependency[];
}

interface DockerOutput {
  dockerfile: string;
  dockerCompose: string;
  imageConfig: ImageConfig;
  registryConfig: RegistryConfig;
}

@dockerSpecialist.execute(input: DockerInput): Promise<DockerOutput>;
```

### @devops-specialist

Sets up CI/CD pipelines.

```typescript
interface DevOpsInput {
  sourceCode: string;
  architecture: ArchitectureDesign;
  deploymentStrategy: DeploymentStrategy;
}

interface DevOpsOutput {
  githubActions: WorkflowDefinition[];
  pipelines: PipelineConfig[];
  monitoring: MonitoringConfig;
}

@devopsSpecialist.execute(input: DevOpsInput): Promise<DevOpsOutput>;
```

### @qa

Creates test suites and quality checks.

```typescript
interface QAInput {
  sourceCode: string;
  architecture: ArchitectureDesign;
  specifications: Specification[];
}

interface QAOutput {
  testSuites: TestSuite[];
  coverage: CoverageReport;
  qualityMetrics: QualityMetrics;
  recommendations: string[];
}

@qa.execute(input: QAInput): Promise<QAOutput>;
```

---

## Skills API

### BaseSkill

Base class for all skills.

```typescript
abstract class BaseSkill {
  /**
   * Unique skill identifier
   */
  name: string;
  
  /**
   * Skill category
   */
  category: SkillCategory;
  
  /**
   * Skill description
   */
  description: string;
  
  /**
   * Execute skill
   * @param input - Skill input
   */
  abstract execute(input: SkillInput): Promise<SkillOutput>;
  
  /**
   * Validate input
   * @param input - Input to validate
   */
  abstract validate(input: SkillInput): ValidationResult;
}
```

### Skill Categories

```typescript
// Planning Skills
class ProjectPlanningSkill extends BaseSkill {}
class RequirementsAnalysisSkill extends BaseSkill {}
class ValidationFrameworkSkill extends BaseSkill {}

// Architecture Skills
class ArchitecturePatternsSkill extends BaseSkill {}
class CloudInfrastructureSkill extends BaseSkill {}
class DatabaseDesignSkill extends BaseSkill {}

// Frontend Skills
class ReactBestPracticesSkill extends BaseSkill {}
class VueBestPracticesSkill extends BaseSkill {}
// ... etc

// Backend Skills
class NodeJsBestPracticesSkill extends BaseSkill {}
class PythonBestPracticesSkill extends BaseSkill {}
// ... etc

// Database Skills
class MySQLBestPracticesSkill extends BaseSkill {}
class MongoDBBestPracticesSkill extends BaseSkill {}
class PostgresBestPracticesSkill extends BaseSkill {}

// DevOps Skills
class SecurityBestPracticesSkill extends BaseSkill {}
class ContainerizationSkill extends BaseSkill {}
class DevOpsPracticesSkill extends BaseSkill {}
class TestingFrameworkSkill extends BaseSkill {}
```

---

## Data Types

### ProjectSpec

```typescript
interface ProjectSpec {
  projectId: string;
  projectName: string;
  description: string;
  frontend: string;           // 'React', 'Vue', 'Angular', 'Svelte'
  backend: string;            // 'Node.js', 'Python', 'Go', 'Java'
  database: string;           // 'MySQL', 'MongoDB', 'PostgreSQL'
  api: string;               // 'REST', 'GraphQL'
  
  requirements: {
    users: string[];
    features: Feature[];
    integrations?: Integration[];
  };
  
  constraints?: {
    budget?: number;
    timeline?: string;
    team?: string;
  };
  
  performance?: {
    targetUsers: number;
    targetLatency: string;
    targetThroughput: string;
  };
  
  security?: {
    authentication: AuthenticationMethod[];
    encryption: boolean;
    complianceRequirements: string[];
  };
  
  deployment?: {
    platform: 'AWS' | 'Azure' | 'GCP' | 'Self-Hosted';
    scalingStrategy: 'horizontal' | 'vertical' | 'hybrid';
    regions?: string[];
  };
}
```

### Artifact

```typescript
interface Artifact {
  id: string;
  type: 'code' | 'config' | 'documentation' | 'test';
  version: string;
  createdBy: string;              // Agent name
  createdAt: string;              // ISO 8601
  content: string | object;
  metadata: {
    language?: string;
    framework?: string;
    dependencies?: string[];
    lineCount?: number;
    testCoverage?: number;
  };
}
```

### ExecutionStatus

```typescript
interface ExecutionStatus {
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentPhase: number;
  progress: number;              // 0-100
  startTime: string;
  endTime?: string;
  errors: Error[];
  artifacts: Artifact[];
}
```

---

## Error Handling

### Error Types

```typescript
class AgentError extends Error {
  code: string;
  phase: number;
  agent: string;
  retryable: boolean;
}

class ValidationError extends AgentError {}
class ExecutionError extends AgentError {}
class TimeoutError extends AgentError {}
class SkillNotFoundError extends AgentError {}
```

### Error Codes

```
AGENT_NOT_FOUND = 'E001'
SKILL_NOT_FOUND = 'E002'
VALIDATION_FAILED = 'E003'
EXECUTION_TIMEOUT = 'E004'
EXECUTION_FAILED = 'E005'
INVALID_INPUT = 'E006'
INSUFFICIENT_RESOURCES = 'E007'
HANDOFF_FAILED = 'E008'
ARTIFACT_NOT_FOUND = 'E009'
ARTIFACT_CORRUPTED = 'E010'
```

### Error Response

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  phase: number;
  agent: string;
  details: Record<string, any>;
  retryable: boolean;
  retryAfterMs?: number;
}
```

---

## Examples

### Example 1: Simple Project

```typescript
const spec: ProjectSpec = {
  projectId: 'todo-app-001',
  projectName: 'Todo App',
  description: 'Simple todo list application',
  frontend: 'React',
  backend: 'Node.js',
  database: 'MySQL',
  api: 'REST',
  requirements: {
    users: ['authenticated-users'],
    features: [
      { name: 'create-todo', priority: 'high' },
      { name: 'list-todos', priority: 'high' },
      { name: 'update-todo', priority: 'medium' },
      { name: 'delete-todo', priority: 'medium' }
    ]
  }
};

const orchestrator = new AgentOrchestrator();
const result = await orchestrator.execute(spec);

console.log(result.projectId);      // 'todo-app-001'
console.log(result.artifacts.length); // Number of generated artifacts
```

### Example 2: Enterprise Project

```typescript
const spec: ProjectSpec = {
  projectId: 'ecommerce-platform-001',
  projectName: 'E-Commerce Platform',
  description: 'Multi-vendor marketplace with payments',
  frontend: 'React',
  backend: 'Python',
  database: 'PostgreSQL',
  api: 'GraphQL',
  
  requirements: {
    users: ['customers', 'vendors', 'admins'],
    features: [
      { name: 'user-authentication', priority: 'critical' },
      { name: 'product-catalog', priority: 'high' },
      { name: 'shopping-cart', priority: 'high' },
      { name: 'payments', priority: 'critical' },
      { name: 'vendor-management', priority: 'high' },
      { name: 'order-tracking', priority: 'medium' },
      { name: 'reviews-ratings', priority: 'medium' }
    ]
  },
  
  performance: {
    targetUsers: 100000,
    targetLatency: '< 200ms',
    targetThroughput: '10000 req/s'
  },
  
  security: {
    authentication: ['JWT', 'OAuth2'],
    encryption: true,
    complianceRequirements: ['PCI-DSS', 'GDPR']
  },
  
  deployment: {
    platform: 'AWS',
    scalingStrategy: 'horizontal',
    regions: ['us-east-1', 'eu-west-1']
  }
};

const result = await orchestrator.execute(spec);
```

### Example 3: Error Handling

```typescript
try {
  const result = await orchestrator.execute(invalidSpec);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
  } else if (error instanceof ExecutionError) {
    console.log('Execution failed:', error.message);
    if (error.retryable) {
      // Retry logic
    }
  } else {
    throw error;
  }
}
```

---

## Rate Limiting

```
Free Tier: 10 projects/day
Pro Tier: 100 projects/day
Enterprise: Unlimited

Per-Agent Limit: 100 concurrent executions
Per-Skill Limit: 1000 concurrent executions
```

---

## Versioning

This API follows semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

Current version: **2.0.0**

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
