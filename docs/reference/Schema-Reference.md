# Schema Reference

JSON Schema definitions for AgenticCoder artifacts and configuration.

## Schema Overview

All schemas are available at:
```
https://agentic.dev/schemas/{category}/{version}.json
```

## Configuration Schemas

### settings.yaml

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/config/settings/v1.json",
  "title": "AgenticCoder Settings",
  "type": "object",
  "properties": {
    "project": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Project name",
          "pattern": "^[a-zA-Z][a-zA-Z0-9-_]*$"
        },
        "version": {
          "type": "string",
          "pattern": "^\\d+\\.\\d+\\.\\d+$"
        },
        "description": {
          "type": "string"
        },
        "scenario": {
          "type": "string",
          "enum": ["S01", "S02", "S03", "S04", "S05"]
        }
      },
      "required": ["name"]
    },
    "output": {
      "type": "object",
      "properties": {
        "baseDir": {
          "type": "string",
          "default": ".agentic/artifacts/"
        },
        "versioning": {
          "type": "boolean",
          "default": true
        },
        "timestamped": {
          "type": "boolean",
          "default": false
        }
      }
    },
    "environment": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "enum": ["development", "staging", "production"]
        }
      }
    },
    "features": {
      "type": "object",
      "properties": {
        "selfLearning": { "type": "boolean", "default": true },
        "feedbackLoop": { "type": "boolean", "default": true },
        "parallelExecution": { "type": "boolean", "default": true },
        "autoValidation": { "type": "boolean", "default": true }
      }
    }
  }
}
```

### engine.yaml

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/config/engine/v1.json",
  "title": "Engine Configuration",
  "type": "object",
  "properties": {
    "engine": {
      "type": "object",
      "properties": {
        "parallelExecution": {
          "type": "boolean",
          "default": true
        },
        "maxConcurrentAgents": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 3
        },
        "defaultTimeout": {
          "type": "integer",
          "minimum": 1000,
          "default": 300000,
          "description": "Default timeout in milliseconds"
        },
        "phaseTimeout": {
          "type": "integer",
          "minimum": 1000,
          "default": 600000
        },
        "workflowTimeout": {
          "type": "integer",
          "minimum": 1000,
          "default": 7200000
        },
        "checkpointInterval": {
          "type": "string",
          "enum": ["phase", "task", "time", "none"],
          "default": "phase"
        },
        "retry": {
          "$ref": "#/$defs/retryConfig"
        },
        "recovery": {
          "$ref": "#/$defs/recoveryConfig"
        }
      }
    }
  },
  "$defs": {
    "retryConfig": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "maxAttempts": { "type": "integer", "minimum": 1, "default": 3 },
        "backoff": { "type": "string", "enum": ["fixed", "exponential"], "default": "exponential" },
        "initialDelay": { "type": "integer", "default": 1000 },
        "maxDelay": { "type": "integer", "default": 30000 }
      }
    },
    "recoveryConfig": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "autoRestart": { "type": "boolean", "default": false },
        "preserveState": { "type": "boolean", "default": true }
      }
    }
  }
}
```

### validation.yaml

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/config/validation/v1.json",
  "title": "Validation Configuration",
  "type": "object",
  "properties": {
    "validation": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "failOnError": { "type": "boolean", "default": true },
        "failOnWarning": { "type": "boolean", "default": false },
        "autoFix": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "safeOnly": { "type": "boolean", "default": true }
          }
        },
        "validators": {
          "type": "object",
          "properties": {
            "schema": {
              "type": "object",
              "properties": {
                "enabled": { "type": "boolean" },
                "schemasDir": { "type": "string" }
              }
            },
            "syntax": {
              "type": "object",
              "properties": {
                "enabled": { "type": "boolean" }
              }
            },
            "semantic": {
              "type": "object",
              "properties": {
                "enabled": { "type": "boolean" },
                "rules": {
                  "type": "array",
                  "items": { "type": "string" }
                }
              }
            },
            "security": {
              "type": "object",
              "properties": {
                "enabled": { "type": "boolean" },
                "severityThreshold": {
                  "type": "string",
                  "enum": ["low", "medium", "high", "critical"]
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Artifact Schemas

### Agent Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/artifacts/agent/v1.json",
  "title": "Agent Definition",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "skills": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^@skills:[a-z][a-z0-9-/]*$"
      }
    },
    "systemPrompt": {
      "type": "string"
    },
    "capabilities": {
      "type": "array",
      "items": { "type": "string" }
    },
    "inputs": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/inputOutput"
      }
    },
    "outputs": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/inputOutput"
      }
    }
  },
  "required": ["id", "name", "description"],
  "$defs": {
    "inputOutput": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "type": { "type": "string" },
        "required": { "type": "boolean" },
        "description": { "type": "string" }
      }
    }
  }
}
```

### Skill Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/artifacts/skill/v1.json",
  "title": "Skill Definition",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "prerequisites": {
      "type": "array",
      "items": { "type": "string" }
    },
    "knowledge": {
      "type": "object",
      "properties": {
        "concepts": {
          "type": "array",
          "items": { "type": "string" }
        },
        "patterns": {
          "type": "array",
          "items": { "type": "string" }
        },
        "tools": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "examples": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "input": { "type": "string" },
          "output": { "type": "string" }
        }
      }
    }
  },
  "required": ["id", "name", "description"]
}
```

