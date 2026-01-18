# CLI Reference

Command-line interface reference for AgenticCoder.

## Installation

```bash
# Global installation
npm install -g @agentic/coder

# Verify installation
agentic --version
```

## Global Options

Options available for all commands:

| Option | Description |
|--------|-------------|
| `--help`, `-h` | Show help |
| `--version`, `-v` | Show version |
| `--config <path>` | Config file path |
| `--verbose` | Verbose output |
| `--quiet`, `-q` | Suppress output |
| `--json` | JSON output format |

## Commands

### init

Initialize a new AgenticCoder project.

```bash
agentic init [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--scenario <id>` | Scenario to use | Interactive |
| `--name <name>` | Project name | Directory name |
| `--path <path>` | Project path | Current directory |
| `--force` | Overwrite existing | `false` |
| `--no-git` | Skip git initialization | `false` |

**Examples:**

```bash
# Interactive initialization
agentic init

# With scenario
agentic init --scenario S02

# Full options
agentic init --scenario S02 --name my-project --path ./projects
```

### run

Execute the AgenticCoder workflow.

```bash
agentic run [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--scenario <id>` | Override scenario | Config value |
| `--phase <n>` | Run specific phase | All phases |
| `--from-phase <n>` | Start from phase | 1 |
| `--to-phase <n>` | End at phase | Last |
| `--skip <phases>` | Skip phases (comma-separated) | None |
| `--incremental` | Only process changes | `false` |
| `--dry-run` | Preview without executing | `false` |
| `--parallel` | Enable parallel execution | Config value |

**Examples:**

```bash
# Run full workflow
agentic run

# Run specific phase
agentic run --phase 5

# Run phase range
agentic run --from-phase 5 --to-phase 10

# Skip phases
agentic run --skip 4,6

# Dry run
agentic run --dry-run
```

### resume

Resume a paused or failed workflow.

```bash
agentic resume [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--from-checkpoint <name>` | Resume from checkpoint | Latest |
| `--workflow-id <id>` | Specific workflow | Latest |

**Examples:**

```bash
# Resume from last checkpoint
agentic resume

# Resume from specific checkpoint
agentic resume --from-checkpoint phase-5-complete

# Resume specific workflow
agentic resume --workflow-id abc123
```

### validate

Validate project artifacts.

```bash
agentic validate [files...] [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--fix` | Auto-fix issues | `false` |
| `--security` | Security scan | Config value |
| `--report` | Generate report | `false` |
| `--format <type>` | Report format (json, html) | `json` |

**Examples:**

```bash
# Validate all artifacts
agentic validate

# Validate specific file
agentic validate architecture/system.yaml

# Validate with auto-fix
agentic validate --fix

# Security scan
agentic validate --security --report
```

### config

Manage configuration.

```bash
agentic config <command> [options]
```

**Subcommands:**

| Command | Description |
|---------|-------------|
| `show` | Show current configuration |
| `get <key>` | Get specific value |
| `set <key> <value>` | Set configuration |
| `reset` | Reset to defaults |
| `validate` | Validate configuration |

**Examples:**

```bash
# Show all config
agentic config show

# Get specific value
agentic config get engine.timeout

# Set value
agentic config set engine.timeout 600000

# Validate config
agentic config validate

# Reset to defaults
agentic config reset
```

### agent

Manage and test agents.

```bash
agentic agent <command> [options]
```

**Subcommands:**

| Command | Description |
|---------|-------------|
| `list` | List available agents |
| `info <name>` | Show agent details |
| `test <name>` | Test agent |
| `status <name>` | Agent status |

**Examples:**

```bash
# List all agents
agentic agent list

# Show agent info
agentic agent info architect

# Test agent
agentic agent test architect --input test-input.json

# Check agent status
agentic agent status architect
```

### scenario

Manage scenarios.

```bash
agentic scenario <command> [options]
```

**Subcommands:**

| Command | Description |
|---------|-------------|
| `list` | List available scenarios |
| `info <id>` | Show scenario details |
| `validate <id>` | Validate scenario |
| `preview <id>` | Preview scenario output |

**Examples:**

