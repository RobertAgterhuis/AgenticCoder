# Agent Handoff Matrix

## Overview

This document defines all agent handoff protocols, triggers, and payload schemas for the expanded agent system.

---

## Handoff Categories

### 1. Architecture Handoffs

#### @architect → @microservices-architect

**Trigger Conditions:**
- `architecture_pattern == "microservices"`
- `scale_requirements.services > 3`
- `team_structure == "multiple_teams"`

**Payload Schema:**
```json
{
  "domain_model": {
    "bounded_contexts": [],
    "aggregates": [],
    "domain_events": []
  },
  "service_list": [],
  "communication_requirements": {
    "sync_patterns": [],
    "async_patterns": []
  }
}
```

---

#### @architect → @event-driven-architect

**Trigger Conditions:**
- `architecture_pattern == "event-driven"`
- `requirements.real_time == true`
- `requirements.async_processing == true`

**Payload Schema:**
```json
{
  "event_catalog": {
    "domain_events": [],
    "integration_events": []
  },
  "producer_consumer_map": {},
  "messaging_requirements": {
    "ordering": "string",
    "durability": "string"
  }
}
```

---

#### @architect → @serverless-specialist

**Trigger Conditions:**
- `architecture_pattern == "serverless"`
- `deployment_target == "azure_functions"`
- `cost_optimization == "pay_per_use"`

**Payload Schema:**
```json
{
  "function_list": [],
  "trigger_types": [],
  "bindings": {
    "input": [],
    "output": []
  },
  "durable_functions": {
    "orchestrations": [],
    "activities": []
  }
}
```

---

### 2. Frontend Handoffs

#### @frontend-specialist → @vue-specialist

**Trigger Conditions:**
- `frontend_framework == "vue"`
- `frontend_framework == "vue3"`

**Payload Schema:**
```json
{
  "component_tree": {},
  "state_requirements": {
    "global_state": [],
    "local_state": []
  },
  "routing": {
    "routes": [],
    "guards": []
  },
  "composables": []
}
```

---

#### @frontend-specialist → @nextjs-specialist

**Trigger Conditions:**
- `frontend_framework == "nextjs"`
- `requirements.ssr == true`
- `requirements.seo == true`

**Payload Schema:**
```json
{
  "pages": {
    "static": [],
    "dynamic": [],
    "api_routes": []
  },
  "data_fetching_strategy": {
    "server_components": [],
    "client_components": []
  },
  "middleware": []
}
```

---

#### @frontend-specialist → @angular-specialist

**Trigger Conditions:**
- `frontend_framework == "angular"`
- `enterprise == true`
- `team_size > 5`

**Payload Schema:**
```json
{
  "modules": [],
  "components": [],
  "services": [],
  "routing": {
    "routes": [],
    "guards": [],
    "resolvers": []
  },
  "state_management": "string"
}
```

---

### 3. Backend Handoffs

#### @backend-specialist → @nodejs-specialist

**Trigger Conditions:**
- `backend_framework in ["express", "nestjs", "fastify"]`
- `backend_language == "typescript"`

**Payload Schema:**
```json
{
  "api_spec": {
    "openapi_version": "3.0.0",
    "endpoints": []
  },
  "service_definitions": [],
  "middleware_requirements": [],
  "framework_preference": "string"
}
```

---

#### @backend-specialist → @python-specialist

**Trigger Conditions:**
- `backend_framework in ["fastapi", "django", "flask"]`
- `backend_language == "python"`
- `ml_integration == true`

**Payload Schema:**
```json
{
  "api_spec": {
    "endpoints": []
  },
  "service_definitions": [],
  "async_requirements": "boolean",
  "pydantic_models": []
}
```

---

### 4. Database Handoffs

#### @database-specialist → @azure-sql-specialist

**Trigger Conditions:**
- `database_system == "azure-sql"`
- `deployment_target == "azure"`

**Payload Schema:**
```json
{
  "entity_model": {
    "entities": [],
    "relationships": []
  },
  "performance_requirements": {
    "dtu_tier": "string",
    "read_replicas": "boolean"
  },
  "security_requirements": {
    "encryption": "boolean",
    "tde": "boolean"
  }
}
```

---

#### @database-specialist → @sql-server-specialist

**Trigger Conditions:**
- `database_system == "sql-server"`
- `deployment_target == "on-premises"`
- `stored_procedures_required == true`

