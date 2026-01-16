/**
 * MetricsCollector (FL-02)
 * 
 * Aggregate performance and quality metrics from all pipeline stages.
 * Provides dashboards, statistics, and trend tracking.
 * 
 * NOTE: This component UNBLOCKS OrchestrationEngine/05_monitoring
 * 
 * Responsibilities:
 * - Collect metrics from all systems
 * - Aggregate into meaningful dashboards
 * - Calculate performance statistics
 * - Track trends over time
 * - Generate reports
 */

import { EventEmitter } from 'events';

// Metric types
export const METRIC_TYPES = {
  COUNTER: 'counter',       // Increment-only (e.g., task_count++)
  GAUGE: 'gauge',           // Current value (e.g., memory_usage=512MB)
  HISTOGRAM: 'histogram',   // Distribution (e.g., task_duration)
  SUMMARY: 'summary',       // Percentiles (p50, p95, p99)
  DURATION: 'duration'      // Time measurement
};

// Components that emit metrics
export const COMPONENTS = {
  TASK_EXTRACTION: 'TEE',
  ORCHESTRATION: 'OE',
  VALIDATION: 'VF',
  EXECUTION_BRIDGE: 'EB',
  BICEP_RESOLVER: 'BAR',
  FEEDBACK_LOOP: 'FL',
  SELF_LEARNING: 'SL'
};

