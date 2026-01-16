# Output Collector

**Component**: EB-04  
**Purpose**: Capture and process execution output  
**Status**: Design Complete  

---

## 🎯 Overview

The Output Collector:

1. **Captures** stdout, stderr, logs
2. **Extracts** JSON artifacts
3. **Validates** output structure
4. **Stores** artifacts and logs

---

## 🏗️ Process Flow

```
Invocation Result
    │
    ├─→ Extract Artifact
    │   ├─ Parse JSON from stdout
    │   ├─ Validate against schema
    │   └─ Save to artifacts/
    │
    ├─→ Process Logs
    │   ├─ Parse structured logs
    │   ├─ Extract log entries
    │   └─ Save to logs/
    │
    ├─→ Capture Output
    │   ├─ Save stdout to file
    │   ├─ Save stderr to file
    │   └─ Create execution.log
    │
    ├─→ Extract Metrics
    │   ├─ Execution time
    │   ├─ Resource usage
    │   └─ Token usage
    │
    └─→ Return Collected Output
        ├─ artifact: { ... }
        ├─ logs: [ ... ]
        └─ metrics: { ... }
```

---

## 💻 Algorithm

### Extract Artifacts
```typescript
interface CollectedOutput {
  artifact?: any;
  artifact_path?: string;
  artifact_size_bytes?: number;
  
  stdout: string;
  stderr: string;
  
  logs: Array<{
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    timestamp: string;
    context?: Record<string, any>;
  }>;
  
  metrics: {
    duration_ms: number;
    cpu_percent?: number;
    memory_mb?: number;
    tokens_used?: number;
  };
}

async function collectOutput(
  invocationResult: InvocationResult,
  context: ExecutionContext
): Promise<CollectedOutput> {
  
  const collected: CollectedOutput = {
    stdout: invocationResult.stdout,
    stderr: invocationResult.stderr,
    logs: [],
    metrics: {
      duration_ms: invocationResult.duration_ms || 0
    }
  };
  
  // Step 1: Extract artifact
  if (invocationResult.artifact) {
    // Artifact already parsed by invoker
    collected.artifact = invocationResult.artifact;
  } else {
    // Try to extract from stdout
    const artifact = extractArtifactFromOutput(
      invocationResult.stdout,
      context.agent
    );
    
    if (artifact) {
      collected.artifact = artifact;
    }
  }
  
  // Step 2: Save artifact to file
  if (collected.artifact) {
    const artifactPath = await saveArtifact(
      collected.artifact,
      context.paths.artifact_dir,
      context.agent,
      context.phase
    );
    
    collected.artifact_path = artifactPath;
    collected.artifact_size_bytes = getFileSize(artifactPath);
  }
  
  // Step 3: Parse logs
  const logs = extractLogsFromOutput(
    invocationResult.stdout,
    invocationResult.stderr,
    invocationResult.logs
  );
  
  collected.logs = logs;
  
  // Step 4: Save logs to file
  await saveLogs(logs, context.paths.log_dir);
  
  // Step 5: Save stdout/stderr
  await saveRawOutput(
    invocationResult.stdout,
    invocationResult.stderr,
    context.paths.log_dir
  );
  
  // Step 6: Extract metrics
  collected.metrics = extractMetrics(
    invocationResult,
    collected.logs
  );
  
  return collected;
}

function extractArtifactFromOutput(
  stdout: string,
  agent: string
): any | null {
  
  // Pattern 1: JSON artifact on its own line
  const jsonMatch = stdout.match(/^{[\s\S]*}$/m);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Not valid JSON, continue
    }
  }
  
  // Pattern 2: Artifact wrapped in markers
  const markerMatch = stdout.match(/ARTIFACT_START\n([\s\S]*?)\nARTIFACT_END/);
  if (markerMatch) {
    try {
      return JSON.parse(markerMatch[1]);
    } catch {
      // Not valid JSON
    }
  }
  
  // Pattern 3: Look for JSON object with specific keys based on agent
  const agentPatterns: Record<string, RegExp> = {
    '@nodejs-specialist': /\{"name"\s*:\s*"[^"]*"[\s\S]*"dependencies"\s*:[\s\S]*}/,
    '@react-specialist': /\{"components"\s*:[\s\S]*"pages"\s*:[\s\S]*}/,
    '@database-specialist': /\{"tables"\s*:[\s\S]*}/,
    '@bicep-specialist': /\{"resources"\s*:[\s\S]*}/
  };
  
  const pattern = agentPatterns[agent];
  if (pattern) {
    const match = stdout.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // Not valid JSON
      }
    }
  }
  
  return null;
}

async function saveArtifact(
  artifact: any,
  artifactDir: string,
  agent: string,
  phase: number
): Promise<string> {
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const agentShort = agent.replace('@', '').substring(0, 3);
  const filename = `phase_${phase}_${agentShort}_${timestamp}.json`;
  const filepath = path.join(artifactDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(artifact, null, 2));
  
  return filepath;
}

function extractLogsFromOutput(
  stdout: string,
  stderr: string,
  structuredLogs?: any[]
): CollectedOutput['logs'] {
  
  const logs: CollectedOutput['logs'] = [];
  
  // Add structured logs if provided
  if (structuredLogs && Array.isArray(structuredLogs)) {
    logs.push(...structuredLogs);
  }
  
  // Parse stdout for log lines
  const stdoutLines = stdout.split('\n');
  for (const line of stdoutLines) {
    if (!line.trim()) continue;
    
    // Pattern 1: [LEVEL] message
    const levelMatch = line.match(/^\[(\w+)\]\s*(.*)/);
    if (levelMatch) {
      logs.push({
        level: levelMatch[1].toLowerCase() as any,
        message: levelMatch[2],
        timestamp: new Date().toISOString()
      });
      continue;
    }
    
    // Pattern 2: ✅/❌/⚠️ emojis
    if (line.includes('✅')) {
      logs.push({
        level: 'info',
        message: line.replace('✅', '').trim(),
        timestamp: new Date().toISOString()
      });
    } else if (line.includes('❌') || line.includes('⚠️')) {
      logs.push({
        level: 'warn',
        message: line.replace('❌', '').replace('⚠️', '').trim(),
        timestamp: new Date().toISOString()
      });
    } else if (line.includes('ERROR') || line.includes('error')) {
      logs.push({
        level: 'error',
        message: line,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Parse stderr for error logs
  if (stderr && stderr.trim()) {
    const stderrLines = stderr.split('\n');
    for (const line of stderrLines) {
      if (line.trim()) {
        logs.push({
          level: 'error',
          message: line,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return logs;
}

function extractMetrics(
  invocationResult: InvocationResult,
  logs: CollectedOutput['logs']
): CollectedOutput['metrics'] {
  
  const metrics: CollectedOutput['metrics'] = {
    duration_ms: invocationResult.duration_ms || 0
  };
  
  // Look for metrics in logs
  for (const log of logs) {
    // Pattern: "Used 3500 tokens"
    const tokenMatch = log.message.match(/(\d+)\s*tokens?/i);
    if (tokenMatch) {
      metrics.tokens_used = parseInt(tokenMatch[1]);
    }
    
    // Pattern: "CPU: 45%"
    const cpuMatch = log.message.match(/cpu:?\s*(\d+(?:\.\d+)?)\s*%/i);
    if (cpuMatch) {
      metrics.cpu_percent = parseFloat(cpuMatch[1]);
    }
    
    // Pattern: "Memory: 256MB"
    const memMatch = log.message.match(/memory:?\s*(\d+(?:\.\d+)?)\s*mb/i);
    if (memMatch) {
      metrics.memory_mb = parseFloat(memMatch[1]);
    }
  }
  
  return metrics;
}

async function saveLogs(
  logs: CollectedOutput['logs'],
  logDir: string
): Promise<void> {
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(logDir, `logs_${timestamp}.json`);
  
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

async function saveRawOutput(
  stdout: string,
  stderr: string,
  logDir: string
): Promise<void> {
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (stdout) {
    const stdoutFile = path.join(logDir, `stdout_${timestamp}.log`);
    fs.writeFileSync(stdoutFile, stdout);
  }
  
  if (stderr) {
    const stderrFile = path.join(logDir, `stderr_${timestamp}.log`);
    fs.writeFileSync(stderrFile, stderr);
  }
}
```

