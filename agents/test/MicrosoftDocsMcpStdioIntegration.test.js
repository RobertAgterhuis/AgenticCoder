import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { spawn } from 'node:child_process';

import { McpStdioToolClient } from '../core/tooling/McpStdioToolClient.js';

function runProcess(command, args, options = {}) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    const timeoutMs = options.timeoutMs ?? 5000;
    const timeout = setTimeout(() => {
      try {
        proc.kill();
      } catch {
        // ignore
      }
    }, timeoutMs);

    proc.stdout.on('data', (d) => {
      stdout += d.toString('utf8');
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString('utf8');
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
  });
}

describe('microsoft-docs MCP (stdio) integration', () => {
  it('spawns the real python server and supports ping + tools/list', async (t) => {
    const python = process.env.AGENTICCODER_PYTHON || 'python';

    const repoRoot = path.resolve(process.cwd(), '..');
    const cwd = path.join(repoRoot, '.github', 'mcp', 'microsoft-docs-mcp');

    // Skip cleanly if python isn't available or module can't be imported.
    const probe = await runProcess(python, ['-c', 'import microsoft_docs_mcp; print("ok")'], {
      cwd,
      timeoutMs: 5000
    });

    if (probe.code !== 0) {
      t.skip(
        `Python microsoft docs MCP not available (code=${probe.code}). ` +
          `Set AGENTICCODER_PYTHON or ensure repo checkout is intact.`
      );
      return;
    }

    const client = new McpStdioToolClient({
      name: 'microsoft-docs-stdio-integration',
      command: python,
      args: ['-m', 'microsoft_docs_mcp', 'mcp'],
      cwd
    });

    try {
      await client.connect();

      const tools = await client.call('tools/list', {});
      assert.ok(tools && Array.isArray(tools.tools));
      const toolNames = tools.tools.map((tool) => tool.name);
      assert.ok(toolNames.includes('search'));

      const ping = await client.call('ping', {});
      assert.deepStrictEqual(ping, { status: 'ok', service: 'microsoft-docs-mcp' });
    } finally {
      await client.disconnect();
    }
  });
});
