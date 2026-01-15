# Module Mapper (BAR-03)

Maps parsed Bicep resources to Azure Verified Modules (AVM) module calls.

## What it does

- Resolves `resource.type` to an AVM module via `AVMRegistry`
- Maps resource properties (including nested paths like `sku.name`) to module parameters
- Captures dependency mappings (`dependsOn`) and module outputs
- Produces a mapping summary for the next stage (Template Transformer)

## Key APIs

- `ModuleMapper#createModuleMapping(resource, avmModule, registry)`
- `ModuleMapper#buildModuleReference(mapping, parsedTemplate)`
- `ModuleMapper#mapTemplate(parsedTemplate, registry)`

## Running tests

From the agents package:

- `npm test`
