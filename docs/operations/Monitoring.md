# Monitoring Guide

Production monitoring strategies for AgenticCoder projects.

## Monitoring Overview

AgenticCoder generates comprehensive monitoring configurations:
- Application Performance Monitoring (APM)
- Infrastructure monitoring
- Log aggregation
- Alerting rules
- Dashboards

## Azure Monitor Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Monitor                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Application  │  │     Log      │  │   Metrics    │         │
│  │   Insights   │  │  Analytics   │  │   Explorer   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                  │
│         └─────────────────┼─────────────────┘                  │
│                           │                                    │
│                  ┌────────▼────────┐                          │
│                  │     Alerts      │                          │
│                  │   & Actions     │                          │
│                  └────────┬────────┘                          │
│                           │                                    │
│                  ┌────────▼────────┐                          │
│                  │   Dashboards    │                          │
│                  │   & Workbooks   │                          │
│                  └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Application Insights Setup

### Infrastructure

```bicep
// infra/monitoring.bicep

// Log Analytics Workspace
module logAnalytics 'br/public:avm/res/operational-insights/workspace:0.7.0' = {
  name: 'log-analytics'
  params: {
    name: 'log-${projectName}-${environment}'
    location: location
    skuName: 'PerGB2018'
    retentionInDays: 90
  }
}

// Application Insights
module appInsights 'br/public:avm/res/insights/component:0.4.0' = {
  name: 'app-insights'
  params: {
    name: 'appi-${projectName}-${environment}'
    location: location
    workspaceResourceId: logAnalytics.outputs.resourceId
    kind: 'web'
    applicationType: 'web'
  }
}

// Outputs for application configuration
output appInsightsConnectionString string = appInsights.outputs.connectionString
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey
```

### Application Integration

**.NET Application:**

```csharp
// Program.cs
builder.Services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"];
});

// Custom telemetry
public class OrderService
{
    private readonly TelemetryClient _telemetry;
    
    public async Task<Order> CreateOrder(OrderRequest request)
    {
        using var operation = _telemetry.StartOperation<RequestTelemetry>("CreateOrder");
        
        try
        {
            var order = await ProcessOrder(request);
            
            _telemetry.TrackEvent("OrderCreated", new Dictionary<string, string>
            {
                ["OrderId"] = order.Id,
                ["Amount"] = order.Total.ToString()
            });
            
            return order;
        }
        catch (Exception ex)
        {
            _telemetry.TrackException(ex);
            throw;
        }
    }
}
```

**Node.js Application:**

```typescript
// src/telemetry.ts
import { TelemetryClient } from 'applicationinsights';

const client = new TelemetryClient(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);

export function trackEvent(name: string, properties?: Record<string, string>) {
  client.trackEvent({ name, properties });
}

export function trackException(error: Error) {
  client.trackException({ exception: error });
}

// Usage
app.post('/api/orders', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const order = await createOrder(req.body);
    
    trackEvent('OrderCreated', {
      orderId: order.id,
      duration: `${Date.now() - startTime}ms`
    });
    
    res.json(order);
  } catch (error) {
    trackException(error);
    res.status(500).json({ error: 'Order creation failed' });
  }
});
```

**React Application:**

```typescript
// src/telemetry.ts
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

export const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true
  }
});

appInsights.loadAppInsights();

// Track custom events
export function trackPageView(name: string) {
  appInsights.trackPageView({ name });
}

export function trackUserAction(action: string, properties?: Record<string, string>) {
  appInsights.trackEvent({ name: action, properties });
}
```

## Log Analytics Queries

### Common KQL Queries

**Error Analysis:**

```kusto
// Top errors by count
exceptions
| where timestamp > ago(24h)
| summarize count() by problemId, outerMessage
| order by count_ desc
| take 10
```

**Performance Analysis:**

```kusto
// Slow requests
requests
| where timestamp > ago(1h)
| where duration > 2000
| project timestamp, name, duration, resultCode
| order by duration desc
| take 20
```

**Dependency Analysis:**

```kusto
// Slow dependencies
dependencies
| where timestamp > ago(1h)
| summarize avg(duration), percentile(duration, 95), count() by name, type
| order by avg_duration desc
```

**User Journey:**

```kusto
// User sessions with errors
union requests, exceptions
| where timestamp > ago(24h)
| project timestamp, session_Id, itemType, name, success
| order by session_Id, timestamp
| summarize 
    requestCount = countif(itemType == "request"),
    errorCount = countif(itemType == "exception")
    by session_Id
| where errorCount > 0
```

## Alerting

### Alert Rules

```bicep
// infra/alerts.bicep

// Response time alert
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-response-time-${projectName}'
  location: 'global'
  properties: {
    description: 'Response time exceeds threshold'
    severity: 2
    enabled: true
    scopes: [appInsights.outputs.resourceId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          threshold: 2000
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Error rate alert
resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-error-rate-${projectName}'
  location: 'global'
  properties: {
    description: 'Error rate exceeds threshold'
    severity: 1
    enabled: true
    scopes: [appInsights.outputs.resourceId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ErrorRate'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 5
          timeAggregation: 'Count'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Action Group
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-${projectName}'
  location: 'global'
  properties: {
    groupShortName: projectName
    enabled: true
    emailReceivers: [
      {
        name: 'DevOps Team'
        emailAddress: notificationEmail
        useCommonAlertSchema: true
      }
    ]
  }
}
```

