# Module Mapper

**Component**: BAR-03  
**Purpose**: Map custom resources to AVM module equivalents  
**Status**: Design Complete  

---

## 🎯 Overview

The Module Mapper:

1. **Maps** Azure resource types to AVM modules
2. **Translates** properties to AVM parameters
3. **Handles** parameter transformations
4. **Creates** module references
5. **Resolves** parameter dependencies

---

## 💻 Resource to Module Mapping

### Mapping Definition
```typescript
interface ResourceToModuleMapping {
  // Source resource
  sourceResourceType: string;           // Microsoft.Storage/storageAccounts
  sourceResourceName: string;           // storageAccount
  
  // Target AVM module
  avmModuleId: string;                  // br:avm/storage
  avmModuleName: string;                // storage
  avmModuleVersion: string;             // latest
  
  // Parameter mappings
  parameterMappings: {
    [avmParam: string]: {
      sourceProperty: string;           // skuName
      transformFunction?: string;       // camelCase, uppercase, etc.
      defaultValue?: any;
      required: boolean;
    }
  };
  
  // Output mappings
  outputMappings: {
    [sourceOutput: string]: {
      avmOutput: string;
      value: string;                    // module().outputs.resourceId
    }
  };
  
  // Dependency mappings
  dependencyMappings: {
    [paramName: string]: {
      dependsOn: string;                // Resource name
      property: string;                 // .id or .name
    }
  };
}
```

### Create Module Mapping
```typescript
async function createModuleMapping(
  resource: BicepResource,
  avmModule: AVMModule
): Promise<ResourceToModuleMapping> {
  
  const mapping: ResourceToModuleMapping = {
    sourceResourceType: resource.type,
    sourceResourceName: resource.name,
    avmModuleId: avmModule.id,
    avmModuleName: avmModule.id.split('/').pop()!,
    avmModuleVersion: avmModule.version,
    parameterMappings: {},
    outputMappings: {},
    dependencyMappings: {}
  };
  
  // Map each property to AVM parameter
  for (const sourceProperty in resource.properties) {
    const sourceValue = resource.properties[sourceProperty];
    
    // Find matching AVM parameter
    const avmParam = findMatchingParameter(
      sourceProperty,
      avmModule
    );
    
    if (avmParam) {
      mapping.parameterMappings[avmParam.name] = {
        sourceProperty,
        transformFunction: determineTransform(sourceValue, avmParam),
        required: avmParam.required,
        defaultValue: sourceValue
      };
    }
  }
  
  // Map outputs
  for (const outputName in avmModule.outputs) {
    const output = avmModule.outputs[outputName];
    mapping.outputMappings[outputName] = {
      avmOutput: outputName,
      value: output.value
    };
  }
  
  // Map dependencies
  if (resource.dependencies && resource.dependencies.length > 0) {
    for (const dep of resource.dependencies) {
      mapping.dependencyMappings[dep] = {
        dependsOn: dep,
        property: '.id'
      };
    }
  }
  
  return mapping;
}

function findMatchingParameter(
  sourceProperty: string,
  avmModule: AVMModule
): { name: string; required: boolean } | null {
  
  // Exact match
  if (avmModule.parameters[sourceProperty]) {
    return {
      name: sourceProperty,
      required: avmModule.parameters[sourceProperty].required
    };
  }
  
  // Case-insensitive match
  const lower = sourceProperty.toLowerCase();
  for (const paramName in avmModule.parameters) {
    if (paramName.toLowerCase() === lower) {
      return {
        name: paramName,
        required: avmModule.parameters[paramName].required
      };
    }
  }
  
  // Semantic match
  const semantic = semanticMatch(sourceProperty, avmModule);
  if (semantic) return semantic;
  
  return null;
}

function semanticMatch(
  sourceProperty: string,
  avmModule: AVMModule
): { name: string; required: boolean } | null {
  
  const mappings: { [key: string]: string } = {
    // Storage mappings
    'sku.name': 'skuName',
    'sku.tier': 'skuTier',
    'accessTier': 'accessTier',
    'https_only': 'httpsOnly',
    'tls_version': 'minimumTlsVersion',
    
    // Web app mappings
    'app_service_plan_id': 'appServicePlanId',
    'https_only': 'httpsOnly',
    'identity.type': 'systemAssignedIdentity',
    
    // SQL database mappings
    'sku.name': 'skuName',
    'sku.tier': 'skuTier',
    'collation_name': 'collation'
  };
  
  const mapped = mappings[sourceProperty];
  if (mapped && avmModule.parameters[mapped]) {
    return {
      name: mapped,
      required: avmModule.parameters[mapped].required
    };
  }
  
  return null;
}

function determineTransform(
  value: any,
  avmParam: { type: string; allowed_values?: any[] }
): string | undefined {
  
  // No transform needed if types match
  if (typeof value === 'string' && avmParam.type === 'string') {
    return undefined;
  }
  
  // Transform for boolean
  if (typeof value === 'boolean' && avmParam.type === 'bool') {
    return 'toString';
  }
  
  // Transform for enum values
  if (avmParam.allowed_values && avmParam.allowed_values.length > 0) {
    // Check if value needs transformation to allowed value
    const upperValue = String(value).toUpperCase();
    if (avmParam.allowed_values.includes(upperValue)) {
      return 'uppercase';
    }
  }
  
  return undefined;
}
```

---

## 🔄 Parameter Transformation

