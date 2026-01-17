# @entra-id-specialist Agent

**Agent ID**: `@entra-id-specialist`  
**Version**: 1.0.0  
**Phase**: 11  
**Classification**: Azure Identity Specialist

---

## 🎯 Purpose

Design and implement identity and access management solutions using Microsoft Entra ID (Azure AD), including authentication flows, authorization patterns, and enterprise identity scenarios.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | Identity & Access Management |
| **Primary Technology** | Microsoft Entra ID, OAuth 2.0, OIDC, MSAL |
| **Input Schema** | `entra-id-specialist.input.schema.json` |
| **Output Schema** | `entra-id-specialist.output.schema.json` |
| **Triggers From** | @azure-architect, @backend-specialist, @frontend-specialist |
| **Hands Off To** | @bicep-specialist, @devops-specialist, @keyvault-specialist |

---

## 🔧 Core Responsibilities

### 1. Authentication Flows

#### OAuth 2.0 / OpenID Connect Flows

```
┌─────────────────────────────────────────────────────────────────┐
│               OAuth 2.0 Flow Selection Guide                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Authorization Code + PKCE (Frontend SPAs)                      │
│  ├── User authentication                                        │
│  ├── Access tokens for APIs                                     │
│  └── Refresh tokens for silent renewal                          │
│                                                                  │
│  Client Credentials (Backend Services)                          │
│  ├── Service-to-service communication                           │
│  ├── No user context                                            │
│  └── Application permissions only                               │
│                                                                  │
│  On-Behalf-Of (API-to-API with user context)                    │
│  ├── Downstream API calls                                       │
│  ├── Preserves user identity                                    │
│  └── Delegated permissions                                      │
│                                                                  │
│  Device Code (CLI/IoT)                                          │
│  ├── Devices without browser                                    │
│  ├── User authenticates on separate device                      │
│  └── Polling for token                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Authorization Code Flow with PKCE

```typescript
// Frontend - MSAL.js v2 Configuration
import { PublicClientApplication, Configuration } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.VITE_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage', // More secure than localStorage
    storeAuthStateInCookie: false,
    secureCookies: true,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
await msalInstance.initialize();

// Handle redirect response
const response = await msalInstance.handleRedirectPromise();
if (response) {
  // User just logged in
  console.log('Login successful', response.account);
}

// Login request
const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'api://my-api/access_as_user'],
};

// Interactive login
async function login(): Promise<void> {
  try {
    await msalInstance.loginRedirect(loginRequest);
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Acquire token silently (with automatic refresh)
async function getAccessToken(): Promise<string> {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    throw new Error('No accounts found');
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: ['api://my-api/access_as_user'],
      account: accounts[0],
    });
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Token expired, need interactive login
      await msalInstance.acquireTokenRedirect({
        scopes: ['api://my-api/access_as_user'],
      });
    }
    throw error;
  }
}

// API call with token
async function callApi<T>(url: string): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
```

#### Client Credentials Flow (Service-to-Service)

```typescript
// Backend Service - MSAL Node
import { ConfidentialClientApplication } from '@azure/msal-node';

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    // Or use certificate:
    // clientCertificate: {
    //   thumbprint: process.env.CERT_THUMBPRINT,
    //   privateKey: fs.readFileSync('cert.pem', 'utf8'),
    // },
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

async function getTokenForDownstreamApi(): Promise<string> {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ['api://downstream-api/.default'],
  });
  
  if (!result) {
    throw new Error('Failed to acquire token');
  }
  
  return result.accessToken;
}
```

#### On-Behalf-Of Flow (API-to-API)

```typescript
// Middle-tier API calling downstream API
import { ConfidentialClientApplication, OnBehalfOfRequest } from '@azure/msal-node';

async function callDownstreamApi(userAccessToken: string): Promise<any> {
  const oboRequest: OnBehalfOfRequest = {
    oboAssertion: userAccessToken, // Token from incoming request
    scopes: ['api://downstream-api/access_as_user'],
  };

  const result = await cca.acquireTokenOnBehalfOf(oboRequest);
  
  // Call downstream API with new token
  const response = await fetch('https://downstream-api/data', {
    headers: {
      Authorization: `Bearer ${result.accessToken}`,
    },
  });
  
  return response.json();
}
```

### 2. JWT Token Validation

```typescript
// Express.js Middleware for JWT Validation
import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

const tenantId = process.env.AZURE_TENANT_ID;
const audience = process.env.API_AUDIENCE; // api://your-client-id

// JWT validation middleware
export const validateJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
  }),
  audience: audience,
  issuer: [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`,
  ],
  algorithms: ['RS256'],
});

// Extended request type with auth info
interface AuthRequest extends Request {
  auth?: {
    sub: string;
    oid: string;
    name: string;
    email: string;
    roles?: string[];
    groups?: string[];
    scp?: string; // Scopes (delegated permissions)
  };
}

// Role-based authorization middleware
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRoles = req.auth?.roles || [];
    
    const hasRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required roles: ${allowedRoles.join(', ')}`,
      });
    }
    
    next();
  };
};

