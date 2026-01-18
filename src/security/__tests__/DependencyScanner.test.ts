/**
 * DependencyScanner Tests
 * @module security/__tests__/DependencyScanner.test
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DependencyScanner } from '../scanning/DependencyScanner';

describe('DependencyScanner', () => {
  let scanner: DependencyScanner;

  beforeEach(() => {
    scanner = new DependencyScanner();
  });

  describe('scan()', () => {
    it('should scan package.json with no vulnerabilities', async () => {
      const packageJson = JSON.stringify({
        dependencies: {
          'lodash': '^4.17.21',  // Fixed version
          'express': '^4.18.0',  // Fixed version
        }
      });

      const result = await scanner.scan(packageJson, 'package.json');
      
      expect(result.dependencies).toBe(2);
      expect(result.passed).toBe(true);
      expect(result.vulnerabilities.length).toBe(0);
    });

    it('should detect vulnerable lodash version', async () => {
      const packageJson = JSON.stringify({
        dependencies: {
          'lodash': '^4.17.0',  // Vulnerable version
        }
      });

      const result = await scanner.scan(packageJson);
      
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.vulnerabilities[0].package).toBe('lodash');
      expect(result.vulnerabilities[0].severity).toBe('high');
      expect(result.vulnerabilities[0].cve).toBe('CVE-2021-23337');
    });

    it('should detect vulnerable axios version', async () => {
      const packageJson = JSON.stringify({
        dependencies: {
          'axios': '^0.20.0',  // Vulnerable version
        }
      });

      const result = await scanner.scan(packageJson);
      
      expect(result.vulnerabilities.some(v => v.package === 'axios')).toBe(true);
    });

    it('should detect critical minimist vulnerability', async () => {
      const packageJson = JSON.stringify({
        dependencies: {
          'minimist': '^1.2.0',  // Vulnerable version
        }
      });

      const result = await scanner.scan(packageJson);
      
      expect(result.passed).toBe(false);  // Critical vulnerability fails
      expect(result.vulnerabilities.some(v => 
        v.package === 'minimist' && v.severity === 'critical'
      )).toBe(true);
    });

    it('should scan devDependencies', async () => {
      const packageJson = JSON.stringify({
        dependencies: {},
        devDependencies: {
          'lodash': '^4.17.0',  // Vulnerable
        }
      });

      const result = await scanner.scan(packageJson);
      
      expect(result.dependencies).toBe(1);
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
    });

    it('should include CVE details in results', async () => {
      const packageJson = JSON.stringify({
        dependencies: {
          'jsonwebtoken': '^8.5.0',  // Vulnerable version
        }
      });

      const result = await scanner.scan(packageJson);
      
      const vuln = result.vulnerabilities.find(v => v.package === 'jsonwebtoken');
      expect(vuln).toBeDefined();
      expect(vuln?.cve).toBe('CVE-2022-23529');
      expect(vuln?.fixedIn).toBe('9.0.0');
      expect(vuln?.url).toContain('nvd.nist.gov');
    });

    it('should handle empty package.json', async () => {
      const packageJson = JSON.stringify({});

      const result = await scanner.scan(packageJson);
      
      expect(result.dependencies).toBe(0);
      expect(result.vulnerabilities.length).toBe(0);
      expect(result.passed).toBe(true);
    });

    it('should handle invalid JSON gracefully', async () => {
      const result = await scanner.scan('not valid json');
      
      expect(result.passed).toBe(true);  // No critical/high vulns found
      expect(result.dependencies).toBe(0);
    });

    it('should strip version prefixes', async () => {
      // Test with ^ and ~ prefixes
      const packageJson = JSON.stringify({
        dependencies: {
          'lodash': '~4.17.0',  // Tilde prefix, vulnerable
        }
      });

      const result = await scanner.scan(packageJson);
      
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.vulnerabilities[0].version).toBe('4.17.0');  // Stripped prefix
    });
  });

  describe('addVulnerability()', () => {
    it('should allow adding custom vulnerabilities', async () => {
      scanner.addVulnerability({
        package: 'custom-pkg',
        affectedVersions: '<2.0.0',
        severity: 'high',
        cve: 'CVE-2099-9999',
        title: 'Custom Vulnerability',
        description: 'Test vulnerability',
        fixedIn: '2.0.0',
      });

      const packageJson = JSON.stringify({
        dependencies: {
          'custom-pkg': '^1.0.0',
        }
      });

      const result = await scanner.scan(packageJson);
      
      expect(result.vulnerabilities.some(v => v.package === 'custom-pkg')).toBe(true);
    });
  });

  describe('Multiple vulnerabilities', () => {
    it('should detect multiple vulnerable packages', async () => {
      const packageJson = JSON.stringify({
        dependencies: {
          'lodash': '^4.17.0',     // High
          'minimist': '^1.2.0',   // Critical
          'axios': '^0.20.0',      // High
        }
      });

      const result = await scanner.scan(packageJson);
      
      expect(result.vulnerabilities.length).toBeGreaterThanOrEqual(3);
      expect(result.passed).toBe(false);
    });
  });
});
