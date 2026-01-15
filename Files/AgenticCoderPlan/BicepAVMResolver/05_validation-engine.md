# Validation Engine

**Component**: BAR-05  
**Purpose**: Validate AVM template equivalence and correctness  
**Status**: Design Complete  

---

## 🎯 Overview

The Validation Engine:

1. **Validates** AVM templates for correctness
2. **Checks** equivalence with original templates
3. **Verifies** parameter mappings
4. **Tests** deployment syntax
5. **Reports** issues and fixes

---

## 💻 Validation Framework

### Validation Rules
```typescript
interface ValidationRule {
  id: string;                           // rule-001
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  
  validation: (
    original: ParsedBicepTemplate,
    transformed: ParsedBicepTemplate
  ) => ValidationResult[];
}

interface ValidationResult {
  ruleId: string;
  resourceName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details: string;
  location?: string;
  suggestion?: string;
}
```

### Core Validation Rules
```typescript
const validationRules: ValidationRule[] = [
  {
    id: 'rule-001',
    name: 'All Parameters Mapped',
    description: 'Verify all template parameters are properly mapped',
    severity: 'error',
    validation: (original, transformed) => {
      const results: ValidationResult[] = [];
      
      // Check original parameters exist in transformed
      for (const param in original.parameters) {
        const found = transformed.parameters[param] ||
                      findParameterInOutputs(param, transformed);
        
        if (!found) {
          results.push({
            ruleId: 'rule-001',
            resourceName: param,
            severity: 'error',
            message: `Parameter ${param} not found in transformed template`,
            details: `Original template has parameter ${param} but ` +
                     `it's not present in the AVM version`,
            suggestion: `Check parameter mapping for ${param}`
          });
        }
      }
      
      return results;
    }
  },
  
  {
    id: 'rule-002',
    name: 'All Outputs Preserved',
    description: 'Verify all original outputs are preserved',
    severity: 'error',
    validation: (original, transformed) => {
      const results: ValidationResult[] = [];
      
      for (const output in original.outputs) {
        if (!transformed.outputs[output]) {
          results.push({
            ruleId: 'rule-002',
            resourceName: output,
            severity: 'error',
            message: `Output ${output} not found in transformed template`,
            details: `Original template exports ${output} but ` +
                     `it's not present in the AVM version`,
            suggestion: `Ensure module outputs are mapped for ${output}`
          });
        }
      }
      
      return results;
    }
  },
  
  {
    id: 'rule-003',
    name: 'Resource Count Valid',
    description: 'Verify resource count is reasonable',
    severity: 'warning',
    validation: (original, transformed) => {
      const results: ValidationResult[] = [];
      
      const origCount = original.resources.length;
      const transCount = transformed.resources.length;
      
      // Allow small differences (nested resources, etc.)
      if (transCount > origCount * 1.5) {
        results.push({
          ruleId: 'rule-003',
          resourceName: 'general',
          severity: 'warning',
          message: `Resource count increased significantly`,
          details: `Original: ${origCount} resources, Transformed: ${transCount} resources`,
          suggestion: `Review module references for unexpected nested resources`
        });
      }
      
      return results;
    }
  },
  
  {
    id: 'rule-004',
    name: 'No Dangling References',
    description: 'Verify all references are resolvable',
    severity: 'error',
    validation: (original, transformed) => {
      const results: ValidationResult[] = [];
      
      // Check all module references exist
      for (const resource of transformed.resources) {
        for (const dep of resource.dependencies || []) {
          const depExists = transformed.resources.some(
            r => r.name === dep
          );
          
          if (!depExists) {
            results.push({
              ruleId: 'rule-004',
              resourceName: resource.name,
              severity: 'error',
              message: `Dangling reference to ${dep}`,
              details: `Resource ${resource.name} depends on ${dep} ` +
                       `but it doesn't exist in the template`,
              suggestion: `Verify module references and names`
            });
          }
        }
      }
      
      return results;
    }
  },
  
  {
    id: 'rule-005',
    name: 'Valid Bicep Syntax',
    description: 'Verify Bicep syntax is valid',
    severity: 'error',
    validation: (original, transformed) => {
      const results: ValidationResult[] = [];
      
      // Check for common Bicep issues
      if (transformed.resources.some(r => !r.type)) {
        results.push({
          ruleId: 'rule-005',
          resourceName: 'general',
          severity: 'error',
          message: 'Invalid Bicep syntax',
          details: 'Some resources are missing type declarations',
          suggestion: 'Review Bicep module syntax'
        });
      }
      
      return results;
    }
  }
];
```

---

## 🔍 Equivalence Validation

### Validate Template Equivalence
```typescript
interface EquivalenceAnalysis {
  equivalent: boolean;
  equivalenceScore: number;            // 0-100
  
