import { describe, it } from 'node:test';
import assert from 'node:assert';

import { McpStdioToolClient } from '../core/tooling/McpStdioToolClient.js';

const DUMMY_MCP_SERVER = String.raw`
let buffer = Buffer.alloc(0);

function send(obj) {
  const json = JSON.stringify(obj);
  const len = Buffer.byteLength(json, 'utf8');
  process.stdout.write('Content-Length: ' + len + '\r\n\r\n' + json);
}

function handle(msg) {
  if (!msg || typeof msg !== 'object') return;

  const id = msg.id;
  const method = msg.method;
  const params = msg.params || {};

  if (method === 'initialize') {
    return send({ jsonrpc: '2.0', id, result: { serverInfo: { name: 'dummy-mcp', version: '0.0.0' }, capabilities: {} } });
  }

  if (method === 'ping') {
    return send({ jsonrpc: '2.0', id, result: { pong: true } });
  }

  if (method === 'tools/list') {
    return send({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'echo',
            description: 'Echo args back',
            inputSchema: { type: 'object' }
          }
        ]
      }
    });
  }

  if (method === 'tools/call') {
    return send({
      jsonrpc: '2.0',
      id,
      result: {
        name: params.name,
        arguments: params.arguments
      }
    });
  }

  return send({ jsonrpc: '2.0', id, result: { ok: true, method, params } });
}

process.stdin.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;

    const headerText = buffer.slice(0, headerEnd).toString('utf8');
    const match = headerText.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const contentLength = Number.parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + contentLength;
    if (buffer.length < bodyEnd) break;

    const body = buffer.slice(bodyStart, bodyEnd).toString('utf8');
    buffer = buffer.slice(bodyEnd);

    try {
      handle(JSON.parse(body));
    } catch {
      // ignore
    }
  }
});

process.stdin.resume();
`;

describe('McpStdioToolClient', () => {
  it('connects, initializes, and healthChecks', async () => {
    const client = new McpStdioToolClient({
      name: 'dummy',
      command: process.execPath,
      args: ['-e', DUMMY_MCP_SERVER]
    });

    try {
      await client.connect();
      const ok = await client.healthCheck();
      assert.strictEqual(ok, true);
    } finally {
      await client.disconnect();
    }
  });

  it('supports tools/list and tools/call compatibility helpers', async () => {
    const client = new McpStdioToolClient({
      name: 'dummy',
      command: process.execPath,
      args: ['-e', DUMMY_MCP_SERVER]
    });

    try {
      await client.connect();

      const list = await client.call('tools/list', {});
      assert.ok(Array.isArray(list.tools));
      assert.strictEqual(list.tools[0].name, 'echo');

      const result = await client.call('tools/call', { name: 'echo', arguments: { a: 1 } });
      assert.deepStrictEqual(result, { name: 'echo', arguments: { a: 1 } });
    } finally {
      await client.disconnect();
    }
  });
});
