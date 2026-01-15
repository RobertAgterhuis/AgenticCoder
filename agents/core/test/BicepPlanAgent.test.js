import { BicepPlanAgent } from '../agents/BicepPlanAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('BicepPlanAgent', () => {
  let bicepPlanner;

  beforeEach(async () => {
    bicepPlanner = new BicepPlanAgent();
    await bicepPlanner.initialize();
  });

  afterEach(async () => {
    await bicepPlanner.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(bicepPlanner.id).toBe('bicep-plan');
      expect(bicepPlanner.name).toBe('Bicep Planning Agent');
      expect(bicepPlanner.state).toBe('ready');
    });

    it('should initialize plan cache', () => {
      expect(bicepPlanner.planCache).toBeDefined();
      expect(bicepPlanner.planCache.size).toBe(0);
    });

    it('should initialize module templates', () => {
      expect(bicepPlanner.moduleTemplates).toBeDefined();
      expect(bicepPlanner.moduleTemplates.networking).toBeDefined();
    });

    it('should initialize best practices', () => {
      expect(bicepPlanner.bestPractices).toBeDefined();
      expect(Array.isArray(bicepPlanner.bestPractices)).toBe(true);
    });
  });

  describe('Bicep Plan Generation', () => {
    it('should generate comprehensive Bicep plan', async () => {
      const input = {
        azureArchitecture: {
          regions: { primary: { name: 'eastus' }, secondary: { name: 'westus2' } }
        },
        services: {
          compute: [{ service: 'Azure App Service' }],
          storage: [{ service: 'Azure Blob Storage' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      expect(result.bicepPlan).toBeDefined();
      expect(result.bicepPlan).toHaveProperty('targetScope');
      expect(result.bicepPlan).toHaveProperty('structure');
      expect(result.bicepPlan).toHaveProperty('deploymentMode');
    });

    it('should set correct target scope', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.bicepPlan.targetScope).toBe('subscription');
    });

    it('should include naming convention', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.bicepPlan.namingConvention).toBeDefined();
      expect(result.bicepPlan.namingConvention).toHaveProperty('pattern');
    });

    it('should include tagging strategy', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.bicepPlan.taggingStrategy).toBeDefined();
      expect(result.bicepPlan.taggingStrategy).toHaveProperty('required');
    });
  });

  describe('Module Definition', () => {
    it('should define Bicep modules', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }],
          compute: [{ service: 'Azure App Service' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      expect(result.modules).toBeDefined();
      expect(Array.isArray(result.modules)).toBe(true);
      expect(result.modules.length).toBeGreaterThan(0);
    });

    it('should create networking module when networking services present', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const networkingModule = result.modules.find(m => m.name === 'networking');

      expect(networkingModule).toBeDefined();
      expect(networkingModule.fileName).toBe('modules/networking.bicep');
      expect(networkingModule.resources).toBeDefined();
    });

    it('should create security module when security services present', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          security: [{ service: 'Azure Key Vault' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const securityModule = result.modules.find(m => m.name === 'security');

      expect(securityModule).toBeDefined();
      expect(securityModule.fileName).toBe('modules/security.bicep');
    });

    it('should create storage module when storage services present', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          storage: [{ service: 'Azure Blob Storage' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const storageModule = result.modules.find(m => m.name === 'storage');

      expect(storageModule).toBeDefined();
      expect(storageModule.fileName).toBe('modules/storage.bicep');
    });

    it('should create database module when database services present', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          database: [{ service: 'Azure SQL Database' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const databaseModule = result.modules.find(m => m.name === 'database');

      expect(databaseModule).toBeDefined();
      expect(databaseModule.fileName).toBe('modules/database.bicep');
    });

    it('should create compute module when compute services present', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          compute: [{ service: 'Azure App Service' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const computeModule = result.modules.find(m => m.name === 'compute');

      expect(computeModule).toBeDefined();
      expect(computeModule.fileName).toBe('modules/compute.bicep');
    });

    it('should create monitoring module when monitoring services present', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          monitoring: [{ service: 'Azure Monitor' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const monitoringModule = result.modules.find(m => m.name === 'monitoring');

      expect(monitoringModule).toBeDefined();
      expect(monitoringModule.fileName).toBe('modules/monitoring.bicep');
    });

    it('should include module parameters', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const networkingModule = result.modules.find(m => m.name === 'networking');

      expect(networkingModule.parameters).toBeDefined();
      expect(Array.isArray(networkingModule.parameters)).toBe(true);
      expect(networkingModule.parameters.length).toBeGreaterThan(0);
    });

    it('should include module outputs', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const networkingModule = result.modules.find(m => m.name === 'networking');

      expect(networkingModule.outputs).toBeDefined();
      expect(Array.isArray(networkingModule.outputs)).toBe(true);
    });

    it('should define module dependencies', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          storage: [{ service: 'Azure Blob Storage' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const storageModule = result.modules.find(m => m.name === 'storage');

      expect(storageModule.dependencies).toBeDefined();
      expect(Array.isArray(storageModule.dependencies)).toBe(true);
    });
  });

  describe('Parameter Definition', () => {
    it('should define parameters', async () => {
      const input = {
        azureArchitecture: { regions: { primary: { name: 'eastus' } } },
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.parameters).toBeDefined();
      expect(typeof result.parameters).toBe('object');
    });

    it('should include environment parameter', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.parameters.environment).toBeDefined();
      expect(result.parameters.environment.type).toBe('string');
      expect(result.parameters.environment.allowedValues).toContain('dev');
      expect(result.parameters.environment.allowedValues).toContain('prod');
    });

    it('should include location parameters', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.parameters.location).toBeDefined();
      expect(result.parameters.secondaryLocation).toBeDefined();
    });

    it('should include tags parameter', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.parameters.tags).toBeDefined();
      expect(result.parameters.tags.type).toBe('object');
    });
  });

  describe('Resource Definition', () => {
    it('should define resources', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          compute: [{ service: 'Azure App Service' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      expect(result.resources).toBeDefined();
      expect(Array.isArray(result.resources)).toBe(true);
      expect(result.resources.length).toBeGreaterThan(0);
    });

    it('should include resource type and API version', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          storage: [{ service: 'Azure Blob Storage' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      result.resources.forEach(resource => {
        expect(resource).toHaveProperty('type');
        expect(resource).toHaveProperty('apiVersion');
      });
    });

    it('should link resources to modules', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      result.resources.forEach(resource => {
        expect(resource).toHaveProperty('module');
      });
    });
  });

  describe('Deployment Strategy', () => {
    it('should create deployment strategy', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          compute: [{ service: 'Azure App Service' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      expect(result.deploymentStrategy).toBeDefined();
      expect(result.deploymentStrategy).toHaveProperty('approach');
      expect(result.deploymentStrategy).toHaveProperty('phases');
    });

    it('should define deployment phases', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }],
          compute: [{ service: 'Azure App Service' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const phases = result.deploymentStrategy.phases;

      expect(Array.isArray(phases)).toBe(true);
      expect(phases.length).toBeGreaterThan(0);
      expect(phases[0]).toHaveProperty('phase');
      expect(phases[0]).toHaveProperty('name');
      expect(phases[0]).toHaveProperty('modules');
    });

    it('should include validation steps', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.deploymentStrategy.validationSteps).toBeDefined();
      expect(Array.isArray(result.deploymentStrategy.validationSteps)).toBe(true);
    });

    it('should include post-deployment steps', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.deploymentStrategy.postDeploymentSteps).toBeDefined();
      expect(Array.isArray(result.deploymentStrategy.postDeploymentSteps)).toBe(true);
    });

    it('should estimate deployment time', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      expect(result.deploymentStrategy.estimatedTime).toBeDefined();
      expect(typeof result.deploymentStrategy.estimatedTime).toBe('string');
    });
  });

  describe('Validation', () => {
    it('should validate Bicep plan', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      expect(result.validation).toBeDefined();
      expect(result.validation).toHaveProperty('valid');
      expect(result.validation).toHaveProperty('issues');
      expect(result.validation).toHaveProperty('warnings');
      expect(result.validation).toHaveProperty('recommendations');
    });

    it('should detect missing dependencies', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          storage: [{ service: 'Azure Blob Storage' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      
      expect(result.validation.warnings).toBeDefined();
      expect(Array.isArray(result.validation.warnings)).toBe(true);
    });

    it('should provide recommendations', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.validation.recommendations).toBeDefined();
      expect(result.validation.recommendations.length).toBeGreaterThan(0);
    });

    it('should include validation summary', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.validation.summary).toBeDefined();
      expect(result.validation.summary).toHaveProperty('totalIssues');
      expect(result.validation.summary).toHaveProperty('totalWarnings');
    });
  });

  describe('Best Practices', () => {
    it('should generate best practices report', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      expect(result.bestPractices).toBeDefined();
      expect(result.bestPractices).toHaveProperty('modularity');
      expect(result.bestPractices).toHaveProperty('security');
      expect(result.bestPractices).toHaveProperty('monitoring');
    });

    it('should score modularity', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          networking: [{ service: 'Azure Virtual Network' }],
          security: [{ service: 'Azure Key Vault' }],
          storage: [{ service: 'Azure Blob Storage' }],
          database: [{ service: 'Azure SQL Database' }],
          compute: [{ service: 'Azure App Service' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      expect(result.bestPractices.modularity.score).toBe('Good');
    });

    it('should include recommendations', async () => {
      const input = {
        azureArchitecture: {},
        services: {}
      };

      const result = await bicepPlanner.execute(input);

      expect(result.bestPractices.recommendations).toBeDefined();
      expect(Array.isArray(result.bestPractices.recommendations)).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache Bicep plans', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          compute: [{ service: 'Azure App Service' }]
        }
      };

      const result = await bicepPlanner.execute(input);
      const cached = bicepPlanner.getPlan(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.executionId).toBe(result.executionId);
    });

    it('should list cached plans', async () => {
      const input1 = {
        azureArchitecture: {},
        services: { compute: [{ service: 'Azure App Service' }] }
      };
      const input2 = {
        azureArchitecture: {},
        services: { storage: [{ service: 'Azure Blob Storage' }] }
      };

      await bicepPlanner.execute(input1);
      await bicepPlanner.execute(input2);

      const list = bicepPlanner.listPlans();
      expect(list.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      expect(async () => {
        await bicepPlanner.execute(null);
      }).rejects.toThrow();
    });

    it('should reject missing required fields', async () => {
      expect(async () => {
        await bicepPlanner.execute({});
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit bicep-plan-complete event', async () => {
      const events = [];
      bicepPlanner.on('bicep-plan-complete', (evt) => {
        events.push(evt);
      });

      const input = {
        azureArchitecture: {},
        services: {
          compute: [{ service: 'Azure App Service' }]
        }
      };

      await bicepPlanner.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('modulesGenerated');
      expect(events[0]).toHaveProperty('resourcesPlanned');
    });
  });

  describe('Summary Generation', () => {
    it('should generate execution summary', async () => {
      const input = {
        azureArchitecture: {},
        services: {
          compute: [{ service: 'Azure App Service' }]
        }
      };

      const result = await bicepPlanner.execute(input);

      expect(result.summary).toBeDefined();
      expect(result.summary).toHaveProperty('totalModules');
      expect(result.summary).toHaveProperty('totalResources');
      expect(result.summary).toHaveProperty('totalParameters');
      expect(result.summary).toHaveProperty('estimatedDeploymentTime');
    });
  });
});
