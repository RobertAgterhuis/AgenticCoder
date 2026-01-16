# Option C: Advanced Enhancements Implementation Guide

## Overview

This document guides the implementation of AgenticCoder's advanced features:
- **Configuration Management System** - Dynamic, hierarchical agent behavior configuration
- **Artifact Versioning & History** - Complete version tracking and rollback capabilities
- **Agent Feedback Loops** - Bi-directional communication for clarification
- **Agent Communication Protocol** - Agent-to-agent messaging for collaboration

---

## Phase 1: Configuration Management System

### 1.1 Directory Structure

```
.agenticcoder/config/
├── schema.json                 # Configuration schema definition
├── defaults.yaml              # Default values (base)
├── project.yaml               # Project-specific overrides
└── profiles/
    ├── development.yaml       # Dev environment config
    ├── staging.yaml          # Staging environment config
    └── production.yaml       # Prod environment config (strict)
```

### 1.2 Configuration Loading Order

Configs are merged hierarchically:
```
defaults.yaml
    ↓ (override)
project.yaml
    ↓ (override)
profiles/{environment}.yaml
    ↓ (override)
runtime_overrides (from API/CLI)
```

### 1.3 Implementation Steps

**Step 1: Create ConfigLoader class**
```python
class ConfigLoader:
    def __init__(self, workspace_root: str):
        self.workspace = workspace_root
        self.config_dir = f"{workspace_root}/.agenticcoder/config"
    
    def load_config(self, profile: str = "development") -> dict:
        # 1. Load defaults.yaml
        defaults = self._load_yaml(f"{self.config_dir}/defaults.yaml")
        
        # 2. Load project.yaml and merge
        project = self._load_yaml(f"{self.config_dir}/project.yaml")
        merged = self._deep_merge(defaults, project)
        
        # 3. Load profile and merge
        profile_cfg = self._load_yaml(f"{self.config_dir}/profiles/{profile}.yaml")
        final = self._deep_merge(merged, profile_cfg)
        
        # 4. Validate against schema
        self._validate(final, f"{self.config_dir}/schema.json")
        
        return final
    
    def _load_yaml(self, path: str) -> dict:
        with open(path) as f:
            return yaml.safe_load(f)
    
    def _deep_merge(self, base: dict, override: dict) -> dict:
        # Recursively merge override into base
        result = base.copy()
        for key, value in override.items():
            if isinstance(value, dict) and key in result:
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result
    
    def _validate(self, config: dict, schema_path: str):
        with open(schema_path) as f:
            schema = json.load(f)
        jsonschema.validate(config, schema)
```

**Step 2: Create ConfigManager for runtime access**
```python
class ConfigManager:
    _instance = None
    
    def __init__(self, workspace_root: str, profile: str = "development"):
        self.loader = ConfigLoader(workspace_root)
        self.config = self.loader.load_config(profile)
        self.overrides = {}
    
    @classmethod
    def get_instance(cls) -> 'ConfigManager':
        if cls._instance is None:
            cls._instance = ConfigManager(os.getcwd())
        return cls._instance
    
    def get(self, path: str, default=None):
        """Get config value with dot notation: 'agents.react.timeout'"""
        parts = path.split('.')
        value = self.config
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            else:
                return default
        return value if value is not None else default
    
    def set_override(self, path: str, value):
        """Set runtime override"""
        self.overrides[path] = value
    
    def apply_overrides(self, overrides: dict):
        """Apply request-specific overrides"""
        for path, value in overrides.items():
            self.set_override(path, value)
```

### 1.4 Usage Examples

**In Agent Code:**
```python
from config import ConfigManager

config = ConfigManager.get_instance()

# Get agent-specific settings
timeout = config.get("agents.react-specialist.timeout", 300)
constraints = config.get("agents.react-specialist.constraints", [])
quality_level = config.get("agents.react-specialist.output_quality", "standard")

# Check if feature enabled
if config.get("feedback_loops.enabled"):
    await request_clarification()

# Apply rules
rules = config.get("rules", [])
for rule in rules:
    if matches_condition(rule["condition"]):
        apply_action(rule["action"])
```