---

## 📋 Output Capture Examples

### Example 1: Successful Execution
```
Raw stdout:
✅ Starting generation...
[INFO] Created server.js
[INFO] Installed express v4.18.2
[INFO] Setup environment variables
✅ Generated 15 files
[METRIC] Duration: 45000ms, Memory: 256MB, Tokens: 3500

Extracted artifact:
{
  "name": "my-app",
  "main": "server.js",
  "files": [ ... ]
}

Extracted logs:
[
  { "level": "info", "message": "Starting generation..." },
  { "level": "info", "message": "Created server.js" },
  { "level": "info", "message": "Installed express v4.18.2" },
  { "level": "info", "message": "Generated 15 files" }
]

Extracted metrics:
{
  "duration_ms": 45000,
  "memory_mb": 256,
  "tokens_used": 3500
}
```

---

### Example 2: Failed Execution
```
Raw stdout:
Starting generation...

Raw stderr:
ERROR: Unable to connect to database
ERROR: Schema validation failed

Extracted logs:
[
  { "level": "error", "message": "Unable to connect to database" },
  { "level": "error", "message": "Schema validation failed" }
]

Artifact:
null (no valid artifact extracted)
```

---

## ⚙️ Configuration

### output-collector.config.json
```json
{
  "capture_stdout": true,
  "capture_stderr": true,
  "capture_logs": true,
  "max_log_size_mb": 100,
  "compress_logs": false,
  
  "artifact_patterns": {
    "@nodejs-specialist": "^{.*\"main\".*}$",
    "@react-specialist": "^{.*\"components\".*}$",
    "@database-specialist": "^{.*\"tables\".*}$",
    "@bicep-specialist": "^{.*\"resources\".*}$"
  },
  
  "log_retention_days": 30,
  "artifact_retention_days": 365
}
```

