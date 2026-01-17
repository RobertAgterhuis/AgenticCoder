# @keyvault-specialist Agent

**Agent ID**: `@keyvault-specialist`  
**Version**: 1.0.0  
**Phase**: 11  
**Classification**: Azure Security Specialist

---

## 🎯 Purpose

Design and implement secrets, keys, and certificates management solutions using Azure Key Vault with focus on security best practices, Managed Identity integration, and zero-trust principles.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | Secrets & Key Management |
| **Primary Technology** | Azure Key Vault, Managed Identity |
| **Input Schema** | `keyvault-specialist.input.schema.json` |
| **Output Schema** | `keyvault-specialist.output.schema.json` |
| **Triggers From** | @azure-architect, @devops-specialist, @entra-id-specialist |
| **Hands Off To** | @bicep-specialist, @networking-specialist |

---

## 🔧 Core Responsibilities

### 1. Key Vault Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Key Vault Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Azure Key Vault                       │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │   Secrets   │ │    Keys     │ │Certificates │        │   │
│  │  │             │ │             │ │             │        │   │
│  │  │ - ConnStrs  │ │ - Encrypt   │ │ - SSL/TLS   │        │   │
│  │  │ - API Keys  │ │ - Sign      │ │ - Client    │        │   │
│  │  │ - Passwords │ │ - Wrap      │ │ - Code Sign │        │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │   │
│  │                                                          │   │
│  │  Access Control:                                         │   │
│  │  ├── RBAC (Recommended)                                 │   │
│  │  └── Access Policies (Legacy)                           │   │
│  │                                                          │   │
│  │  Network Security:                                       │   │
│  │  ├── Private Endpoint                                   │   │
│  │  ├── Service Endpoints                                  │   │
│  │  └── Firewall Rules                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Clients:                                                       │
│  ├── App Service (Managed Identity)                            │
│  ├── Container Apps (Managed Identity)                         │
│  ├── Azure Functions (Managed Identity)                        │
│  ├── AKS (Workload Identity)                                   │
│  └── GitHub Actions (OIDC Federation)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Secrets Management

#### Node.js SDK Usage

```typescript
// Secrets Management with Managed Identity
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const keyVaultName = process.env.KEY_VAULT_NAME;
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;

// Use Managed Identity (no secrets in code!)
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUrl, credential);

// Get a secret
async function getSecret(secretName: string): Promise<string> {
  const secret = await secretClient.getSecret(secretName);
  if (!secret.value) {
    throw new Error(`Secret ${secretName} not found or has no value`);
  }
  return secret.value;
}

// Set a secret with metadata
async function setSecret(
  name: string,
  value: string,
  options?: {
    expiresOn?: Date;
    notBefore?: Date;
    tags?: Record<string, string>;
    contentType?: string;
  }
): Promise<void> {
  await secretClient.setSecret(name, value, {
    expiresOn: options?.expiresOn,
    notBefore: options?.notBefore,
    tags: options?.tags,
    contentType: options?.contentType || 'text/plain',
  });
}

// List all secrets (metadata only)
async function listSecrets(): Promise<string[]> {
  const secrets: string[] = [];
  for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
    secrets.push(secretProperties.name);
  }
  return secrets;
}

// Get secret with specific version
async function getSecretVersion(name: string, version: string): Promise<string> {
  const secret = await secretClient.getSecret(name, { version });
  return secret.value!;
}

// Delete secret (soft delete)
async function deleteSecret(name: string): Promise<void> {
  const poller = await secretClient.beginDeleteSecret(name);
  await poller.pollUntilDone();
}

// Purge deleted secret (permanent)
async function purgeSecret(name: string): Promise<void> {
  await secretClient.purgeDeletedSecret(name);
}
```

#### Secret Caching Pattern

```typescript
// Secret caching to reduce Key Vault calls
interface CachedSecret {
  value: string;
  expiresAt: number;
}

class SecretCache {
  private cache = new Map<string, CachedSecret>();
  private client: SecretClient;
  private ttlMs: number;

  constructor(client: SecretClient, ttlSeconds: number = 300) {
    this.client = client;
    this.ttlMs = ttlSeconds * 1000;
  }

  async getSecret(name: string): Promise<string> {
    const cached = this.cache.get(name);
    
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    const secret = await this.client.getSecret(name);
    
    this.cache.set(name, {
      value: secret.value!,
      expiresAt: Date.now() + this.ttlMs,
    });

    return secret.value!;
  }

  invalidate(name: string): void {
    this.cache.delete(name);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

// Usage
const secretCache = new SecretCache(secretClient, 300); // 5 min cache
const connectionString = await secretCache.getSecret('database-connection');
```

