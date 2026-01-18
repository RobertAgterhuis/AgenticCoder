/**
 * Bridge Test Script
 */
const bridge = require('./agents/bridge');

console.log('=== Bridge Test ===\n');
console.log('Bridge loaded:', !!bridge);
console.log('Bridge keys:', Object.keys(bridge));
console.log('\nFunctions available:');
console.log('  - isTypeScriptAvailable:', typeof bridge.isTypeScriptAvailable);
console.log('  - loadTSModule:', typeof bridge.loadTSModule);
console.log('  - getSecurity:', typeof bridge.getSecurity);
console.log('  - getMCP:', typeof bridge.getMCP);
console.log('  - getState:', typeof bridge.getState);
console.log('  - getErrors:', typeof bridge.getErrors);

if (typeof bridge.isTypeScriptAvailable === 'function') {
  console.log('\n=== Module Availability ===\n');
  console.log('TypeScript available:', bridge.isTypeScriptAvailable());
  console.log('Security available:', bridge.security.isAvailable());
  console.log('MCP available:', bridge.mcp.isAvailable());
  console.log('State available:', bridge.state.isAvailable());
  console.log('Errors available:', bridge.errors.isAvailable());
  
  console.log('\n=== Security Bridge Test ===\n');
  const securityModule = bridge.security.getSecurityModule();
  if (securityModule) {
    console.log('Security module exports:', Object.keys(securityModule).slice(0, 10), '...');
  }
  
  console.log('\n=== MCP Bridge Test ===\n');
  const mcpModule = bridge.mcp.getMCPModule();
  if (mcpModule) {
    console.log('MCP module exports:', Object.keys(mcpModule).slice(0, 10), '...');
  }
}

console.log('\n=== Test Complete ===');