---

## 🔌 Integration

### Called By
- Lifecycle Manager (after execution completes)

### Calls
- Artifact storage (saves artifacts)
- Log storage (saves execution logs)
- Validation Framework (validates artifacts)

---

## 💡 Key Points

1. **Multi-Format Extraction**: Handles JSON, logs, metrics
2. **Flexible Parsing**: Works with various output formats
3. **File Management**: Saves artifacts and logs with proper naming
4. **Metrics Extraction**: Automatically extracts timing/resource data
5. **Error Capture**: Captures both stdout and stderr
6. **Structured Logs**: Parses unstructured output to structured logs

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.

---

## 📋 ADDENDUM: Implementation (January 2026)

### Implementation Location
```
agents/core/execution/OutputCollector.js (~350 lines)
```

### Implemented Features
- ✅ Artifact extraction from stdout (JSON, marked sections)
- ✅ Multiple artifact marker formats supported
- ✅ Structured log parsing ([LEVEL] message, JSON logs, timestamp formats)
- ✅ Log level inference from message content
- ✅ Metrics extraction (duration, exit code, token usage)
- ✅ File storage (artifacts, logs, stdout/stderr)
- ✅ Output truncation for memory protection
- ✅ Schema registration for artifact validation

### Key Classes/Methods
```javascript
class OutputCollector extends EventEmitter {
  collect(invocationResult, context)  // Main collection method
  _extractArtifact(result, context)   // Extract artifact
  _extractJsonFromText(text)          // Parse JSON from mixed output
  _extractMarkedArtifact(text)        // Find marked artifact sections
  _extractLogs(stdout, stderr, logs)  // Parse structured logs
  _saveArtifact(artifact, dir, ...)   // Save to file
}
```

### Tests
- 6 unit tests in `core/test/execution.test.js`
- All tests passing ✅