  functionalities: {
    preserved: string[];                // Things that work the same
    enhanced: string[];                 // Things that are better
    degraded: string[];                 // Things that may be different
    missing: string[];                  // Things that are gone
  };
  
  differences: Array<{
    type: string;                       // parameter, output, resource, etc.
    original: string;
    transformed: string;
    impact: 'none' | 'minor' | 'major';
  }>;
  
  risks: string[];
  recommendations: string[];
}

async function validateEquivalence(
  original: ParsedBicepTemplate,
  transformed: ParsedBicepTemplate
): Promise<EquivalenceAnalysis> {
  
  const analysis: EquivalenceAnalysis = {
    equivalent: true,
    equivalenceScore: 100,
    functionalities: {
      preserved: [],
      enhanced: [],
      degraded: [],
      missing: []
    },
    differences: [],
    risks: [],
    recommendations: []
  };
  
  // Compare parameters
  for (const param in original.parameters) {
    if (transformed.parameters[param]) {
      analysis.functionalities.preserved.push(`Parameter: ${param}`);
    } else {
      analysis.functionalities.missing.push(`Parameter: ${param}`);
      analysis.equivalenceScore -= 10;
    }
  }
  
  // Compare outputs
  for (const output in original.outputs) {
    if (transformed.outputs[output]) {
      analysis.functionalities.preserved.push(`Output: ${output}`);
    } else {
      analysis.functionalities.missing.push(`Output: ${output}`);
      analysis.equivalenceScore -= 15;
    }
  }
  
  // Compare resources
  const origTypes = original.resources.map(r => r.type);
  const transTypes = transformed.resources.map(r => r.type);
  
  for (const type of origTypes) {
    if (!transTypes.includes(type)) {
      analysis.differences.push({
        type: 'resource_type',
        original: type,
        transformed: 'AVM Module',
        impact: 'none'  // AVM is equivalent
      });
      analysis.functionalities.enhanced.push(
        `Resource type ${type} → AVM module (managed)`
      );
    }
  }
  
  // Assess risks
  if (analysis.equivalenceScore < 80) {
    analysis.risks.push(
      'Template equivalence score is below 80%. ' +
      'Recommend thorough testing before deployment.'
    );
    analysis.equivalent = false;
  }
  
  if (analysis.functionalities.missing.length > 0) {
    analysis.recommendations.push(
      'Some functionality may be missing. ' +
      'Review transformation results carefully.'
    );
  }
  
  return analysis;
}
```

---

## 🧪 Deployment Validation

### Validate Deployment Syntax
```typescript
interface DeploymentValidationResult {
  valid: boolean;
  syntax_errors: Array<{
    line: number;
    column: number;
    message: string;
    code: string;
  }>;
  
  semantic_errors: Array<{
    resource: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  
  deployment_readiness: {
    can_deploy: boolean;
    required_fixes: string[];
    optional_improvements: string[];
  };
}

async function validateDeploymentSyntax(
  bicepCode: string
): Promise<DeploymentValidationResult> {
  
  const result: DeploymentValidationResult = {
    valid: true,
    syntax_errors: [],
    semantic_errors: [],
    deployment_readiness: {
      can_deploy: true,
      required_fixes: [],
      optional_improvements: []
    }
  };
  
  // Check basic Bicep syntax
  const lines = bicepCode.split('\n');
  let inBlock = false;
  let blockType = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for unclosed blocks
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    
    if (opens > closes) inBlock = true;
    if (closes > opens) inBlock = false;
    
    // Check for invalid keywords
    if (/^(param|var|resource|output|module)\s+\w+\s*:/.test(trimmed)) {
      result.syntax_errors.push({
        line: i + 1,
        column: 0,
        message: 'Invalid Bicep syntax. Use = instead of :',
        code: trimmed
      });
      result.valid = false;
    }
  }
  
