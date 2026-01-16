import test from 'node:test';
import assert from 'node:assert/strict';

import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

import { loadScenarioFromFile, runScenario } from '../scenarios/runScenario.js';

test('S01 scenario (Azure MCP schema-strict)', async (t) => {
  const enable = (process.env.AGENTICCODER_TEST_AZURE_MCP_SCHEMA || '').toLowerCase();
  if (!(enable === '1' || enable === 'true')) {
    t.skip('Set AGENTICCODER_TEST_AZURE_MCP_SCHEMA=1 to run (requires npx + @azure/mcp)');
    return;
  }

  // Preflight: ensure we can launch the Azure MCP Server.
  const azureMcpCommand =
    process.env.AGENTICCODER_AZURE_MCP_COMMAND || 'npx';
  const probe = spawnSync(azureMcpCommand, ['--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32'
  });
  if (probe.error && probe.error.code === 'ENOENT') {
    t.skip(
      `Azure MCP launcher not found (${azureMcpCommand}). ` +
        `Set AGENTICCODER_AZURE_MCP_COMMAND to an absolute path (e.g. C:\\...\\npx.cmd).`
    );
    return;
  }

  const prevTransport = process.env.AGENTICCODER_TOOL_TRANSPORT;
  const prevStrict = process.env.AGENTICCODER_BICEP_SCHEMA_STRICT;
  const prevEnableAzureMcp = process.env.AGENTICCODER_ENABLE_AZURE_MCP;
  const prevAzureMcpCommand = process.env.AGENTICCODER_AZURE_MCP_COMMAND;
  const prevAzureMcpDisableElicitation = process.env.AGENTICCODER_AZURE_MCP_DISABLE_ELICITATION;
  const prevAzureMcpDebug = process.env.AGENTICCODER_AZURE_MCP_DEBUG;
  const prevMcpTimeout = process.env.AGENTICCODER_MCP_STDIO_TIMEOUT_MS;
  const prevPlannerTimeout = process.env.AGENTICCODER_DEPLOYMENT_PLANNER_TIMEOUT_MS;
  const prevAzureMcpSupportLogDir = process.env.AGENTICCODER_AZURE_MCP_SUPPORT_LOG_DIR;

  process.env.AGENTICCODER_TOOL_TRANSPORT = 'mcp';
  process.env.AGENTICCODER_BICEP_SCHEMA_STRICT = '1';
  process.env.AGENTICCODER_ENABLE_AZURE_MCP = '1';
  process.env.AGENTICCODER_AZURE_MCP_COMMAND = azureMcpCommand;
  process.env.AGENTICCODER_AZURE_MCP_DISABLE_ELICITATION = '1';
  process.env.AGENTICCODER_AZURE_MCP_DEBUG = process.env.AGENTICCODER_AZURE_MCP_DEBUG || '1';
  process.env.AGENTICCODER_MCP_STDIO_TIMEOUT_MS = process.env.AGENTICCODER_MCP_STDIO_TIMEOUT_MS || '120000';
  process.env.AGENTICCODER_DEPLOYMENT_PLANNER_TIMEOUT_MS =
    process.env.AGENTICCODER_DEPLOYMENT_PLANNER_TIMEOUT_MS || '180000';

  const outDir = await mkdtemp(path.join(tmpdir(), 'agenticcoder-s01-mcp-'));

  // Write Azure MCP support logs next to the scenario outputs for troubleshooting.
  process.env.AGENTICCODER_AZURE_MCP_SUPPORT_LOG_DIR = outDir;

  const originalNow = Date.now;
  const originalRandom = Math.random;
  Date.now = () => 1700000000000;
  Math.random = () => 0.123456789;

  try {
    const scenarioPath = path.resolve(process.cwd(), '..', 'test-data', 'S01-simple-app-service.json');
    const scenario = await loadScenarioFromFile(scenarioPath);

    const result = await runScenario({ scenario, scenarioPath, outDir, offline: true });
    assert.equal(result.status, 'completed');

    const template = await readFile(path.join(outDir, 'template.bicep'), 'utf8');
    assert.match(template, /Microsoft\.Web\/serverfarms/);
    assert.match(template, /Microsoft\.Web\/sites/);
    assert.match(template, /Microsoft\.Storage\/storageAccounts/);
    assert.match(template, /Microsoft\.Insights\/components/);

    const resources = JSON.parse(await fs.readFile(path.join(outDir, 'resources.json'), 'utf8'));
    const resourceTypes = new Set(resources.map((r) => r.type));
    for (const t of scenario.expectations.resourceTypes) {
      assert.ok(resourceTypes.has(t), `Expected resources to include type ${t}`);
    }
  } finally {
    Date.now = originalNow;
    Math.random = originalRandom;
    process.env.AGENTICCODER_TOOL_TRANSPORT = prevTransport;
    process.env.AGENTICCODER_BICEP_SCHEMA_STRICT = prevStrict;
    process.env.AGENTICCODER_ENABLE_AZURE_MCP = prevEnableAzureMcp;
    process.env.AGENTICCODER_AZURE_MCP_COMMAND = prevAzureMcpCommand;
    process.env.AGENTICCODER_AZURE_MCP_DISABLE_ELICITATION = prevAzureMcpDisableElicitation;
    process.env.AGENTICCODER_AZURE_MCP_DEBUG = prevAzureMcpDebug;
    process.env.AGENTICCODER_MCP_STDIO_TIMEOUT_MS = prevMcpTimeout;
    process.env.AGENTICCODER_DEPLOYMENT_PLANNER_TIMEOUT_MS = prevPlannerTimeout;
    process.env.AGENTICCODER_AZURE_MCP_SUPPORT_LOG_DIR = prevAzureMcpSupportLogDir;
    await rm(outDir, { recursive: true, force: true });
  }
});
