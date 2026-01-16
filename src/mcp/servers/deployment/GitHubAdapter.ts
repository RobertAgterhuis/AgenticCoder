/**
 * GitHub MCP Server Adapter
 * 
 * Provides GitHub API operations via MCP
 * @module mcp/servers/deployment/GitHubAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * GitHub adapter configuration
 */
export interface GitHubAdapterConfig extends ServerAdapterConfig {
  token?: string;
  owner?: string;
  repo?: string;
}

/**
 * Repository information
 */
export interface Repository {
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  defaultBranch: string;
  language: string;
  stars: number;
  forks: number;
}

/**
 * Issue information
 */
export interface Issue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Pull request information
 */
export interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  head: string;
  base: string;
  draft: boolean;
  mergeable: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * GitHub MCP Server Adapter
 */
export class GitHubAdapter extends BaseServerAdapter {
  private token: string | undefined;
  private defaultOwner: string | undefined;
  private defaultRepo: string | undefined;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<GitHubAdapterConfig>
  ) {
    super(clientManager, config);
    this.token = config?.token || process.env.GITHUB_TOKEN;
    this.defaultOwner = config?.owner;
    this.defaultRepo = config?.repo;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'github';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'github',
      name: 'GitHub Server',
      description: 'GitHub API operations',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      category: 'deployment',
      enabled: true,
      tags: ['deployment', 'github', 'vcs'],
      env: {
        GITHUB_TOKEN: this.token || '${GITHUB_TOKEN}',
      },
    };
  }

  /**
   * Get repository information
   */
  async getRepository(owner?: string, repo?: string): Promise<Repository> {
    const response = await this.callTool('get_repository', {
      owner: owner || this.defaultOwner,
      repo: repo || this.defaultRepo,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get repository: ${response.error?.message}`);
    }

    return response.result as Repository;
  }

  /**
   * List issues
   */
  async listIssues(options?: {
    owner?: string;
    repo?: string;
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
    perPage?: number;
  }): Promise<Issue[]> {
    const response = await this.callTool('list_issues', {
      owner: options?.owner || this.defaultOwner,
      repo: options?.repo || this.defaultRepo,
      state: options?.state || 'open',
      labels: options?.labels,
      per_page: options?.perPage || 30,
    });
    
    if (!response.success) {
      throw new Error(`Failed to list issues: ${response.error?.message}`);
    }

    return response.result as Issue[];
  }

  /**
   * Create an issue
   */
  async createIssue(
    title: string,
    body: string,
    options?: {
      owner?: string;
      repo?: string;
      labels?: string[];
      assignees?: string[];
    }
  ): Promise<Issue> {
    const response = await this.callTool('create_issue', {
      owner: options?.owner || this.defaultOwner,
      repo: options?.repo || this.defaultRepo,
      title,
      body,
      labels: options?.labels,
      assignees: options?.assignees,
    });
    
    if (!response.success) {
      throw new Error(`Failed to create issue: ${response.error?.message}`);
    }

    return response.result as Issue;
  }

  /**
   * List pull requests
   */
  async listPullRequests(options?: {
    owner?: string;
    repo?: string;
    state?: 'open' | 'closed' | 'all';
    perPage?: number;
  }): Promise<PullRequest[]> {
    const response = await this.callTool('list_pull_requests', {
      owner: options?.owner || this.defaultOwner,
      repo: options?.repo || this.defaultRepo,
      state: options?.state || 'open',
      per_page: options?.perPage || 30,
    });
    
    if (!response.success) {
      throw new Error(`Failed to list pull requests: ${response.error?.message}`);
    }

    return response.result as PullRequest[];
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    title: string,
    body: string,
    head: string,
    base: string,
    options?: {
      owner?: string;
      repo?: string;
      draft?: boolean;
    }
  ): Promise<PullRequest> {
    const response = await this.callTool('create_pull_request', {
      owner: options?.owner || this.defaultOwner,
      repo: options?.repo || this.defaultRepo,
      title,
      body,
      head,
      base,
      draft: options?.draft ?? false,
    });
    
    if (!response.success) {
      throw new Error(`Failed to create pull request: ${response.error?.message}`);
    }

    return response.result as PullRequest;
  }

  /**
   * Get file contents
   */
  async getFileContents(
    path: string,
    options?: {
      owner?: string;
      repo?: string;
      ref?: string;
    }
  ): Promise<{ content: string; sha: string }> {
    const response = await this.callTool('get_file_contents', {
      owner: options?.owner || this.defaultOwner,
      repo: options?.repo || this.defaultRepo,
      path,
      ref: options?.ref,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get file contents: ${response.error?.message}`);
    }

    return response.result as { content: string; sha: string };
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    options?: {
      owner?: string;
      repo?: string;
      branch?: string;
      sha?: string;
    }
  ): Promise<{ sha: string }> {
    const response = await this.callTool('create_or_update_file', {
      owner: options?.owner || this.defaultOwner,
      repo: options?.repo || this.defaultRepo,
      path,
      content,
      message,
      branch: options?.branch,
      sha: options?.sha,
    });
    
    if (!response.success) {
      throw new Error(`Failed to create/update file: ${response.error?.message}`);
    }

    return response.result as { sha: string };
  }

  /**
   * Search code
   */
  async searchCode(
    query: string,
    options?: {
      owner?: string;
      repo?: string;
      perPage?: number;
    }
  ): Promise<Array<{
    path: string;
    repository: string;
    url: string;
  }>> {
    const fullQuery = options?.owner && options?.repo
      ? `${query} repo:${options.owner}/${options.repo}`
      : query;

    const response = await this.callTool('search_code', {
      query: fullQuery,
      per_page: options?.perPage || 30,
    });
    
    if (!response.success) {
      throw new Error(`Failed to search code: ${response.error?.message}`);
    }

    return response.result as Array<{
      path: string;
      repository: string;
      url: string;
    }>;
  }

  /**
   * Create a branch
   */
  async createBranch(
    branchName: string,
    fromRef: string,
    options?: {
      owner?: string;
      repo?: string;
    }
  ): Promise<void> {
    const response = await this.callTool('create_branch', {
      owner: options?.owner || this.defaultOwner,
      repo: options?.repo || this.defaultRepo,
      branch: branchName,
      from_ref: fromRef,
    });
    
    if (!response.success) {
      throw new Error(`Failed to create branch: ${response.error?.message}`);
    }
  }
}

/**
 * Create a GitHub adapter
 */
export function createGitHubAdapter(
  clientManager: MCPClientManager,
  config?: Partial<GitHubAdapterConfig>
): GitHubAdapter {
  return new GitHubAdapter(clientManager, config);
}
