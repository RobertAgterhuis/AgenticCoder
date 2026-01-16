/**
 * TopologicalSorter.js
 * 
 * Performs topological sorting on the dependency graph to determine
 * a valid execution order where all dependencies are satisfied.
 * 
 * @module task/dependency-resolver/TopologicalSorter
 */

import { EventEmitter } from 'events';

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Sorting algorithms available
 */
export const SortAlgorithm = {
  KAHN: 'kahn',           // BFS-based (Kahn's algorithm)
  DFS: 'dfs',             // DFS-based post-order
  PRIORITY: 'priority'    // Priority-aware sorting
};

/**
 * Sort result status
 */
export const SortStatus = {
  SUCCESS: 'success',
  CYCLE_DETECTED: 'cycle_detected',
  ERROR: 'error'
};

// ============================================================================
// TopologicalSorter Class
// ============================================================================

/**
 * Performs topological sorting on dependency graphs
 */
export class TopologicalSorter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      algorithm: SortAlgorithm.KAHN,
      priorityField: 'priority',      // Field to use for priority sorting
      preferParallel: true,           // Group independent tasks together
      respectAgents: false,           // Try to keep same-agent tasks together
      ...options
    };

    // Results
    this.sortedOrder = [];
    this.levels = [];  // Tasks grouped by dependency level
    
    // Statistics
    this.stats = {
      nodesProcessed: 0,
      levelsCreated: 0,
      sortTimeMs: 0
    };
  }

  // ==========================================================================
  // Main Sorting Methods
  // ==========================================================================

  /**
   * Sort the graph topologically
   * @param {DependencyGraph} graph - The graph to sort
   * @param {Object} options - Optional overrides (e.g., { algorithm: 'dfs' })
   */
  sort(graph, options = {}) {
    const startTime = Date.now();
    
    // Reset state
    this._reset();

    // Apply any option overrides
    if (options.algorithm) {
      this.options.algorithm = options.algorithm;
    }

    try {
      let result;
      
      switch (this.options.algorithm) {
        case SortAlgorithm.KAHN:
          result = this._sortKahn(graph);
          break;
        case SortAlgorithm.DFS:
          result = this._sortDFS(graph);
          break;
        case SortAlgorithm.PRIORITY:
          result = this._sortWithPriority(graph);
          break;
        default:
          result = this._sortKahn(graph);
      }

      this.stats.sortTimeMs = Date.now() - startTime;
      
      this.emit('sort:complete', result);
      
      return result;

    } catch (error) {
      this.emit('error', error);
      return {
        status: SortStatus.ERROR,
        error: error.message,
        sortedOrder: [],
        order: [],  // Alias for API compatibility
        levels: []
      };
    }
  }

  /**
   * Get sorted order
   */
  getSortedOrder() {
    return [...this.sortedOrder];
  }

  /**
   * Get levels (tasks grouped by dependency level)
   */
  getLevels() {
    return this.levels.map(level => [...level]);
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  // ==========================================================================
  // Kahn's Algorithm (BFS-based)
  // ==========================================================================

  /**
   * Kahn's algorithm - BFS-based topological sort
   * Also produces levels for parallel execution
   */
  _sortKahn(graph) {
    const inDegree = new Map();
    const sorted = [];
    const levels = [];
    
    // Initialize in-degrees
    for (const nodeId of graph.getNodeIds()) {
      const node = graph.getNode(nodeId);
      inDegree.set(nodeId, node.dependencies.size);
    }

    // Find initial nodes with no dependencies
    let currentLevel = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        currentLevel.push(nodeId);
      }
    }

    while (currentLevel.length > 0) {
      // Sort current level for deterministic ordering
      currentLevel.sort();
      
      levels.push([...currentLevel]);
      sorted.push(...currentLevel);
      this.stats.nodesProcessed += currentLevel.length;

      // Find next level
      const nextLevel = [];
      
      for (const nodeId of currentLevel) {
        const node = graph.getNode(nodeId);
        
        for (const depId of node.dependents) {
          const newDegree = inDegree.get(depId) - 1;
          inDegree.set(depId, newDegree);
          
          if (newDegree === 0) {
            nextLevel.push(depId);
          }
        }
      }

      currentLevel = nextLevel;
    }

    // Check if all nodes were processed
    if (sorted.length !== graph.nodes.size) {
      return {
        status: SortStatus.CYCLE_DETECTED,
        error: 'Graph contains a cycle - not all nodes could be sorted',
        sortedOrder: [],
        order: [],  // Alias for API compatibility
        algorithm: SortAlgorithm.KAHN,
        levels: [],
        processedCount: sorted.length,
        totalCount: graph.nodes.size
      };
    }

    this.sortedOrder = sorted;
    this.levels = levels;
    this.stats.levelsCreated = levels.length;

    return {
      status: SortStatus.SUCCESS,
      sortedOrder: sorted,
      order: sorted,  // Alias for API compatibility
      algorithm: SortAlgorithm.KAHN,
      levels,
      stats: { ...this.stats }
    };
  }

  // ==========================================================================
  // DFS-based Topological Sort
  // ==========================================================================

  /**
   * DFS-based topological sort (post-order)
   */
  _sortDFS(graph) {
    const visited = new Set();
    const recursionStack = new Set();
    const sorted = [];

    const visit = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        throw new Error(`Cycle detected at node ${nodeId}`);
      }
      
      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      this.stats.nodesProcessed++;

      const node = graph.getNode(nodeId);
      
      // Visit dependencies first
      for (const depId of node.dependencies) {
        visit(depId);
      }

      recursionStack.delete(nodeId);
      sorted.push(nodeId);
    };

    try {
      for (const nodeId of graph.getNodeIds()) {
        if (!visited.has(nodeId)) {
          visit(nodeId);
        }
      }

      this.sortedOrder = sorted;
      this.levels = this._computeLevelsFromOrder(graph, sorted);
      this.stats.levelsCreated = this.levels.length;

      return {
        status: SortStatus.SUCCESS,
        sortedOrder: sorted,
        order: sorted,  // Alias for API compatibility
        algorithm: SortAlgorithm.DFS,
        levels: this.levels,
        stats: { ...this.stats }
      };

    } catch (error) {
      return {
        status: SortStatus.CYCLE_DETECTED,
        error: error.message,
        sortedOrder: [],
        order: [],  // Alias for API compatibility
        algorithm: SortAlgorithm.DFS,
        levels: []
      };
    }
  }

  // ==========================================================================
  // Priority-aware Sorting
  // ==========================================================================

  /**
   * Sort with priority awareness
   * Higher priority tasks come first within their dependency level
   */
  _sortWithPriority(graph) {
    const inDegree = new Map();
    const sorted = [];
    const levels = [];
    
    // Initialize in-degrees
    for (const nodeId of graph.getNodeIds()) {
      const node = graph.getNode(nodeId);
      inDegree.set(nodeId, node.dependencies.size);
    }

    // Find initial nodes with no dependencies
    let currentLevel = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        currentLevel.push(nodeId);
      }
    }

    while (currentLevel.length > 0) {
      // Sort by priority (higher first), then by ID for determinism
      currentLevel.sort((a, b) => {
        const nodeA = graph.getNode(a);
        const nodeB = graph.getNode(b);
        const priorityA = nodeA.task[this.options.priorityField] || 0;
        const priorityB = nodeB.task[this.options.priorityField] || 0;
        
        if (priorityB !== priorityA) {
          return priorityB - priorityA;  // Higher priority first
        }
        return a.localeCompare(b);  // Alphabetical for ties
      });
      
      levels.push([...currentLevel]);
      sorted.push(...currentLevel);
      this.stats.nodesProcessed += currentLevel.length;

      // Find next level
      const nextLevel = [];
      
      for (const nodeId of currentLevel) {
        const node = graph.getNode(nodeId);
        
        for (const depId of node.dependents) {
          const newDegree = inDegree.get(depId) - 1;
          inDegree.set(depId, newDegree);
          
          if (newDegree === 0) {
            nextLevel.push(depId);
          }
        }
      }

      currentLevel = nextLevel;
    }

    // Check if all nodes were processed
    if (sorted.length !== graph.nodes.size) {
      return {
        status: SortStatus.CYCLE_DETECTED,
        error: 'Graph contains a cycle',
        sortedOrder: sorted,
        levels
      };
    }

    this.sortedOrder = sorted;
    this.levels = levels;
    this.stats.levelsCreated = levels.length;

    return {
      status: SortStatus.SUCCESS,
      sortedOrder: sorted,
      order: sorted,  // Alias for API compatibility
      algorithm: SortAlgorithm.PRIORITY,
      levels,
      stats: { ...this.stats }
    };
  }

  // ==========================================================================
  // Agent-aware Sorting
  // ==========================================================================

  /**
   * Sort with agent awareness - try to batch tasks for same agent
   */
  sortWithAgentAwareness(graph) {
    // First do normal sort
    const baseResult = this._sortKahn(graph);
    
    if (baseResult.status !== SortStatus.SUCCESS) {
      return baseResult;
    }

    // Reorder within each level to group by agent
    const reorderedLevels = baseResult.levels.map(level => {
      const byAgent = new Map();
      
      for (const nodeId of level) {
        const node = graph.getNode(nodeId);
        const agent = node.task.agent || 'unassigned';
        
        if (!byAgent.has(agent)) {
          byAgent.set(agent, []);
        }
        byAgent.get(agent).push(nodeId);
      }

      // Flatten back, grouped by agent
      const reordered = [];
      for (const tasks of byAgent.values()) {
        reordered.push(...tasks.sort());
      }
      return reordered;
    });

    // Flatten to sorted order
    const reorderedSorted = reorderedLevels.flat();

    return {
      status: SortStatus.SUCCESS,
      sortedOrder: reorderedSorted,
      levels: reorderedLevels,
      stats: { ...this.stats },
      agentGrouped: true
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Compute levels from a sorted order
   */
  _computeLevelsFromOrder(graph, sortedOrder) {
    const nodeLevel = new Map();
    const levels = [];

    for (const nodeId of sortedOrder) {
      const node = graph.getNode(nodeId);
      
      // Level is 1 + max level of dependencies
      let maxDepLevel = -1;
      for (const depId of node.dependencies) {
        const depLevel = nodeLevel.get(depId);
        if (depLevel !== undefined && depLevel > maxDepLevel) {
          maxDepLevel = depLevel;
        }
      }
      
      const level = maxDepLevel + 1;
      nodeLevel.set(nodeId, level);
      
      // Ensure levels array is big enough
      while (levels.length <= level) {
        levels.push([]);
      }
      levels[level].push(nodeId);
    }

    return levels;
  }

  /**
   * Verify that a sorted order is valid
   */
  verifySortedOrder(graph, sortedOrder) {
    const position = new Map();
    
    // Record position of each node
    for (let i = 0; i < sortedOrder.length; i++) {
      position.set(sortedOrder[i], i);
    }

    // Check all dependencies come before their dependents
    const violations = [];
    
    for (const nodeId of sortedOrder) {
      const node = graph.getNode(nodeId);
      const nodePos = position.get(nodeId);
      
      for (const depId of node.dependencies) {
        const depPos = position.get(depId);
        
        if (depPos === undefined) {
          violations.push({
            type: 'missing_dependency',
            node: nodeId,
            dependency: depId
          });
        } else if (depPos >= nodePos) {
          violations.push({
            type: 'order_violation',
            node: nodeId,
            dependency: depId,
            nodePosition: nodePos,
            dependencyPosition: depPos
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      isValid: violations.length === 0,  // Alias
      violations
    };
  }

  /**
   * Get tasks that can run in parallel at each step
   */
  getParallelSchedule(graph) {
    const result = this._sortKahn(graph);
    
    if (result.status !== SortStatus.SUCCESS) {
      return null;
    }

    return result.levels.map((level, index) => ({
      step: index + 1,
      parallelTasks: level,
      taskCount: level.length,
      canRunInParallel: level.length > 1
    }));
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Reset sorter state
   */
  _reset() {
    this.sortedOrder = [];
    this.levels = [];
    this.stats = {
      nodesProcessed: 0,
      levelsCreated: 0,
      sortTimeMs: 0
    };
  }
}

export default TopologicalSorter;
