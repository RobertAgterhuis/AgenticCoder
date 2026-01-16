/**
 * Azure DevOps MCP Server Adapter
 * 
 * Provides Azure DevOps operations via MCP
 * @module mcp/servers/deployment/AzureDevOpsAdapter
 */

import { BaseServerAdapter } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { 
  MCPServerDefinition, 
  ToolCallResponse 
} from '../../types';

/**
 * Azure DevOps work item types
 */
export type WorkItemType = 
  | 'Task'
  | 'Bug'
  | 'User Story'
  | 'Feature'
  | 'Epic'
  | 'Issue';

/**
 * Work item state
 */
export type WorkItemState = 
  | 'New'
  | 'Active'
  | 'Resolved'
  | 'Closed'
  | 'Removed';

/**
 * Pipeline run status
 */
export type PipelineStatus = 
  | 'notStarted'
  | 'inProgress'
  | 'completed'
  | 'canceling'
  | 'canceled';

/**
 * Work item definition
 */
export interface WorkItem {
  id?: number;
  type: WorkItemType;
  title: string;
  description?: string;
  state?: WorkItemState;
  assignedTo?: string;
  tags?: string[];
  areaPath?: string;
  iterationPath?: string;
}

/**
 * Pipeline definition
 */
export interface Pipeline {
  id: number;
  name: string;
  folder?: string;
}

/**
 * Build/Release result
 */
export interface PipelineRun {
  id: number;
  name: string;
  status: PipelineStatus;
  result?: 'succeeded' | 'failed' | 'canceled';
  startTime?: string;
  finishTime?: string;
}

/**
 * Azure DevOps Adapter
 * 
 * Provides MCP access to Azure DevOps operations
 */
