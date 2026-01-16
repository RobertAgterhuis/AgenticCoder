/**
 * ScheduleGenerator.js
 * 
 * Generates complete execution schedules by combining analysis from all
 * dependency resolver components. Outputs timeline, resource allocation,
 * and execution-schedule.json format.
 * 
 * @module task/dependency-resolver/ScheduleGenerator
 */

import { EventEmitter } from 'events';

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Schedule output formats
 */
export const ScheduleFormat = {
  JSON: 'json',
  MARKDOWN: 'markdown',
  TIMELINE: 'timeline'
};

/**
 * Schedule status
 */
export const ScheduleStatus = {
  VALID: 'valid',
  WARNING: 'warning',
  INVALID: 'invalid'
};

// ============================================================================
// TimeSlot Class
// ============================================================================

/**
 * Represents a time slot in the schedule
 */
export class TimeSlot {
  constructor(startHour, endHour) {
    this.startHour = startHour;
    this.endHour = endHour;
    this.tasks = [];
    this.agentAssignments = new Map();
  }

  /**
   * Add task to time slot
   */
  addTask(task, agent) {
    this.tasks.push(task);
    
    if (agent) {
      if (!this.agentAssignments.has(agent)) {
        this.agentAssignments.set(agent, []);
      }
      this.agentAssignments.get(agent).push(task.id);
    }
  }

  /**
   * Check if time slot is empty
   */
  isEmpty() {
    return this.tasks.length === 0;
  }

  /**
   * Get concurrent task count
   */
  getConcurrency() {
    return this.tasks.length;
  }
}

// ============================================================================
// ExecutionSchedule Class
// ============================================================================

/**
 * Complete execution schedule
 */
export class ExecutionSchedule {
  constructor() {
    this.blocks = [];
    this.timeline = [];
    this.criticalPath = null;
    this.metadata = {
      generatedAt: new Date().toISOString(),
      totalHours: 0,
      totalTasks: 0,
      maxConcurrency: 0
    };
    this.warnings = [];
    this.status = ScheduleStatus.VALID;
  }

  /**
   * Add execution block
   */
  addBlock(block) {
    this.blocks.push(block);
  }

  /**
   * Set critical path info
   */
  setCriticalPath(criticalPathResult) {
    this.criticalPath = {
      path: criticalPathResult.criticalPath,
      totalHours: criticalPathResult.totalDuration,
      bottlenecks: criticalPathResult.bottlenecks
    };
  }

  /**
   * Add warning
   */
  addWarning(warning) {
    this.warnings.push(warning);
    if (this.status === ScheduleStatus.VALID) {
      this.status = ScheduleStatus.WARNING;
    }
  }

  /**
   * Mark as invalid
   */
  markInvalid(reason) {
    this.status = ScheduleStatus.INVALID;
    this.addWarning({ type: 'invalid', reason });
  }

  /**
   * Export to standard format
   */
  toJSON() {
    return {
      schedule: {
        status: this.status,
        generated_at: this.metadata.generatedAt,
        summary: {
          total_hours: this.metadata.totalHours,
          estimated_days: Math.ceil(this.metadata.totalHours / 8),
          total_tasks: this.metadata.totalTasks,
          max_concurrency: this.metadata.maxConcurrency,
          block_count: this.blocks.length
        }
      },
      critical_path: this.criticalPath,
      execution_blocks: this.blocks.map(block => block.toJSON ? block.toJSON() : block),
      timeline: this.timeline,
      warnings: this.warnings
    };
  }

  /**
   * Export to markdown format
   */
  toMarkdown() {
    let md = '# Execution Schedule\n\n';
    
    // Summary
    md += '## Summary\n\n';
    md += `- **Total Duration**: ${this.metadata.totalHours} hours (~${Math.ceil(this.metadata.totalHours / 8)} days)\n`;
    md += `- **Total Tasks**: ${this.metadata.totalTasks}\n`;
    md += `- **Max Concurrency**: ${this.metadata.maxConcurrency}\n`;
    md += `- **Execution Blocks**: ${this.blocks.length}\n\n`;

    // Critical Path
    if (this.criticalPath) {
      md += '## Critical Path\n\n';
      md += `Duration: ${this.criticalPath.totalHours} hours\n\n`;
      md += '```\n';
      md += this.criticalPath.path.join(' → ');
      md += '\n```\n\n';
    }

    // Execution Blocks
    md += '## Execution Blocks\n\n';
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      md += `### Block ${i + 1}${block.mode ? ` (${block.mode})` : ''}\n\n`;
      md += `- **Hours ${block.startHour}-${block.endHour}**\n`;
      
      if (block.tasks) {
        md += `- **Tasks**: ${block.tasks.map(t => t.id || t).join(', ')}\n`;
      }
      md += '\n';
    }

