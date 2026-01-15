export default [
  {
    id: 'br:avm/key-vault:latest',
    name: 'Key Vault',
    resource_type: 'Microsoft.KeyVault/vaults',
    category: 'Security',
    description: 'Azure Key Vault',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/key-vault',
    bicep_path: 'br/public:key-vault/vault:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Key Vault name' },
      tenantId: { type: 'string', required: true, description: 'Tenant ID' },
      skuName: { type: 'string', required: false, default: 'standard', description: 'SKU name' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      vaultUri: { type: 'string', description: 'Vault URI', value: 'module().outputs.vaultUri' }
    },
    resource_mappings: [
      { bicep_property: 'properties.tenantId', module_parameter: 'tenantId' },
      { bicep_property: 'properties.sku.name', module_parameter: 'skuName' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-10-01'],
    tags: ['security', 'key-vault', 'secrets']
  },
  {
    id: 'br:avm/managed-identity:latest',
    name: 'Managed Identity',
    resource_type: 'Microsoft.ManagedIdentity/userAssignedIdentities',
    category: 'Security',
    description: 'Azure Managed Identity',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/managed-identity',
    bicep_path: 'br/public:managed-identity/user-assigned-identity:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Identity name' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      principalId: { type: 'string', description: 'Principal ID', value: 'module().outputs.principalId' },
      clientId: { type: 'string', description: 'Client ID', value: 'module().outputs.clientId' }
    },
    resource_mappings: [],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-09-30'],
    tags: ['security', 'identity', 'managed-identity']
  },
  {
    id: 'br:avm/log-analytics:latest',
    name: 'Log Analytics Workspace',
    resource_type: 'Microsoft.OperationalInsights/workspaces',
    category: 'Security',
    description: 'Azure Log Analytics Workspace',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/log-analytics',
    bicep_path: 'br/public:operational-insights/workspace:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Workspace name' },
      retentionInDays: { type: 'int', required: false, default: 30, description: 'Retention in days' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'properties.retentionInDays', module_parameter: 'retentionInDays' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-06-01'],
    tags: ['security', 'monitoring', 'log-analytics']
  }
];
