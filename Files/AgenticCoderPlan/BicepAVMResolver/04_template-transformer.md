# Template Transformer

**Component**: BAR-04  
**Purpose**: Rewrite Bicep templates to use AVM modules  
**Status**: Design Complete  

---

## 🎯 Overview

The Template Transformer:

1. **Rewrites** custom Bicep code to AVM module calls
2. **Handles** parameter and variable mapping
3. **Manages** output transformation
4. **Updates** dependency references
5. **Preserves** template structure and logic

---

## 💻 Template Rewriting

### Transformation Strategy
```typescript
interface TransformationPlan {
  // Source template
  sourceTemplate: ParsedBicepTemplate;
  
  // Transformations to apply
  resourceTransformations: Array<{
    resourceName: string;
    operation: 'replace' | 'merge' | 'remove';
    target: 'avm' | 'custom' | 'delete';
    moduleReference: ModuleReference;
  }>;
  
  parameterUpdates: Array<{
    parameterName: string;
    operation: 'keep' | 'rename' | 'transform';
    newName?: string;
    transformation?: string;
  }>;
  
  variableUpdates: Array<{
    variableName: string;
    operation: 'keep' | 'delete' | 'inline';
  }>;
  
  outputUpdates: Array<{
    outputName: string;
    operation: 'keep' | 'update' | 'delete';
    newValue?: string;
  }>;
}

async function createTransformationPlan(
  template: ParsedBicepTemplate,
  mappings: ResourceToModuleMapping[],
  validationResults: ValidationResult[]
): Promise<TransformationPlan> {
  
  const plan: TransformationPlan = {
    sourceTemplate: template,
    resourceTransformations: [],
    parameterUpdates: [],
    variableUpdates: [],
    outputUpdates: []
  };
  
  // Plan resource transformations
  for (const resource of template.resources) {
    const mapping = mappings.find(
      m => m.sourceResourceName === resource.name
    );
    
    if (mapping) {
      const validation = validationResults.find(
        v => v.resourceName === resource.name
      );
      
      if (validation && validation.canTransform) {
        plan.resourceTransformations.push({
          resourceName: resource.name,
          operation: 'replace',
          target: 'avm',
          moduleReference: buildModuleReference(mapping, template)
        });
      } else {
        plan.resourceTransformations.push({
          resourceName: resource.name,
          operation: 'keep',
          target: 'custom',
          moduleReference: null
        });
      }
    }
  }
  
  // Plan parameter updates
  for (const paramName in template.parameters) {
    // Check if parameter is still needed
    const stillNeeded = plan.resourceTransformations.some(
      t => t.moduleReference?.parameters[paramName]
    );
    
    if (stillNeeded) {
      plan.parameterUpdates.push({
        parameterName: paramName,
        operation: 'keep'
      });
    }
  }
  
  // Plan variable updates
  for (const varName in template.variables) {
    // Check if variable is still referenced
    const stillReferenced = checkVariableReferences(
      varName,
      template,
      plan
    );
    
    if (stillReferenced) {
      plan.variableUpdates.push({
        variableName: varName,
        operation: 'keep'
      });
    } else {
      plan.variableUpdates.push({
        variableName: varName,
        operation: 'delete'
      });
    }
  }
  
  // Plan output updates
  for (const outputName in template.outputs) {
    // Check if output comes from transformed resource
    const sourceResource = getOutputSourceResource(
      outputName,
      template
    );
    
    const transformed = plan.resourceTransformations.find(
      t => t.resourceName === sourceResource
    );
    
    if (transformed && transformed.target === 'avm') {
      plan.outputUpdates.push({
        outputName,
        operation: 'update',
        newValue: `${transformed.moduleReference.name}.outputs.${outputName}`
      });
    } else {
      plan.outputUpdates.push({
        outputName,
        operation: 'keep'
      });
    }
  }
  
  return plan;
}
```

---

## 🔄 Generate Transformed Template

### Transform Template
```typescript
interface TransformedTemplate {
  bicepCode: string;
  summary: {
    resourcesTransformed: number;
    resourcesUnchanged: number;
    parametersRemoved: number;
    variablesRemoved: number;
    outputsUpdated: number;
  };
}

async function transformTemplate(
  originalCode: string,
  plan: TransformationPlan
): Promise<TransformedTemplate> {
  
  let bicepCode = originalCode;
  
  // 1. Update parameters (keep, remove, or transform)
  for (const update of plan.parameterUpdates) {
    if (update.operation === 'keep') {
      continue;  // Keep original parameter
    } else if (update.operation === 'rename') {
      bicepCode = bicepCode.replace(
        new RegExp(`param\\s+${update.parameterName}\\b`, 'g'),
        `param ${update.newName}`
      );
    }
  }
  
  // 2. Replace resource declarations with module calls
  for (const transform of plan.resourceTransformations) {
    if (transform.target === 'avm') {
      // Find and replace resource declaration
      const resourcePattern = new RegExp(
        `resource\\s+${transform.resourceName}\\s+'[^']+'\\s*=\\s*\\{[\\s\\S]*?\\n\\}`,
        'g'
      );
      
      const moduleCode = generateModuleCode(
        transform.moduleReference
      );
      
      bicepCode = bicepCode.replace(resourcePattern, moduleCode);
    }
  }
  
  // 3. Remove unused variables
  for (const update of plan.variableUpdates) {
    if (update.operation === 'delete') {
      const varPattern = new RegExp(
        `var\\s+${update.variableName}\\s*=\\s*[\\s\\S]*?(?=\\n(?:var|param|resource|output|$))`,
        'g'
      );
      bicepCode = bicepCode.replace(varPattern, '');
    }
  }
  
  // 4. Update output references
  for (const update of plan.outputUpdates) {
    if (update.operation === 'update') {
      const outputPattern = new RegExp(
        `output\\s+${update.outputName}\\s+\\w+\\s*=\\s*[^\\n]+`,
        'g'
      );
      
      bicepCode = bicepCode.replace(
        outputPattern,
        `output ${update.outputName} string = ${update.newValue}`
      );
    }
  }
  
  // 5. Clean up formatting
  bicepCode = cleanupFormatting(bicepCode);
  
  // Calculate summary
  const summary = {
    resourcesTransformed: plan.resourceTransformations.filter(
      t => t.target === 'avm'
    ).length,
    resourcesUnchanged: plan.resourceTransformations.filter(
      t => t.target !== 'avm'
    ).length,
    parametersRemoved: plan.parameterUpdates.filter(
      p => p.operation === 'rename'
    ).length,
    variablesRemoved: plan.variableUpdates.filter(
      v => v.operation === 'delete'
    ).length,
    outputsUpdated: plan.outputUpdates.filter(
      o => o.operation === 'update'
    ).length
  };
  
  return {
    bicepCode,
    summary
  };
}

