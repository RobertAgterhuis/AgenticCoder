#!/usr/bin/env node
/**
 * Script to run the Azure MCP schema-strict tests.
 * Sets the required environment variable and runs the tests with --test-force-exit.
 * 
 * Usage:
 *   node scripts/test-azure-mcp.mjs           # Run all scenarios
 *   node scripts/test-azure-mcp.mjs --s01     # Run only S01 (legacy test)
 *   node scripts/test-azure-mcp.mjs --quick   # Run only S01 for quick validation
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const agentsDir = path.resolve(__dirname, '..');

// Set the environment variable to enable the test
process.env.AGENTICCODER_TEST_AZURE_MCP_SCHEMA = '1';

// Parse args
const args = process.argv.slice(2);
const runQuick = args.includes('--quick') || args.includes('--s01');

// Select test file based on args
const testFile = runQuick
  ? path.join(agentsDir, 'test', 'S01ScenarioRunner.AzureMcpSchema.test.js')
  : path.join(agentsDir, 'test', 'AzureMcpSchemaScenarios.test.js');

console.log(`Running Azure MCP schema tests: ${runQuick ? 'S01 only (quick)' : 'All scenarios'}`);
console.log(`Test file: ${path.basename(testFile)}\n`);

const child = spawn('node', ['--test', '--test-force-exit', testFile], {
  stdio: 'inherit',
  cwd: agentsDir,
  env: process.env,
  shell: process.platform === 'win32'
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

