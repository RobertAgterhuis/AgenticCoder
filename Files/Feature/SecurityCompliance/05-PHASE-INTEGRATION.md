# Phase 5: Integration & Testing

**Phase ID:** F-SEC-P05  
**Feature:** SecurityCompliance  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 4 (Compliance)

---

## 🎯 Phase Objectives

Deze phase integreert alle security componenten:
- Security orchestration layer
- Integration with code generation
- E2E security testing
- MCP server integration
- Performance optimization

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── security/
│   ├── index.ts
│   ├── SecurityOrchestrator.ts
│   ├── SecurityGateway.ts
│   └── integration/
│       ├── CodeGenIntegration.ts
│       ├── MCPIntegration.ts
│       └── PipelineHooks.ts
│
tests/
├── security/
│   ├── secrets.test.ts
│   ├── scanning.test.ts
│   ├── audit.test.ts
│   ├── compliance.test.ts
│   └── e2e/
│       └── security-pipeline.test.ts
```

---

## 🔧 Implementation Details

### 5.1 Security Orchestrator (`src/security/SecurityOrchestrator.ts`)

```typescript
import { EventEmitter } from 'events';
import { SecretsManager, createSecretsManager } from './secrets/SecretsManager';
import { SecurityScanner, createSecurityScanner, FullScanResult } from './scanning/SecurityScanner';
import { AuditLogger, createAuditLogger } from './audit/AuditLogger';
import { ComplianceChecker, createComplianceChecker, ComplianceReport } from './compliance/ComplianceChecker';
import { createFileAuditStorage } from './audit/storage/FileAuditStorage';

/**
 * Security configuration
 */
export interface SecurityConfig {
  enabled: boolean;
  secretsManager?: {
    providers: ('azure-key-vault' | 'local' | 'environment')[];
    cacheEnabled?: boolean;
    cacheTtl?: number;
  };
  scanning?: {
    enabled: boolean;
    failOnSeverity?: 'low' | 'medium' | 'high' | 'critical';
    excludePaths?: string[];
  };
  audit?: {
    enabled: boolean;
    directory?: string;
    hashChain?: boolean;
  };
  compliance?: {
    enabled: boolean;
    frameworks?: string[];
  };
  mcp?: {
    gitguardian?: boolean;
    boostsecurity?: boolean;
    safedep?: boolean;
  };
}

/**
 * Security check result
 */
export interface SecurityCheckResult {
  timestamp: Date;
  duration: number;
  passed: boolean;
  scan?: FullScanResult;
  compliance?: ComplianceReport;
  errors: string[];
}

/**
 * Security orchestrator - coordinates all security components
 */
export class SecurityOrchestrator extends EventEmitter {
  private config: SecurityConfig;
  private secretsManager: SecretsManager | null = null;
  private scanner: SecurityScanner | null = null;
  private auditLogger: AuditLogger | null = null;
  private complianceChecker: ComplianceChecker | null = null;
  private initialized: boolean = false;

