# AVM Resolver Skeleton

Purpose: map Azure resource types to AVM modules. Currently stubbed with a small registry.

Files:
- .github/scripts/avm_resolver/registry.json — stub module mappings
- .github/scripts/avm_resolver/resolver.py — CLI to look up mappings

Usage:
```bash
python .github/scripts/avm_resolver/resolver.py Microsoft.Web/sites
python .github/scripts/avm_resolver/resolver.py Microsoft.Sql/servers/databases
```

Next steps:
- Expand registry with full AVM coverage (Plan-B/BAR specs).
- Add parameter/property mapping and transformation logic.
- Integrate with Bicep generation pipeline and validation.
- Add tests and CI hooks.
"