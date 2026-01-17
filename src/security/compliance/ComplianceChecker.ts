/**
 * ComplianceChecker.ts
 * Checks code compliance against security standards (OWASP, GDPR, etc.)
 */

export interface ComplianceResult {
  standard: string;
  passed: boolean;
  score: number;
  checks: ComplianceCheck[];
}

export interface ComplianceCheck {
  id: string;
  name: string;
  standard: string;
  category: string;
  passed: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence?: string;
  remediation?: string;
}

export type ComplianceStandard = 'OWASP' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'SOC2';

interface ComplianceRule {
  id: string;
  name: string;
  standard: ComplianceStandard;
  category: string;
  severity: ComplianceCheck['severity'];
  check: (content: string, filename: string) => { passed: boolean; evidence?: string };
  description: string;
  remediation: string;
}

export class ComplianceChecker {
  private rules: ComplianceRule[] = [
    // OWASP Top 10 2021
    {
      id: 'OWASP-A01',
      name: 'Broken Access Control',
      standard: 'OWASP',
      category: 'Access Control',
      severity: 'critical',
      check: (content) => ({
        passed: !content.includes('isAdmin: true') && 
                !content.match(/role\s*[:=]\s*['"]admin['"]/i),
        evidence: 'Hardcoded admin role detected',
      }),
      description: 'Checks for hardcoded admin privileges',
      remediation: 'Implement proper role-based access control (RBAC)',
    },
    {
      id: 'OWASP-A02',
      name: 'Cryptographic Failures',
      standard: 'OWASP',
      category: 'Cryptography',
      severity: 'high',
      check: (content) => ({
        passed: !content.match(/(md5|sha1)\s*\(/i) &&
                !content.includes('createCipher('),
        evidence: 'Weak cryptographic algorithm detected',
      }),
      description: 'Checks for weak cryptographic algorithms',
      remediation: 'Use strong algorithms: AES-256-GCM, SHA-256+, bcrypt',
    },
    {
      id: 'OWASP-A03',
      name: 'Injection',
      standard: 'OWASP',
      category: 'Input Validation',
      severity: 'critical',
      check: (content) => ({
        passed: !content.match(/\$\{.*\}\s*(SELECT|INSERT|UPDATE|DELETE)/i),
        evidence: 'Potential SQL injection detected',
      }),
      description: 'Checks for injection vulnerabilities',
      remediation: 'Use parameterized queries and input validation',
    },
    {
      id: 'OWASP-A04',
      name: 'Insecure Design',
      standard: 'OWASP',
      category: 'Design',
      severity: 'medium',
      check: (content) => ({
        passed: content.includes('validate') || content.includes('sanitize'),
        evidence: 'No validation/sanitization found',
      }),
      description: 'Checks for secure design patterns',
      remediation: 'Implement input validation and output encoding',
    },
    {
      id: 'OWASP-A05',
      name: 'Security Misconfiguration',
      standard: 'OWASP',
      category: 'Configuration',
      severity: 'high',
      check: (content) => ({
        passed: !content.match(/debug\s*[:=]\s*true/i) &&
                !content.includes('allowAll'),
        evidence: 'Insecure configuration detected',
      }),
      description: 'Checks for security misconfigurations',
      remediation: 'Disable debug mode, restrict access policies',
    },
    {
      id: 'OWASP-A07',
      name: 'Identification and Authentication Failures',
      standard: 'OWASP',
      category: 'Authentication',
      severity: 'high',
      check: (content) => ({
        passed: !content.match(/password\s*[:=]\s*['"][^'"]{0,7}['"]/i),
        evidence: 'Weak password policy detected',
      }),
      description: 'Checks for authentication weaknesses',
      remediation: 'Implement strong password policies and MFA',
    },
    {
      id: 'OWASP-A09',
      name: 'Security Logging and Monitoring Failures',
      standard: 'OWASP',
      category: 'Logging',
      severity: 'medium',
      check: (content) => ({
        passed: !content.match(/console\.log\s*\([^)]*password/i),
        evidence: 'Sensitive data in logs detected',
      }),
      description: 'Checks for insecure logging practices',
      remediation: 'Never log sensitive data, implement audit logging',
    },

    // GDPR
    {
      id: 'GDPR-01',
      name: 'Personal Data Encryption',
      standard: 'GDPR',
      category: 'Data Protection',
      severity: 'critical',
      check: (content, filename) => ({
        passed: !filename.includes('user') || content.includes('encrypt'),
        evidence: 'User data may not be encrypted',
      }),
      description: 'Checks for personal data encryption',
      remediation: 'Encrypt all personal data at rest and in transit',
    },
    {
      id: 'GDPR-02',
      name: 'Data Minimization',
      standard: 'GDPR',
      category: 'Data Collection',
      severity: 'medium',
      check: (content) => ({
        passed: !content.match(/collect.*all|store.*everything/i),
        evidence: 'Excessive data collection detected',
      }),
      description: 'Checks for data minimization principles',
      remediation: 'Collect only necessary data for specific purposes',
    },
    {
      id: 'GDPR-03',
      name: 'Consent Management',
      standard: 'GDPR',
      category: 'Consent',
      severity: 'high',
      check: (content, filename) => ({
        passed: !filename.includes('user') || 
                content.includes('consent') || 
                content.includes('gdpr'),
        evidence: 'No consent mechanism found',
      }),
      description: 'Checks for consent management',
      remediation: 'Implement explicit consent collection and management',
    },

    // PCI-DSS (for payment processing)
    {
      id: 'PCI-01',
      name: 'Cardholder Data Protection',
      standard: 'PCI-DSS',
      category: 'Data Protection',
      severity: 'critical',
      check: (content) => ({
        passed: !content.match(/cardNumber|cvv|creditCard/i) ||
                content.includes('encrypt') || content.includes('tokenize'),
        evidence: 'Unprotected card data detected',
      }),
      description: 'Checks for cardholder data protection',
      remediation: 'Encrypt or tokenize all cardholder data',
    },
    {
      id: 'PCI-02',
      name: 'No Card Storage',
      standard: 'PCI-DSS',
      category: 'Data Storage',
      severity: 'critical',
      check: (content) => ({
        passed: !content.match(/store.*cvv|save.*cvv|database.*cvv/i),
        evidence: 'CVV storage detected',
      }),
      description: 'Checks that CVV is not stored',
      remediation: 'Never store CVV/CVC after authorization',
    },
  ];

  addRule(rule: ComplianceRule): void {
    this.rules.push(rule);
  }

  check(content: string, filename: string, standards?: ComplianceStandard[]): ComplianceResult[] {
    const results: Map<ComplianceStandard, ComplianceResult> = new Map();
    
    const applicableRules = standards 
      ? this.rules.filter(r => standards.includes(r.standard))
      : this.rules;

    for (const rule of applicableRules) {
      const result = rule.check(content, filename);
      
      if (!results.has(rule.standard)) {
        results.set(rule.standard, {
          standard: rule.standard,
          passed: true,
          score: 100,
          checks: [],
        });
      }

      const standardResult = results.get(rule.standard)!;
      
      standardResult.checks.push({
        id: rule.id,
        name: rule.name,
        standard: rule.standard,
        category: rule.category,
        passed: result.passed,
        severity: rule.severity,
        description: rule.description,
        evidence: result.passed ? undefined : result.evidence,
        remediation: result.passed ? undefined : rule.remediation,
      });

      if (!result.passed) {
        standardResult.passed = false;
        // Reduce score based on severity
        switch (rule.severity) {
          case 'critical': standardResult.score -= 25; break;
          case 'high': standardResult.score -= 15; break;
          case 'medium': standardResult.score -= 8; break;
          case 'low': standardResult.score -= 3; break;
        }
      }
    }

    // Ensure scores don't go below 0
    for (const result of results.values()) {
      result.score = Math.max(0, result.score);
    }

    return Array.from(results.values());
  }

  checkFiles(
    files: Array<{ name: string; content: string }>,
    standards?: ComplianceStandard[]
  ): {
    summary: { standard: string; passed: boolean; avgScore: number }[];
    details: Array<{ file: string; results: ComplianceResult[] }>;
  } {
    const details = files.map(f => ({
      file: f.name,
      results: this.check(f.content, f.name, standards),
    }));

    // Aggregate by standard
    const byStandard: Map<string, { scores: number[]; passed: boolean[] }> = new Map();
    
    for (const detail of details) {
      for (const result of detail.results) {
        if (!byStandard.has(result.standard)) {
          byStandard.set(result.standard, { scores: [], passed: [] });
        }
        const agg = byStandard.get(result.standard)!;
        agg.scores.push(result.score);
        agg.passed.push(result.passed);
      }
    }

    const summary = Array.from(byStandard.entries()).map(([standard, agg]) => ({
      standard,
      passed: agg.passed.every(p => p),
      avgScore: Math.round(agg.scores.reduce((a, b) => a + b, 0) / agg.scores.length),
    }));

    return { summary, details };
  }
}

export default ComplianceChecker;
