# Agent Communication Protocol - Quick Reference

## Purpose
Enable agents to communicate with each other for coordination, feedback, and collaborative problem-solving.

## File Structure
```
.agenticcoder/communication/
├── schema.json
├── messages/
│   └── {message_id}.json          # Sent messages
└── responses/
    └── {message_id}.json          # Responses to messages
```

## Message Types

### 1. REQUEST
```python
Message(
    message_type="request",
    from_agent="@react-specialist",
    to_agents=["@nodejs-specialist"],
    subject="PROVIDE_API_CONTRACT",
    body={
        "feature": "user-authentication",
        "requirements": ["OAuth2", "rate limiting"]
    },
    deadline=600  # seconds
)
```

### 2. RESPONSE
```python
Message(
    message_type="response",
    from_agent="@nodejs-specialist",
    to_agents=["@react-specialist"],
    subject="API_CONTRACT_PROVIDED",
    body={
        "endpoint": "/api/auth/login",
        "method": "POST",
        "parameters": {...}
    }
)
```

### 3. FEEDBACK
```python
Message(
    message_type="feedback",
    from_agent="@react-specialist",
    to_agents=["@nodejs-specialist"],
    subject="FEEDBACK_ON_API_DESIGN",
    body={
        "artifact_id": "auth-api",
        "feedback": "Consider adding password validation endpoint",
        "severity": "medium"
    }
)
```

### 4. NOTIFICATION
```python
Message(
    message_type="notification",
    from_agent="@orchestration-agent",
    to_agents=[],  # Broadcast to all
    subject="FEATURE_READY_FOR_TESTING",
    body={
        "feature": "authentication",
        "components": ["react-component", "api-endpoints", "db-schema"]
    }
)
```

### 5. COORDINATION
```python
Message(
    message_type="coordination",
    from_agent="@orchestration-agent",
    to_agents=["@react-specialist", "@nodejs-specialist"],
    subject="DEPENDENCY_CONFLICT",
    body={
        "issue": "React component requires API v2",
        "nodejs_available": "v1.0",
        "resolution_options": ["upgrade API", "downgrade component"]
    }
)
```

### 6. CLARIFICATION
```python
Message(
    message_type="clarification",
    from_agent="@react-specialist",
    to_agents=["@nodejs-specialist"],
    subject="API_SCHEMA_CLARIFICATION",
    body={
        "question": "Should password be hashed in response?",
        "options": ["yes", "no", "optional field"],
        "why": "Affects component security"
    }
)
```

### 7. ERROR
```python
Message(
    message_type="error",
    from_agent="@nodejs-specialist",
    to_agents=["@react-specialist"],
    subject="GENERATION_FAILED",
    body={
        "error": "Database unreachable",
        "code": "DB_CONNECTION_FAILED",
        "details": "Cannot connect to schema repository"
    }
)
```

## Message Structure

```python
@dataclass
class Message:
    message_id: str                    # msg-{uuid}
    timestamp: datetime                # When sent
    from_agent: str                    # @agent-name
    to_agents: List[str]               # Recipients ([] = broadcast)
    message_type: str                  # request, response, feedback, etc.
    subject: str                       # Topic/purpose
    body: Dict                         # Content
    context: Dict = None               # Optional context
    priority: str = "normal"           # low, normal, high, critical
    deadline: int = 300                # Seconds to respond
    retry_policy: Dict = None          # Retry configuration
    response: Message = None           # Set when response arrives
```

## Core Operations

### Send Message
```python
from communication import MessageBus, Message

bus = MessageBus()

message = Message({
    "message_id": f"msg-{uuid.uuid4()}",
    "from_agent": "@react-specialist",
    "to_agents": ["@nodejs-specialist"],
    "message_type": "request",
    "subject": "PROVIDE_API_CONTRACT",
    "body": {
        "feature": "authentication",
        "requirements": ["OAuth2"]
    },
    "priority": "high",
    "deadline": 600
})

msg_id = await bus.send_message(message)
```

### Wait for Response
```python
# Send and wait
try:
    response = await bus.wait_for_response(msg_id, timeout=600)
    api_spec = response.body
except TimeoutError:
    logger.error(f"No response from @nodejs-specialist")
```

### Subscribe to Messages
```python
async def handle_message(message: Message):
    print(f"Received: {message.subject} from {message.from_agent}")
    # Process message
    response_body = process_request(message)
    # Send response
    await bus.send_message(create_response(message, response_body))

await bus.subscribe("@react-specialist", handle_message)
```

## Agent Communication Methods

```python
class CommunicativeAgent(Agent):
    def __init__(self, agent_id: str, message_bus: MessageBus):
        super().__init__()
        self.agent_id = agent_id
        self.message_bus = message_bus
    
    # Request something from another agent
    async def request_from_agent(self, target_agent: str, subject: str, 
                                  body: dict, deadline: int = 300) -> dict:
        message = Message({
            "message_id": f"msg-{uuid.uuid4()}",
            "from_agent": self.agent_id,
            "to_agents": [target_agent],
            "message_type": "request",
            "subject": subject,
            "body": body,
            "deadline": deadline
        })
        
        msg_id = await self.message_bus.send_message(message)
        response = await self.message_bus.wait_for_response(msg_id, deadline)
        return response.body
    
    # Send feedback about another agent's work
    async def send_feedback(self, target_agent: str, artifact_id: str,
                           feedback: str, severity: str = "info"):
        message = Message({
            "message_id": f"msg-{uuid.uuid4()}",
            "from_agent": self.agent_id,
            "to_agents": [target_agent],
            "message_type": "feedback",
            "subject": f"Feedback on {artifact_id}",
            "body": {
                "artifact_id": artifact_id,
                "feedback": feedback,
                "severity": severity
            },
            "priority": "high" if severity == "critical" else "normal"
        })
        
        await self.message_bus.send_message(message)
    
    # Send notification to all agents
    async def broadcast_notification(self, subject: str, body: dict):
        message = Message({
            "message_id": f"msg-{uuid.uuid4()}",
            "from_agent": self.agent_id,
            "to_agents": [],  # Broadcast
            "message_type": "notification",
            "subject": subject,
            "body": body
        })
        
        await self.message_bus.send_message(message)
```

