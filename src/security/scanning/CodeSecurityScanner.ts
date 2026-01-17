/**
 * CodeSecurityScanner.ts
 * SAST scanner for generated code - detects security vulnerabilities
 */

export interface ScanResult {
  file: string;
  vulnerabilities: Vulnerability[];
  score: number;  // 0-100 (100 = no issues)
  passed: boolean;
}

export interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  line?: number;
  column?: number;
  code?: string;
  cwe?: string;
  owasp?: string;
  remediation: string;
}

export type VulnerabilityType = 
  | 'injection'
  | 'xss'
  | 'auth-bypass'
  | 'sensitive-data'
  | 'misconfiguration'
  | 'insecure-crypto'
  | 'hardcoded-secret'
  | 'path-traversal'
  | 'open-redirect'
  | 'ssrf'
  | 'xxe'
  | 'insecure-deserialization';

interface SecurityRule {
  id: string;
  type: VulnerabilityType;
  severity: Vulnerability['severity'];
  title: string;
  pattern: RegExp;
  filePattern?: RegExp;
  description: string;
  cwe?: string;
  owasp?: string;
  remediation: string;
}

export class CodeSecurityScanner {
  private rules: SecurityRule[] = [
    // SQL Injection
    {
      id: 'SEC001',
      type: 'injection',
      severity: 'critical',
      title: 'Potential SQL Injection',
      pattern: /(\$\{.*\}|`.*\$\{.*\}`)\s*(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/i,
      description: 'String interpolation in SQL query may lead to SQL injection',
      cwe: 'CWE-89',
      owasp: 'A03:2021',
      remediation: 'Use parameterized queries or prepared statements',
    },
    {
      id: 'SEC002',
      type: 'injection',
      severity: 'critical',
      title: 'SQL Query with String Concatenation',
      pattern: /query\s*\(\s*['"`].*\+.*['"`]\s*\)/i,
      description: 'SQL query built with string concatenation',
      cwe: 'CWE-89',
      owasp: 'A03:2021',
      remediation: 'Use parameterized queries instead of string concatenation',
    },
    
    // XSS
    {
      id: 'SEC003',
      type: 'xss',
      severity: 'high',
      title: 'Potential XSS - innerHTML',
      pattern: /\.innerHTML\s*=/,
      filePattern: /\.(js|jsx|ts|tsx)$/,
      description: 'Direct innerHTML assignment can lead to XSS',
      cwe: 'CWE-79',
      owasp: 'A03:2021',
      remediation: 'Use textContent or sanitize input before using innerHTML',
    },
    {
      id: 'SEC004',
      type: 'xss',
      severity: 'high',
      title: 'Potential XSS - dangerouslySetInnerHTML',
      pattern: /dangerouslySetInnerHTML/,
      filePattern: /\.(jsx|tsx)$/,
      description: 'dangerouslySetInnerHTML can lead to XSS if not properly sanitized',
      cwe: 'CWE-79',
      owasp: 'A03:2021',
      remediation: 'Sanitize HTML content with DOMPurify before rendering',
    },
    
    // Authentication
    {
      id: 'SEC005',
      type: 'auth-bypass',
      severity: 'critical',
      title: 'Hardcoded JWT Secret',
      pattern: /jwt\.sign\([^)]*,\s*['"][^'"]{10,}['"]/i,
      description: 'JWT secret appears to be hardcoded',
      cwe: 'CWE-798',
      owasp: 'A02:2021',
      remediation: 'Store JWT secrets in environment variables or key vault',
    },
    {
      id: 'SEC006',
      type: 'auth-bypass',
      severity: 'high',
      title: 'Weak Password Hashing',
      pattern: /(md5|sha1)\s*\(/i,
      description: 'MD5/SHA1 are weak hashing algorithms for passwords',
      cwe: 'CWE-328',
      owasp: 'A02:2021',
      remediation: 'Use bcrypt, scrypt, or Argon2 for password hashing',
    },
    
    // Sensitive Data
    {
      id: 'SEC007',
      type: 'sensitive-data',
      severity: 'medium',
      title: 'Sensitive Data in Console Log',
      pattern: /console\.(log|info|debug)\s*\([^)]*password/i,
      description: 'Password may be logged to console',
      cwe: 'CWE-532',
      owasp: 'A09:2021',
      remediation: 'Never log sensitive data like passwords',
    },
    {
      id: 'SEC008',
      type: 'sensitive-data',
      severity: 'high',
      title: 'Sensitive Data in Error Message',
      pattern: /throw\s+new\s+Error\s*\([^)]*password/i,
      description: 'Password may be exposed in error message',
      cwe: 'CWE-209',
      owasp: 'A09:2021',
      remediation: 'Do not include sensitive data in error messages',
    },
    
    // Misconfiguration
    {
      id: 'SEC009',
      type: 'misconfiguration',
      severity: 'medium',
      title: 'Debug Mode Enabled',
      pattern: /debug\s*[:=]\s*(true|1|['"]true['"])/i,
      description: 'Debug mode should be disabled in production',
      cwe: 'CWE-489',
      owasp: 'A05:2021',
      remediation: 'Disable debug mode in production environments',
    },
    {
      id: 'SEC010',
      type: 'misconfiguration',
      severity: 'high',
      title: 'CORS Allow All Origins',
      pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]/i,
      description: 'CORS allowing all origins is insecure',
      cwe: 'CWE-942',
      owasp: 'A05:2021',
      remediation: 'Specify allowed origins explicitly',
    },
    
    // Path Traversal
    {
      id: 'SEC011',
      type: 'path-traversal',
      severity: 'high',
      title: 'Potential Path Traversal',
      pattern: /path\.(join|resolve)\s*\([^)]*req\.(params|query|body)/i,
      description: 'User input used directly in file path',
      cwe: 'CWE-22',
      owasp: 'A01:2021',
      remediation: 'Validate and sanitize file paths, use path.basename',
    },
    
    // Insecure Crypto
    {
      id: 'SEC012',
      type: 'insecure-crypto',
      severity: 'high',
      title: 'Weak Encryption Algorithm',
      pattern: /createCipher(iv)?\s*\(\s*['"]des(-ede)?['"]/i,
      description: 'DES is a weak encryption algorithm',
      cwe: 'CWE-327',
      owasp: 'A02:2021',
      remediation: 'Use AES-256-GCM or ChaCha20-Poly1305',
    },
    {
      id: 'SEC013',
      type: 'insecure-crypto',
      severity: 'medium',
      title: 'Math.random for Security',
      pattern: /Math\.random\s*\(\s*\)/,
      description: 'Math.random() is not cryptographically secure',
      cwe: 'CWE-338',
      owasp: 'A02:2021',
      remediation: 'Use crypto.randomBytes() for security-sensitive operations',
    },
    
    // SSRF
    {
      id: 'SEC014',
      type: 'ssrf',
      severity: 'high',
      title: 'Potential SSRF',
      pattern: /(fetch|axios|request)\s*\(\s*(req\.(params|query|body)|user(Input)?)/i,
      description: 'User input used directly in HTTP request URL',
      cwe: 'CWE-918',
      owasp: 'A10:2021',
      remediation: 'Validate and whitelist allowed URLs',
    },
    
    // Hardcoded Secrets
    {
      id: 'SEC015',
      type: 'hardcoded-secret',
      severity: 'critical',
      title: 'Hardcoded API Key',
      pattern: /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/i,
      description: 'API key appears to be hardcoded',
      cwe: 'CWE-798',
      owasp: 'A02:2021',
      remediation: 'Store API keys in environment variables or secrets manager',
    },
  ];

  addRule(rule: SecurityRule): void {
    this.rules.push(rule);
  }

  scan(content: string, filename: string): ScanResult {
    const vulnerabilities: Vulnerability[] = [];
    const lines = content.split('\n');

    for (const rule of this.rules) {
      // Check file pattern if specified
      if (rule.filePattern && !rule.filePattern.test(filename)) {
        continue;
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = rule.pattern.exec(line);

        if (match) {
          vulnerabilities.push({
            id: rule.id,
            type: rule.type,
            severity: rule.severity,
            title: rule.title,
            description: rule.description,
            line: i + 1,
            column: match.index + 1,
            code: line.trim(),
            cwe: rule.cwe,
            owasp: rule.owasp,
            remediation: rule.remediation,
          });
        }
      }
    }

    const score = this.calculateScore(vulnerabilities);

    return {
      file: filename,
      vulnerabilities,
      score,
      passed: score >= 70,  // Pass if score is 70 or above
    };
  }

  private calculateScore(vulnerabilities: Vulnerability[]): number {
    if (vulnerabilities.length === 0) return 100;

    let penalty = 0;
    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical': penalty += 25; break;
        case 'high': penalty += 15; break;
        case 'medium': penalty += 8; break;
        case 'low': penalty += 3; break;
        case 'info': penalty += 1; break;
      }
    }

    return Math.max(0, 100 - penalty);
  }

  scanFiles(files: Array<{ name: string; content: string }>): ScanResult[] {
    return files.map(f => this.scan(f.content, f.name));
  }

  generateReport(results: ScanResult[]): SecurityReport {
    const totalVulns = results.reduce((sum, r) => sum + r.vulnerabilities.length, 0);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const result of results) {
      for (const vuln of result.vulnerabilities) {
        bySeverity[vuln.severity]++;
      }
    }

    return {
      summary: {
        totalFiles: results.length,
        totalVulnerabilities: totalVulns,
        averageScore: Math.round(avgScore),
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
      },
      bySeverity,
      results,
    };
  }
}

export interface SecurityReport {
  summary: {
    totalFiles: number;
    totalVulnerabilities: number;
    averageScore: number;
    passed: number;
    failed: number;
  };
  bySeverity: Record<Vulnerability['severity'], number>;
  results: ScanResult[];
}

export default CodeSecurityScanner;
