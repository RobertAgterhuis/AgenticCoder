# Phase 1: Test Infrastructure

**Phase ID:** F-TVF-P01  
**Feature:** TestingValidationFramework  
**Duration:** 4-5 days  
**Status:** ⬜ Not Started  
**Depends On:** None

---

## 🎯 Phase Objectives

Deze phase bouwt de **test infrastructure foundation**:
- Vitest configuratie en setup
- Test utilities en helpers
- Mock registry voor agents/services
- Fixture management systeem
- Test reporter configuratie

---

## 📦 Deliverables

### 1. Package Structure

```
packages/testing/
├── package.json
├── vitest.config.ts
├── tsconfig.json
├── src/
│   ├── index.ts                    # Public exports
│   ├── config/
│   │   ├── vitest.setup.ts         # Global setup
│   │   └── TestConfig.ts           # Test configuration
│   ├── harness/
│   │   ├── TestHarness.ts          # Base test harness
│   │   ├── AgentTestHarness.ts     # Agent-specific harness
│   │   └── WorkflowTestHarness.ts  # Workflow test harness
│   ├── mocks/
│   │   ├── MockRegistry.ts         # Mock management
│   │   ├── MockAgent.ts            # Agent mock
│   │   ├── MockMessageBus.ts       # Message bus mock
│   │   └── MockMCPServer.ts        # MCP server mock
│   ├── fixtures/
│   │   ├── FixtureManager.ts       # Fixture loading
│   │   └── FixtureGenerator.ts     # Dynamic fixtures
│   ├── reporters/
│   │   ├── JUnitReporter.ts        # JUnit XML output
│   │   ├── HTMLReporter.ts         # HTML reports
│   │   └── ConsoleReporter.ts      # Console output
│   └── utils/
│       ├── TestUtils.ts            # Common utilities
│       ├── Assertions.ts           # Custom assertions
│       └── Timeouts.ts             # Timeout helpers
```

---

## 🔧 Implementation Details

### 1.1 Package Configuration (`package.json`)

```json
{
  "name": "@agenticcoder/testing",
  "version": "1.0.0",
  "description": "Testing framework for AgenticCoder",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "vitest": "^1.6.0",
    "@vitest/coverage-v8": "^1.6.0",
    "@vitest/ui": "^1.6.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

### 1.2 Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/config/vitest.setup.ts'],
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
    ],
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**', // E2E tests run separately
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/index.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    reporters: ['default', 'junit', 'html'],
    outputFile: {
      junit: './reports/junit.xml',
      html: './reports/index.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mocks': path.resolve(__dirname, './src/mocks'),
      '@fixtures': path.resolve(__dirname, './tests/fixtures'),
    },
  },
});
```

### 1.3 Test Configuration (`src/config/TestConfig.ts`)

```typescript
import { z } from 'zod';

/**
 * Test configuration schema
 */
export const TestConfigSchema = z.object({
  // Timeouts
  defaultTimeout: z.number().default(30000),
  agentTimeout: z.number().default(60000),
  workflowTimeout: z.number().default(120000),
  
  // Retries
  retryCount: z.number().default(2),
  retryDelay: z.number().default(1000),
  
  // Parallelization
  maxConcurrency: z.number().default(4),
  isolateTests: z.boolean().default(true),
  
  // Mocking
  useMocks: z.boolean().default(true),
  mockMCPServers: z.boolean().default(true),
  
  // Reporting
  verbose: z.boolean().default(false),
  generateReports: z.boolean().default(true),
  reportDir: z.string().default('./reports'),
  
  // Fixtures
  fixtureDir: z.string().default('./tests/fixtures'),
  snapshotDir: z.string().default('./tests/__snapshots__'),
  
  // CI/CD
  isCI: z.boolean().default(false),
  failFast: z.boolean().default(false),
});

export type TestConfig = z.infer<typeof TestConfigSchema>;

/**
 * Default test configuration
 */
export const defaultTestConfig: TestConfig = TestConfigSchema.parse({});

/**
 * Get test configuration
 */
export function getTestConfig(overrides?: Partial<TestConfig>): TestConfig {
  const baseConfig = {
    ...defaultTestConfig,
    isCI: process.env.CI === 'true',
  };
  
  return TestConfigSchema.parse({ ...baseConfig, ...overrides });
}
```

