/**
 * SecretDetector Tests
 * @module security/__tests__/SecretDetector.test
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SecretDetector } from '../secrets/detection/SecretDetector';

describe('SecretDetector', () => {
  let detector: SecretDetector;

  beforeEach(() => {
    detector = new SecretDetector();
  });

  describe('detect()', () => {
    it('should detect AWS access keys', () => {
      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].type).toContain('AWS');
    });

    it('should detect GitHub personal access tokens', () => {
      const content = 'const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches.some(m => m.type.includes('GitHub'))).toBe(true);
    });

    it('should detect private keys', () => {
      const content = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKC...';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.severity).toBe('critical');
    });

    it('should detect database connection strings', () => {
      const content = 'const db = "postgres://user:password@localhost:5432/mydb";';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches.some(m => m.type.includes('Database'))).toBe(true);
    });

    it('should detect Azure connection strings', () => {
      const content = 'DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=abc123==;';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches.some(m => m.type.includes('Azure'))).toBe(true);
    });

    it('should detect Slack tokens', () => {
      const content = 'const slack = "xoxb-1234567890-abcdefghij";';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches.some(m => m.type.includes('Slack'))).toBe(true);
    });

    it('should detect Stripe keys', () => {
      // Using test prefix (sk_test_) which is recognized as test key
      const content = 'const key = "sk_test_' + 'XXXXXXXXXXXXXXXXXXXX";';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches.some(m => m.type.includes('Stripe'))).toBe(true);
    });

    it('should detect hardcoded passwords', () => {
      const content = 'const password = "supersecret123";';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches.some(m => m.type.includes('Password'))).toBe(true);
    });

    it('should not flag false positives in clean code', () => {
      const content = `
        const name = "John Doe";
        const count = 42;
        const message = "Hello, World!";
      `;
      const result = detector.detect(content);
      
      expect(result.found).toBe(false);
      expect(result.matches.length).toBe(0);
    });

    it('should report correct line numbers', () => {
      const content = 'line1\nconst key = "AKIAIOSFODNN7EXAMPLE";\nline3';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches[0].line).toBe(2);
    });

    it('should mask detected values', () => {
      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches[0].masked).toContain('***');
    });

    it('should determine highest severity', () => {
      const content = `
        const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w";
        const key = "AKIAIOSFODNN7EXAMPLE";
      `;
      const result = detector.detect(content);
      
      // AWS key is critical, JWT is medium - should be critical overall
      expect(result.severity).toBe('critical');
    });
  });

  describe('addPattern()', () => {
    it('should add custom patterns', () => {
      detector.addPattern({
        name: 'Custom Key',
        pattern: /CUSTOM_[A-Z0-9]{10}/,
        severity: 'high',
        description: 'Custom key pattern',
      });

      const content = 'const key = "CUSTOM_ABCDEF1234";';
      const result = detector.detect(content);
      
      expect(result.found).toBe(true);
      expect(result.matches.some(m => m.type === 'Custom Key')).toBe(true);
    });
  });

  describe('scanFile()', () => {
    it('should scan file content and return filename', () => {
      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = detector.scanFile(content, 'config/secrets.ts');
      
      expect(result.found).toBe(true);
      expect(result.filename).toBe('config/secrets.ts');
    });

    it('should handle empty files', () => {
      const result = detector.scanFile('', 'empty.ts');
      
      expect(result.found).toBe(false);
      expect(result.matches.length).toBe(0);
    });
  });
});
