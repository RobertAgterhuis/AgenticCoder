/**
 * AVM Module Registry - Test Suite
 * 
 * Tests for Component 1 of Bicep AVM Resolver
 * Target: 15+ tests, 95%+ coverage
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AVMRegistry from '../AVMRegistry.js';

describe('AVMRegistry', () => {
  let registry;

  beforeEach(async () => {
    registry = new AVMRegistry();
    await registry.initialize();
  });

  describe('Initialization', () => {
    it('should initialize registry with built-in modules', async () => {
      const newRegistry = new AVMRegistry();
      assert.equal(newRegistry._initialized, false);
      
      await newRegistry.initialize();
      
      assert.equal(newRegistry._initialized, true);
      assert.ok(newRegistry.registry.size > 0);
    });

    it('should have at least 25 built-in modules', async () => {
      const stats = registry.getStatistics();
      assert.ok(stats.total_modules >= 25, `Expected at least 25 modules, got ${stats.total_modules}`);
    });
  });

  describe('findModuleByResourceType', () => {
    it('should find storage account module by exact resource type', () => {
      const module = registry.findModuleByResourceType('Microsoft.Storage/storageAccounts');
      
      assert.ok(module !== null);
      assert.equal(module.id, 'br:avm/storage:latest');
      assert.equal(module.name, 'Storage Account');
    });

    it('should find web app module by exact resource type', () => {
      const module = registry.findModuleByResourceType('Microsoft.Web/sites');
      
      assert.ok(module !== null);
      assert.equal(module.id, 'br:avm/web-app:latest');
    });

    it('should find SQL database module', () => {
      const module = registry.findModuleByResourceType('Microsoft.Sql/servers/databases');
      
      assert.ok(module !== null);
      assert.equal(module.id, 'br:avm/sql-database:latest');
    });

    it('should return null for unknown resource type', () => {
      const module = registry.findModuleByResourceType('Microsoft.Unknown/resources');
      
      assert.equal(module, null);
    });

    it('should use cache for repeated queries', () => {
      registry.findModuleByResourceType('Microsoft.Storage/storageAccounts');
      assert.ok(registry.cache.data.size > 0);
    });
  });

  describe('findModuleById', () => {
    it('should find module by ID', () => {
      const module = registry.findModuleById('br:avm/storage:latest');
      
      assert.ok(module !== null);
      assert.equal(module.name, 'Storage Account');
    });

    it('should return null for unknown ID', () => {
      const module = registry.findModuleById('br:avm/unknown:latest');
      
      assert.equal(module, null);
    });
  });

  describe('findModulesByCategory', () => {
    it('should find all storage modules', () => {
      const modules = registry.findModulesByCategory('Storage');
      
      assert.ok(modules.length > 0);
      assert.ok(modules.every(m => m.category === 'Storage'));
    });

    it('should find all database modules', () => {
      const modules = registry.findModulesByCategory('Database');
      
      assert.ok(modules.length >= 3);
    });

    it('should return empty array for unknown category', () => {
      const modules = registry.findModulesByCategory('UnknownCategory');
      
      assert.deepEqual(modules, []);
    });
  });

  describe('getParameterMapping', () => {
    it('should map sku.name to skuName', () => {
      const module = registry.findModuleById('br:avm/storage:latest');
      const mapping = registry.getParameterMapping(module, 'sku.name');
      
      assert.equal(mapping, 'skuName');
    });

    it('should handle case-insensitive matching', () => {
      const module = registry.findModuleById('br:avm/storage:latest');
      const mapping = registry.getParameterMapping(module, 'SKU.NAME');
      
      assert.equal(mapping, 'skuName');
    });

    it('should return null for unmapped property', () => {
      const module = registry.findModuleById('br:avm/storage:latest');
      const mapping = registry.getParameterMapping(module, 'unknownProperty');
      
      assert.equal(mapping, null);
    });
  });

  describe('getAllModules', () => {
    it('should return all modules as array', () => {
      const modules = registry.getAllModules();
      
      assert.ok(Array.isArray(modules));
      assert.ok(modules.length > 0);
    });
  });

  describe('getStatistics', () => {
    it('should return registry statistics', () => {
      const stats = registry.getStatistics();
      
      assert.ok('total_modules' in stats);
      assert.ok('categories' in stats);
      assert.ok(stats.total_modules > 0);
    });
  });

  describe('search', () => {
    it('should find modules by keyword', () => {
      const results = registry.search('storage');
      
      assert.ok(results.length > 0);
    });

    it('should be case-insensitive', () => {
      const resultsLower = registry.search('storage');
      const resultsUpper = registry.search('STORAGE');
      
      assert.equal(resultsLower.length, resultsUpper.length);
    });

    it('should return empty array for no matches', () => {
      const results = registry.search('nonexistentkeyword12345');
      
      assert.deepEqual(results, []);
    });
  });

  describe('Cache Management', () => {
    it('should cache results', () => {
      assert.equal(registry.cache.data.size, 0);
      
      registry.findModuleByResourceType('Microsoft.Storage/storageAccounts');
      
      assert.ok(registry.cache.data.size > 0);
    });

    it('should clear cache', () => {
      registry.findModuleByResourceType('Microsoft.Storage/storageAccounts');
      registry.clearCache();
      
      assert.equal(registry.cache.data.size, 0);
    });
  });

  describe('Module Structure', () => {
    it('should have required properties', () => {
      const module = registry.findModuleById('br:avm/storage:latest');
      
      assert.ok('id' in module);
      assert.ok('name' in module);
      assert.ok('parameters' in module);
      assert.ok('outputs' in module);
    });

    it('should have valid parameters', () => {
      const module = registry.findModuleById('br:avm/storage:latest');
      
      assert.ok(module.parameters.location !== undefined);
      assert.equal(module.parameters.location.type, 'string');
    });

    it('should import all domain files in modules index', () => {
      const testDir = path.dirname(fileURLToPath(import.meta.url));
      const modulesDir = path.resolve(testDir, '../modules');
      const indexPath = path.join(modulesDir, 'index.js');

      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const domainFiles = fs
        .readdirSync(modulesDir)
        .filter((f) => f.endsWith('.js') && f !== 'index.js');

      const missing = [];
      for (const file of domainFiles) {
        const fileLiteral = `./${file}`;
        const importRegex = new RegExp(`from\\s+['\"]${fileLiteral.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}['\"]`);
        if (!importRegex.test(indexContent)) {
          missing.push(file);
        }
      }

      assert.deepEqual(
        missing,
        [],
        `modules/index.js is missing imports for: ${missing.join(', ')}`
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null resource type', () => {
      const module = registry.findModuleByResourceType(null);
      
      assert.equal(module, null);
    });

    it('should handle empty search query', () => {
      const results = registry.search('');
      
      assert.deepEqual(results, []);
    });
  });
});
