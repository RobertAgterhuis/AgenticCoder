import { BaseAgent } from '../BaseAgent.js';
import { AGENT_SPECIFICATIONS } from '../AgentSpecifications.js';

/**
 * Coordinator Agent - Orchestrates multi-agent workflows and manages phase transitions
 * 
 * Responsibilities:
 * - Manages workflow progression through 12 phases
 * - Coordinates agent execution in correct order
 * - Handles approval gates and phase transitions
 * - Escalates blockers and manages error recovery
 * - Maintains workflow state and audit trail
 */
export class CoordinatorAgent extends BaseAgent {
  constructor(options = {}) {
    // Get coordinator specification from registry
    const coordinatorSpec = AGENT_SPECIFICATIONS.find(s => s.id === 'coordinator');
    
    super(coordinatorSpec, {
      timeout: 60000, // 60s timeout for workflow coordination
      maxRetries: 2,
      ...options
    });

    this.workflowState = null;
    this.phaseHistory = [];
    this.agentRegistry = new Map();
    this.approvalGates = [0, 1, 2, 3, 4, 5, 11]; // Approval gates at specific phases
    this.currentPhase = -1;
  }

  /**
   * Initialize coordinator - register all agents and setup workflow
   */
  async _onInitialize() {
    console.log('[Coordinator] Initializing workflow coordinator...');
    
    // Initialize workflow state
    this.workflowState = {
      id: this._generateWorkflowId(),
      startedAt: new Date().toISOString(),
      status: 'initializing',
      currentPhase: 0,
      completedPhases: [],
      agentsInvoked: [],
      blockers: [],
      approvals: {}
    };

    console.log(`[Coordinator] Workflow initialized: ${this.workflowState.id}`);
  }

  /**
   * Core execution logic - orchestrate workflow through phases
   */
  async _onExecute(input, context, executionId) {
    console.log(`[Coordinator] Starting workflow execution: ${executionId}`);
    
    try {
      const workflowInput = this._validateWorkflowInput(input);
      
      // Initialize workflow phases (0-11)
      const phases = this._initializePhases(workflowInput);
      
      // Execute each phase in sequence
      for (let phaseNum = 0; phaseNum < phases.length; phaseNum++) {
        const phase = phases[phaseNum];
        console.log(`[Coordinator] Executing Phase ${phaseNum}: ${phase.name}`);

        // Check approval gate
        if (this.approvalGates.includes(phaseNum)) {
          const approved = await this._requestApproval(phaseNum, phase, context);
          if (!approved) {
            throw new Error(`Phase ${phaseNum} approval rejected: ${phase.name}`);
          }
        }

        // Execute phase
        const phaseResult = await this._executePhase(phaseNum, phase, workflowInput, context);
        
        // Record completion
        this.workflowState.completedPhases.push({
          phaseNum,
          name: phase.name,
          status: 'completed',
          result: phaseResult,
          executedAt: new Date().toISOString(),
          agents: phase.agents || []
        });

        this.currentPhase = phaseNum;
        this.phaseHistory.push({
          phaseNum,
          status: 'completed',
          timestamp: new Date().toISOString(),
          agents: (phase.agents || []).length
        });
      }

      // All phases completed
      this.workflowState.status = 'completed';
      this.workflowState.completedAt = new Date().toISOString();

      return {
        success: true,
        workflowId: this.workflowState.id,
        executionId,
        status: 'completed',
        phasesCompleted: this.workflowState.completedPhases.length,
        totalTime: new Date(this.workflowState.completedAt) - new Date(this.workflowState.startedAt),
        agentsInvoked: this.workflowState.agentsInvoked,
        summary: this._generateWorkflowSummary()
      };

    } catch (error) {
      this.workflowState.status = 'failed';
      this.workflowState.error = error.message;
      this.workflowState.failedAt = new Date().toISOString();
      this.workflowState.failedAtPhase = this.currentPhase;

      throw new Error(`Workflow execution failed at Phase ${this.currentPhase}: ${error.message}`);
    }
  }

