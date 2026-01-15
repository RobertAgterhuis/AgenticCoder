// AgenticCoder Agent Framework
// Main exports for the agent system

// Core Framework
export { BaseAgent } from './core/BaseAgent.js';
export { AgentRegistry, registry } from './core/AgentRegistry.js';
export { WorkflowEngine } from './core/WorkflowEngine.js';
export { MessageBus, messageBus } from './core/MessageBus.js';
export { EnhancedMessageBus, enhancedMessageBus, PRIORITY, PHASE_PRIORITY } from './core/EnhancedMessageBus.js';
export { McpClient, McpClientFactory } from './core/McpClient.js';
export { ToolClient } from './core/tooling/ToolClient.js';
export { ToolClientFactory } from './core/tooling/ToolClientFactory.js';
export { HttpToolClient } from './core/tooling/HttpToolClient.js';
export { McpStdioToolClient } from './core/tooling/McpStdioToolClient.js';

// Agent Specifications & Discovery (Phase 2 Enhancement)
export { AGENT_SPECIFICATIONS, AgentSpecificationIndex } from './core/AgentSpecifications.js';
export { createAgentDiscoveryRouter } from './core/AgentDiscoveryService.js';

// Unified Workflow (Phase 2 Task #3)
export { 
  phases as WORKFLOW_PHASES,
  stateTransitions as WORKFLOW_TRANSITIONS,
  phaseValidationRules as PHASE_VALIDATION_RULES,
  agentPhaseAssignments as AGENT_PHASE_ASSIGNMENTS,
  phaseDependencies as PHASE_DEPENDENCIES,
  workflowStats as WORKFLOW_STATS,
  getPhase,
  getAllPhases,
  getPhasesByTier,
  getAgentsForPhase,
  getNextPhase,
  getPhaseSequence,
  getWorkflowDuration
} from './core/UnifiedWorkflow.js';

// Task Agents
export { TaskExtractionAgent } from './task/TaskExtractionAgent.js';

// Infrastructure Agents
export { ResourceAnalyzerAgent } from './infrastructure/ResourceAnalyzerAgent.js';
export { CostEstimatorAgent } from './infrastructure/CostEstimatorAgent.js';
export { DeploymentPlannerAgent } from './infrastructure/DeploymentPlannerAgent.js';

// Validation Agents
export { ValidationAgent } from './validation/ValidationAgent.js';

// Bicep AVM Resolver (Phase 3)
export { default as BicepAVMResolver } from './bicep-avm-resolver/BicepAVMResolver.js';

// Version
export const VERSION = '2.0.0'; // Updated for Phase 2 completion
