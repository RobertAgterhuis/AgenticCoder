# Resource Analyzer

**Component**: BAR-02  
**Purpose**: Parse Bicep and identify resources for AVM transformation  
**Status**: Design Complete  

---

## 🎯 Overview

The Resource Analyzer:

1. **Parses** Bicep templates (custom code)
2. **Identifies** all resources and properties
3. **Extracts** parameters and configurations
4. **Maps** to Azure resource types
5. **Finds** AVM equivalents

---

## 💻 Bicep Parsing

### Parse Bicep Template
```typescript
interface BicepResource {
  name: string;                         // storageAccount
  type: string;                         // Microsoft.Storage/storageAccounts
  apiVersion: string;
  
  properties: {
    [key: string]: any;                 // location, kind, sku, etc.
  };
  
  dependencies?: string[];
  outputs?: {
    [key: string]: string;              // Return values
  };
  
  location?: string;
  tags?: { [key: string]: string };
}

interface ParsedBicepTemplate {
  parameters: {
    [name: string]: {
      type: string;                     // string, object, array
      default?: any;
      description?: string;
    }
  };
  
  variables: {
    [name: string]: any;
  };
  
  resources: BicepResource[];
  outputs: {
    [name: string]: {
      type: string;
      value: string;
    }
  };
}
```

### Parse Function
```typescript
async function analyzeBicepTemplate(
  bicepCode: string
): Promise<ParsedBicepTemplate> {
  
  const parsed: ParsedBicepTemplate = {
    parameters: {},
    variables: {},
    resources: [],
    outputs: {}
  };
  
  // Parse parameters
  const paramMatches = bicepCode.matchAll(
    /param\s+(\w+)\s+(\w+)\s*=\s*(.+?)(?=\n|$)/gs
  );
  for (const match of paramMatches) {
    parsed.parameters[match[1]] = {
      type: match[2],
      default: match[3]
    };
  }
  
  // Parse variables
  const varMatches = bicepCode.matchAll(
    /var\s+(\w+)\s*=\s*(.+?)(?=\nvar|\nparam|\nresource|$)/gs
  );
  for (const match of varMatches) {
    parsed.variables[match[1]] = match[2];
  }
  
  // Parse resources
  const resourceMatches = bicepCode.matchAll(
    /resource\s+(\w+)\s+'([^']+)'\s*=\s*\{([\s\S]*?)\n\}/g
  );
  for (const match of resourceMatches) {
    const resource = parseResourceBlock(match[1], match[2], match[3]);
    parsed.resources.push(resource);
  }
  
  // Parse outputs
  const outputMatches = bicepCode.matchAll(
    /output\s+(\w+)\s+(\w+)\s*=\s*(.+?)$/gm
  );
  for (const match of outputMatches) {
    parsed.outputs[match[1]] = {
      type: match[2],
      value: match[3]
    };
  }
  
  return parsed;
}

function parseResourceBlock(
  name: string,
  type: string,
  propertiesBlock: string
): BicepResource {
  
  const resource: BicepResource = {
    name,
    type,
    apiVersion: extractApiVersion(propertiesBlock),
    properties: {},
    dependencies: []
  };
  
  // Extract properties
  const propLines = propertiesBlock.split('\n');
  let currentProp = '';
  let propValue = '';
  
  for (const line of propLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.includes(':')) {
      if (currentProp) {
        resource.properties[currentProp] = parsePropertyValue(propValue);
      }
      const [key, ...rest] = trimmed.split(':');
      currentProp = key.trim();
      propValue = rest.join(':').trim();
    } else {
      propValue += ' ' + trimmed;
    }
  }
  
  if (currentProp) {
    resource.properties[currentProp] = parsePropertyValue(propValue);
  }
  
  // Extract dependencies
  for (const key in resource.properties) {
    const value = JSON.stringify(resource.properties[key]);
    const depMatches = value.match(/(\w+)\.id/g);
    if (depMatches) {
      resource.dependencies = Array.from(new Set(depMatches));
    }
  }
  
  return resource;
}

function parsePropertyValue(value: string): any {
  // Handle null/empty
  if (!value || value === 'null') return null;
  
  // Handle boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Handle number
  if (/^\d+$/.test(value)) return parseInt(value);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  
  // Handle object
  if (value.startsWith('{')) return parseObjectLiteral(value);
  
  // Handle array
  if (value.startsWith('[')) return parseArrayLiteral(value);
  
  // Handle string
  return value.replace(/^['"]|['"]$/g, '');
}
```

---

## 🔍 Resource Analysis

