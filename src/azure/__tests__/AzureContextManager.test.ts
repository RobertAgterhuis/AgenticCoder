/**
 * AzureContextManager Tests
 */

import {
  AzureContextManager,
  getAzureContext,
  getCurrentSubscriptionId,
  getCurrentTenantId,
} from '../AzureContextManager';
import { AzureTenant, AzureSubscription } from '../types';

// Mock Azure SDK
jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockResolvedValue({ token: 'mock-token', expiresOnTimestamp: Date.now() + 3600000 }),
  })),
  ClientSecretCredential: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockResolvedValue({ token: 'mock-sp-token', expiresOnTimestamp: Date.now() + 3600000 }),
  })),
}));

jest.mock('@azure/arm-resources-subscriptions', () => ({
  SubscriptionClient: jest.fn().mockImplementation(() => ({
    subscriptions: {
      list: jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { subscriptionId: 'sub-1', displayName: 'Subscription 1', state: 'Enabled' };
          yield { subscriptionId: 'sub-2', displayName: 'Subscription 2', state: 'Enabled' };
        },
      }),
    },
  })),
}));

describe('AzureContextManager', () => {
  beforeEach(() => {
    // Reset singleton before each test
    AzureContextManager.reset();
    // Clear env vars
    delete process.env.AZURE_TENANT_ID;
    delete process.env.AZURE_SUBSCRIPTION_ID;
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = AzureContextManager.getInstance();
      const instance2 = AzureContextManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = AzureContextManager.getInstance();
      AzureContextManager.reset();
      const instance2 = AzureContextManager.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize with empty context', async () => {
      const manager = AzureContextManager.getInstance();
      await manager.initialize();

      expect(manager.isInitialized()).toBe(true);
      expect(manager.getCurrentTenantId()).toBeNull();
      expect(manager.getCurrentSubscriptionId()).toBeNull();
    });

    it('should initialize from env vars', async () => {
      process.env.AZURE_TENANT_ID = 'test-tenant-id';
      process.env.AZURE_SUBSCRIPTION_ID = 'test-sub-id';

      const manager = AzureContextManager.getInstance();
      await manager.initialize();

      expect(manager.getCurrentTenantId()).toBe('test-tenant-id');
      expect(manager.getCurrentSubscriptionId()).toBe('test-sub-id');
    });

    it('should initialize from config', async () => {
      const manager = AzureContextManager.getInstance();
      await manager.initialize({
        tenants: [{
          tenantId: 'config-tenant',
          name: 'Config Tenant',
          authenticationType: 'cli',
          isDefault: true,
        }],
        defaultTenantId: 'config-tenant',
        defaultSubscriptionId: 'config-sub',
      });

      expect(manager.getCurrentTenantId()).toBe('config-tenant');
      expect(manager.getCurrentSubscriptionId()).toBe('config-sub');
    });

    it('should be idempotent', async () => {
      const manager = AzureContextManager.getInstance();
      await manager.initialize({ 
        tenants: [{ tenantId: 'tenant-1', name: 'Test', authenticationType: 'cli' }],
        defaultTenantId: 'tenant-1' 
      });
      await manager.initialize({ defaultTenantId: 'tenant-2' }); // Should be ignored

      // Still has original value
      expect(manager.isInitialized()).toBe(true);
      expect(manager.getCurrentTenantId()).toBe('tenant-1');
    });

    it('should emit initialized event', async () => {
      const manager = AzureContextManager.getInstance();
      const listener = jest.fn();
      manager.on('initialized', listener);

      await manager.initialize();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Tenant Management', () => {
    let manager: AzureContextManager;

    beforeEach(async () => {
      manager = AzureContextManager.getInstance();
      await manager.initialize();
    });

    it('should add a tenant', async () => {
      const tenant: AzureTenant = {
        tenantId: 'new-tenant',
        name: 'New Tenant',
        authenticationType: 'cli',
      };

      await manager.addTenant(tenant);

      expect(manager.getTenants()).toHaveLength(1);
      expect(manager.getTenant('new-tenant')).toEqual(expect.objectContaining(tenant));
    });

    it('should set first tenant as current', async () => {
      await manager.addTenant({
        tenantId: 'first-tenant',
        name: 'First',
        authenticationType: 'cli',
      });

      expect(manager.getCurrentTenantId()).toBe('first-tenant');
    });

    it('should throw when adding duplicate tenant', async () => {
      await manager.addTenant({
        tenantId: 'tenant-1',
        name: 'Tenant 1',
        authenticationType: 'cli',
      });

      await expect(
        manager.addTenant({
          tenantId: 'tenant-1',
          name: 'Duplicate',
          authenticationType: 'cli',
        })
      ).rejects.toThrow('already registered');
    });

    it('should remove a tenant', async () => {
      await manager.addTenant({
        tenantId: 'tenant-to-remove',
        name: 'To Remove',
        authenticationType: 'cli',
      });

      await manager.removeTenant('tenant-to-remove');

      expect(manager.getTenants()).toHaveLength(0);
      expect(manager.getCurrentTenantId()).toBeNull();
    });

    it('should throw when removing non-existent tenant', async () => {
      await expect(manager.removeTenant('non-existent')).rejects.toThrow('not found');
    });

    it('should switch current tenant', async () => {
      await manager.addTenant({
        tenantId: 'tenant-1',
        name: 'Tenant 1',
        authenticationType: 'cli',
      });
      await manager.addTenant({
        tenantId: 'tenant-2',
        name: 'Tenant 2',
        authenticationType: 'cli',
      });

      await manager.setCurrentTenant('tenant-2');

      expect(manager.getCurrentTenantId()).toBe('tenant-2');
    });

    it('should emit contextChange on tenant switch', async () => {
      await manager.addTenant({
        tenantId: 'tenant-1',
        name: 'Tenant 1',
        authenticationType: 'cli',
      });
      await manager.addTenant({
        tenantId: 'tenant-2',
        name: 'Tenant 2',
        authenticationType: 'cli',
      });

      const listener = jest.fn();
      manager.on('contextChange', listener);

      await manager.setCurrentTenant('tenant-2');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tenant',
          previousValue: 'tenant-1',
          newValue: 'tenant-2',
        })
      );
    });
  });

  describe('Subscription Management', () => {
    let manager: AzureContextManager;

    beforeEach(async () => {
      manager = AzureContextManager.getInstance();
      await manager.initialize();
      await manager.addTenant({
        tenantId: 'tenant-1',
        name: 'Test Tenant',
        authenticationType: 'cli',
      });
    });

    it('should load subscriptions for tenant', async () => {
      const subs = await manager.loadSubscriptions('tenant-1');

      expect(subs).toHaveLength(2);
      expect(subs[0].subscriptionId).toBe('sub-1');
    });

    it('should get subscriptions', () => {
      const subs = manager.getSubscriptions();

      expect(subs.length).toBeGreaterThanOrEqual(0);
    });

    it('should get subscriptions filtered by tenant', () => {
      const subs = manager.getSubscriptions('tenant-1');

      expect(subs.every(s => s.tenantId === 'tenant-1')).toBe(true);
    });

    it('should set current subscription', async () => {
      // Ensure subscriptions are loaded
      await manager.loadSubscriptions('tenant-1');

      await manager.setCurrentSubscription('sub-1');

      expect(manager.getCurrentSubscriptionId()).toBe('sub-1');
    });

    it('should throw when setting non-existent subscription', async () => {
      await expect(manager.setCurrentSubscription('non-existent')).rejects.toThrow('not found');
    });

    it('should emit contextChange on subscription switch', async () => {
      await manager.loadSubscriptions('tenant-1');

      const listener = jest.fn();
      manager.on('contextChange', listener);

      await manager.setCurrentSubscription('sub-2');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'subscription',
          newValue: 'sub-2',
        })
      );
    });
  });

  describe('Context Access', () => {
    let manager: AzureContextManager;

    beforeEach(async () => {
      manager = AzureContextManager.getInstance();
      await manager.initialize();
      await manager.addTenant({
        tenantId: 'test-tenant',
        name: 'Test',
        authenticationType: 'cli',
      });
    });

    it('should get full context', () => {
      const context = manager.getContext();

      expect(context.currentTenantId).toBe('test-tenant');
      expect(context.tenants).toHaveLength(1);
    });

    it('should return immutable context', () => {
      const context1 = manager.getContext();
      const context2 = manager.getContext();

      expect(context1).not.toBe(context2);
      expect(context1.tenants).not.toBe(context2.tenants);
    });

    it('should get current tenant', () => {
      const tenant = manager.getCurrentTenant();

      expect(tenant?.tenantId).toBe('test-tenant');
    });

    it('should get credential for tenant', () => {
      const credential = manager.getCredential('test-tenant');

      expect(credential).not.toBeNull();
    });

    it('should get current credential', () => {
      const credential = manager.getCurrentCredential();

      expect(credential).not.toBeNull();
    });

    it('should return null for non-existent credential', () => {
      const credential = manager.getCredential('non-existent');

      expect(credential).toBeNull();
    });
  });

  describe('Service Principal Authentication', () => {
    let manager: AzureContextManager;

    beforeEach(async () => {
      manager = AzureContextManager.getInstance();
      await manager.initialize();
    });

    it('should create service principal credential', async () => {
      await manager.addTenant({
        tenantId: 'sp-tenant',
        name: 'SP Tenant',
        authenticationType: 'servicePrincipal',
        servicePrincipal: {
          clientId: 'client-id',
          clientSecret: 'client-secret',
        },
      });

      const credential = manager.getCredential('sp-tenant');
      expect(credential).not.toBeNull();
    });

    it('should throw when service principal missing secret', async () => {
      await expect(
        manager.addTenant({
          tenantId: 'sp-tenant',
          name: 'SP Tenant',
          authenticationType: 'servicePrincipal',
          servicePrincipal: {
            clientId: 'client-id',
            // Missing clientSecret
          },
        })
      ).rejects.toThrow('requires client secret');
    });
  });

  describe('Convenience Functions', () => {
    beforeEach(() => {
      process.env.AZURE_TENANT_ID = 'env-tenant';
      process.env.AZURE_SUBSCRIPTION_ID = 'env-sub';
    });

    it('getAzureContext should return manager', () => {
      const manager = getAzureContext();
      expect(manager).toBeInstanceOf(AzureContextManager);
    });

    it('getCurrentSubscriptionId should auto-initialize', async () => {
      const subId = await getCurrentSubscriptionId();
      expect(subId).toBe('env-sub');
    });

    it('getCurrentTenantId should auto-initialize', async () => {
      const tenantId = await getCurrentTenantId();
      expect(tenantId).toBe('env-tenant');
    });
  });
});
