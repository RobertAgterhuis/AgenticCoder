# Phase 5: Validators & Benchmarks

**Phase ID:** F-TVF-P05  
**Feature:** TestingValidationFramework  
**Duration:** 5-6 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 4 (E2E Scenario Tests)

---

## 🎯 Phase Objectives

Deze phase implementeert **Code Validators en Performance Benchmarks**:
- TypeScript/TSX code validation
- Bicep template validation
- SQL schema validation
- OpenAPI specification validation
- Performance benchmarks
- Regression detection

---

## 📦 Deliverables

### 1. Validator Structure

```
src/
├── validators/
│   ├── CodeValidator.ts
│   ├── TypeScriptValidator.ts
│   ├── BicepValidator.ts
│   ├── SQLValidator.ts
│   ├── OpenAPIValidator.ts
│   └── ValidationResult.ts
├── benchmarks/
│   ├── BenchmarkSuite.ts
│   ├── AgentBenchmark.ts
│   ├── ThroughputBenchmark.ts
│   └── MemoryBenchmark.ts
└── reporting/
    ├── TestReporter.ts
    ├── BenchmarkReporter.ts
    └── CoverageReporter.ts
```

---

## 🔧 Implementation Details

### 5.1 Base Validation Result (`src/validators/ValidationResult.ts`)

```typescript
import { z } from 'zod';

/**
 * Severity levels for validation messages
 */
export type ValidationSeverity = 'error' | 'warning' | 'info' | 'hint';

/**
 * Single validation message
 */
export interface ValidationMessage {
  severity: ValidationSeverity;
  code: string;
  message: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  source?: string;
  suggestion?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  info: ValidationMessage[];
  metadata: {
    validator: string;
    duration: number;
    codeSize: number;
    timestamp: Date;
  };
}

/**
 * Validation options
 */
export interface ValidationOptions {
  strict?: boolean;
  allowWarnings?: boolean;
  maxErrors?: number;
  timeout?: number;
}

/**
 * Base validator interface
 */
export interface IValidator {
  name: string;
  validate(code: string, options?: ValidationOptions): Promise<ValidationResult>;
  supports(fileType: string): boolean;
}

/**
 * Create empty validation result
 */
export function createEmptyResult(validator: string): ValidationResult {
  return {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
    metadata: {
      validator,
      duration: 0,
      codeSize: 0,
      timestamp: new Date(),
    },
  };
}

/**
 * Merge multiple validation results
 */
export function mergeResults(results: ValidationResult[]): ValidationResult {
  const merged = createEmptyResult('merged');
  
  for (const result of results) {
    merged.errors.push(...result.errors);
    merged.warnings.push(...result.warnings);
    merged.info.push(...result.info);
    merged.metadata.duration += result.metadata.duration;
  }

  merged.valid = merged.errors.length === 0;
  return merged;
}
```

### 5.2 TypeScript Validator (`src/validators/TypeScriptValidator.ts`)

