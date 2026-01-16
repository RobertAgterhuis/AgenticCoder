/**
 * ParallelBlocker.js
 * 
 * Identifies groups of tasks that can run in parallel and creates
 * execution blocks for optimal scheduling.
 * 
 * @module task/dependency-resolver/ParallelBlocker
 */

import { EventEmitter } from 'events';

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Block execution modes
 */
export const BlockMode = {
  PARALLEL: 'parallel',       // All tasks run simultaneously
  SEQUENTIAL: 'sequential',   // Tasks run one after another
  MIXED: 'mixed'              // Some parallel, some sequential
};

/**
 * Parallelization strategies
 */
export const ParallelStrategy = {
  MAXIMUM: 'maximum',           // Maximum parallelization
  RESOURCE_AWARE: 'resource_aware',  // Respect resource limits
  AGENT_AWARE: 'agent_aware',   // Group by agent
  CONSERVATIVE: 'conservative'  // Minimal parallelization
};

// ============================================================================
// ExecutionBlock Class
// ============================================================================

/**
 * Represents a block of tasks to be executed
 */
export class ExecutionBlock {
  constructor(options = {}) {
    this.id = options.id || `block-${Date.now()}`;
    this.sequence = options.sequence || 1;
    this.tasks = options.tasks || [];
    this.mode = options.mode || BlockMode.PARALLEL;
    this.dependsOnBlocks = options.dependsOnBlocks || [];
    this.description = options.description || '';
    
    // Timing estimates
    this.estimatedHours = 0;
    this.estimatedDays = 0;
    
    // Resources
    this.resourcesRequired = new Map();
    
    // Metadata
    this.metadata = options.metadata || {};
  }

  /**
   * Add a task to the block
   */
  addTask(taskId) {
    if (!this.tasks.includes(taskId)) {
      this.tasks.push(taskId);
    }
  }

  /**
   * Remove a task from the block
   */
  removeTask(taskId) {
    const index = this.tasks.indexOf(taskId);
    if (index > -1) {
      this.tasks.splice(index, 1);
    }
  }

  /**
   * Check if block contains task
   */
  hasTask(taskId) {
    return this.tasks.includes(taskId);
  }

  /**
   * Get task count
   */
  getTaskCount() {
    return this.tasks.length;
  }

  /**
   * Calculate timing from graph
   */
  calculateTiming(graph, workingHoursPerDay = 8) {
    let totalHours = 0;
    let maxHours = 0;
    
    for (const taskId of this.tasks) {
      const node = graph.getNode(taskId);
      if (node) {
        const hours = node.getDuration();
        totalHours += hours;
        maxHours = Math.max(maxHours, hours);
      }
    }

    // Parallel: duration = max task duration
    // Sequential: duration = sum of all durations
    this.estimatedHours = this.mode === BlockMode.PARALLEL ? maxHours : totalHours;
    this.estimatedDays = Math.ceil(this.estimatedHours / workingHoursPerDay);
    
    return {
      estimatedHours: this.estimatedHours,
      estimatedDays: this.estimatedDays,
      totalTaskHours: totalHours
    };
  }

  /**
   * Calculate resource requirements
   */
  calculateResources(graph) {
    this.resourcesRequired.clear();
    
    for (const taskId of this.tasks) {
      const node = graph.getNode(taskId);
      if (node) {
        const agent = node.task.agent || 'unassigned';
        const current = this.resourcesRequired.get(agent) || 0;
        this.resourcesRequired.set(agent, current + 1);
      }
    }

    return Object.fromEntries(this.resourcesRequired);
  }

  /**
   * Serialize block
   */
  toJSON() {
    return {
      block_id: this.id,
      sequence: this.sequence,
      parallel: this.mode === BlockMode.PARALLEL,
      mode: this.mode,
      tasks: this.tasks,
      task_count: this.tasks.length,
      depends_on_blocks: this.dependsOnBlocks,
      description: this.description,
      estimated_hours: this.estimatedHours,
      estimated_days: this.estimatedDays,
      resources_required: Object.fromEntries(this.resourcesRequired),
      metadata: this.metadata
    };
  }
}

// ============================================================================
// ParallelBlocker Class
// ============================================================================

