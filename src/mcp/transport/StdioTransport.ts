/**
 * Stdio Transport
 * 
 * Transport implementation for stdio-based MCP servers
 * Communicates via stdin/stdout using JSON-RPC
 * @module mcp/transport/StdioTransport
 */

import { spawn, ChildProcess } from 'child_process';
import { BaseTransport } from './BaseTransport';
import { 
  TransportType, 
  ToolCallRequest, 
  ToolCallResponse,
  MCPServerDefinition,
  MCPToolInfo,
  JsonRpcRequest,
  JsonRpcResponse,
  MCPInitializeParams,
  MCPInitializeResult,
  MCPToolsListResult,
  MCPToolCallResult,
} from '../types';
import { 
  ConnectionError, 
  ToolExecutionError, 
  TimeoutError,
  ProtocolError,
} from '../errors/MCPError';

/**
 * Pending request tracker
 */
interface PendingRequest {
  resolve: (response: JsonRpcResponse) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  startTime: number;
  method: string;
}

/**
 * Default timeout for operations
 */
const DEFAULT_TIMEOUT_MS = 30000;
const INIT_TIMEOUT_MS = 10000;

/**
 * MCP Protocol version
 */
const MCP_PROTOCOL_VERSION = '2024-11-05';

/**
 * Stdio transport for MCP servers
 * Communicates via stdin/stdout using JSON-RPC 2.0
 */
export class StdioTransport extends BaseTransport {
  private process: ChildProcess | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private buffer: string = '';
  private requestId: number = 0;
  private serverCapabilities: MCPInitializeResult | null = null;
  private tools: MCPToolInfo[] = [];

  constructor(serverDefinition: MCPServerDefinition) {
    super(serverDefinition);
  }

  get type(): TransportType {
    return 'stdio';
  }

  /**
   * Connect by spawning the MCP server process
   */
  async connect(): Promise<void> {
    if (this.isConnected()) {
      this.logger.debug('Already connected');
      return;
    }

    this.setStatus('connecting');

    const { command, args = [], env = {} } = this.serverDefinition;

    if (!command) {
      throw new ConnectionError(
        this.serverDefinition.id,
        'No command specified for stdio transport'
      );
    }

    try {
      this.logger.debug(`Spawning process: ${command} ${args.join(' ')}`);
      
      this.process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...env },
        shell: process.platform === 'win32',
      });

      // Handle stdout (responses)
      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleStdout(data);
      });

      // Handle stderr (logs/errors)
      this.process.stderr?.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        if (message) {
          this.logger.debug(`Server stderr: ${message}`);
        }
      });

      // Handle process exit
      this.process.on('exit', (code, signal) => {
        this.handleProcessExit(code, signal);
      });

      // Handle process error
      this.process.on('error', (error) => {
        this.handleProcessError(error);
      });

      // Wait for process to be ready
      await this.waitForReady();

      // Initialize MCP protocol
      await this.initialize();

      // Fetch available tools
      await this.fetchTools();

      this.setStatus('connected');
      this.logger.info(`Connected with ${this.tools.length} tools available`);
    } catch (error) {
      this.setStatus('error', (error as Error).message);
      await this.cleanup();
      throw new ConnectionError(
        this.serverDefinition.id,
        `Failed to connect: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Wait for process to be ready
   */
  private async waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new TimeoutError('process_ready', 5000));
      }, 5000);

      if (this.process?.pid) {
        clearTimeout(timeout);
        resolve();
      } else {
        this.process?.once('spawn', () => {
          clearTimeout(timeout);
          resolve();
        });
        this.process?.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      }
    });
  }

  /**
   * Initialize MCP protocol
   */
  private async initialize(): Promise<void> {
    const params: MCPInitializeParams = {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        roots: { listChanged: true },
      },
      clientInfo: {
        name: 'AgenticCoder',
        version: '1.0.0',
      },
    };

    const response = await this.sendRequest<MCPInitializeResult>(
      'initialize',
      params,
      INIT_TIMEOUT_MS
    );

    this.serverCapabilities = response;
    this.logger.debug('Server initialized', { 
      serverInfo: response.serverInfo,
      capabilities: response.capabilities,
    });

    // Send initialized notification
    await this.sendNotification('notifications/initialized', {});
  }

  /**
   * Fetch available tools from server
   */
  private async fetchTools(): Promise<void> {
    try {
      const response = await this.sendRequest<MCPToolsListResult>(
        'tools/list',
        {},
        DEFAULT_TIMEOUT_MS
      );
      this.tools = response.tools || [];
    } catch (error) {
      this.logger.warn('Failed to fetch tools list', { error: (error as Error).message });
      this.tools = [];
    }
  }

  /**
   * Disconnect by terminating the process
   */
  async disconnect(): Promise<void> {
    if (!this.process) {
      this.setStatus('disconnected', 'Already disconnected');
      return;
    }

    this.logger.debug('Disconnecting...');

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Transport disconnected'));
    }
    this.pendingRequests.clear();

    // Send shutdown notification
    try {
      await this.sendNotification('notifications/cancelled', { reason: 'shutdown' });
    } catch {
      // Ignore errors during shutdown
    }

    await this.cleanup();
    this.setStatus('disconnected', 'Manual disconnect');
  }

  /**
   * Cleanup process resources
   */
  private async cleanup(): Promise<void> {
    if (!this.process) return;

    const proc = this.process;
    this.process = null;

    // Try graceful kill first
    proc.kill('SIGTERM');
    
    // Force kill after timeout
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
        resolve();
      }, 3000);

      proc.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    this.buffer = '';
    this.tools = [];
    this.serverCapabilities = null;
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool<T = unknown>(request: ToolCallRequest): Promise<ToolCallResponse<T>> {
    const startTime = Date.now();
    const correlationId = request.correlationId || this.generateCorrelationId();
    const timeout = request.timeout || DEFAULT_TIMEOUT_MS;

    if (!this.isConnected()) {
      return {
        success: false,
        error: {
          code: 'NOT_CONNECTED',
          message: 'Transport not connected',
          retryable: true,
        },
        duration: 0,
        correlationId,
      };
    }

    this.logger.debug(`Calling tool: ${request.toolName}`, {
      correlationId,
      arguments: request.arguments,
    });

    try {
      const response = await this.sendRequest<MCPToolCallResult>(
        'tools/call',
        {
          name: request.toolName,
          arguments: request.arguments,
        },
        timeout
      );

      const duration = Date.now() - startTime;

      // Check for tool-level error
      if (response.isError) {
        const errorContent = response.content?.[0];
        const errorMessage = errorContent?.type === 'text' 
          ? errorContent.text 
          : 'Tool execution failed';

        return {
          success: false,
          error: {
            code: 'TOOL_ERROR',
            message: errorMessage,
            retryable: false,
          },
          duration,
          correlationId,
        };
      }

      // Extract result data
      const resultContent = response.content?.[0];
      let data: T | undefined;

      if (resultContent?.type === 'text') {
        try {
          data = JSON.parse(resultContent.text) as T;
        } catch {
          data = resultContent.text as unknown as T;
        }
      } else if (resultContent) {
        data = resultContent as unknown as T;
      }

      this.logger.debug(`Tool call completed: ${request.toolName}`, {
        correlationId,
        duration,
        success: true,
      });

      return {
        success: true,
        data,
        duration,
        correlationId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = (error as Error).message;
      
      this.logger.error(`Tool call failed: ${request.toolName}`, {
        correlationId,
        duration,
        error: errorMessage,
      });

      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: errorMessage,
          retryable: this.isRetryableErrorCode(errorMessage),
        },
        duration,
        correlationId,
      };
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<MCPToolInfo[]> {
    if (!this.isConnected()) {
      return [];
    }
    return this.tools;
  }

  /**
   * Ping the server
   */
  async ping(): Promise<number> {
    const startTime = Date.now();
    
    try {
      await this.sendRequest('ping', {}, 5000);
      return Date.now() - startTime;
    } catch {
      // If ping not supported, try listing tools
      try {
        await this.sendRequest('tools/list', {}, 5000);
        return Date.now() - startTime;
      } catch {
        throw new Error('Server not responding');
      }
    }
  }

  /**
   * Get server capabilities
   */
  getServerCapabilities(): MCPInitializeResult | null {
    return this.serverCapabilities;
  }

  /**
   * Handle stdout data
   */
  private handleStdout(data: Buffer): void {
    this.buffer += data.toString();

    // Process complete JSON-RPC messages
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.substring(0, newlineIndex).trim();
      this.buffer = this.buffer.substring(newlineIndex + 1);

      if (line) {
        this.processMessage(line);
      }
    }
  }

  /**
   * Process a JSON-RPC message
   */
  private processMessage(line: string): void {
    try {
      const message = JSON.parse(line);

      // Check if it's a response
      if ('id' in message && message.id !== null) {
        const response = message as JsonRpcResponse;
        const pending = this.pendingRequests.get(String(response.id));
        
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(String(response.id));
          pending.resolve(response);
        } else {
          this.logger.warn(`Received response for unknown request: ${response.id}`);
        }
      } else if ('method' in message) {
        // It's a notification or request from server
        this.handleServerMessage(message);
      }
    } catch (error) {
      this.logger.error(`Failed to parse message: ${line}`, {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Handle messages from server (notifications, requests)
   */
  private handleServerMessage(message: { method: string; params?: unknown }): void {
    this.logger.debug(`Received server message: ${message.method}`);
    this.emit('message', message);
  }

  /**
   * Handle process exit
   */
  private handleProcessExit(code: number | null, signal: NodeJS.Signals | null): void {
    this.logger.info(`Process exited`, { code, signal });
    
    // Reject all pending requests
    const error = new Error(`Process exited with code ${code}, signal ${signal}`);
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();

    this.process = null;
    this.setStatus('disconnected', `Process exited (code: ${code}, signal: ${signal})`);
  }

  /**
   * Handle process error
   */
  private handleProcessError(error: Error): void {
    this.logger.error(`Process error: ${error.message}`);
    this.setStatus('error', error.message);
    this.emit('error', error);
  }

  /**
   * Send a JSON-RPC request
   */
  private async sendRequest<T>(
    method: string,
    params: unknown,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<T> {
    if (!this.process?.stdin?.writable) {
      throw new ConnectionError(this.serverDefinition.id, 'Process stdin not writable');
    }

    const id = String(++this.requestId);
    
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new TimeoutError(method, timeoutMs));
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (response: JsonRpcResponse) => {
          if (response.error) {
            reject(new ProtocolError(
              response.error.message,
              { code: response.error.code, data: response.error.data }
            ));
          } else {
            resolve(response.result as T);
          }
        },
        reject,
        timeout,
        startTime: Date.now(),
        method,
      });

      const message = JSON.stringify(request) + '\n';
      this.process!.stdin!.write(message);
      
      this.logger.debug(`Sent request: ${method}`, { id, params });
    });
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   */
  private async sendNotification(method: string, params: unknown): Promise<void> {
    if (!this.process?.stdin?.writable) {
      return;
    }

    const notification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    const message = JSON.stringify(notification) + '\n';
    this.process.stdin.write(message);
    
    this.logger.debug(`Sent notification: ${method}`);
  }
}

/**
 * Factory function to create StdioTransport
 */
export function createStdioTransport(serverDefinition: MCPServerDefinition): StdioTransport {
  return new StdioTransport(serverDefinition);
}