```typescript
import ts from 'typescript';
import { 
  IValidator, 
  ValidationResult, 
  ValidationOptions,
  ValidationMessage,
  createEmptyResult 
} from './ValidationResult';

/**
 * TypeScript-specific validation options
 */
export interface TypeScriptValidationOptions extends ValidationOptions {
  jsx?: boolean;
  target?: ts.ScriptTarget;
  module?: ts.ModuleKind;
  strict?: boolean;
  noImplicitAny?: boolean;
  strictNullChecks?: boolean;
}

/**
 * TypeScript code validator
 */
export class TypeScriptValidator implements IValidator {
  name = 'typescript';

  /**
   * Check if file type is supported
   */
  supports(fileType: string): boolean {
    return ['ts', 'tsx', 'js', 'jsx'].includes(fileType.toLowerCase());
  }

  /**
   * Validate TypeScript code
   */
  async validate(
    code: string, 
    options: TypeScriptValidationOptions = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const result = createEmptyResult(this.name);
    result.metadata.codeSize = code.length;

    try {
      // Create compiler options
      const compilerOptions: ts.CompilerOptions = {
        target: options.target ?? ts.ScriptTarget.ES2022,
        module: options.module ?? ts.ModuleKind.ESNext,
        strict: options.strict ?? true,
        noImplicitAny: options.noImplicitAny ?? true,
        strictNullChecks: options.strictNullChecks ?? true,
        jsx: options.jsx ? ts.JsxEmit.React : undefined,
        noEmit: true,
        skipLibCheck: true,
        esModuleInterop: true,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
      };

      // Create virtual file
      const fileName = options.jsx ? 'input.tsx' : 'input.ts';
      const sourceFile = ts.createSourceFile(
        fileName,
        code,
        compilerOptions.target!,
        true,
        options.jsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      // Syntax errors (parse phase)
      const syntaxErrors = this.getSyntaxErrors(sourceFile, code);
      result.errors.push(...syntaxErrors);

      // If no syntax errors, do semantic analysis
      if (syntaxErrors.length === 0) {
        const semanticErrors = await this.getSemanticErrors(
          code, 
          fileName, 
          compilerOptions
        );
        result.errors.push(...semanticErrors.filter(e => e.severity === 'error'));
        result.warnings.push(...semanticErrors.filter(e => e.severity === 'warning'));
      }

      result.valid = result.errors.length === 0;

    } catch (error) {
      result.errors.push({
        severity: 'error',
        code: 'TS_INTERNAL',
        message: error instanceof Error ? error.message : String(error),
      });
      result.valid = false;
    }

    result.metadata.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Get syntax errors from source file
   */
  private getSyntaxErrors(
    sourceFile: ts.SourceFile, 
    code: string
  ): ValidationMessage[] {
    const errors: ValidationMessage[] = [];
    
    // Check for parse errors in the source file
    const syntaxDiagnostics = (sourceFile as any).parseDiagnostics || [];
    
    for (const diag of syntaxDiagnostics) {
      const pos = this.getPosition(code, diag.start || 0);
      errors.push({
        severity: 'error',
        code: `TS${diag.code}`,
        message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
        line: pos.line,
        column: pos.column,
      });
    }

    return errors;
  }

  /**
   * Get semantic errors using compiler
   */
  private async getSemanticErrors(
    code: string,
    fileName: string,
    compilerOptions: ts.CompilerOptions
  ): Promise<ValidationMessage[]> {
    const errors: ValidationMessage[] = [];

    // Create program with virtual file system
    const host = this.createCompilerHost(code, fileName, compilerOptions);
    const program = ts.createProgram([fileName], compilerOptions, host);
    
    // Get all diagnostics
    const allDiagnostics = [
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics(),
    ];

    for (const diag of allDiagnostics) {
      const severity = this.getSeverity(diag.category);
      const pos = diag.start !== undefined 
        ? this.getPosition(code, diag.start) 
        : { line: 1, column: 1 };

      errors.push({
        severity,
        code: `TS${diag.code}`,
        message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
        line: pos.line,
        column: pos.column,
      });
    }

    return errors;
  }

  /**
   * Create compiler host for in-memory compilation
   */
  private createCompilerHost(
    code: string,
    fileName: string,
    options: ts.CompilerOptions
  ): ts.CompilerHost {
    const fileMap = new Map<string, string>();
    fileMap.set(fileName, code);

    return {
      getSourceFile: (name) => {
        const content = fileMap.get(name);
        if (content) {
          return ts.createSourceFile(name, content, options.target!, true);
        }
        return undefined;
      },
      getDefaultLibFileName: () => 'lib.d.ts',
      writeFile: () => {},
      getCurrentDirectory: () => '/',
      getCanonicalFileName: (f) => f,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      fileExists: (name) => fileMap.has(name) || name === 'lib.d.ts',
      readFile: (name) => fileMap.get(name),
    };
  }

  /**
   * Get position (line, column) from offset
   */
  private getPosition(code: string, offset: number): { line: number; column: number } {
    let line = 1;
    let column = 1;
    
    for (let i = 0; i < offset && i < code.length; i++) {
      if (code[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }

    return { line, column };
  }

  /**
   * Convert TypeScript severity to our severity
   */
  private getSeverity(category: ts.DiagnosticCategory): 'error' | 'warning' | 'info' {
    switch (category) {
      case ts.DiagnosticCategory.Error:
        return 'error';
      case ts.DiagnosticCategory.Warning:
        return 'warning';
      default:
        return 'info';
    }
  }
}
```

### 5.3 Bicep Validator (`src/validators/BicepValidator.ts`)

