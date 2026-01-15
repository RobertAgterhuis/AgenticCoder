# MCP Server: Azure Pricing (Stub)

Provides endpoints to query Azure retail pricing with future support for Cost Management APIs.

## Endpoints
- `GET /health` — server status
- `GET /api/prices` — stub; to be implemented

## Setup
```powershell
cd servers/mcp-azure-pricing
npm install
copy .env.sample .env
# Fill in Azure credentials if needed later
npm run start
```
