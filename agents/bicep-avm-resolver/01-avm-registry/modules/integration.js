export default [
  {
    id: 'br:avm/service-bus:latest',
    name: 'Service Bus Namespace',
    resource_type: 'Microsoft.ServiceBus/namespaces',
    category: 'Integration',
    description: 'Azure Service Bus namespace',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/service-bus',
    bicep_path: 'br/public:service-bus/namespace:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Namespace name' },
      skuName: { type: 'string', required: false, default: 'Standard', description: 'SKU name' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'sku.name', module_parameter: 'skuName' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-11-01'],
    tags: ['integration', 'messaging', 'service-bus']
  },
  {
    id: 'br:avm/event-grid-topic:latest',
    name: 'Event Grid Topic',
    resource_type: 'Microsoft.EventGrid/topics',
    category: 'Integration',
    description: 'Azure Event Grid topic',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/event-grid-topic',
    bicep_path: 'br/public:event-grid/topic:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Topic name' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      endpoint: { type: 'string', description: 'Endpoint', value: 'module().outputs.endpoint' }
    },
    resource_mappings: [],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-12-01'],
    tags: ['integration', 'events', 'event-grid']
  },
  {
    id: 'br:avm/api-management:latest',
    name: 'API Management',
    resource_type: 'Microsoft.ApiManagement/service',
    category: 'Integration',
    description: 'Azure API Management service',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/api-management',
    bicep_path: 'br/public:api-management/service:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Service name' },
      publisherEmail: { type: 'string', required: true, description: 'Publisher email' },
      publisherName: { type: 'string', required: true, description: 'Publisher name' },
      skuName: { type: 'string', required: false, default: 'Developer', description: 'SKU name' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      gatewayUrl: { type: 'string', description: 'Gateway URL', value: 'module().outputs.gatewayUrl' }
    },
    resource_mappings: [
      { bicep_property: 'sku.name', module_parameter: 'skuName' },
      { bicep_property: 'properties.publisherEmail', module_parameter: 'publisherEmail' },
      { bicep_property: 'properties.publisherName', module_parameter: 'publisherName' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-08-01'],
    tags: ['integration', 'api', 'api-management']
  },
  {
    id: 'br:avm/logic-app:latest',
    name: 'Logic App',
    resource_type: 'Microsoft.Logic/workflows',
    category: 'Integration',
    description: 'Azure Logic App',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/logic-app',
    bicep_path: 'br/public:logic/workflow:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Logic App name' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2019-05-01'],
    tags: ['integration', 'logic-app', 'workflow']
  }
];
