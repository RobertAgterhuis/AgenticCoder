/**
 * DependencyGraph.js
 * 
 * Creates and manages a directed acyclic graph (DAG) of task dependencies.
 * Provides graph traversal, node queries, and dependency relationship tracking.
 * 
 * @module task/dependency-resolver/DependencyGraph
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Node status in the graph
 */
export const NodeStatus = {
  PENDING: 'pending',
  READY: 'ready',        // All dependencies satisfied
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',    // Dependency failed
  SKIPPED: 'skipped'
};

/**
 * Edge types for dependency relationships
 */
export const EdgeType = {
  HARD: 'hard',          // Must complete before
  SOFT: 'soft',          // Should complete before (can override)
  OPTIONAL: 'optional'   // Nice to have
};

// ============================================================================
// GraphNode Class
// ============================================================================

/**
 * Represents a node in the dependency graph
 */
export class GraphNode {
  constructor(task) {
    this.id = task.id;
    this.task = task;
    // Support both 'dependencies' and 'depends_on' property names
    const deps = task.dependencies || task.depends_on || [];
    this.dependencies = new Set(deps);
    this.dependents = new Set();
    this.edgeTypes = new Map(); // Store edge type for each dependent
    this.status = NodeStatus.PENDING;
    this.depth = 0;  // Calculated during analysis
    this.earliestStart = 0;
    this.earliestFinish = 0;
    this.latestStart = Infinity;
    this.latestFinish = Infinity;
    this.slack = 0;
    this.metadata = {};
  }

  /**
   * Get edge type for a dependent
   */
  getEdgeType(dependentId) {
    return this.edgeTypes.get(dependentId) || EdgeType.HARD;
  }

  /**
   * Set edge type for a dependent
   */
  setEdgeType(dependentId, type) {
    this.edgeTypes.set(dependentId, type);
  }

  /**
   * Check if all dependencies are satisfied
   */
  isReady(completedNodes) {
    for (const depId of this.dependencies) {
      if (!completedNodes.has(depId)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get estimated duration
   */
  getDuration() {
    return this.task.duration || this.task.estimated_hours || this.task.estimatedHours || 1;
  }

  /**
   * Check if this node is on critical path (slack = 0)
   */
  isCritical() {
    return Math.abs(this.slack) < 0.001;
  }

  /**
   * Serialize node for output
   */
  toJSON() {
    return {
      id: this.id,
      task: this.task,
      dependencies: Array.from(this.dependencies),
      dependents: Array.from(this.dependents),
      status: this.status,
      depth: this.depth,
      timing: {
        earliestStart: this.earliestStart,
        earliestFinish: this.earliestFinish,
        latestStart: this.latestStart,
        latestFinish: this.latestFinish,
        slack: this.slack
      },
      isCritical: this.isCritical()
    };
  }
}

// ============================================================================
// DependencyGraph Class
// ============================================================================

/**
 * Main dependency graph implementation
 */
export class DependencyGraph extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      allowSelfDependency: false,
      validateOnAdd: true,
      ...options
    };

    // Graph storage
    this.nodes = new Map();
    this.edges = new Map();  // edgeId -> { from, to, type }
    
    // Computed properties
    this.rootNodes = new Set();     // Nodes with no dependencies
    this.leafNodes = new Set();     // Nodes with no dependents
    this.maxDepth = 0;
    
    // Statistics
    this.stats = {
      nodeCount: 0,
      edgeCount: 0,
      rootCount: 0,
      leafCount: 0,
      avgDependencies: 0,
      maxDependencies: 0
    };
  }

  // Convenience getters
  get nodeCount() { return this.stats.nodeCount; }
  get edgeCount() { return this.stats.edgeCount; }

  // ==========================================================================
  // Graph Building
  // ==========================================================================

  /**
   * Build graph from task list
   */
  buildFromTasks(tasks) {
    this.clear();
    
    // First pass: add all nodes
    for (const task of tasks) {
      this.addNode(task);
    }

    // Second pass: build edges and compute dependents
    for (const [nodeId, node] of this.nodes) {
      for (const depId of node.dependencies) {
        if (this.nodes.has(depId)) {
          this.addEdge(depId, nodeId, EdgeType.HARD);
          this.nodes.get(depId).dependents.add(nodeId);
        } else {
          this.emit('warning', {
            type: 'missing_dependency',
            nodeId,
            missingDependency: depId,
            message: `Task ${nodeId} depends on non-existent task ${depId}`
          });
        }
      }
    }

    // Identify root and leaf nodes
    this._identifyRootAndLeafNodes();
    
    // Update statistics
    this._updateStats();

    this.emit('graph:built', {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      rootCount: this.rootNodes.size,
      leafCount: this.leafNodes.size
    });

    return this;
  }

