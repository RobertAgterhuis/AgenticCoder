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

    // Official Azure MCP Server (NPM). Used for schema-driven Bicep generation.
    // Docs: https://learn.microsoft.com/azure/developer/azure-mcp-server/tools/azure-bicep-schema
    const azureMcpCommand = process.env.AGENTICCODER_AZURE_MCP_COMMAND || 'npx';
    const azureMcpArgs = ['-y', '@azure/mcp@latest', 'server', 'start'];

    // Optional flags for diagnosing and running the Azure MCP server non-interactively.
    // These are particularly useful in tests where there's no UI to answer elicitation prompts.
    if (process.env.AGENTICCODER_AZURE_MCP_DEBUG === '1') {
      azureMcpArgs.push('--debug');
    }
    if (process.env.AGENTICCODER_AZURE_MCP_DISABLE_ELICITATION === '1') {
      azureMcpArgs.push('--insecure-disable-elicitation');
    }

    // For deep troubleshooting, Azure MCP Server can write support logs to a directory.
    // WARNING: these logs may contain sensitive information.
    if (process.env.AGENTICCODER_AZURE_MCP_SUPPORT_LOG_DIR) {
      azureMcpArgs.push('--dangerously-write-support-logs-to-dir', process.env.AGENTICCODER_AZURE_MCP_SUPPORT_LOG_DIR);
    }

    const enableAzureMcp = (() => {
      const v = (process.env.AGENTICCODER_ENABLE_AZURE_MCP || '').toLowerCase();
      return v === '1' || v === 'true';
    })();

    const mcpServers = [
      {
        name: 'azure-docs',
        endpoint: 'http://localhost:3003',

        // Optional stdio MCP transport (only used when AGENTICCODER_TOOL_TRANSPORT=mcp*).
        // This repo uses a python stub under `.github/mcp/microsoft-docs-mcp`.
        stdioCommand: pythonCommand,
        stdioArgs: ['-m', 'microsoft_docs_mcp', 'mcp'],
        stdioCwd: docsMcpCwd
      }
    ];

    if (enableAzureMcp) {
      mcpServers.push({
        name: 'azure-mcp',
        endpoint: 'http://localhost:3999',
        stdioCommand: azureMcpCommand,
        stdioArgs: azureMcpArgs,
        stdioCwd: repoRoot,
        // On Windows, launchers like npx are best run via a shell.
        stdioShell: process.platform === 'win32',
        // Azure MCP Server's stdio transport expects newline-delimited JSON.
        stdioFraming: 'ndjson'
      });
    }

    const definition = {
      id: 'deployment-planner',
      name: 'Deployment Planner Agent',
      version: '1.0.0',
      type: 'infrastructure',
      description: 'Generates Bicep and ARM deployment templates from resource specifications',
      retryPolicy: {
        maxRetries: 0,
        backoffMs: 0
      },
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
                apiVersion: { type: 'string' },
                sku: { oneOf: [{ type: 'string' }, { type: 'object' }] },
                kind: { type: 'string' },
                location: { type: 'string' },
                properties: { type: 'object' },
                dependencies: { type: 'array' },
                dependsOn: { type: 'array' },
                tags: { type: 'object' },
                zones: { type: 'array' }
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
      mcpServers,
      timeout: (() => {
        const env = Number.parseInt(process.env.AGENTICCODER_DEPLOYMENT_PLANNER_TIMEOUT_MS || '', 10);
        return Number.isFinite(env) ? env : 60000;
      })()
    };

    super(definition);

    this._bicepSchemaTool = null; // { name, param }
    this._apiVersionOverrides = new Map();
  }

  async _onExecute(input, context, executionId) {
    const { 
      resources, 
      templateFormat = 'bicep', 
      deploymentName = 'agenticcoder-deployment',
      parameterize = true 
    } = input;

    const transport = (process.env.AGENTICCODER_TOOL_TRANSPORT || '').toLowerCase();
    const wantsMcp = transport.startsWith('mcp');
    const strictSchema = (process.env.AGENTICCODER_BICEP_SCHEMA_STRICT || '').toLowerCase();
    const schemaStrictEnabled = strictSchema === '1' || strictSchema === 'true';

    // In MCP mode, prefer schema-driven apiVersion resolution.
    if (templateFormat === 'bicep' && wantsMcp && Array.isArray(resources) && resources.length > 0 && schemaStrictEnabled) {
      await this._hydrateApiVersionsFromBicepSchema(resources, { strict: schemaStrictEnabled });
    }

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
    // Reuse wantsMcp from above.
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

  async _hydrateApiVersionsFromBicepSchema(resources, { strict }) {
    const client = this.mcpClients.get('azure-mcp');
    if (!client) {
      if (strict) {
        throw new Error('Azure MCP Server client (azure-mcp) not available; cannot resolve Bicep schemas. Ensure AGENTICCODER_TOOL_TRANSPORT=mcp* and that npx can run @azure/mcp.');
      }
      return;
    }

    if (!this._bicepSchemaTool) {
      this._bicepSchemaTool = await this._discoverBicepSchemaTool(client);
      if (!this._bicepSchemaTool) {
        if (strict) {
          throw new Error('Azure MCP Server did not expose a bicepschema tool. Verify Azure MCP Server is running and exposes the Azure Bicep schema tool.');
        }
        return;
      }
    }

    const uniqueTypes = Array.from(new Set(resources.map((r) => r.type).filter(Boolean)));

    for (const resourceType of uniqueTypes) {
      if (this._apiVersionOverrides.has(resourceType)) continue;

      const args = {};
      if (this._bicepSchemaTool.kind === 'router') {
        args.intent = `Get Bicep schema for ${resourceType}`;
        args.command = this._bicepSchemaTool.command;
        args.parameters = {
          [this._bicepSchemaTool.param]: resourceType
        };
      } else {
        args[this._bicepSchemaTool.param] = resourceType;
      }

      try {
        const result = await client.call('tools/call', {
          name: this._bicepSchemaTool.name,
          arguments: args
        });

        const apiVersion = this._extractApiVersionFromBicepSchemaResult(result);

        if (typeof apiVersion === 'string' && apiVersion.trim()) {
          this._apiVersionOverrides.set(resourceType, apiVersion.trim());
          continue;
        }

        if (strict) {
          throw new Error(`Azure MCP bicepschema tool returned no apiVersion for ${resourceType}`);
        }
      } catch (error) {
        if (strict) {
          throw new Error(`Failed to resolve Bicep schema for ${resourceType}: ${error?.message || String(error)}`);
        }
      }
    }
  }

  async _discoverBicepSchemaTool(client) {
    // The exact tool name can vary; discover via tools/list.
    const result = await client.call('tools/list', {});
    const tools = result?.tools || result || [];
    if (!Array.isArray(tools)) return null;

    // If server is started in "all" mode, bicepschema_get may be directly exposed.
    const direct = tools.find((t) => String(t?.name || '').toLowerCase().includes('bicepschema_get'));
    if (direct?.name) {
      const param = this._inferSingleParamName(direct?.inputSchema?.properties);
      return { kind: 'direct', name: direct.name, param };
    }

    const candidate = tools.find((t) => {
      const name = String(t?.name || '').toLowerCase();
      const desc = String(t?.description || '').toLowerCase();
      return name.includes('bicepschema') && (name.includes('schema') || desc.includes('bicep schema'));
    });

    if (!candidate?.name) return null;

    // Azure MCP Server defaults to "namespace" mode, where each namespace is a router tool.
    // In that case, bicepschema is a router and the actual operation is bicepschema_get.
    const props = candidate?.inputSchema?.properties;
    const keys = props && typeof props === 'object' ? Object.keys(props) : [];
    const looksLikeRouter = keys.includes('intent') && keys.includes('parameters');

    if (looksLikeRouter) {
      return {
        kind: 'router',
        name: candidate.name,
        command: 'bicepschema_get',
        // From Azure MCP tool schema: bicepschema_get expects "resource-type".
        param: 'resource-type'
      };
    }

    return { kind: 'direct', name: candidate.name, param: this._inferSingleParamName(props) };
  }

  _inferSingleParamName(props) {
    let param = 'resourceType';
    if (props && typeof props === 'object') {
      const keys = Object.keys(props);
      if (keys.length === 1) {
        param = keys[0];
      } else if (keys.includes('resource-type')) {
        param = 'resource-type';
      } else if (keys.includes('resourceType')) {
        param = 'resourceType';
      } else if (keys.includes('resource_type')) {
        param = 'resource_type';
      }
    }
    return param;
  }

  _extractApiVersionFromBicepSchemaResult(result) {
    // Some clients return a direct object; Azure MCP returns content blocks.
    const direct =
      result?.apiVersion ||
      result?.apiversion ||
      result?.api_version ||
      result?.schema?.apiVersion ||
      result?.schema?.api_version ||
      null;
    if (typeof direct === 'string' && direct.trim()) return direct.trim();

    const text = result?.content?.find?.((c) => c?.type === 'text')?.text;
    if (typeof text !== 'string' || !text.trim()) return null;

    // Azure MCP bicepschema_get returns JSON as text.
    try {
      const parsed = JSON.parse(text);
      const schemaResults = parsed?.results?.BicepSchemaResult;
      if (Array.isArray(schemaResults) && schemaResults.length > 0) {
        const resource = schemaResults.find((x) => x?.$type === 'Resource') || schemaResults[0];

        // Preferred: parse from name "<type>@<apiVersion>".
        const name = String(resource?.name || '');
        const at = name.lastIndexOf('@');
        if (at > 0) {
          const v = name.slice(at + 1).trim();
          if (v) return v;
        }

        // Fallback: find apiVersion property and use its type.
        const props = resource?.bodyType?.properties;
        if (Array.isArray(props)) {
          const apiProp = props.find((p) => p?.name === 'apiVersion');
          const v = String(apiProp?.type || '').trim();
          if (v) return v;
        }
      }
    } catch {
      // ignore
    }

    return null;
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
        lines.push(`param ${name} ${paramType} = ${this._formatBicepValue(value, 0)}`);
      }

      // utcNow() is only valid in parameter default values.
      if (!Object.prototype.hasOwnProperty.call(params, 'deploymentDate')) {
        lines.push("param deploymentDate string = utcNow('yyyy-MM-dd')");
      }

      lines.push('');
    } else {
      // Still allow deterministic tagging without embedding utcNow() in variables/resources.
      lines.push("param deploymentDate string = utcNow('yyyy-MM-dd')");
      lines.push('');
    }

    // Variables
    lines.push('// Variables');
    lines.push('var tags = {');
    const defaultEnv = resources?.[0]?.tags?.environment || 'development';

    // Parameterize environment so templates match the scenario constraints.
    // Keep it stable even when parameterize=false.
    lines.splice(
      lines.findIndex((l) => l.startsWith('// Variables')),
      0,
      `param environment string = '${String(defaultEnv).replace(/'/g, "''")}'`
    );

    lines.push('  environment: environment');
    lines.push('  managedBy: \'AgenticCoder\'');
    lines.push('  deploymentDate: deploymentDate');
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

    // Normalize storage account kind: it should be top-level `kind`, not under `properties`.
    let kind = resource.kind;
    if (!kind && resource?.properties?.kind && resource.type === 'Microsoft.Storage/storageAccounts') {
      kind = resource.properties.kind;
      const { kind: _ignored, ...rest } = resource.properties;
      resource = { ...resource, properties: rest };
    }

    lines.push(`resource ${resourceName} '${resource.type}@${apiVersion}' = {`);
    lines.push(`  name: ${parameterize ? `${resourceName}Name` : this._formatBicepValue(resource.name, 2)}`);
    lines.push(`  location: ${parameterize ? 'location' : `'${resource.location}'`}`);
    
    // SKU if present
    if (resource.sku) {
      lines.push('  sku: {');
      if (parameterize) {
        lines.push(`    name: ${resourceName}Sku`);
      } else {
        lines.push(`    name: ${this._formatBicepValue(resource.sku, 4)}`);
      }
      lines.push('  }');
    }

    if (kind) {
      lines.push(`  kind: ${this._formatBicepValue(kind, 2)}`);
    }

    // Properties
    if (resource.properties && Object.keys(resource.properties).length > 0) {
      lines.push(`  properties: ${this._formatBicepObject(resource.properties, 2)}`);
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
      lines.push(`param ${name} = ${this._formatBicepValue(value, 0)}`);
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
    const cleaned = String(name ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!cleaned) return 'r';
    if (/^[0-9]/.test(cleaned)) return `r${cleaned}`;
    return cleaned;
  }

  _getApiVersion(resourceType) {
    if (this._apiVersionOverrides?.has(resourceType)) {
      return this._apiVersionOverrides.get(resourceType);
    }

    const strictSchema = (process.env.AGENTICCODER_BICEP_SCHEMA_STRICT || '').toLowerCase();
    const schemaStrictEnabled = strictSchema === '1' || strictSchema === 'true';
    if (schemaStrictEnabled) {
      throw new Error(`No schema-derived apiVersion for resource type '${resourceType}'. Ensure Azure MCP Server bicepschema tool is reachable.`);
    }

    const apiVersions = {
      'Microsoft.Web/sites': '2023-01-01',
      'Microsoft.Web/serverfarms': '2023-01-01',
      'Microsoft.Storage/storageAccounts': '2023-01-01',
      'Microsoft.Compute/virtualMachines': '2023-03-01',
      'Microsoft.Network/virtualNetworks': '2023-05-01',
      'Microsoft.Network/networkInterfaces': '2023-05-01',
      'Microsoft.KeyVault/vaults': '2023-02-01',
      'Microsoft.OperationalInsights/workspaces': '2022-10-01',
      'Microsoft.Insights/components': '2020-02-02'
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

  _formatBicepValue(value, indentLevel = 0) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const expr = value.__bicepExpr;
      if (typeof expr === 'string' && expr.trim()) {
        return expr;
      }
    }

    if (typeof value === 'string') {
      // Escape single quotes for Bicep strings.
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (value === null) return 'null';

    if (Array.isArray(value)) {
      return this._formatBicepArray(value, indentLevel);
    }

    if (value && typeof value === 'object') {
      return this._formatBicepObject(value, indentLevel);
    }

    return 'null';
  }

  _formatBicepArray(arr, indentLevel = 0) {
    if (arr.length === 0) return '[]';

    const indent = '  '.repeat(indentLevel);
    const innerIndent = '  '.repeat(indentLevel + 1);
    const lines = ['['];
    for (const item of arr) {
      const rendered = this._formatBicepValue(item, indentLevel + 1);
      const renderedLines = String(rendered).split('\n');
      lines.push(`${innerIndent}${renderedLines.shift()}`);
      for (const extra of renderedLines) {
        lines.push(`${innerIndent}${extra}`);
      }
    }
    lines.push(`${indent}]`);
    return lines.join('\n');
  }

  _formatBicepObject(obj, indentLevel = 0) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    const indent = '  '.repeat(indentLevel);
    const innerIndent = '  '.repeat(indentLevel + 1);
    const lines = ['{'];
    for (const key of keys) {
      const value = obj[key];
      const rendered = this._formatBicepValue(value, indentLevel + 1);
      const renderedLines = String(rendered).split('\n');
      lines.push(`${innerIndent}${key}: ${renderedLines.shift()}`);
      for (const extra of renderedLines) {
        lines.push(`${innerIndent}${extra}`);
      }
    }
    lines.push(`${indent}}`);
    return lines.join('\n');
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