  constructor(config: SecurityConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize secrets manager
    if (this.config.secretsManager) {
      this.secretsManager = createSecretsManager({
        cache: this.config.secretsManager.cacheEnabled,
        cacheTtl: this.config.secretsManager.cacheTtl,
      });
      
      // Register providers based on config
      // (Implementation would add providers here)
    }

    // Initialize scanner
    if (this.config.scanning?.enabled) {
      this.scanner = createSecurityScanner();
    }

    // Initialize audit logger
    if (this.config.audit?.enabled) {
      const storage = createFileAuditStorage({
        directory: this.config.audit.directory || '.agentic/audit',
      });
      await storage.initialize();
      
      this.auditLogger = createAuditLogger({
        storage,
        enableHashChain: this.config.audit.hashChain ?? true,
      });
    }

    // Initialize compliance checker
    if (this.config.compliance?.enabled) {
      this.complianceChecker = createComplianceChecker();
    }

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Get secrets manager
   */
  getSecretsManager(): SecretsManager {
    if (!this.secretsManager) {
      throw new Error('Secrets manager not initialized');
    }
    return this.secretsManager;
  }

  /**
   * Get audit logger
   */
  getAuditLogger(): AuditLogger {
    if (!this.auditLogger) {
      throw new Error('Audit logger not initialized');
    }
    return this.auditLogger;
  }

  /**
   * Run full security check
   */
  async runSecurityCheck(
    projectPath: string,
    options?: {
      skipScan?: boolean;
      skipCompliance?: boolean;
    }
  ): Promise<SecurityCheckResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let scanResult: FullScanResult | undefined;
    let complianceResult: ComplianceReport | undefined;

    // Run security scan
    if (this.scanner && !options?.skipScan) {
      try {
        scanResult = await this.scanner.scan(projectPath, {
          failOnSeverity: this.config.scanning?.failOnSeverity,
          excludePaths: this.config.scanning?.excludePaths,
        });

        // Log scan completion
        if (this.auditLogger) {
          await this.auditLogger.logScanCompleted(
            'security-scanner',
            'full',
            scanResult.passed,
            scanResult.summary.total
          );
        }
      } catch (error) {
        errors.push(`Scan failed: ${(error as Error).message}`);
      }
    }

    // Run compliance check
    if (this.complianceChecker && !options?.skipCompliance) {
      try {
        complianceResult = await this.complianceChecker.check({
          projectPath,
          configuration: this.config as unknown as Record<string, unknown>,
          generatedFiles: [],
          scanResults: scanResult as unknown as Record<string, unknown>,
        }, this.config.compliance?.frameworks);

        // Log compliance check
        if (this.auditLogger) {
          await this.auditLogger.logScanCompleted(
            'compliance-checker',
            'compliance',
            complianceResult.overallStatus === 'compliant',
            complianceResult.summary.total
          );
        }
      } catch (error) {
        errors.push(`Compliance check failed: ${(error as Error).message}`);
      }
    }

    const duration = Date.now() - startTime;
    const passed = 
      (scanResult?.passed ?? true) && 
      (complianceResult?.overallStatus !== 'non-compliant') &&
      errors.length === 0;

    return {
      timestamp: new Date(),
      duration,
      passed,
      scan: scanResult,
      compliance: complianceResult,
      errors,
    };
  }

  /**
   * Scan generated code
   */
  async scanGeneratedCode(
    files: Array<{ path: string; content: string }>
  ): Promise<FullScanResult | null> {
    if (!this.scanner) return null;

    // Create temporary context for scanning in-memory
    // In production, would write to temp directory
    const result = await this.scanner.scan(process.cwd(), {
      failOnSeverity: this.config.scanning?.failOnSeverity,
    });

    return result;
  }

  /**
   * Get secret (convenience method)
   */
  async getSecret(name: string): Promise<string | null> {
    if (!this.secretsManager) return null;
    return this.secretsManager.getValue(name);
  }

  /**
   * Require secret (throws if not found)
   */
  async requireSecret(name: string): Promise<string> {
    if (!this.secretsManager) {
      throw new Error('Secrets manager not initialized');
    }
    const value = await this.secretsManager.requireSecret(name);
    
    // Log secret access
    if (this.auditLogger) {
      await this.auditLogger.logSecretAccessed(
        name,
        'security-orchestrator',
        'execution'
      );
    }
    
    return value;
  }

  /**
   * Close all components
   */
  async close(): Promise<void> {
    if (this.auditLogger) {
      await this.auditLogger.close();
    }
    this.emit('closed');
  }
}

/**
 * Create security orchestrator
 */
export function createSecurityOrchestrator(
  config: SecurityConfig
): SecurityOrchestrator {
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
      directory: '.agentic/audit',
      hashChain: true,
    },
    compliance: {
      enabled: true,
      frameworks: ['owasp-top-10-2021'],
    },
  };
}
```

### 5.2 Security Gateway (`src/security/SecurityGateway.ts`)

```typescript
import { SecurityOrchestrator, SecurityCheckResult } from './SecurityOrchestrator';

/**
 * Security gate decision
 */
export interface SecurityGateDecision {
  allowed: boolean;
  reason?: string;
  warnings: string[];
  blockers: string[];
}

/**
 * Security gateway - enforces security policies
 */
export class SecurityGateway {
  private orchestrator: SecurityOrchestrator;
  private policyViolations: Map<string, number> = new Map();

  constructor(orchestrator: SecurityOrchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * Check if code generation should proceed
   */
  async checkCodeGeneration(
    template: string,
    variables: Record<string, unknown>
  ): Promise<SecurityGateDecision> {
    const warnings: string[] = [];
    const blockers: string[] = [];

    // Check for potential secrets in variables
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string' && this.looksLikeSecret(value)) {
        if (this.shouldBlock(key)) {
          blockers.push(`Potential secret in variable: ${key}`);
        } else {
          warnings.push(`Variable ${key} might contain sensitive data`);
        }
      }
    }

