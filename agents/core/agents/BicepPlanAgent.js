import { BaseAgent } from '../base/BaseAgent.js';
import { EventEmitter } from 'events';

/**
 * BicepPlanAgent - Azure Bicep Infrastructure as Code Planning
 * 
 * Analyzes Azure architecture and generates comprehensive Bicep infrastructure
 * plans including modules, parameters, resource definitions, and deployment strategies.
 */
export class BicepPlanAgent extends BaseAgent {
  constructor(spec = {}) {
    const defaultSpec = {
      id: 'bicep-plan',
      name: 'Bicep Planning Agent',
      description: 'Plans Azure infrastructure using Bicep IaC with modules and best practices',
      inputSchema: {
        type: 'object',
        properties: {
          azureArchitecture: { type: 'object' },
          services: { type: 'object' },
          resourceOrganization: { type: 'object' }
        },
        required: ['azureArchitecture', 'services']
      },
      outputSchema: {
        type: 'object',
        properties: {
          bicepPlan: { type: 'object' },
          modules: { type: 'array' },
          parameters: { type: 'object' },
          resources: { type: 'array' },
          deploymentStrategy: { type: 'object' }
        }
      }
    };

    super({ ...defaultSpec, ...spec });
    this.planCache = new Map();
    this.moduleTemplates = this.initializeModuleTemplates();
    this.bestPractices = this.initializeBestPractices();
  }

  async _onInitialize() {
    this.planCache.clear();
    this.moduleTemplates = this.initializeModuleTemplates();
    this.bestPractices = this.initializeBestPractices();
  }

  async _onExecute(input, context, executionId) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const { azureArchitecture, services, resourceOrganization = {} } = input;

    // Generate Bicep infrastructure plan
    const bicepPlan = await this.generateBicepPlan(
      azureArchitecture,
      services,
      resourceOrganization
    );

    // Define Bicep modules
    const modules = await this.defineBicepModules(services, bicepPlan);

    // Define parameters
    const parameters = await this.defineParameters(bicepPlan);

    // Define resources
    const resources = await this.defineResources(services, modules);

    // Create deployment strategy
    const deploymentStrategy = await this.createDeploymentStrategy(
      bicepPlan,
      modules
    );

    // Validate Bicep plan
    const planValidation = await this.validateBicepPlan(bicepPlan, modules, resources);

    const result = {
      executionId,
      bicepPlan,
      modules,
      parameters,
      resources,
      deploymentStrategy,
      validation: planValidation,
      bestPractices: this.generateBestPracticesReport(bicepPlan, modules)
    };

    this.planCache.set(executionId, result);

    this.emit('bicep-plan-complete', {
      executionId,
      modulesGenerated: modules.length,
      resourcesPlanned: resources.length,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      executionId,
      bicepPlan,
      modules,
      parameters,
      resources,
      deploymentStrategy,
      validation: planValidation,
      summary: {
        totalModules: modules.length,
        totalResources: resources.length,
        totalParameters: Object.keys(parameters).length,
        estimatedDeploymentTime: deploymentStrategy.estimatedTime
      }
    };
  }

  async generateBicepPlan(azureArchitecture, services, resourceOrganization) {
    return {
      projectName: resourceOrganization.projectName || 'azure-infrastructure',
      targetScope: 'subscription',
      apiVersion: '2023-07-01',
      structure: {
        type: 'modular',
        organization: 'by-service-type',
        modules: this.planModuleStructure(services)
      },
      namingConvention: resourceOrganization.namingConvention || this.getDefaultNaming(),
      taggingStrategy: resourceOrganization.taggingStrategy || this.getDefaultTagging(),
      deploymentMode: 'Incremental',
      whatIfEnabled: true,
      rollbackOnError: true,
      location: azureArchitecture.regions?.primary?.name || 'eastus',
      secondaryLocation: azureArchitecture.regions?.secondary?.name || 'westus2'
    };
  }

