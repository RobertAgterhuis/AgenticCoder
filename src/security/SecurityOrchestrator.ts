/**
 * SecurityOrchestrator - Central security coordination
 * @module security/SecurityOrchestrator
 * 
 * Coordinates all security components:
 * - Secrets Management
 * - Security Scanning
 * - Audit Logging  
 * - Compliance Checking
 */

import { EventEmitter } from 'events';
import { SecretsManager, createSecretsManager } from './secrets';
import { SecurityScanner } from './scanning';
import { AuditLogger } from './audit/AuditLogger';
import { ComplianceChecker, ComplianceResult, ComplianceStandard } from './compliance/ComplianceChecker';

/** Result from checkFiles method */
export interface ComplianceCheckFilesResult {
  summary: { standard: string; passed: boolean; avgScore: number }[];
  details: Array<{ file: string; results: ComplianceResult[] }>;
  overallPassed: boolean;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Enable/disable all security features */
  enabled: boolean;
  
  /** Secrets manager configuration */
  secretsManager?: {
    providers: ('azure-keyvault' | 'local' | 'environment')[];
    keyVaultUrl?: string;
    localStorePath?: string;
    cacheEnabled?: boolean;
    cacheTtl?: number;
  };
  
  /** Security scanning configuration */
  scanning?: {
    enabled: boolean;
    failOnSeverity?: 'low' | 'medium' | 'high' | 'critical';
    excludePaths?: string[];
  };
  
  /** Audit logging configuration */
  audit?: {
    enabled: boolean;
    logPath?: string;
    hashChain?: boolean;
  };
  
  /** Compliance checking configuration */
  compliance?: {
    enabled: boolean;
    standards?: ComplianceStandard[];
  };
}

/**
 * Security check result
 */
export interface SecurityCheckResult {
  /** Timestamp of the check */
  timestamp: Date;
  /** Duration in milliseconds */
  duration: number;
  /** Overall pass/fail */
  passed: boolean;
  
  /** Scan results */
  scan?: {
    totalVulnerabilities: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    passed: boolean;
  };
  
  /** Compliance results */
  compliance?: ComplianceCheckFilesResult;
  
  /** Errors encountered */
  errors: string[];
}

/**
 * SecurityOrchestrator - Coordinates all security components
 * 
 * @example
 * ```typescript
 * const orchestrator = createSecurityOrchestrator({
 *   enabled: true,
 *   scanning: { enabled: true, failOnSeverity: 'high' },
 *   audit: { enabled: true, logPath: '.agentic/audit' },
 * });
 * 
 * await orchestrator.initialize();
 * const result = await orchestrator.runSecurityCheck(files);
 * ```
 */
export class SecurityOrchestrator extends EventEmitter {
  private config: SecurityConfig;
  private secretsManager: SecretsManager | null = null;
  private scanner: SecurityScanner | null = null;
  private auditLogger: AuditLogger | null = null;
  private complianceChecker: ComplianceChecker | null = null;
  private initialized = false;

  constructor(config: SecurityConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize all enabled security components
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.config.enabled) {
      this.emit('disabled');
      return;
    }

    // Initialize secrets manager
    if (this.config.secretsManager) {
      this.secretsManager = createSecretsManager({
        keyVaultUrl: this.config.secretsManager.keyVaultUrl,
        localStorePath: this.config.secretsManager.localStorePath,
      });
      this.emit('component:initialized', 'secretsManager');
    }

    // Initialize scanner
    if (this.config.scanning?.enabled) {
      this.scanner = new SecurityScanner();
      this.emit('component:initialized', 'scanner');
    }

    // Initialize audit logger
    if (this.config.audit?.enabled) {
      this.auditLogger = new AuditLogger(
        this.config.audit.logPath || '.agentic/audit'
      );
      this.emit('component:initialized', 'auditLogger');
    }

    // Initialize compliance checker
    if (this.config.compliance?.enabled) {
      this.complianceChecker = new ComplianceChecker();
      this.emit('component:initialized', 'complianceChecker');
    }

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Get secrets manager (throws if not configured)
   */
  getSecretsManager(): SecretsManager {
    if (!this.secretsManager) {
      throw new Error('SecretsManager not configured or initialized');
    }
    return this.secretsManager;
  }

  /**
   * Get audit logger (throws if not configured)
   */
  getAuditLogger(): AuditLogger {
    if (!this.auditLogger) {
      throw new Error('AuditLogger not configured or initialized');
    }
    return this.auditLogger;
  }