    return {
      allowed: blockers.length === 0,
      reason: blockers.length > 0 ? 'Security policy violation' : undefined,
      warnings,
      blockers,
    };
  }

  /**
   * Check generated file
   */
  async checkGeneratedFile(
    filePath: string,
    content: string
  ): Promise<SecurityGateDecision> {
    const warnings: string[] = [];
    const blockers: string[] = [];

    // Quick secret scan
    const secretPatterns = [
      { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, name: 'hardcoded password' },
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, name: 'API key' },
      { pattern: /-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g, name: 'private key' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub token' },
      { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS key' },
    ];

    for (const { pattern, name } of secretPatterns) {
      if (pattern.test(content)) {
        blockers.push(`Detected ${name} in generated file: ${filePath}`);
      }
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\(/g, name: 'eval()' },
      { pattern: /innerHTML\s*=/g, name: 'innerHTML assignment' },
      { pattern: /dangerouslySetInnerHTML/g, name: 'dangerouslySetInnerHTML' },
    ];

    for (const { pattern, name } of dangerousPatterns) {
      if (pattern.test(content)) {
        warnings.push(`Potentially dangerous pattern (${name}) in: ${filePath}`);
      }
    }

    return {
      allowed: blockers.length === 0,
      reason: blockers.length > 0 ? 'Security violations in generated code' : undefined,
      warnings,
      blockers,
    };
  }

  /**
   * Check deployment readiness
   */
  async checkDeploymentReadiness(
    securityCheckResult: SecurityCheckResult
  ): Promise<SecurityGateDecision> {
    const warnings: string[] = [];
    const blockers: string[] = [];

    // Check scan results
    if (securityCheckResult.scan) {
      if (securityCheckResult.scan.summary.critical > 0) {
        blockers.push(
          `${securityCheckResult.scan.summary.critical} critical vulnerabilities found`
        );
      }
      if (securityCheckResult.scan.summary.high > 0) {
        warnings.push(
          `${securityCheckResult.scan.summary.high} high severity issues found`
        );
      }
    }

    // Check compliance
    if (securityCheckResult.compliance) {
      if (securityCheckResult.compliance.overallStatus === 'non-compliant') {
        blockers.push('Project is non-compliant with security frameworks');
      }
      if (securityCheckResult.compliance.summary.failed > 0) {
        warnings.push(
          `${securityCheckResult.compliance.summary.failed} compliance checks failed`
        );
      }
    }

    // Check for errors
    if (securityCheckResult.errors.length > 0) {
      warnings.push(...securityCheckResult.errors);
    }

    return {
      allowed: blockers.length === 0,
      reason: blockers.length > 0 ? 'Security requirements not met for deployment' : undefined,
      warnings,
      blockers,
    };
  }

  /**
   * Record policy violation
   */
  recordViolation(policyId: string): void {
    const count = this.policyViolations.get(policyId) || 0;
    this.policyViolations.set(policyId, count + 1);
  }

  /**
   * Get violation count
   */
  getViolationCount(policyId: string): number {
    return this.policyViolations.get(policyId) || 0;
  }

  /**
   * Check if value looks like a secret
   */
  private looksLikeSecret(value: string): boolean {
    // Check length and entropy
    if (value.length < 8) return false;
    
    // Check for common secret patterns
    const secretPatterns = [
      /^[a-zA-Z0-9+/]{32,}={0,2}$/,  // Base64
      /^[a-f0-9]{32,}$/i,             // Hex
      /^[A-Za-z0-9_-]{20,}$/,         // API key format
    ];

    return secretPatterns.some(p => p.test(value));
  }

  /**
   * Check if variable should block generation
   */
  private shouldBlock(variableName: string): boolean {
    const sensitiveNames = [
      'password', 'secret', 'key', 'token', 'credential',
      'apiKey', 'api_key', 'privateKey', 'private_key',
    ];
    
    return sensitiveNames.some(name => 
      variableName.toLowerCase().includes(name.toLowerCase())
    );
  }
}

/**
 * Create security gateway
 */
export function createSecurityGateway(
  orchestrator: SecurityOrchestrator
): SecurityGateway {
  return new SecurityGateway(orchestrator);
}
```

### 5.3 Code Generation Integration (`src/security/integration/CodeGenIntegration.ts`)

```typescript
import { SecurityOrchestrator } from '../SecurityOrchestrator';
import { SecurityGateway, SecurityGateDecision } from '../SecurityGateway';

