# Phase 1: Manual Setup Guide

This document outlines the manual configuration steps required before starting Phase 2 (Agent Integration).

---

## 📋 Prerequisites

- Azure subscription with Owner or Contributor access
- Azure CLI installed (already in Dev Container)
- PowerShell or Bash terminal
- VS Code with this repository open

---

## 🔐 Step 1: Azure App Registration (Service Principal)

The MCP servers need authentication to access Azure APIs. Create a Service Principal for all three servers.

### 1.1 Create App Registration

```powershell
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "YOUR-SUBSCRIPTION-NAME-OR-ID"

# Create Service Principal
az ad sp create-for-rbac --name "AgenticCoder-MCP-ServicePrincipal" --role "Reader" --scopes /subscriptions/YOUR-SUBSCRIPTION-ID
```

**Expected Output**:
```json
{
  "appId": "12345678-1234-1234-1234-123456789abc",
  "displayName": "AgenticCoder-MCP-ServicePrincipal",
  "password": "YOUR-CLIENT-SECRET-HERE",
  "tenant": "87654321-4321-4321-4321-987654321cba"
}
```

**Save these values** - you'll need them in Step 2.

### 1.2 Grant Additional Permissions

The Service Principal needs specific permissions for each MCP server:

#### For Resource Graph Server (Query Azure resources):
```powershell
# Already has Reader role from above - sufficient for basic queries
# For management group queries, add Reader at management group level:
az role assignment create --assignee "YOUR-APP-ID" --role "Reader" --scope "/providers/Microsoft.Management/managementGroups/YOUR-MG-ID"
```

#### For Cost Management & Pricing (optional - for future cost APIs):
```powershell
# Grant Cost Management Reader role
az role assignment create --assignee "YOUR-APP-ID" --role "Cost Management Reader" --scope /subscriptions/YOUR-SUBSCRIPTION-ID
```

#### For Docs Server:
No additional permissions needed - uses public Microsoft Learn API.

---

## 🔧 Step 2: Environment Variables Setup

Each MCP server needs environment variables. Copy the `.env.sample` files and fill in your values.

### 2.1 Azure Pricing Server

```powershell
cd D:\repositories\AgenticCoder\servers\mcp-azure-pricing
Copy-Item .env.sample .env
```

Edit `servers/mcp-azure-pricing/.env`:
```bash
# Azure Service Principal
AZURE_TENANT_ID=87654321-4321-4321-4321-987654321cba
AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
AZURE_CLIENT_SECRET=YOUR-CLIENT-SECRET-HERE
AZURE_SUBSCRIPTION_ID=YOUR-SUBSCRIPTION-ID

# Server Configuration
PORT=3001
```

**Where to get these values**:
- `AZURE_TENANT_ID`: From `az ad sp create-for-rbac` output → `tenant`
- `AZURE_CLIENT_ID`: From `az ad sp create-for-rbac` output → `appId`
- `AZURE_CLIENT_SECRET`: From `az ad sp create-for-rbac` output → `password`
- `AZURE_SUBSCRIPTION_ID`: Run `az account show --query id -o tsv`

---

### 2.2 Azure Resource Graph Server

```powershell
cd D:\repositories\AgenticCoder\servers\mcp-azure-resource-graph
Copy-Item .env.sample .env
```

Edit `servers/mcp-azure-resource-graph/.env`:
```bash
# Azure Service Principal
AZURE_TENANT_ID=87654321-4321-4321-4321-987654321cba
AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
AZURE_CLIENT_SECRET=YOUR-CLIENT-SECRET-HERE
AZURE_SUBSCRIPTION_ID=YOUR-SUBSCRIPTION-ID

# Resource Graph Configuration
# Comma-separated list of subscription IDs to query (optional - defaults to AZURE_SUBSCRIPTION_ID)
AZURE_SUBSCRIPTIONS=sub-id-1,sub-id-2,sub-id-3

# Management Group ID for querying entire management group (optional)
MANAGEMENT_GROUP_ID=

# Server Configuration
PORT=3002
```

**Configuration Notes**:
- `AZURE_SUBSCRIPTIONS`: List all subscriptions you want to query. If empty, uses `AZURE_SUBSCRIPTION_ID`.
- `MANAGEMENT_GROUP_ID`: If you have management groups, you can query all subscriptions under a management group.

---

### 2.3 Azure Docs Server

```powershell
cd D:\repositories\AgenticCoder\servers\mcp-azure-docs
Copy-Item .env.sample .env
```

Edit `servers/mcp-azure-docs/.env`:
```bash
# Azure Service Principal (optional - not required for docs search)
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_SUBSCRIPTION_ID=

# Server Configuration
PORT=3003
```

**Note**: Docs server doesn't require Azure credentials since it uses the public Microsoft Learn API.

---

## ✅ Step 3: Verify Setup

### 3.1 Test Azure CLI Authentication

```powershell
az login
az account show
```

Expected: Your subscription details displayed.

### 3.2 Test Service Principal Authentication

```powershell
az login --service-principal `
  --username YOUR-APP-ID `
  --password YOUR-CLIENT-SECRET `
  --tenant YOUR-TENANT-ID
```

Expected: Login successful message.

### 3.3 Test MCP Servers

#### Start Pricing Server:
```powershell
cd D:\repositories\AgenticCoder\servers\mcp-azure-pricing
npm install
npm start
```

In another terminal:
```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:3001/health"
Invoke-WebRequest -UseBasicParsing "http://localhost:3001/api/prices?limit=5"
```

#### Start Resource Graph Server:
```powershell
cd D:\repositories\AgenticCoder\servers\mcp-azure-resource-graph
npm install
npm start
```

In another terminal:
```powershell
# Health check
Invoke-WebRequest -UseBasicParsing "http://localhost:3002/health"

