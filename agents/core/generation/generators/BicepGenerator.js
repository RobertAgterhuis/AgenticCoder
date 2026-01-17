/**
 * BicepGenerator - Generates Azure Bicep infrastructure as code
 * 
 * Produces:
 * - Main deployment template (main.bicep)
 * - Resource modules (App Service, SQL, Storage, etc.)
 * - Parameter files for different environments
 * - Module compositions
 */

const BaseGenerator = require('./BaseGenerator');

class BicepGenerator extends BaseGenerator {
  /**
   * @param {Object} templateRegistry - Template registry instance
   * @param {Object} promptComposer - Prompt composer instance
   */
  constructor(templateRegistry, promptComposer) {
    super('bicep', { platform: 'azure', iac: 'bicep' });
    this.templateRegistry = templateRegistry;
    this.promptComposer = promptComposer;
  }

  /**
   * Check if this generator supports the given tech stack
   */
  supports(techStack) {
    const infrastructure = techStack.infrastructure;
    return infrastructure && (
      infrastructure.platform === 'azure' ||
      infrastructure.iac === 'bicep'
    );
  }

  /**
   * Priority - Infrastructure generator runs last
   */
  get priority() {
    return 50;
  }

  /**
   * Generate all Bicep files for a project
   */
  async generate(context) {
    const files = [];
    const requirements = context.requirements;
    const infraConfig = requirements.infrastructure || {};

    // Determine which resources are needed
    const resources = this.determineResources(context);

    // Generate resource modules
    for (const resource of resources) {
      files.push(await this.generateModule(context, resource));
    }

    // Generate main.bicep
    files.push(await this.generateMain(context, resources));

    // Generate parameter files for each environment
    const environments = infraConfig.environments || ['dev', 'staging', 'prod'];
    for (const env of environments) {
      files.push(await this.generateParameterFile(context, env, resources));
    }

    // Generate deployment script
    files.push(await this.generateDeployScript(context));

    return files;
  }

  /**
   * Determine which Azure resources are needed based on tech stack
   */
  determineResources(context) {
    const resources = [];
    const techStack = context.techStack || {};
    const infraConfig = context.requirements.infrastructure || {};

    // Always need a resource group (implicit)
    
    // App Service for web apps
    if (techStack.frontend || techStack.backend) {
      resources.push({
        type: 'appService',
        name: 'webApp',
        config: infraConfig.appService || {}
      });
      resources.push({
        type: 'appServicePlan',
        name: 'appServicePlan',
        config: infraConfig.appServicePlan || {}
      });
    }

    // SQL Database if PostgreSQL or SQL is used
    if (techStack.database) {
      resources.push({
        type: 'sqlServer',
        name: 'sqlServer',
        config: infraConfig.sqlServer || {}
      });
      resources.push({
        type: 'sqlDatabase',
        name: 'sqlDatabase',
        config: infraConfig.sqlDatabase || {}
      });
    }

    // Storage account for blobs/files
    if (infraConfig.storage !== false) {
      resources.push({
        type: 'storageAccount',
        name: 'storage',
        config: infraConfig.storage || {}
      });
    }

    // Key Vault for secrets
    if (infraConfig.keyVault !== false) {
      resources.push({
        type: 'keyVault',
        name: 'keyVault',
        config: infraConfig.keyVault || {}
      });
    }

    // Application Insights for monitoring
    if (infraConfig.monitoring !== false) {
      resources.push({
        type: 'appInsights',
        name: 'appInsights',
        config: infraConfig.appInsights || {}
      });
      resources.push({
        type: 'logAnalytics',
        name: 'logAnalytics',
        config: {}
      });
    }

    return resources;
  }

