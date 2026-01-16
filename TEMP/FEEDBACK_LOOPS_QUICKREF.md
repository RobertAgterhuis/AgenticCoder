# Agent Feedback Loops - Quick Reference

## Purpose
Agents ask clarifying questions instead of guessing, improving output quality and user experience.

## File Structure
```
.agenticcoder/feedback/
├── schema.json
├── requests/
│   └── feedback-{uuid}.json           # Pending feedback requests
└── responses/
    └── feedback-{uuid}.json           # User responses
```

## Question Types

### 1. Choice (Single Select)
```python
Question(
    id="styling",
    question="Which styling approach?",
    type="choice",
    choices=[
        {"id": "tailwind", "label": "Tailwind CSS"},
        {"id": "css-modules", "label": "CSS Modules"},
        {"id": "styled-components", "label": "Styled Components"}
    ],
    default="tailwind"
)
```

### 2. Multiple Choice
```python
Question(
    id="features",
    question="Which features needed?",
    type="multiple_choice",
    choices=[
        {"id": "auth", "label": "Authentication"},
        {"id": "logging", "label": "Logging"},
        {"id": "monitoring", "label": "Monitoring"}
    ]
)
```

### 3. Boolean
```python
Question(
    id="need_tests",
    question="Should this include unit tests?",
    type="boolean",
    default=True
)
```

### 4. Text Input
```python
Question(
    id="component_name",
    question="What should this component be called?",
    type="text",
    examples=["LoginForm", "UserProfile", "Dashboard"],
    default="MyComponent"
)
```

### 5. Number/Range
```python
Question(
    id="timeout",
    question="Request timeout in seconds?",
    type="number",
    default=300
)
```

## Creating Feedback Request

```python
from feedback import FeedbackRequest, Question, FeedbackManager

feedback = FeedbackRequest(
    request_id=f"feedback-react-{uuid.uuid4()}",
    agent="@react-specialist",
    request_type="clarification",
    context={
        "user_request": "Create a user login component",
        "why_needed": "Need styling and state management preferences"
    },
    questions=[
        Question(
            id="styling",
            question="Styling approach?",
            type="choice",
            choices=[...],
            criticality="high",
            default="tailwind"
        ),
        Question(
            id="state-management",
            question="State management?",
            type="choice",
            choices=[...],
            criticality="medium",
            default="useState"
        )
    ],
    timeout=300,
    timeout_behavior="use_defaults",  # or block_execution, skip_step, auto_approve
    required=True
)

# Send to user
feedback_mgr = FeedbackManager(workspace_root)
responses = feedback_mgr.request_clarification(feedback)
```

## Handling Responses

```python
# Agent receives responses
responses = feedback_mgr.request_clarification(feedback)

# responses = {
#     "styling": "tailwind",
#     "state-management": "useContext"
# }

# Use in generation
component = generate_component(
    name=request.get("name"),
    styling=responses.get("styling"),
    state_management=responses.get("state-management")
)
```

## Timeout Behaviors

### 1. Use Defaults
```python
timeout_behavior="use_defaults"
# If user doesn't respond, use default values from questions
```

### 2. Block Execution
```python
timeout_behavior="block_execution"
# Raise TimeoutError, agent execution fails
# Requires manual intervention
```

### 3. Skip Step
```python
timeout_behavior="skip_step"
# Skip this step, continue with rest of generation
```

### 4. Auto Approve
```python
timeout_behavior="auto_approve"
# Proceed with no answers, agent chooses internally
```

## Conditional Questions

Ask follow-up questions based on responses:

```python
feedback = FeedbackRequest(
    questions=[
        Question(
            id="need_auth",
            question="Does this need authentication?",
            type="boolean"
        ),
        Question(
            id="auth_type",
            question="Authentication type?",
            type="choice",
            choices=[...],
            depends_on=["need_auth"]  # Only ask if need_auth = true
        )
    ],
    follow_up={
        "enabled": True,
        "based_on_responses": [
            {
                "if_response": {"question_id": "need_auth", "value": True},
                "then_ask": ["auth_type", "oauth_provider"]
            }
        ]
    }
)
```

## Criticality Levels

```python
question.criticality = "critical"   # Blocking - must answer
question.criticality = "high"       # Very important
question.criticality = "medium"     # Important
question.criticality = "low"        # Optional
```

## Usage Patterns

