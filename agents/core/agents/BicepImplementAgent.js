import { BaseAgent } from '../base/BaseAgent.js';
import { EventEmitter } from 'events';

/**
 * BicepImplementAgent - Azure Bicep Code Generation
 * 
 * Generates production-ready Bicep IaC code from Bicep plans,
 * including main templates, modules, and parameter files.
 */
export class BicepImplementAgent extends BaseAgent {
  constructor(spec = {}) {
    const defaultSpec = {
      id: 'bicep-implement',
      name: 'Bicep Implementation Agent',
      description: 'Generates Azure Bicep infrastructure code from plans',
      inputSchema: {
        type: 'object',
        properties: {
          bicepPlan: { type: 'object' },
          modules: { type: 'array' },
          parameters: { type: 'object' }
        },
        required: ['bicepPlan', 'modules']
      },
      outputSchema: {
        type: 'object',
        properties: {
          files: { type: 'array' },
          mainTemplate: { type: 'string' },
          parameterFiles: { type: 'object' }
        }
      }
    };

    super({ ...defaultSpec, ...spec });
    this.codeCache = new Map();
  }

  async _onInitialize() {
    this.codeCache.clear();
  }

  async _onExecute(input, context, executionId) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const { bicepPlan, modules, parameters = {} } = input;

    // Generate main template
    const mainTemplate = await this.generateMainTemplate(bicepPlan, modules);

    // Generate module files
    const moduleFiles = await this.generateModuleFiles(modules);

    // Generate parameter files
    const parameterFiles = await this.generateParameterFiles(parameters, bicepPlan);

    // Collect all files
    const files = [
      { path: 'main.bicep', content: mainTemplate, type: 'main' },
      ...moduleFiles,
      { path: 'parameters.dev.json', content: parameterFiles.dev, type: 'parameters' },
      { path: 'parameters.prod.json', content: parameterFiles.prod, type: 'parameters' }
    ];

    const result = {
      executionId,
      files,
      mainTemplate,
      moduleFiles,
      parameterFiles,
      summary: {
        totalFiles: files.length,
        modules: moduleFiles.length,
        linesOfCode: this.countLines(files)
      }
    };

    this.codeCache.set(executionId, result);

    this.emit('bicep-code-generated', {
      executionId,
      filesGenerated: files.length,
      modulesGenerated: moduleFiles.length
    });

