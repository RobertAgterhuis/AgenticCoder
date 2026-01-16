# Phase 4: Compliance Checks

**Phase ID:** F-SEC-P04  
**Feature:** SecurityCompliance  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 3 (Audit Logging)

---

## 🎯 Phase Objectives

Deze phase implementeert **compliance checking**:
- OWASP Top 10 compliance
- GDPR compliance checks
- Custom policy engine
- Compliance reporting
- MCP integration (Drata, Secureframe)

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── security/
│   └── compliance/
│       ├── index.ts
│       ├── ComplianceChecker.ts
│       ├── frameworks/
│       │   ├── ComplianceFramework.ts
│       │   ├── OWASPFramework.ts
│       │   ├── GDPRFramework.ts
│       │   └── SOC2Framework.ts
│       ├── policies/
│       │   ├── PolicyEngine.ts
│       │   ├── Policy.ts
│       │   └── DefaultPolicies.ts
│       └── reports/
│           └── ComplianceReporter.ts
```

---

## 🔧 Implementation Details

### 4.1 Compliance Framework (`src/security/compliance/frameworks/ComplianceFramework.ts`)

```typescript
/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  checkId: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'not-applicable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
  evidence?: Record<string, unknown>;
  remediation?: string;
  references?: string[];
}

/**
 * Compliance check
 */
export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: ComplianceCheckResult['severity'];
  check: (context: ComplianceContext) => Promise<ComplianceCheckResult>;
}

/**
 * Compliance context
 */
export interface ComplianceContext {
  projectPath: string;
  configuration: Record<string, unknown>;
  generatedFiles: string[];
  scanResults?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Framework summary
 */
export interface FrameworkSummary {
  frameworkId: string;
  frameworkName: string;
  version: string;
  timestamp: Date;
  overallStatus: 'compliant' | 'non-compliant' | 'partial';
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    notApplicable: number;
    total: number;
  };
  results: ComplianceCheckResult[];
}

/**
 * Compliance framework interface
 */
export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  
  /**
   * Get all checks
   */
  getChecks(): ComplianceCheck[];
  
  /**
   * Run all checks
   */
  runChecks(context: ComplianceContext): Promise<FrameworkSummary>;
  
  /**
   * Run specific check
   */
  runCheck(checkId: string, context: ComplianceContext): Promise<ComplianceCheckResult>;
}

/**
 * Base compliance framework
 */
export abstract class BaseComplianceFramework implements ComplianceFramework {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  abstract description: string;
  
  protected checks: ComplianceCheck[] = [];

  /**
   * Get all checks
   */
  getChecks(): ComplianceCheck[] {
    return this.checks;
  }

  /**
   * Register check
   */
  protected registerCheck(check: ComplianceCheck): void {
    this.checks.push(check);
  }

  /**
   * Run all checks
   */
  async runChecks(context: ComplianceContext): Promise<FrameworkSummary> {
    const results: ComplianceCheckResult[] = [];

    for (const check of this.checks) {
      try {
        const result = await check.check(context);
        results.push(result);
      } catch (error) {
        results.push({
          checkId: check.id,
          name: check.name,
          description: check.description,
          status: 'fail',
          severity: check.severity,
          details: `Check failed with error: ${(error as Error).message}`,
        });
      }
    }

    const summary = {
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      warnings: results.filter(r => r.status === 'warning').length,
      notApplicable: results.filter(r => r.status === 'not-applicable').length,
      total: results.length,
    };

    const overallStatus: FrameworkSummary['overallStatus'] = 
      summary.failed > 0 ? 'non-compliant' :
      summary.warnings > 0 ? 'partial' : 'compliant';

    return {
      frameworkId: this.id,
      frameworkName: this.name,
      version: this.version,
      timestamp: new Date(),
      overallStatus,
      summary,
      results,
    };
  }

  /**
   * Run specific check
   */
  async runCheck(checkId: string, context: ComplianceContext): Promise<ComplianceCheckResult> {
    const check = this.checks.find(c => c.id === checkId);
    if (!check) {
      throw new Error(`Check not found: ${checkId}`);
    }
    return check.check(context);
  }
}
```

### 4.2 OWASP Framework (`src/security/compliance/frameworks/OWASPFramework.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { 
  BaseComplianceFramework, 
  ComplianceCheck, 
  ComplianceContext, 
  ComplianceCheckResult 
} from './ComplianceFramework';

