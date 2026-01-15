import { BaseAgent } from '../base/BaseAgent.js';
import { EventEmitter } from 'events';

/**
 * TerraformImplementAgent - Terraform HCL Code Generation
 * 
 * Generates production-ready Terraform IaC code from Terraform plans,
 * including main configuration, modules, and variable files.
 */
export class TerraformImplementAgent extends BaseAgent {
  constructor(spec = {}) {
    const defaultSpec = {
      id: 'terraform-implement',
      name: 'Terraform Implementation Agent',
      description: 'Generates Terraform HCL infrastructure code from plans',
      inputSchema: {
        type: 'object',
        properties: {
          terraformPlan: { type: 'object' },
          modules: { type: 'array' },
          variables: { type: 'object' }
        },
        required: ['terraformPlan', 'modules']
      },
      outputSchema: {
        type: 'object',
        properties: {
          files: { type: 'array' },
          mainConfig: { type: 'string' },
          variableFiles: { type: 'object' }
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

    const { terraformPlan, modules, variables = {} } = input;

    // Generate main configuration
    const mainConfig = await this.generateMainConfig(terraformPlan, modules);

    // Generate provider configuration
    const providerConfig = await this.generateProviderConfig(terraformPlan);

    // Generate backend configuration
    const backendConfig = await this.generateBackendConfig(terraformPlan);

    // Generate module files
    const moduleFiles = await this.generateModuleFiles(modules);

    // Generate variable files
    const variableFiles = await this.generateVariableFiles(variables, terraformPlan);

    // Generate outputs
    const outputsConfig = await this.generateOutputsConfig(modules);

    // Collect all files
    const files = [
      { path: 'main.tf', content: mainConfig, type: 'main' },
      { path: 'providers.tf', content: providerConfig, type: 'provider' },
      { path: 'backend.tf', content: backendConfig, type: 'backend' },
      { path: 'variables.tf', content: variableFiles.definitions, type: 'variables' },
      { path: 'outputs.tf', content: outputsConfig, type: 'outputs' },
      { path: 'terraform.tfvars', content: variableFiles.defaults, type: 'tfvars' },
      { path: 'dev.tfvars', content: variableFiles.dev, type: 'tfvars' },
      { path: 'prod.tfvars', content: variableFiles.prod, type: 'tfvars' },
      ...moduleFiles
    ];

    const result = {
      executionId,
      files,
      mainConfig,
      providerConfig,
      backendConfig,
      moduleFiles,
      variableFiles,
      outputsConfig,
      summary: {
        totalFiles: files.length,
        modules: moduleFiles.length,
        linesOfCode: this.countLines(files),
        providers: terraformPlan.providers || ['aws']
      }
    };

    this.codeCache.set(executionId, result);

    this.emit('terraform-code-generated', {
      executionId,
      filesGenerated: files.length,
      modulesGenerated: moduleFiles.length,
      providers: result.summary.providers
    });

    return {
      success: true,
      executionId,
      files,
      mainConfig,
      providerConfig,
      moduleFiles,
      variableFiles,
      summary: result.summary
    };
  }

  async generateMainConfig(terraformPlan, modules) {
    const lines = [];

    // Header
    lines.push(`# Terraform Infrastructure Configuration`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push(`# Provider: ${terraformPlan.providers?.[0] || 'aws'}`);
    lines.push('');

    // Terraform block
    lines.push('terraform {');
    lines.push(`  required_version = ">= ${terraformPlan.terraformVersion || '1.0'}"`);
    lines.push('');
    lines.push('  required_providers {');
    
    const providers = terraformPlan.providers || ['aws'];
    for (const provider of providers) {
      lines.push(`    ${provider} = {`);
      lines.push(`      source  = "${this.getProviderSource(provider)}"`);
      lines.push(`      version = "~> ${this.getProviderVersion(provider)}"`);
      lines.push(`    }`);
    }
    
    lines.push('  }');
    lines.push('}');
    lines.push('');

    // Module calls
    lines.push('# Module Deployments');
    for (const module of modules) {
      lines.push(`module "${module.name}" {`);
      lines.push(`  source = "./${module.path || 'modules/' + module.name}"`);
      lines.push('');
      
      // Add module variables
      if (module.variables) {
        for (const variable of module.variables) {
          lines.push(`  ${variable.name} = var.${variable.name}`);
        }
      }
      
      // Add common variables
      lines.push('  environment = var.environment');
      lines.push('  project_name = var.project_name');
      lines.push('  tags = var.tags');
      
      if (module.depends_on && module.depends_on.length > 0) {
        lines.push('');
        lines.push('  depends_on = [');
        module.depends_on.forEach(dep => {
          lines.push(`    module.${dep},`);
        });
        lines.push('  ]');
      }
      
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  async generateProviderConfig(terraformPlan) {
    const lines = [];
    const providers = terraformPlan.providers || ['aws'];

    for (const provider of providers) {
      lines.push(`# ${provider.toUpperCase()} Provider Configuration`);
      lines.push(`provider "${provider}" {`);
      
      if (provider === 'aws') {
        lines.push('  region = var.aws_region');
        lines.push('');
        lines.push('  default_tags {');
        lines.push('    tags = var.tags');
        lines.push('  }');
      } else if (provider === 'azurerm') {
        lines.push('  features {}');
        lines.push('  subscription_id = var.azure_subscription_id');
        lines.push('  tenant_id       = var.azure_tenant_id');
      } else if (provider === 'google') {
        lines.push('  project = var.gcp_project_id');
        lines.push('  region  = var.gcp_region');
      }
      
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  async generateBackendConfig(terraformPlan) {
    const lines = [];
    const backend = terraformPlan.backend || 's3';

    lines.push('# Backend Configuration');
    lines.push('terraform {');
    lines.push(`  backend "${backend}" {`);
    
    if (backend === 's3') {
      lines.push('    bucket         = "terraform-state-bucket"');
      lines.push('    key            = "terraform.tfstate"');
      lines.push('    region         = "us-east-1"');
      lines.push('    encrypt        = true');
      lines.push('    dynamodb_table = "terraform-locks"');
    } else if (backend === 'azurerm') {
      lines.push('    resource_group_name  = "terraform-state-rg"');
      lines.push('    storage_account_name = "tfstatestorage"');
      lines.push('    container_name       = "tfstate"');
      lines.push('    key                  = "terraform.tfstate"');
    } else if (backend === 'gcs') {
      lines.push('    bucket = "terraform-state-bucket"');
      lines.push('    prefix = "terraform/state"');
    }
    
    lines.push('  }');
    lines.push('}');

    return lines.join('\n');
  }

  async generateModuleFiles(modules) {
    const files = [];

    for (const module of modules) {
      const content = await this.generateModuleContent(module);
      const variablesContent = await this.generateModuleVariables(module);
      const outputsContent = await this.generateModuleOutputs(module);
      
      const modulePath = module.path || `modules/${module.name}`;
      
      files.push({
        path: `${modulePath}/main.tf`,
        content,
        type: 'module',
        moduleName: module.name
      });
      
      files.push({
        path: `${modulePath}/variables.tf`,
        content: variablesContent,
        type: 'module-variables',
        moduleName: module.name
      });
      
      files.push({
        path: `${modulePath}/outputs.tf`,
        content: outputsContent,
        type: 'module-outputs',
        moduleName: module.name
      });
    }

    return files;
  }

  async generateModuleContent(module) {
    const lines = [];

    // Header
    lines.push(`# ${module.description || module.name + ' Module'}`);
    lines.push('');

    // Resources
    if (module.resources) {
      for (const resource of module.resources) {
        lines.push(...this.generateResourceBlock(resource));
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  generateResourceBlock(resource) {
    const lines = [];
    
    lines.push(`resource "${resource.type}" "${resource.name || 'main'}" {`);
    
    // Add common attributes
    if (resource.name) {
      lines.push(`  name = "\${var.project_name}-\${var.environment}-${resource.name}"`);
    }
    
    // Add resource-specific properties
    if (resource.properties) {
      Object.entries(resource.properties).forEach(([key, value]) => {
        lines.push(`  ${key} = ${this.formatValue(value)}`);
      });
    }
    
    // Add tags
    lines.push('');
    lines.push('  tags = merge(var.tags, {');
    lines.push(`    Name = "\${var.project_name}-\${var.environment}-${resource.name || resource.type}"`);
    lines.push('  })');
    
    lines.push('}');
    
    return lines;
  }

  async generateModuleVariables(module) {
    const lines = [];

    // Common variables
    lines.push('# Common Variables');
    lines.push('variable "environment" {');
    lines.push('  description = "Environment name"');
    lines.push('  type        = string');
    lines.push('}');
    lines.push('');
    lines.push('variable "project_name" {');
    lines.push('  description = "Project name"');
    lines.push('  type        = string');
    lines.push('}');
    lines.push('');
    lines.push('variable "tags" {');
    lines.push('  description = "Resource tags"');
    lines.push('  type        = map(string)');
    lines.push('  default     = {}');
    lines.push('}');
    lines.push('');

    // Module-specific variables
    if (module.variables) {
      lines.push('# Module-Specific Variables');
      for (const variable of module.variables) {
        lines.push(`variable "${variable.name}" {`);
        lines.push(`  description = "${variable.description || variable.name}"`);
        lines.push(`  type        = ${variable.type || 'string'}`);
        if (variable.default !== undefined) {
          lines.push(`  default     = ${this.formatValue(variable.default)}`);
        }
        lines.push('}');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  async generateModuleOutputs(module) {
    const lines = [];

    if (module.outputs) {
      for (const output of module.outputs) {
        lines.push(`output "${output.name}" {`);
        lines.push(`  description = "${output.description || output.name}"`);
        lines.push(`  value       = ${output.value}`);
        if (output.sensitive) {
          lines.push('  sensitive   = true');
        }
        lines.push('}');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  async generateVariableFiles(variables, terraformPlan) {
    const definitions = this.generateVariableDefinitions(variables, terraformPlan);
    const defaults = this.generateTfvars('default', variables, terraformPlan);
    const dev = this.generateTfvars('dev', variables, terraformPlan);
    const prod = this.generateTfvars('prod', variables, terraformPlan);

    return {
      definitions,
      defaults,
      dev,
      prod
    };
  }

  generateVariableDefinitions(variables, terraformPlan) {
    const lines = [];

    // Core variables
    lines.push('# Core Variables');
    lines.push('variable "environment" {');
    lines.push('  description = "Environment name (dev, staging, prod)"');
    lines.push('  type        = string');
    lines.push('}');
    lines.push('');
    lines.push('variable "project_name" {');
    lines.push('  description = "Project name used for resource naming"');
    lines.push('  type        = string');
    lines.push('}');
    lines.push('');

    // Provider-specific variables
    const providers = terraformPlan.providers || ['aws'];
    if (providers.includes('aws')) {
      lines.push('variable "aws_region" {');
      lines.push('  description = "AWS region"');
      lines.push('  type        = string');
      lines.push('  default     = "us-east-1"');
      lines.push('}');
      lines.push('');
    }
    
    if (providers.includes('azurerm')) {
      lines.push('variable "azure_subscription_id" {');
      lines.push('  description = "Azure subscription ID"');
      lines.push('  type        = string');
      lines.push('}');
      lines.push('');
      lines.push('variable "azure_tenant_id" {');
      lines.push('  description = "Azure tenant ID"');
      lines.push('  type        = string');
      lines.push('}');
      lines.push('');
    }

    // Tags
    lines.push('variable "tags" {');
    lines.push('  description = "Common tags for all resources"');
    lines.push('  type        = map(string)');
    lines.push('  default = {');
    lines.push('    ManagedBy = "Terraform"');
    lines.push('  }');
    lines.push('}');

    return lines.join('\n');
  }

  generateTfvars(environment, variables, terraformPlan) {
    const lines = [];

    lines.push(`# ${environment} Environment Variables`);
    lines.push(`environment  = "${environment}"`);
    lines.push('project_name = "myproject"');
    lines.push('');

    const providers = terraformPlan.providers || ['aws'];
    if (providers.includes('aws')) {
      lines.push('aws_region = "us-east-1"');
    }

    lines.push('');
    lines.push('tags = {');
    lines.push(`  Environment = "${environment}"`);
    lines.push('  ManagedBy   = "Terraform"');
    lines.push('}');

    return lines.join('\n');
  }

  async generateOutputsConfig(modules) {
    const lines = [];

    lines.push('# Root Outputs');
    for (const module of modules) {
      if (module.outputs) {
        for (const output of module.outputs) {
          lines.push(`output "${module.name}_${output.name}" {`);
          lines.push(`  description = "${output.description || output.name}"`);
          lines.push(`  value       = module.${module.name}.${output.name}`);
          if (output.sensitive) {
            lines.push('  sensitive   = true');
          }
          lines.push('}');
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  getProviderSource(provider) {
    const sources = {
      aws: 'hashicorp/aws',
      azurerm: 'hashicorp/azurerm',
      google: 'hashicorp/google',
      kubernetes: 'hashicorp/kubernetes',
      helm: 'hashicorp/helm'
    };
    return sources[provider] || `hashicorp/${provider}`;
  }

  getProviderVersion(provider) {
    const versions = {
      aws: '5.0',
      azurerm: '3.0',
      google: '5.0',
      kubernetes: '2.0',
      helm: '2.0'
    };
    return versions[provider] || '1.0';
  }

  formatValue(value) {
    if (typeof value === 'string') {
      return `"${value}"`;
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
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value).map(([k, v]) => `    ${k} = ${this.formatValue(v)}`);
      return `{\n${entries.join('\n')}\n  }`;
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
      linesOfCode: c.summary.linesOfCode,
      providers: c.summary.providers
    }));
  }

  async _onCleanup() {
    // Cleanup if needed
  }
}

export default TerraformImplementAgent;
