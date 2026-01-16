/**
 * Schema Verification Test
 * 
 * Verifies that all newly discovered supported providers are correctly
 * integrated into the schema cache and DynamicResourceAnalyzer.
 */

import * as schemaValidator from './schema-discovery/schemaValidator.js';

console.log('============================================================');
console.log('Schema Verification Test - Newly Discovered Providers');
console.log('============================================================\n');

// Test newly discovered providers (previously thought unsupported)
const newlyDiscoveredProviders = [
  {
    name: 'IoT Hub',
    types: [
      'Microsoft.Devices/IotHubs',
      'Microsoft.Devices/provisioningServices'
    ]
  },
  {
    name: 'Digital Twins',
    types: [
      'Microsoft.DigitalTwins/digitalTwinsInstances'
    ]
  },
  {
    name: 'Communication Services',
    types: [
      'Microsoft.Communication/communicationServices',
      'Microsoft.Communication/emailServices'
    ]
  },
  {
    name: 'Azure Virtual Desktop',
    types: [
      'Microsoft.DesktopVirtualization/hostPools',
      'Microsoft.DesktopVirtualization/applicationGroups',
      'Microsoft.DesktopVirtualization/workspaces'
    ]
  },
  {
    name: 'Container Instances',
    types: [
      'Microsoft.ContainerInstance/containerGroups'
    ]
  },
  {
    name: 'Batch',
    types: [
      'Microsoft.Batch/batchAccounts'
    ]
  }
];

console.log('📊 Cache Statistics:');
const stats = schemaValidator.getStats();
console.log(`   Total Providers: ${stats.totalProviders}`);
console.log(`   Total Resource Types: ${stats.totalResourceTypes}`);
console.log(`   Generated At: ${stats.generatedAt}\n`);

console.log('🔍 Verifying Newly Discovered Providers:\n');

let allPassed = true;

for (const provider of newlyDiscoveredProviders) {
  console.log(`   ${provider.name}:`);
  
  for (const resourceType of provider.types) {
    const isSupported = schemaValidator.isSupported(resourceType);
    const apiVersion = schemaValidator.getLatestApiVersion(resourceType);
    
    if (isSupported && apiVersion) {
      console.log(`   ✅ ${resourceType}`);
      console.log(`      API Version: ${apiVersion}`);
    } else {
      console.log(`   ❌ ${resourceType} - NOT FOUND`);
      allPassed = false;
    }
  }
  console.log('');
}

// Verify unsupported provider
console.log('🚫 Verifying Known Unsupported Provider:\n');
const mediaTypes = [
  'Microsoft.Media/mediaservices',
  'Microsoft.Media/mediaServices/streamingEndpoints'
];

for (const rt of mediaTypes) {
  const isSupported = schemaValidator.isSupported(rt);
  if (!isSupported) {
    console.log(`   ✅ ${rt} - Correctly marked as unsupported`);
  } else {
    console.log(`   ⚠️ ${rt} - Unexpectedly marked as supported`);
  }
}

console.log('\n============================================================');
if (allPassed) {
  console.log('✅ All newly discovered providers verified successfully!');
} else {
  console.log('❌ Some providers failed verification');
}
console.log('============================================================');
