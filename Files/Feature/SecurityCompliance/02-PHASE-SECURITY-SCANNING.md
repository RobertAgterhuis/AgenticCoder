# Phase 2: Security Scanning

**Phase ID:** F-SEC-P02  
**Feature:** SecurityCompliance  
**Duration:** 4-5 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 1 (Secrets Management)

---

## 🎯 Phase Objectives

Deze phase implementeert **security scanning** voor gegenereerde code:
- Static Application Security Testing (SAST)
- Dependency vulnerability scanning
- Configuration scanning
- Infrastructure (Bicep) security scanning
- MCP integration (BoostSecurity, SafeDep)

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── security/
│   └── scanning/
│       ├── index.ts
│       ├── SecurityScanner.ts
│       ├── scanners/
│       │   ├── CodeScanner.ts
│       │   ├── DependencyScanner.ts
│       │   ├── ConfigScanner.ts
│       │   └── InfraScanner.ts
│       ├── rules/
│       │   ├── RuleEngine.ts
│       │   ├── OWASPRules.ts
│       │   └── CustomRules.ts
│       └── reporters/
│           └── SecurityReporter.ts
```

---

## 🔧 Implementation Details

### 2.1 Security Scanner (`src/security/scanning/SecurityScanner.ts`)

```typescript
import { CodeScanner, CodeScanResult } from './scanners/CodeScanner';
import { DependencyScanner, DependencyScanResult } from './scanners/DependencyScanner';
import { ConfigScanner, ConfigScanResult } from './scanners/ConfigScanner';
import { InfraScanner, InfraScanResult } from './scanners/InfraScanner';

/**
 * Security finding
 */
export interface SecurityFinding {
  id: string;
  type: 'vulnerability' | 'secret' | 'misconfiguration' | 'dependency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  file?: string;
  line?: number;
  code?: string;
  cwe?: string;
  owasp?: string;
  fix?: string;
  references?: string[];
}

/**
 * Scan result
 */
export interface ScanResult {
  scanner: string;
  timestamp: Date;
  duration: number;
  findings: SecurityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

/**
 * Full security scan result
 */
export interface FullScanResult {
  id: string;
  timestamp: Date;
  duration: number;
  passed: boolean;
  results: {
    code?: ScanResult;
    dependencies?: ScanResult;
    config?: ScanResult;
    infrastructure?: ScanResult;
  };
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

/**
 * Scan options
 */
export interface ScanOptions {
  scanCode?: boolean;
  scanDependencies?: boolean;
  scanConfig?: boolean;
  scanInfrastructure?: boolean;
  failOnSeverity?: SecurityFinding['severity'];
  excludePaths?: string[];
  includeRules?: string[];
  excludeRules?: string[];
}

/**
 * Security scanner - orchestrates all security scans
 */
export class SecurityScanner {
  private codeScanner: CodeScanner;
  private dependencyScanner: DependencyScanner;
  private configScanner: ConfigScanner;
  private infraScanner: InfraScanner;

  constructor() {
    this.codeScanner = new CodeScanner();
    this.dependencyScanner = new DependencyScanner();
    this.configScanner = new ConfigScanner();
    this.infraScanner = new InfraScanner();
  }

  /**
   * Run full security scan
   */
  async scan(directory: string, options: ScanOptions = {}): Promise<FullScanResult> {
    const startTime = Date.now();
    const scanId = this.generateScanId();

    const results: FullScanResult['results'] = {};

    // Default: scan everything
    const {
      scanCode = true,
      scanDependencies = true,
      scanConfig = true,
      scanInfrastructure = true,
      failOnSeverity = 'critical',
      excludePaths = [],
    } = options;

    // Run scans in parallel where possible
    const scanPromises: Promise<void>[] = [];

    if (scanCode) {
      scanPromises.push(
        this.codeScanner.scan(directory, { excludePaths }).then(r => {
          results.code = this.toScanResult('code', r);
        })
      );
    }

    if (scanDependencies) {
      scanPromises.push(
        this.dependencyScanner.scan(directory).then(r => {
          results.dependencies = this.toScanResult('dependencies', r);
        })
      );
    }

    if (scanConfig) {
      scanPromises.push(
        this.configScanner.scan(directory, { excludePaths }).then(r => {
          results.config = this.toScanResult('config', r);
        })
      );
    }

    if (scanInfrastructure) {
      scanPromises.push(
        this.infraScanner.scan(directory).then(r => {
          results.infrastructure = this.toScanResult('infrastructure', r);
        })
      );
    }

    await Promise.all(scanPromises);

    // Calculate summary
    const summary = this.calculateSummary(results);
    const duration = Date.now() - startTime;

    // Determine pass/fail
    const passed = this.checkPassed(summary, failOnSeverity);

    return {
      id: scanId,
      timestamp: new Date(),
      duration,
      passed,
      results,
      summary,
    };
  }