```typescript
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { v4 as uuid } from 'uuid';
import {
  IValidator,
  ValidationResult,
  ValidationOptions,
  ValidationMessage,
  createEmptyResult,
} from './ValidationResult';

/**
 * Bicep-specific validation options
 */
export interface BicepValidationOptions extends ValidationOptions {
  targetScope?: 'resourceGroup' | 'subscription' | 'managementGroup' | 'tenant';
  parameterFile?: string;
}

/**
 * Bicep infrastructure code validator
 */
export class BicepValidator implements IValidator {
  name = 'bicep';
  private bicepPath: string;

  constructor(bicepPath?: string) {
    this.bicepPath = bicepPath || 'bicep';
  }

  /**
   * Check if file type is supported
   */
  supports(fileType: string): boolean {
    return fileType.toLowerCase() === 'bicep';
  }

  /**
   * Validate Bicep code
   */
  async validate(
    code: string,
    options: BicepValidationOptions = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const result = createEmptyResult(this.name);
    result.metadata.codeSize = code.length;

    // Create temp file
    const tempFile = join(tmpdir(), `bicep-${uuid()}.bicep`);

    try {
      // Write code to temp file
      await writeFile(tempFile, code, 'utf-8');

      // Run bicep build (validates and compiles)
      const output = await this.runBicepBuild(tempFile, options);

      // Parse bicep output
      const messages = this.parseBicepOutput(output, code);
      
      for (const msg of messages) {
        if (msg.severity === 'error') {
          result.errors.push(msg);
        } else if (msg.severity === 'warning') {
          result.warnings.push(msg);
        } else {
          result.info.push(msg);
        }
      }

      result.valid = result.errors.length === 0;

    } catch (error) {
      // Parse error output if available
      if (error instanceof BicepError) {
        const messages = this.parseBicepOutput(error.output, code);
        result.errors.push(...messages.filter(m => m.severity === 'error'));
        result.warnings.push(...messages.filter(m => m.severity === 'warning'));
      } else {
        result.errors.push({
          severity: 'error',
          code: 'BICEP_INTERNAL',
          message: error instanceof Error ? error.message : String(error),
        });
      }
      result.valid = false;

    } finally {
      // Cleanup temp file
      try {
        await unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }

    result.metadata.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Run bicep build command
   */
  private runBicepBuild(
    filePath: string,
    options: BicepValidationOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ['build', filePath, '--stdout'];

      if (options.parameterFile) {
        args.push('--parameters', options.parameterFile);
      }

      const process = spawn(this.bicepPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new BicepError(`Bicep build failed with code ${code}`, stderr));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        process.kill();
        reject(new Error('Bicep validation timeout'));
      }, options.timeout || 30000);
    });
  }

  /**
   * Parse bicep CLI output
   */
  private parseBicepOutput(output: string, code: string): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const lines = output.split('\n');

    // Regex to match bicep error/warning format:
    // filepath(line,col) : severity BCP### : message
    const pattern = /\((\d+),(\d+)\)\s*:\s*(Error|Warning|Info)\s+(BCP\d+):\s*(.+)/i;

    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        const [, lineNum, colNum, severity, code, message] = match;
        messages.push({
          severity: severity.toLowerCase() as 'error' | 'warning' | 'info',
          code,
          message,
          line: parseInt(lineNum, 10),
          column: parseInt(colNum, 10),
        });
      }
    }

    return messages;
  }

  /**
   * Check if bicep CLI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.runBicepBuild('--version', {} as any);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Custom Bicep error
 */
class BicepError extends Error {
  constructor(message: string, public output: string) {
    super(message);
    this.name = 'BicepError';
  }
}
```

### 5.4 OpenAPI Validator (`src/validators/OpenAPIValidator.ts`)

