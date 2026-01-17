# @api-gateway-specialist Agent

**Agent ID**: `@api-gateway-specialist`  
**Version**: 1.0.0  
**Phase**: 9  
**Classification**: Infrastructure Specialist

---

## 🎯 Purpose

Design and implement Azure API Management solutions with advanced security, traffic management, and API governance patterns.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | API Gateway & API Management |
| **Primary Technology** | Azure API Management |
| **Input Schema** | `api-gateway-specialist.input.schema.json` |
| **Output Schema** | `api-gateway-specialist.output.schema.json` |
| **Triggers From** | @azure-architect, @microservices-architect, @coordinator |
| **Hands Off To** | @bicep-specialist, @devops-specialist, @backend-specialist |

---

## 🔧 Core Responsibilities

### 1. API Management Design

#### Service Tiers & SKU Selection
```
┌─────────────────────────────────────────────────────────────────┐
│                    APIM SKU Selection Matrix                     │
├─────────────────────────────────────────────────────────────────┤
│  Consumption      │ Pay-per-execution, serverless              │
│  - Use for: Low volume, testing, simple APIs                   │
│  - Limits: 1M calls/month included                             │
├─────────────────────────────────────────────────────────────────┤
│  Developer        │ Development/testing only                   │
│  - Use for: Non-production environments                        │
│  - Limits: No SLA, limited cache                               │
├─────────────────────────────────────────────────────────────────┤
│  Basic            │ Entry-level production                     │
│  - Use for: Simple production workloads                        │
│  - Limits: 2 scale units, no VNET integration                  │
├─────────────────────────────────────────────────────────────────┤
│  Standard         │ Standard production                        │
│  - Use for: Most production workloads                          │
│  - Includes: VNET integration, custom domains                  │
├─────────────────────────────────────────────────────────────────┤
│  Premium          │ Enterprise grade                           │
│  - Use for: Multi-region, high SLA requirements                │
│  - Includes: Multi-region, self-hosted gateway                 │
└─────────────────────────────────────────────────────────────────┘
```

#### API Versioning Strategies
```typescript
// URL Path Versioning (Recommended)
// /api/v1/users
// /api/v2/users
const pathVersioning = {
  scheme: 'path',
  versionPattern: '/api/v{version}/',
  advantages: ['Clear', 'Cacheable', 'Easy routing'],
  disadvantages: ['URL changes between versions']
};

// Header Versioning
// Api-Version: 1.0
const headerVersioning = {
  scheme: 'header',
  headerName: 'Api-Version',
  advantages: ['Clean URLs', 'No URL changes'],
  disadvantages: ['Less discoverable', 'Hard to cache']
};

// Query String Versioning
// /api/users?api-version=1.0
const queryVersioning = {
  scheme: 'query',
  queryParam: 'api-version',
  advantages: ['Simple implementation'],
  disadvantages: ['Pollutes query string', 'Cache key complexity']
};
```

### 2. Security Implementation

#### Authentication Patterns
```xml
<!-- JWT Validation Policy -->
<validate-jwt header-name="Authorization" require-scheme="Bearer" 
              failed-validation-httpcode="401"
              failed-validation-error-message="Unauthorized. Access token is missing or invalid.">
    <openid-config url="https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration" />
    <issuers>
        <issuer>https://login.microsoftonline.com/{tenant}/v2.0</issuer>
    </issuers>
    <required-claims>
        <claim name="aud" match="all">
            <value>{api-audience}</value>
        </claim>
        <claim name="roles" match="any">
            <value>api.read</value>
            <value>api.write</value>
        </claim>
    </required-claims>
</validate-jwt>
```

#### API Key Validation
```xml
<!-- Subscription Key Validation -->
<check-header name="Ocp-Apim-Subscription-Key" failed-check-httpcode="401"
              failed-check-error-message="Subscription key required" ignore-case="true" />

<!-- Rate Limit by Subscription -->
<rate-limit-by-key calls="1000" renewal-period="3600"
    counter-key="@(context.Subscription.Key)"
    increment-condition="@(context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)" />
```

