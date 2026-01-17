# API Gateway Patterns Skill

**Skill ID**: `api-gateway-patterns`  
**Version**: 1.0.0  
**Category**: Infrastructure

---

## 🎯 Purpose

Comprehensive patterns and best practices for Azure API Management including versioning, security, rate limiting, caching, and traffic management.

---

## 📚 Core Patterns

### 1. API Versioning Strategies

#### URL Path Versioning (Recommended)
```
GET /api/v1/users
GET /api/v2/users
```

**Implementation:**
```xml
<!-- APIM API Configuration -->
<set-backend-service base-url="https://backend.azurewebsites.net" />
<rewrite-uri template="/{version}/users" copy-unmatched-params="true" />
```

**Pros:**
- Clear and explicit
- Easy to cache
- Self-documenting URLs
- Easy to route in APIM

**Cons:**
- URL changes between versions
- Clients need to update URLs

#### Header Versioning
```
GET /api/users
Api-Version: 1.0
```

**Implementation:**
```xml
<choose>
    <when condition="@(context.Request.Headers.GetValueOrDefault("Api-Version","1.0") == "2.0")">
        <set-backend-service base-url="https://backend-v2.azurewebsites.net" />
    </when>
    <otherwise>
        <set-backend-service base-url="https://backend-v1.azurewebsites.net" />
    </otherwise>
</choose>
```

**Pros:**
- Clean URLs
- No URL changes between versions

**Cons:**
- Less discoverable
- Harder to cache
- Requires header manipulation

#### Query String Versioning
```
GET /api/users?api-version=1.0
```

**Implementation:**
```xml
<choose>
    <when condition="@(context.Request.Url.Query.GetValueOrDefault("api-version","1.0") == "2.0")">
        <set-backend-service base-url="https://backend-v2.azurewebsites.net" />
    </when>
</choose>
```

---

### 2. Security Patterns

#### JWT Token Validation
```xml
<validate-jwt header-name="Authorization" require-scheme="Bearer"
              failed-validation-httpcode="401"
              failed-validation-error-message="Unauthorized">
    <openid-config url="https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration" />
    <issuers>
        <issuer>https://login.microsoftonline.com/{tenant}/v2.0</issuer>
    </issuers>
    <required-claims>
        <claim name="aud" match="all">
            <value>{audience}</value>
        </claim>
        <claim name="roles" match="any">
            <value>API.Read</value>
            <value>API.Write</value>
        </claim>
    </required-claims>
    <output-token-variable-name>jwt</output-token-variable-name>
</validate-jwt>

<!-- Use claims in downstream requests -->
<set-header name="X-User-Id" exists-action="override">
    <value>@(((Jwt)context.Variables["jwt"]).Claims.GetValueOrDefault("oid", ""))</value>
</set-header>
```

#### API Key Validation
```xml
<!-- Validate subscription key -->
<check-header name="Ocp-Apim-Subscription-Key" failed-check-httpcode="401"
              failed-check-error-message="Subscription key required" ignore-case="true" />

<!-- Or validate custom API key -->
<set-variable name="apiKey" value="@(context.Request.Headers.GetValueOrDefault("X-API-Key",""))" />
<choose>
    <when condition="@(!context.Variables.GetValueOrDefault<string>("apiKey").Equals("expected-key"))">
        <return-response>
            <set-status code="401" reason="Unauthorized" />
            <set-body>{"error": "Invalid API key"}</set-body>
        </return-response>
    </when>
</choose>
```

#### IP Filtering
```xml
<!-- Allow specific IP ranges -->
<ip-filter action="allow">
    <address-range from="10.0.0.1" to="10.0.0.255" />
    <address-range from="192.168.1.0" to="192.168.1.255" />
    <address>203.0.113.42</address>
</ip-filter>

<!-- Or deny specific IPs -->
<ip-filter action="forbid">
    <address-range from="1.2.3.4" to="1.2.3.10" />
</ip-filter>
```

#### Certificate Validation
```xml
<!-- Validate client certificate -->
<validate-client-certificate 
    validate-revocation="true"
    validate-trust="true"
    validate-not-before="true"
    validate-not-after="true"
    ignore-error="false">
    <identities>
        <identity thumbprint="CERTIFICATE_THUMBPRINT" />
    </identities>
</validate-client-certificate>
```

---

### 3. Rate Limiting Patterns

#### Per Subscription Rate Limit
```xml
<!-- 1000 calls per hour per subscription -->
<rate-limit calls="1000" renewal-period="3600" />

<!-- With remaining calls header -->
<rate-limit calls="1000" renewal-period="3600"
            retry-after-header-name="Retry-After"
            remaining-calls-header-name="X-RateLimit-Remaining" />
```

