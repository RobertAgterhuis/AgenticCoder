/**
 * Azure Multi-Tenant Types
 * @module azure/types
 */

/**
 * Authentication type for Azure tenant
 */
export type AzureAuthenticationType = 'cli' | 'servicePrincipal' | 'managedIdentity';

/**
 * Service principal configuration
 */
export interface ServicePrincipalConfig {
  clientId: string;
  clientSecret?: string;
  certificatePath?: string;
}

/**
 * Azure tenant configuration
 */
export interface AzureTenant {
  tenantId: string;
  name: string;
  isDefault?: boolean;
  authenticationType: AzureAuthenticationType;
  servicePrincipal?: ServicePrincipalConfig;
}

/**
 * Azure subscription state
 */
export type AzureSubscriptionState = 'Enabled' | 'Disabled' | 'Warned' | 'PastDue' | 'Deleted';

/**
 * Azure subscription
 */
export interface AzureSubscription {
  subscriptionId: string;
  name: string;
  tenantId: string;
  state: AzureSubscriptionState;
  isDefault?: boolean;
}

/**
 * Current Azure context
 */
export interface AzureContext {
  currentTenantId: string | null;
  currentSubscriptionId: string | null;
  tenants: AzureTenant[];
  subscriptions: AzureSubscription[];
}

/**
 * Context change event
 */
export interface ContextChangeEvent {
  type: 'tenant' | 'subscription';
  previousValue: string | null;
  newValue: string | null;
  timestamp: Date;
}

/**
 * Azure configuration in config file
 */
export interface AzureConfig {
  tenants?: AzureTenant[];
  defaultTenantId?: string;
  defaultSubscriptionId?: string;
  tokenCachePath?: string;
  enableCaching?: boolean;
}

/**
 * Credential cache entry
 */
export interface CredentialCacheEntry {
  tenantId: string;
  accessToken: string;
  expiresOn: Date;
  scope: string;
}