export class AzureDevOpsAdapter extends BaseServerAdapter {
  /**
   * Get server identifier
   */
  getServerId(): string {
    return 'azure-devops';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'azure-devops',
      name: 'azure-devops',
      category: 'deployment',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic/azure-devops-mcp'],
      enabled: true,
      description: 'Azure DevOps work items, repos, and pipelines via MCP',
      tags: ['azure-devops', 'devops', 'pipelines', 'work-items', 'repos'],
    };
  }

  // ===================
  // Work Item Operations
  // ===================

  /**
   * Get work item by ID
   */
  async getWorkItem(
    project: string,
    workItemId: number
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_get_work_item', {
      project,
      id: workItemId,
    });
  }

  /**
   * Create work item
   */
  async createWorkItem(
    project: string,
    workItem: WorkItem
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_create_work_item', {
      project,
      type: workItem.type,
      title: workItem.title,
      description: workItem.description,
      assignedTo: workItem.assignedTo,
      tags: workItem.tags,
      areaPath: workItem.areaPath,
      iterationPath: workItem.iterationPath,
    });
  }

  /**
   * Update work item
   */
  async updateWorkItem(
    project: string,
    workItemId: number,
    updates: Partial<WorkItem>
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_update_work_item', {
      project,
      id: workItemId,
      ...updates,
    });
  }

  /**
   * Query work items
   */
  async queryWorkItems(
    project: string,
    wiql: string
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_query_work_items', {
      project,
      query: wiql,
    });
  }

  /**
   * List work items by type
   */
  async listWorkItems(
    project: string,
    type?: WorkItemType,
    state?: WorkItemState
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_list_work_items', {
      project,
      type,
      state,
    });
  }

  // ===================
  // Repository Operations
  // ===================

  /**
   * List repositories
   */
  async listRepositories(project: string): Promise<ToolCallResponse> {
    return this.callTool('ado_list_repos', {
      project,
    });
  }

  /**
   * Get repository
   */
  async getRepository(
    project: string,
    repositoryId: string
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_get_repo', {
      project,
      repositoryId,
    });
  }

  /**
   * Create repository
   */
  async createRepository(
    project: string,
    name: string
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_create_repo', {
      project,
      name,
    });
  }

  /**
   * List branches
   */
  async listBranches(
    project: string,
    repositoryId: string
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_list_branches', {
      project,
      repositoryId,
    });
  }

  /**
   * Get file contents
   */
  async getFileContents(
    project: string,
    repositoryId: string,
    path: string,
    branch?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_get_file', {
      project,
      repositoryId,
      path,
      version: branch,
    });
  }

  // ===================
  // Pull Request Operations
  // ===================

  /**
   * List pull requests
   */
  async listPullRequests(
    project: string,
    repositoryId: string,
    status?: 'active' | 'completed' | 'abandoned' | 'all'
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_list_pull_requests', {
      project,
      repositoryId,
      status,
    });
  }

  /**
   * Create pull request
   */
  async createPullRequest(
    project: string,
    repositoryId: string,
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_create_pull_request', {
      project,
      repositoryId,
      sourceRefName: `refs/heads/${sourceBranch}`,
      targetRefName: `refs/heads/${targetBranch}`,
      title,
      description,
    });
  }

  /**
   * Get pull request
   */
  async getPullRequest(
    project: string,
    repositoryId: string,
    pullRequestId: number
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_get_pull_request', {
      project,
      repositoryId,
      pullRequestId,
    });
  }

  /**
   * Approve pull request
   */
  async approvePullRequest(
    project: string,
    repositoryId: string,
    pullRequestId: number
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_approve_pull_request', {
      project,
      repositoryId,
      pullRequestId,
    });
  }

  /**
   * Complete pull request
   */
  async completePullRequest(
    project: string,
    repositoryId: string,
    pullRequestId: number,
    deleteSourceBranch?: boolean
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_complete_pull_request', {
      project,
      repositoryId,
      pullRequestId,
      deleteSourceBranch,
    });
  }

  // ===================
  // Pipeline Operations
  // ===================

  /**
   * List pipelines
   */
  async listPipelines(project: string): Promise<ToolCallResponse> {
    return this.callTool('ado_list_pipelines', {
      project,
    });
  }

  /**
   * Get pipeline
   */
  async getPipeline(
    project: string,
    pipelineId: number
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_get_pipeline', {
      project,
      pipelineId,
    });
  }

  /**
   * Run pipeline
   */
  async runPipeline(
    project: string,
    pipelineId: number,
    branch?: string,
    parameters?: Record<string, string>
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_run_pipeline', {
      project,
      pipelineId,
      resources: branch ? {
        repositories: {
          self: {
            refName: `refs/heads/${branch}`,
          },
        },
      } : undefined,
      templateParameters: parameters,
    });
  }

  /**
   * Get pipeline run
   */
  async getPipelineRun(
    project: string,
    pipelineId: number,
    runId: number
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_get_pipeline_run', {
      project,
      pipelineId,
      runId,
    });
  }

  /**
   * List pipeline runs
   */
  async listPipelineRuns(
    project: string,
    pipelineId: number
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_list_pipeline_runs', {
      project,
      pipelineId,
    });
  }

  /**
   * Get pipeline logs
   */
  async getPipelineLogs(
    project: string,
    pipelineId: number,
    runId: number
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_get_pipeline_logs', {
      project,
      pipelineId,
      runId,
    });
  }

  // ===================
  // Build Operations
  // ===================

  /**
   * List builds
   */
  async listBuilds(
    project: string,
    definitionId?: number
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_list_builds', {
      project,
      definitions: definitionId,
    });
  }

  /**
   * Get build
   */
  async getBuild(
    project: string,
    buildId: number
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_get_build', {
      project,
      buildId,
    });
  }

  /**
   * Queue build
   */
  async queueBuild(
    project: string,
    definitionId: number,
    sourceBranch?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('ado_queue_build', {
      project,
      definition: { id: definitionId },
      sourceBranch,
    });
  }

  // ===================
  // Project Operations
  // ===================

  /**
   * List projects
   */
  async listProjects(): Promise<ToolCallResponse> {
    return this.callTool('ado_list_projects', {});
  }

  /**
   * Get project
   */
  async getProject(projectId: string): Promise<ToolCallResponse> {
    return this.callTool('ado_get_project', {
      projectId,
    });
  }
}

/**
 * Create Azure DevOps adapter instance
 */
export function createAzureDevOpsAdapter(clientManager: MCPClientManager): AzureDevOpsAdapter {
  return new AzureDevOpsAdapter(clientManager);
}
