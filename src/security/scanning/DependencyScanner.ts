/**
 * DependencyScanner.ts
 * Scans dependencies for known vulnerabilities
 */

export interface DependencyVulnerability {
  package: string;
  version: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cve?: string;
  title: string;
  description: string;
  fixedIn?: string;
  url?: string;
}

export interface DependencyScanResult {
  file: string;
  dependencies: number;
  vulnerabilities: DependencyVulnerability[];
  passed: boolean;
}

// Known vulnerable versions (in production would use a vulnerability database)
const KNOWN_VULNERABILITIES: Array<{
  package: string;
  affectedVersions: string;
  severity: DependencyVulnerability['severity'];
  cve?: string;
  title: string;
  description: string;
  fixedIn: string;
}> = [
  {
    package: 'lodash',
    affectedVersions: '<4.17.21',
    severity: 'high',
    cve: 'CVE-2021-23337',
    title: 'Command Injection',
    description: 'Lodash vulnerable to command injection via template function',
    fixedIn: '4.17.21',
  },
  {
    package: 'axios',
    affectedVersions: '<0.21.1',
    severity: 'high',
    cve: 'CVE-2020-28168',
    title: 'SSRF Vulnerability',
    description: 'Server-Side Request Forgery in axios',
    fixedIn: '0.21.1',
  },
  {
    package: 'express',
    affectedVersions: '<4.17.3',
    severity: 'medium',
    cve: 'CVE-2022-24999',
    title: 'Open Redirect',
    description: 'Open redirect vulnerability in Express',
    fixedIn: '4.17.3',
  },
  {
    package: 'jsonwebtoken',
    affectedVersions: '<9.0.0',
    severity: 'high',
    cve: 'CVE-2022-23529',
    title: 'Arbitrary Code Execution',
    description: 'Insecure handling of JsonWebToken claims',
    fixedIn: '9.0.0',
  },
  {
    package: 'minimist',
    affectedVersions: '<1.2.6',
    severity: 'critical',
    cve: 'CVE-2021-44906',
    title: 'Prototype Pollution',
    description: 'Prototype pollution vulnerability',
    fixedIn: '1.2.6',
  },
  {
    package: 'node-fetch',
    affectedVersions: '<2.6.7',
    severity: 'high',
    cve: 'CVE-2022-0235',
    title: 'Information Disclosure',
    description: 'Exposure of sensitive information',
    fixedIn: '2.6.7',
  },
];

export class DependencyScanner {
  private vulnerabilityDb = KNOWN_VULNERABILITIES;

  async scan(packageJsonContent: string, filename: string = 'package.json'): Promise<DependencyScanResult> {
    const vulnerabilities: DependencyVulnerability[] = [];
    let totalDeps = 0;

    try {
      const pkg = JSON.parse(packageJsonContent);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      totalDeps = Object.keys(allDeps).length;

      for (const [name, version] of Object.entries(allDeps)) {
        const vulns = this.checkPackage(name, version as string);
        vulnerabilities.push(...vulns);
      }
    } catch (error) {
      console.error('Failed to parse package.json:', error);
    }

    return {
      file: filename,
      dependencies: totalDeps,
      vulnerabilities,
      passed: !vulnerabilities.some(v => v.severity === 'critical' || v.severity === 'high'),
    };
  }

  private checkPackage(name: string, version: string): DependencyVulnerability[] {
    const vulns: DependencyVulnerability[] = [];
    const cleanVersion = version.replace(/^[\^~]/, '');

    for (const known of this.vulnerabilityDb) {
      if (known.package === name && this.isAffected(cleanVersion, known.affectedVersions)) {
        vulns.push({
          package: name,
          version: cleanVersion,
          severity: known.severity,
          cve: known.cve,
          title: known.title,
          description: known.description,
          fixedIn: known.fixedIn,
          url: known.cve ? `https://nvd.nist.gov/vuln/detail/${known.cve}` : undefined,
        });
      }
    }

    return vulns;
  }

  private isAffected(version: string, affectedRange: string): boolean {
    // Simple version comparison (in production use semver library)
    if (affectedRange.startsWith('<')) {
      const maxVersion = affectedRange.slice(1);
      return this.compareVersions(version, maxVersion) < 0;
    }
    return false;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }

  addVulnerability(vuln: typeof KNOWN_VULNERABILITIES[0]): void {
    this.vulnerabilityDb.push(vuln);
  }
}

export default DependencyScanner;