### 1.4 Global Setup (`src/config/vitest.setup.ts`)

```typescript
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/MockRegistry';
import { getTestConfig } from './TestConfig';

const config = getTestConfig();

// Global mock registry
let mockRegistry: MockRegistry;

beforeAll(async () => {
  mockRegistry = MockRegistry.getInstance();
  await mockRegistry.initialize();
  
  // Setup global mocks if enabled
  if (config.useMocks) {
    await mockRegistry.setupGlobalMocks();
  }
  
  // Mock console in CI
  if (config.isCI && !config.verbose) {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  }
});

afterAll(async () => {
  await mockRegistry.cleanup();
  vi.restoreAllMocks();
});

beforeEach(async (context) => {
  // Reset mocks between tests
  mockRegistry.resetAll();
  
  // Set test-specific timeout
  if (context.task.name.includes('[slow]')) {
    vi.setConfig({ testTimeout: config.workflowTimeout });
  }
});

afterEach(async () => {
  // Clear any pending timers
  vi.clearAllTimers();
});

// Custom matchers
expect.extend({
  toBeValidArtifact(received: unknown) {
    const isValid = received !== null && 
                   typeof received === 'object' &&
                   'id' in received &&
                   'type' in received;
    
    return {
      pass: isValid,
      message: () => `Expected ${received} to be a valid artifact`,
    };
  },
  
  toHaveSucceeded(received: { success: boolean; error?: string }) {
    return {
      pass: received.success === true,
      message: () => received.error 
        ? `Expected success but got error: ${received.error}`
        : 'Expected success but got failure',
    };
  },
});
```

### 1.5 Mock Registry (`src/mocks/MockRegistry.ts`)

```typescript
import { vi } from 'vitest';
import { MockAgent } from './MockAgent';
import { MockMessageBus } from './MockMessageBus';
import { MockMCPServer } from './MockMCPServer';

/**
 * Central registry for all test mocks
 */
export class MockRegistry {
  private static instance: MockRegistry;
  
  private agents: Map<string, MockAgent> = new Map();
  private messageBus: MockMessageBus | null = null;
  private mcpServers: Map<string, MockMCPServer> = new Map();
  private spies: Map<string, ReturnType<typeof vi.fn>> = new Map();

  private constructor() {}

  static getInstance(): MockRegistry {
    if (!this.instance) {
      this.instance = new MockRegistry();
    }
    return this.instance;
  }

  /**
   * Initialize mock registry
   */
  async initialize(): Promise<void> {
    this.messageBus = new MockMessageBus();
  }

  /**
   * Setup global mocks
   */
  async setupGlobalMocks(): Promise<void> {
    // Mock fetch for external calls
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      console.warn(`Unmocked fetch call to: ${url}`);
      return new Response('{}', { status: 200 });
    });
  }

  /**
   * Register a mock agent
   */
  registerAgent(name: string, responses?: Record<string, unknown>): MockAgent {
    const agent = new MockAgent(name, responses);
    this.agents.set(name, agent);
    return agent;
  }

  /**
   * Get mock agent
   */
  getAgent(name: string): MockAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * Get or create mock agent
   */
  getOrCreateAgent(name: string): MockAgent {
    if (!this.agents.has(name)) {
      return this.registerAgent(name);
    }
    return this.agents.get(name)!;
  }

  /**
   * Get message bus mock
   */
  getMessageBus(): MockMessageBus {
    if (!this.messageBus) {
      this.messageBus = new MockMessageBus();
    }
    return this.messageBus;
  }

  /**
   * Register MCP server mock
   */
  registerMCPServer(name: string, handlers?: Record<string, unknown>): MockMCPServer {
    const server = new MockMCPServer(name, handlers);
    this.mcpServers.set(name, server);
    return server;
  }

  /**
   * Get MCP server mock
   */
  getMCPServer(name: string): MockMCPServer | undefined {
    return this.mcpServers.get(name);
  }

  /**
   * Create spy function
   */
  createSpy(name: string): ReturnType<typeof vi.fn> {
    const spy = vi.fn();
    this.spies.set(name, spy);
    return spy;
  }

  /**
   * Get spy by name
   */
  getSpy(name: string): ReturnType<typeof vi.fn> | undefined {
    return this.spies.get(name);
  }

  /**
   * Reset all mocks
   */
  resetAll(): void {
    this.agents.forEach(agent => agent.reset());
    this.messageBus?.reset();
    this.mcpServers.forEach(server => server.reset());
    this.spies.forEach(spy => spy.mockClear());
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    this.agents.clear();
    this.mcpServers.clear();
    this.spies.clear();
    this.messageBus = null;
  }

  /**
   * Get call history for agent
   */
  getAgentCalls(name: string): unknown[] {
    return this.agents.get(name)?.getCalls() || [];
  }

  /**
   * Verify agent was called
   */
  verifyAgentCalled(name: string, times?: number): boolean {
    const agent = this.agents.get(name);
    if (!agent) return false;
    
    const calls = agent.getCalls();
    if (times !== undefined) {
      return calls.length === times;
    }
    return calls.length > 0;
  }
}
```

