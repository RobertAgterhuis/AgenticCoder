# Configuration Management System - Quick Reference

## File Structure
```
.agenticcoder/config/
├── schema.json                    # Validates all configs
├── defaults.yaml                  # Base configuration
├── project.yaml                   # Project-specific overrides
└── profiles/
    ├── development.yaml           # Dev environment
    ├── staging.yaml              # Staging environment
    └── production.yaml           # Production (strict)
```

## Key Concepts

### 1. Hierarchical Merging
```
defaults.yaml
    ↓ merged with
project.yaml
    ↓ merged with
profiles/{environment}.yaml
    ↓ merged with
runtime_overrides (from CLI/API)
```

Later layers override earlier ones for matching keys.

### 2. Agent Configuration
Each agent can be individually configured:
```yaml
agents:
  react-specialist:
    enabled: true
    timeout: 600                    # seconds
    max_retries: 3
    output_quality: "production"   # draft, standard, production, security-hardened
    constraints:                    # Hard requirements
      - "must_include_tests: true"
      - "accessibility_standard: wcag2.1-aa"
    preferred_options:              # Implementation choices
      framework: "next.js"
      styling: "tailwind"
      testing: "vitest"
```

### 3. Rules Engine
Automatic rules that trigger based on conditions:
```yaml
rules:
  - name: "enforce-testing"
    condition: "artifact.type == 'component'"
    action: "require_unit_tests"
    severity: "error"
```

Available actions:
- `require_unit_tests` - Block output without tests
- `trigger_security_scan` - Run security scanning
- `require_documentation` - Require API docs
- `enforce_code_review` - Require human review
- `block_execution` - Stop agent execution
- `auto_approve` - Auto-approve without review

### 4. Approval Workflow
Multi-level approval process:
```yaml
approval_workflow:
  - level: "code_review"
    required_approvers: 1
    agents: ["@qa-agent"]
    timeout: 3600
  
  - level: "security_review"
    required_approvers: 1
    agents: ["@security-agent"]
    timeout: 7200
```

### 5. Feature Toggles
Enable/disable entire subsystems:
```yaml
feedback_loops:
  enabled: true              # Turn feedback system on/off
  clarification_required: true  # Block until answered
  timeout: 300              # Wait 5 minutes for response

communication:
  enabled: true              # Enable agent-to-agent messaging
  message_queue: "memory"   # memory, redis, rabbitmq, kafka
  timeout: 30               # Message delivery timeout

artifact_management:
  versioning:
    enabled: true           # Track versions
    keep_history: 0         # 0 = unlimited versions
```

## Usage Examples

### Get Config Value
```python
from config import ConfigManager

config = ConfigManager.get_instance()

# Simple value
timeout = config.get("agents.react-specialist.timeout")

# With default
quality = config.get("agents.react-specialist.output_quality", "standard")

# Nested value
is_testing_required = config.get(
    "rules[0].action" == "require_unit_tests"
)
```

### Check Feature
```python
if config.get("feedback_loops.enabled"):
    await request_clarification()

if config.get("artifact_management.versioning.enabled"):
    await save_version()
```

### Apply Config Constraints
```python
agent_config = config.get("agents.react-specialist")

for constraint in agent_config.get("constraints", []):
    # constraint format: "key: value"
    validate_constraint(constraint)
```

### CLI Usage
```bash
# Use production profile (strict)
agenticcoder generate --profile production

# Use development profile (relaxed)
agenticcoder generate --profile development

# Override specific value
agenticcoder generate \
  --override "agents.react-specialist.timeout=1200" \
  --override "feedback_loops.clarification_required=false"

# Custom profile
agenticcoder generate --config .agenticcoder/config/custom.yaml
```

## Common Scenarios

### Scenario 1: Require Tests + Security Scan
```yaml
agents:
  react-specialist:
    output_quality: "production"
    constraints:
      - "must_include_tests: true"

rules:
  - condition: "artifact.type == 'component'"
    action: "require_unit_tests"
    severity: "error"
  
  - condition: "artifact.type == 'dependency'"
    action: "trigger_security_scan"
    severity: "error"
```

### Scenario 2: Relaxed Development
```yaml
agents:
  react-specialist:
    timeout: 300
    max_retries: 2
    output_quality: "draft"

rules: []  # No rules

approval_workflow:
  - level: "code_review"
    required_approvers: 0
    auto_approve_conditions: ["true"]
```

### Scenario 3: Strict Production
```yaml
agents:
  react-specialist:
    timeout: 600
    max_retries: 3
    output_quality: "production"
    constraints:
      - "must_include_tests: true"
      - "accessibility_standard: wcag2.1-aa"

rules:
  - condition: "artifact.type == 'component'"
    action: "require_unit_tests"
    severity: "error"
  - condition: "artifact.language == 'react'"
    action: "require_accessibility_check"
    severity: "error"

approval_workflow:
  - level: "code_review"
    required_approvers: 1
    timeout: 3600
  - level: "security_review"
    required_approvers: 1
    timeout: 7200
```

## Configuration Priority

When multiple configs define the same value:
1. **Runtime overrides** (highest priority) - from CLI/API
2. **Profile config** - environment-specific (dev/staging/prod)
3. **Project config** - project-wide defaults
4. **System defaults** - from defaults.yaml
5. **Schema defaults** - fallback values

First match wins when merging.

## Validation

All configs are validated against `schema.json` automatically. If validation fails:
```
ConfigValidationError: Invalid configuration
  - agents.react-specialist.timeout: must be >= 30
  - agents.react-specialist.output_quality: must be one of [draft, standard, production, security-hardened]
```

## Best Practices

1. **Version control** - Commit all configs to git
2. **Profile per environment** - One YAML per deployment target
3. **Least privilege** - Start strict, loosen only as needed
4. **Document changes** - Add comments explaining custom settings
5. **Review rules** - Ensure rules match team standards
6. **Test profiles** - Validate in staging before production
