/**
 * Secrets Management Module
 * @module security/secrets
 */

export { SecretsManager, SecretsProvider, Secret, SecretMetadata, SecretsProviderOptions } from './SecretsManager';
export { AzureKeyVaultProvider, AzureKeyVaultConfig } from './providers/AzureKeyVaultProvider';
export { LocalSecretsProvider, LocalSecretsConfig } from './providers/LocalSecretsProvider';
export { EnvironmentProvider, EnvironmentProviderConfig } from './providers/EnvironmentProvider';
export { SecretDetector, DetectionResult, SecretMatch, SecretPattern } from './detection/SecretDetector';

import { SecretsManager } from './SecretsManager';
import { AzureKeyVaultProvider } from './providers/AzureKeyVaultProvider';
import { LocalSecretsProvider } from './providers/LocalSecretsProvider';
import { EnvironmentProvider } from './providers/EnvironmentProvider';
import { SecretDetector } from './detection/SecretDetector';

/**
 * Create a pre-configured SecretsManager with common providers
 */
export function createSecretsManager(options?: {
  keyVaultUrl?: string;
  localStorePath?: string;
  envPrefix?: string;
}): SecretsManager {
  const manager = new SecretsManager();

  // Register environment provider (lowest priority, always available)
  manager.registerProvider(new EnvironmentProvider({
    prefix: options?.envPrefix || 'AGENTIC_',
  }));

  // Register local encrypted storage
  if (options?.localStorePath) {
    manager.registerProvider(new LocalSecretsProvider({
      storePath: options.localStorePath,
    }));
  }

  // Register Azure Key Vault (highest priority)
  if (options?.keyVaultUrl) {
    manager.registerProvider(new AzureKeyVaultProvider({
      vaultUrl: options.keyVaultUrl,
      useManagedIdentity: true,
    }));
  }

  return manager;
}

export { createSecretsManager as default };