  planModuleStructure(services) {
    const modules = [];

    if (services.networking?.length > 0) {
      modules.push({
        name: 'networking',
        priority: 1,
        dependencies: []
      });
    }

    if (services.security?.length > 0) {
      modules.push({
        name: 'security',
        priority: 2,
        dependencies: ['networking']
      });
    }

    if (services.storage?.length > 0) {
      modules.push({
        name: 'storage',
        priority: 3,
        dependencies: ['networking', 'security']
      });
    }

    if (services.database?.length > 0) {
      modules.push({
        name: 'database',
        priority: 4,
        dependencies: ['networking', 'security']
      });
    }

    if (services.compute?.length > 0) {
      modules.push({
        name: 'compute',
        priority: 5,
        dependencies: ['networking', 'security', 'storage']
      });
    }

    if (services.monitoring?.length > 0) {
      modules.push({
        name: 'monitoring',
        priority: 6,
        dependencies: []
      });
    }

    return modules;
  }

  async defineBicepModules(services, bicepPlan) {
    const modules = [];

    // Networking module
    if (services.networking?.length > 0) {
      modules.push(this.createNetworkingModule(services.networking, bicepPlan));
    }

    // Security module
    if (services.security?.length > 0) {
      modules.push(this.createSecurityModule(services.security, bicepPlan));
    }

    // Storage module
    if (services.storage?.length > 0) {
      modules.push(this.createStorageModule(services.storage, bicepPlan));
    }

    // Database module
    if (services.database?.length > 0) {
      modules.push(this.createDatabaseModule(services.database, bicepPlan));
    }

    // Compute module
    if (services.compute?.length > 0) {
      modules.push(this.createComputeModule(services.compute, bicepPlan));
    }

    // Monitoring module
    if (services.monitoring?.length > 0) {
      modules.push(this.createMonitoringModule(services.monitoring, bicepPlan));
    }

    // Identity module
    if (services.identity?.length > 0) {
      modules.push(this.createIdentityModule(services.identity, bicepPlan));
    }

    // Integration module
    if (services.integration?.length > 0) {
      modules.push(this.createIntegrationModule(services.integration, bicepPlan));
    }

    return modules;
  }

  createNetworkingModule(networkingServices, bicepPlan) {
    return {
      name: 'networking',
      fileName: 'modules/networking.bicep',
      description: 'Azure networking infrastructure including VNets, subnets, and gateways',
      targetScope: 'resourceGroup',
      apiVersion: '2023-05-01',
      parameters: [
        { name: 'location', type: 'string', defaultValue: bicepPlan.location },
        { name: 'vnetName', type: 'string' },
        { name: 'vnetAddressPrefix', type: 'string', defaultValue: '10.0.0.0/16' },
        { name: 'subnets', type: 'array' },
        { name: 'tags', type: 'object', defaultValue: {} }
      ],
      resources: [
        {
          type: 'Microsoft.Network/virtualNetworks',
          apiVersion: '2023-05-01',
          properties: {
            addressSpace: { addressPrefixes: ['@parameters(\'vnetAddressPrefix\')'] },
            subnets: '@parameters(\'subnets\')'
          },
          features: ['Service endpoints', 'Private endpoints', 'NSG association']
        },
        {
          type: 'Microsoft.Network/applicationGateways',
          apiVersion: '2023-05-01',
          condition: this.needsApplicationGateway(networkingServices),
          properties: {
            sku: { name: 'WAF_v2', tier: 'WAF_v2' },
            features: ['WAF', 'Auto-scaling', 'SSL termination']
          }
        },
        {
          type: 'Microsoft.Network/loadBalancers',
          apiVersion: '2023-05-01',
          properties: {
            sku: { name: 'Standard' },
            features: ['Zone redundancy', 'Health probes']
          }
        },
        {
          type: 'Microsoft.Network/frontDoors',
          apiVersion: '2023-05-01',
          condition: this.needsFrontDoor(networkingServices),
          properties: {
            sku: { name: 'Premium_AzureFrontDoor' },
            features: ['Global load balancing', 'CDN', 'WAF']
          }
        }
      ],
      outputs: [
        { name: 'vnetId', type: 'string', value: 'vnet.id' },
        { name: 'vnetName', type: 'string', value: 'vnet.name' },
        { name: 'subnetIds', type: 'array', value: 'vnet.properties.subnets' }
      ],
      dependencies: []
    };
  }

