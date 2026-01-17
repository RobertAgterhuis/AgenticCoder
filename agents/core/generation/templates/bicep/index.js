/**
 * Bicep Templates - Index
 */

const coreModule = require('./core/module.template');
const appService = require('./compute/app-service.template');
const sqlDatabase = require('./data/sql-database.template');
const storage = require('./data/storage.template');
const keyvault = require('./security/keyvault.template');
const appInsights = require('./monitoring/app-insights.template');

module.exports = {
  core: {
    module: coreModule
  },
  compute: {
    appService
  },
  data: {
    sqlDatabase,
    storage
  },
  security: {
    keyvault
  },
  monitoring: {
    appInsights
  },
  
  // Template metadata
  metadata: {
    framework: 'bicep',
    version: '0.24+',
    language: 'bicep',
    categories: [
      {
        name: 'core',
        description: 'Base module templates',
        templates: ['module']
      },
      {
        name: 'compute',
        description: 'Compute resources',
        templates: ['app-service', 'function-app', 'container-app']
      },
      {
        name: 'data',
        description: 'Data and storage resources',
        templates: ['sql-database', 'cosmos-db', 'storage']
      },
      {
        name: 'security',
        description: 'Security resources',
        templates: ['keyvault', 'managed-identity', 'private-endpoint']
      },
      {
        name: 'networking',
        description: 'Networking resources',
        templates: ['vnet', 'nsg', 'app-gateway']
      },
      {
        name: 'monitoring',
        description: 'Monitoring resources',
        templates: ['app-insights', 'log-analytics']
      }
    ]
  }
};
