/**
 * MCP Security Integration Bridge
 * @module security/integration/MCPIntegration
 * 
 * Bridges local security scanning with MCP security servers:
 * - GitGuardian for secret detection
 * - BoostSecurity for SAST
 * - SafeDep for dependency scanning
 * 
 * Falls back to local scanning when MCP servers are unavailable.
 */

import { SecretDetector, DetectionResult } from '../secrets/detection/SecretDetector';
import { CodeSecurityScanner, ScanResult as CodeScanResult } from '../scanning/CodeSecurityScanner';
import { DependencyScanner, DependencyScanResult } from '../scanning/DependencyScanner';

/**
 * Bridge configuration
 */
export interface MCPSecurityBridgeConfig {
  /** Prefer MCP servers over local scanning */
  preferMCP: boolean;
  /** Fall back to local scanning when MCP unavailable */
  fallbackToLocal: boolean;
  /** Timeout for MCP operations in milliseconds */
  mcpTimeout: number;
  /** Enable parallel scanning */
  enableParallelScans: boolean;
  /** GitGuardian API key (optional, can use env vars) */
  gitGuardianApiKey?: string;
  /** BoostSecurity token (optional) */
  boostSecurityToken?: string;
}

/**
 * Normalized secret scan result
 */
export interface SecretScanResult {
  source: 'mcp-gitguardian' | 'local';
  found: boolean;
  secrets: Array<{
    type: string;
    file: string;
    line: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  duration: number;
}

/**
 * Normalized code scan result
 */
export interface NormalizedCodeScanResult {
  source: 'mcp-boostsecurity' | 'local';
  vulnerabilities: Array<{
    type: string;
    file: string;
    line: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    cwe?: string;
  }>;
  duration: number;
}

/**
 * Normalized dependency scan result
 */
export interface NormalizedDepScanResult {
  source: 'mcp-safedep' | 'local';
  vulnerabilities: Array<{
    package: string;
    version: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cve?: string;
    fixedIn?: string;
  }>;
  duration: number;
}

/**
 * Full scan result combining all scan types
 */
export interface FullScanResult {
  secrets: SecretScanResult;
  code: NormalizedCodeScanResult;
  dependencies: NormalizedDepScanResult;
  totalDuration: number;
  passed: boolean;
}

const DEFAULT_CONFIG: MCPSecurityBridgeConfig = {
  preferMCP: true,
  fallbackToLocal: true,
  mcpTimeout: 30000, // 30 seconds
  enableParallelScans: true,
};

/**
 * MCP Security Bridge
 * 
 * Provides unified security scanning using MCP servers when available,
 * with fallback to local scanning.
 * 
 * @example
 * ```typescript
 * const bridge = createMCPSecurityBridge({ preferMCP: true });
 * 
 * // Check server availability
 * const hasGitGuardian = await bridge.isGitGuardianAvailable();
 * 
 * // Scan for secrets
 * const secretResult = await bridge.scanForSecrets(code, 'app.ts');
 * 
 * // Full security scan
 * const fullResult = await bridge.fullSecurityScan(files);
 * ```
 */
export class MCPSecurityBridge {
  private config: MCPSecurityBridgeConfig;
  
  // Local scanners
  private localSecretDetector: SecretDetector;
  private localCodeScanner: CodeSecurityScanner;
  private localDepScanner: DependencyScanner;
  
  // MCP adapter availability cache
  private mcpAvailability: Map<string, { available: boolean; checkedAt: number }> = new Map();
  private readonly AVAILABILITY_TTL = 60000; // 1 minute

  constructor(config?: Partial<MCPSecurityBridgeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize local scanners
    this.localSecretDetector = new SecretDetector();
    this.localCodeScanner = new CodeSecurityScanner();
    this.localDepScanner = new DependencyScanner();
  }

  /**
   * Configure the bridge
   */
  configure(options: Partial<MCPSecurityBridgeConfig>): void {
    this.config = { ...this.config, ...options };
  }

  /**
   * Get current configuration
   */
  getConfig(): MCPSecurityBridgeConfig {
    return { ...this.config };
  }

  /**
   * Check if GitGuardian MCP server is available
   */
  async isGitGuardianAvailable(): Promise<boolean> {
    return this.checkMCPAvailability('gitguardian', async () => {
      // Check if API key is configured
      const apiKey = this.config.gitGuardianApiKey || process.env.GITGUARDIAN_API_KEY;
      if (!apiKey) return false;
      
      // In real implementation, would check MCP server health
      // For now, return false as MCP infrastructure isn't fully set up
      return false;
    });
  }

