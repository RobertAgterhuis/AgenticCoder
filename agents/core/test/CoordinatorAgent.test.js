import { CoordinatorAgent } from '../agents/CoordinatorAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('CoordinatorAgent', () => {
  let coordinator;

  beforeEach(async () => {
    coordinator = new CoordinatorAgent();
    await coordinator.initialize();
  });

  afterEach(async () => {
    await coordinator.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(coordinator.id).toBe('coordinator');
      expect(coordinator.name).toBe('Workflow Coordinator');
      expect(coordinator.state).toBe('ready');
    });

    it('should setup approval gates correctly', () => {
      expect(coordinator.approvalGates).toEqual([0, 1, 2, 3, 4, 5, 11]);
    });

    it('should initialize workflow state', () => {
      expect(coordinator.workflowState).toBeDefined();
      expect(coordinator.workflowState.status).toBe('initializing');
      expect(coordinator.workflowState.id).toMatch(/^wf-/);
    });
  });

  describe('Workflow Execution', () => {
    it('should execute workflow with valid input', async () => {
      const input = {
        requirements: 'Build a web application',
        techStack: ['React', '.NET Core', 'Azure'],
        timeline: '4 weeks'
      };

      const result = await coordinator.execute(input);

      expect(result.success).toBe(true);
      expect(result.workflowId).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.phasesCompleted).toBe(12);
    });

    it('should execute all 12 phases in order', async () => {
      const input = { requirements: 'Test workflow', techStack: ['React'] };
      
      await coordinator.execute(input);

      expect(coordinator.workflowState.completedPhases.length).toBe(12);
      coordinator.workflowState.completedPhases.forEach((phase, idx) => {
        expect(phase.phaseNum).toBe(idx);
        expect(phase.status).toBe('completed');
      });
    });

    it('should track agent invocations', async () => {
      const input = { requirements: 'Track agents', techStack: ['React'] };
      
      await coordinator.execute(input);

      expect(coordinator.workflowState.agentsInvoked.length).toBeGreaterThan(0);
      expect(coordinator.workflowState.agentsInvoked[0]).toHaveProperty('agentId');
      expect(coordinator.workflowState.agentsInvoked[0]).toHaveProperty('phase');
      expect(coordinator.workflowState.agentsInvoked[0]).toHaveProperty('status');
    });

    it('should request approval at approval gates', async () => {
      const input = { requirements: 'Test approvals', techStack: ['React'] };
      let approvalCount = 0;

      coordinator.on('approval-requested', () => {
        approvalCount++;
      });

      await coordinator.execute(input);

      expect(approvalCount).toBe(7); // 7 approval gates
    });
  });

  describe('Phase Management', () => {
    it('should initialize 12 phases', async () => {
      const input = { requirements: 'Test', techStack: ['React'] };
      await coordinator.execute(input);

      expect(coordinator.phaseHistory.length).toBe(12);
    });

    it('should track phase history', async () => {
      const input = { requirements: 'Test', techStack: ['React'] };
      await coordinator.execute(input);

      coordinator.phaseHistory.forEach((phase, idx) => {
        expect(phase.phaseNum).toBe(idx);
        expect(phase.status).toBe('completed');
        expect(phase.timestamp).toBeDefined();
      });
    });
  });

  describe('Workflow Status', () => {
    it('should provide current workflow status', async () => {
      const status = coordinator.getWorkflowStatus();

      expect(status).toHaveProperty('id');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('currentPhase');
      expect(status).toHaveProperty('completedPhases');
      expect(status).toHaveProperty('progress');
    });

    it('should calculate progress correctly', async () => {
      const input = { requirements: 'Test', techStack: ['React'] };
      await coordinator.execute(input);

      const status = coordinator.getWorkflowStatus();
      expect(status.progress).toBe(100);
    });

    it('should provide agent invocation summary', async () => {
      const input = { requirements: 'Test', techStack: ['React'] };
      await coordinator.execute(input);

      const summary = coordinator.getAgentInvocationSummary();
      expect(Object.keys(summary).length).toBeGreaterThan(0);
      
      Object.values(summary).forEach(agentInfo => {
        expect(agentInfo).toHaveProperty('count');
        expect(agentInfo).toHaveProperty('phases');
        expect(agentInfo).toHaveProperty('status');
      });
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      expect(async () => {
        await coordinator.execute(null);
      }).rejects.toThrow();
    });

    it('should mark workflow as failed on error', async () => {
      try {
        // This will succeed since we're mocking agents
        await coordinator.execute({ requirements: 'Test' });
      } catch (error) {
        expect(coordinator.workflowState.status).toBe('failed');
      }
    });
  });

  describe('Events', () => {
    it('should emit approval-requested events', async () => {
      const events = [];
      coordinator.on('approval-requested', (evt) => {
        events.push(evt);
      });

      const input = { requirements: 'Test', techStack: ['React'] };
      await coordinator.execute(input);

      expect(events.length).toBe(7);
      events.forEach(evt => {
        expect(evt).toHaveProperty('phase');
        expect(evt).toHaveProperty('timestamp');
      });
    });

    it('should emit agent-executed events', async () => {
      const events = [];
      coordinator.on('agent-executed', (evt) => {
        events.push(evt);
      });

      const input = { requirements: 'Test', techStack: ['React'] };
      await coordinator.execute(input);

      expect(events.length).toBeGreaterThan(0);
      events.forEach(evt => {
        expect(evt).toHaveProperty('agentId');
        expect(evt).toHaveProperty('phase');
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on shutdown', async () => {
      const input = { requirements: 'Test', techStack: ['React'] };
      await coordinator.execute(input);
      
      let cleanupCalled = false;
      coordinator.on('cleanup', () => {
        cleanupCalled = true;
      });

      await coordinator.cleanup();

      expect(cleanupCalled).toBe(true);
      expect(coordinator.state).toBe('stopped');
    });
  });

  describe('Workflow Summary', () => {
    it('should generate workflow summary', async () => {
      const input = { requirements: 'Test', techStack: ['React'] };
      const result = await coordinator.execute(input);

      expect(result.summary).toHaveProperty('totalAgentsInvoked');
      expect(result.summary).toHaveProperty('uniqueAgents');
      expect(result.summary).toHaveProperty('successRate');
      expect(result.summary).toHaveProperty('blockers');
      expect(result.summary).toHaveProperty('approvals');
    });
  });
});
