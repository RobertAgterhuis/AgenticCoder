# technical-writing Skill

**Skill ID**: `technical-writing`  
**Purpose**: Generate clear, well-structured technical documentation at various levels (architecture, API, user guides)  
**Used By**: @doc agent  
**Type**: Documentation generation

---

## Knowledge Areas

- Technical documentation standards
- API documentation (OpenAPI/Swagger)
- Architecture documentation (C4, ArchiMate)
- User documentation and guides
- Code commenting and inline documentation
- Release notes and change logs

---

## Input Contract

```json
{
  "content_type": "architecture | api | user_guide | runbook",
  "source_data": {...},
  "audience": "technical | non_technical | mixed",
  "detail_level": "overview | detailed | comprehensive"
}
```

---

## Output Contract

```json
{
  "documentation_generated": true,
  "document_type": "...",
  "word_count": 2500,
  "structure_valid": true,
  "examples_included": true
}
```

---

## Core Capabilities

### 1. Architecture Documentation

**C4 Model Diagrams** (with text descriptions):
- Context diagrams
- Container diagrams
- Component diagrams
- Code diagrams

**Architecture Decision Records** (ADRs):
```markdown
# ADR-001: Use microservices architecture

## Status: Accepted

## Context
Project requires independent scaling of different features...

## Decision
We will use microservices architecture instead of monolith

## Consequences
- (+) Independent deployment
- (-) Distributed systems complexity
- (+) Team autonomy
- (-) Network latency
```

### 2. API Documentation (OpenAPI)

**Template**:
```yaml
openapi: 3.0.0
info:
  title: Project API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List all users
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```

### 3. User & Runbook Documentation

**Structure**:
```markdown
# Feature: User Authentication

## Overview
[1-2 paragraph explanation]

## Getting Started
[Step-by-step instructions]

## Common Tasks
- Task 1: [How to do it]
- Task 2: [How to do it]

## Troubleshooting
| Problem | Solution |
|---------|----------|
| Can't login | Check credentials |

## Advanced
[For power users]

## FAQ
[Common questions]
```

### 4. Release Notes Generation

```markdown
# Release v2.1.0 - January 13, 2026

## New Features
- Feature A: [Description]
- Feature B: [Description]

## Bug Fixes
- Bug #123: Fixed login timeout
- Bug #456: Fixed search performance

## Breaking Changes
- Removed deprecated API endpoint /v1/users
- Changed password format requirement

## Migration Guide
[For users upgrading from v2.0.0]

## Known Issues
- Issue #789: Search is slow with >10k items
```

---

## Implementation Options

### Option 1: Template-Based (Recommended)

Use markdown templates + variable substitution:
1. Load template for document type
2. Extract source data
3. Fill template sections
4. Validate structure
5. Generate final document

### Option 2: Via MCP Server

**MCP Server**: `documentation-generator-mcp`

**Tools**:
- `docs/generate_architecture`
- `docs/generate_api_spec`
- `docs/generate_user_guide`

### Option 3: LLM-Powered

Use Claude/GPT to generate contextual documentation from structured inputs.

---

## Writing Principles

1. **Clarity over completeness**: Clear incomplete docs > confusing complete docs
2. **Examples first**: Lead with what users want to do
3. **Scannable**: Use headers, lists, tables
4. **Linked**: Cross-reference related docs
5. **Tested**: Code examples should actually work
6. **Maintained**: Update docs with code changes

---

## Performance Characteristics

- **Architecture doc**: 3000-5000 words, <2 minutes to generate
- **API spec**: OpenAPI generation, <1 minute for 20 endpoints
- **User guide**: 1000-2000 words per feature, <1 minute per guide
- **Release notes**: <5 minutes to compile and format

---

## Testing Strategy

- Test template rendering with various inputs
- Validate generated markdown syntax
- Check OpenAPI spec validity
- Verify examples are accurate

---

## Used By

- **@doc Agent**: Generates all Phase 1 documentation (Context, Architecture, Appendix)

---

## Filename**: `technical-writing.skill.md`