export class MetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.metrics = new Map();           // metric_id -> Metric
    this.collections = new Map();       // execution_id -> MetricsCollection
    this.histogramBuckets = options.histogramBuckets || [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    this.summaryPercentiles = options.summaryPercentiles || [0.5, 0.9, 0.95, 0.99];
    this.retentionPeriodMs = options.retentionPeriodMs || 24 * 60 * 60 * 1000; // 24 hours
    this.aggregationIntervalMs = options.aggregationIntervalMs || 60000; // 1 minute
    this.intervalHandle = null;
  }

  /**
   * Initialize metrics collection for an execution
   */
  initializeCollection(executionId) {
    const collection = {
      execution_id: executionId,
      collection_timestamp: new Date().toISOString(),
      started_at: new Date().toISOString(),
      
      // Component metrics
      task_extraction: this._createTaskExtractionMetrics(),
      orchestration: this._createOrchestrationMetrics(),
      execution_bridge: this._createExecutionBridgeMetrics(),
      validation: this._createValidationMetrics(),
      bicep_resolver: this._createBicepResolverMetrics(),
      
      // Aggregate metrics
      aggregate: this._createAggregateMetrics(),
      
      // Raw metrics storage
      raw_metrics: []
    };
    
    this.collections.set(executionId, collection);
    this.emit('collection-initialized', { execution_id: executionId });
    return collection;
  }

  /**
   * Record a metric value
   */
  record(metricName, value, options = {}) {
    const {
      type = METRIC_TYPES.GAUGE,
      component = 'unknown',
      unit = '',
      taskId = null,
      phaseId = null,
      executionId = null,
      tags = {},
      dimensions = {}
    } = options;

    const metric = {
      metric_id: `${component}_${metricName}_${Date.now()}`,
      metric_name: metricName,
      metric_type: type,
      component,
      task_id: taskId,
      phase_id: phaseId,
      execution_id: executionId,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
      dimensions
    };

    this.metrics.set(metric.metric_id, metric);

    // Add to collection if execution_id is provided
    if (executionId) {
      const collection = this.collections.get(executionId);
      if (collection) {
        collection.raw_metrics.push(metric);
        this._updateCollectionMetrics(collection, metric);
      }
    }

    this.emit('metric-recorded', metric);
    return metric;
  }

  /**
   * Increment a counter metric
   */
  increment(metricName, options = {}) {
    const key = this._getCounterKey(metricName, options);
    const existingValue = this._getCounterValue(key);
    return this.record(metricName, existingValue + 1, {
      ...options,
      type: METRIC_TYPES.COUNTER
    });
  }

  /**
   * Record a duration metric
   */
  recordDuration(metricName, durationMs, options = {}) {
    return this.record(metricName, durationMs, {
      ...options,
      type: METRIC_TYPES.DURATION,
      unit: 'ms'
    });
  }

  /**
   * Record a histogram value
   */
  recordHistogram(metricName, value, options = {}) {
    return this.record(metricName, value, {
      ...options,
      type: METRIC_TYPES.HISTOGRAM
    });
  }

  /**
   * Record task extraction metrics
   */
  recordTaskExtraction(executionId, metrics) {
    const collection = this.collections.get(executionId);
    if (!collection) return;

    collection.task_extraction = {
      ...collection.task_extraction,
      ...metrics,
      recorded_at: new Date().toISOString()
    };

    this.emit('task-extraction-metrics', { execution_id: executionId, metrics });
  }

  /**
   * Record orchestration metrics
   */
  recordOrchestration(executionId, metrics) {
    const collection = this.collections.get(executionId);
    if (!collection) return;

    // Merge per-phase metrics
    if (metrics.phase) {
      const phaseId = metrics.phase.phase_id;
      collection.orchestration.per_phase[phaseId] = {
        ...collection.orchestration.per_phase[phaseId],
        ...metrics.phase
      };
      delete metrics.phase;
    }

    collection.orchestration = {
      ...collection.orchestration,
      ...metrics,
      recorded_at: new Date().toISOString()
    };

    this.emit('orchestration-metrics', { execution_id: executionId, metrics });
  }

  /**
   * Record execution bridge metrics
   */
  recordExecutionBridge(executionId, metrics) {
    const collection = this.collections.get(executionId);
    if (!collection) return;

    // Update totals
    collection.execution_bridge.total_executions++;
    
    if (metrics.success) {
      collection.execution_bridge.successful_executions++;
    } else {
      collection.execution_bridge.failed_executions++;
    }

    // Update by transport
    const transport = metrics.transport || 'process';
    if (!collection.execution_bridge.by_transport[transport]) {
      collection.execution_bridge.by_transport[transport] = {
        count: 0,
        success_count: 0,
        total_latency_ms: 0
      };
    }
    
    const transportMetrics = collection.execution_bridge.by_transport[transport];
    transportMetrics.count++;
    if (metrics.success) transportMetrics.success_count++;
    transportMetrics.total_latency_ms += metrics.latency_ms || 0;
    transportMetrics.success_rate = transportMetrics.success_count / transportMetrics.count;
    transportMetrics.avg_latency_ms = transportMetrics.total_latency_ms / transportMetrics.count;

    // Update success rate
    collection.execution_bridge.success_rate = 
      collection.execution_bridge.successful_executions / 
      collection.execution_bridge.total_executions;

    this.emit('execution-bridge-metrics', { execution_id: executionId, metrics });
  }

  /**
   * Record validation metrics
   */
  recordValidation(executionId, metrics) {
    const collection = this.collections.get(executionId);
    if (!collection) return;

    collection.validation = {
      ...collection.validation,
      ...metrics,
      recorded_at: new Date().toISOString()
    };

    // Update gate results
    if (metrics.gate) {
      collection.validation.gate_results[metrics.gate.name] = {
        passed: metrics.gate.passed,
        duration_ms: metrics.gate.duration_ms,
        issues_count: metrics.gate.issues_count || 0
      };
    }

    this.emit('validation-metrics', { execution_id: executionId, metrics });
  }

  /**
   * Record Bicep resolver metrics
   */
  recordBicepResolver(executionId, metrics) {
    const collection = this.collections.get(executionId);
    if (!collection) return;

    collection.bicep_resolver = {
      ...collection.bicep_resolver,
      ...metrics,
      recorded_at: new Date().toISOString()
    };

    this.emit('bicep-resolver-metrics', { execution_id: executionId, metrics });
  }

  /**
   * Finalize and calculate aggregates for an execution
   */
  finalizeCollection(executionId) {
    const collection = this.collections.get(executionId);
    if (!collection) return null;

    collection.collection_timestamp = new Date().toISOString();
    
    // Calculate aggregates
    collection.aggregate = this._calculateAggregates(collection);
    
    this.emit('collection-finalized', collection);
    return collection;
  }

  /**
   * Get metrics collection for an execution
   */
  getCollection(executionId) {
    return this.collections.get(executionId) || null;
  }

  /**
   * Get metrics by component
   */
  getMetricsByComponent(executionId, component) {
    const collection = this.collections.get(executionId);
    if (!collection) return null;

    switch (component) {
      case COMPONENTS.TASK_EXTRACTION:
        return collection.task_extraction;
      case COMPONENTS.ORCHESTRATION:
        return collection.orchestration;
      case COMPONENTS.EXECUTION_BRIDGE:
        return collection.execution_bridge;
      case COMPONENTS.VALIDATION:
        return collection.validation;
      case COMPONENTS.BICEP_RESOLVER:
        return collection.bicep_resolver;
      default:
        return null;
    }
  }

  /**
   * Calculate percentiles for a set of values
   */
  calculatePercentiles(values) {
    if (values.length === 0) return {};
    
    const sorted = [...values].sort((a, b) => a - b);
    const result = {};
    
    for (const p of this.summaryPercentiles) {
      const index = Math.ceil(p * sorted.length) - 1;
      result[`p${p * 100}`] = sorted[Math.max(0, index)];
    }
    
    return result;
  }

  /**
   * Calculate histogram buckets for a set of values
   */
  calculateHistogram(values) {
    const buckets = {};
    
    for (const bucket of this.histogramBuckets) {
      buckets[`le_${bucket}`] = values.filter(v => v <= bucket).length;
    }
    buckets['le_inf'] = values.length;
    
    return buckets;
  }

  /**
   * Get summary statistics for a metric
   */
  getSummary(metricName, executionId = null) {
    let metrics = Array.from(this.metrics.values())
      .filter(m => m.metric_name === metricName);
    
    if (executionId) {
      metrics = metrics.filter(m => m.execution_id === executionId);
    }
    
    const values = metrics.map(m => m.value);
    
    if (values.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, sum: 0, percentiles: {} };
    }
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      sum: values.reduce((a, b) => a + b, 0),
      percentiles: this.calculatePercentiles(values)
    };
  }

  /**
   * Generate a dashboard report
   */
  generateDashboard(executionId) {
    const collection = this.collections.get(executionId);
    if (!collection) return null;

    return {
      execution_id: executionId,
      generated_at: new Date().toISOString(),
      
      overview: {
        total_tasks: collection.aggregate.total_tasks,
        completed_tasks: collection.aggregate.completed_tasks,
        failed_tasks: collection.aggregate.failed_tasks,
        success_rate: collection.aggregate.success_rate,
        total_duration_ms: collection.aggregate.total_duration_ms,
        total_cost_estimate: collection.aggregate.total_cost_estimate
      },
      
      task_extraction: {
        tasks_extracted: collection.task_extraction.total_tasks_extracted,
        extraction_time_ms: collection.task_extraction.extraction_time_ms,
        error_count: collection.task_extraction.error_count
      },
      
      orchestration: {
        phases_completed: collection.orchestration.phases_completed,
        phases_failed: collection.orchestration.phases_failed,
        total_phase_time_ms: collection.orchestration.total_phase_time_ms
      },
      
      execution_bridge: {
        total_executions: collection.execution_bridge.total_executions,
        success_rate: collection.execution_bridge.success_rate,
        by_transport: collection.execution_bridge.by_transport
      },
      
      validation: {
        quality_score: collection.validation.quality_score,
        validations_passed: collection.validation.validations_passed,
        validations_failed: collection.validation.validations_failed
      },
      
      bicep_resolver: {
        resources_resolved: collection.bicep_resolver.resources_resolved,
        modules_used: collection.bicep_resolver.modules_used,
        resolution_time_ms: collection.bicep_resolver.resolution_time_ms
      }
    };
  }

  /**
   * Start periodic aggregation
   */
  startPeriodicAggregation() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
    
    this.intervalHandle = setInterval(() => {
      this._cleanupOldMetrics();
      this.emit('aggregation-tick');
    }, this.aggregationIntervalMs);
  }

  /**
   * Stop periodic aggregation
   */
  stopPeriodicAggregation() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(executionId = null) {
    const lines = [];
    let metrics = Array.from(this.metrics.values());
    
    if (executionId) {
      metrics = metrics.filter(m => m.execution_id === executionId);
    }
    
    const grouped = {};
    for (const metric of metrics) {
      if (!grouped[metric.metric_name]) {
        grouped[metric.metric_name] = [];
      }
      grouped[metric.metric_name].push(metric);
    }
    
    for (const [name, metricsForName] of Object.entries(grouped)) {
      const first = metricsForName[0];
      lines.push(`# TYPE ${name} ${first.metric_type}`);
      
      for (const m of metricsForName) {
        const labels = Object.entries(m.tags)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        lines.push(`${name}{${labels}} ${m.value}`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Export metrics as JSON
   */
  toJSON() {
    return {
      collections: Array.from(this.collections.values()),
      metrics_count: this.metrics.size
    };
  }

  // Private methods

  _createTaskExtractionMetrics() {
    return {
      total_tasks_extracted: 0,
      extraction_time_ms: 0,
      dependency_analysis_time_ms: 0,
      schedule_generation_time_ms: 0,
      error_count: 0,
      task_complexity: { min: 0, max: 0, avg: 0 },
      dependencies: { total_edges: 0, max_depth: 0, circular_refs: 0 }
    };
  }

  _createOrchestrationMetrics() {
    return {
      phases_started: 0,
      phases_completed: 0,
      phases_failed: 0,
      total_phase_time_ms: 0,
      per_phase: {},
      state_transitions: {
        pending_to_scheduled: 0,
        scheduled_to_running: 0,
        running_to_completed: 0,
        running_to_failed: 0
      }
    };
  }

  _createExecutionBridgeMetrics() {
    return {
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      success_rate: 0,
      by_transport: {},
      resource_utilization: {
        total_memory_bytes: 0,
        peak_memory_bytes: 0,
        total_cpu_ms: 0
      }
    };
  }

  _createValidationMetrics() {
    return {
      validations_run: 0,
      validations_passed: 0,
      validations_failed: 0,
      quality_score: 0,
      gate_results: {
        schema: { passed: false, duration_ms: 0 },
        syntax: { passed: false, duration_ms: 0 },
        dependency: { passed: false, duration_ms: 0 },
        security: { passed: false, duration_ms: 0 },
        testing: { passed: false, duration_ms: 0 }
      },
      issues: []
    };
  }

  _createBicepResolverMetrics() {
    return {
      resources_resolved: 0,
      modules_used: 0,
      resolution_time_ms: 0,
      cache_hits: 0,
      cache_misses: 0,
      avm_lookups: 0
    };
  }

  _createAggregateMetrics() {
    return {
      total_tasks: 0,
      completed_tasks: 0,
      failed_tasks: 0,
      success_rate: 0,
      total_duration_ms: 0,
      average_task_duration_ms: 0,
      total_cost_estimate: 0
    };
  }

  _updateCollectionMetrics(collection, metric) {
    // Auto-aggregate based on metric component
    switch (metric.component) {
      case COMPONENTS.TASK_EXTRACTION:
        // Handle specific task extraction metrics
        break;
      case COMPONENTS.ORCHESTRATION:
        // Handle orchestration metrics
        break;
      case COMPONENTS.EXECUTION_BRIDGE:
        // Handle execution bridge metrics
        break;
    }
  }

  _calculateAggregates(collection) {
    const eb = collection.execution_bridge;
    const orch = collection.orchestration;
    
    return {
      total_tasks: collection.task_extraction.total_tasks_extracted,
      completed_tasks: eb.successful_executions,
      failed_tasks: eb.failed_executions,
      success_rate: eb.success_rate,
      total_duration_ms: orch.total_phase_time_ms,
      average_task_duration_ms: eb.total_executions > 0
        ? orch.total_phase_time_ms / eb.total_executions
        : 0,
      total_cost_estimate: 0 // Would be calculated from cloud provider metrics
    };
  }

  _getCounterKey(metricName, options) {
    return `${options.component || 'unknown'}_${metricName}_${options.executionId || 'global'}`;
  }

  _getCounterValue(key) {
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.metric_type === METRIC_TYPES.COUNTER)
      .filter(m => `${m.component}_${m.metric_name}_${m.execution_id || 'global'}` === key);
    
    if (metrics.length === 0) return 0;
    return Math.max(...metrics.map(m => m.value));
  }

  _cleanupOldMetrics() {
    const cutoff = Date.now() - this.retentionPeriodMs;
    
    for (const [id, metric] of this.metrics) {
      if (new Date(metric.timestamp).getTime() < cutoff) {
        this.metrics.delete(id);
      }
    }
  }
}

export default MetricsCollector;