  /**
   * Add a single node
   */
  addNode(task) {
    if (this.nodes.has(task.id)) {
      this.emit('warning', {
        type: 'duplicate_node',
        nodeId: task.id,
        message: `Duplicate task ID: ${task.id}`
      });
      return this.nodes.get(task.id);
    }

    // Validate self-dependency
    if (!this.options.allowSelfDependency && task.depends_on?.includes(task.id)) {
      throw new Error(`Task ${task.id} cannot depend on itself`);
    }

    const node = new GraphNode(task);
    this.nodes.set(task.id, node);
    this.stats.nodeCount++;

    this.emit('node:added', { nodeId: task.id, task });
    return node;
  }

  /**
   * Add an edge between nodes
   */
  addEdge(fromId, toId, type = EdgeType.HARD) {
    const edgeId = `${fromId}->${toId}`;
    
    if (this.edges.has(edgeId)) {
      return this.edges.get(edgeId);
    }

    const edge = {
      id: edgeId,
      from: fromId,
      to: toId,
      type
    };

    this.edges.set(edgeId, edge);
    this.stats.edgeCount++;

    // Store edge type on the from node
    const fromNode = this.nodes.get(fromId);
    if (fromNode) {
      fromNode.setEdgeType(toId, type);
      fromNode.dependents.add(toId);
    }
    
    // Add dependency on the to node
    const toNode = this.nodes.get(toId);
    if (toNode) {
      toNode.dependencies.add(fromId);
    }

    this.emit('edge:added', edge);
    return edge;
  }

  /**
   * Remove an edge from the graph
   */
  removeEdge(fromId, toId) {
    const edgeId = `${fromId}->${toId}`;
    
    if (!this.edges.has(edgeId)) {
      return false;
    }

    this.edges.delete(edgeId);
    this.stats.edgeCount--;

    // Update nodes
    const fromNode = this.nodes.get(fromId);
    if (fromNode) {
      fromNode.dependents.delete(toId);
      fromNode.edgeTypes.delete(toId);
    }
    
    const toNode = this.nodes.get(toId);
    if (toNode) {
      toNode.dependencies.delete(fromId);
    }

    this.emit('edge:removed', { from: fromId, to: toId });
    return true;
  }

  /**
   * Remove a node from the graph
   */
  removeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Remove all edges involving this node
    for (const depId of node.dependencies) {
      this.removeEdge(depId, nodeId);
    }
    for (const depId of node.dependents) {
      this.removeEdge(nodeId, depId);
    }

    this.nodes.delete(nodeId);
    this.stats.nodeCount--;
    this.rootNodes.delete(nodeId);
    this.leafNodes.delete(nodeId);

