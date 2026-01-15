# Branch protection checklist (main)

This repo uses trunk-based development (see [TRUNK-BASED-WORKFLOW.md](TRUNK-BASED-WORKFLOW.md)).

## Recommended settings

- Require a pull request before merging
- Require at least 1 approving review
- Dismiss stale reviews when new commits are pushed
- Require conversation resolution
- Require status checks to pass:
  - CI / Schema Validation
  - CI / Agent Framework Tests
  - CI / MCP Servers Tests (servers/mcp-azure-pricing, 3001)
  - CI / MCP Servers Tests (servers/mcp-azure-resource-graph, 3002)
  - CI / MCP Servers Tests (servers/mcp-azure-docs, 3003)
- Enforce rules for admins

## Optional

- Restrict who can push to `main` (needs a list of allowed users/teams; enable later when collaborators exist)
