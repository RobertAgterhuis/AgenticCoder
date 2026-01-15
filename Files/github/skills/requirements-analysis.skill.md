# requirements-analysis Skill

**Skill ID**: `requirements-analysis`  
**Purpose**: Extract, analyze, and transform business requirements into structured technical specifications  
**Used By**: @doc, @backlog, @coordinator agents  
**Type**: Analysis and transformation

---

## Knowledge Areas

- Requirements elicitation techniques
- Business analysis methodologies
- Use case analysis
- Acceptance criteria formulation
- Specification writing
- Traceability mapping

---

## Input Contract

**Schema**: [.github/schemas/skills/requirements-analysis.input.schema.json](../schemas/skills/requirements-analysis.input.schema.json)

```json
{
  "discovery_answers": {...},
  "analysis_mode": "extract | transform | validate",
  "context": {
    "project_type": "Enterprise | Startup",
    "compliance_required": true
  }
}
```

---

## Output Contract

**Schema**: [.github/schemas/skills/requirements-analysis.output.schema.json](../schemas/skills/requirements-analysis.output.schema.json)

```json
{
  "analysis_complete": true,
  "requirements_extracted": 42,
  "functional_requirements": [...],
  "non_functional_requirements": [...],
  "acceptance_criteria": [...]
}
```

---

## Core Capabilities

### 1. Extract Functional Requirements

From discovery answers and documents, identify:
- **User Features**: What users can do
- **System Operations**: What system must do
- **Data Management**: Data entities and operations
- **Integrations**: External system connections
- **Workflows**: Multi-step business processes

**Output Format**:
```markdown
## FR-001: User Authentication

**Description**: System must support user login with email/password

**Acceptance Criteria**:
- [ ] User can login with valid email/password
- [ ] Password must be at least 8 characters
- [ ] System locks account after 5 failed attempts
- [ ] Session timeout after 30 minutes of inactivity

**Related Stories**: STORY-1, STORY-2

**Compliance**: GDPR (password protection)
```

### 2. Extract Non-Functional Requirements

From project characteristics, identify:
- **Performance**: Response time, throughput, latency
- **Security**: Authentication, authorization, encryption
- **Reliability**: Uptime, fault tolerance, recovery
- **Scalability**: Concurrent users, data volume growth
- **Maintainability**: Code quality, documentation
- **Usability**: Accessibility, user experience
- **Compliance**: Regulatory requirements

**Output Format**:
```markdown
## NFR-001: API Response Time

**Category**: Performance  
**Requirement**: All API endpoints must respond within 200ms under normal load  
**Measurement**: Monitor response time via APM tools  
**Target**: 99.5% of requests < 200ms  
**Owner**: Backend team  
**Review Date**: Quarterly  
```

### 3. Transform to Acceptance Criteria

Convert requirement statements to testable acceptance criteria:

| Input | Transformation | Output |
|-------|----------------|--------|
| "User should be able to search" | + context | Given user on search page, when they enter search term, then results appear within 2s |
| "System must be reliable" | + metric | Given production deployment, when monitoring health, then uptime > 99.9% |
| "API must be secure" | + spec | Given API request, when authorization header missing, then return 401 Unauthorized |

### 4. Create Traceability Matrix

Map requirements to:
- User stories
- Acceptance criteria
- Test cases
- Architecture decisions

**Matrix Template**:
```markdown
| Requirement ID | Requirement | Stories | Acceptance Criteria | Test Cases |
|---|---|---|---|---|
| FR-001 | User login | STORY-1, STORY-2 | AC-001 to AC-005 | TC-001 to TC-010 |
| NFR-001 | API response <200ms | STORY-5, STORY-6 | AC-015 | TC-025 to TC-030 |
```

### 5. Validate Requirements Quality

Check for:
- **Completeness**: All business goals covered?
- **Consistency**: No contradictions?
- **Clarity**: Unambiguous language?
- **Testability**: Can requirements be verified?
- **Traceability**: Linked to business goals?
- **Feasibility**: Achievable with resources?

---

## Implementation Options

### Option 1: Direct Implementation (Recommended)

Use natural language processing (NLP) to:
1. Parse discovery answers
2. Identify requirement keywords ("must", "should", "need")
3. Group by requirement type
4. Transform to acceptance criteria format
5. Validate against templates

### Option 2: Via MCP Server

**MCP Server**: `requirements-analysis-mcp` (custom)

**Tools**:
- `analysis/extract_requirements`
- `analysis/transform_to_acceptance_criteria`
- `analysis/validate_traceability`

### Option 3: Via External API

**API Endpoint**: `/api/analysis/requirements`

---

## Performance Characteristics

- **Extraction**: ~50-100 requirements per minute
- **Transformation**: <100ms per requirement
- **Validation**: <50ms per requirement
- **Traceability**: Build matrix for 100 requirements in <2s

---

## Testing Strategy

**Unit Tests**:
- Test requirement extraction from various formats
- Test transformation logic
- Test validation rules
- Test traceability mapping

**Integration Tests**:
- Full analysis pipeline (extract → transform → validate)
- API contract verification
- Schema validation

---

## Used By

- **@doc Agent**: Extracts requirements from discovery for documentation
- **@backlog Agent**: Transforms requirements to user stories
- **@coordinator Agent**: Validates requirements against timeline

---

## Migration Notes

**New Skill**: Consolidates requirement-related capabilities from legacy agents.

**Files in Handoff Chain That Use This**:
- @doc → @backlog (requirements.input → stories.output)
- @backlog → @coordinator (stories → phase planning)

**Filename**: `requirements-analysis.skill.md`