### 3. Key Management

```typescript
// Key Management for Encryption/Signing
import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';

const keyClient = new KeyClient(keyVaultUrl, credential);

// Create RSA key
async function createRsaKey(name: string): Promise<void> {
  await keyClient.createRsaKey(name, {
    keySize: 4096,
    keyOps: ['encrypt', 'decrypt', 'sign', 'verify', 'wrapKey', 'unwrapKey'],
    expiresOn: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    tags: { purpose: 'data-encryption' },
  });
}

// Create EC key for signing
async function createEcKey(name: string): Promise<void> {
  await keyClient.createEcKey(name, {
    curve: 'P-256',
    keyOps: ['sign', 'verify'],
    tags: { purpose: 'jwt-signing' },
  });
}

// Encrypt data
async function encryptData(keyName: string, plaintext: Buffer): Promise<Buffer> {
  const key = await keyClient.getKey(keyName);
  const cryptoClient = new CryptographyClient(key, credential);
  
  const result = await cryptoClient.encrypt('RSA-OAEP', plaintext);
  return Buffer.from(result.result);
}

// Decrypt data
async function decryptData(keyName: string, ciphertext: Buffer): Promise<Buffer> {
  const key = await keyClient.getKey(keyName);
  const cryptoClient = new CryptographyClient(key, credential);
  
  const result = await cryptoClient.decrypt('RSA-OAEP', ciphertext);
  return Buffer.from(result.result);
}

// Sign data
async function signData(keyName: string, data: Buffer): Promise<Buffer> {
  const key = await keyClient.getKey(keyName);
  const cryptoClient = new CryptographyClient(key, credential);
  
  // Hash the data first (SHA-256)
  const hash = crypto.createHash('sha256').update(data).digest();
  
  const result = await cryptoClient.sign('ES256', hash);
  return Buffer.from(result.result);
}

// Verify signature
async function verifySignature(
  keyName: string,
  data: Buffer,
  signature: Buffer
): Promise<boolean> {
  const key = await keyClient.getKey(keyName);
  const cryptoClient = new CryptographyClient(key, credential);
  
  const hash = crypto.createHash('sha256').update(data).digest();
  
  const result = await cryptoClient.verify('ES256', hash, signature);
  return result.result;
}
```

### 4. Certificate Management

```typescript
// Certificate Management
import { CertificateClient } from '@azure/keyvault-certificates';

const certificateClient = new CertificateClient(keyVaultUrl, credential);

// Create self-signed certificate
async function createSelfSignedCertificate(name: string): Promise<void> {
  const poller = await certificateClient.beginCreateCertificate(name, {
    issuerName: 'Self',
    subject: 'CN=myapp.example.com',
    validityInMonths: 12,
    keyType: 'RSA',
    keySize: 2048,
    contentType: 'application/x-pkcs12',
    keyUsage: ['digitalSignature', 'keyEncipherment'],
    extendedKeyUsage: ['1.3.6.1.5.5.7.3.1'], // Server Authentication
  });
  
  await poller.pollUntilDone();
}

// Import existing certificate
async function importCertificate(
  name: string,
  certificatePfx: Buffer,
  password: string
): Promise<void> {
  await certificateClient.importCertificate(name, certificatePfx, {
    password,
    policy: {
      contentType: 'application/x-pkcs12',
      issuerName: 'Unknown',
    },
  });
}

// Get certificate for use
async function getCertificateWithPrivateKey(name: string): Promise<{
  certificate: Buffer;
  privateKey: Buffer;
}> {
  const certificate = await certificateClient.getCertificate(name);
  
  // Get the secret (contains PFX with private key)
  const secretName = certificate.properties.name;
  const secret = await secretClient.getSecret(secretName!);
  
  // Decode base64 PFX
  const pfxBuffer = Buffer.from(secret.value!, 'base64');
  
  return {
    certificate: Buffer.from(certificate.cer!),
    privateKey: pfxBuffer, // PFX contains private key
  };
}
```

### 5. Bicep Templates

