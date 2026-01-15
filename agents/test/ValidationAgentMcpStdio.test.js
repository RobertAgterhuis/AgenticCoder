import test from 'node:test';
import assert from 'node:assert/strict';

import { ValidationAgent } from '../validation/ValidationAgent.js';

function withEnv(env, fn) {
  const previous = { ...process.env };
  Object.assign(process.env, env);
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      process.env = previous;
    });
}

test('ValidationAgent (MCP stdio) attaches best-effort docs search results', async (t) => {
  await withEnv(
    {
      AGENTICCODER_TOOL_TRANSPORT: 'mcp-stdio'
    },
    async () => {
      const agent = new ValidationAgent();
      await agent.initialize();

      // Intentionally minimal + likely-to-fail config to ensure at least one failing rule.
      // Exact rule set can evolve; test only asserts docs MCP search enrichment exists.
      const input = {
        resources: [
          {
            type: 'Microsoft.Storage/storageAccounts',
            name: 'stor1',
            properties: {
              supportsHttpsTrafficOnly: false
            }
          }
        ],
        complianceFramework: 'cis'
      };

      let result;
      try {
        result = await agent.execute(input, { executionId: 'test-exec' });
      } finally {
        await agent.cleanup();
      }

      assert.ok(result, 'expected result');
      assert.ok(Array.isArray(result.validationResults), 'expected validationResults array');

      // In MCP mode, best-effort docs search should attach when there is a failure.
      const hasFailure = result.validationResults.some((r) => r && r.passed === false);
      if (!hasFailure) {
        t.skip('No failing validation results; cannot assert docs enrichment');
        return;
      }

      assert.ok(result.documentationResults, 'expected documentationResults');
      assert.equal(result.documentationResults.source, 'microsoft-docs-mcp-stdio');
      assert.ok(result.documentationResults.query, 'expected docs query');
      assert.ok(result.documentationResults.result, 'expected docs search result');
    }
  );
});