#### Per IP Address Rate Limit
```xml
<rate-limit-by-key 
    calls="100" 
    renewal-period="60" 
    counter-key="@(context.Request.IpAddress)"
    retry-after-header-name="Retry-After"
    remaining-calls-header-name="X-RateLimit-Remaining" />
```

#### Per User Rate Limit (from JWT)
```xml
<rate-limit-by-key 
    calls="500" 
    renewal-period="60" 
    counter-key="@(((Jwt)context.Variables["jwt"]).Claims.GetValueOrDefault("oid", "anonymous"))" />
```

#### Per Tenant Rate Limit (Multi-tenant)
```xml
<rate-limit-by-key 
    calls="10000" 
    renewal-period="3600" 
    counter-key="@(((Jwt)context.Variables["jwt"]).Claims.GetValueOrDefault("tid", "unknown"))" />
```

#### Quota (Daily/Monthly Limits)
```xml
<!-- Daily quota per subscription -->
<quota calls="50000" renewal-period="86400" />

<!-- Quota by key (per user daily) -->
<quota-by-key calls="1000" renewal-period="86400"
    counter-key="@(context.User?.Id ?? context.Request.IpAddress)" />
```

#### Sliding Window Rate Limit
```xml
<!-- More accurate rate limiting using sliding window -->
<rate-limit-by-key 
    calls="100" 
    renewal-period="60"
    counter-key="@(context.Request.IpAddress)"
    increment-count="1" />
```

---

### 4. Backend Routing Patterns

#### Path-Based Routing
```xml
<choose>
    <when condition="@(context.Request.Url.Path.StartsWith("/api/users"))">
        <set-backend-service base-url="https://user-service.azurecontainerapps.io" />
    </when>
    <when condition="@(context.Request.Url.Path.StartsWith("/api/orders"))">
        <set-backend-service base-url="https://order-service.azurecontainerapps.io" />
    </when>
    <when condition="@(context.Request.Url.Path.StartsWith("/api/products"))">
        <set-backend-service base-url="https://product-service.azurewebsites.net" />
    </when>
    <otherwise>
        <return-response>
            <set-status code="404" reason="Not Found" />
        </return-response>
    </otherwise>
</choose>
```

#### Header-Based Routing
```xml
<choose>
    <when condition="@(context.Request.Headers.GetValueOrDefault("X-Tenant-Region","EU") == "US")">
        <set-backend-service base-url="https://api-us.example.com" />
    </when>
    <when condition="@(context.Request.Headers.GetValueOrDefault("X-Tenant-Region","EU") == "EU")">
        <set-backend-service base-url="https://api-eu.example.com" />
    </when>
</choose>
```

#### Weighted Routing (A/B Testing)
```xml
<choose>
    <when condition="@(new Random().Next(100) < 10)">
        <!-- 10% traffic to new version -->
        <set-backend-service base-url="https://api-v2.example.com" />
        <set-header name="X-Backend-Version" exists-action="override">
            <value>v2</value>
        </set-header>
    </when>
    <otherwise>
        <!-- 90% traffic to stable version -->
        <set-backend-service base-url="https://api-v1.example.com" />
        <set-header name="X-Backend-Version" exists-action="override">
            <value>v1</value>
        </set-header>
    </otherwise>
</choose>
```

---

### 5. Caching Patterns

#### Basic Response Caching
```xml
<!-- Lookup cache -->
<cache-lookup vary-by-developer="false" vary-by-developer-groups="false"
              caching-type="internal" downstream-caching-type="none" />

<!-- Store in cache (in outbound) -->
<cache-store duration="3600" />
```

#### Vary By Headers/Query
```xml
<cache-lookup vary-by-developer="false" vary-by-developer-groups="false">
    <vary-by-header>Accept</vary-by-header>
    <vary-by-header>Accept-Language</vary-by-header>
    <vary-by-query-parameter>page</vary-by-query-parameter>
    <vary-by-query-parameter>limit</vary-by-query-parameter>
</cache-lookup>
```

#### Conditional Caching
```xml
<!-- Only cache successful responses -->
<cache-store duration="3600" cache-response="true"
             condition="@(context.Response.StatusCode == 200)" />
```

#### Cache Invalidation
```xml
<!-- Remove specific cache entry -->
<cache-remove-value key="@("user-" + context.Request.MatchedParameters["userId"])" />

<!-- Pattern-based invalidation -->
<cache-remove-value key="@("users-list-*")" />
```

#### External Cache (Redis)
```xml
<cache-lookup-value key="@("user-" + context.Request.MatchedParameters["userId"])"
                    variable-name="cachedUser"
                    caching-type="external" />

<choose>
    <when condition="@(context.Variables.ContainsKey("cachedUser"))">
        <return-response>
            <set-status code="200" />
            <set-body>@((string)context.Variables["cachedUser"])</set-body>
        </return-response>
    </when>
</choose>

<!-- Store in external cache (outbound) -->
<cache-store-value key="@("user-" + context.Request.MatchedParameters["userId"])"
                   value="@(context.Response.Body.As<string>(preserveContent: true))"
                   duration="3600"
                   caching-type="external" />
```