function generateModuleCode(
  moduleRef: ModuleReference
): string {
  
  let code = `module ${moduleRef.name} '${moduleRef.avmModuleId}' = {\n`;
  code += `  name: '${uniqueString(resourceGroup().id)}-${moduleRef.name}'\n\n`;
  
  code += `  params: {\n`;
  for (const param in moduleRef.parameters) {
    code += `    ${param}: ${moduleRef.parameters[param]}\n`;
  }
  code += `  }\n`;
  
  code += `}`;
  
  return code;
}

function cleanupFormatting(code: string): string {
  // Remove extra blank lines
  code = code.replace(/\n\n\n+/g, '\n\n');
  
  // Normalize indentation
  code = code.replace(/^[ \t]+/gm, match => {
    const tabs = Math.floor(match.length / 2);
    return '  '.repeat(tabs);
  });
  
  return code.trimEnd();
}
```

---

## 📋 Transformation Examples

### Example 1: Storage Account
```bicep
// BEFORE: Custom resource
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-06-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: skuName
  }
  properties: {
    accessTier: 'Hot'
    httpsOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// AFTER: AVM module
module storageModule 'br:avm/storage:latest' = {
  name: '${uniqueString(resourceGroup().id)}-storage'
  
  params: {
    location: location
    name: storageAccountName
    kind: 'StorageV2'
    skuName: skuName
    accessTier: 'Hot'
    httpsOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

output storageId string = storageModule.outputs.id
output storageName string = storageModule.outputs.name
```

### Example 2: App Service with Dependencies
```bicep
// BEFORE: Custom with dependency
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    capacity: 1
  }
}

resource webApp 'Microsoft.Web/sites@2021-02-01' = {
  name: webAppName
  location: location
  
  identity: {
    type: 'SystemAssigned'
  }
  
  properties: {
    appServicePlanId: appServicePlan.id
    httpsOnly: true
  }
  
  dependsOn: [appServicePlan]
}

// AFTER: AVM modules
module appServicePlanModule 'br:avm/app-service-plan:latest' = {
  name: '${uniqueString(resourceGroup().id)}-asp'
  
  params: {
    location: location
    name: appServicePlanName
    skuName: 'B1'
    skuCapacity: 1
  }
}

module webAppModule 'br:avm/web-app:latest' = {
  name: '${uniqueString(resourceGroup().id)}-app'
  
  params: {
    location: location
    name: webAppName
    appServicePlanId: appServicePlanModule.outputs.id
    systemAssignedIdentity: true
    httpsOnly: true
  }
  
  dependsOn: [appServicePlanModule]
}

output webAppId string = webAppModule.outputs.id
output webAppUrl string = webAppModule.outputs.defaultHostName
```

---

## 🔧 Transformation Engine

### Main Transformation Function
```typescript
async function transformBicepTemplate(
  bicepCode: string,
  registry: AVMModule[]
): Promise<TransformedTemplate> {
  
  // Phase 1: Parse
  const template = await analyzeBicepTemplate(bicepCode);
  
  // Phase 2: Analyze resources
  const analyses = [];
  for (const resource of template.resources) {
    const avmModule = findModuleByResourceType(
      resource.type,
      registry
    );
    
    if (avmModule) {
      const analysis = await analyzeResource(resource, registry);
      analyses.push(analysis);
    }
  }
  
  // Phase 3: Create mappings
  const mappings = [];
  for (const resource of template.resources) {
    const avmModule = findModuleByResourceType(
      resource.type,
      registry
    );
    
    if (avmModule) {
      const mapping = await createModuleMapping(
        resource,
        avmModule
      );
      mappings.push(mapping);
    }
  }
  
  // Phase 4: Validate transformations
  const validations = [];
  for (const analysis of analyses) {
    const validation = validateTransformation(analysis);
    validations.push(validation);
  }
  
  // Phase 5: Create transformation plan
  const plan = await createTransformationPlan(
    template,
    mappings,
    validations
  );
  
  // Phase 6: Apply transformations
  const transformed = await transformTemplate(
    bicepCode,
    plan
  );
  
  return transformed;
}
```

---

## 💡 Key Points

1. **Plan-Based Transformation**: Creates detailed plan before modifying
2. **Selective Transformation**: Only transforms resources that can be fully converted
3. **Reference Updates**: Maintains and updates all references properly
4. **Formatting Preservation**: Keeps code readable and maintainable
5. **Traceable Changes**: Records what was transformed and why
6. **Rollback Support**: Can revert to original if needed

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
