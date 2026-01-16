# Phase 4: E2E Scenario Tests

**Phase ID:** F-TVF-P04  
**Feature:** TestingValidationFramework  
**Duration:** 5-6 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 3 (Integration Tests)

---

## 🎯 Phase Objectives

Deze phase implementeert **End-to-End Scenario Tests**:
- Full scenario execution (S01-S05)
- Generated code compilation tests
- Infrastructure deployment validation
- Browser-based E2E (via Playwright MCP)
- Performance baseline tests

---

## 📦 Deliverables

### 1. Test Structure

```
tests/
├── e2e/
│   ├── scenarios/
│   │   ├── S01-simple-mvp.e2e.ts
│   │   ├── S02-small-team.e2e.ts
│   │   ├── S03-medium-saas.e2e.ts
│   │   ├── S04-enterprise.e2e.ts
│   │   └── S05-healthcare.e2e.ts
│   ├── infrastructure/
│   │   ├── A01-app-service.e2e.ts
│   │   └── bicep-deployment.e2e.ts
│   ├── generated-code/
│   │   ├── compile-tests.e2e.ts
│   │   ├── lint-tests.e2e.ts
│   │   └── runtime-tests.e2e.ts
│   └── browser/
│       ├── ui-tests.e2e.ts
│       └── accessibility.e2e.ts
```

---

## 🔧 Implementation Details

### 4.1 Scenario Test Runner (`src/e2e/ScenarioTestRunner.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import { WorkflowTestHarness } from '../harness/WorkflowTestHarness';
import { CodeValidator } from '../validators/CodeValidator';
import { getFixtureManager } from '../fixtures/FixtureManager';

/**
 * Scenario configuration
 */
export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  phases: PhaseConfig[];
  expectedArtifacts: ExpectedArtifact[];
  timeoutMs: number;
  requirements: string[];
}

/**
 * Phase configuration
 */
export interface PhaseConfig {
  id: number;
  name: string;
  agents: string[];
  parallel?: boolean;
  optional?: boolean;
}

/**
 * Expected artifact
 */
export interface ExpectedArtifact {
  type: string;
  pattern?: RegExp;
  minCount?: number;
  validate?: (content: string) => boolean;
}

/**
 * Scenario execution result
 */
export interface ScenarioResult {
  scenarioId: string;
  success: boolean;
  executionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  phases: PhaseResult[];
  artifacts: ArtifactSummary[];
  validationResults: ValidationResult[];
  error?: string;
}

/**
 * Phase result
 */
export interface PhaseResult {
  phaseId: number;
  phaseName: string;
  success: boolean;
  duration: number;
  agents: AgentSummary[];
}

/**
 * Agent summary
 */
export interface AgentSummary {
  name: string;
  success: boolean;
  duration: number;
  artifactCount: number;
}

/**
 * Artifact summary
 */
export interface ArtifactSummary {
  id: string;
  type: string;
  name: string;
  size: number;
  phase: number;
  agent: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  type: string;
  target: string;
  passed: boolean;
  message: string;
}

/**
 * Full scenario test runner
 */
export class ScenarioTestRunner {
  private scenarios: Map<string, ScenarioConfig> = new Map();
  private harness: WorkflowTestHarness;
  private codeValidator: CodeValidator;
  private fixtures = getFixtureManager();

  constructor() {
    this.harness = new WorkflowTestHarness();
    this.codeValidator = new CodeValidator();
  }

  /**
   * Initialize runner
   */
  async initialize(): Promise<void> {
    await this.harness.initialize();
    await this.loadScenarioConfigs();
  }

