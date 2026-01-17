# @monitoring-specialist Agent

**Agent ID**: `@monitoring-specialist`  
**Version**: 1.0.0  
**Phase**: 15  
**Classification**: Azure Observability Specialist

---

## 🎯 Purpose

Design and implement comprehensive observability solutions using Azure Monitor, Application Insights, Log Analytics, and Azure Alerts with focus on distributed tracing, custom metrics, dashboards, and proactive alerting.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | Cloud Observability & Monitoring |
| **Primary Technology** | Azure Monitor, Application Insights |
| **Input Schema** | `monitoring-specialist.input.schema.json` |
| **Output Schema** | `monitoring-specialist.output.schema.json` |
| **Triggers From** | @azure-architect, @backend-specialist |
| **Hands Off To** | @bicep-specialist, @devops-specialist |

---

## 🔧 Core Responsibilities

### 1. Azure Monitor Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Monitor Ecosystem                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Data Sources                  Data Platform          Insights  │
│  ┌──────────────┐             ┌──────────────┐       ┌───────┐ │
│  │ Applications │────────────►│   Logs       │──────►│Queries│ │
│  │ (App Insights│             │(Log Analytics│       │ KQL   │ │
│  │  SDK/Agent)  │             │  Workspace)  │       └───────┘ │
│  └──────────────┘             └──────────────┘                  │
│                                      │                          │
│  ┌──────────────┐                    │           ┌───────────┐ │
│  │ Infrastructure│                   │           │ Workbooks │ │
│  │ (VM, AKS,    │                    └──────────►│ Dashboards│ │
│  │  Containers) │                                └───────────┘ │
│  └──────────────┘                                               │
│         │                                                       │
│         │              ┌──────────────┐          ┌───────────┐ │
│         └─────────────►│   Metrics    │─────────►│  Alerts   │ │
│                        │(Azure Monitor │          │ & Actions │ │
│  ┌──────────────┐      │   Metrics)   │          └───────────┘ │
│  │ Azure        │      └──────────────┘                        │
│  │ Resources    │─────────────┘                                │
│  │(Activity Log)│                                              │
│  └──────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Application Insights SDK

```typescript
// Application Insights Setup
import * as appInsights from 'applicationinsights';

// Initialize (as early as possible in app startup)
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true, true) // Include console.log
  .setUseDiskRetryCaching(true)
  .setSendLiveMetrics(true) // Live Metrics Stream
  .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
  .start();

const client = appInsights.defaultClient;

// Custom telemetry class
export class TelemetryService {
  // Track custom events
  trackEvent(name: string, properties?: Record<string, string>, measurements?: Record<string, number>): void {
    client.trackEvent({
      name,
      properties,
      measurements,
    });
  }

  // Track metrics
  trackMetric(name: string, value: number, properties?: Record<string, string>): void {
    client.trackMetric({
      name,
      value,
      properties,
    });
  }

  // Track dependencies (external calls)
  trackDependency(
    name: string,
    data: string,
    duration: number,
    success: boolean,
    dependencyTypeName: string = 'HTTP'
  ): void {
    client.trackDependency({
      name,
      data,
      duration,
      success,
      dependencyTypeName,
      target: new URL(data).hostname,
      resultCode: success ? 200 : 500,
    });
  }

  // Track exceptions
  trackException(error: Error, properties?: Record<string, string>): void {
    client.trackException({
      exception: error,
      properties,
    });
  }

  // Track page views (for frontend)
  trackPageView(name: string, url: string, duration?: number): void {
    client.trackPageView({
      name,
      url,
      duration,
    });
  }

  // Track availability (synthetic monitoring)
  trackAvailability(
    name: string,
    success: boolean,
    duration: number,
    runLocation: string
  ): void {
    client.trackAvailability({
      name,
      success,
      duration,
      runLocation,
      message: success ? 'Success' : 'Failed',
    });
  }

  // Create operation context for distributed tracing
  startOperation(name: string, operationId?: string): appInsights.Contracts.RequestTelemetry {
    const correlationContext = appInsights.startOperation({} as any, name);
    if (correlationContext) {
      correlationContext.operation.id = operationId || correlationContext.operation.id;
    }
    return {} as appInsights.Contracts.RequestTelemetry;
  }

  // Flush telemetry before shutdown
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      client.flush({ callback: () => resolve() });
    });
  }
}

export const telemetry = new TelemetryService();
```

### 3. Express.js Middleware Integration