    this.emit('node:removed', { nodeId });
    return true;
  }

  /**
   * Clear the graph
   */
  clear() {
    this.nodes.clear();
    this.edges.clear();
    this.rootNodes.clear();
    this.leafNodes.clear();
    this.maxDepth = 0;
    this.stats = {
      nodeCount: 0,
      edgeCount: 0,
      rootCount: 0,
      leafCount: 0,
      avgDependencies: 0,
      maxDependencies: 0
    };
  }

  // ==========================================================================
  // Graph Queries
  // ==========================================================================

  /**
   * Get a node by ID
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Check if node exists
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Get all node IDs
   */
  getNodeIds() {
    return Array.from(this.nodes.keys());
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Get dependencies of a node
   */
  getDependencies(nodeId) {
    const node = this.nodes.get(nodeId);
    return node ? Array.from(node.dependencies) : [];
  }

  /**
   * Get dependents of a node (nodes that depend on this one)
   */
  getDependents(nodeId) {
    const node = this.nodes.get(nodeId);
    return node ? Array.from(node.dependents) : [];
  }

  /**
   * Get all ancestors (transitive dependencies)
   */
  getAncestors(nodeId, visited = new Set()) {
    const ancestors = [];
    const node = this.nodes.get(nodeId);
    
    if (!node) return ancestors;

    for (const depId of node.dependencies) {
      if (!visited.has(depId)) {
        visited.add(depId);
        ancestors.push(depId);
        
        // Recursive: get ancestors of dependency
        const depAncestors = this.getAncestors(depId, visited);
        for (const ancestor of depAncestors) {
          if (!ancestors.includes(ancestor)) {
            ancestors.push(ancestor);
          }
        }
      }
    }

    return ancestors;
  }

  /**
   * Get all descendants (transitive dependents)
   */
  getDescendants(nodeId, visited = new Set()) {
    const descendants = [];
    const node = this.nodes.get(nodeId);
    
    if (!node) return descendants;

    for (const depId of node.dependents) {
      if (!visited.has(depId)) {
        visited.add(depId);
        descendants.push(depId);
        
        // Recursive: get descendants of dependent
        const depDescendants = this.getDescendants(depId, visited);
        for (const desc of depDescendants) {
          if (!descendants.includes(desc)) {
            descendants.push(desc);
          }
        }
      }
    }

    return descendants;
  }

  /**
   * Get root nodes (no dependencies)
   */
  getRootNodes() {
    return Array.from(this.rootNodes).map(id => this.nodes.get(id));
  }

  /**
   * Get leaf nodes (no dependents)
   */
  getLeafNodes() {
    return Array.from(this.leafNodes).map(id => this.nodes.get(id));
  }

  /**
   * Get nodes at a specific depth
   */
  getNodesAtDepth(depth) {
    return this.getAllNodes().filter(node => node.depth === depth);
  }

  /**
   * Get nodes by status
   */
  getNodesByStatus(status) {
    return this.getAllNodes().filter(node => node.status === status);
  }

  /**
   * Get nodes ready to execute
   */
  getReadyNodes(completedNodes = new Set()) {
    return this.getAllNodes().filter(node => 
      node.status === NodeStatus.PENDING && 
      node.isReady(completedNodes)
    );
  }

  // ==========================================================================
  // Depth Calculation
  // ==========================================================================

  /**
   * Calculate depth for all nodes (distance from root)
   */
  calculateDepths() {
    // Reset depths
    for (const node of this.nodes.values()) {
      node.depth = -1;
    }

    // BFS from root nodes
    const queue = [];
    for (const rootId of this.rootNodes) {
      const node = this.nodes.get(rootId);
      node.depth = 0;
      queue.push(rootId);
    }

    this.maxDepth = 0;

    while (queue.length > 0) {
      const nodeId = queue.shift();
      const node = this.nodes.get(nodeId);
      
      for (const depId of node.dependents) {
        const depNode = this.nodes.get(depId);
        const newDepth = node.depth + 1;
        
        if (depNode.depth < newDepth) {
          depNode.depth = newDepth;
          this.maxDepth = Math.max(this.maxDepth, newDepth);
        }
        
        // Only add to queue if all dependencies have been processed
        const allDepsProcessed = Array.from(depNode.dependencies).every(
          d => this.nodes.get(d)?.depth >= 0
        );
        
        if (allDepsProcessed && !queue.includes(depId)) {
          queue.push(depId);
        }
      }
    }

    return this.maxDepth;
  }

  // ==========================================================================
  // Graph Analysis
  // ==========================================================================

  /**
   * Check if graph is a DAG (no cycles)
   */
  isDAG() {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId) => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = this.nodes.get(nodeId);
      for (const depId of node.dependents) {
        if (hasCycle(depId)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (hasCycle(nodeId)) return false;
    }

    return true;
  }

  /**
   * Get graph statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get graph summary
   */
  getSummary() {
    const totalDuration = this.getAllNodes().reduce(
      (sum, node) => sum + node.getDuration(), 0
    );

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      rootNodes: this.rootNodes.size,
      leafNodes: this.leafNodes.size,
      maxDepth: this.maxDepth,
      totalDuration,
      isDAG: this.isDAG(),
      stats: this.stats
    };
  }

  // ==========================================================================
  // Serialization
  // ==========================================================================

  /**
   * Export graph to JSON
   */
  toJSON() {
    return {
      nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
      edges: Array.from(this.edges.values()),
      rootNodes: Array.from(this.rootNodes),
      leafNodes: Array.from(this.leafNodes),
      maxDepth: this.maxDepth,
      stats: this.stats
    };
  }

  /**
   * Create graph from JSON
   */
  static fromJSON(json) {
    const graph = new DependencyGraph();
    
    // Recreate tasks from nodes
    const tasks = json.nodes.map(n => n.task);
    graph.buildFromTasks(tasks);
    
    return graph;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Identify root and leaf nodes
   */
  _identifyRootAndLeafNodes() {
    this.rootNodes.clear();
    this.leafNodes.clear();

    for (const [nodeId, node] of this.nodes) {
      if (node.dependencies.size === 0) {
        this.rootNodes.add(nodeId);
      }
      if (node.dependents.size === 0) {
        this.leafNodes.add(nodeId);
      }
    }
  }

  /**
   * Update statistics
   */
  _updateStats() {
    let totalDeps = 0;
    let maxDeps = 0;

    for (const node of this.nodes.values()) {
      const depCount = node.dependencies.size;
      totalDeps += depCount;
      maxDeps = Math.max(maxDeps, depCount);
    }

    this.stats = {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      rootCount: this.rootNodes.size,
      leafCount: this.leafNodes.size,
      avgDependencies: this.nodes.size > 0 ? totalDeps / this.nodes.size : 0,
      maxDependencies: maxDeps
    };
  }
}

export default DependencyGraph;
