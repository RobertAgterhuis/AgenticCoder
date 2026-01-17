/**
 * MonitoringGenerator - Azure Monitoring Generator
 * 
 * Generates Application Insights, Log Analytics, Alerts,
 * and diagnostic settings configurations.
 */

const BaseGenerator = require('./BaseGenerator');

class MonitoringGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'MonitoringGenerator',
      framework: 'azure-monitor',
      version: 'latest',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'azure/monitoring';
    this.supportedTypes = ['appInsights', 'alert', 'diagnostic', 'dashboard'];
  }

  /**
   * Generate Application Insights client code
   */
  async generateAppInsights(context) {
    const { 
      language = 'typescript',
      connectionString,
      enableAutoCollect = true,
      customMetrics = []
    } = context;
    
    const templateData = {
      connectionString,
      enableAutoCollect,
      customMetrics
    };
    
    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.generateTsAppInsights(templateData);
      case 'python':
        return this.generatePyAppInsights(templateData);
      case 'csharp':
        return this.generateCsAppInsights(templateData);
      default:
        return this.generateTsAppInsights(templateData);
    }
  }

  /**
   * Generate Alert Rule configuration
   */
  async generateAlert(context) {
    const { 
      name,
      type = 'metric',
      metric,
      threshold,
      operator = 'GreaterThan',
      severity = 2,
      actionGroups = [],
      targetResource,
      evaluationFrequency = 'PT5M',
      windowSize = 'PT15M'
    } = context;
    
    const templateData = {
      name: this.toKebabCase(name),
      type,
      metric,
      threshold,
      operator,
      severity,
      actionGroups,
      targetResource,
      evaluationFrequency,
      windowSize
    };
    
    return this.generateAlertBicep(templateData);
  }

  /**
   * Generate Diagnostic Settings configuration
   */
  async generateDiagnostic(context) {
    const { 
      name,
      targetResource,
      logAnalyticsWorkspaceId,
      storageAccountId,
      eventHubAuthorizationRuleId,
      logs = [],
      metrics = []
    } = context;
    
    const templateData = {
      name: this.toKebabCase(name),
      targetResource,
      logAnalyticsWorkspaceId,
      storageAccountId,
      eventHubAuthorizationRuleId,
      logs: this.buildLogSettings(logs),
      metrics: this.buildMetricSettings(metrics)
    };
    
    return this.generateDiagnosticBicep(templateData);
  }

  /**
   * Generate Azure Dashboard
   */
  async generateDashboard(context) {
    const { 
      name,
      tiles = [],
      location = 'eastus',
      tags = {}
    } = context;
    
    const templateData = {
      name: this.toKebabCase(name),
      tiles: this.buildDashboardTiles(tiles),
      location,
      tags
    };
    
    return this.generateDashboardJson(templateData);
  }

  // TypeScript/JavaScript generator
  generateTsAppInsights(data) {
    const lines = [];
    
    lines.push(`import * as appInsights from 'applicationinsights';`);
    lines.push('');
    lines.push('// Initialize Application Insights');
    lines.push("const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '';");
    lines.push('');
    lines.push('export function initializeAppInsights(): void {');
    lines.push('  if (!connectionString) {');
    lines.push("    console.warn('Application Insights connection string not configured');");
    lines.push('    return;');
    lines.push('  }');
    lines.push('');
    lines.push('  appInsights.setup(connectionString)');
    
    if (data.enableAutoCollect) {
      lines.push('    .setAutoCollectRequests(true)');
      lines.push('    .setAutoCollectPerformance(true, true)');
      lines.push('    .setAutoCollectExceptions(true)');
      lines.push('    .setAutoCollectDependencies(true)');
      lines.push('    .setAutoCollectConsole(true, true)');
      lines.push('    .setAutoCollectPreAggregatedMetrics(true)');
      lines.push('    .setSendLiveMetrics(true)');
    }
    
    lines.push('    .start();');
    lines.push('}');
    lines.push('');
    lines.push('export const telemetryClient = appInsights.defaultClient;');
    lines.push('');
    lines.push('// Custom tracking methods');
    lines.push('export class TelemetryService {');
    lines.push('  /**');
    lines.push('   * Track a custom event');
    lines.push('   */');
    lines.push('  trackEvent(name: string, properties?: Record<string, string>, measurements?: Record<string, number>): void {');
    lines.push('    telemetryClient?.trackEvent({ name, properties, measurements });');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Track a custom metric');
    lines.push('   */');
    lines.push('  trackMetric(name: string, value: number, properties?: Record<string, string>): void {');
    lines.push('    telemetryClient?.trackMetric({ name, value, properties });');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Track an exception');
    lines.push('   */');
    lines.push('  trackException(exception: Error, properties?: Record<string, string>): void {');
    lines.push('    telemetryClient?.trackException({ exception, properties });');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Track a trace message');
    lines.push('   */');
    lines.push('  trackTrace(message: string, severity?: number, properties?: Record<string, string>): void {');
    lines.push('    telemetryClient?.trackTrace({ message, severity, properties });');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Track a dependency call');
    lines.push('   */');
    lines.push('  trackDependency(');
    lines.push('    name: string,');
    lines.push('    data: string,');
    lines.push('    duration: number,');
    lines.push('    success: boolean,');
    lines.push('    dependencyTypeName?: string');
    lines.push('  ): void {');
    lines.push('    telemetryClient?.trackDependency({');
    lines.push('      name,');
    lines.push('      data,');
    lines.push('      duration,');
    lines.push('      success,');
    lines.push('      dependencyTypeName: dependencyTypeName || "HTTP",');
    lines.push('      target: name,');
    lines.push("      resultCode: success ? '200' : '500'");
    lines.push('    });');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Flush all pending telemetry');
    lines.push('   */');
    lines.push('  async flush(): Promise<void> {');
    lines.push('    return new Promise((resolve) => {');
    lines.push('      telemetryClient?.flush({');
    lines.push('        callback: () => resolve()');
    lines.push('      });');
    lines.push('    });');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('export const telemetryService = new TelemetryService();');
    
    return lines.join('\n');
  }

  // Python generator
  generatePyAppInsights(data) {
    const lines = [];
    
    lines.push('import os');
    lines.push('import logging');
    lines.push('from typing import Optional, Dict');
    lines.push('from opencensus.ext.azure.log_exporter import AzureLogHandler');
    lines.push('from opencensus.ext.azure import metrics_exporter');
    lines.push('from opencensus.ext.azure.trace_exporter import AzureExporter');
    lines.push('from opencensus.trace.samplers import ProbabilitySampler');
    lines.push('from opencensus.trace.tracer import Tracer');
    lines.push('');
    lines.push("CONNECTION_STRING = os.environ.get('APPLICATIONINSIGHTS_CONNECTION_STRING', '')");
    lines.push('');
    lines.push('# Configure logging');
    lines.push('logger = logging.getLogger(__name__)');
    lines.push('');
    lines.push('def initialize_app_insights() -> None:');
    lines.push('    """Initialize Application Insights"""');
    lines.push('    if not CONNECTION_STRING:');
    lines.push("        logger.warning('Application Insights connection string not configured')");
    lines.push('        return');
    lines.push('');
    lines.push('    # Add Azure log handler');
    lines.push('    handler = AzureLogHandler(connection_string=CONNECTION_STRING)');
    lines.push('    logger.addHandler(handler)');
    lines.push('    logger.setLevel(logging.INFO)');
    lines.push('');
    lines.push('');
    lines.push('class TelemetryService:');
    lines.push('    """Service for tracking telemetry to Application Insights"""');
    lines.push('');
    lines.push('    def __init__(self):');
    lines.push('        self.exporter = AzureExporter(connection_string=CONNECTION_STRING) if CONNECTION_STRING else None');
    lines.push('        self.tracer = Tracer(');
    lines.push('            exporter=self.exporter,');
    lines.push('            sampler=ProbabilitySampler(1.0)');
    lines.push('        ) if self.exporter else None');
    lines.push('');
    lines.push('    def track_event(self, name: str, properties: Optional[Dict[str, str]] = None) -> None:');
    lines.push('        """Track a custom event"""');
    lines.push("        logger.info(f'Event: {name}', extra={'custom_dimensions': properties or {}})");
    lines.push('');
    lines.push('    def track_exception(self, exception: Exception, properties: Optional[Dict[str, str]] = None) -> None:');
    lines.push('        """Track an exception"""');
    lines.push("        logger.exception(f'Exception: {exception}', extra={'custom_dimensions': properties or {}})");
    lines.push('');
    lines.push('    def track_trace(self, message: str, properties: Optional[Dict[str, str]] = None) -> None:');
    lines.push('        """Track a trace message"""');
    lines.push("        logger.info(message, extra={'custom_dimensions': properties or {}})");
    lines.push('');
    lines.push('');
    lines.push('telemetry_service = TelemetryService()');
    
    return lines.join('\n');
  }

  // C# generator
  generateCsAppInsights(data) {
    const lines = [];
    
    lines.push('using Microsoft.ApplicationInsights;');
    lines.push('using Microsoft.ApplicationInsights.DataContracts;');
    lines.push('using Microsoft.ApplicationInsights.Extensibility;');
    lines.push('');
    lines.push('namespace Services;');
    lines.push('');
    lines.push('public class TelemetryService');
    lines.push('{');
    lines.push('    private readonly TelemetryClient _telemetryClient;');
    lines.push('');
    lines.push('    public TelemetryService(TelemetryConfiguration configuration)');
    lines.push('    {');
    lines.push('        _telemetryClient = new TelemetryClient(configuration);');
    lines.push('    }');
    lines.push('');
    lines.push('    public void TrackEvent(string name, Dictionary<string, string>? properties = null)');
    lines.push('    {');
    lines.push('        _telemetryClient.TrackEvent(name, properties);');
    lines.push('    }');
    lines.push('');
    lines.push('    public void TrackMetric(string name, double value)');
    lines.push('    {');
    lines.push('        _telemetryClient.TrackMetric(name, value);');
    lines.push('    }');
    lines.push('');
    lines.push('    public void TrackException(Exception exception, Dictionary<string, string>? properties = null)');
    lines.push('    {');
    lines.push('        _telemetryClient.TrackException(exception, properties);');
    lines.push('    }');
    lines.push('');
    lines.push('    public void TrackDependency(string name, string data, DateTimeOffset startTime, TimeSpan duration, bool success)');
    lines.push('    {');
    lines.push('        _telemetryClient.TrackDependency("HTTP", name, data, startTime, duration, success);');
    lines.push('    }');
    lines.push('');
    lines.push('    public void Flush()');
    lines.push('    {');
    lines.push('        _telemetryClient.Flush();');
    lines.push('    }');
    lines.push('}');
    
    return lines.join('\n');
  }

  // Bicep generators
  generateAlertBicep(data) {
    const lines = [];
    
    lines.push('// Azure Metric Alert Rule');
    lines.push('// Generated by AgenticCoder');
    lines.push('');
    lines.push('@description(\'Name of the alert rule\')');
    lines.push(`param alertName string = '${data.name}'`);
    lines.push('');
    lines.push('@description(\'Target resource ID\')');
    lines.push('param targetResourceId string');
    lines.push('');
    lines.push('@description(\'Action group IDs\')');
    lines.push('param actionGroupIds array = []');
    lines.push('');
    
    lines.push('resource metricAlert \'Microsoft.Insights/metricAlerts@2018-03-01\' = {');
    lines.push('  name: alertName');
    lines.push("  location: 'global'");
    lines.push('  properties: {');
    lines.push('    description: \'Alert rule for ${data.metric}\'');
    lines.push(`    severity: ${data.severity}`);
    lines.push('    enabled: true');
    lines.push('    scopes: [');
    lines.push('      targetResourceId');
    lines.push('    ]');
    lines.push(`    evaluationFrequency: '${data.evaluationFrequency}'`);
    lines.push(`    windowSize: '${data.windowSize}'`);
    lines.push('    criteria: {');
    lines.push("      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'");
    lines.push('      allOf: [');
    lines.push('        {');
    lines.push("          name: 'Metric1'");
    lines.push(`          metricName: '${data.metric}'`);
    lines.push(`          operator: '${data.operator}'`);
    lines.push(`          threshold: ${data.threshold}`);
    lines.push("          timeAggregation: 'Average'");
    lines.push("          criterionType: 'StaticThresholdCriterion'");
    lines.push('        }');
    lines.push('      ]');
    lines.push('    }');
    lines.push('    actions: [for actionGroupId in actionGroupIds: {');
    lines.push('      actionGroupId: actionGroupId');
    lines.push('    }]');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('output alertId string = metricAlert.id');
    
    return lines.join('\n');
  }

  generateDiagnosticBicep(data) {
    const lines = [];
    
    lines.push('// Azure Diagnostic Settings');
    lines.push('// Generated by AgenticCoder');
    lines.push('');
    lines.push('@description(\'Name of the diagnostic setting\')');
    lines.push(`param diagnosticSettingName string = '${data.name}'`);
    lines.push('');
    
    if (data.logAnalyticsWorkspaceId) {
      lines.push('@description(\'Log Analytics workspace ID\')');
      lines.push('param logAnalyticsWorkspaceId string');
      lines.push('');
    }
    
    if (data.storageAccountId) {
      lines.push('@description(\'Storage account ID for archiving\')');
      lines.push('param storageAccountId string');
      lines.push('');
    }
    
    lines.push('resource diagnosticSetting \'Microsoft.Insights/diagnosticSettings@2021-05-01-preview\' = {');
    lines.push('  name: diagnosticSettingName');
    lines.push('  properties: {');
    
    if (data.logAnalyticsWorkspaceId) {
      lines.push('    workspaceId: logAnalyticsWorkspaceId');
    }
    
    if (data.storageAccountId) {
      lines.push('    storageAccountId: storageAccountId');
    }
    
    if (data.logs.length) {
      lines.push('    logs: [');
      for (const log of data.logs) {
        lines.push('      {');
        lines.push(`        category: '${log.category}'`);
        lines.push(`        enabled: ${log.enabled}`);
        if (log.retentionDays) {
          lines.push('        retentionPolicy: {');
          lines.push('          enabled: true');
          lines.push(`          days: ${log.retentionDays}`);
          lines.push('        }');
        }
        lines.push('      }');
      }
      lines.push('    ]');
    }
    
    if (data.metrics.length) {
      lines.push('    metrics: [');
      for (const metric of data.metrics) {
        lines.push('      {');
        lines.push(`        category: '${metric.category}'`);
        lines.push(`        enabled: ${metric.enabled}`);
        if (metric.retentionDays) {
          lines.push('        retentionPolicy: {');
          lines.push('          enabled: true');
          lines.push(`          days: ${metric.retentionDays}`);
          lines.push('        }');
        }
        lines.push('      }');
      }
      lines.push('    ]');
    }
    
    lines.push('  }');
    lines.push('}');
    
    return lines.join('\n');
  }

  generateDashboardJson(data) {
    const dashboard = {
      properties: {
        lenses: [{
          order: 0,
          parts: data.tiles.map((tile, index) => ({
            position: {
              x: tile.x || (index % 4) * 4,
              y: tile.y || Math.floor(index / 4) * 4,
              colSpan: tile.colSpan || 4,
              rowSpan: tile.rowSpan || 4
            },
            metadata: {
              type: 'Extension/HubsExtension/PartType/MonitorChartPart',
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: tile.metrics || [],
                      title: tile.title,
                      visualization: {
                        chartType: tile.chartType || 'Line'
                      }
                    }
                  }
                }
              }
            }
          }))
        }]
      },
      name: data.name,
      type: 'Microsoft.Portal/dashboards',
      location: data.location,
      tags: {
        'hidden-title': data.name,
        ...data.tags
      }
    };
    
    return JSON.stringify(dashboard, null, 2);
  }

  // Helper methods
  buildLogSettings(logs) {
    return logs.map(l => ({
      category: l.category || l,
      enabled: l.enabled !== false,
      retentionDays: l.retentionDays
    }));
  }

  buildMetricSettings(metrics) {
    return metrics.map(m => ({
      category: m.category || 'AllMetrics',
      enabled: m.enabled !== false,
      retentionDays: m.retentionDays
    }));
  }

  buildDashboardTiles(tiles) {
    return tiles.map(t => ({
      title: t.title,
      metrics: t.metrics,
      chartType: t.chartType || 'Line',
      x: t.x,
      y: t.y,
      colSpan: t.colSpan || 4,
      rowSpan: t.rowSpan || 4
    }));
  }
}

module.exports = MonitoringGenerator;
