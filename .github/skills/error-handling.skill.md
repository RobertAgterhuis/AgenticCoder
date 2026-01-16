# error-handling Skill

**Skill ID**: `error-handling`  
**Purpose**: Define error handling strategies, error types, recovery mechanisms, and error response patterns  
**Used By**: @qa, @coordinator, and all agents for validation  
**Type**: Strategy and validation

---

## Knowledge Areas

- Error classification and taxonomy
- Exception handling patterns
- Graceful degradation strategies
- Error recovery mechanisms
- User-facing error messages
- Error logging and monitoring
- Error budget management
- Circuit breaker and retry patterns

---

## Input Contract

```json
{
  "context": "validation | architecture | phase-planning",
  "error_scope": "system | application | infrastructure",
  "risk_level": "Low | Medium | High | Critical",
  "tech_stack": ["Node.js", "React", "PostgreSQL"]
}
```

---

## Output Contract

```json
{
  "error_handling_complete": true,
  "error_types_defined": 24,
  "recovery_strategies": 8,
  "monitoring_strategy": {...}
}
```

---

## Core Capabilities

### 1. Error Classification Taxonomy

**System-Level Errors**:
- **500 Internal Server Error**: Unrecoverable system error
- **503 Service Unavailable**: Service temporarily down
- **504 Gateway Timeout**: Upstream service timeout

**Application-Level Errors**:
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: Authorization failed
- **404 Not Found**: Resource not found
- **409 Conflict**: Data conflict (e.g., duplicate)
- **422 Unprocessable Entity**: Business logic violation

**Validation Errors**:
- **Required field missing**: Input validation
- **Invalid format**: Type/format mismatch
- **Out of range**: Value outside acceptable bounds
- **Business rule violation**: Breaks domain constraints

**Infrastructure Errors**:
- **Database connection failed**: Can't connect to DB
- **API call timeout**: External service timeout
- **Rate limit exceeded**: Too many requests

### 2. Error Response Format

**Standardized Error Response**:
```json
{
  "error": true,
  "error_code": "VALIDATION_ERROR",
  "message": "Validation failed: email is required",
  "timestamp": "2026-01-13T10:30:00Z",
  "details": {
    "field": "email",
    "expected": "valid email address",
    "actual": "null"
  },
  "recovery_suggestions": [
    "Provide a valid email address",
    "Check the API documentation"
  ],
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response Levels**:

| Level | HTTP | Severity | User Action |
|-------|------|----------|------------|
| **Validation** | 400 | Error | Fix input and retry |
| **Not Found** | 404 | Error | Check resource ID |
| **Business Logic** | 422 | Error | Change request parameters |
| **Rate Limit** | 429 | Warning | Wait and retry |
| **Service Error** | 500-503 | Critical | Retry with exponential backoff |
| **Timeout** | 504 | Critical | Retry or use circuit breaker |

### 3. Recovery Strategies

**Immediate Recovery**:
```markdown
## Error: Network Timeout

**Detection**: API call > 30 seconds

**Recovery**:
1. Immediate retry (connection may be transient)
2. Exponential backoff: 1s, 2s, 4s, 8s (max 3 retries)
3. If all retries fail: Use cached data if available
4. Finally: Return user-friendly error "Service temporarily unavailable"

**Monitoring**: Alert if retry rate > 10%
```

**Degraded Mode**:
```markdown
## Error: Database Connection Lost

**Detection**: Can't connect to primary database

**Recovery**:
1. Try read replica
2. Try cache layer
3. Return limited functionality (read-only mode)
4. Alert team immediately
5. Attempt primary reconnection every 30 seconds

**Monitoring**: Track how long system runs degraded
```

**Circuit Breaker Pattern**:
```markdown
## Error: External API Consistently Failing

**States**:
- CLOSED: Normal operation
- OPEN: Blocking calls (fail immediately)
- HALF_OPEN: Test if service recovered

**Transitions**:
- CLOSED → OPEN: After N failures in M seconds
- OPEN → HALF_OPEN: After timeout (e.g., 60s)
- HALF_OPEN → CLOSED: If test call succeeds
- HALF_OPEN → OPEN: If test call fails

