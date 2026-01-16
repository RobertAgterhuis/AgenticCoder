/**
 * MCP Logger
 * 
 * Structured logging for MCP operations
 * @module mcp/utils/Logger
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStructured: boolean;
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Global logger configuration
 */
let globalConfig: LoggerConfig = {
  level: 'info',
  enableConsole: true,
  enableStructured: false,
};

/**
 * Configure global logger settings
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Structured logger for MCP components
 */
export class Logger {
  private context: string;
  private config: LoggerConfig;

  constructor(context: string, config?: Partial<LoggerConfig>) {
    this.context = context;
    this.config = { ...globalConfig, ...config };
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  /**
   * Create a child logger with additional context
   */
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`, this.config);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      context: this.context,
      message,
      data,
    };

    if (this.config.enableConsole) {
      this.consoleLog(entry);
    }

    if (this.config.enableStructured) {
      this.structuredLog(entry);
    }
  }

  /**
   * Console log output
   */
  private consoleLog(entry: LogEntry): void {
    const prefix = this.config.prefix || 'MCP';
    const timestamp = entry.timestamp.toISOString();
    const levelStr = entry.level.toUpperCase().padEnd(5);
    const contextStr = entry.context;
    
    const baseMessage = `[${prefix}] ${timestamp} ${levelStr} [${contextStr}] ${entry.message}`;
    
    switch (entry.level) {
      case 'debug':
        if (entry.data) {
          console.debug(baseMessage, entry.data);
        } else {
          console.debug(baseMessage);
        }
        break;
      case 'info':
        if (entry.data) {
          console.info(baseMessage, entry.data);
        } else {
          console.info(baseMessage);
        }
        break;
      case 'warn':
        if (entry.data) {
          console.warn(baseMessage, entry.data);
        } else {
          console.warn(baseMessage);
        }
        break;
      case 'error':
        if (entry.data) {
          console.error(baseMessage, entry.data);
        } else {
          console.error(baseMessage);
        }
        break;
    }
  }

  /**
   * Structured JSON log output
   */
  private structuredLog(entry: LogEntry): void {
    const structured = {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    };
    console.log(JSON.stringify(structured));
  }
}

/**
 * Create a logger instance
 */
export function createLogger(context: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(context, config);
}
