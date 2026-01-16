/**
 * DependencyResolver - Main Facade
 * 
 * Orchestrates all dependency resolution components to produce a complete
 * execution schedule from task definitions.
 * 
 * @module task/dependency-resolver
 */

import { EventEmitter } from 'events';

// Import all components
import { DependencyGraph, GraphNode, NodeStatus, EdgeType } from './DependencyGraph.js';
import { CircularDetector, Cycle, DetectionResult, CycleSeverity } from './CircularDetector.js';
import { TopologicalSorter, SortAlgorithm, SortStatus } from './TopologicalSorter.js';
import { ParallelBlocker, ExecutionBlock, BlockMode, ParallelStrategy } from './ParallelBlocker.js';
import { CriticalPathAnalyzer, CriticalPathResult, TaskCriticality } from './CriticalPathAnalyzer.js';
import { ScheduleGenerator, ExecutionSchedule, ScheduleFormat, ScheduleStatus } from './ScheduleGenerator.js';

// ============================================================================
// Re-export all components and types
// ============================================================================

export {
  // DependencyGraph
  DependencyGraph,
  GraphNode,
  NodeStatus,
  EdgeType,
  
  // CircularDetector
  CircularDetector,
  Cycle,
  DetectionResult,
  CycleSeverity,
  
  // TopologicalSorter
  TopologicalSorter,
  SortAlgorithm,
  SortStatus,
  
  // ParallelBlocker
  ParallelBlocker,
  ExecutionBlock,
  BlockMode,
  ParallelStrategy,
  
  // CriticalPathAnalyzer
  CriticalPathAnalyzer,
  CriticalPathResult,
  TaskCriticality,
  
  // ScheduleGenerator
  ScheduleGenerator,
  ExecutionSchedule,
  ScheduleFormat,
  ScheduleStatus
};

// ============================================================================
// Resolution Result
// ============================================================================

/**
 * Complete result from dependency resolution
 */
export class ResolutionResult {
  constructor() {
    this.success = false;
    this.graph = null;
    this.sortedOrder = [];
    this.parallelBlocks = [];
    this.criticalPath = null;
    this.schedule = null;
    this.errors = [];
    this.warnings = [];
    this.metrics = {
      taskCount: 0,
      dependencyCount: 0,
      cyclesDetected: 0,
      blockCount: 0,
      criticalPathLength: 0,
      totalDurationHours: 0,
      maxParallelism: 0,
      resolutionTimeMs: 0
    };
  }

  /**
   * Add error
   */
  addError(error) {
    this.errors.push(error);
    this.success = false;
  }

  /**
   * Add warning
   */
  addWarning(warning) {
    this.warnings.push(warning);
  }

  /**
   * Check if resolution was successful
   */
  isValid() {
    return this.success && this.errors.length === 0;
  }

  /**
   * Get execution order
   */
  getExecutionOrder() {
    return this.sortedOrder;
  }

  /**
   * Get schedule JSON
   */
  getScheduleJSON() {
    return this.schedule ? this.schedule.toJSON() : null;
  }

  /**
   * Serialize complete result
   */
  toJSON() {
    return {
      success: this.success,
      sorted_order: this.sortedOrder,
      parallel_blocks: this.parallelBlocks.map(b => b.toJSON ? b.toJSON() : b),
      critical_path: this.criticalPath ? this.criticalPath.toJSON() : null,
      schedule: this.schedule ? this.schedule.toJSON() : null,
      errors: this.errors,
      warnings: this.warnings,
      metrics: this.metrics
    };
  }
}

// ============================================================================
// DependencyResolver Class (Main Facade)
// ============================================================================

/**
 * Main facade for dependency resolution
 * 
 * @example
 * const resolver = new DependencyResolver();
 * const result = await resolver.resolve(tasks);
 * 
 * if (result.isValid()) {
 *   console.log('Execution order:', result.getExecutionOrder());
 *   console.log('Schedule:', result.getScheduleJSON());
 * }
 */
