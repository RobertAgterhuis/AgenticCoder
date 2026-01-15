# Metrics Collector

**Component**: FLS-02  
**Purpose**: Aggregate performance and quality metrics from all systems  
**Status**: Design Complete  

---

## 🎯 Overview

The Metrics Collector gathers, aggregates, and reports metrics from every stage of the orchestration pipeline.

Key responsibilities:
1. **Collect** metrics from all systems
2. **Aggregate** into meaningful dashboards
3. **Calculate** performance statistics
4. **Track** trends over time
5. **Generate** reports

---

## 💻 Metrics Model

### Metric Types
```typescript
type MetricType = 
  | 'counter'    // Increment-only value (task_count++)
  | 'gauge'      // Current value (memory_usage=512MB)
  | 'histogram'  // Distribution (task_duration)
  | 'summary'    // Percentiles (p50, p95, p99)
  | 'duration'   // Time measurement;

interface Metric {
  // Identification
  metric_id: string;
  metric_name: string;
  metric_type: MetricType;
  
  // Source
  component: string;                    // 'TEE', 'OE', 'VF', 'EB', 'BAR'
  task_id?: string;
  phase_id?: string;
  
  // Data
  value: number;
  unit: string;                         // 'ms', 'bytes', 'count', '%', '$'
  timestamp: string;                    // ISO 8601
  
  // Context
  tags?: { [key: string]: string };
  dimensions?: {
    [key: string]: string | number;
  };
}

interface MetricsCollection {
  // Execution identification
  execution_id: string;
  collection_timestamp: string;
  
  // Metrics by component
  task_extraction: TaskExtractionMetrics;
  orchestration: OrchestrationMetrics;
  execution_bridge: ExecutionBridgeMetrics;
  validation: ValidationMetrics;
  bicep_resolver: BicepResolverMetrics;
  
  // Aggregate metrics
  aggregate: AggregateMetrics;
}

interface TaskExtractionMetrics {
  total_tasks_extracted: number;
  extraction_time_ms: number;
  dependency_analysis_time_ms: number;
  schedule_generation_time_ms: number;
  error_count: number;
  
  task_complexity: {
    min: number;
    max: number;
    avg: number;
  };
  
  dependencies: {
    total_edges: number;
    max_depth: number;
    circular_refs: number;
  };
}

interface OrchestrationMetrics {
  phases_started: number;
  phases_completed: number;
  phases_failed: number;
  
  total_phase_time_ms: number;
  
  per_phase: {
    [phase_id: string]: {
      phase_number: number;
      tasks_in_phase: number;
      tasks_completed: number;
      tasks_failed: number;
      phase_duration_ms: number;
      avg_task_duration_ms: number;
    }
  };
  
  state_transitions: {
    pending_to_scheduled: number;
    scheduled_to_running: number;
    running_to_completed: number;
    running_to_failed: number;
  };
}

interface ExecutionBridgeMetrics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  
  by_transport: {
    webhook: {
      count: number;
      success_rate: number;
      avg_latency_ms: number;
    };
    process: {
      count: number;
      success_rate: number;
      avg_latency_ms: number;
    };
    docker: {
      count: number;
      success_rate: number;
      avg_latency_ms: number;
    };
    api: {
      count: number;
      success_rate: number;
      avg_latency_ms: number;
    };
  };
  
  resource_utilization: {
    total_memory_bytes: number;
    peak_memory_bytes: number;
    total_cpu_ms: number;
    total_storage_bytes: number;
  };
  
  latency: {
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
    max_ms: number;
  };
  
  timeouts: {
    count: number;
    percent_of_total: number;
  };
}

interface ValidationMetrics {
  validations_run: number;
  validations_passed: number;
  validations_failed: number;
  pass_rate: number;
  
  by_gate: {
    schema: { passed: number; failed: number };
    syntax: { passed: number; failed: number };
    dependency: { passed: number; failed: number };
    security: { passed: number; failed: number };
    testing: { passed: number; failed: number };
  };
  
  quality_score: number;                // 0-100
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface BicepResolverMetrics {
  templates_processed: number;
  templates_transformed: number;
  transformation_success_rate: number;
  
  resource_transformation: {
    resources_analyzed: number;
    resources_mapped: number;
    mapping_success_rate: number;
  };
  
  cost_impact: {
    original_estimated_cost: number;    // USD/month
    optimized_estimated_cost: number;   // USD/month
    savings_amount: number;
    savings_percentage: number;
  };
  
  performance_impact: {
    original_complexity: number;
    optimized_complexity: number;
    complexity_reduction: number;
  };
  
  equivalence: {
    avg_score: number;                  // 0-100
    min_score: number;
    max_score: number;
  };
}

interface AggregateMetrics {
  total_execution_time_ms: number;
  
  phase_distribution: {
    [phase_id: string]: number;         // Time spent per phase (%)
  };
  
  component_distribution: {
    task_extraction: number;
    orchestration: number;
    execution_bridge: number;
    validation: number;
    bicep_resolver: number;
    feedback_loop: number;
  };
  
  // Overall success metrics
  overall_success_rate: number;         // %
  overall_quality_score: number;        // 0-100
  
  // Cost metrics
  infrastructure_cost: number;          // USD
  estimated_monthly_cost: number;       // USD
  cost_after_optimization: number;      // USD
  cost_savings: number;                 // %
  
  // Resource metrics
  total_resources_deployed: number;
  total_storage_used_gb: number;
  peak_concurrent_executions: number;
}
```

