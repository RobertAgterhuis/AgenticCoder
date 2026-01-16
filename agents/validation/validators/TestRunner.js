/**
 * TestRunner - VF-05
 * Discovers and executes tests, measures coverage
 * Supports Jest, Mocha, Node test runner, and pytest
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { glob } from 'glob';

/**
 * @typedef {Object} TestFile
 * @property {string} path - Test file path
 * @property {string} framework - Detected framework (jest/mocha/node/pytest)
 * @property {number} testCount - Estimated number of tests
 */

/**
 * @typedef {Object} TestResult
 * @property {number} passed - Number of passed tests
 * @property {number} failed - Number of failed tests
 * @property {number} skipped - Number of skipped tests
 * @property {number} total - Total number of tests
 * @property {Object[]} failures - Details of failed tests
 * @property {number} durationMs - Test execution time
 */

/**
 * @typedef {Object} CoverageResult
 * @property {number} lines - Line coverage percentage
 * @property {number} branches - Branch coverage percentage
 * @property {number} functions - Function coverage percentage
 * @property {number} statements - Statement coverage percentage
 */

/**
 * @typedef {Object} TestRunnerResult
 * @property {'PASS'|'FAIL'} status
 * @property {TestFile[]} discoveredTests
 * @property {TestResult} testResult
 * @property {CoverageResult} [coverage]
 * @property {string} framework
 * @property {number} durationMs
 */

