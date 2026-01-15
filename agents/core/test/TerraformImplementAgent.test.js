import { TerraformImplementAgent } from '../agents/TerraformImplementAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('TerraformImplementAgent', () => {
  let terraformImplementer;

  beforeEach(async () => {
    terraformImplementer = new TerraformImplementAgent();
    await terraformImplementer.initialize();
  });

  afterEach(async () => {
    await terraformImplementer.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(terraformImplementer.id).toBe('terraform-implement');
      expect(terraformImplementer.name).toBe('Terraform Implementation Agent');
      expect(terraformImplementer.state).toBe('ready');
    });

    it('should initialize code cache', () => {
      expect(terraformImplementer.codeCache).toBeDefined();
      expect(terraformImplementer.codeCache.size).toBe(0);
    });
  });

  describe('Main Configuration Generation', () => {
    it('should generate main configuration', async () => {
      const input = {
        terraformPlan: {
          terraformVersion: '1.5',
          providers: ['aws']
        },
        modules: [
          {
            name: 'networking',
            path: 'modules/networking'
          }
        ]
      };

      const result = await terraformImplementer.execute(input);

      expect(result.mainConfig).toBeDefined();
      expect(result.mainConfig).toContain('terraform {');
      expect(result.mainConfig).toContain('required_version');
    });

    it('should include terraform block', async () => {
      const input = {
        terraformPlan: { terraformVersion: '1.5', providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.mainConfig).toContain('terraform {');
      expect(result.mainConfig).toContain('required_providers');
    });

    it('should include provider versions', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.mainConfig).toContain('hashicorp/aws');
      expect(result.mainConfig).toContain('version');
    });

    it('should include module calls', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          { name: 'networking', path: 'modules/networking' }
        ]
      };

      const result = await terraformImplementer.execute(input);

      expect(result.mainConfig).toContain('module "networking"');
      expect(result.mainConfig).toContain('source = "./modules/networking"');
    });

    it('should support multiple providers', async () => {
      const input = {
        terraformPlan: { providers: ['aws', 'azurerm'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.mainConfig).toContain('hashicorp/aws');
      expect(result.mainConfig).toContain('hashicorp/azurerm');
    });
  });

  describe('Provider Configuration', () => {
    it('should generate provider configuration', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.providerConfig).toBeDefined();
      expect(result.providerConfig).toContain('provider "aws"');
    });

    it('should include AWS provider config', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.providerConfig).toContain('region = var.aws_region');
      expect(result.providerConfig).toContain('default_tags');
    });

    it('should include Azure provider config', async () => {
      const input = {
        terraformPlan: { providers: ['azurerm'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.providerConfig).toContain('provider "azurerm"');
      expect(result.providerConfig).toContain('features {}');
    });

    it('should include GCP provider config', async () => {
      const input = {
        terraformPlan: { providers: ['google'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.providerConfig).toContain('provider "google"');
      expect(result.providerConfig).toContain('project');
    });
  });

  describe('Backend Configuration', () => {
    it('should generate backend configuration', async () => {
      const input = {
        terraformPlan: { backend: 's3', providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.backendConfig).toBeDefined();
      expect(result.backendConfig).toContain('backend "s3"');
    });

    it('should include S3 backend config', async () => {
      const input = {
        terraformPlan: { backend: 's3', providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.backendConfig).toContain('bucket');
      expect(result.backendConfig).toContain('dynamodb_table');
    });

    it('should include Azure backend config', async () => {
      const input = {
        terraformPlan: { backend: 'azurerm', providers: ['azurerm'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.backendConfig).toContain('backend "azurerm"');
      expect(result.backendConfig).toContain('storage_account_name');
    });

    it('should include GCS backend config', async () => {
      const input = {
        terraformPlan: { backend: 'gcs', providers: ['google'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.backendConfig).toContain('backend "gcs"');
    });
  });

  describe('Module File Generation', () => {
    it('should generate module files', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          {
            name: 'networking',
            path: 'modules/networking',
            description: 'Network infrastructure'
          }
        ]
      };

      const result = await terraformImplementer.execute(input);

      expect(result.moduleFiles).toBeDefined();
      expect(result.moduleFiles.length).toBeGreaterThan(0);
    });

    it('should create main.tf for module', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          { name: 'networking', path: 'modules/networking' }
        ]
      };

      const result = await terraformImplementer.execute(input);
      const mainFile = result.moduleFiles.find(f => f.path.includes('main.tf'));

      expect(mainFile).toBeDefined();
    });

    it('should create variables.tf for module', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          { name: 'networking', path: 'modules/networking' }
        ]
      };

      const result = await terraformImplementer.execute(input);
      const variablesFile = result.moduleFiles.find(f => f.path.includes('variables.tf'));

      expect(variablesFile).toBeDefined();
    });

    it('should create outputs.tf for module', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          { name: 'networking', path: 'modules/networking' }
        ]
      };

      const result = await terraformImplementer.execute(input);
      const outputsFile = result.moduleFiles.find(f => f.path.includes('outputs.tf'));

      expect(outputsFile).toBeDefined();
    });

    it('should include module resources', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          {
            name: 'networking',
            path: 'modules/networking',
            resources: [
              {
                type: 'aws_vpc',
                name: 'main',
                properties: { cidr_block: '10.0.0.0/16' }
              }
            ]
          }
        ]
      };

      const result = await terraformImplementer.execute(input);
      const mainFile = result.moduleFiles.find(f => f.path.includes('main.tf'));

      expect(mainFile.content).toContain('resource "aws_vpc"');
    });
  });

  describe('Variable Files Generation', () => {
    it('should generate variable definitions', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.variableFiles.definitions).toBeDefined();
      expect(result.variableFiles.definitions).toContain('variable "environment"');
    });

    it('should generate dev tfvars', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.variableFiles.dev).toBeDefined();
      expect(result.variableFiles.dev).toContain('environment  = "dev"');
    });

    it('should generate prod tfvars', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.variableFiles.prod).toBeDefined();
      expect(result.variableFiles.prod).toContain('environment  = "prod"');
    });

    it('should include provider-specific variables', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.variableFiles.definitions).toContain('aws_region');
    });
  });

  describe('Outputs Configuration', () => {
    it('should generate outputs configuration', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          {
            name: 'networking',
            outputs: [
              { name: 'vpc_id', value: 'aws_vpc.main.id' }
            ]
          }
        ]
      };

      const result = await terraformImplementer.execute(input);

      expect(result.outputsConfig).toBeDefined();
      expect(result.outputsConfig).toContain('output "networking_vpc_id"');
    });

    it('should handle sensitive outputs', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          {
            name: 'secrets',
            outputs: [
              { name: 'password', value: 'random_password.main.result', sensitive: true }
            ]
          }
        ]
      };

      const result = await terraformImplementer.execute(input);

      expect(result.outputsConfig).toContain('sensitive   = true');
    });
  });

  describe('File Collection', () => {
    it('should collect all generated files', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          { name: 'networking', path: 'modules/networking' }
        ]
      };

      const result = await terraformImplementer.execute(input);

      expect(result.files.length).toBeGreaterThan(0);
      expect(result.files.some(f => f.path === 'main.tf')).toBe(true);
      expect(result.files.some(f => f.path === 'providers.tf')).toBe(true);
      expect(result.files.some(f => f.path === 'variables.tf')).toBe(true);
    });

    it('should include tfvars files', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.files.some(f => f.path === 'terraform.tfvars')).toBe(true);
      expect(result.files.some(f => f.path === 'dev.tfvars')).toBe(true);
      expect(result.files.some(f => f.path === 'prod.tfvars')).toBe(true);
    });
  });

  describe('Summary Generation', () => {
    it('should generate summary with file count', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: [
          { name: 'networking', path: 'modules/networking' }
        ]
      };

      const result = await terraformImplementer.execute(input);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalFiles).toBeGreaterThan(0);
      expect(result.summary.modules).toBeGreaterThan(0);
    });

    it('should include provider information', async () => {
      const input = {
        terraformPlan: { providers: ['aws', 'azurerm'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.summary.providers).toEqual(['aws', 'azurerm']);
    });

    it('should count lines of code', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);

      expect(result.summary.linesOfCode).toBeGreaterThan(0);
    });
  });

  describe('Caching', () => {
    it('should cache generated code', async () => {
      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      const result = await terraformImplementer.execute(input);
      const cached = terraformImplementer.getCode(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.executionId).toBe(result.executionId);
    });

    it('should list generated code', async () => {
      await terraformImplementer.execute({
        terraformPlan: { providers: ['aws'] },
        modules: []
      });

      const list = terraformImplementer.listGeneratedCode();

      expect(list.length).toBe(1);
      expect(list[0].filesGenerated).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      await expect(async () => {
        await terraformImplementer.execute(null);
      }).rejects.toThrow();
    });

    it('should reject missing required fields', async () => {
      await expect(async () => {
        await terraformImplementer.execute({});
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit terraform-code-generated event', async () => {
      const events = [];
      terraformImplementer.on('terraform-code-generated', (evt) => {
        events.push(evt);
      });

      const input = {
        terraformPlan: { providers: ['aws'] },
        modules: []
      };

      await terraformImplementer.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('filesGenerated');
      expect(events[0]).toHaveProperty('providers');
    });
  });
});
