# Azure Monitoring Patterns Skill

## Overview

This skill provides patterns and best practices for Azure monitoring including Application Insights, Log Analytics, alerting, and dashboards.

---

## Application Insights SDK Setup

### Node.js/TypeScript

```typescript
import { ApplicationInsights } from '@azure/monitor-opentelemetry';

// Early initialization
ApplicationInsights.getInstance({
  azureMonitorExporterOptions: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
  instrumentationOptions: {
    http: { enabled: true },
    azureSdk: { enabled: true },
    mongoDb: { enabled: true },
    redis: { enabled: true },
  },
  samplingRatio: 0.5,  // 50% sampling in production
});

// Access telemetry client
const client = ApplicationInsights.getClient();
```

### Custom Telemetry

```typescript
import { metrics, trace } from '@opentelemetry/api';

// Custom metrics
const meter = metrics.getMeter('my-app');
const requestCounter = meter.createCounter('requests_total', {
  description: 'Total number of requests',
});
const latencyHistogram = meter.createHistogram('request_latency_ms', {
  description: 'Request latency in milliseconds',
});

// Track request
requestCounter.add(1, { endpoint: '/api/users', method: 'GET' });
latencyHistogram.record(150, { endpoint: '/api/users' });

// Custom events
const tracer = trace.getTracer('my-app');
const span = tracer.startSpan('process-order');
span.setAttribute('order.id', orderId);
span.setAttribute('order.total', 99.99);
span.end();
```

---

## Distributed Tracing Pattern

```typescript
// Express middleware for correlation
import { context, propagation, trace } from '@opentelemetry/api';

function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  const carrier = {};
  propagation.inject(context.active(), carrier);
  
  // Add correlation ID to response headers
  res.setHeader('x-correlation-id', carrier['traceparent'] || '');
  
  // Add to downstream requests
  req.correlationId = carrier['traceparent'];
  
  next();
}

// Propagate to downstream service
async function callDownstreamService(correlationId: string) {
  const response = await fetch('https://api.service.com/endpoint', {
    headers: {
      'traceparent': correlationId,
    },
  });
}
```

---

## Log Analytics KQL Patterns

### Request Performance

```kusto
// Slow requests by endpoint
requests
| where timestamp > ago(1h)
| where duration > 1000  // > 1 second
| summarize 
    avgDuration = avg(duration),
    p95Duration = percentile(duration, 95),
    count = count()
  by name
| order by p95Duration desc
| take 20
```

### Exception Analysis

```kusto
// Exception trends by type
exceptions
| where timestamp > ago(24h)
| summarize count = count() by 
    type, 
    bin(timestamp, 1h)
| render timechart
```

### Dependency Failures

```kusto
// Failed dependency calls
dependencies
| where timestamp > ago(1h)
| where success == false
| summarize 
    failureCount = count(),
    avgDuration = avg(duration)
  by target, type, resultCode
| order by failureCount desc
```

### Custom Metrics Dashboard

```kusto
// Active users over time
customMetrics
| where timestamp > ago(7d)
| where name == "active_users"
| summarize avgUsers = avg(value) by bin(timestamp, 1h)
| render timechart
```

---

## Alert Rules

### Metric Alert (High Latency)

```bicep
resource latencyAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'high-latency-alert'
  location: 'global'
  properties: {
    description: 'Alert when request latency exceeds threshold'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighLatency'
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          threshold: 5000  // 5 seconds
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      { actionGroupId: actionGroup.id }
    ]
  }
}
```

### Log Alert (Error Spike)

```bicep
resource errorAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'error-spike-alert'
  location: location
  properties: {
    description: 'Alert on error rate increase'
    severity: 1
    enabled: true
    scopes: [logAnalyticsWorkspace.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
            exceptions
            | where timestamp > ago(15m)
            | summarize errorCount = count()
          '''
          timeAggregation: 'Total'
          operator: 'GreaterThan'
          threshold: 50
        }
      ]
    }
    actions: {
      actionGroups: [actionGroup.id]
    }
  }
}
```

---

## Action Groups

```bicep
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'critical-alerts-ag'
  location: 'global'
  properties: {
    groupShortName: 'Critical'
    enabled: true
    emailReceivers: [
      {
        name: 'ops-team'
        emailAddress: 'ops@company.com'
        useCommonAlertSchema: true
      }
    ]
    webhookReceivers: [
      {
        name: 'teams-webhook'
        serviceUri: teamsWebhookUri
        useCommonAlertSchema: true
      }
    ]
  }
}
```

---

## Dashboard Patterns

### Azure Portal Dashboard (ARM)

```json
{
  "lenses": {
    "0": {
      "parts": {
        "0": {
          "position": { "x": 0, "y": 0, "colSpan": 6, "rowSpan": 4 },
          "metadata": {
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "query": "requests | summarize count() by bin(timestamp, 1h) | render timechart"
            }
          }
        }
      }
    }
  }
}
```

---

## Key Metrics to Monitor

| Layer | Metric | Threshold | Action |
|-------|--------|-----------|--------|
| Application | Response time P95 | > 2s | Scale/optimize |
| Application | Error rate | > 1% | Investigate |
| Application | Request rate | Anomaly | Scale |
| Infrastructure | CPU | > 80% | Scale out |
| Infrastructure | Memory | > 85% | Scale up |
| Database | DTU/RU usage | > 80% | Scale |
| Storage | Latency | > 100ms | Check network |

---

## Sampling Strategies

| Environment | Sampling Ratio | Rationale |
|-------------|----------------|-----------|
| Development | 1.0 (100%) | Full visibility |
| Staging | 0.5 (50%) | Balance visibility/cost |
| Production | 0.1-0.3 (10-30%) | Cost optimization |

### Adaptive Sampling (Auto)

```typescript
// Let SDK decide based on volume
ApplicationInsights.getInstance({
  samplingRatio: undefined,  // Adaptive
  azureMonitorExporterOptions: {
    connectionString: connectionString,
  },
});
```

---

## Workbook Queries

### SLA Calculation

```kusto
// Calculate availability SLA
let totalRequests = requests
| where timestamp > ago(30d)
| count;
let failedRequests = requests
| where timestamp > ago(30d)
| where success == false
| count;
print SLA = round((1 - (toscalar(failedRequests) / toscalar(totalRequests))) * 100, 2)
```

### User Journey Analysis

```kusto
// Page view funnel
pageViews
| where timestamp > ago(7d)
| where name in ('Home', 'Product', 'Cart', 'Checkout', 'Confirmation')
| summarize count() by name
| order by count_ desc
```

---

## Cost Optimization

| Strategy | Impact |
|----------|--------|
| Sampling | Reduce ingestion by 70-90% |
| Daily cap | Hard limit on cost |
| Data retention | 30 days vs 90 days |
| Archive to Storage | Long-term at lower cost |
| Commitment tier | 15-20% savings |

---

## Bicep Workspace Setup

```bicep
resource workspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: workspaceName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
    IngestionMode: 'LogAnalytics'
    DisableIpMasking: false
    SamplingPercentage: 50
  }
}
```

---

## Related Agents

- @monitoring-specialist - Full implementation guidance
- @bicep-specialist - Infrastructure deployment
- @backend-specialist - Application integration

---

## Tags

`monitoring` `application-insights` `log-analytics` `kql` `alerting` `dashboards` `azure`
