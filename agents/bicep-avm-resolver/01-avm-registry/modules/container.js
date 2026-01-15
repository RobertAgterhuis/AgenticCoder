export default [
  {
    id: 'br:avm/container-registry:latest',
    name: 'Container Registry',
    resource_type: 'Microsoft.ContainerRegistry/registries',
    category: 'Container',
    description: 'Azure Container Registry',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/container-registry',
    bicep_path: 'br/public:container-registry/registry:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Registry name' },
      skuName: { type: 'string', required: false, default: 'Standard', description: 'SKU name' },
      adminUserEnabled: { type: 'bool', required: false, default: false, description: 'Enable admin user' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      loginServer: { type: 'string', description: 'Login server', value: 'module().outputs.loginServer' }
    },
    resource_mappings: [
      { bicep_property: 'sku.name', module_parameter: 'skuName' },
      { bicep_property: 'properties.adminUserEnabled', module_parameter: 'adminUserEnabled' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-09-01'],
    tags: ['container', 'registry', 'docker']
  },
  {
    id: 'br:avm/aks-cluster:latest',
    name: 'AKS Cluster',
    resource_type: 'Microsoft.ContainerService/managedClusters',
    category: 'Container',
    description: 'Azure Kubernetes Service cluster',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/aks-cluster',
    bicep_path: 'br/public:container-service/managed-cluster:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Cluster name' },
      dnsPrefix: { type: 'string', required: true, description: 'DNS prefix' },
      kubernetesVersion: { type: 'string', required: false, default: '1.27', description: 'Kubernetes version' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      fqdn: { type: 'string', description: 'FQDN', value: 'module().outputs.fqdn' }
    },
    resource_mappings: [
      { bicep_property: 'properties.dnsPrefix', module_parameter: 'dnsPrefix' },
      { bicep_property: 'properties.kubernetesVersion', module_parameter: 'kubernetesVersion' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2022-07-01', '2023-01-01'],
    tags: ['container', 'kubernetes', 'aks']
  },
  {
    id: 'br:avm/container-instance:latest',
    name: 'Container Instance',
    resource_type: 'Microsoft.ContainerInstance/containerGroups',
    category: 'Container',
    description: 'Azure Container Instance for running containers',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/container-instance',
    bicep_path: 'br/public:container-instance/container-group:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Container group name' },
      containerName: { type: 'string', required: true, description: 'Container name' },
      image: { type: 'string', required: true, description: 'Container image' },
      cpuCores: { type: 'int', required: false, default: 1, description: 'CPU cores' },
      memoryInGb: { type: 'int', required: false, default: 1, description: 'Memory in GB' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'properties.containers[0].name', module_parameter: 'containerName' },
      { bicep_property: 'properties.containers[0].properties.image', module_parameter: 'image' },
      { bicep_property: 'properties.containers[0].properties.resources.requests.cpu', module_parameter: 'cpuCores' },
      { bicep_property: 'properties.containers[0].properties.resources.requests.memoryInGB', module_parameter: 'memoryInGb' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-09-01'],
    tags: ['container', 'container-instance', 'serverless']
  }
];