  /**
   * Execute a single phase with all its agents
   */
  async _executePhase(phaseNum, phase, workflowInput, context) {
    console.log(`[Coordinator] Executing ${phase.agents?.length || 0} agents in Phase ${phaseNum}`);

    const phaseResult = {
      phaseNum,
      name: phase.name,
      agents: [],
      status: 'in-progress',
      startedAt: new Date().toISOString()
    };

    try {
      // Execute each agent in phase sequentially
      for (const agentId of (phase.agents || [])) {
        console.log(`[Coordinator] - Invoking agent: ${agentId}`);

        const agentResult = await this._invokeAgent(
          agentId,
          workflowInput,
          context,
          phaseNum
        );

        phaseResult.agents.push({
          agentId,
          status: agentResult.status,
          output: agentResult.output,
          executedAt: new Date().toISOString()
        });

        this.workflowState.agentsInvoked.push({
          agentId,
          phase: phaseNum,
          status: agentResult.status,
          timestamp: new Date().toISOString()
        });

        // Check for blockers
        if (agentResult.status === 'error') {
          throw new Error(`Agent ${agentId} failed: ${agentResult.error}`);
        }

        // Check for escalations
        if (agentResult.escalation) {
          await this._handleEscalation(agentId, agentResult.escalation, context);
        }
      }

      phaseResult.status = 'completed';
      phaseResult.completedAt = new Date().toISOString();
      return phaseResult;

    } catch (error) {
      phaseResult.status = 'failed';
      phaseResult.error = error.message;
      phaseResult.failedAt = new Date().toISOString();
      throw error;
    }
  }

