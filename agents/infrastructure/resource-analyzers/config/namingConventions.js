/**
 * Naming Conventions - Standard Azure naming prefixes
 * Based on Cloud Adoption Framework recommendations
 * 
 * Format: {prefix}-{environment}-{unique}
 * Example: vm-dev-abc123
 */

export const NAMING_PREFIXES = {
  // Compute
  'Microsoft.Compute/virtualMachines': 'vm',
  'Microsoft.Compute/virtualMachineScaleSets': 'vmss',
  'Microsoft.Compute/availabilitySets': 'avail',
  'Microsoft.Compute/disks': 'disk',
  
  // Web
  'Microsoft.Web/sites': 'app',
  'Microsoft.Web/serverfarms': 'plan',
  'Microsoft.Web/staticSites': 'stapp',
  
  // Storage
  'Microsoft.Storage/storageAccounts': 'st',
  
  // Database
  'Microsoft.Sql/servers': 'sql',
  'Microsoft.Sql/servers/databases': 'sqldb',
  'Microsoft.DocumentDB/databaseAccounts': 'cosmos',
  'Microsoft.DBforMySQL/flexibleServers': 'mysql',
  'Microsoft.DBforPostgreSQL/flexibleServers': 'psql',
  
  // Networking
  'Microsoft.Network/virtualNetworks': 'vnet',
  'Microsoft.Network/virtualNetworks/subnets': 'snet',
  'Microsoft.Network/networkSecurityGroups': 'nsg',
  'Microsoft.Network/networkInterfaces': 'nic',
  'Microsoft.Network/publicIPAddresses': 'pip',
  'Microsoft.Network/loadBalancers': 'lb',
  'Microsoft.Network/applicationGateways': 'agw',
  'Microsoft.Network/bastionHosts': 'bas',
  'Microsoft.Network/azureFirewalls': 'afw',
  'Microsoft.Network/firewallPolicies': 'afwp',
  'Microsoft.Network/natGateways': 'ng',
  'Microsoft.Network/privateEndpoints': 'pep',
  'Microsoft.Network/privateLinkServices': 'pls',
  'Microsoft.Network/dnsZones': 'dnsz',
  'Microsoft.Network/privateDnsZones': 'pdnsz',
  'Microsoft.Network/routeTables': 'rt',
  'Microsoft.Network/vpnGateways': 'vpng',
  'Microsoft.Network/expressRouteCircuits': 'erc',
  
  // Security
  'Microsoft.KeyVault/vaults': 'kv',
  'Microsoft.ManagedIdentity/userAssignedIdentities': 'id',
  
  // Containers
  'Microsoft.ContainerService/managedClusters': 'aks',
  'Microsoft.ContainerRegistry/registries': 'acr',
  'Microsoft.ContainerInstance/containerGroups': 'ci',
  'Microsoft.App/managedEnvironments': 'cae',
  'Microsoft.App/containerApps': 'ca',
  
  // Messaging
  'Microsoft.ServiceBus/namespaces': 'sb',
  'Microsoft.ServiceBus/namespaces/queues': 'sbq',
  'Microsoft.ServiceBus/namespaces/topics': 'sbt',
  'Microsoft.EventHub/namespaces': 'evh',
  'Microsoft.EventHub/namespaces/eventhubs': 'evh',
  'Microsoft.EventGrid/topics': 'evgt',
  'Microsoft.EventGrid/domains': 'evgd',
  
  // Monitoring
  'Microsoft.Insights/components': 'appi',
  'Microsoft.Insights/actionGroups': 'ag',
  'Microsoft.OperationalInsights/workspaces': 'log',
  
  // AI & ML
  'Microsoft.CognitiveServices/accounts': 'cog',
  'Microsoft.MachineLearningServices/workspaces': 'mlw',
  'Microsoft.Search/searchServices': 'srch',
  
  // Integration
  'Microsoft.Logic/workflows': 'logic',
  'Microsoft.ApiManagement/service': 'apim',
  'Microsoft.DataFactory/factories': 'adf',
  
  // Caching
  'Microsoft.Cache/redis': 'redis',
  
  // Analytics
  'Microsoft.Synapse/workspaces': 'syn',
  'Microsoft.Databricks/workspaces': 'dbw',
  'Microsoft.StreamAnalytics/streamingjobs': 'asa',
  'Microsoft.Kusto/clusters': 'dec',
  
  // CDN
  'Microsoft.Cdn/profiles': 'cdnp',
  'Microsoft.Cdn/profiles/endpoints': 'cdne',
  
  // IoT
  'Microsoft.Devices/IotHubs': 'iot',
  'Microsoft.Devices/provisioningServices': 'dps',
  'Microsoft.DigitalTwins/digitalTwinsInstances': 'dt',
  
  // Communication
  'Microsoft.Communication/communicationServices': 'acs',
  
  // Virtual Desktop
  'Microsoft.DesktopVirtualization/hostPools': 'vdpool',
  'Microsoft.DesktopVirtualization/workspaces': 'vdws',
  'Microsoft.DesktopVirtualization/applicationGroups': 'vdag',
  'Microsoft.DesktopVirtualization/scalingPlans': 'vdsp',
  
  // Dev Center
  'Microsoft.DevCenter/devcenters': 'dc',
  'Microsoft.DevCenter/projects': 'dcp',
  
  // Recovery
  'Microsoft.RecoveryServices/vaults': 'rsv',
  
  // Governance
  'Microsoft.Purview/accounts': 'pview',
  
  // Partner
  'Microsoft.Elastic/monitors': 'elastic',
  'Microsoft.Datadog/monitors': 'datadog',
  'Microsoft.Dashboard/grafana': 'graf',
  'Microsoft.Confluent/organizations': 'cflt',
  
  // Other
  'Microsoft.AppConfiguration/configurationStores': 'appcs',
  'Microsoft.SignalRService/signalR': 'sigr',
  'Microsoft.NotificationHubs/namespaces': 'ntfns',
  'Microsoft.Automation/automationAccounts': 'aa',
  'Microsoft.Batch/batchAccounts': 'ba',
  'Microsoft.LoadTestService/loadTests': 'lt',
  'Microsoft.AppPlatform/Spring': 'spring',
  
  // Default
  'default': 'res'
};

