# Optimization Engine (BAR-06)

Optimizes AVM-module-based Bicep templates.

## Focus areas

- Remove redundant module params (defaults)
- Optional security hardening (`securityFocus`)
- Optional cost optimization (`costOptimization`)

## API

- `OptimizationEngine#optimizeBicepCode(bicepCode, context, registry)` → `OptimizationResult`
- `OptimizationEngine#generateOptimizationSummary(result, templateName)` → summary object

## Notes

- The optimizer edits module `params` only.
- When a registry is provided, it only edits params that exist in the module schema.

## Tests

Run from `agents/`:

- `npm test`
