# Entra ID Patterns Skill

## Overview

This skill provides comprehensive patterns and best practices for implementing Azure Entra ID (formerly Azure AD) authentication and authorization in modern applications.

---

## Authentication Flows

### 1. Authorization Code Flow with PKCE (Recommended for SPAs)

```typescript
// MSAL React Configuration
import { PublicClientApplication, Configuration } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage', // More secure than localStorage
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
```

### 2. Client Credentials Flow (Daemon/Service)

```typescript
import { ConfidentialClientApplication } from '@azure/msal-node';

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
  },
});

async function getToken(): Promise<string> {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });
  return result!.accessToken;
}
```

### 3. On-Behalf-Of Flow (API to API)

```typescript
async function getDownstreamToken(userToken: string): Promise<string> {
  const result = await cca.acquireTokenOnBehalfOf({
    oboAssertion: userToken,
    scopes: ['api://downstream-api/.default'],
  });
  return result!.accessToken;
}
```

---

## Token Validation Patterns

### Express.js JWT Middleware

```typescript
import { verify, JwtPayload } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

function getKey(header: any, callback: Function) {
  client.getSigningKey(header.kid, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

export function validateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.substring(7);
  
  verify(token, getKey, {
    algorithms: ['RS256'],
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    audience: clientId,
  }, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded as JwtPayload;
    next();
  });
}
```

---

## Managed Identity Patterns

### DefaultAzureCredential (Recommended)

```typescript
import { DefaultAzureCredential } from '@azure/identity';

// Works in all environments: local dev, Azure, containers
const credential = new DefaultAzureCredential();

// Use with any Azure SDK
const blobClient = new BlobServiceClient(
  'https://myaccount.blob.core.windows.net',
  credential
);
```

### Credential Chain Order

1. EnvironmentCredential (service principals via env vars)
2. WorkloadIdentityCredential (AKS workload identity)
3. ManagedIdentityCredential (Azure resources)
4. AzureCliCredential (local development)
5. AzurePowerShellCredential
6. AzureDeveloperCliCredential

---

## Role-Based Access Control

### App Roles Definition (manifest)

```json
{
  "appRoles": [
    {
      "id": "guid-1",
      "allowedMemberTypes": ["User"],
      "displayName": "Reader",
      "value": "Reader",
      "description": "Can read data"
    },
    {
      "id": "guid-2",
      "allowedMemberTypes": ["User", "Application"],
      "displayName": "Writer",
      "value": "Writer",
      "description": "Can read and write data"
    }
  ]
}
```

### Role Checking Middleware

```typescript
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = req.user?.roles || [];
    const hasRole = allowedRoles.some(role => roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage
app.get('/admin', validateToken, requireRole('Admin'), adminHandler);
```

---

## Multi-Tenant Patterns

### Tenant Validation

```typescript
const allowedTenants = new Set([
  'tenant-id-1',
  'tenant-id-2',
]);

function validateTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.user?.tid;
  
  if (!allowedTenants.has(tenantId)) {
    return res.status(403).json({ error: 'Tenant not authorized' });
  }
  next();
}
```

### Dynamic Tenant Discovery

```typescript
// MSAL config for multi-tenant
const msalConfig = {
  auth: {
    clientId: clientId,
    authority: 'https://login.microsoftonline.com/common', // or 'organizations'
    knownAuthorities: ['login.microsoftonline.com'],
  },
};
```

---

## Security Best Practices

| Practice | Description |
|----------|-------------|
| Use PKCE | Always use PKCE for public clients |
| Short-lived tokens | Configure appropriate token lifetimes |
| Validate all claims | Check iss, aud, exp, nbf, tid |
| Use Managed Identity | Avoid secrets where possible |
| Rotate secrets | If using client secrets, rotate regularly |
| Least privilege | Request minimum required scopes |
| Session storage | Prefer sessionStorage over localStorage |
| HTTPS only | Never transmit tokens over HTTP |

---

## Common Token Claims

| Claim | Description |
|-------|-------------|
| `iss` | Issuer - token authority |
| `sub` | Subject - user identifier |
| `aud` | Audience - intended recipient |
| `exp` | Expiration time |
| `nbf` | Not before time |
| `iat` | Issued at time |
| `tid` | Tenant ID |
| `oid` | Object ID (user/service principal) |
| `roles` | App roles assigned |
| `scp` | Delegated permission scopes |
| `azp` | Authorized party (client ID) |

---

## Related Agents

- @entra-id-specialist - Full implementation guidance
- @keyvault-specialist - Secure secret storage
- @backend-specialist - API implementation

---

## Tags

`authentication` `authorization` `oauth` `oidc` `msal` `jwt` `managed-identity` `azure-ad`
