import { BaseAgent } from '../core/BaseAgent.js';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * ValidationAgent - Validates Azure configurations
 * Checks for security, compliance, best practices, and common issues
 */
export class ValidationAgent extends BaseAgent {
  constructor() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(__dirname, '..', '..');

    const pythonCommand = process.env.AGENTICCODER_PYTHON || 'python';
    const docsMcpCwd = path.join(repoRoot, '.github', 'mcp', 'microsoft-docs-mcp');

    const definition = {
      id: 'validation',
      name: 'Validation Agent',
      version: '1.0.0',
      type: 'validation',
      description: 'Validates Azure resource configurations for security, compliance, and best practices',
      inputs: {
        type: 'object',
        required: ['resources'],
        properties: {
          resources: {
            type: 'array',
            description: 'Resources to validate',
            items: { type: 'object' }
          },
          template: {
            type: 'string',
            description: 'Optional deployment template to validate'
          },
          validationRules: {
            type: 'array',
            description: 'Specific validation rules to apply',
            items: { type: 'string' }
          },
          complianceFramework: {
            type: 'string',
            enum: ['azure-security-benchmark', 'cis', 'pci-dss', 'hipaa', 'none'],
            default: 'azure-security-benchmark'
          }
        }
      },
      outputs: {
        type: 'object',
        required: ['isValid', 'validationResults'],
        properties: {
          isValid: {
            type: 'boolean',
            description: 'Overall validation result'
          },
          validationResults: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                resourceId: { type: 'string' },
                ruleName: { type: 'string' },
                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
                passed: { type: 'boolean' },
                message: { type: 'string' },
                recommendation: { type: 'string' },
                docUrl: { type: 'string' }
              }
            }
          },
          summary: {
            type: 'object',
            properties: {
              totalChecks: { type: 'number' },
              passed: { type: 'number' },
              failed: { type: 'number' },
              criticalIssues: { type: 'number' },
              highIssues: { type: 'number' },
              mediumIssues: { type: 'number' },
              lowIssues: { type: 'number' }
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
      timeout: 45000
    };

    super(definition);
  }

  async _onExecute(input, context, executionId) {
    const { 
      resources, 
      template, 
      validationRules = [], 
      complianceFramework = 'azure-security-benchmark' 
    } = input;

    const validationResults = [];
    
    // Validate each resource
    for (const resource of resources) {
      const resourceResults = await this._validateResource(resource, complianceFramework);
      validationResults.push(...resourceResults);
    }

    // Apply custom validation rules
    if (validationRules.length > 0) {
      const customResults = await this._applyCustomRules(resources, validationRules);
      validationResults.push(...customResults);
    }

    // Validate template if provided
    if (template) {
      const templateResults = await this._validateTemplate(template);
      validationResults.push(...templateResults);
    }

    // Calculate summary
    const summary = this._calculateSummary(validationResults);
    
    // Overall validation passes if no critical or high issues
    const isValid = summary.criticalIssues === 0 && summary.highIssues === 0;

    // Optional: attach best-effort docs search results for the first failing rule.
    // Only do this in MCP mode (or when explicitly enabled) to keep default runs fast.
    const transport = (process.env.AGENTICCODER_TOOL_TRANSPORT || '').toLowerCase();
    const wantsMcp = transport.startsWith('mcp');
    const enableHttpProbe = process.env.AGENTICCODER_ENABLE_HTTP_MCP_PROBES === '1';

    let documentationResults = null;
    if (wantsMcp || enableHttpProbe) {
      const firstFailed = validationResults.find((r) => r && r.passed === false);
      if (firstFailed) {
        const docsQuery = `azure ${complianceFramework} ${firstFailed.ruleName}`;
        documentationResults = await this._tryDocsSearch(docsQuery, wantsMcp);
      }
    }

    return {
      isValid,
      validationResults,
      summary,
      documentationResults,
      metadata: {
        executionId,
        complianceFramework,
        timestamp: new Date().toISOString()
      }
    };
  }