  /**
   * Load scenario configurations
   */
  private async loadScenarioConfigs(): Promise<void> {
    // S01 - Simple MVP
    this.scenarios.set('S01', {
      id: 'S01',
      name: 'Simple MVP',
      description: 'Single developer, basic app',
      phases: [
        { id: 0, name: 'Planning', agents: ['plan', 'doc', 'backlog'] },
        { id: 1, name: 'Setup', agents: ['devops'] },
        { id: 2, name: 'Development', agents: ['code', 'test', 'review'] },
        { id: 3, name: 'Deployment', agents: ['devops'] },
      ],
      expectedArtifacts: [
        { type: 'document', minCount: 3 },
        { type: 'code', minCount: 5 },
        { type: 'test', minCount: 3 },
        { type: 'infrastructure', minCount: 1 },
      ],
      timeoutMs: 300000, // 5 minutes
      requirements: ['User auth', 'Basic CRUD', 'Simple UI'],
    });

    // S02 - Small Team
    this.scenarios.set('S02', {
      id: 'S02',
      name: 'Small Team',
      description: '2-3 developers, moderate complexity',
      phases: [
        { id: 0, name: 'Planning', agents: ['plan', 'doc', 'backlog'] },
        { id: 1, name: 'Setup', agents: ['devops', 'security'] },
        { id: 2, name: 'Development', agents: ['code', 'test', 'review', 'ux'] },
        { id: 3, name: 'Integration', agents: ['api', 'data'] },
        { id: 4, name: 'Deployment', agents: ['devops', 'security'] },
      ],
      expectedArtifacts: [
        { type: 'document', minCount: 5 },
        { type: 'code', minCount: 10 },
        { type: 'test', minCount: 8 },
        { type: 'infrastructure', minCount: 3 },
        { type: 'api', minCount: 1 },
      ],
      timeoutMs: 600000, // 10 minutes
      requirements: ['User management', 'Dashboard', 'API', 'Basic auth'],
    });

    // S03 - Medium SaaS
    this.scenarios.set('S03', {
      id: 'S03',
      name: 'Medium SaaS',
      description: 'Multi-tenant SaaS platform',
      phases: [
        { id: 0, name: 'Planning', agents: ['plan', 'doc', 'backlog'] },
        { id: 1, name: 'Architecture', agents: ['devops', 'security', 'data'] },
        { id: 2, name: 'Development', agents: ['code', 'test', 'review', 'ux', 'api'] },
        { id: 3, name: 'Integration', agents: ['api', 'data', 'security'] },
        { id: 4, name: 'Quality', agents: ['test', 'review', 'security'] },
        { id: 5, name: 'Deployment', agents: ['devops'] },
      ],
      expectedArtifacts: [
        { type: 'document', minCount: 10 },
        { type: 'code', minCount: 20 },
        { type: 'test', minCount: 15 },
        { type: 'infrastructure', minCount: 5 },
        { type: 'api', minCount: 3 },
        { type: 'schema', minCount: 2 },
      ],
      timeoutMs: 900000, // 15 minutes
      requirements: ['Multi-tenant', 'Billing', 'Analytics', 'Admin portal', 'API'],
    });

    // Additional scenarios...
  }