  /**
   * Quick scan (code only)
   */
  async quickScan(directory: string): Promise<ScanResult> {
    const result = await this.codeScanner.scan(directory, {});
    return this.toScanResult('code', result);
  }

  /**
   * Scan single file
   */
  async scanFile(filePath: string): Promise<SecurityFinding[]> {
    return this.codeScanner.scanFile(filePath);
  }

  /**
   * Convert scanner result to standard format
   */
  private toScanResult(scanner: string, findings: SecurityFinding[]): ScanResult {
    return {
      scanner,
      timestamp: new Date(),
      duration: 0,
      findings,
      summary: this.countSeverities(findings),
    };
  }

  /**
   * Count findings by severity
   */
  private countSeverities(findings: SecurityFinding[]): ScanResult['summary'] {
    return {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      total: findings.length,
    };
  }

  /**
   * Calculate overall summary
   */
  private calculateSummary(results: FullScanResult['results']): FullScanResult['summary'] {
    const summary = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

    for (const result of Object.values(results)) {
      if (result) {
        summary.critical += result.summary.critical;
        summary.high += result.summary.high;
        summary.medium += result.summary.medium;
        summary.low += result.summary.low;
        summary.total += result.summary.total;
      }
    }

    return summary;
  }

  /**
   * Check if scan passed based on threshold
   */
  private checkPassed(
    summary: FullScanResult['summary'], 
    failOnSeverity: SecurityFinding['severity']
  ): boolean {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const threshold = severityOrder.indexOf(failOnSeverity);

    if (threshold >= 3 && summary.critical > 0) return false;
    if (threshold >= 2 && summary.high > 0) return false;
    if (threshold >= 1 && summary.medium > 0) return false;
    if (threshold >= 0 && summary.low > 0) return false;

    return true;
  }

