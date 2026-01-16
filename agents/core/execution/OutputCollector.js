/**
 * OutputCollector (EB-04)
 * Captures and processes execution output from agent invocations.
 * 
 * Features:
 * - Captures stdout, stderr, logs
 * - Extracts JSON artifacts from output
 * - Validates output against schemas
 * - Stores artifacts and logs to disk
 * - Extracts execution metrics
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export class OutputCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxOutputSize = options.maxOutputSize || 10 * 1024 * 1024; // 10MB
    this.artifactSchemas = options.artifactSchemas || new Map();
  }

  /**
   * Collect and process output from an invocation result
   * @param {object} invocationResult - Result from AgentInvoker
   * @param {object} context - ExecutionContext
   * @returns {object} CollectedOutput
   */
  async collect(invocationResult, context) {
    const collected = {
      execution_id: context.execution_id,
      agent: context.agent,
      phase: context.phase,
      
      // Raw output
      stdout: this._truncateOutput(invocationResult.stdout || ''),
      stderr: this._truncateOutput(invocationResult.stderr || ''),
      
      // Extracted data
      artifact: null,
      artifact_path: null,
      artifact_size_bytes: 0,
      
      // Logs
      logs: [],
      
      // Metrics
      metrics: {
        duration_ms: invocationResult.duration_ms || 0,
        exit_code: invocationResult.exit_code,
        status: invocationResult.status
      }
    };

    try {
      // Step 1: Extract artifact
      collected.artifact = this._extractArtifact(invocationResult, context);

      // Step 2: Save artifact to file
      if (collected.artifact) {
        const artifactResult = await this._saveArtifact(
          collected.artifact,
          context.paths.artifact_dir,
          context.agent,
          context.phase
        );
        collected.artifact_path = artifactResult.path;
        collected.artifact_size_bytes = artifactResult.size;
      }

      // Step 3: Extract and parse logs
      collected.logs = this._extractLogs(
        invocationResult.stdout,
        invocationResult.stderr,
        invocationResult.logs
      );

      // Step 4: Save logs to file
      await this._saveLogs(collected.logs, context.paths.log_dir);

      // Step 5: Save raw output
      await this._saveRawOutput(
        invocationResult.stdout,
        invocationResult.stderr,
        context.paths.log_dir
      );

      // Step 6: Extract additional metrics
      collected.metrics = {
        ...collected.metrics,
        ...this._extractMetrics(invocationResult, collected.logs)
      };

      this.emit('output-collected', {
        execution_id: context.execution_id,
        has_artifact: !!collected.artifact,
        log_count: collected.logs.length,
        duration_ms: collected.metrics.duration_ms
      });

    } catch (error) {
      this.emit('collection-error', {
        execution_id: context.execution_id,
        error: error.message
      });
      
      collected.logs.push({
        level: 'error',
        message: `Output collection error: ${error.message}`,
        timestamp: new Date().toISOString(),
        context: { component: 'OutputCollector' }
      });
    }

    return collected;
  }

  /**
   * Extract artifact from invocation result
   */
  _extractArtifact(invocationResult, context) {
    // Priority 1: Pre-parsed artifact from invoker
    if (invocationResult.artifact) {
      return invocationResult.artifact;
    }

    // Priority 2: Try to parse JSON from stdout
    const stdout = invocationResult.stdout || '';
    
    // Look for JSON object/array in stdout
    const jsonMatch = this._extractJsonFromText(stdout);
    if (jsonMatch) {
      return jsonMatch;
    }

    // Priority 3: Look for artifact markers
    const markerMatch = this._extractMarkedArtifact(stdout);
    if (markerMatch) {
      return markerMatch;
    }

    return null;
  }

  /**
   * Extract JSON from mixed text output
   */
  _extractJsonFromText(text) {
    if (!text || typeof text !== 'string') return null;

    // Try parsing entire stdout as JSON first
    try {
      const parsed = JSON.parse(text.trim());
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // Not pure JSON, continue to other methods
    }

    // Look for JSON object at the end of output (common pattern)
    const lines = text.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('{') || line.startsWith('[')) {
        // Try to parse from this line to the end
        const candidate = lines.slice(i).join('\n').trim();
        try {
          return JSON.parse(candidate);
        } catch {
          continue;
        }
      }
    }

    // Look for JSON between braces/brackets
    const jsonRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
    const match = text.match(jsonRegex);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // Invalid JSON
      }
    }

    return null;
  }

  /**
   * Extract artifact marked with special delimiters
   */
  _extractMarkedArtifact(text) {
    // Support various artifact marker formats
    const markers = [
      { start: '---ARTIFACT_START---', end: '---ARTIFACT_END---' },
      { start: '<!-- ARTIFACT_START -->', end: '<!-- ARTIFACT_END -->' },
      { start: '```json', end: '```' },
      { start: '### ARTIFACT ###', end: '### END ARTIFACT ###' }
    ];

    for (const { start, end } of markers) {
      const startIdx = text.indexOf(start);
      const endIdx = text.indexOf(end, startIdx + start.length);
      
      if (startIdx !== -1 && endIdx !== -1) {
        const content = text.slice(startIdx + start.length, endIdx).trim();
        try {
          return JSON.parse(content);
        } catch {
          // Not valid JSON, return as string
          return { raw_content: content };
        }
      }
    }

    return null;
  }

  /**
   * Extract and parse log entries from output
   */
  _extractLogs(stdout, stderr, rawLogs) {
    const logs = [];
    const now = new Date().toISOString();

    // Include raw logs from invoker
    if (rawLogs && Array.isArray(rawLogs)) {
      logs.push(...rawLogs.map(log => ({
        level: log.level || 'info',
        message: log.message || String(log),
        timestamp: log.timestamp || now,
        context: log.context || {}
      })));
    }

    // Parse structured logs from stdout
    if (stdout) {
      const stdoutLogs = this._parseStructuredLogs(stdout);
      logs.push(...stdoutLogs);
    }

    // Parse stderr as error/warning logs
    if (stderr) {
      const lines = stderr.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const level = this._inferLogLevel(line);
        logs.push({
          level,
          message: line.trim(),
          timestamp: now,
          context: { source: 'stderr' }
        });
      }
    }

    return logs;
  }

  /**
   * Parse structured log lines (JSON or common formats)
   */
  _parseStructuredLogs(text) {
    const logs = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try JSON log format
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.level || parsed.message || parsed.msg) {
            logs.push({
              level: parsed.level || parsed.lvl || 'info',
              message: parsed.message || parsed.msg || JSON.stringify(parsed),
              timestamp: parsed.timestamp || parsed.time || new Date().toISOString(),
              context: parsed.context || parsed.metadata || {}
            });
            continue;
          }
        } catch {
          // Not JSON log
        }
      }

      // Try common log format: [LEVEL] message or LEVEL: message
      const levelMatch = trimmed.match(/^\[?(DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\]?:?\s*(.+)$/i);
      if (levelMatch) {
        logs.push({
          level: levelMatch[1].toLowerCase().replace('warning', 'warn'),
          message: levelMatch[2],
          timestamp: new Date().toISOString(),
          context: { source: 'stdout' }
        });
        continue;
      }

      // Try timestamp + level format
      const timestampMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^\s]*)\s+\[?(DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\]?\s*(.+)$/i);
      if (timestampMatch) {
        logs.push({
          level: timestampMatch[2].toLowerCase().replace('warning', 'warn'),
          message: timestampMatch[3],
          timestamp: timestampMatch[1],
          context: { source: 'stdout' }
        });
      }
    }

    return logs;
  }

  /**
   * Infer log level from message content
   */
  _inferLogLevel(message) {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('exception') || lower.includes('failed')) {
      return 'error';
    }
    if (lower.includes('warn') || lower.includes('deprecated')) {
      return 'warn';
    }
    if (lower.includes('debug') || lower.includes('trace')) {
      return 'debug';
    }
    return 'info';
  }

  /**
   * Extract metrics from invocation result and logs
   */
  _extractMetrics(invocationResult, logs) {
    const metrics = {
      duration_ms: invocationResult.duration_ms || 0,
      exit_code: invocationResult.exit_code,
      status: invocationResult.status,
      ok: invocationResult.ok
    };

    // Count log levels
    metrics.log_counts = {
      error: logs.filter(l => l.level === 'error').length,
      warn: logs.filter(l => l.level === 'warn').length,
      info: logs.filter(l => l.level === 'info').length,
      debug: logs.filter(l => l.level === 'debug').length
    };

    // Look for token usage in logs
    for (const log of logs) {
      const msg = log.message || '';
      const tokenMatch = msg.match(/tokens?\s*(?:used|consumed)?\s*:?\s*(\d+)/i);
      if (tokenMatch) {
        metrics.tokens_used = parseInt(tokenMatch[1], 10);
        break;
      }
    }

    return metrics;
  }

  /**
   * Save artifact to file
   */
  async _saveArtifact(artifact, artifactDir, agent, phase) {
    await fs.promises.mkdir(artifactDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `artifact-${agent}-phase${phase}-${timestamp}.json`;
    const filepath = path.join(artifactDir, filename);

    const content = JSON.stringify(artifact, null, 2);
    await fs.promises.writeFile(filepath, content, 'utf8');

    return {
      path: filepath,
      size: Buffer.byteLength(content, 'utf8')
    };
  }

  /**
   * Save logs to file
   */
  async _saveLogs(logs, logDir) {
    if (!logs.length) return;

    await fs.promises.mkdir(logDir, { recursive: true });
    const filepath = path.join(logDir, 'execution.log');

    const content = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');

    await fs.promises.writeFile(filepath, content, 'utf8');
  }

  /**
   * Save raw stdout/stderr to files
   */
  async _saveRawOutput(stdout, stderr, logDir) {
    await fs.promises.mkdir(logDir, { recursive: true });

    if (stdout) {
      await fs.promises.writeFile(
        path.join(logDir, 'stdout.txt'),
        stdout,
        'utf8'
      );
    }

    if (stderr) {
      await fs.promises.writeFile(
        path.join(logDir, 'stderr.txt'),
        stderr,
        'utf8'
      );
    }
  }

  /**
   * Truncate output to prevent memory issues
   */
  _truncateOutput(output) {
    if (!output) return '';
    if (output.length <= this.maxOutputSize) return output;
    
    const truncateMsg = `\n\n... [OUTPUT TRUNCATED: ${output.length} bytes total, showing first ${this.maxOutputSize} bytes] ...`;
    return output.slice(0, this.maxOutputSize) + truncateMsg;
  }

  /**
   * Register an artifact schema for validation
   */
  registerArtifactSchema(agentName, schema) {
    this.artifactSchemas.set(agentName, schema);
  }

  /**
   * Validate artifact against registered schema
   */
  validateArtifact(artifact, agentName) {
    const schema = this.artifactSchemas.get(agentName);
    if (!schema) {
      return { valid: true, errors: [] };
    }

    // Basic validation (could be extended with JSON Schema validator)
    const errors = [];
    
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in artifact)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