### Alert Categories

| Category | Metric | Threshold | Severity |
|----------|--------|-----------|----------|
| **Performance** | Response time | >2s avg | Warning |
| **Availability** | Failed requests | >1% | Critical |
| **Errors** | Exception count | >10/5min | Critical |
| **Resources** | CPU usage | >80% | Warning |
| **Resources** | Memory usage | >85% | Warning |
| **Capacity** | Storage usage | >80% | Warning |

## Dashboards

### Azure Dashboard

```json
// dashboard.json
{
  "properties": {
    "lenses": [
      {
        "parts": [
          {
            "position": { "x": 0, "y": 0, "colSpan": 6, "rowSpan": 4 },
            "metadata": {
              "type": "Extension/AppInsightsExtension/PartType/MetricsExplorerBladePinnedPart",
              "settings": {
                "chartType": "Line",
                "metrics": [
                  { "name": "requests/duration", "aggregation": "Average" }
                ],
                "timespan": "PT24H"
              }
            }
          },
          {
            "position": { "x": 6, "y": 0, "colSpan": 6, "rowSpan": 4 },
            "metadata": {
              "type": "Extension/AppInsightsExtension/PartType/MetricsExplorerBladePinnedPart",
              "settings": {
                "chartType": "Line",
                "metrics": [
                  { "name": "requests/failed", "aggregation": "Sum" }
                ]
              }
            }
          }
        ]
      }
    ]
  }
}
```

### Workbook Template

```json
// workbook.json
{
  "version": "Notebook/1.0",
  "items": [
    {
      "type": 1,
      "content": {
        "json": "## Application Health Dashboard"
      }
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "requests | summarize RequestCount = count(), FailedCount = countif(success == false) by bin(timestamp, 1h) | extend SuccessRate = (RequestCount - FailedCount) * 100.0 / RequestCount",
        "size": 0,
        "title": "Request Success Rate",
        "queryType": 0,
        "resourceType": "microsoft.insights/components",
        "visualization": "linechart"
      }
    }
  ]
}
```

## Health Endpoints

### Health Check Implementation

```csharp
// .NET Health Checks
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString, name: "database")
    .AddRedis(redisConnection, name: "cache")
    .AddAzureServiceBusQueue(serviceBusConnection, queueName, name: "servicebus")
    .AddApplicationInsightsPublisher();

// Health endpoint configuration
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});
```

### Health Check Response

```json
{
  "status": "Healthy",
  "totalDuration": "00:00:00.1234567",
  "entries": {
    "database": {
      "status": "Healthy",
      "duration": "00:00:00.0500000"
    },
    "cache": {
      "status": "Healthy",
      "duration": "00:00:00.0100000"
    },
    "servicebus": {
      "status": "Healthy",
      "duration": "00:00:00.0300000"
    }
  }
}
```

## Distributed Tracing

### Correlation Configuration

```typescript
// Correlation headers propagation
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation({
      requestHook: (span, request) => {
        span.setAttribute('custom.attribute', 'value');
      }
    })
  ]
});
```

### Viewing Traces

```kusto
// End-to-end transaction
union requests, dependencies, exceptions
| where operation_Id == "abc123"
| project timestamp, itemType, name, duration, success
| order by timestamp asc
```

## Metrics Collection

### Custom Metrics

```csharp
// Track custom metrics
_telemetry.TrackMetric("OrdersProcessed", ordersCount);
_telemetry.TrackMetric("OrderValue", order.Total);

// With dimensions
_telemetry.GetMetric("OrdersByRegion", "Region")
    .TrackValue(order.Total, order.Region);
```

### Prometheus Integration (AKS)

```yaml
# prometheus-config.yaml
scrape_configs:
  - job_name: 'myapp'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

## SLA Monitoring

### SLI/SLO Configuration

```yaml
# slo-config.yaml
slos:
  - name: "API Availability"
    description: "API should be available 99.9% of the time"
    target: 99.9
    window: "30d"
    indicator:
      type: "availability"
      query: |
        requests
        | where name startswith "POST /api/"
        | summarize SuccessRate = 100.0 * countif(success == true) / count()

  - name: "API Latency"
    description: "95th percentile latency under 500ms"
    target: 95
    window: "7d"
    indicator:
      type: "latency"
      query: |
        requests
        | where name startswith "POST /api/"
        | summarize P95 = percentile(duration, 95)
        | extend Compliant = P95 < 500
```

## Next Steps

- [Security](Security) - Security monitoring
- [Deployment](Deployment) - Deployment strategies
- [Maintenance](Maintenance) - Ongoing maintenance
