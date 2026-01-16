/**
 * McpStdioToolClient
 * Minimal MCP JSON-RPC client over stdio (Content-Length framing).
 *
 * @deprecated This module is deprecated. Use the new TypeScript MCP infrastructure instead:
 * 
 * ```javascript
 * // New approach using MCPBridge
 * const { MCPBridge } = require('./src/mcp/bridge');
 * const bridge = new MCPBridge({ workspaceFolder: process.cwd() });
 * await bridge.initialize();
 * const result = await bridge.callTool('azure-pricing-mcp', 'price_search', { sku: 'Standard_B1s' });
 * ```
 * 
 * The new infrastructure provides:
 * - StdioTransport with proper MCP protocol support
 * - Circuit breaker pattern for fault tolerance
 * - Retry policies with exponential backoff
 * - Connection pooling
 * - Health monitoring
 * 
 * This class will be removed in a future version.
 */
import { spawn } from 'child_process';
import { ToolClient } from './ToolClient.js';

function encodeJsonRpcFrame(payload, framing = 'content-length') {
  const json = JSON.stringify(payload);

  // Some MCP stdio servers (including Azure MCP Server) use newline-delimited JSON.
  if (framing === 'ndjson') {
    return `${json}\n`;
  }

  // Default: Content-Length framing.
  const byteLength = Buffer.byteLength(json, 'utf8');
  return `Content-Length: ${byteLength}\r\n\r\n${json}`;
}

class McpFrameParser {
  constructor(onMessage, onNonJsonLine) {
    this._buffer = Buffer.alloc(0);
    this._onMessage = onMessage;
    this._onNonJsonLine = onNonJsonLine;
  }

  push(chunk) {
    this._buffer = Buffer.concat([this._buffer, chunk]);

    // Prefer Content-Length framing.
    while (true) {
      const headerEnd = this._buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const headerText = this._buffer.slice(0, headerEnd).toString('utf8');
      const match = headerText.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        // Not MCP framing; fall back to newline-delimited JSON.
        break;
      }

      const contentLength = Number.parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + contentLength;
      if (this._buffer.length < bodyEnd) break;

      const body = this._buffer.slice(bodyStart, bodyEnd).toString('utf8');
      this._buffer = this._buffer.slice(bodyEnd);

      try {
        const msg = JSON.parse(body);
        this._onMessage(msg);
      } catch {
        // Ignore malformed payloads.
      }
    }

    // Newline-delimited fallback (best-effort).
    const asText = this._buffer.toString('utf8');
    if (asText.includes('\n')) {
      const lines = asText.split(/\r?\n/);
      const remainder = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          this._onMessage(msg);
        } catch {
          // Ignore non-JSON lines, but allow callers to capture them for diagnostics.
          try {
            this._onNonJsonLine?.(trimmed);
          } catch {
            // ignore
          }
        }
      }

      this._buffer = Buffer.from(remainder ?? '', 'utf8');
    }
  }
}

export class McpStdioToolClient extends ToolClient {
  constructor(config) {
    super(config);

    this.command = config.command;
    this.args = config.args || [];
    this.cwd = config.cwd;
    this.env = config.env;
    this.shell = config.shell;
    this.framing = (config.framing || 'content-length').toLowerCase();

    this._proc = null;
    this._parser = null;
    this._nextId = 1;
    this._pending = new Map();
    this._initialized = false;

    // Diagnostics: keep recent stderr + non-framed stdout lines to help debug startup/auth/elicitation issues.
    this._stderrTail = [];
    this._stderrTailBytes = 0;
    this._stdoutTail = [];
    this._stdoutTailBytes = 0;
    this._maxTailBytes = 24 * 1024;

    const envTimeout = Number.parseInt(process.env.AGENTICCODER_MCP_STDIO_TIMEOUT_MS || '', 10);
    this._timeoutMs =
      Number.isFinite(config.timeoutMs) ? config.timeoutMs : Number.isFinite(envTimeout) ? envTimeout : 15000;
  }