/**
 * OWASP Top 10 (2021) compliance framework
 */
export class OWASPFramework extends BaseComplianceFramework {
  id = 'owasp-top-10-2021';
  name = 'OWASP Top 10 2021';
  version = '2021';
  description = 'OWASP Top 10 Web Application Security Risks';

  constructor() {
    super();
    this.registerAllChecks();
  }

  /**
   * Register all OWASP checks
   */
  private registerAllChecks(): void {
    // A01:2021 - Broken Access Control
    this.registerCheck({
      id: 'OWASP-A01-001',
      name: 'Access Control Implementation',
      description: 'Verify that access control is implemented correctly',
      category: 'A01-Broken-Access-Control',
      severity: 'critical',
      check: async (ctx) => this.checkAccessControl(ctx),
    });

    this.registerCheck({
      id: 'OWASP-A01-002',
      name: 'CORS Configuration',
      description: 'Verify CORS is properly configured',
      category: 'A01-Broken-Access-Control',
      severity: 'high',
      check: async (ctx) => this.checkCORS(ctx),
    });

    // A02:2021 - Cryptographic Failures
    this.registerCheck({
      id: 'OWASP-A02-001',
      name: 'Encryption at Rest',
      description: 'Verify sensitive data is encrypted at rest',
      category: 'A02-Cryptographic-Failures',
      severity: 'critical',
      check: async (ctx) => this.checkEncryptionAtRest(ctx),
    });

    this.registerCheck({
      id: 'OWASP-A02-002',
      name: 'Encryption in Transit',
      description: 'Verify HTTPS is enforced',
      category: 'A02-Cryptographic-Failures',
      severity: 'critical',
      check: async (ctx) => this.checkEncryptionInTransit(ctx),
    });

    this.registerCheck({
      id: 'OWASP-A02-003',
      name: 'Strong Cryptography',
      description: 'Verify strong cryptographic algorithms are used',
      category: 'A02-Cryptographic-Failures',
      severity: 'high',
      check: async (ctx) => this.checkStrongCrypto(ctx),
    });

    // A03:2021 - Injection
    this.registerCheck({
      id: 'OWASP-A03-001',
      name: 'SQL Injection Prevention',
      description: 'Verify parameterized queries are used',
      category: 'A03-Injection',
      severity: 'critical',
      check: async (ctx) => this.checkSQLInjection(ctx),
    });

    this.registerCheck({
      id: 'OWASP-A03-002',
      name: 'XSS Prevention',
      description: 'Verify output encoding is implemented',
      category: 'A03-Injection',
      severity: 'high',
      check: async (ctx) => this.checkXSS(ctx),
    });

    // A04:2021 - Insecure Design
    this.registerCheck({
      id: 'OWASP-A04-001',
      name: 'Input Validation',
      description: 'Verify input validation is implemented',
      category: 'A04-Insecure-Design',
      severity: 'high',
      check: async (ctx) => this.checkInputValidation(ctx),
    });

    // A05:2021 - Security Misconfiguration
    this.registerCheck({
      id: 'OWASP-A05-001',
      name: 'Security Headers',
      description: 'Verify security headers are configured',
      category: 'A05-Security-Misconfiguration',
      severity: 'medium',
      check: async (ctx) => this.checkSecurityHeaders(ctx),
    });

    this.registerCheck({
      id: 'OWASP-A05-002',
      name: 'Debug Mode Disabled',
      description: 'Verify debug mode is disabled in production',
      category: 'A05-Security-Misconfiguration',
      severity: 'medium',
      check: async (ctx) => this.checkDebugMode(ctx),
    });

    // A06:2021 - Vulnerable Components
    this.registerCheck({
      id: 'OWASP-A06-001',
      name: 'Dependency Security',
      description: 'Verify dependencies have no known vulnerabilities',
      category: 'A06-Vulnerable-Components',
      severity: 'high',
      check: async (ctx) => this.checkDependencies(ctx),
    });

    // A07:2021 - Authentication Failures
    this.registerCheck({
      id: 'OWASP-A07-001',
      name: 'Password Storage',
      description: 'Verify passwords are properly hashed',
      category: 'A07-Auth-Failures',
      severity: 'critical',
      check: async (ctx) => this.checkPasswordStorage(ctx),
    });

    this.registerCheck({
      id: 'OWASP-A07-002',
      name: 'Session Management',
      description: 'Verify secure session management',
      category: 'A07-Auth-Failures',
      severity: 'high',
      check: async (ctx) => this.checkSessionManagement(ctx),
    });

    // A08:2021 - Data Integrity Failures
    this.registerCheck({
      id: 'OWASP-A08-001',
      name: 'Deserialization Security',
      description: 'Verify safe deserialization practices',
      category: 'A08-Data-Integrity',
      severity: 'high',
      check: async (ctx) => this.checkDeserialization(ctx),
    });

    // A09:2021 - Logging Failures
    this.registerCheck({
      id: 'OWASP-A09-001',
      name: 'Security Logging',
      description: 'Verify security events are logged',
      category: 'A09-Logging-Failures',
      severity: 'medium',
      check: async (ctx) => this.checkSecurityLogging(ctx),
    });

    this.registerCheck({
      id: 'OWASP-A09-002',
      name: 'Log Injection Prevention',
      description: 'Verify log injection is prevented',
      category: 'A09-Logging-Failures',
      severity: 'medium',
      check: async (ctx) => this.checkLogInjection(ctx),
    });

    // A10:2021 - SSRF
    this.registerCheck({
      id: 'OWASP-A10-001',
      name: 'SSRF Prevention',
      description: 'Verify SSRF vulnerabilities are prevented',
      category: 'A10-SSRF',
      severity: 'high',
      check: async (ctx) => this.checkSSRF(ctx),
    });
  }