**CLI Usage:**
```bash
# Use development profile
agenticcoder generate --profile development

# Use production profile
agenticcoder generate --profile production

# Override specific settings
agenticcoder generate --profile production \
  --override "agents.react-specialist.timeout=1200" \
  --override "artifact_management.versioning.enabled=true"
```

---

## Phase 2: Artifact Versioning & History

### 2.1 Directory Structure

```
.agenticcoder/artifacts/
├── schema.json                 # Artifact version schema
├── {artifact-id}/
│   ├── manifest.json          # Artifact metadata
│   ├── versions/
│   │   ├── v0.1.json          # Version metadata + content
│   │   ├── v0.2.json
│   │   └── v1.0.json
│   └── _current -> v1.0.json  # Symlink to current version
```

### 2.2 Implementation Steps

**Step 1: Create ArtifactVersion class**
```python
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime

@dataclass
class ArtifactVersion:
    artifact_id: str
    version: str
    content: str
    type: str  # component, function, service, etc.
    language: str
    status: str  # draft, in-review, approved, in-use, deprecated
    created_by: str
    created_at: datetime
    description: str = ""
    tags: List[str] = None
    changes: Dict = None
    dependencies: List[Dict] = None
    approval: Dict = None
    quality_metrics: Dict = None
    
    def to_dict(self) -> dict:
        return {
            "artifact_id": self.artifact_id,
            "version": self.version,
            "content": self.content,
            "type": self.type,
            "language": self.language,
            "status": self.status,
            "metadata": {
                "created_by": self.created_by,
                "created_at": self.created_at.isoformat(),
                "description": self.description
            },
            "tags": self.tags or [],
            "changes": self.changes or {},
            "dependencies": self.dependencies or [],
            "approval": self.approval or {"status": "pending"},
            "quality_metrics": self.quality_metrics or {}
        }
```

**Step 2: Create ArtifactVersioning class**
```python
import json
from pathlib import Path
from semantic_version import SimpleSpec

class ArtifactVersioning:
    def __init__(self, workspace_root: str):
        self.artifacts_dir = Path(workspace_root) / ".agenticcoder" / "artifacts"
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
    
    def save_version(self, artifact: ArtifactVersion) -> str:
        """Save a new version and return version ID"""
        artifact_dir = self.artifacts_dir / artifact.artifact_id
        artifact_dir.mkdir(exist_ok=True)
        
        # Save version file
        version_file = artifact_dir / "versions" / f"{artifact.version}.json"
        version_file.parent.mkdir(exist_ok=True)
        
        with open(version_file, 'w') as f:
            json.dump(artifact.to_dict(), f, indent=2)
        
        # Update current version symlink
        current_link = artifact_dir / "_current"
        if current_link.exists():
            current_link.unlink()
        current_link.symlink_to(version_file)
        
        # Save manifest
        manifest = self._get_or_create_manifest(artifact_dir, artifact)
        with open(artifact_dir / "manifest.json", 'w') as f:
            json.dump(manifest, f, indent=2)
        
        return str(version_file)
    
    def get_version(self, artifact_id: str, version: str = None) -> ArtifactVersion:
        """Get specific version or current version"""
        artifact_dir = self.artifacts_dir / artifact_id
        
        if version is None:
            # Get current version
            current_link = artifact_dir / "_current"
            version_file = current_link.resolve()
        else:
            version_file = artifact_dir / "versions" / f"{version}.json"
        
        with open(version_file) as f:
            data = json.load(f)
        
        return ArtifactVersion(**data)
    
    def get_version_history(self, artifact_id: str) -> List[ArtifactVersion]:
        """Get all versions of an artifact"""
        versions_dir = self.artifacts_dir / artifact_id / "versions"
        versions = []
        
        for version_file in sorted(versions_dir.glob("*.json")):
            with open(version_file) as f:
                data = json.load(f)
                versions.append(ArtifactVersion(**data))
        
        return sorted(versions, key=lambda v: v.created_at)
    
    def rollback(self, artifact_id: str, version: str) -> bool:
        """Rollback to a previous version"""
        artifact_dir = self.artifacts_dir / artifact_id
        version_file = artifact_dir / "versions" / f"{version}.json"
        
        if not version_file.exists():
            return False
        
        current_link = artifact_dir / "_current"
        if current_link.exists():
            current_link.unlink()
        current_link.symlink_to(version_file)
        
        return True
    
    def get_dependencies(self, artifact_id: str, version: str = None) -> List[str]:
        """Get artifacts this one depends on"""
        artifact = self.get_version(artifact_id, version)
        return [dep["artifact"] for dep in (artifact.dependencies or [])]
    
    def get_dependents(self, artifact_id: str) -> List[str]:
        """Get artifacts that depend on this one"""
        dependents = []
        for artifact_manifest in self.artifacts_dir.glob("*/manifest.json"):
            with open(artifact_manifest) as f:
                manifest = json.load(f)
                if any(dep["artifact"] == artifact_id for dep in manifest.get("dependencies", [])):
                    dependents.append(manifest["artifact_id"])
        return dependents
    
    def _get_or_create_manifest(self, artifact_dir: Path, artifact: ArtifactVersion) -> dict:
        manifest_file = artifact_dir / "manifest.json"
        
        if manifest_file.exists():
            with open(manifest_file) as f:
                manifest = json.load(f)
        else:
            manifest = {
                "artifact_id": artifact.artifact_id,
                "type": artifact.type,
                "language": artifact.language,
                "created_at": artifact.created_at.isoformat(),
                "versions": []
            }
        
        # Add version to manifest if not already there
        if artifact.version not in manifest.get("versions", []):
            manifest["versions"] = manifest.get("versions", []) + [artifact.version]
        
        return manifest
```

