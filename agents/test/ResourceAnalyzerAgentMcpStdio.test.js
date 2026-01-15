import { describe, it } from 'node:test';
import assert from 'node:assert';

import { ResourceAnalyzerAgent } from '../infrastructure/ResourceAnalyzerAgent.js';

describe('ResourceAnalyzerAgent (MCP stdio)', () => {
  it('runs a best-effort tools/call query when MCP transport is enabled', async () => {
    const prevTransport = process.env.AGENTICCODER_TOOL_TRANSPORT;
    try {
      process.env.AGENTICCODER_TOOL_TRANSPORT = 'mcp-stdio';

      const agent = new ResourceAnalyzerAgent();
      await agent.initialize();

      try {
        const result = await agent.execute({
          tasks: [
            {
              id: 't1',
              description: 'Analyze what resources a VM deployment needs',
              type: 'deployment',
              requirements: []
            }
          ],
          constraints: { region: 'eastus' }
        });

        assert.ok(Array.isArray(result.resources));
        assert.ok(result.resourceGraph);

        // In MCP stdio mode, the python stub supports tools/call query.
        assert.ok(result.resourceGraphInventory);
        assert.strictEqual(result.resourceGraphInventory.source, 'azure-resource-graph-mcp-stdio');
        assert.strictEqual(result.resourceGraphInventory.query, 'Resources | limit 1');
        assert.strictEqual(result.resourceGraphInventory.result.status, 'ok');
        assert.strictEqual(result.resourceGraphInventory.result.tool, 'query');
      } finally {
        await agent.cleanup();
      }
    } finally {
      if (prevTransport === undefined) delete process.env.AGENTICCODER_TOOL_TRANSPORT;
      else process.env.AGENTICCODER_TOOL_TRANSPORT = prevTransport;
    }
  });
});
