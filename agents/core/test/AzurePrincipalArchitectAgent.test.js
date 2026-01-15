import { AzurePrincipalArchitectAgent } from '../agents/AzurePrincipalArchitectAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('AzurePrincipalArchitectAgent', () => {
  let azureArchitect;

  beforeEach(async () => {
    azureArchitect = new AzurePrincipalArchitectAgent();
    await azureArchitect.initialize();
  });

  afterEach(async () => {
    await azureArchitect.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(azureArchitect.id).toBe('azure-principal-architect');
      expect(azureArchitect.name).toBe('Azure Principal Architect');
      expect(azureArchitect.state).toBe('ready');
    });

    it('should initialize architecture cache', () => {
      expect(azureArchitect.architectureCache).toBeDefined();
      expect(azureArchitect.architectureCache.size).toBe(0);
    });

    it('should initialize service knowledge', () => {
      expect(azureArchitect.serviceKnowledge).toBeDefined();
      expect(azureArchitect.serviceKnowledge.compute).toBeDefined();
      expect(azureArchitect.serviceKnowledge.storage).toBeDefined();
    });

    it('should initialize pricing data', () => {
      expect(azureArchitect.pricingData).toBeDefined();
      expect(azureArchitect.pricingData.compute).toBeDefined();
    });
  });

  describe('Azure Architecture Design', () => {
    it('should design comprehensive Azure architecture', async () => {
      const input = {
        requirements: {
          workloadType: 'web-application',
          needsRelationalDB: true,
          slaRequirement: '99.9%'
        }
      };

      const result = await azureArchitect.execute(input);

      expect(result.azureArchitecture).toBeDefined();
      expect(result.azureArchitecture).toHaveProperty('workloadType');
      expect(result.azureArchitecture).toHaveProperty('scalingStrategy');
      expect(result.azureArchitecture).toHaveProperty('regions');
    });

    it('should identify workload type', async () => {
      const input = {
        requirements: {
          usesMicroservices: true
        }
      };

      const result = await azureArchitect.execute(input);

      expect(result.azureArchitecture.workloadType).toBe('microservices');
    });

    it('should plan disaster recovery for high SLA', async () => {
      const input = {
        requirements: {
          slaRequirement: '99.99%'
        }
      };

      const result = await azureArchitect.execute(input);

      expect(result.azureArchitecture.disasterRecovery).toBeDefined();
      expect(result.azureArchitecture.disasterRecovery.strategy).toContain('geo-replication');
    });
  });

  describe('Azure Service Selection', () => {
    it('should select appropriate compute services', async () => {
      const input = {
        requirements: {
          workloadType: 'web-application'
        }
      };

      const result = await azureArchitect.execute(input);

      expect(result.services.compute).toBeDefined();
      expect(Array.isArray(result.services.compute)).toBe(true);
      expect(result.services.compute.length).toBeGreaterThan(0);
    });

    it('should select App Service for web applications', async () => {
      const input = {
        requirements: {
          workloadType: 'web-application'
        }
      };

      const result = await azureArchitect.execute(input);
      const appService = result.services.compute.find(s => s.service === 'Azure App Service');

      expect(appService).toBeDefined();
      expect(appService.tier).toBe('Standard S1');
    });

    it('should select AKS for microservices', async () => {
      const input = {
        requirements: {
          usesMicroservices: true,
          usesContainers: true
        }
      };

      const result = await azureArchitect.execute(input);
      const aks = result.services.compute.find(s => s.service === 'Azure Kubernetes Service (AKS)');

      expect(aks).toBeDefined();
      expect(aks.nodeCount).toBeGreaterThan(0);
    });

    it('should select Azure Functions for serverless', async () => {
      const input = {
        requirements: {
          usesServerless: true
        }
      };

      const result = await azureArchitect.execute(input);
      const functions = result.services.compute.find(s => s.service === 'Azure Functions');

      expect(functions).toBeDefined();
      expect(functions.plan).toBe('Premium');
    });

    it('should select storage services', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.services.storage).toBeDefined();
      expect(Array.isArray(result.services.storage)).toBe(true);
      const blobStorage = result.services.storage.find(s => s.service === 'Azure Blob Storage');
      expect(blobStorage).toBeDefined();
    });

    it('should select database services', async () => {
      const input = {
        requirements: {
          needsRelationalDB: true,
          needsNoSQL: true
        }
      };

      const result = await azureArchitect.execute(input);

      expect(result.services.database).toBeDefined();
      const sql = result.services.database.find(s => s.service === 'Azure SQL Database');
      const cosmos = result.services.database.find(s => s.service === 'Azure Cosmos DB');

      expect(sql).toBeDefined();
      expect(cosmos).toBeDefined();
    });

    it('should select Azure Cache for Redis when caching needed', async () => {
      const input = {
        requirements: {
          needsCaching: true
        }
      };

      const result = await azureArchitect.execute(input);
      const redis = result.services.database.find(s => s.service === 'Azure Cache for Redis');

      expect(redis).toBeDefined();
      expect(redis.tier).toBe('Premium');
    });

    it('should select networking services', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.services.networking).toBeDefined();
      expect(Array.isArray(result.services.networking)).toBe(true);
      const vnet = result.services.networking.find(s => s.service === 'Azure Virtual Network');
      expect(vnet).toBeDefined();
    });

    it('should select identity services', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.services.identity).toBeDefined();
      const azureAD = result.services.identity.find(s => s.service === 'Azure Active Directory');
      expect(azureAD).toBeDefined();
    });

    it('should select security services', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.services.security).toBeDefined();
      const keyVault = result.services.security.find(s => s.service === 'Azure Key Vault');
      expect(keyVault).toBeDefined();
    });

    it('should select analytics services when needed', async () => {
      const input = {
        requirements: {
          needsAnalytics: true
        }
      };

      const result = await azureArchitect.execute(input);

      expect(result.services.analytics).toBeDefined();
      expect(result.services.analytics.length).toBeGreaterThan(0);
    });

    it('should select AI services when needed', async () => {
      const input = {
        requirements: {
          needsAI: true,
          needsLLM: true
        }
      };

      const result = await azureArchitect.execute(input);

      expect(result.services.ai).toBeDefined();
      expect(result.services.ai.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Organization', () => {
    it('should plan resource organization', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.resourceOrganization).toBeDefined();
      expect(result.resourceOrganization).toHaveProperty('subscriptions');
      expect(result.resourceOrganization).toHaveProperty('resourceGroups');
      expect(result.resourceOrganization).toHaveProperty('regions');
    });

    it('should define multiple subscriptions', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const subs = result.resourceOrganization.subscriptions;

      expect(Array.isArray(subs)).toBe(true);
      expect(subs.length).toBeGreaterThanOrEqual(3);
      expect(subs.find(s => s.name === 'production')).toBeDefined();
      expect(subs.find(s => s.name === 'development')).toBeDefined();
    });

    it('should define resource groups', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const rgs = result.resourceOrganization.resourceGroups;

      expect(Array.isArray(rgs)).toBe(true);
      expect(rgs.length).toBeGreaterThan(0);
      expect(rgs.find(rg => rg.name === 'rg-networking')).toBeDefined();
      expect(rgs.find(rg => rg.name === 'rg-compute')).toBeDefined();
      expect(rgs.find(rg => rg.name === 'rg-data')).toBeDefined();
    });

    it('should define naming convention', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const naming = result.resourceOrganization.namingConvention;

      expect(naming).toBeDefined();
      expect(naming).toHaveProperty('pattern');
      expect(naming).toHaveProperty('examples');
      expect(naming).toHaveProperty('rules');
    });

    it('should define tagging strategy', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const tagging = result.resourceOrganization.taggingStrategy;

      expect(tagging).toBeDefined();
      expect(tagging).toHaveProperty('required');
      expect(tagging.required).toContain('Environment');
      expect(tagging.required).toContain('Owner');
    });

    it('should select primary and secondary regions', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const regions = result.resourceOrganization.regions;

      expect(regions).toHaveProperty('primary');
      expect(regions).toHaveProperty('secondary');
      expect(regions.primary.name).toBe('eastus');
    });
  });

  describe('Networking Design', () => {
    it('should design Azure networking', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.networking).toBeDefined();
      expect(result.networking).toHaveProperty('topology');
      expect(result.networking).toHaveProperty('vnet');
      expect(result.networking).toHaveProperty('security');
    });

    it('should use hub-and-spoke topology', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.networking.topology).toBe('hub-and-spoke');
    });

    it('should define VNet with subnets', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const vnet = result.networking.vnet;

      expect(vnet).toHaveProperty('addressSpace');
      expect(vnet).toHaveProperty('subnets');
      expect(Array.isArray(vnet.subnets)).toBe(true);
      expect(vnet.subnets.length).toBeGreaterThan(3);
    });

    it('should include network security measures', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const security = result.networking.security;

      expect(security).toBeDefined();
      expect(security).toHaveProperty('nsg');
      expect(security).toHaveProperty('firewall');
      expect(security).toHaveProperty('waf');
    });
  });

  describe('Security Design', () => {
    it('should design comprehensive Azure security', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.security).toBeDefined();
      expect(result.security).toHaveProperty('identityAndAccess');
      expect(result.security).toHaveProperty('dataProtection');
      expect(result.security).toHaveProperty('networkSecurity');
      expect(result.security).toHaveProperty('threatProtection');
    });

    it('should include encryption strategy', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const encryption = result.security.dataProtection.encryption;

      expect(encryption).toBeDefined();
      expect(encryption).toHaveProperty('atRest');
      expect(encryption).toHaveProperty('inTransit');
      expect(encryption).toHaveProperty('keyManagement');
    });

    it('should include managed identities', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const identity = result.security.identityAndAccess;

      expect(identity.managedIdentities).toBeDefined();
      expect(identity.managedIdentities).toContain('System-assigned');
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate Azure costs', async () => {
      const input = {
        requirements: {
          workloadType: 'web-application',
          needsRelationalDB: true
        }
      };

      const result = await azureArchitect.execute(input);

      expect(result.costEstimate).toBeDefined();
      expect(result.costEstimate).toHaveProperty('monthly');
      expect(result.costEstimate).toHaveProperty('annual');
      expect(result.costEstimate).toHaveProperty('breakdown');
    });

    it('should provide cost breakdown', async () => {
      const input = {
        requirements: {
          workloadType: 'web-application'
        }
      };

      const result = await azureArchitect.execute(input);
      const breakdown = result.costEstimate.breakdown;

      expect(breakdown).toBeDefined();
      expect(typeof breakdown).toBe('object');
    });

    it('should include optimization recommendations', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const optimization = result.costEstimate.optimization;

      expect(Array.isArray(optimization)).toBe(true);
      expect(optimization.length).toBeGreaterThan(0);
    });
  });

  describe('Deployment Planning', () => {
    it('should create deployment plan', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.deploymentPlan).toBeDefined();
      expect(result.deploymentPlan).toHaveProperty('phases');
      expect(result.deploymentPlan).toHaveProperty('totalDuration');
      expect(result.deploymentPlan).toHaveProperty('prerequisites');
    });

    it('should define deployment phases', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const phases = result.deploymentPlan.phases;

      expect(Array.isArray(phases)).toBe(true);
      expect(phases.length).toBeGreaterThanOrEqual(8);
      expect(phases[0].name).toBe('Foundation Setup');
    });

    it('should identify deployment risks', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const risks = result.deploymentPlan.risks;

      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThan(0);
      risks.forEach(risk => {
        expect(risk).toHaveProperty('risk');
        expect(risk).toHaveProperty('mitigation');
      });
    });
  });

  describe('Caching', () => {
    it('should cache architecture designs', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);
      const cached = azureArchitect.getArchitecture(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.executionId).toBe(result.executionId);
    });

    it('should list cached architectures', async () => {
      const input1 = { requirements: { workloadType: 'web-application' } };
      const input2 = { requirements: { workloadType: 'microservices' } };

      const result1 = await azureArchitect.execute(input1);
      const result2 = await azureArchitect.execute(input2);

      const list = azureArchitect.listArchitectures();
      expect(list.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      expect(async () => {
        await azureArchitect.execute(null);
      }).rejects.toThrow();
    });

    it('should reject missing requirements', async () => {
      expect(async () => {
        await azureArchitect.execute({});
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit azure-architecture-complete event', async () => {
      const events = [];
      azureArchitect.on('azure-architecture-complete', (evt) => {
        events.push(evt);
      });

      const input = {
        requirements: {}
      };

      await azureArchitect.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('servicesSelected');
      expect(events[0]).toHaveProperty('estimatedMonthlyCost');
    });
  });

  describe('Summary Generation', () => {
    it('should generate execution summary', async () => {
      const input = {
        requirements: {}
      };

      const result = await azureArchitect.execute(input);

      expect(result.summary).toBeDefined();
      expect(result.summary).toHaveProperty('totalServices');
      expect(result.summary).toHaveProperty('resourceGroups');
      expect(result.summary).toHaveProperty('estimatedMonthlyCost');
      expect(result.summary).toHaveProperty('regions');
    });
  });
});
