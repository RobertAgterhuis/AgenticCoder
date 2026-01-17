/**
 * SecretDetector.ts
 * Detects secrets/credentials in code and text
 */

export interface DetectionResult {
  found: boolean;
  matches: SecretMatch[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface SecretMatch {
  type: string;
  pattern: string;
  line: number;
  column: number;
  value: string;
  masked: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export class SecretDetector {
  private patterns: SecretPattern[] = [
    // API Keys
    { name: 'Generic API Key', pattern: /api[_-]?key\s*[:=]\s*['"]([^'"]{20,})['"]/, severity: 'high', description: 'Generic API key detected' },
    { name: 'Generic Secret', pattern: /secret\s*[:=]\s*['"]([^'"]{10,})['"]/, severity: 'high', description: 'Generic secret detected' },
    
    // Cloud Providers
    { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/, severity: 'critical', description: 'AWS Access Key ID' },
    { name: 'AWS Secret Key', pattern: /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*['"]([^'"]{40})['"]/, severity: 'critical', description: 'AWS Secret Access Key' },
    { name: 'Azure Connection String', pattern: /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[^;]+/, severity: 'critical', description: 'Azure Storage connection string' },
    { name: 'Azure SAS Token', pattern: /sv=\d{4}-\d{2}-\d{2}&s[a-z]=[^&]+&sig=[^&]+/, severity: 'high', description: 'Azure SAS token' },
    
    // Version Control
    { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/, severity: 'critical', description: 'GitHub Personal Access Token' },
    { name: 'GitHub OAuth', pattern: /gho_[a-zA-Z0-9]{36}/, severity: 'critical', description: 'GitHub OAuth Token' },
    { name: 'GitLab Token', pattern: /glpat-[a-zA-Z0-9\-_]{20}/, severity: 'critical', description: 'GitLab Personal Access Token' },
    
    // Database
    { name: 'Database URL', pattern: /(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^/]+/, severity: 'critical', description: 'Database connection URL with credentials' },
    { name: 'Password in URL', pattern: /password=([^&\s]{8,})/, severity: 'high', description: 'Password in URL parameter' },
    
    // Certificates & Keys
    { name: 'Private Key', pattern: /-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/, severity: 'critical', description: 'Private key detected' },
    { name: 'PGP Private Key', pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/, severity: 'critical', description: 'PGP private key' },
    
    // JWT & Tokens
    { name: 'JWT Token', pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/, severity: 'medium', description: 'JWT token (may contain sensitive claims)' },
    { name: 'Bearer Token', pattern: /Bearer\s+[a-zA-Z0-9\-_.~+/]+=*/, severity: 'medium', description: 'Bearer token in header' },
    
    // Common Passwords
    { name: 'Hardcoded Password', pattern: /password\s*[:=]\s*['"]([^'"]{8,})['"]/, severity: 'high', description: 'Hardcoded password' },
    { name: 'Admin Password', pattern: /admin[_-]?password\s*[:=]\s*['"]([^'"]+)['"]/, severity: 'critical', description: 'Admin password detected' },
    
    // Slack
    { name: 'Slack Token', pattern: /xox[baprs]-[0-9a-zA-Z]{10,48}/, severity: 'high', description: 'Slack API token' },
    { name: 'Slack Webhook', pattern: /hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/, severity: 'high', description: 'Slack webhook URL' },
    
    // Stripe
    { name: 'Stripe Secret Key', pattern: /sk_live_[0-9a-zA-Z]{24}/, severity: 'critical', description: 'Stripe live secret key' },
    { name: 'Stripe Restricted Key', pattern: /rk_live_[0-9a-zA-Z]{24}/, severity: 'high', description: 'Stripe restricted API key' },
    
    // SendGrid
    { name: 'SendGrid API Key', pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/, severity: 'high', description: 'SendGrid API key' },
    
    // Twilio
    { name: 'Twilio API Key', pattern: /SK[a-f0-9]{32}/, severity: 'high', description: 'Twilio API key' },
    
    // npm
    { name: 'npm Token', pattern: /npm_[a-zA-Z0-9]{36}/, severity: 'high', description: 'npm access token' },
  ];

  addPattern(pattern: SecretPattern): void {
    this.patterns.push(pattern);
  }

  detect(content: string): DetectionResult {
    const matches: SecretMatch[] = [];
    const lines = content.split('\n');
    
    for (const pattern of this.patterns) {
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        const match = pattern.pattern.exec(line);
        
        if (match) {
          const value = match[1] || match[0];
          matches.push({
            type: pattern.name,
            pattern: pattern.pattern.source,
            line: lineNum + 1,
            column: match.index + 1,
            value: value.substring(0, 10) + '...',
            masked: this.maskValue(value),
            severity: pattern.severity,
          });
        }
      }
    }

    const severity = this.calculateOverallSeverity(matches);
    
    return {
      found: matches.length > 0,
      matches,
      severity,
    };
  }

  private maskValue(value: string): string {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  }

  private calculateOverallSeverity(matches: SecretMatch[]): 'critical' | 'high' | 'medium' | 'low' {
    if (matches.some(m => m.severity === 'critical')) return 'critical';
    if (matches.some(m => m.severity === 'high')) return 'high';
    if (matches.some(m => m.severity === 'medium')) return 'medium';
    return 'low';
  }

  scanFile(content: string, filename: string): DetectionResult & { filename: string } {
    const result = this.detect(content);
    return { ...result, filename };
  }

  scanFiles(files: Array<{ name: string; content: string }>): Array<DetectionResult & { filename: string }> {
    return files.map(f => this.scanFile(f.content, f.name));
  }
}

export default SecretDetector;