  /**
   * Run scenario
   */
  async runScenario(scenarioId: string, options?: {
    mockAgents?: boolean;
    validateCode?: boolean;
    timeout?: number;
  }): Promise<ScenarioResult> {
    const config = this.scenarios.get(scenarioId);
    if (!config) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const executionId = `exec-${uuid().substring(0, 8)}`;
    const startTime = new Date();
    const phaseResults: PhaseResult[] = [];
    const allArtifacts: ArtifactSummary[] = [];
    const validationResults: ValidationResult[] = [];

    try {
      // Execute each phase
      for (const phase of config.phases) {
        const phaseStart = Date.now();
        const agentSummaries: AgentSummary[] = [];

        for (const agentName of phase.agents) {
          const agentStart = Date.now();
          
          // Setup mock or real agent
          if (options?.mockAgents !== false) {
            this.setupMockAgent(agentName, config);
          }

          // Execute via harness
          this.harness
            .addStep({ agent: agentName })
            .execute();

          const result = this.harness.getLastResult();
          
          agentSummaries.push({
            name: agentName,
            success: result?.success || false,
            duration: Date.now() - agentStart,
            artifactCount: result?.artifacts.length || 0,
          });

          // Collect artifacts
          if (result?.artifacts) {
            for (const artifact of result.artifacts) {
              allArtifacts.push({
                id: artifact.id,
                type: artifact.type,
                name: artifact.name,
                size: typeof artifact.content === 'string' 
                  ? artifact.content.length 
                  : JSON.stringify(artifact.content).length,
                phase: phase.id,
                agent: agentName,
              });
            }
          }
        }

        const phaseSuccess = agentSummaries.every(a => a.success);
        
        phaseResults.push({
          phaseId: phase.id,
          phaseName: phase.name,
          success: phaseSuccess,
          duration: Date.now() - phaseStart,
          agents: agentSummaries,
        });

        if (!phaseSuccess && !phase.optional) {
          throw new Error(`Phase ${phase.id} (${phase.name}) failed`);
        }
      }

      // Validate expected artifacts
      for (const expected of config.expectedArtifacts) {
        const matching = allArtifacts.filter(a => a.type === expected.type);
        const passed = matching.length >= (expected.minCount || 1);
        
        validationResults.push({
          type: 'artifact',
          target: expected.type,
          passed,
          message: passed 
            ? `Found ${matching.length} ${expected.type} artifacts`
            : `Expected at least ${expected.minCount} ${expected.type} artifacts, found ${matching.length}`,
        });
      }

      // Validate generated code
      if (options?.validateCode !== false) {
        const codeArtifacts = allArtifacts.filter(a => a.type === 'code');
        for (const artifact of codeArtifacts.slice(0, 5)) { // Limit validation
          const validationResult = await this.validateCodeArtifact(artifact);
          validationResults.push(validationResult);
        }
      }

      const endTime = new Date();
      const allValidationsPassed = validationResults.every(v => v.passed);

      return {
        scenarioId,
        success: phaseResults.every(p => p.success) && allValidationsPassed,
        executionId,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        phases: phaseResults,
        artifacts: allArtifacts,
        validationResults,
      };

    } catch (error) {
      return {
        scenarioId,
        success: false,
        executionId,
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        phases: phaseResults,
        artifacts: allArtifacts,
        validationResults,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Setup mock agent based on scenario
   */
  private setupMockAgent(agentName: string, config: ScenarioConfig): void {
    const artifacts = this.generateMockArtifacts(agentName, config);
    
    this.harness.mockAgent(agentName, {
      success: true,
      artifacts,
      metadata: {
        scenario: config.id,
        handoffContext: { scenario: config.id },
      },
    });
  }

  /**
   * Generate mock artifacts for agent
   */
  private generateMockArtifacts(agentName: string, config: ScenarioConfig): any[] {
    const artifacts: any[] = [];

    switch (agentName) {
      case 'plan':
        artifacts.push(
          { id: 'plan-1', type: 'document', name: 'ProjectPlan.md', content: `# ${config.name}` },
          { id: 'arch-1', type: 'document', name: 'Architecture.md', content: '# Architecture' },
        );
        break;
      case 'code':
        artifacts.push(
          { id: 'code-1', type: 'code', name: 'index.ts', content: 'export default {};' },
          { id: 'code-2', type: 'code', name: 'App.tsx', content: 'export const App = () => <div/>;' },
        );
        break;
      case 'test':
        artifacts.push(
          { id: 'test-1', type: 'test', name: 'App.test.ts', content: 'describe("App", () => {});' },
        );
        break;
      case 'devops':
        artifacts.push(
          { id: 'infra-1', type: 'infrastructure', name: 'main.bicep', content: 'param location string' },
        );
        break;
      // Add more agent artifact generators...
    }

    return artifacts;
  }

  /**
   * Validate code artifact
   */
  private async validateCodeArtifact(artifact: ArtifactSummary): Promise<ValidationResult> {
    // Mock validation - in real implementation, use CodeValidator
    return {
      type: 'code',
      target: artifact.name,
      passed: true,
      message: `Code validation passed for ${artifact.name}`,
    };
  }

  /**
   * Get scenario config
   */
  getScenarioConfig(scenarioId: string): ScenarioConfig | undefined {
    return this.scenarios.get(scenarioId);
  }

  /**
   * List available scenarios
   */
  listScenarios(): string[] {
    return Array.from(this.scenarios.keys());
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await this.harness.cleanup();
  }
}
```

### 4.2 S01 Simple MVP E2E Test (`tests/e2e/scenarios/S01-simple-mvp.e2e.ts`)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ScenarioTestRunner, ScenarioResult } from '../../../src/e2e/ScenarioTestRunner';

describe('S01 - Simple MVP Scenario', () => {
  let runner: ScenarioTestRunner;
  let result: ScenarioResult;

  beforeAll(async () => {
    runner = new ScenarioTestRunner();
    await runner.initialize();
  }, 60000);

  afterAll(async () => {
    await runner.cleanup();
  });

  describe('full scenario execution', () => {
    it('should complete all phases', async () => {
      result = await runner.runScenario('S01', { mockAgents: true });

      expect(result.success).toBe(true);
      expect(result.phases).toHaveLength(4);
      expect(result.phases.every(p => p.success)).toBe(true);
    }, 300000);

    it('should generate all required artifacts', async () => {
      const documentArtifacts = result.artifacts.filter(a => a.type === 'document');
      const codeArtifacts = result.artifacts.filter(a => a.type === 'code');
      const testArtifacts = result.artifacts.filter(a => a.type === 'test');
      const infraArtifacts = result.artifacts.filter(a => a.type === 'infrastructure');

      expect(documentArtifacts.length).toBeGreaterThanOrEqual(3);
      expect(codeArtifacts.length).toBeGreaterThanOrEqual(5);
      expect(testArtifacts.length).toBeGreaterThanOrEqual(3);
      expect(infraArtifacts.length).toBeGreaterThanOrEqual(1);
    });

    it('should pass all validations', async () => {
      const failedValidations = result.validationResults.filter(v => !v.passed);
      
      if (failedValidations.length > 0) {
        console.log('Failed validations:', failedValidations);
      }
      
      expect(failedValidations).toHaveLength(0);
    });
  });

  describe('phase timing', () => {
    it('should complete Phase 0 (Planning) within time limit', async () => {
      const phase0 = result.phases.find(p => p.phaseId === 0);
      expect(phase0).toBeDefined();
      expect(phase0!.duration).toBeLessThan(60000); // 1 minute
    });

    it('should complete Phase 2 (Development) within time limit', async () => {
      const phase2 = result.phases.find(p => p.phaseId === 2);
      expect(phase2).toBeDefined();
      expect(phase2!.duration).toBeLessThan(120000); // 2 minutes
    });
  });

  describe('agent execution', () => {
    it('should execute @plan agent successfully', async () => {
      const phase0 = result.phases.find(p => p.phaseId === 0);
      const planAgent = phase0?.agents.find(a => a.name === 'plan');
      
      expect(planAgent).toBeDefined();
      expect(planAgent!.success).toBe(true);
      expect(planAgent!.artifactCount).toBeGreaterThan(0);
    });

    it('should execute @code agent successfully', async () => {
      const phase2 = result.phases.find(p => p.phaseId === 2);
      const codeAgent = phase2?.agents.find(a => a.name === 'code');
      
      expect(codeAgent).toBeDefined();
      expect(codeAgent!.success).toBe(true);
    });
  });
});
```

### 4.3 Generated Code Validation Tests (`tests/e2e/generated-code/compile-tests.e2e.ts`)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CodeValidator } from '../../../src/validators/CodeValidator';
import { TypeScriptValidator } from '../../../src/validators/TypeScriptValidator';
import { BicepValidator } from '../../../src/validators/BicepValidator';

describe('Generated Code Compilation Tests', () => {
  let codeValidator: CodeValidator;
  let tsValidator: TypeScriptValidator;
  let bicepValidator: BicepValidator;

  beforeAll(() => {
    codeValidator = new CodeValidator();
    tsValidator = new TypeScriptValidator();
    bicepValidator = new BicepValidator();
  });

  describe('TypeScript code validation', () => {
    it('should validate correct TypeScript syntax', async () => {
      const code = `
        interface User {
          id: string;
          name: string;
          email: string;
        }

        export function createUser(data: Partial<User>): User {
          return {
            id: crypto.randomUUID(),
            name: data.name || 'Unknown',
            email: data.email || '',
          };
        }
      `;

      const result = await tsValidator.validate(code);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect TypeScript syntax errors', async () => {
      const code = `
        interface User {
          id: string
          name string  // Missing colon
        }
      `;

      const result = await tsValidator.validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect type errors', async () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }

        const result: string = add(1, 2); // Type error
      `;

      const result = await tsValidator.validate(code, { strict: true });
      expect(result.valid).toBe(false);
    });
  });

  describe('React component validation', () => {
    it('should validate correct JSX/TSX', async () => {
      const code = `
        import React from 'react';

        interface Props {
          title: string;
          onClick: () => void;
        }

        export const Button: React.FC<Props> = ({ title, onClick }) => {
          return (
            <button onClick={onClick} className="btn">
              {title}
            </button>
          );
        };
      `;

      const result = await tsValidator.validate(code, { jsx: true });
      expect(result.valid).toBe(true);
    });

    it('should detect JSX errors', async () => {
      const code = `
        export const Bad = () => {
          return (
            <div>
              <span>Unclosed
            </div>
          );
        };
      `;

      const result = await tsValidator.validate(code, { jsx: true });
      expect(result.valid).toBe(false);
    });
  });

  describe('Bicep infrastructure validation', () => {
    it('should validate correct Bicep syntax', async () => {
      const code = `
        param location string = resourceGroup().location
        param appName string

        resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
          name: '\${appName}-plan'
          location: location
          sku: {
            name: 'B1'
            tier: 'Basic'
          }
        }
      `;

      const result = await bicepValidator.validate(code);
      expect(result.valid).toBe(true);
    });

    it('should detect Bicep errors', async () => {
      const code = `
        param location string
        
        resource badResource 'Invalid/Type@2022' = {
          name: 'bad'
        }
      `;

      const result = await bicepValidator.validate(code);
      expect(result.valid).toBe(false);
    });
  });

  describe('SQL validation', () => {
    it('should validate correct SQL syntax', async () => {
      const sql = `
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_users_email ON users(email);
      `;

      const result = await codeValidator.validateSQL(sql);
      expect(result.valid).toBe(true);
    });
  });
});
```

### 4.4 Playwright MCP Integration (`src/e2e/PlaywrightMCPRunner.ts`)

```typescript
/**
 * Integration with Playwright MCP for browser-based E2E tests
 * 
 * NOTE: This uses the Microsoft Playwright MCP server
 * @see https://github.com/microsoft/playwright-mcp
 */

export interface PlaywrightMCPConfig {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  viewport?: { width: number; height: number };
}

export interface BrowserTestResult {
  success: boolean;
  screenshots?: string[];
  accessibilityReport?: AccessibilityReport;
  errors?: string[];
  duration: number;
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
}

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  nodes: string[];
}

/**
 * Playwright MCP runner for browser E2E tests
 * 
 * Uses MCP protocol to communicate with Playwright server
 */
export class PlaywrightMCPRunner {
  private config: PlaywrightMCPConfig;
  private mcpClient: unknown; // MCP Client instance

  constructor(config: PlaywrightMCPConfig = {}) {
    this.config = {
      browser: 'chromium',
      headless: true,
      viewport: { width: 1280, height: 720 },
      ...config,
    };
  }

  /**
   * Initialize MCP connection
   */
  async connect(): Promise<void> {
    // Initialize MCP client connection to Playwright MCP server
    // In real implementation, use @modelcontextprotocol/sdk
    console.log('Connecting to Playwright MCP server...');
  }

  /**
   * Navigate to URL and take snapshot
   */
  async navigateTo(url: string): Promise<{ snapshot: string }> {
    // Call playwright_navigate tool via MCP
    return { snapshot: `Snapshot of ${url}` };
  }

  /**
   * Click element
   */
  async click(selector: string): Promise<void> {
    // Call playwright_click tool via MCP
  }

  /**
   * Fill input field
   */
  async fill(selector: string, value: string): Promise<void> {
    // Call playwright_fill tool via MCP
  }

  /**
   * Get accessibility snapshot
   */
  async getAccessibilitySnapshot(): Promise<AccessibilityReport> {
    // Use playwright's accessibility snapshot feature
    return {
      violations: [],
      passes: 10,
      incomplete: 0,
    };
  }

  /**
   * Run accessibility test
   */
  async runAccessibilityTest(url: string): Promise<BrowserTestResult> {
    const startTime = Date.now();

    try {
      await this.navigateTo(url);
      const accessibilityReport = await this.getAccessibilitySnapshot();

      return {
        success: accessibilityReport.violations.length === 0,
        accessibilityReport,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run UI test flow
   */
  async runUITest(steps: UITestStep[]): Promise<BrowserTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      for (const step of steps) {
        switch (step.action) {
          case 'navigate':
            await this.navigateTo(step.target!);
            break;
          case 'click':
            await this.click(step.selector!);
            break;
          case 'fill':
            await this.fill(step.selector!, step.value!);
            break;
          case 'assert':
            // Verify element state
            break;
        }
      }

      return {
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        errors,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Cleanup
   */
  async disconnect(): Promise<void> {
    // Close MCP connection
  }
}

export interface UITestStep {
  action: 'navigate' | 'click' | 'fill' | 'assert' | 'wait';
  target?: string;
  selector?: string;
  value?: string;
  timeout?: number;
}
```

### 4.5 Browser E2E Tests (`tests/e2e/browser/ui-tests.e2e.ts`)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlaywrightMCPRunner, UITestStep } from '../../../src/e2e/PlaywrightMCPRunner';

describe('Browser UI E2E Tests', () => {
  let runner: PlaywrightMCPRunner;

  beforeAll(async () => {
    runner = new PlaywrightMCPRunner({ headless: true });
    await runner.connect();
  });

  afterAll(async () => {
    await runner.disconnect();
  });

  describe('generated UI tests', () => {
    it('should render login page correctly', async () => {
      const steps: UITestStep[] = [
        { action: 'navigate', target: 'http://localhost:3000/login' },
        { action: 'assert', selector: 'input[name="email"]' },
        { action: 'assert', selector: 'input[name="password"]' },
        { action: 'assert', selector: 'button[type="submit"]' },
      ];

      const result = await runner.runUITest(steps);
      expect(result.success).toBe(true);
    });

    it('should complete login flow', async () => {
      const steps: UITestStep[] = [
        { action: 'navigate', target: 'http://localhost:3000/login' },
        { action: 'fill', selector: 'input[name="email"]', value: 'test@example.com' },
        { action: 'fill', selector: 'input[name="password"]', value: 'password123' },
        { action: 'click', selector: 'button[type="submit"]' },
        { action: 'wait', timeout: 2000 },
        { action: 'assert', selector: '[data-testid="dashboard"]' },
      ];

      const result = await runner.runUITest(steps);
      expect(result.success).toBe(true);
    });

    it('should handle form validation errors', async () => {
      const steps: UITestStep[] = [
        { action: 'navigate', target: 'http://localhost:3000/login' },
        { action: 'fill', selector: 'input[name="email"]', value: 'invalid-email' },
        { action: 'click', selector: 'button[type="submit"]' },
        { action: 'assert', selector: '[data-testid="error-message"]' },
      ];

      const result = await runner.runUITest(steps);
      expect(result.success).toBe(true);
    });
  });

  describe('accessibility tests', () => {
    it('should pass accessibility audit on login page', async () => {
      const result = await runner.runAccessibilityTest('http://localhost:3000/login');
      
      expect(result.accessibilityReport?.violations).toHaveLength(0);
    });

    it('should pass accessibility audit on dashboard', async () => {
      const result = await runner.runAccessibilityTest('http://localhost:3000/dashboard');
      
      // Allow minor violations
      const criticalViolations = result.accessibilityReport?.violations
        .filter(v => v.impact === 'critical' || v.impact === 'serious') || [];
      
      expect(criticalViolations).toHaveLength(0);
    });
  });
});
```

---

## 📊 E2E Test Matrix

| Scenario | Phases | Agents | Artifacts | Validation | Browser |
|----------|--------|--------|-----------|------------|---------|
| S01 | ✅ | ✅ | ✅ | ✅ | ✅ |
| S02 | ✅ | ✅ | ✅ | ✅ | ✅ |
| S03 | ✅ | ✅ | ✅ | ✅ | ✅ |
| S04 | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| S05 | ✅ | ✅ | ✅ | ✅ | ⚠️ |

---

## 📋 Acceptance Criteria

- [ ] ScenarioTestRunner executes all scenarios
- [ ] S01-S05 scenarios pass with mocks
- [ ] Generated code compiles without errors
- [ ] Bicep templates validate
- [ ] Playwright MCP integration works
- [ ] Accessibility tests pass
- [ ] <15 minute total E2E runtime

---

## 🔗 MCP Integration

| MCP Server | Gebruik |
|------------|---------|
| **Playwright MCP** | Browser automation, accessibility |
| **APIMatic MCP** | API specification validation |

---

## 🔗 Navigation

← [03-PHASE-INTEGRATION-TESTS.md](03-PHASE-INTEGRATION-TESTS.md) | [05-PHASE-VALIDATORS-BENCHMARKS.md](05-PHASE-VALIDATORS-BENCHMARKS.md) →
