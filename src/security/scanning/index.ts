/**
 * Security Scanning Module
 * @module security/scanning
 */

export { CodeSecurityScanner, ScanResult, Vulnerability, VulnerabilityType, SecurityReport } from './CodeSecurityScanner';
export { DependencyScanner, DependencyVulnerability, DependencyScanResult } from './DependencyScanner';
export { InfraScanner, InfraVulnerability, InfraScanResult } from './InfraScanner';

import { CodeSecurityScanner } from './CodeSecurityScanner';
import { DependencyScanner } from './DependencyScanner';
import { InfraScanner } from './InfraScanner';

/**
 * Unified security scanner that combines all scanners
 */
export class SecurityScanner {
  private codeScanner: CodeSecurityScanner;
  private depScanner: DependencyScanner;
  private infraScanner: InfraScanner;

  constructor() {
    this.codeScanner = new CodeSecurityScanner();
    this.depScanner = new DependencyScanner();
    this.infraScanner = new InfraScanner();
  }

  async scanAll(files: Array<{ name: string; content: string }>) {
    const codeFiles = files.filter(f => 
      /\.(js|jsx|ts|tsx|py|cs|go|java)$/.test(f.name)
    );
    
    const packageFiles = files.filter(f => 
      f.name === 'package.json' || f.name.endsWith('/package.json')
    );
    
    const infraFiles = files.filter(f => 
      f.name.endsWith('.bicep') || 
      (f.name.endsWith('.json') && f.content.includes('$schema') && f.content.includes('template'))
    );

    const codeResults = this.codeScanner.scanFiles(codeFiles);
    const depResults = await Promise.all(
      packageFiles.map(f => this.depScanner.scan(f.content, f.name))
    );
    const infraResults = this.infraScanner.scanFiles(infraFiles);

    const totalVulns = 
      codeResults.reduce((s, r) => s + r.vulnerabilities.length, 0) +
      depResults.reduce((s, r) => s + r.vulnerabilities.length, 0) +
      infraResults.reduce((s, r) => s + r.vulnerabilities.length, 0);

    const allPassed = 
      codeResults.every(r => r.passed) &&
      depResults.every(r => r.passed) &&
      infraResults.every(r => r.passed);

    return {
      summary: {
        totalFiles: files.length,
        codeFiles: codeFiles.length,
        packageFiles: packageFiles.length,
        infraFiles: infraFiles.length,
        totalVulnerabilities: totalVulns,
        passed: allPassed,
      },
      code: codeResults,
      dependencies: depResults,
      infrastructure: infraResults,
    };
  }

  get code() { return this.codeScanner; }
  get dependencies() { return this.depScanner; }
  get infrastructure() { return this.infraScanner; }
}

export default SecurityScanner;
