# Maintenance Guide

Ongoing maintenance procedures for AgenticCoder projects.

## Maintenance Overview

Regular maintenance ensures:
- System reliability and performance
- Security compliance
- Cost optimization
- Technical debt management

## Dependency Updates

### Automated Updates with Dependabot

```yaml
# .github/dependabot.yml

version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    groups:
      production:
        patterns:
          - "*"
        exclude-patterns:
          - "@types/*"
          - "eslint*"
          - "prettier*"
      dev:
        patterns:
          - "@types/*"
          - "eslint*"
          - "prettier*"
        update-types:
          - "minor"
          - "patch"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

  # Docker
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Manual Update Process

```bash
# Check for outdated packages
npm outdated

# Update minor/patch versions
npm update

# Update major versions (careful!)
npx npm-check-updates -u
npm install

# Audit for vulnerabilities
npm audit
npm audit fix

# Test after updates
npm test
npm run build
```

### .NET Updates

```bash
# Check for outdated packages
dotnet list package --outdated

# Update packages
dotnet add package Microsoft.EntityFrameworkCore --version latest

# Or update all at once
dotnet outdated --upgrade
```

## Infrastructure Maintenance

### Bicep Module Updates

```bash
# List current AVM module versions
az bicep restore --file main.bicep --verbose

# Check for AVM updates
agentic avm check-updates

# Update to latest AVM versions
# Edit bicep files to update version numbers
# Example: br/public:avm/res/web/site:0.11.0 → 0.12.0

# Validate updated templates
az bicep build --file main.bicep

# Preview changes
az deployment sub what-if \
  --location westeurope \
  --template-file main.bicep
```

### Resource Maintenance

```bash
# App Service maintenance
az webapp restart --name myapp --resource-group rg-myapp

# Scale up/down
az webapp update --name myapp --resource-group rg-myapp --set siteConfig.numberOfWorkers=3

# SQL maintenance
az sql db update --name mydb --server myserver --resource-group rg-myapp \
  --service-objective S2
```

## Database Maintenance

### SQL Server Maintenance

```sql
-- Index maintenance
ALTER INDEX ALL ON [dbo].[Orders] REBUILD;

-- Statistics update
UPDATE STATISTICS [dbo].[Orders];

-- Query performance analysis
SELECT TOP 10
    qs.total_elapsed_time / qs.execution_count AS avg_duration,
    qs.execution_count,
    SUBSTRING(qt.text, qs.statement_start_offset/2 + 1,
        (CASE WHEN qs.statement_end_offset = -1 
              THEN LEN(CONVERT(NVARCHAR(MAX), qt.text)) * 2
              ELSE qs.statement_end_offset END 
         - qs.statement_start_offset) / 2 + 1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY avg_duration DESC;
```

### Automated Maintenance Jobs

```yaml
# .github/workflows/db-maintenance.yml

name: Database Maintenance

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly Sunday 2 AM

jobs:
  maintenance:
    runs-on: ubuntu-latest
    
    steps:
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Run Index Maintenance
        run: |
          az sql db execute \
            --name ${{ vars.DB_NAME }} \
            --server ${{ vars.SQL_SERVER }} \
            --resource-group ${{ vars.RESOURCE_GROUP }} \
            --query "EXEC sp_MSforeachtable 'ALTER INDEX ALL ON ? REBUILD'"
```

### Backup Verification

```bash
# List backups
az sql db ltr-backup list \
  --location westeurope \
  --server myserver \
  --resource-group rg-myapp

# Test restore to new database
az sql db restore \
  --dest-name mydb-test-restore \
  --name mydb \
  --resource-group rg-myapp \
  --server myserver \
  --time "2024-01-15T12:00:00Z"

# Verify restored database
# ... run tests ...

# Clean up test restore
az sql db delete --name mydb-test-restore --yes
```

## Log Management

### Log Retention Policy

```bicep
// Configure log retention
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    retentionInDays: 90
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: 5
    }
  }
}
```

### Log Cleanup

```kusto
// Identify log volume by source
union *
| where TimeGenerated > ago(7d)
| summarize Size = sum(estimate_data_size(*)) by Type
| order by Size desc
| take 20

// Archive or delete old logs
.set-or-append ArchivedLogs <|
AppTraces
| where TimeGenerated < ago(90d)
```

## Performance Optimization

### Regular Performance Review

```kusto
// Weekly performance report
let timeRange = 7d;

// Response time trends
requests
| where timestamp > ago(timeRange)
| summarize 
    AvgDuration = avg(duration),
    P95Duration = percentile(duration, 95),
    P99Duration = percentile(duration, 99)
    by bin(timestamp, 1h)
| render timechart

// Slow endpoints
requests
| where timestamp > ago(timeRange)
| summarize 
    AvgDuration = avg(duration),
    Count = count()
    by name
| where AvgDuration > 1000
| order by AvgDuration desc
```

### Auto-scaling Review

```bash
# Review scaling history
az monitor autoscale-settings show \
  --name myapp-autoscale \
  --resource-group rg-myapp

# Check scale-out events
az monitor activity-log list \
  --resource-group rg-myapp \
  --query "[?contains(operationName.localizedValue, 'Scale')]"
```

## Cost Optimization

### Monthly Cost Review

```bash
# Get cost analysis
az consumption usage list \
  --start-date 2024-01-01 \
  --end-date 2024-01-31 \
  --query "[].{Name:instanceName, Cost:pretaxCost}" \
  --output table