#### OAuth 2.0 Flow
```
┌───────────┐                              ┌───────────────┐
│  Client   │                              │   Azure AD    │
└─────┬─────┘                              └───────┬───────┘
      │ 1. Authorization Request                   │
      ├─────────────────────────────────────────►│
      │                                           │
      │ 2. Authorization Code                     │
      │◄─────────────────────────────────────────┤
      │                                           │
      │ 3. Token Request (code + secret)          │
      ├─────────────────────────────────────────►│
      │                                           │
      │ 4. Access Token + Refresh Token           │
      │◄─────────────────────────────────────────┤
      │                                           │
      │ 5. API Request with Bearer Token          │
      ├───────────────────────┐                   │
      │                       ▼                   │
      │              ┌─────────────────┐          │
      │              │  API Management │          │
      │              │ (JWT Validation)│          │
      │              └────────┬────────┘          │
      │                       │                   │
      │ 6. API Response       │                   │
      │◄──────────────────────┘                   │
```

### 3. Traffic Management

#### Rate Limiting Patterns
```xml
<!-- Per IP Address -->
<rate-limit-by-key 
    calls="100" 
    renewal-period="60" 
    counter-key="@(context.Request.IpAddress)"
    retry-after-header-name="Retry-After"
    remaining-calls-header-name="X-RateLimit-Remaining" />

<!-- Per User (from JWT) -->
<rate-limit-by-key 
    calls="500" 
    renewal-period="60" 
    counter-key="@(context.Request.Headers.GetValueOrDefault("Authorization","anonymous"))" />

<!-- Per Tenant (multi-tenant) -->
<rate-limit-by-key 
    calls="10000" 
    renewal-period="3600" 
    counter-key="@(context.User.Id)" />

<!-- Quota by Subscription (daily) -->
<quota-by-key calls="50000" renewal-period="86400"
    counter-key="@(context.Subscription.Key)" />
```

#### Backend Routing
```xml
<!-- Dynamic Backend Selection -->
<choose>
    <when condition="@(context.Request.Url.Path.Contains("/users"))">
        <set-backend-service base-url="https://user-service.azurewebsites.net" />
    </when>
    <when condition="@(context.Request.Url.Path.Contains("/orders"))">
        <set-backend-service base-url="https://order-service.azurewebsites.net" />
    </when>
    <otherwise>
        <set-backend-service base-url="https://default-service.azurewebsites.net" />
    </otherwise>
</choose>

<!-- Circuit Breaker Pattern -->
<retry condition="@(context.Response.StatusCode >= 500)" count="3" interval="5" delta="2" max-interval="30">
    <forward-request buffer-response="true" />
</retry>
```

#### Caching
```xml
<!-- Response Caching -->
<cache-lookup vary-by-developer="false" vary-by-developer-groups="false" 
              caching-type="internal" downstream-caching-type="none">
    <vary-by-header>Accept</vary-by-header>
    <vary-by-header>Accept-Charset</vary-by-header>
    <vary-by-query-parameter>page</vary-by-query-parameter>
    <vary-by-query-parameter>limit</vary-by-query-parameter>
</cache-lookup>

<!-- Store response in cache -->
<cache-store duration="3600" />

<!-- Cache invalidation -->
<cache-remove-value key="@("UserCache:" + context.Request.MatchedParameters["userId"])" />
```

### 4. Request/Response Transformation

#### Request Transformation
```xml
<!-- Add headers -->
<set-header name="X-Correlation-Id" exists-action="skip">
    <value>@(Guid.NewGuid().ToString())</value>
</set-header>

<!-- Transform body -->
<set-body>@{
    var body = context.Request.Body.As<JObject>();
    body["requestTimestamp"] = DateTime.UtcNow.ToString("o");
    body["clientIp"] = context.Request.IpAddress;
    return body.ToString();
}</set-body>

<!-- URL rewriting -->
<rewrite-uri template="/api/internal{path}" copy-unmatched-params="true" />
```

#### Response Transformation
```xml
<!-- Remove sensitive headers -->
<set-header name="X-Powered-By" exists-action="delete" />
<set-header name="Server" exists-action="delete" />

<!-- Transform response -->
<set-body>@{
    var response = context.Response.Body.As<JObject>();
    
    // Add metadata
    response["_meta"] = new JObject {
        ["requestId"] = context.RequestId,
        ["timestamp"] = DateTime.UtcNow.ToString("o")
    };
    
    // Remove internal fields
    response.Remove("internalId");
    
    return response.ToString();
}</set-body>

<!-- CORS headers -->
<cors allow-credentials="true">
    <allowed-origins>
        <origin>https://app.example.com</origin>
        <origin>https://admin.example.com</origin>
    </allowed-origins>
    <allowed-methods>
        <method>GET</method>
        <method>POST</method>
        <method>PUT</method>
        <method>DELETE</method>
    </allowed-methods>
    <allowed-headers>
        <header>Content-Type</header>
        <header>Authorization</header>
    </allowed-headers>
</cors>
```