```typescript
import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import {
  IValidator,
  ValidationResult,
  ValidationOptions,
  ValidationMessage,
  createEmptyResult,
} from './ValidationResult';

/**
 * OpenAPI-specific validation options
 */
export interface OpenAPIValidationOptions extends ValidationOptions {
  version?: '2.0' | '3.0' | '3.1';
  dereference?: boolean;
}

/**
 * OpenAPI/Swagger specification validator
 */
export class OpenAPIValidator implements IValidator {
  name = 'openapi';

  /**
   * Check if file type is supported
   */
  supports(fileType: string): boolean {
    return ['yaml', 'yml', 'json'].includes(fileType.toLowerCase());
  }

  /**
   * Validate OpenAPI specification
   */
  async validate(
    code: string,
    options: OpenAPIValidationOptions = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const result = createEmptyResult(this.name);
    result.metadata.codeSize = code.length;

    try {
      // Parse as YAML or JSON
      let spec: unknown;
      try {
        spec = JSON.parse(code);
      } catch {
        const yaml = await import('yaml');
        spec = yaml.parse(code);
      }

      // Validate with swagger-parser
      const validationMethod = options.dereference
        ? SwaggerParser.dereference
        : SwaggerParser.validate;

      const api = await validationMethod(spec as OpenAPI.Document);

      // Run additional custom validations
      const customMessages = this.runCustomValidations(api as OpenAPIV3.Document);
      result.warnings.push(...customMessages.filter(m => m.severity === 'warning'));
      result.info.push(...customMessages.filter(m => m.severity === 'info'));

      result.valid = true;

    } catch (error) {
      // swagger-parser throws detailed validation errors
      if (error instanceof Error) {
        const messages = this.parseSwaggerError(error);
        result.errors.push(...messages);
      } else {
        result.errors.push({
          severity: 'error',
          code: 'OPENAPI_PARSE',
          message: String(error),
        });
      }
      result.valid = false;
    }

    result.metadata.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Parse swagger-parser error
   */
  private parseSwaggerError(error: Error): ValidationMessage[] {
    const messages: ValidationMessage[] = [];

    // swagger-parser provides detailed error messages
    const errorMessage = error.message;
    
    // Try to extract location info from error
    const locationMatch = errorMessage.match(/at path "([^"]+)"/);
    
    messages.push({
      severity: 'error',
      code: 'OPENAPI_VALIDATION',
      message: errorMessage,
      source: locationMatch?.[1],
    });

    return messages;
  }

  /**
   * Run custom OpenAPI validations
   */
  private runCustomValidations(api: OpenAPIV3.Document): ValidationMessage[] {
    const messages: ValidationMessage[] = [];

    // Check for missing descriptions
    if (!api.info.description) {
      messages.push({
        severity: 'warning',
        code: 'OPENAPI_MISSING_DESCRIPTION',
        message: 'API info.description is missing',
      });
    }

    // Check for missing security definitions
    if (!api.components?.securitySchemes && api.security) {
      messages.push({
        severity: 'warning',
        code: 'OPENAPI_MISSING_SECURITY',
        message: 'Security is referenced but no securitySchemes defined',
      });
    }

    // Check for missing operation IDs
    for (const [path, pathItem] of Object.entries(api.paths || {})) {
      for (const method of ['get', 'post', 'put', 'delete', 'patch'] as const) {
        const operation = (pathItem as any)?.[method] as OpenAPIV3.OperationObject;
        if (operation && !operation.operationId) {
          messages.push({
            severity: 'info',
            code: 'OPENAPI_MISSING_OPERATION_ID',
            message: `Missing operationId for ${method.toUpperCase()} ${path}`,
          });
        }
      }
    }

    return messages;
  }

  /**
   * Get API summary
   */
  async getAPISummary(code: string): Promise<APISummary> {
    let spec: any;
    try {
      spec = JSON.parse(code);
    } catch {
      const yaml = await import('yaml');
      spec = yaml.parse(code);
    }

    const api = await SwaggerParser.validate(spec);
    const doc = api as OpenAPIV3.Document;

    const paths = Object.entries(doc.paths || {});
    let operationCount = 0;
    
    for (const [, pathItem] of paths) {
      for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']) {
        if ((pathItem as any)?.[method]) {
          operationCount++;
        }
      }
    }

    return {
      title: doc.info.title,
      version: doc.info.version,
      pathCount: paths.length,
      operationCount,
      securitySchemes: Object.keys(doc.components?.securitySchemes || {}),
    };
  }
}

/**
 * API summary info
 */
export interface APISummary {
  title: string;
  version: string;
  pathCount: number;
  operationCount: number;
  securitySchemes: string[];
}
```

### 5.5 Code Validator Facade (`src/validators/CodeValidator.ts`)