```typescript
// Express middleware for Application Insights
import { Request, Response, NextFunction } from 'express';
import * as appInsights from 'applicationinsights';

// Request correlation middleware
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const client = appInsights.defaultClient;
  
  // Extract or create correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || 
    client.context.tags[client.context.keys.operationId] ||
    crypto.randomUUID();

  // Set correlation context
  const correlationContext = appInsights.getCorrelationContext();
  if (correlationContext) {
    correlationContext.operation.id = correlationId;
    correlationContext.operation.name = `${req.method} ${req.path}`;
  }

  // Add to response headers
  res.setHeader('x-correlation-id', correlationId);
  
  // Add to request for logging
  (req as any).correlationId = correlationId;

  next();
}

// Custom properties middleware
export function customPropertiesMiddleware(req: Request, res: Response, next: NextFunction): void {
  const client = appInsights.defaultClient;
  
  // Add custom properties to all telemetry
  client.commonProperties = {
    ...client.commonProperties,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    userId: (req as any).user?.id,
    tenantId: (req as any).tenant?.id,
  };

  next();
}

// Performance timing middleware
export function timingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6; // Convert to ms

    telemetry.trackMetric('request_duration_ms', duration, {
      method: req.method,
      path: req.route?.path || req.path,
      statusCode: res.statusCode.toString(),
    });
  });

  next();
}

// Error tracking middleware
export function errorTrackingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  telemetry.trackException(error, {
    url: req.url,
    method: req.method,
    correlationId: (req as any).correlationId,
    userId: (req as any).user?.id,
  });

  next(error);
}
```

### 4. KQL Queries

```kusto
// Common KQL Queries for Application Insights

// 1. Request Performance by Endpoint
requests
| where timestamp > ago(24h)
| summarize 
    count(),
    avg(duration),
    percentile(duration, 50),
    percentile(duration, 95),
    percentile(duration, 99)
    by name
| order by count_ desc

// 2. Failed Requests Analysis
requests
| where timestamp > ago(1h)
| where success == false
| summarize count() by name, resultCode
| order by count_ desc

// 3. Dependency Performance
dependencies
| where timestamp > ago(24h)
| summarize 
    count(),
    avg(duration),
    countif(success == false) as failures
    by target, type
| extend failureRate = todouble(failures) / count_ * 100
| order by failureRate desc

// 4. Exception Trends
exceptions
| where timestamp > ago(7d)
| summarize count() by bin(timestamp, 1h), type
| render timechart

// 5. User Sessions Analysis
pageViews
| where timestamp > ago(24h)
| summarize pageViews = count(), sessions = dcount(session_Id) by bin(timestamp, 1h)
| render timechart

// 6. Custom Events Funnel
customEvents
| where timestamp > ago(7d)
| where name in ('UserSignUp', 'ProfileComplete', 'FirstPurchase')
| summarize count() by name
| order by count_ desc

// 7. Availability Results
availabilityResults
| where timestamp > ago(24h)
| summarize 
    success = countif(success == true),
    failed = countif(success == false),
    availability = todouble(countif(success == true)) / count() * 100
    by name, location
| order by availability asc

// 8. Performance Percentiles Over Time
requests
| where timestamp > ago(24h)
| summarize 
    p50 = percentile(duration, 50),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99)
    by bin(timestamp, 1h)
| render timechart

// 9. Error Rate by Deployment
requests
| where timestamp > ago(7d)
| extend version = tostring(customDimensions.version)
| summarize 
    total = count(),
    errors = countif(success == false)
    by version
| extend errorRate = todouble(errors) / total * 100

// 10. Distributed Tracing - Find Slow Operations
requests
| where timestamp > ago(1h)
| where duration > 5000 // > 5 seconds
| project operation_Id, name, duration, timestamp
| join kind=inner (
    dependencies
    | where timestamp > ago(1h)
) on operation_Id
| summarize 
    requestDuration = max(duration),
    dependencyCount = count(),
    slowestDependency = max(duration1),
    dependencies = make_list(pack('name', name1, 'duration', duration1, 'type', type))
    by operation_Id, name

// 11. Resource Consumption
performanceCounters
| where timestamp > ago(1h)
| where name in ('\\Process(??APP_WIN32_PROC??)\\% Processor Time', 
                  '\\Process(??APP_WIN32_PROC??)\\Private Bytes')
| summarize avg(value) by name, bin(timestamp, 5m)
| render timechart
```

### 5. Custom Metrics with Azure Monitor

```typescript
// Custom metrics using Azure Monitor SDK
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { AzureMonitorMetricExporter } from '@azure/monitor-opentelemetry-exporter';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Initialize OpenTelemetry Metrics
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'my-api',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
});

const exporter = new AzureMonitorMetricExporter({
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
});

const meterProvider = new MeterProvider({
  resource,
});

meterProvider.addMetricReader(
  new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 60000, // Export every minute
  })
);

const meter = meterProvider.getMeter('my-api');

// Define custom metrics
const httpRequestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

const httpRequestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'HTTP request duration in milliseconds',
});

const activeConnections = meter.createUpDownCounter('active_connections', {
  description: 'Number of active connections',
});

const queueLength = meter.createObservableGauge('queue_length', {
  description: 'Current queue length',
});

// Track queue length asynchronously
queueLength.addCallback((observableResult) => {
  observableResult.observe(getQueueLength(), { queue: 'orders' });
});

// Middleware to record metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  activeConnections.add(1);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const labels = {
      method: req.method,
      route: req.route?.path || 'unknown',
      status: res.statusCode.toString(),
    };

    httpRequestCounter.add(1, labels);
    httpRequestDuration.record(duration, labels);
    activeConnections.add(-1);
  });

  next();
}

// Business metrics
class BusinessMetrics {
  private orderCounter = meter.createCounter('orders_total');
  private orderValue = meter.createHistogram('order_value_usd');
  private paymentDuration = meter.createHistogram('payment_processing_ms');

  trackOrder(value: number, paymentMethod: string): void {
    this.orderCounter.add(1, { payment_method: paymentMethod });
    this.orderValue.record(value, { payment_method: paymentMethod });
  }

  trackPaymentProcessing(durationMs: number, success: boolean): void {
    this.paymentDuration.record(durationMs, { success: String(success) });
  }
}

export const businessMetrics = new BusinessMetrics();
```

