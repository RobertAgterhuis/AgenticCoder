/**
 * Tests for ExecutionBridge components (EB-01 through EB-06)
 */

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

import {
  TransportSelector,
  TRANSPORT_TYPES,
  ExecutionContext,
  ExecutionContextBuilder,
  AgentInvoker,
  OutputCollector,
  LifecycleManager,
  LIFECYCLE_PHASES,
  LIFECYCLE_STATUS,
  ResultHandler,
  NEXT_ACTIONS
} from '../execution/index.js';

// Test helpers
const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'eb-test-'));
const cleanup = (dir) => {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

// =============================================================================
// TransportSelector Tests (EB-01)
// =============================================================================
describe('TransportSelector (EB-01)', () => {
  let selector;

  beforeEach(() => {
    selector = new TransportSelector();
  });

  it('should return supported transport types', () => {
    const types = selector.getSupportedTransports();
    assert.ok(types.includes('webhook'));
    assert.ok(types.includes('process'));
    assert.ok(types.includes('docker'));
    assert.ok(types.includes('api'));
    assert.ok(types.includes('mcp-stdio'));
  });

  it('should select webhook transport for endpoint config', async () => {
    const result = await selector.selectTransport('test-agent', {
      endpoint: 'http://localhost:3000/invoke'
    });

    assert.strictEqual(result.type, 'webhook');
    assert.strictEqual(result.config.endpoint, 'http://localhost:3000/invoke');
    assert.strictEqual(result.agent, 'test-agent');
  });

  it('should select process transport for command config', async () => {
    const result = await selector.selectTransport('test-agent', {
      command: 'node',
      args: ['agent.js']
    });

    assert.strictEqual(result.type, 'process');
    assert.strictEqual(result.config.command, 'node');
  });

  it('should select docker transport for image config', async () => {
    const result = await selector.selectTransport('test-agent', {
      image: 'agent-image:latest'
    });

    assert.strictEqual(result.type, 'docker');
    assert.strictEqual(result.config.image, 'agent-image:latest');
  });

  it('should throw on invalid webhook endpoint', async () => {
    await assert.rejects(
      selector.selectTransport('test-agent', {
        transport: 'webhook',
        endpoint: 'not-a-valid-url'
      }),
      /endpoint must be a valid URL/
    );
  });

  it('should register and use agent-specific config', async () => {
    selector.registerAgent('my-agent', {
      transport: 'process',
      command: 'python',
      args: ['my_agent.py']
    });

    const result = await selector.selectTransport('my-agent', {});
    assert.strictEqual(result.type, 'process');
    assert.strictEqual(result.config.command, 'python');
  });

  it('should apply default timeout values', async () => {
    const result = await selector.selectTransport('test-agent', {
      endpoint: 'http://localhost:3000'
    });

    assert.ok(result.config.timeout_ms > 0);
  });
});

// =============================================================================
// ExecutionContext Tests (EB-02)
// =============================================================================
describe('ExecutionContext (EB-02)', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tempDir);
  });

  it('should generate unique execution ID', () => {
    const ctx1 = new ExecutionContext({ agent: 'test' });
    const ctx2 = new ExecutionContext({ agent: 'test' });

    assert.ok(ctx1.execution_id.startsWith('exec-'));
    assert.notStrictEqual(ctx1.execution_id, ctx2.execution_id);
  });

  it('should set agent and phase correctly', () => {
    const ctx = new ExecutionContext({
      agent: 'code-generator',
      phase: 3
    });

    assert.strictEqual(ctx.agent, 'code-generator');
    assert.strictEqual(ctx.phase, 3);
  });

  it('should build environment with execution context variables', () => {
    const ctx = new ExecutionContext({
      agent: 'test-agent',
      phase: 2
    });

    const env = ctx.getEnvironment();
    assert.strictEqual(env.AGENT_NAME, 'test-agent');
    assert.strictEqual(env.PHASE, '2');
    assert.ok(env.EXECUTION_ID);
  });

  it('should set default resource limits', () => {
    const ctx = new ExecutionContext({});

    assert.ok(ctx.limits.timeout_ms > 0);
    assert.ok(ctx.limits.memory_mb > 0);
  });

  it('should allow custom resource limits', () => {
    const ctx = new ExecutionContext({
      limits: {
        timeout_ms: 120000,
        memory_mb: 1024
      }
    });

    assert.strictEqual(ctx.limits.timeout_ms, 120000);
    assert.strictEqual(ctx.limits.memory_mb, 1024);
  });

  it('should create directories via ensureDirectories', async () => {
    const ctx = new ExecutionContext({
      agent: 'test',
      project_root: tempDir
    });

    await ctx.ensureDirectories();

    assert.ok(fs.existsSync(ctx.paths.artifact_dir));
    assert.ok(fs.existsSync(ctx.paths.log_dir));
    assert.ok(fs.existsSync(ctx.paths.temp_dir));
  });

  it('should package inputs correctly', () => {
    const ctx = new ExecutionContext({
      agent: 'test',
      phase: 1,
      inputs: { prompt: 'Hello' }
    });

    const packaged = ctx.packageInputs();

    assert.strictEqual(packaged.agent, 'test');
    assert.strictEqual(packaged.phase, 1);
    assert.deepStrictEqual(packaged.inputs, { prompt: 'Hello' });
    assert.ok(packaged.execution_id);
  });

  it('should serialize and deserialize via JSON', () => {
    const ctx = new ExecutionContext({
      agent: 'test',
      phase: 2,
      inputs: { data: 'value' }
    });

    const json = ctx.toJSON();
    const restored = ExecutionContext.fromJSON(json);

    assert.strictEqual(restored.execution_id, ctx.execution_id);
    assert.strictEqual(restored.agent, ctx.agent);
    assert.strictEqual(restored.phase, ctx.phase);
  });

  it('should use builder pattern', () => {
    const ctx = new ExecutionContextBuilder()
      .forAgent('builder-agent')
      .forPhase(5)
      .withInputs({ key: 'value' })
      .withTimeout(60000)
      .build();

    assert.strictEqual(ctx.agent, 'builder-agent');
    assert.strictEqual(ctx.phase, 5);
    assert.strictEqual(ctx.limits.timeout_ms, 60000);
  });
});

