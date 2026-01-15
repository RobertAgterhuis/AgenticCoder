/**
 * Module Mapper - Test Suite
 *
 * Tests for Component 3 of Bicep AVM Resolver
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import AVMRegistry from '../../01-avm-registry/AVMRegistry.js';
import ResourceAnalyzer from '../../02-resource-analyzer/ResourceAnalyzer.js';
import ModuleMapper from '../ModuleMapper.js';

describe('ModuleMapper', () => {
  it('should map a storage account resource to an AVM module mapping', async () => {
    const registry = new AVMRegistry();
    await registry.initialize();

    const analyzer = new ResourceAnalyzer();
    const mapper = new ModuleMapper();

    const bicep = `
param location string = 'westeurope'
param storageName string = 'mystg123'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
  }
}
`;

    const parsed = await analyzer.analyzeBicepTemplate(bicep);
    const resource = parsed.resources.find((r) => r.name === 'storageAccount');
    assert.ok(resource);

    const module = registry.findModuleByResourceType(resource.type);
    assert.ok(module);

    const { mapping, warnings } = await mapper.createModuleMapping(resource, module, registry);

    assert.equal(mapping.sourceResourceType, 'Microsoft.Storage/storageAccounts');
    assert.equal(mapping.avmModuleId, 'br:avm/storage:latest');

    // Required parameters should be mapped
    assert.ok(mapping.parameterMappings.location);
    assert.ok(mapping.parameterMappings.name);

    // Nested mapping should be picked up (sku.name -> skuName)
    assert.ok(mapping.parameterMappings.skuName);
    assert.equal(mapping.parameterMappings.skuName.sourceProperty, 'sku.name');

    // properties mapping should be picked up
    assert.ok(mapping.parameterMappings.accessTier);

    // supportsHttpsTrafficOnly should map to httpsOnly via registry mapping
    assert.ok(mapping.parameterMappings.httpsOnly);

    // no missing required params warnings expected
    assert.equal(warnings.length, 0);
  });

  it('should build a module reference with expressions for template parameters/variables', async () => {
    const registry = new AVMRegistry();
    await registry.initialize();

    const analyzer = new ResourceAnalyzer();
    const mapper = new ModuleMapper();

    const bicep = `
param location string = 'westeurope'
param storageName string

var tags = {
  env: 'dev'
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
}
`;

    const parsed = await analyzer.analyzeBicepTemplate(bicep);
    const resource = parsed.resources.find((r) => r.name === 'storageAccount');
    assert.ok(resource);

    const module = registry.findModuleByResourceType(resource.type);
    const { mapping } = await mapper.createModuleMapping(resource, module, registry);

    const moduleRef = mapper.buildModuleReference(mapping, parsed);

    assert.equal(moduleRef.avmModuleId, 'br:avm/storage:latest');
    assert.ok(moduleRef.parameters.location);
    assert.equal(moduleRef.parameters.location, 'location');
    assert.equal(moduleRef.parameters.name, 'storageName');

    // skuName is a literal (from resource), should be quoted
    assert.equal(moduleRef.parameters.skuName, "'Standard_LRS'");
  });

  it('should return a mapping summary for a template', async () => {
    const registry = new AVMRegistry();
    await registry.initialize();

    const analyzer = new ResourceAnalyzer();
    const mapper = new ModuleMapper();

    const bicep = `
param location string = 'westeurope'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystg123'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
}

resource unknownRes 'Microsoft.Unknown/widgets@2020-01-01' = {
  name: 'x'
  location: location
}
`;

    const parsed = await analyzer.analyzeBicepTemplate(bicep);
    const summary = await mapper.mapTemplate(parsed, registry);

    assert.equal(summary.totalResources, 2);
    assert.equal(summary.failedMappings, 1);
    assert.equal(summary.successfulMappings + summary.partialMappings, 1);
    assert.ok(summary.resources.some((r) => r.status === 'failed'));
  });
});
