import { BaseAgent } from '../core/BaseAgent.js';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * DeploymentPlannerAgent - Generates deployment templates (Bicep/ARM)
 * Converts analyzed resources into Infrastructure as Code
 */
export class DeploymentPlannerAgent extends BaseAgent {
  constructor() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(__dirname, '..', '..');

    const pythonCommand = process.env.AGENTICCODER_PYTHON || 'python';
    const docsMcpCwd = path.join(repoRoot, '.github', 'mcp', 'microsoft-docs-mcp');

    const definition = {
      id: 'deployment-planner',
      name: 'Deployment Planner Agent',
      version: '1.0.0',
      type: 'infrastructure',
      description: 'Generates Bicep and ARM deployment templates from resource specifications',
      inputs: {
        type: 'object',
        required: ['resources'],
        properties: {
          resources: {
            type: 'array',
            description: 'Resources to deploy',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                name: { type: 'string' },
                sku: { type: 'string' },
                location: { type: 'string' },
                properties: { type: 'object' },
                dependencies: { type: 'array' }
              }
            }
          },
          templateFormat: {
            type: 'string',
            enum: ['bicep', 'arm'],
            default: 'bicep'
          },
          deploymentName: {
            type: 'string',
            description: 'Name for the deployment'
          },
          parameterize: {
            type: 'boolean',
            default: true,
            description: 'Extract parameters from resource definitions'
          }
        }
      },
      outputs: {
        type: 'object',
        required: ['template', 'parameters'],
        properties: {
          template: {
            type: 'string',
            description: 'Generated template content'
          },
          parameters: {
            type: 'object',
            description: 'Template parameters'
          },
          parameterFile: {
            type: 'string',
            description: 'Generated parameter file content'
          },
          deploymentScript: {
            type: 'string',
            description: 'Deployment script (PowerShell or Bash)'
          },
          metadata: {
            type: 'object',
            properties: {
              resourceCount: { type: 'number' },
              templateFormat: { type: 'string' },
              estimatedDeploymentTime: { type: 'string' }
            }
          }
        }
      },
      mcpServers: [
        {
          name: 'azure-docs',
          endpoint: 'http://localhost:3003',

          // Optional stdio MCP transport (only used when AGENTICCODER_TOOL_TRANSPORT=mcp*).
          // This repo uses a python stub under `.github/mcp/microsoft-docs-mcp`.
          stdioCommand: pythonCommand,
          stdioArgs: ['-m', 'microsoft_docs_mcp', 'mcp'],
          stdioCwd: docsMcpCwd
        }
      ],
      timeout: 60000
    };

    super(definition);
  }

  async _onExecute(input, context, executionId) {
    const { 
      resources, 
      templateFormat = 'bicep', 
      deploymentName = 'agenticcoder-deployment',
      parameterize = true 
    } = input;

    // Generate template based on format
    const template = templateFormat === 'bicep' 
      ? await this._generateBicepTemplate(resources, parameterize)
      : await this._generateArmTemplate(resources, parameterize);

    // Extract parameters
    const parameters = this._extractParameters(resources, parameterize);

    // Generate parameter file
    const parameterFile = templateFormat === 'bicep'
      ? this._generateBicepParameterFile(parameters)
      : this._generateArmParameterFile(parameters);

    // Generate deployment script
    const deploymentScript = this._generateDeploymentScript(
      templateFormat, 
      deploymentName, 
      resources[0]?.location || 'eastus'
    );

    // Optional: attach a best-effort docs search result to aid users.
    // Only do this in MCP mode (or when explicitly enabled) to keep default runs fast.
    const transport = (process.env.AGENTICCODER_TOOL_TRANSPORT || '').toLowerCase();
    const wantsMcp = transport.startsWith('mcp');
    const enableHttpProbe = process.env.AGENTICCODER_ENABLE_HTTP_MCP_PROBES === '1';

    let documentationResults = null;
    if ((wantsMcp || enableHttpProbe) && resources.length > 0) {
      const resourceType = resources[0]?.type;
      documentationResults = await this._tryDocsSearch(resourceType, wantsMcp);
    }

    return {
      template,
      parameters,
      parameterFile,
      deploymentScript,
      documentationResults,
      metadata: {
        resourceCount: resources.length,
        templateFormat,
        estimatedDeploymentTime: this._estimateDeploymentTime(resources),
        executionId,
        timestamp: new Date().toISOString()
      }
    };
  }

  async _tryDocsSearch(resourceType, wantsMcp) {
    const client = this.mcpClients.get('azure-docs');
    if (!client) return null;

    const query = resourceType ? `bicep ${resourceType}` : 'bicep azure resource';

    if (wantsMcp) {
      try {
        const result = await client.call('tools/call', {
          name: 'search',
          arguments: { query }
        });

        return {
          source: 'microsoft-docs-mcp-stdio',
          query,
          result
        };
      } catch {
        return null;
      }
    }

    // Optional HTTP probing for environments running the Node server.
    try {
      const response = await client.call('GET /api/search', { q: query });
      return {
        source: 'mcp-azure-docs-http',
        query,
        response
      };
    } catch {
      return null;
    }
  }

  async _generateBicepTemplate(resources, parameterize) {
    const lines = [];
    
    // Header
    lines.push('// Generated by AgenticCoder');
    lines.push(`// Date: ${new Date().toISOString()}`);
    lines.push('');

    // Target scope
    lines.push('targetScope = \'resourceGroup\'');
    lines.push('');

    // Parameters
    if (parameterize) {
      const params = this._extractParameters(resources, true);
      for (const [name, value] of Object.entries(params)) {
        const paramType = this._inferBicepType(value);
        lines.push(`param ${name} ${paramType} = ${this._formatBicepValue(value)}`);
      }
      lines.push('');
    }

    // Variables
    lines.push('// Variables');
    lines.push('var tags = {');
    lines.push('  environment: \'development\'');
    lines.push('  managedBy: \'AgenticCoder\'');
    lines.push('  deploymentDate: utcNow(\'yyyy-MM-dd\')');
    lines.push('}');
    lines.push('');

    // Resources
    for (const resource of resources) {
      lines.push(this._generateBicepResource(resource, parameterize));
      lines.push('');
    }

    // Outputs
    lines.push('// Outputs');
    for (const resource of resources) {
      const resourceName = this._sanitizeName(resource.name);
      lines.push(`output ${resourceName}Id string = ${resourceName}.id`);
    }

    return lines.join('\n');
  }

  _generateBicepResource(resource, parameterize) {
    const lines = [];
    const resourceName = this._sanitizeName(resource.name);
    const apiVersion = this._getApiVersion(resource.type);

    lines.push(`resource ${resourceName} '${resource.type}@${apiVersion}' = {`);
    lines.push(`  name: ${parameterize ? `\${${resourceName}Name}` : `'${resource.name}'`}`);
    lines.push(`  location: ${parameterize ? 'location' : `'${resource.location}'`}`);
    
    // SKU if present
    if (resource.sku) {
      lines.push('  sku: {');
      lines.push(`    name: '${resource.sku}'`);
      lines.push('  }');
    }

    // Properties
    if (resource.properties && Object.keys(resource.properties).length > 0) {
      lines.push('  properties: {');
      for (const [key, value] of Object.entries(resource.properties)) {
        lines.push(`    ${key}: ${this._formatBicepValue(value)}`);
      }
      lines.push('  }');
    }

    // Tags
    lines.push('  tags: tags');

    // Dependencies
    if (resource.dependencies && resource.dependencies.length > 0) {
      lines.push('  dependsOn: [');
      for (const dep of resource.dependencies) {
        lines.push(`    ${this._sanitizeName(dep)}`);
      }
      lines.push('  ]');
    }

    lines.push('}');
    return lines.join('\n');
  }

  async _generateArmTemplate(resources, parameterize) {
    const template = {
      '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
      contentVersion: '1.0.0.0',
      metadata: {
        generator: 'AgenticCoder',
        generatedDate: new Date().toISOString()
      },
      parameters: {},
      variables: {
        tags: {
          environment: 'development',
          managedBy: 'AgenticCoder'
        }
      },
      resources: [],
      outputs: {}
    };

    // Add parameters
    if (parameterize) {
      const params = this._extractParameters(resources, true);
      for (const [name, value] of Object.entries(params)) {
        template.parameters[name] = {
          type: this._inferArmType(value),
          defaultValue: value
        };
      }
    }

    // Add resources
    for (const resource of resources) {
      template.resources.push(this._generateArmResource(resource, parameterize));
    }

    // Add outputs
    for (const resource of resources) {
      const resourceName = this._sanitizeName(resource.name);
      template.outputs[`${resourceName}Id`] = {
        type: 'string',
        value: `[resourceId('${resource.type}', '${resource.name}')]`
      };
    }

    return JSON.stringify(template, null, 2);
  }

  _generateArmResource(resource, parameterize) {
    const armResource = {
      type: resource.type,
      apiVersion: this._getApiVersion(resource.type),
      name: parameterize ? `[parameters('${this._sanitizeName(resource.name)}Name')]` : resource.name,
      location: parameterize ? "[parameters('location')]" : resource.location,
      tags: '[variables(\'tags\')]'
    };

    if (resource.sku) {
      armResource.sku = {
        name: resource.sku
      };
    }

    if (resource.properties) {
      armResource.properties = resource.properties;
    }

    if (resource.dependencies && resource.dependencies.length > 0) {
      armResource.dependsOn = resource.dependencies.map(dep => 
        `[resourceId('Microsoft.Storage/storageAccounts', '${dep}')]`
      );
    }

    return armResource;
  }

  _extractParameters(resources, parameterize) {
    if (!parameterize) return {};

    const params = {
      location: resources[0]?.location || 'eastus'
    };

    for (const resource of resources) {
      const resourceName = this._sanitizeName(resource.name);
      params[`${resourceName}Name`] = resource.name;
      
      if (resource.sku) {
        params[`${resourceName}Sku`] = resource.sku;
      }
    }

    return params;
  }

  _generateBicepParameterFile(parameters) {
    const lines = [];
    lines.push('using \'./main.bicep\'');
    lines.push('');
    
    for (const [name, value] of Object.entries(parameters)) {
      lines.push(`param ${name} = ${this._formatBicepValue(value)}`);
    }

    return lines.join('\n');
  }

  _generateArmParameterFile(parameters) {
    const paramFile = {
      '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#',
      contentVersion: '1.0.0.0',
      parameters: {}
    };

    for (const [name, value] of Object.entries(parameters)) {
      paramFile.parameters[name] = { value };
    }

    return JSON.stringify(paramFile, null, 2);
  }

  _generateDeploymentScript(templateFormat, deploymentName, location) {
    if (templateFormat === 'bicep') {
      return `# Deploy Bicep template
$resourceGroupName = "rg-${deploymentName}"
$location = "${location}"

# Create resource group if it doesn't exist
if (-not (Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
    New-AzResourceGroup -Name $resourceGroupName -Location $location
}

# Deploy template
New-AzResourceGroupDeployment \`
    -Name "${deploymentName}-\${(Get-Date).ToString('yyyyMMdd-HHmmss')}" \`
    -ResourceGroupName $resourceGroupName \`
    -TemplateFile "./main.bicep" \`
    -TemplateParameterFile "./main.bicepparam" \`
    -Verbose

Write-Host "Deployment complete!"`;
    } else {
      return `# Deploy ARM template
$resourceGroupName = "rg-${deploymentName}"
$location = "${location}"

# Create resource group if it doesn't exist
if (-not (Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
    New-AzResourceGroup -Name $resourceGroupName -Location $location
}

# Deploy template
New-AzResourceGroupDeployment \`
    -Name "${deploymentName}-\${(Get-Date).ToString('yyyyMMdd-HHmmss')}" \`
    -ResourceGroupName $resourceGroupName \`
    -TemplateFile "./azuredeploy.json" \`
    -TemplateParameterFile "./azuredeploy.parameters.json" \`
    -Verbose

Write-Host "Deployment complete!"`;
    }
  }

  _sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  _getApiVersion(resourceType) {
    const apiVersions = {
      'Microsoft.Web/sites': '2023-01-01',
      'Microsoft.Storage/storageAccounts': '2023-01-01',
      'Microsoft.Compute/virtualMachines': '2023-03-01',
      'Microsoft.Network/virtualNetworks': '2023-05-01',
      'Microsoft.Network/networkInterfaces': '2023-05-01',
      'Microsoft.KeyVault/vaults': '2023-02-01',
      'Microsoft.OperationalInsights/workspaces': '2022-10-01'
    };

    return apiVersions[resourceType] || '2023-01-01';
  }

  _inferBicepType(value) {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'int';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) return 'array';
    return 'object';
  }

  _inferArmType(value) {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'int';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) return 'array';
    return 'object';
  }

  _formatBicepValue(value) {
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (value === null) return 'null';
    return JSON.stringify(value);
  }

  _estimateDeploymentTime(resources) {
    // Simple estimation based on resource count and types
    let minutes = 2; // Base time

    for (const resource of resources) {
      if (resource.type.includes('virtualMachines')) minutes += 5;
      else if (resource.type.includes('sites')) minutes += 3;
      else if (resource.type.includes('storageAccounts')) minutes += 2;
      else minutes += 1;
    }

    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}
