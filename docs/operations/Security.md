# Security Guide

Security best practices for AgenticCoder projects.

## Security Overview

AgenticCoder generates security-first architectures following:
- Azure Well-Architected Security Pillar
- OWASP Top 10 mitigation
- Zero Trust principles
- Defense in depth

## Identity & Access Management

### Azure Entra ID Integration

```bicep
// infra/identity.bicep

// User-assigned managed identity
module managedIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.4.0' = {
  name: 'id-${projectName}'
  params: {
    name: 'id-${projectName}-${environment}'
    location: location
  }
}

// App Service with managed identity
module appService 'br/public:avm/res/web/site:0.11.0' = {
  name: 'app-${projectName}'
  params: {
    name: 'app-${projectName}'
    managedIdentities: {
      systemAssigned: true
      userAssignedResourceIds: [
        managedIdentity.outputs.resourceId
      ]
    }
  }
}
```

### RBAC Configuration

```bicep
// Role assignments for least privilege
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, appService.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6' // Key Vault Secrets User
    )
    principalId: appService.outputs.systemAssignedMIPrincipalId
    principalType: 'ServicePrincipal'
  }
}
```

### Authentication Configuration

```csharp
// .NET Authentication setup
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// Require authenticated users
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
```

## Network Security

### Virtual Network Architecture

```bicep
// infra/network.bicep

module vnet 'br/public:avm/res/network/virtual-network:0.5.0' = {
  name: 'vnet-${projectName}'
  params: {
    name: 'vnet-${projectName}-${environment}'
    location: location
    addressPrefixes: ['10.0.0.0/16']
    subnets: [
      {
        name: 'snet-app'
        addressPrefix: '10.0.1.0/24'
        serviceEndpoints: [
          { service: 'Microsoft.Sql' }
          { service: 'Microsoft.KeyVault' }
          { service: 'Microsoft.Storage' }
        ]
        delegations: [
          {
            name: 'delegation'
            properties: {
              serviceName: 'Microsoft.Web/serverFarms'
            }
          }
        ]
      }
      {
        name: 'snet-data'
        addressPrefix: '10.0.2.0/24'
        networkSecurityGroupId: nsgData.outputs.resourceId
      }
      {
        name: 'snet-pe'
        addressPrefix: '10.0.3.0/24'
      }
    ]
  }
}
```

### Network Security Groups

```bicep
module nsgData 'br/public:avm/res/network/network-security-group:0.5.0' = {
  name: 'nsg-data'
  params: {
    name: 'nsg-data-${environment}'
    location: location
    securityRules: [
      {
        name: 'AllowAppSubnet'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '10.0.1.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '1433'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}
```

### Private Endpoints

```bicep
// Private endpoint for SQL Server
module sqlPrivateEndpoint 'br/public:avm/res/network/private-endpoint:0.8.0' = {
  name: 'pe-sql'
  params: {
    name: 'pe-sql-${projectName}'
    location: location
    subnetResourceId: vnet.outputs.subnetResourceIds[2] // snet-pe
    privateLinkServiceConnections: [
      {
        name: 'sql'
        properties: {
          privateLinkServiceId: sqlServer.outputs.resourceId
          groupIds: ['sqlServer']
        }
      }
    ]
    privateDnsZoneGroup: {
      privateDnsZoneGroupConfigs: [
        {
          privateDnsZoneResourceId: privateDnsZoneSql.outputs.resourceId
        }
      ]
    }
  }
}
```

### Web Application Firewall

```bicep
module frontDoor 'br/public:avm/res/cdn/profile:0.6.0' = {
  name: 'afd-${projectName}'
  params: {
    name: 'afd-${projectName}'
    sku: 'Premium_AzureFrontDoor'
    securityPolicies: [
      {
        name: 'waf-policy'
        associations: [
          {
            domains: [
              { id: frontDoorEndpoint.outputs.resourceId }
            ]
            patternsToMatch: ['/*']
          }
        ]
        wafPolicyResourceId: wafPolicy.outputs.resourceId
      }
    ]
  }
}

module wafPolicy 'br/public:avm/res/network/front-door-web-application-firewall-policy:0.3.0' = {
  name: 'waf-${projectName}'
  params: {
    name: 'waf${projectName}'
    sku: 'Premium_AzureFrontDoor'
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
        }
      ]
    }
    policySettings: {
      mode: 'Prevention'
      requestBodyCheck: 'Enabled'
    }
  }
}
```

## Data Protection

### Encryption at Rest

```bicep
// Key Vault for encryption keys
module keyVault 'br/public:avm/res/key-vault/vault:0.9.0' = {
  name: 'kv-${projectName}'
  params: {
    name: 'kv-${projectName}-${environment}'
    location: location
    enableRbacAuthorization: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 90
    keys: [
      {
        name: 'cmk-storage'
        keyType: 'RSA'
        keySize: 2048
      }
      {
        name: 'cmk-sql'
        keyType: 'RSA'
        keySize: 2048
      }
    ]
  }
}

// Storage with CMK
module storage 'br/public:avm/res/storage/storage-account:0.14.0' = {
  name: 'st-${projectName}'
  params: {
    name: 'st${projectName}${environment}'
    location: location
    skuName: 'Standard_GRS'
    customerManagedKey: {
      keyVaultResourceId: keyVault.outputs.resourceId
      keyName: 'cmk-storage'
    }
  }
}
```

### Encryption in Transit

```csharp
// Force HTTPS
app.UseHttpsRedirection();
app.UseHsts();

// Configure HSTS
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});
```

### Data Classification

```csharp
// SQL Server data classification
public class UserData
{
    public int Id { get; set; }
    
    [PersonalData]
    [SensitivityLabel("Confidential")]
    public string Email { get; set; }
    
    [PersonalData]
    [SensitivityLabel("Highly Confidential")]
    public string SSN { get; set; }
}
```