```bash
# List scenarios
agentic scenario list

# Show scenario details
agentic scenario info S02

# Validate scenario
agentic scenario validate S02

# Preview output structure
agentic scenario preview S02 --output
```

### avm

Azure Verified Modules management.

```bash
agentic avm <command> [options]
```

**Subcommands:**

| Command | Description |
|---------|-------------|
| `search <query>` | Search AVM modules |
| `info <module>` | Module details |
| `refresh` | Update module cache |
| `check-updates` | Check for updates |

**Examples:**

```bash
# Search modules
agentic avm search "web app"

# Get module info
agentic avm info br/public:avm/res/web/site

# Refresh cache
agentic avm refresh

# Check for updates
agentic avm check-updates
```

### logs

View and manage logs.

```bash
agentic logs [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--tail <n>` | Last n lines | 50 |
| `--follow`, `-f` | Follow log output | `false` |
| `--phase <n>` | Filter by phase | All |
| `--agent <name>` | Filter by agent | All |
| `--level <level>` | Filter by level | All |
| `--since <time>` | Since time | All |

**Examples:**

```bash
# View recent logs
agentic logs

# Follow logs
agentic logs -f

# Filter by phase
agentic logs --phase 5

# Filter by agent
agentic logs --agent architect

# Filter by level
agentic logs --level error

# Time filter
agentic logs --since "1 hour ago"
```

### status

Show workflow status.

```bash
agentic status [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--workflow-id <id>` | Specific workflow | Latest |
| `--resources` | Include resource usage | `false` |

**Examples:**

```bash
# Current status
agentic status

# With resource usage
agentic status --resources

# Specific workflow
agentic status --workflow-id abc123
```

### doctor

Diagnose system issues.

```bash
agentic doctor [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--fix` | Attempt auto-fix | `false` |

**Examples:**

```bash
# Run diagnostics
agentic doctor

# Attempt fixes
agentic doctor --fix
```

### cache

Manage caches.

```bash
agentic cache <command>
```

**Subcommands:**

| Command | Description |
|---------|-------------|
| `clear` | Clear all caches |
| `clear-avm` | Clear AVM cache |
| `clear-agents` | Clear agent cache |
| `stats` | Show cache statistics |

**Examples:**

```bash
# Clear all caches
agentic cache clear

# Show cache stats
agentic cache stats
```

### diagnostics

Export diagnostic information.

```bash
agentic diagnostics export [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--output <file>` | Output file | `diagnostics.zip` |
| `--include-config` | Include configuration | `false` |
| `--include-logs` | Include logs | `false` |

**Examples:**

```bash
# Export diagnostics
agentic diagnostics export

# Full diagnostic package
agentic diagnostics export --include-config --include-logs
```

### bug-report

Generate bug report.

```bash
agentic bug-report
```

Creates a sanitized diagnostic package suitable for bug reports.

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Validation error |
| 4 | Workflow error |
| 5 | Timeout |
| 130 | User interrupted (Ctrl+C) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AGENTIC_CONFIG_PATH` | Configuration directory |
| `AGENTIC_LOG_LEVEL` | Log level |
| `AGENTIC_SCENARIO` | Default scenario |
| `GITHUB_TOKEN` | GitHub API token |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription |
| `AZURE_TENANT_ID` | Azure tenant |
| `DEBUG` | Debug namespaces |

## Configuration File

Default location: `.agentic/config/settings.yaml`

```yaml
project:
  name: "my-project"
  scenario: "S02"

engine:
  parallelExecution: true
  defaultTimeout: 300000

validation:
  enabled: true
  failOnError: true

logging:
  level: "info"
```

## Shell Completion

### Bash

```bash
# Add to ~/.bashrc
eval "$(agentic completion bash)"
```

### Zsh

```bash
# Add to ~/.zshrc
eval "$(agentic completion zsh)"
```

### PowerShell

```powershell
# Add to $PROFILE
agentic completion powershell | Out-String | Invoke-Expression
```

## Next Steps

- [Schema Reference](Schema-Reference) - Configuration schemas
- [Event Reference](Event-Reference) - Event types
- [Error Reference](Error-Reference) - Error codes
