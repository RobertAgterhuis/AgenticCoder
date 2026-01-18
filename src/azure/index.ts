/**
 * Azure Module
 * @module azure
 * 
 * Provides multi-tenant Azure support including:
 * - Tenant management
 * - Subscription management
 * - Credential management
 * - Token caching
 * - Context switching
 */

export * from './types';
export {
  AzureContextManager,
  getAzureContext,
  getCurrentSubscriptionId,
  getCurrentTenantId,
  getCurrentCredential,
} from './AzureContextManager';
export {
  CredentialCache,
  getCredentialCache,
  resetCredentialCache,
  type CredentialCacheOptions,
} from './CredentialCache';
export {
  CachedCredential,
  createCachedCredential,
} from './CachedCredential';