# Get recommendations
az advisor recommendation list \
  --category Cost
```

### Right-sizing Resources

```yaml
# .github/workflows/cost-analysis.yml

name: Cost Analysis

on:
  schedule:
    - cron: '0 8 1 * *'  # Monthly

jobs:
  analyze:
    runs-on: ubuntu-latest
    
    steps:
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Generate Cost Report
        run: |
          az cost-management query \
            --type Usage \
            --scope "subscriptions/${{ secrets.AZURE_SUBSCRIPTION_ID }}" \
            --timeframe MonthToDate \
            --output table > cost-report.txt
      
      - name: Check Advisor Recommendations
        run: |
          az advisor recommendation list --category Cost --output table
```

### Resource Cleanup

```bash
# Find unused resources
az resource list \
  --query "[?tags.environment=='dev' && properties.provisioningState=='Succeeded']" \
  --output table

# Delete old snapshots
az snapshot list \
  --query "[?timeCreated < '2024-01-01']" \
  --output table

# Clean up orphaned disks
az disk list \
  --query "[?managedBy==null]" \
  --output table
```

## Security Updates

### Certificate Renewal

```bash
# Check certificate expiration
az keyvault certificate list \
  --vault-name myvault \
  --query "[].{Name:name, Expires:attributes.expires}" \
  --output table

# Renew certificate
az keyvault certificate create \
  --vault-name myvault \
  --name myapp-cert \
  --policy @cert-policy.json
```

### Security Patching

```yaml
# .github/workflows/security-updates.yml

name: Security Updates

on:
  schedule:
    - cron: '0 3 * * 1'  # Weekly Monday 3 AM

jobs:
  update:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: npm audit fix
        run: |
          npm audit fix
          git diff --quiet || echo "Updates available"
      
      - name: Create PR if changes
        uses: peter-evans/create-pull-request@v5
        with:
          title: "chore: security updates"
          body: "Automated security updates from npm audit fix"
          branch: security-updates
```

## Health Checks

### System Health Report

```bash
#!/bin/bash
# scripts/health-check.sh

echo "=== System Health Report ==="
echo "Date: $(date)"

# App Service
echo -e "\n--- App Service ---"
az webapp show --name $APP_NAME --resource-group $RG \
  --query "{State:state, Health:healthCheckPath}"

# Database
echo -e "\n--- Database ---"
az sql db show --name $DB_NAME --server $SQL_SERVER --resource-group $RG \
  --query "{Status:status, MaxSize:maxSizeBytes}"

# Key Vault
echo -e "\n--- Key Vault ---"
az keyvault show --name $KV_NAME --resource-group $RG \
  --query "{State:properties.provisioningState}"

# Storage
echo -e "\n--- Storage ---"
az storage account show --name $STORAGE_NAME --resource-group $RG \
  --query "{Status:statusOfPrimary, Replication:sku.name}"
```

### Endpoint Monitoring

```typescript
// scripts/endpoint-check.ts

const endpoints = [
  { name: 'API Health', url: `${API_URL}/health` },
  { name: 'Web App', url: `${WEB_URL}` },
  { name: 'Auth Service', url: `${AUTH_URL}/health` }
];

async function checkEndpoints() {
  const results = await Promise.all(
    endpoints.map(async (ep) => {
      const start = Date.now();
      try {
        const response = await fetch(ep.url);
        return {
          name: ep.name,
          status: response.ok ? 'UP' : 'DOWN',
          statusCode: response.status,
          responseTime: Date.now() - start
        };
      } catch (error) {
        return {
          name: ep.name,
          status: 'ERROR',
          error: error.message
        };
      }
    })
  );
  
  console.table(results);
}

checkEndpoints();
```

## Maintenance Schedule

| Task | Frequency | Responsible |
|------|-----------|-------------|
| Dependency updates | Weekly | Automated (Dependabot) |
| Security scanning | Daily | Automated (CI) |
| Database maintenance | Weekly | Automated |
| Log cleanup | Monthly | Automated |
| Cost review | Monthly | DevOps team |
| Performance review | Weekly | Dev team |
| Certificate renewal | As needed | DevOps team |
| Disaster recovery test | Quarterly | DevOps team |
| Security audit | Annually | Security team |

## Runbook Templates

### Incident Response

```markdown
## Incident Response Runbook

### 1. Detection
- [ ] Alert received from monitoring
- [ ] Verify alert is not false positive
- [ ] Assess severity (P1/P2/P3/P4)

### 2. Triage
- [ ] Identify affected components
- [ ] Check recent deployments
- [ ] Review error logs
- [ ] Notify stakeholders

### 3. Mitigation
- [ ] Rollback if deployment-related
- [ ] Scale resources if load-related
- [ ] Failover if region-related
- [ ] Apply hotfix if code-related

### 4. Resolution
- [ ] Verify service restored
- [ ] Monitor for recurrence
- [ ] Document root cause
- [ ] Create follow-up tasks

### 5. Post-Mortem
- [ ] Schedule post-mortem meeting
- [ ] Document timeline
- [ ] Identify improvements
- [ ] Update runbooks
```

## Next Steps

- [Monitoring](Monitoring) - Monitor maintenance tasks
- [Security](Security) - Security maintenance
- [Deployment](Deployment) - Deploy updates