  createSecurityModule(securityServices, bicepPlan) {
    return {
      name: 'security',
      fileName: 'modules/security.bicep',
      description: 'Azure security infrastructure including Key Vault, Security Center, and DDoS Protection',
      targetScope: 'resourceGroup',
      apiVersion: '2023-07-01',
      parameters: [
        { name: 'location', type: 'string', defaultValue: bicepPlan.location },
        { name: 'keyVaultName', type: 'string' },
        { name: 'tenantId', type: 'string', defaultValue: 'subscription().tenantId' },
        { name: 'enablePurgeProtection', type: 'bool', defaultValue: true },
        { name: 'tags', type: 'object', defaultValue: {} }
      ],
      resources: [
        {
          type: 'Microsoft.KeyVault/vaults',
          apiVersion: '2023-07-01',
          properties: {
            sku: { name: 'standard', family: 'A' },
            tenantId: '@parameters(\'tenantId\')',
            enabledForDeployment: true,
            enabledForTemplateDeployment: true,
            enableSoftDelete: true,
            enablePurgeProtection: '@parameters(\'enablePurgeProtection\')',
            features: ['RBAC authorization', 'Private endpoints', 'Soft delete']
          }
        },
        {
          type: 'Microsoft.Security/pricings',
          apiVersion: '2023-01-01',
          properties: {
            pricingTier: 'Standard'
          }
        },
        {
          type: 'Microsoft.Network/ddosProtectionPlans',
          apiVersion: '2023-05-01',
          condition: this.needsDDoSProtection(securityServices),
          properties: {
            features: ['Always-on monitoring', 'Adaptive tuning']
          }
        },
        {
          type: 'Microsoft.Network/azureFirewalls',
          apiVersion: '2023-05-01',
          condition: this.needsAzureFirewall(securityServices),
          properties: {
            sku: { name: 'AZFW_VNet', tier: 'Standard' },
            features: ['Threat intelligence', 'Application FQDN filtering']
          }
        }
      ],
      outputs: [
        { name: 'keyVaultId', type: 'string', value: 'keyVault.id' },
        { name: 'keyVaultUri', type: 'string', value: 'keyVault.properties.vaultUri' }
      ],
      dependencies: ['networking']
    };
  }

  createStorageModule(storageServices, bicepPlan) {
    return {
      name: 'storage',
      fileName: 'modules/storage.bicep',
      description: 'Azure storage infrastructure including Blob, Files, and Data Lake',
      targetScope: 'resourceGroup',
      apiVersion: '2023-01-01',
      parameters: [
        { name: 'location', type: 'string', defaultValue: bicepPlan.location },
        { name: 'storageAccountName', type: 'string' },
        { name: 'storageAccountType', type: 'string', defaultValue: 'Standard_GRS' },
        { name: 'enableHierarchicalNamespace', type: 'bool', defaultValue: false },
        { name: 'tags', type: 'object', defaultValue: {} }
      ],
      resources: [
        {
          type: 'Microsoft.Storage/storageAccounts',
          apiVersion: '2023-01-01',
          properties: {
            sku: { name: '@parameters(\'storageAccountType\')' },
            kind: 'StorageV2',
            accessTier: 'Hot',
            supportsHttpsTrafficOnly: true,
            minimumTlsVersion: 'TLS1_2',
            isHnsEnabled: '@parameters(\'enableHierarchicalNamespace\')',
            features: ['Lifecycle management', 'Soft delete', 'Versioning', 'Encryption']
          }
        },
        {
          type: 'Microsoft.Storage/storageAccounts/blobServices',
          apiVersion: '2023-01-01',
          properties: {
            deleteRetentionPolicy: {
              enabled: true,
              days: 7
            },
            containerDeleteRetentionPolicy: {
              enabled: true,
              days: 7
            }
          }
        },
        {
          type: 'Microsoft.Storage/storageAccounts/fileServices',
          apiVersion: '2023-01-01',
          condition: this.needsFileServices(storageServices),
          properties: {
            shareDeleteRetentionPolicy: {
              enabled: true,
              days: 7
            }
          }
        }
      ],
      outputs: [
        { name: 'storageAccountId', type: 'string', value: 'storageAccount.id' },
        { name: 'storageAccountName', type: 'string', value: 'storageAccount.name' },
        { name: 'blobEndpoint', type: 'string', value: 'storageAccount.properties.primaryEndpoints.blob' }
      ],
      dependencies: ['networking', 'security']
    };
  }