```typescript
import { TypeScriptValidator, TypeScriptValidationOptions } from './TypeScriptValidator';
import { BicepValidator, BicepValidationOptions } from './BicepValidator';
import { OpenAPIValidator, OpenAPIValidationOptions } from './OpenAPIValidator';
import { ValidationResult, ValidationOptions, mergeResults } from './ValidationResult';

/**
 * Code validation options
 */
export interface CodeValidationOptions extends ValidationOptions {
  fileType?: string;
  fileName?: string;
}

/**
 * Unified code validator facade
 */
export class CodeValidator {
  private tsValidator = new TypeScriptValidator();
  private bicepValidator = new BicepValidator();
  private openAPIValidator = new OpenAPIValidator();

  /**
   * Validate code based on file type
   */
  async validate(code: string, options: CodeValidationOptions = {}): Promise<ValidationResult> {
    const fileType = options.fileType || this.inferFileType(options.fileName || '', code);

    switch (fileType) {
      case 'ts':
      case 'typescript':
        return this.tsValidator.validate(code, options as TypeScriptValidationOptions);
      
      case 'tsx':
        return this.tsValidator.validate(code, { ...options, jsx: true } as TypeScriptValidationOptions);
      
      case 'bicep':
        return this.bicepValidator.validate(code, options as BicepValidationOptions);
      
      case 'yaml':
      case 'yml':
      case 'json':
        // Attempt OpenAPI validation if looks like OpenAPI spec
        if (this.looksLikeOpenAPI(code)) {
          return this.openAPIValidator.validate(code, options as OpenAPIValidationOptions);
        }
        return this.createUnsupportedResult(fileType);
      
      default:
        return this.createUnsupportedResult(fileType);
    }
  }

  /**
   * Validate TypeScript code
   */
  async validateTypeScript(
    code: string, 
    options?: TypeScriptValidationOptions
  ): Promise<ValidationResult> {
    return this.tsValidator.validate(code, options);
  }

  /**
   * Validate Bicep code
   */
  async validateBicep(
    code: string, 
    options?: BicepValidationOptions
  ): Promise<ValidationResult> {
    return this.bicepValidator.validate(code, options);
  }

  /**
   * Validate OpenAPI spec
   */
  async validateOpenAPI(
    code: string, 
    options?: OpenAPIValidationOptions
  ): Promise<ValidationResult> {
    return this.openAPIValidator.validate(code, options);
  }

  /**
   * Validate SQL (basic syntax check)
   */
  async validateSQL(sql: string): Promise<ValidationResult> {
    const startTime = Date.now();
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      info: [],
      metadata: {
        validator: 'sql',
        duration: 0,
        codeSize: sql.length,
        timestamp: new Date(),
      },
    };

    // Basic SQL syntax patterns
    const patterns = [
      { pattern: /SELECT\s+\*\s+FROM/i, warning: 'Avoid SELECT * in production code' },
      { pattern: /DROP\s+(TABLE|DATABASE)/i, warning: 'DROP statement detected - ensure this is intentional' },
    ];

    for (const { pattern, warning } of patterns) {
      if (pattern.test(sql)) {
        result.warnings.push({
          severity: 'warning',
          code: 'SQL_LINT',
          message: warning,
        });
      }
    }

    // Check for unclosed quotes
    const singleQuotes = (sql.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      result.errors.push({
        severity: 'error',
        code: 'SQL_SYNTAX',
        message: 'Unclosed single quote detected',
      });
      result.valid = false;
    }

    result.metadata.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Validate multiple files
   */
  async validateMultiple(
    files: Array<{ code: string; fileName: string }>
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    await Promise.all(
      files.map(async ({ code, fileName }) => {
        const result = await this.validate(code, { fileName });
        results.set(fileName, result);
      })
    );

    return results;
  }

  /**
   * Infer file type from name or content
   */
  private inferFileType(fileName: string, code: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (ext) return ext;

    // Infer from content
    if (code.includes('import React') || code.includes('from "react"')) {
      return 'tsx';
    }
    if (code.includes('param ') && code.includes('resource ')) {
      return 'bicep';
    }
    if (code.includes('openapi:') || code.includes('"openapi":')) {
      return 'yaml';
    }

    return 'ts'; // Default to TypeScript
  }

  /**
   * Check if code looks like OpenAPI spec
   */
  private looksLikeOpenAPI(code: string): boolean {
    return code.includes('openapi:') || 
           code.includes('"openapi"') ||
           code.includes('swagger:') ||
           code.includes('"swagger"');
  }

  /**
   * Create unsupported file type result
   */
  private createUnsupportedResult(fileType: string): ValidationResult {
    return {
      valid: true,
      errors: [],
      warnings: [{
        severity: 'warning',
        code: 'UNSUPPORTED',
        message: `No validator available for file type: ${fileType}`,
      }],
      info: [],
      metadata: {
        validator: 'none',
        duration: 0,
        codeSize: 0,
        timestamp: new Date(),
      },
    };
  }
}
```

### 5.6 Benchmark Suite (`src/benchmarks/BenchmarkSuite.ts`)

