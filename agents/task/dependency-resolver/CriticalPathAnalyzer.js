/**
 * CriticalPathAnalyzer.js
 * 
 * Analyzes the dependency graph to find the critical path - the longest
 * chain of dependent tasks that determines the minimum project duration.
 * 
 * @module task/dependency-resolver/CriticalPathAnalyzer
 */

import { EventEmitter } from 'events';

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Task status in critical path analysis
 */
export const TaskCriticality = {
  CRITICAL: 'critical',       // On critical path (slack = 0)
  NEAR_CRITICAL: 'near_critical', // Small slack (< 1 hour)
  NON_CRITICAL: 'non_critical'    // Has significant slack
};

// ============================================================================
// CriticalPathResult Class
// ============================================================================

/**
 * Represents the result of critical path analysis
 */
export class CriticalPathResult {
  constructor() {
    this.criticalPath = [];           // Task IDs on critical path
    this.criticalTasks = [];          // Full task info for critical tasks
    this.totalDuration = 0;           // Project duration in hours
    this.bottlenecks = [];            // Tasks that could delay project
    this.nearCriticalPaths = [];      // Paths with small slack
    this.taskTimings = new Map();     // All task timing info
    this.analysisTime = 0;
  }

  /**
   * Check if task is on critical path
   */
  isTaskCritical(taskId) {
    return this.criticalPath.includes(taskId);
  }

  /**
   * Get slack for a task
   */
  getTaskSlack(taskId) {
    const timing = this.taskTimings.get(taskId);
    return timing ? timing.slack : null;
  }

  /**
   * Serialize result
   */
  toJSON() {
    return {
      critical_path: {
        path: this.criticalPath,
        total_hours: this.totalDuration,
        estimated_days: Math.ceil(this.totalDuration / 8),
        task_count: this.criticalPath.length
      },
      bottleneck_tasks: this.bottlenecks,
      near_critical_paths: this.nearCriticalPaths,
      task_timings: Object.fromEntries(this.taskTimings),
      analysis_time_ms: this.analysisTime
    };
  }
}

// ============================================================================
// CriticalPathAnalyzer Class
// ============================================================================

/**
 * Performs critical path analysis on dependency graphs
 */
