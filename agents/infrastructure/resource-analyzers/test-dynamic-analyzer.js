/**
 * Test script for the Dynamic Schema-based Resource Analyzer
 * 
 * Run with: node --experimental-vm-modules test-dynamic-analyzer.js
 */

import { DynamicResourceAnalyzer, getSchemaStats, getSupportedResourceTypes } from './index.js';

console.log('='.repeat(60));
console.log('Dynamic Resource Analyzer Test');
console.log('='.repeat(60));

// Test 1: Schema Stats
console.log('\n📊 Schema Statistics:');
const stats = getSchemaStats();
console.log(`   - Total Providers: ${stats.totalProviders}`);
console.log(`   - Total Resource Types: ${stats.totalResourceTypes}`);
console.log(`   - Generated At: ${stats.generatedAt}`);

// Test 2: Supported Resource Types
console.log('\n✅ Supported Resource Types (with keywords):');
const supported = getSupportedResourceTypes();
console.log(`   Found ${supported.length} keyword->resource mappings`);
supported.slice(0, 20).forEach(({ keyword, resourceType }) => {
  console.log(`   - "${keyword}" → ${resourceType}`);
});
if (supported.length > 20) {
  console.log(`   ... and ${supported.length - 20} more`);
}

// Test 3: Dynamic Analyzer Matching
console.log('\n🔍 Testing Dynamic Analyzer Matching:');
const analyzer = new DynamicResourceAnalyzer();

const testDescriptions = [
  'Deploy a web app with SQL database',
  'Create virtual machines with load balancer',
  'Set up AKS cluster with container registry',
  'Deploy Redis cache with Key Vault',
  'Create Cosmos DB with Application Insights',
  'Setup IoT Hub with Stream Analytics',  // IoT Hub not supported
  'Deploy Media Services with CDN'          // Media not supported
];

testDescriptions.forEach(description => {
  const matches = analyzer.findMatches(description);
  console.log(`\n   "${description}"`);
  
  if (matches.length === 0) {
    console.log('   ⚠️  No supported resource types found');
  } else {
    matches.forEach(m => {
      console.log(`   ✓ ${m.keyword} → ${m.resourceType} (API: ${m.apiVersion || 'unknown'})`);
    });
  }
});

// Test 4: Generate Resources
console.log('\n\n📦 Testing Resource Generation:');
const task = {
  description: 'Deploy a web app with SQL database and Redis cache'
};
const constraints = {
  region: 'westeurope',
  environment: 'production'
};

const resources = analyzer.analyze(task, constraints);
console.log(`\n   Generated ${resources.length} resources:`);
resources.forEach(r => {
  console.log(`\n   ${r.type}`);
  console.log(`   - Name: ${r.name}`);
  console.log(`   - Location: ${r.location}`);
  console.log(`   - API Version: ${r.apiVersion || 'default'}`);
  console.log(`   - SKU: ${JSON.stringify(r.sku)}`);
});

// Test 5: Validation Function
console.log('\n\n🛡️ Testing Resource Type Validation:');
const testTypes = [
  'Microsoft.Web/sites',
  'Microsoft.Devices/IotHubs',           // Not supported
  'Microsoft.Media/mediaservices',        // Not supported
  'Microsoft.Storage/storageAccounts',
  'Microsoft.DesktopVirtualization/hostPools'  // Not supported
];

testTypes.forEach(type => {
  const isSupported = analyzer._isResourceTypeSupported(type);
  const icon = isSupported ? '✓' : '✗';
  console.log(`   ${icon} ${type}: ${isSupported ? 'Supported' : 'NOT SUPPORTED'}`);
});

console.log('\n' + '='.repeat(60));
console.log('Test Complete');
console.log('='.repeat(60));