---

### 6. Request/Response Transformation

#### Add/Modify Headers
```xml
<!-- Inbound: Add correlation ID -->
<set-header name="X-Correlation-Id" exists-action="skip">
    <value>@(Guid.NewGuid().ToString())</value>
</set-header>

<!-- Add timestamp -->
<set-header name="X-Request-Time" exists-action="override">
    <value>@(DateTime.UtcNow.ToString("o"))</value>
</set-header>

<!-- Outbound: Remove sensitive headers -->
<set-header name="X-Powered-By" exists-action="delete" />
<set-header name="Server" exists-action="delete" />
<set-header name="X-AspNet-Version" exists-action="delete" />
```

#### Request Body Transformation
```xml
<set-body>@{
    var body = context.Request.Body.As<JObject>();
    
    // Add audit fields
    body["requestedBy"] = ((Jwt)context.Variables["jwt"]).Claims.GetValueOrDefault("name", "unknown");
    body["requestedAt"] = DateTime.UtcNow.ToString("o");
    body["clientIp"] = context.Request.IpAddress;
    
    return body.ToString();
}</set-body>
```

#### Response Body Transformation
```xml
<set-body>@{
    var response = context.Response.Body.As<JObject>();
    
    // Add metadata
    response["_meta"] = new JObject {
        ["requestId"] = context.RequestId,
        ["timestamp"] = DateTime.UtcNow.ToString("o"),
        ["apiVersion"] = "1.0"
    };
    
    // Remove internal fields
    response.Remove("_internalId");
    response.Remove("_etag");
    
    return response.ToString();
}</set-body>
```

#### URL Rewriting
```xml
<!-- Rewrite URL path -->
<rewrite-uri template="/internal/v2{path}" copy-unmatched-params="true" />

<!-- Rewrite with path parameters -->
<rewrite-uri template="/api/entities/{entityId}/items/{itemId}" />
```

---

### 7. Error Handling Patterns

#### Custom Error Responses
```xml
<on-error>
    <base />
    <choose>
        <when condition="@(context.Response.StatusCode == 401)">
            <set-body>@{
                return new JObject {
                    ["error"] = "Unauthorized",
                    ["message"] = "Authentication required",
                    ["requestId"] = context.RequestId
                }.ToString();
            }</set-body>
        </when>
        <when condition="@(context.Response.StatusCode == 403)">
            <set-body>@{
                return new JObject {
                    ["error"] = "Forbidden",
                    ["message"] = "Insufficient permissions",
                    ["requestId"] = context.RequestId
                }.ToString();
            }</set-body>
        </when>
        <when condition="@(context.Response.StatusCode == 429)">
            <set-body>@{
                return new JObject {
                    ["error"] = "TooManyRequests",
                    ["message"] = "Rate limit exceeded. Please retry after the specified time.",
                    ["requestId"] = context.RequestId,
                    ["retryAfter"] = context.Response.Headers.GetValueOrDefault("Retry-After", "60")
                }.ToString();
            }</set-body>
        </when>
        <when condition="@(context.Response.StatusCode >= 500)">
            <set-body>@{
                return new JObject {
                    ["error"] = "InternalServerError",
                    ["message"] = "An unexpected error occurred",
                    ["requestId"] = context.RequestId
                }.ToString();
            }</set-body>
        </when>
    </choose>
</on-error>
```

#### Retry Policies
```xml
<!-- Retry on 5xx errors -->
<retry condition="@(context.Response.StatusCode >= 500)" count="3" interval="1" 
       delta="1" max-interval="10" first-fast-retry="true">
    <forward-request buffer-response="true" />
</retry>

<!-- Retry on specific status codes -->
<retry condition="@(context.Response.StatusCode == 503 || context.Response.StatusCode == 429)" 
       count="5" interval="2" delta="2" max-interval="30">
    <forward-request buffer-response="true" />
</retry>
```

---

### 8. CORS Configuration

#### Comprehensive CORS Policy
```xml
<cors allow-credentials="true">
    <allowed-origins>
        <origin>https://app.example.com</origin>
        <origin>https://admin.example.com</origin>
        <origin>http://localhost:3000</origin> <!-- Development -->
    </allowed-origins>
    <allowed-methods>
        <method>GET</method>
        <method>POST</method>
        <method>PUT</method>
        <method>PATCH</method>
        <method>DELETE</method>
        <method>OPTIONS</method>
    </allowed-methods>
    <allowed-headers>
        <header>Content-Type</header>
        <header>Authorization</header>
        <header>X-Requested-With</header>
        <header>X-Correlation-Id</header>
    </allowed-headers>
    <expose-headers>
        <header>X-Correlation-Id</header>
        <header>X-RateLimit-Remaining</header>
        <header>Retry-After</header>
    </expose-headers>
    <preflight-result-max-age>600</preflight-result-max-age>
</cors>
```

