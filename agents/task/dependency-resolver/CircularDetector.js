/**
 * CircularDetector.js
 * 
 * Detects circular dependencies in the task graph using DFS-based cycle detection.
 * Reports detailed cycle paths and provides suggestions for resolution.
 * 
 * @module task/dependency-resolver/CircularDetector
 */

import { EventEmitter } from 'events';

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Detection result types
 */
export const DetectionResult = {
  NO_CYCLES: 'no_cycles',
  CYCLES_FOUND: 'cycles_found',
  ERROR: 'error'
};

/**
 * Cycle severity levels
 */
export const CycleSeverity = {
  CRITICAL: 'critical',  // Direct A->B->A
  HIGH: 'high',          // Short cycle (3-4 nodes)
  MEDIUM: 'medium',      // Medium cycle (5-7 nodes)
  LOW: 'low'             // Long cycle (8+ nodes)
};

// ============================================================================
// Cycle Class
// ============================================================================

/**
 * Represents a detected cycle in the graph
 */
export class Cycle {
  constructor(path) {
    this.path = path;
    this.length = path.length;
    this.severity = this._calculateSeverity();
    this.id = this._generateId();
    this.detectedAt = new Date().toISOString();
  }

  /**
   * Get cycle as string
   */
  toString() {
    return this.path.join(' → ');
  }

  /**
   * Get nodes involved in cycle
   */
  getNodes() {
    // Remove last node (duplicate of first)
    return this.path.slice(0, -1);
  }

  /**
   * Check if cycle contains a specific node
   */
  containsNode(nodeId) {
    return this.path.includes(nodeId);
  }

  /**
   * Get suggestions to break this cycle
   */
  getSuggestions() {
    const nodes = this.getNodes();
    const suggestions = [];

    // Suggest removing each edge in the cycle
    for (let i = 0; i < nodes.length; i++) {
      const from = nodes[i];
      const to = nodes[(i + 1) % nodes.length];
      suggestions.push({
        action: 'remove_dependency',
        from,
        to,
        description: `Remove dependency: ${from} → ${to}`
      });
    }

    // Suggest reordering if possible
    if (nodes.length === 2) {
      suggestions.push({
        action: 'merge_tasks',
        tasks: nodes,
        description: `Consider merging tasks ${nodes.join(' and ')} if they are tightly coupled`
      });
    }

    return suggestions;
  }

  /**
   * Serialize cycle
   */
  toJSON() {
    return {
      id: this.id,
      path: this.path,
      pathString: this.toString(),
      length: this.length,
      severity: this.severity,
      detectedAt: this.detectedAt,
      suggestions: this.getSuggestions()
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  _calculateSeverity() {
    if (this.length <= 2) return CycleSeverity.CRITICAL;
    if (this.length <= 4) return CycleSeverity.HIGH;
    if (this.length <= 7) return CycleSeverity.MEDIUM;
    return CycleSeverity.LOW;
  }

  _generateId() {
    const sorted = [...this.getNodes()].sort();
    return `cycle-${sorted.join('-')}`;
  }
}

// ============================================================================
// CircularDetector Class
// ============================================================================

/**
 * Detects circular dependencies in a dependency graph
 */
export class CircularDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxCycles: 100,           // Maximum cycles to find
      findAllCycles: false,     // Find all or stop at first
      includeSubcycles: false,  // Include subcycles within larger cycles
      ...options
    };

    // Detection state
    this.cycles = [];
    this.visited = new Set();
    this.recursionStack = new Set();
    this.currentPath = [];
    