**Example**: 5 failures in 30s → Open circuit for 60s
```

### 4. Error Prevention (Fail-Safe Defaults)

**Input Validation**:
```typescript
// Validate BEFORE processing
const validateInput = (input: unknown): Result => {
  if (!input) return error("Input required");
  if (!isValidFormat(input)) return error("Invalid format");
  if (!meetsBusinessRules(input)) return error("Business rule violation");
  return success(input);
};
```

**Timeout Protection**:
```typescript
// Always set timeouts
const callExternalAPI = async () => {
  return Promise.race([
    fetch(url, { timeout: 30000 }),
    new Promise((_, reject) => 
      setTimeout(() => reject("Timeout"), 30000)
    )
  ]);
};
```

**Resource Limits**:
```
Max request body: 10MB
Max response time: 30s
Max concurrent connections: 100
Max database connections: 50
```

### 5. Error Logging Strategy

**Log Levels**:

| Level | When | Examples |
|-------|------|----------|
| **DEBUG** | Development only | Variable values, function entry/exit |
| **INFO** | Informational | Server started, user logged in |
| **WARN** | Something unexpected | Retry attempt, degraded mode |
| **ERROR** | Application error | Validation failed, API call failed |
| **CRITICAL** | System failure | Database down, service shutdown |

**Log Entry Format**:
```json
{
  "timestamp": "2026-01-13T10:30:00Z",
  "level": "ERROR",
  "logger": "AuthService",
  "message": "Authentication failed",
  "error_code": "INVALID_CREDENTIALS",
  "user_id": "user-123",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "stack_trace": "...",
  "context": {
    "attempt": 3,
    "ip_address": "192.168.1.1"
  }
}
```

### 6. Error Monitoring & Alerting

**Key Metrics**:
- Error rate: % of requests resulting in error
- Error types: Breakdown by error category
- Recovery time: How long to recover from error
- Error budget: Total errors allowed per period (if SLO-based)

**Alert Thresholds**:
```
- Error rate > 1% → Alert
- Critical errors > 0 → Alert immediately
- Recovery time > 5 minutes → Alert
- Circuit breaker OPEN > 30s → Alert
```

**Error Budget Tracking**:
```
SLO: 99.9% uptime = 43.2 minutes downtime per month
Error Budget: 43.2 minutes

If using 40 minutes: 3.2 minutes remaining
→ Can deploy risky changes? No
→ Need extra validation? Yes
```

### 7. User-Facing Error Messages

**DO**:
- Be specific: "Email is required" (not "Invalid input")
- Be actionable: "Use format: user@example.com"
- Be polite: "Sorry, we couldn't process that"
- Provide recovery: "Try again later" or "Contact support"

**DON'T**:
- Expose stack traces
- Mention internal systems
- Use technical jargon
- Hide error code entirely

**Example**:
```
❌ "Error: NullPointerException at line 42"
✅ "We couldn't save your changes. Please check your email address and try again."
✅ "Error code: INVALID_EMAIL (if user needs to contact support)"
```

---

## Implementation Options

### Option 1: Standardized Framework (Recommended)

Use consistent error handling pattern across all code:

```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: ErrorResponse };

// Use in all functions
const processUser = (input: unknown): Result<User> => {
  const validated = validateInput(input);
  if (!validated.success) return validated;
  
  const result = await saveToDb(validated.data);
  if (!result.success) return result;
  
  return { success: true, data: result.data };
};
```

### Option 2: Middleware-Based (For APIs)

```typescript
// Express middleware example
app.use((err, req, res, next) => {
  const errorResponse = classifyError(err);
  const statusCode = getStatusCode(errorResponse.error_code);
  
  logError(err, req);
  res.status(statusCode).json(errorResponse);
});
```

### Option 3: Circuit Breaker Library

Use libraries like `opossum` (JavaScript) or `polly` (C#) for automatic circuit breaking.

---

## Performance Considerations

- **Error handling overhead**: <1ms per error
- **Retry backoff**: Total time <60 seconds for 3 retries
- **Circuit breaker state change**: <100ms
- **Error logging**: Async (non-blocking)

---

## Testing Strategy

**Unit Tests**:
- Test each error type
- Test recovery strategies
- Test validation logic
- Test timeout handling

**Integration Tests**:
- Test error propagation across services
- Test circuit breaker behavior
- Test error logging/monitoring
- Test graceful degradation

**Chaos Tests**:
- Kill database → expect degraded mode
- Slow down API → expect timeout handling
- Return invalid data → expect validation error
- Network outage → expect retry logic

---

## Compliance Considerations

**Audit Trail**:
- Log all errors (security-related especially)
- Include user/system context
- Maintain error logs for compliance period

**Data Privacy**:
- Never log sensitive data (passwords, tokens, PII)
- Use masking/hashing for user IDs if needed
- Encrypt error logs at rest

---

## Used By

- **@qa Agent**: Defines error handling strategy for testing
- **@coordinator Agent**: Maps error handling to phase planning
- **All Agents**: Use error responses for validation

---

## Filename**: `error-handling.skill.md`