  createDatabaseModule(databaseServices, bicepPlan) {
    return {
      name: 'database',
      fileName: 'modules/database.bicep',
      description: 'Azure database infrastructure including SQL Database, Cosmos DB, and PostgreSQL',
      targetScope: 'resourceGroup',
      apiVersion: '2023-05-01',
      parameters: [
        { name: 'location', type: 'string', defaultValue: bicepPlan.location },
        { name: 'sqlServerName', type: 'string' },
        { name: 'sqlDatabaseName', type: 'string' },
        { name: 'administratorLogin', type: 'string' },
        { name: 'administratorLoginPassword', type: 'securestring' },
        { name: 'tags', type: 'object', defaultValue: {} }
      ],
      resources: [
        {
          type: 'Microsoft.Sql/servers',
          apiVersion: '2023-05-01-preview',
          condition: this.needsSqlServer(databaseServices),
          properties: {
            administratorLogin: '@parameters(\'administratorLogin\')',
            administratorLoginPassword: '@parameters(\'administratorLoginPassword\')',
            version: '12.0',
            minimalTlsVersion: '1.2',
            publicNetworkAccess: 'Disabled',
            features: ['Azure AD authentication', 'Private endpoints', 'Threat detection']
          }
        },
        {
          type: 'Microsoft.Sql/servers/databases',
          apiVersion: '2023-05-01-preview',
          condition: this.needsSqlServer(databaseServices),
          properties: {
            sku: {
              name: 'GP_Gen5',
              tier: 'GeneralPurpose',
              capacity: 4
            },
            maxSizeBytes: 536870912000, // 500GB
            features: ['Auto-tuning', 'Geo-replication', 'Point-in-time restore']
          }
        },
        {
          type: 'Microsoft.DocumentDB/databaseAccounts',
          apiVersion: '2023-04-15',
          condition: this.needsCosmosDB(databaseServices),
          properties: {
            databaseAccountOfferType: 'Standard',
            consistencyPolicy: {
              defaultConsistencyLevel: 'Session'
            },
            locations: [
              {
                locationName: bicepPlan.location,
                failoverPriority: 0
              }
            ],
            features: ['Multi-region writes', 'Automatic failover', 'Backup']
          }
        },
        {
          type: 'Microsoft.DBforPostgreSQL/flexibleServers',
          apiVersion: '2023-03-01-preview',
          condition: this.needsPostgreSQL(databaseServices),
          properties: {
            version: '15',
            sku: {
              name: 'Standard_D4s_v3',
              tier: 'GeneralPurpose'
            },
            storage: {
              storageSizeGB: 512
            },
            features: ['High availability', 'Automated backups', 'Private endpoints']
          }
        },
        {
          type: 'Microsoft.Cache/redis',
          apiVersion: '2023-08-01',
          condition: this.needsRedis(databaseServices),
          properties: {
            sku: {
              name: 'Premium',
              family: 'P',
              capacity: 1
            },
            enableNonSslPort: false,
            minimumTlsVersion: '1.2',
            features: ['Clustering', 'Geo-replication', 'Data persistence']
          }
        }
      ],
      outputs: [
        { name: 'sqlServerId', type: 'string', value: 'sqlServer.id', condition: 'needsSqlServer' },
        { name: 'cosmosDbId', type: 'string', value: 'cosmosDb.id', condition: 'needsCosmosDB' },
        { name: 'postgresId', type: 'string', value: 'postgres.id', condition: 'needsPostgreSQL' }
      ],
      dependencies: ['networking', 'security']
    };
  }

