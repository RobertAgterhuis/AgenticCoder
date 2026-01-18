/**
 * E2E Test: Basic Code Generation
 * 
 * Tests the basic code generation workflow without security checks.
 */

import { createTestDir } from '../setup';
import { createTestRunner, TestRunner } from '../helpers';

describe('E2E: Basic Code Generation', () => {
  let testDir: string;
  let runner: TestRunner;

  beforeEach(() => {
    testDir = createTestDir('basic-generation');
    runner = createTestRunner(testDir);
  });

  describe('Project Initialization', () => {
    it('should initialize a new project with default settings', () => {
      const result = runner.initProject('test-app');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('initialized successfully');
      expect(runner.fileExists('.agentic/config.json')).toBe(true);
      expect(runner.fileExists('package.json')).toBe(true);
      expect(runner.fileExists('README.md')).toBe(true);
    });

    it('should create required directory structure', () => {
      runner.initProject('test-app');

      expect(runner.fileExists('src')).toBe(true);
      expect(runner.fileExists('src/agents')).toBe(true);
      expect(runner.fileExists('src/config')).toBe(true);
      expect(runner.fileExists('src/generated')).toBe(true);
      expect(runner.fileExists('tests')).toBe(true);
    });

    it('should create valid config.json', () => {
      runner.initProject('my-project');

      const config = JSON.parse(runner.readFile('.agentic/config.json'));
      
      expect(config.projectName).toBe('my-project');
      expect(config.version).toBeDefined();
      expect(config.settings).toBeDefined();
      expect(config.agents).toBeDefined();
    });

    it('should support custom template option', () => {
      const result = runner.initProject('api-project', '--template api');

      expect(result.success).toBe(true);
      
      const config = JSON.parse(runner.readFile('.agentic/config.json'));
      expect(config.template).toBe('api');
    });
  });

  describe('Code Generation', () => {
    beforeEach(() => {
      // Initialize project first
      runner.initProject('gen-test');
    });

    it('should run generation with dry-run flag', () => {
      const result = runner.generate('S01', '--dry-run');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Generation complete');
    });

    it('should show correct scenario in output', () => {
      const result = runner.generate('S02', '--dry-run');

      expect(result.stdout).toContain('S02');
    });

    it('should respect output directory option', () => {
      const result = runner.generate('S01', '--output ./custom-output --dry-run');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('custom-output');
    });
  });

  describe('Project Status', () => {
    it('should report no project found in empty directory', () => {
      const result = runner.status();

      expect(result.stdout).toContain('No AgenticCoder project found');
    });

    it('should show project info after initialization', () => {
      runner.initProject('status-test');
      const result = runner.status();

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Valid AgenticCoder project');
      expect(result.stdout).toContain('status-test');
    });

    it('should output JSON when --json flag is used', () => {
      runner.initProject('json-test');
      const result = runner.status('--json');

      expect(result.success).toBe(true);
      
      const status = JSON.parse(result.stdout);
      expect(status.project.valid).toBe(true);
      expect(status.project.name).toBe('json-test');
    });

    it('should show configured agents', () => {
      runner.initProject('agent-test');
      const result = runner.status();

      expect(result.stdout).toContain('Agents');
      expect(result.stdout).toContain('Configured:');
    });
  });
});
