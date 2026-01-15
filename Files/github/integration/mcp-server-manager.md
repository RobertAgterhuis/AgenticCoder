# MCP Server Manager

## Purpose
Operational playbook for MCP servers (azure-pricing-mcp, azure-resource-graph-mcp, microsoft-docs-mcp) including startup, health, and troubleshooting. Aligns with Plan-E/Plan-F.

## Startup
- Launch via VS Code MCP integration using .github/mcp/mcp.json.
- Ensure virtualenv activated (.venv in repo or per-server venv).
- For azure-resource-graph-mcp set AZURE_SUBSCRIPTION_ID and ensure az login has Reader/Graph access.

## Health Checks (current stubs)
- azure-pricing-mcp: `python -m azure_pricing_mcp price_search Standard_B1s`
- azure-resource-graph-mcp: `python -m azure_resource_graph_mcp query "resources | limit 1"`
- microsoft-docs-mcp: `python -m microsoft_docs_mcp search bicep`

## Troubleshooting
- Verify PYTHONPATH points to each server root (set in mcp.json).
- If az auth issues: run az login; confirm subscription; set AZURE_SUBSCRIPTION_ID env.
- For network errors: retry with exponential backoff; capture logs under .github/mcp/logs/.

## TODO
- Add per-server requirements.txt and tool manifest once implemented.
- Add health-check scripts callable from CI/local.