// =============================================================================
// OutputCollector Tests (EB-04)
// =============================================================================
describe('OutputCollector (EB-04)', () => {
  let collector;
  let tempDir;

  beforeEach(() => {
    collector = new OutputCollector();
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tempDir);
  });

  it('should extract artifact from invocation result', async () => {
    const ctx = new ExecutionContext({
      agent: 'test',
      project_root: tempDir
    });
    await ctx.ensureDirectories();

    const invocationResult = {
      ok: true,
      status: 200,
      stdout: JSON.stringify({ result: 'success', data: { key: 'value' } }),
      stderr: '',
      duration_ms: 100
    };

    const collected = await collector.collect(invocationResult, ctx);

    assert.ok(collected.artifact);
    assert.strictEqual(collected.artifact.result, 'success');
  });

  it('should extract artifact from explicit artifact field', async () => {
    const ctx = new ExecutionContext({
      agent: 'test',
      project_root: tempDir
    });
    await ctx.ensureDirectories();

    const invocationResult = {
      ok: true,
      status: 200,
      stdout: 'Some logs...',
      stderr: '',
      artifact: { type: 'code', content: 'console.log("hello")' },
      duration_ms: 50
    };

    const collected = await collector.collect(invocationResult, ctx);

    assert.ok(collected.artifact);
    assert.strictEqual(collected.artifact.type, 'code');
  });

  it('should save artifact to file', async () => {
    const ctx = new ExecutionContext({
      agent: 'test',
      project_root: tempDir
    });
    await ctx.ensureDirectories();

    const invocationResult = {
      ok: true,
      stdout: JSON.stringify({ saved: true }),
      stderr: '',
      duration_ms: 10
    };

    const collected = await collector.collect(invocationResult, ctx);

    assert.ok(collected.artifact_path);
    assert.ok(fs.existsSync(collected.artifact_path));
    assert.ok(collected.artifact_size_bytes > 0);
  });

  it('should extract logs from structured output', async () => {
    const ctx = new ExecutionContext({
      agent: 'test',
      project_root: tempDir
    });
    await ctx.ensureDirectories();

    const invocationResult = {
      ok: true,
      stdout: '[INFO] Starting process\n[ERROR] Something failed',
      stderr: '',
      duration_ms: 100
    };

    const collected = await collector.collect(invocationResult, ctx);

    const infoLogs = collected.logs.filter(l => l.level === 'info');
    const errorLogs = collected.logs.filter(l => l.level === 'error');

    assert.ok(infoLogs.length > 0);
    assert.ok(errorLogs.length > 0);
  });

  it('should include metrics in collected output', async () => {
    const ctx = new ExecutionContext({
      agent: 'test',
      project_root: tempDir
    });
    await ctx.ensureDirectories();

    const invocationResult = {
      ok: true,
      status: 200,
      stdout: '{}',
      stderr: '',
      exit_code: 0,
      duration_ms: 250
    };

    const collected = await collector.collect(invocationResult, ctx);

    assert.strictEqual(collected.metrics.duration_ms, 250);
    assert.strictEqual(collected.metrics.exit_code, 0);
    assert.strictEqual(collected.metrics.status, 200);
  });

  it('should truncate very large output', async () => {
    const smallCollector = new OutputCollector({ maxOutputSize: 100 });
    const ctx = new ExecutionContext({
      agent: 'test',
      project_root: tempDir
    });
    await ctx.ensureDirectories();

    const largeOutput = 'x'.repeat(500);
    const invocationResult = {
      ok: true,
      stdout: largeOutput,
      stderr: '',
      duration_ms: 10
    };

    const collected = await smallCollector.collect(invocationResult, ctx);

    assert.ok(collected.stdout.includes('TRUNCATED'));
    assert.ok(collected.stdout.length < largeOutput.length);
  });
});

