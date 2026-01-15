import { CodeArchitectAgent } from '../agents/CodeArchitectAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('CodeArchitectAgent', () => {
  let codeArchitect;

  beforeEach(async () => {
    codeArchitect = new CodeArchitectAgent();
    await codeArchitect.initialize();
  });

  afterEach(async () => {
    await codeArchitect.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(codeArchitect.id).toBe('code-architect');
      expect(codeArchitect.name).toBe('Code Architect');
      expect(codeArchitect.state).toBe('ready');
    });

    it('should setup design cache', () => {
      expect(codeArchitect.designCache).toBeDefined();
      expect(codeArchitect.designCache.size).toBe(0);
    });

    it('should setup design patterns', () => {
      expect(codeArchitect.designPatterns).toBeDefined();
      expect(codeArchitect.designPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Code Architecture Design', () => {
    it('should design code architecture from requirements', async () => {
      const input = {
        title: 'E-commerce Backend',
        requirements: {
          complexity: 'high',
          entities: ['User', 'Product', 'Order', 'Payment']
        }
      };

      const result = await codeArchitect.execute(input);

      expect(result.success).toBe(true);
      expect(result.design).toBeDefined();
      expect(result.design.title).toContain('E-commerce');
    });

    it('should create comprehensive design document', async () => {
      const input = {
        title: 'Test System',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const design = result.design;

      expect(design).toHaveProperty('codeStructure');
      expect(design).toHaveProperty('modules');
      expect(design).toHaveProperty('entities');
      expect(design).toHaveProperty('apiDesign');
      expect(design).toHaveProperty('designPatterns');
      expect(design).toHaveProperty('classHierarchy');
      expect(design).toHaveProperty('layeredStructure');
      expect(design).toHaveProperty('dependencies');
      expect(design).toHaveProperty('codingStandards');
      expect(design).toHaveProperty('errorHandling');
      expect(design).toHaveProperty('loggingStrategy');
      expect(design).toHaveProperty('testingStrategy');
    });
  });

  describe('Code Structure', () => {
    it('should design code structure', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const structure = result.design.codeStructure;

      expect(structure).toHaveProperty('style');
      expect(structure).toHaveProperty('topLevelDirs');
      expect(structure).toHaveProperty('buildSystem');
    });

    it('should include essential directories', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const dirs = result.design.codeStructure.topLevelDirs;
      const dirNames = dirs.map(d => d.name);

      expect(dirNames).toContain('src');
      expect(dirNames).toContain('tests');
      expect(dirNames).toContain('config');
      expect(dirNames).toContain('docs');
    });
  });

  describe('Module Definition', () => {
    it('should define logical modules', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const modules = result.design.modules;

      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThan(0);
    });

    it('should define module responsibilities', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const modules = result.design.modules;
      const module = modules[0];

      expect(module).toHaveProperty('name');
      expect(module).toHaveProperty('purpose');
      expect(module).toHaveProperty('exports');
      expect(module).toHaveProperty('dependencies');
      expect(module).toHaveProperty('testStrategy');
    });

    it('should include core modules', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const modules = result.design.modules;
      const moduleNames = modules.map(m => m.name);

      expect(moduleNames).toContain('Authentication Module');
      expect(moduleNames).toContain('Domain Module');
      expect(moduleNames).toContain('Application Services');
    });
  });

  describe('Data Model Design', () => {
    it('should design data entities', async () => {
      const input = {
        title: 'App',
        requirements: { entities: ['User', 'Product'] }
      };

      const result = await codeArchitect.execute(input);
      const entities = result.design.entities;

      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBeGreaterThan(0);
    });

    it('should define entity attributes', async () => {
      const input = {
        title: 'App',
        requirements: { entities: ['User'] }
      };

      const result = await codeArchitect.execute(input);
      const entities = result.design.entities;
      const entity = entities[0];

      expect(entity).toHaveProperty('name');
      expect(entity).toHaveProperty('attributes');
      expect(Array.isArray(entity.attributes)).toBe(true);
      expect(entity.attributes[0]).toHaveProperty('name');
      expect(entity.attributes[0]).toHaveProperty('type');
    });

    it('should define entity relationships', async () => {
      const input = {
        title: 'App',
        requirements: { entities: ['User', 'Order'] }
      };

      const result = await codeArchitect.execute(input);
      const entities = result.design.entities;
      const entity = entities.find(e => e.name === 'Order Entity');

      expect(entity).toBeDefined();
      expect(entity.relationships).toBeDefined();
      expect(Array.isArray(entity.relationships)).toBe(true);
    });
  });

  describe('API Design', () => {
    it('should design API endpoints', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const apiDesign = result.design.apiDesign;

      expect(apiDesign).toHaveProperty('endpoints');
      expect(Array.isArray(apiDesign.endpoints)).toBe(true);
      expect(apiDesign.endpoints.length).toBeGreaterThan(0);
    });

    it('should define endpoint details', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const endpoint = result.design.apiDesign.endpoints[0];

      expect(endpoint).toHaveProperty('path');
      expect(endpoint).toHaveProperty('method');
      expect(endpoint).toHaveProperty('description');
      expect(endpoint).toHaveProperty('request');
      expect(endpoint).toHaveProperty('response');
      expect(endpoint).toHaveProperty('statusCodes');
      expect(endpoint).toHaveProperty('authentication');
    });

    it('should define API strategy', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const apiDesign = result.design.apiDesign;

      expect(apiDesign).toHaveProperty('versioningStrategy');
      expect(apiDesign).toHaveProperty('rateLimiting');
      expect(apiDesign).toHaveProperty('cachingStrategy');
      expect(apiDesign).toHaveProperty('errorFormat');
    });
  });

  describe('Design Patterns', () => {
    it('should identify design patterns', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'high' }
      };

      const result = await codeArchitect.execute(input);
      const patterns = result.design.designPatterns;

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should describe pattern benefits and tradeoffs', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const patterns = result.design.designPatterns;
      const pattern = patterns[0];

      expect(pattern).toHaveProperty('pattern');
      expect(pattern).toHaveProperty('purpose');
      expect(pattern).toHaveProperty('benefits');
    });

    it('should include repository pattern', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const patterns = result.design.designPatterns;
      const repository = patterns.find(p => p.pattern === 'Repository Pattern');

      expect(repository).toBeDefined();
    });
  });

  describe('Class Hierarchy', () => {
    it('should design class hierarchy', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const hierarchy = result.design.classHierarchy;

      expect(hierarchy).toHaveProperty('baseClasses');
      expect(hierarchy).toHaveProperty('interfaces');
      expect(hierarchy).toHaveProperty('abstractClasses');
    });

    it('should define base classes', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const baseClasses = result.design.classHierarchy.baseClasses;

      expect(Array.isArray(baseClasses)).toBe(true);
      expect(baseClasses.length).toBeGreaterThan(0);
    });

    it('should define interfaces', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const interfaces = result.design.classHierarchy.interfaces;

      expect(Array.isArray(interfaces)).toBe(true);
      expect(interfaces.length).toBeGreaterThan(0);
    });
  });

  describe('Layered Architecture', () => {
    it('should design layered structure', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const layered = result.design.layeredStructure;

      expect(layered).toHaveProperty('layers');
      expect(layered).toHaveProperty('crossCuttingConcerns');
    });

    it('should include standard layers', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const layers = result.design.layeredStructure.layers;
      const layerNames = layers.map(l => l.layer);

      expect(layerNames).toContain('Domain Layer');
      expect(layerNames).toContain('Application Layer');
      expect(layerNames).toContain('Infrastructure Layer');
      expect(layerNames).toContain('Presentation Layer');
    });
  });

  describe('Coding Standards', () => {
    it('should define coding standards', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const standards = result.design.codingStandards;

      expect(standards).toHaveProperty('namingConventions');
      expect(standards).toHaveProperty('fileOrganization');
      expect(standards).toHaveProperty('codeStyle');
      expect(standards).toHaveProperty('documentation');
      expect(standards).toHaveProperty('bestPractices');
    });

    it('should define naming conventions', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const conventions = result.design.codingStandards.namingConventions;

      expect(conventions).toHaveProperty('classes');
      expect(conventions).toHaveProperty('methods');
      expect(conventions).toHaveProperty('variables');
    });
  });

  describe('Error Handling', () => {
    it('should design error handling strategy', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const errorHandling = result.design.errorHandling;

      expect(errorHandling).toHaveProperty('strategy');
      expect(errorHandling).toHaveProperty('customExceptions');
      expect(errorHandling).toHaveProperty('globalErrorHandler');
    });

    it('should define custom exceptions', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const exceptions = result.design.errorHandling.customExceptions;

      expect(Array.isArray(exceptions)).toBe(true);
      expect(exceptions.length).toBeGreaterThan(0);
      expect(exceptions[0]).toHaveProperty('name');
      expect(exceptions[0]).toHaveProperty('httpStatus');
    });
  });

  describe('Logging Strategy', () => {
    it('should plan logging strategy', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const logging = result.design.loggingStrategy;

      expect(logging).toHaveProperty('framework');
      expect(logging).toHaveProperty('levels');
      expect(logging).toHaveProperty('events');
      expect(logging).toHaveProperty('contextInformation');
    });
  });

  describe('Testing Strategy', () => {
    it('should plan testing strategy', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const testing = result.design.testingStrategy;

      expect(testing).toHaveProperty('targetCoverage');
      expect(testing).toHaveProperty('pyramid');
      expect(testing).toHaveProperty('testingApproaches');
      expect(testing).toHaveProperty('mockingStrategy');
    });

    it('should define test coverage target', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const coverage = result.design.testingStrategy.targetCoverage;

      expect(coverage).toBeDefined();
      expect(coverage).toContain('80%');
    });
  });

  describe('Performance Considerations', () => {
    it('should identify performance issues', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'high' }
      };

      const result = await codeArchitect.execute(input);
      const issues = result.design.performanceConsiderations;

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should provide performance solutions', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const issues = result.design.performanceConsiderations;
      const issue = issues[0];

      expect(issue).toHaveProperty('issue');
      expect(issue).toHaveProperty('solution');
      expect(issue).toHaveProperty('priority');
    });
  });

  describe('Security Considerations', () => {
    it('should identify security issues', async () => {
      const input = {
        title: 'App',
        requirements: { security: 'high' }
      };

      const result = await codeArchitect.execute(input);
      const issues = result.design.securityConsiderations;

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should provide security mitigations', async () => {
      const input = {
        title: 'App',
        requirements: { security: 'high' }
      };

      const result = await codeArchitect.execute(input);
      const issues = result.design.securityConsiderations;
      const issue = issues[0];

      expect(issue).toHaveProperty('issue');
      expect(issue).toHaveProperty('solution');
      expect(issue).toHaveProperty('mitigation');
    });
  });

  describe('Caching', () => {
    it('should cache design documents', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);
      const cached = codeArchitect.getDesign(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.id).toBe(result.executionId);
    });

    it('should list cached designs', async () => {
      const input1 = { title: 'App 1', requirements: { complexity: 'medium' } };
      const input2 = { title: 'App 2', requirements: { complexity: 'high' } };

      const result1 = await codeArchitect.execute(input1);
      const result2 = await codeArchitect.execute(input2);

      const list = codeArchitect.listDesigns();
      expect(list.length).toBe(2);
      expect(list.map(d => d.id)).toContain(result1.executionId);
      expect(list.map(d => d.id)).toContain(result2.executionId);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      expect(async () => {
        await codeArchitect.execute(null);
      }).rejects.toThrow();
    });

    it('should reject input without title or requirements', async () => {
      expect(async () => {
        await codeArchitect.execute({});
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit code-architecture-designed event', async () => {
      const events = [];
      codeArchitect.on('code-architecture-designed', (evt) => {
        events.push(evt);
      });

      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      await codeArchitect.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('moduleCount');
    });
  });

  describe('Summary', () => {
    it('should generate execution summary', async () => {
      const input = {
        title: 'App',
        requirements: { complexity: 'medium' }
      };

      const result = await codeArchitect.execute(input);

      expect(result.summary).toHaveProperty('modules');
      expect(result.summary).toHaveProperty('patterns');
      expect(result.summary).toHaveProperty('entities');
      expect(result.summary).toHaveProperty('apis');
      expect(result.summary).toHaveProperty('testCoverage');
    });
  });
});
