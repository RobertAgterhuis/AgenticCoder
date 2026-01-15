# Validation Engine (BAR-05)

Validates transformed (AVM-based) templates against the original.

## What it checks (best-effort)

- All original parameters are still declared or referenced
- All original outputs still exist
- The transformed template doesn't explode in size (resource/module count heuristic)

## API

- `ValidationEngine#validateTemplates(originalCode, transformedCode)` → `{ results, summary }`

## Tests

Run from `agents/`:

- `npm test`