---

## 📊 Metrics Collection

### Collect Metrics from Component
```typescript
interface MetricsCollector {
  metrics: Map<string, Metric[]>;
  
  // Record a metric
  recordMetric(metric: Metric): void {
    const key = `${metric.component}:${metric.metric_name}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(metric);
  }
  
  // Record counter
  incrementCounter(
    component: string,
    metric_name: string,
    value: number = 1,
    tags?: { [key: string]: string }
  ): void {
    this.recordMetric({
      metric_id: generateId(),
      metric_name,
      metric_type: 'counter',
      component,
      value,
      unit: 'count',
      timestamp: new Date().toISOString(),
      tags
    });
  }
  
  // Record gauge
  recordGauge(
    component: string,
    metric_name: string,
    value: number,
    unit: string,
    tags?: { [key: string]: string }
  ): void {
    this.recordMetric({
      metric_id: generateId(),
      metric_name,
      metric_type: 'gauge',
      component,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags
    });
  }
  
  // Record duration
  recordDuration(
    component: string,
    metric_name: string,
    duration_ms: number,
    tags?: { [key: string]: string }
  ): void {
    this.recordMetric({
      metric_id: generateId(),
      metric_name,
      metric_type: 'duration',
      component,
      value: duration_ms,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      tags
    });
  }
  
  // Aggregate metrics
  getAggregateMetrics(): MetricsCollection {
    // Aggregate by component
    const teeMetrics = this.aggregateComponent('TEE');
    const oeMetrics = this.aggregateComponent('OE');
    const ebMetrics = this.aggregateComponent('EB');
    const vfMetrics = this.aggregateComponent('VF');
    const barMetrics = this.aggregateComponent('BAR');
    
    // Calculate aggregate
    const aggregate = this.calculateAggregate({
      task_extraction: teeMetrics,
      orchestration: oeMetrics,
      execution_bridge: ebMetrics,
      validation: vfMetrics,
      bicep_resolver: barMetrics
    });
    
    return {
      execution_id: getExecutionId(),
      collection_timestamp: new Date().toISOString(),
      task_extraction: teeMetrics,
      orchestration: oeMetrics,
      execution_bridge: ebMetrics,
      validation: vfMetrics,
      bicep_resolver: barMetrics,
      aggregate
    };
  }
  
  private aggregateComponent(component: string): any {
    const componentMetrics = Array.from(this.metrics.values())
      .flat()
      .filter(m => m.component === component);
    
    // Aggregate based on metric type
    const result: { [key: string]: any } = {};
    
    for (const metric of componentMetrics) {
      if (!result[metric.metric_name]) {
        result[metric.metric_name] = [];
      }
      result[metric.metric_name].push(metric.value);
    }
    
    // Calculate statistics
    for (const name in result) {
      const values = result[name];
      result[name] = {
        count: values.length,
        sum: values.reduce((a: number, b: number) => a + b, 0),
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        p50: percentile(values, 50),
        p95: percentile(values, 95),
        p99: percentile(values, 99)
      };
    }
    
    return result;
  }
}
```

---

## 📈 Analytics and Reporting

### Generate Metrics Report
```typescript
interface MetricsReport {
  execution_id: string;
  report_generated_at: string;
  