  /**
   * Generate unique scan ID
   */
  private generateScanId(): string {
    return `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create security scanner
 */
export function createSecurityScanner(): SecurityScanner {
  return new SecurityScanner();
}
```

### 2.2 Code Scanner (`src/security/scanning/scanners/CodeScanner.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { SecurityFinding } from '../SecurityScanner';
import { OWASPRules } from '../rules/OWASPRules';

/**
 * Code scan options
 */
export interface CodeScanOptions {
  excludePaths?: string[];
  fileTypes?: string[];
}

/**
 * Code scan result
 */
export type CodeScanResult = SecurityFinding[];

/**
 * Vulnerability rule
 */
export interface VulnerabilityRule {
  id: string;
  title: string;
  description: string;
  severity: SecurityFinding['severity'];
  pattern: RegExp;
  languages: string[];
  cwe?: string;
  owasp?: string;
  fix?: string;
}

/**
 * Code security scanner (SAST)
 */
export class CodeScanner {
  private rules: VulnerabilityRule[] = [];

  constructor() {
    this.loadRules();
  }

  /**
   * Load vulnerability rules
   */
  private loadRules(): void {
    // Load OWASP rules
    this.rules = OWASPRules.getAllRules();
  }

  /**
   * Scan directory
   */
  async scan(directory: string, options: CodeScanOptions = {}): Promise<CodeScanResult> {
    const findings: SecurityFinding[] = [];
    
    const fileTypes = options.fileTypes || [
      '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx',
      '**/*.py', '**/*.java', '**/*.cs',
    ];

    const excludePaths = options.excludePaths || [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
    ];

    // Find all files
    const files: string[] = [];
    for (const pattern of fileTypes) {
      const matches = await glob(pattern, {
        cwd: directory,
        ignore: excludePaths,
        absolute: true,
      });
      files.push(...matches);
    }

    // Scan each file
    for (const file of files) {
      const fileFindings = await this.scanFile(file);
      findings.push(...fileFindings);
    }

    return findings;
  }

  /**
   * Scan single file
   */
  async scanFile(filePath: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const ext = path.extname(filePath);
      const language = this.getLanguage(ext);

      for (const rule of this.rules) {
        // Skip rules not applicable to this language
        if (!rule.languages.includes(language) && !rule.languages.includes('*')) {
          continue;
        }

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Reset regex
          rule.pattern.lastIndex = 0;
          
          if (rule.pattern.test(line)) {
            findings.push({
              id: `${rule.id}-${i}`,
              type: 'vulnerability',
              severity: rule.severity,
              title: rule.title,
              description: rule.description,
              file: filePath,
              line: i + 1,
              code: line.trim(),
              cwe: rule.cwe,
              owasp: rule.owasp,
              fix: rule.fix,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan file ${filePath}:`, error);
    }

    return findings;
  }

  /**
   * Get language from file extension
   */
  private getLanguage(ext: string): string {
    const mapping: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.go': 'go',
      '.rb': 'ruby',
      '.php': 'php',
    };
    return mapping[ext] || 'unknown';
  }

  /**
   * Add custom rule
   */
  addRule(rule: VulnerabilityRule): void {
    this.rules.push(rule);
  }
}
```

### 2.3 OWASP Rules (`src/security/scanning/rules/OWASPRules.ts`)

```typescript
import { VulnerabilityRule } from '../scanners/CodeScanner';

/**
 * OWASP Top 10 Security Rules
 */
export class OWASPRules {
  /**
   * Get all OWASP rules
   */
  static getAllRules(): VulnerabilityRule[] {
    return [
      // A01:2021 - Broken Access Control
      ...this.getAccessControlRules(),
      // A02:2021 - Cryptographic Failures
      ...this.getCryptoRules(),
      // A03:2021 - Injection
      ...this.getInjectionRules(),
      // A04:2021 - Insecure Design
      ...this.getInsecureDesignRules(),
      // A05:2021 - Security Misconfiguration
      ...this.getMisconfigurationRules(),
      // A06:2021 - Vulnerable Components
      ...this.getVulnerableComponentRules(),
      // A07:2021 - Auth Failures
      ...this.getAuthFailureRules(),
      // A08:2021 - Data Integrity Failures
      ...this.getDataIntegrityRules(),
      // A09:2021 - Logging Failures
      ...this.getLoggingFailureRules(),
      // A10:2021 - SSRF
      ...this.getSSRFRules(),
    ];
  }

  /**
   * A01: Broken Access Control
   */
  static getAccessControlRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A01-001',
        title: 'Direct Object Reference',
        description: 'Possible insecure direct object reference (IDOR)',
        severity: 'high',
        pattern: /\.findById\(req\.(params|query|body)\./gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-639',
        owasp: 'A01:2021',
        fix: 'Validate user authorization before accessing resources',
      },
      {
        id: 'OWASP-A01-002',
        title: 'Missing Authorization Check',
        description: 'Route handler without authorization middleware',
        severity: 'medium',
        pattern: /app\.(get|post|put|delete)\([^)]+,\s*async\s*\(req/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-862',
        owasp: 'A01:2021',
        fix: 'Add authorization middleware to route handlers',
      },
    ];
  }

  /**
   * A02: Cryptographic Failures
   */
  static getCryptoRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A02-001',
        title: 'Weak Hashing Algorithm',
        description: 'MD5 or SHA1 used for hashing (cryptographically weak)',
        severity: 'high',
        pattern: /createHash\(['"]?(md5|sha1)['"]?\)/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-327',
        owasp: 'A02:2021',
        fix: 'Use SHA-256 or SHA-512 for hashing',
      },
      {
        id: 'OWASP-A02-002',
        title: 'Hardcoded Encryption Key',
        description: 'Encryption key hardcoded in source code',
        severity: 'critical',
        pattern: /createCipher(iv)?\(['"][^'"]+['"],\s*['"][^'"]{16,}['"]\)/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-321',
        owasp: 'A02:2021',
        fix: 'Use environment variables or key management service',
      },
      {
        id: 'OWASP-A02-003',
        title: 'Insecure Random',
        description: 'Math.random() used for security-sensitive operations',
        severity: 'medium',
        pattern: /Math\.random\(\)/g,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-338',
        owasp: 'A02:2021',
        fix: 'Use crypto.randomBytes() for security-sensitive operations',
      },
    ];
  }

  /**
   * A03: Injection
   */
  static getInjectionRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A03-001',
        title: 'SQL Injection',
        description: 'Possible SQL injection vulnerability',
        severity: 'critical',
        pattern: /(\$\{|['"]?\s*\+\s*)(req\.|params\.|query\.|body\.)/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-89',
        owasp: 'A03:2021',
        fix: 'Use parameterized queries or ORM methods',
      },
      {
        id: 'OWASP-A03-002',
        title: 'Command Injection',
        description: 'Possible command injection vulnerability',
        severity: 'critical',
        pattern: /(exec|spawn|execSync)\([^)]*\$\{/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-78',
        owasp: 'A03:2021',
        fix: 'Validate and sanitize all input before command execution',
      },
      {
        id: 'OWASP-A03-003',
        title: 'NoSQL Injection',
        description: 'Possible NoSQL injection vulnerability',
        severity: 'high',
        pattern: /\.find\(\s*\{[^}]*req\.(body|query|params)/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-943',
        owasp: 'A03:2021',
        fix: 'Validate input types and use schema validation',
      },
      {
        id: 'OWASP-A03-004',
        title: 'XSS Vulnerability',
        description: 'Possible Cross-Site Scripting vulnerability',
        severity: 'high',
        pattern: /innerHTML\s*=|dangerouslySetInnerHTML|v-html=/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-79',
        owasp: 'A03:2021',
        fix: 'Use safe DOM methods or sanitize HTML content',
      },
      {
        id: 'OWASP-A03-005',
        title: 'Template Injection',
        description: 'Possible template injection vulnerability',
        severity: 'high',
        pattern: /eval\(|new\s+Function\(/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-94',
        owasp: 'A03:2021',
        fix: 'Avoid eval() and new Function(). Use safe alternatives.',
      },
    ];
  }

  /**
   * A04: Insecure Design
   */
  static getInsecureDesignRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A04-001',
        title: 'Missing Rate Limiting',
        description: 'Authentication endpoint without rate limiting',
        severity: 'medium',
        pattern: /\/(login|auth|signin|register|signup)/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-307',
        owasp: 'A04:2021',
        fix: 'Implement rate limiting on authentication endpoints',
      },
    ];
  }

  /**
   * A05: Security Misconfiguration
   */
  static getMisconfigurationRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A05-001',
        title: 'Debug Mode Enabled',
        description: 'Debug mode enabled in production',
        severity: 'medium',
        pattern: /debug:\s*true|DEBUG\s*=\s*true/gi,
        languages: ['*'],
        cwe: 'CWE-489',
        owasp: 'A05:2021',
        fix: 'Disable debug mode in production',
      },
      {
        id: 'OWASP-A05-002',
        title: 'Verbose Error Messages',
        description: 'Detailed error messages exposed to users',
        severity: 'low',
        pattern: /res\.send\(err(or)?\.stack\)|console\.error\(err(or)?\)/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-209',
        owasp: 'A05:2021',
        fix: 'Use generic error messages for users, log details server-side',
      },
      {
        id: 'OWASP-A05-003',
        title: 'Missing Security Headers',
        description: 'Missing helmet() or security headers middleware',
        severity: 'medium',
        pattern: /app\.use\(express\(\)\)/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-16',
        owasp: 'A05:2021',
        fix: 'Use helmet() middleware to set security headers',
      },
      {
        id: 'OWASP-A05-004',
        title: 'CORS Wildcard',
        description: 'CORS allows all origins',
        severity: 'medium',
        pattern: /cors\(\s*\{?\s*(origin:\s*['"]\*['"]|)\s*\}?\s*\)/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-942',
        owasp: 'A05:2021',
        fix: 'Restrict CORS to specific trusted origins',
      },
    ];
  }

  /**
   * A06: Vulnerable Components
   */
  static getVulnerableComponentRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A06-001',
        title: 'Outdated Package Reference',
        description: 'Package version might be outdated',
        severity: 'low',
        pattern: /"[^"]+": "\d+\.\d+\.\d+"/g,
        languages: ['json'],
        cwe: 'CWE-1104',
        owasp: 'A06:2021',
        fix: 'Run npm audit and update vulnerable packages',
      },
    ];
  }

  /**
   * A07: Authentication Failures
   */
  static getAuthFailureRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A07-001',
        title: 'Hardcoded JWT Secret',
        description: 'JWT secret hardcoded in source code',
        severity: 'critical',
        pattern: /jwt\.sign\([^)]+,\s*['"][^'"]{20,}['"]/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-798',
        owasp: 'A07:2021',
        fix: 'Use environment variables for JWT secrets',
      },
      {
        id: 'OWASP-A07-002',
        title: 'Weak Password Validation',
        description: 'Password validation might be too weak',
        severity: 'medium',
        pattern: /password\.length\s*[<>=]+\s*[0-7]\b/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-521',
        owasp: 'A07:2021',
        fix: 'Require passwords of at least 8 characters with complexity',
      },
      {
        id: 'OWASP-A07-003',
        title: 'Plaintext Password Storage',
        description: 'Password might be stored without hashing',
        severity: 'critical',
        pattern: /password:\s*req\.(body|params|query)\.password/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-256',
        owasp: 'A07:2021',
        fix: 'Hash passwords using bcrypt before storing',
      },
    ];
  }

  /**
   * A08: Data Integrity Failures
   */
  static getDataIntegrityRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A08-001',
        title: 'Insecure Deserialization',
        description: 'Possible insecure deserialization',
        severity: 'high',
        pattern: /JSON\.parse\(req\./gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-502',
        owasp: 'A08:2021',
        fix: 'Validate and sanitize data before deserialization',
      },
    ];
  }

  /**
   * A09: Logging Failures
   */
  static getLoggingFailureRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A09-001',
        title: 'Sensitive Data in Logs',
        description: 'Possible sensitive data logged',
        severity: 'medium',
        pattern: /console\.(log|info|debug)\([^)]*password|console\.(log|info|debug)\([^)]*secret/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-532',
        owasp: 'A09:2021',
        fix: 'Never log passwords, tokens, or sensitive data',
      },
    ];
  }

  /**
   * A10: SSRF
   */
  static getSSRFRules(): VulnerabilityRule[] {
    return [
      {
        id: 'OWASP-A10-001',
        title: 'Server-Side Request Forgery',
        description: 'Possible SSRF vulnerability',
        severity: 'high',
        pattern: /(fetch|axios|http\.get|request)\([^)]*req\.(body|query|params)/gi,
        languages: ['typescript', 'javascript'],
        cwe: 'CWE-918',
        owasp: 'A10:2021',
        fix: 'Validate and whitelist URLs before making server-side requests',
      },
    ];
  }
}
```

### 2.4 Dependency Scanner (`src/security/scanning/scanners/DependencyScanner.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { SecurityFinding } from '../SecurityScanner';

/**
 * Dependency vulnerability
 */
export interface DependencyVulnerability {
  package: string;
  version: string;
  vulnerability: string;
  severity: SecurityFinding['severity'];
  cve?: string;
  url?: string;
  fixedIn?: string;
}

/**
 * Dependency scan result
 */
export type DependencyScanResult = SecurityFinding[];

/**
 * Dependency security scanner
 * 
 * Note: For production, integrate with BoostSecurity or SafeDep MCP
 */
export class DependencyScanner {
  /**
   * Scan directory for dependency vulnerabilities
   */
  async scan(directory: string): Promise<DependencyScanResult> {
    const findings: SecurityFinding[] = [];

    // Check for package.json
    const packageJsonPath = path.join(directory, 'package.json');
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check against known vulnerable packages
      for (const [pkg, version] of Object.entries(deps)) {
        const vulns = await this.checkPackage(pkg, version as string);
        findings.push(...vulns);
      }
    } catch (error) {
      // No package.json or parse error
    }

    // Check for requirements.txt (Python)
    const requirementsPath = path.join(directory, 'requirements.txt');
    try {
      const content = await fs.readFile(requirementsPath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      
      for (const line of lines) {
        const match = line.match(/^([a-zA-Z0-9-_]+)==?(.+)?$/);
        if (match) {
          const [, pkg, version] = match;
          const vulns = await this.checkPythonPackage(pkg, version);
          findings.push(...vulns);
        }
      }
    } catch (error) {
      // No requirements.txt
    }

    return findings;
  }

  /**
   * Check npm package for vulnerabilities
   */
  private async checkPackage(
    packageName: string, 
    version: string
  ): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Known vulnerable packages (simplified - use npm audit or MCP in production)
    const knownVulnerable: Record<string, DependencyVulnerability[]> = {
      'lodash': [
        {
          package: 'lodash',
          version: '<4.17.21',
          vulnerability: 'Prototype Pollution',
          severity: 'high',
          cve: 'CVE-2021-23337',
          fixedIn: '4.17.21',
        },
      ],
      'axios': [
        {
          package: 'axios',
          version: '<0.21.1',
          vulnerability: 'SSRF vulnerability',
          severity: 'high',
          cve: 'CVE-2021-3749',
          fixedIn: '0.21.1',
        },
      ],
      'express': [
        {
          package: 'express',
          version: '<4.17.3',
          vulnerability: 'Open redirect vulnerability',
          severity: 'medium',
          cve: 'CVE-2022-24999',
          fixedIn: '4.17.3',
        },
      ],
    };

    const vulns = knownVulnerable[packageName];
    if (vulns) {
      for (const vuln of vulns) {
        if (this.isVersionVulnerable(version, vuln.version)) {
          findings.push({
            id: `DEP-${vuln.cve || packageName}`,
            type: 'dependency',
            severity: vuln.severity,
            title: `Vulnerable package: ${packageName}@${version}`,
            description: vuln.vulnerability,
            cwe: vuln.cve,
            fix: vuln.fixedIn 
              ? `Upgrade to version ${vuln.fixedIn} or later`
              : 'Check for updates',
            references: vuln.url ? [vuln.url] : [],
          });
        }
      }
    }

    return findings;
  }

  /**
   * Check Python package for vulnerabilities
   */
  private async checkPythonPackage(
    packageName: string, 
    version?: string
  ): Promise<SecurityFinding[]> {
    // Similar to npm check - simplified version
    return [];
  }

  /**
   * Check if version is vulnerable
   */
  private isVersionVulnerable(
    currentVersion: string, 
    vulnerableVersion: string
  ): boolean {
    // Simple version comparison (use semver in production)
    if (vulnerableVersion.startsWith('<')) {
      const target = vulnerableVersion.substring(1);
      return this.compareVersions(currentVersion, target) < 0;
    }
    return currentVersion === vulnerableVersion;
  }

  /**
   * Compare version strings
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.replace(/[^\d.]/g, '').split('.').map(Number);
    const partsB = b.replace(/[^\d.]/g, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA !== numB) return numA - numB;
    }
    return 0;
  }
}
```

### 2.5 Infrastructure Scanner (`src/security/scanning/scanners/InfraScanner.ts`)

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { SecurityFinding } from '../SecurityScanner';

/**
 * Infrastructure scan result
 */
export type InfraScanResult = SecurityFinding[];

/**
 * Infrastructure (Bicep/ARM) security scanner
 */
export class InfraScanner {
  /**
   * Scan for infrastructure security issues
   */
  async scan(directory: string): Promise<InfraScanResult> {
    const findings: SecurityFinding[] = [];

    // Find Bicep files
    const bicepFiles = await glob('**/*.bicep', {
      cwd: directory,
      ignore: ['**/node_modules/**'],
      absolute: true,
    });

    for (const file of bicepFiles) {
      const fileFindings = await this.scanBicepFile(file);
      findings.push(...fileFindings);
    }

    // Find ARM templates
    const armFiles = await glob('**/azuredeploy*.json', {
      cwd: directory,
      ignore: ['**/node_modules/**'],
      absolute: true,
    });

    for (const file of armFiles) {
      const fileFindings = await this.scanArmFile(file);
      findings.push(...fileFindings);
    }

    return findings;
  }

  /**
   * Scan Bicep file
   */
  private async scanBicepFile(filePath: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Check for hardcoded secrets
        if (/password\s*:\s*'[^']+'/i.test(line)) {
          findings.push({
            id: `BICEP-SEC-001-${lineNum}`,
            type: 'secret',
            severity: 'critical',
            title: 'Hardcoded password in Bicep',
            description: 'Password hardcoded in infrastructure template',
            file: filePath,
            line: lineNum,
            code: line.trim(),
            fix: 'Use Key Vault reference or secure parameter',
          });
        }

        // Check for public blob storage
        if (/publicAccess\s*:\s*'(Container|Blob)'/i.test(line)) {
          findings.push({
            id: `BICEP-SEC-002-${lineNum}`,
            type: 'misconfiguration',
            severity: 'high',
            title: 'Public blob storage access',
            description: 'Storage container allows public access',
            file: filePath,
            line: lineNum,
            code: line.trim(),
            fix: 'Set publicAccess to "None" unless public access is required',
          });
        }

        // Check for HTTP (non-HTTPS)
        if (/httpsOnly\s*:\s*false/i.test(line)) {
          findings.push({
            id: `BICEP-SEC-003-${lineNum}`,
            type: 'misconfiguration',
            severity: 'medium',
            title: 'HTTPS not enforced',
            description: 'Web app allows HTTP connections',
            file: filePath,
            line: lineNum,
            code: line.trim(),
            fix: 'Set httpsOnly to true',
          });
        }

        // Check for missing encryption
        if (/encryption\s*:\s*\{[^}]*enabled\s*:\s*false/i.test(line)) {
          findings.push({
            id: `BICEP-SEC-004-${lineNum}`,
            type: 'misconfiguration',
            severity: 'high',
            title: 'Encryption disabled',
            description: 'Resource encryption is disabled',
            file: filePath,
            line: lineNum,
            code: line.trim(),
            fix: 'Enable encryption at rest',
          });
        }

        // Check for overly permissive network rules
        if (/ipRules\s*:\s*\[\s*\]|virtualNetworkRules\s*:\s*\[\s*\]/i.test(line)) {
          findings.push({
            id: `BICEP-SEC-005-${lineNum}`,
            type: 'misconfiguration',
            severity: 'medium',
            title: 'Empty network rules',
            description: 'No network restrictions configured',
            file: filePath,
            line: lineNum,
            code: line.trim(),
            fix: 'Add IP or virtual network rules to restrict access',
          });
        }

        // Check for admin username
        if (/adminUsername\s*:\s*'(admin|root|administrator)'/i.test(line)) {
          findings.push({
            id: `BICEP-SEC-006-${lineNum}`,
            type: 'misconfiguration',
            severity: 'low',
            title: 'Default admin username',
            description: 'Using common admin username',
            file: filePath,
            line: lineNum,
            code: line.trim(),
            fix: 'Use a unique admin username',
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to scan Bicep file ${filePath}:`, error);
    }

    return findings;
  }

  /**
   * Scan ARM template
   */
  private async scanArmFile(filePath: string): Promise<SecurityFinding[]> {
    // Similar checks for ARM templates
    return [];
  }
}
```

---

## 🔌 MCP Integration

### BoostSecurity MCP

```typescript
// src/security/mcp/BoostSecurityMCP.ts

import { MCPClient } from '../../mcp/MCPClient';
import { SecurityFinding } from '../scanning/SecurityScanner';

/**
 * BoostSecurity MCP integration
 * Provides dependency vulnerability scanning
 */
export class BoostSecurityMCP {
  private client: MCPClient;

  constructor() {
    this.client = new MCPClient('boostsecurity');
  }

  /**
   * Scan dependencies for vulnerabilities
   */
  async scanDependencies(directory: string): Promise<SecurityFinding[]> {
    const result = await this.client.call('scan_dependencies', {
      path: directory,
      include_transitive: true,
    });

    return result.vulnerabilities.map((v: any) => ({
      id: v.id,
      type: 'dependency' as const,
      severity: this.mapSeverity(v.severity),
      title: `${v.package}@${v.version}: ${v.title}`,
      description: v.description,
      cwe: v.cve,
      fix: v.fixed_version ? `Upgrade to ${v.fixed_version}` : 'No fix available',
      references: v.references,
    }));
  }

  /**
   * Check for malware in dependencies
   */
  async checkMalware(directory: string): Promise<SecurityFinding[]> {
    const result = await this.client.call('check_malware', {
      path: directory,
    });

    return result.findings.map((f: any) => ({
      id: f.id,
      type: 'dependency' as const,
      severity: 'critical' as const,
      title: `Malware detected: ${f.package}`,
      description: f.description,
      fix: 'Remove this package immediately',
    }));
  }

  private mapSeverity(severity: string): SecurityFinding['severity'] {
    const mapping: Record<string, SecurityFinding['severity']> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
    };
    return mapping[severity.toLowerCase()] || 'medium';
  }
}
```

---

## 📋 Acceptance Criteria

- [ ] Code scanner detects OWASP Top 10 issues
- [ ] Dependency scanner finds vulnerable packages
- [ ] Infrastructure scanner checks Bicep templates
- [ ] Config scanner detects exposed secrets
- [ ] Scan results are aggregated correctly
- [ ] MCP integration ready for BoostSecurity/SafeDep
- [ ] Severity levels are accurate

---

## 🔗 Navigation

← [01-PHASE-SECRETS-MANAGEMENT.md](01-PHASE-SECRETS-MANAGEMENT.md) | [03-PHASE-AUDIT-LOGGING.md](03-PHASE-AUDIT-LOGGING.md) →