  /**
   * Generate a resource module
   */
  async generateModule(context, resource) {
    const generators = {
      appService: this.generateAppServiceModule,
      appServicePlan: this.generateAppServicePlanModule,
      sqlServer: this.generateSqlServerModule,
      sqlDatabase: this.generateSqlDatabaseModule,
      storageAccount: this.generateStorageModule,
      keyVault: this.generateKeyVaultModule,
      appInsights: this.generateAppInsightsModule,
      logAnalytics: this.generateLogAnalyticsModule,
    };

    const generator = generators[resource.type];
    if (generator) {
      const content = generator.call(this, context, resource);
      return this.createFile(
        `infrastructure/modules/${this.toKebabCase(resource.type)}.bicep`,
        content,
        'bicep-module'
      );
    }

    return null;
  }

  /**
   * Generate App Service Plan module
   */
  generateAppServicePlanModule(context, resource) {
    return `@description('The name of the App Service Plan')
param name string

@description('The location for the resource')
param location string = resourceGroup().location

@description('The SKU for the App Service Plan')
@allowed(['F1', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1v2', 'P2v2', 'P3v2', 'P1v3', 'P2v3', 'P3v3'])
param skuName string = 'B1'

@description('Tags for the resource')
param tags object = {}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

output id string = appServicePlan.id
output name string = appServicePlan.name
`;
  }

  /**
   * Generate App Service module
   */
  generateAppServiceModule(context, resource) {
    return `@description('The name of the App Service')
param name string

@description('The location for the resource')
param location string = resourceGroup().location

@description('The App Service Plan ID')
param appServicePlanId string

@description('The runtime stack')
@allowed(['NODE|18-lts', 'NODE|20-lts', 'DOTNETCORE|8.0', 'PYTHON|3.11', 'PYTHON|3.12'])
param linuxFxVersion string = 'NODE|20-lts'

@description('Application Insights Instrumentation Key')
param appInsightsInstrumentationKey string = ''

@description('Application settings')
param appSettings array = []

@description('Tags for the resource')
param tags object = {}

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlanId
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: concat([
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsInstrumentationKey
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
      ], appSettings)
    }
    httpsOnly: true
  }
  identity: {
    type: 'SystemAssigned'
  }
}

output id string = webApp.id
output name string = webApp.name
output defaultHostname string = webApp.properties.defaultHostName
output principalId string = webApp.identity.principalId
`;
  }

  /**
   * Generate SQL Server module
   */
  generateSqlServerModule(context, resource) {
    return `@description('The name of the SQL Server')
param name string

@description('The location for the resource')
param location string = resourceGroup().location

@description('The administrator login')
param administratorLogin string

@secure()
@description('The administrator password')
param administratorPassword string

@description('Tags for the resource')
param tags object = {}

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: name
  location: location
  tags: tags
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// Allow Azure services
resource firewallRule 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output id string = sqlServer.id
output name string = sqlServer.name
output fullyQualifiedDomainName string = sqlServer.properties.fullyQualifiedDomainName
`;
  }

  /**
   * Generate SQL Database module
   */
  generateSqlDatabaseModule(context, resource) {
    return `@description('The name of the SQL Database')
param name string

@description('The location for the resource')
param location string = resourceGroup().location

@description('The SQL Server name')
param sqlServerName string

@description('The SKU name')
@allowed(['Basic', 'S0', 'S1', 'S2', 'P1', 'P2', 'GP_S_Gen5_1', 'GP_Gen5_2'])
param skuName string = 'Basic'

@description('Tags for the resource')
param tags object = {}

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' existing = {
  name: sqlServerName
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648
  }
}

output id string = sqlDatabase.id
output name string = sqlDatabase.name
`;
  }

  /**
   * Generate Storage Account module
   */
  generateStorageModule(context, resource) {
    return `@description('The name of the Storage Account')
param name string

@description('The location for the resource')
param location string = resourceGroup().location

@description('The SKU name')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_RAGRS', 'Premium_LRS'])
param skuName string = 'Standard_LRS'

@description('Tags for the resource')
param tags object = {}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

output id string = storageAccount.id
output name string = storageAccount.name
output primaryEndpoints object = storageAccount.properties.primaryEndpoints
`;
  }