  /**
   * Invoke an agent and handle its execution
   */
  async _invokeAgent(agentId, workflowInput, context, currentPhase) {
    try {
      console.log(`[Coordinator] Calling agent: ${agentId}`);

      // For now, return mock results
      // In production, this would load and execute the actual agent
      const agentSpec = AGENT_SPECIFICATIONS.find(s => s.id === agentId);
      
      if (!agentSpec) {
        throw new Error(`Agent ${agentId} not found in specifications`);
      }

      // Mock agent execution
      const result = {
        agentId,
        status: 'success',
        output: {
          agentId,
          phase: currentPhase,
          executedAt: new Date().toISOString(),
          processedItems: 1,
          message: `Agent ${agentId} (${agentSpec.name}) executed successfully`
        }
      };

      this.emit('agent-executed', {
        agentId,
        phase: currentPhase,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      return {
        agentId,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Request approval for phase transition
   */
  async _requestApproval(phaseNum, phase, context) {
    console.log(`[Coordinator] Requesting approval for Phase ${phaseNum}: ${phase.name}`);

    // Emit event for approval request
    this.emit('approval-requested', {
      phase: phaseNum,
      phaseName: phase.name,
      description: phase.description,
      timestamp: new Date().toISOString()
    });

    // In mock mode, automatically approve
    // In production, would wait for human/automated approval
    this.workflowState.approvals[phaseNum] = {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: 'system' // Would be actual approver in production
    };

    return true;
  }

  /**
   * Handle escalations from agents
   */
  async _handleEscalation(agentId, escalation, context) {
    console.log(`[Coordinator] Handling escalation from agent ${agentId}`);

    this.workflowState.blockers.push({
      agentId,
      severity: escalation.severity || 'warning',
      message: escalation.message,
      timestamp: new Date().toISOString(),
      requiresApproval: escalation.requiresApproval || false
    });

    this.emit('escalation', {
      agentId,
      severity: escalation.severity,
      message: escalation.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus() {
    return {
      id: this.workflowState?.id,
      status: this.workflowState?.status,
      currentPhase: this.currentPhase,
      completedPhases: this.workflowState?.completedPhases?.length || 0,
      agentsInvoked: this.workflowState?.agentsInvoked?.length || 0,
      blockers: this.workflowState?.blockers || [],
      progress: this._calculateProgress()
    };
  }

  /**
   * Get phase history
   */
  getPhaseHistory() {
    return this.phaseHistory;
  }

  /**
   * Get agent invocation summary
   */
  getAgentInvocationSummary() {
    const summary = {};
    for (const invocation of this.workflowState?.agentsInvoked || []) {
      if (!summary[invocation.agentId]) {
        summary[invocation.agentId] = { count: 0, phases: [], status: null };
      }
      summary[invocation.agentId].count++;
      summary[invocation.agentId].phases.push(invocation.phase);
      summary[invocation.agentId].status = invocation.status;
    }
    return summary;
  }

  /**
   * Cleanup on shutdown
   */
  async _onCleanup() {
    console.log('[Coordinator] Cleaning up workflow coordinator...');
    
    if (this.workflowState && this.workflowState.status !== 'completed') {
      this.workflowState.status = 'interrupted';
      this.workflowState.interruptedAt = new Date().toISOString();
    }

    this.emit('cleanup', {
      workflowId: this.workflowState?.id,
      timestamp: new Date().toISOString()
    });
  }

  // ===== Private Helper Methods =====

  _validateWorkflowInput(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid workflow input: must be an object');
    }
    return input;
  }

  _initializePhases(workflowInput) {
    return [
      {
        num: 0,
        name: 'Project Discovery & Planning',
        description: 'Gather requirements and plan approach',
        agents: ['plan']
      },
      {
        num: 1,
        name: 'Requirements Definition',
        description: 'Detailed requirements analysis',
        agents: ['backlog']
      },
      {
        num: 2,
        name: 'Architecture Planning',
        description: 'High-level architecture design',
        agents: ['architect']
      },
      {
        num: 3,
        name: 'Infrastructure Assessment',
        description: 'Cloud infrastructure assessment',
        agents: ['azure-principal-architect']
      },
      {
        num: 4,
        name: 'Code Architecture',
        description: 'Code-level architecture design',
        agents: ['code-architect']
      },
      {
        num: 5,
        name: 'Infrastructure Code Generation',
        description: 'Generate IaC from architecture',
        agents: ['bicep-plan', 'terraform-plan']
      },
      {
        num: 6,
        name: 'Frontend Implementation',
        description: 'Frontend code generation',
        agents: ['react-specialist']
      },
      {
        num: 7,
        name: 'Backend Implementation',
        description: 'Backend code generation',
        agents: ['dotnet-specialist', 'nodejs-specialist']
      },
      {
        num: 8,
        name: 'Integration & Testing',
        description: 'Integration and quality assurance',
        agents: ['qa']
      },
      {
        num: 9,
        name: 'Documentation',
        description: 'Generate project documentation',
        agents: ['doc']
      },
      {
        num: 10,
        name: 'Deployment Preparation',
        description: 'Prepare for deployment',
        agents: ['bicep-implement', 'terraform-implement']
      },
      {
        num: 11,
        name: 'Project Completion',
        description: 'Final reporting and closure',
        agents: ['reporter']
      }
    ];
  }

  _generateWorkflowId() {
    return `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  _calculateProgress() {
    const completed = this.workflowState?.completedPhases?.length || 0;
    const total = 12;
    return Math.round((completed / total) * 100);
  }

  _generateWorkflowSummary() {
    const invoked = this.workflowState?.agentsInvoked || [];
    const uniqueAgents = new Set(invoked.map(i => i.agentId)).size;
    const failedAgents = invoked.filter(i => i.status === 'error').length;

    return {
      totalAgentsInvoked: invoked.length,
      uniqueAgents,
      failedAgents,
      successRate: invoked.length > 0 ? ((invoked.length - failedAgents) / invoked.length * 100).toFixed(2) + '%' : '0%',
      blockers: this.workflowState?.blockers?.length || 0,
      approvals: Object.keys(this.workflowState?.approvals || {}).length
    };
  }
}
