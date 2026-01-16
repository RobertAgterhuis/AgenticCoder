/**
 * GitMCP Server Adapter
 * 
 * Provides GitHub repo documentation and README access via MCP
 * @module mcp/servers/documentation/GitMCPAdapter
 */

import { BaseServerAdapter } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { 
  MCPServerDefinition, 
  ToolCallResponse 
} from '../../types';

/**
 * Repository info
 */
export interface RepositoryInfo {
  owner: string;
  name: string;
  branch?: string;
}

/**
 * Documentation file type
 */
export type DocFileType = 
  | 'readme'
  | 'contributing'
  | 'changelog'
  | 'license'
  | 'code-of-conduct';

/**
 * GitMCP Adapter
 * 
 * Provides MCP access to GitHub repository documentation
 */
export class GitMCPAdapter extends BaseServerAdapter {
  /**
   * Get server identifier
   */
  getServerId(): string {
    return 'gitmcp';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'gitmcp',
      name: 'gitmcp',
      category: 'documentation',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic/gitmcp'],
      enabled: true,
      description: 'GitHub repository documentation access via MCP',
      tags: ['github', 'documentation', 'readme', 'repository'],
    };
  }

  /**
   * Get repository README
   */
  async getReadme(
    owner: string,
    repo: string,
    branch?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_readme', {
      owner,
      repo,
      ref: branch,
    });
  }

  /**
   * Get repository documentation file
   */
  async getDocFile(
    owner: string,
    repo: string,
    fileType: DocFileType,
    branch?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_doc_file', {
      owner,
      repo,
      fileType,
      ref: branch,
    });
  }

  /**
   * List documentation files in repository
   */
  async listDocFiles(
    owner: string,
    repo: string,
    branch?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_list_docs', {
      owner,
      repo,
      ref: branch,
    });
  }

  /**
   * Get repository Wiki pages
   */
  async getWikiPages(
    owner: string,
    repo: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_wiki', {
      owner,
      repo,
    });
  }

  /**
   * Get specific Wiki page
   */
  async getWikiPage(
    owner: string,
    repo: string,
    pageName: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_wiki_page', {
      owner,
      repo,
      page: pageName,
    });
  }

  /**
   * Search documentation
   */
  async searchDocs(
    owner: string,
    repo: string,
    query: string,
    options?: {
      path?: string;
      extension?: string;
    }
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_search_docs', {
      owner,
      repo,
      query,
      ...options,
    });
  }

  /**
   * Get repository structure
   */
  async getRepoStructure(
    owner: string,
    repo: string,
    path?: string,
    branch?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_structure', {
      owner,
      repo,
      path,
      ref: branch,
    });
  }

  /**
   * Get file contents
   */
  async getFileContents(
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_file', {
      owner,
      repo,
      path,
      ref: branch,
    });
  }

  /**
   * Get repository topics/tags
   */
  async getTopics(
    owner: string,
    repo: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_topics', {
      owner,
      repo,
    });
  }

  /**
   * Get repository metadata
   */
  async getMetadata(
    owner: string,
    repo: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_metadata', {
      owner,
      repo,
    });
  }

  /**
   * Get releases documentation
   */
  async getReleases(
    owner: string,
    repo: string,
    limit?: number
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_releases', {
      owner,
      repo,
      perPage: limit,
    });
  }

  /**
   * Get API documentation (if available)
   */
  async getAPIDocs(
    owner: string,
    repo: string
  ): Promise<ToolCallResponse> {
    return this.callTool('gitmcp_get_api_docs', {
      owner,
      repo,
    });
  }
}

/**
 * Create GitMCP adapter instance
 */
export function createGitMCPAdapter(clientManager: MCPClientManager): GitMCPAdapter {
  return new GitMCPAdapter(clientManager);
}
