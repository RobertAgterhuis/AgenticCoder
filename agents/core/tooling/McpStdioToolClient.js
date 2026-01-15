/**
 * McpStdioToolClient
 * Minimal MCP JSON-RPC client over stdio (Content-Length framing).
 *
 * This is introduced as an optional transport for safe migration.
 * Default remains HTTP.
 */
import { spawn } from 'child_process';
import { ToolClient } from './ToolClient.js';

function encodeJsonRpcFrame(payload) {
  const json = JSON.stringify(payload);
  const byteLength = Buffer.byteLength(json, 'utf8');
  return `Content-Length: ${byteLength}\r\n\r\n${json}`;
}

class McpFrameParser {
  constructor(onMessage) {
    this._buffer = Buffer.alloc(0);
    this._onMessage = onMessage;
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
          // Ignore.
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

    this._proc = null;
    this._parser = null;
    this._nextId = 1;
    this._pending = new Map();
    this._initialized = false;
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

    try {
      proc.kill();
    } catch {
      // ignore
    }
  }

  async _ensureProcess() {
    if (this._proc) return;
    if (!this.command) {
      throw new Error(`MCP stdio client for '${this.name}' requires 'command' in config`);
    }

    const proc = spawn(this.command, this.args, {
      cwd: this.cwd,
      env: { ...process.env, ...(this.env || {}) },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this._proc = proc;

    this._parser = new McpFrameParser((msg) => this._handleMessage(msg));

    proc.stdout.on('data', (chunk) => this._parser.push(chunk));

    proc.stderr.on('data', (chunk) => {
      // MCP servers may emit logs on stderr; keep it non-fatal.
      // Consumers can opt-in to capturing this externally.
      void chunk;
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
    } catch {
      // Ignore and continue; not all servers will implement initialize during migration.
    }

    this._initialized = true;
  }

  _request(method, params) {
    const id = this._nextId++;

    const payload = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    const frame = encodeJsonRpcFrame(payload);

    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject });
      this._proc.stdin.write(frame, 'utf8');
    });
  }

  _handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    if (Object.prototype.hasOwnProperty.call(msg, 'id')) {
      const pending = this._pending.get(msg.id);
      if (!pending) return;
      this._pending.delete(msg.id);

      if (msg.error) {
        pending.reject(new Error(msg.error.message || 'MCP error'));
      } else {
        pending.resolve(msg.result);
      }
    }
  }
}
