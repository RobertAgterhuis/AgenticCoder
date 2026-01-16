import test from 'node:test';
import assert from 'node:assert/strict';

import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

import { loadScenarioFromFile, runScenario } from '../scenarios/runScenario.js';

/**
 * All available test scenarios with their expected resource types.
 * Each scenario tests different Azure resource combinations.
 */
const SCENARIOS = [
  {
    id: 'S01',
    file: 'S01-simple-app-service.json',
    name: 'App Service + Storage + Insights',
    expectedPatterns: [
      /Microsoft\.Web\/serverfarms/,
      /Microsoft\.Web\/sites/,
      /Microsoft\.Storage\/storageAccounts/,
      /Microsoft\.Insights\/components/
    ]
  },
  {
    id: 'S02',
    file: 'S02-storage-sql.json',
    name: 'Storage + SQL Database',
    expectedPatterns: [
      /Microsoft\.Storage\/storageAccounts/,
      /Microsoft\.Sql\/servers/
    ]
  },
  {
    id: 'S03',
    file: 'S03-cosmosdb-functions.json',
    name: 'CosmosDB + Functions + Key Vault',
    expectedPatterns: [
      /Microsoft\.DocumentDB\/databaseAccounts/,
      /Microsoft\.Web\/sites/,
      /Microsoft\.KeyVault\/vaults/
    ]
  },
  {
    id: 'S04',
    file: 'S04-aks-container.json',
    name: 'AKS + Container Registry',
    expectedPatterns: [
      /Microsoft\.ContainerService\/managedClusters/,
      /Microsoft\.ContainerRegistry\/registries/
    ]
  },
  {
    id: 'S05',
    file: 'S05-vnet-vm.json',
    name: 'VNet + NSG + VM',
    expectedPatterns: [
      /Microsoft\.Network\/virtualNetworks/,
      /Microsoft\.Network\/networkSecurityGroups/,
      /Microsoft\.Compute\/virtualMachines/
    ]
  },
  {
    id: 'S06',
    file: 'S06-openai-redis.json',
    name: 'Azure OpenAI + Redis Cache',
    expectedPatterns: [
      /Microsoft\.CognitiveServices\/accounts/,
      /Microsoft\.Cache\/redis/
    ]
  },
  {
    id: 'S07',
    file: 'S07-servicebus-eventgrid.json',
    name: 'Service Bus + Event Grid',
    expectedPatterns: [
      /Microsoft\.ServiceBus\/namespaces/,
      /Microsoft\.EventGrid\/topics/
    ]
  },
  {
    id: 'S08',
    file: 'S08-synapse-datafactory.json',
    name: 'Synapse + Data Factory',
    expectedPatterns: [
      /Microsoft\.Synapse\/workspaces/,
      /Microsoft\.DataFactory\/factories/
    ]
  },
  {
    id: 'S09',
    file: 'S09-apim-logicapps.json',
    name: 'API Management + Logic Apps',
    expectedPatterns: [
      /Microsoft\.ApiManagement\/service/,
      /Microsoft\.Logic\/workflows/
    ]
  },
  {
    id: 'S10',
    file: 'S10-eventhub-streaming.json',
    name: 'Event Hub + Stream Analytics',
    expectedPatterns: [
      /Microsoft\.EventHub\/namespaces/,
      /Microsoft\.StreamAnalytics\/streamingjobs/
    ]
  },
  {
    id: 'S11',
    file: 'S11-iot-digitaltwins.json',
    name: 'VNet + Key Vault Security',
    expectedPatterns: [
      /Microsoft\.Network\/virtualNetworks/,
      /Microsoft\.KeyVault\/vaults/
    ]
  },
  {
    id: 'S12',
    file: 'S12-search-rag.json',
    name: 'Functions + Blob Storage',
    expectedPatterns: [
      /Microsoft\.Web\/sites/,
      /Microsoft\.Storage\/storageAccounts/
    ]
  },
  {
    id: 'S13',
    file: 'S13-backup-recovery.json',
    name: 'CosmosDB Global Distribution',
    expectedPatterns: [
      /Microsoft\.DocumentDB\/databaseAccounts/
    ]
  },
  {
    id: 'S14',
    file: 'S14-avd-desktop.json',
    name: 'App Gateway + App Service',
    expectedPatterns: [
      /Microsoft\.Network\/applicationGateways/,
      /Microsoft\.Web\/sites/
    ]
  },
  {
    id: 'S15',
    file: 'S15-batch-containers.json',
    name: 'SQL + App Service',
    expectedPatterns: [
      /Microsoft\.Sql\/servers/,
      /Microsoft\.Web\/sites/
    ]
  }
];

