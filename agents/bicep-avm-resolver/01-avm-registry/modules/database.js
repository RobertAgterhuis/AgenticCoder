export default [
  {
    id: 'br:avm/sql-server:latest',
    name: 'SQL Server',
    resource_type: 'Microsoft.Sql/servers',
    category: 'Database',
    description: 'Azure SQL Server',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/sql-server',
    bicep_path: 'br/public:sql/server:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Server name' },
      administratorLogin: { type: 'string', required: true, description: 'Admin login' },
      administratorLoginPassword: { type: 'securestring', required: true, description: 'Admin password' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      fullyQualifiedDomainName: { type: 'string', description: 'FQDN', value: 'module().outputs.fqdn' }
    },
    resource_mappings: [
      { bicep_property: 'properties.administratorLogin', module_parameter: 'administratorLogin' },
      { bicep_property: 'properties.administratorLoginPassword', module_parameter: 'administratorLoginPassword' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-11-01'],
    tags: ['database', 'sql', 'relational']
  },
  {
    id: 'br:avm/sql-database:latest',
    name: 'SQL Database',
    resource_type: 'Microsoft.Sql/servers/databases',
    category: 'Database',
    description: 'Azure SQL Database',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/sql-database',
    bicep_path: 'br/public:sql/database:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Database name' },
      serverName: { type: 'string', required: true, description: 'SQL Server name' },
      skuName: { type: 'string', required: false, default: 'Standard', description: 'SKU name' },
      skuTier: { type: 'string', required: false, default: 'Standard', description: 'SKU tier' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'sku.name', module_parameter: 'skuName' },
      { bicep_property: 'sku.tier', module_parameter: 'skuTier' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-11-01'],
    tags: ['database', 'sql', 'relational']
  },
  {
    id: 'br:avm/cosmos-db:latest',
    name: 'Cosmos DB Account',
    resource_type: 'Microsoft.DocumentDB/databaseAccounts',
    category: 'Database',
    description: 'Azure Cosmos DB account',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/cosmos-db',
    bicep_path: 'br/public:documentdb/database-account:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Account name' },
      defaultConsistencyLevel: { type: 'string', required: false, default: 'Session', description: 'Consistency level' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' },
      documentEndpoint: { type: 'string', description: 'Document endpoint', value: 'module().outputs.documentEndpoint' }
    },
    resource_mappings: [
      { bicep_property: 'properties.consistencyPolicy.defaultConsistencyLevel', module_parameter: 'defaultConsistencyLevel' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-10-15'],
    tags: ['database', 'nosql', 'cosmos']
  },
  {
    id: 'br:avm/postgresql:latest',
    name: 'PostgreSQL Server',
    resource_type: 'Microsoft.DBforPostgreSQL/servers',
    category: 'Database',
    description: 'Azure Database for PostgreSQL',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/postgresql',
    bicep_path: 'br/public:dbforpostgresql/server:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Server name' },
      administratorLogin: { type: 'string', required: true, description: 'Admin login' },
      administratorLoginPassword: { type: 'securestring', required: true, description: 'Admin password' },
      version: { type: 'string', required: false, default: '14', description: 'PostgreSQL version' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'properties.version', module_parameter: 'version' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-06-01'],
    tags: ['database', 'postgresql', 'relational']
  },
  {
    id: 'br:avm/mysql:latest',
    name: 'MySQL Server',
    resource_type: 'Microsoft.DBforMySQL/servers',
    category: 'Database',
    description: 'Azure Database for MySQL',
    version: 'latest',
    published_date: '2026-01-15',
    maintainer: 'Microsoft',
    module_path: 'br:avm/mysql',
    bicep_path: 'br/public:dbformysql/server:1.0',
    parameters: {
      location: { type: 'string', required: true, description: 'Azure region' },
      name: { type: 'string', required: true, description: 'Server name' },
      administratorLogin: { type: 'string', required: true, description: 'Admin login' },
      administratorLoginPassword: { type: 'securestring', required: true, description: 'Admin password' },
      version: { type: 'string', required: false, default: '8.0', description: 'MySQL version' }
    },
    outputs: {
      id: { type: 'string', description: 'Resource ID', value: 'module().outputs.resourceId' }
    },
    resource_mappings: [
      { bicep_property: 'properties.version', module_parameter: 'version' }
    ],
    min_bicep_version: '0.4.0',
    azure_api_versions: ['2021-05-01'],
    tags: ['database', 'mysql', 'relational']
  }
];
