/**
 * Filesystem MCP Server Adapter
 * 
 * Provides filesystem operations via MCP
 * @module mcp/servers/official/FilesystemAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition, ToolCallResponse } from '../../types';

/**
 * Filesystem adapter configuration
 */
export interface FilesystemAdapterConfig extends ServerAdapterConfig {
  rootPath?: string;
  allowedPaths?: string[];
}

/**
 * File information
 */
export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

/**
 * Directory listing result
 */
export interface DirectoryListing {
  path: string;
  entries: FileInfo[];
}

/**
 * Filesystem MCP Server Adapter
 */
export class FilesystemAdapter extends BaseServerAdapter {
  private rootPath: string;
  private allowedPaths: string[];

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<FilesystemAdapterConfig>
  ) {
    super(clientManager, config);
    this.rootPath = config?.rootPath || '/';
    this.allowedPaths = config?.allowedPaths || ['/'];
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'filesystem';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'filesystem',
      name: 'Filesystem Server',
      description: 'Read/write access to local filesystem',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', ...this.allowedPaths],
      category: 'official',
      enabled: true,
      tags: ['official', 'filesystem', 'io'],
    };
  }

  /**
   * Read a file
   */
  async readFile(path: string): Promise<string> {
    const response = await this.callTool('read_file', { path });
    
    if (!response.success) {
      throw new Error(`Failed to read file: ${response.error?.message}`);
    }

    return response.result as string;
  }

  /**
   * Write a file
   */
  async writeFile(path: string, content: string): Promise<void> {
    const response = await this.callTool('write_file', { path, content });
    
    if (!response.success) {
      throw new Error(`Failed to write file: ${response.error?.message}`);
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<DirectoryListing> {
    const response = await this.callTool('list_directory', { path });
    
    if (!response.success) {
      throw new Error(`Failed to list directory: ${response.error?.message}`);
    }

    return response.result as DirectoryListing;
  }

  /**
   * Create a directory
   */
  async createDirectory(path: string): Promise<void> {
    const response = await this.callTool('create_directory', { path });
    
    if (!response.success) {
      throw new Error(`Failed to create directory: ${response.error?.message}`);
    }
  }

  /**
   * Delete a file or directory
   */
  async delete(path: string): Promise<void> {
    const response = await this.callTool('delete', { path });
    
    if (!response.success) {
      throw new Error(`Failed to delete: ${response.error?.message}`);
    }
  }

  /**
   * Move/rename a file or directory
   */
  async move(source: string, destination: string): Promise<void> {
    const response = await this.callTool('move', { source, destination });
    
    if (!response.success) {
      throw new Error(`Failed to move: ${response.error?.message}`);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(path: string): Promise<FileInfo> {
    const response = await this.callTool('get_file_info', { path });
    
    if (!response.success) {
      throw new Error(`Failed to get file info: ${response.error?.message}`);
    }

    return response.result as FileInfo;
  }

  /**
   * Check if path exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      await this.getFileInfo(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Search for files matching a pattern
   */
  async search(
    path: string,
    pattern: string,
    options?: { recursive?: boolean; maxResults?: number }
  ): Promise<FileInfo[]> {
    const response = await this.callTool('search_files', {
      path,
      pattern,
      recursive: options?.recursive ?? true,
      max_results: options?.maxResults ?? 100,
    });
    
    if (!response.success) {
      throw new Error(`Failed to search: ${response.error?.message}`);
    }

    return response.result as FileInfo[];
  }
}

/**
 * Create a filesystem adapter
 */
export function createFilesystemAdapter(
  clientManager: MCPClientManager,
  config?: Partial<FilesystemAdapterConfig>
): FilesystemAdapter {
  return new FilesystemAdapter(clientManager, config);
}
