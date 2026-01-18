/**
 * E2E Test Setup
 * 
 * Runs before each test file. Provides utilities for test isolation.
 */

import * as fs from 'fs';
import * as path from 'path';

// E2E workspace path
export const E2E_WORKSPACE = path.resolve('.e2e-workspace');

// Track created directories for cleanup
let testDirectories: string[] = [];

beforeAll(() => {
  // Ensure workspace exists
  if (!fs.existsSync(E2E_WORKSPACE)) {
    fs.mkdirSync(E2E_WORKSPACE, { recursive: true });
  }
  
  // Set environment
  process.env.E2E_WORKSPACE = E2E_WORKSPACE;
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Clean test-specific directories after each test
  for (const dir of testDirectories) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  testDirectories = [];
});

afterAll(() => {
  // Final cleanup handled by globalTeardown
});

/**
 * Create an isolated test directory
 */
export function createTestDir(testName: string): string {
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  const dirName = `${testName.replace(/[^a-z0-9]/gi, '-')}-${uniqueId}`;
  const testDir = path.join(E2E_WORKSPACE, dirName);
  
  fs.mkdirSync(testDir, { recursive: true });
  testDirectories.push(testDir);
  
  return testDir;
}

/**
 * Get the CLI executable path
 */
export function getCliPath(): string {
  return path.resolve('bin/agentic.js');
}

/**
 * Get the project root path
 */
export function getProjectRoot(): string {
  return path.resolve('.');
}