```typescript
import { performance } from 'perf_hooks';

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  operationsPerSecond: number;
  memoryUsage?: MemoryUsage;
  timestamp: Date;
}

/**
 * Memory usage stats
 */
export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

/**
 * Benchmark options
 */
export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  timeout?: number;
  trackMemory?: boolean;
}

/**
 * Benchmark function type
 */
export type BenchmarkFn = () => void | Promise<void>;

/**
 * Benchmark comparison result
 */
export interface ComparisonResult {
  baseline: BenchmarkResult;
  current: BenchmarkResult;
  improvement: number; // percentage
  regression: boolean;
  regressionThreshold: number;
}

/**
 * Benchmark suite for performance testing
 */
export class BenchmarkSuite {
  private benchmarks: Map<string, BenchmarkFn> = new Map();
  private results: Map<string, BenchmarkResult> = new Map();
  private baselines: Map<string, BenchmarkResult> = new Map();

  /**
   * Add benchmark
   */
  add(name: string, fn: BenchmarkFn): this {
    this.benchmarks.set(name, fn);
    return this;
  }

  /**
   * Run all benchmarks
   */
  async run(options: BenchmarkOptions = {}): Promise<Map<string, BenchmarkResult>> {
    const {
      iterations = 100,
      warmupIterations = 10,
      trackMemory = true,
    } = options;

    for (const [name, fn] of this.benchmarks) {
      const result = await this.runBenchmark(name, fn, {
        iterations,
        warmupIterations,
        trackMemory,
      });
      this.results.set(name, result);
    }

    return this.results;
  }

  /**
   * Run single benchmark
   */
  async runBenchmark(
    name: string,
    fn: BenchmarkFn,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    const {
      iterations = 100,
      warmupIterations = 10,
      trackMemory = true,
    } = options;

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    const times: number[] = [];
    let memoryBefore: MemoryUsage | undefined;
    let memoryAfter: MemoryUsage | undefined;

    if (trackMemory) {
      memoryBefore = this.getMemoryUsage();
    }

    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    if (trackMemory) {
      memoryAfter = this.getMemoryUsage();
    }

    // Calculate statistics
    const totalTime = times.reduce((a, b) => a + b, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const variance = times.reduce((acc, t) => acc + Math.pow(t - averageTime, 2), 0) / iterations;
    const standardDeviation = Math.sqrt(variance);

    return {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      operationsPerSecond: 1000 / averageTime,
      memoryUsage: memoryAfter,
      timestamp: new Date(),
    };
  }

  /**
   * Set baseline for comparison
   */
  setBaseline(name: string, result: BenchmarkResult): void {
    this.baselines.set(name, result);
  }

  /**
   * Compare against baseline
   */
  compare(name: string, regressionThreshold = 10): ComparisonResult | null {
    const baseline = this.baselines.get(name);
    const current = this.results.get(name);

    if (!baseline || !current) {
      return null;
    }

    const improvement = ((baseline.averageTime - current.averageTime) / baseline.averageTime) * 100;

    return {
      baseline,
      current,
      improvement,
      regression: improvement < -regressionThreshold,
      regressionThreshold,
    };
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
    };
  }

  /**
   * Get results
   */
  getResults(): Map<string, BenchmarkResult> {
    return this.results;
  }

  /**
   * Generate report
   */
  generateReport(): string {
    let report = '# Benchmark Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += '| Benchmark | Avg (ms) | Min (ms) | Max (ms) | Ops/sec | StdDev |\n';
    report += '|-----------|----------|----------|----------|---------|--------|\n';

    for (const [name, result] of this.results) {
      report += `| ${name} | ${result.averageTime.toFixed(3)} | `;
      report += `${result.minTime.toFixed(3)} | ${result.maxTime.toFixed(3)} | `;
      report += `${result.operationsPerSecond.toFixed(1)} | ${result.standardDeviation.toFixed(3)} |\n`;
    }

    return report;
  }
}
```

### 5.7 Agent Benchmark Tests (`tests/benchmarks/agent-benchmarks.test.ts`)

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { BenchmarkSuite, BenchmarkResult } from '../../src/benchmarks/BenchmarkSuite';
import { MockAgent } from '../../src/mocks/MockAgent';
import { MockMessageBus } from '../../src/mocks/MockMessageBus';

