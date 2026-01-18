/**
 * Security & Compliance Module
 * @module security
 * 
 * Provides comprehensive security features:
 * - Secrets Management (Key Vault, local encrypted, environment)
 * - Security Scanning (code, dependencies, infrastructure)
 * - Audit Logging (immutable, chain-linked)
 * - Compliance Checking (OWASP, GDPR, PCI-DSS)
 * - Security Orchestration (central coordination)
 * - Code Generation Integration (security hooks)
 */

// Security Orchestrator
export {
  SecurityOrchestrator,
  SecurityConfig,
  SecurityCheckResult,
  ComplianceCheckFilesResult,
  createSecurityOrchestrator,
  createDefaultSecurityConfig,
} from './SecurityOrchestrator';

// Code Generation Integration
export {
  CodeGenHooks,
  SecurityGateDecision,
  createCodeGenHooks,
} from './integration';

// MCP Security Bridge
export {
  MCPSecurityBridge,
  MCPSecurityBridgeConfig,
  SecretScanResult,
  NormalizedCodeScanResult,
  NormalizedDepScanResult,
  FullScanResult,
  createMCPSecurityBridge,
} from './integration';

// Secrets Management
export {
  SecretsManager,
  SecretsProvider,
  Secret,
  SecretMetadata,
  SecretsProviderOptions,
  AzureKeyVaultProvider,
  AzureKeyVaultConfig,
  LocalSecretsProvider,
  LocalSecretsConfig,
  EnvironmentProvider,
  EnvironmentProviderConfig,
  SecretDetector,
  DetectionResult,
  SecretMatch,
  SecretPattern,
  createSecretsManager,
} from './secrets';

// Security Scanning
export {
  SecurityScanner,
  CodeSecurityScanner,
  ScanResult,
  Vulnerability,
  VulnerabilityType,
  SecurityReport,
  DependencyScanner,
  DependencyVulnerability,
  DependencyScanResult,
  InfraScanner,
  InfraVulnerability,
  InfraScanResult,
} from './scanning';

// Audit Logging
export {
  AuditLogger,
  AuditEvent,
  AuditEventType,
  AuditActor,
  SecurityContext,
  AuditQuery,
} from './audit/AuditLogger';

// Compliance
export {
  ComplianceChecker,
  ComplianceResult,
  ComplianceCheck,
  ComplianceStandard,
} from './compliance/ComplianceChecker';

// Re-export for convenience
import { SecretsManager } from './secrets';
import { SecurityScanner } from './scanning';
import { AuditLogger } from './audit/AuditLogger';
import { ComplianceChecker } from './compliance/ComplianceChecker';
import { createSecretsManager } from './secrets';

/**
 * SecurityGateway - Unified security interface
 * All security operations should go through this gateway
 */
export class SecurityGateway {
  public readonly secrets: SecretsManager;
  public readonly scanner: SecurityScanner;
  public readonly audit: AuditLogger;
  public readonly compliance: ComplianceChecker;

  constructor(options: {
    keyVaultUrl?: string;
    localSecretsPath?: string;
    auditLogPath: string;
  }) {
    this.secrets = createSecretsManager({
      keyVaultUrl: options.keyVaultUrl,
      localStorePath: options.localSecretsPath,
    });
    this.scanner = new SecurityScanner();
    this.audit = new AuditLogger(options.auditLogPath);
    this.compliance = new ComplianceChecker();
  }

  /**
   * Scan generated files for security issues
   */
  async scanGeneratedCode(files: Array<{ name: string; content: string }>) {
    const results = await this.scanner.scanAll(files);
    
    // Log the scan
    await this.audit.logSecurityScan(
      `batch:${files.length} files`,
      'full',
      results.summary.totalVulnerabilities,
      results.summary.passed
    );

    return results;
  }

  /**
   * Check compliance for generated code
   */
  async checkCompliance(files: Array<{ name: string; content: string }>, standards?: string[]) {
    const results = this.compliance.checkFiles(
      files,
      standards as any
    );

    // Log compliance check
    for (const summary of results.summary) {
      await this.audit.log({
        eventType: 'compliance_check',
        actor: { type: 'system', id: 'compliance-checker' },
        action: 'check_compliance',
        resource: summary.standard,
        details: { avgScore: summary.avgScore, passed: summary.passed },
        securityContext: { complianceChecks: [summary.standard] },
        result: summary.passed ? 'success' : 'failure',
      });
    }

    return results;
  }

  /**
   * Get a secret securely
   */
  async getSecret(name: string): Promise<string | null> {
    const secret = await this.secrets.getSecret(name);
    
    if (secret) {
      await this.audit.logSecretAccess('security-gateway', name, 'read');
    }

    return secret?.value || null;
  }

  /**
   * Validate code before generation
   */
  async validateBeforeGeneration(content: string, filename: string): Promise<{
    allowed: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check for secrets
    const secretDetector = new (await import('./secrets')).SecretDetector();
    const secretResult = secretDetector.detect(content);
    if (secretResult.found) {
      issues.push(`Found ${secretResult.matches.length} potential secrets`);
      
      await this.audit.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'secret-detector' },
        action: 'detect_secrets',
        resource: filename,
        details: { matches: secretResult.matches.length, severity: secretResult.severity },
        securityContext: { scanResult: 'blocked' },
        result: 'blocked',
      });
    }

    // Quick security scan
    const scanResult = this.scanner.code.scan(content, filename);
    const criticalVulns = scanResult.vulnerabilities.filter(v => v.severity === 'critical');
    
    if (criticalVulns.length > 0) {
      issues.push(`Found ${criticalVulns.length} critical vulnerabilities`);
    }

    const allowed = secretResult.severity !== 'critical' && criticalVulns.length === 0;

    return { allowed, issues };
  }
}

export default SecurityGateway;
