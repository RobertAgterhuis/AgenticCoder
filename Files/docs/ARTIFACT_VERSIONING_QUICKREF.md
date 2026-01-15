# Artifact Versioning System - Quick Reference

## File Structure
```
.agenticcoder/artifacts/
├── schema.json
└── {artifact-id}/
    ├── manifest.json              # Metadata about all versions
    ├── _current -> v1.0.json      # Symlink to current version
    └── versions/
        ├── v0.1.json              # Version snapshot
        ├── v0.2.json
        └── v1.0.json
```

## Key Concepts

### 1. Artifact Lifecycle
```
draft → in-review → approved → in-use → deprecated
         ↑                                    ↓
         └────────── (feedback loop) ────────┘
```

### 2. Version Format
Semantic versioning: `MAJOR.MINOR.PATCH`
- `v0.1.0` - Initial draft
- `v0.2.0` - Bug fix or small feature
- `v1.0.0` - First stable release
- `v1.1.0` - Backward-compatible update
- `v2.0.0` - Breaking changes

### 3. What Gets Versioned
- Components (React, Vue, Angular)
- Functions/modules
- Services (APIs, microservices)
- Configurations
- Database schemas
- Docker/deployment configs
- Tests
- Documentation

## Core Operations

### Save a New Version
```python
from artifacts import ArtifactVersion, ArtifactVersioning

versioning = ArtifactVersioning(workspace_root)

artifact = ArtifactVersion(
    artifact_id="login-form",
    version="1.0.0",
    content="<component code here>",
    type="component",
    language="typescript",
    status="approved",
    created_by="@react-specialist",
    created_at=datetime.now(),
    description="Login form with security hardening",
    tags=["auth", "security", "form"],
    changes={
        "summary": "Security hardening and accessibility improvements",
        "added": ["password strength meter", "2FA support"],
        "modified": ["validation logic"],
        "removed": ["legacy OAuth1 support"]
    }
)

versioning.save_version(artifact)
```

### Get Current Version
```python
current = versioning.get_version("login-form")
print(current.version)      # "1.0.0"
print(current.content)      # Component code
print(current.status)       # "approved"
```

### Get Specific Version
```python
old_version = versioning.get_version("login-form", version="0.2")
print(old_version.description)  # "Beta version with basic validation"
```

### View History
```python
history = versioning.get_version_history("login-form")
for v in history:
    print(f"{v.version}: {v.description} ({v.status})")

# Output:
# v0.1: Initial implementation (in-use)
# v0.2: Added password strength (in-review)
# v1.0: Security hardening (approved)
```

### Rollback to Previous Version
```python
# Go back to v0.2
versioning.rollback("login-form", "0.2")

# Now get_version() returns v0.2
current = versioning.get_version("login-form")
assert current.version == "0.2"
```

### Check Dependencies
```python
# What does this artifact depend on?
deps = versioning.get_dependencies("login-form")
# ["auth-service", "password-validator"]

# What depends on this artifact?
dependents = versioning.get_dependents("password-validator")
# ["login-form", "password-reset"]
```

## Metadata Tracking

### Quality Metrics
```python
artifact.quality_metrics = {
    "test_coverage": 94,
    "security_scan": "passed",
    "accessibility_score": 98,
    "performance": "excellent",
    "code_complexity": "low",
    "vulnerabilities": []
}
```

### Change Tracking
```python
artifact.changes = {
    "summary": "What changed in this version",
    "added": ["new feature 1", "new feature 2"],
    "modified": ["existing feature"],
    "removed": ["deprecated feature"],
    "breaking_changes": ["API endpoint changed"]
}
```

### Approval Chain
```python
artifact.approval = {
    "status": "approved",
    "chain": [
        {
            "level": "code_review",
            "agent": "@qa-agent",
            "timestamp": "2026-01-13T10:30:00Z",
            "decision": "approved",
            "notes": "Code looks good"
        },
        {
            "level": "security_review",
            "agent": "@security-agent",
            "timestamp": "2026-01-13T11:15:00Z",
            "decision": "approved_with_notes",
            "required_changes": ["Add rate limiting"]
        }
    ]
}
```

### Dependencies
```python
artifact.dependencies = [
    {
        "artifact": "auth-service",
        "version": ">=1.0.0",
        "satisfied_by": "v1.2.3"
    },
    {
        "artifact": "password-validator",
        "version": "~2.0.0",
        "satisfied_by": "v2.1.0"
    }
]
```