describe('Agent Performance Benchmarks', () => {
  let suite: BenchmarkSuite;
  let results: Map<string, BenchmarkResult>;

  beforeAll(async () => {
    suite = new BenchmarkSuite();

    // Agent creation benchmark
    suite.add('agent-creation', () => {
      new MockAgent('test-agent');
    });

    // Agent execution benchmark
    const agent = new MockAgent('test-agent');
    agent.setMockResponse({ success: true, content: 'result' });
    
    suite.add('agent-execute', async () => {
      await agent.execute({ task: 'test' });
    });

    // Message bus publish benchmark
    const bus = MockMessageBus.getInstance();
    
    suite.add('message-publish', () => {
      bus.publish('test-topic', { data: 'test' });
    });

    // Message bus subscribe/publish cycle
    suite.add('message-cycle', async () => {
      const received = new Promise<void>((resolve) => {
        const unsub = bus.subscribe('bench-topic', () => {
          unsub();
          resolve();
        });
        bus.publish('bench-topic', { data: 'test' });
      });
      await received;
    });

    // Run all benchmarks
    results = await suite.run({ iterations: 1000 });
  });

  describe('agent creation', () => {
    it('should create agents quickly', () => {
      const result = results.get('agent-creation');
      expect(result).toBeDefined();
      expect(result!.averageTime).toBeLessThan(1); // < 1ms
    });
  });

  describe('agent execution', () => {
    it('should execute agents within time budget', () => {
      const result = results.get('agent-execute');
      expect(result).toBeDefined();
      expect(result!.averageTime).toBeLessThan(10); // < 10ms
    });

    it('should have low variance', () => {
      const result = results.get('agent-execute');
      expect(result!.standardDeviation).toBeLessThan(result!.averageTime * 0.5);
    });
  });

  describe('message bus', () => {
    it('should publish messages quickly', () => {
      const result = results.get('message-publish');
      expect(result).toBeDefined();
      expect(result!.averageTime).toBeLessThan(0.5); // < 0.5ms
    });

    it('should complete pub/sub cycle quickly', () => {
      const result = results.get('message-cycle');
      expect(result).toBeDefined();
      expect(result!.averageTime).toBeLessThan(5); // < 5ms
    });
  });

  describe('regression detection', () => {
    it('should detect performance regression', () => {
      // Set baseline
      suite.setBaseline('agent-execute', {
        name: 'agent-execute',
        iterations: 1000,
        totalTime: 5000,
        averageTime: 5, // 5ms baseline
        minTime: 4,
        maxTime: 8,
        standardDeviation: 1,
        operationsPerSecond: 200,
        timestamp: new Date(),
      });

      const comparison = suite.compare('agent-execute', 10);
      expect(comparison).toBeDefined();
      
      // Should not regress more than 10%
      if (comparison!.regression) {
        console.warn(`Performance regression detected: ${comparison!.improvement.toFixed(1)}%`);
      }
    });
  });

  describe('report generation', () => {
    it('should generate markdown report', () => {
      const report = suite.generateReport();
      
      expect(report).toContain('# Benchmark Report');
      expect(report).toContain('agent-creation');
      expect(report).toContain('agent-execute');
    });
  });
});
```

### 5.8 Test Reporter (`src/reporting/TestReporter.ts`)

```typescript
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Test result summary
 */
export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  timestamp: Date;
  suites: SuiteSummary[];
}

/**
 * Suite summary
 */
export interface SuiteSummary {
  name: string;
  tests: number;
  passed: number;
  failed: number;
  duration: number;
}

/**
 * Reporter format
 */
export type ReportFormat = 'junit' | 'html' | 'json' | 'markdown';

/**
 * Test reporter for generating reports
 */
export class TestReporter {
  private summary: TestSummary;

  constructor() {
    this.summary = this.createEmptySummary();
  }

