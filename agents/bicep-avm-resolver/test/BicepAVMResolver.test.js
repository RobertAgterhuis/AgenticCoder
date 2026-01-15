/**
 * BicepAVMResolver - Integration Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import BicepAVMResolver from '../BicepAVMResolver.js';

describe('BicepAVMResolver', () => {
  it('should run analysis -> transform -> validate -> optimize end-to-end', async () => {
    const resolver = new BicepAVMResolver();

    const bicep = `
param location string = 'westeurope'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystg123'
  location: location
  kind: 'StorageV2'
  accessTier: 'Hot'
  sku: {
    name: 'Standard_LRS'
  }
}

output storageId string = storageAccount.id
`;

    const result = await resolver.resolve(bicep, {
      templateName: 'resolver_test',
      optimizationContext: { environment: 'dev' }
    });

    assert.equal(result.summary.errors, 0);

    // transformation happened
    assert.ok(result.transformation.bicepCode.includes("module storageAccountModule 'br:avm/storage:latest'"));
    assert.ok(!result.transformation.bicepCode.includes("resource storageAccount 'Microsoft.Storage/storageAccounts"));

    // output rewriting should persist through optimization
    assert.ok(result.outputBicepCode.includes('output storageId string = storageAccountModule.outputs.id'));

    // redundant defaults should be removed by optimizer
    assert.ok(!result.outputBicepCode.includes("kind: 'StorageV2'"));
    assert.ok(!result.outputBicepCode.includes("accessTier: 'Hot'"));

    // basic validation objects exist
    assert.ok(result.validation.transformed);
    assert.ok(result.validation.optimized);
  });
});
