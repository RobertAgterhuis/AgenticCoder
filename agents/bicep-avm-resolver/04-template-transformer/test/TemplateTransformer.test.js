/**
 * Template Transformer - Test Suite
 *
 * Tests for Component 4 of Bicep AVM Resolver
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import AVMRegistry from '../../01-avm-registry/AVMRegistry.js';
import TemplateTransformer from '../TemplateTransformer.js';

describe('TemplateTransformer', () => {
  it('should replace a transformable resource with an AVM module call and update outputs', async () => {
    const registry = new AVMRegistry();
    await registry.initialize();

    const transformer = new TemplateTransformer();

    const bicep = `
param location string = 'westeurope'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystg123'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
}

output storageId string = storageAccount.id
`;

    const { bicepCode, summary } = await transformer.transformBicepTemplate(bicep, registry);

    assert.ok(bicepCode.includes("module storageAccountModule 'br:avm/storage:latest'"));
    assert.ok(!bicepCode.includes("resource storageAccount 'Microsoft.Storage/storageAccounts"));

    // Output should reference module outputs
    assert.ok(bicepCode.includes('output storageId string = storageAccountModule.outputs.id'));

    assert.equal(summary.resourcesTransformed, 1);
  });

  it('should rewrite dependency references to module outputs when both resources are transformed', async () => {
    const registry = new AVMRegistry();
    await registry.initialize();

    const transformer = new TemplateTransformer();

    const bicep = `
param location string = 'westeurope'
param planName string = 'asp1'
param appName string = 'app1'

resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: planName
  location: location
  sku: {
    name: 'B1'
  }
}

resource webApp 'Microsoft.Web/sites@2021-02-01' = {
  name: appName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
  }
  dependsOn: [appServicePlan]
}

output webAppId string = webApp.id
`;

    const { bicepCode, summary } = await transformer.transformBicepTemplate(bicep, registry);

    assert.ok(bicepCode.includes("module appServicePlanModule 'br:avm/app-service-plan:latest'"));
    assert.ok(bicepCode.includes("module webAppModule 'br:avm/web-app:latest'"));

    // serverFarmId should be rewritten to use module outputs
    assert.ok(bicepCode.includes('appServicePlanId: appServicePlanModule.outputs.id'));

    // webApp output should be rewritten
    assert.ok(bicepCode.includes('output webAppId string = webAppModule.outputs.id'));

    assert.equal(summary.resourcesTransformed, 2);
  });
});