### 1.6 Mock Agent (`src/mocks/MockAgent.ts`)

```typescript
import { vi } from 'vitest';

export interface AgentResponse {
  success: boolean;
  artifacts?: unknown[];
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Mock agent for testing
 */
export class MockAgent {
  readonly name: string;
  private responses: Map<string, AgentResponse> = new Map();
  private defaultResponse: AgentResponse;
  private calls: Array<{ input: unknown; timestamp: Date }> = [];
  private executeFn: ReturnType<typeof vi.fn>;
  private delay = 0;
  private shouldFail = false;
  private failureError = 'Mock agent failure';

  constructor(name: string, responses?: Record<string, AgentResponse>) {
    this.name = name;
    this.defaultResponse = {
      success: true,
      artifacts: [],
      metadata: { mockAgent: true },
    };

    if (responses) {
      Object.entries(responses).forEach(([key, value]) => {
        this.responses.set(key, value);
      });
    }

    this.executeFn = vi.fn(async (input: unknown) => this.handleExecute(input));
  }

  /**
   * Set response for specific input pattern
   */
  setResponse(pattern: string, response: AgentResponse): this {
    this.responses.set(pattern, response);
    return this;
  }

  /**
   * Set default response
   */
  setDefaultResponse(response: AgentResponse): this {
    this.defaultResponse = response;
    return this;
  }

  /**
   * Set execution delay (for testing timeouts)
   */
  setDelay(ms: number): this {
    this.delay = ms;
    return this;
  }

  /**
   * Configure to fail
   */
  setFailure(error: string): this {
    this.shouldFail = true;
    this.failureError = error;
    return this;
  }

  /**
   * Clear failure mode
   */
  clearFailure(): this {
    this.shouldFail = false;
    return this;
  }

  /**
   * Execute agent (mock)
   */
  async execute(input: unknown): Promise<AgentResponse> {
    return this.executeFn(input);
  }

  /**
   * Handle execution internally
   */
  private async handleExecute(input: unknown): Promise<AgentResponse> {
    this.calls.push({ input, timestamp: new Date() });

    // Simulate delay
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    // Return failure if configured
    if (this.shouldFail) {
      return {
        success: false,
        error: this.failureError,
      };
    }

    // Find matching response
    const inputStr = JSON.stringify(input);
    for (const [pattern, response] of this.responses) {
      if (inputStr.includes(pattern)) {
        return response;
      }
    }

    return this.defaultResponse;
  }

  /**
   * Get all calls
   */
  getCalls(): Array<{ input: unknown; timestamp: Date }> {
    return [...this.calls];
  }

  /**
   * Get call count
   */
  getCallCount(): number {
    return this.calls.length;
  }

  /**
   * Get last call input
   */
  getLastCall(): { input: unknown; timestamp: Date } | undefined {
    return this.calls[this.calls.length - 1];
  }

  /**
   * Verify called with specific input
   */
  wasCalledWith(expectedInput: unknown): boolean {
    const expectedStr = JSON.stringify(expectedInput);
    return this.calls.some(call => 
      JSON.stringify(call.input).includes(expectedStr)
    );
  }

  /**
   * Reset mock
   */
  reset(): void {
    this.calls = [];
    this.executeFn.mockClear();
    this.shouldFail = false;
    this.delay = 0;
  }

  /**
   * Get underlying vi.fn()
   */
  getMockFn(): ReturnType<typeof vi.fn> {
    return this.executeFn;
  }
}
```

