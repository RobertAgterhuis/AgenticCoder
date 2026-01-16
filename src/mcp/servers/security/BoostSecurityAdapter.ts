/**
 * BoostSecurity MCP Server Adapter
 * 
 * Provides SAST and security scanning via MCP
 * @module mcp/servers/security/BoostSecurityAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * BoostSecurity adapter configuration
 */
export interface BoostSecurityAdapterConfig extends ServerAdapterConfig {
  apiKey?: string;
}

/**
 * Security vulnerability finding
 */
export interface VulnerabilityFinding {
  id: string;
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line: number;
  column?: number;
  message: string;
  rule: string;
  cweId?: string;
  recommendation?: string;
}

/**
 * SAST scan result
 */
export interface SASTResult {
  success: boolean;
  vulnerabilities: VulnerabilityFinding[];
  scannedFiles: number;
  linesOfCode: number;
  duration: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

/**
 * BoostSecurity MCP Server Adapter
 */
export class BoostSecurityAdapter extends BaseServerAdapter {
  private apiKey: string | undefined;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<BoostSecurityAdapterConfig>
  ) {
    super(clientManager, config);
    this.apiKey = config?.apiKey || process.env.BOOST_API_KEY;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'boostsecurity';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'boostsecurity',
      name: 'BoostSecurity Server',
      description: 'SAST and security scanning',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic/boostsecurity-mcp-server'],
      category: 'security',
      enabled: true,
      tags: ['security', 'sast', 'scanning'],
      env: this.apiKey ? { BOOST_API_KEY: this.apiKey } : undefined,
    };
  }

  /**
   * Run SAST scan on a file
   */
  async scanFile(filePath: string): Promise<SASTResult> {
    const response = await this.callTool('sast_scan_file', { file_path: filePath });
    
    if (!response.success) {
      throw new Error(`Failed to scan file: ${response.error?.message}`);
    }

    return response.result as SASTResult;
  }

  /**
   * Run SAST scan on a directory
   */
  async scanDirectory(
    directoryPath: string,
    options?: {
      recursive?: boolean;
      languages?: string[];
      excludePatterns?: string[];
    }
  ): Promise<SASTResult> {
    const response = await this.callTool('sast_scan_directory', {
      directory_path: directoryPath,
      recursive: options?.recursive ?? true,
      languages: options?.languages,
      exclude_patterns: options?.excludePatterns || [],
    });
    
    if (!response.success) {
      throw new Error(`Failed to scan directory: ${response.error?.message}`);
    }

    return response.result as SASTResult;
  }

  /**
   * Scan code content for vulnerabilities
   */
  async scanContent(
    content: string,
    language: string,
    filename?: string
  ): Promise<SASTResult> {
    const response = await this.callTool('sast_scan_content', {
      content,
      language,
      filename: filename || `code.${language}`,
    });
    
    if (!response.success) {
      throw new Error(`Failed to scan content: ${response.error?.message}`);
    }

    return response.result as SASTResult;
  }

  /**
   * Get remediation suggestions for a finding
   */
  async getRemediation(finding: VulnerabilityFinding): Promise<string> {
    const response = await this.callTool('get_remediation', {
      rule: finding.rule,
      cwe_id: finding.cweId,
      vulnerability_type: finding.type,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get remediation: ${response.error?.message}`);
    }

    return response.result as string;
  }

  /**
   * Check if code has critical vulnerabilities
   */
  async hasCriticalVulnerabilities(content: string, language: string): Promise<boolean> {
    const result = await this.scanContent(content, language);
    return result.summary.critical > 0;
  }

  /**
   * Filter findings by severity threshold
   */
  filterBySeverity(
    findings: VulnerabilityFinding[],
    minSeverity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  ): VulnerabilityFinding[] {
    const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
    const minIndex = severityOrder.indexOf(minSeverity);
    
    return findings.filter(f => severityOrder.indexOf(f.severity) >= minIndex);
  }
}

/**
 * Create a BoostSecurity adapter
 */
export function createBoostSecurityAdapter(
  clientManager: MCPClientManager,
  config?: Partial<BoostSecurityAdapterConfig>
): BoostSecurityAdapter {
  return new BoostSecurityAdapter(clientManager, config);
}
