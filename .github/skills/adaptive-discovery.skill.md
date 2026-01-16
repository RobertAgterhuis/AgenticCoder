# adaptive-discovery Skill

**Skill ID**: `adaptive-discovery`  
**Purpose**: Execute adaptive, context-aware discovery conversations to gather project requirements  
**Used By**: @plan agent  
**Type**: Interactive conversation flow

---

## Knowledge Areas

- Project discovery methodologies
- Requirements elicitation techniques
- Adaptive questioning strategies
- User experience research
- Business analysis
- Stakeholder management

---

## Input Contract

**Schema**: [.github/schemas/skills/adaptive-discovery.input.schema.json](../schemas/skills/adaptive-discovery.input.schema.json)

```json
{
  "mode": "interactive | template | guided",
  "context": {
    "project_type_hint": "Enterprise | Startup | Internal | API",
    "industry": "string",
    "existing_documentation": "path/to/docs (optional)"
  }
}
```

---

## Output Contract

**Schema**: [.github/schemas/skills/adaptive-discovery.output.schema.json](../schemas/skills/adaptive-discovery.output.schema.json)

```json
{
  "discovery_complete": true,
  "questions_asked": 22,
  "phases_completed": 4,
  "answers": {
    "project_name": "...",
    "organization": "...",
    "business_goals": [...],
    ...
  }
}
```

---

## Core Capabilities

### 1. Four-Phase Discovery Flow

**Phase 1: Project Essentials** (5-7 questions)
- Project name
- Organization
- Primary business goals (3-5 recommended)
- Key stakeholders
- Target timeline
- Team size

**Phase 2: Technical Foundation** (6-8 questions)
- Backend technology stack
- Frontend technology stack
- Cloud provider (Azure, AWS, GCP, On-Premises, Hybrid)
- Database selection
- Authentication/authorization strategy
- Testing approach and coverage targets

**Phase 3: Architecture & Quality** (5-7 questions)
- Compliance requirements (GDPR, HIPAA, SOC2, etc.)
- Security requirements
- Performance expectations
- Scalability targets
- Integration requirements
- Observability strategy

**Phase 4: Implementation Strategy** (4-6 questions)
- Number of implementation phases
- Release strategy (Agile Sprints, Waterfall, Continuous Delivery, Phased Release)
- Definition of Done
- Risk tolerance
- Budget constraints
- Success metrics

### 2. Adaptive Questioning

**Context-Aware Follow-ups**:
- If "Azure" selected → Ask about Azure-specific services (App Service, Functions, AKS)
- If "Regulated Industry" → Deep dive into compliance (audit trails, data residency)
- If "API/Platform" → Focus on API design, versioning, SLAs
- If "Large Team (9+)" → Ask about team structure, communication protocols

**Smart Defaults**:
- Suggest common patterns based on project type
- Pre-fill reasonable defaults where possible
- Allow skipping optional questions with defaults

**Validation**:
- Ensure required fields are not empty
- Validate numeric ranges (team_size: 1-1000, test_coverage: 0-100)
- Validate enum values (cloud_provider, release_strategy)

### 3. Template Mode

Load pre-defined project templates:
- **Startup MVP Template**: Minimal questions, focus on speed
- **Enterprise Platform Template**: Comprehensive discovery
- **API Service Template**: API-first questions
- **Internal Tool Template**: Integration-focused
- **Mobile App Template**: Platform-specific questions

---

## Implementation Options

### Option 1: Direct Implementation (Recommended)

**When to Use**: For most discovery scenarios within VS Code environment

**Implementation**:
```typescript
// Pseudo-code for adaptive-discovery skill
async function executeAdaptiveDiscovery(input: AdaptiveDiscoveryInput): Promise<AdaptiveDiscoveryOutput> {
  const answers = {};
  
  // Phase 1: Project Essentials
  answers.project_name = await askQuestion("What is your project name?");
  answers.organization = await askQuestion("What is your organization name?");
  answers.business_goals = await askMultipleChoice("What are your primary business goals?", {
    options: ["Increase revenue", "Improve efficiency", "Enter new market", "Reduce costs"],
    min: 1,
    max: 5
  });
  
  // Phase 2: Technical Foundation (adaptive)
  answers.cloud_provider = await askChoice("Which cloud provider?", ["Azure", "AWS", "GCP", "On-Premises", "Hybrid"]);
  
  if (answers.cloud_provider === "Azure") {
    answers.azure_services = await askMultipleChoice("Which Azure services?", {
      options: ["App Service", "Functions", "AKS", "Static Web Apps", "API Management"]
    });
  }
  
  // Phase 3: Architecture & Quality (conditional)
  if (input.context.industry === "Healthcare" || input.context.industry === "Finance") {
    answers.compliance_requirements = await askMultipleChoice("Compliance requirements?", {
      options: ["GDPR", "HIPAA", "SOC2", "PCI-DSS", "FINRA"]
    });
  }
  
  // Phase 4: Implementation Strategy
  answers.phases_count = await askNumber("How many implementation phases?", {min: 1, max: 10, default: 3});
  answers.release_strategy = await askChoice("Release strategy?", [
    "Agile Sprints",
    "Waterfall",
    "Continuous Delivery",
    "Phased Release"
  ]);
  
  return {
    discovery_complete: true,
    questions_asked: 22,
    phases_completed: 4,
    answers
  };
}
```

