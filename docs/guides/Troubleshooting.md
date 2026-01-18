# Troubleshooting Guide

Common issues and solutions for AgenticCoder.

## Quick Diagnostics

```bash
# Check system status
agentic status

# Verify configuration
agentic config validate

# Test agent availability
agentic doctor

# View logs
agentic logs --tail 100
```

## Installation Issues

### Node.js Version Mismatch

**Symptom:**
```
Error: The module was compiled against a different Node.js version
```

**Solution:**
```bash
# Check Node.js version
node --version  # Requires 20.x or higher

# Install correct version using nvm
nvm install 20
nvm use 20

# Reinstall dependencies
npm ci
```

### VS Code Extension Not Loading

**Symptom:** AgenticCoder panel not appearing in VS Code

**Solutions:**
1. Check extension is installed:
   ```
   Extensions → Search "AgenticCoder" → Ensure enabled
   ```

2. Reload VS Code:
   ```
   Ctrl+Shift+P → Developer: Reload Window
   ```

3. Check output panel for errors:
   ```
   View → Output → Select "AgenticCoder"
   ```

4. Verify GitHub Copilot is active:
   ```
   Extensions → GitHub Copilot → Ensure signed in
   ```

### Permission Denied

**Symptom:**
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solution (npm global):**
```bash
# Option 1: Use npm prefix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Option 2: Use npx instead
npx @agentic/coder init
```

## Configuration Issues

### Invalid Configuration

**Symptom:**
```
ConfigurationError: Invalid configuration at 'engine.timeout'
```

**Solutions:**

1. Validate configuration:
   ```bash
   agentic config validate
   ```

2. Reset to defaults:
   ```bash
   agentic config reset
   ```

3. Check YAML syntax:
   ```yaml
   # ❌ Wrong
   engine:
   timeout: 60000
   
   # ✅ Correct
   engine:
     timeout: 60000
   ```

### Missing Configuration Files

**Symptom:**
```
Error: Configuration file not found: .agentic/config/settings.yaml
```

**Solution:**
```bash
# Initialize configuration
agentic init

# Or create manually
mkdir -p .agentic/config
cat > .agentic/config/settings.yaml << EOF
project:
  name: "MyProject"
  scenario: "S02"
EOF
```

### Environment Variables Not Loading

**Symptom:** Azure credentials not being picked up

**Solutions:**

1. Check .env file location (project root):
   ```
   project/
   ├── .env          ← Must be here
   └── .agentic/
   ```

2. Verify variable names:
   ```env
   # ✅ Correct
   AZURE_SUBSCRIPTION_ID=xxx
   
   # ❌ Wrong
   AZ_SUBSCRIPTION_ID=xxx
   ```

3. Restart VS Code after changing .env

## Workflow Execution Issues

### Workflow Timeout

**Symptom:**
```
WorkflowTimeoutError: Phase 5 exceeded timeout of 300000ms
```

**Solutions:**

1. Increase timeout:
   ```yaml
   # .agentic/config/engine.yaml
   engine:
     phaseTimeout: 900000  # 15 minutes
   ```

2. Check for blocking operations:
   ```bash
   agentic logs --phase 5 --level debug
   ```

3. Break down complex tasks:
   ```yaml
   phases:
     5:
       splitTasks: true
       maxTaskSize: "small"
   ```

### Agent Not Found

**Symptom:**
```
AgentNotFoundError: Agent 'custom-agent' not registered
```

**Solutions:**

1. Check agent file exists:
   ```
   .github/agents/custom-agent.md
   ```

2. Verify agent registration:
   ```yaml
   # .github/config/agents.yaml
   agents:
     custom-agent:
       enabled: true
   ```

3. Check for naming issues:
   ```bash
   # Agent file name should match ID
   custom-agent.md → id: custom-agent
   ```

### Phase Dependency Error

**Symptom:**
```
DependencyError: Phase 13 requires artifacts from Phase 5
```

**Solutions:**

1. Run prerequisite phases:
   ```bash
   agentic run --from-phase 5 --to-phase 13
   ```

2. Check phase configuration:
   ```yaml
   phases:
     include: [5, 6, 7, 10, 13]  # Include all dependencies
   ```

3. Use checkpoint recovery:
   ```bash
   agentic resume --from-checkpoint phase-5
   ```

## Validation Issues

### Schema Validation Failed

**Symptom:**
```
SchemaValidationError: Invalid artifact at 'architecture/system.yaml'
```

**Solutions:**

1. View validation details:
   ```bash
   agentic validate architecture/system.yaml --verbose
   ```

2. Check schema version:
   ```yaml
   # Artifact file
   $schema: "https://agentic.dev/schemas/architecture/v1.json"
   ```

3. Auto-fix if available:
   ```bash
   agentic validate --fix
   ```

### Security Scan Failures

**Symptom:**
```
SecurityValidationError: Potential secrets detected in 'src/config.ts'
```

