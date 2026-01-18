/**
 * E2E Global Setup
 * 
 * Runs once before all E2E tests to prepare the test environment.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const E2E_WORKSPACE = path.resolve('.e2e-workspace');

export default async function globalSetup() {
  console.log('\n🔧 E2E Global Setup');
  
  // Clean previous workspace
  if (fs.existsSync(E2E_WORKSPACE)) {
    fs.rmSync(E2E_WORKSPACE, { recursive: true, force: true });
  }
  
  // Create fresh workspace
  fs.mkdirSync(E2E_WORKSPACE, { recursive: true });
  console.log('   ✓ Created workspace: ' + E2E_WORKSPACE);
  
  // Ensure TypeScript is built
  const distPath = path.resolve('dist');
  if (!fs.existsSync(distPath)) {
    console.log('   ⏳ Building TypeScript...');
    try {
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: path.resolve('.')
      });
      console.log('   ✓ TypeScript built');
    } catch (error) {
      console.error('   ✗ Build failed:', error);
      throw error;
    }
  } else {
    console.log('   ✓ TypeScript build exists');
  }
  
  // Store workspace path for tests
  process.env.E2E_WORKSPACE = E2E_WORKSPACE;
  
  console.log('   ✓ E2E Setup complete\n');
}
