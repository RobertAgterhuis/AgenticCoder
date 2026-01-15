# Monitoring & Alerts Specification

**Version**: 1.0  
**Date**: January 13, 2026

---

## Overview

Het Monitoring & Alerts System volgt de gezondheid van het Self-Learning systeem en genereert waarschuwingen bij problemen.

---

## Metrics Tracked

```typescript
interface SystemMetrics {
  timestamp: Date;
  
  learning: {
    changesApplied: number;
    changesSuccessful: number;
    changesRolledBack: number;
    changesFailed: number;
    successRate: number;
  };
  
  confidence: {
    averageConfidence: number;
    highConfidenceCount: number;
    lowConfidenceCount: number;
    accuracyRate: number;
  };
  
  fixes: {
    errorsResolved: number;
    newErrorsIntroduced: number;
    fixEffectiveness: number;
  };
  
  system: {
    errorRate: number;
    errorRateTrend: 'up' | 'down' | 'stable';
    errorRateChange: number;
    cpuUsage: number;
    memoryUsage: number;
    storageUsage: number;
  };
  
  performance: {
    averageAnalysisTime: number;
    averageValidationTime: number;
    averageApplyTime: number;
    p99Latency: number;
  };
}
```

---

## Metrics Collector

```typescript
class MetricsCollector {
  private metrics: SystemMetrics[] = [];
  
  async collectMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      learning: await this.collectLearningMetrics(),
      confidence: await this.collectConfidenceMetrics(),
      fixes: await this.collectFixMetrics(),
      system: await this.collectSystemMetrics(),
      performance: await this.collectPerformanceMetrics()
    };
    
    this.metrics.push(metrics);
    
    // Keep only last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneDayAgo);
    
    return metrics;
  }
  
  private async collectLearningMetrics(): Promise<any> {
    return {
      changesApplied: 25,
      changesSuccessful: 24,
      changesRolledBack: 1,
      changesFailed: 0,
      successRate: 0.96
    };
  }
  
  private async collectConfidenceMetrics(): Promise<any> {
    return {
      averageConfidence: 0.82,
      highConfidenceCount: 20,
      lowConfidenceCount: 5,
      accuracyRate: 0.95
    };
  }
  
  private async collectFixMetrics(): Promise<any> {
    return {
      errorsResolved: 45,
      newErrorsIntroduced: 1,
      fixEffectiveness: 0.98
    };
  }
  
  private async collectSystemMetrics(): Promise<any> {
    return {
      errorRate: 0.02,
      errorRateTrend: 'down',
      errorRateChange: -0.05,
      cpuUsage: 35,
      memoryUsage: 250,
      storageUsage: 5120
    };
  }
  
  private async collectPerformanceMetrics(): Promise<any> {
    return {
      averageAnalysisTime: 150,
      averageValidationTime: 800,
      averageApplyTime: 250,
      p99Latency: 2500
    };
  }
  
  getMetricsTrend(hours: number): SystemMetrics[] {
    const timeAgo = Date.now() - hours * 60 * 60 * 1000;
    return this.metrics.filter(m => m.timestamp.getTime() > timeAgo);
  }
}
```

---

## Alert Manager

```typescript
interface Alert {
  alertId: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  action?: string;
}

class AlertManager {
  private collector = new MetricsCollector();
  
  async evaluateMetrics(): Promise<Alert[]> {
    const metrics = await this.collector.collectMetrics();
    const alerts: Alert[] = [];
    
    // Check success rate
    if (metrics.learning.successRate < 0.90) {
      alerts.push({
        alertId: generateId(),
        timestamp: new Date(),
        severity: 'warning',
        title: 'Low Success Rate',
        message: `Success rate is ${(metrics.learning.successRate * 100).toFixed(1)}%, expected >= 90%`,
        metric: 'learning.successRate',
        currentValue: metrics.learning.successRate,
        threshold: 0.90,
        action: 'Review failed changes'
      });
    }
    
    // Check accuracy
    if (metrics.confidence.accuracyRate < 0.85) {
      alerts.push({
        alertId: generateId(),
        timestamp: new Date(),
        severity: 'warning',
        title: 'Low Confidence Accuracy',
        message: `Accuracy is ${(metrics.confidence.accuracyRate * 100).toFixed(1)}%, expected >= 85%`,
        metric: 'confidence.accuracyRate',
        currentValue: metrics.confidence.accuracyRate,
        threshold: 0.85,
        action: 'Retrain confidence model'
      });
    }
    
    // Check error rate increase
    if (metrics.system.errorRateTrend === 'up') {
      alerts.push({
        alertId: generateId(),
        timestamp: new Date(),
        severity: 'critical',
        title: 'Error Rate Increasing',
        message: `Error rate trending upward: ${(metrics.system.errorRateChange * 100).toFixed(1)}% change`,
        metric: 'system.errorRate',
        currentValue: metrics.system.errorRate,
        threshold: 0.01,
        action: 'Investigate recent changes'
      });
    }
    
    // Check rollback rate
    const rollbackRate = metrics.learning.changesRolledBack / metrics.learning.changesApplied;
    if (rollbackRate > 0.05) {
      alerts.push({
        alertId: generateId(),
        timestamp: new Date(),
        severity: 'warning',
        title: 'High Rollback Rate',
        message: `Rollback rate is ${(rollbackRate * 100).toFixed(1)}%, expected < 5%`,
        metric: 'learning.rollbackRate',
        currentValue: rollbackRate,
        threshold: 0.05,
        action: 'Review rollback triggers'
      });
    }
    
    // Check resource usage
    if (metrics.system.memoryUsage > 500) {
      alerts.push({
        alertId: generateId(),
        timestamp: new Date(),
        severity: 'warning',
        title: 'High Memory Usage',
        message: `Memory usage is ${metrics.system.memoryUsage}MB, expected < 500MB`,
        metric: 'system.memoryUsage',
        currentValue: metrics.system.memoryUsage,
        threshold: 500,
        action: 'Cleanup old backups'
      });
    }
    
    return alerts;
  }
  
  async notifyAlerts(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      console.log(`[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`);
      
      // Could send to monitoring system, email, Slack, etc.
      if (alert.severity === 'critical') {
        await this.escalateAlert(alert);
      }
    }
  }
  
  private async escalateAlert(alert: Alert): Promise<void> {
    // Send critical alert to ops team
  }
}
```

---

## Dashboard

```typescript
class Dashboard {
  private collector = new MetricsCollector();
  private alertManager = new AlertManager();
  
  async generateDashboard(): Promise<DashboardData> {
    const currentMetrics = await this.collector.collectMetrics();
    const alerts = await this.alertManager.evaluateMetrics();
    const trend = this.collector.getMetricsTrend(24);
    
    return {
      currentMetrics,
      alerts,
      trend,
      summary: {
        status: alerts.filter(a => a.severity === 'critical').length === 0 ? 'healthy' : 'degraded',
        lastUpdated: new Date(),
        uptime: this.calculateUptime()
      }
    };
  }
  
  private calculateUptime(): number {
    return 99.95;
  }
}

interface DashboardData {
  currentMetrics: SystemMetrics;
  alerts: Alert[];
  trend: SystemMetrics[];
  summary: {
    status: 'healthy' | 'degraded' | 'critical';
    lastUpdated: Date;
    uptime: number;
  };
}
```

---

**Version**: 1.0  
**Status**: Ready for Implementation