  /**
   * Check if BoostSecurity MCP server is available
   */
  async isBoostSecurityAvailable(): Promise<boolean> {
    return this.checkMCPAvailability('boostsecurity', async () => {
      const token = this.config.boostSecurityToken || process.env.BOOSTSECURITY_TOKEN;
      if (!token) return false;
      return false;
    });
  }

  /**
   * Check if SafeDep MCP server is available
   */
  async isSafeDepAvailable(): Promise<boolean> {
    return this.checkMCPAvailability('safedep', async () => {
      // SafeDep may work without API key for basic scanning
      return false;
    });
  }

  /**
   * Scan content for secrets
   */
  async scanForSecrets(content: string, filename = 'content.txt'): Promise<SecretScanResult> {
    const startTime = Date.now();

    // Try MCP first if preferred
    if (this.config.preferMCP && await this.isGitGuardianAvailable()) {
      try {
        const mcpResult = await this.scanSecretsViaMCP(content, filename);
        return {
          source: 'mcp-gitguardian',
          ...mcpResult,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        if (!this.config.fallbackToLocal) {
          throw error;
        }
        // Fall through to local
      }
    }

    // Use local scanner
    const localResult = this.localSecretDetector.detect(content);
    return this.normalizeLocalSecretResult(localResult, filename, Date.now() - startTime);
  }

  /**
   * Scan code for vulnerabilities
   */
  async scanCode(content: string, filename: string): Promise<NormalizedCodeScanResult> {
    const startTime = Date.now();

    // Try MCP first if preferred
    if (this.config.preferMCP && await this.isBoostSecurityAvailable()) {
      try {
        return await this.scanCodeViaMCP(content, filename);
      } catch (error) {
        if (!this.config.fallbackToLocal) {
          throw error;
        }
        // Fall through to local
      }
    }

    // Use local scanner
    const localResult = this.localCodeScanner.scan(content, filename);
    return this.normalizeLocalCodeResult(localResult, Date.now() - startTime);
  }

  /**
   * Scan dependencies for vulnerabilities
   */
  async scanDependencies(packageJson: string, filename = 'package.json'): Promise<NormalizedDepScanResult> {
    const startTime = Date.now();

    // Try MCP first if preferred
    if (this.config.preferMCP && await this.isSafeDepAvailable()) {
      try {
        return await this.scanDepsViaMCP(packageJson, filename);
      } catch (error) {
        if (!this.config.fallbackToLocal) {
          throw error;
        }
        // Fall through to local
      }
    }

    // Use local scanner
    const localResult = await this.localDepScanner.scan(packageJson, filename);
    return this.normalizeLocalDepResult(localResult, Date.now() - startTime);
  }

  /**
   * Run full security scan on files
   */
  async fullSecurityScan(files: Array<{ name: string; content: string }>): Promise<FullScanResult> {
    const startTime = Date.now();

    const codeFiles = files.filter(f => /\.(js|jsx|ts|tsx|py|cs|go|java)$/.test(f.name));
    const packageFiles = files.filter(f => f.name === 'package.json' || f.name.endsWith('/package.json'));

    // Run scans (parallel if enabled)
    let secretResults: SecretScanResult[];
    let codeResults: NormalizedCodeScanResult[];
    let depResults: NormalizedDepScanResult[];

    if (this.config.enableParallelScans) {
      [secretResults, codeResults, depResults] = await Promise.all([
        Promise.all(files.map(f => this.scanForSecrets(f.content, f.name))),
        Promise.all(codeFiles.map(f => this.scanCode(f.content, f.name))),
        Promise.all(packageFiles.map(f => this.scanDependencies(f.content, f.name))),
      ]);
    } else {
      secretResults = [];
      codeResults = [];
      depResults = [];
      
      for (const f of files) {
        secretResults.push(await this.scanForSecrets(f.content, f.name));
      }
      for (const f of codeFiles) {
        codeResults.push(await this.scanCode(f.content, f.name));
      }
      for (const f of packageFiles) {
        depResults.push(await this.scanDependencies(f.content, f.name));
      }
    }

    // Aggregate results
    const aggregatedSecrets = this.aggregateSecretResults(secretResults);
    const aggregatedCode = this.aggregateCodeResults(codeResults);
    const aggregatedDeps = this.aggregateDepResults(depResults);

    const totalDuration = Date.now() - startTime;
    const passed = !aggregatedSecrets.found && 
                   aggregatedCode.vulnerabilities.length === 0 &&
                   aggregatedDeps.vulnerabilities.length === 0;

    return {
      secrets: aggregatedSecrets,
      code: aggregatedCode,
      dependencies: aggregatedDeps,
      totalDuration,
      passed,
    };
  }

  /**
   * Clear MCP availability cache
   */
  clearCache(): void {
    this.mcpAvailability.clear();
  }

  // Private helper methods

  private async checkMCPAvailability(
    server: string, 
    checkFn: () => Promise<boolean>
  ): Promise<boolean> {
    const cached = this.mcpAvailability.get(server);
    if (cached && (Date.now() - cached.checkedAt) < this.AVAILABILITY_TTL) {
      return cached.available;
    }

    const available = await checkFn();
    this.mcpAvailability.set(server, { available, checkedAt: Date.now() });
    return available;
  }

  private async scanSecretsViaMCP(
    _content: string, 
    _filename: string
  ): Promise<{ found: boolean; secrets: SecretScanResult['secrets'] }> {
    // Would call GitGuardian adapter via MCPClientManager
    // Example: const adapter = new GitGuardianAdapter(mcpClientManager);
    // const result = await adapter.scanContent(content, filename);
    // For now, return empty (MCP not fully implemented)
    return { found: false, secrets: [] };
  }

  private async scanCodeViaMCP(
    _content: string, 
    _filename: string
  ): Promise<NormalizedCodeScanResult> {
    // Would call BoostSecurity adapter
    return { source: 'mcp-boostsecurity', vulnerabilities: [], duration: 0 };
  }

  private async scanDepsViaMCP(
    _packageJson: string, 
    _filename: string
  ): Promise<NormalizedDepScanResult> {
    // Would call SafeDep adapter
    return { source: 'mcp-safedep', vulnerabilities: [], duration: 0 };
  }

  private normalizeLocalSecretResult(
    result: DetectionResult, 
    filename: string,
    duration: number
  ): SecretScanResult {
    return {
      source: 'local',
      found: result.found,
      secrets: result.matches.map(m => ({
        type: m.type,
        file: filename,
        line: m.line,
        severity: m.severity,
      })),
      duration,
    };
  }

  private normalizeLocalCodeResult(
    result: CodeScanResult,
    duration: number
  ): NormalizedCodeScanResult {
    return {
      source: 'local',
      vulnerabilities: result.vulnerabilities.map(v => ({
        type: v.type,
        file: result.file,
        line: v.line ?? 0,
        severity: v.severity === 'info' ? 'low' : v.severity,
        message: v.title || v.description,
        cwe: v.cwe,
      })),
      duration,
    };
  }

  private normalizeLocalDepResult(
    result: DependencyScanResult,
    duration: number
  ): NormalizedDepScanResult {
    return {
      source: 'local',
      vulnerabilities: result.vulnerabilities.map(v => ({
        package: v.package,
        version: v.version,
        severity: v.severity,
        cve: v.cve,
        fixedIn: v.fixedIn,
      })),
      duration,
    };
  }

  private aggregateSecretResults(results: SecretScanResult[]): SecretScanResult {
    const allSecrets = results.flatMap(r => r.secrets);
    const source = results.some(r => r.source === 'mcp-gitguardian') ? 'mcp-gitguardian' : 'local';
    return {
      source,
      found: allSecrets.length > 0,
      secrets: allSecrets,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
    };
  }

  private aggregateCodeResults(results: NormalizedCodeScanResult[]): NormalizedCodeScanResult {
    const allVulns = results.flatMap(r => r.vulnerabilities);
    const source = results.some(r => r.source === 'mcp-boostsecurity') ? 'mcp-boostsecurity' : 'local';
    return {
      source,
      vulnerabilities: allVulns,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
    };
  }

  private aggregateDepResults(results: NormalizedDepScanResult[]): NormalizedDepScanResult {
    const allVulns = results.flatMap(r => r.vulnerabilities);
    const source = results.some(r => r.source === 'mcp-safedep') ? 'mcp-safedep' : 'local';
    return {
      source,
      vulnerabilities: allVulns,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
    };
  }
}

/**
 * Create MCP security bridge with optional configuration
 */
export function createMCPSecurityBridge(
  config?: Partial<MCPSecurityBridgeConfig>
): MCPSecurityBridge {
  return new MCPSecurityBridge(config);
}

export default MCPSecurityBridge;