  createComputeModule(computeServices, bicepPlan) {
    return {
      name: 'compute',
      fileName: 'modules/compute.bicep',
      description: 'Azure compute infrastructure including App Service, Functions, and AKS',
      targetScope: 'resourceGroup',
      apiVersion: '2023-01-01',
      parameters: [
        { name: 'location', type: 'string', defaultValue: bicepPlan.location },
        { name: 'appServicePlanName', type: 'string' },
        { name: 'appServicePlanSku', type: 'string', defaultValue: 'S1' },
        { name: 'webAppName', type: 'string' },
        { name: 'tags', type: 'object', defaultValue: {} }
      ],
      resources: [
        {
          type: 'Microsoft.Web/serverfarms',
          apiVersion: '2023-01-01',
          condition: this.needsAppService(computeServices),
          properties: {
            sku: {
              name: '@parameters(\'appServicePlanSku\')',
              tier: 'Standard',
              capacity: 2
            },
            kind: 'linux',
            reserved: true,
            features: ['Auto-scaling', 'Zone redundancy']
          }
        },
        {
          type: 'Microsoft.Web/sites',
          apiVersion: '2023-01-01',
          condition: this.needsAppService(computeServices),
          properties: {
            serverFarmId: 'appServicePlan.id',
            httpsOnly: true,
            siteConfig: {
              minTlsVersion: '1.2',
              ftpsState: 'Disabled',
              alwaysOn: true
            },
            identity: {
              type: 'SystemAssigned'
            },
            features: ['Deployment slots', 'Custom domains', 'Managed identity']
          }
        },
        {
          type: 'Microsoft.Web/sites',
          apiVersion: '2023-01-01',
          kind: 'functionapp',
          condition: this.needsFunctions(computeServices),
          properties: {
            serverFarmId: 'appServicePlan.id',
            siteConfig: {
              appSettings: [
                { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' },
                { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
              ]
            },
            features: ['Durable Functions', 'VNET integration']
          }
        },
        {
          type: 'Microsoft.ContainerService/managedClusters',
          apiVersion: '2023-07-01',
          condition: this.needsAKS(computeServices),
          properties: {
            kubernetesVersion: '1.27.0',
            dnsPrefix: 'aks-cluster',
            agentPoolProfiles: [
              {
                name: 'systempool',
                count: 3,
                vmSize: 'Standard_D4s_v3',
                mode: 'System',
                enableAutoScaling: true,
                minCount: 3,
                maxCount: 10
              }
            ],
            networkProfile: {
              networkPlugin: 'azure',
              serviceCidr: '10.1.0.0/16',
              dnsServiceIP: '10.1.0.10'
            },
            aadProfile: {
              managed: true,
              enableAzureRBAC: true
            },
            features: ['Azure CNI', 'Azure AD integration', 'Auto-scaling', 'Azure Monitor']
          }
        }
      ],
      outputs: [
        { name: 'appServiceId', type: 'string', value: 'webApp.id', condition: 'needsAppService' },
        { name: 'functionAppId', type: 'string', value: 'functionApp.id', condition: 'needsFunctions' },
        { name: 'aksId', type: 'string', value: 'aks.id', condition: 'needsAKS' }
      ],
      dependencies: ['networking', 'security', 'storage']
    };
  }

  createMonitoringModule(monitoringServices, bicepPlan) {
    return {
      name: 'monitoring',
      fileName: 'modules/monitoring.bicep',
      description: 'Azure monitoring infrastructure including Log Analytics, Application Insights',
      targetScope: 'resourceGroup',
      apiVersion: '2023-03-01',
      parameters: [
        { name: 'location', type: 'string', defaultValue: bicepPlan.location },
        { name: 'logAnalyticsName', type: 'string' },
        { name: 'appInsightsName', type: 'string' },
        { name: 'retentionInDays', type: 'int', defaultValue: 90 },
        { name: 'tags', type: 'object', defaultValue: {} }
      ],
      resources: [
        {
          type: 'Microsoft.OperationalInsights/workspaces',
          apiVersion: '2023-09-01',
          properties: {
            sku: { name: 'PerGB2018' },
            retentionInDays: '@parameters(\'retentionInDays\')',
            features: ['Query', 'Alerts', 'Workbooks', 'Sentinel integration']
          }
        },
        {
          type: 'Microsoft.Insights/components',
          apiVersion: '2020-02-02',
          properties: {
            Application_Type: 'web',
            WorkspaceResourceId: 'logAnalytics.id',
            features: ['Distributed tracing', 'Live metrics', 'Profiler', 'Snapshot debugger']
          }
        },
        {
          type: 'Microsoft.Insights/actionGroups',
          apiVersion: '2023-01-01',
          properties: {
            groupShortName: 'Alerts',
            enabled: true,
            emailReceivers: [],
            smsReceivers: []
          }
        }
      ],
      outputs: [
        { name: 'logAnalyticsId', type: 'string', value: 'logAnalytics.id' },
        { name: 'appInsightsId', type: 'string', value: 'appInsights.id' },
        { name: 'appInsightsInstrumentationKey', type: 'string', value: 'appInsights.properties.InstrumentationKey' }
      ],
      dependencies: []
    };
  }

  createIdentityModule(identityServices, bicepPlan) {
    return {
      name: 'identity',
      fileName: 'modules/identity.bicep',
      description: 'Azure identity infrastructure including Managed Identities',
      targetScope: 'resourceGroup',
      apiVersion: '2023-01-31',
      parameters: [
        { name: 'location', type: 'string', defaultValue: bicepPlan.location },
        { name: 'managedIdentityName', type: 'string' },
        { name: 'tags', type: 'object', defaultValue: {} }
      ],
      resources: [
        {
          type: 'Microsoft.ManagedIdentity/userAssignedIdentities',
          apiVersion: '2023-01-31',
          properties: {
            features: ['RBAC assignments', 'Service authentication']
          }
        }
      ],
      outputs: [
        { name: 'identityId', type: 'string', value: 'managedIdentity.id' },
        { name: 'principalId', type: 'string', value: 'managedIdentity.properties.principalId' },
        { name: 'clientId', type: 'string', value: 'managedIdentity.properties.clientId' }
      ],
      dependencies: []
    };
  }

  createIntegrationModule(integrationServices, bicepPlan) {
    return {
      name: 'integration',
      fileName: 'modules/integration.bicep',
      description: 'Azure integration services including Service Bus, API Management, Event Grid',
      targetScope: 'resourceGroup',
      apiVersion: '2023-01-01',
      parameters: [
        { name: 'location', type: 'string', defaultValue: bicepPlan.location },
        { name: 'serviceBusName', type: 'string' },
        { name: 'apimName', type: 'string' },
        { name: 'tags', type: 'object', defaultValue: {} }
      ],
      resources: [
        {
          type: 'Microsoft.ServiceBus/namespaces',
          apiVersion: '2022-10-01-preview',
          properties: {
            sku: { name: 'Premium', tier: 'Premium', capacity: 1 },
            features: ['Queues', 'Topics', 'Transactions', 'Geo-disaster recovery']
          }
        },
        {
          type: 'Microsoft.ApiManagement/service',
          apiVersion: '2023-03-01-preview',
          properties: {
            sku: { name: 'Developer', capacity: 1 },
            publisherEmail: 'admin@contoso.com',
            publisherName: 'Contoso',
            features: ['API gateway', 'Developer portal', 'Rate limiting', 'Analytics']
          }
        },
        {
          type: 'Microsoft.EventGrid/topics',
          apiVersion: '2023-06-01-preview',
          properties: {
            inputSchema: 'EventGridSchema',
            features: ['Event routing', 'Filtering', 'Dead-lettering']
          }
        }
      ],
      outputs: [
        { name: 'serviceBusId', type: 'string', value: 'serviceBus.id' },
        { name: 'apimId', type: 'string', value: 'apim.id' },
        { name: 'eventGridId', type: 'string', value: 'eventGrid.id' }
      ],
      dependencies: ['networking']
    };
  }

  async defineParameters(bicepPlan) {
    return {
      environment: {
        type: 'string',
        allowedValues: ['dev', 'stg', 'prod'],
        defaultValue: 'dev',
        description: 'Environment name'
      },
      location: {
        type: 'string',
        defaultValue: bicepPlan.location,
        description: 'Primary Azure region'
      },
      secondaryLocation: {
        type: 'string',
        defaultValue: bicepPlan.secondaryLocation,
        description: 'Secondary Azure region for DR'
      },
      projectName: {
        type: 'string',
        minLength: 3,
        maxLength: 20,
        description: 'Project name used for resource naming'
      },
      tags: {
        type: 'object',
        defaultValue: {
          Environment: '@parameters(\'environment\')',
          ManagedBy: 'Bicep',
          DeploymentDate: 'utcNow(\'yyyy-MM-dd\')'
        },
        description: 'Common tags for all resources'
      },
      enableDiagnostics: {
        type: 'bool',
        defaultValue: true,
        description: 'Enable diagnostic settings'
      }
    };
  }

  async defineResources(services, modules) {
    const resources = [];

    for (const module of modules) {
      for (const resource of module.resources) {
        resources.push({
          type: resource.type,
          apiVersion: resource.apiVersion,
          module: module.name,
          condition: resource.condition,
          properties: resource.properties,
          features: resource.features || []
        });
      }
    }

    return resources;
  }

  async createDeploymentStrategy(bicepPlan, modules) {
    return {
      approach: 'modular',
      whatIfValidation: true,
      scope: bicepPlan.targetScope,
      deploymentMode: bicepPlan.deploymentMode,
      phases: [
        {
          phase: 1,
          name: 'Foundation',
          modules: ['networking', 'security', 'monitoring'],
          description: 'Deploy foundational infrastructure',
          estimatedTime: '15-20 minutes'
        },
        {
          phase: 2,
          name: 'Data Layer',
          modules: ['storage', 'database'],
          description: 'Deploy data services',
          estimatedTime: '20-30 minutes',
          dependsOn: ['Foundation']
        },
        {
          phase: 3,
          name: 'Compute Layer',
          modules: ['compute', 'identity'],
          description: 'Deploy compute resources',
          estimatedTime: '25-35 minutes',
          dependsOn: ['Data Layer']
        },
        {
          phase: 4,
          name: 'Integration',
          modules: ['integration'],
          description: 'Deploy integration services',
          estimatedTime: '15-20 minutes',
          dependsOn: ['Compute Layer']
        }
      ],
      estimatedTime: '75-105 minutes',
      rollbackStrategy: 'Automatic rollback on critical failures',
      validationSteps: [
        'Run What-If analysis',
        'Validate parameter files',
        'Check RBAC permissions',
        'Verify quota availability'
      ],
      postDeploymentSteps: [
        'Verify resource deployment',
        'Configure diagnostic settings',
        'Validate networking connectivity',
        'Run smoke tests'
      ]
    };
  }

  async validateBicepPlan(bicepPlan, modules, resources) {
    const issues = [];
    const warnings = [];
    const recommendations = [];

    // Validate module dependencies
    for (const module of modules) {
      for (const dep of module.dependencies || []) {
        if (!modules.find(m => m.name === dep)) {
          issues.push(`Module '${module.name}' depends on missing module '${dep}'`);
        }
      }
    }

    // Check best practices
    if (!modules.find(m => m.name === 'monitoring')) {
      warnings.push('No monitoring module defined - consider adding Application Insights');
    }

    if (!modules.find(m => m.name === 'security')) {
      warnings.push('No security module defined - consider adding Key Vault');
    }

    // Resource naming validation
    if (!bicepPlan.namingConvention) {
      warnings.push('No naming convention defined');
    }

    // Recommendations
    recommendations.push('Use parameter files for different environments');
    recommendations.push('Enable diagnostic settings on all resources');
    recommendations.push('Use managed identities instead of service principals');
    recommendations.push('Implement resource locks on production resources');

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      recommendations,
      summary: {
        totalIssues: issues.length,
        totalWarnings: warnings.length,
        totalRecommendations: recommendations.length
      }
    };
  }

  generateBestPracticesReport(bicepPlan, modules) {
    return {
      modularity: {
        score: modules.length >= 5 ? 'Good' : 'Needs Improvement',
        details: `${modules.length} modules defined`
      },
      parameterization: {
        score: 'Good',
        details: 'Parameters defined for flexibility'
      },
      security: {
        score: modules.find(m => m.name === 'security') ? 'Good' : 'Needs Improvement',
        details: modules.find(m => m.name === 'security') ? 
          'Security module included' : 'No dedicated security module'
      },
      monitoring: {
        score: modules.find(m => m.name === 'monitoring') ? 'Good' : 'Needs Improvement',
        details: modules.find(m => m.name === 'monitoring') ? 
          'Monitoring module included' : 'No monitoring module'
      },
      naming: {
        score: bicepPlan.namingConvention ? 'Good' : 'Needs Improvement',
        details: bicepPlan.namingConvention ? 
          'Naming convention defined' : 'No naming convention'
      },
      recommendations: [
        'Use Bicep linter for validation',
        'Implement CI/CD with What-If validation',
        'Use Azure Verified Modules where available',
        'Maintain separate parameter files per environment',
        'Enable deployment history tracking'
      ]
    };
  }

  // Helper methods
  needsApplicationGateway(services) {
    return services.some(s => s.service === 'Azure Application Gateway');
  }

  needsFrontDoor(services) {
    return services.some(s => s.service === 'Azure Front Door');
  }

  needsDDoSProtection(services) {
    return services.some(s => s.service === 'Azure DDoS Protection');
  }

  needsAzureFirewall(services) {
    return services.some(s => s.service === 'Azure Firewall');
  }

  needsFileServices(services) {
    return services.some(s => s.service === 'Azure Files');
  }

  needsSqlServer(services) {
    return services.some(s => s.service === 'Azure SQL Database');
  }

  needsCosmosDB(services) {
    return services.some(s => s.service === 'Azure Cosmos DB');
  }

  needsPostgreSQL(services) {
    return services.some(s => s.service === 'Azure Database for PostgreSQL');
  }

  needsRedis(services) {
    return services.some(s => s.service === 'Azure Cache for Redis');
  }

  needsAppService(services) {
    return services.some(s => s.service === 'Azure App Service');
  }

  needsFunctions(services) {
    return services.some(s => s.service === 'Azure Functions');
  }

  needsAKS(services) {
    return services.some(s => s.service === 'Azure Kubernetes Service (AKS)');
  }

  getDefaultNaming() {
    return {
      pattern: '{resourceType}-{projectName}-{environment}-{region}-{instance}',
      separator: '-'
    };
  }

  getDefaultTagging() {
    return {
      required: ['Environment', 'Project', 'Owner'],
      recommended: ['CostCenter', 'Criticality']
    };
  }

  initializeModuleTemplates() {
    return {
      networking: 'networking.bicep',
      security: 'security.bicep',
      storage: 'storage.bicep',
      database: 'database.bicep',
      compute: 'compute.bicep',
      monitoring: 'monitoring.bicep'
    };
  }

  initializeBestPractices() {
    return [
      'Use modular structure for reusability',
      'Parameterize environment-specific values',
      'Use resource tagging consistently',
      'Enable diagnostic settings',
      'Implement proper RBAC',
      'Use managed identities',
      'Enable soft delete on critical resources',
      'Implement backup strategies'
    ];
  }

  getPlan(executionId) {
    return this.planCache.get(executionId);
  }

  listPlans() {
    return Array.from(this.planCache.values()).map(p => ({
      id: p.executionId,
      modules: p.modules.length,
      resources: p.resources.length
    }));
  }

  async _onCleanup() {
    // Cleanup if needed
  }
}

export default BicepPlanAgent;
