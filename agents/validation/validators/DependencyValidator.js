/**
 * DependencyValidator - VF-03
 * Validates that all imports/dependencies are resolvable
 * Detects circular dependencies and version conflicts
 */

import { parse } from 'acorn';
import * as walk from 'acorn-walk';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, resolve, relative } from 'path';

/**
 * @typedef {Object} DependencyResult
 * @property {string} import - The import path/name
 * @property {boolean} resolved - Whether it could be resolved
 * @property {string} [version] - Package version if available
 * @property {string} [resolvedPath] - Full resolved path
 * @property {string} [error] - Error message if not resolved
 * @property {'npm'|'local'|'builtin'} type - Type of dependency
 */

/**
 * @typedef {Object} CircularDependency
 * @property {string[]} cycle - Array of files forming the cycle
 */

/**
 * @typedef {Object} DependencyValidationResult
 * @property {'PASS'|'FAIL'} status
 * @property {DependencyResult[]} dependencies
 * @property {CircularDependency[]} circularDependencies
 * @property {string[]} missingDependencies
 * @property {number} durationMs
 */

export class DependencyValidator {
  constructor() {
    // Node.js built-in modules
    this.builtinModules = new Set([
      'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
      'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
      'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode',
      'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'sys',
      'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads',
      'zlib', 'node:fs', 'node:path', 'node:url', 'node:os', 'node:crypto',
      'node:http', 'node:https', 'node:stream', 'node:events', 'node:util',
      'node:child_process', 'node:worker_threads', 'node:buffer', 'node:assert',
      'node:test'
    ]);
  }

  /**
   * Validate dependencies in code
   * @param {string} code - The code to analyze
   * @param {string} filePath - The file path (for resolving relative imports)
   * @param {string} [projectRoot] - Project root directory
   * @returns {Promise<DependencyValidationResult>}
   */
  async validate(code, filePath, projectRoot = null) {
    const startTime = Date.now();
    
    // Determine project root
    const root = projectRoot || this._findProjectRoot(filePath);
    const fileDir = dirname(filePath);
    
    // Extract imports
    const imports = this._extractImports(code);
    
    // Resolve each import
    const dependencies = [];
    const missingDependencies = [];
    
    for (const importPath of imports) {
      const result = this._resolveImport(importPath, fileDir, root);
      dependencies.push(result);
      
      if (!result.resolved) {
        missingDependencies.push(importPath);
      }
    }

    // Check for circular dependencies
    const circularDependencies = await this._detectCircularDependencies(filePath, root);

    // Determine overall status
    const status = (missingDependencies.length === 0 && circularDependencies.length === 0) 
      ? 'PASS' 
      : 'FAIL';

    return {
      status,
      dependencies,
      circularDependencies,
      missingDependencies,
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Extract import statements from JavaScript/TypeScript code
   */
  _extractImports(code) {
    const imports = new Set();
    
    try {
      const ast = parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true
      });

      walk.simple(ast, {
        ImportDeclaration(node) {
          if (node.source && node.source.value) {
            imports.add(node.source.value);
          }
        },
        ImportExpression(node) {
          // Dynamic import: import('module')
          if (node.source && node.source.type === 'Literal') {
            imports.add(node.source.value);
          }
        },
        CallExpression(node) {
          // require('module')
          if (node.callee.name === 'require' && 
              node.arguments.length > 0 && 
              node.arguments[0].type === 'Literal') {
            imports.add(node.arguments[0].value);
          }
        }
      });
    } catch (error) {
      // If parsing fails, try regex fallback
      const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
      let match;
      while ((match = importRegex.exec(code)) !== null) {
        imports.add(match[1]);
      }
    }

    return Array.from(imports);
  }

  /**
   * Resolve an import to its actual location
   */
  _resolveImport(importPath, fileDir, projectRoot) {
    // Check if it's a built-in module
    if (this.builtinModules.has(importPath) || this.builtinModules.has(importPath.replace('node:', ''))) {
      return {
        import: importPath,
        resolved: true,
        type: 'builtin'
      };
    }

    // Check if it's a relative import
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      return this._resolveLocalImport(importPath, fileDir);
    }