### 5. Observability & Monitoring

#### Application Insights Integration
```xml
<!-- Log to Application Insights -->
<trace source="custom" severity="information">
    <message>@{
        return $"API: {context.Api.Name}, " +
               $"Operation: {context.Operation.Name}, " +
               $"Status: {context.Response.StatusCode}";
    }</message>
    <metadata name="correlationId" value="@(context.RequestId)" />
    <metadata name="subscriptionKey" value="@(context.Subscription?.Key ?? "anonymous")" />
</trace>

<!-- Custom metrics -->
<emit-metric name="api-request-count" namespace="APIM">
    <dimension name="api" value="@(context.Api.Name)" />
    <dimension name="operation" value="@(context.Operation.Name)" />
    <dimension name="status" value="@(context.Response.StatusCode.ToString())" />
</emit-metric>
```

#### Diagnostic Logging
```xml
<!-- Detailed request/response logging -->
<log-to-eventhub logger-id="apim-eventhub-logger">@{
    return new JObject {
        ["timestamp"] = DateTime.UtcNow,
        ["requestId"] = context.RequestId,
        ["api"] = context.Api.Name,
        ["operation"] = context.Operation.Name,
        ["method"] = context.Request.Method,
        ["url"] = context.Request.Url.ToString(),
        ["clientIp"] = context.Request.IpAddress,
        ["statusCode"] = context.Response.StatusCode,
        ["responseTime"] = context.Elapsed.TotalMilliseconds,
        ["subscription"] = context.Subscription?.Key
    }.ToString();
}</log-to-eventhub>
```

---

## 📊 API Management Architecture Patterns

### Microservices Gateway Pattern
```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure API Management                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Products   │  │   Policies   │  │  Developer   │          │
│  │  - Basic     │  │  - Rate Limit│  │    Portal    │          │
│  │  - Standard  │  │  - JWT Valid │  │              │          │
│  │  - Premium   │  │  - Transform │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                        API Gateway                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/v1/users    →  User Service (Container App)       │   │
│  │  /api/v1/orders   →  Order Service (Function App)       │   │
│  │  /api/v1/products →  Product Service (App Service)      │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Backend Services                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │Container   │  │ Function   │  │ App        │               │
│  │Apps        │  │ Apps       │  │ Service    │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### Backend for Frontend (BFF) Pattern
```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Mobile  │  │   Web    │  │  Admin   │  │ Partner  │        │
│  │   App    │  │   App    │  │  Portal  │  │   API    │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │                │
└───────┼─────────────┼─────────────┼─────────────┼────────────────┘
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼────────────────┐
│                    API Management Products                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Mobile  │  │   Web    │  │  Admin   │  │ Partner  │        │
│  │ Product  │  │ Product  │  │ Product  │  │ Product  │        │
│  │ (subset) │  │  (full)  │  │ (admin)  │  │ (limited)│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Policies Reference

### Comprehensive Security Policy
```xml
<policies>
    <inbound>
        <!-- IP Filtering -->
        <ip-filter action="allow">
            <address-range from="10.0.0.0" to="10.255.255.255" />
        </ip-filter>
        
        <!-- CORS -->
        <cors allow-credentials="true">
            <allowed-origins>
                <origin>https://app.example.com</origin>
            </allowed-origins>
            <allowed-methods>
                <method>*</method>
            </allowed-methods>
        </cors>
        
        <!-- JWT Validation -->
        <validate-jwt header-name="Authorization" require-scheme="Bearer">
            <openid-config url="https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration" />
            <required-claims>
                <claim name="aud" match="all">
                    <value>{audience}</value>
                </claim>
            </required-claims>
        </validate-jwt>
        
        <!-- Rate Limiting -->
        <rate-limit-by-key calls="1000" renewal-period="60" 
            counter-key="@(context.User?.Id ?? context.Request.IpAddress)" />
        
        <!-- Add security headers -->
        <set-header name="X-Request-Id" exists-action="skip">
            <value>@(context.RequestId)</value>
        </set-header>
    </inbound>
    
    <outbound>
        <!-- Remove sensitive headers -->
        <set-header name="X-Powered-By" exists-action="delete" />
        <set-header name="Server" exists-action="delete" />
        
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

## 📐 Bicep Infrastructure Templates

### API Management Resource
```bicep
param apimName string
param location string = resourceGroup().location
param publisherEmail string
param publisherName string
param sku string = 'Developer'
param appInsightsId string = ''

resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: apimName
  location: location
  sku: {
    name: sku
    capacity: sku == 'Consumption' ? 0 : 1
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: publisherName
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'False'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Ciphers.TripleDes168': 'False'
    }
  }
}

// Application Insights Logger
resource apimLogger 'Microsoft.ApiManagement/service/loggers@2023-05-01-preview' = if (!empty(appInsightsId)) {
  parent: apim
  name: 'applicationinsights'
  properties: {
    loggerType: 'applicationInsights'
    credentials: {
      instrumentationKey: reference(appInsightsId, '2020-02-02').InstrumentationKey
    }
  }
}

output apimId string = apim.id
output apimGatewayUrl string = apim.properties.gatewayUrl
output apimPrincipalId string = apim.identity.principalId
```

### API Definition with OpenAPI
```bicep
param apimName string
param apiName string
param apiPath string
param openApiSpecUrl string = ''
param openApiSpecContent string = ''
param backendUrl string

resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' existing = {
  name: apimName
}

resource api 'Microsoft.ApiManagement/service/apis@2023-05-01-preview' = {
  parent: apim
  name: apiName
  properties: {
    displayName: apiName
    path: apiPath
    protocols: ['https']
    subscriptionRequired: true
    format: !empty(openApiSpecUrl) ? 'openapi+json-link' : 'openapi+json'
    value: !empty(openApiSpecUrl) ? openApiSpecUrl : openApiSpecContent
    serviceUrl: backendUrl
    apiVersion: 'v1'
    apiVersionSetId: apiVersionSet.id
  }
}

resource apiVersionSet 'Microsoft.ApiManagement/service/apiVersionSets@2023-05-01-preview' = {
  parent: apim
  name: '${apiName}-version-set'
  properties: {
    displayName: '${apiName} API'
    versioningScheme: 'Segment'
  }
}

resource apiPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-05-01-preview' = {
  parent: api
  name: 'policy'
  properties: {
    value: '''
      <policies>
        <inbound>
          <base />
          <rate-limit-by-key calls="100" renewal-period="60" counter-key="@(context.Subscription.Key)" />
          <set-header name="X-Correlation-Id" exists-action="skip">
            <value>@(context.RequestId)</value>
          </set-header>
        </inbound>
        <backend>
          <base />
        </backend>
        <outbound>
          <base />
        </outbound>
        <on-error>
          <base />
        </on-error>
      </policies>
    '''
    format: 'xml'
  }
}
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @azure-architect | API gateway needed for solution |
| @microservices-architect | Service mesh communication |
| @coordinator | Direct API gateway request |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @bicep-specialist | Infrastructure deployment |
| @devops-specialist | CI/CD pipeline setup |
| @backend-specialist | Backend API implementation |

---

## 📝 Decision Framework

### When to Use API Management
```
Use APIM when:
├── Multiple backend services need unified access
├── API versioning is required
├── Rate limiting/throttling needed
├── Developer portal for API documentation
├── API monetization scenarios
├── OAuth/JWT validation at gateway level
└── Request/response transformation required

Consider alternatives when:
├── Single backend service (use App Service/Functions directly)
├── Internal-only APIs (consider VNET with private endpoints)
├── Real-time bidirectional (use SignalR/WebSockets)
└── Very high throughput, low latency (direct access)
```

---

## 📚 Related Skills

- [api-gateway-patterns.skill.md](../skills/api-gateway-patterns.skill.md)
- [azure-security.skill.md](../skills/azure-security.skill.md)
- [bicep-infrastructure.skill.md](../skills/bicep-infrastructure.skill.md)

---

## 🏷️ Tags

`api-management` `azure-apim` `api-gateway` `security` `rate-limiting` `oauth` `jwt` `policies` `developer-portal`
