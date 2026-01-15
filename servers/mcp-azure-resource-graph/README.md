# MCP Server: Azure Resource Graph (Stub)

Provides endpoints to query Azure Resource Graph and return resource inventory results.

## Endpoints
- `GET /health` — server status
- `POST /api/query` — stub; to be implemented

## Setup
```powershell
cd servers/mcp-azure-resource-graph
npm install
copy .env.sample .env
npm run start
```