/**
 * Code generation hooks
 */
export interface CodeGenHooks {
  beforeGenerate: (template: string, variables: Record<string, unknown>) => Promise<SecurityGateDecision>;
  afterGenerate: (filePath: string, content: string) => Promise<SecurityGateDecision>;
  onComplete: (files: string[]) => Promise<void>;
}

/**
 * Create code generation security hooks
 */
export function createCodeGenHooks(
  orchestrator: SecurityOrchestrator
): CodeGenHooks {
  const gateway = new SecurityGateway(orchestrator);
  const auditLogger = orchestrator.getAuditLogger();

  return {
    /**
     * Before code generation
     */
    async beforeGenerate(
      template: string,
      variables: Record<string, unknown>
    ): Promise<SecurityGateDecision> {
      const decision = await gateway.checkCodeGeneration(template, variables);

      // Log the decision
      if (auditLogger) {
        if (!decision.allowed) {
          for (const blocker of decision.blockers) {
            await auditLogger.logPolicyViolation(
              'CODEGEN-001',
              'Code Generation Security',
              { template, blocker }
            );
          }
        }
      }

      return decision;
    },

    /**
     * After code generation
     */
    async afterGenerate(
      filePath: string,
      content: string
    ): Promise<SecurityGateDecision> {
      const decision = await gateway.checkGeneratedFile(filePath, content);

      // Log code generation
      if (auditLogger) {
        await auditLogger.logCodeGenerated(
          'code-generator',
          filePath,
          {
            passed: decision.allowed,
            warnings: decision.warnings.length,
            blockers: decision.blockers.length,
          }
        );

        // Log any violations
        for (const blocker of decision.blockers) {
          await auditLogger.logVulnerabilityFound({
            type: 'generated-code',
            severity: 'critical',
            title: 'Security violation in generated code',
            file: filePath,
          });
        }
      }

      return decision;
    },

    /**
     * On generation complete
     */
    async onComplete(files: string[]): Promise<void> {
      // Log completion
      if (auditLogger) {
        await auditLogger.logScanCompleted(
          'code-gen-security',
          'post-generation',
          true,
          files.length,
          { filesGenerated: files.length }
        );
      }
    },
  };
}
```

### 5.4 E2E Security Test (`tests/security/e2e/security-pipeline.test.ts`)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { 
  SecurityOrchestrator, 
  createSecurityOrchestrator,
  createDefaultSecurityConfig 
} from '../../../src/security/SecurityOrchestrator';
import { createSecurityGateway } from '../../../src/security/SecurityGateway';
import { createCodeGenHooks } from '../../../src/security/integration/CodeGenIntegration';

describe('Security Pipeline E2E', () => {
  let orchestrator: SecurityOrchestrator;
  let testDir: string;

  beforeAll(async () => {
    // Create test directory
    testDir = path.join(__dirname, 'test-project');
    await fs.mkdir(testDir, { recursive: true });

    // Initialize orchestrator
    orchestrator = createSecurityOrchestrator(createDefaultSecurityConfig());
    await orchestrator.initialize();
  });

  afterAll(async () => {
    await orchestrator.close();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Secrets Management', () => {
    it('should retrieve secrets from environment', async () => {
      process.env.TEST_SECRET = 'test-value';
      
      const value = await orchestrator.getSecret('TEST_SECRET');
      expect(value).toBe('test-value');
      
      delete process.env.TEST_SECRET;
    });

    it('should throw when required secret is missing', async () => {
      await expect(orchestrator.requireSecret('NONEXISTENT_SECRET'))
        .rejects.toThrow('Required secret not found');
    });
  });

  describe('Security Scanning', () => {
    it('should detect SQL injection patterns', async () => {
      // Create test file with vulnerability
      const testFile = path.join(testDir, 'vulnerable.ts');
      await fs.writeFile(testFile, `
        const query = \`SELECT * FROM users WHERE id = \${req.params.id}\`;
      `);

      const result = await orchestrator.runSecurityCheck(testDir, {
        skipCompliance: true,
      });

      expect(result.scan?.summary.total).toBeGreaterThan(0);
      
      await fs.unlink(testFile);
    });

    it('should detect hardcoded secrets', async () => {
      const testFile = path.join(testDir, 'secrets.ts');
      await fs.writeFile(testFile, `
        const apiKey = "sk_live_abcdefghijklmnopqrstuvwxyz123456";
        const password = "supersecretpassword123";
      `);

      const result = await orchestrator.runSecurityCheck(testDir, {
        skipCompliance: true,
      });

      expect(result.scan?.summary.total).toBeGreaterThan(0);
      
      await fs.unlink(testFile);
    });

    it('should pass for clean code', async () => {
      const testFile = path.join(testDir, 'clean.ts');
      await fs.writeFile(testFile, `
        export function greet(name: string): string {
          return \`Hello, \${name}!\`;
        }
      `);

      const result = await orchestrator.runSecurityCheck(testDir, {
        skipCompliance: true,
      });

      expect(result.scan?.passed).toBe(true);
      
      await fs.unlink(testFile);
    });
  });

  describe('Compliance Checking', () => {
    it('should run OWASP compliance checks', async () => {
      const result = await orchestrator.runSecurityCheck(testDir, {
        skipScan: true,
      });

      expect(result.compliance).toBeDefined();
      expect(result.compliance?.frameworks.length).toBeGreaterThan(0);
    });
  });

  describe('Security Gateway', () => {
    it('should block generation with secrets in variables', async () => {
      const gateway = createSecurityGateway(orchestrator);
      
      const decision = await gateway.checkCodeGeneration(
        'template.ts',
        { password: 'supersecretpassword123' }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.blockers.length).toBeGreaterThan(0);
    });

    it('should allow safe variables', async () => {
      const gateway = createSecurityGateway(orchestrator);
      
      const decision = await gateway.checkCodeGeneration(
        'template.ts',
        { name: 'MyComponent', count: 42 }
      );

      expect(decision.allowed).toBe(true);
    });

    it('should detect secrets in generated content', async () => {
      const gateway = createSecurityGateway(orchestrator);
      
      const decision = await gateway.checkGeneratedFile(
        'config.ts',
        `export const config = { apiKey: "ghp_abcdefghijklmnopqrstuvwxyz1234567890" };`
      );

      expect(decision.allowed).toBe(false);
      expect(decision.blockers).toContainEqual(
        expect.stringContaining('GitHub token')
      );
    });
  });

  describe('Code Generation Hooks', () => {
    it('should integrate with code generation', async () => {
      const hooks = createCodeGenHooks(orchestrator);

      // Before generation
      const beforeDecision = await hooks.beforeGenerate(
        'component.ts',
        { name: 'Button' }
      );
      expect(beforeDecision.allowed).toBe(true);

      // After generation
      const afterDecision = await hooks.afterGenerate(
        'Button.tsx',
        `export function Button() { return <button>Click me</button>; }`
      );
      expect(afterDecision.allowed).toBe(true);

      // Complete
      await hooks.onComplete(['Button.tsx']);
    });
  });

  describe('Full Pipeline', () => {
    it('should run complete security pipeline', async () => {
      // Create a realistic test project
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test', dependencies: { express: '^4.18.0' } })
      );

      await fs.writeFile(
        path.join(testDir, 'server.ts'),
        `
        import express from 'express';
        import helmet from 'helmet';
        
        const app = express();
        app.use(helmet());
        
        app.get('/user/:id', async (req, res) => {
          // Using parameterized query
          const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
          res.json(user);
        });
        `
      );

      const result = await orchestrator.runSecurityCheck(testDir);

      expect(result).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThan(0);
      
      // Clean up
      await fs.unlink(path.join(testDir, 'package.json'));
      await fs.unlink(path.join(testDir, 'server.ts'));
    });
  });
});
```

---

## 📊 Performance Metrics

```typescript
/**
 * Security performance benchmarks
 */
export const SecurityBenchmarks = {
  // Target execution times
  secretRetrieval: 50,      // ms (cached)
  quickScan: 500,           // ms (single file)
  fullScan: 5000,           // ms (typical project)
  complianceCheck: 3000,    // ms (OWASP framework)
  auditLog: 10,             // ms (single event)
  
  // Memory limits
  maxScanMemory: 256,       // MB
  maxAuditBuffer: 100,      // events
};
```

---

## 📋 Acceptance Criteria

- [ ] All security components integrate correctly
- [ ] Code generation hooks work end-to-end
- [ ] Security checks run in acceptable time
- [ ] Audit trail is complete and verifiable
- [ ] MCP servers integrate seamlessly
- [ ] E2E tests cover all security scenarios
- [ ] Performance meets benchmarks

---

## 🔗 Navigation

← [04-PHASE-COMPLIANCE.md](04-PHASE-COMPLIANCE.md) | [../README.md](../README.md) →
