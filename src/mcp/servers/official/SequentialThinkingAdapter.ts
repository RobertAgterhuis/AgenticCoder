/**
 * Sequential Thinking MCP Server Adapter
 * 
 * Provides step-by-step reasoning support via MCP
 * @module mcp/servers/official/SequentialThinkingAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * Sequential thinking adapter configuration
 */
export interface SequentialThinkingAdapterConfig extends ServerAdapterConfig {
  maxSteps?: number;
}

/**
 * Thinking step
 */
export interface ThinkingStep {
  step: number;
  thought: string;
  action?: string;
  observation?: string;
  needsMoreThinking: boolean;
}

/**
 * Thinking session result
 */
export interface ThinkingResult {
  steps: ThinkingStep[];
  conclusion: string;
  totalSteps: number;
}

/**
 * Sequential Thinking MCP Server Adapter
 */
export class SequentialThinkingAdapter extends BaseServerAdapter {
  private maxSteps: number;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<SequentialThinkingAdapterConfig>
  ) {
    super(clientManager, config);
    this.maxSteps = config?.maxSteps ?? 20;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'sequential-thinking';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'sequential-thinking',
      name: 'Sequential Thinking Server',
      description: 'Step-by-step reasoning support',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      category: 'official',
      enabled: true,
      tags: ['official', 'reasoning', 'thinking'],
    };
  }

  /**
   * Start a thinking session
   */
  async think(
    thought: string,
    options?: {
      nextThoughtNeeded?: boolean;
      thoughtNumber?: number;
      totalThoughts?: number;
      isRevision?: boolean;
      revisesThought?: number;
      branchFromThought?: number;
      branchId?: string;
    }
  ): Promise<ThinkingStep> {
    const response = await this.callTool('sequentialthinking', {
      thought,
      nextThoughtNeeded: options?.nextThoughtNeeded ?? true,
      thoughtNumber: options?.thoughtNumber ?? 1,
      totalThoughts: options?.totalThoughts ?? this.maxSteps,
      isRevision: options?.isRevision ?? false,
      revisesThought: options?.revisesThought,
      branchFromThought: options?.branchFromThought,
      branchId: options?.branchId,
    });
    
    if (!response.success) {
      throw new Error(`Failed to process thought: ${response.error?.message}`);
    }

    return response.result as ThinkingStep;
  }

  /**
   * Execute a complete thinking process
   */
  async executeThinkingProcess(
    initialThought: string,
    maxSteps?: number
  ): Promise<ThinkingResult> {
    const steps: ThinkingStep[] = [];
    let currentStep = 1;
    const limit = maxSteps ?? this.maxSteps;

    let step = await this.think(initialThought, {
      thoughtNumber: currentStep,
      totalThoughts: limit,
    });
    steps.push(step);

    while (step.needsMoreThinking && currentStep < limit) {
      currentStep++;
      
      // Generate next thought based on previous observation
      const nextThought = step.observation || `Continue from step ${currentStep - 1}`;
      
      step = await this.think(nextThought, {
        thoughtNumber: currentStep,
        totalThoughts: limit,
        nextThoughtNeeded: currentStep < limit,
      });
      steps.push(step);
    }

    return {
      steps,
      conclusion: steps[steps.length - 1]?.thought || '',
      totalSteps: steps.length,
    };
  }

  /**
   * Revise a previous thought
   */
  async reviseThought(
    revisedThought: string,
    originalThoughtNumber: number
  ): Promise<ThinkingStep> {
    return this.think(revisedThought, {
      isRevision: true,
      revisesThought: originalThoughtNumber,
    });
  }

  /**
   * Branch from a specific thought
   */
  async branchThought(
    branchThought: string,
    fromThoughtNumber: number,
    branchId: string
  ): Promise<ThinkingStep> {
    return this.think(branchThought, {
      branchFromThought: fromThoughtNumber,
      branchId,
    });
  }
}

/**
 * Create a Sequential Thinking adapter
 */
export function createSequentialThinkingAdapter(
  clientManager: MCPClientManager,
  config?: Partial<SequentialThinkingAdapterConfig>
): SequentialThinkingAdapter {
  return new SequentialThinkingAdapter(clientManager, config);
}