  /**
   * Get scanner (throws if not configured)
   */
  getScanner(): SecurityScanner {
    if (!this.scanner) {
      throw new Error('SecurityScanner not configured or initialized');
    }
    return this.scanner;
  }

  /**
   * Get compliance checker (throws if not configured)
   */
  getComplianceChecker(): ComplianceChecker {
    if (!this.complianceChecker) {
      throw new Error('ComplianceChecker not configured or initialized');
    }
    return this.complianceChecker;
  }

  /**
   * Run comprehensive security check
   */
  async runSecurityCheck(
    files: Array<{ name: string; content: string }>,
    options?: {
      skipScan?: boolean;
      skipCompliance?: boolean;
    }
  ): Promise<SecurityCheckResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let scanResult: SecurityCheckResult['scan'] | undefined;
    let complianceResult: ComplianceCheckFilesResult | undefined;

    // Run security scan
    if (this.scanner && !options?.skipScan) {
      try {
        const result = await this.scanner.scanAll(files);
        
        scanResult = {
          totalVulnerabilities: result.summary.totalVulnerabilities,
          critical: 0, // Would need to aggregate from scan results
          high: 0,
          medium: 0,
          low: 0,
          passed: result.summary.passed,
        };

        // Log scan to audit
        if (this.auditLogger) {
          await this.auditLogger.logSecurityScan(
            `batch:${files.length}`,
            'full',
            result.summary.totalVulnerabilities,
            result.summary.passed
          );
        }

        this.emit('scan:complete', scanResult);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown scan error';
        errors.push(`Scan failed: ${message}`);
        this.emit('scan:error', error);
      }
    }

    // Run compliance check
    if (this.complianceChecker && !options?.skipCompliance) {
      try {
        const checkResult = this.complianceChecker.checkFiles(
          files,
          this.config.compliance?.standards
        );
        
        // Add overallPassed to result
        complianceResult = {
          ...checkResult,
          overallPassed: checkResult.summary.every(s => s.passed),
        };

        // Log compliance to audit
        if (this.auditLogger) {
          await this.auditLogger.log({
            eventType: 'compliance_check',
            actor: { type: 'system', id: 'security-orchestrator' },
            action: 'compliance_check',
            resource: `files:${files.length}`,
            details: { filesChecked: files.length },
            result: complianceResult.overallPassed ? 'success' : 'failure',
          });
        }

        this.emit('compliance:complete', complianceResult);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown compliance error';
        errors.push(`Compliance check failed: ${message}`);
        this.emit('compliance:error', error);
      }
    }

    const duration = Date.now() - startTime;
    const passed = 
      (scanResult?.passed ?? true) && 
      (complianceResult?.overallPassed ?? true) &&
      errors.length === 0;

    const result: SecurityCheckResult = {
      timestamp: new Date(),
      duration,
      passed,
      scan: scanResult,
      compliance: complianceResult,
      errors,
    };

    this.emit('check:complete', result);
    return result;
  }

  /**
   * Get a secret value
   */
  async getSecret(name: string): Promise<string | null> {
    if (!this.secretsManager) return null;
    
    const secret = await this.secretsManager.getSecret(name);
    
    if (secret && this.auditLogger) {
      await this.auditLogger.logSecretAccess('orchestrator', name, 'read');
    }
    
    return secret?.value || null;
  }

  /**
   * Check if orchestrator is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (requires re-initialization)
   */
  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.initialized = false;
    this.emit('config:updated', this.config);
  }

  /**
   * Shutdown all components
   */
  async shutdown(): Promise<void> {
    // Cleanup if needed
    this.initialized = false;
    this.secretsManager = null;
    this.scanner = null;
    this.auditLogger = null;
    this.complianceChecker = null;
    this.emit('shutdown');
  }
}

/**
 * Create security orchestrator with config
 */
export function createSecurityOrchestrator(config: SecurityConfig): SecurityOrchestrator {
  return new SecurityOrchestrator(config);
}

/**
 * Create default security config
 */
export function createDefaultSecurityConfig(): SecurityConfig {
  return {
    enabled: true,
    secretsManager: {
      providers: ['environment', 'local'],
      cacheEnabled: true,
      cacheTtl: 300,
    },
    scanning: {
      enabled: true,
      failOnSeverity: 'high',
      excludePaths: ['**/node_modules/**', '**/dist/**'],
    },
    audit: {
      enabled: true,
      logPath: '.agentic/audit',
      hashChain: true,
    },
    compliance: {
      enabled: true,
      standards: ['OWASP'],
    },
  };
}