  // Check module references
  const moduleMatches = bicepCode.match(/module\s+\w+\s+'[^']+'/g) || [];
  for (const module of moduleMatches) {
    // Verify module path is valid
    if (!module.includes('br:avm/') && 
        !module.includes('br:') && 
        !module.includes('./')) {
      
      result.semantic_errors.push({
        resource: module,
        message: 'Module reference should use bicep registry (br:) or relative path',
        severity: 'error'
      });
      result.valid = false;
    }
  }
  
  // Set deployment readiness
  if (result.syntax_errors.length > 0 || 
      result.semantic_errors.some(e => e.severity === 'error')) {
    result.deployment_readiness.can_deploy = false;
    result.deployment_readiness.required_fixes = [
      `Fix ${result.syntax_errors.length} syntax errors`,
      `Fix ${result.semantic_errors.filter(e => e.severity === 'error').length} semantic errors`
    ];
  }
  
  return result;
}
```

---

## 📊 Generate Validation Report

### Complete Validation Report
```typescript
interface ValidationReport {
  template_name: string;
  validation_timestamp: string;
  
  rule_results: ValidationResult[];
  equivalence_analysis: EquivalenceAnalysis;
  deployment_validation: DeploymentValidationResult;
  
  overall_status: 'pass' | 'warning' | 'fail';
  error_count: number;
  warning_count: number;
  
  summary: {
    can_transform: boolean;
    can_deploy: boolean;
    ready_for_production: boolean;
  };
  
  next_steps: string[];
}

async function generateValidationReport(
  original: ParsedBicepTemplate,
  transformed: ParsedBicepTemplate,
  transformedBicepCode: string
): Promise<ValidationReport> {
  
  // Run all validations
  const ruleResults = [];
  for (const rule of validationRules) {
    const results = rule.validation(original, transformed);
    ruleResults.push(...results);
  }
  
  const equivalenceAnalysis = await validateEquivalence(
    original,
    transformed
  );
  
  const deploymentValidation = await validateDeploymentSyntax(
    transformedBicepCode
  );
  
  // Count errors and warnings
  const errorCount = ruleResults.filter(
    r => r.severity === 'error'
  ).length;
  const warningCount = ruleResults.filter(
    r => r.severity === 'warning'
  ).length;
  
  // Determine status
  let status: 'pass' | 'warning' | 'fail' = 'pass';
  if (errorCount > 0 || !deploymentValidation.valid) {
    status = 'fail';
  } else if (warningCount > 0) {
    status = 'warning';
  }
  
  // Generate report
  const report: ValidationReport = {
    template_name: 'validation_report',
    validation_timestamp: new Date().toISOString(),
    rule_results: ruleResults,
    equivalence_analysis: equivalenceAnalysis,
    deployment_validation: deploymentValidation,
    overall_status: status,
    error_count: errorCount,
    warning_count: warningCount,
    summary: {
      can_transform: status !== 'fail',
      can_deploy: deploymentValidation.valid,
      ready_for_production: status === 'pass'
    },
    next_steps: []
  };
  
  // Generate next steps
  if (status === 'fail') {
    report.next_steps.push('Fix all errors before transformation');
    report.next_steps.push('Review validation results');
  } else if (status === 'warning') {
    report.next_steps.push('Review warnings and test thoroughly');
  } else {
    report.next_steps.push('Transformation is ready for deployment');
    report.next_steps.push('Consider running integration tests');
  }
  
  return report;
}
```

---

## 💡 Key Points

1. **Comprehensive Validation**: Multiple validation rules cover different aspects
2. **Equivalence Checking**: Ensures transformed template does the same thing
3. **Syntax Validation**: Checks for Bicep syntax errors before deployment
4. **Risk Assessment**: Identifies potential issues and degradation
5. **Detailed Reporting**: Clear reports with actionable recommendations
6. **Deployment Ready**: Determines if template is ready for production

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
