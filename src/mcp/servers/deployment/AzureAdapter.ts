/**
 * Azure MCP Server Adapter
 * 
 * Provides Azure cloud operations via MCP
 * @module mcp/servers/deployment/AzureAdapter
 */

import { BaseServerAdapter } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { 
  MCPServerDefinition, 
  ToolCallResponse 
} from '../../types';

/**
 * Azure resource types
 */
export type AzureResourceType = 
  | 'resourceGroup'
  | 'webApp'
  | 'functionApp'
  | 'staticWebApp'
  | 'containerApp'
  | 'storageAccount'
  | 'cosmosDB'
  | 'keyVault'
  | 'containerRegistry';

/**
 * Azure region type
 */
export type AzureRegion = 
  | 'westeurope'
  | 'northeurope'
  | 'eastus'
  | 'westus'
  | 'centralus'
  | 'uksouth'
  | 'eastasia';

/**
 * Azure resource definition
 */
export interface AzureResource {
  name: string;
  type: AzureResourceType;
  resourceGroup: string;
  region: AzureRegion;
  tags?: Record<string, string>;
  properties?: Record<string, unknown>;
}

/**
 * Azure deployment result
 */
export interface AzureDeploymentResult {
  success: boolean;
  deploymentId: string;
  resourceId: string;
  outputs?: Record<string, unknown>;
  error?: string;
}

/**
 * Azure Adapter
 * 
 * Provides MCP access to Azure operations
 */
export class AzureAdapter extends BaseServerAdapter {
  /**
   * Get server identifier
   */
  getServerId(): string {
    return 'azure';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'azure',
      name: 'azure',
      category: 'deployment',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@azure/mcp-server'],
      enabled: true,
      description: 'Azure cloud resource management via MCP',
      tags: ['azure', 'cloud', 'deployment', 'infrastructure'],
    };
  }

  /**
   * List Azure subscriptions
   */
  async listSubscriptions(): Promise<ToolCallResponse> {
    return this.callTool('azure_list_subscriptions', {});
  }

  /**
   * List resource groups
   */
  async listResourceGroups(subscriptionId: string): Promise<ToolCallResponse> {
    return this.callTool('azure_list_resource_groups', {
      subscriptionId,
    });
  }

  /**
   * Create resource group
   */
  async createResourceGroup(
    name: string,
    region: AzureRegion,
    tags?: Record<string, string>
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_create_resource_group', {
      name,
      location: region,
      tags,
    });
  }

  /**
   * Deploy ARM template
   */
  async deployTemplate(
    resourceGroup: string,
    deploymentName: string,
    template: Record<string, unknown>,
    parameters?: Record<string, unknown>
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_deploy_template', {
      resourceGroup,
      deploymentName,
      template,
      parameters,
    });
  }

  /**
   * Deploy Bicep template
   */
  async deployBicep(
    resourceGroup: string,
    deploymentName: string,
    bicepContent: string,
    parameters?: Record<string, unknown>
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_deploy_bicep', {
      resourceGroup,
      deploymentName,
      bicepContent,
      parameters,
    });
  }

  /**
   * Create Web App
   */
  async createWebApp(
    name: string,
    resourceGroup: string,
    runtime: string,
    region: AzureRegion
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_create_web_app', {
      name,
      resourceGroup,
      runtime,
      location: region,
    });
  }

  /**
   * Create Function App
   */
  async createFunctionApp(
    name: string,
    resourceGroup: string,
    runtime: string,
    region: AzureRegion,
    storageAccount: string
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_create_function_app', {
      name,
      resourceGroup,
      runtime,
      location: region,
      storageAccount,
    });
  }

  /**
   * Create Container App
   */
  async createContainerApp(
    name: string,
    resourceGroup: string,
    image: string,
    region: AzureRegion,
    environmentId: string
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_create_container_app', {
      name,
      resourceGroup,
      image,
      location: region,
      environmentId,
    });
  }

  /**
   * Create Static Web App
   */
  async createStaticWebApp(
    name: string,
    resourceGroup: string,
    region: AzureRegion,
    repositoryUrl?: string
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_create_static_web_app', {
      name,
      resourceGroup,
      location: region,
      repositoryUrl,
    });
  }

  /**
   * Create Storage Account
   */
  async createStorageAccount(
    name: string,
    resourceGroup: string,
    region: AzureRegion,
    sku: 'Standard_LRS' | 'Standard_GRS' | 'Premium_LRS' = 'Standard_LRS'
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_create_storage_account', {
      name,
      resourceGroup,
      location: region,
      sku,
    });
  }

  /**
   * Get resource
   */
  async getResource(resourceId: string): Promise<ToolCallResponse> {
    return this.callTool('azure_get_resource', {
      resourceId,
    });
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string): Promise<ToolCallResponse> {
    return this.callTool('azure_delete_resource', {
      resourceId,
    });
  }

  /**
   * List resources in resource group
   */
  async listResources(resourceGroup: string, resourceType?: string): Promise<ToolCallResponse> {
    return this.callTool('azure_list_resources', {
      resourceGroup,
      resourceType,
    });
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(
    resourceGroup: string,
    deploymentName: string
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_get_deployment_status', {
      resourceGroup,
      deploymentName,
    });
  }

  /**
   * Get Key Vault secret
   */
  async getKeyVaultSecret(
    vaultName: string,
    secretName: string
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_get_keyvault_secret', {
      vaultName,
      secretName,
    });
  }

  /**
   * Set Key Vault secret
   */
  async setKeyVaultSecret(
    vaultName: string,
    secretName: string,
    value: string
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_set_keyvault_secret', {
      vaultName,
      secretName,
      value,
    });
  }

  /**
   * Get app settings
   */
  async getAppSettings(
    resourceGroup: string,
    appName: string,
    appType: 'webApp' | 'functionApp'
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_get_app_settings', {
      resourceGroup,
      appName,
      appType,
    });
  }

  /**
   * Update app settings
   */
  async updateAppSettings(
    resourceGroup: string,
    appName: string,
    appType: 'webApp' | 'functionApp',
    settings: Record<string, string>
  ): Promise<ToolCallResponse> {
    return this.callTool('azure_update_app_settings', {
      resourceGroup,
      appName,
      appType,
      settings,
    });
  }
}

/**
 * Create Azure adapter instance
 */
export function createAzureAdapter(clientManager: MCPClientManager): AzureAdapter {
  return new AzureAdapter(clientManager);
}