/**
 * Helper: Check if Azure MCP test is enabled
 */
function isAzureMcpTestEnabled() {
  const enable = (process.env.AGENTICCODER_TEST_AZURE_MCP_SCHEMA || '').toLowerCase();
  return enable === '1' || enable === 'true';
}

/**
 * Helper: Check if npx/Azure MCP command is available
 */
function checkAzureMcpCommand() {
  const azureMcpCommand = process.env.AGENTICCODER_AZURE_MCP_COMMAND || 'npx';
  const probe = spawnSync(azureMcpCommand, ['--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32'
  });
  
  if (probe.error && probe.error.code === 'ENOENT') {
    return { available: false, command: azureMcpCommand };
  }
  return { available: true, command: azureMcpCommand };
}

/**
 * Helper: Set up environment for Azure MCP testing
 */
function setupAzureMcpEnv(azureMcpCommand) {
  const prev = {
    transport: process.env.AGENTICCODER_TOOL_TRANSPORT,
    strict: process.env.AGENTICCODER_BICEP_SCHEMA_STRICT,
    enableAzureMcp: process.env.AGENTICCODER_ENABLE_AZURE_MCP,
    azureMcpCommand: process.env.AGENTICCODER_AZURE_MCP_COMMAND,
    disableElicitation: process.env.AGENTICCODER_AZURE_MCP_DISABLE_ELICITATION,
    debug: process.env.AGENTICCODER_AZURE_MCP_DEBUG,
    mcpTimeout: process.env.AGENTICCODER_MCP_STDIO_TIMEOUT_MS,
    plannerTimeout: process.env.AGENTICCODER_DEPLOYMENT_PLANNER_TIMEOUT_MS,
    supportLogDir: process.env.AGENTICCODER_AZURE_MCP_SUPPORT_LOG_DIR
  };

  process.env.AGENTICCODER_TOOL_TRANSPORT = 'mcp';
  process.env.AGENTICCODER_BICEP_SCHEMA_STRICT = '1';
  process.env.AGENTICCODER_ENABLE_AZURE_MCP = '1';
  process.env.AGENTICCODER_AZURE_MCP_COMMAND = azureMcpCommand;
  process.env.AGENTICCODER_AZURE_MCP_DISABLE_ELICITATION = '1';
  process.env.AGENTICCODER_AZURE_MCP_DEBUG = process.env.AGENTICCODER_AZURE_MCP_DEBUG || '1';
  process.env.AGENTICCODER_MCP_STDIO_TIMEOUT_MS = 
    process.env.AGENTICCODER_MCP_STDIO_TIMEOUT_MS || '120000';
  process.env.AGENTICCODER_DEPLOYMENT_PLANNER_TIMEOUT_MS =
    process.env.AGENTICCODER_DEPLOYMENT_PLANNER_TIMEOUT_MS || '180000';

  return prev;
}

/**
 * Helper: Restore previous environment
 */
