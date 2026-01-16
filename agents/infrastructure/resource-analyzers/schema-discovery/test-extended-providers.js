/**
 * Test Extended Provider Discovery
 * Validates that newly discovered Azure providers are correctly indexed
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const supportedResources = require('./supported-resources.json');

console.log('=== Extended Provider Discovery Test ===\n');

// Summary stats
const providers = Object.keys(supportedResources.providers);
const totalResourceTypes = Object.values(supportedResources.providers)
  .reduce((sum, p) => sum + Object.keys(p.latestApiVersions).length, 0);

console.log(`Total Providers Indexed: ${providers.length}`);
console.log(`Total Resource Types: ${totalResourceTypes}`);
console.log(`Unsupported Providers: ${supportedResources.unsupportedProviders.length}\n`);

// List all providers with resource counts
console.log('--- All Providers ---');
providers.sort().forEach(provider => {
  const count = Object.keys(supportedResources.providers[provider].latestApiVersions).length;
  console.log(`  ${provider}: ${count} resource types`);
});

// Test newly discovered providers
console.log('\n--- Newly Discovered Providers Verification ---');
const newProviders = [
  'Microsoft.Resources',
  'Microsoft.Management',
  'Microsoft.Blueprint',
  'Microsoft.Maintenance',
  'Microsoft.Purview',
  'Microsoft.TimeSeriesInsights',
  'Microsoft.PowerBI',
  'Microsoft.HybridCompute',
  'Microsoft.Advisor',
  'Microsoft.Migrate',
  'Microsoft.Automation',
  'Microsoft.Security',
  'Microsoft.PolicyInsights',
  'Microsoft.DevCenter',
  'Microsoft.GuestConfiguration',
  'Microsoft.CostManagement',
  'Microsoft.Kusto',
  'Microsoft.LoadTestService',
  'Microsoft.Portal',
  'Microsoft.Scheduler',
  'Microsoft.HDInsight',
  'Microsoft.NetApp',
  'Microsoft.HealthcareApis',
  'Microsoft.AVS'
];

let allFound = true;
newProviders.forEach(provider => {
  const found = providers.includes(provider);
  console.log(`  ${found ? '✅' : '❌'} ${provider}`);
  if (!found) allFound = false;
});

console.log('\n--- Summary ---');
console.log(`Provider count in metadata: ${supportedResources.totalProviders}`);
console.log(`Actual provider count: ${providers.length}`);
console.log(`Resource types in metadata: ${supportedResources.totalResourceTypes}`);
console.log(`Actual resource types: ${totalResourceTypes}`);

if (supportedResources.totalProviders === providers.length) {
  console.log('✅ Provider count matches metadata');
} else {
  console.log('⚠️ Provider count mismatch - metadata needs update');
}

if (supportedResources.totalResourceTypes === totalResourceTypes) {
  console.log('✅ Resource type count matches metadata');
} else {
  console.log('⚠️ Resource type count mismatch - metadata needs update');
}

if (allFound) {
  console.log('\n✅ All newly discovered providers are correctly indexed!');
} else {
  console.log('\n❌ Some providers are missing');
  process.exit(1);
}

console.log('\n=== Test Complete ===');
