export default [
  {
    id: 'br:avm/virtual-network:latest',
    name: 'Virtual Network',
    resource_type: 'Microsoft.Network/virtualNetworks',
    category: 'Network',
    description: 'Azure Virtual Network',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/virtual-network',
    bicep_path: 'br/public:network/virtual-network:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'VNet name' },
      addressPrefixes: { type: 'array', required: true, description: 'Address prefixes' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'properties.addressSpace.addressPrefixes', module_parameter: 'addressPrefixes' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-05-01'],
    tags: ['network', 'vnet', 'infrastructure']
  },
  {
    id: 'br:avm/subnet:latest',
    name: 'Subnet',
    resource_type: 'Microsoft.Network/virtualNetworks/subnets',
    category: 'Network',
    description: 'Azure Virtual Network Subnet',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/subnet',
    bicep_path: 'br/public:network/subnet:1.0',
    parameters: {
      name: { type: 'string', required: true, description: 'Subnet name' },
      virtualNetworkName: { type: 'string', required: true, description: 'VNet name' },
      addressPrefix: { type: 'string', required: true, description: 'Address prefix' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'properties.addressPrefix', module_parameter: 'addressPrefix' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-05-01'],
    tags: ['network', 'subnet', 'vnet']
  },
  {
    id: 'br:avm/nsg:latest',
    name: 'Network Security Group',
    resource_type: 'Microsoft.Network/networkSecurityGroups',
    category: 'Network',
    description: 'Azure Network Security Group',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/nsg',
    bicep_path: 'br/public:network/network-security-group:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'NSG name' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-05-01'],
    tags: ['network', 'security', 'nsg']
  },
  {
    id: 'br:avm/load-balancer:latest',
    name: 'Load Balancer',
    resource_type: 'Microsoft.Network/loadBalancers',
    category: 'Network',
    description: 'Azure Load Balancer',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/load-balancer',
    bicep_path: 'br/public:network/load-balancer:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Load balancer name' },
      skuName: { type: 'string', required: false, default: 'Standard', description: 'SKU name' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'sku.name', module_parameter: 'skuName' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-05-01'],
    tags: ['network', 'load-balancer', 'traffic']
  },
  {
    id: 'br:avm/app-gateway:latest',
    name: 'Application Gateway',
    resource_type: 'Microsoft.Network/applicationGateways',
    category: 'Network',
    description: 'Azure Application Gateway',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/app-gateway',
    bicep_path: 'br/public:network/application-gateway:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Application Gateway name' },
      skuName: { type: 'string', required: false, default: 'WAF_v2', description: 'SKU name' },
      capacity: { type: 'int', required: false, default: 2, description: 'Capacity' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'properties.sku.name', module_parameter: 'skuName' },
      { bicep_property: 'properties.sku.capacity', module_parameter: 'capacity' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-05-01'],
    tags: ['network', 'application-gateway', 'waf']
  },
  {
    id: 'br:avm/private-endpoint:latest',
    name: 'Private Endpoint',
    resource_type: 'Microsoft.Network/privateEndpoints',
    category: 'Network',
    description: 'Azure Private Endpoint',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/private-endpoint',
    bicep_path: 'br/public:network/private-endpoint:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Private endpoint name' },
      subnetId: { type: 'string', required: true, description: 'Subnet ID' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'properties.subnet.id', module_parameter: 'subnetId' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-05-01'],
    tags: ['network', 'private-endpoint', 'security']
  }
];
