/**
 * CodeValidator - Validates generated code for syntax and best practices
 * 
 * Supports:
 * - TypeScript/JavaScript syntax validation
 * - Bicep template validation
 * - SQL/Prisma schema validation
 * - JSON/YAML structure validation
 */

const path = require('path');

class CodeValidator {
  constructor() {
    this.validators = new Map();
    this.errors = [];
    this.warnings = [];
    
    // Register default validators
    this.registerDefaultValidators();
  }

  /**
   * Register built-in validators
   */
  registerDefaultValidators() {
    this.registerValidator('typescript', this.validateTypeScript.bind(this));
    this.registerValidator('javascript', this.validateJavaScript.bind(this));
    this.registerValidator('bicep', this.validateBicep.bind(this));
    this.registerValidator('prisma', this.validatePrisma.bind(this));
    this.registerValidator('json', this.validateJson.bind(this));
    this.registerValidator('css', this.validateCss.bind(this));
    this.registerValidator('html', this.validateHtml.bind(this));
  }

  /**
   * Register a custom validator
   * @param {string} type - File type or extension
   * @param {Function} validator - Validation function
   */
  registerValidator(type, validator) {
    this.validators.set(type, validator);
  }

  /**
   * Validate a single file
   * @param {Object} file - File object with path and content
   * @returns {Promise<ValidationResult>}
   */
  async validateFile(file) {
    const ext = this.getFileType(file.path);
    const validator = this.validators.get(ext);

    if (!validator) {
      return {
        valid: true,
        file: file.path,
        errors: [],
        warnings: [{ message: `No validator registered for type: ${ext}` }]
      };
    }

    try {
      const result = await validator(file.content, file.path);
      return {
        valid: result.errors.length === 0,
        file: file.path,
        errors: result.errors,
        warnings: result.warnings || []
      };
    } catch (error) {
      return {
        valid: false,
        file: file.path,
        errors: [{ message: `Validation error: ${error.message}`, line: 0 }],
        warnings: []
      };
    }
  }

  /**
   * Validate multiple files
   * @param {Array} files - Array of file objects
   * @returns {Promise<ValidationSummary>}
   */
  async validateFiles(files) {
    const results = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const file of files) {
      const result = await this.validateFile(file);
      results.push(result);
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
    }

