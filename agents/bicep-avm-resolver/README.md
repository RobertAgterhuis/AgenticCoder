# Bicep AVM Resolver (Phase 3)

This folder contains the Phase 3 pipeline that converts (best-effort) Bicep `resource` blocks into Azure Verified Modules (AVM) `module` blocks, then validates and optimizes the result.

## Pipeline

- BAR-01: AVM Module Registry
- BAR-02: Resource Analyzer
- BAR-03: Module Mapper
- BAR-04: Template Transformer
- BAR-05: Validation Engine
- BAR-06: Optimization Engine

## End-to-end usage

Use `BicepAVMResolver` to run the full pipeline in one call.

```js
import { BicepAVMResolver } from '@agenticcoder/agents';

const resolver = new BicepAVMResolver();

const inputBicep = `
param location string = 'westeurope'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystg123'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
}

output storageId string = storageAccount.id
`;

const result = await resolver.resolve(inputBicep, {
  templateName: 'demo',
  optimizationContext: {
    environment: 'dev',
    securityFocus: true,
    costOptimization: true
  }
});

console.log(result.summary);
console.log(result.outputBicepCode);
```

## API surface

### `new BicepAVMResolver(options?)`

Optional dependency injection:

- `options.registry`
- `options.analyzer`
- `options.transformer`
- `options.validator`
- `options.optimizer`

### `await resolver.resolve(bicepCode, options?)`

Inputs:

- `bicepCode` (string)
- `options.templateName` (string)
- `options.optimizationContext` (object)
  - `environment`: `'dev' | 'prod'` (free-form string accepted)
  - `securityFocus`: boolean
  - `costOptimization`: boolean
  - `performanceFocus`: boolean

Output shape (high level):

- `inputBicepCode`: original input string
- `analysis`: output from BAR-02 `analyzer.analyzeTemplate(...)`
- `transformation`: output from BAR-04 `transformer.transformBicepTemplate(...)`
- `validation`:
  - `transformed`: BAR-05 validation of original vs transformed
  - `optimized`: BAR-05 validation of original vs optimized
- `optimization`: output from BAR-06 `optimizer.optimizeBicepCode(...)`
- `optimizationSummary`: BAR-06 summary metrics/recommendations
- `outputBicepCode`: final optimized template string
- `summary`: small aggregate summary (counts)
- `errors`: non-fatal pipeline errors (array of strings)

## Notes

- This is intentionally best-effort and conservative; it aims to keep templates usable and readable rather than being a full Bicep compiler.
- If a resource cannot be safely transformed (e.g., required module params cannot be mapped), it is left unchanged.