## Secret Management

### Key Vault Integration

```csharp
// .NET Key Vault configuration
builder.Configuration.AddAzureKeyVault(
    new Uri($"https://{keyVaultName}.vault.azure.net/"),
    new DefaultAzureCredential()
);

// Access secrets
var connectionString = builder.Configuration["DatabaseConnectionString"];
```

### Secret Rotation

```yaml
# .github/workflows/rotate-secrets.yml

name: Secret Rotation

on:
  schedule:
    - cron: '0 0 1 * *'  # Monthly

jobs:
  rotate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Rotate Database Password
        run: |
          NEW_PASSWORD=$(openssl rand -base64 32)
          
          # Update in Key Vault
          az keyvault secret set \
            --vault-name ${{ vars.KEY_VAULT }} \
            --name db-password \
            --value "$NEW_PASSWORD"
          
          # Update SQL Server
          az sql server update \
            --name ${{ vars.SQL_SERVER }} \
            --resource-group ${{ vars.RESOURCE_GROUP }} \
            --admin-password "$NEW_PASSWORD"
```

## Application Security

### Input Validation

```csharp
// Model validation
public class CreateOrderRequest
{
    [Required]
    [StringLength(100)]
    public string CustomerName { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    [Range(0.01, 1000000)]
    public decimal Amount { get; set; }
}

// Controller validation
[HttpPost]
public IActionResult CreateOrder([FromBody] CreateOrderRequest request)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }
    // Process order
}
```

### SQL Injection Prevention

```csharp
// ✅ Safe - Parameterized queries
var orders = await context.Orders
    .Where(o => o.CustomerId == customerId)
    .ToListAsync();

// ✅ Safe - Dapper with parameters
var orders = await connection.QueryAsync<Order>(
    "SELECT * FROM Orders WHERE CustomerId = @CustomerId",
    new { CustomerId = customerId }
);

// ❌ Vulnerable - String concatenation
var sql = $"SELECT * FROM Orders WHERE CustomerId = {customerId}";
```

### XSS Prevention

```typescript
// React - automatic escaping
function UserName({ name }: { name: string }) {
  return <span>{name}</span>;  // Automatically escaped
}

// ⚠️ Careful with dangerouslySetInnerHTML
function SafeHtml({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### CSRF Protection

```csharp
// .NET Anti-forgery
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
});

// Validate on POST/PUT/DELETE
[HttpPost]
[ValidateAntiForgeryToken]
public IActionResult UpdateProfile(ProfileModel model)
{
    // Process update
}
```

### Security Headers

```csharp
// Configure security headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Add("Content-Security-Policy", 
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
    
    await next();
});
```

## Security Scanning

### Dependency Scanning

```yaml
# .github/workflows/security-scan.yml

name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * *'

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: npm audit
        run: npm audit --audit-level=high
      
      - name: Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Container Scanning

```yaml
container-scan:
  runs-on: ubuntu-latest
  
  steps:
    - uses: actions/checkout@v4
    
    - name: Build image
      run: docker build -t myapp:${{ github.sha }} .
    
    - name: Trivy scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: myapp:${{ github.sha }}
        format: 'sarif'
        output: 'trivy-results.sarif'
        severity: 'CRITICAL,HIGH'
    
    - name: Upload to GitHub Security
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: 'trivy-results.sarif'
```

### Infrastructure Scanning

```yaml
infra-scan:
  runs-on: ubuntu-latest
  
  steps:
    - uses: actions/checkout@v4
    
    - name: Checkov scan
      uses: bridgecrewio/checkov-action@master
      with:
        directory: infra/
        framework: bicep
        output_format: sarif
```

## Compliance

### Audit Logging

```csharp
// Audit log middleware
public class AuditLogMiddleware
{
    public async Task InvokeAsync(HttpContext context, IAuditLogger auditLogger)
    {
        var auditEntry = new AuditEntry
        {
            Timestamp = DateTime.UtcNow,
            UserId = context.User?.Identity?.Name,
            Action = $"{context.Request.Method} {context.Request.Path}",
            IpAddress = context.Connection.RemoteIpAddress?.ToString(),
            UserAgent = context.Request.Headers.UserAgent
        };
        
        await _next(context);
        
        auditEntry.StatusCode = context.Response.StatusCode;
        await auditLogger.LogAsync(auditEntry);
    }
}
```

### Data Retention

```bicep
// Configure retention policies
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'audit-logs'
  scope: appService
  properties: {
    workspaceId: logAnalytics.outputs.resourceId
    logs: [
      {
        category: 'AppServiceAuditLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 365  // 1 year retention for compliance
        }
      }
    ]
  }
}
```

## Security Checklist

| Category | Item | Status |
|----------|------|--------|
| **Identity** | Managed identities used | ☐ |
| **Identity** | RBAC with least privilege | ☐ |
| **Identity** | MFA enabled for admin | ☐ |
| **Network** | Private endpoints configured | ☐ |
| **Network** | WAF enabled | ☐ |
| **Network** | NSGs configured | ☐ |
| **Data** | Encryption at rest | ☐ |
| **Data** | Encryption in transit | ☐ |
| **Data** | Key Vault for secrets | ☐ |
| **Application** | Input validation | ☐ |
| **Application** | Security headers | ☐ |
| **Scanning** | Dependency scanning | ☐ |
| **Scanning** | Container scanning | ☐ |
| **Compliance** | Audit logging | ☐ |

## Next Steps

- [Deployment](Deployment) - Secure deployment
- [Monitoring](Monitoring) - Security monitoring
- [Maintenance](Maintenance) - Security updates
