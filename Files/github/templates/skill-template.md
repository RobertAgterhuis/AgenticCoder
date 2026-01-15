# Skill: [Skill Name]

**Category**: {{ category }} (Analysis, Generation, Validation, Integration)  
**Version**: {{ version }}  
**Domain**: {{ domain }}

## Overview

[Comprehensive description of what this skill does and when to use it]

## Knowledge Areas

1. **[Area 1]**: Description
2. **[Area 2]**: Description
3. **[Area 3]**: Description

## Input/Output Contract

**Input**:
```json
{
  "type": "object",
  "required": ["param1", "param2"],
  "properties": {}
}
```

**Output**:
```json
{
  "type": "object",
  "required": ["result"],
  "properties": {}
}
```

## Implementation Options

### Option 1: Direct Implementation
```python
def execute_skill(input_data: dict) -> dict:
    # Direct Python implementation
    pass
```

### Option 2: MCP Server Query
```
Call: [mcp-server].tool_name
With: [input parameters]
```

### Option 3: External API
```
Call: [external_api]
Auth: [authentication method]
```

## Example Usage

**Input**: 
```json
{}
```

**Output**: 
```json
{}
```

## Validation Checklist

- [ ] Handles edge cases
- [ ] Error handling present
- [ ] Input validation works
- [ ] Output verified
- [ ] Performance acceptable
- [ ] Documentation complete
