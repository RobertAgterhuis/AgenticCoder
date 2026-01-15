import { CoordinatorAgent } from './CoordinatorAgent.js';
import { PlannerAgent } from './PlannerAgent.js';
import { ArchitectAgent } from './ArchitectAgent.js';
import { CodeArchitectAgent } from './CodeArchitectAgent.js';
import { QAAgent } from './QAAgent.js';
import { ReporterAgent } from './ReporterAgent.js';
import { AzurePrincipalArchitectAgent } from './AzurePrincipalArchitectAgent.js';
import { BicepPlanAgent } from './BicepPlanAgent.js';
import { TerraformPlanAgent } from './TerraformPlanAgent.js';
import { DiagramGeneratorAgent } from './DiagramGeneratorAgent.js';
import { ADRGeneratorAgent } from './ADRGeneratorAgent.js';
import { BicepImplementAgent } from './BicepImplementAgent.js';
import { TerraformImplementAgent } from './TerraformImplementAgent.js';
import { DockerSpecialistAgent } from './DockerSpecialistAgent.js';
// Additional agents will be imported here as they're created

/**
 * Agent Factory - Creates agent instances by ID
 */
export class AgentFactory {
  static agentClasses = {
    'coordinator': CoordinatorAgent,
    'plan': PlannerAgent,
    'architect': ArchitectAgent,
    'code-architect': CodeArchitectAgent,
    'qa': QAAgent,
    'reporter': ReporterAgent,
    'azure-principal-architect': AzurePrincipalArchitectAgent,
    'bicep-plan': BicepPlanAgent,
    'terraform-plan': TerraformPlanAgent,
    'diagram-generator': DiagramGeneratorAgent,
    'adr-generator': ADRGeneratorAgent,
    'bicep-implement': BicepImplementAgent,
    'terraform-implement': TerraformImplementAgent,
    'docker-specialist': DockerSpecialistAgent
    // Additional agents will be registered here
  };

  /**
   * Create an agent by ID
   */
  static createAgent(agentId, options = {}) {
    const AgentClass = this.agentClasses[agentId];
    
    if (!AgentClass) {
      throw new Error(`Agent '${agentId}' not found. Available agents: ${Object.keys(this.agentClasses).join(', ')}`);
    }

    return new AgentClass(options);
  }

  /**
   * Get all available agent IDs
   */
  static getAvailableAgents() {
    return Object.keys(this.agentClasses);
  }

  /**
   * Register a new agent class
   */
  static registerAgent(agentId, AgentClass) {
    if (this.agentClasses[agentId]) {
      console.warn(`Agent '${agentId}' already exists. Overwriting...`);
    }
    this.agentClasses[agentId] = AgentClass;
  }

  /**
   * Check if an agent is available
   */
  static isAvailable(agentId) {
    return agentId in this.agentClasses;
  }
}

/**
 * Export all agents
 */
export { CoordinatorAgent };
export { PlannerAgent };
export { ArchitectAgent };
export { CodeArchitectAgent };
