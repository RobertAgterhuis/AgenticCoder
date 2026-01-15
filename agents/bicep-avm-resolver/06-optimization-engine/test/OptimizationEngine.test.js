/**
 * Optimization Engine - Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import AVMRegistry from '../../01-avm-registry/AVMRegistry.js';
import OptimizationEngine from '../OptimizationEngine.js';

describe('OptimizationEngine', () => {
  it('should remove redundant default parameters from storage module', async () => {
    const registry = new AVMRegistry();
    await registry.initialize();

    const engine = new OptimizationEngine();

    const code = [
      "param location string = 'westeurope'",
      '',
      "module storageAccountModule 'br:avm/storage:latest' = {",
      "  name: '${uniqueString(resourceGroup().id)}-storageAccountModule'",
      '',
      '  params: {',
      '    location: location',
      "    name: 'mystg123'",
      "    kind: 'StorageV2'", // default
      "    accessTier: 'Hot'", // default
      '    httpsOnly: true', // default
      "    skuName: 'Standard_LRS'",
      '  }',
      '}',
      ''
    ].join('\n');

    const result = await engine.optimizeBicepCode(code, { environment: 'dev' }, registry);

    assert.ok(result.templateAfter.includes("module storageAccountModule 'br:avm/storage:latest'"));

    // defaults removed
    assert.ok(!result.templateAfter.includes("kind: 'StorageV2'"));
    assert.ok(!result.templateAfter.includes("accessTier: 'Hot'"));
    assert.ok(!result.templateAfter.includes('httpsOnly: true'));

    // non-default kept
    assert.ok(result.templateAfter.includes("skuName: 'Standard_LRS'"));
  });

  it('should apply cost optimization for expensive storage SKU', async () => {
    const registry = new AVMRegistry();
    await registry.initialize();

    const engine = new OptimizationEngine();

    const code = [
      "module stModule 'br:avm/storage:latest' = {",
      "  name: '${uniqueString(resourceGroup().id)}-st'",
      '  params: {',
      "    location: 'westeurope'",
      "    name: 'mystg123'",
      "    skuName: 'Premium_ZRS'",
      '  }',
      '}',
      ''
    ].join('\n');

    const result = await engine.optimizeBicepCode(code, { costOptimization: true }, registry);

    assert.ok(result.templateAfter.includes("skuName: 'Standard_LRS'"));
  });

  it('should apply security hardening for web app httpsOnly when set to false', async () => {
    const registry = new AVMRegistry();
    await registry.initialize();

    const engine = new OptimizationEngine();

    const code = [
      "module webAppModule 'br:avm/web-app:latest' = {",
      "  name: '${uniqueString(resourceGroup().id)}-app'",
      '  params: {',
      "    location: 'westeurope'",
      "    name: 'app1'",
      "    appServicePlanId: 'x'",
      '    httpsOnly: false',
      '  }',
      '}',
      ''
    ].join('\n');

    const result = await engine.optimizeBicepCode(code, { securityFocus: true }, registry);

    // should flip to true
    assert.ok(result.templateAfter.includes('httpsOnly: true'));
  });
});
