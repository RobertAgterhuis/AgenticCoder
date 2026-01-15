# Artifact Manager

## Purpose
Define where artifacts land per phase and how they are named, to keep handoffs deterministic.

## Locations (proposed)
- requirements/: 01-requirements.md
- assessment/: 02-architecture-assessment.md, 03-des-cost-estimate.md, diagrams/, adr/
- planning/: 04-implementation-plan.md, 04-governance-constraints.md(.json)
- generation/: infra/bicep/<project>/ (main.bicep, modules/, deploy.ps1), validation logs
- deployment/: 06-deployment-summary.md, deployed-resources.json
- as-built/: 07-workload-documentation.md, 07-ab-diagram.*

## Naming Rules
- Scenarios: .github/scenarios/S0{n}-<slug>.scenario.md
- Schemas: .github/schemas/{agents|artifacts|mcp|config}/<name>.schema.json
- Agents/skills: .github/agents/<name>.agent.md, .github/skills/<name>.skill.md

## Versioning
- Keep schema versions in file headers; avoid breaking changes without bump.
- Use git tags/releases to align artifacts with v1.0/v1.1.

## TODO
- Confirm folder names with infra/bicep outputs once generation code exists.
- Add artifact registry mapping to AVM resolver outputs.