  /**
   * Generate Key Vault module
   */
  generateKeyVaultModule(context, resource) {
    return `@description('The name of the Key Vault')
param name string

@description('The location for the resource')
param location string = resourceGroup().location

@description('The tenant ID')
param tenantId string = subscription().tenantId

@description('Tags for the resource')
param tags object = {}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    publicNetworkAccess: 'Enabled'
  }
}

output id string = keyVault.id
output name string = keyVault.name
output uri string = keyVault.properties.vaultUri
`;
  }

  /**
   * Generate Application Insights module
   */
  generateAppInsightsModule(context, resource) {
    return `@description('The name of the Application Insights')
param name string

@description('The location for the resource')
param location string = resourceGroup().location

@description('The Log Analytics workspace ID')
param logAnalyticsWorkspaceId string

@description('Tags for the resource')
param tags object = {}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: name
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspaceId
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

output id string = appInsights.id
output name string = appInsights.name
output instrumentationKey string = appInsights.properties.InstrumentationKey
output connectionString string = appInsights.properties.ConnectionString
`;
  }

  /**
   * Generate Log Analytics module
   */
  generateLogAnalyticsModule(context, resource) {
    return `@description('The name of the Log Analytics workspace')
param name string

@description('The location for the resource')
param location string = resourceGroup().location

@description('Tags for the resource')
param tags object = {}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

output id string = logAnalytics.id
output name string = logAnalytics.name
`;
  }

  /**
   * Generate main.bicep
   */
  async generateMain(context, resources) {
    const projectName = this.toKebabCase(context.projectName);
    
    let params = `@description('The environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('The location for all resources')
param location string = resourceGroup().location

@description('The project name')
param projectName string = '${projectName}'

`;

    // Add secure parameters if needed
    if (resources.some(r => r.type === 'sqlServer')) {
      params += `@secure()
@description('SQL Server administrator password')
param sqlAdminPassword string

`;
    }

    let variables = `// Variables
var resourcePrefix = '\${projectName}-\${environment}'
var tags = {
  project: projectName
  environment: environment
}

`;

    let modules = '';
    let outputs = '';

    // Generate module calls based on resources
    for (const resource of resources) {
      const moduleName = this.toCamelCase(resource.name);
      const moduleFile = this.toKebabCase(resource.type);

      switch (resource.type) {
        case 'logAnalytics':
          modules += `module ${moduleName} 'modules/${moduleFile}.bicep' = {
  name: '${moduleName}-deployment'
  params: {
    name: '\${resourcePrefix}-logs'
    location: location
    tags: tags
  }
}

`;
          outputs += `output logAnalyticsId string = ${moduleName}.outputs.id\n`;
          break;

        case 'appInsights':
          modules += `module ${moduleName} 'modules/${moduleFile}.bicep' = {
  name: '${moduleName}-deployment'
  params: {
    name: '\${resourcePrefix}-insights'
    location: location
    logAnalyticsWorkspaceId: logAnalytics.outputs.id
    tags: tags
  }
}

`;
          outputs += `output appInsightsKey string = ${moduleName}.outputs.instrumentationKey\n`;
          break;

        case 'appServicePlan':
          modules += `module ${moduleName} 'modules/${moduleFile}.bicep' = {
  name: '${moduleName}-deployment'
  params: {
    name: '\${resourcePrefix}-plan'
    location: location
    skuName: environment == 'prod' ? 'P1v2' : 'B1'
    tags: tags
  }
}

`;
          break;

        case 'appService':
          modules += `module ${moduleName} 'modules/${moduleFile}.bicep' = {
  name: '${moduleName}-deployment'
  params: {
    name: '\${resourcePrefix}-app'
    location: location
    appServicePlanId: appServicePlan.outputs.id
    appInsightsInstrumentationKey: appInsights.outputs.connectionString
    tags: tags
  }
}

`;
          outputs += `output webAppUrl string = 'https://\${${moduleName}.outputs.defaultHostname}'\n`;
          break;

        case 'sqlServer':
          modules += `module ${moduleName} 'modules/${moduleFile}.bicep' = {
  name: '${moduleName}-deployment'
  params: {
    name: '\${resourcePrefix}-sql'
    location: location
    administratorLogin: 'sqladmin'
    administratorPassword: sqlAdminPassword
    tags: tags
  }
}

`;
          break;

        case 'sqlDatabase':
          modules += `module ${moduleName} 'modules/${moduleFile}.bicep' = {
  name: '${moduleName}-deployment'
  params: {
    name: '\${resourcePrefix}-db'
    location: location
    sqlServerName: sqlServer.outputs.name
    skuName: environment == 'prod' ? 'S1' : 'Basic'
    tags: tags
  }
}

`;
          break;

        case 'storageAccount':
          modules += `module ${moduleName} 'modules/${moduleFile}.bicep' = {
  name: '${moduleName}-deployment'
  params: {
    name: replace('\${resourcePrefix}st', '-', '')
    location: location
    tags: tags
  }
}

`;
          outputs += `output storageAccountName string = ${moduleName}.outputs.name\n`;
          break;

        case 'keyVault':
          modules += `module ${moduleName} 'modules/${moduleFile}.bicep' = {
  name: '${moduleName}-deployment'
  params: {
    name: '\${resourcePrefix}-kv'
    location: location
    tags: tags
  }
}

`;
          outputs += `output keyVaultUri string = ${moduleName}.outputs.uri\n`;
          break;
      }
    }

    const content = `// Main Bicep template
// Generated by AgenticCoder

targetScope = 'resourceGroup'

${params}${variables}${modules}// Outputs
${outputs}`;

    return this.createFile('infrastructure/main.bicep', content, 'bicep');
  }

