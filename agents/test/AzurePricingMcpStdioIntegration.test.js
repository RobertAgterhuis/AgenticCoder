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

describe('azure-pricing MCP (stdio) integration', () => {
  it('spawns the real python server and supports ping + tools/list', async (t) => {
    const python = process.env.AGENTICCODER_PYTHON || 'python';

    // Repo root from agents/...
    const repoRoot = path.resolve(process.cwd(), '..');
    const cwd = path.join(repoRoot, '.github', 'mcp', 'azure-pricing-mcp');

    // Skip cleanly if python and/or deps are not installed.
    const probe = await runProcess(
      python,
      ['-c', 'import azure_pricing_mcp, requests; print("ok")'],
      { cwd, timeoutMs: 5000 }
    );

    if (probe.code !== 0) {
      t.skip(
        `Python pricing MCP not available (code=${probe.code}). ` +
          `Set AGENTICCODER_PYTHON or install .github/mcp/azure-pricing-mcp requirements.`
      );
      return;
    }

    const client = new McpStdioToolClient({
      name: 'azure-pricing-stdio-integration',
      command: python,
      args: ['-m', 'azure_pricing_mcp', 'mcp'],
      cwd,
      env: {
        AZURE_PRICING_TIMEOUT: '10',
        AZURE_PRICING_RETRIES: '1',
        AZURE_PRICING_BACKOFF: '0'
      }
    });

    try {
      await client.connect();

      const tools = await client.call('tools/list', {});
      assert.ok(tools && Array.isArray(tools.tools));
      const toolNames = tools.tools.map((tool) => tool.name);
      assert.ok(toolNames.includes('price_search'));
      assert.ok(toolNames.includes('cost_estimate'));

      const ping = await client.call('ping', {});
      assert.deepStrictEqual(ping, { status: 'ok', service: 'azure-pricing-mcp' });
    } finally {
      await client.disconnect();
    }
  });

  it('optionally calls price_search live via tools/call', async (t) => {
    const enable = (process.env.AGENTICCODER_RUN_LIVE_PRICING_TESTS || '').toLowerCase();
    if (!(enable === '1' || enable === 'true')) {
      t.skip('Set AGENTICCODER_RUN_LIVE_PRICING_TESTS=1 to enable live Azure Retail Prices call');
      return;
    }

    const python = process.env.AGENTICCODER_PYTHON || 'python';

    const repoRoot = path.resolve(process.cwd(), '..');
    const cwd = path.join(repoRoot, '.github', 'mcp', 'azure-pricing-mcp');

    const client = new McpStdioToolClient({
      name: 'azure-pricing-stdio-live',
      command: python,
      args: ['-m', 'azure_pricing_mcp', 'mcp'],
      cwd,
      env: {
        AZURE_PRICING_TIMEOUT: '10',
        AZURE_PRICING_RETRIES: '1',
        AZURE_PRICING_BACKOFF: '0'
      }
    });

    try {
      await client.connect();

      const result = await client.call('tools/call', {
        name: 'price_search',
        arguments: {
          sku: 'D2 v3',
          region: 'westus3',
          currency: 'USD'
        }
      });

      assert.ok(result);
      assert.strictEqual(result.status, 'ok');
      assert.strictEqual(result.tool, 'price_search');
      assert.ok(Array.isArray(result.items));
      assert.ok(result.items.length <= 5);

      if (result.items.length > 0) {
        const item = result.items[0];
        assert.strictEqual(item.currencyCode, 'USD');
        assert.strictEqual(item.armRegionName, 'westus3');
        assert.ok(typeof item.retailPrice === 'number');
      }
    } finally {
      await client.disconnect();
    }
  });
});
