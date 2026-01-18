# Error Reference

Error codes and troubleshooting for AgenticCoder.

## Error Categories

| Category | Code Range | Description |
|----------|------------|-------------|
| Configuration | CFG001-CFG099 | Configuration errors |
| Workflow | WF001-WF099 | Workflow execution errors |
| Agent | AGT001-AGT099 | Agent-related errors |
| Validation | VAL001-VAL099 | Validation errors |
| Security | SEC001-SEC099 | Security-related errors |
| Infrastructure | INF001-INF099 | Infrastructure errors |
| Network | NET001-NET099 | Network errors |
| System | SYS001-SYS099 | System-level errors |

## Configuration Errors

### CFG001: Configuration File Not Found

**Message:** `Configuration file not found: {path}`

**Cause:** Required configuration file is missing.

**Solution:**
```bash
# Initialize configuration
agentic init

# Or create manually
mkdir -p .agentic/config
agentic config reset
```

### CFG002: Invalid Configuration Format

**Message:** `Invalid configuration format in {file}: {details}`

**Cause:** YAML/JSON syntax error in configuration file.

**Solution:**
```bash
# Validate configuration
agentic config validate

# Check YAML syntax
yamllint .agentic/config/settings.yaml
```

### CFG003: Invalid Configuration Value

**Message:** `Invalid value for {key}: expected {expected}, got {actual}`

**Cause:** Configuration value doesn't match expected type or constraints.

**Solution:**
```yaml
# Check schema for valid values
# Example: engine.maxConcurrentAgents must be 1-10
engine:
  maxConcurrentAgents: 3  # Valid: 1-10
```

### CFG004: Missing Required Configuration

**Message:** `Missing required configuration: {key}`

**Cause:** A required configuration option is not set.

**Solution:**
```yaml
# Add required configuration
project:
  name: "my-project"  # Required
  scenario: "S02"     # Required
```

### CFG005: Environment Variable Not Set

**Message:** `Environment variable not set: {variable}`

**Cause:** Referenced environment variable is not defined.

**Solution:**
```bash
# Set environment variable
export AZURE_SUBSCRIPTION_ID="xxx"

# Or add to .env file
echo "AZURE_SUBSCRIPTION_ID=xxx" >> .env
```

## Workflow Errors

### WF001: Workflow Already Running

**Message:** `Workflow already running: {workflowId}`

**Cause:** Attempting to start a new workflow while one is active.

**Solution:**
```bash
# Check running workflows
agentic status

# Stop running workflow
agentic stop --workflow-id {id}

# Or wait for completion
```

### WF002: Workflow Timeout

**Message:** `Workflow exceeded timeout of {timeout}ms`

**Cause:** Total workflow duration exceeded configured timeout.

**Solution:**
```yaml
# Increase workflow timeout
engine:
  workflowTimeout: 14400000  # 4 hours
```

### WF003: Phase Timeout

**Message:** `Phase {phase} exceeded timeout of {timeout}ms`

**Cause:** Phase execution took longer than allowed.

**Solution:**
```yaml
# Increase phase timeout
engine:
  phaseTimeout: 1800000  # 30 minutes
  
# Or for specific phase
phases:
  5:
    timeout: 2400000  # 40 minutes
```

### WF004: Phase Dependency Failed

**Message:** `Phase {phase} dependency not satisfied: requires {required}`

**Cause:** A prerequisite phase or artifact is not available.

**Solution:**
```bash
# Run from earlier phase
agentic run --from-phase 3

# Check artifact availability
ls -la .agentic/artifacts/
```

### WF005: Checkpoint Not Found

**Message:** `Checkpoint not found: {checkpoint}`

**Cause:** Specified checkpoint doesn't exist.

**Solution:**
```bash
# List available checkpoints
agentic checkpoints list

# Resume from available checkpoint
agentic resume --from-checkpoint {available-checkpoint}
```

### WF006: Max Retries Exceeded

**Message:** `Max retries exceeded for {component}: {attempts}/{max}`

**Cause:** Component failed after maximum retry attempts.