    return {
      valid: totalErrors === 0,
      totalFiles: files.length,
      totalErrors,
      totalWarnings,
      results
    };
  }

  /**
   * Get file type from path
   */
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const typeMap = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'bicep': 'bicep',
      'prisma': 'prisma',
      'json': 'json',
      'css': 'css',
      'html': 'html',
      'htm': 'html',
      'sql': 'sql'
    };
    return typeMap[ext] || ext;
  }

  /**
   * Validate TypeScript code
   */
  async validateTypeScript(content, filePath) {
    const errors = [];
    const warnings = [];

    // Basic syntax checks
    const syntaxChecks = [
      { pattern: /\bvar\s+\w+\s*=/, warning: 'Use const or let instead of var' },
      { pattern: /==(?!=)/, warning: 'Use strict equality (===) instead of ==' },
      { pattern: /!=(?!=)/, warning: 'Use strict inequality (!==) instead of !=' },
      { pattern: /console\.(log|debug|info)\(/, warning: 'Remove console statements before production' },
    ];

    // Check for unbalanced braces
    const braceBalance = this.checkBraceBalance(content);
    if (braceBalance !== 0) {
      errors.push({
        message: `Unbalanced braces: ${braceBalance > 0 ? 'missing closing' : 'extra closing'} brace`,
        severity: 'error'
      });
    }

    // Check for unbalanced parentheses
    const parenBalance = this.checkParenBalance(content);
    if (parenBalance !== 0) {
      errors.push({
        message: `Unbalanced parentheses`,
        severity: 'error'
      });
    }

    // Check for common TypeScript issues
    syntaxChecks.forEach(check => {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (check.pattern.test(line)) {
          warnings.push({
            message: check.warning,
            line: index + 1,
            severity: 'warning'
          });
        }
      });
    });

    // Check for missing type annotations in function params
    const funcPattern = /function\s+\w+\s*\(([^)]*)\)/g;
    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      const params = match[1];
      if (params && !params.includes(':')) {
        warnings.push({
          message: 'Function parameters should have type annotations',
          severity: 'warning'
        });
      }
    }

    // Check import statements
    const importPattern = /^import\s+/gm;
    const lastImportIndex = content.lastIndexOf('import ');
    const firstNonImportCode = content.search(/^(?!import|\/\/|\/\*|\*|$|\s)/m);
    if (firstNonImportCode !== -1 && lastImportIndex > firstNonImportCode) {
      warnings.push({
        message: 'Import statements should be at the top of the file',
        severity: 'warning'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate JavaScript code
   */
  async validateJavaScript(content, filePath) {
    // Reuse TypeScript validator for JavaScript
    return this.validateTypeScript(content, filePath);
  }

  /**
   * Validate Bicep template
   */
  async validateBicep(content, filePath) {
    const errors = [];
    const warnings = [];

    // Check for required elements
    if (!content.includes('param ') && !content.includes('resource ')) {
      warnings.push({
        message: 'Bicep file should contain parameters or resources',
        severity: 'warning'
      });
    }

    // Check for duplicate resource names
    const resourcePattern = /resource\s+(\w+)\s+/g;
    const resourceNames = new Set();
    let match;
    while ((match = resourcePattern.exec(content)) !== null) {
      if (resourceNames.has(match[1])) {
        errors.push({
          message: `Duplicate resource symbolic name: ${match[1]}`,
          severity: 'error'
        });
      }
      resourceNames.add(match[1]);
    }

    // Check for missing descriptions on parameters
    const paramPattern = /param\s+(\w+)/g;
    const descPattern = /@description\([^)]+\)\s*param/g;
    const params = (content.match(paramPattern) || []).length;
    const descs = (content.match(descPattern) || []).length;
    if (params > descs) {
      warnings.push({
        message: 'Some parameters are missing @description decorator',
        severity: 'warning'
      });
    }

    // Check for secure parameters
    const securePattern = /@secure\(\)\s*param\s+\w+\s+string/g;
    const passwordPattern = /param\s+\w*(password|secret|key)\w*\s+string/gi;
    let passwordMatch;
    while ((passwordMatch = passwordPattern.exec(content)) !== null) {
      const beforeParam = content.substring(Math.max(0, passwordMatch.index - 20), passwordMatch.index);
      if (!beforeParam.includes('@secure()')) {
        warnings.push({
          message: `Parameter containing sensitive data should use @secure() decorator`,
          severity: 'warning'
        });
      }
    }

    // Check for hardcoded values
    const hardcodedPatterns = [
      { pattern: /'[A-Za-z0-9]{20,}'/, message: 'Possible hardcoded secret detected' },
      { pattern: /\/subscriptions\/[a-f0-9-]{36}\//, message: 'Hardcoded subscription ID detected' },
    ];

    hardcodedPatterns.forEach(check => {
      if (check.pattern.test(content)) {
        warnings.push({
          message: check.message,
          severity: 'warning'
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate Prisma schema
   */
  async validatePrisma(content, filePath) {
    const errors = [];
    const warnings = [];

    // Check for required blocks
    if (!content.includes('generator client')) {
      errors.push({
        message: 'Missing generator client block',
        severity: 'error'
      });
    }

    if (!content.includes('datasource db')) {
      errors.push({
        message: 'Missing datasource db block',
        severity: 'error'
      });
    }

    // Check for models without @id
    const modelPattern = /model\s+(\w+)\s*{([^}]*)}/g;
    let match;
    while ((match = modelPattern.exec(content)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];
      
      if (!modelBody.includes('@id')) {
        errors.push({
          message: `Model ${modelName} is missing @id field`,
          severity: 'error'
        });
      }

      // Check for timestamp fields
      if (!modelBody.includes('createdAt') && !modelBody.includes('created_at')) {
        warnings.push({
          message: `Model ${modelName} should have a createdAt timestamp`,
          severity: 'warning'
        });
      }
    }

    // Check for relation completeness
    const relationPattern = /@relation\([^)]*\)/g;
    const relations = content.match(relationPattern) || [];
    relations.forEach(rel => {
      if (!rel.includes('fields:') || !rel.includes('references:')) {
        warnings.push({
          message: 'Relation should specify fields and references',
          severity: 'warning'
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate JSON
   */
  async validateJson(content, filePath) {
    const errors = [];
    const warnings = [];

    try {
      JSON.parse(content);
    } catch (error) {
      const match = error.message.match(/position (\d+)/);
      const position = match ? parseInt(match[1]) : 0;
      const lines = content.substring(0, position).split('\n');
      
      errors.push({
        message: `Invalid JSON: ${error.message}`,
        line: lines.length,
        severity: 'error'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate CSS
   */
  async validateCss(content, filePath) {
    const errors = [];
    const warnings = [];

    // Check for unbalanced braces
    const braceBalance = this.checkBraceBalance(content);
    if (braceBalance !== 0) {
      errors.push({
        message: `Unbalanced braces in CSS`,
        severity: 'error'
      });
    }

    // Check for common issues
    const issues = [
      { pattern: /!important/, message: 'Avoid using !important' },
      { pattern: /#[0-9a-fA-F]{3}(?![0-9a-fA-F])/, message: 'Consider using 6-digit hex colors for consistency' },
    ];

    issues.forEach(issue => {
      if (issue.pattern.test(content)) {
        warnings.push({
          message: issue.message,
          severity: 'warning'
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate HTML
   */
  async validateHtml(content, filePath) {
    const errors = [];
    const warnings = [];

    // Check for doctype
    if (!content.toLowerCase().includes('<!doctype html>')) {
      warnings.push({
        message: 'Missing DOCTYPE declaration',
        severity: 'warning'
      });
    }

    // Check for unclosed tags
    const selfClosing = ['br', 'hr', 'img', 'input', 'link', 'meta', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    const tagPattern = /<(\w+)[^>]*>/g;
    const closePattern = /<\/(\w+)>/g;
    
    const openTags = {};
    const closeTags = {};
    
    let match;
    while ((match = tagPattern.exec(content)) !== null) {
      const tag = match[1].toLowerCase();
      if (!selfClosing.includes(tag)) {
        openTags[tag] = (openTags[tag] || 0) + 1;
      }
    }
    
    while ((match = closePattern.exec(content)) !== null) {
      const tag = match[1].toLowerCase();
      closeTags[tag] = (closeTags[tag] || 0) + 1;
    }

    for (const tag in openTags) {
      if (openTags[tag] !== (closeTags[tag] || 0)) {
        warnings.push({
          message: `Potentially unclosed <${tag}> tag`,
          severity: 'warning'
        });
      }
    }

    // Check for alt attributes on images
    const imgPattern = /<img[^>]*>/gi;
    while ((match = imgPattern.exec(content)) !== null) {
      if (!match[0].includes('alt=')) {
        warnings.push({
          message: 'Image tag missing alt attribute',
          severity: 'warning'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Check brace balance
   */
  checkBraceBalance(content) {
    let balance = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const prevChar = content[i - 1];
      
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }
      
      if (!inString) {
        if (char === '{') balance++;
        if (char === '}') balance--;
      }
    }
    
    return balance;
  }

  /**
   * Check parentheses balance
   */
  checkParenBalance(content) {
    let balance = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const prevChar = content[i - 1];
      
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }
      
      if (!inString) {
        if (char === '(') balance++;
        if (char === ')') balance--;
      }
    }
    
    return balance;
  }

  /**
   * Format validation results for output
   */
  formatResults(summary) {
    let output = '';
    
    if (summary.valid) {
      output += `✅ All ${summary.totalFiles} files passed validation\n`;
    } else {
      output += `❌ Validation failed: ${summary.totalErrors} errors, ${summary.totalWarnings} warnings\n`;
    }

    output += '\n';

    for (const result of summary.results) {
      if (result.errors.length > 0 || result.warnings.length > 0) {
        output += `📄 ${result.file}\n`;
        
        for (const error of result.errors) {
          output += `  ❌ ${error.message}${error.line ? ` (line ${error.line})` : ''}\n`;
        }
        
        for (const warning of result.warnings) {
          output += `  ⚠️ ${warning.message}${warning.line ? ` (line ${warning.line})` : ''}\n`;
        }
        
        output += '\n';
      }
    }

    return output;
  }
}

module.exports = CodeValidator;
