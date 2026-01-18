/**
 * CredentialCache - Secure token caching for Azure credentials
 * @module azure/CredentialCache
 */

import { AccessToken } from '@azure/identity';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Cached token information
 */
interface CachedToken {
  accessToken: string;
  expiresOnTimestamp: number;
  tenantId: string;
  scopes: string[];
  cachedAt: number;
}

/**
 * Encrypted cache entry stored on disk
 */
interface CacheEntry {
  encryptedToken: string;
  iv: string;
  tag: string;
}

/**
 * CredentialCache options
 */
export interface CredentialCacheOptions {
  cacheDir?: string;
  persist?: boolean;
  expirationBufferMs?: number;
}

/**
 * Secure credential cache with optional disk persistence
 */
export class CredentialCache {
  private cache: Map<string, CachedToken>;
  private encryptionKey: Buffer | null = null;
  private cacheDir: string;
  private persistEnabled: boolean;
  private expirationBufferMs: number;

  constructor(options?: CredentialCacheOptions) {
    this.cache = new Map();
    this.cacheDir = options?.cacheDir || path.join(process.cwd(), '.agenticcoder', 'cache', 'credentials');
    this.persistEnabled = options?.persist ?? false;
    this.expirationBufferMs = options?.expirationBufferMs ?? 5 * 60 * 1000; // 5 minutes default
    
    if (this.persistEnabled) {
      this.encryptionKey = this.getOrCreateEncryptionKey();
    }
  }

  /**
   * Get cached token
   */
  async get(tenantId: string, scopes: string[]): Promise<AccessToken | null> {
    const key = this.getCacheKey(tenantId, scopes);
    
    // Check memory cache first
    let cached = this.cache.get(key);
    
    // Try disk cache if not in memory
    if (!cached && this.persistEnabled) {
      const diskCached = await this.loadFromDisk(key);
      if (diskCached) {
        this.cache.set(key, diskCached);
        cached = diskCached;
      }
    }

    if (!cached) return null;

    // Check expiration (with buffer)
    const now = Date.now();
    if (cached.expiresOnTimestamp - this.expirationBufferMs <= now) {
      // Token expired or about to expire
      this.cache.delete(key);
      await this.deleteFromDisk(key);
      return null;
    }

    return {
      token: cached.accessToken,
      expiresOnTimestamp: cached.expiresOnTimestamp,
    };
  }

  /**
   * Cache a token
   */
  async set(tenantId: string, scopes: string[], token: AccessToken): Promise<void> {
    const key = this.getCacheKey(tenantId, scopes);
    
    const cached: CachedToken = {
      accessToken: token.token,
      expiresOnTimestamp: token.expiresOnTimestamp,
      tenantId,
      scopes,
      cachedAt: Date.now(),
    };

    this.cache.set(key, cached);

    if (this.persistEnabled) {
      await this.saveToDisk(key, cached);
    }
  }

  /**
   * Check if token is cached and valid
   */
  async has(tenantId: string, scopes: string[]): Promise<boolean> {
    const token = await this.get(tenantId, scopes);
    return token !== null;
  }

  /**
   * Clear all cached tokens
   */
  async clear(): Promise<void> {
    this.cache.clear();
    
    if (this.persistEnabled && fs.existsSync(this.cacheDir)) {
      try {
        const files = fs.readdirSync(this.cacheDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(this.cacheDir, file));
          }
        }
      } catch {
        // Ignore errors during cleanup
      }
    }
  }

  /**
   * Clear tokens for specific tenant
   */
  async clearTenant(tenantId: string): Promise<void> {
    for (const [key, value] of this.cache.entries()) {
      if (value.tenantId === tenantId) {
        this.cache.delete(key);
        await this.deleteFromDisk(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { entries: number; tenants: Set<string> } {
    const tenants = new Set<string>();
    for (const value of this.cache.values()) {
      tenants.add(value.tenantId);
    }
    return {
      entries: this.cache.size,
      tenants,
    };
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private getCacheKey(tenantId: string, scopes: string[]): string {
    const scopeStr = scopes.sort().join(',');
    return crypto
      .createHash('sha256')
      .update(`${tenantId}:${scopeStr}`)
      .digest('hex')
      .substring(0, 32);
  }

  private getOrCreateEncryptionKey(): Buffer | null {
    if (!this.persistEnabled) return null;

    // Ensure directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    const keyPath = path.join(this.cacheDir, '.key');

    if (fs.existsSync(keyPath)) {
      try {
        return Buffer.from(fs.readFileSync(keyPath, 'utf8'), 'hex');
      } catch {
        // Corrupted key, generate new one
      }
    }

    // Generate new key
    const key = crypto.randomBytes(32);
    try {
      fs.writeFileSync(keyPath, key.toString('hex'), { mode: 0o600 });
    } catch {
      // Can't write key, disable persistence
      return null;
    }
    return key;
  }

  private async saveToDisk(key: string, token: CachedToken): Promise<void> {
    if (!this.encryptionKey) return;

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(token), 'utf8'),
        cipher.final(),
      ]);
      
      const tag = cipher.getAuthTag();

      const entry: CacheEntry = {
        encryptedToken: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };

      const filePath = path.join(this.cacheDir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(entry), { mode: 0o600 });
    } catch {
      // Ignore save errors
    }
  }

  private async loadFromDisk(key: string): Promise<CachedToken | null> {
    if (!this.encryptionKey) return null;

    const filePath = path.join(this.cacheDir, `${key}.json`);
    
    if (!fs.existsSync(filePath)) return null;

    try {
      const entry = JSON.parse(fs.readFileSync(filePath, 'utf8')) as CacheEntry;
      
      const iv = Buffer.from(entry.iv, 'hex');
      const tag = Buffer.from(entry.tag, 'hex');
      const encrypted = Buffer.from(entry.encryptedToken, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString('utf8'));
    } catch {
      // Corrupted or tampered file
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore
      }
      return null;
    }
  }

  private async deleteFromDisk(key: string): Promise<void> {
    if (!this.persistEnabled) return;
    
    const filePath = path.join(this.cacheDir, `${key}.json`);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Ignore
    }
  }
}

// ===========================================================================
// Singleton Factory
// ===========================================================================

let cacheInstance: CredentialCache | null = null;

/**
 * Get the credential cache singleton
 */
export function getCredentialCache(options?: CredentialCacheOptions): CredentialCache {
  if (!cacheInstance) {
    cacheInstance = new CredentialCache(options);
  }
  return cacheInstance;
}

/**
 * Reset the credential cache singleton (for testing)
 */
export function resetCredentialCache(): void {
  if (cacheInstance) {
    cacheInstance.clear();
  }
  cacheInstance = null;
}
