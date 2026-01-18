/**
 * AuditLogger Tests
 * @module security/__tests__/AuditLogger.test
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AuditLogger } from '../audit/AuditLogger';

describe('AuditLogger', () => {
  let logger: AuditLogger;
  const testLogDir = '.test-audit-' + Date.now();
  const testLogPath = path.join(testLogDir, 'audit.log');

  beforeEach(async () => {
    logger = new AuditLogger(testLogPath);
  });

  afterEach(async () => {
    // Cleanup test files
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('log()', () => {
    it('should log security scan events', async () => {
      await logger.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'scanner' },
        action: 'scan',
        resource: 'test-file.ts',
        details: { scanType: 'sast' },
        result: 'success',
      });

      const events = await logger.query({ eventType: 'security_scan' });
      expect(events.length).toBe(1);
      expect(events[0].resource).toBe('test-file.ts');
    });

    it('should log code generation events', async () => {
      await logger.log({
        eventType: 'code_generation',
        actor: { type: 'agent', id: 'code-agent' },
        action: 'generate',
        resource: 'component.tsx',
        details: { language: 'typescript' },
        result: 'success',
      });

      const events = await logger.query({ eventType: 'code_generation' });
      expect(events.length).toBe(1);
    });

    it('should include timestamps', async () => {
      await logger.log({
        eventType: 'authentication',
        actor: { type: 'user', id: 'user-1' },
        action: 'login',
        resource: 'auth',
        details: {},
        result: 'success',
      });

      const events = await logger.query({});
      expect(events[0].timestamp).toBeDefined();
      expect(new Date(events[0].timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should generate unique IDs', async () => {
      await logger.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'scanner' },
        action: 'scan',
        resource: 'file1.ts',
        details: {},
        result: 'success',
      });

      await logger.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'scanner' },
        action: 'scan',
        resource: 'file2.ts',
        details: {},
        result: 'success',
      });

      const events = await logger.query({});
      expect(events[0].id).not.toBe(events[1].id);
    });

    it('should chain hashes for integrity', async () => {
      await logger.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'scanner' },
        action: 'scan',
        resource: 'file1.ts',
        details: {},
        result: 'success',
      });

      await logger.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'scanner' },
        action: 'scan',
        resource: 'file2.ts',
        details: {},
        result: 'success',
      });

      const events = await logger.query({});
      expect(events[1].previousHash).toBeDefined();
    });
  });

  describe('query()', () => {
    beforeEach(async () => {
      // Add test events
      await logger.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'scanner' },
        action: 'scan',
        resource: 'file1.ts',
        details: {},
        result: 'success',
      });

      await logger.log({
        eventType: 'code_generation',
        actor: { type: 'agent', id: 'code-agent' },
        action: 'generate',
        resource: 'component.tsx',
        details: {},
        result: 'success',
      });

      await logger.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'scanner' },
        action: 'scan',
        resource: 'file2.ts',
        details: {},
        result: 'failure',
      });
    });

    it('should filter by event type', async () => {
      const events = await logger.query({ eventType: 'security_scan' });
      expect(events.length).toBe(2);
      expect(events.every(e => e.eventType === 'security_scan')).toBe(true);
    });

    it('should filter by result', async () => {
      const events = await logger.query({ result: 'failure' });
      expect(events.length).toBe(1);
      expect(events[0].resource).toBe('file2.ts');
    });

    it('should filter by actor', async () => {
      const events = await logger.query({ actor: 'code-agent' });
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('code_generation');
    });

    it('should filter by resource', async () => {
      const events = await logger.query({ resource: 'file1.ts' });
      expect(events.length).toBe(1);
    });

    it('should limit results', async () => {
      const events = await logger.query({ limit: 2 });
      expect(events.length).toBe(2);
    });

    it('should return all events with empty query', async () => {
      const events = await logger.query({});
      expect(events.length).toBe(3);
    });
  });

  describe('persistence', () => {
    it('should persist events to file', async () => {
      await logger.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'scanner' },
        action: 'scan',
        resource: 'test.ts',
        details: {},
        result: 'success',
      });

      // Create new logger instance to read from file
      const logger2 = new AuditLogger(testLogPath);
      const events = await logger2.query({});
      
      expect(events.length).toBe(1);
      expect(events[0].resource).toBe('test.ts');
    });

    it('should append to existing log', async () => {
      await logger.log({
        eventType: 'security_scan',
        actor: { type: 'system', id: 'scanner' },
        action: 'scan',
        resource: 'file1.ts',
        details: {},
        result: 'success',
      });

      // Create new logger and add more events
      const logger2 = new AuditLogger(testLogPath);
      await logger2.log({
        eventType: 'code_generation',
        actor: { type: 'agent', id: 'agent' },
        action: 'generate',
        resource: 'file2.ts',
        details: {},
        result: 'success',
      });

      const events = await logger2.query({});
      expect(events.length).toBe(2);
    });
  });

  describe('security context', () => {
    it('should log security context', async () => {
      await logger.log({
        eventType: 'secret_access',
        actor: { type: 'service', id: 'api-service' },
        action: 'read',
        resource: 'database-password',
        details: {},
        securityContext: {
          secretsAccessed: ['database-password'],
          permissions: ['read:secrets'],
        },
        result: 'success',
      });

      const events = await logger.query({ eventType: 'secret_access' });
      expect(events[0].securityContext?.secretsAccessed).toContain('database-password');
    });
  });
});
