/**
 * Dependency Graph - Defines resource dependencies
 * 
 * Each resource type maps to:
 * - requires: Resources that MUST be created before this resource
 * - optional: Resources that are commonly used with this resource
 */

export const DEPENDENCY_GRAPH = {
  // Compute
  'Microsoft.Compute/virtualMachines': {
    requires: ['Microsoft.Network/networkInterfaces'],
    optional: ['Microsoft.Compute/disks', 'Microsoft.Network/networkSecurityGroups']
  },
  'Microsoft.Compute/virtualMachineScaleSets': {
    requires: ['Microsoft.Network/virtualNetworks'],
    optional: ['Microsoft.Network/loadBalancers', 'Microsoft.Network/applicationGateways']
  },

  // Networking
  'Microsoft.Network/networkInterfaces': {
    requires: ['Microsoft.Network/virtualNetworks'],
    optional: ['Microsoft.Network/publicIPAddresses', 'Microsoft.Network/networkSecurityGroups']
  },
  'Microsoft.Network/virtualNetworks': {
    requires: [],
    optional: ['Microsoft.Network/networkSecurityGroups']
  },
  'Microsoft.Network/bastionHosts': {
    requires: ['Microsoft.Network/virtualNetworks', 'Microsoft.Network/publicIPAddresses'],
    optional: []
  },
  'Microsoft.Network/applicationGateways': {
    requires: ['Microsoft.Network/virtualNetworks', 'Microsoft.Network/publicIPAddresses'],
    optional: []
  },
  'Microsoft.Network/azureFirewalls': {
    requires: ['Microsoft.Network/virtualNetworks', 'Microsoft.Network/publicIPAddresses'],
    optional: ['Microsoft.Network/firewallPolicies']
  },
  'Microsoft.Network/loadBalancers': {
    requires: [],
    optional: ['Microsoft.Network/publicIPAddresses', 'Microsoft.Network/virtualNetworks']
  },
  'Microsoft.Network/privateEndpoints': {
    requires: ['Microsoft.Network/virtualNetworks'],
    optional: ['Microsoft.Network/privateDnsZones']
  },

  // Web
  'Microsoft.Web/sites': {
    requires: ['Microsoft.Web/serverfarms'],
    optional: ['Microsoft.Insights/components', 'Microsoft.Storage/storageAccounts']
  },
  'Microsoft.Web/serverfarms': {
    requires: [],
    optional: []
  },
  'Microsoft.Web/staticSites': {
    requires: [],
    optional: []
  },

  // Containers
  'Microsoft.ContainerService/managedClusters': {
    requires: [],
    optional: ['Microsoft.Network/virtualNetworks', 'Microsoft.ContainerRegistry/registries', 'Microsoft.OperationalInsights/workspaces']
  },
  'Microsoft.App/containerApps': {
    requires: ['Microsoft.App/managedEnvironments'],
    optional: ['Microsoft.ContainerRegistry/registries']
  },
  'Microsoft.App/managedEnvironments': {
    requires: [],
    optional: ['Microsoft.OperationalInsights/workspaces', 'Microsoft.Network/virtualNetworks']
  },
  'Microsoft.ContainerRegistry/registries': {
    requires: [],
    optional: ['Microsoft.Network/privateEndpoints']
  },

  // Database
  'Microsoft.Sql/servers/databases': {
    requires: ['Microsoft.Sql/servers'],
    optional: []
  },
  'Microsoft.Sql/servers': {
    requires: [],
    optional: ['Microsoft.Network/privateEndpoints']
  },
  'Microsoft.DocumentDB/databaseAccounts': {
    requires: [],
    optional: ['Microsoft.Network/privateEndpoints']
  },
  'Microsoft.DocumentDB/databaseAccounts/sqlDatabases': {
    requires: ['Microsoft.DocumentDB/databaseAccounts'],
    optional: []
  },
  'Microsoft.DBforMySQL/flexibleServers': {
    requires: [],
    optional: ['Microsoft.Network/virtualNetworks', 'Microsoft.Network/privateDnsZones']
  },
  'Microsoft.DBforPostgreSQL/flexibleServers': {
    requires: [],
    optional: ['Microsoft.Network/virtualNetworks', 'Microsoft.Network/privateDnsZones']
  },

  // Storage
  'Microsoft.Storage/storageAccounts': {
    requires: [],
    optional: ['Microsoft.Network/privateEndpoints']
  },

  // Security
  'Microsoft.KeyVault/vaults': {
    requires: [],
    optional: ['Microsoft.Network/privateEndpoints']
  },

  // Caching
  'Microsoft.Cache/redis': {
    requires: [],
    optional: ['Microsoft.Network/virtualNetworks', 'Microsoft.Network/privateEndpoints']
  },

  // Messaging
  'Microsoft.EventHub/namespaces': {
    requires: [],
    optional: ['Microsoft.Network/privateEndpoints']
  },
  'Microsoft.EventHub/namespaces/eventhubs': {
    requires: ['Microsoft.EventHub/namespaces'],
    optional: []
  },
  'Microsoft.ServiceBus/namespaces': {
    requires: [],
    optional: ['Microsoft.Network/privateEndpoints']
  },
  'Microsoft.ServiceBus/namespaces/queues': {
    requires: ['Microsoft.ServiceBus/namespaces'],
    optional: []
  },
  'Microsoft.ServiceBus/namespaces/topics': {
    requires: ['Microsoft.ServiceBus/namespaces'],
    optional: []
  },

  // IoT
  'Microsoft.Devices/IotHubs': {
    requires: [],
    optional: ['Microsoft.Storage/storageAccounts', 'Microsoft.EventHub/namespaces']
  },
  'Microsoft.DigitalTwins/digitalTwinsInstances': {
    requires: [],
    optional: ['Microsoft.EventHub/namespaces', 'Microsoft.Devices/IotHubs']
  },

  // Virtual Desktop
  'Microsoft.DesktopVirtualization/hostPools': {
    requires: ['Microsoft.Network/virtualNetworks'],
    optional: ['Microsoft.DesktopVirtualization/workspaces', 'Microsoft.DesktopVirtualization/applicationGroups']
  },
  'Microsoft.DesktopVirtualization/applicationGroups': {
    requires: ['Microsoft.DesktopVirtualization/hostPools'],
    optional: []
  },
  'Microsoft.DesktopVirtualization/workspaces': {
    requires: [],
    optional: ['Microsoft.DesktopVirtualization/applicationGroups']
  },

  // Analytics
  'Microsoft.Synapse/workspaces': {
    requires: ['Microsoft.Storage/storageAccounts'],
    optional: ['Microsoft.KeyVault/vaults']
  },
  'Microsoft.Databricks/workspaces': {
    requires: [],
    optional: ['Microsoft.Network/virtualNetworks', 'Microsoft.KeyVault/vaults']
  },
  'Microsoft.Kusto/clusters': {
    requires: [],
    optional: ['Microsoft.Network/virtualNetworks']
  },
  'Microsoft.Kusto/clusters/databases': {
    requires: ['Microsoft.Kusto/clusters'],
    optional: []
  },

  // AI & ML
  'Microsoft.MachineLearningServices/workspaces': {
    requires: ['Microsoft.Storage/storageAccounts', 'Microsoft.KeyVault/vaults'],
    optional: ['Microsoft.ContainerRegistry/registries', 'Microsoft.Insights/components']
  },
  'Microsoft.CognitiveServices/accounts': {
    requires: [],
    optional: ['Microsoft.Network/privateEndpoints']
  },

  // Monitoring
  'Microsoft.Insights/components': {
    requires: [],
    optional: ['Microsoft.OperationalInsights/workspaces']
  },
  'Microsoft.OperationalInsights/workspaces': {
    requires: [],
    optional: []
  },

  // API Management
  'Microsoft.ApiManagement/service': {
    requires: [],
    optional: ['Microsoft.Network/virtualNetworks', 'Microsoft.Insights/components']
  },

  // Logic Apps
  'Microsoft.Logic/workflows': {
    requires: [],
    optional: ['Microsoft.Web/connections']
  },

  // Healthcare
  'Microsoft.HealthcareApis/workspaces': {
    requires: [],
    optional: []
  },
  'Microsoft.HealthcareApis/workspaces/fhirservices': {
    requires: ['Microsoft.HealthcareApis/workspaces'],
    optional: []
  },

  // Recovery Services
  'Microsoft.RecoveryServices/vaults': {
    requires: [],
    optional: []
  }
};

/**
 * Get dependencies for a resource type
 */
export function getDependencies(resourceType) {
  return DEPENDENCY_GRAPH[resourceType] || { requires: [], optional: [] };
}

/**
 * Get all required dependencies (recursive)
 */
export function getAllRequiredDependencies(resourceType, visited = new Set()) {
  if (visited.has(resourceType)) return [];
  visited.add(resourceType);
  
  const deps = getDependencies(resourceType);
  const allDeps = [...deps.requires];
  
  for (const dep of deps.requires) {
    allDeps.push(...getAllRequiredDependencies(dep, visited));
  }
  
  return [...new Set(allDeps)];
}

export default DEPENDENCY_GRAPH;
