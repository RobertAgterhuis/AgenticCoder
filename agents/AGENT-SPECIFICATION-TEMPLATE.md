# Agent Specification Template

Use this template to define every agent in the AgenticCoder system.

## Metadata

- **ID**: `unique-agent-id` (kebab-case, lowercase)
- **Name**: Human-readable agent name
- **Tier**: Orchestration | Architecture | Implementation
- **Category**: Task categorization
- **Version**: Semantic version (e.g., 1.0.0)
- **Status**: Active | Deprecated | Experimental
- **Owner**: Team/person responsible
- **LastUpdated**: ISO date when last updated

---

## Purpose

**Brief Description**: 1-2 sentences describing the primary responsibility

**Extended Description**: Detailed explanation of what this agent does and why it's needed

**Key Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

---

## Inputs

### Input Schema
Reference to JSON schema: `.github/schemas/agents/{agent-id}-input.json`

### Required Fields
- `field1` (type) - Description
- `field2` (type) - Description

### Optional Fields
- `option1` (type) - Description

### Example Input
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

---

## Outputs

### Output Schema
Reference to JSON schema: `.github/schemas/agents/{agent-id}-output.json`

### Success Output Structure
```json
{
  "status": "success",
  "data": {
    "result": "..."
  },
  "metadata": {
    "executionTime": 0,
    "timestamp": "2026-01-14T10:00:00Z"
  }
}
```

### Error Output Structure
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

### Example Output
```json
{
  "status": "success",
  "data": {
    "result": "..."
  }
}
```

---

## Capabilities

### MCP Tools Available
- MCP Server: `server-name`
  - Tool 1: Description
  - Tool 2: Description

### Skills Accessible
- Skill 1: Description
- Skill 2: Description

### External Services
- Service 1: Description

### Agents It Can Invoke
- Agent ID: Context for invocation
- Agent ID: Context for invocation

---

## Workflow Position

### Predecessor Agents
Which agents typically run before this one:
- Agent ID: Condition/context
- Agent ID: Condition/context

### Successor Agents
Which agents typically run after this one:
- Agent ID: Condition/context
- Agent ID: Condition/context

### Conditional Logic
```
IF condition THEN invoke successor
IF condition THEN skip this agent
```

### Phase Position
Which phase(s) this agent operates in:
- Phase N: Description

---

## Configuration

### Environment Variables
- `ENV_VAR_1`: Description, required/optional, default value
- `ENV_VAR_2`: Description, required/optional, default value

### Timeouts
- **Default Timeout**: 300 seconds
- **Max Timeout**: 600 seconds

### Retry Policy
- **Max Retries**: 3
- **Backoff Strategy**: exponential
- **Initial Delay**: 1 second

### Resource Requirements
- **Memory**: Estimated memory needed
- **CPU**: Estimated CPU cores
- **Storage**: Estimated disk space

---

## Implementation Details

### Language
Programming language (Python, Node.js, etc.)

### Base Class
Inherits from: `BaseAgent`

### Dependencies
- Package 1: Version constraint
- Package 2: Version constraint

### Key Methods
```python
async def process(input_data: dict) -> dict
async def validate_input(input_data: dict) -> bool
async def call_mcp_tool(server: str, tool: str, params: dict) -> dict
```

---

## Examples

### Example 1: Success Scenario
**Description**: What this demonstrates

**Input**:
```json
{
  "input_field": "value"
}
```

**Output**:
```json
{
  "status": "success",
  "data": {
    "result": "expected_result"
  }
}
```

### Example 2: Error Scenario
**Description**: How errors are handled

**Input**:
```json
{
  "invalid_input": "bad_value"
}
```

**Output**:
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_INPUT",
    "message": "Input validation failed"
  }
}
```

---

## Testing

### Unit Tests
- Test 1: Description
- Test 2: Description
- Test 3: Description

### Integration Tests
- Test 1: Description with predecessor/successor agents
- Test 2: Description with MCP servers

### Test Coverage
Minimum 85% code coverage required

---

## Monitoring & Observability

### Metrics
- Execution time (P50, P95, P99)
- Success/failure rate
- MCP tool call counts

### Logs
- INFO: Agent starts/completes
- DEBUG: Input/output data
- ERROR: Failures and exceptions
- TRACE: MCP tool calls

### Alerts
- Alert condition 1
- Alert condition 2

---

## Deployment

### Container
- **Image**: `agenticcoder/{agent-id}:latest`
- **Resources**:
  - CPU Request: 100m
  - Memory Request: 256Mi
  - CPU Limit: 500m
  - Memory Limit: 1Gi

### Health Check
- **Endpoint**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 5 seconds

---

## Documentation Links

- [Full Documentation](link)
- [API Reference](link)
- [Architecture Decision Record](link)
- [Known Issues](link)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-14 | Initial release |

---

## Notes

Any additional notes, caveats, or important information.