### 2.3 Usage Examples

**Save New Version:**
```python
versioning = ArtifactVersioning(workspace_root)

artifact = ArtifactVersion(
    artifact_id="login-component",
    version="1.0.0",
    content="""import React from 'react';
export const LoginForm = () => { ... }""",
    type="component",
    language="typescript",
    status="approved",
    created_by="@react-specialist",
    created_at=datetime.now(),
    description="Login form with password strength meter",
    tags=["authentication", "form", "security"],
    changes={
        "summary": "Added password strength meter",
        "added": ["PasswordStrength component"],
        "modified": ["validation logic"],
        "removed": []
    },
    approval={
        "status": "approved",
        "chain": [
            {
                "level": "code_review",
                "agent": "@qa-agent",
                "decision": "approved",
                "timestamp": "2026-01-13T10:30:00Z"
            }
        ]
    }
)

versioning.save_version(artifact)
```

**Get Version History:**
```python
history = versioning.get_version_history("login-component")
for v in history:
    print(f"v{v.version}: {v.description} ({v.status})")

# Output:
# v0.1: Initial implementation (in-use)
# v0.2: Added password strength (in-use)
# v1.0: Security hardening (in-use)
```

**Rollback:**
```python
# Rollback to v0.2
versioning.rollback("login-component", "0.2")

# Now _current points to v0.2
current = versioning.get_version("login-component")
assert current.version == "0.2"
```

---

## Phase 3: Agent Feedback Loops

### 3.1 Directory Structure

```
.agenticcoder/feedback/
├── schema.json                 # Feedback request schema
├── requests/
│   └── {feedback-id}.json     # Individual feedback requests
└── responses/
    └── {feedback-id}.json     # User responses
```

### 3.2 Implementation Steps