**Solution:**
```yaml
# Increase retry limit
engine:
  retry:
    maxAttempts: 5  # Increase from default 3
    
# Check component logs for root cause
agentic logs --agent {agent-name} --level error
```

## Agent Errors

### AGT001: Agent Not Found

**Message:** `Agent not found: {agent}`

**Cause:** Referenced agent doesn't exist.

**Solution:**
```bash
# List available agents
agentic agent list

# Check agent file exists
ls .github/agents/{agent-name}.md

# Verify agent registration
cat .github/config/agents.yaml
```

### AGT002: Agent Timeout

**Message:** `Agent {agent} exceeded timeout of {timeout}ms`

**Cause:** Agent processing took too long.

**Solution:**
```yaml
# Increase agent timeout
agents:
  defaults:
    timeout: 120000  # 2 minutes
    
  # Or for specific agent
  architect:
    timeout: 300000  # 5 minutes
```

### AGT003: Agent Skill Not Found

**Message:** `Skill not found: {skill} for agent {agent}`

**Cause:** Agent references a non-existent skill.

**Solution:**
```bash
# Check skill exists
ls .github/skills/{skill-name}.md

# Verify skill reference in agent
cat .github/agents/{agent-name}.md | grep "@skills:"
```

### AGT004: Agent Invocation Failed

**Message:** `Failed to invoke agent {agent}: {error}`

**Cause:** Agent couldn't be invoked (Copilot error).

**Solution:**
```bash
# Check GitHub Copilot status
# Verify Copilot subscription is active

# Retry
agentic run --phase {phase}
```

### AGT005: Agent Output Invalid

**Message:** `Agent {agent} produced invalid output: {details}`

**Cause:** Agent output doesn't match expected format.

**Solution:**
```bash
# Check agent output
cat .agentic/artifacts/{artifact}

# Validate manually
agentic validate {artifact}

# Re-run agent
agentic run --phase {phase}
```

## Validation Errors

### VAL001: Schema Validation Failed

**Message:** `Schema validation failed for {file}: {errors}`

**Cause:** Artifact doesn't conform to schema.

**Solution:**
```bash
# View validation details
agentic validate {file} --verbose

# Check schema reference
head -5 {file}  # Look for $schema

# Auto-fix if available
agentic validate {file} --fix
```

### VAL002: Syntax Error

**Message:** `Syntax error in {file} at line {line}: {error}`

**Cause:** Code has syntax errors.

**Solution:**
```bash
# View error location
agentic validate {file} --verbose

# For TypeScript
npx tsc --noEmit {file}

# For Bicep
az bicep build --file {file}
```

### VAL003: Semantic Error

**Message:** `Semantic error: {error}`

**Cause:** Logical error in artifact (undefined references, etc.)

**Solution:**
```bash
# View semantic analysis
agentic validate --semantic {file}

# Check references exist
grep -r "{reference}" .agentic/artifacts/
```

### VAL004: Security Violation

**Message:** `Security violation detected: {code} - {message}`

**Cause:** Security issue found in artifact.

**Solutions by code:**

| Code | Issue | Solution |
|------|-------|----------|
| SEC001 | SQL Injection | Use parameterized queries |
| SEC002 | XSS Vulnerability | Sanitize user input |
| SEC003 | Secret in Code | Move to Key Vault/env |
| SEC004 | Insecure Protocol | Use HTTPS |
| SEC005 | Missing Encryption | Enable encryption |

### VAL005: Quality Check Failed

**Message:** `Quality check failed: score {score} below threshold {threshold}`

**Cause:** Code quality score too low.

**Solution:**
```bash
# View quality report
agentic validate --quality --report

# Fix linting issues
npm run lint -- --fix

# Run again
agentic validate
```

## Infrastructure Errors

### INF001: Bicep Compilation Failed

**Message:** `Bicep compilation failed: {error}`

**Cause:** Bicep template has errors.

**Solution:**
```bash
# View Bicep errors
az bicep build --file {file}

# Update Bicep CLI
az bicep upgrade

# Check syntax
az bicep lint --file {file}
```

### INF002: AVM Module Not Found

