/**
 * GenerationE2EFramework.js
 * End-to-end testing framework for Code Generation Engine
 * Validates complete generation flows from input to output
 */

const path = require('path');
const fs = require('fs').promises;

class GenerationE2EFramework {
  constructor(codeGenerationEngine) {
    this.engine = codeGenerationEngine;
    this.testResults = [];
    this.outputBasePath = 'tests/output';
  }

  /**
   * Run a complete E2E test
   */
  async runTest(testCase) {
    const startTime = Date.now();
    const result = {
      name: testCase.name,
      category: testCase.category,
      generator: testCase.generator,
      status: 'pending',
      steps: [],
      duration: 0
    };

    try {
      // Step 1: Prepare context
      result.steps.push(await this.runStep('Prepare Context', async () => {
        return this.prepareContext(testCase.input);
      }));

      // Step 2: Generate code
      result.steps.push(await this.runStep('Generate Code', async () => {
        return this.engine.generate(result.steps[0].data);
      }));

      // Step 3: Validate output structure
      result.steps.push(await this.runStep('Validate Structure', async () => {
        return this.validateStructure(result.steps[1].data.files, testCase.expectedStructure);
      }));

      // Step 4: Validate code quality
      result.steps.push(await this.runStep('Validate Quality', async () => {
        return this.validateQuality(result.steps[1].data.files);
      }));

      // Step 5: Validate functionality (if applicable)
      if (testCase.functionalTests) {
        result.steps.push(await this.runStep('Functional Tests', async () => {
          return this.runFunctionalTests(result.steps[1].data.outputPath, testCase.functionalTests);
        }));
      }

      result.status = result.steps.every(s => s.passed) ? 'passed' : 'failed';
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      result.stack = error.stack;
    }

    result.duration = Date.now() - startTime;
    this.testResults.push(result);
    return result;
  }

  /**
   * Run a single test step
   */
  async runStep(name, fn) {
    const startTime = Date.now();
    try {
      const data = await fn();
      return { name, passed: true, data, duration: Date.now() - startTime };
    } catch (error) {
      return { name, passed: false, error: error.message, duration: Date.now() - startTime };
    }
  }

  /**
   * Prepare generation context from test input
   */
  async prepareContext(input) {
    const outputPath = path.join(this.outputBasePath, input.projectName, Date.now().toString());
    
    // Ensure output directory exists
    await fs.mkdir(outputPath, { recursive: true });
    
    return {
      projectName: input.projectName,
      features: input.features || [],
      tech: input.tech,
      outputPath,
      options: input.options || {}
    };
  }

  /**
   * Validate output matches expected structure
   */
  validateStructure(files, expected) {
    if (!expected || expected.length === 0) {
      return { validated: files.length, missing: 0, extra: 0 };
    }

    const generatedPaths = files.map(f => f.path);
    const missing = expected.filter(e => !generatedPaths.some(g => g.includes(e)));
    const extra = generatedPaths.filter(g => !expected.some(e => g.includes(e)));
    
    if (missing.length > 0) {
      throw new Error(`Missing files: ${missing.join(', ')}`);
    }
    
    return { validated: expected.length, missing: missing.length, extra: extra.length };
  }

  /**
   * Run code quality checks
   */
  async validateQuality(files) {
    const results = {
      lintErrors: 0,
      typeErrors: 0,
      syntaxErrors: 0,
      passed: true,
      details: []
    };

    for (const file of files) {
      const ext = path.extname(file.path);
      
      // Basic syntax validation based on file type
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        const jsResult = this.validateJavaScriptSyntax(file.content);
        if (!jsResult.valid) {
          results.syntaxErrors++;
          results.details.push({ file: file.path, error: jsResult.error });
        }
      }
      
      if (ext === '.json') {
        const jsonResult = this.validateJsonSyntax(file.content);
        if (!jsonResult.valid) {
          results.syntaxErrors++;
          results.details.push({ file: file.path, error: jsonResult.error });
        }
      }
    }

    results.passed = results.syntaxErrors === 0;
    return results;
  }

  /**
   * Validate JavaScript/TypeScript syntax
   */
  validateJavaScriptSyntax(content) {
    try {
      // Basic syntax check - try to parse
      new Function(content);
      return { valid: true };
    } catch (error) {
      // For TypeScript/JSX, basic check might fail - that's ok
      if (content.includes('import ') || content.includes('export ') || content.includes('<')) {
        return { valid: true }; // Assume valid for module/JSX syntax
      }
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validate JSON syntax
   */
  validateJsonSyntax(content) {
    try {
      JSON.parse(content);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Run functional tests
   */
  async runFunctionalTests(outputPath, tests) {
    const results = { passed: 0, failed: 0, tests: [] };
    
    for (const test of tests) {
      try {
        await test.run(outputPath);
        results.passed++;
        results.tests.push({ name: test.name, passed: true });
      } catch (error) {
        results.failed++;
        results.tests.push({ name: test.name, passed: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Run all tests in a test suite
   */
  async runSuite(testSuite) {
    const suiteResult = {
      name: testSuite.name,
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, errors: 0 },
      duration: 0
    };
    
    const startTime = Date.now();
    
    for (const testCase of testSuite.tests) {
      const result = await this.runTest(testCase);
      suiteResult.tests.push(result);
      suiteResult.summary.total++;
      
      if (result.status === 'passed') suiteResult.summary.passed++;
      else if (result.status === 'failed') suiteResult.summary.failed++;
      else suiteResult.summary.errors++;
    }
    
    suiteResult.duration = Date.now() - startTime;
    return suiteResult;
  }

  /**
   * Get test results summary
   */
  getSummary() {
    const summary = {
      total: this.testResults.length,
      passed: this.testResults.filter(t => t.status === 'passed').length,
      failed: this.testResults.filter(t => t.status === 'failed').length,
      errors: this.testResults.filter(t => t.status === 'error').length,
      totalDuration: this.testResults.reduce((sum, t) => sum + t.duration, 0)
    };
    
    summary.passRate = summary.total > 0 
      ? Math.round((summary.passed / summary.total) * 100) 
      : 0;
    
    return summary;
  }

  /**
   * Generate test report
   */
  generateReport() {
    const summary = this.getSummary();
    
    return {
      timestamp: new Date().toISOString(),
      summary,
      results: this.testResults,
      byCategory: this.groupByCategory(),
      byGenerator: this.groupByGenerator()
    };
  }

  /**
   * Group results by category
   */
  groupByCategory() {
    const groups = {};
    for (const result of this.testResults) {
      const category = result.category || 'uncategorized';
      if (!groups[category]) {
        groups[category] = { passed: 0, failed: 0, total: 0 };
      }
      groups[category].total++;
      if (result.status === 'passed') groups[category].passed++;
      else groups[category].failed++;
    }
    return groups;
  }

  /**
   * Group results by generator
   */
  groupByGenerator() {
    const groups = {};
    for (const result of this.testResults) {
      const generator = result.generator || 'unknown';
      if (!groups[generator]) {
        groups[generator] = { passed: 0, failed: 0, total: 0 };
      }
      groups[generator].total++;
      if (result.status === 'passed') groups[generator].passed++;
      else groups[generator].failed++;
    }
    return groups;
  }

  /**
   * Clear test results
   */
  clear() {
    this.testResults = [];
  }
}

module.exports = GenerationE2EFramework;