export class TestRunner {
  constructor() {
    this.testPatterns = [
      '**/*.test.js',
      '**/*.test.ts',
      '**/*.spec.js',
      '**/*.spec.ts',
      '**/__tests__/**/*.js',
      '**/__tests__/**/*.ts',
      '**/test/**/*.js',
      '**/test/**/*.test.js',
      'test_*.py',
      '**/test_*.py',
      '**/*_test.py'
    ];
    
    this.excludePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**'
    ];
  }

  /**
   * Discover and run tests in a project
   * @param {string} projectRoot - Project root directory
   * @param {Object} [options] - Options
   * @param {boolean} [options.runTests=true] - Whether to execute tests
   * @param {boolean} [options.coverage=false] - Whether to collect coverage
   * @param {string} [options.framework] - Force specific framework
   * @returns {Promise<TestRunnerResult>}
   */
  async run(projectRoot, options = {}) {
    const { runTests = true, coverage = false, framework = null } = options;
    const startTime = Date.now();

    // Discover test files
    const discoveredTests = await this._discoverTests(projectRoot);
    
    if (discoveredTests.length === 0) {
      return {
        status: 'PASS',
        discoveredTests: [],
        testResult: { passed: 0, failed: 0, skipped: 0, total: 0, failures: [], durationMs: 0 },
        framework: 'none',
        durationMs: Date.now() - startTime
      };
    }

    // Detect framework
    const detectedFramework = framework || this._detectFramework(projectRoot, discoveredTests);

    let testResult = { passed: 0, failed: 0, skipped: 0, total: 0, failures: [], durationMs: 0 };
    let coverageResult = null;

    if (runTests) {
      const runResult = await this._runTests(projectRoot, detectedFramework, coverage);
      testResult = runResult.testResult;
      coverageResult = runResult.coverage;
    } else {
      // Just count estimated tests
      testResult.total = discoveredTests.reduce((sum, t) => sum + t.testCount, 0);
    }

    const status = testResult.failed === 0 ? 'PASS' : 'FAIL';

    return {
      status,
      discoveredTests,
      testResult,
      coverage: coverageResult,
      framework: detectedFramework,
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Discover test files in a project
   */
  async _discoverTests(projectRoot) {
    const testFiles = [];
    
    for (const pattern of this.testPatterns) {
      try {
        const matches = await glob(pattern, {
          cwd: projectRoot,
          ignore: this.excludePatterns,
          absolute: true
        });
        
        for (const filePath of matches) {
          // Avoid duplicates
          if (testFiles.some(t => t.path === filePath)) continue;
          
          const content = readFileSync(filePath, 'utf8');
          const framework = this._detectFileFramework(content, filePath);
          const testCount = this._countTests(content, framework);
          
          testFiles.push({
            path: relative(projectRoot, filePath),
            framework,
            testCount
          });
        }
      } catch { /* ignore glob errors */ }
    }
    
    return testFiles;
  }

  /**
   * Detect test framework from file content
   */
  _detectFileFramework(content, filePath) {
    if (filePath.endsWith('.py')) {
      if (content.includes('pytest') || content.includes('@pytest')) return 'pytest';
      if (content.includes('unittest')) return 'unittest';
      return 'pytest';
    }
    
    if (content.includes('vitest')) return 'vitest';
    if (content.includes('jest') || content.includes('expect(')) return 'jest';
    if (content.includes('mocha') || (content.includes('describe(') && content.includes('chai'))) return 'mocha';
    if (content.includes('node:test') || content.includes("from 'node:test'")) return 'node';
    
    // Default based on patterns
    if (content.includes('describe(') && content.includes('it(')) return 'jest';
    if (content.includes('test(')) return 'jest';
    
    return 'node'; // Default to node test runner
  }

  /**
   * Count estimated tests in a file
   */
  _countTests(content, framework) {
    let count = 0;
    
    if (framework === 'pytest' || framework === 'unittest') {
      // Python: count def test_ and @test
      const defMatches = content.match(/def test_/g) || [];
      count = defMatches.length;
    } else {
      // JavaScript: count it(), test(), describe()
      const itMatches = content.match(/(?:it|test)\s*\(/g) || [];
      count = itMatches.length;
    }
    
    return Math.max(count, 1);
  }

  /**
   * Detect the primary test framework for the project
   */
  _detectFramework(projectRoot, testFiles) {
    // Check package.json for test script hints
    const pkgJsonPath = join(projectRoot, 'package.json');
    if (existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
        const testScript = pkgJson.scripts?.test || '';
        
        if (testScript.includes('vitest')) return 'vitest';
        if (testScript.includes('jest')) return 'jest';
        if (testScript.includes('mocha')) return 'mocha';
        if (testScript.includes('node --test')) return 'node';
        if (testScript.includes('pytest')) return 'pytest';
        
        // Check devDependencies
        const deps = { ...pkgJson.devDependencies, ...pkgJson.dependencies };
        if (deps.vitest) return 'vitest';
        if (deps.jest) return 'jest';
        if (deps.mocha) return 'mocha';
      } catch { /* ignore */ }
    }

    // Fallback to most common framework in test files
    const frameworkCounts = {};
    for (const test of testFiles) {
      frameworkCounts[test.framework] = (frameworkCounts[test.framework] || 0) + 1;
    }
    
    const sorted = Object.entries(frameworkCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'node';
  }

  /**
   * Run tests using the detected framework
   */
  async _runTests(projectRoot, framework, collectCoverage) {
    const result = {
      testResult: { passed: 0, failed: 0, skipped: 0, total: 0, failures: [], durationMs: 0 },
      coverage: null
    };
    
    const startTime = Date.now();

    try {
      switch (framework) {
        case 'jest':
          return await this._runJest(projectRoot, collectCoverage);
        case 'vitest':
          return await this._runVitest(projectRoot, collectCoverage);
        case 'mocha':
          return await this._runMocha(projectRoot, collectCoverage);
        case 'node':
          return await this._runNodeTest(projectRoot);
        case 'pytest':
          return await this._runPytest(projectRoot, collectCoverage);
        default:
          return await this._runNodeTest(projectRoot);
      }
    } catch (error) {
      result.testResult.durationMs = Date.now() - startTime;
      result.testResult.failures.push({
        name: 'Test Runner Error',
        message: error.message
      });
      result.testResult.failed = 1;
      result.testResult.total = 1;
      return result;
    }
  }

  /**
   * Run tests using Node.js built-in test runner
   */
  async _runNodeTest(projectRoot) {
    const result = {
      testResult: { passed: 0, failed: 0, skipped: 0, total: 0, failures: [], durationMs: 0 },
      coverage: null
    };
    
    const startTime = Date.now();
    
    try {
      const output = execSync('node --test', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 120000 // 2 minute timeout
      });
      
      // Parse node test output
      const passMatch = output.match(/pass (\d+)/);
      const failMatch = output.match(/fail (\d+)/);
      const skipMatch = output.match(/skip (\d+)/);
      
      result.testResult.passed = passMatch ? parseInt(passMatch[1]) : 0;
      result.testResult.failed = failMatch ? parseInt(failMatch[1]) : 0;
      result.testResult.skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
      result.testResult.total = result.testResult.passed + result.testResult.failed + result.testResult.skipped;
      
    } catch (error) {
      // Tests may have run but some failed
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      
      const passMatch = output.match(/pass (\d+)/);
      const failMatch = output.match(/fail (\d+)/);
      
      result.testResult.passed = passMatch ? parseInt(passMatch[1]) : 0;
      result.testResult.failed = failMatch ? parseInt(failMatch[1]) : 1;
      result.testResult.total = result.testResult.passed + result.testResult.failed;
      
      // Extract failure details
      const failureMatches = output.match(/✖ (.+)/g) || [];
      result.testResult.failures = failureMatches.map(f => ({
        name: f.replace('✖ ', ''),
        message: 'Test failed'
      }));
    }
    
    result.testResult.durationMs = Date.now() - startTime;
    return result;
  }

  /**
   * Run tests using Jest
   */
  async _runJest(projectRoot, collectCoverage) {
    const result = {
      testResult: { passed: 0, failed: 0, skipped: 0, total: 0, failures: [], durationMs: 0 },
      coverage: null
    };
    
    const startTime = Date.now();
    const coverageFlag = collectCoverage ? '--coverage --coverageReporters=json-summary' : '';
    
    try {
      const output = execSync(`npx jest --json ${coverageFlag}`, {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 300000 // 5 minute timeout
      });
      
      const jsonResult = JSON.parse(output);
      result.testResult.passed = jsonResult.numPassedTests || 0;
      result.testResult.failed = jsonResult.numFailedTests || 0;
      result.testResult.skipped = jsonResult.numPendingTests || 0;
      result.testResult.total = jsonResult.numTotalTests || 0;
      
      // Extract failures
      if (jsonResult.testResults) {
        for (const testSuite of jsonResult.testResults) {
          for (const assertion of testSuite.assertionResults || []) {
            if (assertion.status === 'failed') {
              result.testResult.failures.push({
                name: assertion.fullName || assertion.title,
                message: assertion.failureMessages?.join('\n') || 'Test failed'
              });
            }
          }
        }
      }
      
      // Get coverage if requested
      if (collectCoverage) {
        const coveragePath = join(projectRoot, 'coverage', 'coverage-summary.json');
        if (existsSync(coveragePath)) {
          const coverageData = JSON.parse(readFileSync(coveragePath, 'utf8'));
          result.coverage = {
            lines: coverageData.total?.lines?.pct || 0,
            branches: coverageData.total?.branches?.pct || 0,
            functions: coverageData.total?.functions?.pct || 0,
            statements: coverageData.total?.statements?.pct || 0
          };
        }
      }
      
    } catch (error) {
      const output = error.stdout?.toString() || '';
      try {
        const jsonResult = JSON.parse(output);
        result.testResult.passed = jsonResult.numPassedTests || 0;
        result.testResult.failed = jsonResult.numFailedTests || 0;
        result.testResult.total = jsonResult.numTotalTests || 0;
      } catch {
        result.testResult.failed = 1;
        result.testResult.total = 1;
        result.testResult.failures.push({
          name: 'Jest Error',
          message: error.message
        });
      }
    }
    
    result.testResult.durationMs = Date.now() - startTime;
    return result;
  }

  /**
   * Run tests using Vitest
   */
  async _runVitest(projectRoot, collectCoverage) {
    const result = {
      testResult: { passed: 0, failed: 0, skipped: 0, total: 0, failures: [], durationMs: 0 },
      coverage: null
    };
    
    const startTime = Date.now();
    const coverageFlag = collectCoverage ? '--coverage' : '';
    
    try {
      const output = execSync(`npx vitest run --reporter=json ${coverageFlag}`, {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 300000
      });
      
      const jsonResult = JSON.parse(output);
      result.testResult.passed = jsonResult.numPassedTests || 0;
      result.testResult.failed = jsonResult.numFailedTests || 0;
      result.testResult.total = jsonResult.numTotalTests || 0;
      
    } catch (error) {
      result.testResult.failed = 1;
      result.testResult.total = 1;
    }
    
    result.testResult.durationMs = Date.now() - startTime;
    return result;
  }

  /**
   * Run tests using Mocha
   */
  async _runMocha(projectRoot, collectCoverage) {
    const result = {
      testResult: { passed: 0, failed: 0, skipped: 0, total: 0, failures: [], durationMs: 0 },
      coverage: null
    };
    
    const startTime = Date.now();
    const cmd = collectCoverage 
      ? 'npx nyc --reporter=json-summary mocha --reporter=json'
      : 'npx mocha --reporter=json';
    
    try {
      const output = execSync(cmd, {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 300000
      });
      
      const jsonResult = JSON.parse(output);
      result.testResult.passed = jsonResult.stats?.passes || 0;
      result.testResult.failed = jsonResult.stats?.failures || 0;
      result.testResult.skipped = jsonResult.stats?.pending || 0;
      result.testResult.total = jsonResult.stats?.tests || 0;
      
    } catch (error) {
      result.testResult.failed = 1;
      result.testResult.total = 1;
    }
    
    result.testResult.durationMs = Date.now() - startTime;
    return result;
  }

  /**
   * Run tests using pytest
   */
  async _runPytest(projectRoot, collectCoverage) {
    const result = {
      testResult: { passed: 0, failed: 0, skipped: 0, total: 0, failures: [], durationMs: 0 },
      coverage: null
    };
    
    const startTime = Date.now();
    const pythonCmd = process.env.AGENTICCODER_PYTHON || 'python';
    const coverageFlag = collectCoverage ? '--cov --cov-report=json' : '';
    
    try {
      const output = execSync(`${pythonCmd} -m pytest -v --tb=short ${coverageFlag}`, {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 300000
      });
      
      // Parse pytest output
      const passMatch = output.match(/(\d+) passed/);
      const failMatch = output.match(/(\d+) failed/);
      const skipMatch = output.match(/(\d+) skipped/);
      
      result.testResult.passed = passMatch ? parseInt(passMatch[1]) : 0;
      result.testResult.failed = failMatch ? parseInt(failMatch[1]) : 0;
      result.testResult.skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
      result.testResult.total = result.testResult.passed + result.testResult.failed + result.testResult.skipped;
      
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const failMatch = output.match(/(\d+) failed/);
      result.testResult.failed = failMatch ? parseInt(failMatch[1]) : 1;
      result.testResult.total = result.testResult.failed;
    }
    
    result.testResult.durationMs = Date.now() - startTime;
    return result;
  }

  /**
   * Discover tests only (without running them)
   */
  async discover(projectRoot) {
    return await this._discoverTests(projectRoot);
  }
}

export default TestRunner;
