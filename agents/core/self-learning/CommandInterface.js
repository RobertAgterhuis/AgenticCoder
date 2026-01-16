/**
 * CommandInterface - SL-11 CLI Commands
 * 
 * Provides CLI commands for self-learning:
 * - @applyLearning
 * - @revertLearning
 * - @viewLearningLog
 * - @viewLearningStats
 * 
 * @implements SelfLearning/11_COMMAND_INTERFACE.md
 */

import { EventEmitter } from 'events';

/**
 * Command types
 */
const CommandType = {
  APPLY_LEARNING: 'applyLearning',
  REVERT_LEARNING: 'revertLearning',
  VIEW_LEARNING_LOG: 'viewLearningLog',
  VIEW_LEARNING_STATS: 'viewLearningStats',
  CONFIGURE: 'configure',
  ANALYZE: 'analyze',
  STATUS: 'status'
};

/**
 * Command result
 */
class CommandResult {
  constructor(data) {
    this.success = data.success !== false;
    this.command = data.command;
    this.message = data.message || '';
    this.data = data.data || null;
    this.error = data.error || null;
    this.timestamp = data.timestamp || new Date();
    this.duration = data.duration || 0;
  }
  
  toJSON() {
    return {
      success: this.success,
      command: this.command,
      message: this.message,
      data: this.data,
      error: this.error,
      timestamp: this.timestamp,
      duration: this.duration
    };
  }
  
  format() {
    if (this.success) {
      return this.message + (this.data ? '\n' + JSON.stringify(this.data, null, 2) : '');
    }
    return `Error: ${this.error || this.message}`;
  }
}

/**
 * Command parser
 */
class CommandParser {
  constructor() {
    this.patterns = {
      applyLearning: /^@applyLearning(?:\s+(.*))?$/i,
      revertLearning: /^@revertLearning(?:\s+(\S+))?$/i,
      viewLearningLog: /^@viewLearningLog(?:\s+(.*))?$/i,
      viewLearningStats: /^@viewLearningStats(?:\s+(.*))?$/i,
      configure: /^@configureLearning(?:\s+(.*))?$/i,
      analyze: /^@analyzeLearning(?:\s+(.*))?$/i,
      status: /^@learningStatus$/i
    };
  }
  
  /**
   * Parse command string
   */
  parse(input) {
    const trimmed = input.trim();
    
    for (const [command, pattern] of Object.entries(this.patterns)) {
      const match = trimmed.match(pattern);
      if (match) {
        return {
          type: command,
          args: this._parseArgs(match[1] || ''),
          raw: trimmed
        };
      }
    }
    
    return null;
  }
  
  /**
   * Parse arguments
   */
  _parseArgs(argsString) {
    if (!argsString) return {};
    
    const args = {};
    
    // Parse key=value pairs
    const kvPattern = /(\w+)=("[^"]*"|'[^']*'|\S+)/g;
    let match;
    
    while ((match = kvPattern.exec(argsString)) !== null) {
      const key = match[1];
      let value = match[2];
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Parse booleans and numbers
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(value) && value !== '') value = Number(value);
      
      args[key] = value;
    }
    
    // If no key=value pairs, treat as positional
    if (Object.keys(args).length === 0 && argsString) {
      args._positional = argsString.split(/\s+/).filter(Boolean);
    }
    
    return args;
  }
  
  /**
   * Check if input is a learning command
   */
  isCommand(input) {
    return input.trim().match(/^@(applyLearning|revertLearning|viewLearningLog|viewLearningStats|configureLearning|analyzeLearning|learningStatus)/i) !== null;
  }
}

/**
 * Apply Learning Handler
 */
class ApplyLearningHandler {
  constructor(selfLearningSystem) {
    this.system = selfLearningSystem;
  }
  
