import { describe, it } from 'node:test';
import assert from 'node:assert';

import { DeploymentPlannerAgent } from '../infrastructure/DeploymentPlannerAgent.js';

describe('DeploymentPlannerAgent (MCP stdio)', () => {
  it('attaches best-effort docs search results when MCP transport is enabled', async () => {
    const prevTransport = process.env.AGENTICCODER_TOOL_TRANSPORT;
    try {
      process.env.AGENTICCODER_TOOL_TRANSPORT = 'mcp-stdio';

      const agent = new DeploymentPlannerAgent();
      await agent.initialize();

      try {
        const result = await agent.execute({
          resources: [
            {
              id: 'r1',
              type: 'Microsoft.Storage/storageAccounts',
              name: 'sttest',
              sku: 'Standard_LRS',
              location: 'eastus',
              properties: {},
              dependencies: []
            }
          ],
          templateFormat: 'bicep',
          deploymentName: 'test-deployment',
          parameterize: false
        });

        assert.ok(typeof result.template === 'string');
        assert.ok(result.parameters);

        assert.ok(result.documentationResults);
        assert.strictEqual(result.documentationResults.source, 'microsoft-docs-mcp-stdio');
        assert.strictEqual(result.documentationResults.query, 'bicep Microsoft.Storage/storageAccounts');
        assert.strictEqual(result.documentationResults.result.status, 'ok');
        assert.strictEqual(result.documentationResults.result.tool, 'search');
        assert.strictEqual(result.documentationResults.result.query, 'bicep Microsoft.Storage/storageAccounts');
        assert.ok(Array.isArray(result.documentationResults.result.results));
      } finally {
        await agent.cleanup();
      }
    } finally {
      if (prevTransport === undefined) delete process.env.AGENTICCODER_TOOL_TRANSPORT;
      else process.env.AGENTICCODER_TOOL_TRANSPORT = prevTransport;
    }
  });
});