**Payload Schema:**
```json
{
  "entity_model": {
    "entities": [],
    "relationships": []
  },
  "stored_procedures": [],
  "triggers": [],
  "views": []
}
```

---

#### @database-specialist → @cosmos-db-specialist

**Trigger Conditions:**
- `database_system == "cosmos-db"`
- `data_model == "document"`
- `global_distribution == true`

**Payload Schema:**
```json
{
  "document_types": [],
  "partition_strategy": {
    "key": "string",
    "hierarchical": "boolean"
  },
  "consistency_requirements": "string",
  "throughput_mode": "string"
}
```

---

### 5. Azure Infrastructure Handoffs

#### @azure-architect → @networking-specialist

**Trigger Conditions:**
- `network_requirements.private_endpoints == true`
- `network_requirements.hub_spoke == true`
- `security_requirements.network_isolation == true`

**Payload Schema:**
```json
{
  "topology": "string",
  "vnet_requirements": [],
  "connectivity": {
    "on_premises": "boolean",
    "express_route": "boolean"
  },
  "security": {
    "nsg_rules": [],
    "firewall_required": "boolean"
  }
}
```

---

#### @azure-architect → @monitoring-specialist

**Trigger Conditions:**
- `observability_requirements.apm == true`
- `observability_requirements.logging == true`

**Payload Schema:**
```json
{
  "applications": [],
  "metrics_requirements": [],
  "alerting_rules": [],
  "dashboard_requirements": [],
  "retention_days": "number"
}
```

---

#### @api-gateway-specialist → @entra-id-specialist

**Trigger Conditions:**
- `authentication_required == true`
- `oauth_flows != null`

**Payload Schema:**
```json
{
  "auth_scenarios": [],
  "app_registrations": [],
  "api_permissions": [],
  "token_validation": {
    "audiences": [],
    "issuers": []
  }
}
```

---

### 6. Cross-Domain Handoffs

#### @microservices-architect → @container-specialist

**Trigger Conditions:**
- `deployment_target == "container-apps"`
- `deployment_target == "aks"`

**Payload Schema:**
```json
{
  "services": [],
  "scaling_requirements": {},
  "networking": {
    "ingress": {},
    "service_discovery": "string"
  },
  "dapr_components": []
}
```

---

#### @microservices-architect → @api-gateway-specialist

**Trigger Conditions:**
- `api_management == true`
- `external_exposure == true`

**Payload Schema:**
```json
{
  "apis": [],
  "products": [],
  "policies": {
    "rate_limiting": {},
    "transformation": []
  },
  "developer_portal": "boolean"
}
```

---

## Handoff Flow Diagrams

### Full Stack Generation Flow

```
@coordinator
    │
    ├──▶ @architect
    │        │
    │        ├──▶ @microservices-architect ──▶ @container-specialist ──▶ @bicep-specialist
    │        │                              └──▶ @api-gateway-specialist
    │        │
    │        ├──▶ @frontend-specialist
    │        │        ├──▶ @vue-specialist
    │        │        ├──▶ @nextjs-specialist
    │        │        └──▶ @angular-specialist
    │        │
    │        └──▶ @backend-specialist
    │                 ├──▶ @nodejs-specialist
    │                 └──▶ @python-specialist
    │
    ├──▶ @database-specialist
    │        ├──▶ @azure-sql-specialist
    │        ├──▶ @sql-server-specialist
    │        └──▶ @cosmos-db-specialist
    │
    └──▶ @azure-architect
             ├──▶ @networking-specialist ──▶ @bicep-specialist
             ├──▶ @monitoring-specialist ──▶ @bicep-specialist
             ├──▶ @entra-id-specialist ──▶ @keyvault-specialist
             └──▶ @storage-specialist ──▶ @bicep-specialist
```

---

## Error Handling

### Handoff Failures

When a handoff fails, the system should:

1. **Log the failure** with full context
2. **Notify the coordinator** for recovery decision
3. **Attempt retry** with exponential backoff (max 3 retries)
4. **Fallback** to parent agent if specialist unavailable

### Validation Rules

Each handoff must validate:

- Payload matches expected schema
- Required fields are present
- Target agent is available
- No circular handoff detection

---

## Tags

`handoff` `integration` `agent-communication` `workflow` `orchestration`