**Step 1: Create FeedbackRequest class**
```python
@dataclass
class Question:
    id: str
    question: str
    type: str  # text, choice, multiple_choice, boolean, number
    choices: List[Dict] = None
    examples: List[str] = None
    default: any = None
    criticality: str = "medium"
    depends_on: List[str] = None

@dataclass
class FeedbackRequest:
    request_id: str
    agent: str
    request_type: str  # clarification, selection, confirmation, etc.
    context: Dict
    questions: List[Question]
    timeout: int = 300
    timeout_behavior: str = "use_defaults"  # or block_execution, skip_step, auto_approve
    required: bool = True
    allow_skip: bool = False
    responses: Dict = None
    response_metadata: Dict = None
```

**Step 2: Create FeedbackManager**
```python
class FeedbackManager:
    def __init__(self, workspace_root: str):
        self.feedback_dir = Path(workspace_root) / ".agenticcoder" / "feedback"
        self.requests_dir = self.feedback_dir / "requests"
        self.responses_dir = self.feedback_dir / "responses"
        self.requests_dir.mkdir(parents=True, exist_ok=True)
        self.responses_dir.mkdir(parents=True, exist_ok=True)
    
    def request_clarification(self, feedback: FeedbackRequest) -> str:
        """Request user clarification and return request ID"""
        # Save request
        request_file = self.requests_dir / f"{feedback.request_id}.json"
        with open(request_file, 'w') as f:
            json.dump(self._to_dict(feedback), f, indent=2)
        
        # Emit event for UI to handle
        self._emit_feedback_event(feedback)
        
        # Wait for response (with timeout)
        response = self._wait_for_response(feedback.request_id, feedback.timeout)
        
        if response is None:
            # Timeout - handle based on timeout_behavior
            return self._handle_timeout(feedback)
        
        return response
    
    def submit_response(self, request_id: str, responses: Dict) -> bool:
        """Submit user responses to a feedback request"""
        feedback_file = self.requests_dir / f"{request_id}.json"
        
        if not feedback_file.exists():
            return False
        
        # Save responses
        response_file = self.responses_dir / f"{request_id}.json"
        with open(response_file, 'w') as f:
            json.dump({
                "request_id": request_id,
                "responses": responses,
                "responded_at": datetime.now().isoformat(),
                "responded_by": "user"  # or agent name if agent-provided
            }, f, indent=2)
        
        # Signal that response is ready
        self._signal_response_ready(request_id)
        
        return True
    
    def get_response(self, request_id: str) -> Dict:
        """Get submitted responses for a request"""
        response_file = self.responses_dir / f"{request_id}.json"
        
        if not response_file.exists():
            return None
        
        with open(response_file) as f:
            return json.load(f)
    
    def _handle_timeout(self, feedback: FeedbackRequest) -> Dict:
        """Handle timeout based on configured behavior"""
        if feedback.timeout_behavior == "use_defaults":
            # Use default answers
            defaults = {}
            for q in feedback.questions:
                if q.default is not None:
                    defaults[q.id] = q.default
            return defaults
        
        elif feedback.timeout_behavior == "block_execution":
            raise TimeoutError(f"Feedback request {feedback.request_id} timed out")
        
        elif feedback.timeout_behavior == "skip_step":
            return None  # Agent will skip this step
        
        elif feedback.timeout_behavior == "auto_approve":
            return {}  # Auto-approve without answers
    
    def _emit_feedback_event(self, feedback: FeedbackRequest):
        """Emit event to UI/notification system"""
        # This would be implemented based on your event system
        # Could use webhooks, WebSockets, message queues, etc.
        pass
    
    def _wait_for_response(self, request_id: str, timeout: int) -> Dict:
        """Wait for response with timeout"""
        import asyncio
        start = time.time()
        
        while time.time() - start < timeout:
            response_file = self.responses_dir / f"{request_id}.json"
            if response_file.exists():
                with open(response_file) as f:
                    data = json.load(f)
                    return data.get("responses")
            
            time.sleep(0.5)  # Poll every 500ms
        
        return None  # Timeout
```

### 3.3 Usage in Agent Code

