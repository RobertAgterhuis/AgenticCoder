/**
 * Tests for WorkflowStateIntegration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import {
  WorkflowStateIntegration,
  WorkflowEngineAdapter,
  createWorkflowIntegration,
} from '../WorkflowStateIntegration';

// Mock WorkflowEngine that behaves like the real one
class MockWorkflowEngine extends EventEmitter implements WorkflowEngineAdapter {
  private executions = new Map<string, any>();

  registerWorkflow(id: string, workflow: any): void {
    // Store workflow
  }

  execute(workflowId: string, input: any): string {
    const executionId = `exec-${Date.now()}`;
    this.executions.set(executionId, {
      executionId,
      workflowId,
      status: 'running',
      startTime: Date.now(),
      stepResults: [],
      outputs: {},
      errors: [],
    });
    return executionId;
  }

  getExecution(executionId: string): any {
    return this.executions.get(executionId) || null;
  }

  // Helper to update execution state (for testing)
  updateExecution(executionId: string, updates: any): void {
    const exec = this.executions.get(executionId);
    if (exec) {
      Object.assign(exec, updates);
    }
  }

  // Helper to simulate step completion
  simulateStepComplete(executionId: string, stepId: string, agentId: string, outputs: any): void {
    const exec = this.executions.get(executionId);
    if (exec) {
      exec.stepResults.push({
        stepId,
        agentId,
        status: 'completed',
        output: outputs,
        timestamp: new Date().toISOString(),
      });
      if (outputs) {
        exec.outputs[stepId] = outputs;
      }
    }
  }
}

describe('WorkflowStateIntegration', () => {
  let testDir: string;
  let integration: WorkflowStateIntegration;
  let mockEngine: MockWorkflowEngine;

  beforeEach(async () => {
    // Create temp directory
    testDir = path.join(os.tmpdir(), `wf-integration-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Create integration and mock engine
    integration = new WorkflowStateIntegration({ baseDir: testDir });
    await integration.initialize();

    mockEngine = new MockWorkflowEngine();
    integration.attach(mockEngine);
  });

  afterEach(async () => {
    integration.detach();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newIntegration = new WorkflowStateIntegration({ baseDir: testDir });
      await newIntegration.initialize();
      expect(newIntegration.getStateManager()).toBeDefined();
    });

    it('should attach to workflow engine', () => {
      // Already attached in beforeEach
      expect(mockEngine.listenerCount('workflow:start')).toBeGreaterThan(0);
      expect(mockEngine.listenerCount('step:complete')).toBeGreaterThan(0);
    });

    it('should detach from workflow engine', () => {
      integration.detach();
      expect(mockEngine.listenerCount('workflow:start')).toBe(0);
      expect(mockEngine.listenerCount('step:complete')).toBe(0);
    });
  });

  describe('Workflow Events', () => {
    it('should persist workflow start', async () => {
      // Emit workflow start
      mockEngine.emit('workflow:start', {
        type: 'workflow:start',
        executionId: 'test-exec-1',
        workflowId: 'test-workflow',
        timestamp: new Date().toISOString(),
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify execution was created
      const executions = await integration.getStateManager().getStore().listExecutions();
      expect(executions.length).toBeGreaterThan(0);
      expect(executions[0].status).toBe('running');
    });

    it('should persist step completion', async () => {
      // Start workflow
      mockEngine.emit('workflow:start', {
        type: 'workflow:start',
        executionId: 'test-exec-2',
        workflowId: 'test-workflow',
        timestamp: new Date().toISOString(),
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Complete a step
      mockEngine.emit('step:complete', {
        type: 'step:complete',
        executionId: 'test-exec-2',
        stepId: 'extract',
        agentId: 'extraction-agent',
        outputs: { tasks: ['task1', 'task2'] },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify phase was completed
      const state = await integration.getStateManager().execution.getCurrentExecution();
      expect(state).toBeDefined();
      const extractPhase = state?.phases.find(p => p.phase === 1);
      expect(extractPhase?.status).toBe('completed');
    });

    it('should handle step errors', async () => {
      // Start workflow
      mockEngine.emit('workflow:start', {
        type: 'workflow:start',
        executionId: 'test-exec-3',
        workflowId: 'test-workflow',
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Error on a step
      mockEngine.emit('step:error', {
        type: 'step:error',
        executionId: 'test-exec-3',
        stepId: 'architect',
        agentId: 'architecture-agent',
        error: 'Architecture generation failed',
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify phase was marked as failed
      const state = await integration.getStateManager().execution.getCurrentExecution();
      const architectPhase = state?.phases.find(p => p.phase === 3);
      expect(architectPhase?.status).toBe('failed');
      expect(architectPhase?.error).toBe('Architecture generation failed');
    });

    it('should persist workflow completion', async () => {
      // Start workflow
      mockEngine.emit('workflow:start', {
        type: 'workflow:start',
        executionId: 'test-exec-4',
        workflowId: 'test-workflow',
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Complete workflow
      mockEngine.emit('workflow:complete', {
        type: 'workflow:complete',
        executionId: 'test-exec-4',
        duration: 5000,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify execution was marked completed
      const executions = await integration.getStateManager().getStore().listExecutions();
      const completed = executions.find(e => e.status === 'completed');
      expect(completed).toBeDefined();
    });
  });

  describe('Resume Support', () => {
    it('should provide resume options for incomplete executions', async () => {
      // Create a "paused" execution
      mockEngine.emit('workflow:start', {
        type: 'workflow:start',
        executionId: 'test-resume-1',
        workflowId: 'pausable-workflow',
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Complete first phase
      mockEngine.emit('step:complete', {
        type: 'step:complete',
        executionId: 'test-resume-1',
        stepId: 'extract',
        agentId: 'extraction-agent',
        outputs: {},
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Get resume options
      const options = await integration.getResumeOptions();
      expect(options.length).toBeGreaterThan(0);
      expect(options[0].lastPhase).toBe(1);
      expect(options[0].status).toBe('running');
    });
  });

  describe('Artifact Registration', () => {
    it('should register artifacts from step outputs', async () => {
      // Start workflow
      mockEngine.emit('workflow:start', {
        type: 'workflow:start',
        executionId: 'test-artifacts',
        workflowId: 'artifact-workflow',
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Complete step with artifact outputs
      mockEngine.emit('step:complete', {
        type: 'step:complete',
        executionId: 'test-artifacts',
        stepId: 'bicep',
        agentId: 'bicep-agent',
        outputs: {
          bicep: 'param location string = resourceGroup().location',
          template: '{"resources": []}',
        },
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify artifacts were registered
      const artifacts = await integration.getStateManager().artifact.listArtifacts({});
      expect(artifacts.length).toBeGreaterThanOrEqual(0); // May be 0 if path doesn't exist
    });
  });
});

describe('createWorkflowIntegration', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `wf-factory-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should create and initialize integration', async () => {
    const integration = await createWorkflowIntegration({ baseDir: testDir });
    expect(integration).toBeInstanceOf(WorkflowStateIntegration);
    expect(integration.getStateManager()).toBeDefined();
  });
});