    // Statistics
    this.stats = {
      nodesVisited: 0,
      edgesChecked: 0,
      cyclesFound: 0,
      detectionTimeMs: 0
    };
  }

  // ==========================================================================
  // Main Detection
  // ==========================================================================

  /**
   * Detect cycles in a dependency graph
   */
  detect(graph) {
    const startTime = Date.now();
    
    // Reset state
    this._reset();

    try {
      // Get all nodes
      const nodeIds = graph.getNodeIds();
      
      // Run DFS from each unvisited node
      for (const nodeId of nodeIds) {
        if (!this.visited.has(nodeId)) {
          this._dfs(graph, nodeId);
          
          // Check if we found enough cycles
          if (!this.options.findAllCycles && this.cycles.length > 0) {
            break;
          }
          
          if (this.cycles.length >= this.options.maxCycles) {
            this.emit('warning', {
              type: 'max_cycles_reached',
              maxCycles: this.options.maxCycles,
              message: 'Maximum cycle limit reached, stopping detection'
            });
            break;
          }
        }
      }

      // Update statistics
      this.stats.detectionTimeMs = Date.now() - startTime;
      this.stats.cyclesFound = this.cycles.length;

      // Build result
      const result = this._buildResult();
      
      this.emit('detection:complete', result);
      
      return result;

    } catch (error) {
      this.emit('error', error);
      return {
        status: DetectionResult.ERROR,
        error: error.message,
        cycles: [],
        stats: this.stats
      };
    }
  }

  /**
   * Quick check if graph has any cycles
   */
  hasCycles(graph) {
    const savedOptions = { ...this.options };
    this.options.findAllCycles = false;
    
    const result = this.detect(graph);
    
    this.options = savedOptions;
    return result.hasCycles;
  }

  /**
   * Get all cycles
   */
  getCycles() {
    return [...this.cycles];
  }

  /**
   * Get cycles involving a specific node
   */
  getCyclesForNode(nodeId) {
    return this.cycles.filter(cycle => cycle.containsNode(nodeId));
  }

  /**
   * Get detection statistics
   */
  getStats() {
    return { ...this.stats };
  }

  // ==========================================================================
  // DFS-based Detection
  // ==========================================================================

  /**
   * Depth-first search for cycle detection
   */
  _dfs(graph, nodeId) {
    this.visited.add(nodeId);
    this.recursionStack.add(nodeId);
    this.currentPath.push(nodeId);
    this.stats.nodesVisited++;

    const node = graph.getNode(nodeId);
    if (!node) {
      this.currentPath.pop();
      this.recursionStack.delete(nodeId);
      return;
    }

    // Check all dependencies (edges going from nodeId to its dependencies)
    const dependencies = Array.from(node.dependencies);
    
    for (const depId of dependencies) {
      this.stats.edgesChecked++;

      if (this.recursionStack.has(depId)) {
        // Found a cycle!
        const cycleStartIndex = this.currentPath.indexOf(depId);
        const cyclePath = [...this.currentPath.slice(cycleStartIndex), depId];
        
        this._recordCycle(cyclePath);
        
        if (!this.options.findAllCycles) {
          return;
        }
        
      } else if (!this.visited.has(depId)) {
        this._dfs(graph, depId);
        
        if (!this.options.findAllCycles && this.cycles.length > 0) {
          return;
        }
      }
    }

    this.currentPath.pop();
    this.recursionStack.delete(nodeId);
  }

  /**
   * Record a found cycle
   */
  _recordCycle(path) {
    // Check for duplicates (same cycle starting from different node)
    const cycle = new Cycle(path);
    
    const isDuplicate = this.cycles.some(existing => 
      existing.id === cycle.id
    );

    if (!isDuplicate) {
      this.cycles.push(cycle);
      
      this.emit('cycle:found', {
        cycle: cycle.toJSON(),
        cycleNumber: this.cycles.length
      });
    }
  }

  // ==========================================================================
  // Alternative Detection Methods
  // ==========================================================================

  /**
   * Detect using Tarjan's strongly connected components algorithm
   * Better for finding all cycles efficiently
   */
  detectWithTarjan(graph) {
    const startTime = Date.now();
    this._reset();

    const index = new Map();
    const lowlink = new Map();
    const onStack = new Set();
    const stack = [];
    let currentIndex = 0;
    const components = [];  // Track all SCCs

    const strongConnect = (nodeId) => {
      index.set(nodeId, currentIndex);
      lowlink.set(nodeId, currentIndex);
      currentIndex++;
      stack.push(nodeId);
      onStack.add(nodeId);
      this.stats.nodesVisited++;

      const node = graph.getNode(nodeId);
      if (!node) return;

      for (const depId of node.dependencies) {
        this.stats.edgesChecked++;
        
        if (!index.has(depId)) {
          strongConnect(depId);
          lowlink.set(nodeId, Math.min(lowlink.get(nodeId), lowlink.get(depId)));
        } else if (onStack.has(depId)) {
          lowlink.set(nodeId, Math.min(lowlink.get(nodeId), index.get(depId)));
        }
      }

      // If nodeId is a root node, pop the SCC
      if (lowlink.get(nodeId) === index.get(nodeId)) {
        const scc = [];
        let w;
        do {
          w = stack.pop();
          onStack.delete(w);
          scc.push(w);
        } while (w !== nodeId);

        // Track all SCCs
        components.push([...scc].reverse());

        // SCC with more than one node indicates a cycle
        if (scc.length > 1) {
          // Record as cycle (add first element again to complete cycle)
          const cyclePath = [...scc.reverse(), scc[0]];
          this._recordCycle(cyclePath);
        }
      }
    };

    for (const nodeId of graph.getNodeIds()) {
      if (!index.has(nodeId)) {
        strongConnect(nodeId);
      }
    }

    this.stats.detectionTimeMs = Date.now() - startTime;
    this.stats.cyclesFound = this.cycles.length;

    // Build result with components
    const baseResult = this._buildResult();
    return {
      ...baseResult,
      components
    };
  }

  // ==========================================================================
  // Result Building
  // ==========================================================================

  /**
   * Build detection result
   */
  _buildResult() {
    const hasCycles = this.cycles.length > 0;
    const status = hasCycles ? DetectionResult.CYCLES_FOUND : DetectionResult.NO_CYCLES;

    return {
      status,
      result: status,  // Alias for status for API compatibility
      hasCycles,
      cycleCount: this.cycles.length,
      cycles: this.cycles.map(c => c.toJSON()),
      summary: this._buildSummary(),
      stats: { ...this.stats },
      recommendations: hasCycles ? this._buildRecommendations() : []
    };
  }

  /**
   * Build summary of detection
   */
  _buildSummary() {
    if (this.cycles.length === 0) {
      return {
        message: 'No circular dependencies detected',
        severity: null
      };
    }

    const severityCounts = {
      [CycleSeverity.CRITICAL]: 0,
      [CycleSeverity.HIGH]: 0,
      [CycleSeverity.MEDIUM]: 0,
      [CycleSeverity.LOW]: 0
    };

    for (const cycle of this.cycles) {
      severityCounts[cycle.severity]++;
    }

    const worstSeverity = 
      severityCounts[CycleSeverity.CRITICAL] > 0 ? CycleSeverity.CRITICAL :
      severityCounts[CycleSeverity.HIGH] > 0 ? CycleSeverity.HIGH :
      severityCounts[CycleSeverity.MEDIUM] > 0 ? CycleSeverity.MEDIUM :
      CycleSeverity.LOW;

    return {
      message: `Found ${this.cycles.length} circular dependenc${this.cycles.length === 1 ? 'y' : 'ies'}`,
      severity: worstSeverity,
      severityCounts,
      affectedNodes: this._getAffectedNodes()
    };
  }

  /**
   * Get all nodes affected by cycles
   */
  _getAffectedNodes() {
    const affected = new Set();
    for (const cycle of this.cycles) {
      for (const nodeId of cycle.getNodes()) {
        affected.add(nodeId);
      }
    }
    return Array.from(affected);
  }

  /**
   * Build recommendations for fixing cycles
   */
  _buildRecommendations() {
    const recommendations = [];

    // Group by severity
    const criticalCycles = this.cycles.filter(c => c.severity === CycleSeverity.CRITICAL);
    
    if (criticalCycles.length > 0) {
      recommendations.push({
        priority: 'critical',
        type: 'fix_critical_cycles',
        message: `Fix ${criticalCycles.length} critical cycle(s) first - these are direct mutual dependencies`,
        cycles: criticalCycles.map(c => c.id)
      });
    }

    // Find most common nodes in cycles
    const nodeFrequency = new Map();
    for (const cycle of this.cycles) {
      for (const nodeId of cycle.getNodes()) {
        nodeFrequency.set(nodeId, (nodeFrequency.get(nodeId) || 0) + 1);
      }
    }

    const hotspots = Array.from(nodeFrequency.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (hotspots.length > 0) {
      recommendations.push({
        priority: 'high',
        type: 'fix_hotspot_nodes',
        message: 'These nodes appear in multiple cycles - fixing them may resolve several issues',
        nodes: hotspots.map(([nodeId, count]) => ({ nodeId, cycleCount: count }))
      });
    }

    return recommendations;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Reset detection state
   */
  _reset() {
    this.cycles = [];
    this.visited = new Set();
    this.recursionStack = new Set();
    this.currentPath = [];
    this.stats = {
      nodesVisited: 0,
      edgesChecked: 0,
      cyclesFound: 0,
      detectionTimeMs: 0
    };
  }
}

export default CircularDetector;
