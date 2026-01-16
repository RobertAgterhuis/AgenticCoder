/**
 * SafeDep MCP Server Adapter
 * 
 * Provides dependency vulnerability analysis via MCP
 * @module mcp/servers/security/SafeDepAdapter
 */

import { BaseServerAdapter, ServerAdapterConfig } from '../BaseServerAdapter';
import { MCPClientManager } from '../../core/MCPClientManager';
import { MCPServerDefinition } from '../../types';

/**
 * SafeDep adapter configuration
 */
export interface SafeDepAdapterConfig extends ServerAdapterConfig {
  apiKey?: string;
}

/**
 * Dependency vulnerability
 */
export interface DependencyVulnerability {
  id: string;
  package: string;
  version: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cveId?: string;
  description: string;
  fixedVersion?: string;
  exploitAvailable: boolean;
  patchAvailable: boolean;
}

/**
 * Dependency information
 */
export interface DependencyInfo {
  name: string;
  version: string;
  license: string;
  direct: boolean;
  vulnerabilities: DependencyVulnerability[];
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysisResult {
  success: boolean;
  dependencies: DependencyInfo[];
  vulnerabilities: DependencyVulnerability[];
  summary: {
    totalDependencies: number;
    directDependencies: number;
    transitiveDependencies: number;
    vulnerableDependencies: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

/**
 * SafeDep MCP Server Adapter
 */
export class SafeDepAdapter extends BaseServerAdapter {
  private apiKey: string | undefined;

  constructor(
    clientManager: MCPClientManager,
    config?: Partial<SafeDepAdapterConfig>
  ) {
    super(clientManager, config);
    this.apiKey = config?.apiKey || process.env.SAFEDEP_API_KEY;
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return 'safedep';
  }

  /**
   * Get server definition
   */
  getDefinition(): MCPServerDefinition {
    return {
      id: 'safedep',
      name: 'SafeDep Server',
      description: 'Dependency vulnerability analysis',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@anthropic/safedep-mcp-server'],
      category: 'security',
      enabled: true,
      tags: ['security', 'dependencies', 'vulnerabilities'],
      env: this.apiKey ? { SAFEDEP_API_KEY: this.apiKey } : undefined,
    };
  }

  /**
   * Analyze dependencies in a project
   */
  async analyzeDependencies(projectPath: string): Promise<DependencyAnalysisResult> {
    const response = await this.callTool('analyze_dependencies', {
      project_path: projectPath,
    });
    
    if (!response.success) {
      throw new Error(`Failed to analyze dependencies: ${response.error?.message}`);
    }

    return response.result as DependencyAnalysisResult;
  }

  /**
   * Analyze a specific package file
   */
  async analyzePackageFile(
    filePath: string,
    packageManager: 'npm' | 'pip' | 'maven' | 'gradle' | 'cargo' | 'go'
  ): Promise<DependencyAnalysisResult> {
    const response = await this.callTool('analyze_package_file', {
      file_path: filePath,
      package_manager: packageManager,
    });
    
    if (!response.success) {
      throw new Error(`Failed to analyze package file: ${response.error?.message}`);
    }

    return response.result as DependencyAnalysisResult;
  }

  /**
   * Check a specific dependency for vulnerabilities
   */
  async checkDependency(
    packageName: string,
    version: string,
    ecosystem: 'npm' | 'pypi' | 'maven' | 'crates' | 'go'
  ): Promise<DependencyInfo> {
    const response = await this.callTool('check_dependency', {
      package_name: packageName,
      version,
      ecosystem,
    });
    
    if (!response.success) {
      throw new Error(`Failed to check dependency: ${response.error?.message}`);
    }

    return response.result as DependencyInfo;
  }

  /**
   * Get remediation advice for a vulnerability
   */
  async getRemediationAdvice(vulnerabilityId: string): Promise<{
    description: string;
    fixedVersions: string[];
    workarounds: string[];
    references: string[];
  }> {
    const response = await this.callTool('get_remediation', {
      vulnerability_id: vulnerabilityId,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get remediation advice: ${response.error?.message}`);
    }

    return response.result as {
      description: string;
      fixedVersions: string[];
      workarounds: string[];
      references: string[];
    };
  }

  /**
   * Generate SBOM (Software Bill of Materials)
   */
  async generateSBOM(
    projectPath: string,
    format: 'cyclonedx' | 'spdx' = 'cyclonedx'
  ): Promise<string> {
    const response = await this.callTool('generate_sbom', {
      project_path: projectPath,
      format,
    });
    
    if (!response.success) {
      throw new Error(`Failed to generate SBOM: ${response.error?.message}`);
    }

    return response.result as string;
  }

  /**
   * Check if project has critical vulnerabilities
   */
  async hasCriticalVulnerabilities(projectPath: string): Promise<boolean> {
    const result = await this.analyzeDependencies(projectPath);
    return result.summary.critical > 0;
  }

  /**
   * Get upgrade recommendations
   */
  async getUpgradeRecommendations(projectPath: string): Promise<Array<{
    package: string;
    currentVersion: string;
    recommendedVersion: string;
    reason: string;
  }>> {
    const response = await this.callTool('get_upgrade_recommendations', {
      project_path: projectPath,
    });
    
    if (!response.success) {
      throw new Error(`Failed to get recommendations: ${response.error?.message}`);
    }

    return response.result as Array<{
      package: string;
      currentVersion: string;
      recommendedVersion: string;
      reason: string;
    }>;
  }
}

/**
 * Create a SafeDep adapter
 */
export function createSafeDepAdapter(
  clientManager: MCPClientManager,
  config?: Partial<SafeDepAdapterConfig>
): SafeDepAdapter {
  return new SafeDepAdapter(clientManager, config);
}
