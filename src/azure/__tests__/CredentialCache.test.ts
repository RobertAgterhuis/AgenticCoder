/**
 * CredentialCache Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CredentialCache, getCredentialCache, resetCredentialCache } from '../CredentialCache';

describe('CredentialCache', () => {
  let tempDir: string;

  beforeEach(() => {
    resetCredentialCache();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'credential-cache-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Memory Cache', () => {
    it('should cache tokens in memory', async () => {
      const cache = new CredentialCache({ persist: false });
      const token = { token: 'test-token', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope1'], token);
      const cached = await cache.get('tenant-1', ['scope1']);

      expect(cached).not.toBeNull();
      expect(cached?.token).toBe('test-token');
    });

    it('should return null for non-existent tokens', async () => {
      const cache = new CredentialCache({ persist: false });

      const cached = await cache.get('non-existent', ['scope1']);

      expect(cached).toBeNull();
    });

    it('should expire tokens based on expiration timestamp', async () => {
      const cache = new CredentialCache({ 
        persist: false,
        expirationBufferMs: 0, // No buffer for test
      });
      const token = { token: 'expired-token', expiresOnTimestamp: Date.now() - 1000 };

      await cache.set('tenant-1', ['scope1'], token);
      const cached = await cache.get('tenant-1', ['scope1']);

      expect(cached).toBeNull();
    });

    it('should expire tokens within buffer time', async () => {
      const cache = new CredentialCache({ 
        persist: false,
        expirationBufferMs: 60000, // 1 minute buffer
      });
      const token = { token: 'soon-expired-token', expiresOnTimestamp: Date.now() + 30000 }; // 30 seconds

      await cache.set('tenant-1', ['scope1'], token);
      const cached = await cache.get('tenant-1', ['scope1']);

      expect(cached).toBeNull(); // Within buffer, should be expired
    });

    it('should handle multiple scopes', async () => {
      const cache = new CredentialCache({ persist: false });
      const token1 = { token: 'token-1', expiresOnTimestamp: Date.now() + 3600000 };
      const token2 = { token: 'token-2', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope1'], token1);
      await cache.set('tenant-1', ['scope1', 'scope2'], token2);

      const cached1 = await cache.get('tenant-1', ['scope1']);
      const cached2 = await cache.get('tenant-1', ['scope1', 'scope2']);

      expect(cached1?.token).toBe('token-1');
      expect(cached2?.token).toBe('token-2');
    });

    it('should treat scope order as equivalent', async () => {
      const cache = new CredentialCache({ persist: false });
      const token = { token: 'test-token', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope2', 'scope1'], token);
      
      // Get with different order
      const cached = await cache.get('tenant-1', ['scope1', 'scope2']);

      expect(cached?.token).toBe('test-token');
    });

    it('should clear all tokens', async () => {
      const cache = new CredentialCache({ persist: false });
      const token = { token: 'test-token', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope1'], token);
      await cache.set('tenant-2', ['scope2'], token);
      await cache.clear();

      const cached1 = await cache.get('tenant-1', ['scope1']);
      const cached2 = await cache.get('tenant-2', ['scope2']);

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
    });

    it('should clear tokens for specific tenant', async () => {
      const cache = new CredentialCache({ persist: false });
      const token = { token: 'test-token', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope1'], token);
      await cache.set('tenant-2', ['scope2'], token);
      await cache.clearTenant('tenant-1');

      const cached1 = await cache.get('tenant-1', ['scope1']);
      const cached2 = await cache.get('tenant-2', ['scope2']);

      expect(cached1).toBeNull();
      expect(cached2?.token).toBe('test-token');
    });
  });

  describe('has()', () => {
    it('should return true for cached tokens', async () => {
      const cache = new CredentialCache({ persist: false });
      const token = { token: 'test-token', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope1'], token);

      expect(await cache.has('tenant-1', ['scope1'])).toBe(true);
    });

    it('should return false for non-existent tokens', async () => {
      const cache = new CredentialCache({ persist: false });

      expect(await cache.has('tenant-1', ['scope1'])).toBe(false);
    });
  });

  describe('getStats()', () => {
    it('should return cache statistics', async () => {
      const cache = new CredentialCache({ persist: false });
      const token = { token: 'test-token', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope1'], token);
      await cache.set('tenant-1', ['scope2'], token);
      await cache.set('tenant-2', ['scope1'], token);

      const stats = cache.getStats();

      expect(stats.entries).toBe(3);
      expect(stats.tenants.size).toBe(2);
      expect(stats.tenants.has('tenant-1')).toBe(true);
      expect(stats.tenants.has('tenant-2')).toBe(true);
    });
  });

  describe('Persistent Cache', () => {
    it('should persist tokens to disk', async () => {
      const cache = new CredentialCache({ 
        persist: true,
        cacheDir: path.join(tempDir, 'creds'),
      });
      const token = { token: 'persistent-token', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope1'], token);

      // Check that cache directory was created
      expect(fs.existsSync(path.join(tempDir, 'creds'))).toBe(true);
      
      // Check that files were created (key file + at least one token file)
      const files = fs.readdirSync(path.join(tempDir, 'creds'));
      expect(files.length).toBeGreaterThanOrEqual(1);
    });

    it('should load tokens from disk on new instance', async () => {
      const cacheDir = path.join(tempDir, 'creds');
      
      // Save token with first instance
      const cache1 = new CredentialCache({ persist: true, cacheDir });
      const token = { token: 'persistent-token', expiresOnTimestamp: Date.now() + 3600000 };
      await cache1.set('tenant-1', ['scope1'], token);

      // Create new instance with same cache dir
      const cache2 = new CredentialCache({ persist: true, cacheDir });
      const cached = await cache2.get('tenant-1', ['scope1']);

      expect(cached?.token).toBe('persistent-token');
    });

    it('should encrypt tokens on disk', async () => {
      const cacheDir = path.join(tempDir, 'creds');
      const cache = new CredentialCache({ persist: true, cacheDir });
      const token = { token: 'secret-token', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope1'], token);

      // Read the cached file
      const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
      expect(files.length).toBe(1);

      const content = fs.readFileSync(path.join(cacheDir, files[0]), 'utf8');
      
      // Should not contain plaintext token
      expect(content).not.toContain('secret-token');
      
      // Should contain encrypted format
      const parsed = JSON.parse(content);
      expect(parsed.encryptedToken).toBeDefined();
      expect(parsed.iv).toBeDefined();
      expect(parsed.tag).toBeDefined();
    });

    it('should handle corrupted cache files', async () => {
      const cacheDir = path.join(tempDir, 'creds');
      const cache = new CredentialCache({ persist: true, cacheDir });
      const token = { token: 'test-token', expiresOnTimestamp: Date.now() + 3600000 };
      
      await cache.set('tenant-1', ['scope1'], token);

      // Corrupt the cache file
      const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
      fs.writeFileSync(path.join(cacheDir, files[0]), 'corrupted data');

      // New cache instance should handle corruption gracefully
      const cache2 = new CredentialCache({ persist: true, cacheDir });
      const cached = await cache2.get('tenant-1', ['scope1']);

      expect(cached).toBeNull();
    });

    it('should delete disk cache on clear', async () => {
      const cacheDir = path.join(tempDir, 'creds');
      const cache = new CredentialCache({ persist: true, cacheDir });
      const token = { token: 'test-token', expiresOnTimestamp: Date.now() + 3600000 };

      await cache.set('tenant-1', ['scope1'], token);
      await cache.clear();

      const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
      expect(files.length).toBe(0);
    });
  });

  describe('Singleton Factory', () => {
    it('getCredentialCache should return same instance', () => {
      const cache1 = getCredentialCache();
      const cache2 = getCredentialCache();

      expect(cache1).toBe(cache2);
    });

    it('resetCredentialCache should create new instance', () => {
      const cache1 = getCredentialCache();
      resetCredentialCache();
      const cache2 = getCredentialCache();

      expect(cache1).not.toBe(cache2);
    });
  });
});