// Scope-based authorization middleware
export const requireScope = (...requiredScopes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const tokenScopes = req.auth?.scp?.split(' ') || [];
    
    const hasScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
    
    if (!hasScopes) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required scopes: ${requiredScopes.join(', ')}`,
      });
    }
    
    next();
  };
};

// Usage
app.get('/api/admin', validateJwt, requireRole('Admin'), adminHandler);
app.get('/api/data', validateJwt, requireScope('Data.Read'), dataHandler);
```

### 3. Application Registration

#### App Registration Bicep Template

```bicep
// Note: App registrations are typically done via Azure Portal or MS Graph API
// This shows the configuration pattern

/*
Application Registration Configuration:

Single-Page Application (SPA):
{
  "displayName": "My SPA",
  "signInAudience": "AzureADMyOrg",
  "spa": {
    "redirectUris": [
      "http://localhost:3000",
      "https://myapp.azurewebsites.net"
    ]
  },
  "requiredResourceAccess": [
    {
      "resourceAppId": "api://my-backend-api",
      "resourceAccess": [
        {
          "id": "<scope-id>",
          "type": "Scope"
        }
      ]
    }
  ]
}

Backend API:
{
  "displayName": "My API",
  "signInAudience": "AzureADMyOrg",
  "identifierUris": ["api://my-backend-api"],
  "api": {
    "oauth2PermissionScopes": [
      {
        "id": "<guid>",
        "value": "access_as_user",
        "type": "User",
        "adminConsentDisplayName": "Access API as user",
        "userConsentDisplayName": "Access API on your behalf"
      }
    ]
  },
  "appRoles": [
    {
      "id": "<guid>",
      "value": "Admin",
      "displayName": "Administrator",
      "allowedMemberTypes": ["User"]
    },
    {
      "id": "<guid>",
      "value": "Reader",
      "displayName": "Reader",
      "allowedMemberTypes": ["User", "Application"]
    }
  ]
}
*/
```

### 4. Managed Identity Integration

```typescript
// Using Managed Identity (no secrets needed!)
import { DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';

// DefaultAzureCredential automatically uses Managed Identity in Azure
const credential = new DefaultAzureCredential();

// Access Key Vault
const secretClient = new SecretClient(
  `https://${keyVaultName}.vault.azure.net`,
  credential
);
const secret = await secretClient.getSecret('my-secret');

// Access Storage
const blobClient = new BlobServiceClient(
  `https://${storageAccount}.blob.core.windows.net`,
  credential
);

// Access SQL Database
import { Connection } from 'tedious';

const connection = new Connection({
  server: `${sqlServer}.database.windows.net`,
  authentication: {
    type: 'azure-active-directory-msi-app-service',
  },
  options: {
    database: 'mydb',
    encrypt: true,
  },
});
```

### 5. Multi-tenant Applications

```typescript
// Multi-tenant MSAL Configuration
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common', // or 'organizations'
    redirectUri: process.env.REDIRECT_URI,
  },
};

// Validate tenant in token
function validateTenant(req: AuthRequest, allowedTenants: string[]): boolean {
  const tokenTenant = req.auth?.tid;
  return allowedTenants.includes(tokenTenant);
}

// Tenant-specific data isolation
async function getTenantData(req: AuthRequest) {
  const tenantId = req.auth?.tid;
  
  // Use tenant ID for data isolation
  return await db.query(
    'SELECT * FROM data WHERE tenant_id = @tenantId',
    { tenantId }
  );
}
```

### 6. B2C Customer Identity

```typescript
// Azure AD B2C Configuration
const b2cConfig = {
  auth: {
    clientId: process.env.B2C_CLIENT_ID,
    authority: `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/${policyName}`,
    knownAuthorities: [`${tenantName}.b2clogin.com`],
    redirectUri: window.location.origin,
  },
};

// B2C User Flows / Policies
const policies = {
  signUpSignIn: 'B2C_1_signupsignin',
  resetPassword: 'B2C_1_passwordreset',
  editProfile: 'B2C_1_profileedit',
};

// Switch policy
function getAuthorityForPolicy(policy: string): string {
  return `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/${policy}`;
}
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @azure-architect | Identity requirements in architecture |
| @backend-specialist | API authentication needed |
| @frontend-specialist | User authentication needed |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @bicep-specialist | Infrastructure deployment |
| @devops-specialist | CI/CD with OIDC federation |
| @keyvault-specialist | Secrets management needed |

---

## 📋 Authentication Decision Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│              When to Use Which Auth Pattern                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SPA (React/Angular/Vue):                                       │
│  └── MSAL.js with Authorization Code + PKCE                     │
│                                                                  │
│  Server-rendered Web App:                                       │
│  └── MSAL Node with Authorization Code (confidential client)    │
│                                                                  │
│  Background Service/Daemon:                                     │
│  └── Client Credentials with certificate (not secret)           │
│                                                                  │
│  API calling another API (user context):                        │
│  └── On-Behalf-Of flow                                          │
│                                                                  │
│  CLI Tool:                                                       │
│  └── Device Code flow                                           │
│                                                                  │
│  Azure-hosted Service:                                          │
│  └── Managed Identity (no credentials!)                         │
│                                                                  │
│  GitHub Actions:                                                 │
│  └── Workload Identity Federation (OIDC)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Related Skills

- [entra-id-patterns.skill.md](../skills/entra-id-patterns.skill.md)
- [keyvault-patterns.skill.md](../skills/keyvault-patterns.skill.md)

---

## 🏷️ Tags

`entra-id` `azure-ad` `oauth2` `oidc` `msal` `authentication` `authorization` `identity` `rbac` `managed-identity`