/**
 * Creates execution blocks from a sorted task list
 */
export class ParallelBlocker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      strategy: ParallelStrategy.RESOURCE_AWARE,
      maxParallelTasks: 10,
      maxParallelPerAgent: 2,
      workingHoursPerDay: 8,
      allowParallelSameAgent: true,
      ...options
    };

    // Results
    this.blocks = [];
    
    // Statistics
    this.stats = {
      totalBlocks: 0,
      parallelBlocks: 0,
      sequentialBlocks: 0,
      maxBlockSize: 0,
      avgBlockSize: 0
    };
  }

  // ==========================================================================
  // Main Methods
  // ==========================================================================

  /**
   * Create execution blocks from sorted order or levels
   * @param {DependencyGraph} graph - The dependency graph
   * @param {Array} sortedOrderOrLevels - Either a flat sorted order array or levels (array of arrays)
   * @param {Object} options - Optional strategy overrides
   */
  createBlocks(graph, sortedOrderOrLevels, options = {}) {
    this._reset();

    // Apply any option overrides
    if (options.strategy) {
      this.options.strategy = options.strategy;
    }
    // Map maxConcurrency to maxParallelTasks
    if (options.maxConcurrency !== undefined) {
      this.options.maxParallelTasks = options.maxConcurrency;
    }

    // Convert flat array to levels if needed
    let levels;
    if (sortedOrderOrLevels && sortedOrderOrLevels.length > 0) {
      if (Array.isArray(sortedOrderOrLevels[0])) {
        // Already levels format
        levels = sortedOrderOrLevels;
      } else {
        // Flat sorted order - compute levels from graph
        levels = this._computeLevelsFromOrder(graph, sortedOrderOrLevels);
      }
    } else {
      levels = [];
    }

    try {
      let result;
      
      switch (this.options.strategy) {
        case ParallelStrategy.MAXIMUM:
          result = this._createMaximumParallel(graph, levels);
          break;
        case ParallelStrategy.RESOURCE_AWARE:
          result = this._createResourceAware(graph, levels);
          break;
        case ParallelStrategy.AGENT_AWARE:
          result = this._createAgentAware(graph, levels);
          break;
        case ParallelStrategy.CONSERVATIVE:
          result = this._createConservative(graph, levels);
          break;
        default:
          result = this._createResourceAware(graph, levels);
      }

      this._calculateAllTimings(graph);
      this._updateStats();

      this.emit('blocks:created', {
        blockCount: this.blocks.length,
        strategy: this.options.strategy
      });

      // Add success flag and maxParallelism to result
      return {
        ...result,
        success: true,
        maxParallelism: this.stats.maxParallelism || 1
      };

    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        error: error.message,
        blocks: [],
        maxParallelism: 0
      };
    }
  }

  /**
   * Compute levels from a flat sorted order using graph depth info
   */
  _computeLevelsFromOrder(graph, sortedOrder) {
    const levels = [];
    const nodeDepths = new Map();
    
    // Calculate depth for each node
    for (const nodeId of sortedOrder) {
      const node = graph.getNode(nodeId);
      if (!node) continue;
      
      let maxDepDepth = -1;
      for (const depId of node.dependencies) {
        const depDepth = nodeDepths.get(depId) || 0;
        maxDepDepth = Math.max(maxDepDepth, depDepth);
      }
      
      const depth = maxDepDepth + 1;
      nodeDepths.set(nodeId, depth);
      
      // Add to appropriate level
      while (levels.length <= depth) {
        levels.push([]);
      }
      levels[depth].push(nodeId);
    }
    
    return levels;
  }

  /**
   * Get all blocks
   */
  getBlocks() {
    return [...this.blocks];
  }

  /**
   * Get block by ID
   */
  getBlock(blockId) {
    return this.blocks.find(b => b.id === blockId);
  }

  /**
   * Get block containing task
   */
  getBlockForTask(taskId) {
    return this.blocks.find(b => b.hasTask(taskId));
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  // ==========================================================================
  // Strategy: Maximum Parallelization
  // ==========================================================================

  /**
   * Create blocks with maximum parallelization
   * Each dependency level becomes one parallel block
   */
  _createMaximumParallel(graph, levels) {
    this.blocks = [];

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      
      const block = new ExecutionBlock({
        id: `block-${i + 1}`,
        sequence: i + 1,
        tasks: [...level],
        mode: level.length > 1 ? BlockMode.PARALLEL : BlockMode.SEQUENTIAL,
        dependsOnBlocks: i > 0 ? [`block-${i}`] : [],
        description: `Level ${i + 1}: ${level.length} task(s)`
      });

      block.calculateResources(graph);
      this.blocks.push(block);
    }

    return {
      blocks: this.blocks.map(b => b.toJSON()),
      strategy: ParallelStrategy.MAXIMUM
    };
  }

  // ==========================================================================
  // Strategy: Resource-Aware
  // ==========================================================================

  /**
   * Create blocks respecting resource limits
   */
  _createResourceAware(graph, levels) {
    this.blocks = [];
    let blockSequence = 1;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const levelBlocks = this._splitByResourceLimits(graph, level);
      
      for (const blockTasks of levelBlocks) {
        const block = new ExecutionBlock({
          id: `block-${blockSequence}`,
          sequence: blockSequence,
          tasks: blockTasks,
          mode: blockTasks.length > 1 ? BlockMode.PARALLEL : BlockMode.SEQUENTIAL,
          dependsOnBlocks: this._getDependentBlocks(graph, blockTasks),
          description: `Level ${i + 1}, Part ${levelBlocks.indexOf(blockTasks) + 1}`
        });

        block.calculateResources(graph);
        this.blocks.push(block);
        blockSequence++;
      }
    }

    return {
      blocks: this.blocks.map(b => b.toJSON()),
      strategy: ParallelStrategy.RESOURCE_AWARE
    };
  }

  /**
   * Split level tasks by resource limits
   */
  _splitByResourceLimits(graph, tasks) {
    if (tasks.length <= this.options.maxParallelTasks) {
      return [tasks];
    }

    const blocks = [];
    let currentBlock = [];
    const agentCounts = new Map();

    for (const taskId of tasks) {
      const node = graph.getNode(taskId);
      const agent = node?.task.agent || 'unassigned';
      const currentAgentCount = agentCounts.get(agent) || 0;

      // Check if we can add to current block
      const canAdd = 
        currentBlock.length < this.options.maxParallelTasks &&
        (this.options.allowParallelSameAgent || 
         currentAgentCount < this.options.maxParallelPerAgent);

      if (canAdd) {
        currentBlock.push(taskId);
        agentCounts.set(agent, currentAgentCount + 1);
      } else {
        // Start new block
        if (currentBlock.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = [taskId];
        agentCounts.clear();
        agentCounts.set(agent, 1);
      }
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  // ==========================================================================
  // Strategy: Agent-Aware
  // ==========================================================================

  /**
   * Create blocks grouped by agent
   */
  _createAgentAware(graph, levels) {
    this.blocks = [];
    let blockSequence = 1;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      
      // Group by agent
      const byAgent = new Map();
      for (const taskId of level) {
        const node = graph.getNode(taskId);
        const agent = node?.task.agent || 'unassigned';
        
        if (!byAgent.has(agent)) {
          byAgent.set(agent, []);
        }
        byAgent.get(agent).push(taskId);
      }

      // Create block per agent group
      for (const [agent, agentTasks] of byAgent) {
        // Further split if too many for one agent
        const chunks = this._chunkArray(agentTasks, this.options.maxParallelPerAgent);
        
        for (const chunk of chunks) {
          const block = new ExecutionBlock({
            id: `block-${blockSequence}`,
            sequence: blockSequence,
            tasks: chunk,
            mode: chunk.length > 1 ? BlockMode.PARALLEL : BlockMode.SEQUENTIAL,
            dependsOnBlocks: this._getDependentBlocks(graph, chunk),
            description: `${agent}: ${chunk.length} task(s)`,
            metadata: { agent }
          });

          block.calculateResources(graph);
          this.blocks.push(block);
          blockSequence++;
        }
      }
    }

    return {
      blocks: this.blocks.map(b => b.toJSON()),
      strategy: ParallelStrategy.AGENT_AWARE
    };
  }

  // ==========================================================================
  // Strategy: Conservative
  // ==========================================================================

  /**
   * Create blocks with minimal parallelization
   * Only parallelize truly independent tasks
   */
  _createConservative(graph, levels) {
    this.blocks = [];
    let blockSequence = 1;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      
      // Conservative: max 2-3 parallel tasks
      const chunks = this._chunkArray(level, 3);
      
      for (const chunk of chunks) {
        const block = new ExecutionBlock({
          id: `block-${blockSequence}`,
          sequence: blockSequence,
          tasks: chunk,
          mode: chunk.length > 1 ? BlockMode.PARALLEL : BlockMode.SEQUENTIAL,
          dependsOnBlocks: this._getDependentBlocks(graph, chunk),
          description: `Conservative block ${blockSequence}`
        });

        block.calculateResources(graph);
        this.blocks.push(block);
        blockSequence++;
      }
    }

    return {
      blocks: this.blocks.map(b => b.toJSON()),
      strategy: ParallelStrategy.CONSERVATIVE
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get blocks that tasks depend on
   */
  _getDependentBlocks(graph, tasks) {
    const dependentBlockIds = new Set();

    for (const taskId of tasks) {
      const node = graph.getNode(taskId);
      if (!node) continue;

      for (const depId of node.dependencies) {
        // Find which block contains the dependency
        for (const block of this.blocks) {
          if (block.hasTask(depId)) {
            dependentBlockIds.add(block.id);
          }
        }
      }
    }

    return Array.from(dependentBlockIds);
  }

  /**
   * Calculate timing for all blocks
   */
  _calculateAllTimings(graph) {
    for (const block of this.blocks) {
      block.calculateTiming(graph, this.options.workingHoursPerDay);
    }
  }

  /**
   * Update statistics
   */
  _updateStats() {
    const blockSizes = this.blocks.map(b => b.getTaskCount());
    
    // Calculate max parallelism (max tasks in any single block)
    let maxParallelism = 1;
    for (const block of this.blocks) {
      if (block.mode === BlockMode.PARALLEL) {
        maxParallelism = Math.max(maxParallelism, block.getTaskCount());
      }
    }
    
    this.stats = {
      totalBlocks: this.blocks.length,
      parallelBlocks: this.blocks.filter(b => b.mode === BlockMode.PARALLEL).length,
      sequentialBlocks: this.blocks.filter(b => b.mode === BlockMode.SEQUENTIAL).length,
      maxBlockSize: Math.max(...blockSizes, 0),
      maxParallelism,
      avgBlockSize: blockSizes.length > 0 
        ? blockSizes.reduce((a, b) => a + b, 0) / blockSizes.length 
        : 0
    };
  }

  /**
   * Split array into chunks
   */
  _chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Reset state
   */
  _reset() {
    this.blocks = [];
    this.stats = {
      totalBlocks: 0,
      parallelBlocks: 0,
      sequentialBlocks: 0,
      maxBlockSize: 0,
      avgBlockSize: 0
    };
  }

  // ==========================================================================
  // Analysis Methods
  // ==========================================================================

  /**
   * Estimate total execution time
   */
  estimateTotalTime() {
    let totalHours = 0;
    
    // Sequential execution of blocks
    for (const block of this.blocks) {
      totalHours += block.estimatedHours;
    }

    return {
      totalHours,
      totalDays: Math.ceil(totalHours / this.options.workingHoursPerDay)
    };
  }

  /**
   * Get parallelization efficiency
   */
  getEfficiency(graph) {
    // Sum of all task durations (sequential time)
    let sequentialTime = 0;
    for (const node of graph.getAllNodes()) {
      sequentialTime += node.getDuration();
    }

    // Parallel time (sum of block times)
    const parallelTime = this.estimateTotalTime().totalHours;

    return {
      sequentialTime,
      parallelTime,
      speedup: parallelTime > 0 ? sequentialTime / parallelTime : 0,
      efficiency: parallelTime > 0 ? (sequentialTime / parallelTime) / this.stats.maxBlockSize : 0
    };
  }
}

export default ParallelBlocker;
