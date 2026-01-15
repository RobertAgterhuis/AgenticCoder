# AgenticCoder MCP Servers

This folder contains MCP-related scaffolding used to align the repository with the planning documents.

Important: the code under `.github/mcp/` is currently **CLI-oriented scaffolding**, not full MCP protocol implementations.

## Servers

- `azure-pricing-mcp`: minimal working CLI against Azure Retail Prices API (`ping`, `price_search`, `cost_estimate`).
- `azure-resource-graph-mcp`: stub CLI (`ping`, `query`) returning JSON.
- `microsoft-docs-mcp`: stub CLI (`ping`, `search`) returning JSON.

## Configuration

- `.github/mcp/mcp.json` is a configuration template referenced by the project plan.
- `.vscode/mcp.json` is checked in as a placeholder (see `.vscode/README.md`).

## Smoke test

```bash
bash .github/mcp/smoke-test.sh
```

