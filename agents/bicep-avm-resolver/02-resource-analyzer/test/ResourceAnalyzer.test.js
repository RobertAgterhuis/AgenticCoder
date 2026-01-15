/**
 * Resource Analyzer - Test Suite
 *
 * Tests for Component 2 of Bicep AVM Resolver
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import ResourceAnalyzer from '../ResourceAnalyzer.js';
import AVMRegistry from '../../01-avm-registry/AVMRegistry.js';

describe('ResourceAnalyzer', () => {
  it('should parse parameters, variables, resources, and outputs', async () => {
    const analyzer = new ResourceAnalyzer();

    const bicep = `
param location string = 'westeurope'
param appName string

var tags = {
  env: 'dev'
  owner: 'team-a'
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystg123'
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
}

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  properties: {
    httpsOnly: true
  }
  dependsOn: [
    storageAccount
  ]
}

output storageId string = storageAccount.id
`;

    const parsed = await analyzer.analyzeBicepTemplate(bicep);

    assert.equal(parsed.parameters.location.type, 'string');
    assert.equal(parsed.parameters.location.default, 'westeurope');
    assert.equal(parsed.parameters.appName.type, 'string');

    assert.ok(typeof parsed.variables.tags === 'string');
    assert.ok(parsed.variables.tags.includes("env"));

    assert.equal(parsed.resources.length, 2);

    const storage = parsed.resources.find((r) => r.name === 'storageAccount');
    assert.ok(storage);
    assert.equal(storage.type, 'Microsoft.Storage/storageAccounts');
    assert.equal(storage.apiVersion, '2023-01-01');
    assert.equal(storage.properties.kind, 'StorageV2');
    assert.equal(storage.properties.sku.name, 'Standard_LRS');

    const web = parsed.resources.find((r) => r.name === 'webApp');
    assert.ok(web);
    assert.equal(web.type, 'Microsoft.Web/sites');
    assert.equal(web.apiVersion, '2022-09-01');
    assert.ok(web.dependencies.includes('storageAccount'));

    assert.equal(parsed.outputs.storageId.type, 'string');
    assert.equal(parsed.outputs.storageId.value, 'storageAccount.id');
  });

  it('should analyze resource against AVM registry and produce a report', async () => {
    const analyzer = new ResourceAnalyzer();
    const registry = new AVMRegistry();
    await registry.initialize();

    const bicep = `
param location string = 'westeurope'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystg123'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  custom_setting: 'x'
}

resource unknownRes 'Microsoft.Unknown/widgets@2020-01-01' = {
  name: 'x'
  location: location
}
`;

    const { parsed, analyses, report } = await analyzer.analyzeTemplate(bicep, registry, 'unit');

    assert.equal(parsed.resources.length, 2);
    assert.equal(analyses.length, 2);

    const storageAnalysis = analyses.find((a) => a.resourceName === 'storageAccount');
    assert.ok(storageAnalysis);
    assert.equal(storageAnalysis.canUseAVM, true);
    assert.ok(typeof storageAnalysis.avmModule === 'string');
    assert.ok(storageAnalysis.standardProperties.includes('location'));
    // nested path mapping should be detected when registry has mapping
    assert.ok(storageAnalysis.standardProperties.includes('sku.name'));
    assert.ok(storageAnalysis.transformationRequired === true || storageAnalysis.customProperties.length > 0 || storageAnalysis.unsupportedProperties.length > 0);

    const unknownAnalysis = analyses.find((a) => a.resourceName === 'unknownRes');
    assert.ok(unknownAnalysis);
    assert.equal(unknownAnalysis.canUseAVM, false);

    assert.equal(report.template_name, 'unit');
    assert.equal(report.total_resources, 2);
    assert.ok(['low', 'medium', 'high'].includes(report.overall_complexity));
  });

  it('should handle empty input safely', async () => {
    const analyzer = new ResourceAnalyzer();
    const parsed = await analyzer.analyzeBicepTemplate('');

    assert.deepEqual(parsed.parameters, {});
    assert.deepEqual(parsed.variables, {});
    assert.deepEqual(parsed.resources, []);
    assert.deepEqual(parsed.outputs, {});
  });

  it('should handle comments, trailing commas, and dependsOn variants', async () => {
    const analyzer = new ResourceAnalyzer();

    const bicep = `
param location string = 'westeurope'

resource otherRes 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id1'
  location: location
}

resource stg 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  // brace in string should not break parsing
  name: 'my{stg}' // inline comment after value
  location: location // inline comment

  /* block comment on its own line */
  tags: {
    env: 'dev',
  }

  sku: {
    name: 'Standard_LRS'
  }

  dependsOn: [
    otherRes, // identifier
    otherRes.id, // dotted reference
  ]
}
`;

    const parsed = await analyzer.analyzeBicepTemplate(bicep);

    assert.equal(parsed.resources.length, 2);

    const stg = parsed.resources.find((r) => r.name === 'stg');
    assert.ok(stg);

    assert.equal(stg.type, 'Microsoft.Storage/storageAccounts');
    assert.equal(stg.apiVersion, '2023-01-01');
    assert.equal(stg.properties.name, 'my{stg}');
    assert.equal(stg.properties.location, 'location');
    assert.equal(stg.properties.tags.env, 'dev');
    assert.equal(stg.properties.sku.name, 'Standard_LRS');

    // dependencies should include only the symbolic name
    assert.ok(stg.dependencies.includes('otherRes'));
  });
});