    // Warnings
    if (this.warnings.length > 0) {
      md += '## Warnings\n\n';
      for (const warning of this.warnings) {
        md += `- ⚠️ ${warning.type || 'Warning'}: ${warning.reason || warning.message || JSON.stringify(warning)}\n`;
      }
    }

    return md;
  }
}

// ============================================================================
// ScheduleGenerator Class
// ============================================================================

/**
 * Generates execution schedules from dependency analysis
 */
export class ScheduleGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      workHoursPerDay: 8,
      bufferPercent: 10,        // Add buffer to estimates
      includeTimeline: true,
      validateResources: true,
      ...options
    };

    // Resource constraints
    this.resourceConstraints = options.resourceConstraints || {};
    
    // Statistics
    this.stats = {
      schedulesGenerated: 0,
      totalGenerationTimeMs: 0
    };
  }

  // ==========================================================================
  // Main Generation
  // ==========================================================================

  /**
   * Generate complete execution schedule
   */
  generate(graph, sortedOrder, parallelBlocks, criticalPathResult) {
    const startTime = Date.now();
    const schedule = new ExecutionSchedule();

    try {
      // Validate inputs
      this._validateInputs(graph, sortedOrder, parallelBlocks, schedule);

      // Set critical path
      if (criticalPathResult) {
        schedule.setCriticalPath(criticalPathResult);
      }

      // Generate execution blocks with timing
      this._generateBlocks(graph, parallelBlocks, schedule);

      // Generate timeline if requested
      if (this.options.includeTimeline) {
        this._generateTimeline(graph, sortedOrder, schedule);
      }

      // Validate resource constraints
      if (this.options.validateResources) {
        this._validateResources(schedule);
      }

      // Calculate metadata
      this._calculateMetadata(schedule, graph);

      // Update statistics
      this.stats.schedulesGenerated++;
      this.stats.totalGenerationTimeMs += Date.now() - startTime;

      this.emit('schedule:generated', schedule);

      return schedule;

    } catch (error) {
      schedule.markInvalid(error.message);
      this.emit('error', error);
      return schedule;
    }
  }

  /**
   * Generate schedule from all components
   */
  generateFromComponents({ graph, sortedOrder, blocks, criticalPath }) {
    return this.generate(graph, sortedOrder, blocks, criticalPath);
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate inputs before generation
   */
  _validateInputs(graph, sortedOrder, parallelBlocks, schedule) {
    if (!graph) {
      schedule.addWarning({ type: 'missing_input', message: 'No graph provided' });
    }

    if (!sortedOrder || sortedOrder.length === 0) {
      schedule.addWarning({ type: 'missing_input', message: 'No sorted order provided' });
    }

    if (!parallelBlocks || parallelBlocks.length === 0) {
      schedule.addWarning({ type: 'missing_input', message: 'No parallel blocks provided' });
    }

    // Verify all tasks in sorted order exist in graph
    if (graph && sortedOrder) {
      for (const taskId of sortedOrder) {
        if (!graph.getNode(taskId)) {
          schedule.addWarning({
            type: 'missing_task',
            message: `Task "${taskId}" in sorted order not found in graph`
          });
        }
      }
    }
  }

  /**
   * Validate resource constraints
   */
  _validateResources(schedule) {
    const maxConcurrentByAgent = new Map();

    for (const block of schedule.blocks) {
      if (!block.tasks) continue;

      // Count concurrent tasks per agent
      const agentCounts = new Map();
      for (const task of block.tasks) {
        const agent = task.agent || 'unassigned';
        agentCounts.set(agent, (agentCounts.get(agent) || 0) + 1);
      }

      // Update max concurrent
      for (const [agent, count] of agentCounts) {
        const current = maxConcurrentByAgent.get(agent) || 0;
        maxConcurrentByAgent.set(agent, Math.max(current, count));
      }
    }

    // Check against constraints
    for (const [agent, maxCount] of maxConcurrentByAgent) {
      const constraint = this.resourceConstraints[agent] || this.resourceConstraints.default;
      if (constraint && constraint.maxConcurrent && maxCount > constraint.maxConcurrent) {
        schedule.addWarning({
          type: 'resource_constraint',
          agent,
          message: `Agent "${agent}" has ${maxCount} concurrent tasks, exceeds limit of ${constraint.maxConcurrent}`
        });
      }
    }
  }

  // ==========================================================================
  // Block Generation
  // ==========================================================================

  /**
   * Generate execution blocks with timing
   */
  _generateBlocks(graph, parallelBlocks, schedule) {
    let currentHour = 0;

    for (const block of parallelBlocks) {
      // Get tasks in block
      const tasks = [];
      const taskIds = block.tasks || block.taskIds || [];
      
      for (const taskId of taskIds) {
        const node = graph ? graph.getNode(taskId) : null;
        if (node) {
          tasks.push({
            id: taskId,
            title: node.task.title || node.task.name || taskId,
            agent: node.task.agent,
            duration: node.getDuration(),
            estimatedStart: currentHour,
            estimatedEnd: currentHour + node.getDuration()
          });
        } else {
          tasks.push({ id: taskId });
        }
      }

      // Calculate block duration
      const blockDuration = block.estimatedHours || 
        (tasks.length > 0 ? Math.max(...tasks.map(t => t.duration || 0)) : 0);

      // Add buffer
      const bufferedDuration = blockDuration * (1 + this.options.bufferPercent / 100);

      schedule.addBlock({
        index: schedule.blocks.length,
        mode: block.mode,
        tasks,
        taskCount: tasks.length,
        startHour: currentHour,
        endHour: currentHour + bufferedDuration,
        duration: bufferedDuration,
        agents: [...new Set(tasks.map(t => t.agent).filter(Boolean))]
      });

      currentHour += bufferedDuration;
    }
  }

  // ==========================================================================
  // Timeline Generation
  // ==========================================================================

  /**
   * Generate hour-by-hour timeline
   */
  _generateTimeline(graph, sortedOrder, schedule) {
    const timeline = [];
    const totalHours = Math.ceil(schedule.blocks.reduce(
      (sum, block) => Math.max(sum, block.endHour || 0), 0
    ));

    // Create time slots
    for (let hour = 0; hour < totalHours; hour++) {
      const slot = new TimeSlot(hour, hour + 1);

      // Find tasks active during this hour
      for (const block of schedule.blocks) {
        if (block.startHour <= hour && block.endHour > hour) {
          for (const task of block.tasks) {
            const taskStart = task.estimatedStart || block.startHour;
            const taskEnd = task.estimatedEnd || block.endHour;
            
            if (taskStart <= hour && taskEnd > hour) {
              slot.addTask(task, task.agent);
            }
          }
        }
      }

      timeline.push({
        hour,
        day: Math.floor(hour / this.options.workHoursPerDay) + 1,
        hourOfDay: hour % this.options.workHoursPerDay,
        activeTasks: slot.tasks.map(t => t.id),
        concurrency: slot.getConcurrency(),
        agentAssignments: Object.fromEntries(slot.agentAssignments)
      });
    }

    schedule.timeline = timeline;
  }

  // ==========================================================================
  // Metadata Calculation
  // ==========================================================================

  /**
   * Calculate schedule metadata
   */
  _calculateMetadata(schedule, graph) {
    // Total hours
    schedule.metadata.totalHours = schedule.blocks.reduce(
      (max, block) => Math.max(max, block.endHour || 0), 0
    );

    // Total tasks
    const allTasks = new Set();
    for (const block of schedule.blocks) {
      for (const task of block.tasks) {
        allTasks.add(task.id);
      }
    }
    schedule.metadata.totalTasks = allTasks.size;

    // Max concurrency
    schedule.metadata.maxConcurrency = Math.max(
      ...schedule.blocks.map(b => b.taskCount || 0),
      0
    );

    // Add timing breakdown by agent
    const agentHours = new Map();
    for (const block of schedule.blocks) {
      for (const task of block.tasks) {
        const agent = task.agent || 'unassigned';
        const hours = agentHours.get(agent) || 0;
        agentHours.set(agent, hours + (task.duration || 0));
      }
    }
    schedule.metadata.agentWorkload = Object.fromEntries(agentHours);
  }

  // ==========================================================================
  // Export Methods
  // ==========================================================================

  /**
   * Export schedule to file format
   */
  exportToFormat(schedule, format) {
    switch (format) {
      case ScheduleFormat.JSON:
        return JSON.stringify(schedule.toJSON(), null, 2);
      
      case ScheduleFormat.MARKDOWN:
        return schedule.toMarkdown();
      
      case ScheduleFormat.TIMELINE:
        return this._exportTimeline(schedule);
      
      default:
        return JSON.stringify(schedule.toJSON(), null, 2);
    }
  }

  /**
   * Export timeline as ASCII visualization
   */
  _exportTimeline(schedule) {
    const lines = ['Timeline Visualization', '='.repeat(50), ''];
    const agents = new Set();

    // Collect all agents
    for (const block of schedule.blocks) {
      for (const task of block.tasks) {
        if (task.agent) agents.add(task.agent);
      }
    }

    // Header
    const header = 'Hour  | ' + [...agents].join(' | ');
    lines.push(header);
    lines.push('-'.repeat(header.length));

    // Timeline rows
    for (const slot of schedule.timeline) {
      const row = [`${String(slot.hour).padStart(4)} `];
      
      for (const agent of agents) {
        const tasks = slot.agentAssignments[agent] || [];
        if (tasks.length > 0) {
          row.push(tasks[0].substring(0, 6).padEnd(8));
        } else {
          row.push('   -    ');
        }
      }
      
      lines.push(row.join(' | '));
    }

    return lines.join('\n');
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Get generation statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

export default ScheduleGenerator;
