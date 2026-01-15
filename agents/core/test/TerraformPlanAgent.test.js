import { TerraformPlanAgent } from '../agents/TerraformPlanAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('TerraformPlanAgent', () => {
  let terraformPlanner;

  beforeEach(async () => {
    terraformPlanner = new TerraformPlanAgent();
    await terraformPlanner.initialize();
  });

  afterEach(async () => {
    await terraformPlanner.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(terraformPlanner.id).toBe('terraform-plan');
      expect(terraformPlanner.name).toBe('Terraform Planning Agent');
      expect(terraformPlanner.state).toBe('ready');
    });

    it('should initialize plan cache', () => {
      expect(terraformPlanner.planCache).toBeDefined();
      expect(terraformPlanner.planCache.size).toBe(0);
    });

    it('should initialize provider configuration', () => {
      expect(terraformPlanner.providerConfig).toBeDefined();
      expect(terraformPlanner.providerConfig.aws).toBeDefined();
      expect(terraformPlanner.providerConfig.azure).toBeDefined();
      expect(terraformPlanner.providerConfig.gcp).toBeDefined();
    });
  });

  describe('Terraform Plan Generation', () => {
    it('should generate Terraform plan for AWS', async () => {
      const input = {
        architecture: {},
        services: { compute: [{ service: 'EC2' }] },
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.terraformPlan).toBeDefined();
      expect(result.terraformPlan.cloudProvider).toBe('aws');
      expect(result.terraformPlan.requiredVersion).toBeDefined();
    });

    it('should generate Terraform plan for Azure', async () => {
      const input = {
        architecture: {},
        services: { compute: [{ service: 'VM' }] },
        cloudProvider: 'azure'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.terraformPlan.cloudProvider).toBe('azure');
    });

    it('should generate Terraform plan for GCP', async () => {
      const input = {
        architecture: {},
        services: { compute: [{ service: 'Compute Engine' }] },
        cloudProvider: 'gcp'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.terraformPlan.cloudProvider).toBe('gcp');
    });

    it('should support multi-cloud configuration', async () => {
      const input = {
        architecture: {},
        services: { compute: [{ service: 'Multi' }] },
        cloudProvider: 'multi-cloud'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.terraformPlan.cloudProvider).toBe('multi-cloud');
      expect(result.terraformPlan.providers.length).toBeGreaterThan(1);
    });

    it('should include workspaces configuration', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.terraformPlan.workspaces).toBeDefined();
      expect(result.terraformPlan.workspaces).toContain('dev');
      expect(result.terraformPlan.workspaces).toContain('prod');
    });
  });

  describe('Module Definition', () => {
    it('should define modules based on services', async () => {
      const input = {
        architecture: {},
        services: {
          networking: [{ service: 'VPC' }],
          compute: [{ service: 'EC2' }]
        },
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.modules).toBeDefined();
      expect(result.modules.length).toBeGreaterThan(0);
    });

    it('should create networking module for AWS', async () => {
      const input = {
        architecture: {},
        services: { networking: [{ service: 'VPC' }] },
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);
      const networkingModule = result.modules.find(m => m.name === 'networking');

      expect(networkingModule).toBeDefined();
      expect(networkingModule.provider).toBe('aws');
      expect(networkingModule.resources).toContain('aws_vpc');
    });

    it('should create networking module for Azure', async () => {
      const input = {
        architecture: {},
        services: { networking: [{ service: 'VNet' }] },
        cloudProvider: 'azure'
      };

      const result = await terraformPlanner.execute(input);
      const networkingModule = result.modules.find(m => m.name === 'networking');

      expect(networkingModule).toBeDefined();
      expect(networkingModule.resources).toContain('azurerm_virtual_network');
    });

    it('should create compute module', async () => {
      const input = {
        architecture: {},
        services: { compute: [{ service: 'EC2' }] },
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);
      const computeModule = result.modules.find(m => m.name === 'compute');

      expect(computeModule).toBeDefined();
      expect(computeModule.variables).toBeDefined();
    });

    it('should create storage module', async () => {
      const input = {
        architecture: {},
        services: { storage: [{ service: 'S3' }] },
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);
      const storageModule = result.modules.find(m => m.name === 'storage');

      expect(storageModule).toBeDefined();
      expect(storageModule.resources).toContain('aws_s3_bucket');
    });

    it('should create database module', async () => {
      const input = {
        architecture: {},
        services: { database: [{ service: 'RDS' }] },
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);
      const databaseModule = result.modules.find(m => m.name === 'database');

      expect(databaseModule).toBeDefined();
    });

    it('should create security module', async () => {
      const input = {
        architecture: {},
        services: { security: [{ service: 'KMS' }] },
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);
      const securityModule = result.modules.find(m => m.name === 'security');

      expect(securityModule).toBeDefined();
    });
  });

  describe('Variables Definition', () => {
    it('should define variables', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.variables).toBeDefined();
      expect(result.variables.environment).toBeDefined();
      expect(result.variables.region).toBeDefined();
    });

    it('should include validation rules', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.variables.environment.validation).toBeDefined();
      expect(result.variables.project_name.validation).toBeDefined();
    });

    it('should set default region per provider', async () => {
      const awsInput = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const awsResult = await terraformPlanner.execute(awsInput);
      expect(awsResult.variables.region.default).toBe('us-east-1');

      const azureInput = {
        architecture: {},
        services: {},
        cloudProvider: 'azure'
      };

      const azureResult = await terraformPlanner.execute(azureInput);
      expect(azureResult.variables.region.default).toBe('eastus');
    });
  });

  describe('Backend Configuration', () => {
    it('should configure S3 backend for AWS', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.backend.type).toBe('s3');
      expect(result.backend.config.encrypt).toBe(true);
    });

    it('should configure Azure backend', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'azure'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.backend.type).toBe('azurerm');
    });

    it('should configure GCS backend for GCP', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'gcp'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.backend.type).toBe('gcs');
    });
  });

  describe('Workflow Creation', () => {
    it('should create deployment workflow', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.workflow).toBeDefined();
      expect(result.workflow.steps).toBeDefined();
      expect(result.workflow.steps.length).toBeGreaterThan(0);
    });

    it('should include init, validate, plan, apply steps', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);
      const stepNames = result.workflow.steps.map(s => s.name);

      expect(stepNames).toContain('Initialize');
      expect(stepNames).toContain('Validate');
      expect(stepNames).toContain('Plan');
      expect(stepNames).toContain('Apply');
    });

    it('should include CI/CD integration', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.workflow.cicdIntegration).toBeDefined();
      expect(result.workflow.cicdIntegration.preCommit).toBeDefined();
    });
  });

  describe('Best Practices', () => {
    it('should generate best practices report', async () => {
      const input = {
        architecture: {},
        services: { networking: [{}], compute: [{}], storage: [{}] },
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.bestPractices).toBeDefined();
      expect(result.bestPractices.structure).toBeDefined();
      expect(result.bestPractices.stateManagement).toBeDefined();
    });

    it('should include practice recommendations', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.bestPractices.practices).toBeDefined();
      expect(Array.isArray(result.bestPractices.practices)).toBe(true);
      expect(result.bestPractices.practices.length).toBeGreaterThan(0);
    });
  });

  describe('Caching', () => {
    it('should cache Terraform plans', async () => {
      const input = {
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);
      const cached = terraformPlanner.getPlan(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.executionId).toBe(result.executionId);
    });

    it('should list cached plans', async () => {
      await terraformPlanner.execute({
        architecture: {},
        services: {},
        cloudProvider: 'aws'
      });

      await terraformPlanner.execute({
        architecture: {},
        services: {},
        cloudProvider: 'azure'
      });

      const list = terraformPlanner.listPlans();
      expect(list.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      await expect(async () => {
        await terraformPlanner.execute(null);
      }).rejects.toThrow();
    });

    it('should reject missing cloud provider', async () => {
      await expect(async () => {
        await terraformPlanner.execute({
          architecture: {},
          services: {}
        });
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit terraform-plan-complete event', async () => {
      const events = [];
      terraformPlanner.on('terraform-plan-complete', (evt) => {
        events.push(evt);
      });

      const input = {
        architecture: {},
        services: { compute: [{ service: 'EC2' }] },
        cloudProvider: 'aws'
      };

      await terraformPlanner.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('cloudProvider');
    });
  });

  describe('Summary Generation', () => {
    it('should generate execution summary', async () => {
      const input = {
        architecture: {},
        services: { compute: [{ service: 'EC2' }] },
        cloudProvider: 'aws'
      };

      const result = await terraformPlanner.execute(input);

      expect(result.summary).toBeDefined();
      expect(result.summary).toHaveProperty('cloudProvider');
      expect(result.summary).toHaveProperty('totalModules');
      expect(result.summary).toHaveProperty('totalResources');
      expect(result.summary).toHaveProperty('estimatedDeploymentTime');
    });
  });
});