## Conversation Flow

### Scenario: Feature Development Coordination

```
1. ORCHESTRATION AGENT initiates
   ↓ sends REQUEST to REACT SPECIALIST
   "PROVIDE_COMPONENT" with feature spec

2. REACT SPECIALIST receives REQUEST
   ↓ sends CLARIFICATION to NODE SPECIALIST
   "Need API contract before starting"

3. NODE SPECIALIST receives CLARIFICATION
   ↓ sends RESPONSE with API spec
   
4. REACT SPECIALIST uses API spec
   ↓ sends FEEDBACK to NODE SPECIALIST
   "API looks good, consider adding error responses"

5. NODE SPECIALIST receives FEEDBACK
   ↓ sends COORDINATION message to DB SPECIALIST
   "Need user table schema"

6. DB SPECIALIST sends RESPONSE with schema
   
7. NODE SPECIALIST completes API
   ↓ sends RESPONSE to REACT SPECIALIST
   "API ready at /api/auth"

8. REACT SPECIALIST completes component
   ↓ sends RESPONSE to ORCHESTRATION AGENT
   "Component ready, integrated with API"

9. ORCHESTRATION AGENT
   ↓ broadcasts NOTIFICATION
   "Feature ready for testing"
```

## Message Priority

```python
message.priority = "critical"   # Urgent, fast-track
message.priority = "high"       # Important, process soon
message.priority = "normal"     # Regular processing
message.priority = "low"        # Background processing
```

## Retry Policy

```python
message.retry_policy = {
    "max_retries": 3,
    "retry_delay": 5,  # seconds
    "backoff_multiplier": 2.0
}

# Tries:
# 1st attempt: immediate
# 2nd attempt: 5 seconds
# 3rd attempt: 10 seconds
# 4th attempt: 20 seconds
```

## Context Tracking

```python
message.context = {
    "conversation_id": "conv-abc123",  # Groups related messages
    "turn": 2,                          # Position in conversation
    "parent_message_id": "msg-xyz789",  # Threaded responses
    "references": ["artifact-id-1"],    # Artifacts discussed
    "metadata": {
        "feature": "authentication",
        "deadline": "2026-01-13T15:00:00Z"
    }
}
```

## Message Signatures

For trusted communication:

```python
message.signing = {
    "enabled": True,
    "signature": "base64_encoded_signature",
    "algorithm": "HMAC-SHA256"
}

message.encryption = {
    "enabled": True,
    "algorithm": "AES-256-GCM",
    "key_id": "key-v1"
}
```

## Usage Patterns

### Pattern 1: Simple Request-Response
```python
# Request
api_spec = await agent.request_from_agent(
    "@nodejs-specialist",
    "PROVIDE_API_CONTRACT",
    {"feature": "auth"},
    deadline=300
)

# Use it
component = generate(api_spec)
```

### Pattern 2: Multi-Agent Coordination
```python
# 1. Get API spec from Node
api = await agent.request_from_agent("@nodejs-specialist", "API", {...})

# 2. Get DB schema from DB specialist
schema = await agent.request_from_agent("@db-specialist", "SCHEMA", {...})

# 3. Request code review from QA
review = await agent.request_from_agent("@qa-agent", "CODE_REVIEW", {...})

# 4. All coordinated
return {
    "api": api,
    "schema": schema,
    "review": review
}
```

### Pattern 3: Feedback Loop
```python
# Generate initial version
component = await generate(spec)

# Get feedback
feedback = await agent.request_from_agent(
    "@accessibility-agent",
    "REVIEW_ACCESSIBILITY",
    {"component": component}
)

# Apply feedback
if feedback.get("improvements"):
    component = await improve(component, feedback)

# Send back feedback on improvements
await agent.send_feedback(
    "@accessibility-agent",
    "component-id",
    f"Applied all suggestions: {feedback['improvements']}"
)
```

### Pattern 4: Broadcasting Status
```python
# When feature is ready
await agent.broadcast_notification(
    "FEATURE_COMPLETE",
    {
        "feature": "user-auth",
        "components": ["react", "api", "db", "docker"],
        "status": "ready_for_testing",
        "test_command": "npm test",
        "contact": "@orchestration-agent"
    }
)
```

## Config Integration

```yaml
communication:
  enabled: true
  message_queue: "redis"           # memory, redis, rabbitmq
  timeout: 60                      # Default response timeout
  logging: true
```

## Best Practices

1. **Clear Subjects** - Use SCREAMING_SNAKE_CASE
2. **Structured Bodies** - Use consistent JSON schemas
3. **Timeouts** - Set appropriate deadlines
4. **Error Handling** - Always handle TimeoutError and other errors
5. **Conversation IDs** - Track related messages
6. **Logging** - Log all messages for audit trail
7. **Priorities** - Use appropriately (don't mark everything critical)
8. **Context** - Include enough context for receiver to understand
