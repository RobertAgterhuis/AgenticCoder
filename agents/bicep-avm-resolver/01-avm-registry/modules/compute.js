export default [
  {
    id: 'br:avm/app-service-plan:latest',
    name: 'App Service Plan',
    resource_type: 'Microsoft.Web/serverfarms',
    category: 'Compute',
    description: 'Azure App Service Plan',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/app-service-plan',
    bicep_path: 'br/public:web/serverfarm:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Plan name' },
      skuName: { type: 'string', required: false, default: 'B1', description: 'SKU name' },
      skuTier: { type: 'string', required: false, default: 'Basic', description: 'SKU tier' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'sku.name', module_parameter: 'skuName' },
      { bicep_property: 'sku.tier', module_parameter: 'skuTier' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-02-01'],
    tags: ['compute', 'app-service', 'plan']
  },
  {
    id: 'br:avm/web-app:latest',
    name: 'Web App',
    resource_type: 'Microsoft.Web/sites',
    category: 'Compute',
    description: 'Azure Web App',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/web-app',
    bicep_path: 'br/public:web/site:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Web App name' },
      appServicePlanId: { type: 'string', required: true, description: 'App Service Plan ID' },
      httpsOnly: { type: 'bool', required: false, default: true, description: 'HTTPS only' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      defaultHostName: { type: 'string', description: 'Default hostname', value: 'module().outputs.defaultHostName' }
    },
    resource_mappings: [
      { bicep_property: 'properties.serverFarmId', module_parameter: 'appServicePlanId' },
      { bicep_property: 'properties.httpsOnly', module_parameter: 'httpsOnly' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-02-01', '2022-03-01'],
    tags: ['compute', 'app-service', 'web']
  }
];