    // It's an npm package
    return this._resolveNpmImport(importPath, projectRoot);
  }

  /**
   * Resolve a local/relative import
   */
  _resolveLocalImport(importPath, fileDir) {
    const basePath = resolve(fileDir, importPath);
    
    // Try various extensions
    const extensions = ['', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '/index.js', '/index.ts'];
    
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (existsSync(fullPath) && statSync(fullPath).isFile()) {
        return {
          import: importPath,
          resolved: true,
          resolvedPath: fullPath,
          type: 'local'
        };
      }
    }

    return {
      import: importPath,
      resolved: false,
      error: `Cannot resolve local import: ${importPath}`,
      type: 'local'
    };
  }

  /**
   * Resolve an npm package import
   */
  _resolveNpmImport(importPath, projectRoot) {
    // Get the package name (handle scoped packages like @babel/parser)
    let packageName = importPath;
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      packageName = parts.slice(0, 2).join('/');
    } else {
      packageName = importPath.split('/')[0];
    }

    // Look for package in node_modules
    const nodeModulesPath = join(projectRoot, 'node_modules', packageName);
    
    if (!existsSync(nodeModulesPath)) {
      return {
        import: importPath,
        resolved: false,
        error: `Package not found: ${packageName}`,
        type: 'npm'
      };
    }

    // Try to read package.json for version info
    const pkgJsonPath = join(nodeModulesPath, 'package.json');
    let version = 'unknown';
    
    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      version = pkgJson.version;
    } catch { /* ignore */ }

    return {
      import: importPath,
      resolved: true,
      version,
      resolvedPath: nodeModulesPath,
      type: 'npm'
    };
  }

  /**
   * Find project root by looking for package.json
   */
  _findProjectRoot(filePath) {
    let dir = dirname(filePath);
    
    while (dir !== dirname(dir)) { // Stop at filesystem root
      if (existsSync(join(dir, 'package.json'))) {
        return dir;
      }
      dir = dirname(dir);
    }
    
    return dirname(filePath); // Fallback to file's directory
  }

  /**
   * Detect circular dependencies starting from a file
   */
  async _detectCircularDependencies(entryFile, projectRoot) {
    const cycles = [];
    const visited = new Set();
    const stack = [];

    const detectCycle = (filePath) => {
      if (!existsSync(filePath) || !filePath.endsWith('.js') && !filePath.endsWith('.ts')) {
        return;
      }

      // Normalize path
      const normalizedPath = resolve(filePath);
      
      // Check if we're in a cycle
      const stackIndex = stack.indexOf(normalizedPath);
      if (stackIndex !== -1) {
        // Found a cycle
        const cycle = stack.slice(stackIndex).map(p => relative(projectRoot, p));
        cycle.push(relative(projectRoot, normalizedPath)); // Complete the cycle
        cycles.push({ cycle });
        return;
      }

      // Skip if already fully visited
      if (visited.has(normalizedPath)) {
        return;
      }

      // Add to current path
      stack.push(normalizedPath);

      try {
        const code = readFileSync(normalizedPath, 'utf8');
        const imports = this._extractImports(code);
        const fileDir = dirname(normalizedPath);

        for (const imp of imports) {
          // Only check local imports for circular dependencies
          if (imp.startsWith('.') || imp.startsWith('/')) {
            const resolved = this._resolveLocalImport(imp, fileDir);
            if (resolved.resolved && resolved.resolvedPath) {
              detectCycle(resolved.resolvedPath);
            }
          }
        }
      } catch { /* ignore unreadable files */ }

      // Mark as fully visited and remove from stack
      visited.add(normalizedPath);
      stack.pop();
    };

    detectCycle(entryFile);
    
    return cycles;
  }

  /**
   * Validate multiple files and aggregate results
   */
  async validateProject(projectRoot) {
    const results = {
      status: 'PASS',
      files: new Map(),
      allMissingDependencies: [],
      allCircularDependencies: [],
      summary: {
        totalFiles: 0,
        totalImports: 0,
        resolvedImports: 0,
        unresolvedImports: 0
      }
    };

    // Find all JS/TS files
    const files = this._findJsFiles(projectRoot);
    
    for (const file of files) {
      try {
        const code = readFileSync(file, 'utf8');
        const fileResult = await this.validate(code, file, projectRoot);
        
        results.files.set(file, fileResult);
        results.summary.totalFiles++;
        results.summary.totalImports += fileResult.dependencies.length;
        results.summary.resolvedImports += fileResult.dependencies.filter(d => d.resolved).length;
        results.summary.unresolvedImports += fileResult.missingDependencies.length;
        
        if (fileResult.missingDependencies.length > 0) {
          results.allMissingDependencies.push(...fileResult.missingDependencies.map(d => ({
            file: relative(projectRoot, file),
            dependency: d
          })));
        }
        
        results.allCircularDependencies.push(...fileResult.circularDependencies);
        
        if (fileResult.status === 'FAIL') {
          results.status = 'FAIL';
        }
      } catch { /* skip unreadable files */ }
    }

    return results;
  }

  /**
   * Find all JavaScript/TypeScript files in a directory
   */
  _findJsFiles(dir, files = []) {
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        // Skip node_modules and hidden directories
        if (entry === 'node_modules' || entry.startsWith('.')) continue;
        
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          this._findJsFiles(fullPath, files);
        } else if (/\.(js|mjs|cjs|ts|tsx)$/.test(entry)) {
          files.push(fullPath);
        }
      }
    } catch { /* ignore permission errors */ }
    
    return files;
  }
}

export default DependencyValidator;
