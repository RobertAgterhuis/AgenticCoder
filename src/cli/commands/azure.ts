/**
 * Azure Command - Manage Azure tenants and subscriptions
 * @module cli/commands/azure
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { AzureContextManager, AzureAuthenticationType } from '../../azure';

export const azureCommand = new Command('azure')
  .description('Manage Azure tenants and subscriptions');

// ===========================================================================
// azure context
// ===========================================================================

azureCommand
  .command('context')
  .description('Show current Azure context')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const manager = AzureContextManager.getInstance();
      await manager.initialize();
      
      const context = manager.getContext();

      if (options.json) {
        console.log(JSON.stringify({
          tenant: context.currentTenantId ? {
            id: context.currentTenantId,
            name: context.tenants.find(t => t.tenantId === context.currentTenantId)?.name,
          } : null,
          subscription: context.currentSubscriptionId ? {
            id: context.currentSubscriptionId,
            name: context.subscriptions.find(s => s.subscriptionId === context.currentSubscriptionId)?.name,
          } : null,
        }, null, 2));
        return;
      }
      
      console.log(chalk.bold('\n🔷 Azure Context\n'));
      console.log('─'.repeat(50));
      
      if (context.currentTenantId) {
        const tenant = context.tenants.find(t => t.tenantId === context.currentTenantId);
        console.log(`  Tenant:       ${chalk.cyan(tenant?.name || 'Unknown')}`);
        console.log(`  Tenant ID:    ${context.currentTenantId}`);
      } else {
        console.log(chalk.yellow('  No tenant selected'));
      }
      
      console.log('');
      
      if (context.currentSubscriptionId) {
        const sub = context.subscriptions.find(s => s.subscriptionId === context.currentSubscriptionId);
        console.log(`  Subscription: ${chalk.cyan(sub?.name || 'Unknown')}`);
        console.log(`  Sub ID:       ${context.currentSubscriptionId}`);
      } else {
        console.log(chalk.yellow('  No subscription selected'));
      }
      
      console.log('');
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// ===========================================================================
// azure tenant
// ===========================================================================

const tenantCmd = azureCommand
  .command('tenant')
  .description('Manage Azure tenants');

tenantCmd
  .command('list')
  .description('List registered tenants')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const manager = AzureContextManager.getInstance();
      await manager.initialize();
      
      const tenants = manager.getTenants();
      const currentId = manager.getCurrentTenantId();

      if (options.json) {
        console.log(JSON.stringify(tenants.map(t => ({
          ...t,
          isCurrent: t.tenantId === currentId,
        })), null, 2));
        return;
      }
      
      console.log(chalk.bold('\n🏢 Registered Tenants\n'));
      console.log('─'.repeat(60));
      
      if (tenants.length === 0) {
        console.log(chalk.yellow('  No tenants registered'));
        console.log(chalk.gray('  Use: agentic azure tenant add --tenant-id <id> --name <name>'));
        return;
      }
      
      for (const tenant of tenants) {
        const isCurrent = tenant.tenantId === currentId;
        const marker = isCurrent ? chalk.green('✓') : ' ';
        const name = isCurrent ? chalk.cyan(tenant.name) : tenant.name;
        console.log(`  ${marker} ${name}`);
        console.log(chalk.gray(`      ID:   ${tenant.tenantId}`));
        console.log(chalk.gray(`      Auth: ${tenant.authenticationType}`));
        console.log('');
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

tenantCmd
  .command('add')
  .description('Add a new tenant')
  .requiredOption('--tenant-id <id>', 'Azure tenant ID (GUID)')
  .requiredOption('--name <name>', 'Display name for tenant')
  .option('--auth <type>', 'Authentication type (cli, servicePrincipal, managedIdentity)', 'cli')
  .option('--client-id <id>', 'Service principal client ID')
  .option('--client-secret <secret>', 'Service principal client secret')
  .option('--default', 'Set as default tenant')
  .action(async (options) => {
    try {
      const manager = AzureContextManager.getInstance();
      await manager.initialize();
      
      await manager.addTenant({
        tenantId: options.tenantId,
        name: options.name,
        authenticationType: options.auth as AzureAuthenticationType,
        isDefault: options.default,
        servicePrincipal: options.clientId ? {
          clientId: options.clientId,
          clientSecret: options.clientSecret,
        } : undefined,
      });
      
      console.log(chalk.green(`\n✓ Added tenant: ${options.name}`));
      
      const subs = manager.getSubscriptions(options.tenantId);
      console.log(chalk.gray(`  Found ${subs.length} subscription(s)`));
      console.log('');
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

tenantCmd
  .command('remove <tenantId>')
  .description('Remove a tenant')
  .action(async (tenantId: string) => {
    try {
      const manager = AzureContextManager.getInstance();
      await manager.initialize();
      
      const tenant = manager.getTenant(tenantId);
      if (!tenant) {
        console.error(chalk.red(`Tenant not found: ${tenantId}`));
        process.exit(1);
      }
      
      await manager.removeTenant(tenantId);
      console.log(chalk.green(`✓ Removed tenant: ${tenant.name}`));
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

tenantCmd
  .command('set <tenantId>')
  .description('Set current tenant')
  .action(async (tenantId: string) => {
    try {
      const manager = AzureContextManager.getInstance();
      await manager.initialize();
      
      await manager.setCurrentTenant(tenantId);
      const tenant = manager.getTenant(tenantId);
      console.log(chalk.green(`✓ Switched to tenant: ${tenant?.name || tenantId}`));
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// ===========================================================================
// azure subscription
// ===========================================================================

const subCmd = azureCommand
  .command('subscription')
  .alias('sub')
  .description('Manage Azure subscriptions');

subCmd
  .command('list')
  .description('List subscriptions')
  .option('--tenant <id>', 'Filter by tenant ID')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const manager = AzureContextManager.getInstance();
      await manager.initialize();
      
      const subs = manager.getSubscriptions(options.tenant);
      const currentId = manager.getCurrentSubscriptionId();

      if (options.json) {
        console.log(JSON.stringify(subs.map(s => ({
          ...s,
          isCurrent: s.subscriptionId === currentId,
        })), null, 2));
        return;
      }
      
      console.log(chalk.bold('\n📦 Subscriptions\n'));
      console.log('─'.repeat(70));
      
      if (subs.length === 0) {
        console.log(chalk.yellow('  No subscriptions found'));
        return;
      }
      
      // Group by tenant
      const byTenant = new Map<string, typeof subs>();
      for (const sub of subs) {
        const list = byTenant.get(sub.tenantId) || [];
        list.push(sub);
        byTenant.set(sub.tenantId, list);
      }
      
      for (const [tenantId, tenantSubs] of byTenant) {
        const tenant = manager.getTenant(tenantId);
        console.log(chalk.gray(`  Tenant: ${tenant?.name || tenantId}`));
        
        for (const sub of tenantSubs) {
          const isCurrent = sub.subscriptionId === currentId;
          const marker = isCurrent ? chalk.green('✓') : ' ';
          const name = isCurrent ? chalk.cyan(sub.name) : sub.name;
          const stateColor = sub.state === 'Enabled' ? chalk.green : chalk.yellow;
          
          console.log(`    ${marker} ${name}`);
          console.log(chalk.gray(`        ID:    ${sub.subscriptionId}`));
          console.log(chalk.gray(`        State: ${stateColor(sub.state)}`));
        }
        console.log('');
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

subCmd
  .command('set <subscriptionId>')
  .description('Set current subscription')
  .action(async (subscriptionId: string) => {
    try {
      const manager = AzureContextManager.getInstance();
      await manager.initialize();
      
      await manager.setCurrentSubscription(subscriptionId);
      const sub = manager.getSubscription(subscriptionId);
      console.log(chalk.green(`✓ Switched to subscription: ${sub?.name || subscriptionId}`));
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

subCmd
  .command('refresh')
  .description('Refresh subscriptions from Azure')
  .option('--tenant <id>', 'Refresh for specific tenant only')
  .action(async (options) => {
    try {
      const manager = AzureContextManager.getInstance();
      await manager.initialize();
      
      const tenants = options.tenant 
        ? [options.tenant]
        : manager.getTenants().map(t => t.tenantId);
      
      let totalSubs = 0;
      
      for (const tenantId of tenants) {
        console.log(chalk.gray(`  Refreshing ${tenantId}...`));
        const subs = await manager.loadSubscriptions(tenantId);
        totalSubs += subs.length;
      }
      
      console.log(chalk.green(`\n✓ Refreshed ${totalSubs} subscription(s) from ${tenants.length} tenant(s)`));
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// ===========================================================================
// azure cache
// ===========================================================================

const cacheCmd = azureCommand
  .command('cache')
  .description('Manage credential cache');

cacheCmd
  .command('clear')
  .description('Clear all cached credentials')
  .option('--tenant <id>', 'Clear for specific tenant only')
  .action(async (options) => {
    try {
      const { getCredentialCache } = await import('../../azure');
      const cache = getCredentialCache();
      
      if (options.tenant) {
        await cache.clearTenant(options.tenant);
        console.log(chalk.green(`✓ Cleared cache for tenant: ${options.tenant}`));
      } else {
        await cache.clear();
        console.log(chalk.green('✓ Cleared all cached credentials'));
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

cacheCmd
  .command('status')
  .description('Show cache statistics')
  .action(async () => {
    try {
      const { getCredentialCache } = await import('../../azure');
      const cache = getCredentialCache();
      const stats = cache.getStats();
      
      console.log(chalk.bold('\n🗄️  Credential Cache\n'));
      console.log(`  Cached entries: ${stats.entries}`);
      console.log(`  Tenants:        ${stats.tenants.size}`);
      console.log('');
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });
