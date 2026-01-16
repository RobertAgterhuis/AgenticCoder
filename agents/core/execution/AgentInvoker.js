/**
 * AgentInvoker (EB-03)
 * Invokes agents using the selected transport method.
 * 
 * Supports:
 * - Webhook/API: HTTP POST to endpoint
 * - Process: Spawn subprocess
 * - Docker: Run container
 * - MCP-Stdio: JSON-RPC over stdio
 */

import { spawn, execSync } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

const INVOCATION_TIMEOUT_ERROR = 'INVOCATION_TIMEOUT';
const INVOCATION_ERROR = 'INVOCATION_ERROR';

export class AgentInvoker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.toolClientFactory = options.toolClientFactory || null;
  }

  /**
   * Invoke an agent with the given context and transport
   * @param {object} transport - Transport configuration from TransportSelector
   * @param {object} context - ExecutionContext instance
   * @returns {object} InvocationResult
   */
  async invoke(transport, context) {
    const startTime = Date.now();
    
    this.emit('invocation-start', {
      execution_id: context.execution_id,
      agent: context.agent,
      transport: transport.type
    });

    let result;
    
    try {
      switch (transport.type) {
        case 'webhook':
        case 'api':
          result = await this._invokeViaWebhook(transport.config, context);
          break;
          
        case 'process':
          result = await this._invokeViaProcess(transport.config, context);
          break;
          
        case 'docker':
          result = await this._invokeViaDocker(transport.config, context);
          break;
          
        case 'mcp-stdio':
          result = await this._invokeViaMcpStdio(transport.config, context);
          break;
          
        default:
          throw new Error(`Unsupported transport type: ${transport.type}`);
      }
      
      result.duration_ms = Date.now() - startTime;
      
      this.emit('invocation-complete', {
        execution_id: context.execution_id,
        agent: context.agent,
        status: result.ok ? 'success' : 'failure',
        duration_ms: result.duration_ms
      });
      
    } catch (error) {
      result = {
        ok: false,
        status: 500,
        stdout: '',
        stderr: error.message,
        exit_code: -1,
        error: error.message,
        error_type: error.name === 'AbortError' ? INVOCATION_TIMEOUT_ERROR : INVOCATION_ERROR,
        duration_ms: Date.now() - startTime
      };
      
      this.emit('invocation-error', {
        execution_id: context.execution_id,
        agent: context.agent,
        error: error.message
      });
    }

    return result;
  }

  /**
   * Invoke agent via HTTP webhook
   */
  async _invokeViaWebhook(config, context) {
    const { endpoint, timeout_ms, headers, method, retries } = config;
    const timeoutMs = timeout_ms || context.getTimeoutMs();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let lastError = null;
    const maxAttempts = (retries || 0) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: JSON.stringify(context.packageInputs()),
          signal: controller.signal
        });

        const responseText = await response.text();
        
        // Try to parse as JSON
        let responseJson = {};
        try {
          responseJson = JSON.parse(responseText);
        } catch {
          responseJson = { raw: responseText };
        }

        return {
          ok: response.ok,
          status: response.status,
          stdout: responseJson.stdout || responseText,
          stderr: responseJson.stderr || '',
          artifact: responseJson.artifact || responseJson.result,
          logs: responseJson.logs || [],
          exit_code: response.ok ? 0 : 1
        };

      } catch (error) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          return {
            ok: false,
            status: 504,
            stdout: '',
            stderr: 'Request timeout',
            exit_code: -1,
            error_type: INVOCATION_TIMEOUT_ERROR
          };
        }

        // Retry on network errors
        if (attempt < maxAttempts) {
          const delay = config.retry_delay_ms || 1000;
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return {
      ok: false,
      status: 500,
      stdout: '',
      stderr: lastError?.message || 'Unknown error',
      exit_code: -1,
      error_type: INVOCATION_ERROR
    };
  }

  /**
   * Invoke agent via subprocess
   */
  async _invokeViaProcess(config, context) {
    const { command, args, cwd, timeout_ms, shell } = config;
    const timeoutMs = timeout_ms || context.getTimeoutMs();

    // Parse command if it's a string with arguments
    let cmd = command;
    let cmdArgs = args || [];
    
    if (typeof command === 'string' && command.includes(' ') && !args?.length) {
      const parts = command.split(' ');
      cmd = parts[0];
      cmdArgs = parts.slice(1);
    }

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      const childProcess = spawn(cmd, cmdArgs, {
        cwd: cwd || context.paths.project_root,
        env: { ...process.env, ...context.getEnvironment() },
        shell: shell ?? false,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Setup timeout
      const timeoutId = setTimeout(() => {
        killed = true;
        this._killProcess(childProcess);
        resolve({
          ok: false,
          status: 504,
          stdout,
          stderr: 'Process timeout',
          exit_code: -1,
          error_type: INVOCATION_TIMEOUT_ERROR
        });
      }, timeoutMs);

      // Write input to stdin
      const inputJson = JSON.stringify(context.packageInputs());
      childProcess.stdin.write(inputJson);
      childProcess.stdin.end();

      // Collect output
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        this.emit('stdout', { execution_id: context.execution_id, data: data.toString() });
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        this.emit('stderr', { execution_id: context.execution_id, data: data.toString() });
      });

      childProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        if (!killed) {
          resolve({
            ok: false,
            status: 500,
            stdout,
            stderr: error.message,
            exit_code: -1,
            error_type: INVOCATION_ERROR
          });
        }
      });

      childProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        if (!killed) {
          // Try to extract artifact from stdout
          let artifact = null;
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.artifact) {
              artifact = parsed.artifact;
            } else if (parsed && typeof parsed === 'object') {
              artifact = parsed;
            }
          } catch {
            // stdout is not JSON, that's fine
          }

          resolve({
            ok: code === 0,
            status: code === 0 ? 200 : 500,
            stdout,
            stderr,
            artifact,
            exit_code: code
          });
        }
      });
    });
  }

  /**
   * Invoke agent via Docker container
   */
  async _invokeViaDocker(config, context) {
    const { 
      image, 
      command, 
      volumes, 
      env, 
      timeout_ms, 
      memory_limit, 
      cpu_limit, 
      network,
      remove_after 
    } = config;
    
    const timeoutMs = timeout_ms || context.getTimeoutMs();

    // Build docker run command
    const dockerArgs = ['run'];
    
    // Auto-remove container after execution
    if (remove_after !== false) {
      dockerArgs.push('--rm');
    }

    // Resource limits
    if (memory_limit) {
      dockerArgs.push('--memory', memory_limit);
    }
    if (cpu_limit) {
      dockerArgs.push('--cpus', cpu_limit);
    }

    // Network isolation
    if (network) {
      dockerArgs.push('--network', network);
    }

    // Environment variables
    const allEnv = { ...context.getEnvironment(), ...env };
    for (const [key, value] of Object.entries(allEnv)) {
      dockerArgs.push('-e', `${key}=${value}`);
    }

    // Volume mounts
    for (const volume of volumes || []) {
      dockerArgs.push('-v', volume);
    }

    // Mount artifact directory
    dockerArgs.push('-v', `${context.paths.artifact_dir}:/artifacts`);

    // Pass input via stdin
    dockerArgs.push('-i');

    // Image
    dockerArgs.push(image);

    // Command (if specified)
    if (command) {
      if (Array.isArray(command)) {
        dockerArgs.push(...command);
      } else {
        dockerArgs.push(command);
      }
    }

    // Use process invocation for docker
    return this._invokeViaProcess({
      command: 'docker',
      args: dockerArgs,
      timeout_ms: timeoutMs,
      shell: false
    }, context);
  }

  /**
   * Invoke agent via MCP stdio protocol
   */
  async _invokeViaMcpStdio(config, context) {
    // If we have a ToolClientFactory, use it for proper MCP protocol handling
    if (this.toolClientFactory) {
      const client = this.toolClientFactory.create({
        ...config,
        transport: 'mcp-stdio'
      });

      try {
        await client.connect();
        
        const result = await client.call('tools/call', {
          name: context.agent,
          arguments: context.packageInputs()
        });

        await client.disconnect();

        return {
          ok: true,
          status: 200,
          stdout: JSON.stringify(result),
          stderr: '',
          artifact: result,
          exit_code: 0
        };

      } catch (error) {
        try {
          await client.disconnect();
        } catch {
          // Ignore disconnect errors
        }

        return {
          ok: false,
          status: 500,
          stdout: '',
          stderr: error.message,
          exit_code: -1,
          error_type: INVOCATION_ERROR
        };
      }
    }

    // Fallback to process invocation with MCP-style stdin/stdout
    return this._invokeViaProcess({
      ...config,
      shell: false
    }, context);
  }

  /**
   * Kill a child process (platform-aware)
   */
  _killProcess(childProcess) {
    if (!childProcess || !childProcess.pid) return;

    try {
      if (process.platform === 'win32') {
        // On Windows, kill the entire process tree
        try {
          execSync(`taskkill /PID ${childProcess.pid} /T /F`, { 
            stdio: 'ignore',
            windowsHide: true 
          });
        } catch {
          // Ignore errors
        }
      } else {
        // On Unix, send SIGTERM then SIGKILL
        childProcess.kill('SIGTERM');
        setTimeout(() => {
          try {
            childProcess.kill('SIGKILL');
          } catch {
            // Ignore if already dead
          }
        }, 1000);
      }
    } catch {
      // Ignore kill errors
    }
  }
}

export { INVOCATION_TIMEOUT_ERROR, INVOCATION_ERROR };
