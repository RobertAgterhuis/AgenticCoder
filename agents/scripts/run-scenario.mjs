#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadScenarioFromFile, runScenario } from '../scenarios/runScenario.js';

function parseArgs(argv) {
  const args = {
    scenario: null,
    out: null,
    offline: false
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--scenario') {
      args.scenario = argv[++i];
    } else if (a === '--out') {
      args.out = argv[++i];
    } else if (a === '--offline') {
      args.offline = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.scenario || !args.out) {
    console.log('Usage: node scripts/run-scenario.mjs --scenario <path> --out <dir> [--offline]');
    process.exit(args.help ? 0 : 1);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const agentsDir = path.resolve(__dirname, '..');

  const scenarioPath = path.resolve(agentsDir, args.scenario);
  const outDir = path.resolve(agentsDir, args.out);

  const scenario = await loadScenarioFromFile(scenarioPath);

  const result = await runScenario({
    scenario,
    scenarioPath,
    outDir,
    offline: args.offline
  });

  console.log(JSON.stringify({
    status: result.status,
    durationMs: result.duration,
    outDir
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