  async _tryDocsSearch(query, wantsMcp) {
    const client = this.mcpClients.get('azure-docs');
    if (!client || !query) return null;

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

  async _validateResource(resource, complianceFramework) {
    const results = [];
    const resourceType = resource.type;

    // Security validations
    results.push(...this._validateSecurity(resource));

    // Naming conventions
    results.push(...this._validateNaming(resource));

    // SKU and sizing
    results.push(...this._validateSizing(resource));

    // Networking
    if (resourceType.includes('Network')) {
      results.push(...this._validateNetworking(resource));
    }

    // Storage
    if (resourceType.includes('Storage')) {
      results.push(...this._validateStorage(resource));
    }

    // Compute
    if (resourceType.includes('Compute') || resourceType.includes('sites')) {
      results.push(...this._validateCompute(resource));
    }

    // Key Vault
    if (resourceType.includes('KeyVault')) {
      results.push(...this._validateKeyVault(resource));
    }

    // Compliance framework specific checks
    if (complianceFramework !== 'none') {
      results.push(...this._validateCompliance(resource, complianceFramework));
    }

    return results;
  }

  _validateSecurity(resource) {
    const results = [];

    // Check for public access
    if (resource.properties?.publicNetworkAccess === 'Enabled') {
      results.push({
        resourceId: resource.id,
        ruleName: 'PUBLIC_ACCESS_ENABLED',
        severity: 'high',
        passed: false,
        message: 'Public network access is enabled',
        recommendation: 'Consider disabling public access and use private endpoints',
        docUrl: 'https://learn.microsoft.com/azure/security/fundamentals/network-best-practices'
      });
    } else {
      results.push({
        resourceId: resource.id,
        ruleName: 'PUBLIC_ACCESS_DISABLED',
        severity: 'info',
        passed: true,
        message: 'Public network access is properly restricted'
      });
    }

    // Check for encryption
    if (resource.type.includes('Storage') && !resource.properties?.encryption?.services?.blob?.enabled) {
      results.push({
        resourceId: resource.id,
        ruleName: 'ENCRYPTION_AT_REST',
        severity: 'critical',
        passed: false,
        message: 'Encryption at rest is not enabled',
        recommendation: 'Enable encryption for all storage services',
        docUrl: 'https://learn.microsoft.com/azure/storage/common/storage-service-encryption'
      });
    }

    // Check for HTTPS only
    if (resource.type.includes('Storage') && !resource.properties?.supportsHttpsTrafficOnly) {
      results.push({
        resourceId: resource.id,
        ruleName: 'HTTPS_ONLY',
        severity: 'high',
        passed: false,
        message: 'HTTPS-only traffic is not enforced',
        recommendation: 'Enable "Secure transfer required" to enforce HTTPS',
        docUrl: 'https://learn.microsoft.com/azure/storage/common/storage-require-secure-transfer'
      });
    }

    // Check for managed identity
    if ((resource.type.includes('sites') || resource.type.includes('virtualMachines')) && 
        !resource.identity) {
      results.push({
        resourceId: resource.id,
        ruleName: 'MANAGED_IDENTITY',
        severity: 'medium',
        passed: false,
        message: 'Managed identity is not configured',
        recommendation: 'Enable system-assigned or user-assigned managed identity',
        docUrl: 'https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview'
      });
    }

    return results;
  }

  _validateNaming(resource) {
    const results = [];
    const name = resource.name;

    // Check naming length
    const maxLengths = {
      'Microsoft.Storage/storageAccounts': 24,
      'Microsoft.Web/sites': 60,
      'Microsoft.Compute/virtualMachines': 64,
      'Microsoft.KeyVault/vaults': 24
    };

    const maxLength = maxLengths[resource.type] || 80;
    if (name.length > maxLength) {
      results.push({
        resourceId: resource.id,
        ruleName: 'NAME_LENGTH',
        severity: 'high',
        passed: false,
        message: `Resource name exceeds maximum length of ${maxLength} characters`,
        recommendation: `Shorten the resource name to ${maxLength} characters or less`
      });
    }

    // Check for valid characters (alphanumeric and hyphens)
    if (!/^[a-zA-Z0-9-]+$/.test(name)) {
      results.push({
        resourceId: resource.id,
        ruleName: 'NAME_CHARACTERS',
        severity: 'medium',
        passed: false,
        message: 'Resource name contains invalid characters',
        recommendation: 'Use only alphanumeric characters and hyphens'
      });
    }

    // Check for descriptive naming
    if (name.length < 3) {
      results.push({
        resourceId: resource.id,
        ruleName: 'NAME_DESCRIPTIVE',
        severity: 'low',
        passed: false,
        message: 'Resource name is too short and may not be descriptive',
        recommendation: 'Use descriptive names that indicate the resource purpose'
      });
    }

    return results;
  }

  /**
   * Helper to safely get SKU name from string or object
   */
  _getSkuName(sku) {
    if (!sku) return null;
    if (typeof sku === 'string') return sku;
    return sku.name || sku.tier || null;
  }

  _validateSizing(resource) {
    const results = [];

    // Check for oversized SKUs in dev/test
    const tags = resource.tags || {};
    if (tags.environment === 'development' || tags.environment === 'test') {
      const premiumSkus = ['Premium', 'Standard_D', 'Standard_E'];
      const skuName = this._getSkuName(resource.sku);
      if (skuName && premiumSkus.some(sku => skuName.includes(sku))) {
        results.push({
          resourceId: resource.id,
          ruleName: 'DEV_TEST_SIZING',
          severity: 'medium',
          passed: false,
          message: 'Premium SKU detected in dev/test environment',
          recommendation: 'Consider using Basic or Standard SKUs for non-production workloads',
          docUrl: 'https://learn.microsoft.com/azure/architecture/framework/cost/optimize-vm'
        });
      }
    }

    // Check for deprecated SKUs
    const deprecatedSkus = ['Basic_A0', 'Basic_A1', 'Standard_A0', 'Standard_A1'];
    const deprecatedSkuName = this._getSkuName(resource.sku);
    if (deprecatedSkuName && deprecatedSkus.includes(deprecatedSkuName)) {
      results.push({
        resourceId: resource.id,
        ruleName: 'DEPRECATED_SKU',
        severity: 'high',
        passed: false,
        message: 'Resource uses a deprecated SKU',
        recommendation: 'Migrate to a current generation SKU',
        docUrl: 'https://learn.microsoft.com/azure/virtual-machines/sizes'
      });
    }

    return results;
  }

  _validateNetworking(resource) {
    const results = [];

    // Check for NSG
    if (resource.type.includes('networkInterfaces') && !resource.properties?.networkSecurityGroup) {
      results.push({
        resourceId: resource.id,
        ruleName: 'NSG_REQUIRED',
        severity: 'high',
        passed: false,
        message: 'Network interface does not have an NSG attached',
        recommendation: 'Attach a Network Security Group to control traffic',
        docUrl: 'https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview'
      });
    }

    // Check for DDoS protection on VNets
    if (resource.type.includes('virtualNetworks') && 
        !resource.properties?.enableDdosProtection) {
      results.push({
        resourceId: resource.id,
        ruleName: 'DDOS_PROTECTION',
        severity: 'medium',
        passed: false,
        message: 'DDoS Protection is not enabled',
        recommendation: 'Enable DDoS Protection Standard for production workloads',
        docUrl: 'https://learn.microsoft.com/azure/ddos-protection/ddos-protection-overview'
      });
    }

    return results;
  }

  _validateStorage(resource) {
    const results = [];

    // Check for geo-redundancy
    const storageSkuName = this._getSkuName(resource.sku);
    if (storageSkuName && storageSkuName.includes('LRS')) {
      const tags = resource.tags || {};
      if (tags.environment === 'production') {
        results.push({
          resourceId: resource.id,
          ruleName: 'GEO_REDUNDANCY',
          severity: 'medium',
          passed: false,
          message: 'Production storage account uses locally redundant storage (LRS)',
          recommendation: 'Consider using GRS or ZRS for production workloads',
          docUrl: 'https://learn.microsoft.com/azure/storage/common/storage-redundancy'
        });
      }
    }

    // Check for soft delete
    if (!resource.properties?.deleteRetentionPolicy?.enabled) {
      results.push({
        resourceId: resource.id,
        ruleName: 'SOFT_DELETE',
        severity: 'medium',
        passed: false,
        message: 'Soft delete is not enabled',
        recommendation: 'Enable soft delete to protect against accidental deletion',
        docUrl: 'https://learn.microsoft.com/azure/storage/blobs/soft-delete-blob-overview'
      });
    }

    return results;
  }

  _validateCompute(resource) {
    const results = [];

    // Check for backup
    if (resource.type.includes('virtualMachines') && !resource.properties?.backupPolicy) {
      results.push({
        resourceId: resource.id,
        ruleName: 'BACKUP_ENABLED',
        severity: 'high',
        passed: false,
        message: 'Backup is not configured',
        recommendation: 'Configure Azure Backup for data protection',
        docUrl: 'https://learn.microsoft.com/azure/backup/backup-overview'
      });
    }

    // Check for monitoring
    if (!resource.properties?.diagnosticSettings) {
      results.push({
        resourceId: resource.id,
        ruleName: 'MONITORING_ENABLED',
        severity: 'medium',
        passed: false,
        message: 'Diagnostic settings are not configured',
        recommendation: 'Enable diagnostic logging and monitoring',
        docUrl: 'https://learn.microsoft.com/azure/azure-monitor/essentials/diagnostic-settings'
      });
    }

    return results;
  }

  _validateKeyVault(resource) {
    const results = [];

    // Check for soft delete
    if (!resource.properties?.enableSoftDelete) {
      results.push({
        resourceId: resource.id,
        ruleName: 'KV_SOFT_DELETE',
        severity: 'critical',
        passed: false,
        message: 'Key Vault soft delete is not enabled',
        recommendation: 'Enable soft delete to protect against accidental deletion',
        docUrl: 'https://learn.microsoft.com/azure/key-vault/general/soft-delete-overview'
      });
    }

    // Check for purge protection
    if (!resource.properties?.enablePurgeProtection) {
      results.push({
        resourceId: resource.id,
        ruleName: 'KV_PURGE_PROTECTION',
        severity: 'high',
        passed: false,
        message: 'Key Vault purge protection is not enabled',
        recommendation: 'Enable purge protection for production Key Vaults',
        docUrl: 'https://learn.microsoft.com/azure/key-vault/general/soft-delete-overview'
      });
    }

    // Check for firewall
    if (!resource.properties?.networkAcls) {
      results.push({
        resourceId: resource.id,
        ruleName: 'KV_FIREWALL',
        severity: 'high',
        passed: false,
        message: 'Key Vault firewall is not configured',
        recommendation: 'Configure network rules to restrict access',
        docUrl: 'https://learn.microsoft.com/azure/key-vault/general/network-security'
      });
    }

    return results;
  }

  _validateCompliance(resource, framework) {
    const results = [];

    // Azure Security Benchmark checks
    if (framework === 'azure-security-benchmark') {
      // Check for tags
      if (!resource.tags || Object.keys(resource.tags).length === 0) {
        results.push({
          resourceId: resource.id,
          ruleName: 'ASB_TAGGING',
          severity: 'low',
          passed: false,
          message: 'Resource has no tags',
          recommendation: 'Apply tags for governance and cost management',
          docUrl: 'https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/naming-and-tagging'
        });
      }

      // Check for location compliance
      const allowedLocations = ['eastus', 'westus', 'westeurope', 'northeurope'];
      if (!allowedLocations.includes(resource.location)) {
        results.push({
          resourceId: resource.id,
          ruleName: 'ASB_LOCATION',
          severity: 'medium',
          passed: false,
          message: 'Resource location may not comply with data residency requirements',
          recommendation: 'Deploy resources in approved regions only'
        });
      }
    }

    return results;
  }

  async _applyCustomRules(resources, rules) {
    // Placeholder for custom validation rules
    return [];
  }

  async _validateTemplate(template) {
    const results = [];

    // Basic template structure validation
    try {
      const parsed = typeof template === 'string' ? JSON.parse(template) : template;
      
      if (!parsed.$schema) {
        results.push({
          resourceId: 'template',
          ruleName: 'TEMPLATE_SCHEMA',
          severity: 'high',
          passed: false,
          message: 'Template is missing $schema property',
          recommendation: 'Add $schema property to template'
        });
      }

      if (!parsed.resources || parsed.resources.length === 0) {
        results.push({
          resourceId: 'template',
          ruleName: 'TEMPLATE_RESOURCES',
          severity: 'critical',
          passed: false,
          message: 'Template has no resources defined',
          recommendation: 'Add at least one resource to the template'
        });
      }
    } catch (error) {
      results.push({
        resourceId: 'template',
        ruleName: 'TEMPLATE_SYNTAX',
        severity: 'critical',
        passed: false,
        message: `Template has syntax errors: ${error.message}`,
        recommendation: 'Fix template syntax errors'
      });
    }

    return results;
  }

  _calculateSummary(validationResults) {
    const summary = {
      totalChecks: validationResults.length,
      passed: 0,
      failed: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0
    };

    for (const result of validationResults) {
      if (result.passed) {
        summary.passed++;
      } else {
        summary.failed++;
        switch (result.severity) {
          case 'critical': summary.criticalIssues++; break;
          case 'high': summary.highIssues++; break;
          case 'medium': summary.mediumIssues++; break;
          case 'low': summary.lowIssues++; break;
        }
      }
    }

    return summary;
  }
}