  async connect() {
    await this._ensureProcess();
    await this._initialize();
  }

  async call(method, params = {}) {
    await this._ensureProcess();
    await this._initialize();

    // Compatibility helpers for common MCP tool operations.
    if (method === 'tools/list' || method === '/tools/list') {
      return this._request('tools/list', params);
    }

    if (method === 'tools/call' || method === '/tools/call') {
      const name = params.name;
      const args = params.arguments ?? params.args ?? {};
      return this._request('tools/call', { name, arguments: args });
    }

    // Raw JSON-RPC passthrough.
    const rpcMethod = method.startsWith('/') ? method.slice(1) : method;
    return this._request(rpcMethod, params);
  }

  async healthCheck() {
    try {
      await this.call('ping', {});
      return true;
    } catch {
      return false;
    }
  }

  async disconnect() {
    if (!this._proc) return;

    const proc = this._proc;
    this._proc = null;
    this._initialized = false;

    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      proc.once('exit', finish);

      try {
        proc.stdin?.end?.();
      } catch {
        // ignore
      }

      // Best-effort terminate. On Windows, prefer killing the whole process tree.
      if (process.platform === 'win32' && typeof proc.pid === 'number') {
        try {
          const killer = spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
          try {
            killer.unref();
          } catch {
            // ignore
          }
        } catch {
          // ignore
        }
      } else {
        try {
          proc.kill();
        } catch {
          // ignore
        }
      }

      // Force shutdown if the process doesn't terminate quickly.
      const forceTimer = setTimeout(() => {
        if (process.platform !== 'win32') {
          try {
            proc.kill('SIGKILL');
          } catch {
            // ignore
          }
        }

        try {
          proc.stdout?.destroy?.();
          proc.stderr?.destroy?.();
          proc.stdin?.destroy?.();
        } catch {
          // ignore
        }

        finish();
      }, 1000);

      // Don't keep Node alive just for cleanup timeout.
      try {
        forceTimer.unref?.();
      } catch {
        // ignore
      }
    });
  }

  async _ensureProcess() {
    if (this._proc) return;
    if (!this.command) {
      throw new Error(`MCP stdio client for '${this.name}' requires 'command' in config`);
    }

    const proc = spawn(this.command, this.args, {
      cwd: this.cwd,
      env: { ...process.env, ...(this.env || {}) },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      shell: Boolean(this.shell)
    });

    this._proc = proc;

    this._parser = new McpFrameParser(
      (msg) => this._handleMessage(msg),
      (line) => this._appendStdoutLine(line)
    );

    proc.stdout.on('data', (chunk) => this._parser.push(chunk));

    proc.stderr.on('data', (chunk) => {
      // MCP servers may emit logs on stderr; keep it non-fatal but capture for diagnostics.
      this._appendStderrChunk(chunk);
    });

    proc.on('exit', (code) => {
      const pending = Array.from(this._pending.values());
      this._pending.clear();
      for (const { reject } of pending) {
        reject(new Error(`MCP process exited (${code ?? 'unknown'}) for '${this.name}'`));
      }

      this._initialized = false;
      this._proc = null;
    });
  }

  async _initialize() {
    if (this._initialized) return;

    // MCP initialize handshake (best-effort; some stubs may not implement).
    try {
      await this._request('initialize', {
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'AgenticCoder', version: '2.0.0' }
      });

      // Some MCP servers require an explicit initialized notification before serving tools.
      // Best-effort: no response expected.
      this._notify('notifications/initialized', {});
    } catch {
      // Ignore and continue; not all servers will implement initialize during migration.
      // If initialize times out, callers will likely time out on subsequent requests.
    }

    this._initialized = true;
  }

  _notify(method, params = {}) {
    if (!this._proc) return;
    const payload = {
      jsonrpc: '2.0',
      method,
      params
    };

    try {
      const frame = encodeJsonRpcFrame(payload, this.framing);
      this._proc.stdin.write(frame, 'utf8');
    } catch {
      // ignore
    }
  }

  _request(method, params) {
    const id = this._nextId++;

    const payload = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    const frame = encodeJsonRpcFrame(payload, this.framing);

    return new Promise((resolve, reject) => {
      const timeoutMs = this._timeoutMs;
      const timeout = setTimeout(() => {
        if (!this._pending.has(id)) return;
        this._pending.delete(id);
        const diagnostics = this._formatDiagnostics();
        reject(new Error(`MCP request timeout after ${timeoutMs}ms (${method}) for '${this.name}'${diagnostics}`));
      }, timeoutMs);

      // Don't keep the Node event loop alive just because a child MCP request is pending.
      // This makes test failures exit promptly even if a server never responds.
      try {
        timeout.unref?.();
      } catch {
        // ignore
      }

      const wrappedResolve = (result) => {
        clearTimeout(timeout);
        resolve(result);
      };

      const wrappedReject = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      this._pending.set(id, { resolve: wrappedResolve, reject: wrappedReject });

      try {
        this._proc.stdin.write(frame, 'utf8');
      } catch (error) {
        clearTimeout(timeout);
        this._pending.delete(id);
        reject(error);
      }
    });
  }

  _handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    if (Object.prototype.hasOwnProperty.call(msg, 'id')) {
      const pending = this._pending.get(msg.id);
      if (pending) {
        this._pending.delete(msg.id);

        if (msg.error) {
          pending.reject(new Error(msg.error.message || 'MCP error'));
        } else {
          pending.resolve(msg.result);
        }
        return;
      }

      // Server-to-client request (has id+method, not a response). If we ignore it,
      // some servers will block indefinitely waiting for the response.
      if (typeof msg.method === 'string') {
        this._handleServerRequest(msg);
      }
    }
  }

  _appendStderrChunk(chunk) {
    if (!chunk || chunk.length === 0) return;

    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8');
    this._stderrTail.push(buf);
    this._stderrTailBytes += buf.length;

    while (this._stderrTailBytes > this._maxTailBytes && this._stderrTail.length > 1) {
      const removed = this._stderrTail.shift();
      this._stderrTailBytes -= removed.length;
    }
  }

  _appendStdoutLine(line) {
    if (!line) return;
    const buf = Buffer.from(String(line).slice(0, 2000), 'utf8');
    this._stdoutTail.push(buf);
    this._stdoutTailBytes += buf.length;

    while (this._stdoutTailBytes > this._maxTailBytes && this._stdoutTail.length > 1) {
      const removed = this._stdoutTail.shift();
      this._stdoutTailBytes -= removed.length;
    }
  }

  _formatDiagnostics() {
    const stderr = Buffer.concat(this._stderrTail).toString('utf8').trim();
    const stdout = Buffer.concat(this._stdoutTail).toString('utf8').trim();
    const parts = [];
    if (stderr) parts.push(`\n--- MCP stderr (tail) ---\n${stderr}`);
    if (stdout) parts.push(`\n--- MCP stdout (non-JSON tail) ---\n${stdout}`);
    return parts.length ? `\n${parts.join('\n')}` : '';
  }

  _handleServerRequest(msg) {
    // Minimal server-request handling: reply with JSON-RPC error so the server can continue.
    // This prevents deadlocks when servers use client-side requests (e.g., elicitation).
    const id = msg.id;
    const method = msg.method;

    let error = {
      code: -32601,
      message: `Client does not implement server request '${method}'`
    };

    // If the server is attempting elicitation, it's better to fail fast than hang.
    // For automated runs, prefer starting Azure MCP Server with --insecure-disable-elicitation.
    if (typeof method === 'string' && method.startsWith('elicitation/')) {
      error = {
        code: -32000,
        message: `Elicitation not supported by this client (${method}). Start the server with --insecure-disable-elicitation for non-interactive runs.`
      };
    }

    const payload = {
      jsonrpc: '2.0',
      id,
      error
    };

    try {
      const frame = encodeJsonRpcFrame(payload, this.framing);
      this._proc?.stdin?.write?.(frame, 'utf8');
    } catch {
      // ignore
    }
  }
}
