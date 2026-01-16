# MCP Transport Guide (Safe Migration)

This repo currently has **two ways** to run “tool servers”:

1. **HTTP servers** under `servers/` (today’s default runtime path)
2. **MCP stdio-style servers** under `.github/mcp/` (plan-aligned scaffolding)

The agent runtime now supports a **transport-agnostic client** so we can migrate safely:

- Default behavior stays the same: **HTTP** via `endpoint`
- Optional behavior: **MCP over stdio** via `command`/`args`
- We keep HTTP as fallback until you explicitly remove it

## Where tool server configs live

Agents define required tool servers in their `definition.mcpServers` array.

Example (current default / HTTP):

```json
{
  "name": "azure-pricing",
  "endpoint": "http://localhost:3001"
}
```

## Selecting the transport

### 1) Default (HTTP)

Do nothing. If a server config has `endpoint`, the agent uses the HTTP client.

### 2) Opt into MCP stdio per server

Provide a `command` to spawn the MCP server process:

```json
{
  "name": "azure-pricing",
  "transport": "mcp-stdio",
  "command": "python",
  "args": ["-m", "azure_pricing_mcp.server"],
  "env": {
    "PYTHONPATH": ".github/mcp/azure-pricing-mcp"
  }
}
```

Notes:
- `env` is merged with the current environment.
- Use `cwd` if the server needs a specific working directory.

### 3) Force MCP stdio globally (migration testing)

Set:

```text
AGENTICCODER_TOOL_TRANSPORT=mcp-stdio
```

This makes the factory prefer MCP stdio. You still need `command`/`args` (or the client can’t spawn anything).

## Recommended migration sequence

1. **Keep HTTP running** (no disruption)
2. Switch one server config to MCP stdio (per-server opt-in)
3. Validate by running `cd agents && npm test`
4. Repeat for the next tool server
5. Only after everything is stable, decide whether to remove/rename the HTTP stubs

## Implementation details

- HTTP path: wrapper around the existing HTTP client (current behavior)
- MCP stdio path: JSON-RPC over stdio using Content-Length framing (best-effort `initialize` handshake)

If a specific MCP server doesn’t support `initialize` yet, the client continues without failing (during migration).
