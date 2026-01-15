import { describe, it } from 'node:test';
import assert from 'node:assert';

import { ToolClientFactory } from '../core/tooling/ToolClientFactory.js';
import { HttpToolClient } from '../core/tooling/HttpToolClient.js';
import { McpStdioToolClient } from '../core/tooling/McpStdioToolClient.js';

describe('ToolClientFactory', () => {
  it('defaults to HTTP when no transport requested', async () => {
    const prev = process.env.AGENTICCODER_TOOL_TRANSPORT;
    try {
      delete process.env.AGENTICCODER_TOOL_TRANSPORT;

      const client = ToolClientFactory.create({
        name: 'test-http',
        endpoint: 'http://localhost:9999'
      });

      assert.ok(client instanceof HttpToolClient);
      assert.ok(!(client instanceof McpStdioToolClient));
    } finally {
      if (prev === undefined) delete process.env.AGENTICCODER_TOOL_TRANSPORT;
      else process.env.AGENTICCODER_TOOL_TRANSPORT = prev;
    }
  });

  it('selects MCP stdio when transport env requests it', async () => {
    const prev = process.env.AGENTICCODER_TOOL_TRANSPORT;
    try {
      process.env.AGENTICCODER_TOOL_TRANSPORT = 'mcp-stdio';

      const client = ToolClientFactory.create({
        name: 'test-mcp',
        command: process.execPath,
        args: ['-e', 'process.stdin.resume()']
      });

      assert.ok(client instanceof McpStdioToolClient);
    } finally {
      if (prev === undefined) delete process.env.AGENTICCODER_TOOL_TRANSPORT;
      else process.env.AGENTICCODER_TOOL_TRANSPORT = prev;
    }
  });

  it('selects MCP stdio when config includes a command', async () => {
    const prev = process.env.AGENTICCODER_TOOL_TRANSPORT;
    try {
      delete process.env.AGENTICCODER_TOOL_TRANSPORT;

      const client = ToolClientFactory.create({
        name: 'test-mcp',
        command: process.execPath,
        args: ['-e', 'process.stdin.resume()']
      });

      assert.ok(client instanceof McpStdioToolClient);
    } finally {
      if (prev === undefined) delete process.env.AGENTICCODER_TOOL_TRANSPORT;
      else process.env.AGENTICCODER_TOOL_TRANSPORT = prev;
    }
  });
});