  async execute(args) {
    const startTime = Date.now();
    
    try {
      // Options
      const options = {
        errorId: args.errorId || args._positional?.[0],
        strategy: args.strategy,
        dryRun: args.dryRun === true,
        force: args.force === true
      };
      
      // If specific error ID provided
      if (options.errorId) {
        const result = await this._applyForError(options.errorId, options);
        return new CommandResult({
          success: result.success,
          command: CommandType.APPLY_LEARNING,
          message: result.success 
            ? `Successfully applied learning for error ${options.errorId}`
            : `Failed to apply learning: ${result.error}`,
          data: result,
          duration: Date.now() - startTime
        });
      }
      
      // Apply all pending
      const results = await this._applyAllPending(options);
      
      return new CommandResult({
        success: true,
        command: CommandType.APPLY_LEARNING,
        message: `Applied ${results.applied} fixes (${results.skipped} skipped, ${results.failed} failed)`,
        data: results,
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      return new CommandResult({
        success: false,
        command: CommandType.APPLY_LEARNING,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }
  
  async _applyForError(errorId, options) {
    if (!this.system) {
      return { success: false, error: 'Self-learning system not initialized' };
    }
    
    // This would integrate with the actual system
    // For now, return a placeholder
    return { 
      success: true, 
      errorId,
      fixApplied: true,
      dryRun: options.dryRun 
    };
  }
  
  async _applyAllPending(options) {
    // Would get pending fixes from the system and apply them
    return {
      applied: 0,
      skipped: 0,
      failed: 0,
      dryRun: options.dryRun
    };
  }
}

/**
 * Revert Learning Handler
 */
class RevertLearningHandler {
  constructor(selfLearningSystem) {
    this.system = selfLearningSystem;
  }
  
  async execute(args) {
    const startTime = Date.now();
    
    try {
      const changeId = args.changeId || args._positional?.[0];
      
      if (!changeId) {
        return new CommandResult({
          success: false,
          command: CommandType.REVERT_LEARNING,
          error: 'Change ID required. Usage: @revertLearning <changeId>',
          duration: Date.now() - startTime
        });
      }
      
      // Request rollback
      const result = await this._revert(changeId, args);
      
      return new CommandResult({
        success: result.success,
        command: CommandType.REVERT_LEARNING,
        message: result.success 
          ? `Successfully reverted change ${changeId}`
          : `Failed to revert: ${result.error}`,
        data: result,
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      return new CommandResult({
        success: false,
        command: CommandType.REVERT_LEARNING,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }
  
  async _revert(changeId, options) {
    if (!this.system?.rollbackManager) {
      return { success: false, error: 'Rollback manager not available' };
    }
    
    return this.system.rollbackManager.requestRollback({
      changeId,
      reason: options.reason || 'Manual revert via command',
      initiatedBy: 'CLI Command'
    });
  }
}

/**
 * View Learning Log Handler
 */
class ViewLearningLogHandler {
  constructor(selfLearningSystem) {
    this.system = selfLearningSystem;
  }
  
  async execute(args) {
    const startTime = Date.now();
    
    try {
      const filter = {
        limit: args.limit || 20,
        status: args.status,
        since: args.since ? new Date(args.since) : null,
        component: args.component || args._positional?.[0]
      };
      
      const logs = await this._getLogs(filter);
      
      return new CommandResult({
        success: true,
        command: CommandType.VIEW_LEARNING_LOG,
        message: `Showing ${logs.length} log entries`,
        data: { entries: logs, filter },
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      return new CommandResult({
        success: false,
        command: CommandType.VIEW_LEARNING_LOG,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }
  
  async _getLogs(filter) {
    if (!this.system?.auditTrail) {
      return [];
    }
    
    return this.system.auditTrail.getAuditHistory({
      limit: filter.limit,
      status: filter.status,
      since: filter.since
    });
  }
  
  formatLogs(logs) {
    if (!logs || logs.length === 0) {
      return 'No log entries found.';
    }
    
    const lines = ['=== Learning Log ===', ''];
    
    logs.forEach((log, i) => {
      lines.push(`[${i + 1}] ${log.timestamp?.toISOString?.() || log.timestamp}`);
      lines.push(`    Type: ${log.type || 'unknown'}`);
      lines.push(`    Status: ${log.status || 'unknown'}`);
      if (log.changeId) lines.push(`    Change: ${log.changeId}`);
      if (log.reason) lines.push(`    Reason: ${log.reason}`);
      lines.push('');
    });
    
    return lines.join('\n');
  }
}

/**
 * View Learning Stats Handler
 */
class ViewLearningStatsHandler {
  constructor(selfLearningSystem) {
    this.system = selfLearningSystem;
  }
  
  async execute(args) {
    const startTime = Date.now();
    
    try {
      const stats = await this._getStats(args);
      
      return new CommandResult({
        success: true,
        command: CommandType.VIEW_LEARNING_STATS,
        message: this.formatStats(stats),
        data: stats,
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      return new CommandResult({
        success: false,
        command: CommandType.VIEW_LEARNING_STATS,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }
  
  async _getStats(args) {
    const stats = {
      errors: {
        total: 0,
        resolved: 0,
        pending: 0
      },
      fixes: {
        proposed: 0,
        applied: 0,
        rejected: 0,
        rolledBack: 0
      },
      successRate: 0,
      uptime: 0
    };
    
    // Get from monitoring system
    if (this.system?.monitoring) {
      const summary = this.system.monitoring.getSummary();
      stats.errors.total = summary.overview?.errorsTotal || 0;
      stats.errors.resolved = summary.overview?.errorsResolved || 0;
      stats.errors.pending = stats.errors.total - stats.errors.resolved;
      stats.fixes.applied = summary.overview?.fixesApplied || 0;
      stats.fixes.rejected = summary.overview?.fixesRejected || 0;
      stats.successRate = summary.overview?.fixSuccessRate || 0;
    }
    
    // Get from rollback manager
    if (this.system?.rollbackManager) {
      const rbStats = this.system.rollbackManager.getStats();
      stats.fixes.rolledBack = rbStats.totalRollbacks || 0;
    }
    
    return stats;
  }
  
  formatStats(stats) {
    const lines = [
      '=== Self-Learning Statistics ===',
      '',
      '--- Errors ---',
      `Total Captured: ${stats.errors.total}`,
      `Resolved: ${stats.errors.resolved}`,
      `Pending: ${stats.errors.pending}`,
      '',
      '--- Fixes ---',
      `Proposed: ${stats.fixes.proposed}`,
      `Applied: ${stats.fixes.applied}`,
      `Rejected: ${stats.fixes.rejected}`,
      `Rolled Back: ${stats.fixes.rolledBack}`,
      '',
      `Success Rate: ${(stats.successRate * 100).toFixed(1)}%`
    ];
    
    return lines.join('\n');
  }
}

/**
 * Main Command Interface
 */
class CommandInterface extends EventEmitter {
  constructor(selfLearningSystem = null, options = {}) {
    super();
    
    this.system = selfLearningSystem;
    this.parser = new CommandParser();
    
    this.options = {
      prefix: options.prefix || '@',
      enabled: options.enabled !== false,
      ...options
    };
    
    // Initialize handlers
    this.handlers = {
      applyLearning: new ApplyLearningHandler(selfLearningSystem),
      revertLearning: new RevertLearningHandler(selfLearningSystem),
      viewLearningLog: new ViewLearningLogHandler(selfLearningSystem),
      viewLearningStats: new ViewLearningStatsHandler(selfLearningSystem)
    };
    
    // Command history
    this.history = [];
  }
  
  /**
   * Set the self-learning system reference
   */
  setSystem(system) {
    this.system = system;
    
    // Update handlers
    Object.values(this.handlers).forEach(handler => {
      handler.system = system;
    });
  }
  
  /**
   * Execute a command string
   */
  async execute(input) {
    if (!this.options.enabled) {
      return new CommandResult({
        success: false,
        command: null,
        error: 'Command interface is disabled'
      });
    }
    
    // Parse command
    const parsed = this.parser.parse(input);
    
    if (!parsed) {
      return new CommandResult({
        success: false,
        command: null,
        error: `Unknown command: ${input}`
      });
    }
    
    // Get handler
    const handler = this.handlers[parsed.type];
    
    if (!handler) {
      return new CommandResult({
        success: false,
        command: parsed.type,
        error: `No handler for command: ${parsed.type}`
      });
    }
    
    // Execute
    const result = await handler.execute(parsed.args);
    
    // Store in history
    this.history.push({
      input,
      parsed,
      result,
      timestamp: new Date()
    });
    
    this.emit('command:executed', { input, result });
    
    return result;
  }
  
  /**
   * Check if input is a command
   */
  isCommand(input) {
    return this.parser.isCommand(input);
  }
  
  /**
   * Get available commands
   */
  getAvailableCommands() {
    return [
      {
        name: '@applyLearning',
        description: 'Apply learned fixes',
        usage: '@applyLearning [errorId=<id>] [dryRun=true]'
      },
      {
        name: '@revertLearning',
        description: 'Revert a learned change',
        usage: '@revertLearning <changeId> [reason="..."]'
      },
      {
        name: '@viewLearningLog',
        description: 'View learning activity log',
        usage: '@viewLearningLog [limit=20] [status=<status>]'
      },
      {
        name: '@viewLearningStats',
        description: 'View learning statistics',
        usage: '@viewLearningStats'
      },
      {
        name: '@learningStatus',
        description: 'View current learning system status',
        usage: '@learningStatus'
      }
    ];
  }
  
  /**
   * Get command history
   */
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }
  
  /**
   * Generate help text
   */
  getHelp() {
    const commands = this.getAvailableCommands();
    
    let help = '=== Self-Learning Commands ===\n\n';
    
    commands.forEach(cmd => {
      help += `${cmd.name}\n`;
      help += `  ${cmd.description}\n`;
      help += `  Usage: ${cmd.usage}\n\n`;
    });
    
    return help;
  }
}

export {
  CommandInterface,
  CommandParser,
  CommandResult,
  CommandType,
  ApplyLearningHandler,
  RevertLearningHandler,
  ViewLearningLogHandler,
  ViewLearningStatsHandler
};
