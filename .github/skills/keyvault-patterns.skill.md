# Key Vault Patterns Skill

## Overview

This skill provides comprehensive patterns and best practices for Azure Key Vault secrets, keys, and certificates management with focus on security and operational excellence.

---

## Secret Management Patterns

### 1. Basic Secret Retrieval with Caching

```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

class SecretCache {
  private cache = new Map<string, { value: string; expiry: number }>();
  private client: SecretClient;
  private cacheDurationMs: number;

  constructor(vaultUrl: string, cacheDurationMs = 300000) { // 5 min default
    this.client = new SecretClient(vaultUrl, new DefaultAzureCredential());
    this.cacheDurationMs = cacheDurationMs;
  }

  async getSecret(name: string): Promise<string> {
    const cached = this.cache.get(name);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    const secret = await this.client.getSecret(name);
    this.cache.set(name, {
      value: secret.value!,
      expiry: Date.now() + this.cacheDurationMs,
    });
    return secret.value!;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const secretCache = new SecretCache(process.env.VAULT_URL!);
```

### 2. Bulk Secret Loading at Startup

```typescript
interface AppSecrets {
  dbConnectionString: string;
  apiKey: string;
  jwtSecret: string;
}

async function loadSecrets(): Promise<AppSecrets> {
  const client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  
  const [dbSecret, apiKeySecret, jwtSecret] = await Promise.all([
    client.getSecret('db-connection-string'),
    client.getSecret('api-key'),
    client.getSecret('jwt-secret'),
  ]);

  return {
    dbConnectionString: dbSecret.value!,
    apiKey: apiKeySecret.value!,
    jwtSecret: jwtSecret.value!,
  };
}

// Load at startup
export const secrets = await loadSecrets();
```

---

## Key Management Patterns

### 1. Encryption/Decryption

```typescript
import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';
import { DefaultAzureCredential } from '@azure/identity';

class EncryptionService {
  private cryptoClient: CryptographyClient;

  constructor(vaultUrl: string, keyName: string) {
    const credential = new DefaultAzureCredential();
    const keyClient = new KeyClient(vaultUrl, credential);
    // Get key reference for crypto operations
    this.cryptoClient = new CryptographyClient(
      `${vaultUrl}/keys/${keyName}`,
      credential
    );
  }

  async encrypt(plaintext: string): Promise<string> {
    const result = await this.cryptoClient.encrypt('RSA-OAEP', Buffer.from(plaintext));
    return Buffer.from(result.result).toString('base64');
  }

  async decrypt(ciphertext: string): Promise<string> {
    const result = await this.cryptoClient.decrypt(
      'RSA-OAEP',
      Buffer.from(ciphertext, 'base64')
    );
    return Buffer.from(result.result).toString('utf8');
  }
}
```

### 2. Data Signing

```typescript
async function signData(data: string): Promise<string> {
  const hash = crypto.createHash('sha256').update(data).digest();
  const result = await cryptoClient.sign('RS256', hash);
  return Buffer.from(result.result).toString('base64');
}

async function verifySignature(data: string, signature: string): Promise<boolean> {
  const hash = crypto.createHash('sha256').update(data).digest();
  const result = await cryptoClient.verify(
    'RS256',
    hash,
    Buffer.from(signature, 'base64')
  );
  return result.result;
}
```

---

## Certificate Management Patterns

### 1. Certificate Retrieval

```typescript
import { CertificateClient } from '@azure/keyvault-certificates';

const certClient = new CertificateClient(vaultUrl, new DefaultAzureCredential());

async function getCertificateWithPrivateKey(certName: string) {
  // Get certificate (public part)
  const cert = await certClient.getCertificate(certName);
  
  // Get secret (which contains the PFX/PEM with private key)
  const secretClient = new SecretClient(vaultUrl, new DefaultAzureCredential());
  const secret = await secretClient.getSecret(certName);
  
  return {
    certificate: cert,
    privateKeyPem: secret.value, // Base64 encoded PFX/PEM
  };
}
```

### 2. Certificate Creation

```typescript
async function createSelfSignedCert(name: string, subject: string) {
  const policy = {
    issuerName: 'Self',
    subject: subject,
    x509CertificateProperties: {
      validityInMonths: 12,
    },
    keyProperties: {
      keyType: 'RSA',
      keySize: 2048,
      reuseKey: false,
    },
  };

  const poller = await certClient.beginCreateCertificate(name, policy);
  return await poller.pollUntilDone();
}
```

---

## Secret Rotation Pattern

### Azure Function for Rotation

```typescript
// Triggered by Event Grid when secret nears expiry
import { AzureFunction, Context } from '@azure/functions';
import { SecretClient } from '@azure/keyvault-secrets';

const rotationHandler: AzureFunction = async function (
  context: Context,
  eventGridEvent: any
): Promise<void> {
  const secretName = eventGridEvent.subject.split('/').pop();
  
  // Generate new secret value
  const newValue = await generateNewSecret(secretName);
  
  // Update in Key Vault
  const client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  await client.setSecret(secretName, newValue);
  
  // Update dependent services
  await updateDependentServices(secretName, newValue);
  
  context.log(`Rotated secret: ${secretName}`);
};

async function generateNewSecret(name: string): Promise<string> {
  // Logic depends on secret type
  if (name.includes('db-password')) {
    return generateStrongPassword();
  }
  if (name.includes('api-key')) {
    return crypto.randomBytes(32).toString('hex');
  }
  throw new Error(`Unknown secret type: ${name}`);
}
```

---

## Access Control Patterns

### RBAC Role Assignments

| Role | Secrets | Keys | Certificates |
|------|---------|------|--------------|
| Key Vault Reader | List | List | List |
| Key Vault Secrets User | Get, List | - | - |
| Key Vault Secrets Officer | Full | - | - |
| Key Vault Crypto User | - | Encrypt, Decrypt, Sign, Verify | - |
| Key Vault Certificates Officer | - | - | Full |
| Key Vault Administrator | Full | Full | Full |

### Bicep Role Assignment

```bicep
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, principalId, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    principalId: principalId
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6' // Key Vault Secrets User
    )
    principalType: 'ServicePrincipal'
  }
}
```

---

## Security Best Practices

| Practice | Description |
|----------|-------------|
| Use RBAC | Prefer Azure RBAC over vault access policies |
| Private Endpoints | Always use private endpoints in production |
| Soft Delete | Enable soft delete and purge protection |
| Diagnostic Logging | Log all access to Log Analytics |
| Managed Identity | Use managed identity instead of credentials |
| Cache Secrets | Cache locally to reduce calls and latency |
| Secret Versioning | Use versions for rotation without downtime |
| Key Rotation | Implement automatic key rotation |

---

## Networking Configuration

### Private Endpoint DNS Zones

| Service | Private DNS Zone |
|---------|-----------------|
| Key Vault | `privatelink.vaultcore.azure.net` |

---

## Monitoring KQL Queries

```kusto
// Failed secret access attempts
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.KEYVAULT"
| where ResultType != "Success"
| project TimeGenerated, OperationName, ResultType, CallerIPAddress, identity_claim_upn_s
| order by TimeGenerated desc

// Most accessed secrets
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.KEYVAULT"
| where OperationName == "SecretGet"
| summarize count() by id_s
| top 10 by count_
```

---

## Related Agents

- @keyvault-specialist - Full implementation guidance
- @entra-id-specialist - Identity integration
- @bicep-specialist - Infrastructure deployment

---

## Tags

`keyvault` `secrets` `keys` `certificates` `encryption` `rotation` `security` `azure`
