export default [
  {
    id: 'br:avm/storage:latest',
    name: 'Storage Account',
    resource_type: 'Microsoft.Storage/storageAccounts',
    category: 'Storage',
    description: 'Azure Storage Account with blob, queue, table, and file storage',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/storage',
    bicep_path: 'br/public:storage/storage-account:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Storage account name' },
      kind: { type: 'string', required: false, default: 'StorageV2', description: 'Storage kind' },
      skuName: { type: 'string', required: false, default: 'Standard_LRS', description: 'SKU name' },
      accessTier: { type: 'string', required: false, default: 'Hot', description: 'Access tier' },
      httpsOnly: { type: 'bool', required: false, default: true, description: 'HTTPS only' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      name: { type: 'string', description: 'Resource name', value: 'module().outputs.name' }
    },
    resource_mappings: [
      { bicep_property: 'sku.name', module_parameter: 'skuName' },
      { bicep_property: 'properties.accessTier', module_parameter: 'accessTier' },
      { bicep_property: 'properties.supportsHttpsTrafficOnly', module_parameter: 'httpsOnly' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-06-01', '2022-05-01'],
    tags: ['storage', 'account', 'blob']
  },
  {
    id: 'br:avm/blob-container:latest',
    name: 'Blob Container',
    resource_type: 'Microsoft.Storage/storageAccounts/blobServices/containers',
    category: 'Storage',
    description: 'Azure Blob Storage container',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/blob-container',
    bicep_path: 'br/public:storage/blob-container:1.0',
    parameters: {
      storageAccountName: { type: 'string', required: true, description: 'Storage account name' },
      name: { type: 'string', required: true, description: 'Container name' },
      publicAccess: { type: 'string', required: false, default: 'None', description: 'Public access level' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'properties.publicAccess', module_parameter: 'publicAccess' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-06-01'],
    tags: ['storage', 'blob', 'container']
  }
];
