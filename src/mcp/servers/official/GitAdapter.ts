/**
 * Git MCP Server Adapter
 * 
 * Provides Git repository operations via MCP
 * @module mcp/servers/official/GitAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * Git adapter configuration
 */
export interface GitAdapterConfig extends ServerAdapterConfig {
  workingDirectory?: string;
}

/**
 * Git commit information
 */
export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

/**
 * Git branch information
 */
export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

/**
 * Git status entry
 */
export interface GitStatusEntry {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

/**
 * Git diff entry
 */
export interface GitDiffEntry {
  path: string;
  additions: number;
  deletions: number;
  diff: string;
}

/**
 * Git MCP Server Adapter
 */
export class GitAdapter extends BaseServerAdapter {
  private workingDirectory: string;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<GitAdapterConfig>
  ) {
    super(clientManager, config);
    this.workingDirectory = config?.workingDirectory || process.cwd();
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'git';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'git',
      name: 'Git Server',
      description: 'Git repository operations',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-git'],
      category: 'official',
      enabled: true,
      tags: ['official', 'git', 'vcs'],
    };
  }

  /**
   * Get repository status
   */
  async status(repoPath?: string): Promise<GitStatusEntry[]> {
    const response = await this.callTool('git_status', {
      repo_path: repoPath || this.workingDirectory,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get status: ${response.error?.message}`);
    }

    return response.result as GitStatusEntry[];
  }

  /**
   * Get commit log
   */
  async log(options?: {
    repoPath?: string;
    maxCount?: number;
    branch?: string;
  }): Promise<GitCommit[]> {
    const response = await this.callTool('git_log', {
      repo_path: options?.repoPath || this.workingDirectory,
      max_count: options?.maxCount || 10,
      branch: options?.branch,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get log: ${response.error?.message}`);
    }

    return response.result as GitCommit[];
  }

  /**
   * Get diff
   */
  async diff(options?: {
    repoPath?: string;
    target?: string;
    staged?: boolean;
  }): Promise<GitDiffEntry[]> {
    const response = await this.callTool('git_diff', {
      repo_path: options?.repoPath || this.workingDirectory,
      target: options?.target,
      staged: options?.staged ?? false,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get diff: ${response.error?.message}`);
    }

    return response.result as GitDiffEntry[];
  }

  /**
   * List branches
   */
  async branches(repoPath?: string): Promise<GitBranch[]> {
    const response = await this.callTool('git_branch_list', {
      repo_path: repoPath || this.workingDirectory,
    });
    
    if (!response.success) {
      throw new Error(`Failed to list branches: ${response.error?.message}`);
    }

    return response.result as GitBranch[];
  }

  /**
   * Checkout branch
   */
  async checkout(branch: string, options?: {
    repoPath?: string;
    createNew?: boolean;
  }): Promise<void> {
    const response = await this.callTool('git_checkout', {
      repo_path: options?.repoPath || this.workingDirectory,
      branch,
      create_new: options?.createNew ?? false,
    });
    
    if (!response.success) {
      throw new Error(`Failed to checkout: ${response.error?.message}`);
    }
  }

  /**
   * Stage files
   */
  async add(paths: string[], repoPath?: string): Promise<void> {
    const response = await this.callTool('git_add', {
      repo_path: repoPath || this.workingDirectory,
      paths,
    });
    
    if (!response.success) {
      throw new Error(`Failed to stage files: ${response.error?.message}`);
    }
  }

  /**
   * Commit changes
   */
  async commit(message: string, repoPath?: string): Promise<GitCommit> {
    const response = await this.callTool('git_commit', {
      repo_path: repoPath || this.workingDirectory,
      message,
    });
    
    if (!response.success) {
      throw new Error(`Failed to commit: ${response.error?.message}`);
    }

    return response.result as GitCommit;
  }

  /**
   * Show file content at revision
   */
  async show(path: string, revision?: string, repoPath?: string): Promise<string> {
    const response = await this.callTool('git_show', {
      repo_path: repoPath || this.workingDirectory,
      path,
      revision: revision || 'HEAD',
    });
    
    if (!response.success) {
      throw new Error(`Failed to show file: ${response.error?.message}`);
    }

    return response.result as string;
  }

  /**
   * Get file blame
   */
  async blame(path: string, repoPath?: string): Promise<Array<{
    commit: string;
    author: string;
    line: number;
    content: string;
  }>> {
    const response = await this.callTool('git_blame', {
      repo_path: repoPath || this.workingDirectory,
      path,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get blame: ${response.error?.message}`);
    }

    return response.result as Array<{
      commit: string;
      author: string;
      line: number;
      content: string;
    }>;
  }
}

/**
 * Create a Git adapter
 */
export function createGitAdapter(
  clientManager: MCPClientManager,
  config?: Partial<GitAdapterConfig>
): GitAdapter {
  return new GitAdapter(clientManager, config);
}