### Transform Properties
```typescript
interface ParameterTransformation {
  sourceValue: any;
  transformations: Array<{
    type: string;                       // uppercase, lowercase, camelCase, etc.
    function: (value: any) => any;
  }>;
  targetValue?: any;
  error?: string;
}

function transformParameter(
  sourceValue: any,
  transforms?: string[]
): ParameterTransformation {
  
  let value = sourceValue;
  const transformations = [];
  
  if (!transforms) {
    return {
      sourceValue,
      transformations: [],
      targetValue: value
    };
  }
  
  for (const transform of transforms) {
    try {
      switch (transform) {
        case 'uppercase':
          value = String(value).toUpperCase();
          transformations.push({
            type: 'uppercase',
            function: (v) => String(v).toUpperCase()
          });
          break;
          
        case 'lowercase':
          value = String(value).toLowerCase();
          transformations.push({
            type: 'lowercase',
            function: (v) => String(v).toLowerCase()
          });
          break;
          
        case 'camelCase':
          value = toCamelCase(String(value));
          transformations.push({
            type: 'camelCase',
            function: toCamelCase
          });
          break;
          
        case 'toString':
          value = String(value);
          transformations.push({
            type: 'toString',
            function: (v) => String(v)
          });
          break;
          
        case 'toBoolean':
          value = value === true || value === 'true' || value === 1;
          transformations.push({
            type: 'toBoolean',
            function: (v) => v === true || v === 'true' || v === 1
          });
          break;
      }
    } catch (error) {
      return {
        sourceValue,
        transformations,
        error: `Transform ${transform} failed: ${error}`
      };
    }
  }
  
  return {
    sourceValue,
    transformations,
    targetValue: value
  };
}

function toCamelCase(str: string): string {
  return str
    .split(/[-_\s]/g)
    .map((word, index) => 
      index === 0 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}
```

---

## 📋 Build Module Call

### Generate Module Reference
```typescript
interface ModuleReference {
  name: string;                         // storageModule
  avmModuleId: string;                  // br:avm/storage
  parameters: {
    [key: string]: string;              // Parameter expressions
  };
  outputs: {
    [key: string]: string;              // Output references
  };
}

function buildModuleReference(
  mapping: ResourceToModuleMapping,
  template: ParsedBicepTemplate
): ModuleReference {
  
  const moduleRef: ModuleReference = {
    name: `${mapping.sourceResourceName}Module`,
    avmModuleId: mapping.avmModuleId,
    parameters: {},
    outputs: {}
  };
  
  // Build parameter expressions
  for (const avmParam in mapping.parameterMappings) {
    const paramMap = mapping.parameterMappings[avmParam];
    
    // Get source value
    let paramValue = getParameterExpression(
      paramMap.sourceProperty,
      template
    );
    
    // Apply transformations
    if (paramMap.transformFunction) {
      paramValue = applyTransformExpression(
        paramValue,
        paramMap.transformFunction
      );
    }
    
    // Handle defaults
    if (!paramValue) {
      paramValue = paramMap.defaultValue || 
                   `params.${avmParam}`;
    }
    
    moduleRef.parameters[avmParam] = paramValue;
  }
  
  // Build output references
  for (const sourceOutput in mapping.outputMappings) {
    const outputMap = mapping.outputMappings[sourceOutput];
    moduleRef.outputs[sourceOutput] = outputMap.value;
  }
  
  return moduleRef;
}

function getParameterExpression(
  sourceProperty: string,
  template: ParsedBicepTemplate
): string {
  
  // Check if it's a parameter reference
  if (template.parameters[sourceProperty]) {
    return `params.${sourceProperty}`;
  }
  
  // Check if it's a variable reference
  if (template.variables[sourceProperty]) {
    return `vars.${sourceProperty}`;
  }
  
  // Direct value
  return sourceProperty;
}

function applyTransformExpression(
  expression: string,
  transform: string
): string {
  
  switch (transform) {
    case 'uppercase':
      return `toUpper(${expression})`;
    case 'lowercase':
      return `toLower(${expression})`;
    case 'camelCase':
      return `toCamelCase(${expression})`;
    default:
      return expression;
  }
}
```

---

## 💻 Generated Module Bicep

### Module Call Example
```bicep
// Original custom code
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-06-01' = {
  name: storageName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    httpsOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// Transformed to AVM module
module storageModule 'br:avm/storage:latest' = {
  name: '${uniqueString(resourceGroup().id)}-storage'
  
  params: {
    location: location
    name: storageName
    skuName: 'Standard_LRS'
    kind: 'StorageV2'
    accessTier: 'Hot'
    httpsOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// Output references
output storageName string = storageModule.outputs.name
output storageId string = storageModule.outputs.id
output primaryEndpoint string = storageModule.outputs.primaryBlobEndpoint
```

---

## 📊 Mapping Report

### Generate Mapping Summary
```typescript
interface MappingSummary {
  totalResources: number;
  successfulMappings: number;
  partialMappings: number;
  failedMappings: number;
  
  parametersMapped: number;
  parametersPartial: number;
  parametersFailed: number;
  
  outputsMapped: number;
  dependenciesMapped: number;
  
  resources: Array<{
    resourceName: string;
    mapping: ResourceToModuleMapping;
    status: 'success' | 'partial' | 'failed';
    warnings: string[];
  }>;
}
```

---

## 💡 Key Points

1. **Intelligent Matching**: Exact, case-insensitive, and semantic matching
2. **Transformation**: Handles type conversions and value mappings
3. **Dependency Handling**: Maps resource dependencies to module dependencies
4. **Output Mapping**: Maintains output references and expressions
5. **Bicep Generation**: Creates valid AVM module references
6. **Error Handling**: Reports unmapped properties and conflicts

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
