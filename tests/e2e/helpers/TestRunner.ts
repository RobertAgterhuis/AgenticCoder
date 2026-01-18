/**
 * E2E Test Runner Helper
 * 
 * Provides utilities for running CLI commands and code generation in tests.
 */

import { execSync, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const CLI_PATH = path.resolve('bin/agentic.js');

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export class TestRunner {
  private workDir: string;

  constructor(workDir: string) {
    this.workDir = workDir;
  }

  /**
   * Run CLI command synchronously
   */
  runCliSync(args: string): RunResult {
    const command = `node "${CLI_PATH}" ${args}`;
    
    try {
      const stdout = execSync(command, {
        cwd: this.workDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' },
      });
      
      return { 
        stdout: stdout || '', 
        stderr: '', 
        exitCode: 0,
        success: true
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || '',
        exitCode: error.status || 1,
        success: false
      };
    }
  }

  /**
   * Run CLI command asynchronously
   */
  async runCli(args: string): Promise<RunResult> {
    const command = `node "${CLI_PATH}" ${args}`;
    
    return new Promise((resolve) => {
      exec(command, { 
        cwd: this.workDir,
        env: { ...process.env, FORCE_COLOR: '0' },
      }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: error ? (error as any).code || 1 : 0,
          success: !error
        });
      });
    });
  }

  /**
   * Initialize a project using CLI
   */
  initProject(name: string, options: string = ''): RunResult {
    return this.runCliSync(`init --name ${name} ${options}`);
  }

  /**
   * Run code generation
   */
  generate(scenario: string, options: string = ''): RunResult {
    return this.runCliSync(`generate --scenario ${scenario} ${options}`);
  }

  /**
   * Run security scan
   */
  scan(paths: string = '.', options: string = ''): RunResult {
    return this.runCliSync(`scan ${paths} ${options}`);
  }

  /**
   * Get project status
   */
  status(options: string = ''): RunResult {
    return this.runCliSync(`status ${options}`);
  }

  /**
   * Check if a file exists in the work directory
   */
  fileExists(relativePath: string): boolean {
    return fs.existsSync(path.join(this.workDir, relativePath));
  }

  /**
   * Read a file from the work directory
   */
  readFile(relativePath: string): string {
    const filePath = path.join(this.workDir, relativePath);
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Write a file to the work directory
   */
  writeFile(relativePath: string, content: string): void {
    const filePath = path.join(this.workDir, relativePath);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
  }

  /**
   * List files in a directory
   */
  listDir(relativePath: string = '.'): string[] {
    const dirPath = path.join(this.workDir, relativePath);
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    return fs.readdirSync(dirPath);
  }

  /**
   * Get the work directory path
   */
  getWorkDir(): string {
    return this.workDir;
  }
}

/**
 * Create a TestRunner for a test directory
 */
export function createTestRunner(testDir: string): TestRunner {
  return new TestRunner(testDir);
}
