/**
 * Validation Engine - Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import AVMRegistry from '../../01-avm-registry/AVMRegistry.js';
import TemplateTransformer from '../../04-template-transformer/TemplateTransformer.js';
import ValidationEngine from '../ValidationEngine.js';

describe('ValidationEngine', () => {
  it('should report zero errors for a basic transformed template', async () => {
    const registry = new AVMRegistry();
    await registry.initialize();

    const transformer = new TemplateTransformer();
    const validator = new ValidationEngine();

    const original = `
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

    const transformed = (await transformer.transformBicepTemplate(original, registry)).bicepCode;

    const { results, summary } = await validator.validateTemplates(original, transformed);

    assert.equal(summary.errors, 0);
    assert.equal(results.filter((r) => r.severity === 'error').length, 0);
  });

  it('should detect missing outputs as errors', async () => {
    const validator = new ValidationEngine();

    const original = `
param location string = 'westeurope'

resource st 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystg123'
  location: location
  sku: { name: 'Standard_LRS' }
}

output storageId string = st.id
`;

    const transformed = [
      "param location string = 'westeurope'",
      '',
      "module stModule 'br:avm/storage:latest' = {",
      "  name: '${uniqueString(resourceGroup().id)}-st'",
      '  params: {',
      '    location: location',
      "    name: 'mystg123'",
      '  }',
      '}',
      ''
    ].join('\n');

    const { results } = await validator.validateTemplates(original, transformed);

    const outputErrors = results.filter((r) => r.ruleId === 'rule-002' && r.severity === 'error');
    assert.ok(outputErrors.length >= 1);
  });
});