    return {
      success: true,
      executionId,
      files,
      mainTemplate,
      moduleFiles,
      parameterFiles,
      summary: result.summary
    };
  }

  async generateMainTemplate(bicepPlan, modules) {
    const lines = [];

    // Header
    lines.push(`// Azure Infrastructure - Bicep Template`);
    lines.push(`// Generated: ${new Date().toISOString()}`);
    lines.push(`// Target Scope: ${bicepPlan.targetScope}`);
    lines.push('');

    // Target scope
    lines.push(`targetScope = '${bicepPlan.targetScope}'`);
    lines.push('');

    // Parameters
    lines.push('// Parameters');
    lines.push(`param environment string = 'dev'`);
    lines.push(`param location string = '${bicepPlan.location}'`);
    lines.push(`param projectName string`);
    lines.push(`param tags object = {`);
    lines.push(`  Environment: environment`);
    lines.push(`  ManagedBy: 'Bicep'`);
    lines.push(`}`);
    lines.push('');

    // Resource group deployment (if subscription scope)
    if (bicepPlan.targetScope === 'subscription') {
      lines.push('// Resource Group');
      lines.push(`resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {`);
      lines.push(`  name: '\${projectName}-\${environment}-rg'`);
      lines.push(`  location: location`);
      lines.push(`  tags: tags`);
      lines.push(`}`);
      lines.push('');
    }

    // Module deployments
    lines.push('// Module Deployments');
    for (const module of modules) {
      lines.push(`module ${module.name} '${module.fileName}' = {`);
      lines.push(`  name: '\${projectName}-\${environment}-${module.name}'`);
      if (bicepPlan.targetScope === 'subscription') {
        lines.push(`  scope: rg`);
      }
      lines.push(`  params: {`);
      lines.push(`    location: location`);
      lines.push(`    environment: environment`);
      lines.push(`    tags: tags`);
      
      // Add module-specific parameters
      if (module.parameters) {
        for (const param of module.parameters) {
          if (param.default === undefined) {
            lines.push(`    ${param.name}: ${param.name}`);
          }
        }
      }
      
      lines.push(`  }`);
      if (module.dependencies && module.dependencies.length > 0) {
        lines.push(`  dependsOn: [`);
        module.dependencies.forEach(dep => {
          lines.push(`    ${dep}`);
        });
        lines.push(`  ]`);
      }
      lines.push(`}`);
      lines.push('');
    }

    // Outputs
    lines.push('// Outputs');
    for (const module of modules) {
      if (module.outputs) {
        for (const output of module.outputs) {
          lines.push(`output ${module.name}_${output.name} ${output.type} = ${module.name}.outputs.${output.name}`);
        }
      }
    }

    return lines.join('\n');
  }

  async generateModuleFiles(modules) {
    const files = [];

    for (const module of modules) {
      const content = await this.generateModuleContent(module);
      files.push({
        path: module.fileName,
        content,
        type: 'module',
        moduleName: module.name
      });
    }

    return files;
  }

  async generateModuleContent(module) {
    const lines = [];

    // Header
    lines.push(`// ${module.description || module.name + ' Module'}`);
    lines.push('');

    // Parameters
    lines.push('// Parameters');
    lines.push(`param location string`);
    lines.push(`param environment string`);
    lines.push(`param tags object`);
    
    if (module.parameters) {
      for (const param of module.parameters) {
        const defaultValue = param.default !== undefined ? ` = ${this.formatValue(param.default)}` : '';
        lines.push(`param ${param.name} ${param.type}${defaultValue}`);
      }
    }
    lines.push('');

    // Variables
    lines.push('// Variables');
    lines.push(`var resourceName = '\${environment}-${module.name}'`);
    lines.push('');

    // Resources
    lines.push('// Resources');
    if (module.resources) {
      for (const resource of module.resources) {
        lines.push(...this.generateResourceBlock(resource));
        lines.push('');
      }
    }

    // Outputs
    if (module.outputs) {
      lines.push('// Outputs');
      for (const output of module.outputs) {
        lines.push(`output ${output.name} ${output.type} = ${output.value}`);
      }
    }

    return lines.join('\n');
  }

  generateResourceBlock(resource) {
    const lines = [];
    
    // Simplified resource generation - basic structure
    lines.push(`resource ${this.getResourceVariableName(resource.type)} '${resource.type}@${resource.apiVersion}' = {`);
    lines.push(`  name: resourceName`);
    lines.push(`  location: location`);
    lines.push(`  tags: tags`);
    
    if (resource.properties) {
      lines.push(`  properties: {`);
      lines.push(`    // Resource-specific properties`);
      lines.push(`  }`);
    }
    
    lines.push(`}`);
    
    return lines;
  }

  getResourceVariableName(type) {
    const parts = type.split('/');
    const resourceType = parts[parts.length - 1];
    return resourceType.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  async generateParameterFiles(parameters, bicepPlan) {
    const devParams = {
      "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
      "contentVersion": "1.0.0.0",
      "parameters": {
        "environment": { "value": "dev" },
        "location": { "value": bicepPlan.location },
        "projectName": { "value": "myproject" }
      }
    };

    const prodParams = {
      "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
      "contentVersion": "1.0.0.0",
      "parameters": {
        "environment": { "value": "prod" },
        "location": { "value": bicepPlan.location },
        "projectName": { "value": "myproject" }
      }
    };

    return {
      dev: JSON.stringify(devParams, null, 2),
      staging: JSON.stringify({ ...devParams, parameters: { ...devParams.parameters, environment: { value: "staging" } } }, null, 2),
      prod: JSON.stringify(prodParams, null, 2)
    };
  }

  formatValue(value) {
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value).map(([k, v]) => `${k}: ${this.formatValue(v)}`);
      return `{\n  ${entries.join('\n  ')}\n}`;
    }
    return String(value);
  }

  countLines(files) {
    return files.reduce((total, file) => {
      return total + file.content.split('\n').length;
    }, 0);
  }

  getCode(executionId) {
    return this.codeCache.get(executionId);
  }

  listGeneratedCode() {
    return Array.from(this.codeCache.values()).map(c => ({
      id: c.executionId,
      filesGenerated: c.files.length,
      linesOfCode: c.summary.linesOfCode
    }));
  }

  async _onCleanup() {
    // Cleanup if needed
  }
}

export default BicepImplementAgent;