## Usage Patterns

### Pattern 1: Track Feature Development
```python
# v0.1 - Initial draft
versioning.save_version(ArtifactVersion(..., version="0.1", status="draft"))

# v0.2 - After code review
versioning.save_version(ArtifactVersion(..., version="0.2", status="in-review"))

# v1.0 - Approved for production
versioning.save_version(ArtifactVersion(..., version="1.0", status="approved"))

# v1.1 - Bug fix
versioning.save_version(ArtifactVersion(..., version="1.1", status="in-use"))
```

### Pattern 2: A/B Testing Variants
```python
# Original version
versioning.save_version(ArtifactVersion(..., version="1.0", tags=["variant-a"]))

# Experimental variant
versioning.save_version(ArtifactVersion(..., version="1.0-exp", tags=["variant-b"]))

# Can test both and promote winner
versioning.rollback("login-form", "1.0-exp")  # Switch to variant B
```

### Pattern 3: Branch-Based Development
```python
# Main branch
versioning.save_version(ArtifactVersion(..., version="1.0"))

# Feature branch
versioning.save_version(ArtifactVersion(..., version="1.1-feature-x"))

# Merge back
versioning.save_version(ArtifactVersion(..., version="1.1"))
```

## Best Practices

1. **Meaningful Versions** - Follow semantic versioning strictly
2. **Clear Descriptions** - Always document what changed
3. **Change Summaries** - added/modified/removed, not just "updated"
4. **Quality Metrics** - Track test coverage, security, accessibility
5. **Dependency Tracking** - Keep dependencies updated
6. **Approval Records** - Maintain approval chain for accountability
7. **Retention** - Keep history (unlimited or configurable limit)
8. **Tags** - Use tags for categorization: "auth", "security", "ui"

## Common Scenarios

### Scenario 1: Bug Fix Release
```python
current = versioning.get_version("login-form", "1.0")
fixed = ArtifactVersion(
    artifact_id="login-form",
    version="1.0.1",  # Patch version
    content=fixed_code,
    type="component",
    status="approved",
    created_by="@react-specialist",
    created_at=datetime.now(),
    description="Fixed XSS vulnerability in password field",
    changes={
        "summary": "Security patch",
        "added": [],
        "modified": ["password input sanitization"],
        "removed": [],
        "breaking_changes": []
    }
)
versioning.save_version(fixed)
```

### Scenario 2: Rollback on Production Issue
```python
# Issue detected in v1.1
# Rollback to v1.0 immediately
versioning.rollback("login-form", "1.0")

# Later, create v1.1.1 with fix
versioning.save_version(ArtifactVersion(..., version="1.1.1"))

# Deploy v1.1.1
```

### Scenario 3: Experiment with Breaking Changes
```python
# Create v2.0 with breaking changes (don't deploy yet)
versioning.save_version(ArtifactVersion(..., version="2.0", status="draft"))

# Test v2.0
test_results = run_integration_tests(versioning.get_version("login-form", "2.0"))

# If good: approve and schedule migration
if test_results.all_pass:
    versioning.save_version(ArtifactVersion(..., version="2.0", status="approved"))
```

## Querying Artifacts

### Get All Versions
```python
versions = versioning.get_version_history("login-form")
```

### Get Latest Version by Status
```python
all_versions = versioning.get_version_history("login-form")
approved = [v for v in all_versions if v.status == "approved"]
latest_approved = approved[-1]
```

### Find by Tag
```python
all_versions = versioning.get_version_history("login-form")
security_versions = [v for v in all_versions if "security" in v.tags]
```

### Get Version Diffs
```python
v1 = versioning.get_version("login-form", "1.0")
v2 = versioning.get_version("login-form", "1.1")
diff = unified_diff(v1.content, v2.content)
```

## Integration with Config System

The config system controls versioning behavior:
```yaml
artifact_management:
  versioning:
    enabled: true
    strategy: "semantic"           # or timestamp, sequential
    keep_history: 0               # 0 = unlimited
    auto_tag: true                # Auto-generate tags from config

  quality_gates:
    min_test_coverage: 85
    require_security_scan: true
    max_vulnerabilities: 0
```