---

### 9. Monitoring & Logging

#### Application Insights Integration
```xml
<!-- Log to Application Insights -->
<trace source="api-request" severity="information">
    <message>@{
        return $"API: {context.Api.Name}, " +
               $"Operation: {context.Operation.Name}, " +
               $"Status: {context.Response.StatusCode}, " +
               $"Duration: {context.Elapsed.TotalMilliseconds}ms";
    }</message>
    <metadata name="correlationId" value="@(context.RequestId)" />
    <metadata name="userId" value="@(context.User?.Id ?? "anonymous")" />
    <metadata name="subscriptionId" value="@(context.Subscription?.Key ?? "none")" />
</trace>
```

#### Custom Metrics
```xml
<emit-metric name="api-request-count" namespace="APIM-Custom">
    <dimension name="api" value="@(context.Api.Name)" />
    <dimension name="operation" value="@(context.Operation.Name)" />
    <dimension name="statusCode" value="@(context.Response.StatusCode.ToString())" />
    <dimension name="region" value="@(context.Deployment.Region)" />
</emit-metric>

<!-- Emit latency metric -->
<emit-metric name="api-latency-ms" value="@(context.Elapsed.TotalMilliseconds)" namespace="APIM-Custom">
    <dimension name="api" value="@(context.Api.Name)" />
</emit-metric>
```

#### Detailed Logging to Event Hub
```xml
<log-to-eventhub logger-id="apim-logger">@{
    return new JObject {
        ["timestamp"] = DateTime.UtcNow.ToString("o"),
        ["requestId"] = context.RequestId,
        ["api"] = context.Api.Name,
        ["operation"] = context.Operation.Name,
        ["method"] = context.Request.Method,
        ["url"] = context.Request.Url.ToString(),
        ["clientIp"] = context.Request.IpAddress,
        ["userAgent"] = context.Request.Headers.GetValueOrDefault("User-Agent", ""),
        ["statusCode"] = context.Response.StatusCode,
        ["responseTime"] = context.Elapsed.TotalMilliseconds,
        ["subscription"] = context.Subscription?.Key ?? "anonymous",
        ["userId"] = context.User?.Id ?? "anonymous"
    }.ToString();
}</log-to-eventhub>
```

---

## 🔧 Complete Policy Template

```xml
<policies>
    <inbound>
        <base />
        
        <!-- CORS -->
        <cors allow-credentials="true">
            <allowed-origins>
                <origin>https://app.example.com</origin>
            </allowed-origins>
            <allowed-methods preflight-result-max-age="300">
                <method>*</method>
            </allowed-methods>
            <allowed-headers>
                <header>*</header>
            </allowed-headers>
        </cors>
        
        <!-- Add correlation ID -->
        <set-header name="X-Correlation-Id" exists-action="skip">
            <value>@(Guid.NewGuid().ToString())</value>
        </set-header>
        
        <!-- JWT Validation -->
        <validate-jwt header-name="Authorization" require-scheme="Bearer">
            <openid-config url="https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration" />
            <required-claims>
                <claim name="aud">
                    <value>{audience}</value>
                </claim>
            </required-claims>
        </validate-jwt>
        
        <!-- Rate limiting -->
        <rate-limit-by-key calls="1000" renewal-period="60" 
            counter-key="@(context.User?.Id ?? context.Request.IpAddress)" />
        
        <!-- Caching -->
        <cache-lookup vary-by-developer="false" vary-by-developer-groups="false" />
    </inbound>
    
    <backend>
        <base />
        <retry condition="@(context.Response.StatusCode >= 500)" count="2" interval="1" />
    </backend>
    
    <outbound>
        <base />
        
        <!-- Cache response -->
        <cache-store duration="300" />
        
        <!-- Remove sensitive headers -->
        <set-header name="X-Powered-By" exists-action="delete" />
        
        <!-- Add security headers -->
        <set-header name="Strict-Transport-Security" exists-action="override">
            <value>max-age=31536000; includeSubDomains</value>
        </set-header>
    </outbound>
    
    <on-error>
        <base />
        <trace source="error" severity="error">
            <message>@(context.LastError.Message)</message>
        </trace>
    </on-error>
</policies>
```

---

## 📚 Related Resources

- [@api-gateway-specialist](@api-gateway-specialist.agent.md)
- [Azure APIM Documentation](https://docs.microsoft.com/azure/api-management/)

---

## 🏷️ Tags

`apim` `api-gateway` `versioning` `rate-limiting` `caching` `security` `jwt` `policies` `cors`
