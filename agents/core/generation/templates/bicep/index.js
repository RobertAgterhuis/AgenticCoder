/**
 * Bicep Templates - Index
 * Handlebars templates for Azure Bicep IaC
 */

const fs = require('fs');
const path = require('path');

const loadTemplate = (category, name) => {
  const filePath = path.join(__dirname, category, `${name}.bicep.hbs`);
  return fs.readFileSync(filePath, 'utf-8');
};

const templates = {
  core: {
    main: loadTemplate('core', 'main'),
    module: loadTemplate('core', 'module'),
  },
  compute: {
    appService: loadTemplate('compute', 'app-service'),
    functionApp: loadTemplate('compute', 'function-app'),
    containerApp: loadTemplate('compute', 'container-app'),
  },
  data: {
    sqlDatabase: loadTemplate('data', 'sql-database'),
    cosmosDb: loadTemplate('data', 'cosmos-db'),
    storage: loadTemplate('data', 'storage'),
  },
  identity: {
    managedIdentity: loadTemplate('identity', 'managed-identity'),
    entraId: loadTemplate('identity', 'entra-id'),
  },
  security: {
    keyvault: loadTemplate('security', 'keyvault'),
    privateEndpoint: loadTemplate('security', 'private-endpoint'),
  },
  networking: {
    vnet: loadTemplate('networking', 'vnet'),
    nsg: loadTemplate('networking', 'nsg'),
    appGateway: loadTemplate('networking', 'app-gateway'),
  },
  monitoring: {
    appInsights: loadTemplate('monitoring', 'app-insights'),
    logAnalytics: loadTemplate('monitoring', 'log-analytics'),
  },
};

module.exports = {
  templates,
  category: 'bicep',
  framework: 'bicep',
  version: '0.24+',
  language: 'bicep',
  
  metadata: {
    categories: [
      { name: 'core', description: 'Base module templates', templates: ['main', 'module'] },
      { name: 'compute', description: 'Compute resources', templates: ['app-service', 'function-app', 'container-app'] },
      { name: 'data', description: 'Data and storage resources', templates: ['sql-database', 'cosmos-db', 'storage'] },
      { name: 'identity', description: 'Identity resources', templates: ['managed-identity', 'entra-id'] },
      { name: 'security', description: 'Security resources', templates: ['keyvault', 'private-endpoint'] },
      { name: 'networking', description: 'Networking resources', templates: ['vnet', 'nsg', 'app-gateway'] },
      { name: 'monitoring', description: 'Monitoring resources', templates: ['app-insights', 'log-analytics'] }
    ]
  }
};
