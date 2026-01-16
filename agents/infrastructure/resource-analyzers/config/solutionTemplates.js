/**
 * Solution Templates - Pre-defined architectures for common scenarios
 * 
 * Each template contains:
 * - keywords: Trigger phrases that match this template
 * - description: Human-readable description
 * - resources: List of resource types to deploy
 * - config: Optional per-resource configuration overrides
 */

export const SOLUTION_TEMPLATES = {
  // Web Application Patterns
  'web-app-sql': {
    keywords: ['web app with database', 'web app sql', 'website with database', 'app service sql', 'web applicatie met database'],
    description: 'Web application with SQL Database backend',
    resources: [
      'Microsoft.Web/serverfarms',
      'Microsoft.Web/sites',
      'Microsoft.Sql/servers',
      'Microsoft.Sql/servers/databases',
      'Microsoft.Insights/components'
    ]
  },

  'web-app-cosmos': {
    keywords: ['web app cosmos', 'serverless web', 'web app nosql', 'website cosmosdb'],
    description: 'Web application with Cosmos DB backend',
    resources: [
      'Microsoft.Web/serverfarms',
      'Microsoft.Web/sites',
      'Microsoft.DocumentDB/databaseAccounts',
      'Microsoft.Insights/components'
    ]
  },

  'static-web-app': {
    keywords: ['static web app', 'static site', 'jamstack', 'spa hosting'],
    description: 'Static Web App with serverless functions',
    resources: [
      'Microsoft.Web/staticSites'
    ]
  },

  // Container Patterns
  'microservices-aks': {
    keywords: ['microservices', 'aks cluster', 'kubernetes application', 'container platform', 'microservices architectuur'],
    description: 'Microservices platform on AKS',
    resources: [
      'Microsoft.ContainerService/managedClusters',
      'Microsoft.ContainerRegistry/registries',
      'Microsoft.OperationalInsights/workspaces',
      'Microsoft.KeyVault/vaults'
    ]
  },

  'container-apps': {
    keywords: ['container apps', 'serverless containers', 'aca', 'azure container apps'],
    description: 'Serverless container platform',
    resources: [
      'Microsoft.OperationalInsights/workspaces',
      'Microsoft.App/managedEnvironments',
      'Microsoft.App/containerApps',
      'Microsoft.ContainerRegistry/registries'
    ]
  },

  // Serverless Patterns
  'serverless-api': {
    keywords: ['serverless api', 'function api', 'api backend', 'rest api serverless', 'serverless backend'],
    description: 'Serverless API with Azure Functions',
    resources: [
      'Microsoft.Storage/storageAccounts',
      'Microsoft.Web/serverfarms',
      'Microsoft.Web/sites',
      'Microsoft.Insights/components',
      'Microsoft.ApiManagement/service'
    ],
    config: {
      'Microsoft.Web/serverfarms': { sku: { name: 'Y1', tier: 'Dynamic' } },
      'Microsoft.Web/sites': { kind: 'functionapp' }
    }
  },

  'event-driven': {
    keywords: ['event driven', 'event processing', 'message processing', 'event hub processing', 'event architectuur'],
    description: 'Event-driven architecture with Event Hub',
    resources: [
      'Microsoft.Storage/storageAccounts',
      'Microsoft.EventHub/namespaces',
      'Microsoft.Web/serverfarms',
      'Microsoft.Web/sites',
      'Microsoft.Insights/components'
    ],
    config: {
      'Microsoft.Web/serverfarms': { sku: { name: 'Y1', tier: 'Dynamic' } },
      'Microsoft.Web/sites': { kind: 'functionapp' }
    }
  },

  'message-queue': {
    keywords: ['message queue', 'service bus', 'queue processing', 'async processing'],
    description: 'Message queue processing with Service Bus',
    resources: [
      'Microsoft.Storage/storageAccounts',
      'Microsoft.ServiceBus/namespaces',
      'Microsoft.Web/serverfarms',
      'Microsoft.Web/sites',
      'Microsoft.Insights/components'
    ],
    config: {
      'Microsoft.Web/serverfarms': { sku: { name: 'Y1', tier: 'Dynamic' } },
      'Microsoft.Web/sites': { kind: 'functionapp' }
    }
  },

  // Data & Analytics Patterns
  'data-platform': {
    keywords: ['data platform', 'analytics platform', 'data warehouse', 'big data', 'data lakehouse'],
    description: 'Data analytics platform',
    resources: [
      'Microsoft.Storage/storageAccounts',
      'Microsoft.Synapse/workspaces',
      'Microsoft.KeyVault/vaults',
      'Microsoft.Purview/accounts'
    ]
  },

  'data-lake': {
    keywords: ['data lake', 'datalake', 'data storage', 'raw data storage'],
    description: 'Data Lake with hierarchical namespace',
    resources: [
      'Microsoft.Storage/storageAccounts',
      'Microsoft.KeyVault/vaults'
    ],
    config: {
      'Microsoft.Storage/storageAccounts': { 
        kind: 'StorageV2',
        properties: { isHnsEnabled: true }
      }
    }
  },

  'real-time-analytics': {
    keywords: ['real-time analytics', 'streaming analytics', 'real time data', 'hot path'],
    description: 'Real-time analytics with Data Explorer',
    resources: [
      'Microsoft.EventHub/namespaces',
      'Microsoft.Kusto/clusters',
      'Microsoft.Storage/storageAccounts'
    ]
  },

  // IoT Patterns
  'iot-solution': {
    keywords: ['iot solution', 'iot platform', 'connected devices', 'iot hub solution', 'iot architectuur'],
    description: 'IoT solution with Hub and processing',
    resources: [
      'Microsoft.Devices/IotHubs',
      'Microsoft.Storage/storageAccounts',
      'Microsoft.Web/serverfarms',
      'Microsoft.Web/sites',
      'Microsoft.Insights/components'
    ],
    config: {
      'Microsoft.Web/serverfarms': { sku: { name: 'Y1', tier: 'Dynamic' } },
      'Microsoft.Web/sites': { kind: 'functionapp' }
    }
  },

  'digital-twins': {
    keywords: ['digital twins', 'digital twin', 'adt solution', 'twins model'],
    description: 'Digital Twins solution',
    resources: [
      'Microsoft.Devices/IotHubs',
      'Microsoft.DigitalTwins/digitalTwinsInstances',
      'Microsoft.EventHub/namespaces',
      'Microsoft.Storage/storageAccounts'
    ]
  },

  // Virtual Desktop Patterns
  'virtual-desktop': {
    keywords: ['virtual desktop', 'avd', 'remote desktop', 'vdi', 'desktop virtualization'],
    description: 'Azure Virtual Desktop environment',
    resources: [
      'Microsoft.Network/virtualNetworks',
      'Microsoft.DesktopVirtualization/hostPools',
      'Microsoft.DesktopVirtualization/applicationGroups',
      'Microsoft.DesktopVirtualization/workspaces'
    ]
  },

  // Secure Infrastructure Patterns
  'secure-vm': {
    keywords: ['secure vm', 'virtual machine secure', 'vm with bastion', 'secure compute', 'beveiligde vm'],
    description: 'Secure VM with Bastion access',
    resources: [
      'Microsoft.Network/virtualNetworks',
      'Microsoft.Network/networkSecurityGroups',
      'Microsoft.Network/publicIPAddresses',
      'Microsoft.Network/bastionHosts',
      'Microsoft.Network/networkInterfaces',
      'Microsoft.Compute/virtualMachines',
      'Microsoft.KeyVault/vaults'
    ]
  },

  'hub-spoke': {
    keywords: ['hub spoke', 'hub and spoke', 'network topology', 'enterprise network', 'hub spoke netwerk'],
    description: 'Hub-spoke network topology',
    resources: [
      'Microsoft.Network/virtualNetworks',
      'Microsoft.Network/azureFirewalls',
      'Microsoft.Network/firewallPolicies',
      'Microsoft.Network/bastionHosts',
      'Microsoft.Network/publicIPAddresses'
    ]
  },

  'private-endpoints': {
    keywords: ['private endpoint', 'private link', 'private connectivity', 'secure connectivity'],
    description: 'Private endpoint configuration',
    resources: [
      'Microsoft.Network/virtualNetworks',
      'Microsoft.Network/privateEndpoints',
      'Microsoft.Network/privateDnsZones'
    ]
  },

  // AI & ML Patterns
  'ai-ml-workspace': {
    keywords: ['machine learning', 'ml workspace', 'ai workspace', 'mlops', 'ai platform'],
    description: 'Machine Learning workspace with dependencies',
    resources: [
      'Microsoft.Storage/storageAccounts',
      'Microsoft.KeyVault/vaults',
      'Microsoft.ContainerRegistry/registries',
      'Microsoft.Insights/components',
      'Microsoft.MachineLearningServices/workspaces'
    ]
  },

  'openai-solution': {
    keywords: ['openai', 'azure openai', 'gpt', 'chatgpt', 'ai chat'],
    description: 'Azure OpenAI solution',
    resources: [
      'Microsoft.CognitiveServices/accounts',
      'Microsoft.Search/searchServices',
      'Microsoft.Storage/storageAccounts',
      'Microsoft.KeyVault/vaults'
    ],
    config: {
      'Microsoft.CognitiveServices/accounts': { kind: 'OpenAI' }
    }
  },

  // Healthcare Patterns
  'healthcare-platform': {
    keywords: ['healthcare', 'health data', 'fhir', 'medical data', 'healthcare platform'],
    description: 'Healthcare data platform',
    resources: [
      'Microsoft.HealthcareApis/workspaces',
      'Microsoft.Storage/storageAccounts',
      'Microsoft.KeyVault/vaults'
    ]
  },

  // Monitoring & Governance
  'monitoring-stack': {
    keywords: ['observability platform', 'monitoring stack', 'complete monitoring', 'monitoring solution'],
    description: 'Complete monitoring stack',
    resources: [
      'Microsoft.OperationalInsights/workspaces',
      'Microsoft.Insights/components',
      'Microsoft.Dashboard/grafana'
    ]
  },

  // DevOps Patterns
  'devbox-environment': {
    keywords: ['devbox', 'dev box', 'developer workstation', 'dev environment'],
    description: 'DevBox development environment',
    resources: [
      'Microsoft.DevCenter/devcenters',
      'Microsoft.Network/virtualNetworks',
      'Microsoft.KeyVault/vaults'
    ]
  },

  // Integration Patterns
  'api-management': {
    keywords: ['api management', 'apim', 'api gateway', 'api platform'],
    description: 'API Management platform',
    resources: [
      'Microsoft.ApiManagement/service',
      'Microsoft.Insights/components',
      'Microsoft.OperationalInsights/workspaces'
    ]
  },

  'integration-platform': {
    keywords: ['integration', 'logic apps', 'workflow automation', 'integration platform'],
    description: 'Integration platform with Logic Apps',
    resources: [
      'Microsoft.Logic/workflows',
      'Microsoft.ServiceBus/namespaces',
      'Microsoft.Storage/storageAccounts'
    ]
  }
};

/**
 * Find a matching solution template
 */
export function findSolutionTemplate(description) {
  const lowerDesc = description.toLowerCase();
  
  for (const [templateId, template] of Object.entries(SOLUTION_TEMPLATES)) {
    for (const keyword of template.keywords) {
      if (lowerDesc.includes(keyword)) {
        return { templateId, ...template };
      }
    }
  }
  
  return null;
}

/**
 * Get all available templates
 */
export function getAllTemplates() {
  return Object.entries(SOLUTION_TEMPLATES).map(([id, template]) => ({
    id,
    description: template.description,
    keywords: template.keywords,
    resourceCount: template.resources.length
  }));
}

export default SOLUTION_TEMPLATES;
