/**
 * InfraScanner.ts
 * Security scanner for Bicep/ARM templates
 */

export interface InfraVulnerability {
  id: string;
  resource: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  line?: number;
  remediation: string;
  policy?: string;
}

export interface InfraScanResult {
  file: string;
  resources: number;
  vulnerabilities: InfraVulnerability[];
  score: number;
  passed: boolean;
}

interface InfraRule {
  id: string;
  severity: InfraVulnerability['severity'];
  title: string;
  pattern: RegExp;
  description: string;
  remediation: string;
  policy?: string;
}

export class InfraScanner {
  private rules: InfraRule[] = [
    // Storage Account
    {
      id: 'INFRA001',
      severity: 'high',
      title: 'Storage Account HTTP Access Enabled',
      pattern: /supportsHttpsTrafficOnly\s*:\s*false/i,
      description: 'Storage account allows insecure HTTP connections',
      remediation: 'Set supportsHttpsTrafficOnly to true',
      policy: 'Azure.Storage.SecureTransfer',
    },
    {
      id: 'INFRA002',
      severity: 'medium',
      title: 'Storage Account Public Access',
      pattern: /allowBlobPublicAccess\s*:\s*true/i,
      description: 'Storage account allows public blob access',
      remediation: 'Set allowBlobPublicAccess to false unless required',
      policy: 'Azure.Storage.PublicAccess',
    },
    {
      id: 'INFRA003',
      severity: 'high',
      title: 'Storage Account Missing Encryption',
      pattern: /encryption\s*:\s*\{\s*\}/,
      description: 'Storage account encryption not properly configured',
      remediation: 'Configure encryption with customer-managed keys',
    },

    // Key Vault
    {
      id: 'INFRA004',
      severity: 'critical',
      title: 'Key Vault Soft Delete Disabled',
      pattern: /enableSoftDelete\s*:\s*false/i,
      description: 'Key Vault soft delete is disabled',
      remediation: 'Enable soft delete for Key Vault',
      policy: 'Azure.KeyVault.SoftDelete',
    },
    {
      id: 'INFRA005',
      severity: 'high',
      title: 'Key Vault Purge Protection Disabled',
      pattern: /enablePurgeProtection\s*:\s*false/i,
      description: 'Key Vault purge protection is disabled',
      remediation: 'Enable purge protection for production Key Vaults',
      policy: 'Azure.KeyVault.PurgeProtection',
    },
    {
      id: 'INFRA006',
      severity: 'medium',
      title: 'Key Vault Public Network Access',
      pattern: /publicNetworkAccess\s*:\s*['"]Enabled['"]/i,
      description: 'Key Vault is publicly accessible',
      remediation: 'Use private endpoints for Key Vault access',
    },

    // SQL Database
    {
      id: 'INFRA007',
      severity: 'critical',
      title: 'SQL Server Admin Password Hardcoded',
      pattern: /administratorLoginPassword\s*:\s*['"][^'"]+['"]/,
      description: 'SQL Server admin password appears hardcoded',
      remediation: 'Use Key Vault reference or secure parameters',
    },
    {
      id: 'INFRA008',
      severity: 'high',
      title: 'SQL TDE Not Enabled',
      pattern: /transparentDataEncryption\s*:\s*['"]Disabled['"]/i,
      description: 'Transparent Data Encryption is disabled',
      remediation: 'Enable TDE for SQL databases',
      policy: 'Azure.SQL.TDE',
    },
    {
      id: 'INFRA009',
      severity: 'high',
      title: 'SQL Firewall Allow All Azure',
      pattern: /startIpAddress\s*:\s*['"]0\.0\.0\.0['"].*endIpAddress\s*:\s*['"]0\.0\.0\.0['"]/s,
      description: 'SQL allows all Azure services (0.0.0.0)',
      remediation: 'Restrict to specific IP ranges or use private endpoints',
    },

    // App Service
    {
      id: 'INFRA010',
      severity: 'high',
      title: 'App Service HTTPS Only Disabled',
      pattern: /httpsOnly\s*:\s*false/i,
      description: 'App Service does not enforce HTTPS',
      remediation: 'Set httpsOnly to true',
      policy: 'Azure.AppService.HttpsOnly',
    },
    {
      id: 'INFRA011',
      severity: 'medium',
      title: 'App Service FTP Enabled',
      pattern: /ftpsState\s*:\s*['"]AllAllowed['"]/i,
      description: 'FTP access is enabled on App Service',
      remediation: 'Set ftpsState to FtpsOnly or Disabled',
    },
    {
      id: 'INFRA012',
      severity: 'medium',
      title: 'App Service Outdated TLS',
      pattern: /minTlsVersion\s*:\s*['"]1\.[01]['"]/i,
      description: 'App Service using TLS version < 1.2',
      remediation: 'Set minTlsVersion to 1.2 or higher',
    },

    // Network
    {
      id: 'INFRA013',
      severity: 'critical',
      title: 'NSG Allow All Inbound',
      pattern: /sourceAddressPrefix\s*:\s*['"]\*['"].*access\s*:\s*['"]Allow['"]/s,
      description: 'NSG rule allows all inbound traffic',
      remediation: 'Restrict source addresses to specific IPs or ranges',
    },
    {
      id: 'INFRA014',
      severity: 'high',
      title: 'NSG SSH Open to Internet',
      pattern: /destinationPortRange\s*:\s*['"]22['"].*sourceAddressPrefix\s*:\s*['"]\*['"]/s,
      description: 'SSH port open to internet',
      remediation: 'Restrict SSH access to specific IPs or use Bastion',
    },
    {
      id: 'INFRA015',
      severity: 'high',
      title: 'NSG RDP Open to Internet',
      pattern: /destinationPortRange\s*:\s*['"]3389['"].*sourceAddressPrefix\s*:\s*['"]\*['"]/s,
      description: 'RDP port open to internet',
      remediation: 'Restrict RDP access to specific IPs or use Bastion',
    },

    // Container
    {
      id: 'INFRA016',
      severity: 'high',
      title: 'Container Registry Admin Enabled',
      pattern: /adminUserEnabled\s*:\s*true/i,
      description: 'Container Registry admin user is enabled',
      remediation: 'Disable admin user, use Azure AD authentication',
    },

    // General
    {
      id: 'INFRA017',
      severity: 'medium',
      title: 'Resource Missing Tags',
      pattern: /tags\s*:\s*\{\s*\}/,
      description: 'Resource has empty tags',
      remediation: 'Add required tags for governance (environment, owner, costCenter)',
    },
  ];

  addRule(rule: InfraRule): void {
    this.rules.push(rule);
  }

  scan(content: string, filename: string): InfraScanResult {
    const vulnerabilities: InfraVulnerability[] = [];
    const lines = content.split('\n');
    const resourceCount = (content.match(/resource\s+\w+/g) || []).length;

    for (const rule of this.rules) {
      const match = rule.pattern.exec(content);
      if (match) {
        // Find line number
        let lineNum = 1;
        let pos = 0;
        for (let i = 0; i < lines.length; i++) {
          pos += lines[i].length + 1;
          if (pos >= match.index) {
            lineNum = i + 1;
            break;
          }
        }

        vulnerabilities.push({
          id: rule.id,
          resource: this.extractResourceName(content, match.index),
          severity: rule.severity,
          title: rule.title,
          description: rule.description,
          line: lineNum,
          remediation: rule.remediation,
          policy: rule.policy,
        });
      }
    }

    const score = this.calculateScore(vulnerabilities);

    return {
      file: filename,
      resources: resourceCount,
      vulnerabilities,
      score,
      passed: score >= 70,
    };
  }

  private extractResourceName(content: string, position: number): string {
    // Find the nearest resource declaration before the match
    const beforeMatch = content.substring(0, position);
    const resourceMatch = beforeMatch.match(/resource\s+(\w+)/g);
    if (resourceMatch && resourceMatch.length > 0) {
      const lastResource = resourceMatch[resourceMatch.length - 1];
      return lastResource.replace('resource ', '');
    }
    return 'unknown';
  }

  private calculateScore(vulnerabilities: InfraVulnerability[]): number {
    if (vulnerabilities.length === 0) return 100;

    let penalty = 0;
    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical': penalty += 25; break;
        case 'high': penalty += 15; break;
        case 'medium': penalty += 8; break;
        case 'low': penalty += 3; break;
      }
    }

    return Math.max(0, 100 - penalty);
  }

  scanFiles(files: Array<{ name: string; content: string }>): InfraScanResult[] {
    return files
      .filter(f => f.name.endsWith('.bicep') || f.name.endsWith('.json'))
      .map(f => this.scan(f.content, f.name));
  }
}

export default InfraScanner;
