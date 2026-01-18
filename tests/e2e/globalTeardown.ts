/**
 * E2E Global Teardown
 * 
 * Runs once after all E2E tests to clean up.
 */

import * as fs from 'fs';
import * as path from 'path';

const E2E_WORKSPACE = path.resolve('.e2e-workspace');

export default async function globalTeardown() {
  console.log('\n🧹 E2E Global Teardown');
  
  // Clean workspace unless DEBUG is set
  if (!process.env.E2E_DEBUG) {
    if (fs.existsSync(E2E_WORKSPACE)) {
      fs.rmSync(E2E_WORKSPACE, { recursive: true, force: true });
      console.log('   ✓ Cleaned workspace');
    }
  } else {
    console.log('   ⚠ Keeping workspace for debugging: ' + E2E_WORKSPACE);
  }
  
  console.log('   ✓ Teardown complete\n');
}
