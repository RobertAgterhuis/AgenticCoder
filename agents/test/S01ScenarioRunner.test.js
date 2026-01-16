import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { loadScenarioFromFile, runScenario } from '../scenarios/runScenario.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

test('S01 scenario runner generates expected artifacts', async () => {
  const scenarioPath = path.resolve(repoRoot, 'test-data', 'S01-simple-app-service.json');
  const scenario = await loadScenarioFromFile(scenarioPath);

  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agenticcoder-s01-'));
  const outDir = path.join(tmpRoot, 'output');

  // Make output deterministic-ish for assertions by stubbing time/random used for naming.
  const originalNow = Date.now;
  const originalRandom = Math.random;
  Date.now = () => 1700000000000;
  Math.random = () => 0.123456789;

  try {
    const result = await runScenario({ scenario, scenarioPath, outDir, offline: true });

    assert.equal(result.status, 'completed');

    // Files exist
    for (const rel of [
      'manifest.json',
      'scenario.json',
      'workflow-result.json',
      'tasks.json',
      'resources.json',
      'cost-estimate.json',
      'validation.json',
      'template.bicep',
      'parameters.json',
      'deploy.sh'
    ]) {
      assert.equal(await pathExists(path.join(outDir, rel)), true, `Expected ${rel} to exist`);
    }

    const template = await fs.readFile(path.join(outDir, 'template.bicep'), 'utf8');
    assert.ok(template.includes('Microsoft.Web/serverfarms'));
    assert.ok(template.includes('Microsoft.Web/sites'));
    assert.ok(template.includes('Microsoft.Storage/storageAccounts'));
    assert.ok(template.includes('Microsoft.Insights/components'));

    const resources = JSON.parse(await fs.readFile(path.join(outDir, 'resources.json'), 'utf8'));
    const resourceTypes = new Set(resources.map((r) => r.type));
    for (const t of scenario.expectations.resourceTypes) {
      assert.ok(resourceTypes.has(t), `Expected resources to include type ${t}`);
    }

    const validation = JSON.parse(await fs.readFile(path.join(outDir, 'validation.json'), 'utf8'));
    assert.equal(typeof validation?.isValid, 'boolean');
  } finally {
    Date.now = originalNow;
    Math.random = originalRandom;
  }
});
