/**
 * APIMatic MCP Server Adapter
 * 
 * Provides API documentation generation via MCP
 * @module mcp/servers/testing/APIMaticAdapter
 */

import { BaseServerAdapter } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { 
  MCPServerDefinition, 
  ToolCallResponse 
} from '../../types';

/**
 * API specification formats
 */
export type APISpecFormat = 
  | 'openapi-3.0'
  | 'openapi-3.1'
  | 'swagger-2.0'
  | 'raml-1.0'
  | 'postman-2.0'
  | 'apiblueprint';

/**
 * Output SDK language
 */
export type SDKLanguage = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'csharp'
  | 'java'
  | 'ruby'
  | 'go'
  | 'php';

/**
 * Documentation format
 */
export type DocFormat = 
  | 'html'
  | 'markdown'
  | 'pdf';

/**
 * API validation result
 */
export interface APIValidationResult {
  valid: boolean;
  errors: APIValidationError[];
  warnings: APIValidationWarning[];
}

/**
 * API validation error
 */
export interface APIValidationError {
  path: string;
  message: string;
  severity: 'error' | 'critical';
}

/**
 * API validation warning
 */
export interface APIValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

/**
 * APIMatic Adapter
 * 
 * Provides MCP access to APIMatic operations
 */
export class APIMaticAdapter extends BaseServerAdapter {
  /**
   * Get server identifier
   */
  getServerId(): string {
    return 'apimatic';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'apimatic',
      name: 'apimatic',
      category: 'testing',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic/apimatic-mcp'],
      enabled: true,
      description: 'API documentation and SDK generation via MCP',
      tags: ['api', 'documentation', 'sdk', 'openapi', 'testing'],
    };
  }

  /**
   * Validate API specification
   */
  async validateSpec(
    specContent: string,
    format: APISpecFormat
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_validate', {
      spec: specContent,
      format,
    });
  }

  /**
   * Validate API specification from URL
   */
  async validateSpecFromUrl(
    specUrl: string,
    format?: APISpecFormat
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_validate_url', {
      url: specUrl,
      format,
    });
  }

  /**
   * Convert API specification format
   */
  async convertSpec(
    specContent: string,
    fromFormat: APISpecFormat,
    toFormat: APISpecFormat
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_convert', {
      spec: specContent,
      fromFormat,
      toFormat,
    });
  }

  /**
   * Generate SDK
   */
  async generateSDK(
    specContent: string,
    format: APISpecFormat,
    language: SDKLanguage,
    options?: {
      packageName?: string;
      packageVersion?: string;
      namespace?: string;
    }
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_generate_sdk', {
      spec: specContent,
      format,
      language,
      ...options,
    });
  }

  /**
   * Generate documentation
   */
  async generateDocs(
    specContent: string,
    format: APISpecFormat,
    outputFormat: DocFormat = 'html',
    options?: {
      title?: string;
      description?: string;
      theme?: string;
    }
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_generate_docs', {
      spec: specContent,
      specFormat: format,
      outputFormat,
      ...options,
    });
  }

  /**
   * Lint API specification
   */
  async lintSpec(
    specContent: string,
    format: APISpecFormat,
    rules?: string[]
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_lint', {
      spec: specContent,
      format,
      rules,
    });
  }

  /**
   * Generate API mock server config
   */
  async generateMockConfig(
    specContent: string,
    format: APISpecFormat
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_generate_mock', {
      spec: specContent,
      format,
    });
  }

  /**
   * Get transformation metadata
   */
  async getTransformationMetadata(
    specContent: string,
    format: APISpecFormat
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_get_metadata', {
      spec: specContent,
      format,
    });
  }

  /**
   * Merge multiple API specifications
   */
  async mergeSpecs(
    specs: Array<{ content: string; format: APISpecFormat }>,
    outputFormat: APISpecFormat
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_merge', {
      specs,
      outputFormat,
    });
  }

  /**
   * Generate API comparison report
   */
  async compareSpecs(
    spec1: string,
    spec2: string,
    format: APISpecFormat
  ): Promise<ToolCallResponse> {
    return this.callTool('apimatic_compare', {
      spec1,
      spec2,
      format,
    });
  }
}

/**
 * Create APIMatic adapter instance
 */
export function createAPIMaticAdapter(clientManager: MCPClientManager): APIMaticAdapter {
  return new APIMaticAdapter(clientManager);
}