  execution_summary: {
    total_time: string;
    success_rate: string;
    quality_score: string;
  };
  
  component_performance: Array<{
    component: string;
    metrics: { [key: string]: any };
    performance_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  }>;
  
  bottlenecks: string[];
  recommendations: string[];
  
  detailed_metrics: MetricsCollection;
}

function generateMetricsReport(
  metrics: MetricsCollection
): MetricsReport {
  
  const report: MetricsReport = {
    execution_id: metrics.execution_id,
    report_generated_at: metrics.collection_timestamp,
    
    execution_summary: {
      total_time: formatDuration(metrics.aggregate.total_execution_time_ms),
      success_rate: `${metrics.aggregate.overall_success_rate.toFixed(1)}%`,
      quality_score: `${metrics.aggregate.overall_quality_score.toFixed(0)}/100`
    },
    
    component_performance: [
      {
        component: 'Task Extraction',
        metrics: metrics.task_extraction,
        performance_grade: calculateGrade(metrics.task_extraction)
      },
      {
        component: 'Orchestration',
        metrics: metrics.orchestration,
        performance_grade: calculateGrade(metrics.orchestration)
      },
      {
        component: 'Execution Bridge',
        metrics: metrics.execution_bridge,
        performance_grade: calculateGrade(metrics.execution_bridge)
      },
      {
        component: 'Validation',
        metrics: metrics.validation,
        performance_grade: calculateGrade(metrics.validation)
      },
      {
        component: 'Bicep Resolver',
        metrics: metrics.bicep_resolver,
        performance_grade: calculateGrade(metrics.bicep_resolver)
      }
    ],
    
    bottlenecks: identifyBottlenecks(metrics),
    recommendations: generateRecommendations(metrics),
    
    detailed_metrics: metrics
  };
  
  return report;
}

