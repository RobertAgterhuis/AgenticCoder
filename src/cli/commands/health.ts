/**
 * Health CLI Commands
 * @module cli/commands/health
 * 
 * Commands for checking system and adapter health.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { AdapterRegistry } from '../../mcp/registry';

/**
 * Register health commands
 */
export function registerHealthCommands(program: Command): void {
  const health = program
    .command('health')
    .description('Check system health');
    
  health
    .command('adapters')
    .description('Check health of all MCP adapters')
    .option('--verbose', 'Show detailed output')
    .option('--json', 'Output as JSON')
    .action(async (options: { verbose?: boolean; json?: boolean }) => {
      const registry = AdapterRegistry.getInstance();
      await registry.initialize();
      
      const adapters = registry.listAdapters();
      const results: Array<{ id: string; status: string; error?: string }> = [];
      
      if (!options.json) {
        console.log(chalk.bold('\nMCP Adapter Health Check'));
        console.log('─'.repeat(60));
      }
      
      for (const adapter of adapters) {
        if (!options.json) {
          process.stdout.write(`Checking ${adapter.id}... `);
        }
        
        try {
          await registry.getAdapter(adapter.id);
          if (!options.json) {
            console.log(chalk.green('✓ OK'));
          }
          results.push({ id: adapter.id, status: 'ok' });
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (!options.json) {
            console.log(chalk.red('✗ FAILED'));
          }
          results.push({ 
            id: adapter.id, 
            status: 'failed',
            error: errorMsg,
          });
          
          if (options.verbose && !options.json) {
            console.log(chalk.red(`  Error: ${errorMsg}`));
          }
        }
      }
      
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      
      // Summary
      const passed = results.filter(r => r.status === 'ok').length;
      const failed = results.filter(r => r.status === 'failed').length;
      
      console.log('\n' + '─'.repeat(60));
      console.log(chalk.bold('Summary:'));
      console.log(`  ${chalk.green('Passed:')} ${passed}`);
      console.log(`  ${chalk.red('Failed:')} ${failed}`);
      console.log(`  ${chalk.bold('Total:')}  ${results.length}`);
      
      if (failed > 0) {
        console.log(chalk.yellow('\nFailed adapters:'));
        for (const r of results.filter(r => r.status === 'failed')) {
          console.log(`  - ${r.id}: ${r.error}`);
        }
        process.exit(1);
      }
    });
    
  health
    .command('tools')
    .description('Test tool invocations')
    .option('--quick', 'Quick test (skip slow tools)')
    .option('--json', 'Output as JSON')
    .action(async (options: { quick?: boolean; json?: boolean }) => {
      const registry = AdapterRegistry.getInstance();
      await registry.initialize();
      
      if (!options.json) {
        console.log(chalk.bold('\nMCP Tool Health Check'));
        console.log('─'.repeat(60));
      }
      
      const allTools = registry.listTools();
      let passed = 0;
      let failed = 0;
      let skipped = 0;
      const results: Array<{ tool: string; status: string; duration?: number; error?: string }> = [];
      
      // Test tools that don't require external services (mock tests)
      const safeTools = [
        { tool: 'docs_search', params: { query: 'test', limit: 1 } },
      ];
      
      for (const test of safeTools) {
        if (!allTools.find(t => t.tool === test.tool)) {
          if (!options.json) {
            console.log(`${chalk.yellow('○')} ${test.tool} (not registered)`);
          }
          skipped++;
          results.push({ tool: test.tool, status: 'skipped', error: 'not registered' });
          continue;
        }
        
        if (!options.json) {
          process.stdout.write(`Testing ${test.tool}... `);
        }
        
        try {
          const result = await registry.invokeTool({
            tool: test.tool,
            params: test.params,
            timeout: 5000,
          });
          
          if (result.success) {
            if (!options.json) {
              console.log(chalk.green(`✓ OK (${result.duration}ms)`));
            }
            passed++;
            results.push({ tool: test.tool, status: 'ok', duration: result.duration });
          } else {
            if (!options.json) {
              console.log(chalk.yellow(`○ ${result.error}`));
            }
            skipped++;
            results.push({ tool: test.tool, status: 'skipped', error: result.error });
          }
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (!options.json) {
            console.log(chalk.red(`✗ ${errorMsg}`));
          }
          failed++;
          results.push({ tool: test.tool, status: 'failed', error: errorMsg });
        }
      }
      
      if (options.json) {
        console.log(JSON.stringify({ passed, skipped, failed, results }, null, 2));
        return;
      }
      
      console.log('\n' + '─'.repeat(60));
      console.log(chalk.bold('Summary:'));
      console.log(`  ${chalk.green('Passed:')}  ${passed}`);
      console.log(`  ${chalk.yellow('Skipped:')} ${skipped}`);
      console.log(`  ${chalk.red('Failed:')}  ${failed}`);
    });
    
  health
    .command('system')
    .description('Check overall system health')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      const checks: Array<{ name: string; status: string; message?: string }> = [];
      
      // Check registry initialization
      try {
        const registry = AdapterRegistry.getInstance();
        await registry.initialize();
        checks.push({ name: 'AdapterRegistry', status: 'ok' });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        checks.push({ name: 'AdapterRegistry', status: 'failed', message: errorMsg });
      }
      
      // Check if config exists
      const fs = await import('fs/promises');
      const path = await import('path');
      try {
        const configPath = path.join(process.cwd(), '.agenticcoder', 'config.json');
        await fs.access(configPath);
        checks.push({ name: 'Configuration', status: 'ok' });
      } catch {
        checks.push({ name: 'Configuration', status: 'warning', message: 'No config file found' });
      }
      
      if (options.json) {
        console.log(JSON.stringify(checks, null, 2));
        return;
      }
      
      console.log(chalk.bold('\nSystem Health Check'));
      console.log('─'.repeat(60));
      
      for (const check of checks) {
        const icon = check.status === 'ok' ? chalk.green('✓') : 
                     check.status === 'warning' ? chalk.yellow('○') : chalk.red('✗');
        const status = check.status === 'ok' ? chalk.green('OK') :
                      check.status === 'warning' ? chalk.yellow('WARNING') : chalk.red('FAILED');
        console.log(`${icon} ${check.name}: ${status}${check.message ? ` (${check.message})` : ''}`);
      }
      
      console.log('─'.repeat(60));
    });
}