export class DependencyResolver extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Graph options
      allowSoftDependencies: true,
      validateGraph: true,
      
      // Cycle detection options
      breakCycles: false,
      cycleBreakStrategy: 'remove_weakest',
      
      // Sorting options
      sortAlgorithm: SortAlgorithm.KAHN,
      priorityAware: true,
      
      // Parallel blocking options
      parallelStrategy: ParallelStrategy.RESOURCE_AWARE,
      maxConcurrency: 4,
      
      // Critical path options
      analyzeCriticalPath: true,
      nearCriticalThreshold: 1,
      
      // Schedule options
      generateSchedule: true,
      bufferPercent: 10,
      
      ...options
    };

    // Initialize components
    this._initializeComponents();

    // Statistics
    this.stats = {
      resolutionsPerformed: 0,
      totalResolutionTimeMs: 0,
      cyclesFound: 0,
      cyclesBroken: 0
    };
  }

  /**
   * Initialize all components
   */
  _initializeComponents() {
    this.graph = new DependencyGraph({
      allowSoftDependencies: this.options.allowSoftDependencies
    });

    this.circularDetector = new CircularDetector();

    this.topologicalSorter = new TopologicalSorter({
      algorithm: this.options.sortAlgorithm
    });

    this.parallelBlocker = new ParallelBlocker({
      strategy: this.options.parallelStrategy,
      maxConcurrency: this.options.maxConcurrency
    });

    this.criticalPathAnalyzer = new CriticalPathAnalyzer({
      nearCriticalThreshold: this.options.nearCriticalThreshold
    });

    this.scheduleGenerator = new ScheduleGenerator({
      bufferPercent: this.options.bufferPercent,
      resourceConstraints: this.options.resourceConstraints
    });

    // Wire up events
    this._wireEvents();
  }

  /**
   * Wire component events to main emitter
   */
  _wireEvents() {
    this.graph.on('graph:built', () => this.emit('step:graph-built'));
    this.graph.on('warning', (warning) => this.emit('warning', warning));
    this.circularDetector.on('cycles:detected', (cycles) => this.emit('step:cycles-detected', cycles));
    this.topologicalSorter.on('sort:complete', (result) => this.emit('step:sorted', result));
    this.parallelBlocker.on('blocks:created', (blocks) => this.emit('step:blocks-created', blocks));
    this.criticalPathAnalyzer.on('analysis:complete', (result) => this.emit('step:critical-path', result));
    this.scheduleGenerator.on('schedule:generated', (schedule) => this.emit('step:schedule-generated', schedule));
  }

  // ==========================================================================
  // Main Resolution
  // ==========================================================================

  /**
   * Resolve dependencies for a set of tasks
   * 
   * @param {Array} tasks - Array of task objects
   * @returns {ResolutionResult} Complete resolution result
   */
  async resolve(tasks) {
    const startTime = Date.now();
    const result = new ResolutionResult();

    // Capture warnings from graph building
    const warningHandler = (warning) => {
      result.addWarning(warning);
    };
    this.graph.on('warning', warningHandler);

    try {
      this.emit('resolution:start', { taskCount: tasks.length });

      // Step 1: Build dependency graph
      this.emit('step:start', 'Building dependency graph');
      result.graph = this.graph.buildFromTasks(tasks);
      result.metrics.taskCount = result.graph.nodeCount;
      result.metrics.dependencyCount = result.graph.edgeCount;

      // Step 2: Detect circular dependencies
      this.emit('step:start', 'Detecting circular dependencies');
      const cycleResult = this.circularDetector.detect(result.graph);
      
      if (cycleResult.hasCycles) {
        result.metrics.cyclesDetected = cycleResult.cycles.length;
        this.stats.cyclesFound += cycleResult.cycles.length;

        if (this.options.breakCycles) {
          // Attempt to break cycles
          const broken = this._breakCycles(result.graph, cycleResult.cycles);
          this.stats.cyclesBroken += broken;
          
          if (broken < cycleResult.cycles.length) {
            result.addError({
              type: 'circular_dependency',
              message: `Could not break all cycles. ${cycleResult.cycles.length - broken} cycles remain.`,
              cycles: cycleResult.cycles.slice(broken)
            });
            return this._finalizeResult(result, startTime);
          }
        } else {
          result.addError({
            type: 'circular_dependency',
            message: `Found ${cycleResult.cycles.length} circular dependency cycle(s)`,
            cycles: cycleResult.cycles.map(c => ({
              path: c.path,
              severity: c.severity,
              suggestion: c.suggestions[0]
            }))
          });
          return this._finalizeResult(result, startTime);
        }
      }

      // Step 3: Topological sort
      this.emit('step:start', 'Performing topological sort');
      const sortResult = this.topologicalSorter.sort(result.graph, {
        algorithm: this.options.sortAlgorithm
      });

      if (sortResult.status !== SortStatus.SUCCESS) {
        result.addError({
          type: 'sort_failed',
          message: 'Topological sort failed',
          reason: sortResult.error
        });
        return this._finalizeResult(result, startTime);
      }

      result.sortedOrder = sortResult.order;

      // Step 4: Create parallel blocks
      this.emit('step:start', 'Creating parallel execution blocks');
      const blockResult = this.parallelBlocker.createBlocks(
        result.graph,
        result.sortedOrder,
        { strategy: this.options.parallelStrategy }
      );

      result.parallelBlocks = blockResult.blocks;
      result.metrics.blockCount = blockResult.blocks.length;
      result.metrics.maxParallelism = blockResult.maxParallelism;

      // Step 5: Critical path analysis
      if (this.options.analyzeCriticalPath) {
        this.emit('step:start', 'Analyzing critical path');
        result.criticalPath = this.criticalPathAnalyzer.analyze(
          result.graph,
          result.sortedOrder
        );
        result.metrics.criticalPathLength = result.criticalPath.criticalPath.length;
        result.metrics.totalDurationHours = result.criticalPath.totalDuration;
      }

      // Step 6: Generate schedule
      if (this.options.generateSchedule) {
        this.emit('step:start', 'Generating execution schedule');
        result.schedule = this.scheduleGenerator.generate(
          result.graph,
          result.sortedOrder,
          result.parallelBlocks,
          result.criticalPath
        );

        // Copy warnings from schedule
        for (const warning of result.schedule.warnings) {
          result.addWarning(warning);
        }
      }

      // Mark success
      result.success = true;
      
      return this._finalizeResult(result, startTime);

    } catch (error) {
      result.addError({
        type: 'unexpected_error',
        message: error.message,
        stack: error.stack
      });
      return this._finalizeResult(result, startTime);
    } finally {
      // Clean up warning listener
      this.graph.off('warning', warningHandler);
    }
  }

  /**
   * Finalize result with metrics
   */
  _finalizeResult(result, startTime) {
    // Ensure at least 1ms for very fast operations
    const elapsed = Date.now() - startTime;
    result.metrics.resolutionTimeMs = Math.max(elapsed, 1);
    
    this.stats.resolutionsPerformed++;
    this.stats.totalResolutionTimeMs += result.metrics.resolutionTimeMs;

    this.emit('resolution:complete', result);
    
    return result;
  }

  // ==========================================================================
  // Cycle Breaking
  // ==========================================================================

  /**
   * Attempt to break cycles in the graph
   */
  _breakCycles(graph, cycles) {
    let broken = 0;

    for (const cycle of cycles) {
      if (this._breakCycle(graph, cycle)) {
        broken++;
      }
    }

    return broken;
  }

  /**
   * Break a single cycle
   */
  _breakCycle(graph, cycle) {
    // Find the weakest edge to remove
    let weakestEdge = null;
    let weakestScore = Infinity;

    for (let i = 0; i < cycle.path.length - 1; i++) {
      const from = cycle.path[i];
      const to = cycle.path[i + 1];
      
      const fromNode = graph.getNode(from);
      const toNode = graph.getNode(to);
      
      if (!fromNode || !toNode) continue;

      // Score based on edge type and node importance
      const edgeType = fromNode.getEdgeType(to);
      let score = 0;

      switch (edgeType) {
        case EdgeType.OPTIONAL:
          score = 1;
          break;
        case EdgeType.SOFT:
          score = 2;
          break;
        case EdgeType.HARD:
          score = 3;
          break;
      }

      // Prefer removing edges to low-priority tasks
      score -= (toNode.task.priority || 5) * 0.1;

      if (score < weakestScore) {
        weakestScore = score;
        weakestEdge = { from, to };
      }
    }

    if (weakestEdge && weakestScore <= 2) {  // Only remove soft/optional
      graph.removeEdge(weakestEdge.from, weakestEdge.to);
      return true;
    }

    return false;
  }

  // ==========================================================================
  // Convenience Methods
  // ==========================================================================

  /**
   * Quick resolution - returns just the execution order
   */
  async resolveOrder(tasks) {
    const result = await this.resolve(tasks);
    return result.isValid() ? result.sortedOrder : null;
  }

  /**
   * Get parallel execution blocks only
   */
  async resolveBlocks(tasks) {
    const result = await this.resolve(tasks);
    return result.isValid() ? result.parallelBlocks : null;
  }

  /**
   * Get schedule only
   */
  async resolveSchedule(tasks) {
    const result = await this.resolve(tasks);
    return result.isValid() ? result.schedule : null;
  }

  /**
   * Validate tasks without full resolution
   */
  validateTasks(tasks) {
    const graph = new DependencyGraph();
    graph.buildFromTasks(tasks);
    
    const cycleResult = this.circularDetector.detect(graph);
    
    return {
      valid: !cycleResult.hasCycles,
      taskCount: graph.nodeCount,
      dependencyCount: graph.edgeCount,
      cycles: cycleResult.cycles
    };
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Update options
   */
  configure(options) {
    this.options = { ...this.options, ...options };
    this._initializeComponents();
  }

  /**
   * Set resource constraints
   */
  setResourceConstraints(constraints) {
    this.options.resourceConstraints = constraints;
    this.scheduleGenerator = new ScheduleGenerator({
      bufferPercent: this.options.bufferPercent,
      resourceConstraints: constraints
    });
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get resolver statistics
   */
  getStats() {
    return {
      ...this.stats,
      graph: this.graph.getStats ? this.graph.getStats() : null,
      sorter: this.topologicalSorter.getStats(),
      blocker: this.parallelBlocker.getStats(),
      analyzer: this.criticalPathAnalyzer.getStats(),
      generator: this.scheduleGenerator.getStats()
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      resolutionsPerformed: 0,
      totalResolutionTimeMs: 0,
      cyclesFound: 0,
      cyclesBroken: 0
    };
  }
}

// Default export
export default DependencyResolver;