```bicep
// Key Vault with Private Endpoint and RBAC
@description('Key Vault name')
param keyVaultName string

@description('Location')
param location string = resourceGroup().location

@description('Virtual Network ID for private endpoint')
param vnetId string

@description('Subnet ID for private endpoint')
param subnetId string

@description('Principal IDs that need Key Vault access')
param secretsUserPrincipalIds array = []

@description('Principal IDs that need Key Vault admin access')
param adminPrincipalIds array = []

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard' // or 'premium' for HSM
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true // Use RBAC instead of access policies
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true // Prevent permanent deletion
    publicNetworkAccess: 'Disabled' // Require private endpoint
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    }
  }
}

// Private Endpoint
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'pe-${keyVaultName}'
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'keyVaultConnection'
        properties: {
          privateLinkServiceId: keyVault.id
          groupIds: ['vault']
        }
      }
    ]
  }
}

// Private DNS Zone
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.vaultcore.azure.net'
  location: 'global'
}

// DNS Zone Link
resource privateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'link-${uniqueString(vnetId)}'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// DNS A Record
resource privateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = {
  parent: privateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config'
        properties: {
          privateDnsZoneId: privateDnsZone.id
        }
      }
    ]
  }
}

// RBAC: Key Vault Secrets User (read secrets)
resource secretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in secretsUserPrincipalIds: {
  scope: keyVault
  name: guid(keyVault.id, principalId, 'Key Vault Secrets User')
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6' // Key Vault Secrets User
    )
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}]

// RBAC: Key Vault Administrator
resource adminRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in adminPrincipalIds: {
  scope: keyVault
  name: guid(keyVault.id, principalId, 'Key Vault Administrator')
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '00482a5a-887f-4fb3-b363-3b7fe8e74483' // Key Vault Administrator
    )
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}]

// Diagnostic Settings
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'audit'
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        category: 'AuditEvent'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 365
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
```

### 6. Secret Rotation Pattern

```typescript
// Automatic Secret Rotation using Azure Functions
import { AzureFunction, Context } from '@azure/functions';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const rotateSecret: AzureFunction = async function (context: Context): Promise<void> {
  const secretClient = new SecretClient(
    process.env.KEY_VAULT_URL!,
    new DefaultAzureCredential()
  );

  const secretName = context.bindings.eventGridEvent.subject.split('/').pop();
  
  // Check if this is a rotation event
  if (context.bindings.eventGridEvent.eventType !== 'Microsoft.KeyVault.SecretNearExpiry') {
    return;
  }

  context.log(`Rotating secret: ${secretName}`);

  try {
    // Generate new secret value (implementation depends on secret type)
    const newValue = await generateNewSecretValue(secretName);
    
    // Set new version
    await secretClient.setSecret(secretName, newValue, {
      expiresOn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      tags: {
        rotatedAt: new Date().toISOString(),
        rotatedBy: 'automation',
      },
    });

    // Update dependent services (e.g., App Service configuration)
    await updateDependentServices(secretName);

    context.log(`Successfully rotated secret: ${secretName}`);
  } catch (error) {
    context.log.error(`Failed to rotate secret: ${secretName}`, error);
    throw error;
  }
};

async function generateNewSecretValue(secretName: string): Promise<string> {
  // Logic depends on secret type
  if (secretName.includes('database')) {
    // Rotate database password
    return await rotateDatabasePassword();
  }
  
  if (secretName.includes('api-key')) {
    // Generate new API key
    return crypto.randomBytes(32).toString('hex');
  }
  
  throw new Error(`Unknown secret type: ${secretName}`);
}

export default rotateSecret;
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @azure-architect | Secrets management required |
| @devops-specialist | CI/CD secrets needed |
| @entra-id-specialist | Service credentials needed |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @bicep-specialist | Deploy Key Vault infrastructure |
| @networking-specialist | Private endpoint configuration |

---

## 📋 Key Vault RBAC Roles

| Role | Description | Use Case |
|------|-------------|----------|
| Key Vault Administrator | Full access | DevOps, admins |
| Key Vault Secrets User | Read secrets | Applications |
| Key Vault Secrets Officer | Manage secrets | Secret rotation |
| Key Vault Crypto User | Crypto operations | Encryption services |
| Key Vault Certificates Officer | Manage certificates | Certificate renewal |

---

## 📚 Related Skills

- [keyvault-patterns.skill.md](../skills/keyvault-patterns.skill.md)
- [entra-id-patterns.skill.md](../skills/entra-id-patterns.skill.md)

---

## 🏷️ Tags

`keyvault` `secrets` `keys` `certificates` `security` `managed-identity` `encryption` `azure`
