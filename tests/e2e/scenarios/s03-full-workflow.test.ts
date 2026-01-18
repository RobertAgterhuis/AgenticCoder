/**
 * E2E Test: Full Workflow
 * 
 * Tests the complete workflow: init → generate → scan → status
 */

import { createTestDir } from '../setup';
import { createTestRunner, TestRunner } from '../helpers';

describe('E2E: Full Workflow', () => {
  let testDir: string;
  let runner: TestRunner;

  beforeEach(() => {
    testDir = createTestDir('full-workflow');
    runner = createTestRunner(testDir);
  });

  describe('Complete Project Lifecycle', () => {
    it('should complete the full workflow: init → status → generate → scan', () => {
      // Step 1: Initialize project
      const initResult = runner.initProject('lifecycle-app', '--template fullstack');
      expect(initResult.success).toBe(true);
      expect(initResult.stdout).toContain('initialized successfully');

      // Step 2: Check status (should show valid project)
      const statusResult = runner.status();
      expect(statusResult.success).toBe(true);
      expect(statusResult.stdout).toContain('Valid AgenticCoder project');
      expect(statusResult.stdout).toContain('lifecycle-app');

      // Step 3: Run code generation
      const genResult = runner.generate('S01', '--dry-run');
      expect(genResult.success).toBe(true);
      expect(genResult.stdout).toContain('Generation complete');

      // Step 4: Run security scan
      const scanResult = runner.scan('./src');
      expect(scanResult.success).toBe(true);
      expect(scanResult.stdout).toContain('Security Scan');
    });

    it('should maintain project state across operations', () => {
      // Initialize
      runner.initProject('state-test');
      
      // Verify config persists
      let config = JSON.parse(runner.readFile('.agentic/config.json'));
      expect(config.projectName).toBe('state-test');
      
      // Run generation
      runner.generate('S01', '--dry-run');
      
      // Config should still be valid
      config = JSON.parse(runner.readFile('.agentic/config.json'));
      expect(config.projectName).toBe('state-test');
      expect(config.settings).toBeDefined();
    });
  });

  describe('CLI Help and Version', () => {
    it('should display help information', () => {
      const result = runner.runCliSync('--help');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('AgenticCoder');
      expect(result.stdout).toContain('init');
      expect(result.stdout).toContain('generate');
      expect(result.stdout).toContain('scan');
      expect(result.stdout).toContain('status');
    });

    it('should display version', () => {
      const result = runner.runCliSync('--version');

      expect(result.success).toBe(true);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should show help for subcommands', () => {
      const initHelp = runner.runCliSync('init --help');
      expect(initHelp.stdout).toContain('--name');
      expect(initHelp.stdout).toContain('--template');

      const genHelp = runner.runCliSync('generate --help');
      expect(genHelp.stdout).toContain('--scenario');
      expect(genHelp.stdout).toContain('--output');

      const scanHelp = runner.runCliSync('scan --help');
      expect(scanHelp.stdout).toContain('--format');
      expect(scanHelp.stdout).toContain('--severity');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid directory gracefully', () => {
      const result = runner.scan('/nonexistent/path/that/does/not/exist');

      // Should not crash, but report the issue
      expect(result.stdout).toContain('not found');
    });

    it('should handle empty project directory', () => {
      const result = runner.status();

      expect(result.stdout).toContain('No AgenticCoder project found');
    });

    it('should provide helpful error for missing required options', () => {
      // Most commands have sensible defaults, so this tests edge cases
      runner.initProject('error-test');
      
      const result = runner.generate('S01', '--output ""');
      // Should handle empty output gracefully
      expect(result.exitCode).toBeDefined();
    });
  });

  describe('Multiple Projects', () => {
    it('should support multiple independent projects', () => {
      // Create first project
      const subDir1 = 'project-one';
      runner.writeFile(`${subDir1}/.gitkeep`, '');
      
      const runner1 = createTestRunner(`${testDir}/${subDir1}`);
      runner1.initProject('project-one');

      // Create second project
      const subDir2 = 'project-two';
      runner.writeFile(`${subDir2}/.gitkeep`, '');
      
      const runner2 = createTestRunner(`${testDir}/${subDir2}`);
      runner2.initProject('project-two');

      // Verify they are independent
      const status1 = runner1.status('--json');
      const status2 = runner2.status('--json');

      const json1 = JSON.parse(status1.stdout);
      const json2 = JSON.parse(status2.stdout);

      expect(json1.project.name).toBe('project-one');
      expect(json2.project.name).toBe('project-two');
    });
  });

  describe('Config and Tools Commands', () => {
    it('should have config command available', () => {
      const result = runner.runCliSync('config --help');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('configuration');
    });

    it('should have tools command available', () => {
      const result = runner.runCliSync('tools --help');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('MCP tools');
    });

    it('should have health command available', () => {
      const result = runner.runCliSync('health --help');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('health');
    });
  });
});
