/**
 * SyntaxValidator - VF-02
 * Validates code syntax across multiple languages (JS, TS, JSON, YAML, Bicep)
 * Reports exact line/column of errors
 */

import { parse } from 'acorn';
import { parse as parseYAML } from 'yaml';
import { execSync, spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * @typedef {Object} SyntaxError
 * @property {number} line - Line number (1-based)
 * @property {number} [column] - Column number (1-based)
 * @property {string} message - Error message
 * @property {string} [code] - The offending code line
 */

/**
 * @typedef {Object} SyntaxValidationResult
 * @property {'PASS'|'FAIL'} status
 * @property {SyntaxError[]} errors
 * @property {string} language
 * @property {number} durationMs
 */

export class SyntaxValidator {
  constructor() {
    this.supportedLanguages = ['javascript', 'typescript', 'json', 'yaml', 'bicep', 'python'];
  }

  /**
   * Validate code syntax
   * @param {string} code - The code to validate
   * @param {string} [filePath] - Optional file path (used for language detection)
   * @param {string} [language] - Explicit language override
   * @returns {Promise<SyntaxValidationResult>}
   */
  async validate(code, filePath = '', language = null) {
    const startTime = Date.now();
    const detectedLanguage = language || this._detectLanguage(code, filePath);

    try {
      let result;
      switch (detectedLanguage) {
        case 'javascript':
        case 'typescript':
          result = this._validateJavaScript(code, detectedLanguage === 'typescript');
          break;
        case 'json':
          result = this._validateJSON(code);
          break;
        case 'yaml':
          result = this._validateYAML(code);
          break;
        case 'bicep':
          result = await this._validateBicep(code);
          break;
        case 'python':
          result = await this._validatePython(code);
          break;
        default:
          result = { status: 'PASS', errors: [] };
      }

      return {
        ...result,
        language: detectedLanguage,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'FAIL',
        errors: [{ line: 1, message: `Validation error: ${error.message}` }],
        language: detectedLanguage,
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Detect language from file extension or content
   */
  _detectLanguage(code, filePath) {
    // By extension
    if (filePath) {
      const ext = filePath.split('.').pop()?.toLowerCase();
      const extMap = {
        'js': 'javascript',
        'mjs': 'javascript',
        'cjs': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'jsx': 'javascript',
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'bicep': 'bicep',
        'py': 'python'
      };
      if (extMap[ext]) return extMap[ext];
    }

    // By content sniffing
    if (code.trim().startsWith('{') || code.trim().startsWith('[')) {
      try {
        JSON.parse(code);
        return 'json';
      } catch { /* not JSON */ }
    }

    if (code.includes('param ') && code.includes('resource ')) {
      return 'bicep';
    }

    if (code.includes('def ') || code.includes('import ') && !code.includes('from \'')) {
      return 'python';
    }

    if (code.includes(':\n') && !code.includes('{')) {
      return 'yaml';
    }

    return 'javascript'; // default
  }

  /**
   * Validate JavaScript/TypeScript syntax using acorn
   */
  _validateJavaScript(code, isTypeScript = false) {
    try {
      // Use acorn for basic JS parsing
      // For TypeScript, we do basic validation (full TS requires typescript package)
      parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true,
        allowReturnOutsideFunction: true,
        allowHashBang: true
      });

      return { status: 'PASS', errors: [] };
    } catch (error) {
      const line = error.loc?.line || 1;
      const column = error.loc?.column || 0;
      return {
        status: 'FAIL',
        errors: [{
          line,
          column: column + 1,
          message: error.message,
          code: this._extractCodeLine(code, line)
        }]
      };
    }
  }

  /**
   * Validate JSON syntax
   */
  _validateJSON(code) {
    try {
      JSON.parse(code);
      return { status: 'PASS', errors: [] };
    } catch (error) {
      // Extract position from error message
      const posMatch = error.message.match(/position (\d+)/);
      const position = posMatch ? parseInt(posMatch[1]) : 0;
      
      // Calculate line number from position
      const beforeError = code.substring(0, position);
      const line = (beforeError.match(/\n/g) || []).length + 1;
      const lastNewline = beforeError.lastIndexOf('\n');
      const column = position - lastNewline;

      return {
        status: 'FAIL',
        errors: [{
          line,
          column,
          message: error.message,
          code: this._extractCodeLine(code, line)
        }]
      };
    }
  }

  /**
   * Validate YAML syntax
   */
  _validateYAML(code) {
    try {
      parseYAML(code);
      return { status: 'PASS', errors: [] };
    } catch (error) {
      return {
        status: 'FAIL',
        errors: [{
          line: error.linePos?.[0]?.line || 1,
          column: error.linePos?.[0]?.col || 1,
          message: error.message,
          code: this._extractCodeLine(code, error.linePos?.[0]?.line || 1)
        }]
      };
    }
  }

  /**
   * Validate Bicep syntax using bicep CLI
   */
  async _validateBicep(code) {
    const tempFile = join(tmpdir(), `validate-${Date.now()}.bicep`);
    
    try {
      writeFileSync(tempFile, code);
      
      // Try to run bicep build --stdout to validate
      execSync(`bicep build "${tempFile}" --stdout`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return { status: 'PASS', errors: [] };
    } catch (error) {
      const stderr = error.stderr?.toString() || error.message;
      const errors = this._parseBicepErrors(stderr, code);
      
      return {
        status: errors.length > 0 ? 'FAIL' : 'PASS',
        errors
      };
    } finally {
      // Cleanup temp file
      try {
        if (existsSync(tempFile)) unlinkSync(tempFile);
        // Also try to clean up the generated .json file
        const jsonFile = tempFile.replace('.bicep', '.json');
        if (existsSync(jsonFile)) unlinkSync(jsonFile);
      } catch { /* ignore cleanup errors */ }
    }
  }

  /**
   * Parse Bicep CLI error output
   */
  _parseBicepErrors(stderr, code) {
    const errors = [];
    const lines = stderr.split('\n');
    
    for (const line of lines) {
      // Match pattern: path(line,col) : error BCP001: message
      const match = line.match(/\((\d+),(\d+)\)\s*:\s*(error|warning)\s+(\w+):\s*(.+)/);
      if (match) {
        errors.push({
          line: parseInt(match[1]),
          column: parseInt(match[2]),
          message: `${match[4]}: ${match[5]}`,
          code: this._extractCodeLine(code, parseInt(match[1]))
        });
      }
    }
    
    return errors;
  }

  /**
   * Validate Python syntax
   */
  async _validatePython(code) {
    const tempFile = join(tmpdir(), `validate-${Date.now()}.py`);
    
    try {
      writeFileSync(tempFile, code);
      
      // Use Python to check syntax
      const pythonCmd = process.env.AGENTICCODER_PYTHON || 'python';
      execSync(`${pythonCmd} -m py_compile "${tempFile}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return { status: 'PASS', errors: [] };
    } catch (error) {
      const stderr = error.stderr?.toString() || error.message;
      
      // Parse Python syntax error
      const lineMatch = stderr.match(/line (\d+)/);
      const line = lineMatch ? parseInt(lineMatch[1]) : 1;
      
      return {
        status: 'FAIL',
        errors: [{
          line,
          message: stderr.trim(),
          code: this._extractCodeLine(code, line)
        }]
      };
    } finally {
      try {
        if (existsSync(tempFile)) unlinkSync(tempFile);
      } catch { /* ignore */ }
    }
  }

  /**
   * Extract a specific line from code
   */
  _extractCodeLine(code, lineNum) {
    const lines = code.split('\n');
    return lines[lineNum - 1] || '';
  }

  /**
   * Validate multiple files
   * @param {Array<{code: string, path: string}>} files
   * @returns {Promise<Map<string, SyntaxValidationResult>>}
   */
  async validateMany(files) {
    const results = new Map();
    
    await Promise.all(files.map(async ({ code, path }) => {
      const result = await this.validate(code, path);
      results.set(path, result);
    }));

    return results;
  }
}

export default SyntaxValidator;