function restoreEnv(prev) {
  process.env.AGENTICCODER_TOOL_TRANSPORT = prev.transport;
  process.env.AGENTICCODER_BICEP_SCHEMA_STRICT = prev.strict;
  process.env.AGENTICCODER_ENABLE_AZURE_MCP = prev.enableAzureMcp;
  process.env.AGENTICCODER_AZURE_MCP_COMMAND = prev.azureMcpCommand;
  process.env.AGENTICCODER_AZURE_MCP_DISABLE_ELICITATION = prev.disableElicitation;
  process.env.AGENTICCODER_AZURE_MCP_DEBUG = prev.debug;
  process.env.AGENTICCODER_MCP_STDIO_TIMEOUT_MS = prev.mcpTimeout;
  process.env.AGENTICCODER_DEPLOYMENT_PLANNER_TIMEOUT_MS = prev.plannerTimeout;
  process.env.AGENTICCODER_AZURE_MCP_SUPPORT_LOG_DIR = prev.supportLogDir;
}

/**
 * Run a single scenario test with Azure MCP schema-strict mode
 */
async function runScenarioTest(t, scenarioConfig) {
  const outDir = await mkdtemp(path.join(tmpdir(), `agenticcoder-${scenarioConfig.id.toLowerCase()}-mcp-`));
  
  // Write Azure MCP support logs for troubleshooting
  process.env.AGENTICCODER_AZURE_MCP_SUPPORT_LOG_DIR = outDir;

  // Make test deterministic
  const originalNow = Date.now;
  const originalRandom = Math.random;
  Date.now = () => 1700000000000;
  Math.random = () => 0.123456789;

  try {
    const scenarioPath = path.resolve(process.cwd(), '..', 'test-data', scenarioConfig.file);
    
    // Check if scenario file exists
    try {
      await fs.access(scenarioPath);
    } catch {
      t.skip(`Scenario file not found: ${scenarioConfig.file}`);
      return;
    }

    const scenario = await loadScenarioFromFile(scenarioPath);
    const result = await runScenario({ scenario, scenarioPath, outDir, offline: true });
    
    assert.equal(result.status, 'completed', `Scenario ${scenarioConfig.id} should complete successfully`);

    // Verify generated Bicep template contains expected resource patterns
    const template = await readFile(path.join(outDir, 'template.bicep'), 'utf8');
    
    for (const pattern of scenarioConfig.expectedPatterns) {
      assert.match(template, pattern, 
        `Template should contain resource matching ${pattern}`);
    }

    // Verify resources.json contains expected types
    const resources = JSON.parse(await fs.readFile(path.join(outDir, 'resources.json'), 'utf8'));
    const resourceTypes = new Set(resources.map((r) => r.type));
    
    for (const expectedType of scenario.expectations.resourceTypes) {
      assert.ok(resourceTypes.has(expectedType), 
        `Expected resources to include type ${expectedType}`);
    }

    // Log success info
    t.diagnostic(`✓ ${scenarioConfig.id}: Generated ${resources.length} resources`);
    t.diagnostic(`  Resource types: ${[...resourceTypes].join(', ')}`);

  } finally {
    Date.now = originalNow;
    Math.random = originalRandom;
    await rm(outDir, { recursive: true, force: true });
  }
}

// Main test suite for all scenarios
test('Azure MCP Schema-Strict Scenarios', async (t) => {
  // Check if tests are enabled
  if (!isAzureMcpTestEnabled()) {
    t.skip('Set AGENTICCODER_TEST_AZURE_MCP_SCHEMA=1 to run (requires npx + @azure/mcp)');
    return;
  }

  // Check Azure MCP availability
  const { available, command } = checkAzureMcpCommand();
  if (!available) {
    t.skip(
      `Azure MCP launcher not found (${command}). ` +
      `Set AGENTICCODER_AZURE_MCP_COMMAND to an absolute path (e.g. C:\\...\\npx.cmd).`
    );
    return;
  }

  // Set up environment
  const prevEnv = setupAzureMcpEnv(command);

  try {
    // Run each scenario as a subtest
    for (const scenarioConfig of SCENARIOS) {
      await t.test(`${scenarioConfig.id}: ${scenarioConfig.name}`, async (st) => {
        await runScenarioTest(st, scenarioConfig);
      });
    }
  } finally {
    restoreEnv(prevEnv);
  }
});

// Export for programmatic use
export { SCENARIOS, runScenarioTest };