/**
 * Get naming prefix for a resource type
 */
export function getPrefix(resourceType) {
  return NAMING_PREFIXES[resourceType] || NAMING_PREFIXES['default'];
}

/**
 * Generate a resource name following conventions
 */
export function generateName(resourceType, environment = 'dev', suffix = null) {
  const prefix = getPrefix(resourceType);
  const envShort = getEnvironmentShort(environment);
  const unique = suffix || generateUniqueId();
  
  // Storage accounts have special naming (lowercase, no hyphens, max 24 chars)
  if (resourceType === 'Microsoft.Storage/storageAccounts') {
    return `${prefix}${envShort}${unique}`.toLowerCase().replace(/-/g, '').substring(0, 24);
  }
  
  // Container registries (lowercase, no hyphens)
  if (resourceType === 'Microsoft.ContainerRegistry/registries') {
    return `${prefix}${envShort}${unique}`.toLowerCase().replace(/-/g, '');
  }
  
  return `${prefix}-${envShort}-${unique}`;
}

/**
 * Get short environment name
 */
export function getEnvironmentShort(environment) {
  const envMap = {
    'production': 'prd',
    'prod': 'prd',
    'staging': 'stg',
    'stage': 'stg',
    'development': 'dev',
    'dev': 'dev',
    'test': 'tst',
    'qa': 'qa'
  };
  return envMap[environment?.toLowerCase()] || 'dev';
}

/**
 * Generate unique ID
 */
export function generateUniqueId(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
}

export default NAMING_PREFIXES;