# Test query
$body = @{
  query = "Resources | project name, type, location | limit 5"
  subscriptions = @("YOUR-SUBSCRIPTION-ID")
} | ConvertTo-Json

Invoke-WebRequest -UseBasicParsing http://localhost:3002/api/query `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

#### Start Docs Server:
```powershell
cd D:\repositories\AgenticCoder\servers\mcp-azure-docs
npm install
npm start
```

In another terminal:
```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:3003/health"
Invoke-WebRequest -UseBasicParsing "http://localhost:3003/api/search?q=Azure%20Functions&limit=5"
```

---

## 🔒 Step 4: GitHub Secrets (for CI/CD)

If you want CI to test against real Azure APIs (optional), add repository secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

| Secret Name | Value | Used By |
|------------|-------|---------|
| `AZURE_TENANT_ID` | Your tenant ID | All servers |
| `AZURE_CLIENT_ID` | Your app ID | All servers |
| `AZURE_CLIENT_SECRET` | Your client secret | All servers |
| `AZURE_SUBSCRIPTION_ID` | Your subscription ID | Pricing, Resource Graph |
| `AZURE_SUBSCRIPTIONS` | Comma-separated subscription IDs | Resource Graph |

**Note**: Current CI only runs unit tests and doesn't require Azure credentials. Add these if you want integration tests in CI.

---

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Store `.env` files locally only (already in `.gitignore`)
- ✅ Use Service Principal with least-privilege (Reader role)
- ✅ Rotate client secrets every 90 days
- ✅ Use Azure Key Vault for production deployments
- ✅ Enable MFA on your Azure account

### ❌ DON'T:
- ❌ Commit `.env` files to git
- ❌ Share client secrets in chat/email
- ❌ Grant Owner role to Service Principal
- ❌ Use personal credentials for Service Principal

---

## 🐛 Troubleshooting

### Error: "AADSTS7000215: Invalid client secret"
**Solution**: Client secret may have expired or was copied incorrectly. Create a new one:
```powershell
az ad app credential reset --id YOUR-APP-ID
```

### Error: "AuthorizationFailed" in Resource Graph queries
**Solution**: Service Principal needs Reader role. Add it:
```powershell
az role assignment create --assignee YOUR-APP-ID --role "Reader" --scope /subscriptions/YOUR-SUBSCRIPTION-ID
```

### Error: "Cannot find module '@azure/identity'"
**Solution**: Install dependencies:
```powershell
cd servers/mcp-azure-resource-graph
npm install
```

### Error: Rate limit exceeded (429 Too Many Requests)
**Solution**: 
- Pricing API: Wait 60 seconds (60 req/min limit)
- Docs API: Wait 60 seconds (60 req/min limit)
- Increase TTL cache to reduce API calls

### Error: "EADDRINUSE" (port already in use)
**Solution**: Stop existing server process:
```powershell
Get-Job | Where-Object { $_.Command -like '*node index.js*' } | Stop-Job
Get-Job | Remove-Job -Force
```

---

## 📊 Environment Variables Quick Reference

### All Servers Need:
```bash
AZURE_TENANT_ID=<from App Registration>
AZURE_CLIENT_ID=<from App Registration>
AZURE_CLIENT_SECRET=<from App Registration>
AZURE_SUBSCRIPTION_ID=<from az account show>
```

### Resource Graph Server Additionally Needs:
```bash
AZURE_SUBSCRIPTIONS=<comma-separated subscription IDs>
MANAGEMENT_GROUP_ID=<optional management group ID>
```

### Server Ports:
```bash
# Pricing Server
PORT=3001

# Resource Graph Server
PORT=3002

# Docs Server
PORT=3003
```

---

## ✅ Setup Checklist

Before proceeding to Phase 2, ensure:

- [ ] Azure CLI installed and authenticated (`az login`)
- [ ] Service Principal created (`az ad sp create-for-rbac`)
- [ ] Reader role assigned to Service Principal
- [ ] `.env` files created for all 3 servers (pricing, resource-graph, docs)
- [ ] All environment variables populated with correct values
- [ ] All 3 servers start successfully (`npm install && npm start`)
- [ ] Health checks return 200 OK for all servers
- [ ] At least one successful API call to each server
- [ ] Tests pass for all servers (`npm test`)
- [ ] `.env` files are in `.gitignore` (already done)

---

## 🚀 Next Steps

Once all checklist items are complete:
1. Commit your changes (excluding `.env` files)
2. Push to GitHub
3. Verify CI pipeline runs successfully
4. **Proceed to Phase 2: Agent Integration**

---

## 📚 Additional Resources

- [Azure Service Principal documentation](https://learn.microsoft.com/azure/active-directory/develop/app-objects-and-service-principals)
- [Azure Resource Graph query language](https://learn.microsoft.com/azure/governance/resource-graph/concepts/query-language)
- [Azure Retail Prices API](https://learn.microsoft.com/azure/cost-management-billing/retail-prices/retail-prices)
- [Microsoft Learn search API](https://learn.microsoft.com/api/search)
- [DefaultAzureCredential authentication flow](https://learn.microsoft.com/dotnet/api/azure.identity.defaultazurecredential)

---

**Document Version**: 1.0  
**Last Updated**: January 14, 2026  
**Status**: Phase 1 Complete - Ready for Phase 2