### Pattern 1: Required Clarification
```python
# Production mode - require clarification
feedback = FeedbackRequest(
    questions=[...],
    required=True,
    timeout=600,
    timeout_behavior="block_execution",
    allow_skip=False
)
```

### Pattern 2: Optional Feedback (Dev Mode)
```python
# Development mode - use defaults if not answered
feedback = FeedbackRequest(
    questions=[...],
    required=False,
    timeout=60,
    timeout_behavior="use_defaults",
    allow_skip=True
)
```

### Pattern 3: Progressive Clarification
```python
# Ask high-priority questions first
high_priority = [q for q in questions if q.criticality in ["critical", "high"]]
medium_priority = [q for q in questions if q.criticality == "medium"]

# Ask high-priority immediately
responses1 = feedback_mgr.request_clarification(
    FeedbackRequest(..., questions=high_priority)
)

# Ask follow-ups based on responses
follow_up_q = generate_follow_ups(responses1)
responses2 = feedback_mgr.request_clarification(
    FeedbackRequest(..., questions=follow_up_q)
)
```

## Config Integration

Control feedback behavior in config:

```yaml
feedback_loops:
  enabled: true                    # Turn on/off
  clarification_required: true     # Block until answered
  timeout: 300                     # Wait 5 minutes
  default_answers:                 # Answers if timeout
    styling: "tailwind"
    framework: "express"
    testing: "jest"
```

## UI Handling

Example UI/API for collecting feedback:

```javascript
// POST /api/feedback/{request_id}/response
{
  "request_id": "feedback-react-abc123",
  "responses": {
    "styling": "tailwind",
    "state-management": "useContext",
    "testing": "vitest"
  },
  "responded_by": "user@example.com",
  "response_time_seconds": 45
}
```

## Logging & Analytics

Track feedback metrics:

```python
response_metadata = {
    "responded_by": "user@example.com",
    "responded_at": "2026-01-13T10:30:00Z",
    "response_time_seconds": 45,
    "all_answered": True,
    "unanswered_questions": []
}

# Metrics
responses_received_pct = (count_responses / count_requests) * 100
avg_response_time = sum(times) / len(times)
timeout_rate = (count_timeouts / count_requests) * 100
```

## Best Practices

1. **Keep it Short** - Max 3-5 questions per request
2. **Progressive Disclosure** - Ask complex questions only when needed
3. **Good Defaults** - Always provide sensible defaults
4. **Clear Questions** - Use plain language, not jargon
5. **Examples** - Show examples of expected answers
6. **Criticality** - Mark truly critical vs. optional
7. **Timeout** - Balance between wait time and usability
8. **Respect User Time** - Minimize back-and-forth

## Common Scenarios

### Scenario 1: Component Generation
```python
feedback = FeedbackRequest(
    questions=[
        Question(id="styling", question="Styling?", ...),
        Question(id="state", question="State management?", ...),
        Question(id="testing", question="Include tests?", ...)
    ],
    timeout=300,
    timeout_behavior="use_defaults",
    required=True
)
```

### Scenario 2: API Specification
```python
feedback = FeedbackRequest(
    questions=[
        Question(id="auth", question="Need authentication?", type="boolean"),
        Question(id="rate_limit", question="Rate limiting?", type="boolean"),
        Question(id="versioning", question="API versioning strategy?", type="choice", ...)
    ]
)
```

### Scenario 3: Database Schema
```python
feedback = FeedbackRequest(
    questions=[
        Question(id="db_type", question="Database type?", ...),
        Question(id="sharding", question="Need sharding?", ...),
        Question(id="cache", question="Cache layer?", ...)
    ]
)
```

## Error Handling

```python
try:
    responses = feedback_mgr.request_clarification(feedback)
except TimeoutError:
    # Timeout - handled by timeout_behavior
    # Check timeout_behavior setting
    pass
except ValidationError as e:
    # Invalid response format
    logger.error(f"Invalid feedback response: {e}")
except AgentError as e:
    # Other agent issues
    logger.error(f"Agent error: {e}")
```

## Integration with Config System

```python
# Config controls feedback defaults
config = ConfigManager.get_instance()

feedback = FeedbackRequest(
    questions=[...],
    timeout=config.get("feedback_loops.timeout", 300),
    required=config.get("feedback_loops.clarification_required", True),
    timeout_behavior=config.get("feedback_loops.timeout_behavior", "use_defaults"),
    default_answers=config.get("feedback_loops.default_answers", {})
)
```