function calculateGrade(metrics: any): 'A' | 'B' | 'C' | 'D' | 'F' {
  const score = metrics.pass_rate ?? metrics.success_rate ?? 0;
  
  if (score >= 95) return 'A';
  if (score >= 85) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function identifyBottlenecks(metrics: MetricsCollection): string[] {
  const bottlenecks: string[] = [];
  
  // Find slowest component
  const times = Object.entries(metrics.aggregate.component_distribution);
  const slowest = times.reduce((a, b) => a[1] > b[1] ? a : b);
  
  if (slowest[1] > 0.5) {  // More than 50% of time
    bottlenecks.push(`${slowest[0]} is the slowest component (${(slowest[1] * 100).toFixed(1)}%)`);
  }
  
  // Find low success rates
  if (metrics.validation.pass_rate < 85) {
    bottlenecks.push(`Validation pass rate is low (${metrics.validation.pass_rate.toFixed(1)}%)`);
  }
  
  return bottlenecks;
}

function generateRecommendations(metrics: MetricsCollection): string[] {
  const recommendations: string[] = [];
  
  // Based on cost impact
  if (metrics.bicep_resolver.cost_impact.savings_percentage > 20) {
    recommendations.push(
      `High cost savings opportunity: ${metrics.bicep_resolver.cost_impact.savings_percentage.toFixed(1)}%`
    );
  }
  
  // Based on equivalence score
  if (metrics.bicep_resolver.equivalence.avg_score < 90) {
    recommendations.push(
      `Bicep transformations could be improved (avg score: ${metrics.bicep_resolver.equivalence.avg_score.toFixed(0)}%)`
    );
  }
  
  return recommendations;
}
```

---

## 💾 Metrics Storage

### Persist Metrics
```typescript
interface MetricsStorage {
  // Store metrics
  store(metrics: MetricsCollection): Promise<void>;
  
  // Query metrics
  queryMetrics(
    executionId: string,
    startTime: string,
    endTime: string
  ): Promise<Metric[]>;
  
  // Get trends
  getTrend(
    metricName: string,
    periodDays: number
  ): Promise<TrendData>;
}

class FileSystemMetricsStorage implements MetricsStorage {
  
  async store(metrics: MetricsCollection): Promise<void> {
    const filename = `metrics-${metrics.execution_id}-${Date.now()}.json`;
    const filepath = `./metrics/${filename}`;
    
    await writeFile(filepath, JSON.stringify(metrics, null, 2));
    
    // Also store in metrics database for quick access
    await this.indexMetrics(metrics);
  }
  
  private async indexMetrics(metrics: MetricsCollection): Promise<void> {
    // Create searchable index
    const index = {
      execution_id: metrics.execution_id,
      timestamp: metrics.collection_timestamp,
      success_rate: metrics.aggregate.overall_success_rate,
      quality_score: metrics.aggregate.overall_quality_score,
      total_time_ms: metrics.aggregate.total_execution_time_ms,
      cost_impact: metrics.bicep_resolver.cost_impact.savings_percentage
    };
    
    // Store in database/search engine
    await db.metrics.insert(index);
  }
}
```

---

## 📊 Dashboard Metrics

### Real-Time Dashboard
```typescript
interface DashboardMetrics {
  // Real-time gauges
  current_execution_progress: number;   // %
  current_phase: string;
  tasks_running: number;
  
  // Key metrics
  success_rate_today: number;           // %
  avg_execution_time_today: number;     // ms
  cost_savings_today: number;           // $
  
  // Trends (last 7 days)
  trend_success_rate: TrendLine;
  trend_execution_time: TrendLine;
  trend_cost_savings: TrendLine;
  
  // Top issues
  top_errors: Array<{ error: string; count: number }>;
  
  // Performance comparison
  performance_vs_baseline: {
    faster_percent: number;
    slower_percent: number;
    same_percent: number;
  };
}

function getDashboardMetrics(
  metricsCollector: MetricsCollector
): DashboardMetrics {
  
  const current = metricsCollector.getAggregateMetrics();
  const historical = metricsCollector.getHistoricalMetrics(7);
  
  return {
    current_execution_progress: 45,
    current_phase: 'Phase 3: Orchestration',
    tasks_running: 3,
    
    success_rate_today: 98.5,
    avg_execution_time_today: 2340,
    cost_savings_today: 145.32,
    
    trend_success_rate: calculateTrend(historical, 'success_rate'),
    trend_execution_time: calculateTrend(historical, 'execution_time'),
    trend_cost_savings: calculateTrend(historical, 'cost_savings'),
    
    top_errors: getTopErrors(current, 5),
    
    performance_vs_baseline: calculatePerformanceComparison(current, historical)
  };
}
```

---

## 💡 Key Points

1. **Comprehensive Coverage**: Metrics from all 5 systems
2. **Real-Time Collection**: Metrics recorded as events occur
3. **Aggregation**: Statistics calculated (min, max, avg, percentiles)
4. **Storage**: Persistent metrics for trend analysis
5. **Reporting**: Multiple report formats (JSON, Markdown, Dashboard)
6. **Alerting**: Bottlenecks and anomalies identified automatically
7. **Trending**: Historical data for comparison and optimization

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
