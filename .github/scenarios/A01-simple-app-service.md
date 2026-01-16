# S01 - Simple App Service

## Overview

- Complexity: Basic
- Estimated time: 25–35 minutes
- Monthly cost target: $80–120 (example estimate ~$88)
- Focus: baseline workflow, fast validation

## Requirements summary (Phase 0)

- Project: Simple Web App (internal)
- Region: East US 2
- Tech: .NET 8 / ASP.NET Core
- Users: ~50 concurrent
- Availability: 99.5%
- Budget: <$200/month
- Security: HTTPS

## Expected resources

- App Service Plan (P1v2 or equivalent)
- App Service
- Storage Account
- Application Insights

## Expected artifacts (high level)

- Phase 0: `project-plan.md`, `discovery.json`
- Phase 1: `01-requirements.md`
- Phase 2: `02-assessment.md`, `cost-estimate.md`
- Phase 3: `03-design.md` (+ ADRs)
- Phase 4: `04-plan.md`
- Phase 5: `05-implementation.md` + `bicep-templates/`
- Phase 6: `06-deployment.md` (what-if)
- Phase 7: `07-asbuilt.md`, `reference-architecture.md`

## Success criteria

- All phases complete without errors.
- Bicep validates with `bicep build`.
- Cost estimate is within $80–120/month.
- WAF pillars covered (Security/Reliability/Performance/Cost/Ops).
