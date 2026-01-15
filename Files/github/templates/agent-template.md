# Agent: [Agent Name]

**Type**: {{ agent_type }} (e.g., Analysis, Generation, Coordination)  
**Agents Version**: {{ version }}  
**Domain**: {{ domain }} (Azure, Infrastructure, Documentation, etc.)  

## Overview

[Brief description of what the agent does]

## Input Specification

```json
{
  "source": "string (previous_agent or user)",
  "phase": "integer (0-7)",
  "input": {
    // Agent-specific input structure
  }
}
```

See: `.github/schemas/agents/[agent-name].input.schema.json`

## Output Specification

```json
{
  "agent_id": "[agent-name]",
  "phase": "integer",
  "output": {
    // Agent-specific output
  },
  "artifacts": [
    {
      "name": "artifact-name.md",
      "path": "path/to/artifact",
      "schema": "[artifact-type].schema.json"
    }
  ]
}
```

See: `.github/schemas/agents/[agent-name].output.schema.json`

## Responsibilities

- [ ] Validate input against schema
- [ ] Process input
- [ ] Call appropriate skills
- [ ] Query MCP servers (if needed)
- [ ] Generate artifacts
- [ ] Return output

## Skills Used

- [Skill 1](#)
- [Skill 2](#)
- [Skill 3](#)

## MCP Servers Called

- [ ] azure-pricing-mcp
- [ ] azure-resource-graph-mcp
- [ ] microsoft-docs-mcp

## Example Execution

**Input**:
```json
{
  "source": "previous_agent",
  "phase": 2,
  "input": {}
}
```

**Output**:
```json
{
  "agent_id": "[agent-name]",
  "phase": 2,
  "output": {},
  "artifacts": []
}
```

## Implementation Guidelines

1. Always validate input first
2. Return structured output
3. Generate artifacts in `/artifacts/` folder
4. Log all MCP server calls
5. Handle errors gracefully
6. Update success metrics

## Validation Checklist

- [ ] Input validation passes
- [ ] Output schema validated
- [ ] All artifacts created
- [ ] No hardcoded values
- [ ] Error handling present
- [ ] Logging implemented
- [ ] Unit tests pass
- [ ] Integration tests pass