export class CriticalPathAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      nearCriticalThreshold: 1,    // Hours - paths with less slack are near-critical
      identifyBottlenecks: true,
      findAlternatePaths: true,
      ...options
    };

    // Results
    this.result = null;
    
    // Statistics
    this.stats = {
      nodesAnalyzed: 0,
      criticalTaskCount: 0,
      nearCriticalTaskCount: 0,
      analysisTimeMs: 0
    };
  }

  // ==========================================================================
  // Main Analysis
  // ==========================================================================

  /**
   * Analyze critical path in the graph
   */
  analyze(graph, sortedOrder) {
    const startTime = Date.now();
    this.result = new CriticalPathResult();

    // Validate input
    if (!sortedOrder || !Array.isArray(sortedOrder)) {
      throw new Error('sortedOrder must be a valid array');
    }

    try {
      // Step 1: Forward pass - calculate earliest times
      this._forwardPass(graph, sortedOrder);

      // Step 2: Backward pass - calculate latest times
      this._backwardPass(graph, sortedOrder);

      // Step 3: Calculate slack and identify critical path
      this._calculateSlack(graph, sortedOrder);

      // Step 4: Extract critical path
      this._extractCriticalPath(graph, sortedOrder);

      // Step 5: Find bottlenecks
      if (this.options.identifyBottlenecks) {
        this._identifyBottlenecks(graph);
      }

      // Step 6: Find near-critical paths
      if (this.options.findAlternatePaths) {
        this._findNearCriticalPaths(graph, sortedOrder);
      }

      // Update statistics
      this.stats.analysisTimeMs = Date.now() - startTime;
      this.result.analysisTime = this.stats.analysisTimeMs;

      this.emit('analysis:complete', this.result);

      return this.result;

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get analysis result
   */
  getResult() {
    return this.result;
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  // ==========================================================================
  // Forward Pass (Earliest Times)
  // ==========================================================================

  /**
   * Calculate earliest start and finish times
   */
  _forwardPass(graph, sortedOrder) {
    for (const taskId of sortedOrder) {
      const node = graph.getNode(taskId);
      if (!node) continue;

      this.stats.nodesAnalyzed++;
      const duration = node.getDuration();

      // Earliest start = max of all dependencies' earliest finish
      let earliestStart = 0;
      
      for (const depId of node.dependencies) {
        const depNode = graph.getNode(depId);
        if (depNode) {
          earliestStart = Math.max(earliestStart, depNode.earliestFinish);
        }
      }

      node.earliestStart = earliestStart;
      node.earliestFinish = earliestStart + duration;

      // Store in result
      this.result.taskTimings.set(taskId, {
        earliestStart: node.earliestStart,
        earliestFinish: node.earliestFinish,
        duration
      });
    }

    // Project duration = max earliest finish
    this.result.totalDuration = Math.max(
      ...graph.getAllNodes().map(n => n.earliestFinish)
    );
  }

  // ==========================================================================
  // Backward Pass (Latest Times)
  // ==========================================================================

  /**
   * Calculate latest start and finish times
   */
  _backwardPass(graph, sortedOrder) {
    const projectEnd = this.result.totalDuration;

    // Process in reverse order
    for (let i = sortedOrder.length - 1; i >= 0; i--) {
      const taskId = sortedOrder[i];
      const node = graph.getNode(taskId);
      if (!node) continue;

      const duration = node.getDuration();

      // Latest finish = min of all dependents' latest start
      // For leaf nodes, latest finish = project end
      if (node.dependents.size === 0) {
        node.latestFinish = projectEnd;
      } else {
        let minLatestStart = Infinity;
        
        for (const depId of node.dependents) {
          const depNode = graph.getNode(depId);
          if (depNode) {
            minLatestStart = Math.min(minLatestStart, depNode.latestStart);
          }
        }
        
        node.latestFinish = minLatestStart;
      }

      node.latestStart = node.latestFinish - duration;

      // Update result
      const timing = this.result.taskTimings.get(taskId);
      if (timing) {
        timing.latestStart = node.latestStart;
        timing.latestFinish = node.latestFinish;
      }
    }
  }

  // ==========================================================================
  // Slack Calculation
  // ==========================================================================

  /**
   * Calculate slack (float) for each task
   */
  _calculateSlack(graph, sortedOrder) {
    for (const taskId of sortedOrder) {
      const node = graph.getNode(taskId);
      if (!node) continue;

      // Slack = Latest Start - Earliest Start (or Latest Finish - Earliest Finish)
      node.slack = node.latestStart - node.earliestStart;

      // Determine criticality
      let criticality;
      if (Math.abs(node.slack) < 0.001) {
        criticality = TaskCriticality.CRITICAL;
        this.stats.criticalTaskCount++;
      } else if (node.slack < this.options.nearCriticalThreshold) {
        criticality = TaskCriticality.NEAR_CRITICAL;
        this.stats.nearCriticalTaskCount++;
      } else {
        criticality = TaskCriticality.NON_CRITICAL;
      }

      // Update result
      const timing = this.result.taskTimings.get(taskId);
      if (timing) {
        timing.slack = node.slack;
        timing.criticality = criticality;
        timing.isCritical = criticality === TaskCriticality.CRITICAL;
      }
    }
  }

  // ==========================================================================
  // Critical Path Extraction
  // ==========================================================================

  /**
   * Extract the critical path from the graph
   */
  _extractCriticalPath(graph, sortedOrder) {
    const criticalPath = [];
    const criticalTasks = [];

    // Find all critical tasks
    for (const taskId of sortedOrder) {
      const node = graph.getNode(taskId);
      if (node && node.isCritical()) {
        criticalPath.push(taskId);
        criticalTasks.push({
          id: taskId,
          title: node.task.title || node.task.name || taskId,
          duration: node.getDuration(),
          agent: node.task.agent,
          earliestStart: node.earliestStart,
          earliestFinish: node.earliestFinish
        });
      }
    }

    // Order by earliest start
    criticalTasks.sort((a, b) => a.earliestStart - b.earliestStart);
    
    this.result.criticalPath = criticalTasks.map(t => t.id);
    this.result.criticalTasks = criticalTasks;
  }

  // ==========================================================================
  // Bottleneck Identification
  // ==========================================================================

  /**
   * Identify bottleneck tasks that could delay the project
   */
  _identifyBottlenecks(graph) {
    const bottlenecks = [];

    for (const taskId of this.result.criticalPath) {
      const node = graph.getNode(taskId);
      if (!node) continue;

      // A task is a bottleneck if:
      // 1. It's on the critical path
      // 2. It has multiple dependents
      // 3. Especially if those dependents are also critical

      const dependentCount = node.dependents.size;
      const criticalDependents = Array.from(node.dependents).filter(depId => {
        const depNode = graph.getNode(depId);
        return depNode && depNode.isCritical();
      });

      if (dependentCount > 1 || criticalDependents.length > 0) {
        bottlenecks.push({
          id: taskId,
          title: node.task.title || node.task.name || taskId,
          duration: node.getDuration(),
          dependentCount,
          criticalDependentCount: criticalDependents.length,
          reason: this._determineBottleneckReason(node, criticalDependents),
          impactHours: this._calculateImpact(graph, taskId)
        });
      }
    }

    // Sort by impact
    bottlenecks.sort((a, b) => b.impactHours - a.impactHours);
    
    this.result.bottlenecks = bottlenecks;
  }

  /**
   * Determine why a task is a bottleneck
   */
  _determineBottleneckReason(node, criticalDependents) {
    const reasons = [];

    if (criticalDependents.length > 1) {
      reasons.push(`Blocks ${criticalDependents.length} critical tasks`);
    }

    if (node.dependents.size > 3) {
      reasons.push(`Has ${node.dependents.size} dependent tasks`);
    }

    if (node.getDuration() > 4) {
      reasons.push(`Long duration (${node.getDuration()} hours)`);
    }

    return reasons.length > 0 ? reasons.join('; ') : 'On critical path';
  }

  /**
   * Calculate impact of delaying a task
   */
  _calculateImpact(graph, taskId) {
    const node = graph.getNode(taskId);
    if (!node) return 0;

    // Impact = sum of durations of all downstream critical tasks
    let impact = node.getDuration();
    const visited = new Set([taskId]);
    const queue = Array.from(node.dependents);

    while (queue.length > 0) {
      const depId = queue.shift();
      if (visited.has(depId)) continue;
      visited.add(depId);

      const depNode = graph.getNode(depId);
      if (depNode && depNode.isCritical()) {
        impact += depNode.getDuration();
        queue.push(...Array.from(depNode.dependents));
      }
    }

    return impact;
  }

  // ==========================================================================
  // Near-Critical Paths
  // ==========================================================================

  /**
   * Find paths that are close to being critical
   */
  _findNearCriticalPaths(graph, sortedOrder) {
    const nearCriticalPaths = [];
    const processed = new Set();

    for (const taskId of sortedOrder) {
      const node = graph.getNode(taskId);
      if (!node || processed.has(taskId)) continue;

      const timing = this.result.taskTimings.get(taskId);
      if (!timing) continue;

      // Look for near-critical tasks that aren't on the main critical path
      if (timing.criticality === TaskCriticality.NEAR_CRITICAL) {
        const path = this._tracePathFromTask(graph, taskId, processed);
        
        if (path.length > 1) {
          const pathDuration = path.reduce((sum, id) => {
            const n = graph.getNode(id);
            return sum + (n ? n.getDuration() : 0);
          }, 0);

          nearCriticalPaths.push({
            path,
            totalHours: pathDuration,
            slack: timing.slack,
            risk: timing.slack < 0.5 ? 'high' : 'medium'
          });
        }
      }
    }

    // Sort by slack (lowest first = highest risk)
    nearCriticalPaths.sort((a, b) => a.slack - b.slack);
    
    this.result.nearCriticalPaths = nearCriticalPaths.slice(0, 5);  // Top 5
  }

  /**
   * Trace a path from a task through its dependents
   */
  _tracePathFromTask(graph, startId, processed) {
    const path = [startId];
    processed.add(startId);

    let currentId = startId;
    
    while (true) {
      const node = graph.getNode(currentId);
      if (!node || node.dependents.size === 0) break;

      // Follow the dependent with smallest slack
      let nextId = null;
      let minSlack = Infinity;

      for (const depId of node.dependents) {
        if (processed.has(depId)) continue;
        
        const timing = this.result.taskTimings.get(depId);
        if (timing && timing.slack < minSlack) {
          minSlack = timing.slack;
          nextId = depId;
        }
      }

      if (!nextId) break;

      path.push(nextId);
      processed.add(nextId);
      currentId = nextId;
    }

    return path;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get summary of critical path analysis
   */
  getSummary() {
    if (!this.result) return null;

    return {
      projectDuration: {
        hours: this.result.totalDuration,
        days: Math.ceil(this.result.totalDuration / 8)
      },
      criticalPath: {
        taskCount: this.result.criticalPath.length,
        tasks: this.result.criticalPath
      },
      bottlenecks: this.result.bottlenecks.length,
      nearCriticalPaths: this.result.nearCriticalPaths.length,
      stats: this.stats
    };
  }

  /**
   * Get recommendations for reducing project duration
   */
  getRecommendations() {
    if (!this.result) return [];

    const recommendations = [];

    // Recommend focusing on bottlenecks
    if (this.result.bottlenecks.length > 0) {
      const topBottleneck = this.result.bottlenecks[0];
      recommendations.push({
        priority: 'high',
        type: 'address_bottleneck',
        taskId: topBottleneck.id,
        message: `Focus on "${topBottleneck.title}" - ${topBottleneck.reason}`,
        potentialSavings: `Could save up to ${topBottleneck.impactHours} hours if optimized`
      });
    }

    // Recommend parallelization opportunities
    const nonCriticalWithSlack = Array.from(this.result.taskTimings.entries())
      .filter(([_, timing]) => timing.slack > 2)
      .slice(0, 3);

    if (nonCriticalWithSlack.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'leverage_slack',
        message: `${nonCriticalWithSlack.length} tasks have significant slack and can be delayed if needed`,
        tasks: nonCriticalWithSlack.map(([id, timing]) => ({
          id,
          slack: timing.slack
        }))
      });
    }

    // Warn about near-critical paths
    if (this.result.nearCriticalPaths.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'monitor_near_critical',
        message: `${this.result.nearCriticalPaths.length} near-critical path(s) could become critical if delayed`,
        paths: this.result.nearCriticalPaths
      });
    }

    return recommendations;
  }
}

export default CriticalPathAnalyzer;