// =============================================================================
// ResultHandler Tests (EB-06)
// =============================================================================
describe('ResultHandler (EB-06)', () => {
  let handler;

  beforeEach(() => {
    handler = new ResultHandler();
  });

  it('should handle successful execution', async () => {
    const result = {
      execution_id: 'exec-123',
      agent: 'test-agent',
      phase: 1,
      status: 'success',
      artifact: { data: 'value' },
      artifact_path: '/tmp/artifact.json'
    };

    const handling = await handler.handle(result, {});

    assert.strictEqual(handling.status, 'success');
    assert.strictEqual(handling.next_action, NEXT_ACTIONS.PROCEED);
    assert.ok(handling.artifact_id);
  });

  it('should schedule retry on failure', async () => {
    const result = {
      execution_id: 'exec-123',
      agent: 'test-agent',
      phase: 1,
      status: 'failure',
      error: 'Something went wrong'
    };

    const handling = await handler.handle(result, { attempt_count: 0 });

    assert.strictEqual(handling.status, 'failure');
    assert.strictEqual(handling.next_action, NEXT_ACTIONS.RETRY);
    assert.ok(handling.retry_info);
    assert.strictEqual(handling.retry_info.attempt, 1);
  });

  it('should block after max retries', async () => {
    const result = {
      execution_id: 'exec-123',
      agent: 'test-agent',
      phase: 1,
      status: 'failure',
      error: 'Persistent error'
    };

    const handling = await handler.handle(result, { attempt_count: 3 });

    assert.strictEqual(handling.next_action, NEXT_ACTIONS.BLOCK);
  });

  it('should handle timeout status', async () => {
    const result = {
      execution_id: 'exec-123',
      agent: 'test-agent',
      phase: 1,
      status: 'timeout',
      error: 'Execution timed out'
    };

    const handling = await handler.handle(result, { attempt_count: 0 });

    assert.strictEqual(handling.next_action, NEXT_ACTIONS.RETRY);
  });

  it('should register and retrieve artifacts', async () => {
    const result = {
      execution_id: 'exec-123',
      agent: 'test-agent',
      phase: 1,
      status: 'success',
      artifact: { code: 'console.log("hi")' },
      artifact_path: '/tmp/artifact.json'
    };

    const handling = await handler.handle(result, {});
    const artifact = handler.getArtifact(handling.artifact_id);

    assert.ok(artifact);
    assert.strictEqual(artifact.agent, 'test-agent');
    assert.strictEqual(artifact.phase, 1);
  });

  it('should find artifacts by filter', async () => {
    // Register multiple artifacts
    await handler.handle({
      execution_id: 'exec-1',
      agent: 'agent-a',
      phase: 1,
      status: 'success',
      artifact: { a: 1 },
      artifact_path: '/tmp/a.json'
    }, {});

    await handler.handle({
      execution_id: 'exec-2',
      agent: 'agent-b',
      phase: 1,
      status: 'success',
      artifact: { b: 2 },
      artifact_path: '/tmp/b.json'
    }, {});

    const agentAResults = handler.findArtifacts({ agent: 'agent-a' });
    assert.strictEqual(agentAResults.length, 1);
    assert.strictEqual(agentAResults[0].agent, 'agent-a');
  });

  it('should reject invalid execution result', async () => {
    const result = {
      // Missing required fields
      agent: 'test'
    };

    const handling = await handler.handle(result, {});

    assert.strictEqual(handling.status, 'failure');
    assert.strictEqual(handling.next_action, NEXT_ACTIONS.RETRY);
  });
});

// =============================================================================
// Integration Test
// =============================================================================
describe('ExecutionBridge Integration', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tempDir);
  });

  it('should work end-to-end with process transport', async () => {
    // Skip on CI or if node isn't available
    const selector = new TransportSelector();
    const invoker = new AgentInvoker();
    const collector = new OutputCollector();

    // Setup
    const transport = await selector.selectTransport('echo-agent', {
      command: process.platform === 'win32' ? 'cmd' : 'echo',
      args: process.platform === 'win32' ? ['/c', 'echo', '{"result":"ok"}'] : ['{"result":"ok"}'],
      shell: true
    });

    const context = new ExecutionContextBuilder()
      .forAgent('echo-agent')
      .forPhase(1)
      .withInputs({ test: true })
      .withProjectRoot(tempDir)
      .withTimeout(5000)
      .build();

    await context.ensureDirectories();

    // Execute
    const invocationResult = await invoker.invoke(transport, context);

    // Collect
    const collected = await collector.collect(invocationResult, context);

    // Verify
    assert.ok(invocationResult.ok || invocationResult.stdout.includes('result'));
    assert.ok(collected.execution_id);
  });
});
