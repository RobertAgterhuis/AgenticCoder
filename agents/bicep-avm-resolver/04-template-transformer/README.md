# Template Transformer (BAR-04)

Rewrites custom Bicep templates into AVM-module-based templates.

## What it does

- Parses Bicep (via BAR-02 `ResourceAnalyzer`)
- Maps resources to AVM modules (via BAR-03 `ModuleMapper`)
- Replaces eligible `resource ... = { ... }` blocks with `module ... = { ... }`
- Rewrites common references (e.g. `resourceName.id` → `resourceNameModule.outputs.id`)
- Updates output expressions similarly

## API

- `TemplateTransformer#transformBicepTemplate(bicepCode, registry)` → `{ bicepCode, summary }`

## Tests

Run from `agents/`:

- `npm test`