### 1.7 Mock Message Bus (`src/mocks/MockMessageBus.ts`)

```typescript
import { vi } from 'vitest';
import { EventEmitter } from 'events';

export interface Message {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: unknown;
  timestamp: Date;
}

/**
 * Mock message bus for testing agent communication
 */
export class MockMessageBus extends EventEmitter {
  private messages: Message[] = [];
  private subscriptions: Map<string, Set<(msg: Message) => void>> = new Map();
  private publishFn: ReturnType<typeof vi.fn>;
  private subscribeFn: ReturnType<typeof vi.fn>;

  constructor() {
    super();
    this.publishFn = vi.fn((msg: Message) => this.handlePublish(msg));
    this.subscribeFn = vi.fn((topic: string, handler: (msg: Message) => void) => 
      this.handleSubscribe(topic, handler)
    );
  }

  /**
   * Publish message
   */
  async publish(message: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    return this.publishFn(fullMessage);
  }

  /**
   * Handle publish internally
   */
  private handlePublish(message: Message): void {
    this.messages.push(message);
    
    // Notify subscribers
    const handlers = this.subscriptions.get(message.type) || new Set();
    handlers.forEach(handler => handler(message));
    
    // Also emit event
    this.emit(message.type, message);
    this.emit('*', message); // Wildcard
  }

  /**
   * Subscribe to message type
   */
  subscribe(topic: string, handler: (msg: Message) => void): () => void {
    return this.subscribeFn(topic, handler);
  }

  /**
   * Handle subscribe internally
   */
  private handleSubscribe(topic: string, handler: (msg: Message) => void): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    
    this.subscriptions.get(topic)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.get(topic)?.delete(handler);
    };
  }

  /**
   * Get all messages
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get messages by type
   */
  getMessagesByType(type: string): Message[] {
    return this.messages.filter(m => m.type === type);
  }

  /**
   * Get messages by source
   */
  getMessagesBySource(source: string): Message[] {
    return this.messages.filter(m => m.source === source);
  }

  /**
   * Wait for message
   */
  async waitForMessage(type: string, timeout = 5000): Promise<Message> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for message: ${type}`));
      }, timeout);

      const handler = (msg: Message) => {
        clearTimeout(timer);
        resolve(msg);
      };

      this.once(type, handler);
    });
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Reset mock
   */
  reset(): void {
    this.messages = [];
    this.subscriptions.clear();
    this.removeAllListeners();
    this.publishFn.mockClear();
    this.subscribeFn.mockClear();
  }

  /**
   * Simulate message from agent
   */
  simulateAgentMessage(source: string, type: string, payload: unknown): void {
    this.handlePublish({
      id: `sim-${Date.now()}`,
      type,
      source,
      payload,
      timestamp: new Date(),
    });
  }
}
```

### 1.8 Fixture Manager (`src/fixtures/FixtureManager.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Fixture<T = unknown> {
  name: string;
  data: T;
  metadata?: {
    description?: string;
    tags?: string[];
    version?: string;
  };
}