### Scenario Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/artifacts/scenario/v1.json",
  "title": "Scenario Definition",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[A-Z][A-Z0-9]*$"
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "version": {
      "type": "string"
    },
    "target": {
      "type": "object",
      "properties": {
        "audience": { "type": "string" },
        "teamSize": { "type": "string" },
        "experience": {
          "type": "string",
          "enum": ["junior", "mid", "senior", "mixed"]
        },
        "timeline": { "type": "string" }
      }
    },
    "complexity": {
      "type": "string",
      "enum": ["low", "medium", "high"]
    },
    "technology": {
      "type": "object",
      "properties": {
        "frontend": { "type": "string" },
        "backend": { "type": "string" },
        "database": { "type": "string" },
        "cloud": { "type": "string" }
      }
    },
    "phases": {
      "type": "object",
      "properties": {
        "include": {
          "oneOf": [
            { "const": "all" },
            { "type": "array", "items": { "type": "integer" } }
          ]
        },
        "skip": {
          "type": "array",
          "items": { "type": "integer" }
        }
      }
    },
    "agents": {
      "type": "object",
      "properties": {
        "required": {
          "type": "array",
          "items": { "type": "string" }
        },
        "optional": {
          "type": "array",
          "items": { "type": "string" }
        },
        "disabled": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  },
  "required": ["id", "name", "description"]
}
```

### Phase Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/artifacts/phase/v1.json",
  "title": "Phase Definition",
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16
    },
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "agents": {
      "type": "array",
      "items": { "type": "string" }
    },
    "sequence": {
      "type": "array",
      "items": { "type": "string" }
    },
    "dependencies": {
      "type": "array",
      "items": { "type": "integer" }
    },
    "outputs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "artifact": { "type": "string" },
          "format": { "type": "string" },
          "path": { "type": "string" }
        }
      }
    }
  },
  "required": ["id", "name", "agents"]
}
```

## Message Schemas

### Agent Message

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/messages/agent/v1.json",
  "title": "Agent Message",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "type": {
      "type": "string",
      "enum": ["request", "response", "event", "error"]
    },
    "source": {
      "type": "string"
    },
    "target": {
      "oneOf": [
        { "type": "string" },
        { "type": "array", "items": { "type": "string" } }
      ]
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "correlationId": {
      "type": "string",
      "format": "uuid"
    },
    "payload": {
      "type": "object"
    },
    "metadata": {
      "type": "object"
    }
  },
  "required": ["id", "type", "source", "timestamp"]
}
```

### Workflow Event

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/messages/workflow-event/v1.json",
  "title": "Workflow Event",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "workflowId": { "type": "string", "format": "uuid" },
    "type": {
      "type": "string",
      "enum": [
        "workflow:started",
        "workflow:completed",
        "workflow:failed",
        "phase:started",
        "phase:completed",
        "phase:failed",
        "agent:started",
        "agent:completed",
        "agent:failed",
        "validation:passed",
        "validation:failed"
      ]
    },
    "timestamp": { "type": "string", "format": "date-time" },
    "data": { "type": "object" }
  },
  "required": ["id", "workflowId", "type", "timestamp"]
}
```

## Validation Schemas

### Validation Result

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentic.dev/schemas/validation/result/v1.json",
  "title": "Validation Result",
  "type": "object",
  "properties": {
    "valid": { "type": "boolean" },
    "timestamp": { "type": "string", "format": "date-time" },
    "duration": { "type": "integer" },
    "errors": {
      "type": "array",
      "items": { "$ref": "#/$defs/issue" }
    },
    "warnings": {
      "type": "array",
      "items": { "$ref": "#/$defs/issue" }
    },
    "fixes": {
      "type": "array",
      "items": { "$ref": "#/$defs/fix" }
    }
  },
  "$defs": {
    "issue": {
      "type": "object",
      "properties": {
        "code": { "type": "string" },
        "message": { "type": "string" },
        "severity": { "type": "string", "enum": ["error", "warning", "info"] },
        "path": { "type": "string" },
        "line": { "type": "integer" },
        "column": { "type": "integer" },
        "source": { "type": "string" }
      }
    },
    "fix": {
      "type": "object",
      "properties": {
        "issueCode": { "type": "string" },
        "applied": { "type": "boolean" },
        "description": { "type": "string" },
        "changes": { "type": "array" }
      }
    }
  }
}
```

## Schema Validation

### TypeScript Usage

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load schema
const schema = await fetch('https://agentic.dev/schemas/config/settings/v1.json')
  .then(r => r.json());

const validate = ajv.compile(schema);

// Validate data
const valid = validate(settingsData);
if (!valid) {
  console.error(validate.errors);
}
```

### CLI Validation

```bash
# Validate configuration
agentic validate --schema config/settings settings.yaml

# Validate artifact
agentic validate --schema artifacts/agent my-agent.yaml
```

## Next Steps

- [CLI Reference](CLI-Reference) - Command-line interface
- [Event Reference](Event-Reference) - Event types
- [Error Reference](Error-Reference) - Error codes