**Message:** `AVM module not found: {module}`

**Cause:** Referenced AVM module doesn't exist.

**Solution:**
```bash
# Search for module
agentic avm search {resource-type}

# Refresh AVM cache
agentic avm refresh

# Use specific version
# br/public:avm/res/web/site:0.11.0
```

### INF003: Azure Deployment Failed

**Message:** `Azure deployment failed: {error}`

**Cause:** ARM/Bicep deployment failed.

**Solution:**
```bash
# View deployment error
az deployment sub show \
  --name {deployment-name} \
  --query "properties.error"

# Common fixes:
# - Register resource provider
az provider register --namespace Microsoft.Web

# - Check quota
az vm list-usage --location westeurope
```

### INF004: Resource Provider Not Registered

**Message:** `Resource provider not registered: {provider}`

**Cause:** Azure resource provider not registered.

**Solution:**
```bash
# Register provider
az provider register --namespace {provider}

# Example
az provider register --namespace Microsoft.DocumentDB

# Check registration status
az provider show --namespace {provider} --query "registrationState"
```

## Network Errors

### NET001: Connection Refused

**Message:** `Connection refused to {host}:{port}`

**Cause:** Target service not available.

**Solution:**
- Check service is running
- Verify firewall rules
- Check correct host/port

### NET002: Connection Timeout

**Message:** `Connection timeout to {host} after {timeout}ms`

**Cause:** Network latency or service unavailable.

**Solution:**
```yaml
# Increase timeout
engine:
  networkTimeout: 60000  # 60 seconds
```

### NET003: SSL Certificate Error

**Message:** `SSL certificate error: {details}`

**Cause:** Invalid or expired SSL certificate.

**Solution:**
- Update SSL certificate
- Check system time is correct
- Verify certificate chain

## System Errors

### SYS001: Out of Memory

**Message:** `Out of memory: {details}`

**Cause:** Insufficient system memory.

**Solution:**
```yaml
# Reduce concurrency
engine:
  maxConcurrentAgents: 1

# Or increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
```

### SYS002: Disk Full

**Message:** `Disk full: cannot write to {path}`

**Cause:** No disk space available.

**Solution:**
```bash
# Check disk usage
df -h

# Clean up
agentic cache clear
rm -rf .agentic/logs/*.old
```

### SYS003: Permission Denied

**Message:** `Permission denied: {path}`

**Cause:** Insufficient file system permissions.

**Solution:**
```bash
# Check permissions
ls -la {path}

# Fix permissions
chmod 755 {path}
chown $USER {path}
```

## Error Handling in Code

### TypeScript Error Handling

```typescript
import { AgenticError, ErrorCode } from '@agentic/core';

try {
  await engine.run();
} catch (error) {
  if (error instanceof AgenticError) {
    switch (error.code) {
      case ErrorCode.AGENT_TIMEOUT:
        // Handle timeout
        break;
      case ErrorCode.VALIDATION_FAILED:
        // Handle validation
        break;
      default:
        // Generic handling
    }
  }
  throw error;
}
```

### Error Recovery

```typescript
import { WorkflowEngine, RecoveryStrategy } from '@agentic/core';

const engine = new WorkflowEngine({
  recovery: {
    strategy: RecoveryStrategy.CHECKPOINT,
    maxRetries: 3,
    onError: async (error, context) => {
      if (error.retryable) {
        return { action: 'retry', delay: 5000 };
      }
      return { action: 'fail' };
    }
  }
});
```

## Getting Help

If you encounter an error not listed here:

1. **Check logs:**
   ```bash
   agentic logs --level error --tail 100
   ```

2. **Run diagnostics:**
   ```bash
   agentic doctor
   ```

3. **Generate bug report:**
   ```bash
   agentic bug-report
   ```

4. **Search issues:**
   https://github.com/agentic/coder/issues

5. **Ask community:**
   https://github.com/agentic/coder/discussions

## Next Steps

- [Troubleshooting](../guides/Troubleshooting) - Common solutions
- [CLI Reference](CLI-Reference) - Command-line help
- [FAQ](../guides/FAQ) - Common questions