  /**
   * Generate parameter file for an environment
   */
  async generateParameterFile(context, env, resources) {
    const projectName = this.toKebabCase(context.projectName);
    
    const params = {
      $schema: "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
      contentVersion: "1.0.0.0",
      parameters: {
        environment: { value: env },
        projectName: { value: projectName }
      }
    };

    // Add SQL password reference for Key Vault
    if (resources.some(r => r.type === 'sqlServer')) {
      params.parameters.sqlAdminPassword = {
        reference: {
          keyVault: {
            id: `/subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.KeyVault/vaults/{kv-name}`
          },
          secretName: "sql-admin-password"
        }
      };
    }

    return this.createFile(
      `infrastructure/parameters/${env}.parameters.json`,
      JSON.stringify(params, null, 2),
      'parameters'
    );
  }

  /**
   * Generate deployment script
   */
  async generateDeployScript(context) {
    const content = `#!/bin/bash
# Deployment script for Azure infrastructure
# Generated by AgenticCoder

set -e

# Configuration
RESOURCE_GROUP="\${RESOURCE_GROUP:-${this.toKebabCase(context.projectName)}-rg}"
LOCATION="\${LOCATION:-westeurope}"
ENVIRONMENT="\${ENVIRONMENT:-dev}"

echo "Deploying to environment: $ENVIRONMENT"

# Create resource group if it doesn't exist
az group create \\
  --name "$RESOURCE_GROUP" \\
  --location "$LOCATION" \\
  --tags environment="$ENVIRONMENT" project="${context.projectName}"

# Deploy infrastructure
az deployment group create \\
  --resource-group "$RESOURCE_GROUP" \\
  --template-file main.bicep \\
  --parameters "parameters/$ENVIRONMENT.parameters.json" \\
  --verbose

echo "Deployment complete!"
`;
    return this.createFile('infrastructure/deploy.sh', content, 'script');
  }
}

module.exports = BicepGenerator;
