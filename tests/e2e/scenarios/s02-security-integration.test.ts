/**
 * E2E Test: Security Integration
 * 
 * Tests code generation with security scanning integration.
 */

import { createTestDir } from '../setup';
import { createTestRunner, TestRunner } from '../helpers';
import * as fs from 'fs';
import * as path from 'path';

describe('E2E: Security Integration', () => {
  let testDir: string;
  let runner: TestRunner;

  beforeEach(() => {
    testDir = createTestDir('security-integration');
    runner = createTestRunner(testDir);
  });

  describe('Security Scan Command', () => {
    beforeEach(() => {
      runner.initProject('security-test');
      // Create a src directory with a sample file to scan
      runner.writeFile('src/index.js', `
        // Clean code file
        const greeting = "Hello, World!";
        console.log(greeting);
      `);
    });

    it('should run security scan on initialized project', () => {
      const result = runner.scan('./src');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Security Scan');
      expect(result.stdout).toContain('Files scanned');
    });

    it('should detect no issues in clean project', () => {
      const result = runner.scan('./src');

      // New project should have no issues
      expect(result.stdout).toContain('Scan Results');
      expect(result.stdout).toContain('No security issues found');
    });

    it('should output JSON format when requested', () => {
      const result = runner.scan('./src', '--format json');

      expect(result.success).toBe(true);
      
      // Extract JSON from output (skip any non-JSON prefix)
      const jsonMatch = result.stdout.match(/\{[\s\S]*\}/);
      expect(jsonMatch).not.toBeNull();
      
      const scanResult = JSON.parse(jsonMatch![0]);
      expect(scanResult.files).toBeDefined();
      expect(scanResult.scanned).toBeDefined();
      expect(scanResult.issues).toBeDefined();
      expect(scanResult.summary).toBeDefined();
    });

    it('should save report to file when --output is specified', () => {
      runner.scan('./src', '--output scan-report.txt');

      expect(runner.fileExists('scan-report.txt')).toBe(true);
      
      const report = runner.readFile('scan-report.txt');
      expect(report).toContain('Security Scan Report');
    });
  });

  describe('Secret Detection', () => {
    beforeEach(() => {
      runner.initProject('secret-test');
    });

    it('should detect hardcoded secrets', () => {
      // Create a file with a secret
      runner.writeFile('src/config.js', `
        const config = {
          apiKey: "sk-1234567890abcdefghijklmnopqrstuvwxyz",
          password: "supersecret123"
        };
        module.exports = config;
      `);

      const result = runner.scan('./src');

      expect(result.stdout).toContain('issue');
      expect(result.stdout.toLowerCase()).toMatch(/secret|password|api.*key/i);
    });

    it('should detect AWS credentials', () => {
      runner.writeFile('src/aws-config.js', `
        const aws = {
          aws_access_key_id: "AKIAIOSFODNN7EXAMPLE",
          aws_secret_access_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        };
      `);

      const result = runner.scan('./src');

      expect(result.stdout).toContain('issue');
    });

    it('should filter by severity level', () => {
      // Create files with different severity issues
      runner.writeFile('src/test.js', `
        const password = "test123";
        const value = eval("1+1");
        element.innerHTML = userInput;
      `);

      const highResult = runner.scan('./src', '--severity high');
      const lowResult = runner.scan('./src', '--severity low');

      // Both should find issues
      expect(highResult.stdout).toContain('issue');
      expect(lowResult.stdout).toContain('issue');
    });
  });

  describe('Vulnerability Detection', () => {
    beforeEach(() => {
      runner.initProject('vuln-test');
    });

    it('should detect eval() usage', () => {
      runner.writeFile('src/dangerous.js', `
        function processInput(input) {
          return eval(input);
        }
      `);

      const result = runner.scan('./src', '--vulnerabilities');

      expect(result.stdout.toLowerCase()).toContain('eval');
    });

    it('should detect innerHTML usage', () => {
      runner.writeFile('src/xss.js', `
        function render(html) {
          element.innerHTML = html;
        }
      `);

      const result = runner.scan('./src', '--vulnerabilities');

      expect(result.stdout.toLowerCase()).toMatch(/innerhtml|xss/i);
    });
  });

  describe('Generation with Security', () => {
    beforeEach(() => {
      runner.initProject('gen-security');
    });

    it('should run generation with security enabled by default', () => {
      const result = runner.generate('S01', '--dry-run');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Security: Enabled');
    });

    it('should allow disabling security with --no-security', () => {
      const result = runner.generate('S01', '--no-security --dry-run');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Security: Disabled');
    });
  });
});