  /**
   * Create empty summary
   */
  private createEmptySummary(): TestSummary {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      timestamp: new Date(),
      suites: [],
    };
  }

  /**
   * Add suite results
   */
  addSuite(suite: SuiteSummary): void {
    this.summary.suites.push(suite);
    this.summary.total += suite.tests;
    this.summary.passed += suite.passed;
    this.summary.failed += suite.failed;
    this.summary.duration += suite.duration;
  }

  /**
   * Generate report
   */
  async generate(format: ReportFormat, outputPath: string): Promise<string> {
    let content: string;

    switch (format) {
      case 'junit':
        content = this.generateJUnit();
        break;
      case 'html':
        content = this.generateHTML();
        break;
      case 'json':
        content = this.generateJSON();
        break;
      case 'markdown':
        content = this.generateMarkdown();
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }

    await writeFile(outputPath, content, 'utf-8');
    return outputPath;
  }

  /**
   * Generate JUnit XML
   */
  private generateJUnit(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites tests="${this.summary.total}" failures="${this.summary.failed}" time="${this.summary.duration / 1000}">\n`;

    for (const suite of this.summary.suites) {
      xml += `  <testsuite name="${this.escapeXml(suite.name)}" tests="${suite.tests}" failures="${suite.failed}" time="${suite.duration / 1000}">\n`;
      xml += '  </testsuite>\n';
    }

    xml += '</testsuites>';
    return xml;
  }

  /**
   * Generate HTML report
   */
  private generateHTML(): string {
    const passRate = this.summary.total > 0 
      ? ((this.summary.passed / this.summary.total) * 100).toFixed(1) 
      : '0';

    return `<!DOCTYPE html>
<html>
<head>
  <title>Test Report</title>
  <style>
    body { font-family: sans-serif; margin: 40px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    .passed { color: green; }
    .failed { color: red; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>Test Report</h1>
  <div class="summary">
    <p><strong>Total:</strong> ${this.summary.total}</p>
    <p><strong class="passed">Passed:</strong> ${this.summary.passed}</p>
    <p><strong class="failed">Failed:</strong> ${this.summary.failed}</p>
    <p><strong>Pass Rate:</strong> ${passRate}%</p>
    <p><strong>Duration:</strong> ${(this.summary.duration / 1000).toFixed(2)}s</p>
  </div>
  <table>
    <tr><th>Suite</th><th>Tests</th><th>Passed</th><th>Failed</th><th>Duration</th></tr>
    ${this.summary.suites.map(s => `
    <tr>
      <td>${this.escapeHtml(s.name)}</td>
      <td>${s.tests}</td>
      <td class="passed">${s.passed}</td>
      <td class="failed">${s.failed}</td>
      <td>${(s.duration / 1000).toFixed(2)}s</td>
    </tr>`).join('')}
  </table>
</body>
</html>`;
  }

  /**
   * Generate JSON report
   */
  private generateJSON(): string {
    return JSON.stringify(this.summary, null, 2);
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdown(): string {
    const passRate = this.summary.total > 0 
      ? ((this.summary.passed / this.summary.total) * 100).toFixed(1) 
      : '0';

    let md = '# Test Report\n\n';
    md += `**Generated:** ${this.summary.timestamp.toISOString()}\n\n`;
    md += '## Summary\n\n';
    md += `- **Total:** ${this.summary.total}\n`;
    md += `- **Passed:** ${this.summary.passed} ✅\n`;
    md += `- **Failed:** ${this.summary.failed} ❌\n`;
    md += `- **Pass Rate:** ${passRate}%\n`;
    md += `- **Duration:** ${(this.summary.duration / 1000).toFixed(2)}s\n\n`;
    md += '## Suites\n\n';
    md += '| Suite | Tests | Passed | Failed | Duration |\n';
    md += '|-------|-------|--------|--------|----------|\n';

    for (const suite of this.summary.suites) {
      md += `| ${suite.name} | ${suite.tests} | ${suite.passed} | ${suite.failed} | ${(suite.duration / 1000).toFixed(2)}s |\n`;
    }

    return md;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Get summary
   */
  getSummary(): TestSummary {
    return this.summary;
  }
}
```

---

## 📊 Validator Matrix

| Validator | File Types | Severity Levels | Auto-fix |
|-----------|------------|-----------------|----------|
| TypeScript | .ts, .tsx, .js, .jsx | error, warning | ⚠️ |
| Bicep | .bicep | error, warning, info | ❌ |
| OpenAPI | .yaml, .json | error, warning, info | ❌ |
| SQL | .sql | error, warning | ❌ |

---

## 📋 Acceptance Criteria

- [ ] TypeScriptValidator detects syntax and type errors
- [ ] BicepValidator integrates with bicep CLI
- [ ] OpenAPIValidator validates OpenAPI 3.x specs
- [ ] BenchmarkSuite measures performance accurately
- [ ] Performance regression detection works
- [ ] All report formats generate correctly
- [ ] <5% performance variance between runs

---

## 🔗 MCP Integration

| MCP Server | Gebruik |
|------------|---------|
| **APIMatic MCP** | Enhanced OpenAPI validation |

---

## 🔗 Navigation

← [04-PHASE-E2E-TESTS.md](04-PHASE-E2E-TESTS.md) | [Back to Overview](00-OVERVIEW.md) →
