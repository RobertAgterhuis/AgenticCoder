/**
 * Orchestration Monitoring (OE-05)
 * 
 * Real-time execution monitoring and reporting for the Orchestration Engine.
 * 
 * Components:
 * - OrchestrationMonitor: Main monitoring class, event collection
 * - DashboardGenerator: Text-based real-time dashboard
 * - AlertManager: Alert thresholds and notifications
 * - ReportGenerator: Status and completion reports
 * 
 * Integration:
 * - Attaches to WorkflowEngine for event capture
 * - Uses MetricsCollector (FL-02) for metric storage
 * - Provides dashboards, alerts, and reports
 * 
 * @module agents/core/orchestration
 */

// Main components
export {
  OrchestrationMonitor,
  ExecutionState,
  PhaseState,
  TaskState,
  EVENT_TYPES,
  EXECUTION_STATUS
} from './OrchestrationMonitor.js';

export {
  DashboardGenerator,
  THEMES as DASHBOARD_THEMES
} from './DashboardGenerator.js';

export {
  AlertManager,
  Alert,
  ALERT_LEVELS,
  ALERT_TYPES
} from './AlertManager.js';

export {
  ReportGenerator,
  REPORT_TYPES,
  REPORT_FORMATS
} from './ReportGenerator.js';

// =============================================================================
// Factory & Integration
// =============================================================================

/**
 * Create a fully configured monitoring system
 * 
 * @param {Object} options - Configuration options
 * @param {WorkflowEngine} options.workflowEngine - WorkflowEngine to monitor
 * @param {MetricsCollector} options.metricsCollector - MetricsCollector for storage
 * @param {Object} options.alertOptions - AlertManager options
 * @param {Object} options.dashboardOptions - DashboardGenerator options
 * @param {Object} options.reportOptions - ReportGenerator options
 * @returns {Object} Configured monitoring system
 */
export function createMonitoringSystem(options = {}) {
  const { 
    OrchestrationMonitor: Monitor 
  } = require('./OrchestrationMonitor.js');
  const { DashboardGenerator } = require('./DashboardGenerator.js');
  const { AlertManager } = require('./AlertManager.js');
  const { ReportGenerator } = require('./ReportGenerator.js');
  
  // Create components
  const monitor = new Monitor(options.monitorOptions);
  const dashboard = new DashboardGenerator(options.dashboardOptions);
  const alertManager = new AlertManager(options.alertOptions);
  const reportGenerator = new ReportGenerator(options.reportOptions);
  
  // Wire up monitor
  monitor.attachDashboardGenerator(dashboard);
  monitor.attachAlertManager(alertManager);
  monitor.attachReportGenerator(reportGenerator);
  
  // Attach to workflow engine if provided
  if (options.workflowEngine) {
    monitor.attachWorkflowEngine(options.workflowEngine);
  }
  
  // Attach metrics collector if provided
  if (options.metricsCollector) {
    monitor.attachMetricsCollector(options.metricsCollector);
  }
  
  return {
    monitor,
    dashboard,
    alertManager,
    reportGenerator,
    
    // Convenience methods
    
    /**
     * Start monitoring an execution
     */
    startExecution(executionId, config) {
      return monitor.startExecution(executionId, config);
    },
    
    /**
     * Get real-time dashboard
     */
    getDashboard(executionId) {
      return monitor.getDashboard(executionId);
    },
    
    /**
     * Get text dashboard
     */
    getDashboardText(executionId) {
      const state = monitor.getExecution(executionId);
      if (!state) return null;
      return dashboard.generate(state).text;
    },
    
    /**
     * Get status report
     */
    getStatusReport(executionId, format) {
      const state = monitor.getExecution(executionId);
      if (!state) return null;
      return reportGenerator.generateStatusReport(state, format);
    },
    
    /**
     * Get completion report
     */
    getCompletionReport(executionId, format) {
      const state = monitor.getExecution(executionId);
      if (!state) return null;
      return reportGenerator.generateCompletionReport(executionId, state, format);
    },
    
    /**
     * Get active alerts
     */
    getActiveAlerts(executionId) {
      return alertManager.getActiveAlerts(executionId);
    },
    
    /**
     * Get metrics
     */
    getMetrics(executionId) {
      return monitor.getExecutionMetrics(executionId);
    },
    
    /**
     * Get all statistics
     */
    getStats() {
      return {
        monitor: monitor.getStats(),
        alerts: alertManager.getStats()
      };
    }
  };
}

// Default export
import { OrchestrationMonitor } from './OrchestrationMonitor.js';
export default OrchestrationMonitor;
