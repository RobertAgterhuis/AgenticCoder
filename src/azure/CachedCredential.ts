/**
 * CachedCredential - Credential wrapper with automatic caching
 * @module azure/CachedCredential
 */

import {
  TokenCredential,
  AccessToken,
  GetTokenOptions,
} from '@azure/identity';
import { CredentialCache, getCredentialCache } from './CredentialCache';

/**
 * Wraps a TokenCredential with automatic token caching
 */
export class CachedCredential implements TokenCredential {
  private innerCredential: TokenCredential;
  private tenantId: string;
  private cache: CredentialCache;

  constructor(
    innerCredential: TokenCredential,
    tenantId: string,
    cache?: CredentialCache
  ) {
    this.innerCredential = innerCredential;
    this.tenantId = tenantId;
    this.cache = cache || getCredentialCache({ persist: true });
  }

  /**
   * Get token (from cache if available, otherwise fetch and cache)
   */
  async getToken(
    scopes: string | string[],
    options?: GetTokenOptions
  ): Promise<AccessToken> {
    const scopeArray = Array.isArray(scopes) ? scopes : [scopes];

    // Try cache first
    const cached = await this.cache.get(this.tenantId, scopeArray);
    if (cached) {
      return cached;
    }

    // Get fresh token from inner credential
    const token = await this.innerCredential.getToken(scopes, options);
    
    if (!token) {
      throw new Error('Failed to acquire token');
    }

    // Cache the token
    await this.cache.set(this.tenantId, scopeArray, token);

    return token;
  }

  /**
   * Clear cached tokens for this credential's tenant
   */
  async clearCache(): Promise<void> {
    await this.cache.clearTenant(this.tenantId);
  }

  /**
   * Get the tenant ID this credential is associated with
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Get the inner (unwrapped) credential
   */
  getInnerCredential(): TokenCredential {
    return this.innerCredential;
  }
}

/**
 * Create a cached credential wrapper
 */
export function createCachedCredential(
  credential: TokenCredential,
  tenantId: string,
  cache?: CredentialCache
): CachedCredential {
  return new CachedCredential(credential, tenantId, cache);
}