**Solutions:**

1. Review detected issues:
   ```bash
   agentic validate --security --report
   ```

2. Move secrets to environment:
   ```typescript
   // ❌ Wrong
   const apiKey = "sk-abc123";
   
   // ✅ Correct
   const apiKey = process.env.API_KEY;
   ```

3. Add to ignore patterns (if false positive):
   ```yaml
   # .agentic/secrets.patterns
   ignore:
     - "example-api-key"
     - "test-token-*"
   ```

## Azure/Bicep Issues

### Bicep Compilation Error

**Symptom:**
```
BicepError: Unable to resolve module 'br/public:avm/res/web/site:0.11.0'
```

**Solutions:**

1. Check Bicep CLI version:
   ```bash
   az bicep version  # Requires 0.25+
   az bicep upgrade
   ```

2. Restore Bicep modules:
   ```bash
   az bicep restore --file main.bicep
   ```

3. Check registry connectivity:
   ```bash
   az bicep publish --help  # Tests registry access
   ```

### AVM Module Not Found

**Symptom:**
```
ModuleNotFoundError: AVM module not found for 'cosmos-db'
```

**Solutions:**

1. Check AVM registry:
   ```bash
   agentic avm search cosmos
   ```

2. Update module cache:
   ```bash
   agentic avm refresh
   ```

3. Use fallback module:
   ```yaml
   # .agentic/config/bicep.yaml
   bicep:
     allowNonAvm: true
     fallbackToArm: true
   ```

### Azure Deployment Failed

**Symptom:**
```
DeploymentError: The subscription is not registered for resource type
```

**Solutions:**

1. Register resource provider:
   ```bash
   az provider register --namespace Microsoft.Web
   az provider register --namespace Microsoft.Sql
   ```

2. Check subscription permissions:
   ```bash
   az role assignment list --assignee $(az ad signed-in-user show --query id -o tsv)
   ```

3. Verify location support:
   ```bash
   az provider show --namespace Microsoft.Web --query "resourceTypes[?resourceType=='sites'].locations"
   ```

## Performance Issues

### Slow Workflow Execution

**Symptoms:** Workflows taking much longer than expected

**Solutions:**

1. Enable parallel execution:
   ```yaml
   # .agentic/config/engine.yaml
   engine:
     parallelExecution: true
     maxConcurrentAgents: 5
   ```

2. Optimize agent configuration:
   ```yaml
   agents:
     defaults:
       timeout: 60000  # Reduce from default
   ```

3. Use incremental processing:
   ```bash
   agentic run --incremental
   ```

4. Check system resources:
   ```bash
   # Memory/CPU usage during execution
   agentic status --resources
   ```

### High Memory Usage

**Symptom:** VS Code becoming slow or unresponsive

**Solutions:**

1. Limit concurrent operations:
   ```yaml
   engine:
     maxConcurrentAgents: 2
   ```

2. Clear caches:
   ```bash
   agentic cache clear
   ```

3. Disable unused features:
   ```yaml
   features:
     selfLearning: false  # If not needed
   ```

## Logging and Debugging

### Enable Debug Logging

```yaml
# .agentic/config/logging.yaml
logging:
  level: "debug"
  
  components:
    engine: "debug"
    agents: "debug"
    validation: "debug"
```

### View Specific Logs

```bash
# All logs
agentic logs

# Phase-specific
agentic logs --phase 5

# Agent-specific
agentic logs --agent architect

# Time range
agentic logs --since "1 hour ago"

# Error only
agentic logs --level error
```

### Export Diagnostics

```bash
# Generate diagnostic report
agentic diagnostics export --output diagnostics.zip

# Include sensitive data (for support)
agentic diagnostics export --include-config --include-logs
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Service not running | Restart VS Code |
| `ETIMEDOUT` | Network timeout | Check internet, increase timeout |
| `ENOMEM` | Out of memory | Reduce concurrency, close apps |
| `ENOSPC` | Disk full | Free disk space |
| `EPERM` | Permission denied | Check file/folder permissions |

## Getting Help

### Self-Service

1. Check this troubleshooting guide
2. Search [GitHub Issues](https://github.com/agentic/coder/issues)
3. Review [FAQ](FAQ)

### Community Support

1. [GitHub Discussions](https://github.com/agentic/coder/discussions)
2. Discord community
3. Stack Overflow tag: `agentic-coder`

### Reporting Bugs

```bash
# Generate bug report
agentic bug-report

# Includes:
# - System information
# - Configuration (sanitized)
# - Recent logs
# - Error stack traces
```

When reporting bugs, include:
- Steps to reproduce
- Expected vs actual behavior
- Diagnostic report
- Screenshots if relevant

## Next Steps

- [FAQ](FAQ) - Frequently asked questions
- [Configuration](Configuration) - Settings reference
- [Installation](Installation) - Setup guide
