import { BicepImplementAgent } from '../agents/BicepImplementAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('BicepImplementAgent', () => {
  let bicepImplementer;

  beforeEach(async () => {
    bicepImplementer = new BicepImplementAgent();
    await bicepImplementer.initialize();
  });

  afterEach(async () => {
    await bicepImplementer.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(bicepImplementer.id).toBe('bicep-implement');
      expect(bicepImplementer.name).toBe('Bicep Implementation Agent');
      expect(bicepImplementer.state).toBe('ready');
    });

    it('should initialize code cache', () => {
      expect(bicepImplementer.codeCache).toBeDefined();
      expect(bicepImplementer.codeCache.size).toBe(0);
    });
  });

  describe('Main Template Generation', () => {
    it('should generate main template', async () => {
      const input = {
        bicepPlan: {
          targetScope: 'subscription',
          location: 'eastus'
        },
        modules: [
          {
            name: 'networking',
            fileName: 'modules/networking.bicep',
            parameters: [],
            outputs: []
          }
        ]
      };

      const result = await bicepImplementer.execute(input);

      expect(result.mainTemplate).toBeDefined();
      expect(result.mainTemplate).toContain('targetScope');
      expect(result.mainTemplate).toContain('main.bicep');
    });

    it('should include target scope', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);

      expect(result.mainTemplate).toContain("targetScope = 'subscription'");
    });

    it('should include parameters', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);

      expect(result.mainTemplate).toContain('param environment');
      expect(result.mainTemplate).toContain('param location');
      expect(result.mainTemplate).toContain('param projectName');
    });

    it('should include resource group for subscription scope', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);

      expect(result.mainTemplate).toContain('Microsoft.Resources/resourceGroups');
    });

    it('should include module deployments', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: [
          { name: 'networking', fileName: 'modules/networking.bicep' }
        ]
      };

      const result = await bicepImplementer.execute(input);

      expect(result.mainTemplate).toContain('module networking');
      expect(result.mainTemplate).toContain('modules/networking.bicep');
    });
  });

  describe('Module File Generation', () => {
    it('should generate module files', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: [
          {
            name: 'networking',
            fileName: 'modules/networking.bicep',
            description: 'Networking module'
          }
        ]
      };

      const result = await bicepImplementer.execute(input);

      expect(result.moduleFiles).toBeDefined();
      expect(result.moduleFiles.length).toBe(1);
      expect(result.moduleFiles[0].path).toBe('modules/networking.bicep');
    });

    it('should include module parameters', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: [
          {
            name: 'networking',
            fileName: 'modules/networking.bicep',
            parameters: [
              { name: 'vnetName', type: 'string' },
              { name: 'vnetCidr', type: 'string', default: '10.0.0.0/16' }
            ]
          }
        ]
      };

      const result = await bicepImplementer.execute(input);
      const moduleContent = result.moduleFiles[0].content;

      expect(moduleContent).toContain('param vnetName');
      expect(moduleContent).toContain('param vnetCidr');
    });

    it('should include module resources', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: [
          {
            name: 'networking',
            fileName: 'modules/networking.bicep',
            resources: [
              {
                type: 'Microsoft.Network/virtualNetworks',
                apiVersion: '2023-05-01',
                properties: {}
              }
            ]
          }
        ]
      };

      const result = await bicepImplementer.execute(input);
      const moduleContent = result.moduleFiles[0].content;

      expect(moduleContent).toContain('Microsoft.Network/virtualNetworks');
      expect(moduleContent).toContain('resource');
    });

    it('should include module outputs', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: [
          {
            name: 'networking',
            fileName: 'modules/networking.bicep',
            outputs: [
              { name: 'vnetId', type: 'string', value: 'vnet.id' }
            ]
          }
        ]
      };

      const result = await bicepImplementer.execute(input);
      const moduleContent = result.moduleFiles[0].content;

      expect(moduleContent).toContain('output vnetId');
    });
  });

  describe('Parameter File Generation', () => {
    it('should generate parameter files', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: [],
        parameters: {}
      };

      const result = await bicepImplementer.execute(input);

      expect(result.parameterFiles).toBeDefined();
      expect(result.parameterFiles.dev).toBeDefined();
      expect(result.parameterFiles.prod).toBeDefined();
    });

    it('should include dev parameters', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);
      const devParams = JSON.parse(result.parameterFiles.dev);

      expect(devParams.parameters.environment.value).toBe('dev');
    });

    it('should include prod parameters', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);
      const prodParams = JSON.parse(result.parameterFiles.prod);

      expect(prodParams.parameters.environment.value).toBe('prod');
    });

    it('should use correct schema', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);
      const devParams = JSON.parse(result.parameterFiles.dev);

      expect(devParams.$schema).toContain('deploymentParameters.json');
    });
  });

  describe('File Collection', () => {
    it('should collect all generated files', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: [
          { name: 'networking', fileName: 'modules/networking.bicep' },
          { name: 'compute', fileName: 'modules/compute.bicep' }
        ]
      };

      const result = await bicepImplementer.execute(input);

      expect(result.files.length).toBeGreaterThan(0);
      expect(result.files.some(f => f.type === 'main')).toBe(true);
      expect(result.files.some(f => f.type === 'module')).toBe(true);
      expect(result.files.some(f => f.type === 'parameters')).toBe(true);
    });

    it('should include main template file', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);
      const mainFile = result.files.find(f => f.path === 'main.bicep');

      expect(mainFile).toBeDefined();
      expect(mainFile.type).toBe('main');
    });

    it('should include parameter files', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);
      const devParamFile = result.files.find(f => f.path === 'parameters.dev.json');
      const prodParamFile = result.files.find(f => f.path === 'parameters.prod.json');

      expect(devParamFile).toBeDefined();
      expect(prodParamFile).toBeDefined();
    });
  });

  describe('Summary Generation', () => {
    it('should generate summary with file count', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: [
          { name: 'networking', fileName: 'modules/networking.bicep' }
        ]
      };

      const result = await bicepImplementer.execute(input);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalFiles).toBeGreaterThan(0);
      expect(result.summary.modules).toBe(1);
    });

    it('should count lines of code', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);

      expect(result.summary.linesOfCode).toBeGreaterThan(0);
    });
  });

  describe('Caching', () => {
    it('should cache generated code', async () => {
      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      const result = await bicepImplementer.execute(input);
      const cached = bicepImplementer.getCode(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.executionId).toBe(result.executionId);
    });

    it('should list generated code', async () => {
      await bicepImplementer.execute({
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      });

      const list = bicepImplementer.listGeneratedCode();

      expect(list.length).toBe(1);
      expect(list[0].filesGenerated).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      await expect(async () => {
        await bicepImplementer.execute(null);
      }).rejects.toThrow();
    });

    it('should reject missing required fields', async () => {
      await expect(async () => {
        await bicepImplementer.execute({});
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit bicep-code-generated event', async () => {
      const events = [];
      bicepImplementer.on('bicep-code-generated', (evt) => {
        events.push(evt);
      });

      const input = {
        bicepPlan: { targetScope: 'subscription', location: 'eastus' },
        modules: []
      };

      await bicepImplementer.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('filesGenerated');
    });
  });
});