/**
 * Manage test fixtures
 */
export class FixtureManager {
  private fixtureDir: string;
  private cache: Map<string, Fixture> = new Map();
  private loaded = false;

  constructor(fixtureDir: string) {
    this.fixtureDir = fixtureDir;
  }

  /**
   * Load all fixtures
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      await this.loadDirectory(this.fixtureDir);
      this.loaded = true;
    } catch (error) {
      console.warn(`Failed to load fixtures from ${this.fixtureDir}:`, error);
    }
  }

  /**
   * Load fixtures from directory recursively
   */
  private async loadDirectory(dir: string, prefix = ''): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await this.loadDirectory(fullPath, name);
      } else if (entry.name.endsWith('.json')) {
        const fixtureName = name.replace('.json', '');
        const content = await fs.readFile(fullPath, 'utf-8');
        const data = JSON.parse(content);
        
        this.cache.set(fixtureName, {
          name: fixtureName,
          data: data.data || data,
          metadata: data.metadata,
        });
      }
    }
  }

  /**
   * Get fixture by name
   */
  async get<T>(name: string): Promise<T> {
    await this.load();
    
    const fixture = this.cache.get(name);
    if (!fixture) {
      throw new Error(`Fixture not found: ${name}`);
    }
    
    // Return deep clone
    return JSON.parse(JSON.stringify(fixture.data)) as T;
  }

  /**
   * Get fixture with metadata
   */
  async getWithMetadata<T>(name: string): Promise<Fixture<T>> {
    await this.load();
    
    const fixture = this.cache.get(name);
    if (!fixture) {
      throw new Error(`Fixture not found: ${name}`);
    }
    
    return JSON.parse(JSON.stringify(fixture)) as Fixture<T>;
  }

  /**
   * Check if fixture exists
   */
  async has(name: string): Promise<boolean> {
    await this.load();
    return this.cache.has(name);
  }

  /**
   * List all fixture names
   */
  async list(filter?: { tags?: string[]; prefix?: string }): Promise<string[]> {
    await this.load();
    
    let names = Array.from(this.cache.keys());
    
    if (filter?.prefix) {
      names = names.filter(n => n.startsWith(filter.prefix!));
    }
    
    if (filter?.tags?.length) {
      names = names.filter(n => {
        const fixture = this.cache.get(n);
        return filter.tags!.some(tag => 
          fixture?.metadata?.tags?.includes(tag)
        );
      });
    }
    
    return names;
  }

  /**
   * Create fixture programmatically
   */
  async create<T>(name: string, data: T, metadata?: Fixture['metadata']): Promise<void> {
    const fixture: Fixture<T> = { name, data, metadata };
    this.cache.set(name, fixture);
    
    // Optionally save to disk
    const filePath = path.join(this.fixtureDir, `${name}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(fixture, null, 2));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.loaded = false;
  }
}

// Singleton instance
let fixtureManager: FixtureManager | null = null;

export function getFixtureManager(fixtureDir?: string): FixtureManager {
  if (!fixtureManager) {
    fixtureManager = new FixtureManager(fixtureDir || './tests/fixtures');
  }
  return fixtureManager;
}
```

### 1.9 Test Utilities (`src/utils/TestUtils.ts`)

```typescript
import { vi } from 'vitest';

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await sleep(interval);
  }

  throw new Error('waitFor timeout');
}

/**
 * Sleep for specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create async test helper
 */
export function createAsyncTest(
  fn: () => Promise<void>,
  timeout = 30000
): () => Promise<void> {
  return async () => {
    const timer = setTimeout(() => {
      throw new Error('Test timeout');
    }, timeout);

    try {
      await fn();
    } finally {
      clearTimeout(timer);
    }
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number; backoff?: number } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2 } = options;
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await sleep(delay * Math.pow(backoff, i));
      }
    }
  }

  throw lastError;
}

/**
 * Generate unique test ID
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create test context
 */
export function createTestContext<T extends Record<string, unknown>>(
  initial: T
): TestContext<T> {
  const context = { ...initial };
  const cleanupFns: Array<() => Promise<void>> = [];

  return {
    get: <K extends keyof T>(key: K): T[K] => context[key],
    set: <K extends keyof T>(key: K, value: T[K]): void => {
      context[key] = value;
    },
    addCleanup: (fn: () => Promise<void>): void => {
      cleanupFns.push(fn);
    },
    cleanup: async (): Promise<void> => {
      for (const fn of cleanupFns.reverse()) {
        await fn();
      }
      cleanupFns.length = 0;
    },
  };
}

export interface TestContext<T> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  addCleanup(fn: () => Promise<void>): void;
  cleanup(): Promise<void>;
}

/**
 * Mock console temporarily
 */
export function mockConsole(): { restore: () => void; logs: string[] } {
  const logs: string[] = [];
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  console.log = vi.fn((...args) => logs.push(`LOG: ${args.join(' ')}`));
  console.info = vi.fn((...args) => logs.push(`INFO: ${args.join(' ')}`));
  console.warn = vi.fn((...args) => logs.push(`WARN: ${args.join(' ')}`));
  console.error = vi.fn((...args) => logs.push(`ERROR: ${args.join(' ')}`));

  return {
    logs,
    restore: () => {
      console.log = original.log;
      console.info = original.info;
      console.warn = original.warn;
      console.error = original.error;
    },
  };
}

/**
 * Deep freeze object for immutability testing
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.keys(obj).forEach(key => {
    const value = (obj as Record<string, unknown>)[key];
    if (value && typeof value === 'object') {
      deepFreeze(value as object);
    }
  });
  return Object.freeze(obj);
}
```

---

## 🧪 Testing Strategy

```typescript
// tests/unit/MockRegistry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../../src/mocks/MockRegistry';

describe('MockRegistry', () => {
  let registry: MockRegistry;

  beforeEach(async () => {
    registry = MockRegistry.getInstance();
    await registry.initialize();
  });

  it('should register and retrieve mock agents', () => {
    const agent = registry.registerAgent('plan');
    expect(agent.name).toBe('plan');
    expect(registry.getAgent('plan')).toBe(agent);
  });

  it('should track agent calls', async () => {
    const agent = registry.registerAgent('doc');
    
    await agent.execute({ type: 'generate' });
    await agent.execute({ type: 'validate' });
    
    expect(agent.getCallCount()).toBe(2);
    expect(registry.verifyAgentCalled('doc', 2)).toBe(true);
  });

  it('should reset all mocks', async () => {
    const agent = registry.registerAgent('test');
    await agent.execute({});
    
    registry.resetAll();
    
    expect(agent.getCallCount()).toBe(0);
  });
});
```

---

## 📋 Acceptance Criteria

- [ ] Vitest configured with coverage thresholds
- [ ] MockRegistry manages all mock instances
- [ ] MockAgent simulates agent behavior
- [ ] MockMessageBus tracks message flow
- [ ] FixtureManager loads and caches fixtures
- [ ] Test utilities provide common helpers
- [ ] Global setup initializes test environment
- [ ] All tests pass with >90% coverage

---

## 🔗 MCP Integration Points

| MCP Server | Gebruik |
|------------|---------|
| **Playwright MCP** | E2E browser testing (Phase 4) |
| **Memory MCP** | Store test results temporarily |

---

## 🔗 Navigation

← [00-OVERVIEW.md](00-OVERVIEW.md) | [02-PHASE-AGENT-TESTS.md](02-PHASE-AGENT-TESTS.md) →