### Option 2: Via MCP Server

**When to Use**: When discovery needs to be shared across multiple tools or environments

**MCP Server**: `project-discovery-mcp` (custom, would need to be implemented)

**Tools Provided**:
- `discovery/start` - Start new discovery session
- `discovery/ask_question` - Ask single question
- `discovery/validate_answers` - Validate answer completeness
- `discovery/export` - Export answers as JSON

### Option 3: Via External API

**When to Use**: When integrating with enterprise project management tools (Jira, Azure DevOps)

**API Endpoint**: `/api/discovery/execute`

**Integration**:
```json
POST /api/discovery/execute
{
  "mode": "interactive",
  "context": {...}
}

Response:
{
  "discovery_complete": true,
  "answers": {...}
}
```

---

## Example Usage

### Example 1: Startup MVP Discovery

**Input**:
```json
{
  "mode": "template",
  "context": {
    "project_type_hint": "Startup",
    "industry": "SaaS"
  }
}
```

**Questions Asked** (11 instead of 22):
1. Project name?
2. Organization?
3. Top 3 business goals?
4. Target launch date?
5. Team size?
6. Backend stack?
7. Frontend stack?
8. Cloud provider?
9. Database?
10. Release strategy?
11. Success metrics?

**Output**:
```json
{
  "discovery_complete": true,
  "questions_asked": 11,
  "phases_completed": 4,
  "answers": {
    "project_name": "TaskMaster SaaS",
    "organization": "Acme Startup Inc",
    "business_goals": ["Launch MVP in 3 months", "Acquire 1000 users", "Validate product-market fit"],
    "timeline": "Q2 2026",
    "team_size": 3,
    "backend_stack": "Node.js + Express",
    "frontend_stack": "React + Vite",
    "cloud_provider": "Azure",
    "database": "Azure Cosmos DB",
    "release_strategy": "Continuous Delivery"
  }
}
```

### Example 2: Enterprise Platform Discovery

**Input**:
```json
{
  "mode": "interactive",
  "context": {
    "project_type_hint": "Enterprise",
    "industry": "Healthcare"
  }
}
```

**Questions Asked** (28 - expanded due to compliance):
- All 22 standard questions
- 6 additional compliance questions (HIPAA, audit trails, data residency, encryption, access controls, breach notification)

**Output**:
```json
{
  "discovery_complete": true,
  "questions_asked": 28,
  "phases_completed": 4,
  "answers": {
    "project_name": "Patient Portal Modernization",
    "organization": "MedTech Solutions",
    "compliance_requirements": ["HIPAA", "GDPR", "HITECH"],
    "security_requirements": "End-to-end encryption, MFA, audit logging",
    ...
  }
}
```

---

## Dependencies

- **JSON Schema validation**: For validating answers against expected formats
- **VS Code Extension API**: For interactive prompts (if running in VS Code)
- **Readline (Node.js)**: For CLI-based discovery

---

## Performance Considerations

- **Average completion time**: 5-15 minutes (depends on project complexity)
- **Question caching**: Cache answered questions to allow resuming
- **Validation latency**: <100ms per question validation
- **Template loading**: <500ms for pre-defined templates

---

## Testing Strategy

**Unit Tests**:
- Test each phase independently
- Validate question branching logic
- Test smart defaults
- Validate answer validation

**Integration Tests**:
- Full 22-question flow (interactive mode)
- Template mode with all templates
- Resume from partial answers
- Export/import answer sets

**Test Scenarios**:
1. Startup MVP (minimal discovery)
2. Enterprise Platform (comprehensive discovery)
3. API Service (API-focused questions)
4. Healthcare app (compliance-heavy)
5. Resume from Phase 2 (interruption recovery)

---

## Migration Notes

**Changes from Legacy**:
1. Added JSON input/output schemas
2. Formalized four-phase structure
3. Added template mode
4. Added adaptive branching rules
5. Standardized validation logic

**Preserved from Legacy**:
- 22-question core structure
- Four-phase approach
- Smart defaults
- Context-aware follow-ups

**New Filename**: `adaptive-discovery.skill.md`