  // Individual check implementations
  private async checkAccessControl(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasAuthMiddleware = false;
    let hasRBAC = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/authMiddleware|isAuthenticated|requireAuth/i.test(content)) {
        hasAuthMiddleware = true;
      }
      if (/role|permission|rbac|authorize/i.test(content)) {
        hasRBAC = true;
      }
    }

    return {
      checkId: 'OWASP-A01-001',
      name: 'Access Control Implementation',
      description: 'Verify that access control is implemented correctly',
      status: hasAuthMiddleware && hasRBAC ? 'pass' : hasAuthMiddleware ? 'warning' : 'fail',
      severity: 'critical',
      details: hasAuthMiddleware 
        ? (hasRBAC ? 'Access control with RBAC detected' : 'Basic auth detected but no RBAC')
        : 'No access control implementation found',
      remediation: hasAuthMiddleware ? undefined : 'Implement authentication middleware and RBAC',
      references: ['https://owasp.org/Top10/A01_2021-Broken_Access_Control/'],
    };
  }

  private async checkCORS(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasCORS = false;
    let isWildcard = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/cors\(|Access-Control-Allow-Origin/i.test(content)) {
        hasCORS = true;
        if (/origin:\s*['"]?\*['"]?|\*/.test(content)) {
          isWildcard = true;
        }
      }
    }

    return {
      checkId: 'OWASP-A01-002',
      name: 'CORS Configuration',
      description: 'Verify CORS is properly configured',
      status: hasCORS && !isWildcard ? 'pass' : isWildcard ? 'fail' : 'warning',
      severity: 'high',
      details: isWildcard 
        ? 'CORS allows all origins (*)'
        : hasCORS ? 'CORS properly configured' : 'No CORS configuration found',
      remediation: isWildcard ? 'Restrict CORS to specific trusted origins' : undefined,
    };
  }

  private async checkEncryptionAtRest(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    // Check Bicep files for encryption settings
    const bicepFiles = await glob('**/*.bicep', { cwd: ctx.projectPath, absolute: true });
    let hasEncryption = false;

    for (const file of bicepFiles) {
      const content = await fs.readFile(file, 'utf-8');
      if (/encryption|encryptionAtRest|enableSoftDelete/i.test(content)) {
        hasEncryption = true;
      }
    }

    return {
      checkId: 'OWASP-A02-001',
      name: 'Encryption at Rest',
      description: 'Verify sensitive data is encrypted at rest',
      status: hasEncryption ? 'pass' : bicepFiles.length > 0 ? 'warning' : 'not-applicable',
      severity: 'critical',
      details: hasEncryption 
        ? 'Encryption at rest configured'
        : bicepFiles.length > 0 ? 'No encryption configuration in infrastructure' : 'No infrastructure files',
    };
  }

  private async checkEncryptionInTransit(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasHTTPS = false;
    let hasHTTP = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/https:\/\/|httpsOnly:\s*true/i.test(content)) {
        hasHTTPS = true;
      }
      if (/http:\/\/(?!localhost|127\.0\.0\.1)/i.test(content)) {
        hasHTTP = true;
      }
    }

    return {
      checkId: 'OWASP-A02-002',
      name: 'Encryption in Transit',
      description: 'Verify HTTPS is enforced',
      status: hasHTTPS && !hasHTTP ? 'pass' : hasHTTP ? 'fail' : 'warning',
      severity: 'critical',
      details: hasHTTP 
        ? 'HTTP URLs detected (non-localhost)'
        : hasHTTPS ? 'HTTPS enforced' : 'No explicit HTTPS configuration',
    };
  }

  private async checkStrongCrypto(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasWeakCrypto = false;
    const weakPatterns = /md5|sha1|des|rc4/i;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (weakPatterns.test(content)) {
        hasWeakCrypto = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A02-003',
      name: 'Strong Cryptography',
      description: 'Verify strong cryptographic algorithms are used',
      status: hasWeakCrypto ? 'fail' : 'pass',
      severity: 'high',
      details: hasWeakCrypto 
        ? 'Weak cryptographic algorithms detected (MD5, SHA1, DES, RC4)'
        : 'No weak cryptographic algorithms detected',
      remediation: hasWeakCrypto ? 'Use SHA-256 or stronger for hashing, AES-256 for encryption' : undefined,
    };
  }

  private async checkSQLInjection(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasSQLInjectionRisk = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      // Check for string concatenation in SQL
      if (/`SELECT.*\$\{|query\([^)]*\+|execute\([^)]*\+/i.test(content)) {
        hasSQLInjectionRisk = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A03-001',
      name: 'SQL Injection Prevention',
      description: 'Verify parameterized queries are used',
      status: hasSQLInjectionRisk ? 'fail' : 'pass',
      severity: 'critical',
      details: hasSQLInjectionRisk 
        ? 'Potential SQL injection vulnerability detected'
        : 'No SQL injection patterns detected',
      remediation: hasSQLInjectionRisk ? 'Use parameterized queries or ORM' : undefined,
    };
  }

  private async checkXSS(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasXSSRisk = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/innerHTML\s*=|dangerouslySetInnerHTML|v-html=/i.test(content)) {
        hasXSSRisk = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A03-002',
      name: 'XSS Prevention',
      description: 'Verify output encoding is implemented',
      status: hasXSSRisk ? 'warning' : 'pass',
      severity: 'high',
      details: hasXSSRisk 
        ? 'Potential XSS vulnerability (innerHTML usage detected)'
        : 'No obvious XSS patterns detected',
    };
  }

  private async checkInputValidation(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasValidation = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/zod|joi|yup|class-validator|validate|schema/i.test(content)) {
        hasValidation = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A04-001',
      name: 'Input Validation',
      description: 'Verify input validation is implemented',
      status: hasValidation ? 'pass' : 'warning',
      severity: 'high',
      details: hasValidation 
        ? 'Input validation library detected'
        : 'No input validation library detected',
      remediation: hasValidation ? undefined : 'Implement input validation using Zod, Joi, or similar',
    };
  }

  private async checkSecurityHeaders(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasHelmet = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/helmet\(\)|Content-Security-Policy|X-Frame-Options/i.test(content)) {
        hasHelmet = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A05-001',
      name: 'Security Headers',
      description: 'Verify security headers are configured',
      status: hasHelmet ? 'pass' : 'warning',
      severity: 'medium',
      details: hasHelmet 
        ? 'Security headers configured'
        : 'No security headers configuration detected',
      remediation: hasHelmet ? undefined : 'Use helmet() middleware to set security headers',
    };
  }

  private async checkDebugMode(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasDebugEnabled = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/debug:\s*true|DEBUG\s*=\s*true|NODE_ENV.*development/i.test(content)) {
        hasDebugEnabled = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A05-002',
      name: 'Debug Mode Disabled',
      description: 'Verify debug mode is disabled in production',
      status: hasDebugEnabled ? 'warning' : 'pass',
      severity: 'medium',
      details: hasDebugEnabled 
        ? 'Debug mode may be enabled'
        : 'No explicit debug mode detected',
    };
  }

  private async checkDependencies(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    // Check if scan results include dependency vulnerabilities
    const scanResults = ctx.scanResults as { dependencies?: { findings: unknown[] } } | undefined;
    const hasVulnerabilities = scanResults?.dependencies?.findings?.length ?? 0;

    return {
      checkId: 'OWASP-A06-001',
      name: 'Dependency Security',
      description: 'Verify dependencies have no known vulnerabilities',
      status: hasVulnerabilities > 0 ? 'fail' : 'pass',
      severity: 'high',
      details: hasVulnerabilities > 0 
        ? `${hasVulnerabilities} vulnerable dependencies found`
        : 'No vulnerable dependencies detected',
    };
  }

  private async checkPasswordStorage(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasBcrypt = false;
    let hasPlaintext = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/bcrypt|argon2|scrypt|pbkdf2/i.test(content)) {
        hasBcrypt = true;
      }
      if (/password:\s*req\.(body|query)/i.test(content)) {
        hasPlaintext = true;
      }
    }

    return {
      checkId: 'OWASP-A07-001',
      name: 'Password Storage',
      description: 'Verify passwords are properly hashed',
      status: hasBcrypt && !hasPlaintext ? 'pass' : hasPlaintext ? 'fail' : 'warning',
      severity: 'critical',
      details: hasPlaintext 
        ? 'Plaintext password storage detected'
        : hasBcrypt ? 'Secure password hashing detected' : 'No password hashing detected',
    };
  }

  private async checkSessionManagement(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasSecureSession = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/httpOnly|secure:\s*true|sameSite/i.test(content)) {
        hasSecureSession = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A07-002',
      name: 'Session Management',
      description: 'Verify secure session management',
      status: hasSecureSession ? 'pass' : 'warning',
      severity: 'high',
      details: hasSecureSession 
        ? 'Secure session configuration detected'
        : 'No secure session configuration detected',
    };
  }

  private async checkDeserialization(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasUnsafeDeserialize = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/eval\(|new Function\(|unserialize/i.test(content)) {
        hasUnsafeDeserialize = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A08-001',
      name: 'Deserialization Security',
      description: 'Verify safe deserialization practices',
      status: hasUnsafeDeserialize ? 'fail' : 'pass',
      severity: 'high',
      details: hasUnsafeDeserialize 
        ? 'Unsafe deserialization detected'
        : 'No unsafe deserialization patterns detected',
    };
  }

  private async checkSecurityLogging(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasLogging = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/logger|winston|pino|bunyan|log4js/i.test(content)) {
        hasLogging = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A09-001',
      name: 'Security Logging',
      description: 'Verify security events are logged',
      status: hasLogging ? 'pass' : 'warning',
      severity: 'medium',
      details: hasLogging 
        ? 'Logging framework detected'
        : 'No logging framework detected',
    };
  }

  private async checkLogInjection(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasLogInjectionRisk = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/console\.log\(.*req\.(body|query|params)/i.test(content)) {
        hasLogInjectionRisk = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A09-002',
      name: 'Log Injection Prevention',
      description: 'Verify log injection is prevented',
      status: hasLogInjectionRisk ? 'warning' : 'pass',
      severity: 'medium',
      details: hasLogInjectionRisk 
        ? 'Potential log injection detected'
        : 'No log injection patterns detected',
    };
  }

  private async checkSSRF(ctx: ComplianceContext): Promise<ComplianceCheckResult> {
    const files = await this.getSourceFiles(ctx.projectPath);
    let hasSSRFRisk = false;

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (/fetch\(.*req\.|axios\(.*req\.|http\.get\(.*req\./i.test(content)) {
        hasSSRFRisk = true;
        break;
      }
    }

    return {
      checkId: 'OWASP-A10-001',
      name: 'SSRF Prevention',
      description: 'Verify SSRF vulnerabilities are prevented',
      status: hasSSRFRisk ? 'warning' : 'pass',
      severity: 'high',
      details: hasSSRFRisk 
        ? 'Potential SSRF vulnerability detected'
        : 'No SSRF patterns detected',
    };
  }

  /**
   * Get source files
   */
  private async getSourceFiles(projectPath: string): Promise<string[]> {
    return glob('**/*.{ts,tsx,js,jsx}', {
      cwd: projectPath,
      ignore: ['**/node_modules/**', '**/dist/**'],
      absolute: true,
    });
  }
}

/**
 * Create OWASP framework
 */
export function createOWASPFramework(): OWASPFramework {
  return new OWASPFramework();
}
```

### 4.3 Compliance Checker (`src/security/compliance/ComplianceChecker.ts`)

```typescript
import { ComplianceFramework, ComplianceContext, FrameworkSummary } from './frameworks/ComplianceFramework';
import { OWASPFramework } from './frameworks/OWASPFramework';

/**
 * Full compliance report
 */
export interface ComplianceReport {
  timestamp: Date;
  projectPath: string;
  frameworks: FrameworkSummary[];
  overallStatus: 'compliant' | 'non-compliant' | 'partial';
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    total: number;
  };
}

/**
 * Compliance checker
 */
export class ComplianceChecker {
  private frameworks: Map<string, ComplianceFramework> = new Map();

  constructor() {
    // Register default frameworks
    this.registerFramework(new OWASPFramework());
  }

  /**
   * Register framework
   */
  registerFramework(framework: ComplianceFramework): void {
    this.frameworks.set(framework.id, framework);
  }

  /**
   * Get framework
   */
  getFramework(id: string): ComplianceFramework | undefined {
    return this.frameworks.get(id);
  }

  /**
   * List frameworks
   */
  listFrameworks(): ComplianceFramework[] {
    return Array.from(this.frameworks.values());
  }

  /**
   * Run compliance check
   */
  async check(
    context: ComplianceContext,
    frameworkIds?: string[]
  ): Promise<ComplianceReport> {
    const frameworksToRun = frameworkIds
      ? frameworkIds.map(id => this.frameworks.get(id)).filter(Boolean) as ComplianceFramework[]
      : Array.from(this.frameworks.values());

    const frameworkResults: FrameworkSummary[] = [];

    for (const framework of frameworksToRun) {
      const result = await framework.runChecks(context);
      frameworkResults.push(result);
    }

    // Calculate overall summary
    const summary = {
      passed: frameworkResults.reduce((sum, f) => sum + f.summary.passed, 0),
      failed: frameworkResults.reduce((sum, f) => sum + f.summary.failed, 0),
      warnings: frameworkResults.reduce((sum, f) => sum + f.summary.warnings, 0),
      total: frameworkResults.reduce((sum, f) => sum + f.summary.total, 0),
    };

    const overallStatus: ComplianceReport['overallStatus'] =
      summary.failed > 0 ? 'non-compliant' :
      summary.warnings > 0 ? 'partial' : 'compliant';

    return {
      timestamp: new Date(),
      projectPath: context.projectPath,
      frameworks: frameworkResults,
      overallStatus,
      summary,
    };
  }

  /**
   * Quick OWASP check
   */
  async checkOWASP(context: ComplianceContext): Promise<FrameworkSummary> {
    const framework = this.frameworks.get('owasp-top-10-2021');
    if (!framework) {
      throw new Error('OWASP framework not registered');
    }
    return framework.runChecks(context);
  }
}

/**
 * Create compliance checker
 */
export function createComplianceChecker(): ComplianceChecker {
  return new ComplianceChecker();
}
```

---

## 📋 Acceptance Criteria

- [ ] OWASP Top 10 checks are implemented
- [ ] Compliance checks produce accurate results
- [ ] Reports include remediation guidance
- [ ] Custom frameworks can be added
- [ ] Evidence is collected for findings
- [ ] Compliance status is correctly calculated

---

## 🔗 Navigation

← [03-PHASE-AUDIT-LOGGING.md](03-PHASE-AUDIT-LOGGING.md) | [05-PHASE-INTEGRATION.md](05-PHASE-INTEGRATION.md) →
