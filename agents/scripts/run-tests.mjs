import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip dependency and cache directories.
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '__pycache__' ||
        entry.name === 'dist' ||
        entry.name === 'coverage'
      ) {
        continue;
      }
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

async function collectTestFiles(cwd) {
  const testFiles = [];

  const topLevelTestDir = path.join(cwd, 'test');
  for await (const p of walk(topLevelTestDir)) {
    if (p.endsWith('.test.js')) testFiles.push(p);
  }

  const bicepResolverDir = path.join(cwd, 'bicep-avm-resolver');
  for await (const p of walk(bicepResolverDir)) {
    if (!p.endsWith('.test.js')) continue;

    // Only include tests under a "test" directory to avoid picking up unrelated files.
    const normalized = p.split(path.sep).join('/');
    if (normalized.includes('/test/')) testFiles.push(p);
  }

  // Core execution module tests (ExecutionBridge)
  const executionTestFile = path.join(cwd, 'core', 'test', 'execution.test.js');
  try {
    await fs.access(executionTestFile);
    testFiles.push(executionTestFile);
  } catch {
    // File doesn't exist, skip
  }

  // Core feedback module tests (FeedbackLoop)
  const feedbackTestFile = path.join(cwd, 'core', 'test', 'feedback.test.js');
  try {
    await fs.access(feedbackTestFile);
    testFiles.push(feedbackTestFile);
  } catch {
    // File doesn't exist, skip
  }

  // Deterministic order.
  testFiles.sort((a, b) => a.localeCompare(b));
  return testFiles;
}

async function main() {
  const cwd = process.cwd();
  const watch = process.argv.includes('--watch');

  const files = await collectTestFiles(cwd);
  if (files.length === 0) {
    console.error('No test files found.');
    process.exitCode = 1;
    return;
  }

  const args = ['--test'];
  if (watch) args.push('--watch');
  args.push(...files);

  const child = spawn(process.execPath, args, { stdio: 'inherit', cwd });
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
}

await main();
