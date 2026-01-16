/**
 * MCP Error Types
 * 
 * Error taxonomy for MCP operations
 * @module mcp/errors/MCPError
 */

/**
 * Base MCP Error
 */
export class MCPError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    options?: {
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.details = options?.details;
    
    if (options?.cause) {
      this.cause = options.cause;
    }

    // Maintain proper stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

/**
 * Connection Error - Failed to connect to MCP server
 */
export class ConnectionError extends MCPError {
  readonly serverId: string;

  constructor(serverId: string, message: string, cause?: Error) {
    super('CONNECTION_ERROR', message, {
      retryable: true,
      details: { serverId },
      cause,
    });
    this.name = 'ConnectionError';
    this.serverId = serverId;
  }
}

/**
 * Tool Execution Error - Tool call failed
 */
export class ToolExecutionError extends MCPError {
  readonly serverId: string;
  readonly toolName: string;

  constructor(
    serverId: string,
    toolName: string,
    message: string,
    options?: {
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super('TOOL_EXECUTION_ERROR', message, {
      retryable: options?.retryable ?? false,
      details: { serverId, toolName, ...options?.details },
      cause: options?.cause,
    });
    this.name = 'ToolExecutionError';
    this.serverId = serverId;
    this.toolName = toolName;
  }
}

/**
 * Timeout Error - Operation timed out
 */
export class TimeoutError extends MCPError {
  readonly operation: string;
  readonly timeoutMs: number;

  constructor(operation: string, timeoutMs: number) {
    super('TIMEOUT_ERROR', `Operation '${operation}' timed out after ${timeoutMs}ms`, {
      retryable: true,
      details: { operation, timeoutMs },
    });
    this.name = 'TimeoutError';
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Circuit Breaker Open Error - Circuit breaker is open
 */
export class CircuitBreakerOpenError extends MCPError {
  readonly serverId: string;
  readonly resetTime: Date;

  constructor(serverId: string, resetTime: Date) {
    super(
      'CIRCUIT_BREAKER_OPEN',
      `Circuit breaker is open for server '${serverId}'. Reset at ${resetTime.toISOString()}`,
      {
        retryable: false,
        details: { serverId, resetTime: resetTime.toISOString() },
      }
    );
    this.name = 'CircuitBreakerOpenError';
    this.serverId = serverId;
    this.resetTime = resetTime;
  }
}

/**
 * Server Not Found Error - MCP server not registered
 */
export class ServerNotFoundError extends MCPError {
  readonly serverId: string;

  constructor(serverId: string) {
    super('SERVER_NOT_FOUND', `MCP server '${serverId}' not found in registry`, {
      retryable: false,
      details: { serverId },
    });
    this.name = 'ServerNotFoundError';
    this.serverId = serverId;
  }
}

/**
 * Tool Not Found Error - Tool not available on server
 */
export class ToolNotFoundError extends MCPError {
  readonly serverId: string;
  readonly toolName: string;
  readonly availableTools: string[];

  constructor(serverId: string, toolName: string, availableTools: string[] = []) {
    super(
      'TOOL_NOT_FOUND',
      `Tool '${toolName}' not found on server '${serverId}'`,
      {
        retryable: false,
        details: { serverId, toolName, availableTools },
      }
    );
    this.name = 'ToolNotFoundError';
    this.serverId = serverId;
    this.toolName = toolName;
    this.availableTools = availableTools;
  }
}

/**
 * Validation Error - Invalid input/arguments
 */
export class ValidationError extends MCPError {
  readonly field?: string;

  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, {
      retryable: false,
      details: { field, ...details },
    });
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Protocol Error - MCP protocol violation
 */
export class ProtocolError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('PROTOCOL_ERROR', message, {
      retryable: false,
      details,
    });
    this.name = 'ProtocolError';
  }
}

/**
 * Resource Exhausted Error - Pool/resource limit reached
 */
export class ResourceExhaustedError extends MCPError {
  readonly resource: string;

  constructor(resource: string, message: string) {
    super('RESOURCE_EXHAUSTED', message, {
      retryable: true,
      details: { resource },
    });
    this.name = 'ResourceExhaustedError';
    this.resource = resource;
  }
}

/**
 * Check if an error is an MCP error
 */
export function isMCPError(error: unknown): error is MCPError {
  return error instanceof MCPError;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isMCPError(error)) {
    return error.retryable;
  }
  
  // Check for common retryable error codes
  const retryableCodes = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ECONNRESET',
    'ENETUNREACH',
    'EHOSTUNREACH',
  ];
  
  if (error instanceof Error && 'code' in error) {
    return retryableCodes.includes((error as NodeJS.ErrnoException).code || '');
  }
  
  return false;
}

/**
 * Wrap unknown error as MCP error
 */
export function wrapError(error: unknown, defaultCode: string = 'UNKNOWN_ERROR'): MCPError {
  if (isMCPError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new MCPError(defaultCode, error.message, {
      retryable: isRetryableError(error),
      cause: error,
    });
  }
  
  return new MCPError(defaultCode, String(error), {
    retryable: false,
  });
}