```python
class ReactSpecialist(Agent):
    async def generate_component(self, request: dict) -> str:
        config = ConfigManager.get_instance()
        feedback_mgr = FeedbackManager(workspace_root)
        
        # Check if feedback loops enabled
        if not config.get("feedback_loops.enabled"):
            # Use defaults from config
            styling = config.get("agents.react-specialist.preferred_options.styling")
            return self._generate(request, styling=styling)
        
        # Request clarification
        feedback = FeedbackRequest(
            request_id=f"feedback-react-{uuid.uuid4()}",
            agent="@react-specialist",
            request_type="clarification",
            context={
                "user_request": request.get("description"),
                "why_needed": "Need to know preferred styling approach"
            },
            questions=[
                Question(
                    id="styling",
                    question="Which styling approach do you prefer?",
                    type="choice",
                    choices=[
                        {"id": "tailwind", "label": "Tailwind CSS"},
                        {"id": "css-modules", "label": "CSS Modules"},
                        {"id": "styled-components", "label": "Styled Components"}
                    ],
                    default="tailwind",
                    criticality="high"
                ),
                Question(
                    id="state-management",
                    question="State management preference?",
                    type="choice",
                    choices=[
                        {"id": "useState", "label": "useState only"},
                        {"id": "context", "label": "useContext"},
                        {"id": "redux", "label": "Redux"}
                    ],
                    default="useState",
                    criticality="medium"
                )
            ],
            timeout=config.get("feedback_loops.timeout"),
            required=config.get("feedback_loops.clarification_required")
        )
        
        responses = feedback_mgr.request_clarification(feedback)
        
        # Use responses in generation
        return self._generate(
            request,
            styling=responses.get("styling", "tailwind"),
            state_management=responses.get("state-management", "useState")
        )
```

---

## Phase 4: Agent Communication Protocol

### 4.1 Message Types

```python
class MessageType(Enum):
    REQUEST = "request"          # Agent asks for something
    RESPONSE = "response"        # Agent provides answer
    ACKNOWLEDGMENT = "acknowledgment"  # Got your message
    NOTIFICATION = "notification"      # FYI notification
    ERROR = "error"              # Something went wrong
    QUERY = "query"              # Question about something
    FEEDBACK = "feedback"        # Comment/review on output
    COORDINATION = "coordination"       # Coordinate on implementation
    CLARIFICATION = "clarification"     # Ask for clarification
```

### 4.2 Implementation

**Step 1: Create MessageBus**
```python
import asyncio
from typing import Callable, List

class Message:
    def __init__(self, data: dict):
        self.message_id = data.get("message_id")
        self.from_agent = data.get("from_agent")
        self.to_agents = data.get("to_agents", [])
        self.message_type = data.get("message_type")
        self.subject = data.get("subject")
        self.body = data.get("body")
        self.context = data.get("context")
        self.priority = data.get("priority", "normal")
        self.deadline = data.get("deadline")
        self.timestamp = data.get("timestamp", datetime.now().isoformat())

class MessageBus:
    def __init__(self):
        self.messages = {}  # request_id -> message
        self.subscribers = {}  # agent_id -> List[callback]
        self.message_queue = asyncio.Queue()
    
    async def send_message(self, message: Message) -> str:
        """Send message and return message ID"""
        self.messages[message.message_id] = message
        
        # Route to recipients
        if not message.to_agents:
            # Broadcast
            for agent_id in self.subscribers.keys():
                await self.message_queue.put(message)
        else:
            for agent_id in message.to_agents:
                if agent_id in self.subscribers:
                    await self.message_queue.put(message)
        
        return message.message_id
    
    async def subscribe(self, agent_id: str, callback: Callable):
        """Subscribe agent to messages"""
        if agent_id not in self.subscribers:
            self.subscribers[agent_id] = []
        self.subscribers[agent_id].append(callback)
    
    async def wait_for_response(self, message_id: str, timeout: int = 30) -> Message:
        """Wait for response to a message"""
        start = time.time()
        
        while time.time() - start < timeout:
            if message_id in self.messages:
                msg = self.messages[message_id]
                if msg.response:
                    return msg.response
            
            await asyncio.sleep(0.1)
        
        raise TimeoutError(f"No response to message {message_id}")
```

