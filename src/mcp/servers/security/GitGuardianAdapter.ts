/**
 * GitGuardian MCP Server Adapter
 * 
 * Provides secret detection and scanning via MCP
 * @module mcp/servers/security/GitGuardianAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * GitGuardian adapter configuration
 */
export interface GitGuardianAdapterConfig extends ServerAdapterConfig {
  apiKey?: string;
}

/**
 * Secret finding
 */
export interface SecretFinding {
  type: string;
  match: string;
  file: string;
  line: number;
  detector: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  validity: 'valid' | 'invalid' | 'unknown';
}

/**
 * Scan result
 */
export interface ScanResult {
  success: boolean;
  findings: SecretFinding[];
  scannedFiles: number;
  duration: number;
}

/**
 * GitGuardian MCP Server Adapter
 */
export class GitGuardianAdapter extends BaseServerAdapter {
  private apiKey: string | undefined;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<GitGuardianAdapterConfig>
  ) {
    super(clientManager, config);
    this.apiKey = config?.apiKey || process.env.GITGUARDIAN_API_KEY;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'gitguardian';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'gitguardian',
      name: 'GitGuardian Server',
      description: 'Secret detection and scanning',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'gitguardian-mcp-server'],
      category: 'security',
      enabled: true,
      tags: ['security', 'secrets', 'scanning'],
      env: {
        GITGUARDIAN_API_KEY: this.apiKey || '${GITGUARDIAN_API_KEY}',
      },
    };
  }

  /**
   * Scan a file for secrets
   */
  async scanFile(filePath: string): Promise<ScanResult> {
    const response = await this.callTool('scan_file', { file_path: filePath });
    
    if (!response.success) {
      throw new Error(`Failed to scan file: ${response.error?.message}`);
    }

    return response.result as ScanResult;
  }

  /**
   * Scan a directory for secrets
   */
  async scanDirectory(
    directoryPath: string,
    options?: {
      recursive?: boolean;
      excludePatterns?: string[];
    }
  ): Promise<ScanResult> {
    const response = await this.callTool('scan_directory', {
      directory_path: directoryPath,
      recursive: options?.recursive ?? true,
      exclude_patterns: options?.excludePatterns || [],
    });
    
    if (!response.success) {
      throw new Error(`Failed to scan directory: ${response.error?.message}`);
    }

    return response.result as ScanResult;
  }

  /**
   * Scan text content for secrets
   */
  async scanContent(content: string, filename?: string): Promise<ScanResult> {
    const response = await this.callTool('scan_content', {
      content,
      filename: filename || 'content.txt',
    });
    
    if (!response.success) {
      throw new Error(`Failed to scan content: ${response.error?.message}`);
    }

    return response.result as ScanResult;
  }

  /**
   * Check if content contains secrets (boolean result)
   */
  async hasSecrets(content: string): Promise<boolean> {
    const result = await this.scanContent(content);
    return result.findings.length > 0;
  }

  /**
   * Get high-severity findings from a scan
   */
  filterHighSeverity(findings: SecretFinding[]): SecretFinding[] {
    return findings.filter(f => f.severity === 'high' || f.severity === 'critical');
  }
}

/**
 * Create a GitGuardian adapter
 */
export function createGitGuardianAdapter(
  clientManager: MCPClientManager,
  config?: Partial<GitGuardianAdapterConfig>
): GitGuardianAdapter {
  return new GitGuardianAdapter(clientManager, config);
}
