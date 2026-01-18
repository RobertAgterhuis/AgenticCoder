/**
 * AzureContextManager - Manages multi-tenant Azure context
 * @module azure/AzureContextManager
 */

import { EventEmitter } from 'events';
import { DefaultAzureCredential, ClientSecretCredential, TokenCredential } from '@azure/identity';
import { SubscriptionClient } from '@azure/arm-resources-subscriptions';
import {
  AzureTenant,
  AzureSubscription,
  AzureContext,
  ContextChangeEvent,
  AzureConfig,
} from './types';

/**
 * Manages multi-tenant Azure context including tenants, subscriptions, and credentials
 */
export class AzureContextManager extends EventEmitter {
  private static instance: AzureContextManager | null = null;
  private context: AzureContext;
  private credentials: Map<string, TokenCredential>;
  private initialized: boolean = false;
  private config: AzureConfig | null = null;

  private constructor() {
    super();
    this.context = {
      currentTenantId: null,
      currentSubscriptionId: null,
      tenants: [],
      subscriptions: [],
    };
    this.credentials = new Map();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AzureContextManager {
    if (!AzureContextManager.instance) {
      AzureContextManager.instance = new AzureContextManager();
    }
    return AzureContextManager.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static reset(): void {
    if (AzureContextManager.instance) {
      AzureContextManager.instance.credentials.clear();
      AzureContextManager.instance.removeAllListeners();
    }
    AzureContextManager.instance = null;
  }

  /**
   * Initialize from config or environment
   */
  async initialize(config?: AzureConfig): Promise<void> {
    if (this.initialized) return;

    this.config = config || {};

    // Add tenants from config
    if (this.config.tenants) {
      for (const tenant of this.config.tenants) {
        await this.addTenant(tenant, false); // Don't load subscriptions yet
      }
    }

    // Set defaults from config or env
    if (this.config.defaultTenantId) {
      this.context.currentTenantId = this.config.defaultTenantId;
    } else if (process.env.AZURE_TENANT_ID) {
      // Add default tenant from env if not in config
      const envTenantId = process.env.AZURE_TENANT_ID;
      if (!this.context.tenants.find(t => t.tenantId === envTenantId)) {
        await this.addTenant({
          tenantId: envTenantId,
          name: 'Default (from env)',
          authenticationType: 'cli',
          isDefault: true,
        }, false);
      }
      this.context.currentTenantId = envTenantId;
    }

    if (this.config.defaultSubscriptionId) {
      this.context.currentSubscriptionId = this.config.defaultSubscriptionId;
    } else if (process.env.AZURE_SUBSCRIPTION_ID) {
      this.context.currentSubscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    }

    // Load subscriptions for current tenant
    if (this.context.currentTenantId) {
      await this.loadSubscriptions(this.context.currentTenantId);
    }

    this.initialized = true;
    this.emit('initialized', this.getContext());
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ===========================================================================
  // Tenant Management
  // ===========================================================================

  /**
   * Add a tenant
   */
  async addTenant(tenant: AzureTenant, loadSubs: boolean = true): Promise<void> {
    // Check if already exists
    const existing = this.context.tenants.find(t => t.tenantId === tenant.tenantId);
    if (existing) {
      throw new Error(`Tenant ${tenant.tenantId} already registered`);
    }

    // Create credential for tenant
    const credential = this.createCredential(tenant);
    this.credentials.set(tenant.tenantId, credential);

    // Add to context
    this.context.tenants.push({ ...tenant });

    // Set as default if first or marked as default
    if (this.context.tenants.length === 1 || tenant.isDefault) {
      this.context.currentTenantId = tenant.tenantId;
    }

    // Load subscriptions for tenant
    if (loadSubs) {
      await this.loadSubscriptions(tenant.tenantId);
    }

    this.emit('tenantAdded', tenant);
  }

  /**
   * Remove a tenant
   */
  async removeTenant(tenantId: string): Promise<void> {
    const index = this.context.tenants.findIndex(t => t.tenantId === tenantId);
    if (index === -1) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const removed = this.context.tenants[index];

    // Remove subscriptions for tenant
    this.context.subscriptions = this.context.subscriptions.filter(
      s => s.tenantId !== tenantId
    );

    // Remove credential
    this.credentials.delete(tenantId);

    // Remove tenant
    this.context.tenants.splice(index, 1);

    // Clear current if was active
    if (this.context.currentTenantId === tenantId) {
      this.context.currentTenantId = this.context.tenants[0]?.tenantId || null;
      this.context.currentSubscriptionId = null;
    }

    this.emit('tenantRemoved', removed);
  }

  /**
   * Set current tenant
   */
  async setCurrentTenant(tenantId: string): Promise<void> {
    const tenant = this.context.tenants.find(t => t.tenantId === tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const previousTenant = this.context.currentTenantId;
    if (previousTenant === tenantId) return; // No change

    this.context.currentTenantId = tenantId;

    // Reset subscription when tenant changes
    this.context.currentSubscriptionId = null;

    // Load subscriptions if not loaded
    const tenantSubs = this.context.subscriptions.filter(s => s.tenantId === tenantId);
    if (tenantSubs.length === 0) {
      await this.loadSubscriptions(tenantId);
    }

    // Find default subscription for new tenant
    const defaultSub = this.context.subscriptions.find(
      s => s.tenantId === tenantId && s.isDefault
    );
    if (defaultSub) {
      this.context.currentSubscriptionId = defaultSub.subscriptionId;
    } else {
      // Just pick first
      const firstSub = this.context.subscriptions.find(s => s.tenantId === tenantId);
      if (firstSub) {
        this.context.currentSubscriptionId = firstSub.subscriptionId;
      }
    }

    this.emit('contextChange', {
      type: 'tenant',
      previousValue: previousTenant,
      newValue: tenantId,
      timestamp: new Date(),
    } as ContextChangeEvent);
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId: string): AzureTenant | undefined {
    return this.context.tenants.find(t => t.tenantId === tenantId);
  }

  /**
   * List all tenants
   */
  getTenants(): AzureTenant[] {
    return [...this.context.tenants];
  }

  // ===========================================================================
  // Subscription Management
  // ===========================================================================

  /**
   * Load subscriptions for a tenant
   */
  async loadSubscriptions(tenantId: string): Promise<AzureSubscription[]> {
    const credential = this.credentials.get(tenantId);
    if (!credential) {
      throw new Error(`No credential for tenant ${tenantId}`);
    }

    try {
      const client = new SubscriptionClient(credential);
      const subscriptions: AzureSubscription[] = [];

      // Use paginated list
      const iterator = client.subscriptions.list();
      for await (const sub of iterator) {
        subscriptions.push({
          subscriptionId: sub.subscriptionId!,
          name: sub.displayName || sub.subscriptionId!,
          tenantId: tenantId,
          state: (sub.state as AzureSubscription['state']) || 'Enabled',
          isDefault: false,
        });
      }

      // Remove old subscriptions for this tenant
      this.context.subscriptions = this.context.subscriptions.filter(
        s => s.tenantId !== tenantId
      );

      // Mark first as default
      if (subscriptions.length > 0) {
        subscriptions[0].isDefault = true;
      }

      // Add to context
      this.context.subscriptions.push(...subscriptions);

      this.emit('subscriptionsLoaded', { tenantId, count: subscriptions.length });
      return subscriptions;
    } catch (error: any) {
      console.warn(`Failed to load subscriptions for tenant ${tenantId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Set current subscription
   */
  async setCurrentSubscription(subscriptionId: string): Promise<void> {
    const subscription = this.context.subscriptions.find(
      s => s.subscriptionId === subscriptionId
    );
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    // Switch tenant if needed
    if (subscription.tenantId !== this.context.currentTenantId) {
      await this.setCurrentTenant(subscription.tenantId);
    }

    const previousSub = this.context.currentSubscriptionId;
    if (previousSub === subscriptionId) return; // No change

    this.context.currentSubscriptionId = subscriptionId;

    this.emit('contextChange', {
      type: 'subscription',
      previousValue: previousSub,
      newValue: subscriptionId,
      timestamp: new Date(),
    } as ContextChangeEvent);
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): AzureSubscription | undefined {
    return this.context.subscriptions.find(s => s.subscriptionId === subscriptionId);
  }

  /**
   * Get subscriptions (optionally filtered by tenant)
   */
  getSubscriptions(tenantId?: string): AzureSubscription[] {
    if (tenantId) {
      return this.context.subscriptions.filter(s => s.tenantId === tenantId);
    }
    return [...this.context.subscriptions];
  }

  // ===========================================================================
  // Context Access
  // ===========================================================================

  /**
   * Get current context (immutable copy)
   */
  getContext(): Readonly<AzureContext> {
    return {
      currentTenantId: this.context.currentTenantId,
      currentSubscriptionId: this.context.currentSubscriptionId,
      tenants: [...this.context.tenants],
      subscriptions: [...this.context.subscriptions],
    };
  }

  /**
   * Get current tenant ID
   */
  getCurrentTenantId(): string | null {
    return this.context.currentTenantId;
  }

  /**
   * Get current subscription ID
   */
  getCurrentSubscriptionId(): string | null {
    return this.context.currentSubscriptionId;
  }

  /**
   * Get current tenant
   */
  getCurrentTenant(): AzureTenant | null {
    if (!this.context.currentTenantId) return null;
    return this.context.tenants.find(t => t.tenantId === this.context.currentTenantId) || null;
  }

  /**
   * Get current subscription
   */
  getCurrentSubscription(): AzureSubscription | null {
    if (!this.context.currentSubscriptionId) return null;
    return this.context.subscriptions.find(
      s => s.subscriptionId === this.context.currentSubscriptionId
    ) || null;
  }

  /**
   * Get credential for current tenant
   */
  getCurrentCredential(): TokenCredential | null {
    if (!this.context.currentTenantId) return null;
    return this.credentials.get(this.context.currentTenantId) || null;
  }

  /**
   * Get credential for specific tenant
   */
  getCredential(tenantId: string): TokenCredential | null {
    return this.credentials.get(tenantId) || null;
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Create credential for tenant based on authentication type
   */
  private createCredential(tenant: AzureTenant): TokenCredential {
    if (tenant.authenticationType === 'servicePrincipal' && tenant.servicePrincipal) {
      const sp = tenant.servicePrincipal;
      if (!sp.clientSecret) {
        throw new Error('Service principal requires client secret');
      }
      return new ClientSecretCredential(tenant.tenantId, sp.clientId, sp.clientSecret);
    }

    // Default to DefaultAzureCredential (CLI, managed identity, etc.)
    return new DefaultAzureCredential({
      tenantId: tenant.tenantId,
    });
  }
}

// ===========================================================================
// Convenience Functions
// ===========================================================================

/**
 * Get Azure context manager instance
 */
export function getAzureContext(): AzureContextManager {
  return AzureContextManager.getInstance();
}

/**
 * Get current subscription ID (auto-initializes)
 */
export async function getCurrentSubscriptionId(): Promise<string | null> {
  const manager = AzureContextManager.getInstance();
  if (!manager.isInitialized()) {
    await manager.initialize();
  }
  return manager.getCurrentSubscriptionId();
}

/**
 * Get current tenant ID (auto-initializes)
 */
export async function getCurrentTenantId(): Promise<string | null> {
  const manager = AzureContextManager.getInstance();
  if (!manager.isInitialized()) {
    await manager.initialize();
  }
  return manager.getCurrentTenantId();
}

/**
 * Get credential for current tenant (auto-initializes)
 */
export async function getCurrentCredential(): Promise<TokenCredential | null> {
  const manager = AzureContextManager.getInstance();
  if (!manager.isInitialized()) {
    await manager.initialize();
  }
  return manager.getCurrentCredential();
}