**Step 2: Agent Communication Methods**
```python
class CommunicativeAgent(Agent):
    def __init__(self, agent_id: str, message_bus: MessageBus):
        super().__init__()
        self.agent_id = agent_id
        self.message_bus = message_bus
    
    async def request_from_agent(self, target_agent: str, subject: str, body: dict,
                                  deadline: int = 300) -> dict:
        """Request something from another agent"""
        message = Message({
            "message_id": f"msg-{uuid.uuid4()}",
            "from_agent": self.agent_id,
            "to_agents": [target_agent],
            "message_type": "request",
            "subject": subject,
            "body": body,
            "deadline": deadline,
            "context": {
                "conversation_id": str(uuid.uuid4()),
                "turn": 1
            }
        })
        
        msg_id = await self.message_bus.send_message(message)
        response = await self.message_bus.wait_for_response(msg_id, deadline)
        
        return response.body
    
    async def send_feedback(self, target_agent: str, artifact_id: str,
                           feedback: str, severity: str = "info"):
        """Send feedback to another agent's work"""
        message = Message({
            "message_id": f"msg-{uuid.uuid4()}",
            "from_agent": self.agent_id,
            "to_agents": [target_agent],
            "message_type": "feedback",
            "subject": f"Feedback on {artifact_id}",
            "body": {
                "artifact_id": artifact_id,
                "feedback": feedback,
                "severity": severity,
                "suggestions": []
            },
            "priority": "high" if severity == "critical" else "normal"
        })
        
        await self.message_bus.send_message(message)
    
    async def broadcast_notification(self, subject: str, body: dict):
        """Notify all agents"""
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

### 4.3 Usage Example: Full-Stack Feature

```python
class OrchestrationAgent(CommunicativeAgent):
    async def build_feature(self, feature_spec: dict):
        """Orchestrate building a feature across specialists"""
        
        # 1. Request API contract from Node.js specialist
        api_spec = await self.request_from_agent(
            "@nodejs-specialist",
            "PROVIDE_API_CONTRACT",
            {
                "feature": feature_spec.get("name"),
                "requirements": feature_spec.get("requirements")
            },
            deadline=600
        )
        
        # 2. Share with React specialist
        await self.send_feedback(
            "@react-specialist",
            "api-contract-login",
            f"Here's the API spec you requested: {api_spec}",
            severity="info"
        )
        
        # 3. Wait for React component
        react_spec = await self.request_from_agent(
            "@react-specialist",
            "PROVIDE_COMPONENT",
            {
                "feature": feature_spec.get("name"),
                "api_contract": api_spec
            }
        )
        
        # 4. Get database schema from DB specialist
        db_schema = await self.request_from_agent(
            "@database-specialist",
            "PROVIDE_SCHEMA",
            {"entity": "User", "features": ["authentication"]}
        )
        
        # 5. Notify all for final coordination
        await self.broadcast_notification(
            "FEATURE_READY_FOR_REVIEW",
            {
                "feature": feature_spec.get("name"),
                "components": [react_spec, api_spec, db_schema],
                "status": "ready_for_testing"
            }
        )
```

---

## Integration Checklist

- [ ] Configuration system created and tested
- [ ] Config loader/manager implemented
- [ ] Default and profile configs created
- [ ] Artifact versioning system implemented
- [ ] Versioning storage and retrieval working
- [ ] Rollback functionality working
- [ ] Feedback system implemented
- [ ] Feedback UI/handlers created
- [ ] Message bus implemented
- [ ] Agent communication methods working
- [ ] All systems validated against schemas
- [ ] Documentation complete
- [ ] Integration tests passing

---

## Next Steps

1. **UI/API Layer** - Create REST API and web UI for feedback requests
2. **Monitoring** - Add metrics and logging to all systems
3. **Persistence** - Choose database backend (Redis, PostgreSQL, etc.)
4. **Security** - Add authentication, encryption, authorization
5. **Scalability** - Implement distributed message queue for multi-instance setup