### Analyze Resource for AVM Compatibility
```typescript
interface ResourceAnalysis {
  resourceName: string;
  resourceType: string;
  
  // AVM compatibility
  canUseAVM: boolean;
  avmModule?: string;                   // br:avm/storage
  transformationRequired: boolean;
  
  // Properties analysis
  standardProperties: string[];         // Maps directly to AVM
  customProperties: string[];           // Needs transformation
  unsupportedProperties: string[];      // Not in AVM
  
  // Dependencies
  dependencies: string[];
  
  // Complexity
  complexityScore: number;              // 0-100
  transformationDifficulty: string;     // low, medium, high
  
  // Recommendations
  warnings: string[];
  recommendations: string[];
}

async function analyzeResource(
  resource: BicepResource,
  registry: AVMModule[]
): Promise<ResourceAnalysis> {
  
  const analysis: ResourceAnalysis = {
    resourceName: resource.name,
    resourceType: resource.type,
    canUseAVM: false,
    transformationRequired: false,
    standardProperties: [],
    customProperties: [],
    unsupportedProperties: [],
    dependencies: resource.dependencies || [],
    complexityScore: 0,
    transformationDifficulty: 'low',
    warnings: [],
    recommendations: []
  };
  
  // Find AVM module
  const avmModule = registry.find(m => m.resource_type === resource.type);
  
  if (!avmModule) {
    analysis.canUseAVM = false;
    analysis.recommendations.push(
      `No AVM module found for ${resource.type}`
    );
    return analysis;
  }
  
  analysis.avmModule = avmModule.id;
  analysis.canUseAVM = true;
  
  // Analyze properties
  for (const propName in resource.properties) {
    if (avmModule.parameters[propName]) {
      analysis.standardProperties.push(propName);
    } else if (isSimilarProperty(propName, avmModule.parameters)) {
      analysis.customProperties.push(propName);
      analysis.transformationRequired = true;
    } else {
      analysis.unsupportedProperties.push(propName);
      analysis.warnings.push(
        `Property ${propName} not supported in AVM module`
      );
    }
  }
  
  // Calculate complexity
  analysis.complexityScore = 
    analysis.customProperties.length * 10 +
    analysis.unsupportedProperties.length * 15;
  
  if (analysis.complexityScore > 50) {
    analysis.transformationDifficulty = 'high';
  } else if (analysis.complexityScore > 20) {
    analysis.transformationDifficulty = 'medium';
  }
  
  // Generate recommendations
  if (analysis.unsupportedProperties.length > 0) {
    analysis.recommendations.push(
      'Some properties cannot be converted to AVM. ' +
      'Manual review required.'
    );
  }
  
  if (analysis.dependencies.length > 0) {
    analysis.recommendations.push(
      'Resource has dependencies. Ensure they are ' +
      'also converted to AVM modules.'
    );
  }
  
  return analysis;
}

function isSimilarProperty(
  property: string,
  avmParams: { [key: string]: any }
): boolean {
  
  const normalized = property.toLowerCase()
    .replace(/_/g, '')
    .replace(/([A-Z])/g, '')
    .toLowerCase();
  
  for (const avmParam in avmParams) {
    const avmNorm = avmParam.toLowerCase()
      .replace(/_/g, '')
      .replace(/([A-Z])/g, '')
      .toLowerCase();
    
    if (normalized === avmNorm || 
        calculateLevenshteinDistance(normalized, avmNorm) <= 2) {
      return true;
    }
  }
  
  return false;
}
```

---

## 📊 Analysis Results

### Resource Analysis Report
```typescript
interface AnalysisReport {
  template_name: string;
  total_resources: number;
  
  avm_compatible: number;
  partial_transformation: number;
  not_avm_compatible: number;
  
  total_properties: number;
  standard_properties: number;
  custom_properties: number;
  unsupported_properties: number;
  
  overall_complexity: string;          // low, medium, high
  estimated_effort_hours: number;
  
  resource_analyses: ResourceAnalysis[];
  
  // Risk assessment
  risks: string[];
  mitigations: string[];
  
  // Next steps
  next_steps: string[];
}

function generateAnalysisReport(
  analyses: ResourceAnalysis[]
): AnalysisReport {
  
  const report: AnalysisReport = {
    template_name: 'analysis_report',
    total_resources: analyses.length,
    avm_compatible: 0,
    partial_transformation: 0,
    not_avm_compatible: 0,
    total_properties: 0,
    standard_properties: 0,
    custom_properties: 0,
    unsupported_properties: 0,
    overall_complexity: 'low',
    estimated_effort_hours: 0,
    resource_analyses: analyses,
    risks: [],
    mitigations: [],
    next_steps: []
  };
  
  for (const analysis of analyses) {
    if (analysis.canUseAVM && !analysis.transformationRequired) {
      report.avm_compatible++;
    } else if (analysis.canUseAVM && analysis.transformationRequired) {
      report.partial_transformation++;
    } else {
      report.not_avm_compatible++;
    }
    
    const props = analysis.standardProperties.length +
                  analysis.customProperties.length +
                  analysis.unsupportedProperties.length;
    report.total_properties += props;
    report.standard_properties += analysis.standardProperties.length;
    report.custom_properties += analysis.customProperties.length;
    report.unsupported_properties += analysis.unsupportedProperties.length;
    
    report.estimated_effort_hours += 
      analysis.complexityScore / 10;
  }
  
  // Determine overall complexity
  const avgComplexity = 
    analyses.reduce((sum, a) => sum + a.complexityScore, 0) / 
    analyses.length;
  
  if (avgComplexity > 50) {
    report.overall_complexity = 'high';
  } else if (avgComplexity > 20) {
    report.overall_complexity = 'medium';
  }
  
  // Generate risk assessment
  if (report.not_avm_compatible > 0) {
    report.risks.push(
      `${report.not_avm_compatible} resource(s) cannot be ` +
      `converted to AVM modules`
    );
  }
  
  if (report.unsupported_properties > 0) {
    report.risks.push(
      `${report.unsupported_properties} property mappings ` +
      `may require manual adjustment`
    );
  }
  
  return report;
}
```

---

## 💡 Key Points

1. **Full Parsing**: Extracts all resources, parameters, variables, outputs
2. **Property Mapping**: Categorizes properties by AVM compatibility
3. **Dependency Detection**: Identifies resource relationships
4. **Complexity Analysis**: Scores transformation difficulty
5. **Recommendations**: Provides guidance for transformation
6. **Risk Assessment**: Identifies potential issues

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
