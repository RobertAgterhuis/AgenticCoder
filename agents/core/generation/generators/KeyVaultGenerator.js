/**
 * KeyVaultGenerator - Azure Key Vault Generator
 * 
 * Generates Key Vault configurations, secret management code,
 * and certificate handling utilities.
 */

const BaseGenerator = require('./BaseGenerator');

class KeyVaultGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'KeyVaultGenerator',
      framework: 'azure-keyvault',
      version: 'latest',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'azure/keyvault';
    this.supportedTypes = ['secretClient', 'keyClient', 'certificateClient', 'config'];
  }

  /**
   * Generate secret management client
   */
  async generateSecretClient(context) {
    const { 
      language = 'typescript',
      vaultName,
      useManagedIdentity = true,
      secrets = []
    } = context;
    
    const templateData = {
      vaultName,
      vaultUrl: `https://${vaultName}.vault.azure.net`,
      useManagedIdentity,
      secrets
    };
    
    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.generateTsSecretClient(templateData);
      case 'python':
        return this.generatePySecretClient(templateData);
      case 'csharp':
        return this.generateCsSecretClient(templateData);
      default:
        return this.generateTsSecretClient(templateData);
    }
  }

  /**
   * Generate key management client
   */
  async generateKeyClient(context) {
    const { 
      language = 'typescript',
      vaultName,
      keyType = 'RSA',
      keySize = 2048
    } = context;
    
    const templateData = {
      vaultName,
      vaultUrl: `https://${vaultName}.vault.azure.net`,
      keyType,
      keySize
    };
    
    return this.generateTsKeyClient(templateData);
  }

  /**
   * Generate certificate management client
   */
  async generateCertificateClient(context) {
    const { 
      language = 'typescript',
      vaultName,
      issuer = 'Self'
    } = context;
    
    const templateData = {
      vaultName,
      vaultUrl: `https://${vaultName}.vault.azure.net`,
      issuer
    };
    
    return this.generateTsCertificateClient(templateData);
  }

  /**
   * Generate configuration helper
   */
  async generateConfig(context) {
    const { 
      framework = 'express',
      vaultName,
      secrets = []
    } = context;
    
    const templateData = {
      vaultName,
      vaultUrl: `https://${vaultName}.vault.azure.net`,
      secrets: this.buildSecretsConfig(secrets)
    };
    
    return this.generateConfigProvider(templateData, framework);
  }

  // TypeScript/JavaScript generators
  generateTsSecretClient(data) {
    const lines = [];
    
    lines.push(`import { SecretClient } from '@azure/keyvault-secrets';`);
    lines.push(`import { DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';`);
    lines.push('');
    lines.push(`const vaultUrl = process.env.KEY_VAULT_URL || '${data.vaultUrl}';`);
    lines.push('');
    
    if (data.useManagedIdentity) {
      lines.push('// Use Managed Identity in Azure, DefaultAzureCredential for local development');
      lines.push('const credential = process.env.AZURE_CLIENT_ID');
      lines.push('  ? new ManagedIdentityCredential()');
      lines.push('  : new DefaultAzureCredential();');
    } else {
      lines.push('const credential = new DefaultAzureCredential();');
    }
    
    lines.push('');
    lines.push('const secretClient = new SecretClient(vaultUrl, credential);');
    lines.push('');
    lines.push('export class KeyVaultSecretService {');
    lines.push('  private cache: Map<string, { value: string; expiresAt: Date }> = new Map();');
    lines.push('  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Get a secret from Key Vault with caching');
    lines.push('   */');
    lines.push('  async getSecret(name: string, useCache = true): Promise<string | undefined> {');
    lines.push('    if (useCache) {');
    lines.push('      const cached = this.cache.get(name);');
    lines.push('      if (cached && cached.expiresAt > new Date()) {');
    lines.push('        return cached.value;');
    lines.push('      }');
    lines.push('    }');
    lines.push('');
    lines.push('    try {');
    lines.push('      const secret = await secretClient.getSecret(name);');
    lines.push('      const value = secret.value;');
    lines.push('');
    lines.push('      if (value && useCache) {');
    lines.push('        this.cache.set(name, {');
    lines.push('          value,');
    lines.push('          expiresAt: new Date(Date.now() + this.cacheDuration)');
    lines.push('        });');
    lines.push('      }');
    lines.push('');
    lines.push('      return value;');
    lines.push('    } catch (error) {');
    lines.push('      console.error(`Failed to get secret ${name}:`, error);');
    lines.push('      return undefined;');
    lines.push('    }');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Set a secret in Key Vault');
    lines.push('   */');
    lines.push('  async setSecret(name: string, value: string, options?: { expiresOn?: Date; tags?: Record<string, string> }): Promise<void> {');
    lines.push('    await secretClient.setSecret(name, value, {');
    lines.push('      expiresOn: options?.expiresOn,');
    lines.push('      tags: options?.tags');
    lines.push('    });');
    lines.push('    this.cache.delete(name);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Delete a secret from Key Vault');
    lines.push('   */');
    lines.push('  async deleteSecret(name: string): Promise<void> {');
    lines.push('    const poller = await secretClient.beginDeleteSecret(name);');
    lines.push('    await poller.pollUntilDone();');
    lines.push('    this.cache.delete(name);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * List all secrets (names only)');
    lines.push('   */');
    lines.push('  async listSecrets(): Promise<string[]> {');
    lines.push('    const names: string[] = [];');
    lines.push('    for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {');
    lines.push('      names.push(secretProperties.name);');
    lines.push('    }');
    lines.push('    return names;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Clear the cache');
    lines.push('   */');
    lines.push('  clearCache(): void {');
    lines.push('    this.cache.clear();');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('export const keyVaultSecretService = new KeyVaultSecretService();');
    
    return lines.join('\n');
  }

  generateTsKeyClient(data) {
    const lines = [];
    
    lines.push(`import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';`);
    lines.push(`import { DefaultAzureCredential } from '@azure/identity';`);
    lines.push('');
    lines.push(`const vaultUrl = process.env.KEY_VAULT_URL || '${data.vaultUrl}';`);
    lines.push('const credential = new DefaultAzureCredential();');
    lines.push('const keyClient = new KeyClient(vaultUrl, credential);');
    lines.push('');
    lines.push('export class KeyVaultKeyService {');
    lines.push('  /**');
    lines.push('   * Create a new cryptographic key');
    lines.push('   */');
    lines.push(`  async createKey(name: string, keyType: 'RSA' | 'EC' = '${data.keyType}', keySize = ${data.keySize}): Promise<void> {`);
    lines.push("    if (keyType === 'RSA') {");
    lines.push('      await keyClient.createRsaKey(name, { keySize });');
    lines.push('    } else {');
    lines.push("      await keyClient.createEcKey(name, { curve: 'P-256' });");
    lines.push('    }');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Get a key from Key Vault');
    lines.push('   */');
    lines.push('  async getKey(name: string) {');
    lines.push('    return await keyClient.getKey(name);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Encrypt data using a key');
    lines.push('   */');
    lines.push('  async encrypt(keyName: string, plaintext: Uint8Array): Promise<Uint8Array> {');
    lines.push('    const key = await keyClient.getKey(keyName);');
    lines.push('    const cryptoClient = new CryptographyClient(key, credential);');
    lines.push("    const result = await cryptoClient.encrypt('RSA-OAEP', plaintext);");
    lines.push('    return result.result;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Decrypt data using a key');
    lines.push('   */');
    lines.push('  async decrypt(keyName: string, ciphertext: Uint8Array): Promise<Uint8Array> {');
    lines.push('    const key = await keyClient.getKey(keyName);');
    lines.push('    const cryptoClient = new CryptographyClient(key, credential);');
    lines.push("    const result = await cryptoClient.decrypt('RSA-OAEP', ciphertext);");
    lines.push('    return result.result;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Sign data using a key');
    lines.push('   */');
    lines.push('  async sign(keyName: string, digest: Uint8Array): Promise<Uint8Array> {');
    lines.push('    const key = await keyClient.getKey(keyName);');
    lines.push('    const cryptoClient = new CryptographyClient(key, credential);');
    lines.push("    const result = await cryptoClient.sign('RS256', digest);");
    lines.push('    return result.result;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Verify a signature');
    lines.push('   */');
    lines.push('  async verify(keyName: string, digest: Uint8Array, signature: Uint8Array): Promise<boolean> {');
    lines.push('    const key = await keyClient.getKey(keyName);');
    lines.push('    const cryptoClient = new CryptographyClient(key, credential);');
    lines.push("    const result = await cryptoClient.verify('RS256', digest, signature);");
    lines.push('    return result.result;');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('export const keyVaultKeyService = new KeyVaultKeyService();');
    
    return lines.join('\n');
  }

  generateTsCertificateClient(data) {
    const lines = [];
    
    lines.push(`import { CertificateClient } from '@azure/keyvault-certificates';`);
    lines.push(`import { DefaultAzureCredential } from '@azure/identity';`);
    lines.push('');
    lines.push(`const vaultUrl = process.env.KEY_VAULT_URL || '${data.vaultUrl}';`);
    lines.push('const credential = new DefaultAzureCredential();');
    lines.push('const certificateClient = new CertificateClient(vaultUrl, credential);');
    lines.push('');
    lines.push('export class KeyVaultCertificateService {');
    lines.push('  /**');
    lines.push('   * Create a self-signed certificate');
    lines.push('   */');
    lines.push('  async createCertificate(');
    lines.push('    name: string,');
    lines.push('    subject: string,');
    lines.push('    validityInMonths = 12');
    lines.push('  ): Promise<void> {');
    lines.push('    const poller = await certificateClient.beginCreateCertificate(name, {');
    lines.push(`      issuerName: '${data.issuer}',`);
    lines.push('      subject,');
    lines.push('      validityInMonths');
    lines.push('    });');
    lines.push('    await poller.pollUntilDone();');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Get a certificate');
    lines.push('   */');
    lines.push('  async getCertificate(name: string) {');
    lines.push('    return await certificateClient.getCertificate(name);');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * List all certificates');
    lines.push('   */');
    lines.push('  async listCertificates(): Promise<string[]> {');
    lines.push('    const names: string[] = [];');
    lines.push('    for await (const cert of certificateClient.listPropertiesOfCertificates()) {');
    lines.push('      names.push(cert.name);');
    lines.push('    }');
    lines.push('    return names;');
    lines.push('  }');
    lines.push('');
    lines.push('  /**');
    lines.push('   * Delete a certificate');
    lines.push('   */');
    lines.push('  async deleteCertificate(name: string): Promise<void> {');
    lines.push('    const poller = await certificateClient.beginDeleteCertificate(name);');
    lines.push('    await poller.pollUntilDone();');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('export const keyVaultCertificateService = new KeyVaultCertificateService();');
    
    return lines.join('\n');
  }

  // Python generator
  generatePySecretClient(data) {
    const lines = [];
    
    lines.push('import os');
    lines.push('from datetime import datetime, timedelta');
    lines.push('from typing import Optional, Dict, List');
    lines.push('from azure.identity import DefaultAzureCredential, ManagedIdentityCredential');
    lines.push('from azure.keyvault.secrets import SecretClient');
    lines.push('');
    lines.push(`VAULT_URL = os.environ.get('KEY_VAULT_URL', '${data.vaultUrl}')`);
    lines.push('');
    lines.push('# Use Managed Identity in Azure, DefaultAzureCredential for local development');
    lines.push("credential = ManagedIdentityCredential() if os.environ.get('AZURE_CLIENT_ID') else DefaultAzureCredential()");
    lines.push('secret_client = SecretClient(vault_url=VAULT_URL, credential=credential)');
    lines.push('');
    lines.push('class KeyVaultSecretService:');
    lines.push('    """Service for managing Azure Key Vault secrets"""');
    lines.push('');
    lines.push('    def __init__(self):');
    lines.push('        self._cache: Dict[str, tuple[str, datetime]] = {}');
    lines.push('        self._cache_duration = timedelta(minutes=5)');
    lines.push('');
    lines.push('    def get_secret(self, name: str, use_cache: bool = True) -> Optional[str]:');
    lines.push('        """Get a secret from Key Vault with optional caching"""');
    lines.push('        if use_cache and name in self._cache:');
    lines.push('            value, expires_at = self._cache[name]');
    lines.push('            if expires_at > datetime.now():');
    lines.push('                return value');
    lines.push('');
    lines.push('        try:');
    lines.push('            secret = secret_client.get_secret(name)');
    lines.push('            value = secret.value');
    lines.push('');
    lines.push('            if value and use_cache:');
    lines.push('                self._cache[name] = (value, datetime.now() + self._cache_duration)');
    lines.push('');
    lines.push('            return value');
    lines.push('        except Exception as e:');
    lines.push("            print(f'Failed to get secret {name}: {e}')");
    lines.push('            return None');
    lines.push('');
    lines.push('    def set_secret(self, name: str, value: str, expires_on: Optional[datetime] = None) -> None:');
    lines.push('        """Set a secret in Key Vault"""');
    lines.push('        secret_client.set_secret(name, value, expires_on=expires_on)');
    lines.push('        if name in self._cache:');
    lines.push('            del self._cache[name]');
    lines.push('');
    lines.push('    def delete_secret(self, name: str) -> None:');
    lines.push('        """Delete a secret from Key Vault"""');
    lines.push('        poller = secret_client.begin_delete_secret(name)');
    lines.push('        poller.wait()');
    lines.push('        if name in self._cache:');
    lines.push('            del self._cache[name]');
    lines.push('');
    lines.push('    def list_secrets(self) -> List[str]:');
    lines.push('        """List all secret names"""');
    lines.push('        return [s.name for s in secret_client.list_properties_of_secrets()]');
    lines.push('');
    lines.push('    def clear_cache(self) -> None:');
    lines.push('        """Clear the secret cache"""');
    lines.push('        self._cache.clear()');
    lines.push('');
    lines.push('');
    lines.push('key_vault_secret_service = KeyVaultSecretService()');
    
    return lines.join('\n');
  }

  // C# generator
  generateCsSecretClient(data) {
    const lines = [];
    
    lines.push('using Azure.Identity;');
    lines.push('using Azure.Security.KeyVault.Secrets;');
    lines.push('using Microsoft.Extensions.Caching.Memory;');
    lines.push('');
    lines.push('namespace Services;');
    lines.push('');
    lines.push('public class KeyVaultSecretService');
    lines.push('{');
    lines.push('    private readonly SecretClient _secretClient;');
    lines.push('    private readonly IMemoryCache _cache;');
    lines.push('    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);');
    lines.push('');
    lines.push('    public KeyVaultSecretService(IMemoryCache cache)');
    lines.push('    {');
    lines.push('        _cache = cache;');
    lines.push(`        var vaultUrl = Environment.GetEnvironmentVariable("KEY_VAULT_URL") ?? "${data.vaultUrl}";`);
    lines.push('        _secretClient = new SecretClient(new Uri(vaultUrl), new DefaultAzureCredential());');
    lines.push('    }');
    lines.push('');
    lines.push('    public async Task<string?> GetSecretAsync(string name, bool useCache = true)');
    lines.push('    {');
    lines.push('        if (useCache && _cache.TryGetValue(name, out string? cachedValue))');
    lines.push('        {');
    lines.push('            return cachedValue;');
    lines.push('        }');
    lines.push('');
    lines.push('        try');
    lines.push('        {');
    lines.push('            var secret = await _secretClient.GetSecretAsync(name);');
    lines.push('            var value = secret.Value.Value;');
    lines.push('');
    lines.push('            if (!string.IsNullOrEmpty(value) && useCache)');
    lines.push('            {');
    lines.push('                _cache.Set(name, value, _cacheDuration);');
    lines.push('            }');
    lines.push('');
    lines.push('            return value;');
    lines.push('        }');
    lines.push('        catch (Exception ex)');
    lines.push('        {');
    lines.push('            Console.WriteLine($"Failed to get secret {name}: {ex.Message}");');
    lines.push('            return null;');
    lines.push('        }');
    lines.push('    }');
    lines.push('');
    lines.push('    public async Task SetSecretAsync(string name, string value)');
    lines.push('    {');
    lines.push('        await _secretClient.SetSecretAsync(name, value);');
    lines.push('        _cache.Remove(name);');
    lines.push('    }');
    lines.push('');
    lines.push('    public async Task DeleteSecretAsync(string name)');
    lines.push('    {');
    lines.push('        var operation = await _secretClient.StartDeleteSecretAsync(name);');
    lines.push('        await operation.WaitForCompletionAsync();');
    lines.push('        _cache.Remove(name);');
    lines.push('    }');
    lines.push('}');
    
    return lines.join('\n');
  }

  generateConfigProvider(data, framework) {
    const lines = [];
    
    lines.push(`import { keyVaultSecretService } from './KeyVaultSecretService';`);
    lines.push('');
    lines.push('export interface AppConfig {');
    
    for (const secret of data.secrets) {
      lines.push(`  ${secret.name}: string;`);
    }
    
    lines.push('}');
    lines.push('');
    lines.push('let configCache: AppConfig | null = null;');
    lines.push('');
    lines.push('export async function loadConfig(): Promise<AppConfig> {');
    lines.push('  if (configCache) return configCache;');
    lines.push('');
    lines.push('  const config: AppConfig = {');
    
    for (const secret of data.secrets) {
      lines.push(`    ${secret.name}: await keyVaultSecretService.getSecret('${secret.keyVaultName || secret.name}') || '${secret.default || ''}',`);
    }
    
    lines.push('  };');
    lines.push('');
    lines.push('  configCache = config;');
    lines.push('  return config;');
    lines.push('}');
    lines.push('');
    lines.push('export function clearConfigCache(): void {');
    lines.push('  configCache = null;');
    lines.push('  keyVaultSecretService.clearCache();');
    lines.push('}');
    
    return lines.join('\n');
  }

  buildSecretsConfig(secrets) {
    return secrets.map(s => ({
      name: this.toCamelCase(s.name || s),
      keyVaultName: s.keyVaultName || this.toKebabCase(s.name || s),
      default: s.default || ''
    }));
  }
}

module.exports = KeyVaultGenerator;