### 6. Bicep Templates

```bicep
@description('Log Analytics workspace name')
param workspaceName string

@description('Application Insights name')
param appInsightsName string

@description('Location')
param location string = resourceGroup().location

@description('Environment')
param environment string = 'production'

@description('Retention in days')
param retentionInDays int = 90

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: workspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: 10 // Daily cap
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    RetentionInDays: retentionInDays
    DisableIpMasking: false
    SamplingPercentage: environment == 'production' ? 100 : 10
  }
}

// Alert Rules

// High Error Rate Alert
resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-high-error-rate-${environment}'
  location: 'global'
  properties: {
    description: 'Alert when error rate exceeds 5%'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighErrorRate'
          metricName: 'requests/failed'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 5
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
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

// Response Time Alert
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-slow-response-${environment}'
  location: 'global'
  properties: {
    description: 'Alert when response time exceeds 3 seconds'
    severity: 3
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'SlowResponse'
          metricName: 'requests/duration'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 3000
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
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

// Availability Alert (for URL ping tests)
resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-availability-${environment}'
  location: 'global'
  properties: {
    description: 'Alert when availability drops below 99%'
    severity: 1
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'LowAvailability'
          metricName: 'availabilityResults/availabilityPercentage'
          metricNamespace: 'microsoft.insights/components'
          operator: 'LessThan'
          threshold: 99
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
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

// Log-based Alert (using KQL)
resource exceptionAlert 'Microsoft.Insights/scheduledQueryRules@2022-06-15' = {
  name: 'alert-exceptions-${environment}'
  location: location
  properties: {
    description: 'Alert when exception count spikes'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [logAnalytics.id]
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
            exceptions
            | where timestamp > ago(15m)
            | summarize ExceptionCount = count() by type
            | where ExceptionCount > 10
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [actionGroup.id]
    }
  }
}

// Action Group
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-${environment}'
  location: 'global'
  properties: {
    groupShortName: 'alerts'
    enabled: true
    emailReceivers: [
      {
        name: 'ops-team'
        emailAddress: 'ops@example.com'
        useCommonAlertSchema: true
      }
    ]
    webhookReceivers: [
      {
        name: 'slack-webhook'
        serviceUri: 'https://hooks.slack.com/services/xxx/yyy/zzz'
        useCommonAlertSchema: true
      }
    ]
  }
}

// Availability Test (URL Ping)
resource availabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: 'webtest-${appInsightsName}'
  location: location
  tags: {
    'hidden-link:${appInsights.id}': 'Resource'
  }
  properties: {
    SyntheticMonitorId: 'webtest-${appInsightsName}'
    Name: 'Health Check'
    Description: 'Ping test for health endpoint'
    Enabled: true
    Frequency: 300 // Every 5 minutes
    Timeout: 120
    Kind: 'ping'
    RetryEnabled: true
    Locations: [
      { Id: 'us-ca-sjc-azr' } // West US
      { Id: 'emea-nl-ams-azr' } // West Europe
      { Id: 'apac-sg-sin-azr' } // Southeast Asia
    ]
    Configuration: {
      WebTest: '''
        <WebTest Name="Health Check" Enabled="True" Timeout="120" 
                 xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
          <Items>
            <Request Method="GET" Version="1.1" 
                     Url="https://api.example.com/health" 
                     ExpectedHttpStatusCode="200" />
          </Items>
        </WebTest>
      '''
    }
  }
}

// Workbook for Dashboard
resource workbook 'Microsoft.Insights/workbooks@2022-04-01' = {
  name: guid('workbook', resourceGroup().id, appInsightsName)
  location: location
  kind: 'shared'
  properties: {
    displayName: 'Application Dashboard'
    serializedData: '''
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
              "query": "requests | summarize count() by bin(timestamp, 1h) | render timechart",
              "size": 0,
              "title": "Request Volume"
            }
          }
        ]
      }
    '''
    category: 'workbook'
    sourceId: appInsights.id
  }
}

output appInsightsConnectionString string = appInsights.properties.ConnectionString
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output logAnalyticsWorkspaceId string = logAnalytics.id
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @azure-architect | Monitoring requirements |
| @backend-specialist | Application telemetry needed |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @bicep-specialist | Deploy monitoring infrastructure |
| @devops-specialist | Alerting pipeline integration |

---

## 📚 Related Skills

- [azure-monitoring-patterns.skill.md](../skills/azure-monitoring-patterns.skill.md)

---

## 🏷️ Tags

`application-insights` `log-analytics` `kql` `alerts` `metrics` `distributed-tracing` `azure`
