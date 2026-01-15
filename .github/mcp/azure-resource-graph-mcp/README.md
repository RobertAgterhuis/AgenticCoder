# azure-resource-graph-mcp (stub)

Status: scaffold only. Intended to expose Azure Resource Graph queries per the project plan.

Quickstart:

```bash
python -m azure_resource_graph_mcp ping
python -m azure_resource_graph_mcp query "resources | limit 1"

# MCP stdio JSON-RPC mode (Content-Length framing)
python -m azure_resource_graph_mcp mcp
```

## TODO

- Implement auth and real query execution.
- Add health check sample query and logging.
