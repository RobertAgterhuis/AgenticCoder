/**
 * Docker MCP Server Adapter
 * 
 * Provides Docker container operations via MCP
 * @module mcp/servers/deployment/DockerAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * Docker adapter configuration
 */
export interface DockerAdapterConfig extends ServerAdapterConfig {
  socketPath?: string;
  host?: string;
}

/**
 * Container information
 */
export interface Container {
  id: string;
  name: string;
  image: string;
  state: 'running' | 'stopped' | 'paused' | 'exited';
  status: string;
  ports: Array<{ private: number; public: number; protocol: string }>;
  created: string;
}

/**
 * Image information
 */
export interface DockerImage {
  id: string;
  tags: string[];
  size: number;
  created: string;
}

/**
 * Build result
 */
export interface BuildResult {
  success: boolean;
  imageId: string;
  logs: string[];
}

/**
 * Docker MCP Server Adapter
 */
export class DockerAdapter extends BaseServerAdapter {
  private socketPath: string | undefined;
  private host: string | undefined;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<DockerAdapterConfig>
  ) {
    super(clientManager, config);
    this.socketPath = config?.socketPath;
    this.host = config?.host;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'docker';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    const env: Record<string, string> = {};
    if (this.socketPath) {
      env.DOCKER_HOST = `unix://${this.socketPath}`;
    } else if (this.host) {
      env.DOCKER_HOST = this.host;
    }

    return {
      id: 'docker',
      name: 'Docker Server',
      description: 'Docker container operations',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic/docker-mcp-server'],
      category: 'deployment',
      enabled: true,
      tags: ['deployment', 'docker', 'containers'],
      env: Object.keys(env).length > 0 ? env : undefined,
    };
  }

  /**
   * List containers
   */
  async listContainers(all: boolean = false): Promise<Container[]> {
    const response = await this.callTool('list_containers', { all });
    
    if (!response.success) {
      throw new Error(`Failed to list containers: ${response.error?.message}`);
    }

    return response.result as Container[];
  }

  /**
   * Get container details
   */
  async getContainer(containerId: string): Promise<Container> {
    const response = await this.callTool('get_container', {
      container_id: containerId,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get container: ${response.error?.message}`);
    }

    return response.result as Container;
  }

  /**
   * Run a container
   */
  async runContainer(
    image: string,
    options?: {
      name?: string;
      ports?: Array<{ host: number; container: number }>;
      env?: Record<string, string>;
      volumes?: Array<{ host: string; container: string }>;
      detach?: boolean;
      command?: string[];
    }
  ): Promise<Container> {
    const response = await this.callTool('run_container', {
      image,
      name: options?.name,
      ports: options?.ports,
      environment: options?.env,
      volumes: options?.volumes,
      detach: options?.detach ?? true,
      command: options?.command,
    });
    
    if (!response.success) {
      throw new Error(`Failed to run container: ${response.error?.message}`);
    }

    return response.result as Container;
  }

  /**
   * Stop a container
   */
  async stopContainer(containerId: string, timeout?: number): Promise<void> {
    const response = await this.callTool('stop_container', {
      container_id: containerId,
      timeout: timeout ?? 10,
    });
    
    if (!response.success) {
      throw new Error(`Failed to stop container: ${response.error?.message}`);
    }
  }

  /**
   * Start a container
   */
  async startContainer(containerId: string): Promise<void> {
    const response = await this.callTool('start_container', {
      container_id: containerId,
    });
    
    if (!response.success) {
      throw new Error(`Failed to start container: ${response.error?.message}`);
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(containerId: string, force?: boolean): Promise<void> {
    const response = await this.callTool('remove_container', {
      container_id: containerId,
      force: force ?? false,
    });
    
    if (!response.success) {
      throw new Error(`Failed to remove container: ${response.error?.message}`);
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(
    containerId: string,
    options?: {
      tail?: number;
      timestamps?: boolean;
    }
  ): Promise<string> {
    const response = await this.callTool('get_container_logs', {
      container_id: containerId,
      tail: options?.tail ?? 100,
      timestamps: options?.timestamps ?? false,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get logs: ${response.error?.message}`);
    }

    return response.result as string;
  }

  /**
   * List images
   */
  async listImages(): Promise<DockerImage[]> {
    const response = await this.callTool('list_images', {});
    
    if (!response.success) {
      throw new Error(`Failed to list images: ${response.error?.message}`);
    }

    return response.result as DockerImage[];
  }

  /**
   * Pull an image
   */
  async pullImage(image: string, tag?: string): Promise<void> {
    const response = await this.callTool('pull_image', {
      image,
      tag: tag ?? 'latest',
    });
    
    if (!response.success) {
      throw new Error(`Failed to pull image: ${response.error?.message}`);
    }
  }

  /**
   * Build an image
   */
  async buildImage(
    contextPath: string,
    options?: {
      tag?: string;
      dockerfile?: string;
      buildArgs?: Record<string, string>;
    }
  ): Promise<BuildResult> {
    const response = await this.callTool('build_image', {
      context_path: contextPath,
      tag: options?.tag,
      dockerfile: options?.dockerfile || 'Dockerfile',
      build_args: options?.buildArgs,
    });
    
    if (!response.success) {
      throw new Error(`Failed to build image: ${response.error?.message}`);
    }

    return response.result as BuildResult;
  }

  /**
   * Execute command in container
   */
  async execInContainer(
    containerId: string,
    command: string[]
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const response = await this.callTool('exec_in_container', {
      container_id: containerId,
      command,
    });
    
    if (!response.success) {
      throw new Error(`Failed to exec in container: ${response.error?.message}`);
    }

    return response.result as { stdout: string; stderr: string; exitCode: number };
  }
}

/**
 * Create a Docker adapter
 */
export function createDockerAdapter(
  clientManager: MCPClientManager,
  config?: Partial<DockerAdapterConfig>
): DockerAdapter {
  return new DockerAdapter(clientManager, config);
}
